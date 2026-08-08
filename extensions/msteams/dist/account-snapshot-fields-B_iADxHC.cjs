require("./utils-CXqBhRFw.cjs");
const require_boolean = require("./boolean-DrgQ-UMw.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_net_policy_redact_sensitive_url = require("@gabrielvfonseca/net-policy/redact-sensitive-url");
let _gabrielvfonseca_net_policy_url_userinfo = require("@gabrielvfonseca/net-policy/url-userinfo");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/channels/account-snapshot-fields.ts
/**
* Status-safe channel account projection helpers for CLI, status APIs, and plugin SDK callers.
* This file is the redaction boundary between runtime account objects and public snapshots.
*/
const CREDENTIAL_STATUS_KEYS = [
	"tokenStatus",
	"botTokenStatus",
	"appTokenStatus",
	"signingSecretStatus",
	"userTokenStatus"
];
/** Redacts a plugin-provided base URL after status hooks have produced their final record. */
function redactChannelStatusSummaryBaseUrl(summary) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(summary) || typeof summary.baseUrl !== "string" || !summary.baseUrl) return summary;
	const redactedBaseUrl = (0, _gabrielvfonseca_net_policy_url_userinfo.stripUrlUserInfo)((0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(summary.baseUrl));
	return redactedBaseUrl === summary.baseUrl ? summary : {
		...summary,
		baseUrl: redactedBaseUrl
	};
}
/** Redacts a plugin-provided base URL at the public account-snapshot boundary. */
function redactChannelAccountSnapshotBaseUrl(snapshot) {
	return redactChannelStatusSummaryBaseUrl(snapshot);
}
function readBoolean(record, key) {
	return require_boolean.asBoolean(record[key]);
}
function readNumber(record, key) {
	const value = record[key];
	return (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(value);
}
function readNullableNumber(record, key) {
	if (record[key] === null) return null;
	return readNumber(record, key);
}
function readStringArray(record, key) {
	const value = record[key];
	if (!Array.isArray(value)) return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(value.map((entry) => typeof entry === "string" || typeof entry === "number" ? entry : ""));
	return normalized.length > 0 ? normalized : void 0;
}
function readCredentialStatus(record, key) {
	const value = record[key];
	return value === "available" || value === "configured_unavailable" || value === "missing" ? value : void 0;
}
/** Returns true when a credential exists but cannot be resolved at status-render time. */
function hasConfiguredUnavailableCredentialStatus(account) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(account) ? account : null;
	if (!record) return false;
	return CREDENTIAL_STATUS_KEYS.some((key) => readCredentialStatus(record, key) === "configured_unavailable");
}
/** Returns true when account data contains a resolved credential value or available status. */
function hasResolvedCredentialValue(account) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(account) ? account : null;
	if (!record) return false;
	return [
		"token",
		"botToken",
		"appToken",
		"signingSecret",
		"userToken"
	].some((key) => {
		return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record[key]) !== void 0;
	}) || CREDENTIAL_STATUS_KEYS.some((key) => readCredentialStatus(record, key) === "available");
}
/** Projects credential source/status metadata while omitting raw credential values. */
function projectCredentialSnapshotFields(account) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(account) ? account : null;
	if (!record) return {};
	const tokenSource = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.tokenSource);
	const botTokenSource = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.botTokenSource);
	const appTokenSource = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.appTokenSource);
	const signingSecretSource = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.signingSecretSource);
	return {
		...tokenSource ? { tokenSource } : {},
		...botTokenSource ? { botTokenSource } : {},
		...appTokenSource ? { appTokenSource } : {},
		...signingSecretSource ? { signingSecretSource } : {},
		...readCredentialStatus(record, "tokenStatus") ? { tokenStatus: readCredentialStatus(record, "tokenStatus") } : {},
		...readCredentialStatus(record, "botTokenStatus") ? { botTokenStatus: readCredentialStatus(record, "botTokenStatus") } : {},
		...readCredentialStatus(record, "appTokenStatus") ? { appTokenStatus: readCredentialStatus(record, "appTokenStatus") } : {},
		...readCredentialStatus(record, "signingSecretStatus") ? { signingSecretStatus: readCredentialStatus(record, "signingSecretStatus") } : {},
		...readCredentialStatus(record, "userTokenStatus") ? { userTokenStatus: readCredentialStatus(record, "userTokenStatus") } : {}
	};
}
/**
* Projects status-safe account fields for read-only channel/account snapshots.
*
* This is the boundary between runtime account objects and status renderers; keep it explicit so
* new channel fields do not accidentally expose webhook URLs, public keys, or raw credentials.
*/
function projectSafeChannelAccountSnapshotFields(account) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(account) ? account : null;
	if (!record) return {};
	const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.name);
	const statusState = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.statusState);
	const healthState = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.healthState);
	const mode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.mode);
	const dmPolicy = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.dmPolicy);
	const baseUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.baseUrl);
	const cliPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.cliPath);
	const dbPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.dbPath);
	return {
		...name ? { name } : {},
		...readBoolean(record, "linked") !== void 0 ? { linked: readBoolean(record, "linked") } : {},
		...readBoolean(record, "running") !== void 0 ? { running: readBoolean(record, "running") } : {},
		...readBoolean(record, "connected") !== void 0 ? { connected: readBoolean(record, "connected") } : {},
		...readBoolean(record, "restartPending") !== void 0 ? { restartPending: readBoolean(record, "restartPending") } : {},
		...readNumber(record, "reconnectAttempts") !== void 0 ? { reconnectAttempts: readNumber(record, "reconnectAttempts") } : {},
		...readNullableNumber(record, "lastConnectedAt") !== void 0 ? { lastConnectedAt: readNullableNumber(record, "lastConnectedAt") } : {},
		...readNumber(record, "lastInboundAt") !== void 0 ? { lastInboundAt: readNumber(record, "lastInboundAt") } : {},
		...readNullableNumber(record, "lastOutboundAt") !== void 0 ? { lastOutboundAt: readNullableNumber(record, "lastOutboundAt") } : {},
		...readNullableNumber(record, "lastMessageAt") !== void 0 ? { lastMessageAt: readNullableNumber(record, "lastMessageAt") } : {},
		...readNullableNumber(record, "lastEventAt") !== void 0 ? { lastEventAt: readNullableNumber(record, "lastEventAt") } : {},
		...readNumber(record, "lastTransportActivityAt") !== void 0 ? { lastTransportActivityAt: readNumber(record, "lastTransportActivityAt") } : {},
		...statusState ? { statusState } : {},
		...healthState ? { healthState } : {},
		...readBoolean(record, "terminalDisconnect") !== void 0 ? { terminalDisconnect: readBoolean(record, "terminalDisconnect") } : {},
		...readBoolean(record, "busy") !== void 0 ? { busy: readBoolean(record, "busy") } : {},
		...readNumber(record, "activeRuns") !== void 0 ? { activeRuns: readNumber(record, "activeRuns") } : {},
		...readNullableNumber(record, "lastRunActivityAt") !== void 0 ? { lastRunActivityAt: readNullableNumber(record, "lastRunActivityAt") } : {},
		...mode ? { mode } : {},
		...dmPolicy ? { dmPolicy } : {},
		...readStringArray(record, "allowFrom") ? { allowFrom: readStringArray(record, "allowFrom") } : {},
		...projectCredentialSnapshotFields(account),
		...baseUrl ? { baseUrl: (0, _gabrielvfonseca_net_policy_url_userinfo.stripUrlUserInfo)((0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(baseUrl)) } : {},
		...readBoolean(record, "allowUnmentionedGroups") !== void 0 ? { allowUnmentionedGroups: readBoolean(record, "allowUnmentionedGroups") } : {},
		...cliPath ? { cliPath } : {},
		...dbPath ? { dbPath } : {},
		...readNumber(record, "port") !== void 0 ? { port: readNumber(record, "port") } : {}
	};
}
//#endregion
Object.defineProperty(exports, "hasConfiguredUnavailableCredentialStatus", {
	enumerable: true,
	get: function() {
		return hasConfiguredUnavailableCredentialStatus;
	}
});
Object.defineProperty(exports, "hasResolvedCredentialValue", {
	enumerable: true,
	get: function() {
		return hasResolvedCredentialValue;
	}
});
Object.defineProperty(exports, "projectSafeChannelAccountSnapshotFields", {
	enumerable: true,
	get: function() {
		return projectSafeChannelAccountSnapshotFields;
	}
});
Object.defineProperty(exports, "redactChannelAccountSnapshotBaseUrl", {
	enumerable: true,
	get: function() {
		return redactChannelAccountSnapshotBaseUrl;
	}
});
Object.defineProperty(exports, "redactChannelStatusSummaryBaseUrl", {
	enumerable: true,
	get: function() {
		return redactChannelStatusSummaryBaseUrl;
	}
});
