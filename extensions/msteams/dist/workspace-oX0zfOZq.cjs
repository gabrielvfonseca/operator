const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_replace_file = require("./replace-file-D77oDPOz.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_retry = require("./retry-DXZi6qkk.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_frontmatter = require("./frontmatter-WKYeKqrx.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/memory/root-memory-files.ts
/** Canonical root memory file name used by current workspaces. */
const CANONICAL_ROOT_MEMORY_FILENAME = "MEMORY.md";
/** Legacy root memory file name kept out of auxiliary scans. */
const LEGACY_ROOT_MEMORY_FILENAME = "memory.md";
/** Resolves the canonical root memory file path for a workspace. */
function resolveCanonicalRootMemoryPath(workspaceDir) {
	return node_path.default.join(workspaceDir, CANONICAL_ROOT_MEMORY_FILENAME);
}
/** Resolves the legacy root memory file path for a workspace. */
function resolveLegacyRootMemoryPath(workspaceDir) {
	return node_path.default.join(workspaceDir, LEGACY_ROOT_MEMORY_FILENAME);
}
/** Resolves the repair directory used while migrating root memory files. */
function resolveRootMemoryRepairDir(workspaceDir) {
	return node_path.default.join(workspaceDir, ".operator-repair", "root-memory");
}
/** Checks for an exact directory entry without case-folded path lookup. */
async function exactWorkspaceEntryExists(dir, name) {
	try {
		return (await node_fs_promises.default.readdir(dir)).includes(name);
	} catch {
		return false;
	}
}
//#endregion
//#region src/agents/workspace-templates.ts
/**
* Workspace template directory discovery.
* Resolves source, docs, package, and fallback template locations with a small
* cache so setup flows can find templates in dev and packaged installs.
*/
const FALLBACK_TEMPLATE_DIR = node_path.default.resolve(node_path.default.dirname((0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href)), "../../src/agents/templates");
const FALLBACK_DOCS_TEMPLATE_DIR = node_path.default.resolve(node_path.default.dirname((0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href)), "../../docs/reference/templates");
let cachedTemplateDir;
let resolvingTemplateDir;
/** Resolves the primary workspace-template directory from package, cwd, or fallback paths. */
async function resolveWorkspaceTemplateDir(opts) {
	if (cachedTemplateDir) return cachedTemplateDir;
	if (resolvingTemplateDir) return resolvingTemplateDir;
	resolvingTemplateDir = (async () => {
		const moduleUrl = opts?.moduleUrl ?? require("url").pathToFileURL(__filename).href;
		const argv1 = opts?.argv1 ?? process.argv[1];
		const cwd = opts?.cwd ?? process.cwd();
		const candidates = buildTemplateDirCandidates({
			packageRoot: await require_openclaw_root.resolveOperatorPackageRoot({
				moduleUrl,
				argv1,
				cwd
			}),
			cwd,
			relativeDir: node_path.default.join("src", "agents", "templates"),
			fallbackDir: FALLBACK_TEMPLATE_DIR
		});
		for (const candidate of candidates) if (await require_utils.pathExists(candidate)) {
			cachedTemplateDir = candidate;
			return candidate;
		}
		cachedTemplateDir = candidates[0] ?? FALLBACK_TEMPLATE_DIR;
		return cachedTemplateDir;
	})();
	try {
		return await resolvingTemplateDir;
	} finally {
		resolvingTemplateDir = void 0;
	}
}
function buildTemplateDirCandidates(params) {
	return [
		params.packageRoot ? node_path.default.join(params.packageRoot, params.relativeDir) : null,
		params.cwd ? node_path.default.resolve(params.cwd, params.relativeDir) : null,
		params.fallbackDir
	].filter(Boolean);
}
async function resolveExistingTemplateDirs(candidates) {
	const dirs = [];
	for (const candidate of candidates) {
		if (dirs.includes(candidate)) continue;
		if (await require_utils.pathExists(candidate)) dirs.push(candidate);
	}
	return dirs;
}
/** Resolves all existing workspace-template search directories, including docs templates. */
async function resolveWorkspaceTemplateSearchDirs(opts) {
	const moduleUrl = opts?.moduleUrl ?? require("url").pathToFileURL(__filename).href;
	const argv1 = opts?.argv1 ?? process.argv[1];
	const cwd = opts?.cwd ?? process.cwd();
	const packageRoot = await require_openclaw_root.resolveOperatorPackageRoot({
		moduleUrl,
		argv1,
		cwd
	});
	const primary = await resolveWorkspaceTemplateDir(opts);
	return [primary, ...(await resolveExistingTemplateDirs(buildTemplateDirCandidates({
		packageRoot,
		cwd,
		relativeDir: node_path.default.join("docs", "reference", "templates"),
		fallbackDir: FALLBACK_DOCS_TEMPLATE_DIR
	}))).filter((candidate) => candidate !== primary)];
}
//#endregion
//#region src/agents/workspace.ts
/**
* Workspace bootstrap, template, state, and attestation helpers. This module
* creates and reads AGENTS/SOUL/TOOLS-style bootstrap files while guarding
* filesystem boundaries and recently-attested workspaces.
*/
const DEFAULT_AGENTS_FILENAME = "AGENTS.MD";
const DEFAULT_SOUL_FILENAME = "SOUL.md";
const DEFAULT_TOOLS_FILENAME = "TOOLS.md";
const DEFAULT_IDENTITY_FILENAME = "IDENTITY.md";
const DEFAULT_USER_FILENAME = "USER.md";
const DEFAULT_HEARTBEAT_FILENAME = "HEARTBEAT.md";
const DEFAULT_BOOTSTRAP_FILENAME = "BOOTSTRAP.md";
const DEFAULT_MEMORY_FILENAME = CANONICAL_ROOT_MEMORY_FILENAME;
const LEGACY_WORKSPACE_STATE_DIRNAME = ".operator";
const LEGACY_WORKSPACE_STATE_FILENAME = "workspace-state.json";
const WORKSPACE_STATE_FILENAME = "operator-workspace-state.json";
const WORKSPACE_STATE_VERSION = 1;
const WORKSPACE_ATTESTATION_SUFFIX = ".attested";
const WORKSPACE_ATTESTATION_DIRNAME = "workspace-attestations";
const WORKSPACE_ATTESTATION_RECENT_MS = 1440 * 60 * 1e3;
const WORKSPACE_ATTESTATION_HEADER = "operator-workspace-attestation:v1";
const WORKSPACE_ATTESTATION_MAX_BYTES = 2048;
const WORKSPACE_ONBOARDING_PROFILE_FILENAMES = [
	DEFAULT_SOUL_FILENAME,
	DEFAULT_IDENTITY_FILENAME,
	DEFAULT_USER_FILENAME
];
const TRANSIENT_WORKSPACE_READ_CODES = /* @__PURE__ */ new Set([
	"EAGAIN",
	"EWOULDBLOCK",
	"EINTR"
]);
const TRANSIENT_WORKSPACE_READ_ERRNOS = /* @__PURE__ */ new Set([-11, -4]);
const TRANSIENT_WORKSPACE_READ_MESSAGE = /Unknown system error -(?:11|4)\b/i;
const workspaceTemplateCache = /* @__PURE__ */ new Map();
let gitAvailabilityPromise = null;
const MAX_WORKSPACE_BOOTSTRAP_FILE_BYTES = 2 * 1024 * 1024;
const workspaceFileCache = /* @__PURE__ */ new Map();
function workspaceFileIdentity(stat, canonicalPath) {
	return `${canonicalPath}|${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeMs}`;
}
async function readWorkspaceFileWithGuards(params) {
	try {
		return await require_retry.retryAsync(async () => {
			const opened = await (0, _openclaw_fs_safe_advanced.openRootFile)({
				absolutePath: params.filePath,
				rootPath: params.workspaceDir,
				boundaryLabel: "workspace root",
				maxBytes: MAX_WORKSPACE_BOOTSTRAP_FILE_BYTES
			});
			if (!opened.ok) {
				if (isTransientWorkspaceReadError(opened.error)) throw opened.error;
				workspaceFileCache.delete(params.filePath);
				return opened;
			}
			const identity = workspaceFileIdentity(opened.stat, opened.path);
			const cached = workspaceFileCache.get(params.filePath);
			if (cached && cached.identity === identity) {
				node_fs.default.closeSync(opened.fd);
				return {
					ok: true,
					content: cached.content
				};
			}
			try {
				const content = node_fs.default.readFileSync(opened.fd, "utf-8");
				workspaceFileCache.set(params.filePath, {
					content,
					identity
				});
				return {
					ok: true,
					content
				};
			} finally {
				node_fs.default.closeSync(opened.fd);
			}
		}, {
			attempts: 3,
			minDelayMs: 50,
			maxDelayMs: 50,
			shouldRetry: (err) => isTransientWorkspaceReadError(err)
		});
	} catch (error) {
		workspaceFileCache.delete(params.filePath);
		return {
			ok: false,
			reason: "io",
			error
		};
	}
}
function stripFrontMatter(content) {
	return require_frontmatter.extractFrontmatterBlock(content)?.body.replace(/^\s+/, "") ?? content;
}
async function loadTemplate(name) {
	const cached = workspaceTemplateCache.get(name);
	if (cached) return cached;
	const pending = (async () => {
		const templateDirs = name === "HEARTBEAT.md" ? [await resolveWorkspaceTemplateDir()] : await resolveWorkspaceTemplateSearchDirs();
		const triedPaths = [];
		for (const templateDir of templateDirs) {
			const templatePath = node_path.default.join(templateDir, name);
			triedPaths.push(templatePath);
			try {
				return stripFrontMatter(await node_fs_promises.default.readFile(templatePath, "utf-8"));
			} catch (error) {
				if (error?.code !== "ENOENT") throw error;
			}
		}
		throw new Error(`Missing workspace template: ${name} (${triedPaths.join(", ")}). Ensure workspace templates are packaged.`);
	})();
	workspaceTemplateCache.set(name, pending);
	try {
		return await pending;
	} catch (error) {
		workspaceTemplateCache.delete(name);
		throw error;
	}
}
const OPTIONAL_BOOTSTRAP_FILENAMES = /* @__PURE__ */ new Set([
	DEFAULT_SOUL_FILENAME,
	DEFAULT_IDENTITY_FILENAME,
	DEFAULT_USER_FILENAME,
	DEFAULT_HEARTBEAT_FILENAME
]);
const WORKSPACE_VANISHED_ERROR_CODE = "WORKSPACE_VANISHED";
var WorkspaceVanishedError = class extends Error {
	constructor(params) {
		super(`Operator workspace appears to have disappeared after a recent initialization: ${params.workspaceDir}. Refusing to reseed BOOTSTRAP.md over a recently attested workspace. Restore the workspace or remove ${params.attestationPath} if this reset was intentional.`);
		this.code = WORKSPACE_VANISHED_ERROR_CODE;
		this.name = "WorkspaceVanishedError";
		this.workspaceDir = params.workspaceDir;
		this.attestationPath = params.attestationPath;
	}
};
async function writeFileIfMissing(filePath, content) {
	try {
		await node_fs_promises.default.writeFile(filePath, content, {
			encoding: "utf-8",
			flag: "wx"
		});
		return true;
	} catch (err) {
		if (err.code !== "EEXIST") throw err;
		return false;
	}
}
function isTransientWorkspaceReadError(error) {
	const fsError = error;
	if (fsError?.code && TRANSIENT_WORKSPACE_READ_CODES.has(fsError.code)) return true;
	if (typeof fsError?.errno === "number" && TRANSIENT_WORKSPACE_READ_ERRNOS.has(fsError.errno)) return true;
	return error instanceof Error && TRANSIENT_WORKSPACE_READ_MESSAGE.test(error.message);
}
async function fileContentDiffersFromTemplate(filePath, template) {
	try {
		return await require_retry.retryAsync(async () => await node_fs_promises.default.readFile(filePath, "utf-8") !== template, {
			attempts: 3,
			minDelayMs: 50,
			maxDelayMs: 50,
			shouldRetry: (err) => isTransientWorkspaceReadError(err)
		});
	} catch (err) {
		if (err.code === "ENOENT") return false;
		throw err;
	}
}
async function hasWorkspaceUserContentEvidence(dir, opts) {
	const indicators = [node_path.default.join(dir, "memory")];
	if (opts?.includeGit) indicators.push(node_path.default.join(dir, ".git"));
	for (const indicator of indicators) try {
		await node_fs_promises.default.access(indicator);
		return true;
	} catch {}
	if (await exactWorkspaceEntryExists(dir, DEFAULT_MEMORY_FILENAME)) return true;
	return await hasWorkspaceSkillEvidence(dir);
}
async function hasWorkspaceSkillEvidence(dir) {
	try {
		const skillEntries = await node_fs_promises.default.readdir(node_path.default.join(dir, "skills"), { withFileTypes: true });
		for (const entry of skillEntries) {
			if (!entry.isDirectory()) continue;
			try {
				await node_fs_promises.default.access(node_path.default.join(dir, "skills", entry.name, "SKILL.md"));
				return true;
			} catch {}
		}
	} catch {}
	return false;
}
async function hasSkipBootstrapWorkspaceContentEvidence(dir) {
	try {
		const entries = await node_fs_promises.default.readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.name === ".DS_Store" || entry.name === LEGACY_WORKSPACE_STATE_DIRNAME || entry.name === WORKSPACE_STATE_FILENAME) continue;
			if (entry.name === "skills" && entry.isDirectory()) {
				if (!await hasWorkspaceSkillEvidence(dir)) continue;
			}
			return true;
		}
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}
	return false;
}
async function workspaceProfileLooksConfigured(params) {
	return (await Promise.all(WORKSPACE_ONBOARDING_PROFILE_FILENAMES.map(async (fileName) => fileContentDiffersFromTemplate(node_path.default.join(params.dir, fileName), await loadTemplate(fileName))))).some(Boolean) || await hasWorkspaceUserContentEvidence(params.dir, { includeGit: params.includeGitEvidence });
}
async function workspaceRequiredBootstrapLooksCustomized(dir, opts) {
	const fileNames = [
		DEFAULT_AGENTS_FILENAME,
		DEFAULT_TOOLS_FILENAME,
		DEFAULT_HEARTBEAT_FILENAME
	];
	const generatedHashes = opts?.attestationPath ? await readWorkspaceAttestationGeneratedHashes(opts.attestationPath) : void 0;
	if (generatedHashes) {
		for (const fileName of fileNames) {
			const filePath = node_path.default.join(dir, fileName);
			const generatedHash = generatedHashes.get(fileName);
			try {
				const content = await node_fs_promises.default.readFile(filePath, "utf-8");
				const contentHash = (0, node_crypto.createHash)("sha256").update(content).digest("hex");
				if (!generatedHash || contentHash !== generatedHash) return true;
			} catch {}
		}
		return false;
	}
	return (await Promise.all(fileNames.map(async (fileName) => fileContentDiffersFromTemplate(node_path.default.join(dir, fileName), await loadTemplate(fileName))))).some(Boolean);
}
async function workspaceAttestedGeneratedFilesIntact(dir, attestationPath) {
	const generatedHashes = await readWorkspaceAttestationGeneratedHashes(attestationPath);
	if (!generatedHashes) return false;
	for (const [fileName, generatedHash] of generatedHashes) try {
		const content = await node_fs_promises.default.readFile(node_path.default.join(dir, fileName), "utf-8");
		if ((0, node_crypto.createHash)("sha256").update(content).digest("hex") !== generatedHash) return false;
	} catch {
		return false;
	}
	return true;
}
async function workspaceHasBootstrapCompletionEvidence(params) {
	return await workspaceProfileLooksConfigured(params);
}
async function reconcileWorkspaceBootstrapCompletionState(params) {
	const bootstrapExists = params.bootstrapExists ?? await (0, _openclaw_fs_safe_advanced.pathExists)(params.bootstrapPath);
	if (typeof params.state.setupCompletedAt === "string" && params.state.setupCompletedAt.trim().length > 0) return {
		repaired: false,
		bootstrapExists,
		state: params.state
	};
	if (params.state.bootstrapSeededAt && !bootstrapExists) {
		const completedState = {
			...params.state,
			setupCompletedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		await writeWorkspaceSetupState(params.statePath, completedState);
		return {
			repaired: true,
			bootstrapExists: false,
			state: completedState
		};
	}
	if (!bootstrapExists || !await workspaceHasBootstrapCompletionEvidence({ dir: params.dir })) return {
		repaired: false,
		bootstrapExists,
		state: params.state
	};
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const repairedState = {
		...params.state,
		bootstrapSeededAt: params.state.bootstrapSeededAt ?? now,
		setupCompletedAt: now
	};
	await writeWorkspaceSetupState(params.statePath, repairedState);
	try {
		await node_fs_promises.default.rm(params.bootstrapPath, { force: true });
		return {
			repaired: true,
			bootstrapExists: false,
			state: repairedState
		};
	} catch {
		return {
			repaired: true,
			bootstrapExists: true,
			state: repairedState
		};
	}
}
function resolveWorkspaceStatePath(dir) {
	return node_path.default.join(dir, WORKSPACE_STATE_FILENAME);
}
function resolveLegacyWorkspaceStatePath(dir) {
	return node_path.default.join(dir, LEGACY_WORKSPACE_STATE_DIRNAME, LEGACY_WORKSPACE_STATE_FILENAME);
}
function resolveWorkspaceAttestationPathInStateDir(dir, stateDir) {
	const key = (0, node_crypto.createHash)("sha256").update(node_path.default.resolve(dir)).digest("hex");
	return node_path.default.join(stateDir, WORKSPACE_ATTESTATION_DIRNAME, `${key}.attested`);
}
function resolveLegacyWorkspaceAttestationPath(dir) {
	return `${dir}${WORKSPACE_ATTESTATION_SUFFIX}`;
}
function resolveWorkspaceAttestationPaths(dir) {
	const stateAttestationPaths = [require_paths.resolveStateDir(), ...require_paths.resolveLegacyStateDirs()].map((stateDir) => resolveWorkspaceAttestationPathInStateDir(dir, stateDir));
	const legacy = resolveLegacyWorkspaceAttestationPath(dir);
	return [.../* @__PURE__ */ new Set([...stateAttestationPaths, legacy])];
}
async function findRecentWorkspaceAttestationPath(attestationPaths) {
	for (const [index, attestationPath] of attestationPaths.entries()) if (await hasRecentWorkspaceAttestation(attestationPath, { trustUnknown: index === 0 })) return attestationPath;
	return null;
}
async function hasRecentWorkspaceAttestation(attestationPath, opts) {
	try {
		const stat = await node_fs_promises.default.lstat(attestationPath);
		if (!stat.isFile() || stat.size > WORKSPACE_ATTESTATION_MAX_BYTES || Date.now() - stat.mtimeMs > WORKSPACE_ATTESTATION_RECENT_MS) return false;
		const status = await readWorkspaceAttestationMarkerStatus(attestationPath);
		return status === "marker" || opts?.trustUnknown === true && status === "unknown";
	} catch (err) {
		if (err.code !== "ENOENT") return opts?.trustUnknown === true;
		return false;
	}
}
async function shouldRemoveWorkspaceAttestation(attestationPath, opts) {
	try {
		return await readWorkspaceAttestationMarkerStatus(attestationPath) === "marker" || await hasRecentWorkspaceAttestation(attestationPath, opts);
	} catch {
		return false;
	}
}
async function readWorkspaceAttestationMarkerStatus(attestationPath) {
	try {
		const stat = await node_fs_promises.default.lstat(attestationPath);
		if (!stat.isFile() || stat.size > WORKSPACE_ATTESTATION_MAX_BYTES) return "not-marker";
		if ((await node_fs_promises.default.readFile(attestationPath, "utf-8")).startsWith(`${WORKSPACE_ATTESTATION_HEADER}\n`)) return "marker";
		return "not-marker";
	} catch (err) {
		return err.code === "ENOENT" ? "missing" : "unknown";
	}
}
async function readWorkspaceAttestationGeneratedHashes(attestationPath) {
	try {
		const stat = await node_fs_promises.default.lstat(attestationPath);
		if (!stat.isFile() || stat.size > WORKSPACE_ATTESTATION_MAX_BYTES) return;
		const raw = await node_fs_promises.default.readFile(attestationPath, "utf-8");
		if (!raw.startsWith(`${WORKSPACE_ATTESTATION_HEADER}\n`)) return;
		const hashes = /* @__PURE__ */ new Map();
		for (const line of raw.split(/\r?\n/)) {
			const match = /^generated:([^:]+):([a-f0-9]{64})$/.exec(line);
			if (match?.[1] && match[2]) hashes.set(match[1], match[2]);
		}
		return hashes.size > 0 ? hashes : void 0;
	} catch {
		return;
	}
}
async function collectGeneratedBootstrapHashes(dir) {
	const hashes = /* @__PURE__ */ new Map();
	const fileNames = [
		DEFAULT_AGENTS_FILENAME,
		DEFAULT_SOUL_FILENAME,
		DEFAULT_TOOLS_FILENAME,
		DEFAULT_IDENTITY_FILENAME,
		DEFAULT_USER_FILENAME,
		DEFAULT_HEARTBEAT_FILENAME
	];
	for (const fileName of fileNames) try {
		const content = await node_fs_promises.default.readFile(node_path.default.join(dir, fileName), "utf-8");
		if (content === await loadTemplate(fileName)) hashes.set(fileName, (0, node_crypto.createHash)("sha256").update(content).digest("hex"));
	} catch {}
	return hashes;
}
async function buildWorkspaceAttestationContent(dir, now) {
	const hashes = await collectGeneratedBootstrapHashes(dir);
	const lines = [WORKSPACE_ATTESTATION_HEADER, now.toISOString()];
	for (const [fileName, hash] of [...hashes.entries()].toSorted(([a], [b]) => a.localeCompare(b))) lines.push(`generated:${fileName}:${hash}`);
	return `${lines.join("\n")}\n`;
}
async function writeWorkspaceAttestation(attestationPath, dir) {
	await node_fs_promises.default.mkdir(node_path.default.dirname(attestationPath), { recursive: true });
	const now = /* @__PURE__ */ new Date();
	const content = await buildWorkspaceAttestationContent(dir, now);
	try {
		const status = await readWorkspaceAttestationMarkerStatus(attestationPath);
		if (status === "marker") {
			await node_fs_promises.default.writeFile(attestationPath, content, "utf-8");
			await node_fs_promises.default.utimes(attestationPath, now, now);
			return;
		}
		if (status !== "missing") return;
	} catch {
		return;
	}
	const noFollowFlag = typeof node_fs.default.constants.O_NOFOLLOW === "number" ? node_fs.default.constants.O_NOFOLLOW : 0;
	const handle = await node_fs_promises.default.open(attestationPath, node_fs.default.constants.O_WRONLY | node_fs.default.constants.O_CREAT | node_fs.default.constants.O_EXCL | noFollowFlag, 384);
	try {
		await handle.writeFile(content, "utf-8");
	} finally {
		await handle.close();
	}
}
async function maybeWriteWorkspaceAttestation(attestationPath, dir) {
	try {
		await writeWorkspaceAttestation(attestationPath, dir);
	} catch {}
}
function parseWorkspaceSetupState(raw) {
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return null;
		const legacyCompletedAt = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(parsed.onboardingCompletedAt);
		return {
			version: WORKSPACE_STATE_VERSION,
			bootstrapSeededAt: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(parsed.bootstrapSeededAt),
			setupCompletedAt: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(parsed.setupCompletedAt) ?? legacyCompletedAt
		};
	} catch {
		return null;
	}
}
function hasWorkspaceSetupStateMarker(state) {
	return Boolean(state.bootstrapSeededAt || state.setupCompletedAt);
}
function needsWorkspaceSetupStateRewrite(raw, state) {
	return raw.includes("\"onboardingCompletedAt\"") && !raw.includes("\"setupCompletedAt\"") && Boolean(state.setupCompletedAt);
}
async function readWorkspaceSetupStateFile(statePath) {
	try {
		const raw = await node_fs_promises.default.readFile(statePath, "utf-8");
		const parsed = parseWorkspaceSetupState(raw);
		return parsed ? {
			raw,
			state: parsed
		} : null;
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
		return null;
	}
}
async function readWorkspaceSetupStateForDir(dir, opts) {
	const resolvedDir = require_home_dir.resolveUserPath(dir);
	const statePath = resolveWorkspaceStatePath(resolvedDir);
	const canonical = await readWorkspaceSetupStateFile(statePath);
	if (canonical) {
		if (opts?.persistLegacyMigration && needsWorkspaceSetupStateRewrite(canonical.raw, canonical.state)) await writeWorkspaceSetupState(statePath, canonical.state);
		return canonical.state;
	}
	const legacyStatePath = resolveLegacyWorkspaceStatePath(resolvedDir);
	let legacy;
	try {
		legacy = await readWorkspaceSetupStateFile(legacyStatePath);
	} catch {
		legacy = null;
	}
	if (!legacy) return { version: WORKSPACE_STATE_VERSION };
	if (opts?.persistLegacyMigration && hasWorkspaceSetupStateMarker(legacy.state)) await writeWorkspaceSetupState(statePath, legacy.state);
	return legacy.state;
}
async function isWorkspaceSetupCompleted(dir) {
	const state = await readWorkspaceSetupStateForDir(dir);
	return typeof state.setupCompletedAt === "string" && state.setupCompletedAt.trim().length > 0;
}
async function resolveWorkspaceBootstrapStatus(dir) {
	const resolvedDir = require_home_dir.resolveUserPath(dir);
	const state = await readWorkspaceSetupStateForDir(resolvedDir);
	if (typeof state.setupCompletedAt === "string" && state.setupCompletedAt.trim().length > 0) return "complete";
	if (!await (0, _openclaw_fs_safe_advanced.pathExists)(node_path.default.join(resolvedDir, "BOOTSTRAP.md"))) return "complete";
	return "pending";
}
async function isWorkspaceBootstrapPending(dir) {
	return await resolveWorkspaceBootstrapStatus(dir) === "pending";
}
async function writeWorkspaceSetupState(statePath, state) {
	await require_replace_file.replaceFileAtomic({
		filePath: statePath,
		content: `${JSON.stringify(state, null, 2)}\n`,
		tempPrefix: WORKSPACE_STATE_FILENAME
	});
}
async function hasGitRepo(dir) {
	try {
		await node_fs_promises.default.stat(node_path.default.join(dir, ".git"));
		return true;
	} catch {
		return false;
	}
}
async function isGitAvailable() {
	if (gitAvailabilityPromise) return gitAvailabilityPromise;
	gitAvailabilityPromise = (async () => {
		try {
			return (await require_exec.runCommandWithTimeout(["git", "--version"], { timeoutMs: 2e3 })).code === 0;
		} catch {
			return false;
		}
	})();
	return gitAvailabilityPromise;
}
async function ensureGitRepo(dir, isBrandNewWorkspace) {
	if (!isBrandNewWorkspace) return;
	if (await hasGitRepo(dir)) return;
	if (!await isGitAvailable()) return;
	try {
		await require_exec.runCommandWithTimeout(["git", "init"], {
			cwd: dir,
			timeoutMs: 1e4
		});
	} catch {}
}
async function ensureAgentWorkspace(params) {
	const dir = require_home_dir.resolveUserPath(params?.dir?.trim() ? params.dir.trim() : require_agent_scope_config.DEFAULT_AGENT_WORKSPACE_DIR);
	const [attestationPath, ...legacyAttestationPaths] = resolveWorkspaceAttestationPaths(dir);
	if (!attestationPath) throw new Error("Workspace attestation path could not be resolved");
	const recentAttestationPath = await findRecentWorkspaceAttestationPath([attestationPath, ...legacyAttestationPaths]);
	if (!await (0, _openclaw_fs_safe_advanced.pathExists)(dir) && recentAttestationPath) throw new WorkspaceVanishedError({
		workspaceDir: dir,
		attestationPath: recentAttestationPath
	});
	await node_fs_promises.default.mkdir(dir, { recursive: true });
	if (!params?.ensureBootstrapFiles) {
		const hasContentEvidence = await hasSkipBootstrapWorkspaceContentEvidence(dir);
		if (recentAttestationPath && !hasContentEvidence) throw new WorkspaceVanishedError({
			workspaceDir: dir,
			attestationPath: recentAttestationPath
		});
		if (hasContentEvidence) await maybeWriteWorkspaceAttestation(attestationPath, dir);
		return { dir };
	}
	const agentsPath = node_path.default.join(dir, DEFAULT_AGENTS_FILENAME);
	const soulPath = node_path.default.join(dir, DEFAULT_SOUL_FILENAME);
	const toolsPath = node_path.default.join(dir, DEFAULT_TOOLS_FILENAME);
	const identityPath = node_path.default.join(dir, DEFAULT_IDENTITY_FILENAME);
	const userPath = node_path.default.join(dir, DEFAULT_USER_FILENAME);
	const heartbeatPath = node_path.default.join(dir, DEFAULT_HEARTBEAT_FILENAME);
	const bootstrapPath = node_path.default.join(dir, DEFAULT_BOOTSTRAP_FILENAME);
	const statePath = resolveWorkspaceStatePath(dir);
	const isBrandNewWorkspace = await (async () => {
		const paths = [...[
			agentsPath,
			soulPath,
			toolsPath,
			identityPath,
			userPath,
			heartbeatPath
		], node_path.default.join(dir, "memory")];
		return (await Promise.all(paths.map(async (p) => {
			try {
				await node_fs_promises.default.access(p);
				return true;
			} catch {
				return false;
			}
		}))).every((v) => !v) && !await hasWorkspaceUserContentEvidence(dir);
	})();
	if (isBrandNewWorkspace) {
		if (recentAttestationPath) throw new WorkspaceVanishedError({
			workspaceDir: dir,
			attestationPath: recentAttestationPath
		});
	}
	if (recentAttestationPath && !isBrandNewWorkspace) {
		const bootstrapExists = await (0, _openclaw_fs_safe_advanced.pathExists)(bootstrapPath);
		const hasSetupState = hasWorkspaceSetupStateMarker(await readWorkspaceSetupStateForDir(dir, { persistLegacyMigration: true }));
		const hasCustomizedRequiredBootstrap = await workspaceRequiredBootstrapLooksCustomized(dir, { attestationPath: recentAttestationPath });
		const hasConfiguredProfile = await workspaceProfileLooksConfigured({ dir });
		if (!(bootstrapExists || hasCustomizedRequiredBootstrap || hasConfiguredProfile || hasSetupState && await workspaceAttestedGeneratedFilesIntact(dir, recentAttestationPath))) throw new WorkspaceVanishedError({
			workspaceDir: dir,
			attestationPath: recentAttestationPath
		});
	}
	const agentsTemplate = await loadTemplate(DEFAULT_AGENTS_FILENAME);
	const soulTemplate = await loadTemplate(DEFAULT_SOUL_FILENAME);
	const toolsTemplate = await loadTemplate(DEFAULT_TOOLS_FILENAME);
	const identityTemplate = await loadTemplate(DEFAULT_IDENTITY_FILENAME);
	const userTemplate = await loadTemplate(DEFAULT_USER_FILENAME);
	const heartbeatTemplate = await loadTemplate(DEFAULT_HEARTBEAT_FILENAME);
	const skipOptionalBootstrapFiles = new Set(params?.skipOptionalBootstrapFiles ?? []);
	if (await isWorkspaceSetupCompleted(dir)) for (const filename of OPTIONAL_BOOTSTRAP_FILENAMES) skipOptionalBootstrapFiles.add(filename);
	const shouldWriteBootstrapFile = (fileName) => !OPTIONAL_BOOTSTRAP_FILENAMES.has(fileName) || !skipOptionalBootstrapFiles.has(fileName);
	await writeFileIfMissing(agentsPath, agentsTemplate);
	if (shouldWriteBootstrapFile("SOUL.md")) await writeFileIfMissing(soulPath, soulTemplate);
	await writeFileIfMissing(toolsPath, toolsTemplate);
	const identityPathCreated = shouldWriteBootstrapFile("IDENTITY.md") ? await writeFileIfMissing(identityPath, identityTemplate) : false;
	if (shouldWriteBootstrapFile("USER.md")) await writeFileIfMissing(userPath, userTemplate);
	if (shouldWriteBootstrapFile("HEARTBEAT.md")) await writeFileIfMissing(heartbeatPath, heartbeatTemplate);
	let state = await readWorkspaceSetupStateForDir(dir, { persistLegacyMigration: true });
	let stateDirty = false;
	const markState = (next) => {
		state = {
			...state,
			...next
		};
		stateDirty = true;
	};
	const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
	let bootstrapExists = await (0, _openclaw_fs_safe_advanced.pathExists)(bootstrapPath);
	if (!state.bootstrapSeededAt && bootstrapExists) markState({ bootstrapSeededAt: nowIso() });
	if (!state.setupCompletedAt) {
		const repair = await reconcileWorkspaceBootstrapCompletionState({
			dir,
			bootstrapPath,
			statePath,
			state,
			bootstrapExists
		});
		if (repair.repaired) {
			state = repair.state;
			stateDirty = false;
			bootstrapExists = repair.bootstrapExists;
		}
	}
	if (!state.bootstrapSeededAt && !state.setupCompletedAt && !bootstrapExists) if ((recentAttestationPath ? await workspaceRequiredBootstrapLooksCustomized(dir, { attestationPath: recentAttestationPath }) : false) || await workspaceProfileLooksConfigured({
		dir,
		includeGitEvidence: true
	})) markState({ setupCompletedAt: nowIso() });
	else {
		if (!await writeFileIfMissing(bootstrapPath, await loadTemplate("BOOTSTRAP.md"))) bootstrapExists = await (0, _openclaw_fs_safe_advanced.pathExists)(bootstrapPath);
		else bootstrapExists = true;
		if (bootstrapExists && !state.bootstrapSeededAt) markState({ bootstrapSeededAt: nowIso() });
	}
	if (stateDirty) await writeWorkspaceSetupState(statePath, state);
	await ensureGitRepo(dir, isBrandNewWorkspace);
	await maybeWriteWorkspaceAttestation(attestationPath, dir);
	return {
		dir,
		agentsPath,
		soulPath,
		toolsPath,
		identityPath,
		userPath,
		heartbeatPath,
		bootstrapPath,
		identityPathCreated
	};
}
async function loadWorkspaceBootstrapFiles(dir) {
	const resolvedDir = require_home_dir.resolveUserPath(dir);
	const entries = [
		{
			name: DEFAULT_AGENTS_FILENAME,
			filePath: node_path.default.join(resolvedDir, DEFAULT_AGENTS_FILENAME)
		},
		{
			name: DEFAULT_SOUL_FILENAME,
			filePath: node_path.default.join(resolvedDir, DEFAULT_SOUL_FILENAME)
		},
		{
			name: DEFAULT_TOOLS_FILENAME,
			filePath: node_path.default.join(resolvedDir, DEFAULT_TOOLS_FILENAME)
		},
		{
			name: DEFAULT_IDENTITY_FILENAME,
			filePath: node_path.default.join(resolvedDir, DEFAULT_IDENTITY_FILENAME)
		},
		{
			name: DEFAULT_USER_FILENAME,
			filePath: node_path.default.join(resolvedDir, DEFAULT_USER_FILENAME)
		},
		{
			name: DEFAULT_HEARTBEAT_FILENAME,
			filePath: node_path.default.join(resolvedDir, DEFAULT_HEARTBEAT_FILENAME)
		},
		{
			name: DEFAULT_BOOTSTRAP_FILENAME,
			filePath: node_path.default.join(resolvedDir, DEFAULT_BOOTSTRAP_FILENAME)
		},
		{
			name: DEFAULT_MEMORY_FILENAME,
			filePath: node_path.default.join(resolvedDir, DEFAULT_MEMORY_FILENAME)
		}
	];
	const result = [];
	for (const entry of entries) {
		if (entry.name === DEFAULT_MEMORY_FILENAME && !await exactWorkspaceEntryExists(resolvedDir, DEFAULT_MEMORY_FILENAME)) continue;
		const loaded = await readWorkspaceFileWithGuards({
			filePath: entry.filePath,
			workspaceDir: resolvedDir
		});
		if (loaded.ok) result.push({
			name: entry.name,
			path: entry.filePath,
			content: loaded.content,
			missing: false
		});
		else result.push({
			name: entry.name,
			path: entry.filePath,
			missing: true
		});
	}
	return result;
}
const SUBAGENT_BOOTSTRAP_ALLOWLIST = /* @__PURE__ */ new Set([DEFAULT_AGENTS_FILENAME, DEFAULT_TOOLS_FILENAME]);
const CRON_BOOTSTRAP_ALLOWLIST = /* @__PURE__ */ new Set([
	DEFAULT_AGENTS_FILENAME,
	DEFAULT_TOOLS_FILENAME,
	DEFAULT_SOUL_FILENAME,
	DEFAULT_IDENTITY_FILENAME,
	DEFAULT_USER_FILENAME
]);
function filterBootstrapFilesForSession(files, sessionKey) {
	if (!sessionKey) return files;
	if (require_session_key.isSubagentSessionKey(sessionKey)) return files.filter((file) => SUBAGENT_BOOTSTRAP_ALLOWLIST.has(file.name));
	if (require_session_key.isCronSessionKey(sessionKey)) return files.filter((file) => CRON_BOOTSTRAP_ALLOWLIST.has(file.name));
	return files;
}
//#endregion
Object.defineProperty(exports, "CANONICAL_ROOT_MEMORY_FILENAME", {
	enumerable: true,
	get: function() {
		return CANONICAL_ROOT_MEMORY_FILENAME;
	}
});
Object.defineProperty(exports, "DEFAULT_AGENTS_FILENAME", {
	enumerable: true,
	get: function() {
		return DEFAULT_AGENTS_FILENAME;
	}
});
Object.defineProperty(exports, "DEFAULT_BOOTSTRAP_FILENAME", {
	enumerable: true,
	get: function() {
		return DEFAULT_BOOTSTRAP_FILENAME;
	}
});
Object.defineProperty(exports, "DEFAULT_HEARTBEAT_FILENAME", {
	enumerable: true,
	get: function() {
		return DEFAULT_HEARTBEAT_FILENAME;
	}
});
Object.defineProperty(exports, "DEFAULT_IDENTITY_FILENAME", {
	enumerable: true,
	get: function() {
		return DEFAULT_IDENTITY_FILENAME;
	}
});
Object.defineProperty(exports, "DEFAULT_MEMORY_FILENAME", {
	enumerable: true,
	get: function() {
		return DEFAULT_MEMORY_FILENAME;
	}
});
Object.defineProperty(exports, "DEFAULT_SOUL_FILENAME", {
	enumerable: true,
	get: function() {
		return DEFAULT_SOUL_FILENAME;
	}
});
Object.defineProperty(exports, "DEFAULT_TOOLS_FILENAME", {
	enumerable: true,
	get: function() {
		return DEFAULT_TOOLS_FILENAME;
	}
});
Object.defineProperty(exports, "DEFAULT_USER_FILENAME", {
	enumerable: true,
	get: function() {
		return DEFAULT_USER_FILENAME;
	}
});
Object.defineProperty(exports, "LEGACY_ROOT_MEMORY_FILENAME", {
	enumerable: true,
	get: function() {
		return LEGACY_ROOT_MEMORY_FILENAME;
	}
});
Object.defineProperty(exports, "ensureAgentWorkspace", {
	enumerable: true,
	get: function() {
		return ensureAgentWorkspace;
	}
});
Object.defineProperty(exports, "filterBootstrapFilesForSession", {
	enumerable: true,
	get: function() {
		return filterBootstrapFilesForSession;
	}
});
Object.defineProperty(exports, "isWorkspaceBootstrapPending", {
	enumerable: true,
	get: function() {
		return isWorkspaceBootstrapPending;
	}
});
Object.defineProperty(exports, "isWorkspaceSetupCompleted", {
	enumerable: true,
	get: function() {
		return isWorkspaceSetupCompleted;
	}
});
Object.defineProperty(exports, "loadWorkspaceBootstrapFiles", {
	enumerable: true,
	get: function() {
		return loadWorkspaceBootstrapFiles;
	}
});
Object.defineProperty(exports, "resolveCanonicalRootMemoryPath", {
	enumerable: true,
	get: function() {
		return resolveCanonicalRootMemoryPath;
	}
});
Object.defineProperty(exports, "resolveLegacyRootMemoryPath", {
	enumerable: true,
	get: function() {
		return resolveLegacyRootMemoryPath;
	}
});
Object.defineProperty(exports, "resolveRootMemoryRepairDir", {
	enumerable: true,
	get: function() {
		return resolveRootMemoryRepairDir;
	}
});
Object.defineProperty(exports, "resolveWorkspaceAttestationPaths", {
	enumerable: true,
	get: function() {
		return resolveWorkspaceAttestationPaths;
	}
});
Object.defineProperty(exports, "resolveWorkspaceTemplateDir", {
	enumerable: true,
	get: function() {
		return resolveWorkspaceTemplateDir;
	}
});
Object.defineProperty(exports, "shouldRemoveWorkspaceAttestation", {
	enumerable: true,
	get: function() {
		return shouldRemoveWorkspaceAttestation;
	}
});
