let node_fs = require("node:fs");
let node_path = require("node:path");
let node_url = require("node:url");
let node_os = require("node:os");
//#region src/agents/config.ts
/**
* Resolves package assets and per-user agent directories for the CLI/runtime.
*
* These helpers must work from source, dist, and Bun single-file binaries.
*/
const currentDir = (0, node_path.dirname)((0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href));
/**
* Detect if we're running as a Bun compiled binary.
* Bun binaries have import.meta.url containing "$bunfs", "~BUN", or "%7EBUN" (Bun's virtual filesystem path)
*/
const isBunBinary = require("url").pathToFileURL(__filename).href.includes("$bunfs") || require("url").pathToFileURL(__filename).href.includes("~BUN") || require("url").pathToFileURL(__filename).href.includes("%7EBUN");
/**
* Get the base directory for resolving package assets (themes, package.json, README.md, CHANGELOG.md).
* - For Bun binary: returns the directory containing the executable
* - For Node.js (dist/): returns currentDir (the dist/ directory)
* - For tsx (src/): returns parent directory (the package root)
*/
function getPackageDir() {
	const envDir = process.env.OPERATOR_PACKAGE_DIR;
	if (envDir) {
		if (envDir === "~") return (0, node_os.homedir)();
		if (envDir.startsWith("~/")) return (0, node_os.homedir)() + envDir.slice(1);
		return envDir;
	}
	if (isBunBinary) return (0, node_path.dirname)(process.execPath);
	let dir = currentDir;
	while (dir !== (0, node_path.dirname)(dir)) {
		if ((0, node_fs.existsSync)((0, node_path.join)(dir, "package.json"))) return dir;
		dir = (0, node_path.dirname)(dir);
	}
	return currentDir;
}
/** Get path to package.json */
function getPackageJsonPath() {
	return (0, node_path.join)(getPackageDir(), "package.json");
}
/** Get path to README.md */
function getReadmePath() {
	return (0, node_path.resolve)((0, node_path.join)(getPackageDir(), "README.md"));
}
/** Get path to docs directory */
function getDocsPath() {
	return (0, node_path.resolve)((0, node_path.join)(getPackageDir(), "docs"));
}
/** Get path to examples directory */
function getExamplesPath() {
	return (0, node_path.resolve)((0, node_path.join)(getPackageDir(), "examples"));
}
const pkg = JSON.parse((0, node_fs.readFileSync)(getPackageJsonPath(), "utf-8"));
const APP_NAME = pkg.operatorConfig?.name || "@gabrielvfonseca/operator";
const CONFIG_DIR_NAME = pkg.operatorConfig?.configDir || ".operator";
const VERSION = pkg.version || "0.0.0";
const ENV_AGENT_DIR = `${APP_NAME.toUpperCase()}_AGENT_DIR`;
function expandTildePath(path) {
	if (path === "~") return (0, node_os.homedir)();
	if (path.startsWith("~/")) return (0, node_os.homedir)() + path.slice(1);
	return path;
}
/** Get the agent config directory (e.g., ~/.operator/agent/) */
function getAgentDir() {
	const envDir = process.env[ENV_AGENT_DIR];
	if (envDir) return expandTildePath(envDir);
	return (0, node_path.join)((0, node_os.homedir)(), CONFIG_DIR_NAME, "agent");
}
/** Get path to managed binaries directory (fd, rg) */
function getBinDir() {
	return (0, node_path.join)(getAgentDir(), "bin");
}
/** Get path to sessions directory */
function getSessionsDir() {
	return (0, node_path.join)(getAgentDir(), "sessions");
}
//#endregion
Object.defineProperty(exports, "APP_NAME", {
	enumerable: true,
	get: function() {
		return APP_NAME;
	}
});
Object.defineProperty(exports, "CONFIG_DIR_NAME", {
	enumerable: true,
	get: function() {
		return CONFIG_DIR_NAME;
	}
});
Object.defineProperty(exports, "VERSION", {
	enumerable: true,
	get: function() {
		return VERSION;
	}
});
Object.defineProperty(exports, "getAgentDir", {
	enumerable: true,
	get: function() {
		return getAgentDir;
	}
});
Object.defineProperty(exports, "getBinDir", {
	enumerable: true,
	get: function() {
		return getBinDir;
	}
});
Object.defineProperty(exports, "getDocsPath", {
	enumerable: true,
	get: function() {
		return getDocsPath;
	}
});
Object.defineProperty(exports, "getExamplesPath", {
	enumerable: true,
	get: function() {
		return getExamplesPath;
	}
});
Object.defineProperty(exports, "getReadmePath", {
	enumerable: true,
	get: function() {
		return getReadmePath;
	}
});
Object.defineProperty(exports, "getSessionsDir", {
	enumerable: true,
	get: function() {
		return getSessionsDir;
	}
});
Object.defineProperty(exports, "isBunBinary", {
	enumerable: true,
	get: function() {
		return isBunBinary;
	}
});
