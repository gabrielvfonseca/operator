const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_dispatch = require("./dispatch-DMC5F8fZ.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/provider-dispatcher.ts
/** Dispatch a reply using the buffered block dispatcher path. */
const dispatchReplyWithBufferedBlockDispatcher = async (params) => {
	return await require_dispatch.dispatchInboundMessageWithBufferedDispatcher({
		ctx: params.ctx,
		cfg: params.cfg,
		dispatcherOptions: params.dispatcherOptions,
		toolsAllow: params.toolsAllow,
		replyResolver: params.replyResolver,
		replyOptions: params.replyOptions
	});
};
//#endregion
//#region src/channels/session.ts
const loadInboundSessionRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./inbound.runtime-5wmC-Vmi.cjs")).then((n) => n.inbound_runtime_exports));
function shouldSkipPinnedMainDmRouteUpdate(pin) {
	if (!pin) return false;
	const owner = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(pin.ownerRecipient);
	const sender = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(pin.senderRecipient);
	if (!owner || !sender || owner === sender) return false;
	pin.onSkip?.({
		ownerRecipient: pin.ownerRecipient,
		senderRecipient: pin.senderRecipient
	});
	return true;
}
async function recordInboundSession(params) {
	const { storePath, sessionKey, ctx, groupResolution, createIfMissing } = params;
	const canonicalSessionKey = require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(sessionKey);
	const runtime = await loadInboundSessionRuntime();
	const metaTask = runtime.recordInboundSessionMeta({
		storePath,
		sessionKey: canonicalSessionKey,
		ctx,
		groupResolution,
		createIfMissing
	}).catch(async (err) => {
		try {
			await Promise.resolve(params.onRecordError(err));
		} catch {}
	});
	params.trackSessionMetaTask?.(metaTask);
	const update = params.updateLastRoute;
	if (!update) return;
	if (shouldSkipPinnedMainDmRouteUpdate(update.mainDmOwnerPin)) return;
	const targetSessionKey = require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(update.sessionKey);
	await runtime.updateSessionLastRoute({
		storePath,
		sessionKey: targetSessionKey,
		route: update.route,
		deliveryContext: {
			channel: update.channel,
			to: update.to,
			accountId: update.accountId,
			threadId: update.threadId
		},
		ctx: targetSessionKey === canonicalSessionKey ? ctx : void 0,
		groupResolution,
		createIfMissing
	});
}
//#endregion
Object.defineProperty(exports, "dispatchReplyWithBufferedBlockDispatcher", {
	enumerable: true,
	get: function() {
		return dispatchReplyWithBufferedBlockDispatcher;
	}
});
Object.defineProperty(exports, "recordInboundSession", {
	enumerable: true,
	get: function() {
		return recordInboundSession;
	}
});
