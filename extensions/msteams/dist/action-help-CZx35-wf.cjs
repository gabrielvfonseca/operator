require("./rolldown-runtime-u92d-OFm.cjs");
const require_shared = require("./shared-DZ6zsntB.cjs");
//#region src/auto-reply/reply/commands-subagents/action-help.ts
function handleSubagentsHelpAction() {
	return require_shared.stopWithText(require_shared.buildSubagentsHelp());
}
//#endregion
exports.handleSubagentsHelpAction = handleSubagentsHelpAction;
