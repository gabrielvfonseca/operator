const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_store = require("./store-DCwJguwr.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_model_visibility_policy = require("./model-visibility-policy-BAqBH6Uw.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
const require_server_model_catalog = require("./server-model-catalog-DBGLKoRk.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/http-utils.ts
const OPERATOR_MODEL_ID = "@gabrielvfonseca/operator";
/** Default OpenAI-compatible model alias that targets the default Operator agent. */
const OPERATOR_DEFAULT_MODEL_ID = "openclaw/default";
var UnknownGatewayAgentError = class extends Error {
	constructor(agentId) {
		super(`Unknown agent '${agentId}'.`);
		this.agentId = agentId;
		this.name = "UnknownGatewayAgentError";
	}
};
var GatewaySessionKeyOverrideError = class extends Error {
	constructor() {
		super("`x-operator-session-key` cannot use reserved internal session namespaces.");
		this.name = "GatewaySessionKeyOverrideError";
	}
};
function isUnknownGatewayAgentError(err) {
	return err instanceof UnknownGatewayAgentError;
}
function isGatewaySessionKeyOverrideError(err) {
	return err instanceof GatewaySessionKeyOverrideError;
}
function assertKnownAgentId(agentId, cfg = require_io.getRuntimeConfig()) {
	if (!require_agent_scope_config.listAgentIds(cfg).includes(agentId)) throw new UnknownGatewayAgentError(agentId);
}
function resolveAgentIdFromHeader(req) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-agent-id")) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-agent")) || "";
	if (!raw) return;
	if (!(0, _gabrielvfonseca_normalization_core_agent_id.isValidAgentId)(raw)) throw new UnknownGatewayAgentError(raw);
	return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(raw);
}
/** Resolves the target agent encoded by an OpenAI-compatible model id. */
function resolveAgentIdFromModel(model, cfg = require_io.getRuntimeConfig()) {
	const raw = model?.trim();
	if (!raw) return;
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	if (lowered === "@gabrielvfonseca/operator" || lowered === "openclaw/default") return require_agent_scope_config.resolveDefaultAgentId(cfg);
	const agentId = (raw.match(/^openclaw[:/](?<agentId>[a-z0-9][a-z0-9_-]{0,63})$/i) ?? raw.match(/^agent:(?<agentId>[a-z0-9][a-z0-9_-]{0,63})$/i))?.groups?.agentId;
	if (!agentId) return;
	return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
}
/** Validates and resolves the `x-operator-model` override for OpenAI-compatible requests. */
async function resolveOpenAiCompatModelOverride(params) {
	const requestModel = params.model?.trim();
	if (requestModel && !resolveAgentIdFromModel(requestModel)) return { errorMessage: "Invalid `model`. Use `openclaw` or `openclaw/<agentId>`." };
	const raw = require_http_auth_utils.getHeader(params.req, "x-operator-model")?.trim();
	if (!raw) return {};
	const cfg = require_io.getRuntimeConfig();
	const defaultProvider = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg,
		agentId: params.agentId
	}).provider;
	const modelManifestContext = { manifestPlugins: require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: cfg,
		env: process.env
	}).plugins };
	const parsed = require_model_selection_normalize.parseModelRef(raw, defaultProvider, {
		allowManifestNormalization: true,
		allowPluginNormalization: true,
		...modelManifestContext
	});
	if (!parsed) return { errorMessage: "Invalid `x-operator-model`." };
	const policy = require_model_visibility_policy.createModelVisibilityPolicy({
		cfg,
		catalog: await require_server_model_catalog.loadGatewayModelCatalog(),
		defaultProvider,
		agentId: params.agentId,
		allowManifestNormalization: true,
		allowPluginNormalization: true,
		...modelManifestContext
	});
	const normalized = require_model_selection_normalize.modelKey(parsed.provider, parsed.model);
	if (!policy.allowsKey(normalized)) return { errorMessage: `Model '${normalized}' is not allowed for agent '${params.agentId}'.` };
	return { modelOverride: raw };
}
/** Resolves the request agent from headers, model alias, or the configured default. */
function resolveAgentIdForRequest(params) {
	const cfg = require_io.getRuntimeConfig();
	const fromHeader = resolveAgentIdFromHeader(params.req);
	if (fromHeader) {
		assertKnownAgentId(fromHeader, cfg);
		return fromHeader;
	}
	const fromModel = resolveAgentIdFromModel(params.model, cfg);
	if (fromModel) {
		assertKnownAgentId(fromModel, cfg);
		return fromModel;
	}
	return require_agent_scope_config.resolveDefaultAgentId(cfg);
}
function resolveSessionKey(params) {
	const explicit = require_http_auth_utils.getHeader(params.req, "x-operator-session-key")?.trim();
	if (explicit) {
		if (isReservedSessionKeyOverride(explicit, params.agentId)) throw new GatewaySessionKeyOverrideError();
		return explicit;
	}
	const user = params.user?.trim();
	const mainKey = user ? `${params.prefix}-user:${user}` : `${params.prefix}:${(0, node_crypto.randomUUID)()}`;
	return require_session_key.buildAgentMainSessionKey({
		agentId: params.agentId,
		mainKey
	});
}
function isReservedSessionKeyOverride(sessionKey, agentId) {
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(sessionKey);
	const harnessLookupKey = sessionKey.startsWith("agent:") ? sessionKey : require_session_accessor.canonicalizeSessionKeyForAgent(agentId, sessionKey);
	const harnessEntry = require_store.isAgentHarnessSessionKey(sessionKey) ? require_session_accessor.resolveSessionEntryAccessTarget({
		cfg: require_io.getRuntimeConfig(),
		sessionKey: harnessLookupKey
	}).entry : void 0;
	const harnessKeyReserved = require_store.isAgentHarnessSessionKey(sessionKey) && (!harnessEntry || require_store.isAgentHarnessSessionStoreEntryProtected(sessionKey, harnessEntry));
	return lowered.startsWith("subagent:") || lowered.startsWith("cron:") || lowered.startsWith("acp:") || harnessKeyReserved || require_session_key.isSubagentSessionKey(sessionKey) || require_session_key.isCronSessionKey(sessionKey) || require_session_key.isAcpSessionKey(sessionKey);
}
/** Resolves gateway agent/session/channel context for OpenAI-compatible handlers. */
function resolveGatewayRequestContext(params) {
	const agentId = resolveAgentIdForRequest({
		req: params.req,
		model: params.model
	});
	return {
		agentId,
		sessionKey: resolveSessionKey({
			req: params.req,
			agentId,
			user: params.user,
			prefix: params.sessionPrefix
		}),
		messageChannel: params.useMessageChannelHeader ? require_message_channel.normalizeMessageChannel(require_http_auth_utils.getHeader(params.req, "x-operator-message-channel")) ?? params.defaultMessageChannel : params.defaultMessageChannel
	};
}
//#endregion
Object.defineProperty(exports, "OPERATOR_DEFAULT_MODEL_ID", {
	enumerable: true,
	get: function() {
		return OPERATOR_DEFAULT_MODEL_ID;
	}
});
Object.defineProperty(exports, "OPERATOR_MODEL_ID", {
	enumerable: true,
	get: function() {
		return OPERATOR_MODEL_ID;
	}
});
Object.defineProperty(exports, "isGatewaySessionKeyOverrideError", {
	enumerable: true,
	get: function() {
		return isGatewaySessionKeyOverrideError;
	}
});
Object.defineProperty(exports, "isUnknownGatewayAgentError", {
	enumerable: true,
	get: function() {
		return isUnknownGatewayAgentError;
	}
});
Object.defineProperty(exports, "resolveAgentIdForRequest", {
	enumerable: true,
	get: function() {
		return resolveAgentIdForRequest;
	}
});
Object.defineProperty(exports, "resolveAgentIdFromModel", {
	enumerable: true,
	get: function() {
		return resolveAgentIdFromModel;
	}
});
Object.defineProperty(exports, "resolveGatewayRequestContext", {
	enumerable: true,
	get: function() {
		return resolveGatewayRequestContext;
	}
});
Object.defineProperty(exports, "resolveOpenAiCompatModelOverride", {
	enumerable: true,
	get: function() {
		return resolveOpenAiCompatModelOverride;
	}
});
