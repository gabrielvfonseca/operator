require("./rolldown-runtime-u92d-OFm.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_resolve_route = require("./resolve-route-DQGFdHA5.cjs");
require("./errors-BqS4bzom.cjs");
const require_completion_delivery_policy = require("./completion-delivery-policy-Djb6F8Lx.cjs");
const require_identity = require("./identity-Dv2mhJl0.cjs");
const require_dispatch = require("./dispatch-DMC5F8fZ.cjs");
const require_chunk = require("./chunk-qjERm7HU.cjs");
const require_pairing_store = require("./pairing-store-qtDtw17r.cjs");
const require_tables = require("./tables-c2KKeZEl.cjs");
const require_agent_tools_policy = require("./agent-tools.policy-CgUshexf.cjs");
const require_mention_gating = require("./mention-gating-DOmh08Sw.cjs");
const require_store = require("./store-BW6t6tIi.cjs");
const require_fetch = require("./fetch-Be5VK67y.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_inbound_context = require("./inbound-context-DRXGR9Cr.cjs");
const require_kernel = require("./kernel-BQTSZWlX.cjs");
const require_mentions = require("./mentions-xs5giNxG.cjs");
const require_load = require("./load-8Ay4FLnH.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_envelope = require("./envelope-BwASvxGn.cjs");
require("./logging-CPL2M9DX.cjs");
const require_entry_freshness = require("./entry-freshness-DzG9sDbU.cjs");
const require_commands_registry = require("./commands-registry-BvZ3TCTG.cjs");
const require_markdown_tables = require("./markdown-tables-C75-KM7I.cjs");
const require_conversation_bindings = require("./conversation-bindings-Dd2TPkMX.cjs");
const require_channel_activity = require("./channel-activity-qBdJwD4s.cjs");
const require_session = require("./session-Baxdo1qA.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/channels/ack-reactions.ts
/** Channel-level policy for which inbound messages should receive an ack reaction. */
/** Resolves the generic ack reaction gate without sending or removing reactions. */
function shouldAckReaction(params) {
	const scope = params.scope ?? "group-mentions";
	if (scope === "off" || scope === "none") return false;
	if (params.inboundEventKind === "room_event" && scope !== "all") return false;
	if (scope === "all") return true;
	if (scope === "direct") return params.isDirect;
	if (scope === "group-all") return params.isGroup;
	if (scope === "group-mentions") {
		if (!params.isMentionableGroup) return false;
		if (!params.requireMention) return false;
		if (!params.canDetectMention) return false;
		return params.effectiveWasMentioned || params.shouldBypassMention === true;
	}
	return false;
}
/** Starts sending an ack reaction and returns the success-tracking cleanup handle. */
function createAckReactionHandle(params) {
	const ackReactionValue = params.ackReactionValue.trim();
	if (!ackReactionValue) return null;
	let sendPromise;
	try {
		sendPromise = params.send();
	} catch (err) {
		sendPromise = Promise.reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(err, "Non-Error rejection"));
	}
	return {
		ackReactionPromise: sendPromise.then(() => true, (err) => {
			params.onSendError?.(err);
			return false;
		}),
		ackReactionValue,
		remove: params.remove
	};
}
/** Schedules removal of a previously sent ack reaction after reply delivery. */
function removeAckReactionAfterReply(params) {
	if (!params.removeAfterReply) return;
	if (!params.ackReactionPromise) return;
	if (!params.ackReactionValue) return;
	params.ackReactionPromise.then((didAck) => {
		if (!didAck) return;
		params.remove().catch((err) => params.onError?.(err));
	});
}
/** Convenience wrapper that removes an ack reaction handle after reply delivery. */
function removeAckReactionHandleAfterReply(params) {
	removeAckReactionAfterReply({
		removeAfterReply: params.removeAfterReply,
		ackReactionPromise: params.ackReaction?.ackReactionPromise ?? null,
		ackReactionValue: params.ackReaction?.ackReactionValue ?? null,
		remove: params.ackReaction?.remove ?? (async () => {}),
		onError: params.onError
	});
}
//#endregion
//#region src/plugins/runtime/channel-runtime-contexts.ts
const log = require_subsystem.createSubsystemLogger("plugins/runtime-channel");
function normalizeRuntimeContextString(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? "";
}
function normalizeRuntimeContextKey(params) {
	const channelId = normalizeRuntimeContextString(params.channelId);
	const capability = normalizeRuntimeContextString(params.capability);
	const accountId = normalizeRuntimeContextString(params.accountId);
	if (!channelId || !capability) return null;
	return {
		mapKey: `${channelId}\u0000${accountId}\u0000${capability}`,
		normalizedKey: {
			channelId,
			capability,
			...accountId ? { accountId } : {}
		}
	};
}
function doesRuntimeContextWatcherMatch(params) {
	if (params.watcher.channelId && params.watcher.channelId !== params.event.key.channelId) return false;
	if (params.watcher.accountId !== void 0 && params.watcher.accountId !== (params.event.key.accountId ?? "")) return false;
	if (params.watcher.capability && params.watcher.capability !== params.event.key.capability) return false;
	return true;
}
/** Creates the in-memory channel runtime context registry used by plugin runtime surfaces. */
function createChannelRuntimeContextRegistry() {
	const runtimeContexts = /* @__PURE__ */ new Map();
	const runtimeContextWatchers = /* @__PURE__ */ new Set();
	const emitRuntimeContextEvent = (event) => {
		for (const watcher of runtimeContextWatchers) {
			if (!doesRuntimeContextWatcherMatch({
				watcher: watcher.filter,
				event
			})) continue;
			try {
				watcher.onEvent(event);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				log.error(`runtime context watcher failed during ${event.type} channel=${event.key.channelId} capability=${event.key.capability}` + (event.key.accountId ? ` account=${event.key.accountId}` : "") + `: ${message}`);
			}
		}
	};
	return {
		register: (params) => {
			const normalized = normalizeRuntimeContextKey(params);
			if (!normalized) return { dispose: () => {} };
			if (params.abortSignal?.aborted) return { dispose: () => {} };
			const token = Symbol(normalized.mapKey);
			let disposed = false;
			const dispose = () => {
				if (disposed) return;
				disposed = true;
				const current = runtimeContexts.get(normalized.mapKey);
				if (!current || current.token !== token) return;
				runtimeContexts.delete(normalized.mapKey);
				emitRuntimeContextEvent({
					type: "unregistered",
					key: normalized.normalizedKey
				});
			};
			params.abortSignal?.addEventListener("abort", dispose, { once: true });
			if (params.abortSignal?.aborted) {
				dispose();
				return { dispose };
			}
			runtimeContexts.set(normalized.mapKey, {
				token,
				context: params.context,
				normalizedKey: normalized.normalizedKey
			});
			if (disposed) return { dispose };
			emitRuntimeContextEvent({
				type: "registered",
				key: normalized.normalizedKey,
				context: params.context
			});
			return { dispose };
		},
		get: (params) => {
			const normalized = normalizeRuntimeContextKey(params);
			if (!normalized) return;
			return runtimeContexts.get(normalized.mapKey)?.context;
		},
		watch: (params) => {
			const watcher = {
				filter: {
					...params.channelId?.trim() ? { channelId: params.channelId.trim() } : {},
					...params.accountId != null ? { accountId: params.accountId.trim() } : {},
					...params.capability?.trim() ? { capability: params.capability.trim() } : {}
				},
				onEvent: params.onEvent
			};
			runtimeContextWatchers.add(watcher);
			return () => {
				runtimeContextWatchers.delete(watcher);
			};
		}
	};
}
//#endregion
//#region src/plugins/runtime/runtime-channel.ts
function createRuntimeChannel() {
	return {
		text: {
			chunkByNewline: require_chunk.chunkByNewline,
			chunkMarkdownText: require_chunk.chunkMarkdownText,
			chunkMarkdownTextWithMode: require_chunk.chunkMarkdownTextWithMode,
			chunkText: require_chunk.chunkText,
			chunkTextWithMode: require_chunk.chunkTextWithMode,
			resolveChunkMode: require_chunk.resolveChunkMode,
			resolveTextChunkLimit: require_chunk.resolveTextChunkLimit,
			hasControlCommand: require_completion_delivery_policy.hasControlCommand,
			resolveMarkdownTableMode: require_markdown_tables.resolveMarkdownTableMode,
			convertMarkdownTables: require_tables.convertMarkdownTables
		},
		reply: {
			dispatchReplyWithBufferedBlockDispatcher: require_session.dispatchReplyWithBufferedBlockDispatcher,
			createReplyDispatcherWithTyping: require_dispatch.createReplyDispatcherWithTyping,
			resolveEffectiveMessagesConfig: require_identity.resolveEffectiveMessagesConfig,
			resolveHumanDelayConfig: require_identity.resolveHumanDelayConfig,
			dispatchReplyFromConfig: require_dispatch.dispatchReplyFromConfig,
			withReplyDispatcher: require_dispatch.withReplyDispatcher,
			settleReplyDispatcher: require_dispatch.settleReplyDispatcher,
			finalizeInboundContext: require_inbound_context.finalizeInboundContext,
			formatAgentEnvelope: require_envelope.formatAgentEnvelope,
			/** @deprecated Prefer `BodyForAgent` + structured user-context blocks (do not build plaintext envelopes for prompts). */
			formatInboundEnvelope: require_envelope.formatInboundEnvelope,
			resolveEnvelopeFormatOptions: require_envelope.resolveEnvelopeFormatOptions
		},
		routing: {
			buildAgentSessionKey: require_resolve_route.buildAgentSessionKey,
			resolveAgentRoute: require_resolve_route.resolveAgentRoute
		},
		pairing: {
			buildPairingReply: require_tables.buildPairingReply,
			readAllowFromStore: ({ channel, accountId, env }) => require_pairing_store.readChannelAllowFromStore(channel, env, accountId),
			removeAllowFromStoreEntry: ({ channel, entry, accountId, env, pairingAdapter }) => require_pairing_store.removeChannelAllowFromStoreEntry({
				channel,
				entry,
				accountId,
				env,
				pairingAdapter
			}),
			upsertPairingRequest: ({ channel, id, accountId, meta, env, pairingAdapter }) => require_pairing_store.upsertChannelPairingRequest({
				channel,
				id,
				accountId,
				meta,
				env,
				pairingAdapter
			})
		},
		media: {
			readRemoteMediaBuffer: require_fetch.readRemoteMediaBuffer,
			fetchRemoteMedia: require_fetch.fetchRemoteMedia,
			saveRemoteMedia: require_fetch.saveRemoteMedia,
			saveResponseMedia: require_fetch.saveResponseMedia,
			saveMediaBuffer: require_store.saveMediaBuffer
		},
		activity: {
			record: require_channel_activity.recordChannelActivity,
			get: require_channel_activity.getChannelActivity
		},
		session: {
			resolveStorePath: require_paths.resolveStorePath,
			readSessionUpdatedAt: require_session_accessor.readSessionUpdatedAt,
			recordSessionMetaFromInbound: require_session_accessor.recordInboundSessionMeta,
			recordInboundSession: require_session.recordInboundSession,
			updateLastRoute: require_session_accessor.updateSessionLastRoute,
			resolveEntryResetFreshness: require_entry_freshness.resolveSessionEntryResetFreshness
		},
		mentions: {
			buildMentionRegexes: require_mentions.buildMentionRegexes,
			matchesMentionPatterns: require_mentions.matchesMentionPatterns,
			matchesMentionWithExplicit: require_mentions.matchesMentionWithExplicit,
			implicitMentionKindWhen: require_mention_gating.implicitMentionKindWhen,
			resolveInboundMentionDecision: require_mention_gating.resolveInboundMentionDecision
		},
		reactions: {
			createAckReactionHandle,
			shouldAckReaction,
			removeAckReactionAfterReply,
			removeAckReactionHandleAfterReply
		},
		groups: {
			resolveGroupPolicy: require_agent_tools_policy.resolveChannelGroupPolicy,
			resolveRequireMention: require_agent_tools_policy.resolveChannelGroupRequireMention
		},
		debounce: {
			createInboundDebouncer: require_tables.createInboundDebouncer,
			resolveInboundDebounceMs: require_tables.resolveInboundDebounceMs
		},
		commands: {
			resolveCommandAuthorizedFromAuthorizers: require_mention_gating.resolveCommandAuthorizedFromAuthorizers,
			isControlCommandMessage: require_completion_delivery_policy.isControlCommandMessage,
			shouldComputeCommandAuthorized: require_completion_delivery_policy.shouldComputeCommandAuthorized,
			shouldHandleTextCommands: require_commands_registry.shouldHandleTextCommands
		},
		outbound: { loadAdapter: require_load.loadChannelOutboundAdapter },
		inbound: {
			buildContext: require_tables.buildChannelInboundEventContext,
			run: require_kernel.runChannelInboundEvent,
			runPreparedReply: require_kernel.runPreparedInboundReply,
			dispatchReply: require_kernel.dispatchChannelInboundReply
		},
		threadBindings: {
			setIdleTimeoutBySessionKey: ({ channelId, targetSessionKey, accountId, idleTimeoutMs }) => require_conversation_bindings.setChannelConversationBindingIdleTimeoutBySessionKey({
				channelId,
				targetSessionKey,
				accountId,
				idleTimeoutMs
			}),
			setMaxAgeBySessionKey: ({ channelId, targetSessionKey, accountId, maxAgeMs }) => require_conversation_bindings.setChannelConversationBindingMaxAgeBySessionKey({
				channelId,
				targetSessionKey,
				accountId,
				maxAgeMs
			})
		},
		runtimeContexts: createChannelRuntimeContextRegistry()
	};
}
//#endregion
exports.createRuntimeChannel = createRuntimeChannel;
