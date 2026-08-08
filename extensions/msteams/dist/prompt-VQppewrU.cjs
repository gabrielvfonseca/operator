const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
require("./globals-D7PiAd5y.cjs");
require("./errors-BqS4bzom.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_process = require("node:process");
let node_readline_promises = require("node:readline/promises");
node_readline_promises = require_rolldown_runtime.__toESM(node_readline_promises, 1);
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/cli/prompt.ts
var prompt_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	PromptInputClosedError: () => PromptInputClosedError,
	promptText: () => promptText,
	promptYesNo: () => promptYesNo
});
/** Signals that an interactive prompt lost stdin before a complete answer arrived. */
var PromptInputClosedError = class extends Error {
	constructor() {
		super("Prompt input closed before an answer was received.");
		this.name = "PromptInputClosedError";
	}
};
function questionUntilClose(rl, question) {
	return new Promise((resolve, reject) => {
		let settled = false;
		const finish = (complete) => {
			if (settled) return;
			settled = true;
			rl.off("close", onClose);
			complete();
		};
		const onClose = () => finish(() => reject(new PromptInputClosedError()));
		rl.once("close", onClose);
		rl.question(question).then((answer) => finish(() => resolve(answer)), (error) => finish(() => reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(error, "Non-Error rejection"))));
	});
}
/** Prompts for yes/no input, honoring global `--yes` before opening stdin. */
async function promptYesNo(question, defaultYes = false) {
	if (require_logger.isVerbose() && require_logger.isYes()) return true;
	if (require_logger.isYes()) return true;
	const rl = node_readline_promises.default.createInterface({
		input: node_process.stdin,
		output: node_process.stdout
	});
	const answer = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(await questionUntilClose(rl, `${question}${defaultYes ? " [Y/n] " : " [y/N] "}`).finally(() => {
		rl.close();
	}));
	if (!answer) return defaultYes;
	return answer.startsWith("y");
}
async function promptText(question) {
	const rl = node_readline_promises.default.createInterface({
		input: node_process.stdin,
		output: node_process.stdout
	});
	return await questionUntilClose(rl, question).finally(() => {
		rl.close();
	});
}
//#endregion
Object.defineProperty(exports, "promptText", {
	enumerable: true,
	get: function() {
		return promptText;
	}
});
Object.defineProperty(exports, "promptYesNo", {
	enumerable: true,
	get: function() {
		return promptYesNo;
	}
});
Object.defineProperty(exports, "prompt_exports", {
	enumerable: true,
	get: function() {
		return prompt_exports;
	}
});
