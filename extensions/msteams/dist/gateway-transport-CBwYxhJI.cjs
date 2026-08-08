require("./rolldown-runtime-u92d-OFm.cjs");
//#region src/gateway/terminal/gateway-transport.ts
const TERMINAL_EVENT_DATA = "terminal.data";
const TERMINAL_EVENT_EXIT = "terminal.exit";
/** Adapts terminal ownership to targeted gateway delivery and pressure state. */
function createTerminalSessionTransport(broadcastToConnIds, getBufferedAmount) {
	return {
		emit: (connId, event, payload) => broadcastToConnIds(event, payload, /* @__PURE__ */ new Set([connId]), { dropIfSlow: event === TERMINAL_EVENT_DATA }),
		getBufferedAmount
	};
}
//#endregion
exports.TERMINAL_EVENT_DATA = TERMINAL_EVENT_DATA;
exports.TERMINAL_EVENT_EXIT = TERMINAL_EVENT_EXIT;
exports.createTerminalSessionTransport = createTerminalSessionTransport;
