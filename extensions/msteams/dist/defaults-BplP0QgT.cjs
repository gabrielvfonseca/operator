//#region src/agents/defaults.ts
var defaults_exports = /* @__PURE__ */ require("./rolldown-runtime-u92d-OFm.cjs").__exportAll({
	DEFAULT_CONTEXT_TOKENS: () => DEFAULT_CONTEXT_TOKENS,
	DEFAULT_MODEL: () => DEFAULT_MODEL,
	DEFAULT_PROVIDER: () => DEFAULT_PROVIDER
});
const DEFAULT_PROVIDER = "openrouter";
const DEFAULT_MODEL = "openrouter/auto";
const DEFAULT_CONTEXT_TOKENS = 2e5;
//#endregion
Object.defineProperty(exports, "DEFAULT_CONTEXT_TOKENS", {
	enumerable: true,
	get: function() {
		return DEFAULT_CONTEXT_TOKENS;
	}
});
Object.defineProperty(exports, "DEFAULT_MODEL", {
	enumerable: true,
	get: function() {
		return DEFAULT_MODEL;
	}
});
Object.defineProperty(exports, "DEFAULT_PROVIDER", {
	enumerable: true,
	get: function() {
		return DEFAULT_PROVIDER;
	}
});
Object.defineProperty(exports, "defaults_exports", {
	enumerable: true,
	get: function() {
		return defaults_exports;
	}
});
