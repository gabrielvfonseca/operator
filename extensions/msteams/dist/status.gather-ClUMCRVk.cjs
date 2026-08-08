const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_credential_planner = require("./credential-planner-DkEqYEWZ.cjs");
require("./credentials-CNHX5M4G.cjs");
const require_credentials_secret_inputs = require("./credentials-secret-inputs-WHVXyyR_.cjs");
const require_secret_input_paths = require("./secret-input-paths-DhtBjpGq.cjs");
const require_ports = require("./ports-DVTOW6GH.cjs");
const require_service = require("./service-BJLcDrM4.cjs");
const require_shared = require("./shared-C1JZRdJs.cjs");
const require_probe_auth = require("./probe-auth-bAQnhTXC.cjs");
const require_diagnostics = require("./diagnostics-DtsXjNEN.cjs");
const require_network_discovery_display = require("./network-discovery-display-CrYyDxeY.cjs");
const require_control_ui_links = require("./control-ui-links-CSNzE0Jo.cjs");
const require_restart_handoff = require("./restart-handoff-Cr8OzXsJ.cjs");
const require_windows_gateway_firewall_diagnostics = require("./windows-gateway-firewall-diagnostics-CLeXydMX.cjs");
const require_plugin_version_drift = require("./plugin-version-drift-BspGrHBn.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let json5 = require("json5");
json5 = require_rolldown_runtime.__toESM(json5, 1);
//#region src/logging/log-file-path.ts
function resolveDefaultRollingLogFile(date = /* @__PURE__ */ new Date()) {
	const logDir = require_logger.canUseNodeFs() ? require_tmp_operator_dir.resolvePreferredOperatorTmpDir() : require_tmp_operator_dir.POSIX_OPERATOR_TMP_DIR;
	return node_path.default.join(logDir, `${require_logger.LOG_PREFIX}-${require_logger.formatLocalDate(date)}${require_logger.LOG_SUFFIX}`);
}
/** Resolves the configured log file or today's rolling default log path. */
function resolveConfiguredLogFilePath(config) {
	return config?.logging?.file ?? resolveDefaultRollingLogFile();
}
//#endregion
//#region src/cli/daemon-cli/status.gather.ts
const gatewayProbeAuthModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./probe-auth-bAQnhTXC.cjs")).then((n) => n.probe_auth_exports));
const daemonInspectModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./inspect-Dj9g7PTQ.cjs")));
const launchdModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./launchd-dIaeSQPq.cjs")).then((n) => n.launchd_exports));
const serviceAuditModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./service-audit-cEQw0kNl.cjs")).then((n) => n.service_audit_exports));
const gatewayTlsModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./gateway-D0GINOqE.cjs")).then((n) => n.gateway_exports));
const daemonProbeModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./probe-ABDDskKE.cjs")).then((n) => n.probe_exports));
const restartHealthModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./restart-health-DXl230D5.cjs")));
function loadGatewayProbeAuthModule() {
	return gatewayProbeAuthModuleLoader.load();
}
function loadDaemonInspectModule() {
	return daemonInspectModuleLoader.load();
}
function loadLaunchdModule() {
	return launchdModuleLoader.load();
}
function loadServiceAuditModule() {
	return serviceAuditModuleLoader.load();
}
function loadGatewayTlsModule() {
	return gatewayTlsModuleLoader.load();
}
function loadDaemonProbeModule() {
	return daemonProbeModuleLoader.load();
}
function loadRestartHealthModule() {
	return restartHealthModuleLoader.load();
}
function resolveSnapshotRuntimeConfig(snapshot) {
	if (!snapshot?.valid || !snapshot.runtimeConfig) return null;
	return snapshot.runtimeConfig;
}
function coerceStatusConfig(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};
	return value;
}
function hasOwnKey(value, key) {
	return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.hasOwn(value, key));
}
function needsFullStatusConfigRead(raw, parsed) {
	return raw.includes("$include") || raw.includes("${") || hasOwnKey(parsed, "env");
}
async function readFastStatusConfig(configPath) {
	let raw;
	try {
		raw = await node_fs_promises.default.readFile(configPath, "utf8");
	} catch {
		return null;
	}
	let parsed;
	try {
		parsed = json5.default.parse(raw);
	} catch (err) {
		return {
			summary: {
				path: configPath,
				exists: true,
				valid: false,
				issues: [{
					path: "",
					message: `JSON5 parse failed: ${String(err)}`
				}]
			},
			cfg: {},
			mode: "fast"
		};
	}
	if (needsFullStatusConfigRead(raw, parsed)) return null;
	const cfg = coerceStatusConfig(parsed);
	return {
		summary: {
			path: configPath,
			exists: true,
			valid: true,
			controlUi: cfg.gateway?.controlUi
		},
		cfg,
		mode: "fast"
	};
}
async function readFullStatusConfig(params) {
	const io = require_io.createConfigIO({
		env: params.env,
		configPath: params.configPath,
		pluginValidation: params.pluginValidation ?? "skip",
		logger: {
			error: () => {},
			warn: () => {}
		}
	});
	const snapshot = await io.readConfigFileSnapshot().catch(() => null);
	const cfg = resolveSnapshotRuntimeConfig(snapshot) ?? io.loadConfig();
	return {
		summary: {
			path: snapshot?.path ?? params.configPath,
			exists: snapshot?.exists ?? false,
			valid: snapshot?.valid ?? true,
			...snapshot?.issues?.length ? { issues: snapshot.issues } : {},
			...snapshot?.warnings?.length ? { warnings: snapshot.warnings } : {},
			controlUi: cfg.gateway?.controlUi
		},
		cfg,
		mode: "full"
	};
}
async function readStatusConfig(params) {
	return (params.deep ? null : await readFastStatusConfig(params.configPath)) ?? await readFullStatusConfig({
		env: params.env,
		configPath: params.configPath,
		pluginValidation: params.deep ? "full" : "skip"
	});
}
function appendProbeNote(existing, extra) {
	const values = [existing, extra].filter((value) => Boolean(value?.trim()));
	if (values.length === 0) return;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(values).join(" ");
}
function resolveCliStatusSummary(argv = process.argv) {
	const entrypoint = argv[1]?.trim();
	return {
		version: require_version.VERSION,
		...entrypoint ? { entrypoint } : {}
	};
}
async function loadDaemonConfigContext(serviceEnv, opts = {}) {
	const mergedDaemonEnv = {
		...process.env,
		...serviceEnv ?? void 0
	};
	const cliConfigPath = require_paths.resolveConfigPath(process.env, require_paths.resolveStateDir(process.env));
	const daemonConfigPath = require_paths.resolveConfigPath(mergedDaemonEnv, require_paths.resolveStateDir(mergedDaemonEnv));
	const sameConfigPath = cliConfigPath === daemonConfigPath;
	const cliConfigRead = await readStatusConfig({
		env: process.env,
		configPath: cliConfigPath,
		deep: opts.deep
	});
	const daemonConfigRead = sameConfigPath && (cliConfigRead.mode === "fast" || !serviceEnv) ? cliConfigRead : await readStatusConfig({
		env: mergedDaemonEnv,
		configPath: daemonConfigPath,
		deep: opts.deep
	});
	return {
		mergedDaemonEnv,
		cliCfg: cliConfigRead.cfg,
		daemonCfg: daemonConfigRead.cfg,
		cliConfigSummary: cliConfigRead.summary,
		daemonConfigSummary: daemonConfigRead.summary,
		configMismatch: cliConfigRead.summary.path !== daemonConfigRead.summary.path
	};
}
async function resolveGatewayStatusSummary(params) {
	const portFromArgs = require_shared.parsePortFromArgs(params.commandProgramArguments);
	const daemonPort = portFromArgs ?? require_paths.resolveGatewayPort(params.daemonCfg, params.mergedDaemonEnv);
	const portSource = portFromArgs ? "service args" : "env/config";
	const bindMode = params.daemonCfg.gateway?.bind ?? "loopback";
	const customBindHost = params.daemonCfg.gateway?.customBindHost;
	const { bindHost, warning: bindHostWarning } = await require_network_discovery_display.resolveBestEffortGatewayBindHostForDisplay({
		bindMode,
		customBindHost,
		warningPrefix: "Status is using fallback network details because interface discovery failed"
	});
	const { tailnetIPv4, warning: tailnetWarning } = require_network_discovery_display.inspectBestEffortPrimaryTailnetIPv4({ warningPrefix: "Status could not inspect tailnet addresses" });
	const probeHost = require_shared.pickProbeHostForBind(bindMode, tailnetIPv4, customBindHost);
	const probeUrlOverride = require_credential_planner.trimToUndefined(params.rpcUrlOverride) ?? null;
	const tlsEnabled = params.daemonCfg.gateway?.tls?.enabled === true;
	const probeUrl = probeUrlOverride ?? `${tlsEnabled ? "wss" : "ws"}://${probeHost}:${daemonPort}`;
	const controlUiLinks = params.daemonCfg.gateway?.controlUi?.enabled === false ? void 0 : await require_control_ui_links.resolveAdvertisedControlUiLinks({
		port: daemonPort,
		bind: bindMode,
		customBindHost,
		basePath: params.daemonCfg.gateway?.controlUi?.basePath,
		tlsEnabled
	});
	let probeNote = !probeUrlOverride && bindMode === "lan" ? `bind=lan listens on 0.0.0.0 (all interfaces); probing via ${probeHost}.` : !probeUrlOverride && bindMode === "loopback" ? "Loopback-only gateway; only local clients can connect." : void 0;
	probeNote = appendProbeNote(probeNote, bindHostWarning);
	probeNote = appendProbeNote(probeNote, tailnetWarning);
	return {
		gateway: {
			bindMode,
			bindHost,
			customBindHost,
			...tlsEnabled ? { tlsEnabled } : {},
			port: daemonPort,
			portSource,
			probeUrl,
			...controlUiLinks ? { controlUiLinks } : {},
			...probeNote ? { probeNote } : {}
		},
		daemonPort,
		cliPort: require_paths.resolveGatewayPort(params.cliCfg, process.env),
		probeUrlOverride
	};
}
function toPortStatusSummary(diagnostics) {
	if (!diagnostics) return;
	return {
		port: diagnostics.port,
		status: diagnostics.status,
		listeners: diagnostics.listeners,
		hints: diagnostics.hints
	};
}
async function inspectDaemonPortStatuses(params) {
	const [portDiagnostics, portCliDiagnostics] = await Promise.all([require_ports.inspectPortUsage(params.daemonPort).catch(() => null), params.cliPort !== params.daemonPort ? require_ports.inspectPortUsage(params.cliPort).catch(() => null) : null]);
	return {
		portStatus: toPortStatusSummary(portDiagnostics),
		portCliStatus: toPortStatusSummary(portCliDiagnostics)
	};
}
async function inspectEstablishedGatewayClients(params) {
	if (params.deep !== true || params.gatewayMode === "remote") return;
	const result = await require_ports.inspectPortConnections(params.daemonPort).catch(() => null);
	const establishedClients = result?.connections.filter((connection) => connection.direction !== "server");
	if (!result || !establishedClients || establishedClients.length === 0) return;
	return {
		port: result.port,
		established: establishedClients
	};
}
function hasActiveGatewayExecProbeCredential(params) {
	const cfg = require_probe_auth.resolveGatewayProbeCredentialConfig({
		cfg: params.cfg,
		mode: params.mode
	});
	return require_secret_input_paths.ALL_GATEWAY_SECRET_INPUT_PATHS.some((path) => {
		if (!require_credentials_secret_inputs.gatewaySecretInputPathCanWin({
			config: cfg,
			env: params.env,
			explicitAuth: params.explicitAuth,
			modeOverride: params.mode,
			path,
			remoteTokenFallback: "remote-only"
		})) return false;
		return require_types_secrets.resolveSecretInputRef({
			value: require_secret_input_paths.readGatewaySecretInputValue(cfg, path),
			defaults: cfg.secrets?.defaults
		}).ref?.source === "exec";
	});
}
async function gatherDaemonStatus(opts) {
	const service = require_service.resolveGatewayService();
	const command = await service.readCommand(process.env).catch(() => null);
	const serviceEnv = command?.environment ? {
		...process.env,
		...command.environment
	} : process.env;
	const [loaded, runtime] = await Promise.all([service.isLoaded({ env: serviceEnv }).catch(() => false), service.readRuntime(serviceEnv).catch((err) => ({
		status: "unknown",
		detail: String(err)
	}))]);
	const restartHandoff = opts.deep ? require_restart_handoff.readGatewayRestartHandoffSync(serviceEnv) : null;
	const configAudit = command ? await loadServiceAuditModule().then(({ auditGatewayServiceConfig }) => auditGatewayServiceConfig({
		env: process.env,
		command
	})) : {
		ok: true,
		issues: []
	};
	const { mergedDaemonEnv, cliCfg, daemonCfg, cliConfigSummary, daemonConfigSummary, configMismatch } = await loadDaemonConfigContext(command?.environment, { deep: opts.deep });
	const { gateway, daemonPort, cliPort, probeUrlOverride } = await resolveGatewayStatusSummary({
		cliCfg,
		daemonCfg,
		mergedDaemonEnv,
		commandProgramArguments: command?.programArguments,
		rpcUrlOverride: opts.rpc.url
	});
	const shouldInspectLocalGateway = daemonCfg.gateway?.mode !== "remote" && !probeUrlOverride;
	const windowsFirewall = opts.deep === true && shouldInspectLocalGateway ? await require_windows_gateway_firewall_diagnostics.inspectWindowsGatewayFirewall({
		bind: gateway.bindMode,
		mode: "quick",
		port: daemonPort,
		platform: process.platform
	}) : void 0;
	const { portStatus, portCliStatus } = await inspectDaemonPortStatuses({
		daemonPort,
		cliPort
	});
	const establishedClients = await inspectEstablishedGatewayClients({
		daemonPort,
		deep: opts.deep,
		gatewayMode: daemonCfg.gateway?.mode
	});
	const extraServices = opts.deep ? await loadDaemonInspectModule().then(({ findExtraGatewayServices }) => findExtraGatewayServices(process.env, { deep: true })).catch(() => []) : [];
	const staleUpdateLaunchdJobs = opts.deep && process.platform === "darwin" ? await loadLaunchdModule().then(({ findStaleOperatorUpdateLaunchdJobs }) => findStaleOperatorUpdateLaunchdJobs(serviceEnv)).catch(() => []) : [];
	const timeoutMs = require_parse_finite_number.parseStrictPositiveInteger(opts.rpc.timeout ?? void 0) ?? Math.max(1e4, daemonCfg.gateway?.handshakeTimeoutMs ?? 0);
	const tlsEnabled = daemonCfg.gateway?.tls?.enabled === true;
	const shouldUseLocalTlsRuntime = opts.probe && !probeUrlOverride && tlsEnabled;
	const tlsRuntime = shouldUseLocalTlsRuntime ? await loadGatewayTlsModule().then(({ loadGatewayTlsRuntime }) => loadGatewayTlsRuntime(daemonCfg.gateway?.tls)) : void 0;
	let daemonProbeAuth;
	let rpcAuthWarning;
	let allowRpcConfigCredentials = true;
	let skippedProbeAuthForDisabledExecSecretRef = false;
	if (opts.probe) {
		const probeMode = daemonCfg.gateway?.mode === "remote" ? "remote" : "local";
		const explicitAuth = {
			token: opts.rpc.token,
			password: opts.rpc.password
		};
		if (opts.allowExecSecretRefs !== false || !hasActiveGatewayExecProbeCredential({
			cfg: daemonCfg,
			env: mergedDaemonEnv,
			explicitAuth,
			mode: probeMode
		})) {
			const probeAuthResolution = await loadGatewayProbeAuthModule().then(({ resolveGatewayProbeAuthSafeWithSecretInputs }) => resolveGatewayProbeAuthSafeWithSecretInputs({
				cfg: daemonCfg,
				mode: probeMode,
				env: mergedDaemonEnv,
				explicitAuth
			}));
			daemonProbeAuth = probeAuthResolution.auth;
			rpcAuthWarning = probeAuthResolution.warning;
		} else {
			allowRpcConfigCredentials = false;
			skippedProbeAuthForDisabledExecSecretRef = true;
			rpcAuthWarning = "Gateway probe auth skipped because gateway credentials use an exec SecretRef and exec SecretRefs are disabled for this status request.";
		}
	}
	const rpc = opts.probe ? await loadDaemonProbeModule().then(({ probeGatewayStatus }) => probeGatewayStatus({
		url: gateway.probeUrl,
		token: daemonProbeAuth?.token,
		password: daemonProbeAuth?.password,
		config: daemonCfg,
		tlsFingerprint: shouldUseLocalTlsRuntime && tlsRuntime?.enabled ? tlsRuntime.fingerprintSha256 : void 0,
		preauthHandshakeTimeoutMs: daemonCfg.gateway?.handshakeTimeoutMs,
		timeoutMs,
		json: opts.rpc.json,
		requireRpc: opts.requireRpc,
		allowRpcConfigCredentials,
		configPath: daemonConfigSummary.path
	})) : void 0;
	if (rpc?.ok && !skippedProbeAuthForDisabledExecSecretRef) rpcAuthWarning = void 0;
	const health = opts.probe && loaded && rpc?.ok !== true ? await loadRestartHealthModule().then(({ inspectGatewayRestart }) => inspectGatewayRestart({
		service,
		port: daemonPort,
		env: serviceEnv
	})).catch(() => void 0) : void 0;
	const gatewayVersion = opts.probe ? (rpc && "server" in rpc ? rpc.server?.version : void 0) ?? (rpc && "version" in rpc ? rpc.version : void 0) ?? null : void 0;
	let lastError;
	if (shouldInspectLocalGateway && loaded && runtime?.status === "running" && portStatus && (portStatus.status !== "busy" || rpc?.ok === false)) lastError = await require_diagnostics.readLastGatewayErrorLine(mergedDaemonEnv, { requirePatternMatch: portStatus.status === "busy" }) ?? void 0;
	let pluginVersionDrift;
	if (shouldInspectLocalGateway) try {
		const installRecords = await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords({ env: mergedDaemonEnv });
		pluginVersionDrift = require_plugin_version_drift.detectPluginVersionDrift({
			gatewayVersion: gatewayVersion ?? require_version.VERSION,
			installRecords,
			config: daemonCfg
		});
	} catch {
		pluginVersionDrift = void 0;
	}
	return {
		cli: resolveCliStatusSummary(),
		logFile: resolveConfiguredLogFilePath(cliCfg),
		service: {
			label: service.label,
			loaded,
			loadedText: service.loadedText,
			notLoadedText: service.notLoadedText,
			command,
			runtime,
			configAudit,
			...restartHandoff ? { restartHandoff } : {},
			...staleUpdateLaunchdJobs.length > 0 ? { staleUpdateLaunchdJobs } : {}
		},
		config: {
			cli: cliConfigSummary,
			daemon: daemonConfigSummary,
			...configMismatch ? { mismatch: true } : {}
		},
		gateway: {
			...gateway,
			...windowsFirewall?.applies ? { windowsFirewall } : {},
			...opts.probe ? { version: gatewayVersion } : {}
		},
		port: portStatus,
		...portCliStatus ? { portCli: portCliStatus } : {},
		...establishedClients ? { connections: establishedClients } : {},
		lastError,
		...rpc ? { rpc: {
			...rpc,
			url: gateway.probeUrl,
			...rpcAuthWarning ? { authWarning: rpcAuthWarning } : {}
		} } : {},
		...health ? { health: {
			healthy: health.healthy,
			staleGatewayPids: health.staleGatewayPids
		} } : {},
		extraServices,
		...pluginVersionDrift ? { pluginVersionDrift } : {}
	};
}
//#endregion
exports.gatherDaemonStatus = gatherDaemonStatus;
