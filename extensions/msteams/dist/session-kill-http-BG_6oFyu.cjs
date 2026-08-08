require("./rolldown-runtime-u92d-OFm.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_subagent_control = require("./subagent-control-qMe-_eoQ.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
require("./http-utils-C_86u7P2.cjs");
//#region src/gateway/session-kill-http.ts
function resolveSessionKeyFromPath(pathname) {
	const match = pathname.match(/^\/sessions\/([^/]+)\/kill$/);
	if (!match) return { matched: false };
	try {
		const decoded = decodeURIComponent(match[1] ?? "").trim();
		if (!decoded) return {
			error: "invalid-session-key",
			matched: true
		};
		return {
			matched: true,
			sessionKey: decoded
		};
	} catch {
		return {
			error: "invalid-session-key",
			matched: true
		};
	}
}
async function handleSessionKillHttpRequest(req, res, opts) {
	const cfg = require_io.getRuntimeConfig();
	const sessionKeyResolution = resolveSessionKeyFromPath(new URL(req.url ?? "/", "http://localhost").pathname);
	if (!sessionKeyResolution.matched) return false;
	if ("error" in sessionKeyResolution) {
		require_http_common.sendInvalidRequest(res, "invalid session key");
		return true;
	}
	const { sessionKey } = sessionKeyResolution;
	if (req.method !== "POST") {
		require_http_common.sendMethodNotAllowed(res, "POST");
		return true;
	}
	const requestAuth = await require_http_auth_utils.authorizeGatewayHttpRequestOrReply({
		req,
		res,
		auth: opts.auth,
		trustedProxies: opts.trustedProxies ?? cfg.gateway?.trustedProxies,
		allowRealIpFallback: opts.allowRealIpFallback ?? cfg.gateway?.allowRealIpFallback,
		rateLimiter: opts.rateLimiter
	});
	if (!requestAuth) return true;
	const scopeAuth = require_method_scopes.authorizeOperatorScopesForRequiredScope(require_operator_scopes.ADMIN_SCOPE, require_http_auth_utils.resolveTrustedHttpOperatorScopes(req, requestAuth));
	if (!scopeAuth.allowed) {
		require_http_common.sendMissingScopeForbidden(res, scopeAuth.missingScope);
		return true;
	}
	const { entry, canonicalKey } = require_session_utils.loadSessionEntry(sessionKey);
	if (!entry) {
		require_http_common.sendJson(res, 404, {
			ok: false,
			error: {
				type: "not_found",
				message: `Session not found: ${sessionKey}`
			}
		});
		return true;
	}
	require_http_common.sendJson(res, 200, {
		ok: true,
		killed: (await require_subagent_control.killSubagentRunAdmin({
			cfg,
			sessionKey: canonicalKey
		})).killed
	});
	return true;
}
//#endregion
exports.handleSessionKillHttpRequest = handleSessionKillHttpRequest;
