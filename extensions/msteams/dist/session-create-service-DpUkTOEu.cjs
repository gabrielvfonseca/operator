const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_web_tools = require("./web-tools-fb2XR9TB.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_internal_hooks = require("./internal-hooks-CP-OV43M.cjs");
const require_model_selection = require("./model-selection-BvFurMxy.cjs");
const require_subagent_capabilities = require("./subagent-capabilities-Bg6I8KeP.cjs");
const require_session_meta = require("./session-meta-BKZldXXC.cjs");
const require_send_policy = require("./send-policy-4PnHfY3z.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
const require_runs = require("./runs-BxiWZCUY.cjs");
const require_model_overrides = require("./model-overrides-BvSxD3wH.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_session_model_ref = require("./session-model-ref-DUZbU68I.cjs");
const require_thinking_runtime = require("./thinking-runtime-CrpgBgYy.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
require("./embedded-agent-C44j1_Yh.cjs");
const require_group_activation = require("./group-activation-Diuzg5QT.cjs");
const require_level_overrides = require("./level-overrides-CI02u-AL.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/sessions-patch.ts
function invalid(message) {
	return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, message)
	};
}
function normalizeExecSecurity(raw) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (normalized === "deny" || normalized === "allowlist" || normalized === "full") return normalized;
}
function normalizeExecAsk(raw) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (normalized === "off" || normalized === "on-miss" || normalized === "always") return normalized;
}
function supportsSpawnLineage(storeKey) {
	return require_session_key.isSubagentSessionKey(storeKey) || require_session_key.isAcpSessionKey(storeKey);
}
function normalizeSubagentRole(raw) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (normalized === "orchestrator" || normalized === "leaf") return normalized;
}
function normalizeSubagentControlScope(raw) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (normalized === "children" || normalized === "none") return normalized;
}
/** Project a validated gateway session patch for one session entry. */
async function projectSessionsPatchEntry(params) {
	const { cfg, storeKey, patch } = params;
	const harnessSessionError = params.existingEntry === void 0 && require_store.isAgentHarnessSessionKeyOwnedBy(storeKey, params.authorizedAgentHarnessId) ? void 0 : require_store.resolveMissingAgentHarnessSessionError(storeKey, params.existingEntry);
	if (harnessSessionError) return invalid(harnessSessionError);
	if ("model" in patch && require_model_overrides.isModelSelectionLocked(params.existingEntry)) return invalid(require_model_overrides.MODEL_SELECTION_LOCKED_MESSAGE);
	const now = Date.now();
	const parsedAgent = require_session_key.parseAgentSessionKey(storeKey);
	const sessionAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId ?? parsedAgent?.agentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg));
	const resolvedDefault = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg,
		agentId: sessionAgentId
	});
	const subagentModelHint = require_session_key.isSubagentSessionKey(storeKey) ? require_codex_plugin_diagnostics.resolveSubagentConfiguredModelSelection({
		cfg,
		agentId: sessionAgentId
	}) : void 0;
	const resolveThinkingRuntime = (provider, model, entry) => {
		return require_session_meta.readAcpSessionMetaForEntry({
			sessionKey: storeKey,
			entry
		})?.backend ?? require_thinking_runtime.resolveEffectiveAgentRuntime({
			cfg,
			provider,
			modelId: model,
			agentId: sessionAgentId,
			sessionKey: storeKey,
			sessionEntry: entry
		});
	};
	let loadedModelCatalog;
	const loadModelCatalogForPatch = async () => {
		if (loadedModelCatalog) return loadedModelCatalog;
		if (!params.loadGatewayModelCatalog) return;
		const catalog = await params.loadGatewayModelCatalog();
		loadedModelCatalog = Array.isArray(catalog) ? catalog : [];
		return loadedModelCatalog;
	};
	const existing = params.existingEntry;
	const next = existing?.sessionId ? {
		...existing,
		updatedAt: Math.max(existing.updatedAt ?? 0, now)
	} : {
		...existing,
		sessionId: (0, node_crypto.randomUUID)(),
		sessionFile: void 0,
		updatedAt: Math.max(existing?.updatedAt ?? 0, now)
	};
	if (existing && !existing.sessionId) {
		delete next.label;
		delete next.category;
		delete next.displayName;
	}
	const checkSpawnLineage = (field) => supportsSpawnLineage(storeKey) ? null : invalid(`${field} is only supported for subagent:* or acp:* sessions`);
	const applyImmutableString = (field, checkLineageBeforeEmpty) => {
		if (!(field in patch)) return null;
		const raw = patch[field];
		if (raw === null) return existing?.[field] ? invalid(`${field} cannot be cleared once set`) : null;
		if (raw === void 0) return null;
		const earlyLineage = checkLineageBeforeEmpty ? checkSpawnLineage(field) : null;
		if (earlyLineage) return earlyLineage;
		const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "";
		if (!trimmed) return invalid(`invalid ${field}: empty`);
		const lateLineage = checkLineageBeforeEmpty ? null : checkSpawnLineage(field);
		if (lateLineage) return lateLineage;
		if (existing?.[field] && existing[field] !== trimmed) return invalid(`${field} cannot be changed once set`);
		next[field] = trimmed;
		return null;
	};
	const applyImmutableNormalized = (field, normalize, invalidMessage) => {
		if (!(field in patch)) return null;
		const raw = patch[field];
		if (raw === null) return existing?.[field] ? invalid(`${field} cannot be cleared once set`) : null;
		if (raw === void 0) return null;
		const lineage = checkSpawnLineage(field);
		if (lineage) return lineage;
		const normalized = normalize(raw);
		if (!normalized) return invalid(invalidMessage);
		if (existing?.[field] && existing[field] !== normalized) return invalid(`${field} cannot be changed once set`);
		next[field] = normalized;
		return null;
	};
	for (const fieldParams of [
		{
			field: "spawnedBy",
			checkLineageBeforeEmpty: false
		},
		{
			field: "spawnedWorkspaceDir",
			checkLineageBeforeEmpty: true
		},
		{
			field: "spawnedCwd",
			checkLineageBeforeEmpty: true
		}
	]) {
		const result = applyImmutableString(fieldParams.field, fieldParams.checkLineageBeforeEmpty);
		if (result) return result;
	}
	if ("spawnDepth" in patch) {
		const raw = patch.spawnDepth;
		if (raw === null) {
			if (typeof existing?.spawnDepth === "number") return invalid("spawnDepth cannot be cleared once set");
		} else if (raw !== void 0) {
			if (!supportsSpawnLineage(storeKey)) return invalid("spawnDepth is only supported for subagent:* or acp:* sessions");
			const numeric = raw;
			if (!Number.isInteger(numeric) || numeric < 0) return invalid("invalid spawnDepth (use an integer >= 0)");
			const normalized = numeric;
			if (typeof existing?.spawnDepth === "number" && existing.spawnDepth !== normalized) return invalid("spawnDepth cannot be changed once set");
			next.spawnDepth = normalized;
		}
	}
	for (const fieldParams of [{
		field: "subagentRole",
		normalize: normalizeSubagentRole,
		invalidMessage: "invalid subagentRole (use \"orchestrator\" or \"leaf\")"
	}, {
		field: "subagentControlScope",
		normalize: normalizeSubagentControlScope,
		invalidMessage: "invalid subagentControlScope (use \"children\" or \"none\")"
	}]) {
		const result = applyImmutableNormalized(fieldParams.field, fieldParams.normalize, fieldParams.invalidMessage);
		if (result) return result;
	}
	if ("inheritedToolDeny" in patch) {
		const raw = patch.inheritedToolDeny;
		if (raw === null) delete next.inheritedToolDeny;
		else if (raw !== void 0) {
			if (!Array.isArray(raw)) return invalid("invalid inheritedToolDeny (use an array of tool names)");
			if (!supportsSpawnLineage(storeKey)) return invalid("inheritedToolDeny is only supported for subagent:* or acp:* sessions");
			const inheritedToolDeny = require_subagent_capabilities.normalizeInheritedToolDenylist(raw);
			if (inheritedToolDeny.length > 0) next.inheritedToolDeny = inheritedToolDeny;
			else delete next.inheritedToolDeny;
		}
	}
	if ("inheritedToolAllow" in patch) {
		const raw = patch.inheritedToolAllow;
		if (raw === null) delete next.inheritedToolAllow;
		else if (raw !== void 0) {
			if (!Array.isArray(raw)) return invalid("invalid inheritedToolAllow (use an array of tool names)");
			if (!supportsSpawnLineage(storeKey)) return invalid("inheritedToolAllow is only supported for subagent:* or acp:* sessions");
			const inheritedToolAllow = require_subagent_capabilities.normalizeInheritedToolAllowlist(raw);
			if (inheritedToolAllow.length > 0) next.inheritedToolAllow = inheritedToolAllow;
			else delete next.inheritedToolAllow;
		}
	}
	if ("label" in patch) {
		const raw = patch.label;
		if (raw === null) delete next.label;
		else if (raw !== void 0) {
			const parsed = require_web_tools.parseSessionLabel(raw);
			if (!parsed.ok) return invalid(parsed.error);
			for (const { sessionKey, entry } of params.entries) {
				if (sessionKey === storeKey) continue;
				if (entry?.label === parsed.label) return invalid(`label already in use: ${parsed.label}`);
			}
			next.label = parsed.label;
		}
	}
	if ("category" in patch) {
		const raw = patch.category;
		if (raw === null) delete next.category;
		else if (raw !== void 0) {
			const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "";
			if (!trimmed) return invalid("invalid category: empty");
			if (trimmed.length > 512) return invalid(`invalid category: too long (max 512)`);
			next.category = trimmed;
		}
	}
	if ("archived" in patch) if (patch.archived === true) {
		next.archivedAt ??= now;
		delete next.pinnedAt;
	} else delete next.archivedAt;
	if ("pinned" in patch) if (patch.pinned === true) {
		if (next.archivedAt !== void 0) return invalid("cannot pin an archived session; restore it first");
		next.pinnedAt ??= now;
	} else delete next.pinnedAt;
	if ("unread" in patch) if (patch.unread === true) next.markedUnreadAt = now;
	else {
		next.lastReadAt = now;
		delete next.markedUnreadAt;
	}
	if ("thinkingLevel" in patch) {
		const raw = patch.thinkingLevel;
		if (raw === null) delete next.thinkingLevel;
		else if (raw !== void 0) {
			const normalized = require_thinking.normalizeThinkLevel(raw);
			if (!normalized) {
				const hintProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(existing?.providerOverride) || resolvedDefault.provider;
				const hintModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(existing?.modelOverride) || resolvedDefault.model;
				return invalid(`invalid thinkingLevel (use ${require_thinking.formatThinkingLevels(hintProvider, hintModel, "|", await loadModelCatalogForPatch(), resolveThinkingRuntime(hintProvider, hintModel, existing))})`);
			}
			next.thinkingLevel = normalized;
		}
	}
	if ("fastMode" in patch) {
		const raw = patch.fastMode;
		if (raw === null) delete next.fastMode;
		else if (raw !== void 0) {
			const normalized = require_string_coerce.normalizeFastMode(raw);
			if (normalized === void 0) return invalid("invalid fastMode (use true, false, or \"auto\")");
			next.fastMode = normalized;
		}
	}
	if ("verboseLevel" in patch) {
		const raw = patch.verboseLevel;
		const parsed = require_level_overrides.parseVerboseOverride(raw);
		if (!parsed.ok) return invalid(parsed.error);
		require_level_overrides.applyVerboseOverride(next, parsed.value);
	}
	if ("traceLevel" in patch) {
		const raw = patch.traceLevel;
		const parsed = require_level_overrides.parseTraceOverride(raw);
		if (!parsed.ok) return invalid(parsed.error);
		require_level_overrides.applyTraceOverride(next, parsed.value);
	}
	if ("reasoningLevel" in patch) {
		const raw = patch.reasoningLevel;
		if (raw === null) delete next.reasoningLevel;
		else if (raw !== void 0) {
			const normalized = require_thinking.normalizeReasoningLevel(raw);
			if (!normalized) return invalid("invalid reasoningLevel (use \"on\"|\"off\"|\"stream\")");
			next.reasoningLevel = normalized;
		}
	}
	if ("responseUsage" in patch) {
		const raw = patch.responseUsage;
		if (raw === null) delete next.responseUsage;
		else if (raw !== void 0) {
			const normalized = require_thinking.normalizeUsageDisplay(raw);
			if (!normalized) return invalid("invalid responseUsage (use \"off\"|\"tokens\"|\"full\")");
			next.responseUsage = normalized;
		}
	}
	if ("elevatedLevel" in patch) {
		const raw = patch.elevatedLevel;
		if (raw === null) delete next.elevatedLevel;
		else if (raw !== void 0) {
			const normalized = require_thinking.normalizeElevatedLevel(raw);
			if (!normalized) return invalid("invalid elevatedLevel (use \"on\"|\"off\"|\"ask\"|\"full\")");
			next.elevatedLevel = normalized;
		}
	}
	if ("execHost" in patch) {
		const raw = patch.execHost;
		if (raw === null) delete next.execHost;
		else if (raw !== void 0) {
			const normalized = require_exec_approvals.normalizeExecTarget(raw) ?? void 0;
			if (!normalized) return invalid("invalid execHost (use \"auto\"|\"sandbox\"|\"gateway\"|\"node\")");
			next.execHost = normalized;
		}
	}
	if ("execSecurity" in patch) {
		const raw = patch.execSecurity;
		if (raw === null) delete next.execSecurity;
		else if (raw !== void 0) {
			const normalized = normalizeExecSecurity(raw);
			if (!normalized) return invalid("invalid execSecurity (use \"deny\"|\"allowlist\"|\"full\")");
			next.execSecurity = normalized;
		}
	}
	if ("execAsk" in patch) {
		const raw = patch.execAsk;
		if (raw === null) delete next.execAsk;
		else if (raw !== void 0) {
			const normalized = normalizeExecAsk(raw);
			if (!normalized) return invalid("invalid execAsk (use \"off\"|\"on-miss\"|\"always\")");
			next.execAsk = normalized;
		}
	}
	if ("execNode" in patch) {
		const raw = patch.execNode;
		if (raw === null) {
			delete next.execNode;
			delete next.execCwd;
		} else if (raw !== void 0) {
			const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "";
			if (!trimmed) return invalid("invalid execNode: empty");
			if (trimmed !== next.execNode) delete next.execCwd;
			next.execNode = trimmed;
		}
	}
	if ("model" in patch) {
		const agentModelFallback = require_web_tools.isAgentSessionModelPatchOrigin() ? next.modelFallback?.source === "agent-patch" ? {
			...next.modelFallback,
			ts: Math.max(now, next.modelFallback.ts + 1)
		} : require_web_tools.snapshotAgentModelFallback(cfg, next, sessionAgentId, now) : void 0;
		delete next.modelFallback;
		const raw = patch.model;
		if (raw === null) {
			require_model_overrides.applyModelOverrideToSessionEntry({
				entry: next,
				selection: {
					provider: resolvedDefault.provider,
					model: resolvedDefault.model,
					isDefault: true
				},
				preserveAuthProfileOverride: require_web_tools.shouldPreserveSessionAuthProfileOverride({
					cfg,
					currentProvider: next.providerOverride ?? next.modelProvider ?? resolvedDefault.provider,
					entry: next,
					provider: resolvedDefault.provider
				})
			});
			delete next.liveModelSwitchPending;
		} else if (raw !== void 0) {
			const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "";
			if (!trimmed) return invalid("invalid model: empty");
			if (!params.loadGatewayModelCatalog) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "model catalog unavailable")
			};
			const catalog = await loadModelCatalogForPatch();
			if (!catalog) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "model catalog unavailable")
			};
			const { model: modelWithoutProfile, profile: trailingProfile } = require_model_ref_profile.splitTrailingAuthProfile(trimmed);
			const resolved = require_model_selection.resolveAllowedModelRef({
				cfg,
				catalog,
				raw: modelWithoutProfile,
				defaultProvider: resolvedDefault.provider,
				defaultModel: subagentModelHint ?? resolvedDefault.model
			});
			if ("error" in resolved) return invalid(resolved.error);
			const isDefault = resolved.ref.provider === resolvedDefault.provider && resolved.ref.model === resolvedDefault.model;
			require_model_overrides.applyModelOverrideToSessionEntry({
				entry: next,
				selection: {
					provider: resolved.ref.provider,
					model: resolved.ref.model,
					isDefault
				},
				profileOverride: trailingProfile || void 0,
				preserveAuthProfileOverride: require_web_tools.shouldPreserveSessionAuthProfileOverride({
					cfg,
					currentProvider: next.providerOverride ?? next.modelProvider ?? resolvedDefault.provider,
					entry: next,
					provider: resolved.ref.provider
				}),
				markLiveSwitchPending: true
			});
		}
		if (agentModelFallback) next.modelFallback = agentModelFallback;
	}
	if (next.thinkingLevel && ("thinkingLevel" in patch || "model" in patch)) {
		const effectiveProvider = next.providerOverride ?? resolvedDefault.provider;
		const effectiveModel = next.modelOverride ?? resolvedDefault.model;
		const thinkingLevel = require_thinking.normalizeThinkLevel(next.thinkingLevel);
		const thinkingCatalog = await loadModelCatalogForPatch();
		if (!thinkingLevel) delete next.thinkingLevel;
		else {
			const thinkingRuntime = resolveThinkingRuntime(effectiveProvider, effectiveModel, next);
			if (!require_thinking.isThinkingLevelSupported({
				provider: effectiveProvider,
				model: effectiveModel,
				level: thinkingLevel,
				catalog: thinkingCatalog,
				agentRuntime: thinkingRuntime
			})) {
				if ("thinkingLevel" in patch) return invalid(`thinkingLevel "${thinkingLevel}" is not supported for ${effectiveProvider}/${effectiveModel} (use ${require_thinking.formatThinkingLevels(effectiveProvider, effectiveModel, "|", thinkingCatalog, thinkingRuntime)})`);
				next.thinkingLevel = require_thinking.resolveSupportedThinkingLevel({
					provider: effectiveProvider,
					model: effectiveModel,
					level: thinkingLevel,
					catalog: thinkingCatalog,
					agentRuntime: thinkingRuntime
				});
			}
		}
	}
	if ("thinkingLevel" in patch && !("model" in patch) && next.modelFallback?.source === "agent-patch") next.modelFallback = next.thinkingLevel ? {
		...next.modelFallback,
		prevThinkingLevel: next.thinkingLevel
	} : {
		...next.modelFallback,
		prevThinkingLevel: void 0
	};
	if ("sendPolicy" in patch) {
		const raw = patch.sendPolicy;
		if (raw === null) delete next.sendPolicy;
		else if (raw !== void 0) {
			const normalized = require_send_policy.normalizeSendPolicy(raw);
			if (!normalized) return invalid("invalid sendPolicy (use \"allow\"|\"deny\")");
			next.sendPolicy = normalized;
		}
	}
	if ("groupActivation" in patch) {
		const raw = patch.groupActivation;
		if (raw === null) delete next.groupActivation;
		else if (raw !== void 0) {
			const normalized = require_group_activation.normalizeGroupActivation(raw);
			if (!normalized) return invalid("invalid groupActivation (use \"mention\"|\"always\")");
			next.groupActivation = normalized;
		}
	}
	return {
		ok: true,
		entry: next
	};
}
/** Apply a validated gateway session patch to an in-memory session store entry. */
async function applySessionsPatchToStore(params) {
	const projected = await projectSessionsPatchEntry({
		cfg: params.cfg,
		entries: Object.entries(params.store).map(([sessionKey, entry]) => ({
			sessionKey,
			entry
		})),
		existingEntry: params.store[params.storeKey],
		storeKey: params.storeKey,
		agentId: params.agentId,
		patch: params.patch,
		loadGatewayModelCatalog: params.loadGatewayModelCatalog,
		authorizedAgentHarnessId: params.authorizedAgentHarnessId
	});
	if (projected.ok) params.store[params.storeKey] = projected.entry;
	return projected;
}
//#endregion
//#region src/gateway/session-create-service.ts
const loadSessionLifecycleRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./sessions.runtime-Cm33QrRB.cjs")));
function resolveRequestedSessionAgentId(cfg, key, explicitAgentId) {
	const canonicalKey = require_session_accessor.resolveSessionStoreKey({
		cfg,
		sessionKey: key
	});
	const parsed = require_session_key.parseAgentSessionKey(key);
	const requestedAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(explicitAgentId);
	if (requestedAgentId) {
		const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(requestedAgentId);
		if (!require_agent_scope_config.listAgentIds(cfg).includes(agentId)) return {
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Unknown agent id "${explicitAgentId}"`)
		};
		if (parsed?.agentId && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) !== agentId) return {
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "session key agent does not match agentId")
		};
		if (canonicalKey !== "global") {
			if ((parsed?.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) : (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_session_accessor.resolveSessionStoreAgentId(cfg, canonicalKey))) !== agentId) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "session key agent does not match agentId")
			};
		}
		return {
			ok: true,
			agentId
		};
	}
	if (!parsed?.agentId) return { ok: true };
	const inferredAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId);
	if (canonicalKey === "global" && !require_agent_scope_config.listAgentIds(cfg).includes(inferredAgentId)) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Unknown agent id "${parsed.agentId}"`)
	};
	return {
		ok: true,
		agentId: canonicalKey === "global" ? inferredAgentId : void 0
	};
}
function buildDashboardSessionKey(agentId) {
	return `agent:${agentId}:dashboard:${(0, node_crypto.randomUUID)()}`;
}
function inheritSessionSelection(parentEntry) {
	if (!parentEntry) return {};
	return {
		...parentEntry.providerOverride ? { providerOverride: parentEntry.providerOverride } : {},
		...parentEntry.modelOverride ? { modelOverride: parentEntry.modelOverride } : {},
		...parentEntry.modelOverrideSource ? { modelOverrideSource: parentEntry.modelOverrideSource } : {},
		...parentEntry.agentRuntimeOverride ? { agentRuntimeOverride: parentEntry.agentRuntimeOverride } : {},
		...parentEntry.thinkingLevel ? { thinkingLevel: parentEntry.thinkingLevel } : {},
		...parentEntry.fastMode !== void 0 ? { fastMode: parentEntry.fastMode } : {},
		...parentEntry.verboseLevel ? { verboseLevel: parentEntry.verboseLevel } : {},
		...parentEntry.traceLevel ? { traceLevel: parentEntry.traceLevel } : {},
		...parentEntry.reasoningLevel ? { reasoningLevel: parentEntry.reasoningLevel } : {},
		...parentEntry.elevatedLevel ? { elevatedLevel: parentEntry.elevatedLevel } : {},
		...parentEntry.authProfileOverride ? { authProfileOverride: parentEntry.authProfileOverride } : {},
		...parentEntry.authProfileOverrideSource ? { authProfileOverrideSource: parentEntry.authProfileOverrideSource } : {}
	};
}
async function createGatewaySession(params) {
	const requestedKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.key);
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId) ?? require_agent_scope_config.resolveDefaultAgentId(params.cfg));
	const catalogModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.catalogTarget?.model);
	const catalogAgentRuntime = require_openai_routing.normalizeOptionalAgentRuntimeId(params.catalogTarget?.agentRuntime);
	const catalogPluginOwnerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.catalogTarget?.pluginOwnerId);
	if (params.catalogTarget && (!catalogModel || !catalogAgentRuntime || !catalogPluginOwnerId)) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid catalog session target")
	};
	if (requestedKey) {
		const requestedAgentId = require_session_key.parseAgentSessionKey(requestedKey)?.agentId;
		if (requestedAgentId && requestedAgentId !== agentId && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId)) return {
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `sessions.create key agent (${requestedAgentId}) does not match agentId (${agentId})`)
		};
	}
	const loweredRequestedKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(requestedKey);
	const explicitTargetKey = requestedKey ? loweredRequestedKey === "global" || loweredRequestedKey === "unknown" ? loweredRequestedKey : require_session_key.toAgentStoreSessionKey({
		agentId,
		requestKey: requestedKey,
		mainKey: params.cfg.session?.mainKey
	}) : void 0;
	if (params.catalogTarget && explicitTargetKey && !explicitTargetKey.startsWith(`agent:${agentId}:dashboard:`)) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "catalog sessions require a generated dashboard key")
	};
	const authorizedHarnessCreation = Boolean(explicitTargetKey && params.initialEntry && require_openai_routing.normalizeOptionalAgentRuntimeId(params.authorizedAgentHarnessId) === require_openai_routing.normalizeOptionalAgentRuntimeId(params.initialEntry.agentHarnessId) && require_store.isAgentHarnessSessionKeyOwnedBy(explicitTargetKey, params.authorizedAgentHarnessId));
	const authorizedPluginCreation = Boolean(explicitTargetKey && params.initialEntry?.pluginOwnerId && params.authorizedPluginId === params.initialEntry.pluginOwnerId);
	if (params.initialEntry?.pluginOwnerId && !authorizedPluginCreation) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "trusted plugin session owner is not authorized")
	};
	const existingHarnessEntry = explicitTargetKey && require_store.isAgentHarnessSessionKey(explicitTargetKey) ? require_session_accessor.resolveSessionEntryAccessTarget({
		cfg: params.cfg,
		sessionKey: explicitTargetKey
	}).entry : void 0;
	if (explicitTargetKey && require_store.isAgentHarnessSessionKey(explicitTargetKey) && !authorizedHarnessCreation && (!existingHarnessEntry || existingHarnessEntry.modelSelectionLocked === true)) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, require_store.AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE)
	};
	const parentSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.parentSessionKey);
	if (params.fork === true && !parentSessionKey) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "fork requires parentSessionKey")
	};
	let canonicalParentSessionKey;
	let parentSessionEntry;
	let parentSelectedAgentId;
	let parentSessionTarget;
	if (parentSessionKey) {
		if (require_session_accessor.resolveSessionStoreKey({
			cfg: params.cfg,
			sessionKey: parentSessionKey
		}) === "global") {
			const parentRequestedAgent = resolveRequestedSessionAgentId(params.cfg, parentSessionKey, params.agentId);
			if (!parentRequestedAgent.ok) return parentRequestedAgent;
			parentSelectedAgentId = parentRequestedAgent.agentId;
		}
		const parent = require_session_utils.loadSessionEntry(parentSessionKey, parentSelectedAgentId ? { agentId: parentSelectedAgentId } : void 0);
		if (!parent.entry?.sessionId) return {
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown parent session: ${parentSessionKey}`)
		};
		if (require_model_overrides.isModelSelectionLocked(parent.entry)) return {
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, require_web_tools.MODEL_SELECTION_LOCKED_PARENT_FORK_MESSAGE)
		};
		canonicalParentSessionKey = parent.canonicalKey;
		parentSessionEntry = parent.entry;
		parentSessionTarget = require_session_utils.resolveGatewaySessionStoreTarget({
			cfg: params.cfg,
			key: parentSessionKey,
			...canonicalParentSessionKey === "global" && parentSelectedAgentId ? { agentId: parentSelectedAgentId } : {}
		});
	}
	if (canonicalParentSessionKey && explicitTargetKey && require_session_utils.resolveGatewaySessionStoreTarget({
		cfg: params.cfg,
		key: explicitTargetKey,
		agentId
	}).canonicalKey === canonicalParentSessionKey) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "sessions.create key must differ from parentSessionKey")
	};
	if (canonicalParentSessionKey && params.fork !== true && params.emitCommandHooks === true && !requestedKey && params.resetMainWhenUnspecified === true && !params.catalogTarget && params.cfg.session?.dmScope === "main") {
		const parentAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parentSelectedAgentId ?? require_session_key.resolveAgentIdFromSessionKey(canonicalParentSessionKey) ?? require_agent_scope_config.resolveDefaultAgentId(params.cfg));
		const parentMainKey = require_main_session.resolveAgentMainSessionKey({
			cfg: params.cfg,
			agentId: parentAgentId
		});
		if (canonicalParentSessionKey === parentMainKey) {
			const { performGatewaySessionReset } = await loadSessionLifecycleRuntime();
			const spawnedCwd = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.spawnedCwd);
			const execCwd = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.execCwd);
			const resetResult = await performGatewaySessionReset({
				key: canonicalParentSessionKey,
				...canonicalParentSessionKey === "global" && parentSelectedAgentId ? { agentId: parentSelectedAgentId } : {},
				reason: "new",
				commandSource: params.commandSource,
				...spawnedCwd ? { spawnedCwd } : {},
				...params.worktree ? { worktree: params.worktree } : {},
				...params.execNode ? { execNode: params.execNode } : {},
				...execCwd ? { execCwd } : {},
				...params.clearExecBinding ? { clearExecBinding: true } : {},
				...params.clearSpawnedCwd && !spawnedCwd ? { clearSpawnedCwd: true } : {}
			});
			if (!resetResult.ok) return resetResult;
			return {
				ok: true,
				key: resetResult.key,
				agentId: resetResult.agentId,
				entry: resetResult.entry,
				resolved: resetResult.resolved,
				resetExisting: true
			};
		}
	}
	let createdContext;
	const createChildSession = async () => {
		let currentParentSessionEntry = parentSessionEntry;
		if (canonicalParentSessionKey && parentSessionTarget && (params.emitCommandHooks === true || params.fork === true)) {
			const currentParentEntry = require_session_utils.loadSessionEntry(canonicalParentSessionKey, parentSelectedAgentId ? { agentId: parentSelectedAgentId } : void 0).entry;
			if (!currentParentEntry?.sessionId || currentParentEntry.sessionId !== parentSessionEntry?.sessionId) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Parent session ${parentSessionKey} changed before ${params.fork === true ? "fork" : "/new"}; retry.`)
			};
			currentParentSessionEntry = currentParentEntry;
			if (require_model_overrides.isModelSelectionLocked(currentParentEntry)) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, require_web_tools.MODEL_SELECTION_LOCKED_PARENT_FORK_MESSAGE)
			};
			if (require_runs.isEmbeddedAgentRunActive(currentParentEntry.sessionId) || require_store.isSessionWorkAdmissionActive(parentSessionTarget.storePath, [canonicalParentSessionKey, currentParentEntry.sessionId])) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `Parent session ${parentSessionKey} is still active; try again in a moment.`)
			};
		}
		if (canonicalParentSessionKey && parentSessionTarget && params.emitCommandHooks === true) {
			const parentEntry = currentParentSessionEntry;
			const parentAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parentSelectedAgentId ?? require_session_key.resolveAgentIdFromSessionKey(canonicalParentSessionKey) ?? require_agent_scope_config.resolveDefaultAgentId(params.cfg));
			const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, parentAgentId);
			if (require_internal_hooks.hasInternalHookListeners("command", "new")) await require_internal_hooks.triggerInternalHook(require_internal_hooks.createInternalHookEvent("command", "new", canonicalParentSessionKey, {
				sessionEntry: parentEntry,
				previousSessionEntry: parentEntry,
				commandSource: params.commandSource,
				cfg: params.cfg,
				workspaceDir
			}));
			const { emitGatewayBeforeResetPluginHook } = await loadSessionLifecycleRuntime();
			await emitGatewayBeforeResetPluginHook({
				cfg: params.cfg,
				key: canonicalParentSessionKey,
				target: parentSessionTarget,
				storePath: parentSessionTarget.storePath,
				entry: parentEntry,
				reason: "new"
			});
		}
		const key = explicitTargetKey ?? buildDashboardSessionKey(agentId);
		const target = require_session_utils.resolveGatewaySessionStoreTarget({
			cfg: params.cfg,
			key,
			agentId
		});
		const created = await require_session_accessor.createSessionEntryWithTranscript({
			agentId: target.agentId,
			sessionKey: target.canonicalKey,
			storePath: target.storePath
		}, async ({ existingEntry, sessionEntries }) => {
			if (require_store.isAgentHarnessSessionKey(target.canonicalKey) && !authorizedHarnessCreation && (!existingEntry || existingEntry.modelSelectionLocked === true)) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, require_store.AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE)
			};
			if (!params.initialEntry && existingEntry?.initializationPending === true) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `Session ${target.canonicalKey} is still initializing; retry creation later.`)
			};
			if (params.initialEntry && existingEntry !== void 0) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "trusted initial session state requires a new session")
			};
			if (params.catalogTarget && existingEntry !== void 0) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "catalog session target requires a new session")
			};
			const patched = await applySessionsPatchToStore({
				cfg: params.cfg,
				store: sessionEntries,
				storeKey: target.canonicalKey,
				agentId: target.agentId,
				patch: {
					key: target.canonicalKey,
					label: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.label),
					model: catalogModel ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model),
					thinkingLevel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.thinkingLevel)
				},
				loadGatewayModelCatalog: params.loadGatewayModelCatalog,
				authorizedAgentHarnessId: params.authorizedAgentHarnessId
			});
			if (!patched.ok) return patched;
			const spawnedCwd = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.spawnedCwd);
			const execNode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.execNode);
			const execCwd = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.execCwd);
			const initialAgentHarnessId = params.initialEntry ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.initialEntry.agentHarnessId) : void 0;
			if (params.initialEntry && !initialAgentHarnessId && !authorizedPluginCreation) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, params.initialEntry?.agentHarnessId !== void 0 ? "initial agentHarnessId must be non-empty" : "trusted initial session state requires an authorized owner")
			};
			if (params.initialEntry?.modelSelectionLocked !== void 0 && !params.initialEntry.modelSelectionLocked) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "initial modelSelectionLocked must be true when provided")
			};
			const catalogResolvedModel = params.catalogTarget ? require_session_model_ref.resolveSessionModelRef(params.cfg, patched.entry, target.agentId) : void 0;
			const initializedEntry = {
				...patched.entry,
				...catalogResolvedModel && catalogAgentRuntime ? {
					providerOverride: catalogResolvedModel.provider,
					modelOverride: catalogResolvedModel.model,
					modelOverrideSource: "user",
					agentRuntimeOverride: catalogAgentRuntime,
					modelSelectionLocked: true,
					pluginOwnerId: catalogPluginOwnerId
				} : {},
				...spawnedCwd ? { spawnedCwd } : {},
				...params.worktree ? { worktree: params.worktree } : {},
				...execNode ? {
					execHost: "node",
					execNode,
					...execCwd ? { execCwd } : {}
				} : {},
				...initialAgentHarnessId ? { agentHarnessId: initialAgentHarnessId } : {},
				...authorizedPluginCreation ? { pluginOwnerId: params.initialEntry?.pluginOwnerId } : {},
				...authorizedPluginCreation && params.initialEntry?.providerOverride ? { providerOverride: params.initialEntry.providerOverride } : {},
				...authorizedPluginCreation && params.initialEntry?.modelOverride ? { modelOverride: params.initialEntry.modelOverride } : {},
				...authorizedPluginCreation && params.initialEntry?.cliSessionBindings ? { cliSessionBindings: structuredClone(params.initialEntry.cliSessionBindings) } : {},
				...params.initialEntry?.initializationPending === true ? { initializationPending: true } : {},
				...params.initialEntry?.modelSelectionLocked === true ? { modelSelectionLocked: true } : {},
				...params.initialEntry?.pluginExtensions !== void 0 ? { pluginExtensions: structuredClone(params.initialEntry.pluginExtensions) } : {}
			};
			sessionEntries[target.canonicalKey] = initializedEntry;
			const initialized = {
				...patched,
				entry: initializedEntry
			};
			if (!canonicalParentSessionKey) return initialized;
			const inheritedSelection = catalogModel || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model) ? {} : inheritSessionSelection(currentParentSessionEntry);
			const entry = {
				...initializedEntry,
				...inheritedSelection,
				parentSessionKey: canonicalParentSessionKey
			};
			if (params.fork !== true) return {
				...initialized,
				entry
			};
			if (!currentParentSessionEntry || !parentSessionTarget) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "failed to resolve parent session for fork")
			};
			const forkDecision = await require_web_tools.resolveParentForkDecision({
				parentEntry: currentParentSessionEntry,
				agentId: parentSessionTarget.agentId,
				storePath: parentSessionTarget.storePath
			});
			if (forkDecision.status === "skip") return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `parent session is too large to fork (${forkDecision.parentTokens}/${forkDecision.maxTokens} tokens)`)
			};
			const fork = await require_web_tools.forkSessionFromParent({
				parentEntry: currentParentSessionEntry,
				agentId: parentSessionTarget.agentId,
				parentSessionKey: canonicalParentSessionKey,
				sessionKey: target.canonicalKey,
				storePath: parentSessionTarget.storePath,
				targetStorePath: target.storePath
			});
			if (!fork) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "failed to fork parent session transcript")
			};
			return {
				...initialized,
				entry: {
					...entry,
					sessionId: fork.sessionId,
					sessionFile: fork.sessionFile,
					forkedFromParent: true,
					totalTokens: void 0,
					totalTokensFresh: false
				}
			};
		}, params.initialEntry ? {
			activeSessionKey: target.canonicalKey,
			requireWriteSuccess: true
		} : void 0);
		if (!created.ok) return {
			ok: false,
			error: created.phase === "transcript" ? require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `failed to create session transcript: ${created.error}`) : created.error
		};
		createdContext = {
			key: target.canonicalKey,
			agentId: target.agentId,
			entry: created.entry,
			storePath: target.storePath
		};
		if (canonicalParentSessionKey && parentSessionTarget && params.emitCommandHooks === true) {
			const parentEntry = currentParentSessionEntry;
			const { emitGatewaySessionEndPluginHook, emitGatewaySessionStartPluginHook } = await loadSessionLifecycleRuntime();
			emitGatewaySessionEndPluginHook({
				cfg: params.cfg,
				sessionKey: canonicalParentSessionKey,
				sessionId: parentEntry?.sessionId,
				storePath: parentSessionTarget.storePath,
				sessionFile: parentEntry?.sessionFile,
				agentId: parentSessionTarget.agentId,
				reason: "new",
				nextSessionId: created.entry.sessionId,
				nextSessionKey: target.canonicalKey
			});
			emitGatewaySessionStartPluginHook({
				cfg: params.cfg,
				sessionKey: target.canonicalKey,
				sessionId: created.entry.sessionId,
				resumedFrom: parentEntry?.sessionId,
				storePath: target.storePath,
				sessionFile: created.entry.sessionFile,
				agentId: target.agentId
			});
		}
		const selectedModel = require_session_model_ref.resolveSessionModelRef(params.cfg, created.entry, target.agentId);
		return {
			ok: true,
			key: target.canonicalKey,
			agentId: target.agentId,
			entry: created.entry,
			resolved: {
				modelProvider: selectedModel.provider,
				model: selectedModel.model
			},
			resetExisting: false
		};
	};
	if (canonicalParentSessionKey && parentSessionEntry?.sessionId && parentSessionTarget && (params.emitCommandHooks === true || params.fork === true)) {
		const result = await require_store.runExclusiveSessionLifecycleMutation({
			scope: parentSessionTarget.storePath,
			identities: [canonicalParentSessionKey, parentSessionEntry.sessionId],
			run: createChildSession
		});
		if (result.ok && !result.resetExisting && createdContext) await params.afterCreate?.(createdContext);
		return result;
	}
	const result = await createChildSession();
	if (result.ok && !result.resetExisting && createdContext) await params.afterCreate?.(createdContext);
	return result;
}
//#endregion
Object.defineProperty(exports, "buildDashboardSessionKey", {
	enumerable: true,
	get: function() {
		return buildDashboardSessionKey;
	}
});
Object.defineProperty(exports, "createGatewaySession", {
	enumerable: true,
	get: function() {
		return createGatewaySession;
	}
});
Object.defineProperty(exports, "projectSessionsPatchEntry", {
	enumerable: true,
	get: function() {
		return projectSessionsPatchEntry;
	}
});
Object.defineProperty(exports, "resolveRequestedSessionAgentId", {
	enumerable: true,
	get: function() {
		return resolveRequestedSessionAgentId;
	}
});
