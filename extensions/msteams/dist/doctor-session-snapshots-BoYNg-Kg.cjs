const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_json_files = require("./json-files-Bp0Z4DKb.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
const require_bundled_dir = require("./bundled-dir-CUirCLGi.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/commands/doctor-session-snapshots.ts
/** Doctor repair for stale runtime snapshot paths cached in session stores. */
const SESSION_SNAPSHOTS_CHECK_ID = "core/doctor/session-snapshots";
function resolveSessionSnapshotBundledSkillsDir(params) {
	const explicit = params?.bundledSkillsDir?.trim();
	if (explicit) return explicit;
	const resolved = require_bundled_dir.resolveBundledSkillsDir({
		argv1: params?.argv1,
		moduleUrl: params?.moduleUrl,
		cwd: params?.cwd,
		execPath: params?.execPath
	});
	if (resolved) return resolved;
	const packageRoot = require_openclaw_root.resolveOperatorPackageRootSync({
		argv1: params?.argv1 ?? process.argv[1],
		moduleUrl: params?.moduleUrl ?? require("url").pathToFileURL(__filename).href,
		cwd: params?.cwd ?? process.cwd()
	});
	return packageRoot ? node_path.default.join(packageRoot, "skills") : void 0;
}
function decodeXmlText(value) {
	return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}
function extractSkillLocations(prompt) {
	if (typeof prompt !== "string" || !prompt.trim()) return [];
	const locations = [];
	for (const match of prompt.matchAll(/<location>([\s\S]*?)<\/location>/g)) {
		const raw = match[1]?.trim();
		if (raw) locations.push(decodeXmlText(raw));
	}
	return locations;
}
function collectResolvedSkillPaths(value) {
	if (!Array.isArray(value)) return [];
	const paths = [];
	for (const skill of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(skill)) continue;
		if (typeof skill.filePath === "string" && skill.filePath.trim()) paths.push(skill.filePath.trim());
		if (typeof skill.baseDir === "string" && skill.baseDir.trim()) paths.push(node_path.default.join(skill.baseDir.trim(), "SKILL.md"));
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(skill.sourceInfo)) {
			if (typeof skill.sourceInfo.path === "string" && skill.sourceInfo.path.trim()) paths.push(skill.sourceInfo.path.trim());
			if (typeof skill.sourceInfo.baseDir === "string" && skill.sourceInfo.baseDir.trim()) paths.push(node_path.default.join(skill.sourceInfo.baseDir.trim(), "SKILL.md"));
		}
	}
	return paths;
}
function collectInjectedWorkspaceFilePaths(value) {
	if (!Array.isArray(value)) return [];
	return value.map((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) && typeof entry.path === "string" ? entry.path.trim() : "").filter(Boolean);
}
function collectCachedSnapshotPaths(entry) {
	const snapshot = entry.skillsSnapshot;
	const report = entry.systemPromptReport;
	const paths = [];
	for (const location of extractSkillLocations(snapshot?.prompt)) paths.push({
		field: "skillsSnapshot.prompt",
		path: location
	});
	for (const location of collectResolvedSkillPaths(snapshot?.resolvedSkills)) paths.push({
		field: "skillsSnapshot.resolvedSkills",
		path: location
	});
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(report)) for (const location of collectInjectedWorkspaceFilePaths(report.injectedWorkspaceFiles)) paths.push({
		field: "systemPromptReport.injectedWorkspaceFiles",
		path: location
	});
	return paths;
}
function isAbsolutePathLike(value) {
	return node_path.default.isAbsolute(value) || node_path.default.win32.isAbsolute(value);
}
function splitPathSegments(value) {
	return value.replace(/^[a-z]:/i, "").replaceAll("\\", "/").split("/").filter(Boolean);
}
function isWindowsAbsolutePath(value) {
	return /^[a-z]:/i.test(value) && ["/", "\\"].includes(value.slice(2, 3)) || value.startsWith("\\\\");
}
function isTempBackedOperatorRoot(segments) {
	const lower = segments.map((segment) => segment.toLowerCase());
	const openclawIndex = lower.lastIndexOf("@gabrielvfonseca/operator");
	if (openclawIndex < 1) return false;
	return lower[openclawIndex - 1] === "tmp" || lower[openclawIndex - 1] === "temp";
}
function isBundledRuntimeSkillsPath(cachedPath, skillRootIndex) {
	const beforeSkillRoot = splitPathSegments(cachedPath).slice(0, skillRootIndex);
	return beforeSkillRoot.map((segment) => segment.toLowerCase()).some((segment) => segment === "dist-runtime" || segment === "node_modules" || segment.startsWith("openclaw@")) || isTempBackedOperatorRoot(beforeSkillRoot);
}
function extractBundledSkillRelativeSegments(cachedPath) {
	const segments = splitPathSegments(cachedPath);
	const skillRootIndex = segments.lastIndexOf("skills");
	if (skillRootIndex < 0 || !isBundledRuntimeSkillsPath(cachedPath, skillRootIndex)) return;
	const relativeSegments = segments.slice(skillRootIndex + 1);
	if (relativeSegments.length < 2 || relativeSegments.at(-1) !== "SKILL.md") return;
	return relativeSegments;
}
function isInsidePath(baseDir, candidatePath) {
	const baseIsWindows = isWindowsAbsolutePath(baseDir);
	if (baseIsWindows !== isWindowsAbsolutePath(candidatePath)) return false;
	const pathApi = baseIsWindows ? node_path.default.win32 : node_path.default;
	const relative = pathApi.relative(pathApi.resolve(baseDir), pathApi.resolve(candidatePath));
	return relative === "" || relative !== "" && !relative.startsWith("..") && !pathApi.isAbsolute(relative);
}
function joinPathForRoot(root, ...segments) {
	return isWindowsAbsolutePath(root) ? node_path.default.win32.join(root, ...segments) : node_path.default.join(root, ...segments);
}
function resolveExpectedBundledSkillPath(params) {
	const expandedCachedPath = require_home_dir.expandHomePrefix(params.cachedPath, {
		home: params.homeDir,
		env: params.env
	});
	if (!isAbsolutePathLike(expandedCachedPath)) return;
	const relativeSegments = extractBundledSkillRelativeSegments(expandedCachedPath);
	if (!relativeSegments) return;
	const movedPath = resolveMovedBundledSkillPath({
		relativeSegments,
		pathExists: params.pathExists,
		env: params.env
	});
	if (movedPath) return movedPath;
	if (isInsidePath(params.bundledSkillsDir, expandedCachedPath)) return;
	const expectedPath = joinPathForRoot(params.bundledSkillsDir, ...relativeSegments);
	if (params.pathExists(expectedPath)) return expectedPath;
}
function resolveMovedBundledSkillPath(params) {
	if (params.relativeSegments.join("/") !== "imsg/SKILL.md") return;
	const expectedPath = node_path.default.join(require_utils.resolveConfigDir(params.env), "plugin-skills", "imsg", "SKILL.md");
	return params.pathExists(expectedPath) ? expectedPath : void 0;
}
/** Finds cached bundled-skill paths that point at old runtime/temp package roots. */
function scanSessionStoreForStaleRuntimeSnapshotPaths(params) {
	const bundledSkillsDir = params.bundledSkillsDir?.trim();
	if (!bundledSkillsDir) return [];
	const pathExists = params.pathExists ?? node_fs.default.existsSync;
	const findings = [];
	const seen = /* @__PURE__ */ new Set();
	for (const [sessionKey, entry] of Object.entries(params.store)) {
		if (!entry || typeof entry !== "object") continue;
		for (const cached of collectCachedSnapshotPaths(entry)) {
			const expectedPath = resolveExpectedBundledSkillPath({
				cachedPath: cached.path,
				bundledSkillsDir,
				pathExists,
				homeDir: params.homeDir,
				env: params.env
			});
			if (!expectedPath) continue;
			const key = `${sessionKey}\0${cached.field}\0${cached.path}`;
			if (seen.has(key)) continue;
			seen.add(key);
			findings.push({
				sessionKey,
				field: cached.field,
				cachedPath: cached.path,
				expectedPath
			});
		}
	}
	return findings;
}
async function listSessionStorePaths(stateDir) {
	const agentsDir = node_path.default.join(stateDir, "agents");
	let agentEntries;
	try {
		agentEntries = await node_fs.default.promises.readdir(agentsDir, { withFileTypes: true });
	} catch {
		return [];
	}
	return agentEntries.filter((entry) => entry.isDirectory()).map((entry) => node_path.default.join(agentsDir, entry.name, "sessions", "sessions.json")).filter((storePath) => node_fs.default.existsSync(storePath)).toSorted((a, b) => a.localeCompare(b));
}
function resolveSessionStorePaths(params) {
	if (!params.cfg) return;
	return require_targets.resolveAllAgentSessionStoreTargetsSync(params.cfg, { env: params.env }).map((target) => target.storePath).filter((storePath) => node_fs.default.existsSync(storePath)).toSorted((a, b) => a.localeCompare(b));
}
function loadSessionStoreForSnapshotScan(storePath) {
	const parsed = JSON.parse(node_fs.default.readFileSync(storePath, "utf-8"));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed)) return {};
	const store = parsed;
	require_store.hydrateSessionStoreSkillPromptRefs({
		storePath,
		store
	});
	return store;
}
async function detectSessionSnapshotHealthIssues(params) {
	const bundledSkillsDir = resolveSessionSnapshotBundledSkillsDir({ bundledSkillsDir: params?.bundledSkillsDir });
	if (!bundledSkillsDir) return [];
	const storePaths = params?.storePaths ?? resolveSessionStorePaths({
		cfg: params?.cfg,
		env: params?.env
	}) ?? await listSessionStorePaths(require_paths.resolveStateDir(params?.env));
	const issues = [];
	for (const storePath of storePaths) {
		let store;
		try {
			store = loadSessionStoreForSnapshotScan(storePath);
		} catch {
			continue;
		}
		const findings = scanSessionStoreForStaleRuntimeSnapshotPaths({
			store,
			bundledSkillsDir,
			env: params?.env
		});
		for (const finding of findings) issues.push({
			sessionKey: finding.sessionKey,
			field: finding.field,
			cachedPath: finding.cachedPath,
			expectedPath: finding.expectedPath,
			storePath
		});
	}
	return issues;
}
function sessionSnapshotIssueToHealthFinding(issue) {
	return {
		checkId: SESSION_SNAPSHOTS_CHECK_ID,
		severity: "info",
		message: `${issue.sessionKey} cached session metadata references an inactive runtime root that can be cleaned up.`,
		path: issue.storePath,
		target: issue.cachedPath,
		requirement: `Current bundled skill path: ${issue.expectedPath}`,
		fixHint: "To clean up the advisory artifact, run `openclaw doctor --fix` to rewrite stale cached session metadata paths, or start a fresh session after confirming history can be retired."
	};
}
function sessionSnapshotIssueToRepairEffect(issue) {
	return {
		kind: "file",
		action: "would-rewrite-session-snapshot-path",
		target: issue.storePath,
		dryRunSafe: false
	};
}
/** Replaces stale paths in raw, JSON-escaped, and XML-escaped prompt text. */
function replaceStalePathsInText(text, finding) {
	const jsonEscaped = JSON.stringify(finding.cachedPath).slice(1, -1);
	const jsonEscapedExpected = JSON.stringify(finding.expectedPath).slice(1, -1);
	const xmlEscaped = finding.cachedPath.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
	const xmlEscapedExpected = finding.expectedPath.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
	let result = text;
	if (result.includes(jsonEscaped)) result = result.replaceAll(jsonEscaped, jsonEscapedExpected);
	if (result.includes(xmlEscaped)) result = result.replaceAll(xmlEscaped, xmlEscapedExpected);
	if (result.includes(finding.cachedPath)) result = result.replaceAll(finding.cachedPath, finding.expectedPath);
	return result;
}
function repairFreshSessionSnapshotPaths(params) {
	let replacements = 0;
	for (const finding of params.findings) {
		if (finding.field === "skillsSnapshot.resolvedSkills") {
			const rawSession = params.rawStore[finding.sessionKey];
			const rawSnapshot = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawSession) ? rawSession.skillsSnapshot : void 0;
			if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawSnapshot) && Array.isArray(rawSnapshot.resolvedSkills)) replacements += 1;
			continue;
		}
		const session = params.store[finding.sessionKey];
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(session)) continue;
		const jsonEscaped = JSON.stringify(finding.cachedPath).slice(1, -1);
		const jsonEscapedExpected = JSON.stringify(finding.expectedPath).slice(1, -1);
		if (finding.field === "skillsSnapshot.prompt") {
			const snapshot = session.skillsSnapshot;
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(snapshot) || typeof snapshot.prompt !== "string") continue;
			const prompt = replaceStalePathsInText(snapshot.prompt, finding);
			if (prompt !== snapshot.prompt) {
				snapshot.prompt = prompt;
				replacements += 1;
			}
			continue;
		}
		const report = session.systemPromptReport;
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(report) || !Array.isArray(report.injectedWorkspaceFiles)) continue;
		for (const entry of report.injectedWorkspaceFiles) {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) || typeof entry.path !== "string") continue;
			let entryPath = entry.path;
			const original = entryPath;
			for (const { cached, expected } of [{
				cached: jsonEscaped,
				expected: jsonEscapedExpected
			}, {
				cached: finding.cachedPath,
				expected: finding.expectedPath
			}]) if (entryPath.includes(cached)) entryPath = entryPath.replaceAll(cached, expected);
			if (entryPath !== original) {
				entry.path = entryPath;
				replacements += 1;
			}
		}
	}
	return replacements;
}
/** Reports and optionally repairs stale bundled skill paths in session snapshot metadata. */
async function noteSessionSnapshotHealth(params) {
	const bundledSkillsDir = resolveSessionSnapshotBundledSkillsDir({ bundledSkillsDir: params?.bundledSkillsDir });
	if (!bundledSkillsDir) return;
	const storePaths = params?.storePaths ?? resolveSessionStorePaths({
		cfg: params?.cfg,
		env: params?.env
	}) ?? await listSessionStorePaths(require_paths.resolveStateDir(params?.env));
	const findingsByStore = /* @__PURE__ */ new Map();
	for (const storePath of storePaths) {
		let store;
		try {
			store = loadSessionStoreForSnapshotScan(storePath);
		} catch (err) {
			require_note.note(`- Failed to inspect session snapshot metadata in ${require_utils.shortenHomePath(storePath)}: ${String(err)}`, "Session snapshots");
			continue;
		}
		const findings = scanSessionStoreForStaleRuntimeSnapshotPaths({
			store,
			bundledSkillsDir,
			env: params?.env
		});
		if (findings.length > 0) findingsByStore.set(storePath, findings);
	}
	const totalFindings = [...findingsByStore.values()].reduce((total, findings) => total + findings.length, 0);
	if (totalFindings === 0) return;
	const affectedSessions = new Set([...findingsByStore.values()].flatMap((findings) => findings.map((finding) => finding.sessionKey)));
	if (params?.shouldRepair) {
		let repairedStores = 0;
		let totalReplacements = 0;
		let leftoverFindings = 0;
		for (const [storePath, findings] of findingsByStore) try {
			const repairResult = await require_store.updateSessionStore(storePath, async (store) => {
				const raw = node_fs.default.readFileSync(storePath, "utf-8");
				const parsed = JSON.parse(raw);
				const replacements = repairFreshSessionSnapshotPaths({
					store,
					rawStore: (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) ? parsed : {},
					findings
				});
				if (replacements > 0) await require_json_files.writeTextAtomic(`${storePath}.bak.${Date.now()}`, raw, { mode: 384 });
				return { replacements };
			}, {
				requireWriteSuccess: true,
				skipMaintenance: true,
				skipSaveWhenResult: (result) => result.replacements === 0
			});
			if (repairResult.replacements > 0) {
				totalReplacements += repairResult.replacements;
				repairedStores++;
				const leftovers = scanSessionStoreForStaleRuntimeSnapshotPaths({
					store: loadSessionStoreForSnapshotScan(storePath),
					bundledSkillsDir,
					env: params?.env
				});
				leftoverFindings += leftovers.length;
			}
		} catch (err) {
			require_note.note(`- Failed to repair session snapshot paths in ${require_utils.shortenHomePath(storePath)}: ${String(err)}`, "Session snapshots");
		}
		if (repairedStores > 0) {
			const msg = `- Repaired ${totalReplacements} stale path${totalReplacements === 1 ? "" : "s"} across ${repairedStores} store${repairedStores === 1 ? "" : "s"}.`;
			if (leftoverFindings > 0) require_note.note(`${msg}\n  ${leftoverFindings} stale path${leftoverFindings === 1 ? "" : "s"} still remain (possibly non-bundled or non-repairable).`, "Session snapshots");
			else require_note.note(msg, "Session snapshots");
			return;
		}
	}
	const lines = [
		`- Found ${affectedSessions.size} session${affectedSessions.size === 1 ? "" : "s"} with stale cached session metadata paths.`,
		`  Live bundled skills root is healthy: ${require_utils.shortenHomePath(bundledSkillsDir)}`,
		"  Cached session metadata still references an inactive runtime root; start a fresh session or reset the affected long-lived sessions after confirming history can be retired."
	];
	let shown = 0;
	for (const [storePath, findings] of findingsByStore) {
		lines.push(`  Store: ${require_utils.shortenHomePath(storePath)}`);
		for (const finding of findings.slice(0, Math.max(0, 10 - shown))) {
			lines.push(`  - ${finding.sessionKey} ${finding.field}: ${require_utils.shortenHomePath(finding.cachedPath)} -> ${require_utils.shortenHomePath(finding.expectedPath)}`);
			shown += 1;
			if (shown >= 10) break;
		}
		if (shown >= 10) break;
	}
	if (totalFindings > shown) lines.push(`  ...and ${totalFindings - shown} more stale cached path${totalFindings - shown === 1 ? "" : "s"}.`);
	require_note.note(lines.join("\n"), "Session snapshots");
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.doctorSessionSnapshotsTestApi")] = {
	resolveSessionSnapshotBundledSkillsDir,
	scanSessionStoreForStaleRuntimeSnapshotPaths
};
//#endregion
exports.detectSessionSnapshotHealthIssues = detectSessionSnapshotHealthIssues;
exports.noteSessionSnapshotHealth = noteSessionSnapshotHealth;
exports.sessionSnapshotIssueToHealthFinding = sessionSnapshotIssueToHealthFinding;
exports.sessionSnapshotIssueToRepairEffect = sessionSnapshotIssueToRepairEffect;
