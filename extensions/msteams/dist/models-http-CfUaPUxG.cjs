require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
const require_http_utils = require("./http-utils-C_86u7P2.cjs");
//#region src/gateway/models-http.ts
function toOpenAiModel(id) {
	return {
		id,
		object: "model",
		created: 0,
		owned_by: "@gabrielvfonseca/operator",
		permission: []
	};
}
async function authorizeRequest(req, res, opts) {
	return await require_http_auth_utils.authorizeGatewayHttpRequestOrReply({
		req,
		res,
		auth: opts.auth,
		trustedProxies: opts.trustedProxies,
		allowRealIpFallback: opts.allowRealIpFallback,
		rateLimiter: opts.rateLimiter
	});
}
function loadAgentModelIds() {
	const cfg = require_io.getRuntimeConfig();
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const ids = /* @__PURE__ */ new Set([require_http_utils.OPERATOR_MODEL_ID, require_http_utils.OPERATOR_DEFAULT_MODEL_ID]);
	ids.add(`openclaw/${defaultAgentId}`);
	for (const agentId of require_agent_scope_config.listAgentIds(cfg)) ids.add(`openclaw/${agentId}`);
	return Array.from(ids);
}
function resolveRequestPath(req) {
	return new URL(req.url ?? "/", "http://localhost").pathname;
}
/** Handle OpenAI-compatible model list/detail requests, returning false for unrelated paths. */
async function handleOpenAiModelsHttpRequest(req, res, opts) {
	const requestPath = resolveRequestPath(req);
	if (requestPath !== "/v1/models" && !requestPath.startsWith("/v1/models/")) return false;
	if (req.method !== "GET") {
		require_http_common.sendMethodNotAllowed(res, "GET");
		return true;
	}
	const requestAuth = await authorizeRequest(req, res, opts);
	if (!requestAuth) return true;
	const scopeAuth = require_method_scopes.authorizeOperatorScopesForMethod("models.list", require_http_auth_utils.resolveOpenAiCompatibleHttpOperatorScopes(req, requestAuth));
	if (!scopeAuth.allowed) {
		require_http_common.sendMissingScopeForbidden(res, scopeAuth.missingScope);
		return true;
	}
	const ids = loadAgentModelIds();
	if (requestPath === "/v1/models") {
		require_http_common.sendJson(res, 200, {
			object: "list",
			data: ids.map(toOpenAiModel)
		});
		return true;
	}
	const encodedId = requestPath.slice(11);
	if (!encodedId) {
		require_http_common.sendInvalidRequest(res, "Missing model id.");
		return true;
	}
	let decodedId;
	try {
		decodedId = decodeURIComponent(encodedId);
	} catch {
		require_http_common.sendInvalidRequest(res, "Invalid model id encoding.");
		return true;
	}
	if (decodedId !== "@gabrielvfonseca/operator" && !require_http_utils.resolveAgentIdFromModel(decodedId)) {
		require_http_common.sendInvalidRequest(res, "Invalid model id.");
		return true;
	}
	if (!ids.includes(decodedId)) {
		require_http_common.sendJson(res, 404, { error: {
			message: `Model '${decodedId}' not found.`,
			type: "invalid_request_error"
		} });
		return true;
	}
	require_http_common.sendJson(res, 200, toOpenAiModel(decodedId));
	return true;
}
//#endregion
exports.handleOpenAiModelsHttpRequest = handleOpenAiModelsHttpRequest;
