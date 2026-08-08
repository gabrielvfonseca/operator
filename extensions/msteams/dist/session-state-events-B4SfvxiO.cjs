const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_heartbeat_wake = require("./heartbeat-wake-E8hls_pf.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
//#region src/sessions/session-state-event-kinds.ts
const NOTIFY_BY_SESSION_STATE_EVENT_KIND = {
	human_direct_message: true,
	upstream_missing: true,
	adopted: false,
	goal_changed: true,
	run_completed: false,
	run_failed: false,
	child_spawned: false,
	compacted: false
};
//#endregion
//#region src/sessions/session-state-notices.ts
/** Stale-state notice text, coalescing keys, and watcher eligibility. */
const SESSION_STATE_CONTEXT_PREFIX = "session-state:";
function encodeNoticeTarget(sessionKey) {
	return Buffer.from(sessionKey, "utf8").toString("hex");
}
function decodeSessionStateNoticeContextKey(contextKey) {
	if (!contextKey.startsWith(SESSION_STATE_CONTEXT_PREFIX)) return;
	const encoded = contextKey.slice(14);
	if (!encoded || encoded.length % 2 !== 0 || !/^[0-9a-f]+$/.test(encoded)) return;
	return Buffer.from(encoded, "hex").toString("utf8");
}
function sessionStateNoticeText(targetSessionKey, lastSeenSequence) {
	return `Session "${targetSessionKey}" changed (other actor). Reconcile before acting: session_status sessionKey "${targetSessionKey}" changesSince ${lastSeenSequence}.`;
}
function shouldWakeWatcher(watcherSessionKey) {
	return !require_session_key.isSubagentSessionKey(watcherSessionKey);
}
function isNotifiableWatcherKey(watcherSessionKey) {
	return require_session_key.parseAgentSessionKey(watcherSessionKey) != null;
}
function enqueueSessionStateNotice(params) {
	require_system_events.enqueueSystemEvent(sessionStateNoticeText(params.targetSessionKey, params.lastSeenSequence), {
		sessionKey: params.watcherSessionKey,
		contextKey: `${SESSION_STATE_CONTEXT_PREFIX}${encodeNoticeTarget(params.targetSessionKey)}`
	});
	if (!shouldWakeWatcher(params.watcherSessionKey)) return;
	require_heartbeat_wake.requestHeartbeat({
		source: "session-state",
		intent: "immediate",
		reason: `session-state:${params.targetSessionKey}`,
		sessionKey: params.watcherSessionKey
	});
}
//#endregion
//#region src/sessions/session-upstream-links.ts
const log$1 = require_subsystem.createSubsystemLogger("sessions/upstream-links");
function getSessionUpstreamKysely(db) {
	return require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
}
function parseJson(value) {
	if (value === null) return null;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}
function rowToSessionUpstreamLink(row) {
	return {
		sessionKey: row.session_key,
		agentId: row.agent_id,
		catalogId: row.catalog_id,
		hostId: row.host_id,
		threadId: row.thread_id,
		upstreamKind: row.upstream_kind,
		upstreamRef: parseJson(row.upstream_ref_json),
		marker: parseJson(row.last_marker_json),
		...row.last_scanned_at === null ? {} : { lastScannedAt: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.last_scanned_at) ?? 0 },
		createdAt: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.created_at) ?? 0,
		updatedAt: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.updated_at) ?? 0
	};
}
function upsertSessionUpstreamLink(input, options = {}) {
	const now = options.now ?? Date.now();
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionUpstreamKysely(db).insertInto("session_upstream_links").values({
				session_key: input.sessionKey,
				agent_id: input.agentId,
				catalog_id: input.catalogId,
				host_id: input.hostId,
				thread_id: input.threadId,
				upstream_kind: input.upstreamKind,
				upstream_ref_json: JSON.stringify(input.upstreamRef),
				last_marker_json: JSON.stringify(input.marker),
				last_scanned_at: null,
				created_at: now,
				updated_at: now
			}).onConflict((conflict) => conflict.columns(["session_key", "agent_id"]).doUpdateSet((eb) => {
				const sourceChanged = eb.or([
					eb("session_upstream_links.thread_id", "!=", eb.ref("excluded.thread_id")),
					eb("session_upstream_links.host_id", "!=", eb.ref("excluded.host_id")),
					eb("session_upstream_links.upstream_kind", "!=", eb.ref("excluded.upstream_kind")),
					eb("session_upstream_links.upstream_ref_json", "!=", eb.ref("excluded.upstream_ref_json"))
				]);
				return {
					agent_id: input.agentId,
					catalog_id: input.catalogId,
					host_id: input.hostId,
					thread_id: input.threadId,
					upstream_kind: input.upstreamKind,
					upstream_ref_json: JSON.stringify(input.upstreamRef),
					last_marker_json: eb.case().when(sourceChanged).then(JSON.stringify(input.marker)).else(eb.ref("session_upstream_links.last_marker_json")).end(),
					last_scanned_at: eb.case().when(sourceChanged).then(null).else(eb.ref("session_upstream_links.last_scanned_at")).end(),
					updated_at: now
				};
			})));
		}, options);
	} catch (error) {
		log$1.warn(`failed to upsert session upstream link: ${String(error)}`);
	}
}
function readSessionUpstreamLink(sessionKey, agentId, options = {}) {
	try {
		const { db } = require_openclaw_state_db.openOperatorStateDatabase(options);
		const row = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionUpstreamKysely(db).selectFrom("session_upstream_links").selectAll().where("session_key", "=", sessionKey).where("agent_id", "=", agentId)).rows[0];
		return row ? rowToSessionUpstreamLink(row) : void 0;
	} catch (error) {
		log$1.warn(`failed to read session upstream link: ${String(error)}`);
		return;
	}
}
function updateSessionUpstreamLinkMarker(sessionKey, agentId, marker, options = {}) {
	const now = options.now ?? Date.now();
	try {
		let updated = false;
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			let query = getSessionUpstreamKysely(db).updateTable("session_upstream_links").set({
				last_marker_json: JSON.stringify(marker),
				last_scanned_at: now,
				updated_at: now
			}).where("session_key", "=", sessionKey).where("agent_id", "=", agentId);
			if (options.expectedUpdatedAt !== void 0) query = query.where("updated_at", "=", options.expectedUpdatedAt);
			updated = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, query).numAffectedRows === 1n;
		}, options);
		return updated;
	} catch (error) {
		log$1.warn(`failed to update session upstream marker: ${String(error)}`);
		return false;
	}
}
function deleteSessionUpstreamLink(sessionKey, agentId, options = {}) {
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionUpstreamKysely(db).deleteFrom("session_upstream_links").where("session_key", "=", sessionKey).where("agent_id", "=", agentId));
		}, options);
	} catch (error) {
		log$1.warn(`failed to delete session upstream link: ${String(error)}`);
	}
}
function listWatchedSessionUpstreamLinks(options = {}) {
	const grouped = /* @__PURE__ */ new Map();
	try {
		const { db } = require_openclaw_state_db.openOperatorStateDatabase(options);
		const links = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionUpstreamKysely(db).selectFrom("session_upstream_links as links").innerJoin("session_watch_cursors as cursors", "cursors.target_session_key", "links.session_key").selectAll("links").distinct().orderBy("links.catalog_id", "asc").orderBy("links.session_key", "asc")).rows.map(rowToSessionUpstreamLink);
		const keyCounts = /* @__PURE__ */ new Map();
		for (const link of links) keyCounts.set(link.sessionKey, (keyCounts.get(link.sessionKey) ?? 0) + 1);
		for (const link of links) {
			if ((keyCounts.get(link.sessionKey) ?? 0) > 1) {
				log$1.warn(`skipping ambiguous upstream links for ${link.sessionKey}: multiple agents adopt the same key`);
				continue;
			}
			const catalogLinks = grouped.get(link.catalogId) ?? [];
			catalogLinks.push(link);
			grouped.set(link.catalogId, catalogLinks);
		}
	} catch (error) {
		log$1.warn(`failed to list watched session upstream links: ${String(error)}`);
	}
	return grouped;
}
//#endregion
//#region src/sessions/session-state-events.ts
const SESSION_STATE_RETENTION_MS = 720 * 60 * 6e4;
const SESSION_STATE_MAX_ROWS = 5e4;
const SESSION_STATE_PRUNE_INTERVAL_MS = 60 * 6e4;
const log = require_subsystem.createSubsystemLogger("sessions/state-events");
let lastPruneAt = 0;
function getSessionStateKysely(db) {
	return require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
}
function normalizeOptionalSqliteNumber(value) {
	return value === void 0 ? void 0 : require_state_migrations_cron_run_logs.normalizeSqliteNumber(value);
}
function parsePayload(value) {
	if (!value) return;
	try {
		const parsed = JSON.parse(value);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
function rowToSessionStateEvent(row) {
	const payload = parsePayload(row.payload_json);
	return {
		sequence: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.sequence) ?? 0,
		sessionKey: row.session_key,
		...row.session_id ? { sessionId: row.session_id } : {},
		agentId: row.agent_id,
		kind: row.kind,
		actorType: row.actor_type,
		...row.actor_id ? { actorId: row.actor_id } : {},
		...row.run_id ? { runId: row.run_id } : {},
		occurredAt: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.occurred_at) ?? 0,
		summary: row.summary,
		...payload ? { payload } : {}
	};
}
function bindSessionStateEvent(input, occurredAt) {
	return {
		dedupe_key: input.dedupeKey ?? null,
		session_key: input.sessionKey,
		session_id: input.sessionId ?? null,
		agent_id: input.agentId,
		kind: input.kind,
		actor_type: input.actorType,
		actor_id: input.actorId ?? null,
		run_id: input.runId ?? null,
		occurred_at: occurredAt,
		summary: input.summary,
		payload_json: input.payload ? JSON.stringify(input.payload) : null
	};
}
function readCursor(db, watcherSessionKey, targetSessionKey) {
	return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, getSessionStateKysely(db).selectFrom("session_watch_cursors").selectAll().where("watcher_session_key", "=", watcherSessionKey).where("target_session_key", "=", targetSessionKey));
}
function upsertSeedCursor(params) {
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(params.db, getSessionStateKysely(params.db).insertInto("session_watch_cursors").values({
		watcher_session_key: params.watcherSessionKey,
		target_session_key: params.targetSessionKey,
		last_seen_sequence: params.sequence,
		notified_sequence: params.sequence,
		material_sequence: params.sequence,
		updated_at: params.now
	}).onConflict((conflict) => conflict.columns(["watcher_session_key", "target_session_key"]).doUpdateSet({
		last_seen_sequence: params.sequence,
		notified_sequence: params.sequence,
		material_sequence: params.sequence,
		updated_at: params.now
	})));
}
function updateMaterialCursor(params) {
	const current = readCursor(params.db, params.watcherSessionKey, params.targetSessionKey);
	const lastSeen = normalizeOptionalSqliteNumber(current?.last_seen_sequence) ?? 0;
	const notified = normalizeOptionalSqliteNumber(current?.notified_sequence) ?? 0;
	const frozenNotified = notified === lastSeen ? params.sequence : notified;
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(params.db, getSessionStateKysely(params.db).insertInto("session_watch_cursors").values({
		watcher_session_key: params.watcherSessionKey,
		target_session_key: params.targetSessionKey,
		last_seen_sequence: lastSeen,
		notified_sequence: frozenNotified,
		material_sequence: params.sequence,
		updated_at: params.now
	}).onConflict((conflict) => conflict.columns(["watcher_session_key", "target_session_key"]).doUpdateSet({
		notified_sequence: frozenNotified,
		material_sequence: params.sequence,
		updated_at: params.now
	})));
	return lastSeen;
}
/** Classify the actor once at producer boundaries; missing provenance is interactive human input. */
function classifySessionStateActor(opts) {
	if (opts.inputProvenance?.kind === "inter_session") return {
		actorType: "agent",
		...opts.inputProvenance.sourceSessionKey ? { actorId: opts.inputProvenance.sourceSessionKey } : {}
	};
	if (opts.inputProvenance?.kind === "internal_system" || (opts.internalEvents?.length ?? 0) > 0 || opts.sessionEffects === "internal") return { actorType: "system" };
	return {
		actorType: "human",
		...opts.humanActorId ? { actorId: opts.humanActorId } : {}
	};
}
/** Append a signal-log event without allowing signaling failure to fail the originating action. */
const SESSION_STATE_OCCURRED_AT_MAX_SKEW_MS = 1440 * 6e4;
function clampSessionStateOccurredAt(value, now) {
	if (typeof value !== "number" || !Number.isFinite(value)) return now;
	return Math.min(Math.max(value, now - SESSION_STATE_OCCURRED_AT_MAX_SKEW_MS), now);
}
function recordSessionStateEvent(input, options = {}) {
	const now = options.now ?? Date.now();
	const occurredAt = clampSessionStateOccurredAt(input.occurredAt, now);
	const notices = [];
	try {
		const event = require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const insert = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionStateKysely(db).insertInto("session_state_events").values(bindSessionStateEvent(input, occurredAt)).onConflict((conflict) => conflict.column("dedupe_key").doNothing()));
			const insertedSequence = insert.insertId ? Number(insert.insertId) : void 0;
			if (insertedSequence === void 0) {
				if (!input.dedupeKey) return;
				const existing = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, getSessionStateKysely(db).selectFrom("session_state_events").selectAll().where("dedupe_key", "=", input.dedupeKey));
				return existing ? rowToSessionStateEvent(existing) : void 0;
			}
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionStateKysely(db).insertInto("session_state_heads").values({
				session_key: input.sessionKey,
				agent_id: input.agentId,
				last_sequence: insertedSequence,
				updated_at: now
			}).onConflict((conflict) => conflict.columns(["session_key", "agent_id"]).doUpdateSet({
				last_sequence: insertedSequence,
				updated_at: now
			})));
			const registeredWatcherKeys = NOTIFY_BY_SESSION_STATE_EVENT_KIND[input.kind] ? require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionStateKysely(db).selectFrom("session_watch_cursors").select("watcher_session_key").where("target_session_key", "=", input.sessionKey)).rows.map((row) => row.watcher_session_key) : [];
			const watcherSessionKeys = [.../* @__PURE__ */ new Set([...input.watcherSessionKeys ?? [], ...registeredWatcherKeys])].filter((key) => Boolean(key) && isNotifiableWatcherKey(key));
			for (const watcherSessionKey of watcherSessionKeys) {
				if (input.kind === "child_spawned") {
					upsertSeedCursor({
						db,
						watcherSessionKey,
						targetSessionKey: input.sessionKey,
						sequence: insertedSequence,
						now
					});
					continue;
				}
				if (!NOTIFY_BY_SESSION_STATE_EVENT_KIND[input.kind] || input.actorId === watcherSessionKey) continue;
				const lastSeenSequence = updateMaterialCursor({
					db,
					watcherSessionKey,
					targetSessionKey: input.sessionKey,
					sequence: insertedSequence,
					now
				});
				notices.push({
					watcherSessionKey,
					targetSessionKey: input.sessionKey,
					lastSeenSequence
				});
			}
			const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, getSessionStateKysely(db).selectFrom("session_state_events").selectAll().where("sequence", "=", insertedSequence));
			return row ? rowToSessionStateEvent(row) : void 0;
		}, options);
		for (const notice of notices) enqueueSessionStateNotice(notice);
		if (now - lastPruneAt > SESSION_STATE_PRUNE_INTERVAL_MS) pruneSessionStateEvents({
			...options,
			now
		});
		return event;
	} catch (error) {
		log.warn(`failed to record session state event: ${String(error)}`);
		return;
	}
}
/** Return the durable signal-log head for one session; degrades to 0 on read failure. */
function getSessionStateVersion(sessionKey, agentId, options = {}) {
	try {
		const { db } = require_openclaw_state_db.openOperatorStateDatabase(options);
		return normalizeOptionalSqliteNumber(require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, getSessionStateKysely(db).selectFrom("session_state_heads").select("last_sequence").where("session_key", "=", sessionKey).where("agent_id", "=", agentId))?.last_sequence) ?? 0;
	} catch (error) {
		log.warn(`failed to read session state version: ${String(error)}`);
		return 0;
	}
}
/** Batch durable signal-log heads for session-list enrichment, keyed agent → session key. */
function getSessionStateVersions(refs, options = {}) {
	const keys = [...new Set(refs.map((ref) => ref.sessionKey).filter(Boolean))];
	if (keys.length === 0) return {};
	const byAgent = {};
	try {
		const { db } = require_openclaw_state_db.openOperatorStateDatabase(options);
		for (let offset = 0; offset < keys.length; offset += 500) {
			const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionStateKysely(db).selectFrom("session_state_heads").select([
				"session_key",
				"agent_id",
				"last_sequence"
			]).where("session_key", "in", keys.slice(offset, offset + 500))).rows;
			for (const row of rows) (byAgent[row.agent_id] ??= {})[row.session_key] = require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.last_sequence) ?? 0;
		}
	} catch (error) {
		log.warn(`failed to read session state versions: ${String(error)}`);
	}
	return byAgent;
}
/** List retained signal-log events after a version without advancing watcher cursors. */
function listSessionStateEventsSince(sessionKey, agentId, afterSequence, limit = 200, options = {}) {
	try {
		const boundedLimit = Math.max(1, Math.min(200, Math.floor(limit)));
		const { db } = require_openclaw_state_db.openOperatorStateDatabase(options);
		const kysely = getSessionStateKysely(db);
		const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.selectFrom("session_state_events").selectAll().where("session_key", "=", sessionKey).where("agent_id", "=", agentId).where("sequence", ">", afterSequence).orderBy("sequence", "asc").limit(boundedLimit + 1)).rows;
		const earliest = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, kysely.selectFrom("session_state_events").select((eb) => eb.fn.min("sequence").as("sequence")).where("session_key", "=", sessionKey).where("agent_id", "=", agentId));
		const headRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, kysely.selectFrom("session_state_heads").select(["last_sequence", "pruned_max_sequence"]).where("session_key", "=", sessionKey).where("agent_id", "=", agentId));
		const head = normalizeOptionalSqliteNumber(headRow?.last_sequence) ?? 0;
		const prunedMax = normalizeOptionalSqliteNumber(headRow?.pruned_max_sequence) ?? 0;
		const earliestAvailableSequence = normalizeOptionalSqliteNumber(earliest?.sequence) ?? (head > 0 ? head + 1 : 0);
		return {
			events: rows.slice(0, boundedLimit).map(rowToSessionStateEvent),
			truncated: rows.length > boundedLimit,
			earliestAvailableSequence,
			historyGap: afterSequence < prunedMax
		};
	} catch (error) {
		log.warn(`failed to list session state events: ${String(error)}`);
		return {
			events: [],
			truncated: false,
			earliestAvailableSequence: 0,
			historyGap: false
		};
	}
}
/** Ack only the frozen notice watermark; advancing to head would lose an interleaved event. */
function acknowledgeSessionStateNotices(watcherSessionKey, targetSessionKeys, options = {}) {
	const now = options.now ?? Date.now();
	const followups = [];
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			for (const targetSessionKey of new Set(targetSessionKeys)) {
				const row = readCursor(db, watcherSessionKey, targetSessionKey);
				if (!row) continue;
				const notified = require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.notified_sequence) ?? 0;
				const material = require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.material_sequence) ?? 0;
				const nextNotified = material > notified ? material : notified;
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionStateKysely(db).updateTable("session_watch_cursors").set({
					last_seen_sequence: notified,
					notified_sequence: nextNotified,
					updated_at: now
				}).where("watcher_session_key", "=", watcherSessionKey).where("target_session_key", "=", targetSessionKey));
				if (material > notified) followups.push({
					watcherSessionKey,
					targetSessionKey,
					lastSeenSequence: notified
				});
			}
		}, options);
		for (const followup of followups) enqueueSessionStateNotice(followup);
	} catch (error) {
		log.warn(`failed to acknowledge session state notices: ${String(error)}`);
	}
}
/** Reset parent-side assumptions while retaining target history across session incarnations. */
function handleSessionStateSessionReset(sessionKey, options = {}) {
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionStateKysely(db).deleteFrom("session_watch_cursors").where("watcher_session_key", "=", sessionKey));
		}, options);
	} catch (error) {
		log.warn(`failed to reset session state cursors: ${String(error)}`);
	}
}
/** Delete all signal-log and cursor state owned by a deleted session key. */
function handleSessionStateSessionDeleted(sessionKey, agentId, options = {}) {
	deleteSessionUpstreamLink(sessionKey, agentId, options);
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const kysely = getSessionStateKysely(db);
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("session_state_events").where("session_key", "=", sessionKey).where("agent_id", "=", agentId));
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("session_state_heads").where("session_key", "=", sessionKey).where("agent_id", "=", agentId));
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("session_watch_cursors").where((eb) => eb.or([eb("watcher_session_key", "=", sessionKey), eb("target_session_key", "=", sessionKey)])));
		}, options);
	} catch (error) {
		log.warn(`failed to delete session state history: ${String(error)}`);
	}
}
function sessionExists(sessionKey, env) {
	try {
		return Boolean(require_session_accessor.loadSessionEntry({
			sessionKey,
			clone: false,
			env
		}));
	} catch {
		return false;
	}
}
/** Re-materialize pending notices after the in-memory queue is lost on restart. */
function sweepSessionStateWatchNotices(options = {}) {
	const now = options.now ?? Date.now();
	try {
		const { db } = require_openclaw_state_db.openOperatorStateDatabase(options);
		const pendingRows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSessionStateKysely(db).selectFrom("session_watch_cursors").selectAll().whereRef("material_sequence", ">", "last_seen_sequence")).rows.filter((row) => sessionExists(row.watcher_session_key, options.env));
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db: writeDb }) => {
			for (const row of pendingRows) require_state_migrations_cron_run_logs.executeSqliteQuerySync(writeDb, getSessionStateKysely(writeDb).updateTable("session_watch_cursors").set({
				notified_sequence: row.material_sequence,
				updated_at: now
			}).where("watcher_session_key", "=", row.watcher_session_key).where("target_session_key", "=", row.target_session_key));
		}, options);
		for (const row of pendingRows) enqueueSessionStateNotice({
			watcherSessionKey: row.watcher_session_key,
			targetSessionKey: row.target_session_key,
			lastSeenSequence: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.last_seen_sequence) ?? 0
		});
		pruneSessionStateEvents({
			...options,
			now
		});
	} catch (error) {
		log.warn(`failed to sweep session state notices: ${String(error)}`);
	}
}
/** Enforce bounded retained history without regressing durable per-session heads. */
function pruneSessionStateEvents(options = {}) {
	const now = options.now ?? Date.now();
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const kysely = getSessionStateKysely(db);
			const stampPrunedWatermarks = (predicate) => {
				let query = kysely.selectFrom("session_state_events").select(["session_key", "agent_id"]).select((eb) => eb.fn.max("sequence").as("max_sequence")).groupBy(["session_key", "agent_id"]);
				if (predicate.occurredBefore !== void 0) query = query.where("occurred_at", "<", predicate.occurredBefore);
				if (predicate.sequenceAtOrBelow !== void 0) query = query.where("sequence", "<=", predicate.sequenceAtOrBelow);
				for (const row of require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, query).rows) {
					const maxSequence = require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.max_sequence) ?? 0;
					require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.updateTable("session_state_heads").set({
						pruned_max_sequence: maxSequence,
						updated_at: now
					}).where("session_key", "=", row.session_key).where("agent_id", "=", row.agent_id).where("pruned_max_sequence", "<", maxSequence));
				}
			};
			const retentionCutoff = now - SESSION_STATE_RETENTION_MS;
			stampPrunedWatermarks({ occurredBefore: retentionCutoff });
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("session_state_events").where("occurred_at", "<", retentionCutoff));
			const sequenceCutoff = normalizeOptionalSqliteNumber(require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, kysely.selectFrom("session_state_events").select("sequence").orderBy("sequence", "desc").offset(SESSION_STATE_MAX_ROWS).limit(1))?.sequence);
			if (sequenceCutoff !== void 0) {
				stampPrunedWatermarks({ sequenceAtOrBelow: sequenceCutoff });
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("session_state_events").where("sequence", "<=", sequenceCutoff));
			}
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("session_watch_cursors").where("updated_at", "<", now - SESSION_STATE_RETENTION_MS));
		}, options);
		lastPruneAt = now;
	} catch (error) {
		log.warn(`failed to prune session state history: ${String(error)}`);
	}
}
/** Record one successful compaction from the two concrete v1 owners. */
function recordSessionCompacted(params) {
	if (!params.sessionKey) return;
	recordSessionStateEvent({
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		agentId: params.agentId ?? require_session_key.resolveAgentIdFromSessionKey(params.sessionKey),
		kind: "compacted",
		actorType: "system",
		runId: params.runId,
		dedupeKey: `compacted:${params.operationId}`,
		summary: "session compacted"
	});
}
/** Record a persisted goal mutation using lineage already available at the session-store seam. */
function recordSessionGoalChanged(params) {
	const watcherSessionKey = params.entry.spawnedBy ?? params.entry.parentSessionKey;
	recordSessionStateEvent({
		sessionKey: params.sessionKey,
		sessionId: params.entry.sessionId,
		agentId: params.agentId ?? require_session_key.resolveAgentIdFromSessionKey(params.sessionKey),
		kind: "goal_changed",
		actorType: params.actor?.type ?? "system",
		...params.actor?.id ? { actorId: params.actor.id } : {},
		summary: params.summary,
		...watcherSessionKey ? { watcherSessionKeys: [watcherSessionKey] } : {}
	});
}
/** True when any seeded or explicitly registered watcher cursor targets this session. */
function hasSessionStateWatchers(targetSessionKey, options = {}) {
	try {
		const { db } = require_openclaw_state_db.openOperatorStateDatabase(options);
		return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, getSessionStateKysely(db).selectFrom("session_watch_cursors").select("watcher_session_key").where("target_session_key", "=", targetSessionKey).limit(1)) !== void 0;
	} catch (error) {
		log.warn(`failed to probe session state watchers: ${String(error)}`);
		return false;
	}
}
/** Register an explicit watcher (e.g. a sessions_send coordinator) for a target session. */
function registerSessionStateWatch(params, options = {}) {
	if (params.watcherSessionKey === params.targetSessionKey || !isNotifiableWatcherKey(params.watcherSessionKey)) return false;
	const now = options.now ?? Date.now();
	try {
		let registered = false;
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			if (readCursor(db, params.watcherSessionKey, params.targetSessionKey)) {
				registered = true;
				return;
			}
			const agentId = params.targetAgentId ?? require_session_key.resolveAgentIdFromSessionKey(params.targetSessionKey);
			const head = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, getSessionStateKysely(db).selectFrom("session_state_heads").select("last_sequence").where("session_key", "=", params.targetSessionKey).where("agent_id", "=", agentId));
			upsertSeedCursor({
				db,
				watcherSessionKey: params.watcherSessionKey,
				targetSessionKey: params.targetSessionKey,
				sequence: normalizeOptionalSqliteNumber(head?.last_sequence) ?? 0,
				now
			});
			registered = true;
		}, options);
		return registered;
	} catch (error) {
		log.warn(`failed to register session state watch: ${String(error)}`);
		return false;
	}
}
function recordSessionHumanDirectMessage(params, options = {}) {
	const watcherSessionKey = params.entry?.spawnedBy ?? params.entry?.parentSessionKey;
	if (params.actor.actorType !== "human") return;
	if (!watcherSessionKey && !hasSessionStateWatchers(params.sessionKey, options)) return;
	return recordSessionStateEvent({
		sessionKey: params.sessionKey,
		sessionId: params.entry?.sessionId,
		agentId: params.agentId ?? require_session_key.resolveAgentIdFromSessionKey(params.sessionKey),
		kind: "human_direct_message",
		actorType: "human",
		...params.actor.actorId ? { actorId: params.actor.actorId } : {},
		runId: params.runId,
		...params.dedupeKey ? { dedupeKey: params.dedupeKey } : {},
		summary: `human message via ${params.channel?.trim() || "unknown"}`,
		payload: params.payload,
		...params.occurredAt === void 0 ? {} : { occurredAt: params.occurredAt },
		...watcherSessionKey ? { watcherSessionKeys: [watcherSessionKey] } : {}
	}, options);
}
/** Seed the parent cursor at the child-spawn version. */
function recordSubagentSpawned(params) {
	recordSessionStateEvent({
		sessionKey: params.childSessionKey,
		agentId: params.agentId,
		kind: "child_spawned",
		actorType: "agent",
		actorId: params.requesterSessionKey,
		runId: params.childRunId,
		dedupeKey: `child-spawned:${params.childRunId}`,
		summary: "child session spawned",
		watcherSessionKeys: [params.requesterSessionKey]
	});
}
const SUBAGENT_TERMINAL_SUMMARY = {
	ok: "child run completed",
	error: "child run failed",
	timeout: "child run timed out",
	cancelled: "child run cancelled"
};
/** Project an already-normalized subagent terminal outcome into the signal log. */
function recordSubagentTerminalState(params) {
	recordSessionStateEvent({
		sessionKey: params.childSessionKey,
		agentId: require_session_key.resolveAgentIdFromSessionKey(params.childSessionKey),
		kind: params.outcomeStatus === "ok" ? "run_completed" : "run_failed",
		actorType: "system",
		runId: params.runId,
		dedupeKey: `run-terminal:${params.runId}`,
		summary: SUBAGENT_TERMINAL_SUMMARY[params.outcomeStatus],
		...params.outcomeStatus === "ok" ? {} : { payload: { outcome: params.outcomeStatus } },
		watcherSessionKeys: [params.requesterSessionKey]
	});
}
//#endregion
Object.defineProperty(exports, "acknowledgeSessionStateNotices", {
	enumerable: true,
	get: function() {
		return acknowledgeSessionStateNotices;
	}
});
Object.defineProperty(exports, "classifySessionStateActor", {
	enumerable: true,
	get: function() {
		return classifySessionStateActor;
	}
});
Object.defineProperty(exports, "decodeSessionStateNoticeContextKey", {
	enumerable: true,
	get: function() {
		return decodeSessionStateNoticeContextKey;
	}
});
Object.defineProperty(exports, "deleteSessionUpstreamLink", {
	enumerable: true,
	get: function() {
		return deleteSessionUpstreamLink;
	}
});
Object.defineProperty(exports, "getSessionStateVersion", {
	enumerable: true,
	get: function() {
		return getSessionStateVersion;
	}
});
Object.defineProperty(exports, "getSessionStateVersions", {
	enumerable: true,
	get: function() {
		return getSessionStateVersions;
	}
});
Object.defineProperty(exports, "handleSessionStateSessionDeleted", {
	enumerable: true,
	get: function() {
		return handleSessionStateSessionDeleted;
	}
});
Object.defineProperty(exports, "handleSessionStateSessionReset", {
	enumerable: true,
	get: function() {
		return handleSessionStateSessionReset;
	}
});
Object.defineProperty(exports, "listSessionStateEventsSince", {
	enumerable: true,
	get: function() {
		return listSessionStateEventsSince;
	}
});
Object.defineProperty(exports, "listWatchedSessionUpstreamLinks", {
	enumerable: true,
	get: function() {
		return listWatchedSessionUpstreamLinks;
	}
});
Object.defineProperty(exports, "readSessionUpstreamLink", {
	enumerable: true,
	get: function() {
		return readSessionUpstreamLink;
	}
});
Object.defineProperty(exports, "recordSessionCompacted", {
	enumerable: true,
	get: function() {
		return recordSessionCompacted;
	}
});
Object.defineProperty(exports, "recordSessionGoalChanged", {
	enumerable: true,
	get: function() {
		return recordSessionGoalChanged;
	}
});
Object.defineProperty(exports, "recordSessionHumanDirectMessage", {
	enumerable: true,
	get: function() {
		return recordSessionHumanDirectMessage;
	}
});
Object.defineProperty(exports, "recordSessionStateEvent", {
	enumerable: true,
	get: function() {
		return recordSessionStateEvent;
	}
});
Object.defineProperty(exports, "recordSubagentSpawned", {
	enumerable: true,
	get: function() {
		return recordSubagentSpawned;
	}
});
Object.defineProperty(exports, "recordSubagentTerminalState", {
	enumerable: true,
	get: function() {
		return recordSubagentTerminalState;
	}
});
Object.defineProperty(exports, "registerSessionStateWatch", {
	enumerable: true,
	get: function() {
		return registerSessionStateWatch;
	}
});
Object.defineProperty(exports, "sweepSessionStateWatchNotices", {
	enumerable: true,
	get: function() {
		return sweepSessionStateWatchNotices;
	}
});
Object.defineProperty(exports, "updateSessionUpstreamLinkMarker", {
	enumerable: true,
	get: function() {
		return updateSessionUpstreamLinkMarker;
	}
});
Object.defineProperty(exports, "upsertSessionUpstreamLink", {
	enumerable: true,
	get: function() {
		return upsertSessionUpstreamLink;
	}
});
