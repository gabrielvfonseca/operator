const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./path-guards-CMMkJCy0.cjs");
require("./local-file-access-r6xSCXfB.cjs");
const require_local_roots = require("./local-roots-w2A4ItE4.cjs");
const require_media_reference = require("./media-reference-1HgJGiDy.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_media_core_inbound_path_policy = require("@gabrielvfonseca/media-core/inbound-path-policy");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/media/local-media-access.ts
/** Error raised when a local media path escapes the configured allowlist. */
var LocalMediaAccessError = class extends Error {
	constructor(code, message, options) {
		super(message, options);
		this.code = code;
		this.name = "LocalMediaAccessError";
	}
};
/** Returns the default root allowlist for local media reads. */
function getDefaultLocalRoots() {
	return require_local_roots.getDefaultMediaLocalRoots();
}
/** Resolves an allowlist once for callers that validate several media paths. */
async function resolveLocalMediaRoots(localRoots) {
	const roots = localRoots ?? getDefaultLocalRoots();
	return await Promise.all(roots.map(async (root) => {
		let resolvedRoot;
		try {
			resolvedRoot = await node_fs_promises.default.realpath(root);
		} catch {
			resolvedRoot = node_path.default.resolve(root);
		}
		if (resolvedRoot === node_path.default.parse(resolvedRoot).root) throw new LocalMediaAccessError("invalid-root", `Invalid localRoots entry (refuses filesystem root): ${root}. Pass a narrower directory.`);
		return resolvedRoot;
	}));
}
/** Verifies that a local media path is managed inbound media or lives under allowed roots. */
async function assertLocalMediaAllowed(mediaPath, localRoots, options) {
	if (localRoots === "any") return;
	if (await require_media_reference.resolveInboundMediaReference(mediaPath).catch(() => null)) return;
	try {
		(0, _openclaw_fs_safe_advanced.assertNoWindowsNetworkPath)(mediaPath, "Local media path");
	} catch (err) {
		throw new LocalMediaAccessError("network-path-not-allowed", err.message, { cause: err });
	}
	if (options?.inboundRoots?.length && (0, _gabrielvfonseca_media_core_inbound_path_policy.isInboundPathAllowed)({
		filePath: mediaPath,
		roots: options.inboundRoots
	})) return;
	const roots = localRoots ?? getDefaultLocalRoots();
	let resolved;
	try {
		resolved = await node_fs_promises.default.realpath(mediaPath);
	} catch {
		resolved = node_path.default.resolve(mediaPath);
	}
	if (localRoots === void 0) {
		const workspaceRoot = roots.find((root) => node_path.default.basename(root) === "workspace");
		if (workspaceRoot) {
			const stateDir = node_path.default.dirname(workspaceRoot);
			const rel = node_path.default.relative(stateDir, resolved);
			if (rel && (0, _openclaw_fs_safe_path.isPathInside)(stateDir, resolved)) {
				if ((rel.split(node_path.default.sep)[0] ?? "").startsWith("workspace-")) throw new LocalMediaAccessError("path-not-allowed", `Local media path is not under an allowed directory: ${mediaPath}`);
			}
		}
	}
	const resolvedRoots = options?.resolvedRoots ?? await options?.resolveRoots?.() ?? await resolveLocalMediaRoots(roots);
	for (const [index, resolvedRoot] of resolvedRoots.entries()) {
		const root = roots[index] ?? resolvedRoot;
		if (resolvedRoot === node_path.default.parse(resolvedRoot).root) throw new LocalMediaAccessError("invalid-root", `Invalid localRoots entry (refuses filesystem root): ${root}. Pass a narrower directory.`);
		if ((0, _openclaw_fs_safe_path.isPathInside)(resolvedRoot, resolved)) return;
	}
	throw new LocalMediaAccessError("path-not-allowed", `Local media path is not under an allowed directory: ${mediaPath}`);
}
//#endregion
Object.defineProperty(exports, "LocalMediaAccessError", {
	enumerable: true,
	get: function() {
		return LocalMediaAccessError;
	}
});
Object.defineProperty(exports, "assertLocalMediaAllowed", {
	enumerable: true,
	get: function() {
		return assertLocalMediaAllowed;
	}
});
Object.defineProperty(exports, "getDefaultLocalRoots", {
	enumerable: true,
	get: function() {
		return getDefaultLocalRoots;
	}
});
Object.defineProperty(exports, "resolveLocalMediaRoots", {
	enumerable: true,
	get: function() {
		return resolveLocalMediaRoots;
	}
});
