const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
//#region src/infra/heartbeat-events.ts
function resolveIndicatorType(status) {
	switch (status) {
		case "ok-empty":
		case "ok-token": return "ok";
		case "sent": return "alert";
		case "failed": return "error";
		case "skipped": return;
	}
	throw new Error("Unsupported heartbeat status");
}
const state = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.heartbeatEvents.state"), () => ({
	lastHeartbeat: null,
	listeners: /* @__PURE__ */ new Set()
}));
function emitHeartbeatEvent(evt) {
	const enriched = {
		ts: Date.now(),
		...evt
	};
	state.lastHeartbeat = enriched;
	require_agent_events.notifyListeners(state.listeners, enriched);
}
function onHeartbeatEvent(listener) {
	return require_agent_events.registerListener(state.listeners, listener);
}
function getLastHeartbeatEvent() {
	return state.lastHeartbeat;
}
//#endregion
Object.defineProperty(exports, "emitHeartbeatEvent", {
	enumerable: true,
	get: function() {
		return emitHeartbeatEvent;
	}
});
Object.defineProperty(exports, "getLastHeartbeatEvent", {
	enumerable: true,
	get: function() {
		return getLastHeartbeatEvent;
	}
});
Object.defineProperty(exports, "onHeartbeatEvent", {
	enumerable: true,
	get: function() {
		return onHeartbeatEvent;
	}
});
Object.defineProperty(exports, "resolveIndicatorType", {
	enumerable: true,
	get: function() {
		return resolveIndicatorType;
	}
});
