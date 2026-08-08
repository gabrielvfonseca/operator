const require_theme = require("./theme-DwRpEiJc.cjs");
//#region packages/terminal-core/src/prompt-style.ts
/** Style a prompt message when rich terminal output is active. */
const stylePromptMessage = (message) => require_theme.isRich() ? require_theme.theme.accent(message) : message;
/** Style a prompt title when rich terminal output is active. */
const stylePromptTitle = (title) => title && require_theme.isRich() ? require_theme.theme.heading(title) : title;
/** Style a prompt hint when rich terminal output is active. */
const stylePromptHint = (hint) => hint && require_theme.isRich() ? require_theme.theme.muted(hint) : hint;
//#endregion
Object.defineProperty(exports, "stylePromptHint", {
	enumerable: true,
	get: function() {
		return stylePromptHint;
	}
});
Object.defineProperty(exports, "stylePromptMessage", {
	enumerable: true,
	get: function() {
		return stylePromptMessage;
	}
});
Object.defineProperty(exports, "stylePromptTitle", {
	enumerable: true,
	get: function() {
		return stylePromptTitle;
	}
});
