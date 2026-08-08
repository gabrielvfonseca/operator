//#region src/agents/embedded-agent-runner/lanes.ts
function resolveSessionLane(key) {
	const cleaned = key.trim() || "main";
	return cleaned.startsWith("session:") ? cleaned : `session:${cleaned}`;
}
function resolveGlobalLane(lane) {
	const cleaned = lane?.trim();
	if (cleaned === "cron") return "cron-nested";
	return cleaned ? cleaned : "main";
}
function resolveEmbeddedSessionLane(key) {
	return resolveSessionLane(key);
}
//#endregion
Object.defineProperty(exports, "resolveEmbeddedSessionLane", {
	enumerable: true,
	get: function() {
		return resolveEmbeddedSessionLane;
	}
});
Object.defineProperty(exports, "resolveGlobalLane", {
	enumerable: true,
	get: function() {
		return resolveGlobalLane;
	}
});
Object.defineProperty(exports, "resolveSessionLane", {
	enumerable: true,
	get: function() {
		return resolveSessionLane;
	}
});
