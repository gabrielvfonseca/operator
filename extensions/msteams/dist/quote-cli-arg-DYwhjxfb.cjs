//#region src/cli/quote-cli-arg.ts
function quoteCliArg(value) {
	if (/^[A-Za-z0-9_/:=.,@%+-]+$/.test(value)) return value;
	return `'${value.replaceAll("'", "'\\''")}'`;
}
//#endregion
Object.defineProperty(exports, "quoteCliArg", {
	enumerable: true,
	get: function() {
		return quoteCliArg;
	}
});
