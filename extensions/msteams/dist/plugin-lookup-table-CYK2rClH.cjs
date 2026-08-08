const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_gateway_startup_plugin_ids = require("./gateway-startup-plugin-ids-COQ5uJcA.cjs");
const require_worker_provider_registry = require("./worker-provider-registry-CsuKJchR.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
//#region src/plugins/plugin-lookup-table.ts
var plugin_lookup_table_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ loadPluginLookUpTable: () => loadPluginLookUpTable });
const lookupTableMemoBySnapshot = /* @__PURE__ */ new WeakMap();
function loadPluginLookUpTable(params) {
	const requestedSnapshotConfig = params.activationSourceConfig ?? params.config;
	const workerProviderIds = require_worker_provider_registry.normalizeWorkerProviderIds(params.workerProviderIds ?? []);
	const pluginIdScope = require_gateway_startup_plugin_ids.createGatewayStartupMetadataPluginIdScope({
		config: params.config,
		...params.activationSourceConfig !== void 0 ? { activationSourceConfig: params.activationSourceConfig } : {},
		env: params.env,
		workerProviderIds
	});
	const metadataSnapshot = params.metadataSnapshot && require_plugin_metadata_snapshot.isPluginMetadataSnapshotCompatible({
		snapshot: params.metadataSnapshot,
		config: requestedSnapshotConfig,
		env: params.env,
		allowScopedSnapshot: true,
		workspaceDir: params.workspaceDir,
		index: params.index
	}) && require_gateway_startup_plugin_ids.isMetadataSnapshotScopedForGatewayStartup({
		metadataSnapshot: params.metadataSnapshot,
		pluginIdScope
	}) ? params.metadataSnapshot : require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config: requestedSnapshotConfig,
		workspaceDir: params.workspaceDir,
		env: params.env,
		allowWorkspaceScopedCurrent: params.workspaceDir === void 0,
		...params.index ? { index: params.index } : {},
		pluginIdScope
	});
	const memoKey = pluginIdScope.key;
	const memo = lookupTableMemoBySnapshot.get(metadataSnapshot)?.get(memoKey);
	if (memo) return memo;
	const { index, manifestRegistry } = metadataSnapshot;
	const startupPlanStartedAt = performance.now();
	const startup = require_gateway_startup_plugin_ids.resolveGatewayStartupPluginPlanFromRegistry({
		config: params.config,
		...params.activationSourceConfig !== void 0 ? { activationSourceConfig: params.activationSourceConfig } : {},
		env: params.env,
		index,
		manifestRegistry,
		workerProviderIds
	});
	const startupPlanMs = performance.now() - startupPlanStartedAt;
	const table = {
		...metadataSnapshot,
		startup,
		workerProviderIds,
		metrics: {
			...metadataSnapshot.metrics,
			startupPlanMs,
			totalMs: metadataSnapshot.metrics.totalMs + startupPlanMs,
			startupPluginCount: startup.pluginIds.length,
			deferredChannelPluginCount: startup.configuredDeferredChannelPluginIds.length
		}
	};
	let memoByKey = lookupTableMemoBySnapshot.get(metadataSnapshot);
	if (!memoByKey) {
		memoByKey = /* @__PURE__ */ new Map();
		lookupTableMemoBySnapshot.set(metadataSnapshot, memoByKey);
	}
	memoByKey.set(memoKey, table);
	return table;
}
//#endregion
Object.defineProperty(exports, "loadPluginLookUpTable", {
	enumerable: true,
	get: function() {
		return loadPluginLookUpTable;
	}
});
Object.defineProperty(exports, "plugin_lookup_table_exports", {
	enumerable: true,
	get: function() {
		return plugin_lookup_table_exports;
	}
});
