const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_install_safe_path = require("./install-safe-path-delEgqLr.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_crypto = require("node:crypto");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/install-paths.ts
/** Encodes arbitrary input as a safe plugin install filename. */
function safePluginInstallFileName(input) {
	return (0, _openclaw_fs_safe_advanced.safeDirName)(input);
}
/** Encodes a plugin id for use as an install directory name. */
function encodePluginInstallDirName(pluginId) {
	const trimmed = pluginId.trim();
	if (!trimmed.includes("/")) return (0, _openclaw_fs_safe_advanced.safeDirName)(trimmed);
	return `@${(0, _openclaw_fs_safe_advanced.safePathSegmentHashed)(trimmed)}`;
}
/** Validates a plugin id for install path safety. */
function validatePluginId(pluginId) {
	const trimmed = pluginId.trim();
	if (!trimmed) return "invalid plugin name: missing";
	if (trimmed.includes("\\")) return "invalid plugin name: path separators not allowed";
	const segments = trimmed.split("/");
	if (segments.some((segment) => !segment)) return "invalid plugin name: malformed scope";
	if (segments.some((segment) => segment === "." || segment === "..")) return "invalid plugin name: reserved path segment";
	if (segments.length === 1) {
		if (trimmed.startsWith("@")) return "invalid plugin name: scoped ids must use @scope/name format";
		return null;
	}
	if (segments.length !== 2) return "invalid plugin name: path separators not allowed";
	if (!segments[0]?.startsWith("@") || segments[0].length < 2) return "invalid plugin name: scoped ids must use @scope/name format";
	return null;
}
/** Checks whether an installed plugin id matches the expected id, including old npm keying. */
function matchesExpectedPluginId(params) {
	if (!params.expectedPluginId) return true;
	if (params.expectedPluginId === params.pluginId) return true;
	return !params.manifestPluginId && params.pluginId === params.npmPluginId && params.expectedPluginId === require_install_safe_path.unscopedPackageName(params.npmPluginId);
}
/** Resolves the default directory for path-installed plugin extensions. */
function resolveDefaultPluginExtensionsDir(env = process.env, homedir) {
	return node_path.default.join(require_utils.resolveConfigDir(env, homedir), "extensions");
}
/** Resolves the default directory for managed npm plugin installs. */
function resolveDefaultPluginNpmDir(env = process.env, homedir) {
	return node_path.default.join(require_utils.resolveConfigDir(env, homedir), "npm");
}
/** Encodes an npm package name into a managed npm project directory name. */
function encodePluginNpmProjectDirName(packageName) {
	const trimmed = packageName.trim();
	if (!trimmed) throw new Error("invalid npm package name: missing");
	return (0, _openclaw_fs_safe_advanced.safePathSegmentHashed)(trimmed);
}
/** Resolves the directory containing managed npm plugin projects. */
function resolvePluginNpmProjectsDir(npmDir) {
	const npmBase = npmDir ? require_home_dir.resolveUserPath(npmDir) : resolveDefaultPluginNpmDir();
	return node_path.default.join(npmBase, "projects");
}
/** Resolves the managed npm project directory for a package name. */
function resolvePluginNpmProjectDir(params) {
	return node_path.default.join(resolvePluginNpmProjectsDir(params.npmDir), encodePluginNpmProjectDirName(params.packageName));
}
const PLUGIN_NPM_GENERATION_PROJECT_SEPARATOR = "__operator-generation__";
const PLUGIN_NPM_GENERATION_KEY_HASH_CHARS = 16;
/** Resolves the managed npm artifact-generation project directory prefix for a package. */
function resolvePluginNpmGenerationProjectDirPrefix(packageName) {
	return `${encodePluginNpmProjectDirName(packageName)}${PLUGIN_NPM_GENERATION_PROJECT_SEPARATOR}`;
}
/** Encodes a package generation fingerprint into a compact project directory suffix. */
function encodePluginNpmGenerationKeyDirName(generationKey) {
	return `g-${(0, node_crypto.createHash)("sha256").update(generationKey).digest("hex").slice(0, PLUGIN_NPM_GENERATION_KEY_HASH_CHARS)}`;
}
/** Resolves an artifact-generation-specific managed npm project directory. */
function resolvePluginNpmGenerationProjectDir(params) {
	return node_path.default.join(resolvePluginNpmProjectsDir(params.npmDir), `${resolvePluginNpmGenerationProjectDirPrefix(params.packageName)}${encodePluginNpmGenerationKeyDirName(params.generationKey)}`);
}
/** Resolves the installed node_modules package directory for a managed npm plugin. */
function resolvePluginNpmPackageDir(params) {
	return node_path.default.join(resolvePluginNpmProjectDir(params), "node_modules", ...params.packageName.split("/"));
}
/** Resolves the default directory for git-installed plugins. */
function resolveDefaultPluginGitDir(env = process.env, homedir) {
	return node_path.default.join(require_utils.resolveConfigDir(env, homedir), "git");
}
/** Resolves the safe install directory for one plugin id. */
function resolvePluginInstallDir(pluginId, extensionsDir) {
	const extensionsBase = extensionsDir ? require_home_dir.resolveUserPath(extensionsDir) : resolveDefaultPluginExtensionsDir();
	const pluginIdError = validatePluginId(pluginId);
	if (pluginIdError) throw new Error(pluginIdError);
	const targetDirResult = (0, _openclaw_fs_safe_advanced.resolveSafeInstallDir)({
		baseDir: extensionsBase,
		id: pluginId,
		invalidNameMessage: "invalid plugin name: path traversal detected",
		nameEncoder: encodePluginInstallDirName
	});
	if (!targetDirResult.ok) throw new Error(targetDirResult.error);
	return targetDirResult.path;
}
//#endregion
Object.defineProperty(exports, "encodePluginInstallDirName", {
	enumerable: true,
	get: function() {
		return encodePluginInstallDirName;
	}
});
Object.defineProperty(exports, "matchesExpectedPluginId", {
	enumerable: true,
	get: function() {
		return matchesExpectedPluginId;
	}
});
Object.defineProperty(exports, "resolveDefaultPluginExtensionsDir", {
	enumerable: true,
	get: function() {
		return resolveDefaultPluginExtensionsDir;
	}
});
Object.defineProperty(exports, "resolveDefaultPluginGitDir", {
	enumerable: true,
	get: function() {
		return resolveDefaultPluginGitDir;
	}
});
Object.defineProperty(exports, "resolveDefaultPluginNpmDir", {
	enumerable: true,
	get: function() {
		return resolveDefaultPluginNpmDir;
	}
});
Object.defineProperty(exports, "resolvePluginInstallDir", {
	enumerable: true,
	get: function() {
		return resolvePluginInstallDir;
	}
});
Object.defineProperty(exports, "resolvePluginNpmGenerationProjectDir", {
	enumerable: true,
	get: function() {
		return resolvePluginNpmGenerationProjectDir;
	}
});
Object.defineProperty(exports, "resolvePluginNpmGenerationProjectDirPrefix", {
	enumerable: true,
	get: function() {
		return resolvePluginNpmGenerationProjectDirPrefix;
	}
});
Object.defineProperty(exports, "resolvePluginNpmPackageDir", {
	enumerable: true,
	get: function() {
		return resolvePluginNpmPackageDir;
	}
});
Object.defineProperty(exports, "resolvePluginNpmProjectDir", {
	enumerable: true,
	get: function() {
		return resolvePluginNpmProjectDir;
	}
});
Object.defineProperty(exports, "resolvePluginNpmProjectsDir", {
	enumerable: true,
	get: function() {
		return resolvePluginNpmProjectsDir;
	}
});
Object.defineProperty(exports, "safePluginInstallFileName", {
	enumerable: true,
	get: function() {
		return safePluginInstallFileName;
	}
});
Object.defineProperty(exports, "validatePluginId", {
	enumerable: true,
	get: function() {
		return validatePluginId;
	}
});
