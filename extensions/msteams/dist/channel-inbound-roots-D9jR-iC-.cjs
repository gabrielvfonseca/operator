const require_public_surface_loader = require("./public-surface-loader-CK-Iot2Y.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/media/channel-inbound-roots.ts
const mediaContractApiByChannel = /* @__PURE__ */ new Map();
function loadChannelMediaContractApi(channelId, resolver) {
	if (mediaContractApiByChannel.has(channelId)) {
		const cached = mediaContractApiByChannel.get(channelId);
		return cached && typeof cached[resolver] === "function" ? cached : void 0;
	}
	try {
		const loaded = require_public_surface_loader.loadBundledPluginPublicArtifactModuleSync({
			dirName: channelId,
			artifactBasename: "media-contract-api.js"
		});
		mediaContractApiByChannel.set(channelId, loaded);
		if (typeof loaded[resolver] === "function") return loaded;
		return;
	} catch (error) {
		if (!(error instanceof Error && error.message.startsWith("Unable to resolve bundled plugin public surface "))) throw error;
	}
	mediaContractApiByChannel.set(channelId, null);
}
function findChannelMediaContractApi(channelId, resolver) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId);
	if (!normalized) return;
	return loadChannelMediaContractApi(normalized, resolver);
}
/** Resolves local inbound attachment roots from the channel named in a message context. */
function resolveChannelInboundAttachmentRoots(params) {
	return resolveChannelInboundAttachmentRootsForChannel({
		cfg: params.cfg,
		channelId: params.ctx.Surface ?? params.ctx.Provider,
		accountId: params.ctx.AccountId
	});
}
/** Resolves local inbound attachment roots for callers that already know the channel id. */
function resolveChannelInboundAttachmentRootsForChannel(params) {
	const contractApi = findChannelMediaContractApi(params.channelId, "resolveInboundAttachmentRoots");
	if (contractApi?.resolveInboundAttachmentRoots) return contractApi.resolveInboundAttachmentRoots({
		cfg: params.cfg,
		accountId: params.accountId ?? void 0
	});
}
/** Resolves remote staging roots for inbound channel attachments without loading full channel code. */
function resolveChannelRemoteInboundAttachmentRoots(params) {
	const contractApi = findChannelMediaContractApi(params.ctx.Surface ?? params.ctx.Provider, "resolveRemoteInboundAttachmentRoots");
	if (contractApi?.resolveRemoteInboundAttachmentRoots) return contractApi.resolveRemoteInboundAttachmentRoots({
		cfg: params.cfg,
		accountId: params.ctx.AccountId
	});
}
//#endregion
Object.defineProperty(exports, "resolveChannelInboundAttachmentRoots", {
	enumerable: true,
	get: function() {
		return resolveChannelInboundAttachmentRoots;
	}
});
Object.defineProperty(exports, "resolveChannelInboundAttachmentRootsForChannel", {
	enumerable: true,
	get: function() {
		return resolveChannelInboundAttachmentRootsForChannel;
	}
});
Object.defineProperty(exports, "resolveChannelRemoteInboundAttachmentRoots", {
	enumerable: true,
	get: function() {
		return resolveChannelRemoteInboundAttachmentRoots;
	}
});
