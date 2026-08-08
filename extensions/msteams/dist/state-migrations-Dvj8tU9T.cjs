const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./path-safety-D8QlW0vG.cjs");
require("./account-id-Di7YWYh4.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_helpers = require("./helpers-Dw37GavQ.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_parse_json_compat = require("./parse-json-compat-C77_sznm.cjs");
require("./installed-plugin-index-DAAGKjaY.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_installed_plugin_index_store = require("./installed-plugin-index-store-vrROJGFd.cjs");
const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_session_binding_normalization = require("./session-binding-normalization-DSoe9GtS.cjs");
require("./fs-safe-advanced-r6xSCXfB.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_pairing_store_sqlite = require("./pairing-store-sqlite-DarrOyll.cjs");
const require_store = require("./store-BW6t6tIi.cjs");
const require_plugin_state_store = require("./plugin-state-store-BnlgUGbF.cjs");
const require_paths$1 = require("./paths-DsfW3Lup.cjs");
const require_store$1 = require("./store-DCwJguwr.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_session_meta = require("./session-meta-BKZldXXC.cjs");
const require_operator_state_db = require("./operator-state-db-ByOQETIN.cjs");
const require_managed_image_record_store = require("./managed-image-record-store-B6rMSrpG.cjs");
const require_store_record = require("./store-record-BBVFLj9_.cjs");
const require_gateway_lock = require("./gateway-lock-CUpJMYSa.cjs");
const require_doctor_contract_registry = require("./doctor-contract-registry-jnGubuyU.cjs");
const require_push_apns_store = require("./push-apns-store-THiqtBab.cjs");
const require_config = require("./config-BkcSsRJm.cjs");
const require_voicewake_routing = require("./voicewake-routing-DDiTCBkT.cjs");
const require_push_web_store = require("./push-web-store-B4qSNMhe.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let node_zlib = require("node:zlib");
let _openclaw_fs_safe = require("@openclaw/fs-safe");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/infra/legacy-json-object-stream.ts
const JSON_WHITESPACE = /* @__PURE__ */ new Set([
	" ",
	"	",
	"\r",
	"\n"
]);
var JsonCharacterCursor = class {
	constructor(chunks) {
		this.chunk = "";
		this.offset = 0;
		this.chunks = chunks[Symbol.asyncIterator]();
	}
	async fill() {
		while (this.offset >= this.chunk.length) {
			const next = await this.chunks.next();
			if (next.done) return false;
			this.chunk = next.value;
			this.offset = 0;
		}
		return true;
	}
	async peek() {
		return await this.fill() ? this.chunk[this.offset] ?? null : null;
	}
	async take() {
		if (!await this.fill()) return null;
		return this.chunk[this.offset++] ?? null;
	}
	async skipWhitespace() {
		while (true) {
			const next = await this.peek();
			if (next === null || !JSON_WHITESPACE.has(next)) return;
			await this.take();
		}
	}
};
function parseLegacyJson(raw) {
	try {
		return JSON.parse(raw);
	} catch {
		throw new Error("legacy JSON store contains invalid JSON");
	}
}
async function expectCharacter(cursor, expected) {
	await cursor.skipWhitespace();
	if (await cursor.take() !== expected) throw new Error(`expected ${JSON.stringify(expected)} in legacy JSON store`);
}
async function readJsonString(cursor) {
	await cursor.skipWhitespace();
	if (await cursor.take() !== "\"") throw new Error("expected string in legacy JSON store");
	let raw = "\"";
	let escaped = false;
	while (true) {
		const character = await cursor.take();
		if (character === null) throw new Error("unterminated string in legacy JSON store");
		raw += character;
		if (escaped) {
			escaped = false;
			continue;
		}
		if (character === "\\") {
			escaped = true;
			continue;
		}
		if (character === "\"") {
			const parsed = parseLegacyJson(raw);
			if (typeof parsed !== "string") throw new Error("invalid string in legacy JSON store");
			return parsed;
		}
	}
}
async function readJsonObject(cursor) {
	await cursor.skipWhitespace();
	if (await cursor.take() !== "{") throw new Error("legacy JSON entries must be objects");
	let raw = "{";
	let depth = 1;
	let escaped = false;
	let inString = false;
	while (depth > 0) {
		const character = await cursor.take();
		if (character === null) throw new Error("unterminated object in legacy JSON store");
		raw += character;
		if (inString) {
			if (escaped) escaped = false;
			else if (character === "\\") escaped = true;
			else if (character === "\"") inString = false;
			continue;
		}
		if (character === "\"") inString = true;
		else if (character === "{") depth += 1;
		else if (character === "}") depth -= 1;
	}
	return parseLegacyJson(raw);
}
async function parseSinglePropertyObject(params) {
	const cursor = new JsonCharacterCursor(params.chunks);
	await expectCharacter(cursor, "{");
	if (await readJsonString(cursor) !== params.property) throw new Error(`legacy JSON store must contain only ${params.property}`);
	await expectCharacter(cursor, ":");
	await expectCharacter(cursor, "{");
	await cursor.skipWhitespace();
	if (await cursor.peek() !== "}") while (true) {
		const key = await readJsonString(cursor);
		await expectCharacter(cursor, ":");
		params.onEntry(key, await readJsonObject(cursor));
		await cursor.skipWhitespace();
		const separator = await cursor.take();
		if (separator === "}") break;
		if (separator !== ",") throw new Error("expected comma or object end in legacy JSON store");
	}
	else await cursor.take();
	await expectCharacter(cursor, "}");
	await cursor.skipWhitespace();
	if (await cursor.take() !== null) throw new Error("legacy JSON store has trailing content");
}
async function* decodeUtf8Chunks(params) {
	const decoder = new TextDecoder("utf-8", { fatal: true });
	const stream = params.handle.createReadStream({
		autoClose: false,
		start: 0
	});
	for await (const rawChunk of stream) {
		const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk);
		params.hash.update(chunk);
		params.onBytes(chunk.byteLength);
		const text = decoder.decode(chunk, { stream: true });
		if (text) yield text;
	}
	const tail = decoder.decode();
	if (tail) yield tail;
}
function assertStableRead(before, after, bytesRead) {
	if (before.dev !== after.dev || before.ino !== after.ino || before.mtimeMs !== after.mtimeMs || before.size !== after.size || bytesRead !== after.size) throw new Error("legacy JSON store changed while it was being read");
}
/** Hash a safely opened file, optionally parsing its single object property entry by entry. */
async function readLegacyJsonObjectStream(params) {
	const opened = await params.stateRoot.open(params.relativePath, {
		hardlinks: "reject",
		symlinks: "reject"
	});
	const hash = (0, node_crypto.createHash)("sha256");
	let size = 0;
	try {
		const before = opened.stat;
		if (params.property && params.onEntry) await parseSinglePropertyObject({
			chunks: decodeUtf8Chunks({
				handle: opened.handle,
				hash,
				onBytes: (length) => {
					size += length;
				}
			}),
			property: params.property,
			onEntry: params.onEntry
		});
		else {
			const stream = opened.handle.createReadStream({
				autoClose: false,
				start: 0
			});
			for await (const rawChunk of stream) {
				const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk);
				hash.update(chunk);
				size += chunk.byteLength;
			}
		}
		const after = await opened.handle.stat();
		assertStableRead(before, after, size);
		return {
			dev: after.dev,
			ino: after.ino,
			mtimeMs: after.mtimeMs,
			sha256: hash.digest("hex"),
			size
		};
	} catch (error) {
		if (error instanceof TypeError && /encoded data was not valid/i.test(error.message)) throw new Error("legacy JSON store is not valid UTF-8", { cause: error });
		throw error;
	} finally {
		await opened[Symbol.asyncDispose]();
	}
}
//#endregion
//#region src/infra/state-migrations.apns.ts
const LEGACY_APNS_REGISTRATION_PATH = "push/apns-registrations.json";
const APNS_DOCTOR_CLAIM_SUFFIX = ".doctor-importing";
const MIGRATION_KIND$1 = "legacy-apns-registrations-json";
const MIGRATION_LOCK_TIMEOUT_MS$3 = 250;
const MIGRATION_LOCK_POLL_INTERVAL_MS$3 = 25;
const MAX_LEGACY_APNS_UPDATED_AT_MS = 864e13;
const DIRECT_REGISTRATION_KEYS = /* @__PURE__ */ new Set([
	"nodeId",
	"transport",
	"token",
	"topic",
	"environment",
	"updatedAtMs"
]);
const RELAY_REGISTRATION_KEYS = /* @__PURE__ */ new Set([
	"nodeId",
	"transport",
	"relayHandle",
	"sendGrant",
	"installationId",
	"topic",
	"environment",
	"distribution",
	"updatedAtMs",
	"relayOrigin",
	"tokenDebugSuffix"
]);
function resolveLegacyApnsPath(stateDir) {
	return node_path.default.join(stateDir, LEGACY_APNS_REGISTRATION_PATH);
}
function legacyPathMayExist$3(filePath) {
	try {
		node_fs.default.lstatSync(filePath);
		return true;
	} catch (error) {
		return error.code !== "ENOENT";
	}
}
function sourceOrClaimMayExist$3(sourcePath) {
	return legacyPathMayExist$3(sourcePath) || legacyPathMayExist$3(`${sourcePath}${APNS_DOCTOR_CLAIM_SUFFIX}`);
}
/** Detect the retired APNs store only when an explicit Doctor flow opts in. */
function detectLegacyApnsRegistrations(params) {
	const sourcePath = resolveLegacyApnsPath(params.stateDir);
	return {
		sourcePath,
		hasLegacy: params.doctorOnlyStateMigrations === true && sourceOrClaimMayExist$3(sourcePath)
	};
}
function relativeLegacyPath$3(stateDir, filePath) {
	const relativePath = node_path.default.relative(node_path.default.resolve(stateDir), node_path.default.resolve(filePath));
	if (!relativePath || relativePath === ".." || relativePath.startsWith(`..${node_path.default.sep}`) || node_path.default.isAbsolute(relativePath)) throw new Error("legacy APNs path is outside the state directory");
	return relativePath;
}
async function readLegacySourceSnapshot$6(stateRoot, stateDir, sourcePath, onEntry) {
	return {
		sourcePath,
		...await readLegacyJsonObjectStream({
			stateRoot,
			relativePath: relativeLegacyPath$3(stateDir, sourcePath),
			...onEntry ? {
				property: "registrationsByNodeId",
				onEntry
			} : {}
		})
	};
}
function snapshotsMatch(left, right) {
	return left.dev === right.dev && left.ino === right.ino && left.mtimeMs === right.mtimeMs && left.sha256 === right.sha256 && left.size === right.size;
}
function assertOnlyKeys$2(value, allowed) {
	if (Object.keys(value).find((key) => !allowed.has(key))) throw new Error("legacy APNs registration has an unexpected field");
}
function isValidLegacyApnsTimestamp(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= MAX_LEGACY_APNS_UPDATED_AT_MS;
}
function parseLegacyApnsRegistration(rawNodeId, rawRegistration, env) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawRegistration)) throw new Error("legacy APNs registration is not an object");
	const transport = rawRegistration.transport ?? "direct";
	if (transport !== "direct" && transport !== "relay") throw new Error("legacy APNs registration has invalid transport");
	assertOnlyKeys$2(rawRegistration, transport === "relay" ? RELAY_REGISTRATION_KEYS : DIRECT_REGISTRATION_KEYS);
	const normalizedNodeId = require_push_apns_store.normalizeApnsNodeId(rawNodeId);
	if (!require_push_apns_store.isValidApnsNodeId(normalizedNodeId)) throw new Error("legacy APNs registration has an invalid node id");
	if (!isValidLegacyApnsTimestamp(rawRegistration.updatedAtMs)) throw new Error("legacy APNs registration has an invalid updated timestamp");
	const registration = require_push_apns_store.normalizeCanonicalApnsRegistration(transport === "direct" ? {
		...rawRegistration,
		transport,
		environment: require_push_apns_store.normalizeApnsEnvironment(rawRegistration.environment) ?? "sandbox"
	} : {
		...rawRegistration,
		transport
	}, env);
	const invalidRelayOrigin = transport === "relay" && Object.hasOwn(rawRegistration, "relayOrigin") && (registration?.transport !== "relay" || !registration.relayOrigin);
	const invalidTokenDebugSuffix = transport === "relay" && Object.hasOwn(rawRegistration, "tokenDebugSuffix") && typeof rawRegistration.tokenDebugSuffix !== "string";
	if (!registration || registration.nodeId !== normalizedNodeId || invalidRelayOrigin || invalidTokenDebugSuffix) throw new Error("legacy APNs registration is invalid");
	return [normalizedNodeId, registration];
}
function receiptSourceKey(sourcePath) {
	return `apns-json:${(0, node_crypto.createHash)("sha256").update(node_path.default.resolve(sourcePath)).digest("hex")}`;
}
function readMigrationReceipt(sourcePath, env) {
	const sourceKey = receiptSourceKey(sourcePath);
	const { db } = require_openclaw_state_db.openOperatorStateDatabase({ env });
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).selectFrom("migration_sources").select("removed_source").where("source_key", "=", sourceKey));
	return row ? {
		sourceKey,
		removedSource: row.removed_source === 1
	} : null;
}
function importAndRecordReceipt(params) {
	const sourceKey = receiptSourceKey(params.sourcePath);
	const runId = `${sourceKey}:${params.snapshot.sha256.slice(0, 16)}`;
	const now = Date.now();
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		if (require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("migration_sources").select("source_key").where("source_key", "=", sourceKey))) return {
			sourceKey,
			imported: 0,
			preserved: 0,
			suppressed: 0,
			receiptAuthoritative: true
		};
		let imported = 0;
		let preserved = 0;
		let suppressed = 0;
		const expectedNodeIds = [];
		for (const [nodeId, registration] of params.registrations) {
			const existing = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("apns_registrations").selectAll().where("node_id", "=", nodeId));
			const tombstone = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("apns_registration_tombstones").select("node_id").where("node_id", "=", nodeId));
			if (existing && tombstone) throw new Error("APNs state has both a registration and deletion tombstone");
			if (existing) {
				require_push_apns_store.apnsRegistrationFromRow(existing);
				preserved += 1;
				expectedNodeIds.push(nodeId);
			} else if (tombstone) suppressed += 1;
			else {
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("apns_registrations").values(require_push_apns_store.apnsRegistrationToRow(registration)));
				imported += 1;
				expectedNodeIds.push(nodeId);
			}
		}
		for (const nodeId of expectedNodeIds) {
			const verified = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("apns_registrations").selectAll().where("node_id", "=", nodeId));
			if (!verified) throw new Error("SQLite verification failed for an APNs registration");
			require_push_apns_store.apnsRegistrationFromRow(verified);
		}
		const reportJson = JSON.stringify({
			source: MIGRATION_KIND$1,
			target: "apns_registrations",
			sourceSha256: params.snapshot.sha256,
			sourceRecordCount: params.registrations.size,
			importedRecordCount: imported,
			preservedSqliteRecordCount: preserved,
			suppressedDeletedRecordCount: suppressed
		});
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("migration_runs").values({
			id: runId,
			started_at: now,
			finished_at: now,
			status: "completed",
			report_json: reportJson
		}));
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("migration_sources").values({
			source_key: sourceKey,
			migration_kind: MIGRATION_KIND$1,
			source_path: params.sourcePath,
			target_table: "apns_registrations",
			source_sha256: params.snapshot.sha256,
			source_size_bytes: params.snapshot.size,
			source_record_count: params.registrations.size,
			last_run_id: runId,
			status: "completed",
			imported_at: now,
			removed_source: 0,
			report_json: reportJson
		}));
		return {
			sourceKey,
			imported,
			preserved,
			suppressed,
			receiptAuthoritative: false
		};
	}, { env: params.env });
}
function markSourceRemoved(sourceKey, env) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).updateTable("migration_sources").set({ removed_source: 1 }).where("source_key", "=", sourceKey));
	}, { env });
}
async function removePath(params) {
	if (params.removeSource) {
		await params.removeSource(params.sourcePath);
		return;
	}
	await params.stateRoot.remove(relativeLegacyPath$3(params.stateDir, params.sourcePath));
}
async function cleanupReceiptAuthoritativeSources(params) {
	let removed = 0;
	for (const candidate of [params.sourcePath, `${params.sourcePath}${APNS_DOCTOR_CLAIM_SUFFIX}`]) {
		if (!await params.stateRoot.exists(relativeLegacyPath$3(params.stateDir, candidate))) continue;
		await readLegacySourceSnapshot$6(params.stateRoot, params.stateDir, candidate);
		await removePath({
			...params,
			sourcePath: candidate
		});
		removed += 1;
	}
	if (!params.receipt.removedSource || removed > 0) markSourceRemoved(params.receipt.sourceKey, params.env);
	return removed;
}
async function restoreClaim$2(params) {
	const claimPath = `${params.sourcePath}${APNS_DOCTOR_CLAIM_SUFFIX}`;
	try {
		if (!await params.stateRoot.exists(relativeLegacyPath$3(params.stateDir, claimPath))) return null;
		if (await params.stateRoot.exists(relativeLegacyPath$3(params.stateDir, params.sourcePath))) return `source path already exists: ${params.sourcePath}`;
		await params.stateRoot.move(relativeLegacyPath$3(params.stateDir, claimPath), relativeLegacyPath$3(params.stateDir, params.sourcePath));
		return null;
	} catch (error) {
		return String(error);
	}
}
async function migrateWithExclusiveStateOwnership$2(params) {
	const changes = [];
	const warnings = [];
	const notices = [];
	if (!params.detected.hasLegacy) return {
		changes,
		warnings
	};
	const receipt = readMigrationReceipt(params.detected.sourcePath, params.env);
	if (receipt) {
		try {
			if (await cleanupReceiptAuthoritativeSources({
				...params,
				sourcePath: params.detected.sourcePath,
				receipt
			}) > 0) notices.push("Discarded retired APNs JSON state already covered by its SQLite receipt.");
		} catch (error) {
			warnings.push(`APNs state is in SQLite, but legacy cleanup failed: ${String(error)}`);
		}
		return notices.length > 0 ? {
			changes,
			warnings,
			notices
		} : {
			changes,
			warnings
		};
	}
	const sourcePath = params.detected.sourcePath;
	const claimPath = `${sourcePath}${APNS_DOCTOR_CLAIM_SUFFIX}`;
	const hasSource = await params.stateRoot.exists(relativeLegacyPath$3(params.stateDir, sourcePath));
	const hasClaim = await params.stateRoot.exists(relativeLegacyPath$3(params.stateDir, claimPath));
	if (hasSource && hasClaim) return {
		changes,
		warnings: ["Failed migrating legacy APNs state: source and interrupted claim both exist."]
	};
	const activePath = hasSource ? sourcePath : hasClaim ? claimPath : null;
	if (!activePath) return {
		changes,
		warnings
	};
	let snapshot;
	const registrations = /* @__PURE__ */ new Map();
	try {
		snapshot = await readLegacySourceSnapshot$6(params.stateRoot, params.stateDir, activePath, (rawNodeId, rawRegistration) => {
			const [nodeId, registration] = parseLegacyApnsRegistration(rawNodeId, rawRegistration, params.env);
			if (registrations.has(nodeId)) throw new Error("legacy APNs registration has a duplicate node id");
			registrations.set(nodeId, registration);
		});
	} catch (error) {
		warnings.push(`Failed reading legacy APNs state: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	if (activePath === sourcePath) try {
		params.beforeClaim?.();
		await params.stateRoot.move(relativeLegacyPath$3(params.stateDir, sourcePath), relativeLegacyPath$3(params.stateDir, claimPath));
		const claimed = await readLegacySourceSnapshot$6(params.stateRoot, params.stateDir, claimPath);
		if (!snapshotsMatch(snapshot, claimed)) throw new Error("legacy APNs source changed before Doctor could claim it");
		snapshot = claimed;
	} catch (error) {
		const restoreError = await restoreClaim$2({
			stateRoot: params.stateRoot,
			stateDir: params.stateDir,
			sourcePath
		});
		warnings.push(`Failed migrating legacy APNs state: ${String(error)}${restoreError ? `; restore failure: ${restoreError}` : ""}`);
		return {
			changes,
			warnings
		};
	}
	let result;
	try {
		result = importAndRecordReceipt({
			env: params.env,
			sourcePath,
			snapshot,
			registrations
		});
	} catch (error) {
		const restoreError = await restoreClaim$2({
			stateRoot: params.stateRoot,
			stateDir: params.stateDir,
			sourcePath
		});
		warnings.push(`Failed migrating legacy APNs state: ${String(error)}${restoreError ? `; restore failure: ${restoreError}` : ""}`);
		return {
			changes,
			warnings
		};
	}
	try {
		if (await params.stateRoot.exists(relativeLegacyPath$3(params.stateDir, sourcePath))) throw new Error("legacy APNs source reappeared during import");
		await removePath({
			...params,
			sourcePath: claimPath
		});
		markSourceRemoved(result.sourceKey, params.env);
	} catch (error) {
		warnings.push(`APNs state is in SQLite, but legacy cleanup failed: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	changes.push(`Migrated ${result.imported} APNs registration${result.imported === 1 ? "" : "s"} to SQLite.`);
	if (result.preserved > 0) notices.push(`Preserved ${result.preserved} canonical SQLite APNs registration${result.preserved === 1 ? "" : "s"}.`);
	if (result.suppressed > 0) notices.push(`Kept ${result.suppressed} deleted APNs registration${result.suppressed === 1 ? "" : "s"} retired.`);
	notices.push("Removed retired APNs JSON state after verified SQLite import.");
	return {
		changes,
		warnings,
		notices
	};
}
/** Import the retired APNs store while excluding old Gateways that can recreate it. */
async function migrateLegacyApnsRegistrations(params) {
	if (!params.detected.hasLegacy) return {
		changes: [],
		warnings: []
	};
	const env = {
		...params.env ?? process.env,
		OPERATOR_STATE_DIR: params.stateDir
	};
	let lock;
	try {
		lock = await require_gateway_lock.acquireGatewayLock({
			allowInTests: true,
			env,
			pollIntervalMs: MIGRATION_LOCK_POLL_INTERVAL_MS$3,
			role: "sqlite-maintenance",
			timeoutMs: MIGRATION_LOCK_TIMEOUT_MS$3
		});
	} catch (error) {
		return {
			changes: [],
			warnings: [`Failed migrating legacy APNs state: ${error instanceof require_gateway_lock.GatewayLockError ? "the Gateway or another SQLite maintenance command owns this state directory" : String(error)}. Stop the Gateway and run \`openclaw doctor --fix\` again.`]
		};
	}
	if (!lock) return {
		changes: [],
		warnings: ["Failed migrating legacy APNs state: exclusive state ownership unavailable."]
	};
	let result = {
		changes: [],
		warnings: []
	};
	let releaseError;
	try {
		try {
			const stateRoot = await (0, _openclaw_fs_safe.root)(params.stateDir, {
				hardlinks: "reject",
				symlinks: "reject"
			});
			result = await migrateWithExclusiveStateOwnership$2({
				...params,
				env,
				stateRoot
			});
		} catch (error) {
			result.warnings.push(`Failed reading legacy APNs state: ${String(error)}`);
		}
	} finally {
		try {
			await lock.release();
		} catch (error) {
			releaseError = error;
		}
	}
	if (releaseError) result.warnings.push(`APNs migration lock release failed: ${require_errors.formatErrorMessage(releaseError)}`);
	return result;
}
//#endregion
//#region src/infra/state-migrations.channel-pairing.ts
const PAIRING_SUFFIX = "-pairing.json";
const ALLOW_FROM_SUFFIX = "-allowFrom.json";
function detectLegacyChannelPairingState(params) {
	let directoryEntries = [];
	try {
		directoryEntries = node_fs.default.readdirSync(params.sourceDir, { withFileTypes: true });
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}
	const files = directoryEntries.filter((entry) => entry.isFile() && (entry.name.endsWith(PAIRING_SUFFIX) || entry.name.endsWith(ALLOW_FROM_SUFFIX))).map((entry) => entry.name).toSorted();
	const pairedChannelIds = files.filter((filename) => filename.endsWith(PAIRING_SUFFIX)).map((filename) => filename.slice(0, -13));
	const knownChannelIds = require_pairing_store_sqlite.dedupePreserveOrder([
		...require_ids.CHANNEL_IDS,
		...params.configuredChannelIds ?? [],
		...pairedChannelIds
	]).toSorted((left, right) => right.length - left.length || left.localeCompare(right));
	return {
		sourceDir: params.sourceDir,
		files,
		knownChannelIds,
		defaultAccountIds: { ...params.configuredDefaultAccountIds },
		accountIds: Object.fromEntries(Object.entries(params.configuredAccountIds ?? {}).map(([channel, accountIds]) => [channel, require_pairing_store_sqlite.dedupePreserveOrder(accountIds.map((accountId) => require_pairing_store_sqlite.resolveAllowFromAccountId(accountId)))])),
		hasLegacy: files.length > 0
	};
}
function parsePairingFilename(filename) {
	return filename.endsWith(PAIRING_SUFFIX) ? filename.slice(0, -13) : null;
}
function parseAllowFromFilename(filename, knownChannelIds, defaultAccountIds, accountIds) {
	if (!filename.endsWith(ALLOW_FROM_SUFFIX)) return null;
	const stem = filename.slice(0, -15);
	const targets = [];
	let hasAccountCollision = false;
	for (const channel of knownChannelIds) {
		if (stem === channel) {
			targets.push({
				channel,
				accountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(defaultAccountIds[channel]) ?? "default"
			});
			continue;
		}
		if (!stem.startsWith(`${channel}-`)) continue;
		const accountKey = stem.slice(channel.length + 1);
		const matchingAccountIds = (accountIds[channel] ?? []).filter((accountId) => require_pairing_store_sqlite.safeAccountKey(accountId) === accountKey);
		if (matchingAccountIds.length === 1 && matchingAccountIds[0]) targets.push({
			channel,
			accountId: matchingAccountIds[0]
		});
		else if (matchingAccountIds.length > 1) hasAccountCollision = true;
	}
	if (hasAccountCollision || targets.length > 1) return {
		target: null,
		reason: "ambiguous"
	};
	return targets[0] ? { target: targets[0] } : {
		target: null,
		reason: "unresolved"
	};
}
function normalizeLegacyPairingRequest(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return null;
	const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.id);
	const code = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.code);
	const createdAt = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.createdAt);
	const lastSeenAt = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.lastSeenAt) ?? createdAt;
	if (!id || !code || !createdAt || !lastSeenAt) return null;
	const meta = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.meta) ? Object.fromEntries(Object.entries(value.meta).map(([key, entry]) => [key, (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry) ?? ""]).filter(([, entry]) => Boolean(entry))) : void 0;
	return {
		id,
		code,
		createdAt,
		lastSeenAt,
		...meta && Object.keys(meta).length ? { meta } : {}
	};
}
function readLegacyPairingRequests(filePath) {
	try {
		const parsed = JSON.parse(node_fs.default.readFileSync(filePath, "utf8"));
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) || !Array.isArray(parsed.requests)) return null;
		return parsed.requests.flatMap((entry) => {
			const request = normalizeLegacyPairingRequest(entry);
			return request ? [request] : [];
		});
	} catch {
		return null;
	}
}
function normalizeAllowEntry(channel, value) {
	const raw = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
	if (!raw || raw === "*") return "";
	let adapter;
	try {
		adapter = require_pairing_store_sqlite.getPairingAdapter(channel);
	} catch {
		adapter = null;
	}
	const entry = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(adapter?.normalizeAllowEntry ? adapter.normalizeAllowEntry(raw) : raw) ?? "";
	return entry === "*" ? "" : entry;
}
function readLegacyAllowFrom(filePath, channel) {
	try {
		const parsed = JSON.parse(node_fs.default.readFileSync(filePath, "utf8"));
		const values = Array.isArray(parsed) ? parsed : (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) && Array.isArray(parsed.allowFrom) ? parsed.allowFrom : null;
		if (!values) return null;
		return require_pairing_store_sqlite.dedupePreserveOrder(values.map((value) => normalizeAllowEntry(channel, value)).filter(Boolean));
	} catch {
		return null;
	}
}
function mergePairingRequests(current, legacy) {
	const merged = current.slice();
	const keys = new Set(current.map((request) => `${require_pairing_store_sqlite.resolveAllowFromAccountId(request.meta?.accountId)}\0${request.id}`));
	for (const request of legacy) {
		const key = `${require_pairing_store_sqlite.resolveAllowFromAccountId(request.meta?.accountId)}\0${request.id}`;
		if (!keys.has(key)) {
			keys.add(key);
			merged.push(request);
		}
	}
	return merged;
}
function removeImportedSource(filePath, warnings) {
	try {
		node_fs.default.rmSync(filePath, { force: true });
		return true;
	} catch (err) {
		warnings.push(`Imported legacy channel pairing state but failed removing ${filePath}: ${String(err)}`);
		return false;
	}
}
function migrateLegacyChannelPairingState(params) {
	const changes = [];
	const warnings = [];
	for (const filename of params.detected.files) {
		const filePath = node_path.default.join(params.detected.sourceDir, filename);
		const pairingChannel = parsePairingFilename(filename);
		if (pairingChannel) {
			const requests = readLegacyPairingRequests(filePath);
			if (!requests) {
				warnings.push(`Legacy channel pairing file unreadable; left in place at ${filePath}`);
				continue;
			}
			require_pairing_store_sqlite.updateChannelPairingStateSnapshot(pairingChannel, params.env, (state) => {
				state.requests = mergePairingRequests(state.requests, requests);
			});
			removeImportedSource(filePath, warnings);
			changes.push(`Migrated ${requests.length} ${pairingChannel} pairing request(s) → shared SQLite state`);
			continue;
		}
		const allowTarget = parseAllowFromFilename(filename, params.detected.knownChannelIds, params.detected.defaultAccountIds, params.detected.accountIds);
		if (!allowTarget) continue;
		if (!allowTarget.target) {
			const reason = allowTarget.reason === "ambiguous" ? "ambiguous" : "unresolved";
			warnings.push(`Legacy channel allowFrom channel/account is ${reason}; left in place at ${filePath}`);
			continue;
		}
		const entries = readLegacyAllowFrom(filePath, allowTarget.target.channel);
		if (!entries) {
			warnings.push(`Legacy channel allowFrom file unreadable; left in place at ${filePath}`);
			continue;
		}
		const accountId = require_pairing_store_sqlite.resolveAllowFromAccountId(allowTarget.target.accountId);
		require_pairing_store_sqlite.updateChannelPairingStateSnapshot(allowTarget.target.channel, params.env, (state) => {
			state.allowFrom ??= {};
			state.allowFrom[accountId] = require_pairing_store_sqlite.dedupePreserveOrder([...state.allowFrom[accountId] ?? [], ...entries]);
		});
		removeImportedSource(filePath, warnings);
		changes.push(`Migrated ${entries.length} ${allowTarget.target.channel}/${accountId} allowFrom entr${entries.length === 1 ? "y" : "ies"} → shared SQLite state`);
	}
	return {
		changes,
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.commitments.ts
const LEGACY_STORE_KEYS = /* @__PURE__ */ new Set(["version", "commitments"]);
const ACTIVE_STATUSES = ["pending", "snoozed"];
function resolveLegacyCommitmentsPath(stateDir) {
	return node_path.default.join(stateDir, "commitments", "commitments.json");
}
/** Detect retired commitment state only when an explicit doctor flow opts in. */
function detectLegacyCommitments(params) {
	const sourcePath = resolveLegacyCommitmentsPath(params.stateDir);
	return {
		sourcePath,
		hasLegacy: params.doctorOnlyStateMigrations === true && node_fs.default.existsSync(sourcePath)
	};
}
function readLegacySourceSnapshot$5(sourcePath) {
	const before = node_fs.default.lstatSync(sourcePath);
	if (!before.isFile() || before.isSymbolicLink()) throw new Error("legacy commitments source is not a regular non-symlink file");
	const raw = node_fs.default.readFileSync(sourcePath, "utf8");
	const after = node_fs.default.lstatSync(sourcePath);
	if (!after.isFile() || after.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error("legacy commitments source changed while doctor was reading it");
	return {
		dev: after.dev,
		ino: after.ino,
		mtimeMs: after.mtimeMs,
		raw,
		sha256: (0, node_crypto.createHash)("sha256").update(raw).digest("hex"),
		size: after.size
	};
}
function sourceSnapshotsMatch$4(left, right) {
	return left.dev === right.dev && left.ino === right.ino && left.mtimeMs === right.mtimeMs && left.sha256 === right.sha256 && left.size === right.size;
}
function assertLegacySourceUnchanged$1(sourcePath, snapshot) {
	if (!sourceSnapshotsMatch$4(readLegacySourceSnapshot$5(sourcePath), snapshot)) throw new Error("legacy commitments source changed after doctor loaded it");
}
function parseLegacyCommitments(raw) {
	const parsed = JSON.parse(raw);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) || parsed.version !== 1 || !Array.isArray(parsed.commitments)) throw new Error("legacy commitments store must be a version 1 JSON object");
	const unexpectedKey = Object.keys(parsed).find((key) => !LEGACY_STORE_KEYS.has(key));
	if (unexpectedKey) throw new Error(`legacy commitments store has unexpected field ${unexpectedKey}`);
	const records = [];
	const ids = /* @__PURE__ */ new Set();
	for (const [index, rawRecord] of parsed.commitments.entries()) {
		const record = require_store_record.coerceCommitmentRecord(rawRecord);
		if (!record) throw new Error(`legacy commitment at index ${index} is invalid`);
		if (ids.has(record.id)) throw new Error(`legacy commitments store contains duplicate id ${record.id}`);
		ids.add(record.id);
		records.push(record);
	}
	return records;
}
function sameLogicalScope(left, right) {
	return left.agentId === right.agentId && left.sessionKey === right.sessionKey && left.channel === right.channel && (left.accountId ?? "") === (right.accountId ?? "") && (left.to ?? "") === (right.to ?? "") && (left.threadId ?? "") === (right.threadId ?? "") && (left.senderId ?? "") === (right.senderId ?? "") && left.dedupeKey === right.dedupeKey;
}
function findActiveLogicalRow(db, record) {
	if (record.status !== "pending" && record.status !== "snoozed") return;
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).selectFrom("commitments").selectAll().where("agent_id", "=", record.agentId).where("session_key", "=", record.sessionKey).where("channel", "=", record.channel).where("dedupe_key", "=", record.dedupeKey).where("status", "in", [...ACTIVE_STATUSES]).orderBy("updated_at_ms", "desc").orderBy("id", "asc")).rows.find((candidate) => sameLogicalScope(require_store_record.commitmentRecordFromRow(candidate), record));
}
function updateCommitmentRow(db, record) {
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).updateTable("commitments").set(require_store_record.commitmentRecordToUpdate(record)).where("id", "=", record.id));
}
function restoreClaimAfterCleanupFailure$1(claimPath, sourcePath) {
	if (!node_fs.default.existsSync(claimPath) || node_fs.default.existsSync(sourcePath)) return null;
	try {
		node_fs.default.renameSync(claimPath, sourcePath);
		return null;
	} catch (error) {
		return `; claimed source remains at ${claimPath} because restore also failed: ${String(error)}`;
	}
}
function claimAndRemoveSource(params) {
	params.beforeClaim?.();
	const claimPath = `${params.sourcePath}.doctor-importing-${process.pid}-${(0, node_crypto.randomUUID)()}`;
	node_fs.default.renameSync(params.sourcePath, claimPath);
	try {
		if (!sourceSnapshotsMatch$4(readLegacySourceSnapshot$5(claimPath), params.snapshot)) throw new Error("legacy commitments source changed before doctor could claim it");
		(params.removeSource ?? node_fs.default.unlinkSync)(claimPath);
	} catch (error) {
		const restoreFailure = restoreClaimAfterCleanupFailure$1(claimPath, params.sourcePath);
		throw new Error(`${String(error)}${restoreFailure ?? ""}`, { cause: error });
	}
}
/** Import, verify, and remove the retired JSON store during explicit doctor repair. */
function migrateLegacyCommitments(params) {
	const changes = [];
	const warnings = [];
	const notices = [];
	if (!params.detected.hasLegacy) return {
		changes,
		warnings
	};
	let snapshot;
	let legacyRecords;
	try {
		snapshot = readLegacySourceSnapshot$5(params.detected.sourcePath);
		legacyRecords = parseLegacyCommitments(snapshot.raw);
	} catch (error) {
		warnings.push(`Failed reading legacy commitments state ${params.detected.sourcePath}: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	const expectedRows = /* @__PURE__ */ new Map();
	let importedCount = 0;
	let newerSqliteCount = 0;
	let activeDuplicateCount = 0;
	try {
		assertLegacySourceUnchanged$1(params.detected.sourcePath, snapshot);
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const commitmentsDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
			for (const legacyRecord of legacyRecords) {
				const existingRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, commitmentsDb.selectFrom("commitments").selectAll().where("id", "=", legacyRecord.id));
				if (existingRow) {
					const existing = require_store_record.commitmentRecordFromRow(existingRow);
					if (require_store_record.commitmentImmutableIdentity(existing) !== require_store_record.commitmentImmutableIdentity(legacyRecord)) throw new Error(`commitment ${legacyRecord.id} has conflicting immutable identity`);
					if (existing.updatedAtMs > legacyRecord.updatedAtMs) {
						expectedRows.set(existing.id, existing);
						newerSqliteCount += 1;
						continue;
					}
					if (existing.updatedAtMs === legacyRecord.updatedAtMs) {
						if (!require_store_record.commitmentRecordsEqual(existing, legacyRecord)) throw new Error(`commitment ${legacyRecord.id} diverges between JSON and SQLite at the same timestamp`);
						expectedRows.set(existing.id, existing);
						continue;
					}
					updateCommitmentRow(db, legacyRecord);
					expectedRows.set(legacyRecord.id, legacyRecord);
					importedCount += 1;
					continue;
				}
				const activeLogicalRow = findActiveLogicalRow(db, legacyRecord);
				if (activeLogicalRow) {
					const activeRecord = require_store_record.commitmentRecordFromRow(activeLogicalRow);
					expectedRows.set(activeRecord.id, activeRecord);
					activeDuplicateCount += 1;
					continue;
				}
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, commitmentsDb.insertInto("commitments").values(require_store_record.commitmentRecordToRow(legacyRecord)));
				expectedRows.set(legacyRecord.id, legacyRecord);
				importedCount += 1;
			}
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
	} catch (error) {
		warnings.push(`Failed migrating legacy commitments state: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	try {
		params.beforeVerify?.();
		const database = require_openclaw_state_db.openOperatorStateDatabase({ env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
		const commitmentsDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
		for (const expected of expectedRows.values()) {
			const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, commitmentsDb.selectFrom("commitments").selectAll().where("id", "=", expected.id));
			if (!row || !require_store_record.commitmentRecordsEqual(require_store_record.commitmentRecordFromRow(row), expected)) throw new Error(`SQLite verification failed for commitment ${expected.id}`);
		}
		assertLegacySourceUnchanged$1(params.detected.sourcePath, snapshot);
	} catch (error) {
		warnings.push(`Failed verifying legacy commitments migration: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	try {
		claimAndRemoveSource({
			sourcePath: params.detected.sourcePath,
			snapshot,
			beforeClaim: params.beforeClaim,
			removeSource: params.removeSource
		});
	} catch (error) {
		warnings.push(`Migrated commitments but could not remove legacy source ${params.detected.sourcePath}: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	if (importedCount > 0) changes.push(`Migrated ${importedCount} commitment(s) → shared SQLite state`);
	changes.push("Removed legacy commitments JSON after SQLite verification");
	if (newerSqliteCount > 0) notices.push(`Kept ${newerSqliteCount} newer shared SQLite commitment(s) over legacy JSON`);
	if (activeDuplicateCount > 0) notices.push(`Kept ${activeDuplicateCount} canonical active SQLite commitment(s) over legacy logical duplicates`);
	return notices.length > 0 ? {
		changes,
		warnings,
		notices
	} : {
		changes,
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.debug-proxy.ts
const DEBUG_PROXY_SQLITE_SIDECAR_SUFFIXES = [
	"",
	"-shm",
	"-wal",
	"-journal"
];
var LegacyDebugProxyBlobConflictError = class extends Error {
	constructor(blobId) {
		super(`legacy debug proxy blob conflicts with shared state: ${blobId}`);
		this.blobId = blobId;
	}
};
var LegacyDebugProxySessionConflictError = class extends Error {
	constructor(sessionId) {
		super(`legacy debug proxy session conflicts with shared state: ${sessionId}`);
		this.sessionId = sessionId;
	}
};
function fileExists$1(filePath) {
	try {
		return node_fs.default.statSync(filePath).isFile();
	} catch {
		return false;
	}
}
function dirExists(dirPath) {
	try {
		return node_fs.default.statSync(dirPath).isDirectory();
	} catch {
		return false;
	}
}
function resolveLegacyDebugProxyCapturePaths(stateDir, env) {
	const rootDir = node_path.default.join(stateDir, "debug-proxy");
	return {
		sourcePath: env.OPERATOR_DEBUG_PROXY_DB_PATH?.trim() || node_path.default.join(rootDir, "capture.sqlite"),
		blobDir: env.OPERATOR_DEBUG_PROXY_BLOB_DIR?.trim() || node_path.default.join(rootDir, "blobs")
	};
}
function hasPendingSqliteArchive(sourcePath) {
	return !fileExists$1(sourcePath) && fileExists$1(`${sourcePath}.migrated`) && DEBUG_PROXY_SQLITE_SIDECAR_SUFFIXES.some((suffix) => suffix !== "" && fileExists$1(`${sourcePath}${suffix}`));
}
function detectLegacyDebugProxyCaptureSidecar(stateDir, env = process.env) {
	const paths = resolveLegacyDebugProxyCapturePaths(stateDir, env);
	if (node_path.default.resolve(paths.sourcePath) === node_path.default.resolve(require_openclaw_state_db.resolveOperatorStateSqlitePath({
		...env,
		OPERATOR_STATE_DIR: stateDir
	}))) return {
		...paths,
		hasLegacy: false
	};
	const hasArchivedDatabase = fileExists$1(`${paths.sourcePath}.migrated`);
	return {
		...paths,
		hasLegacy: fileExists$1(paths.sourcePath) || hasPendingSqliteArchive(paths.sourcePath) || hasArchivedDatabase && dirExists(paths.blobDir)
	};
}
function listSqliteColumns$1(db, table) {
	const rows = db.prepare(`PRAGMA table_info(${table})`).all();
	return new Set(rows.flatMap((row) => typeof row.name === "string" ? [row.name] : []));
}
function assertTableColumns(db, table, expected) {
	const columns = listSqliteColumns$1(db, table);
	const missing = expected.filter((column) => !columns.has(column));
	if (missing.length > 0) throw new Error(`legacy ${table} table is missing ${missing.join(", ")}`);
}
function normalizeSqliteInteger(value) {
	return typeof value === "bigint" ? Number(value) : value;
}
function readLegacyDebugProxyCapture(params) {
	const db = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(params.sourcePath, { readOnly: true });
	try {
		assertTableColumns(db, "capture_sessions", [
			"id",
			"started_at",
			"ended_at",
			"mode",
			"source_scope",
			"source_process",
			"proxy_url",
			"db_path",
			"blob_dir"
		]);
		assertTableColumns(db, "capture_events", [
			"session_id",
			"ts",
			"source_scope",
			"source_process",
			"protocol",
			"direction",
			"kind",
			"flow_id",
			"method",
			"host",
			"path",
			"status",
			"close_code",
			"content_type",
			"headers_json",
			"data_text",
			"data_blob_id",
			"data_sha256",
			"error_text",
			"meta_json"
		]);
		const sessions = db.prepare(`SELECT id, started_at, ended_at, mode, source_scope, source_process, proxy_url, blob_dir
         FROM capture_sessions
         ORDER BY started_at ASC, id ASC`).all();
		const events = db.prepare(`SELECT
           session_id, ts, source_scope, source_process, protocol, direction, kind, flow_id,
           method, host, path, status, close_code, content_type, headers_json, data_text,
           data_blob_id, data_sha256, error_text, meta_json
         FROM capture_events
         ORDER BY ts ASC, id ASC`).all();
		const sessionIds = new Set(sessions.map((session) => session.id));
		for (const event of events) {
			if (sessionIds.has(event.session_id)) continue;
			sessions.push({
				id: event.session_id,
				started_at: event.ts,
				ended_at: null,
				mode: "implicit",
				source_scope: event.source_scope,
				source_process: event.source_process,
				proxy_url: null,
				blob_dir: params.blobDir
			});
			sessionIds.add(event.session_id);
		}
		const blobEvents = /* @__PURE__ */ new Map();
		for (const event of events) {
			if (!event.data_blob_id) continue;
			const rows = blobEvents.get(event.data_blob_id) ?? [];
			rows.push(event);
			blobEvents.set(event.data_blob_id, rows);
		}
		const blobDirBySession = new Map(sessions.map((session) => [session.id, session.blob_dir]));
		const usedBlobDirs = /* @__PURE__ */ new Set();
		const blobs = [];
		for (const [blobId, referencingEvents] of blobEvents) {
			const candidateBlobDirs = [.../* @__PURE__ */ new Set([...referencingEvents.map((event) => blobDirBySession.get(event.session_id) ?? params.blobDir), params.blobDir])];
			const blobPath = candidateBlobDirs.map((blobDir) => node_path.default.join(blobDir, `${blobId}.bin.gz`)).find(fileExists$1) ?? node_path.default.join(candidateBlobDirs[0] ?? params.blobDir, `${blobId}.bin.gz`);
			const data = node_fs.default.readFileSync(blobPath);
			const raw = (0, node_zlib.gunzipSync)(data);
			const sha256 = require_crypto_digest.sha256Hex(raw);
			if (sha256.slice(0, 24) !== blobId) throw new Error(`legacy debug proxy blob hash mismatch: ${blobPath}`);
			usedBlobDirs.add(node_path.default.dirname(blobPath));
			blobs.push({
				blobId,
				contentType: referencingEvents.find((event) => event.content_type)?.content_type ?? null,
				encoding: "gzip",
				sizeBytes: raw.byteLength,
				sha256,
				data,
				createdAt: Math.min(...referencingEvents.map((event) => normalizeSqliteInteger(event.ts) ?? 0))
			});
		}
		return {
			sessions,
			events,
			blobs,
			blobDirs: [...usedBlobDirs]
		};
	} finally {
		db.close();
	}
}
function eventValues(event) {
	return [
		event.session_id,
		normalizeSqliteInteger(event.ts),
		event.source_scope,
		event.source_process,
		event.protocol,
		event.direction,
		event.kind,
		event.flow_id,
		event.method,
		event.host,
		event.path,
		normalizeSqliteInteger(event.status),
		normalizeSqliteInteger(event.close_code),
		event.content_type,
		event.headers_json,
		event.data_text,
		event.data_blob_id,
		event.data_sha256,
		event.error_text,
		event.meta_json
	];
}
function eventKey(values) {
	return JSON.stringify(values);
}
function archiveLegacyDebugProxySqlite(params) {
	const existingSources = DEBUG_PROXY_SQLITE_SIDECAR_SUFFIXES.map((suffix) => `${params.sourcePath}${suffix}`).filter(fileExists$1);
	if (existingSources.length === 0) return;
	const resolutions = [];
	for (const sourcePath of existingSources) {
		const archivedPath = `${sourcePath}.migrated`;
		try {
			if (fileExists$1(archivedPath)) {
				if (node_fs.default.readFileSync(sourcePath).equals(node_fs.default.readFileSync(archivedPath))) {
					node_fs.default.rmSync(sourcePath, { force: true });
					resolutions.push({
						sourcePath,
						targetPath: archivedPath,
						removed: true
					});
					continue;
				}
				let index = 2;
				while (node_fs.default.existsSync(`${sourcePath}.migrated.${index}`)) index++;
				const nextArchivePath = `${sourcePath}.migrated.${index}`;
				node_fs.default.renameSync(sourcePath, nextArchivePath);
				resolutions.push({
					sourcePath,
					targetPath: nextArchivePath,
					removed: false
				});
				continue;
			}
			node_fs.default.renameSync(sourcePath, archivedPath);
			resolutions.push({
				sourcePath,
				targetPath: archivedPath,
				removed: false
			});
		} catch (err) {
			params.warnings.push(`Failed archiving debug proxy capture sidecar ${sourcePath}: ${String(err)}`);
			return;
		}
	}
	if (resolutions.every((resolution) => !resolution.removed && resolution.targetPath === `${resolution.sourcePath}.migrated`)) {
		params.changes.push(`Archived debug proxy capture sidecar legacy source → ${params.sourcePath}.migrated`);
		return;
	}
	for (const resolution of resolutions) params.changes.push(resolution.removed ? `Removed already-archived debug proxy capture sidecar legacy source ${resolution.sourcePath}` : `Archived debug proxy capture sidecar legacy source → ${resolution.targetPath}`);
}
function archiveLegacyDebugProxyBlobs(params) {
	if (!dirExists(params.blobDir)) return;
	const archivePath = `${params.blobDir}.migrated`;
	try {
		let targetPath = archivePath;
		if (dirExists(archivePath)) {
			let index = 2;
			while (node_fs.default.existsSync(`${params.blobDir}.migrated.${index}`)) index++;
			targetPath = `${params.blobDir}.migrated.${index}`;
		}
		node_fs.default.renameSync(params.blobDir, targetPath);
		params.changes.push(`Archived debug proxy capture blobs → ${targetPath}`);
	} catch (err) {
		params.warnings.push(`Failed archiving debug proxy capture blobs ${params.blobDir}: ${String(err)}`);
	}
}
function migrateLegacyDebugProxyCaptureSidecar(params) {
	const detected = params.detected ?? detectLegacyDebugProxyCaptureSidecar(params.stateDir);
	const changes = [];
	const warnings = [];
	if (!detected.hasLegacy) return {
		changes,
		warnings
	};
	if (!fileExists$1(detected.sourcePath)) {
		archiveLegacyDebugProxySqlite({
			sourcePath: detected.sourcePath,
			changes,
			warnings
		});
		if (fileExists$1(`${detected.sourcePath}.migrated`)) archiveLegacyDebugProxyBlobs({
			blobDir: detected.blobDir,
			changes,
			warnings
		});
		return {
			changes,
			warnings
		};
	}
	let legacy;
	try {
		legacy = readLegacyDebugProxyCapture(detected);
	} catch (err) {
		return {
			changes,
			warnings: [`Failed reading debug proxy capture sidecar ${detected.sourcePath}: ${String(err)}`]
		};
	}
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const selectBlob = db.prepare(`SELECT encoding, size_bytes AS sizeBytes, sha256, data
           FROM capture_blobs
           WHERE blob_id = ?`);
			const insertBlob = db.prepare(`INSERT INTO capture_blobs (
            blob_id, content_type, encoding, size_bytes, sha256, data, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`);
			for (const blob of legacy.blobs) {
				const existing = selectBlob.get(blob.blobId);
				if (existing) {
					if (existing.encoding !== blob.encoding || Number(existing.sizeBytes) !== blob.sizeBytes || existing.sha256 !== blob.sha256 || !existing.data || !Buffer.from(existing.data).equals(blob.data)) throw new LegacyDebugProxyBlobConflictError(blob.blobId);
					continue;
				}
				insertBlob.run(blob.blobId, blob.contentType, blob.encoding, blob.sizeBytes, blob.sha256, blob.data, blob.createdAt);
			}
			const selectSession = db.prepare(`SELECT
            started_at AS startedAt,
            ended_at AS endedAt,
            mode,
            source_scope AS sourceScope,
            source_process AS sourceProcess,
            proxy_url AS proxyUrl
           FROM capture_sessions
           WHERE id = ?`);
			const insertSession = db.prepare(`INSERT INTO capture_sessions (
            id, started_at, ended_at, mode, source_scope, source_process, proxy_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`);
			for (const session of legacy.sessions) {
				const values = [
					session.id,
					normalizeSqliteInteger(session.started_at),
					normalizeSqliteInteger(session.ended_at),
					session.mode,
					session.source_scope,
					session.source_process,
					session.proxy_url
				];
				const existing = selectSession.get(session.id);
				if (existing) {
					const expected = {
						startedAt: values[1],
						endedAt: values[2],
						mode: values[3],
						sourceScope: values[4],
						sourceProcess: values[5],
						proxyUrl: values[6]
					};
					if (JSON.stringify(existing) !== JSON.stringify(expected)) throw new LegacyDebugProxySessionConflictError(session.id);
					continue;
				}
				insertSession.run(...values);
			}
			const existingEventCount = db.prepare(`SELECT COUNT(*) AS count
           FROM capture_events
           WHERE session_id IS ? AND ts IS ? AND source_scope IS ? AND source_process IS ?
             AND protocol IS ? AND direction IS ? AND kind IS ? AND flow_id IS ?
             AND method IS ? AND host IS ? AND path IS ? AND status IS ? AND close_code IS ?
             AND content_type IS ? AND headers_json IS ? AND data_text IS ? AND data_blob_id IS ?
             AND data_sha256 IS ? AND error_text IS ? AND meta_json IS ?
          `);
			const insertEvent = db.prepare(`INSERT INTO capture_events (
            session_id, ts, source_scope, source_process, protocol, direction, kind, flow_id,
            method, host, path, status, close_code, content_type, headers_json, data_text,
            data_blob_id, data_sha256, error_text, meta_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
			const existingCounts = /* @__PURE__ */ new Map();
			const seenCounts = /* @__PURE__ */ new Map();
			for (const event of legacy.events) {
				const values = eventValues(event);
				const key = eventKey(values);
				const seenCount = (seenCounts.get(key) ?? 0) + 1;
				seenCounts.set(key, seenCount);
				let existingCount = existingCounts.get(key);
				if (existingCount === void 0) {
					const row = existingEventCount.get(...values);
					existingCount = Number(row?.count ?? 0);
					existingCounts.set(key, existingCount);
				}
				if (seenCount > existingCount) insertEvent.run(...values);
			}
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
		changes.push(`Migrated ${legacy.sessions.length} debug proxy capture ${legacy.sessions.length === 1 ? "session" : "sessions"}, ${legacy.events.length} ${legacy.events.length === 1 ? "event" : "events"}, and ${legacy.blobs.length} ${legacy.blobs.length === 1 ? "blob" : "blobs"} → shared SQLite state`);
	} catch (err) {
		const detail = err instanceof LegacyDebugProxyBlobConflictError ? `blob ${err.blobId} already exists with different data` : err instanceof LegacyDebugProxySessionConflictError ? `session ${err.sessionId} already exists with different data` : String(err);
		return {
			changes,
			warnings: [`Failed migrating debug proxy capture sidecar ${detected.sourcePath}: ${detail}`]
		};
	}
	archiveLegacyDebugProxySqlite({
		sourcePath: detected.sourcePath,
		changes,
		warnings
	});
	if (!fileExists$1(detected.sourcePath) && fileExists$1(`${detected.sourcePath}.migrated`)) {
		archiveLegacyDebugProxyBlobs({
			blobDir: detected.blobDir,
			changes,
			warnings
		});
		for (const blobDir of legacy.blobDirs) {
			if (node_path.default.resolve(blobDir) === node_path.default.resolve(detected.blobDir) || !dirExists(blobDir)) continue;
			warnings.push(`Left migrated debug proxy capture blobs in stored session directory: ${blobDir}`);
		}
	}
	return {
		changes,
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.fs.ts
/** Reads directory entries or returns an empty list when the directory is missing/unreadable. */
function safeReadDir(dir) {
	try {
		return node_fs.default.readdirSync(dir, { withFileTypes: true });
	} catch {
		return [];
	}
}
/** Returns whether a path exists and resolves to a directory. */
function existsDir(dir) {
	try {
		return node_fs.default.existsSync(dir) && node_fs.default.statSync(dir).isDirectory();
	} catch {
		return false;
	}
}
/** Creates a directory tree for migration targets. */
function ensureMigrationDir(dir) {
	node_fs.default.mkdirSync(dir, { recursive: true });
}
/** Returns whether a path exists and resolves to a regular file. */
function fileExists(p) {
	try {
		return node_fs.default.existsSync(p) && node_fs.default.statSync(p).isFile();
	} catch {
		return false;
	}
}
/** Reads a session store from disk, accepting JSON first and JSON5 as legacy/operator input. */
function readSessionStoreJson5(storePath) {
	try {
		return parseSessionStoreJson5(node_fs.default.readFileSync(storePath, "utf-8"));
	} catch {}
	return {
		store: {},
		ok: false
	};
}
/** Parses session-store text, preferring strict JSON before JSON5 compatibility. */
function parseSessionStoreJson5(raw) {
	try {
		const parsed = require_parse_json_compat.parseJsonWithJson5Fallback(raw);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return {
			store: parsed,
			ok: true
		};
	} catch {}
	return {
		store: {},
		ok: false
	};
}
//#endregion
//#region src/infra/state-migrations.exec-approvals.ts
const EXEC_APPROVALS_FILENAME = "exec-approvals.json";
const EXEC_APPROVALS_SOCKET_FILENAME = "exec-approvals.sock";
function resolveDefaultExecApprovalsStateDir(env, homedir) {
	return node_path.default.join(require_home_dir.resolveRequiredHomeDir(env, homedir), ".operator");
}
function resolveDefaultExecApprovalsPath(env, homedir) {
	return node_path.default.join(resolveDefaultExecApprovalsStateDir(env, homedir), EXEC_APPROVALS_FILENAME);
}
function resolveExecApprovalsPathForStateDir(stateDir) {
	return node_path.default.join(stateDir, EXEC_APPROVALS_FILENAME);
}
function resolveExecApprovalsSocketPathForStateDir(stateDir) {
	return node_path.default.join(stateDir, EXEC_APPROVALS_SOCKET_FILENAME);
}
function detectLegacyExecApprovalsMigration(params) {
	const sourcePath = resolveDefaultExecApprovalsPath(params.env, params.homedir);
	const targetPath = resolveExecApprovalsPathForStateDir(params.stateDir);
	return {
		sourcePath,
		targetPath,
		hasLegacy: Boolean(params.env.OPERATOR_STATE_DIR?.trim()) && !require_paths.isNamedProfile(params.env) && node_path.default.resolve(sourcePath) !== node_path.default.resolve(targetPath) && fileExists(sourcePath) && !fileExists(targetPath)
	};
}
function isPlainJsonObject(value) {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function isDefaultLegacyExecApprovalsSocketPath(params) {
	const expanded = require_home_dir.expandHomePrefix(params.socketPath);
	return node_path.default.resolve(expanded) === node_path.default.join(node_path.default.dirname(params.sourcePath), EXEC_APPROVALS_SOCKET_FILENAME);
}
function prepareMigratedExecApprovalsFile(params) {
	let parsed;
	try {
		parsed = JSON.parse(params.raw);
	} catch {
		return {
			raw: "",
			warning: `Legacy exec approvals file unreadable; left in place at ${params.sourcePath}`
		};
	}
	if (!isPlainJsonObject(parsed) || parsed.version !== 1) return {
		raw: "",
		warning: `Legacy exec approvals file has unsupported shape; left in place at ${params.sourcePath}`
	};
	const next = { ...parsed };
	const socket = isPlainJsonObject(next.socket) ? { ...next.socket } : {};
	const rawSocketPath = typeof socket.path === "string" ? socket.path.trim() : "";
	if (!rawSocketPath || isDefaultLegacyExecApprovalsSocketPath({
		socketPath: rawSocketPath,
		sourcePath: params.sourcePath
	})) socket.path = resolveExecApprovalsSocketPathForStateDir(node_path.default.dirname(params.targetPath));
	next.socket = socket;
	return { raw: `${JSON.stringify(next, null, 2)}\n` };
}
function assertSafeExecApprovalsMigrationTarget(targetPath) {
	const targetDir = node_path.default.dirname(targetPath);
	(0, _openclaw_fs_safe_advanced.assertNoSymlinkParentsSync)({
		rootDir: require_home_dir.resolveRequiredHomeDir(),
		targetPath: targetDir,
		allowOutsideRoot: true,
		messagePrefix: "Refusing to traverse symlink in exec approvals migration path"
	});
	try {
		if (node_fs.default.lstatSync(targetPath).isSymbolicLink()) throw new Error(`Refusing to migrate exec approvals via symlink: ${targetPath}`);
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}
}
function writeMigratedExecApprovalsFile(targetPath, raw) {
	const targetDir = node_path.default.dirname(targetPath);
	assertSafeExecApprovalsMigrationTarget(targetPath);
	node_fs.default.mkdirSync(targetDir, {
		recursive: true,
		mode: 448
	});
	assertSafeExecApprovalsMigrationTarget(targetPath);
	const dirStat = node_fs.default.lstatSync(targetDir);
	if (!dirStat.isDirectory() || dirStat.isSymbolicLink()) throw new Error(`Refusing to migrate exec approvals into unsafe directory: ${targetDir}`);
	try {
		node_fs.default.chmodSync(targetDir, 448);
	} catch {}
	const tempPath = node_path.default.join(targetDir, `.exec-approvals.migration.${process.pid}.tmp`);
	node_fs.default.writeFileSync(tempPath, raw, {
		encoding: "utf8",
		mode: 384,
		flag: "wx"
	});
	try {
		try {
			node_fs.default.copyFileSync(tempPath, targetPath, node_fs.default.constants.COPYFILE_EXCL);
		} catch (err) {
			if (err.code === "EEXIST") return false;
			try {
				node_fs.default.rmSync(targetPath, { force: true });
			} catch {}
			throw err;
		}
		try {
			node_fs.default.chmodSync(targetPath, 384);
		} catch {}
		return true;
	} finally {
		node_fs.default.rmSync(tempPath, { force: true });
	}
}
function archiveMigratedExecApprovalsSource(sourcePath) {
	let archivePath = `${sourcePath}.migrated`;
	if (fileExists(archivePath)) archivePath = `${archivePath}-${Date.now()}`;
	node_fs.default.renameSync(sourcePath, archivePath);
	return archivePath;
}
function migrateLegacyExecApprovals(detected) {
	const changes = [];
	const warnings = [];
	if (!detected.hasLegacy) return {
		changes,
		warnings
	};
	if (fileExists(detected.targetPath)) return {
		changes,
		warnings
	};
	try {
		const sourceStat = node_fs.default.lstatSync(detected.sourcePath);
		if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) {
			warnings.push(`Legacy exec approvals file is not a regular file; left in place at ${detected.sourcePath}`);
			return {
				changes,
				warnings
			};
		}
		try {
			if (node_fs.default.lstatSync(detected.targetPath).isSymbolicLink()) {
				warnings.push(`Target exec approvals path is a symlink; skipped migration at ${detected.targetPath}`);
				return {
					changes,
					warnings
				};
			}
		} catch (err) {
			if (err.code !== "ENOENT") throw err;
		}
		const prepared = prepareMigratedExecApprovalsFile({
			raw: node_fs.default.readFileSync(detected.sourcePath, "utf8"),
			sourcePath: detected.sourcePath,
			targetPath: detected.targetPath
		});
		if (prepared.warning) {
			warnings.push(prepared.warning);
			return {
				changes,
				warnings
			};
		}
		if (!writeMigratedExecApprovalsFile(detected.targetPath, prepared.raw)) return {
			changes,
			warnings
		};
		changes.push(`Migrated exec approvals → ${detected.targetPath}`);
		try {
			const archivePath = archiveMigratedExecApprovalsSource(detected.sourcePath);
			changes.push(`Archived legacy exec approvals → ${archivePath}`);
		} catch (err) {
			warnings.push(`Failed archiving legacy exec approvals at ${detected.sourcePath}: ${String(err)}`);
		}
	} catch (err) {
		warnings.push(`Failed migrating exec approvals (${detected.sourcePath} → ${detected.targetPath}): ${String(err)}`);
	}
	return {
		changes,
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.session-surfaces.ts
let cachedLegacySessionSurfaces = null;
function getLegacySessionSurfaces() {
	cachedLegacySessionSurfaces ??= [...require_bundled.listBundledChannelLegacySessionSurfaces()];
	return cachedLegacySessionSurfaces;
}
function isSurfaceGroupKey(key) {
	return key.includes(":group:") || key.includes(":channel:");
}
function isLegacyGroupKey(key) {
	const trimmed = key.trim();
	if (!trimmed) return false;
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
	if (lower.startsWith("group:") || lower.startsWith("channel:")) return true;
	for (const surface of getLegacySessionSurfaces()) if (surface.isLegacyGroupSessionKey?.(trimmed)) return true;
	return false;
}
function resetLegacySessionSurfacesForTest() {
	cachedLegacySessionSurfaces = null;
}
//#endregion
//#region src/infra/state-migrations.session-store.ts
function isLegacyDefaultMainAliasKey(key, mainKey) {
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key.trim());
	const canonicalMainKey = require_session_key.normalizeMainKey(mainKey);
	return lower === `agent:main:main` || lower === `agent:main:${canonicalMainKey}`;
}
function resolveCanonicalAgentSessionOwner(key) {
	const parsed = require_session_key.parseAgentSessionKey(key);
	if (parsed === null || !(0, _gabrielvfonseca_normalization_core_agent_id.isValidAgentId)(parsed.agentId) || (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) !== parsed.agentId) return;
	return parsed.agentId;
}
function canonicalizeSessionKeyForAgent(params) {
	const raw = params.key.trim();
	if (!raw) return raw;
	const rawLower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	const legacyDefaultMainAlias = isLegacyDefaultMainAliasKey(rawLower, params.mainKey);
	const configuredAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
	const canonicalRowOwner = resolveCanonicalAgentSessionOwner(raw);
	const candidateOwner = params.preserveCanonicalAgentOwner ? canonicalRowOwner : void 0;
	const agentId = (candidateOwner === "main" && configuredAgentId !== "main" && legacyDefaultMainAlias ? void 0 : candidateOwner) ?? configuredAgentId;
	const normalized = require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(raw);
	if (rawLower === "global" || rawLower === "unknown") return rawLower;
	if (params.preserveForeignMainAliases && legacyDefaultMainAlias) return params.key;
	const canonicalMain = require_main_session.canonicalizeMainSessionAlias({
		cfg: { session: {
			scope: params.scope,
			mainKey: params.mainKey
		} },
		agentId,
		sessionKey: normalized
	});
	if (params.scope === "global" && canonicalMain === "global") return canonicalMain;
	if (params.preserveAmbiguousKeys && (!canonicalRowOwner || legacyDefaultMainAlias)) return params.key;
	if (params.skipCrossAgentRemap) {
		const parsed = require_session_key.parseAgentSessionKey(raw);
		if (parsed && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) !== agentId) return normalized;
		if (agentId !== "main" && (rawLower === "main" || rawLower === params.mainKey)) return rawLower;
	}
	if (canonicalMain !== normalized) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(canonicalMain);
	const defaultPrefix = `agent:${require_session_key.DEFAULT_AGENT_ID}:`;
	if (rawLower.startsWith(defaultPrefix) && agentId !== "main" && !params.skipCrossAgentRemap) {
		const rest = rawLower.slice(defaultPrefix.length);
		if (rest === "main" || rest === params.mainKey) {
			const remapped = `agent:${agentId}:${rest}`;
			return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_main_session.canonicalizeMainSessionAlias({
				cfg: { session: {
					scope: params.scope,
					mainKey: params.mainKey
				} },
				agentId,
				sessionKey: remapped
			}));
		}
	}
	if (rawLower.startsWith("agent:") && canonicalRowOwner) return normalized;
	if (rawLower.startsWith("subagent:")) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(`agent:${agentId}:subagent:${raw.slice(9)}`);
	for (const surface of getLegacySessionSurfaces()) {
		const canonicalized = surface.canonicalizeLegacySessionKey?.({
			key: raw,
			agentId
		});
		const normalizedCanonicalized = require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(canonicalized);
		if (normalizedCanonicalized) return normalizedCanonicalized;
	}
	if (rawLower.startsWith("group:") || rawLower.startsWith("channel:")) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(`agent:${agentId}:unknown:${raw}`);
	if (isSurfaceGroupKey(raw)) return `agent:${agentId}:${normalized}`;
	return require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(`agent:${agentId}:${raw}`);
}
function pickLatestLegacyDirectEntry(store) {
	let best = null;
	let bestUpdated = -1;
	for (const [key, entry] of Object.entries(store)) {
		if (!entry || typeof entry !== "object") continue;
		const normalized = key.trim();
		if (!normalized) continue;
		const normalizedLower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalized);
		if (normalizedLower === "global") continue;
		if (normalizedLower.startsWith("agent:")) continue;
		if (normalizedLower.startsWith("subagent:")) continue;
		if (isLegacyGroupKey(normalized) || isSurfaceGroupKey(normalized)) continue;
		const updatedAt = typeof entry.updatedAt === "number" ? entry.updatedAt : 0;
		if (updatedAt > bestUpdated) {
			bestUpdated = updatedAt;
			best = entry;
		}
	}
	return best;
}
function normalizeSessionEntry(entry) {
	const shaped = require_store$1.normalizePersistedSessionEntryShape(entry);
	if (!shaped) return null;
	const normalized = { ...shaped };
	if (typeof normalized.sessionId === "string") normalized.updatedAt = typeof normalized.updatedAt === "number" && Number.isFinite(normalized.updatedAt) ? normalized.updatedAt : Date.now();
	const rec = normalized;
	if (typeof rec.groupChannel !== "string" && typeof rec.room === "string") rec.groupChannel = rec.room;
	delete rec.room;
	return normalized;
}
function resolveUpdatedAt(entry) {
	return typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0;
}
function mergeSessionEntry(params) {
	if (!params.existing) return params.incoming;
	const existingUpdated = resolveUpdatedAt(params.existing);
	const incomingUpdated = resolveUpdatedAt(params.incoming);
	if (incomingUpdated > existingUpdated) return params.incoming;
	if (incomingUpdated < existingUpdated) return params.existing;
	return params.preferIncomingOnTie ? params.incoming : params.existing;
}
function canonicalizeSessionStore(params) {
	const canonical = Object.create(null);
	const meta = /* @__PURE__ */ new Map();
	const legacyKeys = [];
	for (const [key, entry] of Object.entries(params.store)) {
		if (!entry || typeof entry !== "object") continue;
		const canonicalKey = canonicalizeSessionKeyForAgent({
			key,
			agentId: params.agentId,
			mainKey: params.mainKey,
			scope: params.scope,
			skipCrossAgentRemap: params.skipCrossAgentRemap,
			preserveCanonicalAgentOwner: params.preserveCanonicalAgentOwner,
			preserveAmbiguousKeys: params.preserveAmbiguousKeys,
			preserveForeignMainAliases: params.preserveForeignMainAliases
		});
		const isCanonical = canonicalKey === key;
		if (!isCanonical) legacyKeys.push(key);
		const existing = canonical[canonicalKey];
		if (!existing) {
			canonical[canonicalKey] = entry;
			meta.set(canonicalKey, {
				isCanonical,
				updatedAt: resolveUpdatedAt(entry)
			});
			continue;
		}
		const existingMeta = meta.get(canonicalKey);
		const incomingUpdated = resolveUpdatedAt(entry);
		const existingUpdated = existingMeta?.updatedAt ?? resolveUpdatedAt(existing);
		if (incomingUpdated > existingUpdated) {
			canonical[canonicalKey] = entry;
			meta.set(canonicalKey, {
				isCanonical,
				updatedAt: incomingUpdated
			});
			continue;
		}
		if (incomingUpdated < existingUpdated) continue;
		if (existingMeta?.isCanonical && !isCanonical) continue;
		if (!existingMeta?.isCanonical && isCanonical) {
			canonical[canonicalKey] = entry;
			meta.set(canonicalKey, {
				isCanonical,
				updatedAt: incomingUpdated
			});
		}
	}
	return {
		store: canonical,
		legacyKeys
	};
}
function isAmbiguousSharedStoreKey(key, mainKey, scope) {
	const raw = key.trim();
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	if (!raw || lower === "global" || lower === "unknown") return false;
	if (scope === "global" && require_main_session.canonicalizeMainSessionAlias({
		cfg: { session: {
			scope,
			mainKey
		} },
		agentId: "main",
		sessionKey: lower
	}) === "global") return false;
	return !resolveCanonicalAgentSessionOwner(raw) || isLegacyDefaultMainAliasKey(lower, mainKey);
}
function aliasedSessionStoreMigrationWarning(params) {
	return `Deferred ${params.subject} ${params.count} ambiguous session key(s) in aliased store ${params.storePath}; remove filesystem aliases or configure one canonical session.store path, then rerun openclaw doctor --fix`;
}
function unresolvedSessionStoreIdentityWarning(subject, storePath) {
	return `Deferred ${subject} for ${storePath}; filesystem identity could not be established for every configured store path. Restore path access or configure one canonical session.store path, then rerun openclaw doctor --fix`;
}
function distinctSessionStoreAliasWarning(subject, storePath) {
	return `Deferred ${subject} in aliased store ${storePath}; atomic replacement cannot update distinct filesystem aliases as one operation. Remove filesystem aliases or configure one canonical session.store path, then rerun openclaw doctor --fix`;
}
function resolveStaleLegacySessionFile(params) {
	if (!params.entry || typeof params.entry !== "object" || Array.isArray(params.entry)) return;
	const entry = params.entry;
	const rawSessionFile = entry.sessionFile;
	if (typeof rawSessionFile !== "string") return;
	const legacySessionFile = node_path.default.isAbsolute(rawSessionFile) ? node_path.default.resolve(rawSessionFile) : node_path.default.resolve(params.legacyDir, rawSessionFile);
	const relative = node_path.default.relative(node_path.default.resolve(params.legacyDir), legacySessionFile);
	if (relative.startsWith("..") || node_path.default.isAbsolute(relative) || fileExists(legacySessionFile)) return;
	if (safeReadDir(node_path.default.dirname(params.legacyDir)).some((dirent) => dirent.isDirectory() && dirent.name.startsWith(`${node_path.default.basename(params.legacyDir)}.legacy-`) && fileExists(node_path.default.join(node_path.default.dirname(params.legacyDir), dirent.name, node_path.default.basename(legacySessionFile))))) return;
	const parsed = node_path.default.parse(node_path.default.basename(legacySessionFile));
	if (safeReadDir(params.targetDir).some((dirent) => dirent.isFile() && dirent.name.startsWith(`${parsed.name}.legacy-`) && dirent.name.endsWith(parsed.ext))) return;
	const targetSessionFile = node_path.default.join(params.targetDir, node_path.default.basename(legacySessionFile));
	if (!fileExists(targetSessionFile) || typeof entry.sessionId !== "string") return;
	const readFirstLine = () => {
		const fd = node_fs.default.openSync(targetSessionFile, "r");
		try {
			const buffer = Buffer.alloc(8192);
			const bytesRead = node_fs.default.readSync(fd, buffer, 0, buffer.length, 0);
			if (bytesRead <= 0) return;
			const chunk = buffer.subarray(0, bytesRead).toString("utf8");
			const newline = chunk.indexOf("\n");
			return newline >= 0 ? chunk.slice(0, newline) : chunk;
		} finally {
			node_fs.default.closeSync(fd);
		}
	};
	try {
		const firstLine = readFirstLine();
		const header = firstLine ? JSON.parse(firstLine) : void 0;
		if (!header || typeof header !== "object" || Array.isArray(header)) return;
		if (header.type === "session") return header.id === entry.sessionId ? targetSessionFile : void 0;
		return (node_path.default.basename(entry.sessionId) === entry.sessionId ? `${entry.sessionId}.jsonl` : void 0) === node_path.default.basename(targetSessionFile) ? targetSessionFile : void 0;
	} catch {
		return;
	}
}
function skipJson5Trivia(raw, index) {
	let i = index;
	while (i < raw.length) {
		const ch = raw[i];
		if (ch === " " || ch === "\n" || ch === "\r" || ch === "	") {
			i++;
			continue;
		}
		if (ch === "/" && raw[i + 1] === "/") {
			i += 2;
			while (i < raw.length && raw[i] !== "\n") i++;
			continue;
		}
		if (ch === "/" && raw[i + 1] === "*") {
			i += 2;
			while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) i++;
			return i < raw.length ? i + 2 : i;
		}
		break;
	}
	return i;
}
function readJson5String(raw, index) {
	const quote = raw[index];
	if (quote !== "\"" && quote !== "'") return null;
	let i = index + 1;
	let value = "";
	while (i < raw.length) {
		const ch = raw[i];
		if (ch === quote) return {
			value,
			next: i + 1
		};
		if (ch === "\\") return null;
		value += ch;
		i++;
	}
	return null;
}
function readJson5BareKey(raw, index) {
	let i = index;
	while (i < raw.length) {
		const ch = raw[i];
		if (ch === ":" || ch === " " || ch === "\n" || ch === "\r" || ch === "	" || ch === "," || ch === "}" || ch === "{" || ch === "[" || ch === "]") break;
		i++;
	}
	if (i === index) return null;
	return {
		value: raw.slice(index, i),
		next: i
	};
}
function listTopLevelSessionStoreKeys(raw) {
	let i = skipJson5Trivia(raw, 0);
	if (raw[i] !== "{") return null;
	i++;
	const keys = [];
	let depth = 1;
	let expectingKey = true;
	while (i < raw.length) {
		i = skipJson5Trivia(raw, i);
		const ch = raw[i];
		if (ch === void 0) return null;
		if (depth === 1 && ch === "}") return keys;
		if (depth === 1 && expectingKey) {
			const key = ch === "\"" || ch === "'" ? readJson5String(raw, i) : readJson5BareKey(raw, i);
			if (!key) return null;
			i = skipJson5Trivia(raw, key.next);
			if (raw[i] !== ":") return null;
			keys.push(key.value);
			i++;
			expectingKey = false;
			continue;
		}
		if (ch === "\"" || ch === "'") {
			const str = readJson5String(raw, i);
			if (!str) return null;
			i = str.next;
			continue;
		}
		if (ch === "{" || ch === "[") {
			depth++;
			i++;
			continue;
		}
		if (ch === "}" || ch === "]") {
			depth--;
			i++;
			if (depth < 1) return keys;
			continue;
		}
		if (depth === 1 && ch === ",") {
			expectingKey = true;
			i++;
			continue;
		}
		i++;
	}
	return null;
}
function sessionStoreTextMayNeedCanonicalization(params) {
	const keys = listTopLevelSessionStoreKeys(params.raw);
	if (!keys) return true;
	const storeAgentIds = new Set([...params.storeAgentIds].map((id) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(id)));
	const hasNonMainAgent = [...storeAgentIds].some((id) => id !== require_session_key.DEFAULT_AGENT_ID);
	for (const key of keys) {
		const rawKey = key.trim();
		if (rawKey !== key) return true;
		if (!rawKey) continue;
		const lowerKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(rawKey);
		if (lowerKey !== rawKey) return true;
		if (lowerKey === "global" || lowerKey === "unknown") continue;
		if (params.preserveForeignMainAliases && isLegacyDefaultMainAliasKey(lowerKey, params.mainKey)) return true;
		if (lowerKey === "main" || lowerKey === params.mainKey) return true;
		if (lowerKey.startsWith("subagent:")) return true;
		if (lowerKey.startsWith("group:") || lowerKey.startsWith("channel:")) return true;
		if (!lowerKey.startsWith("agent:")) return true;
		const rowOwner = resolveCanonicalAgentSessionOwner(rawKey);
		if (!rowOwner) return true;
		const agentMainAlias = `agent:${rowOwner}:${require_session_key.DEFAULT_MAIN_KEY}`;
		const agentMainKey = `agent:${rowOwner}:${params.mainKey}`;
		if (lowerKey === agentMainAlias && (params.mainKey !== "main" || params.scope === "global")) return true;
		if (lowerKey === agentMainKey && params.scope === "global") return true;
		if (lowerKey === `agent:main:main` && (params.mainKey !== "main" || hasNonMainAgent || params.scope === "global")) return true;
		if (lowerKey === `agent:main:${params.mainKey}` && hasNonMainAgent && !storeAgentIds.has("main")) return true;
	}
	return false;
}
function listLegacySessionKeys(params) {
	const legacy = [];
	for (const key of Object.keys(params.store)) if (canonicalizeSessionKeyForAgent({
		key,
		agentId: params.agentId,
		mainKey: params.mainKey,
		scope: params.scope,
		skipCrossAgentRemap: params.preserveAmbiguousKeys,
		preserveCanonicalAgentOwner: params.preserveAmbiguousKeys,
		preserveAmbiguousKeys: params.preserveAmbiguousKeys,
		preserveForeignMainAliases: params.preserveForeignMainAliases
	}) !== key) legacy.push(key);
	return legacy;
}
function emptyDirOrMissing(dir) {
	if (!existsDir(dir)) return true;
	return safeReadDir(dir).length === 0;
}
function removeDirIfEmpty(dir) {
	if (!existsDir(dir)) return;
	if (!emptyDirOrMissing(dir)) return;
	try {
		node_fs.default.rmdirSync(dir);
	} catch {}
}
async function migrateOrphanedSessionKeys(params) {
	const changes = [];
	const warnings = [];
	const env = params.env ?? process.env;
	const stateDir = require_paths.resolveStateDir(env);
	const mainKey = require_session_key.normalizeMainKey(params.cfg.session?.mainKey);
	const scope = params.cfg.session?.scope;
	const storeConfig = params.cfg.session?.store;
	const pluginAgentIds = params.additionalAgentIds ?? require_doctor_contract_registry.listPluginDoctorSessionStoreAgentIds({
		config: params.cfg,
		env,
		pluginIds: require_doctor_contract_registry.collectRelevantDoctorPluginIds(params.cfg)
	});
	const pluginAgentIdSet = new Set(pluginAgentIds.map((id) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(id)));
	const storeMap = /* @__PURE__ */ new Map();
	const storeAliasCandidates = /* @__PURE__ */ new Map();
	const addToStoreMap = (p, id) => {
		const storePath = [...storeMap.keys()].find((candidate) => sessionStorePathsMatch(candidate, p)) ?? p;
		const aliasCandidates = storeAliasCandidates.get(storePath) ?? /* @__PURE__ */ new Set([storePath]);
		aliasCandidates.add(p);
		storeAliasCandidates.set(storePath, aliasCandidates);
		const existing = storeMap.get(storePath);
		if (existing) existing.add(id);
		else storeMap.set(storePath, /* @__PURE__ */ new Set([id]));
	};
	for (const configuredAgentId of require_targets.listConfiguredSessionStoreAgentIds(params.cfg)) {
		const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(configuredAgentId);
		addToStoreMap(storeConfig ? resolveStorePathFromTemplate(storeConfig, id, env) : node_path.default.join(stateDir, "agents", id, "sessions", "sessions.json"), id);
	}
	for (const pluginAgentId of pluginAgentIds) {
		const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(pluginAgentId);
		addToStoreMap(storeConfig ? resolveStorePathFromTemplate(storeConfig, id, env) : node_path.default.join(stateDir, "agents", id, "sessions", "sessions.json"), id);
	}
	const agentsDir = node_path.default.join(stateDir, "agents");
	if (existsDir(agentsDir)) {
		for (const dirEntry of safeReadDir(agentsDir)) if (dirEntry.isDirectory()) {
			const diskAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(dirEntry.name);
			if (diskAgentId) addToStoreMap(node_path.default.join(agentsDir, diskAgentId, "sessions", "sessions.json"), diskAgentId);
		}
	}
	for (const [mappedStorePath, storeAgentIds] of storeMap) {
		const storePaths = storeAliasCandidates.get(mappedStorePath) ?? /* @__PURE__ */ new Set([mappedStorePath]);
		const storePath = [...storePaths].find((candidate) => fileExists(candidate));
		if (!storePath) continue;
		const pluginForeignMainAliasRisk = [...storeAgentIds].some((id) => pluginAgentIdSet.has(id) && id !== "main");
		let raw;
		try {
			raw = node_fs.default.readFileSync(storePath, "utf-8");
		} catch (err) {
			warnings.push(`Could not read ${storePath}: ${String(err)}`);
			continue;
		}
		if (!sessionStoreTextMayNeedCanonicalization({
			raw,
			storeAgentIds,
			mainKey,
			scope,
			preserveForeignMainAliases: pluginForeignMainAliasRisk
		})) continue;
		let parsed;
		try {
			parsed = parseSessionStoreJson5(raw);
		} catch (err) {
			warnings.push(`Could not read ${storePath}: ${String(err)}`);
			continue;
		}
		if (!parsed.ok) continue;
		let working = parsed.store;
		let totalLegacy = 0;
		const storeAliases = resolveSessionStoreAliasPlan(storePath, storePaths);
		const hasDistinctAliases = storeAliases.hasDistinctAliases;
		const preserveAmbiguousKeys = storeAgentIds.size > 1;
		const preservedAmbiguousKeyCount = Object.keys(working).filter((key) => preserveAmbiguousKeys && isAmbiguousSharedStoreKey(key, mainKey, scope) || pluginForeignMainAliasRisk && isLegacyDefaultMainAliasKey(key, mainKey)).length;
		if (storeAliases.hasUnresolvedIdentity) {
			warnings.push(unresolvedSessionStoreIdentityWarning("session key migration", storePath));
			continue;
		}
		if (hasDistinctAliases && preservedAmbiguousKeyCount > 0) {
			warnings.push(aliasedSessionStoreMigrationWarning({
				subject: "migration of",
				count: preservedAmbiguousKeyCount,
				storePath
			}));
			continue;
		}
		if (storeAliases.hasFinalSymlink) {
			warnings.push(`Deferred session key migration in final-component symlink store ${storePath}; configure one canonical session.store path, then rerun openclaw doctor --fix`);
			continue;
		}
		if (hasDistinctAliases) {
			warnings.push(distinctSessionStoreAliasWarning("session key migration", storePath));
			continue;
		}
		for (const storeAgentId of storeAgentIds) {
			const { store: canonicalized, legacyKeys } = canonicalizeSessionStore({
				store: working,
				agentId: storeAgentId,
				mainKey,
				scope,
				skipCrossAgentRemap: preserveAmbiguousKeys,
				preserveCanonicalAgentOwner: true,
				preserveAmbiguousKeys,
				preserveForeignMainAliases: pluginForeignMainAliasRisk
			});
			working = canonicalized;
			totalLegacy += legacyKeys.length;
		}
		if (preservedAmbiguousKeyCount > 0) warnings.push(`Preserved ${preservedAmbiguousKeyCount} ambiguous session key(s) in potentially shared store ${storePath}`);
		if (totalLegacy === 0) continue;
		const normalized = Object.create(null);
		for (const [key, entry] of Object.entries(working)) {
			const ne = normalizeSessionEntry(entry);
			if (ne) normalized[key] = ne;
		}
		try {
			await saveSessionStoreStrict(storePath, normalized);
			changes.push(`Canonicalized ${totalLegacy} orphaned session key(s) in ${storePath}`);
		} catch (err) {
			warnings.push(`Failed to write canonicalized store ${storePath}: ${String(err)}`);
		}
	}
	return {
		changes,
		warnings
	};
}
async function migrateLegacyAcpSessionMetadata(params) {
	const changes = [];
	const warnings = [];
	const env = params.env ?? process.env;
	const now = params.now ?? (() => Date.now());
	const stateDir = require_paths.resolveStateDir(env);
	const storeConfig = params.cfg.session?.store;
	const pluginAgentIds = params.pluginSessionStoreAgentIds ?? require_doctor_contract_registry.listPluginDoctorSessionStoreAgentIds({
		config: params.cfg,
		env,
		pluginIds: require_doctor_contract_registry.collectRelevantDoctorPluginIds(params.cfg)
	});
	const normalizedPluginAgentIds = new Set(pluginAgentIds.map((id) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(id)));
	const declaredAgentIds = /* @__PURE__ */ new Set([...require_targets.listConfiguredSessionStoreAgentIds(params.cfg).map((id) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(id)), ...normalizedPluginAgentIds]);
	const declaredTargets = [...declaredAgentIds].map((agentId) => ({
		agentId,
		storePath: storeConfig ? resolveStorePathFromTemplate(storeConfig, agentId, env) : node_path.default.join(stateDir, "agents", agentId, "sessions", "sessions.json")
	}));
	const pluginTargets = declaredTargets.filter(({ agentId }) => agentId !== "main" && normalizedPluginAgentIds.has(agentId));
	const configuredAgents = Array.isArray(params.cfg.agents?.list) ? params.cfg.agents.list : [];
	const configuredAgentIds = new Set(configuredAgents.flatMap((entry) => entry?.id ? [(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id)] : []));
	const targets = resolveLegacyAcpMetadataSessionStoreTargets([...declaredAgentIds].some((agentId) => !configuredAgentIds.has(agentId)) ? {
		...params.cfg,
		agents: {
			...params.cfg.agents,
			list: [...configuredAgents, ...[...declaredAgentIds].filter((agentId) => !configuredAgentIds.has(agentId)).map((id) => ({ id }))]
		}
	} : params.cfg, env);
	const mainKey = require_session_key.normalizeMainKey(params.cfg.session?.mainKey);
	const scope = params.cfg.session?.scope;
	const storeGroups = [];
	for (const target of targets) {
		if (!fileExists(target.storePath)) continue;
		const group = storeGroups.find(({ target: existing }) => sessionStorePathsMatch(existing.storePath, target.storePath));
		const matchingDeclaredTargets = declaredTargets.filter((declaredTarget) => sessionStorePathsMatch(target.storePath, declaredTarget.storePath));
		if (group) {
			group.agentIds.add((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(target.agentId));
			group.aliasCandidates.add(target.storePath);
			for (const declaredTarget of matchingDeclaredTargets) {
				group.agentIds.add(declaredTarget.agentId);
				group.aliasCandidates.add(declaredTarget.storePath);
			}
			continue;
		}
		storeGroups.push({
			target,
			agentIds: /* @__PURE__ */ new Set([(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(target.agentId), ...matchingDeclaredTargets.map((declaredTarget) => declaredTarget.agentId)]),
			aliasCandidates: /* @__PURE__ */ new Set([target.storePath, ...matchingDeclaredTargets.map((declaredTarget) => declaredTarget.storePath)])
		});
	}
	for (const { target, agentIds, aliasCandidates } of storeGroups) {
		const storePath = target.storePath;
		const storeAliases = resolveSessionStoreAliasPlan(storePath, aliasCandidates);
		const pluginForeignMainAliasRisk = pluginTargets.some((pluginTarget) => sessionStorePathsMatch(storePath, pluginTarget.storePath));
		let parsed;
		try {
			parsed = readSessionStoreJson5(storePath);
		} catch (err) {
			warnings.push(`Could not read ${storePath}: ${String(err)}`);
			continue;
		}
		if (!parsed.ok) continue;
		const ambiguousKeyCount = Object.keys(parsed.store).filter((key) => isAmbiguousSharedStoreKey(key, mainKey, scope) || pluginForeignMainAliasRisk && isLegacyDefaultMainAliasKey(key, mainKey)).length;
		const hasLegacyAcpMetadata = Object.values(parsed.store).some((entry) => normalizeSessionEntry(entry)?.acp !== void 0);
		if (hasLegacyAcpMetadata && storeAliases.hasUnresolvedIdentity) {
			warnings.push(unresolvedSessionStoreIdentityWarning("ACP metadata migration", storePath));
			continue;
		}
		if (hasLegacyAcpMetadata && storeAliases.hasFinalSymlink) {
			warnings.push(`Deferred ACP metadata migration in final-component symlink store ${storePath}; configure one canonical session.store path, then rerun openclaw doctor --fix`);
			continue;
		}
		if (hasLegacyAcpMetadata && storeAliases.hasDistinctAliases) {
			warnings.push(ambiguousKeyCount > 0 ? aliasedSessionStoreMigrationWarning({
				subject: "ACP metadata migration for",
				count: ambiguousKeyCount,
				storePath
			}) : distinctSessionStoreAliasWarning("ACP metadata migration", storePath));
			continue;
		}
		const normalized = Object.create(null);
		let migrated = 0;
		let preserved = 0;
		for (const [sessionKey, entry] of Object.entries(parsed.store)) {
			const normalizedEntry = normalizeSessionEntry(entry);
			if (!normalizedEntry) continue;
			if (normalizedEntry.acp) {
				const ambiguousSharedStoreKey = isAmbiguousSharedStoreKey(sessionKey, mainKey, scope);
				const ambiguousMultiOwnerKey = agentIds.size > 1 && ambiguousSharedStoreKey;
				const foreignMainAlias = pluginForeignMainAliasRisk && isLegacyDefaultMainAliasKey(sessionKey, mainKey);
				if (ambiguousMultiOwnerKey || foreignMainAlias) {
					preserved++;
					normalized[sessionKey] = normalizedEntry;
					continue;
				}
				require_session_meta.writeAcpSessionMetaForMigration({
					sessionKey: canonicalizeSessionKeyForAgent({
						key: sessionKey,
						agentId: resolveCanonicalAgentSessionOwner(sessionKey) ?? target.agentId,
						mainKey,
						scope,
						skipCrossAgentRemap: true
					}),
					sessionId: normalizedEntry.sessionId,
					meta: normalizedEntry.acp,
					env,
					now
				});
				delete normalizedEntry.acp;
				migrated++;
			}
			normalized[sessionKey] = normalizedEntry;
		}
		if (preserved > 0) warnings.push(`Preserved ACP metadata for ${preserved} ambiguous session key(s) in potentially shared store ${storePath}`);
		if (migrated === 0) continue;
		try {
			await saveSessionStoreStrict(storePath, normalized);
			changes.push(`Migrated ${migrated} ACP session metadata ${migrated === 1 ? "row" : "rows"} → shared SQLite state`);
		} catch (err) {
			warnings.push(`Failed to write ACP metadata migration source ${storePath}: ${String(err)}`);
		}
	}
	return {
		changes,
		warnings
	};
}
function resolveLegacyAcpMetadataSessionStoreTargets(cfg, env) {
	const stateDir = require_paths.resolveStateDir(env);
	const agentsDirs = /* @__PURE__ */ new Set([node_path.default.join(stateDir, "agents")]);
	const targets = /* @__PURE__ */ new Map();
	const addTarget = (agentId, storePath) => {
		if (!isManagedLegacySessionStorePathSafe(storePath)) return;
		const agentsDir = require_paths$1.resolveAgentsDirFromSessionStorePath(storePath);
		if (agentsDir) agentsDirs.add(agentsDir);
		if (!targets.has(storePath)) targets.set(storePath, {
			agentId,
			storePath
		});
	};
	for (const target of require_targets.resolveAllAgentSessionStoreTargetsSync(cfg, { env })) addTarget(target.agentId, target.storePath);
	for (const target of require_targets.resolveSessionStoreTargets(cfg, { allAgents: true }, { env })) addTarget(target.agentId, target.storePath);
	for (const agentsDir of agentsDirs) {
		if (!existsDir(agentsDir)) continue;
		for (const entry of safeReadDir(agentsDir)) {
			if (!entry.isDirectory()) continue;
			const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.name);
			const normalizedDirName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry.name);
			if (agentId === "main" && normalizedDirName !== agentId) continue;
			addTarget(agentId, node_path.default.join(agentsDir, entry.name, "sessions", "sessions.json"));
		}
	}
	return [...targets.values()];
}
function isManagedLegacySessionStorePathSafe(storePath) {
	const resolvedStorePath = node_path.default.resolve(storePath);
	const agentsDir = require_paths$1.resolveAgentsDirFromSessionStorePath(resolvedStorePath);
	if (!agentsDir) return true;
	if (!fileExists(resolvedStorePath)) return true;
	try {
		const stat = node_fs.default.lstatSync(resolvedStorePath);
		if (stat.isSymbolicLink() || !stat.isFile()) return false;
		const resolvedAgentsDir = node_path.default.resolve(agentsDir);
		const realStorePath = node_fs.default.realpathSync.native(resolvedStorePath);
		return (0, _openclaw_fs_safe_path.isWithinDir)(node_fs.default.realpathSync.native(resolvedAgentsDir), realStorePath);
	} catch {
		return false;
	}
}
function resolveStorePathFromTemplate(template, agentId, env) {
	const expand = (s) => s.startsWith("~") ? require_home_dir.expandHomePrefix(s, {
		env: env ?? process.env,
		homedir: node_os.default.homedir
	}) : s;
	if (template.includes("{agentId}")) return node_path.default.resolve(expand(template.replaceAll("{agentId}", agentId)));
	return node_path.default.resolve(expand(template));
}
function resolveSessionStorePathRelationship(left, right) {
	if (left === right) return "same";
	try {
		return (0, _openclaw_fs_safe_advanced.sameFileIdentity)(node_fs.default.statSync(left), node_fs.default.statSync(right)) ? "same" : "different";
	} catch (err) {
		const code = err.code;
		if (code !== "ENOENT" && code !== "ENOTDIR") return "unknown";
		const resolvedLeft = resolvePathThroughExistingParents(left);
		const resolvedRight = resolvePathThroughExistingParents(right);
		if (resolvedLeft === void 0 || resolvedRight === void 0) return "unknown";
		return resolvedLeft === resolvedRight ? "same" : "different";
	}
}
function sessionStorePathsMatch(left, right) {
	return resolveSessionStorePathRelationship(left, right) !== "different";
}
function resolvePathThroughExistingParents(filePath) {
	const resolvedPath = node_path.default.resolve(filePath);
	const suffix = [node_path.default.basename(resolvedPath)];
	let parentPath = node_path.default.dirname(resolvedPath);
	while (true) try {
		return node_path.default.join(node_fs.default.realpathSync.native(parentPath), ...suffix);
	} catch (err) {
		const code = err.code;
		if (code !== "ENOENT" && code !== "ENOTDIR") return;
		const nextParent = node_path.default.dirname(parentPath);
		if (nextParent === parentPath) return;
		suffix.unshift(node_path.default.basename(parentPath));
		parentPath = nextParent;
	}
}
function sessionStorePathIsFinalSymlink(storePath) {
	try {
		return node_fs.default.lstatSync(storePath).isSymbolicLink();
	} catch {
		return false;
	}
}
function sessionStorePathsHaveDistinctEntries(left, right) {
	if (left === right) return false;
	try {
		if (node_fs.default.lstatSync(left).isSymbolicLink() || node_fs.default.lstatSync(right).isSymbolicLink()) return true;
		return node_fs.default.realpathSync.native(left) !== node_fs.default.realpathSync.native(right);
	} catch (err) {
		const code = err.code;
		if (code !== "ENOENT" && code !== "ENOTDIR") return true;
		const resolvedLeft = resolvePathThroughExistingParents(left);
		const resolvedRight = resolvePathThroughExistingParents(right);
		return resolvedLeft === void 0 || resolvedLeft !== resolvedRight;
	}
}
function resolveSessionStoreAliasPlan(storePath, candidatePaths) {
	let hasDistinctEntries = false;
	let hasFinalSymlink = sessionStorePathIsFinalSymlink(storePath);
	let hasUnresolvedIdentity = false;
	for (const candidatePath of candidatePaths) {
		const relationship = resolveSessionStorePathRelationship(storePath, candidatePath);
		if (relationship === "different") continue;
		if (relationship === "unknown") {
			hasUnresolvedIdentity = true;
			continue;
		}
		hasFinalSymlink ||= sessionStorePathIsFinalSymlink(candidatePath);
		if (sessionStorePathsHaveDistinctEntries(storePath, candidatePath)) hasDistinctEntries = true;
	}
	return {
		hasDistinctAliases: hasFinalSymlink || hasDistinctEntries || hasUnresolvedIdentity,
		hasFinalSymlink,
		hasUnresolvedIdentity
	};
}
function mergeSessionStoreAliasPlans(left, right) {
	if (!left) return right;
	return {
		hasDistinctAliases: left.hasDistinctAliases || right.hasDistinctAliases,
		hasFinalSymlink: left.hasFinalSymlink || right.hasFinalSymlink,
		hasUnresolvedIdentity: left.hasUnresolvedIdentity || right.hasUnresolvedIdentity
	};
}
async function saveSessionStoreStrict(storePath, store) {
	await require_store$1.saveSessionStore(storePath, store, {
		skipMaintenance: true,
		requireWriteSuccess: true
	});
}
function resolveSessionStoreOwnership(params) {
	const targetStorePath = node_path.default.join(params.stateDir, "agents", params.targetAgentId, "sessions", "sessions.json");
	const configuredStore = params.cfg.session?.store;
	const resolveAgentStorePath = (agentId) => configuredStore ? resolveStorePathFromTemplate(configuredStore, agentId, params.env) : node_path.default.join(params.stateDir, "agents", agentId, "sessions", "sessions.json");
	const preserveForeignMainAliases = params.pluginSessionStoreAgentIds.some((pluginAgentId) => {
		const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(pluginAgentId);
		if (id === "main") return false;
		return sessionStorePathsMatch(resolveAgentStorePath(id), targetStorePath);
	});
	const configuredOwnerStorePaths = [.../* @__PURE__ */ new Set([...require_targets.listConfiguredSessionStoreAgentIds(params.cfg).map((id) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(id)), ...params.pluginSessionStoreAgentIds.map((id) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(id))])].map(resolveAgentStorePath);
	const preserveAmbiguousKeys = configuredOwnerStorePaths.filter((storePath) => sessionStorePathsMatch(storePath, targetStorePath)).length > 1;
	const candidateStorePaths = [...configuredOwnerStorePaths];
	const agentsDir = node_path.default.join(params.stateDir, "agents");
	for (const entry of safeReadDir(agentsDir)) if (entry.isDirectory()) candidateStorePaths.push(node_path.default.join(agentsDir, entry.name, "sessions", "sessions.json"));
	return {
		preserveAmbiguousKeys,
		preserveForeignMainAliases,
		targetStoreAliases: resolveSessionStoreAliasPlan(targetStorePath, candidateStorePaths)
	};
}
//#endregion
//#region src/infra/state-migrations.legacy-sessions.ts
async function migrateLegacySessions(detected, now, options = {}) {
	const changes = [];
	const warnings = [];
	if (!detected.sessions.hasLegacy) return {
		changes,
		warnings
	};
	ensureMigrationDir(detected.sessions.targetDir);
	const legacyParsed = fileExists(detected.sessions.legacyStorePath) ? readSessionStoreJson5(detected.sessions.legacyStorePath) : {
		store: {},
		ok: true
	};
	const targetParsed = fileExists(detected.sessions.targetStorePath) ? readSessionStoreJson5(detected.sessions.targetStorePath) : {
		store: {},
		ok: true
	};
	const legacyStore = legacyParsed.store;
	const targetStore = targetParsed.store;
	if (detected.sessions.targetStoreAliases.hasUnresolvedIdentity) {
		warnings.push(unresolvedSessionStoreIdentityWarning("legacy session migration", detected.sessions.targetStorePath));
		return {
			changes,
			warnings
		};
	}
	if (detected.sessions.targetStoreAliases.hasFinalSymlink) {
		warnings.push(`Deferred legacy session migration in final-component symlink store ${detected.sessions.targetStorePath}; configure one canonical session.store path, then rerun operator doctor --fix`);
		return {
			changes,
			warnings
		};
	}
	const ambiguousAliasedKeys = new Set([...Object.keys(targetStore), ...Object.keys(legacyStore)].filter((key) => isAmbiguousSharedStoreKey(key, detected.targetMainKey, detected.targetScope) || detected.sessions.preserveForeignMainAliases && isLegacyDefaultMainAliasKey(key, detected.targetMainKey)));
	if (detected.sessions.targetStoreAliases.hasDistinctAliases) {
		warnings.push(ambiguousAliasedKeys.size > 0 ? aliasedSessionStoreMigrationWarning({
			subject: "migration of",
			count: ambiguousAliasedKeys.size,
			storePath: detected.sessions.targetStorePath
		}) : distinctSessionStoreAliasWarning("legacy session migration", detected.sessions.targetStorePath));
		return {
			changes,
			warnings
		};
	}
	const canonicalizedTarget = canonicalizeSessionStore({
		store: targetStore,
		agentId: detected.targetAgentId,
		mainKey: detected.targetMainKey,
		scope: detected.targetScope,
		skipCrossAgentRemap: detected.sessions.preserveAmbiguousKeys,
		preserveCanonicalAgentOwner: true,
		preserveAmbiguousKeys: detected.sessions.preserveAmbiguousKeys,
		preserveForeignMainAliases: detected.sessions.preserveForeignMainAliases
	});
	const canonicalizedLegacy = canonicalizeSessionStore({
		store: legacyStore,
		agentId: detected.targetAgentId,
		mainKey: detected.targetMainKey,
		scope: detected.targetScope,
		preserveCanonicalAgentOwner: true,
		preserveForeignMainAliases: detected.sessions.preserveForeignMainAliases
	});
	const preservedLegacyForeignMainAliasCount = detected.sessions.preserveForeignMainAliases ? Object.keys(legacyStore).filter((key) => isLegacyDefaultMainAliasKey(key, detected.targetMainKey)).length : 0;
	let repairedStaleSessionFiles = false;
	for (const entry of Object.values(canonicalizedTarget.store)) {
		const targetSessionFile = resolveStaleLegacySessionFile({
			entry,
			legacyDir: detected.sessions.legacyDir,
			targetDir: detected.sessions.targetDir
		});
		if (targetSessionFile) {
			entry.sessionFile = targetSessionFile;
			repairedStaleSessionFiles = true;
		}
	}
	const merged = Object.create(null);
	for (const [key, entry] of Object.entries(canonicalizedTarget.store)) merged[key] = entry;
	for (const [key, entry] of Object.entries(canonicalizedLegacy.store)) merged[key] = mergeSessionEntry({
		existing: merged[key],
		incoming: entry,
		preferIncomingOnTie: false
	});
	const mainKey = require_session_key.buildAgentMainSessionKey({
		agentId: detected.targetAgentId,
		mainKey: detected.targetMainKey
	});
	let migratedDirectChatKey;
	if (!merged[mainKey]) {
		const latest = pickLatestLegacyDirectEntry(legacyStore);
		if (latest?.sessionId) {
			merged[mainKey] = latest;
			migratedDirectChatKey = mainKey;
		}
	}
	if (!legacyParsed.ok) warnings.push(`Legacy sessions store unreadable; left in place at ${detected.sessions.legacyStorePath}`);
	let targetReadable = !fileExists(detected.sessions.targetStorePath) || targetParsed.ok;
	if (!targetReadable) if (options.recoverCorruptTargetStore) {
		const archivedTargetPath = `${detected.sessions.targetStorePath}.corrupt-${now()}`;
		try {
			node_fs.default.renameSync(detected.sessions.targetStorePath, archivedTargetPath);
			changes.push(`Archived corrupt target sessions store → ${archivedTargetPath}`);
			targetReadable = true;
		} catch (err) {
			warnings.push(`Target sessions store unreadable; failed to archive ${detected.sessions.targetStorePath}: ${String(err)}`);
		}
	} else warnings.push(`Target sessions store unreadable; left untouched to avoid overwriting at ${detected.sessions.targetStorePath}. Run operator doctor --fix to archive it and retry the legacy merge.`);
	if (targetReadable && (legacyParsed.ok || targetParsed.ok) && (Object.keys(legacyStore).length > 0 || Object.keys(targetStore).length > 0)) {
		const normalized = Object.create(null);
		for (const [key, entry] of Object.entries(merged)) {
			const normalizedEntry = normalizeSessionEntry(entry);
			if (!normalizedEntry) continue;
			normalized[key] = normalizedEntry;
		}
		await saveSessionStoreStrict(detected.sessions.targetStorePath, normalized);
		if (migratedDirectChatKey) changes.push(`Migrated latest direct-chat session → ${migratedDirectChatKey}`);
		changes.push(`Merged sessions store → ${detected.sessions.targetStorePath}`);
		if (preservedLegacyForeignMainAliasCount > 0) warnings.push(`Preserved ${preservedLegacyForeignMainAliasCount} ambiguous session key(s) while importing legacy sessions into ${detected.sessions.targetStorePath}`);
		if (canonicalizedTarget.legacyKeys.length > 0) changes.push(`Canonicalized ${canonicalizedTarget.legacyKeys.length} legacy session key(s)`);
		if (repairedStaleSessionFiles) changes.push("Repaired migrated session transcript paths");
	}
	if (!targetReadable) return {
		changes,
		warnings
	};
	const movedSessionFiles = /* @__PURE__ */ new Map();
	const entries = safeReadDir(detected.sessions.legacyDir);
	for (const entry of entries) {
		if (!entry.isFile()) continue;
		if (entry.name === "sessions.json") continue;
		const from = node_path.default.join(detected.sessions.legacyDir, entry.name);
		let to = node_path.default.join(detected.sessions.targetDir, entry.name);
		if (fileExists(to)) {
			const parsed = node_path.default.parse(entry.name);
			to = node_path.default.join(detected.sessions.targetDir, `${parsed.name}.legacy-${now()}${parsed.ext}`);
		}
		try {
			node_fs.default.renameSync(from, to);
			movedSessionFiles.set(node_path.default.resolve(from), to);
			changes.push(`Moved ${entry.name} → agents/${detected.targetAgentId}/sessions`);
		} catch (err) {
			warnings.push(`Failed moving ${from}: ${String(err)}`);
		}
	}
	if (movedSessionFiles.size > 0) {
		let rewroteSessionFiles = false;
		for (const entry of Object.values(merged)) {
			const rawSessionFile = entry.sessionFile;
			const legacySessionFile = typeof rawSessionFile === "string" ? node_path.default.resolve(detected.sessions.legacyDir, rawSessionFile) : typeof entry.sessionId === "string" ? node_path.default.join(detected.sessions.legacyDir, `${entry.sessionId}.jsonl`) : void 0;
			const movedSessionFile = legacySessionFile ? movedSessionFiles.get(node_path.default.resolve(legacySessionFile)) : void 0;
			if (!movedSessionFile) continue;
			entry.sessionFile = movedSessionFile;
			rewroteSessionFiles = true;
		}
		if (rewroteSessionFiles) {
			const normalized = Object.create(null);
			for (const [key, entry] of Object.entries(merged)) {
				const normalizedEntry = normalizeSessionEntry(entry);
				if (normalizedEntry) normalized[key] = normalizedEntry;
			}
			await saveSessionStoreStrict(detected.sessions.targetStorePath, normalized);
			changes.push("Rewrote migrated session transcript paths");
		}
	}
	if (legacyParsed.ok && targetReadable) try {
		if (fileExists(detected.sessions.legacyStorePath)) node_fs.default.rmSync(detected.sessions.legacyStorePath, { force: true });
	} catch {}
	removeDirIfEmpty(detected.sessions.legacyDir);
	if (safeReadDir(detected.sessions.legacyDir).filter((e) => e.isFile()).length > 0) {
		const backupDir = `${detected.sessions.legacyDir}.legacy-${now()}`;
		try {
			node_fs.default.renameSync(detected.sessions.legacyDir, backupDir);
			warnings.push(`Left legacy sessions at ${backupDir}`);
		} catch {}
	}
	return {
		changes,
		warnings
	};
}
async function migrateLegacyAgentDir(detected, now) {
	const changes = [];
	const warnings = [];
	if (!detected.agentDir.hasLegacy) return {
		changes,
		warnings
	};
	ensureMigrationDir(detected.agentDir.targetDir);
	const entries = safeReadDir(detected.agentDir.legacyDir);
	for (const entry of entries) {
		const from = node_path.default.join(detected.agentDir.legacyDir, entry.name);
		const to = node_path.default.join(detected.agentDir.targetDir, entry.name);
		if (node_fs.default.existsSync(to)) continue;
		try {
			node_fs.default.renameSync(from, to);
			changes.push(`Moved agent file ${entry.name} → agents/${detected.targetAgentId}/agent`);
		} catch (err) {
			warnings.push(`Failed moving ${from}: ${String(err)}`);
		}
	}
	removeDirIfEmpty(detected.agentDir.legacyDir);
	if (!emptyDirOrMissing(detected.agentDir.legacyDir)) {
		const backupDir = node_path.default.join(detected.stateDir, "agents", detected.targetAgentId, `agent.legacy-${now()}`);
		try {
			node_fs.default.renameSync(detected.agentDir.legacyDir, backupDir);
			warnings.push(`Left legacy agent dir at ${backupDir}`);
		} catch (err) {
			warnings.push(`Failed relocating legacy agent dir: ${String(err)}`);
		}
	}
	return {
		changes,
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.managed-outgoing-images.ts
const LEGACY_RECORD_MAX_BYTES = 1024 * 1024;
const DEFAULT_TRANSIENT_TTL_MS = 900 * 1e3;
const ATTACHMENT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOCTOR_CLAIM_MARKER = ".json.doctor-importing-";
const DOCTOR_CLAIM_SUFFIX_RE = /^\d+-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RECORD_KEYS = /* @__PURE__ */ new Set([
	"attachmentId",
	"sessionKey",
	"agentId",
	"messageId",
	"createdAt",
	"updatedAt",
	"retentionClass",
	"alt",
	"original"
]);
const ORIGINAL_KEYS = /* @__PURE__ */ new Set([
	"path",
	"contentType",
	"width",
	"height",
	"sizeBytes",
	"filename"
]);
function resolveLegacyManagedOutgoingImageRecordsDir(stateDir) {
	return node_path.default.join(stateDir, "media", "outgoing", "records");
}
function sourceNameFromDoctorClaim(name) {
	const markerIndex = name.indexOf(DOCTOR_CLAIM_MARKER);
	if (markerIndex < 0) return null;
	const attachmentId = name.slice(0, markerIndex);
	const suffix = name.slice(markerIndex + 23);
	return ATTACHMENT_ID_RE.test(attachmentId) && DOCTOR_CLAIM_SUFFIX_RE.test(suffix) ? `${attachmentId}.json` : null;
}
function isLegacyManagedImageSourceName(name) {
	return name.endsWith(".json") || sourceNameFromDoctorClaim(name) !== null;
}
function detectLegacyManagedOutgoingImages(params) {
	const sourceDir = resolveLegacyManagedOutgoingImageRecordsDir(params.stateDir);
	let hasLegacy = false;
	if (params.doctorOnlyStateMigrations === true) try {
		hasLegacy = node_fs.default.readdirSync(sourceDir).some(isLegacyManagedImageSourceName);
	} catch {
		hasLegacy = false;
	}
	return {
		sourceDir,
		hasLegacy
	};
}
function recoverInterruptedDoctorClaims(sourceDir) {
	for (const claimName of node_fs.default.readdirSync(sourceDir).toSorted()) {
		const sourceName = sourceNameFromDoctorClaim(claimName);
		if (!sourceName) continue;
		const claimPath = node_path.default.join(sourceDir, claimName);
		const sourcePath = node_path.default.join(sourceDir, sourceName);
		const claimSnapshot = readLegacySourceSnapshot$4(claimPath);
		if (!node_fs.default.existsSync(sourcePath)) {
			node_fs.default.renameSync(claimPath, sourcePath);
			continue;
		}
		const sourceSnapshot = readLegacySourceSnapshot$4(sourcePath);
		if (sourceSnapshot.size !== claimSnapshot.size || sourceSnapshot.sha256 !== claimSnapshot.sha256) throw new Error(`interrupted managed image claim conflicts with ${sourcePath}`);
		node_fs.default.unlinkSync(claimPath);
	}
}
function readLegacySourceSnapshot$4(sourcePath) {
	const before = node_fs.default.lstatSync(sourcePath);
	if (!before.isFile() || before.isSymbolicLink()) throw new Error("legacy managed image source is not a regular non-symlink file");
	if (before.size > LEGACY_RECORD_MAX_BYTES) throw new Error("legacy managed image source exceeds the metadata size limit");
	const raw = node_fs.default.readFileSync(sourcePath, "utf8");
	const after = node_fs.default.lstatSync(sourcePath);
	if (!after.isFile() || after.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error("legacy managed image source changed while doctor was reading it");
	return {
		sourcePath,
		dev: after.dev,
		ino: after.ino,
		mtimeMs: after.mtimeMs,
		raw,
		sha256: (0, node_crypto.createHash)("sha256").update(raw).digest("hex"),
		size: after.size
	};
}
function sourceSnapshotsMatch$3(left, right) {
	return left.dev === right.dev && left.ino === right.ino && left.mtimeMs === right.mtimeMs && left.sha256 === right.sha256 && left.size === right.size;
}
function optionalNonEmptyString(value) {
	return typeof value === "string" && value.trim() ? value : void 0;
}
function nullableNonNegativeInteger(value) {
	if (value === null) return null;
	return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : void 0;
}
function parseLegacyManagedImageRecord(params) {
	const raw = JSON.parse(params.snapshot.raw);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.original)) throw new Error("legacy managed image record must be an object");
	const unexpectedRecordKey = Object.keys(raw).find((key) => !RECORD_KEYS.has(key));
	const unexpectedOriginalKey = Object.keys(raw.original).find((key) => !ORIGINAL_KEYS.has(key));
	if (unexpectedRecordKey || unexpectedOriginalKey) throw new Error(`legacy managed image record has unexpected field ${unexpectedRecordKey ?? `original.${unexpectedOriginalKey}`}`);
	const attachmentId = optionalNonEmptyString(raw.attachmentId);
	const sessionKey = optionalNonEmptyString(raw.sessionKey);
	const agentId = optionalNonEmptyString(raw.agentId);
	const messageId = raw.messageId === null ? null : optionalNonEmptyString(raw.messageId);
	const createdAt = optionalNonEmptyString(raw.createdAt);
	const updatedAt = optionalNonEmptyString(raw.updatedAt);
	const alt = typeof raw.alt === "string" ? raw.alt : void 0;
	const retentionClass = raw.retentionClass;
	const originalPath = optionalNonEmptyString(raw.original.path);
	const contentType = optionalNonEmptyString(raw.original.contentType);
	const width = nullableNonNegativeInteger(raw.original.width);
	const height = nullableNonNegativeInteger(raw.original.height);
	const sizeBytes = nullableNonNegativeInteger(raw.original.sizeBytes);
	const filename = raw.original.filename === null ? null : optionalNonEmptyString(raw.original.filename);
	if (!attachmentId || !ATTACHMENT_ID_RE.test(attachmentId) || node_path.default.basename(params.snapshot.sourcePath) !== `${attachmentId}.json` || !sessionKey || raw.agentId !== void 0 && !agentId || raw.messageId !== null && messageId === void 0 || !createdAt || !Number.isFinite(Date.parse(createdAt)) || raw.updatedAt !== void 0 && (!updatedAt || !Number.isFinite(Date.parse(updatedAt))) || retentionClass !== void 0 && retentionClass !== "transient" && retentionClass !== "history" || alt === void 0 || !originalPath || !contentType || width === void 0 || height === void 0 || sizeBytes === void 0 || raw.original.filename !== null && filename === void 0) throw new Error(`legacy managed image record is invalid: ${params.snapshot.sourcePath}`);
	const resolvedOriginalPath = node_path.default.resolve(originalPath);
	const mediaRoot = node_path.default.dirname(node_path.default.dirname(node_path.default.dirname(resolvedOriginalPath)));
	if (!(/* @__PURE__ */ new Set([node_path.default.resolve(params.stateDir, "media"), node_path.default.resolve(require_store.getMediaDir())])).has(mediaRoot) || node_path.default.dirname(resolvedOriginalPath) !== node_path.default.join(mediaRoot, "outgoing/originals")) throw new Error("legacy managed image original is outside managed outgoing storage");
	const mediaId = node_path.default.basename(resolvedOriginalPath);
	if (!mediaId || mediaId === "." || mediaId === "..") throw new Error("legacy managed image original has an invalid media id");
	return {
		snapshot: params.snapshot,
		originalPath: resolvedOriginalPath,
		record: {
			attachmentId,
			sessionKey,
			...agentId ? { agentId } : {},
			messageId: messageId ?? null,
			createdAt,
			...updatedAt ? { updatedAt } : {},
			...retentionClass === "transient" || retentionClass === "history" ? { retentionClass } : {},
			alt,
			original: {
				mediaRoot,
				mediaId,
				mediaSubdir: require_managed_image_record_store.MANAGED_OUTGOING_ORIGINALS_SUBDIR,
				contentType,
				width,
				height,
				sizeBytes,
				filename: filename ?? null
			}
		}
	};
}
function restoreClaimedSources(claimed) {
	const restoreErrors = [];
	for (const entry of claimed.toReversed()) {
		if (!node_fs.default.existsSync(entry.claimPath)) continue;
		if (node_fs.default.existsSync(entry.sourcePath)) {
			restoreErrors.push(`source path already exists: ${entry.sourcePath}`);
			continue;
		}
		try {
			node_fs.default.renameSync(entry.claimPath, entry.sourcePath);
		} catch (error) {
			restoreErrors.push(String(error));
		}
	}
	return restoreErrors;
}
function appendRestoreFailures(error, restoreErrors) {
	return `${String(error)}${restoreErrors.length > 0 ? `; restore failures: ${restoreErrors.join("; ")}` : ""}`;
}
function claimLegacySources$1(params) {
	params.beforeClaim?.();
	const claimed = [];
	try {
		for (const parsed of params.records) {
			const sourcePath = parsed.snapshot.sourcePath;
			const claimPath = `${sourcePath}.doctor-importing-${process.pid}-${(0, node_crypto.randomUUID)()}`;
			node_fs.default.renameSync(sourcePath, claimPath);
			claimed.push({
				claimPath,
				sourcePath,
				parsed
			});
			if (!sourceSnapshotsMatch$3(readLegacySourceSnapshot$4(claimPath), parsed.snapshot)) throw new Error(`legacy managed image source changed before doctor claimed it: ${sourcePath}`);
		}
		return claimed;
	} catch (error) {
		throw new Error(appendRestoreFailures(error, restoreClaimedSources(claimed)), { cause: error });
	}
}
function verifyClaimedSources(claimed) {
	for (const entry of claimed) {
		if (!sourceSnapshotsMatch$3(readLegacySourceSnapshot$4(entry.claimPath), entry.parsed.snapshot)) throw new Error(`claimed legacy managed image source changed: ${entry.sourcePath}`);
		if (node_fs.default.existsSync(entry.sourcePath)) throw new Error(`legacy managed image source was replaced while doctor imported it`);
	}
}
function removeClaimedSources$1(params) {
	try {
		for (const entry of params.claimed) (params.removeSource ?? node_fs.default.unlinkSync)(entry.claimPath);
	} catch (error) {
		throw new Error(appendRestoreFailures(error, restoreClaimedSources(params.claimed)), { cause: error });
	}
}
function isExpiredTransient(record, nowMs, transientTtlMs) {
	const createdAtMs = Date.parse(record.createdAt);
	return record.messageId === null && Number.isFinite(createdAtMs) && nowMs - createdAtMs >= transientTtlMs;
}
function rollbackImportedRecords(params) {
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
			for (const parsed of params.records) {
				const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("managed_outgoing_image_records").selectAll().where("attachment_id", "=", parsed.record.attachmentId));
				if (!row || row.cleanup_pending === 1 || !require_managed_image_record_store.managedImageRecordsEqual(require_managed_image_record_store.managedImageRecordFromRow(row), parsed.record)) continue;
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.deleteFrom("managed_outgoing_image_records").where("attachment_id", "=", parsed.record.attachmentId));
			}
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
		return null;
	} catch (error) {
		return String(error);
	}
}
/** Import, verify, and remove retired record JSON during explicit Doctor repair. */
function migrateLegacyManagedOutgoingImages(params) {
	const changes = [];
	const warnings = [];
	if (!params.detected.hasLegacy) return {
		changes,
		warnings
	};
	let parsedRecords;
	try {
		const sourceDirStat = node_fs.default.lstatSync(params.detected.sourceDir);
		if (!sourceDirStat.isDirectory() || sourceDirStat.isSymbolicLink()) throw new Error("legacy managed image records owner is not a regular directory");
		recoverInterruptedDoctorClaims(params.detected.sourceDir);
		parsedRecords = node_fs.default.readdirSync(params.detected.sourceDir).filter((name) => name.endsWith(".json")).toSorted().map((name) => parseLegacyManagedImageRecord({
			snapshot: readLegacySourceSnapshot$4(node_path.default.join(params.detected.sourceDir, name)),
			stateDir: params.stateDir
		}));
	} catch (error) {
		warnings.push(`Failed reading legacy managed outgoing image state: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	const nowMs = params.nowMs ?? Date.now();
	const transientTtlMs = params.transientTtlMs ?? DEFAULT_TRANSIENT_TTL_MS;
	const discardedIds = /* @__PURE__ */ new Set();
	const insertedRecords = [];
	let claimed;
	try {
		claimed = claimLegacySources$1({
			records: parsedRecords,
			beforeClaim: params.beforeClaim
		});
	} catch (error) {
		warnings.push(`Failed claiming legacy managed outgoing image state: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
			for (const parsed of parsedRecords) {
				const existing = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("managed_outgoing_image_records").selectAll().where("attachment_id", "=", parsed.record.attachmentId));
				if (existing) {
					if (!require_managed_image_record_store.managedImageRecordsEqual(require_managed_image_record_store.managedImageRecordFromRow(existing), parsed.record)) throw new Error(`legacy managed image record conflicts with shared SQLite state: ${parsed.record.attachmentId}`);
					continue;
				}
				if (isExpiredTransient(parsed.record, nowMs, transientTtlMs)) {
					discardedIds.add(parsed.record.attachmentId);
					continue;
				}
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("managed_outgoing_image_records").values(require_managed_image_record_store.managedImageRecordToRow(parsed.record)));
				insertedRecords.push(parsed);
			}
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
	} catch (error) {
		warnings.push(`Failed migrating legacy managed outgoing image state: ${appendRestoreFailures(error, restoreClaimedSources(claimed))}`);
		return {
			changes,
			warnings
		};
	}
	try {
		params.beforeVerify?.();
		const database = require_openclaw_state_db.openOperatorStateDatabase({ env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
		for (const parsed of parsedRecords) {
			const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, stateDb.selectFrom("managed_outgoing_image_records").selectAll().where("attachment_id", "=", parsed.record.attachmentId));
			if (discardedIds.has(parsed.record.attachmentId)) {
				if (row) throw new Error(`discarded transient record unexpectedly exists: ${parsed.record.attachmentId}`);
			} else if (!row || !require_managed_image_record_store.managedImageRecordsEqual(require_managed_image_record_store.managedImageRecordFromRow(row), parsed.record)) throw new Error(`managed image verification failed: ${parsed.record.attachmentId}`);
		}
		verifyClaimedSources(claimed);
	} catch (error) {
		const rollbackError = rollbackImportedRecords({
			records: insertedRecords,
			stateDir: params.stateDir
		});
		const restoreErrors = restoreClaimedSources(claimed);
		warnings.push(`Failed verifying legacy managed outgoing image migration: ${appendRestoreFailures(error, restoreErrors)}` + (rollbackError ? `; SQLite rollback failure: ${rollbackError}` : ""));
		return {
			changes,
			warnings
		};
	}
	let deletedExpiredFiles = 0;
	try {
		for (const parsed of parsedRecords) {
			if (!discardedIds.has(parsed.record.attachmentId)) continue;
			node_fs.default.rmSync(parsed.originalPath, { force: true });
			deletedExpiredFiles += 1;
		}
	} catch (error) {
		warnings.push(`Failed deleting expired legacy managed image attachments: ${appendRestoreFailures(error, restoreClaimedSources(claimed))}`);
		return {
			changes,
			warnings
		};
	}
	try {
		removeClaimedSources$1({
			claimed,
			removeSource: params.removeSource
		});
	} catch (error) {
		warnings.push(`Migrated managed outgoing images but could not remove legacy JSON: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	try {
		node_fs.default.rmdirSync(params.detected.sourceDir);
	} catch {}
	const importedCount = parsedRecords.length - discardedIds.size;
	if (importedCount > 0) changes.push(`Migrated ${importedCount} managed outgoing image record(s) → shared SQLite state`);
	if (discardedIds.size > 0) changes.push(`Discarded ${discardedIds.size} expired managed outgoing image record(s)` + (deletedExpiredFiles > 0 ? ` and ${deletedExpiredFiles} attachment file(s)` : ""));
	changes.push("Removed legacy managed outgoing image JSON after SQLite verification");
	return {
		changes,
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.messages.ts
function mergeNotices(sources) {
	return [...new Set(sources.flatMap((source) => source?.notices ? [...source.notices] : []))];
}
//#endregion
//#region src/infra/state-migrations.node-host.ts
const LEGACY_NODE_HOST_MAX_BYTES = 64 * 1024;
const MIGRATION_LOCK_TIMEOUT_MS$2 = 250;
const MIGRATION_LOCK_POLL_INTERVAL_MS$2 = 25;
const CONFIG_KEYS = /* @__PURE__ */ new Set([
	"version",
	"nodeId",
	"token",
	"displayName",
	"gateway"
]);
const GATEWAY_KEYS = /* @__PURE__ */ new Set([
	"host",
	"port",
	"tls",
	"tlsFingerprint",
	"contextPath"
]);
function legacyPathMayExist$2(filePath) {
	try {
		node_fs.default.lstatSync(filePath);
		return true;
	} catch (error) {
		return error.code !== "ENOENT";
	}
}
function sourceOrClaimMayExist$2(sourcePath) {
	return legacyPathMayExist$2(sourcePath) || legacyPathMayExist$2(`${sourcePath}.doctor-importing`);
}
/** Detect retired node-host state only when an explicit Doctor flow opts in. */
function detectLegacyNodeHostConfig(params) {
	const sourcePath = node_path.default.join(params.stateDir, require_config.LEGACY_NODE_HOST_CONFIG_FILE);
	return {
		sourcePath,
		hasLegacy: params.doctorOnlyStateMigrations === true && sourceOrClaimMayExist$2(sourcePath)
	};
}
function relativeLegacyPath$2(stateDir, filePath) {
	const relativePath = node_path.default.relative(node_path.default.resolve(stateDir), node_path.default.resolve(filePath));
	if (!relativePath || relativePath === ".." || relativePath.startsWith(`..${node_path.default.sep}`) || node_path.default.isAbsolute(relativePath)) throw new Error(`legacy node-host path is outside the state directory: ${filePath}`);
	return relativePath;
}
async function readLegacySourceSnapshot$3(stateRoot, stateDir, sourcePath) {
	const opened = await stateRoot.read(relativeLegacyPath$2(stateDir, sourcePath), {
		hardlinks: "reject",
		maxBytes: LEGACY_NODE_HOST_MAX_BYTES,
		symlinks: "reject"
	});
	const raw = opened.buffer.toString("utf8");
	return {
		sourcePath,
		dev: opened.stat.dev,
		ino: opened.stat.ino,
		mtimeMs: opened.stat.mtimeMs,
		raw,
		sha256: (0, node_crypto.createHash)("sha256").update(raw).digest("hex"),
		size: opened.stat.size
	};
}
function sourceSnapshotsMatch$2(left, right) {
	return left.dev === right.dev && left.ino === right.ino && left.mtimeMs === right.mtimeMs && left.sha256 === right.sha256 && left.size === right.size;
}
function contentSnapshotsMatch$1(left, right) {
	return left.sha256 === right.sha256 && left.size === right.size;
}
async function recoverInterruptedClaim$2(stateRoot, stateDir, sourcePath) {
	const claimPath = `${sourcePath}${require_config.LEGACY_NODE_HOST_CONFIG_CLAIM_SUFFIX}`;
	const claimRelativePath = relativeLegacyPath$2(stateDir, claimPath);
	const sourceRelativePath = relativeLegacyPath$2(stateDir, sourcePath);
	if (!await stateRoot.exists(claimRelativePath)) return;
	const claim = await readLegacySourceSnapshot$3(stateRoot, stateDir, claimPath);
	if (!await stateRoot.exists(sourceRelativePath)) {
		await stateRoot.move(claimRelativePath, sourceRelativePath);
		return;
	}
	if (!contentSnapshotsMatch$1(claim, await readLegacySourceSnapshot$3(stateRoot, stateDir, sourcePath))) throw new Error("interrupted node-host Doctor claim conflicts with its source");
	await stateRoot.remove(claimRelativePath);
}
function assertOnlyKeys$1(value, allowed, label) {
	const unexpected = Object.keys(value).find((key) => !allowed.has(key));
	if (unexpected) throw new Error(`${label} has unexpected field ${unexpected}`);
}
function optionalLegacyString(value, label) {
	if (value === void 0) return;
	if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
	return value.trim();
}
function optionalLegacyContextPath(value) {
	if (value === void 0) return;
	if (typeof value !== "string") throw new Error("legacy node-host gateway contextPath must be a string");
	return value.trim() || void 0;
}
function parseLegacyGateway(value) {
	if (value === void 0) return;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) throw new Error("legacy node-host gateway must be an object");
	assertOnlyKeys$1(value, GATEWAY_KEYS, "legacy node-host gateway");
	const port = value.port;
	if (port !== void 0 && (typeof port !== "number" || !Number.isSafeInteger(port) || port <= 0 || port > 65535)) throw new Error("legacy node-host gateway port is invalid");
	if (value.tls !== void 0 && typeof value.tls !== "boolean") throw new Error("legacy node-host gateway tls must be a boolean");
	const gateway = {
		host: optionalLegacyString(value.host, "legacy node-host gateway host"),
		port,
		tls: value.tls,
		tlsFingerprint: optionalLegacyString(value.tlsFingerprint, "legacy node-host gateway tlsFingerprint"),
		contextPath: optionalLegacyContextPath(value.contextPath)
	};
	return Object.values(gateway).some((entry) => entry !== void 0) ? gateway : void 0;
}
function parseLegacyNodeHostConfig(snapshot) {
	const parsed = JSON.parse(snapshot.raw);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed)) throw new Error("legacy node-host config must be an object");
	assertOnlyKeys$1(parsed, CONFIG_KEYS, "legacy node-host config");
	if (parsed.version !== 1) throw new Error("legacy node-host config version must be 1");
	if (typeof parsed.nodeId !== "string" || !parsed.nodeId.trim()) throw new Error("legacy node-host nodeId must be a non-empty string");
	if (parsed.token !== void 0 && typeof parsed.token !== "string") throw new Error("legacy node-host token must be a string when present");
	return {
		config: {
			version: 1,
			nodeId: parsed.nodeId.trim(),
			displayName: optionalLegacyString(parsed.displayName, "legacy node-host displayName"),
			gateway: parseLegacyGateway(parsed.gateway)
		},
		updatedAtMs: Math.max(0, Math.floor(snapshot.mtimeMs))
	};
}
function nullableNonEmptyString(value, label) {
	if (value === null) return;
	if (!value.trim()) throw new Error(`invalid node-host SQLite row: ${label} must not be empty`);
	return value.trim();
}
function rowToCanonicalState(row) {
	if (row.version !== 1 || !row.node_id.trim()) throw new Error("invalid canonical node-host SQLite identity");
	if (!Number.isSafeInteger(row.updated_at_ms) || row.updated_at_ms < 0) throw new Error("invalid canonical node-host SQLite timestamp");
	if (row.gateway_port !== null && (!Number.isSafeInteger(row.gateway_port) || row.gateway_port <= 0 || row.gateway_port > 65535)) throw new Error("invalid canonical node-host SQLite gateway port");
	if (row.gateway_tls !== null && row.gateway_tls !== 0 && row.gateway_tls !== 1) throw new Error("invalid canonical node-host SQLite gateway tls");
	const gateway = {
		host: nullableNonEmptyString(row.gateway_host, "gateway_host"),
		port: row.gateway_port ?? void 0,
		tls: row.gateway_tls === null ? void 0 : row.gateway_tls === 1,
		tlsFingerprint: nullableNonEmptyString(row.gateway_tls_fingerprint, "gateway_tls_fingerprint"),
		contextPath: nullableNonEmptyString(row.gateway_context_path, "gateway_context_path")
	};
	return {
		config: {
			version: 1,
			nodeId: row.node_id.trim(),
			displayName: nullableNonEmptyString(row.display_name, "display_name"),
			gateway: Object.values(gateway).some((entry) => entry !== void 0) ? gateway : void 0
		},
		updatedAtMs: row.updated_at_ms
	};
}
function configsEqual(left, right) {
	return left.nodeId === right.nodeId && left.displayName === right.displayName && left.gateway?.host === right.gateway?.host && left.gateway?.port === right.gateway?.port && left.gateway?.tls === right.gateway?.tls && left.gateway?.tlsFingerprint === right.gateway?.tlsFingerprint && left.gateway?.contextPath === right.gateway?.contextPath;
}
function writeCanonicalState(db, state) {
	const gateway = state.config.gateway;
	const row = {
		config_key: require_config.NODE_HOST_CONFIG_KEY,
		version: 1,
		node_id: state.config.nodeId,
		token: null,
		display_name: state.config.displayName ?? null,
		gateway_host: gateway?.host ?? null,
		gateway_port: gateway?.port ?? null,
		gateway_tls: gateway?.tls === void 0 ? null : gateway.tls ? 1 : 0,
		gateway_tls_fingerprint: gateway?.tlsFingerprint ?? null,
		gateway_context_path: gateway?.contextPath ?? null,
		updated_at_ms: state.updatedAtMs
	};
	const { config_key: _configKey, ...updates } = row;
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).insertInto("node_host_config").values(row).onConflict((conflict) => conflict.column("config_key").doUpdateSet(updates)));
}
function migrateIntoDatabase$1(params) {
	let imported = false;
	let preservedCanonical = false;
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("node_host_config").selectAll().where("config_key", "=", require_config.NODE_HOST_CONFIG_KEY));
		const existing = row ? rowToCanonicalState(row) : null;
		if (existing && existing.config.nodeId !== params.legacy.config.nodeId) throw new Error("legacy node-host nodeId conflicts with canonical SQLite identity");
		let expected = params.legacy;
		if (existing) {
			if (configsEqual(existing.config, params.legacy.config)) expected = existing.updatedAtMs >= params.legacy.updatedAtMs ? existing : params.legacy;
			else if (existing.updatedAtMs === params.legacy.updatedAtMs) throw new Error("legacy node-host config diverges at the same timestamp");
			else if (existing.updatedAtMs > params.legacy.updatedAtMs) {
				expected = existing;
				preservedCanonical = true;
			}
		}
		if (!existing || !configsEqual(existing.config, expected.config) || existing.updatedAtMs !== expected.updatedAtMs || row?.token !== null) {
			writeCanonicalState(db, expected);
			imported = expected === params.legacy;
		}
		const verifiedRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("node_host_config").selectAll().where("config_key", "=", require_config.NODE_HOST_CONFIG_KEY));
		if (!verifiedRow || verifiedRow.token !== null) throw new Error("SQLite verification failed for node-host config");
		const verified = rowToCanonicalState(verifiedRow);
		if (!configsEqual(verified.config, expected.config) || verified.updatedAtMs !== expected.updatedAtMs) throw new Error("SQLite verification failed for node-host config");
	}, { env: params.env });
	return {
		imported,
		preservedCanonical
	};
}
async function restoreClaim$1(params) {
	const claimPath = `${params.snapshot.sourcePath}${require_config.LEGACY_NODE_HOST_CONFIG_CLAIM_SUFFIX}`;
	try {
		if (!await params.stateRoot.exists(relativeLegacyPath$2(params.stateDir, claimPath))) return null;
		if (await params.stateRoot.exists(relativeLegacyPath$2(params.stateDir, params.snapshot.sourcePath))) return `source path already exists: ${params.snapshot.sourcePath}`;
		await params.stateRoot.move(relativeLegacyPath$2(params.stateDir, claimPath), relativeLegacyPath$2(params.stateDir, params.snapshot.sourcePath));
		return null;
	} catch (error) {
		return String(error);
	}
}
async function migrateWithExclusiveStateOwnership$1(params) {
	if (!params.detected.hasLegacy) return {
		changes: [],
		warnings: []
	};
	const changes = [];
	const warnings = [];
	const notices = [];
	const sourcePath = params.detected.sourcePath;
	let snapshot;
	let legacy;
	try {
		await recoverInterruptedClaim$2(params.stateRoot, params.stateDir, sourcePath);
		if (!await params.stateRoot.exists(relativeLegacyPath$2(params.stateDir, sourcePath))) return {
			changes,
			warnings
		};
		snapshot = await readLegacySourceSnapshot$3(params.stateRoot, params.stateDir, sourcePath);
		legacy = parseLegacyNodeHostConfig(snapshot);
		params.beforeVerify?.();
		if (!sourceSnapshotsMatch$2(await readLegacySourceSnapshot$3(params.stateRoot, params.stateDir, sourcePath), snapshot)) throw new Error("legacy node-host source changed after Doctor loaded it");
	} catch (error) {
		warnings.push(`Failed reading legacy node-host state: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	const claimPath = `${sourcePath}${require_config.LEGACY_NODE_HOST_CONFIG_CLAIM_SUFFIX}`;
	try {
		params.beforeClaim?.();
		await params.stateRoot.move(relativeLegacyPath$2(params.stateDir, sourcePath), relativeLegacyPath$2(params.stateDir, claimPath));
		if (!sourceSnapshotsMatch$2(await readLegacySourceSnapshot$3(params.stateRoot, params.stateDir, claimPath), snapshot)) throw new Error("legacy node-host source changed before Doctor could claim it");
	} catch (error) {
		const restoreError = await restoreClaim$1({
			stateRoot: params.stateRoot,
			stateDir: params.stateDir,
			snapshot
		});
		warnings.push(`Failed migrating legacy node-host state: ${String(error)}${restoreError ? `; restore failure: ${restoreError}` : ""}`);
		return {
			changes,
			warnings
		};
	}
	let result;
	try {
		result = migrateIntoDatabase$1({
			env: params.env,
			legacy
		});
	} catch (error) {
		const restoreError = await restoreClaim$1({
			stateRoot: params.stateRoot,
			stateDir: params.stateDir,
			snapshot
		});
		warnings.push(`Failed migrating legacy node-host state: ${String(error)}${restoreError ? `; restore failure: ${restoreError}` : ""}`);
		return {
			changes,
			warnings
		};
	}
	try {
		if (await params.stateRoot.exists(relativeLegacyPath$2(params.stateDir, sourcePath))) throw new Error(`legacy node-host source reappeared during import: ${sourcePath}`);
		if (params.removeSource) await params.removeSource(claimPath);
		else await params.stateRoot.remove(relativeLegacyPath$2(params.stateDir, claimPath));
		if (await params.stateRoot.exists(relativeLegacyPath$2(params.stateDir, sourcePath)) || await params.stateRoot.exists(relativeLegacyPath$2(params.stateDir, claimPath))) throw new Error("legacy node-host source or Doctor claim remains after cleanup");
	} catch (error) {
		warnings.push(`Node-host state is in SQLite, but legacy cleanup failed: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	changes.push(result.preservedCanonical ? "Kept newer canonical node-host SQLite state." : result.imported ? "Migrated node-host config to shared SQLite state." : "Verified node-host config in shared SQLite state.");
	notices.push("Removed retired node.json after verified SQLite import.");
	return {
		changes,
		warnings,
		notices
	};
}
/** Import retired node-host state while excluding active Gateway/state maintenance owners. */
async function migrateLegacyNodeHostConfig(params) {
	if (!params.detected.hasLegacy) return {
		changes: [],
		warnings: []
	};
	const env = {
		...params.env ?? process.env,
		OPERATOR_STATE_DIR: params.stateDir
	};
	let lock;
	try {
		lock = await require_gateway_lock.acquireGatewayLock({
			allowInTests: true,
			env,
			pollIntervalMs: MIGRATION_LOCK_POLL_INTERVAL_MS$2,
			role: "sqlite-maintenance",
			timeoutMs: MIGRATION_LOCK_TIMEOUT_MS$2
		});
	} catch (error) {
		return {
			changes: [],
			warnings: [`Failed migrating legacy node-host state: ${error instanceof require_gateway_lock.GatewayLockError ? "the Gateway or another SQLite maintenance command owns this state directory" : String(error)}. Stop the Gateway and node host, then run \`openclaw doctor --fix\` again.`]
		};
	}
	if (!lock) return {
		changes: [],
		warnings: ["Failed migrating legacy node-host state: exclusive state ownership unavailable."]
	};
	let result = {
		changes: [],
		warnings: []
	};
	let releaseError;
	try {
		try {
			const stateRoot = await (0, _openclaw_fs_safe.root)(params.stateDir, {
				hardlinks: "reject",
				maxBytes: LEGACY_NODE_HOST_MAX_BYTES,
				symlinks: "reject"
			});
			result = await migrateWithExclusiveStateOwnership$1({
				...params,
				env,
				stateRoot
			});
		} catch (error) {
			result.warnings.push(`Failed reading legacy node-host state: ${String(error)}`);
		}
	} finally {
		try {
			await lock.release();
		} catch (error) {
			releaseError = error;
		}
	}
	if (releaseError) result.warnings.push(`Node-host migration lock release failed: ${require_errors.formatErrorMessage(releaseError)}`);
	return result;
}
//#endregion
//#region src/infra/state-migrations.task-sidecar-rows.ts
function normalizeLegacySqliteInteger(value) {
	if (typeof value === "bigint") return Number(value);
	return value;
}
function listSqliteColumns(db, table) {
	const rows = db.prepare(`PRAGMA table_info(${table})`).all();
	return new Set(rows.flatMap((row) => row.name ? [row.name] : []));
}
function pickLegacyColumn(columns, name, fallbackSql = "NULL") {
	return columns.has(name) ? name : `${fallbackSql} AS ${name}`;
}
function legacyBindValue(value) {
	if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "bigint" || value instanceof Uint8Array) return value ?? null;
	return JSON.stringify(value);
}
function legacyStringValue(value) {
	return typeof value === "string" ? value : "";
}
function normalizeLegacyTaskRow(row) {
	const runtime = legacyStringValue(row.runtime);
	const sourceId = typeof row.source_id === "string" ? row.source_id : "";
	const taskId = legacyStringValue(row.task_id);
	const ownerRaw = typeof row.owner_key === "string" ? row.owner_key.trim() : "";
	const requesterRaw = typeof row.requester_session_key === "string" ? row.requester_session_key.trim() : "";
	const ownerKey = ownerRaw || requesterRaw || `system:${runtime}:${sourceId || taskId}`;
	const scopeKind = (typeof row.scope_kind === "string" ? row.scope_kind : "") === "system" || ownerKey.startsWith("system:") ? "system" : "session";
	const childSessionKey = typeof row.child_session_key === "string" ? row.child_session_key.trim() : "";
	const persistedAgentId = typeof row.agent_id === "string" ? row.agent_id.trim() : "";
	const isSpawnRuntime = runtime === "subagent" || runtime === "acp";
	const childAgentId = isSpawnRuntime ? require_session_key.parseAgentSessionKey(childSessionKey)?.agentId : void 0;
	const requesterAgentId = (typeof row.requester_agent_id === "string" ? row.requester_agent_id.trim() : "") || (isSpawnRuntime ? require_session_key.parseAgentSessionKey(ownerKey)?.agentId ?? require_session_key.parseAgentSessionKey(requesterRaw)?.agentId ?? (childAgentId && persistedAgentId !== childAgentId ? persistedAgentId : "") : "");
	const executorAgentId = requesterAgentId ? childAgentId || persistedAgentId : persistedAgentId;
	const deliveryStatus = row.delivery_status === "not-requested" ? "not_applicable" : row.delivery_status;
	return {
		task_id: taskId,
		runtime,
		task_kind: legacyBindValue(row.task_kind),
		source_id: legacyBindValue(row.source_id),
		requester_session_key: scopeKind === "system" ? "" : requesterRaw || ownerKey,
		owner_key: ownerKey,
		scope_kind: scopeKind,
		child_session_key: childSessionKey || null,
		parent_flow_id: legacyBindValue(row.parent_flow_id),
		parent_task_id: legacyBindValue(row.parent_task_id),
		agent_id: executorAgentId || null,
		requester_agent_id: requesterAgentId || null,
		run_id: legacyBindValue(row.run_id),
		label: legacyBindValue(row.label),
		task: legacyBindValue(row.task ?? ""),
		status: legacyBindValue(row.status ?? ""),
		delivery_status: legacyBindValue(deliveryStatus ?? ""),
		notify_policy: legacyBindValue(row.notify_policy ?? ""),
		created_at: normalizeLegacySqliteInteger(row.created_at) ?? 0,
		started_at: normalizeLegacySqliteInteger(row.started_at),
		ended_at: normalizeLegacySqliteInteger(row.ended_at),
		last_event_at: normalizeLegacySqliteInteger(row.last_event_at),
		cleanup_after: normalizeLegacySqliteInteger(row.cleanup_after),
		error: legacyBindValue(row.error),
		progress_summary: legacyBindValue(row.progress_summary),
		terminal_summary: legacyBindValue(row.terminal_summary),
		terminal_outcome: legacyBindValue(row.terminal_outcome),
		detail_json: legacyBindValue(row.detail_json)
	};
}
function readLegacyTaskRows(sourcePath) {
	const db = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(sourcePath, { readOnly: true });
	try {
		const columns = listSqliteColumns(db, "task_runs");
		if (columns.size === 0) return [];
		const selectColumns = [
			"task_id",
			"runtime",
			pickLegacyColumn(columns, "task_kind"),
			pickLegacyColumn(columns, "source_id"),
			pickLegacyColumn(columns, "requester_session_key"),
			pickLegacyColumn(columns, "owner_key"),
			pickLegacyColumn(columns, "scope_kind"),
			pickLegacyColumn(columns, "child_session_key"),
			pickLegacyColumn(columns, "parent_flow_id"),
			pickLegacyColumn(columns, "parent_task_id"),
			pickLegacyColumn(columns, "agent_id"),
			pickLegacyColumn(columns, "requester_agent_id"),
			pickLegacyColumn(columns, "run_id"),
			pickLegacyColumn(columns, "label"),
			"task",
			"status",
			"delivery_status",
			"notify_policy",
			"created_at",
			pickLegacyColumn(columns, "started_at"),
			pickLegacyColumn(columns, "ended_at"),
			pickLegacyColumn(columns, "last_event_at"),
			pickLegacyColumn(columns, "cleanup_after"),
			pickLegacyColumn(columns, "error"),
			pickLegacyColumn(columns, "progress_summary"),
			pickLegacyColumn(columns, "terminal_summary"),
			pickLegacyColumn(columns, "terminal_outcome"),
			pickLegacyColumn(columns, "detail_json")
		];
		return db.prepare(`SELECT ${selectColumns.join(", ")} FROM task_runs ORDER BY created_at ASC, task_id ASC`).all().map((row) => normalizeLegacyTaskRow(row));
	} finally {
		db.close();
	}
}
function readLegacyTaskDeliveryRows(sourcePath) {
	const db = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(sourcePath, { readOnly: true });
	try {
		if (listSqliteColumns(db, "task_delivery_state").size === 0) return [];
		return db.prepare(`SELECT task_id, requester_origin_json, last_notified_event_at FROM task_delivery_state ORDER BY task_id ASC`).all();
	} finally {
		db.close();
	}
}
function insertTaskRunRowSql(db, row) {
	db.prepare(`
      INSERT INTO task_runs (
        task_id, runtime, task_kind, source_id, requester_session_key, owner_key, scope_kind,
        child_session_key, parent_flow_id, parent_task_id, agent_id, requester_agent_id, run_id,
        label, task, status, delivery_status, notify_policy, created_at, started_at, ended_at,
        last_event_at, cleanup_after, error, progress_summary, terminal_summary, terminal_outcome,
        detail_json
      ) VALUES (
        @task_id, @runtime, @task_kind, @source_id, @requester_session_key, @owner_key,
        @scope_kind, @child_session_key, @parent_flow_id, @parent_task_id, @agent_id,
        @requester_agent_id, @run_id, @label, @task, @status, @delivery_status, @notify_policy,
        @created_at, @started_at, @ended_at, @last_event_at, @cleanup_after, @error,
        @progress_summary, @terminal_summary, @terminal_outcome, @detail_json
      )
    `).run(row);
}
function insertTaskDeliveryRowSql(db, row) {
	db.prepare(`
      INSERT INTO task_delivery_state (
        task_id, requester_origin_json, last_notified_event_at
      ) VALUES (
        @task_id, @requester_origin_json, @last_notified_event_at
      )
    `).run(row);
}
//#endregion
//#region src/infra/state-migrations.storage.ts
const PLUGIN_STATE_SQLITE_SIDECAR_SUFFIXES = [
	"",
	"-shm",
	"-wal",
	"-journal"
];
const TASK_STATE_SQLITE_SIDECAR_SUFFIXES = [
	"",
	"-shm",
	"-wal",
	"-journal"
];
const LEGACY_DELIVERY_QUEUE_DIRS = [{
	label: "outbound delivery queue",
	queueName: "outbound",
	dirName: "delivery-queue"
}, {
	label: "session delivery queue",
	queueName: "session",
	dirName: "session-delivery-queue"
}];
var LegacyTaskStateSidecarConflictError = class extends Error {
	constructor(conflictedKeys) {
		super("legacy task-state sidecar conflicts with shared state");
		this.conflictedKeys = conflictedKeys;
	}
};
function buildLegacyMigrationPreview(plan) {
	if (plan.kind === "plugin-state-import") return plan.preview ?? `- ${plan.label}: ${plan.sourcePath}`;
	return `- ${plan.label}: ${plan.sourcePath} → ${plan.targetPath}`;
}
function resolveLegacyPluginStateSidecarPath(stateDir) {
	return node_path.default.join(stateDir, "plugin-state", "state.sqlite");
}
function resolveLegacyTaskRunsSidecarPath(stateDir) {
	return node_path.default.join(stateDir, "tasks", "runs.sqlite");
}
function resolveLegacyFlowRunsSidecarPath(stateDir) {
	return node_path.default.join(stateDir, "flows", "registry.sqlite");
}
function readLegacyPluginStateSidecarRows(sourcePath) {
	const db = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(sourcePath, { readOnly: true });
	try {
		return db.prepare(`
          SELECT plugin_id, namespace, entry_key, value_json, created_at, expires_at
          FROM plugin_state_entries
          ORDER BY plugin_id ASC, namespace ASC, entry_key ASC
        `).all();
	} finally {
		db.close();
	}
}
function legacyPluginStateRowsMatch(existing, legacy) {
	return existing.value_json === legacy.value_json && normalizeLegacySqliteInteger(existing.created_at) === normalizeLegacySqliteInteger(legacy.created_at) && normalizeLegacySqliteInteger(existing.expires_at) === normalizeLegacySqliteInteger(legacy.expires_at);
}
function isLegacyPluginStateRowExpired(row, now) {
	const expiresAt = normalizeLegacySqliteInteger(row.expires_at);
	return expiresAt !== null && expiresAt <= now;
}
function hasPendingSqliteSidecarArchive(sourcePath, suffixes) {
	return !fileExists(sourcePath) && fileExists(`${sourcePath}.migrated`) && suffixes.some((suffix) => suffix !== "" && fileExists(`${sourcePath}${suffix}`));
}
function firstFreeArchivePath(sourcePath) {
	for (let index = 2;; index++) {
		const candidate = `${sourcePath}.migrated.${index}`;
		if (!node_fs.default.existsSync(candidate)) return candidate;
	}
}
function archiveLegacyFileSource(params) {
	const archivedPath = `${params.sourcePath}.migrated`;
	try {
		if (fileExists(archivedPath)) {
			if (node_fs.default.readFileSync(params.sourcePath).equals(node_fs.default.readFileSync(archivedPath))) {
				node_fs.default.rmSync(params.sourcePath, { force: true });
				return {
					sourcePath: params.sourcePath,
					targetPath: archivedPath,
					action: "removed"
				};
			}
			const nextArchivePath = firstFreeArchivePath(params.sourcePath);
			node_fs.default.renameSync(params.sourcePath, nextArchivePath);
			return {
				sourcePath: params.sourcePath,
				targetPath: nextArchivePath,
				action: "archived"
			};
		}
		node_fs.default.renameSync(params.sourcePath, archivedPath);
		return {
			sourcePath: params.sourcePath,
			targetPath: archivedPath,
			action: "archived"
		};
	} catch (err) {
		params.warnings.push(`Failed archiving ${params.label} ${params.sourcePath}: ${String(err)}`);
		return null;
	}
}
function recordArchiveCollisionResolutions(changes, label, resolutions) {
	for (const resolution of resolutions) changes.push(resolution.action === "removed" ? `Removed already-archived ${label} legacy source ${resolution.sourcePath}` : `Archived ${label} legacy source → ${resolution.targetPath}`);
}
function archiveLegacyPluginStateSidecar(params) {
	const existingSources = PLUGIN_STATE_SQLITE_SIDECAR_SUFFIXES.map((suffix) => `${params.sourcePath}${suffix}`).filter(fileExists);
	if (existingSources.length === 0) return;
	const resolutions = [];
	for (const sourcePath of existingSources) {
		const resolution = archiveLegacyFileSource({
			sourcePath,
			label: "plugin-state sidecar",
			warnings: params.warnings
		});
		if (!resolution) return;
		resolutions.push(resolution);
	}
	if (resolutions.every((resolution) => resolution.action === "archived" && resolution.targetPath === `${resolution.sourcePath}.migrated`)) params.changes.push(`Archived plugin-state sidecar legacy source → ${params.sourcePath}.migrated`);
	else recordArchiveCollisionResolutions(params.changes, "plugin-state sidecar", resolutions);
}
function readLegacyInstalledPluginIndex(sourcePath) {
	try {
		const parsed = JSON.parse(node_fs.default.readFileSync(sourcePath, "utf8"));
		const current = require_installed_plugin_index_store.parseInstalledPluginIndex(parsed);
		if (current) return current;
		const installRecords = readLegacyTopLevelInstallRecords(parsed) ?? readLegacyEmbeddedInstallRecords(parsed);
		if (!installRecords || typeof installRecords !== "object" || Array.isArray(installRecords)) return null;
		return require_installed_plugin_index_store.parseInstalledPluginIndex({
			version: 1,
			hostContractVersion: "legacy",
			compatRegistryVersion: "legacy",
			migrationVersion: 1,
			policyHash: "legacy",
			generatedAtMs: 0,
			installRecords,
			plugins: [],
			diagnostics: []
		});
	} catch {
		return null;
	}
}
function readLegacyTopLevelInstallRecords(parsed) {
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
	const legacy = parsed;
	return legacy.installRecords ?? legacy.records;
}
function readLegacyEmbeddedInstallRecords(parsed) {
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
	const plugins = parsed.plugins;
	if (!Array.isArray(plugins)) return null;
	const records = {};
	for (const plugin of plugins) {
		if (!plugin || typeof plugin !== "object" || Array.isArray(plugin)) continue;
		const pluginId = plugin.pluginId;
		const installRecord = plugin.installRecord;
		if (typeof pluginId === "string" && pluginId.trim() && installRecord && typeof installRecord === "object" && !Array.isArray(installRecord)) records[pluginId] = installRecord;
	}
	return Object.keys(records).length > 0 ? records : null;
}
function legacyInstalledPluginIndexMatches(current, legacy) {
	return JSON.stringify(current.installRecords) === JSON.stringify(legacy.installRecords) && JSON.stringify(current.plugins) === JSON.stringify(legacy.plugins) && JSON.stringify(current.diagnostics) === JSON.stringify(legacy.diagnostics);
}
function readInstallRecordField(record, key) {
	return record[key];
}
function readInstallRecordStringField(record, key) {
	const value = readInstallRecordField(record, key);
	return typeof value === "string" ? value : void 0;
}
function legacyInstallRecordHasCurrentResolvedIdentity(params) {
	const { currentRecord, legacyRecord } = params;
	const currentResolvedSpec = readInstallRecordStringField(currentRecord, "resolvedSpec");
	const legacySpec = readInstallRecordStringField(legacyRecord, "spec");
	if (legacySpec) return currentResolvedSpec === legacySpec;
	const legacyResolvedSpec = readInstallRecordStringField(legacyRecord, "resolvedSpec");
	return Boolean(legacyResolvedSpec && currentResolvedSpec === legacyResolvedSpec);
}
function readAuthoritativeCurrentNpmIdentity(record) {
	const resolvedName = readInstallRecordStringField(record, "resolvedName");
	const resolvedVersion = readInstallRecordStringField(record, "resolvedVersion");
	if (resolvedName && resolvedVersion) return {
		name: resolvedName,
		version: resolvedVersion
	};
	const resolvedSpec = readInstallRecordStringField(record, "resolvedSpec");
	const parsed = resolvedSpec ? require_npm_registry_spec.parseRegistryNpmSpec(resolvedSpec) : null;
	if (parsed?.selectorKind === "exact-version" && parsed.selector) return {
		name: parsed.name,
		version: parsed.selector
	};
	return null;
}
function legacyNpmInstallRecordSupersededByCurrent(params) {
	const { currentRecord, legacyRecord } = params;
	if (currentRecord.source !== "npm" || legacyRecord.source !== "npm") return false;
	const legacySpec = readInstallRecordStringField(legacyRecord, "spec");
	const legacyParsedSpec = legacySpec ? require_npm_registry_spec.parseRegistryNpmSpec(legacySpec) : null;
	if (legacyParsedSpec?.selectorKind !== "exact-version") return false;
	const currentIdentity = readAuthoritativeCurrentNpmIdentity(currentRecord);
	return Boolean(currentIdentity && legacyParsedSpec.selector && currentIdentity.name === legacyParsedSpec.name && currentIdentity.version === legacyParsedSpec.selector);
}
function legacyInstallRecordCoveredByCurrent(currentRecord, legacyRecord) {
	if (currentRecord.source !== legacyRecord.source) return false;
	if (legacyNpmInstallRecordSupersededByCurrent({
		currentRecord,
		legacyRecord
	})) return true;
	for (const key of Object.keys(legacyRecord).toSorted()) {
		const currentValue = readInstallRecordField(currentRecord, key);
		if (currentValue === readInstallRecordField(legacyRecord, key)) continue;
		if (key === "spec" && legacyInstallRecordHasCurrentResolvedIdentity({
			currentRecord,
			legacyRecord
		})) continue;
		if ((key === "resolvedAt" || key === "installedAt") && typeof currentValue === "string") continue;
		return false;
	}
	return true;
}
function mergeLegacyInstalledPluginIndexRecords(current, legacy) {
	const installRecords = { ...current.installRecords };
	const conflicts = [];
	let addedCount = 0;
	for (const [pluginId, legacyRecord] of Object.entries(legacy.installRecords)) {
		const currentRecord = installRecords[pluginId];
		if (!currentRecord) {
			installRecords[pluginId] = legacyRecord;
			addedCount += 1;
			continue;
		}
		if (!legacyInstallRecordCoveredByCurrent(currentRecord, legacyRecord)) conflicts.push(pluginId);
	}
	return {
		merged: {
			...current,
			installRecords
		},
		addedCount,
		conflicts
	};
}
function archiveLegacyInstalledPluginIndex(params) {
	const resolution = archiveLegacyFileSource({
		sourcePath: params.sourcePath,
		label: "plugin install index",
		warnings: params.warnings
	});
	if (!resolution) return;
	params.changes.push(resolution.action === "removed" ? `Removed already-archived plugin install index legacy source ${params.sourcePath}` : `Archived plugin install index legacy source → ${resolution.targetPath}`);
}
function archiveLegacyTaskStateSidecar(params) {
	const existingSources = TASK_STATE_SQLITE_SIDECAR_SUFFIXES.map((suffix) => `${params.sourcePath}${suffix}`).filter(fileExists);
	if (existingSources.length === 0) return;
	const resolutions = [];
	for (const sourcePath of existingSources) {
		const resolution = archiveLegacyFileSource({
			sourcePath,
			label: `${params.label} sidecar`,
			warnings: params.warnings
		});
		if (!resolution) return;
		resolutions.push(resolution);
	}
	if (resolutions.every((resolution) => resolution.action === "archived" && resolution.targetPath === `${resolution.sourcePath}.migrated`)) params.changes.push(`Archived ${params.label} sidecar legacy source → ${params.sourcePath}.migrated`);
	else recordArchiveCollisionResolutions(params.changes, `${params.label} sidecar`, resolutions);
}
function hardenLegacyImportSource(params) {
	try {
		node_fs.default.chmodSync(params.sourcePath, 384);
		return true;
	} catch (err) {
		params.warnings.push(`Failed securing ${params.label} legacy source: ${String(err)}`);
		return false;
	}
}
function archiveLegacyImportSource(params) {
	if (!hardenLegacyImportSource(params)) return;
	const resolution = archiveLegacyFileSource({
		sourcePath: params.sourcePath,
		label: `${params.label} legacy source`,
		warnings: params.warnings
	});
	if (!resolution) return;
	if (resolution.action === "archived") try {
		node_fs.default.chmodSync(resolution.targetPath, 384);
	} catch (err) {
		params.warnings.push(`Failed securing archived ${params.label} legacy source: ${String(err)}`);
	}
	params.changes.push(resolution.action === "removed" ? `Removed already-archived ${params.label} legacy source ${params.sourcePath}` : `Archived ${params.label} legacy source → ${resolution.targetPath}`);
}
function legacyKeyValue(value) {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "bigint") return `${value}`;
	return "";
}
function normalizeLegacyFlowRow(row) {
	const syncMode = row.sync_mode === "task_mirrored" || row.shape === "single_task" ? "task_mirrored" : "managed";
	const ownerKey = typeof row.owner_key === "string" && row.owner_key.trim() ? row.owner_key.trim() : typeof row.owner_session_key === "string" ? row.owner_session_key.trim() : "";
	const controllerId = syncMode === "managed" ? typeof row.controller_id === "string" && row.controller_id.trim() ? row.controller_id.trim() : "core/legacy-restored" : null;
	return {
		flow_id: legacyBindValue(row.flow_id ?? ""),
		shape: legacyBindValue(row.shape),
		sync_mode: syncMode,
		owner_key: ownerKey,
		requester_origin_json: legacyBindValue(row.requester_origin_json),
		controller_id: controllerId,
		revision: normalizeLegacySqliteInteger(row.revision) ?? 0,
		status: legacyBindValue(row.status ?? ""),
		notify_policy: legacyBindValue(row.notify_policy ?? ""),
		goal: legacyBindValue(row.goal ?? ""),
		current_step: legacyBindValue(row.current_step),
		blocked_task_id: legacyBindValue(row.blocked_task_id),
		blocked_summary: legacyBindValue(row.blocked_summary),
		state_json: legacyBindValue(row.state_json),
		wait_json: legacyBindValue(row.wait_json),
		cancel_requested_at: normalizeLegacySqliteInteger(row.cancel_requested_at),
		created_at: normalizeLegacySqliteInteger(row.created_at) ?? 0,
		updated_at: normalizeLegacySqliteInteger(row.updated_at) ?? 0,
		ended_at: normalizeLegacySqliteInteger(row.ended_at)
	};
}
function legacyRowsMatch(existing, incoming, columns) {
	return columns.every((column) => normalizeLegacySqliteInteger(existing[column]) === normalizeLegacySqliteInteger(incoming[column]));
}
function readLegacyFlowRows(sourcePath) {
	const db = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(sourcePath, { readOnly: true });
	try {
		const columns = listSqliteColumns(db, "flow_runs");
		if (columns.size === 0) return [];
		const selectColumns = [
			"flow_id",
			pickLegacyColumn(columns, "shape"),
			pickLegacyColumn(columns, "sync_mode"),
			pickLegacyColumn(columns, "owner_key"),
			pickLegacyColumn(columns, "owner_session_key"),
			pickLegacyColumn(columns, "requester_origin_json"),
			pickLegacyColumn(columns, "controller_id"),
			pickLegacyColumn(columns, "revision", "0"),
			"status",
			"notify_policy",
			"goal",
			pickLegacyColumn(columns, "current_step"),
			pickLegacyColumn(columns, "blocked_task_id"),
			pickLegacyColumn(columns, "blocked_summary"),
			pickLegacyColumn(columns, "state_json"),
			pickLegacyColumn(columns, "wait_json"),
			pickLegacyColumn(columns, "cancel_requested_at"),
			"created_at",
			"updated_at",
			pickLegacyColumn(columns, "ended_at")
		];
		return db.prepare(`SELECT ${selectColumns.join(", ")} FROM flow_runs ORDER BY created_at ASC, flow_id ASC`).all().map((row) => normalizeLegacyFlowRow(row));
	} finally {
		db.close();
	}
}
function insertFlowRunRowSql(db, row) {
	db.prepare(`
      INSERT INTO flow_runs (
        flow_id, shape, sync_mode, owner_key, requester_origin_json, controller_id, revision,
        status, notify_policy, goal, current_step, blocked_task_id, blocked_summary, state_json,
        wait_json, cancel_requested_at, created_at, updated_at, ended_at
      ) VALUES (
        @flow_id, @shape, @sync_mode, @owner_key, @requester_origin_json, @controller_id,
        @revision, @status, @notify_policy, @goal, @current_step, @blocked_task_id,
        @blocked_summary, @state_json, @wait_json, @cancel_requested_at, @created_at,
        @updated_at, @ended_at
      )
    `).run(row);
}
async function migrateLegacyTaskRunsSidecar(params) {
	const sourcePath = resolveLegacyTaskRunsSidecarPath(params.stateDir);
	if (!fileExists(sourcePath)) {
		const changes = [];
		const warnings = [];
		if (hasPendingSqliteSidecarArchive(sourcePath, TASK_STATE_SQLITE_SIDECAR_SUFFIXES)) archiveLegacyTaskStateSidecar({
			sourcePath,
			label: "task registry",
			changes,
			warnings
		});
		return {
			changes,
			warnings
		};
	}
	const changes = [];
	const warnings = [];
	let taskRows;
	let deliveryRows;
	try {
		taskRows = readLegacyTaskRows(sourcePath);
		deliveryRows = readLegacyTaskDeliveryRows(sourcePath);
	} catch (err) {
		return {
			changes,
			warnings: [`Failed reading task registry sidecar ${sourcePath}: ${String(err)}`]
		};
	}
	try {
		const conflicts = [];
		let importedTasks = 0;
		let importedDeliveryStates = 0;
		let skippedOrphanDeliveryStates = 0;
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const taskColumns = [
				"runtime",
				"task_kind",
				"source_id",
				"requester_session_key",
				"owner_key",
				"scope_kind",
				"child_session_key",
				"parent_flow_id",
				"parent_task_id",
				"agent_id",
				"requester_agent_id",
				"run_id",
				"label",
				"task",
				"status",
				"delivery_status",
				"notify_policy",
				"created_at",
				"started_at",
				"ended_at",
				"last_event_at",
				"cleanup_after",
				"error",
				"progress_summary",
				"terminal_summary",
				"terminal_outcome",
				"detail_json"
			];
			for (const row of taskRows) {
				const taskId = legacyKeyValue((0, _gabrielvfonseca_normalization_core.expectDefined)(row.task_id, "task migration row key"));
				const existing = db.prepare(`SELECT ${taskColumns.join(", ")} FROM task_runs WHERE task_id = ?`).get(taskId);
				if (existing) {
					if (!legacyRowsMatch(existing, row, taskColumns)) conflicts.push(taskId);
					continue;
				}
				insertTaskRunRowSql(db, row);
				importedTasks++;
			}
			const deliveryColumns = ["requester_origin_json", "last_notified_event_at"];
			for (const row of deliveryRows) {
				const taskId = legacyKeyValue((0, _gabrielvfonseca_normalization_core.expectDefined)(row.task_id, "delivery migration row key"));
				const existing = db.prepare(`SELECT requester_origin_json, last_notified_event_at FROM task_delivery_state WHERE task_id = ?`).get(taskId);
				if (existing) {
					if (!legacyRowsMatch(existing, row, deliveryColumns)) conflicts.push(`${taskId}/delivery`);
					continue;
				}
				if (!db.prepare("SELECT 1 FROM task_runs WHERE task_id = ?").get(taskId)) {
					skippedOrphanDeliveryStates++;
					continue;
				}
				insertTaskDeliveryRowSql(db, row);
				importedDeliveryStates++;
			}
			if (conflicts.length > 0) throw new LegacyTaskStateSidecarConflictError(conflicts);
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
		if (importedTasks > 0) changes.push(`Migrated ${importedTasks} task registry sidecar ${importedTasks === 1 ? "row" : "rows"} → shared SQLite state`);
		if (importedDeliveryStates > 0) changes.push(`Migrated ${importedDeliveryStates} task delivery sidecar ${importedDeliveryStates === 1 ? "row" : "rows"} → shared SQLite state`);
		if (skippedOrphanDeliveryStates > 0) warnings.push(`Skipped ${skippedOrphanDeliveryStates} orphan task delivery sidecar ${skippedOrphanDeliveryStates === 1 ? "row" : "rows"} with no task run`);
	} catch (err) {
		if (err instanceof LegacyTaskStateSidecarConflictError) return {
			changes,
			warnings: [`Left task registry sidecar in place because ${err.conflictedKeys.length} ${err.conflictedKeys.length === 1 ? "row" : "rows"} already existed in shared state: ${err.conflictedKeys[0]}`]
		};
		return {
			changes,
			warnings: [`Failed migrating task registry sidecar ${sourcePath}: ${String(err)}`]
		};
	}
	archiveLegacyTaskStateSidecar({
		sourcePath,
		label: "task registry",
		changes,
		warnings
	});
	return {
		changes,
		warnings
	};
}
async function migrateLegacyFlowRunsSidecar(params) {
	const sourcePath = resolveLegacyFlowRunsSidecarPath(params.stateDir);
	if (!fileExists(sourcePath)) {
		const changes = [];
		const warnings = [];
		if (hasPendingSqliteSidecarArchive(sourcePath, TASK_STATE_SQLITE_SIDECAR_SUFFIXES)) archiveLegacyTaskStateSidecar({
			sourcePath,
			label: "task flow",
			changes,
			warnings
		});
		return {
			changes,
			warnings
		};
	}
	const changes = [];
	const warnings = [];
	let rows;
	try {
		rows = readLegacyFlowRows(sourcePath);
	} catch (err) {
		return {
			changes,
			warnings: [`Failed reading task flow sidecar ${sourcePath}: ${String(err)}`]
		};
	}
	try {
		const conflicts = [];
		let imported = 0;
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const columns = [
				"shape",
				"sync_mode",
				"owner_key",
				"requester_origin_json",
				"controller_id",
				"revision",
				"status",
				"notify_policy",
				"goal",
				"current_step",
				"blocked_task_id",
				"blocked_summary",
				"state_json",
				"wait_json",
				"cancel_requested_at",
				"created_at",
				"updated_at",
				"ended_at"
			];
			for (const row of rows) {
				const flowId = legacyKeyValue((0, _gabrielvfonseca_normalization_core.expectDefined)(row.flow_id, "flow migration row key"));
				const existing = db.prepare(`SELECT ${columns.join(", ")} FROM flow_runs WHERE flow_id = ?`).get(flowId);
				if (existing) {
					if (!legacyRowsMatch(existing, row, columns)) conflicts.push(flowId);
					continue;
				}
				insertFlowRunRowSql(db, row);
				imported++;
			}
			if (conflicts.length > 0) throw new LegacyTaskStateSidecarConflictError(conflicts);
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
		if (imported > 0) changes.push(`Migrated ${imported} task flow sidecar ${imported === 1 ? "row" : "rows"} → shared SQLite state`);
	} catch (err) {
		if (err instanceof LegacyTaskStateSidecarConflictError) return {
			changes,
			warnings: [`Left task flow sidecar in place because ${err.conflictedKeys.length} ${err.conflictedKeys.length === 1 ? "row" : "rows"} already existed in shared state: ${err.conflictedKeys[0]}`]
		};
		return {
			changes,
			warnings: [`Failed migrating task flow sidecar ${sourcePath}: ${String(err)}`]
		};
	}
	archiveLegacyTaskStateSidecar({
		sourcePath,
		label: "task flow",
		changes,
		warnings
	});
	return {
		changes,
		warnings
	};
}
async function migrateLegacyTaskStateSidecars(params) {
	const taskRuns = await migrateLegacyTaskRunsSidecar(params);
	const flowRuns = await migrateLegacyFlowRunsSidecar(params);
	return {
		changes: [...taskRuns.changes, ...flowRuns.changes],
		warnings: [...taskRuns.warnings, ...flowRuns.warnings]
	};
}
function resolveLegacyDeliveryQueuePath(stateDir, dirName) {
	return node_path.default.join(stateDir, dirName);
}
function listLegacyDeliveryQueueFiles(queueDir) {
	const pending = safeReadDir(queueDir).filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => ({
		sourcePath: node_path.default.join(queueDir, entry.name),
		status: "pending"
	}));
	const failedDir = node_path.default.join(queueDir, "failed");
	const failed = safeReadDir(failedDir).filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => ({
		sourcePath: node_path.default.join(failedDir, entry.name),
		status: "failed"
	}));
	return [...pending, ...failed];
}
function listLegacyDeliveryQueueDeliveredMarkers(queueDir) {
	return safeReadDir(queueDir).filter((entry) => entry.isFile() && entry.name.endsWith(".delivered")).map((entry) => node_path.default.join(queueDir, entry.name));
}
function readLegacyDeliveryQueueEntry(sourcePath) {
	try {
		const parsed = JSON.parse(node_fs.default.readFileSync(sourcePath, "utf8"));
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
function legacyQueueMetadata(entry) {
	const session = entry.session;
	const route = entry.route;
	const deliveryContext = entry.deliveryContext;
	const stringOrNull = (value) => typeof value === "string" ? value : null;
	return {
		entryKind: stringOrNull(entry.kind) ?? "outbound",
		sessionKey: stringOrNull(entry.sessionKey) ?? stringOrNull(session?.key),
		channel: stringOrNull(entry.channel) ?? stringOrNull(route?.channel) ?? stringOrNull(deliveryContext?.channel),
		target: stringOrNull(entry.to) ?? stringOrNull(route?.to) ?? stringOrNull(deliveryContext?.to),
		accountId: stringOrNull(entry.accountId) ?? stringOrNull(route?.accountId) ?? stringOrNull(deliveryContext?.accountId)
	};
}
function buildLegacyDeliveryQueueRow(params) {
	const enqueuedAt = typeof params.entry.enqueuedAt === "number" ? params.entry.enqueuedAt : params.now;
	const retryCount = typeof params.entry.retryCount === "number" ? params.entry.retryCount : 0;
	const failedAt = params.status === "failed" ? typeof params.entry.failedAt === "number" ? params.entry.failedAt : typeof params.entry.lastAttemptAt === "number" ? params.entry.lastAttemptAt : enqueuedAt : null;
	const meta = legacyQueueMetadata(params.entry);
	return {
		queue_name: params.queueName,
		id: params.id,
		status: params.status,
		entry_kind: meta.entryKind,
		session_key: meta.sessionKey,
		channel: meta.channel,
		target: meta.target,
		account_id: meta.accountId,
		retry_count: retryCount,
		last_attempt_at: typeof params.entry.lastAttemptAt === "number" ? params.entry.lastAttemptAt : null,
		last_error: typeof params.entry.lastError === "string" ? params.entry.lastError : null,
		recovery_state: typeof params.entry.recoveryState === "string" ? params.entry.recoveryState : null,
		platform_send_started_at: typeof params.entry.platformSendStartedAt === "number" ? params.entry.platformSendStartedAt : null,
		entry_json: JSON.stringify({
			...params.entry,
			id: params.id,
			enqueuedAt,
			retryCount
		}),
		enqueued_at: enqueuedAt,
		updated_at: params.now,
		failed_at: failedAt
	};
}
function legacyDeliveryQueueRowsMatch(existing, incoming) {
	return [
		"status",
		"entry_kind",
		"session_key",
		"channel",
		"target",
		"account_id",
		"retry_count",
		"last_attempt_at",
		"last_error",
		"recovery_state",
		"platform_send_started_at",
		"entry_json",
		"enqueued_at",
		"failed_at"
	].every((column) => {
		const left = existing[column];
		const right = incoming[column];
		if (typeof left === "bigint" || typeof right === "bigint") return normalizeLegacySqliteInteger(left) === normalizeLegacySqliteInteger(right);
		return left === right;
	});
}
function removeLegacyDeliveryQueueDir(params) {
	try {
		node_fs.default.rmSync(params.queueDir, { recursive: true });
		params.changes.push(`Removed ${params.label} legacy source ${params.queueDir}`);
	} catch (err) {
		params.warnings.push(`Failed removing ${params.label} ${params.queueDir}: ${String(err)}`);
	}
}
function removeLegacyDeliveryQueueMarkers(markerPaths, label, warnings) {
	let removed = 0;
	for (const markerPath of markerPaths) try {
		node_fs.default.rmSync(markerPath, { force: true });
		removed++;
	} catch (err) {
		warnings.push(`Failed removing ${label} marker ${markerPath}: ${String(err)}`);
		return null;
	}
	return removed;
}
async function migrateLegacyDeliveryQueues(params) {
	const changes = [];
	const warnings = [];
	for (const queue of LEGACY_DELIVERY_QUEUE_DIRS) {
		const queueDir = resolveLegacyDeliveryQueuePath(params.stateDir, queue.dirName);
		const files = listLegacyDeliveryQueueFiles(queueDir);
		const markerPaths = listLegacyDeliveryQueueDeliveredMarkers(queueDir);
		if (files.length === 0 && markerPaths.length === 0) continue;
		let imported = 0;
		let skipped = 0;
		const conflicts = [];
		try {
			require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
				const insert = db.prepare(`
            INSERT INTO delivery_queue_entries (
              queue_name, id, status, entry_kind, session_key, channel, target, account_id,
              retry_count, last_attempt_at, last_error, recovery_state,
              platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at
            ) VALUES (
              @queue_name, @id, @status, @entry_kind, @session_key, @channel, @target,
              @account_id, @retry_count, @last_attempt_at, @last_error, @recovery_state,
              @platform_send_started_at, @entry_json, @enqueued_at, @updated_at, @failed_at
            )
          `);
				const now = Date.now();
				for (const file of files) {
					const entry = readLegacyDeliveryQueueEntry(file.sourcePath);
					const id = typeof entry?.id === "string" ? entry.id : node_path.default.basename(file.sourcePath, ".json");
					if (!entry || !id) {
						skipped++;
						continue;
					}
					const row = buildLegacyDeliveryQueueRow({
						queueName: queue.queueName,
						id,
						status: file.status,
						entry,
						now
					});
					const existing = db.prepare(`
                SELECT status, entry_kind, session_key, channel, target, account_id,
                       retry_count, last_attempt_at, last_error, recovery_state,
                       platform_send_started_at, entry_json, enqueued_at, failed_at
                  FROM delivery_queue_entries
                 WHERE queue_name = ? AND id = ?
              `).get(queue.queueName, id);
					if (existing) {
						if (!legacyDeliveryQueueRowsMatch(existing, row)) conflicts.push(id);
						continue;
					}
					insert.run(row);
					imported++;
				}
			}, { env: {
				...process.env,
				OPERATOR_STATE_DIR: params.stateDir
			} });
		} catch (err) {
			warnings.push(`Failed migrating ${queue.label} ${queueDir}: ${String(err)}`);
			continue;
		}
		const removedMarkers = removeLegacyDeliveryQueueMarkers(markerPaths, queue.label, warnings);
		if (removedMarkers === null) continue;
		if (removedMarkers > 0) changes.push(`Removed ${removedMarkers} ${queue.label} delivered ${removedMarkers === 1 ? "marker" : "markers"}`);
		if (imported > 0) changes.push(`Migrated ${imported} ${queue.label} ${imported === 1 ? "entry" : "entries"} → shared SQLite state`);
		if (skipped > 0) {
			warnings.push(`Skipped ${skipped} malformed ${queue.label} ${skipped === 1 ? "entry" : "entries"}`);
			warnings.push(`Left ${queue.label} in place because malformed entries need manual cleanup`);
			continue;
		}
		if (conflicts.length > 0) {
			warnings.push(`Left ${queue.label} in place because ${conflicts.length} ${conflicts.length === 1 ? "entry" : "entries"} already existed in shared state: ${conflicts[0]}`);
			continue;
		}
		removeLegacyDeliveryQueueDir({
			queueDir,
			label: queue.label,
			changes,
			warnings
		});
	}
	return {
		changes,
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.plugin-state.ts
async function migrateLegacyPluginStateSidecar(params) {
	const sourcePath = resolveLegacyPluginStateSidecarPath(params.stateDir);
	if (!fileExists(sourcePath)) {
		const changes = [];
		const warnings = [];
		if (hasPendingSqliteSidecarArchive(sourcePath, PLUGIN_STATE_SQLITE_SIDECAR_SUFFIXES)) archiveLegacyPluginStateSidecar({
			sourcePath,
			changes,
			warnings
		});
		return {
			changes,
			warnings
		};
	}
	const changes = [];
	const warnings = [];
	let rows;
	try {
		rows = readLegacyPluginStateSidecarRows(sourcePath);
	} catch (err) {
		return {
			changes,
			warnings: [`Failed reading plugin-state sidecar ${sourcePath}: ${String(err)}`]
		};
	}
	try {
		const conflictedKeys = [];
		const rowsToInsert = [];
		let imported = 0;
		let skippedExpired = 0;
		const now = Date.now();
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
			for (const row of rows) {
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.deleteFrom("plugin_state_entries").where("plugin_id", "=", row.plugin_id).where("namespace", "=", row.namespace).where("entry_key", "=", row.entry_key).where("expires_at", "is not", null).where("expires_at", "<=", now));
				const existing = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("plugin_state_entries").select([
					"value_json",
					"created_at",
					"expires_at"
				]).where("plugin_id", "=", row.plugin_id).where("namespace", "=", row.namespace).where("entry_key", "=", row.entry_key));
				const legacyExpired = isLegacyPluginStateRowExpired(row, now);
				if (existing) {
					if (!legacyPluginStateRowsMatch(existing, row)) if (legacyExpired) skippedExpired += 1;
					else conflictedKeys.push(`${row.plugin_id}/${row.namespace}/${row.entry_key}`);
					continue;
				}
				if (legacyExpired) {
					skippedExpired += 1;
					continue;
				}
				rowsToInsert.push(row);
			}
			for (const row of rowsToInsert) {
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("plugin_state_entries").values({
					plugin_id: row.plugin_id,
					namespace: row.namespace,
					entry_key: row.entry_key,
					value_json: row.value_json,
					created_at: normalizeLegacySqliteInteger(row.created_at) ?? 0,
					expires_at: normalizeLegacySqliteInteger(row.expires_at)
				}).onConflict((conflict) => conflict.columns([
					"plugin_id",
					"namespace",
					"entry_key"
				]).doNothing()));
				imported += 1;
			}
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
		if (imported > 0) changes.push(`Migrated ${imported} plugin-state sidecar ${imported === 1 ? "entry" : "entries"} → shared SQLite state`);
		if (conflictedKeys.length > 0) return {
			changes,
			warnings: [`Left plugin-state sidecar in place because ${conflictedKeys.length} ${conflictedKeys.length === 1 ? "row" : "rows"} already existed in shared state: ${conflictedKeys[0]}`]
		};
		if (skippedExpired > 0) changes.push(`Dropped ${skippedExpired} expired plugin-state sidecar ${skippedExpired === 1 ? "entry" : "entries"}`);
	} catch (err) {
		return {
			changes,
			warnings: [`Failed migrating plugin-state sidecar ${sourcePath}: ${String(err)}`]
		};
	}
	archiveLegacyPluginStateSidecar({
		sourcePath,
		changes,
		warnings
	});
	return {
		changes,
		warnings
	};
}
async function migrateLegacyInstalledPluginIndex(params) {
	const sourcePath = require_installed_plugin_index_record_reader.resolveLegacyInstalledPluginIndexStorePath({ stateDir: params.stateDir });
	if (!fileExists(sourcePath)) return {
		changes: [],
		warnings: []
	};
	const changes = [];
	const warnings = [];
	const legacy = readLegacyInstalledPluginIndex(sourcePath);
	if (!legacy) return {
		changes,
		warnings: [`Left plugin install index in place because ${sourcePath} is invalid`]
	};
	const storeOptions = { stateDir: params.stateDir };
	const current = require_installed_plugin_index_store.readPersistedInstalledPluginIndexSync(storeOptions);
	if (current && !legacyInstalledPluginIndexMatches(current, legacy)) {
		const merged = mergeLegacyInstalledPluginIndexRecords(current, legacy);
		if (merged.addedCount > 0) try {
			require_installed_plugin_index_store.writePersistedInstalledPluginIndexSync(merged.merged, storeOptions);
			changes.push(`Merged ${merged.addedCount} legacy plugin install ${merged.addedCount === 1 ? "record" : "records"} → shared SQLite state`);
		} catch (err) {
			return {
				changes,
				warnings: [`Failed merging plugin install index ${sourcePath}: ${String(err)}`]
			};
		}
		if (merged.conflicts.length > 0) {
			archiveLegacyInstalledPluginIndex({
				sourcePath,
				changes,
				warnings
			});
			return {
				changes,
				warnings,
				notices: [`Kept canonical shared SQLite plugin install metadata despite differing legacy records for: ${merged.conflicts.join(", ")}`]
			};
		}
	}
	if (!current) try {
		require_installed_plugin_index_store.writePersistedInstalledPluginIndexSync(legacy, storeOptions);
		const recordCount = Object.keys(legacy.installRecords).length;
		changes.push(`Migrated plugin install index ${recordCount} ${recordCount === 1 ? "record" : "records"} → shared SQLite state`);
	} catch (err) {
		return {
			changes,
			warnings: [`Failed migrating plugin install index ${sourcePath}: ${String(err)}`]
		};
	}
	archiveLegacyInstalledPluginIndex({
		sourcePath,
		changes,
		warnings
	});
	return {
		changes,
		warnings
	};
}
function resolvePluginStateImportTargetKey(scopeKey, key) {
	return scopeKey ? `${scopeKey}:${key}` : key;
}
function findMissingKey(expected, actual) {
	for (const key of expected) if (!actual.has(key)) return key;
}
async function withPluginStateImportEnv(plan, run) {
	if (!plan.stateDir) return await run();
	const previous = process.env.OPERATOR_STATE_DIR;
	process.env.OPERATOR_STATE_DIR = plan.stateDir;
	try {
		return await run();
	} finally {
		if (previous === void 0) delete process.env.OPERATOR_STATE_DIR;
		else process.env.OPERATOR_STATE_DIR = previous;
	}
}
async function runLegacyMigrationPlans(plans) {
	const changes = [];
	const warnings = [];
	for (const plan of plans) {
		if (plan.kind === "plugin-state-import") {
			await withPluginStateImportEnv(plan, async () => {
				let storeEntries;
				let pluginEntryCount;
				const store = require_plugin_state_store.createPluginStateKeyedStore(plan.pluginId, {
					namespace: plan.namespace,
					maxEntries: plan.maxEntries,
					...plan.defaultTtlMs != null ? { defaultTtlMs: plan.defaultTtlMs } : {}
				});
				try {
					storeEntries = await store.entries();
					pluginEntryCount = require_plugin_state_store.countPluginStateLiveEntries(plan.pluginId);
				} catch (err) {
					warnings.push(`Failed reading ${plan.label} plugin state before migration: ${String(err)}`);
					return;
				}
				const existingKeys = new Set(storeEntries.map(({ key }) => key));
				const existingValuesByKey = new Map(storeEntries.map(({ key, value }) => [key, value]));
				const expectedKeys = new Set(existingKeys);
				const namespaceRemainingCapacity = Math.max(0, plan.maxEntries - storeEntries.length);
				let entries;
				try {
					entries = await plan.readEntries();
				} catch (err) {
					warnings.push(`Failed reading ${plan.label} legacy source: ${String(err)}`);
					return;
				}
				const candidateEntries = [];
				const failedTargetKeys = /* @__PURE__ */ new Set();
				let missingEntryCount = 0;
				for (const entry of entries) {
					const targetKey = resolvePluginStateImportTargetKey(plan.scopeKey, entry.key);
					const existingValue = existingValuesByKey.get(targetKey);
					if (existingKeys.has(targetKey)) {
						if (existingValue !== void 0 && await plan.shouldReplaceExistingEntry?.({
							key: entry.key,
							existingValue,
							incomingValue: entry.value
						})) candidateEntries.push({
							...entry,
							targetKey,
							existedBefore: true
						});
						continue;
					}
					candidateEntries.push({
						...entry,
						targetKey,
						existedBefore: false
					});
					missingEntryCount++;
				}
				if (missingEntryCount > namespaceRemainingCapacity) {
					warnings.push(`Skipped migrating ${plan.label} because plugin state namespace ${plan.namespace} has room for ${namespaceRemainingCapacity} of ${missingEntryCount} missing entries; left legacy source in place`);
					return;
				}
				const pluginRemainingCapacity = Math.max(0, require_plugin_state_store.MAX_PLUGIN_STATE_ENTRIES_PER_PLUGIN - pluginEntryCount);
				if (missingEntryCount > pluginRemainingCapacity) {
					warnings.push(`Skipped migrating ${plan.label} because plugin state has room for ${pluginRemainingCapacity} of ${missingEntryCount} missing entries; left legacy source in place`);
					return;
				}
				let imported = 0;
				const changedKeys = [];
				for (const entry of candidateEntries) try {
					await store.register(entry.targetKey, entry.value, entry.ttlMs != null ? { ttlMs: entry.ttlMs } : void 0);
					const nextExpectedKeys = new Set(expectedKeys);
					nextExpectedKeys.add(entry.targetKey);
					const missingKey = findMissingKey(nextExpectedKeys, new Set((await store.entries()).map(({ key }) => key)));
					if (missingKey) {
						for (const changedKey of changedKeys.toReversed()) if (existingValuesByKey.has(changedKey)) await store.register(changedKey, existingValuesByKey.get(changedKey));
						else await store.delete(changedKey);
						if (existingValuesByKey.has(entry.targetKey)) await store.register(entry.targetKey, existingValuesByKey.get(entry.targetKey));
						else await store.delete(entry.targetKey);
						warnings.push(`Stopped migrating ${plan.label} because plugin state cap evicted ${missingKey}; left legacy source in place`);
						return;
					}
					expectedKeys.add(entry.targetKey);
					existingKeys.add(entry.targetKey);
					changedKeys.push(entry.targetKey);
					imported++;
				} catch (err) {
					failedTargetKeys.add(entry.targetKey);
					warnings.push(`Failed migrating ${plan.label} entry ${entry.key}: ${String(err)}`);
				}
				if (imported > 0) changes.push(`Migrated ${imported} ${plan.label} ${imported === 1 ? "entry" : "entries"} → plugin state`);
				let cleanupKeys = existingKeys;
				if (plan.cleanupSource === "rename") cleanupKeys = expectedKeys;
				const allEntriesCovered = entries.length === 0 && plan.cleanupWhenEmpty === true || entries.length > 0 && entries.every(({ key }) => cleanupKeys.has(resolvePluginStateImportTargetKey(plan.scopeKey, key)) && !failedTargetKeys.has(resolvePluginStateImportTargetKey(plan.scopeKey, key)));
				if (allEntriesCovered && plan.cleanupSource === "rename" && fileExists(plan.sourcePath)) archiveLegacyImportSource({
					sourcePath: plan.sourcePath,
					label: plan.label,
					changes,
					warnings
				});
				if (allEntriesCovered && plan.cleanupSource === "remove" && fileExists(plan.sourcePath)) try {
					node_fs.default.unlinkSync(plan.sourcePath);
					changes.push(`Removed ${plan.label} legacy source (${plan.sourcePath})`);
				} catch (err) {
					warnings.push(`Failed removing ${plan.label} legacy source: ${String(err)}`);
				}
				if (allEntriesCovered && plan.removeSource) try {
					await plan.removeSource();
					changes.push(`Removed ${plan.label} legacy source (${plan.sourcePath})`);
				} catch (err) {
					warnings.push(`Failed removing ${plan.label} legacy source: ${String(err)}`);
				}
			});
			continue;
		}
		if (fileExists(plan.targetPath)) continue;
		try {
			ensureMigrationDir(node_path.default.dirname(plan.targetPath));
			if (plan.kind === "move") {
				node_fs.default.renameSync(plan.sourcePath, plan.targetPath);
				changes.push(`Moved ${plan.label} → ${plan.targetPath}`);
			} else {
				node_fs.default.copyFileSync(plan.sourcePath, plan.targetPath);
				changes.push(`Copied ${plan.label} → ${plan.targetPath}`);
			}
		} catch (err) {
			warnings.push(`Failed migrating ${plan.label} (${plan.sourcePath}): ${String(err)}`);
		}
	}
	return {
		changes,
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.rescue-pending.ts
function resolveLegacyRescuePendingPaths(stateDir) {
	return ["crestodian", "@gabrielvfonseca/operator"].map((owner) => node_path.default.join(stateDir, owner, "rescue-pending"));
}
function isSafeLegacyOwnerDirectory(stateDir, sourcePath) {
	const ownerPath = node_path.default.dirname(sourcePath);
	try {
		const owner = node_fs.default.lstatSync(ownerPath);
		return owner.isDirectory() && !owner.isSymbolicLink() && node_path.default.resolve(node_path.default.dirname(ownerPath)) === node_path.default.resolve(stateDir);
	} catch {
		return false;
	}
}
/** Detect retired security capabilities only during an explicit doctor run. */
function detectLegacyRescuePending(params) {
	const sourcePaths = resolveLegacyRescuePendingPaths(params.stateDir);
	return {
		sourcePaths,
		hasLegacy: params.doctorOnlyStateMigrations === true && sourcePaths.some((sourcePath) => node_fs.default.existsSync(sourcePath))
	};
}
/** Discard retired one-shot capabilities; importing them could reactivate stale writes. */
function discardLegacyRescuePending(params) {
	if (!params.detected.hasLegacy) return {
		changes: [],
		warnings: []
	};
	const removed = [];
	const warnings = [];
	for (const sourcePath of resolveLegacyRescuePendingPaths(params.stateDir)) {
		if (!node_fs.default.existsSync(sourcePath)) continue;
		if (!isSafeLegacyOwnerDirectory(params.stateDir, sourcePath)) {
			warnings.push(`Refused to remove retired rescue approvals through unsafe path ${sourcePath}`);
			continue;
		}
		try {
			node_fs.default.rmSync(sourcePath, {
				recursive: true,
				force: true
			});
			removed.push(sourcePath);
		} catch (error) {
			warnings.push(`Failed removing retired rescue approvals at ${sourcePath}: ${String(error)}`);
		}
	}
	return {
		changes: removed.length > 0 ? [`Discarded retired system-agent rescue approvals from ${removed.join(", ")}`] : [],
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.runtime-state.ts
const VOICEWAKE_CONFIG_KEY = "default";
const DEFAULT_VOICEWAKE_TRIGGERS = [
	"@gabrielvfonseca/operator",
	"claude",
	"computer"
];
function resolveLegacyVoiceWakeTriggersPath(stateDir) {
	return node_path.default.join(stateDir, "settings", "voicewake.json");
}
function resolveLegacyVoiceWakeRoutingPath(stateDir) {
	return node_path.default.join(stateDir, "settings", "voicewake-routing.json");
}
function readLegacyJsonObject(sourcePath) {
	return JSON.parse(node_fs.default.readFileSync(sourcePath, "utf8"));
}
function normalizeLegacyVoiceWakeTriggers(input) {
	const rec = input && typeof input === "object" ? input : {};
	const triggers = Array.isArray(rec.triggers) ? rec.triggers.flatMap((entry) => typeof entry === "string" ? [entry.trim()] : []).filter((entry) => entry.length > 0) : [];
	return triggers.length > 0 ? triggers : DEFAULT_VOICEWAKE_TRIGGERS;
}
function legacyVoiceWakeTriggersMatch(rows, triggers) {
	return rows.length === triggers.length && rows.every((row, index) => row.trigger === triggers[index]);
}
function legacyVoiceWakeTargetColumns(target) {
	if (target.agentId) return {
		targetAgentId: target.agentId,
		targetMode: "agent",
		targetSessionKey: null
	};
	if (target.sessionKey) return {
		targetAgentId: null,
		targetMode: "session",
		targetSessionKey: target.sessionKey
	};
	return {
		targetAgentId: null,
		targetMode: "current",
		targetSessionKey: null
	};
}
function legacyVoiceWakeTargetColumnsMatch(left, right) {
	return left.targetAgentId === (right.target_agent_id ?? null) && left.targetMode === right.target_mode && left.targetSessionKey === (right.target_session_key ?? null);
}
function legacyVoiceWakeRoutingMatches(configRow, routeRows, routingConfig) {
	if (!legacyVoiceWakeTargetColumnsMatch(legacyVoiceWakeTargetColumns(routingConfig.defaultTarget), {
		target_agent_id: configRow.default_target_agent_id,
		target_mode: configRow.default_target_mode,
		target_session_key: configRow.default_target_session_key
	})) return false;
	return routeRows.length === routingConfig.routes.length && routeRows.every((row, index) => {
		const route = routingConfig.routes[index];
		if (!route || row.trigger !== route.trigger) return false;
		return legacyVoiceWakeTargetColumnsMatch(legacyVoiceWakeTargetColumns(route.target), row);
	});
}
function migrateLegacyVoiceWakeSettings(params) {
	const changes = [];
	const warnings = [];
	const env = {
		...process.env,
		OPERATOR_STATE_DIR: params.stateDir
	};
	if (fileExists(params.detected.triggersPath)) {
		let triggers;
		try {
			triggers = normalizeLegacyVoiceWakeTriggers(readLegacyJsonObject(params.detected.triggersPath));
		} catch (err) {
			warnings.push(`Failed reading legacy voice wake triggers ${params.detected.triggersPath}: ${String(err)}`);
			triggers = [];
		}
		if (triggers.length > 0) {
			let imported = false;
			let shouldArchive = false;
			try {
				require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
					const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
					const existing = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.selectFrom("voicewake_triggers").select(["trigger"]).where("config_key", "=", VOICEWAKE_CONFIG_KEY).orderBy("position", "asc")).rows;
					if (existing.length > 0) {
						if (!legacyVoiceWakeTriggersMatch(existing, triggers)) warnings.push(`Left legacy voice wake triggers in place because shared SQLite state already has different triggers: ${params.detected.triggersPath}`);
						else shouldArchive = true;
						return;
					}
					const updatedAtMs = Date.now();
					require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("voicewake_triggers").values(triggers.map((trigger, position) => ({
						config_key: VOICEWAKE_CONFIG_KEY,
						position,
						trigger,
						updated_at_ms: updatedAtMs
					}))));
					imported = true;
					shouldArchive = true;
				}, { env });
			} catch (err) {
				warnings.push(`Failed migrating legacy voice wake triggers: ${String(err)}`);
			}
			if (imported) changes.push(`Migrated ${triggers.length} voice wake ${triggers.length === 1 ? "trigger" : "triggers"} → shared SQLite state`);
			if (shouldArchive) archiveLegacyImportSource({
				sourcePath: params.detected.triggersPath,
				label: "voice wake triggers",
				changes,
				warnings
			});
		}
	}
	if (fileExists(params.detected.routingPath)) {
		let routingConfig = null;
		try {
			routingConfig = require_voicewake_routing.normalizeVoiceWakeRoutingConfig(readLegacyJsonObject(params.detected.routingPath));
		} catch (err) {
			warnings.push(`Failed reading legacy voice wake routing ${params.detected.routingPath}: ${String(err)}`);
		}
		if (routingConfig) {
			let imported = false;
			let shouldArchive = false;
			try {
				require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
					const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
					const existing = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("voicewake_routing_config").select([
						"default_target_agent_id",
						"default_target_mode",
						"default_target_session_key"
					]).where("config_key", "=", VOICEWAKE_CONFIG_KEY));
					if (existing) {
						const routeRows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.selectFrom("voicewake_routing_routes").select([
							"target_agent_id",
							"target_mode",
							"target_session_key",
							"trigger"
						]).where("config_key", "=", VOICEWAKE_CONFIG_KEY).orderBy("position", "asc")).rows;
						if (legacyVoiceWakeRoutingMatches(existing, routeRows, routingConfig)) shouldArchive = true;
						else warnings.push(`Left legacy voice wake routing in place because shared SQLite routing already exists with different routes: ${params.detected.routingPath}`);
						return;
					}
					const updatedAtMs = Date.now();
					const defaultTarget = legacyVoiceWakeTargetColumns(routingConfig.defaultTarget);
					require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("voicewake_routing_config").values({
						config_key: VOICEWAKE_CONFIG_KEY,
						version: 1,
						default_target_mode: defaultTarget.targetMode,
						default_target_agent_id: defaultTarget.targetAgentId,
						default_target_session_key: defaultTarget.targetSessionKey,
						updated_at_ms: updatedAtMs
					}));
					if (routingConfig.routes.length > 0) require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("voicewake_routing_routes").values(routingConfig.routes.map((route, position) => {
						const target = legacyVoiceWakeTargetColumns(route.target);
						return {
							config_key: VOICEWAKE_CONFIG_KEY,
							position,
							trigger: route.trigger,
							target_mode: target.targetMode,
							target_agent_id: target.targetAgentId,
							target_session_key: target.targetSessionKey,
							updated_at_ms: updatedAtMs
						};
					})));
					imported = true;
					shouldArchive = true;
				}, { env });
			} catch (err) {
				warnings.push(`Failed migrating legacy voice wake routing: ${String(err)}`);
			}
			if (imported) changes.push(`Migrated voice wake routing config with ${routingConfig.routes.length} ${routingConfig.routes.length === 1 ? "route" : "routes"} → shared SQLite state`);
			if (shouldArchive) archiveLegacyImportSource({
				sourcePath: params.detected.routingPath,
				label: "voice wake routing",
				changes,
				warnings
			});
		}
	}
	return {
		changes,
		warnings
	};
}
function resolveLegacyConfigHealthPath(stateDir) {
	return node_path.default.join(stateDir, "logs", "config-health.json");
}
function normalizeLegacyConfigHealthEntry(configPath, input) {
	if (!configPath.trim() || !input || typeof input !== "object" || Array.isArray(input)) return null;
	const entry = input;
	const lastKnownGoodJson = entry.lastKnownGood && typeof entry.lastKnownGood === "object" ? JSON.stringify(entry.lastKnownGood) : null;
	const lastPromotedGoodJson = entry.lastPromotedGood && typeof entry.lastPromotedGood === "object" ? JSON.stringify(entry.lastPromotedGood) : null;
	const lastObservedSuspiciousSignature = typeof entry.lastObservedSuspiciousSignature === "string" ? entry.lastObservedSuspiciousSignature : null;
	if (!lastKnownGoodJson && !lastPromotedGoodJson && !lastObservedSuspiciousSignature) return null;
	return {
		configPath,
		lastKnownGoodJson,
		lastPromotedGoodJson,
		lastObservedSuspiciousSignature
	};
}
function normalizeLegacyConfigHealthFile(input) {
	const entries = (input && typeof input === "object" ? input : {}).entries;
	if (!entries || typeof entries !== "object" || Array.isArray(entries)) return [];
	return Object.entries(entries).flatMap(([configPath, entry]) => {
		const normalized = normalizeLegacyConfigHealthEntry(configPath, entry);
		return normalized ? [normalized] : [];
	}).toSorted((a, b) => a.configPath.localeCompare(b.configPath));
}
function configHealthRow(entry) {
	return {
		config_path: entry.configPath,
		last_known_good_json: entry.lastKnownGoodJson,
		last_promoted_good_json: entry.lastPromotedGoodJson,
		last_observed_suspicious_signature: entry.lastObservedSuspiciousSignature,
		updated_at_ms: Date.now()
	};
}
function retireLegacyConfigHealthSource(params) {
	if (!fileExists(`${params.sourcePath}.migrated`)) {
		archiveLegacyImportSource({
			sourcePath: params.sourcePath,
			label: "config health state",
			changes: params.changes,
			warnings: params.warnings
		});
		return;
	}
	try {
		node_fs.default.rmSync(params.sourcePath, { force: true });
		params.changes.push("Removed regenerated config health legacy source");
	} catch (err) {
		params.warnings.push(`Failed removing regenerated config health legacy source: ${String(err)}`);
	}
}
function migrateLegacyConfigHealth(params) {
	const changes = [];
	const warnings = [];
	if (!fileExists(params.detected.sourcePath)) return {
		changes,
		warnings
	};
	let entries;
	try {
		entries = normalizeLegacyConfigHealthFile(readLegacyJsonObject(params.detected.sourcePath));
	} catch (err) {
		warnings.push(`Failed reading legacy config health state ${params.detected.sourcePath}: ${String(err)}`);
		return {
			changes,
			warnings
		};
	}
	let importedCount = 0;
	let reconciledCount = 0;
	let shouldArchive = false;
	try {
		const result = require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
			const existing = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.selectFrom("config_health_entries").select([
				"config_path",
				"last_known_good_json",
				"last_promoted_good_json",
				"last_observed_suspicious_signature"
			])).rows;
			const existingByPath = new Map(existing.map((row) => [row.config_path, row]));
			const entriesToInsert = [];
			let transactionReconciledCount = 0;
			for (const entry of entries) {
				const existingEntry = existingByPath.get(entry.configPath);
				if (!existingEntry) {
					entriesToInsert.push(entry);
					continue;
				}
				const lastKnownGoodJson = existingEntry.last_known_good_json ?? entry.lastKnownGoodJson;
				const lastPromotedGoodJson = existingEntry.last_promoted_good_json ?? entry.lastPromotedGoodJson;
				if (lastKnownGoodJson === existingEntry.last_known_good_json && lastPromotedGoodJson === existingEntry.last_promoted_good_json) continue;
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.updateTable("config_health_entries").set({
					last_known_good_json: lastKnownGoodJson,
					last_promoted_good_json: lastPromotedGoodJson,
					updated_at_ms: Date.now()
				}).where("config_path", "=", entry.configPath));
				transactionReconciledCount += 1;
			}
			if (entriesToInsert.length > 0) require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("config_health_entries").values(entriesToInsert.map(configHealthRow)));
			return {
				importedCount: entriesToInsert.length,
				reconciledCount: transactionReconciledCount
			};
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
		importedCount = result.importedCount;
		reconciledCount = result.reconciledCount;
		shouldArchive = true;
	} catch (err) {
		warnings.push(`Failed migrating legacy config health state: ${String(err)}`);
	}
	if (importedCount > 0) changes.push(`Migrated ${importedCount} config health ${importedCount === 1 ? "entry" : "entries"} → shared SQLite state`);
	if (reconciledCount > 0) changes.push(`Reconciled ${reconciledCount} config health ${reconciledCount === 1 ? "entry" : "entries"} → shared SQLite state`);
	if (shouldArchive) retireLegacyConfigHealthSource({
		sourcePath: params.detected.sourcePath,
		changes,
		warnings
	});
	return {
		changes,
		warnings
	};
}
function resolveLegacyPluginBindingApprovalsPath(env, homedir) {
	return node_path.default.join(require_home_dir.resolveRequiredHomeDir(env, homedir), ".operator", "plugin-binding-approvals.json");
}
function pluginBindingApprovalScopeKey(entry) {
	return [
		entry.pluginRoot,
		(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry.channel),
		entry.accountId
	].join("::");
}
function normalizeLegacyPluginBindingApprovalEntry(input) {
	const entry = input && typeof input === "object" ? input : {};
	const pluginRoot = typeof entry.pluginRoot === "string" ? entry.pluginRoot.trim() : "";
	const pluginId = typeof entry.pluginId === "string" ? entry.pluginId.trim() : "";
	const channel = typeof entry.channel === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry.channel) : "";
	const accountId = typeof entry.accountId === "string" && entry.accountId.trim() ? entry.accountId.trim() : "default";
	if (!pluginRoot || !pluginId || !channel) return null;
	return {
		pluginRoot,
		pluginId,
		pluginName: typeof entry.pluginName === "string" ? entry.pluginName : void 0,
		channel,
		accountId,
		approvedAt: typeof entry.approvedAt === "number" && Number.isFinite(entry.approvedAt) ? Math.floor(entry.approvedAt) : Date.now()
	};
}
function normalizeLegacyPluginBindingApprovalsFile(input) {
	const file = input && typeof input === "object" ? input : {};
	if (file.version !== 1 || !Array.isArray(file.approvals)) return [];
	const approvals = /* @__PURE__ */ new Map();
	for (const item of file.approvals) {
		const entry = normalizeLegacyPluginBindingApprovalEntry(item);
		if (!entry) continue;
		approvals.set(pluginBindingApprovalScopeKey(entry), entry);
	}
	return [...approvals.values()].toSorted((a, b) => pluginBindingApprovalScopeKey(a).localeCompare(pluginBindingApprovalScopeKey(b)));
}
function pluginBindingApprovalRow(entry) {
	return {
		plugin_root: entry.pluginRoot,
		channel: entry.channel,
		account_id: entry.accountId,
		plugin_id: entry.pluginId,
		plugin_name: entry.pluginName ?? null,
		approved_at: entry.approvedAt
	};
}
function pluginBindingApprovalComparable(entry) {
	return JSON.stringify(pluginBindingApprovalRow(entry));
}
function migrateLegacyPluginBindingApprovals(params) {
	const changes = [];
	const warnings = [];
	if (!params.detected.hasLegacy || !fileExists(params.detected.sourcePath)) return {
		changes,
		warnings
	};
	let approvals;
	try {
		approvals = normalizeLegacyPluginBindingApprovalsFile(readLegacyJsonObject(params.detected.sourcePath));
	} catch (err) {
		warnings.push(`Failed reading legacy plugin binding approvals ${params.detected.sourcePath}: ${String(err)}`);
		return {
			changes,
			warnings
		};
	}
	let importedCount = 0;
	let shouldArchive = approvals.length === 0;
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
			const existing = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.selectFrom("plugin_binding_approvals").select([
				"plugin_root",
				"channel",
				"account_id",
				"plugin_id",
				"plugin_name",
				"approved_at"
			])).rows;
			const existingByKey = new Map(existing.map((row) => [pluginBindingApprovalScopeKey({
				pluginRoot: row.plugin_root,
				channel: row.channel,
				accountId: row.account_id
			}), JSON.stringify({
				plugin_root: row.plugin_root,
				channel: row.channel,
				account_id: row.account_id,
				plugin_id: row.plugin_id,
				plugin_name: row.plugin_name,
				approved_at: row.approved_at
			})]));
			const approvalsToInsert = [];
			let conflictCount = 0;
			for (const approval of approvals) {
				const key = pluginBindingApprovalScopeKey(approval);
				const existingApprovalJson = existingByKey.get(key);
				if (existingApprovalJson === void 0) approvalsToInsert.push(approval);
				else if (existingApprovalJson !== pluginBindingApprovalComparable(approval)) conflictCount += 1;
			}
			if (approvalsToInsert.length > 0) {
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("plugin_binding_approvals").values(approvalsToInsert.map(pluginBindingApprovalRow)));
				importedCount = approvalsToInsert.length;
			}
			shouldArchive = conflictCount === 0;
			if (conflictCount > 0) warnings.push(`Left legacy plugin binding approvals in place because ${conflictCount} ${conflictCount === 1 ? "approval conflicts" : "approvals conflict"} with shared SQLite state: ${params.detected.sourcePath}`);
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
	} catch (err) {
		warnings.push(`Failed migrating legacy plugin binding approvals: ${String(err)}`);
	}
	if (importedCount > 0) changes.push(`Migrated ${importedCount} plugin binding ${importedCount === 1 ? "approval" : "approvals"} → shared SQLite state`);
	if (shouldArchive) archiveLegacyImportSource({
		sourcePath: params.detected.sourcePath,
		label: "plugin binding approvals",
		changes,
		warnings
	});
	return {
		changes,
		warnings
	};
}
const CURRENT_BINDING_CONVERSATION_KIND = "current";
function resolveLegacyCurrentConversationBindingsPath(stateDir) {
	return node_path.default.join(stateDir, "bindings", "current-conversations.json");
}
function currentConversationBindingKey(ref) {
	const normalized = require_session_binding_normalization.normalizeConversationRef(ref);
	return [
		normalized.channel,
		normalized.accountId,
		normalized.parentConversationId ?? "",
		normalized.conversationId
	].join("␟");
}
function normalizeLegacyCurrentConversationBindingRecord(input) {
	const record = input && typeof input === "object" ? input : {};
	if (!record.conversation?.conversationId) return null;
	const conversation = require_session_binding_normalization.normalizeConversationRef(record.conversation);
	const targetSessionKey = typeof record.targetSessionKey === "string" ? record.targetSessionKey.trim() : "";
	if (!targetSessionKey) return null;
	const targetKind = record.targetKind === "subagent" ? "subagent" : "session";
	const status = record.status === "ending" || record.status === "ended" ? record.status : "active";
	const boundAt = typeof record.boundAt === "number" && Number.isFinite(record.boundAt) ? Math.floor(record.boundAt) : Date.now();
	const expiresAt = typeof record.expiresAt === "number" && Number.isFinite(record.expiresAt) ? Math.floor(record.expiresAt) : void 0;
	return {
		bindingId: `generic:${currentConversationBindingKey(conversation)}`,
		targetSessionKey,
		targetKind,
		conversation,
		status,
		boundAt,
		...expiresAt !== void 0 ? { expiresAt } : {},
		...record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata) ? { metadata: record.metadata } : {}
	};
}
function normalizeLegacyCurrentConversationBindingFile(input) {
	const file = input && typeof input === "object" ? input : {};
	if (file.version !== 1 || !Array.isArray(file.bindings)) return [];
	const records = /* @__PURE__ */ new Map();
	for (const item of file.bindings) {
		const record = normalizeLegacyCurrentConversationBindingRecord(item);
		if (!record) continue;
		records.set(currentConversationBindingKey(record.conversation), record);
	}
	return [...records.values()].toSorted((a, b) => a.bindingId.localeCompare(b.bindingId));
}
function currentConversationBindingRow(record) {
	const conversation = require_session_binding_normalization.normalizeConversationRef(record.conversation);
	return {
		binding_key: currentConversationBindingKey(conversation),
		binding_id: record.bindingId,
		target_agent_id: require_session_key.resolveAgentIdFromSessionKey(record.targetSessionKey),
		target_session_id: null,
		target_session_key: record.targetSessionKey,
		channel: conversation.channel,
		account_id: conversation.accountId,
		conversation_kind: CURRENT_BINDING_CONVERSATION_KIND,
		parent_conversation_id: conversation.parentConversationId ?? null,
		conversation_id: conversation.conversationId,
		target_kind: record.targetKind,
		status: record.status,
		bound_at: record.boundAt,
		expires_at: record.expiresAt ?? null,
		metadata_json: record.metadata ? JSON.stringify(record.metadata) : null,
		record_json: JSON.stringify(record),
		updated_at: Date.now()
	};
}
function migrateLegacyCurrentConversationBindings(params) {
	const changes = [];
	const warnings = [];
	if (!fileExists(params.detected.sourcePath)) return {
		changes,
		warnings
	};
	let records;
	try {
		records = normalizeLegacyCurrentConversationBindingFile(readLegacyJsonObject(params.detected.sourcePath));
	} catch (err) {
		warnings.push(`Failed reading legacy current-conversation bindings ${params.detected.sourcePath}: ${String(err)}`);
		return {
			changes,
			warnings
		};
	}
	let importedCount = 0;
	let shouldArchive = records.length === 0;
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
			const existing = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.selectFrom("current_conversation_bindings").select(["binding_key", "record_json"])).rows;
			const existingByKey = new Map(existing.map((row) => [row.binding_key, row.record_json]));
			const recordsToInsert = [];
			let conflictCount = 0;
			for (const record of records) {
				const key = currentConversationBindingKey(record.conversation);
				const existingRecordJson = existingByKey.get(key);
				if (existingRecordJson === void 0) recordsToInsert.push(record);
				else if (existingRecordJson !== JSON.stringify(record)) conflictCount += 1;
			}
			if (recordsToInsert.length === 0) {
				shouldArchive = conflictCount === 0;
				if (conflictCount > 0) warnings.push(`Left legacy current-conversation bindings in place because ${conflictCount} ${conflictCount === 1 ? "binding conflicts" : "bindings conflict"} with shared SQLite state: ${params.detected.sourcePath}`);
				return;
			}
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("current_conversation_bindings").values(recordsToInsert.map(currentConversationBindingRow)));
			importedCount = recordsToInsert.length;
			shouldArchive = conflictCount === 0;
			if (conflictCount > 0) warnings.push(`Left legacy current-conversation bindings in place because ${conflictCount} ${conflictCount === 1 ? "binding conflicts" : "bindings conflict"} with shared SQLite state: ${params.detected.sourcePath}`);
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
	} catch (err) {
		warnings.push(`Failed migrating legacy current-conversation bindings: ${String(err)}`);
	}
	if (importedCount > 0) changes.push(`Migrated ${importedCount} current-conversation ${importedCount === 1 ? "binding" : "bindings"} → shared SQLite state`);
	if (shouldArchive) archiveLegacyImportSource({
		sourcePath: params.detected.sourcePath,
		label: "current-conversation bindings",
		changes,
		warnings
	});
	return {
		changes,
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.state-dir.ts
let autoMigrateStateDirChecked = false;
let autoMigrateTaskStateSidecarsChecked = false;
function resetAutoMigrateLegacyStateDirForTest() {
	autoMigrateStateDirChecked = false;
}
function resetAutoMigrateLegacyTaskStateSidecarsForTest() {
	autoMigrateTaskStateSidecarsChecked = false;
}
function resolveSymlinkTarget(linkPath) {
	try {
		const target = node_fs.default.readlinkSync(linkPath);
		return node_path.default.resolve(node_path.default.dirname(linkPath), target);
	} catch {
		return null;
	}
}
function formatStateDirMigration(legacyDir, targetDir) {
	return `State dir: ${legacyDir} → ${targetDir} (legacy path now symlinked)`;
}
function isDirPath(filePath) {
	try {
		return node_fs.default.statSync(filePath).isDirectory();
	} catch {
		return false;
	}
}
function isLegacyTreeSymlinkMirror(currentDir, realTargetDir) {
	let entries;
	try {
		entries = node_fs.default.readdirSync(currentDir, { withFileTypes: true });
	} catch {
		return false;
	}
	if (entries.length === 0) return false;
	for (const entry of entries) {
		const entryPath = node_path.default.join(currentDir, entry.name);
		let stat;
		try {
			stat = node_fs.default.lstatSync(entryPath);
		} catch {
			return false;
		}
		if (stat.isSymbolicLink()) {
			const resolvedTarget = resolveSymlinkTarget(entryPath);
			if (!resolvedTarget) return false;
			let resolvedRealTarget;
			try {
				resolvedRealTarget = node_fs.default.realpathSync(resolvedTarget);
			} catch {
				return false;
			}
			if (!(0, _openclaw_fs_safe_path.isWithinDir)(realTargetDir, resolvedRealTarget)) return false;
			continue;
		}
		if (stat.isDirectory()) {
			if (!isLegacyTreeSymlinkMirror(entryPath, realTargetDir)) return false;
			continue;
		}
		return false;
	}
	return true;
}
function isLegacyDirSymlinkMirror(legacyDir, targetDir) {
	let realTargetDir;
	try {
		realTargetDir = node_fs.default.realpathSync(targetDir);
	} catch {
		return false;
	}
	return isLegacyTreeSymlinkMirror(legacyDir, realTargetDir);
}
async function autoMigrateLegacyStateDir(params) {
	if (autoMigrateStateDirChecked) return {
		migrated: false,
		skipped: true,
		changes: [],
		warnings: []
	};
	autoMigrateStateDirChecked = true;
	const homedir = params.homedir ?? node_os.default.homedir;
	const env = params.env ?? process.env;
	const warnings = [];
	const changes = [];
	const notices = [];
	const hasCustomStateDir = Boolean(env.OPERATOR_STATE_DIR?.trim());
	const targetDir = hasCustomStateDir ? require_paths.resolveStateDir(env, homedir) : require_paths.resolveNewStateDir(homedir);
	const migratePluginInstallIndex = async () => {
		const result = await migrateLegacyInstalledPluginIndex({ stateDir: targetDir });
		changes.push(...result.changes);
		warnings.push(...result.warnings);
		notices.push(...result.notices ?? []);
	};
	if (hasCustomStateDir) {
		await migratePluginInstallIndex();
		return {
			migrated: changes.length > 0,
			skipped: changes.length === 0 && warnings.length === 0 && notices.length === 0,
			changes,
			warnings,
			...notices.length > 0 ? { notices } : {}
		};
	}
	const legacyDirs = require_paths.resolveLegacyStateDirs(homedir);
	let legacyDir = legacyDirs.find((dir) => {
		try {
			return node_fs.default.existsSync(dir);
		} catch {
			return false;
		}
	});
	let legacyStat;
	try {
		legacyStat = legacyDir ? node_fs.default.lstatSync(legacyDir) : null;
	} catch {
		legacyStat = null;
	}
	if (!legacyStat) {
		await migratePluginInstallIndex();
		return {
			migrated: changes.length > 0,
			skipped: false,
			changes,
			warnings,
			...notices.length > 0 ? { notices } : {}
		};
	}
	if (!legacyStat.isDirectory() && !legacyStat.isSymbolicLink()) {
		warnings.push(`Legacy state path is not a directory: ${legacyDir}`);
		return {
			migrated: false,
			skipped: false,
			changes,
			warnings
		};
	}
	let symlinkDepth = 0;
	while (legacyStat.isSymbolicLink()) {
		const legacyTarget = legacyDir ? resolveSymlinkTarget(legacyDir) : null;
		if (!legacyTarget) {
			warnings.push(`Legacy state dir is a symlink (${legacyDir ?? "unknown"}); could not resolve target.`);
			return {
				migrated: false,
				skipped: false,
				changes,
				warnings
			};
		}
		if (node_path.default.resolve(legacyTarget) === node_path.default.resolve(targetDir)) {
			await migratePluginInstallIndex();
			return {
				migrated: changes.length > 0,
				skipped: false,
				changes,
				warnings,
				...notices.length > 0 ? { notices } : {}
			};
		}
		if (legacyDirs.some((dir) => node_path.default.resolve(dir) === node_path.default.resolve(legacyTarget))) {
			legacyDir = legacyTarget;
			try {
				legacyStat = node_fs.default.lstatSync(legacyDir);
			} catch {
				legacyStat = null;
			}
			if (!legacyStat) {
				warnings.push(`Legacy state dir missing after symlink resolution: ${legacyDir}`);
				return {
					migrated: false,
					skipped: false,
					changes,
					warnings
				};
			}
			if (!legacyStat.isDirectory() && !legacyStat.isSymbolicLink()) {
				warnings.push(`Legacy state path is not a directory: ${legacyDir}`);
				return {
					migrated: false,
					skipped: false,
					changes,
					warnings
				};
			}
			symlinkDepth += 1;
			if (symlinkDepth > 2) {
				warnings.push(`Legacy state dir symlink chain too deep: ${legacyDir}`);
				return {
					migrated: false,
					skipped: false,
					changes,
					warnings
				};
			}
			continue;
		}
		warnings.push(`Legacy state dir is a symlink (${legacyDir ?? "unknown"} → ${legacyTarget}); skipping auto-migration.`);
		return {
			migrated: false,
			skipped: false,
			changes,
			warnings
		};
	}
	if (isDirPath(targetDir)) {
		if (legacyDir && isLegacyDirSymlinkMirror(legacyDir, targetDir)) {
			await migratePluginInstallIndex();
			return {
				migrated: changes.length > 0,
				skipped: false,
				changes,
				warnings,
				...notices.length > 0 ? { notices } : {}
			};
		}
		await migratePluginInstallIndex();
		warnings.push(`State dir migration skipped: target already exists (${targetDir}). Remove or merge manually.`);
		return {
			migrated: changes.length > 0,
			skipped: false,
			changes,
			warnings,
			...notices.length > 0 ? { notices } : {}
		};
	}
	try {
		if (!legacyDir) throw new Error("Legacy state dir not found");
		node_fs.default.renameSync(legacyDir, targetDir);
	} catch (err) {
		warnings.push(`Failed to move legacy state dir (${legacyDir ?? "unknown"} → ${targetDir}): ${String(err)}`);
		return {
			migrated: false,
			skipped: false,
			changes,
			warnings
		};
	}
	try {
		if (!legacyDir) throw new Error("Legacy state dir not found");
		node_fs.default.symlinkSync(targetDir, legacyDir, "dir");
		changes.push(formatStateDirMigration(legacyDir, targetDir));
	} catch (err) {
		try {
			if (process.platform === "win32") {
				if (!legacyDir) throw new Error("Legacy state dir not found", { cause: err });
				node_fs.default.symlinkSync(targetDir, legacyDir, "junction");
				changes.push(formatStateDirMigration(legacyDir, targetDir));
			} else throw err;
		} catch (fallbackErr) {
			try {
				if (!legacyDir) throw new Error("Legacy state dir not found", { cause: fallbackErr });
				node_fs.default.renameSync(targetDir, legacyDir);
				warnings.push(`State dir migration rolled back (failed to link legacy path): ${String(fallbackErr)}`);
				return {
					migrated: false,
					skipped: false,
					changes: [],
					warnings
				};
			} catch (rollbackErr) {
				warnings.push(`State dir moved but failed to link legacy path (${legacyDir ?? "unknown"} → ${targetDir}): ${String(fallbackErr)}`);
				warnings.push(`Rollback failed; set OPERATOR_STATE_DIR=${targetDir} to avoid split state: ${String(rollbackErr)}`);
				changes.push(`State dir: ${legacyDir ?? "unknown"} → ${targetDir}`);
			}
		}
	}
	await migratePluginInstallIndex();
	return {
		migrated: changes.length > 0,
		skipped: false,
		changes,
		warnings,
		...notices.length > 0 ? { notices } : {}
	};
}
async function autoMigrateLegacyTaskStateSidecars(params) {
	if (autoMigrateTaskStateSidecarsChecked) return {
		migrated: false,
		skipped: true,
		changes: [],
		warnings: []
	};
	autoMigrateTaskStateSidecarsChecked = true;
	const stateDir = require_paths.resolveStateDir(params.env ?? process.env, params.homedir);
	const result = await migrateLegacyTaskStateSidecars({ stateDir });
	const detectedExecApprovals = detectLegacyExecApprovalsMigration({
		env: params.env ?? process.env,
		homedir: params.homedir ?? node_os.default.homedir,
		stateDir
	});
	const crossStateDirImports = params.crossStateDirImports === true;
	const execApprovals = migrateLegacyExecApprovals(crossStateDirImports ? detectedExecApprovals : {
		...detectedExecApprovals,
		hasLegacy: false
	});
	const notices = [];
	if (detectedExecApprovals.hasLegacy && !crossStateDirImports) notices.push(`Exec approvals in the default state dir were not imported into OPERATOR_STATE_DIR automatically (${detectedExecApprovals.sourcePath} -> ${detectedExecApprovals.targetPath}); run \`openclaw doctor --fix\` to import them.`);
	const changes = [...result.changes, ...execApprovals.changes];
	const warnings = [...result.warnings, ...execApprovals.warnings];
	const logger = params.log ?? require_subsystem.createSubsystemLogger("state-migrations");
	if (changes.length > 0) logger.info(`Auto-migrated legacy state:\n${changes.map((entry) => `- ${entry}`).join("\n")}`);
	if (warnings.length > 0) logger.warn(`Legacy state migration warnings:\n${warnings.map((entry) => `- ${entry}`).join("\n")}`);
	if (notices.length > 0) logger.info(`Legacy state migration notes:\n${notices.map((entry) => `- ${entry}`).join("\n")}`);
	return {
		migrated: changes.length > 0,
		skipped: false,
		changes,
		warnings,
		...notices.length > 0 ? { notices } : {}
	};
}
//#endregion
//#region src/infra/state-migrations.subagent-registry-db.ts
const MIGRATION_KIND = "legacy-subagent-registry-json";
/** Records the irreversible retirement decision before Doctor removes the claimed file. */
function recordLegacySubagentRegistryDiscard(params) {
	const sourceKey = `subagent-json:${(0, node_crypto.createHash)("sha256").update(params.sourcePath).digest("hex")}`;
	const now = Date.now();
	const runId = `${sourceKey}:${params.sourceSha256.slice(0, 16)}`;
	let decision = "retired-source-discarded";
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		if (require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("migration_sources").select("source_key").where("source_key", "=", sourceKey))) decision = "receipt-authoritative";
		const reportJson = JSON.stringify({
			source: MIGRATION_KIND,
			target: "subagent_runs",
			decision,
			sourceSha256: params.sourceSha256,
			importedRecordCount: 0,
			reason: "retired transient state is never imported into the canonical SQLite registry"
		});
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("migration_runs").values({
			id: runId,
			started_at: now,
			finished_at: now,
			status: "completed",
			report_json: reportJson
		}).onConflict((conflict) => conflict.column("id").doUpdateSet({
			finished_at: now,
			status: "completed",
			report_json: reportJson
		})));
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("migration_sources").values({
			source_key: sourceKey,
			migration_kind: MIGRATION_KIND,
			source_path: params.sourcePath,
			target_table: "subagent_runs",
			source_sha256: params.sourceSha256,
			source_size_bytes: params.sourceSize,
			source_record_count: null,
			last_run_id: runId,
			status: "completed",
			imported_at: now,
			removed_source: 0,
			report_json: reportJson
		}).onConflict((conflict) => conflict.column("source_key").doUpdateSet({
			source_sha256: params.sourceSha256,
			source_size_bytes: params.sourceSize,
			source_record_count: null,
			last_run_id: runId,
			status: "completed",
			imported_at: now,
			removed_source: 0,
			report_json: reportJson
		})));
	}, { env: params.env });
	return {
		decision,
		sourceKey
	};
}
function markLegacySubagentRegistrySourceRemoved(sourceKey, env) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).updateTable("migration_sources").set({ removed_source: 1 }).where("source_key", "=", sourceKey));
	}, { env });
}
//#endregion
//#region src/infra/state-migrations.subagent-registry.ts
const LEGACY_SUBAGENT_REGISTRY_MAX_BYTES = 16 * 1024 * 1024;
const MIGRATION_LOCK_TIMEOUT_MS$1 = 250;
const MIGRATION_LOCK_POLL_INTERVAL_MS$1 = 25;
const DOCTOR_CLAIM_SUFFIX$1 = ".doctor-importing";
function resolveLegacySubagentRegistryPath(stateDir) {
	return node_path.default.join(stateDir, "subagents", "runs.json");
}
function legacyPathMayExist$1(filePath) {
	try {
		node_fs.default.lstatSync(filePath);
		return true;
	} catch (error) {
		return error.code !== "ENOENT";
	}
}
function sourceOrClaimMayExist$1(sourcePath) {
	return legacyPathMayExist$1(sourcePath) || legacyPathMayExist$1(`${sourcePath}${DOCTOR_CLAIM_SUFFIX$1}`);
}
/** Detect retired subagent state only when an explicit Doctor flow opts in. */
function detectLegacySubagentRegistry(params) {
	const sourcePath = resolveLegacySubagentRegistryPath(params.stateDir);
	return {
		sourcePath,
		hasLegacy: params.doctorOnlyStateMigrations === true && sourceOrClaimMayExist$1(sourcePath)
	};
}
function relativeLegacyPath$1(stateDir, filePath) {
	const relativePath = node_path.default.relative(node_path.default.resolve(stateDir), node_path.default.resolve(filePath));
	if (!relativePath || relativePath === ".." || relativePath.startsWith(`..${node_path.default.sep}`) || node_path.default.isAbsolute(relativePath)) throw new Error(`legacy subagent registry path is outside the state directory: ${filePath}`);
	return relativePath;
}
async function readLegacySourceSnapshot$2(stateRoot, stateDir, sourcePath) {
	const opened = await stateRoot.read(relativeLegacyPath$1(stateDir, sourcePath), {
		hardlinks: "reject",
		maxBytes: LEGACY_SUBAGENT_REGISTRY_MAX_BYTES,
		symlinks: "reject"
	});
	return {
		sourcePath,
		dev: opened.stat.dev,
		ino: opened.stat.ino,
		mtimeMs: opened.stat.mtimeMs,
		sha256: (0, node_crypto.createHash)("sha256").update(opened.buffer).digest("hex"),
		size: opened.stat.size
	};
}
function sourceSnapshotsMatch$1(left, right) {
	return left.dev === right.dev && left.ino === right.ino && left.mtimeMs === right.mtimeMs && left.sha256 === right.sha256 && left.size === right.size;
}
async function recoverInterruptedClaim$1(stateRoot, stateDir, sourcePath, env) {
	const claimPath = `${sourcePath}${DOCTOR_CLAIM_SUFFIX$1}`;
	const claimRelativePath = relativeLegacyPath$1(stateDir, claimPath);
	const sourceRelativePath = relativeLegacyPath$1(stateDir, sourcePath);
	if (!await stateRoot.exists(claimRelativePath)) return;
	const claimed = await readLegacySourceSnapshot$2(stateRoot, stateDir, claimPath);
	if (!await stateRoot.exists(sourceRelativePath)) {
		await stateRoot.move(claimRelativePath, sourceRelativePath);
		return;
	}
	await readLegacySourceSnapshot$2(stateRoot, stateDir, sourcePath);
	const result = recordLegacySubagentRegistryDiscard({
		env,
		sourcePath,
		sourceSha256: claimed.sha256,
		sourceSize: claimed.size
	});
	await stateRoot.remove(claimRelativePath);
	markLegacySubagentRegistrySourceRemoved(result.sourceKey, env);
}
async function restoreClaim(params) {
	const claimPath = `${params.sourcePath}${DOCTOR_CLAIM_SUFFIX$1}`;
	try {
		if (!await params.stateRoot.exists(relativeLegacyPath$1(params.stateDir, claimPath))) return null;
		if (await params.stateRoot.exists(relativeLegacyPath$1(params.stateDir, params.sourcePath))) return `source path already exists: ${params.sourcePath}`;
		await params.stateRoot.move(relativeLegacyPath$1(params.stateDir, claimPath), relativeLegacyPath$1(params.stateDir, params.sourcePath));
		return null;
	} catch (error) {
		return String(error);
	}
}
async function migrateWithExclusiveStateOwnership(params) {
	const changes = [];
	const warnings = [];
	const notices = [];
	const sourcePath = params.detected.sourcePath;
	if (!params.detected.hasLegacy) return {
		changes,
		warnings
	};
	let snapshot;
	try {
		await recoverInterruptedClaim$1(params.stateRoot, params.stateDir, sourcePath, params.env);
		if (!await params.stateRoot.exists(relativeLegacyPath$1(params.stateDir, sourcePath))) return {
			changes,
			warnings
		};
		snapshot = await readLegacySourceSnapshot$2(params.stateRoot, params.stateDir, sourcePath);
	} catch (error) {
		warnings.push(`Failed reading legacy subagent registry: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	const claimPath = `${sourcePath}${DOCTOR_CLAIM_SUFFIX$1}`;
	try {
		params.beforeVerify?.();
		if (!sourceSnapshotsMatch$1(await readLegacySourceSnapshot$2(params.stateRoot, params.stateDir, sourcePath), snapshot)) throw new Error("legacy subagent registry changed after Doctor loaded it");
		params.beforeClaim?.();
		await params.stateRoot.move(relativeLegacyPath$1(params.stateDir, sourcePath), relativeLegacyPath$1(params.stateDir, claimPath));
		if (!sourceSnapshotsMatch$1(await readLegacySourceSnapshot$2(params.stateRoot, params.stateDir, claimPath), snapshot)) throw new Error("legacy subagent registry changed before Doctor could claim it");
	} catch (error) {
		const restoreError = await restoreClaim({
			stateRoot: params.stateRoot,
			stateDir: params.stateDir,
			sourcePath
		});
		warnings.push(`Failed migrating legacy subagent registry: ${String(error)}${restoreError ? `; restore failure: ${restoreError}` : ""}`);
		return {
			changes,
			warnings
		};
	}
	let result;
	try {
		result = recordLegacySubagentRegistryDiscard({
			env: params.env,
			sourcePath: snapshot.sourcePath,
			sourceSha256: snapshot.sha256,
			sourceSize: snapshot.size
		});
	} catch (error) {
		const restoreError = await restoreClaim({
			stateRoot: params.stateRoot,
			stateDir: params.stateDir,
			sourcePath
		});
		warnings.push(`Failed migrating legacy subagent registry: ${String(error)}${restoreError ? `; restore failure: ${restoreError}` : ""}`);
		return {
			changes,
			warnings
		};
	}
	try {
		if (await params.stateRoot.exists(relativeLegacyPath$1(params.stateDir, sourcePath))) throw new Error(`legacy subagent registry reappeared during retirement: ${sourcePath}`);
		if (params.removeSource) await params.removeSource(claimPath);
		else await params.stateRoot.remove(relativeLegacyPath$1(params.stateDir, claimPath));
		if (await params.stateRoot.exists(relativeLegacyPath$1(params.stateDir, sourcePath))) throw new Error(`legacy subagent registry reappeared during cleanup: ${sourcePath}`);
		if (await params.stateRoot.exists(relativeLegacyPath$1(params.stateDir, claimPath))) throw new Error(`legacy subagent registry Doctor claim remains after cleanup: ${claimPath}`);
	} catch (error) {
		warnings.push(`Legacy subagent registry retirement cleanup failed: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	try {
		markLegacySubagentRegistrySourceRemoved(result.sourceKey, params.env);
	} catch (error) {
		warnings.push(`Legacy subagent registry was removed, but its receipt could not be finalized: ${String(error)}`);
	}
	changes.push(result.decision === "receipt-authoritative" ? "Discarded recreated retired subagent JSON without importing it." : "Discarded retired subagent JSON without importing transient run state.");
	notices.push("Removed retired subagents/runs.json after the discard decision was recorded.");
	return {
		changes,
		warnings,
		notices
	};
}
/** Discard retired transient state while excluding active Gateway owners. */
async function migrateLegacySubagentRegistry(params) {
	if (!params.detected.hasLegacy) return {
		changes: [],
		warnings: []
	};
	const env = {
		...params.env ?? process.env,
		OPERATOR_STATE_DIR: params.stateDir
	};
	let lock;
	try {
		lock = await require_gateway_lock.acquireGatewayLock({
			allowInTests: true,
			env,
			pollIntervalMs: MIGRATION_LOCK_POLL_INTERVAL_MS$1,
			role: "sqlite-maintenance",
			timeoutMs: MIGRATION_LOCK_TIMEOUT_MS$1
		});
	} catch (error) {
		return {
			changes: [],
			warnings: [`Failed migrating legacy subagent registry: ${error instanceof require_gateway_lock.GatewayLockError ? "the Gateway or another SQLite maintenance command owns this state directory" : String(error)}. Stop the Gateway, then run \`operator doctor --fix\` again.`]
		};
	}
	if (!lock) return {
		changes: [],
		warnings: ["Failed migrating legacy subagent registry: exclusive state ownership unavailable."]
	};
	let result = {
		changes: [],
		warnings: []
	};
	let releaseError;
	try {
		try {
			const stateRoot = await (0, _openclaw_fs_safe.root)(params.stateDir, {
				hardlinks: "reject",
				maxBytes: LEGACY_SUBAGENT_REGISTRY_MAX_BYTES,
				symlinks: "reject"
			});
			result = await migrateWithExclusiveStateOwnership({
				...params,
				env,
				stateRoot
			});
		} catch (error) {
			result.warnings.push(`Failed reading legacy subagent registry: ${String(error)}`);
		}
	} finally {
		try {
			await lock.release();
		} catch (error) {
			releaseError = error;
		}
	}
	if (releaseError) result.warnings.push(`Subagent registry migration lock release failed: ${require_errors.formatErrorMessage(releaseError)}`);
	return result;
}
//#endregion
//#region src/infra/state-migrations.tui-last-session.ts
const LEGACY_RECORD_KEYS = /* @__PURE__ */ new Set(["sessionKey", "updatedAt"]);
function resolveLegacyTuiLastSessionPath(stateDir) {
	return node_path.default.join(stateDir, "tui", "last-session.json");
}
/** Detect retired TUI state only when an explicit doctor flow opts in. */
function detectLegacyTuiLastSessions(params) {
	const sourcePath = resolveLegacyTuiLastSessionPath(params.stateDir);
	return {
		sourcePath,
		hasLegacy: params.doctorOnlyStateMigrations === true && node_fs.default.existsSync(sourcePath)
	};
}
function readLegacySourceSnapshot$1(sourcePath) {
	const before = node_fs.default.statSync(sourcePath);
	if (!before.isFile()) throw new Error("legacy TUI last-session source is not a regular file");
	const raw = node_fs.default.readFileSync(sourcePath, "utf8");
	const after = node_fs.default.statSync(sourcePath);
	if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error("legacy TUI last-session source changed while doctor was reading it");
	return {
		dev: after.dev,
		ino: after.ino,
		mtimeMs: after.mtimeMs,
		raw,
		sha256: (0, node_crypto.createHash)("sha256").update(raw).digest("hex"),
		size: after.size
	};
}
function assertLegacySourceUnchanged(sourcePath, expected) {
	if (!legacySourceSnapshotsMatch(readLegacySourceSnapshot$1(sourcePath), expected)) throw new Error("legacy TUI last-session source changed after doctor loaded it");
}
function legacySourceSnapshotsMatch(current, expected) {
	return current.dev === expected.dev && current.ino === expected.ino && current.size === expected.size && current.mtimeMs === expected.mtimeMs && current.sha256 === expected.sha256;
}
function restoreClaimAfterCleanupFailure(params) {
	if (!node_fs.default.existsSync(params.claimPath) || node_fs.default.existsSync(params.sourcePath)) return null;
	try {
		node_fs.default.renameSync(params.claimPath, params.sourcePath);
		return null;
	} catch (error) {
		return `; the claimed source remains at ${params.claimPath} because restore also failed: ${String(error)}`;
	}
}
function claimAndRemoveVerifiedLegacySource(params) {
	params.beforeClaim?.();
	const claimPath = `${params.sourcePath}.doctor-importing-${process.pid}-${(0, node_crypto.randomUUID)()}`;
	node_fs.default.renameSync(params.sourcePath, claimPath);
	try {
		if (!legacySourceSnapshotsMatch(readLegacySourceSnapshot$1(claimPath), params.snapshot)) throw new Error("legacy TUI last-session source changed before doctor could claim it");
		(params.removeSource ?? node_fs.default.unlinkSync)(claimPath);
	} catch (error) {
		const restoreFailure = restoreClaimAfterCleanupFailure({
			claimPath,
			sourcePath: params.sourcePath
		});
		throw new Error(`${String(error)}${restoreFailure ?? ""}`, { cause: error });
	}
}
function isObjectRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isHeartbeatSessionKey(sessionKey) {
	return sessionKey.toLowerCase().endsWith(":heartbeat");
}
function parseLegacyTuiLastSessions(raw) {
	const parsed = JSON.parse(raw);
	if (!isObjectRecord(parsed)) throw new Error("legacy TUI last-session store must be a JSON object");
	const records = [];
	for (const [scopeKey, value] of Object.entries(parsed)) {
		if (!scopeKey || scopeKey.trim() !== scopeKey) throw new Error("legacy TUI last-session store contains an invalid scope key");
		if (!isObjectRecord(value)) throw new Error(`legacy TUI last-session record ${scopeKey} must be an object`);
		const unexpectedKey = Object.keys(value).find((key) => !LEGACY_RECORD_KEYS.has(key));
		if (unexpectedKey) throw new Error(`legacy TUI last-session record ${scopeKey} has unexpected field ${unexpectedKey}`);
		const sessionKey = value.sessionKey;
		const updatedAt = value.updatedAt;
		if (typeof sessionKey !== "string" || !sessionKey || sessionKey.trim() !== sessionKey || sessionKey === "unknown") throw new Error(`legacy TUI last-session record ${scopeKey} has an invalid session key`);
		if (!Number.isSafeInteger(updatedAt) || updatedAt < 0) throw new Error(`legacy TUI last-session record ${scopeKey} has an invalid timestamp`);
		records.push({
			scopeKey,
			sessionKey,
			updatedAt
		});
	}
	return records;
}
function rowMatches(row, expected) {
	return row?.session_key === expected.sessionKey && row.updated_at === expected.updatedAt;
}
/** Import, verify, and remove the retired JSON store during an explicit doctor repair. */
function migrateLegacyTuiLastSessions(params) {
	const changes = [];
	const warnings = [];
	const notices = [];
	if (!params.detected.hasLegacy) return {
		changes,
		warnings
	};
	let snapshot;
	let records;
	try {
		snapshot = readLegacySourceSnapshot$1(params.detected.sourcePath);
		records = parseLegacyTuiLastSessions(snapshot.raw);
	} catch (error) {
		warnings.push(`Failed reading legacy TUI last-session state ${params.detected.sourcePath}: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	const activeRecords = records.filter((record) => !isHeartbeatSessionKey(record.sessionKey));
	const discardedHeartbeatCount = records.length - activeRecords.length;
	const expectedRows = /* @__PURE__ */ new Map();
	let importedCount = 0;
	let supersededCount = 0;
	try {
		assertLegacySourceUnchanged(params.detected.sourcePath, snapshot);
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const tuiDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
			for (const record of activeRecords) {
				const existing = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, tuiDb.selectFrom("tui_last_sessions").select(["session_key", "updated_at"]).where("scope_key", "=", record.scopeKey));
				if (!existing) {
					require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, tuiDb.insertInto("tui_last_sessions").values({
						scope_key: record.scopeKey,
						session_key: record.sessionKey,
						updated_at: record.updatedAt
					}));
					expectedRows.set(record.scopeKey, record);
					importedCount += 1;
					continue;
				}
				if (existing.updated_at === record.updatedAt) {
					if (existing.session_key !== record.sessionKey) throw new Error(`scope ${record.scopeKey} has divergent JSON and SQLite pointers at the same timestamp`);
					expectedRows.set(record.scopeKey, record);
					continue;
				}
				if (existing.updated_at > record.updatedAt) {
					expectedRows.set(record.scopeKey, {
						scopeKey: record.scopeKey,
						sessionKey: existing.session_key,
						updatedAt: existing.updated_at
					});
					supersededCount += 1;
					continue;
				}
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, tuiDb.updateTable("tui_last_sessions").set({
					session_key: record.sessionKey,
					updated_at: record.updatedAt
				}).where("scope_key", "=", record.scopeKey));
				expectedRows.set(record.scopeKey, record);
				importedCount += 1;
			}
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
	} catch (error) {
		warnings.push(`Failed migrating legacy TUI last-session state: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	try {
		params.beforeVerify?.();
		const database = require_openclaw_state_db.openOperatorStateDatabase({ env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
		const tuiDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
		for (const expected of expectedRows.values()) if (!rowMatches(require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, tuiDb.selectFrom("tui_last_sessions").select(["session_key", "updated_at"]).where("scope_key", "=", expected.scopeKey)), expected)) throw new Error(`SQLite verification failed for scope ${expected.scopeKey}`);
		assertLegacySourceUnchanged(params.detected.sourcePath, snapshot);
	} catch (error) {
		warnings.push(`Failed verifying legacy TUI last-session migration: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	try {
		claimAndRemoveVerifiedLegacySource({
			sourcePath: params.detected.sourcePath,
			snapshot,
			beforeClaim: params.beforeClaim,
			removeSource: params.removeSource
		});
	} catch (error) {
		warnings.push(`Migrated TUI last-session state but could not remove legacy source ${params.detected.sourcePath}: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	if (importedCount > 0) changes.push(`Migrated ${importedCount} TUI last-session pointer(s) → shared SQLite state`);
	if (discardedHeartbeatCount > 0) changes.push(`Discarded ${discardedHeartbeatCount} legacy heartbeat TUI restore pointer(s)`);
	changes.push("Removed legacy TUI last-session JSON after SQLite verification");
	if (supersededCount > 0) notices.push(`Kept ${supersededCount} newer shared SQLite TUI last-session pointer(s) over legacy JSON`);
	return notices.length > 0 ? {
		changes,
		warnings,
		notices
	} : {
		changes,
		warnings
	};
}
//#endregion
//#region src/infra/state-migrations.update-check.ts
const UPDATE_CHECK_STATE_KEY = "default";
function resolveLegacyUpdateCheckPath(stateDir) {
	return node_path.default.join(stateDir, "update-check.json");
}
function normalizeLegacyUpdateCheckState(input) {
	const record = input && typeof input === "object" ? input : {};
	const readString = (key) => {
		const value = record[key];
		return typeof value === "string" && value.trim().length > 0 ? value : void 0;
	};
	return {
		lastCheckedAt: readString("lastCheckedAt"),
		lastNotifiedVersion: readString("lastNotifiedVersion"),
		lastNotifiedTag: readString("lastNotifiedTag"),
		lastAvailableVersion: readString("lastAvailableVersion"),
		lastAvailableTag: readString("lastAvailableTag"),
		autoInstallId: readString("autoInstallId"),
		autoFirstSeenVersion: readString("autoFirstSeenVersion"),
		autoFirstSeenTag: readString("autoFirstSeenTag"),
		autoFirstSeenAt: readString("autoFirstSeenAt"),
		autoLastAttemptVersion: readString("autoLastAttemptVersion"),
		autoLastAttemptAt: readString("autoLastAttemptAt"),
		autoLastSuccessVersion: readString("autoLastSuccessVersion"),
		autoLastSuccessAt: readString("autoLastSuccessAt")
	};
}
function legacyUpdateCheckStateMatches(row, state) {
	return (state.lastCheckedAt ?? null) === row.last_checked_at && (state.lastNotifiedVersion ?? null) === row.last_notified_version && (state.lastNotifiedTag ?? null) === row.last_notified_tag && (state.lastAvailableVersion ?? null) === row.last_available_version && (state.lastAvailableTag ?? null) === row.last_available_tag && (state.autoInstallId ?? null) === row.auto_install_id && (state.autoFirstSeenVersion ?? null) === row.auto_first_seen_version && (state.autoFirstSeenTag ?? null) === row.auto_first_seen_tag && (state.autoFirstSeenAt ?? null) === row.auto_first_seen_at && (state.autoLastAttemptVersion ?? null) === row.auto_last_attempt_version && (state.autoLastAttemptAt ?? null) === row.auto_last_attempt_at && (state.autoLastSuccessVersion ?? null) === row.auto_last_success_version && (state.autoLastSuccessAt ?? null) === row.auto_last_success_at;
}
function migrateLegacyUpdateCheckState(params) {
	const changes = [];
	const warnings = [];
	let notice;
	if (!fileExists(params.detected.sourcePath)) return {
		changes,
		warnings
	};
	let state;
	try {
		state = normalizeLegacyUpdateCheckState(JSON.parse(node_fs.default.readFileSync(params.detected.sourcePath, "utf8")));
	} catch (err) {
		warnings.push(`Failed reading legacy update-check state ${params.detected.sourcePath}: ${String(err)}`);
		return {
			changes,
			warnings
		};
	}
	let imported = false;
	let shouldArchive = false;
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
			const existing = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("update_check_state").selectAll().where("state_key", "=", UPDATE_CHECK_STATE_KEY));
			if (existing) {
				if (!legacyUpdateCheckStateMatches(existing, state)) notice = `Kept shared SQLite update-check state because legacy cache differs: ${params.detected.sourcePath}`;
				shouldArchive = true;
				return;
			}
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("update_check_state").values({
				state_key: UPDATE_CHECK_STATE_KEY,
				last_checked_at: state.lastCheckedAt ?? null,
				last_notified_version: state.lastNotifiedVersion ?? null,
				last_notified_tag: state.lastNotifiedTag ?? null,
				last_available_version: state.lastAvailableVersion ?? null,
				last_available_tag: state.lastAvailableTag ?? null,
				auto_install_id: state.autoInstallId ?? null,
				auto_first_seen_version: state.autoFirstSeenVersion ?? null,
				auto_first_seen_tag: state.autoFirstSeenTag ?? null,
				auto_first_seen_at: state.autoFirstSeenAt ?? null,
				auto_last_attempt_version: state.autoLastAttemptVersion ?? null,
				auto_last_attempt_at: state.autoLastAttemptAt ?? null,
				auto_last_success_version: state.autoLastSuccessVersion ?? null,
				auto_last_success_at: state.autoLastSuccessAt ?? null,
				updated_at_ms: Date.now()
			}));
			imported = true;
			shouldArchive = true;
		}, { env: {
			...process.env,
			OPERATOR_STATE_DIR: params.stateDir
		} });
	} catch (err) {
		warnings.push(`Failed migrating legacy update-check state: ${String(err)}`);
	}
	if (imported) changes.push("Migrated update-check state → shared SQLite state");
	if (shouldArchive) archiveLegacyImportSource({
		sourcePath: params.detected.sourcePath,
		label: "update-check state",
		changes,
		warnings
	});
	return {
		changes,
		warnings,
		...notice ? { notices: [notice] } : {}
	};
}
//#endregion
//#region src/infra/state-migrations.web-push.ts
const LEGACY_SUBSCRIPTIONS_MAX_BYTES = 4 * 1024 * 1024;
const LEGACY_VAPID_KEYS_MAX_BYTES = 64 * 1024;
const MIGRATION_LOCK_TIMEOUT_MS = 250;
const MIGRATION_LOCK_POLL_INTERVAL_MS = 25;
const DOCTOR_CLAIM_SUFFIX = ".doctor-importing";
const SUBSCRIPTION_STORE_KEYS = /* @__PURE__ */ new Set(["subscriptionsByEndpointHash"]);
const SUBSCRIPTION_KEYS = /* @__PURE__ */ new Set([
	"subscriptionId",
	"endpoint",
	"keys",
	"createdAtMs",
	"updatedAtMs"
]);
const PUSH_KEYS = /* @__PURE__ */ new Set(["p256dh", "auth"]);
const VAPID_KEYS = /* @__PURE__ */ new Set([
	"publicKey",
	"privateKey",
	"subject"
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function resolveLegacyWebPushPaths(stateDir) {
	const pushDir = node_path.default.join(stateDir, "push");
	return {
		subscriptionsPath: node_path.default.join(pushDir, "web-push-subscriptions.json"),
		vapidKeysPath: node_path.default.join(pushDir, "vapid-keys.json")
	};
}
function legacyPathMayExist(filePath) {
	try {
		node_fs.default.lstatSync(filePath);
		return true;
	} catch (error) {
		return error.code !== "ENOENT";
	}
}
function relativeLegacyPath(stateDir, filePath) {
	const relativePath = node_path.default.relative(node_path.default.resolve(stateDir), node_path.default.resolve(filePath));
	if (!relativePath || relativePath === ".." || relativePath.startsWith(`..${node_path.default.sep}`) || node_path.default.isAbsolute(relativePath)) throw new Error(`legacy Web Push path is outside the state directory: ${filePath}`);
	return relativePath;
}
function sourceOrClaimMayExist(sourcePath) {
	return legacyPathMayExist(sourcePath) || legacyPathMayExist(`${sourcePath}${DOCTOR_CLAIM_SUFFIX}`);
}
/** Detect retired Web Push state only when an explicit doctor flow opts in. */
function detectLegacyWebPush(params) {
	const paths = resolveLegacyWebPushPaths(params.stateDir);
	return {
		...paths,
		hasLegacy: params.doctorOnlyStateMigrations === true && (sourceOrClaimMayExist(paths.subscriptionsPath) || sourceOrClaimMayExist(paths.vapidKeysPath))
	};
}
async function readLegacySourceSnapshot(stateRoot, stateDir, sourcePath, maxBytes) {
	const opened = await stateRoot.read(relativeLegacyPath(stateDir, sourcePath), {
		hardlinks: "reject",
		maxBytes,
		symlinks: "reject"
	});
	const raw = opened.buffer.toString("utf8");
	return {
		sourcePath,
		dev: opened.stat.dev,
		ino: opened.stat.ino,
		mtimeMs: opened.stat.mtimeMs,
		raw,
		sha256: (0, node_crypto.createHash)("sha256").update(raw).digest("hex"),
		size: opened.stat.size
	};
}
function sourceSnapshotsMatch(left, right) {
	return left.dev === right.dev && left.ino === right.ino && left.mtimeMs === right.mtimeMs && left.sha256 === right.sha256 && left.size === right.size;
}
function contentSnapshotsMatch(left, right) {
	return left.sha256 === right.sha256 && left.size === right.size;
}
function maxBytesForSource(sourcePath, subscriptionsPath) {
	return sourcePath === subscriptionsPath ? LEGACY_SUBSCRIPTIONS_MAX_BYTES : LEGACY_VAPID_KEYS_MAX_BYTES;
}
async function recoverInterruptedClaim(stateRoot, stateDir, sourcePath, maxBytes) {
	const claimPath = `${sourcePath}${DOCTOR_CLAIM_SUFFIX}`;
	const claimRelativePath = relativeLegacyPath(stateDir, claimPath);
	const sourceRelativePath = relativeLegacyPath(stateDir, sourcePath);
	if (!await stateRoot.exists(claimRelativePath)) return;
	const claim = await readLegacySourceSnapshot(stateRoot, stateDir, claimPath, maxBytes);
	if (!await stateRoot.exists(sourceRelativePath)) {
		await stateRoot.move(claimRelativePath, sourceRelativePath);
		return;
	}
	if (!contentSnapshotsMatch(claim, await readLegacySourceSnapshot(stateRoot, stateDir, sourcePath, maxBytes))) throw new Error("interrupted Web Push doctor claim conflicts with its source");
	await stateRoot.remove(claimRelativePath);
}
function assertOnlyKeys(value, allowed, label) {
	const unexpected = Object.keys(value).find((key) => !allowed.has(key));
	if (unexpected) throw new Error(`${label} has unexpected field ${unexpected}`);
}
function parseLegacySubscriptions(raw) {
	const parsed = JSON.parse(raw);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.subscriptionsByEndpointHash)) throw new Error("legacy Web Push subscriptions must be an object");
	assertOnlyKeys(parsed, SUBSCRIPTION_STORE_KEYS, "legacy Web Push subscriptions store");
	const subscriptions = /* @__PURE__ */ new Map();
	const subscriptionIds = /* @__PURE__ */ new Set();
	for (const [endpointHash, rawSubscription] of Object.entries(parsed.subscriptionsByEndpointHash)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawSubscription) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawSubscription.keys)) throw new Error("legacy Web Push subscription is not an object");
		assertOnlyKeys(rawSubscription, SUBSCRIPTION_KEYS, "legacy Web Push subscription");
		assertOnlyKeys(rawSubscription.keys, PUSH_KEYS, "legacy Web Push subscription keys");
		const { subscriptionId, endpoint, createdAtMs, updatedAtMs } = rawSubscription;
		const p256dh = rawSubscription.keys.p256dh;
		const auth = rawSubscription.keys.auth;
		if (typeof subscriptionId !== "string" || !UUID_RE.test(subscriptionId) || typeof endpoint !== "string" || !require_push_web_store.isValidWebPushEndpoint(endpoint) || require_push_web_store.hashWebPushEndpoint(endpoint) !== endpointHash || !require_push_web_store.isValidWebPushKey(p256dh) || !require_push_web_store.isValidWebPushKey(auth) || typeof createdAtMs !== "number" || !Number.isSafeInteger(createdAtMs) || createdAtMs < 0 || typeof updatedAtMs !== "number" || !Number.isSafeInteger(updatedAtMs) || updatedAtMs < createdAtMs) throw new Error("legacy Web Push subscription is invalid");
		if (subscriptionIds.has(subscriptionId)) throw new Error("legacy Web Push subscriptions contain a duplicate subscription id");
		subscriptionIds.add(subscriptionId);
		subscriptions.set(endpointHash, {
			subscriptionId,
			endpoint,
			keys: {
				p256dh,
				auth
			},
			createdAtMs,
			updatedAtMs
		});
	}
	return subscriptions;
}
function parseLegacyVapidKeys(raw) {
	const parsed = JSON.parse(raw);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed)) throw new Error("legacy Web Push VAPID keys must be an object");
	assertOnlyKeys(parsed, VAPID_KEYS, "legacy Web Push VAPID keys");
	const subject = parsed.subject === void 0 || parsed.subject === "" ? process.env.OPERATOR_VAPID_SUBJECT || "https://operator.ai" : parsed.subject;
	if (!require_push_web_store.isValidWebPushKey(parsed.publicKey) || !require_push_web_store.isValidWebPushKey(parsed.privateKey) || typeof subject !== "string" || subject.length > 512) throw new Error("legacy Web Push VAPID keys are invalid");
	return require_push_web_store.createWebPushVapidKeyPair(parsed.publicKey, parsed.privateKey, subject);
}
async function readLegacyState(stateRoot, stateDir, detected) {
	await recoverInterruptedClaim(stateRoot, stateDir, detected.subscriptionsPath, LEGACY_SUBSCRIPTIONS_MAX_BYTES);
	await recoverInterruptedClaim(stateRoot, stateDir, detected.vapidKeysPath, LEGACY_VAPID_KEYS_MAX_BYTES);
	const snapshots = [];
	let subscriptions = /* @__PURE__ */ new Map();
	let vapidKeys = null;
	if (await stateRoot.exists(relativeLegacyPath(stateDir, detected.subscriptionsPath))) {
		const snapshot = await readLegacySourceSnapshot(stateRoot, stateDir, detected.subscriptionsPath, LEGACY_SUBSCRIPTIONS_MAX_BYTES);
		subscriptions = parseLegacySubscriptions(snapshot.raw);
		snapshots.push(snapshot);
	}
	if (await stateRoot.exists(relativeLegacyPath(stateDir, detected.vapidKeysPath))) {
		const snapshot = await readLegacySourceSnapshot(stateRoot, stateDir, detected.vapidKeysPath, LEGACY_VAPID_KEYS_MAX_BYTES);
		vapidKeys = parseLegacyVapidKeys(snapshot.raw);
		snapshots.push(snapshot);
	}
	return {
		subscriptions,
		vapidKeys,
		snapshots
	};
}
async function assertSourcesUnchanged(stateRoot, stateDir, snapshots, subscriptionsPath) {
	for (const snapshot of snapshots) if (!sourceSnapshotsMatch(await readLegacySourceSnapshot(stateRoot, stateDir, snapshot.sourcePath, maxBytesForSource(snapshot.sourcePath, subscriptionsPath)), snapshot)) throw new Error("legacy Web Push source changed after doctor loaded it");
}
function mergedSubscription(params) {
	const { existing, legacy } = params;
	const createdAtMs = Math.min(existing.createdAtMs, legacy.createdAtMs);
	if (existing.updatedAtMs === legacy.updatedAtMs) {
		const normalizedExisting = {
			...existing,
			createdAtMs
		};
		if (!require_push_web_store.webPushSubscriptionsEqual(normalizedExisting, {
			...legacy,
			createdAtMs
		})) throw new Error("Web Push subscription diverges at the same timestamp");
		return normalizedExisting;
	}
	return {
		...existing.updatedAtMs > legacy.updatedAtMs ? existing : legacy,
		createdAtMs
	};
}
function findSubscriptionById(db, subscriptionId) {
	return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).selectFrom("web_push_subscriptions").selectAll().where("subscription_id", "=", subscriptionId));
}
function writeSubscription(db, endpointHash, subscription) {
	const row = require_push_web_store.webPushSubscriptionToRow({
		endpointHash,
		subscription
	});
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).insertInto("web_push_subscriptions").values(row).onConflict((conflict) => conflict.column("endpoint_hash").doUpdateSet({
		subscription_id: row.subscription_id,
		endpoint: row.endpoint,
		p256dh: row.p256dh,
		auth: row.auth,
		created_at_ms: row.created_at_ms,
		updated_at_ms: row.updated_at_ms
	})));
}
function migrateIntoDatabase(params) {
	let importedSubscriptions = 0;
	let importedVapidKeys = false;
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const webPushDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const expectedSubscriptions = /* @__PURE__ */ new Map();
		for (const [endpointHash, legacySubscription] of params.legacy.subscriptions) {
			const existingRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, webPushDb.selectFrom("web_push_subscriptions").selectAll().where("endpoint_hash", "=", endpointHash));
			if (existingRow && existingRow.endpoint !== legacySubscription.endpoint) throw new Error("Web Push endpoint hash collision during legacy import");
			const existing = existingRow ? require_push_web_store.webPushSubscriptionFromRow(existingRow) : null;
			const expected = existing ? mergedSubscription({
				existing,
				legacy: legacySubscription
			}) : legacySubscription;
			const conflictingIdRow = findSubscriptionById(db, expected.subscriptionId);
			if (conflictingIdRow && conflictingIdRow.endpoint_hash !== endpointHash) throw new Error("Web Push subscription id conflicts with another endpoint");
			if (!existing || !require_push_web_store.webPushSubscriptionsEqual(existing, expected)) {
				writeSubscription(db, endpointHash, expected);
				importedSubscriptions += 1;
			}
			expectedSubscriptions.set(endpointHash, expected);
		}
		let expectedVapidKeys = null;
		if (params.legacy.vapidKeys) {
			const existingVapidRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, webPushDb.selectFrom("web_push_vapid_keys").selectAll().where("key_id", "=", require_push_web_store.WEB_PUSH_VAPID_KEY_ID));
			if (existingVapidRow) {
				if (existingVapidRow.public_key !== params.legacy.vapidKeys.publicKey || existingVapidRow.private_key !== params.legacy.vapidKeys.privateKey) throw new Error("legacy Web Push VAPID identity conflicts with SQLite");
				expectedVapidKeys = require_push_web_store.createWebPushVapidKeyPair(existingVapidRow.public_key, existingVapidRow.private_key, existingVapidRow.subject);
			} else {
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, webPushDb.insertInto("web_push_vapid_keys").values(require_push_web_store.webPushVapidKeyPairToRow({
					keyPair: params.legacy.vapidKeys,
					nowMs: params.nowMs
				})));
				expectedVapidKeys = params.legacy.vapidKeys;
				importedVapidKeys = true;
			}
		}
		for (const [endpointHash, expected] of expectedSubscriptions) {
			const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, webPushDb.selectFrom("web_push_subscriptions").selectAll().where("endpoint_hash", "=", endpointHash));
			if (!row || !require_push_web_store.webPushSubscriptionsEqual(require_push_web_store.webPushSubscriptionFromRow(row), expected)) throw new Error("SQLite verification failed for a Web Push subscription");
		}
		if (expectedVapidKeys) {
			const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, webPushDb.selectFrom("web_push_vapid_keys").selectAll().where("key_id", "=", require_push_web_store.WEB_PUSH_VAPID_KEY_ID));
			if (!row || row.public_key !== expectedVapidKeys.publicKey || row.private_key !== expectedVapidKeys.privateKey || row.subject !== expectedVapidKeys.subject) throw new Error("SQLite verification failed for the Web Push VAPID identity");
		}
	}, { env: {
		...process.env,
		OPERATOR_STATE_DIR: params.stateDir
	} });
	return {
		importedSubscriptions,
		importedVapidKeys
	};
}
async function restoreClaims(params) {
	const errors = [];
	for (const snapshot of params.claimed.toReversed()) {
		const claimPath = `${snapshot.sourcePath}${DOCTOR_CLAIM_SUFFIX}`;
		const claimRelativePath = relativeLegacyPath(params.stateDir, claimPath);
		const sourceRelativePath = relativeLegacyPath(params.stateDir, snapshot.sourcePath);
		try {
			if (!await params.stateRoot.exists(claimRelativePath)) continue;
			if (await params.stateRoot.exists(sourceRelativePath)) {
				errors.push(`source path already exists: ${snapshot.sourcePath}`);
				continue;
			}
			await params.stateRoot.move(claimRelativePath, sourceRelativePath);
		} catch (error) {
			errors.push(String(error));
		}
	}
	return errors;
}
async function claimLegacySources(params) {
	params.beforeClaim?.();
	const claimed = [];
	try {
		for (const snapshot of params.snapshots) {
			const claimPath = `${snapshot.sourcePath}${DOCTOR_CLAIM_SUFFIX}`;
			await params.stateRoot.move(relativeLegacyPath(params.stateDir, snapshot.sourcePath), relativeLegacyPath(params.stateDir, claimPath));
			claimed.push(snapshot);
			if (!sourceSnapshotsMatch(await readLegacySourceSnapshot(params.stateRoot, params.stateDir, claimPath, maxBytesForSource(snapshot.sourcePath, params.subscriptionsPath)), snapshot)) throw new Error("legacy Web Push source changed before doctor could claim it");
		}
	} catch (error) {
		const restoreErrors = await restoreClaims({
			stateRoot: params.stateRoot,
			stateDir: params.stateDir,
			claimed
		});
		throw new Error(`${String(error)}${restoreErrors.length > 0 ? `; restore failures: ${restoreErrors.join("; ")}` : ""}`, { cause: error });
	}
	return claimed;
}
async function removeClaimedSources(params) {
	for (const snapshot of params.claimed) if (await params.stateRoot.exists(relativeLegacyPath(params.stateDir, snapshot.sourcePath))) throw new Error(`legacy Web Push source reappeared during import: ${snapshot.sourcePath}`);
	for (const snapshot of params.claimed) {
		const claimPath = `${snapshot.sourcePath}${DOCTOR_CLAIM_SUFFIX}`;
		if (params.removeSource) await params.removeSource(claimPath);
		else await params.stateRoot.remove(relativeLegacyPath(params.stateDir, claimPath));
	}
}
async function migrateLegacyWebPushWithExclusiveStateOwnership(params) {
	const changes = [];
	const warnings = [];
	const notices = [];
	if (!params.detected.hasLegacy) return {
		changes,
		warnings
	};
	let legacy;
	try {
		legacy = await readLegacyState(params.stateRoot, params.stateDir, params.detected);
	} catch (error) {
		warnings.push(`Failed reading legacy Web Push state: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	let claimed;
	try {
		params.beforeVerify?.();
		await assertSourcesUnchanged(params.stateRoot, params.stateDir, legacy.snapshots, params.detected.subscriptionsPath);
		claimed = await claimLegacySources({
			stateRoot: params.stateRoot,
			stateDir: params.stateDir,
			snapshots: legacy.snapshots,
			subscriptionsPath: params.detected.subscriptionsPath,
			beforeClaim: params.beforeClaim
		});
	} catch (error) {
		warnings.push(`Failed migrating legacy Web Push state: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	let result;
	try {
		result = migrateIntoDatabase({
			stateDir: params.stateDir,
			legacy,
			nowMs: Date.now()
		});
	} catch (error) {
		const restoreErrors = await restoreClaims({
			stateRoot: params.stateRoot,
			stateDir: params.stateDir,
			claimed
		});
		warnings.push(`Failed migrating legacy Web Push state: ${String(error)}${restoreErrors.length > 0 ? `; restore failures: ${restoreErrors.join("; ")}` : ""}`);
		return {
			changes,
			warnings
		};
	}
	try {
		await removeClaimedSources({
			stateRoot: params.stateRoot,
			stateDir: params.stateDir,
			claimed,
			removeSource: params.removeSource
		});
	} catch (error) {
		warnings.push(`Web Push state is in SQLite, but legacy cleanup failed: ${String(error)}`);
		return {
			changes,
			warnings
		};
	}
	changes.push(`Migrated ${result.importedSubscriptions} Web Push subscription${result.importedSubscriptions === 1 ? "" : "s"} to SQLite.`);
	if (result.importedVapidKeys) changes.push("Migrated the Web Push VAPID identity to SQLite.");
	notices.push("Removed retired Web Push JSON state after verified SQLite import.");
	return {
		changes,
		warnings,
		notices
	};
}
/** Import both retired stores while excluding old Gateways that can recreate them. */
async function migrateLegacyWebPush(params) {
	if (!params.detected.hasLegacy) return {
		changes: [],
		warnings: []
	};
	const env = {
		...params.env ?? process.env,
		OPERATOR_STATE_DIR: params.stateDir
	};
	let lock;
	try {
		lock = await require_gateway_lock.acquireGatewayLock({
			allowInTests: true,
			env,
			pollIntervalMs: MIGRATION_LOCK_POLL_INTERVAL_MS,
			role: "sqlite-maintenance",
			timeoutMs: MIGRATION_LOCK_TIMEOUT_MS
		});
	} catch (error) {
		return {
			changes: [],
			warnings: [`Failed migrating legacy Web Push state: ${error instanceof require_gateway_lock.GatewayLockError ? "the Gateway or another SQLite maintenance command owns this state directory" : String(error)}. Stop the Gateway and run \`openclaw doctor --fix\` again.`]
		};
	}
	if (!lock) return {
		changes: [],
		warnings: ["Failed migrating legacy Web Push state: exclusive state ownership unavailable."]
	};
	let result = {
		changes: [],
		warnings: []
	};
	let releaseError;
	try {
		try {
			const stateRoot = await (0, _openclaw_fs_safe.root)(params.stateDir, {
				hardlinks: "reject",
				maxBytes: LEGACY_SUBSCRIPTIONS_MAX_BYTES,
				symlinks: "reject"
			});
			result = await migrateLegacyWebPushWithExclusiveStateOwnership({
				...params,
				stateRoot
			});
		} catch (error) {
			result.warnings.push(`Failed reading legacy Web Push state: ${String(error)}`);
		}
	} finally {
		try {
			await lock.release();
		} catch (error) {
			releaseError = error;
		}
	}
	if (releaseError) result.warnings.push(`Web Push migration lock release failed: ${require_errors.formatErrorMessage(releaseError)}`);
	return result;
}
//#endregion
//#region src/infra/state-migrations.doctor.ts
let autoMigrateChecked = false;
function resetAutoMigrateLegacyStateForTest() {
	autoMigrateChecked = false;
	resetAutoMigrateLegacyTaskStateSidecarsForTest();
	resetLegacySessionSurfacesForTest();
}
async function collectChannelLegacyStateMigrationPlans(params) {
	const plans = [];
	const detectors = require_bundled.listBundledChannelLegacyStateMigrationDetectors({ config: params.cfg });
	for (const detectLegacyStateMigrationsLocal of detectors) {
		const detected = await detectLegacyStateMigrationsLocal({
			cfg: params.cfg,
			env: params.env,
			stateDir: params.stateDir,
			oauthDir: params.oauthDir
		});
		if (detected?.length) for (const detectedPlan of detected) {
			const plan = detectedPlan.kind === "plugin-state-import" && !detectedPlan.stateDir ? {
				...detectedPlan,
				stateDir: params.stateDir
			} : detectedPlan;
			plans.push(plan);
		}
	}
	return plans;
}
async function collectPluginDoctorStateMigrationPlans(params) {
	const plans = [];
	const config = params.pluginDoctorConfig ?? params.cfg;
	for (const entry of require_doctor_contract_registry.listPluginDoctorStateMigrationEntries({
		config,
		env: params.env
	})) {
		let detected;
		try {
			detected = await entry.migration.detectLegacyState({
				config,
				env: params.env,
				stateDir: params.stateDir,
				oauthDir: params.oauthDir,
				context: createPluginDoctorStateMigrationContext(entry.pluginId, params.env)
			});
		} catch (err) {
			params.warnings?.push(`Failed detecting ${entry.migration.label}: ${String(err)}`);
			continue;
		}
		if (detected?.preview.length) plans.push({
			pluginId: entry.pluginId,
			migration: entry.migration,
			preview: detected.preview
		});
	}
	return plans;
}
function createPluginDoctorStateMigrationContext(pluginId, env) {
	return { openPluginStateKeyedStore(options) {
		return require_plugin_state_store.createPluginStateKeyedStore(pluginId, {
			...options,
			env: options.env ?? env
		});
	} };
}
async function detectLegacyStateMigrations(params) {
	const env = params.env ?? process.env;
	const homedir = params.homedir ?? node_os.default.homedir;
	const stateDir = require_paths.resolveStateDir(env, homedir);
	const oauthDir = require_paths.resolveOAuthDir(env, stateDir);
	const crossStateDirImports = params.crossStateDirImports === true;
	const notices = [];
	const detectedExecApprovals = detectLegacyExecApprovalsMigration({
		env,
		homedir,
		stateDir
	});
	const execApprovals = crossStateDirImports ? detectedExecApprovals : {
		...detectedExecApprovals,
		hasLegacy: false
	};
	if (detectedExecApprovals.hasLegacy && !crossStateDirImports) notices.push(`Exec approvals in the default state dir were not imported into OPERATOR_STATE_DIR automatically (${detectedExecApprovals.sourcePath} -> ${detectedExecApprovals.targetPath}); run \`operator doctor --fix\` to import them.`);
	const targetAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(params.cfg));
	const rawMainKey = params.cfg.session?.mainKey;
	const targetMainKey = typeof rawMainKey === "string" && rawMainKey.trim().length > 0 ? rawMainKey.trim() : require_session_key.DEFAULT_MAIN_KEY;
	const targetScope = params.cfg.session?.scope;
	const sessionsLegacyDir = node_path.default.join(stateDir, "sessions");
	const sessionsLegacyStorePath = node_path.default.join(sessionsLegacyDir, "sessions.json");
	const sessionsTargetDir = node_path.default.join(stateDir, "agents", targetAgentId, "sessions");
	const sessionsTargetStorePath = node_path.default.join(sessionsTargetDir, "sessions.json");
	const pluginConfig = params.pluginDoctorConfig ?? params.cfg;
	const pluginSessionStoreAgentIds = params.pluginSessionStoreAgentIds ?? require_doctor_contract_registry.listPluginDoctorSessionStoreAgentIds({
		config: pluginConfig,
		env,
		pluginIds: require_doctor_contract_registry.collectRelevantDoctorPluginIds(pluginConfig)
	});
	const currentSessionStoreOwnership = resolveSessionStoreOwnership({
		cfg: params.cfg,
		env,
		stateDir,
		targetAgentId,
		pluginSessionStoreAgentIds
	});
	const sessionStoreOwnership = {
		preserveAmbiguousKeys: params.sessionStoreOwnership?.preserveAmbiguousKeys === true || currentSessionStoreOwnership.preserveAmbiguousKeys,
		preserveForeignMainAliases: params.sessionStoreOwnership?.preserveForeignMainAliases === true || currentSessionStoreOwnership.preserveForeignMainAliases,
		targetStoreAliases: mergeSessionStoreAliasPlans(params.sessionStoreOwnership?.targetStoreAliases, currentSessionStoreOwnership.targetStoreAliases)
	};
	const { preserveForeignMainAliases } = sessionStoreOwnership;
	const legacySessionEntries = safeReadDir(sessionsLegacyDir);
	const hasLegacySessions = fileExists(sessionsLegacyStorePath) || legacySessionEntries.some((e) => e.isFile() && e.name.endsWith(".jsonl"));
	const targetSessionParsed = fileExists(sessionsTargetStorePath) ? readSessionStoreJson5(sessionsTargetStorePath) : {
		store: {},
		ok: true
	};
	const legacyKeys = targetSessionParsed.ok ? listLegacySessionKeys({
		store: targetSessionParsed.store,
		agentId: targetAgentId,
		mainKey: targetMainKey,
		scope: targetScope,
		preserveAmbiguousKeys: sessionStoreOwnership.preserveAmbiguousKeys,
		preserveForeignMainAliases
	}) : [];
	const hasStaleSessionFiles = targetSessionParsed.ok && Object.values(targetSessionParsed.store).some((entry) => Boolean(resolveStaleLegacySessionFile({
		entry,
		legacyDir: sessionsLegacyDir,
		targetDir: sessionsTargetDir
	})));
	const legacyAgentDir = node_path.default.join(stateDir, "agent");
	const targetAgentDir = node_path.default.join(stateDir, "agents", targetAgentId, "agent");
	const hasLegacyAgentDir = existsDir(legacyAgentDir);
	const pluginStateSidecarPath = resolveLegacyPluginStateSidecarPath(stateDir);
	const hasPluginStateSidecar = fileExists(pluginStateSidecarPath);
	const hasPendingPluginStateSidecarArchive = hasPendingSqliteSidecarArchive(pluginStateSidecarPath, PLUGIN_STATE_SQLITE_SIDECAR_SUFFIXES);
	const pluginInstallIndexPath = require_installed_plugin_index_record_reader.resolveLegacyInstalledPluginIndexStorePath({ stateDir });
	const hasPluginInstallIndex = fileExists(pluginInstallIndexPath);
	const debugProxyCaptureSidecar = detectLegacyDebugProxyCaptureSidecar(stateDir, env);
	const stateSchemaMigrations = require_operator_state_db.detectOperatorStateDatabaseSchemaMigrations({ env: {
		...env,
		OPERATOR_STATE_DIR: stateDir
	} });
	const taskRunsSidecarPath = resolveLegacyTaskRunsSidecarPath(stateDir);
	const flowRunsSidecarPath = resolveLegacyFlowRunsSidecarPath(stateDir);
	const hasPendingTaskRunsSidecarArchive = hasPendingSqliteSidecarArchive(taskRunsSidecarPath, TASK_STATE_SQLITE_SIDECAR_SUFFIXES);
	const hasPendingFlowRunsSidecarArchive = hasPendingSqliteSidecarArchive(flowRunsSidecarPath, TASK_STATE_SQLITE_SIDECAR_SUFFIXES);
	const hasTaskStateSidecars = fileExists(taskRunsSidecarPath) || fileExists(flowRunsSidecarPath) || hasPendingTaskRunsSidecarArchive || hasPendingFlowRunsSidecarArchive;
	const deliveryQueuePaths = {
		outboundPath: resolveLegacyDeliveryQueuePath(stateDir, "delivery-queue"),
		sessionPath: resolveLegacyDeliveryQueuePath(stateDir, "session-delivery-queue")
	};
	const hasDeliveryQueues = listLegacyDeliveryQueueFiles(deliveryQueuePaths.outboundPath).length > 0 || listLegacyDeliveryQueueDeliveredMarkers(deliveryQueuePaths.outboundPath).length > 0 || listLegacyDeliveryQueueFiles(deliveryQueuePaths.sessionPath).length > 0 || listLegacyDeliveryQueueDeliveredMarkers(deliveryQueuePaths.sessionPath).length > 0;
	const voiceWake = {
		triggersPath: resolveLegacyVoiceWakeTriggersPath(stateDir),
		routingPath: resolveLegacyVoiceWakeRoutingPath(stateDir)
	};
	const hasVoiceWake = fileExists(voiceWake.triggersPath) || fileExists(voiceWake.routingPath);
	const updateCheck = { sourcePath: resolveLegacyUpdateCheckPath(stateDir) };
	const hasUpdateCheck = fileExists(updateCheck.sourcePath);
	const configHealth = { sourcePath: resolveLegacyConfigHealthPath(stateDir) };
	const hasConfigHealth = fileExists(configHealth.sourcePath);
	const pluginBindingApprovals = { sourcePath: resolveLegacyPluginBindingApprovalsPath(env, homedir) };
	const pluginBindingApprovalsCrossDir = node_path.default.resolve(node_path.default.dirname(pluginBindingApprovals.sourcePath)) !== node_path.default.resolve(stateDir);
	const hasPluginBindingApprovals = !require_paths.isNamedProfile(env) && fileExists(pluginBindingApprovals.sourcePath) && (crossStateDirImports || !pluginBindingApprovalsCrossDir);
	if (!require_paths.isNamedProfile(env) && fileExists(pluginBindingApprovals.sourcePath) && pluginBindingApprovalsCrossDir && !crossStateDirImports) notices.push(`Plugin binding approvals in the default state dir were not imported into OPERATOR_STATE_DIR automatically (${pluginBindingApprovals.sourcePath}); run \`operator doctor --fix\` to import them.`);
	const currentConversationBindings = { sourcePath: resolveLegacyCurrentConversationBindingsPath(stateDir) };
	const hasCurrentConversationBindings = fileExists(currentConversationBindings.sourcePath);
	const tuiLastSessions = detectLegacyTuiLastSessions({
		stateDir,
		doctorOnlyStateMigrations: params.doctorOnlyStateMigrations
	});
	const commitments = detectLegacyCommitments({
		stateDir,
		doctorOnlyStateMigrations: params.doctorOnlyStateMigrations
	});
	const managedOutgoingImages = detectLegacyManagedOutgoingImages({
		stateDir,
		doctorOnlyStateMigrations: params.doctorOnlyStateMigrations
	});
	const apns = detectLegacyApnsRegistrations({
		stateDir,
		doctorOnlyStateMigrations: params.doctorOnlyStateMigrations
	});
	const webPush = detectLegacyWebPush({
		stateDir,
		doctorOnlyStateMigrations: params.doctorOnlyStateMigrations
	});
	const nodeHost = detectLegacyNodeHostConfig({
		stateDir,
		doctorOnlyStateMigrations: params.doctorOnlyStateMigrations
	});
	const subagentRegistry = detectLegacySubagentRegistry({
		stateDir,
		doctorOnlyStateMigrations: params.doctorOnlyStateMigrations
	});
	const rescuePending = detectLegacyRescuePending({
		stateDir,
		doctorOnlyStateMigrations: params.doctorOnlyStateMigrations
	});
	const configuredChannels = Object.entries(params.cfg.channels ?? {});
	const configuredAccountIds = Object.fromEntries(configuredChannels.map(([channelId, value]) => {
		const channelConfig = value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
		const accountIds = [
			...require_registry.getChannelPlugin(channelId)?.config.listAccountIds(params.cfg) ?? [],
			...channelConfig?.accounts && typeof channelConfig.accounts === "object" && !Array.isArray(channelConfig.accounts) ? Object.keys(channelConfig.accounts) : [],
			...typeof channelConfig?.defaultAccount === "string" ? [channelConfig.defaultAccount] : [],
			...(params.cfg.bindings ?? []).flatMap((binding) => binding.match?.channel === channelId && typeof binding.match.accountId === "string" ? [binding.match.accountId] : [])
		];
		return [channelId, Array.from(new Set(accountIds.map((entry) => entry.trim()).filter(Boolean)))];
	}));
	const channelPairing = detectLegacyChannelPairingState({
		sourceDir: oauthDir,
		configuredChannelIds: configuredChannels.map(([channelId]) => channelId),
		configuredDefaultAccountIds: Object.fromEntries(configuredChannels.flatMap(([channelId, value]) => {
			const boundAccountId = params.cfg.bindings?.find((binding) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(binding.agentId) === targetAgentId && binding.match?.channel === channelId && typeof binding.match.accountId === "string")?.match.accountId;
			if (typeof boundAccountId === "string" && boundAccountId.trim()) return [[channelId, boundAccountId.trim()]];
			const defaultAccount = value && typeof value === "object" && !Array.isArray(value) ? value.defaultAccount : void 0;
			if (typeof defaultAccount === "string" && defaultAccount.trim()) return [[channelId, defaultAccount.trim()]];
			const plugin = require_registry.getChannelPlugin(channelId);
			if (plugin) return [[channelId, require_helpers.resolveChannelDefaultAccountId({
				plugin,
				cfg: params.cfg
			})]];
			return [[channelId, configuredAccountIds[channelId]?.toSorted()[0] ?? "default"]];
		})),
		configuredAccountIds
	});
	const channelPlans = await collectChannelLegacyStateMigrationPlans({
		cfg: params.cfg,
		env,
		stateDir,
		oauthDir
	});
	const pluginPlanWarnings = [];
	const pluginPlans = stateSchemaMigrations.length > 0 ? [] : await collectPluginDoctorStateMigrationPlans({
		cfg: params.cfg,
		pluginDoctorConfig: params.pluginDoctorConfig,
		env,
		stateDir,
		oauthDir,
		warnings: pluginPlanWarnings
	});
	const preview = [];
	if (hasLegacySessions) preview.push(`- Sessions: ${sessionsLegacyDir} → ${sessionsTargetDir}`);
	if (legacyKeys.length > 0) preview.push(`- Sessions: canonicalize legacy keys in ${sessionsTargetStorePath}`);
	if (hasStaleSessionFiles) preview.push(`- Sessions: repair migrated transcript paths in ${sessionsTargetStorePath}`);
	if (hasLegacyAgentDir) preview.push(`- Agent dir: ${legacyAgentDir} → ${targetAgentDir}`);
	if (hasPluginStateSidecar) preview.push(`- Plugin state sidecar: ${pluginStateSidecarPath} → shared SQLite state`);
	else if (hasPendingPluginStateSidecarArchive) preview.push(`- Plugin state sidecar: finish archive cleanup for ${pluginStateSidecarPath}`);
	if (hasPluginInstallIndex) preview.push(`- Plugin install index: ${pluginInstallIndexPath} → shared SQLite state`);
	if (debugProxyCaptureSidecar.hasLegacy) preview.push(`- Debug proxy capture sidecar: ${debugProxyCaptureSidecar.sourcePath} → shared SQLite state`);
	if (stateSchemaMigrations.length > 0) {
		for (const migration of stateSchemaMigrations) preview.push(migration.kind === "agent-databases-composite-primary-key" ? "- Shared SQLite schema: agent database registry primary key → agent_id,path" : "- Shared SQLite schema: audit event ledger → versioned message lifecycle schema");
		preview.push("- Rerun doctor after shared SQLite schema repair to detect plugin state migrations");
	}
	if (fileExists(taskRunsSidecarPath)) preview.push(`- Task registry sidecar: ${taskRunsSidecarPath} → shared SQLite state`);
	else if (hasPendingTaskRunsSidecarArchive) preview.push(`- Task registry sidecar: finish archive cleanup for ${taskRunsSidecarPath}`);
	if (fileExists(flowRunsSidecarPath)) preview.push(`- Task flow sidecar: ${flowRunsSidecarPath} → shared SQLite state`);
	else if (hasPendingFlowRunsSidecarArchive) preview.push(`- Task flow sidecar: finish archive cleanup for ${flowRunsSidecarPath}`);
	if (hasDeliveryQueues) preview.push("- Delivery queues: legacy JSON queue files → shared SQLite state");
	if (hasVoiceWake) preview.push("- Voice Wake settings: legacy JSON files → shared SQLite state");
	if (hasUpdateCheck) preview.push("- Update-check state: legacy JSON file → shared SQLite state");
	if (hasConfigHealth) preview.push("- Config health state: legacy JSON file → shared SQLite state");
	if (hasPluginBindingApprovals) preview.push("- Plugin binding approvals: legacy JSON file → shared SQLite state");
	if (hasCurrentConversationBindings) preview.push("- Current-conversation bindings: legacy JSON file → shared SQLite state");
	if (tuiLastSessions.hasLegacy) preview.push("- TUI last-session pointers: legacy JSON file → shared SQLite state");
	if (commitments.hasLegacy) preview.push("- Commitments: legacy JSON file → shared SQLite state");
	if (managedOutgoingImages.hasLegacy) preview.push("- Managed outgoing images: legacy record JSON → shared SQLite state");
	if (apns.hasLegacy) preview.push("- APNs registrations: legacy JSON → shared SQLite state");
	if (webPush.hasLegacy) preview.push("- Web Push subscriptions and VAPID identity: legacy JSON → shared SQLite state");
	if (nodeHost.hasLegacy) preview.push("- Node-host config: legacy node.json → shared SQLite state");
	if (subagentRegistry.hasLegacy) preview.push("- Subagent runs: discard retired transient subagents/runs.json state");
	if (rescuePending.hasLegacy) preview.push("- System-agent rescue approvals: discard retired pending JSON capabilities");
	if (channelPairing.hasLegacy) preview.push("- Channel pairing state: legacy JSON files → shared SQLite state");
	if (execApprovals.hasLegacy) preview.push(`- Exec approvals: ${execApprovals.sourcePath} → ${execApprovals.targetPath}`);
	if (channelPlans.length > 0) preview.push(...channelPlans.map(buildLegacyMigrationPreview));
	if (pluginPlans.length > 0) preview.push(...pluginPlans.flatMap((plan) => plan.preview));
	return {
		targetAgentId,
		targetMainKey,
		targetScope,
		stateDir,
		oauthDir,
		sessions: {
			legacyDir: sessionsLegacyDir,
			legacyStorePath: sessionsLegacyStorePath,
			targetDir: sessionsTargetDir,
			targetStorePath: sessionsTargetStorePath,
			hasLegacy: hasLegacySessions || legacyKeys.length > 0 || hasStaleSessionFiles,
			legacyKeys,
			preserveAmbiguousKeys: sessionStoreOwnership.preserveAmbiguousKeys,
			preserveForeignMainAliases,
			targetStoreAliases: sessionStoreOwnership.targetStoreAliases
		},
		agentDir: {
			legacyDir: legacyAgentDir,
			targetDir: targetAgentDir,
			hasLegacy: hasLegacyAgentDir
		},
		channelPlans: {
			hasLegacy: channelPlans.length > 0,
			plans: channelPlans
		},
		pluginPlans: {
			hasLegacy: pluginPlans.length > 0,
			plans: pluginPlans
		},
		pluginStateSidecar: {
			sourcePath: pluginStateSidecarPath,
			hasLegacy: hasPluginStateSidecar || hasPendingPluginStateSidecarArchive
		},
		pluginInstallIndex: {
			sourcePath: pluginInstallIndexPath,
			hasLegacy: hasPluginInstallIndex
		},
		debugProxyCaptureSidecar,
		stateSchema: {
			hasLegacy: stateSchemaMigrations.length > 0,
			preview: stateSchemaMigrations.map((migration) => migration.path)
		},
		taskStateSidecars: {
			taskRunsPath: taskRunsSidecarPath,
			flowRunsPath: flowRunsSidecarPath,
			hasLegacy: hasTaskStateSidecars
		},
		deliveryQueues: {
			...deliveryQueuePaths,
			hasLegacy: hasDeliveryQueues
		},
		voiceWake: {
			...voiceWake,
			hasLegacy: hasVoiceWake
		},
		updateCheck: {
			...updateCheck,
			hasLegacy: hasUpdateCheck
		},
		configHealth: {
			...configHealth,
			hasLegacy: hasConfigHealth
		},
		pluginBindingApprovals: {
			...pluginBindingApprovals,
			hasLegacy: hasPluginBindingApprovals
		},
		currentConversationBindings: {
			...currentConversationBindings,
			hasLegacy: hasCurrentConversationBindings
		},
		tuiLastSessions,
		commitments,
		managedOutgoingImages,
		apns,
		webPush,
		nodeHost,
		subagentRegistry,
		rescuePending,
		channelPairing,
		execApprovals,
		warnings: pluginPlanWarnings,
		notices,
		preview
	};
}
async function runPluginDoctorStateMigrationPlans(params) {
	const changes = [];
	const warnings = [];
	const notices = [];
	const refreshedPlans = await collectPluginDoctorStateMigrationPlans({
		cfg: params.config,
		env: params.env,
		stateDir: params.detected.stateDir,
		oauthDir: params.detected.oauthDir,
		warnings
	});
	const hasDetectorFailure = warnings.length > 0;
	const plans = refreshedPlans.length > 0 || hasDetectorFailure ? refreshedPlans : params.detected.pluginPlans?.plans ?? [];
	for (const plan of plans) try {
		const result = await plan.migration.migrateLegacyState({
			config: params.config,
			env: params.env,
			stateDir: params.detected.stateDir,
			oauthDir: params.detected.oauthDir,
			context: createPluginDoctorStateMigrationContext(plan.pluginId, params.env)
		});
		changes.push(...result.changes);
		warnings.push(...result.warnings);
		notices.push(...result.notices ?? []);
	} catch (err) {
		warnings.push(`Failed migrating ${plan.migration.label}: ${String(err)}`);
	}
	return notices.length > 0 ? {
		changes,
		warnings,
		notices
	} : {
		changes,
		warnings
	};
}
async function autoMigrateLegacyPluginDoctorState(params) {
	const env = params.env ?? process.env;
	const stateDirResult = await autoMigrateLegacyStateDir({
		env,
		homedir: params.homedir,
		log: params.log
	});
	const stateDir = require_paths.resolveStateDir(env, params.homedir ?? node_os.default.homedir);
	const oauthDir = require_paths.resolveOAuthDir(env, stateDir);
	const stateSchema = require_operator_state_db.repairOperatorStateDatabaseSchema({ env: {
		...env,
		OPERATOR_STATE_DIR: stateDir
	} });
	const changes = [...stateDirResult.changes, ...stateSchema.changes];
	const warnings = [...stateDirResult.warnings, ...stateSchema.warnings];
	const notices = [...stateDirResult.notices ?? []];
	if (stateSchema.warnings.length > 0) return {
		migrated: stateDirResult.migrated || stateSchema.changes.length > 0,
		skipped: false,
		changes,
		warnings,
		...notices.length > 0 ? { notices } : {}
	};
	const plans = await collectPluginDoctorStateMigrationPlans({
		cfg: params.config,
		env,
		stateDir,
		oauthDir,
		warnings
	});
	for (const plan of plans) try {
		const result = await plan.migration.migrateLegacyState({
			config: params.config,
			env,
			stateDir,
			oauthDir,
			context: createPluginDoctorStateMigrationContext(plan.pluginId, env)
		});
		changes.push(...result.changes);
		warnings.push(...result.warnings);
		notices.push(...result.notices ?? []);
	} catch (err) {
		warnings.push(`Failed migrating ${plan.migration.label}: ${String(err)}`);
	}
	return {
		migrated: stateDirResult.migrated || stateSchema.changes.length > 0 || plans.length > 0,
		skipped: false,
		changes,
		warnings,
		...notices.length > 0 ? { notices } : {}
	};
}
function migrateLegacyStateSchema(detected, env) {
	return require_operator_state_db.repairOperatorStateDatabaseSchema({ env: {
		...env,
		OPERATOR_STATE_DIR: detected.stateDir
	} });
}
async function runLegacyStateMigrations(params) {
	const now = params.now ?? (() => Date.now());
	const detected = params.detected;
	const env = params.env ?? process.env;
	const stateSchema = migrateLegacyStateSchema(detected, env);
	if (detected.stateSchema.hasLegacy && stateSchema.warnings.length > 0) return stateSchema;
	const pluginStateSidecar = await migrateLegacyPluginStateSidecar({ stateDir: detected.stateDir });
	const pluginInstallIndex = await migrateLegacyInstalledPluginIndex({ stateDir: detected.stateDir });
	const debugProxyCaptureSidecar = migrateLegacyDebugProxyCaptureSidecar({
		stateDir: detected.stateDir,
		detected: detected.debugProxyCaptureSidecar
	});
	const taskStateSidecars = await migrateLegacyTaskStateSidecars({ stateDir: detected.stateDir });
	const deliveryQueues = await migrateLegacyDeliveryQueues({ stateDir: detected.stateDir });
	const voiceWake = migrateLegacyVoiceWakeSettings({
		detected: detected.voiceWake,
		stateDir: detected.stateDir
	});
	const updateCheck = migrateLegacyUpdateCheckState({
		detected: detected.updateCheck,
		stateDir: detected.stateDir
	});
	const configHealth = migrateLegacyConfigHealth({
		detected: detected.configHealth,
		stateDir: detected.stateDir
	});
	const pluginBindingApprovals = migrateLegacyPluginBindingApprovals({
		detected: detected.pluginBindingApprovals,
		stateDir: detected.stateDir
	});
	const currentConversationBindings = migrateLegacyCurrentConversationBindings({
		detected: detected.currentConversationBindings,
		stateDir: detected.stateDir
	});
	const tuiLastSessions = migrateLegacyTuiLastSessions({
		detected: detected.tuiLastSessions,
		stateDir: detected.stateDir
	});
	const commitments = migrateLegacyCommitments({
		detected: detected.commitments,
		stateDir: detected.stateDir
	});
	const managedOutgoingImages = migrateLegacyManagedOutgoingImages({
		detected: detected.managedOutgoingImages,
		stateDir: detected.stateDir
	});
	const apns = await migrateLegacyApnsRegistrations({
		detected: detected.apns,
		env,
		stateDir: detected.stateDir
	});
	const webPush = await migrateLegacyWebPush({
		detected: detected.webPush,
		env,
		stateDir: detected.stateDir
	});
	const nodeHost = await migrateLegacyNodeHostConfig({
		detected: detected.nodeHost,
		env,
		stateDir: detected.stateDir
	});
	const subagentRegistry = await migrateLegacySubagentRegistry({
		detected: detected.subagentRegistry,
		env,
		stateDir: detected.stateDir
	});
	const rescuePending = discardLegacyRescuePending({
		detected: detected.rescuePending,
		stateDir: detected.stateDir
	});
	const channelPairing = migrateLegacyChannelPairingState({
		detected: detected.channelPairing,
		env: {
			...env,
			OPERATOR_STATE_DIR: detected.stateDir
		}
	});
	const execApprovals = migrateLegacyExecApprovals(detected.execApprovals);
	const preSessionChannelPlans = await runLegacyMigrationPlans(detected.channelPlans.plans.filter((plan) => plan.kind === "plugin-state-import"));
	const pluginPlans = detected.stateSchema.hasLegacy ? {
		changes: [],
		warnings: []
	} : await runPluginDoctorStateMigrationPlans({
		detected,
		config: params.config ?? {},
		env
	});
	const sessions = await migrateLegacySessions(detected, now, { recoverCorruptTargetStore: params.recoverCorruptTargetStore });
	const acpSessionMetadata = await migrateLegacyAcpSessionMetadata({
		cfg: params.config ?? {},
		env: {
			...env,
			OPERATOR_STATE_DIR: detected.stateDir
		},
		now
	});
	const agentDir = await migrateLegacyAgentDir(detected, now);
	const channelPlans = await runLegacyMigrationPlans(detected.channelPlans.plans.filter((plan) => plan.kind !== "plugin-state-import"));
	const notices = mergeNotices([
		pluginInstallIndex,
		updateCheck,
		tuiLastSessions,
		commitments,
		managedOutgoingImages,
		apns,
		webPush,
		nodeHost,
		subagentRegistry,
		pluginPlans
	]);
	return {
		changes: [
			...stateSchema.changes,
			...pluginStateSidecar.changes,
			...pluginInstallIndex.changes,
			...debugProxyCaptureSidecar.changes,
			...taskStateSidecars.changes,
			...deliveryQueues.changes,
			...voiceWake.changes,
			...updateCheck.changes,
			...configHealth.changes,
			...pluginBindingApprovals.changes,
			...currentConversationBindings.changes,
			...tuiLastSessions.changes,
			...commitments.changes,
			...managedOutgoingImages.changes,
			...apns.changes,
			...webPush.changes,
			...nodeHost.changes,
			...subagentRegistry.changes,
			...rescuePending.changes,
			...channelPairing.changes,
			...execApprovals.changes,
			...preSessionChannelPlans.changes,
			...pluginPlans.changes,
			...sessions.changes,
			...acpSessionMetadata.changes,
			...agentDir.changes,
			...channelPlans.changes
		],
		warnings: [
			...stateSchema.warnings,
			...detected.warnings,
			...pluginStateSidecar.warnings,
			...pluginInstallIndex.warnings,
			...debugProxyCaptureSidecar.warnings,
			...taskStateSidecars.warnings,
			...deliveryQueues.warnings,
			...voiceWake.warnings,
			...updateCheck.warnings,
			...configHealth.warnings,
			...pluginBindingApprovals.warnings,
			...currentConversationBindings.warnings,
			...tuiLastSessions.warnings,
			...commitments.warnings,
			...managedOutgoingImages.warnings,
			...apns.warnings,
			...webPush.warnings,
			...nodeHost.warnings,
			...subagentRegistry.warnings,
			...rescuePending.warnings,
			...channelPairing.warnings,
			...execApprovals.warnings,
			...preSessionChannelPlans.warnings,
			...pluginPlans.warnings,
			...sessions.warnings,
			...acpSessionMetadata.warnings,
			...agentDir.warnings,
			...channelPlans.warnings
		],
		...notices.length > 0 ? { notices } : {}
	};
}
/**
* Canonicalize orphaned raw session keys in all known agent session stores.
*
* Keys written by resolveSessionKey() used DEFAULT_AGENT_ID="main" regardless
* of the configured default agent; reads always use resolveSessionStoreKey()
* which canonicalizes via canonicalizeMainSessionAlias. This migration renames
* any orphaned raw keys to their canonical form in-place, merging with any
* existing canonical entry by preferring the most recently updated.
*
* Safe to run multiple times (idempotent). See #29683.
*/
async function autoMigrateLegacyState(params) {
	if (autoMigrateChecked) return {
		migrated: false,
		skipped: true,
		changes: [],
		warnings: []
	};
	autoMigrateChecked = true;
	const env = params.env ?? process.env;
	const stateDirResult = await autoMigrateLegacyStateDir({
		env,
		homedir: params.homedir,
		log: params.log
	});
	const stateDir = require_paths.resolveStateDir(env, params.homedir ?? node_os.default.homedir);
	const stateSchema = require_operator_state_db.repairOperatorStateDatabaseSchema({ env: {
		...env,
		OPERATOR_STATE_DIR: stateDir
	} });
	if (stateSchema.warnings.length > 0) return {
		migrated: stateDirResult.migrated || stateSchema.changes.length > 0,
		skipped: false,
		changes: [...stateDirResult.changes, ...stateSchema.changes],
		warnings: [...stateDirResult.warnings, ...stateSchema.warnings],
		...stateDirResult.notices?.length ? { notices: stateDirResult.notices } : {}
	};
	const pluginDoctorConfig = params.pluginDoctorConfig ?? params.cfg;
	const pluginSessionStoreAgentIds = require_doctor_contract_registry.listPluginDoctorSessionStoreAgentIds({
		config: pluginDoctorConfig,
		env,
		pluginIds: require_doctor_contract_registry.collectRelevantDoctorPluginIds(pluginDoctorConfig)
	});
	const sessionStoreOwnership = resolveSessionStoreOwnership({
		cfg: params.cfg,
		env,
		stateDir,
		targetAgentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(params.cfg)),
		pluginSessionStoreAgentIds
	});
	const orphanKeys = await migrateOrphanedSessionKeys({
		cfg: params.cfg,
		env,
		additionalAgentIds: pluginSessionStoreAgentIds
	});
	const acpSessionMetadata = await migrateLegacyAcpSessionMetadata({
		cfg: params.cfg,
		env,
		now: params.now,
		pluginSessionStoreAgentIds
	});
	const logMigrationResults = (changes, warnings, notices) => {
		const logger = params.log ?? require_subsystem.createSubsystemLogger("state-migrations");
		if (changes.length > 0) logger.info(`Auto-migrated legacy state:\n${changes.map((entry) => `- ${entry}`).join("\n")}`);
		if (warnings.length > 0) logger.warn(`Legacy state migration warnings:\n${warnings.map((entry) => `- ${entry}`).join("\n")}`);
		if (notices.length > 0) logger.info(`Legacy state migration notes:\n${notices.map((entry) => `- ${entry}`).join("\n")}`);
	};
	const detected = await detectLegacyStateMigrations({
		cfg: params.cfg,
		pluginDoctorConfig: params.pluginDoctorConfig,
		pluginSessionStoreAgentIds,
		sessionStoreOwnership,
		env,
		homedir: params.homedir,
		crossStateDirImports: params.crossStateDirImports
	});
	if (env.OPERATOR_AGENT_DIR?.trim() || env.PI_CODING_AGENT_DIR?.trim()) {
		const pluginStateSidecar = await migrateLegacyPluginStateSidecar({ stateDir: detected.stateDir });
		const pluginInstallIndex = await migrateLegacyInstalledPluginIndex({ stateDir: detected.stateDir });
		const debugProxyCaptureSidecar = migrateLegacyDebugProxyCaptureSidecar({
			stateDir: detected.stateDir,
			detected: detected.debugProxyCaptureSidecar
		});
		const taskStateSidecars = await migrateLegacyTaskStateSidecars({ stateDir: detected.stateDir });
		const deliveryQueues = await migrateLegacyDeliveryQueues({ stateDir: detected.stateDir });
		const voiceWake = migrateLegacyVoiceWakeSettings({
			detected: detected.voiceWake,
			stateDir: detected.stateDir
		});
		const updateCheck = migrateLegacyUpdateCheckState({
			detected: detected.updateCheck,
			stateDir: detected.stateDir
		});
		const configHealth = migrateLegacyConfigHealth({
			detected: detected.configHealth,
			stateDir: detected.stateDir
		});
		const pluginBindingApprovals = migrateLegacyPluginBindingApprovals({
			detected: detected.pluginBindingApprovals,
			stateDir: detected.stateDir
		});
		const currentConversationBindings = migrateLegacyCurrentConversationBindings({
			detected: detected.currentConversationBindings,
			stateDir: detected.stateDir
		});
		const channelPairing = migrateLegacyChannelPairingState({
			detected: detected.channelPairing,
			env: {
				...env,
				OPERATOR_STATE_DIR: detected.stateDir
			}
		});
		const execApprovals = migrateLegacyExecApprovals(detected.execApprovals);
		const preSessionChannelPlans = await runLegacyMigrationPlans(detected.channelPlans.plans.filter((plan) => plan.kind === "plugin-state-import"));
		const pluginPlans = await runPluginDoctorStateMigrationPlans({
			detected,
			config: params.pluginDoctorConfig ?? params.cfg,
			env
		});
		const changes = [
			...stateDirResult.changes,
			...stateSchema.changes,
			...orphanKeys.changes,
			...acpSessionMetadata.changes,
			...pluginStateSidecar.changes,
			...pluginInstallIndex.changes,
			...debugProxyCaptureSidecar.changes,
			...taskStateSidecars.changes,
			...deliveryQueues.changes,
			...voiceWake.changes,
			...updateCheck.changes,
			...configHealth.changes,
			...pluginBindingApprovals.changes,
			...currentConversationBindings.changes,
			...channelPairing.changes,
			...execApprovals.changes,
			...preSessionChannelPlans.changes,
			...pluginPlans.changes
		];
		const warnings = [
			...stateDirResult.warnings,
			...stateSchema.warnings,
			...detected.warnings,
			...orphanKeys.warnings,
			...acpSessionMetadata.warnings,
			...pluginStateSidecar.warnings,
			...pluginInstallIndex.warnings,
			...debugProxyCaptureSidecar.warnings,
			...taskStateSidecars.warnings,
			...deliveryQueues.warnings,
			...voiceWake.warnings,
			...updateCheck.warnings,
			...configHealth.warnings,
			...pluginBindingApprovals.warnings,
			...currentConversationBindings.warnings,
			...channelPairing.warnings,
			...execApprovals.warnings,
			...preSessionChannelPlans.warnings,
			...pluginPlans.warnings
		];
		const notices = mergeNotices([
			stateDirResult,
			detected,
			pluginInstallIndex,
			updateCheck,
			pluginPlans
		]);
		logMigrationResults(changes, warnings, notices);
		return {
			migrated: stateDirResult.migrated || stateSchema.changes.length > 0 || orphanKeys.changes.length > 0 || acpSessionMetadata.changes.length > 0 || pluginStateSidecar.changes.length > 0 || pluginInstallIndex.changes.length > 0 || debugProxyCaptureSidecar.changes.length > 0 || taskStateSidecars.changes.length > 0 || deliveryQueues.changes.length > 0 || voiceWake.changes.length > 0 || updateCheck.changes.length > 0 || configHealth.changes.length > 0 || pluginBindingApprovals.changes.length > 0 || currentConversationBindings.changes.length > 0 || channelPairing.changes.length > 0 || execApprovals.changes.length > 0 || preSessionChannelPlans.changes.length > 0 || pluginPlans.changes.length > 0,
			skipped: true,
			changes,
			warnings,
			...notices.length > 0 ? { notices } : {}
		};
	}
	if (!detected.sessions.hasLegacy && !detected.agentDir.hasLegacy && !detected.channelPlans.hasLegacy && !detected.pluginPlans?.hasLegacy && !detected.pluginStateSidecar.hasLegacy && !detected.pluginInstallIndex.hasLegacy && !detected.debugProxyCaptureSidecar.hasLegacy && !detected.stateSchema.hasLegacy && !detected.taskStateSidecars.hasLegacy && !detected.deliveryQueues.hasLegacy && !detected.voiceWake.hasLegacy && !detected.updateCheck.hasLegacy && !detected.configHealth.hasLegacy && !detected.pluginBindingApprovals.hasLegacy && !detected.currentConversationBindings.hasLegacy && !detected.channelPairing.hasLegacy && !detected.execApprovals.hasLegacy) {
		const changes = [
			...stateDirResult.changes,
			...stateSchema.changes,
			...orphanKeys.changes,
			...acpSessionMetadata.changes
		];
		const warnings = [
			...stateDirResult.warnings,
			...stateSchema.warnings,
			...detected.warnings,
			...orphanKeys.warnings,
			...acpSessionMetadata.warnings
		];
		const notices = [...stateDirResult.notices ?? [], ...detected.notices];
		logMigrationResults(changes, warnings, notices);
		return {
			migrated: stateDirResult.migrated || stateSchema.changes.length > 0 || orphanKeys.changes.length > 0 || acpSessionMetadata.changes.length > 0,
			skipped: false,
			changes,
			warnings,
			...notices.length > 0 ? { notices } : {}
		};
	}
	const now = params.now ?? (() => Date.now());
	const pluginStateSidecar = await migrateLegacyPluginStateSidecar({ stateDir: detected.stateDir });
	const pluginInstallIndex = await migrateLegacyInstalledPluginIndex({ stateDir: detected.stateDir });
	const debugProxyCaptureSidecar = migrateLegacyDebugProxyCaptureSidecar({
		stateDir: detected.stateDir,
		detected: detected.debugProxyCaptureSidecar
	});
	const taskStateSidecars = await migrateLegacyTaskStateSidecars({ stateDir: detected.stateDir });
	const deliveryQueues = await migrateLegacyDeliveryQueues({ stateDir: detected.stateDir });
	const voiceWake = migrateLegacyVoiceWakeSettings({
		detected: detected.voiceWake,
		stateDir: detected.stateDir
	});
	const updateCheck = migrateLegacyUpdateCheckState({
		detected: detected.updateCheck,
		stateDir: detected.stateDir
	});
	const configHealth = migrateLegacyConfigHealth({
		detected: detected.configHealth,
		stateDir: detected.stateDir
	});
	const pluginBindingApprovals = migrateLegacyPluginBindingApprovals({
		detected: detected.pluginBindingApprovals,
		stateDir: detected.stateDir
	});
	const currentConversationBindings = migrateLegacyCurrentConversationBindings({
		detected: detected.currentConversationBindings,
		stateDir: detected.stateDir
	});
	const channelPairing = migrateLegacyChannelPairingState({
		detected: detected.channelPairing,
		env: {
			...env,
			OPERATOR_STATE_DIR: detected.stateDir
		}
	});
	const execApprovals = migrateLegacyExecApprovals(detected.execApprovals);
	const preSessionChannelPlans = await runLegacyMigrationPlans(detected.channelPlans.plans.filter((plan) => plan.kind === "plugin-state-import"));
	const pluginPlans = await runPluginDoctorStateMigrationPlans({
		detected,
		config: params.pluginDoctorConfig ?? params.cfg,
		env
	});
	const sessions = await migrateLegacySessions(detected, now, { recoverCorruptTargetStore: params.recoverCorruptTargetStore });
	const postSessionAcpMetadata = await migrateLegacyAcpSessionMetadata({
		cfg: params.cfg,
		env,
		now,
		pluginSessionStoreAgentIds
	});
	const agentDir = await migrateLegacyAgentDir(detected, now);
	const channelPlans = await runLegacyMigrationPlans(detected.channelPlans.plans.filter((plan) => plan.kind !== "plugin-state-import"));
	const changes = [
		...stateDirResult.changes,
		...stateSchema.changes,
		...orphanKeys.changes,
		...acpSessionMetadata.changes,
		...pluginStateSidecar.changes,
		...pluginInstallIndex.changes,
		...debugProxyCaptureSidecar.changes,
		...taskStateSidecars.changes,
		...deliveryQueues.changes,
		...voiceWake.changes,
		...updateCheck.changes,
		...configHealth.changes,
		...pluginBindingApprovals.changes,
		...currentConversationBindings.changes,
		...channelPairing.changes,
		...execApprovals.changes,
		...preSessionChannelPlans.changes,
		...pluginPlans.changes,
		...sessions.changes,
		...postSessionAcpMetadata.changes,
		...agentDir.changes,
		...channelPlans.changes
	];
	const warnings = [
		...stateDirResult.warnings,
		...stateSchema.warnings,
		...detected.warnings,
		...orphanKeys.warnings,
		...acpSessionMetadata.warnings,
		...pluginStateSidecar.warnings,
		...pluginInstallIndex.warnings,
		...debugProxyCaptureSidecar.warnings,
		...taskStateSidecars.warnings,
		...deliveryQueues.warnings,
		...voiceWake.warnings,
		...updateCheck.warnings,
		...configHealth.warnings,
		...pluginBindingApprovals.warnings,
		...currentConversationBindings.warnings,
		...channelPairing.warnings,
		...execApprovals.warnings,
		...preSessionChannelPlans.warnings,
		...pluginPlans.warnings,
		...sessions.warnings,
		...postSessionAcpMetadata.warnings,
		...agentDir.warnings,
		...channelPlans.warnings
	];
	const notices = mergeNotices([
		stateDirResult,
		detected,
		pluginInstallIndex,
		updateCheck,
		pluginPlans
	]);
	logMigrationResults(changes, warnings, notices);
	return {
		migrated: changes.length > 0,
		skipped: false,
		changes,
		warnings,
		...notices.length > 0 ? { notices } : {}
	};
}
//#endregion
Object.defineProperty(exports, "autoMigrateLegacyPluginDoctorState", {
	enumerable: true,
	get: function() {
		return autoMigrateLegacyPluginDoctorState;
	}
});
Object.defineProperty(exports, "autoMigrateLegacyState", {
	enumerable: true,
	get: function() {
		return autoMigrateLegacyState;
	}
});
Object.defineProperty(exports, "autoMigrateLegacyStateDir", {
	enumerable: true,
	get: function() {
		return autoMigrateLegacyStateDir;
	}
});
Object.defineProperty(exports, "autoMigrateLegacyTaskStateSidecars", {
	enumerable: true,
	get: function() {
		return autoMigrateLegacyTaskStateSidecars;
	}
});
Object.defineProperty(exports, "detectLegacyStateMigrations", {
	enumerable: true,
	get: function() {
		return detectLegacyStateMigrations;
	}
});
Object.defineProperty(exports, "migrateLegacyAgentDir", {
	enumerable: true,
	get: function() {
		return migrateLegacyAgentDir;
	}
});
Object.defineProperty(exports, "migrateOrphanedSessionKeys", {
	enumerable: true,
	get: function() {
		return migrateOrphanedSessionKeys;
	}
});
Object.defineProperty(exports, "resetAutoMigrateLegacyStateDirForTest", {
	enumerable: true,
	get: function() {
		return resetAutoMigrateLegacyStateDirForTest;
	}
});
Object.defineProperty(exports, "resetAutoMigrateLegacyStateForTest", {
	enumerable: true,
	get: function() {
		return resetAutoMigrateLegacyStateForTest;
	}
});
Object.defineProperty(exports, "resetAutoMigrateLegacyTaskStateSidecarsForTest", {
	enumerable: true,
	get: function() {
		return resetAutoMigrateLegacyTaskStateSidecarsForTest;
	}
});
Object.defineProperty(exports, "runLegacyStateMigrations", {
	enumerable: true,
	get: function() {
		return runLegacyStateMigrations;
	}
});
