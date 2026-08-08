const require_account_id = require("./account-id-Di7YWYh4.cjs");
const require_account_lookup = require("./account-lookup-Bt7ehEAK.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_internal_runtime_context = require("./internal-runtime-context-C0HOZ5eF.cjs");
require("./workspace-oX0zfOZq.cjs");
const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
const require_bootstrap_budget = require("./bootstrap-budget-B73ETWvB.cjs");
const require_bootstrap_mode = require("./bootstrap-mode-DLO1HDKc.cjs");
const require_thread_bindings_policy = require("./thread-bindings-policy-C0B1MJxA.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_ai_internal_shared = require("@gabrielvfonseca/ai/internal/shared");
//#region src/agents/bootstrap-routing.ts
/**
* Resolves workspace bootstrap routing for one agent run. Shared by the
* embedded attempt runner and CLI-backend runs so both runtimes gate the
* first reply on a pending BOOTSTRAP.md the same way.
*/
/**
* Returns whether a session should receive primary bootstrap context. Subagents
* and ACP worker sessions inherit/run their own context path instead of getting
* the top-level bootstrap payload again.
*/
function isPrimaryBootstrapRun(sessionKey) {
	return !require_session_key.isSubagentSessionKey(sessionKey) && !require_session_key.isAcpSessionKey(sessionKey);
}
function resolveBootstrapRouting(params) {
	const bootstrapMode = require_bootstrap_mode.resolveBootstrapMode({
		bootstrapPending: params.workspaceBootstrapPending,
		runKind: params.bootstrapContextRunKind ?? "default",
		isInteractiveUserFacing: params.trigger === "user" || params.trigger === "manual",
		isPrimaryRun: params.isPrimaryRun,
		isCanonicalWorkspace: (params.isCanonicalWorkspace ?? true) && params.effectiveWorkspace === params.resolvedWorkspace,
		hasBootstrapFileAccess: params.hasBootstrapFileAccess
	});
	return {
		bootstrapMode,
		includeBootstrapInSystemContext: bootstrapMode === "full",
		includeBootstrapInRuntimeContext: false
	};
}
/**
* Resolves workspace bootstrap routing after checking pending state and
* loaded bootstrap files. Content can prove bootstrap is pending; callers
* decide whether that content also proves the run can complete file changes.
*/
async function resolveWorkspaceBootstrapRouting(params) {
	const workspaceBootstrapPending = await params.isWorkspaceBootstrapPending(params.resolvedWorkspace);
	const hasBootstrapContent = params.bootstrapFiles?.some((file) => file.name === "BOOTSTRAP.md" && !file.missing && typeof file.content === "string" && file.content.trim().length > 0) ?? false;
	return resolveBootstrapRouting({
		...params,
		workspaceBootstrapPending: workspaceBootstrapPending || hasBootstrapContent,
		hasBootstrapFileAccess: params.hasBootstrapFileAccess || params.bootstrapFilesProvideAccess !== false && hasBootstrapContent
	});
}
//#endregion
//#region src/agents/embedded-agent-runner/run/attempt.thread-helpers.ts
/** Custom transcript marker used to preserve cache-TTL pruning state across attempts. */
const ATTEMPT_CACHE_TTL_CUSTOM_TYPE = "operator.cache-ttl";
/**
* Combines hook-provided system context with the base prompt while preserving
* stable structured-section bytes. Returning undefined when hooks add nothing
* lets callers avoid rewriting the original prompt.
*/
function composeSystemPromptWithHookContext(params) {
	const prependSystem = typeof params.prependSystemContext === "string" ? (0, _gabrielvfonseca_ai_internal_shared.normalizeStructuredPromptSection)(params.prependSystemContext) : "";
	const appendSystem = typeof params.appendSystemContext === "string" ? (0, _gabrielvfonseca_ai_internal_shared.normalizeStructuredPromptSection)(params.appendSystemContext) : "";
	if (!prependSystem && !appendSystem) return;
	return require_hook_runner_global.joinPresentTextSegments([
		prependSystem,
		params.baseSystemPrompt,
		appendSystem
	], { trim: true });
}
/**
* Returns the workspace path that must be mounted for sandboxed spawn attempts.
* Read-only sandbox modes need the resolved workspace explicitly; full rw
* access uses the normal workspace wiring.
*/
function resolveAttemptSpawnWorkspaceDir(params) {
	return params.sandbox?.enabled && params.sandbox.workspaceAccess !== "rw" ? params.resolvedWorkspace : void 0;
}
/**
* Determines whether this attempt should append a cache-TTL marker. Compaction
* and timeout attempts skip the marker because their transcript boundary is
* already being rewritten.
*/
function shouldAppendAttemptCacheTtl(params) {
	if (params.timedOutDuringCompaction || params.compactionOccurredThisAttempt) return false;
	return params.config?.agents?.defaults?.contextPruning?.mode === "cache-ttl" && params.isCacheTtlEligibleProvider(params.provider, params.modelId, params.modelApi);
}
/**
* Appends the cache-TTL transcript marker when context-pruning policy and model
* eligibility both allow it. The boolean result tells callers whether the
* session transcript changed.
*/
function appendAttemptCacheTtlIfNeeded(params) {
	if (!shouldAppendAttemptCacheTtl(params)) return false;
	params.sessionManager.appendCustomEntry?.(ATTEMPT_CACHE_TTL_CUSTOM_TYPE, {
		timestamp: params.now ?? Date.now(),
		provider: params.provider,
		modelId: params.modelId
	});
	return true;
}
/**
* Records completed bootstrap turns only after a clean, non-compaction attempt.
* Failed, aborted, or compaction-mutated turns are not stable bootstrap history.
*/
function shouldPersistCompletedBootstrapTurn(params) {
	if (!params.shouldRecordCompletedBootstrapTurn || params.promptError || params.aborted) return false;
	if (params.timedOutDuringCompaction || params.compactionOccurredThisAttempt) return false;
	return true;
}
//#endregion
//#region src/agents/embedded-agent-runner/run/runtime-context-prompt.ts
/**
* Builds runtime context prompt fragments and custom session messages.
*/
const OPERATOR_RUNTIME_EVENT_USER_PROMPT = "Continue the Operator runtime event.";
/** Combines inbound context and the current prompt using the channel-provided joiner. */
function buildCurrentInboundPrompt(params) {
	const prefix = (params.preferResumableText === true ? params.context?.resumableText ?? params.context?.text : params.context?.text)?.trim() ?? "";
	if (!prefix) return params.prompt;
	if (!params.prompt) return prefix;
	return [prefix, params.prompt].join(params.context?.promptJoiner ?? "\n\n");
}
function splitLastPromptOccurrence(text, prompt) {
	const index = text.lastIndexOf(prompt);
	if (index === -1) return null;
	return {
		before: text.slice(0, index),
		after: text.slice(index + prompt.length)
	};
}
function replacePromptOccurrenceWithinHookBounds(params) {
	if (!params.promptBeforeHooks) return null;
	const prependIndex = params.prependContext ? params.text.indexOf(params.prependContext) : -1;
	if (params.prependContext && prependIndex === -1) return null;
	const searchStart = prependIndex === -1 ? 0 : prependIndex + params.prependContext.length;
	const appendIndex = params.appendContext ? params.text.lastIndexOf(params.appendContext) : -1;
	if (params.appendContext && appendIndex < searchStart) return null;
	const searchEnd = appendIndex === -1 ? params.text.length : appendIndex;
	const occurrenceIndex = params.text.lastIndexOf(params.promptBeforeHooks, searchEnd - params.promptBeforeHooks.length);
	if (occurrenceIndex < searchStart || occurrenceIndex + params.promptBeforeHooks.length > searchEnd) return null;
	return `${params.text.slice(0, occurrenceIndex)}${params.transcriptPrompt}${params.text.slice(occurrenceIndex + params.promptBeforeHooks.length)}`;
}
/**
* Separates user-authored prompt text from hidden runtime context. Transcript
* prompt stays user-visible; model prompt may carry runtime-only additions that
* should be delivered as hidden context instead of persisted as user text.
*/
function resolveRuntimeContextPromptParts(params) {
	const transcriptPrompt = params.transcriptPrompt;
	const shouldExtractInternalRuntimeContext = transcriptPrompt !== void 0;
	const extracted = shouldExtractInternalRuntimeContext ? require_internal_runtime_context.extractInternalRuntimeContext(params.effectivePrompt) : { text: params.effectivePrompt };
	const modelPrompt = params.modelPrompt === void 0 ? void 0 : shouldExtractInternalRuntimeContext ? require_internal_runtime_context.extractInternalRuntimeContext(params.modelPrompt) : { text: params.modelPrompt };
	const modelPromptBuildContext = params.modelPromptBuildContext ? {
		promptBeforeHooks: require_internal_runtime_context.extractInternalRuntimeContext(params.modelPromptBuildContext.promptBeforeHooks).text,
		transcriptPromptBeforeTransforms: require_internal_runtime_context.extractInternalRuntimeContext(params.modelPromptBuildContext.transcriptPromptBeforeTransforms).text,
		promptBeforeAnnotation: require_internal_runtime_context.extractInternalRuntimeContext(params.modelPromptBuildContext.promptBeforeAnnotation).text,
		prependContext: require_internal_runtime_context.extractInternalRuntimeContext(params.modelPromptBuildContext.prependContext).text,
		appendContext: require_internal_runtime_context.extractInternalRuntimeContext(params.modelPromptBuildContext.appendContext).text
	} : void 0;
	const modelPromptText = modelPrompt?.text ?? transcriptPrompt ?? extracted.text;
	const prompt = transcriptPrompt ?? extracted.text;
	if (!prompt.trim() && params.emptyTranscriptMode === "model-prompt") return {
		prompt: extracted.text,
		...modelPromptText.trim() && modelPromptText !== extracted.text ? { modelPrompt: modelPromptText } : {},
		...extracted.runtimeContext ? { runtimeContext: extracted.runtimeContext } : {}
	};
	const sourcePromptParts = modelPromptBuildContext ? splitLastPromptOccurrence(modelPromptBuildContext.promptBeforeHooks, modelPromptBuildContext.transcriptPromptBeforeTransforms) : void 0;
	const outerPromptParts = modelPromptBuildContext ? splitLastPromptOccurrence(extracted.text, modelPromptBuildContext.promptBeforeAnnotation) : void 0;
	const fallbackPromptParts = !modelPromptBuildContext ? modelPrompt ? splitLastPromptOccurrence(extracted.text, modelPrompt.text) ?? (transcriptPrompt ? splitLastPromptOccurrence(extracted.text, transcriptPrompt) : void 0) : transcriptPrompt ? splitLastPromptOccurrence(extracted.text, transcriptPrompt) : void 0 : void 0;
	const runtimeContext = [[
		outerPromptParts?.before,
		sourcePromptParts?.before ?? fallbackPromptParts?.before,
		sourcePromptParts?.after ?? fallbackPromptParts?.after,
		outerPromptParts?.after
	].map((part) => part?.trim()).filter((part) => Boolean(part)).join("\n\n"), extracted.runtimeContext].filter((value) => Boolean(value?.trim())).join("\n\n") || (!prompt.trim() ? extracted.text.trim() : void 0);
	if (!prompt.trim()) return runtimeContext ? {
		prompt: OPERATOR_RUNTIME_EVENT_USER_PROMPT,
		...modelPromptText.trim() && modelPromptText !== OPERATOR_RUNTIME_EVENT_USER_PROMPT ? { modelPrompt: modelPromptText } : {},
		runtimeContext,
		runtimeOnly: true,
		runtimeSystemContext: buildRuntimeContextMessageContent({
			runtimeContext,
			kind: "runtime-event"
		})
	} : {
		prompt: "",
		...modelPromptText ? { modelPrompt: modelPromptText } : {}
	};
	const returnModelPromptText = Boolean(sourcePromptParts?.before.trim() || sourcePromptParts?.after.trim()) && modelPromptBuildContext && modelPrompt ? replacePromptOccurrenceWithinHookBounds({
		text: modelPromptText,
		promptBeforeHooks: modelPromptBuildContext.promptBeforeHooks,
		transcriptPrompt: modelPromptBuildContext.transcriptPromptBeforeTransforms,
		prependContext: modelPromptBuildContext.prependContext,
		appendContext: modelPromptBuildContext.appendContext
	}) ?? modelPromptText : modelPromptText;
	return {
		prompt,
		...returnModelPromptText.trim() && returnModelPromptText !== prompt ? { modelPrompt: returnModelPromptText } : {},
		...runtimeContext ? { runtimeContext } : {}
	};
}
function buildRuntimeContextMessageContent(params) {
	return [
		params.kind === "runtime-event" ? require_internal_runtime_context.OPERATOR_RUNTIME_EVENT_HEADER : require_internal_runtime_context.OPERATOR_NEXT_TURN_RUNTIME_CONTEXT_HEADER,
		require_internal_runtime_context.OPERATOR_RUNTIME_CONTEXT_NOTICE,
		"",
		require_internal_runtime_context.INTERNAL_RUNTIME_CONTEXT_BEGIN,
		params.runtimeContext,
		require_internal_runtime_context.INTERNAL_RUNTIME_CONTEXT_END
	].join("\n");
}
/** Creates a non-displayed custom transcript message for runtime context, if any exists. */
function buildRuntimeContextCustomMessage(runtimeContext) {
	const trimmedRuntimeContext = runtimeContext?.trim();
	if (!trimmedRuntimeContext) return;
	return {
		role: "custom",
		customType: require_internal_runtime_context.OPERATOR_RUNTIME_CONTEXT_CUSTOM_TYPE,
		content: buildRuntimeContextMessageContent({
			runtimeContext: trimmedRuntimeContext,
			kind: "next-turn"
		}),
		display: false,
		details: {
			source: "operator-runtime-context",
			runtimeContextCarrier: true
		},
		timestamp: Date.now()
	};
}
//#endregion
//#region src/config/channel-capabilities.ts
const isStringArray = (value) => Array.isArray(value) && value.every((entry) => typeof entry === "string");
function normalizeCapabilities(capabilities) {
	if (!isStringArray(capabilities)) return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(capabilities);
	return normalized.length > 0 ? normalized : void 0;
}
function resolveAccountCapabilities(params) {
	const cfg = params.cfg;
	if (!cfg) return;
	const normalizedAccountId = require_account_id.normalizeAccountId(params.accountId);
	const accounts = cfg.accounts;
	if (accounts && typeof accounts === "object") {
		const match = require_account_lookup.resolveAccountEntry(accounts, normalizedAccountId);
		if (match) return normalizeCapabilities(match.capabilities) ?? normalizeCapabilities(cfg.capabilities);
	}
	return normalizeCapabilities(cfg.capabilities);
}
/** Resolves normalized string capabilities for a channel/account config pair. */
function resolveChannelCapabilities(params) {
	const cfg = params.cfg;
	const channel = require_registry_normalize.normalizeAnyChannelId(params.channel);
	if (!cfg || !channel) return;
	return resolveAccountCapabilities({
		cfg: cfg.channels?.[channel] ?? cfg[channel],
		accountId: params.accountId
	});
}
//#endregion
//#region src/agents/runtime-capabilities.ts
/**
* Runtime channel capability collector.
*
* Agent startup uses this to merge configured channel capabilities with prompt
* tools and thread-bound spawn features that depend on channel policy.
*/
const THREAD_BOUND_SUBAGENT_SPAWN_CAPABILITY = "threadbound-subagent-spawn";
const THREAD_BOUND_ACP_SPAWN_CAPABILITY = "threadbound-acp-spawn";
function mergeRuntimeCapabilities(base, additions = []) {
	const merged = [...base ?? []];
	const seen = new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntriesLower)(merged));
	for (const capability of additions) {
		const normalizedCapability = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(capability);
		if (!normalizedCapability || seen.has(normalizedCapability)) continue;
		seen.add(normalizedCapability);
		merged.push(capability);
	}
	return merged.length > 0 ? merged : void 0;
}
/** Collects the effective runtime capabilities for a channel/account pair. */
function collectRuntimeChannelCapabilities(params) {
	if (!params.channel) return;
	const threadSpawnCapabilities = [];
	if (params.cfg && require_thread_bindings_policy.supportsAutomaticThreadBindingSpawn(params.channel)) for (const [kind, capability] of [["subagent", THREAD_BOUND_SUBAGENT_SPAWN_CAPABILITY], ["acp", THREAD_BOUND_ACP_SPAWN_CAPABILITY]]) {
		const policy = require_thread_bindings_policy.resolveThreadBindingSpawnPolicy({
			cfg: params.cfg,
			channel: params.channel,
			accountId: params.accountId ?? void 0,
			kind
		});
		if (policy.enabled && policy.spawnEnabled) threadSpawnCapabilities.push(capability);
	}
	return mergeRuntimeCapabilities(resolveChannelCapabilities(params), params.cfg ? [...require_gateway.resolveChannelPromptCapabilities(params), ...threadSpawnCapabilities] : threadSpawnCapabilities);
}
//#endregion
//#region src/agents/system-prompt-report.ts
/**
* System prompt report builder.
*
* Session metadata uses this report to account for prompt size, bootstrap file
* injection, skills, and tool schema footprint without storing raw prompt text.
*/
const toolReportEntryCache = /* @__PURE__ */ new WeakMap();
const toolSchemaStatsCache = /* @__PURE__ */ new WeakMap();
function sha256(input) {
	return (0, node_crypto.createHash)("sha256").update(input).digest("hex");
}
function extractBetween(input, startMarker, endMarker) {
	const start = input.indexOf(startMarker);
	if (start === -1) return "";
	const end = input.indexOf(endMarker, start + startMarker.length);
	return end === -1 ? input.slice(start) : input.slice(start, end);
}
function parseSkillBlocks(skillsPrompt) {
	const prompt = skillsPrompt.trim();
	if (!prompt) return [];
	return Array.from(prompt.matchAll(/<skill>[\s\S]*?<\/skill>/gi)).map((match) => match[0] ?? "").map((block) => {
		return {
			name: block.match(/<name>\s*([^<]+?)\s*<\/name>/i)?.[1]?.trim() || "(unknown)",
			blockChars: block.length
		};
	}).filter((b) => b.blockChars > 0);
}
function buildToolSchemaStats(parameters) {
	if (!parameters || typeof parameters !== "object") return {
		schemaChars: 0,
		schemaHash: sha256(""),
		propertiesCount: null
	};
	const cached = toolSchemaStatsCache.get(parameters);
	if (cached) return cached;
	let schemaJson;
	try {
		schemaJson = JSON.stringify(parameters);
	} catch {
		schemaJson = "";
	}
	const stats = {
		schemaChars: schemaJson.length,
		schemaHash: sha256(schemaJson),
		propertiesCount: (() => {
			const schema = parameters;
			const props = typeof schema.properties === "object" ? schema.properties : null;
			if (!props || typeof props !== "object") return null;
			return Object.keys(props).length;
		})()
	};
	toolSchemaStatsCache.set(parameters, stats);
	return stats;
}
function buildToolsEntries(tools) {
	return tools.map((tool) => {
		const cached = toolReportEntryCache.get(tool);
		if (cached) return cached;
		const name = tool.name;
		const summary = tool.description?.trim() || tool.label?.trim() || "";
		const summaryChars = summary.length;
		const schemaStats = buildToolSchemaStats(tool.parameters);
		const entry = {
			name,
			summaryChars,
			summaryHash: sha256(summary),
			...schemaStats
		};
		toolReportEntryCache.set(tool, entry);
		return entry;
	});
}
function measureRenderedProjectContextChars(systemPrompt) {
	return extractBetween(systemPrompt, "\n# Project Context\n", "\n## Silent Replies\n").length;
}
/** Builds the stored report for a rendered system prompt and its inputs. */
function buildSystemPromptReport(params) {
	const systemPromptChars = params.systemPrompt.length;
	const projectContextChars = measureRenderedProjectContextChars(params.systemPrompt);
	const toolsEntries = buildToolsEntries(params.tools);
	const toolsSchemaChars = toolsEntries.reduce((sum, t) => sum + (t.schemaChars ?? 0), 0);
	const skillsEntries = parseSkillBlocks(params.skillsPrompt);
	return {
		source: params.source,
		generatedAt: params.generatedAt,
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		provider: params.provider,
		model: params.model,
		workspaceDir: params.workspaceDir,
		bootstrapMaxChars: params.bootstrapMaxChars,
		bootstrapTotalMaxChars: params.bootstrapTotalMaxChars,
		...params.bootstrapTruncation ? { bootstrapTruncation: params.bootstrapTruncation } : {},
		sandbox: params.sandbox,
		systemPrompt: {
			chars: systemPromptChars,
			hash: sha256(params.systemPrompt),
			projectContextChars,
			nonProjectContextChars: Math.max(0, systemPromptChars - projectContextChars)
		},
		...params.currentTurn ? { currentTurn: params.currentTurn } : {},
		injectedWorkspaceFiles: require_bootstrap_budget.buildBootstrapInjectionStats({
			bootstrapFiles: params.bootstrapFiles,
			injectedFiles: params.injectedFiles
		}),
		skills: {
			promptChars: params.skillsPrompt.length,
			hash: sha256(params.skillsPrompt),
			entries: skillsEntries
		},
		tools: {
			listChars: 0,
			schemaChars: toolsSchemaChars,
			entries: toolsEntries
		}
	};
}
//#endregion
Object.defineProperty(exports, "appendAttemptCacheTtlIfNeeded", {
	enumerable: true,
	get: function() {
		return appendAttemptCacheTtlIfNeeded;
	}
});
Object.defineProperty(exports, "buildCurrentInboundPrompt", {
	enumerable: true,
	get: function() {
		return buildCurrentInboundPrompt;
	}
});
Object.defineProperty(exports, "buildRuntimeContextCustomMessage", {
	enumerable: true,
	get: function() {
		return buildRuntimeContextCustomMessage;
	}
});
Object.defineProperty(exports, "buildSystemPromptReport", {
	enumerable: true,
	get: function() {
		return buildSystemPromptReport;
	}
});
Object.defineProperty(exports, "collectRuntimeChannelCapabilities", {
	enumerable: true,
	get: function() {
		return collectRuntimeChannelCapabilities;
	}
});
Object.defineProperty(exports, "composeSystemPromptWithHookContext", {
	enumerable: true,
	get: function() {
		return composeSystemPromptWithHookContext;
	}
});
Object.defineProperty(exports, "isPrimaryBootstrapRun", {
	enumerable: true,
	get: function() {
		return isPrimaryBootstrapRun;
	}
});
Object.defineProperty(exports, "resolveAttemptSpawnWorkspaceDir", {
	enumerable: true,
	get: function() {
		return resolveAttemptSpawnWorkspaceDir;
	}
});
Object.defineProperty(exports, "resolveRuntimeContextPromptParts", {
	enumerable: true,
	get: function() {
		return resolveRuntimeContextPromptParts;
	}
});
Object.defineProperty(exports, "resolveWorkspaceBootstrapRouting", {
	enumerable: true,
	get: function() {
		return resolveWorkspaceBootstrapRouting;
	}
});
Object.defineProperty(exports, "shouldPersistCompletedBootstrapTurn", {
	enumerable: true,
	get: function() {
		return shouldPersistCompletedBootstrapTurn;
	}
});
