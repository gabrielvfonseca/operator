require("./rolldown-runtime-u92d-OFm.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_chat_history_text = require("./chat-history-text-D9KfJyJC.cjs");
const require_subagents_utils = require("./subagents-utils-DU8qD7dC.cjs");
const require_shared = require("./shared-DZ6zsntB.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/commands-subagents/action-log.ts
async function handleSubagentsLogAction(ctx) {
	const { runs, restTokens } = ctx;
	const target = restTokens[0];
	if (!target) return require_shared.stopWithText("📜 Usage: /subagents log <id|#> [limit]");
	const includeTools = restTokens.some((token) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(token) === "tools");
	const parsedLimit = (0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictNonNegativeInteger)(restTokens.slice(1).find((token) => (0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictNonNegativeInteger)(token) !== void 0));
	const limit = parsedLimit === void 0 ? 20 : Math.min(200, Math.max(1, parsedLimit));
	const targetResolution = require_shared.resolveSubagentEntryForToken(runs, target);
	if ("reply" in targetResolution) return targetResolution.reply;
	const history = await require_call.callGateway({
		method: "chat.history",
		params: {
			sessionKey: targetResolution.entry.childSessionKey,
			limit
		}
	});
	const rawMessages = Array.isArray(history?.messages) ? history.messages : [];
	const lines = require_shared.formatLogLines(includeTools ? rawMessages : require_chat_history_text.stripToolMessages(rawMessages));
	const header = `📜 Subagent log: ${require_subagents_utils.formatRunLabel(targetResolution.entry)}`;
	if (lines.length === 0) return require_shared.stopWithText(`${header}\n(no messages)`);
	return require_shared.stopWithText([header, ...lines].join("\n"));
}
//#endregion
exports.handleSubagentsLogAction = handleSubagentsLogAction;
