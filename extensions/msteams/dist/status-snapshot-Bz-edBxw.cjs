const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./registry-B6IZcEYI.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
//#region src/plugins/status-snapshot.ts
/** Builds plugin status reports from persisted metadata without importing full plugin runtimes. */
var status_snapshot_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ buildPluginRegistrySnapshotReport: () => buildPluginRegistrySnapshotReport });
function isPluginLifecycleTraceEnabled() {
	const raw = process.env.OPERATOR_PLUGIN_LIFECYCLE_TRACE?.trim().toLowerCase();
	return raw === "1" || raw === "true" || raw === "yes";
}
function formatTraceValue(value) {
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	return JSON.stringify(value);
}
function tracePluginLifecyclePhase(phase, fn, details) {
	if (!isPluginLifecycleTraceEnabled()) return fn();
	const start = process.hrtime.bigint();
	let status;
	try {
		const result = fn();
		status = "ok";
		return result;
	} catch (error) {
		status = "error";
		throw error;
	} finally {
		const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
		const detailText = Object.entries(details ?? {}).filter((entry) => entry[1] !== void 0).map(([key, value]) => `${key}=${formatTraceValue(value)}`).join(" ");
		const suffix = detailText ? ` ${detailText}` : "";
		console.error(`[plugins:lifecycle] phase=${JSON.stringify(phase)} ms=${elapsedMs.toFixed(2)} status=${status ?? "error"}${suffix}`);
	}
}
function buildPluginRecordFromInstalledIndex(plugin, manifest) {
	const format = plugin.format ?? manifest?.format ?? "@gabrielvfonseca/operator";
	const bundleFormat = plugin.bundleFormat ?? manifest?.bundleFormat;
	return {
		id: plugin.pluginId,
		name: manifest?.name ?? plugin.packageName ?? plugin.pluginId,
		...plugin.packageVersion || manifest?.version ? { version: plugin.packageVersion ?? manifest?.version } : {},
		...manifest?.description ? { description: manifest.description } : {},
		format,
		...bundleFormat ? { bundleFormat } : {},
		...manifest?.kind ? { kind: manifest.kind } : {},
		source: plugin.source ?? plugin.manifestPath,
		rootDir: plugin.rootDir,
		origin: plugin.origin,
		enabled: plugin.enabled,
		compat: plugin.compat,
		syntheticAuthRefs: [...plugin.syntheticAuthRefs ?? manifest?.syntheticAuthRefs ?? []],
		status: plugin.enabled ? "loaded" : "disabled",
		toolNames: [],
		hookNames: [],
		channelIds: [...manifest?.channels ?? []],
		cliBackendIds: [...manifest?.cliBackends ?? [], ...manifest?.setup?.cliBackends ?? []],
		providerIds: [...manifest?.providers ?? []],
		embeddingProviderIds: [...manifest?.contracts?.embeddingProviders ?? []],
		speechProviderIds: [...manifest?.contracts?.speechProviders ?? []],
		realtimeTranscriptionProviderIds: [...manifest?.contracts?.realtimeTranscriptionProviders ?? []],
		realtimeVoiceProviderIds: [...manifest?.contracts?.realtimeVoiceProviders ?? []],
		mediaUnderstandingProviderIds: [...manifest?.contracts?.mediaUnderstandingProviders ?? []],
		transcriptSourceProviderIds: [...manifest?.contracts?.transcriptSourceProviders ?? []],
		imageGenerationProviderIds: [...manifest?.contracts?.imageGenerationProviders ?? []],
		videoGenerationProviderIds: [...manifest?.contracts?.videoGenerationProviders ?? []],
		musicGenerationProviderIds: [...manifest?.contracts?.musicGenerationProviders ?? []],
		webFetchProviderIds: [...manifest?.contracts?.webFetchProviders ?? []],
		webSearchProviderIds: [...manifest?.contracts?.webSearchProviders ?? []],
		migrationProviderIds: [...manifest?.contracts?.migrationProviders ?? []],
		memoryEmbeddingProviderIds: [...manifest?.contracts?.memoryEmbeddingProviders ?? []],
		agentHarnessIds: [],
		cliCommands: [],
		services: [],
		gatewayDiscoveryServiceIds: [],
		commands: [...manifest?.commandAliases?.map((alias) => alias.name) ?? []],
		httpRoutes: 0,
		hookCount: 0,
		configSchema: false,
		contracts: manifest?.contracts,
		dependencyStatus: require_discovery.buildPluginDependencyStatus({
			rootDir: plugin.rootDir,
			dependencies: manifest?.packageDependencies,
			optionalDependencies: manifest?.packageOptionalDependencies
		})
	};
}
/** Resolves the best available plugin registry snapshot and annotates dependency status. */
function buildPluginRegistrySnapshotReport(params) {
	const config = params?.config ?? require_io.getRuntimeConfig();
	const result = tracePluginLifecyclePhase("plugin registry snapshot", () => require_plugin_registry.loadPluginRegistrySnapshotWithMetadata({
		config,
		env: params?.env,
		workspaceDir: params?.workspaceDir
	}), { surface: "status" });
	const env = params?.env ?? process.env;
	const manifestByPluginId = require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		index: result.snapshot,
		config,
		env,
		workspaceDir: params?.workspaceDir
	}).byPluginId;
	return {
		workspaceDir: params?.workspaceDir,
		...require_runtime.createEmptyPluginRegistry(),
		plugins: result.snapshot.plugins.map((plugin) => buildPluginRecordFromInstalledIndex(plugin, manifestByPluginId.get(plugin.pluginId))),
		diagnostics: [...result.snapshot.diagnostics],
		registrySource: result.source,
		registryDiagnostics: result.diagnostics
	};
}
//#endregion
Object.defineProperty(exports, "buildPluginRegistrySnapshotReport", {
	enumerable: true,
	get: function() {
		return buildPluginRegistrySnapshotReport;
	}
});
Object.defineProperty(exports, "status_snapshot_exports", {
	enumerable: true,
	get: function() {
		return status_snapshot_exports;
	}
});
