const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_redact_identifier = require("./redact-identifier-DrE35Pyt.cjs");
const require_sanitize_for_prompt = require("./sanitize-for-prompt-C114FURC.cjs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/agents/workspace-run.ts
function resolveRunAgentId(params) {
	const rawSessionKey = params.sessionKey?.trim() ?? "";
	const shape = require_session_key.classifySessionKeyShape(rawSessionKey);
	if (shape === "malformed_agent") throw new Error("Malformed agent session key; refusing workspace resolution.");
	const explicit = typeof params.agentId === "string" && params.agentId.trim() ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId) : void 0;
	if (explicit) return {
		agentId: explicit,
		agentIdSource: "explicit"
	};
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(params.config ?? {});
	if (shape === "missing" || shape === "legacy_or_alias") return {
		agentId: defaultAgentId || "main",
		agentIdSource: "default"
	};
	const parsed = require_session_key.parseAgentSessionKey(rawSessionKey);
	if (parsed?.agentId) return {
		agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId),
		agentIdSource: "session_key"
	};
	return {
		agentId: defaultAgentId || "main",
		agentIdSource: "default"
	};
}
/** Redacts a run/session identifier for logs and prompts. */
function redactRunIdentifier(value) {
	return require_redact_identifier.redactIdentifier(value, { len: 12 });
}
/** Resolves the workspace directory used for an agent run. */
function resolveRunWorkspaceDir(params) {
	const env = params.env ?? process.env;
	const requested = params.workspaceDir;
	const { agentId, agentIdSource } = resolveRunAgentId({
		sessionKey: params.sessionKey,
		agentId: params.agentId,
		config: params.config
	});
	if (typeof requested === "string") {
		const trimmed = requested.trim();
		if (trimmed) {
			const sanitized = require_sanitize_for_prompt.sanitizeForPromptLiteral(trimmed);
			if (sanitized !== trimmed) require_logger.logWarn("Control/format characters stripped from workspaceDir (OC-19 hardening).");
			return {
				workspaceDir: require_home_dir.resolveUserPath(sanitized, env),
				usedFallback: false,
				agentId,
				agentIdSource
			};
		}
	}
	const fallbackReason = requested == null ? "missing" : typeof requested === "string" ? "blank" : "invalid_type";
	const fallbackWorkspace = require_agent_scope_config.resolveAgentWorkspaceDir(params.config ?? {}, agentId, env);
	const sanitizedFallback = require_sanitize_for_prompt.sanitizeForPromptLiteral(fallbackWorkspace);
	if (sanitizedFallback !== fallbackWorkspace) require_logger.logWarn("Control/format characters stripped from fallback workspaceDir (OC-19 hardening).");
	return {
		workspaceDir: require_home_dir.resolveUserPath(sanitizedFallback, env),
		usedFallback: true,
		fallbackReason,
		agentId,
		agentIdSource
	};
}
//#endregion
Object.defineProperty(exports, "redactRunIdentifier", {
	enumerable: true,
	get: function() {
		return redactRunIdentifier;
	}
});
Object.defineProperty(exports, "resolveRunWorkspaceDir", {
	enumerable: true,
	get: function() {
		return resolveRunWorkspaceDir;
	}
});
