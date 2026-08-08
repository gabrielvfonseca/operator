const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
require("./path-guards-CMMkJCy0.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/skills/loading/symlink-targets.ts
function resolveAllowedSkillSymlinkTargetRealPaths(config) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((config?.skills?.load?.allowSymlinkTargets ?? []).map((dir) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(dir) ?? "").filter(Boolean).map((dir) => tryRealpath(require_home_dir.resolveUserPath(dir))).filter((dir) => Boolean(dir)));
}
function findContainingAllowedSkillSymlinkTarget(rootRealPaths, candidateRealPath) {
	const resolvedCandidate = node_path.default.resolve(candidateRealPath);
	for (const rootRealPath of rootRealPaths) {
		const resolvedRoot = node_path.default.resolve(rootRealPath);
		if ((0, _openclaw_fs_safe_path.isPathInside)(resolvedRoot, resolvedCandidate)) return resolvedRoot;
	}
	return null;
}
function tryRealpath(filePath) {
	try {
		return node_fs.default.realpathSync(filePath);
	} catch {
		return null;
	}
}
//#endregion
Object.defineProperty(exports, "findContainingAllowedSkillSymlinkTarget", {
	enumerable: true,
	get: function() {
		return findContainingAllowedSkillSymlinkTarget;
	}
});
Object.defineProperty(exports, "resolveAllowedSkillSymlinkTargetRealPaths", {
	enumerable: true,
	get: function() {
		return resolveAllowedSkillSymlinkTargetRealPaths;
	}
});
Object.defineProperty(exports, "tryRealpath", {
	enumerable: true,
	get: function() {
		return tryRealpath;
	}
});
