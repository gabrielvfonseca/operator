//#region src/channels/plugins/status-state.ts
/**
* Human-readable channel status-state labels for status output.
*/
function formatChannelStatusState(statusState) {
	switch (statusState) {
		case "linked": return "linked";
		case "not-linked": return "not linked";
		case "unstable": return "auth stabilizing";
		default: return statusState;
	}
}
//#endregion
Object.defineProperty(exports, "formatChannelStatusState", {
	enumerable: true,
	get: function() {
		return formatChannelStatusState;
	}
});
