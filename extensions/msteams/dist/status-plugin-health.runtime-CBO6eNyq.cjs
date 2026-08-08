require("./rolldown-runtime-u92d-OFm.cjs");
const require_read_only = require("./read-only-MDrE_ZGP.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
const require_tool_schema_quarantine_health = require("./tool-schema-quarantine-health-CYeVVisO.cjs");
const require_status_plugin_health = require("./status-plugin-health-Drs1HGs2.cjs");
//#region src/status/status-plugin-health.runtime.ts
function normalizeSnapshotPlugin(plugin) {
	const normalized = { id: plugin.id };
	if (plugin.status !== void 0) normalized.status = plugin.status;
	if (plugin.enabled !== void 0) normalized.enabled = plugin.enabled;
	if (plugin.error !== void 0) normalized.error = plugin.error;
	if (plugin.dependencyStatus !== void 0) normalized.dependencyStatus = plugin.dependencyStatus;
	if (plugin.failurePhase !== void 0) normalized.failurePhase = plugin.failurePhase;
	return normalized;
}
function normalizeDiagnostic(diagnostic) {
	const normalized = {
		level: diagnostic.level,
		message: diagnostic.message
	};
	if (diagnostic.pluginId) normalized.pluginId = diagnostic.pluginId;
	if (diagnostic.code) normalized.code = diagnostic.code;
	return normalized;
}
function normalizeCompatibilityNotice(notice) {
	return {
		pluginId: notice.pluginId,
		severity: notice.severity,
		message: notice.message,
		...notice.code ? { code: notice.code } : {}
	};
}
function collectChannelPluginFailures(params) {
	const diagnosticFailures = (params.diagnostics ?? []).filter(require_status_plugin_health.isChannelPluginFailureDiagnostic).map((diagnostic) => {
		const failure = {
			channelId: diagnostic.pluginId ?? "unknown",
			message: diagnostic.message,
			source: "diagnostic"
		};
		if (diagnostic.pluginId) failure.pluginId = diagnostic.pluginId;
		return failure;
	});
	if (!params.config) return require_status_plugin_health.dedupeChannelPluginFailures(diagnosticFailures);
	try {
		const resolution = require_read_only.resolveReadOnlyChannelPluginsForConfig(params.config, {
			workspaceDir: params.workspaceDir,
			activationSourceConfig: params.config,
			includePersistedAuthState: false,
			includeSetupFallbackPlugins: true
		});
		const loadFailures = resolution.loadFailures.map((failure) => ({
			channelId: failure.channelId,
			pluginId: failure.pluginId,
			message: failure.message,
			...failure.source ? { source: failure.source } : {}
		}));
		const concreteFailures = require_status_plugin_health.dedupeChannelPluginFailures([...diagnosticFailures, ...loadFailures]);
		const failedChannelIds = new Set(concreteFailures.map((failure) => failure.channelId));
		return [...concreteFailures, ...resolution.missingConfiguredChannelIds.filter((channelId) => !failedChannelIds.has(channelId)).map((channelId) => ({
			channelId,
			message: "configured channel plugin is missing or unavailable"
		}))];
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return [...diagnosticFailures, {
			channelId: "unknown",
			message: `failed to inspect configured channel plugins: ${message}`
		}];
	}
}
function parsePluginOwner(owner) {
	if (!owner?.startsWith("plugin:")) return;
	const pluginId = owner.slice(7).trim();
	return pluginId.length > 0 ? pluginId : void 0;
}
function filterRuntimeToolQuarantinesForRegistry(params) {
	const loadedPluginIds = new Set(params.plugins.filter((plugin) => plugin.enabled !== false && plugin.status !== "disabled").map((plugin) => plugin.id));
	return params.quarantines.filter((quarantine) => {
		const pluginId = parsePluginOwner(quarantine.owner);
		return !pluginId || loadedPluginIds.has(pluginId);
	});
}
function collectRuntimePluginHealthSnapshot() {
	const registry = require_active_runtime_registry.getActiveRuntimePluginRegistry();
	const diagnostics = (registry?.diagnostics ?? []).map(normalizeDiagnostic);
	const plugins = (registry?.plugins ?? []).map(normalizeSnapshotPlugin);
	const runtimeLoadedPluginIds = require_active_runtime_registry.listLoadedRuntimePluginIdsAcrossSurfaces();
	return {
		plugins,
		diagnostics,
		contextEngineQuarantines: require_registry.listContextEngineQuarantines(),
		runtimeToolQuarantines: filterRuntimeToolQuarantinesForRegistry({
			quarantines: require_tool_schema_quarantine_health.listPersistedRuntimeToolSchemaQuarantines(),
			plugins
		}),
		channelPluginFailures: collectChannelPluginFailures({ diagnostics }),
		runtimeLoadedPluginIds
	};
}
async function collectInstalledPluginHealthSnapshot(params) {
	const { buildPluginCompatibilityNotices, buildPluginSnapshotReport } = await Promise.resolve().then(() => require("./status-pSULYkKm.cjs")).then((n) => n.status_exports);
	const runtime = collectRuntimePluginHealthSnapshot();
	const report = buildPluginSnapshotReport({
		config: params.config,
		workspaceDir: params.workspaceDir
	});
	const installedDiagnostics = report.diagnostics.map(normalizeDiagnostic);
	const channelPluginFailures = collectChannelPluginFailures({
		config: params.config,
		diagnostics: require_status_plugin_health.dedupePluginDiagnostics([...installedDiagnostics, ...runtime.diagnostics]),
		workspaceDir: params.workspaceDir
	});
	const runtimeRegistry = require_active_runtime_registry.getActiveRuntimePluginRegistry();
	const runtimeCompatibilityNotices = runtimeRegistry ? buildPluginCompatibilityNotices({
		config: params.config,
		workspaceDir: params.workspaceDir,
		report: runtimeRegistry
	}).map(normalizeCompatibilityNotice) : [];
	const merged = require_status_plugin_health.mergeStatusPluginHealthSnapshots({
		plugins: report.plugins.map(normalizeSnapshotPlugin),
		diagnostics: installedDiagnostics,
		contextEngineQuarantines: [],
		channelPluginFailures,
		compatibilityNotices: buildPluginCompatibilityNotices({
			config: params.config,
			workspaceDir: params.workspaceDir,
			report
		}).map(normalizeCompatibilityNotice)
	}, {
		...runtime,
		compatibilityNotices: runtimeCompatibilityNotices
	});
	const shouldRunPluginIds = await resolveEagerShouldRunPluginIds(params);
	const unregisteredMemoryEmbeddingProviders = await resolveUnregisteredMemoryEmbeddingProviders({
		config: params.config,
		registry: runtimeRegistry
	});
	return {
		...merged,
		...shouldRunPluginIds ? { shouldRunPluginIds } : {},
		...unregisteredMemoryEmbeddingProviders ? { unregisteredMemoryEmbeddingProviders } : {}
	};
}
async function resolveUnregisteredMemoryEmbeddingProviders(params) {
	if (!params.config || !params.registry) return;
	try {
		const { collectRegisteredEmbeddingProviderIds, collectUnregisteredConfiguredMemoryEmbeddingProviders } = await Promise.resolve().then(() => require("./gateway-startup-plugin-ids-COQ5uJcA.cjs")).then((n) => n.gateway_startup_plugin_ids_exports);
		const unregistered = collectUnregisteredConfiguredMemoryEmbeddingProviders({
			config: params.config,
			registeredProviderIds: collectRegisteredEmbeddingProviderIds(params.registry)
		});
		return unregistered.length > 0 ? unregistered : void 0;
	} catch {
		return;
	}
}
async function resolveEagerShouldRunPluginIds(params) {
	if (!params.config) return;
	try {
		const { loadGatewayStartupPluginPlan } = await Promise.resolve().then(() => require("./gateway-startup-plugin-ids-COQ5uJcA.cjs")).then((n) => n.gateway_startup_plugin_ids_exports);
		const { resolvePluginActivationSourceConfig } = await Promise.resolve().then(() => require("./activation-source-config-DmXBpErL.cjs")).then((n) => n.activation_source_config_exports);
		const { resolveGatewayStartupPluginActivationConfig } = await Promise.resolve().then(() => require("./plugin-activation-runtime-config-DgDuUZhx.cjs"));
		const sourceConfig = resolvePluginActivationSourceConfig({ config: params.config });
		const plan = loadGatewayStartupPluginPlan({
			config: resolveGatewayStartupPluginActivationConfig({
				runtimeConfig: params.config,
				activationSourceConfig: sourceConfig,
				env: process.env
			}),
			activationSourceConfig: sourceConfig,
			env: process.env,
			...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {}
		});
		const deferred = new Set(plan.configuredDeferredChannelPluginIds);
		return plan.pluginIds.filter((id) => !deferred.has(id));
	} catch {
		return;
	}
}
//#endregion
exports.collectInstalledPluginHealthSnapshot = collectInstalledPluginHealthSnapshot;
exports.collectRuntimePluginHealthSnapshot = collectRuntimePluginHealthSnapshot;
