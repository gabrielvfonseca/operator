const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
const require_hook_agent_context = require("./hook-agent-context-BIJTw8B_.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/agents/harness/hook-context.ts
/** Builds the sparse hook context object passed to agent harness plugin hooks. */
function buildAgentHookContext(params) {
	return {
		...params.runId ? { runId: params.runId } : {},
		...params.trace ? { trace: params.trace } : {},
		...params.jobId ? { jobId: params.jobId } : {},
		...params.agentId ? { agentId: params.agentId } : {},
		...params.sessionKey ? { sessionKey: params.sessionKey } : {},
		...params.sessionId ? { sessionId: params.sessionId } : {},
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		...params.modelProviderId ? { modelProviderId: params.modelProviderId } : {},
		...params.modelId ? { modelId: params.modelId } : {},
		...params.messageProvider ? { messageProvider: params.messageProvider } : {},
		...params.channel ? { channel: params.channel } : {},
		...params.trigger ? { trigger: params.trigger } : {},
		...params.channelId ? { channelId: params.channelId } : {},
		...params.contextTokenBudget ? { contextTokenBudget: params.contextTokenBudget } : {},
		...params.contextWindowSource ? { contextWindowSource: params.contextWindowSource } : {},
		...params.contextWindowReferenceTokens ? { contextWindowReferenceTokens: params.contextWindowReferenceTokens } : {},
		...require_hook_agent_context.buildAgentHookContextIdentityFields({
			trigger: params.trigger,
			senderId: params.senderId,
			chatId: params.chatId,
			channelContext: params.channelContext
		})
	};
}
//#endregion
//#region src/agents/harness/lifecycle-hook-helpers.ts
/**
* Agent harness lifecycle hook helpers.
*
* This module dispatches LLM/agent lifecycle plugin hooks and normalizes
* before-finalize retry/finalize decisions with bounded retry accounting.
*/
const log = require_subsystem.createSubsystemLogger("agents/harness");
const FINALIZE_RETRY_BUDGET_KEY = Symbol.for("operator.pluginFinalizeRetryBudget");
const FINALIZE_RETRY_BUDGET_MAX_ENTRIES = 2048;
function getFinalizeRetryBudget() {
	return require_global_singleton.resolveGlobalSingleton(FINALIZE_RETRY_BUDGET_KEY, () => /* @__PURE__ */ new Map());
}
function countFinalizeRetryBudgetEntries(budget) {
	let count = 0;
	for (const runBudget of budget.values()) count += runBudget.size;
	return count;
}
function pruneFinalizeRetryBudget(budget) {
	while (countFinalizeRetryBudgetEntries(budget) > FINALIZE_RETRY_BUDGET_MAX_ENTRIES) {
		const oldestRunId = budget.keys().next().value;
		if (oldestRunId === void 0) return;
		const oldestRunBudget = budget.get(oldestRunId);
		const oldestRetryKey = oldestRunBudget?.keys().next().value;
		if (oldestRunBudget && oldestRetryKey !== void 0) oldestRunBudget.delete(oldestRetryKey);
		if (!oldestRunBudget || oldestRunBudget.size === 0) budget.delete(oldestRunId);
	}
}
function buildFinalizeRetryInstructionKey(instruction) {
	return `instruction:${(0, node_crypto.createHash)("sha256").update(instruction).digest("hex")}`;
}
/** Dispatches best-effort LLM input hooks for a harness attempt. */
function runAgentHarnessLlmInputHook(params) {
	const hookRunner = params.hookRunner ?? require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("llm_input") || typeof hookRunner.runLlmInput !== "function") return;
	hookRunner.runLlmInput(params.event, buildAgentHookContext(params.ctx)).catch((error) => {
		log.warn(`llm_input hook failed: ${String(error)}`);
	});
}
/** Dispatches best-effort LLM output hooks for a harness attempt. */
function runAgentHarnessLlmOutputHook(params) {
	const hookRunner = params.hookRunner ?? require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("llm_output") || typeof hookRunner.runLlmOutput !== "function") return;
	hookRunner.runLlmOutput(params.event, buildAgentHookContext(params.ctx)).catch((error) => {
		log.warn(`llm_output hook failed: ${String(error)}`);
	});
}
async function executeAgentHarnessAgentEndHook(params) {
	const hookRunner = params.hookRunner ?? require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("agent_end") || typeof hookRunner.runAgentEnd !== "function") return;
	try {
		const options = { unrefTimeout: params.unrefTimeout ?? false };
		await hookRunner.runAgentEnd(params.event, buildAgentHookContext(params.ctx), options);
	} catch (error) {
		log.warn(`agent_end hook failed: ${String(error)}`);
	}
}
/** Starts agent_end hooks with unref timeout behavior. */
function runAgentHarnessAgentEndHook(params) {
	executeAgentHarnessAgentEndHook({
		...params,
		unrefTimeout: true
	});
}
/** Runs agent_end hooks and waits for completion. */
async function awaitAgentHarnessAgentEndHook(params) {
	await executeAgentHarnessAgentEndHook({
		...params,
		unrefTimeout: false
	});
}
/** Runs before-finalize hooks and normalizes finalize/revise/continue decisions. */
async function runAgentHarnessBeforeAgentFinalizeHook(params) {
	const hookRunner = params.hookRunner ?? require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("before_agent_finalize") || typeof hookRunner.runBeforeAgentFinalize !== "function") return { action: "continue" };
	try {
		const eventForNormalization = {
			...params.event,
			runId: params.event.runId ?? params.ctx.runId
		};
		return normalizeBeforeAgentFinalizeResult(await hookRunner.runBeforeAgentFinalize(eventForNormalization, buildAgentHookContext(params.ctx)), eventForNormalization);
	} catch (error) {
		log.warn(`before_agent_finalize hook failed: ${String(error)}`);
		return { action: "continue" };
	}
}
function normalizeBeforeAgentFinalizeResult(result, event) {
	if (result?.action === "finalize") {
		const reason = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(result.reason);
		return reason ? {
			action: "finalize",
			reason
		} : { action: "finalize" };
	}
	if (result?.action === "revise") {
		const retryCandidates = readBeforeAgentFinalizeRetryCandidates(result);
		if (retryCandidates.length > 0) {
			const reason = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(result.reason);
			for (const retry of retryCandidates) {
				const retryInstruction = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(retry.instruction);
				if (!retryInstruction) continue;
				const maxAttempts = typeof retry.maxAttempts === "number" && Number.isFinite(retry.maxAttempts) ? Math.max(1, Math.floor(retry.maxAttempts)) : 1;
				const retryRunId = event?.runId ?? event?.sessionId ?? "unknown-run";
				const retryKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(retry.idempotencyKey) || buildFinalizeRetryInstructionKey(retryInstruction);
				const budget = getFinalizeRetryBudget();
				const runBudget = budget.get(retryRunId) ?? /* @__PURE__ */ new Map();
				const nextCount = (runBudget.get(retryKey) ?? 0) + 1;
				runBudget.delete(retryKey);
				runBudget.set(retryKey, nextCount);
				budget.delete(retryRunId);
				budget.set(retryRunId, runBudget);
				pruneFinalizeRetryBudget(budget);
				if (nextCount > maxAttempts) continue;
				return {
					action: "revise",
					reason: reason?.includes(retryInstruction) ? reason : [reason, retryInstruction].filter(Boolean).join("\n\n")
				};
			}
			return { action: "continue" };
		}
		const reason = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(result.reason);
		return reason ? {
			action: "revise",
			reason
		} : { action: "continue" };
	}
	return { action: "continue" };
}
function readBeforeAgentFinalizeRetryCandidates(result) {
	const candidateList = result.retryCandidates;
	if (Array.isArray(candidateList) && candidateList.length > 0) return candidateList.filter(isBeforeAgentFinalizeRetry);
	return isBeforeAgentFinalizeRetry(result.retry) ? [result.retry] : [];
}
function isBeforeAgentFinalizeRetry(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
//#endregion
Object.defineProperty(exports, "awaitAgentHarnessAgentEndHook", {
	enumerable: true,
	get: function() {
		return awaitAgentHarnessAgentEndHook;
	}
});
Object.defineProperty(exports, "buildAgentHookContext", {
	enumerable: true,
	get: function() {
		return buildAgentHookContext;
	}
});
Object.defineProperty(exports, "runAgentHarnessAgentEndHook", {
	enumerable: true,
	get: function() {
		return runAgentHarnessAgentEndHook;
	}
});
Object.defineProperty(exports, "runAgentHarnessBeforeAgentFinalizeHook", {
	enumerable: true,
	get: function() {
		return runAgentHarnessBeforeAgentFinalizeHook;
	}
});
Object.defineProperty(exports, "runAgentHarnessLlmInputHook", {
	enumerable: true,
	get: function() {
		return runAgentHarnessLlmInputHook;
	}
});
Object.defineProperty(exports, "runAgentHarnessLlmOutputHook", {
	enumerable: true,
	get: function() {
		return runAgentHarnessLlmOutputHook;
	}
});
