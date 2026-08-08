const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_errors = require("./errors-rYeQaZRQ.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/acp/runtime/registry.ts
var registry_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	getAcpRuntimeBackend: () => getAcpRuntimeBackend,
	requireAcpRuntimeBackend: () => requireAcpRuntimeBackend
});
const ACP_RUNTIME_REGISTRY_STATE_KEY = Symbol.for("operator.acpRuntimeRegistryState");
function resolveAcpRuntimeRegistryGlobalState() {
	const processStore = process;
	const existing = processStore[ACP_RUNTIME_REGISTRY_STATE_KEY];
	if (existing) return existing;
	const created = require_global_singleton.resolveGlobalSingleton(ACP_RUNTIME_REGISTRY_STATE_KEY, () => ({ backendsById: /* @__PURE__ */ new Map() }));
	processStore[ACP_RUNTIME_REGISTRY_STATE_KEY] = created;
	return created;
}
const ACP_BACKENDS_BY_ID = resolveAcpRuntimeRegistryGlobalState().backendsById;
function isBackendHealthy(backend) {
	if (!backend.healthy) return true;
	try {
		return backend.healthy();
	} catch {
		return false;
	}
}
/** Resolves a backend by id, or the first healthy backend when no id is supplied. */
function getAcpRuntimeBackend(id) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(id) || "";
	if (normalized) return ACP_BACKENDS_BY_ID.get(normalized) ?? null;
	if (ACP_BACKENDS_BY_ID.size === 0) return null;
	for (const backend of ACP_BACKENDS_BY_ID.values()) if (isBackendHealthy(backend)) return backend;
	return ACP_BACKENDS_BY_ID.values().next().value ?? null;
}
/** Resolves a healthy backend or throws a typed ACP runtime error. */
function requireAcpRuntimeBackend(id) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(id) || "";
	const backend = getAcpRuntimeBackend(normalized || void 0);
	if (!backend) throw new require_errors.errors_exports.AcpRuntimeError("ACP_BACKEND_MISSING", "ACP runtime backend is not configured. Install and enable the acpx runtime plugin.");
	if (!isBackendHealthy(backend)) throw new require_errors.errors_exports.AcpRuntimeError("ACP_BACKEND_UNAVAILABLE", "ACP runtime backend is currently unavailable. Try again in a moment.");
	if (normalized && backend.id !== normalized) throw new require_errors.errors_exports.AcpRuntimeError("ACP_BACKEND_MISSING", `ACP runtime backend "${normalized}" is not registered.`);
	return backend;
}
//#endregion
Object.defineProperty(exports, "getAcpRuntimeBackend", {
	enumerable: true,
	get: function() {
		return getAcpRuntimeBackend;
	}
});
Object.defineProperty(exports, "registry_exports", {
	enumerable: true,
	get: function() {
		return registry_exports;
	}
});
Object.defineProperty(exports, "requireAcpRuntimeBackend", {
	enumerable: true,
	get: function() {
		return requireAcpRuntimeBackend;
	}
});
