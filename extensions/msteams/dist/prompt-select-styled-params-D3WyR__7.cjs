const require_prompt_style = require("./prompt-style-DDurS--q.cjs");
//#region packages/terminal-core/src/prompt-select-styled-params.ts
/** Default terminal stylers for select prompts. */
const defaultStylers = {
	message: require_prompt_style.stylePromptMessage,
	hint: require_prompt_style.stylePromptHint
};
/** Return select params with styled prompt message and per-option hints. */
function styleSelectParams(params, stylers = defaultStylers) {
	return {
		...params,
		message: stylers.message(params.message),
		options: params.options.map((opt) => {
			const hint = "hint" in opt && typeof opt.hint === "string" ? opt.hint : void 0;
			return hint === void 0 ? opt : {
				...opt,
				hint: stylers.hint(hint)
			};
		})
	};
}
//#endregion
Object.defineProperty(exports, "styleSelectParams", {
	enumerable: true,
	get: function() {
		return styleSelectParams;
	}
});
