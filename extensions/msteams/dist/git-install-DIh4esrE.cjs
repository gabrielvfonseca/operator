const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
require("./replace-file-D77oDPOz.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
const require_safe_package_install = require("./safe-package-install-D1effjCo.cjs");
const require_install_security_scan = require("./install-security-scan-Dio5vohb.cjs");
const require_clawhub_error_codes = require("./clawhub-error-codes-BKV6QaJg.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_net_policy_url_protocol = require("@gabrielvfonseca/net-policy/url-protocol");
let _gabrielvfonseca_net_policy_redact_sensitive_url = require("@gabrielvfonseca/net-policy/redact-sensitive-url");
let _openclaw_fs_safe_atomic = require("@openclaw/fs-safe/atomic");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/git-install.ts
const GIT_SPEC_PREFIX = "git:";
const DEFAULT_GIT_TIMEOUT_MS = 12e4;
const FULL_GIT_COMMIT_PATTERN = /^[0-9a-f]{40}$/i;
/** Returns true for full commit SHAs that do not require branch/tag drift checks. */
function isImmutableGitCommitRef(ref) {
	return FULL_GIT_COMMIT_PATTERN.test(ref ?? "");
}
function splitGitSpecRef(input) {
	const hashIndex = input.lastIndexOf("#");
	if (hashIndex > 0) return {
		base: input.slice(0, hashIndex),
		ref: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.slice(hashIndex + 1))
	};
	for (let atIndex = input.lastIndexOf("@"); atIndex > 0; atIndex = input.lastIndexOf("@", atIndex - 1)) {
		const base = input.slice(0, atIndex);
		const ref = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.slice(atIndex + 1));
		if (ref && isGitSpecBase(base)) return {
			base,
			ref
		};
	}
	return { base: input };
}
function isGitSpecBase(value) {
	return looksLikeGitHubRepoShorthand(value) || looksLikeGitHubHostPath(value) || looksLikeUrlGitSpecBase(value) || looksLikeScpGitUrl(value) || value.endsWith(".git") || value.startsWith("./") || value.startsWith("../") || value.startsWith("~/");
}
function looksLikeGitHubRepoShorthand(value) {
	return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(value);
}
function looksLikeGitHubHostPath(value) {
	return /^github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/i.test(value);
}
function isGitUrl(value) {
	if (value.startsWith("-")) return false;
	return /^(?:ssh|git|file):\/\//i.test(value) || looksLikeScpGitUrl(value) || value.endsWith(".git");
}
function looksLikeScpGitUrl(value) {
	return /^[^@\s]+@[^:\s]+:.+/.test(value);
}
function looksLikeUrlGitSpecBase(value) {
	try {
		const url = new URL(value);
		if (![
			"http:",
			"https:",
			"ssh:",
			"git:",
			"file:"
		].includes(url.protocol)) return false;
		if (url.protocol === "file:") return url.pathname.length > 1;
		return Boolean(url.hostname) && url.pathname.length > 1;
	} catch {
		return false;
	}
}
function stripGitSuffix(value) {
	return value.replace(/\.git$/i, "");
}
function normalizeGitHubRepo(value) {
	const repo = stripGitSuffix(value.replace(/^github\.com\//i, ""));
	return {
		url: `https://github.com/${repo}.git`,
		label: repo
	};
}
function normalizeGitLabel(value) {
	if ((0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(value) || /^(?:ssh|git|file):\/\//i.test(value)) try {
		const url = new URL(value);
		return stripGitSuffix(`${url.hostname}${url.pathname}`).replace(/^\/+/, "");
	} catch {
		return stripGitSuffix(value);
	}
	return stripGitSuffix(value);
}
function parseGitPluginSpec(raw) {
	const trimmed = raw.trim();
	if (!trimmed.toLowerCase().startsWith(GIT_SPEC_PREFIX)) return null;
	const body = trimmed.slice(4).trim();
	if (!body) return null;
	const split = splitGitSpecRef(body);
	const base = split.base.trim();
	if (!base) return null;
	if (looksLikeGitHubRepoShorthand(base) || looksLikeGitHubHostPath(base)) {
		const normalized = normalizeGitHubRepo(base);
		return {
			input: trimmed,
			url: normalized.url,
			ref: split.ref,
			label: normalized.label,
			normalizedSpec: `${GIT_SPEC_PREFIX}${normalized.url}${split.ref ? `@${split.ref}` : ""}`
		};
	}
	if ((0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(base) || isGitUrl(base) || base.startsWith("./") || base.startsWith("../") || base.startsWith("~/")) {
		const url = base.startsWith("./") || base.startsWith("../") || base.startsWith("~/") ? require_home_dir.resolveUserPath(base) : base;
		return {
			input: trimmed,
			url,
			ref: split.ref,
			label: normalizeGitLabel(url),
			normalizedSpec: `${GIT_SPEC_PREFIX}${url}${split.ref ? `@${split.ref}` : ""}`
		};
	}
	return null;
}
function createGitCommandEnv() {
	return {
		GIT_TERMINAL_PROMPT: "0",
		GIT_CONFIG_NOSYSTEM: "1",
		GIT_TEMPLATE_DIR: "",
		GIT_EDITOR: "",
		GIT_SEQUENCE_EDITOR: "",
		GIT_EXTERNAL_DIFF: "",
		GIT_DIR: void 0,
		GIT_WORK_TREE: void 0,
		GIT_COMMON_DIR: void 0,
		GIT_INDEX_FILE: void 0,
		GIT_OBJECT_DIRECTORY: void 0,
		GIT_ALTERNATE_OBJECT_DIRECTORIES: void 0,
		GIT_NAMESPACE: void 0,
		GIT_EXEC_PATH: void 0,
		GIT_SSL_NO_VERIFY: void 0
	};
}
function resolveGitInstallRepoDir(params) {
	const gitRoot = params.gitDir ? require_home_dir.resolveUserPath(params.gitDir) : require_install_paths.resolveDefaultPluginGitDir();
	const redactedSpec = (0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(params.source.normalizedSpec);
	return node_path.default.join(gitRoot, `git-${require_crypto_digest.sha256HexPrefix(redactedSpec, 16)}`, "repo");
}
async function withGitStagingDir(persistentRepoDir, fn) {
	if (!persistentRepoDir) return await require_install_source_utils.withTempDir("operator-git-plugin-", fn);
	const targetParent = node_path.default.dirname(persistentRepoDir);
	try {
		await node_fs_promises.default.mkdir(targetParent, { recursive: true });
	} catch {
		return await require_install_source_utils.withTempDir("operator-git-plugin-", fn);
	}
	let callbackStarted = false;
	try {
		return await require_install_source_utils.withTempDir("operator-git-plugin-", async (tmpDir) => {
			callbackStarted = true;
			return await fn(tmpDir);
		}, { rootDir: targetParent });
	} catch (err) {
		if (callbackStarted) throw err;
		return await require_install_source_utils.withTempDir("operator-git-plugin-", fn);
	}
}
async function replaceManagedGitRepo(params) {
	try {
		await (0, _openclaw_fs_safe_atomic.replaceDirectoryAtomic)({
			stagedDir: params.stagedRepoDir,
			targetDir: params.persistentRepoDir,
			backupPrefix: ".repo-backup-"
		});
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: `failed to replace managed git plugin repository: ${String(err)}`
		};
	}
}
function formatGitCommandFailure(params) {
	const detail = require_ansi.sanitizeForLog((0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(params.stderr.trim() || params.stdout.trim() || "git failed"));
	return `failed to ${params.action} ${require_ansi.sanitizeForLog((0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(params.source.label))}: ${detail}`;
}
function buildBlockedGitInstallResult(params) {
	return {
		ok: false,
		error: params.blocked.reason,
		...params.blocked.code === "security_scan_failed" ? { code: require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.SECURITY_SCAN_FAILED } : params.blocked.code === "security_scan_blocked" ? { code: require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.SECURITY_SCAN_BLOCKED } : {}
	};
}
async function runGitCommand(params) {
	const result = await require_exec.runCommandWithTimeout(params.argv, {
		cwd: params.cwd,
		timeoutMs: params.timeoutMs ?? DEFAULT_GIT_TIMEOUT_MS,
		env: createGitCommandEnv()
	});
	if (result.code !== 0) return {
		ok: false,
		error: formatGitCommandFailure({
			action: params.action,
			source: params.source,
			stdout: result.stdout,
			stderr: result.stderr
		})
	};
	return {
		ok: true,
		stdout: result.stdout
	};
}
async function installPluginFromGitSpec(params) {
	const parsed = parseGitPluginSpec(params.spec);
	if (!parsed) return {
		ok: false,
		error: `unsupported git: plugin spec: ${params.spec}`
	};
	const persistentRepoDir = resolveGitInstallRepoDir({
		gitDir: params.gitDir,
		source: parsed
	});
	const effectiveMode = params.mode === "update" && await (0, _openclaw_fs_safe_advanced.pathExists)(persistentRepoDir) ? "update" : "install";
	return await withGitStagingDir(params.dryRun ? void 0 : persistentRepoDir, async (tmpDir) => {
		const repoDir = node_path.default.join(tmpDir, "repo");
		params.logger?.info?.(`Cloning ${require_ansi.sanitizeForLog((0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(parsed.label))}...`);
		const clone = await runGitCommand({
			argv: parsed.ref ? [
				"git",
				"clone",
				"--",
				parsed.url,
				repoDir
			] : [
				"git",
				"clone",
				"--depth",
				"1",
				"--",
				parsed.url,
				repoDir
			],
			action: "clone",
			source: parsed,
			timeoutMs: params.timeoutMs
		});
		if (!clone.ok) return clone;
		if (parsed.ref) {
			const checkout = await runGitCommand({
				argv: [
					"git",
					"switch",
					"--detach",
					"--",
					parsed.ref
				],
				action: `checkout ${parsed.ref}`,
				source: parsed,
				cwd: repoDir,
				timeoutMs: params.timeoutMs
			});
			if (!checkout.ok) return checkout;
		}
		const rev = await runGitCommand({
			argv: [
				"git",
				"rev-parse",
				"HEAD"
			],
			action: "resolve commit for",
			source: parsed,
			cwd: repoDir,
			timeoutMs: params.timeoutMs
		});
		if (!rev.ok) return rev;
		const installPolicyRequest = {
			kind: "plugin-git",
			requestedSpecifier: parsed.input,
			source: {
				kind: "git",
				authority: "third-party",
				mutable: !isImmutableGitCommitRef(parsed.ref),
				network: true
			}
		};
		const preflight = await require_install_security_scan.preflightPluginGitInstallPolicy({
			config: params.config,
			logger: params.logger ?? {},
			mode: effectiveMode,
			pluginId: params.expectedPluginId ?? parsed.label,
			requestedSpecifier: parsed.input,
			source: installPolicyRequest.source,
			sourcePath: repoDir
		});
		if (preflight?.blocked) {
			const reason = preflight.blocked.code === "security_scan_failed" ? "security_scan_failed" : "security_scan_blocked";
			require_clawhub_error_codes.emitPluginAuditSecurityEvent({
				outcome: require_clawhub_error_codes.pluginAuditOutcomeForReason(reason),
				reason,
				pluginId: params.expectedPluginId,
				mode: effectiveMode,
				sourceFamily: "git"
			});
			return buildBlockedGitInstallResult({ blocked: preflight.blocked });
		}
		if (!params.dryRun) {
			params.logger?.info?.("Installing plugin dependencies with npm…");
			const install = await require_exec.runCommandWithTimeout(["npm", ...require_safe_package_install.createSafeNpmInstallArgs({
				omitDev: true,
				loglevel: "error",
				noAudit: true,
				noFund: true
			})], {
				cwd: repoDir,
				timeoutMs: Math.max(params.timeoutMs ?? DEFAULT_GIT_TIMEOUT_MS, 3e5),
				env: require_safe_package_install.createSafeNpmInstallEnv(process.env, {
					npmConfigCwd: repoDir,
					packageLock: true,
					quiet: true
				})
			});
			if (install.code !== 0) return {
				ok: false,
				error: `npm install failed: ${install.stderr.trim() || install.stdout.trim()}`
			};
		}
		const result = await require_clawhub_error_codes.installPluginFromInstalledPackageDir({
			dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
			config: params.config,
			packageDir: repoDir,
			dryRun: params.dryRun,
			expectedPluginId: params.expectedPluginId,
			logger: params.logger,
			mode: effectiveMode,
			emitSuccessSecurityEvent: false,
			installPolicyRequest
		});
		if (!result.ok) return result;
		if (!params.dryRun) {
			const replaceResult = await replaceManagedGitRepo({
				stagedRepoDir: repoDir,
				persistentRepoDir
			});
			if (!replaceResult.ok) return replaceResult;
			require_clawhub_error_codes.emitPluginInstallSecurityEvent({
				pluginId: result.pluginId,
				mode: effectiveMode,
				sourceFamily: "git",
				extensionCount: result.extensions.length,
				hasVersion: Boolean(result.version),
				trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall
			});
		}
		return {
			...result,
			targetDir: params.dryRun ? result.targetDir : persistentRepoDir,
			git: {
				url: parsed.url,
				ref: parsed.ref,
				commit: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rev.stdout),
				resolvedAt: (/* @__PURE__ */ new Date()).toISOString()
			}
		};
	});
}
//#endregion
Object.defineProperty(exports, "installPluginFromGitSpec", {
	enumerable: true,
	get: function() {
		return installPluginFromGitSpec;
	}
});
Object.defineProperty(exports, "isImmutableGitCommitRef", {
	enumerable: true,
	get: function() {
		return isImmutableGitCommitRef;
	}
});
Object.defineProperty(exports, "parseGitPluginSpec", {
	enumerable: true,
	get: function() {
		return parseGitPluginSpec;
	}
});
