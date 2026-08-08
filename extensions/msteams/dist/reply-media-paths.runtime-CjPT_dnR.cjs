const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_reply_payload = require("./reply-payload-DomDFObW.cjs");
const require_reply_payload$1 = require("./reply-payload-B-1jXr3E.cjs");
const require_outbound_attachment = require("./outbound-attachment-ry_WMADm.cjs");
const require_sandbox_paths = require("./sandbox-paths-BmmHDLnB.cjs");
const require_path_policy = require("./path-policy-CP90OpIp.cjs");
const require_read_capability = require("./read-capability-CG92FLhs.cjs");
const require_sandbox = require("./sandbox-CjshBxRn.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_media_core_media_source_url = require("@gabrielvfonseca/media-core/media-source-url");
//#region src/auto-reply/reply/reply-media-paths.ts
const FILE_URL_RE = /^file:\/\//i;
const WINDOWS_DRIVE_RE = /^[a-zA-Z]:[\\/]/;
const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const HAS_FILE_EXT_RE = /\.\w{1,10}$/;
function isLikelyLocalMediaSource(media) {
	return FILE_URL_RE.test(media) || media.startsWith("/") || media.startsWith("./") || media.startsWith("../") || media.startsWith("~") || WINDOWS_DRIVE_RE.test(media) || media.startsWith("\\\\") || !SCHEME_RE.test(media) && (media.includes("/") || media.includes("\\") || HAS_FILE_EXT_RE.test(media));
}
function getPayloadMediaList(payload) {
	return require_reply_payload.resolveSendableOutboundReplyParts(payload).mediaUrls;
}
function createReplyMediaPathNormalizer(params) {
	const agentId = params.agentId ?? (params.sessionKey ? require_agent_scope.resolveSessionAgentId({
		sessionKey: params.sessionKey,
		config: params.cfg
	}) : void 0);
	const maxBytes = require_read_capability.resolveOutboundMediaMaxBytes({
		cfg: params.cfg,
		channel: params.messageProvider,
		accountId: params.accountId
	});
	let sandboxRootPromise;
	const persistedMediaBySource = /* @__PURE__ */ new Map();
	const resolveSandboxRoot = async () => {
		if (!sandboxRootPromise) sandboxRootPromise = require_sandbox.ensureSandboxWorkspaceForSession({
			config: params.cfg,
			sessionKey: params.sessionKey,
			workspaceDir: params.workspaceDir
		}).then((sandbox) => sandbox?.workspaceDir);
		return await sandboxRootPromise;
	};
	const resolveMediaAccessForSource = (media) => require_read_capability.resolveAgentScopedOutboundMediaAccess({
		cfg: params.cfg,
		agentId,
		workspaceDir: params.workspaceDir,
		mediaSources: [media],
		sessionKey: params.sessionKey,
		messageProvider: params.sessionKey ? void 0 : params.messageProvider,
		accountId: params.accountId,
		requesterSenderId: params.requesterSenderId,
		requesterSenderName: params.requesterSenderName,
		requesterSenderUsername: params.requesterSenderUsername,
		requesterSenderE164: params.requesterSenderE164,
		groupId: params.groupId,
		groupChannel: params.groupChannel,
		groupSpace: params.groupSpace
	});
	const persistLocalReplyMedia = async (media) => {
		if (!isLikelyLocalMediaSource(media)) return media;
		const managedMediaPath = await require_sandbox_paths.resolveAllowedManagedMediaPath(media);
		if (managedMediaPath) return managedMediaPath;
		const cached = persistedMediaBySource.get(media);
		if (cached) return await cached;
		const persistPromise = require_outbound_attachment.resolveOutboundAttachmentFromUrl(media, maxBytes, { mediaAccess: resolveMediaAccessForSource(media) }).then((saved) => saved.path).catch((err) => {
			persistedMediaBySource.delete(media);
			throw err;
		});
		persistedMediaBySource.set(media, persistPromise);
		return await persistPromise;
	};
	const resolveWorkspaceRelativeMedia = (media) => {
		return require_path_policy.resolvePathFromInput(require_path_policy.toRelativeWorkspacePath(params.workspaceDir, media, { cwd: params.workspaceDir }), params.workspaceDir);
	};
	const resolveAbsoluteWorkspaceMedia = (media) => {
		if (FILE_URL_RE.test(media) || !node_path.default.isAbsolute(media) && !WINDOWS_DRIVE_RE.test(media)) return;
		try {
			return resolveWorkspaceRelativeMedia(media);
		} catch {
			return;
		}
	};
	const normalizeMediaSource = async (raw) => {
		const media = raw.trim();
		if (!media) return media;
		require_sandbox_paths.assertMediaNotDataUrl(media);
		if ((0, _gabrielvfonseca_media_core_media_source_url.isPassThroughRemoteMediaSource)(media)) return media;
		const absoluteWorkspaceMedia = resolveAbsoluteWorkspaceMedia(media);
		if (absoluteWorkspaceMedia) return await persistLocalReplyMedia(absoluteWorkspaceMedia);
		const isRelativeLocalMedia = isLikelyLocalMediaSource(media) && !FILE_URL_RE.test(media) && !media.startsWith("~") && !node_path.default.isAbsolute(media) && !WINDOWS_DRIVE_RE.test(media);
		const sandboxRoot = await resolveSandboxRoot();
		if (sandboxRoot) {
			let sandboxResolvedMedia;
			try {
				sandboxResolvedMedia = await require_sandbox_paths.resolveSandboxedMediaSource({
					media,
					sandboxRoot
				});
			} catch (err) {
				if (FILE_URL_RE.test(media)) throw new Error("Host-local MEDIA file URLs are blocked in normal replies. Use a safe path or the message tool.", { cause: err });
				throw err;
			}
			return await persistLocalReplyMedia(sandboxResolvedMedia);
		}
		if (isRelativeLocalMedia) return await persistLocalReplyMedia(resolveWorkspaceRelativeMedia(media));
		if (!isLikelyLocalMediaSource(media)) return media;
		if (FILE_URL_RE.test(media)) throw new Error("Host-local MEDIA file URLs are blocked in normal replies. Use a safe path or the message tool.");
		return await persistLocalReplyMedia(media);
	};
	return async (payload) => {
		const mediaList = getPayloadMediaList(payload);
		if (mediaList.length === 0) return payload;
		const normalizedMedia = [];
		const seen = /* @__PURE__ */ new Set();
		let firstMediaDropError;
		for (const media of mediaList) {
			let normalized;
			try {
				normalized = await normalizeMediaSource(media);
			} catch (err) {
				firstMediaDropError ??= err;
				require_globals.logVerbose(`dropping blocked reply media ${media}: ${String(err)}`);
				continue;
			}
			if (!normalized || seen.has(normalized)) continue;
			seen.add(normalized);
			normalizedMedia.push(normalized);
		}
		const text = firstMediaDropError === void 0 ? payload.text : require_reply_payload$1.appendReplyMediaFailureWarning(payload.text);
		if (normalizedMedia.length === 0) return require_reply_payload$1.copyReplyPayloadMetadata(payload, {
			...payload,
			text,
			mediaUrl: void 0,
			mediaUrls: void 0
		});
		return require_reply_payload$1.copyReplyPayloadMetadata(payload, {
			...payload,
			text,
			mediaUrl: normalizedMedia[0],
			mediaUrls: normalizedMedia
		});
	};
}
function createReplyMediaContext(params) {
	return { normalizePayload: createReplyMediaPathNormalizer(params) };
}
//#endregion
//#region src/auto-reply/reply/reply-media-paths.runtime.ts
var reply_media_paths_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	createReplyMediaContext: () => createReplyMediaContext,
	createReplyMediaPathNormalizer: () => createReplyMediaPathNormalizer
});
//#endregion
Object.defineProperty(exports, "createReplyMediaContext", {
	enumerable: true,
	get: function() {
		return createReplyMediaContext;
	}
});
Object.defineProperty(exports, "createReplyMediaPathNormalizer", {
	enumerable: true,
	get: function() {
		return createReplyMediaPathNormalizer;
	}
});
Object.defineProperty(exports, "reply_media_paths_runtime_exports", {
	enumerable: true,
	get: function() {
		return reply_media_paths_runtime_exports;
	}
});
