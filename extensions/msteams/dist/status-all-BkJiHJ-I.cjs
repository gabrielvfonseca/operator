require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_oauth_refresh_failure = require("./oauth-refresh-failure-DoD44a9z.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_format_relative = require("./format-relative-DEaTzxP-.cjs");
const require_status = require("./status-BcOaWXbB.cjs");
const require_balanced_json = require("./balanced-json-4zffEv32.cjs");
const require_ports = require("./ports-DVTOW6GH.cjs");
const require_exec_defaults = require("./exec-defaults-DvQXwpzS.cjs");
const require_table = require("./table-B4dxfer5.cjs");
const require_remote = require("./remote-Dds9m5_I.cjs");
const require_status$1 = require("./status-pSULYkKm.cjs");
const require_restart_sentinel = require("./restart-sentinel-BH8dJFkM.cjs");
const require_restart_logs = require("./restart-logs-D6dsuNEi.cjs");
const require_progress = require("./progress-JkW4pQSo.cjs");
const require_diagnostics = require("./diagnostics-DtsXjNEN.cjs");
const require_status_gateway_connection = require("./status.gateway-connection-qfCMWvtt.cjs");
const require_format = require("./format-Y6on_ttU.cjs");
const require_text_report = require("./text-report-Dqcz9HOW.cjs");
const require_status_node_mode = require("./status.node-mode-DSb51TC4.cjs");
const require_status_scan_overview = require("./status.scan-overview-CfkCsnYL.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/status-all/report-data.ts
function resolveStatusAllConfigPath(path) {
	const trimmed = path?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : "(unknown config path)";
}
/** Collects local diagnosis inputs that are not part of the shared overview scan. */
async function resolveStatusAllLocalDiagnosis(params) {
	const { overview } = params;
	const snap = await require_io.readConfigFileSnapshot({ observe: false }).catch(() => null);
	const configPath = resolveStatusAllConfigPath(snap?.path);
	const health = params.nodeOnlyGateway ? void 0 : await require_text_report.resolveStatusGatewayHealthSafe({
		config: overview.cfg,
		timeoutMs: Math.min(8e3, params.timeoutMs ?? 1e4),
		gatewayReachable: params.gatewayReachable,
		gatewayProbeError: params.gatewayProbe?.error ?? null,
		...params.gatewayCallOverrides ? { callOverrides: params.gatewayCallOverrides } : {}
	});
	const diagnostics = params.nodeOnlyGateway ? null : await require_text_report.resolveStatusGatewayDiagnosticsSafe({
		config: overview.cfg,
		timeoutMs: Math.min(5e3, params.timeoutMs ?? 1e4),
		gatewayReachable: params.gatewayReachable,
		...params.gatewayCallOverrides ? { callOverrides: params.gatewayCallOverrides } : {}
	});
	params.progress.setLabel("Checking local state…");
	const sentinel = await require_restart_sentinel.readRestartSentinel().catch(() => null);
	const lastErr = await require_diagnostics.readLastGatewayErrorLine(process.env).catch(() => null);
	const port = require_paths.resolveGatewayPort(overview.cfg);
	const portUsage = await require_ports.inspectPortUsage(port).catch(() => null);
	params.progress.tick();
	const defaultWorkspace = overview.agentStatus.agents.find((a) => a.id === overview.agentStatus.defaultId)?.workspaceDir ?? overview.agentStatus.agents[0]?.workspaceDir ?? null;
	const skillStatus = defaultWorkspace != null ? (() => {
		try {
			const nodeSkills = require_exec_defaults.resolveNodeExecEligibility({
				cfg: overview.cfg,
				agentId: overview.agentStatus.defaultId
			});
			return require_status.buildWorkspaceSkillStatus(defaultWorkspace, {
				config: overview.cfg,
				eligibility: {
					nodeSkills,
					remote: require_remote.getRemoteSkillEligibility({ advertiseExecNode: nodeSkills.canExec })
				}
			});
		} catch {
			return null;
		}
	})() : null;
	const pluginCompatibility = require_status$1.buildPluginCompatibilityNotices({ config: overview.cfg });
	return {
		configPath,
		health,
		diagnosis: {
			snap,
			remoteUrlMissing: overview.gatewaySnapshot.remoteUrlMissing,
			secretDiagnostics: overview.secretDiagnostics,
			sentinel,
			lastErr,
			port,
			portUsage,
			tailscaleMode: overview.tailscaleMode,
			tailscale: {
				backendState: null,
				dnsName: overview.tailscaleDns,
				ips: [],
				error: null
			},
			tailscaleHttpsUrl: overview.tailscaleHttpsUrl,
			skillStatus,
			pluginCompatibility,
			channelsStatus: overview.channelsStatus,
			channelIssues: overview.channelIssues,
			agentStatus: overview.agentStatus,
			gatewayReachable: params.gatewayReachable,
			health,
			deliveryDiagnostics: diagnostics,
			nodeOnlyGateway: params.nodeOnlyGateway
		}
	};
}
/** Builds the full status-all report data model from a completed overview scan. */
async function buildStatusAllReportData(params) {
	const gatewaySnapshot = params.overview.gatewaySnapshot;
	const { configPath, health, diagnosis } = await resolveStatusAllLocalDiagnosis({
		overview: params.overview,
		progress: params.progress,
		gatewayReachable: gatewaySnapshot.gatewayReachable,
		gatewayProbe: gatewaySnapshot.gatewayProbe,
		gatewayCallOverrides: gatewaySnapshot.gatewayCallOverrides,
		nodeOnlyGateway: params.nodeOnlyGateway,
		timeoutMs: params.timeoutMs
	});
	return {
		overviewRows: require_text_report.buildStatusAllOverviewRows({
			surface: require_text_report.buildStatusOverviewSurfaceFromOverview({
				overview: params.overview,
				gatewayService: params.daemon,
				nodeService: params.nodeService,
				nodeOnlyGateway: params.nodeOnlyGateway
			}),
			osLabel: params.overview.osSummary.label,
			configPath,
			secretDiagnosticsCount: params.overview.secretDiagnostics.length,
			updateRestartValue: require_text_report.formatUpdateRestartStatusValue(diagnosis.sentinel?.payload),
			agentStatus: params.overview.agentStatus,
			tailscaleBackendState: diagnosis.tailscale.backendState
		}),
		channels: params.overview.channels,
		channelIssues: params.overview.channelIssues.map((issue) => ({
			channel: issue.channel,
			message: issue.message
		})),
		agentStatus: params.overview.agentStatus,
		connectionDetailsForReport: require_status_gateway_connection.resolveStatusAllConnectionDetails({
			nodeOnlyGateway: params.nodeOnlyGateway,
			remoteUrlMissing: gatewaySnapshot.remoteUrlMissing,
			gatewayConnection: gatewaySnapshot.gatewayConnection,
			bindMode: params.overview.cfg.gateway?.bind ?? "loopback",
			configPath
		}),
		diagnosis: {
			...diagnosis,
			health
		}
	};
}
//#endregion
//#region src/commands/status-all/gateway.ts
/** Reads the last non-empty lines from a gateway log file, returning an empty list on read failure. */
async function readFileTailLines(filePath, maxLines) {
	const lines = await require_diagnostics.readGatewayLogTailLines(filePath).catch(() => []);
	if (lines.length === 0) return [];
	return lines.slice(Math.max(0, lines.length - maxLines)).map((line) => line.trimEnd()).filter((line) => line.trim().length > 0);
}
function shorten(message, maxLen) {
	const cleaned = message.replace(/\s+/g, " ").trim();
	if (cleaned.length <= maxLen) return cleaned;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(cleaned, Math.max(0, maxLen - 1))}…`;
}
function normalizeGwsLine(line) {
	return line.replace(/\s+runId=[^\s]+/g, "").replace(/\s+conn=[^\s]+/g, "").replace(/\s+id=[^\s]+/g, "").replace(/\s+error=Error:.*$/g, "").trim();
}
function consumeJsonBlock(lines, startIndex) {
	const startLine = lines[startIndex] ?? "";
	const braceAt = startLine.indexOf("{");
	if (braceAt < 0) return null;
	const raw = [startLine.slice(braceAt), ...lines.slice(startIndex + 1)].join("\n");
	const fragment = require_balanced_json.extractBalancedJsonPrefix(raw);
	if (!fragment) return {
		json: raw,
		endIndex: lines.length - 1
	};
	const consumedLineOffset = fragment.json.split("\n").length - 1;
	return {
		json: fragment.json,
		endIndex: startIndex + consumedLineOffset
	};
}
/** Summarizes gateway log tail lines, grouping repeated failures and trimming long output. */
function summarizeLogTail(rawLines, opts) {
	const maxLines = Math.max(6, opts?.maxLines ?? 26);
	const out = [];
	const groups = /* @__PURE__ */ new Map();
	const addGroup = (key, base) => {
		const existing = groups.get(key);
		if (existing) {
			existing.count += 1;
			return;
		}
		groups.set(key, {
			count: 1,
			index: out.length,
			base
		});
		out.push(base);
	};
	const addLine = (line) => {
		const trimmed = line.trimEnd();
		if (!trimmed) return;
		out.push(trimmed);
	};
	const lines = rawLines.map((line) => line.trimEnd()).filter(Boolean);
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i] ?? "";
		const trimmedStart = line.trimStart();
		if ((trimmedStart.startsWith("\"") || trimmedStart === "}" || trimmedStart === "{" || trimmedStart.startsWith("}") || trimmedStart.startsWith("{")) && !trimmedStart.startsWith("[") && !trimmedStart.startsWith("#")) continue;
		const tokenRefresh = line.match(/^\[([^\]]+)\]\s+Token refresh failed:\s*(\d+)\s*(\{)?\s*$/);
		if (tokenRefresh) {
			const tag = tokenRefresh[1] ?? "unknown";
			const status = tokenRefresh[2] ?? "unknown";
			const block = consumeJsonBlock(lines, i);
			if (block) {
				i = block.endIndex;
				const parsed = (() => {
					try {
						return JSON.parse(block.json);
					} catch {
						return null;
					}
				})();
				const code = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parsed?.error?.code) ?? null;
				const msg = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parsed?.error?.message) ?? null;
				const refreshReason = require_oauth_refresh_failure.classifyOAuthRefreshFailureReason(msg ?? "");
				const msgShort = msg ? refreshReason ? "re-auth required" : shorten(msg, 52) : null;
				const base = `[${tag}] token refresh ${status}${code ? ` ${code}` : ""}${msgShort ? ` · ${msgShort}` : ""}`;
				addGroup(`token:${tag}:${status}:${code ?? ""}:${msgShort ?? ""}`, base);
				continue;
			}
		}
		const embedded = line.match(/^Embedded agent failed before reply:\s+OAuth token refresh failed for ([^:]+):/);
		if (embedded) {
			const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(embedded[1]) || "unknown";
			addGroup(`embedded:${provider}`, `Embedded agent: OAuth token refresh failed (${provider})`);
			continue;
		}
		if (line.startsWith("[gws]") && line.includes("errorCode=UNAVAILABLE") && line.includes("OAuth token refresh failed")) {
			const normalized = normalizeGwsLine(line);
			addGroup(`gws:${normalized}`, normalized);
			continue;
		}
		addLine(line);
	}
	for (const g of groups.values()) {
		if (g.count <= 1) continue;
		out[g.index] = `${g.base} ×${g.count}`;
	}
	const deduped = [];
	for (const line of out) {
		if (deduped[deduped.length - 1] === line) continue;
		deduped.push(line);
	}
	if (deduped.length <= maxLines) return deduped;
	const head = Math.min(6, Math.floor(maxLines / 3));
	const tail = Math.max(1, maxLines - head - 1);
	return [
		...deduped.slice(0, head),
		`… ${deduped.length - head - tail} lines omitted …`,
		...deduped.slice(-tail)
	];
}
//#endregion
//#region src/commands/status-all/diagnosis.ts
const AGENT_ACTIVITY_SOFT_WARNING_MS = 30 * 6e4;
function countRecentAgentSessions(agentStatus, thresholdMs) {
	return agentStatus.agents.filter((agent) => agent.lastActiveAgeMs != null && agent.lastActiveAgeMs <= thresholdMs).length;
}
function countGatewayListenerPids(portUsage) {
	const pids = /* @__PURE__ */ new Set();
	for (const listener of portUsage.listeners) {
		if (require_ports.classifyPortListener(listener, portUsage.port) !== "gateway") continue;
		if (typeof listener.pid === "number" && Number.isFinite(listener.pid)) pids.add(listener.pid);
	}
	return pids.size;
}
function isDeliveryDiagnosticsLike(value) {
	return Boolean(value && typeof value === "object");
}
function countDeliveryEvent(snapshot, type) {
	const value = snapshot.summary?.byType?.[type];
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function latestDeliveryEventAgeMs(snapshot) {
	const latestTs = (snapshot.events ?? []).filter((event) => [
		"message.received",
		"message.dispatch.started",
		"message.dispatch.completed",
		"session.turn.created",
		"message.processed"
	].includes(event.type ?? "")).reduce((max, event) => {
		const ts = event.ts;
		return typeof ts === "number" && Number.isFinite(ts) ? Math.max(max, ts) : max;
	}, 0);
	return latestTs > 0 ? Date.now() - latestTs : null;
}
/** Appends config, gateway, channel, delivery, and log diagnostics to the status-all report. */
async function appendStatusAllDiagnosis(params) {
	const { lines, muted, ok, warn, fail } = params;
	const emitCheck = (label, status) => {
		const icon = status === "ok" ? ok("✓") : status === "warn" ? warn("!") : fail("✗");
		const colored = status === "ok" ? ok(label) : status === "warn" ? warn(label) : fail(label);
		lines.push(`${icon} ${colored}`);
	};
	lines.push("");
	lines.push(muted("Gateway connection details:"));
	for (const line of require_format.redactSecrets(params.connectionDetailsForReport).split("\n").map((l) => l.trimEnd())) lines.push(`  ${muted(line)}`);
	lines.push("");
	if (params.snap) {
		const status = !params.snap.exists ? "fail" : params.snap.valid ? "ok" : "warn";
		emitCheck(`Config: ${params.snap.path ?? "(unknown)"}`, status);
		const issues = [...params.snap.legacyIssues ?? [], ...params.snap.issues ?? []];
		const uniqueIssues = issues.filter((issue, index) => issues.findIndex((x) => x.path === issue.path && x.message === issue.message) === index);
		for (const issue of uniqueIssues.slice(0, 12)) lines.push(`  ${require_io.formatConfigIssueLine(issue, "-")}`);
		if (uniqueIssues.length > 12) lines.push(`  ${muted(`… +${uniqueIssues.length - 12} more`)}`);
	} else emitCheck("Config: read failed", "warn");
	if (params.remoteUrlMissing) {
		lines.push("");
		emitCheck("Gateway remote mode misconfigured (gateway.remote.url missing)", "warn");
		lines.push(`  ${muted("Fix: set gateway.remote.url, or set gateway.mode=local.")}`);
	}
	emitCheck(`Secret diagnostics (${params.secretDiagnostics.length})`, params.secretDiagnostics.length === 0 ? "ok" : "warn");
	for (const diagnostic of params.secretDiagnostics.slice(0, 10)) lines.push(`  - ${muted(require_format.redactSecrets(diagnostic))}`);
	if (params.secretDiagnostics.length > 10) lines.push(`  ${muted(`… +${params.secretDiagnostics.length - 10} more`)}`);
	if (params.sentinel?.payload) {
		emitCheck("Restart sentinel present", "warn");
		lines.push(`  ${muted(`${require_restart_sentinel.summarizeRestartSentinel(params.sentinel.payload)} · ${require_format_relative.formatTimeAgo(Date.now() - params.sentinel.payload.ts)}`)}`);
		const updateRestartValue = require_text_report.formatUpdateRestartStatusValue(params.sentinel.payload, { formatTimeAgo: require_format_relative.formatTimeAgo });
		if (updateRestartValue) lines.push(`  ${muted(`Update restart: ${updateRestartValue}`)}`);
		for (const line of require_text_report.formatUpdateRestartActionLines(params.sentinel.payload)) lines.push(`  ${muted(line)}`);
	} else emitCheck("Restart sentinel: none", "ok");
	const lastErrClean = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.lastErr) ?? "";
	const isTrivialLastErr = lastErrClean.length < 8 || lastErrClean === "}" || lastErrClean === "{";
	if (lastErrClean && !isTrivialLastErr) {
		lines.push("");
		lines.push(muted("Gateway last log line:"));
		lines.push(`  ${muted(require_format.redactSecrets(lastErrClean))}`);
	}
	if (params.portUsage) {
		const benignDualStackLoopback = require_ports.isDualStackLoopbackGatewayListeners(params.portUsage.listeners, params.port);
		const expectedGatewayListeners = require_ports.isExpectedGatewayListeners(params.portUsage.listeners, params.port);
		const portOk = params.portUsage.listeners.length === 0 || expectedGatewayListeners;
		emitCheck(`Port ${params.port}`, portOk ? "ok" : "warn");
		if (!portOk) {
			const gatewayPidCount = countGatewayListenerPids(params.portUsage);
			if (gatewayPidCount > 1) lines.push(`  ${muted(`${gatewayPidCount} Operator gateway processes appear to be listening on port ${params.port}; stop stale gateway processes before trusting channel health.`)}`);
			for (const line of require_ports.formatPortDiagnostics(params.portUsage)) lines.push(`  ${muted(line)}`);
		} else if (benignDualStackLoopback) lines.push(`  ${muted("Detected dual-stack loopback listeners (127.0.0.1 + ::1) for one gateway process.")}`);
		else if (expectedGatewayListeners) lines.push(`  ${muted("Detected Operator Gateway listener on the configured port.")}`);
	}
	{
		const backend = params.tailscale.backendState ?? "unknown";
		const okBackend = backend === "Running";
		const hasDns = Boolean(params.tailscale.dnsName);
		emitCheck(params.tailscaleMode === "off" ? `Tailscale exposure: off · daemon ${backend}${params.tailscale.dnsName ? ` · ${params.tailscale.dnsName}` : ""}` : `Tailscale exposure: ${params.tailscaleMode} · daemon ${backend}${params.tailscale.dnsName ? ` · ${params.tailscale.dnsName}` : ""}`, okBackend && (params.tailscaleMode === "off" || hasDns) ? "ok" : "warn");
		if (params.tailscale.error) lines.push(`  ${muted(`error: ${params.tailscale.error}`)}`);
		if (params.tailscale.ips.length > 0) lines.push(`  ${muted(`ips: ${params.tailscale.ips.slice(0, 3).join(", ")}${params.tailscale.ips.length > 3 ? "…" : ""}`)}`);
		if (params.tailscaleHttpsUrl) lines.push(`  ${muted(`https: ${params.tailscaleHttpsUrl}`)}`);
	}
	if (params.skillStatus) {
		const eligible = params.skillStatus.skills.filter((s) => s.eligible).length;
		const missing = params.skillStatus.skills.filter((s) => s.eligible && Object.values(s.missing).some((arr) => arr.length)).length;
		emitCheck(`Skills: ${eligible} eligible · ${missing} missing · ${params.skillStatus.workspaceDir}`, missing === 0 ? "ok" : "warn");
	}
	emitCheck(`Plugin compatibility (${params.pluginCompatibility.length || "none"})`, params.pluginCompatibility.length === 0 ? "ok" : "warn");
	for (const notice of params.pluginCompatibility.slice(0, 12)) {
		const severity = notice.severity === "warn" ? "warn" : "info";
		lines.push(`  - [${severity}] ${require_status$1.formatPluginCompatibilityNotice(notice)}`);
	}
	if (params.pluginCompatibility.length > 12) lines.push(`  ${muted(`… +${params.pluginCompatibility.length - 12} more`)}`);
	if (params.agentStatus) {
		const recentSessions = countRecentAgentSessions(params.agentStatus, AGENT_ACTIVITY_SOFT_WARNING_MS);
		const shouldWarn = params.agentStatus.totalSessions > 0 && recentSessions === 0;
		emitCheck(`Agent activity: ${recentSessions} active in 30m · ${params.agentStatus.totalSessions} sessions`, shouldWarn ? "warn" : "ok");
		if (shouldWarn) lines.push(`  ${muted("No agent session was updated in the last 30m; if channels received messages, verify inbound dispatch and turn creation.")}`);
	}
	if (params.deliveryDiagnostics != null) if (isDeliveryDiagnosticsLike(params.deliveryDiagnostics)) {
		const received = countDeliveryEvent(params.deliveryDiagnostics, "message.received");
		const dispatchStarted = countDeliveryEvent(params.deliveryDiagnostics, "message.dispatch.started");
		const dispatchCompleted = countDeliveryEvent(params.deliveryDiagnostics, "message.dispatch.completed");
		const turnsCreated = countDeliveryEvent(params.deliveryDiagnostics, "session.turn.created");
		const processed = countDeliveryEvent(params.deliveryDiagnostics, "message.processed");
		const hasReceivedWithoutDispatch = received > 0 && dispatchStarted === 0 && processed === 0;
		const hasDispatchWithoutTurn = dispatchStarted > 0 && turnsCreated === 0 && processed < dispatchStarted;
		const hasDispatchGap = dispatchStarted - dispatchCompleted >= 2;
		const latestAgeMs = latestDeliveryEventAgeMs(params.deliveryDiagnostics);
		emitCheck(`Inbound delivery telemetry: received ${received} · dispatch ${dispatchStarted}/${dispatchCompleted} · turns ${turnsCreated} · processed ${processed}`, hasReceivedWithoutDispatch || hasDispatchWithoutTurn || hasDispatchGap ? "warn" : "ok");
		if (latestAgeMs != null) lines.push(`  ${muted(`latest delivery event: ${require_format_relative.formatTimeAgo(latestAgeMs)}`)}`);
		if (hasReceivedWithoutDispatch) lines.push(`  ${muted("Messages were received, but no gateway dispatch started; inspect inbound routing and dispatch handoff.")}`);
		if (hasDispatchWithoutTurn) lines.push(`  ${muted("Gateway dispatch started, but no agent turn was created; inspect reply resolver and session creation.")}`);
		if (hasDispatchGap) lines.push(`  ${muted("Multiple gateway dispatches have not completed yet; if this persists, inspect stuck sessions or model runs.")}`);
	} else emitCheck("Inbound delivery telemetry: unavailable", "warn");
	else if (params.gatewayReachable && !params.nodeOnlyGateway) emitCheck("Inbound delivery telemetry: unavailable", "warn");
	params.progress.setLabel("Reading logs…");
	const logPaths = (() => {
		try {
			return process.platform === "darwin" ? require_restart_logs.resolveGatewaySupervisorLogPaths(process.env, { platform: "darwin" }) : require_restart_logs.resolveGatewayLogPaths(process.env);
		} catch {
			return null;
		}
	})();
	if (logPaths) {
		params.progress.setLabel("Reading logs…");
		const restartLogPath = require_restart_logs.resolveGatewayRestartLogPath(process.env);
		const readStderr = process.platform !== "darwin";
		const [stderrTail, stdoutTail, restartTail] = await Promise.all([
			readStderr ? readFileTailLines(logPaths.stderrPath, 40).catch(() => []) : [],
			readFileTailLines(logPaths.stdoutPath, 40).catch(() => []),
			readFileTailLines(restartLogPath, 30).catch(() => [])
		]);
		if (stderrTail.length > 0 || stdoutTail.length > 0) {
			lines.push("");
			lines.push(muted(`Gateway logs (tail, summarized): ${logPaths.logDir}`));
			if (readStderr) {
				lines.push(`  ${muted(`# stderr: ${logPaths.stderrPath}`)}`);
				for (const line of summarizeLogTail(stderrTail, { maxLines: 22 }).map(require_format.redactSecrets)) lines.push(`  ${muted(line)}`);
			}
			lines.push(`  ${muted(`# stdout: ${logPaths.stdoutPath}`)}`);
			for (const line of summarizeLogTail(stdoutTail, { maxLines: 22 }).map(require_format.redactSecrets)) lines.push(`  ${muted(line)}`);
		}
		if (restartTail.length > 0) {
			lines.push("");
			lines.push(muted(`Gateway restart attempts (tail): ${restartLogPath}`));
			for (const line of summarizeLogTail(restartTail, { maxLines: 16 }).map(require_format.redactSecrets)) lines.push(`  ${muted(line)}`);
		}
	}
	params.progress.tick();
	if (params.channelsStatus) {
		emitCheck(`Channel issues (${params.channelIssues.length || "none"})`, params.channelIssues.length === 0 ? "ok" : "warn");
		for (const issue of params.channelIssues.slice(0, 12)) {
			const fixText = issue.fix ? ` · fix: ${issue.fix}` : "";
			lines.push(`  - ${issue.channel}[${issue.accountId}] ${issue.kind}: ${issue.message}${fixText}`);
		}
		if (params.channelIssues.length > 12) lines.push(`  ${muted(`… +${params.channelIssues.length - 12} more`)}`);
	} else if (params.nodeOnlyGateway) emitCheck(`Channel issues skipped (node-only mode; query ${params.nodeOnlyGateway.gatewayTarget})`, "ok");
	else emitCheck(`Channel issues skipped (gateway ${params.gatewayReachable ? "query failed" : "unreachable"})`, "warn");
	const healthErr = (() => {
		if (!params.health || typeof params.health !== "object") return "";
		const record = params.health;
		if (!("error" in record)) return "";
		const value = record.error;
		if (!value) return "";
		if (typeof value === "string") return value;
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return "[unserializable error]";
		}
	})();
	if (healthErr) {
		lines.push("");
		lines.push(muted("Gateway health:"));
		lines.push(`  ${muted(require_format.redactSecrets(healthErr))}`);
	}
	lines.push("");
	lines.push(muted("Pasteable debug report. Auth tokens redacted."));
	lines.push("Troubleshooting: https://docs.operator.ai/troubleshooting");
	lines.push("");
}
//#endregion
//#region src/commands/status-all/report-lines.ts
/** Builds the complete status-all text report, including overview tables and diagnosis lines. */
async function buildStatusAllReportLines(params) {
	const rich = require_theme.isRich();
	const heading = (text) => rich ? require_theme.theme.heading(text) : text;
	const ok = (text) => rich ? require_theme.theme.success(text) : text;
	const warn = (text) => rich ? require_theme.theme.warn(text) : text;
	const fail = (text) => rich ? require_theme.theme.error(text) : text;
	const muted = (text) => rich ? require_theme.theme.muted(text) : text;
	const tableWidth = require_table.getTerminalTableWidth();
	const lines = [];
	lines.push(heading("Operator status --all"));
	require_text_report.appendStatusReportSections({
		lines,
		heading,
		sections: [
			require_text_report.buildStatusOverviewSection({
				width: tableWidth,
				renderTable: require_table.renderTable,
				rows: params.overviewRows
			}),
			require_text_report.buildStatusChannelsSection({
				width: tableWidth,
				renderTable: require_table.renderTable,
				rows: params.channels.rows,
				channelIssues: params.channelIssues,
				ok,
				warn,
				muted,
				accentDim: require_theme.theme.accentDim,
				formatIssueMessage: (message) => (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(message, 90)
			}),
			...require_text_report.buildStatusChannelDetailsSections({
				details: params.channels.details,
				width: tableWidth,
				renderTable: require_table.renderTable,
				ok,
				warn
			}),
			require_text_report.buildStatusAgentsSection({
				width: tableWidth,
				renderTable: require_table.renderTable,
				agentStatus: params.agentStatus,
				ok,
				warn
			})
		]
	});
	require_text_report.appendStatusSectionHeading({
		lines,
		heading,
		title: "Diagnosis (read-only)"
	});
	await appendStatusAllDiagnosis({
		lines,
		progress: params.progress,
		muted,
		ok,
		warn,
		fail,
		connectionDetailsForReport: params.connectionDetailsForReport,
		...params.diagnosis
	});
	return lines;
}
//#endregion
//#region src/commands/status-all.ts
/** Runs the full read-only status report and writes it to the runtime logger. */
async function statusAllCommand(runtime, opts) {
	await require_progress.withProgress({
		label: "Scanning status --all…",
		total: 11
	}, async (progress) => {
		const overview = await require_status_scan_overview.collectStatusScanOverview({
			commandName: "status --all",
			opts: { timeoutMs: opts?.timeoutMs },
			showSecrets: false,
			runtime,
			useGatewayCallOverridesForChannelsStatus: true,
			includeAdvertisedControlUiLinks: true,
			progress,
			labels: {
				loadingConfig: "Loading config…",
				checkingTailscale: "Checking Tailscale…",
				checkingForUpdates: "Checking for updates…",
				resolvingAgents: "Scanning agents…",
				probingGateway: "Probing gateway…",
				queryingChannelStatus: "Querying gateway…",
				summarizingChannels: "Summarizing channels…"
			}
		});
		progress.setLabel("Checking services…");
		const [daemon, nodeService] = await require_text_report.resolveStatusServiceSummaries(opts?.timeoutMs);
		const nodeOnlyGateway = await require_status_node_mode.resolveNodeOnlyGatewayInfo({
			daemon,
			node: nodeService
		});
		progress.tick();
		const lines = await buildStatusAllReportLines({
			progress,
			...await buildStatusAllReportData({
				overview,
				daemon,
				nodeService,
				nodeOnlyGateway,
				progress,
				timeoutMs: opts?.timeoutMs
			})
		});
		progress.setLabel("Rendering…");
		runtime.log(lines.join("\n"));
		progress.tick();
	});
}
//#endregion
exports.statusAllCommand = statusAllCommand;
