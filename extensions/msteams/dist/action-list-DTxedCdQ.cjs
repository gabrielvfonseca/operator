require("./rolldown-runtime-u92d-OFm.cjs");
const require_subagent_list = require("./subagent-list-C1S6-Fg_.cjs");
const require_shared = require("./shared-DZ6zsntB.cjs");
//#region src/auto-reply/reply/commands-subagents/action-list.ts
function handleSubagentsListAction(ctx) {
	const { params, runs } = ctx;
	const list = require_subagent_list.buildSubagentList({
		cfg: params.cfg,
		runs,
		recentMinutes: 30,
		taskMaxChars: 110
	});
	const lines = ["active subagents:", "-----"];
	if (list.active.length === 0) lines.push("(none)");
	else lines.push(list.active.map((entry) => entry.line).join("\n"));
	lines.push("", `recent subagents (last 30m):`, "-----");
	if (list.recent.length === 0) lines.push("(none)");
	else lines.push(list.recent.map((entry) => entry.line).join("\n"));
	return require_shared.stopWithText(lines.join("\n"));
}
//#endregion
exports.handleSubagentsListAction = handleSubagentsListAction;
