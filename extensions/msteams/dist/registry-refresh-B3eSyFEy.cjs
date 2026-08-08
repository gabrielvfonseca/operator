const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
require("./installed-plugin-index-records-2CPyZnZe.cjs");
//#region src/plugins/registry-refresh.ts
var registry_refresh_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	invalidatePluginRuntimeDiscoveryAfterConfigMutation: () => invalidatePluginRuntimeDiscoveryAfterConfigMutation,
	refreshPluginRegistryAfterConfigMutation: () => refreshPluginRegistryAfterConfigMutation
});
/** Refresh persisted plugin registry and clear runtime discovery after a config mutation. */
async function refreshPluginRegistryAfterConfigMutation(params) {
	try {
		const installRecords = params.installRecords ?? await require_discovery.tracePluginLifecyclePhaseAsync("install records load", () => require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords(params.env ? { env: params.env } : {}), { command: params.traceCommand ?? "registry-refresh" });
		await require_discovery.tracePluginLifecyclePhaseAsync("registry refresh", () => require_plugin_registry.refreshPluginRegistry({
			config: params.config,
			reason: params.reason,
			installRecords,
			...params.policyPluginIds ? { policyPluginIds: params.policyPluginIds } : {},
			...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
			...params.env ? { env: params.env } : {}
		}), {
			command: params.traceCommand ?? "registry-refresh",
			reason: params.reason
		});
	} catch (error) {
		params.logger?.warn?.(`Plugin registry refresh failed: ${require_errors.formatErrorMessage(error)}`);
	}
	if (params.invalidateRuntimeCache !== false) await invalidatePluginRuntimeDiscoveryAfterConfigMutation(params);
}
async function invalidatePluginRuntimeDiscoveryAfterConfigMutation(params) {
	try {
		const { clearPluginRegistryLoadCache } = await Promise.resolve().then(() => require("./loader-BXYDwRk1.cjs")).then((n) => n.loader_exports);
		clearPluginRegistryLoadCache();
	} catch (error) {
		params.logger?.warn?.(`Plugin runtime cache invalidation failed: ${require_errors.formatErrorMessage(error)}`);
	}
}
//#endregion
Object.defineProperty(exports, "invalidatePluginRuntimeDiscoveryAfterConfigMutation", {
	enumerable: true,
	get: function() {
		return invalidatePluginRuntimeDiscoveryAfterConfigMutation;
	}
});
Object.defineProperty(exports, "refreshPluginRegistryAfterConfigMutation", {
	enumerable: true,
	get: function() {
		return refreshPluginRegistryAfterConfigMutation;
	}
});
Object.defineProperty(exports, "registry_refresh_exports", {
	enumerable: true,
	get: function() {
		return registry_refresh_exports;
	}
});
