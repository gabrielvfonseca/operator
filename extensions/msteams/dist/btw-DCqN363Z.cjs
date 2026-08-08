const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_tool_images = require("./tool-images-BzMy_EyQ.cjs");
const require_selection = require("./selection-BpqUSi0C.cjs");
require("./diagnostic-Blh06VbF.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_transcript_tree = require("./transcript-tree-0YpOJFJQ.cjs");
const require_provider_request_config = require("./provider-request-config-BmGl8zwP.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_diagnostic_runtime = require("./diagnostic-runtime-DOIuSHus.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
const require_provider_secret_egress = require("./provider-secret-egress-NB6SfEEF.cjs");
const require_provider_runtime = require("./provider-runtime-Blezec6-.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_runs = require("./runs-BxiWZCUY.cjs");
const require_session_manager = require("./session-manager-Bhv4hvYF.cjs");
const require_session_transcript_repair = require("./session-transcript-repair-vqlcO05-.cjs");
const require_session_runtime_compat = require("./session-runtime-compat-B8Zu61mN.cjs");
const require_model_auth_runtime_shared = require("./model-auth-runtime-shared-UOjMKX1E.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
const require_model_overrides = require("./model-overrides-BvSxD3wH.cjs");
const require_models_config = require("./models-config-kAzoM1Dq.cjs");
const require_agent_model_discovery = require("./agent-model-discovery-k4IOdehL.cjs");
const require_provider_stream = require("./provider-stream-DRQnPAya.cjs");
const require_openai_transport_stream = require("./openai-transport-stream-BqxWn1Ig.cjs");
const require_thinking_runtime = require("./thinking-runtime-CrpgBgYy.cjs");
const require_timeout = require("./timeout-CEvCWJvo.cjs");
const require_prepare_auth = require("./prepare-auth-jI6h10E_.cjs");
const require_attempt_model_diagnostic_events = require("./attempt.model-diagnostic-events-D5B6PnSa.cjs");
const require_model = require("./model-Don1-Go6.cjs");
const require_external_cli_auth_selection = require("./external-cli-auth-selection-DSQaAFe5.cjs");
const require_session_override = require("./session-override-DHiJK0G6.cjs");
const require_execute_runtime = require("./execute.runtime-BypmgZJp.cjs");
const require_prepare_runtime = require("./prepare.runtime-DV0ZxBwr.cjs");
const require_runtime_plugin = require("./runtime-plugin-9QTLb6UB.cjs");
const require_credential_scoped_model = require("./credential-scoped-model-D1XdNupI.cjs");
const require_resolve_auth = require("./resolve-auth-CVIGZ8Sc.cjs");
let node_fs_promises = require("node:fs/promises");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_ai_internal_runtime = require("@gabrielvfonseca/ai/internal/runtime");
//#region src/agents/btw-transcript.ts
/**
* Reads prior session transcript context for `/btw` side-question handoffs.
*/
/** Resolves the persisted transcript file for a BTW session handoff. */
function resolveBtwSessionTranscriptPath(params) {
	try {
		const agentId = params.sessionKey?.split(":")[1];
		const pathOpts = require_paths.resolveSessionFilePathOptions({
			agentId,
			storePath: params.storePath
		});
		return require_paths.resolveSessionFilePath(params.sessionId, params.sessionEntry, pathOpts);
	} catch (error) {
		require_diagnostic_runtime.diagnosticLogger.debug(`resolveSessionTranscriptPath failed: sessionId=${params.sessionId} err=${String(error)}`);
		return;
	}
}
function readSessionEntryId(entry) {
	const id = entry.id;
	return typeof id === "string" && id.trim().length > 0 ? id : void 0;
}
function buildSessionBranchEntries(tree, leafId) {
	if (leafId === null) return [];
	if (!leafId) return;
	const branch = [];
	const seen = /* @__PURE__ */ new Set();
	let currentId = leafId;
	while (currentId) {
		if (seen.has(currentId)) return;
		seen.add(currentId);
		const node = tree.byId.get(currentId);
		if (!node) return;
		if (node.entry.type !== "leaf") branch.push(node.entry.parentId === node.parentId ? node.entry : {
			...node.entry,
			parentId: node.parentId
		});
		currentId = node.parentId ?? void 0;
	}
	return branch.toReversed();
}
function isTrailingUserMessage(entry) {
	return entry?.type === "message" && entry.message?.role === "user";
}
/**
* Reads prior messages for BTW continuation.
*
* When a transcript has fork links, this returns the selected snapshot branch
* instead of the full file so a resumed agent does not inherit sibling-branch
* messages.
*/
async function readBtwTranscriptMessages(params) {
	try {
		const marker = require_sqlite_marker.parseSqliteSessionFileMarker(params.sessionFile);
		const entries = marker ? await require_session_accessor.loadTranscriptEvents({
			agentId: marker.agentId,
			sessionId: marker.sessionId,
			...params.sessionKey ? { sessionKey: params.sessionKey } : {},
			storePath: marker.storePath
		}) : require_session_manager.parseSessionEntries(await (0, node_fs_promises.readFile)(params.sessionFile, "utf-8"));
		require_session_manager.migrateSessionEntries(entries);
		const sessionEntries = entries.filter((entry) => entry.type !== "session");
		const tree = require_transcript_tree.scanSessionTranscriptTree(sessionEntries);
		if (!tree.hasLeafUpdate) return require_session_manager.buildSessionContext(sessionEntries).messages;
		const hasSnapshotLeaf = params.snapshotLeafId !== void 0;
		let branchEntries = hasSnapshotLeaf ? buildSessionBranchEntries(tree, params.snapshotLeafId) : void 0;
		if (hasSnapshotLeaf && branchEntries === void 0) require_diagnostic_runtime.diagnosticLogger.debug(`btw snapshot leaf unavailable: sessionId=${params.sessionId} leaf=${params.snapshotLeafId}`);
		branchEntries ??= buildSessionBranchEntries(tree, tree.leafId);
		if (!hasSnapshotLeaf && isTrailingUserMessage(branchEntries?.at(-1))) {
			const trailingId = readSessionEntryId(branchEntries.at(-1));
			const parentId = trailingId ? tree.byId.get(trailingId)?.parentId : null;
			branchEntries = parentId ? buildSessionBranchEntries(tree, parentId) ?? [] : [];
		}
		const sessionContext = require_session_manager.buildSessionContext(branchEntries ?? sessionEntries);
		return Array.isArray(sessionContext.messages) ? sessionContext.messages : [];
	} catch {
		return [];
	}
}
//#endregion
//#region src/agents/btw.ts
/**
* Runs `/btw` side questions against the active conversation without resuming
* or continuing the main task.
*/
var btw_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ runBtwSideQuestion: () => runBtwSideQuestion });
function collectTextContent(content) {
	return content.filter((part) => part.type === "text").map((part) => part.text).join("");
}
function collectThinkingContent(content) {
	return content.filter((part) => part.type === "thinking").map((part) => part.thinking).join("");
}
function buildBtwSystemPrompt() {
	return [
		"You are answering an ephemeral /btw side question about the current conversation.",
		"Use the conversation only as background context.",
		"Answer only the side question in the last user message.",
		"Do not continue, resume, or complete any unfinished task from the conversation.",
		"Do not emit tool calls, pseudo-tool calls, shell commands, file writes, patches, or code unless the side question explicitly asks for them.",
		"Do not say you will continue the main task after answering.",
		"If the question can be answered briefly, answer briefly."
	].join("\n");
}
function resolveReturnedAuthProfileSource(sessionEntry, authProfileId) {
	if (!authProfileId?.trim()) return;
	if (sessionEntry?.authProfileOverride?.trim() !== authProfileId) return "auto";
	return sessionEntry.authProfileOverrideSource ?? (typeof sessionEntry.authProfileOverrideCompactionCount === "number" ? "auto" : "user");
}
function resolveBtwAuthProfileStore(params) {
	if (require_openai_routing.isOpenAIProvider(params.provider)) return {
		store: require_store.ensureAuthProfileStore(params.agentDir, {
			externalCliProviderIds: ["openai"],
			allowKeychainPrompt: false
		}),
		ignoreAutoPreferredProfile: false
	};
	const userLockedAuthProfileId = params.authProfileIdSource === "user" ? params.authProfileId : void 0;
	let externalCliAuthScope = require_external_cli_auth_selection.resolveExternalCliAuthOverlayScopeFromSelection({
		provider: params.provider,
		cfg: params.cfg,
		agentId: params.agentId,
		modelId: params.modelId,
		workspaceDir: params.workspaceDir,
		userLockedAuthProfileId
	});
	let store;
	if (externalCliAuthScope.providerIds) store = require_store.ensureAuthProfileStore(params.agentDir, {
		externalCliProviderIds: externalCliAuthScope.providerIds,
		allowKeychainPrompt: false
	});
	else {
		store = require_store.ensureAuthProfileStoreWithoutExternalProfiles(params.agentDir, { allowKeychainPrompt: false });
		externalCliAuthScope = require_external_cli_auth_selection.resolveExternalCliAuthOverlayScopeFromSelection({
			provider: params.provider,
			cfg: params.cfg,
			agentId: params.agentId,
			modelId: params.modelId,
			workspaceDir: params.workspaceDir,
			store,
			userLockedAuthProfileId
		});
		if (externalCliAuthScope.providerIds) store = require_store.ensureAuthProfileStore(params.agentDir, {
			externalCliProviderIds: externalCliAuthScope.providerIds,
			allowKeychainPrompt: false
		});
	}
	return {
		store,
		ignoreAutoPreferredProfile: externalCliAuthScope.ignoreAutoPreferredProfile
	};
}
function buildBtwQuestionPrompt(question, inFlightPrompt) {
	const lines = ["Answer this side question only.", "Ignore any unfinished task in the conversation while answering it."];
	const trimmedPrompt = inFlightPrompt?.trim();
	if (trimmedPrompt) lines.push("", "Current in-flight main task request for background context only:", "<in_flight_main_task>", trimmedPrompt, "</in_flight_main_task>", "Do not continue or complete that task while answering the side question.");
	lines.push("", "<btw_side_question>", question.trim(), "</btw_side_question>");
	return lines.join("\n");
}
function collectBtwMessageText(content) {
	if (typeof content === "string") return content.trim();
	if (!Array.isArray(content)) return "";
	return content.flatMap((part) => {
		if (part.type === "text") return part.text;
		if (part.type === "image") return "[Image content omitted from CLI side-question context.]";
		return [];
	}).join("\n").trim();
}
function buildBtwCliPrompt(params) {
	const lines = [
		"Use this sanitized conversation history as background context only.",
		"Do not continue, resume, or complete any unfinished task from the conversation.",
		"",
		"<conversation_history>"
	];
	for (const message of params.messages) {
		const text = collectBtwMessageText(message.content);
		if (!text) continue;
		lines.push(`${message.role === "assistant" ? "Assistant" : "User"}:`, text, "");
	}
	lines.push("</conversation_history>", "");
	lines.push(buildBtwQuestionPrompt(params.question, params.inFlightPrompt));
	return lines.join("\n");
}
function normalizeBtwContentBlocks(content) {
	if (Array.isArray(content)) return content;
	if (content && typeof content === "object") return [content];
}
function isBtwTextBlock(block) {
	if (!block || typeof block !== "object") return false;
	const record = block;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(record.type) === "text" && typeof record.text === "string";
}
function isBtwImageBlock(block) {
	if (!block || typeof block !== "object") return false;
	const record = block;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(record.type) === "image" && typeof record.data === "string" && typeof record.mimeType === "string";
}
async function sanitizeBtwUserMessage(params) {
	if (typeof params.message.content === "string") return params.message;
	const blocks = normalizeBtwContentBlocks(params.message.content);
	if (!blocks) return;
	const content = [];
	for (const block of blocks) {
		if (isBtwTextBlock(block)) {
			content.push({
				type: "text",
				text: block.text
			});
			continue;
		}
		if (!isBtwImageBlock(block)) continue;
		const { images } = await require_tool_images.sanitizeImageBlocks([block], "btw:context", params.imageLimits);
		const image = images[0];
		if (image) content.push(image);
	}
	if (content.length === 0) return;
	return {
		...params.message,
		content
	};
}
function sanitizeBtwAssistantMessage(message) {
	const rawContent = message.content;
	if (typeof rawContent === "string") {
		const trimmed = rawContent.trim();
		return trimmed.length > 0 ? {
			...message,
			content: [{
				type: "text",
				text: trimmed
			}]
		} : void 0;
	}
	const blocks = normalizeBtwContentBlocks(rawContent);
	if (!blocks) return;
	const content = blocks.flatMap((block) => isBtwTextBlock(block) ? [{
		type: "text",
		text: block.text
	}] : []);
	if (content.length === 0) return;
	return {
		...message,
		content
	};
}
async function toSimpleContextMessages(params) {
	const contextMessages = [];
	for (const message of params.messages) {
		if (!message || typeof message !== "object") continue;
		const role = message.role;
		if (role === "user") {
			const sanitizedMessage = await sanitizeBtwUserMessage({
				message,
				imageLimits: params.imageLimits
			});
			if (sanitizedMessage) contextMessages.push(sanitizedMessage);
			continue;
		}
		if (role !== "assistant") continue;
		const sanitizedMessage = sanitizeBtwAssistantMessage(message);
		if (sanitizedMessage) contextMessages.push(sanitizedMessage);
	}
	return require_session_transcript_repair.stripToolResultDetails(contextMessages);
}
async function materializeBtwRuntimeModel(params) {
	return await require_credential_scoped_model.materializePreparedRuntimeModel({
		plan: params.plan,
		provider: params.provider,
		modelId: params.modelId,
		config: params.cfg,
		model: params.model,
		...params.forceResolve !== void 0 ? { forceResolve: params.forceResolve } : {},
		resolveModel: ({ config, authProfileId, authProfileMode }) => require_model.resolveModelAsync(params.provider, params.modelId, params.agentDir, config, {
			authStorage: params.authStorage,
			modelRegistry: params.modelRegistry,
			skipAgentDiscovery: true,
			allowBundledStaticCatalogFallback: true,
			preferBundledStaticCatalogTransport: true,
			workspaceDir: params.workspaceDir,
			authProfileId,
			authProfileMode
		})
	}) ?? params.model;
}
async function resolveBtwPreparedRuntimeAuth(params) {
	return require_resolve_auth.resolvePreparedRuntimeAuthAttempts({
		attempts: params.preparation.attempts,
		store: params.authProfileStore,
		modelId: params.modelId,
		model: params.model,
		materializeModel: ({ plan, model, forceResolve }) => materializeBtwRuntimeModel({
			...params,
			plan,
			model,
			forceResolve
		}),
		resolveAuth: async ({ attempt, model }) => await require_resolve_auth.resolvePreparedRuntimeModelAuth({
			plan: attempt.plan,
			model,
			cfg: params.cfg,
			store: params.authProfileStore,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			...attempt.allowAuthProfileFallback !== void 0 ? { allowAuthProfileFallback: attempt.allowAuthProfileFallback } : {},
			secretSentinels: true
		}),
		errorMessage: "BTW prepared auth attempts could not be resolved."
	});
}
async function resolveRuntimeModel(params) {
	const modelsOptions = params.workspaceDir ? { workspaceDir: params.workspaceDir } : void 0;
	await require_models_config.ensureOperatorModelsJson(params.cfg, params.agentDir, modelsOptions);
	const authStorage = require_agent_model_discovery.discoverAuthStorage(params.agentDir);
	const modelRegistry = require_agent_model_discovery.discoverModels(authStorage, params.agentDir, {
		config: params.cfg,
		...modelsOptions
	});
	let model = require_model.resolveModelWithRegistry({
		provider: params.provider,
		modelId: params.model,
		modelRegistry,
		cfg: params.cfg
	});
	if (!model) throw new Error(`Unknown model: ${params.provider}/${params.model}`);
	const runtimeProvider = model.provider;
	const runtimeModelId = model.id;
	const acceptedProviderIds = require_openai_routing.listOpenAIAuthProfileProvidersForAgentRuntime({
		provider: runtimeProvider,
		harnessRuntime: params.harnessId,
		agentHarnessId: params.harnessId,
		config: params.cfg
	});
	const authProfileId = await require_session_override.resolveSessionAuthProfileOverride({
		cfg: params.cfg,
		provider: runtimeProvider,
		acceptedProviderIds,
		agentDir: params.agentDir,
		sessionEntry: params.sessionEntry,
		sessionStore: params.sessionStore,
		sessionKey: params.sessionKey,
		storePath: params.storePath,
		isNewSession: params.isNewSession
	});
	const authProfileIdSource = resolveReturnedAuthProfileSource(params.sessionEntry, authProfileId);
	const authProfileStoreSelection = resolveBtwAuthProfileStore({
		cfg: params.cfg,
		provider: runtimeProvider,
		modelId: runtimeModelId,
		agentId: params.agentId,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		authProfileId,
		authProfileIdSource
	});
	const effectiveAuthProfileId = authProfileStoreSelection.ignoreAutoPreferredProfile && authProfileIdSource !== "user" ? void 0 : authProfileId;
	const runtimeAuthPreparation = require_prepare_auth.prepareAgentRuntimeAuth({
		provider: runtimeProvider,
		modelId: runtimeModelId,
		modelApi: model.api,
		modelBaseUrl: model.baseUrl,
		config: params.cfg,
		env: process.env,
		workspaceDir: params.workspaceDir,
		authProfileStore: authProfileStoreSelection.store,
		sessionAuthProfileId: effectiveAuthProfileId,
		sessionAuthProfileSource: authProfileIdSource,
		harnessId: params.harnessId,
		harnessRuntime: params.harnessId,
		harnessAuthBootstrap: params.harnessAuthBootstrap
	});
	model = await materializeBtwRuntimeModel({
		cfg: params.cfg,
		provider: runtimeProvider,
		modelId: runtimeModelId,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		authStorage,
		modelRegistry,
		plan: runtimeAuthPreparation.plan,
		model
	});
	return {
		model,
		authProfileId: runtimeAuthPreparation.plan.forwardedAuthProfileId,
		authProfileIdSource: runtimeAuthPreparation.plan.forwardedAuthProfileSource,
		authProfileStore: authProfileStoreSelection.store,
		runtimeAuthPreparation,
		authStorage,
		modelRegistry
	};
}
async function runCliBtwSideQuestion(params) {
	const timeoutMs = require_timeout.resolveAgentTimeoutMs({
		cfg: params.cfg,
		overrideSeconds: params.opts?.timeoutOverrideSeconds
	});
	const prepared = await require_prepare_runtime.prepareCliRunContext({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		sessionEntry: params.sessionEntry,
		agentId: params.sessionAgentId,
		trigger: "user",
		sessionFile: params.sessionFile,
		workspaceDir: params.workspaceDir,
		config: params.cfg,
		prompt: buildBtwCliPrompt({
			messages: params.messages,
			question: params.question,
			inFlightPrompt: params.inFlightPrompt
		}),
		extraSystemPrompt: buildBtwSystemPrompt(),
		executionMode: "side-question",
		provider: params.cliProvider,
		model: params.model,
		thinkLevel: params.resolvedThinkLevel,
		disableTools: true,
		timeoutMs,
		runTimeoutOverrideMs: timeoutMs,
		runId: params.opts?.runId ?? `btw-${(0, node_crypto.randomUUID)()}`,
		authProfileId: params.authProfileId,
		abortSignal: params.opts?.abortSignal,
		messageChannel: params.messageChannel,
		messageProvider: params.messageProvider,
		currentChannelId: params.currentChannelId
	});
	try {
		const text = (await require_execute_runtime.executePreparedCliRun(prepared)).text.trim();
		if (!text) throw new Error(`/btw side question via ${params.cliProvider} produced no answer.`);
		return { text };
	} finally {
		await prepared.preparedBackend.cleanup?.();
	}
}
/** Answers a side question using sanitized session context and no tool execution. */
async function runBtwSideQuestion(params) {
	const sessionId = params.sessionEntry.sessionId?.trim();
	if (!sessionId) throw new Error("No active session context.");
	const sessionFile = resolveBtwSessionTranscriptPath({
		sessionId,
		sessionEntry: params.sessionEntry,
		sessionKey: params.sessionKey,
		storePath: params.storePath
	});
	if (!sessionFile) throw new Error("No active session transcript.");
	const sessionAgentId = require_agent_scope.resolveSessionAgentId({
		sessionKey: params.sessionKey,
		config: params.cfg
	});
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, sessionAgentId);
	const preparedHarnesses = /* @__PURE__ */ new Map();
	const prepareHarness = async (provider, modelId, modelProvider) => {
		const agentHarnessId = require_model_overrides.isModelSelectionLocked(params.sessionEntry) ? params.sessionEntry.agentHarnessId : void 0;
		const agentHarnessRuntimeOverride = agentHarnessId ? void 0 : require_session_runtime_compat.resolveSessionRuntimeOverrideForProvider({
			provider,
			entry: params.sessionEntry,
			cfg: params.cfg
		});
		const key = [
			`${provider}/${modelId}/${agentHarnessId ?? agentHarnessRuntimeOverride ?? "configured"}`,
			modelProvider?.api ?? "",
			modelProvider?.baseUrl ?? "",
			modelProvider?.requestTransportOverrides ?? "",
			modelProvider?.runtimePolicy?.compatibleIds.join(",") ?? "",
			modelProvider?.preparedAuth?.source ?? "",
			modelProvider?.preparedAuth?.mode ?? "",
			modelProvider?.preparedAuth?.requirement ?? ""
		].join("\0");
		const cached = preparedHarnesses.get(key);
		if (cached) return cached;
		await require_runtime_plugin.ensureSelectedAgentHarnessPlugin({
			provider,
			modelId,
			config: params.cfg,
			agentId: sessionAgentId,
			sessionKey: params.sessionKey,
			workspaceDir,
			...agentHarnessId ? { agentHarnessId } : {},
			...agentHarnessRuntimeOverride ? { agentHarnessRuntimeOverride } : {}
		});
		const selectionParams = {
			provider,
			modelId,
			config: params.cfg,
			agentId: sessionAgentId,
			sessionKey: params.sessionKey,
			...agentHarnessId ? { agentHarnessId } : {},
			...agentHarnessRuntimeOverride ? { agentHarnessRuntimeOverride } : {}
		};
		const harness = modelProvider ? require_selection.selectAgentHarnessForPreparedModelProviders({
			...selectionParams,
			modelProviders: [modelProvider]
		}) : require_selection.selectAgentHarness(selectionParams);
		preparedHarnesses.set(key, harness);
		return harness;
	};
	const harness = await prepareHarness(params.provider, params.model);
	let runtimeSelection;
	const resolveRuntimeSelection = async () => {
		if (!runtimeSelection) runtimeSelection = await resolveRuntimeModel({
			cfg: params.cfg,
			provider: params.provider,
			model: params.model,
			agentId: sessionAgentId,
			agentDir: params.agentDir,
			workspaceDir,
			sessionEntry: params.sessionEntry,
			sessionStore: params.sessionStore,
			sessionKey: params.sessionKey,
			storePath: params.storePath,
			isNewSession: params.isNewSession,
			harnessId: harness.id,
			harnessAuthBootstrap: harness.authBootstrap
		});
		return runtimeSelection;
	};
	let preparedOperatorFallback;
	const runHarnessSideQuestion = async (selectedHarness, runtime, routeFinalized = false) => {
		const toolsAllow = require_selection.resolvePluginHarnessPolicyToolsAllow({
			config: params.cfg,
			sessionKey: params.sessionKey,
			sandboxSessionKey: params.sandboxSessionKey,
			agentId: sessionAgentId,
			provider: runtime.model.provider,
			modelId: runtime.model.id,
			messageProvider: params.messageProvider,
			messageChannel: params.messageChannel,
			spawnedBy: params.spawnedBy,
			groupId: params.groupId,
			groupChannel: params.groupChannel,
			groupSpace: params.groupSpace,
			agentAccountId: params.agentAccountId,
			senderId: params.senderId,
			senderName: params.senderName,
			senderUsername: params.senderUsername,
			senderE164: params.senderE164
		});
		const authProfileStoreSelection = selectedHarness.id === harness.id ? void 0 : resolveBtwAuthProfileStore({
			cfg: params.cfg,
			provider: runtime.model.provider,
			modelId: runtime.model.id,
			agentId: sessionAgentId,
			agentDir: params.agentDir,
			workspaceDir,
			authProfileId: runtime.authProfileId,
			authProfileIdSource: runtime.authProfileIdSource
		});
		const runtimeAuthPreparation = authProfileStoreSelection ? require_prepare_auth.prepareAgentRuntimeAuth({
			provider: runtime.model.provider,
			modelId: runtime.model.id,
			modelApi: runtime.model.api,
			modelBaseUrl: runtime.model.baseUrl,
			config: params.cfg,
			env: process.env,
			workspaceDir,
			authProfileStore: authProfileStoreSelection.store,
			sessionAuthProfileId: authProfileStoreSelection.ignoreAutoPreferredProfile && runtime.authProfileIdSource !== "user" ? void 0 : runtime.authProfileId,
			sessionAuthProfileSource: runtime.authProfileIdSource,
			harnessId: selectedHarness.id,
			harnessRuntime: selectedHarness.id,
			harnessAuthBootstrap: selectedHarness.authBootstrap
		}) : runtime.runtimeAuthPreparation;
		const selectedAuthProfileStore = authProfileStoreSelection?.store ?? runtime.authProfileStore;
		const implicitHarnessAuthPlan = selectedHarness.authBootstrap === "harness" && runtimeAuthPreparation.attempts.length === 1 && runtimeAuthPreparation.attempts[0]?.kind === "implicit" && runtimeAuthPreparation.attempts[0].plan.harnessAuthProvider ? runtimeAuthPreparation.attempts[0].plan : void 0;
		const resolvedAttempt = implicitHarnessAuthPlan ? {
			plan: implicitHarnessAuthPlan,
			model: runtime.model
		} : await resolveBtwPreparedRuntimeAuth({
			preparation: runtimeAuthPreparation,
			model: runtime.model,
			cfg: params.cfg,
			provider: runtime.model.provider,
			modelId: runtime.model.id,
			agentDir: params.agentDir,
			workspaceDir,
			authStorage: runtime.authStorage,
			modelRegistry: runtime.modelRegistry,
			authProfileStore: selectedAuthProfileStore
		});
		const runtimeAuthPlan = resolvedAttempt.plan;
		const runtimeModel = resolvedAttempt.model;
		const finalizedHarness = await prepareHarness(runtimeModel.provider, runtimeModel.id, {
			api: runtimeModel.api,
			baseUrl: runtimeModel.baseUrl,
			...require_thinking_runtime.resolveAgentHarnessPreparedRouteSupport(runtimeAuthPlan),
			preparedAuth: require_thinking_runtime.resolveAgentHarnessPreparedAuthSupport({ plan: runtimeAuthPlan })
		});
		if (finalizedHarness.id !== selectedHarness.id) {
			if (routeFinalized) throw new Error("Agent harness selection changed after route materialization.");
			return runHarnessSideQuestion(finalizedHarness, {
				...runtime,
				model: runtimeModel,
				runtimeAuthPreparation,
				authProfileStore: selectedAuthProfileStore
			}, true);
		}
		if (!selectedHarness.runSideQuestion) {
			if (selectedHarness.id !== "@gabrielvfonseca/operator" || !("auth" in resolvedAttempt)) throw new Error(`Selected agent harness "${selectedHarness.id}" does not support /btw side questions.`);
			return {
				kind: "@gabrielvfonseca/operator",
				harness: selectedHarness,
				runtime: {
					...runtime,
					model: runtimeModel,
					authProfileId: runtimeAuthPlan.forwardedAuthProfileId,
					authProfileIdSource: runtimeAuthPlan.forwardedAuthProfileSource,
					authProfileStore: selectedAuthProfileStore,
					runtimeAuthPreparation
				},
				resolvedAttempt
			};
		}
		const resolvedApiKey = runtimeAuthPlan.modelRoute?.authRequirement === "api-key" && "auth" in resolvedAttempt ? resolvedAttempt.auth.apiKey?.trim() : void 0;
		return {
			kind: "handled",
			payload: { text: (await selectedHarness.runSideQuestion({
				...params,
				provider: runtimeModel.provider,
				model: runtimeModel.id,
				runtimeModel,
				preparedRuntimeAuth: {
					plan: runtimeAuthPlan,
					authProfileStore: require_resolve_auth.scopeAuthProfileStoreToPreparedPlan(selectedAuthProfileStore, runtimeAuthPlan),
					authStorage: runtime.authStorage,
					modelRegistry: runtime.modelRegistry,
					...resolvedApiKey ? { resolvedApiKey: require_provider_secret_egress.unwrapSecretSentinelsForProviderEgress(resolvedApiKey, "BTW harness handoff") } : {}
				},
				sessionId,
				sessionFile,
				agentId: sessionAgentId,
				workspaceDir,
				...toolsAllow ? { toolsAllow } : {},
				authProfileId: runtimeAuthPlan.modelRoute?.authRequirement === "api-key" ? void 0 : runtimeAuthPlan.forwardedAuthProfileId,
				authProfileIdSource: runtimeAuthPlan.modelRoute?.authRequirement === "api-key" ? void 0 : runtimeAuthPlan.forwardedAuthProfileSource
			})).text }
		};
	};
	if (harness.runSideQuestion) {
		const dispatch = await runHarnessSideQuestion(harness, await resolveRuntimeSelection());
		if (dispatch.kind === "handled") return dispatch.payload;
		preparedOperatorFallback = dispatch;
	}
	if (harness.id === "codex" && !harness.runSideQuestion) throw new Error(`Selected agent harness "${harness.id}" does not support /btw side questions.`);
	const activeRunSnapshot = require_runs.getActiveEmbeddedRunSnapshot(sessionId);
	const imageLimits = require_tool_images.resolveImageSanitizationLimits(params.cfg);
	let messages = [];
	let inFlightPrompt;
	if (Array.isArray(activeRunSnapshot?.messages) && activeRunSnapshot.messages.length > 0) {
		messages = await toSimpleContextMessages({
			messages: activeRunSnapshot.messages,
			imageLimits
		});
		inFlightPrompt = activeRunSnapshot.inFlightPrompt;
	} else if (activeRunSnapshot) inFlightPrompt = activeRunSnapshot.inFlightPrompt;
	if (messages.length === 0) messages = await toSimpleContextMessages({
		messages: await readBtwTranscriptMessages({
			sessionFile,
			sessionId,
			sessionKey: params.sessionKey,
			snapshotLeafId: activeRunSnapshot?.transcriptLeafId
		}),
		imageLimits
	});
	if (messages.length === 0 && !inFlightPrompt?.trim()) throw new Error("No active session context.");
	const fallbackRuntime = require_selection.resolveAvailableAgentHarnessPolicy({
		provider: params.provider,
		modelId: params.model,
		config: params.cfg,
		agentId: sessionAgentId,
		sessionKey: params.sessionKey
	}).runtime.trim();
	const sessionAuthProfileId = params.sessionEntry.authProfileOverride?.trim() || void 0;
	const sessionAuthProfileSource = resolveReturnedAuthProfileSource(params.sessionEntry, sessionAuthProfileId);
	const cliProviderFromSessionAuth = sessionAuthProfileId ? require_model_runtime_aliases.resolveCliRuntimeExecutionProvider({
		provider: params.provider,
		cfg: params.cfg,
		agentId: sessionAgentId,
		modelId: params.model,
		authProfileId: sessionAuthProfileId
	})?.trim() : void 0;
	const cliProviderFromAuthOrder = !sessionAuthProfileId || sessionAuthProfileSource === "auto" ? require_model_runtime_aliases.resolveCliRuntimeExecutionProvider({
		provider: params.provider,
		cfg: params.cfg,
		agentId: sessionAgentId,
		modelId: params.model
	})?.trim() : void 0;
	const cliProvider = cliProviderFromSessionAuth ?? cliProviderFromAuthOrder ?? (require_model_runtime_aliases.isCliRuntimeAliasForProvider({
		runtime: fallbackRuntime,
		provider: params.provider,
		cfg: params.cfg
	}) ? fallbackRuntime : void 0);
	if (cliProvider) return runCliBtwSideQuestion({
		cfg: params.cfg,
		model: params.model,
		question: params.question,
		sessionId,
		sessionFile,
		sessionEntry: params.sessionEntry,
		sessionKey: params.sessionKey,
		sessionAgentId,
		workspaceDir,
		cliProvider,
		authProfileId: cliProviderFromSessionAuth ? sessionAuthProfileId : void 0,
		resolvedThinkLevel: params.resolvedThinkLevel,
		messages,
		inFlightPrompt,
		opts: params.opts,
		messageChannel: params.messageChannel,
		messageProvider: params.messageProvider,
		currentChannelId: params.currentChannelId
	});
	const initialOperatorFallback = preparedOperatorFallback;
	const runtimeSelectionForHarness = initialOperatorFallback?.runtime ?? await resolveRuntimeSelection();
	const runtimeHarness = initialOperatorFallback?.harness ?? await prepareHarness(runtimeSelectionForHarness.model.provider, runtimeSelectionForHarness.model.id);
	if (runtimeHarness.runSideQuestion) {
		const dispatch = await runHarnessSideQuestion(runtimeHarness, runtimeSelectionForHarness);
		if (dispatch.kind === "handled") return dispatch.payload;
		preparedOperatorFallback = dispatch;
	}
	if (runtimeHarness.id === "codex" && !runtimeHarness.runSideQuestion) throw new Error(`Selected agent harness "${runtimeHarness.id}" does not support /btw side questions.`);
	const finalizedOperatorFallback = preparedOperatorFallback;
	const { authStorage, model, modelRegistry, authProfileStore, runtimeAuthPreparation } = finalizedOperatorFallback?.runtime ?? runtimeSelectionForHarness;
	const resolvedAttempt = finalizedOperatorFallback?.resolvedAttempt ?? await resolveBtwPreparedRuntimeAuth({
		preparation: runtimeAuthPreparation,
		model,
		cfg: params.cfg,
		provider: model.provider,
		modelId: model.id,
		agentDir: params.agentDir,
		workspaceDir,
		authStorage,
		modelRegistry,
		authProfileStore
	});
	const apiKeyInfo = resolvedAttempt.auth;
	const resolvedAuthProfileId = resolvedAttempt.plan.forwardedAuthProfileId;
	let runtimeModel = resolvedAttempt.model;
	let apiKey = apiKeyInfo.mode === "aws-sdk" && !apiKeyInfo.apiKey ? void 0 : require_model_auth_runtime_shared.requireApiKey(apiKeyInfo, runtimeModel.provider);
	if (apiKey) {
		const preparedAuth = require_provider_secret_egress.protectPreparedProviderRuntimeAuth({
			provider: runtimeModel.provider,
			preparedAuth: await require_provider_runtime.prepareProviderRuntimeAuth({
				provider: runtimeModel.provider,
				config: params.cfg,
				workspaceDir,
				env: process.env,
				context: {
					config: params.cfg,
					agentDir: params.agentDir,
					workspaceDir,
					env: process.env,
					provider: runtimeModel.provider,
					modelId: runtimeModel.id,
					model: runtimeModel,
					apiKey: require_provider_secret_egress.unwrapSecretSentinelsForProviderEgress(apiKey, "provider runtime auth exchange"),
					authMode: apiKeyInfo.mode,
					profileId: resolvedAuthProfileId
				}
			})
		});
		runtimeModel = require_provider_request_config.applyPreparedRuntimeAuthToModel(runtimeModel, preparedAuth);
		if (preparedAuth?.apiKey) apiKey = preparedAuth.apiKey;
	}
	runtimeModel = require_model_auth.applySecretRefHeaderSentinels(runtimeModel, params.cfg);
	const streamFn = require_attempt_model_diagnostic_events.resolveEmbeddedAgentStreamFn({
		currentStreamFn: _gabrielvfonseca_ai_internal_runtime.streamSimple,
		providerStreamFn: require_provider_stream.registerProviderStreamForModel({
			model: runtimeModel,
			cfg: params.cfg,
			agentDir: params.agentDir,
			workspaceDir,
			env: process.env
		}),
		sessionId,
		signal: params.opts?.abortSignal,
		model: runtimeModel,
		resolvedApiKey: apiKey,
		authProfileId: resolvedAuthProfileId
	});
	const chunker = params.opts?.onBlockReply && params.blockReplyChunking ? new require_selection.EmbeddedBlockChunker(params.blockReplyChunking) : void 0;
	let emittedBlocks = 0;
	let blockEmitChain = Promise.resolve();
	let answerText = "";
	let reasoningText = "";
	let assistantStarted = false;
	let sawTextEvent = false;
	const emitBlockChunk = async (text) => {
		if (!text.trim() || !params.opts?.onBlockReply) return;
		emittedBlocks += 1;
		blockEmitChain = blockEmitChain.then(async () => {
			await params.opts?.onBlockReply?.({
				text,
				btw: { question: params.question }
			});
		});
		await blockEmitChain;
	};
	const stream = await require_openai_transport_stream.streamWithPayloadPatch(streamFn, runtimeModel, {
		systemPrompt: buildBtwSystemPrompt(),
		messages: [...messages, {
			role: "user",
			content: [{
				type: "text",
				text: buildBtwQuestionPrompt(params.question, inFlightPrompt)
			}],
			timestamp: Date.now()
		}]
	}, {
		apiKey,
		reasoning: void 0,
		signal: params.opts?.abortSignal
	}, (payloadObj) => {
		if (Array.isArray(payloadObj.tools) && payloadObj.tools.length === 0) delete payloadObj.tools;
	});
	let finalEvent;
	for await (const event of stream) {
		finalEvent = event.type === "done" || event.type === "error" ? event : finalEvent;
		if (!assistantStarted && (event.type === "text_start" || event.type === "start")) {
			assistantStarted = true;
			await params.opts?.onAssistantMessageStart?.();
		}
		if (event.type === "text_delta") {
			sawTextEvent = true;
			answerText += event.delta;
			chunker?.append(event.delta);
			if (chunker && params.resolvedBlockStreamingBreak === "text_end") chunker.drain({
				force: false,
				emit: (chunk) => void emitBlockChunk(chunk)
			});
			continue;
		}
		if (event.type === "text_end" && chunker && params.resolvedBlockStreamingBreak === "text_end") {
			chunker.drain({
				force: true,
				emit: (chunk) => void emitBlockChunk(chunk)
			});
			continue;
		}
		if (event.type === "thinking_delta") {
			reasoningText += event.delta;
			if (params.resolvedReasoningLevel !== "off") await params.opts?.onReasoningStream?.({
				text: reasoningText,
				isReasoning: true
			});
			continue;
		}
		if (event.type === "thinking_end" && params.resolvedReasoningLevel !== "off") await params.opts?.onReasoningEnd?.();
	}
	if (chunker && params.resolvedBlockStreamingBreak !== "text_end" && chunker.hasBuffered()) chunker.drain({
		force: true,
		emit: (chunk) => void emitBlockChunk(chunk)
	});
	await blockEmitChain;
	if (finalEvent?.type === "error") {
		const message = collectTextContent(finalEvent.error.content);
		throw new Error(message || finalEvent.error.errorMessage || "BTW failed.");
	}
	const finalMessage = finalEvent?.type === "done" ? finalEvent.message : void 0;
	if (finalMessage) {
		if (!sawTextEvent) answerText = collectTextContent(finalMessage.content);
		if (!reasoningText) collectThinkingContent(finalMessage.content);
	}
	const answer = answerText.trim();
	if (!answer) throw new Error("No BTW response generated.");
	if (emittedBlocks > 0) return;
	return { text: answer };
}
//#endregion
Object.defineProperty(exports, "btw_exports", {
	enumerable: true,
	get: function() {
		return btw_exports;
	}
});
Object.defineProperty(exports, "runBtwSideQuestion", {
	enumerable: true,
	get: function() {
		return runBtwSideQuestion;
	}
});
