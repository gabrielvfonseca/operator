const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_auth = require("./auth-DnGY7_cY.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/http-auth-utils.ts
var http_auth_utils_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	authorizeGatewayHttpRequestOrReply: () => authorizeGatewayHttpRequestOrReply,
	authorizeOpenAiCompatibleHttpModelOverride: () => authorizeOpenAiCompatibleHttpModelOverride,
	authorizeScopedGatewayHttpRequestOrReply: () => authorizeScopedGatewayHttpRequestOrReply,
	checkGatewayHttpRequestAuth: () => checkGatewayHttpRequestAuth,
	getBearerToken: () => getBearerToken,
	getHeader: () => getHeader,
	isGatewayBearerHttpRequest: () => isGatewayBearerHttpRequest,
	resolveHttpBrowserOriginPolicy: () => resolveHttpBrowserOriginPolicy,
	resolveHttpSenderIsOwner: () => resolveHttpSenderIsOwner,
	resolveOpenAiCompatibleHttpOperatorScopes: () => resolveOpenAiCompatibleHttpOperatorScopes,
	resolveOpenAiCompatibleHttpSenderIsOwner: () => resolveOpenAiCompatibleHttpSenderIsOwner,
	resolveSharedSecretHttpOperatorScopes: () => resolveSharedSecretHttpOperatorScopes,
	resolveTrustedHttpOperatorScopes: () => resolveTrustedHttpOperatorScopes
});
function getHeader(req, name) {
	const raw = req.headers[(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(name)];
	if (typeof raw === "string") return raw;
	if (Array.isArray(raw)) return raw[0];
}
function getBearerToken(req) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(getHeader(req, "authorization")) ?? "";
	if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw).startsWith("bearer ")) return;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.slice(7));
}
function resolveHttpBrowserOriginPolicy(req, cfg = require_io.getRuntimeConfig()) {
	return {
		requestHost: getHeader(req, "host"),
		origin: getHeader(req, "origin"),
		allowedOrigins: cfg.gateway?.controlUi?.allowedOrigins,
		allowHostHeaderOriginFallback: cfg.gateway?.controlUi?.dangerouslyAllowHostHeaderOriginFallback === true
	};
}
function usesSharedSecretHttpAuth(auth) {
	return auth?.mode === "token" || auth?.mode === "password";
}
function usesSharedSecretGatewayMethod(method) {
	return method === "token" || method === "password";
}
function shouldTrustDeclaredHttpOperatorScopes(req, authOrRequest) {
	if (authOrRequest && "trustDeclaredOperatorScopes" in authOrRequest) return authOrRequest.trustDeclaredOperatorScopes;
	return !isGatewayBearerHttpRequest(req, authOrRequest);
}
async function authorizeGatewayHttpRequestOrReply(params) {
	const result = await checkGatewayHttpRequestAuth(params);
	if (!result.ok) {
		require_http_common.sendGatewayAuthFailure(params.res, result.authResult);
		return null;
	}
	return result.requestAuth;
}
async function checkGatewayHttpRequestAuth(params) {
	const token = getBearerToken(params.req);
	const browserOriginPolicy = resolveHttpBrowserOriginPolicy(params.req, params.cfg);
	const authResult = await require_auth.authorizeHttpGatewayConnect({
		auth: params.auth,
		connectAuth: token ? {
			token,
			password: token
		} : null,
		req: params.req,
		trustedProxies: params.trustedProxies,
		allowRealIpFallback: params.allowRealIpFallback,
		rateLimiter: params.rateLimiter,
		browserOriginPolicy
	});
	if (!authResult.ok) return {
		ok: false,
		authResult
	};
	return {
		ok: true,
		requestAuth: {
			authMethod: authResult.method,
			trustDeclaredOperatorScopes: !usesSharedSecretGatewayMethod(authResult.method)
		}
	};
}
async function authorizeScopedGatewayHttpRequestOrReply(params) {
	const cfg = require_io.getRuntimeConfig();
	const requestAuth = await authorizeGatewayHttpRequestOrReply({
		req: params.req,
		res: params.res,
		auth: params.auth,
		trustedProxies: params.trustedProxies ?? cfg.gateway?.trustedProxies,
		allowRealIpFallback: params.allowRealIpFallback ?? cfg.gateway?.allowRealIpFallback,
		rateLimiter: params.rateLimiter
	});
	if (!requestAuth) return null;
	const operatorScopes = params.resolveOperatorScopes(params.req, requestAuth);
	const scopeAuth = require_method_scopes.authorizeOperatorScopesForMethod(params.operatorMethod, operatorScopes);
	if (!scopeAuth.allowed) {
		require_http_common.sendMissingScopeForbidden(params.res, scopeAuth.missingScope);
		return null;
	}
	return {
		cfg,
		requestAuth,
		operatorScopes
	};
}
function isGatewayBearerHttpRequest(req, auth) {
	return usesSharedSecretHttpAuth(auth) && Boolean(getBearerToken(req));
}
function resolveTrustedHttpOperatorScopes(req, authOrRequest) {
	if (!shouldTrustDeclaredHttpOperatorScopes(req, authOrRequest)) return [];
	const headerValue = getHeader(req, "x-operator-scopes");
	if (headerValue === void 0) return [...require_method_scopes.CLI_DEFAULT_OPERATOR_SCOPES];
	const raw = headerValue.trim();
	if (!raw) return [];
	return raw.split(",").map((scope) => scope.trim()).filter((scope) => scope.length > 0);
}
function resolveOpenAiCompatibleHttpOperatorScopes(req, requestAuth) {
	return resolveSharedSecretHttpOperatorScopes(req, requestAuth);
}
function resolveSharedSecretHttpOperatorScopes(req, requestAuth) {
	if (usesSharedSecretGatewayMethod(requestAuth.authMethod)) return [...require_method_scopes.CLI_DEFAULT_OPERATOR_SCOPES];
	return resolveTrustedHttpOperatorScopes(req, requestAuth);
}
function resolveHttpSenderIsOwner(req, authOrRequest) {
	return resolveTrustedHttpOperatorScopes(req, authOrRequest).includes(require_operator_scopes.ADMIN_SCOPE);
}
function resolveOpenAiCompatibleHttpSenderIsOwner(req, requestAuth) {
	if (usesSharedSecretGatewayMethod(requestAuth.authMethod)) return true;
	return resolveHttpSenderIsOwner(req, requestAuth);
}
function authorizeOpenAiCompatibleHttpModelOverride(req, requestAuth) {
	if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(getHeader(req, "x-operator-model")) || resolveOpenAiCompatibleHttpSenderIsOwner(req, requestAuth)) return { allowed: true };
	return {
		allowed: false,
		missingScope: require_operator_scopes.ADMIN_SCOPE
	};
}
//#endregion
Object.defineProperty(exports, "authorizeGatewayHttpRequestOrReply", {
	enumerable: true,
	get: function() {
		return authorizeGatewayHttpRequestOrReply;
	}
});
Object.defineProperty(exports, "authorizeOpenAiCompatibleHttpModelOverride", {
	enumerable: true,
	get: function() {
		return authorizeOpenAiCompatibleHttpModelOverride;
	}
});
Object.defineProperty(exports, "authorizeScopedGatewayHttpRequestOrReply", {
	enumerable: true,
	get: function() {
		return authorizeScopedGatewayHttpRequestOrReply;
	}
});
Object.defineProperty(exports, "checkGatewayHttpRequestAuth", {
	enumerable: true,
	get: function() {
		return checkGatewayHttpRequestAuth;
	}
});
Object.defineProperty(exports, "getBearerToken", {
	enumerable: true,
	get: function() {
		return getBearerToken;
	}
});
Object.defineProperty(exports, "getHeader", {
	enumerable: true,
	get: function() {
		return getHeader;
	}
});
Object.defineProperty(exports, "http_auth_utils_exports", {
	enumerable: true,
	get: function() {
		return http_auth_utils_exports;
	}
});
Object.defineProperty(exports, "resolveHttpBrowserOriginPolicy", {
	enumerable: true,
	get: function() {
		return resolveHttpBrowserOriginPolicy;
	}
});
Object.defineProperty(exports, "resolveOpenAiCompatibleHttpOperatorScopes", {
	enumerable: true,
	get: function() {
		return resolveOpenAiCompatibleHttpOperatorScopes;
	}
});
Object.defineProperty(exports, "resolveOpenAiCompatibleHttpSenderIsOwner", {
	enumerable: true,
	get: function() {
		return resolveOpenAiCompatibleHttpSenderIsOwner;
	}
});
Object.defineProperty(exports, "resolveSharedSecretHttpOperatorScopes", {
	enumerable: true,
	get: function() {
		return resolveSharedSecretHttpOperatorScopes;
	}
});
Object.defineProperty(exports, "resolveTrustedHttpOperatorScopes", {
	enumerable: true,
	get: function() {
		return resolveTrustedHttpOperatorScopes;
	}
});
