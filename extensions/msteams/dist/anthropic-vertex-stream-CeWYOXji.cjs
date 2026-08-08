const require_facade_runtime = require("./facade-runtime-BM8A5__s.cjs");
//#region src/agents/anthropic-vertex-stream.ts
/**
* Anthropic Vertex stream facade.
* Keeps Vertex-specific provider implementation in the bundled provider plugin
* while core imports a small stable factory.
*/
function loadAnthropicVertexStreamFacade() {
	return require_facade_runtime.loadBundledPluginPublicSurfaceModuleSync({
		dirName: "anthropic-vertex",
		artifactBasename: "api.js"
	});
}
/** Creates an Anthropic Vertex stream function through the bundled provider facade. */
function createAnthropicVertexStreamFnForModel(model, env = process.env) {
	return loadAnthropicVertexStreamFacade().createAnthropicVertexStreamFnForModel(model, env);
}
//#endregion
Object.defineProperty(exports, "createAnthropicVertexStreamFnForModel", {
	enumerable: true,
	get: function() {
		return createAnthropicVertexStreamFnForModel;
	}
});
