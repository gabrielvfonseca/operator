require("./rolldown-runtime-u92d-OFm.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
//#region src/agents/auth-profiles.runtime.ts
/**
* Runtime seam for auth-profile store loading.
* Tests can stub this facade without importing the full auth profile store
* implementation.
*/
/** Ensure an auth-profile store using the production store implementation. */
function ensureAuthProfileStore(...args) {
	return require_store.ensureAuthProfileStore(...args);
}
//#endregion
exports.ensureAuthProfileStore = ensureAuthProfileStore;
