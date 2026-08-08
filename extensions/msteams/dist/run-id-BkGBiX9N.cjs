//#region src/cron/run-id.ts
/** Builds the stable diagnostic/session execution id for a single cron run. */
function createCronExecutionId(jobId, startedAt) {
	return `cron:${jobId}:${startedAt}`;
}
//#endregion
Object.defineProperty(exports, "createCronExecutionId", {
	enumerable: true,
	get: function() {
		return createCronExecutionId;
	}
});
