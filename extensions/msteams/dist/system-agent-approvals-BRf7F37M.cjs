//#region src/infra/system-agent-approvals.ts
const SYSTEM_AGENT_APPROVAL_TIMEOUT_MS = 10 * 6e4;
const SYSTEM_AGENT_APPROVAL_DECISIONS = ["allow-once", "deny"];
//#endregion
Object.defineProperty(exports, "SYSTEM_AGENT_APPROVAL_DECISIONS", {
	enumerable: true,
	get: function() {
		return SYSTEM_AGENT_APPROVAL_DECISIONS;
	}
});
Object.defineProperty(exports, "SYSTEM_AGENT_APPROVAL_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return SYSTEM_AGENT_APPROVAL_TIMEOUT_MS;
	}
});
