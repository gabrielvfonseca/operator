require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_diagnostic_llm_content = require("./diagnostic-llm-content-DpdEBJOd.cjs");
require("./session-transcript-repair-vqlcO05-.cjs");
const require_provider_stream = require("./provider-stream-DRQnPAya.cjs");
const require_model_catalog = require("./model-catalog-BFgB2-Jk.cjs");
const require_model_visibility_policy = require("./model-visibility-policy-BAqBH6Uw.cjs");
const require_usage_format = require("./usage-format-Ed9eVdJX.cjs");
const require_extra_params = require("./extra-params-CBjN2etI.cjs");
const require_attempt_model_diagnostic_events = require("./attempt.model-diagnostic-events-D5B6PnSa.cjs");
const require_utils = require("./utils-CngUx0zS.cjs");
const require_model = require("./model-Don1-Go6.cjs");
const require_simple_completion_runtime = require("./simple-completion-runtime-BCVCP_Ps.cjs");
const require_session_override = require("./session-override-DHiJK0G6.cjs");
const require_session_target = require("./session-target-CYXSxwoZ.cjs");
let node_util = require("node:util");
let _gabrielvfonseca_ai_internal_runtime = require("@gabrielvfonseca/ai/internal/runtime");
//#region src/gateway/worker-environments/inference-terminal-message.ts
function projectWorkerInferenceTerminalMessage(params) {
	const content = params.message.content.map((part) => {
		switch (part.type) {
			case "text": return {
				type: part.type,
				text: part.text,
				...part.textSignature ? { textSignature: part.textSignature } : {}
			};
			case "thinking": return {
				type: part.type,
				thinking: part.thinking,
				...part.thinkingSignature ? { thinkingSignature: part.thinkingSignature } : {},
				...part.redacted !== void 0 ? { redacted: part.redacted } : {}
			};
			case "toolCall": return {
				type: part.type,
				id: part.id,
				name: part.name,
				arguments: structuredClone(part.arguments),
				...part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {},
				...part.executionMode ? { executionMode: part.executionMode } : {}
			};
			default: throw new Error("Unsupported assistant terminal content");
		}
	});
	const usage = params.message.usage;
	return {
		role: "assistant",
		content,
		api: params.modelIdentity.api,
		provider: params.modelIdentity.provider,
		model: params.modelIdentity.model,
		...params.message.responseModel ? { responseModel: params.message.responseModel } : {},
		...params.message.responseId ? { responseId: params.message.responseId } : {},
		usage: {
			input: usage.input,
			output: usage.output,
			cacheRead: usage.cacheRead,
			cacheWrite: usage.cacheWrite,
			...usage.contextUsage?.state === "available" ? { contextUsage: {
				state: usage.contextUsage.state,
				promptTokens: usage.contextUsage.promptTokens,
				totalTokens: usage.contextUsage.totalTokens
			} } : usage.contextUsage?.state === "unavailable" ? { contextUsage: { state: usage.contextUsage.state } } : {},
			totalTokens: usage.totalTokens,
			cost: {
				input: usage.cost.input,
				output: usage.cost.output,
				cacheRead: usage.cost.cacheRead,
				cacheWrite: usage.cost.cacheWrite,
				total: usage.cost.total,
				...usage.cost.totalOrigin ? { totalOrigin: usage.cost.totalOrigin } : {}
			}
		},
		stopReason: params.stopReason,
		timestamp: params.message.timestamp
	};
}
//#endregion
//#region src/gateway/worker-environments/inference-tool-call-stream.ts
const MAX_PENDING_TOOL_DELTA_BYTES = 1024 * 1024;
const MAX_PENDING_TOOL_DELTAS = 4096;
const MAX_STREAMED_TOOL_DELTAS = 64 * 1024;
const RETAINED_TOOL_ARGUMENT_CHUNK_BYTES = 16 * 1024;
function contentAt$1(message, index) {
	return message.content[index];
}
function createWorkerToolCallStream(params) {
	const pendingDeltas = /* @__PURE__ */ new Map();
	let pendingDeltaBytes = 0;
	let pendingDeltaCount = 0;
	const started = /* @__PURE__ */ new Set();
	const ended = /* @__PURE__ */ new Set();
	const identities = /* @__PURE__ */ new Map();
	const emittedArgumentChunks = /* @__PURE__ */ new Map();
	const emittedArgumentChunkBytes = /* @__PURE__ */ new Map();
	let retainedArgumentBytes = 0;
	let streamedDeltaCount = 0;
	const emitDelta = (contentIndex, delta) => {
		if (!params.isCurrent()) return "cancelled";
		if (streamedDeltaCount + 1 > MAX_STREAMED_TOOL_DELTAS) return "invalid";
		streamedDeltaCount += 1;
		const deltaBytes = Buffer.byteLength(delta, "utf8");
		if (deltaBytes === 0) return params.isCurrent() ? "ok" : "cancelled";
		if (retainedArgumentBytes + deltaBytes > MAX_PENDING_TOOL_DELTA_BYTES) return "invalid";
		params.emit({
			type: "toolcall_delta",
			contentIndex,
			delta
		});
		const emitted = emittedArgumentChunks.get(contentIndex) ?? [];
		const emittedBytes = emittedArgumentChunkBytes.get(contentIndex) ?? [];
		const lastIndex = emitted.length - 1;
		const last = emitted[lastIndex];
		const lastBytes = emittedBytes[lastIndex];
		if (last !== void 0 && lastBytes !== void 0 && lastBytes + deltaBytes <= RETAINED_TOOL_ARGUMENT_CHUNK_BYTES) {
			emitted[lastIndex] = last + delta;
			emittedBytes[lastIndex] = lastBytes + deltaBytes;
		} else {
			emitted.push(delta);
			emittedBytes.push(deltaBytes);
		}
		emittedArgumentChunks.set(contentIndex, emitted);
		emittedArgumentChunkBytes.set(contentIndex, emittedBytes);
		retainedArgumentBytes += deltaBytes;
		return params.isCurrent() ? "ok" : "cancelled";
	};
	const start = (contentIndex, partial) => {
		if (started.has(contentIndex)) return params.isCurrent() ? "ok" : "cancelled";
		const content = contentAt$1(partial, contentIndex);
		if (content?.type !== "toolCall" || !content.id || !content.name) return "invalid";
		if (!params.isCurrent()) return "cancelled";
		started.add(contentIndex);
		identities.set(contentIndex, {
			id: content.id,
			name: content.name
		});
		params.emit({
			type: "toolcall_start",
			contentIndex,
			id: content.id,
			toolName: content.name
		});
		if (!params.isCurrent()) return "cancelled";
		for (const delta of pendingDeltas.get(contentIndex) ?? []) {
			const result = emitDelta(contentIndex, delta);
			pendingDeltaBytes -= Buffer.byteLength(delta, "utf8");
			pendingDeltaCount -= 1;
			if (result !== "ok") return result;
		}
		pendingDeltas.delete(contentIndex);
		return "ok";
	};
	const delta = (contentIndex, value, partial) => {
		if (ended.has(contentIndex)) return "invalid";
		if (started.has(contentIndex)) return emitDelta(contentIndex, value);
		const pending = pendingDeltas.get(contentIndex) ?? [];
		pendingDeltaBytes += Buffer.byteLength(value, "utf8");
		pendingDeltaCount += 1;
		if (pendingDeltaBytes > MAX_PENDING_TOOL_DELTA_BYTES || pendingDeltaCount > MAX_PENDING_TOOL_DELTAS) return "invalid";
		pending.push(value);
		pendingDeltas.set(contentIndex, pending);
		const result = start(contentIndex, partial);
		return result === "invalid" ? "ok" : result;
	};
	const reconcile = (contentIndex, complete) => {
		const identity = identities.get(contentIndex);
		if (!identity || identity.id !== complete.id || identity.name !== complete.name) return "invalid";
		const emittedJson = (emittedArgumentChunks.get(contentIndex) ?? []).join("");
		if (!emittedJson) try {
			const completeJson = JSON.stringify(complete.arguments);
			return typeof completeJson === "string" ? emitDelta(contentIndex, completeJson) : "invalid";
		} catch {
			return "invalid";
		}
		try {
			return (0, node_util.isDeepStrictEqual)(JSON.parse(emittedJson), complete.arguments) ? params.isCurrent() ? "ok" : "cancelled" : "invalid";
		} catch {
			return "invalid";
		}
	};
	const end = (contentIndex, partial, complete) => {
		if (ended.has(contentIndex)) return reconcile(contentIndex, complete);
		const startResult = start(contentIndex, partial);
		if (startResult !== "ok") return startResult;
		const reconcileResult = reconcile(contentIndex, complete);
		if (reconcileResult !== "ok") return reconcileResult;
		ended.add(contentIndex);
		params.emit({
			type: "toolcall_end",
			contentIndex
		});
		return params.isCurrent() ? "ok" : "cancelled";
	};
	return {
		delta,
		end,
		matchesTerminal: (message) => {
			const terminal = new Set(message.content.flatMap((content, contentIndex) => content.type === "toolCall" ? [contentIndex] : []));
			return pendingDeltas.size === 0 && terminal.size === started.size && [...started].every((contentIndex) => terminal.has(contentIndex) && ended.has(contentIndex));
		},
		start
	};
}
//#endregion
//#region src/gateway/worker-environments/inference-runtime.ts
function resolveWorkerInferenceAuthProfileMode(params) {
	const configuredMode = params.config.auth?.profiles?.[params.profileId]?.mode;
	if (configuredMode) return configuredMode;
	return require_store.ensureAuthProfileStore(params.agentDir, {
		readOnly: true,
		allowKeychainPrompt: false,
		config: params.config
	}).profiles[params.profileId]?.type;
}
function projectWorkerInferenceModelRouteConfig(params) {
	const authRequirement = require_openai_routing.resolveProviderModelRouteAuthRequirement(params.authMode);
	if (!authRequirement) return params.config;
	const resolution = require_openai_routing.resolveProviderModelRoutes({
		provider: params.provider,
		modelId: params.modelId,
		config: params.config
	});
	if (resolution?.kind !== "routes") return params.config;
	const route = resolution.routes.find((candidate) => candidate.authRequirement === authRequirement);
	if (!route) return params.config;
	return require_openai_routing.projectProviderModelRouteConfig({
		provider: params.provider,
		config: params.config,
		route
	});
}
const ERROR_MESSAGES = {
	"model-not-approved": "Model is not approved for this agent.",
	"invalid-context": "Inference context is invalid.",
	"epoch-mismatch": "Worker run epoch does not match.",
	"session-not-attached": "Worker session is not attached.",
	"provider-error": "Model provider request failed.",
	cancelled: "Inference request was cancelled."
};
function inferenceError(reason, usage) {
	return {
		type: "error",
		reason,
		message: ERROR_MESSAGES[reason],
		...usage ? { usage: structuredClone(usage) } : {}
	};
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function copyTool(tool) {
	if (!isRecord(tool.parameters) || tool.parameters.type !== "object") return;
	return {
		name: tool.name,
		description: tool.description,
		parameters: structuredClone(tool.parameters)
	};
}
function buildContext(context) {
	const tools = [];
	for (const tool of context.tools ?? []) {
		const copied = copyTool(tool);
		if (!copied) return;
		tools.push(copied);
	}
	return {
		...context.systemPrompt !== void 0 ? { systemPrompt: context.systemPrompt } : {},
		messages: structuredClone(context.messages),
		...tools.length > 0 ? { tools } : {}
	};
}
function optionBudgetsFitModel(options, model) {
	if (options.maxTokens !== void 0 && options.maxTokens > model.maxTokens) return false;
	for (const budget of Object.values(options.thinkingBudgets ?? {})) if (budget !== void 0 && budget > model.maxTokens) return false;
	return true;
}
function buildStreamOptions(params) {
	const options = params.request.options;
	return {
		...options.temperature !== void 0 ? { temperature: options.temperature } : {},
		...options.maxTokens !== void 0 ? { maxTokens: options.maxTokens } : {},
		...options.reasoning !== void 0 ? { reasoning: require_utils.mapThinkingLevel(options.reasoning) } : {},
		...options.thinkingBudgets ? { thinkingBudgets: { ...options.thinkingBudgets } } : {},
		signal: params.signal,
		sessionId: params.request.sessionId,
		...params.apiKey ? { apiKey: params.apiKey } : {}
	};
}
function contentAt(message, index) {
	return message.content[index];
}
function toWorkerStreamEvent(event, modelIdentity) {
	switch (event.type) {
		case "start": return {
			type: "start",
			resolvedModel: {
				api: modelIdentity.api,
				provider: modelIdentity.provider,
				model: modelIdentity.model
			},
			timestamp: event.partial.timestamp
		};
		case "text_start": {
			const content = contentAt(event.partial, event.contentIndex);
			return {
				type: "text_start",
				contentIndex: event.contentIndex,
				...content?.type === "text" && content.textSignature ? { contentSignature: content.textSignature } : {}
			};
		}
		case "text_delta": return {
			type: "text_delta",
			contentIndex: event.contentIndex,
			delta: event.delta
		};
		case "text_end": {
			const content = contentAt(event.partial, event.contentIndex);
			return {
				type: "text_end",
				contentIndex: event.contentIndex,
				...content?.type === "text" && content.textSignature ? { contentSignature: content.textSignature } : {}
			};
		}
		case "thinking_start": return {
			type: "thinking_start",
			contentIndex: event.contentIndex
		};
		case "thinking_delta": return {
			type: "thinking_delta",
			contentIndex: event.contentIndex,
			delta: event.delta
		};
		case "thinking_end": {
			const content = contentAt(event.partial, event.contentIndex);
			return {
				type: "thinking_end",
				contentIndex: event.contentIndex,
				...content?.type === "thinking" && content.thinkingSignature ? { contentSignature: content.thinkingSignature } : {}
			};
		}
		case "toolcall_start":
		case "toolcall_delta":
		case "toolcall_end":
		case "done":
		case "error": return;
	}
}
function emitWorkerInferenceUsage(params) {
	if (!require_diagnostic_events.isDiagnosticsEnabled(params.config)) return;
	const usage = require_session_accessor.normalizeUsage(params.usage);
	if (!require_session_accessor.hasNonzeroUsage(usage)) return;
	const input = usage.input ?? 0;
	const output = usage.output ?? 0;
	const cacheRead = usage.cacheRead ?? 0;
	const cacheWrite = usage.cacheWrite ?? 0;
	const promptTokens = input + cacheRead + cacheWrite;
	const total = usage.total ?? promptTokens + output;
	const costUsd = require_usage_format.estimateUsageCost({
		usage,
		cost: require_usage_format.resolveModelCostConfig({
			provider: params.model.provider,
			model: params.model.id,
			config: params.config
		})
	});
	require_diagnostic_events.emitTrustedDiagnosticEvent({
		type: "model.usage",
		trace: require_diagnostic_events.freezeDiagnosticTraceContext(params.trace),
		sessionKey: params.target.sessionKey,
		sessionId: params.request.sessionId,
		channel: "worker",
		agentId: params.target.agentId,
		provider: params.model.provider,
		model: params.model.id,
		usage: {
			input,
			output,
			cacheRead,
			cacheWrite,
			promptTokens,
			total
		},
		context: {
			limit: params.model.contextTokens ?? params.model.contextWindow,
			...usage.contextUsage?.state === "available" ? { used: usage.contextUsage.promptTokens } : {}
		},
		...costUsd !== void 0 ? { costUsd } : {},
		durationMs: params.durationMs
	});
}
const DEFAULT_DEPENDENCIES = {
	now: Date.now,
	resolveSessionTarget: (config, sessionId) => {
		const target = require_session_target.resolveWorkerSessionTarget(config, sessionId);
		if (!target) return;
		return {
			...target,
			agentId: target.agentId ?? require_agent_scope_config.resolveDefaultAgentId(config)
		};
	},
	loadManifestSnapshot: require_manifest_contract_eligibility.loadManifestMetadataSnapshot,
	loadCatalog: require_model_catalog.loadModelCatalog,
	resolveDefaultModel: require_codex_plugin_diagnostics.resolveDefaultModelForAgent,
	resolveSessionAuthProfile: require_session_override.resolveSessionAuthProfileOverride,
	resolveAuthProfileMode: resolveWorkerInferenceAuthProfileMode,
	resolveModel: require_model.resolveModelAsync,
	prepareModel: require_simple_completion_runtime.prepareSimpleCompletionModel,
	resolveProviderStream: require_provider_stream.registerProviderStreamForModel,
	resolveStream: require_attempt_model_diagnostic_events.resolveEmbeddedAgentStreamFn,
	applyStreamPolicy: require_extra_params.applyExtraParamsToAgent,
	stream: _gabrielvfonseca_ai_internal_runtime.streamSimple,
	wrapStream: require_attempt_model_diagnostic_events.wrapStreamFnWithDiagnosticModelCallEvents,
	createTrace: require_diagnostic_events.createDiagnosticTraceContextFromActiveScope,
	recordUsage: emitWorkerInferenceUsage
};
function resolveReturnedProfileSource(entry, profileId) {
	if (!profileId) return;
	if (entry.authProfileOverride?.trim() !== profileId) return "auto";
	return entry.authProfileOverrideSource ?? (typeof entry.authProfileOverrideCompactionCount === "number" ? "auto" : "user");
}
async function resolveApprovedModel(params) {
	const { config, target, request, dependencies } = params;
	const rawRef = `${request.modelRef.provider}/${request.modelRef.model}`;
	if (require_model_ref_profile.splitTrailingAuthProfile(rawRef).profile) return;
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(config, target.agentId);
	const agentDir = require_agent_scope_config.resolveAgentDir(config, target.agentId);
	const manifestSnapshot = dependencies.loadManifestSnapshot({
		config,
		workspaceDir
	});
	const defaultModel = dependencies.resolveDefaultModel({
		cfg: config,
		agentId: target.agentId,
		manifestPlugins: manifestSnapshot.plugins,
		...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
	});
	const agentModels = require_agent_scope_config.resolveAgentConfig(config, target.agentId)?.models;
	const aliasConfig = agentModels ? {
		...config,
		agents: {
			...config.agents,
			defaults: {
				...config.agents?.defaults,
				models: {
					...config.agents?.defaults?.models,
					...agentModels
				}
			}
		}
	} : config;
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: aliasConfig,
		defaultProvider: defaultModel.provider,
		manifestPlugins: manifestSnapshot.plugins,
		...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
	});
	const resolved = require_model_selection_shared.resolveModelRefFromString({
		cfg: aliasConfig,
		raw: rawRef,
		defaultProvider: defaultModel.provider,
		aliasIndex,
		manifestPlugins: manifestSnapshot.plugins,
		...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
	});
	if (!resolved || require_model_selection_normalize.normalizeProviderId(resolved.ref.provider) !== require_model_selection_normalize.normalizeProviderId(request.modelRef.provider)) return;
	const policy = require_model_visibility_policy.createModelVisibilityPolicy({
		cfg: config,
		catalog: await dependencies.loadCatalog({
			agentDir,
			config,
			metadataSnapshot: manifestSnapshot,
			useCache: false,
			workspaceDir
		}),
		defaultProvider: defaultModel.provider,
		defaultModel: `${defaultModel.provider}/${defaultModel.model}`,
		agentId: target.agentId,
		manifestPlugins: manifestSnapshot.plugins,
		...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
	});
	const resolvedKey = require_model_selection_shared.modelCatalogLogicalKey({
		provider: resolved.ref.provider,
		id: resolved.ref.model
	});
	if (!(policy.allowedCatalog.some((entry) => resolvedKey === require_model_selection_shared.modelCatalogLogicalKey(entry)) || policy.retainedKeys.has(resolvedKey)) || !policy.allows(resolved.ref)) return;
	const configuredDefaultProfile = resolvedKey === require_model_selection_shared.modelCatalogLogicalKey({
		provider: defaultModel.provider,
		id: defaultModel.model
	}) ? require_model_ref_profile.splitTrailingAuthProfile(require_agent_scope.resolveAgentEffectiveModelPrimary(config, target.agentId) ?? "").profile : void 0;
	const harnessPolicy = require_policy.resolveAgentHarnessPolicy({
		provider: resolved.ref.provider,
		modelId: resolved.ref.model,
		config,
		agentId: target.agentId,
		sessionKey: target.sessionKey
	});
	const agentRuntimeId = harnessPolicy.runtimeSource !== "implicit" || config.plugins?.entries?.codex?.enabled === true ? harnessPolicy.runtime : void 0;
	const sessionProfileId = await dependencies.resolveSessionAuthProfile({
		cfg: config,
		provider: resolved.ref.provider,
		acceptedProviderIds: require_openai_routing.listOpenAIAuthProfileProvidersForAgentRuntime({
			provider: resolved.ref.provider,
			harnessRuntime: harnessPolicy.runtime,
			config
		}),
		agentDir,
		sessionEntry: target.sessionEntry,
		sessionStore: target.sessionStore,
		sessionKey: target.sessionKey,
		storePath: target.storePath,
		isNewSession: false
	});
	const sessionProfileSource = resolveReturnedProfileSource(target.sessionEntry, sessionProfileId);
	const selectedProfile = sessionProfileId && sessionProfileSource === "user" ? {
		id: sessionProfileId,
		source: sessionProfileSource
	} : configuredDefaultProfile ? {
		id: configuredDefaultProfile,
		source: "user"
	} : sessionProfileId ? {
		id: sessionProfileId,
		source: sessionProfileSource
	} : void 0;
	const modelConfig = projectWorkerInferenceModelRouteConfig({
		config,
		provider: resolved.ref.provider,
		modelId: resolved.ref.model,
		authMode: selectedProfile ? dependencies.resolveAuthProfileMode({
			config,
			agentDir,
			profileId: selectedProfile.id
		}) : void 0
	});
	const modelResolver = require_simple_completion_runtime.bindSimpleCompletionModelResolverWorkspace((provider, modelId, resolvedAgentDir, cfg, options) => dependencies.resolveModel(provider, modelId, resolvedAgentDir, cfg, {
		...options,
		...agentRuntimeId ? { agentRuntimeId } : {},
		workspaceDir
	}), workspaceDir);
	const prepared = await dependencies.prepareModel({
		cfg: modelConfig,
		provider: resolved.ref.provider,
		modelId: resolved.ref.model,
		agentDir,
		...selectedProfile ? { profileId: selectedProfile.id } : {},
		...selectedProfile ? { preferredProfile: selectedProfile.id } : {},
		...selectedProfile ? { bindAuthOwner: true } : {},
		allowMissingApiKeyModes: ["aws-sdk"],
		useAsyncModelResolution: true,
		modelResolver
	});
	return {
		provider: resolved.ref.provider,
		model: resolved.ref.model,
		agentDir,
		workspaceDir,
		prepared
	};
}
function createWorkerInferenceExecutor(overrides = {}) {
	const dependencies = {
		...DEFAULT_DEPENDENCIES,
		...overrides
	};
	return async (params) => {
		const { identity, request, signal } = params;
		if (identity.sessionId !== request.sessionId) return inferenceError("session-not-attached");
		if (identity.ownerEpoch !== request.runEpoch) return inferenceError("epoch-mismatch");
		if (signal.aborted || !params.isCurrent()) return inferenceError("cancelled");
		const config = params.config ?? require_io.getRuntimeConfig();
		const target = dependencies.resolveSessionTarget(config, request.sessionId);
		if (!target) return inferenceError("session-not-attached");
		const context = buildContext(request.context);
		if (!context) return inferenceError("invalid-context");
		const approved = await resolveApprovedModel({
			config,
			target,
			request,
			dependencies
		});
		if (!approved) return inferenceError("model-not-approved");
		if ("error" in approved.prepared) return inferenceError("provider-error");
		const modelIdentity = {
			api: approved.prepared.model.api,
			provider: approved.provider,
			model: approved.model
		};
		const logicalModel = approved.prepared.model;
		const providerModel = logicalModel.provider === "openai" && logicalModel.api === "openai-chatgpt-responses" ? {
			...logicalModel,
			baseUrl: require_simple_completion_runtime.normalizeCodexResponsesBaseUrlForOpenAISdk(logicalModel.baseUrl)
		} : logicalModel;
		const providerStream = dependencies.resolveProviderStream({
			model: providerModel,
			cfg: config,
			agentDir: approved.agentDir,
			workspaceDir: approved.workspaceDir,
			registerStream: false
		});
		const authValue = approved.prepared.auth.apiKey;
		const streamAgent = { streamFn: dependencies.resolveStream({
			currentStreamFn: dependencies.stream,
			...providerStream ? { providerStreamFn: providerStream } : {},
			sessionId: request.sessionId,
			signal,
			model: providerModel,
			resolvedApiKey: authValue,
			authProfileId: approved.prepared.auth.profileId
		}) };
		const streamPolicyOptions = {
			...request.options.temperature !== void 0 ? { temperature: request.options.temperature } : {},
			...request.options.maxTokens !== void 0 ? { maxTokens: request.options.maxTokens } : {},
			...request.options.reasoning !== void 0 ? { reasoning: request.options.reasoning } : {},
			...request.options.thinkingBudgets ? { thinkingBudgets: { ...request.options.thinkingBudgets } } : {}
		};
		dependencies.applyStreamPolicy(streamAgent, config, approved.provider, approved.model, streamPolicyOptions, streamPolicyOptions.reasoning, target.agentId, approved.workspaceDir, providerModel, approved.agentDir);
		const scopedStream = streamAgent.streamFn;
		const model = providerModel;
		if (!optionBudgetsFitModel(request.options, model)) return inferenceError("invalid-context");
		if (signal.aborted || !params.isCurrent()) return inferenceError("cancelled");
		const startedAt = dependencies.now();
		const trace = dependencies.createTrace();
		let modelCallSeq = 0;
		const stream = dependencies.wrapStream(scopedStream, {
			runId: request.runId,
			sessionKey: target.sessionKey,
			sessionId: request.sessionId,
			provider: model.provider,
			model: model.id,
			api: model.api,
			contextTokenBudget: model.contextTokens ?? model.contextWindow,
			trace,
			contentCapture: require_diagnostic_llm_content.resolveDiagnosticModelContentCapturePolicy(config),
			nextCallId: () => `${request.runId}:${request.turnId}:worker-model:${modelCallSeq += 1}`
		});
		let usageRecorded = false;
		const recordUsage = (usage) => {
			if (usageRecorded) return;
			usageRecorded = true;
			dependencies.recordUsage({
				config,
				target,
				request,
				model,
				usage,
				durationMs: Math.max(0, dependencies.now() - startedAt),
				trace
			});
		};
		const executionIsCurrent = () => !signal.aborted && params.isCurrent();
		const toolCalls = createWorkerToolCallStream({
			emit: params.emit,
			isCurrent: executionIsCurrent
		});
		const providerAbort = new AbortController();
		const providerSignal = AbortSignal.any([signal, providerAbort.signal]);
		try {
			const events = await stream(model, context, buildStreamOptions({
				request,
				signal: providerSignal,
				apiKey: authValue
			}));
			for await (const event of events) {
				if (event.type === "done") {
					recordUsage(event.message.usage);
					if (signal.aborted || !params.isCurrent()) return inferenceError("cancelled", event.message.usage);
					for (const [contentIndex, content] of event.message.content.entries()) if (content.type === "toolCall") {
						const endResult = toolCalls.end(contentIndex, event.message, content);
						if (endResult === "cancelled") return inferenceError("cancelled", event.message.usage);
						if (endResult === "invalid") return inferenceError("provider-error");
					}
					if (!toolCalls.matchesTerminal(event.message)) return inferenceError("provider-error");
					return {
						type: "done",
						message: projectWorkerInferenceTerminalMessage({
							message: event.message,
							modelIdentity,
							stopReason: event.reason
						})
					};
				}
				if (event.type === "error") {
					recordUsage(event.error.usage);
					return inferenceError(event.reason === "aborted" ? "cancelled" : "provider-error", event.error.usage);
				}
				if (signal.aborted || !params.isCurrent()) return inferenceError("cancelled");
				if (event.type === "toolcall_start") {
					if (toolCalls.start(event.contentIndex, event.partial) === "cancelled") return inferenceError("cancelled");
					continue;
				}
				if (event.type === "toolcall_delta") {
					const deltaResult = toolCalls.delta(event.contentIndex, event.delta, event.partial);
					if (deltaResult === "cancelled") return inferenceError("cancelled");
					if (deltaResult === "invalid") return inferenceError("provider-error");
					continue;
				}
				if (event.type === "toolcall_end") {
					const endResult = toolCalls.end(event.contentIndex, event.partial, event.toolCall);
					if (endResult === "cancelled") return inferenceError("cancelled");
					if (endResult === "invalid") return inferenceError("provider-error");
					continue;
				}
				const workerEvent = toWorkerStreamEvent(event, modelIdentity);
				if (workerEvent) params.emit(workerEvent);
			}
			return inferenceError(signal.aborted ? "cancelled" : "provider-error");
		} catch {
			return inferenceError(signal.aborted ? "cancelled" : "provider-error");
		} finally {
			providerAbort.abort();
		}
	};
}
const executeWorkerInference = createWorkerInferenceExecutor();
//#endregion
exports.createWorkerInferenceExecutor = createWorkerInferenceExecutor;
exports.executeWorkerInference = executeWorkerInference;
exports.projectWorkerInferenceModelRouteConfig = projectWorkerInferenceModelRouteConfig;
