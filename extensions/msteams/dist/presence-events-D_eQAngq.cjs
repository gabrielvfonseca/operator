const require_system_presence = require("./system-presence-B9QPXvl5.cjs");
//#region src/gateway/server/presence-events.ts
/**
* Presence snapshot broadcaster for gateway clients.
*/
function broadcastPresenceSnapshot(params) {
	const presenceVersion = params.incrementPresenceVersion();
	params.broadcast("presence", { presence: require_system_presence.listSystemPresence() }, {
		dropIfSlow: true,
		stateVersion: {
			presence: presenceVersion,
			health: params.getHealthVersion()
		}
	});
	return presenceVersion;
}
//#endregion
Object.defineProperty(exports, "broadcastPresenceSnapshot", {
	enumerable: true,
	get: function() {
		return broadcastPresenceSnapshot;
	}
});
