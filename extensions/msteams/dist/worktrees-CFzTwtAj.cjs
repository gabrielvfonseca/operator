const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_service = require("./service-D9VsD8u0.cjs");
const require_owner_protection = require("./owner-protection-B2wwlIbL.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/gateway/server-methods/worktrees.ts
function invalidParams(respond) {
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid worktrees parameters"));
}
function createWorktreesHandlers(service) {
	return {
		"worktrees.list": async ({ params, respond }) => {
			if (!require_src.validateWorktreesListParams(params)) {
				invalidParams(respond);
				return;
			}
			try {
				respond(true, { worktrees: await service.list() }, void 0);
			} catch (error) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(error)));
			}
		},
		"worktrees.create": async ({ params, respond }) => {
			if (!require_src.validateWorktreesCreateParams(params)) {
				invalidParams(respond);
				return;
			}
			try {
				respond(true, await service.create({
					repoRoot: params.repoRoot,
					name: params.name,
					baseRef: params.baseRef,
					ownerKind: "manual"
				}), void 0);
			} catch (error) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(error)));
			}
		},
		"worktrees.remove": async ({ params, respond }) => {
			if (!require_src.validateWorktreesRemoveParams(params)) {
				invalidParams(respond);
				return;
			}
			try {
				const result = await service.remove({
					id: params.id,
					reason: "manual-delete",
					force: params.force
				});
				respond(true, {
					removed: result.removed,
					...result.snapshotRef ? { snapshotRef: result.snapshotRef } : {},
					...result.snapshotError ? { snapshotError: result.snapshotError } : {}
				}, void 0);
			} catch (error) {
				if (error instanceof require_service.WorktreeSnapshotError) {
					respond(true, {
						removed: false,
						snapshotError: error.snapshotError
					}, void 0);
					return;
				}
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(error)));
			}
		},
		"worktrees.restore": async ({ params, respond }) => {
			if (!require_src.validateWorktreesRestoreParams(params)) {
				invalidParams(respond);
				return;
			}
			try {
				respond(true, await service.restore({ id: params.id }), void 0);
			} catch (error) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(error)));
			}
		},
		"worktrees.branches": async ({ params, respond, context, client }) => {
			if (!require_src.validateWorktreesBranchesParams(params)) {
				invalidParams(respond);
				return;
			}
			if (!(Array.isArray(client?.connect.scopes) ? client.connect.scopes : []).includes("operator.admin")) {
				const cfg = context.getRuntimeConfig();
				const requested = await node_fs_promises.default.realpath(params.repoRoot).catch(() => null);
				if (!(requested !== null && require_agent_scope_config.listAgentIds(cfg).some((agentId) => {
					try {
						return node_fs.default.realpathSync(require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId)) === requested;
					} catch {
						return false;
					}
				}))) {
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `worktrees.branches outside configured agent workspaces requires gateway scope: ${require_operator_scopes.ADMIN_SCOPE}`));
					return;
				}
			}
			try {
				respond(true, await service.listRepositoryBranches(params.repoRoot), void 0);
			} catch (error) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(error)));
			}
		},
		"worktrees.gc": async ({ params, respond, context }) => {
			if (!require_src.validateWorktreesGcParams(params)) {
				invalidParams(respond);
				return;
			}
			try {
				const cfg = context.getRuntimeConfig();
				const limits = require_service.resolveWorktreeCleanupLimits(cfg.worktrees);
				respond(true, await service.gc({
					limits,
					shouldProtectOwner: require_owner_protection.createManagedWorktreeOwnerProtection(cfg)
				}), void 0);
			} catch (error) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(error)));
			}
		}
	};
}
const worktreesHandlers = createWorktreesHandlers(require_service.managedWorktrees);
//#endregion
exports.createWorktreesHandlers = createWorktreesHandlers;
exports.worktreesHandlers = worktreesHandlers;
