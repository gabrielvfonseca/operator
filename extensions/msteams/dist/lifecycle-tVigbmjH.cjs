require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_commands_flags = require("./commands.flags-BZYis-vI.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
const require_host_env_security = require("./host-env-security-DTRiezH-.cjs");
const require_config_env_vars = require("./config-env-vars-Cp6sSeHJ.cjs");
const require_parse_duration = require("./parse-duration-Csu-f48Z.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_credential_planner = require("./credential-planner-DkEqYEWZ.cjs");
const require_credentials = require("./credentials-CNHX5M4G.cjs");
const require_gateway_processes = require("./gateway-processes-BGxt3ntJ.cjs");
const require_restart_intent = require("./restart-intent-DBizeEcf.cjs");
const require_config_recovery_hints = require("./config-recovery-hints-A_lub-Kc.cjs");
require("./error-format-IzEUBRNs.cjs");
const require_service = require("./service-BJLcDrM4.cjs");
const require_launchd = require("./launchd-dIaeSQPq.cjs");
const require_systemd = require("./systemd-BxVKNLOg.cjs");
const require_probe = require("./probe-DBcFqNwO.cjs");
const require_gateway_lock = require("./gateway-lock-CUpJMYSa.cjs");
const require_service_audit = require("./service-audit-cEQw0kNl.cjs");
const require_runtime_hints = require("./runtime-hints--ik248YA.cjs");
const require_auth_token_resolution = require("./auth-token-resolution-CC5kmaAu.cjs");
const require_shared = require("./shared-C1JZRdJs.cjs");
const require_restart_health = require("./restart-health-DXl230D5.cjs");
const require_program_args = require("./program-args-YjZGo5sC.cjs");
const require_daemon_runtime = require("./daemon-runtime-CITeCeC-.cjs");
const require_gateway_install_token = require("./gateway-install-token-DlQTHFzY.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/cli/daemon-cli/launchd-recovery.ts
const LAUNCH_AGENT_RECOVERY_MESSAGE = "Gateway LaunchAgent was installed but not loaded; re-bootstrapped launchd service.";
/** Re-bootstrap an installed but unloaded LaunchAgent after a daemon start/restart command. */
async function recoverInstalledLaunchAgent(params) {
	if (process.platform !== "darwin") return null;
	const env = params.env ?? process.env;
	if (!await require_launchd.launchAgentPlistExists(env).catch(() => false)) return null;
	const repaired = await require_launchd.repairLaunchAgentBootstrap({ env }).catch(() => ({
		ok: false,
		status: "bootstrap-failed"
	}));
	if (!repaired.ok) {
		if (repaired.status === "gui-session-unavailable") {
			const actionHint = params.result === "started" ? "operator gateway start" : "operator gateway restart";
			throw new Error(require_launchd.formatLaunchAgentGuiSessionError({
				detail: repaired.detail,
				domain: repaired.domain,
				actionHint
			}));
		}
		return null;
	}
	return {
		result: params.result,
		loaded: true,
		message: LAUNCH_AGENT_RECOVERY_MESSAGE
	};
}
//#endregion
//#region src/cli/daemon-cli/gateway-token-drift.ts
function authModeDisablesToken(mode) {
	return mode === "password" || mode === "none" || mode === "trusted-proxy";
}
function isPasswordFallbackActive(params) {
	const plan = require_credential_planner.createGatewayCredentialPlan({
		config: params.cfg,
		env: params.env
	});
	if (plan.authMode !== void 0) return false;
	return plan.passwordCanWin && !plan.tokenCanWin;
}
/** Resolve the expected Gateway token for service drift checks, or undefined when token auth is inactive. */
async function resolveGatewayTokenForDriftCheck(params) {
	const env = params.env ?? process.env;
	const mode = params.cfg.gateway?.auth?.mode;
	if (authModeDisablesToken(mode)) return;
	if (isPasswordFallbackActive({
		cfg: params.cfg,
		env
	})) return;
	const resolved = await require_auth_token_resolution.resolveGatewayAuthToken({
		cfg: params.cfg,
		env,
		envFallback: "never",
		unresolvedReasonStyle: "detailed"
	});
	if (resolved.token) return resolved.token;
	if (!resolved.secretRefConfigured) return;
	throw new require_credentials.GatewaySecretRefUnavailableError("gateway.auth.token");
}
//#endregion
//#region src/cli/daemon-cli/lifecycle-core.ts
async function maybeAugmentSystemdHints(hints) {
	if (process.platform !== "linux") return hints;
	if (await require_systemd.isSystemdUserServiceAvailable().catch(() => false)) return hints;
	return [...hints, ...require_runtime_hints.renderSystemdUnavailableHints({
		wsl: await require_undici_global_dispatcher.isWSL(),
		kind: "generic_unavailable"
	})];
}
function emitActionMessage(params) {
	params.emit(params.payload);
	if (!params.json && params.payload.message) require_runtime.defaultRuntime.log(params.payload.message);
}
function mergeWarnings(captured, reported) {
	const combined = [...captured, ...reported ?? []];
	return combined.length > 0 ? combined : void 0;
}
async function handleServiceNotLoaded(params) {
	const hints = require_shared.filterContainerGenericHints(await maybeAugmentSystemdHints(params.renderStartHints()));
	params.emit({
		ok: true,
		result: "not-loaded",
		message: `${params.serviceNoun} service ${params.service.notLoadedText}.`,
		hints,
		service: require_shared.buildDaemonServiceSnapshot(params.service, params.loaded)
	});
	if (!params.json) {
		require_runtime.defaultRuntime.log(`${params.serviceNoun} service ${params.service.notLoadedText}.`);
		for (const hint of hints) require_runtime.defaultRuntime.log(`Start with: ${hint}`);
	}
}
async function resolveServiceLoadedOrFail(params) {
	try {
		return await params.service.isLoaded({ env: process.env });
	} catch (err) {
		params.fail(`${params.serviceNoun} service check failed: ${String(err)}`);
		return null;
	}
}
function formatPluginPackagingRuntimeOutputRecoveryHints() {
	return require_config_recovery_hints.formatPluginPackagingRuntimeOutputRecoveryHint().split("\n");
}
async function getConfigActionPreflightFailure(action) {
	let snapshot;
	try {
		snapshot = await require_io.readConfigFileSnapshot();
		if (snapshot.exists && !snapshot.valid) return {
			message: snapshot.issues.length > 0 ? require_io.formatConfigIssueLines(snapshot.issues, "", { normalizeRoot: true }).join("\n") : "Unknown validation issue.",
			...require_io.isPluginPackagingRuntimeOutputInvalidConfigSnapshot(snapshot) ? { hints: formatPluginPackagingRuntimeOutputRecoveryHints() } : {}
		};
	} catch {
		return null;
	}
	const futureBlock = require_config_env_vars.resolveFutureConfigActionBlock({
		action,
		snapshot
	});
	if (futureBlock) return {
		message: futureBlock.message,
		hints: futureBlock.hints
	};
	return null;
}
async function runServiceStart(params) {
	const json = Boolean(params.opts?.json);
	const { stdout, warnings, emit, fail } = require_shared.createDaemonActionContext({
		action: "start",
		json
	});
	const warn = json ? (message) => warnings.push(message) : void 0;
	const loaded = await resolveServiceLoadedOrFail({
		serviceNoun: params.serviceNoun,
		service: params.service,
		fail
	});
	if (loaded === null) return;
	{
		const preflight = await getConfigActionPreflightFailure("start the gateway service");
		if (preflight) {
			fail(preflight.hints ? `${params.serviceNoun} start blocked: ${preflight.message}` : `${params.serviceNoun} aborted: config is invalid.\n${preflight.message}\n${require_config_recovery_hints.formatInvalidConfigRecoveryHint()}`, preflight.hints);
			return;
		}
	}
	if (!loaded) try {
		const handled = await params.onNotLoaded?.({
			json,
			stdout,
			warn,
			fail
		});
		if (handled) {
			emit({
				ok: true,
				result: handled.result,
				message: handled.message,
				warnings: mergeWarnings(warnings, handled.warnings),
				service: require_shared.buildDaemonServiceSnapshot(params.service, handled.loaded ?? false)
			});
			if (!json && handled.message) require_runtime.defaultRuntime.log(handled.message);
			return;
		}
	} catch (err) {
		const hints = params.renderStartHints();
		fail(`${params.serviceNoun} start failed: ${String(err)}`, hints);
		return;
	}
	try {
		const startResult = await require_service.startGatewayService(params.service, {
			env: process.env,
			stdout,
			warn
		}, params.expectedPort);
		if (startResult.outcome === "missing-install") {
			await handleServiceNotLoaded({
				serviceNoun: params.serviceNoun,
				service: params.service,
				loaded: startResult.state.loaded,
				renderStartHints: params.renderStartHints,
				json,
				emit
			});
			return;
		}
		if (startResult.outcome === "scheduled") {
			emitActionMessage({
				json,
				emit,
				payload: {
					ok: true,
					result: "scheduled",
					message: require_service.describeGatewayServiceRestart(params.serviceNoun, { outcome: "scheduled" }).message,
					service: require_shared.buildDaemonServiceSnapshot(params.service, startResult.state.loaded),
					warnings: warnings.length ? warnings : void 0
				}
			});
			return;
		}
		if (startResult.outcome === "repair-required") {
			try {
				const handled = await params.repairLoadedService?.({
					json,
					stdout,
					warn,
					fail,
					state: startResult.state,
					issues: startResult.issues
				});
				if (handled) {
					emit({
						ok: true,
						result: handled.result,
						message: handled.message,
						warnings: mergeWarnings(warnings, handled.warnings),
						service: require_shared.buildDaemonServiceSnapshot(params.service, handled.loaded ?? true)
					});
					if (!json && handled.message) require_runtime.defaultRuntime.log(handled.message);
					return;
				}
			} catch (err) {
				const hints = params.renderStartHints();
				fail(`${params.serviceNoun} repair failed: ${String(err)}`, hints);
				return;
			}
			fail(`${params.serviceNoun} service needs repair before it can start: ${startResult.issues.map((issue) => issue.message).join("; ")}`, [require_command_format.formatCliCommand("operator gateway install --force")]);
			return;
		}
		emit({
			ok: true,
			result: "started",
			service: require_shared.buildDaemonServiceSnapshot(params.service, startResult.state.loaded),
			warnings: warnings.length ? warnings : void 0
		});
	} catch (err) {
		const hints = params.renderStartHints();
		fail(`${params.serviceNoun} start failed: ${String(err)}`, hints);
	}
}
async function runServiceStop(params) {
	const json = Boolean(params.opts?.json);
	const { stdout, emit, fail } = require_shared.createDaemonActionContext({
		action: "stop",
		json
	});
	const loaded = await resolveServiceLoadedOrFail({
		serviceNoun: params.serviceNoun,
		service: params.service,
		fail
	});
	if (loaded === null) return;
	{
		const preflight = await getConfigActionPreflightFailure("stop the gateway service");
		if (preflight) {
			fail(`${params.serviceNoun} stop blocked: ${preflight.message}`, preflight.hints);
			return;
		}
	}
	if (!loaded) {
		if (params.stopWhenNotLoaded) {
			try {
				await params.service.stop({
					env: process.env,
					stdout,
					disable: params.opts?.disable
				});
			} catch (err) {
				fail(`${params.serviceNoun} stop failed: ${String(err)}`);
				return;
			}
			emit({
				ok: true,
				result: "stopped",
				service: require_shared.buildDaemonServiceSnapshot(params.service, false)
			});
			return;
		}
		try {
			const handled = await params.onNotLoaded?.({
				json,
				stdout,
				fail
			});
			if (handled) {
				emit({
					ok: true,
					result: handled.result,
					message: handled.message,
					warnings: handled.warnings,
					service: require_shared.buildDaemonServiceSnapshot(params.service, false)
				});
				if (!json && handled.message) require_runtime.defaultRuntime.log(handled.message);
				return;
			}
		} catch (err) {
			fail(`${params.serviceNoun} stop failed: ${String(err)}`);
			return;
		}
		emit({
			ok: true,
			result: "not-loaded",
			message: `${params.serviceNoun} service ${params.service.notLoadedText}.`,
			service: require_shared.buildDaemonServiceSnapshot(params.service, loaded)
		});
		if (!json) require_runtime.defaultRuntime.log(`${params.serviceNoun} service ${params.service.notLoadedText}.`);
		return;
	}
	try {
		await params.service.stop({
			env: process.env,
			stdout,
			disable: params.opts?.disable
		});
	} catch (err) {
		fail(`${params.serviceNoun} stop failed: ${String(err)}`);
		return;
	}
	let stopped;
	try {
		stopped = await params.service.isLoaded({ env: process.env });
	} catch {
		stopped = false;
	}
	emit({
		ok: true,
		result: "stopped",
		service: require_shared.buildDaemonServiceSnapshot(params.service, stopped)
	});
}
async function runServiceRestart(params) {
	const json = Boolean(params.opts?.json);
	const { stdout, warnings, emit, fail } = require_shared.createDaemonActionContext({
		action: "restart",
		json
	});
	const warn = json ? (message) => warnings.push(message) : void 0;
	const restartIntent = params.opts?.restartIntent;
	let handledRecovery = null;
	let handledRepair = null;
	let recoveredLoadedState = null;
	let wroteRestartIntent = false;
	const prepareGatewayRestartIntent = async () => {
		if (params.serviceNoun !== "Gateway" || wroteRestartIntent) return;
		wroteRestartIntent = require_restart_intent.writeGatewayRestartIntentSync({
			targetPid: (await params.service.readRuntime(process.env).catch(() => null))?.pid,
			reason: "gateway.restart",
			...restartIntent ? { intent: restartIntent } : {}
		});
	};
	const clearPreparedRestartIntent = () => {
		if (wroteRestartIntent) {
			require_restart_intent.clearGatewayRestartIntentSync();
			wroteRestartIntent = false;
		}
	};
	const emitScheduledRestart = (restartStatus, serviceLoaded) => {
		emitActionMessage({
			json,
			emit,
			payload: {
				ok: true,
				result: restartStatus.daemonActionResult,
				message: restartStatus.message,
				service: require_shared.buildDaemonServiceSnapshot(params.service, serviceLoaded),
				warnings: warnings.length ? warnings : void 0
			}
		});
		return true;
	};
	const loaded = await resolveServiceLoadedOrFail({
		serviceNoun: params.serviceNoun,
		service: params.service,
		fail
	});
	if (loaded === null) return false;
	{
		const preflight = await getConfigActionPreflightFailure("restart the gateway service");
		if (preflight) {
			fail(preflight.hints ? `${params.serviceNoun} restart blocked: ${preflight.message}` : `${params.serviceNoun} aborted: config is invalid.\n${preflight.message}\n${require_config_recovery_hints.formatInvalidConfigRecoveryHint()}`, preflight.hints);
			return false;
		}
	}
	if (!loaded) {
		try {
			handledRecovery = await params.onNotLoaded?.({
				json,
				stdout,
				warn,
				fail
			}) ?? null;
		} catch (err) {
			fail(`${params.serviceNoun} restart failed: ${String(err)}`);
			return false;
		}
		if (!handledRecovery) {
			await handleServiceNotLoaded({
				serviceNoun: params.serviceNoun,
				service: params.service,
				loaded,
				renderStartHints: params.renderStartHints,
				json,
				emit
			});
			return false;
		}
		if (handledRecovery.warnings?.length) warnings.push(...handledRecovery.warnings);
		recoveredLoadedState = handledRecovery.loaded ?? null;
	}
	if (loaded && params.repairLoadedService) try {
		const { state, issues } = await require_service.inspectGatewayServiceStartRepair(params.service, { env: process.env }, params.expectedPort);
		if (issues.length > 0) {
			await prepareGatewayRestartIntent();
			handledRepair = await params.repairLoadedService({
				json,
				stdout,
				warn,
				fail,
				state,
				issues
			});
			if (!handledRepair) {
				clearPreparedRestartIntent();
				fail(`${params.serviceNoun} service needs repair before restart: ${issues.map((issue) => issue.message).join("; ")}`, [require_command_format.formatCliCommand("operator gateway install --force")]);
				return false;
			}
			if (handledRepair.warnings?.length) warnings.push(...handledRepair.warnings);
		}
	} catch (err) {
		clearPreparedRestartIntent();
		const hints = params.renderStartHints();
		fail(`${params.serviceNoun} repair failed: ${String(err)}`, hints);
		return false;
	}
	if (loaded && params.checkTokenDrift) try {
		const command = await params.service.readCommand(process.env);
		const serviceToken = command?.environment?.OPERATOR_GATEWAY_TOKEN;
		const driftIssue = require_service_audit.checkTokenDrift({
			serviceToken,
			configToken: await resolveGatewayTokenForDriftCheck({
				cfg: await require_io.readBestEffortConfig(),
				env: {
					...process.env,
					...command?.environment
				}
			})
		});
		if (driftIssue) {
			const warning = driftIssue.detail ? `${driftIssue.message} ${driftIssue.detail}` : driftIssue.message;
			warnings.push(warning);
			if (!json) {
				require_runtime.defaultRuntime.log(`\n⚠️  ${driftIssue.message}`);
				if (driftIssue.detail) require_runtime.defaultRuntime.log(`   ${driftIssue.detail}\n`);
			}
		}
	} catch (err) {
		if (require_credentials.isGatewaySecretRefUnavailableError(err, "gateway.auth.token")) {
			const warning = "Unable to verify gateway token drift: gateway.auth.token SecretRef is configured but unavailable in this command path.";
			warnings.push(warning);
			if (!json) require_runtime.defaultRuntime.log(`\n⚠️  ${warning}\n`);
		}
	}
	try {
		let restartResult = { outcome: "completed" };
		if (loaded && !handledRepair) {
			await prepareGatewayRestartIntent();
			try {
				restartResult = await params.service.restart({
					env: process.env,
					stdout,
					warn
				});
			} catch (err) {
				clearPreparedRestartIntent();
				throw err;
			}
		}
		let restartStatus = require_service.describeGatewayServiceRestart(params.serviceNoun, restartResult);
		if (restartStatus.scheduled) return emitScheduledRestart(restartStatus, loaded || recoveredLoadedState === true);
		if (params.postRestartCheck) {
			const postRestartResult = await params.postRestartCheck({
				json,
				stdout,
				warnings,
				warn,
				fail
			});
			if (postRestartResult) {
				restartStatus = require_service.describeGatewayServiceRestart(params.serviceNoun, postRestartResult);
				if (restartStatus.scheduled) return emitScheduledRestart(restartStatus, loaded || recoveredLoadedState === true);
			}
		}
		let restarted = loaded;
		if (loaded) try {
			restarted = await params.service.isLoaded({ env: process.env });
		} catch {
			restarted = true;
		}
		else if (recoveredLoadedState !== null) restarted = recoveredLoadedState;
		emit({
			ok: true,
			result: "restarted",
			message: handledRecovery?.message ?? handledRepair?.message,
			service: require_shared.buildDaemonServiceSnapshot(params.service, restarted),
			warnings: warnings.length ? warnings : void 0
		});
		const actionMessage = handledRecovery?.message ?? handledRepair?.message;
		if (!json && actionMessage) require_runtime.defaultRuntime.log(actionMessage);
		return true;
	} catch (err) {
		const hints = params.renderStartHints();
		fail(`${params.serviceNoun} restart failed: ${String(err)}`, hints);
		return false;
	}
}
//#endregion
//#region src/cli/daemon-cli/install.ts
/** Merge safe existing service environment into the current install invocation environment. */
function mergeInstallInvocationEnv(params) {
	const platform = params.platform ?? process.platform;
	const normalizeInstallEnvKey = (key) => platform === "win32" ? key.toUpperCase() : key;
	const currentEnv = {};
	for (const [rawKey, rawValue] of Object.entries(params.env)) {
		const key = require_host_env_security.normalizeEnvVarKey(rawKey, { portable: true });
		if (!key || require_host_env_security.isDangerousHostEnvVarName(key)) continue;
		currentEnv[normalizeInstallEnvKey(key)] = rawValue;
	}
	if (!params.existingServiceEnv || Object.keys(params.existingServiceEnv).length === 0) return currentEnv;
	const preservedServiceEnv = {};
	for (const [rawKey, rawValue] of Object.entries(params.existingServiceEnv)) {
		const key = require_host_env_security.normalizeEnvVarKey(rawKey, { portable: true });
		if (!key) continue;
		const upper = key.toUpperCase();
		if (upper === "OPERATOR_WRAPPER") {
			const value = rawValue.trim();
			if (value) preservedServiceEnv[normalizeInstallEnvKey(require_program_args.OPERATOR_WRAPPER_ENV_KEY)] = value;
			continue;
		}
		if (upper === "HOME" || upper === "PATH" || upper === "TMPDIR" || upper.startsWith("OPERATOR_")) continue;
		if (require_host_env_security.isDangerousHostEnvVarName(key) || require_host_env_security.isDangerousHostEnvOverrideVarName(key)) continue;
		const value = rawValue.trim();
		if (!value) continue;
		preservedServiceEnv[normalizeInstallEnvKey(key)] = value;
	}
	return {
		...preservedServiceEnv,
		...currentEnv
	};
}
//#endregion
//#region src/cli/daemon-cli/start-repair.ts
/** Repair a loaded but stale Gateway service definition and report the start result. */
async function repairLoadedGatewayServiceForStart(params) {
	const { snapshot: configSnapshot, writeOptions: configWriteOptions } = await require_io.readConfigFileSnapshotForWrite();
	const cfg = configSnapshot.valid ? configSnapshot.sourceConfig : configSnapshot.config;
	const existingEnvironment = params.state.command?.environment;
	const existingEnvironmentValueSources = params.state.command?.environmentValueSources;
	const installEnv = mergeInstallInvocationEnv({
		env: process.env,
		existingServiceEnv: existingEnvironment
	});
	const wrapperPath = await require_program_args.resolveOperatorWrapperPath(installEnv[require_program_args.OPERATOR_WRAPPER_ENV_KEY]);
	const installedPort = require_paths.parseTcpPortFromArgs(params.state.command?.programArguments) ?? require_paths.parseTcpPort(params.state.command?.environment?.OPERATOR_GATEWAY_PORT);
	const port = params.port ?? installedPort ?? require_paths.resolveGatewayPort(cfg);
	const tokenResolution = await require_gateway_install_token.resolveGatewayInstallToken({
		config: cfg,
		configSnapshot,
		configWriteOptions,
		env: installEnv,
		autoGenerateWhenMissing: true,
		persistGeneratedToken: true
	});
	if (tokenResolution.unavailableReason) throw new Error(tokenResolution.unavailableReason);
	const warnings = [require_service.formatGatewayServiceStartRepairIssues(params.issues), ...tokenResolution.warnings].filter((warning) => warning.trim().length > 0);
	if (!params.json) {
		require_runtime.defaultRuntime.log("Gateway service definition needs repair:");
		for (const warning of warnings) require_runtime.defaultRuntime.log(`- ${warning}`);
	}
	const { programArguments, workingDirectory, environment, environmentValueSources } = await require_daemon_runtime.buildGatewayInstallPlan({
		env: installEnv,
		port,
		runtime: require_daemon_runtime.DEFAULT_GATEWAY_DAEMON_RUNTIME,
		wrapperPath,
		existingEnvironment,
		existingEnvironmentValueSources,
		config: cfg,
		warn: (message) => {
			warnings.push(message);
			if (!params.json) require_runtime.defaultRuntime.log(`- ${message}`);
		}
	});
	await params.service.install({
		env: installEnv,
		stdout: params.stdout,
		warn: params.warn,
		programArguments,
		workingDirectory,
		environment,
		environmentValueSources
	});
	let loaded;
	try {
		loaded = await params.service.isLoaded({ env: installEnv });
	} catch {
		loaded = true;
	}
	return {
		result: params.action === "restart" ? "restarted" : "started",
		message: params.action === "restart" ? "Gateway service definition repaired and restarted." : "Gateway service definition repaired and started. Reopen the Control UI with `operator dashboard` or copy a fresh auth URL with `operator dashboard --no-open`.",
		warnings: warnings.length ? warnings : void 0,
		loaded
	};
}
//#endregion
//#region src/cli/daemon-cli/lifecycle.ts
const POST_RESTART_HEALTH_ATTEMPTS = require_restart_health.DEFAULT_RESTART_HEALTH_ATTEMPTS;
const POST_RESTART_HEALTH_DELAY_MS = 500;
const WINDOWS_POST_RESTART_HEALTH_TIMEOUT_MS = 18e4;
function postRestartHealthAttempts() {
	return process.platform === "win32" ? Math.ceil(WINDOWS_POST_RESTART_HEALTH_TIMEOUT_MS / POST_RESTART_HEALTH_DELAY_MS) : POST_RESTART_HEALTH_ATTEMPTS;
}
function formatRestartFailure(params) {
	if (params.health.waitOutcome === "stopped-free") {
		const elapsedSeconds = Math.max(1, Math.round((params.health.elapsedMs ?? 0) / 1e3));
		return {
			statusLine: `Gateway restart failed after ${elapsedSeconds}s: service stayed stopped and port ${params.port} stayed free.`,
			failMessage: `Gateway restart failed after ${elapsedSeconds}s: service stayed stopped and health checks never came up.`
		};
	}
	const timeoutSeconds = Math.max(1, Math.round(params.health.elapsedMs === void 0 ? params.defaultTimeoutSeconds : params.health.elapsedMs / 1e3));
	return {
		statusLine: `Timed out after ${timeoutSeconds}s waiting for gateway port ${params.port} to become healthy.`,
		failMessage: `Gateway restart timed out after ${timeoutSeconds}s waiting for health checks.`
	};
}
async function resolveGatewayLifecycleContext(service = require_service.resolveGatewayService()) {
	const command = await service.readCommand(process.env).catch(() => null);
	const mergedEnv = require_service.mergeGatewayServiceEnv(process.env, command);
	const portFromArgs = require_shared.parsePortFromArgs(command?.programArguments);
	const config = await require_io.readBestEffortConfig().catch(() => void 0);
	return {
		port: portFromArgs ?? require_paths.resolveGatewayPort(config, mergedEnv),
		env: mergedEnv
	};
}
async function resolveGatewayLifecyclePort(service = require_service.resolveGatewayService()) {
	return (await resolveGatewayLifecycleContext(service)).port;
}
function resolveGatewayPortFallback() {
	return require_io.readBestEffortConfig().then((cfg) => require_paths.resolveGatewayPort(cfg, process.env)).catch(() => require_paths.resolveGatewayPort(void 0, process.env));
}
async function resolveExplicitGatewayConfigPort() {
	return (await require_io.readBestEffortConfig().catch(() => void 0))?.gateway?.port;
}
async function assertUnmanagedGatewayRestartEnabled(port) {
	const cfg = await require_io.readBestEffortConfig().catch(() => void 0);
	const probe = await require_probe.probeGateway({
		url: `${Boolean(cfg?.gateway?.tls?.enabled) ? "wss" : "ws"}://127.0.0.1:${port}`,
		auth: {
			token: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.OPERATOR_GATEWAY_TOKEN),
			password: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.OPERATOR_GATEWAY_PASSWORD)
		},
		timeoutMs: 1e3
	}).catch(() => null);
	if (!probe?.ok) return;
	if (!require_commands_flags.isRestartEnabled(probe.configSnapshot)) throw new Error("Gateway restart is disabled in the running gateway config (commands.restart=false); unmanaged SIGUSR1 restart would be ignored");
}
function resolveVerifiedGatewayListenerPids(port) {
	return require_gateway_processes.findVerifiedGatewayListenerPidsOnPortSync(port).filter((pid) => Number.isFinite(pid) && pid > 0);
}
async function handleSystemScopeSystemdGateway(action) {
	if (process.platform !== "linux") return null;
	const installed = await require_systemd.findInstalledSystemdGatewayScope(process.env).catch(() => null);
	if (installed?.scope !== "system") return null;
	const stdout = require_shared.createNullWriter();
	if (action === "stop") {
		await require_systemd.stopSystemdService({
			stdout,
			env: process.env
		});
		return {
			result: "stopped",
			message: `Gateway stopped via system-scope systemd unit ${installed.unitName}.`
		};
	}
	await require_systemd.restartSystemdService({
		stdout,
		env: process.env
	});
	return {
		result: "restarted",
		message: `Gateway restarted via system-scope systemd unit ${installed.unitName}.`
	};
}
async function stopGatewayWithoutServiceManager(port) {
	const managed = await handleSystemScopeSystemdGateway("stop");
	if (managed) return managed;
	const pids = resolveVerifiedGatewayListenerPids(port);
	if (pids.length === 0) return null;
	for (const pid of pids) require_gateway_processes.signalVerifiedGatewayPidSync(pid, "SIGTERM");
	return {
		result: "stopped",
		message: `Gateway stop signal sent to unmanaged process${pids.length === 1 ? "" : "es"} on port ${port}: ${require_gateway_processes.formatGatewayPidList(pids)}.`
	};
}
function resolveGatewayRestartIntentOptions(opts) {
	if (opts.force && opts.wait !== void 0) throw new Error("--force cannot be combined with --wait");
	if (opts.force) return { force: true };
	if (opts.wait !== void 0) return { waitMs: require_parse_duration.parseDurationMs(opts.wait) };
}
function formatSafeRestartWarnings(result) {
	if (result.preflight.blockers.length === 0) return;
	return [result.preflight.summary];
}
async function requestSafeGatewayRestart(opts) {
	if (opts.force) throw new Error("--safe cannot be combined with --force; omit --safe to force restart now");
	if (opts.wait !== void 0) throw new Error("--safe cannot be combined with --wait; safe restart uses gateway deferral");
	const skipDeferral = opts.skipDeferral === true;
	const params = { reason: "gateway.restart.safe" };
	if (skipDeferral) params.skipDeferral = true;
	const result = await require_call.callGatewayCli({
		method: "gateway.restart.request",
		params,
		timeoutMs: 1e4
	});
	const message = result.status === "coalesced" ? "safe restart request joined an existing pending gateway restart" : result.status === "deferred" ? "safe restart requested; gateway will restart after active work drains (bounded by gateway.reload.deferralTimeoutMs; may force after timeout expires)" : skipDeferral ? "safe restart requested; gateway bypassing active-work deferral" : "safe restart requested; gateway will restart momentarily";
	const payload = {
		ok: true,
		result: result.status,
		message,
		preflight: result.preflight,
		restart: result.restart,
		warnings: formatSafeRestartWarnings(result)
	};
	if (opts.json) require_runtime.defaultRuntime.log(JSON.stringify(payload, null, 2));
	else {
		require_runtime.defaultRuntime.log(message);
		if (result.preflight.blockers.length > 0) require_runtime.defaultRuntime.log(require_theme.theme.warn(result.preflight.summary));
	}
	return true;
}
async function restartGatewayWithoutServiceManager(port, restartIntent) {
	const managed = await handleSystemScopeSystemdGateway("restart");
	if (managed) return managed;
	await assertUnmanagedGatewayRestartEnabled(port);
	const pids = resolveVerifiedGatewayListenerPids(port);
	if (pids.length === 0) return null;
	if (pids.length > 1) throw new Error(`multiple gateway processes are listening on port ${port}: ${require_gateway_processes.formatGatewayPidList(pids)}; use "openclaw gateway status --deep" before retrying restart`);
	require_restart_intent.writeGatewayRestartIntentSync({
		targetPid: pids[0],
		reason: "gateway.restart",
		...restartIntent ? { intent: restartIntent } : {}
	});
	require_gateway_processes.signalVerifiedGatewayPidSync((0, _gabrielvfonseca_normalization_core.expectDefined)(pids[0], "pids entry at 0"), "SIGUSR1");
	return {
		result: "restarted",
		message: `Gateway restart signal sent to unmanaged process on port ${port}: ${pids[0]}.`
	};
}
/** Start the managed Gateway service, repairing stale service definitions when possible. */
async function runDaemonStart(opts = {}) {
	const service = require_service.resolveGatewayService();
	const expectedPort = await resolveExplicitGatewayConfigPort();
	return await runServiceStart({
		serviceNoun: "Gateway",
		service,
		renderStartHints: require_shared.renderGatewayServiceStartHints,
		onNotLoaded: process.platform === "darwin" ? async () => await recoverInstalledLaunchAgent({ result: "started" }) : void 0,
		repairLoadedService: async ({ json, stdout, warn, state, issues }) => await repairLoadedGatewayServiceForStart({
			service,
			port: expectedPort,
			json,
			stdout,
			warn,
			state,
			issues
		}),
		expectedPort,
		opts
	});
}
/** Stop the managed Gateway service or verified unmanaged listener fallback. */
async function runDaemonStop(opts = {}) {
	const service = require_service.resolveGatewayService();
	let gatewayPortPromise;
	return await runServiceStop({
		serviceNoun: "Gateway",
		service,
		opts,
		stopWhenNotLoaded: process.platform === "darwin" && Boolean(opts.disable),
		onNotLoaded: async ({ stdout }) => {
			if (process.platform === "linux") {
				if ((await service.readRuntime(process.env).catch(() => null))?.status === "running") {
					await service.stop({
						env: process.env,
						stdout
					});
					return { result: "stopped" };
				}
			}
			gatewayPortPromise ??= resolveGatewayLifecyclePort(service).catch(() => resolveGatewayPortFallback());
			return await stopGatewayWithoutServiceManager(await gatewayPortPromise);
		}
	});
}
/** Restart the Gateway service or a verified unmanaged listener, then prove health. */
async function runDaemonRestart(opts = {}) {
	if (opts.skipDeferral && !opts.safe) throw new Error("--skip-deferral requires --safe");
	if (opts.safe) return await requestSafeGatewayRestart(opts);
	const jsonOutput = Boolean(opts.json);
	const service = require_service.resolveGatewayService();
	let restartedWithoutServiceManager = false;
	const restartIntent = resolveGatewayRestartIntentOptions(opts);
	const configuredPort = await resolveExplicitGatewayConfigPort();
	let managedRestartContext = await resolveGatewayLifecycleContext(service).catch(async () => ({
		port: await resolveGatewayPortFallback(),
		env: process.env
	}));
	let managedRestartPort = configuredPort ?? managedRestartContext.port;
	const unmanagedPort = await require_gateway_lock.readActiveGatewayLockPort().catch(() => void 0) ?? managedRestartPort;
	const restartHealthAttempts = postRestartHealthAttempts();
	const restartWaitMs = restartHealthAttempts * POST_RESTART_HEALTH_DELAY_MS;
	const restartWaitSeconds = Math.round(restartWaitMs / 1e3);
	return await runServiceRestart({
		serviceNoun: "Gateway",
		service,
		renderStartHints: require_shared.renderGatewayServiceStartHints,
		opts: {
			...opts,
			...restartIntent ? { restartIntent } : {}
		},
		checkTokenDrift: true,
		expectedPort: configuredPort,
		repairLoadedService: async ({ json, stdout, warn, state, issues }) => {
			const result = await repairLoadedGatewayServiceForStart({
				action: "restart",
				service,
				port: configuredPort,
				json,
				stdout,
				warn,
				state,
				issues
			});
			managedRestartContext = await resolveGatewayLifecycleContext(service);
			managedRestartPort = configuredPort ?? managedRestartContext.port;
			return result;
		},
		onNotLoaded: async () => {
			if (process.platform === "darwin") {
				const recovered = await recoverInstalledLaunchAgent({ result: "restarted" });
				if (recovered) return recovered;
			}
			const handled = await restartGatewayWithoutServiceManager(unmanagedPort, restartIntent);
			if (handled) {
				restartedWithoutServiceManager = true;
				return handled;
			}
			return null;
		},
		postRestartCheck: async ({ warnings, fail, stdout, warn }) => {
			if (restartedWithoutServiceManager) {
				const health = await require_restart_health.waitForGatewayHealthyListener({
					port: unmanagedPort,
					attempts: restartHealthAttempts,
					delayMs: POST_RESTART_HEALTH_DELAY_MS
				});
				if (health.healthy) return;
				const diagnostics = require_restart_health.renderGatewayPortHealthDiagnostics(health);
				const timeoutLine = `Timed out after ${restartWaitSeconds}s waiting for gateway port ${unmanagedPort} to become healthy.`;
				if (!jsonOutput) {
					require_runtime.defaultRuntime.log(require_theme.theme.warn(timeoutLine));
					for (const line of diagnostics) require_runtime.defaultRuntime.log(require_theme.theme.muted(line));
				} else {
					warnings.push(timeoutLine);
					warnings.push(...diagnostics);
				}
				fail(`Gateway restart timed out after ${restartWaitSeconds}s waiting for health checks.`, [require_command_format.formatCliCommand("openclaw gateway status --deep"), require_command_format.formatCliCommand("openclaw doctor")]);
				throw new Error("unreachable after gateway restart health failure");
			}
			let health = await require_restart_health.waitForGatewayHealthyRestart({
				service,
				port: managedRestartPort,
				attempts: restartHealthAttempts,
				delayMs: POST_RESTART_HEALTH_DELAY_MS,
				env: managedRestartContext.env,
				includeUnknownListenersAsStale: process.platform === "win32"
			});
			if (!health.healthy && health.staleGatewayPids.length > 0) {
				const staleMsg = `Found stale gateway process(es): ${health.staleGatewayPids.join(", ")}.`;
				warnings.push(staleMsg);
				if (!jsonOutput) {
					require_runtime.defaultRuntime.log(require_theme.theme.warn(staleMsg));
					require_runtime.defaultRuntime.log(require_theme.theme.muted("Stopping stale process(es) and retrying restart..."));
				}
				await require_restart_health.terminateStaleGatewayPids(health.staleGatewayPids);
				const retryRestart = await service.restart({
					env: process.env,
					stdout,
					warn
				});
				if (retryRestart.outcome === "scheduled") return retryRestart;
				health = await require_restart_health.waitForGatewayHealthyRestart({
					service,
					port: managedRestartPort,
					attempts: restartHealthAttempts,
					delayMs: POST_RESTART_HEALTH_DELAY_MS,
					env: managedRestartContext.env,
					includeUnknownListenersAsStale: process.platform === "win32"
				});
			}
			if (health.healthy) return;
			const diagnostics = require_restart_health.renderRestartDiagnostics(health);
			const failure = formatRestartFailure({
				health,
				port: managedRestartPort,
				defaultTimeoutSeconds: restartWaitSeconds
			});
			const runningNoPortLine = health.runtime.status === "running" && health.portUsage.status === "free" ? `Gateway process is running but port ${managedRestartPort} is still free (startup hang/crash loop or very slow VM startup).` : null;
			if (!jsonOutput) {
				require_runtime.defaultRuntime.log(require_theme.theme.warn(failure.statusLine));
				if (runningNoPortLine) require_runtime.defaultRuntime.log(require_theme.theme.warn(runningNoPortLine));
				for (const line of diagnostics) require_runtime.defaultRuntime.log(require_theme.theme.muted(line));
			} else {
				warnings.push(failure.statusLine);
				if (runningNoPortLine) warnings.push(runningNoPortLine);
				warnings.push(...diagnostics);
			}
			fail(failure.failMessage, [require_command_format.formatCliCommand("openclaw gateway status --deep"), require_command_format.formatCliCommand("openclaw doctor")]);
			throw new Error("unreachable after gateway restart failure");
		}
	});
}
//#endregion
exports.runDaemonRestart = runDaemonRestart;
exports.runDaemonStart = runDaemonStart;
exports.runDaemonStop = runDaemonStop;
