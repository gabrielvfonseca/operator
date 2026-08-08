//#region src/security/dangerous-tools.ts
/**
* Tools denied via Gateway HTTP `POST /tools/invoke` by default.
* These are high-risk because they enable session orchestration, control-plane actions,
* or interactive flows that don't make sense over a non-interactive HTTP surface.
*/
const DEFAULT_GATEWAY_HTTP_TOOL_DENY = [
	"exec",
	"spawn",
	"shell",
	"fs_write",
	"fs_delete",
	"fs_move",
	"apply_patch",
	"sessions_spawn",
	"sessions_send",
	"cron",
	"gateway",
	"nodes",
	"computer",
	"@gabrielvfonseca/operator"
];
/**
* Sensitive control-plane tools. `cron` can persist automation; `gateway`
* exposes configuration and schema details even though its agent actions are read-only.
*/
const GATEWAY_CONTROL_PLANE_TOOLS = ["cron", "gateway"];
/**
* Core tools that require sender owner identity on Gateway-scoped surfaces.
* `gateway.tools.allow` can remove the default HTTP deny only for owner/trusted-operator
* callers; non-owner identity-bearing callers must not receive server-credential wrappers.
*/
const GATEWAY_OWNER_ONLY_CORE_TOOLS = [
	...GATEWAY_CONTROL_PLANE_TOOLS,
	"sessions",
	"nodes",
	"computer",
	"@gabrielvfonseca/operator"
];
//#endregion
Object.defineProperty(exports, "DEFAULT_GATEWAY_HTTP_TOOL_DENY", {
	enumerable: true,
	get: function() {
		return DEFAULT_GATEWAY_HTTP_TOOL_DENY;
	}
});
Object.defineProperty(exports, "GATEWAY_CONTROL_PLANE_TOOLS", {
	enumerable: true,
	get: function() {
		return GATEWAY_CONTROL_PLANE_TOOLS;
	}
});
Object.defineProperty(exports, "GATEWAY_OWNER_ONLY_CORE_TOOLS", {
	enumerable: true,
	get: function() {
		return GATEWAY_OWNER_ONLY_CORE_TOOLS;
	}
});
