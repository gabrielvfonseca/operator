const require_command_format = require("./command-format-C4ZW2nwK.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_format_relative = require("./format-relative-DEaTzxP-.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
const require_connect_error_details = require("./connect-error-details-lz40g7i9.cjs");
const require_model_auth_label = require("./model-auth-label-oN9N-rOu.cjs");
const require_codex_synthetic_usage = require("./codex-synthetic-usage-DialzaAT.cjs");
const require_paths = require("./paths-amwIgX1d.cjs");
const require_service = require("./service-BJLcDrM4.cjs");
require("./program-args-YjZGo5sC.cjs");
const require_service_layout = require("./service-layout-snfAPMhx.cjs");
const require_format = require("./format-Y6on_ttU.cjs");
const require_channels_table = require("./channels-table-CCPwjWsS.cjs");
require("./update-control-plane-sentinel-9paZY1RI.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/status-overview-surface.ts
/** Converts the full status scan result into the shared overview surface. */
function buildStatusOverviewSurfaceFromScan(params) {
	return {
		cfg: params.scan.cfg,
		update: params.scan.update,
		tailscaleMode: params.scan.tailscaleMode,
		tailscaleDns: params.scan.tailscaleDns,
		tailscaleHttpsUrl: params.scan.tailscaleHttpsUrl,
		...params.scan.advertisedControlUiLinks ? { advertisedControlUiLinks: params.scan.advertisedControlUiLinks } : {},
		gatewayMode: params.scan.gatewayMode,
		remoteUrlMissing: params.scan.remoteUrlMissing,
		gatewayConnection: params.scan.gatewayConnection,
		gatewayReachable: params.scan.gatewayReachable,
		gatewayProbe: params.scan.gatewayProbe,
		gatewayProbeAuth: params.scan.gatewayProbeAuth,
		gatewayProbeAuthWarning: params.scan.gatewayProbeAuthWarning,
		gatewaySelf: params.scan.gatewaySelf,
		gatewayService: params.gatewayService,
		nodeService: params.nodeService,
		nodeOnlyGateway: params.nodeOnlyGateway
	};
}
/** Converts the lighter status-all overview scan into the shared overview surface. */
function buildStatusOverviewSurfaceFromOverview(params) {
	return {
		cfg: params.overview.cfg,
		update: params.overview.update,
		tailscaleMode: params.overview.tailscaleMode,
		tailscaleDns: params.overview.tailscaleDns,
		tailscaleHttpsUrl: params.overview.tailscaleHttpsUrl,
		...params.overview.advertisedControlUiLinks ? { advertisedControlUiLinks: params.overview.advertisedControlUiLinks } : {},
		gatewayMode: params.overview.gatewaySnapshot.gatewayMode,
		remoteUrlMissing: params.overview.gatewaySnapshot.remoteUrlMissing,
		gatewayConnection: params.overview.gatewaySnapshot.gatewayConnection,
		gatewayReachable: params.overview.gatewaySnapshot.gatewayReachable,
		gatewayProbe: params.overview.gatewaySnapshot.gatewayProbe,
		gatewayProbeAuth: params.overview.gatewaySnapshot.gatewayProbeAuth,
		gatewayProbeAuthWarning: params.overview.gatewaySnapshot.gatewayProbeAuthWarning,
		gatewaySelf: params.overview.gatewaySnapshot.gatewaySelf,
		gatewayService: params.gatewayService,
		nodeService: params.nodeService,
		nodeOnlyGateway: params.nodeOnlyGateway
	};
}
/** Builds overview rows from an already-normalized surface. */
function buildStatusOverviewRowsFromSurface(params) {
	return require_format.buildStatusOverviewSurfaceRows({
		cfg: params.surface.cfg,
		update: params.surface.update,
		tailscaleMode: params.surface.tailscaleMode,
		tailscaleDns: params.surface.tailscaleDns,
		tailscaleHttpsUrl: params.surface.tailscaleHttpsUrl,
		...params.surface.advertisedControlUiLinks ? { advertisedControlUiLinks: params.surface.advertisedControlUiLinks } : {},
		tailscaleBackendState: params.tailscaleBackendState,
		includeBackendStateWhenOff: params.includeBackendStateWhenOff,
		includeBackendStateWhenOn: params.includeBackendStateWhenOn,
		includeDnsNameWhenOff: params.includeDnsNameWhenOff,
		decorateTailscaleOff: params.decorateTailscaleOff,
		decorateTailscaleWarn: params.decorateTailscaleWarn,
		gatewayMode: params.surface.gatewayMode,
		remoteUrlMissing: params.surface.remoteUrlMissing,
		gatewayConnection: params.surface.gatewayConnection,
		gatewayReachable: params.surface.gatewayReachable,
		gatewayProbe: params.surface.gatewayProbe,
		gatewayProbeAuth: params.surface.gatewayProbeAuth,
		gatewayProbeAuthWarning: params.surface.gatewayProbeAuthWarning,
		gatewaySelf: params.surface.gatewaySelf,
		gatewayService: params.surface.gatewayService,
		nodeService: params.surface.nodeService,
		nodeOnlyGateway: params.surface.nodeOnlyGateway,
		decorateOk: params.decorateOk,
		decorateWarn: params.decorateWarn,
		prefixRows: params.prefixRows,
		middleRows: params.middleRows,
		suffixRows: params.suffixRows,
		agentsValue: params.agentsValue,
		updateValue: params.updateValue,
		gatewayAuthWarningValue: params.gatewayAuthWarningValue,
		gatewaySelfFallbackValue: params.gatewaySelfFallbackValue
	});
}
/** Builds the gateway JSON payload from the gateway portion of an overview surface. */
function buildStatusGatewayJsonPayloadFromSurface(params) {
	return require_format.buildGatewayStatusJsonPayload({
		gatewayMode: params.surface.gatewayMode,
		gatewayConnection: params.surface.gatewayConnection,
		remoteUrlMissing: params.surface.remoteUrlMissing,
		gatewayReachable: params.surface.gatewayReachable,
		gatewayProbe: params.surface.gatewayProbe,
		gatewaySelf: params.surface.gatewaySelf,
		gatewayProbeAuthWarning: params.surface.gatewayProbeAuthWarning
	});
}
//#endregion
//#region src/commands/status-overview-values.ts
function countActiveStatusAgents(params) {
	const activeThresholdMs = params.activeThresholdMs ?? 10 * 6e4;
	return params.agentStatus.agents.filter((agent) => agent.lastActiveAgeMs != null && agent.lastActiveAgeMs <= activeThresholdMs).length;
}
/** Formats the status-all agents overview cell. */
function buildStatusAllAgentsValue(params) {
	const activeAgents = countActiveStatusAgents(params);
	return `${params.agentStatus.agents.length} total · ${params.agentStatus.bootstrapPendingCount} bootstrapping · ${activeAgents} active · ${params.agentStatus.totalSessions} sessions`;
}
/** Formats the secrets diagnostics count for overview output. */
function buildStatusSecretsValue(count) {
	return count > 0 ? `${count} diagnostic${count === 1 ? "" : "s"}` : "none";
}
/** Formats queued system-event count for overview output. */
function buildStatusEventsValue(params) {
	return params.queuedSystemEvents.length > 0 ? `${params.queuedSystemEvents.length} queued` : "none";
}
/** Formats whether deep probe data was collected. */
function buildStatusProbesValue(params) {
	return params.health ? params.ok("enabled") : params.muted("skipped (use --deep)");
}
/** Formats plugin compatibility notices as a compact count by notice and plugin. */
function buildStatusPluginCompatibilityValue(params) {
	if (params.notices.length === 0) return params.ok("none");
	const pluginCount = new Set(params.notices.map((notice) => notice.pluginId ?? notice.plugin ?? "")).size;
	return params.warn(`${params.notices.length} notice${params.notices.length === 1 ? "" : "s"} · ${pluginCount} plugin${pluginCount === 1 ? "" : "s"}`);
}
/** Formats active session count, default model/context, and backing store summary. */
function buildStatusSessionsOverviewValue(params) {
	const defaultCtx = params.sessions.defaults.contextTokens ? ` (${params.formatKTokens(params.sessions.defaults.contextTokens)} ctx)` : "";
	const storeLabel = params.sessions.paths.length > 1 ? `${params.sessions.paths.length} stores` : params.sessions.paths[0] ?? "unknown";
	return `${params.sessions.count} active · default ${params.sessions.defaults.model ?? "unknown"}${defaultCtx} · ${storeLabel}`;
}
//#endregion
//#region src/commands/status.command-sections.ts
const statusHealthColumns = [
	{
		key: "Item",
		header: "Item",
		minWidth: 10
	},
	{
		key: "Status",
		header: "Status",
		minWidth: 8
	},
	{
		key: "Detail",
		header: "Detail",
		flex: true,
		minWidth: 28
	}
];
/** Formats the agents overview row value, including default-agent recent activity. */
function buildStatusAgentsValue(params) {
	const pending = params.agentStatus.bootstrapPendingCount > 0 ? `${params.agentStatus.bootstrapPendingCount} bootstrap file${params.agentStatus.bootstrapPendingCount === 1 ? "" : "s"} present` : "no workspaces bootstrapping";
	const def = params.agentStatus.agents.find((a) => a.id === params.agentStatus.defaultId);
	const defActive = def?.lastActiveAgeMs != null ? params.formatTimeAgo(def.lastActiveAgeMs) : "unknown";
	const defSuffix = def ? ` · default ${def.id} active ${defActive}` : "";
	return `${params.agentStatus.agents.length} · ${pending} · sessions ${params.agentStatus.totalSessions}${defSuffix}`;
}
/** Formats task counters and audit state for the overview table. */
function buildStatusTasksValue(params) {
	if (params.summary.tasks.total <= 0) return params.muted("none");
	return [
		`${params.summary.tasks.active} active`,
		`${params.summary.tasks.byStatus.queued} queued`,
		`${params.summary.tasks.byStatus.running} running`,
		params.summary.tasks.failures > 0 ? params.warn(`${params.summary.tasks.failures} issue${params.summary.tasks.failures === 1 ? "" : "s"}`) : params.muted("no issues"),
		params.summary.taskAudit.errors > 0 ? params.warn(`audit ${params.summary.taskAudit.errors} error${params.summary.taskAudit.errors === 1 ? "" : "s"} · ${params.summary.taskAudit.warnings} warn`) : params.summary.taskAudit.warnings > 0 ? params.muted(`audit ${params.summary.taskAudit.warnings} warn`) : params.muted("audit clean"),
		`${params.summary.tasks.total} tracked`
	].join(" · ");
}
/** Formats configured heartbeat intervals by agent. */
function buildStatusHeartbeatValue(params) {
	const parts = params.summary.heartbeat.agents.map((agent) => {
		if (!agent.enabled || !agent.everyMs) return `disabled (${agent.agentId})`;
		return `${agent.every} (${agent.agentId})`;
	}).filter(Boolean);
	return parts.length > 0 ? parts.join(", ") : "disabled";
}
/** Formats the last observed heartbeat when deep status queried the gateway. */
function buildStatusLastHeartbeatValue(params) {
	if (!params.deep) return null;
	if (!params.gatewayReachable) return params.warn("unavailable");
	if (!params.lastHeartbeat) return params.muted("none");
	const age = params.formatTimeAgo(Date.now() - params.lastHeartbeat.ts);
	const channel = params.lastHeartbeat.channel ?? "unknown";
	const accountLabel = params.lastHeartbeat.accountId ? `account ${params.lastHeartbeat.accountId}` : null;
	return [
		params.lastHeartbeat.status,
		`${age} ago`,
		channel,
		accountLabel
	].filter(Boolean).join(" · ");
}
/** Formats memory plugin/index/cache state for the overview table. */
function buildStatusMemoryValue(params) {
	if (!params.memoryPlugin.enabled) {
		const suffix = params.memoryPlugin.reason ? ` (${params.memoryPlugin.reason})` : "";
		return params.muted(`disabled${suffix}`);
	}
	if (!params.memory) {
		const slot = params.memoryPlugin.slot ? `plugin ${params.memoryPlugin.slot}` : "plugin";
		return params.muted(`enabled (${slot}) · ${params.memoryUnavailableLabel ?? "unavailable"}`);
	}
	const parts = [];
	const dirtySuffix = params.memory.dirty ? ` · ${params.warn("dirty")}` : "";
	parts.push(`${params.memory.files} files · ${params.memory.chunks} chunks${dirtySuffix}`);
	if (params.memory.sources?.length) parts.push(`sources ${params.memory.sources.join(", ")}`);
	if (params.memoryPlugin.slot) parts.push(`plugin ${params.memoryPlugin.slot}`);
	const colorByTone = (tone, text) => tone === "ok" ? params.ok(text) : tone === "warn" ? params.warn(text) : params.muted(text);
	if (params.memory.vector) {
		const vector = params.memory.backend === "builtin" && params.memory.vector.storeAvailable !== void 0 ? {
			...params.memory.vector,
			available: params.memory.vector.storeAvailable
		} : params.memory.vector;
		const state = params.resolveMemoryVectorState(vector);
		const prefix = params.memory.backend === "builtin" ? "vector store" : "vector";
		const label = state.state === "disabled" ? `${prefix} off` : `${prefix} ${state.state}`;
		parts.push(colorByTone(state.tone, label));
	}
	if (params.memory.fts) {
		const state = params.resolveMemoryFtsState(params.memory.fts);
		const label = state.state === "disabled" ? "fts off" : `fts ${state.state}`;
		parts.push(colorByTone(state.tone, label));
	}
	if (params.memory.cache) {
		const summary = params.resolveMemoryCacheSummary(params.memory.cache);
		parts.push(colorByTone(summary.tone, summary.text));
	}
	return parts.join(" · ");
}
/** Builds the security audit text section for status output. */
function buildStatusSecurityAuditLines(params) {
	const fmtSummary = (value) => {
		return [
			params.theme.error(`${value.critical} critical`),
			params.theme.warn(`${value.warn} warn`),
			params.theme.muted(`${value.info} info`)
		].join(" · ");
	};
	const lines = [params.theme.muted(`Summary: ${fmtSummary(params.securityAudit.summary)}`)];
	const importantFindings = params.securityAudit.findings.filter((f) => f.severity === "critical" || f.severity === "warn");
	if (importantFindings.length === 0) lines.push(params.theme.muted("No critical or warn findings detected."));
	else {
		const severityLabel = (sev) => sev === "critical" ? params.theme.error("CRITICAL") : sev === "warn" ? params.theme.warn("WARN") : params.theme.muted("INFO");
		const sevRank = (sev) => sev === "critical" ? 0 : sev === "warn" ? 1 : 2;
		const shown = [...importantFindings].toSorted((a, b) => sevRank(a.severity) - sevRank(b.severity)).slice(0, 6);
		for (const finding of shown) {
			lines.push(`  ${severityLabel(finding.severity)} ${finding.title}`);
			lines.push(`    ${params.shortenText(finding.detail.replaceAll("\n", " "), 160)}`);
			if (finding.remediation?.trim()) lines.push(`    ${params.theme.muted(`Fix: ${finding.remediation.trim()}`)}`);
		}
		if (importantFindings.length > shown.length) lines.push(params.theme.muted(`… +${importantFindings.length - shown.length} more`));
	}
	lines.push(params.theme.muted(`Full report: ${params.formatCliCommand("openclaw security audit")}`));
	lines.push(params.theme.muted(`Deep probe: ${params.formatCliCommand("openclaw security audit --deep")}`));
	return lines;
}
/** Builds health table rows from gateway health and channel health text. */
function buildStatusHealthRows(params) {
	const rows = [{
		Item: "Gateway",
		Status: params.ok("reachable"),
		Detail: `${params.health.durationMs}ms`
	}];
	if (params.health.eventLoop) rows.push({
		Item: "Event loop",
		Status: params.health.eventLoop.degraded ? params.warn("WARN") : params.ok("OK"),
		Detail: formatEventLoopHealthDetail(params.health.eventLoop)
	});
	if (params.health.modelPricing?.state === "degraded") rows.push({
		Item: "Model pricing",
		Status: params.warn("WARN"),
		Detail: `optional pricing refresh degraded${params.health.modelPricing.detail ? `: ${params.health.modelPricing.detail}` : ""}`
	});
	for (const line of params.formatHealthChannelLines(params.health, { accountMode: "all" })) {
		const colon = line.indexOf(":");
		if (colon === -1) continue;
		const item = line.slice(0, colon).trim();
		const detail = line.slice(colon + 1).trim();
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(detail);
		const status = normalized.startsWith("ok") ? params.ok("OK") : normalized.startsWith("failed") ? params.warn("WARN") : normalized.startsWith("not configured") ? params.muted("OFF") : normalized.startsWith("configured") ? params.ok("OK") : normalized.startsWith("linked") ? params.ok("LINKED") : normalized.startsWith("not linked") ? params.warn("UNLINKED") : params.warn("WARN");
		rows.push({
			Item: item,
			Status: status,
			Detail: detail
		});
	}
	return rows;
}
/** Formats event-loop latency/utilization health into one table detail string. */
function formatEventLoopHealthDetail(eventLoop) {
	return [
		eventLoop.reasons.length > 0 ? `reasons ${eventLoop.reasons.join(",")}` : "healthy",
		`max ${Math.round(eventLoop.delayMaxMs)}ms`,
		`p99 ${Math.round(eventLoop.delayP99Ms)}ms`,
		`util ${eventLoop.utilization}`,
		`cpu ${eventLoop.cpuCoreRatio}`
	].join(" · ");
}
/** Builds recent session table rows, optionally including prompt-cache data. */
function buildStatusSessionsRows(params) {
	if (params.recent.length === 0) return [];
	return params.recent.map((sess) => ({
		Key: params.shortenText(sess.key, 32),
		Kind: sess.kind,
		Age: sess.updatedAt && sess.age != null ? params.formatTimeAgo(sess.age) : "no activity",
		Model: sess.model ?? "unknown",
		Runtime: sess.runtime ?? "unknown",
		Tokens: params.formatTokensCompact(sess),
		...params.verbose ? { Cache: params.formatPromptCacheCompact(sess) || params.muted("—") } : {}
	}));
}
/** Explains sessions pinned to a selected model different from the current configured default. */
function buildStatusModelSelectionLines(params) {
	const mismatches = params.recent.filter((sess) => {
		if (!sess.configuredModel || !sess.selectedModel || !sess.modelSelectionReason) return false;
		return sess.configuredModel !== sess.selectedModel && !require_model_runtime_aliases.areRuntimeModelRefsEquivalent(sess.configuredModel, sess.selectedModel);
	});
	if (mismatches.length === 0) return [];
	const limit = params.limit ?? 3;
	const lines = [];
	for (const sess of mismatches.slice(0, limit)) {
		const key = params.shortenText(sess.key, 48);
		const configured = sess.configuredModel ?? "unknown";
		const selected = sess.selectedModel ?? "unknown";
		const isFallback = sess.modelSelectionReason === "fallback selected";
		const intro = isFallback ? `Session ${key} is running ${selected} (auto fallback); config primary is ${configured}.` : `Session ${key} is pinned to ${selected}; config primary ${configured} will apply to new/unpinned sessions.`;
		const reasonLine = `  Reason: ${sess.modelSelectionReason ?? "session override"}`;
		const clearLine = isFallback ? "  Action: check provider availability or retry with /model" : "  Clear with: /model default";
		lines.push(params.warn(intro), `  Configured default: ${configured}`, `  Session selected: ${selected}`, reasonLine, clearLine, "  Docs: https://docs.operator.ai/concepts/models#selection-source-and-fallback-behavior");
	}
	if (mismatches.length > limit) lines.push(params.muted(`  … +${mismatches.length - limit} more pinned session(s)`));
	return lines;
}
/** Builds footer links and next-step commands for the current gateway state. */
function buildStatusFooterLines(params) {
	return [
		"FAQ: https://docs.operator.ai/faq",
		"Troubleshooting: https://docs.operator.ai/troubleshooting",
		...params.updateHint ? ["", params.warn(params.updateHint)] : [],
		"Next steps:",
		`  Need to share?      ${params.formatCliCommand("openclaw status --all")}`,
		`  Need to debug live? ${params.formatCliCommand("openclaw logs --follow")}`,
		params.nodeOnlyGateway ? `  Need node service?  ${params.formatCliCommand("openclaw node status")}` : params.gatewayReachable ? `  Need to test channels? ${params.formatCliCommand("openclaw status --deep")}` : `  Fix reachability first: ${params.formatCliCommand("openclaw gateway probe")}`
	];
}
/** Builds plugin compatibility lines, capped to keep status output readable. */
function buildStatusPluginCompatibilityLines(params) {
	if (params.notices.length === 0) return [];
	const limit = params.limit ?? 8;
	return [...params.notices.slice(0, limit).map((notice) => {
		return `  ${notice.severity === "warn" ? params.warn("WARN") : params.muted("INFO")} ${params.formatNotice(notice)}`;
	}), ...params.notices.length > limit ? [params.muted(`  … +${params.notices.length - limit} more`)] : []];
}
/** Builds recovery guidance when the gateway reports device pairing is required. */
function buildStatusPairingRecoveryLines(params) {
	if (!params.pairingRecovery) return [];
	return [
		params.warn(require_connect_error_details.buildPairingConnectRecoveryTitle(params.pairingRecovery.reason ?? void 0)),
		...params.pairingRecovery.reason ? [params.muted(`Reason: ${require_connect_error_details.describePairingConnectRequirement(params.pairingRecovery.reason)}.`)] : [],
		...params.pairingRecovery.remediationHint ? [params.muted(`Hint: ${params.pairingRecovery.remediationHint}`)] : [],
		...params.pairingRecovery.requestId ? [params.muted(`Recovery: ${params.formatCliCommand(`openclaw devices approve ${params.pairingRecovery.requestId}`)}`)] : [],
		params.muted(`Fallback: ${params.formatCliCommand("openclaw devices approve --latest")}`),
		params.muted(`Inspect: ${params.formatCliCommand("openclaw devices list")}`)
	];
}
/** Builds the queued system-events table rows. */
function buildStatusSystemEventsRows(params) {
	const limit = params.limit ?? 5;
	if (params.queuedSystemEvents.length === 0) return;
	return params.queuedSystemEvents.slice(0, limit).map((event) => ({ Event: event }));
}
/** Builds the overflow trailer for queued system events. */
function buildStatusSystemEventsTrailer(params) {
	const limit = params.limit ?? 5;
	return params.queuedSystemEvents.length > limit ? params.muted(`… +${params.queuedSystemEvents.length - limit} more`) : null;
}
//#endregion
//#region src/commands/status-overview-rows.ts
function readModelPricingHealth(params) {
	if (params.health?.modelPricing) return params.health.modelPricing;
	const probeHealth = params.surface.gatewayProbe?.health;
	if (!probeHealth || typeof probeHealth !== "object") return;
	const modelPricing = probeHealth.modelPricing;
	if (!modelPricing || typeof modelPricing !== "object") return;
	const state = modelPricing.state;
	if (state !== "ok" && state !== "degraded" && state !== "disabled") return;
	return modelPricing;
}
function buildModelPricingOverviewValue(params) {
	const health = params.health;
	if (!health) return null;
	if (health.state !== "degraded") return null;
	const detail = health.detail ? ` · ${health.detail}` : "";
	return params.warn(`warning · optional pricing refresh degraded${detail}`);
}
/** Builds the default `operator status` overview rows from scan, health, memory, and session inputs. */
function buildStatusCommandOverviewRows(params) {
	const agentsValue = buildStatusAgentsValue({
		agentStatus: params.agentStatus,
		formatTimeAgo: params.formatTimeAgo
	});
	const eventsValue = buildStatusEventsValue({ queuedSystemEvents: params.summary.queuedSystemEvents });
	const tasksValue = buildStatusTasksValue({
		summary: params.summary,
		warn: params.warn,
		muted: params.muted
	});
	const probesValue = buildStatusProbesValue({
		health: params.health,
		ok: params.ok,
		muted: params.muted
	});
	const heartbeatValue = buildStatusHeartbeatValue({ summary: params.summary });
	const lastHeartbeatValue = buildStatusLastHeartbeatValue({
		deep: params.opts.deep,
		gatewayReachable: params.surface.gatewayReachable,
		lastHeartbeat: params.lastHeartbeat,
		warn: params.warn,
		muted: params.muted,
		formatTimeAgo: params.formatTimeAgo
	});
	const memoryValue = buildStatusMemoryValue({
		memory: params.memory,
		memoryPlugin: params.memoryPlugin,
		ok: params.ok,
		warn: params.warn,
		muted: params.muted,
		resolveMemoryVectorState: params.resolveMemoryVectorState,
		resolveMemoryFtsState: params.resolveMemoryFtsState,
		resolveMemoryCacheSummary: params.resolveMemoryCacheSummary,
		memoryUnavailableLabel: "not checked"
	});
	const pluginCompatibilityValue = buildStatusPluginCompatibilityValue({
		notices: params.pluginCompatibility,
		ok: params.ok,
		warn: params.warn
	});
	const modelPricingValue = buildModelPricingOverviewValue({
		health: readModelPricingHealth({
			health: params.health,
			surface: params.surface
		}),
		ok: params.ok,
		warn: params.warn,
		muted: params.muted
	});
	return buildStatusOverviewRowsFromSurface({
		surface: params.surface,
		decorateOk: params.ok,
		decorateWarn: params.warn,
		decorateTailscaleOff: params.muted,
		decorateTailscaleWarn: params.warn,
		prefixRows: [{
			Item: "OS",
			Value: `${params.osLabel} · node ${process.versions.node}`
		}],
		updateValue: params.updateValue,
		agentsValue,
		suffixRows: [
			...modelPricingValue ? [{
				Item: "Model pricing",
				Value: modelPricingValue
			}] : [],
			...params.updateRestartValue ? [{
				Item: "Update restart",
				Value: params.updateRestartValue
			}] : [],
			{
				Item: "Memory",
				Value: memoryValue
			},
			{
				Item: "Plugin compatibility",
				Value: pluginCompatibilityValue
			},
			{
				Item: "Probes",
				Value: probesValue
			},
			{
				Item: "Events",
				Value: eventsValue
			},
			{
				Item: "Tasks",
				Value: tasksValue
			},
			{
				Item: "Heartbeat",
				Value: heartbeatValue
			},
			...lastHeartbeatValue ? [{
				Item: "Last heartbeat",
				Value: lastHeartbeatValue
			}] : [],
			{
				Item: "Sessions",
				Value: buildStatusSessionsOverviewValue({
					sessions: params.summary.sessions,
					formatKTokens: params.formatKTokens
				})
			}
		],
		gatewayAuthWarningValue: params.surface.gatewayProbeAuthWarning ? params.warn(params.surface.gatewayProbeAuthWarning) : null
	});
}
/** Builds the expanded status-all overview rows, including config and security hints. */
function buildStatusAllOverviewRows(params) {
	return buildStatusOverviewRowsFromSurface({
		surface: params.surface,
		tailscaleBackendState: params.tailscaleBackendState,
		includeBackendStateWhenOff: true,
		includeBackendStateWhenOn: true,
		includeDnsNameWhenOff: true,
		prefixRows: [
			{
				Item: "Version",
				Value: require_version.VERSION
			},
			{
				Item: "OS",
				Value: params.osLabel
			},
			{
				Item: "Node",
				Value: process.versions.node
			},
			{
				Item: "Config",
				Value: params.configPath
			}
		],
		middleRows: [...params.updateRestartValue ? [{
			Item: "Update restart",
			Value: params.updateRestartValue
		}] : [], {
			Item: "Security",
			Value: `Run: ${require_command_format.formatCliCommand("operator security audit --deep")}`
		}],
		agentsValue: buildStatusAllAgentsValue({ agentStatus: params.agentStatus }),
		suffixRows: [{
			Item: "Secrets",
			Value: buildStatusSecretsValue(params.secretDiagnosticsCount)
		}],
		gatewaySelfFallbackValue: "unknown"
	});
}
//#endregion
//#region src/daemon/node-service.ts
/** Adapts the generic gateway service manager for Operator node-host services. */
function withNodeServiceEnv(env) {
	return {
		...env,
		OPERATOR_LAUNCHD_LABEL: require_paths.resolveNodeLaunchAgentLabel(),
		OPERATOR_SYSTEMD_UNIT: require_paths.resolveNodeSystemdServiceName(),
		OPERATOR_WINDOWS_TASK_NAME: require_paths.resolveNodeWindowsTaskName(),
		OPERATOR_WINDOWS_TASK_HIDDEN_LAUNCHER: "1",
		OPERATOR_TASK_SCRIPT_NAME: require_paths.NODE_WINDOWS_TASK_SCRIPT_NAME,
		OPERATOR_LOG_PREFIX: "node",
		OPERATOR_SERVICE_MARKER: require_paths.NODE_SERVICE_MARKER,
		OPERATOR_SERVICE_KIND: require_paths.NODE_SERVICE_KIND
	};
}
function withNodeInstallEnv(args) {
	return {
		...args,
		env: withNodeServiceEnv(args.env),
		environment: {
			...args.environment,
			OPERATOR_LAUNCHD_LABEL: require_paths.resolveNodeLaunchAgentLabel(),
			OPERATOR_SYSTEMD_UNIT: require_paths.resolveNodeSystemdServiceName(),
			OPERATOR_WINDOWS_TASK_NAME: require_paths.resolveNodeWindowsTaskName(),
			OPERATOR_WINDOWS_TASK_HIDDEN_LAUNCHER: "1",
			OPERATOR_TASK_SCRIPT_NAME: require_paths.NODE_WINDOWS_TASK_SCRIPT_NAME,
			OPERATOR_LOG_PREFIX: "node",
			OPERATOR_SERVICE_MARKER: require_paths.NODE_SERVICE_MARKER,
			OPERATOR_SERVICE_KIND: require_paths.NODE_SERVICE_KIND
		}
	};
}
/** Returns a service controller bound to node-host labels across all platforms. */
function resolveNodeService() {
	const base = require_service.resolveGatewayService();
	return {
		...base,
		stage: async (args) => {
			return base.stage(withNodeInstallEnv(args));
		},
		install: async (args) => {
			return base.install(withNodeInstallEnv(args));
		},
		uninstall: async (args) => {
			return base.uninstall({
				...args,
				env: withNodeServiceEnv(args.env)
			});
		},
		stop: async (args) => {
			return base.stop({
				...args,
				env: withNodeServiceEnv(args.env ?? {})
			});
		},
		restart: async (args) => {
			return base.restart({
				...args,
				env: withNodeServiceEnv(args.env ?? {})
			});
		},
		isLoaded: async (args) => {
			return base.isLoaded({
				env: withNodeServiceEnv(args.env ?? {}),
				timeoutMs: args.timeoutMs
			});
		},
		readCommand: (env) => base.readCommand(withNodeServiceEnv(env)),
		readRuntime: (env, opts) => base.readRuntime(withNodeServiceEnv(env), opts)
	};
}
//#endregion
//#region src/commands/status.service-summary.ts
function normalizeServiceWrapperPath(command) {
	return command?.environment?.["OPERATOR_WRAPPER"]?.trim() || void 0;
}
/** Reads a daemon service summary, falling back to unknown when service inspection fails. */
async function readServiceStatusSummary(service, fallbackLabel, timeoutMs) {
	try {
		const state = await require_service.readGatewayServiceState(service, {
			env: process.env,
			timeoutMs
		});
		const layout = await require_service_layout.summarizeGatewayServiceLayout(state.command);
		const wrapperPath = normalizeServiceWrapperPath(state.command);
		const managedByOperator = state.installed;
		const externallyManaged = !managedByOperator && state.running;
		const installed = managedByOperator || externallyManaged;
		const loadedText = externallyManaged ? "running (externally managed)" : state.loaded ? service.loadedText : service.notLoadedText;
		return {
			label: service.label,
			installed,
			loaded: state.loaded,
			managedByOperator,
			externallyManaged,
			loadedText,
			runtime: state.runtime,
			...layout ? { layout } : {},
			...wrapperPath ? { wrapperPath } : {}
		};
	} catch {
		return {
			label: fallbackLabel,
			installed: null,
			loaded: false,
			managedByOperator: false,
			externallyManaged: false,
			loadedText: "unknown",
			runtime: void 0
		};
	}
}
//#endregion
//#region src/commands/status.daemon.ts
async function buildDaemonStatusSummary(serviceLabel, timeoutMs) {
	const summary = await readServiceStatusSummary(serviceLabel === "gateway" ? require_service.resolveGatewayService() : resolveNodeService(), serviceLabel === "gateway" ? "Daemon" : "Node", timeoutMs);
	return {
		label: summary.label,
		installed: summary.installed,
		loaded: summary.loaded,
		managedByOperator: summary.managedByOperator,
		externallyManaged: summary.externallyManaged,
		loadedText: summary.loadedText,
		runtime: summary.runtime,
		runtimeShort: require_channels_table.formatDaemonRuntimeShort(summary.runtime),
		layout: summary.layout,
		wrapperPath: summary.wrapperPath
	};
}
/** Returns the gateway daemon status summary. */
async function getDaemonStatusSummary(timeoutMs) {
	return await buildDaemonStatusSummary("gateway", timeoutMs);
}
/** Returns the node service status summary. */
async function getNodeDaemonStatusSummary(timeoutMs) {
	return await buildDaemonStatusSummary("node", timeoutMs);
}
//#endregion
//#region src/commands/status-runtime-shared.ts
const providerUsageLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./provider-usage-ChsIx4Rc.cjs")).then((n) => n.provider_usage_exports));
const securityAuditModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./audit.runtime-jLYoY2zZ.cjs")));
const readOnlyChannelPluginsModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./read-only-MDrE_ZGP.cjs")).then((n) => n.read_only_exports));
const gatewayCallModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./call-CphTnsHC.cjs")).then((n) => n.call_exports));
function loadProviderUsage() {
	return providerUsageLoader.load();
}
function loadSecurityAuditModule() {
	return securityAuditModuleLoader.load();
}
function loadReadOnlyChannelPluginsModule() {
	return readOnlyChannelPluginsModuleLoader.load();
}
function loadGatewayCallModule() {
	return gatewayCallModuleLoader.load();
}
function shouldUseConfiguredCodexSyntheticUsage(params) {
	const configuredDefault = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.config,
		allowPluginNormalization: false
	});
	const policy = require_policy.resolveAgentHarnessPolicy({
		config: params.config,
		provider: configuredDefault.provider,
		modelId: configuredDefault.model
	});
	if (!require_codex_synthetic_usage.shouldUseCodexSyntheticUsageForRuntime({
		provider: configuredDefault.provider,
		effectiveHarness: policy.runtime
	})) return false;
	return require_codex_synthetic_usage.resolveUsageCredentialType(require_model_auth_label.resolveModelAuthLabel({
		provider: configuredDefault.provider,
		acceptedProviderIds: require_openai_routing.listOpenAIAuthProfileProvidersForAgentRuntime({
			provider: configuredDefault.provider,
			harnessRuntime: policy.runtime,
			config: params.config
		}),
		cfg: params.config,
		agentDir: params.agentDir,
		includeExternalProfiles: false
	})) !== "api_key";
}
/** Runs the lightweight security audit used by status JSON/all output. */
async function resolveStatusSecurityAudit(params) {
	const { runSecurityAudit } = await loadSecurityAuditModule();
	const { resolveReadOnlyChannelPluginsForConfig } = await loadReadOnlyChannelPluginsModule();
	const readOnlyPlugins = resolveReadOnlyChannelPluginsForConfig(params.config, {
		activationSourceConfig: params.sourceConfig,
		includeSetupFallbackPlugins: false
	});
	return await runSecurityAudit({
		config: params.config,
		sourceConfig: params.sourceConfig,
		deep: false,
		...params.timeoutMs !== void 0 ? { deepTimeoutMs: params.timeoutMs } : {},
		includeFilesystem: true,
		includeChannelSecurity: true,
		loadPluginSecurityCollectors: false,
		...readOnlyPlugins.missingConfiguredChannelIds.length === 0 ? { plugins: readOnlyPlugins.plugins } : {}
	});
}
/** Loads provider usage for status output, defaulting to the config's default agent directory. */
async function resolveStatusUsageSummary(params) {
	const { loadProviderUsageSummary } = await loadProviderUsage();
	const agentDir = params.agentDir ?? require_agent_scope_config.resolveDefaultAgentDir(params.config);
	const usage = await loadProviderUsageSummary({
		timeoutMs: params.timeoutMs,
		config: params.config,
		agentDir
	});
	if (!shouldUseConfiguredCodexSyntheticUsage({
		config: params.config,
		agentDir
	})) return usage;
	return require_codex_synthetic_usage.mergeUsageSummaries(usage, await loadProviderUsageSummary({
		timeoutMs: params.timeoutMs,
		providers: ["openai"],
		auth: [require_codex_synthetic_usage.buildCodexSyntheticUsageAuth()],
		config: params.config,
		agentDir
	}));
}
/** Exposes the lazily loaded provider-usage module for callers that need its helpers. */
async function loadStatusProviderUsageModule() {
	return await loadProviderUsage();
}
/** Calls gateway health and lets errors propagate to deep status callers. */
async function resolveStatusGatewayHealth(params) {
	const { callGateway } = await loadGatewayCallModule();
	return await callGateway({
		method: "health",
		params: { probe: true },
		timeoutMs: params.timeoutMs,
		config: params.config
	});
}
/** Calls gateway health but converts unreachable/failing probes into an error object. */
async function resolveStatusGatewayHealthSafe(params) {
	if (!params.gatewayReachable) return { error: params.gatewayProbeError ?? "gateway unreachable" };
	const { callGateway } = await loadGatewayCallModule();
	return await callGateway({
		method: "health",
		params: { probe: true },
		timeoutMs: params.timeoutMs,
		config: params.config,
		...params.callOverrides
	}).catch((err) => ({ error: String(err) }));
}
/** Reads gateway delivery diagnostics when reachable, returning null on failures. */
async function resolveStatusGatewayDiagnosticsSafe(params) {
	if (!params.gatewayReachable) return null;
	const { callGateway } = await loadGatewayCallModule();
	return await callGateway({
		method: "diagnostics.stability",
		params: { limit: 1e3 },
		timeoutMs: params.timeoutMs,
		config: params.config,
		...params.callOverrides
	}).catch(() => null);
}
/** Reads the most recent gateway heartbeat only when the gateway probe succeeded. */
async function resolveStatusLastHeartbeat(params) {
	if (!params.gatewayReachable) return null;
	const { callGateway } = await loadGatewayCallModule();
	return await callGateway({
		method: "last-heartbeat",
		params: {},
		timeoutMs: params.timeoutMs,
		config: params.config
	}).catch(() => null);
}
const DEFAULT_SERVICE_PROBE_TIMEOUT_MS = 5e3;
/** Resolves launchd/systemd summaries for the gateway and node services together. */
async function resolveStatusServiceSummaries(timeoutMs) {
	const probeTimeoutMs = timeoutMs ?? DEFAULT_SERVICE_PROBE_TIMEOUT_MS;
	return await Promise.all([getDaemonStatusSummary(probeTimeoutMs), getNodeDaemonStatusSummary(probeTimeoutMs)]);
}
/** Resolves optional usage/deep runtime details plus service summaries for status output. */
async function resolveStatusRuntimeDetails(params) {
	const resolveUsageSummary = params.resolveUsage ?? resolveStatusUsageSummary;
	const resolveGatewayHealthSummary = params.resolveHealth ?? resolveStatusGatewayHealth;
	const usage = params.usage ? await resolveUsageSummary({
		timeoutMs: params.timeoutMs,
		config: params.config
	}) : void 0;
	const health = params.deep ? params.suppressHealthErrors ? await resolveGatewayHealthSummary({
		config: params.config,
		timeoutMs: params.timeoutMs
	}).catch(() => void 0) : await resolveGatewayHealthSummary({
		config: params.config,
		timeoutMs: params.timeoutMs
	}) : void 0;
	const lastHeartbeat = params.deep ? await resolveStatusLastHeartbeat({
		config: params.config,
		timeoutMs: params.timeoutMs,
		gatewayReachable: params.gatewayReachable
	}) : null;
	const [gatewayService, nodeService] = await resolveStatusServiceSummaries(params.timeoutMs);
	return {
		usage,
		health,
		lastHeartbeat,
		gatewayService,
		nodeService
	};
}
/** Resolves the full runtime snapshot, including optional security audit, for status JSON/text. */
async function resolveStatusRuntimeSnapshot(params) {
	return {
		securityAudit: params.includeSecurityAudit ? await (params.resolveSecurityAudit ?? resolveStatusSecurityAudit)({
			config: params.config,
			sourceConfig: params.sourceConfig,
			timeoutMs: params.timeoutMs
		}) : void 0,
		...await resolveStatusRuntimeDetails({
			config: params.config,
			timeoutMs: params.timeoutMs,
			usage: params.usage,
			deep: params.deep,
			gatewayReachable: params.gatewayReachable,
			suppressHealthErrors: params.suppressHealthErrors,
			resolveUsage: params.resolveUsage,
			resolveHealth: params.resolveHealth
		})
	};
}
//#endregion
//#region src/commands/status-update-restart.ts
function readReason(payload) {
	const reason = payload.stats?.reason;
	return typeof reason === "string" && reason.trim().length > 0 ? reason : null;
}
function readAfterVersion(payload) {
	const version = payload.stats?.after?.version;
	return typeof version === "string" && version.trim().length > 0 ? version : null;
}
/** Returns the one-line update restart status value, or null when no update sentinel applies. */
function formatUpdateRestartStatusValue(payload, opts = {}) {
	if (payload?.kind !== "update") return null;
	const age = opts.formatTimeAgo && Number.isFinite(payload.ts) ? ` · ${opts.formatTimeAgo(Math.max(0, (opts.nowMs ?? Date.now()) - payload.ts))}` : "";
	const reason = readReason(payload);
	const warn = opts.warn ?? ((value) => value);
	const ok = opts.ok ?? ((value) => value);
	const muted = opts.muted ?? ((value) => value);
	if (payload.status === "error") return warn(`failed · ${reason ?? "restart failed"} · run operator gateway status --deep${age}`);
	if (payload.status === "skipped") {
		if (reason === "managed-service-handoff-started") return warn(`handoff running · gateway restart pending · run operator update status${age}`);
		if (reason === "restart-health-pending") return warn(`restart pending health verification · run operator gateway status --deep${age}`);
		return muted(`skipped · ${reason ?? "restart skipped"}${age}`);
	}
	const version = readAfterVersion(payload);
	return ok(`verified${version ? ` · gateway ${version}` : ""}${age}`);
}
/** Returns follow-up action lines for update restart failures or pending handoffs. */
function formatUpdateRestartActionLines(payload) {
	if (payload?.kind !== "update") return [];
	if (payload.status === "error") return ["Update restart failed; run operator gateway status --deep.", "If the service is down, run operator gateway restart or operator gateway install --force."];
	const reason = readReason(payload);
	if (payload.status === "skipped" && (reason === "managed-service-handoff-started" || reason === "restart-health-pending")) return ["Update restart is still pending; run operator update status --json for handoff state.", "If it stays pending, run operator gateway status --deep."];
	return [];
}
//#endregion
//#region src/commands/status-all/report-tables.ts
const statusOverviewTableColumns = [{
	key: "Item",
	header: "Item",
	minWidth: 10
}, {
	key: "Value",
	header: "Value",
	flex: true,
	minWidth: 24
}];
const statusAgentsTableColumns = [
	{
		key: "Agent",
		header: "Agent",
		minWidth: 12
	},
	{
		key: "BootstrapFile",
		header: "Bootstrap file",
		minWidth: 14
	},
	{
		key: "Sessions",
		header: "Sessions",
		align: "right",
		minWidth: 8
	},
	{
		key: "Active",
		header: "Active",
		minWidth: 10
	},
	{
		key: "Store",
		header: "Store",
		flex: true,
		minWidth: 34
	}
];
/** Formats agent status rows for the status report table. */
function buildStatusAgentTableRows(params) {
	return params.agentStatus.agents.map((agent) => ({
		Agent: agent.name?.trim() ? `${agent.id} (${agent.name.trim()})` : agent.id,
		BootstrapFile: agent.bootstrapPending === true ? params.warn("PRESENT") : agent.bootstrapPending === false ? params.ok("ABSENT") : "unknown",
		Sessions: String(agent.sessionsCount),
		Active: agent.lastActiveAgeMs != null ? require_format_relative.formatTimeAgo(agent.lastActiveAgeMs) : "unknown",
		Store: agent.sessionsPath
	}));
}
/** Converts per-channel account detail rows into renderable table sections. */
function buildStatusChannelDetailSections(params) {
	return params.details.map((detail) => ({
		kind: "table",
		title: detail.title,
		width: params.width,
		renderTable: params.renderTable,
		columns: detail.columns.map((column) => ({
			key: column,
			header: column,
			flex: column === "Notes",
			minWidth: column === "Notes" ? 28 : 10
		})),
		rows: detail.rows.map((row) => ({
			...row,
			...row.Status === "OK" ? { Status: params.ok("OK") } : row.Status === "WARN" ? { Status: params.warn("WARN") } : {}
		}))
	}));
}
//#endregion
//#region src/commands/status-all/report-sections.ts
/** Builds the top-level status overview table section. */
function buildStatusOverviewSection(params) {
	return {
		kind: "table",
		title: "Overview",
		width: params.width,
		renderTable: params.renderTable,
		columns: [...statusOverviewTableColumns],
		rows: params.rows
	};
}
/** Builds the channel summary section with gateway issue overlays. */
function buildStatusChannelsSection(params) {
	return {
		kind: "table",
		title: "Channels",
		width: params.width,
		renderTable: params.renderTable,
		columns: require_channels_table.statusChannelsTableColumns.map((column) => column.key === "Detail" ? Object.assign({}, column, { minWidth: 28 }) : column),
		rows: require_channels_table.buildStatusChannelsTableRows({
			rows: params.rows,
			channelIssues: params.channelIssues,
			ok: params.ok,
			warn: params.warn,
			muted: params.muted,
			accentDim: params.accentDim,
			formatIssueMessage: params.formatIssueMessage
		})
	};
}
/** Wraps preformatted channel rows into a status report section. */
function buildStatusChannelsTableSection(params) {
	return {
		kind: "table",
		title: "Channels",
		width: params.width,
		renderTable: params.renderTable,
		columns: [...params.columns],
		rows: params.rows
	};
}
/** Builds one account-detail section per configured channel. */
function buildStatusChannelDetailsSections(params) {
	return buildStatusChannelDetailSections({
		details: params.details,
		width: params.width,
		renderTable: params.renderTable,
		ok: params.ok,
		warn: params.warn
	});
}
/** Builds the agent sessions/bootstrap summary table section. */
function buildStatusAgentsSection(params) {
	return {
		kind: "table",
		title: "Agents",
		width: params.width,
		renderTable: params.renderTable,
		columns: [...statusAgentsTableColumns],
		rows: buildStatusAgentTableRows({
			agentStatus: params.agentStatus,
			ok: params.ok,
			warn: params.warn
		})
	};
}
/** Builds the session table section used by status variants that include recent sessions. */
function buildStatusSessionsSection(params) {
	return {
		kind: "table",
		title: "Sessions",
		width: params.width,
		renderTable: params.renderTable,
		columns: [...params.columns],
		rows: params.rows
	};
}
/** Builds the optional system-events section, skipped when no rows are present. */
function buildStatusSystemEventsSection(params) {
	return {
		kind: "table",
		title: "System events",
		width: params.width,
		renderTable: params.renderTable,
		columns: [{
			key: "Event",
			header: "Event",
			flex: true,
			minWidth: 24
		}],
		rows: params.rows ?? [],
		trailer: params.trailer,
		skipIfEmpty: true
	};
}
/** Builds the optional health table section. */
function buildStatusHealthSection(params) {
	return {
		kind: "table",
		title: "Health",
		width: params.width,
		renderTable: params.renderTable,
		columns: [...params.columns ?? []],
		rows: params.rows ?? [],
		skipIfEmpty: true
	};
}
/** Builds the optional usage text section. */
function buildStatusUsageSection(params) {
	return {
		kind: "lines",
		title: "Usage",
		body: params.usageLines ?? [],
		skipIfEmpty: true
	};
}
//#endregion
//#region src/commands/status-all/text-report.ts
/** Appends a blank-line-separated section heading. */
function appendStatusSectionHeading(params) {
	if (params.lines.length > 0) params.lines.push("");
	params.lines.push(params.heading(params.title));
}
function appendStatusLinesSection(params) {
	appendStatusSectionHeading(params);
	params.lines.push(...params.body);
}
function appendStatusTableSection(params) {
	appendStatusSectionHeading(params);
	params.lines.push(params.renderTable({
		width: params.width,
		columns: [...params.columns],
		rows: params.rows
	}).trimEnd());
}
/** Appends all non-empty report sections in display order. */
function appendStatusReportSections(params) {
	for (const section of params.sections) {
		if (section.kind === "raw") {
			if (section.skipIfEmpty && section.body.length === 0) continue;
			params.lines.push(...section.body);
			continue;
		}
		if (section.kind === "lines") {
			if (section.skipIfEmpty && section.body.length === 0) continue;
			appendStatusLinesSection({
				lines: params.lines,
				heading: params.heading,
				title: section.title,
				body: section.body
			});
			continue;
		}
		if (section.skipIfEmpty && section.rows.length === 0) continue;
		appendStatusTableSection({
			lines: params.lines,
			heading: params.heading,
			title: section.title,
			width: section.width,
			renderTable: section.renderTable,
			columns: section.columns,
			rows: section.rows
		});
		if (section.trailer) params.lines.push(section.trailer);
	}
}
//#endregion
Object.defineProperty(exports, "appendStatusReportSections", {
	enumerable: true,
	get: function() {
		return appendStatusReportSections;
	}
});
Object.defineProperty(exports, "appendStatusSectionHeading", {
	enumerable: true,
	get: function() {
		return appendStatusSectionHeading;
	}
});
Object.defineProperty(exports, "buildStatusAgentsSection", {
	enumerable: true,
	get: function() {
		return buildStatusAgentsSection;
	}
});
Object.defineProperty(exports, "buildStatusAllOverviewRows", {
	enumerable: true,
	get: function() {
		return buildStatusAllOverviewRows;
	}
});
Object.defineProperty(exports, "buildStatusChannelDetailsSections", {
	enumerable: true,
	get: function() {
		return buildStatusChannelDetailsSections;
	}
});
Object.defineProperty(exports, "buildStatusChannelsSection", {
	enumerable: true,
	get: function() {
		return buildStatusChannelsSection;
	}
});
Object.defineProperty(exports, "buildStatusChannelsTableSection", {
	enumerable: true,
	get: function() {
		return buildStatusChannelsTableSection;
	}
});
Object.defineProperty(exports, "buildStatusCommandOverviewRows", {
	enumerable: true,
	get: function() {
		return buildStatusCommandOverviewRows;
	}
});
Object.defineProperty(exports, "buildStatusFooterLines", {
	enumerable: true,
	get: function() {
		return buildStatusFooterLines;
	}
});
Object.defineProperty(exports, "buildStatusGatewayJsonPayloadFromSurface", {
	enumerable: true,
	get: function() {
		return buildStatusGatewayJsonPayloadFromSurface;
	}
});
Object.defineProperty(exports, "buildStatusHealthRows", {
	enumerable: true,
	get: function() {
		return buildStatusHealthRows;
	}
});
Object.defineProperty(exports, "buildStatusHealthSection", {
	enumerable: true,
	get: function() {
		return buildStatusHealthSection;
	}
});
Object.defineProperty(exports, "buildStatusModelSelectionLines", {
	enumerable: true,
	get: function() {
		return buildStatusModelSelectionLines;
	}
});
Object.defineProperty(exports, "buildStatusOverviewSection", {
	enumerable: true,
	get: function() {
		return buildStatusOverviewSection;
	}
});
Object.defineProperty(exports, "buildStatusOverviewSurfaceFromOverview", {
	enumerable: true,
	get: function() {
		return buildStatusOverviewSurfaceFromOverview;
	}
});
Object.defineProperty(exports, "buildStatusOverviewSurfaceFromScan", {
	enumerable: true,
	get: function() {
		return buildStatusOverviewSurfaceFromScan;
	}
});
Object.defineProperty(exports, "buildStatusPairingRecoveryLines", {
	enumerable: true,
	get: function() {
		return buildStatusPairingRecoveryLines;
	}
});
Object.defineProperty(exports, "buildStatusPluginCompatibilityLines", {
	enumerable: true,
	get: function() {
		return buildStatusPluginCompatibilityLines;
	}
});
Object.defineProperty(exports, "buildStatusSecurityAuditLines", {
	enumerable: true,
	get: function() {
		return buildStatusSecurityAuditLines;
	}
});
Object.defineProperty(exports, "buildStatusSessionsRows", {
	enumerable: true,
	get: function() {
		return buildStatusSessionsRows;
	}
});
Object.defineProperty(exports, "buildStatusSessionsSection", {
	enumerable: true,
	get: function() {
		return buildStatusSessionsSection;
	}
});
Object.defineProperty(exports, "buildStatusSystemEventsRows", {
	enumerable: true,
	get: function() {
		return buildStatusSystemEventsRows;
	}
});
Object.defineProperty(exports, "buildStatusSystemEventsSection", {
	enumerable: true,
	get: function() {
		return buildStatusSystemEventsSection;
	}
});
Object.defineProperty(exports, "buildStatusSystemEventsTrailer", {
	enumerable: true,
	get: function() {
		return buildStatusSystemEventsTrailer;
	}
});
Object.defineProperty(exports, "buildStatusUsageSection", {
	enumerable: true,
	get: function() {
		return buildStatusUsageSection;
	}
});
Object.defineProperty(exports, "formatUpdateRestartActionLines", {
	enumerable: true,
	get: function() {
		return formatUpdateRestartActionLines;
	}
});
Object.defineProperty(exports, "formatUpdateRestartStatusValue", {
	enumerable: true,
	get: function() {
		return formatUpdateRestartStatusValue;
	}
});
Object.defineProperty(exports, "loadStatusProviderUsageModule", {
	enumerable: true,
	get: function() {
		return loadStatusProviderUsageModule;
	}
});
Object.defineProperty(exports, "resolveStatusGatewayDiagnosticsSafe", {
	enumerable: true,
	get: function() {
		return resolveStatusGatewayDiagnosticsSafe;
	}
});
Object.defineProperty(exports, "resolveStatusGatewayHealth", {
	enumerable: true,
	get: function() {
		return resolveStatusGatewayHealth;
	}
});
Object.defineProperty(exports, "resolveStatusGatewayHealthSafe", {
	enumerable: true,
	get: function() {
		return resolveStatusGatewayHealthSafe;
	}
});
Object.defineProperty(exports, "resolveStatusRuntimeSnapshot", {
	enumerable: true,
	get: function() {
		return resolveStatusRuntimeSnapshot;
	}
});
Object.defineProperty(exports, "resolveStatusSecurityAudit", {
	enumerable: true,
	get: function() {
		return resolveStatusSecurityAudit;
	}
});
Object.defineProperty(exports, "resolveStatusServiceSummaries", {
	enumerable: true,
	get: function() {
		return resolveStatusServiceSummaries;
	}
});
Object.defineProperty(exports, "resolveStatusUsageSummary", {
	enumerable: true,
	get: function() {
		return resolveStatusUsageSummary;
	}
});
Object.defineProperty(exports, "statusHealthColumns", {
	enumerable: true,
	get: function() {
		return statusHealthColumns;
	}
});
