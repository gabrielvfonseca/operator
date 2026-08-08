const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_channel_env_vars = require("./channel-env-vars-NUJMeFcF.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/config/channel-configured-shared.ts
var channel_configured_shared_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	hasMeaningfulChannelConfigShallow: () => hasMeaningfulChannelConfigShallow,
	isStaticallyChannelConfigured: () => isStaticallyChannelConfigured,
	resolveChannelConfigRecord: () => resolveChannelConfigRecord
});
/** Returns a channel config object when `channels.<id>` is present and object-shaped. */
function resolveChannelConfigRecord(cfg, channelId) {
	const entry = cfg.channels?.[channelId];
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) ? entry : null;
}
/** Checks whether a shallow channel config contains activation-relevant values. */
function hasMeaningfulChannelConfigShallow(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return false;
	const keys = Object.keys(value);
	if (keys.length === 1 && keys[0] === "enabled") return value.enabled === true;
	return keys.some((key) => key !== "enabled");
}
/** Detects static channel configuration from known env vars or `channels.<id>` config. */
function isStaticallyChannelConfigured(cfg, channelId, env = process.env) {
	for (const envVar of require_channel_env_vars.getChannelEnvVars(channelId, {
		config: cfg,
		env
	})) if (typeof env[envVar] === "string" && env[envVar].trim().length > 0) return true;
	return hasMeaningfulChannelConfigShallow(resolveChannelConfigRecord(cfg, channelId));
}
//#endregion
Object.defineProperty(exports, "channel_configured_shared_exports", {
	enumerable: true,
	get: function() {
		return channel_configured_shared_exports;
	}
});
Object.defineProperty(exports, "hasMeaningfulChannelConfigShallow", {
	enumerable: true,
	get: function() {
		return hasMeaningfulChannelConfigShallow;
	}
});
Object.defineProperty(exports, "isStaticallyChannelConfigured", {
	enumerable: true,
	get: function() {
		return isStaticallyChannelConfigured;
	}
});
Object.defineProperty(exports, "resolveChannelConfigRecord", {
	enumerable: true,
	get: function() {
		return resolveChannelConfigRecord;
	}
});
