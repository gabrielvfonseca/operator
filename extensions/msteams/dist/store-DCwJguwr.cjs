const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_json_files = require("./json-files-Bp0Z4DKb.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_registry = require("./registry-BWWaGAnQ.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_registry_loaded = require("./registry-loaded-BQ6D0fDi.cjs");
const require_registry$1 = require("./registry-raOBfWNF.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_host_hook_json = require("./host-hook-json-BhDT-UAu.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_parse_duration = require("./parse-duration-Csu-f48Z.cjs");
const require_zod_schema = require("./zod-schema-88BPc5CZ.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_facade_runtime = require("./facade-runtime-BM8A5__s.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_paths$1 = require("./paths-BRFVmnyv.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let node_async_hooks = require("node:async_hooks");
let node_util = require("node:util");
//#region src/shared/store-writer-queue.ts
const activeStoreWriters = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.activeStoreWriters"), () => new node_async_hooks.AsyncLocalStorage());
function isActiveStoreWriter(queues, storePath) {
	let active = activeStoreWriters.getStore();
	while (active) {
		if (active.active && active.queues === queues && active.storePath === storePath) return true;
		active = active.parent;
	}
	return false;
}
async function runActiveStoreWriter(queues, storePath, fn) {
	const writer = {
		active: true,
		parent: activeStoreWriters.getStore(),
		queues,
		storePath
	};
	try {
		return await activeStoreWriters.run(writer, fn);
	} finally {
		writer.active = false;
	}
}
function getOrCreateStoreWriterQueue(queues, storePath) {
	const existing = queues.get(storePath);
	if (existing) return existing;
	const created = {
		running: false,
		pending: [],
		drainPromise: null
	};
	queues.set(storePath, created);
	return created;
}
async function drainStoreWriterQueue(queues, storePath) {
	const queue = queues.get(storePath);
	if (!queue) return;
	if (queue.drainPromise) {
		await queue.drainPromise;
		return;
	}
	queue.running = true;
	queue.drainPromise = (async () => {
		try {
			while (queue.pending.length > 0) {
				const task = queue.pending.shift();
				if (!task) continue;
				let result;
				let failed;
				let hasFailure = false;
				try {
					result = await task.fn();
				} catch (err) {
					hasFailure = true;
					failed = err;
				}
				if (hasFailure) {
					task.reject(failed);
					continue;
				}
				task.resolve(result);
			}
		} finally {
			queue.running = false;
			queue.drainPromise = null;
			if (queue.pending.length === 0) queues.delete(storePath);
			else queueMicrotask(() => {
				drainStoreWriterQueue(queues, storePath);
			});
		}
	})();
	await queue.drainPromise;
}
/** Runs one store write after prior writes for the same store path have finished. */
async function runQueuedStoreWrite(params) {
	if (!params.storePath || typeof params.storePath !== "string") throw new Error(`${params.label}: storePath must be a non-empty string, got ${JSON.stringify(params.storePath)}`);
	if (params.reentrant === true && isActiveStoreWriter(params.queues, params.storePath)) return await params.fn();
	const queue = getOrCreateStoreWriterQueue(params.queues, params.storePath);
	return await new Promise((resolve, reject) => {
		const task = {
			fn: async () => await runActiveStoreWriter(params.queues, params.storePath, params.fn),
			resolve: (value) => resolve(value),
			reject
		};
		queue.pending.push(task);
		drainStoreWriterQueue(params.queues, params.storePath);
	});
}
//#endregion
//#region src/config/sessions/store-entry.ts
function normalizeStoreSessionKey(sessionKey) {
	return require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(sessionKey);
}
function foldedSessionKeyAliasCandidates(normalizedKey) {
	const aliases = /* @__PURE__ */ new Set();
	const foldedLegacyKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalizedKey);
	if (foldedLegacyKey !== normalizedKey) aliases.add(foldedLegacyKey);
	if (require_session_key.requiresFoldedSessionKeyAliasProof(normalizedKey)) {
		const { baseSessionKey, threadId } = require_session_key.parseThreadSessionSuffix(normalizedKey);
		const foldedBaseKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(baseSessionKey);
		if (baseSessionKey && threadId && foldedBaseKey !== baseSessionKey) aliases.add(`${foldedBaseKey}:thread:${threadId}`);
	}
	return [...aliases];
}
/** The case-sensitive room/peer target an entry actually delivers to. Delivery
*  metadata preserves the real opaque id even when the session KEY was lowercased
*  by the bug, so it distinguishes a lowercased artifact from a distinct room. */
function normalizeEntryTarget(value) {
	if (typeof value !== "string") return "";
	const trimmed = value.trim();
	const sigilIndexes = ["!", "#"].map((sigil) => trimmed.indexOf(sigil)).filter((index) => index >= 0);
	if (sigilIndexes.length === 0) return trimmed;
	return trimmed.slice(Math.min(...sigilIndexes));
}
function entryDeliveryTargets(entry) {
	return [
		entry?.deliveryContext?.to,
		entry?.lastTo,
		entry?.origin?.nativeChannelId,
		entry?.origin?.to,
		entry?.groupId
	].map(normalizeEntryTarget).filter(Boolean);
}
function normalizeEntryThreadId(value) {
	if (value == null) return "";
	if (typeof value !== "string" && typeof value !== "number") return "";
	return String(value).trim();
}
function entryThreadId(entry) {
	return normalizeEntryThreadId(entry?.deliveryContext?.threadId ?? entry?.lastThreadId ?? entry?.origin?.threadId);
}
/** Tail-preserved keys like Matrix rooms need delivery-target proof before a
*  folded key is treated as a legacy alias. Segment-preserved legacy keys
*  (Signal groups) keep their old permissive lowercase fallback. */
function isConfirmedLowercasedLegacyAlias(entry, normalizedKey) {
	if (!entry) return false;
	if (!require_session_key.requiresFoldedSessionKeyAliasProof(normalizedKey)) return true;
	const { baseSessionKey, threadId } = require_session_key.parseThreadSessionSuffix(normalizedKey);
	const normalizedBaseKey = baseSessionKey ?? normalizedKey;
	if (!entryDeliveryTargets(entry).some((target) => normalizedBaseKey.includes(target))) return false;
	if (!threadId) return true;
	return entryThreadId(entry) === threadId;
}
function hasMismatchedCaseSensitiveDeliveryProof(entry, normalizedKey) {
	if (!entry || !require_session_key.requiresFoldedSessionKeyAliasProof(normalizedKey)) return false;
	const { baseSessionKey, threadId } = require_session_key.parseThreadSessionSuffix(normalizedKey);
	const normalizedBaseKey = baseSessionKey ?? normalizedKey;
	const targets = entryDeliveryTargets(entry);
	if (targets.length > 0 && !targets.some((target) => normalizedBaseKey.includes(target))) return true;
	const storedThreadId = entryThreadId(entry);
	return Boolean(threadId && storedThreadId && storedThreadId !== threadId);
}
function resolveSessionEntryCandidates(params) {
	const trimmedKey = params.sessionKey.trim();
	const normalizedKey = normalizeStoreSessionKey(trimmedKey);
	const foldedLegacyKeys = foldedSessionKeyAliasCandidates(normalizedKey);
	const entries = new Map(params.entries.map((candidate) => [candidate.sessionKey, candidate]));
	const legacyKeySet = /* @__PURE__ */ new Set();
	const trimmedCandidate = entries.get(trimmedKey);
	if (trimmedKey !== normalizedKey && trimmedCandidate && !hasMismatchedCaseSensitiveDeliveryProof(trimmedCandidate.entry, normalizedKey)) legacyKeySet.add(trimmedKey);
	let foldedLegacyEntry;
	let foldedLegacyUpdatedAt = 0;
	for (const foldedLegacyKey of foldedLegacyKeys) {
		const candidate = entries.get(foldedLegacyKey);
		if (!candidate || !isConfirmedLowercasedLegacyAlias(candidate.entry, normalizedKey)) continue;
		legacyKeySet.add(foldedLegacyKey);
		const updatedAt = candidate.entry.updatedAt ?? 0;
		if (!foldedLegacyEntry || updatedAt > foldedLegacyUpdatedAt) {
			foldedLegacyEntry = candidate;
			foldedLegacyUpdatedAt = updatedAt;
		}
	}
	const exactEntry = entries.get(normalizedKey);
	const usableExactEntry = hasMismatchedCaseSensitiveDeliveryProof(exactEntry?.entry, normalizedKey) ? void 0 : exactEntry;
	const exactKeyWins = require_session_key.requiresFoldedSessionKeyAliasProof(normalizedKey);
	const fallbackLegacyEntry = legacyKeySet.size > 0 && !hasMismatchedCaseSensitiveDeliveryProof(trimmedCandidate?.entry, normalizedKey) ? trimmedCandidate : void 0;
	let existing = exactKeyWins ? usableExactEntry ?? foldedLegacyEntry ?? fallbackLegacyEntry : void 0;
	let existingUpdatedAt = existing?.entry.updatedAt ?? 0;
	if (!exactKeyWins) for (const candidate of [
		usableExactEntry,
		foldedLegacyEntry,
		fallbackLegacyEntry
	]) {
		const candidateUpdatedAt = candidate?.entry.updatedAt ?? 0;
		if (candidate && (!existing || candidateUpdatedAt > existingUpdatedAt)) {
			existing = candidate;
			existingUpdatedAt = candidateUpdatedAt;
		}
	}
	for (const [candidateKey, candidate] of entries) {
		if (candidateKey === normalizedKey) continue;
		if (normalizeStoreSessionKey(candidateKey) !== normalizedKey) continue;
		if (hasMismatchedCaseSensitiveDeliveryProof(candidate.entry, normalizedKey)) continue;
		legacyKeySet.add(candidateKey);
		const candidateUpdatedAt = candidate.entry.updatedAt ?? 0;
		if (!existing || candidateUpdatedAt > existingUpdatedAt) {
			existing = candidate;
			existingUpdatedAt = candidateUpdatedAt;
		}
	}
	return {
		normalizedKey,
		existing,
		legacyKeys: [...legacyKeySet]
	};
}
function resolveSessionStoreEntry(params) {
	const resolved = resolveSessionEntryCandidates({
		entries: Object.entries(params.store).map(([sessionKey, entry]) => ({
			entry,
			sessionKey
		})),
		sessionKey: params.sessionKey
	});
	return {
		normalizedKey: resolved.normalizedKey,
		existing: resolved.existing?.entry,
		legacyKeys: resolved.legacyKeys
	};
}
//#endregion
//#region src/channels/plugins/session-conversation.ts
/**
* Session conversation key helpers.
*
* Resolves threaded channel session keys through plugin hooks and generic parsing.
*/
const SESSION_KEY_API_ARTIFACT_BASENAME = "session-key-api.js";
function normalizeResolvedChannel(channel) {
	return require_registry$1.normalizeChannelId(channel) ?? require_registry.normalizeChannelId(channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel) ?? "";
}
function getMessagingAdapter(channel) {
	const normalizedChannel = normalizeResolvedChannel(channel);
	try {
		return require_registry$1.getLoadedChannelPlugin(normalizedChannel)?.messaging;
	} catch {
		return;
	}
}
function buildGenericConversationResolution(rawId) {
	const trimmed = rawId.trim();
	if (!trimmed) return null;
	const parsed = require_session_key.parseThreadSessionSuffix(trimmed);
	const id = (parsed.baseSessionKey ?? trimmed).trim();
	if (!id) return null;
	return {
		id,
		threadId: parsed.threadId,
		baseConversationId: id,
		parentConversationCandidates: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueSingleOrTrimmedStringList)(parsed.threadId ? [parsed.baseSessionKey] : [])
	};
}
function normalizeSessionConversationResolution(resolved) {
	if (!resolved?.id?.trim()) return null;
	return {
		id: resolved.id.trim(),
		threadId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolved.threadId),
		baseConversationId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolved.baseConversationId) ?? (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueSingleOrTrimmedStringList)(resolved.parentConversationCandidates ?? []).at(-1) ?? resolved.id.trim(),
		parentConversationCandidates: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueSingleOrTrimmedStringList)(resolved.parentConversationCandidates ?? []),
		hasExplicitParentConversationCandidates: Object.hasOwn(resolved, "parentConversationCandidates")
	};
}
function resolveBundledSessionConversationFallback(params) {
	if (isBundledSessionConversationFallbackDisabled(params.channel)) return null;
	const dirName = normalizeResolvedChannel(params.channel);
	let loaded;
	try {
		loaded = require_facade_runtime.tryLoadActivatedBundledPluginPublicSurfaceModuleSync({
			dirName,
			artifactBasename: SESSION_KEY_API_ARTIFACT_BASENAME
		});
	} catch {
		return null;
	}
	const resolveSessionConversationLocal = loaded?.resolveSessionConversation;
	if (typeof resolveSessionConversationLocal !== "function") return null;
	return normalizeSessionConversationResolution(resolveSessionConversationLocal({
		kind: params.kind,
		rawId: params.rawId
	}));
}
function isBundledSessionConversationFallbackDisabled(channel) {
	const snapshot = require_runtime_snapshot.getRuntimeConfigSnapshot();
	if (!snapshot?.plugins) return false;
	if (snapshot.plugins.enabled === false) return true;
	const entry = snapshot.plugins.entries?.[normalizeResolvedChannel(channel)];
	return Boolean(entry) && typeof entry === "object" && entry.enabled === false;
}
function shouldProbeBundledSessionConversationFallback(rawId) {
	return rawId.includes(":");
}
function resolveSessionConversationResolution(params) {
	const rawId = params.rawId.trim();
	if (!rawId) return null;
	const messaging = getMessagingAdapter(params.channel);
	const pluginResolved = normalizeSessionConversationResolution(messaging?.resolveSessionConversation?.({
		kind: params.kind,
		rawId
	}));
	const shouldTryBundledFallback = params.bundledFallback !== false && !messaging && shouldProbeBundledSessionConversationFallback(rawId);
	const resolved = pluginResolved ?? (shouldTryBundledFallback ? resolveBundledSessionConversationFallback({
		channel: params.channel,
		kind: params.kind,
		rawId
	}) : null) ?? buildGenericConversationResolution(rawId);
	if (!resolved) return null;
	const parentConversationCandidates = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueSingleOrTrimmedStringList)(pluginResolved?.hasExplicitParentConversationCandidates ? resolved.parentConversationCandidates : messaging?.resolveParentConversationCandidates?.({
		kind: params.kind,
		rawId
	}) ?? resolved.parentConversationCandidates);
	const baseConversationId = parentConversationCandidates.at(-1) ?? resolved.baseConversationId ?? resolved.id;
	return {
		...resolved,
		baseConversationId,
		parentConversationCandidates
	};
}
/**
* Resolves one raw channel conversation id into base/thread conversation metadata.
*/
function resolveSessionConversation(params) {
	return resolveSessionConversationResolution(params);
}
function buildBaseSessionKey(raw, id) {
	return `${raw.prefix}:${id}`;
}
function resolveSessionConversationRef(sessionKey, opts = {}) {
	const raw = require_session_key.parseRawSessionConversationRef(sessionKey);
	if (!raw) return null;
	const resolved = resolveSessionConversation({
		...raw,
		bundledFallback: opts.bundledFallback
	});
	if (!resolved) return null;
	return {
		channel: normalizeResolvedChannel(raw.channel),
		kind: raw.kind,
		rawId: raw.rawId,
		id: resolved.id,
		threadId: resolved.threadId,
		baseSessionKey: buildBaseSessionKey(raw, resolved.id),
		baseConversationId: resolved.baseConversationId,
		parentConversationCandidates: resolved.parentConversationCandidates
	};
}
/**
* Resolves thread suffix metadata from a session key, using channel hooks when available.
*/
function resolveSessionThreadInfo(sessionKey, opts = {}) {
	const resolved = resolveSessionConversationRef(sessionKey, opts);
	if (!resolved) return require_session_key.parseThreadSessionSuffix(sessionKey);
	return {
		baseSessionKey: resolved.threadId ? resolved.baseSessionKey : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey),
		threadId: resolved.threadId
	};
}
/**
* Resolves the parent session key for a threaded child session.
*/
function resolveSessionParentSessionKey(sessionKey) {
	const { baseSessionKey, threadId } = resolveSessionThreadInfo(sessionKey);
	if (!threadId) return null;
	return baseSessionKey ?? null;
}
//#endregion
//#region src/channels/plugins/session-thread-info-loaded.ts
/**
* Loaded-plugin session thread info resolver.
*
* Uses only already loaded channel hooks to resolve thread suffix metadata on hot paths.
*/
function resolveLoadedSessionConversationThreadInfo(sessionKey) {
	const raw = require_session_key.parseRawSessionConversationRef(sessionKey);
	if (!raw) return null;
	const rawId = raw.rawId.trim();
	if (!rawId) return null;
	const resolved = (require_registry_loaded.getLoadedChannelPluginForRead(raw.channel)?.messaging)?.resolveSessionConversation?.({
		kind: raw.kind,
		rawId
	});
	if (!resolved?.id?.trim()) return null;
	const id = resolved.id.trim();
	const threadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolved.threadId);
	return {
		baseSessionKey: threadId ? `${raw.prefix}:${id}` : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey),
		threadId
	};
}
/**
* Resolves thread suffix metadata using loaded plugin hooks or generic parsing.
*/
function resolveLoadedSessionThreadInfo(sessionKey) {
	return resolveLoadedSessionConversationThreadInfo(sessionKey) ?? require_session_key.parseThreadSessionSuffix(sessionKey);
}
//#endregion
//#region src/config/sessions/thread-info.ts
/**
* Extract deliveryContext and threadId from a sessionKey.
* Supports generic :thread: suffixes plus plugin-owned thread/session grammars.
*/
function parseSessionThreadInfo(sessionKey) {
	return resolveSessionThreadInfo(sessionKey);
}
function parseSessionThreadInfoFast(sessionKey) {
	return resolveLoadedSessionThreadInfo(sessionKey);
}
//#endregion
//#region src/config/sessions/store-maintenance.ts
const log$2 = require_subsystem.createSubsystemLogger("sessions/store");
const DEFAULT_SESSION_PRUNE_AFTER_MS = 720 * 60 * 60 * 1e3;
const DEFAULT_MODEL_RUN_PRUNE_AFTER_MS = 1440 * 60 * 1e3;
const DEFAULT_SESSION_MAX_ENTRIES = 500;
const DEFAULT_SESSION_MAINTENANCE_MODE = "enforce";
const DEFAULT_SESSION_DISK_BUDGET_HIGH_WATER_RATIO = .8;
const DEFAULT_SESSION_MAX_DISK_BYTES = 2 * 1024 * 1024 * 1024;
const STRICT_ENTRY_MAINTENANCE_MAX_ENTRIES = 49;
const MIN_BATCHED_ENTRY_MAINTENANCE_SLACK = 25;
const BATCHED_ENTRY_MAINTENANCE_SLACK_RATIO = .1;
function resolvePruneAfterMs(maintenance) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(maintenance?.pruneAfter ?? maintenance?.pruneDays);
	if (!normalized) return DEFAULT_SESSION_PRUNE_AFTER_MS;
	try {
		return require_parse_duration.parseDurationMs(normalized, { defaultUnit: "d" });
	} catch {
		return DEFAULT_SESSION_PRUNE_AFTER_MS;
	}
}
function resolveResetArchiveRetentionMs(maintenance) {
	const raw = maintenance?.resetArchiveRetention;
	if (raw === false) return null;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(raw);
	if (!normalized) return null;
	try {
		return require_parse_duration.parseDurationMs(normalized, { defaultUnit: "d" });
	} catch {
		return null;
	}
}
function resolveMaxDiskBytes(maintenance) {
	const raw = maintenance?.maxDiskBytes;
	if (raw === false) return null;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(raw);
	if (!normalized) return DEFAULT_SESSION_MAX_DISK_BYTES;
	try {
		return require_zod_schema.parseByteSize(normalized, { defaultUnit: "b" });
	} catch {
		return null;
	}
}
function resolveHighWaterBytes(maintenance, maxDiskBytes) {
	const computeDefault = () => {
		if (maxDiskBytes == null) return null;
		if (maxDiskBytes <= 0) return 0;
		return Math.max(1, Math.min(maxDiskBytes, Math.floor(maxDiskBytes * DEFAULT_SESSION_DISK_BUDGET_HIGH_WATER_RATIO)));
	};
	if (maxDiskBytes == null) return null;
	const raw = maintenance?.highWaterBytes;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(raw);
	if (!normalized) return computeDefault();
	try {
		const parsed = require_zod_schema.parseByteSize(normalized, { defaultUnit: "b" });
		return Math.min(parsed, maxDiskBytes);
	} catch {
		return computeDefault();
	}
}
/**
* Resolve maintenance settings from operator.json (`session.maintenance`).
* Falls back to built-in defaults when config is missing or unset.
*/
function resolveMaintenanceConfigFromInput(maintenance) {
	const pruneAfterMs = resolvePruneAfterMs(maintenance);
	const maxDiskBytes = resolveMaxDiskBytes(maintenance);
	return {
		mode: maintenance?.mode ?? DEFAULT_SESSION_MAINTENANCE_MODE,
		pruneAfterMs,
		maxEntries: maintenance?.maxEntries ?? DEFAULT_SESSION_MAX_ENTRIES,
		modelRunPruneAfterMs: DEFAULT_MODEL_RUN_PRUNE_AFTER_MS,
		resetArchiveRetentionMs: resolveResetArchiveRetentionMs(maintenance),
		maxDiskBytes,
		highWaterBytes: resolveHighWaterBytes(maintenance, maxDiskBytes)
	};
}
function resolveSessionEntryMaintenanceHighWater(maxEntries) {
	if (!Number.isSafeInteger(maxEntries) || maxEntries <= 0) return 1;
	if (maxEntries <= STRICT_ENTRY_MAINTENANCE_MAX_ENTRIES) return maxEntries + 1;
	return maxEntries + Math.max(MIN_BATCHED_ENTRY_MAINTENANCE_SLACK, Math.ceil(maxEntries * BATCHED_ENTRY_MAINTENANCE_SLACK_RATIO));
}
function shouldRunSessionEntryMaintenance(params) {
	if (params.force) return true;
	return params.entryCount >= resolveSessionEntryMaintenanceHighWater(params.maxEntries);
}
function shouldRunModelRunPrune(params) {
	if (params.force) return params.entryCount > params.maintenance.maxEntries;
	return shouldRunSessionEntryMaintenance({
		entryCount: params.entryCount,
		maxEntries: params.maintenance.maxEntries
	});
}
function isGatewayModelRunSessionKey(sessionKey) {
	const match = /^agent:([^:\s]+):explicit:model-run-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.exec(sessionKey);
	if (!match) return false;
	const agentId = match[1];
	if (!agentId || /\s/.test(agentId)) return false;
	const parsed = require_session_key.parseAgentSessionKey(sessionKey);
	if (!parsed || parsed.agentId !== agentId.toLowerCase()) return false;
	const rest = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsed.rest);
	return /^explicit:model-run-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(rest);
}
/**
* Remove entries whose `updatedAt` is older than the configured threshold.
* Entries without `updatedAt` are kept (cannot determine staleness).
* Mutates `store` in-place.
*/
function pruneStaleEntries(store, overrideMaxAgeMs, opts = {}) {
	const maxAgeMs = overrideMaxAgeMs ?? resolveMaintenanceConfigFromInput().pruneAfterMs;
	const cutoffMs = Date.now() - maxAgeMs;
	let pruned = 0;
	for (const [key, entry] of Object.entries(store)) {
		if (shouldPreserveMaintenanceEntry({
			key,
			entry,
			preserveKeys: opts.preserveKeys
		})) continue;
		if (entry?.updatedAt != null && entry.updatedAt < cutoffMs) {
			opts.onPruned?.({
				key,
				entry
			});
			delete store[key];
			pruned++;
		}
	}
	if (pruned > 0 && opts.log !== false) log$2.info("pruned stale session entries", {
		pruned,
		maxAgeMs
	});
	return pruned;
}
/**
* Remove stale one-shot gateway model-run probe sessions before normal retention/capping.
* Existing polluted stores may not carry modelRun metadata, so this intentionally keys off the
* strict explicit model-run UUID session shape created by the gateway probe CLI path.
*/
function pruneStaleModelRunEntries(store, overrideMaxAgeMs, opts = {}) {
	if (overrideMaxAgeMs == null) return 0;
	const cutoffMs = Date.now() - overrideMaxAgeMs;
	let pruned = 0;
	for (const [key, entry] of Object.entries(store)) {
		if (shouldPreserveMaintenanceEntry({
			key,
			entry,
			preserveKeys: opts.preserveKeys
		})) continue;
		if (!isGatewayModelRunSessionKey(key)) continue;
		if (entry?.updatedAt != null && entry.updatedAt < cutoffMs) {
			opts.onPruned?.({
				key,
				entry
			});
			delete store[key];
			pruned++;
		}
	}
	if (pruned > 0 && opts.log !== false) log$2.info("pruned stale gateway model-run session entries", {
		pruned,
		maxAgeMs: overrideMaxAgeMs
	});
	return pruned;
}
const DEFAULT_QUOTA_SUSPENSION_TTL_MS = 1800 * 1e3;
const QUOTA_SUSPENSION_CLEANUP_FACTOR = 2;
/**
* Resolves the TTL maintenance patch for one session entry without reading or
* mutating the whole store. Attempt hot paths use this before entry-scoped
* accessor writes so unrelated sessions stay out of the request path.
*/
function resolveQuotaSuspensionEntryMaintenance(params) {
	const suspension = params.entry.quotaSuspension;
	if (!suspension) return {
		patch: null,
		cleared: false
	};
	const ttlMs = params.ttlMs ?? DEFAULT_QUOTA_SUSPENSION_TTL_MS;
	const cleanupAfterResumeMs = ttlMs * (QUOTA_SUSPENSION_CLEANUP_FACTOR - 1);
	const resumeAtMs = suspension.expectedResumeBy ?? suspension.suspendedAt + ttlMs;
	const cleanupAtMs = resumeAtMs + cleanupAfterResumeMs;
	if (params.now >= cleanupAtMs) return {
		patch: { quotaSuspension: void 0 },
		cleared: true
	};
	if (suspension.state === "suspended" && params.now >= resumeAtMs) return {
		patch: { quotaSuspension: {
			...suspension,
			state: "resuming"
		} },
		resumed: { laneId: suspension.laneId },
		cleared: false
	};
	return {
		patch: null,
		cleared: false
	};
}
function getEntryUpdatedAt$1(entry) {
	return entry?.updatedAt ?? Number.NEGATIVE_INFINITY;
}
function isSyntheticSessionMaintenanceKey(sessionKey) {
	const rest = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_session_key.parseAgentSessionKey(sessionKey)?.rest ?? sessionKey);
	return require_session_key.isSubagentSessionKey(sessionKey) || require_session_key.isAcpSessionKey(sessionKey) || require_session_key.isCronSessionKey(sessionKey) || rest.startsWith("acp-bridge:") || rest.startsWith("hook:") || rest.startsWith("node:") || rest === "heartbeat" || rest.endsWith(":heartbeat") || rest.includes(":heartbeat:");
}
function isTelegramTopicSessionKey(sessionKey) {
	const rest = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_session_key.parseAgentSessionKey(sessionKey)?.rest ?? sessionKey);
	return /^telegram:(?:group|channel|direct|dm):.+:topic:[^:]+$/.test(rest);
}
function isExternalGroupOrChannelSessionKey(sessionKey) {
	const rest = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_session_key.parseAgentSessionKey(sessionKey)?.rest ?? sessionKey);
	return /^[^:]+:(?:group|channel):.+$/.test(rest);
}
function isProtectedSessionMaintenanceEntry(sessionKey, entry) {
	if (isSyntheticSessionMaintenanceKey(sessionKey)) return false;
	if (parseSessionThreadInfoFast(sessionKey).threadId) return true;
	if (isTelegramTopicSessionKey(sessionKey)) return true;
	if (isExternalGroupOrChannelSessionKey(sessionKey)) return true;
	const chatType = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry?.chatType ?? entry?.origin?.chatType);
	return chatType === "group" || chatType === "channel" || chatType === "thread";
}
function shouldPreserveMaintenanceEntry(params) {
	return params.entry?.modelSelectionLocked === true || params.preserveKeys?.has(params.key) === true || isProtectedSessionMaintenanceEntry(params.key, params.entry);
}
function getActiveSessionMaintenanceWarning(params) {
	const activeSessionKey = params.activeSessionKey.trim();
	if (!activeSessionKey) return null;
	const activeEntry = params.store[activeSessionKey];
	if (!activeEntry) return null;
	if (shouldPreserveMaintenanceEntry({
		key: activeSessionKey,
		entry: activeEntry
	})) return null;
	const cutoffMs = (params.nowMs ?? Date.now()) - params.pruneAfterMs;
	const wouldPrune = activeEntry.updatedAt != null ? activeEntry.updatedAt < cutoffMs : false;
	const keys = Object.keys(params.store);
	const wouldCap = wouldCapActiveSession({
		store: params.store,
		keys,
		activeEntry,
		activeSessionKey,
		maxEntries: params.maxEntries
	});
	if (!wouldPrune && !wouldCap) return null;
	return {
		activeSessionKey,
		activeUpdatedAt: activeEntry.updatedAt,
		totalEntries: keys.length,
		pruneAfterMs: params.pruneAfterMs,
		maxEntries: params.maxEntries,
		wouldPrune,
		wouldCap
	};
}
function wouldCapActiveSession(params) {
	if (params.keys.length <= params.maxEntries) return false;
	if (params.maxEntries <= 0) return true;
	const protectedCount = params.keys.filter((key) => key !== params.activeSessionKey && shouldPreserveMaintenanceEntry({
		key,
		entry: params.store[key]
	})).length;
	const maxRemovableEntries = Math.max(0, params.maxEntries - protectedCount);
	if (maxRemovableEntries <= 0) return true;
	const activeUpdatedAt = getEntryUpdatedAt$1(params.activeEntry);
	let newerOrTieBeforeActive = 0;
	let seenActive = false;
	for (const key of params.keys) {
		if (key === params.activeSessionKey) {
			seenActive = true;
			continue;
		}
		if (shouldPreserveMaintenanceEntry({
			key,
			entry: params.store[key]
		})) continue;
		const entryUpdatedAt = getEntryUpdatedAt$1(params.store[key]);
		if (entryUpdatedAt > activeUpdatedAt || !seenActive && entryUpdatedAt === activeUpdatedAt) {
			newerOrTieBeforeActive++;
			if (newerOrTieBeforeActive >= maxRemovableEntries) return true;
		}
	}
	return false;
}
/**
* Cap the store to the N most recently updated entries.
* Entries without `updatedAt` are sorted last (removed first when over limit).
* Mutates `store` in-place.
*/
function capEntryCount(store, overrideMax, opts = {}) {
	const maxEntries = overrideMax ?? resolveMaintenanceConfigFromInput().maxEntries;
	const preservedCount = Object.entries(store).filter(([key, entry]) => shouldPreserveMaintenanceEntry({
		key,
		entry,
		preserveKeys: opts.preserveKeys
	})).length;
	const maxRemovableEntries = Math.max(0, maxEntries - preservedCount);
	const keys = Object.keys(store).filter((key) => !shouldPreserveMaintenanceEntry({
		key,
		entry: store[key],
		preserveKeys: opts.preserveKeys
	}));
	if (keys.length <= maxRemovableEntries) return 0;
	const toRemove = keys.toSorted((a, b) => {
		const aTime = getEntryUpdatedAt$1(store[a]);
		return getEntryUpdatedAt$1(store[b]) - aTime;
	}).slice(maxRemovableEntries);
	for (const key of toRemove) {
		const entry = store[key];
		if (entry) opts.onCapped?.({
			key,
			entry
		});
		delete store[key];
	}
	if (opts.log !== false) log$2.info("capped session entry count", {
		removed: toRemove.length,
		maxEntries
	});
	return toRemove.length;
}
//#endregion
//#region src/config/cache-utils.ts
/** Resolves a cache TTL from an env override, falling back unless the override is exact. */
function resolveCacheTtlMs(params) {
	const { envValue, defaultTtlMs } = params;
	if (envValue) {
		const parsed = require_parse_finite_number.parseStrictNonNegativeInteger(envValue);
		if (parsed !== void 0) return parsed;
	}
	return defaultTtlMs;
}
/** Returns whether a TTL keeps cache reads and writes active. */
function isCacheEnabled(ttlMs) {
	return ttlMs > 0;
}
function resolveCacheNumeric(value) {
	return typeof value === "function" ? value() : value;
}
function resolvePruneIntervalMs(ttlMs, pruneIntervalMs) {
	if (typeof pruneIntervalMs === "function") return Math.max(0, Math.floor(pruneIntervalMs(ttlMs)));
	if (typeof pruneIntervalMs === "number") return Math.max(0, Math.floor(pruneIntervalMs));
	return ttlMs;
}
function isCacheEntryExpired(storedAt, now, ttlMs) {
	return now - storedAt > ttlMs;
}
/** Creates a small synchronous map cache with dynamic TTLs and explicit pruning hooks. */
function createExpiringMapCache(options) {
	const cache = /* @__PURE__ */ new Map();
	const now = options.clock ?? Date.now;
	let lastPruneAt = 0;
	function getTtlMs() {
		return Math.max(0, Math.floor(resolveCacheNumeric(options.ttlMs)));
	}
	function maybePruneExpiredEntries(nowMs, ttlMs) {
		if (!isCacheEnabled(ttlMs)) return;
		if (nowMs - lastPruneAt < resolvePruneIntervalMs(ttlMs, options.pruneIntervalMs)) return;
		for (const [key, entry] of cache.entries()) if (isCacheEntryExpired(entry.storedAt, nowMs, ttlMs)) cache.delete(key);
		lastPruneAt = nowMs;
	}
	return {
		get: (key) => {
			const ttlMs = getTtlMs();
			if (!isCacheEnabled(ttlMs)) return;
			const nowMs = now();
			maybePruneExpiredEntries(nowMs, ttlMs);
			const entry = cache.get(key);
			if (!entry) return;
			if (isCacheEntryExpired(entry.storedAt, nowMs, ttlMs)) {
				cache.delete(key);
				return;
			}
			return entry.value;
		},
		set: (key, value) => {
			const ttlMs = getTtlMs();
			if (!isCacheEnabled(ttlMs)) return;
			const nowMs = now();
			maybePruneExpiredEntries(nowMs, ttlMs);
			cache.set(key, {
				storedAt: nowMs,
				value
			});
		},
		delete: (key) => {
			cache.delete(key);
		},
		clear: () => {
			cache.clear();
			lastPruneAt = 0;
		},
		keys: () => [...cache.keys()],
		size: () => cache.size,
		pruneExpired: () => {
			const ttlMs = getTtlMs();
			if (!isCacheEnabled(ttlMs)) return;
			const nowMs = now();
			for (const [key, entry] of cache.entries()) if (isCacheEntryExpired(entry.storedAt, nowMs, ttlMs)) cache.delete(key);
			lastPruneAt = nowMs;
		}
	};
}
/** Captures the file attributes used by cache invalidation without exposing fs.Stats. */
function getFileStatSnapshot(filePath) {
	try {
		const stats = node_fs.default.statSync(filePath);
		return {
			mtimeMs: stats.mtimeMs,
			sizeBytes: stats.size
		};
	} catch {
		return;
	}
}
//#endregion
//#region src/config/sessions/skill-prompt-blobs.ts
const PROMPT_BLOB_DIR = "skills-prompts";
const PROMPT_BLOB_ALGORITHM = "sha256";
const PROMPT_BLOB_VERSION = 1;
const MIN_PROMPT_BLOB_CHARS = 512;
const MAX_PROMPT_BLOB_BYTES = 512 * 1024;
const PROMPT_REF_CACHE_MAX_ENTRIES = 256;
const VALID_PROMPT_BLOB_CACHE_MAX_ENTRIES = 256;
const promptRefCache = /* @__PURE__ */ new Map();
const validPromptBlobCache = /* @__PURE__ */ new Map();
function hashPrompt(prompt) {
	return node_crypto.default.createHash(PROMPT_BLOB_ALGORITHM).update(prompt).digest("hex");
}
function isSha256Hex(value) {
	return /^[a-f0-9]{64}$/u.test(value);
}
function resolveSessionSkillPromptBlobPath(storePath, hash) {
	if (!isSha256Hex(hash)) return null;
	return node_path.default.join(node_path.default.dirname(node_path.default.resolve(storePath)), PROMPT_BLOB_DIR, PROMPT_BLOB_ALGORITHM, hash.slice(0, 2), `${hash}.txt`);
}
function buildPromptRef(prompt) {
	const cached = promptRefCache.get(prompt);
	if (cached) return cached;
	const ref = {
		version: PROMPT_BLOB_VERSION,
		algorithm: PROMPT_BLOB_ALGORITHM,
		hash: hashPrompt(prompt),
		bytes: Buffer.byteLength(prompt, "utf8")
	};
	promptRefCache.set(prompt, ref);
	while (promptRefCache.size > PROMPT_REF_CACHE_MAX_ENTRIES) {
		const oldest = promptRefCache.keys().next().value;
		if (typeof oldest !== "string") break;
		promptRefCache.delete(oldest);
	}
	return ref;
}
function shouldStorePromptAsBlob(prompt) {
	const bytes = Buffer.byteLength(prompt, "utf8");
	return prompt.length >= MIN_PROMPT_BLOB_CHARS && bytes <= MAX_PROMPT_BLOB_BYTES;
}
function rememberValidPromptBlob(blobPath, stat, prompt) {
	validPromptBlobCache.set(blobPath, {
		mtimeMs: stat.mtimeMs,
		size: stat.size,
		prompt
	});
	while (validPromptBlobCache.size > VALID_PROMPT_BLOB_CACHE_MAX_ENTRIES) {
		const oldest = validPromptBlobCache.keys().next().value;
		if (typeof oldest !== "string") break;
		validPromptBlobCache.delete(oldest);
	}
}
function readValidPromptBlob(storePath, ref) {
	if (ref.version !== PROMPT_BLOB_VERSION || ref.algorithm !== PROMPT_BLOB_ALGORITHM || !isSha256Hex(ref.hash) || typeof ref.bytes !== "number" || !Number.isFinite(ref.bytes) || ref.bytes < 0 || ref.bytes > MAX_PROMPT_BLOB_BYTES) return null;
	const blobPath = resolveSessionSkillPromptBlobPath(storePath, ref.hash);
	if (!blobPath) return null;
	try {
		const stat = node_fs.default.statSync(blobPath);
		if (!stat.isFile() || stat.size !== ref.bytes) {
			validPromptBlobCache.delete(blobPath);
			return null;
		}
		const cached = validPromptBlobCache.get(blobPath);
		if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) return cached.prompt;
		const prompt = node_fs.default.readFileSync(blobPath, "utf8");
		if (hashPrompt(prompt) !== ref.hash || Buffer.byteLength(prompt, "utf8") !== ref.bytes) {
			validPromptBlobCache.delete(blobPath);
			return null;
		}
		rememberValidPromptBlob(blobPath, stat, prompt);
		return prompt;
	} catch {
		validPromptBlobCache.delete(blobPath);
		return null;
	}
}
function isSessionSkillPromptBlobReadable(storePath, ref) {
	return readValidPromptBlob(storePath, ref) !== null;
}
async function ensurePromptBlob(storePath, prompt) {
	const ref = buildPromptRef(prompt);
	const blobPath = resolveSessionSkillPromptBlobPath(storePath, ref.hash);
	if (!blobPath) return ref;
	if (readValidPromptBlob(storePath, ref) === prompt) try {
		const now = /* @__PURE__ */ new Date();
		await node_fs.default.promises.utimes(blobPath, now, now);
		rememberValidPromptBlob(blobPath, await node_fs.default.promises.stat(blobPath), prompt);
		return ref;
	} catch {}
	await node_fs.default.promises.mkdir(node_path.default.dirname(blobPath), { recursive: true });
	await require_json_files.writeTextAtomic(blobPath, prompt, {
		durable: false,
		mode: 384,
		tempPrefix: node_path.default.basename(blobPath)
	});
	rememberValidPromptBlob(blobPath, await node_fs.default.promises.stat(blobPath), prompt);
	return ref;
}
function stripPromptForPersistence(entry, ref) {
	const { prompt: _prompt, ...snapshot } = entry.skillsSnapshot;
	return {
		...entry,
		skillsSnapshot: {
			...snapshot,
			promptRef: ref
		}
	};
}
function projectSessionStoreForPersistence(params) {
	let persisted = params.store;
	let changed = false;
	const promptBlobs = /* @__PURE__ */ new Map();
	for (const [key, entry] of Object.entries(params.store)) {
		const prompt = entry.skillsSnapshot?.prompt;
		if (!prompt || !shouldStorePromptAsBlob(prompt)) continue;
		const promptRef = buildPromptRef(prompt);
		promptBlobs.set(promptRef.hash, {
			ref: promptRef,
			path: resolveSessionSkillPromptBlobPath(params.storePath, promptRef.hash),
			prompt
		});
		if (persisted === params.store) persisted = { ...params.store };
		persisted[key] = stripPromptForPersistence(entry, promptRef);
		changed = true;
	}
	return {
		store: persisted,
		changed,
		promptBlobs
	};
}
async function ensureSessionStorePromptBlobsForPersistence(params) {
	for (const blob of params.promptBlobs) await ensurePromptBlob(params.storePath, blob.prompt);
}
function parsePromptRef(value) {
	if (!value || typeof value !== "object") return null;
	const ref = value;
	return ref.version === PROMPT_BLOB_VERSION && ref.algorithm === PROMPT_BLOB_ALGORITHM && typeof ref.hash === "string" && typeof ref.bytes === "number" ? {
		version: ref.version,
		algorithm: ref.algorithm,
		hash: ref.hash,
		bytes: ref.bytes
	} : null;
}
function hydrateSessionStoreSkillPromptRefs(params) {
	let changed = false;
	for (const [key, value] of Object.entries(params.store)) {
		if (!value || typeof value !== "object" || Array.isArray(value)) continue;
		const entry = value;
		const snapshot = entry.skillsSnapshot;
		if (!snapshot || typeof snapshot.prompt === "string") continue;
		const promptRef = parsePromptRef(snapshot.promptRef);
		const prompt = promptRef ? readValidPromptBlob(params.storePath, promptRef) : null;
		if (!prompt) {
			const nextEntry = { ...entry };
			delete nextEntry.skillsSnapshot;
			params.store[key] = nextEntry;
			changed = true;
			continue;
		}
		const { promptRef: _promptRef, ...rest } = snapshot;
		params.store[key] = {
			...entry,
			skillsSnapshot: {
				...rest,
				prompt
			}
		};
		changed = true;
	}
	return changed;
}
//#endregion
//#region src/config/sessions/store-cache.ts
const DEFAULT_SESSION_STORE_TTL_MS = 45e3;
const DEFAULT_SESSION_STORE_SERIALIZED_CACHE_MAX_ENTRIES = 64;
const DEFAULT_SESSION_STORE_SERIALIZED_CACHE_MAX_BYTES = 64 * 1024 * 1024;
const LARGE_SESSION_STORE_STRING_MIN_CHARS = 512;
const LARGE_SESSION_STORE_STRING_MAX_INTERNED = 256;
const SESSION_STORE_CACHE = createExpiringMapCache({ ttlMs: getSessionStoreTtl });
const SESSION_STORE_CACHE_VERSION = /* @__PURE__ */ new Map();
const SESSION_STORE_SERIALIZED_CACHE = /* @__PURE__ */ new Map();
const SESSION_STORE_STRING_INTERN_POOL = /* @__PURE__ */ new Map();
const SESSION_STORE_STRING_INTERN_STATS = {
	stored: 0,
	reused: 0,
	skippedSmall: 0,
	skippedFull: 0
};
let sessionStoreSerializedCacheBytes = 0;
function parseNonNegativeInteger(value) {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	return require_parse_finite_number.parseStrictNonNegativeInteger(trimmed) ?? null;
}
function getSerializedSessionStoreCacheMaxBytes() {
	return parseNonNegativeInteger(process.env.OPERATOR_SESSION_SERIALIZED_CACHE_MAX_BYTES) ?? DEFAULT_SESSION_STORE_SERIALIZED_CACHE_MAX_BYTES;
}
function getSerializedSessionStoreCacheMaxEntries() {
	return DEFAULT_SESSION_STORE_SERIALIZED_CACHE_MAX_ENTRIES;
}
function internLargeSessionStoreString(value) {
	if (value.length < LARGE_SESSION_STORE_STRING_MIN_CHARS) {
		SESSION_STORE_STRING_INTERN_STATS.skippedSmall += 1;
		return value;
	}
	const interned = SESSION_STORE_STRING_INTERN_POOL.get(value);
	if (interned !== void 0) {
		SESSION_STORE_STRING_INTERN_STATS.reused += 1;
		return interned;
	}
	if (SESSION_STORE_STRING_INTERN_POOL.size >= LARGE_SESSION_STORE_STRING_MAX_INTERNED) {
		SESSION_STORE_STRING_INTERN_STATS.skippedFull += 1;
		return value;
	}
	SESSION_STORE_STRING_INTERN_POOL.set(value, value);
	SESSION_STORE_STRING_INTERN_STATS.stored += 1;
	return value;
}
function internSessionEntryLargeStrings(entry) {
	const snapshot = entry.skillsSnapshot;
	if (!snapshot?.prompt) return;
	snapshot.prompt = internLargeSessionStoreString(snapshot.prompt);
}
function internSessionStoreLargeStrings(store) {
	for (const entry of Object.values(store)) internSessionEntryLargeStrings(entry);
}
function deepFreeze(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (!value || typeof value !== "object") return value;
	const object = value;
	if (seen.has(object)) return value;
	seen.add(object);
	for (const child of Object.values(value)) deepFreeze(child, seen);
	return Object.freeze(value);
}
function cloneSessionStoreRecord(store, serialized) {
	const cloned = serialized === void 0 ? cloneJsonLikeValue(store) : JSON.parse(serialized);
	internSessionStoreLargeStrings(cloned);
	return cloned;
}
function cloneJsonLikeValue(value) {
	if (!value || typeof value !== "object") return value;
	if (Array.isArray(value)) {
		const cloned = [];
		cloned.length = value.length;
		for (let index = 0; index < value.length; index += 1) {
			if (!(index in value)) continue;
			cloned[index] = cloneJsonLikeValue(value[index]);
		}
		return cloned;
	}
	const cloned = {};
	for (const key in value) {
		if (!Object.hasOwn(value, key)) continue;
		const child = value[key];
		if (child === void 0) continue;
		const clonedChild = cloneJsonLikeValue(child);
		if (key === "__proto__") Object.defineProperty(cloned, key, {
			value: clonedChild,
			enumerable: true,
			configurable: true,
			writable: true
		});
		else cloned[key] = clonedChild;
	}
	return cloned;
}
function cloneSessionStoreSnapshotEntry(entry) {
	return deepFreeze((0, _gabrielvfonseca_normalization_core.expectDefined)(cloneSessionStoreRecord({ entry }).entry, "cloned session cache entry"));
}
function getSessionStoreTtl() {
	return resolveCacheTtlMs({
		envValue: process.env.OPERATOR_SESSION_CACHE_TTL_MS,
		defaultTtlMs: DEFAULT_SESSION_STORE_TTL_MS
	});
}
function isSessionStoreCacheEnabled() {
	return isCacheEnabled(getSessionStoreTtl());
}
function bumpSessionStoreCacheVersion(storePath) {
	SESSION_STORE_CACHE_VERSION.set(storePath, (SESSION_STORE_CACHE_VERSION.get(storePath) ?? 0) + 1);
}
function getSessionStoreCacheVersion(storePath) {
	return SESSION_STORE_CACHE_VERSION.get(storePath) ?? 0;
}
function invalidateSessionStoreCache(storePath) {
	bumpSessionStoreCacheVersion(storePath);
	SESSION_STORE_CACHE.delete(storePath);
	deleteSerializedSessionStore(storePath);
}
function deleteSerializedSessionStore(storePath) {
	const cached = SESSION_STORE_SERIALIZED_CACHE.get(storePath);
	if (!cached) return;
	SESSION_STORE_SERIALIZED_CACHE.delete(storePath);
	sessionStoreSerializedCacheBytes -= cached.sizeBytes;
}
function pruneSerializedSessionStoreCache() {
	const maxEntries = getSerializedSessionStoreCacheMaxEntries();
	const maxBytes = getSerializedSessionStoreCacheMaxBytes();
	while (SESSION_STORE_SERIALIZED_CACHE.size > 0 && (SESSION_STORE_SERIALIZED_CACHE.size > maxEntries || sessionStoreSerializedCacheBytes > maxBytes)) {
		const oldestKey = SESSION_STORE_SERIALIZED_CACHE.keys().next().value;
		if (typeof oldestKey !== "string") break;
		deleteSerializedSessionStore(oldestKey);
	}
}
function getSerializedSessionStore(storePath) {
	pruneSerializedSessionStoreCache();
	return SESSION_STORE_SERIALIZED_CACHE.get(storePath)?.serialized;
}
function getSerializedSessionStorePromptRefs(storePath) {
	pruneSerializedSessionStoreCache();
	return SESSION_STORE_SERIALIZED_CACHE.get(storePath)?.promptRefs;
}
function setSerializedSessionStorePromptRefs(storePath, promptRefs) {
	pruneSerializedSessionStoreCache();
	const cached = SESSION_STORE_SERIALIZED_CACHE.get(storePath);
	if (!cached) return;
	cached.promptRefs = promptRefs;
}
function setSerializedSessionStore(storePath, serialized, sizeBytesHint, promptRefs) {
	deleteSerializedSessionStore(storePath);
	if (serialized === void 0) return;
	const sizeBytes = typeof sizeBytesHint === "number" && Number.isFinite(sizeBytesHint) && sizeBytesHint >= 0 ? sizeBytesHint : Buffer.byteLength(serialized, "utf8");
	const maxEntries = getSerializedSessionStoreCacheMaxEntries();
	const maxBytes = getSerializedSessionStoreCacheMaxBytes();
	if (maxEntries <= 0 || maxBytes <= 0 || sizeBytes > maxBytes) return;
	SESSION_STORE_SERIALIZED_CACHE.set(storePath, {
		serialized,
		sizeBytes,
		promptRefs
	});
	sessionStoreSerializedCacheBytes += sizeBytes;
	pruneSerializedSessionStoreCache();
}
function dropSessionStoreObjectCache(storePath) {
	bumpSessionStoreCacheVersion(storePath);
	SESSION_STORE_CACHE.delete(storePath);
}
function readSessionStoreCache(params) {
	const cached = SESSION_STORE_CACHE.get(params.storePath);
	if (!cached) return null;
	if (params.mtimeMs !== cached.mtimeMs || params.sizeBytes !== cached.sizeBytes) {
		invalidateSessionStoreCache(params.storePath);
		return null;
	}
	if (params.clone === false) return cached.store;
	return cloneSessionStoreRecord(cached.store, cached.serialized);
}
function takeMutableSessionStoreCache(params) {
	const cached = SESSION_STORE_CACHE.get(params.storePath);
	if (!cached) return null;
	if (params.mtimeMs !== cached.mtimeMs || params.sizeBytes !== cached.sizeBytes) {
		invalidateSessionStoreCache(params.storePath);
		return null;
	}
	SESSION_STORE_CACHE.delete(params.storePath);
	return cached.store;
}
function writeSessionStoreCache(params) {
	bumpSessionStoreCacheVersion(params.storePath);
	const store = params.takeOwnership === true ? params.store : cloneSessionStoreRecord(params.store);
	if (params.takeOwnership === true) internSessionStoreLargeStrings(store);
	SESSION_STORE_CACHE.set(params.storePath, {
		store,
		mtimeMs: params.mtimeMs,
		sizeBytes: params.sizeBytes,
		serialized: params.cloneSerialized
	});
	setSerializedSessionStore(params.storePath, params.serialized, params.sizeBytes, params.serializedPromptRefs);
}
//#endregion
//#region src/config/sessions/store-writer-state.ts
const WRITER_QUEUES = /* @__PURE__ */ new Map();
//#endregion
//#region src/config/sessions/store-writer.ts
async function runExclusiveSessionStoreWrite(storePath, fn, opts = {}) {
	return await runQueuedStoreWrite({
		queues: WRITER_QUEUES,
		storePath,
		label: "runExclusiveSessionStoreWrite",
		fn,
		reentrant: opts.reentrant
	});
}
//#endregion
//#region src/sessions/session-lifecycle-identity.ts
function normalizeSessionIdentities(scope, identities) {
	const normalizedScope = scope.trim();
	if (!normalizedScope) throw new Error("session lifecycle scope is required");
	return Array.from(new Set(Array.from(identities, (identity) => identity?.trim()).filter((identity) => Boolean(identity)))).map((identity) => JSON.stringify([normalizedScope, identity])).toSorted();
}
function decodeSessionIdentity(normalizedIdentity) {
	try {
		const decoded = JSON.parse(normalizedIdentity);
		if (!Array.isArray(decoded) || decoded.length !== 2 || typeof decoded[0] !== "string" || typeof decoded[1] !== "string") return;
		return {
			scope: decoded[0],
			identity: decoded[1]
		};
	} catch {
		return;
	}
}
//#endregion
//#region src/sessions/session-work-admission-handoff.ts
const SESSION_WORK_ADMISSION_HANDOFFS = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.sessionWorkAdmissionHandoffs"), () => /* @__PURE__ */ new Map());
function createSessionWorkAdmissionHandoff(admission, lease) {
	const handoffId = (0, node_crypto.randomUUID)();
	admission.handoffIds.add(handoffId);
	SESSION_WORK_ADMISSION_HANDOFFS.set(handoffId, {
		admission,
		lease
	});
	return handoffId;
}
function clearSessionWorkAdmissionHandoffs(admission) {
	for (const handoffId of admission.handoffIds) SESSION_WORK_ADMISSION_HANDOFFS.delete(handoffId);
	admission.handoffIds.clear();
}
/**
* Atomically adopts a previously admitted work lease across an in-process RPC.
* The opaque token is single-use; requested identities must be covered by the lease.
*/
function consumeSessionWorkAdmissionHandoff(params) {
	const handoffId = params.handoffId.trim();
	if (!handoffId) return;
	const handoff = SESSION_WORK_ADMISSION_HANDOFFS.get(handoffId);
	if (!handoff) return;
	const identities = normalizeSessionIdentities(params.scope, params.identities);
	if (identities.length === 0 || identities.some((identity) => !handoff.admission.identities.has(identity))) return;
	SESSION_WORK_ADMISSION_HANDOFFS.delete(handoffId);
	handoff.admission.handoffIds.delete(handoffId);
	handoff.admission.interrupt = params.onInterrupt;
	if (handoff.admission.interrupted) params.onInterrupt?.();
	return handoff.lease;
}
/** Releases a handoff that was never consumed; the adopter owns consumed leases. */
function cancelSessionWorkAdmissionHandoff(handoffId) {
	const normalizedHandoffId = handoffId.trim();
	const handoff = SESSION_WORK_ADMISSION_HANDOFFS.get(normalizedHandoffId);
	if (!handoff) return false;
	SESSION_WORK_ADMISSION_HANDOFFS.delete(normalizedHandoffId);
	handoff.admission.handoffIds.delete(normalizedHandoffId);
	handoff.lease.release();
	return true;
}
//#endregion
//#region src/sessions/session-lifecycle-admission.ts
const SESSION_WORK_ADMISSION_DRAIN_TIMEOUT_MS = 15e3;
const SESSION_LIFECYCLE_ADMISSION_STATE = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.sessionLifecycleAdmissionState"), () => ({
	lifecycleQueues: /* @__PURE__ */ new Map(),
	mutationQueues: /* @__PURE__ */ new Map(),
	activeAdmissions: /* @__PURE__ */ new Map(),
	activeMutations: /* @__PURE__ */ new Map(),
	activeMutationRuns: /* @__PURE__ */ new Set(),
	activeMutationKinds: /* @__PURE__ */ new Map(),
	idleWaiters: /* @__PURE__ */ new Map(),
	currentAdmissions: new node_async_hooks.AsyncLocalStorage()
}));
const { lifecycleQueues: SESSION_LIFECYCLE_QUEUES, mutationQueues: SESSION_LIFECYCLE_MUTATION_QUEUES, activeAdmissions: ACTIVE_SESSION_WORK_ADMISSIONS, activeMutations: ACTIVE_SESSION_LIFECYCLE_MUTATIONS, activeMutationKinds: ACTIVE_SESSION_LIFECYCLE_MUTATION_KINDS, idleWaiters: SESSION_LIFECYCLE_IDLE_WAITERS, currentAdmissions: CURRENT_SESSION_WORK_ADMISSIONS } = SESSION_LIFECYCLE_ADMISSION_STATE;
const ACTIVE_SESSION_LIFECYCLE_MUTATION_RUNS = SESSION_LIFECYCLE_ADMISSION_STATE.activeMutationRuns ??= /* @__PURE__ */ new Set();
async function runWithSessionIdentityLocks(identities, index, run) {
	const identity = identities[index];
	if (!identity) return await run();
	return await runQueuedStoreWrite({
		queues: SESSION_LIFECYCLE_QUEUES,
		storePath: identity,
		label: "runExclusiveSessionLifecycle",
		reentrant: true,
		fn: async () => await runWithSessionIdentityLocks(identities, index + 1, run)
	});
}
async function runWithSessionMutationIdentityLocks(identities, index, run) {
	const identity = identities[index];
	if (!identity) return await run();
	return await runQueuedStoreWrite({
		queues: SESSION_LIFECYCLE_MUTATION_QUEUES,
		storePath: identity,
		label: "runExclusiveSessionLifecycleMutation",
		reentrant: true,
		fn: async () => await runWithSessionMutationIdentityLocks(identities, index + 1, run)
	});
}
function hasActiveSessionLifecycleMutation(identities) {
	return identities.some((identity) => (ACTIVE_SESSION_LIFECYCLE_MUTATIONS.get(identity) ?? 0) > 0);
}
function hasOnlyActiveSessionLifecycleMutationKind(identities, kind) {
	let foundActiveMutation = false;
	for (const identity of identities) {
		const activeCount = ACTIVE_SESSION_LIFECYCLE_MUTATIONS.get(identity) ?? 0;
		if (activeCount === 0) continue;
		foundActiveMutation = true;
		if ((ACTIVE_SESSION_LIFECYCLE_MUTATION_KINDS.get(identity)?.get(kind) ?? 0) !== activeCount) return false;
	}
	return foundActiveMutation;
}
async function waitForNormalizedSessionLifecycleMutationIdle(identities, signal) {
	const activeIdentities = identities.filter((identity) => (ACTIVE_SESSION_LIFECYCLE_MUTATIONS.get(identity) ?? 0) > 0);
	if (activeIdentities.length === 0) return;
	signal?.throwIfAborted();
	const idle = Promise.all(activeIdentities.map((identity) => new Promise((resolve) => {
		const waiters = SESSION_LIFECYCLE_IDLE_WAITERS.get(identity) ?? /* @__PURE__ */ new Set();
		waiters.add(resolve);
		SESSION_LIFECYCLE_IDLE_WAITERS.set(identity, waiters);
	})));
	if (!signal) {
		await idle;
		return;
	}
	let rejectAborted = () => {};
	const aborted = new Promise((_, reject) => {
		rejectAborted = () => reject(signal.reason instanceof Error ? signal.reason : /* @__PURE__ */ new Error("session work admission aborted"));
		signal.addEventListener("abort", rejectAborted, { once: true });
	});
	try {
		await Promise.race([idle, aborted]);
	} finally {
		signal.removeEventListener("abort", rejectAborted);
	}
}
async function runExclusiveSessionLifecycle(params) {
	const identities = normalizeSessionIdentities(params.scope, params.identities);
	while (true) {
		params.signal?.throwIfAborted();
		if (hasActiveSessionLifecycleMutation(identities)) {
			await waitForNormalizedSessionLifecycleMutationIdle(identities, params.signal);
			continue;
		}
		const attempt = await runWithSessionIdentityLocks(identities, 0, async () => {
			params.signal?.throwIfAborted();
			if (hasActiveSessionLifecycleMutation(identities)) return { blocked: true };
			return {
				blocked: false,
				value: await params.run()
			};
		});
		if (!attempt.blocked) return attempt.value;
		await waitForNormalizedSessionLifecycleMutationIdle(identities, params.signal);
	}
}
async function runExclusiveSessionLifecycleMutation(params) {
	const identities = normalizeSessionIdentities(params.scope, params.identities);
	const signal = params.signal;
	signal?.throwIfAborted();
	const callerAdmissions = new Set(CURRENT_SESSION_WORK_ADMISSIONS.getStore());
	const mutationRun = {};
	let mutationActivated = false;
	let removeAbortListener = () => {};
	const mutation = runWithSessionMutationIdentityLocks(identities, 0, async () => await CURRENT_SESSION_WORK_ADMISSIONS.run(callerAdmissions, async () => {
		await runWithSessionIdentityLocks(identities, 0, async () => {
			signal?.throwIfAborted();
			mutationActivated = true;
			removeAbortListener();
			ACTIVE_SESSION_LIFECYCLE_MUTATION_RUNS.add(mutationRun);
			for (const identity of identities) {
				ACTIVE_SESSION_LIFECYCLE_MUTATIONS.set(identity, (ACTIVE_SESSION_LIFECYCLE_MUTATIONS.get(identity) ?? 0) + 1);
				if (params.kind) {
					const kinds = ACTIVE_SESSION_LIFECYCLE_MUTATION_KINDS.get(identity) ?? /* @__PURE__ */ new Map();
					kinds.set(params.kind, (kinds.get(params.kind) ?? 0) + 1);
					ACTIVE_SESSION_LIFECYCLE_MUTATION_KINDS.set(identity, kinds);
				}
			}
		});
		try {
			await params.prepare?.();
			return await runWithSessionIdentityLocks(identities, 0, params.run);
		} finally {
			await runWithSessionIdentityLocks(identities, 0, async () => {
				for (const identity of identities) {
					if (params.kind) {
						const kinds = ACTIVE_SESSION_LIFECYCLE_MUTATION_KINDS.get(identity);
						const remainingKindCount = (kinds?.get(params.kind) ?? 1) - 1;
						if (remainingKindCount > 0) kinds?.set(params.kind, remainingKindCount);
						else {
							kinds?.delete(params.kind);
							if (kinds?.size === 0) ACTIVE_SESSION_LIFECYCLE_MUTATION_KINDS.delete(identity);
						}
					}
					const remaining = (ACTIVE_SESSION_LIFECYCLE_MUTATIONS.get(identity) ?? 1) - 1;
					if (remaining > 0) {
						ACTIVE_SESSION_LIFECYCLE_MUTATIONS.set(identity, remaining);
						continue;
					}
					ACTIVE_SESSION_LIFECYCLE_MUTATIONS.delete(identity);
					const waiters = SESSION_LIFECYCLE_IDLE_WAITERS.get(identity);
					SESSION_LIFECYCLE_IDLE_WAITERS.delete(identity);
					for (const resolve of waiters ?? []) resolve();
				}
				ACTIVE_SESSION_LIFECYCLE_MUTATION_RUNS.delete(mutationRun);
			});
		}
	}));
	if (!signal) return await mutation;
	if (mutationActivated) return await mutation;
	const aborted = new Promise((_, reject) => {
		const onAbort = () => {
			if (mutationActivated) return;
			try {
				signal.throwIfAborted();
			} catch (error) {
				reject(error instanceof Error ? error : new Error(String(error)));
			}
		};
		removeAbortListener = () => signal.removeEventListener("abort", onAbort);
		signal.addEventListener("abort", onAbort, { once: true });
		if (signal.aborted) onAbort();
	});
	try {
		return await Promise.race([mutation, aborted]);
	} finally {
		removeAbortListener();
	}
}
function isSessionLifecycleMutationActive(scope, identities) {
	return hasActiveSessionLifecycleMutation(normalizeSessionIdentities(scope, identities));
}
function hasOnlySessionLifecycleMutationKindActive(scope, identities, kind) {
	return hasOnlyActiveSessionLifecycleMutationKind(normalizeSessionIdentities(scope, identities), kind);
}
function isSessionWorkAdmissionActive(scope, identities) {
	return normalizeSessionIdentities(scope, identities).some((identity) => (ACTIVE_SESSION_WORK_ADMISSIONS.get(identity)?.size ?? 0) > 0);
}
/** Active session identities for one store/lifecycle scope. */
function collectActiveSessionWorkAdmissionIdentities(scope) {
	const normalizedScope = scope.trim();
	if (!normalizedScope) throw new Error("session lifecycle scope is required");
	const identities = /* @__PURE__ */ new Set();
	for (const [normalizedIdentity, admissions] of ACTIVE_SESSION_WORK_ADMISSIONS) {
		if (admissions.size === 0) continue;
		const decoded = decodeSessionIdentity(normalizedIdentity);
		if (decoded?.scope === normalizedScope) identities.add(decoded.identity);
	}
	return identities;
}
/** Unique admitted turns; one lease can be indexed under several identities. */
function getActiveSessionWorkAdmissionCount() {
	const admissions = /* @__PURE__ */ new Set();
	for (const active of ACTIVE_SESSION_WORK_ADMISSIONS.values()) for (const admission of active) admissions.add(admission);
	return admissions.size;
}
/** Unique active lifecycle mutations; one run can be indexed under several identities. */
function getActiveSessionLifecycleMutationCount() {
	if (ACTIVE_SESSION_LIFECYCLE_MUTATION_RUNS.size > 0) return ACTIVE_SESSION_LIFECYCLE_MUTATION_RUNS.size;
	return ACTIVE_SESSION_LIFECYCLE_MUTATIONS.size > 0 ? 1 : 0;
}
async function beginSessionWorkAdmission(params) {
	if (require_gateway_work_admission.isGatewaySubordinateWorkAdmissionClosed()) throw new require_gateway_work_admission.GatewayDrainingError();
	const identities = normalizeSessionIdentities(params.scope, params.identities);
	return await runExclusiveSessionLifecycle({
		scope: params.scope,
		identities: params.identities,
		signal: params.signal,
		run: async () => {
			await params.assertAllowed();
			if (require_gateway_work_admission.isGatewaySubordinateWorkAdmissionClosed()) throw new require_gateway_work_admission.GatewayDrainingError();
			let resolveReleased = () => {};
			const admission = {
				handoffIds: /* @__PURE__ */ new Set(),
				identities: new Set(identities),
				interrupt: params.onInterrupt,
				interrupted: false,
				released: new Promise((resolve) => {
					resolveReleased = resolve;
				})
			};
			for (const identity of identities) {
				const active = ACTIVE_SESSION_WORK_ADMISSIONS.get(identity) ?? /* @__PURE__ */ new Set();
				active.add(admission);
				ACTIVE_SESSION_WORK_ADMISSIONS.set(identity, active);
			}
			let released = false;
			const release = () => {
				if (released) return;
				released = true;
				for (const identity of identities) {
					const active = ACTIVE_SESSION_WORK_ADMISSIONS.get(identity);
					active?.delete(admission);
					if (!active?.size) ACTIVE_SESSION_WORK_ADMISSIONS.delete(identity);
				}
				clearSessionWorkAdmissionHandoffs(admission);
				resolveReleased();
			};
			const lease = {
				createHandoff: () => {
					if (released) throw new Error("cannot hand off a released session work admission");
					return createSessionWorkAdmissionHandoff(admission, lease);
				},
				release,
				run: async (run) => {
					const current = new Set(CURRENT_SESSION_WORK_ADMISSIONS.getStore());
					current.add(admission);
					return await CURRENT_SESSION_WORK_ADMISSIONS.run(current, run);
				}
			};
			const signal = params.signal;
			let writerBarrierStarted = false;
			let removeAbortListener = () => {};
			try {
				const queuedAbort = signal ? new Promise((_, reject) => {
					const onAbort = () => {
						if (writerBarrierStarted) return;
						reject(signal.reason instanceof Error ? signal.reason : /* @__PURE__ */ new Error("session work admission aborted"));
					};
					removeAbortListener = () => signal.removeEventListener("abort", onAbort);
					signal.addEventListener("abort", onAbort, { once: true });
					if (signal.aborted) onAbort();
				}) : void 0;
				const writerBarrier = runExclusiveSessionStoreWrite(params.scope, async () => {
					writerBarrierStarted = true;
					params.signal?.throwIfAborted();
					await (params.revalidateAllowed ?? params.assertAllowed)();
				}, { reentrant: true });
				await (queuedAbort ? Promise.race([writerBarrier, queuedAbort]) : writerBarrier);
				return lease;
			} catch (error) {
				release();
				throw error;
			} finally {
				removeAbortListener();
			}
		}
	});
}
async function interruptSessionWorkAdmissions(params) {
	const admissions = /* @__PURE__ */ new Set();
	const currentAdmissions = CURRENT_SESSION_WORK_ADMISSIONS.getStore();
	for (const identity of normalizeSessionIdentities(params.scope, params.identities)) for (const admission of ACTIVE_SESSION_WORK_ADMISSIONS.get(identity) ?? []) {
		if (currentAdmissions?.has(admission)) continue;
		admissions.add(admission);
	}
	for (const admission of admissions) {
		admission.interrupted = true;
		admission.interrupt?.();
	}
	const released = Promise.all(Array.from(admissions, (admission) => admission.released));
	if (params.timeoutMs === void 0) {
		await released;
		return true;
	}
	const timeoutMs = params.timeoutMs;
	let timer;
	try {
		return await Promise.race([released.then(() => true), new Promise((resolve) => {
			timer = setTimeout(() => resolve(false), Math.max(0, timeoutMs));
			timer.unref?.();
		})]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.sessionLifecycleAdmissionTestApi")] = { runExclusiveSessionLifecycle };
//#endregion
//#region src/config/sessions/store-maintenance-preserve.ts
const preserveKeysProviders = /* @__PURE__ */ new Set();
/** Registers a provider for session maintenance preserve keys. */
function registerSessionMaintenancePreserveKeysProvider(provider) {
	preserveKeysProviders.add(provider);
	return () => {
		preserveKeysProviders.delete(provider);
	};
}
function addSessionMaintenancePreserveKey(keys, value) {
	const normalized = normalizeStoreSessionKey(value ?? "");
	if (normalized) keys.add(normalized);
}
function addSessionMaintenancePreserveKeys(keys, values) {
	for (const value of values ?? []) addSessionMaintenancePreserveKey(keys, value);
}
/** Collects normalized session keys that maintenance/pruning must preserve. */
function collectSessionMaintenancePreserveKeys(baseKeys) {
	const keys = /* @__PURE__ */ new Set();
	addSessionMaintenancePreserveKeys(keys, baseKeys);
	for (const provider of preserveKeysProviders) try {
		addSessionMaintenancePreserveKeys(keys, provider());
	} catch {}
	return keys.size > 0 ? keys : void 0;
}
/** Resolves store keys owned by active work, including aliases sharing a backing session id. */
function collectActiveSessionWorkAdmissionKeys(params) {
	const activeIdentities = collectActiveSessionWorkAdmissionIdentities(params.storePath);
	if (activeIdentities.size === 0) return;
	const normalizedIdentities = new Set(Array.from(activeIdentities, (identity) => normalizeStoreSessionKey(identity)));
	const keys = /* @__PURE__ */ new Set();
	for (const [key, entry] of Object.entries(params.store)) if (normalizedIdentities.has(normalizeStoreSessionKey(key)) || activeIdentities.has(entry.sessionId)) {
		keys.add(key);
		keys.add(normalizeStoreSessionKey(key));
	}
	return keys.size > 0 ? keys : void 0;
}
/** Collects every runtime and active-work key protected from automatic maintenance. */
function collectSessionMaintenancePreserveKeysForStore(params) {
	const keys = collectSessionMaintenancePreserveKeys(params.baseKeys) ?? /* @__PURE__ */ new Set();
	for (const key of collectActiveSessionWorkAdmissionKeys({
		storePath: params.storePath,
		store: params.store
	}) ?? []) keys.add(key);
	return keys.size > 0 ? keys : void 0;
}
//#endregion
//#region src/config/sessions/store-maintenance-runtime.ts
function resolveMaintenanceConfig() {
	let maintenance;
	try {
		maintenance = require_io.getRuntimeConfig().session?.maintenance;
	} catch {}
	return resolveMaintenanceConfigFromInput(maintenance);
}
//#endregion
//#region src/config/sessions/session-file-rotation.ts
/** Rewrites transcript file paths when a session id changes during reset or fork. */
function rewriteSessionFileForNewSessionId(params) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionFile);
	if (!trimmed) return;
	const base = node_path.default.basename(trimmed);
	if (!base.endsWith(".jsonl")) return;
	const withoutExt = base.slice(0, -6);
	if (withoutExt === params.previousSessionId) return node_path.default.join(node_path.default.dirname(trimmed), `${params.nextSessionId}.jsonl`);
	if (withoutExt.startsWith(`${params.previousSessionId}-topic-`)) return node_path.default.join(node_path.default.dirname(trimmed), `${params.nextSessionId}${base.slice(params.previousSessionId.length)}`);
	const forkMatch = withoutExt.match(/^(\d{4}-\d{2}-\d{2}T[\w-]+(?:Z|[+-]\d{2}(?:-\d{2})?)?)_(.+)$/);
	if (forkMatch?.[2] === params.previousSessionId) return node_path.default.join(node_path.default.dirname(trimmed), `${forkMatch[1]}_${params.nextSessionId}.jsonl`);
}
function canonicalizeAbsoluteSessionFilePath(filePath) {
	const resolved = node_path.default.resolve(filePath);
	const missingSegments = [];
	let cursor = resolved;
	while (true) try {
		return node_path.default.join(node_fs.default.realpathSync(cursor), ...missingSegments.toReversed());
	} catch {
		const parent = node_path.default.dirname(cursor);
		if (parent === cursor) return resolved;
		missingSegments.push(node_path.default.basename(cursor));
		cursor = parent;
	}
}
//#endregion
//#region src/config/sessions/types.ts
function isTerminalSessionStatus(status) {
	return status === "done" || status === "failed" || status === "killed" || status === "timeout";
}
function isSessionPluginTraceLine(line) {
	const trimmed = line.trim();
	return trimmed.startsWith("🔎 ") || /(?:^|\s)(?:Debug|Trace):/.test(trimmed);
}
function resolveSessionPluginLines(entry, includeLine) {
	return Array.isArray(entry?.pluginDebugEntries) ? entry.pluginDebugEntries.flatMap((pluginEntry) => Array.isArray(pluginEntry?.lines) ? pluginEntry.lines.filter((line) => typeof line === "string" && line.trim().length > 0 && includeLine(line)) : []) : [];
}
function resolveSessionPluginStatusLines(entry) {
	return resolveSessionPluginLines(entry, (line) => !isSessionPluginTraceLine(line));
}
function resolveSessionPluginTraceLines(entry) {
	return resolveSessionPluginLines(entry, isSessionPluginTraceLine);
}
function normalizeSessionRuntimeModelFields(entry) {
	const normalizedModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.model);
	const normalizedProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelProvider);
	let next = entry;
	if (!normalizedModel) {
		if (entry.model !== void 0 || entry.modelProvider !== void 0) {
			next = { ...next };
			delete next.model;
			delete next.modelProvider;
		}
		return next;
	}
	if (entry.model !== normalizedModel) {
		if (next === entry) next = { ...next };
		next.model = normalizedModel;
	}
	if (!normalizedProvider) {
		if (entry.modelProvider !== void 0) {
			if (next === entry) next = { ...next };
			delete next.modelProvider;
		}
		return next;
	}
	if (entry.modelProvider !== normalizedProvider) {
		if (next === entry) next = { ...next };
		next.modelProvider = normalizedProvider;
	}
	return next;
}
function setSessionRuntimeModel(entry, runtime) {
	const provider = runtime.provider.trim();
	const model = runtime.model.trim();
	if (!provider || !model) return false;
	entry.modelProvider = provider;
	entry.model = model;
	return true;
}
function resolveMergedUpdatedAt(existing, patch, options) {
	const now = options?.now ?? Date.now();
	const existingUpdatedAt = normalizeMergedUpdatedAt(existing?.updatedAt, now);
	const patchUpdatedAt = normalizeMergedUpdatedAt(patch.updatedAt, now);
	if (options?.policy === "preserve-activity" && existing) return existingUpdatedAt ?? patchUpdatedAt ?? now;
	return Math.max(existingUpdatedAt ?? 0, patchUpdatedAt ?? 0, now);
}
function normalizeMergedUpdatedAt(value, now) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return;
	return Math.min(value, now);
}
function mergeSessionEntryWithPolicy(existing, patch, options) {
	const sessionId = patch.sessionId ?? existing?.sessionId ?? node_crypto.default.randomUUID();
	const updatedAt = resolveMergedUpdatedAt(existing, patch, options);
	if (!existing) return normalizeSessionRuntimeModelFields({
		...patch,
		sessionId,
		updatedAt,
		sessionStartedAt: patch.sessionStartedAt ?? updatedAt
	});
	const next = {
		...existing,
		...patch,
		sessionId,
		updatedAt,
		sessionStartedAt: patch.sessionStartedAt ?? (existing.sessionId === sessionId ? existing.sessionStartedAt : updatedAt)
	};
	if (existing.sessionId !== sessionId) {
		const rewrittenSessionFile = rewriteSessionFileForNewSessionId({
			sessionFile: Object.hasOwn(patch, "sessionFile") ? patch.sessionFile : existing.sessionFile,
			previousSessionId: existing.sessionId,
			nextSessionId: sessionId
		});
		if (rewrittenSessionFile) next.sessionFile = rewrittenSessionFile;
	}
	if (Object.hasOwn(patch, "model") && !Object.hasOwn(patch, "modelProvider")) {
		const patchedModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(patch.model);
		const existingModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(existing.model);
		if (patchedModel && patchedModel !== existingModel) delete next.modelProvider;
	}
	return normalizeSessionRuntimeModelFields(next);
}
function mergeSessionEntry(existing, patch) {
	return mergeSessionEntryWithPolicy(existing, patch);
}
function mergeSessionEntryPreserveActivity(existing, patch) {
	return mergeSessionEntryWithPolicy(existing, patch, { policy: "preserve-activity" });
}
function resolveSessionTotalTokens(entry) {
	const total = entry?.totalTokens;
	if (typeof total !== "number" || !Number.isFinite(total) || total < 0) return;
	return total;
}
function resolveFreshSessionTotalTokens(entry) {
	const total = resolveSessionTotalTokens(entry);
	if (total === void 0) return;
	if (entry?.totalTokensFresh === false) return;
	return total;
}
const DEFAULT_RESET_TRIGGERS = ["/new", "/reset"];
//#endregion
//#region src/sessions/agent-harness-session-key.ts
const AGENT_HARNESS_SESSION_KEY_PREFIX = "harness:";
const AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE = "Session key namespace is reserved for agent harness-owned sessions.";
const AGENT_HARNESS_SESSION_ID_LOCKED_MESSAGE = "Agent harness-owned session identity is locked and cannot be replaced or shared.";
const AGENT_HARNESS_MODEL_RUN_FORBIDDEN_MESSAGE = "Agent harness-owned sessions cannot be used for one-shot model runs.";
const MODEL_SELECTION_LOCK_REMOVAL_MESSAGE = "Model-selection-locked sessions cannot be removed, unlocked, or reassigned.";
function resolveAgentHarnessSessionKeyRest(sessionKey) {
	const trimmed = sessionKey.trim().toLowerCase();
	return require_session_key.parseAgentSessionKey(trimmed)?.rest ?? trimmed;
}
function resolveAgentHarnessSessionKeyOwner(sessionKey) {
	const rest = resolveAgentHarnessSessionKeyRest(sessionKey);
	if (!rest.startsWith(AGENT_HARNESS_SESSION_KEY_PREFIX)) return;
	const ownerSegment = rest.slice(8).split(":", 1)[0];
	return require_openai_routing.normalizeOptionalAgentRuntimeId(ownerSegment);
}
/** Agent harnesses own this namespace; public session APIs must not create rows in it. */
function isAgentHarnessSessionKey(sessionKey) {
	return resolveAgentHarnessSessionKeyRest(sessionKey).startsWith(AGENT_HARNESS_SESSION_KEY_PREFIX);
}
function resolveMissingAgentHarnessSessionError(sessionKey, entry) {
	return entry === void 0 && isAgentHarnessSessionKey(sessionKey) ? AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE : void 0;
}
/** Missing reserved keys fail closed; pre-feature unlocked collisions stay ordinary. */
function resolveAgentHarnessSessionContextError(sessionKey, entry) {
	if (!isAgentHarnessSessionKey(sessionKey)) return;
	return entry ? resolveAgentHarnessSessionStoreEntryError(sessionKey, entry) : AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE;
}
/** Trusted creation must bind the namespace owner to the persisted harness owner. */
function isAgentHarnessSessionKeyOwnedBy(sessionKey, agentHarnessId) {
	const normalizedHarnessId = require_openai_routing.normalizeOptionalAgentRuntimeId(agentHarnessId);
	return Boolean(normalizedHarnessId && normalizedHarnessId === resolveAgentHarnessSessionKeyOwner(sessionKey));
}
function sessionLockOwnerMatches(previous, next) {
	const previousOwner = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(previous.agentHarnessId)?.toLowerCase();
	const nextOwner = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(next.agentHarnessId)?.toLowerCase();
	return previousOwner === nextOwner && require_openai_routing.normalizeOptionalAgentRuntimeId(previousOwner) === require_openai_routing.normalizeOptionalAgentRuntimeId(nextOwner);
}
function hasEquivalentRelocatedLockedEntry(params) {
	if (isAgentHarnessSessionKey(params.previousKey)) return false;
	const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.previousEntry.sessionId);
	if (!sessionId) return false;
	return Object.entries(params.store).some(([sessionKey, entry]) => sessionKey !== params.previousKey && entry.modelSelectionLocked === true && entry.sessionId === sessionId && sessionLockOwnerMatches(params.previousEntry, entry));
}
/** Preserves durable harness ownership across whole-store compatibility projections. */
function resolveAgentHarnessSessionStoreTransitionError(params) {
	for (const [sessionKey, previousEntry] of params.before ?? []) {
		const nextEntry = params.store[sessionKey];
		if (nextEntry?.modelSelectionLocked === true && sessionLockOwnerMatches(previousEntry, nextEntry)) {
			if (nextEntry.sessionId !== previousEntry.sessionId) return AGENT_HARNESS_SESSION_ID_LOCKED_MESSAGE;
			continue;
		}
		const allowedRemoval = params.allowedRemovals?.get(sessionKey);
		if (nextEntry === void 0 && allowedRemoval !== void 0 && JSON.stringify(previousEntry) === JSON.stringify(allowedRemoval)) continue;
		if (nextEntry === void 0 && hasEquivalentRelocatedLockedEntry({
			previousKey: sessionKey,
			previousEntry,
			store: params.store
		})) continue;
		return MODEL_SELECTION_LOCK_REMOVAL_MESSAGE;
	}
}
/** True when a reserved-looking row carries the durable harness lock added with this feature. */
function isAgentHarnessSessionStoreEntryProtected(sessionKey, entry) {
	return isAgentHarnessSessionKey(sessionKey) && entry.modelSelectionLocked === true;
}
/** Validates durable harness locks and prevents transcript identity aliases. */
function resolveAgentHarnessSessionStoreError(store) {
	const lockedSessionIds = /* @__PURE__ */ new Map();
	for (const [sessionKey, entry] of Object.entries(store)) {
		const entryError = resolveAgentHarnessSessionStoreEntryError(sessionKey, entry);
		if (entryError) return entryError;
		if (!isValidAgentHarnessSessionStoreEntry(sessionKey, entry)) continue;
		const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.sessionId);
		if (!sessionId || lockedSessionIds.has(sessionId)) return AGENT_HARNESS_SESSION_ID_LOCKED_MESSAGE;
		lockedSessionIds.set(sessionId, sessionKey);
	}
	for (const [sessionKey, entry] of Object.entries(store)) {
		const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.sessionId);
		const lockedOwner = sessionId ? lockedSessionIds.get(sessionId) : void 0;
		if (lockedOwner && lockedOwner !== sessionKey) return AGENT_HARNESS_SESSION_ID_LOCKED_MESSAGE;
	}
}
/** Rejects caller-selected transcript identities that would rotate a durable harness lock. */
function resolveAgentHarnessSessionIdMismatchError(entry, requestedSessionId) {
	if (entry?.modelSelectionLocked !== true || !require_openai_routing.normalizeOptionalAgentRuntimeId(entry.agentHarnessId)) return;
	const requested = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(requestedSessionId);
	if (!requested) return;
	return requested === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.sessionId) ? void 0 : AGENT_HARNESS_SESSION_ID_LOCKED_MESSAGE;
}
/** Locked rows require durable identity; reserved rows must also match the key owner. */
function resolveAgentHarnessSessionStoreEntryError(sessionKey, entry) {
	if (entry.modelSelectionLocked !== true) return;
	const rawHarnessId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.agentHarnessId)?.toLowerCase();
	const hasCanonicalHarnessOwner = Boolean(rawHarnessId) && rawHarnessId === require_openai_routing.normalizeOptionalAgentRuntimeId(rawHarnessId);
	if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.sessionId) && (isAgentHarnessSessionKey(sessionKey) || entry.agentHarnessId !== void 0)) return AGENT_HARNESS_SESSION_ID_LOCKED_MESSAGE;
	if (isAgentHarnessSessionKey(sessionKey)) return hasCanonicalHarnessOwner && isAgentHarnessSessionKeyOwnedBy(sessionKey, entry.agentHarnessId) ? void 0 : AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE;
	if (entry.agentHarnessId === void 0) return;
	if (!hasCanonicalHarnessOwner) return AGENT_HARNESS_SESSION_ID_LOCKED_MESSAGE;
}
/** True for any valid durable harness lock, including supported ordinary-key rows. */
function isValidAgentHarnessSessionStoreEntry(sessionKey, entry) {
	return entry.modelSelectionLocked === true && (isAgentHarnessSessionKey(sessionKey) || require_openai_routing.normalizeOptionalAgentRuntimeId(entry.agentHarnessId) !== void 0) && resolveAgentHarnessSessionStoreEntryError(sessionKey, entry) === void 0;
}
//#endregion
//#region src/config/sessions/restart-recovery-state.ts
function normalizeRunId(value) {
	return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
/** Resolves only a complete durable channel claim; session-route fallbacks carry no authority. */
function resolveRestartRecoveryChannelAuthority(entry) {
	const sourceTurnId = normalizeRunId(entry.restartRecoveryDeliverySourceRunId);
	const deliveryContext = require_delivery_context_shared.normalizeDeliveryContext(entry.restartRecoveryDeliveryContext);
	const channel = normalizeRunId(deliveryContext?.channel);
	const to = normalizeRunId(deliveryContext?.to);
	if (entry.restartRecoverySourceIngress !== "channel" || !sourceTurnId || !channel || !to || !require_message_channel.isDeliverableMessageChannel(channel)) return;
	return {
		sourceTurnId,
		deliveryContext: {
			...deliveryContext,
			channel,
			to
		}
	};
}
function normalizeThreadId(value) {
	return normalizeRunId(value) ?? (typeof value === "number" && Number.isFinite(value) ? String(value) : void 0);
}
function normalizeStringArray(value) {
	if (!Array.isArray(value)) return;
	const values = Array.from(new Set(value.flatMap((item) => {
		const normalized = normalizeRunId(item);
		return normalized ? [normalized] : [];
	})));
	return values.length > 0 ? values : void 0;
}
function normalizePresentStringArray(value) {
	if (!Array.isArray(value)) return;
	return normalizeStringArray(value) ?? [];
}
function normalizeTerminalDeliveryEvidenceResult(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return;
	const record = value;
	const captured = record.captured === true ? true : void 0;
	const rawPayloads = Array.isArray(record.payloads) ? record.payloads : void 0;
	const payloads = rawPayloads ? rawPayloads.slice(0, 64).map((item) => {
		if (!item || typeof item !== "object" || Array.isArray(item)) return {};
		const payload = item;
		const mediaUrls = normalizeStringArray(payload.mediaUrls);
		const visible = typeof payload.visible === "boolean" ? payload.visible : void 0;
		const evidence = {};
		if (mediaUrls) evidence.mediaUrls = mediaUrls;
		if (visible !== void 0) evidence.visible = visible;
		return evidence;
	}) : void 0;
	const payloadsTruncated = record.payloadsTruncated === true || (rawPayloads?.length ?? 0) > 64 ? true : void 0;
	const rawStatus = record.deliveryStatus && typeof record.deliveryStatus === "object" ? record.deliveryStatus : void 0;
	const status = rawStatus?.status === "failed" || rawStatus?.status === "partial_failed" || rawStatus?.status === "sent" || rawStatus?.status === "suppressed" ? rawStatus.status : void 0;
	const payloadOutcomes = Array.isArray(rawStatus?.payloadOutcomes) ? rawStatus.payloadOutcomes.slice(0, 64).flatMap((item) => {
		if (!item || typeof item !== "object" || Array.isArray(item)) return [];
		const outcome = item;
		const outcomeStatus = outcome.status === "failed" || outcome.status === "sent" || outcome.status === "suppressed" ? outcome.status : void 0;
		if (!outcomeStatus || typeof outcome.index !== "number" || !Number.isInteger(outcome.index) || outcome.index < 0) return [];
		return [{
			index: outcome.index,
			status: outcomeStatus,
			...typeof outcome.sentBeforeError === "boolean" ? { sentBeforeError: outcome.sentBeforeError } : {}
		}];
	}) : void 0;
	const errorMessage = normalizeRunId(rawStatus?.errorMessage);
	const deliveryStatus = status ? {
		status,
		...errorMessage ? { errorMessage } : {},
		...payloadOutcomes?.length ? { payloadOutcomes } : {}
	} : void 0;
	const rawMessagingToolSentTargets = Array.isArray(record.messagingToolSentTargets) ? record.messagingToolSentTargets : void 0;
	const messagingToolSentTargets = rawMessagingToolSentTargets ? rawMessagingToolSentTargets.slice(0, 64).flatMap((item) => {
		if (!item || typeof item !== "object" || Array.isArray(item)) return [];
		const target = item;
		const provider = normalizeRunId(target.provider);
		const accountId = normalizeRunId(target.accountId);
		const to = normalizeRunId(target.to);
		const threadId = normalizeThreadId(target.threadId);
		const mediaUrls = normalizeStringArray(target.mediaUrls);
		const visible = typeof target.visible === "boolean" ? target.visible : void 0;
		if (!provider && !accountId && !to && !threadId && !mediaUrls && visible === void 0) return [];
		return [{
			...provider ? { provider } : {},
			...accountId ? { accountId } : {},
			...to ? { to } : {},
			...threadId ? { threadId } : {},
			...target.threadImplicit === true ? { threadImplicit: true } : {},
			...target.threadSuppressed === true ? { threadSuppressed: true } : {},
			...mediaUrls ? { mediaUrls } : {},
			...visible !== void 0 ? { visible } : {}
		}];
	}) : void 0;
	const messagingToolSentTargetsTruncated = record.messagingToolSentTargetsTruncated === true || (rawMessagingToolSentTargets?.length ?? 0) > 64 ? true : void 0;
	const messagingToolAggregateEvidenceUnaccounted = record.messagingToolAggregateEvidenceUnaccounted === true ? true : void 0;
	const restartUnsafeSideEffectsDetected = record.restartUnsafeSideEffectsDetected === true ? true : void 0;
	if (!captured && !payloads?.length && !payloadsTruncated && !deliveryStatus && !messagingToolSentTargets?.length && !messagingToolSentTargetsTruncated && !messagingToolAggregateEvidenceUnaccounted && !restartUnsafeSideEffectsDetected) return;
	return {
		...captured ? { captured } : {},
		...payloads?.length ? { payloads } : {},
		...payloadsTruncated ? { payloadsTruncated } : {},
		...deliveryStatus ? { deliveryStatus } : {},
		...messagingToolSentTargets?.length ? { messagingToolSentTargets } : {},
		...messagingToolSentTargetsTruncated ? { messagingToolSentTargetsTruncated } : {},
		...messagingToolAggregateEvidenceUnaccounted ? { messagingToolAggregateEvidenceUnaccounted } : {},
		...restartUnsafeSideEffectsDetected ? { restartUnsafeSideEffectsDetected } : {}
	};
}
function normalizeRestartRecoveryTerminalDeliveryEvidence(value) {
	if (!Array.isArray(value)) return;
	const evidence = [];
	for (const item of value) {
		if (!item || typeof item !== "object" || Array.isArray(item)) continue;
		const runId = normalizeRunId(item.runId);
		const result = normalizeTerminalDeliveryEvidenceResult(item);
		if (!runId || !result) continue;
		const previousIndex = evidence.findIndex((entry) => entry.runId === runId);
		if (previousIndex >= 0) evidence.splice(previousIndex, 1);
		evidence.push({
			runId,
			...result
		});
	}
	const bounded = evidence.slice(-64);
	return bounded.length > 0 ? bounded : void 0;
}
/** Keeps a bounded durable set of client runs that must never execute again. */
function normalizeRestartRecoveryTerminalRunIds(value) {
	if (!Array.isArray(value)) return;
	const runIds = [];
	for (const item of value) {
		const runId = normalizeRunId(item);
		if (!runId) continue;
		const previousIndex = runIds.indexOf(runId);
		if (previousIndex >= 0) runIds.splice(previousIndex, 1);
		runIds.push(runId);
	}
	const bounded = runIds.slice(-64);
	return bounded.length > 0 ? bounded : void 0;
}
function sameOptionalStringArray(left, right) {
	if (!Array.isArray(left) || !right) return left === void 0 && right === void 0;
	return left.length === right.length && left.every((value, index) => value === right[index]);
}
/** Compares normalized durable terminal-source tombstones by value and order. */
function sameRestartRecoveryTerminalRunIds(left, right) {
	return sameOptionalStringArray(left, normalizeRestartRecoveryTerminalRunIds(right));
}
/** Normalizes restart-claim fields while preserving an already-canonical array identity. */
function normalizeRestartRecoveryEntryFields(entry, assign) {
	const deliveryMediaUrls = normalizePresentStringArray(entry.restartRecoveryDeliveryMediaUrls);
	assign("restartRecoveryDeliveryMediaUrls", sameOptionalStringArray(entry.restartRecoveryDeliveryMediaUrls, deliveryMediaUrls) ? entry.restartRecoveryDeliveryMediaUrls : deliveryMediaUrls);
	assign("restartRecoveryDisableMessageTool", entry.restartRecoveryDisableMessageTool === true ? true : void 0);
	assign("restartRecoverySuppressTextDelivery", entry.restartRecoverySuppressTextDelivery === true ? true : void 0);
	assign("restartRecoveryBeforeAgentReplyState", entry.restartRecoveryBeforeAgentReplyState === "admitted" || entry.restartRecoveryBeforeAgentReplyState === "pending" || entry.restartRecoveryBeforeAgentReplyState === "continue" || entry.restartRecoveryBeforeAgentReplyState === "handled-silent" || entry.restartRecoveryBeforeAgentReplyState === "handled-reply" || entry.restartRecoveryBeforeAgentReplyState === "handled-unrecoverable" ? entry.restartRecoveryBeforeAgentReplyState : void 0);
	assign("restartRecoveryDeliveryReceiptState", entry.restartRecoveryDeliveryReceiptState === "terminal-pending" || entry.restartRecoveryDeliveryReceiptState === "delivered-terminal" ? entry.restartRecoveryDeliveryReceiptState : void 0);
	assign("restartRecoveryDeliveryToolCallId", normalizeRunId(entry.restartRecoveryDeliveryToolCallId));
	assign("restartRecoveryDeliveryRequestFingerprint", normalizeRunId(entry.restartRecoveryDeliveryRequestFingerprint));
	assign("restartRecoveryDeliveryRunId", normalizeRunId(entry.restartRecoveryDeliveryRunId));
	assign("restartRecoveryDeliverySourceRunId", normalizeRunId(entry.restartRecoveryDeliverySourceRunId));
	assign("restartRecoveryRequesterAccountId", normalizeRunId(entry.restartRecoveryRequesterAccountId));
	assign("restartRecoveryRequesterSenderId", normalizeRunId(entry.restartRecoveryRequesterSenderId));
	assign("restartRecoverySameChannelThreadRequired", entry.restartRecoverySameChannelThreadRequired === true ? true : void 0);
	assign("restartRecoverySourceIngress", entry.restartRecoverySourceIngress === "channel" || entry.restartRecoverySourceIngress === "control-ui" || entry.restartRecoverySourceIngress === "internal" ? entry.restartRecoverySourceIngress : void 0);
	assign("restartRecoverySourceReplyDeliveryMode", entry.restartRecoverySourceReplyDeliveryMode === "automatic" || entry.restartRecoverySourceReplyDeliveryMode === "message_tool_only" ? entry.restartRecoverySourceReplyDeliveryMode : void 0);
	const terminalDeliveryEvidence = normalizeRestartRecoveryTerminalDeliveryEvidence(entry.restartRecoveryTerminalDeliveryEvidence);
	assign("restartRecoveryTerminalDeliveryEvidence", (0, node_util.isDeepStrictEqual)(entry.restartRecoveryTerminalDeliveryEvidence, terminalDeliveryEvidence) ? entry.restartRecoveryTerminalDeliveryEvidence : terminalDeliveryEvidence);
	const terminalRunIds = normalizeRestartRecoveryTerminalRunIds(entry.restartRecoveryTerminalRunIds);
	assign("restartRecoveryTerminalRunIds", sameOptionalStringArray(entry.restartRecoveryTerminalRunIds, terminalRunIds) ? entry.restartRecoveryTerminalRunIds : terminalRunIds);
}
function mergeRestartRecoveryTerminalDeliveryEvidence(current, appended) {
	return normalizeRestartRecoveryTerminalDeliveryEvidence([...normalizeRestartRecoveryTerminalDeliveryEvidence(current) ?? [], ...normalizeRestartRecoveryTerminalDeliveryEvidence(appended) ?? []]);
}
function getRestartRecoveryTerminalDeliveryEvidence(entry, runId) {
	return normalizeRestartRecoveryTerminalDeliveryEvidence(entry?.restartRecoveryTerminalDeliveryEvidence)?.find((evidence) => evidence.runId === runId);
}
/** Appends new terminal ids without refreshing or evicting existing members. */
function mergeRestartRecoveryTerminalRunIds(current, appended) {
	const currentRunIds = normalizeRestartRecoveryTerminalRunIds(current) ?? [];
	const currentSet = new Set(currentRunIds);
	const appendedRunIds = (normalizeRestartRecoveryTerminalRunIds(appended) ?? []).filter((runId) => !currentSet.has(runId));
	return normalizeRestartRecoveryTerminalRunIds([...currentRunIds, ...appendedRunIds]);
}
function hasRestartRecoveryTerminalRun(entry, runId) {
	return normalizeRestartRecoveryTerminalRunIds(entry?.restartRecoveryTerminalRunIds)?.includes(runId) === true;
}
/** Matches durable source ownership regardless of the surrounding run status. */
function hasRestartRecoverySourceClaim(entry, sourceTurnId) {
	const normalizedSourceTurnId = normalizeRunId(sourceTurnId);
	return normalizedSourceTurnId !== void 0 && normalizeRunId(entry?.restartRecoveryDeliveryRunId) !== void 0 && normalizeRunId(entry?.restartRecoveryDeliverySourceRunId) === normalizedSourceTurnId;
}
function hasActiveRestartRecoverySourceClaim(entry, sourceTurnId) {
	return entry?.status === "running" && hasRestartRecoverySourceClaim(entry, sourceTurnId);
}
/** Clears exact active ownership and optionally records its client source as terminal. */
function buildRestartRecoveryClaimCleanupPatch(params) {
	const sourceRunId = normalizeRunId(params.terminalSourceRunId) ?? normalizeRunId(params.entry.restartRecoveryDeliverySourceRunId);
	const terminalRunIds = params.recordTerminalSource && sourceRunId ? mergeRestartRecoveryTerminalRunIds(params.entry.restartRecoveryTerminalRunIds, [sourceRunId]) : void 0;
	const terminalDeliveryEvidence = params.recordTerminalSource && sourceRunId && params.terminalDeliveryEvidence ? mergeRestartRecoveryTerminalDeliveryEvidence(params.entry.restartRecoveryTerminalDeliveryEvidence, [{
		runId: sourceRunId,
		...params.terminalDeliveryEvidence
	}]) : void 0;
	return {
		restartRecoveryBeforeAgentReplyState: void 0,
		restartRecoveryDeliveryReceiptState: void 0,
		restartRecoveryDeliveryToolCallId: void 0,
		restartRecoveryDeliveryContext: void 0,
		restartRecoveryDeliveryMediaUrls: void 0,
		restartRecoveryDisableMessageTool: void 0,
		restartRecoverySuppressTextDelivery: void 0,
		restartRecoveryDeliveryRequestFingerprint: void 0,
		restartRecoveryDeliveryRunId: void 0,
		restartRecoveryDeliverySourceRunId: void 0,
		restartRecoveryRequesterAccountId: void 0,
		restartRecoveryRequesterSenderId: void 0,
		restartRecoverySameChannelThreadRequired: void 0,
		restartRecoverySourceIngress: void 0,
		restartRecoverySourceReplyDeliveryMode: void 0,
		restartRecoveryForceSafeTools: void 0,
		...terminalDeliveryEvidence ? { restartRecoveryTerminalDeliveryEvidence: terminalDeliveryEvidence } : {},
		...terminalRunIds ? { restartRecoveryTerminalRunIds: terminalRunIds } : {}
	};
}
//#endregion
//#region src/plugins/session-entry-slot-keys.ts
const SESSION_ENTRY_RESERVED_SLOT_KEYS = /* @__PURE__ */ new Set([
	"__proto__",
	"constructor",
	"prototype",
	"lastHeartbeatText",
	"lastHeartbeatSentAt",
	"heartbeatIsolatedBaseSessionKey",
	"heartbeatTaskState",
	"pluginExtensions",
	"initializationPending",
	"pluginExtensionSlotKeys",
	"pluginNextTurnInjections",
	"sessionId",
	"lifecycleRevision",
	"updatedAt",
	"archivedAt",
	"pinnedAt",
	"lastReadAt",
	"markedUnreadAt",
	"lastActivityAt",
	"sessionFile",
	"spawnedBy",
	"spawnedWorkspaceDir",
	"spawnedCwd",
	"worktree",
	"parentSessionKey",
	"forkedFromParent",
	"spawnDepth",
	"subagentRole",
	"subagentControlScope",
	"inheritedToolDeny",
	"inheritedToolAllow",
	"subagentRecovery",
	"pluginOwnerId",
	"systemSent",
	"abortedLastRun",
	"restartRecoveryRuns",
	"restartRecoveryForceSafeTools",
	"goal",
	"pendingSkillSuggestion",
	"skillCaptureSignalHashes",
	"sessionStartedAt",
	"ambientTranscriptWatermarks",
	"lastInteractionAt",
	"startedAt",
	"endedAt",
	"runtimeMs",
	"status",
	"abortCutoffMessageSid",
	"abortCutoffTimestamp",
	"chatType",
	"thinkingLevel",
	"cronRunContinuation",
	"fastMode",
	"verboseLevel",
	"traceLevel",
	"reasoningLevel",
	"elevatedLevel",
	"ttsAuto",
	"lastTtsReadLatestHash",
	"lastTtsReadLatestAt",
	"execHost",
	"execSecurity",
	"execAsk",
	"execNode",
	"execCwd",
	"responseUsage",
	"usageFamilyKey",
	"usageFamilySessionIds",
	"providerOverride",
	"modelOverride",
	"agentRuntimeOverride",
	"modelOverrideSource",
	"modelOverrideFallbackOriginProvider",
	"modelOverrideFallbackOriginModel",
	"modelFallback",
	"authProfileOverride",
	"authProfileOverrideSource",
	"authProfileOverrideCompactionCount",
	"liveModelSwitchPending",
	"groupActivation",
	"groupActivationNeedsSystemIntro",
	"sendPolicy",
	"queueMode",
	"queueDebounceMs",
	"queueCap",
	"queueDrop",
	"inputTokens",
	"outputTokens",
	"totalTokens",
	"pendingFinalDelivery",
	"pendingFinalDeliveryCreatedAt",
	"pendingFinalDeliveryLastAttemptAt",
	"pendingFinalDeliveryAttemptCount",
	"pendingFinalDeliveryLastError",
	"pendingFinalDeliveryText",
	"pendingFinalDeliveryContext",
	"pendingFinalDeliveryIntentId",
	"restartRecoveryDeliveryContext",
	"restartRecoveryDeliveryMediaUrls",
	"restartRecoveryDisableMessageTool",
	"restartRecoverySuppressTextDelivery",
	"restartRecoveryDeliveryRequestFingerprint",
	"restartRecoveryDeliveryRunId",
	"restartRecoveryDeliverySourceRunId",
	"restartRecoveryBeforeAgentReplyState",
	"restartRecoveryDeliveryReceiptState",
	"restartRecoveryDeliveryToolCallId",
	"restartRecoveryRequesterAccountId",
	"restartRecoveryRequesterSenderId",
	"restartRecoverySameChannelThreadRequired",
	"restartRecoverySourceIngress",
	"restartRecoverySourceReplyDeliveryMode",
	"restartRecoveryTerminalDeliveryEvidence",
	"restartRecoveryTerminalRunIds",
	"totalTokensFresh",
	"estimatedCostUsd",
	"cacheRead",
	"cacheWrite",
	"modelProvider",
	"model",
	"modelSelectionLocked",
	"agentHarnessId",
	"fallbackNoticeSelectedModel",
	"fallbackNoticeActiveModel",
	"fallbackNoticeReason",
	"contextTokens",
	"contextBudgetStatus",
	"compactionCount",
	"compactionCheckpoints",
	"memoryFlushAt",
	"memoryFlushCompactionCount",
	"memoryFlushContextHash",
	"memoryFlushFailureCount",
	"memoryFlushLastFailedAt",
	"memoryFlushLastFailureError",
	"cliSessionIds",
	"cliSessionBindings",
	"claudeCliSessionId",
	"label",
	"category",
	"displayName",
	"channel",
	"groupId",
	"subject",
	"groupChannel",
	"space",
	"origin",
	"route",
	"deliveryContext",
	"lastChannel",
	"lastTo",
	"lastAccountId",
	"lastThreadId",
	"skillsSnapshot",
	"systemPromptReport",
	"pluginDebugEntries",
	"hookExternalContentSource",
	"acp",
	"quotaSuspension"
]);
const OBJECT_PROTOTYPE_RESERVED_SLOT_KEYS = /* @__PURE__ */ new Set(["prototype", ...Object.getOwnPropertyNames(Object.prototype)]);
const SESSION_ENTRY_SLOT_KEY_RE = /^[A-Za-z][A-Za-z0-9_]*$/u;
function normalizeSessionEntrySlotKey(value) {
	if (typeof value !== "string") return {
		ok: false,
		error: "sessionEntrySlotKey must be a string"
	};
	const key = value.trim();
	if (!key) return {
		ok: false,
		error: "sessionEntrySlotKey cannot be empty"
	};
	if (!SESSION_ENTRY_SLOT_KEY_RE.test(key)) return {
		ok: false,
		error: "sessionEntrySlotKey must be an identifier-style field name"
	};
	if (SESSION_ENTRY_RESERVED_SLOT_KEYS.has(key)) return {
		ok: false,
		error: `sessionEntrySlotKey is reserved by SessionEntry: ${key}`
	};
	if (OBJECT_PROTOTYPE_RESERVED_SLOT_KEYS.has(key)) return {
		ok: false,
		error: `sessionEntrySlotKey is reserved by Object: ${key}`
	};
	return {
		ok: true,
		key
	};
}
//#endregion
//#region src/config/sessions/session-store-path.ts
function resolveSessionStorePathForScope(scope) {
	if (scope.storePath) return scope.storePath;
	const agentId = scope.agentId ?? require_session_key.resolveAgentIdFromSessionKey(scope.sessionKey);
	return require_paths.resolveStorePath(require_io.getRuntimeConfig().session?.store, {
		agentId,
		env: scope.env
	});
}
//#endregion
//#region src/config/sessions/store-entry-shape.ts
function isSafeSessionId(value) {
	if (typeof value !== "string") return false;
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > 255) return false;
	if (trimmed.includes("/") || trimmed.includes("\\") || trimmed === "." || trimmed === "..") return false;
	return /^[A-Za-z0-9][A-Za-z0-9._:@-]*$/.test(trimmed);
}
function normalizeTranscriptSessionId(value) {
	try {
		return require_paths.validateSessionId(value);
	} catch {
		return;
	}
}
function normalizeOptionalTimestamp(value) {
	if (value === void 0) return;
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}
/** Normalizes persisted session store entries before they reach runtime callers. */
function normalizePersistedSessionEntryShape(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const modelSelectionLocked = value.modelSelectionLocked === true;
	let next = value;
	const sessionFile = typeof value.sessionFile === "string" ? value.sessionFile.trim() : void 0;
	if (value.sessionId !== void 0) {
		if (!isSafeSessionId(value.sessionId)) return;
		const sessionId = value.sessionId.trim();
		if (modelSelectionLocked && sessionId !== value.sessionId) return;
		if (!normalizeTranscriptSessionId(sessionId) && !sessionFile) {
			if (modelSelectionLocked) return;
			const { sessionId: _dropSessionId, ...rest } = next;
			next = rest;
		} else if (sessionId !== value.sessionId) next = {
			...next,
			sessionId
		};
	}
	if (value.sessionFile !== void 0 && typeof value.sessionFile !== "string") {
		if (next === value) next = { ...next };
		delete next.sessionFile;
	}
	const updatedAt = normalizeOptionalTimestamp(value.updatedAt);
	if (updatedAt !== value.updatedAt) {
		if (next === value) next = { ...next };
		next.updatedAt = updatedAt ?? 0;
	}
	return next;
}
//#endregion
//#region src/config/sessions/store-migrations.ts
/** Applies best-effort in-place migrations for legacy session store entry fields. */
function applySessionStoreMigrations(store) {
	let changed = false;
	for (const entry of Object.values(store)) {
		if (!entry || typeof entry !== "object") continue;
		const rec = entry;
		if (typeof rec.channel !== "string" && typeof rec.provider === "string") {
			rec.channel = rec.provider;
			delete rec.provider;
			changed = true;
		}
		if (typeof rec.lastChannel !== "string" && typeof rec.lastProvider === "string") {
			rec.lastChannel = rec.lastProvider;
			delete rec.lastProvider;
			changed = true;
		}
		if (typeof rec.groupChannel !== "string" && typeof rec.room === "string") {
			rec.groupChannel = rec.room;
			delete rec.room;
			changed = true;
		} else if ("room" in rec) {
			delete rec.room;
			changed = true;
		}
	}
	return changed;
}
//#endregion
//#region src/config/sessions/store-load.ts
const log$1 = require_subsystem.createSubsystemLogger("sessions/store");
function isSessionStoreRecord(value) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value);
}
function normalizeOptionalFiniteNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : void 0;
}
function normalizeOptionalAttemptCount(value) {
	return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : void 0;
}
function normalizeOptionalStringOrNull(value) {
	if (value === null || typeof value === "string") return value;
}
function normalizeRecordKey(value) {
	const key = value.trim();
	return key.length > 0 ? key : void 0;
}
function normalizeOptionalDeliveryContext(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const normalized = require_delivery_context_shared.normalizeDeliveryContext({
		channel: typeof value.channel === "string" ? value.channel : void 0,
		to: typeof value.to === "string" ? value.to : void 0,
		accountId: typeof value.accountId === "string" ? value.accountId : void 0,
		threadId: typeof value.threadId === "string" || typeof value.threadId === "number" ? value.threadId : void 0
	});
	return normalized?.channel && normalized.to ? normalized : void 0;
}
function sameDeliveryContext(left, right) {
	return (left?.channel ?? void 0) === (right?.channel ?? void 0) && (left?.to ?? void 0) === (right?.to ?? void 0) && (left?.accountId ?? void 0) === (right?.accountId ?? void 0) && (left?.threadId ?? void 0) === (right?.threadId ?? void 0);
}
function normalizePendingFinalDeliveryFields(entry) {
	let next = entry;
	const assign = (key, value) => {
		if (entry[key] === value) return;
		if (next === entry) next = { ...entry };
		if (value === void 0) delete next[key];
		else next[key] = value;
	};
	assign("pendingFinalDelivery", entry.pendingFinalDelivery === true ? true : void 0);
	assign("pendingFinalDeliveryText", normalizeOptionalStringOrNull(entry.pendingFinalDeliveryText));
	assign("pendingFinalDeliveryCreatedAt", normalizeOptionalFiniteNumber(entry.pendingFinalDeliveryCreatedAt));
	assign("pendingFinalDeliveryLastAttemptAt", normalizeOptionalFiniteNumber(entry.pendingFinalDeliveryLastAttemptAt));
	assign("pendingFinalDeliveryAttemptCount", normalizeOptionalAttemptCount(entry.pendingFinalDeliveryAttemptCount));
	assign("pendingFinalDeliveryLastError", normalizeOptionalStringOrNull(entry.pendingFinalDeliveryLastError));
	const pendingFinalDeliveryContext = normalizeOptionalDeliveryContext(entry.pendingFinalDeliveryContext);
	if (!sameDeliveryContext(entry.pendingFinalDeliveryContext, pendingFinalDeliveryContext)) assign("pendingFinalDeliveryContext", pendingFinalDeliveryContext);
	assign("pendingFinalDeliveryIntentId", normalizeOptionalStringOrNull(entry.pendingFinalDeliveryIntentId));
	const restartRecoveryDeliveryContext = normalizeOptionalDeliveryContext(entry.restartRecoveryDeliveryContext);
	if (!sameDeliveryContext(entry.restartRecoveryDeliveryContext, restartRecoveryDeliveryContext)) assign("restartRecoveryDeliveryContext", restartRecoveryDeliveryContext);
	normalizeRestartRecoveryEntryFields(entry, assign);
	return next;
}
function normalizePluginExtensions(entry) {
	if (entry.pluginExtensions === void 0) return entry;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.pluginExtensions)) {
		const next = { ...entry };
		delete next.pluginExtensions;
		return next;
	}
	let changed = false;
	const normalizedExtensions = {};
	for (const [rawPluginId, rawPluginState] of Object.entries(entry.pluginExtensions)) {
		const pluginId = normalizeRecordKey(rawPluginId);
		if (!pluginId || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawPluginState)) {
			changed = true;
			continue;
		}
		if (pluginId !== rawPluginId) changed = true;
		const normalizedPluginState = {};
		for (const [rawNamespace, rawValue] of Object.entries(rawPluginState)) {
			const namespace = normalizeRecordKey(rawNamespace);
			if (!namespace || !require_host_hook_json.isPluginJsonValue(rawValue)) {
				changed = true;
				continue;
			}
			if (namespace !== rawNamespace) changed = true;
			normalizedPluginState[namespace] = rawValue;
		}
		if (Object.keys(normalizedPluginState).length === 0) {
			changed = true;
			continue;
		}
		normalizedExtensions[pluginId] = normalizedPluginState;
	}
	if (!changed) return entry;
	const next = { ...entry };
	if (Object.keys(normalizedExtensions).length > 0) next.pluginExtensions = normalizedExtensions;
	else delete next.pluginExtensions;
	return next;
}
function normalizePluginExtensionSlotKeys(entry) {
	if (entry.pluginExtensionSlotKeys === void 0) return entry;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.pluginExtensionSlotKeys)) {
		const next = { ...entry };
		delete next.pluginExtensionSlotKeys;
		return next;
	}
	let changed = false;
	const normalizedSlotKeys = {};
	for (const [rawPluginId, rawPluginSlots] of Object.entries(entry.pluginExtensionSlotKeys)) {
		const pluginId = normalizeRecordKey(rawPluginId);
		if (!pluginId || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawPluginSlots)) {
			changed = true;
			continue;
		}
		if (pluginId !== rawPluginId) changed = true;
		const normalizedPluginSlots = {};
		for (const [rawNamespace, rawSlotKey] of Object.entries(rawPluginSlots)) {
			const namespace = normalizeRecordKey(rawNamespace);
			const slotKey = normalizeSessionEntrySlotKey(rawSlotKey);
			if (!namespace || !slotKey.ok) {
				changed = true;
				continue;
			}
			if (namespace !== rawNamespace || slotKey.key !== rawSlotKey) changed = true;
			normalizedPluginSlots[namespace] = slotKey.key;
		}
		if (Object.keys(normalizedPluginSlots).length === 0) {
			changed = true;
			continue;
		}
		normalizedSlotKeys[pluginId] = normalizedPluginSlots;
	}
	if (!changed) return entry;
	const next = { ...entry };
	if (Object.keys(normalizedSlotKeys).length > 0) next.pluginExtensionSlotKeys = normalizedSlotKeys;
	else delete next.pluginExtensionSlotKeys;
	return next;
}
function sameDeliveryChannelRoute(left, right) {
	return (left?.channel ?? void 0) === (right?.channel ?? void 0) && (left?.accountId ?? void 0) === (right?.accountId ?? void 0) && (left?.target?.to ?? void 0) === (right?.target?.to ?? void 0) && (left?.target?.rawTo ?? void 0) === (right?.target?.rawTo ?? void 0) && (left?.target?.chatType ?? void 0) === (right?.target?.chatType ?? void 0) && (left?.thread?.id ?? void 0) === (right?.thread?.id ?? void 0) && (left?.thread?.kind ?? void 0) === (right?.thread?.kind ?? void 0) && (left?.thread?.source ?? void 0) === (right?.thread?.source ?? void 0);
}
/**
* Rebuilds malformed/legacy delivery `route` state from the entry's delivery
* fields. Runs on file-era store loads and on the doctor SQLite import so the
* SQLite store only holds canonical delivery shapes; SQLite reads do no repair.
*/
function normalizeSessionEntryDelivery(entry) {
	const entryRoute = require_delivery_context_shared.normalizeDeliveryChannelRoute(entry.route);
	const normalized = require_delivery_context_shared.normalizeSessionDeliveryFields({
		route: entryRoute,
		channel: entry.channel,
		lastChannel: entry.lastChannel,
		lastTo: entry.lastTo,
		lastAccountId: entry.lastAccountId,
		lastThreadId: entry.lastThreadId ?? entry.deliveryContext?.threadId ?? entry.origin?.threadId,
		deliveryContext: entry.deliveryContext
	});
	const nextDelivery = normalized.deliveryContext;
	const sameDelivery = (entry.deliveryContext?.channel ?? void 0) === nextDelivery?.channel && (entry.deliveryContext?.to ?? void 0) === nextDelivery?.to && (entry.deliveryContext?.accountId ?? void 0) === nextDelivery?.accountId && (entry.deliveryContext?.threadId ?? void 0) === nextDelivery?.threadId;
	const sameLast = sameDeliveryChannelRoute(entryRoute, normalized.route) && entry.lastChannel === normalized.lastChannel && entry.lastTo === normalized.lastTo && entry.lastAccountId === normalized.lastAccountId && entry.lastThreadId === normalized.lastThreadId;
	if (sameDelivery && sameLast) return entry;
	return {
		...entry,
		route: normalized.route,
		deliveryContext: nextDelivery,
		lastChannel: normalized.lastChannel,
		lastTo: normalized.lastTo,
		lastAccountId: normalized.lastAccountId,
		lastThreadId: normalized.lastThreadId
	};
}
function stripPersistedSkillsCache(entry) {
	const snapshot = entry.skillsSnapshot;
	if (!snapshot || snapshot.resolvedSkills === void 0) return entry;
	const { resolvedSkills: _drop, ...rest } = snapshot;
	return {
		...entry,
		skillsSnapshot: rest
	};
}
function normalizeSessionStore(store) {
	let changed = false;
	for (const [key, entry] of Object.entries(store)) {
		const modelSelectionLocked = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) && entry.modelSelectionLocked === true;
		const shaped = normalizePersistedSessionEntryShape(entry);
		if (!shaped) {
			if (modelSelectionLocked) throw new Error(`Invalid model-selection-locked session entry: ${key}`);
			delete store[key];
			changed = true;
			continue;
		}
		const normalizedRuntimeFields = normalizeSessionRuntimeModelFields(shaped);
		if (modelSelectionLocked && normalizedRuntimeFields !== shaped) throw new Error(`Invalid model-selection-locked session entry: ${key}`);
		const normalized = stripPersistedSkillsCache(normalizePluginExtensionSlotKeys(normalizePluginExtensions(normalizePendingFinalDeliveryFields(normalizeSessionEntryDelivery(modelSelectionLocked ? shaped : normalizedRuntimeFields)))));
		internSessionEntryLargeStrings(normalized);
		if (normalized !== entry) {
			store[key] = normalized;
			changed = true;
		}
	}
	const harnessStoreError = resolveAgentHarnessSessionStoreError(store);
	if (harnessStoreError) throw new Error(harnessStoreError);
	return changed;
}
function loadSessionStore(storePath, opts = {}) {
	const shouldHydrateSkillPromptRefs = opts.hydrateSkillPromptRefs !== false;
	const canWriteSessionStoreCache = shouldHydrateSkillPromptRefs;
	if (!opts.skipCache && isSessionStoreCacheEnabled()) {
		const currentFileStat = getFileStatSnapshot(storePath);
		const cached = readSessionStoreCache({
			storePath,
			mtimeMs: currentFileStat?.mtimeMs,
			sizeBytes: currentFileStat?.sizeBytes,
			clone: opts.clone
		});
		if (cached) return cached;
	}
	let store = {};
	const fileStat = getFileStatSnapshot(storePath);
	const mtimeMs = fileStat?.mtimeMs;
	let serializedFromDisk;
	const maxReadAttempts = 3;
	const retryBuf = new Int32Array(new SharedArrayBuffer(4));
	for (let attempt = 0; attempt < maxReadAttempts; attempt += 1) try {
		const raw = node_fs.default.readFileSync(storePath, "utf-8");
		if (raw.length === 0 && attempt < maxReadAttempts - 1) {
			Atomics.wait(retryBuf, 0, 0, 50);
			continue;
		}
		const parsed = JSON.parse(raw);
		if (isSessionStoreRecord(parsed)) {
			store = parsed;
			serializedFromDisk = raw;
		}
		break;
	} catch (err) {
		const code = err.code;
		if (code === "ENOENT" || code === "EACCES" || code === "EPERM") break;
		if (attempt < maxReadAttempts - 1) Atomics.wait(retryBuf, 0, 0, 50);
	}
	const hydratedPromptRefs = shouldHydrateSkillPromptRefs ? hydrateSessionStoreSkillPromptRefs({
		storePath,
		store
	}) : false;
	const migrated = applySessionStoreMigrations(store);
	const normalized = normalizeSessionStore(store);
	if (hydratedPromptRefs || migrated || normalized) serializedFromDisk = void 0;
	if (opts.runMaintenance) {
		const maintenance = opts.maintenanceConfig ?? resolveMaintenanceConfig();
		const beforeCount = Object.keys(store).length;
		let modelRunPruned = 0;
		let pruned = 0;
		let capped = 0;
		if (maintenance.mode === "enforce") {
			const preserveSessionKeys = collectSessionMaintenancePreserveKeysForStore({
				storePath,
				store
			});
			if (shouldRunModelRunPrune({
				maintenance,
				entryCount: beforeCount
			})) modelRunPruned = pruneStaleModelRunEntries(store, maintenance.modelRunPruneAfterMs, {
				log: false,
				preserveKeys: preserveSessionKeys
			});
		}
		if (maintenance.mode === "enforce" && Object.keys(store).length > maintenance.maxEntries) {
			const preserveSessionKeys = collectSessionMaintenancePreserveKeysForStore({
				storePath,
				store
			});
			pruned = pruneStaleEntries(store, maintenance.pruneAfterMs, {
				log: false,
				preserveKeys: preserveSessionKeys
			});
			const countAfterPrune = Object.keys(store).length;
			capped = shouldRunSessionEntryMaintenance({
				entryCount: countAfterPrune,
				maxEntries: maintenance.maxEntries
			}) ? capEntryCount(store, maintenance.maxEntries, {
				log: false,
				preserveKeys: preserveSessionKeys
			}) : 0;
		}
		const afterCount = Object.keys(store).length;
		if (modelRunPruned > 0 || pruned > 0 || capped > 0) {
			serializedFromDisk = void 0;
			log$1.info("applied load-time maintenance to session store", {
				storePath,
				before: beforeCount,
				after: afterCount,
				modelRunPruned,
				pruned,
				capped,
				maxEntries: maintenance.maxEntries
			});
		}
	}
	setSerializedSessionStore(storePath, serializedFromDisk);
	if (!opts.skipCache && canWriteSessionStoreCache && isSessionStoreCacheEnabled()) writeSessionStoreCache({
		storePath,
		store,
		mtimeMs,
		sizeBytes: fileStat?.sizeBytes,
		serialized: serializedFromDisk,
		cloneSerialized: serializedFromDisk,
		takeOwnership: serializedFromDisk !== void 0
	});
	return opts.clone === false ? store : cloneSessionStoreRecord(store, serializedFromDisk);
}
function readSessionEntry(storePath, sessionKey, opts = {}) {
	const resolved = resolveSessionStoreEntry({
		store: loadSessionStore(storePath, {
			clone: false,
			...opts.hydrateSkillPromptRefs === false ? { hydrateSkillPromptRefs: false } : {}
		}),
		sessionKey
	});
	return resolved.existing ? cloneSessionStoreSnapshotEntry(resolved.existing) : void 0;
}
//#endregion
//#region src/config/sessions/disk-budget.ts
const NOOP_LOGGER = {
	warn: () => {},
	info: () => {}
};
function canonicalizePathForComparison(filePath) {
	const resolved = node_path.default.resolve(filePath);
	try {
		return node_fs.default.realpathSync(resolved);
	} catch {
		return resolved;
	}
}
function measureStoreBytes(store) {
	return Buffer.byteLength(JSON.stringify(store, null, 2), "utf-8");
}
function measureStoreEntryChunkBytes(key, entry) {
	const singleEntryStore = JSON.stringify({ [key]: entry }, null, 2);
	if (!singleEntryStore.startsWith("{\n") || !singleEntryStore.endsWith("\n}")) return measureStoreBytes({ [key]: entry }) - 4;
	const chunk = singleEntryStore.slice(2, -2);
	return Buffer.byteLength(chunk, "utf-8");
}
function buildStoreEntryChunkSizeMap(store) {
	const out = /* @__PURE__ */ new Map();
	for (const [key, entry] of Object.entries(store)) out.set(key, measureStoreEntryChunkBytes(key, entry));
	return out;
}
function resolveProjectedPromptBlobHash(entry) {
	const ref = entry?.skillsSnapshot?.promptRef;
	return ref?.algorithm === "sha256" && typeof ref.hash === "string" ? ref.hash : void 0;
}
function buildProjectedPromptBlobRefCounts(store) {
	const counts = /* @__PURE__ */ new Map();
	for (const entry of Object.values(store)) {
		const hash = resolveProjectedPromptBlobHash(entry);
		if (!hash) continue;
		counts.set(hash, (counts.get(hash) ?? 0) + 1);
	}
	return counts;
}
function getEntryUpdatedAt(entry) {
	if (!entry) return 0;
	const updatedAt = entry.updatedAt;
	return Number.isFinite(updatedAt) ? updatedAt : 0;
}
function buildSessionIdRefCounts(store) {
	const counts = /* @__PURE__ */ new Map();
	for (const entry of Object.values(store)) {
		const sessionId = entry?.sessionId;
		if (!sessionId) continue;
		counts.set(sessionId, (counts.get(sessionId) ?? 0) + 1);
	}
	return counts;
}
function resolveSessionTranscriptPathForEntry(params) {
	if (!params.entry.sessionId) return null;
	try {
		const resolved = require_paths.resolveSessionFilePath(params.entry.sessionId, params.entry, { sessionsDir: params.sessionsDir });
		const resolvedSessionsDir = canonicalizePathForComparison(params.sessionsDir);
		const resolvedPath = canonicalizePathForComparison(resolved);
		const relative = node_path.default.relative(resolvedSessionsDir, resolvedPath);
		if (!relative || relative.startsWith("..") || node_path.default.isAbsolute(relative)) return null;
		return resolvedPath;
	} catch {
		return null;
	}
}
function resolveSessionArtifactPathsForEntry(params) {
	const transcriptPath = resolveSessionTranscriptPathForEntry(params);
	if (!transcriptPath) return [];
	const paths = [transcriptPath];
	if (params.entry.sessionId) {
		paths.push(require_paths$1.resolveTrajectoryPointerFilePath(transcriptPath));
		paths.push(require_paths$1.resolveTrajectoryFilePath({
			env: {},
			sessionFile: transcriptPath,
			sessionId: params.entry.sessionId
		}));
	}
	return paths;
}
function resolveSessionArtifactCanonicalPathsForEntry(params) {
	return resolveSessionArtifactPathsForEntry(params).map(canonicalizePathForComparison);
}
function resolveReferencedSessionArtifactPaths(params) {
	const referenced = /* @__PURE__ */ new Set();
	const resolvedSessionsDir = canonicalizePathForComparison(params.sessionsDir);
	for (const entry of Object.values(params.store)) {
		for (const resolved of resolveSessionArtifactCanonicalPathsForEntry({
			sessionsDir: params.sessionsDir,
			entry
		})) referenced.add(resolved);
		for (const checkpoint of entry.compactionCheckpoints ?? []) {
			const checkpointFiles = [checkpoint.preCompaction.sessionFile?.trim(), checkpoint.postCompaction.sessionFile?.trim()].filter((filePath) => Boolean(filePath));
			for (const checkpointFile of checkpointFiles) {
				const resolvedCheckpointPath = canonicalizePathForComparison(checkpointFile);
				const relative = node_path.default.relative(resolvedSessionsDir, resolvedCheckpointPath);
				if (relative && !relative.startsWith("..") && !node_path.default.isAbsolute(relative)) referenced.add(resolvedCheckpointPath);
			}
		}
	}
	return referenced;
}
const SESSIONS_DIR_STAT_CONCURRENCY = 8;
async function readSessionsDirFiles(sessionsDir) {
	const { results } = await require_resolve.runTasksWithConcurrency({
		tasks: (await node_fs.default.promises.readdir(sessionsDir, { withFileTypes: true }).catch(() => [])).filter((dirent) => dirent.isFile() && !require_paths.isMigrationArchiveArtifactName(dirent.name)).map((dirent) => async () => {
			const filePath = node_path.default.join(sessionsDir, dirent.name);
			const stat = await node_fs.default.promises.stat(filePath).catch(() => null);
			if (!stat?.isFile()) return null;
			return {
				path: filePath,
				canonicalPath: canonicalizePathForComparison(filePath),
				name: dirent.name,
				size: stat.size,
				mtimeMs: stat.mtimeMs
			};
		}),
		limit: SESSIONS_DIR_STAT_CONCURRENCY
	});
	return results.filter((file) => Boolean(file));
}
async function readSessionPromptBlobFiles(sessionsDir) {
	const root = node_path.default.join(sessionsDir, "skills-prompts", "sha256");
	const prefixEntries = await node_fs.default.promises.readdir(root, { withFileTypes: true }).catch(() => []);
	const files = [];
	for (const prefixEntry of prefixEntries) {
		if (!prefixEntry.isDirectory() || !/^[a-f0-9]{2}$/u.test(prefixEntry.name)) continue;
		const prefixDir = node_path.default.join(root, prefixEntry.name);
		const blobEntries = await node_fs.default.promises.readdir(prefixDir, { withFileTypes: true }).catch(() => []);
		for (const blobEntry of blobEntries) {
			if (!blobEntry.isFile() || !/^[a-f0-9]{64}\.txt$/u.test(blobEntry.name) && !isSessionPromptBlobTempArtifactName(blobEntry.name)) continue;
			const filePath = node_path.default.join(prefixDir, blobEntry.name);
			const stat = await node_fs.default.promises.stat(filePath).catch(() => null);
			if (!stat?.isFile()) continue;
			files.push({
				path: filePath,
				canonicalPath: canonicalizePathForComparison(filePath),
				name: blobEntry.name,
				size: stat.size,
				mtimeMs: stat.mtimeMs
			});
		}
	}
	return files;
}
function resolvePromptBlobFileHash(file) {
	return /^[a-f0-9]{64}\.txt$/u.test(file.name) ? file.name.slice(0, -4) : void 0;
}
function isSessionPromptBlobTempArtifactName(name) {
	return /^[a-f0-9]{64}\.txt\.(?:\d+\.)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.tmp$/u.test(name);
}
function isUnreferencedSessionArtifactFile(file, referencedPaths) {
	if (referencedPaths.has(file.canonicalPath)) return false;
	return require_paths.isCompactionCheckpointTranscriptFileName(file.name) || require_paths.isTrajectorySessionArtifactName(file.name) || require_paths.isPrimarySessionTranscriptFileName(file.name);
}
const SESSION_PROMPT_BLOB_UNREFERENCED_GRACE_MS = require_paths.SESSION_STORE_TEMP_STALE_MS;
function isUnreferencedPromptBlobFileRemovable(file, projectedPromptBlobRefCounts, cutoffMs) {
	if (file.mtimeMs > cutoffMs) return false;
	const hash = resolvePromptBlobFileHash(file);
	return hash ? !projectedPromptBlobRefCounts.has(hash) : false;
}
function isPromptBlobArtifactRemovable(file, projectedPromptBlobRefCounts, promptBlobCutoffMs, tempCutoffMs) {
	if (isSessionPromptBlobTempArtifactName(file.name)) return file.mtimeMs <= tempCutoffMs;
	return isUnreferencedPromptBlobFileRemovable(file, projectedPromptBlobRefCounts, promptBlobCutoffMs);
}
function isDiskBudgetRemovableSessionFile(file, referencedPaths, tempStaleCutoffMs, storeBasename) {
	if (require_paths.isSessionStoreTempArtifactName(file.name, storeBasename)) return file.mtimeMs <= tempStaleCutoffMs;
	return require_paths.isSessionArchiveArtifactName(file.name) || isUnreferencedSessionArtifactFile(file, referencedPaths);
}
async function removeFileIfExists(filePath) {
	const stat = await node_fs.default.promises.stat(filePath).catch(() => null);
	if (!stat?.isFile()) return 0;
	await node_fs.default.promises.rm(filePath, { force: true }).catch(() => void 0);
	return stat.size;
}
async function removeFileForBudget(params) {
	const resolvedPath = node_path.default.resolve(params.filePath);
	const canonicalPath = params.canonicalPath ?? canonicalizePathForComparison(resolvedPath);
	if (params.dryRun) {
		if (params.simulatedRemovedPaths.has(canonicalPath)) return 0;
		const size = params.fileSizesByPath.get(canonicalPath) ?? 0;
		if (size <= 0) return 0;
		params.simulatedRemovedPaths.add(canonicalPath);
		params.onRemovedPath?.(canonicalPath);
		return size;
	}
	const size = await removeFileIfExists(resolvedPath);
	if (size > 0) params.onRemovedPath?.(canonicalPath);
	return size;
}
async function removePromptBlobFileForBudget(params) {
	let file = params.file;
	if (!params.dryRun) {
		const stat = await node_fs.default.promises.stat(file.path).catch(() => null);
		if (!stat?.isFile()) return 0;
		file = {
			...file,
			size: stat.size,
			mtimeMs: stat.mtimeMs
		};
	}
	if (!isPromptBlobArtifactRemovable(file, params.projectedPromptBlobRefCounts, params.promptBlobCutoffMs, params.tempCutoffMs)) return 0;
	return await removeFileForBudget({
		filePath: file.path,
		canonicalPath: file.canonicalPath,
		dryRun: params.dryRun,
		fileSizesByPath: params.fileSizesByPath,
		simulatedRemovedPaths: params.simulatedRemovedPaths,
		onRemovedPath: params.onRemovedPath
	});
}
async function pruneUnreferencedSessionArtifacts(params) {
	const olderThanMs = Number.isFinite(params.olderThanMs) && params.olderThanMs > 0 ? params.olderThanMs : 0;
	const sessionsDir = node_path.default.dirname(params.storePath);
	const files = await readSessionsDirFiles(sessionsDir);
	const promptBlobFiles = await readSessionPromptBlobFiles(sessionsDir);
	const fileSizesByPath = new Map([...files, ...promptBlobFiles].map((file) => [file.canonicalPath, file.size]));
	const simulatedRemovedPaths = /* @__PURE__ */ new Set();
	const referencedPaths = resolveReferencedSessionArtifactPaths({
		sessionsDir,
		store: params.store
	});
	const projectedPromptBlobRefCounts = buildProjectedPromptBlobRefCounts(projectSessionStoreForPersistence({
		storePath: params.storePath,
		store: params.store
	}).store);
	const cutoffMs = Date.now() - olderThanMs;
	const tempCutoffMs = Date.now() - require_paths.SESSION_STORE_TEMP_STALE_MS;
	const promptBlobCutoffMs = Date.now() - Math.max(olderThanMs, SESSION_PROMPT_BLOB_UNREFERENCED_GRACE_MS);
	const storeBasename = node_path.default.basename(params.storePath);
	const removableStoreFiles = files.filter((file) => {
		if (params.excludeCanonicalPaths?.has(file.canonicalPath)) return false;
		if (require_paths.isSessionStoreTempArtifactName(file.name, storeBasename)) return file.mtimeMs <= tempCutoffMs;
		return file.mtimeMs <= cutoffMs && isUnreferencedSessionArtifactFile(file, referencedPaths);
	});
	const removablePromptBlobFiles = promptBlobFiles.filter((file) => {
		if (params.excludeCanonicalPaths?.has(file.canonicalPath)) return false;
		return isPromptBlobArtifactRemovable(file, projectedPromptBlobRefCounts, promptBlobCutoffMs, tempCutoffMs);
	});
	const removableFiles = [...removableStoreFiles.map((file) => ({
		kind: "store",
		file
	})), ...removablePromptBlobFiles.map((file) => ({
		kind: "promptBlob",
		file
	}))].filter((file) => {
		return !params.excludeCanonicalPaths?.has(file.file.canonicalPath);
	}).toSorted((a, b) => a.file.mtimeMs - b.file.mtimeMs);
	let removedFiles = 0;
	let freedBytes = 0;
	const dryRun = params.dryRun === true;
	for (const item of removableFiles) {
		const deletedBytes = item.kind === "promptBlob" ? await removePromptBlobFileForBudget({
			file: item.file,
			projectedPromptBlobRefCounts,
			promptBlobCutoffMs,
			tempCutoffMs,
			dryRun,
			fileSizesByPath,
			simulatedRemovedPaths
		}) : await removeFileForBudget({
			filePath: item.file.path,
			canonicalPath: item.file.canonicalPath,
			dryRun,
			fileSizesByPath,
			simulatedRemovedPaths
		});
		if (deletedBytes <= 0) continue;
		removedFiles += 1;
		freedBytes += deletedBytes;
	}
	return {
		scannedFiles: files.length + promptBlobFiles.length,
		removedFiles,
		freedBytes,
		olderThanMs
	};
}
async function enforceSessionDiskBudget(params) {
	const maxBytes = params.maintenance.maxDiskBytes;
	const highWaterBytes = params.maintenance.highWaterBytes;
	if (maxBytes == null || highWaterBytes == null) return null;
	const log = params.log ?? NOOP_LOGGER;
	const dryRun = params.dryRun === true;
	const sessionsDir = node_path.default.dirname(params.storePath);
	const files = await readSessionsDirFiles(sessionsDir);
	const promptBlobFiles = await readSessionPromptBlobFiles(sessionsDir);
	const fileSizesByPath = new Map([...files, ...promptBlobFiles].map((file) => [file.canonicalPath, file.size]));
	const simulatedRemovedPaths = /* @__PURE__ */ new Set();
	const resolvedStorePath = canonicalizePathForComparison(params.storePath);
	const storeFile = files.find((file) => file.canonicalPath === resolvedStorePath);
	const projectedPersistence = projectSessionStoreForPersistence({
		storePath: params.storePath,
		store: params.store
	});
	const projectedStore = projectedPersistence.store;
	let projectedStoreBytes = measureStoreBytes(projectedStore);
	const projectedPromptBlobBytesByHash = /* @__PURE__ */ new Map();
	const existingPromptBlobFilesByHash = /* @__PURE__ */ new Map();
	for (const file of promptBlobFiles) {
		const hash = resolvePromptBlobFileHash(file);
		if (hash) existingPromptBlobFilesByHash.set(hash, file);
	}
	for (const [hash, blob] of projectedPersistence.promptBlobs) if (!existingPromptBlobFilesByHash.has(hash)) projectedPromptBlobBytesByHash.set(hash, blob.ref.bytes);
	const projectedPromptBlobRefCounts = buildProjectedPromptBlobRefCounts(projectedStore);
	const projectedPromptBlobBytes = [...projectedPromptBlobBytesByHash.values()].reduce((sum, bytes) => sum + bytes, 0);
	let total = [...files, ...promptBlobFiles].reduce((sum, file) => sum + file.size, 0) - (storeFile?.size ?? 0) + projectedStoreBytes + projectedPromptBlobBytes;
	const totalBefore = total;
	if (total <= maxBytes) return {
		totalBytesBefore: totalBefore,
		totalBytesAfter: total,
		removedFiles: 0,
		removedEntries: 0,
		freedBytes: 0,
		maxBytes,
		highWaterBytes,
		overBudget: false
	};
	if (params.warnOnly) {
		log.warn("session disk budget exceeded (warn-only mode)", {
			sessionsDir,
			totalBytes: total,
			maxBytes,
			highWaterBytes
		});
		return {
			totalBytesBefore: totalBefore,
			totalBytesAfter: total,
			removedFiles: 0,
			removedEntries: 0,
			freedBytes: 0,
			maxBytes,
			highWaterBytes,
			overBudget: true
		};
	}
	let removedFiles = 0;
	let removedEntries = 0;
	let freedBytes = 0;
	const referencedPaths = resolveReferencedSessionArtifactPaths({
		sessionsDir,
		store: params.store
	});
	const tempStaleCutoffMs = Date.now() - require_paths.SESSION_STORE_TEMP_STALE_MS;
	const promptBlobOrphanCutoffMs = Date.now() - SESSION_PROMPT_BLOB_UNREFERENCED_GRACE_MS;
	const storeBasename = node_path.default.basename(params.storePath);
	const unreferencedPromptBlobQueue = promptBlobFiles.filter((file) => {
		return isPromptBlobArtifactRemovable(file, projectedPromptBlobRefCounts, promptBlobOrphanCutoffMs, tempStaleCutoffMs);
	}).toSorted((a, b) => a.mtimeMs - b.mtimeMs);
	for (const file of unreferencedPromptBlobQueue) {
		if (total <= highWaterBytes) break;
		const deletedBytes = await removePromptBlobFileForBudget({
			file,
			projectedPromptBlobRefCounts,
			promptBlobCutoffMs: promptBlobOrphanCutoffMs,
			tempCutoffMs: tempStaleCutoffMs,
			dryRun,
			fileSizesByPath,
			simulatedRemovedPaths,
			onRemovedPath: params.onRemoveFile
		});
		if (deletedBytes <= 0) continue;
		total -= deletedBytes;
		freedBytes += deletedBytes;
		removedFiles += 1;
	}
	const removableFileQueue = files.filter((file) => isDiskBudgetRemovableSessionFile(file, referencedPaths, tempStaleCutoffMs, storeBasename)).toSorted((a, b) => a.mtimeMs - b.mtimeMs);
	for (const file of removableFileQueue) {
		if (total <= highWaterBytes) break;
		const deletedBytes = await removeFileForBudget({
			filePath: file.path,
			canonicalPath: file.canonicalPath,
			dryRun,
			fileSizesByPath,
			simulatedRemovedPaths,
			onRemovedPath: params.onRemoveFile
		});
		if (deletedBytes <= 0) continue;
		total -= deletedBytes;
		freedBytes += deletedBytes;
		removedFiles += 1;
	}
	if (total > highWaterBytes) {
		const activeSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.activeSessionKey);
		const sessionIdRefCounts = buildSessionIdRefCounts(params.store);
		const entryChunkBytesByKey = buildStoreEntryChunkSizeMap(projectedStore);
		const keys = Object.keys(params.store).toSorted((a, b) => {
			return getEntryUpdatedAt(params.store[a]) - getEntryUpdatedAt(params.store[b]);
		});
		for (const key of keys) {
			if (total <= highWaterBytes) break;
			if (activeSessionKey && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key) === activeSessionKey) continue;
			const entry = params.store[key];
			if (!entry) continue;
			if (shouldPreserveMaintenanceEntry({
				key,
				entry,
				preserveKeys: params.preserveKeys
			})) continue;
			const previousProjectedBytes = projectedStoreBytes;
			const projectedEntry = projectedStore[key];
			const promptBlobHash = resolveProjectedPromptBlobHash(projectedEntry);
			delete params.store[key];
			delete projectedStore[key];
			const chunkBytes = entryChunkBytesByKey.get(key);
			entryChunkBytesByKey.delete(key);
			if (typeof chunkBytes === "number" && Number.isFinite(chunkBytes) && chunkBytes >= 0) projectedStoreBytes = Math.max(2, projectedStoreBytes - (chunkBytes + 2));
			else projectedStoreBytes = measureStoreBytes(projectedStore);
			total += projectedStoreBytes - previousProjectedBytes;
			if (promptBlobHash) {
				const nextRefCount = (projectedPromptBlobRefCounts.get(promptBlobHash) ?? 1) - 1;
				if (nextRefCount > 0) projectedPromptBlobRefCounts.set(promptBlobHash, nextRefCount);
				else {
					projectedPromptBlobRefCounts.delete(promptBlobHash);
					const virtualBlobBytes = projectedPromptBlobBytesByHash.get(promptBlobHash) ?? 0;
					if (virtualBlobBytes > 0) total -= virtualBlobBytes;
					else {
						const blobFile = existingPromptBlobFilesByHash.get(promptBlobHash);
						if (blobFile && isPromptBlobArtifactRemovable(blobFile, projectedPromptBlobRefCounts, promptBlobOrphanCutoffMs, tempStaleCutoffMs)) {
							const deletedBytes = await removePromptBlobFileForBudget({
								file: blobFile,
								projectedPromptBlobRefCounts,
								promptBlobCutoffMs: promptBlobOrphanCutoffMs,
								tempCutoffMs: tempStaleCutoffMs,
								dryRun,
								fileSizesByPath,
								simulatedRemovedPaths,
								onRemovedPath: params.onRemoveFile
							});
							if (deletedBytes > 0) {
								total -= deletedBytes;
								freedBytes += deletedBytes;
								removedFiles += 1;
							}
						}
					}
				}
			}
			removedEntries += 1;
			const sessionId = entry.sessionId;
			if (!sessionId) continue;
			const nextRefCount = (sessionIdRefCounts.get(sessionId) ?? 1) - 1;
			if (nextRefCount > 0) {
				sessionIdRefCounts.set(sessionId, nextRefCount);
				continue;
			}
			sessionIdRefCounts.delete(sessionId);
			for (const artifactPath of resolveSessionArtifactPathsForEntry({
				sessionsDir,
				entry
			})) {
				const deletedBytes = await removeFileForBudget({
					filePath: artifactPath,
					dryRun,
					fileSizesByPath,
					simulatedRemovedPaths,
					onRemovedPath: params.onRemoveFile
				});
				if (deletedBytes <= 0) continue;
				total -= deletedBytes;
				freedBytes += deletedBytes;
				removedFiles += 1;
			}
		}
	}
	if (!dryRun) {
		if (total > highWaterBytes) log.warn("session disk budget still above high-water target after cleanup", {
			sessionsDir,
			totalBytes: total,
			maxBytes,
			highWaterBytes,
			removedFiles,
			removedEntries
		});
		else if (removedFiles > 0 || removedEntries > 0) log.info("applied session disk budget cleanup", {
			sessionsDir,
			totalBytesBefore: totalBefore,
			totalBytesAfter: total,
			maxBytes,
			highWaterBytes,
			removedFiles,
			removedEntries
		});
	}
	return {
		totalBytesBefore: totalBefore,
		totalBytesAfter: total,
		removedFiles,
		removedEntries,
		freedBytes,
		maxBytes,
		highWaterBytes,
		overBudget: true
	};
}
//#endregion
//#region src/config/sessions/store-maintenance-operations.ts
function resolveMaintenanceForOperation(params) {
	return params.maintenanceConfig ? {
		...params.maintenanceConfig,
		...params.maintenanceOverride
	} : {
		...resolveMaintenanceConfig(),
		...params.maintenanceOverride
	};
}
function collectReferencedSessionIds(store) {
	return new Set(Object.values(store).map((entry) => entry?.sessionId).filter((id) => Boolean(id)));
}
function rememberRemovedSessionFile(removedSessionFiles, entry) {
	if (!removedSessionFiles.has(entry.sessionId) || entry.sessionFile) removedSessionFiles.set(entry.sessionId, entry.sessionFile);
}
async function applyWarnOnlyMaintenance(params) {
	const activeSessionKey = params.operation.activeSessionKey?.trim();
	if (activeSessionKey && params.shouldRunEntryMaintenance) {
		const warning = getActiveSessionMaintenanceWarning({
			store: params.operation.store,
			activeSessionKey,
			pruneAfterMs: params.maintenance.pruneAfterMs,
			maxEntries: params.maintenance.maxEntries
		});
		if (warning) {
			params.operation.log.warn("session maintenance would evict active session; skipping enforcement", {
				activeSessionKey: warning.activeSessionKey,
				wouldPrune: warning.wouldPrune,
				wouldCap: warning.wouldCap,
				pruneAfterMs: warning.pruneAfterMs,
				maxEntries: warning.maxEntries
			});
			await params.operation.onWarn?.(warning);
		}
	}
	const diskBudget = await enforceSessionDiskBudget({
		store: params.operation.store,
		storePath: params.operation.storePath,
		activeSessionKey: params.operation.activeSessionKey,
		maintenance: params.maintenance,
		warnOnly: true,
		log: params.operation.log
	});
	await params.operation.onMaintenanceApplied?.({
		mode: params.maintenance.mode,
		beforeCount: params.beforeCount,
		afterCount: Object.keys(params.operation.store).length,
		modelRunPruned: 0,
		pruned: 0,
		capped: 0,
		diskBudget
	});
}
async function cleanupRemovedSessionArtifacts(params) {
	const archivedDirs = await params.operation.artifacts.archiveRemovedSessionTranscripts({
		removedSessionFiles: params.removedSessionFiles,
		referencedSessionIds: params.referencedSessionIds,
		storePath: params.operation.storePath,
		reason: "deleted",
		restrictToStoreDir: true
	});
	if (params.removedSessionFiles.size > 0) await params.operation.artifacts.removeRemovedSessionTrajectoryArtifacts({
		removedSessionFiles: params.removedSessionFiles,
		referencedSessionIds: params.referencedSessionIds,
		storePath: params.operation.storePath,
		restrictToStoreDir: true
	});
	if (params.maintenance.resetArchiveRetentionMs == null) return;
	const targetDirs = archivedDirs.size > 0 ? [...archivedDirs] : [node_path.default.dirname(node_path.default.resolve(params.operation.storePath))];
	await params.operation.artifacts.cleanupArchivedSessionTranscripts({
		directories: targetDirs,
		rules: [{
			reason: "deleted",
			olderThanMs: params.maintenance.resetArchiveRetentionMs
		}, {
			reason: "reset",
			olderThanMs: params.maintenance.resetArchiveRetentionMs
		}]
	});
}
async function applyEnforcedMaintenance(params) {
	const preserveSessionKeys = collectSessionMaintenancePreserveKeysForStore({
		storePath: params.operation.storePath,
		store: params.operation.store,
		baseKeys: [params.operation.activeSessionKey]
	});
	const removedSessionFiles = /* @__PURE__ */ new Map();
	const modelRunPruned = shouldRunModelRunPrune({
		maintenance: params.maintenance,
		entryCount: params.beforeCount,
		force: params.forceMaintenance
	}) ? pruneStaleModelRunEntries(params.operation.store, params.maintenance.modelRunPruneAfterMs, {
		onPruned: ({ entry }) => {
			rememberRemovedSessionFile(removedSessionFiles, entry);
		},
		preserveKeys: preserveSessionKeys
	}) : 0;
	const pruned = pruneStaleEntries(params.operation.store, params.maintenance.pruneAfterMs, {
		onPruned: ({ entry }) => {
			rememberRemovedSessionFile(removedSessionFiles, entry);
		},
		preserveKeys: preserveSessionKeys
	});
	const countAfterPrune = Object.keys(params.operation.store).length;
	const capped = params.forceMaintenance || shouldRunSessionEntryMaintenance({
		entryCount: countAfterPrune,
		maxEntries: params.maintenance.maxEntries
	}) ? capEntryCount(params.operation.store, params.maintenance.maxEntries, {
		onCapped: ({ entry }) => {
			rememberRemovedSessionFile(removedSessionFiles, entry);
		},
		preserveKeys: preserveSessionKeys
	}) : 0;
	const referencedSessionIds = collectReferencedSessionIds(params.operation.store);
	await cleanupRemovedSessionArtifacts({
		operation: params.operation,
		maintenance: params.maintenance,
		removedSessionFiles,
		referencedSessionIds
	});
	const diskBudget = await enforceSessionDiskBudget({
		store: params.operation.store,
		storePath: params.operation.storePath,
		activeSessionKey: params.operation.activeSessionKey,
		preserveKeys: preserveSessionKeys,
		maintenance: params.maintenance,
		warnOnly: false,
		log: params.operation.log
	});
	await params.operation.onMaintenanceApplied?.({
		mode: params.maintenance.mode,
		beforeCount: params.beforeCount,
		afterCount: Object.keys(params.operation.store).length,
		modelRunPruned,
		pruned,
		capped,
		diskBudget
	});
	return { changedStore: modelRunPruned > 0 || pruned > 0 || capped > 0 || (diskBudget?.removedEntries ?? 0) > 0 };
}
/**
* Applies automatic session-store maintenance to the in-memory file-store image.
*
* Future SQLite adapters should map this into named boundaries: entry retention,
* removed-session artifact cleanup, disk-budget eviction, and archive retention cleanup.
*/
async function applyFileBackedSessionStoreMaintenance(params) {
	const maintenance = resolveMaintenanceForOperation(params);
	const beforeCount = Object.keys(params.store).length;
	const forceMaintenance = params.maintenanceOverride !== void 0;
	const shouldRunEntryMaintenance = shouldRunSessionEntryMaintenance({
		entryCount: beforeCount,
		maxEntries: maintenance.maxEntries,
		force: forceMaintenance
	});
	if (maintenance.mode === "warn") {
		await applyWarnOnlyMaintenance({
			operation: params,
			maintenance,
			beforeCount,
			shouldRunEntryMaintenance
		});
		return { changedStore: false };
	}
	return await applyEnforcedMaintenance({
		operation: params,
		maintenance,
		beforeCount,
		forceMaintenance
	});
}
//#endregion
//#region src/config/sessions/store.ts
const log = require_subsystem.createSubsystemLogger("sessions/store");
const writerStoreFileStats = /* @__PURE__ */ new WeakMap();
const writerLockedSessionEntries = /* @__PURE__ */ new WeakMap();
const loadSessionArchiveRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./session-archive.runtime-Ctg43zmX.cjs")));
const loadTrajectoryCleanupRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./cleanup-BjFxt6pj.cjs")));
function readSessionUpdatedAt(params) {
	try {
		return resolveSessionStoreEntry({
			store: loadSessionStore(params.storePath, { clone: false }),
			sessionKey: params.sessionKey
		}).existing?.updatedAt;
	} catch {
		return;
	}
}
function cloneSessionEntry(entry) {
	return (0, _gabrielvfonseca_normalization_core.expectDefined)(cloneSessionStoreRecord({ entry }).entry, "cloned session entry");
}
function cloneSessionEntries(store) {
	return Object.fromEntries(Object.entries(store).map(([sessionKey, entry]) => [sessionKey, cloneSessionEntry(entry)]));
}
function replaceSessionEntries(target, source) {
	for (const sessionKey of Object.keys(target)) delete target[sessionKey];
	Object.assign(target, cloneSessionEntries(source));
}
function snapshotLockedSessionEntries(store) {
	const lockedEntries = /* @__PURE__ */ new Map();
	for (const [sessionKey, entry] of Object.entries(store)) if (isValidAgentHarnessSessionStoreEntry(sessionKey, entry)) lockedEntries.set(sessionKey, cloneSessionEntry(entry));
	return lockedEntries;
}
function assertLockedSessionEntriesPreserved(params) {
	const error = resolveAgentHarnessSessionStoreTransitionError(params);
	if (error) throw new Error(error);
}
function assertValidAgentHarnessSessionEntries(store) {
	const error = resolveAgentHarnessSessionStoreError(store);
	if (error) throw new Error(error);
}
function projectSessionEntryForPersistenceRevision(params) {
	const stripped = stripPersistedSkillsCache(params.entry);
	return projectSessionStoreForPersistence({
		storePath: params.storePath,
		store: { entry: stripped }
	}).store.entry ?? stripped;
}
function getSessionEntry(options) {
	const entry = readSessionEntry(resolveSessionStorePathForScope(options), options.sessionKey, { hydrateSkillPromptRefs: options.hydrateSkillPromptRefs });
	return entry ? cloneSessionEntry(entry) : void 0;
}
function updateSessionStoreWriteCaches(params) {
	const fileStat = getFileStatSnapshot(params.storePath);
	setSerializedSessionStore(params.storePath, params.serialized, fileStat?.sizeBytes, params.serializedPromptRefs);
	if (!isSessionStoreCacheEnabled()) {
		dropSessionStoreObjectCache(params.storePath);
		return;
	}
	writeSessionStoreCache({
		storePath: params.storePath,
		store: params.store,
		mtimeMs: fileStat?.mtimeMs,
		sizeBytes: fileStat?.sizeBytes,
		serialized: params.serialized,
		serializedPromptRefs: params.serializedPromptRefs,
		cloneSerialized: params.cloneSerialized,
		takeOwnership: params.takeOwnership
	});
}
function restoreUnchangedSessionStoreCache(storePath, store) {
	if (!isSessionStoreCacheEnabled()) return;
	const loadedFileStat = writerStoreFileStats.get(store) ?? null;
	const currentFileStat = getFileStatSnapshot(storePath) ?? null;
	if (loadedFileStat?.mtimeMs !== currentFileStat?.mtimeMs || loadedFileStat?.sizeBytes !== currentFileStat?.sizeBytes) {
		invalidateSessionStoreCache(storePath);
		return;
	}
	const serialized = getSerializedSessionStore(storePath);
	const serializedPromptRefs = serialized !== void 0 ? getSerializedSessionStorePromptRefs(storePath) : void 0;
	writeSessionStoreCache({
		storePath,
		store,
		mtimeMs: loadedFileStat?.mtimeMs,
		sizeBytes: loadedFileStat?.sizeBytes,
		serialized,
		serializedPromptRefs,
		takeOwnership: true
	});
	if (serialized !== void 0) setSerializedSessionStore(storePath, serialized, loadedFileStat?.sizeBytes, serializedPromptRefs);
}
function findJsonValueEnd(json, valueStart) {
	let depth = 0;
	let inString = false;
	let escaped = false;
	for (let index = valueStart; index < json.length; index += 1) {
		const char = json[index];
		if (inString) {
			if (escaped) escaped = false;
			else if (char === "\\") escaped = true;
			else if (char === "\"") inString = false;
			continue;
		}
		if (char === "\"") {
			inString = true;
			continue;
		}
		if (char === "{" || char === "[") {
			depth += 1;
			continue;
		}
		if (char !== "}" && char !== "]") continue;
		depth -= 1;
		if (depth === 0) return index + 1;
		if (depth < 0) return null;
	}
	return null;
}
function indentTopLevelEntryJson(json) {
	return json.replaceAll("\n", "\n  ");
}
function buildSingleEntrySerializedStore(params) {
	const currentSerialized = getSerializedSessionStore(params.storePath);
	if (currentSerialized === void 0) return null;
	const currentPromptRefs = getSerializedPromptRefs(params.storePath, currentSerialized);
	const marker = `\n  ${JSON.stringify(params.patch.sessionKey)}: `;
	const markerIndex = currentSerialized.indexOf(marker);
	if (markerIndex < 0) return null;
	const valueStart = markerIndex + marker.length;
	if (currentSerialized[valueStart] !== "{") return null;
	const valueEnd = findJsonValueEnd(currentSerialized, valueStart);
	if (valueEnd === null) return null;
	const projected = projectSessionStoreForPersistence({
		storePath: params.storePath,
		store: { [params.patch.sessionKey]: params.patch.entry }
	});
	const projectedEntry = projected.store[params.patch.sessionKey];
	if (!projectedEntry) return null;
	const entryJson = indentTopLevelEntryJson(JSON.stringify(projectedEntry, null, 2));
	const promptRefs = new Map(currentPromptRefs);
	const promptRef = projectedEntry.skillsSnapshot?.promptRef;
	if (promptRef) promptRefs.set(params.patch.sessionKey, promptRef);
	else promptRefs.delete(params.patch.sessionKey);
	return {
		serialized: currentSerialized.slice(0, valueStart) + entryJson + currentSerialized.slice(valueEnd),
		promptBlobs: [...projected.promptBlobs.values()],
		promptRefs
	};
}
function collectSerializedPromptRefs(serialized) {
	const refs = /* @__PURE__ */ new Map();
	try {
		const parsed = JSON.parse(serialized);
		for (const [key, entry] of Object.entries(parsed)) {
			const ref = entry?.skillsSnapshot?.promptRef;
			if (ref) refs.set(key, ref);
		}
	} catch {}
	return refs;
}
function collectStorePromptRefs(store) {
	const refs = /* @__PURE__ */ new Map();
	for (const [key, entry] of Object.entries(store)) {
		const ref = entry?.skillsSnapshot?.promptRef;
		if (ref) refs.set(key, ref);
	}
	return refs;
}
function getSerializedPromptRefs(storePath, serialized) {
	const cached = getSerializedSessionStorePromptRefs(storePath);
	if (cached) return cached;
	const refs = collectSerializedPromptRefs(serialized);
	setSerializedSessionStorePromptRefs(storePath, refs);
	return refs;
}
function storeHasUnsafeUntouchedHydratedSkillPrompts(storePath, store, changedSessionKey) {
	const currentSerialized = getSerializedSessionStore(storePath);
	const serializedPromptRefs = currentSerialized !== void 0 ? getSerializedPromptRefs(storePath, currentSerialized) : void 0;
	for (const [key, entry] of Object.entries(store)) {
		if (key === changedSessionKey || typeof entry.skillsSnapshot?.prompt !== "string") continue;
		const ref = serializedPromptRefs?.get(key);
		if (!ref || !isSessionSkillPromptBlobReadable(storePath, ref)) return true;
		if (serializedPromptRefs?.has(key)) {
			const projected = projectSessionStoreForPersistence({
				storePath,
				store: { [key]: entry }
			});
			for (const blob of projected.promptBlobs.values()) {
				if (!blob.path) continue;
				try {
					const stat = node_fs.default.statSync(blob.path);
					if (!stat.isFile() || stat.size !== blob.ref.bytes) return true;
				} catch {
					return true;
				}
			}
		}
	}
	return false;
}
function loadMutableSessionStoreForWriter(storePath) {
	const currentFileStat = getFileStatSnapshot(storePath);
	if (isSessionStoreCacheEnabled()) {
		const cached = takeMutableSessionStoreCache({
			storePath,
			mtimeMs: currentFileStat?.mtimeMs,
			sizeBytes: currentFileStat?.sizeBytes
		});
		if (cached) {
			writerStoreFileStats.set(cached, currentFileStat ?? null);
			writerLockedSessionEntries.set(cached, snapshotLockedSessionEntries(cached));
			return cached;
		}
	}
	const store = loadSessionStore(storePath, {
		skipCache: true,
		clone: false
	});
	writerStoreFileStats.set(store, currentFileStat ?? null);
	writerLockedSessionEntries.set(store, snapshotLockedSessionEntries(store));
	return store;
}
async function saveSessionStoreUnlocked(storePath, store, opts, invariantContext) {
	normalizeSessionStore(store);
	const lockedEntriesBefore = invariantContext?.lockedEntriesBefore ?? writerLockedSessionEntries.get(store);
	assertLockedSessionEntriesPreserved({
		before: lockedEntriesBefore,
		store
	});
	assertValidAgentHarnessSessionEntries(store);
	let maintenanceChangedStore = false;
	if (!opts?.skipMaintenance) maintenanceChangedStore = (await applyFileBackedSessionStoreMaintenance({
		storePath,
		store,
		activeSessionKey: opts?.activeSessionKey,
		onWarn: opts?.onWarn,
		onMaintenanceApplied: opts?.onMaintenanceApplied,
		maintenanceOverride: opts?.maintenanceOverride,
		maintenanceConfig: opts?.maintenanceConfig,
		log,
		artifacts: {
			archiveRemovedSessionTranscripts,
			removeRemovedSessionTrajectoryArtifacts: async (params) => {
				const { removeRemovedSessionTrajectoryArtifacts } = await loadTrajectoryCleanupRuntime();
				await removeRemovedSessionTrajectoryArtifacts(params);
			},
			cleanupArchivedSessionTranscripts: async (params) => {
				const { cleanupArchivedSessionTranscripts } = await loadSessionArchiveRuntime();
				await cleanupArchivedSessionTranscripts(params);
			}
		}
	})).changedStore;
	assertLockedSessionEntriesPreserved({
		before: lockedEntriesBefore,
		store
	});
	assertValidAgentHarnessSessionEntries(store);
	if (opts?.skipSerializeForUnchangedStore && !maintenanceChangedStore && getSerializedSessionStore(storePath) !== void 0) {
		restoreUnchangedSessionStoreCache(storePath, store);
		return;
	}
	await node_fs.default.promises.mkdir(node_path.default.dirname(storePath), { recursive: true });
	if (opts?.singleEntryPersistence && !maintenanceChangedStore && !storeHasUnsafeUntouchedHydratedSkillPrompts(storePath, store, opts.singleEntryPersistence.sessionKey)) {
		const normalizedEntry = store[opts.singleEntryPersistence.sessionKey];
		const singleEntrySerialized = buildSingleEntrySerializedStore({
			storePath,
			patch: normalizedEntry ? {
				sessionKey: opts.singleEntryPersistence.sessionKey,
				entry: normalizedEntry
			} : opts.singleEntryPersistence
		});
		if (singleEntrySerialized) {
			await writeSessionStoreAtomic({
				storePath,
				store,
				serialized: singleEntrySerialized.serialized,
				serializedPromptRefs: singleEntrySerialized.promptRefs,
				promptBlobs: singleEntrySerialized.promptBlobs,
				takeOwnership: opts?.takeCacheOwnership
			});
			return;
		}
	}
	const persisted = projectSessionStoreForPersistence({
		storePath,
		store
	});
	const promptBlobs = [...persisted.promptBlobs.values()];
	const promptRefs = collectStorePromptRefs(persisted.store);
	const json = JSON.stringify(persisted.store, null, 2);
	const cloneSerialized = persisted.changed ? void 0 : json;
	if (getSerializedSessionStore(storePath) === json) {
		await ensureSessionStorePromptBlobsForPersistence({
			storePath,
			promptBlobs
		});
		updateSessionStoreWriteCaches({
			storePath,
			store,
			serialized: json,
			serializedPromptRefs: promptRefs,
			cloneSerialized,
			takeOwnership: opts?.takeCacheOwnership
		});
		return;
	}
	if (process.platform === "win32") {
		let finalError;
		for (let i = 0; i < 5; i++) try {
			await writeSessionStoreAtomic({
				storePath,
				store,
				serialized: json,
				serializedPromptRefs: promptRefs,
				cloneSerialized,
				promptBlobs,
				takeOwnership: opts?.takeCacheOwnership
			});
			return;
		} catch (err) {
			finalError = err;
			if (getErrorCode(err) === "ENOENT") {
				if (opts?.requireWriteSuccess) throw err;
				return;
			}
			if (i < 4) {
				await new Promise((r) => {
					setTimeout(r, 50 * (i + 1));
				});
				continue;
			}
			log.warn(`atomic write failed after 5 attempts: ${storePath}`);
		}
		if (opts?.requireWriteSuccess) throw finalError;
		return;
	}
	try {
		await writeSessionStoreAtomic({
			storePath,
			store,
			serialized: json,
			serializedPromptRefs: promptRefs,
			cloneSerialized,
			promptBlobs,
			takeOwnership: opts?.takeCacheOwnership
		});
	} catch (err) {
		if (getErrorCode(err) === "ENOENT") {
			try {
				await writeSessionStoreAtomic({
					storePath,
					store,
					serialized: json,
					serializedPromptRefs: promptRefs,
					cloneSerialized,
					promptBlobs,
					takeOwnership: opts?.takeCacheOwnership
				});
			} catch (err2) {
				if (getErrorCode(err2) === "ENOENT") {
					if (opts?.requireWriteSuccess) throw err2;
					return;
				}
				throw err2;
			}
			return;
		}
		throw err;
	}
}
async function saveSessionStore(storePath, store, opts) {
	await runExclusiveSessionStoreWrite(storePath, async () => {
		await saveSessionStoreUnlocked(storePath, store, opts, { lockedEntriesBefore: snapshotLockedSessionEntries(loadSessionStore(storePath, {
			skipCache: true,
			clone: false
		})) });
	});
}
async function updateSessionStore(storePath, mutator, opts) {
	return await runExclusiveSessionStoreWrite(storePath, async () => {
		const store = loadMutableSessionStoreForWriter(storePath);
		const storeBeforeMutation = opts?.skipSaveWhenResult ? cloneSessionEntries(store) : void 0;
		const result = await mutator(store);
		if (opts?.skipSaveWhenResult?.(result)) {
			if (!storeBeforeMutation) throw new Error("Skipped session-store write is missing its original snapshot.");
			try {
				assertLockedSessionEntriesPreserved({
					before: writerLockedSessionEntries.get(store),
					store
				});
				assertValidAgentHarnessSessionEntries(store);
			} finally {
				replaceSessionEntries(store, storeBeforeMutation);
				restoreUnchangedSessionStoreCache(storePath, store);
			}
			return result;
		}
		await saveSessionStoreUnlocked(storePath, store, {
			...opts,
			singleEntryPersistence: opts?.resolveSingleEntryPersistence?.(result) ?? void 0
		});
		return result;
	}, { reentrant: opts?.reentrant });
}
function getErrorCode(error) {
	if (!error || typeof error !== "object" || !("code" in error)) return null;
	return String(error.code);
}
async function archiveRemovedSessionTranscripts(params) {
	const { archiveSessionTranscripts } = await loadSessionArchiveRuntime();
	const archivedDirs = /* @__PURE__ */ new Set();
	for (const [sessionId, sessionFile] of params.removedSessionFiles) {
		if (params.referencedSessionIds.has(sessionId)) continue;
		const archived = archiveSessionTranscripts({
			sessionId,
			storePath: params.storePath,
			sessionFile,
			reason: params.reason,
			restrictToStoreDir: params.restrictToStoreDir
		});
		for (const archivedPath of archived) archivedDirs.add(node_path.default.dirname(archivedPath));
	}
	return archivedDirs;
}
async function writeSessionStoreAtomic(params) {
	await require_json_files.writeTextAtomic(params.storePath, params.serialized, {
		durable: false,
		mode: 384,
		tempPrefix: node_path.default.basename(params.storePath),
		beforeRename: async () => {
			await ensureSessionStorePromptBlobsForPersistence({
				storePath: params.storePath,
				promptBlobs: params.promptBlobs
			});
		}
	});
	updateSessionStoreWriteCaches({
		storePath: params.storePath,
		store: params.store,
		serialized: params.serialized,
		serializedPromptRefs: params.serializedPromptRefs,
		cloneSerialized: params.cloneSerialized,
		takeOwnership: params.takeOwnership
	});
}
//#endregion
Object.defineProperty(exports, "AGENT_HARNESS_MODEL_RUN_FORBIDDEN_MESSAGE", {
	enumerable: true,
	get: function() {
		return AGENT_HARNESS_MODEL_RUN_FORBIDDEN_MESSAGE;
	}
});
Object.defineProperty(exports, "AGENT_HARNESS_SESSION_ID_LOCKED_MESSAGE", {
	enumerable: true,
	get: function() {
		return AGENT_HARNESS_SESSION_ID_LOCKED_MESSAGE;
	}
});
Object.defineProperty(exports, "AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE", {
	enumerable: true,
	get: function() {
		return AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE;
	}
});
Object.defineProperty(exports, "DEFAULT_RESET_TRIGGERS", {
	enumerable: true,
	get: function() {
		return DEFAULT_RESET_TRIGGERS;
	}
});
Object.defineProperty(exports, "MODEL_SELECTION_LOCK_REMOVAL_MESSAGE", {
	enumerable: true,
	get: function() {
		return MODEL_SELECTION_LOCK_REMOVAL_MESSAGE;
	}
});
Object.defineProperty(exports, "SESSION_WORK_ADMISSION_DRAIN_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return SESSION_WORK_ADMISSION_DRAIN_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "beginSessionWorkAdmission", {
	enumerable: true,
	get: function() {
		return beginSessionWorkAdmission;
	}
});
Object.defineProperty(exports, "buildRestartRecoveryClaimCleanupPatch", {
	enumerable: true,
	get: function() {
		return buildRestartRecoveryClaimCleanupPatch;
	}
});
Object.defineProperty(exports, "cancelSessionWorkAdmissionHandoff", {
	enumerable: true,
	get: function() {
		return cancelSessionWorkAdmissionHandoff;
	}
});
Object.defineProperty(exports, "canonicalizeAbsoluteSessionFilePath", {
	enumerable: true,
	get: function() {
		return canonicalizeAbsoluteSessionFilePath;
	}
});
Object.defineProperty(exports, "capEntryCount", {
	enumerable: true,
	get: function() {
		return capEntryCount;
	}
});
Object.defineProperty(exports, "cloneSessionStoreRecord", {
	enumerable: true,
	get: function() {
		return cloneSessionStoreRecord;
	}
});
Object.defineProperty(exports, "collectSessionMaintenancePreserveKeys", {
	enumerable: true,
	get: function() {
		return collectSessionMaintenancePreserveKeys;
	}
});
Object.defineProperty(exports, "collectSessionMaintenancePreserveKeysForStore", {
	enumerable: true,
	get: function() {
		return collectSessionMaintenancePreserveKeysForStore;
	}
});
Object.defineProperty(exports, "consumeSessionWorkAdmissionHandoff", {
	enumerable: true,
	get: function() {
		return consumeSessionWorkAdmissionHandoff;
	}
});
Object.defineProperty(exports, "createExpiringMapCache", {
	enumerable: true,
	get: function() {
		return createExpiringMapCache;
	}
});
Object.defineProperty(exports, "foldedSessionKeyAliasCandidates", {
	enumerable: true,
	get: function() {
		return foldedSessionKeyAliasCandidates;
	}
});
Object.defineProperty(exports, "getActiveSessionLifecycleMutationCount", {
	enumerable: true,
	get: function() {
		return getActiveSessionLifecycleMutationCount;
	}
});
Object.defineProperty(exports, "getActiveSessionWorkAdmissionCount", {
	enumerable: true,
	get: function() {
		return getActiveSessionWorkAdmissionCount;
	}
});
Object.defineProperty(exports, "getRestartRecoveryTerminalDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return getRestartRecoveryTerminalDeliveryEvidence;
	}
});
Object.defineProperty(exports, "getSessionEntry", {
	enumerable: true,
	get: function() {
		return getSessionEntry;
	}
});
Object.defineProperty(exports, "getSessionStoreCacheVersion", {
	enumerable: true,
	get: function() {
		return getSessionStoreCacheVersion;
	}
});
Object.defineProperty(exports, "hasActiveRestartRecoverySourceClaim", {
	enumerable: true,
	get: function() {
		return hasActiveRestartRecoverySourceClaim;
	}
});
Object.defineProperty(exports, "hasMismatchedCaseSensitiveDeliveryProof", {
	enumerable: true,
	get: function() {
		return hasMismatchedCaseSensitiveDeliveryProof;
	}
});
Object.defineProperty(exports, "hasOnlySessionLifecycleMutationKindActive", {
	enumerable: true,
	get: function() {
		return hasOnlySessionLifecycleMutationKindActive;
	}
});
Object.defineProperty(exports, "hasRestartRecoverySourceClaim", {
	enumerable: true,
	get: function() {
		return hasRestartRecoverySourceClaim;
	}
});
Object.defineProperty(exports, "hasRestartRecoveryTerminalRun", {
	enumerable: true,
	get: function() {
		return hasRestartRecoveryTerminalRun;
	}
});
Object.defineProperty(exports, "hydrateSessionStoreSkillPromptRefs", {
	enumerable: true,
	get: function() {
		return hydrateSessionStoreSkillPromptRefs;
	}
});
Object.defineProperty(exports, "interruptSessionWorkAdmissions", {
	enumerable: true,
	get: function() {
		return interruptSessionWorkAdmissions;
	}
});
Object.defineProperty(exports, "isAgentHarnessSessionKey", {
	enumerable: true,
	get: function() {
		return isAgentHarnessSessionKey;
	}
});
Object.defineProperty(exports, "isAgentHarnessSessionKeyOwnedBy", {
	enumerable: true,
	get: function() {
		return isAgentHarnessSessionKeyOwnedBy;
	}
});
Object.defineProperty(exports, "isAgentHarnessSessionStoreEntryProtected", {
	enumerable: true,
	get: function() {
		return isAgentHarnessSessionStoreEntryProtected;
	}
});
Object.defineProperty(exports, "isCacheEnabled", {
	enumerable: true,
	get: function() {
		return isCacheEnabled;
	}
});
Object.defineProperty(exports, "isConfirmedLowercasedLegacyAlias", {
	enumerable: true,
	get: function() {
		return isConfirmedLowercasedLegacyAlias;
	}
});
Object.defineProperty(exports, "isSessionLifecycleMutationActive", {
	enumerable: true,
	get: function() {
		return isSessionLifecycleMutationActive;
	}
});
Object.defineProperty(exports, "isSessionWorkAdmissionActive", {
	enumerable: true,
	get: function() {
		return isSessionWorkAdmissionActive;
	}
});
Object.defineProperty(exports, "isTerminalSessionStatus", {
	enumerable: true,
	get: function() {
		return isTerminalSessionStatus;
	}
});
Object.defineProperty(exports, "isValidAgentHarnessSessionStoreEntry", {
	enumerable: true,
	get: function() {
		return isValidAgentHarnessSessionStoreEntry;
	}
});
Object.defineProperty(exports, "loadSessionStore", {
	enumerable: true,
	get: function() {
		return loadSessionStore;
	}
});
Object.defineProperty(exports, "mergeRestartRecoveryTerminalRunIds", {
	enumerable: true,
	get: function() {
		return mergeRestartRecoveryTerminalRunIds;
	}
});
Object.defineProperty(exports, "mergeSessionEntry", {
	enumerable: true,
	get: function() {
		return mergeSessionEntry;
	}
});
Object.defineProperty(exports, "mergeSessionEntryPreserveActivity", {
	enumerable: true,
	get: function() {
		return mergeSessionEntryPreserveActivity;
	}
});
Object.defineProperty(exports, "normalizePersistedSessionEntryShape", {
	enumerable: true,
	get: function() {
		return normalizePersistedSessionEntryShape;
	}
});
Object.defineProperty(exports, "normalizeSessionEntryDelivery", {
	enumerable: true,
	get: function() {
		return normalizeSessionEntryDelivery;
	}
});
Object.defineProperty(exports, "normalizeSessionEntrySlotKey", {
	enumerable: true,
	get: function() {
		return normalizeSessionEntrySlotKey;
	}
});
Object.defineProperty(exports, "normalizeStoreSessionKey", {
	enumerable: true,
	get: function() {
		return normalizeStoreSessionKey;
	}
});
Object.defineProperty(exports, "parseSessionThreadInfo", {
	enumerable: true,
	get: function() {
		return parseSessionThreadInfo;
	}
});
Object.defineProperty(exports, "parseSessionThreadInfoFast", {
	enumerable: true,
	get: function() {
		return parseSessionThreadInfoFast;
	}
});
Object.defineProperty(exports, "projectSessionEntryForPersistenceRevision", {
	enumerable: true,
	get: function() {
		return projectSessionEntryForPersistenceRevision;
	}
});
Object.defineProperty(exports, "pruneStaleEntries", {
	enumerable: true,
	get: function() {
		return pruneStaleEntries;
	}
});
Object.defineProperty(exports, "pruneStaleModelRunEntries", {
	enumerable: true,
	get: function() {
		return pruneStaleModelRunEntries;
	}
});
Object.defineProperty(exports, "pruneUnreferencedSessionArtifacts", {
	enumerable: true,
	get: function() {
		return pruneUnreferencedSessionArtifacts;
	}
});
Object.defineProperty(exports, "readSessionEntry", {
	enumerable: true,
	get: function() {
		return readSessionEntry;
	}
});
Object.defineProperty(exports, "readSessionUpdatedAt", {
	enumerable: true,
	get: function() {
		return readSessionUpdatedAt;
	}
});
Object.defineProperty(exports, "registerSessionMaintenancePreserveKeysProvider", {
	enumerable: true,
	get: function() {
		return registerSessionMaintenancePreserveKeysProvider;
	}
});
Object.defineProperty(exports, "resolveAgentHarnessSessionContextError", {
	enumerable: true,
	get: function() {
		return resolveAgentHarnessSessionContextError;
	}
});
Object.defineProperty(exports, "resolveAgentHarnessSessionIdMismatchError", {
	enumerable: true,
	get: function() {
		return resolveAgentHarnessSessionIdMismatchError;
	}
});
Object.defineProperty(exports, "resolveAgentHarnessSessionStoreEntryError", {
	enumerable: true,
	get: function() {
		return resolveAgentHarnessSessionStoreEntryError;
	}
});
Object.defineProperty(exports, "resolveAgentHarnessSessionStoreError", {
	enumerable: true,
	get: function() {
		return resolveAgentHarnessSessionStoreError;
	}
});
Object.defineProperty(exports, "resolveAgentHarnessSessionStoreTransitionError", {
	enumerable: true,
	get: function() {
		return resolveAgentHarnessSessionStoreTransitionError;
	}
});
Object.defineProperty(exports, "resolveFreshSessionTotalTokens", {
	enumerable: true,
	get: function() {
		return resolveFreshSessionTotalTokens;
	}
});
Object.defineProperty(exports, "resolveLoadedSessionThreadInfo", {
	enumerable: true,
	get: function() {
		return resolveLoadedSessionThreadInfo;
	}
});
Object.defineProperty(exports, "resolveMaintenanceConfig", {
	enumerable: true,
	get: function() {
		return resolveMaintenanceConfig;
	}
});
Object.defineProperty(exports, "resolveMaintenanceConfigFromInput", {
	enumerable: true,
	get: function() {
		return resolveMaintenanceConfigFromInput;
	}
});
Object.defineProperty(exports, "resolveMissingAgentHarnessSessionError", {
	enumerable: true,
	get: function() {
		return resolveMissingAgentHarnessSessionError;
	}
});
Object.defineProperty(exports, "resolveQuotaSuspensionEntryMaintenance", {
	enumerable: true,
	get: function() {
		return resolveQuotaSuspensionEntryMaintenance;
	}
});
Object.defineProperty(exports, "resolveRestartRecoveryChannelAuthority", {
	enumerable: true,
	get: function() {
		return resolveRestartRecoveryChannelAuthority;
	}
});
Object.defineProperty(exports, "resolveSessionArtifactCanonicalPathsForEntry", {
	enumerable: true,
	get: function() {
		return resolveSessionArtifactCanonicalPathsForEntry;
	}
});
Object.defineProperty(exports, "resolveSessionConversation", {
	enumerable: true,
	get: function() {
		return resolveSessionConversation;
	}
});
Object.defineProperty(exports, "resolveSessionConversationRef", {
	enumerable: true,
	get: function() {
		return resolveSessionConversationRef;
	}
});
Object.defineProperty(exports, "resolveSessionEntryCandidates", {
	enumerable: true,
	get: function() {
		return resolveSessionEntryCandidates;
	}
});
Object.defineProperty(exports, "resolveSessionParentSessionKey", {
	enumerable: true,
	get: function() {
		return resolveSessionParentSessionKey;
	}
});
Object.defineProperty(exports, "resolveSessionPluginStatusLines", {
	enumerable: true,
	get: function() {
		return resolveSessionPluginStatusLines;
	}
});
Object.defineProperty(exports, "resolveSessionPluginTraceLines", {
	enumerable: true,
	get: function() {
		return resolveSessionPluginTraceLines;
	}
});
Object.defineProperty(exports, "resolveSessionStoreEntry", {
	enumerable: true,
	get: function() {
		return resolveSessionStoreEntry;
	}
});
Object.defineProperty(exports, "resolveSessionStorePathForScope", {
	enumerable: true,
	get: function() {
		return resolveSessionStorePathForScope;
	}
});
Object.defineProperty(exports, "resolveSessionTotalTokens", {
	enumerable: true,
	get: function() {
		return resolveSessionTotalTokens;
	}
});
Object.defineProperty(exports, "rewriteSessionFileForNewSessionId", {
	enumerable: true,
	get: function() {
		return rewriteSessionFileForNewSessionId;
	}
});
Object.defineProperty(exports, "runExclusiveSessionLifecycleMutation", {
	enumerable: true,
	get: function() {
		return runExclusiveSessionLifecycleMutation;
	}
});
Object.defineProperty(exports, "runExclusiveSessionStoreWrite", {
	enumerable: true,
	get: function() {
		return runExclusiveSessionStoreWrite;
	}
});
Object.defineProperty(exports, "runQueuedStoreWrite", {
	enumerable: true,
	get: function() {
		return runQueuedStoreWrite;
	}
});
Object.defineProperty(exports, "sameRestartRecoveryTerminalRunIds", {
	enumerable: true,
	get: function() {
		return sameRestartRecoveryTerminalRunIds;
	}
});
Object.defineProperty(exports, "saveSessionStore", {
	enumerable: true,
	get: function() {
		return saveSessionStore;
	}
});
Object.defineProperty(exports, "setSessionRuntimeModel", {
	enumerable: true,
	get: function() {
		return setSessionRuntimeModel;
	}
});
Object.defineProperty(exports, "shouldPreserveMaintenanceEntry", {
	enumerable: true,
	get: function() {
		return shouldPreserveMaintenanceEntry;
	}
});
Object.defineProperty(exports, "shouldRunModelRunPrune", {
	enumerable: true,
	get: function() {
		return shouldRunModelRunPrune;
	}
});
Object.defineProperty(exports, "shouldRunSessionEntryMaintenance", {
	enumerable: true,
	get: function() {
		return shouldRunSessionEntryMaintenance;
	}
});
Object.defineProperty(exports, "updateSessionStore", {
	enumerable: true,
	get: function() {
		return updateSessionStore;
	}
});
