const require_io = require("./io-DU1xmwPS.cjs");
const require_identity_avatar_file = require("./identity-avatar-file-Cw3zle5k.cjs");
const require_control_ui_shared = require("./control-ui-shared-ggCalNPl.cjs");
const require_assistant_identity = require("./assistant-identity-epF-1Qcg.cjs");
//#region src/gateway/assistant-avatar.ts
function resolveSameOriginAvatarUrl(cfg, source) {
	const basePath = require_control_ui_shared.normalizeControlUiBasePath(cfg.gateway?.controlUi?.basePath);
	const unbasedPrefix = `${require_control_ui_shared.CONTROL_UI_AVATAR_PREFIX}/`;
	const basedPrefix = basePath ? `${basePath}${unbasedPrefix}` : unbasedPrefix;
	if (basePath && source.startsWith(unbasedPrefix)) return `${basePath}${source}`;
	return source.startsWith(basedPrefix) ? source : void 0;
}
/**
* Resolve and open a selected local avatar for route delivery.
* A projection with `openedFile` transfers fd ownership to the caller.
*/
function openGatewayAssistantAvatar(params) {
	const { cfg, identity } = params;
	const source = identity.avatar;
	if (require_io.isAvatarHttpUrl(source)) return { resolution: {
		kind: "remote",
		url: source,
		source
	} };
	if (require_io.isRenderableAvatarImageDataUrl(source)) return { resolution: {
		kind: "data",
		url: source,
		source
	} };
	if (require_io.isAvatarDataUrl(source)) return { resolution: {
		kind: "none",
		reason: "unsupported_data_url",
		source
	} };
	if (require_io.hasAvatarUriScheme(source) && !require_io.isWindowsAbsolutePath(source)) return { resolution: {
		kind: "none",
		reason: "unsupported_uri",
		source
	} };
	if (resolveSameOriginAvatarUrl(cfg, source)) return { resolution: null };
	if (!require_io.looksLikeAvatarPath(source)) return { resolution: null };
	const opened = require_identity_avatar_file.openLocalAgentAvatarFile({
		cfg,
		agentId: identity.agentId,
		source
	});
	if (!opened.ok) return { resolution: {
		kind: "none",
		reason: opened.reason,
		source
	} };
	return {
		resolution: {
			kind: "local",
			filePath: opened.file.path,
			source
		},
		openedFile: opened.file
	};
}
/** Resolve one selected identity avatar and its matching public metadata. */
function resolveGatewayAssistantAvatar(params) {
	const { cfg, identity } = params;
	const source = identity.avatar;
	const sameOriginAvatarUrl = resolveSameOriginAvatarUrl(cfg, source);
	if (sameOriginAvatarUrl) return {
		avatar: sameOriginAvatarUrl,
		resolution: null
	};
	const opened = openGatewayAssistantAvatar(params);
	if (opened.resolution?.kind === "none") return {
		avatar: identity.emoji ?? require_assistant_identity.DEFAULT_ASSISTANT_IDENTITY.avatar,
		resolution: opened.resolution
	};
	if (!opened.openedFile) return {
		avatar: source,
		resolution: opened.resolution
	};
	const dataUrl = require_identity_avatar_file.readOpenedLocalAgentAvatarDataUrl(opened.openedFile);
	if (!dataUrl) return {
		avatar: identity.emoji ?? require_assistant_identity.DEFAULT_ASSISTANT_IDENTITY.avatar,
		resolution: {
			kind: "none",
			reason: "unreadable",
			source
		}
	};
	return {
		avatar: dataUrl,
		resolution: opened.resolution
	};
}
//#endregion
Object.defineProperty(exports, "openGatewayAssistantAvatar", {
	enumerable: true,
	get: function() {
		return openGatewayAssistantAvatar;
	}
});
Object.defineProperty(exports, "resolveGatewayAssistantAvatar", {
	enumerable: true,
	get: function() {
		return resolveGatewayAssistantAvatar;
	}
});
