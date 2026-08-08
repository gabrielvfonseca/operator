const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
require("./types-lecpXEXr.cjs");
const require_keyed_async_queue = require("./keyed-async-queue-BXE4i2mb.cjs");
const require_retry = require("./retry-DXZi6qkk.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_stable_stringify = require("./stable-stringify-WjfDEBwS.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
require("./session-accessor-D_W4fZCX.cjs");
const require_worker_provider_registry = require("./worker-provider-registry-CsuKJchR.cjs");
const require_zod_schema = require("./zod-schema-88BPc5CZ.cjs");
const require_session_lifecycle_events = require("./session-lifecycle-events-DldGnQfO.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_secret_equal = require("./secret-equal-_vlQ14qZ.cjs");
require("./worker-admission-DNxVcwiA.cjs");
const require_worker_inference = require("./worker-inference-Dfl4hXJC.cjs");
const require_json_utf8_bytes = require("./json-utf8-bytes-DT-tvSMV.cjs");
const require_store = require("./store-v7u_qN5B.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let node_crypto = require("node:crypto");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/capability-provider.types.ts
/** Permanent provider rejection recorded as a terminal worker failure. */
var WorkerProviderError = class extends Error {
	constructor(message) {
		super(message);
		this.code = "invalid_profile";
		this.name = "WorkerProviderError";
	}
};
const WORKER_CREDENTIAL_HASH_DOMAIN = "operator-worker-credential-v1\0";
const WORKER_CREDENTIAL_BYTES = 32;
/** Hash opaque worker credentials with a domain separator before persistence. */
function hashWorkerCredential(credential) {
	return require_crypto_digest.sha256Base64Url(`${WORKER_CREDENTIAL_HASH_DOMAIN}${credential}`);
}
/** Generate one high-entropy credential. Plaintext is returned only to its delivery owner. */
function createWorkerCredentialMaterial(generateToken = require_retry.generateSecureToken) {
	const credential = generateToken(WORKER_CREDENTIAL_BYTES);
	require_redact.registerSecretValueForRedaction(credential);
	return {
		credential,
		credentialHash: hashWorkerCredential(credential)
	};
}
//#endregion
//#region src/gateway/worker-environments/admission.ts
function sameStrings(left, right) {
	const normalizedLeft = left.toSorted();
	const normalizedRight = right.toSorted();
	return normalizedLeft.length === normalizedRight.length && normalizedLeft.every((value, index) => value === normalizedRight[index]);
}
/** Admits only the exact build selected for this worker environment. */
function verifyWorkerAdmissionHandshake(handshake, expected) {
	return handshake.bundleHash === expected.bundleHash && handshake.operatorVersion === expected.operatorVersion && sameStrings(handshake.protocolFeatures, expected.protocolFeatures);
}
/** Validate an opaque credential and every server-owned worker admission binding. */
function admitWorkerConnection(params) {
	const { admission, store } = params;
	const credentialHash = hashWorkerCredential(admission.credential);
	const credential = store.getCredential(admission.environmentId);
	if (!credential || !require_secret_equal.safeEqualSecret(credentialHash, credential.credentialHash)) return {
		ok: false,
		reason: store.findCredentialByHash(credentialHash) ? "environment-mismatch" : "invalid-credential"
	};
	if (credential.environmentId !== admission.environmentId) return {
		ok: false,
		reason: "environment-mismatch"
	};
	if (params.nowMs >= credential.expiresAtMs) return {
		ok: false,
		reason: "credential-expired"
	};
	const environment = store.get(admission.environmentId);
	if (!environment || environment.state !== "ready" && environment.state !== "idle" && environment.state !== "attached" || environment.destroyRequestedAtMs !== null || !environment.bootstrapReceipt) return {
		ok: false,
		reason: "environment-unavailable"
	};
	if (admission.handshake.bundleHash !== credential.bundleHash || admission.handshake.bundleHash !== environment.bootstrapReceipt.bundleHash || admission.handshake.bundleHash !== params.expectedBuild.bundleHash) return {
		ok: false,
		reason: "bundle-mismatch"
	};
	if (admission.handshake.operatorVersion !== environment.bootstrapReceipt.operatorVersion || admission.handshake.operatorVersion !== params.expectedBuild.operatorVersion) return {
		ok: false,
		reason: "version-mismatch"
	};
	if (admission.sessionId !== credential.sessionId) return {
		ok: false,
		reason: "session-mismatch"
	};
	if (admission.sessionId === null !== (admission.runId === null)) return {
		ok: false,
		reason: "session-mismatch"
	};
	if (admission.ownerEpoch !== credential.ownerEpoch || admission.ownerEpoch !== environment.ownerEpoch) return {
		ok: false,
		reason: "owner-epoch-mismatch"
	};
	if (admission.rpcSetVersion !== credential.rpcSetVersion || credential.rpcSetVersion !== 1) return {
		ok: false,
		reason: "rpc-set-mismatch"
	};
	if (!sameStrings(admission.handshake.protocolFeatures, environment.bootstrapReceipt.protocolFeatures) || !sameStrings(admission.handshake.protocolFeatures, params.expectedBuild.protocolFeatures)) return {
		ok: false,
		reason: "protocol-features-mismatch"
	};
	return {
		ok: true,
		identity: {
			environmentId: environment.environmentId,
			credentialHash: credential.credentialHash,
			bundleHash: credential.bundleHash,
			sessionId: credential.sessionId,
			runId: admission.runId,
			ownerEpoch: credential.ownerEpoch,
			rpcSetVersion: credential.rpcSetVersion,
			protocolFeatures: [...environment.bootstrapReceipt.protocolFeatures],
			credentialExpiresAtMs: credential.expiresAtMs
		}
	};
}
/** Revalidate live ownership on every worker RPC so rotation and expiry fence stale sockets. */
function validateWorkerConnectionIdentity(params) {
	const credential = params.store.getCredential(params.identity.environmentId);
	if (!credential || !require_secret_equal.safeEqualSecret(credential.credentialHash, params.identity.credentialHash)) return "credential-replaced";
	if (params.nowMs >= credential.expiresAtMs) return "credential-expired";
	const environment = params.store.get(params.identity.environmentId);
	if (!environment || environment.state !== "ready" && environment.state !== "idle" && environment.state !== "attached" || environment.destroyRequestedAtMs !== null) return "environment-unavailable";
	if (environment.ownerEpoch !== params.identity.ownerEpoch || credential.ownerEpoch !== params.identity.ownerEpoch) return "owner-epoch-mismatch";
	return null;
}
//#endregion
//#region src/gateway/worker-environments/inference-store.ts
const REQUEST_HASH_PATTERN = /^[a-f0-9]{64}$/u;
const DEFAULT_RETENTION = {
	maxAgeMs: 1440 * 60 * 1e3,
	maxRows: 256,
	maxBytes: 64 * 1024 * 1024
};
function required(value, field) {
	if (typeof value !== "string" || !value.trim()) throw new Error(`Worker inference turn ${field} must be a non-empty string`);
	return value.trim();
}
function nonNegativeInteger(value, field) {
	if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`Worker inference turn ${field} must be a non-negative integer`);
	return value;
}
function normalizeRequestHash(value) {
	if (typeof value !== "string" || !REQUEST_HASH_PATTERN.test(value)) throw new Error("Worker inference turn request hash must be lowercase SHA-256 hex");
	return value;
}
function normalizeInput(input, nowMs) {
	return {
		environmentId: required(input.environmentId, "environment id"),
		sessionId: required(input.sessionId, "session id"),
		runEpoch: nonNegativeInteger(input.runEpoch, "run epoch"),
		runId: required(input.runId, "run id"),
		turnId: required(input.turnId, "turn id"),
		requestHash: normalizeRequestHash(input.requestHash),
		nowMs: nonNegativeInteger(nowMs, "timestamp")
	};
}
function parseTerminalJson(value) {
	let parsed;
	try {
		parsed = JSON.parse(value);
	} catch (error) {
		throw new Error("Worker inference cached terminal outcome is invalid", { cause: error });
	}
	if (!require_worker_inference.validateWorkerInferenceTerminalOutcome(parsed)) throw new Error("Worker inference cached terminal outcome is invalid");
	return parsed;
}
function serializeTerminalOutcome(outcome) {
	if (!require_worker_inference.validateWorkerInferenceTerminalOutcome(outcome)) throw new Error("Worker inference terminal outcome is invalid");
	const serialized = JSON.stringify(outcome);
	if (!serialized) throw new Error("Worker inference terminal outcome is not serializable");
	return serialized;
}
const query = (db) => require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
function findTurn(db, input) {
	return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, query(db).selectFrom("worker_inference_turns").selectAll().where("session_id", "=", input.sessionId).where("run_epoch", "=", input.runEpoch).where("run_id", "=", input.runId).where("turn_id", "=", input.turnId));
}
function findPendingTurn(db, input) {
	return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, query(db).selectFrom("worker_inference_turns").selectAll().where("session_id", "=", input.sessionId).where("run_epoch", "=", input.runEpoch).where("run_id", "=", input.runId).where("state", "=", "pending"));
}
function classifyExistingTurn(row, input) {
	if (!row) return;
	if (row.environment_id !== input.environmentId || row.request_hash !== input.requestHash) return {
		kind: "rejected",
		reason: "conflict"
	};
	if (row.state === "pending" && row.terminal_json === null) return { kind: "recover" };
	if (row.state === "terminal" && row.terminal_json !== null) return {
		kind: "replay",
		outcome: parseTerminalJson(row.terminal_json)
	};
	throw new Error("Worker inference turn row has invalid terminal state");
}
function insertPendingTurn(db, input) {
	const turn = {
		session_id: input.sessionId,
		run_epoch: input.runEpoch,
		run_id: input.runId,
		turn_id: input.turnId,
		environment_id: input.environmentId,
		request_hash: input.requestHash,
		state: "pending",
		terminal_json: null,
		created_at_ms: input.nowMs,
		updated_at_ms: input.nowMs
	};
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, query(db).insertInto("worker_inference_turns").values(turn));
}
function deleteTurn(db, row) {
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, query(db).deleteFrom("worker_inference_turns").where("session_id", "=", row.session_id).where("run_epoch", "=", row.run_epoch).where("run_id", "=", row.run_id).where("turn_id", "=", row.turn_id).where("state", "=", "terminal"));
}
function pruneTerminalTurns(params) {
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(params.db, query(params.db).selectFrom("worker_inference_turns").selectAll().where("state", "=", "terminal").orderBy("updated_at_ms", "desc").orderBy("session_id", "asc").orderBy("run_epoch", "desc").orderBy("run_id", "asc").orderBy("turn_id", "asc")).rows;
	const isPreserved = (row) => params.preserve !== void 0 && row.session_id === params.preserve.sessionId && row.run_epoch === params.preserve.runEpoch && row.run_id === params.preserve.runId && row.turn_id === params.preserve.turnId;
	rows.sort((left, right) => Number(isPreserved(right)) - Number(isPreserved(left)));
	const cutoffMs = Math.max(0, params.nowMs - params.policy.maxAgeMs);
	let retainedRows = 0;
	let retainedBytes = 0;
	for (const row of rows) {
		const terminalBytes = Buffer.byteLength(row.terminal_json ?? "", "utf8");
		const preserve = isPreserved(row);
		const expired = row.updated_at_ms < cutoffMs;
		const exceedsRows = retainedRows >= params.policy.maxRows;
		const exceedsBytes = retainedRows > 0 && retainedBytes + terminalBytes > params.policy.maxBytes;
		if (!preserve && (expired || exceedsRows || exceedsBytes)) {
			deleteTurn(params.db, row);
			continue;
		}
		retainedRows += 1;
		retainedBytes += terminalBytes;
	}
}
function createWorkerInferenceStore(options = {}) {
	const path = (options.database ?? require_openclaw_state_db.openOperatorStateDatabase()).path;
	const now = options.now ?? Date.now;
	const retention = {
		...DEFAULT_RETENTION,
		...options.retention
	};
	const write = (operation) => require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => operation(db), { path });
	const begin = (rawInput) => {
		const input = normalizeInput(rawInput, now());
		return write((db) => {
			pruneTerminalTurns({
				db,
				nowMs: input.nowMs,
				policy: retention
			});
			const existing = classifyExistingTurn(findTurn(db, input), input);
			if (existing) return existing;
			if (findPendingTurn(db, input)) return {
				kind: "rejected",
				reason: "conflict"
			};
			insertPendingTurn(db, input);
			return { kind: "claimed" };
		});
	};
	const complete = (rawInput) => {
		const input = normalizeInput(rawInput, now());
		const terminalJson = serializeTerminalOutcome(rawInput.outcome);
		return write((db) => {
			const existing = classifyExistingTurn(findTurn(db, input), input);
			if (!existing) throw new Error("Worker inference turn must begin before terminal completion");
			if (existing.kind === "rejected") throw new Error(`Worker inference terminal completion rejected: ${existing.reason}`);
			if (existing.kind === "replay") return existing.outcome;
			if (require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, query(db).updateTable("worker_inference_turns").set({
				state: "terminal",
				terminal_json: terminalJson,
				updated_at_ms: input.nowMs
			}).where("session_id", "=", input.sessionId).where("run_epoch", "=", input.runEpoch).where("run_id", "=", input.runId).where("turn_id", "=", input.turnId).where("environment_id", "=", input.environmentId).where("request_hash", "=", input.requestHash).where("state", "=", "pending")).numAffectedRows !== 1n) throw new Error("Worker inference turn changed during terminal completion");
			pruneTerminalTurns({
				db,
				nowMs: input.nowMs,
				policy: retention,
				preserve: input
			});
			return rawInput.outcome;
		});
	};
	const cancelPending = (params) => {
		const nowMs = nonNegativeInteger(now(), "timestamp");
		const terminalJson = serializeTerminalOutcome(params.outcome);
		const identity = {
			environmentId: required(params.environmentId, "environment id"),
			sessionId: required(params.sessionId, "session id"),
			runEpoch: nonNegativeInteger(params.runEpoch, "run epoch"),
			runId: required(params.runId, "run id"),
			turnId: required(params.turnId, "turn id")
		};
		write((db) => {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, query(db).updateTable("worker_inference_turns").set({
				state: "terminal",
				terminal_json: terminalJson,
				updated_at_ms: nowMs
			}).where("session_id", "=", identity.sessionId).where("run_epoch", "=", identity.runEpoch).where("run_id", "=", identity.runId).where("turn_id", "=", identity.turnId).where("environment_id", "=", identity.environmentId).where("state", "=", "pending"));
			pruneTerminalTurns({
				db,
				nowMs,
				policy: retention,
				preserve: identity
			});
		});
	};
	const recoverPending = (outcome) => {
		const nowMs = nonNegativeInteger(now(), "timestamp");
		const terminalJson = serializeTerminalOutcome(outcome);
		write((db) => {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, query(db).updateTable("worker_inference_turns").set({
				state: "terminal",
				terminal_json: terminalJson,
				updated_at_ms: nowMs
			}).where("state", "=", "pending"));
			pruneTerminalTurns({
				db,
				nowMs,
				policy: retention
			});
		});
	};
	return {
		begin,
		cancelPending,
		complete,
		recoverPending
	};
}
//#endregion
//#region src/gateway/worker-environments/inference.ts
const DEFAULT_REQUEST_MAX_BYTES = require_worker_inference.WORKER_PROTOCOL_MAX_INFERENCE_PAYLOAD_BYTES;
const MAX_PROVIDER_OPERATIONS_PER_SESSION = 2;
function safeRevalidate(revalidate) {
	try {
		return revalidate?.() ?? null;
	} catch {
		return "provider-error";
	}
}
function activeKey(sessionId, runId) {
	return JSON.stringify([sessionId, runId]);
}
function trySend(sink, frame) {
	try {
		sink.send(frame);
		return true;
	} catch {
		return false;
	}
}
function terminalError(reason, outcome) {
	const usage = outcome?.type === "done" ? outcome.message.usage : outcome?.type === "error" ? outcome.usage : void 0;
	return {
		type: "error",
		reason,
		message: (() => {
			switch (reason) {
				case "model-not-approved": return "Model is not approved";
				case "invalid-context": return "Inference context is invalid";
				case "epoch-mismatch": return "Inference ownership changed";
				case "session-not-attached": return "Session is not attached";
				case "provider-error": return "Provider request failed";
				case "cancelled": return "Inference cancelled";
			}
			return "Provider request failed";
		})(),
		...usage ? { usage } : {}
	};
}
function validFrameBytes(frame, validate) {
	const measured = require_json_utf8_bytes.boundedJsonUtf8Bytes(frame, require_worker_inference.WORKER_PROTOCOL_MAX_INFERENCE_PAYLOAD_BYTES);
	if (measured.complete && measured.bytes <= 26214400 && validate(frame)) return measured.bytes;
	return null;
}
function terminalFrame(entry, outcome, seq = entry.seq + 1) {
	return {
		type: "event",
		event: "worker.inference.terminal",
		payload: {
			runEpoch: entry.request.runEpoch,
			sessionId: entry.request.sessionId,
			runId: entry.request.runId,
			turnId: entry.request.turnId,
			seq,
			outcome
		}
	};
}
function normalizeTerminalOutcome(entry, outcome) {
	if (!require_worker_inference.validateWorkerInferenceTerminalOutcome(outcome) || validFrameBytes(terminalFrame(entry, outcome), require_worker_inference.validateWorkerInferenceTerminalFrame) === null) return terminalError("provider-error");
	return outcome;
}
function matchesIdentity(identity, request) {
	if (identity.sessionId !== request.sessionId) return "session-not-attached";
	if (identity.ownerEpoch !== request.runEpoch) return "epoch-mismatch";
	return null;
}
function sameTurn(active, identity, request) {
	return active.identity.environmentId === identity.environmentId && active.request.sessionId === request.sessionId && active.request.runEpoch === request.runEpoch && active.request.runId === request.runId && active.request.turnId === request.turnId;
}
function createWorkerInferenceManager(options) {
	const store = options.store ?? createWorkerInferenceStore();
	const requestMaxBytes = options.requestMaxBytes ?? DEFAULT_REQUEST_MAX_BYTES;
	const streamMaxBytes = options.streamMaxBytes ?? 26214400;
	const now = options.now ?? Date.now;
	const active = /* @__PURE__ */ new Map();
	const operations = /* @__PURE__ */ new Map();
	let stopping = false;
	store.recoverPending(terminalError("provider-error"));
	const processFence = (entry) => {
		if (entry.abortReason) return entry.abortReason;
		if (now() >= entry.identity.credentialExpiresAtMs) return "session-not-attached";
		const bindingError = matchesIdentity(entry.identity, entry.request);
		if (bindingError) return bindingError;
		const key = activeKey(entry.request.sessionId, entry.request.runId);
		if (active.get(key) !== entry) return "cancelled";
		return null;
	};
	const durableFence = (entry) => {
		const currentError = processFence(entry);
		if (currentError) return currentError;
		const revalidationError = safeRevalidate(entry.revalidate);
		if (revalidationError) {
			entry.abortReason = revalidationError;
			entry.controller.abort();
			return revalidationError;
		}
		return null;
	};
	const abortEntry = (entry, reason) => {
		if (!entry.abortReason) entry.abortReason = reason;
		if (!entry.controller.signal.aborted) entry.controller.abort();
	};
	const sendTerminal = (entry, outcome) => {
		entry.seq += 1;
		trySend(entry.sink, terminalFrame(entry, outcome, entry.seq));
	};
	const settleAbort = (entry, reason) => {
		if (entry.settled) return true;
		abortEntry(entry, reason);
		clearTimeout(entry.credentialExpiryTimer);
		delete entry.credentialExpiryTimer;
		let outcome;
		try {
			outcome = store.complete({
				...entry.storeInput,
				outcome: terminalError(entry.abortReason ?? reason)
			});
		} catch {
			return false;
		}
		entry.settled = true;
		const key = activeKey(entry.request.sessionId, entry.request.runId);
		if (active.get(key) === entry) {
			active.delete(key);
			sendTerminal(entry, outcome);
		}
		return true;
	};
	const finish = (entry, rawOutcome) => {
		if (entry.settled) return;
		clearTimeout(entry.credentialExpiryTimer);
		delete entry.credentialExpiryTimer;
		const fence = durableFence(entry);
		const outcome = normalizeTerminalOutcome(entry, fence ? terminalError(fence, rawOutcome) : rawOutcome);
		let storedOutcome;
		try {
			storedOutcome = store.complete({
				...entry.storeInput,
				outcome
			});
		} catch {
			entry.settled = true;
			const key = activeKey(entry.request.sessionId, entry.request.runId);
			if (active.get(key) === entry) active.delete(key);
			return;
		}
		entry.settled = true;
		const key = activeKey(entry.request.sessionId, entry.request.runId);
		if (active.get(key) === entry) {
			active.delete(key);
			sendTerminal(entry, storedOutcome);
		}
	};
	const executeEntry = async (entry) => {
		const initialFence = durableFence(entry);
		if (initialFence) {
			finish(entry, terminalError(initialFence));
			return;
		}
		let outcome;
		try {
			const config = options.getConfig?.();
			outcome = await options.execute({
				identity: entry.identity,
				request: entry.request,
				signal: entry.controller.signal,
				emit: (event) => {
					const fence = processFence(entry);
					if (fence) {
						abortEntry(entry, fence);
						return;
					}
					const nextSeq = entry.seq + 1;
					const frame = {
						type: "event",
						event: "worker.inference.event",
						payload: {
							runEpoch: entry.request.runEpoch,
							sessionId: entry.request.sessionId,
							runId: entry.request.runId,
							turnId: entry.request.turnId,
							seq: nextSeq,
							event
						}
					};
					const frameBytes = validFrameBytes(frame, require_worker_inference.validateWorkerInferenceEventFrame);
					if (frameBytes === null || entry.streamedBytes + frameBytes > streamMaxBytes) {
						settleAbort(entry, "provider-error");
						return;
					}
					if (!trySend(entry.sink, frame)) {
						settleAbort(entry, "provider-error");
						return;
					}
					entry.streamedBytes += frameBytes;
					entry.seq = nextSeq;
				},
				isCurrent: () => processFence(entry) === null,
				...config ? { config } : {}
			});
		} catch {
			outcome = terminalError(entry.abortReason ?? "provider-error");
		}
		finish(entry, outcome);
	};
	const launchEntry = (entry) => {
		if (entry.launched || entry.settled) return;
		entry.launched = true;
		const scheduleExpiry = () => {
			const expiresInMs = entry.identity.credentialExpiresAtMs - now();
			if (expiresInMs <= 0) {
				settleAbort(entry, "session-not-attached");
				return;
			}
			entry.credentialExpiryTimer = setTimeout(scheduleExpiry, Math.min(expiresInMs, 2147483647));
			entry.credentialExpiryTimer.unref?.();
		};
		scheduleExpiry();
		const operation = require_gateway_work_admission.runWithGatewayIndependentRootWorkContinuation(() => executeEntry(entry)).catch(() => {
			finish(entry, terminalError(entry.abortReason ?? "provider-error"));
		});
		operations.set(operation, entry.request.sessionId);
		operation.then(() => operations.delete(operation), () => operations.delete(operation));
	};
	const start = (params) => {
		if (stopping) return {
			ok: false,
			reason: "cancelled"
		};
		const identityError = matchesIdentity(params.identity, params.request);
		if (identityError) return {
			ok: false,
			reason: identityError
		};
		const revalidationError = safeRevalidate(params.revalidate);
		if (revalidationError) return {
			ok: false,
			reason: revalidationError
		};
		const measured = require_json_utf8_bytes.boundedJsonUtf8Bytes(params.request, requestMaxBytes);
		if (!measured.complete || measured.bytes > requestMaxBytes) return {
			ok: false,
			reason: "invalid-context"
		};
		const serialized = require_stable_stringify.stableStringify(params.request);
		const hash = (0, node_crypto.createHash)("sha256").update(serialized).digest("hex");
		const key = activeKey(params.request.sessionId, params.request.runId);
		const existing = active.get(key);
		if (existing) {
			if (sameTurn(existing, params.identity, params.request) && existing.requestHash === hash && !existing.settled) {
				const retryEntry = existing;
				retryEntry.identity = params.identity;
				retryEntry.sink = params.sink;
				if (params.revalidate) retryEntry.revalidate = params.revalidate;
				else delete retryEntry.revalidate;
				return {
					ok: true,
					result: { status: "accepted" },
					launch: () => launchEntry(retryEntry)
				};
			}
			const staleFence = durableFence(existing);
			if (!staleFence) return {
				ok: false,
				reason: "invalid-context"
			};
			settleAbort(existing, staleFence);
			return {
				ok: false,
				reason: "invalid-context"
			};
		}
		for (const concurrent of active.values()) {
			if (concurrent.request.sessionId !== params.request.sessionId) continue;
			const staleFence = durableFence(concurrent);
			if (!staleFence) return {
				ok: false,
				reason: "invalid-context"
			};
			settleAbort(concurrent, staleFence);
			return {
				ok: false,
				reason: "invalid-context"
			};
		}
		const storeInput = {
			environmentId: params.identity.environmentId,
			sessionId: params.request.sessionId,
			runEpoch: params.request.runEpoch,
			runId: params.request.runId,
			turnId: params.request.turnId,
			requestHash: hash
		};
		let begin;
		try {
			begin = store.begin(storeInput);
		} catch {
			return {
				ok: false,
				reason: "provider-error"
			};
		}
		if (begin.kind === "rejected") return {
			ok: false,
			reason: "invalid-context"
		};
		const replayResult = (cachedOutcome) => {
			let launched = false;
			return {
				ok: true,
				result: { status: "replayed" },
				launch: () => {
					if (launched) return;
					launched = true;
					const fence = safeRevalidate(params.revalidate);
					const frame = {
						type: "event",
						event: "worker.inference.terminal",
						payload: {
							runEpoch: params.request.runEpoch,
							sessionId: params.request.sessionId,
							runId: params.request.runId,
							turnId: params.request.turnId,
							seq: 1,
							outcome: fence ? terminalError(fence) : cachedOutcome
						}
					};
					trySend(params.sink, frame);
				}
			};
		};
		if (begin.kind === "replay") return replayResult(begin.outcome);
		if (begin.kind === "recover") {
			const outcome = terminalError("provider-error");
			let storedOutcome;
			try {
				storedOutcome = store.complete({
					...storeInput,
					outcome
				});
			} catch {
				return {
					ok: false,
					reason: "provider-error"
				};
			}
			return replayResult(storedOutcome);
		}
		let runningForSession = 0;
		for (const sessionId of operations.values()) if (sessionId === params.request.sessionId) runningForSession += 1;
		if (runningForSession >= MAX_PROVIDER_OPERATIONS_PER_SESSION) try {
			return replayResult(store.complete({
				...storeInput,
				outcome: terminalError("provider-error")
			}));
		} catch {
			return {
				ok: false,
				reason: "provider-error"
			};
		}
		const entry = {
			identity: params.identity,
			request: params.request,
			requestHash: hash,
			storeInput,
			sink: params.sink,
			...params.revalidate ? { revalidate: params.revalidate } : {},
			controller: new AbortController(),
			seq: 0,
			streamedBytes: 0,
			launched: false,
			settled: false
		};
		active.set(key, entry);
		return {
			ok: true,
			result: { status: "accepted" },
			launch: () => launchEntry(entry)
		};
	};
	const cancel = (params) => {
		const identityError = matchesIdentity(params.identity, params.request);
		if (identityError) return {
			ok: false,
			reason: identityError
		};
		const revalidationError = safeRevalidate(params.revalidate);
		if (revalidationError) return {
			ok: false,
			reason: revalidationError
		};
		const entry = active.get(activeKey(params.request.sessionId, params.request.runId));
		if (entry && sameTurn(entry, params.identity, params.request)) {
			if (!settleAbort(entry, "cancelled")) return {
				ok: false,
				reason: "provider-error"
			};
		} else try {
			store.cancelPending({
				environmentId: params.identity.environmentId,
				sessionId: params.request.sessionId,
				runEpoch: params.request.runEpoch,
				runId: params.request.runId,
				turnId: params.request.turnId,
				outcome: terminalError("cancelled")
			});
		} catch {
			return {
				ok: false,
				reason: "provider-error"
			};
		}
		return {
			ok: true,
			result: { status: "cancelled" }
		};
	};
	const cancelWhere = (predicate, reason) => {
		for (const entry of active.values()) if (predicate(entry)) settleAbort(entry, reason);
	};
	const cancelEnvironment = (environmentId, reason = "session-not-attached") => {
		cancelWhere((entry) => entry.identity.environmentId === environmentId, reason);
	};
	const cancelSession = (sessionId, runId) => {
		const cancelledRunIds = /* @__PURE__ */ new Set();
		for (const entry of active.values()) if (entry.request.sessionId === sessionId && (runId === void 0 || entry.request.runId === runId)) cancelledRunIds.add(entry.request.runId);
		cancelWhere((entry) => entry.request.sessionId === sessionId && (runId === void 0 || entry.request.runId === runId), "cancelled");
		return [...cancelledRunIds].toSorted();
	};
	const hasSession = (sessionId, runId) => [...active.values()].some((entry) => entry.request.sessionId === sessionId && (runId === void 0 || entry.request.runId === runId));
	const resolveSessionIdForRunId = (runId) => {
		const sessionIds = /* @__PURE__ */ new Set();
		for (const entry of active.values()) if (entry.request.runId === runId) sessionIds.add(entry.request.sessionId);
		return sessionIds.size === 1 ? sessionIds.values().next().value : void 0;
	};
	const stop = async () => {
		stopping = true;
		cancelWhere(() => true, "provider-error");
		await (0, _openclaw_fs_safe_advanced.withTimeout)(Promise.allSettled(operations.keys()), options.stopDrainMs ?? 5e3, "Worker inference shutdown").catch(() => void 0);
	};
	return {
		start,
		cancel,
		cancelEnvironment,
		cancelSession,
		hasSession,
		resolveSessionIdForRunId,
		stop
	};
}
//#endregion
//#region src/gateway/worker-environments/service-validation.ts
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function inspectionStatus(value) {
	if (!isRecord(value)) throw new Error("Worker provider returned an invalid inspection result");
	const status = value.status;
	if (status !== "active" && status !== "destroyed" && status !== "unknown") throw new Error("Worker provider returned an invalid inspection status");
	return status;
}
function requireWorkerLease(value) {
	if (!isRecord(value) || typeof value.leaseId !== "string" || !value.leaseId.trim() || !isRecord(value.ssh)) throw new Error("Worker provider returned an invalid provision result");
	return {
		leaseId: value.leaseId.trim(),
		ssh: require_store.normalizeWorkerSshEndpoint(value.ssh)
	};
}
function boundedWorkerError(error) {
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(require_redact.redactSensitiveText(require_errors.formatErrorMessage(error), { mode: "tools" }).replace(/\s+/g, " ").trim() || "unknown error", 1024);
}
//#endregion
//#region src/gateway/worker-environments/service.ts
var service_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	createWorkerEnvironmentService: () => createWorkerEnvironmentService,
	workerEnvironmentIdForIdempotencyKey: () => workerEnvironmentIdForIdempotencyKey
});
var WorkerEnvironmentServiceError = class extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
const serviceError = (code, message) => new WorkerEnvironmentServiceError(code, message);
const ORPHANED_LEASE_ERROR = "Worker provider no longer recognizes the lease";
const STALE_ATTACHED_BUNDLE_ERROR = "Attached worker build no longer matches the Gateway";
function workerEnvironmentIdempotencyDigest(idempotencyKey) {
	return (0, node_crypto.createHash)("sha256").update(idempotencyKey).digest("hex");
}
function workerEnvironmentIdForIdempotencyKey(idempotencyKey) {
	return `worker:${workerEnvironmentIdempotencyDigest(idempotencyKey).slice(0, 32)}`;
}
function requireWorkerProfile(value) {
	const error = require_zod_schema.validateCloudWorkerProfileSettings(value);
	if (error) throw serviceError("invalid_profile", error);
	return value;
}
function createWorkerEnvironmentService(options) {
	const { store } = options;
	const tunnels = options.tunnelManager;
	const warn = (message) => options.logger?.warn(message);
	const operations = new require_keyed_async_queue.KeyedAsyncQueue();
	const activeOperations = /* @__PURE__ */ new Set();
	const pendingCredentials = /* @__PURE__ */ new Map();
	const observedAckCursors = /* @__PURE__ */ new Map();
	const pendingTerminalTurnFences = /* @__PURE__ */ new Map();
	const terminalTurnFences = /* @__PURE__ */ new Map();
	const now = options.now ?? Date.now;
	const inference = createWorkerInferenceManager({
		execute: options.executeInference,
		getConfig: options.getConfig,
		now,
		...options.inferenceStore ? { store: options.inferenceStore } : {}
	});
	let reconcileInFlight;
	let interval;
	let unsubscribeSessionIdentityMutation;
	let stopping = false;
	const placementBinding = (identity) => {
		if (!identity.sessionId || !identity.runId) return;
		return {
			sessionId: identity.sessionId,
			environmentId: identity.environmentId,
			ownerEpoch: identity.ownerEpoch,
			runId: identity.runId
		};
	};
	const processTurnBinding = (identity) => {
		const placement = placementBinding(identity);
		return placement ? {
			...placement,
			credentialHash: identity.credentialHash
		} : void 0;
	};
	const matchesTurnBinding = (left, right) => left.sessionId === right.sessionId && left.environmentId === right.environmentId && left.ownerEpoch === right.ownerEpoch && left.runId === right.runId && require_secret_equal.safeEqualSecret(left.credentialHash, right.credentialHash);
	const recordAckCursor = (binding, cursor) => {
		const current = observedAckCursors.get(binding.sessionId);
		const currentTurn = current && matchesTurnBinding(current, binding) ? current : void 0;
		const next = {
			...binding,
			transcriptSeq: "transcriptSeq" in cursor ? Math.max(currentTurn?.transcriptSeq ?? 0, cursor.transcriptSeq) : currentTurn?.transcriptSeq ?? 0,
			liveSeq: "liveSeq" in cursor ? Math.max(currentTurn?.liveSeq ?? 0, cursor.liveSeq) : currentTurn?.liveSeq ?? 0
		};
		observedAckCursors.set(binding.sessionId, next);
		return next;
	};
	const observedAckCursorFor = (binding) => {
		const observed = observedAckCursors.get(binding.sessionId);
		return observed && matchesTurnBinding(observed, binding) ? observed : void 0;
	};
	const validateWorkerPlacement = (identity) => {
		if (!options.placementStore) return {
			durableClaim: false,
			valid: true
		};
		if (identity.sessionId === null && identity.runId === null) return {
			durableClaim: false,
			valid: true
		};
		const binding = placementBinding(identity);
		const valid = binding ? options.placementStore.validateWorkerTurn(binding) : false;
		return {
			durableClaim: valid,
			valid
		};
	};
	const isTerminalLiveEvent = (request) => request.event.kind === "lifecycle" && (request.event.payload.phase === "end" || request.event.payload.phase === "error" && (request.event.payload.aborted === true || request.event.payload.fallbackExhaustedFailure === true));
	const project = (record) => ({
		...record,
		tunnelStatus: tunnels?.status(record.environmentId) ?? "stopped"
	});
	const move = (r, to, patch) => {
		const next = store.transition({
			environmentId: r.environmentId,
			from: r.state,
			to,
			patch
		});
		if (to !== "ready" && to !== "idle" && to !== "attached") pendingCredentials.delete(r.environmentId);
		if (to !== "attached") {
			inference.cancelEnvironment(r.environmentId);
			options.liveEvents?.clearEnvironment(r.environmentId);
		}
		return next;
	};
	const saveError = (r, error) => {
		if (r.teardownTerminalState === "failed" && r.lastError) return r;
		return store.recordError({
			environmentId: r.environmentId,
			state: r.state,
			error: boundedWorkerError(error)
		});
	};
	const inState = (r, ...states) => states.includes(r.state);
	const withLock = (environmentId, task) => {
		const operation = operations.enqueue(environmentId, task);
		activeOperations.add(operation);
		const release = () => activeOperations.delete(operation);
		operation.then(release, release);
		return operation;
	};
	const callProvider = (run) => (0, _openclaw_fs_safe_advanced.withTimeout)(Promise.resolve().then(run), options.providerCallTimeoutMs ?? 3e5, "Worker provider operation");
	const callBootstrap = async (run) => {
		const controller = new AbortController();
		const operation = Promise.resolve().then(() => run(controller.signal));
		try {
			return await (0, _openclaw_fs_safe_advanced.withTimeout)(operation, options.bootstrapCallTimeoutMs ?? 35 * 6e4, "Worker bootstrap operation");
		} catch (error) {
			controller.abort();
			await operation.catch(() => void 0);
			throw error;
		}
	};
	const lifecycleLease = (record, leaseId) => ({
		leaseId,
		profile: requireWorkerProfile(record.profileSnapshot.settings)
	});
	const identityResolverFor = (record, provider, leaseId) => {
		const profile = requireWorkerProfile(record.profileSnapshot.settings);
		const resolveSshIdentity = options.resolveSshIdentity;
		return async (keyRef) => {
			if (!resolveSshIdentity) throw new Error("Worker SSH identity resolution is unavailable");
			return await callProvider(() => resolveSshIdentity({
				provider,
				leaseId,
				profile,
				keyRef
			}));
		};
	};
	const providerFor = (providerId) => {
		const provider = options.resolveProvider(providerId);
		if (provider) return provider;
		throw serviceError("provider_not_found", `Worker provider is unavailable: ${providerId}`);
	};
	const installFor = (record) => {
		const install = record.profileSnapshot.install;
		if (install === void 0 || install === "bundle") return "bundle";
		if (install === "npm") return "npm";
		throw serviceError("invalid_profile", "Worker profile has an invalid install method");
	};
	const prepareInstallation = (record) => options.prepareInstallation(installFor(record));
	const credentialExpiry = () => {
		const ttlMs = options.workerCredentialTtlMs ?? 6e5;
		if (!Number.isSafeInteger(ttlMs) || ttlMs < 1) throw serviceError("invalid_state", "Worker credential lifetime is invalid");
		const expiresAtMs = now() + ttlMs;
		if (!Number.isSafeInteger(expiresAtMs)) throw serviceError("invalid_state", "Worker credential expiry is out of range");
		return expiresAtMs;
	};
	const credentialMaterial = () => createWorkerCredentialMaterial(options.generateWorkerCredential);
	const grantFrom = (params) => {
		const record = params.record;
		if (!record) throw serviceError("invalid_state", "Worker credential persistence failed");
		return {
			credential: params.credential,
			deliveryId: record.credentialHash,
			environmentId: record.environmentId,
			bundleHash: record.bundleHash,
			sessionId: record.sessionId,
			rpcSetVersion: record.rpcSetVersion,
			ownerEpoch: record.ownerEpoch,
			expiresAtMs: record.expiresAtMs
		};
	};
	const mintCredentialLocked = (request) => {
		if (store.getCredential(request.environmentId)) inference.cancelEnvironment(request.environmentId);
		const material = credentialMaterial();
		const credential = {
			environmentId: request.environmentId,
			expectedOwnerEpoch: request.ownerEpoch,
			credentialHash: material.credentialHash,
			sessionId: request.sessionId,
			rpcSetVersion: 1,
			expiresAtMs: credentialExpiry()
		};
		const record = store.renewCredential(credential);
		return {
			credentialHash: material.credentialHash,
			grant: grantFrom({
				credential: material.credential,
				record
			})
		};
	};
	const stageCredential = (grant) => {
		pendingCredentials.set(grant.environmentId, grant);
		return grant;
	};
	const finishProvenDestroy = (record) => {
		const destroying = beginDestroy(record);
		if (destroying.teardownTerminalState !== "failed") return move(destroying, "destroyed");
		return move(destroying, "failed", {
			leaseId: null,
			sshEndpoint: null,
			lastError: destroying.lastError ?? "Worker bootstrap failed after provider teardown"
		});
	};
	const failBootstrap = async (record, leaseId, provider, error) => {
		const detail = boundedWorkerError(error);
		const requested = store.requestDestroy({
			environmentId: record.environmentId,
			state: record.state,
			terminalState: "failed",
			lastError: detail
		});
		const draining = move(requested, "draining", { lastError: detail });
		await tunnels?.stop(record.environmentId);
		const destroying = move(draining, "destroying", { lastError: detail });
		try {
			await callProvider(() => provider.destroy(lifecycleLease(record, leaseId)));
		} catch (cleanupError) {
			saveError(destroying, /* @__PURE__ */ new Error(`${detail}; provider teardown pending: ${boundedWorkerError(cleanupError)}`));
			throw serviceError("bootstrap_failure", "Worker bootstrap failed; teardown is pending");
		}
		finishProvenDestroy(destroying);
		throw serviceError("bootstrap_failure", "Worker bootstrap failed");
	};
	const finishBootstrap = async (record, provider, installation) => {
		if (record.state !== "bootstrapping" || !record.leaseId || !record.sshEndpoint) throw serviceError("invalid_state", "Worker bootstrap requires a provisioned SSH lease");
		let receipt;
		try {
			receipt = await callBootstrap((signal) => options.bootstrapWorker({
				sshEndpoint: record.sshEndpoint,
				installation,
				resolveIdentity: identityResolverFor(record, provider, record.leaseId),
				signal
			}));
			if (!verifyWorkerAdmissionHandshake(receipt, installation)) throw new Error("Worker bootstrap receipt does not match the expected build identity");
		} catch (error) {
			return await failBootstrap(record, record.leaseId, provider, error);
		}
		const material = credentialMaterial();
		const ready = move(record, "ready", {
			bootstrapReceipt: receipt,
			credential: {
				credentialHash: material.credentialHash,
				sessionId: null,
				rpcSetVersion: 1,
				expiresAtMs: credentialExpiry()
			}
		});
		const grant = grantFrom({
			credential: material.credential,
			record: store.getCredential(record.environmentId)
		});
		stageCredential(grant);
		return ready;
	};
	const finishProvision = async (record, provider, preparedInstallation) => {
		let lease;
		try {
			const profile = requireWorkerProfile(record.profileSnapshot.settings);
			lease = requireWorkerLease(await callProvider(() => provider.provision(profile, record.provisionOperationId)));
		} catch (error) {
			if (error instanceof WorkerProviderError || error instanceof WorkerEnvironmentServiceError && error.code === "invalid_profile") {
				move(record, "failed", { lastError: boundedWorkerError(error) });
				throw serviceError("invalid_profile", "Worker provider rejected profile");
			}
			saveError(record, error);
			throw serviceError("provider_failure", "Worker provider operation failed");
		}
		const patch = {
			leaseId: lease.leaseId,
			sshEndpoint: lease.ssh
		};
		const bootstrapping = move(record, "bootstrapping", patch);
		if (record.destroyRequestedAtMs !== null) return bootstrapping;
		let installation = preparedInstallation;
		if (!installation) try {
			installation = await prepareInstallation(bootstrapping);
		} catch (error) {
			return await failBootstrap(bootstrapping, lease.leaseId, provider, error);
		}
		return finishBootstrap(bootstrapping, provider, installation);
	};
	const resumeProvision = async (record, provider = providerFor(record.providerId)) => {
		let installation;
		if (record.state === "requested" && record.destroyRequestedAtMs === null) try {
			installation = await prepareInstallation(record);
		} catch (error) {
			move(record, "failed", { lastError: boundedWorkerError(error) });
			throw serviceError("bootstrap_failure", "Worker installation preparation failed");
		}
		const provisioning = record.state === "requested" ? move(record, "provisioning") : record;
		return finishProvision(provisioning, provider, installation);
	};
	const cancelRequested = (record) => move(record, "failed", { lastError: "Provisioning canceled before provider allocation" });
	const beginDrain = (record) => {
		const failurePatch = record.teardownTerminalState === "failed" ? { lastError: record.lastError } : void 0;
		return inState(record, "bootstrapping", "ready", "attached", "idle") ? move(record, "draining", failurePatch) : record;
	};
	const beginDestroy = (record) => {
		const failurePatch = record.teardownTerminalState === "failed" ? { lastError: record.lastError } : void 0;
		const draining = beginDrain(record);
		if (draining.state === "draining") return move(draining, "destroying", failurePatch);
		if (draining.state === "destroying") return draining;
		throw serviceError("invalid_state", `Cannot destroy worker in state: ${record.state}`);
	};
	const finishDestroy = async (r, provider) => {
		if (!r.leaseId) throw serviceError("invalid_state", "Worker environment has no lease");
		const leaseId = r.leaseId;
		const draining = beginDrain(r);
		await tunnels?.stop(r.environmentId);
		const owningProvider = provider ?? providerFor(r.providerId);
		const destroying = beginDestroy(draining);
		try {
			await callProvider(() => owningProvider.destroy(lifecycleLease(r, leaseId)));
		} catch (error) {
			saveError(destroying, error);
			throw serviceError("provider_failure", "Worker provider operation failed");
		}
		return finishProvenDestroy(destroying);
	};
	const ensurePendingCredential = (record, sessionId) => {
		const credential = store.getCredential(record.environmentId);
		const pending = pendingCredentials.get(record.environmentId);
		const credentialIsCurrent = credential?.ownerEpoch === record.ownerEpoch && credential.sessionId === sessionId && credential.expiresAtMs > now();
		const pendingIsCurrent = credentialIsCurrent && pending?.deliveryId === credential.credentialHash && pending.ownerEpoch === record.ownerEpoch && pending.sessionId === sessionId;
		if (credentialIsCurrent && credential.deliveredAtMs !== null) {
			pendingCredentials.delete(record.environmentId);
			return;
		}
		if (pendingIsCurrent) return;
		pendingCredentials.delete(record.environmentId);
		const minted = mintCredentialLocked({
			environmentId: record.environmentId,
			ownerEpoch: record.ownerEpoch,
			sessionId
		});
		stageCredential(minted.grant);
		if (sessionId && credential?.ownerEpoch === record.ownerEpoch) options.liveEvents?.rotateCredential({
			credentialHash: minted.credentialHash,
			environmentId: record.environmentId,
			previousCredentialHash: credential.credentialHash,
			runEpoch: record.ownerEpoch,
			sessionId
		});
	};
	const reconcileRecord = async (initialRecord) => {
		let record = initialRecord;
		if (record.state === "requested" && record.destroyRequestedAtMs !== null) {
			cancelRequested(record);
			return;
		}
		let currentBundle;
		if (record.destroyRequestedAtMs === null && inState(record, "ready", "idle", "attached")) try {
			currentBundle = await options.prepareInstallation("bundle");
			if (record.bootstrapReceipt && verifyWorkerAdmissionHandshake(record.bootstrapReceipt, currentBundle)) {
				const sessionId = record.state === "attached" ? record.attachedSessionIds[0] : null;
				if (record.state !== "attached" || sessionId) {
					ensurePendingCredential(record, sessionId ?? null);
					record = store.get(record.environmentId) ?? record;
				}
			}
		} catch {}
		let provider;
		try {
			provider = providerFor(record.providerId);
		} catch (error) {
			saveError(record, error);
			return;
		}
		const leaseId = record.leaseId;
		if (!leaseId) {
			const provisioned = await resumeProvision(record, provider).catch(() => void 0);
			if (provisioned?.state === "bootstrapping") await finishDestroy(provisioned, provider).catch(() => void 0);
			return;
		}
		const status = await callProvider(() => provider.inspect(lifecycleLease(record, leaseId))).then(inspectionStatus).catch((error) => {
			saveError(record, error);
		});
		if (!status) return;
		const teardownExpected = record.destroyRequestedAtMs !== null || record.state === "destroying";
		if (status === "destroyed" || status === "unknown" && teardownExpected) {
			const requested = record.destroyRequestedAtMs === null ? store.requestDestroy({
				environmentId: record.environmentId,
				state: record.state
			}) : record;
			const draining = beginDrain(requested);
			await tunnels?.stop(record.environmentId);
			finishProvenDestroy(draining);
			return;
		}
		if (status === "unknown") {
			const draining = record.state === "draining" ? record : move(record, "draining", { lastError: ORPHANED_LEASE_ERROR });
			await tunnels?.stop(record.environmentId);
			move(draining, "orphaned", { lastError: ORPHANED_LEASE_ERROR });
			return;
		}
		if (record.destroyRequestedAtMs !== null) {
			await finishDestroy(record, provider).catch(() => void 0);
			return;
		}
		if (record.state === "attached") {
			if (currentBundle && (!record.bootstrapReceipt || !verifyWorkerAdmissionHandshake(record.bootstrapReceipt, currentBundle))) await failBootstrap(record, leaseId, provider, /* @__PURE__ */ new Error(STALE_ATTACHED_BUNDLE_ERROR)).catch(() => void 0);
			return;
		}
		if (record.state === "draining" && record.destroyRequestedAtMs === null) {
			await tunnels?.stop(record.environmentId);
			move(record, "orphaned", { lastError: record.lastError ?? ORPHANED_LEASE_ERROR });
			return;
		}
		if (inState(record, "bootstrapping", "ready", "idle")) {
			let installation = currentBundle;
			try {
				installation ??= await options.prepareInstallation("bundle");
			} catch (error) {
				if (record.bootstrapReceipt && inState(record, "ready", "idle")) {
					saveError(record, error);
					return;
				}
				await failBootstrap(record, leaseId, provider, error).catch(() => void 0);
				return;
			}
			if (record.bootstrapReceipt && verifyWorkerAdmissionHandshake(record.bootstrapReceipt, installation)) {
				ensurePendingCredential(record, null);
				return;
			}
			if (installFor(record) === "npm") try {
				installation = await options.prepareInstallation("npm");
			} catch (error) {
				await failBootstrap(record, leaseId, provider, error).catch(() => void 0);
				return;
			}
			const bootstrapping = record.state === "bootstrapping" ? record : move(record, "bootstrapping");
			await tunnels?.stop(record.environmentId, record.ownerEpoch);
			await finishBootstrap(bootstrapping, provider, installation).catch(() => void 0);
			return;
		}
		if (inState(record, "draining", "destroying")) await finishDestroy(record, provider).catch(() => void 0);
	};
	const create = async (profileId, idempotencyKey) => {
		if (stopping) throw serviceError("invalid_state", "Worker environment service is stopping");
		const normalizedProfileId = profileId.trim();
		if (!normalizedProfileId || normalizedProfileId !== profileId) throw serviceError("invalid_profile", "Worker profile id must be non-empty and trimmed");
		const digest = workerEnvironmentIdempotencyDigest(idempotencyKey);
		const environmentId = `worker:${digest.slice(0, 32)}`;
		return withLock(environmentId, async () => {
			if (stopping) throw serviceError("invalid_state", "Worker environment service is stopping");
			const existing = store.get(environmentId);
			if (existing) {
				if (existing.profileId !== normalizedProfileId) throw serviceError("invalid_profile", "Idempotency key belongs to another profile");
				if (existing.destroyRequestedAtMs !== null) return existing;
				if (!existing.leaseId && inState(existing, "requested", "provisioning")) return resumeProvision(existing);
				return existing;
			}
			const profiles = options.getConfig().cloudWorkers?.profiles;
			if (!profiles || !Object.hasOwn(profiles, normalizedProfileId)) throw serviceError("profile_not_found", `Unknown worker profile: ${normalizedProfileId}`);
			const profile = (0, _gabrielvfonseca_normalization_core.expectDefined)(profiles[normalizedProfileId], "profiles entry at normalized profile id");
			const provider = providerFor(profile.provider);
			const settings = requireWorkerProfile(profile.settings ?? {});
			const intent = store.createIntent({
				environmentId,
				providerId: require_worker_provider_registry.normalizeCapabilityProviderId(provider.id) ?? provider.id,
				profileId: normalizedProfileId,
				profileSnapshot: requireWorkerProfile({
					install: profile.install ?? "bundle",
					settings,
					...profile.lifetime ? { lifetime: profile.lifetime } : {}
				}),
				provisionOperationId: `provision:${digest}`
			});
			return resumeProvision(intent, provider);
		});
	};
	const destroy = async (environmentId, destroyOptions = {}) => {
		if (stopping) throw serviceError("invalid_state", "Worker environment service is stopping");
		return withLock(environmentId, async () => {
			let record = store.get(environmentId);
			if (!record) throw serviceError("environment_not_found", `Unknown worker environment: ${environmentId}`);
			if (inState(record, "destroyed", "failed", "orphaned")) return record;
			if (destroyOptions.requireUnattached && record.attachedSessionIds.length > 0) throw serviceError("invalid_state", "Attached cloud workers must be stopped through sessions.reclaim");
			record = store.requestDestroy({
				environmentId,
				state: record.state
			});
			if (record.state === "requested") return cancelRequested(record);
			if (record.leaseId) record = beginDrain(record);
			if (!record.leaseId) {
				const provider = providerFor(record.providerId);
				record = await resumeProvision(record, provider);
				return finishDestroy(record, provider);
			}
			return finishDestroy(record);
		});
	};
	const attachSession = async (request) => {
		if (stopping) throw serviceError("invalid_state", "Worker environment service is stopping");
		return withLock(request.environmentId, async () => {
			if (stopping) throw serviceError("invalid_state", "Worker environment service is stopping");
			const current = store.get(request.environmentId);
			if (!current) throw serviceError("environment_not_found", `Unknown worker environment: ${request.environmentId}`);
			if (current.state !== "ready" && current.state !== "idle") throw serviceError("invalid_state", `Cannot attach worker in state: ${current.state}`);
			let currentBuild;
			try {
				currentBuild = await options.prepareInstallation("bundle");
			} catch {
				throw serviceError("invalid_state", "Current worker build identity is unavailable");
			}
			if (!current.bootstrapReceipt || !verifyWorkerAdmissionHandshake(current.bootstrapReceipt, currentBuild)) throw serviceError("invalid_state", "Worker must bootstrap the current build before attach");
			const material = credentialMaterial();
			let attached;
			try {
				attached = store.transition({
					environmentId: request.environmentId,
					from: current.state,
					to: "attached",
					expectedOwnerEpoch: request.ownerEpoch,
					patch: {
						attachedSessionIds: [request.sessionId],
						credential: {
							credentialHash: material.credentialHash,
							sessionId: request.sessionId,
							rpcSetVersion: 1,
							expiresAtMs: credentialExpiry()
						}
					}
				});
			} catch (error) {
				if (error instanceof require_store.WorkerSessionAlreadyAttachedError) throw serviceError("invalid_state", error.message);
				throw error;
			}
			if (options.liveEvents) {
				let liveSessionBound;
				try {
					liveSessionBound = options.liveEvents.bindSession({
						environmentId: attached.environmentId,
						runEpoch: attached.ownerEpoch,
						sessionId: request.sessionId
					});
				} catch {
					liveSessionBound = false;
				}
				if (!liveSessionBound) {
					move(attached, "idle");
					await tunnels?.stop(request.environmentId, current.ownerEpoch).catch(() => void 0);
					throw serviceError("invalid_state", "Attached session target is unavailable");
				}
			}
			pendingCredentials.delete(request.environmentId);
			await tunnels?.stop(request.environmentId, current.ownerEpoch);
			return stageCredential(grantFrom({
				credential: material.credential,
				record: store.getCredential(request.environmentId)
			}));
		});
	};
	const startTunnel = async (request) => {
		if (stopping) throw serviceError("invalid_state", "Worker environment service is stopping");
		if (!tunnels) throw serviceError("invalid_state", "Worker tunnel runtime is unavailable");
		let startup;
		await withLock(request.environmentId, async () => {
			if (stopping) throw serviceError("invalid_state", "Worker environment service is stopping");
			const record = store.get(request.environmentId);
			if (!record) throw serviceError("environment_not_found", `Unknown worker environment: ${request.environmentId}`);
			if (!inState(record, "ready", "idle", "attached") || record.destroyRequestedAtMs !== null || !record.leaseId || !record.sshEndpoint) throw serviceError("invalid_state", `Cannot start tunnel in state: ${record.state}`);
			const credential = store.getCredential(request.environmentId);
			if (!credential || credential.ownerEpoch !== request.ownerEpoch || credential.expiresAtMs <= now()) throw serviceError("invalid_state", "Worker tunnel owner credential is not current");
			const gateway = options.resolveWorkerGateway?.();
			if (!gateway) throw serviceError("invalid_state", "Worker gateway ingress is unavailable");
			const provider = providerFor(record.providerId);
			startup = tunnels.start({
				...request,
				gateway,
				ssh: record.sshEndpoint,
				resolveIdentity: identityResolverFor(record, provider, record.leaseId)
			});
		});
		if (!startup) throw serviceError("invalid_state", "Worker tunnel failed to start");
		return await startup;
	};
	const stopTunnel = async (environmentId, ownerEpoch) => {
		await withLock(environmentId, async () => {
			await tunnels?.stop(environmentId, ownerEpoch);
		});
	};
	const reconcilePass = async () => {
		await require_resolve.runTasksWithConcurrency({
			tasks: store.listForReconcile().map((candidate) => () => withLock(candidate.environmentId, async () => {
				const current = store.get(candidate.environmentId);
				if (!current || inState(current, "destroyed", "failed")) return;
				await reconcileRecord(current).catch(() => warn(`Worker environment reconcile failed (${current.environmentId}, ${current.providerId})`));
			})),
			limit: 8
		});
	};
	const reconcileOnce = () => {
		if (stopping) return Promise.resolve();
		return reconcileInFlight ??= reconcilePass().finally(() => {
			reconcileInFlight = void 0;
		});
	};
	const start = () => {
		if (interval || stopping) return;
		unsubscribeSessionIdentityMutation = require_session_lifecycle_events.onSessionIdentityMutation((mutation) => {
			const currentSessionId = "current" in mutation ? mutation.current.sessionId : void 0;
			if (mutation.previous.sessionId && mutation.previous.sessionId !== currentSessionId) inference.cancelSession(mutation.previous.sessionId);
		});
		options.liveEvents?.start();
		interval = setInterval(() => void reconcileOnce().catch(() => warn("Worker environment reconcile sweep failed")), options.reconcileIntervalMs ?? 6e4);
		interval.unref?.();
		reconcileOnce().catch(() => warn("Worker environment startup reconcile failed"));
	};
	const stop = async () => {
		stopping = true;
		clearInterval(interval);
		interval = void 0;
		unsubscribeSessionIdentityMutation?.();
		unsubscribeSessionIdentityMutation = void 0;
		await inference.stop();
		pendingCredentials.clear();
		options.liveEvents?.clear();
		await tunnels?.stopAll();
		const reconciliation = reconcileInFlight;
		if (reconciliation) await Promise.allSettled([reconciliation]);
		while (activeOperations.size > 0) await Promise.allSettled(activeOperations);
		pendingCredentials.clear();
		observedAckCursors.clear();
		pendingTerminalTurnFences.clear();
		terminalTurnFences.clear();
		options.liveEvents?.clear();
	};
	const readPendingCredential = (binding) => {
		if (stopping) return;
		const grant = pendingCredentials.get(binding.environmentId);
		if (!grant || grant.ownerEpoch !== binding.ownerEpoch || grant.sessionId !== binding.sessionId) return;
		const environment = store.get(binding.environmentId);
		const credential = store.getCredential(binding.environmentId);
		const credentialHash = grant.deliveryId;
		const checkedAtMs = now();
		if (!environment || !inState(environment, "ready", "idle", "attached") || environment.destroyRequestedAtMs !== null || environment.ownerEpoch !== binding.ownerEpoch || !credential || credential.credentialHash !== credentialHash || credential.ownerEpoch !== binding.ownerEpoch || credential.sessionId !== binding.sessionId || credential.deliveredAtMs !== null || credential.expiresAtMs <= checkedAtMs) return;
		return {
			checkedAtMs,
			credentialHash,
			grant
		};
	};
	const validateAttachedWorkerRequest = (identity, runEpoch, request) => {
		if (stopping) return {
			ok: false,
			closeReason: "environment-unavailable"
		};
		const placement = validateWorkerPlacement(identity);
		if (!placement.valid) return {
			ok: false,
			closeReason: "placement-mismatch"
		};
		const turnBinding = processTurnBinding(identity);
		const terminalFence = identity.sessionId ? terminalTurnFences.get(identity.sessionId) : void 0;
		if (turnBinding && terminalFence && matchesTurnBinding(terminalFence, turnBinding)) {
			if (!(request.kind === "transcript" && request.seq <= terminalFence.transcriptSeq || request.kind === "live" && request.seq <= terminalFence.liveSeq)) return {
				ok: false,
				closeReason: "placement-mismatch"
			};
		}
		const credential = store.getCredential(identity.environmentId);
		if (!credential || !require_secret_equal.safeEqualSecret(credential.credentialHash, identity.credentialHash)) return {
			ok: false,
			closeReason: "credential-replaced"
		};
		if (now() >= credential.expiresAtMs && !placement.durableClaim) return {
			ok: false,
			closeReason: "credential-expired"
		};
		const environment = store.get(identity.environmentId);
		if (!environment || environment.destroyRequestedAtMs !== null) return {
			ok: false,
			closeReason: "environment-unavailable"
		};
		if (runEpoch !== identity.ownerEpoch || runEpoch !== credential.ownerEpoch || runEpoch !== environment.ownerEpoch) return {
			ok: false,
			reason: "epoch-mismatch"
		};
		if (environment.state !== "attached" || !identity.sessionId || credential.sessionId !== identity.sessionId || environment.attachedSessionIds.length !== 1 || environment.attachedSessionIds[0] !== identity.sessionId) return {
			ok: false,
			reason: "session-not-attached"
		};
		if (turnBinding && terminalFence && !matchesTurnBinding(terminalFence, turnBinding)) terminalTurnFences.delete(turnBinding.sessionId);
		return { ok: true };
	};
	const commitTranscript = (identity, request) => withLock(identity.environmentId, async () => {
		const binding = validateAttachedWorkerRequest(identity, request.runEpoch, {
			kind: "transcript",
			seq: request.seq
		});
		if (!binding.ok) return binding;
		if (!options.applyTranscriptCommit) return {
			ok: false,
			closeReason: "gateway-unavailable"
		};
		const result = await options.applyTranscriptCommit({
			identity,
			request
		});
		const currentBinding = validateAttachedWorkerRequest(identity, request.runEpoch, {
			kind: "transcript",
			seq: request.seq
		});
		if (!currentBinding.ok) return currentBinding;
		if (result.ok || result.reason === "stale-base-leaf") {
			const placement = placementBinding(identity);
			const processTurn = processTurnBinding(identity);
			if (!placement || !processTurn) return {
				ok: false,
				closeReason: "placement-mismatch"
			};
			options.placementStore?.updateAckCursors({
				...placement,
				transcriptSeq: request.seq
			});
			recordAckCursor(processTurn, { transcriptSeq: request.seq });
		}
		return result;
	});
	const applyLiveEvent = (identity, request) => {
		const binding = validateAttachedWorkerRequest(identity, request.runEpoch, {
			kind: "live",
			seq: request.seq
		});
		if (!binding.ok) {
			if ("closeReason" in binding) return binding;
			return {
				ok: false,
				details: { reason: binding.reason }
			};
		}
		if (request.runId !== identity.runId) return {
			ok: false,
			closeReason: "placement-mismatch"
		};
		if (!options.liveEvents) return {
			ok: false,
			closeReason: "gateway-unavailable"
		};
		const result = options.liveEvents.apply({
			identity,
			request
		});
		if (result.ok) {
			const placement = placementBinding(identity);
			const processTurn = processTurnBinding(identity);
			if (!placement || !processTurn) return {
				ok: false,
				closeReason: "placement-mismatch"
			};
			options.placementStore?.updateAckCursors({
				...placement,
				liveSeq: result.result.ackedSeq,
				...isTerminalLiveEvent(request) ? { workspaceResultPending: true } : {}
			});
			recordAckCursor(processTurn, { liveSeq: result.result.ackedSeq });
		}
		return result;
	};
	const pushLiveEvent = async (identity, request) => {
		return await withLock(identity.environmentId, async () => {
			const placement = placementBinding(identity);
			const processTurn = processTurnBinding(identity);
			const observed = processTurn ? observedAckCursorFor(processTurn) : void 0;
			const wasNewSequence = request.seq > (observed?.liveSeq ?? 0);
			const result = applyLiveEvent(identity, request);
			if (!result.ok || !placement || !processTurn) return result;
			const pending = pendingTerminalTurnFences.get(placement.sessionId);
			if (pending && !matchesTurnBinding(pending, processTurn)) pendingTerminalTurnFences.delete(placement.sessionId);
			if (isTerminalLiveEvent(request) && wasNewSequence) pendingTerminalTurnFences.set(placement.sessionId, {
				...processTurn,
				terminalLiveSeq: request.seq
			});
			const terminal = pendingTerminalTurnFences.get(placement.sessionId);
			if (terminal && matchesTurnBinding(terminal, processTurn) && result.result.ackedSeq >= terminal.terminalLiveSeq) {
				terminalTurnFences.set(placement.sessionId, observedAckCursorFor(processTurn) ?? recordAckCursor(processTurn, { liveSeq: result.result.ackedSeq }));
				pendingTerminalTurnFences.delete(placement.sessionId);
			}
			return result;
		});
	};
	const revalidateInference = (identity, request) => {
		if (request.sessionId !== identity.sessionId) return "session-not-attached";
		const binding = validateAttachedWorkerRequest(identity, request.runEpoch, { kind: "inference" });
		return binding.ok ? null : "reason" in binding ? binding.reason : "session-not-attached";
	};
	const startInference = (identity, request, sink) => {
		if (request.sessionId !== identity.sessionId || request.runId !== identity.runId) return {
			ok: false,
			reason: "session-not-attached"
		};
		const binding = validateAttachedWorkerRequest(identity, request.runEpoch, { kind: "inference" });
		if (!binding.ok) return binding;
		return inference.start({
			identity,
			request,
			sink,
			revalidate: () => revalidateInference(identity, request)
		});
	};
	const cancelInference = (identity, request) => {
		if (request.sessionId !== identity.sessionId || request.runId !== identity.runId) return {
			ok: false,
			reason: "session-not-attached"
		};
		const binding = validateAttachedWorkerRequest(identity, request.runEpoch, { kind: "inference" });
		if (!binding.ok) return binding;
		return inference.cancel({
			identity,
			request,
			revalidate: () => revalidateInference(identity, request)
		});
	};
	return {
		list: () => store.list().map(project),
		get: (environmentId) => {
			const record = store.get(environmentId);
			return record ? project(record) : void 0;
		},
		create: async (profileId, idempotencyKey) => project(await create(profileId, idempotencyKey)),
		destroy: async (environmentId) => project(await destroy(environmentId)),
		destroyUnattached: async (environmentId) => project(await destroy(environmentId, { requireUnattached: true })),
		admitWorker: async (admission) => {
			if (stopping) return {
				ok: false,
				reason: "environment-unavailable"
			};
			const preflight = admitWorkerConnection({
				store,
				admission,
				expectedBuild: admission.handshake,
				nowMs: now()
			});
			if (!preflight.ok) return preflight;
			let expectedBuild;
			try {
				expectedBuild = await options.prepareInstallation("bundle");
			} catch {
				return {
					ok: false,
					reason: "environment-unavailable"
				};
			}
			if (stopping) return {
				ok: false,
				reason: "environment-unavailable"
			};
			const admitted = admitWorkerConnection({
				store,
				admission,
				expectedBuild,
				nowMs: now()
			});
			if (!admitted.ok || !options.placementStore || admitted.identity.sessionId === null && admitted.identity.runId === null) return admitted;
			const placement = placementBinding(admitted.identity);
			if (!placement || !options.placementStore.validateWorkerTurn(placement)) return {
				ok: false,
				reason: "placement-mismatch"
			};
			return admitted;
		},
		validateWorkerConnection: (identity) => {
			if (stopping) return "environment-unavailable";
			const placement = validateWorkerPlacement(identity);
			if (!placement.valid) return "placement-mismatch";
			const environmentFailure = validateWorkerConnectionIdentity({
				store,
				identity,
				nowMs: now()
			});
			if (environmentFailure && !(environmentFailure === "credential-expired" && placement.durableClaim)) return environmentFailure;
			return null;
		},
		commitTranscript,
		pushLiveEvent,
		startInference,
		cancelInference,
		cancelInferenceForSession: (params) => inference.cancelSession(params.sessionId, params.runId),
		hasInferenceForSession: (sessionId, runId) => inference.hasSession(sessionId, runId),
		resolveInferenceSessionForRunId: (runId) => inference.resolveSessionIdForRunId(runId),
		attachSession,
		takeMintedCredential: (binding) => readPendingCredential(binding)?.grant,
		acquireTurnCredential: (binding) => withLock(binding.environmentId, async () => {
			const pending = readPendingCredential(binding)?.grant;
			if (pending) return pending;
			const environment = store.get(binding.environmentId);
			if (environment?.state !== "attached" || environment.ownerEpoch !== binding.ownerEpoch || environment.attachedSessionIds.length !== 1 || environment.attachedSessionIds[0] !== binding.sessionId) throw serviceError("invalid_state", "Worker session credential owner is not attached");
			const previous = store.getCredential(binding.environmentId);
			const minted = mintCredentialLocked(binding);
			const grant = stageCredential(minted.grant);
			if (previous?.sessionId === binding.sessionId) options.liveEvents?.rotateCredential({
				credentialHash: minted.credentialHash,
				environmentId: binding.environmentId,
				previousCredentialHash: previous.credentialHash,
				runEpoch: binding.ownerEpoch,
				sessionId: binding.sessionId
			});
			return grant;
		}),
		acknowledgeCredentialDelivery: (claim) => {
			const pending = readPendingCredential(claim);
			if (!pending || pending.grant.deliveryId !== claim.deliveryId) return false;
			store.markCredentialDelivered({
				...claim,
				credentialHash: pending.credentialHash,
				deliveredAtMs: pending.checkedAtMs
			});
			pendingCredentials.delete(claim.environmentId);
			return true;
		},
		startTunnel,
		stopTunnel,
		reconcileOnce,
		start,
		stop
	};
}
//#endregion
Object.defineProperty(exports, "service_exports", {
	enumerable: true,
	get: function() {
		return service_exports;
	}
});
Object.defineProperty(exports, "workerEnvironmentIdForIdempotencyKey", {
	enumerable: true,
	get: function() {
		return workerEnvironmentIdForIdempotencyKey;
	}
});
