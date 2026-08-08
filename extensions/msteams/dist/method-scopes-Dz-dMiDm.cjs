const require_runtime_state = require("./runtime-state-DbA1_jkE.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_gateway_method_policy = require("./gateway-method-policy-DvDD_vYM.cjs");
const require_core_descriptors = require("./core-descriptors-DnvIcTik.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/method-scopes.ts
/** Default scopes granted to CLI/operator clients when no narrower local policy is known. */
const CLI_DEFAULT_OPERATOR_SCOPES = [
	require_operator_scopes.ADMIN_SCOPE,
	require_operator_scopes.READ_SCOPE,
	require_operator_scopes.WRITE_SCOPE,
	require_operator_scopes.APPROVALS_SCOPE,
	require_operator_scopes.PAIRING_SCOPE,
	require_operator_scopes.TALK_SECRETS_SCOPE
];
function resolveScopedMethod(method) {
	const explicitScope = require_core_descriptors.resolveCoreOperatorGatewayMethodScope(method);
	if (explicitScope) return explicitScope;
	const reservedScope = require_gateway_method_policy.resolveReservedGatewayMethodScope(method);
	if (reservedScope) return reservedScope;
	const pluginScope = (require_runtime_state.getPluginRegistryState()?.activeRegistry?.gatewayMethodDescriptors?.find((descriptor) => descriptor.name === method))?.scope;
	return pluginScope === "node" || pluginScope === "dynamic" ? void 0 : pluginScope;
}
/** Returns true when a method requires the approvals operator scope. */
function isApprovalMethod(method) {
	return resolveScopedMethod(method) === require_operator_scopes.APPROVALS_SCOPE;
}
/** Returns true when a method is reserved for node-role clients instead of operators. */
function isNodeRoleMethod(method) {
	return require_core_descriptors.isCoreNodeGatewayMethod(method);
}
/** Resolves the required static operator scope for a gateway method, if one exists. */
function resolveRequiredOperatorScopeForMethod(method) {
	return resolveScopedMethod(method);
}
/**
* sessions.patch fields a write-scoped operator may mutate: user-level chat
* organization only. Any other field (model, sendPolicy, tool inheritance,
* exec routing, ...) keeps requiring operator.admin — fail closed on unknowns.
*/
const SESSIONS_PATCH_WRITE_SCOPE_FIELDS = /* @__PURE__ */ new Set([
	"key",
	"agentId",
	"label",
	"category",
	"pinned",
	"archived",
	"unread"
]);
function resolveSessionsPatchRequiredScopes(params) {
	if (!params || typeof params !== "object" || Array.isArray(params)) return [require_operator_scopes.WRITE_SCOPE];
	return Object.keys(params).every((key) => SESSIONS_PATCH_WRITE_SCOPE_FIELDS.has(key)) ? [require_operator_scopes.WRITE_SCOPE] : [require_operator_scopes.ADMIN_SCOPE];
}
function resolveSessionsCreateRequiredScopes(params) {
	if (!params || typeof params !== "object" || Array.isArray(params)) return [require_operator_scopes.WRITE_SCOPE];
	return Object.hasOwn(params, "cwd") || Object.hasOwn(params, "execNode") ? [require_operator_scopes.ADMIN_SCOPE] : [require_operator_scopes.WRITE_SCOPE];
}
function resolveSessionActionRegisteredScopes(params) {
	if (!params || typeof params !== "object" || Array.isArray(params)) return;
	const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.pluginId);
	const actionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.actionId);
	if (!pluginId || !actionId) return;
	const registration = require_runtime_state.getPluginRegistryState()?.activeRegistry?.sessionActions?.find((entry) => entry.pluginId === pluginId && entry.action.id === actionId);
	if (!registration) return;
	const requiredScopes = registration.action.requiredScopes;
	return requiredScopes && requiredScopes.length > 0 ? [...requiredScopes] : [require_operator_scopes.WRITE_SCOPE];
}
function resolveSessionActionLeastPrivilegeScopes(params) {
	const registeredScopes = resolveSessionActionRegisteredScopes(params);
	if (registeredScopes) return registeredScopes;
	if (params && typeof params === "object" && !Array.isArray(params)) {
		const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.pluginId);
		const actionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.actionId);
		if (pluginId && actionId) return [...CLI_DEFAULT_OPERATOR_SCOPES];
	}
	return [require_operator_scopes.WRITE_SCOPE];
}
function resolveDynamicLeastPrivilegeOperatorScopesForMethod(method, params) {
	if (method === "plugins.sessionAction") return resolveSessionActionLeastPrivilegeScopes(params);
	if (method === "sessions.patch") return resolveSessionsPatchRequiredScopes(params);
	if (method === "sessions.create") return resolveSessionsCreateRequiredScopes(params);
	if (method === "sessions.delete") return resolveSessionsDeleteRequiredScopes(params);
	return [require_operator_scopes.WRITE_SCOPE];
}
/**
* sessions.delete params a write-scoped archive-then-delete request may carry.
* Internal controls (emitLifecycleHooks, expected* CAS guards) stay admin-only
* — fail closed on anything outside this set.
*/
const SESSIONS_DELETE_WRITE_SCOPE_FIELDS = /* @__PURE__ */ new Set([
	"key",
	"agentId",
	"deleteTranscript",
	"archivedOnly"
]);
function resolveSessionsDeleteRequiredScopes(params) {
	if (!params || typeof params !== "object" || Array.isArray(params)) return [require_operator_scopes.ADMIN_SCOPE];
	if (params.archivedOnly !== true) return [require_operator_scopes.ADMIN_SCOPE];
	return Object.keys(params).every((key) => SESSIONS_DELETE_WRITE_SCOPE_FIELDS.has(key)) ? [require_operator_scopes.WRITE_SCOPE] : [require_operator_scopes.ADMIN_SCOPE];
}
function findMissingOperatorScope(requiredScopes, scopes) {
	return requiredScopes.find((scope) => {
		return !scopes.includes(scope) && !(scope === "operator.read" && scopes.includes("operator.write"));
	});
}
/** Returns the narrowest known operator scopes needed to call a gateway method. */
function resolveLeastPrivilegeOperatorScopesForMethod(method, params) {
	if (require_core_descriptors.isDynamicOperatorGatewayMethod(method)) return resolveDynamicLeastPrivilegeOperatorScopesForMethod(method, params);
	const requiredScope = resolveRequiredOperatorScopeForMethod(method);
	if (requiredScope) return [requiredScope];
	return [];
}
/** Checks whether a presented operator scope set authorizes a gateway method call. */
function authorizeOperatorScopesForMethod(method, scopes, params) {
	if (scopes.includes("operator.admin")) return { allowed: true };
	if (require_core_descriptors.isDynamicOperatorGatewayMethod(method)) {
		if (method === "sessions.create") {
			const missingScope = findMissingOperatorScope(resolveSessionsCreateRequiredScopes(params), scopes);
			return missingScope ? {
				allowed: false,
				missingScope
			} : { allowed: true };
		}
		if (method === "sessions.patch") {
			const missingScope = findMissingOperatorScope(resolveSessionsPatchRequiredScopes(params), scopes);
			return missingScope ? {
				allowed: false,
				missingScope
			} : { allowed: true };
		}
		if (method === "sessions.delete") {
			const missingScope = findMissingOperatorScope(resolveSessionsDeleteRequiredScopes(params), scopes);
			return missingScope ? {
				allowed: false,
				missingScope
			} : { allowed: true };
		}
		const registeredScopes = resolveSessionActionRegisteredScopes(params);
		if (!registeredScopes && params && typeof params === "object" && !Array.isArray(params)) {
			const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.pluginId);
			const actionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.actionId);
			if (!pluginId || !actionId) return scopes.some((scope) => require_operator_scopes.isOperatorScope(scope)) ? { allowed: true } : {
				allowed: false,
				missingScope: require_operator_scopes.WRITE_SCOPE
			};
		}
		const missingScope = findMissingOperatorScope(registeredScopes ?? ["operator.write"], scopes);
		return missingScope ? {
			allowed: false,
			missingScope
		} : { allowed: true };
	}
	return authorizeOperatorScopesForRequiredScope(resolveRequiredOperatorScopeForMethod(method) ?? "operator.admin", scopes);
}
/** Checks a method registry's already-resolved static scope against presented operator scopes. */
function authorizeOperatorScopesForRequiredScope(requiredScope, scopes) {
	if (scopes.includes("operator.admin")) return { allowed: true };
	if (requiredScope === "operator.read") {
		if (scopes.includes("operator.read") || scopes.includes("operator.write")) return { allowed: true };
		return {
			allowed: false,
			missingScope: require_operator_scopes.READ_SCOPE
		};
	}
	if (scopes.includes(requiredScope)) return { allowed: true };
	return {
		allowed: false,
		missingScope: requiredScope
	};
}
/** Returns true when a method has any core, node, dynamic, reserved, or plugin scope policy. */
function isGatewayMethodClassified(method) {
	if (isNodeRoleMethod(method)) return true;
	if (require_core_descriptors.isDynamicOperatorGatewayMethod(method)) return true;
	return require_core_descriptors.isCoreGatewayMethodClassified(method) || resolveRequiredOperatorScopeForMethod(method) !== void 0;
}
//#endregion
Object.defineProperty(exports, "CLI_DEFAULT_OPERATOR_SCOPES", {
	enumerable: true,
	get: function() {
		return CLI_DEFAULT_OPERATOR_SCOPES;
	}
});
Object.defineProperty(exports, "authorizeOperatorScopesForMethod", {
	enumerable: true,
	get: function() {
		return authorizeOperatorScopesForMethod;
	}
});
Object.defineProperty(exports, "authorizeOperatorScopesForRequiredScope", {
	enumerable: true,
	get: function() {
		return authorizeOperatorScopesForRequiredScope;
	}
});
Object.defineProperty(exports, "isApprovalMethod", {
	enumerable: true,
	get: function() {
		return isApprovalMethod;
	}
});
Object.defineProperty(exports, "isGatewayMethodClassified", {
	enumerable: true,
	get: function() {
		return isGatewayMethodClassified;
	}
});
Object.defineProperty(exports, "isNodeRoleMethod", {
	enumerable: true,
	get: function() {
		return isNodeRoleMethod;
	}
});
Object.defineProperty(exports, "resolveLeastPrivilegeOperatorScopesForMethod", {
	enumerable: true,
	get: function() {
		return resolveLeastPrivilegeOperatorScopesForMethod;
	}
});
