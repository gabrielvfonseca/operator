const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
const require_account_lookup = require("./account-lookup-Bt7ehEAK.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_token_format = require("./token-format-CytezBZb.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_task_status = require("./task-status-CjWQHsl4.cjs");
const require_task_status_access = require("./task-status-access-B4LbHuEr.cjs");
const require_format_duration = require("./format-duration-BV8edXFT.cjs");
const require_session_runtime_compat = require("./session-runtime-compat-B8Zu61mN.cjs");
const require_sessions_helpers = require("./sessions-helpers-BzXDIb2t.cjs");
const require_context = require("./context-Ddgh80NW.cjs");
const require_fast_mode = require("./fast-mode-0YvHCt-K.cjs");
const require_usage_format = require("./usage-format-Ed9eVdJX.cjs");
const require_model_auth_label = require("./model-auth-label-oN9N-rOu.cjs");
const require_group_activation = require("./group-activation-Diuzg5QT.cjs");
const require_model_runtime = require("./model-runtime-CROqjzrf.cjs");
const require_provider_usage_load = require("./provider-usage.load-felEzwOj.cjs");
const require_provider_usage = require("./provider-usage-ChsIx4Rc.cjs");
const require_codex_synthetic_usage = require("./codex-synthetic-usage-DialzaAT.cjs");
const require_fallback_notice_state = require("./fallback-notice-state-BYWmnLoR.cjs");
const require_status_plugin_health = require("./status-plugin-health-Drs1HGs2.cjs");
const require_session_cost_usage = require("./session-cost-usage-CDjHcS0f.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/status/status-runtime-lines.ts
function buildStatusUptimeLine() {
	const format = (ms) => require_format_duration.formatDurationCompact(ms, { spaced: true }) ?? "0s";
	const gatewayMs = Math.max(0, Math.round(process.uptime() * 1e3));
	const systemMs = Math.max(0, Math.round(node_os.default.uptime() * 1e3));
	return `⏱️ Uptime: gateway ${format(gatewayMs)} · system ${format(systemMs)}`;
}
async function resolveSessionCostLine(params) {
	const sessionId = params.sessionEntry?.sessionId?.trim();
	if (!sessionId) return;
	let sessionFile;
	try {
		const pathOpts = require_paths.resolveSessionFilePathOptions({
			storePath: params.storePath,
			agentId: params.agentId
		});
		sessionFile = require_session_cost_usage.resolveExistingUsageSessionFile({
			sessionId,
			sessionEntry: params.sessionEntry,
			sessionFile: require_paths.resolveSessionFilePath(sessionId, params.sessionEntry, pathOpts),
			agentId: params.agentId
		});
	} catch {
		return;
	}
	if (!sessionFile) return;
	const now = Date.now();
	const date = new Date(now);
	const startMs = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	let timeout;
	try {
		const loaded = await Promise.race([require_session_cost_usage.loadSessionCostSummariesFromCache({
			sessions: [{
				sessionId,
				sessionFile
			}],
			config: params.cfg,
			agentId: params.agentId,
			startMs,
			endMs: now,
			dayBucket: {
				mode: "utc-offset",
				utcOffsetMinutes: -date.getTimezoneOffset()
			},
			requestRefresh: false
		}), new Promise((_, reject) => {
			timeout = setTimeout(() => reject(/* @__PURE__ */ new Error("session cost timeout")), 3500);
		})]).finally(() => {
			if (timeout) clearTimeout(timeout);
		});
		const summary = loaded.cacheStatus.status === "fresh" ? loaded.summaries[0] : null;
		if (!summary) return;
		const cost = summary.missingCostEntries > 0 ? `missing cost: ${require_session_cost_usage.formatMissingCostEntries(summary)}` : require_usage_format.formatUsd(summary.totalCost);
		return `💵 ${cost ? `${cost} · ` : ""}${require_token_format.formatTokenCount(summary.totalTokens)} tok (today)`;
	} catch {
		return;
	}
}
async function appendSessionCostLine(usageLine, cfg, agentId, sessionEntry, storePath) {
	const line = await resolveSessionCostLine({
		cfg,
		agentId,
		...sessionEntry ? { sessionEntry } : {},
		...storePath ? { storePath } : {}
	});
	return line ? [usageLine, line].filter(Boolean).join("\n") : usageLine;
}
//#endregion
//#region src/status/status-text.ts
const USAGE_OAUTH_ONLY_PROVIDERS = /* @__PURE__ */ new Set([
	"anthropic",
	"github-copilot",
	"google-gemini-cli",
	"openai"
]);
const CODEX_APP_SERVER_HOME_DIRNAME = "codex-home";
function resolveStatusChannelFeatureLine(params) {
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.statusChannel) !== "telegram") return;
	const telegramConfig = params.cfg.channels?.telegram;
	const accountId = require_account_id.normalizeAccountId(params.statusAccountId ?? params.sessionEntry?.lastAccountId ?? params.sessionEntry?.origin?.accountId ?? telegramConfig?.defaultAccount);
	const accountConfig = require_account_lookup.resolveNormalizedAccountEntry(telegramConfig?.accounts, accountId, require_account_id.normalizeAccountId);
	if ((accountConfig?.richMessages ?? telegramConfig?.richMessages) === true) return "Telegram rich messages: on · Bot API 10.1 sendRichMessage enabled";
	return accountConfig?.richMessages === false ? "Telegram rich messages: off · enable richMessages for this Telegram account" : "Telegram rich messages: off · set channels.telegram.richMessages=true for tables/details/rich media";
}
const loadStatusMessageRuntime = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./status-message.runtime-DFaEuSnR.cjs")).then((module) => module.loadStatusMessageRuntimeModule()), { cacheRejections: true });
const loadAgentHarnessSelectionRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./selection-BpqUSi0C.cjs")).then((n) => n.selection_exports));
const loadStatusSubagentsRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./status-subagents.runtime-BOzkAxui.cjs")));
const loadStatusQueueRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./status-queue.runtime-T8uysgeP.cjs")));
const loadStatusPluginHealthRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./status-plugin-health.runtime-CBO6eNyq.cjs")));
function resolveStatusRuntimeContextTokens(params) {
	return require_context.resolveContextTokensForModel({
		cfg: params.cfg,
		provider: params.provider,
		model: params.model,
		allowAsyncLoad: false
	});
}
function shouldLoadUsageSummary(params) {
	if (!params.provider) return false;
	if (!USAGE_OAUTH_ONLY_PROVIDERS.has(params.provider)) return true;
	const auth = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.selectedModelAuth);
	return Boolean(params.credentialType === "oauth" || params.credentialType === "token" || auth?.startsWith("oauth") || auth?.startsWith("token"));
}
function resolveCodexSyntheticUsageAuthProfileId(params) {
	const normalizedProfileId = params.profileId?.trim();
	if (!normalizedProfileId) return;
	try {
		const credential = require_store.ensureAuthProfileStore(params.agentDir, {
			allowKeychainPrompt: false,
			config: params.cfg,
			readOnly: true,
			syncExternalCli: false
		}).profiles[normalizedProfileId];
		if (!credential) return;
		const credentialProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(credential.provider);
		return require_provider_auth_aliases.resolveProviderIdForAuth(credential.provider, { config: params.cfg }) === "openai" || credentialProvider === "openai-codex" || credentialProvider === "codex-cli" ? normalizedProfileId : void 0;
	} catch {
		return;
	}
}
function formatSessionTaskLine(sessionKey) {
	const snapshot = require_task_status.buildTaskStatusSnapshot(require_task_status_access.listTasksForSessionKeyForStatus(sessionKey));
	const task = snapshot.focus;
	if (!task) return;
	const headline = snapshot.activeCount > 0 ? `${snapshot.activeCount} active · ${snapshot.totalCount} total` : snapshot.recentFailureCount > 0 ? `${snapshot.recentFailureCount} recent failure${snapshot.recentFailureCount === 1 ? "" : "s"}` : "recently finished";
	const title = require_task_status.formatTaskStatusTitle(task);
	const detail = require_task_status.formatTaskStatusDetail(task);
	const parts = [
		headline,
		task.runtime,
		title,
		detail
	].filter(Boolean);
	return parts.length ? `📌 Tasks: ${parts.join(" · ")}` : void 0;
}
async function resolveStatusHarnessId(params) {
	try {
		const { selectAgentHarness } = await loadAgentHarnessSelectionRuntime();
		const agentHarnessRuntimeOverride = require_session_runtime_compat.resolveSessionRuntimeOverrideForProvider({
			provider: params.provider,
			entry: params.sessionEntry,
			cfg: params.cfg
		});
		return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(selectAgentHarness({
			provider: params.provider,
			modelId: params.model,
			config: params.cfg,
			agentId: params.agentId,
			sessionKey: params.sessionKey,
			agentHarnessRuntimeOverride
		}).id) || void 0;
	} catch {
		return;
	}
}
function resolveStatusRuntimeProvider(params) {
	const harness = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.effectiveHarness);
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.provider);
	if (harness === "codex" && (provider === "openai" || provider === "codex")) return "openai";
	if (harness === "claude-cli" && provider === "anthropic") return "claude-cli";
	return params.provider;
}
function resolveStatusCodexCliCredentialsHome(params) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.effectiveHarness) === "codex" ? node_path.default.join(params.agentDir, CODEX_APP_SERVER_HOME_DIRNAME) : void 0;
}
function formatAgentTaskCountsLine(agentId) {
	const snapshot = require_task_status.buildTaskStatusSnapshot(require_task_status_access.listTasksForAgentIdForStatus(agentId));
	if (snapshot.totalCount === 0) return;
	return `📌 Tasks: ${snapshot.activeCount} active · ${snapshot.totalCount} total · agent-local`;
}
async function resolveRuntimePluginHealthLine() {
	try {
		const { collectRuntimePluginHealthSnapshot } = await loadStatusPluginHealthRuntime();
		return require_status_plugin_health.formatCompactPluginHealthLine(collectRuntimePluginHealthSnapshot());
	} catch {
		return "⚠️ Plugins: health unavailable";
	}
}
async function buildStatusText(params) {
	const { cfg, sessionEntry, sessionKey, parentSessionKey, sessionScope, storePath, statusChannel, provider, model, contextTokens, resolvedThinkLevel, resolvedFastMode, resolvedVerboseLevel, resolvedReasoningLevel, resolvedElevatedLevel, resolveDefaultThinkingLevel, isGroup, defaultGroupActivation } = params;
	const statusAgentId = sessionKey ? require_agent_scope.resolveSessionAgentId({
		sessionKey,
		config: cfg
	}) : require_agent_scope_config.resolveDefaultAgentId(cfg);
	const statusAgentDir = require_agent_scope_config.resolveAgentDir(cfg, statusAgentId);
	const statusWorkspaceDir = params.workspaceDir ?? sessionEntry?.spawnedWorkspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(cfg, statusAgentId);
	const selectedProvider = sessionEntry?.providerOverride?.trim() ?? provider;
	const selectedModel = sessionEntry?.modelOverride?.trim() ?? model;
	const modelRefs = require_model_runtime.resolveSelectedAndActiveModel({
		selectedProvider,
		selectedModel,
		sessionEntry,
		parseSelectedProvider: Boolean(sessionEntry?.modelOverride?.trim() && !sessionEntry?.providerOverride?.trim())
	});
	const selectedLookupProvider = modelRefs.selected.provider || selectedProvider || provider;
	const selectedLookupModel = modelRefs.selected.model || selectedModel || model;
	const effectiveHarness = params.resolvedHarness ?? await resolveStatusHarnessId({
		cfg,
		provider: selectedLookupProvider,
		model: selectedLookupModel,
		agentId: statusAgentId,
		sessionKey,
		sessionEntry
	});
	const codexCliCredentialsHome = resolveStatusCodexCliCredentialsHome({
		agentDir: statusAgentDir,
		effectiveHarness
	});
	const selectedStatusProvider = resolveStatusRuntimeProvider({
		provider: selectedLookupProvider,
		effectiveHarness
	});
	const selectedAuthProviders = require_openai_routing.listOpenAIAuthProfileProvidersForAgentRuntime({
		provider: selectedLookupProvider,
		harnessRuntime: effectiveHarness,
		config: cfg
	});
	const activeProvider = modelRefs.active.provider || provider;
	const activeStatusProvider = resolveStatusRuntimeProvider({
		provider: activeProvider,
		effectiveHarness
	});
	const activeAuthProviders = require_openai_routing.listOpenAIAuthProfileProvidersForAgentRuntime({
		provider: activeProvider,
		harnessRuntime: effectiveHarness,
		config: cfg
	});
	let selectedModelAuth = Object.hasOwn(params, "modelAuthOverride") ? params.modelAuthOverride : require_model_auth_label.resolveModelAuthLabel({
		provider: selectedStatusProvider,
		acceptedProviderIds: selectedAuthProviders,
		cfg,
		sessionEntry,
		agentDir: statusAgentDir,
		workspaceDir: statusWorkspaceDir,
		codexCliCredentialsHome,
		includeExternalProfiles: false
	});
	const activeModelAuth = Object.hasOwn(params, "activeModelAuthOverride") ? params.activeModelAuthOverride : modelRefs.activeDiffers ? require_model_auth_label.resolveModelAuthLabel({
		provider: activeStatusProvider,
		acceptedProviderIds: activeAuthProviders,
		cfg,
		sessionEntry,
		agentDir: statusAgentDir,
		workspaceDir: statusWorkspaceDir,
		codexCliCredentialsHome,
		includeExternalProfiles: false
	}) : selectedModelAuth;
	const runtimeAliasModelEquivalent = require_model_runtime_aliases.areRuntimeModelRefsEquivalent(modelRefs.selected.label, modelRefs.active.label, { config: cfg });
	const fallbackState = require_fallback_notice_state.resolveActiveFallbackState({
		selectedModelRef: modelRefs.selected.label || "unknown",
		activeModelRef: modelRefs.active.label || "unknown",
		config: cfg,
		state: sessionEntry
	});
	if (require_model_runtime_aliases.shouldPreferActiveRuntimeAliasAuthLabel({
		runtimeAliasModelEquivalent,
		selectedAuthLabel: selectedModelAuth,
		activeAuthLabel: activeModelAuth
	})) selectedModelAuth = activeModelAuth;
	const activeRuntimeIsAuthoritative = !modelRefs.activeDiffers || fallbackState.active || require_agent_scope.hasSessionAutoModelFallbackProvenance(sessionEntry) || runtimeAliasModelEquivalent;
	const usageAuthLabel = activeRuntimeIsAuthoritative ? activeModelAuth : selectedModelAuth;
	const usageStatusProvider = activeRuntimeIsAuthoritative ? activeStatusProvider : selectedStatusProvider;
	const usageProvider = activeRuntimeIsAuthoritative ? activeProvider : selectedLookupProvider;
	const selectedUsageCredentialType = require_codex_synthetic_usage.resolveUsageCredentialType(usageAuthLabel);
	const useCodexSyntheticUsage = selectedUsageCredentialType !== "api_key" && require_codex_synthetic_usage.shouldUseCodexSyntheticUsageForRuntime({
		provider: usageStatusProvider,
		effectiveHarness,
		sessionHarnessId: sessionEntry?.agentHarnessId
	});
	const codexUsageAuthProfileId = useCodexSyntheticUsage ? resolveCodexSyntheticUsageAuthProfileId({
		profileId: sessionEntry?.authProfileOverride,
		cfg,
		agentDir: statusAgentDir
	}) : void 0;
	const usageCredentialType = useCodexSyntheticUsage ? "token" : selectedUsageCredentialType;
	const currentUsageProvider = require_provider_usage_load.resolveUsageProviderId(usageStatusProvider, { credentialType: usageCredentialType }) ?? require_provider_usage_load.resolveUsageProviderId(usageProvider, { credentialType: usageCredentialType });
	let usageLine = null;
	if (currentUsageProvider && shouldLoadUsageSummary({
		provider: currentUsageProvider,
		selectedModelAuth: usageAuthLabel,
		credentialType: usageCredentialType
	})) try {
		const usageSummaryTimeoutMs = useCodexSyntheticUsage ? 8e3 : 3500;
		let usageTimeout;
		const usageEntry = (await Promise.race([require_provider_usage_load.loadProviderUsageSummary({
			timeoutMs: usageSummaryTimeoutMs,
			providers: [currentUsageProvider],
			agentDir: statusAgentDir,
			workspaceDir: statusWorkspaceDir,
			config: cfg,
			auth: useCodexSyntheticUsage ? [require_codex_synthetic_usage.buildCodexSyntheticUsageAuth({ authProfileId: codexUsageAuthProfileId })] : void 0
		}), new Promise((_, reject) => {
			usageTimeout = setTimeout(() => reject(/* @__PURE__ */ new Error("usage summary timeout")), usageSummaryTimeoutMs);
		})]).finally(() => {
			if (usageTimeout) clearTimeout(usageTimeout);
		})).providers[0];
		if (usageEntry && !usageEntry.error && (usageEntry.windows.length > 0 || Boolean(usageEntry.billing?.length) || Boolean(usageEntry.summary?.trim()))) {
			const summaryLine = require_provider_usage.formatUsageWindowSummary(usageEntry, {
				now: Date.now(),
				maxWindows: 2,
				includeResets: true
			});
			if (summaryLine) usageLine = `📊 Usage: ${summaryLine}`;
		}
	} catch {
		usageLine = null;
	}
	usageLine = await appendSessionCostLine(usageLine, cfg, statusAgentId, sessionEntry, storePath);
	const { getFollowupQueueDepth, resolveQueueSettings } = await loadStatusQueueRuntime();
	const queueSettings = resolveQueueSettings({
		cfg,
		channel: statusChannel,
		sessionEntry
	});
	const queueKey = sessionKey ?? sessionEntry?.sessionId;
	const queueDepth = queueKey ? getFollowupQueueDepth(queueKey) : 0;
	const queueOverrides = Boolean(sessionEntry?.queueDebounceMs ?? sessionEntry?.queueCap ?? sessionEntry?.queueDrop);
	let subagentsLine;
	let taskLine;
	if (sessionKey) {
		const { mainKey, alias } = require_sessions_helpers.resolveMainSessionAlias(cfg);
		const requesterKey = require_sessions_helpers.resolveInternalSessionKey({
			key: sessionKey,
			alias,
			mainKey
		});
		taskLine = params.skipDefaultTaskLookup ? params.taskLineOverride : params.taskLineOverride ?? formatSessionTaskLine(requesterKey);
		if (!taskLine && !params.skipDefaultTaskLookup) taskLine = formatAgentTaskCountsLine(statusAgentId);
		const { buildSubagentsStatusLine, countPendingDescendantRuns, listControlledSubagentRuns } = await loadStatusSubagentsRuntime();
		subagentsLine = buildSubagentsStatusLine({
			runs: listControlledSubagentRuns(requesterKey),
			verboseEnabled: resolvedVerboseLevel && resolvedVerboseLevel !== "off",
			pendingDescendantsForRun: (entry) => countPendingDescendantRuns(entry.childSessionKey)
		});
	}
	const groupActivation = isGroup ? require_group_activation.normalizeGroupActivation(sessionEntry?.groupActivation) ?? defaultGroupActivation() : void 0;
	const agentDefaults = cfg.agents?.defaults ?? {};
	const agentConfig = require_agent_scope_config.resolveAgentConfig(cfg, statusAgentId);
	const effectiveFastMode = resolvedFastMode ?? require_fast_mode.resolveFastModeState({
		cfg,
		provider,
		model,
		agentId: statusAgentId,
		sessionEntry
	}).mode;
	const agentFallbacksOverride = require_agent_scope.resolveAgentModelFallbacksOverride(cfg, statusAgentId);
	const configuredDefaultRef = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg,
		agentId: statusAgentId,
		allowPluginNormalization: false
	});
	const configuredDefaultModelLabel = `${configuredDefaultRef.provider}/${configuredDefaultRef.model}`;
	const pluginHealthLine = Object.hasOwn(params, "pluginHealthLineOverride") ? params.pluginHealthLineOverride : await resolveRuntimePluginHealthLine();
	const channelFeatureLine = resolveStatusChannelFeatureLine({
		cfg,
		statusChannel,
		statusAccountId: params.statusAccountId,
		sessionEntry
	});
	const { buildStatusMessage } = await loadStatusMessageRuntime();
	await require_context.waitForContextWindowCacheLoad();
	const explicitThinkingDefault = agentConfig?.thinkingDefault ?? agentDefaults.thinkingDefault;
	const configuredContextTokens = typeof agentConfig?.contextTokens === "number" && agentConfig.contextTokens > 0 ? agentConfig.contextTokens : typeof agentDefaults.contextTokens === "number" && agentDefaults.contextTokens > 0 ? agentDefaults.contextTokens : void 0;
	const runtimeContextTokens = resolveStatusRuntimeContextTokens({
		cfg,
		provider: activeStatusProvider,
		model: modelRefs.active.model || model
	});
	const selectedContextTokens = resolveStatusRuntimeContextTokens({
		cfg,
		provider: selectedStatusProvider,
		model: modelRefs.selected.model || selectedLookupModel
	});
	const statusAgentContextTokens = typeof contextTokens === "number" && contextTokens > 0 && (activeRuntimeIsAuthoritative || contextTokens === configuredContextTokens || contextTokens === selectedContextTokens) ? contextTokens : void 0;
	const statusRuntimeContextTokens = activeRuntimeIsAuthoritative ? runtimeContextTokens ?? (fallbackState.active && typeof contextTokens === "number" && contextTokens > 0 ? contextTokens : void 0) : void 0;
	const effectiveThinkLevel = require_thinking.resolveSupportedThinkingLevel({
		provider: selectedLookupProvider,
		model: selectedLookupModel,
		level: resolvedThinkLevel ?? explicitThinkingDefault ?? await resolveDefaultThinkingLevel() ?? sessionEntry?.thinkingLevel ?? "off",
		agentRuntime: effectiveHarness
	});
	return buildStatusMessage({
		config: cfg,
		agent: {
			...agentDefaults,
			model: {
				...require_model_input.toAgentModelListLike(agentDefaults.model),
				primary: params.primaryModelLabelOverride ?? `${provider}/${model}`,
				...agentFallbacksOverride === void 0 ? {} : { fallbacks: agentFallbacksOverride }
			},
			...statusAgentContextTokens !== void 0 ? { contextTokens: statusAgentContextTokens } : {},
			thinkingDefault: explicitThinkingDefault,
			verboseDefault: agentDefaults.verboseDefault,
			reasoningDefault: agentConfig?.reasoningDefault ?? agentDefaults.reasoningDefault,
			elevatedDefault: agentDefaults.elevatedDefault
		},
		agentId: statusAgentId,
		configuredDefaultModelLabel,
		explicitConfiguredContextTokens: configuredContextTokens,
		runtimeContextTokens: statusRuntimeContextTokens,
		sessionEntry,
		sessionKey,
		parentSessionKey,
		sessionScope,
		sessionStorePath: storePath,
		groupActivation,
		resolvedThink: effectiveThinkLevel,
		resolvedFast: effectiveFastMode,
		resolvedHarness: effectiveHarness,
		resolvedVerbose: resolvedVerboseLevel,
		resolvedReasoning: resolvedReasoningLevel,
		resolvedElevated: resolvedElevatedLevel,
		modelAuth: selectedModelAuth,
		activeModelAuth,
		uptimeLine: buildStatusUptimeLine(),
		usageLine: usageLine ?? void 0,
		queue: {
			mode: queueSettings.mode,
			depth: queueDepth,
			debounceMs: queueSettings.debounceMs,
			cap: queueSettings.cap,
			dropPolicy: queueSettings.dropPolicy,
			showDetails: queueOverrides
		},
		subagentsLine,
		taskLine,
		pluginHealthLine,
		channelFeatureLine,
		mediaDecisions: params.mediaDecisions,
		includeTranscriptUsage: params.includeTranscriptUsage ?? true
	});
}
//#endregion
Object.defineProperty(exports, "buildStatusText", {
	enumerable: true,
	get: function() {
		return buildStatusText;
	}
});
