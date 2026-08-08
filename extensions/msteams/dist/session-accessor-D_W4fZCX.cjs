const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_chat_message_content = require("./chat-message-content-B4NfuhB-.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_openclaw_agent_db = require("./openclaw-agent-db-CMNDs1oU.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
const require_transcript_tree = require("./transcript-tree-0YpOJFJQ.cjs");
const require_session_lifecycle_events = require("./session-lifecycle-events-DldGnQfO.cjs");
const require_transcript_events = require("./transcript-events-C9OOwQkF.cjs");
const require_transcript_only_openclaw_assistant = require("./transcript-only-openclaw-assistant-MDSebHVo.cjs");
const require_provider_attribution = require("./provider-attribution-CIUHVFNx.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let node_async_hooks = require("node:async_hooks");
let node_util = require("node:util");
let kysely = require("kysely");
let _gabrielvfonseca_media_core_inline_image_data_url = require("@gabrielvfonseca/media-core/inline-image-data-url");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/session-store-key.ts
/** Canonicalize an opaque session key into the agent-scoped store namespace. */
function canonicalizeSessionKeyForAgent(agentId, key) {
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key);
	if (lowered === "global" || lowered === "unknown") return lowered;
	const normalized = require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(key);
	if (normalized.startsWith("agent:")) return normalized;
	return `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId)}:${normalized}`;
}
function resolveDefaultStoreAgentId(cfg) {
	return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg));
}
function shouldRemapLegacyDefaultMainAlias(cfg, parsed, options) {
	if ((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) !== "main" || require_agent_scope_config.listAgentIds(cfg).includes("main")) return false;
	const defaultAgentId = resolveDefaultStoreAgentId(cfg);
	if (options?.storeAgentId && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(options.storeAgentId) !== defaultAgentId) return false;
	const rest = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsed.rest);
	const mainKey = require_session_key.normalizeMainKey(cfg.session?.mainKey);
	return rest === "main" || rest === mainKey;
}
function resolveParsedSessionStoreKey(cfg, raw, parsed, options) {
	if (!shouldRemapLegacyDefaultMainAlias(cfg, parsed, options)) return {
		agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId),
		sessionKey: require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(raw)
	};
	const agentId = resolveDefaultStoreAgentId(cfg);
	return {
		agentId,
		sessionKey: `agent:${agentId}:${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsed.rest)}`
	};
}
/** Resolve any incoming session key into the canonical key used in persisted session stores. */
function resolveSessionStoreKey(params) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey) ?? "";
	if (!raw) return raw;
	const rawLower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	if (rawLower === "global" || rawLower === "unknown") return rawLower;
	const parsed = require_session_key.parseAgentSessionKey(raw);
	if (parsed) {
		const resolved = resolveParsedSessionStoreKey(params.cfg, raw, parsed, { storeAgentId: params.storeAgentId });
		const canonical = require_main_session.canonicalizeMainSessionAlias({
			cfg: params.cfg,
			agentId: resolved.agentId,
			sessionKey: resolved.sessionKey
		});
		if (canonical !== resolved.sessionKey) return canonical;
		return resolved.sessionKey;
	}
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	const rawMainKey = require_session_key.normalizeMainKey(params.cfg.session?.mainKey);
	const storeAgentId = params.storeAgentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.storeAgentId) : void 0;
	if (lowered === "main" || lowered === rawMainKey) {
		if (storeAgentId) return require_main_session.resolveAgentMainSessionKey({
			cfg: params.cfg,
			agentId: storeAgentId
		});
		return require_main_session.resolveMainSessionKey(params.cfg);
	}
	return canonicalizeSessionKeyForAgent(storeAgentId ?? resolveDefaultStoreAgentId(params.cfg), raw);
}
/** Resolve the agent that owns a canonical session-store key. */
function resolveSessionStoreAgentId(cfg, canonicalKey) {
	if (canonicalKey === "global" || canonicalKey === "unknown") return resolveDefaultStoreAgentId(cfg);
	const parsed = require_session_key.parseAgentSessionKey(canonicalKey);
	if (parsed?.agentId) return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId);
	return resolveDefaultStoreAgentId(cfg);
}
/** Resolve a session key for lookup inside a specific agent's store. */
function resolveStoredSessionKeyForAgentStore(params) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey) ?? "";
	if (!raw) return raw;
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	if (lowered === "global" || lowered === "unknown") return lowered;
	const key = require_session_key.parseAgentSessionKey(raw) ? raw : canonicalizeSessionKeyForAgent(params.agentId, raw);
	return resolveSessionStoreKey({
		cfg: params.cfg,
		sessionKey: key,
		storeAgentId: params.agentId
	});
}
/** Resolve the owner agent for a stored session key, returning null for global/unknown keys. */
function resolveStoredSessionOwnerAgentId(params) {
	const canonicalKey = resolveStoredSessionKeyForAgentStore(params);
	if (canonicalKey === "global" || canonicalKey === "unknown") return null;
	return resolveSessionStoreAgentId(params.cfg, canonicalKey);
}
/** Canonicalize spawned-by parent references while preserving main-session aliases. */
function canonicalizeSpawnedByForAgent(cfg, agentId, spawnedBy) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(spawnedBy) ?? "";
	if (!raw) return;
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	if (lower === "global" || lower === "unknown") return lower;
	let result;
	const normalized = require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(raw);
	if (normalized.startsWith("agent:")) result = normalized;
	else result = `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId)}:${normalized}`;
	const parsed = require_session_key.parseAgentSessionKey(result);
	return require_main_session.canonicalizeMainSessionAlias({
		cfg,
		agentId: parsed?.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) : agentId,
		sessionKey: result
	});
}
//#endregion
//#region src/config/sessions/internal-session-key.ts
const INTERNAL_SESSION_EFFECTS_SEGMENT = "internal-session-effects";
function normalizeInternalRunId(runId) {
	return `${runId.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 48) || "run"}-${node_crypto.default.createHash("sha256").update(runId).digest("hex").slice(0, 16)}`;
}
/** Resolves the hidden SQLite session identity owned by one internal-effects run. */
function resolveInternalSessionEffectsIdentity(params) {
	const suffix = normalizeInternalRunId(params.runId);
	return {
		sessionId: `${INTERNAL_SESSION_EFFECTS_SEGMENT}-${suffix}`,
		sessionKey: `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId)}:${INTERNAL_SESSION_EFFECTS_SEGMENT}:${suffix}`
	};
}
/** Returns true for SQLite entries that exist only to contain suppressed run effects. */
function isInternalSessionEffectsKey(sessionKey) {
	const parts = sessionKey.split(":");
	return parts.length >= 4 && parts[0] === "agent" && parts[2] === INTERNAL_SESSION_EFFECTS_SEGMENT;
}
//#endregion
//#region src/channels/conversation-label.ts
/**
* Conversation label resolver.
*
* Builds readable labels from inbound context while preserving useful id disambiguators.
*/
function extractConversationId(from) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(from);
	if (!trimmed) return;
	const parts = trimmed.split(":").filter(Boolean);
	return parts.length > 0 ? parts[parts.length - 1] : trimmed;
}
function shouldAppendId(id) {
	if (/^[0-9]+$/.test(id)) return true;
	if (/^[^\s:@]+@[^\s:@]+$/.test(id)) return true;
	return false;
}
/**
* Resolves the most readable conversation label from normalized inbound message context.
*/
function resolveConversationLabel(ctx) {
	const explicit = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.ConversationLabel);
	if (explicit) return explicit;
	const threadLabel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.ThreadLabel);
	if (threadLabel) return threadLabel;
	if (require_chat_type.normalizeChatType(ctx.ChatType) === "direct") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.SenderName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.From);
	const base = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.GroupChannel) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.GroupSubject) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.GroupSpace) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.From) || "";
	if (!base) return;
	const id = extractConversationId(ctx.From);
	if (!id) return base;
	if (!shouldAppendId(id)) return base;
	if (base === id) return base;
	if (base.includes(id)) return base;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(base).includes(" id:")) return base;
	if (base.startsWith("#") || base.startsWith("@")) return base;
	return `${base} id:${id}`;
}
//#endregion
//#region src/config/sessions/group.ts
const getGroupSurfaces = () => /* @__PURE__ */ new Set([...require_message_channel.listDeliverableMessageChannels(), "webchat"]);
function resolveLegacyGroupSessionKey(ctx) {
	for (const plugin of require_registry.listChannelPlugins()) {
		const resolved = plugin.messaging?.resolveLegacyGroupSessionKey?.(ctx);
		if (resolved) return resolved;
	}
	return null;
}
function normalizeGroupLabel(raw) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeHyphenSlug)(raw);
}
function joinOpaqueTail(parts, start) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parts[start]) ? parts.slice(start).join(":") : null;
}
function resolveOriginatingGroupTargetId(params) {
	const target = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.ctx.OriginatingTo ?? params.ctx.To) ?? "";
	if (!target) return null;
	const parts = target.split(":");
	if (parts.length < 2) return null;
	const head = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parts[0]);
	const second = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parts[1]);
	if ((second === "group" || second === "channel") && (head === params.provider || getGroupSurfaces().has(head))) return joinOpaqueTail(parts, 2);
	if (head === params.provider || head === "chat" || head === "room" || head === "group") return joinOpaqueTail(parts, 1);
	if (head === "channel") return joinOpaqueTail(parts, 1);
	return null;
}
function shortenGroupId(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? "";
	if (!trimmed) return "";
	if (trimmed.length <= 14) return trimmed;
	return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}
/**
* Builds a human-readable group/channel title from stored chat metadata.
* Prefers the native channel name (#general) or the chat subject verbatim;
* returns undefined when only opaque route ids are available so callers can
* fall back to the compact token form below.
*/
function buildGroupDisplayTitle(params) {
	const subject = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.subject);
	const groupChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.groupChannel);
	const space = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.space);
	if (groupChannel) {
		const channelLabel = groupChannel.startsWith("#") ? groupChannel : `#${groupChannel}`;
		return space ? `${space} ${channelLabel}` : channelLabel;
	}
	return subject ?? space ?? void 0;
}
/** Builds a compact display label for group sessions from channel metadata or ids. */
function buildGroupDisplayName(params) {
	const providerKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.provider) ?? "group";
	const groupChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.groupChannel);
	const space = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.space);
	const subject = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.subject);
	const detail = (groupChannel && space ? `${space}${groupChannel.startsWith("#") ? "" : "#"}${groupChannel}` : groupChannel || subject || space || "") || "";
	const fallbackId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.id) ?? params.key;
	const rawLabel = detail || fallbackId;
	let token = normalizeGroupLabel(rawLabel);
	if (!token) token = normalizeGroupLabel(shortenGroupId(rawLabel));
	if (!params.groupChannel && token.startsWith("#")) token = token.replace(/^#+/, "");
	if (token && !/^[@#]/.test(token) && !token.startsWith("g-") && !token.includes("#")) token = `g-${token}`;
	return token ? `${providerKey}:${token}` : providerKey;
}
/**
* Resolves channel/group chat context into the persisted group session key.
*
* Provider-prefixed ids use channel-owned normalization, while legacy plugin resolvers remain a
* fallback for older channel surfaces that cannot yet express the generic route shape.
*/
function resolveGroupSessionKey(ctx) {
	const from = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.From) ?? "";
	const chatType = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ctx.ChatType);
	const normalizedChatType = chatType === "channel" ? "channel" : chatType === "group" ? "group" : void 0;
	const legacyResolution = resolveLegacyGroupSessionKey(ctx);
	if (!(normalizedChatType === "group" || normalizedChatType === "channel" || from.includes(":group:") || from.includes(":channel:") || legacyResolution !== null)) return null;
	const providerHint = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ctx.Provider);
	const parts = from.split(":");
	const head = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parts[0]);
	const headIsSurface = head ? getGroupSurfaces().has(head) : false;
	if (!headIsSurface && !providerHint && legacyResolution) return legacyResolution;
	const provider = headIsSurface ? head : providerHint ?? legacyResolution?.channel;
	if (!provider) return null;
	const second = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parts[1]);
	const secondIsKind = second === "group" || second === "channel";
	const kind = secondIsKind ? second : from.includes(":channel:") || normalizedChatType === "channel" ? "channel" : "group";
	const originatingGroupTargetId = !secondIsKind && normalizedChatType ? resolveOriginatingGroupTargetId({
		ctx,
		provider
	}) : null;
	const id = originatingGroupTargetId ? originatingGroupTargetId : headIsSurface ? secondIsKind ? joinOpaqueTail(parts, 2) : joinOpaqueTail(parts, 1) : from;
	if (!id) return null;
	const finalId = require_session_key.normalizeSessionPeerId({
		channel: provider,
		peerKind: kind,
		peerId: id
	});
	if (!finalId) return null;
	return {
		key: `${provider}:${kind}:${finalId}`,
		channel: provider,
		id: finalId,
		chatType: kind === "channel" ? "channel" : "group"
	};
}
//#endregion
//#region src/config/sessions/metadata.ts
function isSystemEventProvider(provider) {
	return provider === "heartbeat" || provider === "cron-event" || provider === "exec-event";
}
const mergeOrigin = (existing, next) => {
	if (!existing && !next) return;
	const merged = existing ? { ...existing } : {};
	const nextProvider = next?.provider;
	const nextIsDeliverableChannel = nextProvider != null && nextProvider !== "webchat" && !require_message_channel_core.isInternalNonDeliveryChannel(nextProvider) && !isSystemEventProvider(nextProvider);
	if (existing != null && nextIsDeliverableChannel && (existing.provider != null && nextProvider !== existing.provider || existing.surface != null && next?.surface != null && next.surface !== existing.surface || existing.accountId != null && next?.accountId != null && next.accountId !== existing.accountId)) {
		delete merged.nativeChannelId;
		delete merged.nativeDirectUserId;
		delete merged.accountId;
		delete merged.threadId;
	}
	if (next?.label) merged.label = next.label;
	if (next?.provider) merged.provider = next.provider;
	if (next?.surface) merged.surface = next.surface;
	if (next?.chatType) merged.chatType = next.chatType;
	if (next?.from) merged.from = next.from;
	if (next?.to) merged.to = next.to;
	if (next?.nativeChannelId) merged.nativeChannelId = next.nativeChannelId;
	if (next?.nativeDirectUserId) merged.nativeDirectUserId = next.nativeDirectUserId;
	if (next?.accountId) merged.accountId = next.accountId;
	if (next?.threadId != null && next.threadId !== "") merged.threadId = next.threadId;
	return Object.keys(merged).length > 0 ? merged : void 0;
};
/** Derives session origin metadata from an inbound message context. */
function deriveSessionOrigin(ctx, opts) {
	if (opts?.skipSystemEventOrigin && isSystemEventProvider(ctx.Provider)) return;
	const label = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolveConversationLabel(ctx));
	const provider = require_message_channel.normalizeMessageChannel(typeof ctx.OriginatingChannel === "string" && ctx.OriginatingChannel || ctx.Surface || ctx.Provider);
	const surface = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ctx.Surface);
	const chatType = require_chat_type.normalizeChatType(ctx.ChatType) ?? void 0;
	const from = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.From);
	const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(typeof ctx.OriginatingTo === "string" ? ctx.OriginatingTo : ctx.To);
	const nativeChannelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.NativeChannelId);
	const nativeDirectUserId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.NativeDirectUserId);
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.AccountId);
	const threadId = ctx.MessageThreadId ?? void 0;
	const origin = {};
	if (label) origin.label = label;
	if (provider) origin.provider = provider;
	if (surface) origin.surface = surface;
	if (chatType) origin.chatType = chatType;
	if (from) origin.from = from;
	if (to) origin.to = to;
	if (nativeChannelId) origin.nativeChannelId = nativeChannelId;
	if (nativeDirectUserId) origin.nativeDirectUserId = nativeDirectUserId;
	if (accountId) origin.accountId = accountId;
	if (threadId != null && threadId !== "") origin.threadId = threadId;
	return Object.keys(origin).length > 0 ? origin : void 0;
}
function snapshotSessionOrigin(entry) {
	if (!entry?.origin) return;
	return { ...entry.origin };
}
function deriveGroupSessionPatch(params) {
	const resolution = params.groupResolution ?? resolveGroupSessionKey(params.ctx);
	if (!resolution?.channel) return null;
	const channel = resolution.channel;
	const subject = params.ctx.GroupSubject?.trim();
	const space = params.ctx.GroupSpace?.trim();
	const explicitChannel = params.ctx.GroupChannel?.trim();
	const subjectLooksChannel = Boolean(subject?.startsWith("#"));
	const normalizedChannel = subjectLooksChannel && resolution.chatType !== "channel" ? require_registry.normalizeChannelId(channel) : null;
	const isChannelProvider = Boolean(normalizedChannel && require_registry.getLoadedChannelPlugin(normalizedChannel)?.capabilities.chatTypes.includes("channel"));
	const nextGroupChannel = explicitChannel ?? (subjectLooksChannel && subject && (resolution.chatType === "channel" || isChannelProvider) ? subject : void 0);
	const nextSubject = nextGroupChannel ? void 0 : subject;
	const patch = {
		chatType: resolution.chatType ?? "group",
		channel,
		groupId: resolution.id
	};
	if (nextSubject) patch.subject = nextSubject;
	if (nextGroupChannel) patch.groupChannel = nextGroupChannel;
	if (space) patch.space = space;
	const displayName = buildGroupDisplayName({
		provider: channel,
		subject: nextSubject ?? params.existing?.subject,
		groupChannel: nextGroupChannel ?? params.existing?.groupChannel,
		space: space ?? params.existing?.space,
		id: resolution.id,
		key: params.sessionKey
	});
	if (displayName) patch.displayName = displayName;
	return patch;
}
function deriveSessionMetaPatch(params) {
	const groupPatch = deriveGroupSessionPatch(params);
	const origin = deriveSessionOrigin(params.ctx, { skipSystemEventOrigin: params.skipSystemEventOrigin });
	if (!groupPatch && !origin) return null;
	const patch = groupPatch ? { ...groupPatch } : {};
	const mergedOrigin = mergeOrigin(params.existing?.origin, origin);
	if (mergedOrigin) patch.origin = mergedOrigin;
	return Object.keys(patch).length > 0 ? patch : null;
}
function removeThreadFromDeliveryContext(context) {
	if (!context || context.threadId == null) return context;
	const next = { ...context };
	delete next.threadId;
	return next;
}
/**
* Derives the last-route/delivery patch for an inbound routing update. Route
* updates must not refresh activity timestamps; idle/daily reset evaluation
* relies on updatedAt from actual session turns (#49515). Shared by the file
* store and the SQLite accessor so both backends apply one routing policy.
*/
function deriveLastRoutePatch(params) {
	const { channel, to, accountId, threadId, ctx, existing } = params;
	const explicitContext = require_delivery_context_shared.normalizeDeliveryContext(params.deliveryContext);
	const inlineContext = require_delivery_context_shared.normalizeDeliveryContext({
		channel,
		to,
		accountId,
		threadId
	});
	const routeContext = require_delivery_context_shared.deliveryContextFromChannelRoute(params.route);
	const mergedInput = require_delivery_context_shared.mergeDeliveryContext(routeContext, require_delivery_context_shared.mergeDeliveryContext(explicitContext, inlineContext));
	const explicitDeliveryContext = params.deliveryContext;
	const explicitThreadValue = (explicitDeliveryContext != null && Object.hasOwn(explicitDeliveryContext, "threadId") ? explicitDeliveryContext.threadId : void 0) ?? (threadId != null && threadId !== "" ? threadId : void 0);
	const merged = require_delivery_context_shared.mergeDeliveryContext(mergedInput, Boolean(routeContext?.channel || routeContext?.to || explicitContext?.channel || explicitContext?.to || inlineContext?.channel || inlineContext?.to) && explicitThreadValue == null ? removeThreadFromDeliveryContext(require_delivery_context_shared.deliveryContextFromSession(existing)) : require_delivery_context_shared.deliveryContextFromSession(existing));
	const normalized = require_delivery_context_shared.normalizeSessionDeliveryFields({
		route: params.route,
		deliveryContext: {
			channel: merged?.channel,
			to: merged?.to,
			accountId: merged?.accountId,
			threadId: merged?.threadId
		}
	});
	const metaPatch = ctx ? deriveSessionMetaPatch({
		ctx,
		sessionKey: params.sessionKey,
		existing,
		groupResolution: params.groupResolution
	}) : null;
	const basePatch = {
		route: normalized.route,
		deliveryContext: normalized.deliveryContext,
		lastChannel: normalized.lastChannel,
		lastTo: normalized.lastTo,
		lastAccountId: normalized.lastAccountId,
		lastThreadId: normalized.lastThreadId
	};
	return metaPatch ? {
		...basePatch,
		...metaPatch
	} : basePatch;
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-normalize.ts
function createFallbackSessionEntry(patch) {
	const now = Date.now();
	return {
		sessionId: patch.sessionId ?? (0, node_crypto.randomUUID)(),
		updatedAt: patch.updatedAt ?? now,
		...patch
	};
}
function normalizeSqliteText(value) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}
function normalizeSqliteChatType(value) {
	if (value === "direct" || value === "group" || value === "channel") return value;
	return null;
}
function normalizeSqliteNumber(value) {
	return typeof value === "bigint" ? Number(value) : value;
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-provenance.ts
function bindSessionEntryProvenance(entry) {
	const hookSource = entry.hookExternalContentSource;
	return {
		session_entry_provenance: 1,
		acp_owned: entry.acp ? 1 : 0,
		plugin_owner_id: typeof entry.pluginOwnerId === "string" && entry.pluginOwnerId.trim() ? entry.pluginOwnerId.trim() : null,
		hook_external_content_source: hookSource === "gmail" || hookSource === "webhook" ? hookSource : null
	};
}
function resolveSessionEntryProvenanceRow(params) {
	const db = require_state_migrations_cron_run_logs.getNodeSqliteKysely(params.database.db);
	const existingRoot = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(params.database.db, db.selectFrom("sessions").select([
		"session_entry_provenance",
		"acp_owned",
		"plugin_owner_id",
		"hook_external_content_source"
	]).where("session_id", "=", params.entry.sessionId));
	const hasTranscript = Boolean(require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(params.database.db, db.selectFrom("transcript_events").select("seq").where("session_id", "=", params.entry.sessionId).limit(1)));
	if (existingRoot?.session_entry_provenance === 0 && (params.previousEntry?.sessionId === params.entry.sessionId || hasTranscript)) return {
		...params.boundSessionRow,
		session_entry_provenance: 0,
		acp_owned: 0,
		plugin_owner_id: null,
		hook_external_content_source: null
	};
	return existingRoot?.session_entry_provenance === 1 ? {
		...params.boundSessionRow,
		acp_owned: existingRoot.acp_owned === 1 ? 1 : params.boundSessionRow.acp_owned,
		plugin_owner_id: params.boundSessionRow.plugin_owner_id ?? existingRoot.plugin_owner_id,
		hook_external_content_source: params.boundSessionRow.hook_external_content_source ?? existingRoot.hook_external_content_source
	} : params.boundSessionRow;
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-scope.ts
const SQLITE_SESSION_SLOW_WRITE_MS = 1e3;
const SQLITE_SESSION_WRITER_QUEUES = /* @__PURE__ */ new Map();
function getSessionKysely(database) {
	return require_state_migrations_cron_run_logs.getNodeSqliteKysely(database);
}
async function runExclusiveSqliteSessionWrite(scope, fn) {
	const storePath = require_openclaw_agent_db.resolveOperatorAgentSqlitePath(toDatabaseOptions(scope));
	const startedAt = Date.now();
	try {
		const result = await require_store.runQueuedStoreWrite({
			queues: SQLITE_SESSION_WRITER_QUEUES,
			storePath,
			label: "runExclusiveSqliteSessionWrite",
			fn
		});
		const elapsedMs = Date.now() - startedAt;
		if (elapsedMs >= SQLITE_SESSION_SLOW_WRITE_MS) require_logger.getChildLogger({ subsystem: "session-sqlite" }).warn("slow SQLite session write", {
			agentId: scope.agentId,
			elapsedMs,
			storePath
		});
		return result;
	} catch (error) {
		require_logger.getChildLogger({ subsystem: "session-sqlite" }).warn("SQLite session write failed", {
			agentId: scope.agentId,
			elapsedMs: Date.now() - startedAt,
			error,
			storePath
		});
		throw error;
	}
}
function resolveSqliteScope(scope) {
	const scopedAgentId = resolveExplicitSqliteAgentId(scope);
	const storeTarget = scope.storePath ? require_targets.resolveSqliteTargetFromSessionStorePath(scope.storePath, { agentId: scopedAgentId }) : void 0;
	const agentId = resolveSqliteAgentId({
		scopedAgentId,
		sessionKey: scope.sessionKey,
		storeAgentId: storeTarget?.agentId,
		useDefaultAgentForUnownedStore: Boolean(storeTarget?.path && !storeTarget.agentId && !scopedAgentId)
	});
	if (!agentId) throw new Error("Cannot resolve SQLite session scope without an agent id");
	return {
		agentId,
		...scope.env ? { env: scope.env } : {},
		...storeTarget ? { path: storeTarget.path } : {},
		sessionKey: normalizeSqliteSessionKey(scope.sessionKey)
	};
}
function resolveSqliteReadScope(scope) {
	const sessionKey = scope.sessionKey ? normalizeSqliteSessionKey(scope.sessionKey) : void 0;
	const scopedAgentId = resolveExplicitSqliteAgentId({
		...scope,
		sessionKey
	});
	const storeTarget = scope.storePath ? require_targets.resolveSqliteTargetFromSessionStorePath(scope.storePath, { agentId: scopedAgentId }) : void 0;
	const agentId = resolveSqliteAgentId({
		scopedAgentId,
		sessionKey,
		storeAgentId: storeTarget?.agentId,
		useDefaultAgentForUnownedStore: Boolean(storeTarget?.path && !storeTarget.agentId && !scopedAgentId)
	});
	if (!agentId) throw new Error("Cannot resolve SQLite transcript read scope without an agent id");
	return {
		agentId,
		...scope.env ? { env: scope.env } : {},
		...storeTarget ? { path: storeTarget.path } : {},
		...sessionKey ? { sessionKey } : {}
	};
}
function resolveExplicitSqliteAgentId(params) {
	return params.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId) : require_session_key.parseAgentSessionKey(params.sessionKey)?.agentId;
}
function resolveSqliteStoreScope(storePath, options = {}) {
	return resolveSqliteScope({
		...options.agentId ? { agentId: options.agentId } : {},
		sessionKey: "",
		storePath
	});
}
function resolveSqliteAgentId(params) {
	const scopedAgentId = params.scopedAgentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.scopedAgentId) : void 0;
	if (scopedAgentId && params.storeAgentId && scopedAgentId !== params.storeAgentId) throw new Error(`SQLite session store path belongs to agent ${params.storeAgentId}; requested agent ${scopedAgentId}.`);
	return scopedAgentId ?? params.storeAgentId ?? (params.sessionKey !== void 0 ? require_session_key.resolveAgentIdFromSessionKey(params.sessionKey) : void 0) ?? (params.useDefaultAgentForUnownedStore ? "main" : void 0);
}
function resolveSqliteTranscriptArchiveDirectory(scope) {
	const databasePath = require_openclaw_agent_db.resolveOperatorAgentSqlitePath(toDatabaseOptions(scope));
	const databaseDir = node_path.default.dirname(databasePath);
	if (node_path.default.basename(databaseDir) !== "agent") return databaseDir;
	return node_path.default.join(node_path.default.dirname(databaseDir), "sessions");
}
function resolveSqliteTranscriptScope(scope) {
	if (!scope.sessionId) throw new Error(`Cannot resolve SQLite transcript scope without a session id: ${scope.sessionKey}`);
	if (!scope.sessionKey) throw new Error(`Cannot resolve SQLite transcript scope without a session key: ${scope.sessionId}`);
	return {
		...resolveSqliteScope({
			...scope,
			sessionKey: scope.sessionKey
		}),
		sessionId: scope.sessionId
	};
}
function resolveSqliteTranscriptReadScope(scope) {
	return {
		...resolveSqliteReadScope(scope),
		sessionId: scope.sessionId
	};
}
function toDatabaseOptions(scope) {
	return {
		agentId: scope.agentId,
		...scope.env ? { env: scope.env } : {},
		...scope.path ? { path: scope.path } : {}
	};
}
function normalizeSqliteSessionKey(sessionKey) {
	return require_store.normalizeStoreSessionKey(sessionKey);
}
function cloneSessionEntry(entry) {
	return structuredClone(entry);
}
function formatSqliteSessionMarkerForScope(scope) {
	return require_sqlite_marker.formatSqliteSessionFileMarker({
		agentId: scope.agentId,
		sessionId: scope.sessionId,
		storePath: scope.path ?? require_openclaw_agent_db.resolveOperatorAgentSqlitePath(toDatabaseOptions(scope))
	});
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-status.ts
function normalizeSqliteStatus(value) {
	return value === "running" || value === "done" || value === "failed" || value === "killed" || value === "timeout" ? value : null;
}
function parseSqliteSessionEntryJson(row) {
	try {
		const parsed = JSON.parse(row.entry_json);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
function readSqliteSessionEntriesByStatus(database, statuses, sessionKeys) {
	const selectedStatuses = [...new Set(statuses)];
	const selectedSessionKeys = sessionKeys ? [...new Set(sessionKeys)] : void 0;
	if (selectedStatuses.length === 0 || selectedSessionKeys?.length === 0) return [];
	let query = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db).selectFrom("session_entries").select([
		"session_key",
		"entry_json",
		"session_id",
		"updated_at"
	]).where("status", "in", selectedStatuses);
	if (selectedSessionKeys) query = query.where("session_key", "in", selectedSessionKeys);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, query).rows.flatMap((row) => {
		const entry = parseSqliteSessionEntryJson(row);
		return entry ? [{
			entry,
			sessionKey: row.session_key
		}] : [];
	}).toSorted((a, b) => a.sessionKey.localeCompare(b.sessionKey));
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-session-row.ts
function normalizeSqliteSessionEntryTimestamp(entry) {
	if (typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt)) return entry;
	const updatedAt = typeof entry.sessionStartedAt === "number" && Number.isFinite(entry.sessionStartedAt) ? entry.sessionStartedAt : Date.now();
	return {
		...entry,
		updatedAt
	};
}
function bindSqliteSessionRoot(params) {
	const updatedAt = Number.isFinite(params.entry.updatedAt) ? params.entry.updatedAt : params.updatedAt;
	return {
		session_id: params.entry.sessionId,
		session_key: params.sessionKey,
		session_scope: resolveSqliteSessionScope(params.entry, params.sessionKey),
		created_at: resolveSqliteSessionCreatedAt(params.entry, updatedAt),
		updated_at: updatedAt,
		...bindSessionEntryProvenance(params.entry),
		started_at: finiteSqliteNumber(params.entry.startedAt),
		ended_at: finiteSqliteNumber(params.entry.endedAt),
		status: normalizeSqliteStatus(params.entry.status),
		chat_type: normalizeSqliteChatType(params.entry.chatType),
		channel: resolveSqliteSessionChannel(params.entry),
		account_id: resolveSqliteSessionAccountId(params.entry),
		primary_conversation_id: null,
		model_provider: normalizeSqliteText(params.entry.modelProvider),
		model: normalizeSqliteText(params.entry.model),
		agent_harness_id: normalizeSqliteText(params.entry.agentHarnessId),
		parent_session_key: normalizeSqliteText(params.entry.parentSessionKey),
		spawned_by: normalizeSqliteText(params.entry.spawnedBy),
		display_name: resolveSqliteSessionDisplayName(params.entry)
	};
}
function resolveSqliteSessionScope(entry, sessionKey) {
	const chatType = normalizeSqliteChatType(entry.chatType);
	const normalizedKey = sessionKey.trim().toLowerCase();
	if (chatType === "direct" && (normalizedKey === "main" || normalizedKey.endsWith(":main"))) return "shared-main";
	if (chatType === "group" || chatType === "channel") return chatType;
	return "conversation";
}
function resolveSqliteSessionCreatedAt(entry, updatedAt) {
	for (const candidate of [
		entry.sessionStartedAt,
		entry.startedAt,
		entry.updatedAt,
		updatedAt
	]) if (typeof candidate === "number" && Number.isFinite(candidate) && candidate >= 0) return candidate;
	return updatedAt;
}
function finiteSqliteNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function resolveSqliteSessionChannel(entry) {
	return normalizeSqliteText(entry.channel) ?? normalizeSqliteText(entry.deliveryContext?.channel) ?? normalizeSqliteText(entry.lastChannel) ?? normalizeSqliteText(entry.origin?.provider);
}
function resolveSqliteSessionAccountId(entry) {
	return normalizeSqliteText(entry.deliveryContext?.accountId) ?? normalizeSqliteText(entry.lastAccountId) ?? normalizeSqliteText(entry.origin?.accountId);
}
function resolveSqliteSessionDisplayName(entry) {
	return normalizeSqliteText(entry.displayName) ?? normalizeSqliteText(entry.label) ?? normalizeSqliteText(entry.subject) ?? normalizeSqliteText(entry.groupId);
}
//#endregion
//#region src/config/sessions/transcript-visible-events.ts
/** Selects the active visible branch while preserving original transcript sequence numbers. */
function selectVisibleTranscriptEventEntries(events) {
	const tree = require_transcript_tree.scanSessionTranscriptTree(events);
	const visiblePath = require_transcript_tree.selectSessionTranscriptTreePathNodes(tree, tree.leafId);
	if (visiblePath.length > 0) return visiblePath.map((node) => ({
		event: node.entry,
		parentId: node.parentId,
		seq: node.index + 1
	}));
	return tree.hasLeafControl ? [] : events.map((event, index) => ({
		event,
		parentId: null,
		seq: index + 1
	}));
}
/** Selects only events on the active visible transcript branch. */
function selectVisibleTranscriptEvents(events) {
	return selectVisibleTranscriptEventEntries(events).map((entry) => entry.event);
}
/** Resolves the parent id that the next active transcript append should use. */
function resolveVisibleTranscriptAppendParentId(events) {
	return require_transcript_tree.scanSessionTranscriptTree(events).appendParentId;
}
//#endregion
//#region src/config/sessions/session-transcript-index.ts
function getIndexKysely(db) {
	return require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
}
function readMessageText(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return;
	const record = message;
	if (record.role !== "user" && record.role !== "assistant") return;
	if (typeof record.content === "string") return record.content.trim() || void 0;
	if (typeof record.text === "string") return record.text.trim() || void 0;
	if (!Array.isArray(record.content)) return;
	const parts = record.content.flatMap((block) => {
		if (!block || typeof block !== "object" || Array.isArray(block)) return [];
		const part = block;
		if (part.type !== "text" && part.type !== "input_text" && part.type !== "output_text") return [];
		return typeof part.text === "string" && part.text.trim() ? [part.text] : [];
	});
	return parts.length > 0 ? parts.join("\n") : void 0;
}
/**
* Extracts the searchable payload from one transcript event. Only user and
* assistant message text is indexed; tool results, reasoning blocks, and
* images stay out of the index by construction.
*/
function extractTranscriptIndexEntry(event, fallbackTimestamp) {
	if (!event || typeof event !== "object" || Array.isArray(event)) return;
	const record = event;
	if (record.type !== "message" || typeof record.id !== "string" || !record.id.trim()) return;
	const message = record.message;
	const role = message?.role;
	if (role !== "user" && role !== "assistant") return;
	const text = readMessageText(message);
	if (!text) return;
	const timestamp = typeof record.timestamp === "number" ? record.timestamp : typeof record.timestamp === "string" ? Date.parse(record.timestamp) : NaN;
	return {
		messageId: record.id.trim(),
		role,
		text,
		timestamp: Number.isFinite(timestamp) ? timestamp : fallbackTimestamp
	};
}
function readWatermark(db, sessionId) {
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, getIndexKysely(db).selectFrom("session_transcript_index_state").select([
		"indexed_seq",
		"leaf_event_id",
		"needs_rebuild"
	]).where("session_id", "=", sessionId));
	if (!row) return;
	return {
		indexedSeq: row.indexed_seq,
		leafEventId: row.leaf_event_id,
		needsRebuild: row.needs_rebuild !== 0
	};
}
function writeWatermark(db, sessionId, watermark, now) {
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getIndexKysely(db).insertInto("session_transcript_index_state").values({
		session_id: sessionId,
		indexed_seq: watermark.indexedSeq,
		leaf_event_id: watermark.leafEventId,
		needs_rebuild: watermark.needsRebuild ? 1 : 0,
		updated_at: now
	}).onConflict((conflict) => conflict.column("session_id").doUpdateSet({
		indexed_seq: watermark.indexedSeq,
		leaf_event_id: watermark.leafEventId,
		needs_rebuild: watermark.needsRebuild ? 1 : 0,
		updated_at: now
	})));
}
function insertFtsRow(db, sessionId, entry) {
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getIndexKysely(db).insertInto("session_transcript_fts").values({
		text: entry.text,
		session_id: sessionId,
		message_id: entry.messageId,
		role: entry.role,
		timestamp: entry.timestamp
	}));
}
function deleteFtsRows(db, sessionId) {
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getIndexKysely(db).deleteFrom("session_transcript_fts").where("session_id", "=", sessionId));
}
/**
* In-transaction append hook. Forward-indexes the event when it
* unambiguously extends the active branch and marks the session for rebuild
* otherwise. Runs inside the same write transaction as the event insert, so
* the index can never lag or tear relative to committed transcript rows.
*/
function indexAppendedTranscriptEventInTransaction(db, params) {
	const watermark = readWatermark(db, params.sessionId);
	if (!watermark) {
		if (params.seq !== 0) return;
		applyForwardIndex(db, params, {
			indexedSeq: -1,
			leafEventId: null,
			needsRebuild: false
		});
		return;
	}
	if (watermark.needsRebuild) return;
	if (params.seq !== watermark.indexedSeq + 1) {
		markSessionTranscriptIndexDirtyInTransaction(db, params.sessionId);
		return;
	}
	if (require_transcript_tree.isSessionTranscriptLeafControl(params.event) || require_transcript_tree.isSessionTranscriptSideAppendEntry(params.event)) {
		markSessionTranscriptIndexDirtyInTransaction(db, params.sessionId);
		return;
	}
	const treeEntry = require_transcript_tree.parseSessionTranscriptTreeEntry(params.event);
	if (treeEntry && treeEntry.parentId !== watermark.leafEventId) {
		markSessionTranscriptIndexDirtyInTransaction(db, params.sessionId);
		return;
	}
	applyForwardIndex(db, params, watermark);
}
function applyForwardIndex(db, params, watermark) {
	const entry = extractTranscriptIndexEntry(params.event, params.createdAt);
	if (entry) insertFtsRow(db, params.sessionId, entry);
	const advancesLeaf = params.eventId !== null && require_transcript_tree.isCanonicalSessionTranscriptEntry(params.event);
	writeWatermark(db, params.sessionId, {
		indexedSeq: params.seq,
		leafEventId: advancesLeaf ? params.eventId : watermark.leafEventId,
		needsRebuild: false
	}, params.createdAt);
}
/** Marks one session for lazy rebuild without touching its FTS rows. */
function markSessionTranscriptIndexDirtyInTransaction(db, sessionId) {
	const now = Date.now();
	const watermark = readWatermark(db, sessionId);
	writeWatermark(db, sessionId, {
		indexedSeq: watermark?.indexedSeq ?? -1,
		leafEventId: watermark?.leafEventId ?? null,
		needsRebuild: true
	}, now);
}
/** In-transaction delete hook: drops index rows alongside transcript rows. */
function deleteSessionTranscriptIndexInTransaction(db, sessionId) {
	deleteFtsRows(db, sessionId);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getIndexKysely(db).deleteFrom("session_transcript_index_state").where("session_id", "=", sessionId));
}
/**
* Rebuilds one session's index from its full event set: drops existing FTS
* rows, indexes the resolved active branch, and resets the watermark to the
* same append parent the accessor's next append will resolve.
*/
function rebuildSessionTranscriptIndexInTransaction(db, sessionId, events, maxSeq) {
	deleteFtsRows(db, sessionId);
	const now = Date.now();
	for (const entry of selectVisibleTranscriptEventEntries(events)) {
		const indexed = extractTranscriptIndexEntry(entry.event, now);
		if (indexed) insertFtsRow(db, sessionId, indexed);
	}
	writeWatermark(db, sessionId, {
		indexedSeq: maxSeq,
		leafEventId: resolveVisibleTranscriptAppendParentId(events),
		needsRebuild: false
	}, now);
}
/**
* Sessions whose index needs reconcile work: flagged rebuilds, transcripts
* that gained rows without index state (doctor imports), and watermarks
* behind the newest row. Ordered for deterministic reconcile passes.
*/
function listSessionsNeedingTranscriptIndexReconcile(db) {
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getIndexKysely(db).selectFrom("sessions").innerJoin("transcript_events as latest", (join) => join.onRef("latest.session_id", "=", "sessions.session_id").on((eb) => eb("latest.seq", "=", eb.selectFrom("transcript_events as candidate").select("candidate.seq").whereRef("candidate.session_id", "=", "sessions.session_id").orderBy("candidate.seq", "desc").limit(1)))).leftJoin("session_transcript_index_state as st", "st.session_id", "sessions.session_id").select("sessions.session_id").where((eb) => eb.or([eb(eb.fn.coalesce("st.needs_rebuild", eb.val(1)), "!=", 0), eb("latest.seq", ">", eb.fn.coalesce("st.indexed_seq", eb.val(-1)))])).orderBy("sessions.session_id")).rows.flatMap((row) => typeof row.session_id === "string" ? [row.session_id] : []);
}
/** Drops index rows for sessions whose transcript rows are gone. */
function deleteOrphanedTranscriptIndexRowsInTransaction(db) {
	const kysely = getIndexKysely(db);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("session_transcript_fts").where("session_id", "not in", kysely.selectFrom("transcript_events").select("session_id").distinct()));
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("session_transcript_index_state").where("session_id", "not in", kysely.selectFrom("transcript_events").select("session_id").distinct()));
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-transcript-state.ts
function ensureTranscriptSessionRoot(database, scope, updatedAt) {
	const db = getSessionKysely(database.db);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("sessions").values({
		session_id: scope.sessionId,
		session_key: scope.sessionKey,
		session_scope: "conversation",
		created_at: updatedAt,
		updated_at: updatedAt
	}).onConflict((conflict) => conflict.column("session_id").doUpdateSet({
		session_key: scope.sessionKey,
		updated_at: updatedAt
	})));
	writeTranscriptSessionRoute(database, {
		sessionId: scope.sessionId,
		sessionKey: scope.sessionKey,
		updatedAt
	});
}
function writeSessionRoute(database, params) {
	const db = getSessionKysely(database.db);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("session_routes").values({
		session_key: params.sessionKey,
		session_id: params.sessionId,
		updated_at: params.updatedAt
	}).onConflict((conflict) => conflict.column("session_key").doUpdateSet({
		session_id: params.sessionId,
		updated_at: params.updatedAt
	})));
}
function writeTranscriptSessionRoute(database, params) {
	const db = getSessionKysely(database.db);
	const existing = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("session_routes").select("session_id").where("session_key", "=", params.sessionKey));
	if (existing && existing.session_id !== params.sessionId) return;
	writeSessionRoute(database, params);
}
function readNextTranscriptSeq(database, sessionId) {
	const db = getSessionKysely(database.db);
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("transcript_events").select((eb) => eb.fn.max("seq").as("max_seq")).where("session_id", "=", sessionId));
	return (row?.max_seq === null || row?.max_seq === void 0 ? -1 : normalizeSqliteNumber(row.max_seq)) + 1;
}
function normalizeTranscriptMutationAtMs(value) {
	const timestamp = Math.floor(value);
	return Number.isFinite(timestamp) && timestamp >= 0 ? timestamp : void 0;
}
function readTranscriptMutationStateInTransaction(database, sessionId) {
	const db = getSessionKysely(database.db);
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("sessions").select(["transcript_observed_at", "transcript_updated_at"]).where("session_id", "=", sessionId));
	return {
		observedAt: row?.transcript_observed_at ?? null,
		updatedAt: row?.transcript_updated_at ?? null
	};
}
function advanceTranscriptMutationAtInTransaction(database, sessionId, value, options = {}) {
	const transcriptUpdatedAt = normalizeTranscriptMutationAtMs(value);
	if (transcriptUpdatedAt === void 0) return;
	const state = readTranscriptMutationStateInTransaction(database, sessionId);
	const next = options.strictly ? Math.max(transcriptUpdatedAt, (state.updatedAt ?? -1) + 1, (state.observedAt ?? -1) + 1) : Math.max(transcriptUpdatedAt, state.updatedAt ?? 0);
	if (state.updatedAt !== null && state.updatedAt >= next) return;
	const db = getSessionKysely(database.db);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.updateTable("sessions").set({ transcript_updated_at: next }).where("session_id", "=", sessionId));
}
function touchTranscriptMutationInTransaction(database, sessionId) {
	const now = normalizeTranscriptMutationAtMs(Date.now());
	if (now !== void 0) advanceTranscriptMutationAtInTransaction(database, sessionId, now, { strictly: true });
}
function deleteSqliteTranscriptEventsInTransaction(database, sessionId) {
	const db = getSessionKysely(database.db);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.deleteFrom("transcript_event_identities").where("session_id", "=", sessionId));
	const result = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.deleteFrom("transcript_events").where("session_id", "=", sessionId));
	deleteSessionTranscriptIndexInTransaction(database.db, sessionId);
	return (result.numAffectedRows ?? 0n) > 0n;
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-entry-store.ts
var SqliteSessionMutationConflictError = class extends Error {
	constructor(operationLabel) {
		super(`SQLite session state changed while preparing ${operationLabel}`);
		this.name = "SqliteSessionMutationConflictError";
	}
};
function readSqliteSessionIdentitySnapshot(database, sessionKeys) {
	const snapshot = /* @__PURE__ */ new Map();
	for (const sessionKey of (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...sessionKeys].map((key) => key.trim()))) {
		const row = readExactSessionEntryRow(database, sessionKey);
		if (row) snapshot.set(sessionKey, cloneSessionEntry(row.entry));
	}
	return snapshot;
}
function createSqliteSessionIdentitySnapshot(rows) {
	return new Map(rows.map((row) => [row.sessionKey, cloneSessionEntry(row.entry)]));
}
function readSessionEntryRow(database, sessionKey) {
	const db = getSessionKysely(database.db);
	const lookupKeys = collectSessionEntryLookupKeys(database, sessionKey);
	if (lookupKeys.length === 0) return;
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("session_entries").selectAll().where("session_key", "in", lookupKeys).orderBy("session_key", "asc")).rows;
	const entries = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const entry = parseSqliteSessionEntryJson(row);
		if (!entry) continue;
		entries.set(row.session_key, {
			entry,
			legacyKeys: [],
			row
		});
	}
	const resolved = require_store.resolveSessionEntryCandidates({
		entries: [...entries].map(([candidateKey, value]) => ({
			entry: value.entry,
			sessionKey: candidateKey
		})),
		sessionKey
	});
	if (!resolved.existing) return;
	const selected = entries.get(resolved.existing.sessionKey);
	return selected ? {
		...selected,
		legacyKeys: resolved.legacyKeys
	} : void 0;
}
function readSqliteSessionEntrySelectionSnapshot(database, sessionKey, exact) {
	return {
		selected: exact ? readExactSessionEntryRow(database, sessionKey) : readSessionEntryRow(database, sessionKey),
		selectedRows: collectSessionEntryLookupKeys(database, sessionKey).toSorted().flatMap((candidateKey) => {
			const row = readExactSessionEntryRow(database, candidateKey);
			return row ? [{
				entry: cloneSessionEntry(row.entry),
				sessionKey: candidateKey
			}] : [];
		})
	};
}
function assertSqliteSessionEntrySelectionUnchanged(expected, current, operationLabel) {
	if (!(expected.selected?.row.session_key === current.selected?.row.session_key && sqliteSessionEntriesEqual(expected.selected?.entry, current.selected?.entry)) || !sqliteSessionSnapshotRowsEqual(expected.selectedRows, current.selectedRows)) throw new SqliteSessionMutationConflictError(operationLabel);
}
function collectSessionEntryLookupKeys(database, sessionKey) {
	const trimmedKey = sessionKey.trim();
	if (!trimmedKey) return [];
	const normalizedKey = require_store.normalizeStoreSessionKey(trimmedKey);
	const lookupKeys = /* @__PURE__ */ new Set([
		trimmedKey,
		normalizedKey,
		...require_store.foldedSessionKeyAliasCandidates(normalizedKey)
	]);
	const db = getSessionKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("session_entries").select("session_key").orderBy("session_key", "asc")).rows;
	for (const row of rows) if (require_store.normalizeStoreSessionKey(row.session_key) === normalizedKey) lookupKeys.add(row.session_key);
	return [...lookupKeys].filter(Boolean);
}
function readExactSessionEntryRow(database, sessionKey) {
	const db = getSessionKysely(database.db);
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("session_entries").selectAll().where("session_key", "=", sessionKey));
	if (!row) return;
	const entry = parseSqliteSessionEntryJson(row);
	return entry ? {
		entry,
		legacyKeys: [],
		row
	} : void 0;
}
function readSqliteSessionEntryStore(database) {
	const db = getSessionKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("session_entries").select(["session_key", "entry_json"]).orderBy("session_key")).rows;
	const store = {};
	for (const row of rows) {
		const entry = parseSqliteSessionEntryJson(row);
		if (entry) store[row.session_key] = entry;
	}
	return store;
}
function readSqliteSessionEntryCount(database) {
	const db = getSessionKysely(database.db);
	const count = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("session_entries").select((eb) => eb.fn.countAll().as("entry_count")))?.entry_count;
	return count === void 0 || count === null ? 0 : normalizeSqliteNumber(count);
}
function resolveSqliteLifecyclePrimaryEntry(database, target) {
	let freshest;
	for (const key of target.storeKeys) {
		const row = readExactSessionEntryRow(database, key.trim());
		if (!row) continue;
		if (!freshest || (row.entry.updatedAt ?? 0) > (freshest.entry.updatedAt ?? 0)) freshest = {
			key,
			entry: row.entry
		};
	}
	return freshest ?? void 0;
}
function readSqliteLifecycleTargetSnapshot(database, target) {
	const normalized = normalizeSqliteLifecycleTarget(target);
	return {
		primary: resolveSqliteLifecyclePrimaryEntry(database, normalized),
		rows: normalized.storeKeys.flatMap((sessionKey) => {
			const row = readExactSessionEntryRow(database, sessionKey);
			return row ? [{
				entry: cloneSessionEntry(row.entry),
				sessionKey
			}] : [];
		})
	};
}
function assertSqliteLifecycleTargetSnapshotUnchanged(expected, current, operationLabel) {
	if (!(expected.primary?.key === current.primary?.key && sqliteSessionEntriesEqual(expected.primary?.entry, current.primary?.entry)) || !sqliteSessionSnapshotRowsEqual(expected.rows, current.rows)) throw new SqliteSessionMutationConflictError(operationLabel);
}
function normalizeSqliteLifecycleTarget(target) {
	const canonicalKey = normalizeSqliteSessionKey(target.canonicalKey);
	return {
		canonicalKey,
		storeKeys: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([canonicalKey, ...target.storeKeys.map(normalizeSqliteSessionKey)])
	};
}
function deleteSqliteSessionEntryRows(database, sessionKey) {
	const db = getSessionKysely(database.db);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.deleteFrom("session_routes").where("session_key", "=", sessionKey));
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.deleteFrom("session_entries").where("session_key", "=", sessionKey));
}
function deleteSqliteLifecycleTargetRows(database, target) {
	for (const sessionKey of (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([target.canonicalKey, ...target.storeKeys])) {
		const trimmed = sessionKey.trim();
		if (trimmed) deleteSqliteSessionEntryRows(database, trimmed);
	}
}
function sqliteSessionEntriesEqual(left, right) {
	if (!left || !right) return left === right;
	return JSON.stringify(left) === JSON.stringify(right);
}
function sqliteSessionSnapshotRowsEqual(left, right) {
	return left.length === right.length && left.every((row, index) => row.sessionKey === right[index]?.sessionKey && sqliteSessionEntriesEqual(row.entry, right[index]?.entry));
}
function sqliteLifecycleTargetMatchesExpectedEntry(database, target, expectedEntry) {
	const current = resolveSqliteLifecyclePrimaryEntry(database, target)?.entry;
	if (!current || !expectedEntry) return current === expectedEntry;
	return sqliteSessionEntriesEqual(current, expectedEntry);
}
function assertSqliteLifecycleTargetUnchanged(database, target, expectedEntry, operation) {
	if (sqliteLifecycleTargetMatchesExpectedEntry(database, target, expectedEntry)) return;
	throw new Error(`SQLite session entry changed before ${operation} lifecycle mutation`);
}
function deleteLegacySessionEntryRows(database, legacyKeys, sessionKey) {
	if (legacyKeys.length === 0) return;
	const db = getSessionKysely(database.db);
	for (const legacyKey of legacyKeys) {
		if (legacyKey === sessionKey) continue;
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.deleteFrom("session_routes").where("session_key", "=", legacyKey));
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.deleteFrom("session_entries").where("session_key", "=", legacyKey));
	}
}
function writeSessionEntry(database, sessionKey, entry) {
	const db = getSessionKysely(database.db);
	const normalizedEntry = normalizeSqliteSessionEntryTimestamp(entry);
	const updatedAt = normalizedEntry.updatedAt;
	const previousEntry = readExactSessionEntryRow(database, sessionKey)?.entry;
	const transcriptObservedAt = readTranscriptMutationStateInTransaction(database, normalizedEntry.sessionId).updatedAt ?? updatedAt;
	const sessionRow = resolveSessionEntryProvenanceRow({
		boundSessionRow: {
			...bindSqliteSessionRoot({
				entry: normalizedEntry,
				sessionKey,
				updatedAt
			}),
			transcript_observed_at: transcriptObservedAt
		},
		database,
		entry: normalizedEntry,
		previousEntry
	});
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("sessions").values(sessionRow).onConflict((conflict) => conflict.column("session_id").doUpdateSet({
		session_key: sessionKey,
		session_scope: sessionRow.session_scope,
		transcript_observed_at: transcriptObservedAt,
		session_entry_provenance: sessionRow.session_entry_provenance,
		acp_owned: sessionRow.acp_owned,
		plugin_owner_id: sessionRow.plugin_owner_id,
		hook_external_content_source: sessionRow.hook_external_content_source,
		updated_at: updatedAt,
		started_at: sessionRow.started_at,
		ended_at: sessionRow.ended_at,
		status: sessionRow.status,
		chat_type: sessionRow.chat_type,
		channel: sessionRow.channel,
		account_id: sessionRow.account_id,
		model_provider: sessionRow.model_provider,
		model: sessionRow.model,
		agent_harness_id: sessionRow.agent_harness_id,
		parent_session_key: sessionRow.parent_session_key,
		spawned_by: sessionRow.spawned_by,
		display_name: sessionRow.display_name
	})));
	writeSessionRoute(database, {
		sessionId: sessionRow.session_id,
		sessionKey,
		updatedAt
	});
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("session_entries").values({
		session_key: sessionKey,
		session_id: normalizedEntry.sessionId,
		entry_json: JSON.stringify(normalizedEntry),
		updated_at: updatedAt,
		status: normalizeSqliteStatus(normalizedEntry.status)
	}).onConflict((conflict) => conflict.column("session_key").doUpdateSet({
		session_id: normalizedEntry.sessionId,
		entry_json: JSON.stringify(normalizedEntry),
		updated_at: updatedAt,
		status: normalizeSqliteStatus(normalizedEntry.status)
	})));
}
/** Resolves the parent fork decision using SQLite transcript rows when totals are stale. */
//#endregion
//#region src/config/sessions/session-accessor.sqlite-history.ts
function listSqliteTranscriptInstancesFromDatabase(params) {
	const db = require_state_migrations_cron_run_logs.getNodeSqliteKysely(params.database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(params.database.db, db.selectFrom("sessions").select([
		"session_id",
		"session_key",
		"transcript_updated_at",
		"session_entry_provenance",
		"acp_owned",
		"plugin_owner_id",
		"hook_external_content_source",
		"parent_session_key",
		"spawned_by",
		"chat_type"
	]).where("transcript_updated_at", "is not", null).orderBy("transcript_updated_at", "desc").orderBy("session_id", "asc")).rows.map((row) => {
		if (isInternalSessionEffectsKey(row.session_key) || row.transcript_updated_at === null) return;
		const updatedAtMs = row.transcript_updated_at;
		const current = params.currentEntries.get(row.session_key);
		const currentIsExact = current?.sessionId === row.session_id;
		const provenanceKnown = row.session_entry_provenance === 1;
		const hookExternalContentSource = row.hook_external_content_source === "gmail" || row.hook_external_content_source === "webhook" ? row.hook_external_content_source : void 0;
		const chatType = row.chat_type === "direct" || row.chat_type === "group" || row.chat_type === "channel" ? row.chat_type : void 0;
		const entry = {
			...currentIsExact && current ? structuredClone(current) : {},
			sessionId: row.session_id,
			sessionFile: require_sqlite_marker.formatSqliteSessionFileMarker({
				agentId: params.agentId,
				sessionId: row.session_id,
				storePath: params.databasePath
			}),
			updatedAt: updatedAtMs,
			...row.parent_session_key ? { parentSessionKey: row.parent_session_key } : {},
			...row.spawned_by ? {
				spawnedBy: row.spawned_by,
				spawnDepth: 1
			} : {},
			...chatType ? { chatType } : {},
			...provenanceKnown && row.plugin_owner_id ? { pluginOwnerId: row.plugin_owner_id } : {},
			...provenanceKnown && hookExternalContentSource ? { hookExternalContentSource } : {}
		};
		return {
			acpOwned: row.acp_owned === 1 || Boolean(currentIsExact && current?.acp),
			entry,
			provenanceKnown,
			sessionId: row.session_id,
			sessionKey: row.session_key,
			updatedAtMs
		};
	}).filter((entry) => entry !== void 0);
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-identity.ts
function toSessionIdentityTarget(entry, sessionKeys) {
	const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.sessionId);
	return {
		...sessionId ? { sessionId } : {},
		sessionKeys
	};
}
function emitCommittedSessionEntryRemoval(sessionKey, entry) {
	require_session_lifecycle_events.emitSessionIdentityMutation({
		kind: "delete",
		previous: toSessionIdentityTarget(entry, [sessionKey])
	});
}
function emitCommittedSessionEntryRemovals(removals) {
	const emittedKeys = /* @__PURE__ */ new Set();
	for (const removal of removals) {
		if (emittedKeys.has(removal.sessionKey)) continue;
		emittedKeys.add(removal.sessionKey);
		emitCommittedSessionEntryRemoval(removal.sessionKey, removal.expectedEntry);
	}
}
function emitCommittedSessionEntryChange(params) {
	const previous = toSessionIdentityTarget(params.previousEntry, [params.previousKey]);
	const current = toSessionIdentityTarget(params.currentEntry, [params.currentKey]);
	const moved = params.previousKey !== params.currentKey;
	if (!moved && previous.sessionId === current.sessionId) return;
	require_session_lifecycle_events.emitSessionIdentityMutation({
		kind: moved ? "move" : "replace",
		previous,
		current
	});
}
function emitCommittedSessionIdentityDiff(previous, current) {
	const currentKeysBySessionId = /* @__PURE__ */ new Map();
	for (const [sessionKey, entry] of current) {
		const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.sessionId);
		if (sessionId) currentKeysBySessionId.set(sessionId, [...currentKeysBySessionId.get(sessionId) ?? [], sessionKey]);
	}
	const movedKeysByCurrentKey = /* @__PURE__ */ new Map();
	const handledPreviousKeys = /* @__PURE__ */ new Set();
	const handledCurrentKeys = /* @__PURE__ */ new Set();
	for (const [sessionKey, entry] of previous) {
		if (current.has(sessionKey)) continue;
		const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.sessionId);
		const currentKeys = sessionId ? currentKeysBySessionId.get(sessionId) : void 0;
		if (currentKeys?.length !== 1) continue;
		const [currentKey] = currentKeys;
		if (!currentKey) continue;
		movedKeysByCurrentKey.set(currentKey, [...movedKeysByCurrentKey.get(currentKey) ?? [], sessionKey]);
		handledPreviousKeys.add(sessionKey);
		handledCurrentKeys.add(currentKey);
	}
	for (const [currentKey, previousKeys] of movedKeysByCurrentKey) {
		const currentEntry = current.get(currentKey);
		if (currentEntry) require_session_lifecycle_events.emitSessionIdentityMutation({
			kind: "move",
			previous: toSessionIdentityTarget(currentEntry, previousKeys),
			current: toSessionIdentityTarget(currentEntry, [currentKey])
		});
	}
	for (const [sessionKey, previousEntry] of previous) {
		const currentEntry = current.get(sessionKey);
		if (currentEntry) {
			handledCurrentKeys.add(sessionKey);
			emitCommittedSessionEntryChange({
				currentEntry,
				currentKey: sessionKey,
				previousEntry,
				previousKey: sessionKey
			});
		} else if (!handledPreviousKeys.has(sessionKey)) emitCommittedSessionEntryRemoval(sessionKey, previousEntry);
	}
	for (const [sessionKey, currentEntry] of current) {
		if (handledCurrentKeys.has(sessionKey)) continue;
		require_session_lifecycle_events.emitSessionIdentityMutation({
			kind: "create",
			previous: { sessionKeys: [] },
			current: toSessionIdentityTarget(currentEntry, [sessionKey])
		});
	}
}
function emitCommittedLifecycleIdentityMutations(params) {
	const removedKeys = new Set(params.removedSessionKeys);
	const previous = new Map(params.projected.removals.filter((removal) => removedKeys.has(removal.sessionKey)).map((removal) => [removal.sessionKey, removal.expectedEntry]));
	const current = /* @__PURE__ */ new Map();
	for (const upsert of params.projected.upsertedEntries) {
		if (!current.has(upsert.sessionKey) && upsert.expectedEntry) previous.set(upsert.sessionKey, upsert.expectedEntry);
		current.set(upsert.sessionKey, upsert.entry);
	}
	emitCommittedSessionIdentityDiff(previous, current);
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-archive.ts
function resolveSqliteTranscriptArchivePath(params) {
	const archiveDirectory = node_path.default.resolve(params.archiveDirectory);
	const archivePath = node_path.default.resolve(archiveDirectory, `${params.sessionId}.jsonl.${params.reason}.${require_paths.formatSessionArchiveTimestamp(params.nowMs)}`);
	if (node_path.default.dirname(archivePath) !== archiveDirectory) throw new Error(`Cannot archive SQLite transcript outside ${archiveDirectory}`);
	return archivePath;
}
function findMatchingSqliteTranscriptArchive(params) {
	let entries;
	try {
		entries = node_fs.default.readdirSync(params.archiveDirectory);
	} catch {
		return null;
	}
	const prefix = `${params.sessionId}.jsonl.${params.reason}.`;
	for (const entry of entries) {
		if (!entry.startsWith(prefix)) continue;
		const archivePath = node_path.default.join(params.archiveDirectory, entry);
		const compressed = entry.endsWith(require_paths.SESSION_ARCHIVE_ZSTD_SUFFIX);
		try {
			const stat = node_fs.default.statSync(archivePath);
			if (!stat.isFile()) continue;
			if (!compressed && stat.size !== Buffer.byteLength(params.content, "utf8")) continue;
			if (require_paths.readSessionArchiveContentSync(archivePath) === params.content) return archivePath;
		} catch {}
	}
	return null;
}
function writeSqliteTranscriptArchive(params) {
	node_fs.default.mkdirSync(params.archiveDirectory, { recursive: true });
	const existing = findMatchingSqliteTranscriptArchive(params);
	if (existing) return existing;
	const encoded = require_paths.encodeSessionArchiveContent(params.content);
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const archivePath = `${resolveSqliteTranscriptArchivePath({
			archiveDirectory: params.archiveDirectory,
			reason: params.reason,
			sessionId: params.sessionId,
			nowMs: Date.now() + attempt
		})}${encoded.suffix}`;
		if (node_fs.default.existsSync(archivePath)) continue;
		const tempPath = `${archivePath}.${(0, node_crypto.randomUUID)()}.tmp`;
		try {
			node_fs.default.writeFileSync(tempPath, encoded.bytes, {
				flag: "wx",
				mode: 384
			});
			fsyncRegularFile(tempPath);
			node_fs.default.renameSync(tempPath, archivePath);
			fsyncDirectory(params.archiveDirectory);
			return archivePath;
		} catch (error) {
			node_fs.default.rmSync(tempPath, { force: true });
			if (error?.code === "EEXIST") continue;
			throw error;
		}
	}
	throw new Error(`Could not create SQLite transcript archive for ${params.sessionId}`);
}
function fsyncRegularFile(filePath) {
	const fd = node_fs.default.openSync(filePath, "r");
	try {
		node_fs.default.fsyncSync(fd);
	} finally {
		node_fs.default.closeSync(fd);
	}
}
function fsyncDirectory(dirPath) {
	let fd;
	try {
		fd = node_fs.default.openSync(dirPath, "r");
		node_fs.default.fsyncSync(fd);
	} catch {} finally {
		if (fd !== void 0) node_fs.default.closeSync(fd);
	}
}
function materializeSqliteSessionStateDeletePlans(plans) {
	return dedupeSqliteSessionStateDeletePlans(plans).map((plan) => {
		const archivedTranscript = plan.archiveTranscript && plan.content.length > 0 ? {
			archivedPath: writeSqliteTranscriptArchive({
				archiveDirectory: plan.archiveDirectory,
				content: plan.content,
				reason: plan.reason,
				sessionId: plan.sessionId
			}),
			sourcePath: node_path.default.join(plan.archiveDirectory, `${plan.sessionId}.jsonl`)
		} : null;
		return Object.assign({}, plan, { archivedTranscript });
	});
}
function dedupeSqliteSessionStateDeletePlans(plans) {
	const deduped = /* @__PURE__ */ new Map();
	for (const plan of plans) {
		const existing = deduped.get(plan.sessionId);
		if (!existing) {
			deduped.set(plan.sessionId, plan);
			continue;
		}
		if (existing.content !== plan.content || existing.reason !== plan.reason) throw new Error(`Conflicting SQLite transcript archive plans for ${plan.sessionId}`);
		if (!existing.archiveTranscript && plan.archiveTranscript) deduped.set(plan.sessionId, {
			...existing,
			archiveTranscript: true
		});
	}
	return [...deduped.values()];
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-disk-budget.ts
function getSessionStateBytes(rowBytes, sessionId) {
	return (rowBytes.transcriptBytesBySessionId.get(sessionId) ?? 0) + (rowBytes.trajectoryBytesBySessionId.get(sessionId) ?? 0);
}
function getEntryUpdatedAt(entry) {
	return entry?.updatedAt ?? Number.NEGATIVE_INFINITY;
}
function enforceSqliteSessionDiskBudget(params) {
	const { maxDiskBytes, highWaterBytes } = params.maintenance;
	if (maxDiskBytes == null || highWaterBytes == null) return null;
	let totalBytes = 0;
	const entryBytesByKey = /* @__PURE__ */ new Map();
	const sessionIdsByKey = /* @__PURE__ */ new Map();
	const sessionIdRefCounts = /* @__PURE__ */ new Map();
	for (const [key, entry] of Object.entries(params.store)) {
		const entryBytes = params.rowBytes.entryBytesByKey.get(key) ?? 0;
		const sessionIds = params.collectStateIds(entry);
		entryBytesByKey.set(key, entryBytes);
		sessionIdsByKey.set(key, sessionIds);
		totalBytes += entryBytes;
		for (const sessionId of sessionIds) sessionIdRefCounts.set(sessionId, (sessionIdRefCounts.get(sessionId) ?? 0) + 1);
	}
	for (const sessionId of sessionIdRefCounts.keys()) totalBytes += getSessionStateBytes(params.rowBytes, sessionId);
	const totalBytesBefore = totalBytes;
	if (totalBytes <= maxDiskBytes) return {
		totalBytesBefore,
		totalBytesAfter: totalBytes,
		removedFiles: 0,
		removedEntries: 0,
		freedBytes: 0,
		maxBytes: maxDiskBytes,
		highWaterBytes,
		overBudget: false
	};
	let removedEntries = 0;
	const keys = Object.keys(params.store).toSorted((left, right) => getEntryUpdatedAt(params.store[left]) - getEntryUpdatedAt(params.store[right]));
	for (const key of keys) {
		if (totalBytes <= highWaterBytes) break;
		const entry = params.store[key];
		if (!entry || require_store.shouldPreserveMaintenanceEntry({
			key,
			entry,
			preserveKeys: params.preserveKeys
		})) continue;
		params.onRemoveEntry?.({
			key,
			entry
		});
		delete params.store[key];
		removedEntries += 1;
		totalBytes -= entryBytesByKey.get(key) ?? 0;
		for (const sessionId of sessionIdsByKey.get(key) ?? []) {
			const nextRefCount = (sessionIdRefCounts.get(sessionId) ?? 0) - 1;
			if (nextRefCount > 0) {
				sessionIdRefCounts.set(sessionId, nextRefCount);
				continue;
			}
			sessionIdRefCounts.delete(sessionId);
			totalBytes -= getSessionStateBytes(params.rowBytes, sessionId);
		}
	}
	return {
		totalBytesBefore,
		totalBytesAfter: totalBytes,
		removedFiles: 0,
		removedEntries,
		freedBytes: Math.max(0, totalBytesBefore - totalBytes),
		maxBytes: maxDiskBytes,
		highWaterBytes,
		overBudget: true
	};
}
//#endregion
//#region src/config/sessions/transcript-jsonl.ts
/** Serializes one JSONL entry and appends the newline terminator. */
function serializeJsonlEntry(entry) {
	return `${serializeJsonlLine(entry)}\n`;
}
function serializeJsonlLine(entry) {
	const serialized = JSON.stringify(entry);
	if (serialized === void 0) throw new TypeError(`serializeJsonlLine: entry of type ${typeof entry} is not JSON-serializable (JSON.stringify returned undefined)`);
	return serialized;
}
function serializeJsonlEntries(jsonlEntries) {
	return serializeJsonlLines(jsonlEntries.map(serializeJsonlLine));
}
function serializeJsonlLines(lines) {
	return lines.length > 0 ? `${lines.join("\n")}\n` : "";
}
function writeJsonlEntriesSync(filePath, entries) {
	const content = serializeJsonlEntries(entries);
	(0, node_fs.writeFileSync)(filePath, content, "utf-8");
	return content;
}
function appendJsonlEntrySync(filePath, entry, options) {
	return appendSerializedJsonlEntrySync(filePath, serializeJsonlEntry(entry), options);
}
function appendSerializedJsonlEntrySync(filePath, serializedEntry, options) {
	const content = options?.prefixNewline ? `\n${serializedEntry}` : serializedEntry;
	(0, node_fs.appendFileSync)(filePath, content, "utf-8");
	return content;
}
async function writeJsonlLines(filePath, lines, options) {
	const content = serializeJsonlLines(lines);
	await node_fs_promises.default.writeFile(filePath, content, {
		encoding: options?.encoding ?? "utf-8",
		...options?.flag ? { flag: options.flag } : {},
		...options?.mode !== void 0 ? { mode: options.mode } : {}
	});
	return content;
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-lifecycle-state.ts
function shouldRemoveSqliteSessionEntry(entry, removal) {
	if (!entry) return false;
	if (removal.expectedEntry !== void 0 && JSON.stringify(entry) !== JSON.stringify(removal.expectedEntry)) return false;
	if (removal.expectedSessionId !== void 0 && entry.sessionId !== removal.expectedSessionId) return false;
	if (removal.expectedLifecycleRevision !== void 0 && entry.lifecycleRevision !== removal.expectedLifecycleRevision) return false;
	if (removal.expectedUpdatedAt !== void 0 && entry.updatedAt !== removal.expectedUpdatedAt) return false;
	return true;
}
function sessionKeySegmentStartsWith(sessionKey, prefix) {
	const firstSeparator = sessionKey.indexOf(":");
	if (firstSeparator < 0) return sessionKey.startsWith(prefix);
	const secondSeparator = sessionKey.indexOf(":", firstSeparator + 1);
	return (secondSeparator < 0 ? sessionKey : sessionKey.slice(secondSeparator + 1)).startsWith(prefix);
}
function readSessionTranscriptUpdatedAt(database, sessionId) {
	const db = getSessionKysely(database.db);
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("transcript_events").select((eb) => eb.fn.max("created_at").as("updated_at")).where("session_id", "=", sessionId));
	if (row?.updated_at === null || row?.updated_at === void 0) return;
	return normalizeSqliteNumber(row.updated_at);
}
function sqliteTranscriptStateIsReclaimable(params) {
	const updatedAt = readSessionTranscriptUpdatedAt(params.database, params.sessionId);
	return updatedAt === void 0 || params.nowMs - updatedAt >= params.orphanTranscriptMinAgeMs;
}
function sqliteTranscriptStateHasMarker(params) {
	const db = getSessionKysely(params.database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(params.database.db, db.selectFrom("transcript_events").select("event_json").where("session_id", "=", params.sessionId).orderBy("seq", "asc")).rows.some((row) => row.event_json.includes(params.transcriptContentMarker));
}
function readReferencedSqliteSessionIds(database) {
	const db = getSessionKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("session_entries").select(["entry_json", "session_id"])).rows;
	const sessionIds = /* @__PURE__ */ new Set();
	for (const row of rows) {
		sessionIds.add(row.session_id);
		const entry = parseSqliteSessionEntryJson(row);
		if (!entry) continue;
		for (const sessionId of collectSqliteSessionStateIdsForEntry(entry)) sessionIds.add(sessionId);
	}
	return sessionIds;
}
function readReferencedSqliteSessionIdsAfterTargetMutation(database, target, nextEntry) {
	const removedKeys = new Set((0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([target.canonicalKey, ...target.storeKeys].map((key) => key.trim())));
	const db = getSessionKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("session_entries").select([
		"entry_json",
		"session_key",
		"session_id"
	])).rows;
	const sessionIds = /* @__PURE__ */ new Set();
	for (const row of rows) {
		if (removedKeys.has(row.session_key)) continue;
		sessionIds.add(row.session_id);
		const entry = parseSqliteSessionEntryJson(row);
		if (!entry) continue;
		for (const sessionId of collectSqliteSessionStateIdsForEntry(entry)) sessionIds.add(sessionId);
	}
	if (nextEntry) for (const sessionId of collectSqliteSessionStateIdsForEntry(nextEntry)) sessionIds.add(sessionId);
	return sessionIds;
}
function readSqliteTranscriptArchiveLines(database, sessionId) {
	const db = getSessionKysely(database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("transcript_events").select("event_json").where("session_id", "=", sessionId).orderBy("seq", "asc")).rows.map((row) => row.event_json);
}
function planSqliteSessionStateDeleteIfUnreferenced(params) {
	if (params.referencedSessionIds.has(params.sessionId)) return null;
	const lines = readSqliteTranscriptArchiveLines(params.database, params.sessionId);
	return {
		archiveDirectory: params.archiveDirectory,
		archiveTranscript: params.archiveTranscript !== false,
		content: serializeJsonlLines(lines),
		hadTranscriptState: readSessionTranscriptUpdatedAt(params.database, params.sessionId) !== void 0,
		reason: params.reason ?? "deleted",
		sessionId: params.sessionId
	};
}
function deleteMaterializedSqliteSessionStatePlans(database, plans) {
	const archivedTranscripts = [];
	const referencedSessionIds = readReferencedSqliteSessionIds(database);
	for (const plan of plans) {
		if (referencedSessionIds.has(plan.sessionId)) continue;
		if (plan.archiveTranscript) {
			if (serializeJsonlLines(readSqliteTranscriptArchiveLines(database, plan.sessionId)) !== plan.content) throw new Error(`SQLite transcript changed before archive deletion for ${plan.sessionId}`);
		}
		deleteSqliteSessionStateRows(database, plan.sessionId);
		if (plan.hadTranscriptState && plan.archivedTranscript) archivedTranscripts.push(plan.archivedTranscript);
	}
	return archivedTranscripts;
}
function planSqliteSessionStateAfterEntryRemoval(params) {
	const referencedSessionIds = params.referencedSessionIds ?? readReferencedSqliteSessionIds(params.database);
	const plans = [];
	for (const sessionId of collectSqliteSessionStateIdsForEntry(params.entry)) {
		const plan = planSqliteSessionStateDeleteIfUnreferenced({
			archiveTranscript: params.archiveTranscript,
			archiveDirectory: params.archiveDirectory,
			database: params.database,
			reason: params.reason,
			referencedSessionIds,
			sessionId
		});
		if (plan) plans.push(plan);
	}
	return plans;
}
async function projectSqliteSessionEntryLifecycleMutation(database, params) {
	const store = readSqliteSessionEntryStore(database);
	const removedEntries = [];
	const changedSessionKeys = /* @__PURE__ */ new Set();
	const projectedRemovals = [];
	for (const removal of params.removals) {
		const sessionKey = removal.sessionKey.trim();
		const entry = sessionKey ? store[sessionKey] : void 0;
		if (!shouldRemoveSqliteSessionEntry(entry, removal)) continue;
		projectedRemovals.push({
			expectedEntry: cloneSessionEntry(entry),
			removal,
			sessionKey
		});
		removedEntries.push({
			archiveTranscript: removal.archiveRemovedTranscript === true,
			entry
		});
		changedSessionKeys.add(sessionKey);
		delete store[sessionKey];
	}
	const upsertedEntries = [];
	for (const upsert of params.upserts) {
		const sessionKey = upsert.sessionKey.trim();
		if (!sessionKey) continue;
		const expectedEntry = store[sessionKey] ? cloneSessionEntry(store[sessionKey]) : void 0;
		const entry = upsert.buildEntry === void 0 ? upsert.entry : await upsert.buildEntry({
			currentEntry: expectedEntry ? cloneSessionEntry(expectedEntry) : void 0,
			sessionKey,
			store
		});
		if (!entry) continue;
		const cloned = cloneSessionEntry(entry);
		store[sessionKey] = cloned;
		changedSessionKeys.add(sessionKey);
		upsertedEntries.push({
			expectedEntry,
			sessionKey,
			entry: cloned
		});
	}
	const referencedSessionIds = collectProjectedReferencedSqliteSessionIds({
		database,
		excludedSessionKeys: changedSessionKeys,
		projectedStore: store
	});
	return {
		deletePlans: removedEntries.flatMap(({ archiveTranscript, entry }) => planSqliteSessionStateAfterEntryRemoval({
			archiveDirectory: params.archiveDirectory,
			archiveTranscript,
			database,
			entry,
			reason: "deleted",
			referencedSessionIds
		})),
		removals: projectedRemovals,
		upsertedEntries
	};
}
function collectReferencedSqliteSessionIdsFromStore(store) {
	const sessionIds = /* @__PURE__ */ new Set();
	for (const entry of Object.values(store)) for (const sessionId of collectSqliteSessionStateIdsForEntry(entry)) sessionIds.add(sessionId);
	return sessionIds;
}
function collectProjectedReferencedSqliteSessionIds(params) {
	const excludedSessionKeys = new Set(params.excludedSessionKeys);
	const db = getSessionKysely(params.database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(params.database.db, db.selectFrom("session_entries").select([
		"entry_json",
		"session_key",
		"session_id"
	])).rows;
	const sessionIds = /* @__PURE__ */ new Set();
	for (const row of rows) {
		if (excludedSessionKeys.has(row.session_key)) continue;
		sessionIds.add(row.session_id);
		const entry = parseSqliteSessionEntryJson(row);
		if (!entry) continue;
		for (const sessionId of collectSqliteSessionStateIdsForEntry(entry)) sessionIds.add(sessionId);
	}
	for (const sessionId of collectReferencedSqliteSessionIdsFromStore(params.projectedStore)) sessionIds.add(sessionId);
	return sessionIds;
}
function collectSqliteSessionStateIdsForEntry(entry) {
	const sessionIds = [];
	const add = (sessionId) => {
		const normalized = sessionId?.trim();
		if (normalized) sessionIds.push(normalized);
	};
	add(entry.sessionId);
	for (const sessionId of entry.usageFamilySessionIds ?? []) add(sessionId);
	for (const checkpoint of entry.compactionCheckpoints ?? []) {
		add(checkpoint.sessionId);
		add(checkpoint.preCompaction.sessionId);
		add(checkpoint.postCompaction.sessionId);
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(sessionIds);
}
function deleteSqliteSessionStateRows(database, sessionId) {
	const db = getSessionKysely(database.db);
	deleteSessionTranscriptIndexInTransaction(database.db, sessionId);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.deleteFrom("sessions").where("session_id", "=", sessionId));
}
function planSqliteOrphanLifecycleTranscriptStateDeletes(params) {
	const db = getSessionKysely(params.database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(params.database.db, db.selectFrom("sessions").select("session_id").orderBy("session_id", "asc")).rows;
	const deletePlans = [];
	for (const row of rows) {
		if (params.referencedSessionIds.has(row.session_id) || params.excludedSessionIds?.has(row.session_id)) continue;
		if (!sqliteTranscriptStateIsReclaimable({
			database: params.database,
			sessionId: row.session_id,
			nowMs: params.nowMs,
			orphanTranscriptMinAgeMs: params.orphanTranscriptMinAgeMs
		}) || !sqliteTranscriptStateHasMarker({
			database: params.database,
			sessionId: row.session_id,
			transcriptContentMarker: params.transcriptContentMarker
		})) continue;
		const plan = planSqliteSessionStateDeleteIfUnreferenced({
			archiveTranscript: params.archiveRemovedEntryTranscripts,
			archiveDirectory: params.archiveDirectory,
			database: params.database,
			reason: "deleted",
			referencedSessionIds: params.referencedSessionIds,
			sessionId: row.session_id
		});
		if (plan) deletePlans.push(plan);
	}
	return deletePlans;
}
function planSqliteSessionLifecycleArtifactCleanup(database, params) {
	const db = getSessionKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("session_entries").select([
		"entry_json",
		"session_key",
		"session_id"
	]).orderBy("session_key", "asc")).rows;
	const removedSessionIds = /* @__PURE__ */ new Set();
	const entries = [];
	const projectedStore = readSqliteSessionEntryStore(database);
	for (const row of rows) {
		if (!sessionKeySegmentStartsWith(row.session_key, params.sessionKeySegmentPrefix)) continue;
		if (!sqliteTranscriptStateIsReclaimable({
			database,
			sessionId: row.session_id,
			nowMs: params.nowMs,
			orphanTranscriptMinAgeMs: params.orphanTranscriptMinAgeMs
		})) continue;
		const entry = parseSqliteSessionEntryJson(row);
		for (const sessionId of entry ? collectSqliteSessionStateIdsForEntry(entry) : [row.session_id]) removedSessionIds.add(sessionId);
		entries.push({
			expectedEntry: entry ? cloneSessionEntry(entry) : void 0,
			sessionKey: row.session_key
		});
		delete projectedStore[row.session_key];
	}
	const referencedSessionIds = collectProjectedReferencedSqliteSessionIds({
		database,
		excludedSessionKeys: entries.map((entry) => entry.sessionKey),
		projectedStore
	});
	const deletePlans = [];
	for (const sessionId of removedSessionIds) {
		const plan = planSqliteSessionStateDeleteIfUnreferenced({
			archiveTranscript: params.archiveRemovedEntryTranscripts,
			archiveDirectory: params.archiveDirectory,
			database,
			referencedSessionIds,
			sessionId
		});
		if (plan) deletePlans.push(plan);
	}
	deletePlans.push(...planSqliteOrphanLifecycleTranscriptStateDeletes({
		archiveRemovedEntryTranscripts: params.archiveRemovedEntryTranscripts,
		archiveDirectory: params.archiveDirectory,
		database,
		excludedSessionIds: removedSessionIds,
		referencedSessionIds,
		transcriptContentMarker: params.transcriptContentMarker,
		orphanTranscriptMinAgeMs: params.orphanTranscriptMinAgeMs,
		nowMs: params.nowMs
	}));
	return {
		deletePlans,
		entries
	};
}
function deletePlannedSqliteLifecycleArtifactEntries(database, entries) {
	let removedEntries = 0;
	for (const planned of entries) {
		const current = readExactSessionEntryRow(database, planned.sessionKey)?.entry;
		if (!sqliteSessionEntriesEqual(current, planned.expectedEntry)) throw new Error(`SQLite lifecycle cleanup entry changed for ${planned.sessionKey}`);
		deleteSqliteSessionEntryRows(database, planned.sessionKey);
		removedEntries += 1;
	}
	return removedEntries;
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-maintenance.ts
function collectSqliteSessionMaintenanceBaseKeys(store, activeSessionKey) {
	const keys = [];
	const seen = /* @__PURE__ */ new Set();
	let currentKey = require_store.normalizeStoreSessionKey(activeSessionKey);
	while (currentKey && !seen.has(currentKey)) {
		seen.add(currentKey);
		keys.push(currentKey);
		currentKey = require_store.normalizeStoreSessionKey(store[currentKey]?.parentSessionKey ?? "");
	}
	return keys;
}
function sumEventJsonBytes() {
	return kysely.sql`COALESCE(SUM(length(CAST(event_json AS BLOB))), 0)`.as("event_json_bytes");
}
function sumSessionEntryJsonBytes() {
	return kysely.sql`COALESCE(SUM(length(CAST(entry_json AS BLOB))), 0)`.as("entry_json_bytes");
}
function readSqliteSessionRowBytes(database) {
	const db = getSessionKysely(database.db);
	const entryRows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("session_entries").select(["session_key", "entry_json"])).rows;
	const transcriptRows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("transcript_events").select(["session_id"]).select(sumEventJsonBytes()).groupBy("session_id")).rows;
	const trajectoryRows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("trajectory_runtime_events").select(["session_id"]).select(sumEventJsonBytes()).groupBy("session_id")).rows;
	const entryBytesByKey = /* @__PURE__ */ new Map();
	for (const row of entryRows) entryBytesByKey.set(row.session_key, Buffer.byteLength(row.entry_json, "utf8"));
	const transcriptBytesBySessionId = /* @__PURE__ */ new Map();
	for (const row of transcriptRows) {
		const bytes = row.event_json_bytes;
		transcriptBytesBySessionId.set(row.session_id, normalizeSqliteNumber(bytes ?? 0));
	}
	const trajectoryBytesBySessionId = /* @__PURE__ */ new Map();
	for (const row of trajectoryRows) {
		const bytes = row.event_json_bytes;
		trajectoryBytesBySessionId.set(row.session_id, normalizeSqliteNumber(bytes ?? 0));
	}
	return {
		entryBytesByKey,
		trajectoryBytesBySessionId,
		transcriptBytesBySessionId
	};
}
function hasSqliteSessionDiskBudgetOverflow(database, maintenance) {
	if (maintenance.maxDiskBytes == null || maintenance.highWaterBytes == null) return false;
	const db = getSessionKysely(database.db);
	const entryRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("session_entries").select(sumSessionEntryJsonBytes()));
	const transcriptRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("transcript_events").select(sumEventJsonBytes()));
	const trajectoryRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("trajectory_runtime_events").select(sumEventJsonBytes()));
	const entryBytes = normalizeSqliteNumber(entryRow?.entry_json_bytes ?? 0);
	const transcriptBytes = normalizeSqliteNumber(transcriptRow?.event_json_bytes ?? 0);
	const trajectoryBytes = normalizeSqliteNumber(trajectoryRow?.event_json_bytes ?? 0);
	return entryBytes + transcriptBytes + trajectoryBytes > maintenance.maxDiskBytes;
}
function applySqliteSessionDiskBudget(params) {
	enforceSqliteSessionDiskBudgetInStore({
		database: params.database,
		store: params.store,
		maintenance: params.maintenance,
		preserveKeys: params.preserveKeys,
		onRemoveEntry: params.rememberRemovedEntry
	});
}
function enforceSqliteSessionDiskBudgetInStore(params) {
	return enforceSqliteSessionDiskBudget({
		collectStateIds: collectSqliteSessionStateIdsForEntry,
		maintenance: params.maintenance,
		onRemoveEntry: params.onRemoveEntry,
		preserveKeys: params.preserveKeys,
		rowBytes: readSqliteSessionRowBytes(params.database),
		store: params.store
	});
}
function previewSqliteSessionDiskBudget(params) {
	const removedKeys = /* @__PURE__ */ new Set();
	if (params.maintenance.maxDiskBytes == null || params.maintenance.highWaterBytes == null) return {
		diskBudget: null,
		removedKeys
	};
	const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolveSqliteScope({
		...params.agentId ? { agentId: params.agentId } : {},
		sessionKey: "",
		storePath: params.storePath
	})));
	const baseKeys = collectSqliteSessionMaintenanceBaseKeys(params.store, params.activeSessionKey ?? "");
	const preserveKeys = baseKeys.length > 0 || params.preserveKeys ? /* @__PURE__ */ new Set([...params.preserveKeys ?? [], ...baseKeys]) : void 0;
	return {
		diskBudget: enforceSqliteSessionDiskBudgetInStore({
			database,
			store: params.store,
			maintenance: params.maintenance,
			preserveKeys,
			onRemoveEntry: ({ key }) => {
				removedKeys.add(key);
			}
		}),
		removedKeys
	};
}
function hasStaleSqliteSessionEntryCandidate(database, pruneAfterMs, preserveKeys) {
	const cutoffMs = Date.now() - pruneAfterMs;
	const db = getSessionKysely(database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("session_entries").select("session_key").where("updated_at", "<", cutoffMs).orderBy("updated_at", "asc")).rows.some((row) => !preserveKeys?.has(require_store.normalizeStoreSessionKey(row.session_key)));
}
function applySqliteSessionEntryMaintenance(database, params) {
	if (params.skipMaintenance) return {
		entryRemovals: [],
		stateDeletePlans: []
	};
	const maintenance = params.maintenanceConfig ?? require_store.resolveMaintenanceConfig();
	if (maintenance.mode === "warn") return {
		entryRemovals: [],
		stateDeletePlans: []
	};
	const entryCount = readSqliteSessionEntryCount(database);
	const preserveCandidateKeys = require_store.collectSessionMaintenancePreserveKeys([params.activeSessionKey]);
	const hasStaleCandidate = hasStaleSqliteSessionEntryCandidate(database, maintenance.pruneAfterMs, preserveCandidateKeys);
	const hasDiskBudgetOverflow = hasSqliteSessionDiskBudgetOverflow(database, maintenance);
	if (!(params.forceMaintenance === true || entryCount > maintenance.maxEntries || hasStaleCandidate || hasDiskBudgetOverflow || require_store.shouldRunModelRunPrune({
		maintenance,
		entryCount,
		force: params.forceMaintenance
	}) || require_store.shouldRunSessionEntryMaintenance({
		entryCount,
		maxEntries: maintenance.maxEntries,
		force: params.forceMaintenance
	}))) return {
		entryRemovals: [],
		stateDeletePlans: []
	};
	const db = getSessionKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("session_entries").select(["session_key", "entry_json"]).orderBy("session_key")).rows;
	const store = {};
	for (const row of rows) {
		const entry = parseSqliteSessionEntryJson(row);
		if (entry) store[row.session_key] = entry;
	}
	const removedKeys = /* @__PURE__ */ new Set();
	const removedEntriesByKey = /* @__PURE__ */ new Map();
	const removedSessionIds = /* @__PURE__ */ new Set();
	const rememberRemovedEntry = (removed) => {
		removedKeys.add(removed.key);
		removedEntriesByKey.set(removed.key, cloneSessionEntry(removed.entry));
		for (const sessionId of collectSqliteSessionStateIdsForEntry(removed.entry)) removedSessionIds.add(sessionId);
	};
	const preserveKeys = require_store.collectSessionMaintenancePreserveKeys(collectSqliteSessionMaintenanceBaseKeys(store, params.activeSessionKey)) ?? /* @__PURE__ */ new Set();
	if (require_store.shouldRunModelRunPrune({
		maintenance,
		entryCount: Object.keys(store).length,
		force: params.forceMaintenance
	})) require_store.pruneStaleModelRunEntries(store, maintenance.modelRunPruneAfterMs, {
		log: false,
		onPruned: rememberRemovedEntry,
		preserveKeys
	});
	if (params.forceMaintenance === true || hasStaleCandidate || Object.keys(store).length > maintenance.maxEntries) require_store.pruneStaleEntries(store, maintenance.pruneAfterMs, {
		log: false,
		onPruned: rememberRemovedEntry,
		preserveKeys
	});
	if (require_store.shouldRunSessionEntryMaintenance({
		entryCount: Object.keys(store).length,
		maxEntries: maintenance.maxEntries,
		force: params.forceMaintenance
	})) require_store.capEntryCount(store, maintenance.maxEntries, {
		log: false,
		onCapped: rememberRemovedEntry,
		preserveKeys
	});
	applySqliteSessionDiskBudget({
		database,
		store,
		maintenance,
		preserveKeys,
		rememberRemovedEntry
	});
	const referencedSessionIds = collectProjectedReferencedSqliteSessionIds({
		database,
		excludedSessionKeys: removedKeys,
		projectedStore: store
	});
	const deletePlans = [];
	for (const sessionId of removedSessionIds) {
		const plan = planSqliteSessionStateDeleteIfUnreferenced({
			archiveTranscript: true,
			archiveDirectory: params.archiveDirectory,
			database,
			referencedSessionIds,
			sessionId
		});
		if (plan) deletePlans.push(plan);
	}
	return {
		entryRemovals: [...removedKeys].map((sessionKey) => ({
			expectedEntry: removedEntriesByKey.get(sessionKey),
			sessionKey
		})),
		stateDeletePlans: deletePlans
	};
}
function finalizeSqliteSessionEntryMaintenancePlansBestEffort(scope, plans) {
	const entryRemovals = plans.flatMap((plan) => plan.entryRemovals);
	const stateDeletePlans = plans.flatMap((plan) => plan.stateDeletePlans);
	if (entryRemovals.length === 0 && stateDeletePlans.length === 0) return [];
	try {
		const materializedPlans = materializeSqliteSessionStateDeletePlans(stateDeletePlans);
		let archivedTranscripts = [];
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
			deletePlannedSqliteLifecycleArtifactEntries(database, entryRemovals);
			archivedTranscripts = deleteMaterializedSqliteSessionStatePlans(database, materializedPlans);
		}, toDatabaseOptions(scope));
		emitCommittedSessionEntryRemovals(entryRemovals);
		return archivedTranscripts;
	} catch (error) {
		require_logger.getChildLogger({ subsystem: "session-sqlite" }).warn("SQLite session maintenance cleanup failed", {
			agentId: scope.agentId,
			error,
			path: scope.path,
			sessionIds: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(stateDeletePlans.map((plan) => plan.sessionId))
		});
		return [];
	}
}
//#endregion
//#region src/config/sessions/session-entry-lineage.ts
function preserveSqliteSameKeySessionRolloverLineage(params) {
	const previousSessionId = params.previous.sessionId.trim();
	const nextSessionId = params.next.sessionId.trim();
	if (!previousSessionId || !nextSessionId || previousSessionId === nextSessionId) return params.next;
	return {
		...params.next,
		usageFamilyKey: params.next.usageFamilyKey ?? params.previous.usageFamilyKey ?? params.sessionKey,
		usageFamilySessionIds: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([
			...params.previous.usageFamilySessionIds ?? [],
			previousSessionId,
			...params.next.usageFamilySessionIds ?? [],
			nextSessionId
		])
	};
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-entry.ts
/** Loads one session entry from the additive SQLite session store. */
function loadSqliteSessionEntry(scope) {
	const resolved = resolveSqliteScope(scope);
	return readSessionEntryRow(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)), resolved.sessionKey)?.entry;
}
/** Loads one exact persisted-key entry from the additive SQLite session store. */
function loadExactSqliteSessionEntry(scope) {
	const sessionKey = scope.sessionKey.trim();
	if (!sessionKey) return;
	const row = readExactSessionEntryRow(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolveSqliteScope(scope))), sessionKey);
	return row ? {
		sessionKey,
		entry: row.entry
	} : void 0;
}
/** Resolves the persisted session key for a SQLite transcript session id. */
function resolveSqliteSessionKeyBySessionId(scope) {
	const resolved = resolveSqliteTranscriptReadScope(scope);
	const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved));
	const db = getSessionKysely(database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("sessions").select("session_key").where("session_id", "=", resolved.sessionId).limit(1))?.session_key;
}
/** Lists session entries from the additive SQLite session store. */
function listSqliteSessionEntries(scope = {}) {
	const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolveSqliteScope({
		...scope,
		sessionKey: ""
	})));
	const db = getSessionKysely(database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("session_entries").select([
		"session_key",
		"entry_json",
		"session_id",
		"updated_at"
	]).orderBy("session_key", "asc")).rows.map((row) => {
		if (isInternalSessionEffectsKey(row.session_key)) return;
		const entry = parseSqliteSessionEntryJson(row);
		return entry ? {
			sessionKey: row.session_key,
			entry
		} : void 0;
	}).filter((entry) => entry !== void 0);
}
/** Lists only entries whose normalized session row has one of the requested statuses. */
function listSqliteSessionEntriesByStatus(scope, statuses) {
	return readSqliteSessionEntriesByStatus(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolveSqliteScope({
		...scope,
		sessionKey: ""
	}))), statuses).filter(({ sessionKey }) => !isInternalSessionEffectsKey(sessionKey));
}
/** Lists transcript-bearing SQLite sessions, including retained rows from session-id rotation. */
function listSqliteSessionTranscriptInstances(scope = {}) {
	const resolved = resolveSqliteScope({
		...scope,
		sessionKey: ""
	});
	const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved));
	const currentEntries = new Map(listSqliteSessionEntries(scope).map((summary) => [summary.sessionKey, summary.entry]));
	return listSqliteTranscriptInstancesFromDatabase({
		agentId: resolved.agentId,
		currentEntries,
		database,
		databasePath: require_openclaw_agent_db.resolveOperatorAgentSqlitePath(toDatabaseOptions(resolved))
	});
}
/** Reads a session activity timestamp from the additive SQLite session store. */
function readSqliteSessionUpdatedAt(scope) {
	const resolved = resolveSqliteScope(scope);
	const row = readSessionEntryRow(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)), resolved.sessionKey)?.row;
	return row ? normalizeSqliteNumber(row.updated_at) : void 0;
}
/** Applies a partial entry update to the additive SQLite session store. */
async function upsertSqliteSessionEntry(scope, patch) {
	return await patchSqliteSessionEntry(scope, () => patch, { fallbackEntry: createFallbackSessionEntry(patch) });
}
/** Replaces one entry in the additive SQLite session store. */
async function replaceSqliteSessionEntry(scope, entry) {
	return await patchSqliteSessionEntry(scope, () => entry, {
		fallbackEntry: entry,
		replaceEntry: true
	});
}
/** Replaces one entry synchronously for sync session runtimes. */
function replaceSqliteSessionEntrySync(scope, entry) {
	const resolved = resolveSqliteScope(scope);
	let previous = /* @__PURE__ */ new Map();
	let current = /* @__PURE__ */ new Map();
	require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
		const identityKeys = collectSessionEntryLookupKeys(database, resolved.sessionKey);
		previous = readSqliteSessionIdentitySnapshot(database, identityKeys);
		writeSessionEntry(database, resolved.sessionKey, entry);
		current = readSqliteSessionIdentitySnapshot(database, identityKeys);
	}, toDatabaseOptions(resolved));
	emitCommittedSessionIdentityDiff(previous, current);
}
/** Patches one entry in the additive SQLite session store. */
async function patchSqliteSessionEntry(scope, update, options = {}) {
	const resolved = resolveSqliteScope(scope);
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const prepared = readSqliteSessionEntrySelectionSnapshot(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)), resolved.sessionKey, options.replaceEntry === true);
		const writeBase = prepared.selected?.entry ?? options.fallbackEntry;
		if (!writeBase) return null;
		const patch = await update(cloneSessionEntry(writeBase), { existingEntry: prepared.selected?.entry ? cloneSessionEntry(prepared.selected.entry) : void 0 });
		const maintenancePlans = [];
		let result = null;
		let previousIdentity = /* @__PURE__ */ new Map();
		let currentIdentity = /* @__PURE__ */ new Map();
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((writeDatabase) => {
			const fresh = readSqliteSessionEntrySelectionSnapshot(writeDatabase, resolved.sessionKey, options.replaceEntry === true);
			assertSqliteSessionEntrySelectionUnchanged(prepared, fresh, "session-entry.patch");
			if (!patch) {
				result = cloneSessionEntry(writeBase);
				return;
			}
			const identityKeys = [resolved.sessionKey, ...fresh.selectedRows.map((row) => row.sessionKey)];
			previousIdentity = createSqliteSessionIdentitySnapshot(fresh.selectedRows);
			const merged = options.replaceEntry ? cloneSessionEntry(patch) : options.preserveActivity ? require_store.mergeSessionEntryPreserveActivity(writeBase, patch) : require_store.mergeSessionEntry(writeBase, patch);
			const next = options.replaceEntry ? merged : preserveSqliteSameKeySessionRolloverLineage({
				next: merged,
				previous: writeBase,
				sessionKey: resolved.sessionKey
			});
			writeSessionEntry(writeDatabase, resolved.sessionKey, next);
			deleteLegacySessionEntryRows(writeDatabase, fresh.selected?.legacyKeys ?? [], resolved.sessionKey);
			maintenancePlans.push(applySqliteSessionEntryMaintenance(writeDatabase, {
				activeSessionKey: resolved.sessionKey,
				archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
				maintenanceConfig: options.maintenanceConfig,
				skipMaintenance: options.skipMaintenance
			}));
			currentIdentity = readSqliteSessionIdentitySnapshot(writeDatabase, identityKeys);
			result = cloneSessionEntry(next);
		}, toDatabaseOptions(resolved));
		emitCommittedSessionIdentityDiff(previousIdentity, currentIdentity);
		finalizeSqliteSessionEntryMaintenancePlansBestEffort(resolved, maintenancePlans);
		return result;
	});
}
/** Patches one logical entry selected from a canonical key and alias set. */
async function patchSqliteSessionEntryTarget(scope, update, options = {}) {
	const resolved = resolveSqliteStoreScope(scope.storePath, { agentId: scope.agentId });
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const prepared = readSqliteLifecycleTargetSnapshot(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)), scope.target);
		const writeBase = prepared.primary?.entry ?? options.fallbackEntry;
		if (!writeBase) return null;
		const patch = await update(cloneSessionEntry(writeBase), { existingEntry: prepared.primary?.entry ? cloneSessionEntry(prepared.primary.entry) : void 0 });
		const maintenancePlans = [];
		let result = null;
		let previousIdentity = /* @__PURE__ */ new Map();
		let currentIdentity = /* @__PURE__ */ new Map();
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((writeDatabase) => {
			const fresh = readSqliteLifecycleTargetSnapshot(writeDatabase, scope.target);
			assertSqliteLifecycleTargetSnapshotUnchanged(prepared, fresh, "session-entry-target.patch");
			if (!patch) {
				result = cloneSessionEntry(writeBase);
				return;
			}
			const identityKeys = [
				scope.target.canonicalKey,
				...scope.target.storeKeys,
				...fresh.rows.map((row) => row.sessionKey)
			];
			previousIdentity = createSqliteSessionIdentitySnapshot(fresh.rows);
			const merged = options.replaceEntry ? cloneSessionEntry(patch) : options.preserveActivity ? require_store.mergeSessionEntryPreserveActivity(writeBase, patch) : require_store.mergeSessionEntry(writeBase, patch);
			const next = options.replaceEntry ? merged : preserveSqliteSameKeySessionRolloverLineage({
				next: merged,
				previous: writeBase,
				sessionKey: scope.target.canonicalKey
			});
			deleteSqliteLifecycleTargetRows(writeDatabase, scope.target);
			writeSessionEntry(writeDatabase, scope.target.canonicalKey, next);
			maintenancePlans.push(applySqliteSessionEntryMaintenance(writeDatabase, {
				activeSessionKey: scope.target.canonicalKey,
				archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
				maintenanceConfig: options.maintenanceConfig,
				skipMaintenance: options.skipMaintenance
			}));
			currentIdentity = readSqliteSessionIdentitySnapshot(writeDatabase, identityKeys);
			result = cloneSessionEntry(next);
		}, toDatabaseOptions(resolved));
		emitCommittedSessionIdentityDiff(previousIdentity, currentIdentity);
		finalizeSqliteSessionEntryMaintenancePlansBestEffort(resolved, maintenancePlans);
		return result;
	});
}
/** Forks one parent SQLite transcript into a new child transcript. */
async function recordSqliteInboundSessionMeta(params) {
	const createIfMissing = params.createIfMissing ?? true;
	return await patchSqliteSessionEntry({
		sessionKey: params.sessionKey,
		storePath: params.storePath
	}, (_entry, context) => deriveSessionMetaPatch({
		ctx: params.ctx,
		sessionKey: params.sessionKey,
		existing: context.existingEntry,
		groupResolution: params.groupResolution
	}), {
		preserveActivity: true,
		...createIfMissing ? { fallbackEntry: require_store.mergeSessionEntry(void 0, {}) } : {}
	});
}
/** Updates last-route/delivery metadata without refreshing activity timestamps. */
async function updateSqliteSessionLastRoute(params) {
	const createIfMissing = params.createIfMissing ?? true;
	return await patchSqliteSessionEntry({
		sessionKey: params.sessionKey,
		storePath: params.storePath
	}, (_entry, context) => deriveLastRoutePatch({
		channel: params.channel,
		to: params.to,
		accountId: params.accountId,
		threadId: params.threadId,
		route: params.route,
		deliveryContext: params.deliveryContext,
		ctx: params.ctx,
		groupResolution: params.groupResolution,
		existing: context.existingEntry,
		sessionKey: params.sessionKey
	}), {
		preserveActivity: true,
		...createIfMissing ? { fallbackEntry: require_store.mergeSessionEntry(void 0, {}) } : {}
	});
}
/** Writes the forked child's transcript rows (copied branch or header-only). */
//#endregion
//#region src/config/sessions/session-accessor.sqlite-events.ts
function emitArchivedSqliteTranscriptUpdates(archivedTranscripts) {
	for (const archived of archivedTranscripts) require_transcript_events.emitSessionTranscriptUpdate({ sessionFile: archived.archivedPath });
}
async function publishSqliteTranscriptUpdate(scope, update = {}) {
	const resolved = resolveSqliteTranscriptScope(scope);
	require_transcript_events.emitSessionTranscriptUpdate({
		...update,
		agentId: resolved.agentId,
		sessionKey: resolved.sessionKey,
		sessionId: resolved.sessionId,
		target: {
			agentId: resolved.agentId,
			sessionId: resolved.sessionId,
			sessionKey: resolved.sessionKey
		}
	});
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-lifecycle.ts
async function cleanupSqliteSessionLifecycleArtifacts(params) {
	const sessionKeySegmentPrefix = params.sessionKeySegmentPrefix.trim();
	const transcriptContentMarker = params.transcriptContentMarker;
	if (!sessionKeySegmentPrefix || !transcriptContentMarker) return {
		removedEntries: 0,
		archivedTranscriptArtifacts: 0
	};
	const resolved = resolveSqliteReadScope({
		...params.agentId ? { agentId: params.agentId } : {},
		storePath: params.storePath
	});
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const cleanupPlan = planSqliteSessionLifecycleArtifactCleanup(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)), {
			archiveRemovedEntryTranscripts: params.archiveRemovedEntryTranscripts !== false,
			archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
			sessionKeySegmentPrefix,
			transcriptContentMarker,
			orphanTranscriptMinAgeMs: params.orphanTranscriptMinAgeMs,
			nowMs: params.nowMs ?? Date.now()
		});
		const materializedPlans = materializeSqliteSessionStateDeletePlans(cleanupPlan.deletePlans);
		let removedEntries = 0;
		let archivedTranscripts = [];
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((transactionDb) => {
			removedEntries = deletePlannedSqliteLifecycleArtifactEntries(transactionDb, cleanupPlan.entries);
			archivedTranscripts = deleteMaterializedSqliteSessionStatePlans(transactionDb, materializedPlans);
		}, toDatabaseOptions(resolved));
		emitCommittedSessionEntryRemovals(cleanupPlan.entries);
		return {
			removedEntries,
			archivedTranscriptArtifacts: archivedTranscripts.length
		};
	});
}
/** Resets one persisted session entry using SQLite session rows. */
async function resetSqliteSessionEntryLifecycle(params) {
	const resolved = resolveSqliteStoreScope(params.storePath, { agentId: params.agentId });
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved));
		const targetSnapshot = readSqliteLifecycleTargetSnapshot(database, params.target);
		const current = targetSnapshot.primary;
		const nextEntry = await params.buildNextEntry({
			currentEntry: current ? cloneSessionEntry(current.entry) : void 0,
			primaryKey: params.target.canonicalKey
		});
		const mutation = {
			nextEntry: cloneSessionEntry(nextEntry),
			...current ? { previousEntry: cloneSessionEntry(current.entry) } : {},
			...current?.entry.sessionFile ? { previousSessionFile: current.entry.sessionFile } : {},
			...current?.entry.sessionId ? { previousSessionId: current.entry.sessionId } : {}
		};
		let archivedTranscripts = [];
		const referencedAfterReset = current?.entry.sessionId ? readReferencedSqliteSessionIdsAfterTargetMutation(database, params.target, nextEntry) : /* @__PURE__ */ new Set();
		const materializedPlans = materializeSqliteSessionStateDeletePlans(current?.entry.sessionId ? planSqliteSessionStateAfterEntryRemoval({
			archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
			database,
			entry: current.entry,
			reason: "reset",
			referencedSessionIds: referencedAfterReset
		}) : []);
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((transactionDb) => {
			assertSqliteLifecycleTargetUnchanged(transactionDb, params.target, current?.entry, "reset");
			deleteSqliteLifecycleTargetRows(transactionDb, params.target);
			writeSessionEntry(transactionDb, params.target.canonicalKey, nextEntry);
			archivedTranscripts = deleteMaterializedSqliteSessionStatePlans(transactionDb, materializedPlans);
		}, toDatabaseOptions(resolved));
		if (current) require_session_lifecycle_events.emitSessionIdentityMutation({
			kind: "reset",
			previous: {
				...current.entry.sessionId ? { sessionId: current.entry.sessionId } : {},
				sessionKeys: targetSnapshot.rows.map((row) => row.sessionKey)
			},
			current: {
				...nextEntry.sessionId ? { sessionId: nextEntry.sessionId } : {},
				sessionKeys: [params.target.canonicalKey]
			}
		});
		else require_session_lifecycle_events.emitSessionIdentityMutation({
			kind: "create",
			previous: { sessionKeys: [] },
			current: {
				...nextEntry.sessionId ? { sessionId: nextEntry.sessionId } : {},
				sessionKeys: [params.target.canonicalKey]
			}
		});
		await params.afterEntryMutation?.(mutation);
		emitArchivedSqliteTranscriptUpdates(archivedTranscripts);
		return {
			...mutation,
			archivedTranscripts
		};
	});
}
async function deleteSqliteSessionEntryLifecycleInternal(params, allowLockedEntryRemoval, expectedPluginOwnerId) {
	const resolved = resolveSqliteStoreScope(params.storePath, { agentId: params.agentId });
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		let result = {
			archivedTranscripts: [],
			deleted: false
		};
		const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved));
		const targetSnapshot = readSqliteLifecycleTargetSnapshot(database, params.target);
		const current = targetSnapshot.primary;
		if (!current) return result;
		if (current.entry.modelSelectionLocked === true && !allowLockedEntryRemoval) throw new Error(require_store.MODEL_SELECTION_LOCK_REMOVAL_MESSAGE);
		if (expectedPluginOwnerId && targetSnapshot.rows.some(({ entry, sessionKey }) => require_store.isAgentHarnessSessionKey(sessionKey) || entry.agentHarnessId !== void 0 || entry.modelSelectionLocked !== true || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.pluginOwnerId) !== expectedPluginOwnerId)) throw new Error(require_store.MODEL_SELECTION_LOCK_REMOVAL_MESSAGE);
		const referencedAfterDelete = readReferencedSqliteSessionIdsAfterTargetMutation(database, params.target);
		const materializedPlans = materializeSqliteSessionStateDeletePlans(params.archiveTranscript ? targetSnapshot.rows.flatMap(({ entry }) => planSqliteSessionStateAfterEntryRemoval({
			archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
			archiveTranscript: true,
			database,
			entry,
			reason: "deleted",
			referencedSessionIds: referencedAfterDelete
		})) : []);
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((transactionDb) => {
			const transactionSnapshot = readSqliteLifecycleTargetSnapshot(transactionDb, params.target);
			assertSqliteLifecycleTargetSnapshotUnchanged(targetSnapshot, transactionSnapshot, "delete session entry");
			const transactionEntry = transactionSnapshot.primary?.entry;
			if (!shouldDeleteSqliteSessionEntryLifecycle(transactionEntry, params)) return;
			deleteSqliteLifecycleTargetRows(transactionDb, params.target);
			result = {
				archivedTranscripts: deleteMaterializedSqliteSessionStatePlans(transactionDb, materializedPlans),
				deleted: true,
				deletedEntry: cloneSessionEntry(current.entry),
				...current.entry.sessionFile ? { deletedSessionFile: current.entry.sessionFile } : {},
				...current.entry.sessionId ? { deletedSessionId: current.entry.sessionId } : {}
			};
		}, toDatabaseOptions(resolved));
		if (result.deleted) require_session_lifecycle_events.emitSessionIdentityMutation({
			kind: "delete",
			previous: {
				...current.entry.sessionId ? { sessionId: current.entry.sessionId } : {},
				sessionKeys: targetSnapshot.rows.map((row) => row.sessionKey)
			}
		});
		emitArchivedSqliteTranscriptUpdates(result.archivedTranscripts);
		return result;
	});
}
/** Deletes one persisted session entry using SQLite session rows. */
async function deleteSqliteSessionEntryLifecycle(params) {
	return await deleteSqliteSessionEntryLifecycleInternal(params, false);
}
/** Rolls back one exact locked row created by failed trusted harness initialization. */
async function rollbackSqliteAgentHarnessSessionEntryLifecycle(params) {
	const hasExactTarget = params.target.storeKeys.length === 1 && params.target.storeKeys[0] === params.target.canonicalKey;
	const expectedEntryError = require_store.resolveAgentHarnessSessionStoreEntryError(params.target.canonicalKey, params.expectedEntry);
	if (!hasExactTarget || expectedEntryError || !require_store.isValidAgentHarnessSessionStoreEntry(params.target.canonicalKey, params.expectedEntry)) throw new Error(expectedEntryError ?? "Model-selection-locked sessions cannot be removed, unlocked, or reassigned.");
	return await deleteSqliteSessionEntryLifecycleInternal(params, true);
}
/** Rolls back one exact locked CLI row created by a failed plugin initializer. */
async function rollbackSqlitePluginOwnedSessionEntryLifecycle(params) {
	const expectedEntry = params.expectedEntry;
	const validPluginOwner = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(expectedEntry.pluginOwnerId);
	const expectedPluginOwner = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.expectedPluginOwnerId);
	if (require_store.isAgentHarnessSessionKey(params.target.canonicalKey) || expectedEntry.agentHarnessId !== void 0 || expectedEntry.modelSelectionLocked !== true || !validPluginOwner || validPluginOwner !== expectedPluginOwner) throw new Error(require_store.MODEL_SELECTION_LOCK_REMOVAL_MESSAGE);
	return await deleteSqliteSessionEntryLifecycleInternal(params, true, expectedPluginOwner);
}
/** Applies prepared full-row replacements in one validated SQLite transaction. */
function shouldDeleteSqliteSessionEntryLifecycle(entry, params) {
	if (!entry) return false;
	if (params.expectedEntry !== void 0 && !sqliteSessionEntriesEqual(entry, params.expectedEntry)) return false;
	if (params.expectedSessionId !== void 0 && entry.sessionId !== params.expectedSessionId) return false;
	if (params.expectedLifecycleRevision !== void 0 && entry.lifecycleRevision !== params.expectedLifecycleRevision) return false;
	if (params.expectedUpdatedAt !== void 0 && entry.updatedAt !== params.expectedUpdatedAt) return false;
	return true;
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-projection.ts
let sessionArchiveRuntimePromise;
function loadSessionArchiveRuntime$1() {
	sessionArchiveRuntimePromise ??= Promise.resolve().then(() => require("./session-archive.runtime-Ctg43zmX.cjs"));
	return sessionArchiveRuntimePromise;
}
async function applySqliteSessionEntryReplacements(params) {
	const resolved = resolveSqliteScope({
		...params.agentId ? { agentId: params.agentId } : {},
		sessionKey: params.activeSessionKey ?? params.sessionKeys?.[0] ?? "",
		storePath: params.storePath
	});
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved));
		const selectedKeys = params.sessionKeys ? new Set(params.sessionKeys) : void 0;
		const selectedStatuses = params.statuses ? new Set(params.statuses) : void 0;
		const entries = selectedStatuses ? readSqliteSessionEntriesByStatus(database, [...selectedStatuses], params.sessionKeys) : selectedKeys ? [...selectedKeys].flatMap((sessionKey) => {
			const entry = readExactSessionEntryRow(database, sessionKey)?.entry;
			return entry ? [{
				entry: cloneSessionEntry(entry),
				sessionKey
			}] : [];
		}) : Object.entries(readSqliteSessionEntryStore(database)).map(([sessionKey, entry]) => ({
			entry: cloneSessionEntry(entry),
			sessionKey
		}));
		const replacementAuthorityKeys = selectedStatuses ? new Set(entries.map(({ sessionKey }) => sessionKey)) : selectedKeys;
		const operation = await params.update(entries.map(({ entry, sessionKey }) => ({
			entry: cloneSessionEntry(entry),
			sessionKey
		})));
		const replacements = [...operation.replacements ?? []];
		for (const replacement of replacements) if (replacementAuthorityKeys && !replacementAuthorityKeys.has(replacement.sessionKey)) throw new Error(`Session entry replacement is outside the selected ${selectedStatuses ? "row" : "key"} set: ${replacement.sessionKey}`);
		const expectedEntries = new Map(entries.map(({ sessionKey, entry }) => [sessionKey, entry]));
		const applicable = replacements.filter((replacement) => expectedEntries.has(replacement.sessionKey));
		if (params.requireWriteSuccess && replacements.length > 0 && applicable.length === 0) throw new Error("session entry replacements did not persist any rows");
		if (applicable.length === 0) return operation.result;
		const maintenancePlans = [];
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((transactionDb) => {
			for (const replacement of applicable) {
				const current = readExactSessionEntryRow(transactionDb, replacement.sessionKey)?.entry;
				if (!sqliteSessionEntriesEqual(current, expectedEntries.get(replacement.sessionKey))) throw new Error(`SQLite session entry changed before replacement for ${replacement.sessionKey}`);
			}
			for (const replacement of applicable) writeSessionEntry(transactionDb, replacement.sessionKey, cloneSessionEntry(replacement.entry));
			maintenancePlans.push(applySqliteSessionEntryMaintenance(transactionDb, {
				activeSessionKey: params.activeSessionKey ?? "",
				archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
				skipMaintenance: params.skipMaintenance ?? true
			}));
		}, toDatabaseOptions(resolved), { operationLabel: "session.entry-replacements" });
		const finalReplacements = new Map(applicable.map((replacement) => [replacement.sessionKey, replacement]));
		for (const replacement of finalReplacements.values()) {
			const previousEntry = expectedEntries.get(replacement.sessionKey);
			if (previousEntry) emitCommittedSessionEntryChange({
				currentEntry: replacement.entry,
				currentKey: replacement.sessionKey,
				previousEntry,
				previousKey: replacement.sessionKey
			});
		}
		finalizeSqliteSessionEntryMaintenancePlansBestEffort(resolved, maintenancePlans);
		return operation.result;
	});
}
/**
* Applies a detached whole-store projection under the SQLite writer lane.
* This exists only for bounded compatibility adapters that must preserve a
* legacy serialized callback without exposing mutable storage internals.
*/
async function applySqliteSessionStoreProjection(params) {
	const resolved = resolveSqliteScope({
		...params.agentId ? { agentId: params.agentId } : {},
		sessionKey: params.activeSessionKey ?? "",
		storePath: params.storePath
	});
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const before = readSqliteSessionEntryStore(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)));
		const projected = structuredClone(before);
		const operation = await params.update(projected);
		if (!operation.persist) return operation.result;
		const transitionError = require_store.resolveAgentHarnessSessionStoreTransitionError({
			before: new Map(Object.entries(before).filter(([, entry]) => entry.modelSelectionLocked === true)),
			store: projected
		});
		const storeError = require_store.resolveAgentHarnessSessionStoreError(projected);
		if (transitionError || storeError) throw new Error(transitionError ?? storeError);
		const changedKeys = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...Object.keys(before), ...Object.keys(projected)]).filter((sessionKey) => !sqliteSessionEntriesEqual(before[sessionKey], projected[sessionKey]));
		if (changedKeys.length === 0) return operation.result;
		const maintenancePlans = [];
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((transactionDb) => {
			for (const sessionKey of changedKeys) {
				const current = readExactSessionEntryRow(transactionDb, sessionKey)?.entry;
				if (!sqliteSessionEntriesEqual(current, before[sessionKey])) throw new Error(`SQLite session entry changed before store projection for ${sessionKey}`);
			}
			for (const sessionKey of changedKeys) {
				const entry = projected[sessionKey];
				if (entry) writeSessionEntry(transactionDb, sessionKey, cloneSessionEntry(entry));
				else deleteSqliteSessionEntryRows(transactionDb, sessionKey);
			}
			maintenancePlans.push(applySqliteSessionEntryMaintenance(transactionDb, {
				activeSessionKey: params.activeSessionKey ?? "",
				archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
				skipMaintenance: params.skipMaintenance
			}));
		}, toDatabaseOptions(resolved), { operationLabel: "session.store-projection" });
		finalizeSqliteSessionEntryMaintenancePlansBestEffort(resolved, maintenancePlans);
		return operation.result;
	});
}
/** Applies exact lifecycle removals/upserts using SQLite session rows. */
async function applySqliteSessionEntryLifecycleMutation(params) {
	const resolved = resolveSqliteScope({
		...params.agentId ? { agentId: params.agentId } : {},
		sessionKey: "",
		storePath: params.storePath
	});
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const removals = [...params.removals ?? []];
		const upserts = [...params.upserts ?? []];
		const removedSessionKeys = [];
		let archivedTranscripts = [];
		const maintenancePlans = [];
		let artifactCleanupError;
		const captureArtifactCleanupError = (error) => {
			if (params.captureArtifactCleanupError === true) {
				artifactCleanupError ??= error;
				return;
			}
			throw error;
		};
		const projected = await projectSqliteSessionEntryLifecycleMutation(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)), {
			archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
			removals,
			upserts
		});
		let materializedRemovalPlans = [];
		try {
			materializedRemovalPlans = materializeSqliteSessionStateDeletePlans(projected.deletePlans);
		} catch (error) {
			captureArtifactCleanupError(error);
		}
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((transactionDb) => {
			for (const removal of projected.removals) {
				const entry = readExactSessionEntryRow(transactionDb, removal.sessionKey)?.entry;
				if (!sqliteSessionEntriesEqual(entry, removal.expectedEntry)) throw new Error(`SQLite session entry changed before lifecycle removal for ${removal.sessionKey}`);
				if (!shouldRemoveSqliteSessionEntry(entry, removal.removal)) continue;
				deleteSqliteSessionEntryRows(transactionDb, removal.sessionKey);
				removedSessionKeys.push(removal.sessionKey);
			}
			for (const { sessionKey, entry, expectedEntry } of projected.upsertedEntries) {
				const currentEntry = readExactSessionEntryRow(transactionDb, sessionKey)?.entry;
				if (!sqliteSessionEntriesEqual(currentEntry, expectedEntry)) throw new Error(`SQLite session entry changed before lifecycle upsert for ${sessionKey}`);
				writeSessionEntry(transactionDb, sessionKey, entry);
			}
			maintenancePlans.push(applySqliteSessionEntryMaintenance(transactionDb, {
				activeSessionKey: params.activeSessionKey ?? "",
				archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
				forceMaintenance: params.maintenanceOverride !== void 0,
				maintenanceConfig: params.maintenanceOverride ? {
					...require_store.resolveMaintenanceConfig(),
					...params.maintenanceOverride
				} : void 0,
				skipMaintenance: params.skipMaintenance
			}));
			archivedTranscripts = deleteMaterializedSqliteSessionStatePlans(transactionDb, materializedRemovalPlans);
		}, toDatabaseOptions(resolved));
		emitCommittedLifecycleIdentityMutations({
			projected,
			removedSessionKeys
		});
		const maintenanceArchivedTranscripts = finalizeSqliteSessionEntryMaintenancePlansBestEffort(resolved, maintenancePlans);
		archivedTranscripts = [...archivedTranscripts, ...maintenanceArchivedTranscripts];
		const afterCount = readSqliteSessionEntryCount(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)));
		emitArchivedSqliteTranscriptUpdates(archivedTranscripts);
		const archivedTranscriptDirectories = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(archivedTranscripts.map((transcript) => node_path.default.dirname(transcript.archivedPath))).toSorted();
		if (archivedTranscriptDirectories.length > 0 && params.cleanupArchivedTranscripts) try {
			const { cleanupArchivedSessionTranscripts } = await loadSessionArchiveRuntime$1();
			await cleanupArchivedSessionTranscripts({
				directories: archivedTranscriptDirectories,
				rules: params.cleanupArchivedTranscripts.rules,
				nowMs: params.cleanupArchivedTranscripts.nowMs
			});
		} catch (error) {
			captureArtifactCleanupError(error);
		}
		return {
			removedEntries: removedSessionKeys.length,
			removedSessionKeys,
			archivedTranscriptDirectories,
			unreferencedArtifacts: null,
			maintenanceReport: null,
			afterCount,
			artifactCleanupError
		};
	});
}
/** Purges entries owned by a deleted agent from SQLite session rows. */
async function purgeSqliteDeletedAgentSessionEntries(params) {
	const resolved = resolveSqliteStoreScope(params.storePath, { agentId: params.storeAgentId });
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved));
		const store = readSqliteSessionEntryStore(database);
		const remainingStore = { ...store };
		const entryRemovals = [];
		const removedEntriesToArchive = [];
		for (const sessionKey of Object.keys(store)) {
			if (resolveStoredSessionOwnerAgentId({
				cfg: params.cfg,
				agentId: params.storeAgentId,
				sessionKey
			}) !== params.agentId) continue;
			const entry = store[sessionKey];
			if (!entry) continue;
			entryRemovals.push({
				expectedEntry: cloneSessionEntry(entry),
				sessionKey
			});
			removedEntriesToArchive.push(entry);
			delete remainingStore[sessionKey];
		}
		const referencedSessionIds = collectProjectedReferencedSqliteSessionIds({
			database,
			excludedSessionKeys: entryRemovals.map((removal) => removal.sessionKey),
			projectedStore: remainingStore
		});
		const materializedPlans = materializeSqliteSessionStateDeletePlans(removedEntriesToArchive.flatMap((entry) => planSqliteSessionStateAfterEntryRemoval({
			archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
			database,
			entry,
			reason: "deleted",
			referencedSessionIds
		})));
		const removedSessionKeys = entryRemovals.map((removal) => removal.sessionKey);
		let archivedTranscripts = [];
		const maintenancePlans = [];
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((transactionDb) => {
			deletePlannedSqliteLifecycleArtifactEntries(transactionDb, entryRemovals);
			maintenancePlans.push(applySqliteSessionEntryMaintenance(transactionDb, {
				activeSessionKey: "",
				archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved)
			}));
			archivedTranscripts = deleteMaterializedSqliteSessionStatePlans(transactionDb, materializedPlans);
		}, toDatabaseOptions(resolved));
		emitCommittedSessionEntryRemovals(entryRemovals);
		archivedTranscripts = [...archivedTranscripts, ...finalizeSqliteSessionEntryMaintenancePlansBestEffort(resolved, maintenancePlans)];
		const afterCount = readSqliteSessionEntryCount(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)));
		emitArchivedSqliteTranscriptUpdates(archivedTranscripts);
		return {
			removedEntries: removedSessionKeys.length,
			removedSessionKeys,
			archivedTranscriptDirectories: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(archivedTranscripts.map((transcript) => node_path.default.dirname(transcript.archivedPath))).toSorted(),
			unreferencedArtifacts: null,
			maintenanceReport: null,
			afterCount
		};
	});
}
/** Fully replaces rows for one transcript in the additive SQLite transcript store. */
//#endregion
//#region src/agents/usage.ts
/**
* Token usage normalization helpers.
* Converts provider-specific usage shapes into Operator's normalized input,
* output, cache, reasoning, and total token accounting fields.
*/
/** Build a zeroed assistant usage snapshot. */
function makeZeroUsageSnapshot() {
	return {
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
	};
}
/** Return true when any normalized usage bucket is positive. */
function hasNonzeroUsage(usage) {
	if (!usage) return false;
	return [
		usage.input,
		usage.output,
		usage.cacheRead,
		usage.cacheWrite,
		usage.contextUsage?.state === "available" ? usage.contextUsage.promptTokens : void 0,
		usage.contextUsage?.state === "available" ? usage.contextUsage.totalTokens : void 0,
		usage.reasoningTokens,
		usage.total
	].some((v) => typeof v === "number" && Number.isFinite(v) && v > 0) || usage.contextUsage?.state === "unavailable";
}
const normalizeTokenCount = (value) => {
	const numeric = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(value);
	if (numeric === void 0) return;
	if (numeric <= 0) return 0;
	return Math.min(Math.trunc(numeric), Number.MAX_SAFE_INTEGER);
};
/** Normalize provider-specific token usage fields into Operator usage buckets. */
function normalizeUsage(raw) {
	if (!raw) return;
	const cacheRead = normalizeTokenCount(raw.cacheRead ?? raw.cache_read ?? raw.cache_read_input_tokens ?? raw.cached_tokens ?? raw.input_tokens_details?.cached_tokens ?? raw.prompt_tokens_details?.cached_tokens);
	const rawInputValue = raw.input ?? raw.inputTokens ?? raw.input_tokens ?? raw.promptTokens ?? raw.prompt_tokens ?? raw.prompt_n ?? raw.timings?.prompt_n;
	const usesOpenAIStylePromptTotals = raw.cached_tokens !== void 0 || raw.input_tokens_details?.cached_tokens !== void 0 || raw.prompt_tokens_details?.cached_tokens !== void 0;
	const rawInput = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(rawInputValue);
	const normalizedInput = rawInput !== void 0 && usesOpenAIStylePromptTotals && cacheRead !== void 0 ? rawInput - cacheRead : rawInput;
	const input = normalizeTokenCount(normalizedInput);
	const output = normalizeTokenCount(raw.output ?? raw.outputTokens ?? raw.output_tokens ?? raw.completionTokens ?? raw.completion_tokens ?? raw.predicted_n ?? raw.timings?.predicted_n);
	const cacheWrite = normalizeTokenCount(raw.cacheWrite ?? raw.cache_write ?? raw.cache_creation_input_tokens);
	const contextPromptTokens = raw.contextUsage?.state === "available" ? normalizeTokenCount(raw.contextUsage.promptTokens) : void 0;
	const contextTotalTokens = raw.contextUsage?.state === "available" ? normalizeTokenCount(raw.contextUsage.totalTokens) : void 0;
	const contextUsage = raw.contextUsage?.state === "unavailable" ? { state: "unavailable" } : contextPromptTokens !== void 0 && contextTotalTokens !== void 0 && contextTotalTokens >= contextPromptTokens ? {
		state: "available",
		promptTokens: contextPromptTokens,
		totalTokens: contextTotalTokens
	} : void 0;
	const reasoningTokens = normalizeTokenCount(raw.reasoningTokens ?? raw.reasoning_tokens ?? raw.completion_tokens_details?.reasoning_tokens ?? raw.output_tokens_details?.reasoning_tokens);
	const total = normalizeTokenCount(raw.total ?? raw.totalTokens ?? raw.total_tokens);
	if (input === void 0 && output === void 0 && cacheRead === void 0 && cacheWrite === void 0 && contextUsage === void 0 && reasoningTokens === void 0 && total === void 0) return;
	return {
		input,
		output,
		cacheRead,
		cacheWrite,
		...contextUsage ? { contextUsage } : {},
		...reasoningTokens !== void 0 ? { reasoningTokens } : {},
		total
	};
}
/**
* Maps normalized usage to OpenAI Chat Completions `usage` fields.
*
* `prompt_tokens` is input + cacheRead (cache write is excluded to match the
* OpenAI-style breakdown used by the compat endpoint).
*
* `total_tokens` is the greater of the component sum and aggregate `total` when
* present, so a partial breakdown cannot discard a valid upstream total.
*
* `prompt_tokens_details.cached_tokens` is emitted when `cacheRead > 0` so
* downstream chat-completions clients can compute the cache-aware blended
* cost. Field name and shape match OpenAI's documented usage breakdown:
* https://platform.openai.com/docs/guides/prompt-caching
*/
function toOpenAiChatCompletionsUsage(usage) {
	const input = usage?.input ?? 0;
	const output = usage?.output ?? 0;
	const cacheRead = usage?.cacheRead ?? 0;
	const promptTokens = Math.max(0, input + cacheRead);
	const completionTokens = Math.max(0, output);
	const componentTotal = promptTokens + completionTokens;
	const aggregateRaw = usage?.total;
	const aggregateTotal = typeof aggregateRaw === "number" && Number.isFinite(aggregateRaw) ? Math.max(0, aggregateRaw) : void 0;
	const totalTokens = aggregateTotal !== void 0 ? Math.max(componentTotal, aggregateTotal) : componentTotal;
	const reasoningTokens = normalizeTokenCount(usage?.reasoningTokens);
	return {
		prompt_tokens: promptTokens,
		completion_tokens: completionTokens,
		total_tokens: totalTokens,
		...cacheRead > 0 ? { prompt_tokens_details: { cached_tokens: cacheRead } } : {},
		...reasoningTokens !== void 0 ? { completion_tokens_details: { reasoning_tokens: reasoningTokens } } : {}
	};
}
/** Derive prompt/context tokens from normalized input and cache buckets. */
function derivePromptTokens(usage) {
	if (!usage) return;
	const input = usage.input ?? 0;
	const cacheRead = usage.cacheRead ?? 0;
	const cacheWrite = usage.cacheWrite ?? 0;
	const sum = input + cacheRead + cacheWrite;
	return sum > 0 ? sum : void 0;
}
function derivePromptTokensFromTotal(usage) {
	const total = usage?.total;
	const output = usage?.output;
	if (typeof total !== "number" || !Number.isFinite(total) || total <= 0 || typeof output !== "number" || !Number.isFinite(output) || output < 0) return;
	const promptTokens = total - output;
	return promptTokens > 0 ? promptTokens : void 0;
}
/** Resolve context prompt tokens from explicit override, last call, or aggregate usage. */
function deriveContextPromptTokens(params) {
	const promptOverride = params.promptTokens;
	if (typeof promptOverride === "number" && Number.isFinite(promptOverride) && promptOverride > 0) return promptOverride;
	if (params.lastCallUsage?.contextUsage?.state === "unavailable") return;
	if (params.lastCallUsage?.contextUsage?.state === "available") return params.lastCallUsage.contextUsage.promptTokens;
	const lastCallPromptTokens = derivePromptTokens(params.lastCallUsage) ?? derivePromptTokensFromTotal(params.lastCallUsage);
	if (lastCallPromptTokens !== void 0) return lastCallPromptTokens;
	if (params.usage?.contextUsage?.state === "unavailable") return;
	if (params.usage?.contextUsage?.state === "available") return params.usage.contextUsage.promptTokens;
	return derivePromptTokens(params.usage);
}
/** Derive the session prompt-token snapshot stored for context display. */
function deriveSessionTotalTokens(params) {
	const promptOverride = params.promptTokens;
	const hasPromptOverride = typeof promptOverride === "number" && Number.isFinite(promptOverride) && promptOverride > 0;
	const usage = params.usage;
	if (!usage && !hasPromptOverride) return;
	const promptTokens = deriveContextPromptTokens({
		promptTokens: hasPromptOverride ? promptOverride : void 0,
		usage
	});
	if (!(typeof promptTokens === "number") || !Number.isFinite(promptTokens) || promptTokens <= 0) return;
	return promptTokens;
}
//#endregion
//#region src/config/sessions/transcript-header.ts
/** Creates a session transcript header entry with current version metadata. */
function createSessionTranscriptHeader(params = {}) {
	return {
		type: "session",
		version: 3,
		id: params.sessionId ?? (0, node_crypto.randomUUID)(),
		timestamp: params.timestamp ?? (/* @__PURE__ */ new Date()).toISOString(),
		cwd: params.cwd ?? process.cwd(),
		...params.parentSession ? { parentSession: params.parentSession } : {}
	};
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-parent-fork.ts
const DEFAULT_PARENT_FORK_MAX_TOKENS = 1e5;
function formatParentForkTooLargeMessage(params) {
	return `Parent context is too large to fork (${params.parentTokens}/${params.maxTokens} tokens); starting with isolated context instead.`;
}
function resolveSqliteParentForkDecision(parentEntry, transcriptEstimate) {
	const maxTokens = DEFAULT_PARENT_FORK_MAX_TOKENS;
	const parentTokens = require_store.resolveFreshSessionTotalTokens(parentEntry) ?? (transcriptEstimate?.kind === "exact-context" ? transcriptEstimate.tokens : maxPositiveTokenCount(transcriptEstimate?.tokens, require_store.resolveSessionTotalTokens(parentEntry)));
	if (typeof parentTokens === "number" && parentTokens > maxTokens) return {
		status: "skip",
		reason: "parent-too-large",
		maxTokens,
		parentTokens,
		message: formatParentForkTooLargeMessage({
			parentTokens,
			maxTokens
		})
	};
	return {
		status: "fork",
		maxTokens,
		...typeof parentTokens === "number" ? { parentTokens } : {}
	};
}
function estimateSqliteTranscriptPromptTokens(events) {
	let byteEstimate = 0;
	let latestUsageEstimate;
	let latestUsageEstimateIsExactContext = false;
	let trailingBytes = 0;
	for (const event of selectParentForkTokenEstimateEvents(events)) {
		const serializedBytes = Buffer.byteLength(JSON.stringify(event)) + 1;
		byteEstimate += serializedBytes;
		if (!isRecord(event)) {
			if (latestUsageEstimate !== void 0) trailingBytes += serializedBytes;
			continue;
		}
		const message = isRecord(event.message) ? event.message : void 0;
		const usageRaw = isRecord(message?.usage) ? message.usage : isRecord(event.usage) ? event.usage : void 0;
		if (!usageRaw) {
			if (latestUsageEstimate !== void 0) trailingBytes += serializedBytes;
			continue;
		}
		const contextUsage = readTranscriptContextUsage(usageRaw);
		if (contextUsage?.state === "unavailable") {
			latestUsageEstimate = void 0;
			latestUsageEstimateIsExactContext = false;
			trailingBytes = 0;
			continue;
		}
		if (contextUsage?.state === "available") {
			latestUsageEstimate = normalizePositiveTokenCount(contextUsage.totalTokens);
			latestUsageEstimateIsExactContext = true;
			trailingBytes = 0;
			continue;
		}
		const usage = normalizeUsage(usageRaw);
		const promptTokens = normalizePositiveTokenCount(derivePromptTokens({
			input: usage?.input,
			cacheRead: usage?.cacheRead,
			cacheWrite: usage?.cacheWrite
		}));
		const outputTokens = normalizePositiveTokenCount(usage?.output) ?? 0;
		const totalTokens = promptTokens === void 0 ? void 0 : normalizePositiveTokenCount(promptTokens + outputTokens);
		if (typeof totalTokens === "number") {
			latestUsageEstimate = totalTokens;
			latestUsageEstimateIsExactContext = false;
			trailingBytes = 0;
		}
	}
	if (latestUsageEstimate !== void 0) {
		const tokens = normalizePositiveTokenCount(latestUsageEstimate + Math.ceil(trailingBytes / 4));
		return tokens === void 0 ? void 0 : {
			kind: latestUsageEstimateIsExactContext ? "exact-context" : "legacy-or-bytes",
			tokens
		};
	}
	const tokens = normalizePositiveTokenCount(Math.ceil(byteEstimate / 4));
	return tokens === void 0 ? void 0 : {
		kind: "legacy-or-bytes",
		tokens
	};
}
function selectParentForkTokenEstimateEvents(events) {
	const tree = require_transcript_tree.scanSessionTranscriptTree(events.filter((entry) => !(isRecord(entry) && entry.type === "session")));
	return require_transcript_tree.mergeSessionTranscriptVisiblePathWithOpaqueAppendPath({
		visiblePath: require_transcript_tree.selectSessionTranscriptTreePathNodes(tree, tree.leafId),
		appendPath: require_transcript_tree.selectSessionTranscriptTreePathNodes(tree, tree.appendParentId),
		appendParentId: tree.appendParentId
	}).nodes.flatMap((node) => node.entry);
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizePositiveTokenCount(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : void 0;
}
function maxPositiveTokenCount(...values) {
	let max;
	for (const value of values) {
		const normalized = normalizePositiveTokenCount(value);
		if (normalized !== void 0 && (max === void 0 || normalized > max)) max = normalized;
	}
	return max;
}
function readTranscriptContextUsage(usageRaw) {
	const contextUsage = usageRaw.contextUsage;
	if (!isRecord(contextUsage)) return;
	if (contextUsage.state === "unavailable") return { state: "unavailable" };
	if (contextUsage.state !== "available") return;
	const totalTokens = normalizePositiveTokenCount(contextUsage.totalTokens);
	return totalTokens === void 0 ? void 0 : {
		state: "available",
		totalTokens
	};
}
function resolveSqliteParentForkSourceTranscript(fileEntries) {
	if (fileEntries.length === 0) return null;
	const header = fileEntries.find((entry) => isRecord(entry) && entry.type === "session");
	const entries = fileEntries.filter((entry) => !(isRecord(entry) && entry.type === "session"));
	const tree = require_transcript_tree.scanSessionTranscriptTree(entries);
	const mergedPath = require_transcript_tree.mergeSessionTranscriptVisiblePathWithOpaqueAppendPath({
		visiblePath: require_transcript_tree.selectSessionTranscriptTreePathNodes(tree, tree.leafId),
		appendPath: require_transcript_tree.selectSessionTranscriptTreePathNodes(tree, tree.appendParentId),
		appendParentId: tree.appendParentId
	});
	const branchEntries = mergedPath.nodes.flatMap((node) => {
		if (!isRecord(node.entry)) return [];
		const parentId = node.selectedParentId;
		return [node.entry.parentId === parentId ? node.entry : {
			...node.entry,
			parentId
		}];
	});
	const pathEntryIds = new Set(branchEntries.flatMap((entry) => isRecord(entry) && typeof entry.id === "string" ? [entry.id] : []));
	const lastLeafUpdateNode = tree.nodes.findLast((node) => node.leafId !== void 0);
	return {
		appendParentId: mergedPath.appendParentId,
		...lastLeafUpdateNode?.appendMode ? { appendMode: lastLeafUpdateNode.appendMode } : {},
		branchEntries,
		cwd: typeof header?.cwd === "string" ? header.cwd : void 0,
		labelsToWrite: collectBranchLabels({
			allEntries: entries,
			pathEntryIds
		}),
		leafId: tree.leafId,
		preserveLeafControl: require_transcript_tree.isSessionTranscriptLeafControl(lastLeafUpdateNode?.entry)
	};
}
function collectBranchLabels(params) {
	return params.allEntries.flatMap((entry) => isRecord(entry) && entry.type === "label" && typeof entry.label === "string" && typeof entry.targetId === "string" && typeof entry.id === "string" && !params.pathEntryIds.has(entry.id) && params.pathEntryIds.has(entry.targetId) && typeof entry.timestamp === "string" ? [{
		targetId: entry.targetId,
		label: entry.label,
		timestamp: entry.timestamp
	}] : []);
}
function generateEntryId(existingIds) {
	for (let attempt = 0; attempt < 100; attempt += 1) {
		const id = (0, node_crypto.randomUUID)().slice(0, 8);
		if (!existingIds.has(id)) {
			existingIds.add(id);
			return id;
		}
	}
	const id = (0, node_crypto.randomUUID)();
	existingIds.add(id);
	return id;
}
function buildLabelEntries(params) {
	let parentId = params.lastEntryId;
	return params.labelsToWrite.map(({ targetId, label, timestamp }) => {
		const entry = {
			type: "label",
			id: generateEntryId(params.pathEntryIds),
			parentId,
			timestamp,
			targetId,
			label
		};
		parentId = entry.id;
		return entry;
	});
}
function hasAssistantEntry(entries) {
	return entries.some((entry) => isRecord(entry) && entry.type === "message" && isRecord(entry.message) && entry.message.role === "assistant");
}
function buildSqliteForkedChildTranscriptEvents(params) {
	const header = {
		...createSessionTranscriptHeader({
			cwd: params.source.cwd,
			sessionId: params.targetSessionId
		}),
		parentSession: params.parentSessionFile
	};
	if (!params.source.preserveLeafControl && !hasAssistantEntry(params.source.branchEntries)) return [header];
	const pathEntryIds = new Set(params.source.branchEntries.flatMap((entry) => isRecord(entry) && typeof entry.id === "string" ? [entry.id] : []));
	const lastPathEntry = params.source.branchEntries.at(-1);
	const lastPathEntryId = isRecord(lastPathEntry) && typeof lastPathEntry.id === "string" ? lastPathEntry.id : null;
	const labelEntries = buildLabelEntries({
		labelsToWrite: params.source.labelsToWrite,
		pathEntryIds,
		lastEntryId: lastPathEntryId
	});
	const leafEntry = params.source.preserveLeafControl ? {
		type: "leaf",
		id: generateEntryId(pathEntryIds),
		parentId: labelEntries.at(-1)?.id ?? lastPathEntryId,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		targetId: params.source.leafId,
		appendParentId: params.source.appendParentId,
		...params.source.appendMode ? { appendMode: params.source.appendMode } : {}
	} : null;
	return [
		header,
		...params.source.branchEntries,
		...labelEntries,
		...leafEntry ? [leafEntry] : []
	];
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-read.ts
/** Loads raw transcript events from the additive SQLite transcript store. */
async function loadSqliteTranscriptEvents(scope) {
	return loadSqliteTranscriptEventsSync(scope);
}
/** Loads raw transcript events synchronously from the additive SQLite transcript store. */
function loadSqliteTranscriptEventsSync(scope) {
	const resolved = resolveSqliteTranscriptReadScope(scope);
	return loadSqliteTranscriptEventsFromDatabase(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)), resolved.sessionId);
}
function loadSqliteTranscriptEventsFromDatabase(database, sessionId) {
	const db = getSessionKysely(database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("transcript_events").select(["event_json"]).where("session_id", "=", sessionId).orderBy("seq", "asc")).rows.map((row) => JSON.parse(row.event_json));
}
function readSqliteTranscriptSnapshot(database, sessionId) {
	const db = getSessionKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("transcript_events").select(["event_json", "seq"]).where("session_id", "=", sessionId).orderBy("seq", "asc")).rows;
	return {
		events: rows.map((row) => JSON.parse(row.event_json)),
		rows: rows.map((row) => ({
			eventJson: row.event_json,
			seq: normalizeSqliteNumber(row.seq)
		}))
	};
}
function sqliteTranscriptJsonlByteSize() {
	return kysely.sql`COALESCE(SUM(LENGTH(CAST(event_json AS BLOB))), 0)
    + CASE WHEN COUNT(*) > 0 THEN COUNT(*) - 1 ELSE 0 END`.as("size_bytes");
}
/** Reads transcript freshness and byte size without materializing event rows. */
function readSqliteTranscriptStatsSync(scope) {
	const resolved = resolveSqliteTranscriptReadScope(scope);
	const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved));
	const db = getSessionKysely(database.db);
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("transcript_events").select((eb) => [
		eb.fn.count("seq").as("event_count"),
		eb.fn.max("seq").as("max_seq"),
		sqliteTranscriptJsonlByteSize()
	]).where("session_id", "=", resolved.sessionId));
	const session = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("sessions").select(["transcript_observed_at", "transcript_updated_at"]).where("session_id", "=", resolved.sessionId));
	return {
		eventCount: row?.event_count ?? 0,
		...session?.transcript_updated_at !== null && session?.transcript_updated_at !== void 0 ? { lastMutationAtMs: session.transcript_updated_at } : {},
		...session?.transcript_observed_at !== null && session?.transcript_observed_at !== void 0 ? { lastObservedMutationAtMs: session.transcript_observed_at } : {},
		maxSeq: row?.max_seq ?? 0,
		sizeBytes: row?.size_bytes ?? 0
	};
}
function readTranscriptEventJsonSetInTransaction(database, sessionId) {
	const db = getSessionKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("transcript_events").select("event_json").where("session_id", "=", sessionId)).rows;
	return new Set(rows.map((row) => row.event_json));
}
/** Reads the latest visible assistant text from SQLite transcript rows in reverse order. */
function loadLatestSqliteAssistantText(scope, options = {}) {
	const resolved = resolveSqliteTranscriptReadScope(scope);
	const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved));
	const db = getSessionKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.iterateSqliteQuerySync(database.db, db.selectFrom("transcript_events as te").innerJoin("transcript_event_identities as ti", (join) => join.onRef("ti.session_id", "=", "te.session_id").onRef("ti.seq", "=", "te.seq")).select("te.event_json as event_json").where("te.session_id", "=", resolved.sessionId).where("ti.event_type", "=", "message").orderBy("ti.seq", "desc"));
	for (const row of rows) {
		const latest = parseLatestAssistantMessageEvent(row.event_json, options);
		if (!latest) continue;
		const text = parseLatestAssistantText(latest);
		if (text) return text;
	}
}
function parseLatestAssistantText(latest) {
	const message = latest.message;
	const text = require_chat_message_content.extractAssistantVisibleText(latest.message)?.trim();
	if (!text) return;
	return {
		...latest.id ? { id: latest.id } : {},
		text,
		...typeof message.timestamp === "number" && Number.isFinite(message.timestamp) ? { timestamp: message.timestamp } : {}
	};
}
function parseLatestAssistantMessageEvent(raw, options = {}) {
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return;
	}
	const message = parsed.message;
	if (message?.role !== "assistant") return;
	if (!options.includeTranscriptOnlyOperatorAssistant && require_transcript_only_openclaw_assistant.isTranscriptOnlyOperatorAssistantModel(message.provider, message.model)) return;
	return {
		...typeof parsed.id === "string" && parsed.id.trim() ? { id: parsed.id } : {},
		message
	};
}
/** Finds the newest transcript record accepted by the matcher without parsing older rows. */
function findSqliteTranscriptEvent(scope, match) {
	const resolved = resolveSqliteTranscriptReadScope(scope);
	return findSqliteTranscriptEventInDatabase(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)), resolved.sessionId, match);
}
function findSqliteTranscriptEventInDatabase(database, sessionId, match) {
	const db = getSessionKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.selectFrom("transcript_events").select(["event_json"]).where("session_id", "=", sessionId).orderBy("seq", "desc")).rows;
	for (const row of rows) try {
		const event = JSON.parse(row.event_json);
		if (match(event)) return { event };
	} catch {}
}
function readTranscriptEventMessage(event) {
	if (!event || typeof event !== "object" || Array.isArray(event)) return;
	const message = event.message;
	return message && typeof message === "object" && !Array.isArray(message) ? message : void 0;
}
function readTranscriptEventId(event) {
	if (!event || typeof event !== "object" || Array.isArray(event)) return;
	const id = event.id;
	return typeof id === "string" && id.trim() ? id : void 0;
}
//#endregion
//#region src/agents/transcript-redact.ts
/**
* Agent transcript redaction helpers.
*
* Applies logging redaction rules to persisted messages while preserving unchanged object identity.
*/
function resolveTranscriptRedactPatterns(patterns) {
	return patterns && patterns.length > 0 ? [...patterns, ...require_redact.getDefaultRedactPatterns()] : void 0;
}
function redactTranscriptOptions(cfg) {
	const configuredLogging = require_redact.readLoggingConfig();
	const mode = cfg?.logging?.redactSensitive ?? configuredLogging?.redactSensitive;
	const patterns = resolveTranscriptRedactPatterns(cfg?.logging?.redactPatterns ?? configuredLogging?.redactPatterns);
	if (mode === void 0 && patterns === void 0) return;
	return {
		...mode !== void 0 ? { mode } : {},
		...patterns !== void 0 ? { patterns } : {}
	};
}
function isTranscriptRedactionDisabled(cfg) {
	return (cfg?.logging?.redactSensitive ?? require_redact.readLoggingConfig()?.redactSensitive) === "off";
}
function redactTranscriptText(value, cfg) {
	if (cfg?.logging?.redactSensitive === "off") return value;
	return require_redact.redactSensitiveText(value, redactTranscriptOptions(cfg));
}
function redactTranscriptStructuredFieldValue(key, value, cfg) {
	if (cfg?.logging?.redactSensitive === "off") return value;
	return require_redact.redactSensitiveFieldValue(key, value, redactTranscriptOptions(cfg));
}
function isPlainTranscriptObject(value) {
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
function isImageMimeType(value) {
	return typeof value === "string" && /^image\//iu.test(value.trim());
}
function normalizeImageMimeType(value) {
	return isImageMimeType(value) ? value.trim().toLowerCase() : void 0;
}
function imageMimeTypeForRecord(value) {
	return normalizeImageMimeType(value.mimeType) ?? normalizeImageMimeType(value.mediaType) ?? normalizeImageMimeType(value.media_type);
}
function imageMimeTypeFieldsForRecord(value) {
	return [
		"mimeType",
		"mediaType",
		"media_type"
	].filter((key) => isImageMimeType(value[key]));
}
function sanitizeOpaqueImageBase64(base64, mimeType) {
	return mimeType ? (0, _gabrielvfonseca_media_core_inline_image_data_url.sanitizeInlineImageBase64)({
		mimeType,
		base64
	}) : void 0;
}
function isValidOpaqueImageBase64(base64, mimeType) {
	return sanitizeOpaqueImageBase64(base64, mimeType) !== void 0;
}
function isTranscriptImageContentBlock(value) {
	return value.type === "image" && typeof value.data === "string" && isValidOpaqueImageBase64(value.data, imageMimeTypeForRecord(value));
}
function isImageBase64SourceBlock(value) {
	return value.type === "base64" && typeof value.data === "string" && isValidOpaqueImageBase64(value.data, imageMimeTypeForRecord(value));
}
function sanitizeImageRecord(source) {
	const isImageBlock = source.type === "image";
	const isBase64SourceBlock = source.type === "base64";
	if (!isImageBlock && !isBase64SourceBlock || typeof source.data !== "string") return;
	const mimeTypeFields = imageMimeTypeFieldsForRecord(source);
	if (mimeTypeFields.length === 0) return;
	const sanitized = sanitizeOpaqueImageBase64(source.data, imageMimeTypeForRecord(source));
	if (!sanitized) return;
	const hasCanonicalMimeTypes = mimeTypeFields.every((key) => source[key] === sanitized.mimeType);
	if (source.data === sanitized.base64 && hasCanonicalMimeTypes) return source;
	const next = {
		...source,
		data: sanitized.base64
	};
	for (const field of mimeTypeFields) next[field] = sanitized.mimeType;
	return next;
}
function startsWithDataUrl(value) {
	return value.slice(0, 5).toLowerCase() === "data:";
}
function sanitizeImageDataUrlField(source, key, value) {
	if (!startsWithDataUrl(value)) return;
	return source.type === "input_image" && key === "image_url" || (source.type === "image" || source.type === "image_url") && key === "url" || source.type === "image" && (key === "source" || key === "data") ? (0, _gabrielvfonseca_media_core_inline_image_data_url.sanitizeInlineImageDataUrlForStorage)(value) : void 0;
}
function shouldPreserveOpaqueImagePayload(source, key, item, preserveImageDataUrlFields) {
	if (typeof item !== "string") return false;
	if (key === "data" && (isTranscriptImageContentBlock(source) || isImageBase64SourceBlock(source))) return true;
	if (preserveImageDataUrlFields && key === "url") return startsWithDataUrl(item) && (0, _gabrielvfonseca_media_core_inline_image_data_url.sanitizeInlineImageDataUrlForStorage)(item) !== void 0;
	return sanitizeImageDataUrlField(source, key, item) !== void 0;
}
function shouldPreserveNestedImageDataUrlFields(source, key) {
	return key === "image_url" && (source.type === "image_url" || source.type === "input_image" || source.type === "image");
}
const OPENAI_RESPONSES_APIS = /* @__PURE__ */ new Set([
	"openai-responses",
	"azure-openai-responses",
	"openai-chatgpt-responses",
	"operator-openai-responses-transport",
	"operator-azure-openai-responses-transport"
]);
const GOOGLE_REASONING_APIS = /* @__PURE__ */ new Set([
	"google-generative-ai",
	"google-vertex",
	"google-gemini-cli",
	"operator-google-generative-ai-transport"
]);
const ANTHROPIC_REASONING_APIS = /* @__PURE__ */ new Set([
	"anthropic-messages",
	"bedrock-converse-stream",
	"operator-anthropic-messages-transport"
]);
const OPENAI_COMPLETIONS_APIS = /* @__PURE__ */ new Set(["openai-completions", "operator-openai-completions-transport"]);
const OPAQUE_REPLAY_TOKEN_RE = /^[A-Za-z0-9+/_-]+={0,2}$/;
const GOOGLE_THOUGHT_SIGNATURE_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const OPENAI_REPLAY_CONTEXT_HASH_RE = /^[a-f0-9]{16}$/;
function isOpenAIResponsesRoute(route) {
	return typeof route?.api === "string" && OPENAI_RESPONSES_APIS.has(route.api);
}
function isGoogleReasoningRoute(route) {
	return typeof route?.api === "string" && GOOGLE_REASONING_APIS.has(route.api);
}
function isAnthropicReasoningRoute(route) {
	return typeof route?.api === "string" && ANTHROPIC_REASONING_APIS.has(route.api);
}
function isOpenAICompletionsRoute(route) {
	return typeof route?.api === "string" && OPENAI_COMPLETIONS_APIS.has(route.api);
}
function isGoogleOpenAICompletionsRoute(route) {
	return isOpenAICompletionsRoute(route) && (route?.provider === "google" || route?.endpointClass === "google-generative-ai" || route?.endpointClass === "google-vertex");
}
function isCustomProviderRoute(route) {
	return Boolean(route?.api && route.model && route.provider) && route?.api !== "mistral-conversations" && !isOpenAIResponsesRoute(route) && !isGoogleReasoningRoute(route) && !isAnthropicReasoningRoute(route) && !isOpenAICompletionsRoute(route);
}
function isGitHubCopilotResponsesRoute(route) {
	return (route?.api === "openai-responses" || route?.api === "operator-openai-responses-transport") && route.provider === "github-copilot";
}
function isStructurallyValidOpaqueReplayToken(value) {
	return value.length > 0 && value === value.trim() && OPAQUE_REPLAY_TOKEN_RE.test(value) && !value.includes("…");
}
function isCredentialSafeOpaqueReplayToken(value) {
	if (!isStructurallyValidOpaqueReplayToken(value)) return false;
	return value.startsWith("gAAAA") || require_redact.redactSensitiveText(value, { mode: "tools" }) === value;
}
function isGoogleThoughtSignature(value) {
	return value.length > 0 && value === value.trim() && !value.includes("…") && GOOGLE_THOUGHT_SIGNATURE_RE.test(value);
}
function resolveTranscriptAssistantRoute(source, cfg) {
	const api = typeof source.api === "string" ? source.api : void 0;
	const model = typeof source.model === "string" ? source.model : void 0;
	const provider = typeof source.provider === "string" ? source.provider : void 0;
	const providerConfig = provider ? (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(cfg?.models?.providers, provider) : void 0;
	const baseUrl = (model ? providerConfig?.models.find((candidate) => candidate.id === model) : void 0)?.baseUrl ?? providerConfig?.baseUrl;
	const endpointClass = baseUrl ? require_provider_attribution.resolveProviderEndpoint(baseUrl).endpointClass : void 0;
	return {
		...api ? { api } : {},
		...endpointClass ? { endpointClass } : {},
		...model ? { model } : {},
		...provider ? { provider } : {}
	};
}
function isSafeReplayIdentifier(value, maxLength = 512) {
	return value.length > 0 && value.length <= maxLength && value === value.trim() && /^[A-Za-z0-9+/_:.=-]+$/.test(value) && require_redact.redactSensitiveText(value, { mode: "tools" }) === value;
}
function isOpenAIResponseItemId(value, route) {
	return isSafeReplayIdentifier(value, isGitHubCopilotResponsesRoute(route) ? 64 : 512);
}
function isOpenAITextSignature(value, route) {
	if (value.startsWith("{")) try {
		const parsed = JSON.parse(value);
		if (!parsed || typeof parsed !== "object" || !isPlainTranscriptObject(parsed)) return false;
		if (!Object.keys(parsed).every((key) => key === "v" || key === "id" || key === "phase")) return false;
		const id = typeof parsed.id === "string" && isOpenAIResponseItemId(parsed.id, route) ? parsed.id : void 0;
		const phase = parsed.phase === "commentary" || parsed.phase === "final_answer" ? parsed.phase : void 0;
		if (parsed.id !== void 0 && id === void 0) return false;
		return parsed.v === 1 && (id !== void 0 || phase !== void 0);
	} catch {
		return false;
	}
	return isOpenAIResponseItemId(value, route);
}
const OPENAI_REASONING_REPLAY_METADATA_KEYS = /* @__PURE__ */ new Set([
	"v",
	"source",
	"provider",
	"api",
	"model",
	"baseUrlHash",
	"sessionHash",
	"authProfileHash"
]);
const OPENAI_REASONING_REPLAY_METADATA_KEY = "__operator_replay";
function sanitizeOpenAIReasoningReplayMetadata(value, route) {
	if (!value || typeof value !== "object" || !isPlainTranscriptObject(value) || !route?.api || !route.model || !route.provider) return;
	if (value.v !== 1 || value.source !== "openai-responses" || value.provider !== route?.provider || value.api !== route.api || value.model !== route.model || value.baseUrlHash !== void 0 && (typeof value.baseUrlHash !== "string" || !OPENAI_REPLAY_CONTEXT_HASH_RE.test(value.baseUrlHash)) || value.sessionHash !== void 0 && (typeof value.sessionHash !== "string" || !OPENAI_REPLAY_CONTEXT_HASH_RE.test(value.sessionHash)) || value.authProfileHash !== void 0 && (typeof value.authProfileHash !== "string" || !OPENAI_REPLAY_CONTEXT_HASH_RE.test(value.authProfileHash))) return;
	if (Object.keys(value).every((key) => OPENAI_REASONING_REPLAY_METADATA_KEYS.has(key))) return value;
	return {
		v: 1,
		source: "openai-responses",
		provider: value.provider,
		api: value.api,
		model: value.model,
		...value.baseUrlHash !== void 0 ? { baseUrlHash: value.baseUrlHash } : {},
		...value.sessionHash !== void 0 ? { sessionHash: value.sessionHash } : {},
		...value.authProfileHash !== void 0 ? { authProfileHash: value.authProfileHash } : {}
	};
}
function shouldPreserveOpaqueProviderPayload(source, key, item, location, route) {
	if (location !== "assistant-content-block" || typeof item !== "string") return false;
	const type = source.type;
	const isAnthropicSlot = type === "thinking" && (key === "thinkingSignature" || key === "signature") || type === "redacted_thinking" && (key === "data" || key === "signature" || key === "thinkingSignature");
	if (isAnthropicReasoningRoute(route) && isAnthropicSlot) return isStructurallyValidOpaqueReplayToken(item);
	const isGoogleSlot = type === "text" && key === "textSignature" || type === "thinking" && (key === "thinkingSignature" || key === "thought_signature") || type === "toolCall" && key === "thoughtSignature";
	if (isGoogleReasoningRoute(route) && isGoogleSlot) return isGoogleThoughtSignature(item);
	if (isGoogleOpenAICompletionsRoute(route) && type === "toolCall" && key === "thoughtSignature") return isStructurallyValidOpaqueReplayToken(item);
	if (!isCustomProviderRoute(route) || !isCredentialSafeOpaqueReplayToken(item)) return false;
	return type === "text" && key === "textSignature" || type === "thinking" && (key === "thinkingSignature" || key === "signature" || key === "thought_signature") || type === "redacted_thinking" && (key === "data" || key === "signature" || key === "thinkingSignature") || type === "toolCall" && key === "thoughtSignature";
}
function sanitizeOpenAIReasoningSignature(value, route) {
	let parsed;
	try {
		parsed = JSON.parse(value);
	} catch {
		return;
	}
	if (!parsed || typeof parsed !== "object" || !isPlainTranscriptObject(parsed) || parsed.type !== "reasoning" || parsed.summary !== void 0 && !Array.isArray(parsed.summary)) return;
	const encryptedContent = parsed.encrypted_content;
	const hasEncryptedContent = Object.hasOwn(parsed, "encrypted_content");
	const isValidEncryptedContent = isOpenAIResponsesRoute(route) ? isStructurallyValidOpaqueReplayToken : isCredentialSafeOpaqueReplayToken;
	if (encryptedContent !== void 0 && encryptedContent !== null && (typeof encryptedContent !== "string" || !isValidEncryptedContent(encryptedContent))) return;
	if (parsed.id !== void 0 && (typeof parsed.id !== "string" || !isOpenAIResponseItemId(parsed.id, route))) return;
	if (parsed.status !== void 0 && parsed.status !== "in_progress" && parsed.status !== "completed" && parsed.status !== "incomplete") return;
	if (!hasEncryptedContent && typeof parsed.id !== "string") return;
	const replayMetadata = sanitizeOpenAIReasoningReplayMetadata(parsed[OPENAI_REASONING_REPLAY_METADATA_KEY], route);
	return JSON.stringify({
		...typeof parsed.id === "string" ? { id: parsed.id } : {},
		type: "reasoning",
		summary: [],
		...parsed.status !== void 0 ? { status: parsed.status } : {},
		...hasEncryptedContent ? { encrypted_content: encryptedContent } : {},
		...replayMetadata ? { [OPENAI_REASONING_REPLAY_METADATA_KEY]: replayMetadata } : {}
	});
}
function sanitizeOpenAICompletionsToolSignature(value, route) {
	let parsed;
	try {
		parsed = JSON.parse(value);
	} catch {
		return;
	}
	const isValidEncryptedData = isOpenAICompletionsRoute(route) ? isStructurallyValidOpaqueReplayToken : isCredentialSafeOpaqueReplayToken;
	if (!parsed || typeof parsed !== "object" || !isPlainTranscriptObject(parsed) || parsed.type !== "reasoning.encrypted" || typeof parsed.data !== "string" || !isValidEncryptedData(parsed.data) || parsed.id !== void 0 && parsed.id !== null && (typeof parsed.id !== "string" || !isSafeReplayIdentifier(parsed.id)) || parsed.format !== void 0 && parsed.format !== null && (typeof parsed.format !== "string" || parsed.format.length > 64 || !/^[a-z0-9.-]+$/.test(parsed.format)) || parsed.index !== void 0 && (!Number.isSafeInteger(parsed.index) || parsed.index < 0)) return;
	return JSON.stringify({
		type: "reasoning.encrypted",
		data: parsed.data,
		...parsed.id !== void 0 ? { id: parsed.id } : {},
		...parsed.format !== void 0 ? { format: parsed.format } : {},
		...parsed.index !== void 0 ? { index: parsed.index } : {}
	});
}
function redactTranscriptStructuredValue(value, cfg, fieldKey, seen = /* @__PURE__ */ new WeakSet(), preserveImageDataUrlFields = false, location = "nested", assistantRoute) {
	if (typeof value === "string") {
		if (fieldKey) return redactTranscriptStructuredFieldValue(fieldKey, value, cfg);
		return redactTranscriptText(value, cfg);
	}
	if (Array.isArray(value)) {
		if (seen.has(value)) return "[Circular]";
		seen.add(value);
		let changed = false;
		const redacted = value.map((item) => {
			const next = redactTranscriptStructuredValue(item, cfg, fieldKey, seen, preserveImageDataUrlFields, location === "assistant-content-array" ? "assistant-content-block" : "nested", assistantRoute);
			changed ||= next !== item;
			return next;
		});
		seen.delete(value);
		return changed ? redacted : value;
	}
	if (!value || typeof value !== "object") return value;
	if (seen.has(value)) return "[Circular]";
	if (!isPlainTranscriptObject(value)) return value;
	seen.add(value);
	const source = sanitizeImageRecord(value) ?? value;
	const currentAssistantRoute = location === "root" && source.role === "assistant" ? resolveTranscriptAssistantRoute(source, cfg) : assistantRoute;
	let next = null;
	if (source !== value) next = { ...source };
	for (const [key, item] of Object.entries(source)) {
		if (location === "assistant-content-block" && (isOpenAIResponsesRoute(currentAssistantRoute) || isCustomProviderRoute(currentAssistantRoute)) && source.type === "thinking" && key === "operatorReasoningReplay") {
			const sanitizedMetadata = sanitizeOpenAIReasoningReplayMetadata(item, currentAssistantRoute);
			if (sanitizedMetadata !== void 0) {
				if (sanitizedMetadata !== item) {
					next ??= { ...source };
					next[key] = sanitizedMetadata;
				}
				continue;
			}
		}
		if (location === "assistant-content-block" && (isOpenAIResponsesRoute(currentAssistantRoute) || isCustomProviderRoute(currentAssistantRoute)) && source.type === "thinking" && key === "thinkingSignature" && typeof item === "string") {
			const sanitizedSignature = sanitizeOpenAIReasoningSignature(item, currentAssistantRoute);
			if (sanitizedSignature !== void 0) {
				if (sanitizedSignature !== item) {
					next ??= { ...source };
					next[key] = sanitizedSignature;
				}
				continue;
			}
		}
		if (location === "assistant-content-block" && (isOpenAIResponsesRoute(currentAssistantRoute) || isCustomProviderRoute(currentAssistantRoute)) && source.type === "text" && key === "textSignature" && typeof item === "string" && isOpenAITextSignature(item, currentAssistantRoute)) continue;
		if (location === "assistant-content-block" && (isOpenAICompletionsRoute(currentAssistantRoute) || isCustomProviderRoute(currentAssistantRoute)) && source.type === "toolCall" && key === "thoughtSignature" && typeof item === "string") {
			const sanitizedSignature = sanitizeOpenAICompletionsToolSignature(item, currentAssistantRoute);
			if (sanitizedSignature !== void 0) {
				if (sanitizedSignature !== item) {
					next ??= { ...source };
					next[key] = sanitizedSignature;
				}
				continue;
			}
		}
		if (shouldPreserveOpaqueProviderPayload(source, key, item, location, currentAssistantRoute)) continue;
		if (typeof item === "string") {
			const sanitizedDataUrl = preserveImageDataUrlFields && key === "url" ? startsWithDataUrl(item) ? (0, _gabrielvfonseca_media_core_inline_image_data_url.sanitizeInlineImageDataUrlForStorage)(item) : void 0 : sanitizeImageDataUrlField(source, key, item);
			if (sanitizedDataUrl !== void 0) {
				if (sanitizedDataUrl !== item) {
					next ??= { ...source };
					next[key] = sanitizedDataUrl;
				}
				continue;
			}
		}
		if (shouldPreserveOpaqueImagePayload(source, key, item, preserveImageDataUrlFields)) continue;
		const redacted = redactTranscriptStructuredValue(item, cfg, key, seen, preserveImageDataUrlFields || shouldPreserveNestedImageDataUrlFields(source, key), location === "root" && source.role === "assistant" && key === "content" && Array.isArray(item) ? "assistant-content-array" : "nested", currentAssistantRoute);
		if (redacted === item) continue;
		next ??= { ...source };
		next[key] = redacted;
	}
	seen.delete(value);
	return next ?? value;
}
/** Return a redacted transcript message according to logging config. */
function redactTranscriptMessage(message, cfg) {
	if (isTranscriptRedactionDisabled(cfg)) return message;
	return redactTranscriptStructuredValue(message, cfg, void 0, /* @__PURE__ */ new WeakSet(), false, "root");
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-transcript-store.ts
function appendTranscriptEventInTransaction(database, scope, event, options = {}) {
	const db = getSessionKysely(database.db);
	const createdAt = readEventTimestamp(event) ?? Date.now();
	ensureTranscriptSessionRoot(database, scope, createdAt);
	const identity = readTranscriptEventIdentity(event);
	if (identity && readTranscriptIdentityByEventId(database, scope.sessionId, identity.eventId)) return false;
	if (identity?.messageIdempotencyKey && options.dedupeByMessageIdempotency && readTranscriptIdentityByMessageIdempotencyKey(database, scope.sessionId, identity.messageIdempotencyKey)) return false;
	const seq = readNextTranscriptSeq(database, scope.sessionId);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("transcript_events").values({
		session_id: scope.sessionId,
		seq,
		event_json: JSON.stringify(event),
		created_at: createdAt
	}));
	if (options.touchMutation !== false) touchTranscriptMutationInTransaction(database, scope.sessionId);
	indexAppendedTranscriptEventInTransaction(database.db, {
		sessionId: scope.sessionId,
		seq,
		event,
		eventId: identity?.eventId ?? null,
		createdAt
	});
	if (!identity) return true;
	const indexedMessageIdempotencyKey = identity.messageIdempotencyKey && !options.dedupeByMessageIdempotency && readTranscriptIdentityByMessageIdempotencyKey(database, scope.sessionId, identity.messageIdempotencyKey) ? void 0 : identity.messageIdempotencyKey;
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("transcript_event_identities").values({
		session_id: scope.sessionId,
		event_id: identity.eventId,
		seq,
		event_type: identity.eventType,
		parent_id: identity.parentId,
		message_idempotency_key: indexedMessageIdempotencyKey,
		created_at: createdAt
	}).onConflict((conflict) => conflict.columns(["session_id", "event_id"]).doNothing()));
	return true;
}
function appendTranscriptEventsInTransaction(database, scope, events) {
	let appended = 0;
	for (const event of events) if (appendTranscriptEventInTransaction(database, scope, event, { touchMutation: false })) appended += 1;
	if (appended > 0) touchTranscriptMutationInTransaction(database, scope.sessionId);
	return appended;
}
function appendTranscriptEventRowInTransaction(database, scope, event, seq, state) {
	const db = getSessionKysely(database.db);
	const createdAt = readEventTimestamp(event) ?? Date.now();
	const identity = readTranscriptEventIdentity(event);
	if (identity && state.seenEventIds.has(identity.eventId)) return false;
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("transcript_events").values({
		session_id: scope.sessionId,
		seq,
		event_json: JSON.stringify(event),
		created_at: createdAt
	}));
	indexAppendedTranscriptEventInTransaction(database.db, {
		sessionId: scope.sessionId,
		seq,
		event,
		eventId: identity?.eventId ?? null,
		createdAt
	});
	if (!identity) return true;
	state.seenEventIds.add(identity.eventId);
	const indexedMessageIdempotencyKey = identity.messageIdempotencyKey && !state.seenMessageIdempotencyKeys.has(identity.messageIdempotencyKey) ? identity.messageIdempotencyKey : void 0;
	if (indexedMessageIdempotencyKey) state.seenMessageIdempotencyKeys.add(indexedMessageIdempotencyKey);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("transcript_event_identities").values({
		session_id: scope.sessionId,
		event_id: identity.eventId,
		seq,
		event_type: identity.eventType,
		parent_id: identity.parentId,
		message_idempotency_key: indexedMessageIdempotencyKey,
		created_at: createdAt
	}));
	return true;
}
function ensureTranscriptHeader(database, scope, cwd, now) {
	const db = getSessionKysely(database.db);
	if (require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("transcript_events").select("seq").where("session_id", "=", scope.sessionId).limit(1))) return;
	appendTranscriptEventInTransaction(database, scope, createSessionTranscriptHeader({
		cwd,
		sessionId: scope.sessionId
	}));
	ensureTranscriptSessionRoot(database, scope, now);
}
function readActiveTranscriptAppendParentId(database, sessionId) {
	const db = getSessionKysely(database.db);
	const latest = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("transcript_event_identities as ti").innerJoin("transcript_events as te", (join) => join.onRef("te.session_id", "=", "ti.session_id").onRef("te.seq", "=", "ti.seq")).select(["ti.event_type", "te.event_json"]).where("ti.session_id", "=", sessionId).orderBy("ti.seq", "desc").limit(1));
	if (!latest) return null;
	try {
		const event = JSON.parse(latest.event_json);
		const treeEntry = require_transcript_tree.parseSessionTranscriptTreeEntry(event);
		if (!treeEntry) return resolveVisibleTranscriptAppendParentId(loadSqliteTranscriptEventsFromDatabase(database, sessionId));
		if (latest.event_type !== "leaf") return treeEntry.appendParentId;
		const leafReferencesKnown = treeEntry.leafId !== void 0 && transcriptTreeReferenceExists(database, sessionId, treeEntry.leafId) && transcriptTreeReferenceExists(database, sessionId, treeEntry.appendParentId);
		if (require_transcript_tree.isSessionTranscriptLeafControl(event) && leafReferencesKnown) return treeEntry.appendParentId;
	} catch {}
	return resolveVisibleTranscriptAppendParentId(loadSqliteTranscriptEventsFromDatabase(database, sessionId));
}
function transcriptTreeReferenceExists(database, sessionId, eventId) {
	return eventId === null || readTranscriptIdentityByEventId(database, sessionId, eventId) !== void 0;
}
function replaceSqliteTranscriptEventsInTransaction(database, resolved, events) {
	const deleted = deleteSqliteTranscriptEventsInTransaction(database, resolved.sessionId);
	if (events.length === 0) {
		if (deleted) touchTranscriptMutationInTransaction(database, resolved.sessionId);
		return;
	}
	ensureTranscriptSessionRoot(database, resolved, readEventTimestamp(events[0]) ?? Date.now());
	let seq = 0;
	const seenEventIds = /* @__PURE__ */ new Set();
	const seenMessageIdempotencyKeys = /* @__PURE__ */ new Set();
	for (const event of events) if (appendTranscriptEventRowInTransaction(database, resolved, event, seq, {
		seenEventIds,
		seenMessageIdempotencyKeys
	})) seq += 1;
	if (deleted || seq > 0) touchTranscriptMutationInTransaction(database, resolved.sessionId);
}
function readTranscriptIdentityByEventId(database, sessionId, eventId) {
	const db = getSessionKysely(database.db);
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("transcript_event_identities").select(["event_id", "seq"]).where("session_id", "=", sessionId).where("event_id", "=", eventId));
	return row ? {
		eventId: row.event_id,
		seq: row.seq
	} : void 0;
}
function readTranscriptIdentityByMessageIdempotencyKey(database, sessionId, idempotencyKey) {
	const db = getSessionKysely(database.db);
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("transcript_event_identities").select(["event_id", "seq"]).where("session_id", "=", sessionId).where("message_idempotency_key", "=", idempotencyKey).orderBy("seq", "desc").limit(1));
	return row ? {
		eventId: row.event_id,
		seq: row.seq
	} : void 0;
}
function readTranscriptMessageByIdempotencyKey(database, scope, idempotencyKey) {
	const identity = readTranscriptIdentityByMessageIdempotencyKey(database, scope.sessionId, idempotencyKey);
	return identity ? readTranscriptMessageByIdentity(database, scope, identity) : void 0;
}
function readTranscriptMessageByScopedIdempotencyKey(database, scope, idempotencyKey, lookup) {
	if (lookup !== "scan-assistant") return readTranscriptMessageByIdempotencyKey(database, scope, idempotencyKey);
	const found = findSqliteTranscriptEventInDatabase(database, scope.sessionId, (event) => {
		const message = readTranscriptEventMessage(event);
		return message?.role === "assistant" && message.idempotencyKey === idempotencyKey;
	});
	if (!found) return;
	const message = readTranscriptEventMessage(found.event);
	return message ? {
		messageId: readTranscriptEventId(found.event) ?? idempotencyKey,
		message
	} : void 0;
}
function readTranscriptMessageByEventId(database, scope, eventId) {
	const identity = readTranscriptIdentityByEventId(database, scope.sessionId, eventId);
	return identity ? readTranscriptMessageByIdentity(database, scope, identity) : void 0;
}
function readTranscriptMessageByIdentity(database, scope, identity) {
	const db = getSessionKysely(database.db);
	const eventRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("transcript_events").select(["event_json"]).where("session_id", "=", scope.sessionId).where("seq", "=", identity.seq));
	if (!eventRow) return;
	const event = JSON.parse(eventRow.event_json);
	return {
		messageId: identity.eventId,
		message: event.message
	};
}
function readTranscriptEventIdentity(event) {
	if (!event || typeof event !== "object" || Array.isArray(event)) return;
	const record = event;
	const eventId = typeof record.id === "string" && record.id.trim() ? record.id.trim() : void 0;
	return eventId ? {
		eventId,
		eventType: typeof record.type === "string" ? record.type : null,
		parentId: typeof record.parentId === "string" ? record.parentId : null,
		messageIdempotencyKey: readMessageIdempotencyKey(record.message)
	} : void 0;
}
function readMessageIdempotencyKey(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return null;
	const value = message.idempotencyKey;
	return typeof value === "string" && value.trim() ? value.trim() : null;
}
function readEventTimestamp(event) {
	if (!event || typeof event !== "object" || Array.isArray(event)) return;
	const value = event.timestamp;
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string" || !value.trim()) return;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : void 0;
}
function redactTranscriptMessageForStorage(message, options) {
	return isTranscriptAgentMessage(message) ? redactTranscriptMessage(message, options.config) : require_redact.redactSecrets(message);
}
function isTranscriptAgentMessage(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) && typeof value.role === "string";
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-parent-session.ts
async function forkSqliteSessionTranscriptFromParent(params) {
	const resolved = resolveSqliteScope({
		...params.agentId ? { agentId: params.agentId } : {},
		sessionKey: params.sessionKey,
		storePath: params.storePath
	});
	const target = params.targetStorePath ? resolveSqliteScope({
		sessionKey: params.sessionKey,
		storePath: params.targetStorePath
	}) : resolved;
	if (!(target.agentId !== resolved.agentId || (target.path ?? "") !== (resolved.path ?? ""))) return await runExclusiveSqliteSessionWrite(resolved, async () => {
		let result = { status: "failed" };
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
			result = forkSqliteParentTranscriptInTransaction(database, resolved, {
				parentEntry: params.parentEntry,
				parentSessionKey: params.parentSessionKey,
				targetSessionId: params.targetSessionId,
				targetSessionKey: params.sessionKey
			});
		}, toDatabaseOptions(resolved));
		return result;
	});
	if (!params.parentEntry.sessionId) return { status: "missing-parent" };
	const source = resolveSqliteParentForkSourceTranscript(loadSqliteTranscriptEventsFromDatabase(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)), params.parentEntry.sessionId));
	if (!source) return { status: "failed" };
	const parentSessionFile = formatSqliteSessionMarkerForScope({
		...resolved,
		sessionId: params.parentEntry.sessionId,
		sessionKey: normalizeSqliteSessionKey(params.parentSessionKey)
	});
	return await runExclusiveSqliteSessionWrite(target, async () => {
		const sessionId = params.targetSessionId ?? (0, node_crypto.randomUUID)();
		const targetScope = {
			...target,
			sessionId,
			sessionKey: normalizeSqliteSessionKey(params.sessionKey)
		};
		const sessionFile = formatSqliteSessionMarkerForScope(targetScope);
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
			writeSqliteForkedChildTranscriptInTransaction(database, targetScope, {
				parentSessionFile,
				source
			});
		}, toDatabaseOptions(target));
		return {
			status: "created",
			transcript: {
				sessionFile,
				sessionId
			}
		};
	});
}
/** Forks parent context into a child session entry using SQLite rows only. */
async function forkSqliteSessionEntryFromParentTarget(params) {
	const resolved = resolveSqliteStoreScope(params.storePath, { agentId: params.agentId });
	const parentTarget = normalizeSqliteLifecycleTarget(params.parentTarget);
	const sessionTarget = normalizeSqliteLifecycleTarget(params.sessionTarget);
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved));
		const parent = resolveSqliteLifecyclePrimaryEntry(database, parentTarget);
		if (!parent?.entry.sessionId) return { status: "missing-parent" };
		const base = resolveSqliteLifecyclePrimaryEntry(database, sessionTarget)?.entry ?? params.fallbackEntry;
		if (!base) return { status: "missing-entry" };
		if (params.skipForkWhen?.(cloneSessionEntry(base))) {
			const sessionEntry = await persistSqliteParentForkSkipPatch({
				entry: base,
				params,
				sessionTarget,
				patch: params.skipPatch?.(cloneSessionEntry(base)),
				resolved
			});
			return {
				status: "skipped",
				reason: "existing-entry",
				parentEntry: cloneSessionEntry(parent.entry),
				sessionEntry
			};
		}
		const transcriptParentTokens = typeof require_store.resolveFreshSessionTotalTokens(parent.entry) !== "number" && typeof parent.entry.sessionId === "string" && parent.entry.sessionId.length > 0 ? estimateSqliteTranscriptPromptTokens(loadSqliteTranscriptEventsFromDatabase(database, parent.entry.sessionId)) : void 0;
		const decision = resolveSqliteParentForkDecision(parent.entry, transcriptParentTokens);
		if (decision.status === "skip") {
			const patch = params.decisionSkipPatch?.({
				decision,
				entry: cloneSessionEntry(base),
				parentEntry: cloneSessionEntry(parent.entry)
			});
			const sessionEntry = await persistSqliteParentForkSkipPatch({
				entry: base,
				params,
				sessionTarget,
				patch,
				resolved
			});
			return {
				status: "skipped",
				reason: "decision-skip",
				parentEntry: cloneSessionEntry(parent.entry),
				sessionEntry,
				decision
			};
		}
		let result = { status: "failed" };
		const maintenancePlans = [];
		let previousIdentity = /* @__PURE__ */ new Map();
		let currentIdentity = /* @__PURE__ */ new Map();
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((writeDatabase) => {
			const freshParent = resolveSqliteLifecyclePrimaryEntry(writeDatabase, parentTarget)?.entry;
			if (!freshParent?.sessionId) {
				result = { status: "missing-parent" };
				return;
			}
			const freshBase = resolveSqliteLifecyclePrimaryEntry(writeDatabase, sessionTarget)?.entry ?? params.fallbackEntry;
			if (!freshBase) {
				result = { status: "missing-entry" };
				return;
			}
			const fork = forkSqliteParentTranscriptInTransaction(writeDatabase, resolved, {
				parentEntry: freshParent,
				parentSessionKey: parentTarget.canonicalKey,
				targetSessionKey: sessionTarget.canonicalKey
			});
			if (fork.status !== "created") {
				result = fork.status === "missing-parent" ? { status: "missing-parent" } : { status: "failed" };
				return;
			}
			const patch = params.patch?.({
				decision,
				entry: cloneSessionEntry(freshBase),
				fork: fork.transcript,
				parentEntry: cloneSessionEntry(freshParent)
			});
			const next = require_store.mergeSessionEntry(freshBase, {
				...patch,
				forkedFromParent: true,
				sessionFile: fork.transcript.sessionFile,
				sessionId: fork.transcript.sessionId
			});
			previousIdentity = readSqliteSessionIdentitySnapshot(writeDatabase, sessionTarget.storeKeys);
			deleteSqliteLifecycleTargetRows(writeDatabase, sessionTarget);
			writeSessionEntry(writeDatabase, sessionTarget.canonicalKey, next);
			maintenancePlans.push(applySqliteSessionEntryMaintenance(writeDatabase, {
				activeSessionKey: sessionTarget.canonicalKey,
				archiveDirectory: resolveSqliteTranscriptArchiveDirectory(resolved),
				skipMaintenance: true
			}));
			currentIdentity = readSqliteSessionIdentitySnapshot(writeDatabase, sessionTarget.storeKeys);
			result = {
				status: "forked",
				decision,
				fork: fork.transcript,
				parentEntry: cloneSessionEntry(freshParent),
				sessionEntry: cloneSessionEntry(next)
			};
		}, toDatabaseOptions(resolved));
		emitCommittedSessionIdentityDiff(previousIdentity, currentIdentity);
		finalizeSqliteSessionEntryMaintenancePlansBestEffort(resolved, maintenancePlans);
		return result;
	});
}
async function persistSqliteParentForkSkipPatch(params) {
	if (!params.patch) return cloneSessionEntry(params.entry);
	const next = preserveSqliteSameKeySessionRolloverLineage({
		next: require_store.mergeSessionEntry(params.entry, params.patch),
		previous: params.entry,
		sessionKey: params.sessionTarget.canonicalKey
	});
	const maintenancePlans = [];
	let previousIdentity = /* @__PURE__ */ new Map();
	let currentIdentity = /* @__PURE__ */ new Map();
	require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
		previousIdentity = readSqliteSessionIdentitySnapshot(database, params.sessionTarget.storeKeys);
		deleteSqliteLifecycleTargetRows(database, params.sessionTarget);
		writeSessionEntry(database, params.sessionTarget.canonicalKey, next);
		maintenancePlans.push(applySqliteSessionEntryMaintenance(database, {
			activeSessionKey: params.sessionTarget.canonicalKey,
			archiveDirectory: resolveSqliteTranscriptArchiveDirectory(params.resolved),
			skipMaintenance: true
		}));
		currentIdentity = readSqliteSessionIdentitySnapshot(database, params.sessionTarget.storeKeys);
	}, toDatabaseOptions(params.resolved));
	emitCommittedSessionIdentityDiff(previousIdentity, currentIdentity);
	finalizeSqliteSessionEntryMaintenancePlansBestEffort(params.resolved, maintenancePlans);
	return cloneSessionEntry(next);
}
/** Cleans scoped session lifecycle rows and associated SQLite transcript state. */
async function resolveSqliteSessionParentForkDecision(params) {
	const parentSessionId = typeof params.parentEntry.sessionId === "string" ? params.parentEntry.sessionId : "";
	if (!(typeof require_store.resolveFreshSessionTotalTokens(params.parentEntry) !== "number" && parentSessionId.length > 0)) return resolveSqliteParentForkDecision(params.parentEntry);
	const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolveSqliteStoreScope(params.storePath)));
	return resolveSqliteParentForkDecision(params.parentEntry, estimateSqliteTranscriptPromptTokens(loadSqliteTranscriptEventsFromDatabase(database, parentSessionId)));
}
function forkSqliteParentTranscriptInTransaction(database, resolved, params) {
	if (!params.parentEntry.sessionId) return { status: "missing-parent" };
	const source = resolveSqliteParentForkSourceTranscript(loadSqliteTranscriptEventsFromDatabase(database, params.parentEntry.sessionId));
	if (!source) return { status: "failed" };
	const sessionId = params.targetSessionId ?? (0, node_crypto.randomUUID)();
	const targetScope = {
		...resolved,
		sessionId,
		sessionKey: normalizeSqliteSessionKey(params.targetSessionKey)
	};
	const parentSessionFile = formatSqliteSessionMarkerForScope({
		...resolved,
		sessionId: params.parentEntry.sessionId,
		sessionKey: normalizeSqliteSessionKey(params.parentSessionKey)
	});
	const sessionFile = formatSqliteSessionMarkerForScope(targetScope);
	writeSqliteForkedChildTranscriptInTransaction(database, targetScope, {
		parentSessionFile,
		source
	});
	return {
		status: "created",
		transcript: {
			sessionFile,
			sessionId
		}
	};
}
function writeSqliteForkedChildTranscriptInTransaction(database, targetScope, params) {
	appendTranscriptEventsInTransaction(database, targetScope, buildSqliteForkedChildTranscriptEvents({
		parentSessionFile: params.parentSessionFile,
		source: params.source,
		targetSessionId: targetScope.sessionId
	}));
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-checkpoint.ts
async function branchSqliteCompactionCheckpointSession(params) {
	const sourceKey = normalizeSqliteSessionKey(params.sourceStoreKey ?? params.sourceKey);
	const targetKey = normalizeSqliteSessionKey(params.nextKey);
	const resolved = resolveSqliteScope({
		...params.agentId ? { agentId: params.agentId } : {},
		...params.env ? { env: params.env } : {},
		sessionKey: sourceKey,
		...params.storePath ? { storePath: params.storePath } : {}
	});
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		let result;
		let previousIdentity = /* @__PURE__ */ new Map();
		let currentIdentity = /* @__PURE__ */ new Map();
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
			const identityKeys = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...collectSessionEntryLookupKeys(database, sourceKey), ...collectSessionEntryLookupKeys(database, targetKey)]);
			previousIdentity = readSqliteSessionIdentitySnapshot(database, identityKeys);
			result = branchSqliteCompactionCheckpointSessionInTransaction(database, {
				checkpointId: params.checkpointId,
				parentSessionKey: normalizeSqliteSessionKey(params.sourceKey),
				resolved,
				sourceKey,
				targetKey
			});
			currentIdentity = readSqliteSessionIdentitySnapshot(database, identityKeys);
		}, toDatabaseOptions(resolved));
		emitCommittedSessionIdentityDiff(previousIdentity, currentIdentity);
		return result ?? { status: "failed" };
	});
}
/** Restores a SQLite session from a compaction checkpoint in one queued transaction. */
async function restoreSqliteCompactionCheckpointSession(params) {
	const sessionKey = normalizeSqliteSessionKey(params.sessionStoreKey ?? params.sessionKey);
	const targetKey = normalizeSqliteSessionKey(params.sessionKey);
	const resolved = resolveSqliteScope({
		...params.agentId ? { agentId: params.agentId } : {},
		...params.env ? { env: params.env } : {},
		sessionKey,
		...params.storePath ? { storePath: params.storePath } : {}
	});
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		let result;
		let previousIdentity = /* @__PURE__ */ new Map();
		let currentIdentity = /* @__PURE__ */ new Map();
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
			const identityKeys = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...collectSessionEntryLookupKeys(database, sessionKey), ...collectSessionEntryLookupKeys(database, targetKey)]);
			previousIdentity = readSqliteSessionIdentitySnapshot(database, identityKeys);
			result = restoreSqliteCompactionCheckpointSessionInTransaction(database, {
				checkpointId: params.checkpointId,
				resolved,
				sourceKey: sessionKey,
				targetKey
			});
			currentIdentity = readSqliteSessionIdentitySnapshot(database, identityKeys);
		}, toDatabaseOptions(resolved));
		emitCommittedSessionIdentityDiff(previousIdentity, currentIdentity);
		return result ?? { status: "failed" };
	});
}
/** Publishes a transcript update using the SQLite transcript scope target. */
function branchSqliteCompactionCheckpointSessionInTransaction(database, params) {
	const currentEntry = readSessionEntryRow(database, params.sourceKey)?.entry;
	if (!currentEntry?.sessionId) return { status: "missing-session" };
	const checkpoint = readSessionCompactionCheckpoint(currentEntry, params.checkpointId);
	if (!checkpoint) return { status: "missing-checkpoint" };
	const forked = forkSqliteCheckpointTranscriptInTransaction(database, params.resolved, {
		checkpoint,
		targetSessionKey: params.targetKey
	});
	if (forked.status !== "created") return forked;
	const nextEntry = cloneSqliteCheckpointSessionEntry({
		currentEntry,
		label: currentEntry.label?.trim() ? `${currentEntry.label.trim()} (checkpoint)` : "Checkpoint branch",
		nextSessionFile: forked.sessionFile,
		nextSessionId: forked.sessionId,
		parentSessionKey: params.parentSessionKey,
		totalTokens: forked.totalTokens
	});
	writeSessionEntry(database, params.targetKey, nextEntry);
	return {
		status: "created",
		key: params.targetKey,
		checkpoint,
		entry: nextEntry
	};
}
function restoreSqliteCompactionCheckpointSessionInTransaction(database, params) {
	const currentEntry = readSessionEntryRow(database, params.sourceKey)?.entry;
	if (!currentEntry?.sessionId) return { status: "missing-session" };
	const checkpoint = readSessionCompactionCheckpoint(currentEntry, params.checkpointId);
	if (!checkpoint) return { status: "missing-checkpoint" };
	const restored = forkSqliteCheckpointTranscriptInTransaction(database, params.resolved, {
		checkpoint,
		targetSessionKey: params.targetKey
	});
	if (restored.status !== "created") return restored;
	const nextEntry = cloneSqliteCheckpointSessionEntry({
		currentEntry,
		nextSessionFile: restored.sessionFile,
		nextSessionId: restored.sessionId,
		preserveCompactionCheckpoints: true,
		totalTokens: restored.totalTokens
	});
	writeSessionEntry(database, params.targetKey, nextEntry);
	return {
		status: "created",
		key: params.targetKey,
		checkpoint,
		entry: nextEntry
	};
}
function forkSqliteCheckpointTranscriptInTransaction(database, resolved, params) {
	const sources = resolveSqliteCheckpointTranscriptForkSources(params.checkpoint);
	if (sources.length === 0) return { status: "missing-boundary" };
	let lastFailure = { status: "missing-boundary" };
	let selected;
	for (const source of sources) {
		const rows = readSqliteTranscriptRowsForFork(database, source);
		if (rows.status === "created") {
			selected = {
				source,
				rows: rows.events
			};
			break;
		}
		lastFailure = rows;
	}
	if (!selected) return lastFailure;
	const sessionId = (0, node_crypto.randomUUID)();
	const targetScope = {
		...resolved,
		sessionId,
		sessionKey: params.targetSessionKey
	};
	const sessionFile = formatSqliteSessionMarkerForScope(targetScope);
	appendTranscriptEventsInTransaction(database, targetScope, [createSessionTranscriptHeader({
		cwd: readTranscriptHeaderCwd(selected.rows),
		sessionId
	}), ...selected.rows.filter((event) => !isSessionTranscriptHeader(event))]);
	return {
		status: "created",
		sessionId,
		sessionFile,
		...typeof selected.source.totalTokens === "number" ? { totalTokens: selected.source.totalTokens } : {}
	};
}
function resolveSqliteCheckpointTranscriptForkSources(checkpoint) {
	const sources = [];
	if (checkpoint.preCompaction.sessionId) {
		const preLeafId = checkpoint.preCompaction.entryId ?? checkpoint.preCompaction.leafId;
		sources.push({
			sessionId: checkpoint.preCompaction.sessionId,
			...preLeafId ? { leafId: preLeafId } : {},
			...typeof checkpoint.tokensBefore === "number" ? { totalTokens: checkpoint.tokensBefore } : {}
		});
	}
	const postLeafId = checkpoint.postCompaction.entryId ?? checkpoint.postCompaction.leafId;
	if (checkpoint.postCompaction.sessionId && postLeafId) sources.push({
		sessionId: checkpoint.postCompaction.sessionId,
		leafId: postLeafId,
		...typeof checkpoint.tokensAfter === "number" ? { totalTokens: checkpoint.tokensAfter } : {}
	});
	return sources;
}
function readSqliteTranscriptRowsForFork(database, source) {
	const boundarySeq = source.leafId ? readTranscriptIdentityByEventId(database, source.sessionId, source.leafId)?.seq : void 0;
	if (source.leafId && boundarySeq === void 0) return { status: "missing-boundary" };
	const query = getSessionKysely(database.db).selectFrom("transcript_events").select(["event_json", "seq"]).where("session_id", "=", source.sessionId).orderBy("seq", "asc");
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, boundarySeq === void 0 ? query : query.where("seq", "<=", boundarySeq)).rows;
	if (rows.length === 0) return { status: "failed" };
	try {
		return {
			status: "created",
			events: rows.map((row) => JSON.parse(row.event_json))
		};
	} catch {
		return { status: "failed" };
	}
}
function readSessionCompactionCheckpoint(entry, checkpointId) {
	const normalizedCheckpointId = checkpointId.trim();
	if (!normalizedCheckpointId || !Array.isArray(entry.compactionCheckpoints)) return;
	return entry.compactionCheckpoints.find((checkpoint) => checkpoint.checkpointId === normalizedCheckpointId);
}
function cloneSqliteCheckpointSessionEntry(params) {
	const hasTotalTokens = typeof params.totalTokens === "number" && Number.isFinite(params.totalTokens);
	return {
		...params.currentEntry,
		sessionId: params.nextSessionId,
		sessionFile: params.nextSessionFile,
		updatedAt: Date.now(),
		systemSent: false,
		abortedLastRun: false,
		startedAt: void 0,
		endedAt: void 0,
		runtimeMs: void 0,
		status: void 0,
		inputTokens: void 0,
		outputTokens: void 0,
		cacheRead: void 0,
		cacheWrite: void 0,
		estimatedCostUsd: void 0,
		totalTokens: hasTotalTokens ? params.totalTokens : void 0,
		totalTokensFresh: hasTotalTokens ? true : void 0,
		label: params.label ?? params.currentEntry.label,
		parentSessionKey: params.parentSessionKey ?? params.currentEntry.parentSessionKey,
		compactionCheckpoints: params.preserveCompactionCheckpoints ? params.currentEntry.compactionCheckpoints : void 0
	};
}
function readTranscriptHeaderCwd(events) {
	const header = events.find(isSessionTranscriptHeader);
	return typeof header?.cwd === "string" && header.cwd.trim() ? header.cwd : void 0;
}
function isSessionTranscriptHeader(event) {
	return Boolean(event && typeof event === "object" && !Array.isArray(event) && event.type === "session");
}
/** Records inbound session metadata without refreshing activity timestamps. */
//#endregion
//#region src/config/sessions/session-transcript-turn-state.ts
function sessionMatchesExpectedTranscriptTurn(selected, expected) {
	const expectedState = expected.expectedSessionState;
	return Boolean(selected && selected.entry.sessionId === expected.expectedSessionId && (expected.expectedLifecycleRevision === void 0 || selected.entry.lifecycleRevision === expected.expectedLifecycleRevision) && (expectedState === void 0 || selected.entry.abortedLastRun === expectedState.abortedLastRun && selected.entry.restartRecoveryBeforeAgentReplyState === expectedState.restartRecoveryBeforeAgentReplyState && selected.entry.restartRecoveryDeliveryReceiptState === expectedState.restartRecoveryDeliveryReceiptState && selected.entry.restartRecoveryDeliveryToolCallId === expectedState.restartRecoveryDeliveryToolCallId && selected.entry.restartRecoveryDeliveryRequestFingerprint === expectedState.restartRecoveryDeliveryRequestFingerprint && selected.entry.restartRecoveryDeliveryRunId === expectedState.restartRecoveryDeliveryRunId && selected.entry.restartRecoveryDeliverySourceRunId === expectedState.restartRecoveryDeliverySourceRunId && selected.entry.restartRecoveryRequesterAccountId === expectedState.restartRecoveryRequesterAccountId && selected.entry.restartRecoveryRequesterSenderId === expectedState.restartRecoveryRequesterSenderId && selected.entry.restartRecoverySameChannelThreadRequired === expectedState.restartRecoverySameChannelThreadRequired && selected.entry.restartRecoverySourceIngress === expectedState.restartRecoverySourceIngress && selected.entry.restartRecoverySourceReplyDeliveryMode === expectedState.restartRecoverySourceReplyDeliveryMode && require_store.sameRestartRecoveryTerminalRunIds(selected.entry.restartRecoveryTerminalRunIds, expectedState.restartRecoveryTerminalRunIds) && selected.entry.status === expectedState.status && selected.entry.updatedAt === expectedState.updatedAt));
}
function buildExpectedTranscriptTurnSessionPatch(params) {
	const appendedCount = params.appendedMessages.filter((message) => message.appended).length;
	const acceptedMessage = appendedCount > 0 || params.expectedSessionState !== void 0 && params.appendedMessages.some((message) => !message.appended);
	const touchUpdatedAt = params.touchSessionEntry === true && appendedCount > 0 ? Date.now() : 0;
	const restartRecoveryTerminalRunIds = params.sessionLifecyclePatch?.restartRecoveryTerminalRunIds ? require_store.mergeRestartRecoveryTerminalRunIds(params.currentEntry.restartRecoveryTerminalRunIds, params.sessionLifecyclePatch.restartRecoveryTerminalRunIds) : void 0;
	return {
		...acceptedMessage ? params.sessionLifecyclePatch : void 0,
		...acceptedMessage && restartRecoveryTerminalRunIds ? { restartRecoveryTerminalRunIds } : {},
		...params.currentEntry.sessionFile === params.sessionFile ? {} : { sessionFile: params.sessionFile },
		...touchUpdatedAt > 0 ? { updatedAt: Math.max(params.currentEntry.updatedAt ?? 0, params.sessionLifecyclePatch?.updatedAt ?? 0, touchUpdatedAt) } : {}
	};
}
//#endregion
//#region src/config/sessions/session-accessor.sqlite-transcript-write.ts
var SqliteTranscriptMutationConflictError = class extends Error {
	constructor(sessionId) {
		super(`SQLite transcript changed while preparing rewrite for ${sessionId}`);
		this.name = "SqliteTranscriptMutationConflictError";
	}
};
async function replaceSqliteTranscriptEvents(scope, events) {
	const resolved = resolveSqliteTranscriptScope(scope);
	await runExclusiveSqliteSessionWrite(resolved, async () => {
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
			replaceSqliteTranscriptEventsInTransaction(database, resolved, events);
		}, toDatabaseOptions(resolved));
	});
}
/** Fully replaces rows for one transcript synchronously for sync session runtimes. */
function replaceSqliteTranscriptEventsSync(scope, events) {
	const resolved = resolveSqliteTranscriptScope(scope);
	let replaced = false;
	require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
		const fresh = readSessionEntryRow(database, resolved.sessionKey);
		if (!fresh || fresh.entry.sessionId !== resolved.sessionId) return;
		replaceSqliteTranscriptEventsInTransaction(database, resolved, events);
		replaced = true;
	}, toDatabaseOptions(resolved));
	return replaced;
}
/** Imports one legacy session entry and its transcript rows for doctor migration. */
async function importSqliteSessionRows(params) {
	const resolved = resolveSqliteScope({
		...params.agentId ? { agentId: params.agentId } : {},
		...params.env ? { env: params.env } : {},
		sessionKey: params.sessionKey,
		...params.storePath ? { storePath: params.storePath } : {}
	});
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		let transcriptEvents = 0;
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
			const currentEntry = readSessionEntryRow(database, resolved.sessionKey)?.entry;
			const preservedHarnessId = params.entry.agentHarnessId === void 0 && currentEntry?.sessionId === params.entry.sessionId && currentEntry.lifecycleRevision === params.entry.lifecycleRevision ? currentEntry.agentHarnessId?.trim() : void 0;
			const importedEntry = {
				...params.entry,
				...preservedHarnessId ? { agentHarnessId: preservedHarnessId } : {},
				sessionFile: formatSqliteSessionMarkerForScope({
					...resolved,
					sessionId: params.entry.sessionId
				})
			};
			writeSessionEntry(database, resolved.sessionKey, importedEntry);
			if (params.readTranscriptEvents) {
				const transcriptScope = {
					...resolved,
					sessionId: params.entry.sessionId
				};
				const existingEventJson = readTranscriptEventJsonSetInTransaction(database, params.entry.sessionId);
				params.readTranscriptEvents((event) => {
					const eventJson = JSON.stringify(event);
					if (existingEventJson.has(eventJson)) return;
					if (appendTranscriptEventInTransaction(database, transcriptScope, event, { touchMutation: false })) {
						existingEventJson.add(eventJson);
						transcriptEvents += 1;
					}
				});
			}
			if (params.transcriptMtimeMs !== void 0) advanceTranscriptMutationAtInTransaction(database, params.entry.sessionId, params.transcriptMtimeMs);
			else if (transcriptEvents > 0) touchTranscriptMutationInTransaction(database, params.entry.sessionId);
		}, toDatabaseOptions(resolved));
		return {
			sessionId: params.entry.sessionId,
			sessionKey: resolved.sessionKey,
			transcriptEvents
		};
	});
}
/** Appends one raw transcript event to the additive SQLite transcript store. */
async function appendSqliteTranscriptEvent(scope, event) {
	assertNonMessageTranscriptEvent(event);
	const resolved = resolveSqliteTranscriptScope(scope);
	await runExclusiveSqliteSessionWrite(resolved, async () => {
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
			appendTranscriptEventInTransaction(database, resolved, event);
		}, toDatabaseOptions(resolved));
	});
}
/** Appends one raw non-message transcript event synchronously for sync session runtimes. */
function appendSqliteTranscriptEventSync(scope, event) {
	assertNonMessageTranscriptEvent(event);
	const resolved = resolveSqliteTranscriptScope(scope);
	require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
		const fresh = readSessionEntryRow(database, resolved.sessionKey);
		if (!fresh || fresh.entry.sessionId !== resolved.sessionId) return;
		appendTranscriptEventInTransaction(database, resolved, event);
	}, toDatabaseOptions(resolved));
}
/** Appends a guarded transcript turn and touches its session row in one queued write. */
async function appendSqliteExpectedSessionTranscriptTurn(scope, options) {
	const resolved = resolveSqliteTranscriptScope({
		...scope,
		sessionId: options.expectedSessionId
	});
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const preparedEntry = readSessionEntryRow(require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved)), resolved.sessionKey);
		if (!sessionMatchesExpectedTranscriptTurn(preparedEntry, options)) return sqliteSessionTranscriptTurnRebound(preparedEntry, options.sessionFile);
		const messages = await selectAppendableSqliteTranscriptTurnMessages({
			agentId: resolved.agentId,
			sessionFile: options.sessionFile,
			sessionId: options.expectedSessionId,
			sessionKey: resolved.sessionKey,
			...scope.storePath ? { storePath: scope.storePath } : {}
		}, options.messages);
		let result = sqliteSessionTranscriptTurnRebound(preparedEntry, options.sessionFile);
		let previousIdentity = /* @__PURE__ */ new Map();
		let currentIdentity = /* @__PURE__ */ new Map();
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((transactionDb) => {
			const fresh = readSessionEntryRow(transactionDb, resolved.sessionKey);
			if (!sessionMatchesExpectedTranscriptTurn(fresh, options)) {
				result = sqliteSessionTranscriptTurnRebound(fresh, options.sessionFile);
				return;
			}
			const appendedMessages = [];
			for (const append of messages) {
				const { shouldAppend: _shouldAppend, ...appendOptions } = append;
				const appended = appendSqliteTranscriptMessageInTransaction(transactionDb, resolved, {
					...appendOptions,
					...append.cwd ?? options.cwd ? { cwd: append.cwd ?? options.cwd } : {},
					...append.config ?? options.config ? { config: append.config ?? options.config } : {}
				});
				if (appended) appendedMessages.push(appended);
			}
			const sessionPatch = buildExpectedTranscriptTurnSessionPatch({
				appendedMessages,
				currentEntry: fresh.entry,
				expectedSessionState: options.expectedSessionState,
				sessionFile: options.sessionFile,
				sessionLifecyclePatch: options.sessionLifecyclePatch,
				touchSessionEntry: options.touchSessionEntry
			});
			const next = Object.keys(sessionPatch).length > 0 ? require_store.mergeSessionEntry(fresh.entry, sessionPatch) : fresh.entry;
			if (next !== fresh.entry) {
				const identityKeys = collectSessionEntryLookupKeys(transactionDb, resolved.sessionKey);
				previousIdentity = readSqliteSessionIdentitySnapshot(transactionDb, identityKeys);
				writeSessionEntry(transactionDb, resolved.sessionKey, next);
				deleteLegacySessionEntryRows(transactionDb, fresh.legacyKeys, resolved.sessionKey);
				currentIdentity = readSqliteSessionIdentitySnapshot(transactionDb, identityKeys);
			}
			result = {
				appendedMessages,
				sessionEntry: cloneSessionEntry(next),
				sessionFile: options.sessionFile
			};
		}, toDatabaseOptions(resolved));
		emitCommittedSessionIdentityDiff(previousIdentity, currentIdentity);
		return result;
	});
}
function sqliteSessionTranscriptTurnRebound(selected, sessionFile) {
	return {
		appendedMessages: [],
		rejectedReason: "session-rebound",
		sessionEntry: selected?.entry,
		sessionFile
	};
}
async function selectAppendableSqliteTranscriptTurnMessages(context, messages) {
	const selected = [];
	for (const append of messages) if (append.shouldAppend ? await append.shouldAppend(context) : true) selected.push(append);
	return selected;
}
async function appendSqliteTranscriptMessage(scope, options) {
	const resolved = resolveSqliteTranscriptScope(scope);
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		let result;
		require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
			result = appendSqliteTranscriptMessageInTransaction(database, resolved, options);
		}, toDatabaseOptions(resolved));
		return result;
	});
}
/** Appends one transcript message synchronously for sync session runtimes. */
function appendSqliteTranscriptMessageSync(scope, options) {
	const resolved = resolveSqliteTranscriptScope(scope);
	let result;
	require_openclaw_agent_db.runOperatorAgentWriteTransaction((database) => {
		const fresh = readSessionEntryRow(database, resolved.sessionKey);
		if (!fresh || fresh.entry.sessionId !== resolved.sessionId) return;
		result = appendSqliteTranscriptMessageInTransaction(database, resolved, options);
	}, toDatabaseOptions(resolved));
	return result;
}
/** Runs read/append transcript work under one SQLite writer-queue critical section. */
async function withSqliteTranscriptWriteLock(scope, run) {
	const resolved = resolveSqliteTranscriptScope(scope);
	return await runExclusiveSqliteSessionWrite(resolved, async () => {
		const database = require_openclaw_agent_db.openOperatorAgentDatabase(toDatabaseOptions(resolved));
		let transcriptSnapshot;
		return await run({
			readEvents: async () => {
				const snapshot = readSqliteTranscriptSnapshot(database, resolved.sessionId);
				transcriptSnapshot = {
					kind: "current",
					rows: snapshot.rows
				};
				return snapshot.events;
			},
			replaceEvents: async (events) => {
				if (transcriptSnapshot?.kind === "stale") throw new SqliteTranscriptMutationConflictError(resolved.sessionId);
				const expectedSnapshot = transcriptSnapshot?.rows;
				transcriptSnapshot = {
					kind: "current",
					rows: require_openclaw_agent_db.runOperatorAgentWriteTransaction((writeDatabase) => {
						if (expectedSnapshot !== void 0) assertSqliteTranscriptSnapshotUnchanged(writeDatabase, resolved.sessionId, expectedSnapshot);
						replaceSqliteTranscriptEventsInTransaction(writeDatabase, resolved, events);
						return readSqliteTranscriptSnapshot(writeDatabase, resolved.sessionId).rows;
					}, toDatabaseOptions(resolved))
				};
			},
			appendMessage: async (options) => {
				let result;
				const snapshotState = transcriptSnapshot;
				let nextSnapshotState = snapshotState;
				require_openclaw_agent_db.runOperatorAgentWriteTransaction((writeDatabase) => {
					const snapshotStillCurrent = snapshotState?.kind === "current" ? isSqliteTranscriptSnapshotUnchanged(writeDatabase, resolved.sessionId, snapshotState.rows) : false;
					result = appendSqliteTranscriptMessageInTransaction(writeDatabase, resolved, options);
					if (snapshotState?.kind === "current") nextSnapshotState = snapshotStillCurrent ? {
						kind: "current",
						rows: readSqliteTranscriptSnapshot(writeDatabase, resolved.sessionId).rows
					} : { kind: "stale" };
				}, toDatabaseOptions(resolved));
				transcriptSnapshot = nextSnapshotState;
				return result;
			}
		});
	});
}
/** Runs synchronous transcript work under one writer queue and SQLite transaction. */
async function withSqliteTranscriptWriteTransaction(scope, run) {
	const resolved = resolveSqliteTranscriptScope(scope);
	return await runExclusiveSqliteSessionWrite(resolved, async () => require_openclaw_agent_db.runOperatorAgentWriteTransaction(() => run({ sessionFile: formatSqliteSessionMarkerForScope(resolved) }), toDatabaseOptions(resolved), { operationLabel: "session.transcript.batch" }));
}
function isSqliteTranscriptSnapshotUnchanged(database, sessionId, expected) {
	const current = readSqliteTranscriptSnapshot(database, sessionId).rows;
	return current.length === expected.length && current.every((row, index) => row.seq === expected[index]?.seq && row.eventJson === expected[index]?.eventJson);
}
function assertSqliteTranscriptSnapshotUnchanged(database, sessionId, expected) {
	if (!isSqliteTranscriptSnapshotUnchanged(database, sessionId, expected)) throw new SqliteTranscriptMutationConflictError(sessionId);
}
function appendSqliteTranscriptMessageInTransaction(database, resolved, options) {
	const idempotencyKey = readMessageIdempotencyKey(options.message);
	if (idempotencyKey && options.idempotencyLookup !== "caller-checked") {
		const existing = readTranscriptMessageByScopedIdempotencyKey(database, resolved, idempotencyKey, options.idempotencyLookup);
		if (existing) return {
			appended: false,
			message: existing.message,
			messageId: existing.messageId
		};
	}
	const prepared = options.prepareMessageAfterIdempotencyCheck ? options.prepareMessageAfterIdempotencyCheck(options.message) : options.message;
	if (prepared === void 0) return;
	const messageId = options.eventId ?? (0, node_crypto.randomUUID)();
	const now = options.now ?? Date.now();
	const finalMessage = redactTranscriptMessageForStorage(prepared, options);
	ensureTranscriptHeader(database, resolved, options.cwd, now);
	const appended = appendTranscriptEventInTransaction(database, resolved, {
		type: "message",
		id: messageId,
		parentId: (options.parentId === void 0 ? readActiveTranscriptAppendParentId(database, resolved.sessionId) : options.parentId) ?? null,
		timestamp: (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimestampMsToIsoString)(now),
		message: finalMessage
	}, { dedupeByMessageIdempotency: options.idempotencyLookup !== "caller-checked" && options.idempotencyLookup !== "scan-assistant" });
	if (!appended && idempotencyKey && options.idempotencyLookup !== "caller-checked") {
		const existing = readTranscriptMessageByScopedIdempotencyKey(database, resolved, idempotencyKey, options.idempotencyLookup);
		if (existing) return {
			appended: false,
			message: existing.message,
			messageId: existing.messageId
		};
	}
	if (!appended) {
		const existing = readTranscriptMessageByEventId(database, resolved, messageId);
		if (existing) return {
			appended: false,
			message: existing.message,
			messageId: existing.messageId
		};
	}
	if (!appended) throw new Error(`SQLite transcript append did not insert message ${messageId}.`);
	return {
		appended: true,
		message: finalMessage,
		messageId
	};
}
function assertNonMessageTranscriptEvent(event) {
	if (!event || typeof event !== "object" || Array.isArray(event)) return;
	if (event.type === "message") throw new Error("appendSqliteTranscriptEvent cannot write message transcript records; use appendSqliteTranscriptMessage instead.");
}
//#endregion
//#region src/config/sessions/session-history.ts
/** Lists entries selected by the indexed normalized session status. */
function listSessionEntriesByStatus(scope, statuses) {
	return listSqliteSessionEntriesByStatus(scope, statuses);
}
/** Lists every retained transcript instance, including prior ids for rotated logical sessions. */
function listSessionTranscriptInstances(scope = {}) {
	return listSqliteSessionTranscriptInstances(scope);
}
//#endregion
//#region src/config/sessions/plugin-host-cleanup.ts
/** Shared predicates and mutations for plugin host-owned session-state cleanup. */
function collectStoredSessionEntrySlotKeys(entry, pluginId) {
	const slotKeys = /* @__PURE__ */ new Set();
	const storedSlotKeys = entry.pluginExtensionSlotKeys;
	if (!storedSlotKeys) return slotKeys;
	const records = pluginId === void 0 ? Object.values(storedSlotKeys) : storedSlotKeys[pluginId] ? [storedSlotKeys[pluginId]] : [];
	for (const record of records) for (const slotKey of Object.values(record)) {
		const normalized = require_store.normalizeSessionEntrySlotKey(slotKey);
		if (normalized.ok) slotKeys.add(normalized.key);
	}
	return slotKeys;
}
function collectPromotedSessionEntrySlotKeys(entry, pluginId, sessionEntrySlotKeys) {
	const slotKeys = collectStoredSessionEntrySlotKeys(entry, pluginId);
	for (const slotKey of sessionEntrySlotKeys ?? []) slotKeys.add(slotKey);
	return slotKeys;
}
function clearPromotedSessionEntrySlots(entry, pluginId, sessionEntrySlotKeys, options = {}) {
	const slotKeys = options.includeStoredSlotKeys === false && sessionEntrySlotKeys ? new Set(sessionEntrySlotKeys) : collectPromotedSessionEntrySlotKeys(entry, pluginId, sessionEntrySlotKeys);
	const entryRecord = entry;
	for (const slotKey of slotKeys) delete entryRecord[slotKey];
	if (!options.pruneSlotOwnership || !entry.pluginExtensionSlotKeys) return;
	const pruneRecord = (record) => {
		for (const [namespace, slotKey] of Object.entries(record)) {
			const normalized = require_store.normalizeSessionEntrySlotKey(slotKey);
			if (normalized.ok && slotKeys.has(normalized.key)) delete record[namespace];
		}
	};
	if (pluginId) {
		const record = entry.pluginExtensionSlotKeys[pluginId];
		if (record) {
			pruneRecord(record);
			if (Object.keys(record).length === 0) delete entry.pluginExtensionSlotKeys[pluginId];
		}
	} else {
		for (const record of Object.values(entry.pluginExtensionSlotKeys)) pruneRecord(record);
		for (const [ownerPluginId, record] of Object.entries(entry.pluginExtensionSlotKeys)) if (Object.keys(record).length === 0) delete entry.pluginExtensionSlotKeys[ownerPluginId];
	}
	if (Object.keys(entry.pluginExtensionSlotKeys).length === 0) delete entry.pluginExtensionSlotKeys;
}
/** Clears plugin-owned extension state from one session entry. */
function clearPluginOwnedSessionState(entry, pluginId, sessionEntrySlotKeys) {
	clearPromotedSessionEntrySlots(entry, pluginId, sessionEntrySlotKeys);
	if (!pluginId) {
		delete entry.pluginExtensions;
		delete entry.pluginExtensionSlotKeys;
		delete entry.pluginNextTurnInjections;
		return;
	}
	if (entry.pluginExtensions) {
		delete entry.pluginExtensions[pluginId];
		if (Object.keys(entry.pluginExtensions).length === 0) delete entry.pluginExtensions;
	}
	if (entry.pluginExtensionSlotKeys) {
		delete entry.pluginExtensionSlotKeys[pluginId];
		if (Object.keys(entry.pluginExtensionSlotKeys).length === 0) delete entry.pluginExtensionSlotKeys;
	}
	if (entry.pluginNextTurnInjections) {
		delete entry.pluginNextTurnInjections[pluginId];
		if (Object.keys(entry.pluginNextTurnInjections).length === 0) delete entry.pluginNextTurnInjections;
	}
}
function hasPromotedSessionEntrySlot(entry, pluginId, sessionEntrySlotKeys) {
	const slotKeys = collectPromotedSessionEntrySlotKeys(entry, pluginId, sessionEntrySlotKeys);
	if (slotKeys.size === 0) return false;
	const entryRecord = entry;
	for (const slotKey of slotKeys) if (Object.hasOwn(entryRecord, slotKey)) return true;
	return false;
}
function hasPluginOwnedSessionState(entry, pluginId, sessionEntrySlotKeys) {
	if (hasPromotedSessionEntrySlot(entry, pluginId, sessionEntrySlotKeys)) return true;
	if (!pluginId) return Boolean(entry.pluginExtensions || entry.pluginExtensionSlotKeys || entry.pluginNextTurnInjections);
	return Boolean(entry.pluginExtensions?.[pluginId] || entry.pluginExtensionSlotKeys?.[pluginId] || entry.pluginNextTurnInjections?.[pluginId]);
}
function matchesPluginHostCleanupSession(entryKey, entry, sessionKey) {
	const normalizedSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(sessionKey);
	if (!normalizedSessionKey) return true;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entryKey) === normalizedSessionKey || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry.sessionId) === normalizedSessionKey;
}
function shouldSkipPluginHostCleanupStore(params) {
	if (!params.pluginId && !params.sessionKey) return true;
	return params.mode === "promoted-slots" && (params.sessionEntrySlotKeys?.size ?? 0) === 0;
}
function hasPluginHostCleanupTarget(entry, params) {
	if (params.mode === "promoted-slots") return hasPromotedSessionEntrySlot(entry, params.pluginId, params.sessionEntrySlotKeys);
	return hasPluginOwnedSessionState(entry, params.pluginId, params.sessionEntrySlotKeys);
}
function isLockedHarnessSessionOwnedByPlugin(entry, preserveLockedHarnessIds) {
	if (entry.modelSelectionLocked !== true || !preserveLockedHarnessIds?.size) return false;
	const harnessId = require_openai_routing.normalizeOptionalAgentRuntimeId(entry.agentHarnessId);
	return harnessId !== void 0 && preserveLockedHarnessIds.has(harnessId);
}
function clearPluginHostCleanupTarget(entry, params) {
	if (params.mode === "promoted-slots") {
		clearPromotedSessionEntrySlots(entry, params.pluginId, params.sessionEntrySlotKeys, {
			includeStoredSlotKeys: false,
			pruneSlotOwnership: true
		});
		return;
	}
	clearPluginOwnedSessionState(entry, params.pluginId, params.sessionEntrySlotKeys);
}
//#endregion
//#region src/config/sessions/session-accessor.entry.ts
/** Keeps legacy store-key alias resolution behind the entry owner boundary. */
function resolveSessionEntryFromStore(params) {
	return require_store.resolveSessionStoreEntry(params);
}
function resolveAccessStorePath(scope) {
	if (scope.storePath) return scope.storePath;
	const agentId = scope.agentId ?? require_session_key.resolveAgentIdFromSessionKey(scope.sessionKey);
	return require_paths.resolveStorePath(require_io.getRuntimeConfig().session?.store, {
		agentId,
		env: scope.env
	});
}
function isStorePathTemplate(store) {
	return typeof store === "string" && store.includes("{agentId}");
}
function resolveLogicalSessionStoreCandidates(params) {
	const storeConfig = params.cfg.session?.store;
	const defaultTarget = {
		agentId: params.agentId,
		storePath: require_paths.resolveStorePath(storeConfig, {
			agentId: params.agentId,
			env: params.env
		})
	};
	if (!isStorePathTemplate(storeConfig)) return [defaultTarget];
	const targets = /* @__PURE__ */ new Map();
	targets.set(defaultTarget.storePath, defaultTarget);
	for (const target of require_targets.resolveAllAgentSessionStoreTargetsSync(params.cfg, { env: params.env })) if (target.agentId === params.agentId) targets.set(target.storePath, target);
	return [...targets.values()];
}
function buildLogicalSessionEntryCandidateKeys(params) {
	const targets = /* @__PURE__ */ new Set();
	if (params.canonicalKey) targets.add(params.canonicalKey);
	if (params.requestedKey && params.requestedKey !== params.canonicalKey) targets.add(params.requestedKey);
	if (params.canonicalKey === "global" || params.canonicalKey === "unknown") return [...targets];
	const agentMainKey = require_main_session.resolveAgentMainSessionKey({
		cfg: params.cfg,
		agentId: params.agentId
	});
	if (params.canonicalKey === agentMainKey) targets.add(`agent:${params.agentId}:main`);
	return [...targets];
}
function findFreshestSessionEntryMatch(entries, candidateKeys) {
	let freshest;
	for (const candidate of candidateKeys) {
		const trimmed = candidate.trim();
		if (!trimmed) continue;
		const match = entries.find((entry) => entry.sessionKey === trimmed);
		if (match && (!freshest || (match.entry.updatedAt ?? 0) >= (freshest.entry.updatedAt ?? 0))) freshest = match;
	}
	return freshest;
}
/**
* Resolves a logical session key to the freshest matching entry across the
* configured store and discovered same-agent stores.
*/
function resolveSessionEntryAccessTarget(scope) {
	const target = resolveSessionEntryStoreTarget(scope);
	return {
		agentId: target.agentId,
		canonicalKey: target.canonicalKey,
		entry: target.entry,
		requestedKey: target.requestedKey,
		storeKey: target.storeKey
	};
}
/** Resolves ordered candidate keys inside one agent-owned session store. */
function resolveSessionEntryCandidateTarget(scope) {
	const storePath = require_paths.resolveStorePath(scope.cfg.session?.store, {
		agentId: scope.agentId,
		env: scope.env
	});
	const store = Object.fromEntries(listSessionEntries({
		agentId: scope.agentId,
		storePath
	}).map(({ sessionKey, entry }) => [sessionKey, entry]));
	for (const candidateKey of (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(scope.candidateKeys.map((key) => key.trim()))) {
		if (!candidateKey) continue;
		const resolved = resolveSessionEntryFromStore({
			store,
			sessionKey: candidateKey
		});
		if (!resolved.existing) continue;
		return {
			agentId: scope.agentId,
			candidateKey,
			entry: structuredClone(resolved.existing),
			persisted: true,
			sessionKey: resolved.normalizedKey
		};
	}
	const fallbackKey = scope.fallback?.sessionKey.trim();
	if (!fallbackKey || !scope.fallback) return null;
	return {
		agentId: scope.agentId,
		candidateKey: fallbackKey,
		entry: structuredClone(scope.fallback.entry),
		persisted: false,
		sessionKey: fallbackKey
	};
}
function resolveSessionEntryStoreTarget(scope) {
	const requestedKey = scope.sessionKey.trim();
	const canonicalKey = resolveSessionStoreKey({
		cfg: scope.cfg,
		sessionKey: requestedKey
	});
	const agentId = resolveSessionStoreAgentId(scope.cfg, canonicalKey);
	const scanTargets = buildLogicalSessionEntryCandidateKeys({
		agentId,
		canonicalKey,
		cfg: scope.cfg,
		requestedKey
	});
	const candidates = resolveLogicalSessionStoreCandidates({
		agentId,
		cfg: scope.cfg,
		env: scope.env
	});
	const fallback = candidates[0] ?? {
		agentId,
		storePath: require_paths.resolveStorePath(scope.cfg.session?.store, {
			agentId,
			env: scope.env
		})
	};
	let selectedStorePath = fallback.storePath;
	let selectedMatch = findFreshestSessionEntryMatch(listSessionEntries({
		agentId,
		storePath: fallback.storePath
	}), scanTargets);
	for (let index = 1; index < candidates.length; index += 1) {
		const candidate = candidates[index];
		if (!candidate) continue;
		const match = findFreshestSessionEntryMatch(listSessionEntries({
			agentId,
			storePath: candidate.storePath
		}), scanTargets);
		if (match && (!selectedMatch || (match.entry.updatedAt ?? 0) >= (selectedMatch.entry.updatedAt ?? 0))) {
			selectedStorePath = candidate.storePath;
			selectedMatch = match;
		}
	}
	return {
		agentId,
		canonicalKey,
		entry: selectedMatch?.entry,
		requestedKey,
		storeKey: selectedMatch?.sessionKey ?? canonicalKey,
		storePath: selectedStorePath
	};
}
/**
* Mutates the freshest matching logical session entry without exposing the
* backing store map to callers.
*/
async function updateResolvedSessionEntry(scope, update) {
	const target = resolveSessionEntryStoreTarget(scope);
	if (!target.entry) return {
		canonicalKey: target.canonicalKey,
		found: false
	};
	let updateResult;
	const updated = await patchSessionEntry({
		sessionKey: target.storeKey,
		storePath: target.storePath
	}, async (entry) => {
		updateResult = await update(entry, {
			agentId: target.agentId,
			canonicalKey: target.canonicalKey,
			entry,
			requestedKey: target.requestedKey,
			storeKey: target.storeKey
		});
		return entry;
	}, {
		replaceEntry: true,
		skipMaintenance: true
	});
	if (!updated) return {
		canonicalKey: target.canonicalKey,
		found: false
	};
	return {
		canonicalKey: target.canonicalKey,
		entry: structuredClone(updated),
		found: true,
		result: updateResult,
		storeKey: target.storeKey
	};
}
/** Returns the entry for a canonical or alias session key, if one exists. */
function loadSessionEntry(scope) {
	return loadSqliteSessionEntry(scope);
}
/**
* Returns only the row persisted under the exact key provided.
* Use this for authorization-sensitive routing where alias canonicalization
* could cross an account or agent boundary.
*/
function loadExactSessionEntry(scope) {
	return loadExactSqliteSessionEntry(scope);
}
/** Lists entries from the resolved store, preserving the persisted key for each row. */
function listSessionEntries(scope = {}) {
	if (scope.clone === false) return openSessionEntryReadView(scope).entries();
	return listSqliteSessionEntries(scope);
}
/**
* Borrowed keyed view over one resolved store for synchronous read-only hot paths.
* Unlike loadSessionEntry, `get` is a raw exact persisted-key probe with no alias
* or canonical-key resolution and no row scans, so large stores stay cheap until
* `entries` is called. Rows are borrowed, not cloned: callers must not mutate them
* and must drop the view before any await.
*/
function openSessionEntryReadView(scope = {}) {
	return {
		get: (sessionKey) => loadExactSqliteSessionEntry({
			...scope,
			sessionKey
		})?.entry,
		entries: () => listSqliteSessionEntries(scope)
	};
}
/** Reads the last activity timestamp for one session entry, or undefined when absent. */
function readSessionUpdatedAt(scope) {
	return readSqliteSessionUpdatedAt(scope);
}
/** Creates or updates one entry from a partial patch and returns the persisted entry. */
async function upsertSessionEntry(scope, patch) {
	return await upsertSqliteSessionEntry(scope, patch);
}
/** Replaces one entry with the supplied value and returns the persisted entry. */
async function replaceSessionEntry(scope, entry) {
	return await replaceSqliteSessionEntry(scope, entry);
}
/** Replaces one entry synchronously for sync session runtimes. */
function replaceSessionEntrySync(scope, entry) {
	replaceSqliteSessionEntrySync(scope, entry);
}
/**
* Applies an atomic patch to one entry.
* The updater sees the current entry plus whether it was synthesized from a
* fallback; returning null skips persistence.
*/
async function patchSessionEntry(scope, update, options = {}) {
	return await patchSqliteSessionEntry(scope, update, options);
}
/**
* Applies an atomic patch to the freshest entry selected from a canonical key
* plus its known aliases, then persists the result under the canonical key.
*/
async function patchSessionEntryTarget(scope, update, options = {}) {
	return await patchSqliteSessionEntryTarget(scope, update, options);
}
/**
* Applies an atomic patch and returns the persisted key selected by the backing
* store. Use when a caller must keep sidecar state keyed to the final row.
*/
async function patchSessionEntryWithKey(scope, update, options = {}) {
	const entry = await patchSqliteSessionEntry(scope, update, options);
	return entry ? {
		sessionKey: require_store.normalizeStoreSessionKey(scope.sessionKey),
		entry
	} : null;
}
/**
* Copies one parent transcript into a new child transcript target.
* This is for guarded callers that already own the eventual entry commit.
*/
//#endregion
//#region src/config/sessions/session-entry-selection.ts
/** Normalizes caller aliases while always preserving the canonical key. */
function normalizeTargetStoreKeys(target) {
	const keys = /* @__PURE__ */ new Set();
	const remember = (value) => {
		const trimmed = value.trim();
		if (trimmed) keys.add(trimmed);
	};
	remember(target.canonicalKey);
	for (const key of target.storeKeys) remember(key);
	return [...keys];
}
/** Selects the row that alias migration would promote. */
function resolveFreshestTargetEntry(store, targetKeys) {
	let freshest;
	for (const key of targetKeys) {
		const entry = store[key];
		if (entry && (!freshest || (entry.updatedAt ?? 0) > (freshest.entry.updatedAt ?? 0))) freshest = {
			key,
			entry
		};
	}
	return freshest;
}
function cloneOptionalSessionEntry(entry) {
	return entry ? structuredClone(entry) : void 0;
}
function resolveProjectionExistingEntry(entries, target) {
	const candidateKeys = target.candidateKeys ?? [target.primaryKey];
	let freshest;
	for (const candidateKey of candidateKeys) {
		const entry = entries.find((candidate) => candidate.sessionKey === candidateKey)?.entry;
		if (entry && (!freshest || (entry.updatedAt ?? 0) > (freshest.updatedAt ?? 0))) freshest = entry;
	}
	return cloneOptionalSessionEntry(freshest);
}
//#endregion
//#region src/config/sessions/session-accessor.lifecycle.ts
function findSessionCompactionCheckpoint(params) {
	const checkpointId = params.checkpointId.trim();
	if (!checkpointId || !Array.isArray(params.entry.compactionCheckpoints)) return;
	let newest;
	for (const checkpoint of params.entry.compactionCheckpoints) {
		if (checkpoint.checkpointId !== checkpointId) continue;
		if (!newest || checkpoint.createdAt > newest.createdAt) newest = checkpoint;
	}
	return newest;
}
async function applySessionCompactionCheckpointMutation(params) {
	const currentEntry = loadSessionEntry({
		sessionKey: params.readKey,
		storePath: params.storePath
	});
	if (!currentEntry?.sessionId) return { status: "missing-session" };
	if (currentEntry.modelSelectionLocked === true) return { status: "model-selection-locked" };
	const checkpoint = findSessionCompactionCheckpoint({
		entry: currentEntry,
		checkpointId: params.checkpointId
	});
	if (!checkpoint) return { status: "missing-checkpoint" };
	const forkedSession = await params.forkTranscriptFromCheckpoint(checkpoint);
	if (forkedSession.status !== "created") return forkedSession;
	const nextEntry = await params.buildEntry({
		checkpoint,
		currentEntry,
		forkedTranscript: forkedSession.transcript
	});
	await replaceSessionEntry({
		sessionKey: params.writeKey,
		storePath: params.storePath
	}, nextEntry);
	return {
		status: "created",
		key: params.writeKey,
		checkpoint,
		entry: nextEntry
	};
}
/**
* Forks checkpoint transcript content and persists a new branch entry in one
* storage-sized mutation. SQLite adapters implement the transcript row copy
* and `session_entries.entry_json` insert inside the same write transaction.
*/
async function branchSessionFromCompactionCheckpoint(params) {
	return await applySessionCompactionCheckpointMutation({
		buildEntry: params.buildEntry,
		checkpointId: params.checkpointId,
		forkTranscriptFromCheckpoint: params.forkTranscriptFromCheckpoint,
		readKey: params.sourceStoreKey ?? params.sourceKey,
		storePath: params.storePath,
		writeKey: params.nextKey
	});
}
/**
* Forks checkpoint transcript content and replaces the current entry in one
* storage-sized mutation. SQLite adapters implement the transcript row copy
* and `session_entries.entry_json` update inside the same write transaction.
*/
async function restoreSessionFromCompactionCheckpoint(params) {
	return await applySessionCompactionCheckpointMutation({
		buildEntry: params.buildEntry,
		checkpointId: params.checkpointId,
		forkTranscriptFromCheckpoint: params.forkTranscriptFromCheckpoint,
		readKey: params.sessionStoreKey ?? params.sessionKey,
		storePath: params.storePath,
		writeKey: params.sessionKey
	});
}
/**
* Applies a session patch projection through the accessor boundary.
* The resolver sees a read-only snapshot and names the persisted key set; the
* projector returns one replacement entry without receiving the mutable store.
*/
async function applySessionPatchProjection(params) {
	const entries = listSessionEntries({
		agentId: params.agentId,
		storePath: params.storePath
	}).map(({ sessionKey, entry }) => ({
		entry: structuredClone(entry),
		sessionKey
	}));
	const target = params.resolveTarget({ entries });
	const existingEntry = resolveProjectionExistingEntry(entries, target);
	const projected = await params.project({
		...target,
		entries,
		...existingEntry ? { existingEntry } : {}
	});
	if (!projected.ok) return projected;
	const candidateKeys = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((target.candidateKeys ?? [target.primaryKey]).map((key) => key.trim()).filter(Boolean));
	await applySessionEntryLifecycleMutation({
		agentId: params.agentId,
		storePath: params.storePath,
		removals: candidateKeys.filter((sessionKey) => sessionKey !== target.primaryKey).map((sessionKey) => ({ sessionKey })),
		upserts: [{
			sessionKey: target.primaryKey,
			entry: projected.entry
		}],
		skipMaintenance: true
	});
	return {
		...projected,
		entry: structuredClone(projected.entry)
	};
}
/**
* Applies explicit entry replacements without exposing the backing store shape.
* The file backend runs selection and replacement under one writer lock; the
* SQLite backend can map the same callback to a transaction.
*/
async function applySessionEntryReplacements(params) {
	return await applySqliteSessionEntryReplacements(params);
}
/**
* Applies a detached whole-store projection under the storage writer lane.
* Compatibility adapters use this to preserve callback serialization while
* steady-state runtime callers stay on row-level accessors.
*/
async function applySessionStoreProjection(params) {
	return await applySqliteSessionStoreProjection(params);
}
/**
* Runs an operation while preserving one temporary session mapping.
* The storage backend snapshots exactly the named key before the operation and
* restores that entry, or deletes it when it did not previously exist, after
* the operation finishes. SQLite backends can implement the same named
* preservation lifecycle without exposing mutable store access to callers.
*/
async function preserveTemporarySessionMapping(scope, operation) {
	const snapshot = snapshotTemporarySessionMapping(scope);
	let operationResult;
	try {
		operationResult = {
			ok: true,
			result: await operation()
		};
	} catch (err) {
		operationResult = {
			error: err,
			ok: false
		};
	}
	const restoreFailure = await restoreTemporarySessionMapping(snapshot);
	if (!operationResult.ok) throw operationResult.error;
	return {
		result: operationResult.result,
		...snapshot.canRestore ? {} : { snapshotFailure: snapshot.snapshotFailure },
		...restoreFailure ? { restoreFailure } : {}
	};
}
/** Removes entries and orphan transcript artifacts owned by a named session lifecycle. */
async function cleanupSessionLifecycleArtifacts(params) {
	return await cleanupSqliteSessionLifecycleArtifacts(params);
}
/** Resets one persisted session entry and transitions its transcript state. */
async function resetSessionEntryLifecycle(params) {
	return await resetSqliteSessionEntryLifecycle(params);
}
/** Deletes one persisted session entry and transitions its transcript state. */
async function deleteSessionEntryLifecycle(params) {
	return await deleteSqliteSessionEntryLifecycle(params);
}
/** Internal exact-row rollback for failed trusted agent-harness initialization. */
async function rollbackAgentHarnessSessionEntryLifecycle(params) {
	return await rollbackSqliteAgentHarnessSessionEntryLifecycle(params);
}
/** Internal exact-row rollback for failed trusted plugin-owned CLI initialization. */
async function rollbackPluginOwnedSessionEntryLifecycle(params) {
	return await rollbackSqlitePluginOwnedSessionEntryLifecycle(params);
}
/** Applies exact entry lifecycle mutations and artifact cleanup at the storage boundary. */
async function applySessionEntryLifecycleMutation(params) {
	return await applySqliteSessionEntryLifecycleMutation(params);
}
/** Previews SQLite row-byte disk-budget cleanup without mutating persisted rows. */
function previewSessionDiskBudget(params) {
	return previewSqliteSessionDiskBudget(params);
}
/** Purges session entries owned by a deleted agent at the storage boundary. */
async function purgeDeletedAgentSessionEntries(params) {
	return await purgeSqliteDeletedAgentSessionEntries(params);
}
/**
* Clears plugin host-owned state inside one resolved session store.
* This is an internal transaction-sized boundary for the storage backend, not
* a Plugin SDK API.
*/
async function cleanupPluginHostSessionStore(params) {
	if (shouldSkipPluginHostCleanupStore(params) || params.shouldCleanup && !params.shouldCleanup()) return 0;
	const now = Date.now();
	let cleared = 0;
	for (const { entry, sessionKey } of listSessionEntries({
		agentId: params.agentId,
		storePath: params.storePath
	})) {
		if (isLockedHarnessSessionOwnedByPlugin(entry, params.preserveLockedHarnessIds)) continue;
		if (!matchesPluginHostCleanupSession(sessionKey, entry, params.sessionKey) || !hasPluginHostCleanupTarget(entry, params)) continue;
		if (await patchSessionEntry({
			agentId: params.agentId,
			sessionKey,
			storePath: params.storePath
		}, (currentEntry) => {
			if (isLockedHarnessSessionOwnedByPlugin(currentEntry, params.preserveLockedHarnessIds)) return null;
			if (!hasPluginHostCleanupTarget(currentEntry, params)) return null;
			clearPluginHostCleanupTarget(currentEntry, params);
			currentEntry.updatedAt = now;
			return currentEntry;
		}, {
			replaceEntry: true,
			skipMaintenance: true
		})) cleared += 1;
	}
	return cleared;
}
function snapshotTemporarySessionMapping(scope) {
	const storePath = resolveAccessStorePath(scope);
	try {
		const exact = loadExactSessionEntry({
			...scope,
			storePath
		});
		return {
			canRestore: true,
			...exact ? {
				entry: structuredClone(exact.entry),
				hadEntry: true
			} : { hadEntry: false },
			sessionKey: scope.sessionKey,
			storePath
		};
	} catch (err) {
		return {
			canRestore: false,
			sessionKey: scope.sessionKey,
			snapshotFailure: require_errors.formatErrorMessage(err),
			storePath
		};
	}
}
async function restoreTemporarySessionMapping(snapshot) {
	if (!snapshot.canRestore) return;
	try {
		if (snapshot.hadEntry) await replaceSessionEntry({
			sessionKey: snapshot.sessionKey,
			storePath: snapshot.storePath
		}, structuredClone(snapshot.entry));
		else await applySessionEntryLifecycleMutation({
			storePath: snapshot.storePath,
			removals: [{ sessionKey: snapshot.sessionKey }],
			activeSessionKey: snapshot.sessionKey,
			skipMaintenance: true
		});
		return;
	} catch (err) {
		return require_errors.formatErrorMessage(err);
	}
}
//#endregion
//#region src/config/sessions/session-accessor.entry-mutation.ts
async function forkSessionFromParentTranscript(params) {
	return await forkSqliteSessionTranscriptFromParent(params);
}
/**
* Forks parent transcript content and persists the child entry/alias cleanup in
* one storage-owned operation.
*/
async function forkSessionEntryFromParentTarget(params) {
	return await forkSqliteSessionEntryFromParentTarget(params);
}
/** Resolves whether a parent session is small enough to fork through the active store. */
async function resolveSessionParentForkDecision(params) {
	return await resolveSqliteSessionParentForkDecision(params);
}
/**
* Promotes the freshest alias row to the canonical key, prunes legacy aliases,
* and optionally patches the canonical entry under one accessor operation.
*/
async function canonicalizeSessionEntryAliases(params) {
	const store = Object.fromEntries(listSessionEntries({
		agentId: params.agentId,
		storePath: params.storePath
	}).map(({ sessionKey, entry }) => [sessionKey, entry]));
	const targetKeys = normalizeTargetStoreKeys(params.target);
	const freshest = resolveFreshestTargetEntry(store, targetKeys);
	const patch = params.update ? await params.update(cloneOptionalSessionEntry(freshest?.entry)) : null;
	const entry = patch ? {
		...freshest?.entry,
		...patch
	} : cloneOptionalSessionEntry(freshest?.entry);
	await applySessionEntryLifecycleMutation({
		agentId: params.agentId,
		storePath: params.storePath,
		removals: targetKeys.filter((key) => key !== params.target.canonicalKey).map((sessionKey) => ({ sessionKey })),
		upserts: entry ? [{
			sessionKey: params.target.canonicalKey,
			entry
		}] : void 0,
		skipMaintenance: true
	});
	return {
		canonicalKey: params.target.canonicalKey,
		...entry ? { entry: cloneOptionalSessionEntry(entry) } : {}
	};
}
/**
* Creates or updates one session entry and initializes its transcript header as
* one SQLite-backed lifecycle operation. Callers do not compose row creation,
* transcript initialization, rollback, and normalized session identity.
*/
async function createSessionEntryWithTranscript(scope, createEntry, _options = {}) {
	const storePath = resolveAccessStorePath(scope);
	const agentId = scope.agentId ?? require_session_key.resolveAgentIdFromSessionKey(scope.sessionKey);
	const store = Object.fromEntries(listSessionEntries({
		agentId,
		storePath
	}).map(({ sessionKey, entry }) => [sessionKey, entry]));
	const resolved = resolveSessionEntryFromStore({
		store,
		sessionKey: scope.sessionKey
	});
	const created = await createEntry({
		existingEntry: resolved.existing ? { ...resolved.existing } : void 0,
		sessionEntries: cloneSessionEntries(store)
	});
	if (!created.ok) return {
		ok: false,
		error: created.error,
		phase: "entry"
	};
	const sessionFile = require_sqlite_marker.formatSqliteSessionFileMarker({
		agentId,
		sessionId: created.entry.sessionId,
		storePath
	});
	try {
		await appendSqliteTranscriptEvent({
			agentId,
			sessionId: created.entry.sessionId,
			sessionKey: resolved.normalizedKey,
			storePath
		}, createSessionTranscriptHeader({ sessionId: created.entry.sessionId }));
	} catch (err) {
		return {
			ok: false,
			error: require_errors.formatErrorMessage(err),
			phase: "transcript"
		};
	}
	const entry = created.entry.sessionFile === sessionFile ? created.entry : {
		...created.entry,
		sessionFile
	};
	await applySessionEntryLifecycleMutation({
		agentId,
		storePath,
		removals: resolved.legacyKeys.map((sessionKey) => ({ sessionKey })),
		upserts: [{
			sessionKey: resolved.normalizedKey,
			entry
		}],
		skipMaintenance: true
	});
	return {
		ok: true,
		entry,
		sessionFile
	};
}
function cloneSessionEntries(store) {
	return Object.fromEntries(Object.entries(store).map(([sessionKey, entry]) => [sessionKey, { ...entry }]));
}
function collectSessionEntryKeys(...entries) {
	const keys = /* @__PURE__ */ new Set();
	for (const entry of entries) for (const key of Object.keys(entry)) keys.add(key);
	return [...keys];
}
function sessionEntryFieldEqual(left, right) {
	return Object.is(left, right) || (0, node_util.isDeepStrictEqual)(left, right);
}
function sessionEntryFieldUnset(hasValue, value) {
	return !hasValue || value === void 0;
}
function sessionEntryFieldUnchanged(params) {
	const { leftHasValue, leftValue, rightHasValue, rightValue } = params;
	if (sessionEntryFieldUnset(leftHasValue, leftValue) && sessionEntryFieldUnset(rightHasValue, rightValue)) return true;
	return leftHasValue === rightHasValue && sessionEntryFieldEqual(leftValue, rightValue);
}
function mergeConcurrentReplySessionMetadata(params) {
	const { currentEntry, preparedEntry, snapshotEntry } = params;
	if (!snapshotEntry || preparedEntry.sessionId !== snapshotEntry.sessionId) return preparedEntry;
	const merged = { ...preparedEntry };
	const mergedFields = merged;
	for (const key of collectSessionEntryKeys(currentEntry, preparedEntry, snapshotEntry)) {
		const currentHasValue = Object.hasOwn(currentEntry, key);
		const snapshotHasValue = Object.hasOwn(snapshotEntry, key);
		const preparedHasValue = Object.hasOwn(preparedEntry, key);
		const currentValue = currentEntry[key];
		const snapshotValue = snapshotEntry[key];
		const preparedValue = preparedEntry[key];
		const currentChanged = !sessionEntryFieldUnchanged({
			leftHasValue: currentHasValue,
			leftValue: currentValue,
			rightHasValue: snapshotHasValue,
			rightValue: snapshotValue
		});
		const preparedKeptSnapshot = sessionEntryFieldUnchanged({
			leftHasValue: preparedHasValue,
			leftValue: preparedValue,
			rightHasValue: snapshotHasValue,
			rightValue: snapshotValue
		});
		if (currentChanged && preparedKeptSnapshot) if (currentHasValue) mergedFields[key] = currentValue;
		else delete mergedFields[key];
	}
	return merged;
}
function createReplySessionInitializationRevision(params) {
	const { entry, storePath } = params;
	if (!entry) return JSON.stringify(null);
	const projected = require_store.projectSessionEntryForPersistenceRevision({
		storePath,
		entry
	});
	const revisionEntry = { sessionId: projected.sessionId };
	if (projected.sessionFile !== void 0) revisionEntry.sessionFile = projected.sessionFile;
	return JSON.stringify(revisionEntry);
}
function resolveInitializedReplySessionEntry(params) {
	const sessionFile = require_sqlite_marker.formatSqliteSessionFileMarker({
		agentId: params.agentId,
		sessionId: params.sessionEntry.sessionId,
		storePath: params.storePath
	});
	return {
		...params.sessionEntry,
		sessionFile
	};
}
/** Updates an existing entry only; returns null when the session is absent. */
async function updateSessionEntry(scope, update, options = {}) {
	return await patchSqliteSessionEntry(scope, update, options);
}
/**
* Records stable conversation metadata derived from one inbound message as a
* single storage-sized upsert (createIfMissing by default). Inbound metadata
* must not refresh activity timestamps — idle reset relies on updatedAt from
* real session turns — so existing rows merge with preserve-activity
* semantics while legacy alias keys collapse onto the canonical row.
*/
async function recordInboundSessionMeta(params) {
	return await recordSqliteInboundSessionMeta(params);
}
/**
* Persists the last known delivery route for one session as a single
* storage-sized patch. Route updates preserve activity timestamps (#49515)
* and merge explicit route/delivery input over the persisted session
* fallback before normalizing the derived last* fields.
*/
async function updateSessionLastRoute(params) {
	return await updateSqliteSessionLastRoute(params);
}
/** Resolves one abort target identity without exposing the mutable store. */
function resolveSessionAbortTarget(scope) {
	const entry = loadSessionEntry(scope);
	if (!entry) return null;
	return {
		entry: { ...entry },
		sessionId: entry.sessionId,
		sessionKey: require_store.normalizeStoreSessionKey(scope.sessionKey)
	};
}
/**
* Resolves, marks, touches, and canonicalizes one abort target entry as a
* storage-sized operation. Runtime abort side effects remain with callers.
*/
async function markSessionAbortTarget(params) {
	let resolvedTarget = null;
	try {
		const sessionKey = require_store.normalizeStoreSessionKey(params.scope.sessionKey);
		const updated = await patchSessionEntry(params.scope, (currentEntry) => {
			resolvedTarget = {
				entry: { ...currentEntry },
				persisted: false,
				sessionId: currentEntry.sessionId,
				sessionKey
			};
			const entry = {
				...currentEntry,
				abortedLastRun: true,
				updatedAt: params.now?.() ?? Date.now()
			};
			applySessionAbortCutoff(entry, params.resolveAbortCutoff?.({
				entry: { ...currentEntry },
				sessionKey
			}));
			return entry;
		}, {
			replaceEntry: true,
			skipMaintenance: true
		});
		return updated ? {
			entry: { ...updated },
			persisted: true,
			sessionId: updated.sessionId,
			sessionKey
		} : null;
	} catch (error) {
		const fallbackTarget = resolvedTarget;
		if (fallbackTarget) return {
			entry: fallbackTarget.entry,
			persisted: fallbackTarget.persisted,
			sessionId: fallbackTarget.sessionId,
			sessionKey: fallbackTarget.sessionKey,
			persistenceError: require_errors.formatErrorMessage(error)
		};
		throw error;
	}
}
function applySessionAbortCutoff(entry, cutoff) {
	entry.abortCutoffMessageSid = cutoff?.messageSid;
	entry.abortCutoffTimestamp = cutoff?.timestamp;
}
//#endregion
//#region src/config/sessions/session-accessor.transcript.ts
/** Keeps transcript event delivery behind the transcript owner boundary. */
function emitTranscriptUpdate(update) {
	require_transcript_events.emitSessionTranscriptUpdate(update);
}
/**
* Appends a non-message transcript record such as session or metadata events.
* Message records must use appendTranscriptMessage so parent links, idempotency,
* and redaction are preserved.
*/
async function appendTranscriptEvent(scope, event) {
	await appendSqliteTranscriptEvent(scope, event);
}
/** Appends a non-message transcript record synchronously for sync session runtimes. */
function appendTranscriptEventSync(scope, event) {
	appendSqliteTranscriptEventSync(scope, event);
}
/** Reads parsed transcript records from an explicit or derived transcript target. */
async function loadTranscriptEvents(scope) {
	return await loadSqliteTranscriptEvents(scope);
}
/** Replaces all transcript records for one SQLite-backed transcript. */
async function replaceTranscriptEvents(scope, events) {
	await replaceSqliteTranscriptEvents(scope, events);
}
/** Replaces all transcript records synchronously for sync session runtimes. */
function replaceTranscriptEventsSync(scope, events) {
	return replaceSqliteTranscriptEventsSync(scope, events);
}
/** Reads parsed transcript records synchronously from the SQLite transcript store. */
function loadTranscriptEventsSync(scope) {
	return loadSqliteTranscriptEventsSync(scope);
}
/** Reads transcript freshness and byte size without materializing event rows. */
function readTranscriptStatsSync(scope) {
	return readSqliteTranscriptStatsSync(scope);
}
/** Reads the latest visible assistant text without materializing the whole transcript. */
function readLatestTranscriptAssistantText(scope, options = {}) {
	return loadLatestSqliteAssistantText(scope, options);
}
async function appendTranscriptMessage(scope, options) {
	return await appendSqliteTranscriptMessage(scope, options);
}
/** Appends one transcript message synchronously for sync session runtimes. */
function appendTranscriptMessageSync(scope, options) {
	return appendSqliteTranscriptMessageSync(scope, options);
}
/** Resolves the persisted key for a SQLite transcript session id. */
function resolveTranscriptSessionKeyBySessionId(scope) {
	return resolveSqliteSessionKeyBySessionId(scope);
}
/**
* Finds the newest transcript record accepted by the matcher. Reads rows
* newest-first with early exit so hot append-path lookups never parse the
* whole transcript; missing transcripts match nothing. The match is wrapped
* so parsed falsy records stay distinguishable from "no match".
*/
async function findTranscriptEvent(scope, match) {
	return findSqliteTranscriptEvent(scope, match);
}
/** Emits a transcript update after resolving the current transcript target. */
async function publishTranscriptUpdate(scope, update = {}) {
	await publishSqliteTranscriptUpdate(scope, update);
}
/** Runs transcript read/append work under the backing store writer lock. */
async function withTranscriptWriteLock(scope, run) {
	return await withSqliteTranscriptWriteLock(scope, run);
}
/** Runs a synchronous DAG batch under one transcript writer queue and transaction. */
async function withTranscriptWriteTransaction(scope, run) {
	return await withSqliteTranscriptWriteTransaction(scope, run);
}
/**
* Trims a transcript for manual sessions.compact and clears stale token metadata.
* This is one storage-sized mutation: future stores can trim transcript rows and
* update entry metadata inside the same backend transaction.
*/
async function preflightSessionTranscriptForManualCompact(scope, params) {
	const events = await loadTranscriptEvents(scope).catch(() => []);
	if (events.length === 0) return {
		compacted: false,
		reason: "no transcript"
	};
	const maxLines = Math.max(1, Math.floor(params.maxLines));
	return events.length > maxLines ? { compacted: true } : {
		compacted: false,
		kept: events.length
	};
}
async function trimSessionTranscriptForManualCompact(scope, params) {
	const events = await loadTranscriptEvents(scope).catch(() => []);
	if (events.length === 0) return {
		compacted: false,
		reason: "no transcript"
	};
	const maxLines = Math.max(1, Math.floor(params.maxLines));
	const headerLine = JSON.stringify(events[0]);
	const tailLines = events.slice(1).map((event) => JSON.stringify(event));
	const maxTailLines = Math.max(0, maxLines - 1);
	if (events.length <= maxLines) return {
		compacted: false,
		kept: events.length
	};
	const lines = normalizeManualCompactTranscriptLines(headerLine, maxTailLines > 0 ? tailLines.slice(-maxTailLines) : []);
	if (!lines) return {
		compacted: false,
		kept: 0
	};
	await replaceSqliteTranscriptEvents(scope, lines.map((line) => JSON.parse(line)));
	const agentId = scope.agentId ?? require_session_key.resolveAgentIdFromSessionKey(scope.sessionKey);
	if (!agentId) throw new Error(`Cannot resolve manual compact transcript scope: ${scope.sessionKey}`);
	const archived = `${require_sqlite_marker.formatSqliteSessionFileMarker({
		agentId,
		sessionId: scope.sessionId,
		storePath: scope.storePath ?? ""
	})}.bak.${require_paths.formatSessionArchiveTimestamp()}`;
	await patchSessionEntry({
		...scope,
		sessionKey: scope.sessionKey,
		storePath: scope.storePath
	}, (entry) => {
		delete entry.contextBudgetStatus;
		delete entry.inputTokens;
		delete entry.outputTokens;
		delete entry.totalTokens;
		delete entry.totalTokensFresh;
		entry.updatedAt = params.nowMs ?? Date.now();
		return entry;
	}, { replaceEntry: true });
	return {
		archived,
		compacted: true,
		kept: lines.length
	};
}
function parseManualCompactTranscriptRecord(line) {
	try {
		const parsed = JSON.parse(line);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
function normalizeManualCompactTranscriptLines(headerLine, tailLines) {
	if (!headerLine) return null;
	const header = parseManualCompactTranscriptRecord(headerLine);
	if (header?.type !== "session" || typeof header.id !== "string") return null;
	const records = tailLines.map(parseManualCompactTranscriptRecord).filter((record) => record !== null);
	const retainedIds = /* @__PURE__ */ new Set();
	const transparentParents = /* @__PURE__ */ new Map();
	const normalizedRecords = [];
	for (const record of records) {
		let parentId = record.parentId;
		const seenTransparentParents = /* @__PURE__ */ new Set();
		while (typeof parentId === "string" && transparentParents.has(parentId) && !seenTransparentParents.has(parentId)) {
			seenTransparentParents.add(parentId);
			parentId = transparentParents.get(parentId) ?? null;
		}
		let next = typeof parentId === "string" && !retainedIds.has(parentId) ? {
			...record,
			parentId: null
		} : parentId !== record.parentId ? {
			...record,
			parentId
		} : record;
		if (next.type === "leaf") {
			const targetId = next.targetId;
			const validTargetId = targetId === null || typeof targetId === "string" && targetId.trim().length > 0;
			if (!validTargetId && typeof next.id === "string") transparentParents.set(next.id, next.parentId === null || typeof next.parentId === "string" ? next.parentId : null);
			if (typeof targetId === "string" && targetId.trim() && !retainedIds.has(targetId)) next = {
				...next,
				targetId: null,
				appendParentId: null
			};
			else if (validTargetId && typeof next.appendParentId === "string" && !retainedIds.has(next.appendParentId)) next = {
				...next,
				appendParentId: targetId
			};
		}
		if (next.type === "compaction" && typeof next.id === "string") {
			const firstKeptEntryId = next.firstKeptEntryId;
			if (typeof firstKeptEntryId === "string" && firstKeptEntryId !== next.id) {
				const branchPath = require_transcript_tree.selectSessionTranscriptTreePathNodes(require_transcript_tree.scanSessionTranscriptTree([...normalizedRecords, next]), next.id);
				if (!branchPath.some((node) => node.id === firstKeptEntryId)) next = {
					...next,
					firstKeptEntryId: branchPath[0]?.id ?? next.id
				};
			}
		}
		normalizedRecords.push(next);
		if (typeof next.id === "string" && next.id.trim()) retainedIds.add(next.id);
	}
	return [JSON.stringify(header), ...normalizedRecords.map((record) => JSON.stringify(record))];
}
//#endregion
//#region src/config/sessions/transcript-replay.ts
/** Tail kept so DM continuity survives silent session rotations. */
const DEFAULT_REPLAY_MAX_MESSAGES = 6;
function isValidReplayTimestamp(value) {
	if (typeof value === "number") return Number.isFinite(value);
	return typeof value === "string" && value.trim().length > 0;
}
function replayableRole(record) {
	if (record?.type !== "message" || typeof record.id !== "string" || record.id.trim().length === 0 || !isValidReplayTimestamp(record.timestamp) || !(record.parentId === null || record.parentId === void 0 || typeof record.parentId === "string")) return;
	const role = record.message?.role;
	return role === "user" || role === "assistant" ? role : void 0;
}
/**
* Copy the tail of user/assistant JSONL records from a prior transcript into a
* freshly-rotated one. Tool, system, and compaction records are skipped so
* replay cannot reshape tool/role ordering, and the tail is aligned and
* coalesced into alternating user/assistant turns so role-ordering resets
* cannot immediately recur. Uses async I/O so long transcripts do not block
* the event loop. Returns 0 on any error.
*/
async function replayRecentUserAssistantMessages(params) {
	const max = Math.max(0, params.maxMessages ?? DEFAULT_REPLAY_MAX_MESSAGES);
	const src = params.sourceTranscript;
	if (max === 0 || !src || !node_fs.default.existsSync(src)) return 0;
	try {
		const tail = await readRecentUserAssistantReplayLines({
			sourceTranscript: src,
			maxMessages: max
		});
		if (tail.length === 0) return 0;
		if (!node_fs.default.existsSync(params.targetTranscript)) {
			await node_fs_promises.default.mkdir(node_path.default.dirname(params.targetTranscript), { recursive: true });
			const header = JSON.stringify({
				type: "session",
				version: 3,
				id: params.newSessionId,
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				cwd: process.cwd()
			});
			await node_fs_promises.default.writeFile(params.targetTranscript, `${header}\n`, {
				encoding: "utf-8",
				mode: 384
			});
		}
		await node_fs_promises.default.appendFile(params.targetTranscript, `${tail.join("\n")}\n`, "utf-8");
		return tail.length;
	} catch {
		return 0;
	}
}
async function readRecentUserAssistantReplayRecordsFromJsonl(params) {
	const max = Math.max(0, params.maxMessages ?? DEFAULT_REPLAY_MAX_MESSAGES);
	const src = params.sourceTranscript;
	if (max === 0 || !src || !node_fs.default.existsSync(src)) return [];
	const records = [];
	for (const line of (await node_fs_promises.default.readFile(src, "utf-8")).split(/\r?\n/)) {
		if (!line.trim()) continue;
		try {
			records.push(JSON.parse(line));
		} catch {}
	}
	return selectRecentUserAssistantReplayRecords(records, max);
}
function selectRecentUserAssistantReplayRecords(records, maxMessages = DEFAULT_REPLAY_MAX_MESSAGES) {
	const max = Math.max(0, maxMessages);
	if (max === 0) return [];
	const kept = [];
	for (const record of records) {
		const role = replayableRole(record);
		if (role) kept.push({
			role,
			record
		});
	}
	return selectAlternatingReplayTail(kept, max).map((entry) => entry.record);
}
async function readRecentUserAssistantReplayLines(params) {
	const kept = [];
	for (const line of (await node_fs_promises.default.readFile(params.sourceTranscript, "utf-8")).split(/\r?\n/)) {
		if (!line.trim()) continue;
		try {
			const role = replayableRole(JSON.parse(line));
			if (role) kept.push({
				role,
				line
			});
		} catch {}
	}
	return selectAlternatingReplayTail(kept, params.maxMessages).map((entry) => entry.line);
}
function selectAlternatingReplayTail(kept, max) {
	if (kept.length === 0) return [];
	let startIdx = Math.max(0, kept.length - max);
	while (startIdx < kept.length && kept[startIdx]?.role === "assistant") startIdx += 1;
	if (startIdx === kept.length) return [];
	return coalesceAlternatingReplayTail(kept.slice(startIdx));
}
function coalesceAlternatingReplayTail(entries) {
	const tail = [];
	for (const entry of entries) {
		const lastIdx = tail.length - 1;
		if (lastIdx >= 0 && tail[lastIdx]?.role === entry.role) {
			tail[lastIdx] = entry;
			continue;
		}
		tail.push(entry);
	}
	return tail;
}
//#endregion
//#region src/config/sessions/session-accessor.reset.ts
const loadSessionArchiveRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./session-archive.runtime-Ctg43zmX.cjs")));
/**
* Persists a runner-driven reset rotation together with transcript replay and
* optional cleanup. File storage performs these steps sequentially; database
* backends implement this operation as one lifecycle transaction.
*/
async function persistSessionResetLifecycle(params) {
	let persistError;
	try {
		await replaceSessionEntry({
			sessionKey: params.sessionKey,
			storePath: params.storePath
		}, params.nextEntry);
	} catch (err) {
		persistError = err instanceof Error ? err : new Error(String(err));
	}
	const replayedMessages = await replayRecentUserAssistantMessagesToSqlite(params) ?? await replayRecentUserAssistantMessages({
		sourceTranscript: params.previousEntry.sessionFile,
		targetTranscript: params.nextSessionFile,
		newSessionId: params.nextEntry.sessionId
	});
	if (params.cleanupPreviousTranscript && params.previousSessionId) await archivePreviousSessionTranscript({
		agentId: params.agentId ?? require_session_key.resolveAgentIdFromSessionKey(params.sessionKey),
		previousEntry: params.previousEntry.sessionId === params.previousSessionId ? params.previousEntry : {
			...params.previousEntry,
			sessionId: params.previousSessionId
		},
		storePath: params.storePath
	});
	if (persistError) throw persistError;
	return { replayedMessages };
}
async function replayRecentUserAssistantMessagesToSqlite(params) {
	const targetMarker = require_sqlite_marker.parseSqliteSessionFileMarker(params.nextSessionFile);
	if (!targetMarker) return;
	try {
		const sourceMarker = require_sqlite_marker.parseSqliteSessionFileMarker(params.previousEntry.sessionFile);
		const sourceRecords = sourceMarker ? selectRecentUserAssistantReplayRecords(await loadTranscriptEvents({
			agentId: sourceMarker.agentId,
			sessionId: params.previousSessionId ?? sourceMarker.sessionId,
			sessionKey: params.sessionKey,
			storePath: sourceMarker.storePath
		})) : await readRecentUserAssistantReplayRecordsFromJsonl({ sourceTranscript: params.previousEntry.sessionFile });
		if (sourceRecords.length === 0) return 0;
		for (const record of sourceRecords) {
			const replayMessage = extractReplayMessage(record);
			if (replayMessage === void 0) continue;
			await appendTranscriptMessage({
				agentId: targetMarker.agentId,
				sessionId: targetMarker.sessionId,
				sessionKey: params.sessionKey,
				storePath: targetMarker.storePath
			}, { message: replayMessage });
		}
		return sourceRecords.length;
	} catch {
		return 0;
	}
}
function extractReplayMessage(record) {
	if (!record || typeof record !== "object" || Array.isArray(record)) return;
	const candidate = record;
	if (candidate.type !== "message") return;
	return candidate.message && typeof candidate.message === "object" ? candidate.message : void 0;
}
/** Loads the reply-session initialization rows without exposing a mutable store. */
function loadReplySessionInitializationSnapshot(params) {
	const store = Object.fromEntries(listSessionEntries({ storePath: params.storePath }).map(({ sessionKey, entry }) => [sessionKey, entry]));
	const resolved = resolveSessionEntryFromStore({
		store,
		sessionKey: params.sessionKey
	});
	const currentEntry = resolved.existing ? { ...resolved.existing } : void 0;
	const entries = cloneSessionEntries(store);
	return {
		...currentEntry ? { currentEntry } : {},
		readEntry: (sessionKey) => {
			const entry = resolveSessionEntryFromStore({
				store: entries,
				sessionKey
			}).existing;
			return entry ? { ...entry } : void 0;
		},
		revision: createReplySessionInitializationRevision({
			entry: currentEntry,
			storePath: params.storePath
		})
	};
}
/**
* Persists one reply-session initialization result and archives the previous
* transcript after metadata commits. SQLite adapters map the guarded write to a
* transaction and keep archive failure warning-only, matching file storage.
*/
async function commitReplySessionInitialization(params) {
	const store = Object.fromEntries(listSessionEntries({ storePath: params.storePath }).map(({ sessionKey, entry }) => [sessionKey, entry]));
	const resolved = resolveSessionEntryFromStore({
		store,
		sessionKey: params.sessionKey
	});
	const currentEntry = resolved.existing ? { ...resolved.existing } : void 0;
	const revision = createReplySessionInitializationRevision({
		entry: currentEntry,
		storePath: params.storePath
	});
	if (revision !== params.expectedRevision) return {
		ok: false,
		...currentEntry ? { currentEntry } : {},
		reason: "stale-snapshot",
		revision
	};
	const readEntry = (sessionKey) => {
		const entry = resolveSessionEntryFromStore({
			store,
			sessionKey
		}).existing;
		return entry ? { ...entry } : void 0;
	};
	const preparedSessionEntry = params.prepareSessionEntry ? await params.prepareSessionEntry({
		...currentEntry ? { currentEntry } : {},
		readEntry,
		sessionEntry: params.sessionEntry
	}) : params.sessionEntry;
	const sessionEntry = resolveInitializedReplySessionEntry({
		agentId: params.agentId,
		...currentEntry ? { currentEntry } : {},
		sessionEntry: preparedSessionEntry,
		storePath: params.storePath
	});
	let staleCommit;
	let committedSessionEntry = sessionEntry;
	const upserts = [{
		sessionKey: resolved.normalizedKey,
		buildEntry: ({ store: currentStore }) => {
			const commitEntry = resolveSessionEntryFromStore({
				store: currentStore,
				sessionKey: params.sessionKey
			}).existing;
			const commitRevision = createReplySessionInitializationRevision({
				entry: commitEntry,
				storePath: params.storePath
			});
			if (commitRevision !== params.expectedRevision) {
				staleCommit = {
					...commitEntry ? { currentEntry: { ...commitEntry } } : {},
					revision: commitRevision
				};
				return null;
			}
			committedSessionEntry = commitEntry ? mergeConcurrentReplySessionMetadata({
				currentEntry: commitEntry,
				preparedEntry: sessionEntry,
				snapshotEntry: params.snapshotEntry ?? params.previousEntry
			}) : sessionEntry;
			return committedSessionEntry;
		}
	}];
	if (params.retiredEntry) {
		const retiredEntry = params.retiredEntry;
		upserts.push({
			sessionKey: retiredEntry.key,
			buildEntry: () => staleCommit ? null : retiredEntry.entry
		});
	}
	await applySessionEntryLifecycleMutation({
		activeSessionKey: params.activeSessionKey,
		maintenanceOverride: params.maintenanceConfig,
		storePath: params.storePath,
		upserts
	});
	if (staleCommit) return {
		ok: false,
		...staleCommit.currentEntry ? { currentEntry: staleCommit.currentEntry } : {},
		reason: "stale-snapshot",
		revision: staleCommit.revision
	};
	store[resolved.normalizedKey] = committedSessionEntry;
	if (params.retiredEntry) store[params.retiredEntry.key] = params.retiredEntry.entry;
	const committed = {
		ok: true,
		previousSessionTranscript: {},
		sessionEntry: { ...committedSessionEntry },
		sessionStoreView: cloneSessionEntries(store)
	};
	const previousSessionTranscript = await archivePreviousSessionTranscript({
		agentId: params.agentId,
		onArchiveError: params.onArchiveError,
		previousEntry: params.previousEntry,
		storePath: params.storePath
	});
	return {
		...committed,
		previousSessionTranscript
	};
}
async function archivePreviousSessionTranscript(params) {
	if (!params.previousEntry?.sessionId) return {};
	const { archiveSessionTranscriptsDetailed, resolveStableSessionEndTranscript } = await loadSessionArchiveRuntime();
	const archivedTranscripts = archiveSessionTranscriptsDetailed({
		sessionId: params.previousEntry.sessionId,
		storePath: params.storePath,
		sessionFile: params.previousEntry.sessionFile,
		agentId: params.agentId,
		reason: "reset",
		onArchiveError: params.onArchiveError
	});
	return resolveStableSessionEndTranscript({
		sessionId: params.previousEntry.sessionId,
		storePath: params.storePath,
		sessionFile: params.previousEntry.sessionFile,
		agentId: params.agentId,
		archivedTranscripts
	});
}
//#endregion
//#region src/config/sessions/session-accessor.transcript-target.ts
/**
* Resolves the current storage-neutral runtime transcript target. SQLite-backed
* rows return their marker so transcript readers/writers stay on the accessor
* path instead of reopening legacy JSONL artifacts.
*/
async function resolveSessionTranscriptRuntimeTarget(scope) {
	const { agentId, sessionEntry, sessionKey, sessionStore } = resolveSessionTranscriptRuntimeContext(scope);
	if (shouldUseExplicitTranscriptFile(scope)) return {
		agentId,
		sessionFile: scope.sessionFile.trim(),
		sessionId: scope.sessionId,
		sessionKey
	};
	return {
		agentId,
		sessionFile: resolveRuntimeSessionFile(scope, agentId, sessionEntry),
		sessionId: scope.sessionId,
		sessionKey
	};
}
/**
* Resolves the runtime transcript target for read/delete probes without
* persisting missing sessionFile metadata into the session store.
*/
async function resolveSessionTranscriptRuntimeReadTarget(scope) {
	const { agentId, sessionEntry, sessionKey } = resolveSessionTranscriptRuntimeContext(scope);
	if (shouldUseExplicitTranscriptFile(scope)) return {
		agentId,
		sessionFile: scope.sessionFile.trim(),
		sessionId: scope.sessionId,
		sessionKey
	};
	return {
		agentId,
		sessionFile: resolveRuntimeSessionFile(scope, agentId, sessionEntry),
		sessionId: scope.sessionId,
		sessionKey
	};
}
function resolveRuntimeSessionFile(scope, agentId, sessionEntry) {
	const matchingSessionEntry = sessionEntry?.sessionId === void 0 || sessionEntry.sessionId === scope.sessionId ? sessionEntry : void 0;
	if (require_sqlite_marker.sqliteSessionFileMarkerMatchesSession(matchingSessionEntry?.sessionFile, scope.sessionId) && matchingSessionEntry?.sessionFile) return matchingSessionEntry.sessionFile;
	if (scope.storePath) return require_sqlite_marker.formatSqliteSessionFileMarker({
		agentId,
		sessionId: scope.sessionId,
		storePath: scope.storePath
	});
	return require_paths.resolveSessionFilePath(scope.sessionId, matchingSessionEntry, require_paths.resolveSessionFilePathOptions({
		agentId,
		storePath: scope.storePath
	}));
}
function resolveSessionTranscriptRuntimeContext(scope) {
	const agentId = scope.agentId ?? require_session_key.resolveAgentIdFromSessionKey(scope.sessionKey);
	if (!agentId) throw new Error(`Cannot resolve transcript scope without an agent id: ${scope.sessionKey}`);
	const sessionStore = scope.storePath ? Object.fromEntries(listSessionEntries({
		agentId,
		storePath: scope.storePath
	}).map(({ sessionKey, entry }) => [sessionKey, entry])) : void 0;
	const resolvedStoreEntry = sessionStore ? resolveSessionEntryFromStore({
		store: sessionStore,
		sessionKey: scope.sessionKey
	}) : void 0;
	const sessionEntry = resolvedStoreEntry?.existing ?? loadSessionEntry(scope);
	return {
		agentId,
		sessionKey: resolvedStoreEntry?.normalizedKey ?? scope.sessionKey,
		sessionStore,
		sessionEntry
	};
}
/**
* Resolves the current storage-neutral target for read-only transcript callers.
* Unlike writer/runtime resolution, this does not persist missing sessionFile
* metadata; reader projections must not mutate session metadata.
*/
function resolveSessionTranscriptReadTarget(scope) {
	const explicitSessionFile = scope.sessionFile?.trim();
	if (explicitSessionFile) return {
		sessionFile: explicitSessionFile,
		sessionId: scope.sessionId,
		...scope.agentId ? { agentId: scope.agentId } : {},
		...scope.sessionKey ? { sessionKey: scope.sessionKey } : {}
	};
	const entrySessionFile = scope.sessionEntry?.sessionFile?.trim();
	const entryMarker = require_sqlite_marker.parseSqliteSessionFileMarker(entrySessionFile);
	if (entrySessionFile && entryMarker && entryMarker.sessionId === scope.sessionId) return {
		agentId: scope.agentId ?? entryMarker.agentId,
		sessionFile: entrySessionFile,
		sessionId: scope.sessionId,
		...scope.sessionKey ? { sessionKey: scope.sessionKey } : {}
	};
	const agentId = scope.agentId ?? require_session_key.resolveAgentIdFromSessionKey(scope.sessionKey);
	if (!agentId) throw new Error(`Cannot resolve transcript scope without an agent id: ${scope.sessionKey}`);
	const storePath = resolveConcreteReadStorePath(scope.storePath);
	if (!storePath) {
		const resolvedStorePath = require_paths.resolveStorePath(require_io.getRuntimeConfig().session?.store, {
			agentId,
			env: scope.env
		});
		return {
			agentId,
			sessionFile: require_sqlite_marker.formatSqliteSessionFileMarker({
				agentId,
				sessionId: scope.sessionId,
				storePath: resolvedStorePath
			}),
			sessionId: scope.sessionId,
			...scope.sessionKey ? { sessionKey: scope.sessionKey } : {}
		};
	}
	const sessionKey = (scope.sessionEntry || !scope.sessionKey ? void 0 : storePath ? resolveSessionEntryFromStore({
		store: Object.fromEntries(listSessionEntries({
			agentId,
			storePath
		}).map(({ sessionKey, entry }) => [sessionKey, entry])),
		sessionKey: scope.sessionKey
	}) : void 0)?.normalizedKey ?? scope.sessionKey;
	return {
		agentId,
		sessionFile: require_sqlite_marker.formatSqliteSessionFileMarker({
			agentId,
			sessionId: scope.sessionId,
			storePath: storePath ?? ""
		}),
		sessionId: scope.sessionId,
		...sessionKey ? { sessionKey } : {}
	};
}
function resolveConcreteReadStorePath(storePath) {
	const trimmed = storePath?.trim();
	if (!trimmed || trimmed === "(multiple)" || trimmed.includes("{agentId}")) return;
	return trimmed;
}
function shouldUseExplicitTranscriptFile(scope) {
	if (!scope.sessionFile?.trim()) return false;
	return !Boolean(scope.storePath?.trim() && scope.sessionKey?.trim() && scope.sessionId?.trim());
}
//#endregion
//#region src/config/sessions/transcript-write-context.ts
const ownedTranscriptWriteContext = new node_async_hooks.AsyncLocalStorage();
function normalizeConcretePathForCompare(value) {
	const trimmed = value?.trim();
	if (!trimmed || require_sqlite_marker.parseSqliteSessionFileMarker(trimmed)) return;
	return node_path.default.resolve(trimmed);
}
function contextMatches(params) {
	const contextSessionFile = normalizeConcretePathForCompare(params.context.sessionFile);
	const sessionFile = normalizeConcretePathForCompare(params.sessionFile);
	if (contextSessionFile && sessionFile) return contextSessionFile === sessionFile;
	const contextSessionKey = params.context.sessionKey?.trim();
	const sessionKey = params.sessionKey?.trim();
	return Boolean(contextSessionKey && sessionKey && contextSessionKey === sessionKey);
}
/** Runs transcript writes with an owned write-lock context. */
async function withOwnedSessionTranscriptWrites(context, run) {
	return await ownedTranscriptWriteContext.run(context, run);
}
function bindOwnedSessionTranscriptWrites(context, run) {
	return (...args) => ownedTranscriptWriteContext.run(context, () => run(...args));
}
async function runWithOwnedSessionTranscriptWriteLock(params, run) {
	return await runWithOwnedSessionTranscriptWriteContext(params, run);
}
function canAdvanceOwnedSessionEntryCache(params) {
	const context = ownedTranscriptWriteContext.getStore();
	return Boolean(context && contextMatches({
		context,
		...params
	}) && context.publishSessionFileSnapshot && context.canAdvanceSessionEntryCache?.(params.snapshot));
}
function publishOwnedSessionFileSnapshot(params) {
	const context = ownedTranscriptWriteContext.getStore();
	if (!context || !contextMatches({
		context,
		...params
	}) || !context.publishSessionFileSnapshot) return;
	return context.publishSessionFileSnapshot(params.snapshot);
}
async function runWithOwnedSessionTranscriptWriteContext(params, run, options) {
	const context = ownedTranscriptWriteContext.getStore();
	if (!context || !contextMatches({
		context,
		...params
	})) return await run();
	return await context.withSessionWriteLock(run, options);
}
//#endregion
//#region src/config/sessions/session-accessor.transcript-turn.ts
/**
* Persists one logical transcript turn through the SQLite-backed session target.
* Transcript row append(s), the synthetic sessionFile marker, and the requested
* updatedAt touch happen before transcript update delivery is published.
*/
async function persistSessionTranscriptTurn(scope, options) {
	const expectedSessionId = options.expectedSessionId;
	if (expectedSessionId) return await persistExpectedSessionTranscriptTurn(scope, {
		...options,
		expectedSessionId
	});
	if (options.sessionLifecyclePatch) throw new Error("Cannot patch session lifecycle without an expected session id");
	const target = await resolveTranscriptTurnTarget(scope);
	const appendedMessages = await runWithOwnedSessionTranscriptWriteLock({
		sessionFile: target.sessionFile,
		sessionKey: target.sessionKey
	}, () => appendTranscriptTurnMessages(target, options));
	const appendedCount = countAppendedTranscriptMessages(appendedMessages);
	const sessionEntry = await touchTranscriptTurnSessionEntry({
		scope,
		target,
		shouldTouch: options.touchSessionEntry === true && appendedCount > 0
	});
	await publishTranscriptTurnUpdate({
		target,
		updateMode: options.updateMode ?? "inline",
		publishWhen: options.publishWhen ?? "when-appended",
		appendedMessages
	});
	return {
		appendedCount,
		messages: appendedMessages,
		sessionEntry,
		sessionFile: target.sessionFile
	};
}
async function appendTranscriptTurnMessages(target, options) {
	const selectedMessages = await selectAppendableTranscriptTurnMessages(target, options);
	const appendedMessages = [];
	for (const append of selectedMessages) {
		const { shouldAppend: _shouldAppend, ...appendOptions } = append;
		const result = await appendTranscriptMessage({
			...target.agentId ? { agentId: target.agentId } : {},
			...target.sessionId ? { sessionId: target.sessionId } : {},
			...target.sessionKey ? { sessionKey: target.sessionKey } : {},
			...target.storePath ? { storePath: target.storePath } : {}
		}, {
			...appendOptions,
			...append.cwd ?? options.cwd ? { cwd: append.cwd ?? options.cwd } : {},
			...append.config ?? options.config ? { config: append.config ?? options.config } : {}
		});
		if (result) appendedMessages.push(result);
	}
	return appendedMessages;
}
async function selectAppendableTranscriptTurnMessages(target, options) {
	const selectedMessages = [];
	for (const append of options.messages) {
		if (!(append.shouldAppend ? await append.shouldAppend({
			...target.agentId ? { agentId: target.agentId } : {},
			sessionFile: target.sessionFile,
			...target.sessionId ? { sessionId: target.sessionId } : {},
			...target.sessionKey ? { sessionKey: target.sessionKey } : {},
			...target.storePath ? { storePath: target.storePath } : {}
		}) : true)) continue;
		selectedMessages.push(append);
	}
	return selectedMessages;
}
function countAppendedTranscriptMessages(messages) {
	return messages.filter((message) => message.appended).length;
}
async function persistExpectedSessionTranscriptTurn(scope, options) {
	const sessionKey = scope.sessionKey?.trim();
	if (!scope.storePath || !sessionKey) throw new Error("Cannot guard a transcript turn without a session store and key");
	const storePath = scope.storePath;
	const expectedSessionId = options.expectedSessionId;
	const agentId = scope.agentId ?? require_session_key.resolveAgentIdFromSessionKey(sessionKey);
	if (!agentId) throw new Error(`Cannot resolve transcript turn without an agent id: ${sessionKey}`);
	const resolved = resolveSessionEntryFromStore({
		store: scope.sessionStore ?? Object.fromEntries(listSessionEntries({ storePath }).map(({ sessionKey: entryKey, entry }) => [entryKey, entry])),
		sessionKey
	});
	const target = {
		agentId,
		sessionFile: require_sqlite_marker.formatSqliteSessionFileMarker({
			agentId,
			sessionId: expectedSessionId,
			storePath
		}),
		sessionId: expectedSessionId,
		sessionKey: resolved.normalizedKey,
		storePath
	};
	const turn = await runWithOwnedSessionTranscriptWriteLock({
		sessionFile: target.sessionFile,
		sessionKey: target.sessionKey
	}, () => appendSqliteExpectedSessionTranscriptTurn({
		sessionKey: resolved.normalizedKey,
		sessionId: expectedSessionId,
		storePath
	}, {
		config: options.config,
		cwd: options.cwd,
		expectedLifecycleRevision: options.expectedLifecycleRevision,
		expectedSessionState: options.expectedSessionState,
		expectedSessionId,
		messages: options.messages,
		sessionLifecyclePatch: options.sessionLifecyclePatch,
		sessionFile: target.sessionFile,
		touchSessionEntry: options.touchSessionEntry
	}));
	if (turn.rejectedReason === "session-rebound") return {
		appendedCount: 0,
		messages: [],
		rejectedReason: "session-rebound",
		sessionEntry: turn.sessionEntry,
		sessionFile: turn.sessionFile
	};
	await publishTranscriptTurnUpdate({
		target,
		updateMode: options.updateMode ?? "inline",
		publishWhen: options.publishWhen ?? "when-appended",
		appendedMessages: turn.appendedMessages
	});
	if (turn.sessionEntry && scope.sessionStore) scope.sessionStore[resolved.normalizedKey] = turn.sessionEntry;
	return {
		appendedCount: countAppendedTranscriptMessages(turn.appendedMessages),
		messages: turn.appendedMessages,
		sessionEntry: turn.sessionEntry ?? scope.sessionEntry,
		sessionFile: turn.sessionFile
	};
}
async function resolveTranscriptTurnTarget(scope) {
	if (shouldUseExplicitTranscriptFile(scope)) {
		const marker = require_sqlite_marker.parseSqliteSessionFileMarker(scope.sessionFile);
		const agentId = scope.agentId ?? marker?.agentId;
		const sessionId = scope.sessionId ?? marker?.sessionId;
		const storePath = scope.storePath ?? marker?.storePath;
		return {
			...agentId ? { agentId } : {},
			sessionFile: scope.sessionFile.trim(),
			...sessionId ? { sessionId } : {},
			...scope.sessionKey ? { sessionKey: scope.sessionKey } : {},
			...storePath ? { storePath } : {},
			sessionEntry: scope.sessionEntry
		};
	}
	const sessionKey = scope.sessionKey?.trim();
	if (!sessionKey || !scope.sessionId) throw new Error("Cannot persist a transcript turn without a session key and session id or explicit session file");
	const agentId = scope.agentId ?? require_session_key.resolveAgentIdFromSessionKey(sessionKey);
	if (!agentId) throw new Error(`Cannot resolve transcript turn without an agent id: ${sessionKey}`);
	const storePath = scope.storePath ?? require_paths.resolveStorePath(require_io.getRuntimeConfig().session?.store, {
		agentId,
		env: scope.env
	});
	const store = scope.sessionStore ?? Object.fromEntries(listSessionEntries({
		agentId,
		storePath
	}).map(({ sessionKey: entryKey, entry }) => [entryKey, entry]));
	const resolved = store ? resolveSessionEntryFromStore({
		store,
		sessionKey
	}) : void 0;
	const sessionEntry = resolved?.existing ?? scope.sessionEntry ?? loadSessionEntry({
		...scope,
		agentId,
		sessionKey,
		storePath
	});
	return {
		agentId,
		sessionFile: require_sqlite_marker.formatSqliteSessionFileMarker({
			agentId,
			sessionId: scope.sessionId,
			storePath
		}),
		sessionId: scope.sessionId,
		sessionKey: resolved?.normalizedKey ?? sessionKey,
		storePath,
		sessionEntry
	};
}
async function touchTranscriptTurnSessionEntry(params) {
	if (!params.shouldTouch || !params.target.storePath || !params.target.sessionKey || !params.target.sessionId) return params.target.sessionEntry;
	const markerUpdatedAt = Date.now();
	const updated = await updateSessionEntry({
		sessionKey: params.target.sessionKey,
		storePath: params.target.storePath,
		...params.target.agentId ? { agentId: params.target.agentId } : {}
	}, (current) => current.sessionId === params.target.sessionId ? {
		sessionFile: params.target.sessionFile,
		updatedAt: Math.max(current.updatedAt ?? 0, markerUpdatedAt)
	} : null, { skipMaintenance: true });
	if (updated && params.scope.sessionStore) params.scope.sessionStore[params.target.sessionKey] = updated;
	return updated ?? params.target.sessionEntry;
}
async function publishTranscriptTurnUpdate(params) {
	if (params.updateMode === "none") return;
	const lastAppended = params.appendedMessages.findLast((message) => message.appended);
	if (params.publishWhen === "when-appended" && !lastAppended) return;
	const target = params.target.agentId && params.target.sessionId && params.target.sessionKey ? {
		agentId: params.target.agentId,
		sessionId: params.target.sessionId,
		sessionKey: params.target.sessionKey
	} : void 0;
	emitTranscriptUpdate({
		...params.target.sessionKey ? { sessionKey: params.target.sessionKey } : {},
		...params.target.agentId ? { agentId: params.target.agentId } : {},
		...target ? { target } : {},
		...params.updateMode === "inline" && lastAppended ? {
			message: lastAppended.message,
			messageId: lastAppended.messageId
		} : {},
		sessionFile: params.target.sessionFile
	});
}
//#endregion
//#region src/config/sessions/session-accessor.ts
var session_accessor_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	appendTranscriptEvent: () => appendTranscriptEvent,
	appendTranscriptEventSync: () => appendTranscriptEventSync,
	appendTranscriptMessage: () => appendTranscriptMessage,
	appendTranscriptMessageSync: () => appendTranscriptMessageSync,
	applySessionEntryLifecycleMutation: () => applySessionEntryLifecycleMutation,
	applySessionEntryReplacements: () => applySessionEntryReplacements,
	applySessionPatchProjection: () => applySessionPatchProjection,
	applySessionStoreProjection: () => applySessionStoreProjection,
	branchSessionFromCompactionCheckpoint: () => branchSessionFromCompactionCheckpoint,
	canonicalizeSessionEntryAliases: () => canonicalizeSessionEntryAliases,
	cleanupPluginHostSessionStore: () => cleanupPluginHostSessionStore,
	cleanupSessionLifecycleArtifacts: () => cleanupSessionLifecycleArtifacts,
	clearPluginOwnedSessionState: () => clearPluginOwnedSessionState,
	commitReplySessionInitialization: () => commitReplySessionInitialization,
	createSessionEntryWithTranscript: () => createSessionEntryWithTranscript,
	deleteSessionEntryLifecycle: () => deleteSessionEntryLifecycle,
	findTranscriptEvent: () => findTranscriptEvent,
	forkSessionEntryFromParentTarget: () => forkSessionEntryFromParentTarget,
	forkSessionFromParentTranscript: () => forkSessionFromParentTranscript,
	listSessionEntries: () => listSessionEntries,
	listSessionEntriesByStatus: () => listSessionEntriesByStatus,
	listSessionTranscriptInstances: () => listSessionTranscriptInstances,
	loadExactSessionEntry: () => loadExactSessionEntry,
	loadReplySessionInitializationSnapshot: () => loadReplySessionInitializationSnapshot,
	loadSessionEntry: () => loadSessionEntry,
	loadTranscriptEvents: () => loadTranscriptEvents,
	loadTranscriptEventsSync: () => loadTranscriptEventsSync,
	markSessionAbortTarget: () => markSessionAbortTarget,
	onSessionIdentityMutation: () => require_session_lifecycle_events.onSessionIdentityMutation,
	openSessionEntryReadView: () => openSessionEntryReadView,
	patchSessionEntry: () => patchSessionEntry,
	patchSessionEntryTarget: () => patchSessionEntryTarget,
	patchSessionEntryWithKey: () => patchSessionEntryWithKey,
	persistSessionResetLifecycle: () => persistSessionResetLifecycle,
	persistSessionTranscriptTurn: () => persistSessionTranscriptTurn,
	preflightSessionTranscriptForManualCompact: () => preflightSessionTranscriptForManualCompact,
	preserveTemporarySessionMapping: () => preserveTemporarySessionMapping,
	previewSessionDiskBudget: () => previewSessionDiskBudget,
	publishTranscriptUpdate: () => publishTranscriptUpdate,
	purgeDeletedAgentSessionEntries: () => purgeDeletedAgentSessionEntries,
	readLatestTranscriptAssistantText: () => readLatestTranscriptAssistantText,
	readSessionUpdatedAt: () => readSessionUpdatedAt,
	readTranscriptStatsSync: () => readTranscriptStatsSync,
	recordInboundSessionMeta: () => recordInboundSessionMeta,
	replaceSessionEntry: () => replaceSessionEntry,
	replaceSessionEntrySync: () => replaceSessionEntrySync,
	replaceTranscriptEvents: () => replaceTranscriptEvents,
	replaceTranscriptEventsSync: () => replaceTranscriptEventsSync,
	resetSessionEntryLifecycle: () => resetSessionEntryLifecycle,
	resolveSessionAbortTarget: () => resolveSessionAbortTarget,
	resolveSessionEntryAccessTarget: () => resolveSessionEntryAccessTarget,
	resolveSessionEntryCandidateTarget: () => resolveSessionEntryCandidateTarget,
	resolveSessionParentForkDecision: () => resolveSessionParentForkDecision,
	resolveSessionTranscriptReadTarget: () => resolveSessionTranscriptReadTarget,
	resolveSessionTranscriptRuntimeReadTarget: () => resolveSessionTranscriptRuntimeReadTarget,
	resolveSessionTranscriptRuntimeTarget: () => resolveSessionTranscriptRuntimeTarget,
	resolveTranscriptSessionKeyBySessionId: () => resolveTranscriptSessionKeyBySessionId,
	restoreSessionFromCompactionCheckpoint: () => restoreSessionFromCompactionCheckpoint,
	rollbackAgentHarnessSessionEntryLifecycle: () => rollbackAgentHarnessSessionEntryLifecycle,
	rollbackPluginOwnedSessionEntryLifecycle: () => rollbackPluginOwnedSessionEntryLifecycle,
	trimSessionTranscriptForManualCompact: () => trimSessionTranscriptForManualCompact,
	updateResolvedSessionEntry: () => updateResolvedSessionEntry,
	updateSessionEntry: () => updateSessionEntry,
	updateSessionLastRoute: () => updateSessionLastRoute,
	upsertSessionEntry: () => upsertSessionEntry,
	withTranscriptWriteLock: () => withTranscriptWriteLock,
	withTranscriptWriteTransaction: () => withTranscriptWriteTransaction
});
//#endregion
Object.defineProperty(exports, "appendJsonlEntrySync", {
	enumerable: true,
	get: function() {
		return appendJsonlEntrySync;
	}
});
Object.defineProperty(exports, "appendSerializedJsonlEntrySync", {
	enumerable: true,
	get: function() {
		return appendSerializedJsonlEntrySync;
	}
});
Object.defineProperty(exports, "appendTranscriptEventSync", {
	enumerable: true,
	get: function() {
		return appendTranscriptEventSync;
	}
});
Object.defineProperty(exports, "appendTranscriptMessage", {
	enumerable: true,
	get: function() {
		return appendTranscriptMessage;
	}
});
Object.defineProperty(exports, "appendTranscriptMessageSync", {
	enumerable: true,
	get: function() {
		return appendTranscriptMessageSync;
	}
});
Object.defineProperty(exports, "applySessionEntryLifecycleMutation", {
	enumerable: true,
	get: function() {
		return applySessionEntryLifecycleMutation;
	}
});
Object.defineProperty(exports, "applySessionEntryReplacements", {
	enumerable: true,
	get: function() {
		return applySessionEntryReplacements;
	}
});
Object.defineProperty(exports, "applySessionPatchProjection", {
	enumerable: true,
	get: function() {
		return applySessionPatchProjection;
	}
});
Object.defineProperty(exports, "bindOwnedSessionTranscriptWrites", {
	enumerable: true,
	get: function() {
		return bindOwnedSessionTranscriptWrites;
	}
});
Object.defineProperty(exports, "branchSessionFromCompactionCheckpoint", {
	enumerable: true,
	get: function() {
		return branchSessionFromCompactionCheckpoint;
	}
});
Object.defineProperty(exports, "branchSqliteCompactionCheckpointSession", {
	enumerable: true,
	get: function() {
		return branchSqliteCompactionCheckpointSession;
	}
});
Object.defineProperty(exports, "buildGroupDisplayName", {
	enumerable: true,
	get: function() {
		return buildGroupDisplayName;
	}
});
Object.defineProperty(exports, "buildGroupDisplayTitle", {
	enumerable: true,
	get: function() {
		return buildGroupDisplayTitle;
	}
});
Object.defineProperty(exports, "canAdvanceOwnedSessionEntryCache", {
	enumerable: true,
	get: function() {
		return canAdvanceOwnedSessionEntryCache;
	}
});
Object.defineProperty(exports, "canonicalizeSessionEntryAliases", {
	enumerable: true,
	get: function() {
		return canonicalizeSessionEntryAliases;
	}
});
Object.defineProperty(exports, "canonicalizeSessionKeyForAgent", {
	enumerable: true,
	get: function() {
		return canonicalizeSessionKeyForAgent;
	}
});
Object.defineProperty(exports, "canonicalizeSpawnedByForAgent", {
	enumerable: true,
	get: function() {
		return canonicalizeSpawnedByForAgent;
	}
});
Object.defineProperty(exports, "cleanupPluginHostSessionStore", {
	enumerable: true,
	get: function() {
		return cleanupPluginHostSessionStore;
	}
});
Object.defineProperty(exports, "commitReplySessionInitialization", {
	enumerable: true,
	get: function() {
		return commitReplySessionInitialization;
	}
});
Object.defineProperty(exports, "createSessionEntryWithTranscript", {
	enumerable: true,
	get: function() {
		return createSessionEntryWithTranscript;
	}
});
Object.defineProperty(exports, "createSessionTranscriptHeader", {
	enumerable: true,
	get: function() {
		return createSessionTranscriptHeader;
	}
});
Object.defineProperty(exports, "deleteOrphanedTranscriptIndexRowsInTransaction", {
	enumerable: true,
	get: function() {
		return deleteOrphanedTranscriptIndexRowsInTransaction;
	}
});
Object.defineProperty(exports, "deleteSessionEntryLifecycle", {
	enumerable: true,
	get: function() {
		return deleteSessionEntryLifecycle;
	}
});
Object.defineProperty(exports, "deriveContextPromptTokens", {
	enumerable: true,
	get: function() {
		return deriveContextPromptTokens;
	}
});
Object.defineProperty(exports, "derivePromptTokens", {
	enumerable: true,
	get: function() {
		return derivePromptTokens;
	}
});
Object.defineProperty(exports, "deriveSessionMetaPatch", {
	enumerable: true,
	get: function() {
		return deriveSessionMetaPatch;
	}
});
Object.defineProperty(exports, "deriveSessionTotalTokens", {
	enumerable: true,
	get: function() {
		return deriveSessionTotalTokens;
	}
});
Object.defineProperty(exports, "findTranscriptEvent", {
	enumerable: true,
	get: function() {
		return findTranscriptEvent;
	}
});
Object.defineProperty(exports, "forkSessionEntryFromParentTarget", {
	enumerable: true,
	get: function() {
		return forkSessionEntryFromParentTarget;
	}
});
Object.defineProperty(exports, "forkSessionFromParentTranscript", {
	enumerable: true,
	get: function() {
		return forkSessionFromParentTranscript;
	}
});
Object.defineProperty(exports, "hasNonzeroUsage", {
	enumerable: true,
	get: function() {
		return hasNonzeroUsage;
	}
});
Object.defineProperty(exports, "importSqliteSessionRows", {
	enumerable: true,
	get: function() {
		return importSqliteSessionRows;
	}
});
Object.defineProperty(exports, "listSessionEntries", {
	enumerable: true,
	get: function() {
		return listSessionEntries;
	}
});
Object.defineProperty(exports, "listSessionEntriesByStatus", {
	enumerable: true,
	get: function() {
		return listSessionEntriesByStatus;
	}
});
Object.defineProperty(exports, "listSessionTranscriptInstances", {
	enumerable: true,
	get: function() {
		return listSessionTranscriptInstances;
	}
});
Object.defineProperty(exports, "listSessionsNeedingTranscriptIndexReconcile", {
	enumerable: true,
	get: function() {
		return listSessionsNeedingTranscriptIndexReconcile;
	}
});
Object.defineProperty(exports, "loadExactSessionEntry", {
	enumerable: true,
	get: function() {
		return loadExactSessionEntry;
	}
});
Object.defineProperty(exports, "loadExactSqliteSessionEntry", {
	enumerable: true,
	get: function() {
		return loadExactSqliteSessionEntry;
	}
});
Object.defineProperty(exports, "loadReplySessionInitializationSnapshot", {
	enumerable: true,
	get: function() {
		return loadReplySessionInitializationSnapshot;
	}
});
Object.defineProperty(exports, "loadSessionEntry", {
	enumerable: true,
	get: function() {
		return loadSessionEntry;
	}
});
Object.defineProperty(exports, "loadTranscriptEvents", {
	enumerable: true,
	get: function() {
		return loadTranscriptEvents;
	}
});
Object.defineProperty(exports, "loadTranscriptEventsSync", {
	enumerable: true,
	get: function() {
		return loadTranscriptEventsSync;
	}
});
Object.defineProperty(exports, "makeZeroUsageSnapshot", {
	enumerable: true,
	get: function() {
		return makeZeroUsageSnapshot;
	}
});
Object.defineProperty(exports, "markSessionAbortTarget", {
	enumerable: true,
	get: function() {
		return markSessionAbortTarget;
	}
});
Object.defineProperty(exports, "normalizeUsage", {
	enumerable: true,
	get: function() {
		return normalizeUsage;
	}
});
Object.defineProperty(exports, "openSessionEntryReadView", {
	enumerable: true,
	get: function() {
		return openSessionEntryReadView;
	}
});
Object.defineProperty(exports, "patchSessionEntry", {
	enumerable: true,
	get: function() {
		return patchSessionEntry;
	}
});
Object.defineProperty(exports, "patchSessionEntryTarget", {
	enumerable: true,
	get: function() {
		return patchSessionEntryTarget;
	}
});
Object.defineProperty(exports, "patchSessionEntryWithKey", {
	enumerable: true,
	get: function() {
		return patchSessionEntryWithKey;
	}
});
Object.defineProperty(exports, "persistSessionResetLifecycle", {
	enumerable: true,
	get: function() {
		return persistSessionResetLifecycle;
	}
});
Object.defineProperty(exports, "persistSessionTranscriptTurn", {
	enumerable: true,
	get: function() {
		return persistSessionTranscriptTurn;
	}
});
Object.defineProperty(exports, "preflightSessionTranscriptForManualCompact", {
	enumerable: true,
	get: function() {
		return preflightSessionTranscriptForManualCompact;
	}
});
Object.defineProperty(exports, "previewSessionDiskBudget", {
	enumerable: true,
	get: function() {
		return previewSessionDiskBudget;
	}
});
Object.defineProperty(exports, "publishOwnedSessionFileSnapshot", {
	enumerable: true,
	get: function() {
		return publishOwnedSessionFileSnapshot;
	}
});
Object.defineProperty(exports, "publishTranscriptUpdate", {
	enumerable: true,
	get: function() {
		return publishTranscriptUpdate;
	}
});
Object.defineProperty(exports, "purgeDeletedAgentSessionEntries", {
	enumerable: true,
	get: function() {
		return purgeDeletedAgentSessionEntries;
	}
});
Object.defineProperty(exports, "readLatestTranscriptAssistantText", {
	enumerable: true,
	get: function() {
		return readLatestTranscriptAssistantText;
	}
});
Object.defineProperty(exports, "readSessionUpdatedAt", {
	enumerable: true,
	get: function() {
		return readSessionUpdatedAt;
	}
});
Object.defineProperty(exports, "readTranscriptStatsSync", {
	enumerable: true,
	get: function() {
		return readTranscriptStatsSync;
	}
});
Object.defineProperty(exports, "rebuildSessionTranscriptIndexInTransaction", {
	enumerable: true,
	get: function() {
		return rebuildSessionTranscriptIndexInTransaction;
	}
});
Object.defineProperty(exports, "recordInboundSessionMeta", {
	enumerable: true,
	get: function() {
		return recordInboundSessionMeta;
	}
});
Object.defineProperty(exports, "redactTranscriptMessage", {
	enumerable: true,
	get: function() {
		return redactTranscriptMessage;
	}
});
Object.defineProperty(exports, "replaceSessionEntrySync", {
	enumerable: true,
	get: function() {
		return replaceSessionEntrySync;
	}
});
Object.defineProperty(exports, "replaceTranscriptEvents", {
	enumerable: true,
	get: function() {
		return replaceTranscriptEvents;
	}
});
Object.defineProperty(exports, "replaceTranscriptEventsSync", {
	enumerable: true,
	get: function() {
		return replaceTranscriptEventsSync;
	}
});
Object.defineProperty(exports, "resetSessionEntryLifecycle", {
	enumerable: true,
	get: function() {
		return resetSessionEntryLifecycle;
	}
});
Object.defineProperty(exports, "resolveConversationLabel", {
	enumerable: true,
	get: function() {
		return resolveConversationLabel;
	}
});
Object.defineProperty(exports, "resolveGroupSessionKey", {
	enumerable: true,
	get: function() {
		return resolveGroupSessionKey;
	}
});
Object.defineProperty(exports, "resolveInternalSessionEffectsIdentity", {
	enumerable: true,
	get: function() {
		return resolveInternalSessionEffectsIdentity;
	}
});
Object.defineProperty(exports, "resolveSessionAbortTarget", {
	enumerable: true,
	get: function() {
		return resolveSessionAbortTarget;
	}
});
Object.defineProperty(exports, "resolveSessionEntryAccessTarget", {
	enumerable: true,
	get: function() {
		return resolveSessionEntryAccessTarget;
	}
});
Object.defineProperty(exports, "resolveSessionEntryCandidateTarget", {
	enumerable: true,
	get: function() {
		return resolveSessionEntryCandidateTarget;
	}
});
Object.defineProperty(exports, "resolveSessionParentForkDecision", {
	enumerable: true,
	get: function() {
		return resolveSessionParentForkDecision;
	}
});
Object.defineProperty(exports, "resolveSessionStoreAgentId", {
	enumerable: true,
	get: function() {
		return resolveSessionStoreAgentId;
	}
});
Object.defineProperty(exports, "resolveSessionStoreKey", {
	enumerable: true,
	get: function() {
		return resolveSessionStoreKey;
	}
});
Object.defineProperty(exports, "resolveSessionTranscriptReadTarget", {
	enumerable: true,
	get: function() {
		return resolveSessionTranscriptReadTarget;
	}
});
Object.defineProperty(exports, "resolveSessionTranscriptRuntimeReadTarget", {
	enumerable: true,
	get: function() {
		return resolveSessionTranscriptRuntimeReadTarget;
	}
});
Object.defineProperty(exports, "resolveSessionTranscriptRuntimeTarget", {
	enumerable: true,
	get: function() {
		return resolveSessionTranscriptRuntimeTarget;
	}
});
Object.defineProperty(exports, "resolveStoredSessionKeyForAgentStore", {
	enumerable: true,
	get: function() {
		return resolveStoredSessionKeyForAgentStore;
	}
});
Object.defineProperty(exports, "resolveStoredSessionOwnerAgentId", {
	enumerable: true,
	get: function() {
		return resolveStoredSessionOwnerAgentId;
	}
});
Object.defineProperty(exports, "resolveTranscriptSessionKeyBySessionId", {
	enumerable: true,
	get: function() {
		return resolveTranscriptSessionKeyBySessionId;
	}
});
Object.defineProperty(exports, "restoreSessionFromCompactionCheckpoint", {
	enumerable: true,
	get: function() {
		return restoreSessionFromCompactionCheckpoint;
	}
});
Object.defineProperty(exports, "restoreSqliteCompactionCheckpointSession", {
	enumerable: true,
	get: function() {
		return restoreSqliteCompactionCheckpointSession;
	}
});
Object.defineProperty(exports, "rollbackPluginOwnedSessionEntryLifecycle", {
	enumerable: true,
	get: function() {
		return rollbackPluginOwnedSessionEntryLifecycle;
	}
});
Object.defineProperty(exports, "selectVisibleTranscriptEventEntries", {
	enumerable: true,
	get: function() {
		return selectVisibleTranscriptEventEntries;
	}
});
Object.defineProperty(exports, "selectVisibleTranscriptEvents", {
	enumerable: true,
	get: function() {
		return selectVisibleTranscriptEvents;
	}
});
Object.defineProperty(exports, "serializeJsonlEntry", {
	enumerable: true,
	get: function() {
		return serializeJsonlEntry;
	}
});
Object.defineProperty(exports, "serializeJsonlLine", {
	enumerable: true,
	get: function() {
		return serializeJsonlLine;
	}
});
Object.defineProperty(exports, "session_accessor_exports", {
	enumerable: true,
	get: function() {
		return session_accessor_exports;
	}
});
Object.defineProperty(exports, "snapshotSessionOrigin", {
	enumerable: true,
	get: function() {
		return snapshotSessionOrigin;
	}
});
Object.defineProperty(exports, "toOpenAiChatCompletionsUsage", {
	enumerable: true,
	get: function() {
		return toOpenAiChatCompletionsUsage;
	}
});
Object.defineProperty(exports, "trimSessionTranscriptForManualCompact", {
	enumerable: true,
	get: function() {
		return trimSessionTranscriptForManualCompact;
	}
});
Object.defineProperty(exports, "updateResolvedSessionEntry", {
	enumerable: true,
	get: function() {
		return updateResolvedSessionEntry;
	}
});
Object.defineProperty(exports, "updateSessionEntry", {
	enumerable: true,
	get: function() {
		return updateSessionEntry;
	}
});
Object.defineProperty(exports, "updateSessionLastRoute", {
	enumerable: true,
	get: function() {
		return updateSessionLastRoute;
	}
});
Object.defineProperty(exports, "upsertSessionEntry", {
	enumerable: true,
	get: function() {
		return upsertSessionEntry;
	}
});
Object.defineProperty(exports, "withOwnedSessionTranscriptWrites", {
	enumerable: true,
	get: function() {
		return withOwnedSessionTranscriptWrites;
	}
});
Object.defineProperty(exports, "withTranscriptWriteLock", {
	enumerable: true,
	get: function() {
		return withTranscriptWriteLock;
	}
});
Object.defineProperty(exports, "withTranscriptWriteTransaction", {
	enumerable: true,
	get: function() {
		return withTranscriptWriteTransaction;
	}
});
Object.defineProperty(exports, "writeJsonlEntriesSync", {
	enumerable: true,
	get: function() {
		return writeJsonlEntriesSync;
	}
});
Object.defineProperty(exports, "writeJsonlLines", {
	enumerable: true,
	get: function() {
		return writeJsonlLines;
	}
});
