const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
const require_account_lookup = require("./account-lookup-Bt7ehEAK.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
require("./logger-Bw1L7SVe.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_conversation_binding_context = require("./conversation-binding-context-XssjEZBB.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_chunk = require("./chunk-qjERm7HU.cjs");
const require_runtime_status = require("./runtime-status-BGIjp9Ys.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_chat_message_content = require("./chat-message-content-B4NfuhB-.cjs");
require("./config-DT0qiglW.cjs");
const require_model_thinking_default = require("./model-thinking-default-3L3oHDLO.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_parse_duration = require("./parse-duration-Csu-f48Z.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_model_selection = require("./model-selection-BvFurMxy.cjs");
const require_session_state_events = require("./session-state-events-B4SfvxiO.cjs");
const require_heartbeat_wake = require("./heartbeat-wake-E8hls_pf.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
const require_subagent_capabilities = require("./subagent-capabilities-Bg6I8KeP.cjs");
const require_session_meta = require("./session-meta-BKZldXXC.cjs");
const require_policy = require("./policy-xAgUJHj7.cjs");
const require_call = require("./call-CphTnsHC.cjs");
require("./heartbeat-B6M3DHWg.cjs");
const require_task_registry = require("./task-registry-VcVsRI11.cjs");
require("./runtime-internal-CNKl6hEH.cjs");
const require_task_completion_contract = require("./task-completion-contract-BuZl36IV.cjs");
const require_event_session_routing = require("./event-session-routing-BmkihcER.cjs");
require("./delivery-context-ywYGmcjO.cjs");
const require_subagent_spawn_plan = require("./subagent-spawn-plan-BVV4Zzak.cjs");
const require_sessions_helpers = require("./sessions-helpers-BzXDIb2t.cjs");
const require_route_projection = require("./route-projection-y3vg9S5E.cjs");
const require_lanes = require("./lanes-CNGMiDO4.cjs");
const require_thread_bindings_policy = require("./thread-bindings-policy-C0B1MJxA.cjs");
const require_subagent_registry = require("./subagent-registry-DLykI6PJ.cjs");
const require_thread_bindings_messages = require("./thread-bindings-messages-DajtqEC-.cjs");
const require_manager = require("./manager-B5L0WDCm.cjs");
const require_block_streaming = require("./block-streaming-WaBI9q2v.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _gabrielvfonseca_acp_core_runtime_session_identifiers = require("@gabrielvfonseca/acp-core/runtime/session-identifiers");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/acp/control-plane/spawn.ts
/** Best-effort cleanup for partially created ACP sessions, bindings, and transcripts. */
async function cleanupFailedAcpSpawn(params) {
	if (params.runtimeCloseHandle) await params.runtimeCloseHandle.runtime.close({
		handle: params.runtimeCloseHandle.handle,
		reason: "spawn-failed"
	}).catch((err) => {
		require_globals.logVerbose(`acp-spawn: runtime cleanup close failed for ${params.sessionKey}: ${String(err)}`);
	});
	await require_manager.getAcpSessionManager().closeSession({
		cfg: params.cfg,
		sessionKey: params.sessionKey,
		reason: "spawn-failed",
		allowBackendUnavailable: true,
		requireAcpSession: false
	}).catch((err) => {
		require_globals.logVerbose(`acp-spawn: manager cleanup close failed for ${params.sessionKey}: ${String(err)}`);
	});
	await require_session_binding_service.getSessionBindingService().unbind({
		targetSessionKey: params.sessionKey,
		reason: "spawn-failed"
	}).catch((err) => {
		require_globals.logVerbose(`acp-spawn: binding cleanup unbind failed for ${params.sessionKey}: ${String(err)}`);
	});
	if (!params.shouldDeleteSession) return;
	await require_call.callGateway({
		method: "sessions.delete",
		params: {
			key: params.sessionKey,
			deleteTranscript: params.deleteTranscript,
			emitLifecycleHooks: false
		},
		timeoutMs: 1e4
	}).catch(() => {});
}
//#endregion
//#region src/auto-reply/reply/acp-stream-settings.ts
const DEFAULT_ACP_REPEAT_SUPPRESSION = true;
const DEFAULT_ACP_DELIVERY_MODE = "final_only";
const DEFAULT_ACP_HIDDEN_BOUNDARY_SEPARATOR = "paragraph";
const DEFAULT_ACP_HIDDEN_BOUNDARY_SEPARATOR_LIVE = "space";
const DEFAULT_ACP_MAX_OUTPUT_CHARS = 24e3;
const DEFAULT_ACP_MAX_SESSION_UPDATE_CHARS = 320;
const ACP_TAG_VISIBILITY_DEFAULTS = {
	agent_message_chunk: true,
	tool_call: false,
	tool_call_update: false,
	usage_update: false,
	available_commands_update: false,
	current_mode_update: false,
	config_option_update: false,
	session_info_update: false,
	plan: false,
	agent_thought_chunk: false
};
function isAcpSessionUpdateTag(tag) {
	return Object.hasOwn(ACP_TAG_VISIBILITY_DEFAULTS, tag);
}
function clampBoolean(value, fallback) {
	return typeof value === "boolean" ? value : fallback;
}
function resolveAcpDeliveryMode(value) {
	if (value === "live" || value === "final_only") return value;
	return DEFAULT_ACP_DELIVERY_MODE;
}
function resolveAcpHiddenBoundarySeparator(value, fallback) {
	if (value === "none" || value === "space" || value === "newline" || value === "paragraph") return value;
	return fallback;
}
/** Resolves ACP projection settings with bounded defaults. */
function resolveAcpProjectionSettings(cfg) {
	const stream = cfg.acp?.stream;
	const deliveryMode = resolveAcpDeliveryMode(stream?.deliveryMode);
	const hiddenBoundaryFallback = deliveryMode === "live" ? DEFAULT_ACP_HIDDEN_BOUNDARY_SEPARATOR_LIVE : DEFAULT_ACP_HIDDEN_BOUNDARY_SEPARATOR;
	return {
		deliveryMode,
		hiddenBoundarySeparator: resolveAcpHiddenBoundarySeparator(stream?.hiddenBoundarySeparator, hiddenBoundaryFallback),
		repeatSuppression: clampBoolean(stream?.repeatSuppression, DEFAULT_ACP_REPEAT_SUPPRESSION),
		maxOutputChars: require_block_streaming.clampPositiveInteger(stream?.maxOutputChars, DEFAULT_ACP_MAX_OUTPUT_CHARS, {
			min: 1,
			max: 5e5
		}),
		maxSessionUpdateChars: require_block_streaming.clampPositiveInteger(stream?.maxSessionUpdateChars, DEFAULT_ACP_MAX_SESSION_UPDATE_CHARS, {
			min: 64,
			max: 8e3
		}),
		tagVisibility: stream?.tagVisibility ?? {}
	};
}
function isAcpTagVisible(settings, tag) {
	if (!tag) return true;
	if (!isAcpSessionUpdateTag(tag)) return true;
	const override = settings.tagVisibility[tag];
	if (typeof override === "boolean") return override;
	const defaultVisibility = ACP_TAG_VISIBILITY_DEFAULTS[tag];
	if (defaultVisibility === void 0) throw new Error(`Missing ACP visibility default for ${tag}`);
	return defaultVisibility;
}
//#endregion
//#region src/agents/acp-spawn-parent-stream.ts
/** Relays child ACP session stream updates back into the requester parent session. */
const DEFAULT_STREAM_FLUSH_MS = 2500;
const DEFAULT_NO_OUTPUT_NOTICE_MS = 6e4;
const DEFAULT_NO_OUTPUT_POLL_MS = 15e3;
const DEFAULT_MAX_RELAY_LIFETIME_MS = 360 * 60 * 1e3;
const STREAM_BUFFER_MAX_CHARS = 4e3;
const STREAM_SNIPPET_MAX_CHARS = 220;
function compactWhitespace(value) {
	return value.replace(/\s+/g, " ").trim();
}
function truncate(value, maxChars) {
	if (value.length <= maxChars) return value;
	if (maxChars <= 1) return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, maxChars);
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, maxChars - 1)}…`;
}
function normalizeStringArray(value) {
	if (!Array.isArray(value)) return [];
	return value.filter((item) => typeof item === "string" && item.length > 0);
}
function formatProxyEnvSummary(keys) {
	if (keys.length === 0) return "proxy env: none";
	return `proxy env: ${keys.join(", ")}`;
}
function asObjectRecord(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function asStreamingConfigRecord(value) {
	const record = asObjectRecord(value);
	if (record) return record;
	if (typeof value === "string") return { mode: value };
	if (typeof value === "boolean") return { mode: value ? "partial" : "off" };
}
function mergeStreamingConfig(base, override) {
	const baseRecord = asStreamingConfigRecord(base);
	const overrideRecord = asStreamingConfigRecord(override);
	if (!baseRecord || !overrideRecord) return override ?? base;
	const merged = {
		...baseRecord,
		...overrideRecord
	};
	const baseProgress = asObjectRecord(baseRecord.progress);
	const overrideProgress = asObjectRecord(overrideRecord.progress);
	if (baseProgress && overrideProgress) merged.progress = {
		...baseProgress,
		...overrideProgress
	};
	else if (overrideProgress ?? baseProgress) merged.progress = overrideProgress ?? baseProgress;
	else delete merged.progress;
	return merged;
}
function mergeStreamingEntry(base, override) {
	if (!override) return base;
	return {
		...base,
		...override,
		streaming: mergeStreamingConfig(base.streaming, override.streaming)
	};
}
function hasConfiguredPreviewStreamMode(entry) {
	return asObjectRecord(entry.streaming)?.mode !== void 0 || typeof entry.streaming === "string" || typeof entry.streaming === "boolean";
}
function applyParentPreviewStreamModeDefault(entry, channelId) {
	if (channelId !== "discord" || hasConfiguredPreviewStreamMode(entry)) return entry;
	const streaming = asObjectRecord(entry.streaming);
	return {
		...entry,
		streaming: streaming ? {
			...streaming,
			mode: "progress"
		} : { mode: "progress" }
	};
}
function resolveParentProgressStreamingEntry(params) {
	const channelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.deliveryContext?.channel);
	if (!params.cfg || !channelId) return;
	const channelCfg = params.cfg.channels?.[channelId];
	if (!channelCfg) return;
	return applyParentPreviewStreamModeDefault(mergeStreamingEntry(channelCfg, require_account_lookup.resolveNormalizedAccountEntry(channelCfg.accounts, require_account_id.normalizeAccountId(params.deliveryContext?.accountId), require_account_id.normalizeAccountId)), channelId);
}
function resolveParentProgressCommentary(params) {
	return require_chunk.resolveChannelStreamingProgressCommentary(resolveParentProgressStreamingEntry(params), true);
}
function shouldRelayAcpStatusProgress(params) {
	if (params.eventType !== "status" || !params.text) return false;
	return isAcpTagVisible(params.projectionSettings, params.tag);
}
function resolveAcpStreamLogPathFromSessionFile(sessionFile, sessionId) {
	const baseDir = node_path.default.dirname(node_path.default.resolve(sessionFile));
	return node_path.default.join(baseDir, `${sessionId}.acp-stream.jsonl`);
}
/** Resolves the JSONL stream log path for an ACP child session when metadata exists. */
function resolveAcpSpawnStreamLogPath(params) {
	const childSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.childSessionKey);
	if (!childSessionKey) return;
	const storeEntry = require_session_meta.readAcpSessionEntry({ sessionKey: childSessionKey });
	const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(storeEntry?.entry?.sessionId);
	if (!storeEntry || !sessionId) return;
	try {
		return resolveAcpStreamLogPathFromSessionFile(require_paths.resolveSessionFilePath(sessionId, storeEntry.entry, require_paths.resolveSessionFilePathOptions({ storePath: storeEntry.storePath })), sessionId);
	} catch {
		return;
	}
}
/** Starts a bounded parent-session relay for child ACP output and progress notices. */
function startAcpSpawnParentStreamRelay(params) {
	const runId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.runId) ?? "";
	const parentSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.parentSessionKey) ?? "";
	if (!runId || !parentSessionKey) return {
		dispose: () => {},
		notifyStarted: () => {}
	};
	const streamFlushMs = typeof params.streamFlushMs === "number" && Number.isFinite(params.streamFlushMs) ? Math.max(0, Math.floor(params.streamFlushMs)) : DEFAULT_STREAM_FLUSH_MS;
	const noOutputNoticeMs = typeof params.noOutputNoticeMs === "number" && Number.isFinite(params.noOutputNoticeMs) ? Math.max(0, Math.floor(params.noOutputNoticeMs)) : DEFAULT_NO_OUTPUT_NOTICE_MS;
	const noOutputPollMs = typeof params.noOutputPollMs === "number" && Number.isFinite(params.noOutputPollMs) ? Math.max(250, Math.floor(params.noOutputPollMs)) : DEFAULT_NO_OUTPUT_POLL_MS;
	const maxRelayLifetimeMs = typeof params.maxRelayLifetimeMs === "number" && Number.isFinite(params.maxRelayLifetimeMs) ? Math.max(1e3, Math.floor(params.maxRelayLifetimeMs)) : DEFAULT_MAX_RELAY_LIFETIME_MS;
	const relayLabel = truncate(compactWhitespace(params.agentId), 40) || "ACP child";
	const contextPrefix = `acp-spawn:${runId}`;
	const logPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.logPath);
	let logDirReady = false;
	let pendingLogLines = "";
	let logFlushScheduled = false;
	let logWriteChain = Promise.resolve();
	const flushLogBuffer = () => {
		if (!logPath || !pendingLogLines) return;
		const chunk = pendingLogLines;
		pendingLogLines = "";
		logWriteChain = logWriteChain.then(async () => {
			if (!logDirReady) {
				await (0, node_fs_promises.mkdir)(node_path.default.dirname(logPath), { recursive: true });
				logDirReady = true;
			}
			await (0, _openclaw_fs_safe_advanced.appendRegularFile)({
				filePath: logPath,
				content: chunk
			});
		}).catch(() => {});
	};
	const scheduleLogFlush = () => {
		if (!logPath || logFlushScheduled) return;
		logFlushScheduled = true;
		queueMicrotask(() => {
			logFlushScheduled = false;
			flushLogBuffer();
		});
	};
	const writeLogLine = (entry) => {
		if (!logPath) return;
		try {
			pendingLogLines += `${JSON.stringify(entry)}\n`;
			if (pendingLogLines.length >= 16384) {
				flushLogBuffer();
				return;
			}
			scheduleLogFlush();
		} catch {}
	};
	const logEvent = (kind, fields) => {
		writeLogLine({
			ts: (/* @__PURE__ */ new Date()).toISOString(),
			epochMs: Date.now(),
			runId,
			parentSessionKey,
			childSessionKey: params.childSessionKey,
			agentId: params.agentId,
			kind,
			...fields
		});
	};
	const shouldSurfaceUpdates = params.surfaceUpdates !== false;
	const shouldRelayProgressCommentary = resolveParentProgressCommentary({
		cfg: params.cfg,
		deliveryContext: params.deliveryContext
	});
	const acpProjectionSettings = resolveAcpProjectionSettings(params.cfg ?? {});
	const eventRouting = params.eventRouting ?? {
		mainKey: params.mainKey,
		sessionScope: params.sessionScope
	};
	const wake = () => {
		if (!shouldSurfaceUpdates) return;
		require_heartbeat_wake.requestHeartbeat(require_event_session_routing.scopedHeartbeatWakeOptionsForPolicy(parentSessionKey, {
			source: "acp-spawn",
			intent: "event",
			reason: "acp:spawn:stream"
		}, eventRouting));
	};
	const emit = (text, contextKey) => {
		const cleaned = text.trim();
		if (!cleaned) return;
		logEvent("system_event", {
			contextKey,
			text: cleaned
		});
		if (!shouldSurfaceUpdates) return;
		require_system_events.enqueueSystemEvent(cleaned, {
			sessionKey: require_event_session_routing.resolveEventSessionKeyForPolicy(parentSessionKey, eventRouting),
			contextKey,
			deliveryContext: params.deliveryContext
		});
		wake();
	};
	const emitStartNotice = () => {
		require_task_completion_contract.recordTaskRunProgressByRunId({
			runId,
			runtime: "acp",
			sessionKey: params.childSessionKey,
			lastEventAt: Date.now(),
			eventSummary: "Started."
		});
		emit(`Started ${relayLabel} session ${params.childSessionKey}. Streaming progress updates to parent session.`, `${contextPrefix}:start`);
	};
	let disposed = false;
	let pendingText = "";
	let pendingProgressKind;
	let replaceableAssistantSnapshot;
	const itemProgressTextById = /* @__PURE__ */ new Map();
	let lastProgressAt = Date.now();
	let stallNotified = false;
	let promptSubmittedAt;
	let firstRuntimeEventAt;
	let firstVisibleOutputAt;
	let lastRuntimeEventType;
	let proxyEnvKeysAtPrompt = [];
	let flushTimer;
	let relayLifetimeTimer;
	const clearFlushTimer = () => {
		if (!flushTimer) return;
		clearTimeout(flushTimer);
		flushTimer = void 0;
	};
	const clearRelayLifetimeTimer = () => {
		if (!relayLifetimeTimer) return;
		clearTimeout(relayLifetimeTimer);
		relayLifetimeTimer = void 0;
	};
	const flushPending = () => {
		clearFlushTimer();
		if (!pendingText) return;
		const snippet = truncate(compactWhitespace(pendingText), STREAM_SNIPPET_MAX_CHARS);
		pendingText = "";
		pendingProgressKind = void 0;
		if (!snippet) return;
		emit(`${relayLabel}: ${snippet}`, `${contextPrefix}:progress`);
	};
	const scheduleFlush = () => {
		if (disposed || flushTimer || streamFlushMs <= 0) return;
		flushTimer = setTimeout(() => {
			flushPending();
		}, streamFlushMs);
		flushTimer.unref?.();
	};
	const appendVisibleProgress = (delta, kind) => {
		if (stallNotified) {
			stallNotified = false;
			require_task_completion_contract.recordTaskRunProgressByRunId({
				runId,
				runtime: "acp",
				sessionKey: params.childSessionKey,
				lastEventAt: Date.now(),
				eventSummary: "Resumed output."
			});
			emit(`${relayLabel} resumed output.`, `${contextPrefix}:resumed`);
		}
		lastProgressAt = Date.now();
		firstVisibleOutputAt ??= lastProgressAt;
		if (pendingText && pendingProgressKind && pendingProgressKind !== kind) flushPending();
		pendingProgressKind = kind;
		pendingText += delta;
		if (pendingText.length > STREAM_BUFFER_MAX_CHARS) pendingText = (0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(pendingText, -4e3);
		if (pendingText.length >= STREAM_SNIPPET_MAX_CHARS || delta.includes("\n\n")) {
			flushPending();
			return;
		}
		scheduleFlush();
	};
	const flushReplaceableAssistantSnapshot = () => {
		const snapshot = replaceableAssistantSnapshot;
		replaceableAssistantSnapshot = void 0;
		if (!snapshot?.trim()) return;
		appendVisibleProgress(snapshot, "assistant:replaceable");
	};
	const appendItemProgressSnapshot = (snapshot) => {
		const previous = itemProgressTextById.get(snapshot.itemId) ?? "";
		if (snapshot.text === previous) return;
		const kind = `item:${snapshot.itemId}`;
		const isPrefixUpdate = Boolean(previous && snapshot.text.startsWith(previous));
		if (previous && !isPrefixUpdate && pendingProgressKind === kind && Boolean(pendingText)) pendingText = "";
		itemProgressTextById.set(snapshot.itemId, snapshot.text);
		const delta = isPrefixUpdate ? snapshot.text.slice(previous.length) : snapshot.text;
		appendVisibleProgress(delta, kind);
	};
	const buildNoOutputNotice = () => {
		const seconds = Math.round(noOutputNoticeMs / 1e3);
		if (!promptSubmittedAt) return {
			summary: `No prompt submission observed for ${seconds}s after child start.`,
			text: `${relayLabel} session started but no prompt submission was observed for ${seconds}s.`
		};
		if (!firstRuntimeEventAt) {
			const proxySummary = formatProxyEnvSummary(proxyEnvKeysAtPrompt);
			return {
				summary: `Prompt submitted but no ACP runtime event for ${seconds}s (${proxySummary}).`,
				text: `${relayLabel} prompt was submitted but no ACP runtime event arrived for ${seconds}s (${proxySummary}). Check upstream connectivity, auth, or proxy/network access in the gateway child environment.`
			};
		}
		if (!firstVisibleOutputAt) {
			const lastEvent = lastRuntimeEventType ? ` Last ACP event: ${lastRuntimeEventType}.` : "";
			return {
				summary: `ACP runtime active but no visible assistant output for ${seconds}s.${lastEvent}`,
				text: `${relayLabel} has ACP runtime activity but no visible assistant output for ${seconds}s.${lastEvent} It may be working, blocked on a tool, or failing before visible output.`
			};
		}
		return {
			summary: `No visible output for ${seconds}s. It may be waiting for input.`,
			text: `${relayLabel} has produced no visible output for ${seconds}s. It may be waiting for interactive input.`
		};
	};
	const noOutputWatcherTimer = setInterval(() => {
		if (disposed || noOutputNoticeMs <= 0) return;
		if (stallNotified) return;
		if (Date.now() - lastProgressAt < noOutputNoticeMs) return;
		stallNotified = true;
		const notice = buildNoOutputNotice();
		require_task_completion_contract.recordTaskRunProgressByRunId({
			runId,
			runtime: "acp",
			sessionKey: params.childSessionKey,
			lastEventAt: Date.now(),
			eventSummary: notice.summary
		});
		emit(notice.text, `${contextPrefix}:stall`);
	}, noOutputPollMs);
	noOutputWatcherTimer.unref?.();
	relayLifetimeTimer = setTimeout(() => {
		if (disposed) return;
		emit(`${relayLabel} stream relay timed out after ${Math.max(1, Math.round(maxRelayLifetimeMs / 1e3))}s without completion.`, `${contextPrefix}:timeout`);
		dispose();
	}, maxRelayLifetimeMs);
	relayLifetimeTimer.unref?.();
	if (params.emitStartNotice !== false) emitStartNotice();
	const unsubscribe = require_agent_events.onAgentEvent((event) => {
		if (disposed || event.runId !== runId) return;
		if (event.stream === "assistant") {
			const data = event.data;
			const assistantPhase = require_chat_message_content.normalizeAssistantPhase(data?.phase);
			const textCandidate = data?.text;
			const deltaCandidate = data?.delta;
			const snapshot = typeof textCandidate === "string" ? textCandidate : typeof deltaCandidate === "string" ? deltaCandidate : void 0;
			if (data?.replaceable === true) {
				if (snapshot?.trim()) {
					replaceableAssistantSnapshot = snapshot;
					lastProgressAt = Date.now();
					logEvent("assistant_replaceable_snapshot", {
						text: snapshot,
						...assistantPhase ? { phase: assistantPhase } : {}
					});
				}
				return;
			}
			const delta = typeof deltaCandidate === "string" ? deltaCandidate : snapshot;
			if (!delta?.trim()) return;
			logEvent("assistant_delta", {
				delta,
				...assistantPhase ? { phase: assistantPhase } : {}
			});
			if (assistantPhase === "commentary" && !shouldRelayProgressCommentary) {
				lastProgressAt = Date.now();
				return;
			}
			replaceableAssistantSnapshot = void 0;
			appendVisibleProgress(delta, `assistant:${assistantPhase ?? "unknown"}`);
			return;
		}
		if (event.stream === "item") {
			const data = event.data;
			const itemId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(data?.itemId);
			const kind = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(data?.kind);
			const progressText = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(data?.progressText);
			if (kind === "preamble" && progressText) {
				lastProgressAt = Date.now();
				if (shouldRelayProgressCommentary && itemId) appendItemProgressSnapshot({
					itemId,
					text: progressText
				});
			}
			return;
		}
		if (event.stream === "acp") {
			const data = event.data;
			const phase = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(data?.phase);
			logEvent("acp", {
				phase: phase ?? "unknown",
				data: event.data
			});
			if (phase === "prompt_submitted") {
				const at = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(data?.at) ?? Date.now();
				promptSubmittedAt ??= at;
				proxyEnvKeysAtPrompt = normalizeStringArray(data?.proxyEnvKeys);
				lastProgressAt = Date.now();
				return;
			}
			if (phase === "runtime_event") {
				const eventType = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(data?.eventType);
				const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(data?.text);
				const tag = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(data?.tag);
				firstRuntimeEventAt ??= Date.now();
				lastRuntimeEventType = eventType;
				if (shouldRelayProgressCommentary && shouldRelayAcpStatusProgress({
					eventType,
					tag,
					text,
					projectionSettings: acpProjectionSettings
				})) {
					appendVisibleProgress(`${text}\n\n`, "acp:status");
					return;
				}
				lastProgressAt = Date.now();
				return;
			}
			return;
		}
		if (event.stream !== "lifecycle") return;
		const phase = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(event.data?.phase);
		logEvent("lifecycle", {
			phase: phase ?? "unknown",
			data: event.data
		});
		if (phase === "end") {
			flushReplaceableAssistantSnapshot();
			flushPending();
			const startedAt = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(event.data?.startedAt);
			const endedAt = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(event.data?.endedAt);
			const durationMs = startedAt != null && endedAt != null && endedAt >= startedAt ? endedAt - startedAt : void 0;
			if (durationMs != null) emit(`${relayLabel} run completed in ${Math.max(1, Math.round(durationMs / 1e3))}s.`, `${contextPrefix}:done`);
			else emit(`${relayLabel} run completed.`, `${contextPrefix}:done`);
			dispose();
			return;
		}
		if (phase === "error") {
			flushReplaceableAssistantSnapshot();
			flushPending();
			const errorText = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(event.data?.error);
			if (errorText) emit(`${relayLabel} run failed: ${errorText}`, `${contextPrefix}:error`);
			else emit(`${relayLabel} run failed.`, `${contextPrefix}:error`);
			dispose();
		}
	});
	const dispose = () => {
		if (disposed) return;
		disposed = true;
		clearFlushTimer();
		clearRelayLifetimeTimer();
		flushLogBuffer();
		clearInterval(noOutputWatcherTimer);
		unsubscribe();
	};
	return {
		dispose,
		notifyStarted: emitStartNotice
	};
}
//#endregion
//#region src/agents/acp-spawn.ts
/** Implements ACP subagent/session spawning, binding, limits, and parent-stream setup. */
const log = require_subsystem.createSubsystemLogger("agents/acp-spawn");
const ACP_RUNTIME_TIMEOUT_MAX_SECONDS = 1440 * 60;
const ACP_SPAWN_MODES = ["run", "session"];
const ACP_SPAWN_STREAM_TARGETS = ["parent"];
function toGatewayImageAttachments(attachments) {
	if (!attachments || attachments.length === 0) return;
	return attachments.map((attachment) => ({
		type: "image",
		source: {
			type: "base64",
			media_type: attachment.mediaType,
			data: attachment.data
		}
	}));
}
function isSpawnAcpAcceptedResult(result) {
	return result.status === "accepted";
}
const ACP_SPAWN_ACCEPTED_NOTE = "initial ACP task queued in isolated session; follow-ups continue in the bound thread.";
const ACP_SPAWN_SESSION_ACCEPTED_NOTE = "thread-bound ACP session stays active after this task; continue in-thread for follow-ups.";
function resolveAcpSpawnRuntimePolicyError(params) {
	const sandboxMode = params.sandbox === "require" ? "require" : "inherit";
	const requesterRuntime = require_runtime_status.resolveSandboxRuntimeStatus({
		cfg: params.cfg,
		sessionKey: params.requesterSessionKey
	});
	if (params.requesterSandboxed === true || requesterRuntime.sandboxed) return "Sandboxed sessions cannot spawn ACP sessions because runtime=\"acp\" runs on the host. Use runtime=\"subagent\" from sandboxed sessions.";
	if (sandboxMode === "require") return "sessions_spawn sandbox=\"require\" is unsupported for runtime=\"acp\" because ACP sessions run outside the sandbox. Use runtime=\"subagent\" or sandbox=\"inherit\".";
}
function isActiveTaskStatus(status) {
	return status === "queued" || status === "running";
}
function countUntrackedActiveAcpRunsForOwner(ownerKey) {
	const normalizedOwnerKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ownerKey);
	if (!normalizedOwnerKey) return 0;
	const tasks = require_task_registry.listTasksForOwnerKey(normalizedOwnerKey);
	const trackedChildSessionKeys = new Set(tasks.filter((task) => task.runtime === "subagent" && isActiveTaskStatus(task.status) && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task.childSessionKey)).map((task) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task.childSessionKey)));
	return new Set(tasks.flatMap((task) => {
		const childSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task.childSessionKey);
		const trackedRun = childSessionKey ? require_subagent_registry.getSubagentRunByChildSessionKey(childSessionKey) : null;
		const hasActiveRegistryRun = Boolean(trackedRun && typeof trackedRun.endedAt !== "number");
		return task.runtime === "acp" && isActiveTaskStatus(task.status) && childSessionKey !== void 0 && !hasActiveRegistryRun && !trackedChildSessionKeys.has(childSessionKey) ? [childSessionKey] : [];
	})).size;
}
function resolvePlacementWithoutChannelPlugin(params) {
	return params.capabilities.placements.includes("child") ? "child" : "current";
}
function resolveSpawnMode(params) {
	if (params.requestedMode === "run" || params.requestedMode === "session") return params.requestedMode;
	return params.threadRequested ? "session" : "run";
}
function resolveAcpSessionMode(mode) {
	return mode === "session" ? "persistent" : "oneshot";
}
function isHeartbeatEnabledForSessionAgent(params) {
	if (!require_heartbeat_wake.areHeartbeatsEnabled()) return false;
	const requesterAgentId = require_session_key.parseAgentSessionKey(params.sessionKey)?.agentId;
	if (!requesterAgentId) return true;
	const agentEntries = Array.isArray(params.cfg.agents?.list) ? params.cfg.agents.list : [];
	if (!(agentEntries.some((entry) => Boolean(entry?.heartbeat)) ? agentEntries.some((entry) => Boolean(entry?.heartbeat) && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry?.id) === requesterAgentId) : requesterAgentId === require_agent_scope_config.resolveDefaultAgentId(params.cfg))) return false;
	const trimmedEvery = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_agent_scope_config.resolveAgentConfig(params.cfg, requesterAgentId)?.heartbeat?.every ?? params.cfg.agents?.defaults?.heartbeat?.every ?? "30m") ?? "";
	if (!trimmedEvery) return false;
	try {
		return require_parse_duration.parseDurationMs(trimmedEvery, { defaultUnit: "m" }) > 0;
	} catch {
		return false;
	}
}
function resolveHeartbeatConfigForAgent(params) {
	const defaults = params.cfg.agents?.defaults?.heartbeat;
	const overrides = require_agent_scope_config.resolveAgentConfig(params.cfg, params.agentId)?.heartbeat;
	if (!defaults && !overrides) return;
	return {
		...defaults,
		...overrides
	};
}
function hasSessionLocalHeartbeatRelayRoute(params) {
	if ((params.cfg.session?.scope ?? "per-sender") === "global") return false;
	const heartbeat = resolveHeartbeatConfigForAgent({
		cfg: params.cfg,
		agentId: params.requesterAgentId
	});
	if ((heartbeat?.target ?? "none") !== "last") return false;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(heartbeat?.to)) return false;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(heartbeat?.accountId)) return false;
	const parentDeliveryContext = require_delivery_context_shared.deliveryContextFromSession(require_session_accessor.loadSessionEntry({
		storePath: require_paths.resolveStorePath(params.cfg.session?.store, { agentId: params.requesterAgentId }),
		sessionKey: params.parentSessionKey,
		clone: false
	}));
	return Boolean(parentDeliveryContext?.channel && parentDeliveryContext.to);
}
function resolveTargetAcpAgentId(params) {
	const requested = require_session_key.normalizeOptionalAgentId(params.requestedAgentId);
	if (requested) {
		const configuredAgent = params.cfg.agents?.list?.find((agent) => require_session_key.normalizeOptionalAgentId(agent.id) === requested);
		if (configuredAgent?.runtime?.type === "acp") return {
			ok: true,
			agentId: require_session_key.normalizeOptionalAgentId(configuredAgent.runtime.acp?.agent) ?? requested,
			configAgentId: requested
		};
		if (configuredAgent && !isExplicitlyAllowedAcpAgent(params.cfg, requested)) return {
			ok: false,
			error: `agentId "${requested}" is an Operator config agent, not an ACP harness. Use runtime="subagent" or omit runtime for Operator config agents. Use runtime="acp" only with external ACP harness ids such as codex, claude, droid, gemini, or opencode, or configure agents.list[].runtime.type="acp" with runtime.acp.agent.`
		};
		return {
			ok: true,
			agentId: requested,
			...configuredAgent ? { configAgentId: requested } : {}
		};
	}
	const configuredDefault = require_session_key.normalizeOptionalAgentId(params.cfg.acp?.defaultAgent);
	if (configuredDefault) return {
		ok: true,
		agentId: configuredDefault
	};
	return {
		ok: false,
		error: "ACP target agent is not configured. Pass `agentId` in `sessions_spawn` or set `acp.defaultAgent` in config."
	};
}
function isExplicitlyAllowedAcpAgent(cfg, agentId) {
	return (cfg.acp?.allowedAgents ?? []).some((entry) => {
		if (entry.trim() === "*") return true;
		return require_session_key.normalizeOptionalAgentId(entry) === agentId;
	});
}
function resolveConfiguredAcpSubagentTargetIds(cfg) {
	const ids = new Set(require_agent_scope_config.listAgentIds(cfg));
	for (const agent of cfg.agents?.list ?? []) {
		if (agent.runtime?.type !== "acp") continue;
		const acpAgent = require_session_key.normalizeOptionalAgentId(agent.runtime.acp?.agent);
		if (acpAgent) ids.add(acpAgent);
	}
	const defaultAgent = require_session_key.normalizeOptionalAgentId(cfg.acp?.defaultAgent);
	if (defaultAgent) ids.add(defaultAgent);
	for (const entry of cfg.acp?.allowedAgents ?? []) {
		if (entry.trim() === "*") continue;
		const id = require_session_key.normalizeOptionalAgentId(entry);
		if (id) ids.add(id);
	}
	return Array.from(ids);
}
function summarizeError(err) {
	return require_errors.formatErrorMessage(err);
}
function createAcpSpawnFailure(params) {
	return {
		status: params.status,
		errorCode: params.errorCode,
		error: params.error,
		...params.childSessionKey ? { childSessionKey: params.childSessionKey } : {}
	};
}
function isMissingPathError(error) {
	const code = error instanceof Error ? error.code : void 0;
	return code === "ENOENT" || code === "ENOTDIR";
}
async function resolveRuntimeCwdForAcpSpawn(params) {
	if (!params.resolvedCwd) return;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.explicitCwd)) return params.resolvedCwd;
	try {
		await node_fs_promises.default.access(params.resolvedCwd);
		return params.resolvedCwd;
	} catch (error) {
		if (isMissingPathError(error)) return;
		throw error;
	}
}
function resolveRequesterInternalSessionKey(params) {
	const { mainKey, alias } = require_sessions_helpers.resolveMainSessionAlias(params.cfg);
	const requesterSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSessionKey);
	return requesterSessionKey ? require_sessions_helpers.resolveInternalSessionKey({
		key: requesterSessionKey,
		alias,
		mainKey
	}) : alias;
}
async function persistAcpSpawnSessionFileBestEffort(params) {
	try {
		const resolvedSessionFile = await require_session_accessor.resolveSessionTranscriptRuntimeTarget({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			storePath: params.storePath,
			agentId: params.agentId,
			threadId: params.threadId
		});
		return require_session_accessor.loadSessionEntry({
			storePath: params.storePath,
			sessionKey: resolvedSessionFile.sessionKey,
			clone: false
		}) ?? params.sessionEntry;
	} catch (error) {
		log.warn(`ACP session-file persistence failed during ${params.stage} for ${params.sessionKey}: ${summarizeError(error)}`);
		return params.sessionEntry;
	}
}
function resolveConversationRefForThreadBinding(params) {
	return require_conversation_binding_context.resolveInboundConversationResolution({
		cfg: params.cfg,
		channel: params.channel,
		accountId: params.accountId,
		to: params.to,
		threadId: params.threadId,
		groupId: params.groupId,
		isGroup: true
	})?.canonical ?? null;
}
function resolveAcpSpawnChannelAccountId(params) {
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel);
	const explicitAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.accountId);
	if (explicitAccountId) return explicitAccountId;
	if (!channel) return;
	const configuredDefaultAccountId = params.cfg.channels?.[channel]?.defaultAccount;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(configuredDefaultAccountId) ?? "default";
}
function prepareAcpThreadBinding(params) {
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel);
	if (!channel) return {
		ok: false,
		error: "thread=true for ACP sessions requires a channel context."
	};
	const accountId = resolveAcpSpawnChannelAccountId({
		cfg: params.cfg,
		channel,
		accountId: params.accountId
	});
	const policy = require_thread_bindings_policy.resolveThreadBindingSpawnPolicy({
		cfg: params.cfg,
		channel,
		accountId,
		kind: "acp"
	});
	if (!policy.enabled) return {
		ok: false,
		error: require_thread_bindings_policy.formatThreadBindingDisabledError({
			channel: policy.channel,
			accountId: policy.accountId,
			kind: "acp"
		})
	};
	if (!policy.spawnEnabled) return {
		ok: false,
		error: require_thread_bindings_policy.formatThreadBindingSpawnDisabledError({
			channel: policy.channel,
			accountId: policy.accountId,
			kind: "acp"
		})
	};
	const capabilities = require_session_binding_service.getSessionBindingService().getCapabilities({
		channel: policy.channel,
		accountId: policy.accountId
	});
	if (!capabilities.adapterAvailable) return {
		ok: false,
		error: `Thread bindings are unavailable for ${policy.channel}.`
	};
	const placementToUse = require_conversation_binding_context.resolveChannelDefaultBindingPlacement(policy.channel) ?? resolvePlacementWithoutChannelPlugin({ capabilities });
	if (!capabilities.bindSupported || !capabilities.placements.includes(placementToUse)) return {
		ok: false,
		error: `Thread bindings do not support ${placementToUse} placement for ${policy.channel}.`
	};
	const conversationRef = resolveConversationRefForThreadBinding({
		cfg: params.cfg,
		channel: policy.channel,
		accountId: policy.accountId,
		to: params.to,
		threadId: params.threadId,
		groupId: params.groupId
	});
	if (!conversationRef?.conversationId) return {
		ok: false,
		error: `Could not resolve a ${policy.channel} conversation for ACP thread spawn.`
	};
	return {
		ok: true,
		binding: {
			channel: policy.channel,
			accountId: policy.accountId,
			placement: placementToUse,
			conversationId: conversationRef.conversationId,
			...conversationRef.parentConversationId ? { parentConversationId: conversationRef.parentConversationId } : {}
		}
	};
}
function resolveAcpSpawnRequesterState(params) {
	const bindingService = require_session_binding_service.getSessionBindingService();
	const requesterParsedSession = require_session_key.parseAgentSessionKey(params.parentSessionKey);
	const isSubagentSession = Boolean(requesterParsedSession) && require_session_key.isSubagentSessionKey(params.parentSessionKey);
	const hasActiveSubagentBinding = isSubagentSession && params.parentSessionKey ? bindingService.listBySession(params.parentSessionKey).some((record) => record.targetKind === "subagent" && record.status !== "ended") : false;
	const hasThreadContext = typeof params.ctx.agentThreadId === "string" ? Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.ctx.agentThreadId)) : params.ctx.agentThreadId != null;
	return {
		parentSessionKey: params.parentSessionKey,
		isSubagentSession,
		hasActiveSubagentBinding,
		hasThreadContext,
		heartbeatEnabled: isHeartbeatEnabledForSessionAgent({
			cfg: params.cfg,
			sessionKey: params.parentSessionKey
		}),
		heartbeatRelayRouteUsable: params.parentSessionKey && params.requesterAgentId ? hasSessionLocalHeartbeatRelayRoute({
			cfg: params.cfg,
			parentSessionKey: params.parentSessionKey,
			requesterAgentId: params.requesterAgentId
		}) : false,
		origin: require_subagent_spawn_plan.resolveRequesterOriginForChild({
			cfg: params.cfg,
			targetAgentId: params.targetAgentId,
			requesterAgentId: params.requesterAgentId,
			requesterChannel: params.ctx.agentChannel,
			requesterAccountId: params.ctx.agentAccountId,
			requesterTo: params.ctx.agentTo,
			requesterThreadId: params.ctx.agentThreadId,
			requesterGroupSpace: params.ctx.agentGroupSpace,
			requesterMemberRoleIds: params.ctx.agentMemberRoleIds
		})
	};
}
function resolveAcpSubagentEnvelopeState(params) {
	const requesterSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSessionKey);
	if (!requesterSessionKey) return {};
	if (!require_subagent_capabilities.isSubagentEnvelopeSession(requesterSessionKey, {
		cfg: params.cfg,
		store: params.subagentStore
	})) return {};
	const callerDepth = require_subagent_capabilities.getSubagentDepthFromSessionStore(requesterSessionKey, { cfg: params.cfg });
	const maxSpawnDepth = params.cfg.agents?.defaults?.subagents?.maxSpawnDepth ?? 1;
	if (callerDepth >= maxSpawnDepth) return { error: `sessions_spawn is not allowed at this depth (current depth: ${callerDepth}, max: ${maxSpawnDepth})` };
	const maxChildren = params.cfg.agents?.defaults?.subagents?.maxChildrenPerAgent ?? 5;
	const activeChildren = require_subagent_registry.countActiveRunsForSession(requesterSessionKey) + countUntrackedActiveAcpRunsForOwner(requesterSessionKey);
	if (activeChildren >= maxChildren) return { error: `sessions_spawn has reached max active children for this session (${activeChildren}/${maxChildren})` };
	if ((require_agent_scope_config.resolveAgentConfig(params.cfg, params.requesterAgentId)?.subagents?.requireAgentId ?? params.cfg.agents?.defaults?.subagents?.requireAgentId ?? false) && !params.requestedAgentId?.trim()) return { error: "sessions_spawn requires explicit agentId when requireAgentId is configured. Use agents_list to see allowed agent ids." };
	const targetPolicy = require_subagent_spawn_plan.resolveSubagentTargetPolicy({
		requesterAgentId: params.requesterAgentId,
		targetAgentId: params.targetAgentId,
		requestedAgentId: params.requestedAgentId,
		allowAgents: require_agent_scope_config.resolveAgentConfig(params.cfg, params.requesterAgentId)?.subagents?.allowAgents ?? params.cfg.agents?.defaults?.subagents?.allowAgents,
		configuredAgentIds: resolveConfiguredAcpSubagentTargetIds(params.cfg)
	});
	if (!targetPolicy.ok) return { error: targetPolicy.error };
	const childCapabilities = require_subagent_capabilities.resolveSubagentCapabilities({
		depth: callerDepth + 1,
		maxSpawnDepth
	});
	return { childSessionPatch: {
		spawnDepth: childCapabilities.depth,
		subagentRole: childCapabilities.role === "main" ? null : childCapabilities.role,
		subagentControlScope: childCapabilities.controlScope
	} };
}
function resolveAcpSpawnStreamPlan(params) {
	const implicitStreamToParent = !params.streamToParentRequested && params.spawnMode === "run" && !params.requestThreadBinding && params.requester.isSubagentSession && !params.requester.hasActiveSubagentBinding && !params.requester.hasThreadContext && params.requester.heartbeatEnabled && params.requester.heartbeatRelayRouteUsable;
	return {
		implicitStreamToParent,
		effectiveStreamToParent: params.streamToParentRequested || implicitStreamToParent
	};
}
function sessionEntryMatchesAcpResumeSessionId(acp, resumeSessionId) {
	const identity = acp?.identity;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(identity?.agentSessionId) === resumeSessionId || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(identity?.acpxSessionId) === resumeSessionId;
}
function sessionEntryIsOwnedByRequester(params) {
	return params.sessionKey === params.requesterSessionKey || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry?.spawnedBy) === params.requesterSessionKey || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry?.parentSessionKey) === params.requesterSessionKey;
}
function validateAcpResumeSessionOwnership(params) {
	const resumeSessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.resumeSessionId);
	if (!resumeSessionId) return { ok: true };
	const requesterSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSessionKey);
	if (!requesterSessionKey) return {
		ok: false,
		error: "sessions_spawn resumeSessionId requires an active requester session context."
	};
	const storePath = require_paths.resolveStorePath(params.cfg.session?.store, { agentId: params.targetAgentId });
	for (const { sessionKey, entry } of require_session_accessor.listSessionEntries({
		storePath,
		clone: false
	})) {
		if (!sessionEntryMatchesAcpResumeSessionId(require_session_meta.readAcpSessionMeta({
			sessionKey,
			cfg: params.cfg
		}), resumeSessionId)) continue;
		if (sessionEntryIsOwnedByRequester({
			sessionKey,
			entry,
			requesterSessionKey
		})) return { ok: true };
		break;
	}
	return {
		ok: false,
		error: "sessions_spawn resumeSessionId is only allowed for ACP sessions previously recorded for this requester. Omit resumeSessionId to start a fresh ACP session."
	};
}
function resolveAcpRuntimeTimeoutSeconds(runTimeoutSeconds) {
	if (!runTimeoutSeconds) return;
	return Math.min(runTimeoutSeconds, ACP_RUNTIME_TIMEOUT_MAX_SECONDS);
}
function resolveAcpSpawnRuntimeOptions(params) {
	const policyAgentId = params.configAgentId ?? params.targetAgentId;
	const model = require_model_selection.resolveConfiguredSubagentSpawnModelSelection({
		cfg: params.cfg,
		agentId: policyAgentId,
		modelOverride: params.model
	});
	const targetAgentConfig = require_agent_scope_config.resolveAgentConfig(params.cfg, policyAgentId);
	const thinkingPlan = require_subagent_spawn_plan.resolveSubagentThinkingOverride({
		cfg: params.cfg,
		targetAgentConfig,
		thinkingOverrideRaw: params.thinking
	});
	if (thinkingPlan.status === "error") {
		const { provider, model: modelId } = require_subagent_spawn_plan.splitModelRef(model);
		return {
			ok: false,
			error: `Invalid thinking level "${thinkingPlan.thinkingCandidateRaw}". Use one of: ${require_thinking.formatThinkingLevels(provider, modelId)}.`
		};
	}
	let thinking = thinkingPlan.thinkingOverride;
	if (!thinking && model) {
		const { provider, model: modelId } = require_subagent_spawn_plan.splitModelRef(model);
		if (provider && modelId) thinking = require_model_thinking_default.resolveThinkingDefault({
			cfg: params.cfg,
			provider,
			model: modelId
		});
	}
	const timeoutSeconds = resolveAcpRuntimeTimeoutSeconds(params.runTimeoutSeconds);
	return {
		ok: true,
		runtimeOptions: model || thinking || timeoutSeconds ? {
			...model ? { model } : {},
			...thinking ? { thinking } : {},
			...timeoutSeconds ? { timeoutSeconds } : {}
		} : void 0
	};
}
async function initializeAcpSpawnRuntime(params) {
	const storePath = require_paths.resolveStorePath(params.cfg.session?.store, { agentId: params.targetAgentId });
	let sessionEntry = require_session_accessor.loadSessionEntry({
		storePath,
		sessionKey: params.sessionKey,
		clone: false
	});
	const sessionId = sessionEntry?.sessionId;
	if (sessionId) sessionEntry = await persistAcpSpawnSessionFileBestEffort({
		sessionId,
		sessionKey: params.sessionKey,
		storePath,
		sessionEntry,
		agentId: params.targetAgentId,
		stage: "spawn"
	});
	const initialized = await require_manager.getAcpSessionManager().initializeSession({
		cfg: params.cfg,
		sessionKey: params.sessionKey,
		agent: params.targetAgentId,
		mode: params.runtimeMode,
		resumeSessionId: params.resumeSessionId,
		runtimeOptions: params.runtimeOptions,
		cwd: params.cwd,
		backendId: params.cfg.acp?.backend
	});
	return {
		initialized,
		runtimeCloseHandle: {
			runtime: initialized.runtime,
			handle: initialized.handle
		},
		sessionId,
		sessionEntry,
		storePath
	};
}
async function bindPreparedAcpThread(params) {
	const binding = await require_session_binding_service.getSessionBindingService().bind({
		targetSessionKey: params.sessionKey,
		targetKind: "session",
		conversation: {
			channel: params.preparedBinding.channel,
			accountId: params.preparedBinding.accountId,
			conversationId: params.preparedBinding.conversationId,
			...params.preparedBinding.parentConversationId ? { parentConversationId: params.preparedBinding.parentConversationId } : {}
		},
		placement: params.preparedBinding.placement,
		metadata: {
			threadName: require_thread_bindings_messages.resolveThreadBindingThreadName({
				agentId: params.targetAgentId,
				label: params.label || params.targetAgentId
			}),
			agentId: params.targetAgentId,
			label: params.label || void 0,
			boundBy: "system",
			introText: require_thread_bindings_messages.resolveThreadBindingIntroText({
				agentId: params.targetAgentId,
				label: params.label || void 0,
				idleTimeoutMs: require_thread_bindings_policy.resolveThreadBindingIdleTimeoutMsForChannel({
					cfg: params.cfg,
					channel: params.preparedBinding.channel,
					accountId: params.preparedBinding.accountId
				}),
				maxAgeMs: require_thread_bindings_policy.resolveThreadBindingMaxAgeMsForChannel({
					cfg: params.cfg,
					channel: params.preparedBinding.channel,
					accountId: params.preparedBinding.accountId
				}),
				sessionCwd: (0, _gabrielvfonseca_acp_core_runtime_session_identifiers.resolveAcpSessionCwd)(params.initializedRuntime.initialized.meta),
				sessionDetails: (0, _gabrielvfonseca_acp_core_runtime_session_identifiers.resolveAcpThreadSessionDetailLines)({
					sessionKey: params.sessionKey,
					meta: params.initializedRuntime.initialized.meta
				})
			})
		}
	});
	if (!binding.conversation.conversationId) throw new Error(params.preparedBinding.placement === "child" ? `Failed to create and bind a ${params.preparedBinding.channel} thread for this ACP session.` : `Failed to bind the current ${params.preparedBinding.channel} conversation for this ACP session.`);
	let sessionEntry = params.initializedRuntime.sessionEntry;
	if (params.initializedRuntime.sessionId && params.preparedBinding.placement === "child") {
		const boundThreadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.conversation.conversationId);
		if (boundThreadId) sessionEntry = await persistAcpSpawnSessionFileBestEffort({
			sessionId: params.initializedRuntime.sessionId,
			sessionKey: params.sessionKey,
			storePath: params.initializedRuntime.storePath,
			sessionEntry,
			agentId: params.targetAgentId,
			threadId: boundThreadId,
			stage: "thread-bind"
		});
	}
	return {
		binding,
		sessionEntry
	};
}
function resolveAcpSpawnBootstrapDeliveryPlan(params) {
	const boundThreadIdRaw = params.binding?.conversation.conversationId;
	const boundThreadId = boundThreadIdRaw ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(boundThreadIdRaw) : void 0;
	const fallbackThreadIdRaw = params.requester.origin?.threadId;
	const fallbackThreadId = fallbackThreadIdRaw != null ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(String(fallbackThreadIdRaw)) : void 0;
	const deliveryThreadId = boundThreadId ?? fallbackThreadId;
	const requesterConversationRef = resolveConversationRefForThreadBinding({
		cfg: params.cfg,
		channel: params.requester.origin?.channel,
		accountId: params.requester.origin?.accountId,
		threadId: fallbackThreadId,
		to: params.requester.origin?.to
	});
	const requesterAccountId = resolveAcpSpawnChannelAccountId({
		cfg: params.cfg,
		channel: params.requester.origin?.channel,
		accountId: params.requester.origin?.accountId
	});
	const bindingMatchesRequesterConversation = Boolean(params.requester.origin?.channel && params.binding?.conversation.channel === params.requester.origin.channel && params.binding?.conversation.accountId === requesterAccountId && requesterConversationRef?.conversationId && params.binding?.conversation.conversationId === requesterConversationRef.conversationId && (params.binding?.conversation.parentConversationId ?? void 0) === (requesterConversationRef.parentConversationId ?? void 0));
	const boundDeliveryTarget = require_route_projection.routeToDeliveryFields(require_route_projection.routeFromBindingRecord(params.binding));
	const inferredDeliveryTo = (bindingMatchesRequesterConversation ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requester.origin?.to) : void 0) ?? boundDeliveryTarget.to ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requester.origin?.to) ?? require_route_projection.formatConversationTarget({
		channel: params.requester.origin?.channel,
		conversationId: deliveryThreadId
	});
	const resolvedDeliveryThreadId = bindingMatchesRequesterConversation ? fallbackThreadId : boundDeliveryTarget.threadId ?? deliveryThreadId;
	const useInlineDelivery = Boolean(params.requester.origin?.channel && inferredDeliveryTo) && !params.effectiveStreamToParent && params.spawnMode === "session";
	return {
		useInlineDelivery,
		channel: useInlineDelivery ? params.requester.origin?.channel : void 0,
		accountId: useInlineDelivery ? requesterAccountId : void 0,
		to: useInlineDelivery ? inferredDeliveryTo : void 0,
		threadId: useInlineDelivery && resolvedDeliveryThreadId != null ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(String(resolvedDeliveryThreadId)) : void 0
	};
}
async function spawnAcpDirect(params, ctx) {
	const cfg = require_io.getRuntimeConfig();
	const runTimeoutSeconds = require_subagent_spawn_plan.resolveConfiguredSubagentRunTimeoutSeconds({
		cfg,
		runTimeoutSeconds: params.runTimeoutSeconds
	});
	const requesterInternalKey = resolveRequesterInternalSessionKey({
		cfg,
		requesterSessionKey: ctx.agentSessionKey
	});
	const requesterAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(ctx.requesterAgentIdOverride ?? require_session_key.parseAgentSessionKey(requesterInternalKey)?.agentId);
	if (!require_policy.isAcpEnabledByPolicy(cfg)) return createAcpSpawnFailure({
		status: "forbidden",
		errorCode: "acp_disabled",
		error: "ACP is disabled by policy (`acp.enabled=false`)."
	});
	const streamToParentRequested = params.streamTo === "parent";
	const parentSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.agentSessionKey);
	if (streamToParentRequested && !parentSessionKey) return createAcpSpawnFailure({
		status: "error",
		errorCode: "requester_session_required",
		error: "sessions_spawn streamTo=\"parent\" requires an active requester session context."
	});
	const requestThreadBinding = params.thread === true;
	const runtimePolicyError = resolveAcpSpawnRuntimePolicyError({
		cfg,
		requesterSessionKey: ctx.agentSessionKey,
		requesterSandboxed: ctx.sandboxed,
		sandbox: params.sandbox
	});
	if (runtimePolicyError) return createAcpSpawnFailure({
		status: "forbidden",
		errorCode: "runtime_policy",
		error: runtimePolicyError
	});
	const acpUnsupportedInheritedTool = require_subagent_capabilities.findAcpUnsupportedInheritedToolDeny(ctx.inheritedToolDenylist);
	if (acpUnsupportedInheritedTool) return createAcpSpawnFailure({
		status: "forbidden",
		errorCode: "runtime_policy",
		error: require_subagent_capabilities.formatAcpInheritedToolDenyError(acpUnsupportedInheritedTool)
	});
	const acpUnsupportedInheritedAllow = require_subagent_capabilities.findAcpUnsupportedInheritedToolAllow(ctx.inheritedToolAllowlist);
	if (acpUnsupportedInheritedAllow) return createAcpSpawnFailure({
		status: "forbidden",
		errorCode: "runtime_policy",
		error: require_subagent_capabilities.formatAcpInheritedToolAllowError(acpUnsupportedInheritedAllow)
	});
	const spawnMode = resolveSpawnMode({
		requestedMode: params.mode,
		threadRequested: requestThreadBinding
	});
	if (spawnMode === "session" && !requestThreadBinding) return createAcpSpawnFailure({
		status: "error",
		errorCode: "thread_required",
		error: "sessions_spawn(runtime=\"acp\", mode=\"session\") requires thread=true so the ACP session can stay bound to a channel thread. Retry with { mode: \"session\", thread: true } on a channel that exposes threads (e.g. Discord, Slack, Telegram topics), or use mode=\"run\" for one-shot work."
	});
	const targetAgentResult = resolveTargetAcpAgentId({
		requestedAgentId: params.agentId,
		cfg
	});
	if (!targetAgentResult.ok) return createAcpSpawnFailure({
		status: "error",
		errorCode: params.agentId && require_session_key.normalizeOptionalAgentId(params.agentId) ? "runtime_agent_mismatch" : "target_agent_required",
		error: targetAgentResult.error
	});
	const targetAgentId = targetAgentResult.agentId;
	const agentPolicyError = require_policy.resolveAcpAgentPolicyError(cfg, targetAgentId);
	if (agentPolicyError) return createAcpSpawnFailure({
		status: "forbidden",
		errorCode: "agent_forbidden",
		error: agentPolicyError.message
	});
	const subagentStore = require_subagent_capabilities.resolveSubagentCapabilityStore(parentSessionKey, { cfg });
	const requesterState = resolveAcpSpawnRequesterState({
		cfg,
		parentSessionKey,
		requesterAgentId,
		targetAgentId,
		ctx,
		subagentStore
	});
	const subagentEnvelopeState = resolveAcpSubagentEnvelopeState({
		cfg,
		requesterSessionKey: requesterInternalKey,
		requesterAgentId,
		targetAgentId,
		requestedAgentId: params.agentId,
		subagentStore
	});
	if (subagentEnvelopeState.error) return createAcpSpawnFailure({
		status: "forbidden",
		errorCode: "subagent_policy",
		error: subagentEnvelopeState.error
	});
	const resumeAuthorization = validateAcpResumeSessionOwnership({
		cfg,
		targetAgentId,
		requesterSessionKey: requesterInternalKey,
		resumeSessionId: params.resumeSessionId
	});
	if (!resumeAuthorization.ok) return createAcpSpawnFailure({
		status: "forbidden",
		errorCode: "resume_forbidden",
		error: resumeAuthorization.error
	});
	const runtimeOptionsResult = resolveAcpSpawnRuntimeOptions({
		cfg,
		targetAgentId,
		configAgentId: targetAgentResult.configAgentId,
		model: params.model,
		thinking: params.thinking,
		runTimeoutSeconds
	});
	if (!runtimeOptionsResult.ok) return createAcpSpawnFailure({
		status: "error",
		errorCode: "spawn_failed",
		error: runtimeOptionsResult.error
	});
	const { effectiveStreamToParent } = resolveAcpSpawnStreamPlan({
		spawnMode,
		requestThreadBinding,
		streamToParentRequested,
		requester: requesterState
	});
	const sessionKey = `agent:${targetAgentId}:acp:${node_crypto.default.randomUUID()}`;
	const runtimeMode = resolveAcpSessionMode(spawnMode);
	const resolvedCwd = require_subagent_spawn_plan.resolveSpawnedWorkspaceInheritance({
		config: cfg,
		targetAgentId,
		requesterSessionKey: ctx.agentSessionKey,
		explicitWorkspaceDir: params.cwd
	});
	let runtimeCwd;
	try {
		runtimeCwd = await resolveRuntimeCwdForAcpSpawn({
			resolvedCwd,
			explicitCwd: params.cwd
		});
	} catch (error) {
		return createAcpSpawnFailure({
			status: "error",
			errorCode: "cwd_resolution_failed",
			error: summarizeError(error)
		});
	}
	let preparedBinding = null;
	if (requestThreadBinding) {
		const prepared = prepareAcpThreadBinding({
			cfg,
			channel: requesterState.origin?.channel,
			accountId: requesterState.origin?.accountId,
			to: requesterState.origin?.to,
			threadId: requesterState.origin?.threadId,
			groupId: ctx.agentGroupId
		});
		if (!prepared.ok) return createAcpSpawnFailure({
			status: "error",
			errorCode: "thread_binding_invalid",
			error: prepared.error
		});
		preparedBinding = prepared.binding;
	}
	let binding = null;
	let sessionCreated = false;
	let initializedRuntime;
	try {
		await require_call.callGateway({
			method: "sessions.patch",
			params: {
				key: sessionKey,
				spawnedBy: requesterInternalKey,
				...subagentEnvelopeState.childSessionPatch,
				...require_subagent_capabilities.inheritedToolAllowPatch(ctx.inheritedToolAllowlist),
				...require_subagent_capabilities.inheritedToolDenyPatch(ctx.inheritedToolDenylist),
				...params.label ? { label: params.label } : {}
			},
			timeoutMs: 1e4
		});
		sessionCreated = true;
		const initializedSession = await initializeAcpSpawnRuntime({
			cfg,
			sessionKey,
			targetAgentId,
			runtimeMode,
			resumeSessionId: params.resumeSessionId,
			runtimeOptions: runtimeOptionsResult.runtimeOptions,
			cwd: runtimeCwd
		});
		initializedRuntime = initializedSession.runtimeCloseHandle;
		if (preparedBinding) ({binding} = await bindPreparedAcpThread({
			cfg,
			sessionKey,
			targetAgentId,
			label: params.label,
			preparedBinding,
			initializedRuntime: initializedSession
		}));
	} catch (err) {
		await cleanupFailedAcpSpawn({
			cfg,
			sessionKey,
			shouldDeleteSession: sessionCreated,
			deleteTranscript: true,
			runtimeCloseHandle: initializedRuntime
		});
		return createAcpSpawnFailure({
			status: "error",
			errorCode: require_session_binding_service.isSessionBindingError(err) ? "thread_binding_invalid" : "spawn_failed",
			error: require_session_binding_service.isSessionBindingError(err) ? err.message : summarizeError(err)
		});
	}
	const deliveryPlan = resolveAcpSpawnBootstrapDeliveryPlan({
		cfg,
		spawnMode,
		requestThreadBinding,
		effectiveStreamToParent,
		requester: requesterState,
		binding
	});
	const childIdem = node_crypto.default.randomUUID();
	let childRunId = childIdem;
	require_session_state_events.recordSubagentSpawned({
		childSessionKey: sessionKey,
		childRunId: childIdem,
		requesterSessionKey: requesterInternalKey,
		agentId: targetAgentId
	});
	const streamLogPath = effectiveStreamToParent && parentSessionKey ? resolveAcpSpawnStreamLogPath({ childSessionKey: sessionKey }) : void 0;
	const parentAgentId = parentSessionKey ? require_session_key.resolveAgentIdFromSessionKey(parentSessionKey) : void 0;
	const parentDeliveryCtx = effectiveStreamToParent && parentSessionKey ? require_delivery_context_shared.deliveryContextFromSession(require_session_accessor.loadSessionEntry({
		sessionKey: parentSessionKey,
		...parentAgentId ? { agentId: parentAgentId } : {},
		clone: false
	})) : void 0;
	let parentRelay;
	const parentEventRouting = parentSessionKey ? require_event_session_routing.resolveEventSessionRoutingPolicy({
		cfg,
		sessionKey: parentSessionKey
	}) : void 0;
	if (effectiveStreamToParent && parentSessionKey) parentRelay = startAcpSpawnParentStreamRelay({
		runId: childIdem,
		parentSessionKey,
		childSessionKey: sessionKey,
		agentId: targetAgentId,
		mainKey: cfg.session?.mainKey,
		sessionScope: cfg.session?.scope,
		eventRouting: parentEventRouting,
		logPath: streamLogPath,
		deliveryContext: parentDeliveryCtx,
		emitStartNotice: false,
		cfg
	});
	const gatewayAttachments = toGatewayImageAttachments(params.attachments);
	try {
		const responseRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((await require_call.callGateway({
			method: "agent",
			params: {
				message: params.task,
				sessionKey,
				channel: deliveryPlan.channel,
				to: deliveryPlan.to,
				accountId: deliveryPlan.accountId,
				threadId: deliveryPlan.threadId,
				idempotencyKey: childIdem,
				deliver: deliveryPlan.useInlineDelivery,
				lane: require_lanes.AGENT_LANE_SUBAGENT,
				acpTurnSource: "manual_spawn",
				timeout: runTimeoutSeconds,
				label: params.label || void 0,
				...gatewayAttachments ? { attachments: gatewayAttachments } : {}
			},
			timeoutMs: 1e4
		}))?.runId);
		if (responseRunId) childRunId = responseRunId;
	} catch (err) {
		parentRelay?.dispose();
		await cleanupFailedAcpSpawn({
			cfg,
			sessionKey,
			shouldDeleteSession: true,
			deleteTranscript: true,
			runtimeCloseHandle: initializedRuntime
		});
		return createAcpSpawnFailure({
			status: "error",
			errorCode: "dispatch_failed",
			error: summarizeError(err),
			childSessionKey: sessionKey
		});
	}
	if (effectiveStreamToParent && parentSessionKey) {
		if (parentRelay && childRunId !== childIdem) {
			parentRelay.dispose();
			parentRelay = startAcpSpawnParentStreamRelay({
				runId: childRunId,
				parentSessionKey,
				childSessionKey: sessionKey,
				agentId: targetAgentId,
				mainKey: cfg.session?.mainKey,
				sessionScope: cfg.session?.scope,
				eventRouting: parentEventRouting,
				logPath: streamLogPath,
				deliveryContext: parentDeliveryCtx,
				emitStartNotice: false,
				cfg
			});
		}
		parentRelay?.notifyStarted();
		try {
			if (!require_task_completion_contract.createRunningTaskRun({
				runtime: "acp",
				sourceId: childRunId,
				ownerKey: requesterInternalKey,
				scopeKind: "session",
				requesterOrigin: requesterState.origin,
				childSessionKey: sessionKey,
				agentId: targetAgentId,
				requesterAgentId,
				runId: childRunId,
				label: params.label,
				task: params.task,
				preferMetadata: true,
				deliveryStatus: requesterInternalKey ? "pending" : "parent_missing",
				startedAt: Date.now()
			})) log.warn("Failed to persist background task for ACP spawn", {
				sessionKey,
				runId: childRunId
			});
		} catch (error) {
			log.warn("Failed to create background task for ACP spawn", {
				sessionKey,
				runId: childRunId,
				error
			});
		}
		return {
			status: "accepted",
			childSessionKey: sessionKey,
			runId: childRunId,
			mode: spawnMode,
			runTimeoutSeconds,
			...streamLogPath ? { streamLogPath } : {},
			note: spawnMode === "session" ? ACP_SPAWN_SESSION_ACCEPTED_NOTE : ACP_SPAWN_ACCEPTED_NOTE
		};
	}
	try {
		if (!require_task_completion_contract.createRunningTaskRun({
			runtime: "acp",
			sourceId: childRunId,
			ownerKey: requesterInternalKey,
			scopeKind: "session",
			requesterOrigin: requesterState.origin,
			childSessionKey: sessionKey,
			agentId: targetAgentId,
			requesterAgentId,
			runId: childRunId,
			label: params.label,
			task: params.task,
			preferMetadata: true,
			deliveryStatus: requesterInternalKey ? "pending" : "parent_missing",
			startedAt: Date.now()
		})) log.warn("Failed to persist background task for ACP spawn", {
			sessionKey,
			runId: childRunId
		});
	} catch (error) {
		log.warn("Failed to create background task for ACP spawn", {
			sessionKey,
			runId: childRunId,
			error
		});
	}
	return {
		status: "accepted",
		childSessionKey: sessionKey,
		runId: childRunId,
		mode: spawnMode,
		runTimeoutSeconds,
		...deliveryPlan.useInlineDelivery ? { inlineDelivery: true } : {},
		note: spawnMode === "session" ? ACP_SPAWN_SESSION_ACCEPTED_NOTE : ACP_SPAWN_ACCEPTED_NOTE
	};
}
//#endregion
exports.ACP_SPAWN_MODES = ACP_SPAWN_MODES;
exports.ACP_SPAWN_STREAM_TARGETS = ACP_SPAWN_STREAM_TARGETS;
exports.cleanupFailedAcpSpawn = cleanupFailedAcpSpawn;
exports.isSpawnAcpAcceptedResult = isSpawnAcpAcceptedResult;
exports.resolveAcpSpawnRuntimePolicyError = resolveAcpSpawnRuntimePolicyError;
exports.resolveRuntimeCwdForAcpSpawn = resolveRuntimeCwdForAcpSpawn;
exports.spawnAcpDirect = spawnAcpDirect;
