const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_sleep = require("./sleep-BVpvBXin.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./ansi-DY9p-M6m.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_workspace = require("./workspace-oX0zfOZq.cjs");
const require_paths$1 = require("./paths-DsfW3Lup.cjs");
const require_connect_error_details = require("./connect-error-details-lz40g7i9.cjs");
const require_detect_binary = require("./detect-binary-B24IC5Ac.cjs");
const require_prompt_style = require("./prompt-style-DDurS--q.cjs");
const require_probe = require("./probe-DBcFqNwO.cjs");
const require_random_token = require("./random-token-BjnIqlbc.cjs");
const require_control_ui_shared = require("./control-ui-shared-ggCalNPl.cjs");
const require_control_ui_links = require("./control-ui-links-CSNzE0Jo.cjs");
const require_browser_open = require("./browser-open-vi77U5ps.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_util = require("node:util");
let _clack_prompts = require("@clack/prompts");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region packages/terminal-core/src/decorative-emoji.ts
/** Detect terminals with known emoji rendering support. */
function isKnownEmojiTerminal(env) {
	const termProgram = (env.TERM_PROGRAM ?? "").toLowerCase();
	const term = (env.TERM ?? "").toLowerCase();
	return termProgram.includes("iterm") || termProgram.includes("apple_terminal") || termProgram.includes("ghostty") || termProgram.includes("wezterm") || termProgram.includes("vscode") || term.includes("ghostty") || term.includes("wezterm") || Boolean(env.WT_SESSION);
}
/** Return true when locale variables indicate UTF-8 output support. */
function hasUtf8Locale(env) {
	const locale = [
		env.LC_ALL,
		env.LC_CTYPE,
		env.LANG
	].find((value) => typeof value === "string" && value.trim().length > 0);
	if (!locale) return true;
	return /utf-?8/i.test(locale);
}
/** Return true when decorative emoji should be emitted for the target terminal. */
function supportsDecorativeEmoji(options = {}) {
	const env = options.env ?? process.env;
	const platform = options.platform ?? process.platform;
	if (!(options.isTty ?? options.stream?.isTTY ?? process.stdout.isTTY)) return false;
	if ((env.TERM ?? "").toLowerCase() === "dumb") return false;
	if (!hasUtf8Locale(env)) return false;
	if (isKnownEmojiTerminal(env)) return true;
	if (platform === "darwin") return true;
	return false;
}
/** Return the emoji only when decorative emoji output is supported. */
function decorativeEmoji(emoji, options = {}) {
	return supportsDecorativeEmoji(options) ? emoji : "";
}
//#endregion
//#region src/cli/claw-banner.ts
const MASCOT_ART = [
	"▄███▄     ▄███▄",
	"▀█▄█▀     ▀█▄█▀",
	"     ▀▄ ▄▀",
	"    ██ █ ██",
	"    ▀█████▀",
	"   ▄█▀ █ ▀█▄"
];
const MASCOT_OPEN_ROWS = ["▄█▀█▄     ▄█▀█▄", "▀█ █▀     ▀█ █▀"];
const MASCOT_WIDTH = 15;
const WORDMARK_ROW_OFFSET = 2;
const WORDMARK_ART = [
	"█▀▀▀█ █▀▀▀█ █▀▀▀▀ █▄  █ █▀▀▀▀ █     █▀▀▀█ █   █",
	"█   █ █▀▀▀▀ █▀▀▀  █ ▀▄█ █     █     █▀▀▀█ █▄▀▄█",
	"▀▀▀▀▀ ▀     ▀▀▀▀▀ ▀   ▀ ▀▀▀▀▀ ▀▀▀▀▀ ▀   ▀ ▀   ▀"
];
const GAP = 3;
const BANNER_WIDTH = 66;
const ROWS = MASCOT_ART.length;
const identityTint = (text) => text;
function composeFrame(params) {
	const mascotRows = params.mascotRows ?? MASCOT_ART;
	const lines = [];
	for (let row = 0; row < ROWS; row++) {
		const mascotRow = (mascotRows[row] ?? "").padEnd(MASCOT_WIDTH).slice(0, MASCOT_WIDTH);
		let out = "";
		for (let col = 0; col < mascotRow.length; col++) {
			const ch = mascotRow[col] ?? " ";
			out += ch === " " ? " " : (params.mascotTint?.(col) ?? require_theme.theme.accent)(ch);
		}
		const wordmarkRow = WORDMARK_ART[row - WORDMARK_ROW_OFFSET];
		if (wordmarkRow) {
			out += " ".repeat(GAP);
			for (let col = 0; col < wordmarkRow.length; col++) {
				const ch = wordmarkRow[col] ?? " ";
				out += ch === " " ? " " : (params.wordmarkTint?.(18 + col) ?? identityTint)(ch);
			}
		}
		lines.push(out.replace(/\s+$/, ""));
	}
	return lines;
}
function staticBannerLines() {
	return composeFrame({});
}
function plainTitleLine() {
	const icon = decorativeEmoji("🦞");
	return supportsDecorativeEmoji() && icon ? `${icon} OPENCLAW ${icon}` : "OPENCLAW";
}
const defaultSleep = (ms) => new Promise((resolve) => {
	setTimeout(resolve, ms);
});
async function animateBanner(opts) {
	const { rng, settleWhen, sleep, write } = opts;
	let settleRequested = false;
	const settleSignal = settleWhen ? Promise.resolve(settleWhen).then(() => {
		settleRequested = true;
	}, () => {
		settleRequested = true;
	}) : null;
	const pause = async (ms) => {
		if (!settleSignal) {
			await sleep(ms);
			return true;
		}
		await Promise.race([sleep(ms), settleSignal]);
		return !settleRequested;
	};
	let drewFrame = false;
	const draw = (lines) => {
		const prefix = drewFrame ? `\x1b[${ROWS}F` : "";
		drewFrame = true;
		write(`${prefix}${lines.map((line) => `\x1b[K${line}`).join("\n")}\n`);
	};
	const onSignal = (signal) => {
		require_runtime.restoreTerminalState(`claw banner ${signal}`);
		process.exit(signal === "SIGINT" ? 130 : 143);
	};
	const onSigint = () => onSignal("SIGINT");
	const onSigterm = () => onSignal("SIGTERM");
	process.once("SIGINT", onSigint);
	process.once("SIGTERM", onSigterm);
	write("\x1B[?25l");
	try {
		const wipeSteps = 9;
		for (let step = 0; step <= wipeSteps; step++) {
			const edge = Math.round(BANNER_WIDTH * step / wipeSteps);
			const tintAt = (colored) => (col) => col < edge ? colored : col < edge + 2 ? require_theme.theme.accentBright : require_theme.theme.muted;
			draw(composeFrame({
				mascotTint: tintAt(require_theme.theme.accent),
				wordmarkTint: tintAt(identityTint)
			}));
			if (!await pause(45)) return "settled";
		}
		const shimmerPasses = rng() < .2 ? 2 : 1;
		for (let pass = 0; pass < shimmerPasses; pass++) for (let x = MASCOT_WIDTH; x < 72; x += 4) {
			const band = (col) => col >= x && col < x + 6 ? require_theme.theme.accentBright : identityTint;
			draw(composeFrame({ wordmarkTint: band }));
			if (!await pause(40)) return "settled";
		}
		const snips = rng() < .4 ? 2 : 1;
		for (let snip = 0; snip < snips; snip++) {
			draw(composeFrame({ mascotRows: [...MASCOT_OPEN_ROWS, ...MASCOT_ART.slice(2)] }));
			if (!await pause(95)) return "settled";
			draw(staticBannerLines());
			if (!await pause(115)) return "settled";
		}
		draw(staticBannerLines());
		return "completed";
	} finally {
		try {
			if (settleRequested && drewFrame) draw(staticBannerLines());
		} finally {
			process.off("SIGINT", onSigint);
			process.off("SIGTERM", onSigterm);
			write("\x1B[?25h");
		}
	}
}
/**
* Prints the Operator banner: animated on rich interactive terminals, static
* otherwise, plain title on terminals too narrow for the art.
*/
async function printClawBanner(runtime, options = {}) {
	if ((options.columns ?? process.stdout.columns ?? 80) < BANNER_WIDTH) {
		runtime.log(`${plainTitleLine()}\n`);
		return "static";
	}
	const env = options.env ?? process.env;
	if (!((options.isTty ?? process.stdout.isTTY ?? false) && (options.rich ?? require_theme.isRich()) && !env.CI && !env.VITEST)) {
		runtime.log(`${staticBannerLines().join("\n")}\n`);
		return "static";
	}
	const result = await animateBanner({
		rng: options.rng ?? Math.random,
		settleWhen: options.settleWhen,
		sleep: options.sleep ?? defaultSleep,
		write: options.write ?? ((chunk) => process.stdout.write(chunk))
	});
	(options.write ?? ((chunk) => process.stdout.write(chunk)))("\n");
	return result;
}
//#endregion
//#region src/commands/onboard-helpers.ts
/** Shared helpers for onboarding, reset, gateway checks, and wizard output. */
/** Handles Clack cancellation by exiting through the runtime. */
function guardCancel(value, runtime, exitCode = 0) {
	if ((0, _clack_prompts.isCancel)(value)) {
		(0, _clack_prompts.cancel)(require_prompt_style.stylePromptTitle("Setup cancelled.") ?? "Setup cancelled.");
		runtime.exit(exitCode);
		throw new Error("unreachable");
	}
	return value;
}
/** Summarizes existing config values before onboarding overwrites or reuses them. */
function summarizeExistingConfig(config) {
	const rows = [];
	const defaults = config.agents?.defaults;
	if (defaults?.workspace) rows.push(require_utils.shortenHomeInString(`Workspace: ${defaults.workspace}`));
	if (defaults?.model) {
		const model = require_model_input.resolveAgentModelPrimaryValue(defaults.model);
		if (model) rows.push(require_utils.shortenHomeInString(`Model: ${model}`));
	}
	const gatewaySummary = summarizeGatewayConfig(config);
	if (gatewaySummary) rows.push(require_utils.shortenHomeInString(gatewaySummary));
	if (config.skills?.install?.nodeManager) rows.push(require_utils.shortenHomeInString(`Node manager: ${config.skills.install.nodeManager}`));
	return rows.length ? rows.join("\n") : "No key settings detected.";
}
function summarizeGatewayConfig(config) {
	const gateway = config.gateway;
	if (!gateway?.mode && typeof gateway?.port !== "number" && !gateway?.bind && !gateway?.remote?.url) return null;
	const mode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(gateway.mode);
	const bind = formatGatewayBind(gateway.bind);
	const remoteUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(gateway.remote?.url);
	const useRemoteUrl = remoteUrl !== void 0 && mode !== "local";
	const endpoint = useRemoteUrl && remoteUrl ? remoteUrl : typeof gateway.port === "number" ? `:${gateway.port}` : void 0;
	const words = [];
	if (mode) words.push(mode);
	if (bind) words.push(mode ? `via ${bind}` : bind);
	if (mode === "remote" && !remoteUrl) {
		words.push("(missing remote URL)");
		return `Gateway: ${words.join(" ")}`;
	}
	if (endpoint) words.push(`${useRemoteUrl ? "at" : "on"} ${endpoint}`);
	return `Gateway: ${words.length > 0 ? words.join(" ") : "configured"}`;
}
function formatGatewayBind(value) {
	switch (value) {
		case "lan": return "LAN";
		case "loopback": return "loopback";
		case "tailnet": return "tailnet";
		case "auto": return "auto";
		case "custom": return "custom";
		default: return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	}
}
/** Normalizes gateway token prompts while rejecting JS stringification sentinels. */
function normalizeGatewayTokenInput(value) {
	if (typeof value !== "string") return "";
	const trimmed = value.trim();
	if (trimmed === "undefined" || trimmed === "null") return "";
	return trimmed;
}
/** Validates gateway password prompt input. */
function validateGatewayPasswordInput(value) {
	if (typeof value !== "string") return "Required";
	const trimmed = value.trim();
	if (!trimmed) return "Required";
	if (trimmed === "undefined" || trimmed === "null") return "Cannot be the literal string \"undefined\" or \"null\"";
}
/** Prints the onboarding banner: pixel mascot beside the OPENCLAW wordmark. */
async function printWizardHeader(runtime) {
	await printClawBanner(runtime);
}
/** Records wizard provenance metadata on config writes. */
function applyWizardMetadata(cfg, params) {
	const commit = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.GIT_COMMIT) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.GIT_SHA);
	return {
		...cfg,
		wizard: {
			...cfg.wizard,
			lastRunAt: (/* @__PURE__ */ new Date()).toISOString(),
			lastRunVersion: require_version.VERSION,
			lastRunCommit: commit,
			lastRunCommand: params.command,
			lastRunMode: params.mode
		}
	};
}
/** Formats the no-GUI SSH tunnel hint for opening the Control UI remotely. */
function formatControlUiSshHint(params) {
	const basePath = require_control_ui_shared.normalizeControlUiBasePath(params.basePath);
	const uiPath = basePath ? `${basePath}/` : "/";
	const localUrl = `http://localhost:${params.port}${uiPath}`;
	const authedUrl = params.token ? `${localUrl}#token=${encodeURIComponent(params.token)}` : void 0;
	const sshTarget = resolveSshTargetHint();
	return [
		"No GUI detected. Open from your computer:",
		`ssh -N -L ${params.port}:127.0.0.1:${params.port} ${sshTarget}`,
		"Then open:",
		localUrl,
		authedUrl,
		"BYOH note: lan, tailnet, and custom bind are currently IPv4-only.",
		"If your host is IPv6-only, use an IPv4 sidecar or proxy in front of the Gateway.",
		"Docs:",
		"https://docs.operator.ai/gateway/remote",
		"https://docs.operator.ai/web/control-ui"
	].filter(Boolean).join("\n");
}
function resolveSshTargetHint() {
	return `${process.env.USER || process.env.LOGNAME || "user"}@${(process.env.SSH_CONNECTION?.trim().split(/\s+/))?.[2] ?? "<host>"}`;
}
/** Ensures workspace bootstrap files and session transcript directories exist. */
async function ensureWorkspaceAndSessions(workspaceDir, runtime, options) {
	const ws = await require_workspace.ensureAgentWorkspace({
		dir: workspaceDir,
		ensureBootstrapFiles: !options?.skipBootstrap,
		skipOptionalBootstrapFiles: options?.skipOptionalBootstrapFiles
	});
	runtime.log(`Workspace OK: ${require_utils.shortenHomePath(ws.dir)}`);
	const sessionsDir = require_paths$1.resolveSessionTranscriptsDirForAgent(options?.agentId);
	await node_fs_promises.default.mkdir(sessionsDir, { recursive: true });
	runtime.log(`Sessions OK: ${require_utils.shortenHomePath(sessionsDir)}`);
}
/** Moves a path to Trash when it exists, logging a manual-delete fallback on failure. */
async function moveToTrash(pathname, runtime) {
	if (!pathname) return;
	try {
		await node_fs_promises.default.access(pathname);
	} catch {
		return;
	}
	try {
		const sourcePath = await resolveMoveToTrashSourcePath(node_path.default.resolve(pathname));
		await (0, _openclaw_fs_safe_advanced.movePathToTrash)(sourcePath, { allowedRoots: await resolveMoveToTrashAllowedRoots(sourcePath) });
		runtime.log(`Moved to Trash: ${require_utils.shortenHomePath(pathname)}`);
	} catch {
		runtime.log(`Failed to move to Trash (manual delete): ${require_utils.shortenHomePath(pathname)}`);
	}
}
async function resolveMoveToTrashSourcePath(targetPath) {
	return node_path.default.join(await node_fs_promises.default.realpath(node_path.default.dirname(targetPath)), node_path.default.basename(targetPath));
}
async function resolveMoveToTrashAllowedRoots(targetPath) {
	const allowedRoots = [node_path.default.dirname(targetPath)];
	if ((await node_fs_promises.default.lstat(targetPath)).isSymbolicLink()) try {
		allowedRoots.push(node_path.default.dirname(await node_fs_promises.default.realpath(targetPath)));
	} catch {}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(allowedRoots);
}
/** Deletes onboarding-managed state according to the selected reset scope. */
async function handleReset(scope, workspaceDir, runtime) {
	await moveToTrash(require_paths.resolveConfigPath(), runtime);
	if (scope === "config") return;
	await moveToTrash(node_path.default.join(require_utils.resolveConfigDir(), "credentials"), runtime);
	await moveToTrash(require_paths$1.resolveSessionTranscriptsDirForAgent(), runtime);
	if (scope === "full") {
		await moveToTrash(workspaceDir, runtime);
		for (const [index, attestationPath] of require_workspace.resolveWorkspaceAttestationPaths(workspaceDir).entries()) if (await require_workspace.shouldRemoveWorkspaceAttestation(attestationPath, { trustUnknown: index === 0 })) await moveToTrash(attestationPath, runtime);
	}
}
function runOnboardingGatewayProbe(params, detailLevel) {
	return require_probe.probeGateway({
		url: params.url.trim(),
		timeoutMs: params.timeoutMs ?? Math.max(1500, params.preauthHandshakeTimeoutMs ?? 0),
		auth: {
			token: params.token,
			password: params.password
		},
		...params.tlsFingerprint ? { tlsFingerprint: params.tlsFingerprint } : {},
		...params.preauthHandshakeTimeoutMs ? { preauthHandshakeTimeoutMs: params.preauthHandshakeTimeoutMs } : {},
		detailLevel
	});
}
/** Runs a single lightweight gateway probe for onboarding readiness checks. */
async function probeGatewayReachable(params) {
	try {
		const probe = await runOnboardingGatewayProbe(params, "none");
		if (!probe.ok) return {
			ok: false,
			detail: probe.error ?? void 0
		};
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			detail: summarizeError(err)
		};
	}
}
const RECOGNIZED_GATEWAY_CONNECT_ERROR_CODES = new Set(Object.values(require_connect_error_details.ConnectErrorDetailCodes));
function didProbeReachGateway(probe) {
	const connectErrorCode = require_connect_error_details.readConnectErrorDetailCode(probe.connectErrorDetails);
	const recognizedConnectError = connectErrorCode !== null && RECOGNIZED_GATEWAY_CONNECT_ERROR_CODES.has(connectErrorCode);
	const serverVersion = probe.server?.version?.trim();
	const serverConnectionId = probe.server?.connId?.trim();
	return recognizedConnectError || Boolean(serverVersion && serverConnectionId);
}
/** Reads only Gateway config and classifies whether its default agent has inference. */
async function probeGatewayConfiguredModel(params) {
	let probe;
	try {
		probe = await runOnboardingGatewayProbe(params, "config");
	} catch (err) {
		return {
			kind: "unreachable",
			detail: summarizeError(err)
		};
	}
	const detail = probe.error ?? void 0;
	if (!didProbeReachGateway(probe)) return {
		kind: "unreachable",
		...detail ? { detail } : {}
	};
	if (!probe.ok) return {
		kind: "reachable-unverified",
		detail
	};
	const snapshot = probe.configSnapshot;
	const configCandidate = snapshot?.valid === true ? snapshot.runtimeConfig ?? snapshot.config : null;
	if (!configCandidate || typeof configCandidate !== "object" || Array.isArray(configCandidate)) return {
		kind: "reachable-unverified",
		detail: "Gateway returned an invalid config snapshot"
	};
	try {
		const config = configCandidate;
		return require_agent_scope.resolveAgentEffectiveModelPrimary(config, require_agent_scope_config.resolveDefaultAgentId(config)) ? { kind: "configured" } : {
			kind: "missing-configured-model",
			detail: "Gateway default agent has no configured model"
		};
	} catch {
		return {
			kind: "reachable-unverified",
			detail: "Gateway returned an invalid config snapshot"
		};
	}
}
/** Polls gateway reachability until success or deadline. */
async function waitForGatewayReachable(params) {
	const deadlineMs = params.deadlineMs ?? 15e3;
	const pollMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(params.pollMs ?? 400, 400, 0);
	const probeTimeoutMs = params.probeTimeoutMs ?? 1500;
	const startedAt = Date.now();
	let lastDetail;
	while (Date.now() - startedAt < deadlineMs) {
		const probe = await probeGatewayReachable({
			url: params.url,
			token: params.token,
			password: params.password,
			timeoutMs: probeTimeoutMs
		});
		if (probe.ok) return probe;
		lastDetail = probe.detail;
		const remainingMs = deadlineMs - (Date.now() - startedAt);
		if (remainingMs <= 0) break;
		await require_sleep.sleep(Math.min(pollMs, remainingMs));
	}
	return {
		ok: false,
		detail: lastDetail
	};
}
function summarizeError(err) {
	let raw = "unknown error";
	if (err instanceof Error) raw = err.message || raw;
	else if (typeof err === "string") raw = err || raw;
	else if (err !== void 0) raw = (0, node_util.inspect)(err, { depth: 2 });
	const line = raw.split("\n").map((s) => s.trim()).find(Boolean) ?? raw;
	return line.length > 120 ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(line, 119)}…` : line;
}
const testing = { summarizeError };
/** Default workspace path shown by onboarding prompts. */
const DEFAULT_WORKSPACE = require_agent_scope_config.DEFAULT_AGENT_WORKSPACE_DIR;
//#endregion
exports.DEFAULT_WORKSPACE = DEFAULT_WORKSPACE;
exports.applyWizardMetadata = applyWizardMetadata;
exports.detectBinary = require_detect_binary.detectBinary;
exports.detectBrowserOpenSupport = require_browser_open.detectBrowserOpenSupport;
exports.ensureWorkspaceAndSessions = ensureWorkspaceAndSessions;
exports.formatControlUiSshHint = formatControlUiSshHint;
exports.guardCancel = guardCancel;
exports.handleReset = handleReset;
exports.moveToTrash = moveToTrash;
exports.normalizeGatewayTokenInput = normalizeGatewayTokenInput;
exports.openUrl = require_browser_open.openUrl;
exports.printWizardHeader = printWizardHeader;
exports.probeGatewayConfiguredModel = probeGatewayConfiguredModel;
exports.probeGatewayReachable = probeGatewayReachable;
exports.randomToken = require_random_token.randomToken;
exports.resolveAdvertisedControlUiLinks = require_control_ui_links.resolveAdvertisedControlUiLinks;
exports.resolveBrowserOpenCommand = require_browser_open.resolveBrowserOpenCommand;
exports.resolveControlUiLinks = require_control_ui_links.resolveControlUiLinks;
exports.resolveLocalControlUiProbeLinks = require_control_ui_links.resolveLocalControlUiProbeLinks;
exports.summarizeExistingConfig = summarizeExistingConfig;
exports.testing = testing;
exports.validateGatewayPasswordInput = validateGatewayPasswordInput;
exports.waitForGatewayReachable = waitForGatewayReachable;
