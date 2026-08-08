const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/origin-routing.ts
var origin_routing_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolveOriginAccountId: () => resolveOriginAccountId,
	resolveOriginMessageProvider: () => resolveOriginMessageProvider,
	resolveOriginMessageTo: () => resolveOriginMessageTo
});
/** Resolves the original message provider before reply redirection. */
function resolveOriginMessageProvider(params) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.originatingChannel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.provider);
}
/** Resolves the original message target before reply redirection. */
function resolveOriginMessageTo(params) {
	return params.originatingTo ?? params.to;
}
/** Resolves the original account id before reply redirection. */
function resolveOriginAccountId(params) {
	return params.originatingAccountId ?? params.accountId;
}
//#endregion
Object.defineProperty(exports, "origin_routing_exports", {
	enumerable: true,
	get: function() {
		return origin_routing_exports;
	}
});
Object.defineProperty(exports, "resolveOriginAccountId", {
	enumerable: true,
	get: function() {
		return resolveOriginAccountId;
	}
});
Object.defineProperty(exports, "resolveOriginMessageProvider", {
	enumerable: true,
	get: function() {
		return resolveOriginMessageProvider;
	}
});
Object.defineProperty(exports, "resolveOriginMessageTo", {
	enumerable: true,
	get: function() {
		return resolveOriginMessageTo;
	}
});
