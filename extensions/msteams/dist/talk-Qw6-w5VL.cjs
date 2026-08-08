require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_string_readers = require("./string-readers-DjRuUveR.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_resolve_configured_secret_input_string = require("./resolve-configured-secret-input-string-BR1lk9x1.cjs");
const require_worker_provider_registry = require("./worker-provider-registry-CsuKJchR.cjs");
const require_voice_models = require("./voice-models-inHjkMDc.cjs");
const require_capability_provider_runtime = require("./capability-provider-runtime-BgXXVc3C.cjs");
const require_diagnostic_run_activity = require("./diagnostic-run-activity-DjuaoKPQ.cjs");
const require_provider_registry = require("./provider-registry-CMno4lb9.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_run_state = require("./run-state-lPLPf1ME.cjs");
const require_runs = require("./runs-BxiWZCUY.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_tts = require("./tts-KT3_E9ke.cjs");
const require_redact_snapshot = require("./redact-snapshot-CmW094US.cjs");
const require_chat_abort = require("./chat-abort-CWaOZDr9.cjs");
const require_chat = require("./chat-ByfwVz6X.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_sessions_resolve = require("./sessions-resolve-DYieqTTn.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_speech_mime = require("./speech-mime-D-kN067K.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/plugin-sdk/provider-selection-runtime.ts
/** Merge canonical provider config with selected-provider override config. */
function resolveProviderRawConfig(params) {
	const canonicalProviderConfig = readProviderConfig(params.providerConfigs, params.providerId);
	const selectedProviderConfig = readProviderConfig(params.providerConfigs, params.configuredProviderId);
	return {
		...canonicalProviderConfig,
		...selectedProviderConfig
	};
}
/** Resolve a configured or auto-selected provider that passes capability config checks. */
function resolveConfiguredCapabilityProvider(params) {
	const configuredProviderId = require_string_coerce.normalizeOptionalString(params.configuredProviderId);
	if (configuredProviderId) {
		const provider = params.getConfiguredProvider(configuredProviderId);
		if (!provider) return {
			ok: false,
			code: "missing-configured-provider",
			configuredProviderId
		};
		return resolveProviderCandidate({
			...params,
			configuredProviderId,
			provider
		});
	}
	const providers = [...params.listProviders()].toSorted(compareProviderAutoSelectOrder);
	if (providers.length === 0) return {
		ok: false,
		code: "no-registered-provider"
	};
	let firstUnconfigured;
	for (const provider of providers) {
		const resolution = resolveProviderCandidate({
			...params,
			provider
		});
		if (resolution.ok) return resolution;
		firstUnconfigured ??= provider;
	}
	return {
		ok: false,
		code: "provider-not-configured",
		provider: firstUnconfigured
	};
}
function compareProviderAutoSelectOrder(left, right) {
	return (left.autoSelectOrder ?? Number.MAX_SAFE_INTEGER) - (right.autoSelectOrder ?? Number.MAX_SAFE_INTEGER);
}
function readProviderConfig(providerConfigs, providerId) {
	if (!providerId) return;
	const providerConfig = providerConfigs?.[providerId];
	return providerConfig && typeof providerConfig === "object" ? providerConfig : void 0;
}
function resolveProviderCandidate(params) {
	const rawProviderConfig = resolveProviderRawConfig({
		providerId: params.provider.id,
		configuredProviderId: params.configuredProviderId,
		providerConfigs: params.providerConfigs
	});
	const providerConfig = params.resolveProviderConfig({
		provider: params.provider,
		cfg: params.cfgForResolve,
		rawConfig: rawProviderConfig
	});
	if (!params.isProviderConfigured({
		provider: params.provider,
		cfg: params.cfg,
		providerConfig
	})) return {
		ok: false,
		code: "provider-not-configured",
		configuredProviderId: params.configuredProviderId,
		provider: params.provider
	};
	return {
		ok: true,
		configuredProviderId: params.configuredProviderId,
		provider: params.provider,
		providerConfig
	};
}
//#endregion
//#region src/realtime-transcription/provider-registry.ts
function normalizeRealtimeTranscriptionProviderId(providerId) {
	return require_worker_provider_registry.normalizeCapabilityProviderId(providerId);
}
function resolveRealtimeTranscriptionProviderEntries(cfg) {
	return require_capability_provider_runtime.resolvePluginCapabilityProviders({
		key: "realtimeTranscriptionProviders",
		cfg
	});
}
function buildProviderMaps$1(cfg) {
	return require_worker_provider_registry.buildCapabilityProviderMaps(resolveRealtimeTranscriptionProviderEntries(cfg));
}
/** Lists canonical realtime transcription providers for the active config. */
function listRealtimeTranscriptionProviders(cfg) {
	return [...buildProviderMaps$1(cfg).canonical.values()];
}
/** Resolves a realtime transcription provider by id or alias. */
function getRealtimeTranscriptionProvider(providerId, cfg) {
	const normalized = normalizeRealtimeTranscriptionProviderId(providerId);
	if (!normalized) return;
	const directProvider = require_capability_provider_runtime.resolvePluginCapabilityProvider({
		key: "realtimeTranscriptionProviders",
		providerId: normalized,
		cfg
	});
	if (directProvider) return directProvider;
	return buildProviderMaps$1(cfg).aliases.get(normalized);
}
/** Canonicalizes a configured provider id while preserving unknown ids. */
function canonicalizeRealtimeTranscriptionProviderId(providerId, cfg) {
	const normalized = normalizeRealtimeTranscriptionProviderId(providerId);
	if (!normalized) return;
	return getRealtimeTranscriptionProvider(normalized, cfg)?.id ?? normalized;
}
//#endregion
//#region src/talk/provider-registry.ts
/**
* Normalizes realtime voice provider ids so direct ids and aliases compare through one registry key.
*/
function normalizeRealtimeVoiceProviderId(providerId) {
	return require_worker_provider_registry.normalizeCapabilityProviderId(providerId);
}
function resolveRealtimeVoiceProviderEntries(cfg) {
	return require_capability_provider_runtime.resolvePluginCapabilityProviders({
		key: "realtimeVoiceProviders",
		cfg
	});
}
function buildProviderMaps(cfg) {
	return require_worker_provider_registry.buildCapabilityProviderMaps(resolveRealtimeVoiceProviderEntries(cfg));
}
/**
* Lists canonical realtime voice provider plugins in registry order.
*/
function listRealtimeVoiceProviders(cfg) {
	return [...buildProviderMaps(cfg).canonical.values()];
}
/**
* Resolves a realtime voice provider by canonical id or declared alias.
*/
function getRealtimeVoiceProvider(providerId, cfg) {
	const normalized = normalizeRealtimeVoiceProviderId(providerId);
	if (!normalized) return;
	const directProvider = require_capability_provider_runtime.resolvePluginCapabilityProvider({
		key: "realtimeVoiceProviders",
		providerId: normalized,
		cfg
	});
	if (directProvider) return directProvider;
	return buildProviderMaps(cfg).aliases.get(normalized);
}
/**
* Converts a realtime voice provider id or alias into the canonical provider id when known.
*/
function canonicalizeRealtimeVoiceProviderId(providerId, cfg) {
	const normalized = normalizeRealtimeVoiceProviderId(providerId);
	if (!normalized) return;
	return getRealtimeVoiceProvider(normalized, cfg)?.id ?? normalized;
}
//#endregion
//#region src/talk/provider-resolver.ts
/** Resolve the configured realtime voice provider or auto-select the first configured one. */
function resolveConfiguredRealtimeVoiceProvider(params) {
	const cfgForResolve = params.cfgForResolve ?? params.cfg ?? {};
	const providers = params.providers ?? listRealtimeVoiceProviders(params.cfg);
	const resolution = resolveConfiguredCapabilityProvider({
		configuredProviderId: params.configuredProviderId,
		providerConfigs: params.providerConfigs,
		cfg: params.cfg,
		cfgForResolve,
		getConfiguredProvider: (providerId) => params.providers?.find((entry) => entry.id === providerId) ?? getRealtimeVoiceProvider(providerId, params.cfg),
		listProviders: () => providers,
		resolveProviderConfig: ({ provider, cfg, rawConfig }) => {
			const rawConfigWithOverrides = {
				...params.defaultModel && rawConfig.model === void 0 ? {
					...rawConfig,
					model: params.defaultModel
				} : rawConfig,
				...params.providerConfigOverrides
			};
			return provider.resolveConfig?.({
				cfg,
				rawConfig: rawConfigWithOverrides
			}) ?? rawConfigWithOverrides;
		},
		isProviderConfigured: ({ provider, cfg, providerConfig }) => provider.isConfigured({
			cfg,
			providerConfig
		})
	});
	if (!resolution.ok && resolution.code === "missing-configured-provider") throw new Error(`Realtime voice provider "${resolution.configuredProviderId}" is not registered`);
	if (!resolution.ok && resolution.code === "no-registered-provider") throw new Error(params.noRegisteredProviderMessage ?? "No realtime voice provider registered");
	if (!resolution.ok) throw new Error(`Realtime voice provider "${resolution.provider?.id}" is not configured`);
	return {
		provider: resolution.provider,
		providerConfig: resolution.providerConfig
	};
}
//#endregion
//#region src/talk/agent-consult-tool.ts
/**
* Realtime voice tool definition and helpers for delegating work to Operator.
*
* Voice providers call this function tool when a spoken request needs normal
* agent tools, memory, workspace context, or current information before reply.
*/
/** Stable provider-facing tool name for realtime voice agent delegation. */
const REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME = "operator_agent_consult";
/** Shared realtime voice function-tool descriptor projected to providers. */
const REALTIME_VOICE_AGENT_CONSULT_TOOL = {
	type: "function",
	name: REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME,
	description: "Delegate the caller's request to the configured Operator agent for normal tool-backed work, actions, context, memory, or reasoning before speaking.",
	parameters: {
		type: "object",
		properties: {
			question: {
				type: "string",
				description: "The concrete question or task the user asked."
			},
			context: {
				type: "string",
				description: "Optional relevant context or transcript summary."
			},
			responseStyle: {
				type: "string",
				description: "Optional style hint for the spoken answer."
			}
		},
		required: ["question"]
	}
};
/** Build the interim spoken instruction while the delegated agent turn runs. */
function buildRealtimeVoiceAgentConsultWorkingResponse(audienceLabel = "person") {
	return {
		status: "working",
		tool: REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME,
		message: `Tell the ${audienceLabel} briefly that you are checking, then wait for the final Operator result before answering with the actual result.`
	};
}
/** Parse provider-owned consult tool arguments into the normalized contract. */
function parseRealtimeVoiceAgentConsultArgs(args) {
	const question = readConsultStringArg(args, "question") ?? readConsultStringArg(args, "prompt") ?? readConsultStringArg(args, "query") ?? readConsultStringArg(args, "task");
	if (!question) throw new Error("question required");
	return {
		question,
		context: readConsultStringArg(args, "context"),
		responseStyle: readConsultStringArg(args, "responseStyle")
	};
}
/** Build the plain chat message used by browser/chat forwarding paths. */
function buildRealtimeVoiceAgentConsultChatMessage(args) {
	const parsed = parseRealtimeVoiceAgentConsultArgs(args);
	return [
		parsed.question,
		parsed.context ? `Context:\n${parsed.context}` : void 0,
		parsed.responseStyle ? `Spoken style:\n${parsed.responseStyle}` : void 0
	].filter(Boolean).join("\n\n");
}
function readConsultStringArg(args, key) {
	if (!args || typeof args !== "object" || Array.isArray(args)) return;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args[key]);
}
//#endregion
//#region src/talk/agent-run-control-shared.ts
/**
* Shared realtime voice controls for active Operator agent runs.
*
* This module owns the provider-facing control tool, conservative intent
* classifier, and user-visible status/queue/cancel messages used by Talk.
*/
/** Provider-facing control modes for status, steering, cancellation, and follow-up work. */
const REALTIME_VOICE_AGENT_CONTROL_MODES = [
	"status",
	"steer",
	"cancel",
	"followup"
];
/** Stable provider-facing tool name for active-run voice control. */
const REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME = "operator_agent_control";
/** Realtime function-tool descriptor projected to voice providers. */
const REALTIME_VOICE_AGENT_CONTROL_TOOL = {
	type: "function",
	name: REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME,
	description: "Control an active Operator tool-backed voice run. Use this when the caller asks in any language for status/progress, cancellation, a redirect/change to the active work, or a follow-up after the current work. Do not use this for ordinary greetings or chatter unless the caller is asking about the active work.",
	parameters: {
		type: "object",
		properties: {
			text: {
				type: "string",
				description: "The caller's exact spoken request or a concise semantic equivalent."
			},
			mode: {
				type: "string",
				enum: REALTIME_VOICE_AGENT_CONTROL_MODES,
				description: "status for progress questions, cancel for stop/abort, steer for changing the current work, followup for work to do after the current result."
			}
		},
		required: ["text", "mode"]
	}
};
/** Normalize user/config/provider supplied control modes. */
function normalizeRealtimeVoiceAgentControlMode(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	return REALTIME_VOICE_AGENT_CONTROL_MODES.includes(normalized) ? normalized : void 0;
}
const CANCEL_CONTROL_PATTERNS = [
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?(?:cancel|cancle|abort)(?:\s+(?:that|this|it|the\s+(?:check|run|task|work)))?(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?(?:never mind|nevermind|forget it|kill it|end that)(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?stop(?:\s+(?:that|this|it|the\s+(?:check|run|task|work)))?(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:can|could|would)\s+you\s+(?:please\s+)?(?:cancel|cancle|stop|abort)(?:\s+(?:that|this|it|the\s+(?:check|run|task|work)))?(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right|actually)[,\s]+)?(?:can|could|would)\s+(?:we|you)\s+(?:just\s+)?(?:cancel|cancle|stop|abort)(?:\s+(?:that|this|it|the\s+(?:check|run|task|work)))?(?:\s*[.!?])?$/,
	/\b(?:cancel|cancle|stop|abort)\s+(?:that|this|it|the\s+(?:check|run|task|work))\b/
];
const STATUS_CONTROL_PATTERNS = [
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:status|progress|update)(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:give me|what'?s|any)\s+(?:an?\s+)?update(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(where are we|what'?s happening|what (?:are you|is it) doing|what'?s it doing|how (?:is|are) (?:it|you|that|this) going|how'?s it going|are you still working|is it done|did it finish)(\b|[.!?])/
];
const FOLLOWUP_CONTROL_PATTERNS = [/^(after that|when you'?re done|when it'?s done|next|then|also|one more thing|follow up)(\b|[,.!?])/];
const STEER_CONTROL_PATTERNS = [
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?update\s+\S/,
	/^(?:actually|instead|change|switch|focus|use|try|prefer|make|do|check|look at|go with|redirect|steer|tell it to)\b/,
	/^(?:can|could|would)\s+you\s+(?:actually\s+)?(?:change|switch|focus|use|try|prefer|make|do|check|look at|go with|redirect|steer)\b/,
	/\b(?:instead|not that|rather than|change that|switch to|focus on|use the|try the|go with|tell it to)\b/
];
const STOP_REDIRECT_CONTROL_PATTERNS = [
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?stop\s+(?:using|doing|checking|looking at|focusing on|trying)\b/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:can|could|would)\s+(?:you|we)\s+(?:please\s+)?stop\s+(?:using|doing|checking|looking at|focusing on|trying)\b/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?stop\s+(?:that|this|it|the\s+(?:check|run|task|work))\s+from\b/
];
function matchesAnyPattern(text, patterns) {
	return patterns.some((pattern) => pattern.test(text));
}
function hasNegatedCancelIntent(text) {
	return /\b(?:don'?t|do\s+not|not|never)\s+(?:please\s+)?(?:cancel|cancle|stop|abort|kill|end)\b/.test(text) || /\bstop\s+(?:it|that|this)\s+from\b/.test(text);
}
/** Classify raw spoken control text with conservative auto-control gating. */
function resolveRealtimeVoiceAgentControlIntent(params) {
	const explicitMode = normalizeRealtimeVoiceAgentControlMode(params.mode);
	if (explicitMode) return {
		mode: explicitMode,
		confidence: "high",
		reason: "explicit_mode",
		shouldAutoControl: true
	};
	const normalized = params.text.trim().toLowerCase();
	if (matchesAnyPattern(normalized, STOP_REDIRECT_CONTROL_PATTERNS)) return {
		mode: "steer",
		confidence: "medium",
		reason: "steer_command",
		shouldAutoControl: true
	};
	if (!hasNegatedCancelIntent(normalized) && matchesAnyPattern(normalized, CANCEL_CONTROL_PATTERNS)) return {
		mode: "cancel",
		confidence: "high",
		reason: "cancel_safety",
		shouldAutoControl: true
	};
	if (matchesAnyPattern(normalized, STATUS_CONTROL_PATTERNS)) return {
		mode: "status",
		confidence: "high",
		reason: "status_query",
		shouldAutoControl: true
	};
	if (matchesAnyPattern(normalized, FOLLOWUP_CONTROL_PATTERNS)) return {
		mode: "followup",
		confidence: "high",
		reason: "followup_marker",
		shouldAutoControl: true
	};
	if (matchesAnyPattern(normalized, STEER_CONTROL_PATTERNS)) return {
		mode: "steer",
		confidence: "medium",
		reason: "steer_command",
		shouldAutoControl: true
	};
	return {
		mode: "status",
		confidence: "low",
		reason: "safe_default",
		shouldAutoControl: false
	};
}
/** Whether a spoken utterance is safe to route automatically to the control tool. */
function shouldAutoControlRealtimeVoiceAgentText(text) {
	return resolveRealtimeVoiceAgentControlIntent({ text }).shouldAutoControl;
}
/** Build the system-style instruction that forces exact spoken status output. */
function buildRealtimeVoiceAgentControlSpeechMessage(text) {
	return [
		"Internal Operator voice control result.",
		"Do not call operator_agent_consult or any other tool for this message.",
		"Speak this exact Operator status to the voice call, without adding, removing, or rephrasing words.",
		`Status: ${JSON.stringify(text)}`
	].join("\n");
}
/** Provider result payload used when the control tool cancels active work. */
function buildRealtimeVoiceAgentCancelProviderResult(message = "Cancelled the active Operator run.") {
	return {
		status: "cancelled",
		message
	};
}
/** Wrap follow-up text so an active run treats it as deferred context. */
function buildRealtimeVoiceAgentFollowupSteeringText(text) {
	return [
		"Spoken follow-up for the current voice call.",
		"If you are mid-task, incorporate this after the current step or result unless it directly changes the current task.",
		"",
		text
	].join("\n");
}
/** User-facing message for queue failures while steering or adding follow-up work. */
function formatRealtimeVoiceAgentQueueRejection(mode, reason) {
	if (reason === "compacting") return "Operator is compacting the active run and cannot accept voice steering yet.";
	if (reason === "not_streaming") return "Operator has an active run, but it is not currently accepting steering.";
	return mode === "followup" ? "Operator could not queue that follow-up." : "Operator could not steer the active run.";
}
function isRealtimeVoiceAgentControlToolEvent(event) {
	if (!event.type.startsWith("tool.")) return false;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((event.payload && typeof event.payload === "object" ? event.payload : {}).name) === REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME;
}
/** Format a concise spoken status for the active or most recent voice run. */
function formatRealtimeVoiceAgentStatus(params) {
	const recent = (params.recentEvents ?? []).toReversed();
	if (!params.active) return recent.find((event) => event.type === "turn.ended") ? "Operator finished the last voice request." : "I'm not working on an active request right now.";
	const toolEvent = recent.find((event) => event.type.startsWith("tool.") && !isRealtimeVoiceAgentControlToolEvent(event));
	if (toolEvent) {
		const payload = toolEvent.payload && typeof toolEvent.payload === "object" ? toolEvent.payload : {};
		const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.name);
		const phase = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.phase);
		if (toolEvent.type === "tool.call") return name ? `Operator is starting ${name}.` : "Operator is starting a tool.";
		if (toolEvent.type === "tool.result") return name ? `Operator finished ${name} and is continuing.` : "Operator finished a tool and is continuing.";
		if (toolEvent.type === "tool.progress") return name ? `Operator is working in ${name}${phase ? ` (${phase})` : ""}.` : "Operator is still working.";
	}
	if (params.activity?.activeToolName) return `Operator is running ${params.activity.activeToolName}.`;
	if (params.activity?.activeWorkKind === "model_call") return "Operator is waiting on the model.";
	if (params.activity?.activeWorkKind === "embedded_run" || params.activity?.hasActiveEmbeddedRun) return "Operator is working on the current voice request.";
	return "Operator is working on the current voice request.";
}
//#endregion
//#region src/talk/agent-run-control.ts
const defaultDeps = {
	abortEmbeddedAgentRun: require_runs.abortEmbeddedAgentRun,
	getDiagnosticSessionActivitySnapshot: require_diagnostic_run_activity.getDiagnosticSessionActivitySnapshot,
	queueEmbeddedAgentMessageWithOutcomeAsync: require_runs.queueEmbeddedAgentMessageWithOutcomeAsync,
	resolveActiveEmbeddedRunSessionId: require_run_state.resolveActiveEmbeddedRunSessionId
};
/** Apply a spoken status, cancel, steer, or follow-up request to an active run. */
async function controlRealtimeVoiceAgentRun(params, deps = defaultDeps) {
	const sessionKey = params.sessionKey.trim();
	const text = params.text.trim();
	const mode = resolveRealtimeVoiceAgentControlIntent({
		text,
		mode: params.mode
	}).mode;
	const sessionId = deps.resolveActiveEmbeddedRunSessionId(sessionKey);
	const activity = deps.getDiagnosticSessionActivitySnapshot({
		sessionId,
		sessionKey
	});
	const active = Boolean(sessionId || activity.activeWorkKind || activity.hasActiveEmbeddedRun);
	if (mode === "status") return {
		ok: true,
		mode,
		sessionKey,
		...sessionId ? { sessionId } : {},
		active,
		message: formatRealtimeVoiceAgentStatus({
			active,
			recentEvents: params.recentEvents,
			activity
		}),
		speak: true,
		show: true,
		suppress: false
	};
	if (mode === "cancel") {
		if (!sessionId) return {
			ok: false,
			mode,
			sessionKey,
			active: false,
			aborted: false,
			reason: "no_active_run",
			message: "There is no active Operator run to cancel.",
			speak: true,
			show: true,
			suppress: false
		};
		const aborted = deps.abortEmbeddedAgentRun(sessionId);
		const message = aborted ? "Cancelled the active Operator run." : "Operator could not cancel the active run.";
		return {
			ok: aborted,
			mode,
			sessionKey,
			sessionId,
			active: true,
			aborted,
			...aborted ? {} : { reason: "abort_rejected" },
			message,
			speak: true,
			show: true,
			suppress: false,
			...aborted ? { providerResult: buildRealtimeVoiceAgentCancelProviderResult(message) } : {}
		};
	}
	if (!sessionId) return {
		ok: false,
		mode,
		sessionKey,
		active: false,
		queued: false,
		reason: "no_active_run",
		message: "There is no active Operator run to steer.",
		speak: true,
		show: true,
		suppress: false
	};
	const steerText = mode === "followup" ? buildRealtimeVoiceAgentFollowupSteeringText(text) : text;
	const outcome = await deps.queueEmbeddedAgentMessageWithOutcomeAsync(sessionId, steerText, {
		steeringMode: "all",
		debounceMs: 0,
		taskSuggestionDeliveryMode: void 0
	});
	if (!outcome.queued) return {
		ok: false,
		mode,
		sessionKey,
		sessionId: outcome.sessionId,
		active: true,
		queued: false,
		reason: outcome.reason,
		message: formatRealtimeVoiceAgentQueueRejection(mode, outcome.reason),
		speak: true,
		show: true,
		suppress: false
	};
	return {
		ok: true,
		mode,
		sessionKey,
		sessionId: outcome.sessionId,
		active: true,
		queued: true,
		target: outcome.target,
		message: mode === "followup" ? "Queued that follow-up for the active Operator run." : "Got it. I steered the active run.",
		speak: true,
		show: true,
		suppress: false,
		...outcome.enqueuedAtMs !== void 0 ? { enqueuedAtMs: outcome.enqueuedAtMs } : {},
		...outcome.deliveredAtMs !== void 0 ? { deliveredAtMs: outcome.deliveredAtMs } : {}
	};
}
//#endregion
//#region src/talk/consult-question.ts
/**
* Realtime voice consult-question extraction and result summarization helpers.
*
* These utilities connect Talk tool calls to spoken follow-up answers by
* pulling human-readable questions/results out of provider-owned payloads.
*/
const REALTIME_VOICE_CONSULT_QUESTION_STOPWORDS = /* @__PURE__ */ new Set([
	"a",
	"an",
	"and",
	"are",
	"can",
	"check",
	"could",
	"for",
	"in",
	"is",
	"it",
	"look",
	"me",
	"of",
	"on",
	"or",
	"please",
	"see",
	"that",
	"the",
	"this",
	"to",
	"would",
	"you"
]);
const DEFAULT_REALTIME_VOICE_CONSULT_QUESTION_KEYS = [
	"question",
	"prompt",
	"query",
	"task"
];
const DEFAULT_REALTIME_VOICE_SPEAKABLE_RESULT_KEYS = [
	"text",
	"result",
	"output",
	"error"
];
const DEFAULT_REALTIME_VOICE_SPEAKABLE_RESULT_MAX_CHARS = 1800;
/** Read the consult question from a raw string or selected object keys. */
function readRealtimeVoiceConsultQuestion(args, keys = DEFAULT_REALTIME_VOICE_CONSULT_QUESTION_KEYS) {
	if (typeof args === "string") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args);
	if (!args || typeof args !== "object" || Array.isArray(args)) return;
	return require_string_readers.readTrimmedStringAlias(args, keys);
}
/** Normalize consult questions for stable matching across punctuation/casing. */
function normalizeRealtimeVoiceConsultQuestion(value) {
	return value?.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/gu, " ").trim() || void 0;
}
/** Compare two consult questions with exact, containment, and token-overlap matching. */
function matchRealtimeVoiceConsultQuestions(left, right, options = {}) {
	const normalizedLeft = normalizeRealtimeVoiceConsultQuestion(left);
	const normalizedRight = normalizeRealtimeVoiceConsultQuestion(right);
	if (!normalizedLeft || !normalizedRight) return false;
	if (normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) return true;
	const leftTokens = realtimeVoiceConsultQuestionTokens(normalizedLeft);
	const rightTokens = realtimeVoiceConsultQuestionTokens(normalizedRight);
	if (leftTokens.size === 0 || rightTokens.size === 0) return false;
	let overlap = 0;
	for (const token of leftTokens) if (rightTokens.has(token)) overlap += 1;
	const minTokenOverlapCount = options.minTokenOverlapCount ?? 2;
	if (overlap < minTokenOverlapCount) return false;
	const minTokenOverlapRatio = options.minTokenOverlapRatio ?? .6;
	return overlap / Math.min(leftTokens.size, rightTokens.size) >= minTokenOverlapRatio;
}
/** Extract a bounded speakable string from a tool result payload. */
function readSpeakableRealtimeVoiceToolResult(result, options = {}) {
	const stringResult = options.stringResult ?? true;
	if (typeof result === "string") return stringResult ? limitSpeakableRealtimeVoiceToolResult(result, options.maxChars) : void 0;
	if (!result || typeof result !== "object" || Array.isArray(result)) return;
	const value = require_string_readers.readTrimmedStringAlias(result, options.keys ?? DEFAULT_REALTIME_VOICE_SPEAKABLE_RESULT_KEYS);
	return value ? limitSpeakableRealtimeVoiceToolResult(value, options.maxChars) : void 0;
}
function realtimeVoiceConsultQuestionTokens(value) {
	return new Set(value.split(/[^\p{L}\p{N}]+/gu).map((token) => token.trim()).filter((token) => token.length >= 2 && !REALTIME_VOICE_CONSULT_QUESTION_STOPWORDS.has(token)));
}
function limitSpeakableRealtimeVoiceToolResult(value, maxChars = DEFAULT_REALTIME_VOICE_SPEAKABLE_RESULT_MAX_CHARS) {
	const trimmed = value.trim();
	if (!trimmed) return;
	if (trimmed.length <= maxChars) return trimmed;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, Math.max(0, maxChars - 16)).trimEnd()} [truncated]`;
}
//#endregion
//#region src/talk/forced-consult-coordinator.ts
/**
* Forced-consult dedupe coordinator for realtime voice sessions.
*
* The relay may synthesize an Operator consult when the model hesitates, but a
* native provider tool call can still arrive later. This coordinator prevents
* duplicate consults and keeps late native calls correlated to forced handles.
*/
const DEFAULT_REALTIME_VOICE_FORCED_CONSULT_NATIVE_DEDUPE_MS = 2e3;
const DEFAULT_REALTIME_VOICE_FORCED_CONSULT_LIMIT = 12;
/** Create an in-memory forced-consult coordinator for one realtime session. */
function createRealtimeVoiceForcedConsultCoordinator(options = {}) {
	const state = /* @__PURE__ */ new Map();
	const recentNativeConsults = [];
	let nextId = 0;
	const now = options.now ?? Date.now;
	const limit = options.limit ?? DEFAULT_REALTIME_VOICE_FORCED_CONSULT_LIMIT;
	const nativeDedupeMs = options.nativeDedupeMs ?? DEFAULT_REALTIME_VOICE_FORCED_CONSULT_NATIVE_DEDUPE_MS;
	const setTimer = options.setTimer ?? ((fn, ms) => {
		const timer = setTimeout(fn, ms);
		timer.unref?.();
		return { clear: () => clearTimeout(timer) };
	});
	const questionsMatch = options.questionsMatch ?? matchRealtimeVoiceConsultQuestions;
	const clearTimer = (stored) => {
		stored.timer?.clear();
		stored.timer = void 0;
	};
	const scheduleCleanup = (stored) => {
		stored.cleanupTimer?.clear();
		stored.cleanupTimer = setTimer(() => {
			if (state.get(stored.handle.id) === stored) state.delete(stored.handle.id);
		}, nativeDedupeMs);
	};
	const prune = () => {
		const earliestRecentNative = now() - nativeDedupeMs;
		for (let index = recentNativeConsults.length - 1; index >= 0; index -= 1) {
			const recent = recentNativeConsults[index];
			if (recent && recent.at < earliestRecentNative) recentNativeConsults.splice(index, 1);
		}
		while (recentNativeConsults.length > limit) recentNativeConsults.shift();
		while (state.size > limit) {
			const first = state.values().next().value;
			if (!first) return;
			first.timer?.clear();
			first.cleanupTimer?.clear();
			state.delete(first.handle.id);
		}
	};
	const findMatching = (question) => {
		if (!question) return;
		return [...state.values()].toReversed().find((candidate) => candidate.questions.some((candidateQuestion) => questionsMatch(candidateQuestion, question)));
	};
	const rememberStoredQuestion = (stored, question) => {
		const trimmed = question?.trim();
		if (!trimmed) return;
		if (stored.questions.some((candidate) => questionsMatch(candidate, trimmed))) return;
		stored.questions.push(trimmed);
	};
	const recordRecentNativeConsult = (question) => {
		recentNativeConsults.push({
			question,
			at: now()
		});
		prune();
	};
	const hasRecentNativeConsult = (question, recentOptions = {}) => {
		prune();
		return recentNativeConsults.toReversed().some((recent) => recent.question ? questionsMatch(recent.question, question) : recentOptions.allowUnknownQuestion === true);
	};
	const getStored = (handle) => state.get(handle.id);
	return {
		prepare(question, prepareOptions) {
			const trimmed = question.trim();
			if (!trimmed) return;
			const id = prepareOptions?.id ?? `forced-consult:${now()}:${++nextId}`;
			const existing = state.get(id);
			if (existing) {
				existing.timer?.clear();
				existing.cleanupTimer?.clear();
			}
			const handle = {
				id,
				question: trimmed,
				...prepareOptions && "context" in prepareOptions ? { context: prepareOptions.context } : {}
			};
			state.set(handle.id, {
				handle,
				createdAt: now(),
				nativeCallIds: /* @__PURE__ */ new Set(),
				questions: [trimmed],
				pending: true,
				started: false,
				delivered: false,
				cancelled: false
			});
			prune();
			return handle;
		},
		schedule(handle, delayMs, run) {
			const stored = getStored(handle);
			if (!stored?.pending || stored.timer) return;
			stored.timer = setTimer(() => {
				stored.timer = void 0;
				if (state.get(handle.id) === stored && stored.pending && !stored.cancelled) run(handle);
			}, (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(delayMs, 0, 0));
		},
		clearPending() {
			for (const stored of state.values()) if (stored.pending) {
				clearTimer(stored);
				state.delete(stored.handle.id);
			}
		},
		consumePending(question) {
			const pendingCandidates = [...state.values()].filter((candidate) => candidate.pending);
			const stored = !question && pendingCandidates.length === 1 ? pendingCandidates[0] : pendingCandidates.toReversed().find((candidate) => candidate.questions.some((candidateQuestion) => questionsMatch(candidateQuestion, question)));
			if (!stored?.pending) return;
			clearTimer(stored);
			stored.pending = false;
			return stored.handle;
		},
		cancelPending(handle) {
			const stored = getStored(handle);
			if (!stored?.pending) return;
			clearTimer(stored);
			stored.pending = false;
			state.delete(handle.id);
		},
		recordNativeConsult(args, nativeCallId) {
			const question = readRealtimeVoiceConsultQuestion(args);
			recordRecentNativeConsult(question);
			const pending = [...state.values()].toReversed().find((candidate) => candidate.pending && candidate.questions.some((candidateQuestion) => questionsMatch(candidateQuestion, question)));
			if (pending) {
				clearTimer(pending);
				rememberStoredQuestion(pending, question);
				if (nativeCallId) pending.nativeCallIds.add(nativeCallId);
				pending.pending = false;
				scheduleCleanup(pending);
				return {
					kind: "pending",
					question,
					handle: pending.handle
				};
			}
			const stored = findMatching(question);
			if (!stored) return {
				kind: "none",
				question
			};
			if (nativeCallId) stored.nativeCallIds.add(nativeCallId);
			rememberStoredQuestion(stored, question);
			if (stored.cancelled) return {
				kind: "already_delivered",
				question,
				handle: stored.handle
			};
			if (stored.delivered) return {
				kind: "already_delivered",
				question,
				handle: stored.handle
			};
			if (stored.started) return {
				kind: "in_flight",
				question,
				handle: stored.handle
			};
			return {
				kind: "none",
				question
			};
		},
		markStarted(handle) {
			const stored = getStored(handle);
			if (!stored) return;
			clearTimer(stored);
			stored.pending = false;
			stored.started = true;
		},
		markDelivered(handle) {
			const stored = getStored(handle);
			if (!stored) return;
			clearTimer(stored);
			stored.pending = false;
			stored.started = true;
			stored.delivered = true;
			scheduleCleanup(stored);
		},
		markCancelled(handle) {
			const stored = getStored(handle);
			if (!stored || stored.delivered) return;
			clearTimer(stored);
			stored.pending = false;
			stored.cancelled = true;
			scheduleCleanup(stored);
		},
		isCancelled(handle) {
			return getStored(handle)?.cancelled === true;
		},
		nativeCallIds(handle) {
			return [...getStored(handle)?.nativeCallIds ?? []];
		},
		handles() {
			return [...state.values()].map((stored) => stored.handle);
		},
		rememberQuestion(handle, question) {
			const stored = getStored(handle);
			if (stored) rememberStoredQuestion(stored, question);
		},
		findRecent(question) {
			prune();
			return findMatching(question)?.handle;
		},
		hasRecent(question) {
			return Boolean(findMatching(question));
		},
		hasRecentNativeConsult,
		remove(handle) {
			const stored = getStored(handle);
			stored?.timer?.clear();
			stored?.cleanupTimer?.clear();
			state.delete(handle.id);
		},
		clear() {
			for (const stored of state.values()) {
				stored.timer?.clear();
				stored.cleanupTimer?.clear();
			}
			state.clear();
			recentNativeConsults.length = 0;
		}
	};
}
//#endregion
//#region src/talk/event-metrics.ts
/**
* Shared metric extraction helpers for Talk event diagnostics and logging.
*
* Talk event payloads are provider-owned JSON blobs, so callers must coerce
* records and read only bounded numeric counters that are safe to export.
*/
/** Read the first non-negative finite number from a provider payload record. */
function firstFiniteTalkEventNumber(record, keys) {
	if (!record) return;
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
	}
}
//#endregion
//#region src/talk/diagnostics.ts
/**
* Privacy-preserving Talk diagnostic event projection.
*
* The diagnostic stream needs timing and size counters for reliability work,
* but must not export raw provider payloads, transcripts, or audio content.
*/
/** Convert a Talk event into the bounded diagnostic payload shape. */
function createTalkDiagnosticEvent(event) {
	const payload = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(event.payload);
	return {
		type: "talk.event",
		sessionId: event.sessionId,
		turnId: event.turnId,
		captureId: event.captureId,
		talkEventType: event.type,
		mode: event.mode,
		transport: event.transport,
		brain: event.brain,
		provider: event.provider,
		final: event.final,
		durationMs: firstFiniteTalkEventNumber(payload, [
			"durationMs",
			"latencyMs",
			"elapsedMs"
		]),
		byteLength: firstFiniteTalkEventNumber(payload, ["byteLength", "audioBytes"])
	};
}
/** Emit a trusted internal diagnostic event for one Talk event. */
function recordTalkDiagnosticEvent(event) {
	require_diagnostic_events.emitTrustedDiagnosticEvent(createTalkDiagnosticEvent(event));
}
//#endregion
//#region src/talk/logging.ts
const OMITTED_TALK_LOG_EVENT_TYPES = /* @__PURE__ */ new Set([
	"input.audio.delta",
	"output.audio.delta",
	"output.text.delta",
	"transcript.delta",
	"tool.progress"
]);
const TALK_LOGGER_BINDINGS = Object.freeze({ subsystem: "talk" });
/**
* Converts high-level Talk events into compact structured log records, skipping noisy deltas.
*/
function createTalkLogRecord(event) {
	if (OMITTED_TALK_LOG_EVENT_TYPES.has(event.type)) return;
	const payload = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(event.payload);
	const attributes = {
		sessionId: event.sessionId,
		talkEventType: event.type,
		talkMode: event.mode,
		talkTransport: event.transport,
		talkBrain: event.brain
	};
	if (event.provider) attributes.talkProvider = event.provider;
	if (typeof event.final === "boolean") attributes.talkFinal = event.final;
	const durationMs = firstFiniteTalkEventNumber(payload, [
		"durationMs",
		"latencyMs",
		"elapsedMs"
	]);
	if (durationMs !== void 0) attributes.talkDurationMs = durationMs;
	const byteLength = firstFiniteTalkEventNumber(payload, ["byteLength", "audioBytes"]);
	if (byteLength !== void 0) attributes.talkByteLength = byteLength;
	return {
		level: event.type === "session.error" || event.type === "tool.error" ? "warn" : "info",
		message: `talk event ${event.type}`,
		attributes
	};
}
/**
* Emits Talk logs best-effort so logging failures never break realtime audio handling.
*/
function recordTalkLogEvent(event) {
	const record = createTalkLogRecord(event);
	if (!record) return;
	try {
		const logger = require_logger.getChildLogger(TALK_LOGGER_BINDINGS);
		if (record.level === "warn") {
			logger.warn(record.attributes, record.message);
			return;
		}
		logger.info(record.attributes, record.message);
	} catch {}
}
//#endregion
//#region src/talk/observability.ts
/**
* Combined Talk observability hook for relays and SDK consumers.
*
* A single Talk event should feed both trusted diagnostics and structured logs;
* this facade keeps relay call sites from choosing only one path.
*/
/** Record one Talk event through diagnostics and logging projections. */
function recordTalkObservabilityEvent(event) {
	recordTalkDiagnosticEvent(event);
	recordTalkLogEvent(event);
}
//#endregion
//#region src/talk/provider-types.ts
const REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ = {
	encoding: "pcm16",
	sampleRateHz: 24e3,
	channels: 1
};
//#endregion
//#region src/talk/session-log-runtime.ts
/** Appends a transcript entry and trims old rows in-place to bound Talk diagnostics memory. */
function recordRealtimeVoiceTranscript(transcript, role, text, maxEntries = 40) {
	const entry = {
		at: (/* @__PURE__ */ new Date()).toISOString(),
		role,
		text
	};
	transcript.push(entry);
	if (transcript.length > maxEntries) transcript.splice(0, transcript.length - maxEntries);
	return entry;
}
function normalizeTranscriptForEchoMatch(text) {
	return text.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((token) => token.length > 1);
}
function hasMeaningfulEchoOverlap(userTokens, assistantTokens) {
	if (userTokens.length < 4 || assistantTokens.length < 4) return false;
	const uniqueUserTokens = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(userTokens);
	if (uniqueUserTokens.length < 4) return false;
	const assistantTokenSet = new Set(assistantTokens);
	return uniqueUserTokens.filter((token) => assistantTokenSet.has(token)).length / uniqueUserTokens.length >= .58;
}
/** Detects user transcript text that likely came from assistant speaker echo, not speech. */
function isLikelyRealtimeVoiceAssistantEchoTranscript(params) {
	const userTokens = normalizeTranscriptForEchoMatch(params.text);
	if (userTokens.length < 4) return false;
	const nowMs = params.nowMs ?? Date.now();
	const recentAssistantText = params.transcript.filter((entry) => {
		if (entry.role !== "assistant") return false;
		const at = Date.parse(entry.at);
		return Number.isFinite(at) && nowMs - at <= params.lookbackMs;
	}).slice(-6).map((entry) => entry.text).join(" ");
	if (!recentAssistantText.trim()) return false;
	const userNormalized = userTokens.join(" ");
	const assistantTokens = normalizeTranscriptForEchoMatch(recentAssistantText);
	const assistantNormalized = assistantTokens.join(" ");
	return userNormalized.length >= 18 && assistantNormalized.includes(userNormalized) || assistantNormalized.length >= 18 && userNormalized.includes(assistantNormalized) || hasMeaningfulEchoOverlap(userTokens, assistantTokens);
}
//#endregion
//#region src/talk/session-runtime.ts
/**
* Creates a realtime voice bridge session and wires provider events to the configured audio sink.
*/
function createRealtimeVoiceBridgeSession(params) {
	const bridgeRef = {};
	let isActive = true;
	const requireBridge = () => {
		if (!bridgeRef.current) throw new Error("Realtime voice bridge is not ready");
		return bridgeRef.current;
	};
	const session = {
		get bridge() {
			return requireBridge();
		},
		acknowledgeMark: (markName) => requireBridge().acknowledgeMark(markName),
		close: () => {
			const bridge = requireBridge();
			isActive = false;
			bridge.close();
		},
		connect: () => requireBridge().connect(),
		sendAudio: (audio) => requireBridge().sendAudio(audio),
		sendUserMessage: (text) => requireBridge().sendUserMessage?.(text),
		handleBargeIn: (options) => requireBridge().handleBargeIn?.(options),
		setMediaTimestamp: (ts) => requireBridge().setMediaTimestamp(ts),
		submitToolResult: (callId, result, options) => {
			const bridge = requireBridge();
			if (options?.suppressResponse && bridge.supportsToolResultSuppression === false) throw new Error("Realtime provider does not support suppressed tool results");
			return bridge.submitToolResult(callId, result, options);
		},
		triggerGreeting: (instructions) => requireBridge().triggerGreeting?.(instructions)
	};
	const canSendAudio = () => params.audioSink.isOpen?.() ?? true;
	const reportCallbackError = (error) => {
		if (!isActive) return;
		try {
			params.onError?.(error instanceof Error ? error : new Error(String(error)));
		} catch {}
	};
	bridgeRef.current = params.provider.createBridge({
		cfg: params.cfg,
		providerConfig: params.providerConfig,
		audioFormat: params.audioFormat,
		instructions: params.instructions,
		autoRespondToAudio: params.autoRespondToAudio,
		interruptResponseOnInputAudio: params.interruptResponseOnInputAudio,
		tools: params.tools,
		onAudio: (audio) => {
			if (canSendAudio()) params.audioSink.sendAudio(audio);
		},
		onClearAudio: (reason) => {
			if (canSendAudio()) params.audioSink.clearAudio?.(reason);
		},
		onMark: (markName) => {
			if (!canSendAudio() || params.markStrategy === "ignore") return;
			if (params.markStrategy === "ack-immediately") {
				bridgeRef.current?.acknowledgeMark(markName);
				return;
			}
			if (params.markStrategy === void 0 || params.markStrategy === "transport") params.audioSink.sendMark?.(markName);
		},
		onTranscript: params.onTranscript,
		onEvent: params.onEvent,
		onToolCall: (event) => {
			if (!bridgeRef.current || !isActive) return;
			try {
				const pending = params.onToolCall?.(event, session);
				if (pending) pending.catch(reportCallbackError);
			} catch (error) {
				reportCallbackError(error);
			}
		},
		onReady: () => {
			if (!bridgeRef.current) return;
			if (params.triggerGreetingOnReady) bridgeRef.current.triggerGreeting?.(params.initialGreetingInstructions);
			params.onReady?.(session);
		},
		onError: params.onError,
		onClose: (reason) => {
			isActive = false;
			params.onClose?.(reason);
		}
	});
	return session;
}
//#endregion
//#region src/talk/talk-events.ts
const TURN_SCOPED_TALK_EVENT_TYPES = /* @__PURE__ */ new Set([
	"turn.started",
	"turn.ended",
	"turn.cancelled",
	"input.audio.delta",
	"input.audio.committed",
	"transcript.delta",
	"transcript.done",
	"output.text.delta",
	"output.text.done",
	"output.audio.started",
	"output.audio.delta",
	"output.audio.done",
	"tool.call",
	"tool.progress",
	"tool.result",
	"tool.error"
]);
const CAPTURE_SCOPED_TALK_EVENT_TYPES = /* @__PURE__ */ new Set([
	"capture.started",
	"capture.stopped",
	"capture.cancelled",
	"capture.once"
]);
function assertTalkEventCorrelation(input) {
	if (TURN_SCOPED_TALK_EVENT_TYPES.has(input.type) && !input.turnId?.trim()) throw new Error(`Talk event ${input.type} requires turnId`);
	if (CAPTURE_SCOPED_TALK_EVENT_TYPES.has(input.type) && !input.captureId?.trim()) throw new Error(`Talk event ${input.type} requires captureId`);
}
/**
* Creates a sequencer that stamps Talk events with stable session context and monotonic ids.
*/
function createTalkEventSequencer(context, options = {}) {
	let seq = 0;
	const now = options.now ?? (() => /* @__PURE__ */ new Date());
	return { next(input) {
		assertTalkEventCorrelation(input);
		seq += 1;
		const timestamp = input.timestamp ?? (() => {
			const value = now();
			return typeof value === "string" ? value : value.toISOString();
		})();
		return {
			...context,
			id: `${context.sessionId}:${seq}`,
			type: input.type,
			turnId: input.turnId,
			captureId: input.captureId,
			seq,
			timestamp,
			final: input.final,
			callId: input.callId,
			itemId: input.itemId,
			parentId: input.parentId,
			payload: input.payload
		};
	} };
}
//#endregion
//#region src/talk/talk-session-controller.ts
function defaultTalkEventPayload(payload) {
	return payload === void 0 ? {} : payload;
}
/**
* Creates a per-session Talk controller that emits correlated turn and output-audio events.
*/
function createTalkSessionController(params, options = {}) {
	const { maxRecentEvents = 20, turnIdPrefix = "turn", ...context } = params;
	const sequencer = options.sequencer ?? createTalkEventSequencer(context, { now: options.now });
	const recentEvents = [];
	let activeTurnId;
	let outputAudioActive = false;
	let turnSeq = 0;
	const remember = (event) => {
		recentEvents.push(event);
		if (recentEvents.length > maxRecentEvents) recentEvents.splice(0, recentEvents.length - maxRecentEvents);
		try {
			options.onEvent?.(event);
		} catch {}
		return event;
	};
	const emit = (input) => {
		return remember(sequencer.next(input));
	};
	const resolveActiveTurn = (requestedTurnId) => {
		if (!activeTurnId) return {
			ok: false,
			reason: "no_active_turn"
		};
		const normalizedRequested = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(requestedTurnId);
		if (normalizedRequested && normalizedRequested !== activeTurnId) return {
			ok: false,
			reason: "stale_turn"
		};
		return activeTurnId;
	};
	const ensureTurn = (ensureParams = {}) => {
		if (activeTurnId) return { turnId: activeTurnId };
		return startTurn(ensureParams);
	};
	const startTurn = (startParams = {}) => {
		const turnId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(startParams.turnId) ?? `${turnIdPrefix}-${++turnSeq}`;
		outputAudioActive = false;
		activeTurnId = turnId;
		return {
			turnId,
			event: emit({
				type: "turn.started",
				turnId,
				payload: defaultTalkEventPayload(startParams.payload)
			})
		};
	};
	const finishTurn = (type, paramsForTurn = {}) => {
		const turnId = resolveActiveTurn(paramsForTurn.turnId);
		if (typeof turnId !== "string") return turnId;
		outputAudioActive = false;
		activeTurnId = void 0;
		return {
			ok: true,
			turnId,
			event: emit({
				type,
				turnId,
				payload: defaultTalkEventPayload(paramsForTurn.payload),
				final: true
			})
		};
	};
	return {
		get activeTurnId() {
			return activeTurnId;
		},
		context,
		get outputAudioActive() {
			return outputAudioActive;
		},
		get recentEvents() {
			return recentEvents;
		},
		clearActiveTurn() {
			activeTurnId = void 0;
			outputAudioActive = false;
		},
		emit,
		ensureTurn,
		startTurn,
		endTurn(paramsForTurn) {
			return finishTurn("turn.ended", paramsForTurn);
		},
		cancelTurn(paramsForTurn) {
			return finishTurn("turn.cancelled", paramsForTurn);
		},
		finishOutputAudio(paramsForOutput = {}) {
			if (!outputAudioActive) return;
			const turnId = resolveActiveTurn(paramsForOutput.turnId);
			if (typeof turnId !== "string") return;
			outputAudioActive = false;
			return emit({
				type: "output.audio.done",
				turnId,
				payload: defaultTalkEventPayload(paramsForOutput.payload),
				final: true
			});
		},
		startOutputAudio(paramsForOutput = {}) {
			const turn = ensureTurn({
				turnId: paramsForOutput.turnId,
				payload: {}
			});
			if (outputAudioActive) return { turnId: turn.turnId };
			outputAudioActive = true;
			return {
				turnId: turn.turnId,
				event: emit({
					type: "output.audio.started",
					turnId: turn.turnId,
					payload: defaultTalkEventPayload(paramsForOutput.payload)
				})
			};
		}
	};
}
//#endregion
//#region src/gateway/talk-realtime-relay-issues.ts
function createTalkRealtimeRelayIssue(params) {
	return {
		code: "realtime_unavailable",
		message: params.message,
		provider: params.provider,
		...params.model ? { model: params.model } : {},
		transport: "gateway-relay",
		phase: params.phase
	};
}
function buildTalkRealtimeRelayIssuePayload(relaySessionId, issue) {
	return {
		relaySessionId,
		type: "error",
		message: issue.message,
		code: issue.code,
		provider: issue.provider,
		...issue.model ? { model: issue.model } : {},
		transport: issue.transport,
		phase: issue.phase
	};
}
//#endregion
//#region src/gateway/talk-relay-session-lifecycle.ts
function isExpiredTalkRelaySession(session, validNowMs) {
	const expiresAtMs = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(session.expiresAtMs);
	return expiresAtMs === void 0 || validNowMs > expiresAtMs;
}
/** Closes every expired relay session in the provided process-local map. */
function closeExpiredTalkRelaySessions(params) {
	const validNowMs = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(params.nowMs ?? Date.now());
	if (validNowMs === void 0) return;
	for (const session of params.sessions) if (isExpiredTalkRelaySession(session, validNowMs)) params.closeSession(session);
}
/** Returns the active session only when it belongs to the current connection. */
function requireActiveTalkRelaySession(params) {
	const session = params.sessions.get(params.sessionId);
	const nowMs = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(Date.now());
	if (!session || session.connId !== params.connId || nowMs === void 0 || isExpiredTalkRelaySession(session, nowMs)) {
		if (session) params.closeSession(session);
		throw new Error(params.unknownSessionMessage);
	}
	return session;
}
//#endregion
//#region src/gateway/talk-session-registry.ts
const unifiedTalkSessions = /* @__PURE__ */ new Map();
/** Associates a public Talk session id with its concrete gateway backend. */
function rememberUnifiedTalkSession(sessionId, session) {
	unifiedTalkSessions.set(sessionId, session);
}
/** Resolves a Talk session id or throws the protocol-facing unknown-session error. */
function getUnifiedTalkSession(sessionId) {
	const session = unifiedTalkSessions.get(sessionId);
	if (!session) throw new Error("Unknown Talk session");
	return session;
}
/** Removes a Talk session id after the concrete backend closes. */
function forgetUnifiedTalkSession(sessionId) {
	unifiedTalkSessions.delete(sessionId);
}
/** Enforces that a relay-backed Talk session is controlled by its owner socket. */
function requireUnifiedTalkSessionConn(session, connId) {
	if (!connId || session.connId !== connId) throw new Error("Talk session is not owned by this connection");
	return connId;
}
//#endregion
//#region src/gateway/talk-realtime-relay.ts
const RELAY_SESSION_TTL_MS = 1800 * 1e3;
const MAX_AUDIO_BASE64_BYTES$1 = 512 * 1024;
const MAX_RELAY_SESSIONS_PER_CONN = 2;
const MAX_RELAY_SESSIONS_GLOBAL = 64;
const RELAY_EVENT = "talk.event";
const RELAY_TRANSCRIPT_ECHO_LOOKBACK_MS = 12e3;
const FORCED_CONSULT_FALLBACK_DELAY_MS = 200;
const FORCED_CONSULT_RESULT_MAX_CHARS = 1800;
const relaySessions = /* @__PURE__ */ new Map();
function isWorkingToolResult(result) {
	return Boolean(result) && typeof result === "object" && !Array.isArray(result) && result.status === "working";
}
function isRelayAssistantEchoTranscript(session, text) {
	if (!session) return false;
	return isLikelyRealtimeVoiceAssistantEchoTranscript({
		transcript: session.transcript,
		text,
		lookbackMs: RELAY_TRANSCRIPT_ECHO_LOOKBACK_MS
	});
}
function buildForcedConsultCheckingPrompt() {
	return ["Briefly tell the person that you are checking with Operator.", "Do not answer the request yet. Wait for the Operator result before giving the actual answer."].join(" ");
}
function buildForcedConsultSpeechPrompt(text) {
	return [
		"Operator finished checking. Speak this result naturally and concisely.",
		"Do not mention tool calls, JSON, or internal routing.",
		"",
		text
	].join("\n");
}
function buildAlreadyDeliveredToolResult() {
	return {
		status: "already_delivered",
		message: "Operator already delivered this consult result internally. Do not repeat it."
	};
}
function suppressedToolResultOptions(session) {
	return session.bridge.bridge.supportsToolResultSuppression === false ? void 0 : { suppressResponse: true };
}
function cancelForcedConsults(session) {
	for (const handle of session.forcedConsults.handles()) session.forcedConsults.markCancelled(handle);
}
function broadcastToOwner$1(context, connId, event, options = { dropIfSlow: true }) {
	context.broadcastToConnIds(RELAY_EVENT, event, /* @__PURE__ */ new Set([connId]), options);
}
function relayEventDeliveryOptions(event) {
	switch (event.type) {
		case "ready":
		case "error":
		case "close":
		case "mark": return { dropIfSlow: false };
		default: return { dropIfSlow: true };
	}
}
function abortRelayAgentRuns(session, reason) {
	for (const [runId, sessionKey] of session.activeAgentRuns) require_chat_abort.abortChatRunById(session.context, {
		runId,
		sessionKey,
		stopReason: reason
	});
	session.activeAgentRuns.clear();
	session.activeAgentToolCalls.clear();
}
function pruneInactiveRelayAgentRuns(session) {
	for (const runId of session.activeAgentRuns.keys()) if (!session.context.chatAbortControllers.has(runId)) session.activeAgentRuns.delete(runId);
	for (const [callId, runId] of session.activeAgentToolCalls) if (!session.activeAgentRuns.has(runId)) session.activeAgentToolCalls.delete(callId);
	return session.activeAgentRuns.size;
}
function broadcastToolResultToOwner(session, params) {
	const payload = params.forced === true ? {
		result: params.result,
		forced: true
	} : { result: params.result };
	broadcastToOwner$1(session.context, session.connId, {
		relaySessionId: session.id,
		type: "toolResult",
		callId: params.callId,
		talkEvent: session.talk.emit({
			type: "tool.result",
			callId: params.callId,
			turnId: params.turnId,
			payload,
			final: params.final
		})
	});
}
function completeAfterToolResultSubmissions(session, submissions, onAccepted) {
	const pending = submissions.filter((submission) => submission !== void 0);
	const complete = () => {
		if (relaySessions.get(session.id) === session) onAccepted();
	};
	if (pending.length === 0) {
		complete();
		return;
	}
	return Promise.all(pending).then(complete);
}
function submitFinalProviderToolResult(params) {
	if (params.session.completedProviderToolResults.has(params.callId)) {
		if (relaySessions.get(params.session.id) === params.session) params.onAccepted?.();
		return;
	}
	const pending = params.session.pendingProviderToolResults.get(params.callId);
	if (pending) return pending;
	const submit = () => params.session.bridge.submitToolResult(params.callId, params.result, params.options);
	const working = params.session.pendingWorkingToolResults.get(params.callId);
	const epoch = params.session.toolResultEpoch;
	const submitAfterWorking = async () => {
		if (relaySessions.get(params.session.id) !== params.session) return false;
		if (params.session.toolResultEpoch !== epoch) {
			if (!params.session.cancelledAgentToolCalls.has(params.callId)) return false;
			await params.session.bridge.submitToolResult(params.callId, buildRealtimeVoiceAgentCancelProviderResult("Operator cancelled this consult before completion. Do not restart it."), suppressedToolResultOptions(params.session));
			params.session.completedProviderToolResults.add(params.callId);
			params.session.cancelledAgentToolCalls.delete(params.callId);
			params.session.completedAgentToolCalls.add(params.callId);
			return false;
		}
		await submit();
		return true;
	};
	const submission = working ? working.then(submitAfterWorking, submitAfterWorking) : submit();
	const accept = () => {
		params.session.completedProviderToolResults.add(params.callId);
		if (relaySessions.get(params.session.id) === params.session) params.onAccepted?.();
	};
	if (!submission) {
		accept();
		return;
	}
	const tracked = submission.then((submitted) => {
		if (submitted !== false) accept();
	}).finally(() => {
		if (params.session.pendingProviderToolResults.get(params.callId) === tracked) params.session.pendingProviderToolResults.delete(params.callId);
	});
	params.session.pendingProviderToolResults.set(params.callId, tracked);
	return tracked;
}
function trackAgentFinalToolResult(session, callId, completion) {
	if (!completion) return;
	const tracked = completion.finally(() => {
		if (session.pendingFinalToolResults.get(callId) === tracked) session.pendingFinalToolResults.delete(callId);
	});
	session.pendingFinalToolResults.set(callId, tracked);
	return tracked;
}
function trackPendingWorkingToolResult(session, callId, completion) {
	if (!completion) return;
	const tracked = completion.finally(() => {
		if (session.pendingWorkingToolResults.get(callId) === tracked) session.pendingWorkingToolResults.delete(callId);
	});
	session.pendingWorkingToolResults.set(callId, tracked);
	return tracked;
}
function clearRelayAgentToolCall(session, callId) {
	const runId = session.activeAgentToolCalls.get(callId);
	session.activeAgentToolCalls.delete(callId);
	if (!runId) return;
	if (![...session.activeAgentToolCalls.values()].includes(runId)) session.activeAgentRuns.delete(runId);
}
function submitRelayAgentControlProviderResults(session, result, turnId) {
	if (result.mode !== "cancel" || !result.ok || !result.providerResult) return;
	const providerResult = result.providerResult;
	const epoch = session.toolResultEpoch;
	const callIds = [...session.activeAgentToolCalls.keys()];
	const activeCallIds = callIds.filter((callId) => !session.pendingFinalToolResults.has(callId));
	const submissions = callIds.map((callId) => session.pendingFinalToolResults.get(callId)).filter((pending) => pending !== void 0);
	const toolResultOptions = suppressedToolResultOptions(session);
	let providerResponseStarted = toolResultOptions === void 0 && submissions.length > 0;
	const finalizeAgentCall = (callId, forcedConsult) => {
		if (session.toolResultEpoch !== epoch) return;
		if (forcedConsult) session.forcedConsults.markCancelled(forcedConsult);
		broadcastToolResultToOwner(session, {
			callId,
			turnId,
			result: providerResult,
			final: true
		});
		clearRelayAgentToolCall(session, callId);
		session.completedAgentToolCalls.add(callId);
	};
	for (const callId of activeCallIds) {
		const forcedConsult = session.forcedConsults.handles().find((handle) => handle.id === callId);
		if (forcedConsult) {
			const nativeCallIds = session.forcedConsults.nativeCallIds(forcedConsult);
			providerResponseStarted ||= toolResultOptions === void 0 && nativeCallIds.length > 0;
			const terminal = {
				result: providerResult,
				options: toolResultOptions,
				turnId,
				epoch
			};
			session.forcedTerminalProviderResults.set(callId, terminal);
			const clearTerminal = () => {
				if (session.forcedTerminalProviderResults.get(callId) === terminal) session.forcedTerminalProviderResults.delete(callId);
			};
			const tracked = trackAgentFinalToolResult(session, callId, completeAfterToolResultSubmissions(session, [drainForcedTerminalProviderResultsAfterPending(session, forcedConsult, terminal)], () => {
				clearTerminal();
				finalizeAgentCall(callId, forcedConsult);
			})?.finally(clearTerminal));
			submissions.push(tracked);
			continue;
		}
		providerResponseStarted ||= toolResultOptions === void 0;
		const submitted = submitFinalProviderToolResult({
			session,
			callId,
			result: providerResult,
			options: toolResultOptions,
			onAccepted: () => finalizeAgentCall(callId)
		});
		submissions.push(trackAgentFinalToolResult(session, callId, submitted));
	}
	const completion = completeAfterToolResultSubmissions(session, submissions, () => {});
	return {
		...completion ? { completion } : {},
		providerResponseStarted
	};
}
function closeRelaySession(session, reason) {
	session.forcedConsults.clear();
	relaySessions.delete(session.id);
	forgetUnifiedTalkSession(session.id);
	clearTimeout(session.cleanupTimer);
	abortRelayAgentRuns(session, reason === "error" ? "relay-error" : "relay-closed");
	session.bridge.close();
	broadcastToOwner$1(session.context, session.connId, {
		relaySessionId: session.id,
		type: "close",
		reason,
		talkEvent: session.talk.emit({
			type: "session.closed",
			payload: { reason },
			final: true
		})
	});
}
function pruneExpiredRelaySessions(nowMs = Date.now()) {
	closeExpiredTalkRelaySessions({
		sessions: relaySessions.values(),
		closeSession: (session) => closeRelaySession(session, "completed"),
		nowMs
	});
}
function countRelaySessionsForConn(connId) {
	let count = 0;
	for (const session of relaySessions.values()) if (session.connId === connId) count += 1;
	return count;
}
function enforceRelaySessionLimits(connId) {
	pruneExpiredRelaySessions();
	if (relaySessions.size >= MAX_RELAY_SESSIONS_GLOBAL) throw new Error("Too many active realtime relay sessions");
	if (countRelaySessionsForConn(connId) >= MAX_RELAY_SESSIONS_PER_CONN) throw new Error("Too many active realtime relay sessions for this connection");
}
/** Creates a realtime voice relay session and returns the browser audio contract. */
function createTalkRealtimeRelaySession(params) {
	enforceRelaySessionLimits(params.connId);
	const forceAgentConsultOnFinalTranscript = params.forceAgentConsultOnFinalTranscript === true;
	const relaySessionId = (0, node_crypto.randomUUID)();
	const expiresAtMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(RELAY_SESSION_TTL_MS);
	if (expiresAtMs === void 0) throw new Error("Realtime relay session expiry is outside the supported Date range");
	const talk = createTalkSessionController({
		sessionId: relaySessionId,
		mode: "realtime",
		transport: "gateway-relay",
		brain: "agent-consult",
		provider: params.provider.id
	}, { onEvent: recordTalkObservabilityEvent });
	const emit = (event, talkEvent) => broadcastToOwner$1(params.context, params.connId, {
		...event,
		...talkEvent ? { talkEvent: talk.emit(talkEvent) } : {}
	}, relayEventDeliveryOptions(event));
	let currentOutputItemId;
	let currentOutputResponseId;
	let ready = false;
	let failureEmitted = false;
	const relayRef = {};
	const bridge = createRealtimeVoiceBridgeSession({
		provider: params.provider,
		cfg: params.cfg,
		providerConfig: params.providerConfig,
		audioFormat: REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ,
		instructions: params.instructions,
		autoRespondToAudio: !forceAgentConsultOnFinalTranscript,
		interruptResponseOnInputAudio: !forceAgentConsultOnFinalTranscript,
		tools: params.tools,
		markStrategy: "transport",
		audioSink: {
			isOpen: () => Boolean(relayRef.current && relaySessions.has(relayRef.current.id)),
			sendAudio: (audio) => {
				const turnId = relayRef.current ? ensureRelayTurn(relayRef.current) : void 0;
				emit({
					relaySessionId,
					type: "audio",
					audioBase64: audio.toString("base64"),
					...currentOutputItemId ? { itemId: currentOutputItemId } : {},
					...currentOutputResponseId ? { responseId: currentOutputResponseId } : {}
				}, {
					type: "output.audio.delta",
					turnId,
					payload: { byteLength: audio.length }
				});
			},
			clearAudio: (reason) => {
				const turnId = relayRef.current ? ensureRelayTurn(relayRef.current) : void 0;
				emit({
					relaySessionId,
					type: "clear",
					...reason ? { reason } : {}
				}, {
					type: "output.audio.done",
					turnId,
					payload: { reason: reason ?? "clear" },
					final: true
				});
			},
			sendMark: (markName) => {
				const turnId = relayRef.current ? ensureRelayTurn(relayRef.current) : void 0;
				emit({
					relaySessionId,
					type: "mark",
					markName
				}, {
					type: "output.audio.done",
					turnId,
					payload: { markName },
					final: true
				});
			}
		},
		onEvent: (event) => {
			if (event.direction !== "server") return;
			if (event.type === "conversation.output_audio.delta" || event.type === "response.audio.delta" || event.type === "response.output_audio.delta") {
				currentOutputItemId = event.itemId ?? currentOutputItemId;
				currentOutputResponseId = event.responseId ?? currentOutputResponseId;
				return;
			}
			if (event.type === "response.audio.done" || event.type === "response.output_audio.done" || event.type === "conversation.output_audio.done" || event.type === "response.done" || event.type === "response.cancelled") {
				emit({
					relaySessionId,
					type: "audioDone",
					...event.itemId ?? currentOutputItemId ? { itemId: event.itemId ?? currentOutputItemId } : {},
					...event.responseId ?? currentOutputResponseId ? { responseId: event.responseId ?? currentOutputResponseId } : {}
				});
				currentOutputItemId = void 0;
				currentOutputResponseId = void 0;
			}
		},
		onTranscript: (role, text, final) => {
			const relay = relayRef.current;
			const turnId = relay ? ensureRelayTurn(relay) : void 0;
			if (final && relay) recordRealtimeVoiceTranscript(relay.transcript, role, text);
			emit({
				relaySessionId,
				type: "transcript",
				role,
				text,
				final
			}, {
				type: role === "assistant" ? final ? "output.text.done" : "output.text.delta" : final ? "transcript.done" : "transcript.delta",
				turnId,
				payload: role === "assistant" ? { text } : {
					role,
					text
				},
				final
			});
			if (role === "user" && final && text.trim()) {
				const question = text.trim();
				if (isRelayAssistantEchoTranscript(relay, question)) return;
				if (relay && pruneInactiveRelayAgentRuns(relay) > 0 && shouldAutoControlRealtimeVoiceAgentText(question)) {
					steerTalkRealtimeRelayAgentRun({
						relaySessionId,
						connId: params.connId,
						text: question
					}).then((result) => {
						if (result.speak && !result.suppress && result.message.trim()) bridge.sendUserMessage(buildRealtimeVoiceAgentControlSpeechMessage(result.message));
					}).catch((error) => {
						emit({
							relaySessionId,
							type: "error",
							message: require_errors.formatErrorMessage(error)
						}, {
							type: "session.error",
							payload: { message: require_errors.formatErrorMessage(error) },
							final: true
						});
					});
					return;
				}
				if (forceAgentConsultOnFinalTranscript) scheduleForcedAgentConsult(relay, question);
			}
		},
		onToolCall: (toolCall) => {
			const relay = relayRef.current;
			let shouldSubmitWorkingResult = false;
			if (relay && toolCall.name === "operator_agent_consult") {
				const forcedConsult = relay.forcedConsults.recordNativeConsult(toolCall.args, toolCall.callId);
				if (forcedConsult.kind === "in_flight" || forcedConsult.kind === "already_delivered") {
					if (forcedConsult.kind === "already_delivered") {
						const result = relay.forcedConsults.isCancelled(forcedConsult.handle) ? buildRealtimeVoiceAgentCancelProviderResult("Operator cancelled this consult before completion. Do not restart it.") : buildAlreadyDeliveredToolResult();
						return submitForcedConsultProviderResult(relay, toolCall.callId, result, suppressedToolResultOptions(relay));
					}
					if (relay.forcedTerminalProviderResults.has(forcedConsult.handle.id)) return relay.pendingFinalToolResults.get(forcedConsult.handle.id);
					return submitRealtimeAgentConsultWorkingResponse(relay, toolCall.callId);
				}
				shouldSubmitWorkingResult = true;
			}
			const turnId = relay ? ensureRelayTurn(relay) : void 0;
			emit({
				relaySessionId,
				type: "toolCall",
				itemId: toolCall.itemId,
				callId: toolCall.callId,
				name: toolCall.name,
				args: toolCall.args
			}, {
				type: "tool.call",
				itemId: toolCall.itemId,
				callId: toolCall.callId,
				turnId,
				payload: {
					name: toolCall.name,
					args: toolCall.args
				}
			});
			if (relay && shouldSubmitWorkingResult) return submitRealtimeAgentConsultWorkingResponse(relay, toolCall.callId, turnId);
		},
		onReady: () => {
			ready = true;
			emit({
				relaySessionId,
				type: "ready"
			}, {
				type: "session.ready",
				payload: null
			});
		},
		onError: (error) => {
			const issue = createTalkRealtimeRelayIssue({
				message: require_errors.formatErrorMessage(error),
				provider: params.provider.id,
				model: params.model,
				phase: ready ? "stream" : "connect"
			});
			failureEmitted = true;
			emit(buildTalkRealtimeRelayIssuePayload(relaySessionId, issue), {
				type: "session.error",
				payload: issue,
				final: true
			});
		},
		onClose: (reason) => {
			const active = relaySessions.get(relaySessionId);
			if (!active) return;
			active.forcedConsults.clear();
			relaySessions.delete(relaySessionId);
			forgetUnifiedTalkSession(relaySessionId);
			clearTimeout(active.cleanupTimer);
			abortRelayAgentRuns(active, "relay-closed");
			if (!ready && !failureEmitted) {
				const issue = createTalkRealtimeRelayIssue({
					message: "Realtime provider closed before the session became ready.",
					provider: params.provider.id,
					model: params.model,
					phase: "connect"
				});
				emit(buildTalkRealtimeRelayIssuePayload(relaySessionId, issue), {
					type: "session.error",
					payload: issue,
					final: true
				});
			}
			emit({
				relaySessionId,
				type: "close",
				reason
			}, {
				type: "session.closed",
				payload: { reason },
				final: true
			});
		}
	});
	const relay = {
		id: relaySessionId,
		connId: params.connId,
		context: params.context,
		bridge,
		talk,
		sessionKey: params.sessionKey?.trim() || void 0,
		expiresAtMs,
		cleanupTimer: setTimeout(() => {
			const active = relaySessions.get(relaySessionId);
			if (active) closeRelaySession(active, "completed");
		}, RELAY_SESSION_TTL_MS),
		activeAgentRuns: /* @__PURE__ */ new Map(),
		activeAgentToolCalls: /* @__PURE__ */ new Map(),
		completedAgentToolCalls: /* @__PURE__ */ new Set(),
		cancelledAgentToolCalls: /* @__PURE__ */ new Map(),
		pendingFinalToolResults: /* @__PURE__ */ new Map(),
		completedProviderToolResults: /* @__PURE__ */ new Set(),
		pendingProviderToolResults: /* @__PURE__ */ new Map(),
		pendingWorkingToolResults: /* @__PURE__ */ new Map(),
		forcedTerminalProviderResults: /* @__PURE__ */ new Map(),
		toolResultEpoch: 0,
		forcedConsults: createRealtimeVoiceForcedConsultCoordinator(),
		transcript: []
	};
	relayRef.current = relay;
	relay.cleanupTimer.unref?.();
	relaySessions.set(relaySessionId, relay);
	bridge.connect().catch((error) => {
		const issue = createTalkRealtimeRelayIssue({
			message: require_errors.formatErrorMessage(error),
			provider: params.provider.id,
			model: params.model,
			phase: "connect"
		});
		failureEmitted = true;
		emit(buildTalkRealtimeRelayIssuePayload(relaySessionId, issue), {
			type: "session.error",
			payload: issue,
			final: true
		});
		const active = relaySessions.get(relaySessionId);
		if (active) closeRelaySession(active, "error");
	});
	return {
		provider: params.provider.id,
		transport: "gateway-relay",
		relaySessionId,
		audio: {
			inputEncoding: "pcm16",
			inputSampleRateHz: REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ.sampleRateHz,
			outputEncoding: "pcm16",
			outputSampleRateHz: REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ.sampleRateHz
		},
		...params.model ? { model: params.model } : {},
		...params.voice ? { voice: params.voice } : {},
		expiresAt: Math.floor(expiresAtMs / 1e3)
	};
}
function scheduleForcedAgentConsult(session, question) {
	if (!session || !question.trim()) return;
	if (session.forcedConsults.hasRecentNativeConsult(question)) return;
	session.forcedConsults.clearPending();
	const handle = session.forcedConsults.prepare(question);
	if (!handle) return;
	session.forcedConsults.schedule(handle, FORCED_CONSULT_FALLBACK_DELAY_MS, () => {
		if (!relaySessions.has(session.id)) return;
		const turnId = ensureRelayTurn(session);
		const callId = handle.id;
		const itemId = `forced-consult-item-${(0, node_crypto.randomUUID)()}`;
		session.forcedConsults.markStarted(handle);
		session.bridge.handleBargeIn({
			audioPlaybackActive: true,
			force: true
		});
		broadcastToOwner$1(session.context, session.connId, {
			relaySessionId: session.id,
			type: "toolCall",
			itemId,
			callId,
			name: REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME,
			forced: true,
			args: {
				question: handle.question,
				context: "The realtime provider produced a final user transcript without invoking operator_agent_consult, so Operator is forcing the consult for realtime Talk.",
				responseStyle: "Reply in a concise spoken tone."
			},
			talkEvent: session.talk.emit({
				type: "tool.call",
				itemId,
				callId,
				turnId,
				payload: {
					name: REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME,
					args: { question: handle.question },
					forced: true
				}
			})
		});
	});
}
function submitForcedConsultProviderResult(session, callId, result, options) {
	return submitFinalProviderToolResult({
		session,
		callId,
		result,
		options
	});
}
function drainForcedTerminalProviderResults(session, handle, terminal) {
	if (session.forcedTerminalProviderResults.get(handle.id) !== terminal) return;
	const pending = session.forcedConsults.nativeCallIds(handle).map((callId) => submitForcedConsultProviderResult(session, callId, terminal.result, terminal.options)).filter((submission) => submission !== void 0);
	if (pending.length > 0) return Promise.all(pending).then(() => drainForcedTerminalProviderResults(session, handle, terminal));
	if (session.forcedConsults.nativeCallIds(handle).some((callId) => !session.completedProviderToolResults.has(callId))) return drainForcedTerminalProviderResults(session, handle, terminal);
}
function drainForcedTerminalProviderResultsAfterPending(session, handle, terminal) {
	const pending = session.forcedConsults.nativeCallIds(handle).map((callId) => session.pendingProviderToolResults.get(callId)).filter((submission) => submission !== void 0);
	if (pending.length === 0) return drainForcedTerminalProviderResults(session, handle, terminal);
	return Promise.allSettled(pending).then(() => drainForcedTerminalProviderResults(session, handle, terminal));
}
function submitRealtimeAgentConsultWorkingResponse(session, callId, turnId = ensureRelayTurn(session)) {
	if (!session.bridge.bridge.supportsToolResultContinuation) return;
	const epoch = session.toolResultEpoch;
	return trackPendingWorkingToolResult(session, callId, completeAfterToolResultSubmissions(session, [session.bridge.submitToolResult(callId, buildRealtimeVoiceAgentConsultWorkingResponse("person"), { willContinue: true })], () => {
		if (session.toolResultEpoch !== epoch) return;
		broadcastToOwner$1(session.context, session.connId, {
			relaySessionId: session.id,
			type: "toolResult",
			callId,
			talkEvent: session.talk.emit({
				type: "tool.progress",
				callId,
				turnId,
				payload: {
					name: REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME,
					status: "working"
				}
			})
		});
	}));
}
function ensureRelayTurn(session) {
	const turn = session.talk.ensureTurn();
	if (turn.event) broadcastToOwner$1(session.context, session.connId, {
		relaySessionId: session.id,
		type: "inputAudio",
		byteLength: 0,
		talkEvent: turn.event
	});
	return turn.turnId;
}
function getRelaySession(relaySessionId, connId) {
	return requireActiveTalkRelaySession({
		sessions: relaySessions,
		sessionId: relaySessionId,
		connId,
		closeSession: (session) => closeRelaySession(session, "completed"),
		unknownSessionMessage: "Unknown realtime relay session"
	});
}
/** Streams one base64-encoded browser audio frame into the owning relay. */
function sendTalkRealtimeRelayAudio(params) {
	if (params.audioBase64.length > MAX_AUDIO_BASE64_BYTES$1) throw new Error("Realtime relay audio frame is too large");
	const session = getRelaySession(params.relaySessionId, params.connId);
	const turnId = ensureRelayTurn(session);
	const audio = Buffer.from(params.audioBase64, "base64");
	session.bridge.sendAudio(audio);
	broadcastToOwner$1(session.context, session.connId, {
		relaySessionId: session.id,
		type: "inputAudio",
		byteLength: audio.byteLength,
		talkEvent: session.talk.emit({
			type: "input.audio.delta",
			turnId,
			payload: { byteLength: audio.byteLength }
		})
	});
	if (typeof params.timestamp === "number" && Number.isFinite(params.timestamp)) session.bridge.setMediaTimestamp(params.timestamp);
}
/** Confirms that an owning relay client finished playing through a provider mark. */
function acknowledgeTalkRealtimeRelayMark(params) {
	getRelaySession(params.relaySessionId, params.connId).bridge.acknowledgeMark(params.markName);
}
/** Delivers a tool result from the browser/client side back to the provider. */
function submitTalkRealtimeRelayToolResult(params) {
	const session = getRelaySession(params.relaySessionId, params.connId);
	if (session.completedAgentToolCalls.has(params.callId)) return;
	const pendingFinal = session.pendingFinalToolResults.get(params.callId);
	const cancelledAgentCall = session.cancelledAgentToolCalls.has(params.callId);
	if (pendingFinal && !cancelledAgentCall) return pendingFinal;
	const forcedConsult = session.forcedConsults.handles().find((handle) => handle.id === params.callId);
	if (forcedConsult) {
		const cancelled = session.forcedConsults.isCancelled(forcedConsult);
		const turnId = cancelled ? session.cancelledAgentToolCalls.get(params.callId) ?? session.talk.activeTurnId : ensureRelayTurn(session);
		if (!turnId) throw new Error("Cancelled realtime consult is missing its original turn");
		if (cancelled) {
			const providerResult = buildRealtimeVoiceAgentCancelProviderResult("Operator cancelled this consult before completion. Do not restart it.");
			const terminal = {
				result: providerResult,
				options: suppressedToolResultOptions(session),
				turnId,
				epoch: session.toolResultEpoch
			};
			session.forcedTerminalProviderResults.set(forcedConsult.id, terminal);
			const clearTerminal = () => {
				if (session.forcedTerminalProviderResults.get(forcedConsult.id) === terminal) session.forcedTerminalProviderResults.delete(forcedConsult.id);
			};
			const completion = completeAfterToolResultSubmissions(session, [drainForcedTerminalProviderResultsAfterPending(session, forcedConsult, terminal)], () => {
				clearTerminal();
				if (session.toolResultEpoch !== terminal.epoch) return;
				session.forcedConsults.markCancelled(forcedConsult);
				clearRelayAgentToolCall(session, params.callId);
				session.cancelledAgentToolCalls.delete(params.callId);
				session.completedAgentToolCalls.add(params.callId);
				broadcastToolResultToOwner(session, {
					callId: params.callId,
					turnId,
					result: providerResult,
					forced: true,
					final: true
				});
			});
			return trackAgentFinalToolResult(session, params.callId, completion?.finally(clearTerminal));
		}
		if (!(params.options?.willContinue !== true)) {
			if (isWorkingToolResult(params.result)) session.bridge.sendUserMessage(buildForcedConsultCheckingPrompt());
			broadcastToolResultToOwner(session, {
				callId: params.callId,
				turnId,
				result: params.result,
				forced: true,
				final: false
			});
			return;
		}
		const text = readSpeakableRealtimeVoiceToolResult(params.result, { maxChars: FORCED_CONSULT_RESULT_MAX_CHARS });
		const providerOptions = suppressedToolResultOptions(session);
		const terminal = {
			result: providerOptions ? buildAlreadyDeliveredToolResult() : params.result,
			options: providerOptions,
			turnId,
			epoch: session.toolResultEpoch
		};
		session.forcedTerminalProviderResults.set(forcedConsult.id, terminal);
		const submission = drainForcedTerminalProviderResults(session, forcedConsult, terminal);
		const clearTerminal = () => {
			if (session.forcedTerminalProviderResults.get(forcedConsult.id) === terminal) session.forcedTerminalProviderResults.delete(forcedConsult.id);
		};
		const trackedCompletion = completeAfterToolResultSubmissions(session, [submission], () => {
			clearTerminal();
			if (session.toolResultEpoch !== terminal.epoch) return;
			session.forcedConsults.markDelivered(forcedConsult);
			clearRelayAgentToolCall(session, params.callId);
			session.completedAgentToolCalls.add(params.callId);
			const hasNativeCalls = session.forcedConsults.nativeCallIds(forcedConsult).length > 0;
			if (text && (!hasNativeCalls || providerOptions)) session.bridge.sendUserMessage(buildForcedConsultSpeechPrompt(text));
			broadcastToolResultToOwner(session, {
				callId: params.callId,
				turnId,
				result: params.result,
				forced: true,
				final: true
			});
		})?.finally(clearTerminal);
		return trackAgentFinalToolResult(session, params.callId, trackedCompletion);
	}
	if (cancelledAgentCall) {
		const providerResult = buildRealtimeVoiceAgentCancelProviderResult("Operator cancelled this consult before completion. Do not restart it.");
		const submitCancellation = () => submitFinalProviderToolResult({
			session,
			callId: params.callId,
			result: providerResult,
			options: suppressedToolResultOptions(session),
			onAccepted: () => {
				session.cancelledAgentToolCalls.delete(params.callId);
				session.completedAgentToolCalls.add(params.callId);
			}
		});
		const pendingProvider = session.pendingProviderToolResults.get(params.callId);
		const completion = pendingProvider ? pendingProvider.then(submitCancellation, submitCancellation) : submitCancellation();
		return trackAgentFinalToolResult(session, params.callId, completion);
	}
	if (params.options?.suppressResponse === true && session.bridge.bridge.supportsToolResultSuppression === false) throw new Error("Realtime provider does not support suppressed tool results");
	const final = params.options?.willContinue !== true;
	const turnId = ensureRelayTurn(session);
	const epoch = session.toolResultEpoch;
	const onAccepted = () => {
		if (session.toolResultEpoch !== epoch) return;
		if (final) {
			clearRelayAgentToolCall(session, params.callId);
			session.completedAgentToolCalls.add(params.callId);
		}
		broadcastToolResultToOwner(session, {
			callId: params.callId,
			turnId,
			result: params.result,
			final
		});
	};
	if (final) {
		const completion = submitFinalProviderToolResult({
			session,
			callId: params.callId,
			result: params.result,
			options: params.options,
			onAccepted
		});
		return trackAgentFinalToolResult(session, params.callId, completion);
	}
	const submit = () => session.bridge.submitToolResult(params.callId, params.result, params.options);
	const pendingWorking = session.pendingWorkingToolResults.get(params.callId);
	if (pendingWorking) {
		const completion = pendingWorking.then(async () => {
			if (relaySessions.get(session.id) !== session || session.toolResultEpoch !== epoch) return false;
			await submit();
			return true;
		}).then((submitted) => {
			if (submitted && relaySessions.get(session.id) === session) onAccepted();
		});
		return trackPendingWorkingToolResult(session, params.callId, completion);
	}
	const completion = completeAfterToolResultSubmissions(session, [submit()], onAccepted);
	return trackPendingWorkingToolResult(session, params.callId, completion);
}
/** Tracks the chat run started for a realtime agent-consult tool call. */
function registerTalkRealtimeRelayAgentRun(params) {
	const session = getRelaySession(params.relaySessionId, params.connId);
	session.activeAgentRuns.set(params.runId, params.sessionKey);
	if (params.callId?.trim()) session.activeAgentToolCalls.set(params.callId.trim(), params.runId);
	if (!session.sessionKey) session.sessionKey = params.sessionKey;
}
/** Applies realtime voice-control text to the active agent-consult chat run. */
async function steerTalkRealtimeRelayAgentRun(params) {
	const session = getRelaySession(params.relaySessionId, params.connId);
	const sessionKey = session.sessionKey;
	if (!sessionKey) throw new Error("Realtime relay steering requires a session key");
	const requestedSessionKey = params.sessionKey?.trim();
	if (requestedSessionKey && requestedSessionKey !== sessionKey) throw new Error("Realtime relay steering session key does not match the relay session");
	const result = await controlRealtimeVoiceAgentRun({
		sessionKey,
		text: params.text,
		mode: params.mode,
		recentEvents: session.talk.recentEvents
	});
	if (relaySessions.get(session.id) !== session) throw new Error("Realtime relay session closed while steering the agent run");
	const turnId = ensureRelayTurn(session);
	const providerSubmission = submitRelayAgentControlProviderResults(session, result, turnId);
	if (providerSubmission?.completion) await providerSubmission.completion;
	const finalResult = providerSubmission?.providerResponseStarted ? {
		...result,
		suppress: true
	} : result;
	if (relaySessions.get(session.id) !== session) return finalResult;
	broadcastToOwner$1(session.context, session.connId, {
		relaySessionId: session.id,
		type: "toolProgress",
		result: finalResult,
		talkEvent: session.talk.emit({
			type: "tool.progress",
			turnId,
			payload: {
				name: "operator_agent_control",
				phase: finalResult.mode,
				result: finalResult
			},
			final: finalResult.mode === "cancel" || finalResult.mode === "status"
		})
	});
	return finalResult;
}
/** Cancels the active relay turn, aborts agent work, and clears provider audio. */
function cancelTalkRealtimeRelayTurn(params) {
	const session = getRelaySession(params.relaySessionId, params.connId);
	session.toolResultEpoch += 1;
	session.forcedTerminalProviderResults.clear();
	const turnId = ensureRelayTurn(session);
	const reason = params.reason ?? "client-cancelled";
	cancelForcedConsults(session);
	for (const callId of session.activeAgentToolCalls.keys()) session.cancelledAgentToolCalls.set(callId, turnId);
	for (const forcedConsult of session.forcedConsults.handles()) if (session.forcedConsults.isCancelled(forcedConsult)) {
		session.cancelledAgentToolCalls.set(forcedConsult.id, turnId);
		for (const nativeCallId of session.forcedConsults.nativeCallIds(forcedConsult)) session.cancelledAgentToolCalls.set(nativeCallId, turnId);
	}
	session.bridge.handleBargeIn({ audioPlaybackActive: true });
	abortRelayAgentRuns(session, reason);
	const cancelled = session.talk.cancelTurn({
		turnId,
		payload: { reason }
	});
	broadcastToOwner$1(session.context, session.connId, {
		relaySessionId: session.id,
		type: "clear",
		talkEvent: cancelled.ok ? cancelled.event : void 0
	});
}
/** Closes a realtime relay session owned by the current connection. */
function stopTalkRealtimeRelaySession(params) {
	closeRelaySession(getRelaySession(params.relaySessionId, params.connId), "completed");
}
//#endregion
//#region src/gateway/talk-agent-consult.ts
function normalizeTalkChatSendAckStatus(result) {
	if (!result || typeof result !== "object" || Array.isArray(result)) return "started";
	const status = result.status;
	return status === "in_flight" || status === "ok" || status === "timeout" || status === "error" ? status : "started";
}
function terminalTalkChatSendAckError(status) {
	if (status === "timeout") return require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "Realtime agent consult ended before the run started.");
	if (status === "error") return require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "Realtime agent consult failed before the run started.");
	if (status === "ok") return require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "Realtime agent consult completed before the tool result subscription started.");
}
/**
* Starts the agent-consult chat run that backs realtime Talk tool calls.
*/
async function startTalkRealtimeAgentConsult(params) {
	let message;
	try {
		message = buildRealtimeVoiceAgentConsultChatMessage(params.args);
	} catch (err) {
		return {
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, require_ws_log.formatForLog(err))
		};
	}
	const idempotencyKey = `talk-${params.callId}-${(0, node_crypto.randomUUID)()}`;
	const normalizedTalk = require_io.normalizeTalkSection(params.context.getRuntimeConfig().talk);
	const chatResponse = await new Promise((resolve) => {
		let acknowledged = false;
		const chatSendResult = (0, _gabrielvfonseca_normalization_core.expectDefined)(require_chat.chatHandlers["chat.send"], "chat.send handler")({
			req: {
				type: "req",
				id: `${params.requestId}:talk-tool-call`,
				method: "chat.send"
			},
			client: params.client,
			isWebchatConnect: params.isWebchatConnect,
			context: params.context,
			params: {
				sessionKey: params.sessionKey,
				message,
				idempotencyKey,
				...normalizedTalk?.consultThinkingLevel ? { thinking: normalizedTalk.consultThinkingLevel } : {},
				...typeof normalizedTalk?.consultFastMode === "boolean" ? { fastMode: normalizedTalk.consultFastMode } : {}
			},
			respond: (ok, result, error) => {
				acknowledged = true;
				resolve(ok ? {
					ok: true,
					result
				} : {
					ok: false,
					error: error ?? require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "chat.send failed without error")
				});
			}
		});
		Promise.resolve(chatSendResult).then(() => {
			if (!acknowledged) resolve(void 0);
		}, (error) => {
			if (acknowledged) {
				params.context.logGateway.warn(`realtime Talk agent consult failed after acknowledgement: ${require_ws_log.formatForLog(error)}`);
				return;
			}
			resolve({
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(error))
			});
		});
	});
	if (!chatResponse) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "chat.send did not return a realtime tool result")
	};
	if (!chatResponse.ok) return {
		ok: false,
		error: chatResponse.error
	};
	const result = chatResponse.result;
	const terminalAckError = terminalTalkChatSendAckError(normalizeTalkChatSendAckStatus(result));
	if (terminalAckError) return {
		ok: false,
		error: terminalAckError
	};
	const runId = result && typeof result === "object" && !Array.isArray(result) ? typeof result.runId === "string" ? result.runId : idempotencyKey : idempotencyKey;
	if (params.relaySessionId && params.connId) registerTalkRealtimeRelayAgentRun({
		relaySessionId: params.relaySessionId,
		connId: params.connId,
		sessionKey: params.sessionKey,
		runId: (0, _gabrielvfonseca_normalization_core.expectDefined)(runId, "talk agent run id"),
		callId: params.callId
	});
	return {
		ok: true,
		runId: (0, _gabrielvfonseca_normalization_core.expectDefined)(runId, "talk agent run id"),
		idempotencyKey
	};
}
//#endregion
//#region src/gateway/server-methods/talk-shared.ts
function canUseTalkDirectTools(client) {
	return (Array.isArray(client?.connect?.scopes) ? client.connect.scopes : []).includes(require_operator_scopes.ADMIN_SCOPE);
}
function broadcastTalkRoomEvents(context, connId, params) {
	if (!connId || params.events.length === 0) return;
	for (const talkEvent of params.events) context.broadcastToConnIds("talk.event", {
		handoffId: params.handoffId,
		roomId: params.roomId,
		talkEvent
	}, /* @__PURE__ */ new Set([connId]), { dropIfSlow: true });
}
function talkHandoffErrorCode(reason) {
	return reason === "invalid_token" || reason === "no_active_turn" || reason === "stale_turn" ? require_error_codes.ErrorCodes.INVALID_REQUEST : require_error_codes.ErrorCodes.UNAVAILABLE;
}
function getRecord(value) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(value) ?? void 0;
}
function singleRecordKey(record) {
	const keys = record ? Object.keys(record) : [];
	return keys.length === 1 ? keys[0] : void 0;
}
function normalizeRealtimeTransport(value) {
	const transport = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	return transport === "webrtc" || transport === "provider-websocket" || transport === "gateway-relay" || transport === "managed-room" ? transport : void 0;
}
function getVoiceCallProviderConfig(config, sectionName) {
	const section = getRecord(getRecord(getRecord(getRecord(getRecord(config.plugins)?.entries)?.["voice-call"])?.config)?.[sectionName]);
	const providersRaw = getRecord(section?.providers);
	const providers = {};
	if (providersRaw) for (const [providerId, providerConfig] of Object.entries(providersRaw)) {
		const record = getRecord(providerConfig);
		if (record) providers[providerId] = record;
	}
	return {
		provider: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(section?.provider),
		providers: Object.keys(providers).length > 0 ? providers : void 0
	};
}
function getVoiceCallRealtimeConfig(config) {
	return getVoiceCallProviderConfig(config, "realtime");
}
function getVoiceCallStreamingConfig(config) {
	return getVoiceCallProviderConfig(config, "streaming");
}
function listTalkTranscriptionProviders(config, configuredProviderIds) {
	const providers = listRealtimeTranscriptionProviders(config);
	for (const providerId of configuredProviderIds) {
		const configuredProvider = getRealtimeTranscriptionProvider(providerId, config);
		if (configuredProvider && !providers.some((provider) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(provider.id) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(configuredProvider.id))) providers.push(configuredProvider);
	}
	return providers;
}
function resolveConfiguredVoiceModelDefaultRef(params) {
	const configuredProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider);
	const refs = require_voice_models.resolveSupportedVoiceModelRefs({
		config: params.config.agents?.defaults?.voiceModel,
		providers: params.providers,
		providerId: configuredProvider
	});
	for (const ref of refs) {
		const provider = params.providers.find((entry) => require_voice_models.providerMatchesId(entry, ref.provider));
		if (!provider) continue;
		if (!configuredProvider) {
			const rawConfig = require_voice_models.getVoiceProviderConfig({
				providerConfigs: params.providerConfigs,
				provider
			});
			const rawConfigWithModel = rawConfig.model === void 0 ? {
				...rawConfig,
				model: ref.model
			} : rawConfig;
			const providerConfig = provider.resolveConfig?.({
				cfg: params.config,
				rawConfig: rawConfigWithModel
			}) ?? rawConfigWithModel;
			if (!configuredOrFalse(() => provider.isConfigured({
				cfg: params.config,
				providerConfig
			}))) continue;
		}
		return {
			provider: provider.id,
			model: ref.model
		};
	}
}
function buildTalkRealtimeConfig(config, requestedProvider) {
	const voiceCallRealtime = getVoiceCallRealtimeConfig(config);
	const talkRealtime = getRecord(config.talk?.realtime);
	const talkRealtimeProviderConfigs = talkRealtime?.providers;
	const explicitProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(requestedProvider) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(talkRealtime?.provider);
	const singleConfiguredProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(singleRecordKey(talkRealtimeProviderConfigs));
	const selectedProvider = explicitProvider ?? singleConfiguredProvider ?? voiceCallRealtime.provider ?? singleConfiguredProvider;
	const providerConfigs = {
		...voiceCallRealtime.providers,
		...talkRealtimeProviderConfigs
	};
	const voiceModelDefault = resolveConfiguredVoiceModelDefaultRef({
		config,
		provider: selectedProvider,
		providerConfigs,
		providers: listRealtimeVoiceProviders(config)
	});
	return {
		provider: selectedProvider ?? voiceModelDefault?.provider,
		providers: providerConfigs,
		model: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(talkRealtime?.model) ?? voiceModelDefault?.model,
		voice: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(talkRealtime?.speakerVoice) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(talkRealtime?.speakerVoiceId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(talkRealtime?.voice),
		instructions: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(talkRealtime?.instructions),
		mode: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(talkRealtime?.mode),
		transport: normalizeRealtimeTransport(talkRealtime?.transport),
		vadThreshold: typeof talkRealtime?.vadThreshold === "number" && Number.isFinite(talkRealtime.vadThreshold) ? talkRealtime.vadThreshold : void 0,
		silenceDurationMs: typeof talkRealtime?.silenceDurationMs === "number" && Number.isFinite(talkRealtime.silenceDurationMs) ? talkRealtime.silenceDurationMs : void 0,
		prefixPaddingMs: typeof talkRealtime?.prefixPaddingMs === "number" && Number.isFinite(talkRealtime.prefixPaddingMs) ? talkRealtime.prefixPaddingMs : void 0,
		reasoningEffort: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(talkRealtime?.reasoningEffort),
		brain: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(talkRealtime?.brain),
		consultRouting: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(talkRealtime?.consultRouting)
	};
}
function buildTalkTranscriptionConfig(config, requestedProvider) {
	const streamingConfig = getVoiceCallStreamingConfig(config);
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(requestedProvider) ?? streamingConfig.provider;
	const providerConfigs = streamingConfig.providers ?? {};
	const voiceModelDefault = resolveConfiguredVoiceModelDefaultRef({
		config,
		provider,
		providerConfigs,
		providers: listTalkTranscriptionProviders(config, [provider, ...Object.keys(providerConfigs)])
	});
	return {
		provider: provider ?? voiceModelDefault?.provider,
		providers: providerConfigs,
		model: voiceModelDefault?.model
	};
}
function configuredOrFalse(callback) {
	try {
		return callback();
	} catch {
		return false;
	}
}
function resolveConfiguredRealtimeTranscriptionProvider(params) {
	const normalizedConfigured = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.configuredProviderId);
	const providers = normalizedConfigured ? [getRealtimeTranscriptionProvider(normalizedConfigured, params.config)].filter((provider) => provider !== void 0) : listTalkTranscriptionProviders(params.config, Object.keys(params.providerConfigs));
	const orderedProviders = normalizedConfigured ? providers : providers.toSorted((a, b) => (a.autoSelectOrder ?? 1e3) - (b.autoSelectOrder ?? 1e3));
	for (const provider of orderedProviders) {
		const rawConfig = require_voice_models.getVoiceProviderConfig({
			providerConfigs: params.providerConfigs,
			provider,
			configuredProviderId: params.configuredProviderId
		});
		const rawConfigWithModel = params.defaultModel && rawConfig.model === void 0 ? {
			...rawConfig,
			model: params.defaultModel
		} : rawConfig;
		const providerConfig = provider.resolveConfig?.({
			cfg: params.config,
			rawConfig: rawConfigWithModel
		}) ?? rawConfigWithModel;
		if (configuredOrFalse(() => provider.isConfigured({
			cfg: params.config,
			providerConfig
		}))) return {
			provider,
			providerConfig
		};
	}
	if (normalizedConfigured) throw new Error(`Realtime transcription provider "${params.configuredProviderId}" is not configured`);
	throw new Error("No realtime transcription provider registered");
}
const DEFAULT_REALTIME_INSTRUCTIONS = [
	"You are Operator's realtime voice interface. Keep spoken replies concise.",
	`If the user asks for code, repository state, files, current Operator context, tool-backed actions, or deeper reasoning, call ${REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME} and then summarize the result naturally.`,
	`Do not claim you cannot use tools, perform actions, or reach Operator unless ${REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME} returns that failure.`,
	`When ${REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME} is in progress, speak one brief acknowledgement such as "Let me check that for you", then wait for the final Operator result before answering with the actual result.`,
	`If Operator is already working through ${REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME} and the user asks in any language for progress, cancellation, a redirect/change, or a follow-up, call ${REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME} with the semantic mode.`,
	"For greetings and casual chatter while Operator is working, answer naturally and do not redirect the active work."
].join(" ");
function buildRealtimeInstructions(configuredInstructions) {
	const extra = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(configuredInstructions);
	if (!extra) return DEFAULT_REALTIME_INSTRUCTIONS;
	return `${DEFAULT_REALTIME_INSTRUCTIONS}\n\nAdditional realtime instructions:\n${extra}`;
}
function buildRealtimeVoiceLaunchOptions(params) {
	return {
		...pickRealtimeVoiceLaunchOptions(params.defaults),
		...pickRealtimeVoiceLaunchOptions(params.requested)
	};
}
function withRealtimeBrowserOverrides(providerConfig, params) {
	const overrides = {};
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model);
	const voice = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.voice);
	const reasoningEffort = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.reasoningEffort);
	if (model) overrides.model = model;
	if (voice) overrides.voice = voice;
	if (typeof params.vadThreshold === "number" && Number.isFinite(params.vadThreshold)) overrides.vadThreshold = params.vadThreshold;
	if (typeof params.silenceDurationMs === "number" && Number.isFinite(params.silenceDurationMs)) overrides.silenceDurationMs = params.silenceDurationMs;
	if (typeof params.prefixPaddingMs === "number" && Number.isFinite(params.prefixPaddingMs)) overrides.prefixPaddingMs = params.prefixPaddingMs;
	if (reasoningEffort) overrides.reasoningEffort = reasoningEffort;
	return Object.keys(overrides).length > 0 ? {
		...providerConfig,
		...overrides
	} : providerConfig;
}
function pickRealtimeVoiceLaunchOptions(params) {
	const options = {};
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model);
	const voice = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.voice);
	const reasoningEffort = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.reasoningEffort);
	if (model) options.model = model;
	if (voice) options.voice = voice;
	if (typeof params.vadThreshold === "number" && Number.isFinite(params.vadThreshold)) options.vadThreshold = params.vadThreshold;
	if (typeof params.silenceDurationMs === "number" && Number.isFinite(params.silenceDurationMs)) options.silenceDurationMs = params.silenceDurationMs;
	if (typeof params.prefixPaddingMs === "number" && Number.isFinite(params.prefixPaddingMs)) options.prefixPaddingMs = params.prefixPaddingMs;
	if (reasoningEffort) options.reasoningEffort = reasoningEffort;
	return options;
}
function isUnsupportedBrowserWebRtcSession(session) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(session.provider);
	const transport = session.transport ?? "webrtc";
	return provider === "google" && transport === "webrtc";
}
//#endregion
//#region src/gateway/server-methods/talk-client.ts
/**
* Gateway methods for browser-owned realtime Talk sessions.
*
* These handlers create provider browser sessions and bridge client-owned tool
* calls back into Operator agent consult runs.
*/
const talkClientHandlers = {
	"talk.client.create": async ({ params, respond, context }) => {
		if (!require_src.validateTalkClientCreateParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid talk.client.create params: ${require_validation_errors.formatValidationErrors(require_src.validateTalkClientCreateParams.errors)}`));
			return;
		}
		const typedParams = params;
		try {
			const runtimeConfig = context.getRuntimeConfig();
			const realtimeConfig = buildTalkRealtimeConfig(runtimeConfig, typedParams.provider);
			const mode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(typedParams.mode) ?? realtimeConfig.mode ?? "realtime";
			if (mode !== "realtime") {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `talk.client.create only supports mode="realtime"; use talk.catalog for ${mode} provider discovery`));
				return;
			}
			if (((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(typedParams.brain) ?? realtimeConfig.brain ?? "agent-consult") !== "agent-consult") {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `talk.client.create only supports brain="agent-consult"`));
				return;
			}
			const transport = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(typedParams.transport) ?? realtimeConfig.transport;
			if (transport === "managed-room") {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "managed-room realtime Talk sessions are not available in the browser UI yet"));
				return;
			}
			if (transport === "gateway-relay") {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `talk.client.create is client-owned; use talk.session.create for gateway-relay`));
				return;
			}
			const resolution = resolveConfiguredRealtimeVoiceProvider({
				configuredProviderId: realtimeConfig.provider,
				providerConfigs: realtimeConfig.providers,
				cfg: runtimeConfig,
				cfgForResolve: runtimeConfig,
				defaultModel: realtimeConfig.model,
				noRegisteredProviderMessage: "No realtime voice provider registered"
			});
			const launchOptions = buildRealtimeVoiceLaunchOptions({
				requested: typedParams,
				defaults: realtimeConfig
			});
			if (resolution.provider.createBrowserSession && transport !== "gateway-relay") {
				const session = await resolution.provider.createBrowserSession({
					cfg: runtimeConfig,
					providerConfig: resolution.providerConfig,
					instructions: buildRealtimeInstructions(realtimeConfig.instructions),
					tools: [REALTIME_VOICE_AGENT_CONSULT_TOOL, REALTIME_VOICE_AGENT_CONTROL_TOOL],
					...launchOptions
				});
				if (!isUnsupportedBrowserWebRtcSession(session) && (!transport || session.transport === transport)) {
					respond(true, session, void 0);
					return;
				}
				if (transport) {
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `Realtime provider "${resolution.provider.id}" does not support requested browser transport "${transport}"`));
					return;
				}
			}
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `Realtime provider "${resolution.provider.id}" does not support client-owned realtime sessions`));
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"talk.client.toolCall": async (request) => {
		const { params, respond } = request;
		if (!require_src.validateTalkClientToolCallParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid talk.client.toolCall params: ${require_validation_errors.formatValidationErrors(require_src.validateTalkClientToolCallParams.errors)}`));
			return;
		}
		if (params.name !== "operator_agent_consult") {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unsupported realtime Talk tool: ${params.name}`));
			return;
		}
		const result = await startTalkRealtimeAgentConsult({
			context: request.context,
			client: request.client,
			isWebchatConnect: request.isWebchatConnect,
			requestId: request.req.id,
			sessionKey: params.sessionKey,
			callId: params.callId,
			args: params.args ?? {},
			relaySessionId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.relaySessionId),
			connId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.client?.connId)
		});
		if (!result.ok) {
			respond(false, void 0, result.error);
			return;
		}
		respond(true, {
			runId: result.runId,
			idempotencyKey: result.idempotencyKey
		}, void 0);
	},
	"talk.client.steer": async ({ params, respond, client, context }) => {
		if (!require_src.validateTalkClientSteerParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid talk.client.steer params: ${require_validation_errors.formatValidationErrors(require_src.validateTalkClientSteerParams.errors)}`));
			return;
		}
		if (!hasOwnedActiveTalkClientRun({
			context,
			clientConnId: client?.connId,
			sessionKey: params.sessionKey
		})) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "talk.client.steer requires an active browser-owned Talk run"));
			return;
		}
		try {
			respond(true, await controlRealtimeVoiceAgentRun({
				sessionKey: params.sessionKey,
				text: params.text,
				mode: params.mode
			}), void 0);
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	}
};
function hasOwnedActiveTalkClientRun(params) {
	const connId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.clientConnId);
	const sessionKey = params.sessionKey.trim();
	if (!connId || !sessionKey) return false;
	for (const entry of params.context.chatAbortControllers.values()) if (entry.sessionKey === sessionKey && entry.ownerConnId === connId && entry.kind !== "agent") return true;
	return false;
}
//#endregion
//#region src/gateway/talk-handoff.ts
const DEFAULT_TALK_HANDOFF_TTL_MS = 600 * 1e3;
const MAX_TALK_HANDOFF_TTL_MS = 3600 * 1e3;
const handoffs = /* @__PURE__ */ new Map();
/** Creates a short-lived Talk room and returns the only plaintext join token. */
function createTalkHandoff(params) {
	pruneExpiredTalkHandoffs();
	const rawCreatedAt = Date.now();
	const createdAt = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveDateTimestampMs)(rawCreatedAt);
	const expiresAt = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(normalizeTtlMs(params.ttlMs), { nowMs: rawCreatedAt }) ?? 0;
	const id = (0, node_crypto.randomUUID)();
	const roomId = `talk_${id}`;
	const token = (0, node_crypto.randomBytes)(32).toString("base64url");
	const room = createTalkHandoffRoom({
		roomId,
		mode: params.mode ?? "stt-tts",
		transport: params.transport ?? "managed-room",
		brain: params.brain ?? "agent-consult",
		provider: params.provider
	});
	const record = {
		id,
		roomId,
		roomUrl: `/talk/rooms/${roomId}`,
		tokenHash: hashTalkHandoffToken(token),
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		channel: params.channel,
		target: params.target,
		provider: params.provider,
		model: params.model,
		voice: params.voice,
		mode: params.mode ?? "stt-tts",
		transport: params.transport ?? "managed-room",
		brain: params.brain ?? "agent-consult",
		createdAt,
		expiresAt,
		room
	};
	appendTalkHandoffRoomEvent(record, {
		type: "session.started",
		payload: {
			handoffId: id,
			roomId
		}
	});
	handoffs.set(id, record);
	return {
		...toPublicTalkHandoffRecord(record),
		token
	};
}
/** Returns a non-expired handoff record for gateway-internal callers. */
function getTalkHandoff(id) {
	pruneExpiredTalkHandoffs();
	return handoffs.get(id);
}
/** Joins a managed room, replacing any previous active client for that room. */
function joinTalkHandoff(id, token, opts = {}) {
	const access = resolveTalkHandoffAccess(id, token);
	if (!access.ok) return access;
	const record = access.record;
	const previousClientId = record.room.activeClientId;
	const events = joinTalkHandoffRoom(record, opts.clientId);
	const replacedClientId = previousClientId && previousClientId !== opts.clientId ? previousClientId : void 0;
	const replacementEvents = replacedClientId ? events.filter((event) => event.type === "session.replaced") : [];
	const activeClientEvents = replacedClientId ? events.filter((event) => event.type !== "session.replaced") : events;
	return {
		ok: true,
		record: toPublicTalkHandoffRecord(record),
		events,
		replacedClientId,
		replacementEvents,
		activeClientEvents
	};
}
/** Starts a client turn in a joined managed room. */
function startTalkHandoffTurn(id, token, opts = {}) {
	const access = resolveTalkHandoffAccess(id, token);
	if (!access.ok) return access;
	const record = access.record;
	if (opts.clientId) record.room.activeClientId = opts.clientId;
	const turnId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.turnId) ?? (0, node_crypto.randomUUID)();
	const turn = record.room.talk.startTurn({
		turnId,
		payload: {
			handoffId: id,
			roomId: record.roomId,
			clientId: record.room.activeClientId
		}
	});
	return {
		ok: true,
		record: toPublicTalkHandoffRecord(record),
		turnId,
		events: turn.event ? [turn.event] : []
	};
}
/** Ends the active managed-room turn and returns the emitted Talk event. */
function endTalkHandoffTurn(id, token, opts = {}) {
	const access = resolveTalkHandoffAccess(id, token);
	if (!access.ok) return access;
	const record = access.record;
	const result = record.room.talk.endTurn({
		turnId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.turnId),
		payload: {
			handoffId: id,
			roomId: record.roomId
		}
	});
	if (!result.ok) return result;
	return {
		ok: true,
		record: toPublicTalkHandoffRecord(record),
		turnId: result.turnId,
		events: [result.event]
	};
}
/** Cancels the active managed-room turn with a client-visible reason. */
function cancelTalkHandoffTurn(id, token, opts = {}) {
	const access = resolveTalkHandoffAccess(id, token);
	if (!access.ok) return access;
	const record = access.record;
	const result = record.room.talk.cancelTurn({
		turnId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.turnId),
		payload: {
			handoffId: id,
			roomId: record.roomId,
			reason: opts.reason ?? "client-cancelled"
		}
	});
	if (!result.ok) return result;
	return {
		ok: true,
		record: toPublicTalkHandoffRecord(record),
		turnId: result.turnId,
		events: [result.event]
	};
}
/** Revokes a handoff and emits the final room-close event if it existed. */
function revokeTalkHandoff(id) {
	pruneExpiredTalkHandoffs();
	const record = handoffs.get(id);
	if (!record) return {
		revoked: false,
		events: []
	};
	const event = appendTalkHandoffRoomEvent(record, {
		type: "session.closed",
		payload: {
			reason: "revoked",
			handoffId: id,
			roomId: record.roomId
		},
		final: true
	});
	handoffs.delete(id);
	return {
		revoked: true,
		roomId: record.roomId,
		activeClientId: record.room.activeClientId,
		events: [event]
	};
}
/** Verifies the caller token without exposing the stored token hash. */
function verifyTalkHandoffToken(record, token) {
	return record.tokenHash === hashTalkHandoffToken(token);
}
function normalizeTtlMs(value) {
	if (!Number.isFinite(value) || value === void 0) return DEFAULT_TALK_HANDOFF_TTL_MS;
	return Math.min(Math.max(Math.trunc(value), 1e3), MAX_TALK_HANDOFF_TTL_MS);
}
function pruneExpiredTalkHandoffs(now = Date.now()) {
	const validNow = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(now);
	if (validNow === void 0) return;
	for (const [id, record] of handoffs) if (!(0, _gabrielvfonseca_normalization_core_number_coercion.isFutureDateTimestampMs)(record.expiresAt, { nowMs: validNow })) {
		appendTalkHandoffRoomEvent(record, {
			type: "session.closed",
			payload: {
				reason: "expired",
				handoffId: id,
				roomId: record.roomId
			},
			final: true
		});
		handoffs.delete(id);
	}
}
function hashTalkHandoffToken(token) {
	return require_crypto_digest.sha256Base64Url(token);
}
function toPublicTalkHandoffRecord(record) {
	const { tokenHash: _tokenHash, room: _room, ...publicRecord } = record;
	return {
		...publicRecord,
		room: {
			activeClientId: record.room.activeClientId,
			activeTurnId: record.room.talk.activeTurnId,
			recentTalkEvents: [...record.room.talk.recentEvents]
		}
	};
}
function createTalkHandoffRoom(params) {
	return { talk: createTalkSessionController({
		sessionId: params.roomId,
		mode: params.mode,
		transport: params.transport,
		brain: params.brain,
		provider: params.provider
	}, { onEvent: recordTalkObservabilityEvent }) };
}
function resolveTalkHandoffAccess(id, token) {
	const record = handoffs.get(id);
	if (!record) return {
		ok: false,
		reason: "not_found"
	};
	if (!(0, _gabrielvfonseca_normalization_core_number_coercion.isFutureDateTimestampMs)(record.expiresAt)) {
		appendTalkHandoffRoomEvent(record, {
			type: "session.closed",
			payload: {
				reason: "expired",
				handoffId: id,
				roomId: record.roomId
			},
			final: true
		});
		handoffs.delete(id);
		return {
			ok: false,
			reason: "expired"
		};
	}
	if (!verifyTalkHandoffToken(record, token)) return {
		ok: false,
		reason: "invalid_token"
	};
	return {
		ok: true,
		record
	};
}
function appendTalkHandoffRoomEvent(record, input) {
	return record.room.talk.emit(input);
}
function joinTalkHandoffRoom(record, clientId) {
	const events = [];
	if (record.room.activeClientId && record.room.activeClientId !== clientId) events.push(appendTalkHandoffRoomEvent(record, {
		type: "session.replaced",
		payload: {
			handoffId: record.id,
			roomId: record.roomId,
			previousClientId: record.room.activeClientId,
			nextClientId: clientId
		}
	}));
	record.room.activeClientId = clientId;
	events.push(appendTalkHandoffRoomEvent(record, {
		type: "session.ready",
		payload: {
			handoffId: record.id,
			roomId: record.roomId,
			clientId
		}
	}));
	return events;
}
//#endregion
//#region src/gateway/talk-transcription-relay.ts
/**
* Gateway-owned relay for streaming speech-to-text providers used by Talk.
*
* The relay accepts browser audio on one WebSocket connection, forwards it to a
* realtime transcription provider, and mirrors provider callbacks into Talk
* events for the same connection.
*/
const TRANSCRIPTION_SESSION_TTL_MS = 1800 * 1e3;
const MAX_AUDIO_BASE64_BYTES = 512 * 1024;
const MAX_TRANSCRIPTION_SESSIONS_PER_CONN = 2;
const MAX_TRANSCRIPTION_SESSIONS_GLOBAL = 64;
const TRANSCRIPTION_EVENT = "talk.event";
const RELAY_INPUT_ENCODING = "g711_ulaw";
const RELAY_INPUT_SAMPLE_RATE_HZ = 8e3;
const transcriptionSessions = /* @__PURE__ */ new Map();
/** Normalizes common provider audio-format aliases into the relay contract. */
function normalizeRelayInputEncoding(value) {
	if (typeof value !== "string") return;
	const normalized = value.trim().toLowerCase();
	if (!normalized) return;
	if (normalized === "mulaw" || normalized === "ulaw" || normalized === "g711_ulaw" || normalized === "g711-mulaw" || normalized === "pcm_mulaw" || normalized === "audio/pcmu" || normalized === "ulaw_8000") return "g711_ulaw";
	if (normalized === "alaw" || normalized === "g711_alaw" || normalized === "g711-alaw" || normalized === "pcm_alaw") return "g711_alaw";
	if (normalized === "pcm" || normalized === "pcm16" || normalized === "linear16" || normalized === "pcm_s16le") return "pcm16";
}
function inferSampleRateFromAudioFormat(value) {
	if (typeof value !== "string") return;
	const match = value.match(/_(\d+)$/);
	return match ? (0, _gabrielvfonseca_normalization_core_number_coercion.parseFiniteNumber)(match[1]) : void 0;
}
/** Verifies provider config matches the audio format the browser relay emits. */
function assertRelayInputAudioConfig(providerConfig) {
	const encodingValue = providerConfig.encoding ?? providerConfig.audioFormat ?? providerConfig.audio_format;
	const encoding = normalizeRelayInputEncoding(encodingValue);
	if (encoding && encoding !== RELAY_INPUT_ENCODING) throw new Error(`Gateway transcription relay requires ${RELAY_INPUT_ENCODING}/${RELAY_INPUT_SAMPLE_RATE_HZ} audio`);
	const sampleRate = (0, _gabrielvfonseca_normalization_core_number_coercion.parseFiniteNumber)(providerConfig.sampleRate ?? providerConfig.sample_rate) ?? inferSampleRateFromAudioFormat(encodingValue);
	if (sampleRate && sampleRate !== RELAY_INPUT_SAMPLE_RATE_HZ) throw new Error(`Gateway transcription relay requires ${RELAY_INPUT_ENCODING}/${RELAY_INPUT_SAMPLE_RATE_HZ} audio`);
}
function broadcastToOwner(context, connId, event) {
	context.broadcastToConnIds(TRANSCRIPTION_EVENT, event, /* @__PURE__ */ new Set([connId]), { dropIfSlow: true });
}
function ensureTranscriptionTurn(session) {
	const turn = session.talk.ensureTurn();
	if (turn.event) broadcastToOwner(session.context, session.connId, {
		transcriptionSessionId: session.id,
		type: "speechStart",
		talkEvent: turn.event
	});
	return turn.turnId;
}
function closeTranscriptionSession(session, reason) {
	if (session.closed) return;
	session.closed = true;
	transcriptionSessions.delete(session.id);
	clearTimeout(session.cleanupTimer);
	session.sttSession.close();
	broadcastToOwner(session.context, session.connId, {
		transcriptionSessionId: session.id,
		type: "close",
		reason,
		talkEvent: session.talk.emit({
			type: "session.closed",
			payload: { reason },
			final: true
		})
	});
}
function pruneExpiredTranscriptionSessions(nowMs = Date.now()) {
	closeExpiredTalkRelaySessions({
		sessions: transcriptionSessions.values(),
		closeSession: (session) => closeTranscriptionSession(session, "completed"),
		nowMs
	});
}
function countTranscriptionSessionsForConn(connId) {
	let count = 0;
	for (const session of transcriptionSessions.values()) if (session.connId === connId) count += 1;
	return count;
}
function enforceTranscriptionSessionLimits(connId) {
	pruneExpiredTranscriptionSessions();
	if (transcriptionSessions.size >= MAX_TRANSCRIPTION_SESSIONS_GLOBAL) throw new Error("Too many active transcription Talk sessions");
	if (countTranscriptionSessionsForConn(connId) >= MAX_TRANSCRIPTION_SESSIONS_PER_CONN) throw new Error("Too many active transcription Talk sessions for this connection");
}
/** Creates a transcription relay session and returns its browser audio contract. */
function createTalkTranscriptionRelaySession(params) {
	enforceTranscriptionSessionLimits(params.connId);
	assertRelayInputAudioConfig(params.providerConfig);
	const transcriptionSessionId = (0, node_crypto.randomUUID)();
	const expiresAtMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(TRANSCRIPTION_SESSION_TTL_MS);
	if (expiresAtMs === void 0) throw new Error("Transcription relay session expiry is outside the supported Date range");
	const talk = createTalkSessionController({
		sessionId: transcriptionSessionId,
		mode: "transcription",
		transport: "gateway-relay",
		brain: "none",
		provider: params.provider.id
	}, { onEvent: recordTalkObservabilityEvent });
	const emit = (event, talkEvent) => {
		broadcastToOwner(params.context, params.connId, {
			...event,
			...talkEvent ? { talkEvent: talk.emit(talkEvent) } : {}
		});
	};
	const relayRef = {};
	const ensureTurnId = () => {
		const relay = relayRef.current;
		return relay ? ensureTranscriptionTurn(relay) : "turn-1";
	};
	const sttSession = params.provider.createSession({
		cfg: params.context.getRuntimeConfig(),
		providerConfig: params.providerConfig,
		onSpeechStart: () => {
			ensureTurnId();
		},
		onPartial: (text) => {
			const turnId = ensureTurnId();
			emit({
				transcriptionSessionId,
				type: "partial",
				text
			}, {
				type: "transcript.delta",
				turnId,
				payload: { text }
			});
		},
		onTranscript: (text) => {
			const turnId = ensureTurnId();
			emit({
				transcriptionSessionId,
				type: "transcript",
				text,
				final: true
			}, {
				type: "transcript.done",
				turnId,
				payload: { text },
				final: true
			});
			const relay = relayRef.current;
			if (relay) {
				const ended = relay.talk.endTurn({
					turnId,
					payload: {}
				});
				if (ended.ok) broadcastToOwner(relay.context, relay.connId, {
					transcriptionSessionId,
					type: "transcript",
					text: "",
					final: true,
					talkEvent: ended.event
				});
			}
		},
		onError: (error) => {
			emit({
				transcriptionSessionId,
				type: "error",
				message: error.message
			}, {
				type: "session.error",
				payload: { message: error.message },
				final: true
			});
			const relay = relayRef.current;
			if (relay) closeTranscriptionSession(relay, "error");
		}
	});
	const relay = {
		id: transcriptionSessionId,
		connId: params.connId,
		context: params.context,
		provider: params.provider,
		sttSession,
		talk,
		expiresAtMs,
		cleanupTimer: setTimeout(() => {
			const active = transcriptionSessions.get(transcriptionSessionId);
			if (active) closeTranscriptionSession(active, "completed");
		}, TRANSCRIPTION_SESSION_TTL_MS),
		closed: false
	};
	relayRef.current = relay;
	relay.cleanupTimer.unref?.();
	transcriptionSessions.set(transcriptionSessionId, relay);
	sttSession.connect().then(() => {
		emit({
			transcriptionSessionId,
			type: "ready"
		}, {
			type: "session.ready",
			payload: null
		});
	}).catch((error) => {
		emit({
			transcriptionSessionId,
			type: "error",
			message: error instanceof Error ? error.message : String(error)
		}, {
			type: "session.error",
			payload: { message: error instanceof Error ? error.message : String(error) },
			final: true
		});
		const active = transcriptionSessions.get(transcriptionSessionId);
		if (active) closeTranscriptionSession(active, "error");
	});
	return {
		provider: params.provider.id,
		mode: "transcription",
		transport: "gateway-relay",
		transcriptionSessionId,
		audio: {
			inputEncoding: RELAY_INPUT_ENCODING,
			inputSampleRateHz: RELAY_INPUT_SAMPLE_RATE_HZ
		},
		expiresAt: Math.floor(expiresAtMs / 1e3)
	};
}
function getTranscriptionSession(transcriptionSessionId, connId) {
	return requireActiveTalkRelaySession({
		sessions: transcriptionSessions,
		sessionId: transcriptionSessionId,
		connId,
		closeSession: (session) => closeTranscriptionSession(session, "completed"),
		unknownSessionMessage: "Unknown transcription Talk session"
	});
}
/** Streams one base64-encoded audio frame into the owning transcription relay. */
function sendTalkTranscriptionRelayAudio(params) {
	if (params.audioBase64.length > MAX_AUDIO_BASE64_BYTES) throw new Error("Transcription Talk audio frame is too large");
	const session = getTranscriptionSession(params.transcriptionSessionId, params.connId);
	const audio = Buffer.from(params.audioBase64, "base64");
	const turnId = ensureTranscriptionTurn(session);
	session.sttSession.sendAudio(audio);
	broadcastToOwner(session.context, session.connId, {
		transcriptionSessionId: session.id,
		type: "inputAudio",
		byteLength: audio.byteLength,
		talkEvent: session.talk.emit({
			type: "input.audio.delta",
			turnId,
			payload: { byteLength: audio.byteLength }
		})
	});
}
/** Commits the current transcription turn and closes the relay. */
function stopTalkTranscriptionRelaySession(params) {
	const session = getTranscriptionSession(params.transcriptionSessionId, params.connId);
	if (session.talk.activeTurnId) broadcastToOwner(session.context, session.connId, {
		transcriptionSessionId: session.id,
		type: "transcript",
		text: "",
		final: true,
		talkEvent: session.talk.emit({
			type: "input.audio.committed",
			turnId: session.talk.activeTurnId,
			payload: {},
			final: true
		})
	});
	closeTranscriptionSession(session, "completed");
}
/** Cancels the active transcription turn and closes the relay. */
function cancelTalkTranscriptionRelayTurn(params) {
	const session = getTranscriptionSession(params.transcriptionSessionId, params.connId);
	const turnId = ensureTranscriptionTurn(session);
	const cancelled = session.talk.cancelTurn({
		turnId,
		payload: { reason: params.reason ?? "client-cancelled" }
	});
	broadcastToOwner(session.context, session.connId, {
		transcriptionSessionId: session.id,
		type: "transcript",
		text: "",
		final: true,
		talkEvent: cancelled.ok ? cancelled.event : void 0
	});
	closeTranscriptionSession(session, "completed");
}
//#endregion
//#region src/gateway/server-methods/talk-session-mark.ts
const acknowledgeTalkSessionMark = ({ params, respond, client }) => {
	if (!require_validation.assertValidParams(params, require_src.validateTalkSessionAcknowledgeMarkParams, "talk.session.acknowledgeMark", respond)) return;
	try {
		const session = getUnifiedTalkSession(params.sessionId);
		if (session.kind !== "realtime-relay") {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "talk.session.acknowledgeMark requires realtime relay"));
			return;
		}
		acknowledgeTalkRealtimeRelayMark({
			relaySessionId: session.relaySessionId,
			connId: requireUnifiedTalkSessionConn(session, client?.connId),
			markName: params.markName
		});
		respond(true, { ok: true }, void 0);
	} catch (error) {
		const message = require_ws_log.formatForLog(error);
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, message, { details: { talkIssue: {
			code: "realtime_unavailable",
			message,
			phase: "request"
		} } }));
	}
};
//#endregion
//#region src/gateway/server-methods/talk-session.ts
function normalizeTalkSessionMode(params) {
	const mode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.mode);
	if (mode) return mode;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.transport) === "managed-room" ? "stt-tts" : "realtime";
}
function normalizeTalkSessionTransport(params) {
	const transport = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.transport);
	if (transport) return transport;
	return params.mode === "stt-tts" ? "managed-room" : "gateway-relay";
}
function normalizeTalkSessionBrain(params) {
	const brain = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.brain);
	if (brain) return brain;
	return params.mode === "transcription" ? "none" : "agent-consult";
}
function isActiveManagedRoomClient(session, connId) {
	if (!connId) return false;
	return getTalkHandoff(session.handoffId)?.room.activeClientId === connId;
}
function canCloseManagedRoomSession(session, connId) {
	const handoff = getTalkHandoff(session.handoffId);
	return !handoff?.room.activeClientId || handoff.room.activeClientId === connId;
}
function canCreateUnscopedManagedRoomSession(client) {
	return client?.connect?.scopes?.includes(require_operator_scopes.ADMIN_SCOPE) === true;
}
function managedRoomOwnershipError(action) {
	return require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `talk.session.${action} requires the active managed-room connection`);
}
function respondInvalidRequest(respond, message) {
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, message));
}
function respondUnavailable(respond, err) {
	const message = require_ws_log.formatForLog(err);
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, message, { details: { talkIssue: {
		code: "realtime_unavailable",
		message,
		phase: "request"
	} } }));
}
function respondOk(respond, payload = { ok: true }) {
	respond(true, payload, void 0);
}
function respondManagedRoomTurn(params) {
	if (params.session.kind !== "managed-room") {
		respondInvalidRequest(params.respond, `${params.method} requires managed-room`);
		return;
	}
	if (!isActiveManagedRoomClient(params.session, params.connId)) {
		params.respond(false, void 0, managedRoomOwnershipError(params.ownershipAction));
		return;
	}
	const result = params.run(params.session);
	if (!result.ok) {
		params.respond(false, void 0, require_error_codes.errorShape(talkHandoffErrorCode(result.reason), `talk turn ${params.failureVerb} failed: ${result.reason}`));
		return;
	}
	broadcastTalkRoomEvents(params.context, result.record.room.activeClientId, {
		handoffId: result.record.id,
		roomId: result.record.roomId,
		events: result.events
	});
	respondOk(params.respond, {
		ok: true,
		turnId: result.turnId,
		events: result.events
	});
}
/** RPC handlers for gateway-managed Talk sessions and room lifecycle. */
const talkSessionHandlers = {
	"talk.session.create": async ({ params, respond, context, client }) => {
		if (!require_validation.assertValidParams(params, require_src.validateTalkSessionCreateParams, "talk.session.create", respond)) return;
		const mode = normalizeTalkSessionMode(params);
		const transport = normalizeTalkSessionTransport({
			mode,
			transport: params.transport
		});
		const brain = normalizeTalkSessionBrain({
			mode,
			brain: params.brain
		});
		if (transport === "webrtc" || transport === "provider-websocket") {
			respondInvalidRequest(respond, `talk.session.create is Gateway-managed; use talk.client.create for client transport "${transport}"`);
			return;
		}
		try {
			if (transport === "managed-room") {
				if (brain === "direct-tools" && !canUseTalkDirectTools(client)) {
					respondInvalidRequest(respond, `talk.session.create brain="direct-tools" requires gateway scope: ${require_operator_scopes.ADMIN_SCOPE}`);
					return;
				}
				const spawnedBy = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.spawnedBy);
				if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey) && !spawnedBy && !canCreateUnscopedManagedRoomSession(client)) {
					respondInvalidRequest(respond, `talk.session.create managed-room sessionKey requires spawnedBy or gateway scope: ${require_operator_scopes.ADMIN_SCOPE}`);
					return;
				}
				const resolvedSession = await require_sessions_resolve.resolveSessionKeyFromResolveParams({
					cfg: context.getRuntimeConfig(),
					p: {
						key: params.sessionKey,
						...spawnedBy ? { spawnedBy } : {},
						includeGlobal: true,
						includeUnknown: true
					}
				});
				if (!resolvedSession.ok) {
					respond(false, void 0, resolvedSession.error);
					return;
				}
				if ("missing" in resolvedSession) {
					respondInvalidRequest(respond, `No session found: ${params.sessionKey}`);
					return;
				}
				const handoff = createTalkHandoff({
					sessionKey: resolvedSession.key,
					provider: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider),
					model: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model),
					voice: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.voice),
					mode,
					transport,
					brain,
					ttlMs: params.ttlMs
				});
				rememberUnifiedTalkSession(handoff.id, {
					kind: "managed-room",
					handoffId: handoff.id,
					token: handoff.token,
					roomId: handoff.roomId
				});
				respondOk(respond, {
					sessionId: handoff.id,
					provider: handoff.provider,
					mode: handoff.mode,
					transport: handoff.transport,
					brain: handoff.brain,
					handoffId: handoff.id,
					roomId: handoff.roomId,
					roomUrl: handoff.roomUrl,
					token: handoff.token,
					model: handoff.model,
					voice: handoff.voice,
					expiresAt: handoff.expiresAt
				});
				return;
			}
			const connId = client?.connId;
			if (!connId) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "Talk session unavailable"));
				return;
			}
			if (mode === "realtime") {
				if (transport !== "gateway-relay" || brain !== "agent-consult") {
					respondInvalidRequest(respond, `realtime talk.session.create requires transport="gateway-relay" and brain="agent-consult"`);
					return;
				}
				const runtimeConfig = context.getRuntimeConfig();
				const realtimeConfig = buildTalkRealtimeConfig(runtimeConfig, params.provider);
				const resolution = resolveConfiguredRealtimeVoiceProvider({
					configuredProviderId: realtimeConfig.provider,
					providerConfigs: realtimeConfig.providers,
					cfg: runtimeConfig,
					cfgForResolve: runtimeConfig,
					defaultModel: realtimeConfig.model,
					noRegisteredProviderMessage: "No realtime voice provider registered"
				});
				const launchOptions = buildRealtimeVoiceLaunchOptions({
					requested: params,
					defaults: realtimeConfig
				});
				const session = createTalkRealtimeRelaySession({
					context,
					connId,
					cfg: runtimeConfig,
					provider: resolution.provider,
					providerConfig: withRealtimeBrowserOverrides(resolution.providerConfig, launchOptions),
					instructions: buildRealtimeInstructions(realtimeConfig.instructions),
					tools: [REALTIME_VOICE_AGENT_CONSULT_TOOL, REALTIME_VOICE_AGENT_CONTROL_TOOL],
					model: launchOptions.model,
					sessionKey: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey),
					voice: launchOptions.voice,
					forceAgentConsultOnFinalTranscript: realtimeConfig.consultRouting === "force-agent-consult"
				});
				rememberUnifiedTalkSession(session.relaySessionId, {
					kind: "realtime-relay",
					connId,
					relaySessionId: session.relaySessionId
				});
				respondOk(respond, {
					...session,
					sessionId: session.relaySessionId,
					mode,
					brain
				});
				return;
			}
			if (mode === "transcription") {
				if (transport !== "gateway-relay" || brain !== "none") {
					respondInvalidRequest(respond, `transcription talk.session.create requires transport="gateway-relay" and brain="none"`);
					return;
				}
				const runtimeConfig = context.getRuntimeConfig();
				const transcriptionConfig = buildTalkTranscriptionConfig(runtimeConfig, params.provider);
				const resolution = resolveConfiguredRealtimeTranscriptionProvider({
					config: runtimeConfig,
					configuredProviderId: transcriptionConfig.provider,
					providerConfigs: transcriptionConfig.providers,
					defaultModel: transcriptionConfig.model
				});
				const session = createTalkTranscriptionRelaySession({
					context,
					connId,
					provider: resolution.provider,
					providerConfig: resolution.providerConfig
				});
				rememberUnifiedTalkSession(session.transcriptionSessionId, {
					kind: "transcription-relay",
					connId,
					transcriptionSessionId: session.transcriptionSessionId
				});
				respondOk(respond, {
					...session,
					sessionId: session.transcriptionSessionId,
					brain
				});
				return;
			}
			respondInvalidRequest(respond, `stt-tts talk.session.create requires transport="managed-room"`);
		} catch (err) {
			respondUnavailable(respond, err);
		}
	},
	"talk.session.join": async ({ params, respond, client, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateTalkSessionJoinParams, "talk.session.join", respond)) return;
		try {
			const session = getUnifiedTalkSession(params.sessionId);
			if (session.kind !== "managed-room") {
				respondInvalidRequest(respond, "talk.session.join requires a managed-room session");
				return;
			}
			const result = joinTalkHandoff(session.handoffId, params.token, { clientId: client?.connId });
			if (!result.ok) {
				respond(false, void 0, require_error_codes.errorShape(result.reason === "invalid_token" ? require_error_codes.ErrorCodes.INVALID_REQUEST : require_error_codes.ErrorCodes.UNAVAILABLE, `talk session join failed: ${result.reason}`));
				return;
			}
			broadcastTalkRoomEvents(context, result.replacedClientId, {
				handoffId: result.record.id,
				roomId: result.record.roomId,
				events: result.replacementEvents
			});
			broadcastTalkRoomEvents(context, client?.connId, {
				handoffId: result.record.id,
				roomId: result.record.roomId,
				events: result.activeClientEvents
			});
			respondOk(respond, result.record);
		} catch (err) {
			respondUnavailable(respond, err);
		}
	},
	"talk.session.appendAudio": async ({ params, respond, client }) => {
		if (!require_validation.assertValidParams(params, require_src.validateTalkSessionAppendAudioParams, "talk.session.appendAudio", respond)) return;
		try {
			const session = getUnifiedTalkSession(params.sessionId);
			if (session.kind === "realtime-relay") {
				const connId = requireUnifiedTalkSessionConn(session, client?.connId);
				sendTalkRealtimeRelayAudio({
					relaySessionId: session.relaySessionId,
					connId,
					audioBase64: params.audioBase64,
					timestamp: params.timestamp
				});
				respondOk(respond);
				return;
			}
			if (session.kind === "transcription-relay") {
				const connId = requireUnifiedTalkSessionConn(session, client?.connId);
				sendTalkTranscriptionRelayAudio({
					transcriptionSessionId: session.transcriptionSessionId,
					connId,
					audioBase64: params.audioBase64
				});
				respondOk(respond);
				return;
			}
			respondInvalidRequest(respond, "talk.session.appendAudio is not supported for managed-room sessions");
		} catch (err) {
			respondUnavailable(respond, err);
		}
	},
	"talk.session.startTurn": async ({ params, respond, client, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateTalkSessionTurnParams, "talk.session.startTurn", respond)) return;
		try {
			respondManagedRoomTurn({
				session: getUnifiedTalkSession(params.sessionId),
				connId: client?.connId,
				context,
				respond,
				method: "talk.session.startTurn",
				ownershipAction: "startTurn",
				failureVerb: "start",
				run: (managedSession) => startTalkHandoffTurn(managedSession.handoffId, managedSession.token, {
					turnId: params.turnId,
					clientId: client?.connId
				})
			});
		} catch (err) {
			respondUnavailable(respond, err);
		}
	},
	"talk.session.endTurn": async ({ params, respond, client, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateTalkSessionTurnParams, "talk.session.endTurn", respond)) return;
		try {
			respondManagedRoomTurn({
				session: getUnifiedTalkSession(params.sessionId),
				connId: client?.connId,
				context,
				respond,
				method: "talk.session.endTurn",
				ownershipAction: "endTurn",
				failureVerb: "end",
				run: (managedSession) => endTalkHandoffTurn(managedSession.handoffId, managedSession.token, { turnId: params.turnId })
			});
		} catch (err) {
			respondUnavailable(respond, err);
		}
	},
	"talk.session.cancelTurn": async ({ params, respond, client, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateTalkSessionCancelTurnParams, "talk.session.cancelTurn", respond)) return;
		try {
			const session = getUnifiedTalkSession(params.sessionId);
			if (session.kind === "realtime-relay") {
				const connId = requireUnifiedTalkSessionConn(session, client?.connId);
				cancelTalkRealtimeRelayTurn({
					relaySessionId: session.relaySessionId,
					connId,
					reason: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.reason)
				});
				respondOk(respond);
				return;
			}
			if (session.kind === "transcription-relay") {
				const connId = requireUnifiedTalkSessionConn(session, client?.connId);
				cancelTalkTranscriptionRelayTurn({
					transcriptionSessionId: session.transcriptionSessionId,
					connId,
					reason: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.reason)
				});
				respondOk(respond);
				return;
			}
			respondManagedRoomTurn({
				session,
				connId: client?.connId,
				context,
				respond,
				method: "talk.session.cancelTurn",
				ownershipAction: "cancelTurn",
				failureVerb: "cancel",
				run: (managedSession) => cancelTalkHandoffTurn(managedSession.handoffId, managedSession.token, {
					turnId: params.turnId,
					reason: params.reason
				})
			});
		} catch (err) {
			respondUnavailable(respond, err);
		}
	},
	"talk.session.cancelOutput": async ({ params, respond, client }) => {
		if (!require_validation.assertValidParams(params, require_src.validateTalkSessionCancelOutputParams, "talk.session.cancelOutput", respond)) return;
		try {
			const session = getUnifiedTalkSession(params.sessionId);
			if (session.kind !== "realtime-relay") {
				respondInvalidRequest(respond, "talk.session.cancelOutput requires realtime relay");
				return;
			}
			const connId = requireUnifiedTalkSessionConn(session, client?.connId);
			cancelTalkRealtimeRelayTurn({
				relaySessionId: session.relaySessionId,
				connId,
				reason: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.reason) ?? "output-cancelled"
			});
			respondOk(respond);
		} catch (err) {
			respondUnavailable(respond, err);
		}
	},
	"talk.session.acknowledgeMark": acknowledgeTalkSessionMark,
	"talk.session.submitToolResult": async ({ params, respond, client }) => {
		if (!require_validation.assertValidParams(params, require_src.validateTalkSessionSubmitToolResultParams, "talk.session.submitToolResult", respond)) return;
		try {
			const session = getUnifiedTalkSession(params.sessionId);
			if (session.kind !== "realtime-relay") {
				respondInvalidRequest(respond, "talk.session.submitToolResult is only supported for realtime relay sessions");
				return;
			}
			const connId = requireUnifiedTalkSessionConn(session, client?.connId);
			await submitTalkRealtimeRelayToolResult({
				relaySessionId: session.relaySessionId,
				connId,
				callId: params.callId,
				result: params.result,
				options: params.options
			});
			respondOk(respond);
		} catch (err) {
			respondUnavailable(respond, err);
		}
	},
	"talk.session.steer": async ({ params, respond, client }) => {
		if (!require_validation.assertValidParams(params, require_src.validateTalkSessionSteerParams, "talk.session.steer", respond)) return;
		try {
			const session = getUnifiedTalkSession(params.sessionId);
			if (session.kind === "realtime-relay") {
				const connId = requireUnifiedTalkSessionConn(session, client?.connId);
				respondOk(respond, await steerTalkRealtimeRelayAgentRun({
					relaySessionId: session.relaySessionId,
					connId,
					sessionKey: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey),
					text: params.text,
					mode: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.mode)
				}));
				return;
			}
			if (session.kind === "transcription-relay") {
				respondInvalidRequest(respond, "talk.session.steer requires an agent-backed Talk session");
				return;
			}
			if (!isActiveManagedRoomClient(session, client?.connId)) {
				respond(false, void 0, managedRoomOwnershipError("steer"));
				return;
			}
			const handoff = getTalkHandoff(session.handoffId);
			const sessionKey = handoff?.sessionKey;
			if (!sessionKey) {
				respondInvalidRequest(respond, "talk.session.steer requires a session key");
				return;
			}
			const requestedSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
			if (requestedSessionKey && requestedSessionKey !== sessionKey) {
				respondInvalidRequest(respond, "talk.session.steer sessionKey does not match the managed-room session");
				return;
			}
			respondOk(respond, await controlRealtimeVoiceAgentRun({
				sessionKey,
				text: params.text,
				mode: params.mode,
				recentEvents: handoff?.room.talk.recentEvents
			}));
		} catch (err) {
			respondUnavailable(respond, err);
		}
	},
	"talk.session.close": async ({ params, respond, client, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateTalkSessionCloseParams, "talk.session.close", respond)) return;
		try {
			const session = getUnifiedTalkSession(params.sessionId);
			if (session.kind === "realtime-relay") {
				const connId = requireUnifiedTalkSessionConn(session, client?.connId);
				stopTalkRealtimeRelaySession({
					relaySessionId: session.relaySessionId,
					connId
				});
			} else if (session.kind === "transcription-relay") {
				const connId = requireUnifiedTalkSessionConn(session, client?.connId);
				stopTalkTranscriptionRelaySession({
					transcriptionSessionId: session.transcriptionSessionId,
					connId
				});
			} else {
				if (!canCloseManagedRoomSession(session, client?.connId)) {
					respond(false, void 0, managedRoomOwnershipError("close"));
					return;
				}
				const result = revokeTalkHandoff(session.handoffId);
				broadcastTalkRoomEvents(context, result.activeClientId, {
					handoffId: session.handoffId,
					roomId: session.roomId,
					events: result.events
				});
			}
			forgetUnifiedTalkSession(params.sessionId);
			respondOk(respond);
		} catch (err) {
			respondUnavailable(respond, err);
		}
	}
};
//#endregion
//#region src/gateway/server-methods/talk.ts
function resolveCatalogProviderSelection(configuredProvider, resolveAutomaticProvider) {
	try {
		return {
			activeProvider: resolveAutomaticProvider(),
			ready: true
		};
	} catch {
		return {
			...configuredProvider ? { activeProvider: configuredProvider } : {},
			ready: false
		};
	}
}
function canReadTalkSecrets(client) {
	const scopes = Array.isArray(client?.connect?.scopes) ? client.connect.scopes : [];
	return scopes.includes("operator.admin") || scopes.includes("operator.talk.secrets");
}
function asStringRecord(value) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(value);
	if (!record) return;
	const next = {};
	for (const [key, entryValue] of Object.entries(record)) if (typeof entryValue === "string") next[key] = entryValue;
	return Object.keys(next).length > 0 ? next : void 0;
}
function normalizeAliasKey(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
}
function resolveTalkVoiceId(providerConfig, requested) {
	if (!requested) return;
	const aliases = asStringRecord(providerConfig.voiceAliases);
	if (!aliases) return requested;
	const normalizedRequested = normalizeAliasKey(requested);
	for (const [alias, voiceId] of Object.entries(aliases)) if (normalizeAliasKey(alias) === normalizedRequested) return voiceId;
	return requested;
}
function withTalkBaseTtsSpeakerSelectionCompat(baseTts) {
	const next = require_tts.withSpeakerSelectionCompat(baseTts);
	const providers = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(baseTts.providers);
	if (providers) next.providers = Object.fromEntries(Object.entries(providers).map(([providerId, providerConfig]) => [providerId, require_tts.withSpeakerSelectionCompat((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(providerConfig) ?? {})]));
	for (const [key, value] of Object.entries(baseTts)) {
		if (key === "providers") continue;
		const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(value);
		if (record) next[key] = require_tts.withSpeakerSelectionCompat(record);
	}
	return next;
}
function buildTalkTtsConfig(config) {
	const resolved = require_io.resolveActiveTalkProviderConfig(config.talk);
	const provider = require_provider_registry.canonicalizeSpeechProviderId(resolved?.provider, config);
	if (!resolved || !provider) return {
		error: "talk.speak unavailable: talk provider not configured",
		reason: "talk_unconfigured"
	};
	const speechProvider = require_provider_registry.getSpeechProvider(provider, config);
	if (!speechProvider) return {
		error: `talk.speak unavailable: speech provider "${provider}" does not support Talk mode`,
		reason: "talk_provider_unsupported"
	};
	const baseTts = withTalkBaseTtsSpeakerSelectionCompat((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(config.messages?.tts) ?? {});
	const providerConfig = require_tts.withSpeakerSelectionFallbackCompat(resolved.config);
	const resolvedProviderConfig = speechProvider.resolveTalkConfig?.({
		cfg: config,
		baseTtsConfig: baseTts,
		talkProviderConfig: providerConfig,
		timeoutMs: baseTts.timeoutMs ?? 3e4
	}) ?? providerConfig;
	const talkTts = {
		...baseTts,
		auto: "always",
		provider,
		providers: {
			...(0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(baseTts.providers) ?? {},
			[provider]: resolvedProviderConfig
		}
	};
	return {
		provider,
		providerConfig,
		cfg: {
			...config,
			messages: {
				...config.messages,
				tts: talkTts
			}
		}
	};
}
function buildTalkCatalog(config) {
	const ttsConfig = require_tts.resolveTtsConfig(config);
	const activeSpeechProvider = require_provider_registry.canonicalizeSpeechProviderId(require_io.resolveActiveTalkProviderConfig(config.talk)?.provider, config);
	const transcriptionConfig = buildTalkTranscriptionConfig(config);
	const transcriptionSelection = resolveCatalogProviderSelection(canonicalizeRealtimeTranscriptionProviderId(transcriptionConfig.provider, config), () => resolveConfiguredRealtimeTranscriptionProvider({
		config,
		configuredProviderId: transcriptionConfig.provider,
		providerConfigs: transcriptionConfig.providers,
		defaultModel: transcriptionConfig.model
	}).provider.id);
	const activeTranscriptionProvider = transcriptionSelection.activeProvider;
	const realtimeConfig = buildTalkRealtimeConfig(config);
	const realtimeSelection = resolveCatalogProviderSelection(canonicalizeRealtimeVoiceProviderId(realtimeConfig.provider, config), () => resolveConfiguredRealtimeVoiceProvider({
		cfg: config,
		configuredProviderId: realtimeConfig.provider,
		providerConfigs: realtimeConfig.providers,
		defaultModel: realtimeConfig.model
	}).provider.id);
	const activeRealtimeProvider = realtimeSelection.activeProvider;
	return {
		modes: [
			"realtime",
			"stt-tts",
			"transcription"
		],
		transports: [
			"webrtc",
			"provider-websocket",
			"gateway-relay",
			"managed-room"
		],
		brains: [
			"agent-consult",
			"direct-tools",
			"none"
		],
		speech: {
			...activeSpeechProvider ? { activeProvider: activeSpeechProvider } : {},
			providers: require_provider_registry.listSpeechProviders(config).map((provider) => {
				const entry = {
					id: provider.id,
					label: provider.label,
					configured: configuredOrFalse(() => provider.isConfigured({
						cfg: config,
						providerConfig: require_tts.getResolvedSpeechProviderConfig(ttsConfig, provider.id, config),
						timeoutMs: ttsConfig.timeoutMs
					})),
					modes: ["stt-tts"],
					brains: ["agent-consult"]
				};
				if (provider.models) entry.models = [...provider.models];
				if (provider.aliases?.length) entry.aliases = [...provider.aliases];
				if (provider.voices) entry.voices = [...provider.voices];
				return entry;
			})
		},
		transcription: {
			ready: transcriptionSelection.ready,
			...activeTranscriptionProvider ? { activeProvider: activeTranscriptionProvider } : {},
			providers: listTalkTranscriptionProviders(config, [transcriptionConfig.provider, ...Object.keys(transcriptionConfig.providers)]).map((provider) => {
				const rawConfig = require_voice_models.getVoiceProviderConfig({
					providerConfigs: transcriptionConfig.providers,
					provider,
					configuredProviderId: activeTranscriptionProvider && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(provider.id) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(activeTranscriptionProvider) ? transcriptionConfig.provider : void 0
				});
				const rawConfigWithModel = transcriptionConfig.model && rawConfig.model === void 0 ? {
					...rawConfig,
					model: transcriptionConfig.model
				} : rawConfig;
				const providerConfig = provider.resolveConfig?.({
					cfg: config,
					rawConfig: rawConfigWithModel
				}) ?? rawConfigWithModel;
				const entry = {
					id: provider.id,
					label: provider.label,
					configured: configuredOrFalse(() => provider.isConfigured({
						cfg: config,
						providerConfig
					})),
					modes: ["transcription"],
					transports: ["gateway-relay"],
					brains: ["none"]
				};
				if (provider.defaultModel) entry.defaultModel = provider.defaultModel;
				if (provider.aliases?.length) entry.aliases = [...provider.aliases];
				return entry;
			})
		},
		realtime: {
			ready: realtimeSelection.ready,
			...activeRealtimeProvider ? { activeProvider: activeRealtimeProvider } : {},
			providers: listRealtimeVoiceProviders(config).map((provider) => {
				const rawConfig = resolveProviderRawConfig({
					providerConfigs: realtimeConfig.providers ?? {},
					providerId: provider.id,
					configuredProviderId: provider.id === activeRealtimeProvider ? realtimeConfig.provider : void 0
				});
				const rawConfigWithModel = realtimeConfig.model && rawConfig.model === void 0 ? {
					...rawConfig,
					model: realtimeConfig.model
				} : rawConfig;
				const providerConfig = provider.resolveConfig?.({
					cfg: config,
					rawConfig: rawConfigWithModel
				}) ?? rawConfigWithModel;
				const capabilities = provider.capabilities;
				const entry = {
					id: provider.id,
					label: provider.label,
					configured: configuredOrFalse(() => provider.isConfigured({
						cfg: config,
						providerConfig
					})),
					modes: ["realtime"],
					brains: capabilities?.supportsToolCalls === false ? ["none"] : ["agent-consult"],
					supportsBrowserSession: Boolean(capabilities?.supportsBrowserSession ?? provider.createBrowserSession)
				};
				if (provider.defaultModel) entry.defaultModel = provider.defaultModel;
				if (provider.aliases?.length) entry.aliases = [...provider.aliases];
				if (capabilities?.transports) entry.transports = [...capabilities.transports];
				if (capabilities?.inputAudioFormats) entry.inputAudioFormats = capabilities.inputAudioFormats.map((format) => ({ ...format }));
				if (capabilities?.outputAudioFormats) entry.outputAudioFormats = capabilities.outputAudioFormats.map((format) => ({ ...format }));
				if (capabilities?.supportsBargeIn !== void 0) entry.supportsBargeIn = capabilities.supportsBargeIn;
				if (capabilities?.supportsToolCalls !== void 0) entry.supportsToolCalls = capabilities.supportsToolCalls;
				if (capabilities?.supportsVideoFrames !== void 0) entry.supportsVideoFrames = capabilities.supportsVideoFrames;
				if (capabilities?.supportsSessionResumption !== void 0) entry.supportsSessionResumption = capabilities.supportsSessionResumption;
				return entry;
			})
		}
	};
}
function isFallbackEligibleTalkReason(reason) {
	return reason === "talk_unconfigured" || reason === "talk_provider_unsupported" || reason === "method_unavailable";
}
function talkSpeakError(reason, message) {
	const details = {
		reason,
		fallbackEligible: isFallbackEligibleTalkReason(reason)
	};
	return require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, message, { details });
}
function resolveTalkSpeed(params) {
	if (typeof params.speed === "number") return params.speed;
	if (typeof params.rateWpm !== "number" || params.rateWpm <= 0) return;
	const resolved = params.rateWpm / 175;
	if (resolved <= .5 || resolved >= 2) return;
	return resolved;
}
function buildTalkSpeakOverrides(provider, providerConfig, config, params) {
	const speechProvider = require_provider_registry.getSpeechProvider(provider, config);
	if (!speechProvider?.resolveTalkOverrides) return { provider };
	const resolvedSpeed = resolveTalkSpeed(params);
	const resolvedVoiceId = resolveTalkVoiceId(providerConfig, (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.voiceId));
	const providerOverrides = speechProvider.resolveTalkOverrides({
		talkProviderConfig: providerConfig,
		params: {
			...params,
			...resolvedVoiceId == null ? {} : { voiceId: resolvedVoiceId },
			...resolvedSpeed == null ? {} : { speed: resolvedSpeed }
		}
	});
	if (!providerOverrides || Object.keys(providerOverrides).length === 0) return { provider };
	return {
		provider,
		providerOverrides: { [provider]: providerOverrides }
	};
}
async function resolveTalkResponseFromConfig(params) {
	const normalizedTalk = require_io.normalizeTalkSection(params.sourceConfig.talk);
	const configuredPayload = normalizedTalk ? require_io.buildTalkConfigResponse(normalizedTalk) : void 0;
	const runtimeRealtime = buildTalkRealtimeConfig(params.runtimeConfig);
	const effectiveProvider = canonicalizeRealtimeVoiceProviderId(runtimeRealtime.provider, params.runtimeConfig);
	const sourceRealtime = buildTalkRealtimeConfig(params.sourceConfig, effectiveProvider);
	const sourceProviders = {};
	for (const [providerId, providerConfig] of Object.entries(sourceRealtime.providers)) {
		const canonicalProviderId = canonicalizeRealtimeVoiceProviderId(providerId, params.runtimeConfig) ?? providerId;
		sourceProviders[canonicalProviderId] = {
			...sourceProviders[canonicalProviderId],
			...providerConfig
		};
	}
	const effectiveRealtime = require_io.normalizeTalkSection({ realtime: {
		...effectiveProvider ? { provider: effectiveProvider } : {},
		...runtimeRealtime.model ? { model: runtimeRealtime.model } : {},
		...runtimeRealtime.transport ? { transport: runtimeRealtime.transport } : {},
		...Object.keys(sourceProviders).length > 0 ? { providers: sourceProviders } : {}
	} })?.realtime;
	if (!configuredPayload && !effectiveRealtime) return;
	const realtime = effectiveRealtime ? {
		...configuredPayload?.realtime,
		...effectiveRealtime
	} : configuredPayload?.realtime;
	const sourcePayload = {
		...configuredPayload,
		...realtime ? { realtime } : {}
	};
	const payload = params.includeSecrets ? projectTalkSourcePayloadForSecrets(sourcePayload) : sourcePayload;
	const sourceResolved = require_io.resolveActiveTalkProviderConfig(normalizedTalk);
	const runtimeResolved = require_io.resolveActiveTalkProviderConfig(params.runtimeConfig.talk);
	const provider = require_provider_registry.canonicalizeSpeechProviderId(sourceResolved?.provider ?? runtimeResolved?.provider, params.runtimeConfig);
	if (!provider) return payload;
	const speechProvider = require_provider_registry.getSpeechProvider(provider, params.runtimeConfig);
	const sourceBaseTts = withTalkBaseTtsSpeakerSelectionCompat((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(params.sourceConfig.messages?.tts) ?? {});
	const runtimeBaseTts = withTalkBaseTtsSpeakerSelectionCompat((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(params.runtimeConfig.messages?.tts) ?? {});
	const sourceProviderConfig = require_tts.withSpeakerSelectionFallbackCompat(sourceResolved?.config);
	const runtimeProviderConfig = require_tts.withSpeakerSelectionFallbackCompat(runtimeResolved?.config);
	const selectedBaseTts = Object.keys(runtimeBaseTts).length > 0 ? runtimeBaseTts : stripUnresolvedSecretApiKeysFromBaseTtsProviders(sourceBaseTts);
	const providerInputConfig = await resolveTalkProviderInputConfig({
		includeSecrets: params.includeSecrets,
		config: params.runtimeConfig,
		providerConfig: Object.keys(runtimeProviderConfig).length > 0 ? runtimeProviderConfig : sourceProviderConfig,
		provider
	});
	const resolvedConfig = speechProvider?.resolveTalkConfig?.({
		cfg: params.runtimeConfig,
		baseTtsConfig: selectedBaseTts,
		talkProviderConfig: providerInputConfig,
		timeoutMs: typeof selectedBaseTts.timeoutMs === "number" ? selectedBaseTts.timeoutMs : 3e4
	}) ?? providerInputConfig;
	const responseConfig = projectTalkResolvedProviderConfig({
		includeSecrets: params.includeSecrets,
		sourceProviderConfig,
		resolvedConfig
	});
	return {
		...payload,
		provider,
		resolved: {
			provider,
			config: responseConfig
		}
	};
}
function projectTalkResolvedProviderConfig(params) {
	if (!params.includeSecrets) return params.sourceProviderConfig.apiKey === void 0 ? params.resolvedConfig : {
		...params.resolvedConfig,
		apiKey: params.sourceProviderConfig.apiKey
	};
	const projected = require_redact_snapshot.redactConfigObject(params.resolvedConfig);
	const apiKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.resolvedConfig.apiKey);
	return apiKey === void 0 ? projected : {
		...projected,
		apiKey
	};
}
function projectTalkSourceProviderConfigForSecrets(config) {
	const projected = require_redact_snapshot.redactConfigObject(config);
	if (config.apiKey === void 0 || typeof config.apiKey === "string") return projected;
	return {
		...projected,
		apiKey: config.apiKey
	};
}
function projectTalkSourceProviderMapForSecrets(providers) {
	if (!providers) return;
	return Object.fromEntries(Object.entries(providers).map(([providerId, providerConfig]) => [providerId, projectTalkSourceProviderConfigForSecrets(providerConfig)]));
}
function projectTalkRealtimeForSecrets(realtime) {
	const projected = require_redact_snapshot.redactConfigObject(realtime);
	const providers = projectTalkSourceProviderMapForSecrets(realtime.providers);
	return providers ? {
		...projected,
		providers
	} : projected;
}
function projectTalkSourcePayloadForSecrets(payload) {
	const projected = require_redact_snapshot.redactConfigObject(payload);
	const providers = projectTalkSourceProviderMapForSecrets(payload.providers);
	if (providers) projected.providers = providers;
	if (payload.realtime) projected.realtime = projectTalkRealtimeForSecrets(payload.realtime);
	return projected;
}
async function resolveTalkProviderInputConfig(params) {
	const strippedConfig = stripUnresolvedSecretApiKey(params.providerConfig);
	if (!params.includeSecrets || params.providerConfig.apiKey === void 0) return strippedConfig;
	const resolved = await require_resolve_configured_secret_input_string.resolveConfiguredSecretInputString({
		config: params.config,
		env: process.env,
		value: params.providerConfig.apiKey,
		path: `talk.providers.${params.provider}.apiKey`
	});
	return resolved.value === void 0 ? strippedConfig : {
		...params.providerConfig,
		apiKey: resolved.value
	};
}
function stripUnresolvedSecretApiKey(config) {
	return stripUnresolvedSecretApiKeyFromRecord(config);
}
function stripUnresolvedSecretApiKeysFromBaseTtsProviders(base) {
	const providers = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(base.providers);
	if (!providers) return base;
	let mutated = false;
	const cleaned = Object.create(null);
	for (const [providerId, providerConfig] of Object.entries(providers)) {
		const cfg = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(providerConfig);
		if (!cfg) {
			cleaned[providerId] = providerConfig;
			continue;
		}
		const next = stripUnresolvedSecretApiKeyFromRecord(cfg);
		if (next !== cfg) mutated = true;
		cleaned[providerId] = next;
	}
	if (!mutated) return base;
	return {
		...base,
		providers: cleaned
	};
}
function stripUnresolvedSecretApiKeyFromRecord(config) {
	if (config.apiKey === void 0 || typeof config.apiKey === "string") return config;
	const { apiKey: _omit, ...rest } = config;
	return rest;
}
/** Gateway request handlers for Talk config, catalog, mode, sessions, and speech. */
const talkHandlers = {
	...talkSessionHandlers,
	...talkClientHandlers,
	"talk.catalog": async ({ params, respond, context }) => {
		if (!require_src.validateTalkCatalogParams(params ?? {})) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid talk.catalog params: ${require_validation_errors.formatValidationErrors(require_src.validateTalkCatalogParams.errors)}`));
			return;
		}
		try {
			respond(true, buildTalkCatalog(context.getRuntimeConfig()), void 0);
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"talk.config": async ({ params, respond, client, context }) => {
		if (!require_src.validateTalkConfigParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid talk.config params: ${require_validation_errors.formatValidationErrors(require_src.validateTalkConfigParams.errors)}`));
			return;
		}
		const includeSecrets = Boolean(params.includeSecrets);
		if (includeSecrets && !canReadTalkSecrets(client)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `missing scope: ${require_operator_scopes.TALK_SECRETS_SCOPE}`));
			return;
		}
		const snapshot = await require_io.readConfigFileSnapshot();
		const runtimeConfig = context.getRuntimeConfig();
		const configPayload = {};
		const talk = await resolveTalkResponseFromConfig({
			includeSecrets,
			sourceConfig: snapshot.config,
			runtimeConfig
		});
		if (talk) configPayload.talk = includeSecrets ? talk : require_redact_snapshot.redactConfigObject(talk);
		const sessionMainKey = snapshot.config.session?.mainKey;
		if (typeof sessionMainKey === "string") configPayload.session = { mainKey: sessionMainKey };
		const seamColor = snapshot.config.ui?.seamColor;
		if (typeof seamColor === "string") configPayload.ui = { seamColor };
		respond(true, { config: configPayload }, void 0);
	},
	"talk.speak": async ({ params, respond, context }) => {
		if (!require_src.validateTalkSpeakParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid talk.speak params: ${require_validation_errors.formatValidationErrors(require_src.validateTalkSpeakParams.errors)}`));
			return;
		}
		const typedParams = params;
		const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(typedParams.text);
		if (!text) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "talk.speak requires text"));
			return;
		}
		if (typedParams.speed == null && typedParams.rateWpm != null && resolveTalkSpeed(typedParams) == null) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid talk.speak params: rateWpm must resolve to speed between 0.5 and 2.0`));
			return;
		}
		try {
			const runtimeConfig = context.getRuntimeConfig();
			const setup = buildTalkTtsConfig(runtimeConfig);
			if ("error" in setup) {
				respond(false, void 0, talkSpeakError(setup.reason, setup.error));
				return;
			}
			const overrides = buildTalkSpeakOverrides(setup.provider, setup.providerConfig, runtimeConfig, typedParams);
			const result = await require_tts.synthesizeSpeech({
				text,
				cfg: setup.cfg,
				overrides,
				disableFallback: true
			});
			if (!result.success || !result.audioBuffer) {
				respond(false, void 0, talkSpeakError("synthesis_failed", result.error ?? "talk synthesis failed"));
				return;
			}
			if ((result.provider ?? setup.provider).trim().length === 0) {
				respond(false, void 0, talkSpeakError("invalid_audio_result", "talk synthesis returned empty provider"));
				return;
			}
			if (result.audioBuffer.length === 0) {
				respond(false, void 0, talkSpeakError("invalid_audio_result", "talk synthesis returned empty audio"));
				return;
			}
			respond(true, {
				audioBase64: result.audioBuffer.toString("base64"),
				provider: result.provider ?? setup.provider,
				outputFormat: result.outputFormat,
				voiceCompatible: result.voiceCompatible,
				mimeType: require_speech_mime.inferSpeechMimeType(result.outputFormat, result.fileExtension),
				fileExtension: result.fileExtension
			}, void 0);
		} catch (err) {
			respond(false, void 0, talkSpeakError("synthesis_failed", require_ws_log.formatForLog(err)));
		}
	},
	"talk.mode": ({ params, respond, context, client, isWebchatConnect }) => {
		if (client && isWebchatConnect(client.connect) && !context.hasConnectedTalkNode()) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "talk disabled: no connected Talk-capable nodes"));
			return;
		}
		if (!require_src.validateTalkModeParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid talk.mode params: ${require_validation_errors.formatValidationErrors(require_src.validateTalkModeParams.errors)}`));
			return;
		}
		const payload = {
			enabled: params.enabled,
			phase: params.phase ?? null,
			ts: Date.now()
		};
		context.broadcast("talk.mode", payload, { dropIfSlow: true });
		respond(true, payload, void 0);
	}
};
//#endregion
exports.talkHandlers = talkHandlers;
