let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/probe-target.ts
/** Resolves whether gateway probe commands should target local or remote gateway. */
function resolveGatewayProbeTarget(cfg) {
	const gatewayMode = cfg.gateway?.mode === "remote" ? "remote" : "local";
	const remoteUrlRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cfg.gateway?.remote?.url) ?? "";
	const remoteUrlMissing = gatewayMode === "remote" && !remoteUrlRaw;
	return {
		gatewayMode,
		mode: gatewayMode === "remote" && !remoteUrlMissing ? "remote" : "local",
		remoteUrlMissing
	};
}
//#endregion
Object.defineProperty(exports, "resolveGatewayProbeTarget", {
	enumerable: true,
	get: function() {
		return resolveGatewayProbeTarget;
	}
});
