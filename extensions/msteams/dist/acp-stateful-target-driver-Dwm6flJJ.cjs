require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_binding_registry = require("./binding-registry-CtJxOm6I.cjs");
const require_persistent_bindings_resolve = require("./persistent-bindings.resolve-Duo7LLye.cjs");
const require_session_meta = require("./session-meta-BKZldXXC.cjs");
const require_manager = require("./manager-B5L0WDCm.cjs");
const require_session_reset_service = require("./session-reset-service-BJLBYKkE.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_acp_core_normalize_text = require("@gabrielvfonseca/acp-core/normalize-text");
//#region src/acp/persistent-bindings.lifecycle.ts
/** Ensures configured channel-to-ACP bindings have live sessions and matching runtime options. */
function sessionMatchesConfiguredBinding(params) {
	if (params.meta.state === "error") return false;
	const desiredAgent = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.spec.acpAgentId ?? params.spec.agentId);
	const currentAgent = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.meta.agent);
	if (!currentAgent || currentAgent !== desiredAgent) return false;
	if (params.meta.mode !== params.spec.mode) return false;
	const desiredBackend = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(params.spec.backend) ?? (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(params.cfg.acp?.backend) ?? "";
	if (desiredBackend) {
		const currentBackend = (params.meta.backend ?? "").trim();
		if (!currentBackend || currentBackend !== desiredBackend) return false;
	}
	const desiredCwd = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(params.spec.cwd);
	if (desiredCwd !== void 0) {
		if (desiredCwd !== (params.meta.runtimeOptions?.cwd ?? params.meta.cwd ?? "").trim()) return false;
	}
	return true;
}
/** Creates or replaces the ACP session required by one configured binding. */
async function ensureConfiguredAcpBindingSession(params) {
	const sessionKey = require_binding_registry.buildConfiguredAcpSessionKey(params.spec);
	const acpManager = require_manager.getAcpSessionManager();
	try {
		const resolution = acpManager.resolveSession({
			cfg: params.cfg,
			sessionKey
		});
		if (resolution.kind === "ready" && sessionMatchesConfiguredBinding({
			cfg: params.cfg,
			spec: params.spec,
			meta: resolution.meta
		})) return {
			ok: true,
			sessionKey
		};
		if (resolution.kind !== "none") await acpManager.closeSession({
			cfg: params.cfg,
			sessionKey,
			reason: "config-binding-reconfigure",
			clearMeta: false,
			allowBackendUnavailable: true,
			requireAcpSession: false
		});
		await acpManager.initializeSession({
			cfg: params.cfg,
			sessionKey,
			agent: params.spec.acpAgentId ?? params.spec.agentId,
			mode: params.spec.mode,
			cwd: params.spec.cwd,
			backendId: params.spec.backend
		});
		return {
			ok: true,
			sessionKey
		};
	} catch (error) {
		const message = require_errors.formatErrorMessage(error);
		require_globals.logVerbose(`acp-configured-binding: failed ensuring ${params.spec.channel}:${params.spec.accountId}:${params.spec.conversationId} -> ${sessionKey}: ${message}`);
		return {
			ok: false,
			sessionKey,
			error: message
		};
	}
}
/** Resolves a configured binding for a conversation and ensures its ACP session exists. */
async function ensureConfiguredAcpBindingReady(params) {
	if (!params.configuredBinding) return { ok: true };
	const ensured = await ensureConfiguredAcpBindingSession({
		cfg: params.cfg,
		spec: params.configuredBinding.spec
	});
	if (ensured.ok) return { ok: true };
	return {
		ok: false,
		error: ensured.error ?? "unknown error"
	};
}
//#endregion
//#region src/channels/plugins/acp-stateful-target-driver.ts
/**
* ACP stateful target driver for configured bindings.
*
* Ensures ACP-backed bound sessions exist, are ready, and can be reset by Gateway.
*/
function toAcpStatefulBindingTargetDescriptor(params) {
	const sessionKey = params.sessionKey.trim();
	if (!sessionKey) return null;
	const metaAgentId = (require_session_meta.readAcpSessionEntry({
		...params,
		sessionKey
	})?.acp)?.agent?.trim();
	if (metaAgentId) return {
		kind: "stateful",
		driverId: "acp",
		sessionKey,
		agentId: metaAgentId
	};
	const spec = require_persistent_bindings_resolve.resolveConfiguredAcpBindingSpecBySessionKey({
		...params,
		sessionKey
	});
	if (!spec) {
		if (!require_session_key.isAcpSessionKey(sessionKey)) return null;
		return {
			kind: "stateful",
			driverId: "acp",
			sessionKey,
			agentId: require_session_key.resolveAgentIdFromSessionKey(sessionKey)
		};
	}
	return {
		kind: "stateful",
		driverId: "acp",
		sessionKey,
		agentId: spec.agentId,
		...spec.label ? { label: spec.label } : {}
	};
}
async function ensureAcpTargetReady(params) {
	const configuredBinding = require_binding_registry.resolveConfiguredAcpBindingSpecFromRecord(params.bindingResolution.record);
	if (!configuredBinding) return {
		ok: false,
		error: "Configured ACP binding unavailable"
	};
	return await ensureConfiguredAcpBindingReady({
		cfg: params.cfg,
		configuredBinding: {
			spec: configuredBinding,
			record: params.bindingResolution.record
		}
	});
}
async function ensureAcpTargetSession(params) {
	const spec = require_binding_registry.resolveConfiguredAcpBindingSpecFromRecord(params.bindingResolution.record);
	if (!spec) return {
		ok: false,
		sessionKey: params.bindingResolution.statefulTarget.sessionKey,
		error: "Configured ACP binding unavailable"
	};
	return await ensureConfiguredAcpBindingSession({
		cfg: params.cfg,
		spec
	});
}
async function resetAcpTargetInPlace(params) {
	const result = await require_session_reset_service.performGatewaySessionReset({
		key: params.sessionKey,
		reason: params.reason,
		commandSource: params.commandSource ?? "stateful-target:acp-reset-in-place"
	});
	if (result.ok) return {
		ok: true,
		sessionKey: result.key,
		sessionId: result.entry.sessionId,
		storePath: result.storePath
	};
	return {
		ok: false,
		error: result.error.message
	};
}
const acpStatefulBindingTargetDriver = {
	id: "acp",
	ensureReady: ensureAcpTargetReady,
	ensureSession: ensureAcpTargetSession,
	resolveTargetBySessionKey: toAcpStatefulBindingTargetDescriptor,
	resetInPlace: resetAcpTargetInPlace
};
//#endregion
exports.acpStatefulBindingTargetDriver = acpStatefulBindingTargetDriver;
