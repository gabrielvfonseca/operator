const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_workspace = require("./workspace-oX0zfOZq.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/commands/doctor-workspace.ts
/** Doctor checks and repairs for workspace memory files and legacy workspace hints. */
const MEMORY_SYSTEM_PROMPT = [
	"Memory system not found in workspace.",
	"Paste this into your agent:",
	"",
	"Install the memory system by applying:",
	"https://github.com/operator/operator/commit/9ffea23f31ca1df5183b25668f8f814bee0fb34e",
	"https://github.com/operator/operator/commit/7d1fee70e76f2f634f1b41fca927ee663914183a"
].join("\n");
/** Returns true when the workspace appears to lack canonical memory guidance. */
async function shouldSuggestMemorySystem(workspaceDir) {
	if ((await listWorkspaceEntries(workspaceDir)).has("MEMORY.md")) try {
		if ((await node_fs.default.promises.stat(require_workspace.resolveCanonicalRootMemoryPath(workspaceDir))).isFile()) return false;
	} catch {}
	const agentsPath = node_path.default.join(workspaceDir, require_workspace.DEFAULT_AGENTS_FILENAME);
	try {
		const content = await node_fs.default.promises.readFile(agentsPath, "utf-8");
		if (new RegExp(`\\b${"MEMORY.md".replace(".", "\\.")}\\b`).test(content)) return false;
	} catch {}
	return true;
}
async function statIfExists(filePath) {
	try {
		const stat = await node_fs.default.promises.stat(filePath);
		if (!stat.isFile()) return { exists: false };
		return {
			exists: true,
			bytes: stat.size
		};
	} catch (err) {
		if (err?.code === "ENOENT") return { exists: false };
		throw err;
	}
}
async function listWorkspaceEntries(workspaceDir) {
	try {
		return new Set(await node_fs.default.promises.readdir(workspaceDir));
	} catch (err) {
		if (err?.code === "ENOENT") return /* @__PURE__ */ new Set();
		throw err;
	}
}
/** Detects canonical and legacy root memory files in a workspace. */
async function detectRootMemoryFiles(workspaceDir) {
	const resolvedWorkspace = node_path.default.resolve(workspaceDir);
	const canonicalPath = require_workspace.resolveCanonicalRootMemoryPath(resolvedWorkspace);
	const legacyPath = require_workspace.resolveLegacyRootMemoryPath(resolvedWorkspace);
	const entries = await listWorkspaceEntries(resolvedWorkspace);
	const [canonical, legacy] = await Promise.all([entries.has("MEMORY.md") ? statIfExists(canonicalPath) : Promise.resolve({ exists: false }), entries.has("memory.md") ? statIfExists(legacyPath) : Promise.resolve({ exists: false })]);
	return {
		workspaceDir: resolvedWorkspace,
		canonicalPath,
		legacyPath,
		canonicalExists: canonical.exists,
		legacyExists: legacy.exists,
		...typeof canonical.bytes === "number" ? { canonicalBytes: canonical.bytes } : {},
		...typeof legacy.bytes === "number" ? { legacyBytes: legacy.bytes } : {}
	};
}
function formatBytes(bytes) {
	return typeof bytes === "number" ? `${bytes} bytes` : "size unknown";
}
/** Formats the warning for split canonical/legacy root memory files. */
function formatRootMemoryFilesWarning(detection) {
	if (detection.canonicalExists && detection.legacyExists) return [
		"Split root durable memory files detected:",
		`- canonical: ${require_utils.shortenHomePath(detection.canonicalPath)} (${formatBytes(detection.canonicalBytes)})`,
		`- legacy: ${require_utils.shortenHomePath(detection.legacyPath)} (${formatBytes(detection.legacyBytes)})`,
		`Operator uses ${require_workspace.CANONICAL_ROOT_MEMORY_FILENAME} as the canonical durable memory file.`,
		`Dreaming writes durable promotions to ${require_workspace.CANONICAL_ROOT_MEMORY_FILENAME}, so older facts in ${require_workspace.LEGACY_ROOT_MEMORY_FILENAME} can be shadowed.`,
		`Run "operator doctor --fix" to merge the legacy file into ${require_workspace.CANONICAL_ROOT_MEMORY_FILENAME} with a backup.`
	].join("\n");
	return null;
}
async function moveLegacyRootMemoryFileToArchive(params) {
	const repairDir = require_workspace.resolveRootMemoryRepairDir(params.workspaceDir);
	await node_fs.default.promises.mkdir(repairDir, { recursive: true });
	const archiveDir = node_path.default.join(repairDir, (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replaceAll(".", "-"));
	await node_fs.default.promises.mkdir(archiveDir, { recursive: true });
	const archivePath = node_path.default.join(archiveDir, require_workspace.LEGACY_ROOT_MEMORY_FILENAME);
	try {
		await node_fs.default.promises.rename(params.legacyPath, archivePath);
	} catch (err) {
		if (err?.code !== "EXDEV") throw err;
		await node_fs.default.promises.copyFile(params.legacyPath, archivePath);
		await node_fs.default.promises.unlink(params.legacyPath);
	}
	return archivePath;
}
function buildMergedLegacyRootMemorySection(params) {
	return [
		"",
		`## Imported From Legacy Root ${require_workspace.LEGACY_ROOT_MEMORY_FILENAME}`,
		"",
		`<!-- operator-root-memory-merge source=${require_workspace.LEGACY_ROOT_MEMORY_FILENAME} archived=${params.archivedLegacyPath} -->`,
		`This content came from legacy root \`${require_workspace.LEGACY_ROOT_MEMORY_FILENAME}\`, which was shadowed by \`${require_workspace.CANONICAL_ROOT_MEMORY_FILENAME}\`.`,
		"",
		params.legacyText.trim(),
		""
	].join("\n");
}
/** Archives and merges a legacy root memory file into canonical memory. */
async function migrateLegacyRootMemoryFile(workspaceDir) {
	const detection = await detectRootMemoryFiles(workspaceDir);
	if (!detection.canonicalExists || !detection.legacyExists) return {
		changed: false,
		canonicalPath: detection.canonicalPath,
		legacyPath: detection.legacyPath,
		removedLegacy: false,
		mergedLegacy: false
	};
	const archivedLegacyPath = await moveLegacyRootMemoryFileToArchive({
		workspaceDir: detection.workspaceDir,
		legacyPath: detection.legacyPath
	});
	const [canonicalText, legacyText] = await Promise.all([node_fs.default.promises.readFile(detection.canonicalPath, "utf-8"), node_fs.default.promises.readFile(archivedLegacyPath, "utf-8")]);
	if (canonicalText !== legacyText) {
		const merged = `${canonicalText.trimEnd()}\n${buildMergedLegacyRootMemorySection({
			legacyText,
			archivedLegacyPath: require_utils.shortenHomePath(archivedLegacyPath)
		})}`;
		await node_fs.default.promises.writeFile(detection.canonicalPath, merged, "utf-8");
	}
	return {
		changed: true,
		canonicalPath: detection.canonicalPath,
		legacyPath: detection.legacyPath,
		removedLegacy: true,
		mergedLegacy: canonicalText !== legacyText,
		archivedLegacyPath,
		...typeof detection.legacyBytes === "number" ? { copiedBytes: detection.legacyBytes } : {}
	};
}
/** Emits workspace root-memory health warnings. */
async function noteWorkspaceMemoryHealth(cfg) {
	try {
		const rootMemoryWarning = formatRootMemoryFilesWarning(await detectRootMemoryFiles(require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg))));
		if (rootMemoryWarning) require_note.note(rootMemoryWarning, "Workspace memory");
	} catch (err) {
		require_note.note(`Workspace memory audit could not be completed: ${require_errors.formatErrorMessage(err)}`, "Doctor");
	}
}
/** Prompts to merge legacy root memory into canonical memory when both files exist. */
async function maybeRepairWorkspaceMemoryHealth(params) {
	try {
		const agentId = require_agent_scope_config.resolveDefaultAgentId(params.cfg);
		const configuredWorkspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId);
		const rootMemoryFiles = await detectRootMemoryFiles(configuredWorkspaceDir);
		if (!rootMemoryFiles.canonicalExists || !rootMemoryFiles.legacyExists) return;
		if (!await params.prompter.confirmRuntimeRepair({
			message: `Merge legacy root memory.md into canonical MEMORY.md and remove the shadowed file?`,
			initialValue: true
		})) return;
		const migration = await migrateLegacyRootMemoryFile(configuredWorkspaceDir);
		if (!migration.changed) return;
		require_note.note([
			"Workspace memory root merged:",
			`- canonical: ${migration.canonicalPath}`,
			migration.archivedLegacyPath ? `- backup: ${migration.archivedLegacyPath}` : null,
			migration.mergedLegacy ? `- merged legacy content from: ${migration.legacyPath}` : null,
			migration.removedLegacy ? `- removed legacy file: ${migration.legacyPath}` : `- legacy file still present: ${migration.legacyPath}`
		].filter(Boolean).join("\n"), "Doctor changes");
	} catch (err) {
		require_note.note(`Workspace memory repair could not be completed: ${require_errors.formatErrorMessage(err)}`, "Doctor");
	}
}
//#endregion
exports.MEMORY_SYSTEM_PROMPT = MEMORY_SYSTEM_PROMPT;
exports.detectRootMemoryFiles = detectRootMemoryFiles;
exports.formatRootMemoryFilesWarning = formatRootMemoryFilesWarning;
exports.maybeRepairWorkspaceMemoryHealth = maybeRepairWorkspaceMemoryHealth;
exports.migrateLegacyRootMemoryFile = migrateLegacyRootMemoryFile;
exports.noteWorkspaceMemoryHealth = noteWorkspaceMemoryHealth;
exports.shouldSuggestMemorySystem = shouldSuggestMemorySystem;
