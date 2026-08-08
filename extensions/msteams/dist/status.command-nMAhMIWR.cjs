const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_safe_text = require("./safe-text-BAHCZAPT.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_connect_error_details = require("./connect-error-details-lz40g7i9.cjs");
const require_restart_sentinel = require("./restart-sentinel-BH8dJFkM.cjs");
const require_program_args = require("./program-args-YjZGo5sC.cjs");
const require_progress = require("./progress-JkW4pQSo.cjs");
const require_status_gateway_connection = require("./status.gateway-connection-qfCMWvtt.cjs");
const require_format = require("./format-Y6on_ttU.cjs");
const require_text_report = require("./text-report-Dqcz9HOW.cjs");
const require_channels_table = require("./channels-table-CCPwjWsS.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/commands/status-json-payload.ts
/** Combines scan summary, overview surface, services, agents, diagnostics, and optional deep probes. */
function buildStatusJsonPayload(params) {
	const channelInfo = require_format.resolveStatusUpdateChannelInfo({
		updateConfigChannel: params.surface.cfg.update?.channel ?? void 0,
		update: params.surface.update
	});
	return {
		...params.summary,
		os: params.osSummary,
		update: params.surface.update,
		updateChannel: channelInfo.channel,
		updateChannelSource: channelInfo.source,
		memory: params.memory,
		memoryPlugin: params.memoryPlugin,
		gateway: require_text_report.buildStatusGatewayJsonPayloadFromSurface({ surface: params.surface }),
		gatewayService: params.surface.gatewayService,
		nodeService: params.surface.nodeService,
		agents: params.agents,
		secretDiagnostics: params.secretDiagnostics,
		...params.securityAudit ? { securityAudit: params.securityAudit } : {},
		...params.pluginCompatibility ? { pluginCompatibility: {
			count: params.pluginCompatibility.length,
			warnings: params.pluginCompatibility
		} } : {},
		...params.health || params.usage || params.lastHeartbeat ? {
			health: params.health,
			usage: params.usage,
			lastHeartbeat: params.lastHeartbeat
		} : {}
	};
}
//#endregion
//#region src/commands/status-json-runtime.ts
/** Builds the status JSON object from a completed scan plus optional runtime/deep probes. */
async function resolveStatusJsonOutput(params) {
	const { scan, opts } = params;
	const { securityAudit, usage, health, lastHeartbeat, gatewayService, nodeService } = await require_text_report.resolveStatusRuntimeSnapshot({
		config: scan.cfg,
		sourceConfig: scan.sourceConfig,
		timeoutMs: opts.timeoutMs,
		usage: opts.usage,
		deep: opts.deep,
		gatewayReachable: scan.gatewayReachable,
		includeSecurityAudit: params.includeSecurityAudit,
		suppressHealthErrors: params.suppressHealthErrors
	});
	return buildStatusJsonPayload({
		summary: scan.summary,
		surface: require_text_report.buildStatusOverviewSurfaceFromScan({
			scan,
			gatewayService,
			nodeService
		}),
		osSummary: scan.osSummary,
		memory: scan.memory,
		memoryPlugin: scan.memoryPlugin,
		agents: scan.agentStatus,
		secretDiagnostics: scan.secretDiagnostics,
		securityAudit,
		health,
		usage,
		lastHeartbeat,
		pluginCompatibility: params.includePluginCompatibility ? scan.pluginCompatibility : void 0
	});
}
//#endregion
//#region src/commands/status-json-command.ts
/** Runs the fast status scan, resolves optional deep fields, and writes JSON through the runtime. */
async function runStatusJsonCommand(params) {
	const scan = await params.scanStatusJsonFast({
		timeoutMs: params.opts.timeoutMs,
		all: params.opts.all
	}, params.runtime);
	require_runtime.writeRuntimeJson(params.runtime, await resolveStatusJsonOutput({
		scan,
		opts: params.opts,
		includeSecurityAudit: params.includeSecurityAudit,
		includePluginCompatibility: params.includePluginCompatibility,
		suppressHealthErrors: params.suppressHealthErrors
	}));
}
//#endregion
//#region src/commands/status.command-report-data.ts
/** Builds all table rows, section lines, and footer data needed by the status report renderer. */
async function buildStatusCommandReportData(params) {
	const overviewRows = require_text_report.buildStatusCommandOverviewRows({
		opts: params.opts,
		surface: params.surface,
		osLabel: params.osSummary.label,
		summary: params.summary,
		health: params.health,
		lastHeartbeat: params.lastHeartbeat,
		agentStatus: params.agentStatus,
		memory: params.memory,
		memoryPlugin: params.memoryPlugin,
		pluginCompatibility: params.pluginCompatibility,
		ok: params.ok,
		warn: params.warn,
		muted: params.muted,
		formatTimeAgo: params.formatTimeAgo,
		formatKTokens: params.formatKTokens,
		resolveMemoryVectorState: params.resolveMemoryVectorState,
		resolveMemoryFtsState: params.resolveMemoryFtsState,
		resolveMemoryCacheSummary: params.resolveMemoryCacheSummary,
		updateValue: params.updateValue,
		updateRestartValue: params.updateRestartValue
	});
	const sessionsColumns = [
		{
			key: "Key",
			header: "Key",
			minWidth: 20,
			flex: true
		},
		{
			key: "Kind",
			header: "Kind",
			minWidth: 6
		},
		{
			key: "Age",
			header: "Age",
			minWidth: 9
		},
		{
			key: "Model",
			header: "Model",
			minWidth: 14
		},
		{
			key: "Runtime",
			header: "Runtime",
			minWidth: 14
		},
		{
			key: "Tokens",
			header: "Tokens",
			minWidth: 16
		},
		...params.opts.verbose ? [{
			key: "Cache",
			header: "Cache",
			minWidth: 16,
			flex: true
		}] : []
	];
	const securityAuditLines = params.securityAudit ? require_text_report.buildStatusSecurityAuditLines({
		securityAudit: params.securityAudit,
		theme: params.theme,
		shortenText: params.shortenText,
		formatCliCommand: params.formatCliCommand
	}) : [params.theme.muted(`Skipped in fast status. Full report: ${params.formatCliCommand("openclaw security audit")}`), params.theme.muted(`Deep probe: ${params.formatCliCommand("openclaw status --deep")}`)];
	const retainedLost = params.summary.taskAuditRetainedLost;
	const retainedLostLine = (params.opts.deep || params.opts.verbose) && retainedLost && retainedLost.count > 0 ? params.theme.muted(`${retainedLost.count} lost task${retainedLost.count === 1 ? "" : "s"} retained until ${(0, _gabrielvfonseca_normalization_core_number_coercion.timestampMsToIsoString)(retainedLost.nextCleanupAfter) ?? "cleanupAfter"}`) : null;
	return {
		heading: params.theme.heading,
		muted: params.theme.muted,
		renderTable: params.renderTable,
		width: params.tableWidth,
		overviewRows,
		showTaskMaintenanceHint: params.summary.taskAudit.errors > 0,
		taskMaintenanceHint: `Task maintenance: ${params.formatCliCommand("openclaw tasks maintenance --apply")}`,
		retainedLostTaskLine: retainedLostLine,
		pluginCompatibilityLines: require_text_report.buildStatusPluginCompatibilityLines({
			notices: params.pluginCompatibility,
			formatNotice: params.formatPluginCompatibilityNotice,
			warn: params.theme.warn,
			muted: params.theme.muted
		}),
		pairingRecoveryLines: require_text_report.buildStatusPairingRecoveryLines({
			pairingRecovery: params.pairingRecovery,
			warn: params.theme.warn,
			muted: params.theme.muted,
			formatCliCommand: params.formatCliCommand
		}),
		modelSelectionLines: require_text_report.buildStatusModelSelectionLines({
			recent: params.summary.sessions.recent,
			shortenText: params.shortenText,
			warn: params.theme.warn,
			muted: params.theme.muted
		}),
		securityAuditLines,
		channelsColumns: require_channels_table.statusChannelsTableColumns,
		channelsRows: require_channels_table.buildStatusChannelsTableRows({
			rows: params.channels.rows,
			channelIssues: params.channelIssues,
			ok: params.ok,
			warn: params.warn,
			muted: params.muted,
			accentDim: params.accentDim,
			formatIssueMessage: (message) => params.shortenText(message, 84)
		}),
		sessionsColumns,
		sessionsRows: require_text_report.buildStatusSessionsRows({
			recent: params.summary.sessions.recent,
			verbose: params.opts.verbose,
			shortenText: params.shortenText,
			formatTimeAgo: params.formatTimeAgo,
			formatTokensCompact: params.formatTokensCompact,
			formatPromptCacheCompact: params.formatPromptCacheCompact,
			muted: params.muted
		}),
		systemEventsRows: require_text_report.buildStatusSystemEventsRows({ queuedSystemEvents: params.summary.queuedSystemEvents }),
		systemEventsTrailer: require_text_report.buildStatusSystemEventsTrailer({
			queuedSystemEvents: params.summary.queuedSystemEvents,
			muted: params.muted
		}),
		healthColumns: params.health ? require_text_report.statusHealthColumns : void 0,
		healthRows: params.health ? require_text_report.buildStatusHealthRows({
			health: params.health,
			formatHealthChannelLines: params.formatHealthChannelLines,
			ok: params.ok,
			warn: params.warn,
			muted: params.muted
		}) : void 0,
		usageLines: params.usageLines,
		footerLines: require_text_report.buildStatusFooterLines({
			updateHint: params.formatUpdateAvailableHint(params.surface.update),
			warn: params.theme.warn,
			formatCliCommand: params.formatCliCommand,
			nodeOnlyGateway: params.surface.nodeOnlyGateway,
			gatewayReachable: params.surface.gatewayReachable
		})
	};
}
//#endregion
//#region src/commands/status.command-report.ts
/** Builds terminal lines for the standard status report. */
async function buildStatusCommandReportLines(params) {
	const lines = [];
	lines.push(params.heading("Operator status"));
	require_text_report.appendStatusReportSections({
		lines,
		heading: params.heading,
		sections: [
			{ ...require_text_report.buildStatusOverviewSection({
				width: params.width,
				renderTable: params.renderTable,
				rows: params.overviewRows
			}) },
			{
				kind: "raw",
				body: params.showTaskMaintenanceHint || params.retainedLostTaskLine ? [
					"",
					...params.showTaskMaintenanceHint ? [params.muted(params.taskMaintenanceHint)] : [],
					...params.retainedLostTaskLine ? [params.retainedLostTaskLine] : []
				] : [],
				skipIfEmpty: true
			},
			{
				kind: "lines",
				title: "Plugin compatibility",
				body: params.pluginCompatibilityLines,
				skipIfEmpty: true
			},
			{
				kind: "raw",
				body: params.pairingRecoveryLines.length > 0 ? ["", ...params.pairingRecoveryLines] : [],
				skipIfEmpty: true
			},
			{
				kind: "lines",
				title: "Model selection",
				body: params.modelSelectionLines,
				skipIfEmpty: true
			},
			{
				kind: "lines",
				title: "Security audit",
				body: params.securityAuditLines
			},
			params.channelsRows.length === 0 ? {
				kind: "lines",
				title: "Channels",
				body: [params.muted("No channels configured")]
			} : { ...require_text_report.buildStatusChannelsTableSection({
				width: params.width,
				renderTable: params.renderTable,
				columns: params.channelsColumns,
				rows: params.channelsRows
			}) },
			params.sessionsRows.length === 0 ? {
				kind: "lines",
				title: "Sessions",
				body: [params.muted("No sessions")]
			} : { ...require_text_report.buildStatusSessionsSection({
				width: params.width,
				renderTable: params.renderTable,
				columns: params.sessionsColumns,
				rows: params.sessionsRows
			}) },
			{ ...require_text_report.buildStatusSystemEventsSection({
				width: params.width,
				renderTable: params.renderTable,
				rows: params.systemEventsRows,
				trailer: params.systemEventsTrailer
			}) },
			{ ...require_text_report.buildStatusHealthSection({
				width: params.width,
				renderTable: params.renderTable,
				columns: params.healthColumns,
				rows: params.healthRows
			}) },
			{ ...require_text_report.buildStatusUsageSection({ usageLines: params.usageLines }) },
			{
				kind: "raw",
				body: ["", ...params.footerLines]
			}
		]
	});
	return lines;
}
//#endregion
//#region src/commands/status.command.ts
var status_command_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ statusCommand: () => statusCommand });
const statusScanModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.scan-6l0HWeqG.cjs")));
const statusScanFastJsonModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.scan.fast-json-S2NvxRqq.cjs")));
const statusAllModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status-all-BkJiHJ-I.cjs")));
const statusCommandTextRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.command.text-runtime-DdmIRYq-.cjs")));
const statusNodeModeModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.node-mode-DSb51TC4.cjs")));
function loadStatusScanModule() {
	return statusScanModuleLoader.load();
}
function loadStatusScanFastJsonModule() {
	return statusScanFastJsonModuleLoader.load();
}
function loadStatusAllModule() {
	return statusAllModuleLoader.load();
}
function loadStatusCommandTextRuntime() {
	return statusCommandTextRuntimeLoader.load();
}
function loadStatusNodeModeModule() {
	return statusNodeModeModuleLoader.load();
}
/** Extracts device-pairing recovery context from structured gateway errors or legacy message text. */
function resolvePairingRecoveryContext(params) {
	const structured = require_connect_error_details.readPairingConnectErrorDetails(params.details);
	if (structured) return {
		requestId: require_connect_error_details.normalizePairingConnectRequestId(structured.requestId) ?? null,
		reason: structured.reason ?? null,
		remediationHint: structured.remediationHint ? require_safe_text.sanitizeTerminalText(structured.remediationHint) : null
	};
	const pairing = require_connect_error_details.readConnectPairingRequiredMessage([params.error, params.closeReason].filter((part) => typeof part === "string" && part.trim().length > 0).join(" "));
	if (!pairing) return null;
	return {
		requestId: require_connect_error_details.normalizePairingConnectRequestId(pairing.requestId) ?? null,
		reason: pairing.reason ?? null,
		remediationHint: null
	};
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.statusCommandTestApi")] = { resolvePairingRecoveryContext };
function normalizeStatusWrapperPath(value) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}
function resolveServiceWrapperContextHint(params) {
	const serviceWrapperPath = normalizeStatusWrapperPath(params.serviceWrapperPath);
	if (!serviceWrapperPath) return null;
	if (normalizeStatusWrapperPath(params.cliWrapperPath) === serviceWrapperPath) return null;
	return `The installed gateway service uses ${require_program_args.OPERATOR_WRAPPER_ENV_KEY} (${require_safe_text.sanitizeTerminalText(serviceWrapperPath)}), but this CLI process is not running with that same wrapper. Missing-secret diagnostics may describe the current CLI process rather than the installed gateway service context.`;
}
/** Runs `operator status`, including JSON/all routing and optional deep probes. */
async function statusCommand(opts, runtime) {
	if (opts.all && !opts.json) {
		await loadStatusAllModule().then(({ statusAllCommand }) => statusAllCommand(runtime, { timeoutMs: opts.timeoutMs }));
		return;
	}
	if (opts.json) {
		await runStatusJsonCommand({
			opts,
			runtime,
			includeSecurityAudit: opts.all === true,
			includePluginCompatibility: true,
			suppressHealthErrors: true,
			scanStatusJsonFast: async (scanOpts, runtimeForScan) => await loadStatusScanFastJsonModule().then(({ scanStatusJsonFast }) => scanStatusJsonFast(scanOpts, runtimeForScan))
		});
		return;
	}
	const scan = await loadStatusScanModule().then(({ scanStatus }) => scanStatus({
		json: false,
		timeoutMs: opts.timeoutMs,
		all: opts.all,
		deep: opts.deep
	}, runtime));
	const { cfg, osSummary, tailscaleMode, tailscaleDns, tailscaleHttpsUrl, advertisedControlUiLinks, update, gatewayConnection, remoteUrlMissing, gatewayMode, gatewayProbeAuth, gatewayProbeAuthWarning, gatewayProbe, gatewayReachable, gatewaySelf, channelIssues, agentStatus, channels, summary, secretDiagnostics, memory, memoryPlugin, pluginCompatibility } = scan;
	const { securityAudit, usage, health, lastHeartbeat, gatewayService: daemon, nodeService: nodeDaemon } = await require_text_report.resolveStatusRuntimeSnapshot({
		config: scan.cfg,
		sourceConfig: scan.sourceConfig,
		timeoutMs: opts.timeoutMs,
		usage: opts.usage,
		deep: opts.deep,
		gatewayReachable,
		includeSecurityAudit: opts.all === true || opts.deep === true,
		resolveSecurityAudit: async (input) => await require_progress.withProgress({
			label: "Running security audit…",
			indeterminate: true,
			enabled: true
		}, async () => await require_text_report.resolveStatusSecurityAudit(input)),
		resolveUsage: async (input) => await require_progress.withProgress({
			label: "Fetching usage snapshot…",
			indeterminate: true,
			enabled: opts.json !== true
		}, async () => await require_text_report.resolveStatusUsageSummary(input)),
		resolveHealth: async (input) => await require_progress.withProgress({
			label: "Checking gateway health…",
			indeterminate: true,
			enabled: opts.json !== true
		}, async () => await require_text_report.resolveStatusGatewayHealth(input))
	});
	const { buildStatusUpdateSurface, formatCliCommand, formatHealthChannelLines, formatKTokens, formatPromptCacheCompact, formatPluginCompatibilityNotice, formatTimeAgo, formatTokensCompact, formatUpdateAvailableHint, getTerminalTableWidth, info, renderTable, resolveMemoryCacheSummary, resolveMemoryFtsState, resolveMemoryVectorState, shortenText, theme } = await loadStatusCommandTextRuntime();
	const muted = (value) => theme.muted(value);
	const ok = (value) => theme.success(value);
	const warn = (value) => theme.warn(value);
	const updateSurface = buildStatusUpdateSurface({
		updateConfigChannel: cfg.update?.channel,
		update
	});
	if (opts.verbose) {
		const { buildGatewayConnectionDetails } = await Promise.resolve().then(() => require("./call-CphTnsHC.cjs")).then((n) => n.call_exports);
		require_status_gateway_connection.logGatewayConnectionDetails({
			runtime,
			info,
			message: buildGatewayConnectionDetails({ config: scan.cfg }).message,
			trailingBlankLine: true
		});
	}
	const tableWidth = getTerminalTableWidth();
	if (secretDiagnostics.length > 0) {
		runtime.log(theme.warn("Secret diagnostics:"));
		for (const entry of secretDiagnostics) runtime.log(`- ${entry}`);
		const wrapperContextHint = resolveServiceWrapperContextHint({
			serviceWrapperPath: daemon.wrapperPath,
			cliWrapperPath: process.env[require_program_args.OPERATOR_WRAPPER_ENV_KEY]
		});
		if (wrapperContextHint) runtime.log(theme.warn(wrapperContextHint));
		runtime.log("");
	}
	const nodeOnlyGateway = await loadStatusNodeModeModule().then(({ resolveNodeOnlyGatewayInfo }) => resolveNodeOnlyGatewayInfo({
		daemon,
		node: nodeDaemon
	}));
	const pairingRecovery = resolvePairingRecoveryContext({
		error: gatewayProbe?.error ?? null,
		closeReason: gatewayProbe?.close?.reason ?? null,
		details: gatewayProbe?.connectErrorDetails
	});
	const usageLines = usage ? await require_text_report.loadStatusProviderUsageModule().then(({ formatUsageReportLines }) => formatUsageReportLines(usage)) : void 0;
	const overviewSurface = require_text_report.buildStatusOverviewSurfaceFromScan({
		scan: {
			cfg,
			update,
			tailscaleMode,
			tailscaleDns,
			tailscaleHttpsUrl,
			...advertisedControlUiLinks ? { advertisedControlUiLinks } : {},
			gatewayMode,
			remoteUrlMissing,
			gatewayConnection,
			gatewayReachable,
			gatewayProbe,
			gatewayProbeAuth,
			gatewayProbeAuthWarning,
			gatewaySelf
		},
		gatewayService: daemon,
		nodeService: nodeDaemon,
		nodeOnlyGateway
	});
	const updateRestartValue = require_text_report.formatUpdateRestartStatusValue((await require_restart_sentinel.readRestartSentinel().catch(() => null))?.payload, {
		ok,
		warn,
		muted,
		formatTimeAgo
	});
	const lines = await buildStatusCommandReportLines(await buildStatusCommandReportData({
		opts,
		surface: overviewSurface,
		osSummary,
		summary,
		securityAudit,
		health,
		usageLines,
		lastHeartbeat,
		agentStatus,
		channels,
		channelIssues,
		memory,
		memoryPlugin,
		pluginCompatibility,
		pairingRecovery,
		tableWidth,
		ok,
		warn,
		muted,
		shortenText,
		formatCliCommand,
		formatTimeAgo,
		formatKTokens,
		formatTokensCompact,
		formatPromptCacheCompact,
		formatHealthChannelLines,
		formatPluginCompatibilityNotice,
		formatUpdateAvailableHint,
		resolveMemoryVectorState,
		resolveMemoryFtsState,
		resolveMemoryCacheSummary,
		accentDim: theme.accentDim,
		theme,
		renderTable,
		updateValue: updateSurface.updateAvailable ? warn(`available · ${updateSurface.updateLine}`) : updateSurface.updateLine,
		updateRestartValue
	}));
	for (const line of lines) runtime.log(line);
}
//#endregion
Object.defineProperty(exports, "status_command_exports", {
	enumerable: true,
	get: function() {
		return status_command_exports;
	}
});
