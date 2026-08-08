const require_plugins = require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
require("./message-channel-core-CeN5z1gK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/exec-approval-surface.ts
function labelForChannel(channel) {
	if (channel === "tui") return "terminal UI";
	if (channel === "webchat") return "Web UI";
	return require_registry.getChannelPlugin(channel ?? "")?.meta.label ?? (channel ? channel[0]?.toUpperCase() + channel.slice(1) : "this platform");
}
function hasNativeExecApprovalCapability(channel) {
	const capability = require_plugins.resolveChannelApprovalCapability(require_registry.getChannelPlugin(channel ?? ""));
	if (!capability?.native) return false;
	return Boolean(capability.getExecInitiatingSurfaceState || capability.getActionAvailabilityState);
}
/** Resolves whether exec approvals can be handled on the initiating surface. */
function resolveExecApprovalInitiatingSurfaceState(params) {
	return resolveApprovalInitiatingSurfaceState({
		...params,
		approvalKind: "exec"
	});
}
/** Resolves whether approvals of a given kind can be handled on the initiating surface. */
function resolveApprovalInitiatingSurfaceState(params) {
	const channel = require_message_channel.normalizeMessageChannel(params.channel);
	const channelLabel = labelForChannel(channel);
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.accountId);
	if (!channel || channel === "webchat" || channel === "tui") return {
		kind: "enabled",
		channel,
		channelLabel,
		accountId
	};
	const cfg = params.cfg ?? require_io.getRuntimeConfig();
	const capability = require_plugins.resolveChannelApprovalCapability(require_registry.getChannelPlugin(channel));
	const state = (params.approvalKind === "exec" ? capability?.getExecInitiatingSurfaceState?.({
		cfg,
		accountId: params.accountId,
		action: "approve"
	}) : void 0) ?? capability?.getActionAvailabilityState?.({
		cfg,
		accountId: params.accountId,
		action: "approve",
		approvalKind: params.approvalKind
	});
	if (state) return {
		...state,
		channel,
		channelLabel,
		accountId
	};
	if (require_message_channel.isDeliverableMessageChannel(channel)) return {
		kind: "enabled",
		channel,
		channelLabel,
		accountId
	};
	return {
		kind: "unsupported",
		channel,
		channelLabel,
		accountId
	};
}
/** Returns whether a channel can present native exec approval UI. */
function supportsNativeExecApprovalClient(channel) {
	const normalized = require_message_channel.normalizeMessageChannel(channel);
	if (!normalized || normalized === "webchat" || normalized === "tui") return true;
	return hasNativeExecApprovalCapability(normalized);
}
/** Lists native exec approval client labels for reply guidance. */
function listNativeExecApprovalClientLabels(params) {
	const excludeChannel = require_message_channel.normalizeMessageChannel(params?.excludeChannel);
	return require_registry.listChannelPlugins().filter((plugin) => plugin.id !== excludeChannel).filter((plugin) => hasNativeExecApprovalCapability(plugin.id)).map((plugin) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(plugin.meta.label)).filter((label) => Boolean(label)).toSorted((a, b) => a.localeCompare(b));
}
/** Returns channel-specific setup guidance for native exec approvals, when available. */
function describeNativeExecApprovalClientSetup(params) {
	const channel = require_message_channel.normalizeMessageChannel(params.channel);
	if (!channel || channel === "webchat" || channel === "tui") return null;
	const channelLabel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channelLabel) ?? labelForChannel(channel);
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.accountId);
	return require_plugins.resolveChannelApprovalCapability(require_registry.getChannelPlugin(channel))?.describeExecApprovalSetup?.({
		channel,
		channelLabel,
		accountId
	}) ?? null;
}
/** Returns channel-specific setup guidance for native plugin approvals, when available. */
function describeNativePluginApprovalClientSetup(params) {
	const channel = require_message_channel.normalizeMessageChannel(params.channel);
	if (!channel || channel === "webchat" || channel === "tui") return null;
	const channelLabel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channelLabel) ?? labelForChannel(channel);
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.accountId);
	return require_plugins.resolveChannelApprovalCapability(require_registry.getChannelPlugin(channel))?.describePluginApprovalSetup?.({
		channel,
		channelLabel,
		accountId
	}) ?? null;
}
//#endregion
Object.defineProperty(exports, "describeNativeExecApprovalClientSetup", {
	enumerable: true,
	get: function() {
		return describeNativeExecApprovalClientSetup;
	}
});
Object.defineProperty(exports, "describeNativePluginApprovalClientSetup", {
	enumerable: true,
	get: function() {
		return describeNativePluginApprovalClientSetup;
	}
});
Object.defineProperty(exports, "listNativeExecApprovalClientLabels", {
	enumerable: true,
	get: function() {
		return listNativeExecApprovalClientLabels;
	}
});
Object.defineProperty(exports, "resolveApprovalInitiatingSurfaceState", {
	enumerable: true,
	get: function() {
		return resolveApprovalInitiatingSurfaceState;
	}
});
Object.defineProperty(exports, "resolveExecApprovalInitiatingSurfaceState", {
	enumerable: true,
	get: function() {
		return resolveExecApprovalInitiatingSurfaceState;
	}
});
Object.defineProperty(exports, "supportsNativeExecApprovalClient", {
	enumerable: true,
	get: function() {
		return supportsNativeExecApprovalClient;
	}
});
