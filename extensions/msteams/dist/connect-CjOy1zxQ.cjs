require("./rolldown-runtime-u92d-OFm.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
require("./src-Bh1Dm1hT.cjs");
//#region src/gateway/server-methods/connect.ts
/**
* Rejects `connect` after the WebSocket handshake already established identity.
*/
const connectHandlers = { connect: ({ respond }) => {
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "connect is only valid as the first request"));
} };
//#endregion
exports.connectHandlers = connectHandlers;
