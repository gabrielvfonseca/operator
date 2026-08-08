const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_reply_run_registry = require("./reply-run-registry-BN03YRe9.cjs");
//#region src/agents/embedded-agent-runner/run-state.ts
const embeddedRunState = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.embeddedRunState"), () => ({
	activeRuns: /* @__PURE__ */ new Map(),
	activeRunsByRunId: /* @__PURE__ */ new Map(),
	retainedAbortabilityRunIds: /* @__PURE__ */ new Set(),
	snapshots: /* @__PURE__ */ new Map(),
	sessionIdsByKey: /* @__PURE__ */ new Map(),
	sessionIdsByFile: /* @__PURE__ */ new Map(),
	abandonedRunsBySessionId: /* @__PURE__ */ new Map(),
	abandonedRunSessionIdsByKey: /* @__PURE__ */ new Map(),
	abandonedRunSessionIdsByFile: /* @__PURE__ */ new Map(),
	waiters: /* @__PURE__ */ new Map()
}));
const ACTIVE_EMBEDDED_RUNS = embeddedRunState.activeRuns ?? (embeddedRunState.activeRuns = /* @__PURE__ */ new Map());
const ACTIVE_EMBEDDED_RUNS_BY_RUN_ID = embeddedRunState.activeRunsByRunId ?? (embeddedRunState.activeRunsByRunId = /* @__PURE__ */ new Map());
const RETAINED_EMBEDDED_RUN_ABORTABILITY_RUN_IDS = embeddedRunState.retainedAbortabilityRunIds ?? (embeddedRunState.retainedAbortabilityRunIds = /* @__PURE__ */ new Set());
const ACTIVE_EMBEDDED_RUN_SNAPSHOTS = embeddedRunState.snapshots ?? (embeddedRunState.snapshots = /* @__PURE__ */ new Map());
const ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY = embeddedRunState.sessionIdsByKey ?? (embeddedRunState.sessionIdsByKey = /* @__PURE__ */ new Map());
const ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE = embeddedRunState.sessionIdsByFile ?? (embeddedRunState.sessionIdsByFile = /* @__PURE__ */ new Map());
const ABANDONED_EMBEDDED_RUNS_BY_SESSION_ID = embeddedRunState.abandonedRunsBySessionId ?? (embeddedRunState.abandonedRunsBySessionId = /* @__PURE__ */ new Map());
const ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_KEY = embeddedRunState.abandonedRunSessionIdsByKey ?? (embeddedRunState.abandonedRunSessionIdsByKey = /* @__PURE__ */ new Map());
const ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_FILE = embeddedRunState.abandonedRunSessionIdsByFile ?? (embeddedRunState.abandonedRunSessionIdsByFile = /* @__PURE__ */ new Map());
const EMBEDDED_RUN_WAITERS = embeddedRunState.waiters ?? (embeddedRunState.waiters = /* @__PURE__ */ new Map());
/** Counts active embedded runs while including auto-reply registry runs for shared sessions. */
function getActiveEmbeddedRunCount() {
	let activeCount = ACTIVE_EMBEDDED_RUNS.size;
	for (const sessionId of require_reply_run_registry.listActiveReplyRunSessionIds()) if (!ACTIVE_EMBEDDED_RUNS.has(sessionId)) activeCount += 1;
	return Math.max(activeCount, require_reply_run_registry.getActiveReplyRunCount());
}
/** Lists active embedded-run session keys from both embedded and auto-reply registries. */
function listActiveEmbeddedRunSessionKeys() {
	return [.../* @__PURE__ */ new Set([...ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.keys(), ...require_reply_run_registry.listActiveReplyRunSessionKeys()])].toSorted((a, b) => a.localeCompare(b));
}
/** Lists active embedded-run session ids from all embedded-run lookup maps. */
function listActiveEmbeddedRunSessionIds() {
	return [.../* @__PURE__ */ new Set([
		...ACTIVE_EMBEDDED_RUNS.keys(),
		...ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.values(),
		...ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.values(),
		...require_reply_run_registry.listActiveReplyRunSessionIds()
	])].toSorted((a, b) => a.localeCompare(b));
}
/** Resolves the current session id for an active run after resets or compaction. */
function resolveActiveEmbeddedRunSessionId(sessionKey) {
	const normalizedSessionKey = sessionKey.trim();
	if (!normalizedSessionKey) return;
	return require_reply_run_registry.resolveActiveReplyRunSessionId(normalizedSessionKey) ?? ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.get(normalizedSessionKey);
}
//#endregion
Object.defineProperty(exports, "ABANDONED_EMBEDDED_RUNS_BY_SESSION_ID", {
	enumerable: true,
	get: function() {
		return ABANDONED_EMBEDDED_RUNS_BY_SESSION_ID;
	}
});
Object.defineProperty(exports, "ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_FILE", {
	enumerable: true,
	get: function() {
		return ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_FILE;
	}
});
Object.defineProperty(exports, "ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_KEY", {
	enumerable: true,
	get: function() {
		return ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_KEY;
	}
});
Object.defineProperty(exports, "ACTIVE_EMBEDDED_RUNS", {
	enumerable: true,
	get: function() {
		return ACTIVE_EMBEDDED_RUNS;
	}
});
Object.defineProperty(exports, "ACTIVE_EMBEDDED_RUNS_BY_RUN_ID", {
	enumerable: true,
	get: function() {
		return ACTIVE_EMBEDDED_RUNS_BY_RUN_ID;
	}
});
Object.defineProperty(exports, "ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE", {
	enumerable: true,
	get: function() {
		return ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE;
	}
});
Object.defineProperty(exports, "ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY", {
	enumerable: true,
	get: function() {
		return ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY;
	}
});
Object.defineProperty(exports, "ACTIVE_EMBEDDED_RUN_SNAPSHOTS", {
	enumerable: true,
	get: function() {
		return ACTIVE_EMBEDDED_RUN_SNAPSHOTS;
	}
});
Object.defineProperty(exports, "EMBEDDED_RUN_WAITERS", {
	enumerable: true,
	get: function() {
		return EMBEDDED_RUN_WAITERS;
	}
});
Object.defineProperty(exports, "RETAINED_EMBEDDED_RUN_ABORTABILITY_RUN_IDS", {
	enumerable: true,
	get: function() {
		return RETAINED_EMBEDDED_RUN_ABORTABILITY_RUN_IDS;
	}
});
Object.defineProperty(exports, "getActiveEmbeddedRunCount", {
	enumerable: true,
	get: function() {
		return getActiveEmbeddedRunCount;
	}
});
Object.defineProperty(exports, "listActiveEmbeddedRunSessionIds", {
	enumerable: true,
	get: function() {
		return listActiveEmbeddedRunSessionIds;
	}
});
Object.defineProperty(exports, "listActiveEmbeddedRunSessionKeys", {
	enumerable: true,
	get: function() {
		return listActiveEmbeddedRunSessionKeys;
	}
});
Object.defineProperty(exports, "resolveActiveEmbeddedRunSessionId", {
	enumerable: true,
	get: function() {
		return resolveActiveEmbeddedRunSessionId;
	}
});
