const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/agents/sandbox/constants.ts
/**
* Sandbox defaults and state paths.
*
* Centralizes image names, container prefixes, workspace paths, browser ports, and registry locations.
*/
var constants_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	DEFAULT_SANDBOX_BROWSER_AUTOSTART_TIMEOUT_MS: () => DEFAULT_SANDBOX_BROWSER_AUTOSTART_TIMEOUT_MS,
	DEFAULT_SANDBOX_BROWSER_CDP_PORT: () => DEFAULT_SANDBOX_BROWSER_CDP_PORT,
	DEFAULT_SANDBOX_BROWSER_IMAGE: () => DEFAULT_SANDBOX_BROWSER_IMAGE,
	DEFAULT_SANDBOX_BROWSER_NETWORK: () => DEFAULT_SANDBOX_BROWSER_NETWORK,
	DEFAULT_SANDBOX_BROWSER_NOVNC_PORT: () => DEFAULT_SANDBOX_BROWSER_NOVNC_PORT,
	DEFAULT_SANDBOX_BROWSER_PREFIX: () => DEFAULT_SANDBOX_BROWSER_PREFIX,
	DEFAULT_SANDBOX_BROWSER_VNC_PORT: () => DEFAULT_SANDBOX_BROWSER_VNC_PORT,
	DEFAULT_SANDBOX_COMMON_IMAGE: () => DEFAULT_SANDBOX_COMMON_IMAGE,
	DEFAULT_SANDBOX_CONTAINER_PREFIX: () => DEFAULT_SANDBOX_CONTAINER_PREFIX,
	DEFAULT_SANDBOX_IDLE_HOURS: () => 24,
	DEFAULT_SANDBOX_IMAGE: () => DEFAULT_SANDBOX_IMAGE,
	DEFAULT_SANDBOX_MAX_AGE_DAYS: () => 7,
	DEFAULT_SANDBOX_WORKDIR: () => DEFAULT_SANDBOX_WORKDIR,
	DEFAULT_SANDBOX_WORKSPACE_ROOT: () => DEFAULT_SANDBOX_WORKSPACE_ROOT,
	DEFAULT_TOOL_ALLOW: () => DEFAULT_TOOL_ALLOW,
	DEFAULT_TOOL_DENY: () => DEFAULT_TOOL_DENY,
	SANDBOX_AGENT_WORKSPACE_MOUNT: () => SANDBOX_AGENT_WORKSPACE_MOUNT,
	SANDBOX_BROWSERS_DIR: () => SANDBOX_BROWSERS_DIR,
	SANDBOX_BROWSER_IMAGE_CONTRACT_EPOCH: () => SANDBOX_BROWSER_IMAGE_CONTRACT_EPOCH,
	SANDBOX_BROWSER_REGISTRY_PATH: () => SANDBOX_BROWSER_REGISTRY_PATH,
	SANDBOX_BROWSER_SECURITY_HASH_EPOCH: () => SANDBOX_BROWSER_SECURITY_HASH_EPOCH,
	SANDBOX_COMMAND_MAX_BUFFER_BYTES: () => SANDBOX_COMMAND_MAX_BUFFER_BYTES,
	SANDBOX_CONTAINERS_DIR: () => SANDBOX_CONTAINERS_DIR,
	SANDBOX_DOCKER_CREATE_ARGS_EPOCH: () => SANDBOX_DOCKER_CREATE_ARGS_EPOCH,
	SANDBOX_REGISTRY_PATH: () => SANDBOX_REGISTRY_PATH,
	SANDBOX_STATE_DIR: () => SANDBOX_STATE_DIR
});
const DEFAULT_SANDBOX_WORKSPACE_ROOT = node_path.default.join(require_paths.STATE_DIR, "sandboxes");
const DEFAULT_SANDBOX_IMAGE = "operator-sandbox:bookworm-slim";
const DEFAULT_SANDBOX_CONTAINER_PREFIX = "operator-sbx-";
const DEFAULT_SANDBOX_WORKDIR = "/workspace";
const DEFAULT_SANDBOX_IDLE_HOURS = 24;
const DEFAULT_SANDBOX_MAX_AGE_DAYS = 7;
const SANDBOX_COMMAND_MAX_BUFFER_BYTES = 100 * 1024 * 1024;
const DEFAULT_TOOL_ALLOW = [
	"exec",
	"process",
	"read",
	"write",
	"edit",
	"apply_patch",
	"image",
	"sessions_list",
	"sessions_history",
	"sessions_search",
	"sessions_send",
	"sessions_spawn",
	"sessions_yield",
	"subagents",
	"session_status"
];
const DEFAULT_TOOL_DENY = [
	"browser",
	"canvas",
	"computer",
	"nodes",
	"cron",
	"gateway",
	...require_ids.CHANNEL_IDS
];
const DEFAULT_SANDBOX_BROWSER_IMAGE = "operator-sandbox-browser:bookworm-slim";
const DEFAULT_SANDBOX_COMMON_IMAGE = "operator-sandbox-common:bookworm-slim";
const SANDBOX_BROWSER_SECURITY_HASH_EPOCH = "2026-05-12-cdp-relay-auth";
const SANDBOX_BROWSER_IMAGE_CONTRACT_EPOCH = "2026-05-12-cdp-relay-auth";
const SANDBOX_DOCKER_CREATE_ARGS_EPOCH = "2026-07-10-init";
const DEFAULT_SANDBOX_BROWSER_PREFIX = "operator-sbx-browser-";
const DEFAULT_SANDBOX_BROWSER_NETWORK = "operator-sandbox-browser";
const DEFAULT_SANDBOX_BROWSER_CDP_PORT = 9222;
const DEFAULT_SANDBOX_BROWSER_VNC_PORT = 5900;
const DEFAULT_SANDBOX_BROWSER_NOVNC_PORT = 6080;
const DEFAULT_SANDBOX_BROWSER_AUTOSTART_TIMEOUT_MS = 12e3;
const SANDBOX_AGENT_WORKSPACE_MOUNT = "/agent";
const SANDBOX_STATE_DIR = node_path.default.join(require_paths.STATE_DIR, "sandbox");
const SANDBOX_REGISTRY_PATH = node_path.default.join(SANDBOX_STATE_DIR, "containers.json");
const SANDBOX_BROWSER_REGISTRY_PATH = node_path.default.join(SANDBOX_STATE_DIR, "browsers.json");
const SANDBOX_CONTAINERS_DIR = node_path.default.join(SANDBOX_STATE_DIR, "containers");
const SANDBOX_BROWSERS_DIR = node_path.default.join(SANDBOX_STATE_DIR, "browsers");
//#endregion
Object.defineProperty(exports, "DEFAULT_SANDBOX_BROWSER_AUTOSTART_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_BROWSER_AUTOSTART_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_BROWSER_CDP_PORT", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_BROWSER_CDP_PORT;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_BROWSER_IMAGE", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_BROWSER_IMAGE;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_BROWSER_NETWORK", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_BROWSER_NETWORK;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_BROWSER_NOVNC_PORT", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_BROWSER_NOVNC_PORT;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_BROWSER_PREFIX", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_BROWSER_PREFIX;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_BROWSER_VNC_PORT", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_BROWSER_VNC_PORT;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_COMMON_IMAGE", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_COMMON_IMAGE;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_CONTAINER_PREFIX", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_CONTAINER_PREFIX;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_IDLE_HOURS", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_IDLE_HOURS;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_IMAGE", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_IMAGE;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_MAX_AGE_DAYS", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_MAX_AGE_DAYS;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_WORKDIR", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_WORKDIR;
	}
});
Object.defineProperty(exports, "DEFAULT_SANDBOX_WORKSPACE_ROOT", {
	enumerable: true,
	get: function() {
		return DEFAULT_SANDBOX_WORKSPACE_ROOT;
	}
});
Object.defineProperty(exports, "DEFAULT_TOOL_ALLOW", {
	enumerable: true,
	get: function() {
		return DEFAULT_TOOL_ALLOW;
	}
});
Object.defineProperty(exports, "DEFAULT_TOOL_DENY", {
	enumerable: true,
	get: function() {
		return DEFAULT_TOOL_DENY;
	}
});
Object.defineProperty(exports, "SANDBOX_AGENT_WORKSPACE_MOUNT", {
	enumerable: true,
	get: function() {
		return SANDBOX_AGENT_WORKSPACE_MOUNT;
	}
});
Object.defineProperty(exports, "SANDBOX_BROWSERS_DIR", {
	enumerable: true,
	get: function() {
		return SANDBOX_BROWSERS_DIR;
	}
});
Object.defineProperty(exports, "SANDBOX_BROWSER_IMAGE_CONTRACT_EPOCH", {
	enumerable: true,
	get: function() {
		return SANDBOX_BROWSER_IMAGE_CONTRACT_EPOCH;
	}
});
Object.defineProperty(exports, "SANDBOX_BROWSER_REGISTRY_PATH", {
	enumerable: true,
	get: function() {
		return SANDBOX_BROWSER_REGISTRY_PATH;
	}
});
Object.defineProperty(exports, "SANDBOX_BROWSER_SECURITY_HASH_EPOCH", {
	enumerable: true,
	get: function() {
		return SANDBOX_BROWSER_SECURITY_HASH_EPOCH;
	}
});
Object.defineProperty(exports, "SANDBOX_COMMAND_MAX_BUFFER_BYTES", {
	enumerable: true,
	get: function() {
		return SANDBOX_COMMAND_MAX_BUFFER_BYTES;
	}
});
Object.defineProperty(exports, "SANDBOX_CONTAINERS_DIR", {
	enumerable: true,
	get: function() {
		return SANDBOX_CONTAINERS_DIR;
	}
});
Object.defineProperty(exports, "SANDBOX_DOCKER_CREATE_ARGS_EPOCH", {
	enumerable: true,
	get: function() {
		return SANDBOX_DOCKER_CREATE_ARGS_EPOCH;
	}
});
Object.defineProperty(exports, "SANDBOX_REGISTRY_PATH", {
	enumerable: true,
	get: function() {
		return SANDBOX_REGISTRY_PATH;
	}
});
Object.defineProperty(exports, "SANDBOX_STATE_DIR", {
	enumerable: true,
	get: function() {
		return SANDBOX_STATE_DIR;
	}
});
Object.defineProperty(exports, "constants_exports", {
	enumerable: true,
	get: function() {
		return constants_exports;
	}
});
