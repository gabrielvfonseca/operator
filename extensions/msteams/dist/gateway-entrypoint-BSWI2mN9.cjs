const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/daemon/gateway-entrypoint.ts
/** Resolves gateway dist entrypoints used by installed daemon command lines. */
const GATEWAY_DIST_ENTRYPOINT_BASENAMES = [
	"index.js",
	"index.mjs",
	"entry.js",
	"entry.mjs"
];
/** Detects built gateway dist entrypoints from service command arguments. */
function isGatewayDistEntrypointPath(inputPath) {
	return /[/\\]dist[/\\].+\.(cjs|js|mjs)$/.test(inputPath);
}
function buildGatewayInstallEntrypointCandidates(root) {
	if (!root) return [];
	return GATEWAY_DIST_ENTRYPOINT_BASENAMES.map((basename) => node_path.default.join(root, "dist", basename));
}
function buildGatewayDistEntrypointCandidates(...inputs) {
	const distDirs = [];
	const seenDirs = /* @__PURE__ */ new Set();
	for (const inputPath of inputs) {
		if (!isGatewayDistEntrypointPath(inputPath)) continue;
		const distDir = node_path.default.dirname(inputPath);
		if (seenDirs.has(distDir)) continue;
		seenDirs.add(distDir);
		distDirs.push(distDir);
	}
	const candidates = [];
	for (const basename of GATEWAY_DIST_ENTRYPOINT_BASENAMES) for (const distDir of distDirs) candidates.push(node_path.default.join(distDir, basename));
	return candidates;
}
async function findFirstAccessibleGatewayEntrypoint(candidates, exists = require_utils.pathExists) {
	for (const candidate of candidates) if (await exists(candidate)) return candidate;
}
async function resolveGatewayInstallEntrypoint(root, exists = require_utils.pathExists) {
	return findFirstAccessibleGatewayEntrypoint(buildGatewayInstallEntrypointCandidates(root), exists);
}
//#endregion
Object.defineProperty(exports, "buildGatewayDistEntrypointCandidates", {
	enumerable: true,
	get: function() {
		return buildGatewayDistEntrypointCandidates;
	}
});
Object.defineProperty(exports, "findFirstAccessibleGatewayEntrypoint", {
	enumerable: true,
	get: function() {
		return findFirstAccessibleGatewayEntrypoint;
	}
});
Object.defineProperty(exports, "isGatewayDistEntrypointPath", {
	enumerable: true,
	get: function() {
		return isGatewayDistEntrypointPath;
	}
});
Object.defineProperty(exports, "resolveGatewayInstallEntrypoint", {
	enumerable: true,
	get: function() {
		return resolveGatewayInstallEntrypoint;
	}
});
