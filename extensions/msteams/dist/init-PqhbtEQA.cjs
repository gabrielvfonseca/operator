const require_registry = require("./registry-B6IZcEYI.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
require("@gabrielvfonseca/ai/internal/shared");
//#region src/context-engine/delegate.ts
const loadCompactRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./compact.runtime-Dv-LyoM5.cjs")));
function buildCompactionResultSessionTarget(params) {
	const sqliteMarker = require_sqlite_marker.parseSqliteSessionFileMarker(params.sessionFile);
	const sessionId = sqliteMarker?.sessionId ?? params.sessionId;
	if (!sessionId) return;
	const agentId = params.sessionTarget?.agentId ?? params.agentId ?? sqliteMarker?.agentId;
	const sessionKey = params.sessionTarget?.sessionKey ?? params.sessionKey;
	const storePath = params.sessionTarget?.storePath ?? sqliteMarker?.storePath;
	return {
		...agentId ? { agentId } : {},
		sessionId,
		...sessionKey ? { sessionKey } : {},
		...storePath ? { storePath } : {},
		...params.sessionTarget?.threadId !== void 0 ? { threadId: params.sessionTarget.threadId } : {}
	};
}
/**
* Delegate a context-engine compaction request to Operator's built-in runtime compaction path.
*
* This is the same bridge used by the legacy context engine. Third-party
* engines can call it from their own `compact()` implementations when they do
* not own the compaction algorithm but still need `/compact` and overflow
* recovery to use the stock runtime behavior.
*
* Note: `compactionTarget` is part of the public `compact()` contract, but the
* built-in runtime compaction path does not expose that knob. This helper
* ignores it to preserve legacy behavior; engines that need target-specific
* compaction should implement their own `compact()` algorithm.
*/
async function delegateCompactionToRuntime(params) {
	const { compactEmbeddedAgentSessionDirect } = await loadCompactRuntime();
	const runtimeContext = params.runtimeContext ?? {};
	const { sessionFile: _legacySessionFile, ...runtimeContextParams } = runtimeContext;
	const sessionTarget = params.sessionTarget ?? runtimeContext.sessionTarget;
	const agentId = params.agentId ?? runtimeContext.agentId;
	const sessionKey = params.sessionKey ?? runtimeContext.sessionKey;
	const currentTokenCount = params.currentTokenCount ?? (typeof runtimeContext.currentTokenCount === "number" && Number.isFinite(runtimeContext.currentTokenCount) && runtimeContext.currentTokenCount > 0 ? Math.floor(runtimeContext.currentTokenCount) : void 0);
	const result = await compactEmbeddedAgentSessionDirect({
		...runtimeContextParams,
		...agentId ? { agentId } : {},
		sessionId: params.sessionId,
		...sessionKey ? { sessionKey } : {},
		...sessionTarget ? { sessionTarget } : {},
		tokenBudget: params.tokenBudget,
		...currentTokenCount !== void 0 ? { currentTokenCount } : {},
		force: params.force,
		customInstructions: params.customInstructions,
		abortSignal: params.abortSignal,
		workspaceDir: typeof runtimeContext.workspaceDir === "string" ? runtimeContext.workspaceDir : process.cwd()
	});
	const resultSessionTarget = result.result ? buildCompactionResultSessionTarget({
		agentId,
		sessionFile: result.result.sessionFile,
		sessionId: result.result.sessionId,
		sessionKey,
		sessionTarget
	}) : void 0;
	return {
		ok: result.ok,
		compacted: result.compacted,
		reason: result.reason,
		result: result.result ? {
			summary: result.result.summary,
			firstKeptEntryId: result.result.firstKeptEntryId,
			tokensBefore: result.result.tokensBefore,
			tokensAfter: result.result.tokensAfter,
			details: result.result.details,
			...result.result.sessionId ? { sessionId: result.result.sessionId } : {},
			...resultSessionTarget ? { sessionTarget: resultSessionTarget } : {}
		} : void 0
	};
}
//#endregion
//#region src/context-engine/legacy.ts
/**
* LegacyContextEngine wraps the existing compaction behavior behind the
* ContextEngine interface, preserving 100% backward compatibility.
*
* - ingest: no-op (SessionManager handles message persistence)
* - assemble: pass-through (existing sanitize/validate/limit pipeline in attempt.ts handles this)
* - compact: delegates to compactEmbeddedAgentSessionDirect
*/
var LegacyContextEngine = class {
	constructor() {
		this.info = {
			id: "legacy",
			name: "Legacy Context Engine",
			version: "1.0.0"
		};
	}
	async ingest(_params) {
		return { ingested: false };
	}
	async assemble(params) {
		return {
			messages: params.messages,
			estimatedTokens: 0
		};
	}
	async afterTurn(_params) {}
	async compact(params) {
		return await delegateCompactionToRuntime(params);
	}
	async dispose() {}
};
//#endregion
//#region src/context-engine/legacy.registration.ts
function registerLegacyContextEngine() {
	require_registry.registerContextEngineForOwner("legacy", async () => new LegacyContextEngine(), "core", { allowSameOwnerRefresh: true });
}
//#endregion
//#region src/context-engine/init.ts
/**
* Ensures all built-in context engines are registered exactly once.
*
* The legacy engine is always registered as a safe fallback so that
* `resolveContextEngine()` can resolve the default "legacy" slot without
* callers needing to remember manual registration.
*
* Additional engines are registered by their own plugins via
* `api.registerContextEngine()` during plugin load.
*/
let initialized = false;
function ensureContextEnginesInitialized() {
	if (initialized) return;
	initialized = true;
	registerLegacyContextEngine();
}
//#endregion
Object.defineProperty(exports, "ensureContextEnginesInitialized", {
	enumerable: true,
	get: function() {
		return ensureContextEnginesInitialized;
	}
});
