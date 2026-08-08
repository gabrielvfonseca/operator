const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/routing/account-lookup.ts
function resolveAccountEntry(accounts, accountId) {
	if (!accounts || typeof accounts !== "object") return;
	if (Object.hasOwn(accounts, accountId)) return accounts[accountId];
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(accountId);
	const matchKey = Object.keys(accounts).find((key) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key) === normalized);
	return matchKey ? accounts[matchKey] : void 0;
}
function resolveNormalizedAccountEntry(accounts, accountId, normalizeAccountId) {
	if (!accounts || typeof accounts !== "object") return;
	if (Object.hasOwn(accounts, accountId) && !require_prototype_keys.isBlockedObjectKey(accountId)) return accounts[accountId];
	const normalized = normalizeAccountId(accountId);
	const matchKey = Object.keys(accounts).find((key) => {
		if (require_prototype_keys.isBlockedObjectKey(key)) return false;
		const candidate = normalizeAccountId(key);
		return Boolean(require_account_id.normalizeOptionalAccountId(key)) && !require_prototype_keys.isBlockedObjectKey(candidate) && candidate === normalized;
	});
	return matchKey ? accounts[matchKey] : void 0;
}
//#endregion
Object.defineProperty(exports, "resolveAccountEntry", {
	enumerable: true,
	get: function() {
		return resolveAccountEntry;
	}
});
Object.defineProperty(exports, "resolveNormalizedAccountEntry", {
	enumerable: true,
	get: function() {
		return resolveNormalizedAccountEntry;
	}
});
