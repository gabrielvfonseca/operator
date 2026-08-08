const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
//#region src/shared/lazy-runtime.ts
function createLazyRuntimeSurface(importer, select) {
	const loader = require_lazy_promise.createLazyPromiseLoader(() => importer().then(select), { cacheRejections: true });
	const load = loader.load;
	load.peek = loader.peek;
	load.clear = loader.clear;
	return load;
}
/** Cache the raw dynamically imported runtime module behind a stable loader. */
function createLazyRuntimeModule(importer) {
	return createLazyRuntimeSurface(importer, (module) => module);
}
/** Cache a single named runtime export without repeating a custom selector closure per caller. */
function createLazyRuntimeNamedExport(importer, key) {
	return createLazyRuntimeSurface(importer, (module) => module[key]);
}
function createLazyRuntimeMethod(load, select) {
	const invoke = async (...args) => {
		return await select(await load())(...args);
	};
	return invoke;
}
function createLazyRuntimeMethodBinder(load) {
	return (select) => createLazyRuntimeMethod(load, select);
}
//#endregion
Object.defineProperty(exports, "createLazyRuntimeMethodBinder", {
	enumerable: true,
	get: function() {
		return createLazyRuntimeMethodBinder;
	}
});
Object.defineProperty(exports, "createLazyRuntimeModule", {
	enumerable: true,
	get: function() {
		return createLazyRuntimeModule;
	}
});
Object.defineProperty(exports, "createLazyRuntimeNamedExport", {
	enumerable: true,
	get: function() {
		return createLazyRuntimeNamedExport;
	}
});
Object.defineProperty(exports, "createLazyRuntimeSurface", {
	enumerable: true,
	get: function() {
		return createLazyRuntimeSurface;
	}
});
