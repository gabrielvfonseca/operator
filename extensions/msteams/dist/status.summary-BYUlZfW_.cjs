const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
const require_agent_list = require("./agent-list-C2uJTQ1H.cjs");
const require_heartbeat_summary = require("./heartbeat-summary-BL-oe7t6.cjs");
const require_task_registry_audit = require("./task-registry.audit-XhxIvYHV.cjs");
//#region src/commands/status.summary.ts
var status_summary_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	getStatusSummary: () => getStatusSummary,
	redactSensitiveStatusSummary: () => redactSensitiveStatusSummary
});
const RECENT_SESSION_LIMIT = 10;
const channelSummaryModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./channel-summary-B3JsMquG.cjs")).then((n) => n.channel_summary_exports));
const channelPluginIdsModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./channel-plugin-ids-CD0w6PY3.cjs")).then((n) => n.channel_plugin_ids_exports));
const linkChannelModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.link-channel-A8bNn8Pw.cjs")));
const taskRegistryMaintenanceModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./task-registry.maintenance-CxAm7DpZ.cjs")).then((n) => n.task_registry_maintenance_exports));
const staticModelCatalogResolverLoader = require_lazy_promise.createLazyImportLoader(async () => {
	const modelCatalog = await Promise.resolve().then(() => require("./model.static-catalog-CFNIavpF.cjs")).then((n) => n.model_static_catalog_exports);
	return {
		resolveManifestModel: modelCatalog.createBundledStaticCatalogModelResolver({ includeRuntimeDiscovery: true }),
		createProviderContextResolver: modelCatalog.createBundledProviderStaticCatalogContextResolver
	};
});
function loadChannelSummaryModule() {
	return channelSummaryModuleLoader.load();
}
function loadChannelPluginIdsModule() {
	return channelPluginIdsModuleLoader.load();
}
function loadLinkChannelModule() {
	return linkChannelModuleLoader.load();
}
const loadStatusSummaryRuntimeModule = require_lazy_runtime.createLazyRuntimeSurface(() => Promise.resolve().then(() => require("./status.summary.runtime-BKtRCk-B.cjs")), ({ statusSummaryRuntime }) => statusSummaryRuntime);
function loadTaskRegistryMaintenanceModule() {
	return taskRegistryMaintenanceModuleLoader.load();
}
function loadStaticModelCatalogResolvers() {
	return staticModelCatalogResolverLoader.load();
}
const buildFlags = (entry) => {
	if (!entry) return [];
	const flags = [];
	const think = entry?.thinkingLevel;
	if (typeof think === "string" && think.length > 0) flags.push(`think:${think}`);
	const verbose = entry?.verboseLevel;
	if (typeof verbose === "string" && verbose.length > 0) flags.push(`verbose:${verbose}`);
	if (entry?.fastMode === "auto") flags.push("fast:auto");
	else if (typeof entry?.fastMode === "boolean") flags.push(entry.fastMode ? "fast" : "fast:off");
	const reasoning = entry?.reasoningLevel;
	if (typeof reasoning === "string" && reasoning.length > 0) flags.push(`reasoning:${reasoning}`);
	const elevated = entry?.elevatedLevel;
	if (typeof elevated === "string" && elevated.length > 0) flags.push(`elevated:${elevated}`);
	if (entry?.systemSent) flags.push("system");
	if (entry?.abortedLastRun) flags.push("aborted");
	const sessionId = entry?.sessionId;
	if (typeof sessionId === "string" && sessionId.length > 0) flags.push(`id:${sessionId}`);
	return flags;
};
function discountRetainedLostTaskFailures(tasks, retainedLostCount) {
	if (retainedLostCount <= 0 || tasks.failures <= 0) return tasks;
	return {
		...tasks,
		failures: Math.max(0, tasks.failures - retainedLostCount)
	};
}
function hasUserPinnedModelSelection(entry) {
	if (!entry?.modelOverride) return false;
	if (entry.modelOverrideSource === "user") return true;
	if (entry.modelOverrideSource === "auto") return false;
	return !require_agent_scope.hasSessionAutoModelFallbackProvenance(entry);
}
function normalizeStatusModelPart(value) {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function resolveTrustedSessionContextTokens(params) {
	const contextTokens = typeof params.entry?.contextTokens === "number" && params.entry.contextTokens > 0 ? params.entry.contextTokens : void 0;
	if (contextTokens === void 0) return;
	if (require_agent_scope.hasSessionAutoModelFallbackProvenance(params.entry)) return contextTokens;
	const entryProvider = normalizeStatusModelPart(params.entry?.modelProvider);
	const entryModel = normalizeStatusModelPart(params.entry?.model);
	const resolvedProvider = normalizeStatusModelPart(params.provider);
	const resolvedModel = normalizeStatusModelPart(params.model);
	if (!entryModel || !resolvedModel || entryModel !== resolvedModel) return;
	if (entryProvider && resolvedProvider && entryProvider !== resolvedProvider) return;
	return contextTokens;
}
function compareSessionCandidatesByUpdatedAt(left, right) {
	return (right.updatedAt ?? 0) - (left.updatedAt ?? 0);
}
function selectRecentSessionCandidates(candidates, limit) {
	const selected = [];
	for (const candidate of candidates) {
		const insertAt = selected.findIndex((selectedCandidate) => compareSessionCandidatesByUpdatedAt(candidate, selectedCandidate) < 0);
		if (insertAt >= 0) {
			selected.splice(insertAt, 0, candidate);
			if (selected.length > limit) selected.pop();
		} else if (selected.length < limit) selected.push(candidate);
	}
	return selected;
}
function listSessionCandidates(storePath, agentId) {
	return require_session_accessor.listSessionEntries({
		...agentId ? { agentId } : {},
		storePath
	}).filter(({ sessionKey }) => sessionKey !== "global" && sessionKey !== "unknown").map(({ sessionKey, entry }) => ({
		key: sessionKey,
		entry,
		updatedAt: entry?.updatedAt ?? null
	}));
}
/** Removes session paths and recent session details from a status summary. */
function redactSensitiveStatusSummary(summary) {
	return {
		...summary,
		sessions: {
			...summary.sessions,
			paths: [],
			defaults: {
				model: null,
				contextTokens: null
			},
			recent: [],
			byAgent: summary.sessions.byAgent.map((entry) => ({
				...entry,
				path: "[redacted]",
				recent: []
			}))
		}
	};
}
/** Builds the aggregate status summary for agents, sessions, tasks, heartbeat, and channels. */
async function getStatusSummary(options = {}) {
	const { includeSensitive = true, includeChannelSummary = true } = options;
	const { classifySessionKey, resolveConfiguredStatusModelRef, resolveContextTokensForModel, resolveSessionRuntimeLabel, resolveSessionModelRef, resolveStatusModelComparisonLabel, resolveStatusModelLookupRef, waitForContextWindowCacheLoad } = await loadStatusSummaryRuntimeModule();
	const cfg = options.config ?? require_io.getRuntimeConfig();
	await waitForContextWindowCacheLoad();
	const contextSourceConfig = options.sourceConfig !== void 0 ? options.sourceConfig : require_io.projectConfigOntoRuntimeSourceSnapshot(cfg);
	const { resolveManifestModel, createProviderContextResolver } = await loadStaticModelCatalogResolvers();
	const resolveProviderContext = createProviderContextResolver({ cfg });
	const modelContextCache = /* @__PURE__ */ new Map();
	const resolveStaticModelContext = async (provider, model) => {
		if (!provider || !model) return {};
		const key = `${provider}\0${model}`;
		const cached = modelContextCache.get(key);
		if (cached) return cached;
		const resolved = (async () => {
			try {
				const entry = resolveManifestModel({
					provider,
					modelId: model
				}) ?? await resolveProviderContext({
					provider,
					modelId: model
				});
				return {
					...entry?.contextWindow ? { modelContextWindow: entry.contextWindow } : {},
					...entry?.contextTokens ? { modelContextTokens: entry.contextTokens } : {}
				};
			} catch {
				return {};
			}
		})();
		modelContextCache.set(key, resolved);
		return resolved;
	};
	const channelScopeConfig = options.sourceConfig === void 0 ? { config: cfg } : {
		config: cfg,
		activationSourceConfig: options.sourceConfig
	};
	const needsChannelPlugins = includeChannelSummary && await loadChannelPluginIdsModule().then(({ hasConfiguredChannelsForReadOnlyScope }) => hasConfiguredChannelsForReadOnlyScope(channelScopeConfig));
	const linkContext = needsChannelPlugins ? await loadLinkChannelModule().then(({ resolveLinkChannelContext }) => resolveLinkChannelContext(cfg, { sourceConfig: options.sourceConfig })) : null;
	const agentList = require_agent_list.listGatewayAgentsBasic(cfg);
	const heartbeatAgents = agentList.agents.map((agent) => {
		const summary = require_heartbeat_summary.resolveHeartbeatSummaryForAgent(cfg, agent.id);
		return {
			agentId: agent.id,
			enabled: summary.enabled,
			every: summary.every,
			everyMs: summary.everyMs
		};
	});
	const channelSummary = needsChannelPlugins ? await loadChannelSummaryModule().then(({ buildChannelSummary }) => buildChannelSummary(cfg, {
		colorize: true,
		includeAllowFrom: true,
		sourceConfig: options.sourceConfig
	})) : [];
	const queuedSystemEvents = require_system_events.peekSystemEvents(require_main_session.resolveMainSessionKey(cfg));
	const taskMaintenanceModule = await loadTaskRegistryMaintenanceModule();
	taskMaintenanceModule.configureTaskRegistryMaintenance();
	const inspectableTasks = taskMaintenanceModule.reconcileInspectableTasks();
	const rawTasks = taskMaintenanceModule.getInspectableTaskRegistrySummary(inspectableTasks);
	const taskAuditFindings = taskMaintenanceModule.getInspectableTaskAuditFindings(inspectableTasks);
	const now = Date.now();
	const taskAudit = require_task_registry_audit.summarizeActionableTaskAuditFindings(taskAuditFindings, { now });
	const taskAuditRetainedLost = require_task_registry_audit.summarizeRetainedLostTaskAuditFindings(taskAuditFindings, { now });
	const tasks = discountRetainedLostTaskFailures(rawTasks, taskAuditRetainedLost.count);
	const resolved = resolveConfiguredStatusModelRef({
		cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL
	});
	const configModel = resolved.model ?? "openrouter/auto";
	const configModelContext = await resolveStaticModelContext(resolved.provider ?? "openrouter", configModel);
	const configContextTokens = resolveContextTokensForModel({
		cfg,
		sourceCfg: contextSourceConfig,
		provider: resolved.provider ?? "openrouter",
		model: configModel,
		...configModelContext,
		contextTokensOverride: cfg.agents?.defaults?.contextTokens,
		fallbackContextTokens: 2e5,
		allowAsyncLoad: false
	}) ?? 2e5;
	const candidateCache = /* @__PURE__ */ new Map();
	const loadSessionCandidates = (storePath, agentId) => {
		const cacheKey = `${storePath}\0${agentId ?? ""}`;
		const cached = candidateCache.get(cacheKey);
		if (cached) return cached;
		const candidates = listSessionCandidates(storePath, agentId);
		candidateCache.set(cacheKey, candidates);
		return candidates;
	};
	const buildSessionRows = async (candidates, opts = {}) => Promise.all(candidates.map(async ({ key, entry, updatedAt }) => {
		const age = updatedAt ? now - updatedAt : null;
		const parsedAgentId = require_session_key.parseAgentSessionKey(key)?.agentId;
		const agentId = opts.agentIdOverride ?? parsedAgentId;
		const configuredForSession = resolveConfiguredStatusModelRef({
			cfg,
			defaultProvider: require_defaults.DEFAULT_PROVIDER,
			defaultModel: require_defaults.DEFAULT_MODEL,
			agentId
		});
		const configuredSessionModel = configuredForSession.model ?? "openrouter/auto";
		const configuredSessionModelLabel = `${configuredForSession.provider ?? "openrouter"}/${configuredSessionModel}`;
		const resolvedModel = resolveSessionModelRef(cfg, entry, opts.agentIdOverride);
		const model = resolvedModel.model ?? configuredSessionModel ?? null;
		const lookupModel = resolveStatusModelLookupRef({
			provider: resolvedModel.provider,
			model,
			defaultProvider: configuredForSession.provider ?? "openrouter"
		}) ?? resolvedModel;
		const lookupModelId = lookupModel.model ?? model;
		const modelContext = await resolveStaticModelContext(lookupModel.provider, lookupModelId ?? void 0);
		const selectedModelLabel = resolvedModel.provider && model ? `${resolvedModel.provider}/${model}` : model;
		const configuredSessionModelComparisonLabel = resolveStatusModelComparisonLabel({
			provider: configuredForSession.provider ?? "openrouter",
			model: configuredSessionModel,
			defaultProvider: require_defaults.DEFAULT_PROVIDER
		});
		const selectedModelComparisonLabel = resolveStatusModelComparisonLabel({
			provider: resolvedModel.provider,
			model,
			defaultProvider: configuredForSession.provider ?? "openrouter"
		});
		const modelSelectionDiffers = selectedModelComparisonLabel != null && configuredSessionModelComparisonLabel != null && selectedModelComparisonLabel !== configuredSessionModelComparisonLabel && !require_model_runtime_aliases.areRuntimeModelRefsEquivalent(selectedModelComparisonLabel, configuredSessionModelComparisonLabel) && (hasUserPinnedModelSelection(entry) || require_agent_scope.hasSessionActiveAutoModelFallback(entry));
		const contextTokens = resolveContextTokensForModel({
			cfg,
			sourceCfg: contextSourceConfig,
			provider: lookupModel.provider,
			model: lookupModelId,
			...modelContext,
			contextTokensOverride: resolveTrustedSessionContextTokens({
				entry,
				provider: lookupModel.provider,
				model: lookupModelId
			}),
			fallbackContextTokens: configContextTokens ?? void 0,
			allowAsyncLoad: false
		}) ?? null;
		const total = require_store.resolveSessionTotalTokens(entry);
		const totalTokensFresh = typeof entry?.totalTokens === "number" ? entry?.totalTokensFresh !== false : false;
		const remaining = contextTokens != null && total !== void 0 ? Math.max(0, contextTokens - total) : null;
		const pct = contextTokens && contextTokens > 0 && total !== void 0 ? Math.min(999, Math.round(total / contextTokens * 100)) : null;
		const runtime = resolveSessionRuntimeLabel({
			cfg,
			entry,
			provider: lookupModel.provider,
			model: lookupModelId ?? "",
			agentId,
			sessionKey: key
		});
		return {
			agentId,
			key,
			kind: classifySessionKey(key, entry),
			sessionId: entry?.sessionId,
			updatedAt,
			age,
			thinkingLevel: entry?.thinkingLevel,
			fastMode: entry?.fastMode,
			verboseLevel: entry?.verboseLevel,
			traceLevel: entry?.traceLevel,
			reasoningLevel: entry?.reasoningLevel,
			elevatedLevel: entry?.elevatedLevel,
			systemSent: entry?.systemSent,
			abortedLastRun: entry?.abortedLastRun,
			inputTokens: entry?.inputTokens,
			outputTokens: entry?.outputTokens,
			cacheRead: entry?.cacheRead,
			cacheWrite: entry?.cacheWrite,
			totalTokens: total ?? null,
			totalTokensFresh,
			remainingTokens: remaining,
			percentUsed: pct,
			model,
			configuredModel: configuredSessionModelLabel,
			selectedModel: selectedModelLabel,
			modelSelectionReason: modelSelectionDiffers ? hasUserPinnedModelSelection(entry) ? "session override" : "fallback selected" : null,
			runtime,
			contextTokens,
			flags: buildFlags(entry)
		};
	}));
	const storeSources = agentList.agents.map((agent) => ({
		agentId: agent.id,
		storePath: require_paths.resolveStorePath(cfg.session?.store, { agentId: agent.id })
	}));
	const paths = /* @__PURE__ */ new Set();
	const pathCounts = /* @__PURE__ */ new Map();
	for (const source of storeSources) {
		paths.add(source.storePath);
		pathCounts.set(source.storePath, (pathCounts.get(source.storePath) ?? 0) + 1);
	}
	const byAgent = await Promise.all(agentList.agents.map(async (agent) => {
		const storePath = require_paths.resolveStorePath(cfg.session?.store, { agentId: agent.id });
		const candidates = loadSessionCandidates(storePath, agent.id);
		const sessions = await buildSessionRows(selectRecentSessionCandidates(candidates, RECENT_SESSION_LIMIT), { agentIdOverride: agent.id });
		return {
			agentId: agent.id,
			path: storePath,
			count: candidates.length,
			recent: sessions
		};
	}));
	const allSessions = storeSources.filter((source, index, sources) => {
		return sources.findIndex((candidate) => candidate.storePath === source.storePath) === index;
	}).flatMap((source) => loadSessionCandidates(source.storePath, pathCounts.get(source.storePath) === 1 ? source.agentId : void 0));
	const recent = await buildSessionRows(selectRecentSessionCandidates(allSessions, RECENT_SESSION_LIMIT));
	const totalSessions = allSessions.length;
	const summary = {
		runtimeVersion: require_version.resolveRuntimeServiceVersion(process.env),
		linkChannel: linkContext ? {
			id: linkContext.plugin.id,
			label: linkContext.plugin.meta.label ?? "Channel",
			linked: linkContext.linked,
			authAgeMs: linkContext.authAgeMs
		} : void 0,
		heartbeat: {
			defaultAgentId: agentList.defaultId,
			agents: heartbeatAgents
		},
		channelSummary,
		queuedSystemEvents,
		tasks,
		taskAudit,
		...taskAuditRetainedLost.count > 0 ? { taskAuditRetainedLost } : {},
		sessions: {
			paths: Array.from(paths),
			count: totalSessions,
			defaults: {
				model: configModel ?? null,
				contextTokens: configContextTokens ?? null
			},
			recent,
			byAgent
		}
	};
	return includeSensitive ? summary : redactSensitiveStatusSummary(summary);
}
//#endregion
Object.defineProperty(exports, "getStatusSummary", {
	enumerable: true,
	get: function() {
		return getStatusSummary;
	}
});
Object.defineProperty(exports, "status_summary_exports", {
	enumerable: true,
	get: function() {
		return status_summary_exports;
	}
});
