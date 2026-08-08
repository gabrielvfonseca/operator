const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
let _gabrielvfonseca_acp_core = require("@gabrielvfonseca/acp-core");
//#region src/acp/runtime/errors.ts
/** ACP runtime error exports wired to Operator secret redaction. */
var errors_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({});
require_rolldown_runtime.__reExport(errors_exports, require("@gabrielvfonseca/acp-core/runtime/errors"));
(0, _gabrielvfonseca_acp_core.configureAcpErrorRedactor)(require_redact.redactSensitiveText);
//#endregion
Object.defineProperty(exports, "errors_exports", {
	enumerable: true,
	get: function() {
		return errors_exports;
	}
});
