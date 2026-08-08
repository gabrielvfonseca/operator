//#region src/commands/gateway-health-auth-diagnostic.ts
const GATEWAY_HEALTH_CREDENTIALS_REQUIRED_MESSAGE = "Gateway is reachable, but this CLI has no token/password or paired device token for read-scope health RPCs.";
const GATEWAY_HEALTH_CREDENTIALS_REQUIRED_TITLE = "Gateway credentials required";
const GATEWAY_HEALTH_REACHABLE_LINE = "Gateway: reachable";
/**
* Detects when a daemon probe reached the gateway even if read-scope auth failed.
*/
function gatewayProbeResultSawGateway(status) {
	if (status.ok) return true;
	const auth = status.auth;
	if (auth?.capability && auth.capability !== "unknown") return true;
	if (auth?.role || (auth?.scopes?.length ?? 0) > 0) return true;
	const server = status.server;
	if (server?.version || server?.connId) return true;
	return /\bgateway closed \(\d+\):|\bpairing required\b|\bdevice identity required\b/i.test(status.error ?? "");
}
/**
* Builds the health diagnostic emitted when the gateway is reachable but credentials are absent.
*/
function buildCredentialsRequiredHealthDiagnostic() {
	return {
		ok: false,
		error: {
			type: "gateway_credentials_required",
			message: GATEWAY_HEALTH_CREDENTIALS_REQUIRED_MESSAGE
		},
		gateway: { reachable: true }
	};
}
//#endregion
Object.defineProperty(exports, "GATEWAY_HEALTH_CREDENTIALS_REQUIRED_MESSAGE", {
	enumerable: true,
	get: function() {
		return GATEWAY_HEALTH_CREDENTIALS_REQUIRED_MESSAGE;
	}
});
Object.defineProperty(exports, "GATEWAY_HEALTH_CREDENTIALS_REQUIRED_TITLE", {
	enumerable: true,
	get: function() {
		return GATEWAY_HEALTH_CREDENTIALS_REQUIRED_TITLE;
	}
});
Object.defineProperty(exports, "GATEWAY_HEALTH_REACHABLE_LINE", {
	enumerable: true,
	get: function() {
		return GATEWAY_HEALTH_REACHABLE_LINE;
	}
});
Object.defineProperty(exports, "buildCredentialsRequiredHealthDiagnostic", {
	enumerable: true,
	get: function() {
		return buildCredentialsRequiredHealthDiagnostic;
	}
});
Object.defineProperty(exports, "gatewayProbeResultSawGateway", {
	enumerable: true,
	get: function() {
		return gatewayProbeResultSawGateway;
	}
});
