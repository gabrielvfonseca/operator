const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/commands/random-token.ts
/**
* Gateway token generation helper.
*
* Tokens are opaque random hex strings used by setup when no explicit gateway
* token or secret reference exists.
*/
/** Generates a new 192-bit gateway token encoded as hex. */
function randomToken() {
	return node_crypto.default.randomBytes(24).toString("hex");
}
//#endregion
Object.defineProperty(exports, "randomToken", {
	enumerable: true,
	get: function() {
		return randomToken;
	}
});
