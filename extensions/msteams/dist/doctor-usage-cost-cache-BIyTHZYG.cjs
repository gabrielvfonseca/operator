const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_doctor_config_audit_scrub = require("./doctor-config-audit-scrub-BfYkq68H.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/commands/doctor-usage-cost-cache.ts
/** Doctor cleanup for rebuildable legacy usage-cost cache sidecars. */
const LEGACY_USAGE_COST_TEMP_GRACE_MS = 1e4;
function isLegacyUsageCostCacheTempName(name) {
	return /^\.usage-cost-cache\.\d+\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.tmp$/u.test(name) || /^\.usage-cost-cache(?:\.json)?\.\d+\.tmp$/u.test(name) || /^\.usage-cost-cache\.json\.lock\.\d+(?:\.\d+)?\.tmp$/u.test(name);
}
async function detectLegacyUsageCostCacheFiles(params) {
	const stateDir = require_paths.resolveStateDir(params?.env ?? process.env, params?.homedir ?? node_os.default.homedir);
	const sessionDirs = [node_path.default.join(stateDir, "sessions")];
	const agentsDir = node_path.default.join(stateDir, "agents");
	const agentEntries = await node_fs_promises.default.readdir(agentsDir, { withFileTypes: true }).catch(() => []);
	for (const entry of agentEntries) if (entry.isDirectory()) sessionDirs.push(node_path.default.join(agentsDir, entry.name, "sessions"));
	const files = [];
	for (const sessionDir of sessionDirs) {
		const entries = await node_fs_promises.default.readdir(sessionDir, { withFileTypes: true }).catch(() => []);
		for (const entry of entries) {
			if (!entry.isFile()) continue;
			const filePath = node_path.default.join(sessionDir, entry.name);
			if (entry.name === ".usage-cost-cache.json" || entry.name === ".usage-cost-cache.json.lock") {
				files.push(filePath);
				continue;
			}
			if (isLegacyUsageCostCacheTempName(entry.name)) {
				const stats = await node_fs_promises.default.stat(filePath).catch(() => null);
				if (stats && Date.now() - stats.mtimeMs >= LEGACY_USAGE_COST_TEMP_GRACE_MS) files.push(filePath);
			}
		}
	}
	return files.toSorted();
}
async function maybeRemoveLegacyUsageCostCacheFiles(params) {
	const files = await detectLegacyUsageCostCacheFiles(params);
	if (files.length === 0) return;
	if (!params.shouldRepair) {
		require_note.note(`${files.length} rebuildable usage-cost cache ${files.length === 1 ? "file remains" : "files remain"}. Run \`operator doctor --fix\` to remove ${files.length === 1 ? "it" : "them"}.`, "Usage cost cache");
		return;
	}
	const failures = [];
	for (const filePath of files) await node_fs_promises.default.rm(filePath, { force: true }).catch((error) => {
		failures.push(`${filePath}: ${String(error)}`);
	});
	if (failures.length > 0) {
		require_note.note(`Failed removing legacy usage-cost cache files:\n${failures.join("\n")}`, "Usage cost cache");
		return;
	}
	require_note.note(`Removed ${files.length} rebuildable legacy usage-cost cache ${files.length === 1 ? "file" : "files"}; SQLite rebuilds the cache on demand.`, "Usage cost cache");
}
async function maybeRemoveLegacySkillUploadTree(params) {
	const stateDir = require_paths.resolveStateDir(params.env ?? process.env, params.homedir ?? node_os.default.homedir);
	const uploadRoot = node_path.default.join(stateDir, "tmp", "skill-uploads");
	const stats = await node_fs_promises.default.lstat(uploadRoot).catch(() => null);
	if (!stats) return;
	if (!params.shouldRepair) {
		require_note.note("Legacy skill-upload staging remains. Run `operator doctor --fix` to discard it; active uploads now live in SQLite and must be retried.", "Skill uploads");
		return;
	}
	try {
		if (stats.isSymbolicLink()) await node_fs_promises.default.unlink(uploadRoot);
		else await node_fs_promises.default.rm(uploadRoot, {
			recursive: true,
			force: true
		});
	} catch (error) {
		require_note.note(`Failed removing legacy skill-upload staging: ${String(error)}`, "Skill uploads");
		return;
	}
	require_note.note("Removed legacy skill-upload staging; unfinished transient uploads must be retried.", "Skill uploads");
}
async function maybeRepairLegacyRuntimeFiles(shouldRepair, env) {
	await require_doctor_config_audit_scrub.maybeScrubConfigAuditLog({
		shouldRepair,
		env
	});
	await maybeRemoveLegacyUsageCostCacheFiles({
		shouldRepair,
		env
	});
	await maybeRemoveLegacySkillUploadTree({
		shouldRepair,
		env
	});
}
//#endregion
exports.maybeRepairLegacyRuntimeFiles = maybeRepairLegacyRuntimeFiles;
