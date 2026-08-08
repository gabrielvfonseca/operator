const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
//#region src/config/sessions/inbound.runtime.ts
var inbound_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	recordInboundSessionMeta: () => require_session_accessor.recordInboundSessionMeta,
	resolveStorePath: () => require_paths.resolveStorePath,
	updateSessionLastRoute: () => require_session_accessor.updateSessionLastRoute
});
//#endregion
Object.defineProperty(exports, "inbound_runtime_exports", {
	enumerable: true,
	get: function() {
		return inbound_runtime_exports;
	}
});
