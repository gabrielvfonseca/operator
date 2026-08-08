const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
//#region src/agents/session-runtime-compat.ts
/** Resolves the persisted runtime id, preserving locked transcript ownership. */
function resolvePersistedSessionRuntimeId(entry) {
	const harnessRuntime = require_openai_routing.normalizeOptionalAgentRuntimeId(entry?.agentHarnessId);
	if (entry?.modelSelectionLocked === true && harnessRuntime && !require_openai_routing.isDefaultAgentRuntimeId(harnessRuntime)) return harnessRuntime;
	const runtimeOverride = require_openai_routing.normalizeOptionalAgentRuntimeId(entry?.agentRuntimeOverride);
	if (runtimeOverride && !require_openai_routing.isDefaultAgentRuntimeId(runtimeOverride)) return runtimeOverride;
	return harnessRuntime;
}
/** Resolves a runtime id only when it can serve the selected provider. */
function resolveCompatibleAgentRuntimeForProvider(params) {
	const runtime = require_openai_routing.normalizeOptionalAgentRuntimeId(params.runtime);
	if (!runtime || require_openai_routing.isDefaultAgentRuntimeId(runtime)) return;
	if (runtime === "@gabrielvfonseca/operator") return runtime;
	const provider = params.provider?.trim().toLowerCase() ?? "";
	if (runtime === "codex" && (provider === "codex" || provider === "openai")) return runtime;
	return require_model_runtime_aliases.isCliRuntimeAliasForProvider({
		provider,
		runtime,
		cfg: params.cfg
	}) ? runtime : void 0;
}
/** Resolves a persisted runtime override only when it can serve the selected provider. */
function resolveSessionRuntimeOverrideForProvider(params) {
	const lockedHarness = require_openai_routing.normalizeOptionalAgentRuntimeId(params.entry?.agentHarnessId);
	if (params.entry?.modelSelectionLocked === true && lockedHarness && !require_openai_routing.isDefaultAgentRuntimeId(lockedHarness)) return lockedHarness;
	return resolveCompatibleAgentRuntimeForProvider({
		provider: params.provider,
		runtime: params.entry?.agentRuntimeOverride,
		cfg: params.cfg
	});
}
//#endregion
Object.defineProperty(exports, "resolveCompatibleAgentRuntimeForProvider", {
	enumerable: true,
	get: function() {
		return resolveCompatibleAgentRuntimeForProvider;
	}
});
Object.defineProperty(exports, "resolvePersistedSessionRuntimeId", {
	enumerable: true,
	get: function() {
		return resolvePersistedSessionRuntimeId;
	}
});
Object.defineProperty(exports, "resolveSessionRuntimeOverrideForProvider", {
	enumerable: true,
	get: function() {
		return resolveSessionRuntimeOverrideForProvider;
	}
});
