const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./paths-C5Qy0ueD.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_pairing_store_sqlite = require("./pairing-store-sqlite-DarrOyll.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/pairing/pairing-store.ts
var pairing_store_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	addChannelAllowFromStoreEntry: () => addChannelAllowFromStoreEntry,
	readChannelAllowFromStore: () => readChannelAllowFromStore,
	removeChannelAllowFromStoreEntry: () => removeChannelAllowFromStoreEntry,
	upsertChannelPairingRequest: () => upsertChannelPairingRequest
});
const PAIRING_CODE_LENGTH = 8;
const PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAIRING_CODE_MAX_ATTEMPTS = 500;
const PAIRING_PENDING_TTL_MS = 3600 * 1e3;
const PAIRING_PENDING_MAX = 3;
function parseTimestamp(value) {
	if (!value) return null;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : null;
}
function isExpired(entry, nowMs) {
	const createdAt = parseTimestamp(entry.createdAt);
	return createdAt === null || nowMs - createdAt > PAIRING_PENDING_TTL_MS;
}
function pruneExpiredRequests(reqs, nowMs) {
	const kept = [];
	let removed = false;
	for (const req of reqs) {
		if (isExpired(req, nowMs)) {
			removed = true;
			continue;
		}
		kept.push(req);
	}
	return {
		requests: kept,
		removed
	};
}
function resolveLastSeenAt(entry) {
	return parseTimestamp(entry.lastSeenAt) ?? parseTimestamp(entry.createdAt) ?? 0;
}
function normalizePairingAccountId(accountId) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(accountId);
}
function requestMatchesAccountId(entry, normalizedAccountId) {
	return !normalizedAccountId || require_pairing_store_sqlite.resolvePairingRequestAccountId(entry) === normalizedAccountId;
}
function pruneExcessRequestsByAccount(reqs, maxPending) {
	if (maxPending <= 0 || reqs.length <= maxPending) return {
		requests: reqs,
		removed: false
	};
	const grouped = /* @__PURE__ */ new Map();
	for (const [index, entry] of reqs.entries()) {
		const accountId = require_pairing_store_sqlite.resolvePairingRequestAccountId(entry);
		const current = grouped.get(accountId);
		if (current) current.push({
			index,
			request: entry
		});
		else grouped.set(accountId, [{
			index,
			request: entry
		}]);
	}
	const droppedIndexes = /* @__PURE__ */ new Set();
	for (const entries of grouped.values()) {
		if (entries.length <= maxPending) continue;
		const sorted = entries.toSorted((left, right) => resolveLastSeenAt(left.request) - resolveLastSeenAt(right.request));
		for (const { index } of sorted.slice(0, sorted.length - maxPending)) droppedIndexes.add(index);
	}
	return droppedIndexes.size === 0 ? {
		requests: reqs,
		removed: false
	} : {
		requests: reqs.filter((_, index) => !droppedIndexes.has(index)),
		removed: true
	};
}
function randomCode() {
	let out = "";
	for (let i = 0; i < PAIRING_CODE_LENGTH; i++) out += PAIRING_CODE_ALPHABET[node_crypto.default.randomInt(0, 32)];
	return out;
}
function generateUniqueCode(existing) {
	for (let attempt = 0; attempt < PAIRING_CODE_MAX_ATTEMPTS; attempt += 1) {
		const code = randomCode();
		if (!existing.has(code)) return code;
	}
	throw new Error(`failed to generate unique pairing code after ${PAIRING_CODE_MAX_ATTEMPTS} attempts; existing code count: ${existing.size}`);
}
function normalizeId(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(value) ?? "";
}
function resolvePairingAdapter(channel, pairingAdapter) {
	return pairingAdapter ?? require_pairing_store_sqlite.getPairingAdapter(channel) ?? void 0;
}
function normalizeAllowEntry(channel, entry, pairingAdapter) {
	const trimmed = entry.trim();
	if (!trimmed || trimmed === "*") return "";
	const adapter = resolvePairingAdapter(channel, pairingAdapter);
	const normalizedEntry = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(adapter?.normalizeAllowEntry ? adapter.normalizeAllowEntry(trimmed) : trimmed) ?? "";
	return normalizedEntry === "*" ? "" : normalizedEntry;
}
function normalizeAllowFromInput(channel, entry, pairingAdapter) {
	return normalizeAllowEntry(channel, normalizeId(entry), pairingAdapter);
}
function readAllowFromState(channel, env, accountId) {
	const resolvedAccountId = require_pairing_store_sqlite.resolveAllowFromAccountId(accountId);
	return (require_pairing_store_sqlite.readChannelPairingState(channel, env).allowFrom?.[resolvedAccountId] ?? []).slice();
}
async function updateAllowFromStoreEntry(params) {
	const env = params.env ?? process.env;
	const accountId = require_pairing_store_sqlite.resolveAllowFromAccountId(params.accountId);
	const normalized = normalizeAllowFromInput(params.channel, params.entry, params.pairingAdapter);
	return require_openclaw_state_db.runOperatorStateWriteTransaction((database) => {
		const state = require_pairing_store_sqlite.readChannelPairingStateFromDatabase(database, params.channel);
		const current = (state.allowFrom?.[accountId] ?? []).slice();
		if (!normalized) return {
			changed: false,
			allowFrom: current
		};
		const next = params.apply(current, normalized);
		if (!next) return {
			changed: false,
			allowFrom: current
		};
		state.allowFrom ??= {};
		state.allowFrom[accountId] = next;
		require_pairing_store_sqlite.writeChannelPairingStateToDatabase(database, params.channel, state);
		return {
			changed: true,
			allowFrom: next
		};
	}, require_pairing_store_sqlite.sqliteOptionsForEnv(env));
}
async function readChannelAllowFromStore(channel, env = process.env, accountId) {
	return readAllowFromState(channel, env, accountId);
}
async function addChannelAllowFromStoreEntry(params) {
	return updateAllowFromStoreEntry({
		...params,
		apply: (current, normalized) => current.includes(normalized) ? null : [...current, normalized]
	});
}
async function removeChannelAllowFromStoreEntry(params) {
	return updateAllowFromStoreEntry({
		...params,
		apply: (current, normalized) => {
			const next = current.filter((entry) => entry !== normalized);
			return next.length === current.length ? null : next;
		}
	});
}
async function upsertChannelPairingRequest(params) {
	return require_openclaw_state_db.runOperatorStateWriteTransaction((database) => {
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const id = normalizeId(params.id);
		const accountId = normalizePairingAccountId(params.accountId) || "default";
		const meta = {
			...params.meta ? Object.fromEntries(Object.entries(params.meta).map(([key, value]) => [key, (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? ""]).filter(([, value]) => Boolean(value))) : void 0,
			accountId
		};
		const state = require_pairing_store_sqlite.readChannelPairingStateFromDatabase(database, params.channel);
		const expired = pruneExpiredRequests(state.requests, Date.now());
		let requests = expired.requests;
		const existingIndex = requests.findIndex((request) => request.id === id && requestMatchesAccountId(request, accountId));
		const existingCodes = new Set(requests.map((request) => ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.code) ?? "").toUpperCase()));
		if (existingIndex >= 0) {
			const existing = requests[existingIndex];
			const code = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(existing?.code) || generateUniqueCode(existingCodes);
			requests[existingIndex] = {
				id,
				code,
				createdAt: existing?.createdAt ?? now,
				lastSeenAt: now,
				meta
			};
			state.requests = pruneExcessRequestsByAccount(requests, PAIRING_PENDING_MAX).requests;
			require_pairing_store_sqlite.writeChannelPairingStateToDatabase(database, params.channel, state);
			return {
				code,
				created: false
			};
		}
		const capped = pruneExcessRequestsByAccount(requests, PAIRING_PENDING_MAX);
		requests = capped.requests;
		if (requests.filter((request) => requestMatchesAccountId(request, accountId)).length >= PAIRING_PENDING_MAX) {
			if (expired.removed || capped.removed) {
				state.requests = requests;
				require_pairing_store_sqlite.writeChannelPairingStateToDatabase(database, params.channel, state);
			}
			return {
				code: "",
				created: false
			};
		}
		const code = generateUniqueCode(existingCodes);
		state.requests = [...requests, {
			id,
			code,
			createdAt: now,
			lastSeenAt: now,
			meta
		}];
		require_pairing_store_sqlite.writeChannelPairingStateToDatabase(database, params.channel, state);
		return {
			code,
			created: true
		};
	}, require_pairing_store_sqlite.sqliteOptionsForEnv(params.env ?? process.env));
}
//#endregion
Object.defineProperty(exports, "addChannelAllowFromStoreEntry", {
	enumerable: true,
	get: function() {
		return addChannelAllowFromStoreEntry;
	}
});
Object.defineProperty(exports, "pairing_store_exports", {
	enumerable: true,
	get: function() {
		return pairing_store_exports;
	}
});
Object.defineProperty(exports, "readChannelAllowFromStore", {
	enumerable: true,
	get: function() {
		return readChannelAllowFromStore;
	}
});
Object.defineProperty(exports, "removeChannelAllowFromStoreEntry", {
	enumerable: true,
	get: function() {
		return removeChannelAllowFromStoreEntry;
	}
});
Object.defineProperty(exports, "upsertChannelPairingRequest", {
	enumerable: true,
	get: function() {
		return upsertChannelPairingRequest;
	}
});
