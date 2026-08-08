require("./plugins-_-82JYfc.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_registry$1 = require("./registry-raOBfWNF.cjs");
const require_channel_catalog_registry = require("./channel-catalog-registry-D1BOYOpe.cjs");
//#region src/plugins/bundled-package-channel-metadata.ts
/** Lists channel metadata contributed by bundled package manifests. */
function listBundledPackageChannelMetadata() {
	return require_channel_catalog_registry.listChannelCatalogEntries({ origin: "bundled" }).map((entry) => entry.channel);
}
/** Finds bundled package channel metadata by id or alias. */
function findBundledPackageChannelMetadata(channelId) {
	return listBundledPackageChannelMetadata().find((channel) => channel.id === channelId || channel.aliases?.includes(channelId));
}
//#endregion
//#region src/commands/doctor/channel-capabilities.ts
const DEFAULT_DOCTOR_CHANNEL_CAPABILITIES = {
	dmAllowFromMode: "topOnly",
	groupModel: "sender",
	groupAllowFromFallbackToAllowFrom: true,
	warnOnEmptyGroupSenderAllowlist: true
};
function mergeDoctorChannelCapabilities(capabilities) {
	return {
		dmAllowFromMode: capabilities?.dmAllowFromMode ?? DEFAULT_DOCTOR_CHANNEL_CAPABILITIES.dmAllowFromMode,
		groupModel: capabilities?.groupModel ?? DEFAULT_DOCTOR_CHANNEL_CAPABILITIES.groupModel,
		groupAllowFromFallbackToAllowFrom: capabilities?.groupAllowFromFallbackToAllowFrom ?? DEFAULT_DOCTOR_CHANNEL_CAPABILITIES.groupAllowFromFallbackToAllowFrom,
		warnOnEmptyGroupSenderAllowlist: capabilities?.warnOnEmptyGroupSenderAllowlist ?? DEFAULT_DOCTOR_CHANNEL_CAPABILITIES.warnOnEmptyGroupSenderAllowlist
	};
}
function getManifestDoctorCapabilities(channelId) {
	return findBundledPackageChannelMetadata(channelId)?.doctorCapabilities;
}
/** Resolve doctor behavior capabilities from channel metadata, plugin runtime, or defaults. */
function getDoctorChannelCapabilities(channelName) {
	if (!channelName) return DEFAULT_DOCTOR_CHANNEL_CAPABILITIES;
	const manifestCapabilities = getManifestDoctorCapabilities(channelName);
	if (manifestCapabilities) return mergeDoctorChannelCapabilities(manifestCapabilities);
	const channelId = require_registry_normalize.normalizeAnyChannelId(channelName);
	if (!channelId) return DEFAULT_DOCTOR_CHANNEL_CAPABILITIES;
	const pluginDoctor = require_registry$1.getChannelPlugin(channelId)?.doctor ?? require_bundled.getBundledChannelPlugin(channelId)?.doctor;
	if (pluginDoctor) return mergeDoctorChannelCapabilities(pluginDoctor);
	return mergeDoctorChannelCapabilities(getManifestDoctorCapabilities(channelId));
}
function readResolvedAccountId(account) {
	if (!account || typeof account !== "object") return;
	const accountId = account.accountId;
	return typeof accountId === "string" && accountId ? accountId : void 0;
}
/** Resolve configured and runtime account ids through the channel plugin's own semantics. */
function resolveDoctorChannelAccountIds(channelName, cfg, configuredAccountIds) {
	const channelId = require_registry_normalize.normalizeAnyChannelId(channelName);
	if (!channelId) return;
	try {
		const plugin = require_registry$1.getChannelPlugin(channelId) ?? require_bundled.getBundledChannelPlugin(channelId);
		if (!plugin) return;
		const resolveAccountIds = (accountIds) => {
			const resolved = accountIds.map((accountId) => readResolvedAccountId(plugin.config.resolveAccount(cfg, accountId)));
			return resolved.every((accountId) => accountId !== void 0) ? resolved : void 0;
		};
		const configured = resolveAccountIds(configuredAccountIds);
		const runtime = resolveAccountIds(plugin.config.listAccountIds(cfg));
		return configured && runtime ? {
			configured,
			runtime
		} : void 0;
	} catch {
		return;
	}
}
//#endregion
Object.defineProperty(exports, "getDoctorChannelCapabilities", {
	enumerable: true,
	get: function() {
		return getDoctorChannelCapabilities;
	}
});
Object.defineProperty(exports, "resolveDoctorChannelAccountIds", {
	enumerable: true,
	get: function() {
		return resolveDoctorChannelAccountIds;
	}
});
