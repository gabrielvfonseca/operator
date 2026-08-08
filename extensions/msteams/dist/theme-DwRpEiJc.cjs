const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let chalk = require("chalk");
chalk = require_rolldown_runtime.__toESM(chalk, 1);
//#region packages/terminal-core/src/palette.ts
const LOBSTER_PALETTE = {
	accent: "#FF5A2D",
	accentBright: "#FF7A3D",
	accentDim: "#D14A22",
	info: "#FF8A5B",
	success: "#2FBF71",
	warn: "#FFB020",
	error: "#E23D2D",
	muted: "#8B7F77"
};
//#endregion
//#region packages/terminal-core/src/theme.ts
var theme_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	colorize: () => colorize,
	isRich: () => isRich,
	theme: () => theme
});
const hasForceColor = typeof process.env.FORCE_COLOR === "string" && process.env.FORCE_COLOR.trim().length > 0 && process.env.FORCE_COLOR.trim() !== "0";
const baseChalk = process.env.NO_COLOR && !hasForceColor ? new chalk.Chalk({ level: 0 }) : chalk.default;
const hex = (value) => baseChalk.hex(value);
/** Shared terminal theme color functions. */
const theme = {
	accent: hex(LOBSTER_PALETTE.accent),
	accentBright: hex(LOBSTER_PALETTE.accentBright),
	accentDim: hex(LOBSTER_PALETTE.accentDim),
	info: hex(LOBSTER_PALETTE.info),
	success: hex(LOBSTER_PALETTE.success),
	warn: hex(LOBSTER_PALETTE.warn),
	error: hex(LOBSTER_PALETTE.error),
	muted: hex(LOBSTER_PALETTE.muted),
	heading: baseChalk.bold.hex(LOBSTER_PALETTE.accent),
	command: hex(LOBSTER_PALETTE.accentBright),
	option: hex(LOBSTER_PALETTE.warn)
};
/** Return true when color styling is active. */
const isRich = () => baseChalk.level > 0;
/** Conditionally apply a color function based on caller rich-output state. */
const colorize = (rich, color, value) => rich ? color(value) : value;
//#endregion
Object.defineProperty(exports, "colorize", {
	enumerable: true,
	get: function() {
		return colorize;
	}
});
Object.defineProperty(exports, "isRich", {
	enumerable: true,
	get: function() {
		return isRich;
	}
});
Object.defineProperty(exports, "theme", {
	enumerable: true,
	get: function() {
		return theme;
	}
});
Object.defineProperty(exports, "theme_exports", {
	enumerable: true,
	get: function() {
		return theme_exports;
	}
});
