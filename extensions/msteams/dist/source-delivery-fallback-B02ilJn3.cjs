const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
require("./logger-DFfd_p65.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
require("./thinking-BQb9GAe7.cjs");
require("./model-selection-cli-PCHB2Ve6.cjs");
const require_delivery_evidence = require("./delivery-evidence-C3rOjggE.cjs");
require("./bootstrap-budget-B73ETWvB.cjs");
const require_model_fallback = require("./model-fallback-MSKXoSVI.cjs");
require("./thinking-runtime-CrpgBgYy.cjs");
require("./lanes-CNGMiDO4.cjs");
require("./runtime-plugin-9QTLb6UB.cjs");
require("./result-fallback-classifier-ngBKsYXt.cjs");
const require_delivery_plan = require("./delivery-plan-DjgzQZOe.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/cron/isolated-agent/channel-output-policy.ts
/** Reads channel plugin output/threading policy for isolated cron delivery. */
const channelPluginRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./plugins-_-82JYfc.cjs")).then((n) => n.plugins_exports));
async function loadChannelPluginRuntime() {
	return await channelPluginRuntimeLoader.load();
}
/** Resolves channel-specific cron output preferences from loaded channel plugins. */
async function resolveCronChannelOutputPolicy(channel, opts) {
	const channelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel);
	if (!channelId) return { preferFinalAssistantVisibleText: opts?.deliveryRequested !== true };
	const { getChannelPlugin } = await loadChannelPluginRuntime();
	return { preferFinalAssistantVisibleText: getChannelPlugin(channelId)?.outbound?.preferFinalAssistantVisibleText === true };
}
/** Resolves the provider-specific current-thread target for a delivery address. */
async function resolveCurrentChannelTarget(params) {
	if (!params.to) return;
	const channelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel);
	if (!channelId) return params.to;
	const { getChannelPlugin } = await loadChannelPluginRuntime();
	return getChannelPlugin(channelId)?.threading?.resolveCurrentChannelId?.({
		to: params.to,
		threadId: params.threadId
	}) ?? params.to;
}
//#endregion
//#region src/cron/isolated-agent/run-execution.runtime.ts
const cronExecutionCliRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./run-execution-cli.runtime-BgCMDuoK.cjs")));
async function loadCronExecutionCliRuntime() {
	return await cronExecutionCliRuntimeLoader.load();
}
/** Lazily resolves complete CLI bindings so cron continuations preserve reuse metadata. */
async function getCliSessionBinding(...args) {
	return (await loadCronExecutionCliRuntime()).getCliSessionBinding(...args);
}
/** Lazily runs the CLI-backed agent path used by isolated cron execution. */
async function runCliAgent(...args) {
	return (await loadCronExecutionCliRuntime()).runCliAgent(...args);
}
//#endregion
//#region src/cron/isolated-agent/run-fallback-policy.ts
/** Resolves model fallback chains for isolated cron runs and preflight. */
/** Resolves cron model fallbacks, giving explicit payload fallbacks precedence over subagent/default policy. */
function resolveCronFallbacksOverride(params) {
	const payload = params.job.payload.kind === "agentTurn" ? params.job.payload : void 0;
	const payloadFallbacks = Array.isArray(payload?.fallbacks) ? payload.fallbacks : void 0;
	const hasCronPayloadModelOverride = typeof payload?.model === "string" && payload.model.trim().length > 0;
	if (payloadFallbacks !== void 0) return payloadFallbacks;
	if (params.useSubagentFallbacks === true && !hasCronPayloadModelOverride) {
		const subagentFallbacksOverride = require_agent_scope.resolveSubagentModelFallbacksOverride(params.cfg, params.agentId);
		if (subagentFallbacksOverride !== void 0) return subagentFallbacksOverride;
	}
	if (!hasCronPayloadModelOverride && params.inheritDefaultFallbacksForAgentStringModel === true) {
		const defaultFallbacks = require_model_input.resolveAgentModelFallbackValues(params.cfg.agents?.defaults?.model);
		if (defaultFallbacks.length > 0) return defaultFallbacks;
	}
	return require_agent_scope.resolveEffectiveModelFallbacks({
		cfg: params.cfg,
		agentId: params.agentId,
		hasSessionModelOverride: hasCronPayloadModelOverride,
		modelOverrideSource: hasCronPayloadModelOverride ? "auto" : void 0
	});
}
/** Builds the ordered model candidates used by cron preflight checks. */
function resolveCronPreflightCandidates(params) {
	const fallbacksOverride = resolveCronFallbacksOverride({
		cfg: params.cfg,
		job: params.job,
		agentId: params.agentId,
		useSubagentFallbacks: params.useSubagentFallbacks,
		inheritDefaultFallbacksForAgentStringModel: params.inheritDefaultFallbacksForAgentStringModel
	});
	return require_model_fallback.resolveModelCandidateChain({
		cfg: params.cfg,
		provider: params.provider,
		model: params.model,
		fallbacksOverride
	});
}
//#endregion
//#region src/cron/isolated-agent/source-delivery-fallback.ts
function resolveCronSourceDeliveryPlan(params) {
	const target = {
		channel: params.resolvedDelivery.channel,
		to: params.resolvedDelivery.to,
		accountId: params.resolvedDelivery.accountId,
		threadId: params.resolvedDelivery.threadId
	};
	if (params.deliveryPlan.mode === "webhook") return require_delivery_evidence.createSourceDeliveryPlan({
		owner: "none",
		reason: "cron_webhook",
		messageToolEnabled: false,
		directFallback: false
	});
	if (params.deliveryPlan.mode === "none") return require_delivery_evidence.createSourceDeliveryPlan({
		owner: "none",
		reason: "cron_none",
		target,
		messageToolEnabled: true,
		messageToolForced: false,
		directFallback: false
	});
	return require_delivery_evidence.createSourceDeliveryPlan({
		owner: "direct_fallback",
		reason: "cron_announce",
		target,
		messageToolEnabled: true,
		messageToolForced: false,
		requireExplicitMessageTarget: true,
		requireExplicitMessageTargetEvidence: true,
		directFallback: true,
		skipFallbackWhenMessageToolSentToTarget: params.resolvedDelivery.ok ?? true
	});
}
function resolveFallbackCronSourceDeliveryPlan(job, resolvedDelivery) {
	return resolveCronSourceDeliveryPlan({
		deliveryPlan: require_delivery_plan.resolveCronDeliveryPlan(job),
		resolvedDelivery
	});
}
//#endregion
Object.defineProperty(exports, "getCliSessionBinding", {
	enumerable: true,
	get: function() {
		return getCliSessionBinding;
	}
});
Object.defineProperty(exports, "resolveCronChannelOutputPolicy", {
	enumerable: true,
	get: function() {
		return resolveCronChannelOutputPolicy;
	}
});
Object.defineProperty(exports, "resolveCronFallbacksOverride", {
	enumerable: true,
	get: function() {
		return resolveCronFallbacksOverride;
	}
});
Object.defineProperty(exports, "resolveCronPreflightCandidates", {
	enumerable: true,
	get: function() {
		return resolveCronPreflightCandidates;
	}
});
Object.defineProperty(exports, "resolveCronSourceDeliveryPlan", {
	enumerable: true,
	get: function() {
		return resolveCronSourceDeliveryPlan;
	}
});
Object.defineProperty(exports, "resolveCurrentChannelTarget", {
	enumerable: true,
	get: function() {
		return resolveCurrentChannelTarget;
	}
});
Object.defineProperty(exports, "resolveFallbackCronSourceDeliveryPlan", {
	enumerable: true,
	get: function() {
		return resolveFallbackCronSourceDeliveryPlan;
	}
});
Object.defineProperty(exports, "runCliAgent", {
	enumerable: true,
	get: function() {
		return runCliAgent;
	}
});
