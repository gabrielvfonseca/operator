const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_openclaw_agent_db = require("./openclaw-agent-db-CMNDs1oU.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
require("./delivery-info-DRjJZi5w.cjs");
const require_session_state_events = require("./session-state-events-B4SfvxiO.cjs");
const require_token_format = require("./token-format-CytezBZb.cjs");
require("./lifecycle-D3m53H2V.cjs");
require("./reset-DL3L8VC3.cjs");
require("./session-key-DBTOYACI.cjs");
require("./transcript-BHT2QzlI.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/config/sessions/combined-store-gateway.ts
function isStorePathTemplate(store) {
	return typeof store === "string" && store.includes("{agentId}");
}
function loadGatewayStoreEntries(params) {
	return Object.fromEntries(require_session_accessor.listSessionEntries({
		agentId: params.agentId,
		clone: false,
		storePath: params.storePath
	}).map(({ sessionKey, entry }) => [sessionKey, entry]));
}
function mergeSessionEntryIntoCombined(params) {
	const { cfg, combined, entry, agentId, canonicalKey } = params;
	const existing = combined[canonicalKey];
	if (existing && (existing.updatedAt ?? 0) > (entry.updatedAt ?? 0)) {
		const spawnedBy = require_session_accessor.canonicalizeSpawnedByForAgent(cfg, agentId, existing.spawnedBy ?? entry.spawnedBy);
		combined[canonicalKey] = {
			...entry,
			...existing,
			spawnedBy
		};
		return;
	}
	const spawnedBy = require_session_accessor.canonicalizeSpawnedByForAgent(cfg, agentId, entry.spawnedBy ?? existing?.spawnedBy);
	if (!existing && entry.spawnedBy === spawnedBy) combined[canonicalKey] = entry;
	else combined[canonicalKey] = {
		...existing,
		...entry,
		spawnedBy
	};
}
/** Loads and canonicalizes session entries for gateway views across one or more agent stores. */
function loadCombinedSessionStoreForGateway(cfg, opts = {}) {
	const storeConfig = cfg.session?.store;
	if (storeConfig && !isStorePathTemplate(storeConfig)) {
		const storePath = require_paths.resolveStorePath(storeConfig);
		const defaultAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg));
		const store = loadGatewayStoreEntries({
			agentId: defaultAgentId,
			storePath
		});
		const combined = {};
		for (const [key, entry] of Object.entries(store)) mergeSessionEntryIntoCombined({
			cfg,
			combined,
			entry,
			agentId: defaultAgentId,
			canonicalKey: require_session_accessor.resolveStoredSessionKeyForAgentStore({
				cfg,
				agentId: defaultAgentId,
				sessionKey: key
			})
		});
		return {
			storePath,
			store: combined
		};
	}
	const requestedAgentId = typeof opts.agentId === "string" && opts.agentId.trim() ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(opts.agentId) : void 0;
	const targets = requestedAgentId ? require_targets.resolveAgentSessionStoreTargetsSync(cfg, requestedAgentId) : opts.configuredAgentsOnly === true ? require_targets.resolveSessionStoreTargets(cfg, { allAgents: true }) : require_targets.resolveAllAgentSessionStoreTargetsSync(cfg);
	const combined = {};
	for (const target of targets) {
		const agentId = target.agentId;
		const storePath = target.storePath;
		const store = loadGatewayStoreEntries({
			agentId,
			storePath
		});
		for (const [key, entry] of Object.entries(store)) mergeSessionEntryIntoCombined({
			cfg,
			combined,
			entry,
			agentId,
			canonicalKey: require_session_accessor.resolveStoredSessionKeyForAgentStore({
				cfg,
				agentId,
				sessionKey: key
			})
		});
	}
	return {
		storePath: targets.length === 1 ? (0, _gabrielvfonseca_normalization_core.expectDefined)(targets[0], "targets entry at 0").storePath : typeof storeConfig === "string" && storeConfig.trim() ? storeConfig.trim() : "(multiple)",
		store: combined
	};
}
//#endregion
//#region src/config/sessions/compaction-session-file.ts
function resolveCompactionSessionFile(params) {
	const pathOpts = require_paths.resolveSessionFilePathOptions({
		agentId: require_session_key.resolveAgentIdFromSessionKey(params.sessionKey),
		storePath: params.storePath
	});
	const rewrittenSessionFile = require_store.rewriteSessionFileForNewSessionId({
		sessionFile: params.entry.sessionFile,
		previousSessionId: params.entry.sessionId,
		nextSessionId: params.newSessionId
	});
	const normalizedRewrittenSessionFile = rewrittenSessionFile && node_path.default.isAbsolute(rewrittenSessionFile) ? require_store.canonicalizeAbsoluteSessionFilePath(rewrittenSessionFile) : rewrittenSessionFile;
	return require_paths.resolveSessionFilePath(params.newSessionId, normalizedRewrittenSessionFile ? { sessionFile: normalizedRewrittenSessionFile } : void 0, pathOpts);
}
//#endregion
//#region src/config/sessions/goals.ts
const MODEL_UPDATABLE_SESSION_GOAL_STATUSES = ["complete", "blocked"];
const TERMINAL_GOAL_STATUSES = /* @__PURE__ */ new Set(["complete"]);
function nowMs(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : Date.now();
}
function normalizeTokenCount(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : void 0;
}
function resolveEntryFreshTotalTokens(entry) {
	return normalizeTokenCount(require_store.resolveFreshSessionTotalTokens(entry));
}
function resolveEntryGoalStartTokens(entry) {
	return resolveEntryFreshTotalTokens(entry) ?? 0;
}
function normalizeTokenBudget(value) {
	const normalized = normalizeTokenCount(value);
	return normalized && normalized > 0 ? normalized : void 0;
}
function cloneGoal(goal) {
	return { ...goal };
}
function recordGoalChange(options, entry, summary) {
	require_session_state_events.recordSessionGoalChanged({
		sessionKey: options.sessionKey,
		entry,
		actor: options.actor,
		agentId: options.agentId,
		summary
	});
}
function resolveSessionGoalDisplayState(entry, now, options) {
	return accountGoalUsage(entry, nowMs(now), options);
}
function accountGoalUsage(entry, now, options) {
	const goal = entry.goal;
	if (!goal) return;
	const totalTokens = resolveEntryFreshTotalTokens(entry);
	const hasFreshStart = goal.tokenStartFresh !== false;
	const shouldHoldStaleStart = !hasFreshStart && options?.adoptFreshBaseline === false;
	const shouldAdoptFreshStart = !shouldHoldStaleStart && totalTokens !== void 0 && !hasFreshStart;
	const tokenStart = shouldAdoptFreshStart ? totalTokens : normalizeTokenCount(goal.tokenStart) ?? totalTokens ?? 0;
	const tokensUsed = totalTokens === void 0 || shouldAdoptFreshStart || shouldHoldStaleStart ? goal.tokensUsed : Math.max(goal.tokensUsed, Math.max(0, totalTokens - tokenStart));
	const next = {
		...goal,
		tokenStart,
		tokenStartFresh: hasFreshStart || shouldAdoptFreshStart,
		tokensUsed
	};
	if (next.status === "active" && next.tokenBudget !== void 0 && tokensUsed >= next.tokenBudget) {
		next.status = "budget_limited";
		next.budgetLimitedAt = now;
		next.updatedAt = now;
	}
	return next;
}
function goalsEqual(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}
function formatSessionGoalStatus(goal) {
	if (!goal) return "No goal for this session.\nStart one with /goal start <objective>.";
	const budget = goal.tokenBudget === void 0 ? "" : `\nToken budget: ${require_token_format.formatTokenCount(goal.tokensUsed)}/${require_token_format.formatTokenCount(goal.tokenBudget)}`;
	const note = goal.lastStatusNote ? `\nNote: ${goal.lastStatusNote}` : "";
	const commands = resolveGoalCommandHint(goal.status);
	return [
		"Goal",
		`Status: ${goal.status}`,
		`Objective: ${goal.objective}`,
		`Tokens used: ${require_token_format.formatTokenCount(goal.tokensUsed)}`,
		...budget ? [budget.slice(1)] : [],
		...note ? [note.slice(1)] : [],
		"",
		`Commands: ${commands}`
	].join("\n");
}
function resolveGoalCommandHint(status) {
	switch (status) {
		case "active": return "/goal edit <objective>, /goal pause, /goal complete, /goal clear";
		case "paused":
		case "blocked":
		case "usage_limited":
		case "budget_limited": return "/goal resume, /goal edit <objective>, /goal clear";
		case "complete": return "/goal clear";
	}
	return "/goal";
}
async function getSessionGoal(options) {
	const now = nowMs(options.now);
	if (options.persist === false) {
		const entry = require_session_accessor.loadSessionEntry({
			sessionKey: options.sessionKey,
			storePath: options.storePath
		}) ?? options.fallbackEntry;
		const projected = entry ? resolveSessionGoalDisplayState(entry, now, { adoptFreshBaseline: false }) : void 0;
		return projected ? {
			status: "found",
			goal: projected
		} : { status: "missing" };
	}
	let goal;
	if (!await require_session_accessor.patchSessionEntry({
		sessionKey: options.sessionKey,
		storePath: options.storePath
	}, (entry) => {
		const accounted = accountGoalUsage(entry, now);
		goal = accounted ? cloneGoal(accounted) : void 0;
		if (!accounted || goalsEqual(accounted, entry.goal)) return null;
		return { goal: accounted };
	}, { fallbackEntry: options.fallbackEntry }) || !goal) return { status: "missing" };
	return {
		status: "found",
		goal
	};
}
async function createSessionGoal(options) {
	const objective = options.objective.trim();
	if (!objective) throw new Error("objective required");
	const now = nowMs(options.now);
	let created;
	const result = await require_session_accessor.patchSessionEntry({
		sessionKey: options.sessionKey,
		storePath: options.storePath
	}, (entry) => {
		if (entry.goal) throw new Error("goal already exists");
		const tokenBudget = normalizeTokenBudget(options.tokenBudget);
		const tokenStartFresh = resolveEntryFreshTotalTokens(entry) !== void 0;
		created = {
			schemaVersion: 1,
			id: node_crypto.default.randomUUID(),
			objective,
			status: "active",
			createdAt: now,
			updatedAt: now,
			tokenStart: resolveEntryGoalStartTokens(entry),
			tokenStartFresh,
			tokensUsed: 0,
			...tokenBudget ? { tokenBudget } : {},
			continuationTurns: 0
		};
		return { goal: created };
	}, { fallbackEntry: options.fallbackEntry });
	if (!result || !created) throw new Error("session not found");
	recordGoalChange(options, result, "goal created");
	return cloneGoal(created);
}
async function updateSessionGoalStatus(options) {
	const now = nowMs(options.now);
	let updated;
	let foundSession = false;
	const result = await require_session_accessor.patchSessionEntry({
		sessionKey: options.sessionKey,
		storePath: options.storePath
	}, (entry) => {
		foundSession = true;
		const accounted = accountGoalUsage(entry, now);
		if (!accounted) throw new Error("goal not found");
		if (TERMINAL_GOAL_STATUSES.has(accounted.status) && accounted.status !== options.status) throw new Error(`goal is already ${accounted.status}`);
		const resetsBudgetWindow = options.status === "active" && (accounted.status === "budget_limited" || accounted.status === "usage_limited" || accounted.tokenBudget !== void 0 && accounted.tokensUsed >= accounted.tokenBudget);
		const freshTokenStart = resetsBudgetWindow ? resolveEntryFreshTotalTokens(entry) : void 0;
		const next = {
			...accounted,
			status: options.status,
			updatedAt: now,
			...options.note ? { lastStatusNote: options.note } : {},
			...options.status === "paused" ? { pausedAt: now } : {},
			...options.status === "blocked" ? { blockedAt: now } : {},
			...options.status === "complete" ? { completedAt: now } : {}
		};
		if (resetsBudgetWindow) {
			next.tokenStart = freshTokenStart ?? 0;
			next.tokenStartFresh = freshTokenStart !== void 0;
			next.tokensUsed = 0;
			delete next.budgetLimitedAt;
			delete next.usageLimitedAt;
		}
		if (next.status === "active" && next.tokenBudget !== void 0 && next.tokensUsed >= next.tokenBudget) {
			next.status = "budget_limited";
			next.budgetLimitedAt = now;
		}
		updated = next;
		return { goal: updated };
	});
	if (!result || !updated) throw new Error(foundSession ? "goal not found" : "session not found");
	recordGoalChange(options, result, `goal status changed to ${updated.status}`);
	return cloneGoal(updated);
}
async function updateSessionGoalObjective(options) {
	const objective = options.objective.trim();
	if (!objective) throw new Error("objective required");
	const now = nowMs(options.now);
	let updated;
	let foundSession = false;
	const result = await require_session_accessor.patchSessionEntry({
		sessionKey: options.sessionKey,
		storePath: options.storePath
	}, (entry) => {
		foundSession = true;
		const accounted = accountGoalUsage(entry, now);
		if (!accounted) throw new Error("goal not found");
		if (TERMINAL_GOAL_STATUSES.has(accounted.status)) throw new Error(`goal is already ${accounted.status}`);
		updated = {
			...accounted,
			objective,
			updatedAt: now
		};
		return { goal: updated };
	});
	if (!result || !updated) throw new Error(foundSession ? "goal not found" : "session not found");
	recordGoalChange(options, result, "goal objective changed");
	return cloneGoal(updated);
}
async function clearSessionGoal(options) {
	let removed = false;
	const result = await require_session_accessor.patchSessionEntry({
		sessionKey: options.sessionKey,
		storePath: options.storePath
	}, (entry) => {
		if (!entry.goal) return null;
		removed = true;
		return { goal: void 0 };
	});
	if (result && removed) recordGoalChange(options, result, "goal cleared");
	return Boolean(result && removed);
}
//#endregion
//#region src/config/sessions/main-session.runtime.ts
/** Resolves the main session key from the active runtime config. */
function resolveMainSessionKeyFromConfig() {
	return require_main_session.resolveMainSessionKey(require_io.getRuntimeConfig());
}
//#endregion
//#region src/config/sessions/cleanup-service.ts
function resolveCleanupSqlitePath(target) {
	return require_targets.resolveSqliteTargetFromSessionStorePath(target.storePath, { agentId: target.agentId }).path ?? require_openclaw_agent_db.resolveOperatorAgentSqlitePath({ agentId: target.agentId });
}
function loadCleanupSessionStore(target, options = {}) {
	if (options.createIfMissing !== true && !node_fs.default.existsSync(resolveCleanupSqlitePath(target))) return {};
	return Object.fromEntries(require_session_accessor.listSessionEntries({
		agentId: target.agentId,
		storePath: target.storePath
	}).map(({ sessionKey, entry }) => [sessionKey, entry]));
}
function isTranscriptMessageRole(role) {
	return role === "user" || role === "assistant" || role === "tool" || role === "toolResult" || role === "system";
}
function isTranscriptMessageRecord(entry) {
	if (!entry || typeof entry !== "object") return false;
	const record = entry;
	if (record.type === "message") return true;
	if (record.type === void 0 && record.message && typeof record.message === "object" && isTranscriptMessageRole(record.message.role)) return true;
	return record.type === void 0 && isTranscriptMessageRole(record.role);
}
function sqliteTranscriptHasMessageRecords(params) {
	try {
		return require_session_accessor.loadTranscriptEventsSync(params).some(isTranscriptMessageRecord);
	} catch {
		return false;
	}
}
function isMainScopeStaleDirectSessionKey(params) {
	if ((params.cfg.session?.dmScope ?? "main") !== "main") return false;
	if (params.activeKey && params.key === params.activeKey) return false;
	const parsed = require_session_key.parseAgentSessionKey(params.key);
	if (!parsed || (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) !== (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.targetAgentId)) return false;
	const parts = parsed.rest.split(":");
	if (parts[0] === "agent") return false;
	return parts.length === 2 && parts[0] === "direct" && Boolean(parts[1]) || parts.length === 3 && Boolean(parts[0]) && parts[1] === "direct" && Boolean(parts[2]) || parts.length === 4 && Boolean(parts[0]) && Boolean(parts[1]) && parts[2] === "direct" && Boolean(parts[3]);
}
function retireMainScopeDirectSessionEntries(params) {
	let retired = 0;
	for (const [key, entry] of Object.entries(params.store)) if (isMainScopeStaleDirectSessionKey({
		cfg: params.cfg,
		targetAgentId: params.targetAgentId,
		key,
		activeKey: params.activeKey
	})) {
		params.onRetired?.(key, entry);
		delete params.store[key];
		retired += 1;
	}
	return retired;
}
function serializeSessionCleanupResult(params) {
	if (params.summaries.length === 1) return params.summaries[0] ?? {};
	return {
		allAgents: true,
		mode: params.mode,
		dryRun: params.dryRun,
		stores: params.summaries
	};
}
function pruneMissingTranscriptEntries(params) {
	let removed = 0;
	for (const [key, entry] of Object.entries(params.store)) {
		if (entry?.modelSelectionLocked === true && require_store.shouldPreserveMaintenanceEntry({
			key,
			entry
		})) continue;
		if (require_session_key.parseAgentSessionKey(key) && entry.sessionId === key && !entry.sessionFile) continue;
		if (!entry?.sessionId) {
			if (require_session_key.parseAgentSessionKey(key)) continue;
			delete params.store[key];
			removed += 1;
			params.onPruned?.(key, entry);
			continue;
		}
		if (!sqliteTranscriptHasMessageRecords({
			sessionId: entry.sessionId,
			sessionKey: key,
			storePath: params.storePath
		})) {
			delete params.store[key];
			removed += 1;
			params.onPruned?.(key, entry);
		}
	}
	return removed;
}
function addEntryArtifactPathsToSet(params) {
	const sessionsDir = node_path.default.dirname(params.storePath);
	for (const key of params.keys) {
		const entry = params.store[key];
		if (!entry) continue;
		for (const artifactPath of require_store.resolveSessionArtifactCanonicalPathsForEntry({
			sessionsDir,
			entry
		})) params.paths.add(artifactPath);
	}
}
async function previewStoreCleanup(params) {
	const beforeStore = loadCleanupSessionStore(params.target, { createIfMissing: !params.dryRun });
	const previewStore = require_store.cloneSessionStoreRecord(beforeStore);
	const staleKeys = /* @__PURE__ */ new Set();
	const cappedKeys = /* @__PURE__ */ new Set();
	const missingKeys = /* @__PURE__ */ new Set();
	const modelRunPrunedKeys = /* @__PURE__ */ new Set();
	const dmScopeRetiredKeys = /* @__PURE__ */ new Set();
	const missing = params.fixMissing === true ? pruneMissingTranscriptEntries({
		store: previewStore,
		storePath: params.target.storePath,
		onPruned: (key) => {
			missingKeys.add(key);
		}
	}) : 0;
	const dmScopeRetired = params.fixDmScope === true ? retireMainScopeDirectSessionEntries({
		cfg: params.cfg,
		store: previewStore,
		targetAgentId: params.target.agentId,
		activeKey: params.activeKey,
		onRetired: (key) => {
			dmScopeRetiredKeys.add(key);
		}
	}) : 0;
	const preserveSessionKeys = require_store.collectSessionMaintenancePreserveKeysForStore({
		storePath: params.target.storePath,
		store: previewStore,
		baseKeys: [params.activeKey]
	});
	const modelRunPruned = require_store.shouldRunModelRunPrune({
		maintenance: params.maintenance,
		entryCount: Object.keys(previewStore).length,
		force: true
	}) ? require_store.pruneStaleModelRunEntries(previewStore, params.maintenance.modelRunPruneAfterMs, {
		log: false,
		preserveKeys: preserveSessionKeys,
		onPruned: ({ key }) => {
			modelRunPrunedKeys.add(key);
		}
	}) : 0;
	const pruned = require_store.pruneStaleEntries(previewStore, params.maintenance.pruneAfterMs, {
		log: false,
		preserveKeys: preserveSessionKeys,
		onPruned: ({ key }) => {
			staleKeys.add(key);
		}
	});
	const capped = require_store.capEntryCount(previewStore, params.maintenance.maxEntries, {
		log: false,
		preserveKeys: preserveSessionKeys,
		onCapped: ({ key }) => {
			cappedKeys.add(key);
		}
	});
	const entryCleanupArtifactPaths = /* @__PURE__ */ new Set();
	addEntryArtifactPathsToSet({
		paths: entryCleanupArtifactPaths,
		store: beforeStore,
		storePath: params.target.storePath,
		keys: modelRunPrunedKeys
	});
	addEntryArtifactPathsToSet({
		paths: entryCleanupArtifactPaths,
		store: beforeStore,
		storePath: params.target.storePath,
		keys: staleKeys
	});
	addEntryArtifactPathsToSet({
		paths: entryCleanupArtifactPaths,
		store: beforeStore,
		storePath: params.target.storePath,
		keys: cappedKeys
	});
	addEntryArtifactPathsToSet({
		paths: entryCleanupArtifactPaths,
		store: beforeStore,
		storePath: params.target.storePath,
		keys: dmScopeRetiredKeys
	});
	const diskBudgetPreview = node_fs.default.existsSync(resolveCleanupSqlitePath(params.target)) ? require_session_accessor.previewSessionDiskBudget({
		agentId: params.target.agentId,
		store: previewStore,
		storePath: params.target.storePath,
		activeSessionKey: params.activeKey,
		preserveKeys: preserveSessionKeys,
		maintenance: params.maintenance
	}) : {
		diskBudget: null,
		removedKeys: /* @__PURE__ */ new Set()
	};
	const diskBudget = diskBudgetPreview.diskBudget;
	const unreferencedArtifacts = await require_store.pruneUnreferencedSessionArtifacts({
		store: previewStore,
		storePath: params.target.storePath,
		olderThanMs: params.maintenance.pruneAfterMs,
		dryRun: true,
		excludeCanonicalPaths: entryCleanupArtifactPaths
	});
	const budgetEvictedKeys = diskBudgetPreview.removedKeys;
	const beforeCount = Object.keys(beforeStore).length;
	const afterPreviewCount = Object.keys(previewStore).length;
	const wouldMutate = missing > 0 || dmScopeRetired > 0 || modelRunPruned > 0 || pruned > 0 || capped > 0 || unreferencedArtifacts.removedFiles > 0 || (diskBudget?.removedEntries ?? 0) > 0 || (diskBudget?.removedFiles ?? 0) > 0;
	return {
		summary: {
			agentId: params.target.agentId,
			storePath: params.target.storePath,
			mode: params.mode,
			dryRun: params.dryRun,
			beforeCount,
			afterCount: afterPreviewCount,
			missing,
			dmScopeRetired,
			modelRunPruned,
			pruned,
			capped,
			unreferencedArtifacts,
			diskBudget,
			wouldMutate
		},
		beforeStore,
		missingKeys,
		modelRunPrunedKeys,
		staleKeys,
		cappedKeys,
		budgetEvictedKeys,
		dmScopeRetiredKeys
	};
}
/** Runs session cleanup preview/apply for the selected store targets. */
async function runSessionsCleanup(params) {
	const { cfg, opts } = params;
	const maintenance = require_store.resolveMaintenanceConfig();
	const mode = opts.enforce ? "enforce" : maintenance.mode;
	const targets = params.targets ?? require_targets.resolveSessionStoreTargets(cfg, {
		store: opts.store,
		agent: opts.agent,
		allAgents: opts.allAgents
	});
	const previewResults = [];
	for (const target of targets) {
		const result = await previewStoreCleanup({
			cfg,
			target,
			maintenance,
			mode,
			dryRun: Boolean(opts.dryRun),
			activeKey: opts.activeKey,
			fixMissing: Boolean(opts.fixMissing),
			fixDmScope: Boolean(opts.fixDmScope)
		});
		previewResults.push(result);
	}
	const appliedSummaries = [];
	if (!opts.dryRun) for (const target of targets) {
		const applyStore = loadCleanupSessionStore(target, { createIfMissing: true });
		const missingRemovals = [];
		const dmScopeRetiredRemovals = [];
		if (opts.fixMissing) pruneMissingTranscriptEntries({
			store: applyStore,
			storePath: target.storePath,
			onPruned: (sessionKey, entry) => {
				missingRemovals.push({
					sessionKey,
					expectedEntry: require_store.cloneSessionStoreRecord({ entry }).entry
				});
			}
		});
		if (opts.fixDmScope) retireMainScopeDirectSessionEntries({
			cfg,
			store: applyStore,
			targetAgentId: target.agentId,
			activeKey: opts.activeKey,
			onRetired: (sessionKey, entry) => {
				dmScopeRetiredRemovals.push({
					sessionKey,
					expectedEntry: require_store.cloneSessionStoreRecord({ entry }).entry,
					archiveRemovedTranscript: true
				});
			}
		});
		const removals = [...missingRemovals, ...dmScopeRetiredRemovals];
		const lifecycleResult = await require_session_accessor.applySessionEntryLifecycleMutation({
			storePath: target.storePath,
			removals,
			activeSessionKey: opts.activeKey,
			preserveActiveWork: true,
			maintenanceOverride: {
				...maintenance,
				mode
			},
			restrictArchivedTranscriptsToStoreDir: true
		});
		const postApplyStore = loadCleanupSessionStore(target, { createIfMissing: true });
		const appliedUnreferencedArtifacts = mode === "warn" ? null : await require_store.pruneUnreferencedSessionArtifacts({
			store: postApplyStore,
			storePath: target.storePath,
			olderThanMs: maintenance.pruneAfterMs,
			dryRun: false
		});
		const removedSessionKeys = new Set(lifecycleResult.removedSessionKeys);
		const missingApplied = missingRemovals.filter(({ sessionKey }) => removedSessionKeys.has(sessionKey)).length;
		const dmScopeRetiredApplied = dmScopeRetiredRemovals.filter(({ sessionKey }) => removedSessionKeys.has(sessionKey)).length;
		const unreferencedArtifacts = mode === "warn" ? {
			scannedFiles: 0,
			removedFiles: 0,
			freedBytes: 0,
			olderThanMs: maintenance.pruneAfterMs
		} : lifecycleResult.unreferencedArtifacts ?? appliedUnreferencedArtifacts ?? {
			scannedFiles: 0,
			removedFiles: 0,
			freedBytes: 0,
			olderThanMs: maintenance.pruneAfterMs
		};
		const preview = previewResults.find((result) => result.summary.storePath === target.storePath);
		const appliedReport = lifecycleResult.maintenanceReport;
		const summary = appliedReport === null ? {
			...preview?.summary ?? {
				agentId: target.agentId,
				storePath: target.storePath,
				mode,
				dryRun: false,
				beforeCount: 0,
				afterCount: 0,
				missing: 0,
				dmScopeRetired: 0,
				modelRunPruned: 0,
				pruned: 0,
				capped: 0,
				unreferencedArtifacts,
				diskBudget: null,
				wouldMutate: false
			},
			dryRun: false,
			unreferencedArtifacts,
			wouldMutate: (preview?.summary.wouldMutate ?? false) || unreferencedArtifacts.removedFiles > 0,
			applied: true,
			appliedCount: lifecycleResult.afterCount
		} : {
			agentId: target.agentId,
			storePath: target.storePath,
			mode: appliedReport.mode,
			dryRun: false,
			beforeCount: appliedReport.beforeCount,
			afterCount: appliedReport.afterCount,
			missing: missingApplied,
			dmScopeRetired: dmScopeRetiredApplied,
			modelRunPruned: appliedReport.modelRunPruned,
			pruned: appliedReport.pruned,
			capped: appliedReport.capped,
			unreferencedArtifacts,
			diskBudget: appliedReport.diskBudget,
			wouldMutate: missingApplied > 0 || dmScopeRetiredApplied > 0 || appliedReport.modelRunPruned > 0 || appliedReport.pruned > 0 || appliedReport.capped > 0 || unreferencedArtifacts.removedFiles > 0 || (appliedReport.diskBudget?.removedEntries ?? 0) > 0 || (appliedReport.diskBudget?.removedFiles ?? 0) > 0,
			applied: true,
			appliedCount: lifecycleResult.afterCount
		};
		appliedSummaries.push(summary);
	}
	return {
		mode,
		previewResults,
		appliedSummaries
	};
}
/** Purge session store entries for a deleted agent (#65524). Best-effort. */
async function purgeAgentSessionStoreEntries(cfg, agentId) {
	try {
		const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
		const storeConfig = cfg.session?.store;
		await require_session_accessor.purgeDeletedAgentSessionEntries({
			cfg,
			agentId: normalizedAgentId,
			storeAgentId: typeof storeConfig === "string" && !storeConfig.includes("{agentId}") ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg)) : normalizedAgentId,
			storePath: require_paths.resolveStorePath(cfg.session?.store, { agentId: normalizedAgentId })
		});
	} catch (err) {
		require_logger.getLogger().debug("session store purge skipped during agent delete", err);
	}
}
//#endregion
Object.defineProperty(exports, "MODEL_UPDATABLE_SESSION_GOAL_STATUSES", {
	enumerable: true,
	get: function() {
		return MODEL_UPDATABLE_SESSION_GOAL_STATUSES;
	}
});
Object.defineProperty(exports, "clearSessionGoal", {
	enumerable: true,
	get: function() {
		return clearSessionGoal;
	}
});
Object.defineProperty(exports, "createSessionGoal", {
	enumerable: true,
	get: function() {
		return createSessionGoal;
	}
});
Object.defineProperty(exports, "formatSessionGoalStatus", {
	enumerable: true,
	get: function() {
		return formatSessionGoalStatus;
	}
});
Object.defineProperty(exports, "getSessionGoal", {
	enumerable: true,
	get: function() {
		return getSessionGoal;
	}
});
Object.defineProperty(exports, "loadCombinedSessionStoreForGateway", {
	enumerable: true,
	get: function() {
		return loadCombinedSessionStoreForGateway;
	}
});
Object.defineProperty(exports, "purgeAgentSessionStoreEntries", {
	enumerable: true,
	get: function() {
		return purgeAgentSessionStoreEntries;
	}
});
Object.defineProperty(exports, "resolveCompactionSessionFile", {
	enumerable: true,
	get: function() {
		return resolveCompactionSessionFile;
	}
});
Object.defineProperty(exports, "resolveMainSessionKeyFromConfig", {
	enumerable: true,
	get: function() {
		return resolveMainSessionKeyFromConfig;
	}
});
Object.defineProperty(exports, "resolveSessionGoalDisplayState", {
	enumerable: true,
	get: function() {
		return resolveSessionGoalDisplayState;
	}
});
Object.defineProperty(exports, "runSessionsCleanup", {
	enumerable: true,
	get: function() {
		return runSessionsCleanup;
	}
});
Object.defineProperty(exports, "serializeSessionCleanupResult", {
	enumerable: true,
	get: function() {
		return serializeSessionCleanupResult;
	}
});
Object.defineProperty(exports, "updateSessionGoalObjective", {
	enumerable: true,
	get: function() {
		return updateSessionGoalObjective;
	}
});
Object.defineProperty(exports, "updateSessionGoalStatus", {
	enumerable: true,
	get: function() {
		return updateSessionGoalStatus;
	}
});
