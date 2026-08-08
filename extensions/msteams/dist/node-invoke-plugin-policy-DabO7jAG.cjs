const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_plugin_approvals = require("./plugin-approvals-D_TcNjGk.cjs");
const require_node_command_policy = require("./node-command-policy-DFyVSMm6.cjs");
const require_approval_shared = require("./approval-shared-D5AOJ_EJ.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/gateway/node-invoke-plugin-policy.ts
function parseScopes(client) {
	return Array.isArray(client?.connect?.scopes) ? client.connect.scopes.filter((scope) => typeof scope === "string") : [];
}
function parsePayload(payloadJSON, payload) {
	if (!payloadJSON) return payload;
	try {
		return JSON.parse(payloadJSON);
	} catch {
		return payload;
	}
}
function normalizeRouteThreadId(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? null;
}
function resolveNodeInvokeTurnSourceFields(turnSource) {
	return {
		turnSourceChannel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(turnSource?.channel) ?? null,
		turnSourceTo: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(turnSource?.to) ?? null,
		turnSourceAccountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(turnSource?.accountId) ?? null,
		turnSourceThreadId: normalizeRouteThreadId(turnSource?.threadId)
	};
}
function findDangerousPluginNodeCommand(registry, command) {
	const normalizedCommand = command.trim();
	if (!normalizedCommand) return null;
	return registry?.nodeHostCommands?.find((entry) => entry.command.dangerous === true && entry.command.command.trim() === normalizedCommand) ?? null;
}
function createApprovalRuntime(params) {
	const manager = params.context.pluginApprovalManager;
	if (!manager) return;
	return { async request(input) {
		const timeoutMs = require_plugin_approvals.resolvePluginApprovalTimeoutMs(input.timeoutMs);
		const turnSource = resolveNodeInvokeTurnSourceFields(params.turnSource);
		const callerIdentity = params.client?.internal?.agentRuntimeIdentity;
		const request = {
			pluginId: params.pluginId,
			title: (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(input.title, 80),
			description: (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(input.description, 256),
			severity: input.severity ?? "warning",
			toolName: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.toolName) ?? null,
			toolCallId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.toolCallId) ?? null,
			agentId: callerIdentity?.agentId ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.agentId) ?? null,
			sessionKey: callerIdentity?.sessionKey ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.sessionKey) ?? null,
			turnSourceChannel: turnSource.turnSourceChannel,
			turnSourceTo: turnSource.turnSourceTo,
			turnSourceAccountId: turnSource.turnSourceAccountId,
			turnSourceThreadId: turnSource.turnSourceThreadId
		};
		const record = manager.create(request, timeoutMs, `plugin:${(0, node_crypto.randomUUID)()}`);
		require_approval_shared.bindApprovalRequesterMetadata({
			record,
			client: params.client
		});
		const respond = () => {};
		const decisionPromise = manager.register(record, timeoutMs);
		const requestEvent = require_approval_shared.buildRequestedApprovalEvent(record);
		await require_approval_shared.handlePendingApprovalRequest({
			manager,
			record,
			decisionPromise,
			respond,
			context: params.context,
			clientConnId: params.client?.connId,
			requestEventName: "plugin.approval.requested",
			requestEvent,
			twoPhase: false,
			approvalKind: "plugin",
			deliverRequest: () => {
				const deliveryTasks = [];
				const forward = params.context.forwardPluginApprovalRequest;
				if (forward) deliveryTasks.push(forward(requestEvent).catch((err) => {
					params.context.logGateway?.error?.(`plugin approvals: forward node policy request failed: ${String(err)}`);
					return false;
				}));
				const iosPushDelivery = params.context.pluginApprovalIosPushDelivery;
				if (iosPushDelivery?.handleRequested) deliveryTasks.push(iosPushDelivery.handleRequested(requestEvent, { isTargetVisible: (target) => require_approval_shared.isApprovalRecordVisibleToClient({
					record,
					client: { connect: {
						client: { id: require_client_info.GATEWAY_CLIENT_IDS.IOS_APP },
						device: { id: target.deviceId },
						scopes: [...target.scopes]
					} }
				}) }).catch((err) => {
					params.context.logGateway?.error?.(`plugin approvals: iOS push node policy request failed: ${String(err)}`);
					return false;
				}));
				if (deliveryTasks.length === 0) return false;
				return (async () => {
					let delivered = false;
					for (const task of deliveryTasks) delivered = await task || delivered;
					return delivered;
				})();
			},
			afterDecision: async (decision) => {
				if (decision === null) await params.context.pluginApprovalIosPushDelivery?.handleExpired?.(requestEvent);
			},
			afterDecisionErrorLabel: "plugin approvals: iOS push node policy expire failed"
		});
		const decision = await decisionPromise;
		if (decision === "allow-once" && !manager.consumeAllowOnce(record.id, `plugin.node.invoke:${record.id}`)) return {
			id: record.id,
			decision: null
		};
		return {
			id: record.id,
			decision
		};
	} };
}
/** Applies the registered plugin policy for a node.invoke command, if one exists. */
async function applyPluginNodeInvokePolicy(params) {
	const registry = require_runtime.getActivePluginGatewayNodePolicyRegistry();
	const trustedTurnSource = params.client?.internal?.agentRuntimeIdentity ? params.turnSource : void 0;
	const entry = registry?.nodeInvokePolicies?.find((candidate) => candidate.policy.commands.includes(params.command));
	if (!entry) {
		const dangerousCommand = findDangerousPluginNodeCommand(registry, params.command);
		if (dangerousCommand) return {
			ok: false,
			code: "PLUGIN_POLICY_MISSING",
			message: `node.invoke ${params.command} is registered as dangerous by plugin ${dangerousCommand.pluginId} but has no plugin node.invoke policy`,
			details: { nodeCommandDispatched: false }
		};
		return null;
	}
	let nodeCommandDispatched = false;
	const invokeNode = async (override = {}) => {
		const currentNode = params.context.nodeRegistry.get(params.nodeSession.nodeId);
		if (!currentNode || currentNode.connId !== params.nodeSession.connId) return {
			ok: false,
			code: "ROUTE_CHANGED",
			message: "node connection changed before dispatch"
		};
		const allowlist = require_node_command_policy.resolveNodeCommandAllowlist(params.context.getRuntimeConfig(), {
			...currentNode,
			approvedCommands: currentNode.commands
		});
		const allowed = require_node_command_policy.isNodeCommandAllowed({
			command: params.command,
			declaredCommands: currentNode.commands,
			allowlist
		});
		if (!allowed.ok) return {
			ok: false,
			code: "NODE_COMMAND_REVOKED",
			message: `node command not allowed at dispatch: ${allowed.reason}`,
			details: {
				command: params.command,
				reason: allowed.reason
			}
		};
		nodeCommandDispatched = true;
		const res = await params.context.nodeRegistry.invoke({
			nodeId: params.nodeSession.nodeId,
			expectedConnId: params.nodeSession.connId,
			command: params.command,
			params: override.params ?? params.params,
			timeoutMs: override.timeoutMs ?? params.timeoutMs,
			idempotencyKey: override.idempotencyKey ?? params.idempotencyKey
		});
		if (!res.ok) return {
			ok: false,
			code: res.error?.code,
			message: res.error?.message ?? "node command failed",
			details: { nodeError: res.error ?? null }
		};
		return {
			ok: true,
			payload: parsePayload(res.payloadJSON, res.payload),
			payloadJSON: res.payloadJSON ?? null
		};
	};
	const result = await entry.policy.handle({
		nodeId: params.nodeSession.nodeId,
		command: params.command,
		params: params.params,
		timeoutMs: params.timeoutMs,
		idempotencyKey: params.idempotencyKey,
		config: params.context.getRuntimeConfig(),
		pluginConfig: entry.pluginConfig,
		node: {
			nodeId: params.nodeSession.nodeId,
			displayName: params.nodeSession.displayName,
			platform: params.nodeSession.platform,
			deviceFamily: params.nodeSession.deviceFamily,
			commands: params.nodeSession.commands
		},
		client: params.client ? {
			connId: params.client.connId,
			scopes: parseScopes(params.client)
		} : null,
		approvals: createApprovalRuntime({
			context: params.context,
			client: params.client,
			pluginId: entry.pluginId,
			turnSource: trustedTurnSource
		}),
		invokeNode
	});
	if (result.ok) return result;
	return {
		...result,
		details: {
			...result.details,
			nodeCommandDispatched
		}
	};
}
//#endregion
Object.defineProperty(exports, "applyPluginNodeInvokePolicy", {
	enumerable: true,
	get: function() {
		return applyPluginNodeInvokePolicy;
	}
});
