require("./rolldown-runtime-u92d-OFm.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
const require_node_command_policy = require("./node-command-policy-DFyVSMm6.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_base_hash = require("./base-hash-CZrec982.cjs");
const require_nodes_helpers = require("./nodes.helpers-SXr8Ur2w.cjs");
//#region src/gateway/server-methods/exec-approvals.ts
function requireApprovalsBaseHash(params, snapshot, respond) {
	const baseHash = require_base_hash.resolveBaseHashParam(params);
	if (!snapshot.exists) {
		if (baseHash && baseHash !== snapshot.hash) {
			respondApprovalsChanged(respond);
			return false;
		}
		return true;
	}
	if (!snapshot.hash) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "exec approvals base hash unavailable; re-run exec.approvals.get and retry"));
		return false;
	}
	if (!baseHash) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "exec approvals base hash required; re-run exec.approvals.get and retry"));
		return false;
	}
	if (baseHash !== snapshot.hash) {
		respondApprovalsChanged(respond);
		return false;
	}
	return true;
}
function respondApprovalsChanged(respond) {
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "exec approvals changed since last load; re-run exec.approvals.get and retry"));
}
function redactExecApprovals(file) {
	const socketPath = file.socket?.path?.trim();
	return {
		...file,
		socket: socketPath ? { path: socketPath } : void 0
	};
}
function toExecApprovalsPayload(snapshot) {
	return {
		path: snapshot.path,
		exists: snapshot.exists,
		hash: snapshot.hash,
		file: redactExecApprovals(snapshot.file)
	};
}
function isMacAppNode(session) {
	const platform = session?.platform?.trim().toLowerCase();
	return session?.clientId === require_client_info.GATEWAY_CLIENT_IDS.MACOS_APP && session.clientMode === require_client_info.GATEWAY_CLIENT_MODES.NODE && (platform === "macos" || platform?.startsWith("macos ") === true);
}
async function respondWithExecApprovalsNodePayload(params) {
	const rawParams = params.rawParams;
	if (!require_validation.assertValidParams(rawParams, params.validate, params.method, params.respond)) return;
	const parsedParams = rawParams;
	const nodeId = parsedParams.nodeId.trim();
	if (!nodeId) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "nodeId required"));
		return;
	}
	const nodeSession = params.context.nodeRegistry.get(nodeId);
	if (nodeSession) {
		const allowed = require_node_command_policy.isNodeCommandAllowed({
			command: params.command,
			declaredCommands: nodeSession.commands,
			allowlist: require_node_command_policy.resolveNodeCommandAllowlist(params.context.getRuntimeConfig(), {
				...nodeSession,
				approvedCommands: nodeSession.commands
			})
		});
		if (!allowed.ok) {
			params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `node command not allowed: ${params.command} (${allowed.reason})`, { details: {
				command: params.command,
				reason: allowed.reason
			} }));
			return;
		}
	}
	await require_nodes_helpers.respondUnavailableOnThrow(params.respond, async () => {
		const res = await params.context.nodeRegistry.invoke({
			nodeId,
			command: params.command,
			params: params.commandParams(parsedParams, nodeSession)
		});
		if (!require_nodes_helpers.respondUnavailableOnNodeInvokeError(params.respond, res)) return;
		const payload = params.readPayload(res);
		if (params.validatePayload && !params.validatePayload(payload)) {
			params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "node returned invalid exec approvals payload"));
			return;
		}
		params.respond(true, payload, void 0);
	});
}
const execApprovalsHandlers = {
	"exec.approvals.get": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validateExecApprovalsGetParams, "exec.approvals.get", respond)) return;
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			respond(true, toExecApprovalsPayload(await require_exec_approvals.ensureExecApprovalsSnapshot()), void 0);
		});
	},
	"exec.approvals.set": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validateExecApprovalsSetParams, "exec.approvals.set", respond)) return;
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const snapshot = require_exec_approvals.readExecApprovalsSnapshot();
			if (!requireApprovalsBaseHash(params, snapshot, respond)) return;
			const incoming = params.file;
			if (!incoming || typeof incoming !== "object") {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "exec approvals file is required"));
				return;
			}
			const normalized = require_exec_approvals.normalizeExecApprovals(incoming);
			const nextSnapshot = await require_exec_approvals.updateExecApprovals({
				baseHash: snapshot.hash,
				update: (current) => require_exec_approvals.mergeExecApprovalsSocketDefaults({
					normalized,
					current
				})
			});
			if (!nextSnapshot) {
				respondApprovalsChanged(respond);
				return;
			}
			respond(true, toExecApprovalsPayload(nextSnapshot), void 0);
		});
	},
	"exec.approvals.node.get": async ({ params, respond, context }) => {
		await respondWithExecApprovalsNodePayload({
			method: "exec.approvals.node.get",
			rawParams: params,
			validate: require_src.validateExecApprovalsNodeGetParams,
			context,
			respond,
			command: "system.execApprovals.get",
			commandParams: (_parsedParams, nodeSession) => isMacAppNode(nodeSession) ? { includeResolvedDefaults: true } : {},
			readPayload: (res) => res.payloadJSON ? require_nodes_helpers.safeParseJson(res.payloadJSON) : res.payload,
			validatePayload: require_src.validateExecApprovalsNodeSnapshot
		});
	},
	"exec.approvals.node.set": async ({ params, respond, context }) => {
		await respondWithExecApprovalsNodePayload({
			method: "exec.approvals.node.set",
			rawParams: params,
			validate: require_src.validateExecApprovalsNodeSetParams,
			context,
			respond,
			command: "system.execApprovals.set",
			commandParams: (parsedParams) => "native" in parsedParams ? {
				...parsedParams.native,
				baseHash: parsedParams.baseHash
			} : {
				file: parsedParams.file,
				baseHash: parsedParams.baseHash
			},
			readPayload: (res) => res.payloadJSON ? require_nodes_helpers.safeParseJson(res.payloadJSON) : res.payload
		});
	}
};
//#endregion
exports.execApprovalsHandlers = execApprovalsHandlers;
