require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_docker = require("./docker-Bz1bPNmB.cjs");
const require_browser_bridges = require("./browser-bridges-k53bctds.cjs");
//#region src/agents/sandbox/prune.ts
/**
* Sandbox registry pruning.
*
* Removes stale runtime containers and browser bridges on a best-effort schedule.
*/
let lastPruneAtMs = 0;
function shouldPruneSandboxEntry(cfg, now, entry) {
	const idleHours = cfg.prune.idleHours;
	const maxAgeDays = cfg.prune.maxAgeDays;
	if (idleHours === 0 && maxAgeDays === 0) return false;
	const nowMs = (0, require_number_coercion.number_coercion_exports.asDateTimestampMs)(now) ?? 0;
	const lastUsedAtMs = (0, require_number_coercion.number_coercion_exports.asDateTimestampMs)(entry.lastUsedAtMs) ?? 0;
	const createdAtMs = (0, require_number_coercion.number_coercion_exports.asDateTimestampMs)(entry.createdAtMs) ?? 0;
	const idleMs = nowMs - lastUsedAtMs;
	const ageMs = nowMs - createdAtMs;
	return idleHours > 0 && idleMs > idleHours * 60 * 60 * 1e3 || maxAgeDays > 0 && ageMs > maxAgeDays * 24 * 60 * 60 * 1e3;
}
/** Removes expired registry entries and their backing runtime resources. */
async function pruneSandboxRegistryEntries(params) {
	const now = Date.now();
	if (params.cfg.prune.idleHours === 0 && params.cfg.prune.maxAgeDays === 0) return;
	const registry = await params.read();
	for (const entry of registry.entries) {
		if (!shouldPruneSandboxEntry(params.cfg, now, entry)) continue;
		try {
			await params.beforeRemove?.(entry);
			await params.removeRuntime(entry);
			await params.remove(entry.containerName);
		} catch (error) {
			const message = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
			require_runtime.defaultRuntime.error?.(`Sandbox prune failed to remove ${entry.containerName}: ${message ?? "unknown error"}`);
		}
	}
}
/** Prunes ordinary sandbox runtime containers from the configured backend manager. */
async function pruneSandboxContainers(cfg) {
	const config = require_io.getRuntimeConfig();
	await pruneSandboxRegistryEntries({
		cfg,
		read: require_docker.readRegistry,
		remove: require_docker.removeRegistryEntry,
		removeRuntime: async (entry) => {
			await require_browser_bridges.getSandboxBackendManager(entry.backendId ?? "docker")?.removeRuntime({
				entry,
				config
			});
		}
	});
}
/** Prunes browser bridge containers and closes matching in-process bridge servers. */
async function pruneSandboxBrowsers(cfg) {
	const config = require_io.getRuntimeConfig();
	await pruneSandboxRegistryEntries({
		cfg,
		read: require_docker.readBrowserRegistry,
		remove: require_docker.removeBrowserRegistryEntry,
		removeRuntime: async (entry) => {
			await require_browser_bridges.dockerSandboxBackendManager.removeRuntime({
				entry: {
					...entry,
					backendId: "docker",
					runtimeLabel: entry.containerName,
					configLabelKind: "Image"
				},
				config
			});
		},
		beforeRemove: async (entry) => {
			await require_browser_bridges.stopCachedBrowserBridgesForContainer(entry.containerName);
		}
	});
}
/** Runs sandbox pruning at most once per throttle window. */
async function maybePruneSandboxes(cfg) {
	const now = Date.now();
	if (now - lastPruneAtMs < 300 * 1e3) return;
	lastPruneAtMs = now;
	try {
		await pruneSandboxContainers(cfg);
		await pruneSandboxBrowsers(cfg);
	} catch (error) {
		const message = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
		require_runtime.defaultRuntime.error?.(`Sandbox prune failed: ${message ?? "unknown error"}`);
	}
}
//#endregion
exports.maybePruneSandboxes = maybePruneSandboxes;
