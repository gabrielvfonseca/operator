const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_node_commands = require("./node-commands-DQ3xnEUk.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_node_command_policy = require("./node-command-policy-DFyVSMm6.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/infra/host-directory-listing.ts
async function listDirEntries(dir) {
	const dirents = await node_fs_promises.default.readdir(dir, { withFileTypes: true });
	const entries = [];
	for (const dirent of dirents) {
		const entryPath = node_path.default.join(dir, dirent.name);
		let isDirectory = dirent.isDirectory();
		if (dirent.isSymbolicLink()) isDirectory = await node_fs_promises.default.stat(entryPath).then((stat) => stat.isDirectory(), () => false);
		if (!isDirectory) continue;
		const hidden = dirent.name.startsWith(".");
		entries.push({
			name: dirent.name,
			path: entryPath,
			...hidden ? { hidden: true } : {}
		});
	}
	entries.sort((a, b) => {
		if (Boolean(a.hidden) !== Boolean(b.hidden)) return a.hidden ? 1 : -1;
		return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
	});
	return entries;
}
/** Lists one absolute host directory, defaulting to that host's home directory. */
async function listHostDirectories(requestedPath) {
	const home = node_os.default.homedir();
	const requested = requestedPath?.trim() || home;
	if (!node_path.default.isAbsolute(requested)) throw new Error("fs.listDir path must be absolute");
	const resolved = node_path.default.resolve(requested);
	const entries = await listDirEntries(resolved);
	const parent = node_path.default.dirname(resolved);
	return {
		path: resolved,
		...parent !== resolved ? { parent } : {},
		home,
		entries
	};
}
//#endregion
//#region src/gateway/server-methods/fs.ts
function parseNodePayload(payload, payloadJSON) {
	if (payloadJSON) try {
		return JSON.parse(payloadJSON);
	} catch {
		return;
	}
	return payload;
}
const fsHandlers = { "fs.listDir": async ({ params, respond, context }) => {
	if (!require_src.validateFsListDirParams(params)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid fs parameters"));
		return;
	}
	try {
		if (params.nodeId) {
			const node = context.nodeRegistry.get(params.nodeId);
			if (!node) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "node not connected"));
				return;
			}
			if (!node.commands.includes("fs.listDir")) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "node does not support directory browsing"));
				return;
			}
			const allowed = require_node_command_policy.isNodeCommandAllowed({
				command: require_node_commands.NODE_FS_LIST_DIR_COMMAND,
				declaredCommands: node.commands,
				allowlist: require_node_command_policy.resolveNodeCommandAllowlist(context.getRuntimeConfig(), {
					...node,
					approvedCommands: node.commands
				})
			});
			if (!allowed.ok) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `node command not allowed: ${require_node_commands.NODE_FS_LIST_DIR_COMMAND} (${allowed.reason})`, { details: {
					command: require_node_commands.NODE_FS_LIST_DIR_COMMAND,
					reason: allowed.reason
				} }));
				return;
			}
			const result = await context.nodeRegistry.invoke({
				nodeId: params.nodeId,
				expectedConnId: node.connId,
				command: require_node_commands.NODE_FS_LIST_DIR_COMMAND,
				params: params.path ? { path: params.path } : {}
			});
			if (!result.ok) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, result.error?.message ?? "node browse failed"));
				return;
			}
			const payload = parseNodePayload(result.payload, result.payloadJSON);
			if (!require_src.validateFsListDirResult(payload)) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "node returned an invalid directory listing"));
				return;
			}
			respond(true, payload, void 0);
			return;
		}
		respond(true, await listHostDirectories(params.path), void 0);
	} catch (error) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, String(error)));
	}
} };
//#endregion
exports.fsHandlers = fsHandlers;
