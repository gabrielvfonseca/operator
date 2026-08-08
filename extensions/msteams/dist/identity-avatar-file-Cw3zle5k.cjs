const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/infra/file-descriptor-read.ts
const READ_CHUNK_BYTES = 64 * 1024;
function createScratchBuffer(maxBytes) {
	return Buffer.allocUnsafe(Math.min(READ_CHUNK_BYTES, Math.max(1, maxBytes + 1)));
}
function appendChunk(params) {
	const total = params.total + params.bytesRead;
	if (total > params.maxBytes) throw new RangeError(`File exceeds ${params.maxBytes} bytes`);
	params.chunks.push(Buffer.from(params.scratch.subarray(0, params.bytesRead)));
	return total;
}
/** Read at most maxBytes from the descriptor without an unbounded allocation. */
function readFileDescriptorBoundedSync(fd, maxBytes) {
	const chunks = [];
	const scratch = createScratchBuffer(maxBytes);
	let total = 0;
	while (true) {
		const bytesRead = node_fs.default.readSync(fd, scratch, 0, scratch.length, null);
		if (bytesRead === 0) return Buffer.concat(chunks, total);
		total = appendChunk({
			chunks,
			scratch,
			bytesRead,
			total,
			maxBytes
		});
	}
}
function readChunk(fd, scratch) {
	return new Promise((resolve, reject) => {
		node_fs.default.read(fd, scratch, 0, scratch.length, null, (error, bytesRead) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(bytesRead);
		});
	});
}
/** Async variant for request paths; caller retains descriptor ownership. */
async function readFileDescriptorBounded(fd, maxBytes) {
	const chunks = [];
	const scratch = createScratchBuffer(maxBytes);
	let total = 0;
	while (true) {
		const bytesRead = await readChunk(fd, scratch);
		if (bytesRead === 0) return Buffer.concat(chunks, total);
		total = appendChunk({
			chunks,
			scratch,
			bytesRead,
			total,
			maxBytes
		});
	}
}
//#endregion
//#region src/agents/identity-avatar-file.ts
function resolveExistingPath(value) {
	try {
		return node_fs.default.realpathSync(value);
	} catch {
		return node_path.default.resolve(value);
	}
}
/** Resolve one local avatar source while retaining its canonical workspace root. */
function resolveLocalAgentAvatarPath(params) {
	const workspaceRoot = resolveExistingPath(params.workspaceDir);
	const filePath = resolveExistingPath(params.raw.startsWith("~") || node_path.default.isAbsolute(params.raw) ? require_home_dir.resolveUserPath(params.raw) : node_path.default.resolve(workspaceRoot, params.raw));
	if (!require_io.isPathWithinRoot(workspaceRoot, filePath)) return {
		ok: false,
		reason: "outside_workspace"
	};
	if (!require_io.isSupportedLocalAvatarExtension(filePath)) return {
		ok: false,
		reason: "unsupported_extension"
	};
	try {
		const stat = node_fs.default.statSync(filePath);
		if (!stat.isFile()) return {
			ok: false,
			reason: "missing"
		};
		if (stat.size > 2097152) return {
			ok: false,
			reason: "too_large"
		};
	} catch {
		return {
			ok: false,
			reason: "missing"
		};
	}
	return {
		ok: true,
		value: {
			filePath,
			workspaceRoot
		}
	};
}
function openResolvedLocalAgentAvatarFile(resolved) {
	try {
		const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
			absolutePath: resolved.filePath,
			rootPath: resolved.workspaceRoot,
			rootRealPath: resolved.workspaceRoot,
			boundaryLabel: "agent workspace",
			maxBytes: require_io.AVATAR_MAX_BYTES,
			rejectHardlinks: true,
			skipLexicalRootCheck: true
		});
		if (!opened.ok) return null;
		if (!require_io.isSupportedLocalAvatarExtension(opened.path)) {
			node_fs.default.closeSync(opened.fd);
			return null;
		}
		return {
			path: opened.path,
			fd: opened.fd
		};
	} catch {
		return null;
	}
}
/**
* Open one selected local avatar under its agent workspace.
* A successful caller owns `file.fd` and must close it exactly once.
*/
function openLocalAgentAvatarFile(params) {
	const resolved = resolveLocalAgentAvatarPath({
		raw: params.source,
		workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, params.agentId)
	});
	if (!resolved.ok) return resolved;
	const file = openResolvedLocalAgentAvatarFile(resolved.value);
	return file ? {
		ok: true,
		file
	} : {
		ok: false,
		reason: "unreadable"
	};
}
/** Consume a pinned local avatar descriptor into a data URL. Always closes it. */
function readOpenedLocalAgentAvatarDataUrl(opened) {
	try {
		const buffer = readFileDescriptorBoundedSync(opened.fd, require_io.AVATAR_MAX_BYTES);
		return `data:${require_io.resolveAvatarMime(opened.path)};base64,${buffer.toString("base64")}`;
	} catch {
		return;
	} finally {
		node_fs.default.closeSync(opened.fd);
	}
}
/** Resolve one configured avatar source for agent-list projections. */
function resolveAgentAvatarUrlFromSource(cfg, agentId, source) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(source);
	if (!normalized) return;
	if (require_io.isAvatarHttpUrl(normalized) || require_io.isRenderableAvatarImageDataUrl(normalized)) return normalized;
	if (require_io.isAvatarDataUrl(normalized) || require_io.hasAvatarUriScheme(normalized) && !require_io.isWindowsAbsolutePath(normalized)) return;
	const opened = openLocalAgentAvatarFile({
		cfg,
		agentId,
		source: normalized
	});
	return opened.ok ? readOpenedLocalAgentAvatarDataUrl(opened.file) : void 0;
}
//#endregion
Object.defineProperty(exports, "openLocalAgentAvatarFile", {
	enumerable: true,
	get: function() {
		return openLocalAgentAvatarFile;
	}
});
Object.defineProperty(exports, "readFileDescriptorBounded", {
	enumerable: true,
	get: function() {
		return readFileDescriptorBounded;
	}
});
Object.defineProperty(exports, "readOpenedLocalAgentAvatarDataUrl", {
	enumerable: true,
	get: function() {
		return readOpenedLocalAgentAvatarDataUrl;
	}
});
Object.defineProperty(exports, "resolveAgentAvatarUrlFromSource", {
	enumerable: true,
	get: function() {
		return resolveAgentAvatarUrlFromSource;
	}
});
Object.defineProperty(exports, "resolveLocalAgentAvatarPath", {
	enumerable: true,
	get: function() {
		return resolveLocalAgentAvatarPath;
	}
});
