//#region packages/gateway-client/src/device-auth.ts
function normalizeDeviceMetadataForAuth(value) {
	if (typeof value !== "string") return "";
	const trimmed = value.trim();
	if (!trimmed) return "";
	return trimmed.replace(/[A-Z]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 32));
}
function buildDeviceAuthPayload(params) {
	const scopes = params.scopes.join(",");
	const token = params.token ?? "";
	return [
		"v2",
		params.deviceId,
		params.clientId,
		params.clientMode,
		params.role,
		scopes,
		String(params.signedAtMs),
		token,
		params.nonce
	].join("|");
}
function buildDeviceAuthPayloadV3(params) {
	const scopes = params.scopes.join(",");
	const token = params.token ?? "";
	const platform = normalizeDeviceMetadataForAuth(params.platform);
	const deviceFamily = normalizeDeviceMetadataForAuth(params.deviceFamily);
	return [
		"v3",
		params.deviceId,
		params.clientId,
		params.clientMode,
		params.role,
		scopes,
		String(params.signedAtMs),
		token,
		params.nonce,
		platform,
		deviceFamily
	].join("|");
}
//#endregion
Object.defineProperty(exports, "buildDeviceAuthPayload", {
	enumerable: true,
	get: function() {
		return buildDeviceAuthPayload;
	}
});
Object.defineProperty(exports, "buildDeviceAuthPayloadV3", {
	enumerable: true,
	get: function() {
		return buildDeviceAuthPayloadV3;
	}
});
Object.defineProperty(exports, "normalizeDeviceMetadataForAuth", {
	enumerable: true,
	get: function() {
		return normalizeDeviceMetadataForAuth;
	}
});
