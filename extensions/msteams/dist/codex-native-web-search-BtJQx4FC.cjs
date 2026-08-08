const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_codex_native_web_search_shared = require("./codex-native-web-search.shared-BEYpYcyR.cjs");
const require_codex_native_web_search_core = require("./codex-native-web-search-core-Ca08HKYE.cjs");
//#region src/agents/codex-native-web-search.ts
var codex_native_web_search_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildCodexNativeWebSearchTool: () => require_codex_native_web_search_core.buildCodexNativeWebSearchTool,
	describeCodexNativeWebSearch: () => require_codex_native_web_search_shared.describeCodexNativeWebSearch,
	isCodexNativeWebSearchRelevant: () => isCodexNativeWebSearchRelevant,
	patchCodexNativeWebSearchPayload: () => require_codex_native_web_search_core.patchCodexNativeWebSearchPayload,
	resolveCodexNativeSearchActivation: () => require_codex_native_web_search_core.resolveCodexNativeSearchActivation,
	resolveCodexNativeWebSearchConfig: () => require_codex_native_web_search_shared.resolveCodexNativeWebSearchConfig,
	shouldSuppressManagedWebSearchTool: () => require_codex_native_web_search_core.shouldSuppressManagedWebSearchTool
});
/** True when Codex native web search should appear relevant for an agent. */
function isCodexNativeWebSearchRelevant(params) {
	if (require_codex_native_web_search_shared.resolveCodexNativeWebSearchConfig(params.config).enabled) return true;
	if (require_codex_native_web_search_core.hasAvailableCodexAuth(params)) return true;
	const defaultModel = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.config,
		agentId: params.agentId
	});
	const configuredProvider = params.config.models?.providers?.[defaultModel.provider];
	const configuredModelApi = configuredProvider?.models?.find((candidate) => candidate.id === defaultModel.model)?.api;
	return require_codex_native_web_search_core.isCodexNativeSearchEligibleModel({
		modelProvider: defaultModel.provider,
		modelApi: configuredModelApi ?? configuredProvider?.api
	});
}
//#endregion
Object.defineProperty(exports, "codex_native_web_search_exports", {
	enumerable: true,
	get: function() {
		return codex_native_web_search_exports;
	}
});
