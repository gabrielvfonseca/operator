//#region src/shared/global-singleton.ts
/**
* Process-local singleton helpers for registries, caches, and SDK-visible shared state.
* Keys must be symbols so unrelated modules cannot collide on `globalThis` property names.
*/
/** Resolves a process-local singleton for caches and registries that tolerate helper lookup. */
function resolveGlobalSingleton(key, create) {
	const globalStore = globalThis;
	if (Object.hasOwn(globalStore, key)) return globalStore[key];
	const created = create();
	globalStore[key] = created;
	return created;
}
/** Resolves a process-local Map singleton for keyed caches backed by globalThis. */
function resolveGlobalMap(key) {
	return resolveGlobalSingleton(key, () => /* @__PURE__ */ new Map());
}
//#endregion
Object.defineProperty(exports, "resolveGlobalMap", {
	enumerable: true,
	get: function() {
		return resolveGlobalMap;
	}
});
Object.defineProperty(exports, "resolveGlobalSingleton", {
	enumerable: true,
	get: function() {
		return resolveGlobalSingleton;
	}
});
