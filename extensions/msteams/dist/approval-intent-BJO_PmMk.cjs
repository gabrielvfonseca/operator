const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_embedded_agent_utils = require("./embedded-agent-utils-OVBmZgZz.cjs");
const require_simple_completion_runtime = require("./simple-completion-runtime-BCVCP_Ps.cjs");
const require_verified_inference = require("./verified-inference-DA_zZ9Fy.cjs");
//#region src/system-agent/approval-intent.ts
var approval_intent_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	classifySystemAgentApprovalIntent: () => classifySystemAgentApprovalIntent,
	classifySystemAgentApprovalText: () => classifySystemAgentApprovalText
});
const APPROVAL_INTENT_TIMEOUT_MS = 1e4;
const APPROVAL_INTENT_MAX_TOKENS = 8;
const APPROVE_RE = /^(?:y|yes|yeah|yep|yup|sure|ok|okay|approve|approved|apply|confirm|confirmed|do it|go ahead|sounds good|yes please|please do)$/i;
const DECLINE_RE = /^(?:n|no|nope|nah|skip|not now|cancel|stop|abort|later|decline|don'?t)\b/i;
function normalizeApprovalText(message) {
	return message.trim().replace(/[.!?,\s]+$/u, "").toLowerCase();
}
/** Closed-list classification: exact affirmatives, prefix declines. */
function classifySystemAgentApprovalText(message) {
	const normalized = normalizeApprovalText(message);
	if (!normalized) return "other";
	if (APPROVE_RE.test(normalized)) return "approve";
	if (DECLINE_RE.test(normalized)) return "decline";
	return "other";
}
const APPROVAL_INTENT_SYSTEM_PROMPT = [
	"You classify one chat message from a user who was just asked to approve a pending configuration change.",
	"Reply with exactly one word:",
	"approve — the message clearly consents to applying the pending change now.",
	"decline — the message clearly rejects or postpones the pending change.",
	"other — anything else: questions, new requests, partial or conditional agreement, or unclear intent.",
	"Only classify consent for the pending change itself. A message asking to change the proposal is not approval."
].join("\n");
/**
* Judge whether a message approves the pending proposal. Closed-list answers
* short-circuit so a literal "yes" cannot be reinterpreted by the conversation
* model; ambiguous messages go to a separate configured completion call.
* CLI-harness routes do not spawn a second harness for that check, so their
* ambiguous replies stay "other" and the conversation asks for a clear yes.
*/
async function classifySystemAgentApprovalIntent(params, deps = {}) {
	const textIntent = classifySystemAgentApprovalText(params.message);
	if (textIntent !== "other") return textIntent;
	try {
		const resolveVerifiedRoute = deps.resolveVerifiedInferenceRoute ?? require_verified_inference.resolveSystemAgentVerifiedInferenceRoute;
		const route = await resolveVerifiedRoute(params.verifiedInference);
		if (route?.runner !== "embedded" || route.agentHarnessRuntimeOverride !== "@gabrielvfonseca/operator") return "other";
		const modelRef = route.authProfileId ? `${route.modelLabel}@${route.authProfileId}` : route.modelLabel;
		const prepared = await (deps.prepareSimpleCompletionModelForAgent ?? require_simple_completion_runtime.prepareSimpleCompletionModelForAgent)({
			cfg: route.runConfig,
			agentId: route.agentId,
			agentDir: route.agentDir,
			modelRef,
			...route.authProfileId ? { preferredProfile: route.authProfileId } : {},
			allowMissingApiKeyModes: ["aws-sdk"],
			bindAuthOwner: true
		});
		if ("error" in prepared) return "other";
		if ((prepared.selection.runtimeProvider ?? prepared.selection.provider) !== route.provider || prepared.selection.modelId !== route.model || prepared.selection.agentDir !== route.agentDir || prepared.selection.profileId !== route.authProfileId || prepared.auth.profileId !== route.authProfileId || !params.verifiedInference.auth.authFingerprint || prepared.sourceAuthFingerprint !== params.verifiedInference.auth.authFingerprint) return "other";
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), APPROVAL_INTENT_TIMEOUT_MS);
		try {
			const response = await (deps.completeWithPreparedSimpleCompletionModel ?? require_simple_completion_runtime.completeWithPreparedSimpleCompletionModel)({
				model: prepared.model,
				auth: prepared.auth,
				cfg: route.runConfig,
				context: {
					systemPrompt: APPROVAL_INTENT_SYSTEM_PROMPT,
					messages: [{
						role: "user",
						content: [`Pending change: ${params.proposal ?? "a configuration change proposed in this conversation"}`, `User message: ${params.message}`].join("\n"),
						timestamp: Date.now()
					}]
				},
				options: {
					maxTokens: APPROVAL_INTENT_MAX_TOKENS,
					signal: controller.signal
				}
			});
			if (!await resolveVerifiedRoute(params.verifiedInference)) return "other";
			const verdict = require_embedded_agent_utils.extractAssistantText(response)?.trim().toLowerCase().split(/\s+/)[0];
			if (verdict === "approve" || verdict === "decline") return verdict;
			return "other";
		} finally {
			clearTimeout(timer);
		}
	} catch {
		return "other";
	}
}
//#endregion
Object.defineProperty(exports, "approval_intent_exports", {
	enumerable: true,
	get: function() {
		return approval_intent_exports;
	}
});
Object.defineProperty(exports, "classifySystemAgentApprovalText", {
	enumerable: true,
	get: function() {
		return classifySystemAgentApprovalText;
	}
});
