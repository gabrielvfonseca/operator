require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_gateway_request_scope = require("./gateway-request-scope-Dy7CSqxn.cjs");
require("./model-selection-BvFurMxy.cjs");
require("./logging-CPL2M9DX.cjs");
const require_usage_format = require("./usage-format-Ed9eVdJX.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/plugins/runtime/runtime-llm.runtime.ts
const defaultLogger = require_logger.getChildLogger({ capability: "runtime.llm" });
function toRuntimeLogger(logger) {
	return {
		debug: (message, meta) => logger.debug?.(meta, message),
		info: (message, meta) => logger.info(meta, message),
		warn: (message, meta) => logger.warn(meta, message),
		error: (message, meta) => logger.error(meta, message)
	};
}
function normalizeCaller(caller, fallback) {
	const source = caller ?? fallback;
	if (!source) return { kind: "unknown" };
	return {
		kind: source.kind,
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(source.id) ? { id: source.id.trim() } : {},
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(source.name) ? { name: source.name.trim() } : {}
	};
}
function resolveTrustedCaller(authority) {
	if (authority?.caller?.kind === "context-engine") return normalizeCaller(authority.caller);
	const scopedPluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_gateway_request_scope.getPluginRuntimeGatewayRequestScope()?.pluginId);
	if (scopedPluginId) return {
		kind: "plugin",
		id: scopedPluginId
	};
	return normalizeCaller(authority?.caller);
}
function resolveRuntimeConfig(options) {
	const cfg = options.getConfig?.();
	if (!cfg) throw new Error("Plugin LLM completion requires an injected runtime config scope.");
	return cfg;
}
async function resolveAgentId(params) {
	const authorityAgentIdRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.authority?.agentId);
	const requestedAgentIdRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.request.agentId);
	const authorityAgentId = authorityAgentIdRaw ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(authorityAgentIdRaw) : void 0;
	const requestedAgentId = requestedAgentIdRaw ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(requestedAgentIdRaw) : void 0;
	if (params.authority?.requiresBoundAgent && !authorityAgentId) throw new Error("Plugin LLM completion is not bound to an active session agent.");
	if (authorityAgentId) {
		if (requestedAgentId && requestedAgentId !== authorityAgentId && !params.allowAgentIdOverride) throw new Error("Plugin LLM completion cannot override the active session agent.");
		return authorityAgentId;
	}
	if (requestedAgentId) {
		if (!params.allowAgentIdOverride) throw new Error("Plugin LLM completion cannot override the target agent.");
		return requestedAgentId;
	}
	const { resolveDefaultAgentId } = await Promise.resolve().then(() => require("./agent-scope-Ce0XqMNr.cjs")).then((n) => n.agent_scope_exports);
	return resolveDefaultAgentId(params.cfg);
}
function buildSystemPrompt(params) {
	const segments = [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.systemPrompt), ...params.messages.filter((message) => message.role === "system").map((message) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.content))].filter((segment) => Boolean(segment));
	return segments.length > 0 ? segments.join("\n\n") : void 0;
}
function buildMessages(params) {
	const now = Date.now();
	return params.request.messages.filter((message) => message.role !== "system").map((message) => message.role === "user" ? {
		role: "user",
		content: message.content,
		timestamp: now
	} : {
		role: "assistant",
		content: [{
			type: "text",
			text: message.content
		}],
		api: params.api,
		provider: params.provider,
		model: params.model,
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				total: 0
			}
		},
		stopReason: "stop",
		timestamp: now
	});
}
function readFiniteNonNegativeNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : void 0;
}
function readExplicitCostUsd(raw) {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
	const cost = raw.cost;
	if (typeof cost === "number") return readFiniteNonNegativeNumber(cost);
	if (!cost || typeof cost !== "object" || Array.isArray(cost)) return;
	return readFiniteNonNegativeNumber(cost.totalUsd) ?? readFiniteNonNegativeNumber(cost.total);
}
function buildUsage(params) {
	const costConfig = require_usage_format.resolveModelCostConfig({
		provider: params.provider,
		model: params.model,
		config: params.cfg
	});
	const costUsd = readExplicitCostUsd(params.rawUsage) ?? require_usage_format.estimateUsageCost({
		usage: params.normalized,
		cost: costConfig
	});
	return {
		...params.normalized?.input !== void 0 ? { inputTokens: params.normalized.input } : {},
		...params.normalized?.output !== void 0 ? { outputTokens: params.normalized.output } : {},
		...params.normalized?.cacheRead !== void 0 ? { cacheReadTokens: params.normalized.cacheRead } : {},
		...params.normalized?.cacheWrite !== void 0 ? { cacheWriteTokens: params.normalized.cacheWrite } : {},
		...params.normalized?.total !== void 0 ? { totalTokens: params.normalized.total } : {},
		...costUsd !== void 0 ? { costUsd } : {}
	};
}
function finiteOption(value) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(value);
}
function normalizeAllowedModelRef(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	if (trimmed === "*") return "*";
	const parsed = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.parseModelCatalogRef)(trimmed);
	if (!parsed) return null;
	const normalized = require_model_selection_normalize.normalizeModelRef(parsed.provider, parsed.modelId);
	return require_model_input.modelKey(normalized.provider, normalized.model);
}
function buildPolicyFromEntry(entry) {
	const allowedModels = /* @__PURE__ */ new Set();
	let allowAnyModel = false;
	for (const modelRef of entry.allowedModels ?? []) {
		const normalizedModelRef = normalizeAllowedModelRef(modelRef);
		if (!normalizedModelRef) continue;
		if (normalizedModelRef === "*") {
			allowAnyModel = true;
			continue;
		}
		allowedModels.add(normalizedModelRef);
	}
	return {
		allowAgentIdOverride: entry.allowAgentIdOverride === true,
		allowModelOverride: entry.allowModelOverride === true,
		hasConfiguredAllowedModels: entry.hasAllowedModelsConfig === true,
		allowAnyModel,
		allowedModels
	};
}
function resolvePluginPolicyId(authority, caller) {
	const authorityPluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(authority?.pluginIdForPolicy);
	if (authorityPluginId) return authorityPluginId;
	if (caller.kind !== "plugin") return;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(caller.id);
}
function resolvePluginLlmOverridePolicy(cfg, pluginId) {
	if (!pluginId) return;
	const entry = require_config_state.normalizePluginsConfig(cfg.plugins).entries[pluginId]?.llm;
	return entry ? buildPolicyFromEntry(entry) : void 0;
}
function resolveAuthorityModelPolicy(authority) {
	if (authority?.allowAgentIdOverride !== true && authority?.allowModelOverride !== true && authority?.allowedModels === void 0) return;
	return buildPolicyFromEntry({
		allowAgentIdOverride: authority.allowAgentIdOverride,
		allowModelOverride: authority.allowModelOverride,
		hasAllowedModelsConfig: authority.allowedModels !== void 0,
		allowedModels: authority.allowedModels
	});
}
function assertAllowedModelOverride(params) {
	let policy;
	let policyOwnerPluginId;
	if (params.authorityPolicy?.allowModelOverride) policy = params.authorityPolicy;
	else if (params.pluginPolicy?.allowModelOverride) {
		policy = params.pluginPolicy;
		policyOwnerPluginId = params.pluginPolicyId;
	}
	if (!policy) throw new Error("Plugin LLM completion cannot override the target model.");
	if (policy.allowAnyModel) return;
	if (policy.hasConfiguredAllowedModels && policy.allowedModels.size === 0) throw new Error("Plugin LLM completion model override allowlist has no valid models.");
	if (policy.allowedModels.size === 0) return;
	if (!params.resolvedModelRef) throw new Error("Plugin LLM completion model override allowlist requires a resolvable provider/model target.");
	if (!policy.allowedModels.has(params.resolvedModelRef)) {
		const owner = policyOwnerPluginId ? ` for plugin "${policyOwnerPluginId}"` : "";
		throw new Error(`Plugin LLM completion model override "${params.resolvedModelRef}" is not allowlisted${owner}.`);
	}
}
/**
* Create the host-owned generic LLM completion runtime for trusted plugin callers.
*/
function createRuntimeLlm(options = {}) {
	const logger = options.logger ?? toRuntimeLogger(defaultLogger);
	return { complete: async (params) => {
		const caller = resolveTrustedCaller(options.authority);
		if (options.authority?.allowComplete === false) {
			const reason = options.authority.denyReason ?? "capability denied";
			logger.warn("plugin llm completion denied", {
				caller,
				purpose: params.purpose,
				reason
			});
			throw new Error(`Plugin LLM completion denied: ${reason}`);
		}
		const [{ prepareSimpleCompletionModelForAgent, completeWithPreparedSimpleCompletionModel, resolveSimpleCompletionSelectionForAgent }, cfg] = await Promise.all([Promise.resolve().then(() => require("./simple-completion-runtime-BCVCP_Ps.cjs")).then((n) => n.simple_completion_runtime_exports), Promise.resolve(resolveRuntimeConfig(options))]);
		const pluginPolicyId = resolvePluginPolicyId(options.authority, caller);
		const pluginPolicy = resolvePluginLlmOverridePolicy(cfg, pluginPolicyId);
		const authorityPolicy = resolveAuthorityModelPolicy(options.authority);
		const preferredProfile = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(options.authority?.preferredProfile);
		const agentId = await resolveAgentId({
			request: params,
			cfg,
			authority: options.authority,
			allowAgentIdOverride: options.authority?.allowAgentIdOverride === false ? false : authorityPolicy?.allowAgentIdOverride === true || pluginPolicy?.allowAgentIdOverride === true
		});
		const requestedModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model);
		if (requestedModel) {
			const selection = resolveSimpleCompletionSelectionForAgent({
				cfg,
				agentId,
				modelRef: requestedModel
			});
			const normalizedSelection = selection ? require_model_selection_normalize.normalizeModelRef(selection.provider, selection.modelId) : null;
			assertAllowedModelOverride({
				resolvedModelRef: normalizedSelection ? require_model_input.modelKey(normalizedSelection.provider, normalizedSelection.model) : null,
				pluginPolicyId,
				authorityPolicy,
				pluginPolicy
			});
		}
		const prepared = await prepareSimpleCompletionModelForAgent({
			cfg,
			agentId,
			modelRef: params.model,
			preferredProfile,
			allowBundledStaticCatalogFallback: true,
			allowMissingApiKeyModes: ["aws-sdk"],
			skipAgentDiscovery: true
		});
		if ("error" in prepared) throw new Error(`Plugin LLM completion failed: ${prepared.error}`);
		const context = {
			systemPrompt: buildSystemPrompt(params),
			messages: buildMessages({
				request: params,
				provider: prepared.model.provider,
				model: prepared.model.id,
				api: prepared.model.api
			})
		};
		const result = await completeWithPreparedSimpleCompletionModel({
			model: prepared.model,
			auth: prepared.auth,
			cfg,
			context,
			options: {
				maxTokens: finiteOption(params.maxTokens),
				temperature: finiteOption(params.temperature),
				signal: params.signal
			}
		});
		const text = result.content.filter((c) => c.type === "text").map((c) => c.text).join("");
		const normalizedUsage = require_session_accessor.normalizeUsage(result.usage);
		const usage = buildUsage({
			rawUsage: result.usage,
			normalized: normalizedUsage,
			cfg,
			provider: prepared.selection.provider,
			model: prepared.selection.modelId
		});
		logger.info("plugin llm completion", {
			caller,
			purpose: params.purpose,
			sessionKey: options.authority?.sessionKey,
			agentId,
			provider: prepared.selection.provider,
			model: prepared.selection.modelId,
			usage
		});
		return {
			text,
			provider: prepared.selection.provider,
			model: prepared.selection.modelId,
			agentId,
			usage,
			audit: {
				caller,
				...params.purpose ? { purpose: params.purpose } : {},
				...options.authority?.sessionKey ? { sessionKey: options.authority.sessionKey } : {}
			}
		};
	} };
}
//#endregion
exports.createRuntimeLlm = createRuntimeLlm;
