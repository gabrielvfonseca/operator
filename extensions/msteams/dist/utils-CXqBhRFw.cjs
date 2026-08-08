const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./sleep-BVpvBXin.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
require("@gabrielvfonseca/normalization-core/record-coerce");
require("@gabrielvfonseca/normalization-core/utf16-slice");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/utils.ts
var utils_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	CONFIG_DIR: () => CONFIG_DIR,
	clamp: () => clamp,
	clampInt: () => clampInt,
	clampNumber: () => clampNumber,
	displayPath: () => displayPath,
	ensureDir: () => ensureDir,
	normalizeE164: () => normalizeE164,
	pathExists: () => pathExists,
	resolveConfigDir: () => resolveConfigDir,
	resolveHomeDir: () => resolveHomeDir,
	resolveUserPath: () => require_home_dir.resolveUserPath,
	shortenHomeInString: () => shortenHomeInString,
	shortenHomePath: () => shortenHomePath
});
/** Creates a directory tree if it does not already exist. */
async function ensureDir(dir) {
	await node_fs.default.promises.mkdir(dir, { recursive: true });
}
/** Clamps a number to an inclusive min/max range. */
function clampNumber(value, min, max) {
	return Math.max(min, Math.min(max, value));
}
/** Floors a number before clamping it to an inclusive min/max range. */
function clampInt(value, min, max) {
	return clampNumber(Math.floor(value), min, max);
}
/** Alias for clampNumber (shorter, more common name) */
const clamp = clampNumber;
/** Normalizes phone-like input into the loose E.164 shape used by channel helpers. */
function normalizeE164(number) {
	const digits = number.replace(/^[a-z][a-z0-9-]*:/i, "").trim().replace(/\D/g, "");
	return digits ? `+${digits}` : "";
}
/** Resolves the Operator config directory from state/config env overrides or home. */
function resolveConfigDir(env = process.env, homedir = node_os.default.homedir) {
	const override = env.OPERATOR_STATE_DIR?.trim();
	if (override) return require_home_dir.resolveUserPath(override, env, homedir);
	const configPath = env.OPERATOR_CONFIG_PATH?.trim();
	if (configPath) return node_path.default.dirname(require_home_dir.resolveUserPath(configPath, env, homedir));
	const newDir = node_path.default.join(require_home_dir.resolveRequiredHomeDir(env, homedir), ".operator");
	try {
		if (node_fs.default.existsSync(newDir)) return newDir;
	} catch {}
	return newDir;
}
/** Resolves the effective Operator home directory, if one can be determined. */
function resolveHomeDir() {
	return require_home_dir.resolveEffectiveHomeDir(process.env, node_os.default.homedir);
}
function resolveHomeDisplayPrefix() {
	const home = resolveHomeDir();
	if (!home) return;
	if (process.env.OPERATOR_HOME?.trim()) return {
		home,
		prefix: "$OPERATOR_HOME"
	};
	return {
		home,
		prefix: "~"
	};
}
/** Replaces the leading home directory in a path with `~` or `$OPERATOR_HOME`. */
function shortenHomePath(input) {
	if (!input) return input;
	const display = resolveHomeDisplayPrefix();
	if (!display) return input;
	const { home, prefix } = display;
	if (input === home) return prefix;
	if (input.startsWith(`${home}/`) || input.startsWith(`${home}\\`)) return `${prefix}${input.slice(home.length)}`;
	return input;
}
/** Replaces all effective-home occurrences inside a diagnostic string. */
function shortenHomeInString(input) {
	if (!input) return input;
	const display = resolveHomeDisplayPrefix();
	if (!display) return input;
	return input.split(display.home).join(display.prefix);
}
/** Shortens a path for display without changing non-home paths. */
function displayPath(input) {
	return shortenHomePath(input);
}
let CONFIG_DIR = resolveConfigDir();
/**
* Check if a file or directory exists at the given path.
*/
async function pathExists(targetPath) {
	return await (0, _openclaw_fs_safe_advanced.pathExists)(targetPath);
}
//#endregion
Object.defineProperty(exports, "CONFIG_DIR", {
	enumerable: true,
	get: function() {
		return CONFIG_DIR;
	}
});
Object.defineProperty(exports, "clamp", {
	enumerable: true,
	get: function() {
		return clamp;
	}
});
Object.defineProperty(exports, "clampInt", {
	enumerable: true,
	get: function() {
		return clampInt;
	}
});
Object.defineProperty(exports, "clampNumber", {
	enumerable: true,
	get: function() {
		return clampNumber;
	}
});
Object.defineProperty(exports, "displayPath", {
	enumerable: true,
	get: function() {
		return displayPath;
	}
});
Object.defineProperty(exports, "ensureDir", {
	enumerable: true,
	get: function() {
		return ensureDir;
	}
});
Object.defineProperty(exports, "normalizeE164", {
	enumerable: true,
	get: function() {
		return normalizeE164;
	}
});
Object.defineProperty(exports, "pathExists", {
	enumerable: true,
	get: function() {
		return pathExists;
	}
});
Object.defineProperty(exports, "resolveConfigDir", {
	enumerable: true,
	get: function() {
		return resolveConfigDir;
	}
});
Object.defineProperty(exports, "resolveHomeDir", {
	enumerable: true,
	get: function() {
		return resolveHomeDir;
	}
});
Object.defineProperty(exports, "shortenHomeInString", {
	enumerable: true,
	get: function() {
		return shortenHomeInString;
	}
});
Object.defineProperty(exports, "shortenHomePath", {
	enumerable: true,
	get: function() {
		return shortenHomePath;
	}
});
Object.defineProperty(exports, "utils_exports", {
	enumerable: true,
	get: function() {
		return utils_exports;
	}
});
