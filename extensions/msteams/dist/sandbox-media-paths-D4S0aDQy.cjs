const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_media_reference = require("./media-reference-1HgJGiDy.cjs");
const require_sandbox_paths = require("./sandbox-paths-BmmHDLnB.cjs");
const require_path_utils = require("./path-utils-9zbrKCrT.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/agents/sandbox-media-paths.ts
/**
* Sandbox media path resolution helpers.
*
* Bridges media references through sandbox filesystems while enforcing workspace-only boundaries when required.
*/
function createSandboxBridgeReadFile(params) {
	return async (filePath) => await params.sandbox.bridge.readFile({
		filePath,
		cwd: params.sandbox.root
	});
}
async function resolveSandboxedBridgeMediaPath(params) {
	const normalizeFileUrl = (rawPath) => rawPath.startsWith("file://") ? rawPath.slice(7) : rawPath;
	const mediaPathInfo = params.inboundFallbackDir ? require_media_reference.resolveMediaReferenceSandboxPath(params.mediaPath, params.inboundFallbackDir) : { resolved: params.mediaPath };
	const filePath = normalizeFileUrl(mediaPathInfo.resolved);
	const rewrittenFrom = mediaPathInfo.rewrittenFrom;
	if (rewrittenFrom) {
		if (!await params.sandbox.bridge.stat({
			filePath,
			cwd: params.sandbox.root
		})) throw new Error(`Sandbox media reference is not staged: ${rewrittenFrom}`);
	}
	const enforceWorkspaceBoundary = async (resolved) => {
		if (!params.sandbox.workspaceOnly) return;
		if (resolved.hostPath) {
			await require_sandbox_paths.assertSandboxPath({
				filePath: resolved.hostPath,
				cwd: params.sandbox.root,
				root: params.sandbox.root
			});
			return;
		}
		if (!require_path_utils.isPathInsideContainerRoot(require_path_utils.normalizeContainerPath(params.sandbox.bridge.resolvePath({
			filePath: params.sandbox.root,
			cwd: params.sandbox.root
		}).containerPath), require_path_utils.normalizeContainerPath(resolved.containerPath))) throw new Error(`Sandbox path escapes workspace root: ${resolved.containerPath}`);
	};
	const resolveDirect = () => params.sandbox.bridge.resolvePath({
		filePath,
		cwd: params.sandbox.root
	});
	try {
		const resolved = resolveDirect();
		await enforceWorkspaceBoundary(resolved);
		return {
			resolved: resolved.hostPath ?? resolved.containerPath,
			...rewrittenFrom ? { rewrittenFrom } : {}
		};
	} catch (err) {
		const fallbackDir = params.inboundFallbackDir?.trim();
		if (!fallbackDir) throw err;
		const fallbackPath = node_path.default.join(fallbackDir, node_path.default.basename(filePath));
		try {
			if (!await params.sandbox.bridge.stat({
				filePath: fallbackPath,
				cwd: params.sandbox.root
			})) throw err;
		} catch {
			throw err;
		}
		const resolvedFallback = params.sandbox.bridge.resolvePath({
			filePath: fallbackPath,
			cwd: params.sandbox.root
		});
		await enforceWorkspaceBoundary(resolvedFallback);
		return {
			resolved: resolvedFallback.hostPath ?? resolvedFallback.containerPath,
			rewrittenFrom: filePath
		};
	}
}
//#endregion
Object.defineProperty(exports, "createSandboxBridgeReadFile", {
	enumerable: true,
	get: function() {
		return createSandboxBridgeReadFile;
	}
});
Object.defineProperty(exports, "resolveSandboxedBridgeMediaPath", {
	enumerable: true,
	get: function() {
		return resolveSandboxedBridgeMediaPath;
	}
});
