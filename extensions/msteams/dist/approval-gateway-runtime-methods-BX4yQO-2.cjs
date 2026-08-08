//#region src/infra/approval-gateway-runtime-methods.ts
const GATEWAY_NATIVE_APPROVAL_METHODS = [
	"approval.resolve",
	"exec.approval.get",
	"exec.approval.list",
	"exec.approval.resolve",
	"plugin.approval.list",
	"plugin.approval.resolve"
];
const gatewayNativeApprovalMethods = new Set(GATEWAY_NATIVE_APPROVAL_METHODS);
function isGatewayNativeApprovalMethod(method) {
	return gatewayNativeApprovalMethods.has(method);
}
//#endregion
Object.defineProperty(exports, "GATEWAY_NATIVE_APPROVAL_METHODS", {
	enumerable: true,
	get: function() {
		return GATEWAY_NATIVE_APPROVAL_METHODS;
	}
});
Object.defineProperty(exports, "isGatewayNativeApprovalMethod", {
	enumerable: true,
	get: function() {
		return isGatewayNativeApprovalMethod;
	}
});
