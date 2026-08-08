require("./rolldown-runtime-u92d-OFm.cjs");
require("./plugins-_-82JYfc.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_session_binding_normalization = require("./session-binding-normalization-DSoe9GtS.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_policy = require("./policy-xAgUJHj7.cjs");
const require_subagent_spawn_plan = require("./subagent-spawn-plan-BVV4Zzak.cjs");
const require_thread_bindings_policy = require("./thread-bindings-policy-C0B1MJxA.cjs");
const require_thread_bindings_messages = require("./thread-bindings-messages-DajtqEC-.cjs");
const require_manager = require("./manager-B5L0WDCm.cjs");
const require_acp_spawn = require("./acp-spawn-CCbFKb_f.cjs");
const require_context = require("./context-V4D9UcfJ.cjs");
const require_shared = require("./shared-C-iBBXn5.cjs");
const require_targets = require("./targets-CAV0R_ib.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_acp_core_runtime_session_identifiers = require("@gabrielvfonseca/acp-core/runtime/session-identifiers");
//#region src/auto-reply/reply/commands-acp/lifecycle.ts
function resolveAcpBindingLabelNoun(params) {
	if (params.placement === "child") return "thread";
	if (!params.threadId) return "conversation";
	return params.conversationId === params.threadId ? "thread" : "conversation";
}
async function resolveBoundReplyPayload(params) {
	const channelId = require_registry.normalizeChannelId(params.binding.conversation.channel);
	if (!channelId) return;
	const buildPayload = require_registry.getChannelPlugin(channelId)?.conversationBindings?.buildBoundReplyPayload;
	if (!buildPayload) return;
	return await buildPayload({
		operation: "acp-spawn",
		placement: params.placement,
		conversation: params.binding.conversation
	}) ?? void 0;
}
function buildSpawnedAcpBindingMetadata(params) {
	return {
		threadName: require_thread_bindings_messages.resolveThreadBindingThreadName({
			agentId: params.agentId,
			label: params.label
		}),
		agentId: params.agentId,
		label: params.label,
		boundBy: params.senderId || "unknown",
		introText: require_thread_bindings_messages.resolveThreadBindingIntroText({
			agentId: params.agentId,
			label: params.label,
			idleTimeoutMs: require_thread_bindings_policy.resolveThreadBindingIdleTimeoutMsForChannel({
				cfg: params.cfg,
				channel: params.channel,
				accountId: params.accountId
			}),
			maxAgeMs: require_thread_bindings_policy.resolveThreadBindingMaxAgeMsForChannel({
				cfg: params.cfg,
				channel: params.channel,
				accountId: params.accountId
			}),
			sessionCwd: (0, _gabrielvfonseca_acp_core_runtime_session_identifiers.resolveAcpSessionCwd)(params.sessionMeta),
			sessionDetails: (0, _gabrielvfonseca_acp_core_runtime_session_identifiers.resolveAcpThreadSessionDetailLines)({
				sessionKey: params.sessionKey,
				meta: params.sessionMeta
			})
		})
	};
}
async function bindSpawnedAcpSession(params) {
	try {
		return {
			ok: true,
			binding: await params.bindingService.bind({
				targetSessionKey: params.sessionKey,
				targetKind: "session",
				conversation: params.conversationRef,
				placement: params.placement,
				metadata: buildSpawnedAcpBindingMetadata({
					cfg: params.cfg,
					channel: params.channel,
					accountId: params.accountId,
					sessionKey: params.sessionKey,
					agentId: params.agentId,
					label: params.label,
					senderId: params.senderId,
					sessionMeta: params.sessionMeta
				})
			})
		};
	} catch (error) {
		return {
			ok: false,
			error: require_errors.formatErrorMessage(error) || params.bindError
		};
	}
}
async function bindSpawnedAcpSessionToCurrentConversation(params) {
	if (params.bindMode === "off") return {
		ok: false,
		error: "internal: conversation binding is disabled for this spawn"
	};
	const bindingContext = require_context.resolveAcpCommandBindingContext(params.commandParams);
	const channel = bindingContext.channel;
	if (!channel) return {
		ok: false,
		error: "ACP current-conversation binding requires a channel context."
	};
	const accountId = require_context.resolveAcpCommandAccountId(params.commandParams);
	const bindingPolicy = require_thread_bindings_policy.resolveThreadBindingSpawnPolicy({
		cfg: params.commandParams.cfg,
		channel,
		accountId,
		kind: "acp"
	});
	if (!bindingPolicy.enabled) return {
		ok: false,
		error: require_thread_bindings_policy.formatThreadBindingDisabledError({
			channel: bindingPolicy.channel,
			accountId: bindingPolicy.accountId,
			kind: "acp"
		})
	};
	const bindingService = require_session_binding_service.getSessionBindingService();
	const capabilities = bindingService.getCapabilities({
		channel: bindingPolicy.channel,
		accountId: bindingPolicy.accountId
	});
	if (!capabilities.adapterAvailable || !capabilities.bindSupported) return {
		ok: false,
		error: `Conversation bindings are unavailable for ${channel}.`
	};
	if (!capabilities.placements.includes("current")) return {
		ok: false,
		error: `Conversation bindings do not support current placement for ${channel}.`
	};
	const currentConversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(bindingContext.conversationId) ?? "";
	if (!currentConversationId) return {
		ok: false,
		error: `--bind here requires running /acp spawn inside an active ${channel} conversation.`
	};
	const senderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.commandParams.command.senderId) ?? "";
	const conversationRef = require_session_binding_normalization.normalizeConversationRef({
		channel: bindingPolicy.channel,
		accountId: bindingPolicy.accountId,
		conversationId: currentConversationId,
		parentConversationId: bindingContext.parentConversationId
	});
	const existingBinding = bindingService.resolveByConversation(conversationRef);
	const boundBy = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(existingBinding?.metadata?.boundBy) ?? "";
	if (existingBinding && boundBy && boundBy !== "system" && senderId && senderId !== boundBy) return {
		ok: false,
		error: `Only ${boundBy} can rebind this ${resolveAcpBindingLabelNoun({
			placement: "current",
			threadId: bindingContext.threadId,
			conversationId: currentConversationId
		})}.`
	};
	const label = params.label || params.agentId;
	return bindSpawnedAcpSession({
		bindingService,
		sessionKey: params.sessionKey,
		conversationRef,
		placement: "current",
		cfg: params.commandParams.cfg,
		channel: bindingPolicy.channel,
		accountId: bindingPolicy.accountId,
		agentId: params.agentId,
		label,
		senderId,
		sessionMeta: params.sessionMeta,
		bindError: `Failed to bind the current ${channel} conversation to the new ACP session.`
	});
}
async function bindSpawnedAcpSessionToThread(params) {
	const { commandParams, threadMode } = params;
	if (threadMode === "off") return {
		ok: false,
		error: "internal: thread binding is disabled for this spawn"
	};
	const bindingContext = require_context.resolveAcpCommandBindingContext(commandParams);
	const channel = bindingContext.channel;
	if (!channel) return {
		ok: false,
		error: "ACP thread binding requires a channel context."
	};
	const accountId = require_context.resolveAcpCommandAccountId(commandParams);
	const spawnPolicy = require_thread_bindings_policy.resolveThreadBindingSpawnPolicy({
		cfg: commandParams.cfg,
		channel,
		accountId,
		kind: "acp"
	});
	if (!spawnPolicy.enabled) return {
		ok: false,
		error: require_thread_bindings_policy.formatThreadBindingDisabledError({
			channel: spawnPolicy.channel,
			accountId: spawnPolicy.accountId,
			kind: "acp"
		})
	};
	if (!spawnPolicy.spawnEnabled) return {
		ok: false,
		error: require_thread_bindings_policy.formatThreadBindingSpawnDisabledError({
			channel: spawnPolicy.channel,
			accountId: spawnPolicy.accountId,
			kind: "acp"
		})
	};
	const bindingService = require_session_binding_service.getSessionBindingService();
	const capabilities = bindingService.getCapabilities({
		channel: spawnPolicy.channel,
		accountId: spawnPolicy.accountId
	});
	if (!capabilities.adapterAvailable) return {
		ok: false,
		error: `Thread bindings are unavailable for ${channel}.`
	};
	if (!capabilities.bindSupported) return {
		ok: false,
		error: `Thread bindings are unavailable for ${channel}.`
	};
	const currentThreadId = bindingContext.threadId ?? "";
	const currentConversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(bindingContext.conversationId) ?? "";
	const requiresThreadIdForHere = require_thread_bindings_policy.requiresNativeThreadContextForThreadHere(channel);
	if (threadMode === "here" && (requiresThreadIdForHere && !currentThreadId || !requiresThreadIdForHere && !currentConversationId)) return {
		ok: false,
		error: `--thread here requires running /acp spawn inside an active ${channel} thread/conversation.`
	};
	const placement = require_thread_bindings_policy.resolveThreadBindingPlacementForCurrentContext({
		channel,
		threadId: currentThreadId || void 0
	});
	if (!capabilities.placements.includes(placement)) return {
		ok: false,
		error: `Thread bindings do not support ${placement} placement for ${channel}.`
	};
	if (!currentConversationId) return {
		ok: false,
		error: `Could not resolve a ${channel} conversation for ACP thread spawn.`
	};
	const senderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(commandParams.command.senderId) ?? "";
	const conversationRef = require_session_binding_normalization.normalizeConversationRef({
		channel: spawnPolicy.channel,
		accountId: spawnPolicy.accountId,
		conversationId: currentConversationId,
		parentConversationId: bindingContext.parentConversationId
	});
	if (placement === "current") {
		const existingBinding = bindingService.resolveByConversation(conversationRef);
		const boundBy = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(existingBinding?.metadata?.boundBy) ?? "";
		if (existingBinding && boundBy && boundBy !== "system" && senderId && senderId !== boundBy) return {
			ok: false,
			error: `Only ${boundBy} can rebind this ${resolveAcpBindingLabelNoun({
				placement,
				threadId: currentThreadId || void 0,
				conversationId: currentConversationId
			})}.`
		};
	}
	const label = params.label || params.agentId;
	return bindSpawnedAcpSession({
		bindingService,
		sessionKey: params.sessionKey,
		conversationRef,
		placement,
		cfg: commandParams.cfg,
		channel: spawnPolicy.channel,
		accountId: spawnPolicy.accountId,
		agentId: params.agentId,
		label,
		senderId,
		sessionMeta: params.sessionMeta,
		bindError: `Failed to bind a ${channel} thread/conversation to the new ACP session.`
	});
}
async function cleanupFailedSpawn(params) {
	await require_acp_spawn.cleanupFailedAcpSpawn({
		cfg: params.cfg,
		sessionKey: params.sessionKey,
		shouldDeleteSession: params.shouldDeleteSession,
		deleteTranscript: false,
		runtimeCloseHandle: params.initializedRuntime
	});
}
async function persistSpawnedSessionLabel(params) {
	const label = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.label);
	if (!label) return;
	const now = Date.now();
	if (params.commandParams.sessionStore) {
		const existing = params.commandParams.sessionStore[params.sessionKey];
		if (existing) params.commandParams.sessionStore[params.sessionKey] = {
			...existing,
			label,
			updatedAt: now
		};
	}
	if (!params.commandParams.storePath) return;
	await require_session_accessor.updateSessionEntry({
		storePath: params.commandParams.storePath,
		sessionKey: params.sessionKey
	}, () => ({
		label,
		updatedAt: now
	}));
}
async function handleAcpSpawnAction(params, restTokens) {
	if (!require_policy.isAcpEnabledByPolicy(params.cfg)) return require_shared.stopWithText("ACP is disabled by policy (`acp.enabled=false`).");
	const parsed = require_shared.parseSpawnInput(params, restTokens);
	if (!parsed.ok) return require_shared.stopWithText(`⚠️ ${parsed.error}`);
	const spawn = parsed.value;
	const runtimePolicyError = require_acp_spawn.resolveAcpSpawnRuntimePolicyError({
		cfg: params.cfg,
		requesterSessionKey: params.sessionKey
	});
	if (runtimePolicyError) return require_shared.stopWithText(`⚠️ ${runtimePolicyError}`);
	const agentPolicyError = require_policy.resolveAcpAgentPolicyError(params.cfg, spawn.agentId);
	if (agentPolicyError) return require_shared.stopWithText(require_shared.collectAcpErrorText({
		error: agentPolicyError,
		fallbackCode: "ACP_SESSION_INIT_FAILED",
		fallbackMessage: "ACP target agent is not allowed by policy."
	}));
	const acpManager = require_manager.getAcpSessionManager();
	const sessionKey = `agent:${spawn.agentId}:acp:${(0, node_crypto.randomUUID)()}`;
	const resolvedCwd = require_subagent_spawn_plan.resolveSpawnedWorkspaceInheritance({
		config: params.cfg,
		targetAgentId: spawn.agentId,
		requesterSessionKey: params.sessionKey,
		explicitWorkspaceDir: spawn.cwd
	});
	let runtimeCwd;
	try {
		runtimeCwd = await require_acp_spawn.resolveRuntimeCwdForAcpSpawn({
			resolvedCwd,
			explicitCwd: spawn.cwd
		});
	} catch (error) {
		return require_shared.stopWithText(require_shared.collectAcpErrorText({
			error,
			fallbackCode: "ACP_SESSION_INIT_FAILED",
			fallbackMessage: "Could not resolve ACP session workspace."
		}));
	}
	let initializedBackend;
	let initializedMeta;
	let initializedRuntime;
	try {
		const initialized = await acpManager.initializeSession({
			cfg: params.cfg,
			sessionKey,
			agent: spawn.agentId,
			mode: spawn.mode,
			cwd: runtimeCwd
		});
		initializedRuntime = {
			runtime: initialized.runtime,
			handle: initialized.handle
		};
		initializedBackend = initialized.handle.backend || initialized.meta.backend;
		initializedMeta = initialized.meta;
	} catch (err) {
		return require_shared.stopWithText(require_shared.collectAcpErrorText({
			error: err,
			fallbackCode: "ACP_SESSION_INIT_FAILED",
			fallbackMessage: "Could not initialize ACP session runtime."
		}));
	}
	let binding = null;
	if (spawn.bind !== "off") {
		const bound = await bindSpawnedAcpSessionToCurrentConversation({
			commandParams: params,
			sessionKey,
			agentId: spawn.agentId,
			label: spawn.label,
			bindMode: spawn.bind,
			sessionMeta: initializedMeta
		});
		if (!bound.ok) {
			await cleanupFailedSpawn({
				cfg: params.cfg,
				sessionKey,
				shouldDeleteSession: true,
				initializedRuntime
			});
			return require_shared.stopWithText(`⚠️ ${bound.error}`);
		}
		binding = bound.binding;
	} else if (spawn.thread !== "off") {
		const bound = await bindSpawnedAcpSessionToThread({
			commandParams: params,
			sessionKey,
			agentId: spawn.agentId,
			label: spawn.label,
			threadMode: spawn.thread,
			sessionMeta: initializedMeta
		});
		if (!bound.ok) {
			await cleanupFailedSpawn({
				cfg: params.cfg,
				sessionKey,
				shouldDeleteSession: true,
				initializedRuntime
			});
			return require_shared.stopWithText(`⚠️ ${bound.error}`);
		}
		binding = bound.binding;
	}
	try {
		await persistSpawnedSessionLabel({
			commandParams: params,
			sessionKey,
			label: spawn.label
		});
	} catch (err) {
		await cleanupFailedSpawn({
			cfg: params.cfg,
			sessionKey,
			shouldDeleteSession: true,
			initializedRuntime
		});
		return require_shared.stopWithText(`⚠️ ACP spawn failed: ${require_errors.formatErrorMessage(err)}`);
	}
	const parts = [`✅ Spawned ACP session ${sessionKey} (${spawn.mode}, backend ${initializedBackend}).`];
	if (binding) {
		const currentConversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_context.resolveAcpCommandConversationId(params)) ?? "";
		const boundConversationId = binding.conversation.conversationId.trim();
		const bindingPlacement = currentConversationId && boundConversationId === currentConversationId ? "current" : "child";
		const placementLabel = resolveAcpBindingLabelNoun({
			conversationId: currentConversationId,
			placement: bindingPlacement,
			threadId: require_context.resolveAcpCommandThreadId(params)
		});
		if (bindingPlacement === "current") parts.push(`Bound this ${placementLabel} to ${sessionKey}.`);
		else parts.push(`Created ${placementLabel} ${boundConversationId} and bound it to ${sessionKey}.`);
		const boundReplyPayload = await resolveBoundReplyPayload({
			binding,
			placement: bindingPlacement
		});
		if (boundReplyPayload) return {
			shouldContinue: false,
			reply: {
				text: parts.join(" "),
				...boundReplyPayload
			}
		};
	} else parts.push("Session is unbound (use /acp spawn ... --bind here to bind this conversation, or /focus <session-key> where supported).");
	const dispatchNote = require_policy.resolveAcpDispatchPolicyMessage(params.cfg);
	if (dispatchNote) parts.push(`ℹ️ ${dispatchNote}`);
	return require_shared.stopWithText(parts.join(" "));
}
function resolveAcpSessionForCommandOrStop(params) {
	const error = require_manager.resolveAcpSessionResolutionError(params.acpManager.resolveSession({
		cfg: params.cfg,
		sessionKey: params.sessionKey
	}));
	if (error) return require_shared.stopWithText(require_shared.collectAcpErrorText({
		error,
		fallbackCode: "ACP_SESSION_INIT_FAILED",
		fallbackMessage: error.message
	}));
	return null;
}
async function resolveAcpTokenTargetSessionKeyOrStop(params) {
	const token = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.restTokens.join(" "));
	const target = await require_targets.resolveAcpTargetSessionKey({
		commandParams: params.commandParams,
		token
	});
	if (!target.ok) return require_shared.stopWithText(`⚠️ ${target.error}`);
	return target.sessionKey;
}
async function withResolvedAcpSessionTarget(params) {
	const acpManager = require_manager.getAcpSessionManager();
	const targetSessionKey = await resolveAcpTokenTargetSessionKeyOrStop({
		commandParams: params.commandParams,
		restTokens: params.restTokens
	});
	if (typeof targetSessionKey !== "string") return targetSessionKey;
	const guardFailure = resolveAcpSessionForCommandOrStop({
		acpManager,
		cfg: params.commandParams.cfg,
		sessionKey: targetSessionKey
	});
	if (guardFailure) return guardFailure;
	return await params.run({
		acpManager,
		sessionKey: targetSessionKey
	});
}
async function handleAcpCancelAction(params, restTokens) {
	return await withResolvedAcpSessionTarget({
		commandParams: params,
		restTokens,
		run: async ({ acpManager, sessionKey }) => await require_shared.withAcpCommandErrorBoundary({
			run: async () => await acpManager.cancelSession({
				cfg: params.cfg,
				sessionKey,
				reason: "manual-cancel"
			}),
			fallbackCode: "ACP_TURN_FAILED",
			fallbackMessage: "ACP cancel failed before completion.",
			onSuccess: () => require_shared.stopWithText(`✅ Cancel requested for ACP session ${sessionKey}.`)
		})
	});
}
async function runAcpSteer(params) {
	const acpManager = require_manager.getAcpSessionManager();
	let output = "";
	await acpManager.runTurn({
		cfg: params.cfg,
		sessionKey: params.sessionKey,
		provenance: "agent",
		text: params.instruction,
		mode: "steer",
		requestId: params.requestId,
		onEvent: (event) => {
			if (event.type !== "text_delta") return;
			if (event.stream && event.stream !== "output") return;
			if (event.text) {
				output += event.text;
				if (output.length > 800) output = `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(output, 800)}…`;
			}
		}
	});
	return output.trim();
}
async function handleAcpSteerAction(params, restTokens) {
	const dispatchPolicyError = require_policy.resolveAcpDispatchPolicyError(params.cfg);
	if (dispatchPolicyError) return require_shared.stopWithText(require_shared.collectAcpErrorText({
		error: dispatchPolicyError,
		fallbackCode: "ACP_DISPATCH_DISABLED",
		fallbackMessage: dispatchPolicyError.message
	}));
	const parsed = require_shared.parseSteerInput(restTokens);
	if (!parsed.ok) return require_shared.stopWithText(`⚠️ ${parsed.error}`);
	const acpManager = require_manager.getAcpSessionManager();
	const target = await require_targets.resolveAcpTargetSessionKey({
		commandParams: params,
		token: parsed.value.sessionToken
	});
	if (!target.ok) return require_shared.stopWithText(`⚠️ ${target.error}`);
	const guardFailure = resolveAcpSessionForCommandOrStop({
		acpManager,
		cfg: params.cfg,
		sessionKey: target.sessionKey
	});
	if (guardFailure) return guardFailure;
	return await require_shared.withAcpCommandErrorBoundary({
		run: async () => await runAcpSteer({
			cfg: params.cfg,
			sessionKey: target.sessionKey,
			instruction: parsed.value.instruction,
			requestId: `${require_shared.resolveCommandRequestId(params)}:steer`
		}),
		fallbackCode: "ACP_TURN_FAILED",
		fallbackMessage: "ACP steer failed before completion.",
		onSuccess: (steerOutput) => {
			if (!steerOutput) return require_shared.stopWithText(`✅ ACP steer sent to ${target.sessionKey}.`);
			return require_shared.stopWithText(`✅ ACP steer sent to ${target.sessionKey}.\n${steerOutput}`);
		}
	});
}
async function handleAcpCloseAction(params, restTokens) {
	return await withResolvedAcpSessionTarget({
		commandParams: params,
		restTokens,
		run: async ({ acpManager, sessionKey }) => {
			let runtimeNotice;
			try {
				const closed = await acpManager.closeSession({
					cfg: params.cfg,
					sessionKey,
					reason: "manual-close",
					allowBackendUnavailable: true,
					clearMeta: true
				});
				runtimeNotice = closed.runtimeNotice ? ` (${closed.runtimeNotice})` : "";
			} catch (error) {
				return require_shared.stopWithText(require_shared.collectAcpErrorText({
					error,
					fallbackCode: "ACP_TURN_FAILED",
					fallbackMessage: "ACP close failed before completion."
				}));
			}
			const removedBindings = await require_session_binding_service.getSessionBindingService().unbind({
				targetSessionKey: sessionKey,
				reason: "manual"
			});
			return require_shared.stopWithText(`✅ Closed ACP session ${sessionKey}${runtimeNotice}. Removed ${removedBindings.length} binding${removedBindings.length === 1 ? "" : "s"}.`);
		}
	});
}
//#endregion
exports.handleAcpCancelAction = handleAcpCancelAction;
exports.handleAcpCloseAction = handleAcpCloseAction;
exports.handleAcpSpawnAction = handleAcpSpawnAction;
exports.handleAcpSteerAction = handleAcpSteerAction;
