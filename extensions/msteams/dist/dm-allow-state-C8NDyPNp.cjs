let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/channels/message-access/store-allow-from.ts
/**
* Read pairing-store allowlist entries when a direct-message policy permits
* store fallback.
*/
async function readChannelIngressStoreAllowFromForDmPolicy(params) {
	if (params.shouldRead === false || params.dmPolicy === "allowlist" || params.dmPolicy === "open") return [];
	return await (params.readStore ?? (async (provider, accountId) => {
		const { readChannelAllowFromStore } = await Promise.resolve().then(() => require("./pairing-store-qtDtw17r.cjs")).then((n) => n.pairing_store_exports);
		return await readChannelAllowFromStore(provider, process.env, accountId);
	}))(params.provider, params.accountId).catch(() => []);
}
//#endregion
//#region src/channels/message-access/dm-allow-state.ts
/**
* Direct-message allowlist audit state.
*
* Merges configured and persisted allowFrom entries for setup/status prompts.
*/
async function resolveDmAllowAuditState(params) {
	const configAllowFrom = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(Array.isArray(params.allowFrom) ? params.allowFrom : void 0);
	const hasWildcard = configAllowFrom.includes("*");
	const storeAllowFrom = await readChannelIngressStoreAllowFromForDmPolicy({
		provider: params.provider,
		accountId: params.accountId,
		dmPolicy: params.dmPolicy,
		readStore: params.readStore
	});
	const normalizeEntry = params.normalizeEntry ?? ((value) => value);
	const normalizedCfg = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(configAllowFrom.filter((value) => value !== "*").map((value) => normalizeEntry(value)));
	const normalizedStore = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(storeAllowFrom.map((value) => normalizeEntry(value)));
	const allowCount = (/* @__PURE__ */ new Set([...normalizedCfg, ...normalizedStore])).size;
	return {
		configAllowFrom,
		hasWildcard,
		allowCount,
		isMultiUserDm: hasWildcard || allowCount > 1
	};
}
//#endregion
Object.defineProperty(exports, "readChannelIngressStoreAllowFromForDmPolicy", {
	enumerable: true,
	get: function() {
		return readChannelIngressStoreAllowFromForDmPolicy;
	}
});
Object.defineProperty(exports, "resolveDmAllowAuditState", {
	enumerable: true,
	get: function() {
		return resolveDmAllowAuditState;
	}
});
