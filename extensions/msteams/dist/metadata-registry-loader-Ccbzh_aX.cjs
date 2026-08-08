const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_load_context = require("./load-context-CvRS7akl.cjs");
//#region src/plugins/runtime/metadata-registry-loader.ts
var metadata_registry_loader_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ loadPluginMetadataRegistrySnapshot: () => loadPluginMetadataRegistrySnapshot });
/** Loads a non-activated plugin metadata registry snapshot for validation/status callers. */
function loadPluginMetadataRegistrySnapshot(options) {
	return require_loader.loadOperatorPlugins(require_load_context.buildPluginRuntimeLoadOptions(options?.runtimeContext ?? require_load_context.resolvePluginRuntimeLoadContext(options), {
		...options?.config !== void 0 ? { config: options.config } : {},
		...options?.activationSourceConfig !== void 0 ? { activationSourceConfig: options.activationSourceConfig } : {},
		...options?.workspaceDir !== void 0 ? { workspaceDir: options.workspaceDir } : {},
		...options?.env !== void 0 ? { env: options.env } : {},
		...options?.logger !== void 0 ? { logger: options.logger } : {},
		throwOnLoadError: true,
		cache: false,
		activate: false,
		mode: "validate",
		loadModules: options?.loadModules,
		...require_current_plugin_metadata_snapshot.hasExplicitPluginIdScope(options?.onlyPluginIds) ? { onlyPluginIds: options?.onlyPluginIds } : {},
		...options?.manifestRegistry ? { manifestRegistry: options.manifestRegistry } : {}
	}));
}
//#endregion
Object.defineProperty(exports, "loadPluginMetadataRegistrySnapshot", {
	enumerable: true,
	get: function() {
		return loadPluginMetadataRegistrySnapshot;
	}
});
Object.defineProperty(exports, "metadata_registry_loader_exports", {
	enumerable: true,
	get: function() {
		return metadata_registry_loader_exports;
	}
});
