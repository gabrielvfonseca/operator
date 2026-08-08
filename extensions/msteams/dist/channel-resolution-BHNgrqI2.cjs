require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
require("./message-channel-core-CeN5z1gK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_channel_bootstrap_runtime = require("./channel-bootstrap.runtime-CaYhF0j4.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/channel-resolution.ts
/** Normalizes a raw channel id and rejects non-deliverable/internal channels. */
function normalizeDeliverableOutboundChannel(raw) {
	const normalized = require_message_channel.normalizeMessageChannel(raw);
	if (!normalized || !require_message_channel.isDeliverableMessageChannel(normalized)) return;
	return normalized;
}
function maybeBootstrapChannelPlugin(params) {
	require_channel_bootstrap_runtime.bootstrapOutboundChannelPlugin(params);
}
function normalizeOutboundChannelForResolution(params) {
	const normalized = require_message_channel.normalizeMessageChannel(params.channel);
	const deliverable = normalizeDeliverableOutboundChannel(normalized);
	if (deliverable || !normalized || normalized === "webchat") return {
		channel: deliverable,
		didBootstrap: false
	};
	const activeRuntimePlugin = resolveActivatedOutboundPluginFromRuntimeRegistries(normalized);
	if (activeRuntimePlugin) return {
		channel: activeRuntimePlugin.id,
		didBootstrap: false
	};
	if (params.allowBootstrap !== true) return {
		channel: void 0,
		didBootstrap: false
	};
	maybeBootstrapChannelPlugin({
		channel: normalized,
		cfg: params.cfg
	});
	return {
		channel: resolveActivatedOutboundPluginFromRuntimeRegistries(normalized)?.id ?? normalized,
		didBootstrap: true
	};
}
function resolveDirectFromRegistry(registry, channel) {
	if (!registry) return;
	const normalizedChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel);
	if (!normalizedChannel) return;
	for (const entry of registry.channels) {
		const plugin = entry?.plugin;
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(plugin?.id) === normalizedChannel || plugin?.meta?.aliases?.some((alias) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(alias) === normalizedChannel)) return plugin;
	}
}
function messageAdapterCanSendText(message) {
	return typeof message?.send?.text === "function";
}
function resolveSendCapableMessageAdapter(plugin) {
	const message = plugin?.message;
	return messageAdapterCanSendText(message) ? message : void 0;
}
function channelPluginHasRuntimeOutboundSurface(plugin) {
	return Boolean(plugin?.outbound ?? resolveSendCapableMessageAdapter(plugin));
}
function channelPluginHasActivatedOutboundSurface(plugin) {
	return Boolean(plugin?.outbound?.sendText || plugin?.outbound?.deliveryMode === "gateway" || resolveSendCapableMessageAdapter(plugin));
}
function resolveRuntimeOutboundPlugin(plugin) {
	return channelPluginHasRuntimeOutboundSurface(plugin) ? plugin : void 0;
}
function resolveActivatedOutboundPlugin(plugin) {
	return channelPluginHasActivatedOutboundSurface(plugin) ? plugin : void 0;
}
function resolveRuntimeOutboundPluginCandidate(params) {
	const hasRuntimeSurface = params.requireActivatedRuntime ? channelPluginHasActivatedOutboundSurface : channelPluginHasRuntimeOutboundSurface;
	if (hasRuntimeSurface(params.loaded)) return params.loaded;
	if (hasRuntimeSurface(params.runtime)) return params.runtime;
	if (hasRuntimeSurface(params.bundled)) return params.bundled;
	if (params.allowSetupShell) return params.loaded ?? params.setupFallback ?? params.bundled;
}
function resolveValueFromRuntimeRegistries(channel, resolveValue) {
	const channelRegistry = require_runtime.getActivePluginChannelRegistry();
	const channelPlugin = resolveDirectFromRegistry(channelRegistry, channel);
	if (channelPlugin) {
		const value = resolveValue(channelPlugin);
		if (value !== void 0) return value;
	}
	const activeRegistry = require_runtime.getActivePluginRegistry();
	if (activeRegistry && activeRegistry !== channelRegistry) {
		const activePlugin = resolveDirectFromRegistry(activeRegistry, channel);
		if (activePlugin) return resolveValue(activePlugin);
	}
}
function resolveDirectFromRuntimeRegistries(channel) {
	return resolveValueFromRuntimeRegistries(channel, (plugin) => plugin);
}
function resolveRuntimeOutboundPluginFromRuntimeRegistries(channel) {
	return resolveValueFromRuntimeRegistries(channel, resolveRuntimeOutboundPlugin);
}
function resolveActivatedOutboundPluginFromRuntimeRegistries(channel) {
	return resolveValueFromRuntimeRegistries(channel, resolveActivatedOutboundPlugin);
}
/** Resolves a deliverable outbound channel plugin, optionally bootstrapping it. */
function resolveOutboundChannelPlugin(params) {
	const { channel: normalized, didBootstrap } = normalizeOutboundChannelForResolution(params);
	if (!normalized) return;
	const resolveLoaded = () => require_registry.getLoadedChannelPlugin(normalized);
	const resolve = () => require_registry.getChannelPlugin(normalized);
	const current = resolveLoaded();
	const requireActivatedRuntime = params.allowBootstrap === true;
	const candidate = resolveRuntimeOutboundPluginCandidate({
		loaded: current,
		runtime: requireActivatedRuntime ? resolveActivatedOutboundPluginFromRuntimeRegistries(normalized) : resolveRuntimeOutboundPluginFromRuntimeRegistries(normalized),
		setupFallback: resolveDirectFromRuntimeRegistries(normalized),
		bundled: resolve(),
		allowSetupShell: params.allowBootstrap !== true,
		requireActivatedRuntime
	});
	if (candidate) return candidate;
	if (params.allowBootstrap !== true || didBootstrap) return;
	maybeBootstrapChannelPlugin({
		channel: normalized,
		cfg: params.cfg
	});
	return resolveRuntimeOutboundPluginCandidate({
		loaded: resolveLoaded(),
		runtime: resolveActivatedOutboundPluginFromRuntimeRegistries(normalized),
		setupFallback: resolveDirectFromRuntimeRegistries(normalized),
		bundled: resolve(),
		requireActivatedRuntime: true
	});
}
/** Resolves the message adapter for a deliverable outbound channel. */
function resolveOutboundChannelMessageAdapter(params) {
	const { channel: normalized, didBootstrap } = normalizeOutboundChannelForResolution(params);
	if (!normalized) return;
	const current = resolveSendCapableMessageAdapter(require_registry.getLoadedChannelPlugin(normalized)) ?? resolveValueFromRuntimeRegistries(normalized, resolveSendCapableMessageAdapter) ?? resolveSendCapableMessageAdapter(require_registry.getChannelPlugin(normalized));
	if (current || params.allowBootstrap !== true || didBootstrap) return current;
	maybeBootstrapChannelPlugin({
		channel: normalized,
		cfg: params.cfg
	});
	return resolveSendCapableMessageAdapter(require_registry.getLoadedChannelPlugin(normalized)) ?? resolveValueFromRuntimeRegistries(normalized, resolveSendCapableMessageAdapter) ?? resolveSendCapableMessageAdapter(require_registry.getChannelPlugin(normalized));
}
//#endregion
Object.defineProperty(exports, "normalizeDeliverableOutboundChannel", {
	enumerable: true,
	get: function() {
		return normalizeDeliverableOutboundChannel;
	}
});
Object.defineProperty(exports, "resolveOutboundChannelMessageAdapter", {
	enumerable: true,
	get: function() {
		return resolveOutboundChannelMessageAdapter;
	}
});
Object.defineProperty(exports, "resolveOutboundChannelPlugin", {
	enumerable: true,
	get: function() {
		return resolveOutboundChannelPlugin;
	}
});
