//#region src/agents/embedded-agent-runner/logger.ts
/**
* Shared subsystem logger for embedded-agent runner internals.
*/
/**
* Shared logger for embedded-agent runner internals.
*/
const log = require("./subsystem-DVRgVNGQ.cjs").createSubsystemLogger("agent/embedded");
//#endregion
Object.defineProperty(exports, "log", {
	enumerable: true,
	get: function() {
		return log;
	}
});
