let node_url = require("node:url");
//#region src/hooks/module-loader.ts
function resolveFileModuleUrl(params) {
	const url = (0, node_url.pathToFileURL)(params.modulePath).href;
	if (!params.cacheBust) return url;
	return `${url}?t=${params.nowMs ?? Date.now()}`;
}
async function importFileModule(params) {
	return await import(resolveFileModuleUrl(params));
}
function resolveFunctionModuleExport(params) {
	const explicitExport = params.exportName?.trim();
	if (explicitExport) {
		const candidate = params.mod[explicitExport];
		return typeof candidate === "function" ? candidate : void 0;
	}
	const fallbacks = params.fallbackExportNames ?? ["default"];
	for (const exportName of fallbacks) {
		const candidate = params.mod[exportName];
		if (typeof candidate === "function") return candidate;
	}
}
//#endregion
Object.defineProperty(exports, "importFileModule", {
	enumerable: true,
	get: function() {
		return importFileModule;
	}
});
Object.defineProperty(exports, "resolveFunctionModuleExport", {
	enumerable: true,
	get: function() {
		return resolveFunctionModuleExport;
	}
});
