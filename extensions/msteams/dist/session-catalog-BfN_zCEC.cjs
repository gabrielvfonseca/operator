const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
const require_runtime_state = require("./runtime-state-DbA1_jkE.cjs");
const require_conversation_binding = require("./conversation-binding-CgjA96ja.cjs");
const require_session_state_events = require("./session-state-events-B4SfvxiO.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_agent_id_shared = require("./agent-id-shared-D_IljT8b.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/plugins/session-conversation-binding.ts
const log = require_subsystem.createSubsystemLogger("plugins/binding");
const pluginSessionBindTails = /* @__PURE__ */ new Map();
/** Binds a plugin-owned runtime to one authenticated Control UI session. */
async function bindPluginSessionConversation(params) {
	const sessionKey = params.sessionKey.trim();
	if (!sessionKey) throw new Error("session key is required for a plugin session binding");
	const operation = (pluginSessionBindTails.get(sessionKey) ?? Promise.resolve()).then(() => bindPluginSessionConversationExclusive({
		...params,
		sessionKey
	}));
	const tail = operation.then(() => void 0, () => void 0);
	pluginSessionBindTails.set(sessionKey, tail);
	try {
		return await operation;
	} finally {
		if (pluginSessionBindTails.get(sessionKey) === tail) pluginSessionBindTails.delete(sessionKey);
	}
}
async function bindPluginSessionConversationExclusive(params) {
	const sessionKey = params.sessionKey;
	const conversation = {
		channel: require_message_channel_core.INTERNAL_MESSAGE_CHANNEL,
		accountId: "default",
		conversationId: sessionKey
	};
	const previous = require_conversation_binding.resolveConversationBindingRecord(conversation);
	const bindingAttemptId = node_crypto.default.randomUUID();
	const binding = await require_conversation_binding.bindConversationNow({
		identity: require_conversation_binding.buildPluginBindingIdentity(params),
		conversation,
		targetSessionKey: sessionKey,
		summary: params.binding.summary,
		detachHint: params.binding.detachHint,
		data: params.binding.data,
		bindingAttemptId
	});
	try {
		await params.afterBind?.();
		return binding;
	} catch (error) {
		const current = require_conversation_binding.resolveConversationBindingRecord(conversation);
		if (current?.metadata?.bindingAttemptId !== bindingAttemptId) throw error;
		try {
			await require_conversation_binding.unbindConversationBindingRecord({
				bindingId: current.bindingId,
				reason: "plugin-session-bind-rollback"
			});
			if (previous && (previous.expiresAt === void 0 || previous.expiresAt > Date.now())) await require_conversation_binding.createConversationBindingRecord({
				targetSessionKey: previous.targetSessionKey,
				targetKind: previous.targetKind,
				conversation: previous.conversation,
				placement: "current",
				metadata: previous.metadata,
				...previous.expiresAt === void 0 ? {} : { ttlMs: Math.max(1, previous.expiresAt - Date.now()) }
			});
		} catch (rollbackError) {
			log.warn("plugin session binding finalization failed before rollback", { error });
			throw new Error("plugin session binding finalization failed and its previous binding could not be restored", { cause: rollbackError });
		}
		throw error;
	}
}
//#endregion
//#region src/gateway/server-methods/session-catalog.ts
var session_catalog_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolveSessionCatalogCreateTarget: () => resolveSessionCatalogCreateTarget,
	resolveSessionCatalogProvider: () => resolveSessionCatalogProvider,
	sessionCatalogHandlers: () => sessionCatalogHandlers
});
const SESSION_CATALOG_SEARCH_MAX_UTF16_UNITS = 500;
function normalizeSessionCatalogSearch(search) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(search);
	return normalized ? (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(normalized, SESSION_CATALOG_SEARCH_MAX_UTF16_UNITS) : void 0;
}
function catalogError(error) {
	const record = error && typeof error === "object" ? error : void 0;
	const recordMessage = typeof record?.message === "string" ? record.message.trim() : "";
	const fallbackMessage = typeof error === "string" ? error.trim() : "";
	return {
		code: typeof record?.code === "string" && record.code ? record.code : "catalog_error",
		message: recordMessage || fallbackMessage || "session catalog provider failed"
	};
}
function providers() {
	return registrations().map((entry) => entry.provider);
}
function resolveSessionCatalogProvider(catalogId) {
	return providers().find((candidate) => candidate.id === catalogId);
}
function registrations() {
	return (require_runtime_state.getPluginRegistryState()?.activeRegistry?.sessionCatalogs ?? []).toSorted((left, right) => left.provider.id.localeCompare(right.provider.id));
}
function resolveProviderCreateTarget(provider, agentId) {
	try {
		const target = provider.resolveCreateSession?.({ agentId });
		const model = target?.model.trim();
		const agentRuntime = target?.agentRuntime.trim();
		return model && agentRuntime ? {
			ok: true,
			target: {
				model,
				agentRuntime
			}
		} : {
			ok: false,
			message: `session catalog ${provider.id} cannot create sessions`
		};
	} catch (error) {
		return {
			ok: false,
			message: catalogError(error).message
		};
	}
}
/** Resolves a catalog-owned create target at the start of sessions.create. */
function resolveSessionCatalogCreateTarget(catalogId, agentId) {
	const registration = registrations().find((entry) => entry.provider.id === catalogId);
	if (!registration) return {
		ok: false,
		message: `unknown session catalog: ${catalogId}`,
		unknownCatalog: true
	};
	const resolved = resolveProviderCreateTarget(registration.provider, agentId);
	return resolved.ok ? {
		ok: true,
		target: {
			...resolved.target,
			pluginOwnerId: registration.pluginId
		}
	} : resolved;
}
function providerOrRespond(catalogId, respond) {
	const provider = resolveSessionCatalogProvider(catalogId);
	if (!provider) respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown session catalog: ${catalogId}`));
	return provider;
}
function registrationOrRespond(catalogId, respond) {
	const registration = registrations().find((candidate) => candidate.provider.id === catalogId);
	if (!registration) respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown session catalog: ${catalogId}`));
	return registration;
}
function catalogResult(provider, hosts, error, createSession) {
	const result = {
		id: provider.id,
		label: provider.label,
		capabilities: {
			continueSession: Boolean(provider.continueSession),
			archive: Boolean(provider.archive),
			...provider.openTerminal ? { openTerminal: true } : {},
			...createSession ? { createSession } : {}
		},
		hosts
	};
	if (error) result.error = error;
	return result;
}
const sessionCatalogHandlers = {
	"sessions.catalog.list": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateSessionsCatalogListParams, "sessions.catalog.list", respond)) return;
		const request = params;
		let selected;
		if (request.catalogId) {
			const provider = providerOrRespond(request.catalogId, respond);
			if (!provider) return;
			selected = [provider];
		} else selected = providers();
		const config = context.getRuntimeConfig();
		const resolvedAgent = require_agent_id_shared.resolveAgentIdOrRespondError({
			rawAgentId: request.agentId,
			respond,
			cfg: config,
			normalize: _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString
		});
		if (!resolvedAgent) return;
		const search = normalizeSessionCatalogSearch(request.search);
		respond(true, { catalogs: await Promise.all(selected.map(async (provider) => {
			const createTarget = resolveProviderCreateTarget(provider, resolvedAgent.agentId);
			const createSession = createTarget.ok ? { model: createTarget.target.model } : void 0;
			try {
				return catalogResult(provider, await provider.list({
					search,
					limitPerHost: request.limitPerHost,
					hostIds: request.hostIds,
					..."cursors" in request ? { cursors: request.cursors } : {}
				}), void 0, createSession);
			} catch (error) {
				return catalogResult(provider, [], catalogError(error), createSession);
			}
		})) });
	},
	"sessions.catalog.read": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validateSessionsCatalogReadParams, "sessions.catalog.read", respond)) return;
		const request = params;
		const provider = providerOrRespond(request.catalogId, respond);
		if (!provider) return;
		try {
			const { catalogId: _catalogId, ...providerRequest } = request;
			respond(true, await provider.read(providerRequest));
		} catch (error) {
			const details = catalogError(error);
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, details.message, { details }));
		}
	},
	"sessions.catalog.continue": async ({ params, respond, client }) => {
		if (!require_validation.assertValidParams(params, require_src.validateSessionsCatalogContinueParams, "sessions.catalog.continue", respond)) return;
		const request = params;
		const registration = registrationOrRespond(request.catalogId, respond);
		if (!registration) return;
		const provider = registration.provider;
		if (!provider.continueSession) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "catalog is view-only"));
			return;
		}
		try {
			const { catalogId: _catalogId, ...providerRequest } = request;
			const clientScopes = Array.isArray(client?.connect?.scopes) ? client.connect.scopes : [];
			const result = await provider.continueSession({
				...providerRequest,
				clientScopes
			});
			if (result.conversationBinding) await bindPluginSessionConversation({
				pluginId: registration.pluginId,
				pluginName: registration.pluginName,
				pluginRoot: registration.rootDir?.trim() || registration.source,
				sessionKey: result.sessionKey,
				binding: result.conversationBinding,
				afterBind: result.afterConversationBound
			});
			const agentId = require_session_key.resolveAgentIdFromSessionKey(result.sessionKey);
			if (result.upstream) require_session_state_events.upsertSessionUpstreamLink({
				sessionKey: result.sessionKey,
				agentId,
				catalogId: request.catalogId,
				hostId: request.hostId,
				threadId: request.threadId,
				upstreamKind: result.upstream.kind,
				upstreamRef: result.upstream.ref,
				marker: result.upstream.marker
			});
			require_session_state_events.recordSessionStateEvent({
				sessionKey: result.sessionKey,
				agentId,
				kind: "adopted",
				actorType: "human",
				dedupeKey: `adopted:${result.sessionKey}`,
				summary: `adopted from ${request.catalogId}`,
				payload: {
					catalogId: request.catalogId,
					hostId: request.hostId
				}
			});
			respond(true, { sessionKey: result.sessionKey });
		} catch (error) {
			const details = catalogError(error);
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, details.message, { details }));
		}
	},
	"sessions.catalog.archive": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validateSessionsCatalogArchiveParams, "sessions.catalog.archive", respond)) return;
		const request = params;
		const provider = providerOrRespond(request.catalogId, respond);
		if (!provider) return;
		if (!provider.archive) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "catalog cannot archive"));
			return;
		}
		try {
			const { catalogId: _catalogId, ...providerRequest } = request;
			respond(true, await provider.archive(providerRequest));
		} catch (error) {
			const details = catalogError(error);
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, details.message, { details }));
		}
	}
};
//#endregion
Object.defineProperty(exports, "resolveSessionCatalogCreateTarget", {
	enumerable: true,
	get: function() {
		return resolveSessionCatalogCreateTarget;
	}
});
Object.defineProperty(exports, "resolveSessionCatalogProvider", {
	enumerable: true,
	get: function() {
		return resolveSessionCatalogProvider;
	}
});
Object.defineProperty(exports, "session_catalog_exports", {
	enumerable: true,
	get: function() {
		return session_catalog_exports;
	}
});
