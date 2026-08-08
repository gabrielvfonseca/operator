let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/tasks/task-restart-blocker.ts
function formatActiveTaskRestartBlocker(task) {
	return [
		`taskId=${task.taskId}`,
		task.runId ? `runId=${task.runId}` : null,
		`status=${task.status}`,
		`runtime=${task.runtime}`,
		task.label ? `label=${task.label}` : null,
		task.title ? `title=${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(task.title, 80)}` : null
	].filter((value) => Boolean(value)).join(" ");
}
//#endregion
Object.defineProperty(exports, "formatActiveTaskRestartBlocker", {
	enumerable: true,
	get: function() {
		return formatActiveTaskRestartBlocker;
	}
});
