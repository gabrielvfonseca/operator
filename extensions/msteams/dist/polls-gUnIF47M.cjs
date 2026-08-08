const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
require("./fs-safe-BptZQDa1.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_keyed_async_queue = require("./keyed-async-queue-BXE4i2mb.cjs");
require("./security-runtime-DuzdER7a.cjs");
const require_file_lock = require("./file-lock-BhHrzsWW.cjs");
const require_runtime = require("./runtime-B6pBPYCa.cjs");
require("./number-runtime-B0wUrKOM.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region extensions/msteams/src/conversation-store-helpers.ts
function normalizeStoredConversationId(raw) {
	return raw.split(";")[0] ?? raw;
}
function parseStoredConversationTimestamp(value) {
	if (!value) return null;
	const parsed = Date.parse(value);
	if (!Number.isFinite(parsed)) return null;
	return parsed;
}
function toConversationStoreEntries(entries) {
	return Array.from(entries, ([conversationId, reference]) => ({
		conversationId,
		reference
	}));
}
function mergeStoredConversationReference(existing, incoming, nowIso) {
	return {
		...existing?.timezone && !incoming.timezone ? { timezone: existing.timezone } : {},
		...existing?.tenantId && !incoming.tenantId ? { tenantId: existing.tenantId } : {},
		...existing?.aadObjectId && !incoming.aadObjectId ? { aadObjectId: existing.aadObjectId } : {},
		...incoming,
		lastSeenAt: nowIso
	};
}
function findPreferredDmConversationByUserId(entries, id) {
	const target = id.trim();
	if (!target) return null;
	const personalMatches = [];
	const unknownTypeMatches = [];
	for (const entry of entries) {
		if (entry.reference.user?.aadObjectId !== target && entry.reference.user?.id !== target) continue;
		const convType = require_string_coerce.normalizeLowercaseStringOrEmpty(entry.reference.conversation?.conversationType ?? "");
		if (convType === "personal") personalMatches.push(entry);
		else if (convType === "channel" || convType === "groupchat") {} else unknownTypeMatches.push(entry);
	}
	const candidates = personalMatches.length > 0 ? personalMatches : unknownTypeMatches;
	if (candidates.length === 0) return null;
	if (candidates.length > 1) candidates.sort((a, b) => (parseStoredConversationTimestamp(b.reference.lastSeenAt) ?? 0) - (parseStoredConversationTimestamp(a.reference.lastSeenAt) ?? 0));
	return candidates[0] ?? null;
}
//#endregion
//#region src/plugin-sdk/json-store.ts
/** Write JSON with secure file permissions and atomic replacement semantics. */
async function writeJsonFileAtomically(filePath, value) {
	await (0, _openclaw_fs_safe_json.writeJson)(filePath, value, {
		mode: 384,
		dirMode: 448,
		trailingNewline: true
	});
}
//#endregion
//#region extensions/msteams/src/store-fs.ts
const STORE_LOCK_OPTIONS = {
	retries: {
		retries: 10,
		factor: 2,
		minTimeout: 100,
		maxTimeout: 1e4,
		randomize: true
	},
	stale: 3e4
};
async function writeJsonFile(filePath, value) {
	await writeJsonFileAtomically(filePath, value);
}
async function ensureJsonFile(filePath, fallback) {
	if (!await (0, _openclaw_fs_safe_advanced.pathExists)(filePath)) await writeJsonFile(filePath, fallback);
}
async function withFileLock(filePath, fallback, fn) {
	await ensureJsonFile(filePath, fallback);
	return await require_file_lock.withFileLock(filePath, STORE_LOCK_OPTIONS, async () => {
		return await fn();
	});
}
//#endregion
//#region extensions/msteams/src/sqlite-state.ts
function resolveStateDirOverride(options) {
	if (!options) return;
	if (options.stateDir) return options.stateDir;
	if (options.storePath) return node_path.default.dirname(options.storePath);
	if (options.homedir) return require_runtime.getMSTeamsRuntime().state.resolveStateDir(options.env ?? process.env, options.homedir);
	return options.env?.OPERATOR_STATE_DIR?.trim() || void 0;
}
function resolveMSTeamsSqliteStateEnv(options) {
	const stateDir = resolveStateDirOverride(options);
	if (!stateDir) return options?.env;
	return {
		...options?.env ?? process.env,
		OPERATOR_STATE_DIR: stateDir
	};
}
function toPluginJsonValue(value) {
	const serialized = JSON.stringify(value);
	return JSON.parse(serialized);
}
function resolveMSTeamsSqliteStateDir(options) {
	return resolveStateDirOverride(options) ?? require_runtime.getMSTeamsRuntime().state.resolveStateDir(options?.env ?? process.env, options?.homedir);
}
const sqliteMutationLocks = new require_keyed_async_queue.KeyedAsyncQueue();
async function withProcessMutationLock(lockPath, fn) {
	return await sqliteMutationLocks.enqueue(lockPath, fn);
}
async function withMSTeamsSqliteMutationLock(options, lockFilename, fn) {
	const lockPath = node_path.default.join(resolveMSTeamsSqliteStateDir(options), lockFilename);
	return await withProcessMutationLock(lockPath, async () => {
		return await withFileLock(lockPath, { version: 1 }, fn);
	});
}
//#endregion
//#region extensions/msteams/src/conversation-store-state.ts
const MSTEAMS_CONVERSATIONS_LEGACY_FILENAME = "msteams-conversations.json";
const MSTEAMS_CONVERSATIONS_NAMESPACE = "conversations";
const MSTEAMS_MAX_CONVERSATIONS = 1e3;
const MSTEAMS_SQLITE_MAX_CONVERSATION_ROWS = 2e3;
const MSTEAMS_CONVERSATION_TTL_MS = 365 * 24 * 60 * 60 * 1e3;
const CONVERSATION_LOCK_FILENAME = "msteams-conversations.sqlite.lock";
function createConversationStateStore(params) {
	return require_runtime.getMSTeamsRuntime().state.openKeyedStore({
		namespace: MSTEAMS_CONVERSATIONS_NAMESPACE,
		maxEntries: MSTEAMS_SQLITE_MAX_CONVERSATION_ROWS,
		env: resolveMSTeamsSqliteStateEnv(params)
	});
}
function normalizeMSTeamsLegacyConversationStore(value) {
	if (value.version !== 1 || !value.conversations || typeof value.conversations !== "object" || Array.isArray(value.conversations)) return {
		version: 1,
		conversations: {}
	};
	return value;
}
function buildMSTeamsConversationStateKey(conversationId) {
	return node_crypto.default.createHash("sha256").update(conversationId).digest("hex");
}
function prepareMSTeamsConversationReferenceForStorage(conversationId, reference) {
	return {
		...reference,
		conversation: {
			...reference.conversation,
			id: conversationId
		}
	};
}
function getStoredConversationId(reference) {
	const rawId = reference.conversation?.id;
	return rawId ? normalizeStoredConversationId(rawId) : null;
}
function selectRetainedMSTeamsConversations(conversations, ttlMs = MSTEAMS_CONVERSATION_TTL_MS) {
	const retained = Object.entries(conversations).filter(([, reference]) => {
		const lastSeenAt = parseStoredConversationTimestamp(reference.lastSeenAt);
		return lastSeenAt == null || Date.now() - lastSeenAt <= ttlMs;
	});
	if (retained.length <= MSTEAMS_MAX_CONVERSATIONS) return retained;
	retained.sort((a, b) => {
		return (parseStoredConversationTimestamp(a[1].lastSeenAt) ?? 0) - (parseStoredConversationTimestamp(b[1].lastSeenAt) ?? 0) || a[0].localeCompare(b[0]);
	});
	return retained.slice(retained.length - MSTEAMS_MAX_CONVERSATIONS);
}
function createMSTeamsConversationStoreState(params) {
	const ttlMs = params?.ttlMs ?? MSTEAMS_CONVERSATION_TTL_MS;
	const conversationStore = createConversationStateStore(params);
	const isExpired = (reference) => {
		const lastSeenAt = parseStoredConversationTimestamp(reference.lastSeenAt);
		return lastSeenAt != null && Date.now() - lastSeenAt > ttlMs;
	};
	const lookupStored = async (conversationId) => {
		const normalizedId = normalizeStoredConversationId(conversationId);
		const value = await conversationStore.lookup(buildMSTeamsConversationStateKey(normalizedId));
		if (!value) return null;
		if (isExpired(value)) return null;
		return value;
	};
	const entries = async () => {
		const rows = await conversationStore.entries();
		const kept = [];
		for (const row of rows) {
			if (isExpired(row.value)) continue;
			const conversationId = getStoredConversationId(row.value);
			if (conversationId) kept.push([conversationId, row.value]);
		}
		return kept;
	};
	const lookup = async (conversationId) => {
		return await lookupStored(conversationId);
	};
	const register = async (conversationId, reference) => {
		const normalizedId = normalizeStoredConversationId(conversationId);
		await conversationStore.register(buildMSTeamsConversationStateKey(normalizedId), toPluginJsonValue(prepareMSTeamsConversationReferenceForStorage(normalizedId, reference)));
		const rows = [];
		for (const row of await conversationStore.entries()) {
			if (isExpired(row.value)) {
				await conversationStore.delete(row.key);
				continue;
			}
			rows.push(row);
		}
		if (rows.length <= MSTEAMS_MAX_CONVERSATIONS) return;
		const sorted = rows.toSorted((a, b) => {
			const aTs = parseStoredConversationTimestamp(a.value.lastSeenAt) ?? 0;
			const bTs = parseStoredConversationTimestamp(b.value.lastSeenAt) ?? 0;
			const aId = getStoredConversationId(a.value) ?? a.key;
			const bId = getStoredConversationId(b.value) ?? b.key;
			return aTs - bTs || aId.localeCompare(bId);
		});
		for (const row of sorted.slice(0, rows.length - MSTEAMS_MAX_CONVERSATIONS)) await conversationStore.delete(row.key);
	};
	const list = async () => {
		return toConversationStoreEntries(await entries());
	};
	const get = async (conversationId) => {
		return await lookup(conversationId);
	};
	const findPreferredDmByUserId = async (id) => {
		return findPreferredDmConversationByUserId(await list(), id);
	};
	const upsert = async (conversationId, reference) => {
		const normalizedId = normalizeStoredConversationId(conversationId);
		await withMSTeamsSqliteMutationLock(params, CONVERSATION_LOCK_FILENAME, async () => {
			const existing = await lookupStored(normalizedId);
			await register(normalizedId, mergeStoredConversationReference(existing ?? void 0, reference, (/* @__PURE__ */ new Date()).toISOString()));
		});
	};
	const remove = async (conversationId) => {
		const normalizedId = normalizeStoredConversationId(conversationId);
		return await withMSTeamsSqliteMutationLock(params, CONVERSATION_LOCK_FILENAME, async () => {
			return await conversationStore.delete(buildMSTeamsConversationStateKey(normalizedId));
		});
	};
	return {
		upsert,
		get,
		list,
		remove,
		findPreferredDmByUserId
	};
}
//#endregion
//#region extensions/msteams/src/polls.ts
const MSTEAMS_POLLS_LEGACY_FILENAME = "msteams-polls.json";
const MSTEAMS_POLLS_NAMESPACE = "polls";
const MSTEAMS_POLL_VOTE_BUCKETS_NAMESPACE = "poll-vote-buckets";
const MSTEAMS_MAX_POLLS = 1e3;
const MSTEAMS_SQLITE_MAX_POLL_ROWS = 2e3;
const MSTEAMS_POLL_VOTE_BUCKET_COUNT = 32;
const MSTEAMS_MAX_POLL_VOTE_BUCKET_ROWS = 1001 * MSTEAMS_POLL_VOTE_BUCKET_COUNT;
const MSTEAMS_POLL_TTL_MS = 720 * 60 * 60 * 1e3;
const POLL_LOCK_FILENAME = "msteams-polls.sqlite.lock";
function normalizeChoiceValue(value) {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed ? trimmed : null;
	}
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	return null;
}
function extractSelections(value) {
	if (Array.isArray(value)) return value.map(normalizeChoiceValue).filter((entry) => Boolean(entry));
	const normalized = normalizeChoiceValue(value);
	if (!normalized) return [];
	if (normalized.includes(",")) return require_string_normalization.normalizeStringEntries(normalized.split(","));
	return [normalized];
}
function readNestedValue(value, keys) {
	let current = value;
	for (const key of keys) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(current)) return;
		current = current[key];
	}
	return current;
}
function readNestedString(value, keys) {
	return require_string_coerce.normalizeOptionalString(readNestedValue(value, keys));
}
function extractMSTeamsPollVote(activity) {
	const value = activity?.value;
	if (!value || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return null;
	const pollId = readNestedString(value, ["openclawPollId"]) ?? readNestedString(value, ["pollId"]) ?? readNestedString(value, ["@gabrielvfonseca/operator", "pollId"]) ?? readNestedString(value, [
		"@gabrielvfonseca/operator",
		"poll",
		"id"
	]) ?? readNestedString(value, ["data", "openclawPollId"]) ?? readNestedString(value, ["data", "pollId"]) ?? readNestedString(value, [
		"data",
		"@gabrielvfonseca/operator",
		"pollId"
	]) ?? readNestedString(value, [
		"action",
		"data",
		"openclawPollId"
	]) ?? readNestedString(value, [
		"action",
		"data",
		"pollId"
	]);
	if (!pollId) return null;
	const directSelections = extractSelections(value.choices);
	const nestedSelections = extractSelections(readNestedValue(value, ["choices"]));
	const dataSelections = extractSelections(readNestedValue(value, ["data", "choices"]));
	const actionDataSelections = extractSelections(readNestedValue(value, [
		"action",
		"data",
		"choices"
	]));
	const selections = directSelections.length > 0 ? directSelections : nestedSelections.length > 0 ? nestedSelections : dataSelections.length > 0 ? dataSelections : actionDataSelections;
	if (selections.length === 0) return null;
	return {
		pollId,
		selections
	};
}
function buildMSTeamsPollCard(params) {
	const pollId = params.pollId ?? node_crypto.default.randomUUID();
	const maxSelections = typeof params.maxSelections === "number" && params.maxSelections > 1 ? Math.floor(params.maxSelections) : 1;
	const cappedMaxSelections = Math.min(Math.max(1, maxSelections), params.options.length);
	const choices = params.options.map((option, index) => ({
		title: option,
		value: String(index)
	}));
	const hint = cappedMaxSelections > 1 ? `Select up to ${cappedMaxSelections} option${cappedMaxSelections === 1 ? "" : "s"}.` : "Select one option.";
	const card = {
		type: "AdaptiveCard",
		version: "1.5",
		body: [
			{
				type: "TextBlock",
				text: params.question,
				wrap: true,
				weight: "Bolder",
				size: "Medium"
			},
			{
				type: "Input.ChoiceSet",
				id: "choices",
				isMultiSelect: cappedMaxSelections > 1,
				style: "expanded",
				choices
			},
			{
				type: "TextBlock",
				text: hint,
				wrap: true,
				isSubtle: true,
				spacing: "Small"
			}
		],
		actions: [{
			type: "Action.Execute",
			title: "Vote",
			verb: "operator.poll.vote",
			data: {
				openclawPollId: pollId,
				pollId
			}
		}]
	};
	const fallbackLines = [`Poll: ${params.question}`, ...params.options.map((option, index) => `${index + 1}. ${option}`)];
	return {
		pollId,
		question: params.question,
		options: params.options,
		maxSelections: cappedMaxSelections,
		card,
		fallbackText: fallbackLines.join("\n")
	};
}
function createPollStateStore(params) {
	return require_runtime.getMSTeamsRuntime().state.openKeyedStore({
		namespace: MSTEAMS_POLLS_NAMESPACE,
		maxEntries: MSTEAMS_SQLITE_MAX_POLL_ROWS,
		env: resolveMSTeamsSqliteStateEnv(params)
	});
}
function createPollVoteBucketStateStore(params) {
	return require_runtime.getMSTeamsRuntime().state.openKeyedStore({
		namespace: MSTEAMS_POLL_VOTE_BUCKETS_NAMESPACE,
		maxEntries: MSTEAMS_MAX_POLL_VOTE_BUCKET_ROWS,
		env: resolveMSTeamsSqliteStateEnv(params)
	});
}
function parseTimestamp(value) {
	if (!value) return null;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : null;
}
function pruneExpired(polls) {
	const cutoff = Date.now() - MSTEAMS_POLL_TTL_MS;
	const entries = Object.entries(polls).filter(([, poll]) => {
		return (parseTimestamp(poll.updatedAt ?? poll.createdAt) ?? 0) >= cutoff;
	});
	return Object.fromEntries(entries);
}
function selectRetainedMSTeamsPolls(polls) {
	const retained = Object.entries(pruneExpired(polls));
	if (retained.length <= MSTEAMS_MAX_POLLS) return retained;
	retained.sort((a, b) => {
		return (parseTimestamp(a[1].updatedAt ?? a[1].createdAt) ?? 0) - (parseTimestamp(b[1].updatedAt ?? b[1].createdAt) ?? 0) || a[0].localeCompare(b[0]);
	});
	return retained.slice(retained.length - MSTEAMS_MAX_POLLS);
}
function normalizeMSTeamsPollSelections(poll, selections) {
	const maxSelections = Math.max(1, poll.maxSelections);
	const mapped = selections.map((entry) => require_parse_finite_number.parseStrictNonNegativeInteger(entry)).filter((value) => value !== void 0).filter((value) => value >= 0 && value < poll.options.length).map((value) => String(value));
	return require_string_normalization.uniqueStrings(maxSelections > 1 ? mapped.slice(0, maxSelections) : mapped.slice(0, 1));
}
function splitMSTeamsPoll(poll) {
	const { votes, ...metadata } = poll;
	return {
		metadata,
		votes
	};
}
function hashMSTeamsPollVote(pollId, voterId) {
	return node_crypto.default.createHash("sha256").update(pollId).update("\0").update(voterId).digest("hex");
}
function buildMSTeamsPollStateKey(pollId) {
	return node_crypto.default.createHash("sha256").update(pollId).digest("hex");
}
function selectMSTeamsPollVoteBucket(pollId, voterId) {
	const bucket = Number.parseInt(hashMSTeamsPollVote(pollId, voterId).slice(0, 8), 16);
	return String(bucket % MSTEAMS_POLL_VOTE_BUCKET_COUNT).padStart(4, "0");
}
function buildMSTeamsPollVoteBucketKey(pollId, bucket) {
	return `${node_crypto.default.createHash("sha256").update(pollId).digest("hex")}:${bucket}`;
}
function createMSTeamsPollStoreState(params) {
	const pollStore = createPollStateStore(params);
	const voteBucketStore = createPollVoteBucketStateStore(params);
	const readPollVotes = async (pollId) => {
		const votes = {};
		for (const row of await voteBucketStore.entries()) if (row.value.pollId === pollId) Object.assign(votes, row.value.votes);
		return votes;
	};
	const deletePollVotes = async (pollId) => {
		for (const row of await voteBucketStore.entries()) if (row.value.pollId === pollId) await voteBucketStore.delete(row.key);
	};
	const registerPollVotes = async (pollId, votes, updatedAt) => {
		const buckets = /* @__PURE__ */ new Map();
		for (const [voterId, selections] of Object.entries(votes)) {
			const bucket = selectMSTeamsPollVoteBucket(pollId, voterId);
			const bucketVotes = buckets.get(bucket) ?? {};
			bucketVotes[voterId] = selections;
			buckets.set(bucket, bucketVotes);
		}
		for (const [bucket, bucketVotes] of buckets) {
			const key = buildMSTeamsPollVoteBucketKey(pollId, bucket);
			const existing = await voteBucketStore.lookup(key);
			await voteBucketStore.register(key, toPluginJsonValue({
				pollId,
				bucket,
				votes: {
					...bucketVotes,
					...existing?.votes
				},
				updatedAt
			}));
		}
	};
	const registerPollVote = async (pollId, voterId, selections, updatedAt) => {
		const bucket = selectMSTeamsPollVoteBucket(pollId, voterId);
		const key = buildMSTeamsPollVoteBucketKey(pollId, bucket);
		const existing = await voteBucketStore.lookup(key);
		await voteBucketStore.register(key, toPluginJsonValue({
			pollId,
			bucket,
			votes: {
				...existing?.votes,
				[voterId]: selections
			},
			updatedAt
		}));
	};
	const reconstructPoll = async (metadata) => {
		return {
			...metadata,
			votes: await readPollVotes(metadata.id)
		};
	};
	const prunePollStoreToLimit = async () => {
		const rows = [];
		for (const row of await pollStore.entries()) {
			if (!pruneExpired({ [row.key]: row.value })[row.key]) {
				await pollStore.delete(row.key);
				await deletePollVotes(row.value.id);
				continue;
			}
			rows.push(row);
		}
		if (rows.length <= MSTEAMS_MAX_POLLS) return;
		const sorted = rows.toSorted((a, b) => {
			return (parseTimestamp(a.value.updatedAt ?? a.value.createdAt) ?? 0) - (parseTimestamp(b.value.updatedAt ?? b.value.createdAt) ?? 0) || a.key.localeCompare(b.key);
		});
		for (const row of sorted.slice(0, rows.length - MSTEAMS_MAX_POLLS)) {
			await pollStore.delete(row.key);
			await deletePollVotes(row.value.id);
		}
	};
	const createPoll = async (poll) => {
		await withMSTeamsSqliteMutationLock(params, POLL_LOCK_FILENAME, async () => {
			const { metadata, votes } = splitMSTeamsPoll(poll);
			await pollStore.register(buildMSTeamsPollStateKey(poll.id), toPluginJsonValue(metadata));
			await deletePollVotes(poll.id);
			await registerPollVotes(poll.id, votes, poll.updatedAt ?? poll.createdAt);
			await prunePollStoreToLimit();
		});
	};
	const getPoll = async (pollId) => {
		const poll = await pollStore.lookup(buildMSTeamsPollStateKey(pollId));
		if (!poll) return null;
		if (!pruneExpired({ [pollId]: poll })[pollId]) return null;
		return await reconstructPoll(poll);
	};
	const recordVote = async (vote) => {
		return await withMSTeamsSqliteMutationLock(params, POLL_LOCK_FILENAME, async () => {
			const pollKey = buildMSTeamsPollStateKey(vote.pollId);
			const poll = await pollStore.lookup(pollKey);
			if (!poll) return null;
			if (!pruneExpired({ [vote.pollId]: poll })[vote.pollId]) {
				await pollStore.delete(pollKey);
				await deletePollVotes(vote.pollId);
				return null;
			}
			const normalized = normalizeMSTeamsPollSelections(await reconstructPoll(poll), vote.selections);
			const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
			poll.updatedAt = updatedAt;
			await pollStore.register(pollKey, toPluginJsonValue(poll));
			await registerPollVote(vote.pollId, vote.voterId, normalized, updatedAt);
			await prunePollStoreToLimit();
			return await reconstructPoll(poll);
		});
	};
	return {
		createPoll,
		getPoll,
		recordVote
	};
}
//#endregion
Object.defineProperty(exports, "MSTEAMS_CONVERSATIONS_LEGACY_FILENAME", {
	enumerable: true,
	get: function() {
		return MSTEAMS_CONVERSATIONS_LEGACY_FILENAME;
	}
});
Object.defineProperty(exports, "MSTEAMS_CONVERSATIONS_NAMESPACE", {
	enumerable: true,
	get: function() {
		return MSTEAMS_CONVERSATIONS_NAMESPACE;
	}
});
Object.defineProperty(exports, "MSTEAMS_MAX_POLL_VOTE_BUCKET_ROWS", {
	enumerable: true,
	get: function() {
		return MSTEAMS_MAX_POLL_VOTE_BUCKET_ROWS;
	}
});
Object.defineProperty(exports, "MSTEAMS_POLLS_LEGACY_FILENAME", {
	enumerable: true,
	get: function() {
		return MSTEAMS_POLLS_LEGACY_FILENAME;
	}
});
Object.defineProperty(exports, "MSTEAMS_POLLS_NAMESPACE", {
	enumerable: true,
	get: function() {
		return MSTEAMS_POLLS_NAMESPACE;
	}
});
Object.defineProperty(exports, "MSTEAMS_POLL_VOTE_BUCKETS_NAMESPACE", {
	enumerable: true,
	get: function() {
		return MSTEAMS_POLL_VOTE_BUCKETS_NAMESPACE;
	}
});
Object.defineProperty(exports, "MSTEAMS_SQLITE_MAX_CONVERSATION_ROWS", {
	enumerable: true,
	get: function() {
		return MSTEAMS_SQLITE_MAX_CONVERSATION_ROWS;
	}
});
Object.defineProperty(exports, "MSTEAMS_SQLITE_MAX_POLL_ROWS", {
	enumerable: true,
	get: function() {
		return MSTEAMS_SQLITE_MAX_POLL_ROWS;
	}
});
Object.defineProperty(exports, "buildMSTeamsConversationStateKey", {
	enumerable: true,
	get: function() {
		return buildMSTeamsConversationStateKey;
	}
});
Object.defineProperty(exports, "buildMSTeamsPollCard", {
	enumerable: true,
	get: function() {
		return buildMSTeamsPollCard;
	}
});
Object.defineProperty(exports, "buildMSTeamsPollStateKey", {
	enumerable: true,
	get: function() {
		return buildMSTeamsPollStateKey;
	}
});
Object.defineProperty(exports, "buildMSTeamsPollVoteBucketKey", {
	enumerable: true,
	get: function() {
		return buildMSTeamsPollVoteBucketKey;
	}
});
Object.defineProperty(exports, "createMSTeamsConversationStoreState", {
	enumerable: true,
	get: function() {
		return createMSTeamsConversationStoreState;
	}
});
Object.defineProperty(exports, "createMSTeamsPollStoreState", {
	enumerable: true,
	get: function() {
		return createMSTeamsPollStoreState;
	}
});
Object.defineProperty(exports, "extractMSTeamsPollVote", {
	enumerable: true,
	get: function() {
		return extractMSTeamsPollVote;
	}
});
Object.defineProperty(exports, "normalizeMSTeamsLegacyConversationStore", {
	enumerable: true,
	get: function() {
		return normalizeMSTeamsLegacyConversationStore;
	}
});
Object.defineProperty(exports, "normalizeStoredConversationId", {
	enumerable: true,
	get: function() {
		return normalizeStoredConversationId;
	}
});
Object.defineProperty(exports, "prepareMSTeamsConversationReferenceForStorage", {
	enumerable: true,
	get: function() {
		return prepareMSTeamsConversationReferenceForStorage;
	}
});
Object.defineProperty(exports, "resolveMSTeamsSqliteStateEnv", {
	enumerable: true,
	get: function() {
		return resolveMSTeamsSqliteStateEnv;
	}
});
Object.defineProperty(exports, "selectMSTeamsPollVoteBucket", {
	enumerable: true,
	get: function() {
		return selectMSTeamsPollVoteBucket;
	}
});
Object.defineProperty(exports, "selectRetainedMSTeamsConversations", {
	enumerable: true,
	get: function() {
		return selectRetainedMSTeamsConversations;
	}
});
Object.defineProperty(exports, "selectRetainedMSTeamsPolls", {
	enumerable: true,
	get: function() {
		return selectRetainedMSTeamsPolls;
	}
});
Object.defineProperty(exports, "splitMSTeamsPoll", {
	enumerable: true,
	get: function() {
		return splitMSTeamsPoll;
	}
});
Object.defineProperty(exports, "toPluginJsonValue", {
	enumerable: true,
	get: function() {
		return toPluginJsonValue;
	}
});
Object.defineProperty(exports, "withMSTeamsSqliteMutationLock", {
	enumerable: true,
	get: function() {
		return withMSTeamsSqliteMutationLock;
	}
});
