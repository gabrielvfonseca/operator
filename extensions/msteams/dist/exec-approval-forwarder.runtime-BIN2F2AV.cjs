require("./rolldown-runtime-u92d-OFm.cjs");
require("./account-id-Di7YWYh4.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_runtime = require("./runtime-CIO0BRex.cjs");
require("./message-channel-jMzaqV09.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
require("./store-DCwJguwr.cjs");
const require_targets_session = require("./targets-session-Dms1suLE.cjs");
require("./targets-BfrPEAMP.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/approval-request-account-binding.ts
/** Loads the persisted session entry referenced by an approval request, if still present. */
function resolvePersistedApprovalRequestSessionEntry(params) {
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.request.request.sessionKey);
	if (!sessionKey) return null;
	const agentId = require_session_key.parseAgentSessionKey(sessionKey)?.agentId ?? params.request.request.agentId ?? "main";
	const entry = require_session_accessor.loadSessionEntry({
		storePath: require_paths.resolveStorePath(params.cfg.session?.store, { agentId }),
		sessionKey,
		clone: false
	});
	if (!entry) return null;
	return {
		sessionKey,
		entry
	};
}
//#endregion
//#region src/infra/exec-approval-session-target.ts
function normalizeOptionalThreadValue(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : void 0;
	if (typeof value !== "string") return;
	const normalized = value.trim();
	return normalized ? normalized : void 0;
}
/** Resolves the best known message target for an exec approval request. */
function resolveExecApprovalSessionTarget(params) {
	if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.request.request.sessionKey)) return null;
	const persisted = resolvePersistedApprovalRequestSessionEntry({
		cfg: params.cfg,
		request: params.request
	});
	if (!persisted) return null;
	const target = require_targets_session.resolveSessionDeliveryTarget({
		entry: persisted.entry,
		requestedChannel: "last",
		turnSourceChannel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.turnSourceChannel),
		turnSourceTo: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.turnSourceTo),
		turnSourceAccountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.turnSourceAccountId),
		turnSourceThreadId: normalizeOptionalThreadValue(params.turnSourceThreadId)
	});
	if (!target.to) return null;
	return {
		channel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(target.channel),
		to: target.to,
		accountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(target.accountId),
		threadId: normalizeOptionalThreadValue(target.threadId)
	};
}
//#endregion
exports.resolveExecApprovalSessionTarget = resolveExecApprovalSessionTarget;
exports.sendDurableMessageBatch = require_runtime.sendDurableMessageBatch;
