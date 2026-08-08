const require_plugin_approvals = require("./plugin-approvals-D_TcNjGk.cjs");
//#region src/infra/plugin-approval-canonical-decisions.ts
/** Add the fail-closed deny verdict to the normalized plugin decision set. */
function resolveCanonicalPluginApprovalRequestAllowedDecisions(params) {
	const allowedDecisions = require_plugin_approvals.resolvePluginApprovalRequestAllowedDecisions(params);
	return allowedDecisions.includes("deny") ? allowedDecisions : [...allowedDecisions, "deny"];
}
//#endregion
Object.defineProperty(exports, "resolveCanonicalPluginApprovalRequestAllowedDecisions", {
	enumerable: true,
	get: function() {
		return resolveCanonicalPluginApprovalRequestAllowedDecisions;
	}
});
