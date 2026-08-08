//#region src/shared/account-enabled.ts
function isAccountEnabled(account) {
	if (!account || typeof account !== "object") return true;
	return account.enabled !== false;
}
//#endregion
Object.defineProperty(exports, "isAccountEnabled", {
	enumerable: true,
	get: function() {
		return isAccountEnabled;
	}
});
