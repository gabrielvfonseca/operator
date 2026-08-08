const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
//#region src/infra/container-environment.ts
/**
* Detect whether the current process is running inside a container
* (Docker, Podman, or Kubernetes).
*
* Uses two reliable heuristics:
* - Presence of common container sentinel files.
* - Container-related entries in /proc/1/cgroup.
*
* The result is cached after the first call so filesystem access happens at
* most once per process lifetime.
*/
let containerEnvironmentCache;
function isContainerEnvironment() {
	if (containerEnvironmentCache !== void 0) return containerEnvironmentCache;
	containerEnvironmentCache = detectContainerEnvironment();
	return containerEnvironmentCache;
}
function detectContainerEnvironment() {
	if (process.env.FLY_MACHINE_ID?.trim() && process.env.FLY_APP_NAME?.trim()) return true;
	for (const sentinelPath of [
		"/.dockerenv",
		"/run/.containerenv",
		"/var/run/.containerenv"
	]) try {
		node_fs.default.accessSync(sentinelPath, node_fs.default.constants.F_OK);
		return true;
	} catch {}
	try {
		const cgroup = node_fs.default.readFileSync("/proc/1/cgroup", "utf8");
		if (/\/docker\/|cri-containerd-[0-9a-f]|containerd\/[0-9a-f]{64}|\/kubepods[/.]|\blxc\b/.test(cgroup)) return true;
	} catch {}
	return false;
}
//#endregion
Object.defineProperty(exports, "isContainerEnvironment", {
	enumerable: true,
	get: function() {
		return isContainerEnvironment;
	}
});
