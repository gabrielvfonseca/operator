const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
require("./json-files-Bp0Z4DKb.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
require("./archive-HshK6KD3.cjs");
const require_clawhub_error_codes = require("./clawhub-error-codes-BKV6QaJg.cjs");
const require_git_install = require("./git-install-DIh4esrE.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_net_policy_url_protocol = require("@gabrielvfonseca/net-policy/url-protocol");
let _gabrielvfonseca_net_policy_redact_sensitive_url = require("@gabrielvfonseca/net-policy/redact-sensitive-url");
let _openclaw_fs_safe_archive = require("@openclaw/fs-safe/archive");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/marketplace.ts
const DEFAULT_GIT_TIMEOUT_MS = 12e4;
const DEFAULT_MARKETPLACE_DOWNLOAD_TIMEOUT_MS = 12e4;
const MAX_MARKETPLACE_ARCHIVE_BYTES = 256 * 1024 * 1024;
const MARKETPLACE_MANIFEST_CANDIDATES = [node_path.default.join(".claude-plugin", "marketplace.json"), "marketplace.json"];
const CLAUDE_KNOWN_MARKETPLACES_PATH = node_path.default.join("~", ".claude", "plugins", "known_marketplaces.json");
function isGitUrl(value) {
	return /^git@/i.test(value) || /^ssh:\/\//i.test(value) || /^https?:\/\/.+\.git(?:#.*)?$/i.test(value);
}
function looksLikeGitHubRepoShorthand(value) {
	return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:#.+)?$/.test(value.trim());
}
function splitRef(value) {
	const trimmed = value.trim();
	const hashIndex = trimmed.lastIndexOf("#");
	if (hashIndex <= 0 || hashIndex >= trimmed.length - 1) return { base: trimmed };
	return {
		base: trimmed.slice(0, hashIndex),
		ref: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(trimmed.slice(hashIndex + 1))
	};
}
function normalizeEntrySource(raw) {
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (!trimmed) return {
			ok: false,
			error: "empty plugin source"
		};
		if ((0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(trimmed)) return {
			ok: true,
			source: {
				kind: "url",
				url: trimmed
			}
		};
		return {
			ok: true,
			source: {
				kind: "path",
				path: trimmed
			}
		};
	}
	if (!raw || typeof raw !== "object") return {
		ok: false,
		error: "plugin source must be a string or object"
	};
	const rec = raw;
	const kind = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.type) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.source);
	if (!kind) return {
		ok: false,
		error: "plugin source object missing \"type\" or \"source\""
	};
	if (kind === "path") {
		const sourcePath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.path);
		if (!sourcePath) return {
			ok: false,
			error: "path source missing \"path\""
		};
		return {
			ok: true,
			source: {
				kind: "path",
				path: sourcePath
			}
		};
	}
	if (kind === "github") {
		const repo = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.repo) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.url);
		if (!repo) return {
			ok: false,
			error: "github source missing \"repo\""
		};
		return {
			ok: true,
			source: {
				kind: "github",
				repo,
				path: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.path),
				ref: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.ref) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.branch) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.tag)
			}
		};
	}
	if (kind === "git") {
		const url = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.url) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.repo);
		if (!url) return {
			ok: false,
			error: "git source missing \"url\""
		};
		return {
			ok: true,
			source: {
				kind: "git",
				url,
				path: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.path),
				ref: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.ref) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.branch) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.tag)
			}
		};
	}
	if (kind === "git-subdir") {
		const url = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.url) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.repo);
		const sourcePath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.path) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.subdir);
		if (!url) return {
			ok: false,
			error: "git-subdir source missing \"url\""
		};
		if (!sourcePath) return {
			ok: false,
			error: "git-subdir source missing \"path\""
		};
		return {
			ok: true,
			source: {
				kind: "git-subdir",
				url,
				path: sourcePath,
				ref: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.ref) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.branch) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.tag)
			}
		};
	}
	if (kind === "url") {
		const url = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.url);
		if (!url) return {
			ok: false,
			error: "url source missing \"url\""
		};
		return {
			ok: true,
			source: {
				kind: "url",
				url
			}
		};
	}
	return {
		ok: false,
		error: `unsupported plugin source kind: ${kind}`
	};
}
function marketplaceEntrySourceToInput(source) {
	switch (source.kind) {
		case "path": return source.path;
		case "github": return `${source.repo}${source.ref ? `#${source.ref}` : ""}`;
		case "git": return `${source.url}${source.ref ? `#${source.ref}` : ""}`;
		case "git-subdir": return `${source.url}${source.ref ? `#${source.ref}` : ""}`;
		case "url": return source.url;
	}
	throw new Error("Unsupported marketplace entry source");
}
function marketplaceEntryGitRef(source) {
	switch (source.kind) {
		case "github":
		case "git":
		case "git-subdir": return source.ref;
		case "url": return (0, _openclaw_fs_safe_archive.resolveArchiveKind)(source.url) ? void 0 : normalizeGitCloneSource(source.url)?.ref;
		case "path": return;
	}
	throw new Error("Unsupported marketplace entry source");
}
function isMutableGitDerivedSource(ref) {
	return !require_git_install.isImmutableGitCommitRef(ref);
}
function marketplaceInstallPolicySource(params) {
	const marketplaceMutable = isMutableGitDerivedSource(params.marketplaceRef);
	const entryMutable = isMutableGitDerivedSource(marketplaceEntryGitRef(params.source));
	if ((0, _openclaw_fs_safe_archive.resolveArchiveKind)(params.resolvedPath)) {
		if (params.marketplaceOrigin === "remote" && params.source.kind === "path" && !(0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(params.source.path)) return {
			kind: "archive",
			authority: "third-party",
			mutable: marketplaceMutable,
			network: true
		};
		if (params.source.kind === "path" && !(0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(params.source.path)) return {
			kind: "archive",
			authority: "user",
			mutable: true,
			network: false
		};
		return {
			kind: "archive",
			authority: "third-party",
			mutable: entryMutable,
			network: true
		};
	}
	if (params.marketplaceOrigin === "remote" && params.source.kind === "path" && !(0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(params.source.path)) return {
		kind: "git",
		authority: "third-party",
		mutable: marketplaceMutable,
		network: true
	};
	if (params.source.kind === "path") {
		if ((0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(params.source.path)) return {
			kind: "archive",
			authority: "third-party",
			mutable: true,
			network: true
		};
		return {
			kind: "local-path",
			authority: "user",
			mutable: true,
			network: false
		};
	}
	if (params.source.kind === "url") return {
		kind: (0, _openclaw_fs_safe_archive.resolveArchiveKind)(params.source.url) ? "archive" : "git",
		authority: "third-party",
		mutable: entryMutable,
		network: true
	};
	return {
		kind: "git",
		authority: "third-party",
		mutable: entryMutable,
		network: true
	};
}
function marketplaceInstallPolicyRequestKind(params) {
	if ((0, _openclaw_fs_safe_archive.resolveArchiveKind)(params.resolvedPath)) return "plugin-archive";
	if (params.marketplaceOrigin === "remote") return "plugin-git";
	if (params.source.kind === "github" || params.source.kind === "git" || params.source.kind === "git-subdir") return "plugin-git";
	if (params.source.kind === "url" && !(0, _openclaw_fs_safe_archive.resolveArchiveKind)(params.source.url)) return "plugin-git";
	return "plugin-dir";
}
function parseMarketplaceManifest(raw, sourceLabel) {
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		return {
			ok: false,
			error: `invalid marketplace JSON at ${sourceLabel}: ${String(err)}`
		};
	}
	if (!parsed || typeof parsed !== "object") return {
		ok: false,
		error: `invalid marketplace JSON at ${sourceLabel}: expected object`
	};
	const rec = parsed;
	if (!Array.isArray(rec.plugins)) return {
		ok: false,
		error: `invalid marketplace JSON at ${sourceLabel}: missing plugins[]`
	};
	const plugins = [];
	for (const entry of rec.plugins) {
		if (!entry || typeof entry !== "object") return {
			ok: false,
			error: `invalid marketplace entry in ${sourceLabel}: expected object`
		};
		const plugin = entry;
		const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(plugin.name);
		if (!name) return {
			ok: false,
			error: `invalid marketplace entry in ${sourceLabel}: missing name`
		};
		const normalizedSource = normalizeEntrySource(plugin.source);
		if (!normalizedSource.ok) return {
			ok: false,
			error: `invalid marketplace entry "${name}" in ${sourceLabel}: ${normalizedSource.error}`
		};
		plugins.push({
			name,
			version: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(plugin.version),
			description: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(plugin.description),
			source: normalizedSource.source
		});
	}
	return {
		ok: true,
		manifest: {
			name: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.name),
			version: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.version),
			plugins
		}
	};
}
async function readClaudeKnownMarketplaces() {
	const knownPath = require_home_dir.resolveOsHomeRelativePath(CLAUDE_KNOWN_MARKETPLACES_PATH);
	if (!await (0, _openclaw_fs_safe_advanced.pathExists)(knownPath)) return {};
	const parsed = await (0, _openclaw_fs_safe_json.tryReadJson)(knownPath);
	if (!parsed || typeof parsed !== "object") return {};
	const entries = parsed;
	const result = {};
	for (const [name, value] of Object.entries(entries)) {
		if (!value || typeof value !== "object") continue;
		const record = value;
		result[name] = {
			installLocation: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.installLocation),
			source: record.source
		};
	}
	return result;
}
function deriveMarketplaceRootFromManifestPath(manifestPath) {
	const manifestDir = node_path.default.dirname(manifestPath);
	return node_path.default.basename(manifestDir) === ".claude-plugin" ? node_path.default.dirname(manifestDir) : manifestDir;
}
async function resolveLocalMarketplaceSource(input) {
	const resolved = require_home_dir.resolveUserPath(input);
	if (!await (0, _openclaw_fs_safe_advanced.pathExists)(resolved)) return null;
	const stat = await node_fs_promises.default.stat(resolved);
	if (stat.isFile()) return {
		ok: true,
		rootDir: deriveMarketplaceRootFromManifestPath(resolved),
		manifestPath: resolved
	};
	if (!stat.isDirectory()) return {
		ok: false,
		error: `unsupported marketplace source: ${resolved}`
	};
	const rootDir = node_path.default.basename(resolved) === ".claude-plugin" ? node_path.default.dirname(resolved) : resolved;
	for (const candidate of MARKETPLACE_MANIFEST_CANDIDATES) {
		const manifestPath = node_path.default.join(rootDir, candidate);
		if (await (0, _openclaw_fs_safe_advanced.pathExists)(manifestPath)) return {
			ok: true,
			rootDir,
			manifestPath
		};
	}
	return {
		ok: false,
		error: `marketplace manifest not found under ${resolved}`
	};
}
function normalizeGitCloneSource(source) {
	const split = splitRef(source);
	if (looksLikeGitHubRepoShorthand(split.base)) return {
		url: `https://github.com/${split.base}.git`,
		ref: split.ref,
		label: split.base
	};
	if (isGitUrl(source)) return {
		url: split.base,
		ref: split.ref,
		label: split.base
	};
	if ((0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(source)) try {
		const url = new URL(split.base);
		if (url.hostname !== "github.com") return null;
		const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
		if (parts.length < 2) return null;
		const repo = `${parts[0]}/${parts[1]?.replace(/\.git$/i, "")}`;
		return {
			url: `https://github.com/${repo}.git`,
			ref: split.ref,
			label: repo
		};
	} catch {
		return null;
	}
	return null;
}
async function cloneMarketplaceRepo(params) {
	const normalized = normalizeGitCloneSource(params.source);
	if (!normalized) return {
		ok: false,
		error: `unsupported marketplace source: ${params.source}`
	};
	const tmpDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-marketplace-"));
	const repoDir = node_path.default.join(tmpDir, "repo");
	const refIsCommit = require_git_install.isImmutableGitCommitRef(normalized.ref);
	const argv = ["git", "clone"];
	if (!normalized.ref) argv.push("--depth", "1");
	else if (!refIsCommit) {
		argv.push("--depth", "1");
		argv.push("--branch", normalized.ref);
	}
	argv.push(normalized.url, repoDir);
	params.logger?.info?.(`Cloning marketplace source ${normalized.label}...`);
	const res = await require_exec.runCommandWithTimeout(argv, { timeoutMs: params.timeoutMs ?? DEFAULT_GIT_TIMEOUT_MS });
	if (res.code !== 0) {
		await node_fs_promises.default.rm(tmpDir, {
			recursive: true,
			force: true
		}).catch(() => void 0);
		const detail = res.stderr.trim() || res.stdout.trim() || "git clone failed";
		return {
			ok: false,
			error: `failed to clone marketplace source ${normalized.label}: ${detail}`
		};
	}
	if (refIsCommit) {
		const checkout = await require_exec.runCommandWithTimeout([
			"git",
			"switch",
			"--detach",
			"--",
			normalized.ref
		], {
			cwd: repoDir,
			timeoutMs: params.timeoutMs ?? DEFAULT_GIT_TIMEOUT_MS
		});
		if (checkout.code !== 0) {
			await node_fs_promises.default.rm(tmpDir, {
				recursive: true,
				force: true
			}).catch(() => void 0);
			const detail = checkout.stderr.trim() || checkout.stdout.trim() || "git checkout failed";
			return {
				ok: false,
				error: `failed to checkout marketplace source ${normalized.label}: ${detail}`
			};
		}
	}
	return {
		ok: true,
		rootDir: repoDir,
		label: normalized.label,
		...normalized.ref ? { ref: normalized.ref } : {},
		cleanup: async () => {
			await node_fs_promises.default.rm(tmpDir, {
				recursive: true,
				force: true
			}).catch(() => void 0);
		}
	};
}
async function loadMarketplace(params) {
	const loadMarketplaceFromManifestFile = async (paramsLocal) => {
		const parsed = parseMarketplaceManifest(await node_fs_promises.default.readFile(paramsLocal.manifestPath, "utf-8"), paramsLocal.manifestPath);
		if (!parsed.ok) {
			await paramsLocal.cleanup?.();
			return parsed;
		}
		const validated = await validateMarketplaceManifest({
			manifest: parsed.manifest,
			sourceLabel: paramsLocal.sourceLabel,
			rootDir: paramsLocal.rootDir,
			origin: paramsLocal.origin
		});
		if (!validated.ok) {
			await paramsLocal.cleanup?.();
			return validated;
		}
		return {
			ok: true,
			marketplace: {
				manifest: validated.manifest,
				rootDir: paramsLocal.rootDir,
				sourceLabel: paramsLocal.sourceLabel,
				origin: paramsLocal.origin,
				...paramsLocal.remoteRef ? { remoteRef: paramsLocal.remoteRef } : {},
				cleanup: paramsLocal.cleanup
			}
		};
	};
	const loadResolvedLocalMarketplace = async (local, sourceLabel) => loadMarketplaceFromManifestFile({
		manifestPath: local.manifestPath,
		sourceLabel,
		rootDir: local.rootDir,
		origin: "local"
	});
	const resolveClonedMarketplaceManifestPath = async (rootDir) => {
		for (const candidate of MARKETPLACE_MANIFEST_CANDIDATES) {
			const next = node_path.default.join(rootDir, candidate);
			if (await (0, _openclaw_fs_safe_advanced.pathExists)(next)) return next;
		}
	};
	const known = (await readClaudeKnownMarketplaces())[params.source];
	if (known) {
		if (known.installLocation) {
			const local = await resolveLocalMarketplaceSource(known.installLocation);
			if (local?.ok) return await loadResolvedLocalMarketplace(local, params.source);
		}
		const normalizedSource = normalizeEntrySource(known.source);
		if (normalizedSource.ok) return await loadMarketplace({
			source: marketplaceEntrySourceToInput(normalizedSource.source),
			logger: params.logger,
			timeoutMs: params.timeoutMs
		});
	}
	const local = await resolveLocalMarketplaceSource(params.source);
	if (local?.ok === false) return local;
	if (local?.ok) return await loadResolvedLocalMarketplace(local, local.manifestPath);
	const cloned = await cloneMarketplaceRepo({
		source: params.source,
		timeoutMs: params.timeoutMs,
		logger: params.logger
	});
	if (!cloned.ok) return cloned;
	const manifestPath = await resolveClonedMarketplaceManifestPath(cloned.rootDir);
	if (!manifestPath) {
		await cloned.cleanup();
		return {
			ok: false,
			error: `marketplace manifest not found in ${cloned.label}`
		};
	}
	return await loadMarketplaceFromManifestFile({
		manifestPath,
		sourceLabel: cloned.label,
		rootDir: cloned.rootDir,
		origin: "remote",
		...cloned.ref ? { remoteRef: cloned.ref } : {},
		cleanup: cloned.cleanup
	});
}
function resolveSafeMarketplaceDownloadFileName(url, fallback) {
	const pathname = new URL(url).pathname;
	const fileName = node_path.default.basename(pathname).trim() || fallback;
	if (fileName === "." || fileName === ".." || /^[a-zA-Z]:/.test(fileName) || node_path.default.isAbsolute(fileName) || fileName.includes("/") || fileName.includes("\\")) throw new Error("invalid download filename");
	return fileName;
}
function resolveMarketplaceDownloadTimeoutMs(timeoutMs) {
	return Math.max(1e3, Math.floor(typeof timeoutMs === "number" && Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_MARKETPLACE_DOWNLOAD_TIMEOUT_MS));
}
function formatMarketplaceDownloadError(url, detail) {
	return `failed to download ${require_ansi.sanitizeForLog((0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(url))}: ` + require_ansi.sanitizeForLog(detail);
}
function hasStreamingResponseBody(response) {
	return Boolean(response.body && typeof response.body.getReader === "function");
}
async function cancelUnreadMarketplaceResponseBody(response) {
	await response.body?.cancel().catch(() => void 0);
}
function parseMarketplaceContentLength(raw) {
	const trimmed = raw.trim();
	if (!/^\d+$/.test(trimmed)) throw new Error(`invalid content-length header: ${raw}`);
	const size = Number(trimmed);
	if (!Number.isSafeInteger(size)) throw new Error(`invalid content-length header: ${raw}`);
	return size;
}
async function readMarketplaceChunkWithTimeout(reader, chunkTimeoutMs) {
	let timeoutId;
	let timedOut = false;
	return await new Promise((resolve, reject) => {
		const clear = () => {
			if (timeoutId !== void 0) {
				clearTimeout(timeoutId);
				timeoutId = void 0;
			}
		};
		timeoutId = setTimeout(() => {
			timedOut = true;
			clear();
			reader.cancel().catch(() => void 0);
			reject(/* @__PURE__ */ new Error(`download timed out after ${chunkTimeoutMs}ms`));
		}, chunkTimeoutMs);
		reader.read().then((result) => {
			clear();
			if (!timedOut) resolve(result);
		}, (err) => {
			clear();
			if (!timedOut) reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(err, "Non-Error rejection"));
		});
	});
}
async function writeMarketplaceChunk(fileHandle, chunk) {
	let offset = 0;
	while (offset < chunk.length) {
		const { bytesWritten } = await fileHandle.write(chunk, offset, chunk.length - offset);
		if (bytesWritten <= 0) throw new Error("failed to write download chunk");
		offset += bytesWritten;
	}
}
async function streamMarketplaceResponseToFile(params) {
	const reader = params.response.body.getReader();
	const fileHandle = await node_fs_promises.default.open(params.targetPath, "wx");
	let total = 0;
	try {
		while (true) {
			const { done, value } = await readMarketplaceChunkWithTimeout(reader, params.chunkTimeoutMs);
			if (done) return;
			if (!value?.length) continue;
			const nextTotal = total + value.length;
			if (nextTotal > params.maxBytes) throw new Error(`download too large: ${nextTotal} bytes (limit: ${params.maxBytes} bytes)`);
			await writeMarketplaceChunk(fileHandle, value);
			total = nextTotal;
		}
	} catch (error) {
		if (typeof reader.cancel === "function") await reader.cancel().catch(() => void 0);
		throw error;
	} finally {
		await fileHandle.close().catch(() => void 0);
		try {
			reader.releaseLock();
		} catch {}
	}
}
async function downloadUrlToTempFile(url, timeoutMs) {
	let sourceFileName = "plugin.tgz";
	let tmpDir;
	try {
		sourceFileName = resolveSafeMarketplaceDownloadFileName(url, sourceFileName);
		const downloadTimeoutMs = resolveMarketplaceDownloadTimeoutMs(timeoutMs);
		const { response, finalUrl, release } = await require_fetch_guard.fetchWithSsrFGuard({
			url,
			timeoutMs: downloadTimeoutMs,
			auditContext: "marketplace-plugin-download"
		});
		try {
			if (!response.ok) {
				await cancelUnreadMarketplaceResponseBody(response);
				return {
					ok: false,
					error: formatMarketplaceDownloadError(url, `HTTP ${response.status}`)
				};
			}
			if (!response.body) return {
				ok: false,
				error: formatMarketplaceDownloadError(url, "empty response body")
			};
			if (!hasStreamingResponseBody(response)) {
				await cancelUnreadMarketplaceResponseBody(response);
				return {
					ok: false,
					error: formatMarketplaceDownloadError(url, "streaming response body unavailable")
				};
			}
			const contentLength = response.headers.get("content-length");
			if (contentLength) {
				let size;
				try {
					size = parseMarketplaceContentLength(contentLength);
				} catch (error) {
					await cancelUnreadMarketplaceResponseBody(response);
					throw error;
				}
				if (size > MAX_MARKETPLACE_ARCHIVE_BYTES) {
					await cancelUnreadMarketplaceResponseBody(response);
					throw new Error(`download too large: ${size} bytes (limit: ${MAX_MARKETPLACE_ARCHIVE_BYTES} bytes)`);
				}
			}
			const finalFileName = resolveSafeMarketplaceDownloadFileName(finalUrl, sourceFileName);
			const fileName = (0, _openclaw_fs_safe_archive.resolveArchiveKind)(finalFileName) ? finalFileName : sourceFileName;
			tmpDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-marketplace-download-"));
			const createdTmpDir = tmpDir;
			const targetPath = node_path.default.resolve(createdTmpDir, fileName);
			const relativeTargetPath = node_path.default.relative(createdTmpDir, targetPath);
			if (relativeTargetPath === ".." || relativeTargetPath.startsWith(`..${node_path.default.sep}`)) throw new Error("invalid download filename");
			await streamMarketplaceResponseToFile({
				response,
				targetPath,
				maxBytes: MAX_MARKETPLACE_ARCHIVE_BYTES,
				chunkTimeoutMs: downloadTimeoutMs
			});
			return {
				ok: true,
				path: targetPath,
				cleanup: async () => {
					await node_fs_promises.default.rm(createdTmpDir, {
						recursive: true,
						force: true
					}).catch(() => void 0);
				}
			};
		} finally {
			await release().catch(() => void 0);
		}
	} catch (error) {
		if (tmpDir) await node_fs_promises.default.rm(tmpDir, {
			recursive: true,
			force: true
		}).catch(() => void 0);
		return {
			ok: false,
			error: formatMarketplaceDownloadError(url, require_errors.formatErrorMessage(error))
		};
	}
}
async function ensureInsideMarketplaceRoot(rootDir, candidate, options) {
	const resolved = node_path.default.resolve(rootDir, candidate);
	const resolvedExists = await (0, _openclaw_fs_safe_advanced.pathExists)(resolved);
	const relative = node_path.default.relative(rootDir, resolved);
	if (relative === ".." || relative.startsWith(`..${node_path.default.sep}`)) return {
		ok: false,
		error: `plugin source escapes marketplace root: ${candidate}`
	};
	if (options?.canonicalRootDir) try {
		if (!(await node_fs_promises.default.lstat(options.canonicalRootDir)).isDirectory()) throw new Error("invalid marketplace root");
		const rootRealPath = await node_fs_promises.default.realpath(options.canonicalRootDir);
		let existingPath = resolved;
		while (!await (0, _openclaw_fs_safe_advanced.pathExists)(existingPath)) {
			const parentPath = node_path.default.dirname(existingPath);
			if (parentPath === existingPath) throw new Error("unreachable marketplace path");
			existingPath = parentPath;
		}
		if (!(0, _openclaw_fs_safe_path.isPathInside)(rootRealPath, await node_fs_promises.default.realpath(existingPath))) throw new Error("marketplace path escapes canonical root");
	} catch (error) {
		if (error instanceof Error && (error.message === "invalid marketplace root" || error.message === "unreachable marketplace path" || error.message === "marketplace path escapes canonical root")) return {
			ok: false,
			error: `plugin source escapes marketplace root: ${candidate}`
		};
		throw error;
	}
	if (!resolvedExists) return {
		ok: false,
		error: `plugin source not found in marketplace root: ${candidate}`
	};
	return {
		ok: true,
		path: resolved
	};
}
async function validateMarketplaceManifest(params) {
	if (params.origin === "local") return {
		ok: true,
		manifest: params.manifest
	};
	const canonicalRootDir = await node_fs_promises.default.realpath(params.rootDir);
	for (const plugin of params.manifest.plugins) {
		const source = plugin.source;
		if (source.kind === "path") {
			if ((0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(source.path)) return {
				ok: false,
				error: `invalid marketplace entry "${plugin.name}" in ${params.sourceLabel}: remote marketplaces may not use HTTP(S) plugin paths`
			};
			if (node_path.default.isAbsolute(source.path)) return {
				ok: false,
				error: `invalid marketplace entry "${plugin.name}" in ${params.sourceLabel}: remote marketplaces may only use relative plugin paths`
			};
			const resolved = await ensureInsideMarketplaceRoot(params.rootDir, source.path, { canonicalRootDir });
			if (!resolved.ok) return {
				ok: false,
				error: `invalid marketplace entry "${plugin.name}" in ${params.sourceLabel}: ${resolved.error}`
			};
			continue;
		}
		return {
			ok: false,
			error: `invalid marketplace entry "${plugin.name}" in ${params.sourceLabel}: remote marketplaces may not use ${source.kind} plugin sources`
		};
	}
	return {
		ok: true,
		manifest: params.manifest
	};
}
async function resolveMarketplaceEntryInstallPath(params) {
	if (params.source.kind === "path") {
		if ((0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(params.source.path)) {
			if ((0, _openclaw_fs_safe_archive.resolveArchiveKind)(params.source.path)) return await downloadUrlToTempFile(params.source.path, params.timeoutMs);
			return {
				ok: false,
				error: `unsupported remote plugin path source: ${params.source.path}`
			};
		}
		const canonicalRootDir = params.marketplaceOrigin === "remote" ? await node_fs_promises.default.realpath(params.marketplaceRootDir) : void 0;
		const resolved = node_path.default.isAbsolute(params.source.path) ? {
			ok: true,
			path: params.source.path
		} : await ensureInsideMarketplaceRoot(params.marketplaceRootDir, params.source.path, { canonicalRootDir });
		if (!resolved.ok) return resolved;
		return {
			ok: true,
			path: resolved.path
		};
	}
	if (params.source.kind === "github" || params.source.kind === "git" || params.source.kind === "git-subdir") {
		const cloned = await cloneMarketplaceRepo({
			source: params.source.kind === "github" ? `${params.source.repo}${params.source.ref ? `#${params.source.ref}` : ""}` : `${params.source.url}${params.source.ref ? `#${params.source.ref}` : ""}`,
			timeoutMs: params.timeoutMs,
			logger: params.logger
		});
		if (!cloned.ok) return cloned;
		const subPath = params.source.kind === "github" || params.source.kind === "git" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.source.path) || "." : params.source.path.trim();
		const canonicalRootDir = await node_fs_promises.default.realpath(cloned.rootDir);
		const target = await ensureInsideMarketplaceRoot(cloned.rootDir, subPath, { canonicalRootDir });
		if (!target.ok) {
			await cloned.cleanup();
			return target;
		}
		return {
			ok: true,
			path: target.path,
			cleanup: cloned.cleanup
		};
	}
	if ((0, _openclaw_fs_safe_archive.resolveArchiveKind)(params.source.url)) return await downloadUrlToTempFile(params.source.url, params.timeoutMs);
	if (!normalizeGitCloneSource(params.source.url)) return {
		ok: false,
		error: `unsupported URL plugin source: ${params.source.url}`
	};
	const cloned = await cloneMarketplaceRepo({
		source: params.source.url,
		timeoutMs: params.timeoutMs,
		logger: params.logger
	});
	if (!cloned.ok) return cloned;
	return {
		ok: true,
		path: cloned.rootDir,
		cleanup: cloned.cleanup
	};
}
async function resolveMarketplaceInstallShortcut(raw) {
	const trimmed = raw.trim();
	const atIndex = trimmed.lastIndexOf("@");
	if (atIndex <= 0 || atIndex >= trimmed.length - 1) return null;
	const plugin = trimmed.slice(0, atIndex).trim();
	const marketplaceName = trimmed.slice(atIndex + 1).trim();
	if (!plugin || !marketplaceName || plugin.includes("/")) return null;
	const known = (await readClaudeKnownMarketplaces())[marketplaceName];
	if (!known) return null;
	if (known.installLocation) return {
		ok: true,
		plugin,
		marketplaceName,
		marketplaceSource: marketplaceName
	};
	const normalizedSource = normalizeEntrySource(known.source);
	if (!normalizedSource.ok) return {
		ok: false,
		error: `known Claude marketplace "${marketplaceName}" has an invalid source: ${normalizedSource.error}`
	};
	return {
		ok: true,
		plugin,
		marketplaceName,
		marketplaceSource: marketplaceName
	};
}
async function installPluginFromMarketplace(params) {
	const loaded = await loadMarketplace({
		source: params.marketplace,
		logger: params.logger,
		timeoutMs: params.timeoutMs
	});
	if (!loaded.ok) return loaded;
	let installCleanup;
	try {
		const entry = loaded.marketplace.manifest.plugins.find((plugin) => plugin.name === params.plugin);
		if (!entry) {
			const known = loaded.marketplace.manifest.plugins.map((plugin) => plugin.name).toSorted();
			return {
				ok: false,
				error: `plugin "${params.plugin}" not found in marketplace ${loaded.marketplace.sourceLabel}` + (known.length > 0 ? ` (available: ${known.join(", ")})` : "")
			};
		}
		const resolved = await resolveMarketplaceEntryInstallPath({
			source: entry.source,
			marketplaceRootDir: loaded.marketplace.rootDir,
			marketplaceOrigin: loaded.marketplace.origin,
			logger: params.logger,
			timeoutMs: params.timeoutMs
		});
		if (!resolved.ok) return resolved;
		installCleanup = resolved.cleanup;
		const result = await require_clawhub_error_codes.installPluginFromPath({
			dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
			config: params.config,
			path: resolved.path,
			logger: params.logger,
			mode: params.mode,
			extensionsDir: params.extensionsDir,
			timeoutMs: params.timeoutMs,
			dryRun: params.dryRun,
			expectedPluginId: params.expectedPluginId,
			installPolicyRequest: {
				kind: marketplaceInstallPolicyRequestKind({
					marketplaceOrigin: loaded.marketplace.origin,
					resolvedPath: resolved.path,
					source: entry.source
				}),
				requestedSpecifier: `${entry.name}@${params.marketplace}`,
				source: marketplaceInstallPolicySource({
					marketplaceOrigin: loaded.marketplace.origin,
					marketplaceRef: loaded.marketplace.remoteRef,
					resolvedPath: resolved.path,
					source: entry.source
				})
			}
		});
		if (!result.ok) return result;
		return {
			...result,
			marketplaceName: loaded.marketplace.manifest.name,
			marketplaceVersion: loaded.marketplace.manifest.version,
			marketplacePlugin: entry.name,
			marketplaceSource: params.marketplace,
			marketplaceEntryVersion: entry.version
		};
	} finally {
		await installCleanup?.();
		await loaded.marketplace.cleanup?.();
	}
}
//#endregion
Object.defineProperty(exports, "installPluginFromMarketplace", {
	enumerable: true,
	get: function() {
		return installPluginFromMarketplace;
	}
});
Object.defineProperty(exports, "resolveMarketplaceInstallShortcut", {
	enumerable: true,
	get: function() {
		return resolveMarketplaceInstallShortcut;
	}
});
