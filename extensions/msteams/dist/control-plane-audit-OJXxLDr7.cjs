const require_control_plane_identity = require("./control-plane-identity-CvV4bhWr.cjs");
//#region src/gateway/control-plane-audit.ts
/** Extracts audit identity from a possibly missing or partially connected client. */
function resolveControlPlaneActor(client) {
	return {
		actor: require_control_plane_identity.normalizeControlPlaneIdentityPart(client?.connect?.client?.id, "unknown-actor"),
		deviceId: require_control_plane_identity.normalizeControlPlaneIdentityPart(client?.connect?.device?.id, "unknown-device"),
		clientIp: require_control_plane_identity.normalizeControlPlaneIdentityPart(client?.clientIp, "unknown-ip"),
		connId: require_control_plane_identity.normalizeControlPlaneIdentityPart(client?.connId, "unknown-conn")
	};
}
/** Formats actor identity as compact key/value text for structured gateway logs. */
function formatControlPlaneActor(actor) {
	return `actor=${actor.actor} device=${actor.deviceId} ip=${actor.clientIp} conn=${actor.connId}`;
}
/** Summarizes changed config/state paths without letting audit logs grow unbounded. */
function summarizeChangedPaths(paths, maxPaths = 8) {
	if (paths.length === 0) return "<none>";
	if (paths.length <= maxPaths) return paths.join(",");
	return `${paths.slice(0, maxPaths).join(",")},+${paths.length - maxPaths} more`;
}
//#endregion
Object.defineProperty(exports, "formatControlPlaneActor", {
	enumerable: true,
	get: function() {
		return formatControlPlaneActor;
	}
});
Object.defineProperty(exports, "resolveControlPlaneActor", {
	enumerable: true,
	get: function() {
		return resolveControlPlaneActor;
	}
});
Object.defineProperty(exports, "summarizeChangedPaths", {
	enumerable: true,
	get: function() {
		return summarizeChangedPaths;
	}
});
