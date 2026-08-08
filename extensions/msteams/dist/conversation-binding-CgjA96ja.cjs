const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./plugins-_-82JYfc.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
require("./errors-BqS4bzom.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
require("./runtime-DUfj3X7c.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/bindings/records.ts
/**
* Conversation binding record facade.
*
* Routes binding CRUD helpers through the shared session binding service.
*/
async function createConversationBindingRecord(input) {
	return await require_session_binding_service.getSessionBindingService().bind(input);
}
function resolveConversationBindingRecord(conversation) {
	return require_session_binding_service.getSessionBindingService().resolveByConversation(conversation);
}
function touchConversationBindingRecord(bindingId, at) {
	const service = require_session_binding_service.getSessionBindingService();
	if (typeof at === "number") {
		service.touch(bindingId, at);
		return;
	}
	service.touch(bindingId);
}
async function unbindConversationBindingRecord(input) {
	return await require_session_binding_service.getSessionBindingService().unbind(input);
}
//#endregion
//#region src/plugins/conversation-binding-session-key.ts
const PLUGIN_BINDING_SESSION_PREFIX = "plugin-binding";
function normalizeChannel(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value) ?? "";
}
function buildPluginBindingSessionKey(params) {
	const hash = node_crypto.default.createHash("sha256").update(JSON.stringify({
		pluginId: params.pluginId,
		channel: normalizeChannel(params.channel),
		accountId: params.accountId,
		conversationId: params.conversationId
	})).digest("hex").slice(0, 24);
	return `${PLUGIN_BINDING_SESSION_PREFIX}:${params.pluginId}:${hash}`;
}
//#endregion
//#region src/plugins/conversation-binding.ts
const log = require_subsystem.createSubsystemLogger("plugins/binding");
const PLUGIN_BINDING_CUSTOM_ID_PREFIX = "pluginbind";
const PLUGIN_BINDING_OWNER = "plugin";
const LEGACY_CODEX_PLUGIN_SESSION_PREFIXES = ["operator-app-server:thread:", "operator-codex-app-server:thread:"];
const pendingRequests = require_global_singleton.resolveGlobalMap(Symbol.for("operator.pluginBindingPendingRequests"));
const pluginBindingGlobalState = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.plugins.binding.global-state"), () => ({
	fallbackNoticeBindingIds: /* @__PURE__ */ new Set(),
	approvalsCache: null,
	approvalsLoaded: false,
	approvalsSaveChain: Promise.resolve()
}));
function getPluginBindingGlobalState() {
	return pluginBindingGlobalState;
}
function normalizeConversation(params) {
	return {
		channel: normalizeChannel(params.channel),
		accountId: params.accountId.trim() || "default",
		conversationId: params.conversationId.trim(),
		parentConversationId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.parentConversationId),
		threadId: typeof params.threadId === "number" ? Math.trunc(params.threadId) : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.threadId?.toString())
	};
}
function normalizeBindingData(data) {
	if (!data || typeof data !== "object" || Array.isArray(data)) return;
	return { ...data };
}
function toConversationRef(params) {
	const normalized = normalizeConversation(params);
	const channelId = require_registry.normalizeChannelId(normalized.channel);
	const resolvedConversationRef = channelId ? require_registry.getChannelPlugin(channelId)?.conversationBindings?.resolveConversationRef?.({
		accountId: normalized.accountId,
		conversationId: normalized.conversationId,
		parentConversationId: normalized.parentConversationId,
		threadId: normalized.threadId
	}) : null;
	if (resolvedConversationRef?.conversationId?.trim()) return {
		channel: normalized.channel,
		accountId: normalized.accountId,
		conversationId: resolvedConversationRef.conversationId.trim(),
		...resolvedConversationRef.parentConversationId?.trim() ? { parentConversationId: resolvedConversationRef.parentConversationId.trim() } : {}
	};
	return {
		channel: normalized.channel,
		accountId: normalized.accountId,
		conversationId: normalized.conversationId,
		...normalized.parentConversationId ? { parentConversationId: normalized.parentConversationId } : {}
	};
}
function buildApprovalScopeKey(params) {
	return [
		params.pluginRoot,
		normalizeChannel(params.channel),
		params.accountId.trim() || "default"
	].join("::");
}
function buildPluginBindingIdentity(params) {
	return {
		pluginId: params.pluginId,
		pluginName: params.pluginName,
		pluginRoot: params.pluginRoot
	};
}
function logPluginBindingLifecycleEvent(params) {
	const parts = [
		`plugin binding ${params.event}`,
		`plugin=${params.pluginId}`,
		`root=${params.pluginRoot}`,
		...params.decision ? [`decision=${params.decision}`] : [],
		`channel=${params.channel}`,
		`account=${params.accountId}`,
		`conversation=${params.conversationId}`
	];
	log.info(parts.join(" "));
}
function isLegacyPluginBindingRecord(params) {
	if (!params.record || isPluginOwnedBindingMetadata(params.record.metadata)) return false;
	const targetSessionKey = params.record.targetSessionKey.trim();
	return targetSessionKey.startsWith(`plugin-binding:`) || LEGACY_CODEX_PLUGIN_SESSION_PREFIXES.some((prefix) => targetSessionKey.startsWith(prefix));
}
function buildApprovalInteractiveReply(approvalId) {
	return { blocks: [{
		type: "buttons",
		buttons: [
			{
				label: "Allow once",
				value: buildPluginBindingApprovalCustomId(approvalId, "allow-once"),
				style: "success"
			},
			{
				label: "Always allow",
				value: buildPluginBindingApprovalCustomId(approvalId, "allow-always"),
				style: "primary"
			},
			{
				label: "Deny",
				value: buildPluginBindingApprovalCustomId(approvalId, "deny"),
				style: "danger"
			}
		]
	}] };
}
function createApprovalRequestId() {
	return node_crypto.default.randomBytes(9).toString("base64url");
}
function openApprovalsDatabase() {
	return require_openclaw_state_db.openOperatorStateDatabase();
}
function loadApprovalsFromDatabase() {
	try {
		const database = openApprovalsDatabase();
		const approvalsDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
		return { approvals: require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, approvalsDb.selectFrom("plugin_binding_approvals").select([
			"plugin_root",
			"plugin_id",
			"plugin_name",
			"channel",
			"account_id",
			"approved_at"
		]).orderBy("plugin_root", "asc").orderBy("channel", "asc").orderBy("account_id", "asc")).rows.map((row) => ({
			pluginRoot: row.plugin_root,
			pluginId: row.plugin_id,
			pluginName: row.plugin_name ?? void 0,
			channel: normalizeChannel(row.channel),
			accountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.account_id) ?? "default",
			approvedAt: row.approved_at
		})) };
	} catch (error) {
		log.warn(`plugin binding approvals load failed: ${String(error)}`);
		return { approvals: [] };
	}
}
function getApprovals() {
	const state = getPluginBindingGlobalState();
	if (!state.approvalsLoaded || !state.approvalsCache) {
		state.approvalsCache = loadApprovalsFromDatabase();
		state.approvalsLoaded = true;
	}
	return state.approvalsCache;
}
function hasPersistentApproval(params) {
	const key = buildApprovalScopeKey(params);
	return getApprovals().approvals.some((entry) => buildApprovalScopeKey({
		pluginRoot: entry.pluginRoot,
		channel: entry.channel,
		accountId: entry.accountId
	}) === key);
}
function buildBindingMetadata(params) {
	return {
		pluginBindingOwner: PLUGIN_BINDING_OWNER,
		pluginId: params.pluginId,
		pluginName: params.pluginName,
		pluginRoot: params.pluginRoot,
		summary: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.summary),
		detachHint: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.detachHint),
		data: normalizeBindingData(params.data),
		bindingAttemptId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.bindingAttemptId)
	};
}
function isPluginOwnedBindingMetadata(metadata) {
	if (!metadata || typeof metadata !== "object") return false;
	const record = metadata;
	return record.pluginBindingOwner === PLUGIN_BINDING_OWNER && typeof record.pluginId === "string" && typeof record.pluginRoot === "string";
}
function isPluginOwnedSessionBindingRecord(record) {
	return isPluginOwnedBindingMetadata(record?.metadata);
}
function toPluginConversationBinding(record) {
	if (!record || !isPluginOwnedBindingMetadata(record.metadata)) return null;
	const metadata = record.metadata;
	return {
		bindingId: record.bindingId,
		pluginId: metadata.pluginId,
		pluginName: metadata.pluginName,
		pluginRoot: metadata.pluginRoot,
		channel: record.conversation.channel,
		accountId: record.conversation.accountId,
		conversationId: record.conversation.conversationId,
		parentConversationId: record.conversation.parentConversationId,
		boundAt: record.boundAt,
		summary: metadata.summary,
		detachHint: metadata.detachHint,
		data: metadata.data
	};
}
function withConversationBindingContext(binding, conversation) {
	return {
		...binding,
		parentConversationId: conversation.parentConversationId,
		threadId: conversation.threadId
	};
}
function resolvePluginConversationBindingState(params) {
	const ref = toConversationRef(params.conversation);
	const record = resolveConversationBindingRecord(ref);
	return {
		ref,
		record,
		binding: toPluginConversationBinding(record),
		isLegacyForeignBinding: isLegacyPluginBindingRecord({ record })
	};
}
function resolveOwnedPluginConversationBinding(params) {
	const state = resolvePluginConversationBindingState({ conversation: params.conversation });
	if (!state.binding || state.binding.pluginRoot !== params.pluginRoot) return null;
	return withConversationBindingContext(state.binding, params.conversation);
}
function bindConversationFromIdentity(params) {
	return bindConversationNow({
		identity: buildPluginBindingIdentity(params.identity),
		conversation: params.conversation,
		summary: params.summary,
		detachHint: params.detachHint,
		data: params.data
	});
}
async function bindConversationNow(params) {
	const ref = toConversationRef(params.conversation);
	const binding = toPluginConversationBinding(await createConversationBindingRecord({
		targetSessionKey: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.targetSessionKey) ?? buildPluginBindingSessionKey({
			pluginId: params.identity.pluginId,
			channel: ref.channel,
			accountId: ref.accountId,
			conversationId: ref.conversationId
		}),
		targetKind: "session",
		conversation: ref,
		placement: "current",
		metadata: buildBindingMetadata({
			pluginId: params.identity.pluginId,
			pluginName: params.identity.pluginName,
			pluginRoot: params.identity.pluginRoot,
			summary: params.summary,
			detachHint: params.detachHint,
			data: params.data,
			bindingAttemptId: params.bindingAttemptId
		})
	}));
	if (!binding) throw new Error("plugin binding was created without plugin metadata");
	return withConversationBindingContext(binding, params.conversation);
}
function buildApprovalMessage(request) {
	const lines = [
		`Plugin bind approval required`,
		`Plugin: ${request.pluginName ?? request.pluginId}`,
		`Channel: ${request.conversation.channel}`,
		`Account: ${request.conversation.accountId}`
	];
	if (request.summary?.trim()) lines.push(`Request: ${request.summary.trim()}`);
	else lines.push("Request: Bind this conversation so future plain messages route to the plugin.");
	lines.push("Choose whether to allow this plugin to bind the current conversation.");
	return lines.join("\n");
}
function resolvePluginBindingDisplayName(binding) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.pluginName) || binding.pluginId;
}
function buildDetachHintSuffix(detachHint) {
	const trimmed = detachHint?.trim();
	return trimmed ? ` To detach this conversation, use ${trimmed}.` : "";
}
function buildPluginBindingUnavailableText(binding) {
	return `The bound plugin ${resolvePluginBindingDisplayName(binding)} is not currently loaded. Routing this message to Operator instead. If this started after an update, run "openclaw doctor --fix"; otherwise reinstall or enable the plugin.${buildDetachHintSuffix(binding.detachHint)}`;
}
function buildPluginBindingDeclinedText(binding) {
	return `The bound plugin ${resolvePluginBindingDisplayName(binding)} did not handle this message. This conversation is still bound to that plugin.${buildDetachHintSuffix(binding.detachHint)}`;
}
function buildPluginBindingErrorText(binding) {
	return `The bound plugin ${resolvePluginBindingDisplayName(binding)} hit an error handling this message. This conversation is still bound to that plugin.${buildDetachHintSuffix(binding.detachHint)}`;
}
function hasShownPluginBindingFallbackNotice(bindingId) {
	const normalized = bindingId.trim();
	if (!normalized) return false;
	return getPluginBindingGlobalState().fallbackNoticeBindingIds.has(normalized);
}
function markPluginBindingFallbackNoticeShown(bindingId) {
	const normalized = bindingId.trim();
	if (!normalized) return;
	getPluginBindingGlobalState().fallbackNoticeBindingIds.add(normalized);
}
function buildPendingReply(request) {
	return {
		text: buildApprovalMessage(request),
		interactive: buildApprovalInteractiveReply(request.id)
	};
}
function encodeCustomIdValue(value) {
	return encodeURIComponent(value);
}
function buildPluginBindingApprovalCustomId(approvalId, decision) {
	const decisionCode = decision === "allow-once" ? "o" : decision === "allow-always" ? "a" : "d";
	return `${PLUGIN_BINDING_CUSTOM_ID_PREFIX}:${encodeCustomIdValue(approvalId)}:${decisionCode}`;
}
async function requestPluginConversationBinding(params) {
	const conversation = normalizeConversation(params.conversation);
	const state = resolvePluginConversationBindingState({ conversation });
	if (state.record && !state.binding) if (state.isLegacyForeignBinding) logPluginBindingLifecycleEvent({
		event: "migrating legacy record",
		pluginId: params.pluginId,
		pluginRoot: params.pluginRoot,
		channel: state.ref.channel,
		accountId: state.ref.accountId,
		conversationId: state.ref.conversationId
	});
	else return {
		status: "error",
		message: "This conversation is already bound by core routing and cannot be claimed by a plugin."
	};
	if (state.binding && state.binding.pluginRoot !== params.pluginRoot) return {
		status: "error",
		message: `This conversation is already bound by plugin "${state.binding.pluginName ?? state.binding.pluginId}".`
	};
	if (state.binding && state.binding.pluginRoot === params.pluginRoot) {
		const rebound = await bindConversationFromIdentity({
			identity: buildPluginBindingIdentity(params),
			conversation,
			summary: params.binding?.summary,
			detachHint: params.binding?.detachHint,
			data: params.binding?.data
		});
		logPluginBindingLifecycleEvent({
			event: "auto-refresh",
			pluginId: params.pluginId,
			pluginRoot: params.pluginRoot,
			channel: state.ref.channel,
			accountId: state.ref.accountId,
			conversationId: state.ref.conversationId
		});
		return {
			status: "bound",
			binding: rebound
		};
	}
	if (hasPersistentApproval({
		pluginRoot: params.pluginRoot,
		channel: state.ref.channel,
		accountId: state.ref.accountId
	})) {
		const bound = await bindConversationFromIdentity({
			identity: buildPluginBindingIdentity(params),
			conversation,
			summary: params.binding?.summary,
			detachHint: params.binding?.detachHint,
			data: params.binding?.data
		});
		logPluginBindingLifecycleEvent({
			event: "auto-approved",
			pluginId: params.pluginId,
			pluginRoot: params.pluginRoot,
			channel: state.ref.channel,
			accountId: state.ref.accountId,
			conversationId: state.ref.conversationId
		});
		return {
			status: "bound",
			binding: bound
		};
	}
	const request = {
		id: createApprovalRequestId(),
		pluginId: params.pluginId,
		pluginName: params.pluginName,
		pluginRoot: params.pluginRoot,
		conversation,
		requestedAt: Date.now(),
		requestedBySenderId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requestedBySenderId),
		summary: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.binding?.summary),
		detachHint: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.binding?.detachHint),
		data: normalizeBindingData(params.binding?.data)
	};
	pendingRequests.set(request.id, request);
	logPluginBindingLifecycleEvent({
		event: "requested",
		pluginId: params.pluginId,
		pluginRoot: params.pluginRoot,
		channel: state.ref.channel,
		accountId: state.ref.accountId,
		conversationId: state.ref.conversationId
	});
	return {
		status: "pending",
		approvalId: request.id,
		reply: buildPendingReply(request)
	};
}
async function getCurrentPluginConversationBinding(params) {
	return resolveOwnedPluginConversationBinding(params);
}
async function detachPluginConversationBinding(params) {
	const binding = resolveOwnedPluginConversationBinding(params);
	if (!binding) return { removed: false };
	await unbindConversationBindingRecord({
		bindingId: binding.bindingId,
		reason: "plugin-detach"
	});
	logPluginBindingLifecycleEvent({
		event: "detached",
		pluginId: binding.pluginId,
		pluginRoot: binding.pluginRoot,
		channel: binding.channel,
		accountId: binding.accountId,
		conversationId: binding.conversationId
	});
	return { removed: true };
}
//#endregion
Object.defineProperty(exports, "bindConversationNow", {
	enumerable: true,
	get: function() {
		return bindConversationNow;
	}
});
Object.defineProperty(exports, "buildPluginBindingDeclinedText", {
	enumerable: true,
	get: function() {
		return buildPluginBindingDeclinedText;
	}
});
Object.defineProperty(exports, "buildPluginBindingErrorText", {
	enumerable: true,
	get: function() {
		return buildPluginBindingErrorText;
	}
});
Object.defineProperty(exports, "buildPluginBindingIdentity", {
	enumerable: true,
	get: function() {
		return buildPluginBindingIdentity;
	}
});
Object.defineProperty(exports, "buildPluginBindingUnavailableText", {
	enumerable: true,
	get: function() {
		return buildPluginBindingUnavailableText;
	}
});
Object.defineProperty(exports, "createConversationBindingRecord", {
	enumerable: true,
	get: function() {
		return createConversationBindingRecord;
	}
});
Object.defineProperty(exports, "detachPluginConversationBinding", {
	enumerable: true,
	get: function() {
		return detachPluginConversationBinding;
	}
});
Object.defineProperty(exports, "getCurrentPluginConversationBinding", {
	enumerable: true,
	get: function() {
		return getCurrentPluginConversationBinding;
	}
});
Object.defineProperty(exports, "hasShownPluginBindingFallbackNotice", {
	enumerable: true,
	get: function() {
		return hasShownPluginBindingFallbackNotice;
	}
});
Object.defineProperty(exports, "isPluginOwnedSessionBindingRecord", {
	enumerable: true,
	get: function() {
		return isPluginOwnedSessionBindingRecord;
	}
});
Object.defineProperty(exports, "markPluginBindingFallbackNoticeShown", {
	enumerable: true,
	get: function() {
		return markPluginBindingFallbackNoticeShown;
	}
});
Object.defineProperty(exports, "requestPluginConversationBinding", {
	enumerable: true,
	get: function() {
		return requestPluginConversationBinding;
	}
});
Object.defineProperty(exports, "resolveConversationBindingRecord", {
	enumerable: true,
	get: function() {
		return resolveConversationBindingRecord;
	}
});
Object.defineProperty(exports, "toPluginConversationBinding", {
	enumerable: true,
	get: function() {
		return toPluginConversationBinding;
	}
});
Object.defineProperty(exports, "touchConversationBindingRecord", {
	enumerable: true,
	get: function() {
		return touchConversationBindingRecord;
	}
});
Object.defineProperty(exports, "unbindConversationBindingRecord", {
	enumerable: true,
	get: function() {
		return unbindConversationBindingRecord;
	}
});
