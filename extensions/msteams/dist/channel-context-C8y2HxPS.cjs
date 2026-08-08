const require_runtime = require("./runtime-DUfj3X7c.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/channel-context.ts
/** Resolves channel and account context for command handlers. */
/** Resolves the command surface channel from inbound context and command state. */
function resolveCommandSurfaceChannel(params) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.ctx.OriginatingChannel ?? params.command.channel ?? params.ctx.Surface ?? params.ctx.Provider) ?? "";
}
/** Resolves command account id, falling back to plugin default account config. */
function resolveChannelAccountId(params) {
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.ctx.AccountId) ?? "";
	if (accountId) return accountId;
	const channel = resolveCommandSurfaceChannel(params);
	const plugin = require_runtime.getActivePluginChannelRegistry()?.channels.find((entry) => entry.plugin.id === channel)?.plugin;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(plugin?.config.defaultAccountId?.(params.cfg)) || "default";
}
//#endregion
Object.defineProperty(exports, "resolveChannelAccountId", {
	enumerable: true,
	get: function() {
		return resolveChannelAccountId;
	}
});
Object.defineProperty(exports, "resolveCommandSurfaceChannel", {
	enumerable: true,
	get: function() {
		return resolveCommandSurfaceChannel;
	}
});
