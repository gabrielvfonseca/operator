require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_commands_registry_data = require("./commands-registry.data-Yy8_zwjC.cjs");
require("./commands-registry-list-CKPjpslh.cjs");
require("./commands-registry-normalize-Bo5SeH8X.cjs");
require("./model-selection-BvFurMxy.cjs");
require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/commands-text-routing.ts
/** Text-command routing decisions for surfaces that may also support native commands. */
/** Cached native-command surface lookup, invalidated by active plugin-registry version. */
let cachedNativeCommandSurfaces = null;
let cachedNativeCommandSurfacesVersion = -1;
let cachedNativeCommandSurfacesRegistry = null;
/** Returns whether a surface can receive provider-native slash commands. */
function isNativeCommandSurface(surface) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(surface);
	if (!normalized) return false;
	const activeRegistry = require_runtime.requireActivePluginChannelRegistry();
	const registryVersion = require_runtime.getActivePluginChannelRegistryVersion();
	if (!cachedNativeCommandSurfaces || cachedNativeCommandSurfacesVersion !== registryVersion || cachedNativeCommandSurfacesRegistry !== activeRegistry) {
		cachedNativeCommandSurfaces = new Set(require_registry.listChannelPlugins().filter((plugin) => plugin.capabilities?.nativeCommands === true).map((plugin) => plugin.id));
		cachedNativeCommandSurfacesVersion = registryVersion;
		cachedNativeCommandSurfacesRegistry = activeRegistry;
	}
	return cachedNativeCommandSurfaces.has(normalized);
}
/** Decides whether text slash commands remain active for the current surface/config pair. */
function shouldHandleTextCommands(params) {
	if (params.commandSource === "native") return true;
	if (params.cfg.commands?.text !== false) return true;
	return !isNativeCommandSurface(params.surface);
}
//#endregion
//#region src/auto-reply/commands-registry.ts
/** Command-registry facade for native specs, text aliases, argument parsing, and menus. */
/** Resolves provider-specific native command names while preserving registry defaults. */
function resolveNativeName(command, provider, options) {
	if (!command.nativeName) return;
	if (!provider) return command.nativeName;
	return (options?.includeBundledChannelFallback === false ? require_registry.getLoadedChannelPlugin(provider) : require_registry.getChannelPlugin(provider))?.commands?.resolveNativeCommandName?.({
		commandKey: command.key,
		defaultName: command.nativeName
	}) ?? command.nativeName;
}
function supportsNativeProvider(command, provider) {
	if (!command.nativeProviders?.length) return true;
	const normalizedProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(provider);
	if (!normalizedProvider) return false;
	return command.nativeProviders.some((candidate) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(candidate) === normalizedProvider);
}
/** Finds a command definition by provider-native command name or native alias. */
function findCommandByNativeName(name, provider, options) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(name);
	if (!normalized) return;
	return require_commands_registry_data.getChatCommands().find((command) => command.scope !== "text" && supportsNativeProvider(command, provider) && [resolveNativeName(command, provider, options), ...command.nativeAliases ?? []].some((nameLocal) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(nameLocal) === normalized));
}
//#endregion
Object.defineProperty(exports, "findCommandByNativeName", {
	enumerable: true,
	get: function() {
		return findCommandByNativeName;
	}
});
Object.defineProperty(exports, "shouldHandleTextCommands", {
	enumerable: true,
	get: function() {
		return shouldHandleTextCommands;
	}
});
