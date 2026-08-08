require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/plugins/pairing.ts
function getPairingAdapter(channelId) {
	return require_registry.getChannelPlugin(channelId)?.pairing ?? null;
}
//#endregion
//#region src/pairing/pairing-store-keys.ts
function describePairingKeyInput(value) {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed ? `string length ${trimmed.length}` : "empty string";
	}
	if (typeof value === "number" && !Number.isFinite(value)) return "non-finite number";
	return typeof value;
}
function invalidPairingKeyError(kind, reason, value) {
	return /* @__PURE__ */ new Error(`invalid pairing ${kind}: ${reason}; got ${describePairingKeyInput(value)}`);
}
function normalizePairingKey(value, kind) {
	if (typeof value !== "string") throw invalidPairingKeyError(kind, "expected non-empty string", value);
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
	if (!raw) throw invalidPairingKeyError(kind, "expected non-empty string", value);
	const safe = raw.replace(/[\\/:*?"<>|]/g, "_").replace(/\.\./g, "_");
	if (!safe || safe === "_") throw invalidPairingKeyError(kind, "sanitized key is empty", value);
	return safe;
}
function safeChannelKey(channel) {
	return normalizePairingKey(channel, "channel");
}
function safeAccountKey(accountId) {
	return normalizePairingKey(accountId, "account id");
}
function dedupePreserveOrder(entries) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(entries);
}
function resolveAllowFromAccountId(accountId) {
	if (accountId != null && typeof accountId !== "string") throw invalidPairingKeyError("account id", "expected non-empty string", accountId);
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(accountId) || "default";
}
//#endregion
//#region src/pairing/pairing-store-sqlite.ts
function parseTimestamp(value) {
	if (!value) return null;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : null;
}
function normalizePersistedPairingMeta(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const out = {};
	for (const [key, entry] of Object.entries(value)) {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry);
		if (normalized) out[key] = normalized;
	}
	return Object.keys(out).length > 0 ? out : void 0;
}
function normalizePersistedPairingRequest(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.id);
	const code = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.code);
	const createdAt = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.createdAt);
	const lastSeenAt = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.lastSeenAt) ?? createdAt;
	if (!id || !code || !createdAt || !lastSeenAt || parseTimestamp(createdAt) === null || parseTimestamp(lastSeenAt) === null) return;
	const meta = normalizePersistedPairingMeta(value.meta);
	return {
		id,
		code,
		createdAt,
		lastSeenAt,
		...meta ? { meta } : {}
	};
}
function resolvePairingRequestAccountId(entry) {
	return resolveAllowFromAccountId(entry.meta?.accountId) || "default";
}
function sqliteOptionsForEnv(env) {
	return { env };
}
function readChannelPairingStateFromDatabase(database, channel) {
	const db = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	const channelKey = safeChannelKey(channel);
	const requestRows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("channel_pairing_requests").selectAll().where("channel_key", "=", channelKey).orderBy("created_at", "asc").orderBy("account_id", "asc").orderBy("request_id", "asc")).rows;
	const allowRows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("channel_pairing_allow_entries").selectAll().where("channel_key", "=", channelKey).orderBy("account_id", "asc").orderBy("sort_order", "asc").orderBy("entry", "asc")).rows;
	const allowFrom = {};
	for (const row of allowRows) {
		const accountId = resolveAllowFromAccountId(row.account_id);
		(allowFrom[accountId] ??= []).push(row.entry);
	}
	return {
		version: 1,
		requests: requestRows.flatMap((row) => {
			let meta;
			if (row.meta_json) try {
				meta = normalizePersistedPairingMeta(JSON.parse(row.meta_json));
			} catch {
				meta = void 0;
			}
			meta = {
				...meta,
				accountId: resolveAllowFromAccountId(row.account_id)
			};
			const request = normalizePersistedPairingRequest({
				id: row.request_id,
				code: row.code,
				createdAt: row.created_at,
				lastSeenAt: row.last_seen_at,
				meta
			});
			return request ? [request] : [];
		}),
		allowFrom
	};
}
function readChannelPairingState(channel, env) {
	return readChannelPairingStateFromDatabase(require_openclaw_state_db.openOperatorStateDatabase(sqliteOptionsForEnv(env)), channel);
}
function writeChannelPairingStateToDatabase(database, channel, state) {
	const db = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	const channelKey = safeChannelKey(channel);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.deleteFrom("channel_pairing_requests").where("channel_key", "=", channelKey));
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.deleteFrom("channel_pairing_allow_entries").where("channel_key", "=", channelKey));
	for (const request of state.requests) {
		const normalized = normalizePersistedPairingRequest(request);
		if (!normalized) continue;
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("channel_pairing_requests").values({
			channel_key: channelKey,
			account_id: resolvePairingRequestAccountId(normalized),
			request_id: normalized.id,
			code: normalized.code,
			created_at: normalized.createdAt,
			last_seen_at: normalized.lastSeenAt,
			meta_json: normalized.meta ? JSON.stringify(normalized.meta) : null
		}));
	}
	const updatedAt = Date.now();
	for (const [accountId, entries] of Object.entries(state.allowFrom ?? {})) {
		const normalizedEntries = dedupePreserveOrder(entries.map((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry) ?? "").filter((entry) => entry && entry !== "*"));
		for (const [sortOrder, entry] of normalizedEntries.entries()) require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("channel_pairing_allow_entries").values({
			channel_key: channelKey,
			account_id: resolveAllowFromAccountId(accountId),
			entry,
			sort_order: sortOrder,
			updated_at: updatedAt
		}));
	}
}
function updateChannelPairingStateSnapshot(channel, env, update) {
	return require_openclaw_state_db.runOperatorStateWriteTransaction((database) => {
		const state = readChannelPairingStateFromDatabase(database, channel);
		const result = update(state);
		writeChannelPairingStateToDatabase(database, channel, state);
		return result;
	}, sqliteOptionsForEnv(env));
}
//#endregion
Object.defineProperty(exports, "dedupePreserveOrder", {
	enumerable: true,
	get: function() {
		return dedupePreserveOrder;
	}
});
Object.defineProperty(exports, "getPairingAdapter", {
	enumerable: true,
	get: function() {
		return getPairingAdapter;
	}
});
Object.defineProperty(exports, "readChannelPairingState", {
	enumerable: true,
	get: function() {
		return readChannelPairingState;
	}
});
Object.defineProperty(exports, "readChannelPairingStateFromDatabase", {
	enumerable: true,
	get: function() {
		return readChannelPairingStateFromDatabase;
	}
});
Object.defineProperty(exports, "resolveAllowFromAccountId", {
	enumerable: true,
	get: function() {
		return resolveAllowFromAccountId;
	}
});
Object.defineProperty(exports, "resolvePairingRequestAccountId", {
	enumerable: true,
	get: function() {
		return resolvePairingRequestAccountId;
	}
});
Object.defineProperty(exports, "safeAccountKey", {
	enumerable: true,
	get: function() {
		return safeAccountKey;
	}
});
Object.defineProperty(exports, "sqliteOptionsForEnv", {
	enumerable: true,
	get: function() {
		return sqliteOptionsForEnv;
	}
});
Object.defineProperty(exports, "updateChannelPairingStateSnapshot", {
	enumerable: true,
	get: function() {
		return updateChannelPairingStateSnapshot;
	}
});
Object.defineProperty(exports, "writeChannelPairingStateToDatabase", {
	enumerable: true,
	get: function() {
		return writeChannelPairingStateToDatabase;
	}
});
