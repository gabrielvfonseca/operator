const require_identity = require("./identity-Dv2mhJl0.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_usage_format = require("./usage-format-Ed9eVdJX.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/auto-reply/reply/restart-recovery-claim.ts
/** Provider redelivery guard shared by ingress and the agent admission boundary. */
function isDuplicateRestartRecoverySource(entry, sourceTurnId) {
	const normalizedSourceTurnId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sourceTurnId);
	return Boolean(normalizedSourceTurnId && (require_store.hasRestartRecoveryTerminalRun(entry ?? void 0, normalizedSourceTurnId) || require_store.hasRestartRecoverySourceClaim(entry ?? void 0, normalizedSourceTurnId)));
}
async function retireTerminalRestartRecoverySourceClaim(params) {
	let didRetire = false;
	const retired = await require_session_accessor.updateSessionEntry({
		storePath: params.storePath,
		sessionKey: params.sessionKey
	}, (current) => {
		if (current.sessionId !== params.sessionId || current.status === "running" || current.restartRecoveryDeliveryReceiptState === "terminal-pending" || !require_store.hasRestartRecoverySourceClaim(current, params.sourceTurnId)) return null;
		didRetire = true;
		return {
			...require_store.buildRestartRecoveryClaimCleanupPatch({
				entry: current,
				recordTerminalSource: true,
				terminalSourceRunId: params.sourceTurnId
			}),
			updatedAt: Date.now()
		};
	}, {
		skipMaintenance: true,
		takeCacheOwnership: true
	});
	return didRetire ? retired ?? void 0 : void 0;
}
function buildExpectedSessionState(entry) {
	return {
		abortedLastRun: entry.abortedLastRun,
		restartRecoveryBeforeAgentReplyState: entry.restartRecoveryBeforeAgentReplyState,
		restartRecoveryDeliveryReceiptState: entry.restartRecoveryDeliveryReceiptState,
		restartRecoveryDeliveryToolCallId: entry.restartRecoveryDeliveryToolCallId,
		restartRecoveryDeliveryRequestFingerprint: entry.restartRecoveryDeliveryRequestFingerprint,
		restartRecoveryDeliveryRunId: entry.restartRecoveryDeliveryRunId,
		restartRecoveryDeliverySourceRunId: entry.restartRecoveryDeliverySourceRunId,
		restartRecoveryRequesterAccountId: entry.restartRecoveryRequesterAccountId,
		restartRecoveryRequesterSenderId: entry.restartRecoveryRequesterSenderId,
		restartRecoverySameChannelThreadRequired: entry.restartRecoverySameChannelThreadRequired,
		restartRecoverySourceIngress: entry.restartRecoverySourceIngress,
		restartRecoverySourceReplyDeliveryMode: entry.restartRecoverySourceReplyDeliveryMode,
		restartRecoveryTerminalRunIds: entry.restartRecoveryTerminalRunIds,
		status: entry.status,
		updatedAt: entry.updatedAt
	};
}
function matchesExpectedSessionState(entry, sessionId, expected) {
	return entry.sessionId === sessionId && entry.abortedLastRun === expected.abortedLastRun && entry.restartRecoveryBeforeAgentReplyState === expected.restartRecoveryBeforeAgentReplyState && entry.restartRecoveryDeliveryReceiptState === expected.restartRecoveryDeliveryReceiptState && entry.restartRecoveryDeliveryToolCallId === expected.restartRecoveryDeliveryToolCallId && entry.restartRecoveryDeliveryRequestFingerprint === expected.restartRecoveryDeliveryRequestFingerprint && entry.restartRecoveryDeliveryRunId === expected.restartRecoveryDeliveryRunId && entry.restartRecoveryDeliverySourceRunId === expected.restartRecoveryDeliverySourceRunId && entry.restartRecoveryRequesterAccountId === expected.restartRecoveryRequesterAccountId && entry.restartRecoveryRequesterSenderId === expected.restartRecoveryRequesterSenderId && entry.restartRecoverySameChannelThreadRequired === expected.restartRecoverySameChannelThreadRequired && entry.restartRecoverySourceIngress === expected.restartRecoverySourceIngress && entry.restartRecoverySourceReplyDeliveryMode === expected.restartRecoverySourceReplyDeliveryMode && require_store.sameRestartRecoveryTerminalRunIds(entry.restartRecoveryTerminalRunIds, expected.restartRecoveryTerminalRunIds) && entry.status === expected.status && entry.updatedAt === expected.updatedAt;
}
function createReplyRestartRecoveryClaimController(params) {
	let recoveryRunId = (0, node_crypto.randomUUID)();
	let recoverySourceRunId;
	let tracked = false;
	const persistAdmissionPatch = async (options) => {
		const expectedSessionState = buildExpectedSessionState(options.entry);
		if (options.recorder && !options.recorder.hasPersisted()) {
			const result = await options.recorder.persistApproved({
				expectedSessionId: options.sessionId,
				expectedSessionState,
				sessionLifecyclePatch: options.patch
			});
			if (!result?.sessionEntry) throw new Error("session changed before durable user-turn admission");
			return result.sessionEntry;
		}
		const persisted = await require_session_accessor.updateSessionEntry({
			storePath: options.storePath,
			sessionKey: options.sessionKey
		}, (current) => matchesExpectedSessionState(current, options.sessionId, expectedSessionState) ? options.patch : null);
		if (!persisted) throw new Error("restart recovery claim changed before agent adoption");
		return persisted;
	};
	const persistUserTurnOnly = async (recorder, sessionId) => {
		if (!recorder || recorder.hasPersisted()) return;
		const result = await recorder.persistApproved({ expectedSessionId: sessionId });
		if (!result) throw new Error("session changed before durable user-turn admission");
		if (result.sessionEntry) params.setEntry(result.sessionEntry);
	};
	const admitUserTurn = async (recorder) => {
		if (!params.sessionKey || !params.storePath) {
			await recorder?.persistApproved();
			return "admitted";
		}
		const sessionId = params.getSessionId();
		const entry = require_session_accessor.loadSessionEntry({
			storePath: params.storePath,
			sessionKey: params.sessionKey,
			clone: false,
			hydrateSkillPromptRefs: false
		}) ?? params.getEntry();
		if (!entry || entry.sessionId !== sessionId) throw new Error("session changed before durable user-turn admission");
		const admissionRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.admissionRunId);
		const sourceTurnId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sourceTurnId);
		if (sourceTurnId) {
			if (require_store.hasRestartRecoveryTerminalRun(entry, sourceTurnId)) return "duplicate-source";
			if (require_store.hasRestartRecoverySourceClaim(entry, sourceTurnId)) {
				if (entry.status !== "running") {
					const retired = await retireTerminalRestartRecoverySourceClaim({
						sessionId,
						sessionKey: params.sessionKey,
						sourceTurnId,
						storePath: params.storePath
					});
					if (retired) params.setEntry(retired);
				}
				return "duplicate-source";
			}
		}
		const activeClaimRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.restartRecoveryDeliveryRunId);
		if (admissionRunId && entry && entry.restartRecoveryDeliveryContext === void 0 && activeClaimRunId === admissionRunId) {
			if (entry.status !== "running" || entry.abortedLastRun === true) throw new Error("restart recovery claim changed before agent adoption");
			const adopted = await persistAdmissionPatch({
				entry,
				patch: {
					restartRecoveryBeforeAgentReplyState: params.beforeAgentReplyState,
					restartRecoveryDeliveryReceiptState: void 0,
					restartRecoveryDeliveryToolCallId: void 0,
					restartRecoveryDeliveryRequestFingerprint: void 0,
					restartRecoverySourceIngress: entry.restartRecoverySourceIngress ?? "control-ui",
					updatedAt: Date.now()
				},
				recorder,
				sessionId,
				sessionKey: params.sessionKey,
				storePath: params.storePath
			});
			params.setEntry(adopted);
			recoveryRunId = admissionRunId;
			recoverySourceRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(adopted.restartRecoveryDeliverySourceRunId);
			tracked = true;
			return "admitted";
		}
		const deliveryContext = params.resolveDeliveryContext(entry);
		const recoverableDeliveryContext = deliveryContext && sourceTurnId ? deliveryContext : void 0;
		if (recoverableDeliveryContext) {
			const persistedSourceTurnId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((recorder?.getPersistedMessage?.() ?? await recorder?.resolveMessage())?.idempotencyKey);
			if (!recorder || persistedSourceTurnId !== sourceTurnId) throw new Error("channel restart recovery requires source-keyed user-turn admission");
		}
		if (!recoverableDeliveryContext && !activeClaimRunId) {
			await persistUserTurnOnly(recorder, sessionId);
			return "admitted";
		}
		const updatedAt = Date.now();
		if (activeClaimRunId && (entry.abortedLastRun === true || entry.status === "running" || entry.restartRecoveryDeliveryReceiptState === "terminal-pending")) throw new Error("restart recovery claim changed before agent adoption");
		const retiredClaim = activeClaimRunId ? require_store.buildRestartRecoveryClaimCleanupPatch({
			entry,
			recordTerminalSource: true,
			terminalSourceRunId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliverySourceRunId)
		}) : {};
		const patch = recoverableDeliveryContext ? {
			...retiredClaim,
			abortedLastRun: false,
			endedAt: void 0,
			restartRecoveryBeforeAgentReplyState: params.beforeAgentReplyState,
			restartRecoveryDeliveryReceiptState: void 0,
			restartRecoveryDeliveryToolCallId: void 0,
			restartRecoveryDeliveryContext: recoverableDeliveryContext,
			restartRecoveryDeliveryRequestFingerprint: void 0,
			restartRecoveryDeliveryRunId: recoveryRunId,
			restartRecoveryDeliverySourceRunId: sourceTurnId,
			restartRecoveryRequesterAccountId: sourceTurnId ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterAccountId) : void 0,
			restartRecoveryRequesterSenderId: sourceTurnId ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSenderId) : void 0,
			restartRecoverySameChannelThreadRequired: sourceTurnId && params.sameChannelThreadRequired === true ? true : void 0,
			restartRecoverySourceIngress: sourceTurnId ? "channel" : void 0,
			restartRecoverySourceReplyDeliveryMode: params.sourceReplyDeliveryMode,
			runtimeMs: void 0,
			startedAt: updatedAt,
			status: "running",
			updatedAt
		} : {
			...retiredClaim,
			updatedAt
		};
		const persisted = await persistAdmissionPatch({
			entry,
			patch,
			recorder,
			sessionId,
			sessionKey: params.sessionKey,
			storePath: params.storePath
		});
		params.setEntry(persisted);
		recoverySourceRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(persisted.restartRecoveryDeliverySourceRunId);
		tracked = persisted.restartRecoveryDeliveryRunId === recoveryRunId;
		return "admitted";
	};
	const checkpointBeforeAgentReply = async ({ state, pendingFinalDelivery }) => {
		if (!tracked || !params.sessionKey || !params.storePath) return;
		const updatedAt = Date.now();
		const persisted = await require_session_accessor.updateSessionEntry({
			storePath: params.storePath,
			sessionKey: params.sessionKey
		}, (current) => current.sessionId === params.getSessionId() && current.restartRecoveryDeliveryRunId === recoveryRunId && current.restartRecoveryDeliverySourceRunId === recoverySourceRunId && current.restartRecoveryBeforeAgentReplyState === "pending" ? {
			restartRecoveryBeforeAgentReplyState: state,
			...pendingFinalDelivery ? {
				pendingFinalDelivery: true,
				pendingFinalDeliveryText: pendingFinalDelivery.text,
				pendingFinalDeliveryIntentId: pendingFinalDelivery.intentId,
				pendingFinalDeliveryContext: pendingFinalDelivery.context,
				pendingFinalDeliveryCreatedAt: updatedAt,
				restartRecoveryForceSafeTools: true
			} : {},
			updatedAt
		} : null, {
			skipMaintenance: true,
			takeCacheOwnership: true
		});
		if (!persisted) throw new Error("before_agent_reply checkpoint lost restart recovery ownership");
		params.setEntry(persisted);
	};
	const clear = async () => {
		if (!tracked || !params.sessionKey || !params.storePath || params.isRestartAbort()) return;
		const persisted = await require_session_accessor.updateSessionEntry({
			storePath: params.storePath,
			sessionKey: params.sessionKey
		}, (current) => {
			if (current.sessionId !== params.getSessionId() || current.restartRecoveryDeliveryRunId !== recoveryRunId) return null;
			if (current.restartRecoveryDeliveryReceiptState === "terminal-pending") {
				const endedAt = Date.now();
				return {
					...require_store.buildRestartRecoveryClaimCleanupPatch({
						entry: current,
						recordTerminalSource: true,
						terminalSourceRunId: recoverySourceRunId
					}),
					abortedLastRun: true,
					endedAt,
					pendingFinalDelivery: void 0,
					pendingFinalDeliveryText: void 0,
					pendingFinalDeliveryCreatedAt: void 0,
					pendingFinalDeliveryLastAttemptAt: void 0,
					pendingFinalDeliveryAttemptCount: void 0,
					pendingFinalDeliveryLastError: void 0,
					pendingFinalDeliveryContext: void 0,
					pendingFinalDeliveryIntentId: void 0,
					runtimeMs: typeof current.startedAt === "number" ? Math.max(0, endedAt - current.startedAt) : void 0,
					status: "failed",
					updatedAt: endedAt
				};
			}
			const preservesPendingFinal = current.pendingFinalDelivery === true || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(current.pendingFinalDeliveryText) !== void 0;
			const endedAt = current.restartRecoveryBeforeAgentReplyState === "handled-silent" && !preservesPendingFinal ? Date.now() : void 0;
			return {
				...require_store.buildRestartRecoveryClaimCleanupPatch({
					entry: current,
					recordTerminalSource: true,
					terminalSourceRunId: recoverySourceRunId
				}),
				...preservesPendingFinal ? {
					restartRecoveryBeforeAgentReplyState: current.restartRecoveryBeforeAgentReplyState,
					restartRecoverySourceIngress: current.restartRecoverySourceIngress,
					restartRecoveryForceSafeTools: current.restartRecoveryForceSafeTools
				} : {},
				...endedAt !== void 0 ? {
					abortedLastRun: false,
					endedAt,
					runtimeMs: typeof current.startedAt === "number" ? Math.max(0, endedAt - current.startedAt) : void 0,
					status: "done"
				} : {},
				updatedAt: endedAt ?? Date.now()
			};
		});
		if (persisted) params.setEntry(persisted);
	};
	const isArmed = () => {
		if (!tracked || !params.sessionKey || !params.storePath) return false;
		return require_session_accessor.loadSessionEntry({
			sessionKey: params.sessionKey,
			storePath: params.storePath,
			clone: false,
			hydrateSkillPromptRefs: false
		})?.abortedLastRun === true || params.getEntry()?.abortedLastRun === true;
	};
	return {
		admitUserTurn,
		checkpointBeforeAgentReply,
		clear,
		isArmed
	};
}
//#endregion
//#region src/auto-reply/reply/reply-usage-state.ts
const TTL_MS = 5 * 6e4;
const store = /* @__PURE__ */ new Map();
function buildReplyUsageState(params) {
	const resolvedProvider = params.fallbackExhausted ? void 0 : params.winnerProvider;
	const resolvedModel = params.fallbackExhausted ? void 0 : params.winnerModel;
	const hasBillableUsageBuckets = params.usage && (params.usage.input !== void 0 || params.usage.output !== void 0 || params.usage.cacheRead !== void 0 || params.usage.cacheWrite !== void 0);
	return {
		provider: params.provider,
		model: params.model,
		resolvedRef: resolvedProvider && resolvedModel ? `${resolvedProvider}/${resolvedModel}` : void 0,
		reasoningEffort: params.reasoningEffort,
		fastMode: params.fastMode,
		fallbackUsed: params.fallbackUsed,
		agentId: params.agentId,
		sessionId: params.sessionId,
		chatType: params.chatType,
		authMode: params.authMode,
		overrideSource: params.overrideSource,
		requested: params.requestedProvider && params.requestedModel ? `${params.requestedProvider}/${params.requestedModel}` : void 0,
		turnUsd: hasBillableUsageBuckets ? require_usage_format.estimateUsageCost({
			usage: params.usage,
			cost: require_usage_format.resolveModelCostConfig({
				provider: params.provider,
				model: params.model,
				config: params.config
			})
		}) : void 0,
		durationMs: params.durationMs,
		identity: require_identity.resolveAgentIdentity(params.config, params.agentId),
		compactionCount: params.compactionCount,
		contextTokenBudget: typeof params.contextTokenBudget === "number" && Number.isFinite(params.contextTokenBudget) ? params.contextTokenBudget : void 0,
		contextUsedTokens: typeof params.contextUsedTokens === "number" && Number.isFinite(params.contextUsedTokens) ? params.contextUsedTokens : require_session_accessor.deriveContextPromptTokens({
			lastCallUsage: params.lastCallUsage,
			promptTokens: params.promptTokens,
			usage: params.usage
		}),
		usage: params.usage ? {
			input: params.usage.input,
			output: params.usage.output,
			cacheRead: params.usage.cacheRead,
			cacheWrite: params.usage.cacheWrite,
			total: params.usage.total
		} : void 0,
		lastUsage: params.lastCallUsage ? {
			input: params.lastCallUsage.input,
			output: params.lastCallUsage.output,
			cacheRead: params.lastCallUsage.cacheRead,
			cacheWrite: params.lastCallUsage.cacheWrite,
			total: params.lastCallUsage.total
		} : void 0
	};
}
function prune(now) {
	for (const [key, value] of store) if (value.expiresAt < now) store.delete(key);
}
function recordReplyUsageState(runId, snapshot) {
	if (!runId) return;
	const now = Date.now();
	store.set(runId, {
		snapshot,
		expiresAt: now + TTL_MS
	});
	prune(now);
}
function consumeReplyUsageState(runId) {
	if (!runId) return;
	const value = store.get(runId);
	return value && value.expiresAt >= Date.now() ? value.snapshot : void 0;
}
//#endregion
Object.defineProperty(exports, "buildReplyUsageState", {
	enumerable: true,
	get: function() {
		return buildReplyUsageState;
	}
});
Object.defineProperty(exports, "consumeReplyUsageState", {
	enumerable: true,
	get: function() {
		return consumeReplyUsageState;
	}
});
Object.defineProperty(exports, "createReplyRestartRecoveryClaimController", {
	enumerable: true,
	get: function() {
		return createReplyRestartRecoveryClaimController;
	}
});
Object.defineProperty(exports, "isDuplicateRestartRecoverySource", {
	enumerable: true,
	get: function() {
		return isDuplicateRestartRecoverySource;
	}
});
Object.defineProperty(exports, "recordReplyUsageState", {
	enumerable: true,
	get: function() {
		return recordReplyUsageState;
	}
});
Object.defineProperty(exports, "retireTerminalRestartRecoverySourceClaim", {
	enumerable: true,
	get: function() {
		return retireTerminalRestartRecoverySourceClaim;
	}
});
