const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
//#region src/channels/read-only-account-inspect.ts
/** Inspects channel account config without loading mutable runtime surfaces. */
async function inspectReadOnlyChannelAccount(params) {
	const inspectAccount = require_registry.getLoadedChannelPlugin(params.channelId)?.config.inspectAccount ?? require_bundled.getBundledChannelAccountInspector(params.channelId);
	if (!inspectAccount) return null;
	return await Promise.resolve(inspectAccount(params.cfg, params.accountId));
}
//#endregion
Object.defineProperty(exports, "inspectReadOnlyChannelAccount", {
	enumerable: true,
	get: function() {
		return inspectReadOnlyChannelAccount;
	}
});
