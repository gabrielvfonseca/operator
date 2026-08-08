let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
//#region src/shared/human-list.ts
function formatHumanList(values) {
	if (values.length === 0) return "";
	if (values.length === 1) return (0, _gabrielvfonseca_normalization_core.expectDefined)(values[0], "values entry at 0");
	if (values.length === 2) return `${values[0]} or ${values[1]}`;
	return `${values.slice(0, -1).join(", ")}, or ${values.at(-1)}`;
}
//#endregion
Object.defineProperty(exports, "formatHumanList", {
	enumerable: true,
	get: function() {
		return formatHumanList;
	}
});
