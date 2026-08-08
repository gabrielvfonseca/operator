const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_session_runtime_compat = require("./session-runtime-compat-B8Zu61mN.cjs");
//#region src/agents/acp-runtime-overlay.ts
/** Applies ACP session-key metadata overrides to agent runtime classification. */
/**
* When a session key and persisted session metadata identify an ACP
* control-plane session, override the resolved runtime metadata to report the
* ACP runtime id with a "session-key" source — regardless of what the
* agent-config policy resolved to.
*
* Callers that already have model/provider context (resolveModelAgentRuntimeMetadata)
* still benefit here because the model-runtime policy chain does not inspect session
* keys for the ACP indicator.
*
* Key shape alone is not sufficient: ACP bridge sessions may use ACP-shaped
* keys without persisted SessionAcpMeta and still run the configured model.
*
* When `acpBackend` is provided and non-empty, it is used as the runtime id so that
* sessions backed by a configured non-default ACP backend (e.g. a custom registered
* backend) are reported faithfully instead of always being labelled "acpx".
* Falls back to "acpx" when no backend is known.
*/
function applyAcpRuntimeOverlay(meta, sessionKey, acpRuntime, acpBackend) {
	if (acpRuntime === true && require_session_key.isAcpSessionKey(sessionKey)) return {
		id: acpBackend && acpBackend.length > 0 ? acpBackend : "acpx",
		source: "session-key"
	};
	return meta;
}
//#endregion
//#region src/agents/agent-runtime-metadata.ts
/** Resolves the runtime id/source that should be reported for a model-backed agent session. */
function resolveModelAgentRuntimeMetadata(params) {
	const persistedRuntimeId = require_session_runtime_compat.resolvePersistedSessionRuntimeId(params.sessionEntry);
	if (persistedRuntimeId && !require_openai_routing.isDefaultAgentRuntimeId(persistedRuntimeId)) return applyAcpRuntimeOverlay({
		id: persistedRuntimeId,
		source: "session"
	}, params.sessionKey, params.acpRuntime, params.acpBackend);
	const resolved = params.provider && params.model ? {
		provider: params.provider,
		model: params.model
	} : require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: params.agentId
	});
	const policy = require_policy.resolveAgentHarnessPolicy({
		provider: resolved.provider,
		modelId: resolved.model,
		config: params.cfg,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	});
	return applyAcpRuntimeOverlay({
		id: policy.runtime,
		source: policy.runtimeSource ?? "implicit"
	}, params.sessionKey, params.acpRuntime, params.acpBackend);
}
//#endregion
Object.defineProperty(exports, "resolveModelAgentRuntimeMetadata", {
	enumerable: true,
	get: function() {
		return resolveModelAgentRuntimeMetadata;
	}
});
