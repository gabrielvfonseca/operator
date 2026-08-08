const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
require("./defaults-BplP0QgT.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_model_selection_cli = require("./model-selection-cli-PCHB2Ve6.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_cli_session = require("./cli-session-CX50GYdw.cjs");
const require_session_snapshot_merge = require("./session-snapshot-merge-BloJoO_g.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/command/session-store.ts
/**
* Updates persisted session metadata after agent command runs.
*/
const usageFormatModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./usage-format-Ed9eVdJX.cjs")).then((n) => n.usage_format_exports));
const contextModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./context-Ddgh80NW.cjs")).then((n) => n.context_exports));
async function getUsageFormatModule() {
	return await usageFormatModuleLoader.load();
}
async function getContextModule() {
	return await contextModuleLoader.load();
}
function resolvePositiveInteger(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return;
	return Math.floor(value);
}
/** Applies run result metadata, usage, and CLI bindings to a session entry. */
async function updateSessionStoreAfterAgentRun(params) {
	const { cfg, sessionId, sessionKey, storePath, sessionStore, defaultProvider, defaultModel, fallbackProvider, fallbackModel, result } = params;
	const now = Date.now();
	const touchInteraction = params.touchInteraction !== false;
	const touchActivity = params.touchActivity !== false;
	const usage = result.meta.agentMeta?.usage;
	const promptTokens = result.meta.agentMeta?.promptTokens;
	const lastCallUsage = result.meta.agentMeta?.lastCallUsage;
	const compactionTokensAfter = typeof result.meta.agentMeta?.compactionTokensAfter === "number" && Number.isFinite(result.meta.agentMeta.compactionTokensAfter) && result.meta.agentMeta.compactionTokensAfter >= 0 ? Math.floor(result.meta.agentMeta.compactionTokensAfter) : void 0;
	const compactionsThisRun = Math.max(0, result.meta.agentMeta?.compactionCount ?? 0);
	const modelUsed = result.meta.agentMeta?.model ?? fallbackModel ?? defaultModel;
	const providerUsed = result.meta.agentMeta?.provider ?? fallbackProvider ?? defaultProvider;
	const agentHarnessId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(result.meta.agentMeta?.agentHarnessId);
	const activeSessionFile = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(result.meta.agentMeta?.sessionFile);
	const runtimeContextTokens = resolvePositiveInteger(result.meta.agentMeta?.contextTokens);
	const contextBudgetStatus = result.meta.agentMeta?.contextBudgetStatus;
	const contextTokens = runtimeContextTokens !== void 0 ? runtimeContextTokens : (await getContextModule()).resolveContextTokensForModel({
		cfg,
		provider: providerUsed,
		model: modelUsed,
		contextTokensOverride: params.contextTokensOverride,
		fallbackContextTokens: 2e5,
		allowAsyncLoad: false
	}) ?? 2e5;
	const preserveUserFacingRunState = params.preserveUserFacingSessionModelState === true;
	const preserveRuntimeModel = params.preserveRuntimeModel === true || preserveUserFacingRunState;
	const hadPreExistingEntry = sessionStore[sessionKey] !== void 0;
	const entry = sessionStore[sessionKey] ?? {
		sessionId,
		updatedAt: now,
		sessionStartedAt: now
	};
	const next = {
		...entry,
		sessionId,
		updatedAt: now,
		sessionStartedAt: entry.sessionId === sessionId ? entry.sessionStartedAt ?? now : now,
		lastInteractionAt: touchInteraction ? now : entry.lastInteractionAt,
		lastActivityAt: touchActivity ? now : entry.lastActivityAt,
		...preserveRuntimeModel ? {} : { contextTokens }
	};
	if (entry.sessionId !== sessionId) {
		next.sessionFile = activeSessionFile ?? require_sessions.resolveCompactionSessionFile({
			entry,
			sessionKey,
			storePath,
			newSessionId: sessionId
		});
		next.usageFamilyKey = entry.usageFamilyKey ?? sessionKey;
		next.usageFamilySessionIds = Array.from(/* @__PURE__ */ new Set([
			...entry.usageFamilySessionIds ?? [],
			entry.sessionId,
			sessionId
		]));
	} else if (activeSessionFile) next.sessionFile = activeSessionFile;
	if (preserveRuntimeModel) {
		if (entry.model) {
			next.contextTokens = entry.contextTokens;
			if (entry.modelProvider) require_store.setSessionRuntimeModel(next, {
				provider: entry.modelProvider,
				model: entry.model
			});
			else next.model = entry.model;
		}
	} else require_store.setSessionRuntimeModel(next, {
		provider: providerUsed,
		model: modelUsed
	});
	if (!preserveUserFacingRunState) {
		if (!preserveRuntimeModel) {
			if (agentHarnessId) next.agentHarnessId = agentHarnessId;
			else if (result.meta.executionTrace?.runner === "cli") next.agentHarnessId = void 0;
		}
		if (!preserveRuntimeModel && require_model_selection_cli.isCliProvider(providerUsed, cfg)) {
			const cliSessionBinding = result.meta.agentMeta?.cliSessionBinding;
			if (result.meta.agentMeta?.clearCliSessionBinding === true) require_cli_session.clearCliSession(next, providerUsed);
			else if (cliSessionBinding?.sessionId?.trim()) require_cli_session.setCliSessionBinding(next, providerUsed, cliSessionBinding);
			else {
				const cliSessionId = result.meta.agentMeta?.sessionId?.trim();
				if (cliSessionId) require_cli_session.setCliSessionId(next, providerUsed, cliSessionId);
			}
		}
		next.abortedLastRun = result.meta.aborted ?? false;
		if (params.clearRestartRecoveryForceSafeTools && result.meta.aborted !== true) next.restartRecoveryForceSafeTools = void 0;
		if (result.meta.systemPromptReport) next.systemPromptReport = result.meta.systemPromptReport;
		if (!preserveRuntimeModel) next.contextBudgetStatus = contextBudgetStatus;
	}
	if (require_session_accessor.hasNonzeroUsage(usage) && !preserveUserFacingRunState) {
		const { estimateUsageCost, resolveModelCostConfig } = await getUsageFormatModule();
		const input = usage.input ?? 0;
		const output = usage.output ?? 0;
		const usageForContext = require_model_selection_cli.isCliProvider(providerUsed, cfg) ? lastCallUsage : lastCallUsage?.contextUsage ? lastCallUsage : usage;
		const totalTokens = require_session_accessor.deriveSessionTotalTokens({
			usage: promptTokens ? void 0 : usageForContext,
			contextTokens,
			promptTokens
		});
		const runEstimatedCostUsd = require_number_coercion.resolveNonNegativeNumber(estimateUsageCost({
			usage,
			cost: resolveModelCostConfig({
				provider: providerUsed,
				model: modelUsed,
				config: cfg
			})
		}));
		next.inputTokens = input;
		next.outputTokens = output;
		const hasUsageTotalTokens = typeof totalTokens === "number" && Number.isFinite(totalTokens) && totalTokens > 0;
		const useCompactionSnapshot = compactionTokensAfter !== void 0 && !hasUsageTotalTokens;
		if (useCompactionSnapshot) {
			next.totalTokens = compactionTokensAfter;
			next.totalTokensFresh = true;
			next.inputTokens = void 0;
			next.outputTokens = void 0;
			next.cacheRead = void 0;
			next.cacheWrite = void 0;
			next.contextBudgetStatus = void 0;
		} else if (hasUsageTotalTokens) {
			next.totalTokens = totalTokens;
			next.totalTokensFresh = true;
		} else {
			next.totalTokens = void 0;
			next.totalTokensFresh = false;
		}
		if (!useCompactionSnapshot) {
			next.cacheRead = usage.cacheRead ?? 0;
			next.cacheWrite = usage.cacheWrite ?? 0;
		}
		if (runEstimatedCostUsd !== void 0) next.estimatedCostUsd = runEstimatedCostUsd;
	} else if (compactionTokensAfter !== void 0 && !preserveUserFacingRunState) {
		next.totalTokens = compactionTokensAfter;
		next.totalTokensFresh = true;
		next.inputTokens = void 0;
		next.outputTokens = void 0;
		next.cacheRead = void 0;
		next.cacheWrite = void 0;
		next.contextBudgetStatus = void 0;
	} else if (!preserveUserFacingRunState && typeof entry.totalTokens === "number" && Number.isFinite(entry.totalTokens) && entry.totalTokens > 0) {
		next.totalTokens = entry.totalTokens;
		next.totalTokensFresh = false;
	}
	if (compactionsThisRun > 0 && !preserveUserFacingRunState) next.compactionCount = (entry.compactionCount ?? 0) + compactionsThisRun;
	const metadataPatch = preserveUserFacingRunState ? {
		updatedAt: next.updatedAt,
		...touchInteraction ? { lastInteractionAt: next.lastInteractionAt } : {}
	} : next;
	const maintenanceConfig = require_store.resolveMaintenanceConfigFromInput(cfg.session?.maintenance);
	const persisted = await require_session_accessor.patchSessionEntry({
		storePath,
		sessionKey
	}, (currentEntry, context) => {
		if (!context.existingEntry && hadPreExistingEntry || !preserveUserFacingRunState && context.existingEntry && context.existingEntry.sessionId !== entry.sessionId) return null;
		return preserveUserFacingRunState ? metadataPatch : require_session_snapshot_merge.projectSessionSnapshotChanges({
			initial: entry,
			next,
			current: currentEntry
		});
	}, {
		...preserveUserFacingRunState ? {} : { fallbackEntry: entry },
		maintenanceConfig
	});
	if (persisted) sessionStore[sessionKey] = persisted;
}
/** Clears a stored CLI session binding after a failed or invalidated run. */
async function clearCliSessionInStore(params) {
	const { provider, sessionKey, sessionStore, storePath, expectedSessionId } = params;
	const entry = sessionStore[sessionKey];
	if (!entry) return;
	const next = { ...entry };
	require_cli_session.clearCliSession(next, provider);
	next.updatedAt = Date.now();
	const persisted = await require_session_accessor.patchSessionEntry({
		storePath,
		sessionKey
	}, (currentEntry, context) => {
		if (expectedSessionId && (!context.existingEntry || currentEntry.sessionId !== expectedSessionId)) return null;
		return next;
	}, { fallbackEntry: entry });
	if (persisted) sessionStore[sessionKey] = persisted;
	return persisted ?? void 0;
}
/** Clears the one-shot fork marker before the resumed CLI process starts. */
async function consumeCliSessionForkInStore(params) {
	const { provider, sessionKey, sessionStore, storePath, expectedCliSessionId } = params;
	const entry = sessionStore[sessionKey];
	const binding = entry?.cliSessionBindings?.[provider];
	if (!entry || binding?.sessionId !== expectedCliSessionId || binding.forkNextResume !== true) return;
	const persisted = await require_session_accessor.patchSessionEntry({
		storePath,
		sessionKey
	}, (currentEntry) => {
		const currentBinding = currentEntry.cliSessionBindings?.[provider];
		if (currentBinding?.sessionId !== expectedCliSessionId || currentBinding.forkNextResume !== true) return null;
		const next = { ...currentEntry };
		const { forkNextResume: _forkNextResume, ...consumedBinding } = currentBinding;
		require_cli_session.setCliSessionBinding(next, provider, consumedBinding);
		return next;
	}, { fallbackEntry: entry });
	if (persisted) sessionStore[sessionKey] = persisted;
	return persisted ?? void 0;
}
/** Re-arms a claimed fork marker after a failed CLI turn. */
async function restoreCliSessionForkInStore(params) {
	const { provider, sessionKey, sessionStore, storePath, expectedCliSessionId } = params;
	const entry = sessionStore[sessionKey];
	const binding = entry?.cliSessionBindings?.[provider];
	if (!entry || binding?.sessionId !== expectedCliSessionId || binding.forkNextResume === true) return;
	const persisted = await require_session_accessor.patchSessionEntry({
		storePath,
		sessionKey
	}, (currentEntry) => {
		const currentBinding = currentEntry.cliSessionBindings?.[provider];
		if (currentBinding?.sessionId !== expectedCliSessionId || currentBinding.forkNextResume === true) return null;
		const next = { ...currentEntry };
		require_cli_session.setCliSessionBinding(next, provider, {
			...currentBinding,
			forkNextResume: true
		});
		return next;
	}, { fallbackEntry: entry });
	if (persisted) sessionStore[sessionKey] = persisted;
	return persisted ?? void 0;
}
/** Rebinds a claimed fork to its successor before the rest of the CLI turn can fail. */
async function persistCliSessionForkSuccessorInStore(params) {
	const { provider, sessionKey, sessionStore, storePath, expectedCliSessionId, successorCliSessionId } = params;
	const entry = sessionStore[sessionKey];
	if (!entry || successorCliSessionId === expectedCliSessionId) return;
	const persisted = await require_session_accessor.patchSessionEntry({
		storePath,
		sessionKey
	}, (currentEntry) => {
		const currentBinding = currentEntry.cliSessionBindings?.[provider];
		if (currentBinding?.sessionId !== expectedCliSessionId || currentBinding.forkNextResume === true) return null;
		const next = { ...currentEntry };
		require_cli_session.setCliSessionBinding(next, provider, {
			...currentBinding,
			sessionId: successorCliSessionId,
			forceReuse: true
		});
		return next;
	}, { fallbackEntry: entry });
	if (persisted) sessionStore[sessionKey] = persisted;
	return persisted ?? void 0;
}
/** Records CLI compaction metadata on the persisted session entry. */
async function recordCliCompactionInStore(params) {
	const { provider, sessionKey, sessionStore, storePath, expectedSessionId } = params;
	const entry = sessionStore[sessionKey];
	if (!entry) return;
	const next = { ...entry };
	require_cli_session.clearCliSession(next, provider);
	next.compactionCount = (entry.compactionCount ?? 0) + 1;
	next.updatedAt = Date.now();
	const newSessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.newSessionId);
	const explicitNewSessionFile = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.newSessionFile);
	const sessionIdChanged = Boolean(newSessionId && newSessionId !== entry.sessionId);
	const sessionFileChanged = Boolean(explicitNewSessionFile && explicitNewSessionFile !== entry.sessionFile);
	if (sessionIdChanged && newSessionId) {
		next.sessionId = newSessionId;
		next.sessionFile = explicitNewSessionFile ?? require_sessions.resolveCompactionSessionFile({
			entry,
			sessionKey,
			storePath,
			newSessionId
		});
		next.usageFamilyKey = entry.usageFamilyKey ?? sessionKey;
		next.usageFamilySessionIds = Array.from(/* @__PURE__ */ new Set([
			...entry.usageFamilySessionIds ?? [],
			entry.sessionId,
			newSessionId
		]));
	} else if (sessionFileChanged && explicitNewSessionFile) next.sessionFile = explicitNewSessionFile;
	const tokensAfterCompaction = require_number_coercion.resolveNonNegativeNumber(params.tokensAfter);
	next.contextBudgetStatus = void 0;
	if (tokensAfterCompaction !== void 0) {
		next.totalTokens = Math.floor(tokensAfterCompaction);
		next.totalTokensFresh = true;
		next.inputTokens = void 0;
		next.outputTokens = void 0;
		next.cacheRead = void 0;
		next.cacheWrite = void 0;
	} else {
		next.totalTokensFresh = false;
		next.inputTokens = void 0;
		next.outputTokens = void 0;
		next.cacheRead = void 0;
		next.cacheWrite = void 0;
	}
	const persisted = await require_session_accessor.patchSessionEntry({
		storePath,
		sessionKey
	}, (currentEntry, context) => {
		if (expectedSessionId && (!context.existingEntry || currentEntry.sessionId !== expectedSessionId)) return null;
		return next;
	}, { fallbackEntry: entry });
	if (persisted) sessionStore[sessionKey] = persisted;
	return persisted ?? void 0;
}
//#endregion
Object.defineProperty(exports, "clearCliSessionInStore", {
	enumerable: true,
	get: function() {
		return clearCliSessionInStore;
	}
});
Object.defineProperty(exports, "consumeCliSessionForkInStore", {
	enumerable: true,
	get: function() {
		return consumeCliSessionForkInStore;
	}
});
Object.defineProperty(exports, "persistCliSessionForkSuccessorInStore", {
	enumerable: true,
	get: function() {
		return persistCliSessionForkSuccessorInStore;
	}
});
Object.defineProperty(exports, "recordCliCompactionInStore", {
	enumerable: true,
	get: function() {
		return recordCliCompactionInStore;
	}
});
Object.defineProperty(exports, "restoreCliSessionForkInStore", {
	enumerable: true,
	get: function() {
		return restoreCliSessionForkInStore;
	}
});
Object.defineProperty(exports, "updateSessionStoreAfterAgentRun", {
	enumerable: true,
	get: function() {
		return updateSessionStoreAfterAgentRun;
	}
});
