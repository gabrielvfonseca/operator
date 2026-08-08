require("./rolldown-runtime-u92d-OFm.cjs");
//#region src/agents/embedded-agent-runner/compact.runtime.ts
/**
* Lazy-loads the embedded-agent compaction runtime.
*/
const compactRuntimeLoader = require("./lazy-promise-D88D0uwq.cjs").createLazyImportLoader(() => Promise.resolve().then(() => require("./compact-DDCOWS4N.cjs")));
function loadCompactRuntime() {
	return compactRuntimeLoader.load();
}
/** Loads the compaction runtime on demand and forwards the direct compaction call. */
async function compactEmbeddedAgentSessionDirect(...args) {
	const { compactEmbeddedAgentSessionDirect: compactEmbeddedAgentSessionDirectLocal } = await loadCompactRuntime();
	return compactEmbeddedAgentSessionDirectLocal(...args);
}
//#endregion
exports.compactEmbeddedAgentSessionDirect = compactEmbeddedAgentSessionDirect;
