//#region src/gateway/server-methods/nodes-wake-state.ts
const NODE_WAKE_RECONNECT_WAIT_MS = 3e3;
const NODE_WAKE_RECONNECT_RETRY_WAIT_MS = 12e3;
const nodeWakeById = /* @__PURE__ */ new Map();
const nodeWakeNudgeById = /* @__PURE__ */ new Map();
function clearNodeWakeState(nodeId) {
	nodeWakeById.delete(nodeId);
	nodeWakeNudgeById.delete(nodeId);
}
//#endregion
Object.defineProperty(exports, "NODE_WAKE_RECONNECT_RETRY_WAIT_MS", {
	enumerable: true,
	get: function() {
		return NODE_WAKE_RECONNECT_RETRY_WAIT_MS;
	}
});
Object.defineProperty(exports, "NODE_WAKE_RECONNECT_WAIT_MS", {
	enumerable: true,
	get: function() {
		return NODE_WAKE_RECONNECT_WAIT_MS;
	}
});
Object.defineProperty(exports, "clearNodeWakeState", {
	enumerable: true,
	get: function() {
		return clearNodeWakeState;
	}
});
Object.defineProperty(exports, "nodeWakeById", {
	enumerable: true,
	get: function() {
		return nodeWakeById;
	}
});
Object.defineProperty(exports, "nodeWakeNudgeById", {
	enumerable: true,
	get: function() {
		return nodeWakeNudgeById;
	}
});
