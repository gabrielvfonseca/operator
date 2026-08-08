require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_completion_delivery_policy = require("./completion-delivery-policy-Djb6F8Lx.cjs");
const require_web_tools = require("./web-tools-fb2XR9TB.cjs");
const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
const require_local_roots = require("./local-roots-w2A4ItE4.cjs");
require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_agent_tools = require("./agent-tools-C4N0fa5t.cjs");
const require_logger = require("./logger-B-gij7u9.cjs");
const require_heartbeat_system_prompt = require("./heartbeat-system-prompt-BKoDGXAZ.cjs");
const require_input_provenance = require("./input-provenance-h9in5xc9.cjs");
const require_bash_tools_shared = require("./bash-tools.shared-DLnmR_E2.cjs");
const require_bash_process_registry = require("./bash-process-registry-CmxCXwAs.cjs");
const require_prepare_auth = require("./prepare-auth-jI6h10E_.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_ai_internal_shared = require("@gabrielvfonseca/ai/internal/shared");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/agents/embedded-agent-runner/context-engine-capabilities.ts
/**
* Builds host capabilities passed into context-engine runtime calls.
*/
/**
* Build host-owned capabilities that are bound to one context-engine runtime call.
*/
function resolveContextEngineCapabilities(params) {
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	const agentId = require_completion_delivery_policy.resolveBoundAgentIdForSession({
		config: params.config,
		sessionKey,
		agentId: params.agentId
	});
	const contextEnginePluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.contextEnginePluginId);
	return { llm: { complete: async (request) => {
		const { createRuntimeLlm } = await Promise.resolve().then(() => require("./runtime-llm.runtime-BdZaOBQS.cjs"));
		return await createRuntimeLlm({
			getConfig: () => params.config,
			authority: {
				caller: {
					kind: "context-engine",
					id: params.purpose
				},
				requiresBoundAgent: true,
				...sessionKey ? { sessionKey } : {},
				...agentId ? { agentId } : {},
				...params.authProfileId ? { preferredProfile: params.authProfileId } : {},
				...contextEnginePluginId ? { pluginIdForPolicy: contextEnginePluginId } : {},
				allowAgentIdOverride: false,
				allowModelOverride: false,
				allowComplete: true
			}
		}).complete(request);
	} } };
}
//#endregion
//#region src/agents/bash-process-references.ts
/**
* Compact references for active background bash sessions.
* These references are surfaced in agent context so follow-up turns can
* reconnect to prior long-running work.
*/
const DEFAULT_ACTIVE_PROCESS_LIMIT = 8;
const MAX_COMMAND_LABEL_CHARS = 140;
function truncate(value, maxChars) {
	if (value.length <= maxChars) return value;
	if (maxChars <= 1) return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, maxChars);
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, Math.max(0, maxChars - 3))}...`;
}
/** List active background process sessions for one scope key, newest first. */
function listActiveProcessSessionReferences(params) {
	const scopeKey = params.scopeKey?.trim();
	if (!scopeKey) return [];
	const now = params.now ?? Date.now();
	const limit = typeof params.limit === "number" && Number.isFinite(params.limit) && params.limit > 0 ? Math.floor(params.limit) : DEFAULT_ACTIVE_PROCESS_LIMIT;
	return require_bash_process_registry.listRunningSessions().filter((session) => session.backgrounded).filter((session) => session.scopeKey === scopeKey).toSorted((left, right) => right.startedAt - left.startedAt).slice(0, limit).map((session) => ({
		sessionId: session.id,
		status: "running",
		pid: session.pid ?? session.child?.pid,
		startedAt: session.startedAt,
		runtimeMs: Math.max(0, now - session.startedAt),
		cwd: session.cwd,
		command: session.command,
		name: truncate(require_bash_tools_shared.deriveSessionName(session.command) || session.command, MAX_COMMAND_LABEL_CHARS),
		tail: session.tail,
		truncated: session.truncated
	}));
}
//#endregion
//#region src/agents/hook-system-context-boundary.ts
/**
* Wraps plugin-provided system context in stable prompt-cache boundaries.
*/
const HOOK_SYSTEM_CONTEXT_HEADER = "Operator plugin-injected system context. This block is not workspace file content.";
/** Normalizes and fences plugin-injected system context before it enters prompts. */
function wrapPluginSystemContextSection(value) {
	if (typeof value !== "string") return;
	const normalized = (0, _gabrielvfonseca_ai_internal_shared.normalizeStructuredPromptSection)(value);
	if (!normalized) return;
	return `---\n\n${HOOK_SYSTEM_CONTEXT_HEADER}\n\n${normalized}\n\n---`;
}
//#endregion
//#region src/agents/embedded-agent-runner/compaction-runtime-context.ts
/**
* Resolve the effective compaction target from config, falling back to the
* caller-supplied provider/model and optionally applying runtime defaults.
*/
function resolveEmbeddedCompactionTarget(params) {
	const provider = params.provider?.trim() || params.defaultProvider;
	const model = params.modelId?.trim() || params.defaultModel;
	const override = params.modelSelectionLocked ? void 0 : params.config?.agents?.defaults?.compaction?.model?.trim();
	const resolveTargetProviders = (targetProvider, authProfileId) => {
		if (!targetProvider) return {};
		const selectedHarnessRuntime = require_openai_routing.normalizeOptionalAgentRuntimeId(params.harnessRuntime);
		const useNativeHarnessRuntime = selectedHarnessRuntime !== void 0 && selectedHarnessRuntime !== "@gabrielvfonseca/operator" && !require_openai_routing.isDefaultAgentRuntimeId(selectedHarnessRuntime);
		const runtimeProvider = require_openai_routing.resolveSelectedOpenAIRuntimeProvider({
			provider: targetProvider,
			harnessRuntime: (useNativeHarnessRuntime ? selectedHarnessRuntime : "@gabrielvfonseca/operator") ?? void 0,
			authProfileId,
			config: params.config
		});
		const routedRuntimeProvider = runtimeProvider === targetProvider ? void 0 : runtimeProvider;
		return {
			runtimeProvider: routedRuntimeProvider,
			contextProvider: useNativeHarnessRuntime ? routedRuntimeProvider : void 0,
			...useNativeHarnessRuntime ? { nativeHarnessCompaction: true } : {}
		};
	};
	if (!override) {
		const authProfileId = params.authProfileId ?? void 0;
		return {
			provider,
			...resolveTargetProviders(provider, authProfileId),
			model,
			authProfileId
		};
	}
	const slashIdx = override.indexOf("/");
	if (slashIdx > 0) {
		const overrideProvider = override.slice(0, slashIdx).trim();
		const overrideModel = override.slice(slashIdx + 1).trim() || params.defaultModel;
		const authProfileId = overrideProvider !== provider ? void 0 : params.authProfileId ?? void 0;
		return {
			provider: overrideProvider,
			...resolveTargetProviders(overrideProvider, authProfileId),
			model: overrideModel,
			authProfileId
		};
	}
	const config = params.config ?? {};
	const currentProvider = provider?.trim();
	if (currentProvider && hasBareConfiguredModelForProvider({
		cfg: config,
		provider: currentProvider,
		model: override
	})) {
		const authProfileId = params.authProfileId ?? void 0;
		return {
			provider: currentProvider,
			...resolveTargetProviders(currentProvider, authProfileId),
			model: override,
			authProfileId
		};
	}
	const inferredLiteralProvider = require_model_selection_shared.inferUniqueProviderFromConfiguredModels({
		cfg: config,
		model: override
	});
	if (inferredLiteralProvider) {
		const authProfileId = inferredLiteralProvider !== provider ? void 0 : params.authProfileId ?? void 0;
		return {
			provider: inferredLiteralProvider,
			...resolveTargetProviders(inferredLiteralProvider, authProfileId),
			model: override,
			authProfileId
		};
	}
	const defaultProvider = provider || "openrouter";
	const aliasResolution = require_model_selection_shared.resolveModelRefFromString({
		cfg: config,
		raw: override,
		defaultProvider,
		aliasIndex: require_model_selection_shared.buildModelAliasIndex({
			cfg: config,
			defaultProvider
		})
	});
	if (aliasResolution?.alias) {
		const resolvedProvider = aliasResolution.ref.provider;
		const authProfileId = resolvedProvider !== provider ? void 0 : params.authProfileId ?? void 0;
		return {
			provider: resolvedProvider,
			...resolveTargetProviders(resolvedProvider, authProfileId),
			model: aliasResolution.ref.model,
			authProfileId
		};
	}
	const authProfileId = params.authProfileId ?? void 0;
	return {
		provider,
		...resolveTargetProviders(provider, authProfileId),
		model: override,
		authProfileId
	};
}
function normalizeCompactionConfigKey(value) {
	return value.trim().toLowerCase();
}
function hasBareConfiguredModelForProvider(params) {
	const providerKey = normalizeCompactionConfigKey(params.provider);
	const modelKey = normalizeCompactionConfigKey(params.model);
	if (!providerKey || !modelKey || params.model.includes("/")) return false;
	for (const rawRef of Object.keys(params.cfg.agents?.defaults?.models ?? {})) {
		const slashIdx = rawRef.indexOf("/");
		if (slashIdx <= 0 || rawRef.endsWith("/*")) continue;
		const rawProvider = rawRef.slice(0, slashIdx);
		const rawModel = rawRef.slice(slashIdx + 1);
		if (normalizeCompactionConfigKey(rawProvider) === providerKey && normalizeCompactionConfigKey(rawModel) === modelKey) return true;
	}
	return ((Object.entries(params.cfg.models?.providers ?? {}).find(([key]) => {
		return normalizeCompactionConfigKey(key) === providerKey;
	})?.[1])?.models ?? []).some((entry) => {
		return normalizeCompactionConfigKey(entry?.id ?? "") === modelKey;
	});
}
/** Resolves the concrete harness already bound to this exact compaction target. */
function resolveCompactionHarnessRuntime(params) {
	const boundHarnessRuntime = require_openai_routing.normalizeOptionalAgentRuntimeId(params.boundHarnessRuntime);
	if (boundHarnessRuntime) return boundHarnessRuntime;
	const preparedRuntimePlan = params.preparedRuntimePlan;
	if (preparedRuntimePlan && require_prepare_auth.agentRuntimeAuthPlanMatchesTarget(preparedRuntimePlan.auth, {
		provider: params.provider,
		modelId: params.modelId
	})) {
		const preparedHarnessRuntime = require_openai_routing.normalizeOptionalAgentRuntimeId(preparedRuntimePlan.resolvedRef.harnessId);
		if (preparedHarnessRuntime) return preparedHarnessRuntime;
	}
	return require_openai_routing.normalizeOptionalAgentRuntimeId(params.configuredHarnessRuntime);
}
function buildEmbeddedCompactionRuntimeContext(params) {
	const resolved = resolveEmbeddedCompactionTarget({
		config: params.config,
		provider: params.provider,
		modelId: params.modelId,
		authProfileId: params.authProfileId,
		harnessRuntime: params.harnessRuntime,
		modelSelectionLocked: params.modelSelectionLocked
	});
	const agentHarnessId = params.harnessRuntime?.trim() || void 0;
	const runtimeAuthPlan = params.runtimeAuthPlan && resolved.provider && resolved.model && require_prepare_auth.agentRuntimeAuthPlanMatchesTarget(params.runtimeAuthPlan, {
		provider: resolved.provider,
		modelId: resolved.model
	}) ? params.runtimeAuthPlan : void 0;
	const processScopeKey = params.sessionKey?.trim();
	const activeProcessSessions = params.activeProcessSessions ?? listActiveProcessSessionReferences({ scopeKey: processScopeKey });
	return {
		sessionKey: params.sessionKey ?? void 0,
		messageChannel: params.messageChannel ?? void 0,
		messageProvider: params.messageProvider ?? void 0,
		clientCaps: params.clientCaps,
		chatType: params.chatType ?? void 0,
		agentAccountId: params.agentAccountId ?? void 0,
		currentChannelId: params.currentChannelId ?? void 0,
		currentThreadTs: params.currentThreadTs ?? void 0,
		currentMessageId: params.currentMessageId ?? void 0,
		authProfileId: resolved.authProfileId,
		authProfileIdSource: params.authProfileIdSource,
		runtimeAuthPlan,
		agentHarnessId,
		modelSelectionLocked: params.modelSelectionLocked,
		workspaceDir: params.workspaceDir,
		cwd: params.cwd ?? void 0,
		agentDir: params.agentDir,
		config: params.config,
		senderIsOwner: params.senderIsOwner,
		senderId: params.senderId ?? void 0,
		provider: resolved.provider,
		runtimeProvider: resolved.runtimeProvider,
		model: resolved.model,
		modelFallbacksOverride: params.modelFallbacksOverride,
		thinkLevel: params.thinkLevel,
		reasoningLevel: params.reasoningLevel,
		bashElevated: params.bashElevated,
		extraSystemPrompt: params.extraSystemPrompt,
		sourceReplyDeliveryMode: params.sourceReplyDeliveryMode,
		ownerNumbers: params.ownerNumbers,
		...activeProcessSessions.length > 0 ? { activeProcessSessions } : {}
	};
}
//#endregion
//#region src/agents/embedded-agent-runner/run/trigger-policy.ts
const DEFAULT_EMBEDDED_RUN_TRIGGER_POLICY = { injectHeartbeatPrompt: false };
const EMBEDDED_RUN_TRIGGER_POLICY = { heartbeat: { injectHeartbeatPrompt: true } };
/**
* Decides whether a run trigger should add the heartbeat-specific prompt
* instruction. Unknown or omitted triggers fall back to the user-prompt shape
* so non-heartbeat runs do not get scheduler wording.
*/
function shouldInjectHeartbeatPromptForTrigger(trigger) {
	return (trigger ? EMBEDDED_RUN_TRIGGER_POLICY[trigger] : void 0)?.injectHeartbeatPrompt ?? DEFAULT_EMBEDDED_RUN_TRIGGER_POLICY.injectHeartbeatPrompt;
}
//#endregion
//#region src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts
const PROMPT_BUILD_DRAIN_CACHE_MAX = 256;
const promptBuildDrainCache = /* @__PURE__ */ new Map();
function rememberDrainedInjections(runId, injections) {
	if (promptBuildDrainCache.has(runId)) promptBuildDrainCache.delete(runId);
	else if (promptBuildDrainCache.size >= PROMPT_BUILD_DRAIN_CACHE_MAX) {
		const oldest = promptBuildDrainCache.keys().next().value;
		if (oldest !== void 0) promptBuildDrainCache.delete(oldest);
	}
	promptBuildDrainCache.set(runId, injections);
}
/**
* Releases the per-run drained-injection cache. Call when a run terminates so
* the cap stays headroom for active runs.
*/
function forgetPromptBuildDrainCacheForRun(runId) {
	if (runId) promptBuildDrainCache.delete(runId);
}
/**
* Resolves prompt-build hook contributions for one attempt. Next-turn
* injections are drained once per run and cached for retries so destructive
* session-store reads do not lose plugin context after a failed first attempt.
*/
async function resolvePromptBuildHookResult(params) {
	const runId = params.hookCtx.runId;
	const cachedInjections = runId ? promptBuildDrainCache.get(runId) : void 0;
	const commitmentOnly = params.bootstrapContextRunKind === "commitment-only";
	const queuedContext = commitmentOnly ? {
		queuedInjections: [],
		...require_registry.buildPluginAgentTurnPrepareContext({ queuedInjections: [] })
	} : cachedInjections ? {
		queuedInjections: cachedInjections,
		...require_registry.buildPluginAgentTurnPrepareContext({ queuedInjections: cachedInjections })
	} : await require_registry.drainPluginNextTurnInjectionContext({
		cfg: params.config,
		sessionKey: params.hookCtx.sessionKey
	});
	if (runId && !commitmentOnly && !cachedInjections) rememberDrainedInjections(runId, queuedContext.queuedInjections);
	const turnPrepareResult = params.hookRunner?.runAgentTurnPrepare && params.hookRunner.hasHooks("agent_turn_prepare") ? await params.hookRunner.runAgentTurnPrepare({
		prompt: params.prompt,
		messages: params.messages,
		queuedInjections: queuedContext.queuedInjections
	}, params.hookCtx).catch((hookErr) => {
		require_logger.log.warn(`agent_turn_prepare hook failed: ${String(hookErr)}`);
	}) : void 0;
	const heartbeatContribution = params.hookCtx.trigger === "heartbeat" && !commitmentOnly && params.hookRunner?.runHeartbeatPromptContribution && params.hookRunner.hasHooks("heartbeat_prompt_contribution") ? await params.hookRunner.runHeartbeatPromptContribution({
		sessionKey: params.hookCtx.sessionKey,
		agentId: params.hookCtx.agentId,
		heartbeatName: "heartbeat"
	}, params.hookCtx).catch((hookErr) => {
		require_logger.log.warn(`heartbeat_prompt_contribution hook failed: ${String(hookErr)}`);
	}) : void 0;
	const promptBuildResult = params.hookRunner?.hasHooks("before_prompt_build") ? await params.hookRunner.runBeforePromptBuild({
		prompt: params.prompt,
		messages: params.messages
	}, params.hookCtx).catch((hookErr) => {
		require_logger.log.warn(`before_prompt_build hook failed: ${String(hookErr)}`);
	}) : void 0;
	const beforeAgentStartResult = params.beforeAgentStartResult ?? (params.hookRunner?.hasHooks("before_agent_start") ? await params.hookRunner.runBeforeAgentStart({
		prompt: params.prompt,
		messages: params.messages
	}, params.hookCtx).catch((hookErr) => {
		require_logger.log.warn(`deprecated before_agent_start hook failed during prompt build: ${String(hookErr)}`);
	}) : void 0);
	return {
		systemPrompt: promptBuildResult?.systemPrompt ?? beforeAgentStartResult?.systemPrompt,
		prependContext: require_hook_runner_global.joinPresentTextSegments([
			queuedContext.prependContext,
			turnPrepareResult?.prependContext,
			heartbeatContribution?.prependContext,
			promptBuildResult?.prependContext,
			beforeAgentStartResult?.prependContext
		]),
		appendContext: require_hook_runner_global.joinPresentTextSegments([
			queuedContext.appendContext,
			turnPrepareResult?.appendContext,
			heartbeatContribution?.appendContext,
			promptBuildResult?.appendContext,
			beforeAgentStartResult?.appendContext
		]),
		prependSystemContext: require_hook_runner_global.joinPresentTextSegments([wrapPluginSystemContextSection(promptBuildResult?.prependSystemContext), wrapPluginSystemContextSection(beforeAgentStartResult?.prependSystemContext)]),
		appendSystemContext: require_hook_runner_global.joinPresentTextSegments([wrapPluginSystemContextSection(promptBuildResult?.appendSystemContext), wrapPluginSystemContextSection(beforeAgentStartResult?.appendSystemContext)])
	};
}
function resolvePromptModeForSession(sessionKey) {
	if (!sessionKey) return "full";
	return require_session_key.isSubagentSessionKey(sessionKey) || require_session_key.isCronSessionKey(sessionKey) ? "minimal" : "full";
}
/**
* Determines whether the default agent's heartbeat run should include the
* heartbeat prompt contribution. Non-default agents and non-heartbeat triggers
* keep their normal prompt shape.
*/
function shouldInjectHeartbeatPrompt(params) {
	return params.isDefaultAgent && params.bootstrapContextRunKind !== "commitment-only" && shouldInjectHeartbeatPromptForTrigger(params.trigger) && Boolean(require_heartbeat_system_prompt.resolveHeartbeatPromptForSystemPrompt({
		config: params.config,
		agentId: params.agentId,
		defaultAgentId: params.defaultAgentId
	}));
}
/** User-visible runs warn when transcript repair had to merge an orphaned user turn. */
function shouldWarnOnOrphanedUserRepair(trigger) {
	return trigger === "user" || trigger === "manual";
}
const QUEUED_USER_MESSAGE_MARKER = "[Queued user message from a previous active turn; preserved as context only. Continue with the active prompt below.]";
const MAX_STRUCTURED_MEDIA_REF_CHARS = 300;
const MAX_STRUCTURED_JSON_STRING_CHARS = 300;
const MAX_STRUCTURED_JSON_DEPTH = 4;
const MAX_STRUCTURED_JSON_ARRAY_ITEMS = 16;
const MAX_STRUCTURED_JSON_OBJECT_KEYS = 32;
function summarizeStructuredMediaRef(label, value) {
	if (typeof value !== "string") return;
	const trimmed = value.trim();
	if (!trimmed) return;
	const dataUriMatch = trimmed.match(/^data:([^;,]+)?(?:;[^,]*)?,/i);
	if (dataUriMatch) return `[${label}] inline data URI (${dataUriMatch[1]?.trim() || "unknown"}, ${trimmed.length} chars)`;
	if (trimmed.length > MAX_STRUCTURED_MEDIA_REF_CHARS) return `[${label}] ${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, MAX_STRUCTURED_MEDIA_REF_CHARS)}... (${trimmed.length} chars)`;
	return `[${label}] ${trimmed}`;
}
function summarizeStructuredJsonString(value) {
	const mediaSummary = summarizeStructuredMediaRef("value", value);
	if (mediaSummary?.includes("inline data URI")) return mediaSummary;
	const trimmed = value.trim();
	if (trimmed.length > MAX_STRUCTURED_JSON_STRING_CHARS) return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, MAX_STRUCTURED_JSON_STRING_CHARS)}... (${trimmed.length} chars)`;
	return value;
}
function sanitizeStructuredJsonValue(value, depth = 0, seen = /* @__PURE__ */ new WeakSet()) {
	if (typeof value === "string") return summarizeStructuredJsonString(value);
	if (!value || typeof value !== "object") return value;
	if (seen.has(value)) return "[circular]";
	if (depth >= MAX_STRUCTURED_JSON_DEPTH) return "[max depth]";
	seen.add(value);
	if (Array.isArray(value)) {
		const limited = value.slice(0, MAX_STRUCTURED_JSON_ARRAY_ITEMS).map((item) => sanitizeStructuredJsonValue(item, depth + 1, seen));
		if (value.length > MAX_STRUCTURED_JSON_ARRAY_ITEMS) limited.push(`[${value.length - MAX_STRUCTURED_JSON_ARRAY_ITEMS} more items]`);
		seen.delete(value);
		return limited;
	}
	const output = {};
	let copied = 0;
	let skipped = 0;
	for (const key in value) {
		if (!Object.hasOwn(value, key)) continue;
		if (copied >= MAX_STRUCTURED_JSON_OBJECT_KEYS) {
			skipped += 1;
			continue;
		}
		output[key] = sanitizeStructuredJsonValue(value[key], depth + 1, seen);
		copied += 1;
	}
	if (skipped > 0) output["__truncated"] = `${skipped} more keys`;
	seen.delete(value);
	return output;
}
function stringifyStructuredJsonFallback(part) {
	try {
		const serialized = JSON.stringify(sanitizeStructuredJsonValue(part));
		if (!serialized || serialized === "{}") return;
		const withoutInlineData = serialized.replace(/data:[^"'\\\s]+/gi, (match) => `[inline data URI: ${match.length} chars]`);
		return withoutInlineData.length > 1e3 ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(withoutInlineData, 1e3)}... (${withoutInlineData.length} chars)` : withoutInlineData;
	} catch {
		return;
	}
}
function stringifyStructuredContentPart(part) {
	if (!part || typeof part !== "object") return;
	const record = part;
	if (record.type === "text") return (typeof record.text === "string" ? record.text.trim() : "") || void 0;
	if (record.type === "image_url") {
		const imageUrl = record.image_url;
		return summarizeStructuredMediaRef("image_url", typeof imageUrl === "string" ? imageUrl : imageUrl && typeof imageUrl === "object" ? imageUrl.url : void 0);
	}
	if (record.type === "image" || record.type === "input_image") return summarizeStructuredMediaRef(record.type, record.url) ?? summarizeStructuredMediaRef(record.type, record.source);
	if (typeof record.type === "string") {
		const typedRef = summarizeStructuredMediaRef(record.type, record.audio_url) ?? summarizeStructuredMediaRef(record.type, record.media_url) ?? summarizeStructuredMediaRef(record.type, record.url) ?? summarizeStructuredMediaRef(record.type, record.source);
		if (typedRef) return typedRef;
	}
	return stringifyStructuredJsonFallback(part);
}
function extractUserMessagePromptText(content) {
	if (typeof content === "string") return content.trim() || void 0;
	if (!Array.isArray(content)) return;
	return content.flatMap((part) => {
		const textLocal = stringifyStructuredContentPart(part);
		return textLocal ? [textLocal] : [];
	}).join("\n").trim() || void 0;
}
function promptAlreadyIncludesQueuedUserMessage(prompt, orphanText) {
	const normalizedPrompt = prompt.replace(/\r\n/g, "\n");
	const normalizedOrphanText = orphanText.replace(/\r\n/g, "\n").trim();
	if (!normalizedOrphanText) return false;
	const queuedBlockPrefix = `${QUEUED_USER_MESSAGE_MARKER}\n${normalizedOrphanText}`;
	return normalizedPrompt === queuedBlockPrefix || normalizedPrompt.startsWith(`${queuedBlockPrefix}\n`) || normalizedPrompt.includes(`\n${queuedBlockPrefix}\n`) || `\n${normalizedPrompt}\n`.includes(`\n${normalizedOrphanText}\n`);
}
function shouldDropStaleInternalOrphanedUserPrompt(params) {
	return params.prompt.trim().length > 0 && require_input_provenance.shouldPreserveUserFacingSessionStateForInputProvenance(params.leafMessage.provenance);
}
/**
* Merges a trailing user message that was queued in transcript history but not
* present in the active prompt. The leaf is removed whether merged or already
* present so the transcript cannot submit the same user turn twice.
*/
function mergeOrphanedTrailingUserPrompt(params) {
	const orphanText = extractUserMessagePromptText(params.leafMessage.content);
	if (!orphanText) return {
		prompt: params.prompt,
		merged: false,
		removeLeaf: true
	};
	if (promptAlreadyIncludesQueuedUserMessage(params.prompt, orphanText)) return {
		prompt: params.prompt,
		merged: false,
		removeLeaf: true
	};
	if (shouldDropStaleInternalOrphanedUserPrompt({
		prompt: params.prompt,
		leafMessage: params.leafMessage
	})) return {
		prompt: params.prompt,
		merged: false,
		removeLeaf: true
	};
	return {
		prompt: [
			QUEUED_USER_MESSAGE_MARKER,
			orphanText,
			"",
			params.prompt
		].join("\n"),
		merged: true,
		removeLeaf: true
	};
}
function resolveAttemptFsWorkspaceOnly(params) {
	return require_local_roots.resolveEffectiveToolFsWorkspaceOnly({
		cfg: params.config,
		agentId: params.sessionAgentId
	});
}
function prependSystemPromptAddition(params) {
	return (0, _gabrielvfonseca_ai_internal_shared.prependSystemPromptAdditionAfterCacheBoundary)(params);
}
function resolveAttemptMediaTaskSystemPromptAddition(params) {
	if (params.trigger !== "user" && params.trigger !== "manual") return;
	return require_hook_runner_global.joinPresentTextSegments([
		require_web_tools.buildActiveImageGenerationTaskPromptContextForSession(params.sessionKey),
		require_web_tools.buildActiveVideoGenerationTaskPromptContextForSession(params.sessionKey),
		require_web_tools.buildActiveMusicGenerationTaskPromptContextForSession(params.sessionKey)
	]);
}
function resolveRuntimeContextSessionTarget(params) {
	const sessionTarget = params.attempt.sessionTarget;
	const agentId = sessionTarget?.agentId ?? params.activeAgentId;
	const sessionId = sessionTarget?.sessionId ?? params.attempt.sessionId;
	const sessionKey = sessionTarget?.sessionKey ?? params.attempt.sessionKey;
	if (!agentId && !sessionId && !sessionKey && !sessionTarget?.storePath && sessionTarget?.threadId === void 0) return;
	return {
		...agentId ? { agentId } : {},
		...sessionId ? { sessionId } : {},
		...sessionKey ? { sessionKey } : {},
		...sessionTarget?.storePath ? { storePath: sessionTarget.storePath } : {},
		...sessionTarget?.threadId !== void 0 ? { threadId: sessionTarget.threadId } : {}
	};
}
/** Build runtime context passed into context-engine afterTurn hooks. */
function buildAfterTurnRuntimeContext(params) {
	const sessionTarget = resolveRuntimeContextSessionTarget({
		attempt: params.attempt,
		activeAgentId: params.activeAgentId
	});
	return {
		...buildEmbeddedCompactionRuntimeContext({
			sessionKey: params.attempt.sessionKey,
			messageChannel: params.attempt.messageChannel,
			messageProvider: params.attempt.messageProvider,
			agentAccountId: params.attempt.agentAccountId,
			currentChannelId: params.attempt.currentChannelId,
			currentThreadTs: params.attempt.currentThreadTs,
			currentMessageId: params.attempt.currentMessageId,
			authProfileId: params.attempt.authProfileId,
			authProfileIdSource: params.attempt.authProfileIdSource,
			runtimeAuthPlan: params.attempt.runtimePlan?.auth,
			workspaceDir: params.workspaceDir,
			cwd: params.cwd,
			agentDir: params.agentDir,
			config: params.attempt.config,
			skillsSnapshot: params.attempt.skillsSnapshot,
			senderId: params.attempt.senderId,
			provider: params.attempt.provider,
			modelId: params.attempt.modelId,
			harnessRuntime: params.attempt.agentHarnessId,
			modelSelectionLocked: params.attempt.modelSelectionLocked,
			thinkLevel: params.attempt.thinkLevel,
			reasoningLevel: params.attempt.reasoningLevel,
			bashElevated: params.attempt.bashElevated,
			extraSystemPrompt: params.attempt.extraSystemPrompt,
			ownerNumbers: params.attempt.ownerNumbers,
			activeProcessSessions: listActiveProcessSessionReferences({ scopeKey: require_agent_tools.resolveProcessToolScopeKey({
				sessionKey: params.attempt.sandboxSessionKey?.trim() || params.attempt.sessionKey,
				sessionId: params.attempt.sessionId,
				agentId: params.activeAgentId
			}) })
		}),
		...resolveContextEngineCapabilities({
			config: params.attempt.config,
			sessionKey: params.attempt.sessionKey,
			agentId: params.activeAgentId,
			authProfileId: params.attempt.authProfileId,
			contextEnginePluginId: params.contextEnginePluginId,
			purpose: "context-engine.after-turn"
		}),
		...typeof params.tokenBudget === "number" && Number.isFinite(params.tokenBudget) && params.tokenBudget > 0 ? { tokenBudget: Math.floor(params.tokenBudget) } : {},
		...typeof params.currentTokenCount === "number" && Number.isFinite(params.currentTokenCount) && params.currentTokenCount > 0 ? { currentTokenCount: Math.floor(params.currentTokenCount) } : {},
		...params.promptCache ? { promptCache: params.promptCache } : {},
		transcriptStorage: { kind: "sqlite" },
		...sessionTarget ? { sessionTarget } : {}
	};
}
function buildAfterTurnRuntimeContextFromUsage(params) {
	return buildAfterTurnRuntimeContext({
		...params,
		currentTokenCount: require_session_accessor.deriveContextPromptTokens({ lastCallUsage: params.lastCallUsage })
	});
}
//#endregion
Object.defineProperty(exports, "buildAfterTurnRuntimeContext", {
	enumerable: true,
	get: function() {
		return buildAfterTurnRuntimeContext;
	}
});
Object.defineProperty(exports, "buildAfterTurnRuntimeContextFromUsage", {
	enumerable: true,
	get: function() {
		return buildAfterTurnRuntimeContextFromUsage;
	}
});
Object.defineProperty(exports, "buildEmbeddedCompactionRuntimeContext", {
	enumerable: true,
	get: function() {
		return buildEmbeddedCompactionRuntimeContext;
	}
});
Object.defineProperty(exports, "forgetPromptBuildDrainCacheForRun", {
	enumerable: true,
	get: function() {
		return forgetPromptBuildDrainCacheForRun;
	}
});
Object.defineProperty(exports, "listActiveProcessSessionReferences", {
	enumerable: true,
	get: function() {
		return listActiveProcessSessionReferences;
	}
});
Object.defineProperty(exports, "mergeOrphanedTrailingUserPrompt", {
	enumerable: true,
	get: function() {
		return mergeOrphanedTrailingUserPrompt;
	}
});
Object.defineProperty(exports, "prependSystemPromptAddition", {
	enumerable: true,
	get: function() {
		return prependSystemPromptAddition;
	}
});
Object.defineProperty(exports, "resolveAttemptFsWorkspaceOnly", {
	enumerable: true,
	get: function() {
		return resolveAttemptFsWorkspaceOnly;
	}
});
Object.defineProperty(exports, "resolveAttemptMediaTaskSystemPromptAddition", {
	enumerable: true,
	get: function() {
		return resolveAttemptMediaTaskSystemPromptAddition;
	}
});
Object.defineProperty(exports, "resolveCompactionHarnessRuntime", {
	enumerable: true,
	get: function() {
		return resolveCompactionHarnessRuntime;
	}
});
Object.defineProperty(exports, "resolveContextEngineCapabilities", {
	enumerable: true,
	get: function() {
		return resolveContextEngineCapabilities;
	}
});
Object.defineProperty(exports, "resolveEmbeddedCompactionTarget", {
	enumerable: true,
	get: function() {
		return resolveEmbeddedCompactionTarget;
	}
});
Object.defineProperty(exports, "resolvePromptBuildHookResult", {
	enumerable: true,
	get: function() {
		return resolvePromptBuildHookResult;
	}
});
Object.defineProperty(exports, "resolvePromptModeForSession", {
	enumerable: true,
	get: function() {
		return resolvePromptModeForSession;
	}
});
Object.defineProperty(exports, "shouldInjectHeartbeatPrompt", {
	enumerable: true,
	get: function() {
		return shouldInjectHeartbeatPrompt;
	}
});
Object.defineProperty(exports, "shouldWarnOnOrphanedUserRepair", {
	enumerable: true,
	get: function() {
		return shouldWarnOnOrphanedUserRepair;
	}
});
