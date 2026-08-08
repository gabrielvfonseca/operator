const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_paths$1 = require("./paths-DsfW3Lup.cjs");
const require_session_dirs = require("./session-dirs-CZJH_seJ.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/config/sessions/session-sqlite-target.ts
function resolveCustomStoreSqlitePath(params) {
	const resolved = node_path.default.resolve(params.storePath);
	const sessionsDir = node_path.default.dirname(resolved);
	const sqliteBaseName = params.sqliteBaseName ?? (node_path.default.basename(resolved, node_path.default.extname(resolved)) || "operator-agent");
	const agentId = params.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId) : void 0;
	const sqliteName = agentId && agentId !== "main" && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(sqliteBaseName) !== agentId ? `${sqliteBaseName}.${agentId}` : sqliteBaseName;
	return node_path.default.join(sessionsDir, `${sqliteName}.sqlite`);
}
/** Resolves the SQLite database target that owns a legacy session store path. */
function resolveSqliteTargetFromSessionStorePath(storePath, options = {}) {
	const resolved = node_path.default.resolve(storePath);
	if (node_path.default.basename(resolved) === "operator-agent.sqlite" || resolved.endsWith(".sqlite")) {
		const agentId = resolveAgentIdFromSqliteDatabasePath(resolved);
		return {
			path: resolved,
			...agentId ? { agentId } : {}
		};
	}
	const sessionsDir = node_path.default.dirname(resolved);
	if (node_path.default.basename(resolved) !== "sessions.json") return { path: resolveCustomStoreSqlitePath({
		...options.agentId ? { agentId: options.agentId } : {},
		storePath: resolved
	}) };
	if (node_path.default.basename(sessionsDir) !== "sessions") return { path: resolveCustomStoreSqlitePath({
		...options.agentId ? { agentId: options.agentId } : {},
		sqliteBaseName: "operator-agent",
		storePath: resolved
	}) };
	const agentDir = node_path.default.dirname(sessionsDir);
	if (node_path.default.basename(node_path.default.dirname(agentDir)) !== "agents") return { path: resolveCustomStoreSqlitePath({
		...options.agentId ? { agentId: options.agentId } : {},
		sqliteBaseName: "operator-agent",
		storePath: resolved
	}) };
	return {
		agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(node_path.default.basename(agentDir)),
		path: node_path.default.join(agentDir, "agent", "operator-agent.sqlite")
	};
}
/** Extracts the agent id from the canonical per-agent SQLite database path. */
function resolveAgentIdFromSqliteDatabasePath(databasePath) {
	if (node_path.default.basename(databasePath) !== "operator-agent.sqlite") return;
	const agentDbDir = node_path.default.dirname(databasePath);
	if (node_path.default.basename(agentDbDir) !== "agent") return;
	const agentDir = node_path.default.dirname(agentDbDir);
	if (node_path.default.basename(node_path.default.dirname(agentDir)) !== "agents") return;
	return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(node_path.default.basename(agentDir));
}
//#endregion
//#region src/config/sessions/targets.ts
const NON_FATAL_DISCOVERY_ERROR_CODES = /* @__PURE__ */ new Set([
	"EACCES",
	"ELOOP",
	"ENOENT",
	"ENOTDIR",
	"EPERM",
	"ESTALE"
]);
function dedupeTargetsByStorePath(targets) {
	const deduped = /* @__PURE__ */ new Map();
	for (const target of targets) if (!deduped.has(target.storePath)) deduped.set(target.storePath, target);
	return [...deduped.values()];
}
function dedupeTargetsBySqliteTarget(targets) {
	const deduped = /* @__PURE__ */ new Map();
	for (const target of targets) {
		const sqlitePath = resolveSqliteTargetFromSessionStorePath(target.storePath, { agentId: target.agentId }).path ?? target.storePath;
		if (!deduped.has(sqlitePath)) deduped.set(sqlitePath, target);
	}
	return [...deduped.values()];
}
function shouldSkipDiscoveryError(err) {
	const code = err?.code;
	return typeof code === "string" && NON_FATAL_DISCOVERY_ERROR_CODES.has(code);
}
function isWithinRoot(realPath, realRoot) {
	return realPath === realRoot || realPath.startsWith(`${realRoot}${node_path.default.sep}`);
}
function shouldSkipDiscoveredAgentDirName(dirName, agentId) {
	return agentId === "main" && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(dirName) !== "main";
}
function resolveValidatedManagedFilePathSync(params) {
	try {
		const stat = node_fs.default.lstatSync(params.filePath);
		if (stat.isSymbolicLink() || !stat.isFile()) return;
		return isWithinRoot(node_fs.default.realpathSync.native(params.filePath), params.realAgentsRoot ?? node_fs.default.realpathSync.native(params.agentsRoot)) ? params.filePath : void 0;
	} catch (err) {
		if (shouldSkipDiscoveryError(err)) return;
		throw err;
	}
}
/** Lists agent ids whose session stores should be considered configured. */
function listConfiguredSessionStoreAgentIds(cfg) {
	const ids = new Set(require_agent_scope_config.listAgentIds(cfg).map((agentId) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId)));
	const addAcpAgentId = (agentId) => {
		const raw = agentId?.trim() ?? "";
		if (!raw || raw === "*") return;
		const normalized = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(raw);
		ids.add(normalized);
	};
	addAcpAgentId(cfg.acp?.defaultAgent);
	for (const agentId of cfg.acp?.allowedAgents ?? []) addAcpAgentId(agentId);
	const configuredAgents = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
	for (const agent of configuredAgents) if (agent.runtime?.type === "acp") addAcpAgentId(agent.runtime.acp?.agent ?? agent.id);
	return [...ids];
}
function resolveValidatedDiscoveredStorePathSync(params) {
	const storePath = node_path.default.join(params.sessionsDir, "sessions.json");
	const validatedStorePath = resolveValidatedManagedFilePathSync({
		agentsRoot: params.agentsRoot,
		filePath: storePath,
		realAgentsRoot: params.realAgentsRoot
	});
	if (validatedStorePath) return validatedStorePath;
	const sqlitePath = resolveSqliteTargetFromSessionStorePath(storePath).path;
	if (!sqlitePath) return;
	return resolveValidatedManagedFilePathSync({
		agentsRoot: params.agentsRoot,
		filePath: sqlitePath,
		realAgentsRoot: params.realAgentsRoot
	}) ? storePath : void 0;
}
function isValidatedRecoveryCandidateSessionsDir(params) {
	const agentDir = node_path.default.dirname(params.sessionsDir);
	try {
		const agentStat = node_fs.default.lstatSync(agentDir);
		if (agentStat.isSymbolicLink() || !agentStat.isDirectory()) return false;
		if (!isWithinRoot(node_fs.default.realpathSync.native(agentDir), params.realAgentsRoot)) return false;
		try {
			const sessionsStat = node_fs.default.lstatSync(params.sessionsDir);
			return !sessionsStat.isSymbolicLink() && sessionsStat.isDirectory() && isWithinRoot(node_fs.default.realpathSync.native(params.sessionsDir), params.realAgentsRoot);
		} catch (err) {
			return err.code === "ENOENT";
		}
	} catch (err) {
		if (err.code === "ENOENT") return params.allowMissingAgentDir === true;
		if (shouldSkipDiscoveryError(err)) return false;
		throw err;
	}
}
function resolveSessionStoreDiscoveryState(cfg, env) {
	const configuredTargets = resolveSessionStoreTargets(cfg, { allAgents: true }, { env });
	const agentsRoots = /* @__PURE__ */ new Set();
	for (const target of configuredTargets) {
		const agentsDir = require_paths$1.resolveAgentsDirFromSessionStorePath(target.storePath);
		if (agentsDir) agentsRoots.add(agentsDir);
	}
	agentsRoots.add(node_path.default.join(require_paths.resolveStateDir(env), "agents"));
	return {
		configuredTargets,
		agentsRoots: [...agentsRoots]
	};
}
function toDiscoveredSessionStoreTarget(sessionsDir, storePath) {
	const dirName = node_path.default.basename(node_path.default.dirname(sessionsDir));
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(dirName);
	if (shouldSkipDiscoveredAgentDirName(dirName, agentId)) return;
	return {
		agentId,
		storePath
	};
}
function resolveExplicitSessionStoreTarget(params) {
	const storePath = require_paths$1.resolveStorePath(params.store, {
		agentId: params.defaultAgentId,
		env: params.env
	});
	return (require_paths$1.resolveAgentsDirFromSessionStorePath(storePath) ? toDiscoveredSessionStoreTarget(node_path.default.dirname(storePath), storePath) : void 0) ?? {
		agentId: params.defaultAgentId,
		storePath
	};
}
/** Resolves all configured and discoverable agent session stores synchronously. */
function resolveAllAgentSessionStoreTargetsSync(cfg, params = {}) {
	const { configuredTargets, agentsRoots } = resolveSessionStoreDiscoveryState(cfg, params.env ?? process.env);
	const realAgentsRoots = /* @__PURE__ */ new Map();
	const getRealAgentsRoot = (agentsRoot) => {
		const cached = realAgentsRoots.get(agentsRoot);
		if (cached !== void 0) return cached;
		try {
			const realAgentsRoot = node_fs.default.realpathSync.native(agentsRoot);
			realAgentsRoots.set(agentsRoot, realAgentsRoot);
			return realAgentsRoot;
		} catch (err) {
			if (shouldSkipDiscoveryError(err)) return;
			throw err;
		}
	};
	const validatedConfiguredTargets = configuredTargets.flatMap((target) => {
		const agentsRoot = require_paths$1.resolveAgentsDirFromSessionStorePath(target.storePath);
		if (!agentsRoot) return [target];
		const realAgentsRoot = getRealAgentsRoot(agentsRoot);
		if (!realAgentsRoot) return [];
		const validatedStorePath = resolveValidatedDiscoveredStorePathSync({
			sessionsDir: node_path.default.dirname(target.storePath),
			agentsRoot,
			realAgentsRoot
		});
		return validatedStorePath ? [{
			...target,
			storePath: validatedStorePath
		}] : [];
	});
	const discoveredTargets = agentsRoots.flatMap((agentsDir) => {
		try {
			const realAgentsRoot = getRealAgentsRoot(agentsDir);
			if (!realAgentsRoot) return [];
			return require_session_dirs.resolveAgentSessionDirsFromAgentsDirSync(agentsDir).flatMap((sessionsDir) => {
				const validatedStorePath = resolveValidatedDiscoveredStorePathSync({
					sessionsDir,
					agentsRoot: agentsDir,
					realAgentsRoot
				});
				const target = validatedStorePath ? toDiscoveredSessionStoreTarget(sessionsDir, validatedStorePath) : void 0;
				return target ? [target] : [];
			});
		} catch (err) {
			if (shouldSkipDiscoveryError(err)) return [];
			throw err;
		}
	});
	return dedupeTargetsBySqliteTarget([...validatedConfiguredTargets, ...discoveredTargets]);
}
/**
* Resolves recovery candidates without requiring either the legacy store or SQLite file.
* Callers must validate the selected artifact before performing filesystem mutations.
*/
function resolveAllAgentSessionStoreCandidateTargetsSync(cfg, params = {}) {
	const { configuredTargets, agentsRoots } = resolveSessionStoreDiscoveryState(cfg, params.env ?? process.env);
	const realAgentsRoots = /* @__PURE__ */ new Map();
	const getRealAgentsRoot = (agentsRoot) => {
		if (realAgentsRoots.has(agentsRoot)) return realAgentsRoots.get(agentsRoot);
		try {
			const realAgentsRoot = node_fs.default.realpathSync.native(agentsRoot);
			realAgentsRoots.set(agentsRoot, realAgentsRoot);
			return realAgentsRoot;
		} catch (err) {
			if (shouldSkipDiscoveryError(err)) {
				realAgentsRoots.set(agentsRoot, void 0);
				return;
			}
			throw err;
		}
	};
	const validatedConfiguredTargets = configuredTargets.flatMap((target) => {
		const agentsRoot = require_paths$1.resolveAgentsDirFromSessionStorePath(target.storePath);
		if (!agentsRoot) return [target];
		if (!node_fs.default.existsSync(agentsRoot)) return [target];
		const realAgentsRoot = getRealAgentsRoot(agentsRoot);
		return realAgentsRoot && isValidatedRecoveryCandidateSessionsDir({
			allowMissingAgentDir: true,
			realAgentsRoot,
			sessionsDir: node_path.default.dirname(target.storePath)
		}) ? [target] : [];
	});
	const discoveredTargets = agentsRoots.flatMap((agentsDir) => {
		try {
			const realAgentsRoot = getRealAgentsRoot(agentsDir);
			if (!realAgentsRoot) return [];
			return require_session_dirs.resolveAgentSessionDirsFromAgentsDirSync(agentsDir).flatMap((sessionsDir) => {
				if (!isValidatedRecoveryCandidateSessionsDir({
					realAgentsRoot,
					sessionsDir
				})) return [];
				const target = toDiscoveredSessionStoreTarget(sessionsDir, node_path.default.join(sessionsDir, "sessions.json"));
				return target ? [target] : [];
			});
		} catch (err) {
			if (shouldSkipDiscoveryError(err)) return [];
			throw err;
		}
	});
	return dedupeTargetsBySqliteTarget([...validatedConfiguredTargets, ...discoveredTargets]);
}
/** Resolves session store targets for one agent, including retired/manual stores. */
function resolveAgentSessionStoreTargetsSync(cfg, agentId, params = {}) {
	const env = params.env ?? process.env;
	const requested = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	const storePaths = /* @__PURE__ */ new Set([require_paths$1.resolveStorePath(cfg.session?.store, {
		agentId: requested,
		env
	}), require_paths$1.resolveStorePath(void 0, {
		agentId: requested,
		env
	})]);
	const targets = [];
	const realAgentsRoots = /* @__PURE__ */ new Map();
	const getRealAgentsRoot = (agentsRoot) => {
		if (realAgentsRoots.has(agentsRoot)) return realAgentsRoots.get(agentsRoot);
		try {
			const realAgentsRoot = node_fs.default.realpathSync.native(agentsRoot);
			realAgentsRoots.set(agentsRoot, realAgentsRoot);
			return realAgentsRoot;
		} catch (err) {
			if (shouldSkipDiscoveryError(err)) {
				realAgentsRoots.set(agentsRoot, void 0);
				return;
			}
			throw err;
		}
	};
	for (const storePath of storePaths) {
		const agentsRoot = require_paths$1.resolveAgentsDirFromSessionStorePath(storePath);
		if (!agentsRoot) {
			targets.push({
				agentId: requested,
				storePath
			});
			continue;
		}
		const realAgentsRoot = getRealAgentsRoot(agentsRoot);
		if (!realAgentsRoot) continue;
		const validatedStorePath = resolveValidatedDiscoveredStorePathSync({
			sessionsDir: node_path.default.dirname(storePath),
			agentsRoot,
			realAgentsRoot
		});
		if (validatedStorePath) targets.push({
			agentId: requested,
			storePath: validatedStorePath
		});
	}
	const { agentsRoots } = resolveSessionStoreDiscoveryState(cfg, env);
	for (const agentsDir of agentsRoots) try {
		const realAgentsRoot = getRealAgentsRoot(agentsDir);
		if (!realAgentsRoot) continue;
		for (const sessionsDir of require_session_dirs.resolveAgentSessionDirsFromAgentsDirSync(agentsDir)) {
			const target = toDiscoveredSessionStoreTarget(sessionsDir, node_path.default.join(sessionsDir, "sessions.json"));
			if (!target || (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(target.agentId) !== requested) continue;
			const validatedStorePath = resolveValidatedDiscoveredStorePathSync({
				sessionsDir,
				agentsRoot: agentsDir,
				realAgentsRoot
			});
			if (validatedStorePath) targets.push({
				...target,
				storePath: validatedStorePath
			});
		}
	} catch (err) {
		if (shouldSkipDiscoveryError(err)) continue;
		throw err;
	}
	return dedupeTargetsByStorePath(targets);
}
/** Resolves session store targets from explicit CLI-style selection options. */
function resolveSessionStoreTargets(cfg, opts, params = {}) {
	const env = params.env ?? process.env;
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const hasAgent = Boolean(opts.agent?.trim());
	const allAgents = opts.allAgents === true;
	if (hasAgent && allAgents) throw new Error("--agent and --all-agents cannot be used together");
	if (opts.store && (hasAgent || allAgents)) throw new Error("--store cannot be combined with --agent or --all-agents");
	if (opts.store) return [resolveExplicitSessionStoreTarget({
		defaultAgentId,
		env,
		store: opts.store
	})];
	if (allAgents) return dedupeTargetsBySqliteTarget(listConfiguredSessionStoreAgentIds(cfg).map((agentId) => ({
		agentId,
		storePath: require_paths$1.resolveStorePath(cfg.session?.store, {
			agentId,
			env
		})
	})));
	if (hasAgent) {
		const knownAgents = require_agent_scope_config.listAgentIds(cfg);
		const requested = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(opts.agent ?? "");
		if (!knownAgents.includes(requested)) throw new Error(`Unknown agent id "${opts.agent}". Use "openclaw agents list" to see configured agents.`);
		return [{
			agentId: requested,
			storePath: require_paths$1.resolveStorePath(cfg.session?.store, {
				agentId: requested,
				env
			})
		}];
	}
	return [{
		agentId: defaultAgentId,
		storePath: require_paths$1.resolveStorePath(cfg.session?.store, {
			agentId: defaultAgentId,
			env
		})
	}];
}
//#endregion
Object.defineProperty(exports, "listConfiguredSessionStoreAgentIds", {
	enumerable: true,
	get: function() {
		return listConfiguredSessionStoreAgentIds;
	}
});
Object.defineProperty(exports, "resolveAgentSessionStoreTargetsSync", {
	enumerable: true,
	get: function() {
		return resolveAgentSessionStoreTargetsSync;
	}
});
Object.defineProperty(exports, "resolveAllAgentSessionStoreCandidateTargetsSync", {
	enumerable: true,
	get: function() {
		return resolveAllAgentSessionStoreCandidateTargetsSync;
	}
});
Object.defineProperty(exports, "resolveAllAgentSessionStoreTargetsSync", {
	enumerable: true,
	get: function() {
		return resolveAllAgentSessionStoreTargetsSync;
	}
});
Object.defineProperty(exports, "resolveSessionStoreTargets", {
	enumerable: true,
	get: function() {
		return resolveSessionStoreTargets;
	}
});
Object.defineProperty(exports, "resolveSqliteTargetFromSessionStorePath", {
	enumerable: true,
	get: function() {
		return resolveSqliteTargetFromSessionStorePath;
	}
});
