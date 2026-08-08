const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_service = require("./service-BJLcDrM4.cjs");
const require_launchd = require("./launchd-dIaeSQPq.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/doctor-platform-notes.ts
/** Platform-specific doctor notes for macOS gateway launchd state and startup tuning. */
function resolveHomeDir() {
	return process.env.HOME ?? node_os.default.homedir();
}
/** Returns the macOS marker warning when LaunchAgent writes are locally disabled. */
function collectMacLaunchAgentOverrideWarning(deps) {
	if ((deps?.platform ?? process.platform) !== "darwin") return null;
	const home = deps?.homeDir ?? resolveHomeDir();
	const markerCandidates = [node_path.default.join(home, ".operator", "disable-launchagent")];
	const exists = deps?.exists ?? node_fs.default.existsSync;
	const markerPath = markerCandidates.find((candidate) => exists(candidate));
	if (!markerPath) return null;
	const displayMarkerPath = require_utils.shortenHomePath(markerPath);
	return [
		`- LaunchAgent writes are disabled via ${displayMarkerPath}.`,
		"- To restore default behavior:",
		`  rm ${displayMarkerPath}`
	].join("\n");
}
/** Emits the macOS LaunchAgent override warning when present. */
async function noteMacLaunchAgentOverrides() {
	const warning = collectMacLaunchAgentOverrideWarning();
	if (warning) require_note.note(warning, "Gateway (macOS)");
}
/** Returns a warning for stale Operator updater launchd jobs left after interrupted updates. */
async function collectMacStaleOperatorUpdateLaunchdJobsWarning(deps) {
	if ((deps?.platform ?? process.platform) !== "darwin") return null;
	const scanEnv = deps?.env ?? process.env;
	const jobs = await (deps?.findJobs ?? require_launchd.findStaleOperatorUpdateLaunchdJobs)(scanEnv).catch(() => []);
	if (jobs.length === 0) return null;
	return [
		"- Stale Operator updater launchd job(s) detected.",
		...jobs.map((job) => {
			const exitStatus = job.lastExitStatus !== void 0 ? `, last exit ${job.lastExitStatus}` : "";
			const pid = job.pid !== void 0 ? `, pid ${job.pid}` : "";
			return `- ${job.label}${pid}${exitStatus}`;
		}),
		"- Fix after confirming no update is running:",
		"  launchctl remove <label>",
		`  ${require_command_format.formatCliCommand("openclaw gateway restart")}`
	].join("\n");
}
/** Emits stale updater launchd job notes using the gateway service environment when available. */
async function noteMacStaleOperatorUpdateLaunchdJobs(deps) {
	const platform = deps?.platform ?? process.platform;
	const warning = await collectMacStaleOperatorUpdateLaunchdJobsWarning({
		env: platform === "darwin" ? await resolveGatewayServiceEnvForPlatformNotes(deps) : deps?.env,
		findJobs: deps?.findJobs,
		platform
	});
	if (warning) (deps?.noteFn ?? require_note.note)(warning, "Gateway (macOS)");
}
async function launchctlGetenv(name) {
	try {
		const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((await require_exec.runExec("/bin/launchctl", ["getenv", name], { logOutput: false })).stdout) ?? "";
		return value.length > 0 ? value : void 0;
	} catch {
		return;
	}
}
function hasConfigGatewayCreds(cfg) {
	const localPassword = cfg.gateway?.auth?.password;
	const remoteToken = cfg.gateway?.remote?.token;
	const remotePassword = cfg.gateway?.remote?.password;
	return require_types_secrets.hasConfiguredSecretInput(cfg.gateway?.auth?.token, cfg.secrets?.defaults) || require_types_secrets.hasConfiguredSecretInput(localPassword, cfg.secrets?.defaults) || require_types_secrets.hasConfiguredSecretInput(remoteToken, cfg.secrets?.defaults) || require_types_secrets.hasConfiguredSecretInput(remotePassword, cfg.secrets?.defaults);
}
/** Returns a warning for host-wide launchctl gateway auth env overrides. */
async function collectMacLaunchctlGatewayEnvOverrideWarning(cfg, deps) {
	if ((deps?.platform ?? process.platform) !== "darwin") return null;
	if (!hasConfigGatewayCreds(cfg)) return null;
	const getenv = deps?.getenv ?? launchctlGetenv;
	const tokenEntries = [["OPERATOR_GATEWAY_TOKEN", await getenv("OPERATOR_GATEWAY_TOKEN")]];
	const passwordEntries = [["OPERATOR_GATEWAY_PASSWORD", await getenv("OPERATOR_GATEWAY_PASSWORD")]];
	const tokenEntry = tokenEntries.find(([, value]) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value));
	const passwordEntry = passwordEntries.find(([, value]) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value));
	const envToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(tokenEntry?.[1]) ?? "";
	const envPassword = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(passwordEntry?.[1]) ?? "";
	const envTokenKey = tokenEntry?.[0];
	const envPasswordKey = passwordEntry?.[0];
	if (!envToken && !envPassword) return null;
	return [
		"- Host-wide launchctl gateway auth overrides detected.",
		"- Current managed Gateway installs do not need these values unless config intentionally references the env var.",
		envToken && envTokenKey ? `- \`${envTokenKey}\` is set; it can make local clients use a different token than gateway.auth.token.` : void 0,
		envPassword ? `- \`${envPasswordKey ?? "OPERATOR_GATEWAY_PASSWORD"}\` is set; it can make local clients use a different password than gateway.auth.password.` : void 0,
		"- Clear overrides and restart the app/gateway:",
		envTokenKey ? `  launchctl unsetenv ${envTokenKey}` : void 0,
		envPasswordKey ? `  launchctl unsetenv ${envPasswordKey}` : void 0
	].filter((line) => Boolean(line)).join("\n");
}
/** Emits macOS launchctl gateway auth override warnings. */
async function noteMacLaunchctlGatewayEnvOverrides(cfg, deps) {
	const warning = await collectMacLaunchctlGatewayEnvOverrideWarning(cfg, deps);
	if (warning) (deps?.noteFn ?? require_note.note)(warning, "Gateway (macOS)");
}
async function resolveGatewayServiceEnvForPlatformNotes(deps) {
	const baseEnv = deps?.env ?? process.env;
	const command = await (deps?.service ?? require_service.resolveGatewayService()).readCommand(baseEnv).catch(() => null);
	return command?.environment ? {
		...baseEnv,
		...command.environment
	} : baseEnv;
}
/** Collects all macOS gateway platform warnings without emitting notes. */
async function collectMacGatewayPlatformWarnings(cfg, deps) {
	const platform = deps?.platform ?? process.platform;
	const warnings = [];
	const launchAgentWarning = collectMacLaunchAgentOverrideWarning({ platform });
	if (launchAgentWarning) warnings.push(launchAgentWarning);
	const staleUpdateWarning = await collectMacStaleOperatorUpdateLaunchdJobsWarning({
		env: platform === "darwin" ? await resolveGatewayServiceEnvForPlatformNotes(deps) : deps?.env,
		findJobs: deps?.findJobs,
		platform
	});
	if (staleUpdateWarning) warnings.push(staleUpdateWarning);
	const launchctlWarning = await collectMacLaunchctlGatewayEnvOverrideWarning(cfg, { platform });
	if (launchctlWarning) warnings.push(launchctlWarning);
	return warnings;
}
function isTruthyEnvValue(value) {
	return Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value));
}
function isTmpCompileCachePath(cachePath) {
	const normalized = cachePath.trim().replace(/\/+$/, "");
	return normalized === "/tmp" || normalized.startsWith("/tmp/") || normalized === "/private/tmp" || normalized.startsWith("/private/tmp/");
}
/** Emits startup tuning hints for low-power Linux hosts when env settings are suboptimal. */
function noteStartupOptimizationHints(env = process.env, deps) {
	const platform = deps?.platform ?? process.platform;
	if (platform === "win32") return;
	const arch = deps?.arch ?? node_os.default.arch();
	const totalMemBytes = deps?.totalMemBytes ?? node_os.default.totalmem();
	if (!(platform === "linux" && (arch === "arm" || arch === "arm64" || platform === "linux" && totalMemBytes > 0 && totalMemBytes <= 8 * 1024 ** 3))) return;
	const noteFn = deps?.noteFn ?? require_note.note;
	const compileCache = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.NODE_COMPILE_CACHE) ?? "";
	const disableCompileCache = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.NODE_DISABLE_COMPILE_CACHE) ?? "";
	const noRespawn = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_NO_RESPAWN) ?? "";
	const lines = [];
	if (!compileCache) lines.push("- NODE_COMPILE_CACHE is not set; repeated CLI runs can be slower on small hosts (Raspberry Pi/VM).");
	else if (isTmpCompileCachePath(compileCache)) lines.push("- NODE_COMPILE_CACHE points to /tmp; use /var/tmp so cache survives reboots and warms startup reliably.");
	if (isTruthyEnvValue(disableCompileCache)) lines.push("- NODE_DISABLE_COMPILE_CACHE is set; startup compile cache is disabled.");
	if (noRespawn !== "1") lines.push("- OPERATOR_NO_RESPAWN is not set to 1; set it when you want routine gateway restarts to stay in-process instead of handing off to a managed supervisor.");
	if (lines.length === 0) return;
	const suggestions = [
		"- Suggested env for low-power hosts:",
		"  export NODE_COMPILE_CACHE=/var/tmp/operator-compile-cache",
		"  mkdir -p /var/tmp/operator-compile-cache",
		"  export OPERATOR_NO_RESPAWN=1",
		isTruthyEnvValue(disableCompileCache) ? "  unset NODE_DISABLE_COMPILE_CACHE" : void 0
	].filter((line) => Boolean(line));
	noteFn([...lines, ...suggestions].join("\n"), "Startup optimization");
}
//#endregion
exports.collectMacGatewayPlatformWarnings = collectMacGatewayPlatformWarnings;
exports.noteMacLaunchAgentOverrides = noteMacLaunchAgentOverrides;
exports.noteMacLaunchctlGatewayEnvOverrides = noteMacLaunchctlGatewayEnvOverrides;
exports.noteMacStaleOperatorUpdateLaunchdJobs = noteMacStaleOperatorUpdateLaunchdJobs;
exports.noteStartupOptimizationHints = noteStartupOptimizationHints;
