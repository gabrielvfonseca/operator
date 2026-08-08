//#region src/commands/doctor/shared/object.ts
function asObjectRecord(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value;
}
//#endregion
Object.defineProperty(exports, "asObjectRecord", {
	enumerable: true,
	get: function() {
		return asObjectRecord;
	}
});
