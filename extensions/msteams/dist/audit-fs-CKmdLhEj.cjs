const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_permissions = require("@openclaw/fs-safe/permissions");
//#region src/security/audit-fs.ts
var audit_fs_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	formatPermissionDetail: () => _openclaw_fs_safe_permissions.formatPermissionDetail,
	formatPermissionRemediation: () => _openclaw_fs_safe_permissions.formatPermissionRemediation,
	inspectPathPermissions: () => _openclaw_fs_safe_permissions.inspectPathPermissions,
	safeStat: () => _openclaw_fs_safe_permissions.safeStat
});
//#endregion
Object.defineProperty(exports, "audit_fs_exports", {
	enumerable: true,
	get: function() {
		return audit_fs_exports;
	}
});
