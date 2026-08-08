let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/utils/string-readers.ts
function isStringOption(value, options) {
	return typeof value === "string" && (Array.isArray(options) ? options.includes(value) : options.has(value));
}
function readTrimmedStringAlias(record, keys) {
	for (const key of keys) {
		const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record[key]);
		if (value !== void 0) return value;
	}
}
function stripChannelPrefix(value, channelId) {
	if (!value) return;
	for (const prefix of [
		"channel:",
		"chat:",
		"user:"
	]) if (value.startsWith(prefix)) return value.slice(prefix.length);
	const prefix = `${channelId}:`;
	return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
//#endregion
Object.defineProperty(exports, "isStringOption", {
	enumerable: true,
	get: function() {
		return isStringOption;
	}
});
Object.defineProperty(exports, "readTrimmedStringAlias", {
	enumerable: true,
	get: function() {
		return readTrimmedStringAlias;
	}
});
Object.defineProperty(exports, "stripChannelPrefix", {
	enumerable: true,
	get: function() {
		return stripChannelPrefix;
	}
});
