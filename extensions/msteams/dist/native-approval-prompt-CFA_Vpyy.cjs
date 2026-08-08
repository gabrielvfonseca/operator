const require_plugins = require("./plugins-_-82JYfc.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/plugins/native-approval-prompt.ts
/**
* Native approval prompt capability helpers.
*
* Detects loaded or known channels that can render approval prompts natively.
*/
const NATIVE_APPROVAL_PROMPT_RUNTIME_CAPABILITY = "nativeApprovals";
const NATIVE_APPROVAL_PROMPT_RUNTIME_CAPABILITY_NORMALIZED = "nativeapprovals";
const KNOWN_NATIVE_APPROVAL_PROMPT_CHANNELS = /* @__PURE__ */ new Set([
	"discord",
	"googlechat",
	"matrix",
	"qqbot",
	"slack",
	"telegram",
	"signal"
]);
function channelPluginHasNativeApprovalPromptUi(plugin) {
	const capability = require_plugins.resolveChannelApprovalCapability(plugin);
	return Boolean(capability?.native || capability?.nativeRuntime);
}
function isKnownNativeApprovalPromptChannel(channel) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel);
	return Boolean(normalized && KNOWN_NATIVE_APPROVAL_PROMPT_CHANNELS.has(normalized));
}
function hasNativeApprovalPromptRuntimeCapability(capabilities) {
	return Boolean(capabilities?.some((capability) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(capability) === NATIVE_APPROVAL_PROMPT_RUNTIME_CAPABILITY_NORMALIZED));
}
//#endregion
Object.defineProperty(exports, "NATIVE_APPROVAL_PROMPT_RUNTIME_CAPABILITY", {
	enumerable: true,
	get: function() {
		return NATIVE_APPROVAL_PROMPT_RUNTIME_CAPABILITY;
	}
});
Object.defineProperty(exports, "channelPluginHasNativeApprovalPromptUi", {
	enumerable: true,
	get: function() {
		return channelPluginHasNativeApprovalPromptUi;
	}
});
Object.defineProperty(exports, "hasNativeApprovalPromptRuntimeCapability", {
	enumerable: true,
	get: function() {
		return hasNativeApprovalPromptRuntimeCapability;
	}
});
Object.defineProperty(exports, "isKnownNativeApprovalPromptChannel", {
	enumerable: true,
	get: function() {
		return isKnownNativeApprovalPromptChannel;
	}
});
