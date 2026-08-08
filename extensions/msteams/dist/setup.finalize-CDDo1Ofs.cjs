const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_cli_name = require("./cli-name-riMh4a6G.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_container_environment = require("./container-environment-BT54HraU.cjs");
const require_workspace = require("./workspace-oX0zfOZq.cjs");
const require_codex_native_web_search_shared = require("./codex-native-web-search.shared-BEYpYcyR.cjs");
const require_model_config_helpers = require("./model-config.helpers-BA8b3n7P.cjs");
const require_runtime$1 = require("./runtime-CXo-Wba-.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_service = require("./service-BJLcDrM4.cjs");
const require_systemd = require("./systemd-BxVKNLOg.cjs");
const require_daemon_runtime = require("./daemon-runtime-CITeCeC-.cjs");
const require_gateway_install_token = require("./gateway-install-token-DlQTHFzY.cjs");
const require_control_ui_links = require("./control-ui-links-CSNzE0Jo.cjs");
const require_windows_gateway_firewall_diagnostics = require("./windows-gateway-firewall-diagnostics-CLeXydMX.cjs");
const require_browser_open = require("./browser-open-vi77U5ps.cjs");
const require_onboard_helpers = require("./onboard-helpers-B8YMO226.cjs");
const require_control_ui_assets = require("./control-ui-assets-CAB0clox.cjs");
const require_setup_secret_input = require("./setup.secret-input-BaApiN1b.cjs");
const require_health_format = require("./health-format-Cxf7oLqH.cjs");
const require_health = require("./health-oi6Ab5R5.cjs");
const require_doctor_completion = require("./doctor-completion-D7jrsVvS.cjs");
const require_setup_launch_env = require("./setup-launch-env-DptQdIsm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_child_process = require("node:child_process");
let node_process = require("node:process");
node_process = require_rolldown_runtime.__toESM(node_process, 1);
//#region src/process/child-process-bridge.ts
const defaultSignals = node_process.default.platform === "win32" ? [
	"SIGTERM",
	"SIGINT",
	"SIGBREAK"
] : [
	"SIGTERM",
	"SIGINT",
	"SIGHUP",
	"SIGQUIT"
];
/** Forwards process termination signals to a child and detaches on child exit/error. */
function attachChildProcessBridge(child, { signals = defaultSignals, onSignal } = {}) {
	const listeners = /* @__PURE__ */ new Map();
	for (const signal of signals) {
		const listener = () => {
			onSignal?.(signal);
			try {
				child.kill(signal);
			} catch {}
		};
		try {
			node_process.default.on(signal, listener);
			listeners.set(signal, listener);
		} catch {}
	}
	const detach = () => {
		for (const [signal, listener] of listeners) node_process.default.off(signal, listener);
		listeners.clear();
	};
	child.once("exit", detach);
	child.once("error", detach);
	return { detach };
}
//#endregion
//#region src/tui/tui-launch.ts
function appendOption(args, flag, value) {
	if (value === void 0) return;
	args.push(flag, String(value));
}
function filterTuiExecArgv(execArgv) {
	const filtered = [];
	for (let index = 0; index < execArgv.length; index += 1) {
		const arg = execArgv[index] ?? "";
		if (arg === "--inspect" || arg.startsWith("--inspect=") || arg === "--inspect-brk" || arg.startsWith("--inspect-brk=") || arg === "--inspect-wait" || arg.startsWith("--inspect-wait=")) {
			const next = execArgv[index + 1];
			if (!arg.includes("=") && typeof next === "string" && !next.startsWith("-")) index += 1;
			continue;
		}
		if (arg === "--inspect-port") {
			const next = execArgv[index + 1];
			if (typeof next === "string" && !next.startsWith("-")) index += 1;
			continue;
		}
		if (arg.startsWith("--inspect-port=")) continue;
		filtered.push(arg);
	}
	return filtered;
}
function buildCurrentCliEntryArgs() {
	const entry = process.argv[1]?.trim();
	if (!entry) throw new Error("unable to relaunch TUI: current CLI entry path is unavailable");
	return node_path.default.isAbsolute(entry) ? [entry] : [];
}
function buildTuiCliArgs(opts) {
	const args = [
		...filterTuiExecArgv(process.execArgv),
		...buildCurrentCliEntryArgs(),
		"tui"
	];
	if (opts.local) args.push("--local");
	appendOption(args, "--url", opts.url);
	appendOption(args, "--token", opts.token);
	appendOption(args, "--password", opts.password);
	appendOption(args, "--tls-fingerprint", opts.tlsFingerprint);
	appendOption(args, "--session", opts.session);
	appendOption(args, "--thinking", opts.thinking);
	appendOption(args, "--message", opts.message);
	appendOption(args, "--timeout-ms", opts.timeoutMs);
	appendOption(args, "--history-limit", opts.historyLimit);
	if (opts.deliver) args.push("--deliver");
	return args;
}
/** Launches a child TUI process with inherited stdio and setup-specific environment hints. */
async function launchTuiCli(opts, launchOptions = {}) {
	const args = buildTuiCliArgs(opts);
	const env = launchOptions.gatewayUrl || launchOptions.authSource ? {
		...process.env,
		...launchOptions.gatewayUrl ? { OPERATOR_GATEWAY_URL: launchOptions.gatewayUrl } : {},
		...launchOptions.authSource === "config" ? { [require_setup_launch_env.TUI_SETUP_AUTH_SOURCE_ENV]: require_setup_launch_env.TUI_SETUP_AUTH_SOURCE_CONFIG } : {}
	} : process.env;
	process.stdin.pause();
	await new Promise((resolve, reject) => {
		const child = (0, node_child_process.spawn)(process.execPath, args, {
			stdio: "inherit",
			env
		});
		const { detach } = attachChildProcessBridge(child);
		child.once("error", (error) => {
			detach();
			reject(/* @__PURE__ */ new Error(`failed to launch TUI: ${require_errors.formatErrorMessage(error)}`));
		});
		child.once("exit", (code, signal) => {
			detach();
			if (signal) {
				reject(/* @__PURE__ */ new Error(`TUI exited from signal ${signal}`));
				return;
			}
			if ((code ?? 0) !== 0) {
				reject(/* @__PURE__ */ new Error(`TUI exited with code ${code ?? 1}`));
				return;
			}
			resolve();
		});
	});
}
//#endregion
//#region src/wizard/setup.completion.ts
async function resolveProfileHint(shell) {
	const home = process.env.HOME || node_os.default.homedir();
	if (shell === "zsh") return "~/.zshrc";
	if (shell === "bash") return await require_utils.pathExists(node_path.default.join(home, ".bashrc")) ? "~/.bashrc" : "~/.bash_profile";
	if (shell === "fish") return "~/.config/fish/config.fish";
	return require_doctor_completion.resolveCompletionProfilePath("powershell");
}
function formatReloadHint(shell, profileHint) {
	if (shell === "powershell") return require_i18n.t("wizard.completion.reloadPowerShell", { command: require_doctor_completion.formatCompletionReloadCommand("powershell", profileHint) });
	return require_i18n.t("wizard.completion.reloadShell", { profile: profileHint });
}
async function setupWizardShellCompletion(params) {
	const deps = {
		resolveCliName: require_cli_name.resolveCliName,
		checkShellCompletionStatus: require_doctor_completion.checkShellCompletionStatus,
		ensureCompletionCacheExists: require_doctor_completion.ensureCompletionCacheExists,
		installCompletion: require_doctor_completion.installCompletion,
		...params.deps
	};
	const cliName = deps.resolveCliName();
	const completionStatus = await deps.checkShellCompletionStatus(cliName);
	const generationOptions = { generationMode: "full" };
	if (completionStatus.usesSlowPattern) {
		if (await deps.ensureCompletionCacheExists(cliName, generationOptions)) await deps.installCompletion(completionStatus.shell, true, cliName);
		return;
	}
	if (completionStatus.profileInstalled && !completionStatus.cacheExists) {
		await deps.ensureCompletionCacheExists(cliName, generationOptions);
		return;
	}
	if (!completionStatus.profileInstalled) {
		if (!(params.flow === "quickstart" ? true : await params.prompter.confirm({
			message: require_i18n.t("wizard.completion.enable", {
				shell: completionStatus.shell,
				cli: cliName
			}),
			initialValue: true
		}))) return;
		if (!await deps.ensureCompletionCacheExists(cliName, generationOptions)) {
			await params.prompter.note(require_i18n.t("wizard.completion.cacheFailed", { command: `${cliName} completion --install` }), require_i18n.t("wizard.completion.title"));
			return;
		}
		await deps.installCompletion(completionStatus.shell, true, cliName);
		const profileHint = await resolveProfileHint(completionStatus.shell);
		await params.prompter.note(require_i18n.t("wizard.completion.installed", { reloadHint: formatReloadHint(completionStatus.shell, profileHint) }), require_i18n.t("wizard.completion.title"));
	}
}
//#endregion
//#region src/wizard/setup.finalize.ts
const HATCH_TUI_TIMEOUT_MS = 300 * 1e3;
function buildSessionGatewayAuthOverride(params) {
	if (params.settings.authMode === "token" && params.settings.gatewayToken) return {
		...params.nextConfig.gateway?.auth,
		mode: "token",
		token: params.settings.gatewayToken
	};
	if (params.settings.authMode === "password" && params.resolvedGatewayPassword) return {
		...params.nextConfig.gateway?.auth,
		mode: "password",
		password: params.resolvedGatewayPassword
	};
	return params.nextConfig.gateway?.auth;
}
async function startSessionGatewayForOnboarding(params) {
	const progress = params.prompter.progress(require_i18n.t("wizard.finalize.sessionGatewayStarting"));
	try {
		const { startGatewayServer } = await Promise.resolve().then(() => require("./server-CgGgaPdE.cjs"));
		const server = await startGatewayServer(params.settings.port, {
			bind: params.settings.bind,
			...params.settings.bind === "custom" && params.settings.customBindHost ? { host: params.settings.customBindHost } : {},
			auth: buildSessionGatewayAuthOverride({
				nextConfig: params.nextConfig,
				settings: params.settings,
				resolvedGatewayPassword: params.resolvedGatewayPassword
			}),
			tailscale: params.nextConfig.gateway?.tailscale
		});
		progress.stop(require_i18n.t("wizard.finalize.sessionGatewayStarted"));
		return server;
	} catch (error) {
		progress.stop(require_i18n.t("wizard.finalize.sessionGatewayStartFailed"));
		await params.prompter.note([
			require_i18n.t("wizard.finalize.sessionGatewayStartFailed"),
			require_errors.formatErrorMessage(error),
			require_i18n.t("wizard.finalize.startGatewayNow", { command: require_command_format.formatCliCommand("operator gateway run") })
		].join("\n"), "Gateway");
		return;
	}
}
async function closeSessionGatewayForOnboarding(params) {
	await params.sessionGateway.close({ reason: params.reason }).catch((error) => {
		params.runtime.error(require_errors.formatErrorMessage(error));
	});
}
async function showControlUiDashboardNote(params) {
	let opened = false;
	let openHint;
	if ((await require_browser_open.detectBrowserOpenSupport()).ok) {
		opened = await require_browser_open.openUrl(params.authedUrl);
		if (!opened) openHint = require_onboard_helpers.formatControlUiSshHint({
			port: params.settings.port,
			basePath: params.controlUiBasePath,
			token: params.hintToken
		});
	} else openHint = require_onboard_helpers.formatControlUiSshHint({
		port: params.settings.port,
		basePath: params.controlUiBasePath,
		token: params.hintToken
	});
	await params.prompter.note([
		require_i18n.t("wizard.finalize.dashboardLinkWithToken", { url: params.authedUrl }),
		opened ? require_i18n.t("wizard.finalize.dashboardOpened") : require_i18n.t("wizard.finalize.dashboardCopyPaste"),
		openHint
	].filter(Boolean).join("\n"), require_i18n.t("wizard.finalize.dashboardReady"));
	return { opened };
}
function getLocalizedGatewayDaemonRuntimeOptions() {
	return require_daemon_runtime.GATEWAY_DAEMON_RUNTIME_OPTIONS.map((option) => ({
		hint: option.value === "node" ? require_i18n.t("wizard.finalize.daemonRuntimeNodeHint") : option.hint ?? void 0,
		label: option.value === "node" ? require_i18n.t("wizard.finalize.daemonRuntimeNode") : option.label,
		value: option.value
	}));
}
const loadOnboardSearchModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./onboard-search-7e_Eax2M.cjs")));
/**
* Ensure the gateway service matches the onboarding decision: prompt/decide
* whether to install the daemon, then install/restart/reinstall it. Shared by
* the classic wizard finalize and the bootstrap onboarding flow.
*/
async function ensureGatewayServiceForOnboarding(params) {
	const { flow, opts, nextConfig, settings, prompter, runtime } = params;
	const withWizardProgress = async (label, optionsLocal, work) => {
		const progress = prompter.progress(label);
		try {
			return await work(progress);
		} finally {
			progress.stop(typeof optionsLocal.doneMessage === "function" ? optionsLocal.doneMessage() : optionsLocal.doneMessage);
		}
	};
	const systemdAvailable = process.platform === "linux" ? await require_systemd.isSystemdUserServiceAvailable() : true;
	const linuxWithoutUserSystemd = process.platform === "linux" && !systemdAvailable;
	const containerWithoutUserSystemd = linuxWithoutUserSystemd && require_container_environment.isContainerEnvironment();
	if (linuxWithoutUserSystemd) await prompter.note(require_i18n.t(containerWithoutUserSystemd ? "wizard.finalize.containerSystemdUnavailable" : "wizard.finalize.systemdUnavailable"), containerWithoutUserSystemd ? require_i18n.t("wizard.finalize.containerRuntimeTitle") : "Systemd");
	if (process.platform === "linux" && systemdAvailable) {
		const { ensureSystemdUserLingerInteractive } = await Promise.resolve().then(() => require("./systemd-linger-Bd9aHAev.cjs"));
		await ensureSystemdUserLingerInteractive({
			runtime,
			prompter: {
				confirm: prompter.confirm,
				note: prompter.note
			},
			reason: require_i18n.t("wizard.finalize.systemdLingerReason"),
			requireConfirm: false
		});
	}
	const explicitInstallDaemon = typeof opts.installDaemon === "boolean" ? opts.installDaemon : void 0;
	let installDaemon;
	if (explicitInstallDaemon !== void 0) installDaemon = explicitInstallDaemon;
	else if (linuxWithoutUserSystemd) installDaemon = false;
	else if (flow === "quickstart") installDaemon = true;
	else installDaemon = await prompter.confirm({
		message: require_i18n.t("wizard.finalize.installGateway"),
		initialValue: true
	});
	if (linuxWithoutUserSystemd && installDaemon) {
		await prompter.note(require_i18n.t("wizard.finalize.systemdInstallSkipped"), require_i18n.t("wizard.finalize.gatewayService"));
		installDaemon = false;
	}
	if (installDaemon) {
		const daemonRuntime = flow === "quickstart" ? require_daemon_runtime.DEFAULT_GATEWAY_DAEMON_RUNTIME : await prompter.select({
			message: require_i18n.t("wizard.finalize.daemonRuntime"),
			options: getLocalizedGatewayDaemonRuntimeOptions(),
			initialValue: opts.daemonRuntime ?? "node"
		});
		if (flow === "quickstart") await prompter.note(require_i18n.t("wizard.finalize.quickstartNodeRuntime"), require_i18n.t("wizard.finalize.daemonRuntime"));
		const service = require_service.resolveGatewayService();
		const loaded = await service.isLoaded({ env: process.env });
		let restartWasScheduled = false;
		if (loaded) {
			const action = params.loadedAction ?? await prompter.select({
				message: require_i18n.t("wizard.finalize.alreadyInstalled"),
				options: [
					{
						value: "restart",
						label: require_i18n.t("wizard.finalize.restart")
					},
					{
						value: "reinstall",
						label: require_i18n.t("wizard.finalize.reinstall")
					},
					{
						value: "skip",
						label: require_i18n.t("common.skip")
					}
				]
			});
			if (action === "restart") {
				let restartDoneMessage = require_i18n.t("wizard.finalize.gatewayServiceRestarted");
				await withWizardProgress(require_i18n.t("wizard.finalize.gatewayService"), { doneMessage: () => restartDoneMessage }, async (progress) => {
					progress.update(require_i18n.t("wizard.finalize.gatewayServiceRestarting"));
					const restartStatus = require_service.describeGatewayServiceRestart("Gateway", await service.restart({
						env: process.env,
						stdout: process.stdout
					}));
					restartDoneMessage = restartStatus.scheduled ? require_i18n.t("wizard.finalize.gatewayServiceRestartScheduled") : require_i18n.t("wizard.finalize.gatewayServiceRestarted");
					restartWasScheduled = restartStatus.scheduled;
				});
			} else if (action === "reinstall") await withWizardProgress(require_i18n.t("wizard.finalize.gatewayService"), { doneMessage: require_i18n.t("wizard.finalize.gatewayServiceUninstalled") }, async (progress) => {
				progress.update(require_i18n.t("wizard.finalize.gatewayServiceUninstalling"));
				await service.uninstall({
					env: process.env,
					stdout: process.stdout
				});
			});
		}
		if (!loaded || !restartWasScheduled && loaded && !await service.isLoaded({ env: process.env })) {
			const progress = prompter.progress(require_i18n.t("wizard.finalize.gatewayService"));
			let installError = null;
			const installWarnings = [];
			const flushInstallWarnings = async () => {
				let warning;
				while ((warning = installWarnings.shift()) !== void 0) await prompter.note(warning.message, warning.title);
			};
			try {
				progress.update(require_i18n.t("wizard.finalize.gatewayServicePreparing"));
				const tokenResolution = await require_gateway_install_token.resolveGatewayInstallToken({
					config: nextConfig,
					env: process.env
				});
				for (const warning of tokenResolution.warnings) await prompter.note(warning, "Gateway service");
				if (tokenResolution.unavailableReason) installError = [
					require_i18n.t("wizard.finalize.gatewayInstallBlocked"),
					tokenResolution.unavailableReason,
					require_i18n.t("wizard.finalize.gatewayInstallFixAuth")
				].join(" ");
				else {
					const { programArguments, workingDirectory, environment, environmentValueSources } = await require_daemon_runtime.buildGatewayInstallPlan({
						env: process.env,
						port: settings.port,
						runtime: daemonRuntime,
						warn: (message, title) => {
							installWarnings.push({
								message,
								title
							});
						},
						config: nextConfig
					});
					await flushInstallWarnings();
					progress.update(require_i18n.t("wizard.finalize.gatewayServiceInstalling"));
					await service.install({
						env: process.env,
						stdout: process.stdout,
						programArguments,
						workingDirectory,
						environment,
						environmentValueSources
					});
				}
			} catch (err) {
				await flushInstallWarnings();
				installError = require_errors.formatErrorMessage(err);
			} finally {
				progress.stop(installError ? require_i18n.t("wizard.finalize.gatewayServiceInstallFailed") : require_i18n.t("wizard.finalize.gatewayServiceInstalled"));
			}
			if (installError) {
				await prompter.note(require_i18n.t("wizard.finalize.gatewayServiceInstallFailedWithError", { error: installError }), "Gateway");
				await prompter.note(require_daemon_runtime.gatewayInstallErrorHint(), "Gateway");
			}
		}
	}
	return {
		installDaemon,
		containerWithoutUserSystemd
	};
}
async function finalizeSetupWizard(options) {
	const { flow, opts, baseConfig, nextConfig, settings, prompter, runtime } = options;
	const suppressGatewayTokenOutput = opts.suppressGatewayTokenOutput === true;
	let gatewayProbe = { ok: true };
	let resolvedGatewayPassword = "";
	let sessionGateway;
	const { installDaemon, containerWithoutUserSystemd } = await ensureGatewayServiceForOnboarding({
		flow,
		opts,
		nextConfig,
		settings,
		prompter,
		runtime
	});
	if (settings.authMode === "password") try {
		resolvedGatewayPassword = await require_setup_secret_input.resolveSetupSecretInputString({
			config: nextConfig,
			value: nextConfig.gateway?.auth?.password,
			path: "gateway.auth.password",
			env: process.env
		}) ?? "";
	} catch (error) {
		await prompter.note([require_i18n.t("wizard.finalize.secretRefAuthFailed", { field: "gateway.auth.password" }), require_errors.formatErrorMessage(error)].join("\n"), require_i18n.t("wizard.gateway.auth"));
	}
	if (containerWithoutUserSystemd && !opts.skipUi) sessionGateway = await startSessionGatewayForOnboarding({
		nextConfig,
		settings,
		resolvedGatewayPassword,
		prompter
	});
	try {
		if (!opts.skipHealth) {
			const probeLinks = require_control_ui_links.resolveLocalControlUiProbeLinks({
				bind: nextConfig.gateway?.bind ?? "loopback",
				port: settings.port,
				customBindHost: nextConfig.gateway?.customBindHost,
				basePath: void 0,
				tlsEnabled: nextConfig.gateway?.tls?.enabled === true
			});
			gatewayProbe = await require_onboard_helpers.waitForGatewayReachable({
				url: probeLinks.wsUrl,
				token: settings.authMode === "token" ? settings.gatewayToken : void 0,
				password: settings.authMode === "password" ? resolvedGatewayPassword : void 0,
				deadlineMs: 15e3
			});
			if (gatewayProbe.ok) try {
				await require_health.healthCommand({
					json: false,
					timeoutMs: 1e4,
					config: settings.authMode === "token" && settings.gatewayToken ? {
						...nextConfig,
						gateway: {
							...nextConfig.gateway,
							auth: {
								...nextConfig.gateway?.auth,
								mode: "token",
								token: settings.gatewayToken
							}
						}
					} : nextConfig,
					token: settings.authMode === "token" ? settings.gatewayToken : void 0,
					password: settings.authMode === "password" ? resolvedGatewayPassword : void 0
				}, runtime);
			} catch (err) {
				runtime.error(require_health_format.formatHealthCheckFailure(err));
				await prompter.note([
					require_i18n.t("common.docs"),
					"https://docs.operator.ai/gateway/health",
					"https://docs.operator.ai/gateway/troubleshooting"
				].join("\n"), require_i18n.t("wizard.finalize.healthCheckHelp"));
			}
			else if (installDaemon) {
				runtime.error(require_health_format.formatHealthCheckFailure(new Error(gatewayProbe.detail ?? `gateway did not become reachable at ${probeLinks.wsUrl}`)));
				await prompter.note([
					require_i18n.t("common.docs"),
					"https://docs.operator.ai/gateway/health",
					"https://docs.operator.ai/gateway/troubleshooting"
				].join("\n"), require_i18n.t("wizard.finalize.healthCheckHelp"));
			} else await prompter.note([
				require_i18n.t("wizard.finalize.gatewayNotDetected"),
				require_i18n.t("wizard.finalize.noBackgroundGatewayExpected"),
				require_i18n.t("wizard.finalize.startGatewayNow", { command: require_command_format.formatCliCommand("operator gateway run") }),
				require_i18n.t("wizard.finalize.rerunInstallDaemon", { command: require_command_format.formatCliCommand("operator onboard --install-daemon") }),
				require_i18n.t("wizard.finalize.skipHealthNextTime", { command: require_command_format.formatCliCommand("operator onboard --skip-health") })
			].join("\n"), "Gateway");
		}
		const controlUiEnabled = nextConfig.gateway?.controlUi?.enabled ?? baseConfig.gateway?.controlUi?.enabled ?? true;
		if (!opts.skipUi && controlUiEnabled) {
			const controlUiAssets = await require_control_ui_assets.ensureControlUiAssetsBuilt(runtime);
			if (!controlUiAssets.ok && controlUiAssets.message) runtime.error(controlUiAssets.message);
		}
		await prompter.note([
			require_i18n.t("wizard.finalize.addNodes"),
			`- ${require_i18n.t("wizard.finalize.nodeMac")}`,
			`- ${require_i18n.t("wizard.finalize.nodeIos")}`,
			`- ${require_i18n.t("wizard.finalize.nodeAndroid")}`
		].join("\n"), require_i18n.t("wizard.finalize.optionalApps"));
		const controlUiBasePath = nextConfig.gateway?.controlUi?.basePath ?? baseConfig.gateway?.controlUi?.basePath;
		const displayLinks = await require_control_ui_links.resolveAdvertisedControlUiLinks({
			bind: settings.bind,
			port: settings.port,
			customBindHost: settings.customBindHost,
			basePath: controlUiBasePath,
			tlsEnabled: nextConfig.gateway?.tls?.enabled === true
		});
		const probeLinks = require_control_ui_links.resolveLocalControlUiProbeLinks({
			bind: settings.bind,
			port: settings.port,
			customBindHost: settings.customBindHost,
			basePath: controlUiBasePath,
			tlsEnabled: nextConfig.gateway?.tls?.enabled === true
		});
		const authedUrl = settings.authMode === "token" && settings.gatewayToken && !suppressGatewayTokenOutput ? `${displayLinks.httpUrl}#token=${encodeURIComponent(settings.gatewayToken)}` : displayLinks.httpUrl;
		if (opts.skipHealth || !gatewayProbe.ok) gatewayProbe = await require_onboard_helpers.probeGatewayReachable({
			url: probeLinks.wsUrl,
			token: settings.authMode === "token" ? settings.gatewayToken : void 0,
			password: settings.authMode === "password" ? resolvedGatewayPassword : ""
		});
		const gatewayStatusLine = gatewayProbe.ok ? require_i18n.t("wizard.finalize.gatewayReachable") : require_i18n.t("wizard.finalize.gatewayNotDetectedStatus", { detail: gatewayProbe.detail ? ` (${gatewayProbe.detail})` : "" });
		const windowsFirewallLines = require_windows_gateway_firewall_diagnostics.formatWindowsGatewayFirewallGuidance({ bind: settings.bind });
		const bootstrapPath = node_path.default.join(require_home_dir.resolveUserPath(options.workspaceDir), require_workspace.DEFAULT_BOOTSTRAP_FILENAME);
		const hasBootstrap = await node_fs_promises.default.access(bootstrapPath).then(() => true).catch(() => false);
		const agentDir = require_agent_scope_config.resolveDefaultAgentDir(nextConfig);
		const [{ resolveDefaultModelAuthStatus, resolveDefaultModelCatalogFacts }, { loadModelCatalogSnapshot }] = await Promise.all([Promise.resolve().then(() => require("./auth-choice-D4L_IVSJ.cjs")), Promise.resolve().then(() => require("./model-catalog-BFgB2-Jk.cjs")).then((n) => n.model_catalog_exports)]);
		const modelCatalog = await loadModelCatalogSnapshot({
			config: nextConfig,
			readOnly: true
		});
		const modelCatalogFacts = resolveDefaultModelCatalogFacts(nextConfig, modelCatalog.entries, { routeVariants: modelCatalog.routeVariants });
		const modelAuthStatus = resolveDefaultModelAuthStatus(nextConfig, {
			agentDir,
			...modelCatalogFacts.observedRoutes ? { observedRoutes: modelCatalogFacts.observedRoutes } : {}
		});
		const shouldSeedBootstrapHatch = hasBootstrap && options.hadExistingConfig !== true && modelAuthStatus.status === "ready";
		await prompter.note([
			require_i18n.t("wizard.finalize.webUiUrl", { url: displayLinks.httpUrl }),
			settings.authMode === "token" && settings.gatewayToken && !suppressGatewayTokenOutput ? require_i18n.t("wizard.finalize.webUiWithTokenUrl", { url: authedUrl }) : void 0,
			require_i18n.t("wizard.finalize.gatewayWsUrl", { url: displayLinks.wsUrl }),
			gatewayStatusLine,
			...windowsFirewallLines,
			require_i18n.t("wizard.finalize.controlUiDocs")
		].filter(Boolean).join("\n"), "Control UI");
		let controlUiOpened = false;
		let launchedTui = false;
		const shouldLaunchTui = !opts.skipUi;
		if (shouldLaunchTui) {
			if (hasBootstrap) await prompter.note([
				require_i18n.t("wizard.finalize.workspaceReady"),
				...shouldSeedBootstrapHatch ? [require_i18n.t("wizard.finalize.firstTerminalChat")] : [],
				require_i18n.t("wizard.finalize.editBootstrap")
			].join("\n"), require_i18n.t("wizard.finalize.hatchYourAgent"));
			if (modelAuthStatus.status === "missing") await prompter.note([require_i18n.t("wizard.finalize.noModelAuth", { provider: modelAuthStatus.provider }), require_i18n.t("wizard.finalize.noModelAuthNext", { command: require_command_format.formatCliCommand("operator configure --section model") })].join("\n"), require_i18n.t("wizard.finalize.noModelAuthTitle"));
			if (gatewayProbe.ok) {
				const tokenNotes = [
					require_i18n.t("wizard.finalize.gatewayTokenShared"),
					require_i18n.t("wizard.finalize.gatewayTokenStored"),
					require_i18n.t("wizard.finalize.gatewayTokenView", { command: require_command_format.formatCliCommand("operator config get gateway.auth.token") }),
					require_i18n.t("wizard.finalize.gatewayTokenGenerate", { command: require_command_format.formatCliCommand("operator doctor --generate-gateway-token") }),
					suppressGatewayTokenOutput ? void 0 : require_i18n.t("wizard.finalize.dashboardTokenMemory"),
					require_i18n.t("wizard.finalize.dashboardOpenAnytime", { command: require_command_format.formatCliCommand("operator dashboard --no-open") }),
					suppressGatewayTokenOutput ? void 0 : require_i18n.t("wizard.finalize.dashboardTokenPrompt")
				].filter(Boolean);
				await prompter.note(tokenNotes.join("\n"), "Token");
			}
		} else if (opts.skipUi) await prompter.note(require_i18n.t("wizard.finalize.skipControlUi"), require_i18n.t("wizard.finalize.controlUiTitle"));
		await prompter.note([require_i18n.t("wizard.finalize.backupWorkspace"), require_i18n.t("wizard.finalize.workspaceDocs")].join("\n"), require_i18n.t("wizard.finalize.workspaceBackupTitle"));
		await prompter.note(require_i18n.t("wizard.finalize.securityReminder"), require_i18n.t("wizard.security.title"));
		await setupWizardShellCompletion({
			flow,
			prompter
		});
		if (!opts.skipUi && gatewayProbe.ok && settings.authMode === "token" && Boolean(settings.gatewayToken) && !suppressGatewayTokenOutput && !shouldLaunchTui) controlUiOpened = (await showControlUiDashboardNote({
			prompter,
			settings,
			authedUrl,
			controlUiBasePath,
			hintToken: settings.gatewayToken
		})).opened;
		const codexNativeSummary = require_codex_native_web_search_shared.describeCodexNativeWebSearch(nextConfig);
		const webSearchProvider = nextConfig.tools?.web?.search?.provider;
		const webSearchEnabled = nextConfig.tools?.web?.search?.enabled;
		const configuredSearchProviders = require_runtime$1.listConfiguredWebSearchProviders({ config: nextConfig });
		if (webSearchProvider) {
			const { resolveExistingKey, hasExistingKey, hasKeyInEnv } = await loadOnboardSearchModule();
			const entry = configuredSearchProviders.find((e) => e.id === webSearchProvider);
			const label = entry?.label ?? webSearchProvider;
			const storedKey = entry ? resolveExistingKey(nextConfig, webSearchProvider) : void 0;
			const keyConfigured = entry ? hasExistingKey(nextConfig, webSearchProvider) : false;
			const envAvailable = entry ? hasKeyInEnv(entry) : false;
			const hasKey = keyConfigured || envAvailable;
			const authProviderId = entry?.authProviderId?.trim();
			const authProviderLabel = authProviderId === "xai" ? "xAI" : authProviderId;
			const providerAuthProfileAvailable = authProviderId ? require_model_config_helpers.hasAuthProfileForProvider({
				provider: authProviderId,
				agentDir
			}) : false;
			const oauthAuthProfileAvailable = authProviderId && providerAuthProfileAvailable ? require_model_config_helpers.hasAuthProfileForProvider({
				provider: authProviderId,
				agentDir,
				type: "oauth"
			}) : false;
			const hasCredential = hasKey || providerAuthProfileAvailable;
			const keySource = storedKey ? require_i18n.t("wizard.finalize.webSearchKeyStored") : keyConfigured ? require_i18n.t("wizard.finalize.webSearchKeyRef") : envAvailable ? require_i18n.t("wizard.finalize.webSearchKeyEnv", { env: entry?.envVars.join(" / ") ?? "" }) : oauthAuthProfileAvailable && authProviderLabel ? require_i18n.t("wizard.finalize.webSearchOAuthProfile", { provider: authProviderLabel }) : providerAuthProfileAvailable && authProviderLabel ? require_i18n.t("wizard.finalize.webSearchAuthProfile", { provider: authProviderLabel }) : void 0;
			if (!entry) await prompter.note([
				require_i18n.t("wizard.finalize.webSearchProviderUnavailable", { provider: label }),
				require_i18n.t("wizard.finalize.webSearchUnavailableAction"),
				`  ${require_command_format.formatCliCommand("operator configure --section web")}`,
				"",
				require_i18n.t("wizard.finalize.webDocs")
			].join("\n"), require_i18n.t("wizard.finalize.webSearchTitle"));
			else if (webSearchEnabled !== false && entry.requiresCredential === false) await prompter.note([
				require_i18n.t("wizard.finalize.webSearchKeyFree"),
				"",
				require_i18n.t("wizard.finalize.webSearchProvider", { provider: label }),
				require_i18n.t("wizard.finalize.webDocs")
			].join("\n"), require_i18n.t("wizard.finalize.webSearchTitle"));
			else if (webSearchEnabled !== false && hasCredential) await prompter.note([
				require_i18n.t("wizard.finalize.webSearchEnabled"),
				"",
				require_i18n.t("wizard.finalize.webSearchProvider", { provider: label }),
				...keySource ? [keySource] : [],
				require_i18n.t("wizard.finalize.webDocs")
			].join("\n"), require_i18n.t("wizard.finalize.webSearchTitle"));
			else if (entry.requiresCredential !== false && !hasCredential) await prompter.note([
				require_i18n.t("wizard.finalize.webSearchNoKey", { provider: label }),
				require_i18n.t("wizard.finalize.webSearchNeedsKey"),
				`  ${require_command_format.formatCliCommand("operator configure --section web")}`,
				"",
				require_i18n.t("wizard.finalize.webSearchGetKey", { url: entry?.signupUrl ?? "https://docs.operator.ai/tools/web" }),
				require_i18n.t("wizard.finalize.webDocs")
			].join("\n"), require_i18n.t("wizard.finalize.webSearchTitle"));
			else await prompter.note([
				require_i18n.t("wizard.finalize.webSearchDisabled", { provider: label }),
				require_i18n.t("wizard.finalize.webSearchReenable", { command: require_command_format.formatCliCommand("operator configure --section web") }),
				"",
				require_i18n.t("wizard.finalize.webDocs")
			].join("\n"), require_i18n.t("wizard.finalize.webSearchTitle"));
		} else {
			const { hasExistingKey, hasKeyInEnv } = await loadOnboardSearchModule();
			const legacyDetected = configuredSearchProviders.find((e) => hasExistingKey(nextConfig, e.id) || hasKeyInEnv(e));
			if (legacyDetected) await prompter.note([require_i18n.t("wizard.finalize.webSearchAutoDetected", { provider: legacyDetected.label }), require_i18n.t("wizard.finalize.webDocs")].join("\n"), require_i18n.t("wizard.finalize.webSearchTitle"));
			else if (codexNativeSummary) await prompter.note([
				require_i18n.t("wizard.finalize.managedWebSearchSkipped"),
				codexNativeSummary,
				require_i18n.t("wizard.finalize.webDocs")
			].join("\n"), require_i18n.t("wizard.finalize.webSearchTitle"));
			else await prompter.note([
				require_i18n.t("wizard.finalize.webSearchSkipped"),
				`  ${require_command_format.formatCliCommand("operator configure --section web")}`,
				"",
				require_i18n.t("wizard.finalize.webDocs")
			].join("\n"), require_i18n.t("wizard.finalize.webSearchTitle"));
		}
		if (codexNativeSummary) await prompter.note([
			codexNativeSummary,
			require_i18n.t("wizard.finalize.codexNativeSearchOnly"),
			require_i18n.t("wizard.finalize.webDocs")
		].join("\n"), require_i18n.t("wizard.finalize.codexNativeSearchTitle"));
		await prompter.note(require_i18n.t("wizard.finalize.whatNow"), require_i18n.t("wizard.finalize.whatNowTitle"));
		await prompter.outro(controlUiOpened ? require_i18n.t("wizard.finalize.outroDashboardOpened") : require_i18n.t("wizard.finalize.outroDashboardLink"));
		if (shouldLaunchTui) {
			require_runtime.restoreTerminalState("pre-setup tui", { resumeStdinIfPaused: false });
			try {
				await launchTuiCli({
					...gatewayProbe.ok ? {} : { local: true },
					deliver: false,
					message: shouldSeedBootstrapHatch ? require_i18n.t("wizard.finalize.bootstrapHatchMessage") : void 0,
					timeoutMs: HATCH_TUI_TIMEOUT_MS
				}, gatewayProbe.ok ? {
					gatewayUrl: displayLinks.wsUrl,
					authSource: "config"
				} : {});
			} finally {
				require_runtime.restoreTerminalState("post-setup tui", { resumeStdinIfPaused: false });
				if (sessionGateway) {
					await closeSessionGatewayForOnboarding({
						sessionGateway,
						runtime,
						reason: "onboarding tui exited"
					});
					sessionGateway = void 0;
				}
			}
			launchedTui = true;
		}
		return { launchedTui };
	} finally {
		if (sessionGateway) await closeSessionGatewayForOnboarding({
			sessionGateway,
			runtime,
			reason: "onboarding finalize exited"
		});
	}
}
//#endregion
exports.ensureGatewayServiceForOnboarding = ensureGatewayServiceForOnboarding;
exports.finalizeSetupWizard = finalizeSetupWizard;
