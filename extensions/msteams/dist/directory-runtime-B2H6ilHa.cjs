require("./read-only-account-inspect-C03mVmQt.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/plugins/directory-config-helpers.ts
/**
* Directory config helper utilities.
*
* Builds user/group directory entries from plugin config with query and limit filtering.
*/
function resolveDirectoryQuery(query) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(query);
}
function resolveDirectoryLimit(limit) {
	return typeof limit === "number" && limit > 0 ? limit : void 0;
}
/**
* Applies case-insensitive query filtering and a positive result limit to ids.
*/
function applyDirectoryQueryAndLimit(ids, params) {
	const q = resolveDirectoryQuery(params.query);
	const limit = resolveDirectoryLimit(params.limit);
	const filtered = [];
	for (const id of ids) {
		if (q && !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(id).includes(q)) continue;
		filtered.push(id);
		if (typeof limit === "number" && filtered.length >= limit) break;
	}
	return filtered;
}
/**
* Converts normalized ids into channel directory entries of one kind.
*/
function toDirectoryEntries(kind, ids) {
	const entries = [];
	for (const id of ids) entries.push({
		kind,
		id
	});
	return entries;
}
/**
* Collects unique normalized ids from multiple raw config sources.
*/
function collectNormalizedDirectoryIds(params) {
	const ids = [];
	for (const source of params.sources) for (const value of source) {
		const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? "";
		if (!raw || raw === "*") continue;
		const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.normalizeId(raw)) ?? "";
		if (trimmed) ids.push(trimmed);
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(ids);
}
/**
* Lists directory entries from arbitrary config sources.
*
* Callers supply source iterables and an id normalizer so channel-specific
* config shapes share the same wildcard filtering, dedupe, query, and limit
* behavior.
*/
function listDirectoryEntriesFromSources(params) {
	const ids = collectNormalizedDirectoryIds({
		sources: params.sources,
		normalizeId: params.normalizeId
	});
	return toDirectoryEntries(params.kind, applyDirectoryQueryAndLimit(ids, params));
}
//#endregion
Object.defineProperty(exports, "listDirectoryEntriesFromSources", {
	enumerable: true,
	get: function() {
		return listDirectoryEntriesFromSources;
	}
});
