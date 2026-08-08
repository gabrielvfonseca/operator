const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_reply_payload = require("./reply-payload-B-1jXr3E.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
const require_workspace = require("./workspace-oX0zfOZq.cjs");
require("./config-DT0qiglW.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_resolve = require("./model-selection-resolve-DIIpxg9p.cjs");
const require_model_thinking_default = require("./model-thinking-default-3L3oHDLO.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_model_selection_cli = require("./model-selection-cli-PCHB2Ve6.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_session_target = require("./session-target-DT_L-Jst.cjs");
const require_message_lifecycle = require("./message-lifecycle-D917k__v.cjs");
const require_agent_bundle_mcp_runtime = require("./agent-bundle-mcp-runtime-bT8ElU5D.cjs");
const require_source_check = require("./source-check-bi20wzmV.cjs");
require("./agent-bundle-mcp-tools-e1AmWJ1L.cjs");
const require_run_termination = require("./run-termination-CDRVMWOn.cjs");
const require_delivery_evidence = require("./delivery-evidence-C3rOjggE.cjs");
const require_command_queue = require("./command-queue-Bnm4_JKn.cjs");
const require_session_runtime_compat = require("./session-runtime-compat-B8Zu61mN.cjs");
const require_cron_run_continuation_cleanup = require("./cron-run-continuation-cleanup-DnxMCgYR.cjs");
const require_model_fallback = require("./model-fallback-MSKXoSVI.cjs");
const require_model_catalog = require("./model-catalog-BFgB2-Jk.cjs");
const require_thinking_runtime = require("./thinking-runtime-CrpgBgYy.cjs");
const require_session_key$1 = require("./session-key-CB-VWyPJ.cjs");
const require_timeout = require("./timeout-CEvCWJvo.cjs");
const require_external_content_source = require("./external-content-source-YSVwjm1I.cjs");
const require_current_time = require("./current-time-oRtkR6fH.cjs");
const require_delivery_plan = require("./delivery-plan-DjgzQZOe.cjs");
const require_source_delivery_fallback = require("./source-delivery-fallback-B02ilJn3.cjs");
const require_run_session_state = require("./run-session-state-DzW1EtOV.cjs");
const require_session_cleanup = require("./session-cleanup-DD1cdb39.cjs");
const require_session = require("./session-Fttlks47.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_util = require("node:util");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/skills/runtime/cron-snapshot.ts
const skillsSnapshotRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./cron-snapshot.runtime-BRybZDGN.cjs")));
async function loadSkillsSnapshotRuntime() {
	return await skillsSnapshotRuntimeLoader.load();
}
async function resolveCronSkillsSnapshot(params) {
	if (params.isFastTestEnv) return params.existingSnapshot ?? {
		prompt: "",
		skills: []
	};
	const runtime = await loadSkillsSnapshotRuntime();
	const skillFilter = runtime.resolveEffectiveAgentSkillFilter(params.config, params.agentId);
	const nodeSkills = runtime.resolveNodeExecEligibility({
		cfg: params.config,
		agentId: params.agentId
	});
	return runtime.resolveReusableWorkspaceSkillSnapshot({
		workspaceDir: params.workspaceDir,
		config: params.config,
		agentId: params.agentId,
		existingSnapshot: params.existingSnapshot,
		skillFilter,
		eligibility: {
			nodeSkills,
			remote: runtime.getRemoteSkillEligibility({ advertiseExecNode: nodeSkills.canExec })
		},
		watch: false,
		hydrateExisting: false
	}).snapshot;
}
//#endregion
//#region src/cron/run-diagnostics.ts
/** Builds bounded, redacted diagnostics for cron run logs and UI surfaces. */
const MAX_SUMMARY_CHARS = 2e3;
const EXEC_DIAGNOSTIC_TAIL_CHARS = 2e3;
const WEB_SEARCH_TOOL_NAME = "web_search";
const MISSING_WEB_SEARCH_PROVIDER_DIAGNOSTIC_MESSAGE = "web_search tool requested in toolsAllow but no web search provider is selected. Configure one with: openclaw configure --section web, or set tools.web.search.provider.";
function toolsAllowRequestsWebSearch(toolsAllow) {
	const explicitAllow = (toolsAllow ?? []).filter((entry) => require_tool_policy.normalizeToolName(entry) !== "*");
	return explicitAllow.length > 0 && require_tool_policy_match.isToolAllowedByPolicyName(WEB_SEARCH_TOOL_NAME, { allow: explicitAllow });
}
function trimSummary(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!normalized) return;
	if (normalized.length <= MAX_SUMMARY_CHARS) return normalized;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(normalized, MAX_SUMMARY_CHARS - 1)}…`;
}
/** Returns the operator-facing summary for persisted cron diagnostics. */
function summarizeCronRunDiagnostics(diagnostics) {
	if (!diagnostics) return;
	return trimSummary(diagnostics.summary ?? diagnostics.entries[0]?.message);
}
/** Normalizes untrusted cron diagnostic payloads into bounded, redacted entries. */
function normalizeCronRunDiagnostics(value, opts) {
	return require_state_migrations_cron_run_logs.normalizeCronRunDiagnostics(value, {
		...opts,
		redactText: (text) => require_redact.redactSensitiveText(text, { mode: "tools" })
	});
}
/** Merges cron diagnostics while choosing the highest-severity latest summary. */
function mergeCronRunDiagnostics(...values) {
	const entries = [];
	let summaryCandidate;
	for (const value of values) {
		const normalized = normalizeCronRunDiagnostics(value);
		if (!normalized) continue;
		const entryCandidate = normalized.entries.findLast((entry) => entry.severity === "error") ?? normalized.entries.findLast((entry) => entry.severity === "warn") ?? normalized.entries.findLast((entry) => entry.severity === "info");
		const summary = trimSummary(normalized.summary ?? entryCandidate?.message);
		if (summary) {
			const severity = entryCandidate?.severity === "error" ? 2 : entryCandidate?.severity === "warn" ? 1 : 0;
			const order = entries.length + normalized.entries.length;
			if (!summaryCandidate || severity > summaryCandidate.severity || severity === summaryCandidate.severity && order >= summaryCandidate.order) summaryCandidate = {
				summary,
				severity,
				order
			};
		}
		entries.push(...normalized.entries);
	}
	return normalizeCronRunDiagnostics({
		summary: summaryCandidate?.summary,
		entries
	});
}
/** Converts an arbitrary thrown cron error into a redacted diagnostic entry. */
function createCronRunDiagnosticsFromError(source, error, opts) {
	const message = require_state_migrations_cron_run_logs.formatUnknownError(error);
	return normalizeCronRunDiagnostics({
		summary: message,
		entries: [{
			ts: opts?.nowMs?.() ?? Date.now(),
			source,
			severity: opts?.severity ?? "error",
			message,
			toolName: opts?.toolName,
			exitCode: opts?.exitCode
		}]
	}, opts);
}
/** Reports a cron preflight warning for an explicitly allowed web_search with no provider. */
function createCronRunDiagnosticsFromMissingWebSearchProvider(params) {
	if (params.hasWebSearchProvider || !params.toolsAllow || params.toolsAllow.length === 0) return;
	if (!toolsAllowRequestsWebSearch(params.toolsAllow)) return;
	return normalizeCronRunDiagnostics({
		summary: MISSING_WEB_SEARCH_PROVIDER_DIAGNOSTIC_MESSAGE,
		entries: [{
			ts: params.nowMs?.() ?? Date.now(),
			source: "cron-preflight",
			severity: "warn",
			message: MISSING_WEB_SEARCH_PROVIDER_DIAGNOSTIC_MESSAGE,
			toolName: WEB_SEARCH_TOOL_NAME
		}]
	}, { nowMs: params.nowMs });
}
/** Extracts failed exec details from tool metadata into cron diagnostics. */
function createCronRunDiagnosticsFromExecDetails(details, opts) {
	if (!require_state_migrations_cron_run_logs.isRecord(details)) return;
	const status = typeof details.status === "string" ? details.status : void 0;
	const exitCode = require_state_migrations_cron_run_logs.normalizeExitCode(details.exitCode);
	if (!(status === "failed" || typeof exitCode === "number" && exitCode !== 0)) return;
	const aggregated = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(details.aggregated);
	const message = aggregated ? require_state_migrations_cron_run_logs.tailText(aggregated, EXEC_DIAGNOSTIC_TAIL_CHARS) : typeof exitCode === "number" ? `exec failed with exit code ${exitCode}` : "exec failed";
	return normalizeCronRunDiagnostics({
		summary: message,
		entries: [{
			ts: opts?.nowMs?.() ?? Date.now(),
			source: "exec",
			severity: opts?.finalStatus === "ok" ? "warn" : status === "failed" ? "error" : "warn",
			message,
			toolName: opts?.toolName,
			exitCode
		}]
	}, opts);
}
/** Extracts tool-call failure diagnostics from an agent reply payload. */
function createCronRunDiagnosticsFromToolPayload(payload, opts) {
	if (!require_state_migrations_cron_run_logs.isRecord(payload)) return;
	const toolName = require_state_migrations_cron_run_logs.normalizeToolName(payload.toolName) ?? require_state_migrations_cron_run_logs.normalizeToolName(payload.name);
	const detailsDiagnostics = createCronRunDiagnosticsFromExecDetails(payload.details, {
		nowMs: opts?.nowMs,
		toolName,
		finalStatus: opts?.finalStatus
	});
	const isError = payload.isError === true;
	const text = typeof payload.text === "string" ? payload.text : void 0;
	const isNonTerminalToolWarning = opts?.finalStatus === "ok" && require_reply_payload.getReplyPayloadMetadata(payload)?.nonTerminalToolErrorWarning === true;
	return mergeCronRunDiagnostics(detailsDiagnostics, isError && text ? createCronRunDiagnosticsFromError("tool", text, {
		severity: isNonTerminalToolWarning || opts?.finalStatus === "ok" ? "warn" : "error",
		nowMs: opts?.nowMs,
		toolName
	}) : void 0);
}
/** Extracts cron run diagnostics from agent result payloads and metadata. */
function createCronRunDiagnosticsFromAgentResult(result, opts) {
	const record = require_state_migrations_cron_run_logs.isRecord(result) ? result : {};
	const meta = record.meta && typeof record.meta === "object" ? record.meta : {};
	const diagnostics = [];
	const payloads = Array.isArray(record.payloads) ? record.payloads : [];
	for (const payload of payloads) diagnostics.push(createCronRunDiagnosticsFromToolPayload(payload, opts));
	const metaError = meta.error && typeof meta.error === "object" ? meta.error : void 0;
	if (typeof metaError?.message === "string") diagnostics.push(createCronRunDiagnosticsFromError("agent-run", metaError.message, opts));
	const failureSignal = meta.failureSignal && typeof meta.failureSignal === "object" ? meta.failureSignal : void 0;
	if (typeof failureSignal?.message === "string") diagnostics.push(createCronRunDiagnosticsFromError("tool", failureSignal.message, opts));
	return mergeCronRunDiagnostics(...diagnostics);
}
//#endregion
//#region src/cron/isolated-agent/model-selection.ts
function formatAllowedModelRefs(params) {
	const configured = params.cfg.agents?.defaults?.models;
	if (configured && typeof configured === "object" && Object.keys(configured).length > 0) return Object.keys(configured).toSorted().join(", ");
	return "(none configured)";
}
function formatCronPayloadModelRejection(params) {
	const { modelOverride, error } = params;
	if (error.startsWith("model not allowed:")) return `cron payload.model '${modelOverride}' rejected by agents.defaults.models allowlist: ${error.slice(18).trim()} is not in [${formatAllowedModelRefs({ cfg: params.cfg })}]`;
	return `cron payload.model '${modelOverride}' rejected: ${error}`;
}
/** Resolves the effective model for an isolated cron run across defaults, agents, hooks, payload, and session state. */
async function resolveCronModelSelection(params) {
	const resolvedDefault = require_model_selection_shared.resolveConfiguredModelRef({
		cfg: params.cfgWithAgentDefaults,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL
	});
	let provider = resolvedDefault.provider;
	let model = resolvedDefault.model;
	let modelSource = "default";
	let catalog;
	const loadCatalogOnce = async () => {
		if (!catalog) catalog = await require_model_catalog.loadModelCatalog({ config: params.cfgWithAgentDefaults });
		return catalog;
	};
	const subagentModelConfigSelection = require_agent_scope.resolveSubagentModelConfigSelectionResult({
		cfg: params.cfg,
		agentId: params.agentId,
		agentConfigOverride: params.agentConfigOverride
	});
	const subagentModelRaw = require_model_selection_shared.normalizeModelSelection(subagentModelConfigSelection?.raw);
	const subagentModelSource = subagentModelConfigSelection?.source === "agent" ? "agent" : "subagent";
	if (subagentModelRaw) {
		const resolvedSubagent = require_model_selection_resolve.resolveAllowedModelRef({
			cfg: params.cfgWithAgentDefaults,
			catalog: await loadCatalogOnce(),
			raw: subagentModelRaw,
			defaultProvider: resolvedDefault.provider,
			defaultModel: resolvedDefault.model
		});
		if (!("error" in resolvedSubagent)) {
			provider = resolvedSubagent.ref.provider;
			model = resolvedSubagent.ref.model;
			modelSource = subagentModelSource;
		}
	}
	let hooksGmailModelApplied = false;
	const hooksGmailModelRef = params.isGmailHook ? require_model_selection_shared.resolveHooksGmailModel({
		cfg: params.cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER
	}) : null;
	if (hooksGmailModelRef) {
		if (require_model_selection_resolve.getModelRefStatus({
			cfg: params.cfg,
			catalog: await loadCatalogOnce(),
			ref: hooksGmailModelRef,
			defaultProvider: resolvedDefault.provider,
			defaultModel: resolvedDefault.model
		}).allowed) {
			provider = hooksGmailModelRef.provider;
			model = hooksGmailModelRef.model;
			hooksGmailModelApplied = true;
			modelSource = "hook";
		}
	}
	const modelOverrideRaw = params.payload.kind === "agentTurn" ? params.payload.model : void 0;
	const modelOverride = typeof modelOverrideRaw === "string" ? modelOverrideRaw.trim() : void 0;
	if (modelOverride !== void 0 && modelOverride.length > 0) {
		const resolvedOverride = require_model_selection_resolve.resolveAllowedModelRef({
			cfg: params.cfgWithAgentDefaults,
			catalog: await loadCatalogOnce(),
			raw: modelOverride,
			defaultProvider: resolvedDefault.provider,
			defaultModel: resolvedDefault.model
		});
		if ("error" in resolvedOverride) return {
			ok: false,
			error: formatCronPayloadModelRejection({
				cfg: params.cfgWithAgentDefaults,
				modelOverride,
				error: resolvedOverride.error
			})
		};
		provider = resolvedOverride.ref.provider;
		model = resolvedOverride.ref.model;
		modelSource = "payload";
	}
	if (!modelOverride && !hooksGmailModelApplied) {
		const sessionModelOverride = params.sessionEntry.modelOverride?.trim();
		if (sessionModelOverride) {
			const sessionProviderOverride = params.sessionEntry.providerOverride?.trim() || resolvedDefault.provider;
			const resolvedSessionOverride = require_model_selection_resolve.resolveAllowedModelRef({
				cfg: params.cfgWithAgentDefaults,
				catalog: await loadCatalogOnce(),
				raw: `${sessionProviderOverride}/${sessionModelOverride}`,
				defaultProvider: resolvedDefault.provider,
				defaultModel: resolvedDefault.model
			});
			if (!("error" in resolvedSessionOverride)) {
				provider = resolvedSessionOverride.ref.provider;
				model = resolvedSessionOverride.ref.model;
				modelSource = "session";
			}
		}
	}
	return {
		ok: true,
		provider,
		model,
		modelSource
	};
}
//#endregion
//#region src/cron/isolated-agent/run-config.ts
/** Selects the active reloadable config when it descends from the cron caller's snapshot. */
function resolveCronActiveRuntimeConfig(cfg) {
	const runtimeConfig = require_runtime_snapshot.getRuntimeConfigSnapshot();
	const runtimeSourceConfig = require_runtime_snapshot.getRuntimeConfigSourceSnapshot();
	if (!runtimeConfig || !runtimeSourceConfig) return cfg;
	return require_runtime_snapshot.selectApplicableRuntimeConfig({
		inputConfig: cfg,
		runtimeConfig,
		runtimeSourceConfig
	}) ?? cfg;
}
function extractCronAgentDefaultsOverride(agentConfigOverride) {
	const { model: overrideModel, sandbox: _agentSandboxOverride, memorySearch: _agentMemorySearchOverride, ...agentOverrideRest } = agentConfigOverride ?? {};
	return {
		overrideModel,
		definedOverrides: Object.fromEntries(Object.entries(agentOverrideRest).filter(([, value]) => value !== void 0))
	};
}
function mergeCronAgentModelOverride(params) {
	const nextDefaults = { ...params.defaults };
	const existingModel = nextDefaults.model && typeof nextDefaults.model === "object" ? nextDefaults.model : {};
	if (typeof params.overrideModel === "string") nextDefaults.model = {
		...existingModel,
		primary: params.overrideModel
	};
	else if (params.overrideModel) nextDefaults.model = {
		...existingModel,
		...params.overrideModel
	};
	return nextDefaults;
}
/** Builds the agent defaults snapshot used by isolated cron runs. */
function buildCronAgentDefaultsConfig(params) {
	const { overrideModel, definedOverrides } = extractCronAgentDefaultsOverride(params.agentConfigOverride);
	return mergeCronAgentModelOverride({
		defaults: Object.assign({}, params.defaults, definedOverrides),
		overrideModel
	});
}
//#endregion
//#region src/cron/isolated-agent/run-timeout.ts
/** Converts cron payload timeout overrides into embedded-runner timeout signals. */
/** Converts explicit cron payload timeoutSeconds into a timer-safe millisecond override signal. */
function resolveCronRunTimeoutOverrideMs(timeoutSeconds) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.finiteSecondsToTimerSafeMilliseconds)(timeoutSeconds);
}
//#endregion
//#region src/cron/isolated-agent/run.ts
const sessionAccessorRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./session-accessor-D_W4fZCX.cjs")).then((n) => n.session_accessor_exports));
const cronExecutorRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./run-executor.runtime-CfrBwt8K.cjs")));
const cronExternalContentRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./run-external-content.runtime-BMO4pynF.cjs")));
const cronAuthProfileRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./run-auth-profile.runtime-CUa4JOa-.cjs")));
const cronContextRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./run-context.runtime-D407Fzjc.cjs")));
const cronModelCatalogRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./run-model-catalog.runtime-CF13acgi.cjs")));
const cronDeliveryRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./run-delivery.runtime-BCNbhbRJ.cjs")));
const cronModelPreflightRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./model-preflight.runtime-3wTkhXVw.cjs")));
const runtimePluginsLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./runtime-plugins.runtime-Bt9Xc3w4.cjs")));
const codexNativeWebSearchLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./codex-native-web-search-BtJQx4FC.cjs")).then((n) => n.codex_native_web_search_exports));
const webToolRuntimeContextLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./web-tool-runtime-context-2jPGC14p.cjs")).then((n) => n.web_tool_runtime_context_exports));
const webSearchRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./runtime-CXo-Wba-.cjs")).then((n) => n.runtime_exports));
async function loadSessionAccessorRuntime() {
	return await sessionAccessorRuntimeLoader.load();
}
async function loadCronExecutorRuntime() {
	return await cronExecutorRuntimeLoader.load();
}
async function loadCronExternalContentRuntime() {
	return await cronExternalContentRuntimeLoader.load();
}
async function loadCronAuthProfileRuntime() {
	return await cronAuthProfileRuntimeLoader.load();
}
async function loadCronContextRuntime() {
	return await cronContextRuntimeLoader.load();
}
async function loadCronModelCatalogRuntime() {
	return await cronModelCatalogRuntimeLoader.load();
}
async function loadCronDeliveryRuntime() {
	return await cronDeliveryRuntimeLoader.load();
}
async function loadCronModelPreflightRuntime() {
	return await cronModelPreflightRuntimeLoader.load();
}
async function loadRuntimePlugins() {
	return await runtimePluginsLoader.load();
}
async function loadCodexNativeWebSearch() {
	return await codexNativeWebSearchLoader.load();
}
async function loadWebToolRuntimeContext() {
	return await webToolRuntimeContextLoader.load();
}
async function loadWebSearchRuntime() {
	return await webSearchRuntimeLoader.load();
}
function hasConfiguredAuthProfiles(cfg) {
	return Boolean(cfg.auth?.profiles && Object.keys(cfg.auth.profiles).length > 0) || Boolean(cfg.auth?.order && Object.keys(cfg.auth.order).length > 0);
}
function isCronNestedLaneTaskTimeoutError(err) {
	return require_command_queue.isCommandLaneTaskTimeoutError(err, "cron-nested");
}
async function retireRolledCronSessionMcpRuntime(params) {
	if (params.job.sessionTarget === "isolated") return;
	const previousSessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.cronSession.previousSessionId);
	const currentSessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.cronSession.sessionEntry.sessionId);
	if (!previousSessionId || previousSessionId === currentSessionId) return;
	await require_agent_bundle_mcp_runtime.retireSessionMcpRuntime({
		sessionId: previousSessionId,
		reason: "cron-session-rollover",
		onError: (error, sessionId) => {
			require_logger.logWarn(`[cron:${params.job.id}] Failed to dispose retired bundle MCP runtime for session ${sessionId}: ${String(error)}`);
		}
	});
}
function normalizeCronTraceTarget(target) {
	if (!target) return;
	return {
		...target.channel ? { channel: target.channel } : {},
		...target.to !== void 0 ? { to: target.to } : {},
		...target.accountId ? { accountId: target.accountId } : {},
		...target.threadId !== void 0 ? { threadId: target.threadId } : {},
		...target.source ? { source: target.source } : {}
	};
}
function normalizeMessagingToolTarget(delivery, resolvedDelivery) {
	const { target } = delivery;
	const channel = target.provider?.trim();
	if (!channel) return;
	return {
		channel: channel === "message" && resolvedDelivery.ok && delivery.verifiedTarget ? resolvedDelivery.channel : channel,
		...target.to ? { to: target.to } : {},
		...target.accountId ? { accountId: target.accountId } : {},
		...target.threadId ? { threadId: target.threadId } : {}
	};
}
function buildResolvedCronTraceTarget(resolvedDelivery) {
	if (resolvedDelivery.ok) return {
		ok: true,
		...normalizeCronTraceTarget({
			channel: resolvedDelivery.channel,
			to: resolvedDelivery.to,
			accountId: resolvedDelivery.accountId,
			threadId: resolvedDelivery.threadId,
			source: resolvedDelivery.mode === "implicit" ? "last" : "explicit"
		})
	};
	return {
		ok: false,
		...normalizeCronTraceTarget({
			channel: resolvedDelivery.channel,
			to: resolvedDelivery.to ?? null,
			accountId: resolvedDelivery.accountId,
			threadId: resolvedDelivery.threadId,
			source: resolvedDelivery.mode === "implicit" ? "last" : "explicit"
		}),
		error: resolvedDelivery.error.message
	};
}
function buildCronDeliveryTrace(params) {
	const intended = normalizeCronTraceTarget({
		channel: params.deliveryPlan.channel ?? "last",
		to: params.deliveryPlan.to ?? null,
		accountId: params.deliveryPlan.accountId,
		threadId: params.deliveryPlan.threadId,
		source: params.deliveryPlan.channel === "last" || !params.deliveryPlan.channel ? "last" : "explicit"
	});
	const resolved = params.deliveryPlan.mode !== "none" || require_delivery_plan.hasExplicitCronDeliveryTarget(params.deliveryPlan) ? buildResolvedCronTraceTarget(params.resolvedDelivery) : void 0;
	const messageToolSentTo = params.sourceDeliveryOutcome.visibleDeliveries.map((delivery) => normalizeMessagingToolTarget(delivery, params.resolvedDelivery)).filter((target) => Boolean(target));
	return {
		...intended ? { intended } : {},
		...resolved ? { resolved } : {},
		...messageToolSentTo.length > 0 ? { messageToolSentTo } : {},
		fallbackUsed: params.fallbackUsed,
		delivered: params.delivered
	};
}
function canPromptForMessageTool(params) {
	if (!params.sourceDelivery.messageTool.enabled) return false;
	const normalizedToolsAllow = params.toolsAllow ? require_tool_policy.expandToolGroups(params.toolsAllow).map((toolName) => require_tool_policy.normalizeToolName(toolName)) : void 0;
	return params.toolsAllow === void 0 || normalizedToolsAllow?.includes("*") === true || normalizedToolsAllow?.includes("message") === true;
}
async function createCronToolsAllowPreflightDiagnostics(params) {
	const toolsAllow = params.agentPayload?.toolsAllow;
	if (params.agentPayload?.toolsAllowIsDefault === true || !toolsAllowRequestsWebSearch(toolsAllow)) return;
	try {
		const { shouldSuppressManagedWebSearchTool } = await loadCodexNativeWebSearch();
		if (shouldSuppressManagedWebSearchTool({
			config: params.cfg,
			modelProvider: params.provider,
			modelApi: params.modelApi,
			modelId: params.model,
			agentId: params.agentId,
			sessionKey: params.sessionKey,
			agentDir: params.agentDir
		})) return;
		const { resolveWebSearchToolRuntimeContext } = await loadWebToolRuntimeContext();
		const { config, preferRuntimeProviders, runtimeWebSearch } = resolveWebSearchToolRuntimeContext({
			config: params.cfg,
			lateBindRuntimeConfig: true
		});
		const { hasUsableWebSearchProvider } = await loadWebSearchRuntime();
		return createCronRunDiagnosticsFromMissingWebSearchProvider({
			toolsAllow,
			hasWebSearchProvider: hasUsableWebSearchProvider({
				config,
				agentDir: params.agentDir,
				runtimeWebSearch,
				preferRuntimeProviders
			})
		});
	} catch (error) {
		require_logger.logWarn(`[cron:${params.jobId}] Failed to inspect web_search provider state for toolsAllow diagnostics: ${String(error)}`);
		return;
	}
}
/** Resolves the delivery plan and concrete target for one isolated cron run. */
async function resolveCronDeliveryContext(params) {
	const deliveryPlan = require_delivery_plan.resolveCronDeliveryPlan(params.job);
	if (deliveryPlan.mode === "webhook") {
		const resolvedDelivery = {
			ok: false,
			channel: void 0,
			to: void 0,
			accountId: void 0,
			threadId: void 0,
			mode: "implicit",
			error: /* @__PURE__ */ new Error("webhook delivery has no chat target")
		};
		return {
			deliveryPlan,
			deliveryRequested: deliveryPlan.requested,
			resolvedDelivery,
			sourceDelivery: require_source_delivery_fallback.resolveCronSourceDeliveryPlan({
				deliveryPlan,
				resolvedDelivery
			})
		};
	}
	if (deliveryPlan.mode === "none" && !require_delivery_plan.hasExplicitCronDeliveryTarget(deliveryPlan)) {
		const resolvedDelivery = {
			ok: false,
			channel: void 0,
			to: void 0,
			accountId: void 0,
			threadId: void 0,
			mode: "implicit",
			error: /* @__PURE__ */ new Error("delivery is disabled")
		};
		return {
			deliveryPlan,
			deliveryRequested: false,
			resolvedDelivery,
			sourceDelivery: require_source_delivery_fallback.resolveCronSourceDeliveryPlan({
				deliveryPlan,
				resolvedDelivery
			})
		};
	}
	const { resolveDeliveryTarget } = await loadCronDeliveryRuntime();
	const resolvedDelivery = await resolveDeliveryTarget(params.cfg, params.agentId, {
		channel: deliveryPlan.channel ?? "last",
		to: deliveryPlan.to,
		threadId: deliveryPlan.threadId,
		accountId: deliveryPlan.accountId,
		sessionKey: require_session_target.resolveCronDeliverySessionKey(params.job)
	});
	return {
		deliveryPlan,
		deliveryRequested: deliveryPlan.requested,
		resolvedDelivery,
		sourceDelivery: require_source_delivery_fallback.resolveCronSourceDeliveryPlan({
			deliveryPlan,
			resolvedDelivery
		})
	};
}
function appendCronDeliveryInstruction(params) {
	if (!params.deliveryRequested) return params.commandBody;
	if (params.messageToolEnabled) {
		const targetHint = params.requireExplicitMessageTarget || !params.resolvedDeliveryOk ? "with an explicit target" : "for the current chat";
		return `${params.commandBody}\n\nUse the message tool if you need to notify the user directly ${targetHint}. If you do not send directly, your final plain-text reply will be delivered automatically.`.trim();
	}
	return `${params.commandBody}\n\nYour response will be delivered automatically. If the task explicitly calls for messaging a specific external recipient, note who/where it should go instead of sending it yourself.`.trim();
}
function resolvePositiveContextTokens(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
}
async function loadCliRunnerRuntime() {
	return await Promise.resolve().then(() => require("./cli-runner.runtime-B4dyouns.cjs"));
}
async function loadUsageFormatRuntime() {
	return await Promise.resolve().then(() => require("./usage-format-Ed9eVdJX.cjs")).then((n) => n.usage_format_exports);
}
function resolveCronAgentTurnMessage(input) {
	if (input.job.payload.kind === "agentTurn") return input.job.payload.message;
	return input.message;
}
async function prepareCronRunContext(params) {
	const { input } = params;
	const runtimeCfg = resolveCronActiveRuntimeConfig(input.cfg);
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(runtimeCfg);
	const requestedAgentId = typeof input.agentId === "string" && input.agentId.trim() ? input.agentId : typeof input.job.agentId === "string" && input.job.agentId.trim() ? input.job.agentId : void 0;
	const normalizedRequested = requestedAgentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(requestedAgentId) : void 0;
	const agentId = normalizedRequested ?? defaultAgentId;
	const selectedAgentConfig = require_agent_scope_config.resolveAgentConfig(runtimeCfg, agentId);
	const agentConfigOverride = normalizedRequested ? selectedAgentConfig : void 0;
	const matchesDefaultFallbackAgentStringModel = typeof selectedAgentConfig?.model === "string" && require_model_input.resolveAgentModelPrimaryValue(selectedAgentConfig.model) === require_model_input.resolveAgentModelPrimaryValue(runtimeCfg.agents?.defaults?.model);
	const agentCfg = buildCronAgentDefaultsConfig({
		defaults: runtimeCfg.agents?.defaults,
		agentConfigOverride
	});
	const cfgWithAgentDefaults = {
		...runtimeCfg,
		agents: Object.assign({}, runtimeCfg.agents, { defaults: agentCfg })
	};
	let catalog;
	const loadCatalog = async () => {
		if (!catalog) catalog = await (await loadCronModelCatalogRuntime()).loadModelCatalog({ config: cfgWithAgentDefaults });
		return catalog;
	};
	const baseSessionKey = (input.sessionKey?.trim() || `cron:${input.job.id}`).trim();
	const currentBoundSourceKey = input.job.sessionTarget === "current" ? input.job.sessionKey?.trim() : void 0;
	const usesDetachedRunSession = require_session_target.isDetachedCronSessionTarget(input.job.sessionTarget) || Boolean(currentBoundSourceKey);
	const baseSessionKeyIsCron = baseSessionKey.startsWith("cron:") || require_session_key.isCronSessionKey(baseSessionKey);
	const agentSessionKey = require_session_key$1.resolveCronAgentSessionKey({
		sessionKey: usesDetachedRunSession && !baseSessionKeyIsCron ? `cron:${input.job.id}` : baseSessionKey,
		agentId,
		mainKey: input.cfg.session?.mainKey,
		cfg: input.cfg
	});
	const resolvedBaseSessionKey = require_session_key$1.resolveCronAgentSessionKey({
		sessionKey: currentBoundSourceKey ?? baseSessionKey,
		agentId,
		mainKey: input.cfg.session?.mainKey,
		cfg: input.cfg
	});
	const sourceSessionKey = currentBoundSourceKey && resolvedBaseSessionKey !== agentSessionKey ? resolvedBaseSessionKey : void 0;
	const hookExternalContentSource = (input.job.payload.kind === "agentTurn" ? input.job.payload.externalContentSource : void 0) ?? require_external_content_source.resolveHookExternalContentSource(baseSessionKey);
	const workspaceDirRaw = require_agent_scope_config.resolveAgentWorkspaceDir(input.cfg, agentId);
	const agentDir = require_agent_scope_config.resolveAgentDir(input.cfg, agentId);
	const workspaceDir = (await require_workspace.ensureAgentWorkspace({
		dir: workspaceDirRaw,
		ensureBootstrapFiles: !agentCfg?.skipBootstrap && !params.isFastTestEnv,
		skipOptionalBootstrapFiles: agentCfg?.skipOptionalBootstrapFiles
	})).dir;
	const { ensureRuntimePluginsLoaded } = await loadRuntimePlugins();
	ensureRuntimePluginsLoaded({
		config: cfgWithAgentDefaults,
		workspaceDir,
		allowGatewaySubagentBinding: true
	});
	const isGmailHook = hookExternalContentSource === "gmail";
	const now = Date.now();
	const cronSession = require_session.resolveCronSession({
		cfg: input.cfg,
		sessionKey: agentSessionKey,
		sourceSessionKey,
		agentId,
		nowMs: now,
		forceNew: usesDetachedRunSession,
		hookExternalContentSource
	});
	const reservedKey = require_store.isAgentHarnessSessionKey(agentSessionKey);
	if (cronSession.initialSessionEntry?.modelSelectionLocked === true) throw new Error(reservedKey ? require_store.AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE : require_store.AGENT_HARNESS_SESSION_ID_LOCKED_MESSAGE);
	if (reservedKey && !cronSession.initialSessionEntry) throw new Error(require_store.AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE);
	const runSessionId = cronSession.sessionEntry.sessionId;
	const currentRunSessionId = () => cronSession.sessionEntry.sessionId ?? runSessionId;
	if (!cronSession.sessionEntry.sessionFile?.trim()) cronSession.sessionEntry.sessionFile = require_sqlite_marker.formatSqliteSessionFileMarker({
		agentId,
		sessionId: runSessionId,
		storePath: cronSession.storePath
	});
	const runSessionKey = usesDetachedRunSession || baseSessionKey.startsWith("cron:") ? `${agentSessionKey}:run:${runSessionId}` : agentSessionKey;
	const persistCronSessionRow = async ({ storePath, sessionKey, fallbackEntry, update }) => {
		const { patchSessionEntry } = await loadSessionAccessorRuntime();
		await patchSessionEntry({
			storePath,
			sessionKey,
			agentId
		}, (_entry, context) => update(context.existingEntry), {
			fallbackEntry,
			replaceEntry: true
		});
	};
	const persistSessionEntry = require_run_session_state.createPersistCronSessionEntry({
		cronSession,
		agentSessionKey,
		persistSessionEntry: persistCronSessionRow
	});
	const withRunSession = (result) => ({
		...result,
		sessionId: currentRunSessionId(),
		sessionKey: runSessionKey
	});
	if (!cronSession.sessionEntry.label?.trim() && baseSessionKey.startsWith("cron:")) {
		const labelSuffix = typeof input.job.name === "string" && input.job.name.trim() ? input.job.name.trim() : input.job.id;
		cronSession.sessionEntry.label = `Cron: ${labelSuffix}`;
	}
	const resolvedModelSelection = await resolveCronModelSelection({
		cfg: input.cfg,
		cfgWithAgentDefaults,
		agentConfigOverride,
		sessionEntry: cronSession.sessionEntry,
		payload: input.job.payload,
		isGmailHook,
		agentId
	});
	if (!resolvedModelSelection.ok) return {
		ok: false,
		result: withRunSession({
			status: "error",
			error: resolvedModelSelection.error,
			diagnostics: createCronRunDiagnosticsFromError("cron-preflight", resolvedModelSelection.error)
		})
	};
	let provider = resolvedModelSelection.provider;
	let model = resolvedModelSelection.model;
	const useSubagentFallbacks = resolvedModelSelection.modelSource === "subagent";
	const inheritDefaultFallbacksForAgentStringModel = matchesDefaultFallbackAgentStringModel && (resolvedModelSelection.modelSource === "default" || resolvedModelSelection.modelSource === "agent");
	const modelPreflightRuntime = await loadCronModelPreflightRuntime();
	const preflightCandidates = require_source_delivery_fallback.resolveCronPreflightCandidates({
		cfg: cfgWithAgentDefaults,
		job: input.job,
		agentId,
		provider,
		model,
		useSubagentFallbacks,
		inheritDefaultFallbacksForAgentStringModel
	});
	let selectedPreflightCandidate;
	let selectedPreflightCandidateIndex = -1;
	let firstUnavailablePreflight;
	for (const [index, candidate] of preflightCandidates.entries()) {
		const candidatePreflight = await modelPreflightRuntime.preflightCronModelProvider({
			cfg: cfgWithAgentDefaults,
			provider: candidate.provider,
			model: candidate.model
		});
		if (candidatePreflight.status === "available") {
			selectedPreflightCandidate = candidate;
			selectedPreflightCandidateIndex = index;
			break;
		}
		firstUnavailablePreflight ??= candidatePreflight;
	}
	if (!selectedPreflightCandidate && firstUnavailablePreflight?.status === "unavailable") {
		require_logger.logWarn(`[cron:${input.job.id}] ${firstUnavailablePreflight.reason}`);
		return {
			ok: false,
			result: withRunSession({
				status: "skipped",
				error: firstUnavailablePreflight.reason,
				diagnostics: createCronRunDiagnosticsFromError("model-preflight", firstUnavailablePreflight.reason, { severity: "warn" }),
				provider,
				model
			})
		};
	}
	const modelFallbacksOverride = selectedPreflightCandidate && (selectedPreflightCandidate.provider !== provider || selectedPreflightCandidate.model !== model) ? preflightCandidates.slice(selectedPreflightCandidateIndex + 1).map((candidate) => `${candidate.provider}/${candidate.model}`) : void 0;
	if (selectedPreflightCandidate && modelFallbacksOverride) {
		if (firstUnavailablePreflight?.status === "unavailable") require_logger.logWarn(`[cron:${input.job.id}] Local provider preflight failed for ${firstUnavailablePreflight.provider}/${firstUnavailablePreflight.model} at ${firstUnavailablePreflight.baseUrl}; continuing with fallback ${selectedPreflightCandidate.provider}/${selectedPreflightCandidate.model}.`);
		provider = selectedPreflightCandidate.provider;
		model = selectedPreflightCandidate.model;
	}
	const hooksGmailThinking = isGmailHook ? require_thinking.normalizeThinkLevel(input.cfg.hooks?.gmail?.thinking) : void 0;
	const jobThink = require_thinking.normalizeThinkLevel((input.job.payload.kind === "agentTurn" ? input.job.payload.thinking : void 0) ?? void 0);
	const sessionThink = require_thinking.normalizeThinkLevel(cronSession.sessionEntry.thinkingLevel);
	const effectiveAgentRuntime = require_thinking_runtime.resolveEffectiveAgentRuntime({
		cfg: cfgWithAgentDefaults,
		provider,
		modelId: model,
		agentId,
		sessionKey: agentSessionKey,
		sessionEntry: cronSession.sessionEntry
	});
	let requestedThinkLevel = jobThink ?? hooksGmailThinking ?? sessionThink;
	if (!requestedThinkLevel) {
		const thinkingCatalog = await loadCatalog();
		requestedThinkLevel = require_model_thinking_default.resolveThinkingDefault({
			cfg: cfgWithAgentDefaults,
			provider,
			model,
			catalog: thinkingCatalog,
			agentRuntime: effectiveAgentRuntime
		});
	}
	const thinkingCatalog = await loadCatalog();
	if (!require_thinking.isThinkingLevelSupported({
		provider,
		model,
		level: requestedThinkLevel,
		catalog: thinkingCatalog,
		agentRuntime: effectiveAgentRuntime
	})) {
		const fallbackThinkLevel = require_thinking.resolveSupportedThinkingLevel({
			provider,
			model,
			level: requestedThinkLevel,
			catalog: thinkingCatalog,
			agentRuntime: effectiveAgentRuntime
		});
		if (fallbackThinkLevel !== requestedThinkLevel) require_logger.logWarn(`[cron:${input.job.id}] Thinking level "${requestedThinkLevel}" is not supported for ${provider}/${model}; using "${fallbackThinkLevel}" for this candidate.`);
	}
	const explicitTimeoutSeconds = input.job.payload.kind === "agentTurn" ? input.job.payload.timeoutSeconds : void 0;
	const timeoutMs = require_timeout.resolveAgentTimeoutMs({
		cfg: cfgWithAgentDefaults,
		overrideSeconds: explicitTimeoutSeconds
	});
	const runTimeoutOverrideMs = resolveCronRunTimeoutOverrideMs(explicitTimeoutSeconds);
	const agentPayload = input.job.payload.kind === "agentTurn" ? input.job.payload : null;
	const configuredProvider = cfgWithAgentDefaults.models?.providers?.[provider];
	const modelApi = require_model_selection_shared.findModelInCatalog(thinkingCatalog, provider, model)?.api ?? configuredProvider?.models.find((candidate) => candidate.id === model)?.api ?? configuredProvider?.api;
	const preflightDiagnostics = await createCronToolsAllowPreflightDiagnostics({
		cfg: cfgWithAgentDefaults,
		jobId: input.job.id,
		provider,
		model,
		modelApi,
		agentId,
		agentDir,
		sessionKey: agentSessionKey,
		agentPayload
	});
	const { deliveryPlan, deliveryRequested, resolvedDelivery, sourceDelivery } = await resolveCronDeliveryContext({
		cfg: cfgWithAgentDefaults,
		job: input.job,
		agentId
	});
	const { formattedTime, timeLine } = require_current_time.resolveCronStyleNow(input.cfg, now);
	const message = resolveCronAgentTurnMessage(input);
	const base = `[cron:${input.job.id} ${input.job.name}] ${message}`.trim();
	const isExternalHook = hookExternalContentSource !== void 0 || require_external_content_source.isExternalHookSession(baseSessionKey);
	const allowUnsafeExternalContent = agentPayload?.allowUnsafeExternalContent === true || isGmailHook && input.cfg.hooks?.gmail?.allowUnsafeExternalContent === true;
	const shouldWrapExternal = isExternalHook && !allowUnsafeExternalContent;
	let commandBody;
	if (isExternalHook) {
		const { detectSuspiciousPatterns } = await loadCronExternalContentRuntime();
		const suspiciousPatterns = detectSuspiciousPatterns(message);
		if (suspiciousPatterns.length > 0) require_logger.logWarn(`[security] Suspicious patterns detected in external hook content (session=${baseSessionKey}, patterns=${suspiciousPatterns.length}): ${suspiciousPatterns.slice(0, 3).join(", ")}`);
	}
	if (shouldWrapExternal) {
		const { buildSafeExternalPrompt } = await loadCronExternalContentRuntime();
		commandBody = `${buildSafeExternalPrompt({
			content: message,
			source: require_external_content_source.mapHookExternalContentSource(hookExternalContentSource ?? "webhook"),
			jobName: input.job.name,
			jobId: input.job.id,
			timestamp: formattedTime
		})}\n\n${timeLine}`.trim();
	} else commandBody = `${base}\n${timeLine}`.trim();
	const messageToolPromptEnabled = canPromptForMessageTool({
		sourceDelivery,
		toolsAllow: agentPayload?.toolsAllow
	});
	commandBody = appendCronDeliveryInstruction({
		commandBody,
		deliveryRequested,
		messageToolEnabled: messageToolPromptEnabled,
		resolvedDeliveryOk: resolvedDelivery.ok,
		requireExplicitMessageTarget: sourceDelivery.messageTool.requireExplicitTarget
	});
	const initialSessionEntry = cronSession.initialSessionEntry;
	const sessionWorkAdmission = await require_store.beginSessionWorkAdmission({
		scope: cronSession.storePath,
		identities: [
			agentSessionKey,
			initialSessionEntry?.sessionId,
			cronSession.sessionEntry.sessionId,
			require_run_session_state.resolveCronLifecycleRevisionIdentity(cronSession.lifecycleRevision),
			runSessionKey
		],
		signal: input.abortSignal ?? input.signal,
		onInterrupt: params.onLifecycleInterrupt,
		assertAllowed: () => {
			const currentEntry = require_session.loadCronSessionEntryLatest(cronSession.storePath, agentSessionKey);
			if (initialSessionEntry ? !currentEntry || !(0, node_util.isDeepStrictEqual)(require_run_session_state.projectCronOwnershipFields(currentEntry), require_run_session_state.projectCronOwnershipFields(initialSessionEntry)) : Boolean(currentEntry)) throw new Error(`Session "${agentSessionKey}" changed while starting work. Retry.`);
			const archivedSessionError = require_lifecycle.resolveSessionWorkStartError(agentSessionKey, currentEntry);
			if (archivedSessionError) throw new Error(archivedSessionError);
		}
	});
	try {
		const skillsSnapshot = await resolveCronSkillsSnapshot({
			workspaceDir,
			config: cfgWithAgentDefaults,
			agentId,
			existingSnapshot: cronSession.sessionEntry.skillsSnapshot,
			isFastTestEnv: params.isFastTestEnv
		});
		await require_run_session_state.persistCronSkillsSnapshotIfChanged({
			isFastTestEnv: params.isFastTestEnv,
			cronSession,
			skillsSnapshot,
			nowMs: Date.now(),
			persistSessionEntry
		});
		require_run_session_state.markCronSessionPreRun({
			entry: cronSession.sessionEntry,
			provider,
			model
		});
		try {
			await persistSessionEntry();
		} catch (err) {
			if (err instanceof require_run_session_state.CronSessionLifecycleClaimError) throw err;
			require_logger.logWarn(`[cron:${input.job.id}] Failed to persist pre-run session entry: ${String(err)}`);
		}
		await retireRolledCronSessionMcpRuntime({
			job: input.job,
			cronSession
		});
		const authProfileId = !Boolean(cronSession.sessionEntry.authProfileOverride?.trim()) && !hasConfiguredAuthProfiles(cfgWithAgentDefaults) && !require_source_check.hasAnyAuthProfileStoreSource(agentDir) ? void 0 : await (await loadCronAuthProfileRuntime()).resolveSessionAuthProfileOverride({
			cfg: cfgWithAgentDefaults,
			provider,
			acceptedProviderIds: require_openai_routing.listOpenAIAuthProfileProvidersForAgentRuntime({
				provider,
				harnessRuntime: effectiveAgentRuntime,
				config: cfgWithAgentDefaults
			}),
			agentDir,
			sessionEntry: cronSession.sessionEntry,
			sessionStore: cronSession.store,
			sessionKey: agentSessionKey,
			storePath: cronSession.storePath,
			isNewSession: cronSession.isNewSession && input.job.sessionTarget !== "isolated"
		});
		const liveSelection = {
			provider,
			model,
			agentRuntimeOverride: require_session_runtime_compat.resolveSessionRuntimeOverrideForProvider({
				provider,
				entry: cronSession.sessionEntry,
				cfg: cfgWithAgentDefaults
			}),
			authProfileId,
			authProfileIdSource: authProfileId ? cronSession.sessionEntry.authProfileOverrideSource : void 0
		};
		const runContinuationSession = baseSessionKey.startsWith("cron:") ? require_run_session_state.createCronRunContinuationSession({
			cronSession,
			runSessionKey,
			thinkingLevel: requestedThinkLevel,
			toolsAllow: agentPayload?.toolsAllow,
			toolsAllowIsDefault: agentPayload?.toolsAllowIsDefault,
			cliSessionBindingFacts: {
				sourceReplyDeliveryMode: sourceDelivery.sourceReplyDeliveryMode,
				requireExplicitMessageTarget: sourceDelivery.messageTool.requireExplicitTarget
			},
			persistSessionEntry: persistCronSessionRow
		}) : void 0;
		await runContinuationSession?.initialize();
		return {
			ok: true,
			context: {
				input,
				cfgWithAgentDefaults,
				agentId,
				agentCfg,
				agentDir,
				agentSessionKey,
				runSessionId,
				currentRunSessionId,
				runSessionKey,
				usesDetachedRunSession,
				workspaceDir,
				commandBody,
				cronSession,
				sessionWorkAdmission,
				persistSessionEntry,
				runContinuationSession,
				withRunSession,
				agentPayload,
				deliveryPlan,
				resolvedDelivery,
				deliveryRequested,
				sourceDelivery,
				messageToolPromptEnabled,
				suppressExecNotifyOnExit: deliveryPlan.mode === "none",
				skillsSnapshot,
				liveSelection,
				useSubagentFallbacks,
				inheritDefaultFallbacksForAgentStringModel,
				modelFallbacksOverride,
				thinkLevel: requestedThinkLevel,
				thinkingCatalog,
				timeoutMs,
				preflightDiagnostics,
				runTimeoutOverrideMs
			}
		};
	} catch (error) {
		sessionWorkAdmission.release();
		throw error;
	}
}
async function finalizeCronRun(params) {
	const { prepared, execution } = params;
	const finalRunResult = execution.runResult;
	const payloads = finalRunResult.payloads ?? [];
	let telemetry;
	if (!params.isAborted()) {
		if (finalRunResult.meta?.systemPromptReport) prepared.cronSession.sessionEntry.systemPromptReport = finalRunResult.meta.systemPromptReport;
		require_run_session_state.adoptCronRunSessionMetadata({
			entry: prepared.cronSession.sessionEntry,
			sessionKey: prepared.agentSessionKey,
			runMeta: finalRunResult.meta?.agentMeta
		});
	}
	const usage = finalRunResult.meta?.agentMeta?.usage;
	const lastCallUsage = finalRunResult.meta?.agentMeta?.lastCallUsage;
	const promptTokens = finalRunResult.meta?.agentMeta?.promptTokens;
	const modelUsed = finalRunResult.meta?.agentMeta?.model ?? execution.fallbackModel ?? execution.liveSelection.model;
	const providerUsed = finalRunResult.meta?.agentMeta?.provider ?? execution.fallbackProvider ?? execution.liveSelection.provider;
	const contextTokens = resolvePositiveContextTokens(prepared.agentCfg?.contextTokens) ?? (await loadCronContextRuntime()).lookupContextTokens(modelUsed, { allowAsyncLoad: false }) ?? resolvePositiveContextTokens(prepared.cronSession.sessionEntry.contextTokens) ?? 2e5;
	if (!params.isAborted()) {
		require_store.setSessionRuntimeModel(prepared.cronSession.sessionEntry, {
			provider: providerUsed,
			model: modelUsed
		});
		prepared.cronSession.sessionEntry.contextTokens = contextTokens;
		if (require_model_selection_cli.isCliProvider(providerUsed, prepared.cfgWithAgentDefaults)) {
			const cliSessionBinding = finalRunResult.meta?.agentMeta?.cliSessionBinding;
			const cliSessionId = finalRunResult.meta?.agentMeta?.sessionId?.trim();
			if (finalRunResult.meta?.agentMeta?.clearCliSessionBinding === true) {
				const { clearCliSession } = await loadCliRunnerRuntime();
				clearCliSession(prepared.cronSession.sessionEntry, providerUsed);
			} else if (cliSessionBinding?.sessionId?.trim()) {
				const { setCliSessionBinding } = await loadCliRunnerRuntime();
				setCliSessionBinding(prepared.cronSession.sessionEntry, providerUsed, cliSessionBinding);
			} else if (cliSessionId) {
				const { setCliSessionId } = await loadCliRunnerRuntime();
				setCliSessionId(prepared.cronSession.sessionEntry, providerUsed, cliSessionId);
			}
		}
	}
	if (require_session_accessor.hasNonzeroUsage(usage)) {
		const { estimateUsageCost, resolveModelCostConfig } = await loadUsageFormatRuntime();
		const input = usage.input ?? 0;
		const output = usage.output ?? 0;
		const cacheRead = usage.cacheRead ?? 0;
		const cacheWrite = usage.cacheWrite ?? 0;
		const hasBillableUsageBuckets = usage.input !== void 0 || usage.output !== void 0 || usage.cacheRead !== void 0 || usage.cacheWrite !== void 0;
		const lastCallTotalTokens = require_session_accessor.deriveSessionTotalTokens({
			usage: lastCallUsage,
			contextTokens,
			promptTokens
		});
		const totalTokens = typeof lastCallTotalTokens === "number" && lastCallTotalTokens > 0 ? lastCallTotalTokens : lastCallUsage?.contextUsage?.state === "unavailable" ? void 0 : require_session_accessor.deriveSessionTotalTokens({
			usage,
			contextTokens,
			promptTokens
		});
		const runEstimatedCostUsd = require_number_coercion.resolveNonNegativeNumber(estimateUsageCost({
			usage,
			cost: resolveModelCostConfig({
				provider: providerUsed,
				model: modelUsed,
				config: prepared.cfgWithAgentDefaults
			})
		}));
		prepared.cronSession.sessionEntry.inputTokens = input;
		prepared.cronSession.sessionEntry.outputTokens = output;
		const telemetryUsage = {
			input_tokens: input,
			output_tokens: output
		};
		const bucketTotalTokens = input + output + cacheRead + cacheWrite;
		const aggregateTotalTokens = typeof usage.total === "number" && Number.isFinite(usage.total) ? Math.max(bucketTotalTokens, usage.total) : bucketTotalTokens;
		if (aggregateTotalTokens > 0) telemetryUsage.total_tokens = aggregateTotalTokens;
		if (typeof totalTokens === "number" && Number.isFinite(totalTokens) && totalTokens > 0) {
			prepared.cronSession.sessionEntry.totalTokens = totalTokens;
			prepared.cronSession.sessionEntry.totalTokensFresh = true;
		} else {
			prepared.cronSession.sessionEntry.totalTokens = void 0;
			prepared.cronSession.sessionEntry.totalTokensFresh = false;
		}
		prepared.cronSession.sessionEntry.cacheRead = cacheRead;
		prepared.cronSession.sessionEntry.cacheWrite = cacheWrite;
		if (runEstimatedCostUsd !== void 0) prepared.cronSession.sessionEntry.estimatedCostUsd = runEstimatedCostUsd;
		telemetry = {
			model: modelUsed,
			provider: providerUsed,
			usage: telemetryUsage
		};
		if (require_diagnostic_events.isDiagnosticsEnabled(prepared.cfgWithAgentDefaults)) {
			const usagePromptTokens = input + cacheRead + cacheWrite;
			const contextUsedTokens = require_session_accessor.deriveContextPromptTokens({
				lastCallUsage,
				promptTokens,
				usage
			});
			require_diagnostic_events.emitTrustedDiagnosticEvent({
				type: "model.usage",
				...finalRunResult.diagnosticTrace ? { trace: require_diagnostic_events.freezeDiagnosticTraceContext(require_diagnostic_events.createChildDiagnosticTraceContext(finalRunResult.diagnosticTrace)) } : {},
				sessionKey: prepared.runSessionKey,
				sessionId: prepared.currentRunSessionId(),
				channel: "cron",
				agentId: prepared.agentId,
				provider: providerUsed,
				model: modelUsed,
				usage: {
					input,
					output,
					cacheRead,
					cacheWrite,
					promptTokens: usagePromptTokens,
					total: aggregateTotalTokens
				},
				lastCallUsage,
				context: {
					limit: contextTokens,
					...contextUsedTokens !== void 0 ? { used: contextUsedTokens } : {}
				},
				...hasBillableUsageBuckets && runEstimatedCostUsd !== void 0 ? { costUsd: runEstimatedCostUsd } : {},
				durationMs: execution.runEndedAt - execution.runStartedAt
			});
		}
	} else telemetry = {
		model: modelUsed,
		provider: providerUsed
	};
	await prepared.persistSessionEntry();
	await prepared.runContinuationSession?.seal({ basePersisted: true });
	if (params.isAborted()) return prepared.withRunSession({
		status: "error",
		error: params.abortReason(),
		diagnostics: mergeCronRunDiagnostics(prepared.preflightDiagnostics, createCronRunDiagnosticsFromAgentResult(finalRunResult, { finalStatus: "error" }), createCronRunDiagnosticsFromError("cron-setup", params.abortReason())),
		...telemetry
	});
	const cronPayloadOutcome = require_run_session_state.resolveCronPayloadOutcome({
		payloads,
		runLevelError: finalRunResult.meta?.error,
		failureSignal: finalRunResult.meta?.failureSignal,
		finalAssistantVisibleText: finalRunResult.meta?.finalAssistantVisibleText,
		preferFinalAssistantVisibleText: (await require_source_delivery_fallback.resolveCronChannelOutputPolicy(prepared.resolvedDelivery.channel, { deliveryRequested: prepared.deliveryRequested })).preferFinalAssistantVisibleText
	});
	if (finalRunResult.meta?.aborted === true && !cronPayloadOutcome.hasFatalErrorPayload) {
		const error = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(finalRunResult.meta.error?.message) ?? "cron isolated agent run aborted";
		const { cleanupDirectCronSession } = await loadCronDeliveryRuntime();
		await cleanupDirectCronSession({
			job: prepared.input.job,
			agentSessionKey: prepared.agentSessionKey,
			sessionId: prepared.currentRunSessionId(),
			lifecycleRevision: prepared.cronSession.lifecycleRevision,
			sessionUpdatedAt: prepared.cronSession.sessionEntry.updatedAt,
			beforeSessionDelete: params.beforeSessionDelete,
			retireReason: "cron-delete-after-run-aborted"
		});
		params.markCronRunSessionCleanupAttempted();
		return prepared.withRunSession({
			status: "error",
			error,
			diagnostics: mergeCronRunDiagnostics(prepared.preflightDiagnostics, createCronRunDiagnosticsFromAgentResult(finalRunResult, { finalStatus: "error" }), createCronRunDiagnosticsFromError("agent-run", error)),
			...telemetry
		});
	}
	const { synthesizedText, deliveryPayloads, deliveryPayloadHasStructuredContent, hasFatalStructuredErrorPayload, pendingPresentationWarningError } = cronPayloadOutcome;
	let { summary, outputText, hasFatalErrorPayload, embeddedRunError } = cronPayloadOutcome;
	const agentDiagnostics = createCronRunDiagnosticsFromAgentResult(finalRunResult, { finalStatus: hasFatalErrorPayload ? "error" : "ok" });
	const runDiagnostics = mergeCronRunDiagnostics(prepared.preflightDiagnostics, agentDiagnostics);
	const resolveRunOutcome = (result) => prepared.withRunSession({
		status: hasFatalErrorPayload ? "error" : "ok",
		...hasFatalErrorPayload ? { error: embeddedRunError ?? "cron isolated run returned an error payload" } : {},
		summary,
		outputText,
		delivered: result?.delivered,
		deliveryAttempted: result?.deliveryAttempted,
		deliveryError: result?.deliveryError,
		delivery: result?.delivery,
		diagnostics: mergeCronRunDiagnostics(runDiagnostics, hasFatalErrorPayload ? createCronRunDiagnosticsFromError("agent-run", embeddedRunError ?? "cron isolated run returned an error payload") : void 0, result?.deliveryError ? createCronRunDiagnosticsFromError("delivery", result.deliveryError) : void 0),
		...telemetry
	});
	const failPendingPresentationWarningUnlessDelivered = (delivered) => {
		if (pendingPresentationWarningError && delivered !== true) {
			hasFatalErrorPayload = true;
			embeddedRunError = pendingPresentationWarningError;
		}
	};
	const skipHeartbeatDelivery = prepared.deliveryRequested && !hasFatalErrorPayload && require_run_session_state.isHeartbeatOnlyResponse(deliveryPayloads, require_run_session_state.resolveHeartbeatAckMaxChars(prepared.agentCfg));
	const sourceDeliveryOutcome = require_delivery_evidence.resolveSourceDeliveryOutcome(prepared.sourceDelivery, {
		didSendViaMessageTool: finalRunResult.didSendViaMessagingTool,
		messageToolSentTargets: finalRunResult.messagingToolSentTargets
	});
	if (sourceDeliveryOutcome.visibleDeliveries.length > 0) {
		const { queueCronMessageToolDeliveryAwareness } = await loadCronDeliveryRuntime();
		await queueCronMessageToolDeliveryAwareness({
			cfg: prepared.cfgWithAgentDefaults,
			job: prepared.input.job,
			agentId: prepared.agentId,
			agentSessionKey: prepared.agentSessionKey,
			runStartedAt: execution.runStartedAt,
			resolvedDelivery: prepared.resolvedDelivery,
			sourceDeliveryOutcome
		});
	}
	if (hasFatalStructuredErrorPayload && prepared.deliveryRequested) {
		const { cleanupDirectCronSession } = await loadCronDeliveryRuntime();
		await cleanupDirectCronSession({
			job: prepared.input.job,
			agentSessionKey: prepared.agentSessionKey,
			sessionId: prepared.currentRunSessionId(),
			lifecycleRevision: prepared.cronSession.lifecycleRevision,
			sessionUpdatedAt: prepared.cronSession.sessionEntry.updatedAt,
			beforeSessionDelete: params.beforeSessionDelete,
			retireReason: "cron-delete-after-run-fatal-error"
		});
		params.markCronRunSessionCleanupAttempted();
		const deliveryTrace = buildCronDeliveryTrace({
			deliveryPlan: prepared.deliveryPlan,
			resolvedDelivery: prepared.resolvedDelivery,
			sourceDeliveryOutcome,
			fallbackUsed: false,
			delivered: sourceDeliveryOutcome.verifiedMessageToolDelivery
		});
		return resolveRunOutcome({
			delivered: sourceDeliveryOutcome.verifiedMessageToolDelivery,
			deliveryAttempted: sourceDeliveryOutcome.verifiedMessageToolDelivery,
			delivery: deliveryTrace
		});
	}
	const { dispatchCronDelivery, resolveCronDeliveryBestEffort } = await loadCronDeliveryRuntime();
	const deliveryResult = await dispatchCronDelivery({
		cfg: prepared.input.cfg,
		cfgWithAgentDefaults: prepared.cfgWithAgentDefaults,
		deps: prepared.input.deps,
		job: prepared.input.job,
		agentId: prepared.agentId,
		agentSessionKey: prepared.agentSessionKey,
		runSessionKey: prepared.runSessionKey,
		sessionId: prepared.currentRunSessionId(),
		lifecycleRevision: prepared.cronSession.lifecycleRevision,
		sessionUpdatedAt: prepared.cronSession.sessionEntry.updatedAt,
		beforeSessionDelete: params.beforeSessionDelete,
		runStartedAt: execution.runStartedAt,
		runEndedAt: execution.runEndedAt,
		timeoutMs: prepared.timeoutMs,
		resolvedDelivery: prepared.resolvedDelivery,
		deliveryRequested: prepared.deliveryRequested,
		skipHeartbeatDelivery,
		sourceDeliveryOutcome,
		deliveryBestEffort: resolveCronDeliveryBestEffort(prepared.input.job),
		deliveryPayloadHasStructuredContent,
		deliveryPayloads,
		synthesizedText,
		ttsAuto: prepared.cronSession.sessionEntry.ttsAuto,
		summary,
		outputText,
		telemetry,
		abortSignal: prepared.input.abortSignal ?? prepared.input.signal,
		isAborted: params.isAborted,
		abortReason: params.abortReason,
		withRunSession: prepared.withRunSession
	});
	if (deliveryResult.cronRunSessionCleanupAttempted) params.markCronRunSessionCleanupAttempted();
	const deliveryTrace = buildCronDeliveryTrace({
		deliveryPlan: prepared.deliveryPlan,
		resolvedDelivery: prepared.resolvedDelivery,
		sourceDeliveryOutcome,
		fallbackUsed: prepared.deliveryRequested && deliveryResult.deliveryAttempted && !sourceDeliveryOutcome.satisfiesSourceDelivery,
		delivered: deliveryResult.delivered
	});
	if (deliveryResult.result) {
		const deliveryError = deliveryResult.result.deliveryError ?? deliveryResult.deliveryError;
		const deliveryDiagnosticError = deliveryError ?? (deliveryResult.result.status === "error" ? deliveryResult.result.error : void 0);
		const resultWithDeliveryMeta = {
			...deliveryResult.result,
			delivered: deliveryResult.result.delivered ?? deliveryResult.delivered,
			deliveryAttempted: deliveryResult.result.deliveryAttempted ?? deliveryResult.deliveryAttempted,
			deliveryError,
			delivery: deliveryTrace,
			diagnostics: mergeCronRunDiagnostics(runDiagnostics, deliveryResult.result.diagnostics, deliveryDiagnosticError ? createCronRunDiagnosticsFromError("delivery", deliveryDiagnosticError) : void 0)
		};
		failPendingPresentationWarningUnlessDelivered(resultWithDeliveryMeta.delivered ?? deliveryResult.delivered);
		if (!hasFatalErrorPayload) {
			if (deliveryResult.result.status === "error" && deliveryResult.result.errorKind !== "delivery-target" && !params.isAborted()) {
				const failedDeliveryError = resultWithDeliveryMeta.error;
				const successfulResult = {
					...resultWithDeliveryMeta,
					status: "ok",
					delivered: resultWithDeliveryMeta.delivered ?? deliveryResult.delivered,
					...failedDeliveryError ? { deliveryError: failedDeliveryError } : {}
				};
				delete successfulResult.error;
				delete successfulResult.errorKind;
				return successfulResult;
			}
			return resultWithDeliveryMeta;
		}
		if (deliveryResult.result.status !== "ok") return resultWithDeliveryMeta;
		return resolveRunOutcome({
			delivered: deliveryResult.result.delivered,
			deliveryAttempted: resultWithDeliveryMeta.deliveryAttempted,
			delivery: deliveryTrace
		});
	}
	summary = deliveryResult.summary;
	outputText = deliveryResult.outputText;
	failPendingPresentationWarningUnlessDelivered(deliveryResult.delivered);
	return resolveRunOutcome({
		delivered: deliveryResult.delivered,
		deliveryAttempted: deliveryResult.deliveryAttempted,
		deliveryError: deliveryResult.deliveryError,
		delivery: deliveryTrace
	});
}
/**
* Release runtime references held by a completed isolated cron run.
*
* After the final durable write and delivery complete, the cron session store
* and run context are no longer needed in memory.  This shallow disposal prevents
* the heap-retention pattern described in #85019 where ~113k copies of the skill
* prompt string accumulated through cron run contexts that were never released.
*
* O(1) — nulls known large fields without deep traversal.  MUST run after the
* final `persistSessionEntry()` and delivery construction, never before.
*/
async function disposeCronRunContext(params) {
	require_agent_events.releaseAgentRunContext(params.sessionId, params.runContextOwnerToken);
	if (params.ownsRunContext) await require_agent_bundle_mcp_runtime.retireSessionMcpRuntime({
		sessionId: params.sessionId,
		reason: "isolated-cron-dispose",
		onError: (error, sid) => {
			require_logger.logWarn(`[cron] Failed to retire MCP runtime during isolated cron dispose ${sid}: ${String(error)}`);
		}
	}).catch(() => {});
	params.cronSession.store = void 0;
}
/** Runs one isolated cron agent turn, including setup, execution, delivery, and persistence. */
async function runCronIsolatedAgentTurn(params) {
	const admittedLifecycleGeneration = require_agent_events.getAgentEventLifecycleGeneration();
	const upstreamAbortSignal = params.abortSignal ?? params.signal;
	const lifecycleAbortController = new AbortController();
	const abortSignal = upstreamAbortSignal ? AbortSignal.any([upstreamAbortSignal, lifecycleAbortController.signal]) : lifecycleAbortController.signal;
	const isAborted = () => abortSignal?.aborted ?? false;
	const abortReason = () => require_model_fallback.resolveCronAbortReasonText(abortSignal?.reason) ?? "cron: job execution timed out";
	const isFastTestEnv = process.env.OPERATOR_TEST_FAST === "1";
	const prepared = await prepareCronRunContext({
		input: {
			...params,
			abortSignal
		},
		isFastTestEnv,
		onLifecycleInterrupt: () => lifecycleAbortController.abort(require_run_termination.createAgentRunRestartAbortError())
	});
	if (!prepared.ok) return prepared.result;
	const initialSessionId = prepared.context.cronSession.sessionEntry.sessionId;
	const ownsRunContext = params.job.sessionTarget === "isolated";
	let runContextOwnerToken;
	let runLifecycleGeneration = admittedLifecycleGeneration;
	let executionStarted = false;
	const notifyExecutionStarted = (info) => {
		executionStarted = true;
		if (info?.lifecycleGeneration) runLifecycleGeneration = info.lifecycleGeneration;
		params.onExecutionStarted?.({
			jobId: params.job.id,
			agentId: prepared.context.agentId,
			sessionId: prepared.context.currentRunSessionId(),
			sessionKey: prepared.context.runSessionKey,
			phase: "runner_entered",
			provider: prepared.context.liveSelection.provider,
			model: prepared.context.liveSelection.model
		});
	};
	const notifyExecutionPhase = (info) => {
		params.onExecutionPhase?.({
			jobId: params.job.id,
			agentId: prepared.context.agentId,
			sessionId: prepared.context.currentRunSessionId(),
			sessionKey: prepared.context.runSessionKey,
			provider: prepared.context.liveSelection.provider,
			model: prepared.context.liveSelection.model,
			...info
		});
	};
	const turnStartedAtMs = Date.now();
	const messageLifecycle = (() => {
		try {
			const lifecycle = require_message_lifecycle.createDiagnosticMessageLifecycle({
				enabled: require_diagnostic_events.isDiagnosticsEnabled(params.cfg),
				sessionId: prepared.context.runSessionId,
				sessionKey: prepared.context.runSessionKey,
				channel: "cron",
				source: "cron-isolated",
				startedAtMs: turnStartedAtMs,
				trackSessionState: true
			});
			lifecycle.markProcessing();
			return lifecycle;
		} catch (error) {
			prepared.context.sessionWorkAdmission.release();
			throw error;
		}
	})();
	let outcome = "completed";
	let outcomeError;
	let cronRunSessionCleanupAttempted = false;
	try {
		require_agent_events.assertAgentRunLifecycleGenerationCurrent(runLifecycleGeneration);
		const existingRunContext = require_agent_events.getAgentRunContext(initialSessionId);
		runContextOwnerToken = require_agent_events.claimAgentRunContext(initialSessionId, {
			sessionKey: ownsRunContext || !existingRunContext?.sessionKey ? prepared.context.runSessionKey : existingRunContext.sessionKey,
			sessionId: initialSessionId,
			lifecycleGeneration: runLifecycleGeneration
		}, {
			trackOwner: true,
			ownsContext: ownsRunContext
		});
		const { executeCronRun } = await loadCronExecutorRuntime();
		const executionParams = {
			cfg: params.cfg,
			cfgWithAgentDefaults: prepared.context.cfgWithAgentDefaults,
			job: params.job,
			agentId: prepared.context.agentId,
			agentDir: prepared.context.agentDir,
			agentSessionKey: prepared.context.agentSessionKey,
			runSessionKey: prepared.context.runSessionKey,
			usesDetachedRunSession: prepared.context.usesDetachedRunSession,
			workspaceDir: prepared.context.workspaceDir,
			lane: params.lane,
			resolvedDelivery: {
				channel: prepared.context.resolvedDelivery.channel,
				to: prepared.context.resolvedDelivery.to,
				accountId: prepared.context.resolvedDelivery.accountId,
				threadId: prepared.context.resolvedDelivery.threadId
			},
			resolvedDeliveryOk: prepared.context.resolvedDelivery.ok,
			deliveryRequested: prepared.context.deliveryRequested,
			sourceDelivery: prepared.context.sourceDelivery,
			messageToolPromptEnabled: prepared.context.messageToolPromptEnabled,
			skillsSnapshot: prepared.context.skillsSnapshot,
			agentPayload: prepared.context.agentPayload,
			useSubagentFallbacks: prepared.context.useSubagentFallbacks,
			inheritDefaultFallbacksForAgentStringModel: prepared.context.inheritDefaultFallbacksForAgentStringModel,
			modelFallbacksOverride: prepared.context.modelFallbacksOverride,
			agentVerboseDefault: prepared.context.agentCfg?.verboseDefault,
			liveSelection: prepared.context.liveSelection,
			cronSession: prepared.context.cronSession,
			commandBody: prepared.context.commandBody,
			persistSessionEntry: prepared.context.persistSessionEntry,
			persistRunContinuationSession: prepared.context.runContinuationSession?.sync,
			setRunContinuationCliExecutionProvider: prepared.context.runContinuationSession?.setCliExecutionProvider,
			abortSignal,
			onExecutionStarted: notifyExecutionStarted,
			onExecutionPhase: notifyExecutionPhase,
			onLaneWait: params.onLaneWait,
			abortReason,
			isAborted,
			thinkLevel: prepared.context.thinkLevel,
			thinkingCatalog: prepared.context.thinkingCatalog,
			timeoutMs: prepared.context.timeoutMs,
			runTimeoutOverrideMs: prepared.context.runTimeoutOverrideMs,
			suppressExecNotifyOnExit: prepared.context.suppressExecNotifyOnExit
		};
		const execution = await prepared.context.sessionWorkAdmission.run(async () => executeCronRun(executionParams));
		const finalized = await finalizeCronRun({
			prepared: prepared.context,
			execution,
			abortReason,
			isAborted,
			markCronRunSessionCleanupAttempted: () => {
				cronRunSessionCleanupAttempted = true;
			},
			beforeSessionDelete: prepared.context.sessionWorkAdmission.release
		});
		if (finalized.status === "error") {
			outcome = "error";
			outcomeError = finalized.error;
		}
		return finalized;
	} catch (err) {
		const isCronLaneTimeout = isAborted() || isCronNestedLaneTaskTimeoutError(err);
		const error = isCronLaneTimeout ? abortReason() : String(err);
		outcome = "error";
		outcomeError = error;
		return prepared.context.withRunSession({
			status: "error",
			error,
			executionStarted,
			provider: prepared.context.liveSelection.provider,
			model: prepared.context.liveSelection.model,
			diagnostics: mergeCronRunDiagnostics(prepared.context.preflightDiagnostics, createCronRunDiagnosticsFromError(isCronLaneTimeout ? "cron-setup" : "agent-run", isCronLaneTimeout ? error : err))
		});
	} finally {
		try {
			await prepared.context.runContinuationSession?.seal();
		} catch (sealError) {
			require_logger.logWarn(`[cron:${params.job.id}] Failed to seal run continuation during cleanup: ${String(sealError)}`);
		}
		const finalSessionRef = {
			sessionId: prepared.context.currentRunSessionId(),
			sessionKey: prepared.context.runSessionKey
		};
		messageLifecycle.markIdle(void 0, finalSessionRef);
		messageLifecycle.markProcessed(outcome, {
			...finalSessionRef,
			error: outcomeError
		});
		try {
			if (!cronRunSessionCleanupAttempted) cronRunSessionCleanupAttempted = await require_session_cleanup.cleanupCronRunSessionAfterRun({
				job: params.job,
				agentSessionKey: prepared.context.agentSessionKey,
				sessionId: prepared.context.currentRunSessionId(),
				lifecycleRevision: prepared.context.cronSession.lifecycleRevision,
				sessionUpdatedAt: prepared.context.cronSession.sessionEntry.updatedAt,
				beforeDelete: prepared.context.sessionWorkAdmission.release,
				reason: "cron-delete-after-run-finally"
			}) !== "not-requested";
		} finally {
			try {
				if (prepared.context.runContinuationSession) try {
					await require_cron_run_continuation_cleanup.removeCronRunContinuationSessionIfIdle(prepared.context.runSessionKey);
				} catch (error) {
					require_logger.logWarn(`[cron:${params.job.id}] Failed to remove unused run continuation: ${String(error)}`);
				}
				await disposeCronRunContext({
					sessionId: initialSessionId,
					cronSession: prepared.context.cronSession,
					ownsRunContext,
					runContextOwnerToken
				});
			} finally {
				prepared.context.sessionWorkAdmission.release();
			}
		}
	}
}
//#endregion
//#region src/cron/isolated-agent.ts
var isolated_agent_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ runCronIsolatedAgentTurn: () => runCronIsolatedAgentTurn });
//#endregion
Object.defineProperty(exports, "buildCronAgentDefaultsConfig", {
	enumerable: true,
	get: function() {
		return buildCronAgentDefaultsConfig;
	}
});
Object.defineProperty(exports, "createCronRunDiagnosticsFromError", {
	enumerable: true,
	get: function() {
		return createCronRunDiagnosticsFromError;
	}
});
Object.defineProperty(exports, "isolated_agent_exports", {
	enumerable: true,
	get: function() {
		return isolated_agent_exports;
	}
});
Object.defineProperty(exports, "normalizeCronRunDiagnostics", {
	enumerable: true,
	get: function() {
		return normalizeCronRunDiagnostics;
	}
});
Object.defineProperty(exports, "resolveCronActiveRuntimeConfig", {
	enumerable: true,
	get: function() {
		return resolveCronActiveRuntimeConfig;
	}
});
Object.defineProperty(exports, "runCronIsolatedAgentTurn", {
	enumerable: true,
	get: function() {
		return runCronIsolatedAgentTurn;
	}
});
Object.defineProperty(exports, "summarizeCronRunDiagnostics", {
	enumerable: true,
	get: function() {
		return summarizeCronRunDiagnostics;
	}
});
