const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
const require_secret_equal = require("./secret-equal-_vlQ14qZ.cjs");
let node_crypto = require("node:crypto");
//#region src/gateway/operator-approval-runtime-token.ts
const APPROVAL_RUNTIME_TOKEN_CONTEXT = "operator:gateway-approval-runtime-token:v1";
let fallbackApprovalRuntimeToken = null;
function deriveApprovalRuntimeToken(socketToken) {
	return (0, node_crypto.createHmac)("sha256", socketToken).update(APPROVAL_RUNTIME_TOKEN_CONTEXT).digest("base64url");
}
function readSharedApprovalRuntimeToken() {
	const token = require_exec_approvals.loadExecApprovals().socket?.token?.trim();
	return token ? deriveApprovalRuntimeToken(token) : null;
}
/**
* Returns the token used to authorize local operator-approval clients.
*/
function getOperatorApprovalRuntimeToken() {
	const sharedToken = readSharedApprovalRuntimeToken();
	if (sharedToken) return sharedToken;
	fallbackApprovalRuntimeToken ??= (0, node_crypto.randomBytes)(32).toString("base64url");
	return fallbackApprovalRuntimeToken;
}
/**
* Validates a presented loopback approval token without accepting empty or partial matches.
*/
function isOperatorApprovalRuntimeToken(value) {
	const token = value?.trim();
	if (!token) return false;
	const sharedToken = readSharedApprovalRuntimeToken();
	if (require_secret_equal.safeEqualSecret(token, sharedToken)) return true;
	return require_secret_equal.safeEqualSecret(token, fallbackApprovalRuntimeToken ?? (sharedToken ? null : getOperatorApprovalRuntimeToken()));
}
//#endregion
Object.defineProperty(exports, "getOperatorApprovalRuntimeToken", {
	enumerable: true,
	get: function() {
		return getOperatorApprovalRuntimeToken;
	}
});
Object.defineProperty(exports, "isOperatorApprovalRuntimeToken", {
	enumerable: true,
	get: function() {
		return isOperatorApprovalRuntimeToken;
	}
});
