require("./rolldown-runtime-u92d-OFm.cjs");
//#region src/process/supervisor/supervisor-log.runtime.ts
/** Runtime logging boundary for lazy supervisor paths and focused test mocks. */
const log = require("./subsystem-DVRgVNGQ.cjs").createSubsystemLogger("process/supervisor");
/** Report spawn failures without importing the full logging subsystem in tests. */
function warnProcessSupervisorSpawnFailure(message) {
	log.warn(message);
}
//#endregion
exports.warnProcessSupervisorSpawnFailure = warnProcessSupervisorSpawnFailure;
