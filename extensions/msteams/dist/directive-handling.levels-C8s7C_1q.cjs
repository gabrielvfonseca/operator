require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
require("./thinking-BQb9GAe7.cjs");
//#region src/auto-reply/reply/directive-handling.levels.ts
/** Resolves current directive levels from session, agent, and config defaults. */
async function resolveCurrentDirectiveLevels(params) {
	return {
		currentThinkLevel: params.sessionEntry?.thinkingLevel ?? await params.resolveDefaultThinkingLevel() ?? params.agentCfg?.thinkingDefault,
		currentFastMode: require_string_coerce.normalizeFastMode(params.sessionEntry?.fastMode) ?? require_string_coerce.normalizeFastMode(params.agentEntry?.fastModeDefault),
		currentVerboseLevel: params.sessionEntry?.verboseLevel ?? params.agentCfg?.verboseDefault,
		currentReasoningLevel: params.sessionEntry?.reasoningLevel ?? params.agentEntry?.reasoningDefault ?? params.agentCfg?.reasoningDefault ?? "off",
		currentElevatedLevel: params.sessionEntry?.elevatedLevel ?? params.agentCfg?.elevatedDefault
	};
}
//#endregion
exports.resolveCurrentDirectiveLevels = resolveCurrentDirectiveLevels;
