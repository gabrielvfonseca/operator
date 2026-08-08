require("./rolldown-runtime-u92d-OFm.cjs");
const require_sleep = require("./sleep-BVpvBXin.cjs");
require("./utils-CXqBhRFw.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
require("./config-DT0qiglW.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
require("./logging-CPL2M9DX.cjs");
const require_ports = require("./ports-DVTOW6GH.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_paths$1 = require("./paths-amwIgX1d.cjs");
const require_service = require("./service-BJLcDrM4.cjs");
const require_launchd = require("./launchd-dIaeSQPq.cjs");
const require_systemd = require("./systemd-BxVKNLOg.cjs");
const require_runtime_hints = require("./runtime-hints--ik248YA.cjs");
const require_service_runtime = require("./service-runtime-BkEjx9FW.cjs");
const require_daemon_runtime = require("./daemon-runtime-CITeCeC-.cjs");
const require_gateway_install_token = require("./gateway-install-token-DlQTHFzY.cjs");
const require_diagnostics = require("./diagnostics-DtsXjNEN.cjs");
const require_restart_handoff = require("./restart-handoff-Cr8OzXsJ.cjs");
const require_health_format = require("./health-format-Cxf7oLqH.cjs");
const require_health = require("./health-oi6Ab5R5.cjs");
const require_inspect = require("./inspect-Dj9g7PTQ.cjs");
const require_doctor_service_repair_policy = require("./doctor-service-repair-policy-DCMyHa1V.cjs");
//#region src/commands/doctor-format.ts
/** Formatting helpers for gateway runtime summaries and doctor repair hints. */
/** Formats the platform-specific gateway service runtime into a compact status line. */
function formatGatewayRuntimeSummary(runtime) {
	return require_runtime_hints.formatRuntimeStatus(runtime);
}
/** Builds follow-up hints for stopped, missing, or unhealthy gateway service runtimes. */
function buildGatewayRuntimeHints(runtime, options = {}) {
	const hints = [];
	if (!runtime) return hints;
	const platform = options.platform ?? process.platform;
	const env = options.env ?? process.env;
	const container = Boolean(require_runtime_hints.resolveDaemonContainerContext(env));
	const fileLog = (() => {
		try {
			return require_logger.getResolvedLoggerSettings().file;
		} catch {
			return null;
		}
	})();
	if (platform === "linux" && require_runtime_hints.isSystemdUnavailableDetail(runtime.detail)) {
		hints.push(...require_runtime_hints.renderSystemdUnavailableHints({
			wsl: require_undici_global_dispatcher.isWSLEnv(env),
			kind: require_systemd.classifySystemdUnavailableDetail(runtime.detail),
			container
		}));
		if (fileLog) hints.push(`File logs: ${fileLog}`);
		return hints;
	}
	if (runtime.cachedLabel && platform === "darwin") {
		const label = require_paths$1.resolveGatewayLaunchAgentLabel(env.OPERATOR_PROFILE);
		hints.push(`LaunchAgent label cached but plist missing. Clear with: launchctl bootout gui/$UID/${label}`);
		hints.push(`Then reinstall: ${require_command_format.formatCliCommand("operator gateway install", env)}`);
	}
	if (runtime.missingUnit) {
		hints.push(`Service not installed. Run: ${require_command_format.formatCliCommand("operator gateway install", env)}`);
		if (fileLog) hints.push(`File logs: ${fileLog}`);
		return hints;
	}
	if (runtime.missingGuiSession && platform === "darwin") {
		hints.push("LaunchAgent requires a logged-in macOS GUI session; SSH/headless/sudo shells cannot bootstrap gui/$UID.");
		hints.push(`Sign in to the macOS desktop as this user, then run: ${require_command_format.formatCliCommand("operator gateway restart", env)}`);
		hints.push("For headless VM setups, enable auto-login for the target user or use a custom LaunchDaemon (not shipped).");
		if (fileLog) hints.push(`File logs: ${fileLog}`);
		return hints;
	}
	if (runtime.missingSupervision && platform === "darwin") {
		hints.push(`LaunchAgent installed but not loaded. Run: ${require_command_format.formatCliCommand("operator gateway restart", env)}`);
		if (fileLog) hints.push(`File logs: ${fileLog}`);
		return hints;
	}
	if (runtime.status === "stopped") {
		if (platform === "linux" && require_service_runtime.isSystemdStartLimitHit(runtime)) hints.push("systemd stopped restarting the gateway after repeated crashes.", `Recover with: ${require_command_format.formatCliCommand("operator gateway restart", env)}, then inspect logs if it keeps crashing.`);
		else hints.push("Service is loaded but not running (likely exited immediately).");
		if (fileLog) hints.push(`File logs: ${fileLog}`);
		hints.push(...require_runtime_hints.buildPlatformRuntimeLogHints({
			platform,
			env,
			systemdServiceName: require_paths$1.resolveGatewaySystemdServiceName(env.OPERATOR_PROFILE),
			windowsTaskName: require_paths$1.resolveGatewayWindowsTaskName(env.OPERATOR_PROFILE)
		}));
	}
	if (platform === "linux" && require_service_runtime.isSystemdCgroupHygieneRisk(runtime.systemd)) {
		const unit = runtime.systemd?.unit ?? `${require_paths$1.resolveGatewaySystemdServiceName(env.OPERATOR_PROFILE)}.service`;
		const summary = require_service_runtime.getSystemdCgroupHygieneSummary(runtime.systemd);
		if (summary) hints.push(`Systemd cgroup hygiene looks elevated: ${summary}.`, "This usually means old helper or browser processes may still be attached to the gateway service.", `Run: systemctl --user show ${unit} -p KillMode -p TasksCurrent -p MemoryCurrent -p MainPID`, `Run: systemd-cgls --user-unit ${unit}`, `After reviewing service settings, run: ${require_command_format.formatCliCommand("operator gateway restart", env)}`);
	}
	return hints;
}
//#endregion
//#region src/commands/doctor-gateway-daemon-flow.ts
/** Doctor gateway daemon repair flow for service install, bootstrap, restart, and port hints. */
function noteGatewayRuntime(serviceRuntime, env) {
	const summary = formatGatewayRuntimeSummary(serviceRuntime);
	const hints = buildGatewayRuntimeHints(serviceRuntime, {
		platform: process.platform,
		env
	});
	if (!summary && hints.length === 0) return;
	const lines = [];
	if (summary) lines.push(`Runtime: ${summary}`);
	lines.push(...hints);
	require_note.note(lines.join("\n"), "Gateway");
}
async function maybeRepairLaunchAgentBootstrap(params) {
	if (process.platform !== "darwin") return { status: "skipped" };
	if (!await require_launchd.launchAgentPlistExists(params.env)) return { status: "skipped" };
	if (await require_launchd.isLaunchAgentLoaded({ env: params.env })) return { status: "skipped" };
	require_note.note("LaunchAgent is installed but not loaded in launchd.", `${params.title} LaunchAgent`);
	if (params.serviceRepairExternal) {
		require_note.note(require_doctor_service_repair_policy.EXTERNAL_SERVICE_REPAIR_NOTE, `${params.title} LaunchAgent`);
		return { status: "skipped" };
	}
	if (!await require_doctor_service_repair_policy.confirmDoctorServiceRepair(params.prompter, {
		message: `Repair ${params.title} LaunchAgent bootstrap now?`,
		initialValue: true
	})) return { status: "skipped" };
	params.runtime.log(`Bootstrapping ${params.title} LaunchAgent...`);
	const repair = await require_launchd.repairLaunchAgentBootstrap({ env: params.env });
	if (!repair.ok) {
		if (repair.status === "gui-session-unavailable") return {
			status: "gui-session-unavailable",
			detail: repair.detail
		};
		params.runtime.error(`${params.title} LaunchAgent bootstrap failed: ${repair.detail ?? "unknown error"}`);
		return { status: "skipped" };
	}
	if (!await require_launchd.isLaunchAgentLoaded({ env: params.env })) {
		params.runtime.error(`${params.title} LaunchAgent still not loaded after repair.`);
		return { status: "skipped" };
	}
	require_note.note(`${params.title} LaunchAgent repaired.`, `${params.title} LaunchAgent`);
	return { status: "repaired" };
}
function renderBlockingSystemGatewayServices(services) {
	return [
		"System-level Operator gateway service detected while the user gateway service is not installed.",
		...services.map((svc) => `- ${svc.label} (${svc.detail})`),
		"Operator will not install a second user-level gateway service automatically.",
		"Run `openclaw gateway status --deep` or `openclaw doctor --deep` to inspect duplicate services.",
		`Set ${require_doctor_service_repair_policy.SERVICE_REPAIR_POLICY_ENV}=external if a system supervisor owns the gateway lifecycle.`
	].join("\n");
}
function renderEstablishedGatewayConnections(connections) {
	return [
		"Established Gateway TCP clients detected:",
		...connections.slice(0, 8).map((connection) => {
			return `- ${connection.pid ? `pid=${connection.pid}` : "pid=?"} ${connection.direction}${connection.command ? ` ${connection.command}` : ""}${connection.address ? ` ${connection.address}` : ""}${connection.commandLine ? ` cmd=${connection.commandLine}` : ""}`;
		}),
		...connections.length > 8 ? [`- ... ${connections.length - 8} more connection(s)`] : [],
		"If logs show protocol mismatch after rollback, stop stale Operator client processes listed here and rerun doctor."
	].join("\n");
}
async function maybeReportEstablishedGatewayClients(params) {
	if (!params.deep || params.cfg.gateway?.mode === "remote") return;
	const establishedClients = (await require_ports.inspectPortConnections(params.port ?? require_paths.resolveGatewayPort(params.cfg, process.env)).catch(() => null))?.connections.filter((connection) => connection.direction !== "server");
	if (establishedClients && establishedClients.length > 0) require_note.note(renderEstablishedGatewayConnections(establishedClients), "Gateway clients");
}
/**
* Repairs or diagnoses the local gateway service after the health check fails.
*
* Remote gateway mode is only diagnosed; local mode may bootstrap launchd, install missing
* services, report port conflicts, or restart unhealthy supervision when policy allows.
*/
async function maybeRepairGatewayDaemon(params) {
	if (params.healthOk) {
		await maybeReportEstablishedGatewayClients({
			cfg: params.cfg,
			deep: params.options.deep ?? false
		});
		return;
	}
	if (params.healthSkipped && params.cfg.gateway?.mode === "remote") return;
	const serviceRepairPolicy = require_doctor_service_repair_policy.resolveServiceRepairPolicy();
	const serviceRepairExternal = require_doctor_service_repair_policy.isServiceRepairExternallyManaged(serviceRepairPolicy);
	const service = require_service.resolveGatewayService();
	const isLocalDarwinGateway = process.platform === "darwin" && params.cfg.gateway?.mode !== "remote";
	let loaded;
	try {
		loaded = await service.isLoaded({ env: process.env });
	} catch {
		loaded = false;
	}
	let serviceRuntime;
	const command = params.options.deep ? await Promise.resolve(service.readCommand(process.env)).catch(() => null) : null;
	const serviceEnv = command?.environment ? {
		...process.env,
		...command.environment
	} : process.env;
	if (loaded || isLocalDarwinGateway) serviceRuntime = await service.readRuntime(serviceEnv).catch(() => void 0);
	if (params.options.deep) {
		const handoff = require_restart_handoff.readGatewayRestartHandoffSync(serviceEnv);
		if (handoff) require_note.note(require_restart_handoff.formatGatewayRestartHandoffDiagnostic(handoff), "Gateway");
	}
	if (isLocalDarwinGateway) {
		const gatewayRepair = serviceRuntime?.missingGuiSession ? {
			status: "gui-session-unavailable",
			detail: serviceRuntime.detail ?? ""
		} : await maybeRepairLaunchAgentBootstrap({
			env: process.env,
			title: "Gateway",
			runtime: params.runtime,
			prompter: params.prompter,
			serviceRepairExternal
		});
		await maybeRepairLaunchAgentBootstrap({
			env: {
				...process.env,
				OPERATOR_LAUNCHD_LABEL: require_paths$1.resolveNodeLaunchAgentLabel()
			},
			title: "Node",
			runtime: params.runtime,
			prompter: params.prompter,
			serviceRepairExternal
		});
		if (gatewayRepair.status === "gui-session-unavailable") serviceRuntime = {
			status: "unknown",
			detail: gatewayRepair.detail || serviceRuntime?.detail,
			missingSupervision: true,
			missingGuiSession: true
		};
		if (gatewayRepair.status === "repaired") {
			loaded = await service.isLoaded({ env: process.env });
			if (loaded) serviceRuntime = await service.readRuntime(process.env).catch(() => void 0);
		}
	}
	if (params.cfg.gateway?.mode !== "remote") {
		const port = require_paths.resolveGatewayPort(params.cfg, process.env);
		const diagnostics = await require_ports.inspectPortUsage(port);
		await maybeReportEstablishedGatewayClients({
			cfg: params.cfg,
			deep: params.options.deep ?? false,
			port
		});
		if (diagnostics.status === "busy" && !require_ports.isExpectedGatewayListeners(diagnostics.listeners, diagnostics.port)) require_note.note(require_ports.formatPortDiagnostics(diagnostics).join("\n"), "Gateway port");
		else if (loaded && serviceRuntime?.status === "running") {
			const lastError = await require_diagnostics.readLastGatewayErrorLine(process.env);
			if (lastError) require_note.note(`Last gateway error: ${lastError}`, "Gateway");
		}
	}
	if (!loaded) {
		if (isLocalDarwinGateway && (serviceRuntime?.missingGuiSession || serviceRuntime?.missingSupervision || serviceRuntime?.cachedLabel)) {
			noteGatewayRuntime(serviceRuntime, process.env);
			return;
		}
		if (process.platform === "linux") {
			if (!await require_systemd.isSystemdUserServiceAvailable().catch(() => false)) {
				require_note.note(require_runtime_hints.renderSystemdUnavailableHints({
					wsl: await require_undici_global_dispatcher.isWSL(),
					kind: "generic_unavailable"
				}).join("\n"), "Gateway");
				return;
			}
		}
		require_note.note("Gateway service not installed.", "Gateway");
		if (params.cfg.gateway?.mode !== "remote") {
			if (process.platform === "linux") {
				const systemGatewayServices = await require_inspect.findSystemGatewayServices();
				if (systemGatewayServices.length > 0) {
					require_note.note(renderBlockingSystemGatewayServices(systemGatewayServices), "Gateway");
					return;
				}
			}
			if (serviceRepairExternal) {
				require_note.note(require_doctor_service_repair_policy.EXTERNAL_SERVICE_REPAIR_NOTE, "Gateway");
				return;
			}
			const install = await require_doctor_service_repair_policy.confirmDoctorServiceRepair(params.prompter, {
				message: "Install gateway service now?",
				initialValue: true,
				requiresInteractiveConfirmation: true
			}, serviceRepairPolicy);
			if (!install) require_note.note(`Run ${require_command_format.formatCliCommand("openclaw gateway install")} when you want to install the gateway service.`, "Gateway");
			if (install) {
				const daemonRuntime = await params.prompter.select({
					message: "Gateway service runtime",
					options: require_daemon_runtime.GATEWAY_DAEMON_RUNTIME_OPTIONS,
					initialValue: require_daemon_runtime.DEFAULT_GATEWAY_DAEMON_RUNTIME
				}, require_daemon_runtime.DEFAULT_GATEWAY_DAEMON_RUNTIME);
				const tokenResolution = await require_gateway_install_token.resolveGatewayInstallToken({
					config: params.cfg,
					env: process.env
				});
				for (const warning of tokenResolution.warnings) require_note.note(warning, "Gateway");
				if (tokenResolution.unavailableReason) {
					require_note.note([
						"Gateway service install aborted.",
						tokenResolution.unavailableReason,
						"Fix gateway auth config/token input and rerun doctor."
					].join("\n"), "Gateway");
					return;
				}
				const port = require_paths.resolveGatewayPort(params.cfg, process.env);
				const { programArguments, workingDirectory, environment, environmentValueSources } = await require_daemon_runtime.buildGatewayInstallPlan({
					env: process.env,
					port,
					runtime: daemonRuntime,
					warn: (message, title) => require_note.note(message, title),
					config: params.cfg
				});
				try {
					await service.install({
						env: process.env,
						stdout: process.stdout,
						programArguments,
						workingDirectory,
						environment,
						environmentValueSources
					});
				} catch (err) {
					require_note.note(`Gateway service install failed: ${String(err)}`, "Gateway");
					require_note.note(require_daemon_runtime.gatewayInstallErrorHint(), "Gateway");
				}
			}
		}
		return;
	}
	noteGatewayRuntime(serviceRuntime, process.env);
	if (serviceRuntime?.status !== "running") {
		if (params.healthSkipped && serviceRuntime?.status !== "stopped") return;
		if (serviceRepairExternal) {
			require_note.note(require_doctor_service_repair_policy.EXTERNAL_SERVICE_REPAIR_NOTE, "Gateway");
			return;
		}
		if (await require_doctor_service_repair_policy.confirmDoctorServiceRepair(params.prompter, {
			message: "Start gateway service now?",
			initialValue: true
		}, serviceRepairPolicy)) {
			const restartStatus = require_service.describeGatewayServiceRestart("Gateway", await service.restart({
				env: process.env,
				stdout: process.stdout
			}));
			if (!restartStatus.scheduled) await require_sleep.sleep(1500);
			else require_note.note(restartStatus.message, "Gateway");
		}
	}
	if (process.platform === "darwin") {
		const label = require_paths$1.resolveGatewayLaunchAgentLabel(process.env.OPERATOR_PROFILE);
		require_note.note(`LaunchAgent loaded; stopping requires "${require_command_format.formatCliCommand("openclaw gateway stop")}" or launchctl bootout gui/$UID/${label}.`, "Gateway");
	}
	if (serviceRuntime?.status === "running") {
		if (params.healthSkipped) return;
		if (serviceRepairExternal) {
			require_note.note(require_doctor_service_repair_policy.EXTERNAL_SERVICE_REPAIR_NOTE, "Gateway");
			return;
		}
		if (require_restart_handoff.readGatewayRestartHandoffSync(serviceEnv)) try {
			await require_health.healthCommand({
				json: false,
				timeoutMs: 1e4
			}, params.runtime);
			require_note.note("Gateway is healthy after recent restart; skipping restart prompt.", "Gateway");
			return;
		} catch {}
		if (params.options.nonInteractive === true) return;
		if (await require_doctor_service_repair_policy.confirmDoctorServiceRepair(params.prompter, {
			message: "Restart gateway service now?",
			initialValue: false
		}, serviceRepairPolicy)) {
			const restartStatus = require_service.describeGatewayServiceRestart("Gateway", await service.restart({
				env: process.env,
				stdout: process.stdout
			}));
			if (restartStatus.scheduled) {
				require_note.note(restartStatus.message, "Gateway");
				return;
			}
			await require_sleep.sleep(1500);
			try {
				await require_health.healthCommand({
					json: false,
					timeoutMs: 1e4
				}, params.runtime);
			} catch (err) {
				if (String(err).includes("gateway closed")) {
					const closedDiagnostic = require_health_format.formatGatewayClosedDiagnostic(err);
					if (closedDiagnostic) {
						require_note.note(closedDiagnostic, "Gateway");
						require_note.note(params.gatewayDetailsMessage, "Gateway connection");
					} else {
						require_note.note("Gateway not running.", "Gateway");
						require_note.note(params.gatewayDetailsMessage, "Gateway connection");
					}
				} else params.runtime.error(require_health_format.formatHealthCheckFailure(err));
			}
		}
	}
}
//#endregion
exports.maybeRepairGatewayDaemon = maybeRepairGatewayDaemon;
