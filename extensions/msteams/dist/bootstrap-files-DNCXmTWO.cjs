const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_embedded_agent_helpers = require("./embedded-agent-helpers-DJEcJifp.cjs");
const require_workspace = require("./workspace-oX0zfOZq.cjs");
const require_internal_hooks = require("./internal-hooks-CP-OV43M.cjs");
const require_file_read = require("./file-read-CEyyOznW.cjs");
const require_bootstrap_cache = require("./bootstrap-cache-CaqmJxMO.cjs");
const require_heartbeat_system_prompt = require("./heartbeat-system-prompt-BKoDGXAZ.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/bootstrap-hooks.ts
/** Runs bootstrap hooks and returns the effective bootstrap file list. */
async function applyBootstrapHookOverrides(params) {
	const sessionKey = params.sessionKey ?? params.sessionId ?? "unknown";
	const agentId = params.agentId ?? (params.sessionKey ? require_session_key.resolveAgentIdFromSessionKey(params.sessionKey) : void 0);
	const event = require_internal_hooks.createInternalHookEvent("agent", "bootstrap", sessionKey, {
		workspaceDir: params.workspaceDir,
		bootstrapFiles: params.files,
		cfg: params.config,
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		agentId
	});
	await require_internal_hooks.triggerInternalHook(event);
	const updated = event.context.bootstrapFiles;
	return Array.isArray(updated) ? updated : params.files;
}
//#endregion
//#region src/agents/bootstrap-files.ts
/**
* Resolves workspace bootstrap files for agent runs and converts them into
* bounded context files.
*/
var bootstrap_files_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	FULL_BOOTSTRAP_COMPLETED_CUSTOM_TYPE: () => FULL_BOOTSTRAP_COMPLETED_CUSTOM_TYPE,
	buildBootstrapContextForFiles: () => buildBootstrapContextForFiles,
	hasCompletedBootstrapTurn: () => hasCompletedBootstrapTurn,
	makeBootstrapWarn: () => makeBootstrapWarn,
	resolveBootstrapContextForRun: () => resolveBootstrapContextForRun,
	resolveBootstrapFilesForRun: () => resolveBootstrapFilesForRun,
	resolveContextInjectionMode: () => resolveContextInjectionMode
});
const CONTINUATION_SCAN_MAX_TAIL_BYTES = 256 * 1024;
const FULL_BOOTSTRAP_COMPLETED_CUSTOM_TYPE = "operator:bootstrap-context:full";
const BOOTSTRAP_WARNING_DEDUPE_LIMIT = 1024;
const seenBootstrapWarnings = /* @__PURE__ */ new Set();
const bootstrapWarningOrder = [];
function rememberBootstrapWarning(key) {
	if (seenBootstrapWarnings.has(key)) return false;
	if (seenBootstrapWarnings.size >= BOOTSTRAP_WARNING_DEDUPE_LIMIT) {
		const oldest = bootstrapWarningOrder.shift();
		if (oldest) seenBootstrapWarnings.delete(oldest);
	}
	seenBootstrapWarnings.add(key);
	bootstrapWarningOrder.push(key);
	return true;
}
/** Resolves the effective bootstrap injection mode for a session agent. */
function resolveContextInjectionMode(config, agentId) {
	const agentMode = config && agentId ? require_agent_scope_config.resolveAgentConfig(config, agentId)?.contextInjection : void 0;
	if (agentMode === "always" || agentMode === "continuation-skip" || agentMode === "never") return agentMode;
	return config?.agents?.defaults?.contextInjection ?? "always";
}
/** Checks whether the session transcript still has a valid full-bootstrap marker. */
async function hasCompletedBootstrapTurn(sessionFile) {
	if (require_sqlite_marker.parseSqliteSessionFileMarker(sessionFile)) return false;
	try {
		const stat = await node_fs_promises.default.lstat(sessionFile);
		if (stat.isSymbolicLink()) return false;
		const fh = await node_fs_promises.default.open(sessionFile, "r");
		try {
			const bytesToRead = Math.min(stat.size, CONTINUATION_SCAN_MAX_TAIL_BYTES);
			if (bytesToRead <= 0) return false;
			const start = stat.size - bytesToRead;
			const buffer = Buffer.allocUnsafe(bytesToRead);
			const bytesRead = await require_file_read.readFileWindowFully(fh, buffer, start);
			let text = buffer.toString("utf-8", 0, bytesRead);
			if (start > 0) {
				const firstNewline = text.indexOf("\n");
				if (firstNewline === -1) return false;
				text = text.slice(firstNewline + 1);
			}
			const records = text.split(/\r?\n/u).filter((line) => line.trim().length > 0).slice(-500);
			let compactedAfterLatestAssistant = false;
			for (let i = records.length - 1; i >= 0; i--) {
				const line = records[i];
				if (!line) continue;
				let entry;
				try {
					entry = JSON.parse(line);
				} catch {
					continue;
				}
				const record = entry;
				if (record?.type === "compaction") {
					compactedAfterLatestAssistant = true;
					continue;
				}
				if (record?.type === "custom" && record.customType === "operator:bootstrap-context:full") return !compactedAfterLatestAssistant;
			}
			return false;
		} finally {
			await fh.close();
		}
	} catch {
		return false;
	}
}
/** Builds a session-scoped warning sink that dedupes repeated bootstrap warnings. */
function makeBootstrapWarn(params) {
	const warn = params.warn;
	if (!warn) return;
	const workspacePrefix = params.workspaceDir ?? "";
	return (message) => {
		if (!rememberBootstrapWarning(`${workspacePrefix}\u0000${params.sessionLabel}\u0000${message}`)) return;
		warn(`${message} (sessionKey=${params.sessionLabel})`);
	};
}
function sanitizeBootstrapFiles(files, workspaceDir, warn) {
	const workspaceRoot = require_home_dir.resolveUserPath(workspaceDir);
	const seenPaths = /* @__PURE__ */ new Set();
	const sanitized = [];
	for (const file of files) {
		const pathValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(file.path) ?? "";
		if (!pathValue) {
			warn?.(`skipping bootstrap file "${file.name}" — missing or invalid "path" field (hook may have used "filePath" instead)`);
			continue;
		}
		const resolvedPath = node_path.default.isAbsolute(pathValue) ? node_path.default.resolve(pathValue) : pathValue.startsWith("~") ? require_home_dir.resolveUserPath(pathValue) : node_path.default.resolve(workspaceRoot, pathValue);
		const dedupeKey = node_path.default.normalize(node_path.default.relative(workspaceRoot, resolvedPath));
		if (seenPaths.has(dedupeKey)) continue;
		seenPaths.add(dedupeKey);
		sanitized.push({
			...file,
			path: resolvedPath
		});
	}
	return sanitized;
}
function applyContextModeFilter(params) {
	const contextMode = params.contextMode ?? "full";
	const runKind = params.runKind ?? "default";
	if (contextMode !== "lightweight") return params.files;
	if (runKind === "heartbeat") return params.files.filter((file) => file.name === "HEARTBEAT.md");
	return [];
}
function shouldExcludeHeartbeatBootstrapFile(params) {
	if (params.runKind === "commitment-only") return true;
	if (!params.config || params.runKind === "heartbeat") return false;
	const { defaultAgentId, sessionAgentId } = require_agent_scope.resolveSessionAgentIds({
		sessionKey: params.sessionKey ?? params.sessionId,
		config: params.config,
		agentId: params.agentId
	});
	if (sessionAgentId !== defaultAgentId) return false;
	return !require_heartbeat_system_prompt.shouldIncludeHeartbeatGuidanceForSystemPrompt({
		config: params.config,
		agentId: sessionAgentId,
		defaultAgentId
	});
}
function filterHeartbeatBootstrapFile(files, excludeHeartbeatBootstrapFile) {
	if (!excludeHeartbeatBootstrapFile) return files;
	return files.filter((file) => file.name !== require_workspace.DEFAULT_HEARTBEAT_FILENAME);
}
function filterCompletedWorkspaceBootstrapFile(files, setupCompleted, workspaceDir) {
	if (!setupCompleted) return files;
	const workspaceRoot = require_home_dir.resolveUserPath(workspaceDir);
	const rootBootstrapPath = node_path.default.join(workspaceRoot, require_workspace.DEFAULT_BOOTSTRAP_FILENAME);
	return files.filter((file) => {
		if (file.name !== "BOOTSTRAP.md") return true;
		const pathValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(file.path);
		if (!pathValue) return true;
		return (node_path.default.isAbsolute(pathValue) ? node_path.default.resolve(pathValue) : pathValue.startsWith("~") ? require_home_dir.resolveUserPath(pathValue) : node_path.default.resolve(workspaceRoot, pathValue)) !== rootBootstrapPath;
	});
}
async function isWorkspaceSetupCompletedForContext(workspaceDir) {
	try {
		return await require_workspace.isWorkspaceSetupCompleted(workspaceDir);
	} catch {
		return false;
	}
}
/** Resolves hook-adjusted, session-filtered bootstrap files for a run. */
async function resolveBootstrapFilesForRun(params) {
	const excludeHeartbeatBootstrapFile = shouldExcludeHeartbeatBootstrapFile(params);
	const sessionKey = params.sessionKey ?? params.sessionId;
	const workspaceSetupCompleted = await isWorkspaceSetupCompletedForContext(params.workspaceDir);
	return sanitizeBootstrapFiles(filterHeartbeatBootstrapFile(filterCompletedWorkspaceBootstrapFile(await applyBootstrapHookOverrides({
		files: applyContextModeFilter({
			files: filterCompletedWorkspaceBootstrapFile(require_workspace.filterBootstrapFilesForSession(params.sessionKey ? await require_bootstrap_cache.getOrLoadBootstrapFiles({
				workspaceDir: params.workspaceDir,
				sessionKey: params.sessionKey
			}) : await require_workspace.loadWorkspaceBootstrapFiles(params.workspaceDir), sessionKey), workspaceSetupCompleted, params.workspaceDir),
			contextMode: params.contextMode,
			runKind: params.runKind
		}),
		workspaceDir: params.workspaceDir,
		config: params.config,
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		agentId: params.agentId
	}), workspaceSetupCompleted, params.workspaceDir), excludeHeartbeatBootstrapFile), params.workspaceDir, params.warn);
}
/** Resolves both raw bootstrap metadata and bounded context files for a run. */
async function resolveBootstrapContextForRun(params) {
	const bootstrapFiles = await resolveBootstrapFilesForRun(params);
	return {
		bootstrapFiles,
		contextFiles: buildBootstrapContextForFiles(bootstrapFiles, params)
	};
}
/** Builds bounded context files from already-resolved bootstrap file metadata. */
function buildBootstrapContextForFiles(bootstrapFiles, params) {
	return require_embedded_agent_helpers.buildBootstrapContextFiles(bootstrapFiles, {
		maxChars: require_embedded_agent_helpers.resolveBootstrapMaxChars(params.config, params.agentId),
		totalMaxChars: require_embedded_agent_helpers.resolveBootstrapTotalMaxChars(params.config, params.agentId),
		warn: params.warn
	});
}
//#endregion
Object.defineProperty(exports, "FULL_BOOTSTRAP_COMPLETED_CUSTOM_TYPE", {
	enumerable: true,
	get: function() {
		return FULL_BOOTSTRAP_COMPLETED_CUSTOM_TYPE;
	}
});
Object.defineProperty(exports, "bootstrap_files_exports", {
	enumerable: true,
	get: function() {
		return bootstrap_files_exports;
	}
});
Object.defineProperty(exports, "buildBootstrapContextForFiles", {
	enumerable: true,
	get: function() {
		return buildBootstrapContextForFiles;
	}
});
Object.defineProperty(exports, "hasCompletedBootstrapTurn", {
	enumerable: true,
	get: function() {
		return hasCompletedBootstrapTurn;
	}
});
Object.defineProperty(exports, "makeBootstrapWarn", {
	enumerable: true,
	get: function() {
		return makeBootstrapWarn;
	}
});
Object.defineProperty(exports, "resolveBootstrapContextForRun", {
	enumerable: true,
	get: function() {
		return resolveBootstrapContextForRun;
	}
});
Object.defineProperty(exports, "resolveBootstrapFilesForRun", {
	enumerable: true,
	get: function() {
		return resolveBootstrapFilesForRun;
	}
});
Object.defineProperty(exports, "resolveContextInjectionMode", {
	enumerable: true,
	get: function() {
		return resolveContextInjectionMode;
	}
});
