const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
require("./selection-BpqUSi0C.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
const require_paths$1 = require("./paths-DsfW3Lup.cjs");
const require_store = require("./store-DCwJguwr.cjs");
require("./model-selection-BvFurMxy.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
const require_targets = require("./targets-BfrPEAMP.cjs");
const require_heartbeat_summary = require("./heartbeat-summary-BL-oe7t6.cjs");
const require_heartbeat_filter = require("./heartbeat-filter-vwmv_UEH.cjs");
const require_agent_dir_compat = require("./agent-dir-compat-G1-AN4yV.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_subagent_recovery_state = require("./subagent-recovery-state-cp-2XAVz.cjs");
const require_backend_config = require("./backend-config-DX8zPQ4v.cjs");
const require_doctor_contract_registry = require("./doctor-contract-registry-jnGubuyU.cjs");
require("./engine-storage-AsKKXUF-.cjs");
const require_tui_last_session = require("./tui-last-session-CRcX5qfM.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/doctor-heartbeat-main-session-repair.ts
/** Doctor repair for main sessions accidentally occupied by synthetic heartbeat transcripts. */
function countLabel$2(count, singular, plural = `${singular}s`) {
	return `${count} ${count === 1 ? singular : plural}`;
}
function sessionEntryHasSyntheticHeartbeatOwnership(entry) {
	return typeof entry.heartbeatIsolatedBaseSessionKey === "string" && entry.heartbeatIsolatedBaseSessionKey.trim().length > 0;
}
function parseTranscriptMessageLine(line) {
	let parsed;
	try {
		parsed = JSON.parse(line);
	} catch {
		return null;
	}
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(parsed);
	if (!record) return null;
	const message = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(record.message) ?? record;
	const role = message.role;
	if (typeof role !== "string") return null;
	return {
		role,
		content: message.content
	};
}
function summarizeTranscriptHeartbeatMessages(transcriptPath) {
	let raw;
	try {
		raw = node_fs.default.readFileSync(transcriptPath, "utf8");
	} catch {
		return null;
	}
	const summary = {
		inspectedMessages: 0,
		userMessages: 0,
		heartbeatUserMessages: 0,
		nonHeartbeatUserMessages: 0,
		assistantMessages: 0,
		heartbeatOkAssistantMessages: 0
	};
	for (const line of raw.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const message = parseTranscriptMessageLine(trimmed);
		if (!message) continue;
		summary.inspectedMessages += 1;
		if (message.role === "user") {
			summary.userMessages += 1;
			if (require_heartbeat_filter.isHeartbeatUserMessage(message)) summary.heartbeatUserMessages += 1;
			else summary.nonHeartbeatUserMessages += 1;
		} else if (message.role === "assistant") {
			summary.assistantMessages += 1;
			if (require_heartbeat_filter.isHeartbeatOkResponse(message)) summary.heartbeatOkAssistantMessages += 1;
		}
	}
	return summary.inspectedMessages > 0 ? summary : null;
}
/**
* Detects main-session entries that are safe to archive because they only contain heartbeat turns.
*
* Metadata ownership is preferred, but transcript inspection catches older stores that lack the
* heartbeat isolation marker while still containing no human user messages.
*/
function resolveHeartbeatMainSessionRepairCandidate(params) {
	const { entry, transcriptPath } = params;
	if (!entry) return null;
	if (!(entry.lastInteractionAt === void 0)) return null;
	const hasSyntheticHeartbeatOwnership = sessionEntryHasSyntheticHeartbeatOwnership(entry);
	if (hasSyntheticHeartbeatOwnership && !transcriptPath) return { reason: "metadata" };
	if (!transcriptPath) return null;
	const summary = summarizeTranscriptHeartbeatMessages(transcriptPath);
	if (!summary) return null;
	if (summary.heartbeatUserMessages > 0 && summary.userMessages === summary.heartbeatUserMessages && summary.nonHeartbeatUserMessages === 0) return {
		reason: hasSyntheticHeartbeatOwnership ? "metadata" : "transcript",
		summary
	};
	return null;
}
function resolveHeartbeatMainRecoveryKey(params) {
	const parsed = require_session_key.parseAgentSessionKey(params.mainKey);
	if (!parsed) return null;
	const stamp = require_paths$1.formatSessionArchiveTimestamp(params.nowMs).toLowerCase();
	const base = `agent:${parsed.agentId}:heartbeat-recovered-${stamp}`;
	if (!params.store[base]) return base;
	for (let index = 2; index <= 100; index += 1) {
		const candidate = `${base}-${index}`;
		if (!params.store[candidate]) return candidate;
	}
	return null;
}
/** Moves a poisoned main-session entry to a recovery key without overwriting existing entries. */
function moveHeartbeatMainSessionEntry(params) {
	const entry = params.store[params.mainKey];
	if (!entry || params.store[params.recoveredKey]) return false;
	params.store[params.recoveredKey] = entry;
	delete params.store[params.mainKey];
	return true;
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.doctorHeartbeatMainSessionRepairTestApi")] = {
	moveHeartbeatMainSessionEntry,
	resolveHeartbeatMainSessionRepairCandidate
};
/**
* Prompts to archive a heartbeat-owned main session and clears stale TUI restore state.
*
* The session store is rechecked inside the update transaction so concurrent session activity
* prevents moving a newly-human main session.
*/
async function repairHeartbeatPoisonedMainSession(params) {
	const mainKey = require_main_session.resolveMainSessionKey(params.cfg);
	const mainEntry = params.store[mainKey];
	if (!mainEntry?.sessionId) return;
	let transcriptPath;
	try {
		transcriptPath = require_paths$1.resolveSessionFilePath(mainEntry.sessionId, mainEntry, params.sessionPathOpts);
	} catch {
		transcriptPath = void 0;
	}
	const candidate = resolveHeartbeatMainSessionRepairCandidate({
		entry: mainEntry,
		transcriptPath
	});
	if (!candidate) return;
	const recoveredKey = resolveHeartbeatMainRecoveryKey({
		mainKey,
		store: params.store
	});
	if (!recoveredKey) {
		params.warnings.push(`- Main session ${mainKey} appears heartbeat-owned, but doctor could not choose a safe recovery key.`);
		return;
	}
	const reason = candidate.reason === "metadata" ? "heartbeat metadata" : `${candidate.summary?.heartbeatUserMessages ?? 0} heartbeat-only user message(s)`;
	params.warnings.push([`- Main session ${mainKey} appears to be a heartbeat-owned session (${reason}).`, `  Doctor can move it to ${recoveredKey} and let the next interactive launch create a fresh main session.`].join("\n"));
	if (!await params.prompter.confirmRuntimeRepair({
		message: `Move heartbeat-owned main session ${mainKey} to ${recoveredKey} and clear stale TUI restore pointers?`,
		initialValue: true
	})) return;
	let movedEntry;
	await require_store.updateSessionStore(params.absoluteStorePath, (currentStore) => {
		const currentEntry = currentStore[mainKey];
		if (!resolveHeartbeatMainSessionRepairCandidate({
			entry: currentEntry,
			transcriptPath
		})) return;
		if (moveHeartbeatMainSessionEntry({
			store: currentStore,
			mainKey,
			recoveredKey
		})) movedEntry = currentEntry;
	});
	if (!movedEntry) {
		params.warnings.push(`- Main session ${mainKey} changed before repair could move it.`);
		return;
	}
	params.store[recoveredKey] = movedEntry;
	delete params.store[mainKey];
	let clearedPointers = 0;
	try {
		clearedPointers = require_tui_last_session.clearTuiLastSessionPointers({
			stateDir: params.stateDir,
			sessionKeys: /* @__PURE__ */ new Set([mainKey])
		});
	} catch (error) {
		params.warnings.push(`- Moved heartbeat-owned main session ${mainKey}, but could not clear its TUI restore pointers: ${String(error)}`);
	}
	params.changes.push(`- Moved heartbeat-owned main session ${mainKey} to ${recoveredKey}.`);
	if (clearedPointers > 0) params.changes.push(`- Cleared ${countLabel$2(clearedPointers, "stale TUI last-session pointer")} for ${mainKey}.`);
}
//#endregion
//#region src/commands/doctor-heartbeat-session-target.ts
/** Doctor warnings for heartbeat.session values that resolve to missing delivery sessions. */
function hasExplicitHeartbeatAgents(cfg) {
	return require_agent_scope_config.listAgentEntries(cfg).some((entry) => Boolean(entry?.heartbeat));
}
function resolveHeartbeatConfig(cfg, agentId) {
	const defaults = cfg.agents?.defaults?.heartbeat;
	const overrides = require_agent_scope_config.resolveAgentConfig(cfg, agentId)?.heartbeat;
	if (!defaults && !overrides) return overrides;
	return {
		...defaults,
		...overrides
	};
}
function listHeartbeatDoctorAgents(cfg) {
	if (hasExplicitHeartbeatAgents(cfg)) return require_agent_scope_config.listAgentEntries(cfg).filter((entry) => entry?.heartbeat).map((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id)).filter((agentId) => agentId);
	if (cfg.agents?.defaults?.heartbeat) return require_agent_scope_config.listAgentIds(cfg);
	return [];
}
/**
* Detect heartbeat configs that pin a non-existent session. The runtime
* resolves `heartbeat.session` to a sessionKey via `resolveHeartbeatSession`;
* if the entry is missing, `resolveHeartbeatDeliveryTarget` falls back to
* `{channel:"none", reason:"no-target"}` and the heartbeat fires a model
* call whose reply has nowhere to land. Common cause: the configured Slack
* channel ID does not match any channel the agent has ever joined (e.g.,
* heartbeat pins channel `c0b2eddpw95` but the agent only has sessions in
* `c0ag7jag35g`, or the agent has no Slack bot at all).
*
* Warning only — repair would mean rewriting the config, which is the
* operator's intent to express.
*/
function describeHeartbeatSessionTargetIssues(cfg) {
	const warnings = [];
	const sessionScope = cfg.session?.scope ?? "per-sender";
	for (const agentId of listHeartbeatDoctorAgents(cfg)) {
		if (!agentId) continue;
		const resolvedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
		const heartbeatConfig = resolveHeartbeatConfig(cfg, resolvedAgentId);
		if (!heartbeatConfig) continue;
		if (!require_heartbeat_summary.resolveHeartbeatIntervalMs(cfg, void 0, heartbeatConfig)) continue;
		const configuredSession = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(heartbeatConfig.session);
		if (!configuredSession) continue;
		const normalizedSession = configuredSession.toLowerCase();
		if (normalizedSession === "main" || normalizedSession === "global") continue;
		if (require_session_key.isSubagentSessionKey(configuredSession)) continue;
		if (sessionScope === "global") continue;
		const target = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(heartbeatConfig.target);
		if (!target || target === "none") continue;
		const deliveryWithoutSession = require_targets.resolveHeartbeatDeliveryTarget({
			cfg,
			heartbeat: heartbeatConfig
		});
		if (deliveryWithoutSession.channel !== "none" && deliveryWithoutSession.to) continue;
		const candidateSession = require_session_key.toAgentStoreSessionKey({
			agentId: resolvedAgentId,
			requestKey: configuredSession,
			mainKey: cfg.session?.mainKey
		});
		if (require_session_key.isSubagentSessionKey(candidateSession)) continue;
		const canonicalSession = require_main_session.canonicalizeMainSessionAlias({
			cfg,
			agentId: resolvedAgentId,
			sessionKey: candidateSession
		});
		if (canonicalSession === "global" || require_session_key.isSubagentSessionKey(canonicalSession) || require_session_key.resolveAgentIdFromSessionKey(canonicalSession) !== resolvedAgentId) continue;
		const storeAgentId = resolvedAgentId;
		const storePath = require_paths$1.resolveStorePath(cfg.session?.store, { agentId: storeAgentId });
		if (require_store.loadSessionStore(storePath, {
			skipCache: true,
			clone: false
		})[canonicalSession]) continue;
		warnings.push([
			`- Agent ${agentId} heartbeat.session pins ${configuredSession} (resolved to ${canonicalSession}) but that session has no entry in ${storePath}.`,
			`  Heartbeats will run but resolve delivery to channel="none"/reason="no-target", so replies are dropped silently.`,
			`  Fix: point heartbeat.session at a session the agent actually owns, set heartbeat.target="none" to suppress delivery, or remove the heartbeat.session field to fall back to the agent main session.`
		].join("\n"));
	}
	return warnings;
}
//#endregion
//#region src/commands/doctor-session-state-providers.ts
/** Doctor repair for stale plugin-owned routing state persisted in session entries. */
function countLabel$1(count, singular, plural = `${singular}s`) {
	return `${count} ${count === 1 ? singular : plural}`;
}
function normalizeIdSet(values) {
	return new Set((values ?? []).map((value) => require_model_selection_normalize.normalizeProviderId(value)));
}
function normalizePrefixList(values) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntriesLower)(values);
}
function ownsPrefixedValue(prefixes, value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value)?.toLowerCase();
	return normalized !== void 0 && prefixes.some((prefix) => normalized.startsWith(prefix));
}
function countSessionLabel(count) {
	return countLabel$1(count, "session");
}
function repairExample(repair) {
	return `${repair.key} (${repair.reasons.join(", ")})`;
}
function resolveSessionAgentId(cfg, sessionKey) {
	return require_session_key.parseAgentSessionKey(sessionKey)?.agentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg);
}
/** Resolves the currently configured provider/model/runtime route for a session key. */
function resolveConfiguredDoctorSessionStateRoute(params) {
	const agentId = resolveSessionAgentId(params.cfg, params.sessionKey);
	const primary = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId
	});
	const configuredModelRefs = /* @__PURE__ */ new Set();
	const addRef = (provider, model) => {
		configuredModelRefs.add(require_model_selection_normalize.modelKey(provider, model));
	};
	addRef(primary.provider, primary.model);
	const fallbacks = require_agent_scope.resolveAgentModelFallbacksOverride(params.cfg, agentId) ?? require_model_input.resolveAgentModelFallbackValues(params.cfg.agents?.defaults?.model);
	for (const fallback of fallbacks) {
		const parsed = require_model_selection_normalize.parseModelRef(fallback, primary.provider, {
			allowManifestNormalization: false,
			allowPluginNormalization: false
		});
		if (parsed) addRef(parsed.provider, parsed.model);
	}
	const runtime = require_policy.resolveAgentHarnessPolicy({
		provider: primary.provider,
		modelId: primary.model,
		config: params.cfg,
		agentId,
		sessionKey: params.sessionKey
	}).runtime;
	return {
		defaultProvider: primary.provider,
		configuredModelRefs: [...configuredModelRefs],
		runtime
	};
}
function resolvePluginDoctorSessionRouteStateOwners(params) {
	return require_doctor_contract_registry.listPluginDoctorSessionRouteStateOwners({
		config: params.cfg,
		env: params.env
	});
}
function entryMayContainPluginSessionRouteState(sessionKey, entry) {
	if (require_store.isValidAgentHarnessSessionStoreEntry(sessionKey, entry)) return false;
	const record = entry;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.providerOverride) !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.modelOverride) !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.modelOverrideSource) !== void 0 || record.liveModelSwitchPending !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.modelProvider) !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.model) !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.agentHarnessId) !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.agentRuntimeOverride) !== void 0 || record.cliSessionBindings !== void 0 || record.cliSessionIds !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.authProfileOverride) !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.authProfileOverrideSource) !== void 0;
}
/** Fast prefilter for session stores that might contain plugin-owned routing state. */
function storeMayContainPluginSessionRouteState(store) {
	return Object.entries(store).some(([sessionKey, entry]) => entryMayContainPluginSessionRouteState(sessionKey, entry));
}
function resolvePersistedOverrideModelRef(params) {
	const overrideModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.overrideModel);
	if (!overrideModel) return null;
	const overrideProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.overrideProvider);
	return require_model_selection_normalize.parseModelRef(overrideProvider ? `${overrideProvider}/${overrideModel}` : overrideModel, params.defaultProvider, {
		allowManifestNormalization: false,
		allowPluginNormalization: false
	});
}
function addReason(reasons, reason) {
	if (!reasons.includes(reason)) reasons.push(reason);
}
function routeAllowsOwnerState(params) {
	const providerIds = normalizeIdSet(params.owner.providerIds);
	const runtimeIds = normalizeIdSet(params.owner.runtimeIds);
	const routeRuntime = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.route?.runtime);
	if (routeRuntime && runtimeIds.has(require_model_selection_normalize.normalizeProviderId(routeRuntime))) return true;
	return params.route?.configuredModelRefs.some((ref) => {
		const slash = ref.indexOf("/");
		return slash > 0 && providerIds.has(require_model_selection_normalize.normalizeProviderId(ref.slice(0, slash)));
	}) ?? false;
}
function hasOwnedCliSession(params) {
	const bindings = params.entry.cliSessionBindings;
	const ids = params.entry.cliSessionIds;
	return params.cliSessionKeys.some((key) => {
		const normalized = require_model_selection_normalize.normalizeProviderId(key);
		return bindings !== null && typeof bindings === "object" && normalized in bindings && bindings[normalized] !== void 0 || ids !== null && typeof ids === "object" && normalized in ids && ids[normalized] !== void 0;
	});
}
function modelRefKey(provider, model) {
	return require_model_selection_normalize.modelKey(provider, model).toLowerCase();
}
function scanEntryForOwner(params) {
	const providerIds = normalizeIdSet(params.owner.providerIds);
	const runtimeIds = normalizeIdSet(params.owner.runtimeIds);
	const cliSessionKeys = [...normalizeIdSet(params.owner.cliSessionKeys)];
	const authProfilePrefixes = normalizePrefixList(params.owner.authProfilePrefixes);
	const routeAllowsOwner = routeAllowsOwnerState({
		owner: params.owner,
		route: params.route
	});
	const routeRuntime = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.route?.runtime);
	const routeAllowsOwnerRuntime = routeRuntime !== void 0 && runtimeIds.has(require_model_selection_normalize.normalizeProviderId(routeRuntime));
	const reasons = [];
	const pinnedRuntimeKeys = [];
	const directOverride = resolvePersistedOverrideModelRef({
		defaultProvider: params.route?.defaultProvider ?? "",
		overrideProvider: params.entry.providerOverride,
		overrideModel: params.entry.modelOverride
	});
	const directOverrideKey = directOverride ? modelRefKey(directOverride.provider, directOverride.model) : void 0;
	const directOverrideIsOwned = directOverride !== null && providerIds.has(require_model_selection_normalize.normalizeProviderId(directOverride.provider));
	const directOverrideIsConfigured = directOverrideKey !== void 0 && (params.route?.configuredModelRefs.some((ref) => ref.toLowerCase() === directOverrideKey) ?? false);
	const directOverrideSource = params.entry.modelOverrideSource === "user" ? "user" : params.entry.modelOverrideSource === "auto" ? "auto" : params.entry.modelOverride ? "legacy" : void 0;
	if (directOverrideIsOwned && !directOverrideIsConfigured) {
		if (directOverrideSource === "auto") addReason(reasons, "auto model override");
		else if (!routeAllowsOwner && directOverride) return { manualReview: {
			key: params.key,
			ownerLabel: params.owner.label,
			message: `${params.key} (${modelRefKey(directOverride.provider, directOverride.model)}, ${directOverrideSource === "user" ? "user" : "legacy"})`
		} };
	}
	const explicitOwnedOverride = directOverrideIsOwned && directOverrideSource !== void 0 && directOverrideSource !== "auto";
	if (!routeAllowsOwnerRuntime && !explicitOwnedOverride) {
		const harnessId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.agentHarnessId);
		if (harnessId && runtimeIds.has(require_model_selection_normalize.normalizeProviderId(harnessId))) {
			addReason(reasons, "pinned runtime");
			pinnedRuntimeKeys.push("agentHarnessId");
		}
		const runtimeOverride = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.agentRuntimeOverride);
		if (runtimeOverride && runtimeIds.has(require_model_selection_normalize.normalizeProviderId(runtimeOverride))) {
			addReason(reasons, "pinned runtime");
			pinnedRuntimeKeys.push("agentRuntimeOverride");
		}
	}
	if (!routeAllowsOwner && !explicitOwnedOverride) {
		const runtimeModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.model);
		const runtimeRef = runtimeModel ? require_model_selection_normalize.parseModelRef(runtimeModel, (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.modelProvider) ?? "", {
			allowManifestNormalization: false,
			allowPluginNormalization: false
		}) : null;
		if (runtimeRef && providerIds.has(require_model_selection_normalize.normalizeProviderId(runtimeRef.provider))) addReason(reasons, "runtime model state");
		if (hasOwnedCliSession({
			entry: params.entry,
			cliSessionKeys
		})) addReason(reasons, "CLI session binding");
		if (params.entry.authProfileOverrideSource === "auto" && ownsPrefixedValue(authProfilePrefixes, params.entry.authProfileOverride)) addReason(reasons, "auto auth profile override");
	}
	if (reasons.length === 0) return {};
	return { repair: {
		key: params.key,
		ownerId: params.owner.id,
		ownerLabel: params.owner.label,
		reasons,
		pinnedRuntimeKeys,
		cliSessionKeys
	} };
}
/** Scans session entries for state owned by plugins that no longer match the configured route. */
function scanSessionRouteStateOwners(params) {
	const repairs = [];
	const manualReview = [];
	for (const [key, entry] of Object.entries(params.store)) {
		if (!entry || typeof entry !== "object" || require_store.isValidAgentHarnessSessionStoreEntry(key, entry)) continue;
		for (const owner of params.owners) {
			const scan = scanEntryForOwner({
				key,
				entry,
				owner,
				route: params.routes[key]
			});
			if (scan.repair) repairs.push(scan.repair);
			if (scan.manualReview) manualReview.push(scan.manualReview);
		}
	}
	return {
		repairs,
		manualReview
	};
}
function clearEntryKey(entry, key) {
	if (entry[key] !== void 0) {
		delete entry[key];
		return true;
	}
	return false;
}
function clearRecordKeys(entry, recordKey, ownedKeys) {
	const value = entry[recordKey];
	if (value === null || typeof value !== "object") return false;
	const record = value;
	let changed = false;
	const next = { ...record };
	for (const key of ownedKeys) {
		const normalized = require_model_selection_normalize.normalizeProviderId(key);
		if (next[normalized] !== void 0) {
			delete next[normalized];
			changed = true;
		}
	}
	if (!changed) return false;
	entry[recordKey] = Object.keys(next).length > 0 ? next : void 0;
	return true;
}
/** Clears stale plugin-owned routing fields from a session entry and refreshes updatedAt. */
function applySessionRouteStateRepair(params) {
	if (require_store.isValidAgentHarnessSessionStoreEntry(params.sessionKey, params.entry)) return false;
	let changed = false;
	const clear = (key) => {
		changed = clearEntryKey(params.entry, key) || changed;
	};
	if (params.repair.reasons.includes("auto model override")) {
		clear("providerOverride");
		clear("modelOverride");
		clear("modelOverrideSource");
		clear("liveModelSwitchPending");
	}
	if (params.repair.reasons.includes("runtime model state")) {
		clear("model");
		clear("modelProvider");
		clear("contextTokens");
		clear("systemPromptReport");
		clear("fallbackNoticeSelectedModel");
		clear("fallbackNoticeActiveModel");
		clear("fallbackNoticeReason");
	}
	if (params.repair.reasons.includes("pinned runtime")) for (const key of params.repair.pinnedRuntimeKeys) clear(key);
	if (params.repair.reasons.includes("CLI session binding")) {
		changed = clearRecordKeys(params.entry, "cliSessionBindings", params.repair.cliSessionKeys) || changed;
		changed = clearRecordKeys(params.entry, "cliSessionIds", params.repair.cliSessionKeys) || changed;
	}
	if (params.repair.reasons.includes("auto auth profile override")) {
		clear("authProfileOverride");
		clear("authProfileOverrideSource");
		clear("authProfileOverrideCompactionCount");
	}
	if (changed) params.entry.updatedAt = params.now;
	return changed;
}
function groupRepairsByOwner(repairs) {
	const grouped = /* @__PURE__ */ new Map();
	for (const repair of repairs) {
		const key = repair.ownerLabel;
		grouped.set(key, [...grouped.get(key) ?? [], repair]);
	}
	return grouped;
}
/** Prompts for and applies plugin-owned session route state repairs to the session store. */
async function runPluginSessionStateDoctorRepairs(params) {
	if (!storeMayContainPluginSessionRouteState(params.store)) return;
	const owners = resolvePluginDoctorSessionRouteStateOwners({
		cfg: params.cfg,
		env: params.env
	});
	if (owners.length === 0) return;
	const scanStore = {};
	const routes = {};
	const routeByAgentId = /* @__PURE__ */ new Map();
	for (const [sessionKey, entry] of Object.entries(params.store)) {
		if (!entry || typeof entry !== "object") continue;
		if (!entryMayContainPluginSessionRouteState(sessionKey, entry)) continue;
		scanStore[sessionKey] = entry;
		const agentId = resolveSessionAgentId(params.cfg, sessionKey);
		let route = routeByAgentId.get(agentId);
		if (!route) {
			route = resolveConfiguredDoctorSessionStateRoute({
				cfg: params.cfg,
				sessionKey,
				env: params.env
			});
			routeByAgentId.set(agentId, route);
		}
		routes[sessionKey] = route;
	}
	if (Object.keys(scanStore).length === 0) return;
	const scan = scanSessionRouteStateOwners({
		owners,
		store: scanStore,
		routes
	});
	if (scan.repairs.length > 0) for (const [ownerLabel, repairs] of groupRepairsByOwner(scan.repairs)) {
		const staleCount = countSessionLabel(repairs.length);
		params.warnings.push([
			`- Found stale ${ownerLabel} session routing state in ${staleCount} outside the current configured model/runtime route.`,
			"  This can keep later message-channel runs pinned to an old runtime/provider after defaults move elsewhere.",
			`  Examples: ${repairs.slice(0, 3).map(repairExample).join(", ")}`
		].join("\n"));
		if (await params.prompter.confirmRuntimeRepair({
			message: `Clear stale ${ownerLabel} session routing state for ${staleCount}?`,
			initialValue: true
		})) {
			let repaired = 0;
			const repairedAt = Date.now();
			const repairsByKey = new Map(repairs.map((repair) => [repair.key, repair]));
			await require_store.updateSessionStore(params.absoluteStorePath, (currentStore) => {
				const currentMutableStore = currentStore;
				for (const [key, repair] of repairsByKey) {
					const current = currentMutableStore[key];
					if (current && applySessionRouteStateRepair({
						sessionKey: key,
						entry: current,
						repair,
						now: repairedAt
					})) repaired += 1;
				}
			});
			if (repaired > 0) params.changes.push(`- Cleared stale ${ownerLabel} session routing state for ${countSessionLabel(repaired)}.`);
		}
	}
	if (scan.manualReview.length > 0) {
		const grouped = /* @__PURE__ */ new Map();
		for (const hit of scan.manualReview) grouped.set(hit.ownerLabel, [...grouped.get(hit.ownerLabel) ?? [], hit]);
		for (const [ownerLabel, hits] of grouped) params.warnings.push([
			`- Found explicit ${ownerLabel} model overrides in ${countSessionLabel(hits.length)} outside the current configured route.`,
			"  Doctor leaves explicit or legacy user selections untouched; switch them with /model or reset the session if that provider is no longer intended.",
			`  Examples: ${hits.slice(0, 3).map((hit) => hit.message).join(", ")}`
		].join("\n"));
	}
}
//#endregion
//#region src/commands/doctor-state-integrity.ts
/** Doctor checks and repairs for state dir durability, sessions, transcripts, and credentials. */
const STATE_INTEGRITY_CHECK_ID = "core/doctor/state-integrity";
function countLabel(count, singular, plural = `${singular}s`) {
	return `${count} ${count === 1 ? singular : plural}`;
}
function formatFilePreview(paths, limit = 3) {
	const names = paths.slice(0, limit).map((filePath) => node_path.default.basename(filePath));
	const remaining = paths.length - names.length;
	if (remaining > 0) return `${names.join(", ")}, and ${remaining} more`;
	return names.join(", ");
}
function existsDir(dir) {
	try {
		return node_fs.default.existsSync(dir) && node_fs.default.statSync(dir).isDirectory();
	} catch {
		return false;
	}
}
function existsFile(filePath) {
	try {
		return node_fs.default.existsSync(filePath) && node_fs.default.statSync(filePath).isFile();
	} catch {
		return false;
	}
}
function tryResolveNativeRealPath(targetPath) {
	try {
		return node_fs.default.realpathSync.native(targetPath);
	} catch {
		return null;
	}
}
function resolveComparableTranscriptPath(filePath) {
	return tryResolveNativeRealPath(filePath) ?? node_path.default.resolve(filePath);
}
function areComparablePathsEqual(leftPath, rightPath) {
	const leftRealPath = tryResolveNativeRealPath(leftPath);
	const rightRealPath = tryResolveNativeRealPath(rightPath);
	return leftRealPath !== null && leftRealPath === rightRealPath;
}
function isReachableConfiguredAgentDir(params) {
	if (params.dirName === params.agentId) return true;
	const rawDir = node_path.default.join(params.agentsRoot, params.dirName, "agent");
	const normalizedDir = node_path.default.join(params.agentsRoot, params.agentId, "agent");
	const rawRealPath = tryResolveNativeRealPath(rawDir);
	const normalizedRealPath = tryResolveNativeRealPath(normalizedDir);
	return rawRealPath !== null && rawRealPath === normalizedRealPath;
}
function formatOrphanAgentDirLabel(entry) {
	return entry.dirName === entry.agentId ? entry.agentId : `${entry.dirName} (id ${entry.agentId})`;
}
function formatOrphanAgentDirPreview(entries, limit = 3) {
	const labels = entries.slice(0, limit).map(formatOrphanAgentDirLabel);
	const remaining = entries.length - labels.length;
	if (remaining > 0) return `${labels.join(", ")}, and ${remaining} more`;
	return labels.join(", ");
}
function listOrphanAgentDirs(cfg, stateDir) {
	const configuredIds = /* @__PURE__ */ new Set();
	configuredIds.add((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg)));
	for (const entry of require_agent_scope_config.listAgentEntries(cfg)) configuredIds.add((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id));
	const agentsRoot = node_path.default.join(stateDir, "agents");
	const liveCompatibilityAgentDir = require_agent_dir_compat.resolveOperatorAgentDir();
	try {
		return node_fs.default.readdirSync(agentsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => ({
			dirName: entry.name,
			agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.name)
		})).filter(({ dirName, agentId }) => {
			const nestedAgentDir = node_path.default.join(agentsRoot, dirName, "agent");
			if (!existsDir(nestedAgentDir)) return false;
			if (areComparablePathsEqual(nestedAgentDir, liveCompatibilityAgentDir)) return false;
			if (!configuredIds.has(agentId)) return true;
			return !isReachableConfiguredAgentDir({
				agentsRoot,
				dirName,
				agentId
			});
		}).toSorted((left, right) => left.agentId.localeCompare(right.agentId) || left.dirName.localeCompare(right.dirName));
	} catch {
		return [];
	}
}
function canWriteDir(dir) {
	try {
		node_fs.default.accessSync(dir, node_fs.default.constants.W_OK);
		return true;
	} catch {
		return false;
	}
}
function ensureDir(dir) {
	try {
		node_fs.default.mkdirSync(dir, { recursive: true });
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: String(err)
		};
	}
}
function dirPermissionHint(dir) {
	const uid = typeof process.getuid === "function" ? process.getuid() : null;
	const gid = typeof process.getgid === "function" ? process.getgid() : null;
	try {
		const stat = node_fs.default.statSync(dir);
		if (uid !== null && stat.uid !== uid) return `Owner mismatch (uid ${stat.uid}). Run: sudo chown -R $USER "${dir}"`;
		if (gid !== null && stat.gid !== gid) return `Group mismatch (gid ${stat.gid}). If access fails, run: sudo chown -R $USER "${dir}"`;
	} catch {
		return null;
	}
	return null;
}
function addUserRwx(mode) {
	return mode & 511 | 448;
}
function countJsonlLines(filePath) {
	try {
		const raw = node_fs.default.readFileSync(filePath, "utf-8");
		if (!raw) return 0;
		let count = 0;
		for (const char of raw) if (char === "\n") count += 1;
		if (!raw.endsWith("\n")) count += 1;
		return count;
	} catch {
		return 0;
	}
}
function findOtherStateDirs(stateDir) {
	const resolvedState = node_path.default.resolve(stateDir);
	const roots = process.platform === "darwin" ? ["/Users"] : process.platform === "linux" ? ["/home"] : [];
	const found = [];
	for (const root of roots) {
		let entries;
		try {
			entries = node_fs.default.readdirSync(root, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			if (entry.name.startsWith(".")) continue;
			const candidates = [".operator"].map((dir) => node_path.default.resolve(root, entry.name, dir));
			for (const candidate of candidates) {
				if (candidate === resolvedState) continue;
				if (existsDir(candidate)) found.push(candidate);
			}
		}
	}
	return found;
}
function isPathUnderRoot(targetPath, rootPath) {
	const normalizedTarget = node_path.default.resolve(targetPath);
	const normalizedRoot = node_path.default.resolve(rootPath);
	const rootToken = node_path.default.parse(normalizedRoot).root;
	if (normalizedRoot === rootToken) return normalizedTarget.startsWith(rootToken);
	return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}${node_path.default.sep}`);
}
function tryResolveRealPath(targetPath) {
	try {
		return node_fs.default.realpathSync(targetPath);
	} catch {
		return null;
	}
}
function resolvePathThroughExistingAncestor(targetPath, resolveRealPath, pathOps) {
	const missingSegments = [];
	let candidate = pathOps.resolve(targetPath);
	while (true) {
		const resolved = resolveRealPath(candidate);
		if (resolved) return pathOps.resolve(resolved, ...missingSegments);
		const parent = pathOps.dirname(candidate);
		if (parent === candidate) return null;
		missingSegments.unshift(pathOps.basename(candidate));
		candidate = parent;
	}
}
function decodeMountInfoPath(value) {
	return value.replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(Number.parseInt(octal, 8)));
}
function escapeControlCharsForTerminal(value) {
	let escaped = "";
	for (const char of value) {
		if (char === "\x1B") {
			escaped += "\\x1b";
			continue;
		}
		if (char === "\r") {
			escaped += "\\r";
			continue;
		}
		if (char === "\n") {
			escaped += "\\n";
			continue;
		}
		if (char === "	") {
			escaped += "\\t";
			continue;
		}
		const code = char.charCodeAt(0);
		if (code >= 0 && code <= 8 || code === 11 || code === 12 || code >= 14 && code <= 31) {
			escaped += `\\x${code.toString(16).padStart(2, "0")}`;
			continue;
		}
		if (code === 127) {
			escaped += "\\x7f";
			continue;
		}
		escaped += char;
	}
	return escaped;
}
function parseLinuxMountInfo(rawMountInfo) {
	const entries = [];
	for (const line of rawMountInfo.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const separatorIndex = trimmed.indexOf(" - ");
		if (separatorIndex === -1) continue;
		const left = trimmed.slice(0, separatorIndex);
		const right = trimmed.slice(separatorIndex + 3);
		const leftFields = left.split(" ");
		const rightFields = right.split(" ");
		if (leftFields.length < 5 || rightFields.length < 2) continue;
		entries.push({
			mountPoint: decodeMountInfoPath((0, _gabrielvfonseca_normalization_core.expectDefined)(leftFields[4], "left fields entry at 4")),
			fsType: (0, _gabrielvfonseca_normalization_core.expectDefined)(rightFields[0], "right fields entry at 0"),
			source: decodeMountInfoPath((0, _gabrielvfonseca_normalization_core.expectDefined)(rightFields[1], "right fields entry at 1"))
		});
	}
	return entries;
}
function isPathUnderRootWithPathOps(targetPath, rootPath, pathOps) {
	const normalizedTarget = pathOps.resolve(targetPath);
	const normalizedRoot = pathOps.resolve(rootPath);
	const rootToken = pathOps.parse(normalizedRoot).root;
	if (normalizedRoot === rootToken) return normalizedTarget.startsWith(rootToken);
	return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}${pathOps.sep}`);
}
function findLinuxMountInfoEntryForPath(targetPath, entries, pathOps) {
	const normalizedTarget = pathOps.resolve(targetPath);
	let bestMatch = null;
	for (const entry of entries) {
		if (!isPathUnderRootWithPathOps(normalizedTarget, entry.mountPoint, pathOps)) continue;
		if (!bestMatch || pathOps.resolve(entry.mountPoint).length > pathOps.resolve(bestMatch.mountPoint).length) bestMatch = entry;
	}
	return bestMatch;
}
function isMmcDevicePath(devicePath, pathOps) {
	const name = pathOps.basename(devicePath);
	return /^mmcblk\d+(?:p\d+)?$/.test(name);
}
function tryReadLinuxMountInfo() {
	try {
		return node_fs.default.readFileSync("/proc/self/mountinfo", "utf8");
	} catch {
		return null;
	}
}
/** Detects Linux state directories mounted from SD/eMMC-style block devices. */
function detectLinuxSdBackedStateDir(stateDir, deps) {
	if ((deps?.platform ?? process.platform) !== "linux") return null;
	const linuxPath = node_path.default.posix;
	const resolvedStatePath = resolvePathThroughExistingAncestor(stateDir, deps?.resolveRealPath ?? tryResolveRealPath, linuxPath) ?? linuxPath.resolve(stateDir);
	const mountInfo = deps?.mountInfo ?? tryReadLinuxMountInfo();
	if (!mountInfo) return null;
	const mountEntry = findLinuxMountInfoEntryForPath(resolvedStatePath, parseLinuxMountInfo(mountInfo), linuxPath);
	if (!mountEntry) return null;
	const sourceCandidates = [mountEntry.source];
	if (mountEntry.source.startsWith("/dev/")) {
		const resolvedDevicePath = (deps?.resolveDeviceRealPath ?? tryResolveRealPath)(mountEntry.source);
		if (resolvedDevicePath) sourceCandidates.push(linuxPath.resolve(resolvedDevicePath));
	}
	if (!sourceCandidates.some((candidate) => isMmcDevicePath(candidate, linuxPath))) return null;
	return {
		path: linuxPath.resolve(resolvedStatePath),
		mountPoint: linuxPath.resolve(mountEntry.mountPoint),
		fsType: mountEntry.fsType,
		source: mountEntry.source
	};
}
/** Formats the warning for state stored on SD/eMMC media. */
function formatLinuxSdBackedStateDirWarning(displayStateDir, linuxSdBackedStateDir) {
	const displayMountPoint = linuxSdBackedStateDir.mountPoint === "/" ? "/" : require_utils.shortenHomePath(linuxSdBackedStateDir.mountPoint);
	return [
		`- State directory appears to be on SD/eMMC storage (${displayStateDir}; device ${escapeControlCharsForTerminal(linuxSdBackedStateDir.source)}, fs ${escapeControlCharsForTerminal(linuxSdBackedStateDir.fsType)}, mount ${escapeControlCharsForTerminal(displayMountPoint)}).`,
		"- SD/eMMC media can be slower for random I/O and wear faster under session/log churn.",
		"- For better startup and state durability, prefer SSD/NVMe (or USB SSD on Raspberry Pi) for OPERATOR_STATE_DIR."
	].join("\n");
}
/** Filesystems whose state disappears on reboot. Docker overlayfs is intentionally excluded. */
const VOLATILE_FS_TYPES = /* @__PURE__ */ new Set(["tmpfs", "ramfs"]);
/** Detects Linux state directories mounted on filesystems that do not survive a reboot. */
function detectLinuxVolatileStateDir(stateDir, deps) {
	if ((deps?.platform ?? process.platform) !== "linux") return null;
	const linuxPath = node_path.default.posix;
	const resolvedStatePath = resolvePathThroughExistingAncestor(stateDir, deps?.resolveRealPath ?? tryResolveRealPath, linuxPath) ?? linuxPath.resolve(stateDir);
	const mountInfo = deps?.mountInfo ?? tryReadLinuxMountInfo();
	if (!mountInfo) return null;
	const mountEntry = findLinuxMountInfoEntryForPath(resolvedStatePath, parseLinuxMountInfo(mountInfo), linuxPath);
	if (!mountEntry || !VOLATILE_FS_TYPES.has(mountEntry.fsType)) return null;
	return {
		path: linuxPath.resolve(resolvedStatePath),
		mountPoint: linuxPath.resolve(mountEntry.mountPoint),
		fsType: mountEntry.fsType
	};
}
/** Formats the warning for state stored on a volatile Linux filesystem. */
function formatLinuxVolatileStateDirWarning(displayStateDir, volatileDir) {
	return [
		`- State directory is on a volatile filesystem (${displayStateDir}; fs ${escapeControlCharsForTerminal(volatileDir.fsType)}, mount ${volatileDir.mountPoint === "/" ? "/" : escapeControlCharsForTerminal(require_utils.shortenHomePath(volatileDir.mountPoint))}).`,
		"- Sessions, credentials, config, and SQLite state (including WAL/journal sidecars) will be lost on reboot.",
		"- Move OPERATOR_STATE_DIR to a persistent filesystem to avoid data loss."
	].join("\n");
}
/** Detects macOS state directories under iCloud Drive or CloudStorage providers. */
function detectMacCloudSyncedStateDir(stateDir, deps) {
	if ((deps?.platform ?? process.platform) !== "darwin") return null;
	const homedir = deps?.homedir ?? node_os.default.homedir();
	const roots = [{
		storage: "iCloud Drive",
		root: node_path.default.join(homedir, "Library", "Mobile Documents", "com~apple~CloudDocs")
	}, {
		storage: "CloudStorage provider",
		root: node_path.default.join(homedir, "Library", "CloudStorage")
	}];
	const realPath = (deps?.resolveRealPath ?? tryResolveRealPath)(stateDir);
	const candidates = realPath ? [node_path.default.resolve(realPath)] : [node_path.default.resolve(stateDir)];
	for (const candidate of candidates) for (const { storage, root } of roots) if (isPathUnderRoot(candidate, root)) return {
		path: candidate,
		storage
	};
	return null;
}
function isPairingPolicy(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value) === "pairing";
}
function hasPairingPolicy(value) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(value);
	if (!record) return false;
	if (isPairingPolicy(record.dmPolicy)) return true;
	const dm = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(record.dm);
	if (dm && isPairingPolicy(dm.policy)) return true;
	const accounts = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(record.accounts);
	if (!accounts) return false;
	for (const accountCfg of Object.values(accounts)) if (hasPairingPolicy(accountCfg)) return true;
	return false;
}
function isSlashRoutingSessionKey(sessionKey) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(sessionKey);
	if (!raw) return false;
	const scoped = require_session_key.parseAgentSessionKey(raw)?.rest ?? raw;
	return /^[^:]+:slash:[^:]+(?:$|:)/.test(scoped);
}
function shouldRequireOAuthDir(cfg, env) {
	if (env.OPERATOR_OAUTH_DIR?.trim()) return true;
	const channels = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(cfg.channels);
	if (!channels) return false;
	const withPersistedAuth = new Set(require_channel_presence_policy.listConfiguredChannelIdsForReadOnlyScope({
		config: cfg,
		env
	}));
	const withoutPersistedAuth = new Set(require_channel_presence_policy.listConfiguredChannelIdsForReadOnlyScope({
		config: cfg,
		env,
		includePersistedAuthState: false
	}));
	if ([...withPersistedAuth].some((channelId) => !withoutPersistedAuth.has(channelId))) return true;
	for (const [channelId, channelCfg] of Object.entries(channels)) {
		if (channelId === "defaults" || channelId === "modelByChannel") continue;
		if (hasPairingPolicy(channelCfg)) return true;
	}
	return false;
}
function shouldSuppressOrphanTranscriptWarning(cfg, agentId) {
	const backendConfig = require_backend_config.resolveMemoryBackendConfig({
		cfg,
		agentId
	});
	return backendConfig?.backend === "qmd" && backendConfig.qmd?.sessions.enabled === true;
}
function detectStateIntegrityHealthIssues(cfg, params) {
	const issues = [];
	const env = params?.env ?? process.env;
	const homedir = () => require_home_dir.resolveRequiredHomeDir(env, params?.homedir ?? node_os.default.homedir);
	const stateDir = require_paths.resolveStateDir(env, homedir);
	const oauthDir = require_paths.resolveOAuthDir(env, stateDir);
	const agentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const sessionsDir = require_paths$1.resolveSessionTranscriptsDirForAgent(agentId, env, homedir);
	const storePath = require_paths$1.resolveStorePath(cfg.session?.store, { agentId });
	const storeDir = node_path.default.dirname(storePath);
	const requireOAuthDir = shouldRequireOAuthDir(cfg, env);
	const cloudSyncedStateDir = detectMacCloudSyncedStateDir(stateDir);
	if (cloudSyncedStateDir) issues.push({
		kind: "mac-cloud-state-dir",
		path: cloudSyncedStateDir.path,
		storage: cloudSyncedStateDir.storage
	});
	const linuxSdBackedStateDir = detectLinuxSdBackedStateDir(stateDir);
	if (linuxSdBackedStateDir) issues.push({
		kind: "linux-sd-state-dir",
		path: linuxSdBackedStateDir.path,
		mountPoint: linuxSdBackedStateDir.mountPoint,
		fsType: linuxSdBackedStateDir.fsType,
		source: linuxSdBackedStateDir.source
	});
	const linuxVolatileStateDir = detectLinuxVolatileStateDir(stateDir);
	if (linuxVolatileStateDir) issues.push({
		kind: "linux-volatile-state-dir",
		path: linuxVolatileStateDir.path,
		mountPoint: linuxVolatileStateDir.mountPoint,
		fsType: linuxVolatileStateDir.fsType
	});
	const stateDirExists = existsDir(stateDir);
	if (!stateDirExists) issues.push({
		kind: "missing-state-dir",
		path: stateDir
	});
	if (stateDirExists && !canWriteDir(stateDir)) {
		const hint = dirPermissionHint(stateDir);
		issues.push({
			kind: "state-dir-not-writable",
			path: stateDir,
			...hint ? { hint } : {}
		});
	}
	if (stateDirExists && process.platform !== "win32") try {
		const dirLstat = node_fs.default.lstatSync(stateDir);
		const isDirSymlink = dirLstat.isSymbolicLink();
		const stat = isDirSymlink ? node_fs.default.statSync(stateDir) : dirLstat;
		if (!(isDirSymlink ? node_fs.default.realpathSync(stateDir) : stateDir).startsWith("/nix/store/") && (stat.mode & 63) !== 0) issues.push({
			kind: "state-dir-too-open",
			path: stateDir,
			mode: stat.mode
		});
	} catch {}
	if (params?.configPath && existsFile(params.configPath) && process.platform !== "win32") try {
		const configLstat = node_fs.default.lstatSync(params.configPath);
		const isSymlink = configLstat.isSymbolicLink();
		const stat = isSymlink ? node_fs.default.statSync(params.configPath) : configLstat;
		if (!(isSymlink ? node_fs.default.realpathSync(params.configPath) : params.configPath).startsWith("/nix/store/") && (stat.mode & 63) !== 0) issues.push({
			kind: "config-file-too-open",
			path: params.configPath,
			mode: stat.mode
		});
	} catch {}
	if (stateDirExists) {
		const dirCandidates = /* @__PURE__ */ new Map();
		dirCandidates.set(sessionsDir, "Sessions dir");
		dirCandidates.set(storeDir, "Session store dir");
		if (requireOAuthDir) dirCandidates.set(oauthDir, "OAuth dir");
		for (const [dir, label] of dirCandidates) {
			if (!existsDir(dir)) {
				issues.push({
					kind: "missing-runtime-dir",
					label,
					path: dir
				});
				continue;
			}
			if (!canWriteDir(dir)) {
				const hint = dirPermissionHint(dir);
				issues.push({
					kind: "runtime-dir-not-writable",
					label,
					path: dir,
					...hint ? { hint } : {}
				});
			}
		}
	}
	return issues;
}
function stateIntegrityIssueToHealthFinding(issue) {
	switch (issue.kind) {
		case "mac-cloud-state-dir": return {
			checkId: STATE_INTEGRITY_CHECK_ID,
			severity: "warning",
			message: `State directory is under macOS cloud-synced storage (${issue.storage}), which can cause slow I/O and sync races.`,
			path: issue.path,
			fixHint: "Move OPERATOR_STATE_DIR to local non-synced storage such as ~/.operator."
		};
		case "linux-sd-state-dir": return {
			checkId: STATE_INTEGRITY_CHECK_ID,
			severity: "warning",
			message: `State directory appears to be on SD/eMMC storage (${issue.source}, ${issue.fsType}), which can hurt startup and durability.`,
			path: issue.path,
			target: issue.mountPoint,
			fixHint: "Move OPERATOR_STATE_DIR to SSD/NVMe-backed storage."
		};
		case "linux-volatile-state-dir": return {
			checkId: STATE_INTEGRITY_CHECK_ID,
			severity: "warning",
			message: `State directory is on volatile ${issue.fsType} storage and may disappear on reboot.`,
			path: issue.path,
			target: issue.mountPoint,
			fixHint: "Move OPERATOR_STATE_DIR to persistent local storage."
		};
		case "missing-state-dir": return {
			checkId: STATE_INTEGRITY_CHECK_ID,
			severity: "error",
			message: "State directory is missing. Sessions, credentials, logs, and config are stored there.",
			path: issue.path,
			fixHint: "Run `openclaw doctor --fix` to create the state directory."
		};
		case "state-dir-not-writable": return {
			checkId: STATE_INTEGRITY_CHECK_ID,
			severity: "error",
			message: issue.hint ? `State directory is not writable. ${issue.hint}` : "State directory is not writable.",
			path: issue.path,
			fixHint: "Run `openclaw doctor --fix` to repair state directory permissions."
		};
		case "state-dir-too-open": return {
			checkId: STATE_INTEGRITY_CHECK_ID,
			severity: "warning",
			message: "State directory permissions are too open. Recommend chmod 700.",
			path: issue.path,
			fixHint: "Run `openclaw doctor --fix` to tighten state directory permissions."
		};
		case "config-file-too-open": return {
			checkId: STATE_INTEGRITY_CHECK_ID,
			severity: "warning",
			message: "Config file is group/world readable. Recommend chmod 600.",
			path: issue.path,
			fixHint: "Run `openclaw doctor --fix` to tighten config file permissions."
		};
		case "missing-runtime-dir": return {
			checkId: STATE_INTEGRITY_CHECK_ID,
			severity: "error",
			message: `${issue.label} is missing.`,
			path: issue.path,
			fixHint: "Run `openclaw doctor --fix` to create missing runtime state directories."
		};
		case "runtime-dir-not-writable": return {
			checkId: STATE_INTEGRITY_CHECK_ID,
			severity: "error",
			message: issue.hint ? `${issue.label} is not writable. ${issue.hint}` : `${issue.label} is not writable.`,
			path: issue.path,
			fixHint: "Run `openclaw doctor --fix` to repair runtime state directory permissions."
		};
	}
	return assertNeverStateIntegrityIssue(issue);
}
function stateIntegrityIssueToRepairEffect(issue) {
	switch (issue.kind) {
		case "mac-cloud-state-dir":
		case "linux-sd-state-dir":
		case "linux-volatile-state-dir": return {
			kind: "state",
			action: "would-recommend-moving-state-dir",
			target: issue.path,
			dryRunSafe: true
		};
		case "missing-state-dir": return {
			kind: "state",
			action: "would-create-state-dir",
			target: issue.path,
			dryRunSafe: false
		};
		case "state-dir-not-writable":
		case "state-dir-too-open": return {
			kind: "state",
			action: "would-repair-state-dir-permissions",
			target: issue.path,
			dryRunSafe: false
		};
		case "config-file-too-open": return {
			kind: "file",
			action: "would-tighten-config-file-permissions",
			target: issue.path,
			dryRunSafe: false
		};
		case "missing-runtime-dir": return {
			kind: "state",
			action: "would-create-runtime-state-dir",
			target: issue.path,
			dryRunSafe: false
		};
		case "runtime-dir-not-writable": return {
			kind: "state",
			action: "would-repair-runtime-state-dir-permissions",
			target: issue.path,
			dryRunSafe: false
		};
	}
	return assertNeverStateIntegrityIssue(issue);
}
function assertNeverStateIntegrityIssue(issue) {
	throw new Error(`Unhandled state integrity issue kind: ${String(issue.kind)}`);
}
/** Emits state integrity warnings and applies selected runtime repairs. */
async function noteStateIntegrity(cfg, prompter, configPath) {
	const warnings = [];
	const changes = [];
	const noteFn = prompter.note ?? require_note.note;
	const env = process.env;
	const homedir = () => require_home_dir.resolveRequiredHomeDir(env, node_os.default.homedir);
	const stateDir = require_paths.resolveStateDir(env, homedir);
	const defaultStateDir = node_path.default.join(homedir(), ".operator");
	const oauthDir = require_paths.resolveOAuthDir(env, stateDir);
	const agentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const sessionsDir = require_paths$1.resolveSessionTranscriptsDirForAgent(agentId, env, homedir);
	const storePath = require_paths$1.resolveStorePath(cfg.session?.store, { agentId });
	const storeDir = node_path.default.dirname(storePath);
	const absoluteStorePath = node_path.default.resolve(storePath);
	const displayStateDir = require_utils.shortenHomePath(stateDir);
	const displayOauthDir = require_utils.shortenHomePath(oauthDir);
	const displaySessionsDir = require_utils.shortenHomePath(sessionsDir);
	const displayStoreDir = require_utils.shortenHomePath(storeDir);
	const displayConfigPath = configPath ? require_utils.shortenHomePath(configPath) : void 0;
	const requireOAuthDir = shouldRequireOAuthDir(cfg, env);
	const cloudSyncedStateDir = detectMacCloudSyncedStateDir(stateDir);
	const linuxSdBackedStateDir = detectLinuxSdBackedStateDir(stateDir);
	const linuxVolatileStateDir = detectLinuxVolatileStateDir(stateDir);
	const suppressOrphanTranscriptWarning = shouldSuppressOrphanTranscriptWarning(cfg, agentId);
	if (cloudSyncedStateDir) warnings.push([
		`- State directory is under macOS cloud-synced storage (${displayStateDir}; ${cloudSyncedStateDir.storage}).`,
		"- This can cause slow I/O and sync/lock races for sessions and credentials.",
		"- Prefer a local non-synced state dir (for example: ~/.operator).",
		`  Set locally: OPERATOR_STATE_DIR=~/.operator ${require_command_format.formatCliCommand("openclaw doctor")}`
	].join("\n"));
	if (linuxSdBackedStateDir) warnings.push(formatLinuxSdBackedStateDirWarning(displayStateDir, linuxSdBackedStateDir));
	if (linuxVolatileStateDir) warnings.push(formatLinuxVolatileStateDirWarning(displayStateDir, linuxVolatileStateDir));
	let stateDirExists = existsDir(stateDir);
	if (!stateDirExists) {
		warnings.push(`- CRITICAL: state directory missing (${displayStateDir}). Sessions, credentials, logs, and config are stored there.`);
		if (cfg.gateway?.mode === "remote") warnings.push("- Gateway is in remote mode; run doctor on the remote host where the gateway runs.");
		if (await prompter.confirmRuntimeRepair({
			message: `Create ${displayStateDir} now?`,
			initialValue: false
		})) {
			const created = ensureDir(stateDir);
			if (created.ok) {
				changes.push(`- Created ${displayStateDir}`);
				stateDirExists = true;
			} else warnings.push(`- Failed to create ${displayStateDir}: ${created.error}`);
		}
	}
	if (stateDirExists && !canWriteDir(stateDir)) {
		warnings.push(`- State directory not writable (${displayStateDir}).`);
		const hint = dirPermissionHint(stateDir);
		if (hint) warnings.push(`  ${hint}`);
		if (await prompter.confirmRuntimeRepair({
			message: `Repair permissions on ${displayStateDir}?`,
			initialValue: true
		})) try {
			const target = addUserRwx(node_fs.default.statSync(stateDir).mode);
			node_fs.default.chmodSync(stateDir, target);
			changes.push(`- Repaired permissions on ${displayStateDir}`);
		} catch (err) {
			warnings.push(`- Failed to repair ${displayStateDir}: ${String(err)}`);
		}
	}
	if (stateDirExists && process.platform !== "win32") try {
		const dirLstat = node_fs.default.lstatSync(stateDir);
		const isDirSymlink = dirLstat.isSymbolicLink();
		const stat = isDirSymlink ? node_fs.default.statSync(stateDir) : dirLstat;
		if (!(isDirSymlink ? node_fs.default.realpathSync(stateDir) : stateDir).startsWith("/nix/store/") && (stat.mode & 63) !== 0) {
			warnings.push(`- State directory permissions are too open (${displayStateDir}). Recommend chmod 700.`);
			if (await prompter.confirmRuntimeRepair({
				message: `Tighten permissions on ${displayStateDir} to 700?`,
				initialValue: true
			})) {
				node_fs.default.chmodSync(stateDir, 448);
				changes.push(`- Tightened permissions on ${displayStateDir} to 700`);
			}
		}
	} catch (err) {
		warnings.push(`- Failed to read ${displayStateDir} permissions: ${String(err)}`);
	}
	if (configPath && existsFile(configPath) && process.platform !== "win32") try {
		const configLstat = node_fs.default.lstatSync(configPath);
		const isSymlink = configLstat.isSymbolicLink();
		const stat = isSymlink ? node_fs.default.statSync(configPath) : configLstat;
		if (!(isSymlink ? node_fs.default.realpathSync(configPath) : configPath).startsWith("/nix/store/") && (stat.mode & 63) !== 0) {
			warnings.push(`- Config file is group/world readable (${displayConfigPath ?? configPath}). Recommend chmod 600.`);
			if (await prompter.confirmRuntimeRepair({
				message: `Tighten permissions on ${displayConfigPath ?? configPath} to 600?`,
				initialValue: true
			})) {
				node_fs.default.chmodSync(configPath, 384);
				changes.push(`- Tightened permissions on ${displayConfigPath ?? configPath} to 600`);
			}
		}
	} catch (err) {
		warnings.push(`- Failed to read config permissions (${displayConfigPath ?? configPath}): ${String(err)}`);
	}
	if (stateDirExists) {
		const dirCandidates = /* @__PURE__ */ new Map();
		dirCandidates.set(sessionsDir, "Sessions dir");
		dirCandidates.set(storeDir, "Session store dir");
		if (requireOAuthDir) dirCandidates.set(oauthDir, "OAuth dir");
		else if (!existsDir(oauthDir)) warnings.push(`- OAuth dir not present (${displayOauthDir}). Skipping create because no WhatsApp/pairing channel config is active.`);
		const displayDirFor = (dir) => {
			if (dir === sessionsDir) return displaySessionsDir;
			if (dir === storeDir) return displayStoreDir;
			if (dir === oauthDir) return displayOauthDir;
			return require_utils.shortenHomePath(dir);
		};
		for (const [dir, label] of dirCandidates) {
			const displayDir = displayDirFor(dir);
			if (!existsDir(dir)) {
				warnings.push(`- CRITICAL: ${label} missing (${displayDir}).`);
				if (await prompter.confirmRuntimeRepair({
					message: `Create ${label} at ${displayDir}?`,
					initialValue: true
				})) {
					const created = ensureDir(dir);
					if (created.ok) changes.push(`- Created ${label}: ${displayDir}`);
					else warnings.push(`- Failed to create ${displayDir}: ${created.error}`);
				}
				continue;
			}
			if (!canWriteDir(dir)) {
				warnings.push(`- ${label} not writable (${displayDir}).`);
				const hint = dirPermissionHint(dir);
				if (hint) warnings.push(`  ${hint}`);
				if (await prompter.confirmRuntimeRepair({
					message: `Repair permissions on ${label}?`,
					initialValue: true
				})) try {
					const target = addUserRwx(node_fs.default.statSync(dir).mode);
					node_fs.default.chmodSync(dir, target);
					changes.push(`- Repaired permissions on ${label}: ${displayDir}`);
				} catch (err) {
					warnings.push(`- Failed to repair ${displayDir}: ${String(err)}`);
				}
			}
		}
	}
	const extraStateDirs = /* @__PURE__ */ new Set();
	if (node_path.default.resolve(stateDir) !== node_path.default.resolve(defaultStateDir)) {
		if (existsDir(defaultStateDir)) extraStateDirs.add(defaultStateDir);
	}
	for (const other of findOtherStateDirs(stateDir)) extraStateDirs.add(other);
	if (extraStateDirs.size > 0) warnings.push([
		"- Multiple state directories detected. This can split session history.",
		...Array.from(extraStateDirs).map((dir) => `  - ${require_utils.shortenHomePath(dir)}`),
		`  Active state dir: ${displayStateDir}`
	].join("\n"));
	const orphanAgentDirs = listOrphanAgentDirs(cfg, stateDir);
	if (orphanAgentDirs.length > 0) warnings.push([
		`- Found ${countLabel(orphanAgentDirs.length, "agent directory", "agent directories")} on disk without a matching agents.list entry.`,
		"  These agents can still have sessions/auth state on disk, but config-driven routing, identity, and model selection will ignore them.",
		`  Examples: ${formatOrphanAgentDirPreview(orphanAgentDirs)}`,
		`  Restore the missing agents.list entries or remove stale dirs after confirming they are no longer needed: ${require_utils.shortenHomePath(node_path.default.join(stateDir, "agents"))}`
	].join("\n"));
	const store = require_store.loadSessionStore(storePath, {
		skipCache: true,
		clone: false
	});
	const sessionPathOpts = require_paths$1.resolveSessionFilePathOptions({
		agentId,
		storePath
	});
	const entries = Object.entries(store).filter(([, entry]) => entry && typeof entry === "object");
	if (entries.length > 0) {
		const recentTranscriptCandidates = entries.slice().toSorted((a, b) => {
			const aUpdated = typeof a[1].updatedAt === "number" ? a[1].updatedAt : 0;
			return (typeof b[1].updatedAt === "number" ? b[1].updatedAt : 0) - aUpdated;
		}).slice(0, 5).filter(([key]) => !isSlashRoutingSessionKey(key));
		const missing = recentTranscriptCandidates.filter(([, entry]) => {
			const sessionId = entry.sessionId;
			if (!sessionId) return false;
			return !existsFile(require_paths$1.resolveSessionFilePath(sessionId, entry, sessionPathOpts));
		});
		if (missing.length > 0) warnings.push([
			`- ${missing.length}/${recentTranscriptCandidates.length} recent sessions are missing transcripts.`,
			`  Verify sessions in store: ${require_command_format.formatCliCommand(`openclaw sessions --store "${absoluteStorePath}"`)}`,
			`  Preview cleanup impact: ${require_command_format.formatCliCommand(`openclaw sessions cleanup --store "${absoluteStorePath}" --dry-run --fix-missing`)}`,
			`  Prune missing entries: ${require_command_format.formatCliCommand(`openclaw sessions cleanup --store "${absoluteStorePath}" --enforce --fix-missing`)}`
		].join("\n"));
		const wedgedSubagentSessions = entries.filter(([, entry]) => require_subagent_recovery_state.isSubagentRecoveryWedgedEntry(entry));
		if (wedgedSubagentSessions.length > 0) {
			const wedgedCount = countLabel(wedgedSubagentSessions.length, "wedged subagent session");
			warnings.push([
				`- Found ${wedgedCount} with automatic restart recovery tombstoned.`,
				"  Operator will not auto-resume these child sessions on restart; reconcile their task records instead.",
				`  Examples: ${wedgedSubagentSessions.slice(0, 3).map(([key]) => key).join(", ")}`,
				`  Fix: ${require_command_format.formatCliCommand("openclaw tasks maintenance --apply")}`
			].join("\n"));
			if (await prompter.confirmRuntimeRepair({
				message: `Clear stale aborted recovery flags for ${wedgedCount}?`,
				initialValue: true
			})) {
				let repaired = 0;
				const repairedAt = Date.now();
				await require_store.updateSessionStore(absoluteStorePath, (currentStore) => {
					for (const [key] of wedgedSubagentSessions) {
						const current = currentStore[key];
						if (current && require_subagent_recovery_state.clearWedgedSubagentRecoveryAbort(current, repairedAt)) {
							repaired += 1;
							currentStore[key] = current;
						}
					}
				});
				if (repaired > 0) changes.push(`- Cleared aborted restart-recovery flags for ${countLabel(repaired, "wedged subagent session")}.`);
			}
			const visibleWedgedReasons = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(wedgedSubagentSessions.map(([, entry]) => require_subagent_recovery_state.formatSubagentRecoveryWedgedReason(entry))).slice(0, 2);
			if (visibleWedgedReasons.length > 0) warnings.push(visibleWedgedReasons.map((reason) => `  Reason: ${reason}`).join("\n"));
		}
		await runPluginSessionStateDoctorRepairs({
			cfg,
			store,
			absoluteStorePath,
			prompter,
			env,
			warnings,
			changes
		});
		await repairHeartbeatPoisonedMainSession({
			cfg,
			store,
			absoluteStorePath,
			stateDir,
			sessionPathOpts,
			prompter,
			warnings,
			changes
		});
		for (const warning of describeHeartbeatSessionTargetIssues(cfg)) warnings.push(warning);
		const mainEntry = store[require_main_session.resolveMainSessionKey(cfg)];
		if (mainEntry?.sessionId) {
			const transcriptPath = require_paths$1.resolveSessionFilePath(mainEntry.sessionId, mainEntry, sessionPathOpts);
			if (!existsFile(transcriptPath)) warnings.push(`- Main session transcript missing (${require_utils.shortenHomePath(transcriptPath)}). History will appear to reset.`);
			else {
				const lineCount = countJsonlLines(transcriptPath);
				if (lineCount <= 1) warnings.push(`- Main session transcript has only ${lineCount} line. Session history may not be appending.`);
			}
		}
	}
	if (existsDir(sessionsDir)) {
		const referencedTranscriptPaths = /* @__PURE__ */ new Set();
		for (const [, entry] of entries) {
			if (!entry?.sessionId) continue;
			try {
				referencedTranscriptPaths.add(resolveComparableTranscriptPath(require_paths$1.resolveSessionFilePath(entry.sessionId, entry, sessionPathOpts)));
			} catch {}
		}
		const orphanTranscriptPaths = node_fs.default.readdirSync(sessionsDir, { withFileTypes: true }).filter((entry) => entry.isFile() && require_paths$1.isPrimarySessionTranscriptFileName(entry.name)).map((entry) => node_path.default.join(sessionsDir, entry.name)).filter((filePath) => !referencedTranscriptPaths.has(resolveComparableTranscriptPath(filePath)));
		if (orphanTranscriptPaths.length > 0 && !suppressOrphanTranscriptWarning) {
			const orphanCount = countLabel(orphanTranscriptPaths.length, "orphan transcript file");
			const orphanPreview = formatFilePreview(orphanTranscriptPaths);
			warnings.push([
				`- Found ${orphanCount} in ${displaySessionsDir}.`,
				"  These .jsonl files are no longer referenced by sessions.json, so they are not part of any active session history.",
				"  Doctor can archive them safely by renaming each file to *.deleted.<timestamp>.",
				`  Examples: ${orphanPreview}`
			].join("\n"));
			if (await prompter.confirmRuntimeRepair({
				message: `Archive ${orphanCount} in ${displaySessionsDir}? This only renames them to *.deleted.<timestamp>.`,
				initialValue: false,
				requiresInteractiveConfirmation: true
			})) {
				let archived = 0;
				const archivedAt = require_paths$1.formatSessionArchiveTimestamp();
				for (const orphanPath of orphanTranscriptPaths) {
					const archivedPath = `${orphanPath}.deleted.${archivedAt}`;
					try {
						node_fs.default.renameSync(orphanPath, archivedPath);
						archived += 1;
					} catch (err) {
						warnings.push(`- Failed to archive orphan transcript ${require_utils.shortenHomePath(orphanPath)}: ${String(err)}`);
					}
				}
				if (archived > 0) changes.push(`- Archived ${countLabel(archived, "orphan transcript file")} in ${displaySessionsDir} as .deleted timestamped backups.`);
			}
		}
	}
	if (warnings.length > 0) noteFn(warnings.join("\n"), "State integrity");
	if (changes.length > 0) noteFn(changes.join("\n"), "Doctor changes");
}
/** Returns the workspace git-backup tip when the workspace exists but is not a git repo. */
function collectWorkspaceBackupTip(workspaceDir) {
	if (!existsDir(workspaceDir)) return null;
	const gitMarker = node_path.default.join(workspaceDir, ".git");
	if (node_fs.default.existsSync(gitMarker)) return null;
	return "- Tip: back up the agent workspace in a private git repo; keep ~/.operator out of git (credentials, sessions). Details: /concepts/agent-workspace#git-backup-recommended";
}
/** Emits the workspace backup tip when applicable. */
function noteWorkspaceBackupTip(workspaceDir) {
	const tip = collectWorkspaceBackupTip(workspaceDir);
	if (tip) require_note.note(tip, "Workspace");
}
//#endregion
exports.collectWorkspaceBackupTip = collectWorkspaceBackupTip;
exports.detectLinuxSdBackedStateDir = detectLinuxSdBackedStateDir;
exports.detectLinuxVolatileStateDir = detectLinuxVolatileStateDir;
exports.detectMacCloudSyncedStateDir = detectMacCloudSyncedStateDir;
exports.detectStateIntegrityHealthIssues = detectStateIntegrityHealthIssues;
exports.formatLinuxSdBackedStateDirWarning = formatLinuxSdBackedStateDirWarning;
exports.formatLinuxVolatileStateDirWarning = formatLinuxVolatileStateDirWarning;
exports.noteStateIntegrity = noteStateIntegrity;
exports.noteWorkspaceBackupTip = noteWorkspaceBackupTip;
exports.stateIntegrityIssueToHealthFinding = stateIntegrityIssueToHealthFinding;
exports.stateIntegrityIssueToRepairEffect = stateIntegrityIssueToRepairEffect;
