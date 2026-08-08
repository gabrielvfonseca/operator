const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_windows_install_roots = require("./windows-install-roots-pUuZWNtA.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_windows_port_pids = require("./windows-port-pids-FzMQAPMX.cjs");
const require_restart_stale_pids = require("./restart-stale-pids-BPa4bniJ.cjs");
const require_paths = require("./paths-amwIgX1d.cjs");
const require_restart_intent = require("./restart-intent-DBizeEcf.cjs");
const require_restart_logs = require("./restart-logs-D6dsuNEi.cjs");
const require_schtasks = require("./schtasks-Db9a2k8h.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_crypto = require("node:crypto");
let node_child_process = require("node:child_process");
//#region src/infra/windows-task-restart.ts
const TASK_RESTART_RETRY_LIMIT = 12;
const TASK_RESTART_RETRY_DELAY_SEC = 1;
function quotePowerShellSingleQuotedLiteral(value) {
	return `'${value.replace(/'/g, "''")}'`;
}
function resolveWindowsTaskName(env) {
	const override = env.OPERATOR_WINDOWS_TASK_NAME?.trim();
	if (override) return override;
	return require_paths.resolveGatewayWindowsTaskName(env.OPERATOR_PROFILE);
}
function buildScheduledTaskRestartScript(params) {
	const { quotedLogPath, setupLines, taskName, taskScriptPath } = params;
	const quotedTaskName = require_windows_port_pids.quoteCmdScriptArg(taskName);
	const quotedQueryTaskStateCommand = require_windows_port_pids.quoteCmdScriptArg([
		`$task = Get-ScheduledTask -TaskName ${quotePowerShellSingleQuotedLiteral(taskName)} -ErrorAction SilentlyContinue`,
		"if ($null -ne $task -and $task.State -eq 'Running') { exit 0 }",
		"exit 1"
	].join("; "));
	const lines = [
		"@echo off",
		"setlocal",
		...setupLines,
		`>> ${quotedLogPath} 2>&1 echo [%DATE% %TIME%] operator restart attempt source=windows-task-handoff target=${quotedTaskName}`,
		`schtasks /Query /TN ${quotedTaskName} >> ${quotedLogPath} 2>&1`,
		"if errorlevel 1 goto fallback",
		"set /a attempts=0",
		":retry",
		`timeout /t ${TASK_RESTART_RETRY_DELAY_SEC} /nobreak >nul`,
		"set /a attempts+=1",
		`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ${quotedQueryTaskStateCommand} >nul 2>&1`,
		"if not errorlevel 1 goto cleanup",
		`schtasks /Run /TN ${quotedTaskName} >> ${quotedLogPath} 2>&1`,
		"if not errorlevel 1 goto cleanup",
		`if %attempts% GEQ ${TASK_RESTART_RETRY_LIMIT} goto fallback`,
		"goto retry",
		":fallback",
		`>> ${quotedLogPath} 2>&1 echo [%DATE% %TIME%] operator restart fallback source=windows-task-handoff`
	];
	if (taskScriptPath) {
		const quotedScript = require_windows_port_pids.quoteCmdScriptArg(taskScriptPath);
		const quotedCmd = require_windows_port_pids.quoteCmdScriptArg(require_windows_install_roots.getWindowsCmdExePath());
		lines.push(`if exist ${quotedScript} (`, `  start "" /min ${quotedCmd} /d /c ${quotedScript}`, ")");
	}
	lines.push(":cleanup", `>> ${quotedLogPath} 2>&1 echo [%DATE% %TIME%] operator restart finished source=windows-task-handoff`, "del \"%~f0\" >nul 2>&1");
	return lines.join("\r\n");
}
function relaunchGatewayScheduledTask(env = process.env) {
	const taskName = resolveWindowsTaskName(env);
	const taskScriptPath = require_schtasks.resolveTaskScriptPath(env);
	const scriptPath = node_path.default.join(require_tmp_operator_dir.resolvePreferredOperatorTmpDir(), `operator-schtasks-restart-${(0, node_crypto.randomUUID)()}.cmd`);
	const quotedScriptPath = require_windows_port_pids.quoteCmdScriptArg(scriptPath);
	const restartLog = require_restart_logs.renderCmdRestartLogSetup({
		...process.env,
		...env
	});
	try {
		node_fs.default.writeFileSync(scriptPath, require_schtasks.encodeWindowsLauncherScript({
			format: "cmd",
			content: `${buildScheduledTaskRestartScript({
				quotedLogPath: restartLog.quotedLogPath,
				setupLines: restartLog.lines,
				taskName,
				taskScriptPath
			})}\r\n`
		}));
		const cmdExePath = require_windows_install_roots.getWindowsCmdExePath();
		(0, node_child_process.spawn)(cmdExePath, [
			"/d",
			"/s",
			"/c",
			quotedScriptPath
		], {
			detached: true,
			stdio: "ignore",
			windowsHide: true
		}).unref();
		return {
			ok: true,
			method: "schtasks",
			tried: [`schtasks /Run /TN "${taskName}"`, `${cmdExePath} /d /s /c ${quotedScriptPath}`]
		};
	} catch (err) {
		try {
			node_fs.default.unlinkSync(scriptPath);
		} catch {}
		return {
			ok: false,
			method: "schtasks",
			detail: require_errors.formatErrorMessage(err),
			tried: [`schtasks /Run /TN "${taskName}"`]
		};
	}
}
//#endregion
//#region src/infra/restart.ts
const SPAWN_TIMEOUT_MS = 2e3;
const SIGUSR1_AUTH_GRACE_MS = 5e3;
const DEFAULT_DEFERRAL_POLL_MS = 500;
const DEFAULT_DEFERRAL_STILL_PENDING_WARN_MS = 3e4;
const DEFAULT_RESTART_DEFERRAL_TIMEOUT_MS = 3e5;
const RESTART_COOLDOWN_MS = 3e4;
const LAUNCHCTL_ALREADY_LOADED_EXIT_CODE = 37;
const restartLog = require_subsystem.createSubsystemLogger("restart");
let sigusr1AuthorizedCount = 0;
let sigusr1AuthorizedUntil = 0;
let preRestartCheck = null;
let restartCycleToken = 0;
let emittedRestartToken = 0;
let consumedRestartToken = 0;
let emittedRestartReason;
let emittedRestartIntent;
let lastRestartEmittedAt = 0;
let pendingRestartTimer = null;
let pendingRestartDueAt = 0;
let pendingRestartReason;
let pendingRestartEmitHooks;
let pendingRestartSessionKey;
let pendingRestartSkipDeferral = false;
let pendingRestartPreparing = false;
let pendingRestartSignalAdmission = null;
let restartTransientGeneration = 0;
const activeDeferralPolls = /* @__PURE__ */ new Set();
function shouldPreferRestartReason(next, current) {
	const isUpdateRestart = (reason) => reason === "update.run" || reason === "update.auto";
	return isUpdateRestart(next) && !isUpdateRestart(current);
}
function hasUnconsumedRestartSignal() {
	return emittedRestartToken > consumedRestartToken;
}
function clearPendingScheduledRestart() {
	if (pendingRestartTimer) clearTimeout(pendingRestartTimer);
	pendingRestartTimer = null;
	pendingRestartDueAt = 0;
	pendingRestartReason = void 0;
	pendingRestartEmitHooks = void 0;
	pendingRestartSessionKey = void 0;
	pendingRestartSkipDeferral = false;
	pendingRestartPreparing = false;
}
function clearPendingRestartSignalAdmission() {
	const lease = pendingRestartSignalAdmission;
	pendingRestartSignalAdmission = null;
	if (lease?.rollback()) return true;
	return require_gateway_work_admission.rollbackGatewayRestartSignalFence();
}
function armPendingRestartTimer(requestedDueAt, nowMs) {
	pendingRestartTimer = setTimeout(() => {
		const scheduledReason = pendingRestartReason;
		const scheduledSkipDeferral = pendingRestartSkipDeferral;
		pendingRestartTimer = null;
		pendingRestartDueAt = 0;
		pendingRestartReason = void 0;
		pendingRestartSkipDeferral = false;
		pendingRestartPreparing = true;
		const pendingCheck = preRestartCheck;
		if (scheduledSkipDeferral || !pendingCheck) {
			emitPreparedGatewayRestart(void 0, scheduledReason);
			return;
		}
		deferGatewayRestartUntilIdle({
			getPendingCount: pendingCheck,
			maxWaitMs: resolveGatewayRestartDeferralTimeoutMs(require_io.getRuntimeConfig().gateway?.reload?.deferralTimeoutMs),
			reason: scheduledReason,
			timeoutIntent: {
				force: true,
				...scheduledReason ? { reason: scheduledReason } : {}
			}
		});
	}, Math.max(0, requestedDueAt - nowMs));
}
function clearActiveDeferralPolls() {
	for (const poll of activeDeferralPolls) clearInterval(poll);
	activeDeferralPolls.clear();
}
function summarizeChangedPaths(paths, maxPaths = 6) {
	if (!Array.isArray(paths) || paths.length === 0) return null;
	if (paths.length <= maxPaths) return paths.join(",");
	return `${paths.slice(0, maxPaths).join(",")},+${paths.length - maxPaths} more`;
}
function formatRestartAudit(audit) {
	const actor = typeof audit?.actor === "string" && audit.actor.trim() ? audit.actor.trim() : null;
	const deviceId = typeof audit?.deviceId === "string" && audit.deviceId.trim() ? audit.deviceId.trim() : null;
	const clientIp = typeof audit?.clientIp === "string" && audit.clientIp.trim() ? audit.clientIp.trim() : null;
	const changed = summarizeChangedPaths(audit?.changedPaths);
	const fields = [];
	if (actor) fields.push(`actor=${actor}`);
	if (deviceId) fields.push(`device=${deviceId}`);
	if (clientIp) fields.push(`ip=${clientIp}`);
	if (changed) fields.push(`changedPaths=${changed}`);
	return fields.length > 0 ? fields.join(" ") : "actor=<unknown>";
}
/**
* Register a callback that scheduleGatewaySigusr1Restart checks before emitting SIGUSR1.
* The callback should return the number of pending items (0 = safe to restart).
*/
function setPreRestartDeferralCheck(fn) {
	preRestartCheck = fn;
}
/**
* Emit an authorized SIGUSR1 gateway restart, guarded against duplicate emissions.
* Returns true if SIGUSR1 was emitted, false if a restart was already emitted.
* Runtime callers use emitGatewayRestartWithSignalAdmission so the signal-to-drain
* handoff stays fenced; this lower-level primitive remains available to tests.
*/
function emitGatewayRestart(reasonOverride, intent) {
	if (hasUnconsumedRestartSignal()) {
		clearActiveDeferralPolls();
		clearPendingScheduledRestart();
		return false;
	}
	clearActiveDeferralPolls();
	clearPendingScheduledRestart();
	emittedRestartToken = ++restartCycleToken;
	emittedRestartReason = reasonOverride ?? intent?.reason ?? pendingRestartReason;
	emittedRestartIntent = intent;
	authorizeGatewaySigusr1Restart();
	try {
		if (process.listenerCount("SIGUSR1") > 0) process.emit("SIGUSR1");
		else if (process.platform === "win32") {
			if (!triggerOperatorRestart().ok) {
				rollBackGatewayRestartEmission();
				restartLog.warn("Windows scheduled task restart failed, token rolled back");
				return false;
			}
			consumeGatewaySigusr1RestartAuthorization();
			markGatewaySigusr1RestartHandled();
		} else process.kill(process.pid, "SIGUSR1");
	} catch {
		rollBackGatewayRestartEmission();
		return false;
	}
	lastRestartEmittedAt = Date.now();
	return true;
}
/**
* Emits while holding the signal-to-drain admission fence.
*
* The caller must already own root-work admission. Scheduled restarts use the
* independent-root wrapper below; config reloads run inside their reload root.
*/
function emitGatewayRestartWithSignalAdmission(reasonOverride, intent) {
	let signalAdmission = pendingRestartSignalAdmission;
	if (!signalAdmission) {
		if (!hasUnconsumedRestartSignal()) require_gateway_work_admission.rollbackGatewayRestartSignalFence();
		signalAdmission = require_gateway_work_admission.beginGatewayRestartSignalAdmission();
		if (!signalAdmission) return false;
		pendingRestartSignalAdmission = signalAdmission;
	}
	const hadUnconsumedRestartSignal = hasUnconsumedRestartSignal();
	const emitted = emitGatewayRestart(reasonOverride, intent);
	if (!emitted && !hadUnconsumedRestartSignal) clearPendingRestartSignalAdmission();
	return emitted;
}
/** Closed restart result for owners that must distinguish coalescing from delivery failure. */
function requestGatewayRestartWithSignalAdmission(reasonOverride, intent) {
	const hadUnconsumedRestartSignal = hasUnconsumedRestartSignal();
	if (emitGatewayRestartWithSignalAdmission(reasonOverride, intent)) return { status: "emitted" };
	return { status: hadUnconsumedRestartSignal ? "coalesced" : "failed" };
}
function resetSigusr1AuthorizationIfExpired(now = Date.now()) {
	if (sigusr1AuthorizedCount <= 0) return;
	if (now <= sigusr1AuthorizedUntil) return;
	sigusr1AuthorizedCount = 0;
	sigusr1AuthorizedUntil = 0;
}
function setGatewaySigusr1RestartPolicy(opts) {
	opts?.allowExternal;
}
function authorizeGatewaySigusr1Restart(delayMs = 0) {
	const delay = Math.max(0, Math.floor(delayMs));
	const expiresAt = Date.now() + delay + SIGUSR1_AUTH_GRACE_MS;
	sigusr1AuthorizedCount += 1;
	if (expiresAt > sigusr1AuthorizedUntil) sigusr1AuthorizedUntil = expiresAt;
}
function consumeGatewaySigusr1RestartAuthorization() {
	resetSigusr1AuthorizationIfExpired();
	if (sigusr1AuthorizedCount <= 0) return false;
	sigusr1AuthorizedCount -= 1;
	if (sigusr1AuthorizedCount <= 0) sigusr1AuthorizedUntil = 0;
	return true;
}
/**
* Mark the currently emitted SIGUSR1 restart cycle as consumed by the run loop.
* This explicitly advances the cycle state instead of resetting emit guards inside
* consumeGatewaySigusr1RestartAuthorization().
*/
function markGatewaySigusr1RestartHandled() {
	if (hasUnconsumedRestartSignal()) {
		consumedRestartToken = emittedRestartToken;
		emittedRestartReason = void 0;
		emittedRestartIntent = void 0;
	}
	clearPendingRestartSignalAdmission();
}
function rollBackGatewayRestartEmission() {
	emittedRestartToken = consumedRestartToken;
	emittedRestartReason = void 0;
	emittedRestartIntent = void 0;
	consumeGatewaySigusr1RestartAuthorization();
}
function resolveGatewayRestartDeferralTimeoutMs(timeoutMs) {
	if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs)) return DEFAULT_RESTART_DEFERRAL_TIMEOUT_MS;
	if (timeoutMs <= 0) return;
	return Math.floor(timeoutMs);
}
function canReplacePendingRestartEmitHooks(hooks, sessionKey) {
	if (!hooks) return true;
	return pendingRestartSessionKey === void 0 || pendingRestartSessionKey === sessionKey;
}
function updatePendingRestartEmitHooks(hooks, sessionKey) {
	if (!canReplacePendingRestartEmitHooks(hooks, sessionKey)) return false;
	if (!hooks) return false;
	pendingRestartEmitHooks = hooks;
	if (sessionKey !== void 0) pendingRestartSessionKey = sessionKey;
	return true;
}
async function rejectPreparedRestartHook(hooks) {
	try {
		await hooks?.afterEmitRejected?.();
	} catch {}
}
async function rejectPreparedRestartHooks(hooksList) {
	for (const hooks of hooksList) await rejectPreparedRestartHook(hooks);
}
async function emitPreparedGatewayRestartUnderAdmission(hooks, reasonOverride, intent, transientGeneration = restartTransientGeneration, canEmit = () => true) {
	const isCurrent = () => transientGeneration === restartTransientGeneration && canEmit();
	if (!isCurrent()) return null;
	let callerPrepared = false;
	if (hooks) {
		try {
			await hooks.beforeEmit?.();
			callerPrepared = true;
		} catch (err) {
			restartLog.warn(`restart preparation failed; restart will continue without it: ${String(err)}`);
		}
		if (!isCurrent()) {
			if (callerPrepared) await rejectPreparedRestartHook(hooks);
			return null;
		}
	}
	let nextParked = pendingRestartEmitHooks;
	pendingRestartEmitHooks = void 0;
	let preparedParked;
	const rejectCallerOnBail = async () => {
		if (hooks && callerPrepared) await rejectPreparedRestartHook(hooks);
	};
	while (nextParked) {
		if (preparedParked) {
			await rejectPreparedRestartHook(preparedParked);
			preparedParked = void 0;
			if (!isCurrent()) {
				await rejectCallerOnBail();
				return null;
			}
		}
		try {
			await nextParked.beforeEmit?.();
			preparedParked = nextParked;
		} catch (err) {
			restartLog.warn(`restart preparation failed; restart will continue without it: ${String(err)}`);
		}
		if (!isCurrent()) {
			await rejectPreparedRestartHook(preparedParked);
			await rejectCallerOnBail();
			return null;
		}
		nextParked = pendingRestartEmitHooks;
		pendingRestartEmitHooks = void 0;
	}
	pendingRestartSessionKey = void 0;
	const preparedHooksList = [];
	if (preparedParked) preparedHooksList.push(preparedParked);
	if (hooks && callerPrepared) preparedHooksList.push(hooks);
	const emitOwner = hooks ? callerPrepared ? hooks : void 0 : preparedParked;
	if (!isCurrent()) {
		await rejectPreparedRestartHooks(preparedHooksList);
		return null;
	}
	const preferredReason = shouldPreferRestartReason(pendingRestartReason, reasonOverride) ? pendingRestartReason : void 0;
	const resolvedReason = preferredReason ?? reasonOverride;
	const resolvedIntent = preferredReason && intent ? {
		...intent,
		reason: preferredReason
	} : intent;
	const emitResult = emitOwner?.emitRestart ? emitOwner.emitRestart(resolvedReason, resolvedIntent) : requestGatewayRestartWithSignalAdmission(resolvedReason, resolvedIntent);
	if (emitResult.status !== "emitted") await rejectPreparedRestartHooks(preparedHooksList);
	if (emitResult.status === "failed") for (const prepared of preparedHooksList) try {
		await prepared.afterEmitFailed?.();
	} catch {}
	return emitResult;
}
async function emitPreparedGatewayRestart(hooks, reasonOverride, intent, finalIdleCheck, setFenceRollback) {
	const transientGeneration = restartTransientGeneration;
	try {
		return await require_gateway_work_admission.runWithGatewayIndependentRootWorkAdmission(async () => {
			if (hasUnconsumedRestartSignal()) return false;
			let signalAdmission = pendingRestartSignalAdmission;
			let ownsFenceLease = false;
			if (!signalAdmission) {
				require_gateway_work_admission.rollbackGatewayRestartSignalFence();
				signalAdmission = require_gateway_work_admission.beginGatewayRestartSignalAdmission();
				if (!signalAdmission) return false;
				pendingRestartSignalAdmission = signalAdmission;
				ownsFenceLease = true;
			}
			let fenceActive = true;
			let keepFenceForRunLoop = false;
			const rollbackFence = () => {
				if (keepFenceForRunLoop || hasUnconsumedRestartSignal()) return;
				if (!ownsFenceLease) {
					fenceActive = false;
					return;
				}
				fenceActive = false;
				signalAdmission.rollback();
				if (pendingRestartSignalAdmission === signalAdmission) pendingRestartSignalAdmission = null;
			};
			setFenceRollback?.(rollbackFence);
			try {
				if (!(finalIdleCheck ? finalIdleCheck() && require_gateway_work_admission.getActiveGatewayRootWorkCount({ excludeCurrent: true }) === 0 : true)) return false;
				const emitResult = await emitPreparedGatewayRestartUnderAdmission(hooks, reasonOverride, intent, transientGeneration, () => fenceActive);
				if (emitResult && (emitResult.status === "emitted" || emitResult.status === "coalesced" && hasUnconsumedRestartSignal())) {
					keepFenceForRunLoop = true;
					return true;
				}
				return emitResult !== null;
			} finally {
				if (!keepFenceForRunLoop) rollbackFence();
				setFenceRollback?.(null);
			}
		});
	} catch (err) {
		if (!require_gateway_work_admission.isGatewayRestartDraining()) throw err;
		return true;
	}
}
/**
* Poll pending work until it drains, then emit one restart signal.
* A positive maxWaitMs keeps the old capped behavior for explicit configs.
* Shared by both the direct RPC restart path and the config watcher path.
*/
function deferGatewayRestartUntilIdle(opts) {
	const pollMs = (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(opts.pollMs, DEFAULT_DEFERRAL_POLL_MS, 10);
	const maxWaitMs = typeof opts.maxWaitMs === "number" && Number.isFinite(opts.maxWaitMs) && opts.maxWaitMs > 0 ? Math.max(pollMs, Math.floor(opts.maxWaitMs)) : void 0;
	let cancelled = false;
	let attemptingEmission = false;
	let cancelEmissionFence = null;
	let poll = null;
	const stopPoll = () => {
		if (!poll) return;
		clearInterval(poll);
		activeDeferralPolls.delete(poll);
		poll = null;
	};
	const cancel = () => {
		cancelled = true;
		cancelEmissionFence?.();
		cancelEmissionFence = null;
		stopPoll();
	};
	const handle = { cancel };
	const startedAt = Date.now();
	let nextStillPendingAt = startedAt + DEFAULT_DEFERRAL_STILL_PENDING_WARN_MS;
	const attemptEmission = (params) => {
		if (cancelled || attemptingEmission) return;
		attemptingEmission = true;
		emitPreparedGatewayRestart(opts.emitHooks, opts.reason, params.intent, params.skipIdleCheck ? void 0 : () => opts.getPendingCount() <= 0, (rollback) => {
			cancelEmissionFence = rollback;
		}).then((attempted) => {
			attemptingEmission = false;
			cancelEmissionFence = null;
			if (cancelled || !attempted) return;
			stopPoll();
			if (params.notifyReady) opts.hooks?.onReady?.();
		}).catch((err) => {
			attemptingEmission = false;
			cancelEmissionFence?.();
			cancelEmissionFence = null;
			stopPoll();
			opts.hooks?.onCheckError?.(err);
			emitPreparedGatewayRestart(opts.emitHooks, opts.reason, params.intent);
		});
	};
	const inspectPending = () => {
		if (cancelled) return;
		let current;
		try {
			current = opts.getPendingCount();
		} catch (err) {
			stopPoll();
			opts.hooks?.onCheckError?.(err);
			emitPreparedGatewayRestart(opts.emitHooks, opts.reason);
			return;
		}
		if (current <= 0) {
			attemptEmission({ notifyReady: true });
			return;
		}
		const elapsedMs = Date.now() - startedAt;
		if (Date.now() >= nextStillPendingAt) {
			opts.hooks?.onStillPending?.(current, elapsedMs);
			nextStillPendingAt = Date.now() + DEFAULT_DEFERRAL_STILL_PENDING_WARN_MS;
		}
		if (maxWaitMs !== void 0 && elapsedMs >= maxWaitMs) {
			stopPoll();
			opts.hooks?.onTimeout?.(current, elapsedMs);
			attemptEmission({
				intent: opts.timeoutIntent,
				notifyReady: false,
				skipIdleCheck: true
			});
		}
	};
	let pending;
	try {
		pending = opts.getPendingCount();
	} catch (err) {
		opts.hooks?.onCheckError?.(err);
		emitPreparedGatewayRestart(opts.emitHooks, opts.reason);
		return handle;
	}
	if (pending > 0) opts.hooks?.onDeferring?.(pending);
	poll = setInterval(inspectPending, pollMs);
	activeDeferralPolls.add(poll);
	if (pending <= 0) attemptEmission({ notifyReady: true });
	return handle;
}
function formatSpawnDetail(result) {
	const clean = (value) => {
		return (typeof value === "string" ? value : value ? value.toString() : "").replace(/\s+/g, " ").trim();
	};
	if (result.error) {
		if (result.error instanceof Error) return result.error.message;
		if (typeof result.error === "string") return result.error;
		try {
			return JSON.stringify(result.error);
		} catch {
			return "unknown error";
		}
	}
	const stderr = clean(result.stderr);
	if (stderr) return stderr;
	const stdout = clean(result.stdout);
	if (stdout) return stdout;
	if (typeof result.status === "number") return `exit ${result.status}`;
	return "unknown error";
}
function normalizeSystemdUnit(raw, profile) {
	const unit = raw?.trim();
	if (!unit) return `${require_paths.resolveGatewaySystemdServiceName(profile)}.service`;
	return unit.endsWith(".service") ? unit : `${unit}.service`;
}
function triggerOperatorRestart() {
	if (process.env.VITEST || false) return {
		ok: true,
		method: "supervisor",
		detail: "test mode"
	};
	require_restart_stale_pids.cleanStaleGatewayProcessesSync();
	const tried = [];
	if (process.platform === "linux") {
		const unit = normalizeSystemdUnit(process.env.OPERATOR_SYSTEMD_UNIT, process.env.OPERATOR_PROFILE);
		const userArgs = [
			"--user",
			"restart",
			unit
		];
		tried.push(`systemctl ${userArgs.join(" ")}`);
		const userRestart = (0, node_child_process.spawnSync)("systemctl", userArgs, {
			encoding: "utf8",
			timeout: SPAWN_TIMEOUT_MS
		});
		if (!userRestart.error && userRestart.status === 0) return {
			ok: true,
			method: "systemd",
			tried
		};
		const systemArgs = ["restart", unit];
		tried.push(`systemctl ${systemArgs.join(" ")}`);
		const systemRestart = (0, node_child_process.spawnSync)("systemctl", systemArgs, {
			encoding: "utf8",
			timeout: SPAWN_TIMEOUT_MS
		});
		if (!systemRestart.error && systemRestart.status === 0) return {
			ok: true,
			method: "systemd",
			tried
		};
		return {
			ok: false,
			method: "systemd",
			detail: [`user: ${formatSpawnDetail(userRestart)}`, `system: ${formatSpawnDetail(systemRestart)}`].join("; "),
			tried
		};
	}
	if (process.platform === "win32") return relaunchGatewayScheduledTask(process.env);
	if (process.platform !== "darwin") return {
		ok: false,
		method: "supervisor",
		detail: "unsupported platform restart"
	};
	const label = process.env.OPERATOR_LAUNCHD_LABEL || require_paths.resolveGatewayLaunchAgentLabel(process.env.OPERATOR_PROFILE);
	const uid = typeof process.getuid === "function" ? process.getuid() : void 0;
	const domain = uid !== void 0 ? `gui/${uid}` : "gui/501";
	const target = `${domain}/${label}`;
	const args = [
		"kickstart",
		"-k",
		target
	];
	tried.push(`launchctl ${args.join(" ")}`);
	const res = (0, node_child_process.spawnSync)("launchctl", args, {
		encoding: "utf8",
		timeout: SPAWN_TIMEOUT_MS
	});
	if (!res.error && res.status === 0) return {
		ok: true,
		method: "launchctl",
		tried
	};
	const home = process.env.HOME?.trim() || node_os.default.homedir();
	const bootstrapArgs = [
		"bootstrap",
		domain,
		node_path.default.join(home, "Library", "LaunchAgents", `${label}.plist`)
	];
	tried.push(`launchctl ${bootstrapArgs.join(" ")}`);
	const boot = (0, node_child_process.spawnSync)("launchctl", bootstrapArgs, {
		encoding: "utf8",
		timeout: SPAWN_TIMEOUT_MS
	});
	if (boot.error || boot.status !== 0 && boot.status !== LAUNCHCTL_ALREADY_LOADED_EXIT_CODE && boot.status !== null) return {
		ok: false,
		method: "launchctl",
		detail: formatSpawnDetail(boot),
		tried
	};
	if (boot.status === 0) return {
		ok: true,
		method: "launchctl",
		tried
	};
	const retryArgs = ["kickstart", target];
	tried.push(`launchctl ${retryArgs.join(" ")}`);
	const retry = (0, node_child_process.spawnSync)("launchctl", retryArgs, {
		encoding: "utf8",
		timeout: SPAWN_TIMEOUT_MS
	});
	if (!retry.error && retry.status === 0) return {
		ok: true,
		method: "launchctl",
		tried
	};
	return {
		ok: false,
		method: "launchctl",
		detail: formatSpawnDetail(retry),
		tried
	};
}
function scheduleGatewaySigusr1Restart(opts) {
	const delayMsRaw = typeof opts?.delayMs === "number" && Number.isFinite(opts.delayMs) ? Math.floor(opts.delayMs) : 2e3;
	const delayMs = Math.min(Math.max(delayMsRaw, 0), 6e4);
	const reason = require_restart_intent.normalizeRestartIntentReason(opts?.reason);
	const mode = process.listenerCount("SIGUSR1") > 0 ? "emit" : process.platform === "win32" ? "supervisor" : "signal";
	const nowMs = Date.now();
	const cooldownMsApplied = opts?.skipCooldown === true ? 0 : Math.max(0, lastRestartEmittedAt + RESTART_COOLDOWN_MS - nowMs);
	const requestedDueAt = nowMs + delayMs + cooldownMsApplied;
	const skipDeferral = opts?.skipDeferral === true;
	let nextPendingEmitHooks = opts?.emitHooks;
	let nextPendingSessionKey = opts?.sessionKey;
	if (hasUnconsumedRestartSignal()) {
		if (shouldPreferRestartReason(reason, emittedRestartReason)) {
			emittedRestartReason = reason;
			if (emittedRestartIntent) emittedRestartIntent = {
				...emittedRestartIntent,
				reason
			};
		}
		restartLog.warn(`restart request coalesced (already in-flight) reason=${reason ?? "unspecified"} ${formatRestartAudit(opts?.audit)}`);
		return {
			ok: true,
			pid: process.pid,
			signal: "SIGUSR1",
			delayMs: 0,
			reason,
			mode,
			coalesced: true,
			cooldownMsApplied,
			emitHooksQueued: false
		};
	}
	if (pendingRestartTimer || pendingRestartPreparing) {
		const remainingMs = pendingRestartPreparing ? 0 : Math.max(0, pendingRestartDueAt - nowMs);
		if (pendingRestartPreparing && skipDeferral && activeDeferralPolls.size > 0) {
			restartLog.warn(`restart request bypassed active deferral reason=${reason ?? "unspecified"} pendingReason=${pendingRestartReason ?? "unspecified"} ${formatRestartAudit(opts?.audit)}`);
			clearActiveDeferralPolls();
			pendingRestartReason = reason;
			if (!(opts?.preservePendingEmitHooksOnDeferralBypass === true && opts?.emitHooks === void 0 && pendingRestartSessionKey !== void 0)) {
				pendingRestartEmitHooks = opts?.emitHooks;
				pendingRestartSessionKey = opts?.sessionKey;
			}
			emitPreparedGatewayRestart(void 0, reason);
			return {
				ok: true,
				pid: process.pid,
				signal: "SIGUSR1",
				delayMs: 0,
				reason,
				mode,
				coalesced: false,
				cooldownMsApplied,
				emitHooksQueued: opts?.emitHooks !== void 0
			};
		}
		if (!pendingRestartPreparing && (requestedDueAt < pendingRestartDueAt || skipDeferral && !pendingRestartSkipDeferral)) {
			const preservePendingHooks = opts?.preservePendingEmitHooksOnDeferralBypass === true && opts?.emitHooks === void 0 && pendingRestartSessionKey !== void 0;
			if (!preservePendingHooks && !canReplacePendingRestartEmitHooks(opts?.emitHooks, opts?.sessionKey)) {
				restartLog.warn(`restart continuation dropped: another session owns the pending restart (callerSessionKey=${opts?.sessionKey ?? "unspecified"} pendingSessionKey=${pendingRestartSessionKey ?? "unspecified"})`);
				if (pendingRestartTimer) clearTimeout(pendingRestartTimer);
				pendingRestartTimer = null;
				pendingRestartDueAt = requestedDueAt;
				pendingRestartReason = reason;
				pendingRestartSkipDeferral = pendingRestartSkipDeferral || skipDeferral;
				armPendingRestartTimer(requestedDueAt, nowMs);
				return {
					ok: true,
					pid: process.pid,
					signal: "SIGUSR1",
					delayMs: Math.max(0, requestedDueAt - nowMs),
					reason,
					mode,
					coalesced: true,
					cooldownMsApplied,
					emitHooksQueued: false
				};
			}
			const preservedEmitHooks = preservePendingHooks ? pendingRestartEmitHooks : void 0;
			const preservedSessionKey = preservePendingHooks ? pendingRestartSessionKey : void 0;
			restartLog.warn(`restart request rescheduled earlier reason=${reason ?? "unspecified"} pendingReason=${pendingRestartReason ?? "unspecified"} oldDelayMs=${remainingMs} newDelayMs=${Math.max(0, requestedDueAt - nowMs)} ${formatRestartAudit(opts?.audit)}`);
			clearPendingScheduledRestart();
			if (preservePendingHooks) {
				nextPendingEmitHooks = preservedEmitHooks;
				nextPendingSessionKey = preservedSessionKey;
			}
		} else {
			if (shouldPreferRestartReason(reason, pendingRestartReason)) pendingRestartReason = reason;
			pendingRestartSkipDeferral = pendingRestartSkipDeferral || skipDeferral;
			restartLog.warn(`restart request coalesced (already scheduled) reason=${reason ?? "unspecified"} pendingReason=${pendingRestartReason ?? "unspecified"} delayMs=${remainingMs} ${formatRestartAudit(opts?.audit)}`);
			const emitHooksQueued = updatePendingRestartEmitHooks(opts?.emitHooks, opts?.sessionKey);
			if (opts?.emitHooks && !emitHooksQueued) restartLog.warn(`restart continuation dropped: another session owns the pending restart (callerSessionKey=${opts.sessionKey ?? "unspecified"} pendingSessionKey=${pendingRestartSessionKey ?? "unspecified"})`);
			return {
				ok: true,
				pid: process.pid,
				signal: "SIGUSR1",
				delayMs: remainingMs,
				reason,
				mode,
				coalesced: true,
				cooldownMsApplied,
				emitHooksQueued
			};
		}
	}
	pendingRestartDueAt = requestedDueAt;
	pendingRestartReason = reason;
	pendingRestartEmitHooks = nextPendingEmitHooks;
	pendingRestartSessionKey = nextPendingSessionKey;
	pendingRestartSkipDeferral = skipDeferral;
	armPendingRestartTimer(requestedDueAt, nowMs);
	return {
		ok: true,
		pid: process.pid,
		signal: "SIGUSR1",
		delayMs: Math.max(0, requestedDueAt - nowMs),
		reason,
		mode,
		coalesced: false,
		cooldownMsApplied,
		emitHooksQueued: opts?.emitHooks !== void 0
	};
}
//#endregion
Object.defineProperty(exports, "deferGatewayRestartUntilIdle", {
	enumerable: true,
	get: function() {
		return deferGatewayRestartUntilIdle;
	}
});
Object.defineProperty(exports, "resolveGatewayRestartDeferralTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolveGatewayRestartDeferralTimeoutMs;
	}
});
Object.defineProperty(exports, "scheduleGatewaySigusr1Restart", {
	enumerable: true,
	get: function() {
		return scheduleGatewaySigusr1Restart;
	}
});
Object.defineProperty(exports, "setGatewaySigusr1RestartPolicy", {
	enumerable: true,
	get: function() {
		return setGatewaySigusr1RestartPolicy;
	}
});
Object.defineProperty(exports, "setPreRestartDeferralCheck", {
	enumerable: true,
	get: function() {
		return setPreRestartDeferralCheck;
	}
});
Object.defineProperty(exports, "triggerOperatorRestart", {
	enumerable: true,
	get: function() {
		return triggerOperatorRestart;
	}
});
