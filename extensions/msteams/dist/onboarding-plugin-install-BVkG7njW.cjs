const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_safe_text = require("./safe-text-BAHCZAPT.cjs");
const require_plugin_metadata_lifecycle = require("./plugin-metadata-lifecycle-L5oN3AE5.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_installed_plugin_index_records = require("./installed-plugin-index-records-2CPyZnZe.cjs");
const require_enable = require("./enable-CoHDsLc0.cjs");
const require_nix_mode_write_guard = require("./nix-mode-write-guard-mnuDSCNv.cjs");
require("./with-timeout-C8BTMfK3.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_bundled_sources = require("./bundled-sources-xMGcgjbI.cjs");
const require_registry_refresh = require("./registry-refresh-B3eSyFEy.cjs");
const require_clawhub_error_codes = require("./clawhub-error-codes-BKV6QaJg.cjs");
const require_plugin_install_plan = require("./plugin-install-plan-XBeFJs16.cjs");
const require_clawhub_install_records = require("./clawhub-install-records-EIHewKTB.cjs");
const require_update_channels = require("./update-channels-BEYweYMB.cjs");
const require_install_channel_specs = require("./install-channel-specs-gn0f1gcg.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/install-overrides.ts
/** Env var containing JSON plugin install override specs. */
const PLUGIN_INSTALL_OVERRIDES_ENV = "OPERATOR_PLUGIN_INSTALL_OVERRIDES";
/** Env var gate that must be enabled before install overrides are honored. */
const ALLOW_PLUGIN_INSTALL_OVERRIDES_ENV = "OPERATOR_ALLOW_PLUGIN_INSTALL_OVERRIDES";
function overrideAllowed(env) {
	return env[ALLOW_PLUGIN_INSTALL_OVERRIDES_ENV]?.trim() === "1";
}
function parseOverrideSpec(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	if (trimmed.startsWith("npm:")) {
		const spec = trimmed.slice(4).trim();
		return spec && require_npm_registry_spec.parseRegistryNpmSpec(spec) ? {
			kind: "npm",
			spec
		} : null;
	}
	if (trimmed.startsWith("npm-pack:")) {
		const rawPath = trimmed.slice(9).trim();
		if (!rawPath) return null;
		return {
			kind: "npm-pack",
			archivePath: node_path.default.resolve(require_home_dir.resolveUserPath(rawPath))
		};
	}
	return null;
}
/** Resolves a gated plugin install override from environment configuration. */
function resolvePluginInstallOverride(params) {
	const env = params.env ?? process.env;
	if (!overrideAllowed(env)) return null;
	const raw = env[PLUGIN_INSTALL_OVERRIDES_ENV]?.trim();
	if (!raw) return null;
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed)) return null;
	const value = parsed[params.pluginId];
	return typeof value === "string" ? parseOverrideSpec(value) : null;
}
//#endregion
//#region src/commands/onboarding-plugin-install.ts
/**
* Onboarding plugin installation flow.
*
* It selects local, ClawHub, npm, or override install sources; records durable
* install metadata; and enables plugins requested by setup workflows.
*/
var onboarding_plugin_install_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ ensureOnboardingPluginInstalled: () => ensureOnboardingPluginInstalled });
const ONBOARDING_PLUGIN_INSTALL_TIMEOUT_MS = 300 * 1e3;
const ONBOARDING_PLUGIN_INSTALL_WATCHDOG_TIMEOUT_MS = 305e3;
async function markOnboardingPluginInstalled(result, params) {
	require_installed_plugin_index_record_reader.clearLoadInstalledPluginIndexInstallRecordsCache();
	require_plugin_metadata_lifecycle.clearPluginMetadataLifecycleCaches();
	await require_registry_refresh.invalidatePluginRuntimeDiscoveryAfterConfigMutation({ logger: { warn: (message) => params.runtime.log(message) } });
	return result;
}
function shouldFallbackClawHubToNpm(params) {
	if (!require_npm_registry_spec.isOperatorOrgNpmSpec(params.npmSpec)) return false;
	return params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.PACKAGE_NOT_FOUND || params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.VERSION_NOT_FOUND || params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.ARTIFACT_DOWNLOAD_UNAVAILABLE || params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.ARTIFACT_UNAVAILABLE;
}
function readInstallFailureWarning(result) {
	if (result.ok || !("warning" in result) || typeof result.warning !== "string") return;
	return result.warning;
}
function resolveRealDirectory(dir) {
	try {
		const resolved = node_fs.default.realpathSync(dir);
		return node_fs.default.statSync(resolved).isDirectory() ? resolved : null;
	} catch {
		return null;
	}
}
function resolveGitDirectoryMarker(dir) {
	const marker = node_path.default.join(dir, ".git");
	try {
		const stat = node_fs.default.statSync(marker);
		if (stat.isDirectory()) return resolveRealDirectory(marker);
		if (!stat.isFile()) return null;
		const content = node_fs.default.readFileSync(marker, "utf8").trim();
		const match = /^gitdir:\s*(.+)$/i.exec(content);
		if (!match) return null;
		const gitDir = match[1]?.trim();
		if (!gitDir) return null;
		return resolveRealDirectory(node_path.default.isAbsolute(gitDir) ? gitDir : node_path.default.resolve(dir, gitDir));
	} catch {
		return null;
	}
}
function isWithinBaseDirectory(baseDir, targetPath) {
	const relative = node_path.default.relative(baseDir, targetPath);
	return relative === "" || !node_path.default.isAbsolute(relative) && !relative.startsWith(`..${node_path.default.sep}`) && relative !== "..";
}
function hasTrustedGitWorkspace(root) {
	const realRoot = resolveRealDirectory(root);
	if (!realRoot) return false;
	for (let dir = realRoot;; dir = node_path.default.dirname(dir)) {
		if (resolveGitDirectoryMarker(dir)) return true;
		if (node_path.default.dirname(dir) === dir) return false;
	}
}
function hasGitWorkspace(workspaceDir) {
	const roots = [process.cwd()];
	if (workspaceDir && workspaceDir !== process.cwd()) roots.push(workspaceDir);
	return roots.some((root) => hasTrustedGitWorkspace(root));
}
function addPluginLoadPath(cfg, pluginPath) {
	const merged = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...cfg.plugins?.load?.paths ?? [], pluginPath]);
	return {
		...cfg,
		plugins: {
			...cfg.plugins,
			load: {
				...cfg.plugins?.load,
				paths: merged
			}
		}
	};
}
function pathsReferToSameDirectory(left, right) {
	if (!left || !right) return false;
	const realLeft = resolveRealDirectory(left);
	const realRight = resolveRealDirectory(right);
	return Boolean(realLeft && realRight && realLeft === realRight);
}
function formatPortableLocalPath(localPath, workspaceDir) {
	const bases = [workspaceDir, process.cwd()].filter((entry) => Boolean(entry));
	for (const base of bases) {
		const realBase = resolveRealDirectory(base);
		if (!realBase) continue;
		const relative = node_path.default.relative(realBase, localPath);
		if (relative === "" || !node_path.default.isAbsolute(relative) && !relative.startsWith(`..${node_path.default.sep}`) && relative !== "..") {
			const portable = relative.split(node_path.default.sep).join("/");
			return portable ? `./${portable}` : ".";
		}
	}
}
async function recordLocalPluginInstall(params) {
	const sourcePath = formatPortableLocalPath(params.localPath, params.workspaceDir);
	const install = {
		pluginId: params.entry.pluginId,
		source: "path",
		...sourcePath ? { sourcePath } : {},
		...params.npmSpec ? { spec: params.npmSpec } : {}
	};
	return require_installed_plugin_index_records.recordPluginInstall(params.cfg, install);
}
function resolveLocalPath(params) {
	if (!params.allowLocal) return null;
	const raw = params.entry.install.localPath?.trim();
	if (!raw) return null;
	const candidates = /* @__PURE__ */ new Set();
	const bases = [process.cwd()];
	if (params.workspaceDir && params.workspaceDir !== process.cwd()) bases.push(params.workspaceDir);
	for (const base of bases) {
		const realBase = resolveRealDirectory(base);
		if (!realBase) continue;
		candidates.add(node_path.default.resolve(realBase, raw));
	}
	for (const candidate of candidates) try {
		const resolved = node_fs.default.realpathSync(candidate);
		if (!bases.some((base) => {
			const realBase = resolveRealDirectory(base);
			return realBase ? isWithinBaseDirectory(realBase, resolved) : false;
		})) continue;
		if (node_fs.default.statSync(resolved).isDirectory()) return resolved;
	} catch {}
	return null;
}
function resolveBundledLocalPath(params) {
	const bundledSources = require_bundled_sources.resolveBundledPluginSources({ workspaceDir: params.workspaceDir });
	const npmSpec = params.entry.install.npmSpec?.trim();
	if (npmSpec) return require_plugin_install_plan.resolveBundledInstallPlanForCatalogEntry({
		pluginId: params.entry.pluginId,
		npmSpec,
		findBundledSource: (lookup) => require_bundled_sources.findBundledPluginSourceInMap({
			bundled: bundledSources,
			lookup
		})
	})?.bundledSource.localPath ?? null;
	return require_bundled_sources.findBundledPluginSourceInMap({
		bundled: bundledSources,
		lookup: {
			kind: "pluginId",
			value: params.entry.pluginId
		}
	})?.localPath ?? null;
}
function resolveNpmSpecForOnboarding(install) {
	const npmSpec = install.npmSpec?.trim();
	if (!npmSpec) return null;
	return require_npm_registry_spec.parseRegistryNpmSpec(npmSpec) ? npmSpec : null;
}
function resolveClawHubSpecForOnboarding(install) {
	const clawhubSpec = install.clawhubSpec?.trim();
	if (!clawhubSpec) return null;
	return require_clawhub.parseClawHubPluginSpec(clawhubSpec) ? clawhubSpec : null;
}
function resolveInstallDefaultChoice(params) {
	const { cfg, entry, localPath, bundledLocalPath, hasClawHubSpec, hasNpmSpec } = params;
	const hasRemoteSpec = hasClawHubSpec || hasNpmSpec;
	const entryDefault = entry.install.defaultChoice;
	const remoteDefault = () => {
		if (entryDefault === "clawhub" && hasClawHubSpec) return "clawhub";
		if (entryDefault === "npm" && hasNpmSpec) return "npm";
		return hasNpmSpec ? "npm" : "clawhub";
	};
	if (!hasRemoteSpec) return localPath ? "local" : "skip";
	if (!localPath) return remoteDefault();
	if (bundledLocalPath) return "local";
	const updateChannel = cfg.update?.channel;
	if (updateChannel === "dev") return "local";
	if (updateChannel === "stable" || updateChannel === "extended-stable" || updateChannel === "beta") return remoteDefault();
	if (entryDefault === "local") return "local";
	return remoteDefault();
}
async function promptInstallChoice(params) {
	const rawClawHubSpec = resolveClawHubSpecForOnboarding(params.entry.install);
	const rawNpmSpec = resolveNpmSpecForOnboarding(params.entry.install);
	const clawhubSpec = params.bundledLocalPath ? null : params.effectiveClawHubSpec ?? rawClawHubSpec;
	const npmSpec = params.bundledLocalPath ? null : params.effectiveNpmSpec ?? rawNpmSpec;
	const safeLabel = require_safe_text.sanitizeTerminalText(params.entry.label);
	const safeClawHubSpec = clawhubSpec ? require_safe_text.sanitizeTerminalText(clawhubSpec) : null;
	const safeNpmSpec = npmSpec ? require_safe_text.sanitizeTerminalText(npmSpec) : null;
	const safeLocalPath = params.localPath ? require_safe_text.sanitizeTerminalText(params.localPath) : null;
	const options = [];
	if (safeClawHubSpec) options.push({
		value: "clawhub",
		label: require_i18n.t("wizard.plugins.downloadFromClawHub", { spec: safeClawHubSpec })
	});
	if (safeNpmSpec) options.push({
		value: "npm",
		label: require_i18n.t("wizard.plugins.downloadFromNpm", { spec: safeNpmSpec })
	});
	if (params.localPath) options.push({
		value: "local",
		label: require_i18n.t("wizard.plugins.useLocalPluginPath"),
		...safeLocalPath ? { hint: safeLocalPath } : {}
	});
	if (params.autoConfirmSingleSource) {
		const realSources = [];
		if (safeClawHubSpec) realSources.push("clawhub");
		if (safeNpmSpec) realSources.push("npm");
		if (params.localPath) realSources.push("local");
		if (realSources.length === 1) return (0, _gabrielvfonseca_normalization_core.expectDefined)(realSources[0], "real sources entry at 0");
	}
	options.push({
		value: "skip",
		label: require_i18n.t("common.skipForNow")
	});
	const initialValue = params.defaultChoice === "local" && !params.localPath ? clawhubSpec ? "clawhub" : npmSpec ? "npm" : "skip" : params.defaultChoice === "clawhub" && !clawhubSpec ? npmSpec ? "npm" : params.localPath ? "local" : "skip" : params.defaultChoice === "npm" && !npmSpec ? clawhubSpec ? "clawhub" : params.localPath ? "local" : "skip" : params.defaultChoice;
	return await params.prompter.select({
		message: require_i18n.t("wizard.plugins.installPluginPrompt", { plugin: safeLabel }),
		options,
		initialValue
	});
}
function formatDurationLabel(timeoutMs) {
	if (timeoutMs % 6e4 === 0) {
		const minutes = timeoutMs / 6e4;
		return require_i18n.t(minutes === 1 ? "common.minute" : "common.minutes", { count: minutes });
	}
	const seconds = Math.round(timeoutMs / 1e3);
	return require_i18n.t(seconds === 1 ? "common.second" : "common.seconds", { count: seconds });
}
function formatPluginInstallProgress(label) {
	return require_i18n.t("wizard.plugins.installingPlugin", { plugin: label });
}
function formatPluginInstalled(label) {
	return require_i18n.t("wizard.plugins.installedPlugin", { plugin: label });
}
function formatPluginInstallFailed(label) {
	return require_i18n.t("wizard.plugins.installFailedShort", { plugin: label });
}
function formatPluginInstallTimedOut(label) {
	return require_i18n.t("wizard.plugins.installTimedOutShort", { plugin: label });
}
function formatPluginInstallTimedOutNote(spec) {
	return [require_i18n.t("wizard.plugins.installTimedOut", {
		spec,
		duration: formatDurationLabel(ONBOARDING_PLUGIN_INSTALL_TIMEOUT_MS)
	}), require_i18n.t("wizard.plugins.returningToSelection")].join("\n");
}
function summarizeInstallError(message) {
	const cleaned = require_safe_text.sanitizeTerminalText(message).replace(/^Install failed(?:\s*\([^)]*\))?\s*:?\s*/i, "").trim();
	if (!cleaned) return "Unknown install failure";
	return cleaned.length > 180 ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(cleaned, 179)}…` : cleaned;
}
const ONBOARDING_PLUGIN_INSTALL_ERROR_MAX_CHARS = 12e3;
function formatInstallErrorDetail(message) {
	const cleaned = message.replace(/\r\n?/g, "\n").split("\n").map((line) => require_safe_text.sanitizeTerminalText(line)).join("\n").trim();
	if (cleaned.length <= ONBOARDING_PLUGIN_INSTALL_ERROR_MAX_CHARS) return cleaned;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(cleaned, ONBOARDING_PLUGIN_INSTALL_ERROR_MAX_CHARS - 31).trimEnd()}
… (installer output truncated)`;
}
const testing = {
	formatInstallErrorDetail,
	summarizeInstallError
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.onboardingPluginInstallTestApi")] = testing;
function isTimeoutError(error) {
	return error instanceof Error && error.message === "timeout";
}
async function applyPluginEnablement(params) {
	const enableResult = require_enable.enableExplicitlySelectedPluginInConfig(params.cfg, params.pluginId);
	if (enableResult.enabled) return enableResult;
	const safeLabel = require_safe_text.sanitizeTerminalText(params.label);
	const reason = enableResult.reason ?? "plugin disabled";
	await params.prompter.note(require_i18n.t("wizard.plugins.enableFailed", {
		plugin: safeLabel,
		reason
	}), require_i18n.t("wizard.plugins.installTitle"));
	params.runtime.error?.(`Plugin install failed: ${require_safe_text.sanitizeTerminalText(params.pluginId)} is disabled (${reason}).`);
	return enableResult;
}
const PROGRESS_BAR_WIDTH = 16;
const PROGRESS_BAR_TICK_MS = 200;
const PROGRESS_BAR_DURATION_MS = 1e4;
const PROGRESS_BAR_MAX_PERCENT = 99;
/**
* Maps a verbose install log line (e.g. `Downloading @scope/pkg@1.2.3 from
* ClawHub…`, `Extracting /tmp/…/wecom-…-2026.4.23.tgz…`, `Installing to
* /home/.../plugins/demo…`) to a short verb suitable for a progress label.
*
* Falls back to the raw message when no known verb prefix is recognised so
* that unexpected log lines still surface to the user instead of being
* swallowed.
*/
function shortenInstallLabel(message) {
	const trimmed = message.trim();
	for (const [pattern, label] of [
		[/^Downloading\b/i, "Downloading"],
		[/^Extracting\b/i, "Extracting"],
		[/^Installing\s+to\b/i, "Installing"],
		[/^Installing\b/i, "Installing"],
		[/^Resolving\b/i, "Resolving"],
		[/^Cloning\b/i, "Cloning"],
		[/^Verifying\b/i, "Verifying"],
		[/^Preparing\b/i, "Preparing"],
		[/^Linking\b/i, "Linking"],
		[/^Linked\b/i, "Linking"],
		[/^npm rejected managed npm alias overrides\b/i, "Retrying"],
		[/^Compatibility\b/i, "Resolving"],
		[/^ClawHub\b/i, "Resolving"]
	]) if (pattern.test(trimmed)) return label;
	return trimmed;
}
/**
* Wraps a {@link WizardProgress} so the spinner message keeps a steadily
* growing ASCII bar attached to whatever the current install step label is.
*
* The plugin install pipeline only emits coarse `info` log lines, so without
* animation the spinner can sit on the same string for many seconds with no
* visible feedback. We render a deterministic left-to-right filling bar that
* advances linearly over {@link PROGRESS_BAR_DURATION_MS} (default 10s) up to
* {@link PROGRESS_BAR_MAX_PERCENT} (99%). If the install takes longer than the
* preset duration the bar simply stays pinned at 99% — never wrapping back to
* 0% — so the user always sees forward motion and a ceiling that signals
* "almost there, just waiting on the last bit".
*
* The bare label is forwarded to `progress.update` first on every label
* change so callers/tests that assert on the unadorned message continue to
* observe it before any decorated frame is overlaid.
*/
function createAnimatedInstallProgress(progress, options = {}) {
	const totalMs = options.totalMs ?? PROGRESS_BAR_DURATION_MS;
	let currentLabel = "";
	const startedAt = Date.now();
	const computePercent = () => {
		const elapsed = Date.now() - startedAt;
		const raw = Math.floor(elapsed / totalMs * 100);
		return Math.max(0, Math.min(PROGRESS_BAR_MAX_PERCENT, raw));
	};
	const renderBar = () => {
		const percent = computePercent();
		const filled = Math.round(percent / 100 * PROGRESS_BAR_WIDTH);
		return `[${"█".repeat(filled) + "░".repeat(Math.max(0, PROGRESS_BAR_WIDTH - filled))}] ${percent}%`;
	};
	const decorate = (label) => {
		if (!label) return renderBar();
		return `${label}  ${renderBar()}`;
	};
	const timer = setInterval(() => {
		if (currentLabel) progress.update(decorate(currentLabel));
	}, PROGRESS_BAR_TICK_MS);
	if (typeof timer.unref === "function") timer.unref();
	return {
		setLabel: (label) => {
			currentLabel = label;
			progress.update(label);
		},
		stop: () => {
			clearInterval(timer);
		}
	};
}
function logInstallWarningWithSpacing(runtime, message) {
	const sanitized = require_safe_text.sanitizeTerminalText(message).trim();
	if (!sanitized) return;
	runtime.log?.(`${sanitized}\n`);
}
function logInstallWarningWithLineBreaks(runtime, message) {
	const sanitized = message.split("\n").map((line) => require_safe_text.sanitizeTerminalText(line)).join("\n").trim();
	if (!sanitized) return;
	runtime.log?.(`${sanitized}\n`);
}
function isReviewRequiredClawHubTrustWarning(message) {
	return message.includes("WARNING - ClawHub found security risks");
}
function isClawHubTrustWarning(message) {
	return isReviewRequiredClawHubTrustWarning(message) || message.includes("BLOCKED - ClawHub") || message.includes("REVIEW RECOMMENDED - ClawHub");
}
async function installPluginFromNpmSpecWithProgress(params) {
	const safeLabel = require_safe_text.sanitizeTerminalText(params.entry.label);
	const progress = params.prompter.progress(formatPluginInstallProgress(safeLabel));
	const animated = createAnimatedInstallProgress(progress);
	animated.setLabel(require_i18n.t("wizard.plugins.preparingInstall"));
	const updateProgress = (message) => {
		const sanitized = require_safe_text.sanitizeTerminalText(message).trim();
		if (!sanitized) return;
		animated.setLabel(shortenInstallLabel(sanitized));
	};
	try {
		const result = await (0, _openclaw_fs_safe_advanced.withTimeout)(require_clawhub_error_codes.installPluginFromNpmSpec({
			spec: params.npmSpec,
			mode: "update",
			config: params.cfg,
			timeoutMs: ONBOARDING_PLUGIN_INSTALL_TIMEOUT_MS,
			expectedPluginId: params.entry.pluginId,
			expectedIntegrity: params.entry.install.expectedIntegrity,
			...params.trustedSourceLinkedOfficialInstall ?? params.entry.trustedSourceLinkedOfficialInstall ? { trustedSourceLinkedOfficialInstall: true } : {},
			extensionsDir: require_install_paths.resolveDefaultPluginExtensionsDir(),
			logger: {
				info: updateProgress,
				warn: (message) => {
					updateProgress(message);
					logInstallWarningWithSpacing(params.runtime, message);
				}
			}
		}), ONBOARDING_PLUGIN_INSTALL_WATCHDOG_TIMEOUT_MS);
		animated.stop();
		if (result.ok) progress.stop(formatPluginInstalled(safeLabel));
		else progress.stop(formatPluginInstallFailed(safeLabel));
		return {
			status: "completed",
			result
		};
	} catch (error) {
		animated.stop();
		if (isTimeoutError(error)) {
			progress.stop(formatPluginInstallTimedOut(safeLabel));
			return { status: "timed_out" };
		}
		progress.stop(formatPluginInstallFailed(safeLabel));
		return {
			status: "completed",
			result: {
				ok: false,
				error: error instanceof Error ? error.message : String(error)
			}
		};
	}
}
async function installPluginFromNpmPackArchiveWithProgress(params) {
	const safeLabel = require_safe_text.sanitizeTerminalText(params.entry.label);
	const progress = params.prompter.progress(formatPluginInstallProgress(safeLabel));
	const animated = createAnimatedInstallProgress(progress);
	animated.setLabel(require_i18n.t("wizard.plugins.preparingInstall"));
	const updateProgress = (message) => {
		const sanitized = require_safe_text.sanitizeTerminalText(message).trim();
		if (!sanitized) return;
		animated.setLabel(shortenInstallLabel(sanitized));
	};
	try {
		const result = await (0, _openclaw_fs_safe_advanced.withTimeout)(require_clawhub_error_codes.installPluginFromNpmPackArchive({
			archivePath: params.archivePath,
			timeoutMs: ONBOARDING_PLUGIN_INSTALL_TIMEOUT_MS,
			config: params.cfg,
			expectedPluginId: params.entry.pluginId,
			expectedIntegrity: params.entry.install.expectedIntegrity,
			extensionsDir: require_install_paths.resolveDefaultPluginExtensionsDir(),
			logger: {
				info: updateProgress,
				warn: (message) => {
					updateProgress(message);
					logInstallWarningWithSpacing(params.runtime, message);
				}
			}
		}), ONBOARDING_PLUGIN_INSTALL_WATCHDOG_TIMEOUT_MS);
		animated.stop();
		progress.stop(result.ok ? formatPluginInstalled(safeLabel) : formatPluginInstallFailed(safeLabel));
		return {
			status: "completed",
			result
		};
	} catch (error) {
		animated.stop();
		if (isTimeoutError(error)) {
			progress.stop(formatPluginInstallTimedOut(safeLabel));
			return { status: "timed_out" };
		}
		progress.stop(formatPluginInstallFailed(safeLabel));
		throw error;
	} finally {
		animated.stop();
	}
}
async function installPluginFromOverride(params) {
	const { entry, prompter, runtime } = params;
	runtime.log?.(`Using plugin install override for ${require_safe_text.sanitizeTerminalText(entry.pluginId)} from ${PLUGIN_INSTALL_OVERRIDES_ENV} (${ALLOW_PLUGIN_INSTALL_OVERRIDES_ENV}=1).`);
	const installOutcome = params.override.kind === "npm" ? await installPluginFromNpmSpecWithProgress({
		cfg: params.cfg,
		entry,
		npmSpec: params.override.spec,
		prompter,
		runtime,
		trustedSourceLinkedOfficialInstall: false
	}) : await installPluginFromNpmPackArchiveWithProgress({
		cfg: params.cfg,
		entry,
		archivePath: params.override.archivePath,
		prompter,
		runtime
	});
	const displaySpec = params.override.kind === "npm" ? params.override.spec : `npm-pack:${params.override.archivePath}`;
	if (installOutcome.status === "timed_out") {
		await prompter.note(formatPluginInstallTimedOutNote(require_safe_text.sanitizeTerminalText(displaySpec)), require_i18n.t("wizard.plugins.installTitle"));
		runtime.error?.(`Plugin install timed out after ${ONBOARDING_PLUGIN_INSTALL_TIMEOUT_MS}ms: ${require_safe_text.sanitizeTerminalText(displaySpec)}`);
		return {
			cfg: params.cfg,
			installed: false,
			pluginId: entry.pluginId,
			status: "timed_out"
		};
	}
	const { result } = installOutcome;
	if (!result.ok) {
		const errorDetail = formatInstallErrorDetail(result.error);
		await prompter.note([require_i18n.t("wizard.plugins.installFailed", {
			spec: require_safe_text.sanitizeTerminalText(displaySpec),
			error: summarizeInstallError(result.error)
		}), require_i18n.t("wizard.plugins.returningToSelection")].join("\n"), require_i18n.t("wizard.plugins.installTitle"));
		runtime.error?.(`Plugin install failed: ${summarizeInstallError(result.error)}`);
		return {
			cfg: params.cfg,
			installed: false,
			pluginId: entry.pluginId,
			status: "failed",
			error: errorDetail
		};
	}
	const enableResult = await applyPluginEnablement({
		cfg: params.cfg,
		pluginId: result.pluginId,
		label: entry.label,
		prompter,
		runtime
	});
	if (!enableResult.enabled) return {
		cfg: enableResult.config,
		installed: false,
		pluginId: result.pluginId,
		status: "failed"
	};
	const npmTarballName = params.override.kind === "npm-pack" ? result.npmTarballName : void 0;
	const install = params.override.kind === "npm-pack" ? {
		pluginId: result.pluginId,
		source: "npm",
		spec: result.npmResolution?.resolvedSpec ?? result.manifestName ?? result.pluginId,
		sourcePath: params.override.archivePath,
		installPath: result.targetDir,
		...result.version ? { version: result.version } : {},
		...require_installed_plugin_index_records.buildNpmResolutionInstallFields(result.npmResolution),
		artifactKind: "npm-pack",
		artifactFormat: "tgz",
		...result.npmResolution?.integrity ? { npmIntegrity: result.npmResolution.integrity } : {},
		...result.npmResolution?.shasum ? { npmShasum: result.npmResolution.shasum } : {},
		...npmTarballName ? { npmTarballName } : {}
	} : {
		pluginId: result.pluginId,
		source: "npm",
		spec: params.override.spec,
		installPath: result.targetDir,
		...result.version ? { version: result.version } : {},
		...require_installed_plugin_index_records.buildNpmResolutionInstallFields(result.npmResolution)
	};
	return await markOnboardingPluginInstalled({
		cfg: require_installed_plugin_index_records.recordPluginInstall(enableResult.config, install),
		installed: true,
		pluginId: result.pluginId,
		status: "installed"
	}, { runtime: params.runtime });
}
async function installPluginFromClawHubSpecWithProgress(params) {
	const safeLabel = require_safe_text.sanitizeTerminalText(params.entry.label);
	const progress = params.prompter.progress(formatPluginInstallProgress(safeLabel));
	const animated = createAnimatedInstallProgress(progress);
	animated.setLabel(require_i18n.t("wizard.plugins.preparingInstall"));
	const updateProgress = (message) => {
		const sanitized = require_safe_text.sanitizeTerminalText(message).trim();
		if (!sanitized) return;
		animated.setLabel(shortenInstallLabel(sanitized));
	};
	let renderedTrustWarning = false;
	const renderTrustWarning = (message) => {
		logInstallWarningWithLineBreaks(params.runtime, message);
		renderedTrustWarning = true;
	};
	try {
		const { installPluginFromClawHub } = await Promise.resolve().then(() => require("./clawhub-FY3ULXyp.cjs")).then((n) => n.clawhub_exports);
		const result = await (0, _openclaw_fs_safe_advanced.withTimeout)(installPluginFromClawHub({
			spec: params.clawhubSpec,
			timeoutMs: ONBOARDING_PLUGIN_INSTALL_TIMEOUT_MS,
			config: params.cfg,
			extensionsDir: require_install_paths.resolveDefaultPluginExtensionsDir(),
			expectedPluginId: params.entry.pluginId,
			mode: "install",
			logger: {
				info: updateProgress,
				warn: (message) => {
					updateProgress(message);
					if (isReviewRequiredClawHubTrustWarning(message)) return;
					if (isClawHubTrustWarning(message)) {
						renderTrustWarning(message);
						return;
					}
					logInstallWarningWithSpacing(params.runtime, message);
				}
			},
			onClawHubRisk: async (request) => {
				animated.stop();
				progress.stop("Review ClawHub warning");
				renderTrustWarning(request.warning);
				const packageName = require_safe_text.sanitizeTerminalText(request.packageName);
				const releaseLabel = `${packageName}@${require_safe_text.sanitizeTerminalText(request.version)}`;
				if (request.acknowledgementKind === "type-package") return (await params.prompter.text({
					message: `To install anyway, type the package name for "${releaseLabel}"`,
					placeholder: packageName
				})).trim() === packageName;
				return await params.prompter.confirm({
					message: `Install ClawHub package "${releaseLabel}" after reviewing the warning above?`,
					initialValue: false
				});
			}
		}), ONBOARDING_PLUGIN_INSTALL_WATCHDOG_TIMEOUT_MS);
		animated.stop();
		const failureWarning = readInstallFailureWarning(result);
		if (failureWarning && !renderedTrustWarning) {
			progress.stop("Review ClawHub warning");
			renderTrustWarning(failureWarning);
		}
		if (result.ok) progress.stop(formatPluginInstalled(safeLabel));
		else progress.stop(formatPluginInstallFailed(safeLabel));
		return {
			status: "completed",
			result
		};
	} catch (error) {
		animated.stop();
		if (isTimeoutError(error)) {
			progress.stop(formatPluginInstallTimedOut(safeLabel));
			return { status: "timed_out" };
		}
		progress.stop(formatPluginInstallFailed(safeLabel));
		return {
			status: "completed",
			result: {
				ok: false,
				error: error instanceof Error ? error.message : String(error)
			}
		};
	}
}
/** Ensures an onboarding plugin is installed, enabled, and recorded in config. */
async function ensureOnboardingPluginInstalled(params) {
	const { entry, prompter, runtime, workspaceDir } = params;
	let next = params.cfg;
	const installOverride = resolvePluginInstallOverride({ pluginId: entry.pluginId });
	if (installOverride) {
		require_nix_mode_write_guard.assertConfigWriteAllowedInCurrentMode();
		await params.beforePersistentEffect?.();
		return await installPluginFromOverride({
			cfg: next,
			entry,
			override: installOverride,
			prompter,
			runtime
		});
	}
	const allowLocal = hasGitWorkspace(workspaceDir);
	const bundledLocalPath = entry.preferRemoteInstall ? null : resolveBundledLocalPath({
		entry,
		workspaceDir
	});
	const localPath = bundledLocalPath ?? (entry.preferRemoteInstall ? null : resolveLocalPath({
		entry,
		workspaceDir,
		allowLocal
	}));
	const clawhubSpec = resolveClawHubSpecForOnboarding(entry.install);
	const npmSpec = resolveNpmSpecForOnboarding(entry.install);
	const updateChannel = require_update_channels.resolveRegistryUpdateChannel({
		configChannel: require_update_channels.normalizeUpdateChannel(next.update?.channel),
		currentVersion: require_version.VERSION
	});
	const clawhubSpecs = clawhubSpec ? require_install_channel_specs.resolveClawHubInstallSpecsForUpdateChannel({
		spec: clawhubSpec,
		updateChannel
	}) : null;
	const npmSpecs = npmSpec ? require_install_channel_specs.resolveNpmInstallSpecsForUpdateChannel({
		spec: npmSpec,
		updateChannel,
		officialPackageName: entry.trustedSourceLinkedOfficialInstall ? require_npm_registry_spec.parseRegistryNpmSpec(npmSpec)?.name : void 0,
		coreVersion: require_version.VERSION
	}) : null;
	const clawhubInstallSpec = clawhubSpecs?.installSpec ?? clawhubSpec;
	const npmInstallSpec = npmSpecs?.installSpec ?? npmSpec;
	const defaultChoice = resolveInstallDefaultChoice({
		cfg: next,
		entry,
		localPath,
		bundledLocalPath,
		hasClawHubSpec: Boolean(clawhubSpec),
		hasNpmSpec: Boolean(npmSpec)
	});
	const choice = params.promptInstall === false ? defaultChoice : await promptInstallChoice({
		entry,
		localPath,
		bundledLocalPath,
		defaultChoice,
		prompter,
		autoConfirmSingleSource: params.autoConfirmSingleSource,
		effectiveClawHubSpec: clawhubInstallSpec,
		effectiveNpmSpec: npmInstallSpec
	});
	if (choice === "skip") return {
		cfg: next,
		installed: false,
		pluginId: entry.pluginId,
		status: "skipped"
	};
	require_nix_mode_write_guard.assertConfigWriteAllowedInCurrentMode();
	if (choice === "local" && localPath) {
		const enableResult = await applyPluginEnablement({
			cfg: next,
			pluginId: entry.pluginId,
			label: entry.label,
			prompter,
			runtime
		});
		if (!enableResult.enabled) return {
			cfg: enableResult.config,
			installed: false,
			pluginId: entry.pluginId,
			status: "failed"
		};
		if (pathsReferToSameDirectory(localPath, bundledLocalPath)) return await markOnboardingPluginInstalled({
			cfg: enableResult.config,
			installed: true,
			pluginId: entry.pluginId,
			status: "installed"
		}, { runtime });
		next = addPluginLoadPath(enableResult.config, localPath);
		next = await recordLocalPluginInstall({
			cfg: next,
			entry,
			localPath,
			npmSpec,
			workspaceDir
		});
		return await markOnboardingPluginInstalled({
			cfg: next,
			installed: true,
			pluginId: entry.pluginId,
			status: "installed"
		}, { runtime });
	}
	let shouldTryNpm = choice === "npm";
	if (choice === "clawhub" && clawhubInstallSpec) {
		await params.beforePersistentEffect?.();
		const installOutcome = await installPluginFromClawHubSpecWithProgress({
			cfg: next,
			entry,
			clawhubSpec: clawhubInstallSpec,
			prompter,
			runtime
		});
		if (installOutcome.status === "timed_out") {
			await prompter.note(formatPluginInstallTimedOutNote(require_safe_text.sanitizeTerminalText(clawhubInstallSpec)), require_i18n.t("wizard.plugins.installTitle"));
			runtime.error?.(`Plugin install timed out after ${ONBOARDING_PLUGIN_INSTALL_TIMEOUT_MS}ms: ${require_safe_text.sanitizeTerminalText(clawhubInstallSpec)}`);
			return {
				cfg: next,
				installed: false,
				pluginId: entry.pluginId,
				status: "timed_out"
			};
		}
		const { result } = installOutcome;
		if (result.ok) {
			const enableResult = await applyPluginEnablement({
				cfg: next,
				pluginId: result.pluginId,
				label: entry.label,
				prompter,
				runtime
			});
			if (!enableResult.enabled) return {
				cfg: enableResult.config,
				installed: false,
				pluginId: result.pluginId,
				status: "failed"
			};
			next = enableResult.config;
			next = require_installed_plugin_index_records.recordPluginInstall(next, {
				pluginId: result.pluginId,
				...require_clawhub_install_records.buildClawHubPluginInstallRecordFields(result.clawhub),
				spec: clawhubSpecs?.recordSpec ?? clawhubInstallSpec,
				installPath: result.targetDir
			});
			return await markOnboardingPluginInstalled({
				cfg: next,
				installed: true,
				pluginId: result.pluginId,
				status: "installed"
			}, { runtime });
		}
		await prompter.note([require_i18n.t("wizard.plugins.installFailed", {
			spec: require_safe_text.sanitizeTerminalText(clawhubInstallSpec),
			error: summarizeInstallError(result.error)
		}), require_i18n.t("wizard.plugins.returningToSelection")].join("\n"), require_i18n.t("wizard.plugins.installTitle"));
		const errorDetail = formatInstallErrorDetail(result.error);
		if (!npmInstallSpec || !shouldFallbackClawHubToNpm({
			result,
			npmSpec: npmInstallSpec
		})) {
			runtime.error?.(`Plugin install failed: ${summarizeInstallError(result.error)}`);
			return {
				cfg: next,
				installed: false,
				pluginId: entry.pluginId,
				status: "failed",
				error: errorDetail
			};
		}
		shouldTryNpm = await prompter.confirm({
			message: require_i18n.t("wizard.plugins.useNpmPackageInstead", { spec: require_safe_text.sanitizeTerminalText(npmInstallSpec) }),
			initialValue: true
		});
		if (!shouldTryNpm) {
			runtime.error?.(`Plugin install failed: ${summarizeInstallError(result.error)}`);
			return {
				cfg: next,
				installed: false,
				pluginId: entry.pluginId,
				status: "failed",
				error: errorDetail
			};
		}
	}
	if (!shouldTryNpm || !npmInstallSpec) {
		await prompter.note(require_i18n.t("wizard.plugins.noRemoteInstallSource", { plugin: require_safe_text.sanitizeTerminalText(entry.label) }), require_i18n.t("wizard.plugins.installTitle"));
		runtime.error?.(`Plugin install failed: no remote spec available for ${require_safe_text.sanitizeTerminalText(entry.pluginId)}.`);
		return {
			cfg: next,
			installed: false,
			pluginId: entry.pluginId,
			status: "failed"
		};
	}
	await params.beforePersistentEffect?.();
	const installOutcome = await installPluginFromNpmSpecWithProgress({
		cfg: next,
		entry,
		npmSpec: npmInstallSpec,
		prompter,
		runtime
	});
	if (installOutcome.status === "timed_out") {
		await prompter.note(formatPluginInstallTimedOutNote(require_safe_text.sanitizeTerminalText(npmInstallSpec)), require_i18n.t("wizard.plugins.installTitle"));
		runtime.error?.(`Plugin install timed out after ${ONBOARDING_PLUGIN_INSTALL_TIMEOUT_MS}ms: ${require_safe_text.sanitizeTerminalText(npmInstallSpec)}`);
		return {
			cfg: next,
			installed: false,
			pluginId: entry.pluginId,
			status: "timed_out"
		};
	}
	const { result } = installOutcome;
	if (result.ok) {
		const enableResult = await applyPluginEnablement({
			cfg: next,
			pluginId: result.pluginId,
			label: entry.label,
			prompter,
			runtime
		});
		if (!enableResult.enabled) return {
			cfg: enableResult.config,
			installed: false,
			pluginId: result.pluginId,
			status: "failed"
		};
		next = enableResult.config;
		const install = {
			pluginId: result.pluginId,
			source: "npm",
			spec: require_installed_plugin_index_records.resolveNpmInstallRecordSpec({
				requestedSpec: npmSpecs?.recordSpec ?? npmInstallSpec,
				resolution: result.npmResolution,
				pinResolvedRegistrySpec: false
			}),
			installPath: result.targetDir,
			version: result.version,
			...require_installed_plugin_index_records.buildNpmResolutionInstallFields(result.npmResolution)
		};
		next = require_installed_plugin_index_records.recordPluginInstall(next, install);
		return await markOnboardingPluginInstalled({
			cfg: next,
			installed: true,
			pluginId: result.pluginId,
			status: "installed"
		}, { runtime });
	}
	await prompter.note([require_i18n.t("wizard.plugins.installFailed", {
		spec: require_safe_text.sanitizeTerminalText(npmInstallSpec),
		error: summarizeInstallError(result.error)
	}), require_i18n.t("wizard.plugins.returningToSelection")].join("\n"), require_i18n.t("wizard.plugins.installTitle"));
	if (localPath) {
		if (await prompter.confirm({
			message: require_i18n.t("wizard.plugins.useLocalPluginPathInstead", { path: require_safe_text.sanitizeTerminalText(localPath) }),
			initialValue: true
		})) {
			const enableResult = await applyPluginEnablement({
				cfg: next,
				pluginId: entry.pluginId,
				label: entry.label,
				prompter,
				runtime
			});
			if (!enableResult.enabled) return {
				cfg: enableResult.config,
				installed: false,
				pluginId: entry.pluginId,
				status: "failed"
			};
			if (pathsReferToSameDirectory(localPath, bundledLocalPath)) return await markOnboardingPluginInstalled({
				cfg: enableResult.config,
				installed: true,
				pluginId: entry.pluginId,
				status: "installed"
			}, { runtime });
			next = addPluginLoadPath(enableResult.config, localPath);
			next = await recordLocalPluginInstall({
				cfg: next,
				entry,
				localPath,
				npmSpec,
				workspaceDir
			});
			return await markOnboardingPluginInstalled({
				cfg: next,
				installed: true,
				pluginId: entry.pluginId,
				status: "installed"
			}, { runtime });
		}
	}
	const errorDetail = formatInstallErrorDetail(result.error);
	runtime.error?.(`Plugin install failed: ${summarizeInstallError(result.error)}`);
	return {
		cfg: next,
		installed: false,
		pluginId: entry.pluginId,
		status: "failed",
		error: errorDetail
	};
}
//#endregion
Object.defineProperty(exports, "ensureOnboardingPluginInstalled", {
	enumerable: true,
	get: function() {
		return ensureOnboardingPluginInstalled;
	}
});
Object.defineProperty(exports, "onboarding_plugin_install_exports", {
	enumerable: true,
	get: function() {
		return onboarding_plugin_install_exports;
	}
});
