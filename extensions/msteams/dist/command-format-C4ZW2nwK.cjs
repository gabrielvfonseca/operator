const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_cli_name = require("./cli-name-riMh4a6G.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/cli/profile-utils.ts
const PROFILE_NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
function isValidProfileName(value) {
	if (!value) return false;
	return PROFILE_NAME_RE.test(value);
}
function normalizeProfileName(raw) {
	const profile = raw?.trim();
	if (!profile) return null;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(profile) === "default") return null;
	if (!isValidProfileName(profile)) return null;
	return profile;
}
//#endregion
//#region src/cli/command-format.ts
var command_format_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ formatCliCommand: () => formatCliCommand });
const CLI_PREFIX_RE = /^(?:pnpm|npm|bunx|npx)\s+operator\b|^operator\b/;
const CONTAINER_FLAG_RE = /(?:^|\s)--container(?:\s|=|$)/;
const PROFILE_FLAG_RE = /(?:^|\s)--profile(?:\s|=|$)/;
const DEV_FLAG_RE = /(?:^|\s)--dev(?:\s|$)/;
const UPDATE_COMMAND_RE = /^(?:(?:pnpm|npm|bunx|npx)\s+operator|operator)\b.*\supdate(?:\s|$)/;
const CONTAINER_HINT_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/;
/** Add active root options to a displayed command without duplicating explicit flags. */
function formatCliCommand(command, env = process.env) {
	const normalizedCommand = require_cli_name.replaceCliName(command, require_cli_name.resolveCliName());
	const rawContainer = env.OPERATOR_CONTAINER_HINT?.trim();
	const container = rawContainer && CONTAINER_HINT_RE.test(rawContainer) ? rawContainer : void 0;
	const profile = normalizeProfileName(env.OPERATOR_PROFILE);
	if (!container && !profile) return normalizedCommand;
	if (!CLI_PREFIX_RE.test(normalizedCommand)) return normalizedCommand;
	const additions = [];
	if (container && !CONTAINER_FLAG_RE.test(normalizedCommand) && !UPDATE_COMMAND_RE.test(normalizedCommand)) additions.push(`--container ${container}`);
	if (!container && profile && !PROFILE_FLAG_RE.test(normalizedCommand) && !DEV_FLAG_RE.test(normalizedCommand)) additions.push(`--profile ${profile}`);
	if (additions.length === 0) return normalizedCommand;
	return normalizedCommand.replace(CLI_PREFIX_RE, (match) => `${match} ${additions.join(" ")}`);
}
//#endregion
Object.defineProperty(exports, "command_format_exports", {
	enumerable: true,
	get: function() {
		return command_format_exports;
	}
});
Object.defineProperty(exports, "formatCliCommand", {
	enumerable: true,
	get: function() {
		return formatCliCommand;
	}
});
