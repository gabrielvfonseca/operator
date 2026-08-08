require("./fs-safe-defaults-bWM6YSZm.cjs");
let _openclaw_fs_safe_store = require("@openclaw/fs-safe/store");
//#region src/infra/private-file-store.ts
/** Create an async private file store rooted at `rootDir`. */
function privateFileStore(rootDir) {
	return (0, _openclaw_fs_safe_store.fileStore)({
		rootDir,
		private: true
	});
}
/** Create a sync private file store rooted at `rootDir`. */
function privateFileStoreSync(rootDir) {
	return (0, _openclaw_fs_safe_store.fileStoreSync)({
		rootDir,
		private: true
	});
}
//#endregion
Object.defineProperty(exports, "privateFileStore", {
	enumerable: true,
	get: function() {
		return privateFileStore;
	}
});
Object.defineProperty(exports, "privateFileStoreSync", {
	enumerable: true,
	get: function() {
		return privateFileStoreSync;
	}
});
