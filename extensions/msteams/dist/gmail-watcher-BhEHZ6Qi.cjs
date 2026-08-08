const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_executable_path = require("./executable-path-BHxqQqcc.cjs");
const require_windows_command = require("./windows-command-C8d7D1FM.cjs");
require("./config-DT0qiglW.cjs");
const require_config_eval = require("./config-eval-fz8eE8a4.cjs");
require("./config-Dazx2uDq.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
require("node:crypto");
let node_child_process = require("node:child_process");
const DEFAULT_GMAIL_SERVE_PORT = 8788;
const DEFAULT_GMAIL_SERVE_PATH = "/gmail-pubsub";
const DEFAULT_GMAIL_MAX_BYTES = 2e4;
const DEFAULT_HOOKS_PATH = "/hooks";
const GMAIL_WATCH_SENSITIVE_FLAGS = /* @__PURE__ */ new Set([
	"--token",
	"--hook-url",
	"--hook-token"
]);
let gogBin;
function normalizeHooksPath(raw) {
	const base = raw?.trim() || DEFAULT_HOOKS_PATH;
	if (base === "/") return DEFAULT_HOOKS_PATH;
	return (base.startsWith("/") ? base : `/${base}`).replace(/\/+$/, "");
}
function normalizeServePath(raw) {
	const base = raw?.trim() || "/gmail-pubsub";
	if (base === "/") return "/";
	return (base.startsWith("/") ? base : `/${base}`).replace(/\/+$/, "");
}
function buildDefaultHookUrl(hooksPath, port = require_paths.DEFAULT_GATEWAY_PORT) {
	const basePath = normalizeHooksPath(hooksPath);
	return joinUrl(`http://127.0.0.1:${port}`, `${basePath}/gmail`);
}
function resolveGmailHookRuntimeConfig(cfg, overrides) {
	const hooks = cfg.hooks;
	const gmail = hooks?.gmail;
	const hookToken = overrides.hookToken ?? hooks?.token ?? "";
	if (!hookToken) return {
		ok: false,
		error: "hooks.token missing (needed for gmail hook)"
	};
	const account = overrides.account ?? gmail?.account ?? "";
	if (!account) return {
		ok: false,
		error: "gmail account required"
	};
	const topic = overrides.topic ?? gmail?.topic ?? "";
	if (!topic) return {
		ok: false,
		error: "gmail topic required"
	};
	const subscription = overrides.subscription ?? gmail?.subscription ?? "gog-gmail-watch-push";
	const pushToken = overrides.pushToken ?? gmail?.pushToken ?? "";
	if (!pushToken) return {
		ok: false,
		error: "gmail push token required"
	};
	const hookUrl = overrides.hookUrl ?? gmail?.hookUrl ?? buildDefaultHookUrl(hooks?.path, require_paths.resolveGatewayPort(cfg));
	const includeBody = overrides.includeBody ?? gmail?.includeBody ?? true;
	const maxBytesRaw = overrides.maxBytes ?? gmail?.maxBytes;
	const maxBytes = typeof maxBytesRaw === "number" && Number.isFinite(maxBytesRaw) && maxBytesRaw > 0 ? Math.floor(maxBytesRaw) : DEFAULT_GMAIL_MAX_BYTES;
	const renewEveryMinutesRaw = overrides.renewEveryMinutes ?? gmail?.renewEveryMinutes;
	const renewEveryMinutes = typeof renewEveryMinutesRaw === "number" && Number.isFinite(renewEveryMinutesRaw) && renewEveryMinutesRaw > 0 ? Math.floor(renewEveryMinutesRaw) : 720;
	const serveBind = overrides.serveBind ?? gmail?.serve?.bind ?? "127.0.0.1";
	const servePortRaw = overrides.servePort ?? gmail?.serve?.port;
	const servePort = typeof servePortRaw === "number" && Number.isFinite(servePortRaw) && servePortRaw > 0 ? Math.floor(servePortRaw) : DEFAULT_GMAIL_SERVE_PORT;
	const servePathRaw = overrides.servePath ?? gmail?.serve?.path;
	const normalizedServePathRaw = typeof servePathRaw === "string" && servePathRaw.trim().length > 0 ? normalizeServePath(servePathRaw) : DEFAULT_GMAIL_SERVE_PATH;
	const tailscaleTargetRaw = overrides.tailscaleTarget ?? gmail?.tailscale?.target;
	const tailscaleMode = overrides.tailscaleMode ?? gmail?.tailscale?.mode ?? "off";
	const tailscaleTarget = tailscaleMode !== "off" && typeof tailscaleTargetRaw === "string" && tailscaleTargetRaw.trim().length > 0 ? tailscaleTargetRaw.trim() : void 0;
	const servePath = normalizeServePath(tailscaleMode !== "off" && !tailscaleTarget ? "/" : normalizedServePathRaw);
	const tailscalePathRaw = overrides.tailscalePath ?? gmail?.tailscale?.path;
	const tailscalePath = normalizeServePath(tailscaleMode !== "off" ? tailscalePathRaw ?? normalizedServePathRaw : tailscalePathRaw ?? servePath);
	return {
		ok: true,
		value: {
			account,
			label: overrides.label ?? gmail?.label ?? "INBOX",
			topic,
			subscription,
			pushToken,
			hookToken,
			hookUrl,
			includeBody,
			maxBytes,
			renewEveryMinutes,
			serve: {
				bind: serveBind,
				port: servePort,
				path: servePath
			},
			tailscale: {
				mode: tailscaleMode,
				path: tailscalePath,
				target: tailscaleTarget
			}
		}
	};
}
function buildGogWatchStartArgs(cfg) {
	return [
		"gmail",
		"watch",
		"start",
		"--account",
		cfg.account,
		"--label",
		cfg.label,
		"--topic",
		cfg.topic
	];
}
function buildGogWatchServeArgs(cfg) {
	const args = [
		"gmail",
		"watch",
		"serve",
		"--account",
		cfg.account,
		"--bind",
		cfg.serve.bind,
		"--port",
		String(cfg.serve.port),
		"--path",
		cfg.serve.path,
		"--token",
		cfg.pushToken,
		"--hook-url",
		cfg.hookUrl,
		"--hook-token",
		cfg.hookToken
	];
	if (cfg.includeBody) args.push("--include-body");
	if (cfg.maxBytes > 0) args.push("--max-bytes", String(cfg.maxBytes));
	return args;
}
function buildGogWatchServeLogArgs(cfg) {
	return buildGogWatchServeArgs(cfg).filter((arg, index, args) => !GMAIL_WATCH_SENSITIVE_FLAGS.has(arg) && !GMAIL_WATCH_SENSITIVE_FLAGS.has(args[index - 1] ?? ""));
}
function resolveGogExecutable() {
	return gogBin ??= require_executable_path.resolveExecutable("gog");
}
function resolveGogServeInvocation(args) {
	const command = resolveGogExecutable();
	if (!require_windows_command.isWindowsBatchCommand(command)) return {
		command,
		args,
		windowsHide: process.platform === "win32" ? true : void 0
	};
	return {
		command: require_windows_command.resolveTrustedWindowsCmdExe(),
		args: [
			"/d",
			"/s",
			"/c",
			require_windows_command.buildWindowsCmdExeCommandLine(command, args)
		],
		windowsHide: true,
		windowsVerbatimArguments: true
	};
}
function joinUrl(base, pathLocal) {
	const url = new URL(base);
	url.pathname = `${url.pathname.replace(/\/+$/, "")}${pathLocal.startsWith("/") ? pathLocal : `/${pathLocal}`}`;
	return url.toString();
}
//#endregion
//#region src/hooks/gmail-setup-utils.ts
const MAX_OUTPUT_CHARS = 800;
function trimOutput(value) {
	const trimmed = value.trim();
	if (!trimmed) return "";
	if (trimmed.length <= MAX_OUTPUT_CHARS) return trimmed;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, MAX_OUTPUT_CHARS)}…`;
}
function formatCommandResultInternal(command, result, statusLabel) {
	const code = result.code ?? "null";
	const signal = result.signal ? `, signal=${result.signal}` : "";
	const killed = result.killed ? ", killed=true" : "";
	const stderr = trimOutput(result.stderr);
	const stdout = trimOutput(result.stdout);
	const lines = [`${command} ${statusLabel} (code=${code}${signal}${killed})`];
	if (stderr) lines.push(`stderr: ${stderr}`);
	if (stdout) lines.push(`stdout: ${stdout}`);
	return lines.join("\n");
}
function formatCommandFailure(command, result) {
	return formatCommandResultInternal(command, result, "failed");
}
function formatCommandResult(command, result) {
	return formatCommandResultInternal(command, result, "exited");
}
function formatJsonParseFailure(command, result, err) {
	return `${command} returned invalid JSON: ${require_errors.formatErrorMessage(err)}\n${formatCommandResult(command, result)}`;
}
function formatCommand(command, args) {
	return [command, ...args].join(" ");
}
async function ensureTailscaleEndpoint(params) {
	if (params.mode === "off") return "";
	const tailscaleBin = require_executable_path.resolveExecutable("tailscale");
	const statusArgs = ["status", "--json"];
	const statusCommand = formatCommand("tailscale", statusArgs);
	const status = await require_exec.runCommandWithTimeout([tailscaleBin, ...statusArgs], {
		timeoutMs: 3e4,
		signal: params.signal
	});
	if (status.code !== 0) throw new Error(formatCommandFailure(statusCommand, status));
	let parsed;
	try {
		parsed = JSON.parse(status.stdout);
	} catch (err) {
		throw new Error(formatJsonParseFailure(statusCommand, status, err), { cause: err });
	}
	const dnsName = parsed.Self?.DNSName?.replace(/\.$/, "");
	if (!dnsName) throw new Error("tailscale DNS name missing; run tailscale up");
	const target = typeof params.target === "string" && params.target.trim().length > 0 ? params.target.trim() : params.port ? String(params.port) : "";
	if (!target) throw new Error("tailscale target missing; set a port or target URL");
	const pathArg = normalizeServePath(params.path);
	const funnelArgs = [
		params.mode,
		"--bg",
		"--set-path",
		pathArg,
		"--yes",
		target
	];
	const funnelCommand = formatCommand("tailscale", funnelArgs);
	const funnelResult = await require_exec.runCommandWithTimeout([tailscaleBin, ...funnelArgs], {
		timeoutMs: 3e4,
		signal: params.signal
	});
	if (funnelResult.code !== 0) throw new Error(formatCommandFailure(funnelCommand, funnelResult));
	const baseUrl = `https://${dnsName}${pathArg}`;
	return params.token ? `${baseUrl}?token=${params.token}` : baseUrl;
}
//#endregion
//#region src/hooks/gmail-watcher-errors.ts
const ADDRESS_IN_USE_RE = /address already in use|EADDRINUSE/i;
/** Detect watcher startup failures caused by an occupied bind port. */
function isAddressInUseError(line) {
	return ADDRESS_IN_USE_RE.test(line);
}
//#endregion
//#region src/hooks/gmail-watcher.ts
/**
* Gmail Watcher Service
*
* Automatically starts `gog gmail watch serve` when the gateway starts,
* if hooks.gmail is configured with an account.
*/
const log = require_subsystem.createSubsystemLogger("gmail-watcher");
let watcherProcess = null;
let renewInterval = null;
let shuttingDown = false;
let currentConfig = null;
let respawnTimeout = null;
/**
* Check if gog binary is available
*/
function isGogAvailable() {
	return require_config_eval.hasBinary("gog");
}
/**
* Start the Gmail watch (registers with Gmail API)
*/
async function startGmailWatch(cfg, options = {}) {
	const args = [resolveGogExecutable(), ...buildGogWatchStartArgs(cfg)];
	try {
		const result = await require_exec.runCommandWithTimeout(args, {
			timeoutMs: 12e4,
			signal: options.signal
		});
		if (result.code !== 0) {
			const message = result.stderr || result.stdout || "gog watch start failed";
			log.error(`watch start failed: ${message}`);
			return false;
		}
		log.info(`watch started for ${cfg.account}`);
		return true;
	} catch (err) {
		log.error(`watch start error: ${String(err)}`);
		return false;
	}
}
/**
* Spawn the gog gmail watch serve process
*/
function spawnGogServe(cfg) {
	const args = buildGogWatchServeArgs(cfg);
	log.info(`starting gog ${buildGogWatchServeLogArgs(cfg).join(" ")}`);
	let addressInUse = false;
	const invocation = resolveGogServeInvocation(args);
	const child = (0, node_child_process.spawn)(invocation.command, invocation.args, {
		stdio: [
			"ignore",
			"pipe",
			"pipe"
		],
		detached: false,
		windowsHide: invocation.windowsHide,
		windowsVerbatimArguments: invocation.windowsVerbatimArguments
	});
	child.stdout?.on("error", (err) => {
		log.error(`gog stdout error: ${String(err)}`);
	});
	child.stdout?.on("data", (data) => {
		const line = data.toString().trim();
		if (line) log.info(`[gog] ${line}`);
	});
	child.stderr?.on("error", (err) => {
		log.error(`gog stderr error: ${String(err)}`);
	});
	child.stderr?.on("data", (data) => {
		const line = data.toString().trim();
		if (!line) return;
		if (isAddressInUseError(line)) addressInUse = true;
		log.warn(`[gog] ${line}`);
	});
	child.on("error", (err) => {
		log.error(`gog process error: ${String(err)}`);
	});
	child.on("exit", (code, signal) => {
		if (watcherProcess !== null && watcherProcess !== child) return;
		if (shuttingDown) return;
		if (addressInUse) {
			log.warn("gog serve failed to bind (address already in use); stopping restarts. Another watcher is likely running. Set OPERATOR_SKIP_GMAIL_WATCHER=1 or stop the other process.");
			watcherProcess = null;
			return;
		}
		log.warn(`gog exited (code=${code}, signal=${signal}); restarting in 5s`);
		watcherProcess = null;
		respawnTimeout = setTimeout(() => {
			respawnTimeout = null;
			if (shuttingDown || !currentConfig) return;
			watcherProcess = spawnGogServe(currentConfig);
		}, 5e3);
	});
	return child;
}
/**
* Send SIGTERM, escalate to SIGKILL after 3 s, and resolve on exit/close/error
* or a final 5 s timeout after SIGKILL so the caller never hangs.
*/
function settleProcess(proc) {
	return new Promise((resolve) => {
		let settled = false;
		const settle = () => {
			if (settled) return;
			settled = true;
			clearTimeout(escalation);
			clearTimeout(finalTimeout);
			resolve();
		};
		proc.on("exit", settle);
		proc.on("close", settle);
		proc.on("error", settle);
		proc.kill("SIGTERM");
		const escalation = setTimeout(() => {
			try {
				proc.kill("SIGKILL");
			} catch {}
		}, 3e3);
		const finalTimeout = setTimeout(() => {
			if (!settled) {
				log.warn("gog process did not exit after SIGKILL; giving up");
				settle();
			}
		}, 8e3);
	});
}
function cancelledGmailWatcherStart(expectedConfig) {
	if (currentConfig === expectedConfig) currentConfig = null;
	return {
		started: false,
		reason: "startup cancelled"
	};
}
function isGmailWatcherStartCancelled(options) {
	return options.signal?.aborted === true || options.isCancelled?.() === true;
}
function createGmailWatcherCancellation(options) {
	if (!options.signal && !options.isCancelled) return {
		dispose: () => {},
		isCancelled: () => false
	};
	const abortController = new AbortController();
	const abort = () => {
		if (!abortController.signal.aborted) abortController.abort();
	};
	const onAbort = () => abort();
	options.signal?.addEventListener("abort", onAbort, { once: true });
	let cancelPoll = null;
	if (options.isCancelled) {
		cancelPoll = setInterval(() => {
			if (options.isCancelled?.()) abort();
		}, 100);
		cancelPoll.unref?.();
	}
	if (isGmailWatcherStartCancelled(options)) abort();
	return {
		dispose: () => {
			if (cancelPoll) {
				clearInterval(cancelPoll);
				cancelPoll = null;
			}
			options.signal?.removeEventListener("abort", onAbort);
		},
		isCancelled: () => abortController.signal.aborted || isGmailWatcherStartCancelled(options),
		signal: abortController.signal
	};
}
/**
* Start the Gmail watcher service.
* Called automatically by the gateway if hooks.gmail is configured.
*/
async function startGmailWatcher(cfg, options = {}) {
	if (!cfg.hooks?.enabled) return {
		started: false,
		reason: "hooks not enabled"
	};
	if (!cfg.hooks?.gmail?.account) return {
		started: false,
		reason: "no gmail account configured"
	};
	if (!isGogAvailable()) return {
		started: false,
		reason: "gog binary not found"
	};
	const resolved = resolveGmailHookRuntimeConfig(cfg, {});
	if (!resolved.ok) return {
		started: false,
		reason: resolved.error
	};
	const runtimeConfig = resolved.value;
	if (isGmailWatcherStartCancelled(options)) return cancelledGmailWatcherStart(runtimeConfig);
	currentConfig = runtimeConfig;
	if (watcherProcess || renewInterval || respawnTimeout) {
		shuttingDown = true;
		if (respawnTimeout) {
			clearTimeout(respawnTimeout);
			respawnTimeout = null;
		}
		if (renewInterval) {
			clearInterval(renewInterval);
			renewInterval = null;
		}
		if (watcherProcess) {
			const oldProcess = watcherProcess;
			watcherProcess = null;
			await settleProcess(oldProcess);
			oldProcess.removeAllListeners();
		}
		shuttingDown = false;
	}
	if (runtimeConfig.tailscale.mode !== "off") {
		const cancellation = createGmailWatcherCancellation(options);
		try {
			await ensureTailscaleEndpoint({
				mode: runtimeConfig.tailscale.mode,
				path: runtimeConfig.tailscale.path,
				port: runtimeConfig.serve.port,
				signal: cancellation.signal,
				target: runtimeConfig.tailscale.target
			});
			log.info(`tailscale ${runtimeConfig.tailscale.mode} configured for port ${runtimeConfig.serve.port}`);
			if (cancellation.isCancelled()) return cancelledGmailWatcherStart(runtimeConfig);
		} catch (err) {
			if (cancellation.isCancelled()) return cancelledGmailWatcherStart(runtimeConfig);
			log.error(`tailscale setup failed: ${String(err)}`);
			return {
				started: false,
				reason: `tailscale setup failed: ${String(err)}`
			};
		} finally {
			cancellation.dispose();
		}
	}
	const cancellation = createGmailWatcherCancellation(options);
	const watchStarted = await startGmailWatch(runtimeConfig, { signal: cancellation.signal });
	cancellation.dispose();
	if (cancellation.isCancelled()) return cancelledGmailWatcherStart(runtimeConfig);
	if (!watchStarted) log.warn("gmail watch start failed, but continuing with serve");
	if (isGmailWatcherStartCancelled(options)) return cancelledGmailWatcherStart(runtimeConfig);
	shuttingDown = false;
	watcherProcess = spawnGogServe(runtimeConfig);
	const renewMs = runtimeConfig.renewEveryMinutes * 6e4;
	renewInterval = setInterval(() => {
		if (shuttingDown) return;
		startGmailWatch(runtimeConfig);
	}, renewMs);
	log.info(`gmail watcher started for ${runtimeConfig.account} (renew every ${runtimeConfig.renewEveryMinutes}m)`);
	return { started: true };
}
/**
* Stop the Gmail watcher service.
*/
async function stopGmailWatcher() {
	shuttingDown = true;
	if (respawnTimeout) {
		clearTimeout(respawnTimeout);
		respawnTimeout = null;
	}
	if (renewInterval) {
		clearInterval(renewInterval);
		renewInterval = null;
	}
	if (watcherProcess) {
		log.info("stopping gmail watcher");
		const proc = watcherProcess;
		watcherProcess = null;
		await settleProcess(proc);
	}
	currentConfig = null;
	log.info("gmail watcher stopped");
}
//#endregion
exports.startGmailWatcher = startGmailWatcher;
exports.stopGmailWatcher = stopGmailWatcher;
