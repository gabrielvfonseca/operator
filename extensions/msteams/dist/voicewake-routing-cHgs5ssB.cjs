require("./rolldown-runtime-u92d-OFm.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_voicewake_routing = require("./voicewake-routing-DDiTCBkT.cjs");
//#region src/gateway/server-methods/voicewake-routing.ts
/** Gateway request handlers for reading and updating voice wake routing. */
const voicewakeRoutingHandlers = {
	"voicewake.routing.get": async ({ respond }) => {
		try {
			respond(true, { config: await require_voicewake_routing.loadVoiceWakeRoutingConfig() });
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(err)));
		}
	},
	"voicewake.routing.set": async ({ params, respond, context }) => {
		if (!params || params.config === null || typeof params.config !== "object" || Array.isArray(params.config)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "voicewake.routing.set requires config: object"));
			return;
		}
		const validated = require_voicewake_routing.validateVoiceWakeRoutingConfigInput(params.config);
		if (!validated.ok) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, validated.message));
			return;
		}
		try {
			const config = await require_voicewake_routing.setVoiceWakeRoutingConfig(require_voicewake_routing.normalizeVoiceWakeRoutingConfig(params.config));
			context.broadcastVoiceWakeRoutingChanged(config);
			respond(true, { config });
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(err)));
		}
	}
};
//#endregion
exports.voicewakeRoutingHandlers = voicewakeRoutingHandlers;
