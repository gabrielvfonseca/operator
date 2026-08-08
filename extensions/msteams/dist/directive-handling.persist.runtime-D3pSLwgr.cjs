require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
const require_cleanup = require("./cleanup-Do0eFW35.cjs");
require("./queue-BObg9z8c.cjs");
const require_model_overrides = require("./model-overrides-BvSxD3wH.cjs");
const require_session_patch_hooks = require("./session-patch-hooks-B0T7VvLF.cjs");
const require_thinking_runtime = require("./thinking-runtime-CrpgBgYy.cjs");
const require_session_snapshot_merge = require("./session-snapshot-merge-BloJoO_g.cjs");
const require_session_entry_persistence = require("./session-entry-persistence-CBNb94X1.cjs");
const require_level_overrides = require("./level-overrides-CI02u-AL.cjs");
const require_directive_handling_shared = require("./directive-handling.shared-DPV7dkCW.cjs");
const require_directive_handling_model_selection = require("./directive-handling.model-selection-Ceen69Wf.cjs");
//#region src/auto-reply/reply/directive-handling.persist.ts
async function persistInlineDirectives(params) {
	const { directives, cfg, sessionEntry, sessionStore, sessionKey, storePath, elevatedEnabled, elevatedAllowed, defaultProvider, defaultModel, aliasIndex, allowedModelKeys, initialModelLabel, formatModelSwitchEvent, agentCfg } = params;
	let { provider, model } = params;
	let thinkingRemap;
	let sessionChangesApplied = true;
	const allowInternalExecPersistence = require_directive_handling_shared.canPersistSessionDirectiveDefaults({
		messageProvider: params.messageProvider,
		surface: params.surface,
		gatewayClientScopes: params.gatewayClientScopes,
		commandAuthorized: params.commandAuthorized,
		senderIsOwner: params.senderIsOwner
	});
	const allowInternalVerbosePersistence = require_directive_handling_shared.canPersistSessionDirectiveDefaults({
		messageProvider: params.messageProvider,
		surface: params.surface,
		gatewayClientScopes: params.gatewayClientScopes,
		commandAuthorized: params.commandAuthorized,
		senderIsOwner: params.senderIsOwner
	});
	const touchedSessionFields = require_directive_handling_shared.resolveDirectiveTouchedSessionFields({
		directives,
		allowInternalExecPersistence,
		allowInternalVerbosePersistence
	});
	const thinkingCatalog = params.thinkingCatalog && params.thinkingCatalog.length > 0 ? params.thinkingCatalog : void 0;
	const delegatedTraceAllowed = (params.gatewayClientScopes ?? []).includes("operator.admin");
	const activeAgentId = sessionKey ? require_agent_scope.resolveSessionAgentId({
		sessionKey,
		config: cfg
	}) : require_agent_scope_config.resolveDefaultAgentId(cfg);
	const agentDir = require_agent_scope_config.resolveAgentDir(cfg, activeAgentId) ?? params.agentDir;
	const modelDirective = directives.hasModelDirective && params.effectiveModelDirective ? params.effectiveModelDirective : void 0;
	const modelResolution = modelDirective ? require_directive_handling_model_selection.resolveModelSelectionFromDirective({
		directives: {
			...directives,
			hasModelDirective: true,
			rawModelDirective: modelDirective
		},
		cfg,
		agentDir,
		defaultProvider,
		defaultModel,
		aliasIndex,
		allowedModelKeys,
		allowedModelCatalog: params.modelCatalog ?? [],
		provider
	}) : void 0;
	const modelRuntimeResolution = modelResolution?.modelSelection ? require_directive_handling_shared.resolveModelRuntimeDirective({
		rawRuntime: directives.rawModelRuntime,
		provider: modelResolution.modelSelection.provider,
		cfg,
		sessionEntry
	}) : { kind: "unchanged" };
	let thinkingErrorText;
	if (directives.hasThinkDirective && directives.thinkLevel) {
		const resolvedProvider = modelResolution?.modelSelection?.provider ?? provider;
		const resolvedModel = modelResolution?.modelSelection?.model ?? model;
		const prospectiveSessionEntry = { ...sessionEntry };
		require_directive_handling_shared.applyModelRuntimeDirective(prospectiveSessionEntry, modelRuntimeResolution);
		const prospectiveThinkingRuntime = require_thinking_runtime.resolveEffectiveAgentRuntime({
			cfg,
			provider: resolvedProvider,
			modelId: resolvedModel,
			agentId: activeAgentId,
			sessionKey,
			sessionEntry: prospectiveSessionEntry
		});
		if (!require_thinking.isThinkingLevelSupported({
			provider: resolvedProvider,
			model: resolvedModel,
			level: directives.thinkLevel,
			catalog: thinkingCatalog,
			agentRuntime: prospectiveThinkingRuntime
		})) thinkingErrorText = `Thinking level "${directives.thinkLevel}" is not supported for ${resolvedProvider}/${resolvedModel}. Use one of: ${require_thinking.formatThinkingLevels(resolvedProvider, resolvedModel, ", ", thinkingCatalog, prospectiveThinkingRuntime)}.`;
	}
	const errorText = modelResolution?.errorText ?? (modelRuntimeResolution.kind === "invalid" ? modelRuntimeResolution.errorText : void 0) ?? thinkingErrorText;
	let modelRuntimeApplied = false;
	if (!errorText && sessionEntry && sessionStore && sessionKey) {
		const initialSessionEntry = { ...sessionEntry };
		let appliedSessionEntry = sessionEntry;
		const prevElevatedLevel = sessionEntry.elevatedLevel ?? agentCfg?.elevatedDefault ?? (elevatedAllowed ? "on" : "off");
		const prevReasoningLevel = sessionEntry.reasoningLevel ?? "off";
		let elevatedChanged = directives.hasElevatedDirective && directives.elevatedLevel !== void 0 && elevatedEnabled && elevatedAllowed;
		let reasoningChanged = directives.hasReasoningDirective && directives.reasoningLevel !== void 0;
		let updated = false;
		if (directives.clearThinkLevel) {
			if (sessionEntry.thinkingLevel) {
				delete sessionEntry.thinkingLevel;
				updated = true;
			}
		} else if (directives.hasThinkDirective && directives.thinkLevel) {
			sessionEntry.thinkingLevel = directives.thinkLevel;
			updated = true;
		}
		if (directives.clearFastMode) {
			if (sessionEntry.fastMode !== void 0) {
				delete sessionEntry.fastMode;
				updated = true;
			}
		}
		if (directives.hasVerboseDirective && directives.verboseLevel && allowInternalVerbosePersistence) {
			require_level_overrides.applyVerboseOverride(sessionEntry, directives.verboseLevel);
			updated = true;
		}
		if (directives.hasTraceDirective && directives.traceLevel && (params.senderIsOwner || delegatedTraceAllowed)) {
			require_level_overrides.applyTraceOverride(sessionEntry, directives.traceLevel);
			updated = true;
		}
		if (directives.hasReasoningDirective && directives.reasoningLevel) {
			if (directives.reasoningLevel === "off") sessionEntry.reasoningLevel = "off";
			else sessionEntry.reasoningLevel = directives.reasoningLevel;
			reasoningChanged = reasoningChanged || directives.reasoningLevel !== prevReasoningLevel && directives.reasoningLevel !== void 0;
			updated = true;
		}
		if (directives.hasElevatedDirective && directives.elevatedLevel && elevatedEnabled && elevatedAllowed) {
			sessionEntry.elevatedLevel = directives.elevatedLevel;
			elevatedChanged = elevatedChanged || directives.elevatedLevel !== prevElevatedLevel && directives.elevatedLevel !== void 0;
			updated = true;
		}
		if (directives.hasExecDirective && directives.hasExecOptions && allowInternalExecPersistence) {
			if (directives.execHost) {
				sessionEntry.execHost = directives.execHost;
				updated = true;
			}
			if (directives.execSecurity) {
				sessionEntry.execSecurity = directives.execSecurity;
				updated = true;
			}
			if (directives.execAsk) {
				sessionEntry.execAsk = directives.execAsk;
				updated = true;
			}
			if (directives.execNode) {
				sessionEntry.execNode = directives.execNode;
				updated = true;
			}
		}
		let modelUpdated = false;
		let modelApplied = true;
		let modelSwitchEvent;
		if (modelDirective && modelResolution?.modelSelection) {
			const appliedModelOverride = require_model_overrides.applyModelOverrideToSessionEntry({
				entry: sessionEntry,
				selection: modelResolution.modelSelection,
				profileOverride: modelResolution.profileOverride,
				markLiveSwitchPending: params.markLiveSwitchPending
			});
			const appliedRuntimeOverride = require_directive_handling_shared.applyModelRuntimeDirective(sessionEntry, modelRuntimeResolution);
			modelUpdated = appliedModelOverride.updated || appliedRuntimeOverride.updated;
			provider = modelResolution.modelSelection.provider;
			model = modelResolution.modelSelection.model;
			const thinkingRuntime = require_thinking_runtime.resolveEffectiveAgentRuntime({
				cfg,
				provider,
				modelId: model,
				agentId: activeAgentId,
				sessionKey,
				sessionEntry
			});
			const currentThinkingLevel = sessionEntry.thinkingLevel;
			if (currentThinkingLevel && !directives.hasThinkDirective && !require_thinking.isThinkingLevelSupported({
				provider,
				model,
				level: currentThinkingLevel,
				catalog: thinkingCatalog,
				agentRuntime: thinkingRuntime
			})) {
				const remappedThinkingLevel = require_thinking.resolveSupportedThinkingLevel({
					provider,
					model,
					level: currentThinkingLevel,
					catalog: thinkingCatalog,
					agentRuntime: thinkingRuntime
				});
				if (remappedThinkingLevel !== currentThinkingLevel) {
					sessionEntry.thinkingLevel = remappedThinkingLevel;
					thinkingRemap = {
						from: currentThinkingLevel,
						to: remappedThinkingLevel,
						provider,
						model
					};
				}
			}
			const nextLabel = `${provider}/${model}`;
			if (nextLabel !== initialModelLabel) modelSwitchEvent = {
				label: nextLabel,
				...modelResolution.modelSelection.alias ? { alias: modelResolution.modelSelection.alias } : {}
			};
			updated = true;
		}
		if (directives.hasQueueDirective && directives.queueReset) {
			delete sessionEntry.queueMode;
			delete sessionEntry.queueDebounceMs;
			delete sessionEntry.queueCap;
			delete sessionEntry.queueDrop;
			updated = true;
		}
		if (updated) {
			sessionEntry.updatedAt = Date.now();
			sessionStore[sessionKey] = sessionEntry;
			if (storePath) {
				const persistence = await require_session_entry_persistence.persistReplySessionEntry({
					storePath,
					sessionKey,
					initialEntry: initialSessionEntry,
					entry: sessionEntry,
					reassertLiveModelSwitchPending: modelUpdated && params.markLiveSwitchPending === true && sessionEntry.liveModelSwitchPending === true,
					touchedFields: touchedSessionFields
				});
				if (persistence.status === "current") {
					const persistedEntry = persistence.entry;
					sessionStore[sessionKey] = persistedEntry;
					sessionChangesApplied = require_session_snapshot_merge.sessionSnapshotChangesApplied({
						initial: initialSessionEntry,
						next: sessionEntry,
						current: persistedEntry,
						touchedFields: touchedSessionFields
					});
					if (modelDirective) modelApplied = sessionChangesApplied && require_session_snapshot_merge.sessionModelOverrideChangesApplied({
						initial: initialSessionEntry,
						next: sessionEntry,
						current: persistedEntry,
						reassertLiveModelSwitchPending: modelUpdated && params.markLiveSwitchPending === true && sessionEntry.liveModelSwitchPending === true
					});
					require_session_snapshot_merge.adoptPersistedSessionSnapshot(sessionEntry, persistedEntry);
					appliedSessionEntry = sessionEntry;
				} else {
					if (persistence.entry) sessionStore[sessionKey] = persistence.entry;
					sessionChangesApplied = false;
					if (modelDirective) modelApplied = false;
				}
			}
			if (modelDirective && !modelApplied) {
				sessionChangesApplied = false;
				const persistedEntry = sessionStore[sessionKey];
				provider = persistedEntry?.providerOverride?.trim() || defaultProvider;
				model = persistedEntry?.modelOverride?.trim() || defaultModel;
				thinkingRemap = void 0;
			}
			if (modelDirective && modelUpdated && modelApplied) {
				require_session_patch_hooks.triggerSessionPatchHook({
					cfg,
					sessionEntry: appliedSessionEntry,
					sessionKey,
					patch: {
						key: sessionKey,
						model: modelDirective
					}
				});
				require_cleanup.refreshQueuedFollowupSession({
					key: sessionKey,
					nextProvider: provider,
					nextModel: model,
					nextModelOverrideSource: "user",
					nextAuthProfileId: appliedSessionEntry.authProfileOverride,
					nextAuthProfileIdSource: appliedSessionEntry.authProfileOverrideSource,
					nextThinking: {
						level: appliedSessionEntry.thinkingLevel,
						catalog: thinkingCatalog,
						agentRuntime: require_thinking_runtime.resolveEffectiveAgentRuntime({
							cfg,
							provider,
							modelId: model,
							agentId: activeAgentId,
							sessionKey,
							sessionEntry: appliedSessionEntry
						})
					}
				});
			}
			if (sessionChangesApplied) require_directive_handling_shared.enqueueModeSwitchEvents({
				enqueueSystemEvent: require_system_events.enqueueSystemEvent,
				sessionEntry: appliedSessionEntry,
				sessionKey,
				elevatedChanged,
				reasoningChanged
			});
		}
		modelRuntimeApplied = modelApplied && (modelRuntimeResolution.kind === "clear" || modelRuntimeResolution.kind === "set");
		if (modelSwitchEvent && modelApplied) require_system_events.enqueueSystemEvent(formatModelSwitchEvent(modelSwitchEvent.label, modelSwitchEvent.alias), {
			sessionKey,
			contextKey: `model:${modelSwitchEvent.label}`
		});
	}
	const selectedCatalogEntry = params.modelCatalog?.find((entry) => require_model_selection_normalize.modelKey(entry.provider, entry.id) === require_model_selection_normalize.modelKey(provider, model));
	return {
		provider,
		model,
		thinkingRemap,
		errorText,
		runtimeChange: modelRuntimeApplied && (modelRuntimeResolution.kind === "clear" || modelRuntimeResolution.kind === "set") ? modelRuntimeResolution : void 0,
		sessionChangesApplied,
		contextTokens: require_directive_handling_model_selection.resolveContextTokens({
			cfg,
			agentCfg,
			provider: require_openai_routing.resolveContextConfigProviderForRuntime({
				provider,
				runtimeId: require_policy.resolveAgentHarnessPolicy({
					provider,
					modelId: model,
					config: cfg,
					agentId: activeAgentId,
					sessionKey
				}).runtime,
				config: cfg
			}),
			model,
			modelContextWindow: selectedCatalogEntry?.contextWindow,
			modelContextTokens: selectedCatalogEntry?.contextTokens
		})
	};
}
//#endregion
exports.persistInlineDirectives = persistInlineDirectives;
