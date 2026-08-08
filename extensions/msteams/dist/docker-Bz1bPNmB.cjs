const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_zod_parse = require("./zod-parse-D5uufcMS.cjs");
require("./errors-BqS4bzom.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_openclaw_exec_env = require("./openclaw-exec-env-DZZxmfWy.cjs");
const require_abort_signal = require("./abort-signal-D_evxmM7.cjs");
const require_constants = require("./constants-DD-eOR3_.cjs");
require("./workspace-oX0zfOZq.cjs");
const require_session_write_lock = require("./session-write-lock-BTWJIoPj.cjs");
const require_workspace_mounts = require("./workspace-mounts-CgU9PRS7.cjs");
const require_sanitize_env_vars = require("./sanitize-env-vars-DvSenG8T.cjs");
const require_validate_sandbox_security = require("./validate-sandbox-security-DveazAv6.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let zod = require("zod");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/agents/sandbox/hash.ts
/**
* Sandbox hashing helper.
*
* Produces stable SHA-256 digests for config hashes, labels, and cache keys.
*/
/** Returns a stable SHA-256 hex digest for sandbox config/cache keys. */
function hashTextSha256(value) {
	return node_crypto.default.createHash("sha256").update(value).digest("hex");
}
//#endregion
//#region src/agents/sandbox/config-hash.ts
/**
* Stable sandbox config hashing.
*
* Normalizes hash inputs so container reuse changes only when security, mount, workspace, or image policy changes.
*/
/**
* Stable sandbox config hashing for container reuse decisions.
*
* Undefined values and object key order are normalized so semantically equal
* configs keep the same hash while security epoch changes force recreation.
*/
const SANDBOX_DOCKER_EXPLICIT_ENV_POLICY_EPOCH = "explicit-config-env-v1";
function normalizeForHash(value) {
	if (value === void 0) return;
	if (Array.isArray(value)) return value.map(normalizeForHash).filter((item) => item !== void 0);
	if (value && typeof value === "object") {
		const entries = Object.entries(value).toSorted(([a], [b]) => a.localeCompare(b));
		const normalized = {};
		for (const [key, entryValue] of entries) {
			const next = normalizeForHash(entryValue);
			if (next !== void 0) normalized[key] = next;
		}
		return normalized;
	}
	return value;
}
/** Computes the sandbox container config hash. */
function computeSandboxConfigHash(input) {
	return computeHash(input);
}
/** Computes the browser-enabled sandbox container config hash. */
function computeSandboxBrowserConfigHash(input) {
	return computeHash(input);
}
function computeHash(input) {
	const payload = normalizeForHash(input);
	return hashTextSha256(JSON.stringify(payload));
}
//#endregion
//#region src/agents/sandbox/shared.ts
/**
* Shared sandbox naming and scope helpers.
*
* Produces stable session slugs, workspace directories, and registry scope keys.
*/
/** Converts an arbitrary session key into a bounded filesystem/container-safe slug. */
function slugifySessionKey(value) {
	const trimmed = value.trim() || "session";
	const hash = hashTextSha256(trimmed).slice(0, 8);
	return `${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed).replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "session"}-${hash}`;
}
/** Resolves the per-session sandbox workspace directory under the configured sandbox root. */
function resolveSandboxWorkspaceDir(root, sessionKey) {
	const resolvedRoot = require_home_dir.resolveUserPath(root);
	const slug = slugifySessionKey(sessionKey);
	return node_path.default.join(resolvedRoot, slug);
}
/** Resolves the registry scope key for session-, agent-, or shared-scope sandbox lifetimes. */
function resolveSandboxScopeKey(scope, sessionKey) {
	const trimmed = sessionKey.trim() || "main";
	if (scope === "shared") return "shared";
	if (scope === "session") return trimmed;
	return `agent:${require_session_key.resolveAgentIdFromSessionKey(trimmed)}`;
}
/** Extracts the agent id represented by a sandbox scope key, when one exists. */
function resolveSandboxAgentId(scopeKey) {
	const trimmed = scopeKey.trim();
	if (!trimmed || trimmed === "shared") return;
	const parts = trimmed.split(":").filter(Boolean);
	if (parts[0] === "agent" && parts[1]) return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parts[1]);
	return require_session_key.resolveAgentIdFromSessionKey(trimmed);
}
/** Resolves the host-side workspace paths shared by diagnostics and runtime setup. */
function resolveSandboxWorkspaceLayoutPaths(params) {
	const agentWorkspaceDir = require_home_dir.resolveUserPath(params.workspaceDir?.trim() || require_agent_scope_config.DEFAULT_AGENT_WORKSPACE_DIR);
	const workspaceRoot = require_home_dir.resolveUserPath(params.cfg.workspaceRoot);
	const scopeKey = resolveSandboxScopeKey(params.cfg.scope, params.rawSessionKey);
	const sandboxWorkspaceDir = params.cfg.scope === "shared" ? workspaceRoot : resolveSandboxWorkspaceDir(workspaceRoot, scopeKey);
	const workspaceDir = params.cfg.workspaceAccess === "rw" ? agentWorkspaceDir : sandboxWorkspaceDir;
	const materializedSkillsRoot = resolveSandboxWorkspaceDir(node_path.default.join(require_constants.SANDBOX_STATE_DIR, "skills-workspaces"), scopeKey);
	return {
		agentWorkspaceDir,
		scopeKey,
		sandboxWorkspaceDir,
		skillsWorkspaceDir: params.cfg.workspaceAccess === "rw" ? require_workspace_mounts.resolveMaterializedSandboxSkillsWorkspaceDir(materializedSkillsRoot) : sandboxWorkspaceDir,
		workspaceDir,
		workspaceSource: params.cfg.workspaceAccess === "rw" ? "agent" : "sandbox"
	};
}
//#endregion
//#region src/agents/sandbox/current-config.ts
function formatSandboxRecreateHint(params) {
	if (params.scope === "session") return require_command_format.formatCliCommand(`operator sandbox recreate --session ${params.sessionKey}`);
	if (params.scope === "agent") return require_command_format.formatCliCommand(`operator sandbox recreate --agent ${resolveSandboxAgentId(params.sessionKey) ?? "main"}`);
	return require_command_format.formatCliCommand("operator sandbox recreate --all");
}
function handleHotSandboxConfigMismatch(params) {
	const hint = formatSandboxRecreateHint(params);
	if (params.requireCurrentConfig) throw new Error(`Sandbox config changed for ${params.containerName}; restricted dispatch requires the current container config. Recreate first: ${hint}`);
	require_runtime.defaultRuntime.log(`Sandbox config changed for ${params.containerName} (recently used). Recreate to apply: ${hint}`);
}
//#endregion
//#region src/agents/sandbox/registry.ts
/**
* Persistent sandbox registry storage.
*
* Tracks runtime and browser containers in the shared state DB plus migration support for legacy registries.
*/
const RegistryEntrySchema = zod.z.object({ containerName: zod.z.string() }).passthrough();
const RegistryFileSchema = zod.z.object({ entries: zod.z.array(RegistryEntrySchema) });
function getSandboxRegistryKysely(db) {
	return require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
}
function parseRegistryEntryJson(row) {
	try {
		const parsed = JSON.parse(row.entry_json);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
function optionalPayloadString(value) {
	return typeof value === "string" ? value : "";
}
function rowToContainerEntry(row) {
	if (row.registry_kind !== "container") return null;
	const payload = parseRegistryEntryJson(row);
	if (!payload) return null;
	return normalizeSandboxRegistryEntry({
		...payload,
		containerName: row.container_name,
		sessionKey: row.session_key ?? optionalPayloadString(payload.sessionKey),
		createdAtMs: row.created_at_ms ?? Number(payload.createdAtMs ?? 0),
		lastUsedAtMs: row.last_used_at_ms ?? Number(payload.lastUsedAtMs ?? 0),
		image: row.image ?? optionalPayloadString(payload.image),
		...row.backend_id != null ? { backendId: row.backend_id } : {},
		...row.runtime_label != null ? { runtimeLabel: row.runtime_label } : {},
		...row.config_label_kind != null ? { configLabelKind: row.config_label_kind } : {},
		...row.config_hash != null ? { configHash: row.config_hash } : {}
	});
}
function rowToBrowserEntry(row) {
	if (row.registry_kind !== "browser") return null;
	const payload = parseRegistryEntryJson(row);
	if (!payload) return null;
	return {
		...payload,
		containerName: row.container_name,
		sessionKey: row.session_key ?? optionalPayloadString(payload.sessionKey),
		createdAtMs: row.created_at_ms ?? Number(payload.createdAtMs ?? 0),
		lastUsedAtMs: row.last_used_at_ms ?? Number(payload.lastUsedAtMs ?? 0),
		image: row.image ?? optionalPayloadString(payload.image),
		cdpPort: row.cdp_port ?? Number(payload.cdpPort ?? 0),
		...row.no_vnc_port != null ? { noVncPort: row.no_vnc_port } : {},
		...row.config_hash != null ? { configHash: row.config_hash } : {}
	};
}
function containerEntryToRow(entry, existing) {
	const next = {
		...entry,
		backendId: entry.backendId ?? existing?.backendId,
		runtimeLabel: entry.runtimeLabel ?? existing?.runtimeLabel,
		createdAtMs: existing?.createdAtMs ?? entry.createdAtMs,
		image: existing?.image ?? entry.image,
		configLabelKind: entry.configLabelKind ?? existing?.configLabelKind,
		configHash: entry.configHash ?? existing?.configHash
	};
	return {
		registry_kind: "container",
		container_name: next.containerName,
		session_key: next.sessionKey,
		backend_id: next.backendId ?? null,
		runtime_label: next.runtimeLabel ?? null,
		image: next.image,
		created_at_ms: next.createdAtMs,
		last_used_at_ms: next.lastUsedAtMs,
		config_label_kind: next.configLabelKind ?? null,
		config_hash: next.configHash ?? null,
		cdp_port: null,
		no_vnc_port: null,
		entry_json: JSON.stringify(next),
		updated_at: Date.now()
	};
}
function browserEntryToRow(entry, existing) {
	const next = {
		...entry,
		createdAtMs: existing?.createdAtMs ?? entry.createdAtMs,
		image: existing?.image ?? entry.image,
		configHash: entry.configHash ?? existing?.configHash
	};
	return {
		registry_kind: "browser",
		container_name: next.containerName,
		session_key: next.sessionKey,
		backend_id: null,
		runtime_label: null,
		image: next.image,
		created_at_ms: next.createdAtMs,
		last_used_at_ms: next.lastUsedAtMs,
		config_label_kind: null,
		config_hash: next.configHash ?? null,
		cdp_port: next.cdpPort,
		no_vnc_port: next.noVncPort ?? null,
		entry_json: JSON.stringify(next),
		updated_at: Date.now()
	};
}
function rowToUpdate(row) {
	const { registry_kind: _registryKind, container_name: _containerName, ...update } = row;
	return update;
}
function readRegistryRows(kind) {
	const { db } = require_openclaw_state_db.openOperatorStateDatabase();
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSandboxRegistryKysely(db).selectFrom("sandbox_registry_entries").selectAll().where("registry_kind", "=", kind).orderBy("container_name", "asc")).rows;
}
function readRegistryRow(kind, containerName) {
	const { db } = require_openclaw_state_db.openOperatorStateDatabase();
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSandboxRegistryKysely(db).selectFrom("sandbox_registry_entries").selectAll().where("registry_kind", "=", kind).where("container_name", "=", containerName).limit(1)).rows[0] ?? null;
}
function insertRegistryRowIfMissing(row) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSandboxRegistryKysely(db).insertInto("sandbox_registry_entries").values(row).onConflict((conflict) => conflict.columns(["registry_kind", "container_name"]).doNothing()));
	});
}
function insertRegistryRow(db, row) {
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSandboxRegistryKysely(db).insertInto("sandbox_registry_entries").values(row).onConflict((conflict) => conflict.columns(["registry_kind", "container_name"]).doUpdateSet(rowToUpdate(row))));
}
function readRegistryRowFromDb(db, kind, containerName) {
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSandboxRegistryKysely(db).selectFrom("sandbox_registry_entries").selectAll().where("registry_kind", "=", kind).where("container_name", "=", containerName).limit(1)).rows[0] ?? null;
}
function removeRegistryRow(kind, containerName) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getSandboxRegistryKysely(db).deleteFrom("sandbox_registry_entries").where("registry_kind", "=", kind).where("container_name", "=", containerName));
	});
}
function normalizeSandboxRegistryEntry(entry) {
	return {
		...entry,
		backendId: entry.backendId?.trim() || "docker",
		runtimeLabel: entry.runtimeLabel?.trim() || entry.containerName,
		configLabelKind: entry.configLabelKind?.trim() || "Image"
	};
}
async function withRegistryLock(registryPath, fn) {
	const lock = await require_session_write_lock.acquireSessionWriteLock({
		sessionFile: registryPath,
		allowReentrant: false,
		timeoutMs: 6e4
	});
	try {
		return await fn();
	} finally {
		await lock.release();
	}
}
async function readLegacyRegistryFile(registryPath) {
	try {
		const raw = await node_fs_promises.default.readFile(registryPath, "utf-8");
		return require_zod_parse.safeParseJsonWithSchema(RegistryFileSchema, raw);
	} catch (error) {
		if (error?.code === "ENOENT") return { entries: [] };
		if (error instanceof Error) throw error;
		throw new Error(`Failed to read sandbox registry file: ${registryPath}`, { cause: error });
	}
}
/** Reads all registered sandbox runtime containers from SQLite. */
async function readRegistry() {
	return { entries: readRegistryRows("container").map((row) => rowToContainerEntry(row)).filter((entry) => entry != null).map((entry) => normalizeSandboxRegistryEntry(entry)) };
}
async function readShardedEntriesDetailed(dir) {
	let files;
	try {
		files = await node_fs_promises.default.readdir(dir);
	} catch (error) {
		if (error?.code === "ENOENT") return {
			entries: [],
			validFiles: [],
			invalidFiles: []
		};
		throw error;
	}
	const invalidFiles = [];
	const validFiles = [];
	const entries = await Promise.all(files.filter((name) => name.endsWith(".json")).toSorted().map(async (name) => {
		const filePath = node_path.default.join(dir, name);
		try {
			const raw = await node_fs_promises.default.readFile(filePath, "utf-8");
			const entry = require_zod_parse.safeParseJsonWithSchema(RegistryEntrySchema, raw);
			if (!entry) invalidFiles.push(filePath);
			else validFiles.push(filePath);
			return entry;
		} catch {
			invalidFiles.push(filePath);
			return null;
		}
	}));
	const validEntries = [];
	for (const entry of entries) if (entry) validEntries.push(entry);
	return {
		entries: validEntries.toSorted((left, right) => left.containerName.localeCompare(right.containerName)),
		validFiles: validFiles.toSorted(),
		invalidFiles: invalidFiles.toSorted()
	};
}
async function quarantineLegacyRegistry(registryPath) {
	const quarantinePath = `${registryPath}.invalid-${Date.now()}`;
	await node_fs_promises.default.rename(registryPath, quarantinePath).catch(async (error) => {
		if (error?.code !== "ENOENT") await node_fs_promises.default.rm(registryPath, { force: true });
	});
	return quarantinePath;
}
async function quarantineInvalidShards(dir, invalidFiles) {
	const quarantineDir = `${dir}.invalid-${Date.now()}`;
	await node_fs_promises.default.mkdir(quarantineDir, { recursive: true });
	for (const invalidFile of invalidFiles) await node_fs_promises.default.rename(invalidFile, node_path.default.join(quarantineDir, node_path.default.basename(invalidFile))).catch(async (error) => {
		if (error?.code !== "ENOENT") throw error;
	});
	return quarantineDir;
}
async function removeFiles(files) {
	await Promise.all(files.map((file) => node_fs_promises.default.rm(file, { force: true })));
}
async function migrateMonolithicIfNeeded(target) {
	const { registryPath } = target;
	try {
		await node_fs_promises.default.access(registryPath);
	} catch (error) {
		if (error?.code === "ENOENT") return {
			...target,
			source: "monolithic",
			status: "missing",
			entries: 0
		};
		throw error;
	}
	return await withRegistryLock(registryPath, async () => {
		const registry = await readLegacyRegistryFile(registryPath);
		if (!registry) {
			const quarantinePath = await quarantineLegacyRegistry(registryPath);
			return {
				...target,
				source: "monolithic",
				status: "quarantined-invalid",
				entries: 0,
				quarantinePath
			};
		}
		if (registry.entries.length === 0) {
			await node_fs_promises.default.rm(registryPath, { force: true });
			return {
				...target,
				source: "monolithic",
				status: "removed-empty",
				entries: 0
			};
		}
		for (const entry of registry.entries) writeLegacyEntryIfMissing(target.kind, entry);
		await node_fs_promises.default.rm(registryPath, { force: true });
		return {
			...target,
			source: "monolithic",
			status: "migrated",
			entries: registry.entries.length
		};
	});
}
function writeLegacyEntryIfMissing(kind, entry) {
	if (kind === "containers") {
		insertRegistryRowIfMissing(containerEntryToRow({
			...entry,
			containerName: entry.containerName,
			sessionKey: typeof entry.sessionKey === "string" ? entry.sessionKey : "",
			createdAtMs: typeof entry.createdAtMs === "number" ? entry.createdAtMs : 0,
			lastUsedAtMs: typeof entry.lastUsedAtMs === "number" ? entry.lastUsedAtMs : 0,
			image: typeof entry.image === "string" ? entry.image : ""
		}));
		return true;
	}
	insertRegistryRowIfMissing(browserEntryToRow({
		...entry,
		containerName: entry.containerName,
		sessionKey: typeof entry.sessionKey === "string" ? entry.sessionKey : "",
		createdAtMs: typeof entry.createdAtMs === "number" ? entry.createdAtMs : 0,
		lastUsedAtMs: typeof entry.lastUsedAtMs === "number" ? entry.lastUsedAtMs : 0,
		image: typeof entry.image === "string" ? entry.image : "",
		cdpPort: typeof entry.cdpPort === "number" ? entry.cdpPort : 0
	}));
	return true;
}
async function migrateShardedIfNeeded(target) {
	let dirExists = false;
	try {
		dirExists = (await node_fs_promises.default.stat(target.shardedDir)).isDirectory();
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
	}
	if (!dirExists) return {
		...target,
		source: "sharded",
		status: "missing",
		entries: 0
	};
	const { entries, validFiles, invalidFiles } = await readShardedEntriesDetailed(target.shardedDir);
	if (invalidFiles.length > 0) {
		for (const entry of entries) writeLegacyEntryIfMissing(target.kind, entry);
		await removeFiles(validFiles);
		const quarantinePath = await quarantineInvalidShards(target.shardedDir, invalidFiles);
		await node_fs_promises.default.rm(target.shardedDir, {
			recursive: true,
			force: true
		});
		return {
			...target,
			source: "sharded",
			status: "quarantined-invalid",
			entries: entries.length,
			quarantinePath
		};
	}
	if (entries.length === 0) {
		await node_fs_promises.default.rm(target.shardedDir, {
			recursive: true,
			force: true
		});
		return {
			...target,
			source: "sharded",
			status: "removed-empty",
			entries: 0
		};
	}
	for (const entry of entries) writeLegacyEntryIfMissing(target.kind, entry);
	await node_fs_promises.default.rm(target.shardedDir, {
		recursive: true,
		force: true
	});
	return {
		...target,
		source: "sharded",
		status: "migrated",
		entries: entries.length
	};
}
function combineMigrationResults(target, monolithic, sharded) {
	if (monolithic.status === "quarantined-invalid") return monolithic;
	if (sharded.status === "quarantined-invalid") return sharded;
	const entries = monolithic.entries + sharded.entries;
	if (entries > 0) return {
		...target,
		status: "migrated",
		entries
	};
	if (monolithic.status === "removed-empty" || sharded.status === "removed-empty") return {
		...target,
		status: "removed-empty",
		entries: 0
	};
	return {
		...target,
		status: "missing",
		entries: 0
	};
}
function legacyRegistryTargets() {
	return [{
		kind: "containers",
		registryPath: require_constants.SANDBOX_REGISTRY_PATH,
		shardedDir: require_constants.SANDBOX_CONTAINERS_DIR
	}, {
		kind: "browsers",
		registryPath: require_constants.SANDBOX_BROWSER_REGISTRY_PATH,
		shardedDir: require_constants.SANDBOX_BROWSERS_DIR
	}];
}
/** Inspects old registry files without mutating them. */
async function inspectLegacySandboxRegistryFiles() {
	const inspections = [];
	for (const target of legacyRegistryTargets()) {
		try {
			await node_fs_promises.default.access(target.registryPath);
		} catch (error) {
			if (error?.code === "ENOENT") inspections.push({
				...target,
				source: "monolithic",
				exists: false,
				valid: true,
				entries: 0
			});
			else throw error;
		}
		if (!inspections.some((entry) => entry.kind === target.kind && entry.source === "monolithic")) {
			const registry = await readLegacyRegistryFile(target.registryPath);
			inspections.push({
				...target,
				source: "monolithic",
				exists: true,
				valid: Boolean(registry),
				entries: registry?.entries.length ?? 0
			});
		}
		const sharded = await readShardedEntriesDetailed(target.shardedDir);
		let shardedExists = false;
		try {
			shardedExists = (await node_fs_promises.default.stat(target.shardedDir)).isDirectory();
		} catch (error) {
			if (error?.code !== "ENOENT") throw error;
		}
		inspections.push({
			...target,
			source: "sharded",
			exists: shardedExists,
			valid: sharded.invalidFiles.length === 0,
			entries: sharded.entries.length
		});
	}
	return inspections;
}
/** Migrates old registry files into SQLite when present. */
async function migrateLegacySandboxRegistryFiles() {
	const results = [];
	for (const target of legacyRegistryTargets()) {
		const sharded = await migrateShardedIfNeeded(target);
		const monolithic = await migrateMonolithicIfNeeded(target);
		results.push(combineMigrationResults(target, monolithic, sharded));
	}
	return results;
}
/** Reads one registered sandbox runtime container by container name. */
async function readRegistryEntry(containerName) {
	const row = readRegistryRow("container", containerName);
	const entry = row ? rowToContainerEntry(row) : null;
	return entry ? normalizeSandboxRegistryEntry(entry) : null;
}
/** Creates or updates one sandbox runtime registry entry, preserving immutable creation fields. */
async function updateRegistry(entry) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const existingRow = readRegistryRowFromDb(db, "container", entry.containerName);
		insertRegistryRow(db, containerEntryToRow(entry, existingRow ? rowToContainerEntry(existingRow) : null));
	});
}
/** Removes one sandbox runtime registry entry by container name. */
async function removeRegistryEntry(containerName) {
	removeRegistryRow("container", containerName);
}
/** Reads all registered browser sandbox containers from SQLite. */
async function readBrowserRegistry() {
	return { entries: readRegistryRows("browser").map((row) => rowToBrowserEntry(row)).filter((entry) => entry != null) };
}
/** Creates or updates one browser sandbox registry entry, preserving immutable creation fields. */
async function updateBrowserRegistry(entry) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const existingRow = readRegistryRowFromDb(db, "browser", entry.containerName);
		insertRegistryRow(db, browserEntryToRow(entry, existingRow ? rowToBrowserEntry(existingRow) : null));
	});
}
/** Removes one browser sandbox registry entry by container name. */
async function removeBrowserRegistryEntry(containerName) {
	removeRegistryRow("browser", containerName);
}
//#endregion
//#region src/agents/sandbox/docker.ts
/**
* Low-level Docker command helpers for sandbox runtimes.
*
* Wraps Docker spawn, environment sanitization, container inspection, creation, and exec behavior.
*/
var docker_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildSandboxCreateArgs: () => buildSandboxCreateArgs,
	dockerContainerState: () => dockerContainerState,
	ensureDockerImage: () => ensureDockerImage,
	ensureSandboxContainer: () => ensureSandboxContainer,
	execDocker: () => execDocker,
	execDockerRaw: () => execDockerRaw,
	formatDockerDaemonUnavailableError: () => formatDockerDaemonUnavailableError,
	isDockerDaemonUnavailable: () => isDockerDaemonUnavailable,
	readDockerContainerEnvVar: () => readDockerContainerEnvVar,
	readDockerContainerLabel: () => readDockerContainerLabel,
	readDockerPort: () => readDockerPort,
	resolveDockerEnvPolicyEpoch: () => resolveDockerEnvPolicyEpoch
});
async function execDockerRaw(args, opts) {
	let result;
	try {
		result = await require_exec.spawnCommand(["docker", ...args], {
			cancelSignal: opts?.signal,
			encoding: "buffer",
			input: opts?.input ?? Buffer.alloc(0),
			maxBuffer: require_constants.SANDBOX_COMMAND_MAX_BUFFER_BYTES,
			reject: false,
			stripFinalNewline: false
		});
	} catch (error) {
		if (opts?.signal?.aborted) throw require_abort_signal.createAbortError("Aborted");
		if (error.code === "ENOENT") throw Object.assign(/* @__PURE__ */ new Error("Sandbox mode requires Docker, but the \"docker\" command was not found in PATH. Install Docker (and ensure \"docker\" is available), or set `agents.defaults.sandbox.mode=off` to disable sandboxing."), {
			code: "INVALID_CONFIG",
			cause: error
		});
		throw error;
	}
	if (opts?.signal?.aborted || result.isCanceled) throw require_abort_signal.createAbortError("Aborted");
	if (result.failed && !require_exec.isPlainCommandExitFailure(result)) {
		if (result.code === "ENOENT") throw Object.assign(/* @__PURE__ */ new Error("Sandbox mode requires Docker, but the \"docker\" command was not found in PATH. Install Docker (and ensure \"docker\" is available), or set `agents.defaults.sandbox.mode=off` to disable sandboxing."), {
			code: "INVALID_CONFIG",
			cause: result
		});
		throw (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(result, "Docker command execution failed");
	}
	const stdout = Buffer.from(result.stdout);
	const stderr = Buffer.from(result.stderr);
	const exitCode = result.exitCode ?? (result.failed ? 1 : 0);
	if (exitCode !== 0 && !opts?.allowFailure) {
		const message = stderr.length > 0 ? stderr.toString("utf8").trim() : "";
		throw Object.assign(new Error(message || `docker ${args.join(" ")} failed`), {
			code: exitCode,
			stdout,
			stderr
		});
	}
	return {
		stdout,
		stderr,
		code: exitCode
	};
}
const log = require_subsystem.createSubsystemLogger("docker");
const HOT_CONTAINER_WINDOW_MS = 300 * 1e3;
function envRecordsEqual(left, right) {
	const leftEntries = Object.entries(left).toSorted(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
	const rightEntries = Object.entries(right).toSorted(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
	if (leftEntries.length !== rightEntries.length) return false;
	return leftEntries.every(([key, value], index) => {
		const rightEntry = rightEntries[index];
		return rightEntry?.[0] === key && rightEntry[1] === value;
	});
}
function resolveDockerEnvPolicyEpoch(env) {
	const explicitEnv = env ?? {};
	const previousAllowed = require_sanitize_env_vars.sanitizeEnvVars(explicitEnv).allowed;
	const currentAllowed = require_sanitize_env_vars.sanitizeExplicitSandboxEnvVars(explicitEnv).allowed;
	return envRecordsEqual(previousAllowed, currentAllowed) ? void 0 : SANDBOX_DOCKER_EXPLICIT_ENV_POLICY_EPOCH;
}
async function execDocker(args, opts) {
	const result = await execDockerRaw(args, opts);
	return {
		stdout: result.stdout.toString("utf8"),
		stderr: result.stderr.toString("utf8"),
		code: result.code
	};
}
async function readDockerContainerLabel(containerName, label) {
	const result = await execDocker([
		"inspect",
		"-f",
		`{{ index .Config.Labels "${label}" }}`,
		containerName
	], { allowFailure: true });
	if (result.code !== 0) return null;
	const raw = result.stdout.trim();
	if (!raw || raw === "<no value>") return null;
	return raw;
}
async function readDockerContainerEnvVar(containerName, envVar) {
	const result = await execDocker([
		"inspect",
		"-f",
		"{{range .Config.Env}}{{println .}}{{end}}",
		containerName
	], { allowFailure: true });
	if (result.code !== 0) return null;
	for (const line of result.stdout.split(/\r?\n/)) if (line.startsWith(`${envVar}=`)) return line.slice(envVar.length + 1);
	return null;
}
async function readDockerPort(containerName, port) {
	const result = await execDocker([
		"port",
		containerName,
		`${port}/tcp`
	], { allowFailure: true });
	if (result.code !== 0) return null;
	const match = (result.stdout.trim().split(/\r?\n/)[0] ?? "").match(/:(\d+)\s*$/);
	if (!match) return null;
	const mapped = Number.parseInt(match[1] ?? "", 10);
	return Number.isFinite(mapped) ? mapped : null;
}
const DOCKER_DAEMON_UNAVAILABLE_MARKERS = [
	"cannot connect to the docker daemon",
	"dial unix",
	"docker daemon is not running",
	"connection refused"
];
function isDockerDaemonUnavailable(stderr) {
	return DOCKER_DAEMON_UNAVAILABLE_MARKERS.some((marker) => stderr.toLowerCase().includes(marker));
}
function formatDockerDaemonUnavailableError(stderr) {
	const detail = stderr.trim();
	return [
		"Sandbox mode requires Docker, but the Docker daemon is not available.",
		"Start Docker, or set `agents.defaults.sandbox.mode=off` to disable sandboxing.",
		detail ? `Docker said: ${detail}` : void 0
	].filter((line) => Boolean(line)).join(" ");
}
async function inspectDockerImage(image) {
	const result = await execDocker([
		"image",
		"inspect",
		image
	], { allowFailure: true });
	if (result.code === 0) return "exists";
	const stderr = result.stderr.trim();
	if (stderr.toLowerCase().includes("no such image")) return "missing";
	if (isDockerDaemonUnavailable(stderr)) throw new Error(formatDockerDaemonUnavailableError(stderr));
	throw new Error(`Failed to inspect sandbox image: ${stderr}`);
}
async function ensureDockerImage(image) {
	if (await inspectDockerImage(image) === "exists") return;
	if (image === "operator-sandbox:bookworm-slim") throw new Error(`Sandbox image not found: ${image}. Build it with scripts/sandbox-setup.sh before enabling Docker sandboxing. The default image includes python3 for sandbox write/edit helpers; Operator will not substitute plain debian:bookworm-slim.`);
	throw new Error(`Sandbox image not found: ${image}. Build or pull it first.`);
}
async function dockerContainerState(name) {
	const result = await execDocker([
		"inspect",
		"-f",
		"{{.State.Running}}",
		name
	], { allowFailure: true });
	if (result.code !== 0) return {
		exists: false,
		running: false
	};
	return {
		exists: true,
		running: result.stdout.trim() === "true"
	};
}
function normalizeDockerLimit(value) {
	if (value === void 0 || value === null) return;
	if (typeof value === "number") return Number.isFinite(value) ? String(value) : void 0;
	const trimmed = value.trim();
	return trimmed ? trimmed : void 0;
}
function normalizeFiniteDockerNumber(value, min) {
	return typeof value === "number" && Number.isFinite(value) ? Math.max(min, value) : void 0;
}
function formatUlimitValue(name, value) {
	if (!name.trim()) return null;
	if (typeof value === "number") {
		const normalized = normalizeFiniteDockerNumber(value, 0);
		return normalized === void 0 ? null : `${name}=${normalized}`;
	}
	if (typeof value === "string") {
		const raw = value.trim();
		return raw ? `${name}=${raw}` : null;
	}
	const soft = normalizeFiniteDockerNumber(value.soft, 0);
	const hard = normalizeFiniteDockerNumber(value.hard, 0);
	if (soft === void 0 && hard === void 0) return null;
	if (soft === void 0) return `${name}=${hard}`;
	if (hard === void 0) return `${name}=${soft}`;
	return `${name}=${soft}:${hard}`;
}
function buildSandboxCreateArgs(params) {
	require_validate_sandbox_security.validateSandboxSecurity({
		...params.cfg,
		allowedSourceRoots: params.bindSourceRoots,
		allowSourcesOutsideAllowedRoots: params.allowSourcesOutsideAllowedRoots ?? params.cfg.dangerouslyAllowExternalBindSources === true,
		allowReservedContainerTargets: params.allowReservedContainerTargets ?? params.cfg.dangerouslyAllowReservedContainerTargets === true,
		dangerouslyAllowContainerNamespaceJoin: params.allowContainerNamespaceJoin ?? params.cfg.dangerouslyAllowContainerNamespaceJoin === true
	});
	const createdAtMs = params.createdAtMs ?? Date.now();
	const args = [
		"create",
		"--name",
		params.name
	];
	args.push("--init");
	args.push("--label", "operator.sandbox=1");
	args.push("--label", `operator.sessionKey=${params.scopeKey}`);
	args.push("--label", `operator.createdAtMs=${createdAtMs}`);
	args.push("--label", `operator.mountFormatVersion=3`);
	args.push("--label", `operator.createArgsEpoch=${require_constants.SANDBOX_DOCKER_CREATE_ARGS_EPOCH}`);
	if (params.configHash) args.push("--label", `operator.configHash=${params.configHash}`);
	for (const [key, value] of Object.entries(params.labels ?? {})) if (key && value) args.push("--label", `${key}=${value}`);
	if (params.cfg.readOnlyRoot) args.push("--read-only");
	for (const entry of params.cfg.tmpfs) args.push("--tmpfs", entry);
	if (params.cfg.network) args.push("--network", params.cfg.network);
	if (params.cfg.user) args.push("--user", params.cfg.user);
	const envSanitization = require_sanitize_env_vars.sanitizeExplicitSandboxEnvVars(params.cfg.env ?? {});
	if (envSanitization.blocked.length > 0) log.warn(`Blocked invalid configured sandbox environment variables: ${envSanitization.blocked.join(", ")}`);
	if (envSanitization.warnings.length > 0) log.warn(`Suspicious configured sandbox environment variables: ${envSanitization.warnings.join(", ")}`);
	for (const [key, value] of Object.entries(require_openclaw_exec_env.markOperatorExecEnv(envSanitization.allowed))) args.push("--env", `${key}=${value}`);
	for (const cap of params.cfg.capDrop) args.push("--cap-drop", cap);
	args.push("--security-opt", "no-new-privileges");
	if (params.cfg.seccompProfile) args.push("--security-opt", `seccomp=${params.cfg.seccompProfile}`);
	if (params.cfg.apparmorProfile) args.push("--security-opt", `apparmor=${params.cfg.apparmorProfile}`);
	for (const entry of params.cfg.dns ?? []) if (entry.trim()) args.push("--dns", entry);
	for (const entry of params.cfg.extraHosts ?? []) if (entry.trim()) args.push("--add-host", entry);
	const pidsLimit = normalizeFiniteDockerNumber(params.cfg.pidsLimit, 0);
	if (pidsLimit !== void 0 && pidsLimit > 0) args.push("--pids-limit", String(pidsLimit));
	const memory = normalizeDockerLimit(params.cfg.memory);
	if (memory) args.push("--memory", memory);
	const memorySwap = normalizeDockerLimit(params.cfg.memorySwap);
	if (memorySwap) args.push("--memory-swap", memorySwap);
	const cpus = normalizeFiniteDockerNumber(params.cfg.cpus, 0);
	if (cpus !== void 0 && cpus > 0) args.push("--cpus", String(cpus));
	const gpus = params.cfg.gpus?.trim();
	if (gpus) args.push("--gpus", gpus);
	for (const [name, value] of Object.entries(params.cfg.ulimits ?? {})) {
		const formatted = formatUlimitValue(name, value);
		if (formatted) args.push("--ulimit", formatted);
	}
	if (params.includeBinds !== false && params.cfg.binds?.length) for (const bind of params.cfg.binds) args.push("-v", bind);
	return args;
}
function appendCustomBinds(args, cfg) {
	if (!cfg.binds?.length) return;
	for (const bind of cfg.binds) args.push("-v", bind);
}
async function createSandboxContainer(params) {
	const { name, cfg, workspaceDir, scopeKey } = params;
	await ensureDockerImage(cfg.image);
	const args = buildSandboxCreateArgs({
		name,
		cfg,
		scopeKey,
		configHash: params.configHash,
		includeBinds: false,
		bindSourceRoots: [workspaceDir, params.agentWorkspaceDir]
	});
	args.push("--workdir", cfg.workdir);
	require_workspace_mounts.appendWorkspaceMountArgs({
		args,
		workspaceDir,
		agentWorkspaceDir: params.agentWorkspaceDir,
		skillsWorkspaceDir: params.skillsWorkspaceDir,
		workdir: cfg.workdir,
		workspaceAccess: params.workspaceAccess,
		readOnlyWorkspaceSkillMounts: params.readOnlyWorkspaceSkillMounts,
		includeReadOnlyWorkspaceSkillMounts: false
	});
	appendCustomBinds(args, cfg);
	require_workspace_mounts.appendReadOnlyWorkspaceSkillMountArgs({
		args,
		readOnlyWorkspaceSkillMounts: params.readOnlyWorkspaceSkillMounts
	});
	args.push(cfg.image, "sleep", "infinity");
	await execDocker(args);
	await execDocker(["start", name]);
	if (cfg.setupCommand?.trim()) await execDocker([
		"exec",
		"-i",
		name,
		"/bin/sh",
		"-lc",
		cfg.setupCommand
	]);
}
async function readContainerConfigHash(containerName) {
	return await readDockerContainerLabel(containerName, "operator.configHash");
}
async function ensureSandboxContainer(params) {
	const scopeKey = resolveSandboxScopeKey(params.cfg.scope, params.sessionKey);
	const slug = params.cfg.scope === "shared" ? "shared" : slugifySessionKey(scopeKey);
	const containerName = `${params.cfg.docker.containerPrefix}${slug}`.slice(0, 63);
	const readOnlyWorkspaceSkillMounts = require_workspace_mounts.resolveReadOnlyWorkspaceSkillMounts({
		workspaceDir: params.workspaceDir,
		agentWorkspaceDir: params.agentWorkspaceDir,
		skillsWorkspaceDir: params.skillsWorkspaceDir,
		workdir: params.cfg.docker.workdir,
		workspaceAccess: params.cfg.workspaceAccess
	});
	const expectedHash = computeSandboxConfigHash({
		docker: params.cfg.docker,
		dockerEnvPolicyEpoch: resolveDockerEnvPolicyEpoch(params.cfg.docker.env),
		workspaceAccess: params.cfg.workspaceAccess,
		workspaceDir: params.workspaceDir,
		agentWorkspaceDir: params.agentWorkspaceDir,
		mountFormatVersion: 3,
		createArgsEpoch: require_constants.SANDBOX_DOCKER_CREATE_ARGS_EPOCH,
		readOnlyWorkspaceSkillMounts: require_workspace_mounts.formatReadOnlyWorkspaceSkillMountHashState(readOnlyWorkspaceSkillMounts)
	});
	const now = Date.now();
	const state = await dockerContainerState(containerName);
	let hasContainer = state.exists;
	let running = state.running;
	let currentHash = null;
	let hashMismatch = false;
	let registryEntry;
	if (hasContainer) {
		registryEntry = await readRegistryEntry(containerName) ?? void 0;
		currentHash = await readContainerConfigHash(containerName);
		if (!currentHash) currentHash = registryEntry?.configHash ?? null;
		hashMismatch = !currentHash || currentHash !== expectedHash;
		if (hashMismatch) {
			const lastUsedAtMs = registryEntry?.lastUsedAtMs;
			if (running && (typeof lastUsedAtMs !== "number" || now - lastUsedAtMs < HOT_CONTAINER_WINDOW_MS)) handleHotSandboxConfigMismatch({
				containerName,
				scope: params.cfg.scope,
				sessionKey: scopeKey,
				...params.requireCurrentConfig !== void 0 ? { requireCurrentConfig: params.requireCurrentConfig } : {}
			});
			else {
				await execDocker([
					"rm",
					"-f",
					containerName
				], { allowFailure: true });
				hasContainer = false;
				running = false;
			}
		}
	}
	if (!hasContainer) await createSandboxContainer({
		name: containerName,
		cfg: params.cfg.docker,
		workspaceDir: params.workspaceDir,
		workspaceAccess: params.cfg.workspaceAccess,
		agentWorkspaceDir: params.agentWorkspaceDir,
		skillsWorkspaceDir: params.skillsWorkspaceDir,
		scopeKey,
		configHash: expectedHash,
		readOnlyWorkspaceSkillMounts
	});
	else if (!running) await execDocker(["start", containerName]);
	await updateRegistry({
		containerName,
		backendId: "docker",
		runtimeLabel: containerName,
		sessionKey: scopeKey,
		createdAtMs: now,
		lastUsedAtMs: now,
		image: params.cfg.docker.image,
		configLabelKind: "Image",
		configHash: hashMismatch && running ? currentHash ?? void 0 : expectedHash
	});
	return containerName;
}
//#endregion
Object.defineProperty(exports, "buildSandboxCreateArgs", {
	enumerable: true,
	get: function() {
		return buildSandboxCreateArgs;
	}
});
Object.defineProperty(exports, "computeSandboxBrowserConfigHash", {
	enumerable: true,
	get: function() {
		return computeSandboxBrowserConfigHash;
	}
});
Object.defineProperty(exports, "dockerContainerState", {
	enumerable: true,
	get: function() {
		return dockerContainerState;
	}
});
Object.defineProperty(exports, "docker_exports", {
	enumerable: true,
	get: function() {
		return docker_exports;
	}
});
Object.defineProperty(exports, "ensureSandboxContainer", {
	enumerable: true,
	get: function() {
		return ensureSandboxContainer;
	}
});
Object.defineProperty(exports, "execDocker", {
	enumerable: true,
	get: function() {
		return execDocker;
	}
});
Object.defineProperty(exports, "execDockerRaw", {
	enumerable: true,
	get: function() {
		return execDockerRaw;
	}
});
Object.defineProperty(exports, "formatDockerDaemonUnavailableError", {
	enumerable: true,
	get: function() {
		return formatDockerDaemonUnavailableError;
	}
});
Object.defineProperty(exports, "inspectLegacySandboxRegistryFiles", {
	enumerable: true,
	get: function() {
		return inspectLegacySandboxRegistryFiles;
	}
});
Object.defineProperty(exports, "isDockerDaemonUnavailable", {
	enumerable: true,
	get: function() {
		return isDockerDaemonUnavailable;
	}
});
Object.defineProperty(exports, "migrateLegacySandboxRegistryFiles", {
	enumerable: true,
	get: function() {
		return migrateLegacySandboxRegistryFiles;
	}
});
Object.defineProperty(exports, "readBrowserRegistry", {
	enumerable: true,
	get: function() {
		return readBrowserRegistry;
	}
});
Object.defineProperty(exports, "readDockerContainerEnvVar", {
	enumerable: true,
	get: function() {
		return readDockerContainerEnvVar;
	}
});
Object.defineProperty(exports, "readDockerContainerLabel", {
	enumerable: true,
	get: function() {
		return readDockerContainerLabel;
	}
});
Object.defineProperty(exports, "readDockerPort", {
	enumerable: true,
	get: function() {
		return readDockerPort;
	}
});
Object.defineProperty(exports, "readRegistry", {
	enumerable: true,
	get: function() {
		return readRegistry;
	}
});
Object.defineProperty(exports, "removeBrowserRegistryEntry", {
	enumerable: true,
	get: function() {
		return removeBrowserRegistryEntry;
	}
});
Object.defineProperty(exports, "removeRegistryEntry", {
	enumerable: true,
	get: function() {
		return removeRegistryEntry;
	}
});
Object.defineProperty(exports, "resolveDockerEnvPolicyEpoch", {
	enumerable: true,
	get: function() {
		return resolveDockerEnvPolicyEpoch;
	}
});
Object.defineProperty(exports, "resolveSandboxAgentId", {
	enumerable: true,
	get: function() {
		return resolveSandboxAgentId;
	}
});
Object.defineProperty(exports, "resolveSandboxWorkspaceLayoutPaths", {
	enumerable: true,
	get: function() {
		return resolveSandboxWorkspaceLayoutPaths;
	}
});
Object.defineProperty(exports, "slugifySessionKey", {
	enumerable: true,
	get: function() {
		return slugifySessionKey;
	}
});
Object.defineProperty(exports, "updateBrowserRegistry", {
	enumerable: true,
	get: function() {
		return updateBrowserRegistry;
	}
});
Object.defineProperty(exports, "updateRegistry", {
	enumerable: true,
	get: function() {
		return updateRegistry;
	}
});
