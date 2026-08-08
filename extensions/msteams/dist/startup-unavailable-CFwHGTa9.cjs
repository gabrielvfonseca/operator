//#region packages/gateway-protocol/src/startup-unavailable.ts
/** Structured error reason used while gateway startup sidecars are still initializing. */
const GATEWAY_STARTUP_UNAVAILABLE_REASON = "startup-sidecars";
/** Internal close cause that distinguishes startup retry closes from generic disconnects. */
const GATEWAY_STARTUP_PENDING_CLOSE_CAUSE = "startup-sidecars-pending";
/** WebSocket close code for temporary gateway unavailability. */
const GATEWAY_STARTUP_CLOSE_CODE = 1013;
/** Human-readable WebSocket close reason for temporary gateway startup unavailability. */
const GATEWAY_STARTUP_CLOSE_REASON = "gateway starting";
/** Builds the canonical startup-unavailable details payload. */
function gatewayStartupUnavailableDetails() {
	return { reason: GATEWAY_STARTUP_UNAVAILABLE_REASON };
}
//#endregion
Object.defineProperty(exports, "GATEWAY_STARTUP_CLOSE_CODE", {
	enumerable: true,
	get: function() {
		return GATEWAY_STARTUP_CLOSE_CODE;
	}
});
Object.defineProperty(exports, "GATEWAY_STARTUP_CLOSE_REASON", {
	enumerable: true,
	get: function() {
		return GATEWAY_STARTUP_CLOSE_REASON;
	}
});
Object.defineProperty(exports, "GATEWAY_STARTUP_PENDING_CLOSE_CAUSE", {
	enumerable: true,
	get: function() {
		return GATEWAY_STARTUP_PENDING_CLOSE_CAUSE;
	}
});
Object.defineProperty(exports, "gatewayStartupUnavailableDetails", {
	enumerable: true,
	get: function() {
		return gatewayStartupUnavailableDetails;
	}
});
