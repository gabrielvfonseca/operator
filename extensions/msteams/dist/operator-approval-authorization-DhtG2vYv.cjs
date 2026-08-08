require("./operator-scopes-BT4c3sSd.cjs");
require("./method-scopes-Dz-dMiDm.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/operator-approval-authorization.ts
function normalizeIdentity(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? null;
}
function normalizeIdentities(values) {
	const normalized = /* @__PURE__ */ new Set();
	for (const value of values ?? []) {
		const identity = normalizeIdentity(value);
		if (identity) normalized.add(identity);
	}
	return [...normalized];
}
/** Whether a client may inspect safe approval projections. */
function canReviewOperatorApproval(client) {
	const scopes = Array.isArray(client?.connect?.scopes) ? client.connect.scopes : [];
	if (scopes.includes("operator.admin")) return true;
	if (!scopes.includes("operator.approvals")) return false;
	return Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(client?.connect?.device?.id));
}
/** Whether a client may submit an approval verdict. */
function canResolveOperatorApproval(client) {
	const scopes = Array.isArray(client?.connect?.scopes) ? client.connect.scopes : [];
	return client?.internal?.approvalRuntime === true && scopes.includes("operator.approvals") || canReviewOperatorApproval(client);
}
/** Whether a broadly authorized client may access one bound approval record. */
function canAccessOperatorApproval(params) {
	if (!(params.allowApprovalRuntime ? canResolveOperatorApproval(params.client) : canReviewOperatorApproval(params.client))) return false;
	if ((Array.isArray(params.client?.connect?.scopes) ? params.client.connect.scopes : []).includes("operator.admin")) return true;
	if (params.allowApprovalRuntime && params.client?.internal?.approvalRuntime === true) return true;
	const clientDeviceId = normalizeIdentity(params.client?.connect?.device?.id);
	const reviewerDeviceIds = normalizeIdentities(params.binding.reviewerDeviceIds);
	if (reviewerDeviceIds.length > 0) return Boolean(clientDeviceId && reviewerDeviceIds.includes(clientDeviceId));
	return true;
}
//#endregion
Object.defineProperty(exports, "canAccessOperatorApproval", {
	enumerable: true,
	get: function() {
		return canAccessOperatorApproval;
	}
});
Object.defineProperty(exports, "canResolveOperatorApproval", {
	enumerable: true,
	get: function() {
		return canResolveOperatorApproval;
	}
});
Object.defineProperty(exports, "canReviewOperatorApproval", {
	enumerable: true,
	get: function() {
		return canReviewOperatorApproval;
	}
});
