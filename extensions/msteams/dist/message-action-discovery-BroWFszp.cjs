require("./plugins-_-82JYfc.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_registry$1 = require("./registry-raOBfWNF.cjs");
const require_public_surface_loader = require("./public-surface-loader-CK-Iot2Y.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let typebox = require("typebox");
//#region src/channels/plugins/message-tool-api.ts
/**
* Bundled channel message-tool public artifact loader.
*
* Resolves lightweight discovery hooks without loading full channel plugins.
*/
const MESSAGE_TOOL_API_ARTIFACT_BASENAME = "message-tool-api.js";
const MISSING_PUBLIC_SURFACE_PREFIX = "Unable to resolve bundled plugin public surface ";
function loadBundledChannelMessageToolApi(channelId) {
	const cacheKey = channelId.trim();
	try {
		return require_public_surface_loader.loadBundledPluginPublicArtifactModuleSync({
			dirName: cacheKey,
			artifactBasename: MESSAGE_TOOL_API_ARTIFACT_BASENAME
		});
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(MISSING_PUBLIC_SURFACE_PREFIX)) return;
		throw error;
	}
}
/**
* Resolves a bundled channel's message-tool discovery adapter without loading the full plugin.
*/
function resolveBundledChannelMessageToolDiscoveryAdapter(channelId) {
	const describeMessageTool = loadBundledChannelMessageToolApi(channelId)?.describeMessageTool;
	if (typeof describeMessageTool !== "function") return;
	return { describeMessageTool };
}
//#endregion
//#region src/channels/plugins/message-action-discovery.ts
/**
* Channel message action discovery.
*
* Builds agent tool schema contributions from loaded or bundled channel action hooks.
*/
const loggedMessageActionErrors = /* @__PURE__ */ new Set();
/**
* Normalizes a raw channel/provider id before consulting action discovery hooks.
*/
function resolveMessageActionDiscoveryChannelId(raw) {
	return require_registry_normalize.normalizeAnyChannelId(raw) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw);
}
/**
* Builds the context object passed to plugin message-tool discovery hooks.
*/
function createMessageActionDiscoveryContext(params) {
	const currentChannelProvider = resolveMessageActionDiscoveryChannelId(params.channel ?? params.currentChannelProvider);
	return {
		cfg: params.cfg ?? {},
		currentChannelId: params.currentChannelId,
		currentChannelProvider,
		currentThreadTs: params.currentThreadTs,
		currentMessageId: params.currentMessageId,
		accountId: params.accountId,
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		agentId: params.agentId,
		requesterSenderId: params.requesterSenderId,
		senderIsOwner: params.senderIsOwner
	};
}
function logMessageActionError(params) {
	const message = require_errors.formatErrorMessage(params.error);
	const key = `${params.pluginId}:${params.operation}:${message}`;
	if (loggedMessageActionErrors.has(key)) return;
	loggedMessageActionErrors.add(key);
	const stack = params.error instanceof Error && params.error.stack ? params.error.stack : null;
	require_runtime.defaultRuntime.error?.(`[message-action-discovery] ${params.pluginId}.actions.${params.operation} failed: ${stack ?? message}`);
}
function describeMessageToolSafely(params) {
	try {
		return params.describeMessageTool(params.context) ?? null;
	} catch (error) {
		logMessageActionError({
			pluginId: params.pluginId,
			operation: "describeMessageTool",
			error
		});
		return null;
	}
}
/**
* Normalizes plugin schema contributions into a list for merge callers.
*/
function normalizeToolSchemaContributions(value) {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}
/**
* Resolves media-source parameter names, optionally scoped to one action.
*/
function normalizeMessageToolMediaSourceParams(mediaSourceParams, action) {
	if (Array.isArray(mediaSourceParams)) return mediaSourceParams;
	if (!mediaSourceParams || typeof mediaSourceParams !== "object") return [];
	const scopedMediaSourceParams = mediaSourceParams;
	if (action) {
		const scoped = scopedMediaSourceParams[action];
		return Array.isArray(scoped) ? scoped : [];
	}
	return Object.values(scopedMediaSourceParams).flatMap((scoped) => Array.isArray(scoped) ? scoped : []);
}
/**
* Finds the lightest available message-tool discovery adapter for one channel.
*/
function resolveCurrentChannelMessageToolDiscoveryAdapter(channel) {
	const channelId = resolveMessageActionDiscoveryChannelId(channel);
	if (!channelId) return null;
	const loadedPlugin = require_registry$1.getLoadedChannelPlugin(channelId);
	if (loadedPlugin?.actions) return {
		pluginId: loadedPlugin.id,
		actions: loadedPlugin.actions
	};
	const bundledActions = resolveBundledChannelMessageToolDiscoveryAdapter(channelId);
	if (bundledActions) return {
		pluginId: channelId,
		actions: bundledActions
	};
	const plugin = require_registry$1.getChannelPlugin(channelId);
	if (!plugin?.actions) return null;
	return {
		pluginId: plugin.id,
		actions: plugin.actions
	};
}
/**
* Resolves one plugin's message action metadata with caller-selected fields.
*/
function resolveMessageActionDiscoveryForPlugin(params) {
	const adapter = params.actions;
	if (!adapter) return {
		actions: [],
		capabilities: [],
		schemaContributions: [],
		mediaSourceParams: []
	};
	const described = describeMessageToolSafely({
		pluginId: params.pluginId,
		context: params.context,
		describeMessageTool: adapter.describeMessageTool
	});
	return {
		actions: params.includeActions && Array.isArray(described?.actions) ? [...described.actions] : [],
		capabilities: params.includeCapabilities && Array.isArray(described?.capabilities) ? described.capabilities : [],
		schemaContributions: params.includeSchema ? normalizeToolSchemaContributions(described?.schema) : [],
		mediaSourceParams: normalizeMessageToolMediaSourceParams(described?.mediaSourceParams, params.action)
	};
}
/**
* Lists actions whose schemas do not block cross-channel tool usage.
*/
function listCrossChannelSchemaSupportedMessageActions(params) {
	const channelId = resolveMessageActionDiscoveryChannelId(params.channel);
	if (!channelId) return [];
	const pluginActions = resolveCurrentChannelMessageToolDiscoveryAdapter(channelId);
	if (!pluginActions?.actions) return [];
	const resolved = resolveMessageActionDiscoveryForPlugin({
		pluginId: pluginActions.pluginId,
		actions: pluginActions.actions,
		context: createMessageActionDiscoveryContext(params),
		includeActions: true,
		includeSchema: true
	});
	const schemaBlockedActions = /* @__PURE__ */ new Set();
	for (const contribution of resolved.schemaContributions) {
		if ((contribution.visibility ?? "current-channel") !== "current-channel") continue;
		if (!Object.hasOwn(contribution, "actions")) return [];
		const actions = contribution.actions;
		if (!Array.isArray(actions)) return [];
		if (actions.length === 0) continue;
		for (const action of actions) schemaBlockedActions.add(action);
	}
	return resolved.actions.filter((action) => !schemaBlockedActions.has(action));
}
/**
* Lists message capabilities advertised across registered channel plugins.
*/
function listChannelMessageCapabilities(cfg) {
	const capabilities = /* @__PURE__ */ new Set();
	for (const plugin of require_registry$1.listChannelPlugins()) for (const capability of resolveMessageActionDiscoveryForPlugin({
		pluginId: plugin.id,
		actions: plugin.actions,
		context: { cfg },
		includeCapabilities: true
	}).capabilities) capabilities.add(capability);
	return Array.from(capabilities);
}
/**
* Lists message capabilities advertised by the current channel.
*/
function listChannelMessageCapabilitiesForChannel(params) {
	const pluginActions = resolveCurrentChannelMessageToolDiscoveryAdapter(params.channel);
	if (!pluginActions) return [];
	return Array.from(resolveMessageActionDiscoveryForPlugin({
		pluginId: pluginActions.pluginId,
		actions: pluginActions.actions,
		context: createMessageActionDiscoveryContext(params),
		includeCapabilities: true
	}).capabilities);
}
/**
* Merges schema properties while preserving the first plugin to define a key.
*/
function mergeToolSchemaProperties(target, source) {
	if (!source) return;
	for (const [name, schema] of Object.entries(source)) {
		if (name in target) continue;
		target[name] = typebox.Type.IsOptional(schema) ? schema : typebox.Type.Optional(schema);
	}
}
/**
* Resolves extra message-tool schema properties from channel discovery hooks.
*/
function resolveChannelMessageToolSchemaProperties(params) {
	const properties = {};
	const currentChannel = resolveMessageActionDiscoveryChannelId(params.channel);
	const discoveryBase = createMessageActionDiscoveryContext(params);
	const seenPluginIds = /* @__PURE__ */ new Set();
	for (const plugin of require_registry$1.listChannelPlugins()) {
		if (!plugin.actions) continue;
		seenPluginIds.add(plugin.id);
		for (const contribution of resolveMessageActionDiscoveryForPlugin({
			pluginId: plugin.id,
			actions: plugin.actions,
			context: discoveryBase,
			includeSchema: true
		}).schemaContributions) {
			const visibility = contribution.visibility ?? "current-channel";
			if (currentChannel) {
				if (visibility === "all-configured" || plugin.id === currentChannel) mergeToolSchemaProperties(properties, contribution.properties);
				continue;
			}
			mergeToolSchemaProperties(properties, contribution.properties);
		}
	}
	if (currentChannel && !seenPluginIds.has(currentChannel)) {
		const currentActions = resolveCurrentChannelMessageToolDiscoveryAdapter(currentChannel);
		if (currentActions?.actions) {
			for (const contribution of resolveMessageActionDiscoveryForPlugin({
				pluginId: currentActions.pluginId,
				actions: currentActions.actions,
				context: discoveryBase,
				includeSchema: true
			}).schemaContributions) if ((contribution.visibility ?? "current-channel") === "all-configured" || currentActions.pluginId === currentChannel) mergeToolSchemaProperties(properties, contribution.properties);
		}
	}
	return properties;
}
/**
* Resolves tool parameter names that should be treated as media source selectors.
*/
function resolveChannelMessageToolMediaSourceParamKeys(params) {
	const pluginActions = resolveCurrentChannelMessageToolDiscoveryAdapter(params.channel);
	if (!pluginActions) return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(resolveMessageActionDiscoveryForPlugin({
		pluginId: pluginActions.pluginId,
		actions: pluginActions.actions,
		context: createMessageActionDiscoveryContext(params),
		action: params.action,
		includeSchema: false
	}).mediaSourceParams);
}
/**
* Returns whether any registered channel advertises a message capability.
*/
function channelSupportsMessageCapability(cfg, capability) {
	return listChannelMessageCapabilities(cfg).includes(capability);
}
/**
* Returns whether the current channel advertises a message capability.
*/
function channelSupportsMessageCapabilityForChannel(params, capability) {
	return listChannelMessageCapabilitiesForChannel(params).includes(capability);
}
//#endregion
Object.defineProperty(exports, "channelSupportsMessageCapability", {
	enumerable: true,
	get: function() {
		return channelSupportsMessageCapability;
	}
});
Object.defineProperty(exports, "channelSupportsMessageCapabilityForChannel", {
	enumerable: true,
	get: function() {
		return channelSupportsMessageCapabilityForChannel;
	}
});
Object.defineProperty(exports, "createMessageActionDiscoveryContext", {
	enumerable: true,
	get: function() {
		return createMessageActionDiscoveryContext;
	}
});
Object.defineProperty(exports, "listCrossChannelSchemaSupportedMessageActions", {
	enumerable: true,
	get: function() {
		return listCrossChannelSchemaSupportedMessageActions;
	}
});
Object.defineProperty(exports, "resolveChannelMessageToolMediaSourceParamKeys", {
	enumerable: true,
	get: function() {
		return resolveChannelMessageToolMediaSourceParamKeys;
	}
});
Object.defineProperty(exports, "resolveChannelMessageToolSchemaProperties", {
	enumerable: true,
	get: function() {
		return resolveChannelMessageToolSchemaProperties;
	}
});
Object.defineProperty(exports, "resolveCurrentChannelMessageToolDiscoveryAdapter", {
	enumerable: true,
	get: function() {
		return resolveCurrentChannelMessageToolDiscoveryAdapter;
	}
});
Object.defineProperty(exports, "resolveMessageActionDiscoveryChannelId", {
	enumerable: true,
	get: function() {
		return resolveMessageActionDiscoveryChannelId;
	}
});
Object.defineProperty(exports, "resolveMessageActionDiscoveryForPlugin", {
	enumerable: true,
	get: function() {
		return resolveMessageActionDiscoveryForPlugin;
	}
});
