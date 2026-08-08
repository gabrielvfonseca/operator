const require_paths = require("./paths-C5Qy0ueD.cjs");
//#region src/cli/shared/parse-port.ts
/** Re-export the canonical TCP port parser and limit for CLI callers. */
/** Parse a TCP port from unknown CLI/config input, returning null for invalid values. */
function parsePort(raw) {
	return require_paths.parseTcpPort(raw);
}
//#endregion
Object.defineProperty(exports, "parsePort", {
	enumerable: true,
	get: function() {
		return parsePort;
	}
});
