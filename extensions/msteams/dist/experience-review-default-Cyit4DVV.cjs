const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_config = require("./config-BmhbwvVp.cjs");
const require_experience_review_prompt = require("./experience-review-prompt-Pi6YIP74.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
//#region src/skills/workshop/experience-review.ts
const EXPERIENCE_REVIEW_MIN_MODEL_ITERATIONS = 10;
const EXPERIENCE_REVIEW_IDLE_MS = 3e4;
const EXPERIENCE_REVIEW_RETRY_IDLE_MS = 3e4;
const EXPERIENCE_REVIEW_TIMEOUT_MS = 12e4;
const EXPERIENCE_REVIEW_MAX_PENDING = 32;
const EXPERIENCE_REVIEW_SESSION_SEGMENT = "skill-workshop-review";
const EXPERIENCE_REVIEW_BLOCKED_TRIGGERS = /* @__PURE__ */ new Set([
	"cron",
	"heartbeat",
	"memory",
	"overflow"
]);
const EXPERIENCE_REVIEW_BLOCKED_SESSION_SEGMENTS = /* @__PURE__ */ new Set([
	"cron",
	"hook",
	"subagent",
	EXPERIENCE_REVIEW_SESSION_SEGMENT
]);
const log = require_subsystem.createSubsystemLogger("skills/workshop");
function isEligibleContext(ctx) {
	if (ctx.compacted === true || ctx.skillWorkshopAvailable !== true || !ctx.modelProviderId?.trim() || !ctx.modelId?.trim()) return false;
	const trigger = ctx.trigger?.trim().toLowerCase();
	if (trigger && EXPERIENCE_REVIEW_BLOCKED_TRIGGERS.has(trigger)) return false;
	const sessionKey = ctx.sessionKey?.trim().toLowerCase();
	if (!sessionKey || sessionKey.includes("active-memory")) return false;
	return !sessionKey.split(":").some((segment) => EXPERIENCE_REVIEW_BLOCKED_SESSION_SEGMENTS.has(segment));
}
function currentTurnMessages(messages) {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message && typeof message === "object" && !Array.isArray(message) && message.role === "user") return messages.slice(index);
	}
	return messages;
}
function countModelIterations(messages) {
	return messages.reduce((count, message) => {
		if (!message || typeof message !== "object" || Array.isArray(message)) return count;
		return count + (message.role === "assistant" ? 1 : 0);
	}, 0);
}
async function prepareSkillExperienceReviewCandidate(candidate, config) {
	if (!require_config.resolveSkillWorkshopConfig(config).autonomous.enabled) return;
	const { resolveConversationCapabilityProfile } = await Promise.resolve().then(() => require("./conversation-capability-profile-Cn8o5WHy.cjs")).then((n) => n.conversation_capability_profile_exports);
	const { resolveSandboxRuntimeStatus } = await Promise.resolve().then(() => require("./sandbox-CjshBxRn.cjs")).then((n) => n.sandbox_exports);
	const { isToolAllowedByPolicies } = await Promise.resolve().then(() => require("./tool-policy-match-CCdTHppY.cjs")).then((n) => n.tool_policy_match_exports);
	const { mergeAlsoAllowPolicy } = await Promise.resolve().then(() => require("./tool-policy-CvMKC-hp.cjs")).then((n) => n.tool_policy_exports);
	const sessionKey = candidate.ctx.sessionKey;
	if (!sessionKey || resolveSandboxRuntimeStatus({
		cfg: config,
		sessionKey
	}).sandboxed) return;
	const capabilityProfile = resolveConversationCapabilityProfile({
		config,
		sessionKey,
		sandboxSessionKey: sessionKey,
		agentId: candidate.ctx.agentId,
		agentAccountId: candidate.ctx.agentAccountId,
		messageProvider: candidate.ctx.messageProvider,
		messageChannel: candidate.ctx.messageChannel,
		chatType: candidate.ctx.chatType,
		groupId: candidate.ctx.groupId,
		groupChannel: candidate.ctx.groupChannel,
		groupSpace: candidate.ctx.groupSpace,
		memberRoleIds: candidate.ctx.memberRoleIds,
		spawnedBy: candidate.ctx.spawnedBy,
		senderId: candidate.ctx.senderId,
		senderName: candidate.ctx.senderName,
		senderUsername: candidate.ctx.senderUsername,
		senderE164: candidate.ctx.senderE164,
		senderIsOwner: candidate.ctx.senderIsOwner,
		modelProvider: candidate.ctx.modelProviderId,
		modelId: candidate.ctx.modelId,
		workspaceDir: candidate.ctx.workspaceDir
	});
	if (!isToolAllowedByPolicies("skill_workshop", [
		mergeAlsoAllowPolicy(capabilityProfile.policy.profilePolicy, capabilityProfile.policy.profileAlsoAllow),
		mergeAlsoAllowPolicy(capabilityProfile.policy.providerProfilePolicy, capabilityProfile.policy.providerProfileAlsoAllow),
		capabilityProfile.policy.globalPolicy,
		capabilityProfile.policy.globalProviderPolicy,
		capabilityProfile.policy.agentPolicy,
		capabilityProfile.policy.agentProviderPolicy,
		capabilityProfile.policy.groupPolicy,
		capabilityProfile.policy.senderPolicy,
		capabilityProfile.policy.subagentPolicy,
		capabilityProfile.policy.inheritedToolPolicy
	])) return;
	return {
		...candidate,
		config
	};
}
function createSkillExperienceReviewScheduler(deps) {
	const pendingBySession = /* @__PURE__ */ new Map();
	let reviewInFlight = false;
	const setTimer = deps.setTimer ?? ((callback, delayMs) => setTimeout(callback, delayMs));
	const clearTimer = deps.clearTimer ?? clearTimeout;
	const arm = (sessionKey, pending, delayMs) => {
		if (pending.timer) clearTimer(pending.timer);
		const generation = ++pending.generation;
		const timer = setTimer(() => {
			if (pendingBySession.get(sessionKey) !== pending || pending.generation !== generation) return;
			pending.timer = void 0;
			Promise.resolve(deps.isSystemActive()).then(async (active) => {
				if (pendingBySession.get(sessionKey) !== pending || pending.generation !== generation) return;
				if (active) {
					arm(sessionKey, pending, EXPERIENCE_REVIEW_RETRY_IDLE_MS);
					return;
				}
				if (reviewInFlight) {
					arm(sessionKey, pending, EXPERIENCE_REVIEW_RETRY_IDLE_MS);
					return;
				}
				reviewInFlight = true;
				try {
					const candidate = deps.prepareReview ? await deps.prepareReview(pending.candidate) : pending.candidate;
					if (!candidate) {
						pendingBySession.delete(sessionKey);
						return;
					}
					if (pendingBySession.get(sessionKey) !== pending || pending.generation !== generation) return;
					pendingBySession.delete(sessionKey);
					await deps.runReview(candidate);
				} finally {
					reviewInFlight = false;
				}
			}).catch((error) => {
				log.warn(`skill experience review failed: ${String(error)}`);
				if (pendingBySession.get(sessionKey) === pending && pending.generation === generation) arm(sessionKey, pending, EXPERIENCE_REVIEW_RETRY_IDLE_MS);
			});
		}, delayMs);
		pending.timer = timer;
		timer.unref?.();
	};
	return {
		schedule(params) {
			const sessionKey = params.ctx.sessionKey?.trim();
			if (!sessionKey) return;
			const existing = pendingBySession.get(sessionKey);
			if (existing && !params.event.success && params.ctx.runId?.trim() && params.ctx.runId === existing.candidate.ctx.runId) {
				if (existing.timer) clearTimer(existing.timer);
				pendingBySession.delete(sessionKey);
				return;
			}
			if (existing) arm(sessionKey, existing, EXPERIENCE_REVIEW_IDLE_MS);
			if (!require_config.resolveSkillWorkshopConfig(params.config).autonomous.enabled) return;
			if (!isEligibleContext(params.ctx)) return;
			const workspaceDir = params.ctx.workspaceDir?.trim();
			if (!workspaceDir) return;
			const turnMessages = currentTurnMessages(params.event.messages);
			const modelIterations = countModelIterations(turnMessages);
			if (params.event.success && modelIterations >= EXPERIENCE_REVIEW_MIN_MODEL_ITERATIONS) {
				if (!existing && pendingBySession.size >= EXPERIENCE_REVIEW_MAX_PENDING) {
					const oldest = pendingBySession.entries().next().value;
					if (oldest) {
						if (oldest[1].timer) clearTimer(oldest[1].timer);
						pendingBySession.delete(oldest[0]);
					}
				}
				const candidate = {
					ctx: {
						agentId: params.ctx.agentId,
						runId: params.ctx.runId,
						sessionKey,
						sessionId: params.ctx.sessionId,
						workspaceDir,
						modelProviderId: params.ctx.modelProviderId,
						modelId: params.ctx.modelId,
						authProfileId: params.ctx.authProfileId,
						skillWorkshopAvailable: params.ctx.skillWorkshopAvailable,
						compacted: params.ctx.compacted,
						trigger: params.ctx.trigger,
						messageChannel: params.ctx.messageChannel,
						messageProvider: params.ctx.messageProvider,
						chatType: params.ctx.chatType,
						agentAccountId: params.ctx.agentAccountId,
						groupId: params.ctx.groupId,
						groupChannel: params.ctx.groupChannel,
						groupSpace: params.ctx.groupSpace,
						memberRoleIds: params.ctx.memberRoleIds ? [...params.ctx.memberRoleIds] : void 0,
						spawnedBy: params.ctx.spawnedBy,
						senderId: params.ctx.senderId,
						senderName: params.ctx.senderName,
						senderUsername: params.ctx.senderUsername,
						senderE164: params.ctx.senderE164,
						senderIsOwner: params.ctx.senderIsOwner
					},
					...params.config ? { config: params.config } : {},
					transcript: require_experience_review_prompt.formatSkillExperienceReviewTranscript(turnMessages),
					modelIterations
				};
				const pending = existing ?? {
					candidate,
					generation: 0
				};
				pending.candidate = candidate;
				pendingBySession.set(sessionKey, pending);
				arm(sessionKey, pending, EXPERIENCE_REVIEW_IDLE_MS);
			}
		},
		clear() {
			for (const pending of pendingBySession.values()) if (pending.timer) clearTimer(pending.timer);
			pendingBySession.clear();
		}
	};
}
async function runSkillExperienceReview(candidate) {
	const workspaceDir = candidate.ctx.workspaceDir;
	const sessionKey = candidate.ctx.sessionKey;
	const modelProviderId = candidate.ctx.modelProviderId?.trim();
	const modelId = candidate.ctx.modelId?.trim();
	if (!workspaceDir || !sessionKey || !modelProviderId || !modelId) return;
	const tempDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-skill-review-"));
	try {
		const sessionId = (0, node_crypto.randomUUID)();
		const reviewSessionKey = `agent:${candidate.ctx.agentId ?? "main"}:${EXPERIENCE_REVIEW_SESSION_SEGMENT}:${sessionId}`;
		const { runEmbeddedAgent } = await Promise.resolve().then(() => require("./embedded-agent-C44j1_Yh.cjs")).then((n) => n.embedded_agent_exports);
		await runEmbeddedAgent({
			sessionId,
			sessionKey: reviewSessionKey,
			sandboxSessionKey: sessionKey,
			sessionFile: node_path.default.join(tempDir, "session.jsonl"),
			...candidate.ctx.agentId ? { agentId: candidate.ctx.agentId } : {},
			trigger: "manual",
			lane: "skill-workshop-review",
			messageChannel: candidate.ctx.messageChannel ?? void 0,
			messageProvider: candidate.ctx.messageProvider ?? void 0,
			...candidate.ctx.chatType ? { chatType: candidate.ctx.chatType } : {},
			...candidate.ctx.agentAccountId ? { agentAccountId: candidate.ctx.agentAccountId } : {},
			groupId: candidate.ctx.groupId,
			groupChannel: candidate.ctx.groupChannel,
			groupSpace: candidate.ctx.groupSpace,
			memberRoleIds: candidate.ctx.memberRoleIds ? [...candidate.ctx.memberRoleIds] : void 0,
			spawnedBy: candidate.ctx.spawnedBy,
			senderId: candidate.ctx.senderId,
			senderName: candidate.ctx.senderName,
			senderUsername: candidate.ctx.senderUsername,
			senderE164: candidate.ctx.senderE164,
			senderIsOwner: candidate.ctx.senderIsOwner,
			agentHarnessId: "operator",
			agentHarnessRuntimeOverride: "operator",
			workspaceDir,
			...candidate.config ? { config: candidate.config } : {},
			prompt: require_experience_review_prompt.buildSkillExperienceReviewPrompt(candidate),
			provider: modelProviderId,
			model: modelId,
			modelSelectionLocked: true,
			modelFallbacksOverride: [],
			...candidate.ctx.authProfileId ? {
				authProfileId: candidate.ctx.authProfileId,
				authProfileIdSource: "user"
			} : {},
			timeoutMs: EXPERIENCE_REVIEW_TIMEOUT_MS,
			runId: `skill-workshop-review:${(0, node_crypto.randomUUID)()}`,
			toolsAllow: ["skill_workshop"],
			disableMessageTool: true,
			disableTrajectory: true,
			skillWorkshopProposalOnly: true,
			skillWorkshopOrigin: {
				...candidate.ctx.agentId ? { agentId: candidate.ctx.agentId } : {},
				sessionKey,
				...candidate.ctx.runId ? { runId: candidate.ctx.runId } : {}
			},
			cleanupBundleMcpOnRunEnd: true,
			bootstrapContextMode: "lightweight",
			skillsSnapshot: {
				prompt: "",
				skills: []
			},
			verboseLevel: "off",
			reasoningLevel: "off",
			suppressToolErrorWarnings: true
		});
	} finally {
		await node_fs_promises.default.rm(tempDir, {
			recursive: true,
			force: true
		});
	}
}
//#endregion
//#region src/skills/workshop/experience-review-default.ts
const defaultScheduler = createSkillExperienceReviewScheduler({
	isSystemActive: async () => {
		const [{ getActiveEmbeddedRunCount }, { getActiveReplyRunCount }] = await Promise.all([Promise.resolve().then(() => require("./runs-BxiWZCUY.cjs")).then((n) => n.runs_exports), Promise.resolve().then(() => require("./reply-run-registry-BN03YRe9.cjs")).then((n) => n.reply_run_registry_exports)]);
		return getActiveEmbeddedRunCount() > 0 || getActiveReplyRunCount() > 0;
	},
	prepareReview: async (candidate) => {
		const { getRuntimeConfig } = await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports);
		return prepareSkillExperienceReviewCandidate(candidate, getRuntimeConfig());
	},
	runReview: runSkillExperienceReview
});
/** Queues a conservative, post-run learning review after the agent system becomes idle. */
function scheduleSkillExperienceReview(params) {
	defaultScheduler.schedule(params);
}
//#endregion
exports.scheduleSkillExperienceReview = scheduleSkillExperienceReview;
