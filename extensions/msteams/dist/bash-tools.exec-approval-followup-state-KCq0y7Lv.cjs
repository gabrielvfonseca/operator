let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/agents/bash-tools.exec-approval-followup-state.ts
/**
* Runtime handoff state for exec approval follow-up turns.
* Stores short-lived elevated defaults so an approved async exec can resume in
* the same session without persisting approval capabilities.
*/
const EXEC_APPROVAL_FOLLOWUP_IDEMPOTENCY_PREFIX = "exec-approval-followup:";
const EXEC_APPROVAL_FOLLOWUP_IDEMPOTENCY_NONCE_MARKER = ":nonce:";
const EXEC_APPROVAL_FOLLOWUP_RUNTIME_HANDOFF_TTL_MS = 300 * 1e3;
const execApprovalFollowupRuntimeHandoffs = /* @__PURE__ */ new Map();
function cloneExecElevatedDefaults(value) {
	return {
		enabled: value.enabled,
		allowed: value.allowed,
		defaultLevel: value.defaultLevel,
		...value.fullAccessAvailable !== void 0 ? { fullAccessAvailable: value.fullAccessAvailable } : {},
		...value.fullAccessBlockedReason !== void 0 ? { fullAccessBlockedReason: value.fullAccessBlockedReason } : {}
	};
}
function cloneExecApprovalFollowupRuntimeHandoff(value) {
	return {
		kind: value.kind,
		approvalId: value.approvalId,
		sessionKey: value.sessionKey,
		idempotencyKey: value.idempotencyKey,
		bashElevated: cloneExecElevatedDefaults(value.bashElevated)
	};
}
function pruneExpiredExecApprovalFollowupRuntimeHandoffs(nowMs) {
	for (const [handoffId, entry] of execApprovalFollowupRuntimeHandoffs) if (!(0, _gabrielvfonseca_normalization_core_number_coercion.isFutureDateTimestampMs)(entry.expiresAtMs, { nowMs })) execApprovalFollowupRuntimeHandoffs.delete(handoffId);
}
/** Build the idempotency key used for an exec approval follow-up. */
function buildExecApprovalFollowupIdempotencyKey(params) {
	const base = `${EXEC_APPROVAL_FOLLOWUP_IDEMPOTENCY_PREFIX}${params.approvalId}`;
	const nonce = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.nonce);
	return nonce ? `${base}${EXEC_APPROVAL_FOLLOWUP_IDEMPOTENCY_NONCE_MARKER}${nonce}` : base;
}
/** Parse the approval id embedded in a follow-up idempotency key. */
function parseExecApprovalFollowupApprovalId(idempotencyKey) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(idempotencyKey);
	if (!normalized?.startsWith(EXEC_APPROVAL_FOLLOWUP_IDEMPOTENCY_PREFIX)) return;
	const body = normalized.slice(23);
	const nonceMarker = body.lastIndexOf(EXEC_APPROVAL_FOLLOWUP_IDEMPOTENCY_NONCE_MARKER);
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(nonceMarker >= 0 ? body.slice(0, nonceMarker) : body);
}
/** Register a short-lived exec approval handoff for the next follow-up turn. */
function registerExecApprovalFollowupRuntimeHandoff(params) {
	const approvalId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.approvalId);
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	if (!approvalId || !sessionKey || !params.bashElevated) return;
	const nowMs = params.nowMs ?? Date.now();
	pruneExpiredExecApprovalFollowupRuntimeHandoffs(nowMs);
	const expiresAtMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(EXEC_APPROVAL_FOLLOWUP_RUNTIME_HANDOFF_TTL_MS, { nowMs });
	if (expiresAtMs === void 0) return;
	const handoffId = (0, node_crypto.randomUUID)();
	const idempotencyKey = buildExecApprovalFollowupIdempotencyKey({
		approvalId,
		nonce: (0, node_crypto.randomUUID)()
	});
	execApprovalFollowupRuntimeHandoffs.set(handoffId, {
		kind: "exec-approval-followup",
		approvalId,
		sessionKey,
		idempotencyKey,
		bashElevated: cloneExecElevatedDefaults(params.bashElevated),
		expiresAtMs
	});
	return {
		handoffId,
		idempotencyKey
	};
}
/** Consume a matching handoff once, validating approval/session/idempotency data. */
function consumeExecApprovalFollowupRuntimeHandoff(params) {
	const handoffId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.handoffId);
	const approvalId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.approvalId);
	const idempotencyKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.idempotencyKey);
	if (!handoffId || !approvalId || !idempotencyKey) return;
	const nowMs = params.nowMs ?? Date.now();
	pruneExpiredExecApprovalFollowupRuntimeHandoffs(nowMs);
	const entry = execApprovalFollowupRuntimeHandoffs.get(handoffId);
	if (!entry) return;
	if (!(0, _gabrielvfonseca_normalization_core_number_coercion.isFutureDateTimestampMs)(entry.expiresAtMs, { nowMs })) {
		execApprovalFollowupRuntimeHandoffs.delete(handoffId);
		return;
	}
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	if (entry.approvalId !== approvalId || entry.idempotencyKey !== idempotencyKey || entry.sessionKey !== sessionKey) return;
	execApprovalFollowupRuntimeHandoffs.delete(handoffId);
	return cloneExecApprovalFollowupRuntimeHandoff(entry);
}
/**
* A persisted exec-approval followup is stale when the session key it targeted
* has since been rebound to a different session id (via `/new` or `/reset`).
* Delivering it would leak the old approval result into the new session, so the
* gateway drops the followup instead of resuming the rebound session.
*/
function isExecApprovalFollowupSessionRebound(params) {
	const expected = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.expectedSessionId);
	const resolved = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.resolvedSessionId);
	return Boolean(expected && resolved && expected !== resolved);
}
//#endregion
Object.defineProperty(exports, "buildExecApprovalFollowupIdempotencyKey", {
	enumerable: true,
	get: function() {
		return buildExecApprovalFollowupIdempotencyKey;
	}
});
Object.defineProperty(exports, "consumeExecApprovalFollowupRuntimeHandoff", {
	enumerable: true,
	get: function() {
		return consumeExecApprovalFollowupRuntimeHandoff;
	}
});
Object.defineProperty(exports, "isExecApprovalFollowupSessionRebound", {
	enumerable: true,
	get: function() {
		return isExecApprovalFollowupSessionRebound;
	}
});
Object.defineProperty(exports, "parseExecApprovalFollowupApprovalId", {
	enumerable: true,
	get: function() {
		return parseExecApprovalFollowupApprovalId;
	}
});
Object.defineProperty(exports, "registerExecApprovalFollowupRuntimeHandoff", {
	enumerable: true,
	get: function() {
		return registerExecApprovalFollowupRuntimeHandoff;
	}
});
