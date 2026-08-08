const require_ids = require("./ids-BOvGIu4A.cjs");
const require_channel_meta = require("./channel-meta-Bapt3Qtj.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/chat-meta-shared.ts
/**
* Built-in chat channel metadata builder.
*
* Converts bundled channel catalog entries into setup/status metadata records.
*/
const CHAT_CHANNEL_ID_SET = new Set(require_ids.CHAT_CHANNEL_ORDER);
function toChatChannelMeta(params) {
	const label = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel.label);
	if (!label) throw new Error(`Missing label for bundled chat channel "${params.id}"`);
	return require_channel_meta.buildManifestChannelMeta({
		id: params.id,
		channel: params.channel,
		label,
		selectionLabel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel.selectionLabel) || label,
		docsPath: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel.docsPath) || `/channels/${params.id}`,
		docsLabel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel.docsLabel),
		blurb: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel.blurb) || "",
		detailLabel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel.detailLabel),
		systemImage: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel.systemImage),
		arrayFieldMode: "non-empty",
		selectionDocsPrefixMode: "defined"
	});
}
function buildChatChannelMetaById() {
	const entries = /* @__PURE__ */ new Map();
	for (const entry of require_ids.listBundledChannelCatalogEntries()) {
		const rawId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.id);
		if (!rawId || !CHAT_CHANNEL_ID_SET.has(rawId)) continue;
		const id = rawId;
		entries.set(id, toChatChannelMeta({
			id,
			channel: entry.channel
		}));
	}
	return Object.freeze(Object.fromEntries(entries));
}
//#endregion
//#region src/channels/chat-meta.ts
/**
* Cached built-in chat channel metadata accessors.
*
* Provides ordered channel metadata for setup, status, and selection surfaces.
*/
let chatChannelMetaCache = null;
function getChatChannelMetaById() {
	chatChannelMetaCache ??= buildChatChannelMetaById();
	return chatChannelMetaCache;
}
/**
* Lists built-in chat channel metadata in configured display order.
*/
function listChatChannels() {
	const metaById = getChatChannelMetaById();
	return require_ids.CHAT_CHANNEL_ORDER.map((id) => metaById[id]).filter((meta) => Boolean(meta));
}
/**
* Returns metadata for one built-in chat channel id.
*/
/** Drift-tolerant lookup: undefined when the id is missing from the bundled catalog. */
function findChatChannelMeta(id) {
	return getChatChannelMetaById()[id];
}
//#endregion
//#region src/channels/registry.ts
/**
* Normalizes built-in chat channel ids without loading channel plugin implementations.
*/
function normalizeChannelId(raw) {
	return require_ids.normalizeChatChannelId(raw);
}
/**
* Lists registered channel plugin ids without importing their runtime implementations.
*/
function listRegisteredChannelPluginIds() {
	return require_registry_normalize.listRegisteredChannelPluginEntries().flatMap((entry) => {
		const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.plugin.id);
		return id ? [id] : [];
	});
}
/**
* Returns lightweight channel metadata used by message formatting and capability checks.
*/
function getRegisteredChannelPluginMeta(id) {
	return require_registry_normalize.findRegisteredChannelPluginEntryById(id)?.plugin.meta ?? null;
}
/**
* Formats a concise channel primer line for setup/status flows.
*/
function formatChannelPrimerLine(meta) {
	return `${meta.label}: ${meta.blurb}`;
}
/**
* Formats a docs-aware channel selection line for interactive setup prompts.
*/
function formatChannelSelectionLine(meta, docsLink) {
	const docsPrefix = meta.selectionDocsPrefix ?? "Docs:";
	const docsLabel = meta.docsLabel ?? meta.id;
	const docs = meta.selectionDocsOmitLabel ? docsLink(meta.docsPath) : docsLink(meta.docsPath, docsLabel);
	const extras = (meta.selectionExtras ?? []).filter(Boolean).join(" ");
	return `${meta.label} — ${meta.blurb} ${docsPrefix ? `${docsPrefix} ` : ""}${docs}${extras ? ` ${extras}` : ""}`;
}
//#endregion
Object.defineProperty(exports, "findChatChannelMeta", {
	enumerable: true,
	get: function() {
		return findChatChannelMeta;
	}
});
Object.defineProperty(exports, "formatChannelPrimerLine", {
	enumerable: true,
	get: function() {
		return formatChannelPrimerLine;
	}
});
Object.defineProperty(exports, "formatChannelSelectionLine", {
	enumerable: true,
	get: function() {
		return formatChannelSelectionLine;
	}
});
Object.defineProperty(exports, "getRegisteredChannelPluginMeta", {
	enumerable: true,
	get: function() {
		return getRegisteredChannelPluginMeta;
	}
});
Object.defineProperty(exports, "listChatChannels", {
	enumerable: true,
	get: function() {
		return listChatChannels;
	}
});
Object.defineProperty(exports, "listRegisteredChannelPluginIds", {
	enumerable: true,
	get: function() {
		return listRegisteredChannelPluginIds;
	}
});
Object.defineProperty(exports, "normalizeChannelId", {
	enumerable: true,
	get: function() {
		return normalizeChannelId;
	}
});
