const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_runtime_web_tools_state = require("./runtime-web-tools-state-DbJISCDm.cjs");
const require_runtime_state = require("./runtime-state-kSoytkKT.cjs");
//#region src/agents/tools/web-tool-runtime-context.ts
var web_tool_runtime_context_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolveWebFetchToolRuntimeContext: () => resolveWebFetchToolRuntimeContext,
	resolveWebSearchToolRuntimeContext: () => resolveWebSearchToolRuntimeContext
});
function resolveConfiguredWebProviderId(config, kind) {
	const provider = config?.tools?.web?.[kind]?.provider;
	return typeof provider === "string" ? provider.trim().toLowerCase() : "";
}
function resolveRuntimeWebProviderId(metadata) {
	return metadata?.selectedProvider ?? metadata?.providerConfigured ?? "";
}
function shouldPreferRuntimeProviders(params) {
	if (!params.providerSelectionId || params.kind === "search") return true;
	return !require_plugin_registry.resolveManifestContractOwnerPluginId({
		contract: "webFetchProviders",
		value: params.providerSelectionId,
		origin: "bundled",
		config: params.config
	});
}
function resolveWebToolRuntimeContext(params) {
	const runtimeMetadata = (params.lateBindRuntimeConfig === true ? require_runtime_web_tools_state.getActiveRuntimeWebToolsMetadata() : null)?.[params.kind] ?? params.capturedRuntimeMetadata;
	const config = params.lateBindRuntimeConfig === true ? require_runtime_state.getActiveSecretsRuntimeConfigSnapshot()?.config ?? params.capturedConfig : params.capturedConfig;
	const providerSelectionId = resolveRuntimeWebProviderId(runtimeMetadata) || resolveConfiguredWebProviderId(config, params.kind);
	return {
		config,
		preferRuntimeProviders: shouldPreferRuntimeProviders({
			config,
			kind: params.kind,
			providerSelectionId
		}),
		runtimeMetadata
	};
}
/** Resolves runtime provider context for the web_search tool. */
function resolveWebSearchToolRuntimeContext(params) {
	const resolved = resolveWebToolRuntimeContext({
		capturedConfig: params.config,
		capturedRuntimeMetadata: params.runtimeWebSearch,
		kind: "search",
		lateBindRuntimeConfig: params.lateBindRuntimeConfig
	});
	return {
		config: resolved.config,
		preferRuntimeProviders: resolved.preferRuntimeProviders,
		runtimeWebSearch: resolved.runtimeMetadata
	};
}
/** Resolves runtime provider context for the web_fetch tool. */
function resolveWebFetchToolRuntimeContext(params) {
	const resolved = resolveWebToolRuntimeContext({
		capturedConfig: params.config,
		capturedRuntimeMetadata: params.runtimeWebFetch,
		kind: "fetch",
		lateBindRuntimeConfig: params.lateBindRuntimeConfig
	});
	return {
		config: resolved.config,
		preferRuntimeProviders: resolved.preferRuntimeProviders,
		runtimeWebFetch: resolved.runtimeMetadata
	};
}
//#endregion
Object.defineProperty(exports, "resolveWebFetchToolRuntimeContext", {
	enumerable: true,
	get: function() {
		return resolveWebFetchToolRuntimeContext;
	}
});
Object.defineProperty(exports, "resolveWebSearchToolRuntimeContext", {
	enumerable: true,
	get: function() {
		return resolveWebSearchToolRuntimeContext;
	}
});
Object.defineProperty(exports, "web_tool_runtime_context_exports", {
	enumerable: true,
	get: function() {
		return web_tool_runtime_context_exports;
	}
});
