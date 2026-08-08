require("./rolldown-runtime-u92d-OFm.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_server_utils = require("./server-utils-Cs8RsB0Z.cjs");
//#region src/gateway/server-methods/voicewake.ts
/** Gateway request handlers for reading and updating voice wake triggers. */
const voicewakeHandlers = {
	"voicewake.get": async ({ respond }) => {
		try {
			respond(true, { triggers: (await require_server_utils.loadVoiceWakeConfig()).triggers });
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"voicewake.set": async ({ params, respond, context }) => {
		if (!Array.isArray(params.triggers)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "voicewake.set requires triggers: string[]"));
			return;
		}
		try {
			const cfg = await require_server_utils.setVoiceWakeTriggers(require_server_utils.normalizeVoiceWakeTriggers(params.triggers));
			context.broadcastVoiceWakeChanged(cfg.triggers);
			respond(true, { triggers: cfg.triggers });
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	}
};
//#endregion
exports.voicewakeHandlers = voicewakeHandlers;
