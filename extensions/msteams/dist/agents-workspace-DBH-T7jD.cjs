const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_workspace_fs = require("./workspace-fs-D4DCcRAL.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_media_core_mime = require("@gabrielvfonseca/media-core/mime");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/server-methods/agents-workspace.ts
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DEFAULT_LIST_LIMIT = 250;
const MAX_LIST_LIMIT = 500;
const IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([
	".avif",
	".bmp",
	".gif",
	".heic",
	".heif",
	".jpeg",
	".jpg",
	".png",
	".webp"
]);
const SUPPORTED_IMAGE_MIME_TYPES = /* @__PURE__ */ new Set([
	"image/avif",
	"image/bmp",
	"image/gif",
	"image/heic",
	"image/heif",
	"image/jpeg",
	"image/png",
	"image/webp"
]);
function workspaceError(type, message, details) {
	return require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, message, { details: {
		type,
		...details
	} });
}
function resolveWorkspaceScopeOrRespond(params, cfg, respond) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
	if (!new Set(require_agent_scope_config.listAgentIds(cfg)).has(agentId)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown agent id"));
		return null;
	}
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId);
	const rawPath = params.path ?? "";
	const portablePath = rawPath.replaceAll("\\", "/");
	if (node_path.default.posix.isAbsolute(portablePath) || node_path.default.win32.isAbsolute(rawPath)) {
		respond(false, void 0, workspaceError("workspace_path_invalid", "path must be workspace-relative", { path: rawPath }));
		return null;
	}
	const browserPath = require_workspace_fs.normalizeRelativePath(params.path);
	if (!require_workspace_fs.resolveWorkspacePath(workspaceDir, browserPath || ".")) {
		respond(false, void 0, workspaceError("workspace_path_invalid", "path escapes the agent workspace", { path: params.path ?? "" }));
		return null;
	}
	return {
		agentId,
		workspaceDir,
		browserPath
	};
}
/** Gateway handlers for read-only agent workspace browsing. */
const agentsWorkspaceHandlers = {
	"agents.workspace.list": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateAgentsWorkspaceListParams, "agents.workspace.list", respond)) return;
		const scope = resolveWorkspaceScopeOrRespond(params, context.getRuntimeConfig(), respond);
		if (!scope) return;
		const { agentId, workspaceDir, browserPath } = scope;
		const stat = await require_workspace_fs.statWorkspacePath(workspaceDir, browserPath);
		const dirents = stat && require_workspace_fs.workspaceStatKind(stat) === "directory" ? await require_workspace_fs.listWorkspacePath(workspaceDir, browserPath) : void 0;
		if (!dirents) {
			respond(false, void 0, workspaceError("workspace_path_not_found", "workspace directory not found", { path: browserPath }));
			return;
		}
		const entries = require_workspace_fs.sortWorkspaceEntries(dirents.flatMap((dirent) => {
			const statKind = require_workspace_fs.workspaceStatKind(dirent);
			const kind = statKind === "directory" ? "directory" : statKind === "file" ? "file" : null;
			if (!kind) return [];
			return [{
				path: browserPath ? `${browserPath}/${dirent.name}` : dirent.name,
				name: dirent.name,
				kind,
				...kind === "file" ? { size: dirent.size } : {},
				updatedAtMs: require_workspace_fs.toUpdatedAtMs(dirent.mtimeMs)
			}];
		}));
		const offset = Math.min(params.offset ?? 0, entries.length);
		const limit = Math.min(params.limit ?? DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT);
		const parent = node_path.default.dirname(browserPath);
		respond(true, {
			agentId,
			path: browserPath,
			...browserPath ? { parentPath: parent === "." ? "" : parent } : {},
			entries: entries.slice(offset, offset + limit),
			totalEntries: entries.length,
			offset
		});
	},
	"agents.workspace.get": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateAgentsWorkspaceGetParams, "agents.workspace.get", respond)) return;
		const scope = resolveWorkspaceScopeOrRespond(params, context.getRuntimeConfig(), respond);
		if (!scope) return;
		const { agentId, workspaceDir, browserPath } = scope;
		const respondNotFound = () => {
			respond(false, void 0, workspaceError("workspace_file_not_found", "workspace file not found", { path: browserPath }));
		};
		if (!browserPath) {
			respondNotFound();
			return;
		}
		const stat = await require_workspace_fs.statWorkspacePath(workspaceDir, browserPath);
		if (!stat || require_workspace_fs.workspaceStatKind(stat) !== "file") {
			respondNotFound();
			return;
		}
		const expectsImage = IMAGE_EXTENSIONS.has(node_path.default.extname(browserPath).toLowerCase());
		const maxBytes = expectsImage ? MAX_IMAGE_BYTES : require_workspace_fs.WORKSPACE_PREVIEW_MAX_BYTES;
		const read = stat.size > maxBytes ? "too-large" : await require_workspace_fs.readWorkspaceFile(workspaceDir, browserPath, { maxBytes });
		if (read === "too-large") {
			respond(false, void 0, workspaceError("workspace_file_too_large", "workspace file is too large to preview", {
				maxBytes,
				path: browserPath,
				size: stat.size
			}));
			return;
		}
		if (!read) {
			respondNotFound();
			return;
		}
		const respondUnsupported = () => {
			respond(false, void 0, workspaceError("workspace_file_unsupported", "workspace file is not UTF-8 text or a supported image", { path: browserPath }));
		};
		if (expectsImage) {
			const sniffedMime = await (0, _gabrielvfonseca_media_core_mime.detectMime)({ buffer: read.buffer });
			if (!sniffedMime || !SUPPORTED_IMAGE_MIME_TYPES.has(sniffedMime)) {
				respondUnsupported();
				return;
			}
			respond(true, {
				agentId,
				file: {
					path: browserPath,
					name: node_path.default.basename(browserPath),
					size: read.stat.size,
					updatedAtMs: require_workspace_fs.toUpdatedAtMs(read.stat.mtimeMs),
					mimeType: sniffedMime,
					encoding: "base64",
					content: read.buffer.toString("base64")
				}
			});
			return;
		}
		const text = require_workspace_fs.decodeUtf8Strict(read.buffer);
		if (text === void 0) {
			respondUnsupported();
			return;
		}
		respond(true, {
			agentId,
			file: {
				path: browserPath,
				name: node_path.default.basename(browserPath),
				size: read.stat.size,
				updatedAtMs: require_workspace_fs.toUpdatedAtMs(read.stat.mtimeMs),
				mimeType: "text/plain",
				encoding: "utf8",
				content: text
			}
		});
	}
};
//#endregion
exports.agentsWorkspaceHandlers = agentsWorkspaceHandlers;
