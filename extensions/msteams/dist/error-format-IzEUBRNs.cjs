const require_command_format = require("./command-format-C4ZW2nwK.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/cli/error-format.ts
const DEFAULT_GATEWAY_PORT_EXAMPLE = 18789;
function formatInlineCliCommand(command) {
	return `\`${require_command_format.formatCliCommand(command)}\``;
}
/** Explain the valid TCP port range with a concrete example. */
function formatPortRangeHint(example = DEFAULT_GATEWAY_PORT_EXAMPLE) {
	return `Use a port number from 1 to 65535, for example ${example}.`;
}
/** Format the standard missing-channel error plus channel-list recovery command. */
function formatUnknownChannelMessage(params) {
	const purpose = params.purpose ? ` for ${params.purpose}` : "";
	const listCommand = params.listCommand ?? "openclaw channels list --all";
	return `Unknown channel "${params.channel}"${purpose}. Run ${formatInlineCliCommand(listCommand)} to see configured and installable channels.`;
}
/** Format strict JSON parsing failures without exposing long untrusted input verbatim. */
function formatStrictJsonParseFailure(params) {
	const cause = (params.cause instanceof Error ? params.cause.message : String(params.cause)).trim().replace(/[.。]+$/u, "");
	const preview = params.value.length > 48 ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(params.value, 45).trimEnd()}...` : params.value;
	return [
		`Could not parse ${JSON.stringify(preview)} as JSON for --strict-json.`,
		`${cause}.`,
		`Use valid JSON, for example ${formatInlineCliCommand("openclaw config set gateway.port 18789 --strict-json")}.`,
		"For plain strings, omit --strict-json."
	].join(" ");
}
//#endregion
Object.defineProperty(exports, "formatPortRangeHint", {
	enumerable: true,
	get: function() {
		return formatPortRangeHint;
	}
});
Object.defineProperty(exports, "formatStrictJsonParseFailure", {
	enumerable: true,
	get: function() {
		return formatStrictJsonParseFailure;
	}
});
Object.defineProperty(exports, "formatUnknownChannelMessage", {
	enumerable: true,
	get: function() {
		return formatUnknownChannelMessage;
	}
});
