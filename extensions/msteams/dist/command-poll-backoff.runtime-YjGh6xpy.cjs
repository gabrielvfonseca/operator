require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_poll_backoff = require("./command-poll-backoff-n0nocVP4.cjs");
//#region src/agents/command-poll-backoff.runtime.ts
/**
* Runtime seam for command poll backoff cleanup.
*/
/** Prune stale command polls using the production backoff implementation. */
function pruneStaleCommandPolls(...args) {
	return require_command_poll_backoff.pruneStaleCommandPolls(...args);
}
//#endregion
exports.pruneStaleCommandPolls = pruneStaleCommandPolls;
