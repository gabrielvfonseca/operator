require("./rolldown-runtime-u92d-OFm.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_plugin_approvals = require("./plugin-approvals-D_TcNjGk.cjs");
const require_plugin_approval_canonical_decisions = require("./plugin-approval-canonical-decisions-Bgs1VXWI.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_approval_shared = require("./approval-shared-D5AOJ_EJ.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/gateway/server-methods/plugin-approval.ts
/** Create plugin approval handlers backed by the shared approval manager. */
function createPluginApprovalHandlers(manager, opts) {
	return {
		"plugin.approval.list": async ({ respond, client }) => {
			respond(true, require_approval_shared.listVisiblePendingApprovalRequests({
				manager,
				client
			}), void 0);
		},
		"plugin.approval.request": async ({ params, client, respond, context }) => {
			if (!require_src.validatePluginApprovalRequestParams(params)) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid plugin.approval.request params: ${require_validation_errors.formatValidationErrors(require_src.validatePluginApprovalRequestParams.errors)}`));
				return;
			}
			const p = params;
			const twoPhase = p.twoPhase === true;
			const timeoutMs = require_plugin_approvals.resolvePluginApprovalTimeoutMs(p.timeoutMs);
			const normalizeTrimmedString = (value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) || null;
			const request = {
				pluginId: p.pluginId ?? null,
				title: p.title,
				description: p.description,
				severity: p.severity ?? null,
				toolName: p.toolName ?? null,
				toolCallId: p.toolCallId ?? null,
				...Array.isArray(p.allowedDecisions) ? { allowedDecisions: require_plugin_approval_canonical_decisions.resolveCanonicalPluginApprovalRequestAllowedDecisions({ allowedDecisions: p.allowedDecisions }) } : {},
				agentId: p.agentId ?? null,
				sessionKey: p.sessionKey ?? null,
				turnSourceChannel: normalizeTrimmedString(p.turnSourceChannel),
				turnSourceTo: normalizeTrimmedString(p.turnSourceTo),
				turnSourceAccountId: normalizeTrimmedString(p.turnSourceAccountId),
				turnSourceThreadId: p.turnSourceThreadId ?? null
			};
			const record = manager.create(request, timeoutMs, `plugin:${(0, node_crypto.randomUUID)()}`);
			require_approval_shared.bindApprovalRequesterMetadata({
				record,
				client
			});
			if (client?.internal?.approvalRuntime === true) require_approval_shared.bindApprovalReviewerDeviceIds({
				record,
				deviceIds: p.approvalReviewerDeviceIds
			});
			const decisionPromise = require_approval_shared.registerPendingApprovalRecord({
				manager,
				record,
				timeoutMs,
				respond,
				context
			});
			if (!decisionPromise) return;
			const requestEvent = require_approval_shared.buildRequestedApprovalEvent(record);
			await require_approval_shared.handlePendingApprovalRequest({
				manager,
				record,
				decisionPromise,
				respond,
				context,
				clientConnId: client?.connId,
				requestEventName: "plugin.approval.requested",
				requestEvent,
				twoPhase,
				approvalKind: "plugin",
				deliverRequest: () => {
					const deliveryTasks = [];
					if (opts?.forwarder?.handlePluginApprovalRequested) deliveryTasks.push(opts.forwarder.handlePluginApprovalRequested(requestEvent).catch((err) => {
						context.logGateway?.error?.(`plugin approvals: forward request failed: ${String(err)}`);
						return false;
					}));
					if (opts?.iosPushDelivery?.handleRequested) deliveryTasks.push(opts.iosPushDelivery.handleRequested(requestEvent, { isTargetVisible: (target) => require_approval_shared.isApprovalRecordVisibleToClient({
						record,
						client: { connect: {
							client: { id: require_client_info.GATEWAY_CLIENT_IDS.IOS_APP },
							device: { id: target.deviceId },
							scopes: [...target.scopes]
						} }
					}) }).catch((err) => {
						context.logGateway?.error?.(`plugin approvals: iOS push request failed: ${String(err)}`);
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
					if (decision === null) await opts?.iosPushDelivery?.handleExpired?.(requestEvent);
				},
				afterDecisionErrorLabel: "plugin approvals: iOS push expire failed"
			});
		},
		"plugin.approval.waitDecision": async ({ params, respond, client }) => {
			await require_approval_shared.handleApprovalWaitDecision({
				manager,
				inputId: params.id,
				client,
				respond
			});
		},
		"plugin.approval.resolve": async ({ params, respond, client, context }) => {
			const resolveParams = require_approval_shared.resolveApprovalDecisionParams({
				rawParams: params,
				validate: require_src.validatePluginApprovalResolveParams,
				methodName: "plugin.approval.resolve",
				respond
			});
			if (!resolveParams) return;
			const { inputId, decision } = resolveParams;
			await require_approval_shared.handleApprovalResolve({
				manager,
				inputId,
				decision,
				respond,
				context,
				client,
				exposeAmbiguousPrefixError: false,
				validateDecision: (snapshot) => require_plugin_approval_canonical_decisions.resolveCanonicalPluginApprovalRequestAllowedDecisions(snapshot.request).includes(decision) ? null : {
					message: `${decision} is unavailable for this plugin approval`,
					details: { allowedDecisions: require_plugin_approval_canonical_decisions.resolveCanonicalPluginApprovalRequestAllowedDecisions(snapshot.request) }
				},
				resolvedEventName: "plugin.approval.resolved",
				approvalKind: "plugin",
				buildResolvedEvent: ({ approvalId, decision: decisionLocal, resolvedBy, snapshot, nowMs }) => ({
					id: approvalId,
					decision: decisionLocal,
					resolvedBy,
					ts: nowMs,
					request: snapshot.request
				}),
				forwardResolved: (resolvedEvent) => opts?.forwarder?.handlePluginApprovalResolved?.(resolvedEvent),
				forwardResolvedErrorLabel: "plugin approvals: forward resolve failed",
				extraResolvedHandlers: opts?.iosPushDelivery?.handleResolved ? [{
					run: (resolvedEvent) => opts.iosPushDelivery.handleResolved(resolvedEvent),
					errorLabel: "plugin approvals: iOS push resolve failed"
				}] : void 0
			});
		}
	};
}
//#endregion
exports.createPluginApprovalHandlers = createPluginApprovalHandlers;
