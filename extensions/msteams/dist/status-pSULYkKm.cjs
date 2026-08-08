const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./workspace-oX0zfOZq.cjs");
require("./config-DT0qiglW.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_config_env_vars = require("./config-env-vars-Cp6sSeHJ.cjs");
const require_facade_loader = require("./facade-loader-CNps1O4t.cjs");
require("./facade-runtime-BM8A5__s.cjs");
const require_bundled_compat = require("./bundled-compat-CE2H4H2e.cjs");
const require_providers = require("./providers-MmlTBfO9.cjs");
const require_load_context = require("./load-context-CvRS7akl.cjs");
const require_bundle_lsp = require("./bundle-lsp--ZCv1mTG.cjs");
const require_effective_plugin_ids = require("./effective-plugin-ids-CKSMv2rl.cjs");
const require_metadata_registry_loader = require("./metadata-registry-loader-Ccbzh_aX.cjs");
require("./status-snapshot-Bz-edBxw.cjs");
//#region src/plugins/inspect-shape.ts
function buildPluginCapabilityEntries(plugin, report) {
	return [
		{
			kind: "cli-backend",
			ids: plugin.cliBackendIds ?? []
		},
		{
			kind: "text-inference",
			ids: plugin.providerIds
		},
		{
			kind: "embedding",
			ids: plugin.embeddingProviderIds
		},
		{
			kind: "speech",
			ids: plugin.speechProviderIds
		},
		{
			kind: "realtime-transcription",
			ids: plugin.realtimeTranscriptionProviderIds
		},
		{
			kind: "realtime-voice",
			ids: plugin.realtimeVoiceProviderIds
		},
		{
			kind: "media-understanding",
			ids: plugin.mediaUnderstandingProviderIds
		},
		{
			kind: "transcript-source",
			ids: plugin.transcriptSourceProviderIds
		},
		{
			kind: "document-extractors",
			ids: plugin.contracts?.documentExtractors ?? []
		},
		{
			kind: "image-generation",
			ids: plugin.imageGenerationProviderIds
		},
		{
			kind: "video-generation",
			ids: plugin.videoGenerationProviderIds
		},
		{
			kind: "music-generation",
			ids: plugin.musicGenerationProviderIds
		},
		{
			kind: "web-search",
			ids: plugin.webSearchProviderIds
		},
		{
			kind: "worker-provider",
			ids: plugin.contracts?.workerProviders ?? []
		},
		{
			kind: "session-catalog",
			ids: report.sessionCatalogs.filter((entry) => entry.pluginId === plugin.id).map((entry) => entry.provider.id)
		},
		{
			kind: "agent-harness",
			ids: plugin.agentHarnessIds
		},
		{
			kind: "context-engine",
			ids: plugin.status === "loaded" && require_config_activation_shared.hasKind(plugin.kind, "context-engine") ? plugin.contextEngineIds ?? [] : []
		},
		{
			kind: "channel",
			ids: plugin.channelIds
		}
	].filter((entry) => entry.ids.length > 0);
}
function derivePluginInspectShape(params) {
	if (params.capabilityCount > 1) return "hybrid-capability";
	if (params.capabilityCount === 1) return "plain-capability";
	if (params.typedHookCount + params.customHookCount > 0 && params.toolCount === 0 && params.commandCount === 0 && params.cliCount === 0 && params.serviceCount === 0 && params.gatewayDiscoveryServiceCount === 0 && params.gatewayMethodCount === 0 && params.httpRouteCount === 0) return "hook-only";
	return "non-capability";
}
function buildPluginShapeSummary(params) {
	const capabilities = buildPluginCapabilityEntries(params.plugin, params.report);
	const typedHookCount = params.report.typedHooks.filter((entry) => entry.pluginId === params.plugin.id).length;
	const customHookCount = params.report.hooks.filter((entry) => entry.pluginId === params.plugin.id).length;
	const toolCount = params.report.tools.filter((entry) => entry.pluginId === params.plugin.id).length;
	const gatewayMethodCount = (params.report.gatewayMethodDescriptors ?? []).filter((descriptor) => descriptor.owner.kind === "plugin" && descriptor.owner.pluginId === params.plugin.id).length;
	const capabilityCount = capabilities.length;
	return {
		shape: derivePluginInspectShape({
			capabilityCount,
			typedHookCount,
			customHookCount,
			toolCount,
			commandCount: params.plugin.commands.length,
			cliCount: params.plugin.cliCommands.length,
			serviceCount: params.plugin.services.length,
			gatewayDiscoveryServiceCount: params.plugin.gatewayDiscoveryServiceIds.length,
			gatewayMethodCount,
			httpRouteCount: params.plugin.httpRoutes
		}),
		capabilityMode: capabilityCount === 0 ? "none" : capabilityCount === 1 ? "plain" : "hybrid",
		capabilityCount,
		capabilities,
		usesLegacyBeforeAgentStart: params.report.typedHooks.some((entry) => entry.pluginId === params.plugin.id && entry.hookName === "before_agent_start")
	};
}
//#endregion
//#region src/plugins/status.ts
var status_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildAllPluginInspectReports: () => buildAllPluginInspectReports,
	buildPluginCompatibilityNotices: () => buildPluginCompatibilityNotices,
	buildPluginCompatibilitySnapshotNotices: () => buildPluginCompatibilitySnapshotNotices,
	buildPluginCompatibilityWarnings: () => buildPluginCompatibilityWarnings,
	buildPluginDiagnosticsReport: () => buildPluginDiagnosticsReport,
	buildPluginInspectReport: () => buildPluginInspectReport,
	buildPluginSnapshotReport: () => buildPluginSnapshotReport,
	formatPluginCompatibilityNotice: () => formatPluginCompatibilityNotice,
	summarizePluginCompatibility: () => summarizePluginCompatibility
});
function buildCompatibilityNoticesForInspect(inspect) {
	const warnings = [];
	if (inspect.usesLegacyBeforeAgentStart) warnings.push({
		pluginId: inspect.plugin.id,
		code: "legacy-before-agent-start",
		compatCode: "legacy-before-agent-start",
		severity: "warn",
		message: "still uses legacy before_agent_start; keep regression coverage on this plugin, and prefer before_model_resolve/before_prompt_build for new work."
	});
	if (inspect.shape === "hook-only") warnings.push({
		pluginId: inspect.plugin.id,
		code: "hook-only",
		compatCode: "hook-only-plugin-shape",
		severity: "info",
		message: "is hook-only. This remains a supported compatibility path, but it has not migrated to explicit capability registration yet."
	});
	if ((inspect.plugin.memoryEmbeddingProviderIds.length > 0 || (inspect.plugin.contracts?.memoryEmbeddingProviders?.length ?? 0) > 0 || inspect.hasRuntimeMemoryEmbeddingProviderRegistration) && inspect.plugin.origin !== "bundled") warnings.push({
		pluginId: inspect.plugin.id,
		code: "deprecated-memory-embedding-provider-api",
		compatCode: "deprecated-memory-embedding-provider-api",
		severity: "warn",
		message: "uses deprecated memory-specific embedding provider API; use api.registerEmbeddingProvider and contracts.embeddingProviders for new embedding providers."
	});
	if (usesRemovedSessionTranscriptFileApi(inspect)) warnings.push({
		pluginId: inspect.plugin.id,
		code: "removed-session-transcript-file-api",
		compatCode: "removed-session-transcript-file-api",
		severity: "warn",
		message: "references removed session/transcript file APIs; migrate to session identity, SessionTranscriptUpdate.target, and Gateway/runtime session helpers."
	});
	return warnings;
}
const removedSessionTranscriptFileApiMarkers = [
	"saveSessionStore",
	"resolveSessionTranscriptPathInDir",
	"resolveAndPersistSessionFile",
	"readLatestAssistantTextFromSessionTranscript",
	"SessionTranscriptUpdate.sessionFile",
	"sessionFiles",
	"transcriptPath",
	"sessionFile"
];
function usesRemovedSessionTranscriptFileApi(inspect) {
	if (inspect.plugin.origin === "bundled") return false;
	return [inspect.plugin.error, ...inspect.diagnostics.map((diagnostic) => diagnostic.message)].filter((message) => typeof message === "string" && message.length > 0).some((message) => removedSessionTranscriptFileApiMarkers.some((marker) => message.includes(marker)));
}
function resolveReportedPluginVersion(plugin, env) {
	if (plugin.origin !== "bundled") return plugin.version;
	return require_config_env_vars.normalizeOperatorVersionBase(require_version.resolveCompatibilityHostVersion(env)) ?? require_config_env_vars.normalizeOperatorVersionBase(plugin.version) ?? plugin.version;
}
function buildPluginReport(params, loadModules) {
	const rawConfig = params?.config ?? require_io.getRuntimeConfig();
	const initialWorkspaceDir = params?.workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(rawConfig, require_agent_scope_config.resolveDefaultAgentId(rawConfig), params?.env);
	const metadataSnapshot = !loadModules ? require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config: rawConfig,
		env: params?.env ?? process.env,
		workspaceDir: initialWorkspaceDir
	}) : void 0;
	const baseContext = require_load_context.resolvePluginRuntimeLoadContext({
		config: rawConfig,
		env: params?.env,
		logger: params?.logger,
		workspaceDir: initialWorkspaceDir,
		manifestRegistry: metadataSnapshot?.manifestRegistry
	});
	const workspaceDir = baseContext.workspaceDir ?? initialWorkspaceDir ?? require_agent_scope_config.resolveDefaultAgentWorkspaceDir();
	const context = workspaceDir === baseContext.workspaceDir ? baseContext : {
		...baseContext,
		workspaceDir
	};
	const config = context.config;
	const runtimeCompatConfig = require_bundled_compat.withBundledPluginEnablementCompat({
		config,
		pluginIds: require_providers.resolveBundledProviderCompatPluginIds({
			config,
			workspaceDir,
			env: params?.env,
			manifestRegistry: metadataSnapshot?.manifestRegistry
		})
	});
	const onlyPluginIds = params?.effectiveOnly === true ? require_effective_plugin_ids.resolveEffectivePluginIds({
		config: rawConfig,
		workspaceDir,
		env: params?.env ?? process.env
	}) : params?.onlyPluginIds === void 0 ? void 0 : [...params.onlyPluginIds];
	const registry = loadModules ? require_discovery.tracePluginLifecyclePhase("runtime plugin registry load", () => require_loader.loadOperatorPlugins(require_load_context.buildPluginRuntimeLoadOptions(context, {
		config: runtimeCompatConfig,
		activationSourceConfig: rawConfig,
		workspaceDir,
		env: params?.env,
		loadModules,
		activate: false,
		cache: false,
		onlyPluginIds
	})), {
		surface: "status",
		onlyPluginCount: onlyPluginIds?.length
	}) : require_discovery.tracePluginLifecyclePhase("plugin registry snapshot", () => require_metadata_registry_loader.loadPluginMetadataRegistrySnapshot({
		config: runtimeCompatConfig,
		activationSourceConfig: rawConfig,
		workspaceDir,
		env: params?.env,
		logger: params?.logger,
		loadModules: false,
		onlyPluginIds,
		manifestRegistry: metadataSnapshot?.manifestRegistry,
		runtimeContext: context
	}), {
		surface: "status",
		onlyPluginCount: onlyPluginIds?.length
	});
	const importedPluginIds = /* @__PURE__ */ new Set([
		...loadModules ? registry.plugins.filter((plugin) => plugin.status === "loaded" && plugin.format !== "bundle").map((plugin) => plugin.id) : [],
		...require_runtime.listImportedRuntimePluginIds(),
		...require_facade_loader.listImportedBundledPluginFacadeIds()
	]);
	return {
		workspaceDir,
		...registry,
		plugins: registry.plugins.map((plugin) => Object.assign({}, plugin, {
			imported: plugin.format !== `bundle` && importedPluginIds.has(plugin.id),
			version: resolveReportedPluginVersion(plugin, params?.env),
			dependencyStatus: plugin.dependencyStatus ?? require_discovery.buildPluginDependencyStatus({
				rootDir: plugin.rootDir,
				dependencies: metadataSnapshot?.byPluginId.get(plugin.id)?.packageDependencies,
				optionalDependencies: metadataSnapshot?.byPluginId.get(plugin.id)?.packageOptionalDependencies
			})
		}))
	};
}
function buildPluginSnapshotReport(params) {
	return buildPluginReport(params, false);
}
function buildPluginDiagnosticsReport(params) {
	return buildPluginReport(params, true);
}
function buildPluginInspectReport(params) {
	const rawConfig = params.config ?? require_io.getRuntimeConfig();
	const config = params.resolvedConfig ?? require_load_context.resolvePluginRuntimeLoadContext({
		config: rawConfig,
		env: params.env,
		logger: params.logger,
		workspaceDir: params.workspaceDir
	}).config;
	const report = params.report ?? buildPluginDiagnosticsReport({
		config: rawConfig,
		logger: params.logger,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	const plugin = report.plugins.find((entry) => entry.id === params.id || entry.name === params.id);
	if (!plugin) return null;
	const typedHooks = report.typedHooks.filter((entry) => entry.pluginId === plugin.id).map((entry) => ({
		name: entry.hookName,
		priority: entry.priority
	})).toSorted((a, b) => a.name.localeCompare(b.name));
	const customHooks = report.hooks.filter((entry) => entry.pluginId === plugin.id).map((entry) => ({
		name: entry.entry.hook.name,
		events: [...entry.events].toSorted()
	})).toSorted((a, b) => a.name.localeCompare(b.name));
	const tools = report.tools.filter((entry) => entry.pluginId === plugin.id).map((entry) => ({
		names: [...entry.names],
		optional: entry.optional
	}));
	const diagnostics = report.diagnostics.filter((entry) => entry.pluginId === plugin.id);
	const policyEntry = require_config_state.normalizePluginsConfig(config.plugins).entries[plugin.id];
	const shapeSummary = buildPluginShapeSummary({
		plugin,
		report
	});
	const shape = shapeSummary.shape;
	const gatewayMethods = (report.gatewayMethodDescriptors ?? []).filter((descriptor) => descriptor.owner.kind === "plugin" && descriptor.owner.pluginId === plugin.id).map((descriptor) => descriptor.name);
	let mcpServers = [];
	if (plugin.format === "bundle" && plugin.bundleFormat && plugin.rootDir) {
		const mcpSupport = require_loader.inspectBundleMcpRuntimeSupport({
			pluginId: plugin.id,
			rootDir: plugin.rootDir,
			bundleFormat: plugin.bundleFormat
		});
		mcpServers = [...mcpSupport.supportedServerNames.map((name) => ({
			name,
			hasStdioTransport: true
		})), ...mcpSupport.unsupportedServerNames.map((name) => ({
			name,
			hasStdioTransport: false
		}))];
	}
	let lspServers = [];
	if (plugin.format === "bundle" && plugin.bundleFormat && plugin.rootDir) {
		const lspSupport = require_bundle_lsp.inspectBundleLspRuntimeSupport({
			pluginId: plugin.id,
			rootDir: plugin.rootDir,
			bundleFormat: plugin.bundleFormat
		});
		lspServers = [...lspSupport.supportedServerNames.map((name) => ({
			name,
			hasStdioTransport: true
		})), ...lspSupport.unsupportedServerNames.map((name) => ({
			name,
			hasStdioTransport: false
		}))];
	}
	const usesLegacyBeforeAgentStart = shapeSummary.usesLegacyBeforeAgentStart;
	const compatibility = buildCompatibilityNoticesForInspect({
		plugin,
		shape,
		usesLegacyBeforeAgentStart,
		diagnostics,
		hasRuntimeMemoryEmbeddingProviderRegistration: report.memoryEmbeddingProviders.some((entry) => entry.pluginId === plugin.id)
	});
	return {
		workspaceDir: report.workspaceDir,
		plugin,
		shape,
		capabilityMode: shapeSummary.capabilityMode,
		capabilityCount: shapeSummary.capabilityCount,
		capabilities: shapeSummary.capabilities,
		typedHooks,
		customHooks,
		tools,
		commands: [...plugin.commands],
		cliCommands: [...plugin.cliCommands],
		services: [...plugin.services],
		gatewayDiscoveryServices: [...plugin.gatewayDiscoveryServiceIds],
		gatewayMethods,
		mcpServers,
		lspServers,
		httpRouteCount: plugin.httpRoutes,
		bundleCapabilities: plugin.bundleCapabilities ?? [],
		diagnostics,
		policy: {
			allowPromptInjection: policyEntry?.hooks?.allowPromptInjection,
			allowConversationAccess: policyEntry?.hooks?.allowConversationAccess,
			hookTimeoutMs: policyEntry?.hooks?.timeoutMs,
			hookTimeouts: policyEntry?.hooks?.timeouts ? { ...policyEntry.hooks.timeouts } : void 0,
			allowModelOverride: policyEntry?.subagent?.allowModelOverride,
			allowedModels: [...policyEntry?.subagent?.allowedModels ?? []],
			hasAllowedModelsConfig: policyEntry?.subagent?.hasAllowedModelsConfig === true
		},
		usesLegacyBeforeAgentStart,
		compatibility
	};
}
function buildAllPluginInspectReports(params) {
	const rawConfig = params?.config ?? require_io.getRuntimeConfig();
	const config = require_load_context.resolvePluginRuntimeLoadContext({
		config: rawConfig,
		env: params?.env,
		logger: params?.logger,
		workspaceDir: params?.workspaceDir
	}).config;
	const report = params?.report ?? buildPluginDiagnosticsReport({
		config: rawConfig,
		logger: params?.logger,
		workspaceDir: params?.workspaceDir,
		env: params?.env
	});
	return report.plugins.map((plugin) => buildPluginInspectReport({
		id: plugin.id,
		config: rawConfig,
		logger: params?.logger,
		workspaceDir: params?.workspaceDir,
		env: params?.env,
		resolvedConfig: config,
		report
	})).filter((entry) => entry !== null);
}
function buildPluginCompatibilityWarnings(params) {
	return buildPluginCompatibilityNotices(params).map(formatPluginCompatibilityNotice);
}
function buildPluginCompatibilityNotices(params) {
	return buildAllPluginInspectReports(params).flatMap((inspect) => inspect.compatibility);
}
function buildPluginCompatibilitySnapshotNotices(params) {
	const report = buildPluginSnapshotReport(params);
	return buildPluginCompatibilityNotices({
		...params,
		report
	});
}
function formatPluginCompatibilityNotice(notice) {
	return `${notice.pluginId} ${notice.message}`;
}
function summarizePluginCompatibility(notices) {
	return {
		noticeCount: notices.length,
		pluginCount: new Set(notices.map((notice) => notice.pluginId)).size
	};
}
//#endregion
Object.defineProperty(exports, "buildAllPluginInspectReports", {
	enumerable: true,
	get: function() {
		return buildAllPluginInspectReports;
	}
});
Object.defineProperty(exports, "buildPluginCompatibilityNotices", {
	enumerable: true,
	get: function() {
		return buildPluginCompatibilityNotices;
	}
});
Object.defineProperty(exports, "buildPluginCompatibilitySnapshotNotices", {
	enumerable: true,
	get: function() {
		return buildPluginCompatibilitySnapshotNotices;
	}
});
Object.defineProperty(exports, "buildPluginCompatibilityWarnings", {
	enumerable: true,
	get: function() {
		return buildPluginCompatibilityWarnings;
	}
});
Object.defineProperty(exports, "buildPluginDiagnosticsReport", {
	enumerable: true,
	get: function() {
		return buildPluginDiagnosticsReport;
	}
});
Object.defineProperty(exports, "buildPluginInspectReport", {
	enumerable: true,
	get: function() {
		return buildPluginInspectReport;
	}
});
Object.defineProperty(exports, "buildPluginSnapshotReport", {
	enumerable: true,
	get: function() {
		return buildPluginSnapshotReport;
	}
});
Object.defineProperty(exports, "formatPluginCompatibilityNotice", {
	enumerable: true,
	get: function() {
		return formatPluginCompatibilityNotice;
	}
});
Object.defineProperty(exports, "status_exports", {
	enumerable: true,
	get: function() {
		return status_exports;
	}
});
Object.defineProperty(exports, "summarizePluginCompatibility", {
	enumerable: true,
	get: function() {
		return summarizePluginCompatibility;
	}
});
