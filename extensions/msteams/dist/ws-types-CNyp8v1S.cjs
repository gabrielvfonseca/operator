//#region src/gateway/server/ws-types.ts
const GATEWAY_WS_CONNECTION_KIND_PROPERTY = "__operatorConnectionKind";
const GATEWAY_WS_PREAUTH_BUDGET_PROPERTY = "__operatorPreauthBudget";
const WS_HANDSHAKE_PHASES = [
	"tcp_accepted",
	"ws_upgrade_started",
	"auth_credentials_received",
	"auth_validated",
	"session_attached",
	"hello_payload_prepared",
	"ready"
];
//#endregion
Object.defineProperty(exports, "GATEWAY_WS_CONNECTION_KIND_PROPERTY", {
	enumerable: true,
	get: function() {
		return GATEWAY_WS_CONNECTION_KIND_PROPERTY;
	}
});
Object.defineProperty(exports, "GATEWAY_WS_PREAUTH_BUDGET_PROPERTY", {
	enumerable: true,
	get: function() {
		return GATEWAY_WS_PREAUTH_BUDGET_PROPERTY;
	}
});
Object.defineProperty(exports, "WS_HANDSHAKE_PHASES", {
	enumerable: true,
	get: function() {
		return WS_HANDSHAKE_PHASES;
	}
});
