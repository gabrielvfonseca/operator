const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./path-guards-CMMkJCy0.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_identity = require("./identity-Dv2mhJl0.cjs");
const require_workspace = require("./workspace-oX0zfOZq.cjs");
const require_identity_file = require("./identity-file-BqNnk9aW.cjs");
const require_config = require("./config-DT0qiglW.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_agent_id = require("./agent-id-nux9kTGp.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_optional_model_catalog = require("./optional-model-catalog-BzJgNWKo.cjs");
require("./browser-maintenance-DQK9SO2Y.cjs");
const require_agents_config = require("./agents.config-BC-3Ve88.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_errors = require("@openclaw/fs-safe/errors");
//#region src/agents/agent-delete-safety.ts
/** Safety checks for deleting agents whose workspaces may overlap other agents. */
function normalizeWorkspacePathForComparison(input) {
	const resolved = node_path.default.resolve(input.replaceAll("\0", ""));
	let normalized = resolved;
	try {
		normalized = node_fs.default.realpathSync.native(resolved);
	} catch {}
	if (process.platform === "win32") return (0, _gabrielvfonseca_normalization_core_string_coerce.lowercasePreservingWhitespace)(normalized);
	return normalized;
}
function workspacePathsOverlap(left, right) {
	const normalizedLeft = normalizeWorkspacePathForComparison(left);
	const normalizedRight = normalizeWorkspacePathForComparison(right);
	return (0, _openclaw_fs_safe_path.isPathInside)(normalizedRight, normalizedLeft) || (0, _openclaw_fs_safe_path.isPathInside)(normalizedLeft, normalizedRight);
}
/** Lists other agents whose workspaces overlap a candidate delete target. */
function findOverlappingWorkspaceAgentIds(cfg, agentId, workspaceDir) {
	const entries = require_agent_scope_config.listAgentEntries(cfg);
	const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	const overlappingAgentIds = [];
	for (const entry of entries) {
		const otherAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id);
		if (otherAgentId === normalizedAgentId) continue;
		if (workspacePathsOverlap(workspaceDir, require_agent_scope_config.resolveAgentWorkspaceDir(cfg, otherAgentId))) overlappingAgentIds.push(otherAgentId);
	}
	return overlappingAgentIds;
}
//#endregion
//#region src/gateway/server-methods/agents-config-mutations.ts
/** Typed precondition failure surfaced by agent mutation handlers as gateway errors. */
var AgentConfigPreconditionError = class extends Error {
	constructor(kind, agentId) {
		super(kind === "already-exists" ? `agent "${agentId}" already exists` : `agent "${agentId}" not found`);
		this.kind = kind;
		this.agentId = agentId;
		this.name = "AgentConfigPreconditionError";
	}
};
/** Checks the current config snapshot for a concrete agent entry. */
function isConfiguredAgent(cfg, agentId) {
	return require_agents_config.findAgentEntryIndex(require_agent_scope_config.listAgentEntries(cfg), agentId) >= 0;
}
/** Adds a new agent entry through the retrying config mutation path. */
async function createAgentConfigEntry(params) {
	await require_config.mutateConfigFileWithRetry({
		afterWrite: { mode: "auto" },
		mutate: (draft) => {
			if (isConfiguredAgent(draft, params.agentId)) throw new AgentConfigPreconditionError("already-exists", params.agentId);
			const latestNextConfig = require_agents_config.applyAgentConfig(draft, {
				agentId: params.agentId,
				name: params.name,
				workspace: params.workspace,
				model: params.model,
				identity: params.identity,
				agentDir: params.agentDir
			});
			Object.assign(draft, latestNextConfig);
		}
	});
}
/** Updates an existing agent entry while preserving omitted fields. */
async function updateAgentConfigEntry(params) {
	await require_config.mutateConfigFileWithRetry({
		afterWrite: { mode: "auto" },
		mutate: (draft) => {
			if (!isConfiguredAgent(draft, params.agentId)) throw new AgentConfigPreconditionError("not-found", params.agentId);
			const latestNextConfig = require_agents_config.applyAgentConfig(draft, {
				agentId: params.agentId,
				...params.name ? { name: params.name } : {},
				...params.workspace ? { workspace: params.workspace } : {},
				...params.model ? { model: params.model } : {},
				...params.identity ? { identity: params.identity } : {}
			});
			Object.assign(draft, latestNextConfig);
		}
	});
}
/** Removes an agent entry and returns filesystem roots the caller should clean up. */
async function deleteAgentConfigEntry(params) {
	const committed = await require_config.mutateConfigFileWithRetry({
		afterWrite: { mode: "auto" },
		mutate: (draft) => {
			if (!isConfiguredAgent(draft, params.agentId)) throw new AgentConfigPreconditionError("not-found", params.agentId);
			const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(draft, params.agentId);
			const agentDir = require_agent_scope_config.resolveAgentDir(draft, params.agentId);
			const sessionsDir = require_paths.resolveSessionTranscriptsDirForAgent(params.agentId);
			const result = require_agents_config.pruneAgentConfig(draft, params.agentId);
			Object.assign(draft, result.config);
			return {
				workspaceDir,
				agentDir,
				sessionsDir,
				removedBindings: result.removedBindings
			};
		}
	});
	return {
		nextConfig: committed.nextConfig,
		result: committed.result
	};
}
//#endregion
//#region src/gateway/server-methods/agents.ts
const BOOTSTRAP_FILE_NAMES = [
	require_workspace.DEFAULT_AGENTS_FILENAME,
	require_workspace.DEFAULT_SOUL_FILENAME,
	require_workspace.DEFAULT_TOOLS_FILENAME,
	require_workspace.DEFAULT_IDENTITY_FILENAME,
	require_workspace.DEFAULT_USER_FILENAME,
	require_workspace.DEFAULT_HEARTBEAT_FILENAME,
	require_workspace.DEFAULT_BOOTSTRAP_FILENAME
];
const BOOTSTRAP_FILE_NAMES_POST_ONBOARDING = BOOTSTRAP_FILE_NAMES.filter((name) => name !== require_workspace.DEFAULT_BOOTSTRAP_FILENAME);
const agentsHandlerDeps = {
	root: _openclaw_fs_safe_root.root,
	isWorkspaceSetupCompleted: require_workspace.isWorkspaceSetupCompleted
};
const testing = {
	setDepsForTests(overrides) {
		if (overrides.isWorkspaceSetupCompleted) agentsHandlerDeps.isWorkspaceSetupCompleted = overrides.isWorkspaceSetupCompleted;
		if (overrides.root) agentsHandlerDeps.root = overrides.root;
	},
	resetDepsForTests() {
		agentsHandlerDeps.root = _openclaw_fs_safe_root.root;
		agentsHandlerDeps.isWorkspaceSetupCompleted = require_workspace.isWorkspaceSetupCompleted;
	}
};
const MEMORY_FILE_NAMES = [require_workspace.DEFAULT_MEMORY_FILENAME];
const ALLOWED_FILE_NAMES = /* @__PURE__ */ new Set([...BOOTSTRAP_FILE_NAMES, ...MEMORY_FILE_NAMES]);
function resolveAgentWorkspaceFileOrRespondError(params, respond, cfg) {
	const rawAgentId = params.agentId;
	const agentId = resolveAgentIdOrError(typeof rawAgentId === "string" || typeof rawAgentId === "number" ? String(rawAgentId) : "", cfg);
	if (!agentId) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown agent id"));
		return null;
	}
	const rawName = params.name;
	const name = (typeof rawName === "string" || typeof rawName === "number" ? String(rawName) : "").trim();
	if (!ALLOWED_FILE_NAMES.has(name)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unsupported file "${name}"`));
		return null;
	}
	return {
		cfg,
		agentId,
		workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId),
		name
	};
}
function isRegularWorkspaceFileStat(stat) {
	const isFile = typeof stat.isFile === "function" ? stat.isFile() : stat.isFile;
	const isSymbolicLink = typeof stat.isSymbolicLink === "function" ? stat.isSymbolicLink() : stat.isSymbolicLink;
	return isFile && !isSymbolicLink && stat.nlink <= 1;
}
function toWorkspaceFileMeta(stat) {
	if (!isRegularWorkspaceFileStat(stat)) return null;
	return {
		size: stat.size,
		updatedAtMs: Math.floor(stat.mtimeMs)
	};
}
async function statWorkspaceFileSafely(workspaceRoot, workspaceDir, name) {
	try {
		return toWorkspaceFileMeta(workspaceRoot ? await workspaceRoot.stat(name) : await node_fs_promises.default.lstat(node_path.default.join(workspaceDir, name)));
	} catch {
		if (!workspaceRoot) return null;
		try {
			return toWorkspaceFileMeta(await node_fs_promises.default.lstat(node_path.default.join(workspaceDir, name)));
		} catch {
			return null;
		}
	}
}
async function openWorkspaceRootSafely(workspaceDir) {
	try {
		return await agentsHandlerDeps.root(workspaceDir);
	} catch {
		return null;
	}
}
async function listAgentFiles(workspaceDir, options) {
	const files = [];
	const workspaceRoot = await openWorkspaceRootSafely(workspaceDir);
	if (!workspaceRoot) return [...options?.hideBootstrap ? BOOTSTRAP_FILE_NAMES_POST_ONBOARDING : BOOTSTRAP_FILE_NAMES, require_workspace.DEFAULT_MEMORY_FILENAME].map((name) => ({
		name,
		path: node_path.default.join(workspaceDir, name),
		missing: true
	}));
	const bootstrapFileNames = options?.hideBootstrap ? BOOTSTRAP_FILE_NAMES_POST_ONBOARDING : BOOTSTRAP_FILE_NAMES;
	for (const name of bootstrapFileNames) {
		const filePath = node_path.default.join(workspaceDir, name);
		const meta = await statWorkspaceFileSafely(workspaceRoot, workspaceDir, name);
		if (meta) files.push({
			name,
			path: filePath,
			missing: false,
			size: meta.size,
			updatedAtMs: meta.updatedAtMs
		});
		else files.push({
			name,
			path: filePath,
			missing: true
		});
	}
	const primaryMeta = await statWorkspaceFileSafely(workspaceRoot, workspaceDir, require_workspace.DEFAULT_MEMORY_FILENAME);
	if (primaryMeta) files.push({
		name: require_workspace.DEFAULT_MEMORY_FILENAME,
		path: node_path.default.join(workspaceDir, require_workspace.DEFAULT_MEMORY_FILENAME),
		missing: false,
		size: primaryMeta.size,
		updatedAtMs: primaryMeta.updatedAtMs
	});
	else files.push({
		name: require_workspace.DEFAULT_MEMORY_FILENAME,
		path: node_path.default.join(workspaceDir, require_workspace.DEFAULT_MEMORY_FILENAME),
		missing: true
	});
	return files;
}
function resolveAgentIdOrError(agentIdRaw, cfg) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentIdRaw);
	if (!new Set(require_agent_scope_config.listAgentIds(cfg)).has(agentId)) return null;
	return agentId;
}
function sanitizeIdentityLine(value) {
	return value.replace(/\s+/g, " ").trim();
}
function respondInvalidMethodParams(respond, method, errors) {
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid ${method} params: ${require_validation_errors.formatValidationErrors(errors)}`));
}
function respondAgentNotFound(respond, agentId) {
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `agent "${agentId}" not found`));
}
function respondAgentConfigPreconditionError(respond, error) {
	if (error.kind === "not-found") {
		respondAgentNotFound(respond, error.agentId);
		return;
	}
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `agent "${error.agentId}" already exists`));
}
async function moveToTrashBestEffort(pathname) {
	if (!pathname) return;
	try {
		await node_fs_promises.default.access(pathname);
	} catch {
		return;
	}
	try {
		await (0, _openclaw_fs_safe_advanced.movePathToTrash)(pathname);
	} catch {}
}
function respondWorkspaceFileUnsafe(respond, name) {
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unsafe workspace file "${name}"`));
}
function respondWorkspaceFileMissing(params) {
	params.respond(true, {
		agentId: params.agentId,
		workspace: params.workspaceDir,
		file: {
			name: params.name,
			path: params.filePath,
			missing: true
		}
	}, void 0);
}
async function writeWorkspaceFileOrRespond(params) {
	await node_fs_promises.default.mkdir(params.workspaceDir, { recursive: true });
	try {
		await (await agentsHandlerDeps.root(params.workspaceDir)).write(params.name, params.content, { encoding: "utf8" });
	} catch (err) {
		if (err instanceof _openclaw_fs_safe_errors.FsSafeError) {
			respondWorkspaceFileUnsafe(params.respond, params.name);
			return false;
		}
		throw err;
	}
	return true;
}
function normalizeIdentityForFile(identity) {
	if (!identity) return;
	const resolved = {
		name: identity.name?.trim() || void 0,
		theme: identity.theme?.trim() || void 0,
		emoji: identity.emoji?.trim() || void 0,
		avatar: identity.avatar?.trim() || void 0
	};
	if (!resolved.name && !resolved.theme && !resolved.emoji && !resolved.avatar) return;
	return resolved;
}
function createAgentIdentityConfig(params) {
	const emoji = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.emoji);
	const avatar = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.avatar);
	const identity = {
		...params.safeName ? { name: params.safeName } : {},
		...emoji ? { emoji: sanitizeIdentityLine(emoji) } : {},
		...avatar ? { avatar: sanitizeIdentityLine(avatar) } : {}
	};
	return identity.name || identity.emoji || identity.avatar ? identity : void 0;
}
function buildAgentConfigUpdate(params) {
	return {
		agentId: params.agentId,
		...params.safeName ? { name: params.safeName } : {},
		...params.workspaceDir ? { workspace: params.workspaceDir } : {},
		...params.model ? { model: params.model } : {},
		...params.identity ? { identity: params.identity } : {}
	};
}
async function readWorkspaceFileContent(workspaceDir, name) {
	try {
		return (await (await agentsHandlerDeps.root(workspaceDir)).read(name, {
			hardlinks: "reject",
			nonBlockingRead: true
		})).buffer.toString("utf-8");
	} catch (err) {
		if (err instanceof _openclaw_fs_safe_errors.FsSafeError && err.code === "not-found") return;
		throw err;
	}
}
async function buildIdentityMarkdownForWrite(params) {
	let baseContent;
	if (params.preferFallbackWorkspaceContent && params.fallbackWorkspaceDir) {
		baseContent = await readWorkspaceFileContent(params.fallbackWorkspaceDir, require_workspace.DEFAULT_IDENTITY_FILENAME);
		if (baseContent === void 0) baseContent = await readWorkspaceFileContent(params.workspaceDir, require_workspace.DEFAULT_IDENTITY_FILENAME);
	} else {
		baseContent = await readWorkspaceFileContent(params.workspaceDir, require_workspace.DEFAULT_IDENTITY_FILENAME);
		if (baseContent === void 0 && params.fallbackWorkspaceDir) baseContent = await readWorkspaceFileContent(params.fallbackWorkspaceDir, require_workspace.DEFAULT_IDENTITY_FILENAME);
	}
	return require_identity_file.mergeIdentityMarkdownContent(baseContent, params.identity);
}
async function buildIdentityMarkdownOrRespondUnsafe(params) {
	try {
		return await buildIdentityMarkdownForWrite(params);
	} catch (err) {
		if (err instanceof _openclaw_fs_safe_errors.FsSafeError) {
			respondWorkspaceFileUnsafe(params.respond, require_workspace.DEFAULT_IDENTITY_FILENAME);
			return null;
		}
		throw err;
	}
}
const agentsHandlers = {
	"agents.list": async ({ params, respond, context }) => {
		if (!require_src.validateAgentsListParams(params)) {
			respondInvalidMethodParams(respond, "agents.list", require_src.validateAgentsListParams.errors);
			return;
		}
		respond(true, require_session_utils.listAgentsForGateway(context.getRuntimeConfig(), await require_optional_model_catalog.loadOptionalServerMethodModelCatalog(context, "agents.list", { logOnceKey: "agents.list" })), void 0);
	},
	"agents.create": async ({ params, respond, context }) => {
		if (!require_src.validateAgentsCreateParams(params)) {
			respondInvalidMethodParams(respond, "agents.create", require_src.validateAgentsCreateParams.errors);
			return;
		}
		const cfg = context.getRuntimeConfig();
		const rawName = params.name.trim();
		const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(rawName);
		if (agentId === "main" || require_agent_id.isReservedSystemAgentId(agentId)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `"${agentId}" is reserved`));
			return;
		}
		if (isConfiguredAgent(cfg, agentId)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `agent "${agentId}" already exists`));
			return;
		}
		const workspaceDir = require_home_dir.resolveUserPath(params.workspace.trim());
		const safeName = sanitizeIdentityLine(rawName);
		const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model);
		const identity = createAgentIdentityConfig({
			safeName,
			emoji: params.emoji,
			avatar: params.avatar
		}) ?? { name: safeName };
		let nextConfig = require_agents_config.applyAgentConfig(cfg, {
			agentId,
			name: safeName,
			workspace: workspaceDir,
			model,
			identity
		});
		const agentDir = require_agent_scope_config.resolveAgentDir(nextConfig, agentId);
		nextConfig = require_agents_config.applyAgentConfig(nextConfig, {
			agentId,
			agentDir
		});
		await require_workspace.ensureAgentWorkspace({
			dir: workspaceDir,
			ensureBootstrapFiles: !Boolean(nextConfig.agents?.defaults?.skipBootstrap),
			skipOptionalBootstrapFiles: nextConfig.agents?.defaults?.skipOptionalBootstrapFiles
		});
		await node_fs_promises.default.mkdir(require_paths.resolveSessionTranscriptsDirForAgent(agentId), { recursive: true });
		const persistedIdentity = normalizeIdentityForFile(require_identity.resolveAgentIdentity(nextConfig, agentId));
		if (persistedIdentity) {
			const identityContent = await buildIdentityMarkdownOrRespondUnsafe({
				respond,
				workspaceDir,
				identity: persistedIdentity
			});
			if (identityContent === null) return;
			if (!await writeWorkspaceFileOrRespond({
				respond,
				workspaceDir,
				name: "IDENTITY.md",
				content: identityContent
			})) return;
		}
		try {
			await createAgentConfigEntry({
				agentId,
				name: safeName,
				workspace: workspaceDir,
				model,
				identity,
				agentDir
			});
		} catch (error) {
			if (error instanceof AgentConfigPreconditionError) {
				respondAgentConfigPreconditionError(respond, error);
				return;
			}
			throw error;
		}
		respond(true, {
			ok: true,
			agentId,
			name: safeName,
			workspace: workspaceDir,
			model
		}, void 0);
	},
	"agents.update": async ({ params, respond, context }) => {
		if (!require_src.validateAgentsUpdateParams(params)) {
			respondInvalidMethodParams(respond, "agents.update", require_src.validateAgentsUpdateParams.errors);
			return;
		}
		const cfg = context.getRuntimeConfig();
		const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
		if (!isConfiguredAgent(cfg, agentId)) {
			respondAgentNotFound(respond, agentId);
			return;
		}
		const workspaceDir = typeof params.workspace === "string" && params.workspace.trim() ? require_home_dir.resolveUserPath(params.workspace.trim()) : void 0;
		const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model);
		const safeName = typeof params.name === "string" && params.name.trim() ? sanitizeIdentityLine(params.name.trim()) : void 0;
		const identity = createAgentIdentityConfig({
			safeName,
			emoji: params.emoji,
			avatar: params.avatar
		});
		const hasIdentityFields = Boolean(identity);
		const agentConfigUpdate = buildAgentConfigUpdate({
			agentId,
			safeName,
			workspaceDir,
			model,
			identity
		});
		const nextConfig = require_agents_config.applyAgentConfig(cfg, agentConfigUpdate);
		let ensuredWorkspace;
		if (workspaceDir) ensuredWorkspace = await require_workspace.ensureAgentWorkspace({
			dir: workspaceDir,
			ensureBootstrapFiles: !Boolean(nextConfig.agents?.defaults?.skipBootstrap),
			skipOptionalBootstrapFiles: nextConfig.agents?.defaults?.skipOptionalBootstrapFiles
		});
		const persistedIdentity = normalizeIdentityForFile(require_identity.resolveAgentIdentity(nextConfig, agentId));
		if (persistedIdentity && (workspaceDir || hasIdentityFields)) {
			const identityWorkspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(nextConfig, agentId);
			const previousWorkspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId);
			const fallbackWorkspaceDir = workspaceDir && identityWorkspaceDir !== previousWorkspaceDir ? previousWorkspaceDir : void 0;
			const identityContent = await buildIdentityMarkdownOrRespondUnsafe({
				respond,
				workspaceDir: identityWorkspaceDir,
				identity: persistedIdentity,
				fallbackWorkspaceDir,
				preferFallbackWorkspaceContent: Boolean(fallbackWorkspaceDir) && ensuredWorkspace?.identityPathCreated === true
			});
			if (identityContent === null) return;
			if (!await writeWorkspaceFileOrRespond({
				respond,
				workspaceDir: identityWorkspaceDir,
				name: "IDENTITY.md",
				content: identityContent
			})) return;
		}
		try {
			await updateAgentConfigEntry(agentConfigUpdate);
		} catch (error) {
			if (error instanceof AgentConfigPreconditionError) {
				respondAgentConfigPreconditionError(respond, error);
				return;
			}
			throw error;
		}
		respond(true, {
			ok: true,
			agentId
		}, void 0);
	},
	"agents.delete": async ({ params, respond, context }) => {
		if (!require_src.validateAgentsDeleteParams(params)) {
			respondInvalidMethodParams(respond, "agents.delete", require_src.validateAgentsDeleteParams.errors);
			return;
		}
		const cfg = context.getRuntimeConfig();
		const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
		if (agentId === "main") {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `"${require_session_key.DEFAULT_AGENT_ID}" cannot be deleted`));
			return;
		}
		if (!isConfiguredAgent(cfg, agentId)) {
			respondAgentNotFound(respond, agentId);
			return;
		}
		const deleteFiles = typeof params.deleteFiles === "boolean" ? params.deleteFiles : true;
		let committed;
		try {
			committed = await deleteAgentConfigEntry({ agentId });
		} catch (error) {
			if (error instanceof AgentConfigPreconditionError) {
				respondAgentConfigPreconditionError(respond, error);
				return;
			}
			throw error;
		}
		const deleteResult = committed.result;
		if (!deleteResult) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "agent delete did not commit"));
			return;
		}
		await require_sessions.purgeAgentSessionStoreEntries(cfg, agentId);
		if (deleteFiles) {
			const deleteWorkspace = findOverlappingWorkspaceAgentIds(committed.nextConfig, agentId, deleteResult.workspaceDir).length === 0;
			const pathsToTrash = [deleteResult.agentDir, deleteResult.sessionsDir];
			if (deleteWorkspace) {
				pathsToTrash.unshift(deleteResult.workspaceDir);
				for (const [index, attestationPath] of require_workspace.resolveWorkspaceAttestationPaths(deleteResult.workspaceDir).entries()) if (await require_workspace.shouldRemoveWorkspaceAttestation(attestationPath, { trustUnknown: index === 0 })) pathsToTrash.push(attestationPath);
			}
			await Promise.all(pathsToTrash.map((pathname) => moveToTrashBestEffort(pathname)));
		}
		respond(true, {
			ok: true,
			agentId,
			removedBindings: deleteResult.removedBindings
		}, void 0);
	},
	"agents.files.list": async ({ params, respond, context }) => {
		if (!require_src.validateAgentsFilesListParams(params)) {
			respondInvalidMethodParams(respond, "agents.files.list", require_src.validateAgentsFilesListParams.errors);
			return;
		}
		const cfg = context.getRuntimeConfig();
		const agentId = resolveAgentIdOrError(params.agentId, cfg);
		if (!agentId) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown agent id"));
			return;
		}
		const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId);
		let hideBootstrap = false;
		try {
			hideBootstrap = await agentsHandlerDeps.isWorkspaceSetupCompleted(workspaceDir);
		} catch {}
		respond(true, {
			agentId,
			workspace: workspaceDir,
			files: await listAgentFiles(workspaceDir, { hideBootstrap })
		}, void 0);
	},
	"agents.files.get": async ({ params, respond, context }) => {
		if (!require_src.validateAgentsFilesGetParams(params)) {
			respondInvalidMethodParams(respond, "agents.files.get", require_src.validateAgentsFilesGetParams.errors);
			return;
		}
		const resolved = resolveAgentWorkspaceFileOrRespondError(params, respond, context.getRuntimeConfig());
		if (!resolved) return;
		const { agentId, workspaceDir, name } = resolved;
		const filePath = node_path.default.join(workspaceDir, name);
		let safeRead;
		try {
			safeRead = await (await agentsHandlerDeps.root(workspaceDir)).read(name, {
				hardlinks: "reject",
				nonBlockingRead: true
			});
		} catch (err) {
			if (err instanceof _openclaw_fs_safe_errors.FsSafeError && err.code === "not-found") {
				respondWorkspaceFileMissing({
					respond,
					agentId,
					workspaceDir,
					name,
					filePath
				});
				return;
			}
			if (err instanceof _openclaw_fs_safe_errors.FsSafeError) {
				respondWorkspaceFileUnsafe(respond, name);
				return;
			}
			throw err;
		}
		respond(true, {
			agentId,
			workspace: workspaceDir,
			file: {
				name,
				path: filePath,
				missing: false,
				size: safeRead.stat.size,
				updatedAtMs: Math.floor(safeRead.stat.mtimeMs),
				content: safeRead.buffer.toString("utf-8")
			}
		}, void 0);
	},
	"agents.files.set": async ({ params, respond, context }) => {
		if (!require_src.validateAgentsFilesSetParams(params)) {
			respondInvalidMethodParams(respond, "agents.files.set", require_src.validateAgentsFilesSetParams.errors);
			return;
		}
		const resolved = resolveAgentWorkspaceFileOrRespondError(params, respond, context.getRuntimeConfig());
		if (!resolved) return;
		const { agentId, workspaceDir, name } = resolved;
		await node_fs_promises.default.mkdir(workspaceDir, { recursive: true });
		const filePath = node_path.default.join(workspaceDir, name);
		const content = params.content;
		let workspaceRoot;
		try {
			workspaceRoot = await agentsHandlerDeps.root(workspaceDir);
			await workspaceRoot.write(name, content, { encoding: "utf8" });
		} catch (err) {
			if (!(err instanceof _openclaw_fs_safe_errors.FsSafeError)) throw err;
			respondWorkspaceFileUnsafe(respond, name);
			return;
		}
		const meta = await statWorkspaceFileSafely(workspaceRoot, workspaceDir, name);
		respond(true, {
			ok: true,
			agentId,
			workspace: workspaceDir,
			file: {
				name,
				path: filePath,
				missing: false,
				size: meta?.size,
				updatedAtMs: meta?.updatedAtMs,
				content
			}
		}, void 0);
	}
};
//#endregion
exports.__testing = testing;
exports.testing = testing;
exports.agentsHandlers = agentsHandlers;
