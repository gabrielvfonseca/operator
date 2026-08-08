require("./rolldown-runtime-u92d-OFm.cjs");
const require_shell_wrapper_resolution = require("./shell-wrapper-resolution-DAYpyVkb.cjs");
const require_extract = require("./extract-D3xT_vMP.cjs");
//#region src/infra/command-explainer/format.ts
const POSIX_COMMAND_HIGHLIGHT_SHELLS = require_shell_wrapper_resolution.POSIX_SHELL_WRAPPERS;
function spanToCommandSpan(span) {
	if (!Number.isSafeInteger(span.startIndex) || !Number.isSafeInteger(span.endIndex)) return null;
	if (span.startIndex < 0 || span.endIndex <= span.startIndex) return null;
	return {
		startIndex: span.startIndex,
		endIndex: span.endIndex
	};
}
function isUnsupportedShellWrapperArgv(argv) {
	const executable = (require_shell_wrapper_resolution.resolveShellWrapperTransportArgv([...argv]) ?? argv)[0];
	if (!executable) return false;
	const normalizedExecutable = require_shell_wrapper_resolution.normalizeExecutableToken(executable);
	return require_shell_wrapper_resolution.isShellWrapperExecutable(normalizedExecutable) && !POSIX_COMMAND_HIGHLIGHT_SHELLS.has(normalizedExecutable);
}
function hasUnsupportedShellWrapper(explanation) {
	return explanation.topLevelCommands.some((command) => isUnsupportedShellWrapperArgv(command.argv));
}
/** Converts a parsed command explanation into source spans suitable for approval UI. */
function formatCommandSpans(explanation) {
	if (hasUnsupportedShellWrapper(explanation)) return [];
	const commandSpans = [];
	for (const command of [...explanation.topLevelCommands, ...explanation.nestedCommands]) {
		const commandSpan = spanToCommandSpan(command.executableSpan);
		if (commandSpan) commandSpans.push(commandSpan);
	}
	return commandSpans;
}
//#endregion
//#region src/agents/bash-tools.exec-approval-request.runtime.ts
/**
* Lazy runtime for exec approval command highlighting.
* Kept separate so importing approval request code does not load the command
* explainer until command spans are explicitly requested.
*/
/** Resolve command spans used to highlight exec approval prompts. */
async function resolveExecApprovalCommandSpans(command) {
	const commandSpans = formatCommandSpans(await require_extract.explainShellCommand(command));
	return commandSpans.length > 0 ? commandSpans : void 0;
}
//#endregion
exports.resolveExecApprovalCommandSpans = resolveExecApprovalCommandSpans;
