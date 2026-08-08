const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_runtime_state = require("./runtime-state-DbA1_jkE.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_cli_backends_runtime = require("./cli-backends.runtime-BVsK1-34.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/plugins/setup-registry.runtime.ts
/** Metadata lookup helpers for plugin setup CLI backend descriptors. */
let cachedSetupCliBackendDescriptors;
function resolveMetadataSnapshotForSetupCliBackends(params = {}) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? require_runtime_state.getActivePluginRegistryWorkspaceDirFromState();
	return {
		snapshot: require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
			config: params.config ?? {},
			env,
			...workspaceDir !== void 0 ? {
				workspaceDir,
				allowWorkspaceScopedCurrent: true
			} : {}
		}),
		cacheable: true
	};
}
function resolveSetupCliBackendDescriptors(params = {}) {
	const { snapshot, cacheable } = resolveMetadataSnapshotForSetupCliBackends(params);
	const configFingerprint = snapshot.configFingerprint;
	if (cacheable && configFingerprint && cachedSetupCliBackendDescriptors?.configFingerprint === configFingerprint) return cachedSetupCliBackendDescriptors.entries;
	const entries = snapshot.plugins.flatMap((plugin) => {
		if (!require_installed_plugin_index.isInstalledPluginEnabled(snapshot.index, plugin.id)) return [];
		return [...plugin.cliBackends, ...plugin.setup?.cliBackends ?? []].map((backendId) => ({
			pluginId: plugin.id,
			backend: { id: backendId }
		}));
	});
	if (cacheable && configFingerprint) cachedSetupCliBackendDescriptors = {
		configFingerprint,
		entries
	};
	return entries;
}
function resolvePluginSetupCliBackendDescriptor(params) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.backend);
	return resolveSetupCliBackendDescriptors(params).find((entry) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.backend.id) === normalized);
}
//#endregion
//#region src/agents/model-selection-cli.ts
/** Return true when a provider id resolves to a configured or plugin CLI backend. */
function isCliProvider(provider, cfg) {
	const normalized = require_model_selection_normalize.normalizeProviderId(provider);
	const backends = cfg?.agents?.defaults?.cliBackends ?? {};
	if (Object.keys(backends).some((key) => require_model_selection_normalize.normalizeProviderId(key) === normalized)) return true;
	if (require_cli_backends_runtime.resolveRuntimeCliBackends().some((backend) => require_model_selection_normalize.normalizeProviderId(backend.id) === normalized)) return true;
	if (resolvePluginSetupCliBackendDescriptor({
		backend: normalized,
		config: cfg
	})) return true;
	return false;
}
//#endregion
Object.defineProperty(exports, "isCliProvider", {
	enumerable: true,
	get: function() {
		return isCliProvider;
	}
});
