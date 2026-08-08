require("./rolldown-runtime-u92d-OFm.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_store = require("./store-DCwJguwr.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_mcp_http_loopback_runtime = require("./mcp-http.loopback-runtime-CtJBYKwk.cjs");
const require_mcp_grant_store = require("./mcp-grant-store-DElX7XIk.cjs");
const require_mcp_http = require("./mcp-http-BGcBda9b.cjs");
//#region src/gateway/server-methods/attach.ts
function paramRecord(params) {
	return params && typeof params === "object" ? params : {};
}
function readString(params, key) {
	const value = params[key];
	return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function readPositiveNumber(params, key) {
	const value = params[key];
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
}
const attachHandlers = {
	"attach.grant": async ({ params, respond, context }) => {
		const grantParams = paramRecord(params);
		const cfg = context.getRuntimeConfig();
		const sessionKey = readString(grantParams, "sessionKey") ?? require_main_session.resolveMainSessionKey(cfg);
		const harnessEntry = require_store.isAgentHarnessSessionKey(sessionKey) ? require_session_accessor.resolveSessionEntryAccessTarget({
			cfg,
			sessionKey
		}).entry : void 0;
		if (require_store.isAgentHarnessSessionKey(sessionKey) && (!harnessEntry || require_store.isAgentHarnessSessionStoreEntryProtected(sessionKey, harnessEntry))) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, require_store.AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE));
			return;
		}
		await require_mcp_http.ensureMcpLoopbackServer();
		const runtime = require_mcp_http_loopback_runtime.getActiveMcpLoopbackRuntime();
		if (!runtime) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "mcp loopback server unavailable"));
			return;
		}
		const grant = require_mcp_grant_store.mintAttachGrant({
			sessionKey,
			ttlMs: readPositiveNumber(grantParams, "ttlMs")
		});
		respond(true, {
			sessionKey: grant.sessionKey,
			token: grant.token,
			expiresAtMs: grant.expiresAtMs,
			mcpConfig: require_mcp_http_loopback_runtime.createMcpAttachGrantServerConfig(runtime.port),
			env: { OPERATOR_MCP_TOKEN: grant.token }
		});
	},
	"attach.revoke": async ({ params, respond }) => {
		const token = readString(paramRecord(params), "token");
		if (!token) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "token is required"));
			return;
		}
		respond(true, { revoked: require_mcp_grant_store.revokeAttachGrant(token) });
	}
};
//#endregion
exports.attachHandlers = attachHandlers;
