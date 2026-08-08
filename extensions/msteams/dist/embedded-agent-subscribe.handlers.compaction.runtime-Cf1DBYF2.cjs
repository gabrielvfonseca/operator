require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
//#region src/agents/embedded-agent-subscribe.handlers.compaction.runtime.ts
/**
* Runtime helpers for reconciling compaction counts after subscribe events.
*/
/** Persist the highest observed compaction count after a successful subscribed run. */
async function reconcileSessionStoreCompactionCountAfterSuccess(params) {
	const { sessionKey, agentId, configStore, observedCompactionCount, now = Date.now() } = params;
	if (!sessionKey || observedCompactionCount <= 0) return;
	return (await require_session_accessor.updateSessionEntry({
		sessionKey,
		storePath: require_paths.resolveStorePath(configStore, { agentId })
	}, async (entry) => {
		const currentCount = Math.max(0, entry.compactionCount ?? 0);
		const nextCount = Math.max(currentCount, observedCompactionCount);
		if (nextCount === currentCount) return null;
		return {
			compactionCount: nextCount,
			updatedAt: Math.max(entry.updatedAt ?? 0, now)
		};
	}))?.compactionCount;
}
//#endregion
exports.default = reconcileSessionStoreCompactionCountAfterSuccess;
