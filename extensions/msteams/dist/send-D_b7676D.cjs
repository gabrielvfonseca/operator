require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_outbound_session = require("./outbound-session-ca-y9vpw.cjs");
const require_keyed_async_queue = require("./keyed-async-queue-BXE4i2mb.cjs");
const require_runtime = require("./runtime-CIO0BRex.cjs");
require("./message-channel-core-CeN5z1gK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
require("./operator-scopes-BT4c3sSd.cjs");
const require_payloads = require("./payloads-MFaWqn01.cjs");
const require_session_context = require("./session-context-ByjQL-XR.cjs");
const require_local_roots = require("./local-roots-w2A4ItE4.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_polls = require("./polls-CobigrW4.cjs");
const require_channel_resolution = require("./channel-resolution-BHNgrqI2.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_source_reply_mirror = require("./source-reply-mirror-DaqgUyW8.cjs");
const require_target_resolver = require("./target-resolver-Bn46QRpp.cjs");
const require_channel_selection = require("./channel-selection-SjphkB8p.cjs");
const require_targets = require("./targets-BfrPEAMP.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_outbound_send_deps = require("./outbound-send-deps-Bux5I_gX.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
require("./deps-D7dP6ttG.cjs");
const require_runtime_plugin_config = require("./runtime-plugin-config-DtQM8a1u.cjs");
const require_conversation_read_origin = require("./conversation-read-origin-3ZbHjVeu.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/server-methods/send.ts
function resolveTrustedMessageActionToolContext(params) {
	const identity = params.client?.internal?.agentRuntimeIdentity;
	const messageActionContext = identity?.messageActionContext;
	if (!identity || !messageActionContext) return {
		ok: true,
		toolContext: void 0,
		requesterAccountId: void 0,
		requesterSenderId: void 0,
		sessionId: void 0,
		sourceReplyFinal: void 0,
		sourceReplyToolCallId: void 0
	};
	if (Date.now() >= messageActionContext.expiresAtMs) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "message.action agent runtime context has expired")
	};
	const requestSessionKey = require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(params.request.sessionKey);
	const identitySessionKey = require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(identity.sessionKey);
	const identityAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(identity.agentId);
	const requestAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.request.agentId);
	const sessionAgentId = require_session_key.parseAgentSessionKey(requestSessionKey)?.agentId;
	const requestSessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.request.sessionId);
	if (!requestSessionKey || requestSessionKey !== identitySessionKey || requestAgentId && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(requestAgentId) !== identityAgentId || sessionAgentId && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(sessionAgentId) !== identityAgentId || messageActionContext.sessionId && requestSessionId !== messageActionContext.sessionId) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "message.action agent runtime identity does not match the requested session")
	};
	return {
		ok: true,
		toolContext: messageActionContext.toolContext,
		requesterAccountId: messageActionContext.requesterAccountId,
		requesterSenderId: messageActionContext.requesterSenderId,
		sessionId: messageActionContext.sessionId,
		sourceReplyFinal: messageActionContext.sourceReplyFinal,
		sourceReplyToolCallId: messageActionContext.sourceReplyToolCallId
	};
}
const inflightByContext = /* @__PURE__ */ new WeakMap();
const getInflightMap = (context) => {
	let inflight = inflightByContext.get(context);
	if (!inflight) {
		inflight = /* @__PURE__ */ new Map();
		inflightByContext.set(context, inflight);
	}
	return inflight;
};
function resolveGatewayInflightMap(params) {
	const cached = params.context.dedupe.get(params.dedupeKey);
	if (cached) return {
		kind: "cached",
		cached
	};
	const inflightMap = getInflightMap(params.context);
	const inflight = inflightMap.get(params.dedupeKey);
	if (inflight) return {
		kind: "inflight",
		inflight
	};
	return {
		kind: "ready",
		inflightMap
	};
}
function resolveGatewayInflightRequest(params) {
	const idem = params.idempotencyKey;
	const dedupeKey = params.prefix === "message.action" ? `${params.prefix}:${params.conversationReadOrigin ?? "delegated"}:${idem}` : `${params.prefix}:${idem}`;
	const inflight = resolveGatewayInflightMap({
		context: params.context,
		dedupeKey
	});
	if (inflight.kind === "cached") {
		params.respond(inflight.cached.ok, inflight.cached.payload, inflight.cached.error, { cached: true });
		return {
			kind: "handled",
			done: Promise.resolve()
		};
	}
	if (inflight.kind === "inflight") return {
		kind: "handled",
		done: inflight.inflight.then((result) => {
			const meta = result.meta ? {
				...result.meta,
				cached: true
			} : { cached: true };
			params.respond(result.ok, result.payload, result.error, meta);
		})
	};
	return {
		kind: "ready",
		idem,
		dedupeKey,
		inflightMap: inflight.inflightMap
	};
}
async function runGatewayInflightWork(params) {
	params.inflightMap.set(params.dedupeKey, params.work);
	try {
		const result = await params.work;
		params.respond(result.ok, result.payload, result.error, result.meta);
	} finally {
		params.inflightMap.delete(params.dedupeKey);
	}
}
async function resolveRequestedChannel(params) {
	const channelInput = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.requestChannel);
	const normalizedChannel = channelInput ? require_message_channel.normalizeMessageChannel(channelInput) : void 0;
	if (params.rejectWebchatAsInternalOnly && normalizedChannel === "webchat") return { error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unsupported channel: webchat (internal-only). Use `chat.send` for WebChat UI messages or choose a deliverable channel.") };
	if (channelInput && !normalizedChannel) return { error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, params.unsupportedMessage(channelInput)) };
	const sourceCfg = params.context.getRuntimeConfig();
	const cfg = require_runtime_plugin_config.resolveGatewayPluginConfig({ config: sourceCfg });
	let channel = normalizedChannel;
	if (!channel) try {
		channel = (await require_channel_selection.resolveMessageChannelSelection({ cfg })).channel;
	} catch (err) {
		return { error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, String(err)) };
	}
	return {
		cfg,
		sourceCfg,
		channel
	};
}
async function resolveInternalDeliveryChannel(requestChannel, context) {
	const resolvedChannel = await resolveRequestedChannel({
		requestChannel,
		unsupportedMessage: (input) => `unsupported channel: ${input}`,
		context,
		rejectWebchatAsInternalOnly: true
	});
	if ("error" in resolvedChannel) return {
		kind: "failed",
		result: {
			ok: false,
			error: resolvedChannel.error
		}
	};
	return {
		kind: "ready",
		...resolvedChannel
	};
}
function resolveGatewayOutboundTarget(params) {
	const resolved = require_targets.resolveOutboundTarget({
		channel: params.channel,
		to: params.to,
		cfg: params.cfg,
		accountId: params.accountId,
		mode: "explicit"
	});
	if (!resolved.ok) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, String(resolved.error))
	};
	return {
		ok: true,
		to: resolved.to
	};
}
function resolveMessageActionRuntimeConfig(params) {
	const runtimeConfig = require_runtime_snapshot.getRuntimeConfigSnapshot();
	const runtimeSourceConfig = require_runtime_snapshot.getRuntimeConfigSourceSnapshot();
	if (!runtimeConfig || !runtimeSourceConfig) return params.cfg;
	const selected = require_runtime_snapshot.selectApplicableRuntimeConfig({
		inputConfig: params.sourceCfg,
		runtimeConfig,
		runtimeSourceConfig
	});
	if (selected === runtimeConfig && selected !== params.cfg) return require_runtime_plugin_config.resolveGatewayPluginConfig({ config: selected });
	return params.cfg;
}
function buildGatewayDeliveryPayload(params) {
	const payload = {
		runId: params.runId,
		messageId: params.result.messageId,
		channel: params.channel
	};
	if ("chatId" in params.result) payload.chatId = params.result.chatId;
	if ("channelId" in params.result) payload.channelId = params.result.channelId;
	if ("toJid" in params.result) payload.toJid = params.result.toJid;
	if ("conversationId" in params.result) payload.conversationId = params.result.conversationId;
	if ("pollId" in params.result) payload.pollId = params.result.pollId;
	return payload;
}
function cacheGatewayDedupeSuccess(params) {
	params.context.dedupe.set(params.dedupeKey, {
		ts: Date.now(),
		ok: true,
		payload: params.payload
	});
}
function cacheGatewayDedupeFailure(params) {
	params.context.dedupe.set(params.dedupeKey, {
		ts: Date.now(),
		ok: false,
		error: params.error
	});
}
function createGatewayInflightSuccess(params) {
	cacheGatewayDedupeSuccess({
		context: params.context,
		dedupeKey: params.dedupeKey,
		payload: params.payload
	});
	return {
		ok: true,
		payload: params.payload,
		meta: { channel: params.channel }
	};
}
function createGatewayDeliveryInflightSuccess(params) {
	return createGatewayInflightSuccess({
		context: params.context,
		dedupeKey: params.dedupeKey,
		payload: buildGatewayDeliveryPayload({
			runId: params.runId,
			channel: params.channel,
			result: params.result
		}),
		channel: params.channel
	});
}
function createGatewayInflightUnavailableFailure(params) {
	const error = require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(params.err));
	cacheGatewayDedupeFailure({
		context: params.context,
		dedupeKey: params.dedupeKey,
		error
	});
	return {
		ok: false,
		error,
		meta: {
			channel: params.channel,
			error: require_ws_log.formatForLog(params.err)
		}
	};
}
async function mirrorDeliveredSourceReplyToTranscriptBestEffort(params) {
	try {
		if (!await require_source_reply_mirror.mirrorDeliveredSourceReplyToTranscript(params.mirror) && params.mirror.sourceReplyFinal === true) params.context.logGateway?.warn?.("Terminal source reply receipt was not mirrored; restart recovery is fail-closed.", {
			channel: params.mirror.channel,
			sessionKey: params.mirror.sessionKey
		});
	} catch (err) {
		params.context.logGateway?.warn?.("Source reply transcript mirror failed after delivery.", {
			error: require_ws_log.formatForLog(err),
			channel: params.mirror.channel,
			sessionKey: params.mirror.sessionKey
		});
	}
}
const sourceReplyTranscriptMirrorQueue = new require_keyed_async_queue.KeyedAsyncQueue();
function resolveSourceReplyTranscriptMirrorQueueKey(mirror) {
	return mirror.sessionKey?.trim() || "__global__";
}
function scheduleDeliveredSourceReplyTranscriptMirror(params) {
	const queueKey = resolveSourceReplyTranscriptMirrorQueueKey(params.mirror);
	return sourceReplyTranscriptMirrorQueue.enqueue(queueKey, () => mirrorDeliveredSourceReplyToTranscriptBestEffort(params));
}
const sendHandlers = {
	"message.action": async ({ params, respond, context, client }) => {
		const p = params;
		if (!require_src.validateMessageActionParams(p)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid message.action params: ${require_validation_errors.formatValidationErrors(require_src.validateMessageActionParams.errors)}`));
			return;
		}
		const request = p;
		const trustedContext = resolveTrustedMessageActionToolContext({
			client,
			request
		});
		if (!trustedContext.ok) {
			respond(false, void 0, trustedContext.error);
			return;
		}
		const conversationReadOrigin = require_conversation_read_origin.resolveGatewayConversationReadOrigin({
			client,
			requestedOrigin: request.conversationReadOrigin
		});
		const inflight = resolveGatewayInflightRequest({
			context,
			prefix: "message.action",
			idempotencyKey: request.idempotencyKey,
			respond,
			conversationReadOrigin
		});
		if (inflight.kind === "handled") {
			await inflight.done;
			return;
		}
		const { dedupeKey, inflightMap } = inflight;
		await runGatewayInflightWork({
			inflightMap,
			dedupeKey,
			work: (async () => {
				const resolvedChannel = await resolveRequestedChannel({
					requestChannel: request.channel,
					unsupportedMessage: (input) => `unsupported channel: ${input}`,
					context,
					rejectWebchatAsInternalOnly: true
				});
				if ("error" in resolvedChannel) return {
					ok: false,
					error: resolvedChannel.error
				};
				const { cfg: selectedCfg, sourceCfg, channel } = resolvedChannel;
				const cfg = resolveMessageActionRuntimeConfig({
					cfg: selectedCfg,
					sourceCfg
				});
				if (!require_channel_resolution.resolveOutboundChannelPlugin({
					channel,
					cfg
				})?.actions?.handleAction) return {
					ok: false,
					error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Channel ${channel} does not support action ${request.action}.`)
				};
				try {
					const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.sessionKey) ?? void 0;
					const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.agentId) ?? (sessionKey ? require_agent_scope.resolveSessionAgentId({
						sessionKey,
						config: cfg
					}) : void 0);
					const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.accountId) ?? void 0;
					if (request.action === "send") await require_source_reply_mirror.hydrateAttachmentParamsForAction({
						cfg,
						channel,
						accountId,
						args: request.params,
						action: "send",
						mediaPolicy: require_source_reply_mirror.resolveAttachmentMediaPolicy({ mediaLocalRoots: require_local_roots.getAgentScopedMediaLocalRoots(cfg, agentId) })
					});
					const sourceReplyMirror = {
						action: request.action,
						channel,
						actionParams: request.params,
						cfg,
						sessionKey,
						sessionId: trustedContext.sessionId,
						agentId,
						toolContext: trustedContext.toolContext,
						idempotencyKey: request.idempotencyKey,
						toolCallId: trustedContext.sourceReplyToolCallId,
						...trustedContext.sourceReplyFinal !== void 0 ? { sourceReplyFinal: trustedContext.sourceReplyFinal } : {}
					};
					const terminalDeliveryReceipt = trustedContext.sourceReplyFinal === true ? await require_source_reply_mirror.beginTerminalSourceReplyDelivery(sourceReplyMirror) : void 0;
					const gatewayClientScopes = client?.connect?.scopes ?? [];
					const handled = await require_source_reply_mirror.dispatchChannelMessageAction({
						channel,
						action: request.action,
						cfg,
						params: request.params,
						accountId,
						requesterAccountId: trustedContext.requesterAccountId,
						requesterSenderId: trustedContext.requesterSenderId,
						senderIsOwner: gatewayClientScopes.includes("operator.admin") ? request.senderIsOwner === true : false,
						conversationReadOrigin,
						sessionKey,
						sessionId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.sessionId) ?? void 0,
						inboundEventKind: request.inboundTurnKind,
						agentId,
						mediaLocalRoots: require_local_roots.getAgentScopedMediaLocalRoots(cfg, agentId),
						toolContext: trustedContext.toolContext,
						dryRun: false,
						gatewayClientScopes
					});
					if (!handled) {
						await require_source_reply_mirror.cancelTerminalSourceReplyDelivery(terminalDeliveryReceipt);
						const error = require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Message action ${request.action} not supported for channel ${channel}.`);
						cacheGatewayDedupeFailure({
							context,
							dedupeKey,
							error
						});
						return {
							ok: false,
							error,
							meta: { channel }
						};
					}
					const payload = require_source_reply_mirror.extractToolPayload(handled);
					try {
						await require_source_reply_mirror.reconcileTerminalSourceReplyDelivery({
							deliveredPayload: payload,
							mirror: sourceReplyMirror,
							receipt: terminalDeliveryReceipt
						});
					} catch (err) {
						context.logGateway?.warn?.("Terminal source reply receipt reconciliation failed.", {
							error: require_ws_log.formatForLog(err),
							channel,
							sessionKey
						});
					}
					await scheduleDeliveredSourceReplyTranscriptMirror({
						context,
						mirror: {
							...sourceReplyMirror,
							deliveredPayload: payload
						}
					});
					return createGatewayInflightSuccess({
						context,
						dedupeKey,
						payload,
						channel
					});
				} catch (err) {
					return createGatewayInflightUnavailableFailure({
						context,
						dedupeKey,
						channel,
						err
					});
				}
			})(),
			respond
		});
	},
	send: async ({ params, respond, context, client }) => {
		const p = params;
		if (!require_src.validateSendParams(p)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid send params: ${require_validation_errors.formatValidationErrors(require_src.validateSendParams.errors)}`));
			return;
		}
		const request = p;
		const inflight = resolveGatewayInflightRequest({
			context,
			prefix: "send",
			idempotencyKey: request.idempotencyKey,
			respond
		});
		if (inflight.kind === "handled") {
			await inflight.done;
			return;
		}
		const { idem, dedupeKey, inflightMap } = inflight;
		const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.to) ?? "";
		const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.message) ?? "";
		const mediaUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.mediaUrl);
		const mediaUrls = Array.isArray(request.mediaUrls) ? request.mediaUrls.map((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry)).filter((entry) => Boolean(entry)) : void 0;
		const buffer = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(request.buffer);
		if (!message && !mediaUrl && (mediaUrls?.length ?? 0) === 0 && !buffer) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid send params: text or media is required"));
			return;
		}
		const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.accountId);
		const replyToId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.replyToId);
		const threadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.threadId);
		await runGatewayInflightWork({
			inflightMap,
			dedupeKey,
			work: (async () => {
				const resolvedChannel = await resolveInternalDeliveryChannel(request.channel, context);
				if (resolvedChannel.kind !== "ready") return resolvedChannel.result;
				const { cfg, channel } = resolvedChannel;
				const outboundChannel = channel;
				if (!require_channel_resolution.resolveOutboundChannelPlugin({
					channel,
					cfg
				})) return {
					ok: false,
					error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unsupported channel: ${channel}`)
				};
				try {
					const resolvedTarget = resolveGatewayOutboundTarget({
						channel: outboundChannel,
						to,
						cfg,
						accountId
					});
					if (!resolvedTarget.ok) return {
						ok: false,
						error: resolvedTarget.error,
						meta: { channel }
					};
					const idLikeTarget = await require_target_resolver.maybeResolveIdLikeTarget({
						cfg,
						channel,
						input: resolvedTarget.to,
						accountId
					});
					const deliveryTarget = idLikeTarget?.to ?? resolvedTarget.to;
					const providedSessionKey = require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(request.sessionKey) || void 0;
					const explicitAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.agentId);
					const sessionAgentId = providedSessionKey ? require_agent_scope.resolveSessionAgentId({
						sessionKey: providedSessionKey,
						config: cfg
					}) : void 0;
					const defaultAgentId = require_agent_scope.resolveSessionAgentId({ config: cfg });
					const effectiveAgentId = explicitAgentId ?? sessionAgentId ?? defaultAgentId;
					const sendArgs = {
						mediaUrl,
						mediaUrls,
						buffer,
						filename: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.filename) ?? void 0,
						contentType: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.contentType) ?? void 0
					};
					await require_source_reply_mirror.hydrateAttachmentParamsForAction({
						cfg,
						channel,
						accountId,
						args: sendArgs,
						action: "send",
						mediaPolicy: require_source_reply_mirror.resolveAttachmentMediaPolicy({ mediaLocalRoots: require_local_roots.getAgentScopedMediaLocalRoots(cfg, effectiveAgentId) })
					});
					const hydratedMediaUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sendArgs.mediaUrl);
					const hydratedMediaUrls = Array.isArray(sendArgs.mediaUrls) ? sendArgs.mediaUrls.map((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry)).filter((entry) => Boolean(entry)) : void 0;
					const outboundDeps = context.deps ? require_outbound_send_deps.createOutboundSendDeps(context.deps) : void 0;
					const outboundPayloads = [{
						text: message,
						mediaUrl: hydratedMediaUrl,
						mediaUrls: hydratedMediaUrls,
						...request.asVoice === true ? { audioAsVoice: true } : {}
					}];
					const mirrorProjection = require_payloads.projectOutboundPayloadPlanForMirror(require_payloads.createOutboundPayloadPlan(outboundPayloads));
					const mirrorText = mirrorProjection.text;
					const mirrorMediaUrls = mirrorProjection.mediaUrls;
					const derivedRoute = await require_outbound_session.resolveOutboundSessionRoute({
						cfg,
						channel,
						agentId: effectiveAgentId,
						accountId,
						target: deliveryTarget,
						currentSessionKey: providedSessionKey,
						resolvedTarget: idLikeTarget,
						replyToId,
						threadId
					});
					const providedSessionBaseKey = require_session_key.parseThreadSessionSuffix(providedSessionKey).baseSessionKey ?? providedSessionKey;
					const shouldUseDerivedThreadSessionKey = channel === "slack" && Boolean(providedSessionKey) && Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(derivedRoute?.threadId)) && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(derivedRoute?.baseSessionKey) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providedSessionBaseKey) && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(derivedRoute?.sessionKey) !== providedSessionKey;
					const outboundRoute = derivedRoute ? providedSessionKey ? shouldUseDerivedThreadSessionKey ? {
						...derivedRoute,
						baseSessionKey: derivedRoute.baseSessionKey ?? providedSessionKey
					} : {
						...derivedRoute,
						sessionKey: providedSessionKey,
						baseSessionKey: providedSessionKey
					} : derivedRoute : null;
					const outboundSessionKey = outboundRoute?.sessionKey ?? providedSessionKey;
					if (outboundSessionKey && require_store.isAgentHarnessSessionKey(outboundSessionKey)) {
						const { canonicalKey, entry } = require_session_utils.loadSessionEntry(outboundSessionKey);
						const missingHarnessSessionError = require_store.resolveMissingAgentHarnessSessionError(canonicalKey, entry);
						if (missingHarnessSessionError) return {
							ok: false,
							error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, missingHarnessSessionError),
							meta: { channel }
						};
					}
					if (outboundRoute) await require_outbound_session.ensureOutboundSessionEntry({
						cfg,
						channel,
						accountId,
						route: outboundRoute
					});
					const outboundSession = require_session_context.buildOutboundSessionContext({
						cfg,
						agentId: effectiveAgentId,
						sessionKey: outboundSessionKey,
						conversationType: outboundRoute?.chatType
					});
					const send = await require_runtime.sendDurableMessageBatch({
						cfg,
						channel: outboundChannel,
						to: deliveryTarget,
						accountId,
						payloads: outboundPayloads,
						replyToId: replyToId ?? null,
						session: outboundSession,
						gifPlayback: request.gifPlayback,
						forceDocument: request.forceDocument,
						threadId: outboundRoute?.threadId ?? threadId ?? null,
						deps: outboundDeps,
						gatewayClientScopes: client?.connect?.scopes ?? [],
						silent: request.silent,
						formatting: request.parseMode ? { parseMode: request.parseMode } : void 0,
						mirror: outboundSessionKey ? {
							sessionKey: outboundSessionKey,
							agentId: effectiveAgentId,
							text: mirrorText || message,
							mediaUrls: mirrorMediaUrls.length > 0 ? mirrorMediaUrls : void 0,
							idempotencyKey: idem
						} : void 0
					});
					if (send.status === "failed" || send.status === "partial_failed") throw send.error;
					const result = (send.status === "sent" ? send.results : []).at(-1);
					if (!result) throw new Error("No delivery result");
					return createGatewayDeliveryInflightSuccess({
						context,
						dedupeKey,
						runId: idem,
						channel,
						result
					});
				} catch (err) {
					return createGatewayInflightUnavailableFailure({
						context,
						dedupeKey,
						channel,
						err
					});
				}
			})(),
			respond
		});
	},
	poll: async ({ params, respond, context, client }) => {
		const p = params;
		if (!require_src.validatePollParams(p)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid poll params: ${require_validation_errors.formatValidationErrors(require_src.validatePollParams.errors)}`));
			return;
		}
		const request = p;
		const inflight = resolveGatewayInflightRequest({
			context,
			prefix: "poll",
			idempotencyKey: request.idempotencyKey,
			respond
		});
		if (inflight.kind === "handled") {
			await inflight.done;
			return;
		}
		const { idem, dedupeKey, inflightMap } = inflight;
		await runGatewayInflightWork({
			inflightMap,
			dedupeKey,
			work: (async () => {
				const resolvedChannel = await resolveRequestedChannel({
					requestChannel: request.channel,
					unsupportedMessage: (input) => `unsupported poll channel: ${input}`,
					context
				});
				if ("error" in resolvedChannel) return {
					ok: false,
					error: resolvedChannel.error
				};
				const { cfg, channel } = resolvedChannel;
				const outbound = require_channel_resolution.resolveOutboundChannelPlugin({
					channel,
					cfg
				})?.outbound;
				if (typeof request.durationSeconds === "number" && outbound?.supportsPollDurationSeconds !== true) return {
					ok: false,
					error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `durationSeconds is not supported for ${channel} polls`)
				};
				if (typeof request.isAnonymous === "boolean" && outbound?.supportsAnonymousPolls !== true) return {
					ok: false,
					error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `isAnonymous is not supported for ${channel} polls`)
				};
				const poll = {
					question: request.question,
					options: request.options,
					maxSelections: request.maxSelections,
					durationSeconds: request.durationSeconds,
					durationHours: request.durationHours
				};
				const threadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.threadId);
				const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(request.accountId);
				try {
					if (!outbound?.sendPoll) return {
						ok: false,
						error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unsupported poll channel: ${channel}`)
					};
					const resolvedTarget = resolveGatewayOutboundTarget({
						channel,
						to: request.to.trim(),
						cfg,
						accountId
					});
					if (!resolvedTarget.ok) return {
						ok: false,
						error: resolvedTarget.error
					};
					const normalized = outbound.pollMaxOptions ? require_polls.normalizePollInput(poll, { maxOptions: outbound.pollMaxOptions }) : require_polls.normalizePollInput(poll);
					const result = await outbound.sendPoll({
						cfg,
						to: resolvedTarget.to,
						poll: normalized,
						accountId,
						threadId,
						silent: request.silent,
						isAnonymous: request.isAnonymous,
						gatewayClientScopes: client?.connect?.scopes ?? []
					});
					const payload = buildGatewayDeliveryPayload({
						runId: idem,
						channel,
						result
					});
					cacheGatewayDedupeSuccess({
						context,
						dedupeKey,
						payload
					});
					return {
						ok: true,
						payload,
						meta: { channel }
					};
				} catch (err) {
					const error = require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(err));
					cacheGatewayDedupeFailure({
						context,
						dedupeKey,
						error
					});
					return {
						ok: false,
						error,
						meta: {
							channel,
							error: require_ws_log.formatForLog(err)
						}
					};
				}
			})(),
			respond
		});
	}
};
//#endregion
exports.sendHandlers = sendHandlers;
