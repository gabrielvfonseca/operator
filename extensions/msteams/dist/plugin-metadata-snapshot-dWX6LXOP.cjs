const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
require("./logger-Bw1L7SVe.cjs");
const require_plugin_metadata_lifecycle = require("./plugin-metadata-lifecycle-L5oN3AE5.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_installed_plugin_index_store = require("./installed-plugin-index-store-vrROJGFd.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let node_async_hooks = require("node:async_hooks");
let node_perf_hooks = require("node:perf_hooks");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/infra/diagnostic-flags.ts
const DIAGNOSTICS_ENV = "OPERATOR_DIAGNOSTICS";
function parseEnvFlags(raw) {
	if (!raw) return {
		flags: [],
		disablesAll: false
	};
	const trimmed = raw.trim();
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
	if (!lowered) return {
		flags: [],
		disablesAll: false
	};
	if ([
		"0",
		"false",
		"off",
		"none"
	].includes(lowered)) return {
		flags: [],
		disablesAll: true
	};
	if ([
		"1",
		"true",
		"all",
		"*"
	].includes(lowered)) return {
		flags: ["*"],
		disablesAll: false
	};
	return {
		flags: trimmed.split(/[,\s]+/).map((value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value)).filter(Boolean),
		disablesAll: false
	};
}
/** Resolves enabled diagnostic flags from config plus `OPERATOR_DIAGNOSTICS` overrides. */
function resolveDiagnosticFlags(cfg, env = process.env) {
	const configFlags = Array.isArray(cfg?.diagnostics?.flags) ? cfg?.diagnostics?.flags : [];
	const envFlags = parseEnvFlags(env[DIAGNOSTICS_ENV]);
	if (envFlags.disablesAll) return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntriesLower)([...configFlags, ...envFlags.flags]);
}
/** Matches one diagnostic flag against exact, wildcard, and namespace-enabled flags. */
function matchesDiagnosticFlag(flag, enabledFlags) {
	const target = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(flag);
	if (!target) return false;
	for (const raw of enabledFlags) {
		const enabled = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
		if (!enabled) continue;
		if (enabled === "*" || enabled === "all") return true;
		if (enabled.endsWith(".*")) {
			const prefix = enabled.slice(0, -2);
			if (target === prefix || target.startsWith(`${prefix}.`)) return true;
		}
		if (enabled.endsWith("*")) {
			const prefix = enabled.slice(0, -1);
			if (target.startsWith(prefix)) return true;
		}
		if (enabled === target) return true;
	}
	return false;
}
/** Returns whether a diagnostic flag is enabled after config/env resolution. */
function isDiagnosticFlagEnabled(flag, cfg, env = process.env) {
	return matchesDiagnosticFlag(flag, resolveDiagnosticFlags(cfg, env));
}
//#endregion
//#region src/infra/diagnostics-timeline.ts
const OPERATOR_DIAGNOSTICS_TIMELINE_SCHEMA_VERSION = "operator.diagnostics.v1";
let warnedAboutTimelineWrite = false;
const createdTimelineDirs = /* @__PURE__ */ new Set();
const activeDiagnosticsTimelineSpan = new node_async_hooks.AsyncLocalStorage();
function resolveDiagnosticsTimelineOptions(options = {}) {
	return {
		env: options.env ?? process.env,
		...options.config ? { config: options.config } : {}
	};
}
/** Returns true when diagnostics flags and a JSONL output path both allow timeline writes. */
function isDiagnosticsTimelineEnabled(options = {}) {
	const { config, env } = resolveDiagnosticsTimelineOptions(options);
	return (isDiagnosticFlagEnabled("timeline", config, env) || isDiagnosticFlagEnabled("diagnostics.timeline", config, env) || require_env.isTruthyEnvValue(env.OPERATOR_DIAGNOSTICS)) && typeof env.OPERATOR_DIAGNOSTICS_TIMELINE_PATH === "string" && env.OPERATOR_DIAGNOSTICS_TIMELINE_PATH.trim().length > 0;
}
function normalizeNumber(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) return;
	return Math.max(0, Math.round(value * 1e3) / 1e3);
}
function normalizeAttributes(attributes) {
	if (!attributes) return;
	const normalized = {};
	for (const [key, value] of Object.entries(attributes)) {
		if (typeof value === "number") {
			if (Number.isFinite(value)) normalized[key] = normalizeNumber(value) ?? 0;
			continue;
		}
		if (typeof value === "string" || typeof value === "boolean" || value === null) normalized[key] = value;
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function serializeTimelineEvent(event, env) {
	const normalized = {
		schemaVersion: OPERATOR_DIAGNOSTICS_TIMELINE_SCHEMA_VERSION,
		type: event.type,
		timestamp: event.timestamp ?? (/* @__PURE__ */ new Date()).toISOString(),
		name: event.name,
		...env.OPERATOR_DIAGNOSTICS_RUN_ID ? { runId: env.OPERATOR_DIAGNOSTICS_RUN_ID } : {},
		...env.OPERATOR_DIAGNOSTICS_ENV ? { envName: env.OPERATOR_DIAGNOSTICS_ENV } : {},
		pid: process.pid,
		...event.runId ? { runId: event.runId } : {},
		...event.envName ? { envName: event.envName } : {},
		...typeof event.pid === "number" ? { pid: event.pid } : {},
		...event.phase ? { phase: event.phase } : {},
		...event.spanId ? { spanId: event.spanId } : {},
		...event.parentSpanId ? { parentSpanId: event.parentSpanId } : {},
		...typeof event.durationMs === "number" ? { durationMs: normalizeNumber(event.durationMs) } : {},
		...event.errorName ? { errorName: event.errorName } : {},
		...event.errorMessage ? { errorMessage: event.errorMessage } : {},
		...typeof event.p50Ms === "number" ? { p50Ms: normalizeNumber(event.p50Ms) } : {},
		...typeof event.p95Ms === "number" ? { p95Ms: normalizeNumber(event.p95Ms) } : {},
		...typeof event.p99Ms === "number" ? { p99Ms: normalizeNumber(event.p99Ms) } : {},
		...typeof event.maxMs === "number" ? { maxMs: normalizeNumber(event.maxMs) } : {},
		...event.activeSpanName ? { activeSpanName: event.activeSpanName } : {},
		...event.provider ? { provider: event.provider } : {},
		...event.operation ? { operation: event.operation } : {},
		...typeof event.ok === "boolean" ? { ok: event.ok } : {},
		...event.command ? { command: event.command } : {},
		...event.exitCode !== void 0 ? { exitCode: event.exitCode } : {},
		...event.signal !== void 0 ? { signal: event.signal } : {},
		...normalizeAttributes(event.attributes) ? { attributes: normalizeAttributes(event.attributes) } : {}
	};
	return `${JSON.stringify(normalized)}\n`;
}
/** Appends one normalized diagnostics timeline event to the configured JSONL file. */
function emitDiagnosticsTimelineEvent(event, options = {}) {
	const { env } = resolveDiagnosticsTimelineOptions(options);
	if (!isDiagnosticsTimelineEnabled(options)) return;
	const path = env.OPERATOR_DIAGNOSTICS_TIMELINE_PATH?.trim();
	if (!path) return;
	const line = serializeTimelineEvent(event, env);
	try {
		const dir = (0, node_path.dirname)(path);
		if (!createdTimelineDirs.has(dir)) {
			(0, node_fs.mkdirSync)(dir, { recursive: true });
			createdTimelineDirs.add(dir);
		}
		(0, _openclaw_fs_safe_advanced.appendRegularFileSync)({
			filePath: path,
			content: line
		});
	} catch (error) {
		if (!warnedAboutTimelineWrite) {
			warnedAboutTimelineWrite = true;
			process.stderr.write(`[diagnostics] failed to write timeline event: ${String(error)}\n`);
		}
	}
}
/** Returns the currently active span so callers can preserve parentage across memoized work. */
function getActiveDiagnosticsTimelineSpan() {
	return activeDiagnosticsTimelineSpan.getStore();
}
function startDiagnosticsTimelineSpan(name, options) {
	const env = options.env ?? process.env;
	if (!isDiagnosticsTimelineEnabled({
		config: options.config,
		env
	})) return;
	const activeSpan = getActiveDiagnosticsTimelineSpan();
	const phase = options.phase ?? activeSpan?.phase;
	const parentSpanId = options.parentSpanId ?? activeSpan?.spanId;
	const span = {
		name,
		env,
		...options.config ? { config: options.config } : {},
		spanId: (0, node_crypto.randomUUID)(),
		startedAt: node_perf_hooks.performance.now(),
		...phase ? { phase } : {},
		...parentSpanId ? { parentSpanId } : {},
		...options.attributes ? { attributes: options.attributes } : {},
		...options.omitErrorMessage ? { omitErrorMessage: true } : {}
	};
	emitDiagnosticsTimelineEvent({
		type: "span.start",
		name: span.name,
		phase: span.phase,
		spanId: span.spanId,
		parentSpanId: span.parentSpanId,
		attributes: span.attributes
	}, {
		config: span.config,
		env: span.env
	});
	return span;
}
function runInDiagnosticsTimelineSpan(span, run) {
	return activeDiagnosticsTimelineSpan.run({
		name: span.name,
		...span.phase ? { phase: span.phase } : {},
		spanId: span.spanId,
		...span.parentSpanId ? { parentSpanId: span.parentSpanId } : {},
		...span.attributes ? { attributes: span.attributes } : {}
	}, run);
}
function emitFinishedDiagnosticsTimelineSpan(span) {
	emitDiagnosticsTimelineEvent({
		type: "span.end",
		name: span.name,
		phase: span.phase,
		spanId: span.spanId,
		parentSpanId: span.parentSpanId,
		durationMs: node_perf_hooks.performance.now() - span.startedAt,
		attributes: span.attributes
	}, {
		config: span.config,
		env: span.env
	});
}
function emitFailedDiagnosticsTimelineSpan(span, error) {
	emitDiagnosticsTimelineEvent({
		type: "span.error",
		name: span.name,
		phase: span.phase,
		spanId: span.spanId,
		parentSpanId: span.parentSpanId,
		durationMs: node_perf_hooks.performance.now() - span.startedAt,
		attributes: span.attributes,
		errorName: error instanceof Error ? error.name : typeof error,
		...span.omitErrorMessage ? {} : { errorMessage: error instanceof Error ? error.message : String(error) }
	}, {
		config: span.config,
		env: span.env
	});
}
/** Measures async work as a start/end timeline span, emitting an error span before rethrowing. */
async function measureDiagnosticsTimelineSpan(name, run, options = {}) {
	const span = startDiagnosticsTimelineSpan(name, options);
	if (!span) return await run();
	try {
		const result = await runInDiagnosticsTimelineSpan(span, () => run());
		emitFinishedDiagnosticsTimelineSpan(span);
		return result;
	} catch (error) {
		emitFailedDiagnosticsTimelineSpan(span, error);
		throw error;
	}
}
/** Measures sync work as a start/end timeline span, emitting an error span before rethrowing. */
function measureDiagnosticsTimelineSpanSync(name, run, options = {}) {
	const span = startDiagnosticsTimelineSpan(name, options);
	if (!span) return run();
	try {
		const result = runInDiagnosticsTimelineSpan(span, run);
		emitFinishedDiagnosticsTimelineSpan(span);
		return result;
	} catch (error) {
		emitFailedDiagnosticsTimelineSpan(span, error);
		throw error;
	}
}
//#endregion
//#region src/plugins/plugin-metadata-snapshot.ts
var plugin_metadata_snapshot_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	clearLoadPluginMetadataSnapshotMemo: () => clearLoadPluginMetadataSnapshotMemo,
	isPluginMetadataSnapshotCompatible: () => isPluginMetadataSnapshotCompatible,
	listPluginOriginsFromMetadataSnapshot: () => listPluginOriginsFromMetadataSnapshot,
	loadPluginMetadataSnapshot: () => loadPluginMetadataSnapshot,
	resolvePluginMetadataSnapshot: () => resolvePluginMetadataSnapshot,
	resolvePluginMetadataSnapshotMemoEnvFingerprint: () => resolvePluginMetadataSnapshotMemoEnvFingerprint
});
const MAX_PLUGIN_METADATA_SNAPSHOT_MEMOS = 8;
let pluginMetadataSnapshotMemos = [];
function clearLoadPluginMetadataSnapshotMemo() {
	pluginMetadataSnapshotMemos = [];
}
require_plugin_metadata_lifecycle.registerPluginMetadataProcessMemoLifecycleClear(clearLoadPluginMetadataSnapshotMemo);
const MEMO_RELEVANT_ENV_KEYS = [
	"APPDATA",
	"HOME",
	"OPERATOR_BUNDLED_PLUGINS_DIR",
	"OPERATOR_COMPATIBILITY_HOST_VERSION",
	"OPERATOR_CONFIG_PATH",
	"OPERATOR_DISABLE_BUNDLED_PLUGINS",
	"OPERATOR_DISABLE_BUNDLED_SOURCE_OVERLAYS",
	"OPERATOR_DISABLE_PERSISTED_PLUGIN_REGISTRY",
	"OPERATOR_HOME",
	"OPERATOR_NIX_MODE",
	"OPERATOR_STATE_DIR",
	"USERPROFILE",
	"XDG_CONFIG_HOME"
];
function directoryChildPackageJsonFingerprint(directoryPath) {
	let entries;
	try {
		entries = node_fs.default.readdirSync(directoryPath, { withFileTypes: true });
	} catch {
		return [directoryPath, "missing"];
	}
	return [directoryPath, ...entries.filter((entry) => entry.isDirectory()).toSorted((a, b) => a.name.localeCompare(b.name)).map((entry) => require_plugin_registry.fileFingerprint(node_path.default.join(directoryPath, entry.name, "package.json")))];
}
function stableMemoValue(value) {
	if (Array.isArray(value)) return value.map(stableMemoValue);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return value;
	return Object.fromEntries(Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, stableMemoValue(entry)]));
}
function pickMemoRelevantEnv(env) {
	return Object.fromEntries(MEMO_RELEVANT_ENV_KEYS.flatMap((key) => {
		const value = env[key];
		return value === void 0 ? [] : [[key, value]];
	}));
}
function resolvePluginMetadataSnapshotMemoEnvFingerprint(env) {
	return require_installed_plugin_index.hashJson(pickMemoRelevantEnv(env));
}
function throwReadonlyPluginMetadataMutation() {
	throw new TypeError("Plugin metadata snapshots are immutable");
}
function freezeSnapshotValue(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (!value || typeof value !== "object") return value;
	if (seen.has(value)) return value;
	seen.add(value);
	if (value instanceof Map) {
		for (const [key, entry] of value) {
			freezeSnapshotValue(key, seen);
			freezeSnapshotValue(entry, seen);
		}
		Object.defineProperties(value, {
			clear: { value: throwReadonlyPluginMetadataMutation },
			delete: { value: throwReadonlyPluginMetadataMutation },
			set: { value: throwReadonlyPluginMetadataMutation }
		});
		return Object.freeze(value);
	}
	if (value instanceof Set) {
		for (const entry of value) freezeSnapshotValue(entry, seen);
		Object.defineProperties(value, {
			add: { value: throwReadonlyPluginMetadataMutation },
			clear: { value: throwReadonlyPluginMetadataMutation },
			delete: { value: throwReadonlyPluginMetadataMutation }
		});
		return Object.freeze(value);
	}
	for (const entry of Object.values(value)) freezeSnapshotValue(entry, seen);
	return Object.freeze(value);
}
function freezePluginMetadataSnapshot(snapshot) {
	return freezeSnapshotValue(snapshot);
}
function resolvePersistedRegistryFastMemoFingerprint(params) {
	const disabledByEnv = params.env.OPERATOR_DISABLE_PERSISTED_PLUGIN_REGISTRY?.trim().toLowerCase();
	if (params.preferPersisted === false || Boolean(disabledByEnv) && disabledByEnv !== "0" && disabledByEnv !== "false" && disabledByEnv !== "no") return { disabled: true };
	const npmRoot = params.stateDir ? node_path.default.join(params.stateDir, "npm") : require_install_paths.resolveDefaultPluginNpmDir(params.env);
	return {
		index: require_installed_plugin_index.hashJson(stableMemoValue(require_installed_plugin_index_store.readPersistedInstalledPluginIndexSync({
			env: params.env,
			...params.stateDir ? { stateDir: params.stateDir } : {}
		})) ?? null),
		npmPackageJson: require_plugin_registry.fileFingerprint(node_path.default.join(npmRoot, "package.json")),
		npmProjectPackageJsons: directoryChildPackageJsonFingerprint(require_install_paths.resolvePluginNpmProjectsDir(npmRoot))
	};
}
function resolvePersistedRegistryMemoContextHash(params) {
	return require_installed_plugin_index.hashJson({
		env: pickMemoRelevantEnv(params.env),
		fastFingerprint: params.fastFingerprint,
		preferPersisted: params.preferPersisted ?? null,
		stateDir: params.stateDir ?? null
	});
}
function resolvePersistedRegistryMemoLookupContextHash(params) {
	return require_installed_plugin_index.hashJson({
		env: pickMemoRelevantEnv(params.env),
		preferPersisted: params.preferPersisted ?? null,
		stateDir: params.stateDir ?? null
	});
}
function resolvePersistedRegistryMemoState(params) {
	const fastFingerprint = resolvePersistedRegistryFastMemoFingerprint(params);
	const fastHash = require_installed_plugin_index.hashJson(fastFingerprint);
	const contextHash = resolvePersistedRegistryMemoContextHash({
		...params,
		fastFingerprint
	});
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(fastFingerprint) && fastFingerprint.disabled === true) return {
		contextHash,
		fastHash,
		fingerprint: fastFingerprint
	};
	const index = require_installed_plugin_index_store.readPersistedInstalledPluginIndexSync({
		env: params.env,
		...params.stateDir ? { stateDir: params.stateDir } : {}
	});
	return {
		contextHash,
		fastHash,
		fingerprint: {
			...fastFingerprint,
			indexHash: require_installed_plugin_index.hashJson(stableMemoValue(index) ?? null)
		}
	};
}
function resolvePersistedRegistryMemoStateForLookup(params, memos) {
	const lookupContextHash = resolvePersistedRegistryMemoLookupContextHash(params);
	for (const memo of memos) if (memo.lookupContextHash === lookupContextHash && memo.registryState) return memo.registryState;
	const fastFingerprint = resolvePersistedRegistryFastMemoFingerprint(params);
	const fastHash = require_installed_plugin_index.hashJson(fastFingerprint);
	const contextHash = resolvePersistedRegistryMemoContextHash({
		...params,
		fastFingerprint
	});
	for (const memo of memos) {
		const registryState = memo.registryState;
		if (registryState && registryState.contextHash === contextHash && registryState.fastHash === fastHash) return registryState;
	}
	return resolvePersistedRegistryMemoState(params);
}
function resolveProvidedIndexMemoState(index) {
	const fingerprint = { providedIndex: require_current_plugin_metadata_snapshot.resolveInstalledManifestRegistryIndexFingerprint(index) };
	const fingerprintHash = require_installed_plugin_index.hashJson(fingerprint);
	return {
		contextHash: fingerprintHash,
		fastHash: fingerprintHash,
		fingerprint
	};
}
function findPluginMetadataSnapshotMemo(key) {
	const index = pluginMetadataSnapshotMemos.findIndex((memo) => memo.key === key);
	if (index === -1) return;
	const [memo] = pluginMetadataSnapshotMemos.splice(index, 1);
	if (!memo) return;
	pluginMetadataSnapshotMemos.unshift(memo);
	return memo;
}
function rememberPluginMetadataSnapshotMemo(memo) {
	pluginMetadataSnapshotMemos = [memo, ...pluginMetadataSnapshotMemos.filter((existing) => existing.key !== memo.key)].slice(0, MAX_PLUGIN_METADATA_SNAPSHOT_MEMOS);
}
function computePluginMetadataSnapshotMemoKey(params) {
	const { params: snapshotParams, registryState } = params;
	const env = snapshotParams.env ?? process.env;
	const indexFingerprint = snapshotParams.index ? require_current_plugin_metadata_snapshot.resolveInstalledManifestRegistryIndexFingerprint(snapshotParams.index) : void 0;
	return require_installed_plugin_index.hashJson({
		controlPlane: require_current_plugin_metadata_snapshot.resolvePluginControlPlaneFingerprint({
			config: snapshotParams.config,
			env,
			workspaceDir: snapshotParams.workspaceDir,
			policyHash: require_installed_plugin_index.resolveInstalledPluginIndexPolicyHash(snapshotParams.config),
			...indexFingerprint ? { inventoryFingerprint: indexFingerprint } : {}
		}),
		cwd: process.cwd(),
		env: pickMemoRelevantEnv(env),
		index: indexFingerprint ?? null,
		pathPolicy: {
			compatibilityHostVersion: require_version.resolveCompatibilityHostVersion(env),
			nixMode: require_paths.resolveIsNixMode(env)
		},
		pluginIds: require_current_plugin_metadata_snapshot.serializePluginIdScope(require_current_plugin_metadata_snapshot.normalizePluginIdScope(snapshotParams.pluginIds)),
		pluginIdScopeKey: snapshotParams.pluginIdScope?.key ?? null,
		preferPersisted: snapshotParams.preferPersisted ?? null,
		registry: registryState.fingerprint,
		stateDir: snapshotParams.stateDir ? require_home_dir.resolveUserPath(snapshotParams.stateDir, env) : null,
		workspaceDir: snapshotParams.workspaceDir ?? null
	});
}
function resolvePluginMetadataControlPlaneFingerprint(params) {
	return require_current_plugin_metadata_snapshot.resolvePluginControlPlaneFingerprint(params);
}
function indexesMatch(left, right) {
	if (!left || !right) return true;
	return require_current_plugin_metadata_snapshot.resolveInstalledManifestRegistryIndexFingerprint(left) === require_current_plugin_metadata_snapshot.resolveInstalledManifestRegistryIndexFingerprint(right);
}
function cloneSnapshotInput(value) {
	return value && typeof value === "object" ? structuredClone(value) : value;
}
function normalizeInstalledPluginIndex(index) {
	return {
		version: index.version ?? 1,
		hostContractVersion: index.hostContractVersion ?? "",
		compatRegistryVersion: index.compatRegistryVersion ?? "",
		migrationVersion: index.migrationVersion ?? 1,
		policyHash: index.policyHash ?? "",
		generatedAtMs: index.generatedAtMs ?? 0,
		installRecords: cloneSnapshotInput(index.installRecords ?? {}),
		plugins: (index.plugins ?? []).map(cloneSnapshotInput),
		diagnostics: (index.diagnostics ?? []).map(cloneSnapshotInput),
		...index.warning ? { warning: index.warning } : {},
		...index.refreshReason ? { refreshReason: index.refreshReason } : {}
	};
}
function resolvePluginMetadataSnapshotPluginIds(params) {
	const direct = require_current_plugin_metadata_snapshot.normalizePluginIdScope(params.params.pluginIds);
	if (direct !== void 0) return direct;
	return require_current_plugin_metadata_snapshot.normalizePluginIdScope(params.params.pluginIdScope?.resolve({ index: params.index }));
}
function isPluginMetadataSnapshotCompatible(params) {
	const env = params.env ?? process.env;
	const requestedPluginIds = require_current_plugin_metadata_snapshot.normalizePluginIdScope(params.pluginIds);
	const snapshotPluginIds = require_current_plugin_metadata_snapshot.normalizePluginIdScope(params.snapshot.pluginIds);
	return (snapshotPluginIds === void 0 || params.allowScopedSnapshot === true || requestedPluginIds !== void 0 && require_current_plugin_metadata_snapshot.serializePluginIdScope(snapshotPluginIds) === require_current_plugin_metadata_snapshot.serializePluginIdScope(requestedPluginIds)) && params.snapshot.policyHash === require_installed_plugin_index.resolveInstalledPluginIndexPolicyHash(params.config) && (!params.snapshot.configFingerprint || params.snapshot.configFingerprint === resolvePluginMetadataControlPlaneFingerprint({
		config: params.config,
		env,
		index: params.index ?? params.snapshot.index,
		policyHash: params.snapshot.policyHash,
		workspaceDir: params.workspaceDir
	})) && (params.snapshot.workspaceDir ?? "") === (params.workspaceDir ?? "") && indexesMatch(params.snapshot.index, params.index);
}
function appendOwner(owners, ownedId, pluginId) {
	const existing = owners.get(ownedId);
	if (existing) {
		if (existing.includes(pluginId)) return;
		existing.push(pluginId);
		return;
	}
	owners.set(ownedId, [pluginId]);
}
function freezeOwnerMap(owners) {
	return new Map([...owners.entries()].map(([ownedId, pluginIds]) => [ownedId, Object.freeze([...pluginIds])]));
}
function buildPluginMetadataOwnerMaps(plugins) {
	const channels = /* @__PURE__ */ new Map();
	const channelConfigs = /* @__PURE__ */ new Map();
	const providers = /* @__PURE__ */ new Map();
	const modelCatalogProviders = /* @__PURE__ */ new Map();
	const cliBackends = /* @__PURE__ */ new Map();
	const setupProviders = /* @__PURE__ */ new Map();
	const commandAliases = /* @__PURE__ */ new Map();
	const contracts = /* @__PURE__ */ new Map();
	for (const plugin of plugins) {
		for (const channelId of plugin.channels ?? []) appendOwner(channels, channelId, plugin.id);
		for (const channelId of Object.keys(plugin.channelConfigs ?? {})) appendOwner(channelConfigs, channelId, plugin.id);
		for (const providerId of plugin.providers ?? []) appendOwner(providers, providerId, plugin.id);
		for (const [rawAlias, target] of Object.entries(plugin.providerAuthAliases ?? {})) {
			const alias = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(rawAlias);
			const targetProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(target);
			if (alias && targetProvider && (plugin.providers ?? []).some((providerId) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId) === targetProvider)) appendOwner(providers, alias, plugin.id);
		}
		for (const providerId of Object.keys(plugin.modelCatalog?.providers ?? {})) appendOwner(modelCatalogProviders, providerId, plugin.id);
		for (const providerId of Object.keys(plugin.modelCatalog?.aliases ?? {})) appendOwner(modelCatalogProviders, providerId, plugin.id);
		for (const cliBackendId of plugin.cliBackends ?? []) appendOwner(cliBackends, cliBackendId, plugin.id);
		for (const cliBackendId of plugin.setup?.cliBackends ?? []) appendOwner(cliBackends, cliBackendId, plugin.id);
		for (const setupProvider of plugin.setup?.providers ?? []) appendOwner(setupProviders, setupProvider.id, plugin.id);
		for (const commandAlias of plugin.commandAliases ?? []) appendOwner(commandAliases, commandAlias.name, plugin.id);
		for (const [contract, values] of Object.entries(plugin.contracts ?? {})) if (Array.isArray(values) && values.length > 0) appendOwner(contracts, contract, plugin.id);
	}
	return {
		channels: freezeOwnerMap(channels),
		channelConfigs: freezeOwnerMap(channelConfigs),
		providers: freezeOwnerMap(providers),
		modelCatalogProviders: freezeOwnerMap(modelCatalogProviders),
		cliBackends: freezeOwnerMap(cliBackends),
		setupProviders: freezeOwnerMap(setupProviders),
		commandAliases: freezeOwnerMap(commandAliases),
		contracts: freezeOwnerMap(contracts)
	};
}
function listPluginOriginsFromMetadataSnapshot(snapshot) {
	return new Map(snapshot.plugins.map((record) => [record.id, record.origin]));
}
function loadPluginMetadataSnapshot(params) {
	const activeTimelineSpan = getActiveDiagnosticsTimelineSpan();
	const env = params.env ?? process.env;
	const registryState = params.index ? resolveProvidedIndexMemoState(params.index) : resolvePersistedRegistryMemoStateForLookup({
		env,
		...params.stateDir ? { stateDir: require_home_dir.resolveUserPath(params.stateDir, env) } : {},
		...params.preferPersisted !== void 0 ? { preferPersisted: params.preferPersisted } : {}
	}, pluginMetadataSnapshotMemos);
	const memoKey = computePluginMetadataSnapshotMemoKey({
		params,
		registryState
	});
	const memo = findPluginMetadataSnapshotMemo(memoKey);
	if (memo?.key === memoKey) return memo.snapshot;
	const result = measureDiagnosticsTimelineSpanSync("plugins.metadata.scan", () => loadPluginMetadataSnapshotImpl(params), {
		phase: activeTimelineSpan?.phase ?? "startup",
		config: params.config,
		env: params.env,
		attributes: {
			hasWorkspaceDir: params.workspaceDir !== void 0,
			hasInstalledIndex: params.index !== void 0
		}
	});
	const snapshot = freezePluginMetadataSnapshot(result.snapshot);
	if (canMemoizePluginMetadataSnapshotResult(result)) rememberPluginMetadataSnapshotMemo({
		key: memoKey,
		lookupContextHash: resolvePersistedRegistryMemoLookupContextHash({
			env,
			...params.stateDir ? { stateDir: require_home_dir.resolveUserPath(params.stateDir, env) } : {},
			...params.preferPersisted !== void 0 ? { preferPersisted: params.preferPersisted } : {}
		}),
		registryState,
		snapshot
	});
	return snapshot;
}
function canMemoizePluginMetadataSnapshotResult(result) {
	const snapshot = result.snapshot;
	const hasCompleteSnapshotShape = Array.isArray(snapshot.plugins) && Array.isArray(snapshot.diagnostics) && Array.isArray(snapshot.registryDiagnostics) && Array.isArray(snapshot.manifestRegistry.plugins) && Array.isArray(snapshot.manifestRegistry.diagnostics) && Array.isArray(snapshot.index.plugins) && Array.isArray(snapshot.index.diagnostics);
	const hasPluginMetadata = snapshot.plugins.length > 0 || snapshot.index.plugins.length > 0;
	return hasCompleteSnapshotShape && hasPluginMetadata;
}
function resolvePluginMetadataSnapshot(params) {
	if (params.allowCurrent !== false && params.stateDir === void 0 && params.preferPersisted !== false) {
		const current = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
			config: params.config,
			env: params.env,
			...params.pluginIds !== void 0 ? { pluginIds: params.pluginIds } : {},
			...params.pluginIdScope !== void 0 ? { pluginIdScope: params.pluginIdScope } : {},
			...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
			...params.allowWorkspaceScopedCurrent === true ? { allowWorkspaceScopedSnapshot: true } : {}
		});
		if (!current) return loadPluginMetadataSnapshot(params);
		if (!params.index) return current;
		if (isPluginMetadataSnapshotCompatible({
			snapshot: current,
			config: params.config,
			env: params.env,
			allowScopedSnapshot: params.pluginIds !== void 0 || params.pluginIdScope !== void 0,
			workspaceDir: params.workspaceDir ?? (params.allowWorkspaceScopedCurrent === true ? current.workspaceDir : void 0),
			index: params.index
		})) return current;
	}
	return loadPluginMetadataSnapshot(params);
}
function loadPluginMetadataSnapshotImpl(params) {
	const totalStartedAt = performance.now();
	const registryStartedAt = performance.now();
	const registryResult = require_plugin_registry.loadPluginRegistrySnapshotWithMetadata({
		config: params.config,
		workspaceDir: params.workspaceDir,
		...params.stateDir ? { stateDir: params.stateDir } : {},
		env: params.env,
		...params.preferPersisted !== void 0 ? { preferPersisted: params.preferPersisted } : {},
		...params.index ? { index: params.index } : {}
	}) ?? {
		source: "derived",
		snapshot: { plugins: [] },
		diagnostics: []
	};
	const registrySnapshotMs = performance.now() - registryStartedAt;
	const index = normalizeInstalledPluginIndex(registryResult.snapshot);
	const pluginIds = resolvePluginMetadataSnapshotPluginIds({
		params,
		index
	});
	const manifestStartedAt = performance.now();
	const manifestRegistry = index.plugins.length === 0 ? require_manifest_registry.loadPluginManifestRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		diagnostics: [...index.diagnostics],
		installRecords: index.installRecords
	}) : require_current_plugin_metadata_snapshot.loadPluginManifestRegistryForInstalledIndex({
		index,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		...pluginIds !== void 0 ? { pluginIds } : {},
		includeDisabled: true
	});
	const manifestRegistryMs = performance.now() - manifestStartedAt;
	const normalizePluginId = require_plugin_registry.createPluginRegistryIdNormalizer(index, { manifestRegistry });
	const byPluginId = new Map(manifestRegistry.plugins.map((plugin) => [plugin.id, plugin]));
	const ownerMapsStartedAt = performance.now();
	const owners = buildPluginMetadataOwnerMaps(manifestRegistry.plugins);
	const ownerMapsMs = performance.now() - ownerMapsStartedAt;
	const totalMs = performance.now() - totalStartedAt;
	return {
		registrySource: registryResult.source,
		snapshot: {
			policyHash: index.policyHash,
			registrySource: registryResult.source,
			configFingerprint: resolvePluginMetadataControlPlaneFingerprint({
				config: params.config,
				env: params.env,
				index,
				policyHash: index.policyHash,
				workspaceDir: params.workspaceDir
			}),
			...pluginIds !== void 0 ? { pluginIds } : {},
			...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
			index,
			registryDiagnostics: registryResult.diagnostics,
			manifestRegistry,
			plugins: manifestRegistry.plugins,
			diagnostics: manifestRegistry.diagnostics,
			byPluginId,
			normalizePluginId,
			owners,
			metrics: {
				registrySnapshotMs,
				manifestRegistryMs,
				ownerMapsMs,
				totalMs,
				indexPluginCount: index.plugins.length,
				manifestPluginCount: manifestRegistry.plugins.length
			},
			discovery: registryResult.discovery
		}
	};
}
//#endregion
Object.defineProperty(exports, "emitDiagnosticsTimelineEvent", {
	enumerable: true,
	get: function() {
		return emitDiagnosticsTimelineEvent;
	}
});
Object.defineProperty(exports, "isDiagnosticFlagEnabled", {
	enumerable: true,
	get: function() {
		return isDiagnosticFlagEnabled;
	}
});
Object.defineProperty(exports, "isDiagnosticsTimelineEnabled", {
	enumerable: true,
	get: function() {
		return isDiagnosticsTimelineEnabled;
	}
});
Object.defineProperty(exports, "isPluginMetadataSnapshotCompatible", {
	enumerable: true,
	get: function() {
		return isPluginMetadataSnapshotCompatible;
	}
});
Object.defineProperty(exports, "listPluginOriginsFromMetadataSnapshot", {
	enumerable: true,
	get: function() {
		return listPluginOriginsFromMetadataSnapshot;
	}
});
Object.defineProperty(exports, "loadPluginMetadataSnapshot", {
	enumerable: true,
	get: function() {
		return loadPluginMetadataSnapshot;
	}
});
Object.defineProperty(exports, "measureDiagnosticsTimelineSpan", {
	enumerable: true,
	get: function() {
		return measureDiagnosticsTimelineSpan;
	}
});
Object.defineProperty(exports, "measureDiagnosticsTimelineSpanSync", {
	enumerable: true,
	get: function() {
		return measureDiagnosticsTimelineSpanSync;
	}
});
Object.defineProperty(exports, "plugin_metadata_snapshot_exports", {
	enumerable: true,
	get: function() {
		return plugin_metadata_snapshot_exports;
	}
});
Object.defineProperty(exports, "resolvePluginMetadataSnapshot", {
	enumerable: true,
	get: function() {
		return resolvePluginMetadataSnapshot;
	}
});
Object.defineProperty(exports, "resolvePluginMetadataSnapshotMemoEnvFingerprint", {
	enumerable: true,
	get: function() {
		return resolvePluginMetadataSnapshotMemoEnvFingerprint;
	}
});
