require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
require("./plugins-_-82JYfc.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_fast_mode = require("./fast-mode-BD9s0nxq.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_runtime_status = require("./runtime-status-BGIjp9Ys.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
const require_path_resolve = require("./path-resolve-BdO8BFFi.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_auth_profiles = require("./auth-profiles-DQeiAyJi.cjs");
const require_usage_state = require("./usage-state-CfaEuTkC.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_session_runtime_compat = require("./session-runtime-compat-B8Zu61mN.cjs");
const require_model_auth_env = require("./model-auth-env-C9t8YSK1.cjs");
const require_cleanup = require("./cleanup-Do0eFW35.cjs");
const require_queue = require("./queue-BObg9z8c.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
const require_model_overrides = require("./model-overrides-BvSxD3wH.cjs");
const require_session_patch_hooks = require("./session-patch-hooks-B0T7VvLF.cjs");
const require_fast_mode$1 = require("./fast-mode-0YvHCt-K.cjs");
const require_thinking_runtime = require("./thinking-runtime-CrpgBgYy.cjs");
const require_auth = require("./auth-Bk8NmCMz.cjs");
require("./sandbox-CjshBxRn.cjs");
const require_bash_tools_exec_runtime = require("./bash-tools.exec-runtime-Bs5anBBF.cjs");
const require_exec_defaults = require("./exec-defaults-DvQXwpzS.cjs");
const require_session_snapshot_merge = require("./session-snapshot-merge-BloJoO_g.cjs");
const require_model_runtime = require("./model-runtime-CROqjzrf.cjs");
const require_runtime_policy_session_key = require("./runtime-policy-session-key-B2t93Xcz.cjs");
const require_session_entry_persistence = require("./session-entry-persistence-CBNb94X1.cjs");
const require_commands_models = require("./commands-models-CDtaR6nW.cjs");
const require_level_overrides = require("./level-overrides-CI02u-AL.cjs");
const require_directive_handling_shared = require("./directive-handling.shared-DPV7dkCW.cjs");
const require_directive_handling_model_selection = require("./directive-handling.model-selection-Ceen69Wf.cjs");
const require_auth_health = require("./auth-health-Cc9z45kH.cjs");
const require_secret_mask = require("./secret-mask-if3T4TYf.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/directive-handling.auth.ts
function resolveStoredCredentialLabel(params) {
	const masked = require_secret_mask.maskApiKey(typeof params.value === "string" ? params.value : "");
	if (masked !== "missing") return masked;
	if (require_types_secrets.coerceSecretRef(params.refValue)) return params.mode === "compact" ? "(ref)" : "ref";
	return "missing";
}
function formatExpirationLabel(expires, now, formatUntil, compactExpiredPrefix = " expired") {
	const timestampMs = (0, require_number_coercion.number_coercion_exports.asDateTimestampMs)(expires);
	if (timestampMs === void 0 || timestampMs <= 0) return "";
	return timestampMs <= now ? compactExpiredPrefix : ` exp ${formatUntil(timestampMs)}`;
}
function formatFlagsSuffix(flags) {
	return flags.length > 0 ? ` (${flags.join(", ")})` : "";
}
function isStoredAuthProfileType(value) {
	return value === "api_key" || value === "oauth" || value === "token";
}
/** Resolves the displayed auth source for a provider without exposing secrets. */
const resolveAuthLabel = async (provider, cfg, modelsPath, agentDir, mode = "compact", workspaceDir, options) => {
	const formatPath = (value) => require_utils.shortenHomePath(value);
	const store = require_store.ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
	const rawOrder = require_order.resolveAuthProfileOrder({
		cfg,
		store,
		provider
	});
	const acceptedProfileTypes = options?.acceptedProfileTypes ? new Set(options.acceptedProfileTypes) : void 0;
	const order = acceptedProfileTypes ? rawOrder.filter((profileId) => {
		const profile = store.profiles[profileId];
		if (profile) return acceptedProfileTypes.has(profile.type);
		const configuredMode = cfg.auth?.profiles?.[profileId]?.mode;
		return isStoredAuthProfileType(configuredMode) ? acceptedProfileTypes.has(configuredMode) : true;
	}) : rawOrder;
	const providerKey = require_model_selection_normalize.normalizeProviderId(provider);
	const lastGood = require_model_selection_normalize.findNormalizedProviderValue(store.lastGood, providerKey);
	const nextProfileId = order[0];
	const now = Date.now();
	const formatUntil = (timestampMs) => require_auth_health.formatRemainingShort(timestampMs - now, { underMinuteLabel: "soon" });
	if (order.length > 0) {
		if (mode === "compact") {
			const profileId = nextProfileId;
			if (!profileId) return {
				label: "missing",
				source: "missing"
			};
			const profile = store.profiles[profileId];
			const configProfile = cfg.auth?.profiles?.[profileId];
			const configOnlyAwsSdk = !profile ? require_order.isConfiguredAwsSdkAuthProfileForProvider({
				cfg,
				provider,
				profileId
			}) : false;
			const more = order.length > 1 ? ` (+${order.length - 1})` : "";
			if (configOnlyAwsSdk) return {
				label: `${profileId} aws-sdk${more}`,
				source: ""
			};
			if (!profile || configProfile?.provider && configProfile.provider !== profile.provider || configProfile?.mode && configProfile.mode !== profile.type && !(configProfile.mode === "oauth" && profile.type === "token")) return {
				label: `${profileId} missing${more}`,
				source: ""
			};
			if (profile.type === "api_key") return {
				label: `${profileId} api-key ${resolveStoredCredentialLabel({
					value: profile.key,
					refValue: profile.keyRef,
					mode
				})}${more}`,
				source: ""
			};
			if (profile.type === "token") return {
				label: `${profileId} token ${resolveStoredCredentialLabel({
					value: profile.token,
					refValue: profile.tokenRef,
					mode
				})}${formatExpirationLabel(profile.expires, now, formatUntil)}${more}`,
				source: ""
			};
			const display = require_auth_profiles.resolveAuthProfileDisplayLabel({
				cfg,
				store,
				profileId
			});
			return {
				label: `${display === profileId ? profileId : display} oauth${formatExpirationLabel(profile.expires, now, formatUntil)}${more}`,
				source: ""
			};
		}
		return {
			label: order.map((profileId) => {
				const profile = store.profiles[profileId];
				const configProfile = cfg.auth?.profiles?.[profileId];
				const flags = [];
				if (profileId === nextProfileId) flags.push("next");
				if (lastGood && profileId === lastGood) flags.push("lastGood");
				if (require_usage_state.isProfileInCooldown(store, profileId)) {
					const until = store.usageStats?.[profileId]?.cooldownUntil;
					if (typeof until === "number" && Number.isFinite(until) && until > now) flags.push(`cooldown ${formatUntil(until)}`);
					else flags.push("cooldown");
				}
				if (!profile && require_order.isConfiguredAwsSdkAuthProfileForProvider({
					cfg,
					provider,
					profileId
				})) return `${profileId}=aws-sdk${formatFlagsSuffix(flags)}`;
				if (!profile || configProfile?.provider && configProfile.provider !== profile.provider || configProfile?.mode && configProfile.mode !== profile.type && !(configProfile.mode === "oauth" && profile.type === "token")) return `${profileId}=missing${formatFlagsSuffix(flags)}`;
				if (profile.type === "api_key") return `${profileId}=${resolveStoredCredentialLabel({
					value: profile.key,
					refValue: profile.keyRef,
					mode
				})}${formatFlagsSuffix(flags)}`;
				if (profile.type === "token") {
					const tokenLabel = resolveStoredCredentialLabel({
						value: profile.token,
						refValue: profile.tokenRef,
						mode
					});
					const expirationFlag = formatExpirationLabel(profile.expires, now, formatUntil, "expired");
					if (expirationFlag) flags.push(expirationFlag);
					return `${profileId}=token:${tokenLabel}${formatFlagsSuffix(flags)}`;
				}
				const display = require_auth_profiles.resolveAuthProfileDisplayLabel({
					cfg,
					store,
					profileId
				});
				const suffix = display === profileId ? "" : display.startsWith(profileId) ? display.slice(profileId.length).trim() : `(${display})`;
				const expirationFlag = formatExpirationLabel(profile.expires, now, formatUntil, "expired");
				if (expirationFlag) flags.push(expirationFlag);
				return `${profileId}=OAuth${suffix ? ` ${suffix}` : ""}${formatFlagsSuffix(flags)}`;
			}).join(", "),
			source: `auth-profiles.json: ${formatPath(require_path_resolve.resolveAuthStorePathForDisplay(agentDir))}`
		};
	}
	const envKey = require_model_auth_env.resolveEnvApiKey(provider, process.env, {
		config: cfg,
		workspaceDir
	});
	if (envKey) return {
		label: envKey.source.includes("ANTHROPIC_OAUTH_TOKEN") || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(envKey.source).includes("oauth") ? "OAuth (env)" : require_secret_mask.maskApiKey(envKey.apiKey),
		source: mode === "verbose" ? envKey.source : ""
	};
	const customKey = require_model_auth.resolveUsableCustomProviderApiKey({
		cfg,
		provider
	})?.apiKey;
	if (customKey) return {
		label: require_secret_mask.maskApiKey(customKey),
		source: mode === "verbose" ? `models.json: ${formatPath(modelsPath)}` : ""
	};
	return {
		label: "missing",
		source: "missing"
	};
};
/** Formats an auth label plus source for one-line status output. */
const formatAuthLabel = (auth) => {
	if (!auth.source || auth.source === auth.label || auth.source === "missing") return auth.label;
	return `${auth.label} (${auth.source})`;
};
//#endregion
//#region src/auto-reply/reply/directive-handling.model-picker.ts
/** Resolves optional endpoint/API labels for a provider in picker details. */
function resolveProviderEndpointLabel(provider, cfg) {
	const normalized = require_model_selection_normalize.normalizeProviderId(provider);
	const entry = require_model_selection_normalize.findNormalizedProviderValue(cfg.models?.providers ?? {}, normalized);
	const endpoint = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.baseUrl);
	const api = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.api);
	return {
		endpoint: endpoint || void 0,
		api: api || void 0
	};
}
//#endregion
//#region src/auto-reply/reply/directive-handling.model.ts
function isMissingAuthLabel(auth) {
	return auth.label === "missing" && auth.source === "missing";
}
function resolveStatusHarnessRuntime(params) {
	const sessionRuntime = require_session_runtime_compat.resolveSessionRuntimeOverrideForProvider({
		provider: params.provider,
		entry: params.sessionEntry,
		cfg: params.cfg
	});
	if (sessionRuntime) return sessionRuntime;
	return params.defaultRuntime;
}
function resolveStatusAcceptedProfileTypes(params) {
	if (require_model_selection_normalize.normalizeProviderId(params.provider) !== "openai" || params.harnessRuntime === "codex") return;
	return ["api_key"];
}
async function resolveStatusAuthLabel(params) {
	const provider = require_model_selection_normalize.normalizeProviderId(params.provider);
	const harnessPolicy = require_policy.resolveAgentHarnessPolicy({
		provider,
		modelId: params.modelId,
		config: params.cfg,
		agentId: params.activeAgentId
	});
	const harnessRuntime = resolveStatusHarnessRuntime({
		sessionEntry: params.sessionEntry,
		defaultRuntime: harnessPolicy.runtime,
		provider,
		cfg: params.cfg
	});
	const auth = await resolveAuthLabel(params.provider, params.cfg, params.modelsPath, params.agentDir, params.authMode, params.workspaceDir, { acceptedProfileTypes: resolveStatusAcceptedProfileTypes({
		provider,
		harnessRuntime
	}) });
	if (!isMissingAuthLabel(auth)) return formatAuthLabel(auth);
	const effectiveAuthProvider = require_auth.buildAgentRuntimeAuthPlan({
		provider,
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		harnessRuntime
	}).harnessAuthProvider;
	if (!effectiveAuthProvider || effectiveAuthProvider === provider) return formatAuthLabel(auth);
	const runtimeAuth = await resolveAuthLabel(effectiveAuthProvider, params.cfg, params.modelsPath, params.agentDir, params.authMode, params.workspaceDir);
	if (isMissingAuthLabel(runtimeAuth)) return formatAuthLabel(auth);
	return `via ${harnessRuntime} runtime / ${effectiveAuthProvider} ${formatAuthLabel(runtimeAuth)}`;
}
function pushUniqueCatalogEntry(params) {
	const provider = require_model_selection_normalize.normalizeProviderId(params.provider);
	const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.id) ?? "";
	if (!provider || !id) return;
	const key = require_model_selection_normalize.modelKey(provider, id);
	if (params.keys.has(key)) return;
	params.keys.add(key);
	params.out.push({
		provider,
		id,
		name: params.fallbackNameToId ? params.name ?? id : params.name
	});
}
function buildModelPickerCatalog(params) {
	const resolvedDefault = require_model_selection_shared.resolveConfiguredModelRef({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel
	});
	const buildConfiguredCatalog = () => {
		const out = [];
		const keys = /* @__PURE__ */ new Set();
		const pushRef = (ref, name) => {
			pushUniqueCatalogEntry({
				keys,
				out,
				provider: ref.provider,
				id: ref.model,
				name,
				fallbackNameToId: true
			});
		};
		const pushRaw = (raw) => {
			const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "";
			if (!value) return;
			const resolved = require_model_selection_shared.resolveModelRefFromString({
				raw: value,
				defaultProvider: params.defaultProvider,
				aliasIndex: params.aliasIndex
			});
			if (!resolved) return;
			pushRef(resolved.ref);
		};
		pushRef(resolvedDefault);
		const modelConfig = params.cfg.agents?.defaults?.model;
		const modelFallbacks = modelConfig && typeof modelConfig === "object" ? modelConfig.fallbacks ?? [] : [];
		for (const fallback of modelFallbacks) pushRaw(fallback ?? "");
		const imageConfig = params.cfg.agents?.defaults?.imageModel;
		if (imageConfig && typeof imageConfig === "object") {
			pushRaw(imageConfig.primary);
			for (const fallback of imageConfig.fallbacks ?? []) pushRaw(fallback ?? "");
		}
		for (const raw of Object.keys(params.cfg.agents?.defaults?.models ?? {})) pushRaw(raw);
		return out;
	};
	const keys = /* @__PURE__ */ new Set();
	const out = [];
	const push = (entry) => {
		pushUniqueCatalogEntry({
			keys,
			out,
			provider: entry.provider,
			id: entry.id ?? "",
			name: entry.name,
			fallbackNameToId: false
		});
	};
	if (!(Object.keys(params.cfg.agents?.defaults?.models ?? {}).length > 0)) {
		for (const entry of params.allowedModelCatalog) push({
			provider: entry.provider,
			id: entry.id ?? "",
			name: entry.name
		});
		for (const entry of buildConfiguredCatalog()) push(entry);
		return out;
	}
	for (const entry of params.allowedModelCatalog) push({
		provider: entry.provider,
		id: entry.id ?? "",
		name: entry.name
	});
	for (const raw of Object.keys(params.cfg.agents?.defaults?.models ?? {})) {
		const resolved = require_model_selection_shared.resolveModelRefFromString({
			raw,
			defaultProvider: params.defaultProvider,
			aliasIndex: params.aliasIndex
		});
		if (!resolved) continue;
		push({
			provider: resolved.ref.provider,
			id: resolved.ref.model,
			name: resolved.ref.model
		});
	}
	if (resolvedDefault.model) push({
		provider: resolvedDefault.provider,
		id: resolvedDefault.model,
		name: resolvedDefault.model
	});
	return out;
}
function filterMissingAuthNestedProviderDuplicates(params) {
	const configuredKeys = new Set(require_model_selection_shared.buildConfiguredModelCatalog({ cfg: params.cfg }).map((entry) => require_model_selection_normalize.modelKey(entry.provider, entry.id)));
	const wrapperKeys = /* @__PURE__ */ new Set();
	for (const entry of params.entries) {
		const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.id) ?? "";
		const slash = id.indexOf("/");
		if (slash <= 0) continue;
		const nestedProvider = require_model_selection_normalize.normalizeProviderId(id.slice(0, slash));
		const nestedModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(id.slice(slash + 1)) ?? "";
		const wrapperProvider = require_model_selection_normalize.normalizeProviderId(entry.provider);
		if (!nestedProvider || !nestedModel || nestedProvider === wrapperProvider) continue;
		wrapperKeys.add(require_model_selection_normalize.modelKey(nestedProvider, nestedModel));
	}
	if (wrapperKeys.size === 0) return params.entries;
	return params.entries.filter((entry) => {
		const provider = require_model_selection_normalize.normalizeProviderId(entry.provider);
		const key = require_model_selection_normalize.modelKey(provider, (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.id) ?? "");
		if (configuredKeys.has(key)) return true;
		return params.authByProvider.get(provider) !== "missing" || !wrapperKeys.has(key);
	});
}
async function maybeHandleModelDirectiveInfo(params) {
	if (!params.directives.hasModelDirective) return;
	const rawDirective = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.directives.rawModelDirective);
	const directive = rawDirective ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(rawDirective) : void 0;
	const wantsStatus = directive === "status";
	const wantsSummary = !rawDirective;
	const wantsLegacyList = directive === "list";
	if (!wantsSummary && !wantsStatus && !wantsLegacyList) return;
	if (params.directives.rawModelProfile) return { text: "Auth profile override requires a model selection." };
	const pickerCatalog = buildModelPickerCatalog({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		aliasIndex: params.aliasIndex,
		allowedModelCatalog: params.allowedModelCatalog
	});
	if (wantsLegacyList) return await require_commands_models.resolveModelsCommandReply({
		cfg: params.cfg,
		commandBodyNormalized: "/models",
		surface: params.surface,
		currentModel: `${params.provider}/${params.model}`,
		agentId: params.activeAgentId,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		sessionEntry: isCompleteSessionEntry(params.sessionEntry) ? params.sessionEntry : void 0
	}) ?? { text: "No models available." };
	if (wantsSummary) {
		const modelRefs = require_model_runtime.resolveSelectedAndActiveModel({
			selectedProvider: params.provider,
			selectedModel: params.model,
			sessionEntry: params.sessionEntry
		});
		const current = modelRefs.selected.label;
		const activeRuntimeLine = modelRefs.activeDiffers ? `Active: ${modelRefs.active.label} (runtime)` : null;
		const channelData = (params.surface ? require_registry.getChannelPlugin(params.surface) : null)?.commands?.buildModelBrowseChannelData?.();
		if (channelData) return {
			text: [
				`Current: ${current}${modelRefs.activeDiffers ? " (selected)" : ""}`,
				activeRuntimeLine,
				"",
				"Tap below to browse models, or use:",
				"/model <provider/model> to switch",
				"/model <provider/model> --runtime <runtime> to switch harnesses",
				"/model status for details"
			].filter(Boolean).join("\n"),
			channelData
		};
		return { text: [
			`Current: ${current}${modelRefs.activeDiffers ? " (selected)" : ""}`,
			activeRuntimeLine,
			"",
			"Switch: /model <provider/model>",
			"Runtime: /model <provider/model> --runtime <runtime>",
			"Browse: /models (providers) or /models <provider> (models)",
			"More: /model status"
		].filter(Boolean).join("\n") };
	}
	const modelsPath = `${params.agentDir}/models.json`;
	const formatPath = (value) => require_utils.shortenHomePath(value);
	const authMode = "verbose";
	if (pickerCatalog.length === 0) return { text: "No models available." };
	const authByProvider = /* @__PURE__ */ new Map();
	for (const entry of pickerCatalog) {
		const provider = require_model_selection_normalize.normalizeProviderId(entry.provider);
		if (authByProvider.has(provider)) continue;
		const authLabel = await resolveStatusAuthLabel({
			provider,
			modelId: entry.id,
			cfg: params.cfg,
			modelsPath,
			agentDir: params.agentDir,
			activeAgentId: params.activeAgentId,
			authMode,
			workspaceDir: params.workspaceDir,
			sessionEntry: params.sessionEntry
		});
		authByProvider.set(provider, authLabel);
	}
	const modelRefs = require_model_runtime.resolveSelectedAndActiveModel({
		selectedProvider: params.provider,
		selectedModel: params.model,
		sessionEntry: params.sessionEntry
	});
	const current = modelRefs.selected.label;
	const defaultLabel = `${params.defaultProvider}/${params.defaultModel}`;
	const lines = [
		`Current: ${current}${modelRefs.activeDiffers ? " (selected)" : ""}`,
		modelRefs.activeDiffers ? `Active: ${modelRefs.active.label} (runtime)` : null,
		`Default: ${defaultLabel}`,
		`Agent: ${params.activeAgentId}`,
		`Auth file: ${formatPath(require_path_resolve.resolveAuthStorePathForDisplay(params.agentDir))}`
	].filter((line) => Boolean(line));
	if (params.resetModelOverride) lines.push(`(previous selection reset to default)`);
	const byProvider = /* @__PURE__ */ new Map();
	const statusCatalog = filterMissingAuthNestedProviderDuplicates({
		cfg: params.cfg,
		entries: pickerCatalog,
		authByProvider
	});
	for (const entry of statusCatalog) {
		const provider = require_model_selection_normalize.normalizeProviderId(entry.provider);
		const models = byProvider.get(provider);
		if (models) {
			models.push(entry);
			continue;
		}
		byProvider.set(provider, [entry]);
	}
	for (const provider of byProvider.keys()) {
		const models = byProvider.get(provider);
		if (!models) continue;
		const authLabel = authByProvider.get(provider) ?? "missing";
		const endpoint = resolveProviderEndpointLabel(provider, params.cfg);
		const endpointSuffix = endpoint.endpoint ? ` endpoint: ${endpoint.endpoint}` : " endpoint: default";
		const apiSuffix = endpoint.api ? ` api: ${endpoint.api}` : "";
		lines.push("");
		lines.push(`[${provider}]${endpointSuffix}${apiSuffix} auth: ${authLabel}`);
		for (const entry of models) {
			const label = `${provider}/${entry.id}`;
			const aliases = params.aliasIndex.byKey.get(label);
			const aliasSuffix = aliases && aliases.length > 0 ? ` (${aliases.join(", ")})` : "";
			lines.push(`  • ${label}${aliasSuffix}`);
		}
	}
	return { text: lines.join("\n") };
}
function isCompleteSessionEntry(entry) {
	return Boolean(entry && typeof entry.sessionId === "string" && typeof entry.updatedAt === "number");
}
//#endregion
//#region src/auto-reply/reply/directive-handling.queue-validation.ts
/** Validates `/queue` directives and returns immediate status/error replies. */
function maybeHandleQueueDirective(params) {
	const { directives } = params;
	if (!directives.hasQueueDirective) return;
	if (!directives.queueMode && !directives.queueReset && !directives.hasQueueOptions && directives.rawQueueMode === void 0 && directives.rawDebounce === void 0 && directives.rawCap === void 0 && directives.rawDrop === void 0) {
		const settings = require_queue.resolveQueueSettings$1({
			cfg: params.cfg,
			channel: params.channel,
			sessionEntry: params.sessionEntry
		});
		const debounceLabel = typeof settings.debounceMs === "number" ? `${settings.debounceMs}ms` : "default";
		const capLabel = typeof settings.cap === "number" ? String(settings.cap) : "default";
		const dropLabel = settings.dropPolicy ?? "default";
		return { text: require_directive_handling_shared.withOptions(`Current queue settings: mode=${settings.mode}, debounce=${debounceLabel}, cap=${capLabel}, drop=${dropLabel}.`, "modes steer, followup, collect, interrupt; debounce:<ms|s|m>, cap:<n>, drop:old|new|summarize") };
	}
	const queueModeInvalid = !directives.queueMode && !directives.queueReset && Boolean(directives.rawQueueMode);
	const queueDebounceInvalid = directives.rawDebounce !== void 0 && typeof directives.debounceMs !== "number";
	const queueCapInvalid = directives.rawCap !== void 0 && typeof directives.cap !== "number";
	const queueDropInvalid = directives.rawDrop !== void 0 && !directives.dropPolicy;
	if (queueModeInvalid || queueDebounceInvalid || queueCapInvalid || queueDropInvalid) {
		const errors = [];
		if (queueModeInvalid) errors.push(`Unrecognized queue mode "${directives.rawQueueMode ?? ""}". Valid modes: steer, followup, collect, interrupt.`);
		if (queueDebounceInvalid) errors.push(`Invalid debounce "${directives.rawDebounce ?? ""}". Use ms/s/m (e.g. debounce:1500ms, debounce:2s).`);
		if (queueCapInvalid) errors.push(`Invalid cap "${directives.rawCap ?? ""}". Use a positive integer (e.g. cap:10).`);
		if (queueDropInvalid) errors.push(`Invalid drop policy "${directives.rawDrop ?? ""}". Use drop:old, drop:new, or drop:summarize.`);
		return { text: errors.join(" ") };
	}
}
//#endregion
//#region src/auto-reply/reply/directive-handling.impl.ts
/** Applies directive-only command state changes without running the agent. */
/** Handles inline directives that can be acknowledged without a model turn. */
async function handleDirectiveOnly(params) {
	const { directives, sessionEntry, sessionStore, sessionKey, storePath, elevatedEnabled, elevatedAllowed, defaultProvider, defaultModel, aliasIndex, allowedModelKeys, allowedModelCatalog, resetModelOverride, provider, model, initialModelLabel, formatModelSwitchEvent, currentThinkLevel, currentFastMode, currentVerboseLevel, currentReasoningLevel, currentElevatedLevel } = params;
	const delegatedTraceAllowed = (params.gatewayClientScopes ?? []).includes("operator.admin");
	if (directives.hasTraceDirective && !params.senderIsOwner && !delegatedTraceAllowed) return { text: "❌ /trace is restricted to owners and gateway clients with operator.admin scope." };
	const activeAgentId = require_agent_scope.resolveSessionAgentId({
		sessionKey: params.sessionKey,
		config: params.cfg
	});
	const agentDir = require_agent_scope_config.resolveAgentDir(params.cfg, activeAgentId);
	const runtimePolicySessionKey = require_runtime_policy_session_key.resolveRuntimePolicySessionKey({
		cfg: params.cfg,
		ctx: params.ctx,
		sessionKey: params.sessionKey
	});
	const runtimeIsSandboxed = require_runtime_status.resolveSandboxRuntimeStatus({
		cfg: params.cfg,
		sessionKey: runtimePolicySessionKey
	}).sandboxed;
	const shouldHintDirectRuntime = directives.hasElevatedDirective && !runtimeIsSandboxed;
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
	const modelInfo = await maybeHandleModelDirectiveInfo({
		directives,
		cfg: params.cfg,
		agentDir,
		activeAgentId,
		provider,
		model,
		defaultProvider,
		defaultModel,
		aliasIndex,
		allowedModelCatalog,
		resetModelOverride,
		workspaceDir: params.workspaceDir,
		surface: params.surface,
		sessionEntry
	});
	if (modelInfo) return modelInfo;
	const modelResolution = require_directive_handling_model_selection.resolveModelSelectionFromDirective({
		directives,
		cfg: params.cfg,
		agentDir,
		defaultProvider,
		defaultModel,
		aliasIndex,
		allowedModelKeys,
		allowedModelCatalog,
		provider
	});
	if (modelResolution.errorText) return { text: modelResolution.errorText };
	const modelSelection = modelResolution.modelSelection;
	const profileOverride = modelResolution.profileOverride;
	if (modelSelection && require_model_overrides.isModelSelectionLocked(sessionEntry)) return { text: require_model_overrides.MODEL_SELECTION_LOCKED_MESSAGE };
	const resolvedProvider = modelSelection?.provider ?? provider;
	const resolvedModel = modelSelection?.model ?? model;
	const modelRuntimeResolution = modelSelection ? require_directive_handling_shared.resolveModelRuntimeDirective({
		rawRuntime: directives.rawModelRuntime,
		provider: resolvedProvider,
		cfg: params.cfg,
		sessionEntry
	}) : { kind: "unchanged" };
	if (modelRuntimeResolution.kind === "invalid") return { text: modelRuntimeResolution.errorText };
	const prospectiveSessionEntry = { ...sessionEntry };
	require_directive_handling_shared.applyModelRuntimeDirective(prospectiveSessionEntry, modelRuntimeResolution);
	const thinkingRuntime = require_thinking_runtime.resolveEffectiveAgentRuntime({
		cfg: params.cfg,
		provider: resolvedProvider,
		modelId: resolvedModel,
		agentId: activeAgentId,
		sessionKey: runtimePolicySessionKey,
		sessionEntry: prospectiveSessionEntry
	});
	const thinkingCatalog = params.thinkingCatalog && params.thinkingCatalog.length > 0 ? params.thinkingCatalog : allowedModelCatalog.length > 0 ? allowedModelCatalog : void 0;
	const fastModeState = require_fast_mode$1.resolveFastModeState({
		cfg: params.cfg,
		provider: resolvedProvider,
		model: resolvedModel,
		agentId: activeAgentId,
		sessionEntry: directives.clearFastMode ? void 0 : sessionEntry
	});
	const effectiveFastMode = directives.fastMode ?? (directives.clearFastMode ? fastModeState.mode : currentFastMode) ?? fastModeState.mode;
	const effectiveFastModeSource = directives.fastMode !== void 0 ? "session" : fastModeState.source;
	if (directives.hasThinkDirective && !directives.thinkLevel && !directives.clearThinkLevel) {
		if (!directives.rawThinkLevel) return { text: require_directive_handling_shared.withOptions(`Current thinking level: ${require_thinking.resolveSupportedThinkingLevel({
			provider: resolvedProvider,
			model: resolvedModel,
			level: currentThinkLevel ?? "off",
			catalog: thinkingCatalog,
			agentRuntime: thinkingRuntime
		})}.`, `default, ${require_thinking.formatThinkingLevels(resolvedProvider, resolvedModel, ", ", thinkingCatalog, thinkingRuntime)}`) };
		return { text: `Unrecognized thinking level "${directives.rawThinkLevel}". Valid levels: default, ${require_thinking.formatThinkingLevels(resolvedProvider, resolvedModel, ", ", thinkingCatalog, thinkingRuntime)}.` };
	}
	if (directives.hasVerboseDirective && !directives.verboseLevel) {
		if (!directives.rawVerboseLevel) return { text: require_directive_handling_shared.withOptions(`Current verbose level: ${currentVerboseLevel ?? "off"}.`, "on, full, off") };
		return { text: `Unrecognized verbose level "${directives.rawVerboseLevel}". Valid levels: off, on, full.` };
	}
	if (directives.hasTraceDirective && !directives.traceLevel) {
		if (!directives.rawTraceLevel) return { text: require_directive_handling_shared.withOptions(`Current trace level: ${sessionEntry.traceLevel ?? "off"}.`, "on, off, raw") };
		return { text: `Unrecognized trace level "${directives.rawTraceLevel}". Valid levels: off, on, raw.` };
	}
	if (directives.hasFastDirective && directives.fastMode === void 0 && !directives.clearFastMode) {
		if (!directives.rawFastMode || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(directives.rawFastMode) === "status") {
			const statusText = require_fast_mode.formatFastModeCurrentStatus({
				mode: effectiveFastMode,
				source: effectiveFastModeSource,
				fastAutoOnSeconds: fastModeState.fastAutoOnSeconds
			});
			if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(directives.rawFastMode) === "status") return { text: statusText };
			return { text: require_directive_handling_shared.withOptions(statusText, require_fast_mode.formatFastModeCommandOptions({ fastAutoOnSeconds: fastModeState.fastAutoOnSeconds })) };
		}
		return { text: `Unrecognized fast mode "${directives.rawFastMode}". Valid levels: on, off, auto, default, status.` };
	}
	if (directives.hasReasoningDirective && !directives.reasoningLevel) {
		if (!directives.rawReasoningLevel) return { text: require_directive_handling_shared.withOptions(`Current reasoning level: ${currentReasoningLevel ?? "off"}.`, "on, off, stream") };
		return { text: `Unrecognized reasoning level "${directives.rawReasoningLevel}". Valid levels: on, off, stream.` };
	}
	if (directives.hasElevatedDirective && !directives.elevatedLevel) {
		if (!directives.rawElevatedLevel) {
			if (!elevatedEnabled || !elevatedAllowed) return { text: require_directive_handling_shared.formatElevatedUnavailableText({
				runtimeSandboxed: runtimeIsSandboxed,
				failures: params.elevatedFailures,
				sessionKey: params.sessionKey
			}) };
			return { text: [require_directive_handling_shared.withOptions(`Current elevated level: ${currentElevatedLevel ?? "off"}.`, "on, off, ask, full"), shouldHintDirectRuntime ? require_directive_handling_shared.formatElevatedRuntimeHint() : null].filter(Boolean).join("\n") };
		}
		return { text: `Unrecognized elevated level "${directives.rawElevatedLevel}". Valid levels: off, on, ask, full.` };
	}
	if (directives.hasElevatedDirective && (!elevatedEnabled || !elevatedAllowed)) return { text: require_directive_handling_shared.formatElevatedUnavailableText({
		runtimeSandboxed: runtimeIsSandboxed,
		failures: params.elevatedFailures,
		sessionKey: params.sessionKey
	}) };
	if (directives.hasExecDirective) {
		if (directives.invalidExecHost) return { text: `Unrecognized exec host "${directives.rawExecHost ?? ""}". Valid hosts: auto, sandbox, gateway, node.` };
		if (directives.invalidExecSecurity) return { text: `Unrecognized exec security "${directives.rawExecSecurity ?? ""}". Valid: deny, allowlist, full.` };
		if (directives.invalidExecAsk) return { text: `Unrecognized exec ask "${directives.rawExecAsk ?? ""}". Valid: off, on-miss, always.` };
		if (directives.invalidExecNode) return { text: "Exec node requires a value." };
		if (!directives.hasExecOptions) {
			const execDefaults = require_exec_defaults.resolveExecDefaults({
				cfg: params.cfg,
				sessionEntry,
				agentId: activeAgentId,
				sandboxAvailable: runtimeIsSandboxed
			});
			const nodeLabel = execDefaults.node ? `node=${execDefaults.node}` : "node=(unset)";
			return { text: require_directive_handling_shared.withOptions(`Current exec defaults: host=${require_bash_tools_exec_runtime.renderExecTargetLabel(execDefaults.host)}, effective=${execDefaults.effectiveHost}, security=${execDefaults.security}, ask=${execDefaults.ask}, ${nodeLabel}.`, "host=auto|sandbox|gateway|node, security=deny|allowlist|full, ask=off|on-miss|always, node=<id>") };
		}
	}
	const queueAck = maybeHandleQueueDirective({
		directives,
		cfg: params.cfg,
		channel: provider,
		sessionEntry
	});
	if (queueAck) return queueAck;
	if (directives.hasThinkDirective && directives.thinkLevel && !require_thinking.isThinkingLevelSupported({
		provider: resolvedProvider,
		model: resolvedModel,
		level: directives.thinkLevel,
		catalog: thinkingCatalog,
		agentRuntime: thinkingRuntime
	})) return { text: `Thinking level "${directives.thinkLevel}" is not supported for ${resolvedProvider}/${resolvedModel}. Use one of: ${require_thinking.formatThinkingLevels(resolvedProvider, resolvedModel, ", ", thinkingCatalog, thinkingRuntime)}.` };
	const resolvedDirectiveThinkLevel = directives.thinkLevel;
	const nextThinkLevel = directives.hasThinkDirective ? resolvedDirectiveThinkLevel : sessionEntry?.thinkingLevel ?? currentThinkLevel;
	const remappedUnsupportedThinkLevel = !directives.hasThinkDirective && nextThinkLevel && !require_thinking.isThinkingLevelSupported({
		provider: resolvedProvider,
		model: resolvedModel,
		level: nextThinkLevel,
		catalog: thinkingCatalog,
		agentRuntime: thinkingRuntime
	}) ? require_thinking.resolveSupportedThinkingLevel({
		provider: resolvedProvider,
		model: resolvedModel,
		level: nextThinkLevel,
		catalog: thinkingCatalog,
		agentRuntime: thinkingRuntime
	}) : void 0;
	const shouldRemapUnsupportedThinkLevel = Boolean(remappedUnsupportedThinkLevel) && remappedUnsupportedThinkLevel !== nextThinkLevel;
	const prevElevatedLevel = currentElevatedLevel ?? sessionEntry.elevatedLevel ?? (elevatedAllowed ? "on" : "off");
	const prevReasoningLevel = currentReasoningLevel ?? sessionEntry.reasoningLevel ?? "off";
	let elevatedChanged = directives.hasElevatedDirective && directives.elevatedLevel !== void 0 && elevatedEnabled && elevatedAllowed;
	let modelSelectionUpdated = false;
	let modelSelectionApplied = true;
	let sessionChangesApplied = true;
	let appliedSessionEntry = sessionEntry;
	const touchedSessionFields = require_directive_handling_shared.resolveDirectiveTouchedSessionFields({
		directives,
		allowInternalExecPersistence,
		allowInternalVerbosePersistence
	});
	if (shouldRemapUnsupportedThinkLevel && !touchedSessionFields.includes("thinkingLevel")) touchedSessionFields.push("thinkingLevel");
	const shouldPersistSessionEntry = directives.hasThinkDirective && (Boolean(directives.thinkLevel) || directives.clearThinkLevel) || directives.hasFastDirective && (directives.fastMode !== void 0 || directives.clearFastMode) || directives.hasVerboseDirective && Boolean(directives.verboseLevel) && allowInternalVerbosePersistence || directives.hasTraceDirective && Boolean(directives.traceLevel) || directives.hasReasoningDirective && Boolean(directives.reasoningLevel) || directives.hasElevatedDirective && Boolean(directives.elevatedLevel) || directives.hasExecDirective && directives.hasExecOptions && allowInternalExecPersistence || Boolean(modelSelection) || directives.hasQueueDirective || shouldRemapUnsupportedThinkLevel;
	const fastModeChanged = directives.hasFastDirective && directives.fastMode !== void 0 && directives.fastMode !== currentFastMode || directives.clearFastMode && currentFastMode !== fastModeState.mode;
	let reasoningChanged = directives.hasReasoningDirective && directives.reasoningLevel !== void 0;
	if (shouldPersistSessionEntry) {
		const initialSessionEntry = { ...sessionEntry };
		if (directives.clearThinkLevel) delete sessionEntry.thinkingLevel;
		else if (directives.hasThinkDirective && directives.thinkLevel && resolvedDirectiveThinkLevel) sessionEntry.thinkingLevel = resolvedDirectiveThinkLevel;
		if (directives.clearFastMode) delete sessionEntry.fastMode;
		else if (directives.hasFastDirective && directives.fastMode !== void 0) sessionEntry.fastMode = directives.fastMode;
		if (shouldRemapUnsupportedThinkLevel && remappedUnsupportedThinkLevel) sessionEntry.thinkingLevel = remappedUnsupportedThinkLevel;
		if (directives.hasVerboseDirective && directives.verboseLevel && allowInternalVerbosePersistence) require_level_overrides.applyVerboseOverride(sessionEntry, directives.verboseLevel);
		if (directives.hasTraceDirective && directives.traceLevel) require_level_overrides.applyTraceOverride(sessionEntry, directives.traceLevel);
		if (directives.hasReasoningDirective && directives.reasoningLevel) {
			if (directives.reasoningLevel === "off") sessionEntry.reasoningLevel = "off";
			else sessionEntry.reasoningLevel = directives.reasoningLevel;
			reasoningChanged = directives.reasoningLevel !== prevReasoningLevel && directives.reasoningLevel !== void 0;
		}
		if (directives.hasElevatedDirective && directives.elevatedLevel) {
			sessionEntry.elevatedLevel = directives.elevatedLevel;
			elevatedChanged = elevatedChanged || directives.elevatedLevel !== prevElevatedLevel && directives.elevatedLevel !== void 0;
		}
		if (directives.hasExecDirective && directives.hasExecOptions && allowInternalExecPersistence) {
			if (directives.execHost) sessionEntry.execHost = directives.execHost;
			if (directives.execSecurity) sessionEntry.execSecurity = directives.execSecurity;
			if (directives.execAsk) sessionEntry.execAsk = directives.execAsk;
			if (directives.execNode) sessionEntry.execNode = directives.execNode;
		}
		if (modelSelection) {
			const applied = require_model_overrides.applyModelOverrideToSessionEntry({
				entry: sessionEntry,
				selection: modelSelection,
				profileOverride,
				markLiveSwitchPending: true
			});
			const appliedRuntime = require_directive_handling_shared.applyModelRuntimeDirective(sessionEntry, modelRuntimeResolution);
			modelSelectionUpdated = applied.updated || appliedRuntime.updated;
		}
		if (directives.hasQueueDirective && directives.queueReset) {
			delete sessionEntry.queueMode;
			delete sessionEntry.queueDebounceMs;
			delete sessionEntry.queueCap;
			delete sessionEntry.queueDrop;
		} else if (directives.hasQueueDirective) {
			if (directives.queueMode) sessionEntry.queueMode = directives.queueMode;
			if (typeof directives.debounceMs === "number") sessionEntry.queueDebounceMs = directives.debounceMs;
			if (typeof directives.cap === "number") sessionEntry.queueCap = directives.cap;
			if (directives.dropPolicy) sessionEntry.queueDrop = directives.dropPolicy;
		}
		sessionEntry.updatedAt = Date.now();
		sessionStore[sessionKey] = sessionEntry;
		if (storePath) {
			const persistence = await require_session_entry_persistence.persistReplySessionEntry({
				storePath,
				sessionKey,
				initialEntry: initialSessionEntry,
				entry: sessionEntry,
				reassertLiveModelSwitchPending: modelSelectionUpdated && sessionEntry.liveModelSwitchPending === true,
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
				if (modelSelection) modelSelectionApplied = sessionChangesApplied && require_session_snapshot_merge.sessionModelOverrideChangesApplied({
					initial: initialSessionEntry,
					next: sessionEntry,
					current: persistedEntry,
					reassertLiveModelSwitchPending: modelSelectionUpdated && sessionEntry.liveModelSwitchPending === true
				});
				require_session_snapshot_merge.adoptPersistedSessionSnapshot(sessionEntry, persistedEntry);
				appliedSessionEntry = sessionEntry;
			} else {
				if (persistence.entry) sessionStore[sessionKey] = persistence.entry;
				sessionChangesApplied = false;
				if (modelSelection) modelSelectionApplied = false;
			}
		}
		if (modelSelection && !modelSelectionApplied) sessionChangesApplied = false;
		if (!sessionChangesApplied) {
			if (params.persistenceState) params.persistenceState.sessionChangesApplied = false;
			return { text: modelSelection ? "Model change was not applied because the session changed. Retry." : "Session settings were not applied because the session changed. Retry." };
		}
		if (modelSelection && modelSelectionUpdated && modelSelectionApplied && sessionKey) {
			require_session_patch_hooks.triggerSessionPatchHook({
				cfg: params.cfg,
				sessionEntry: appliedSessionEntry,
				sessionKey,
				patch: {
					key: sessionKey,
					model: directives.rawModelDirective ?? `${modelSelection.provider}/${modelSelection.model}`
				}
			});
			require_cleanup.refreshQueuedFollowupSession({
				key: sessionKey,
				nextProvider: modelSelection.provider,
				nextModel: modelSelection.model,
				nextModelOverrideSource: "user",
				nextAuthProfileId: appliedSessionEntry.authProfileOverride,
				nextAuthProfileIdSource: appliedSessionEntry.authProfileOverrideSource,
				nextThinking: {
					level: appliedSessionEntry.thinkingLevel,
					catalog: thinkingCatalog,
					agentRuntime: require_thinking_runtime.resolveEffectiveAgentRuntime({
						cfg: params.cfg,
						provider: modelSelection.provider,
						modelId: modelSelection.model,
						agentId: activeAgentId,
						sessionKey: runtimePolicySessionKey,
						sessionEntry: appliedSessionEntry
					})
				}
			});
		}
	}
	if (modelSelection && modelSelectionApplied) {
		const nextLabel = `${modelSelection.provider}/${modelSelection.model}`;
		if (nextLabel !== initialModelLabel) require_system_events.enqueueSystemEvent(formatModelSwitchEvent(nextLabel, modelSelection.alias), {
			sessionKey,
			contextKey: `model:${nextLabel}`
		});
	}
	require_directive_handling_shared.enqueueModeSwitchEvents({
		enqueueSystemEvent: require_system_events.enqueueSystemEvent,
		sessionEntry: appliedSessionEntry,
		sessionKey,
		elevatedChanged,
		reasoningChanged
	});
	const parts = [];
	if (directives.clearThinkLevel) parts.push("Thinking level reset to default.");
	else if (directives.hasThinkDirective && directives.thinkLevel) {
		const displayedThinkLevel = resolvedDirectiveThinkLevel ?? directives.thinkLevel;
		parts.push(displayedThinkLevel === "off" ? "Thinking disabled." : `Thinking level set to ${displayedThinkLevel}.`);
		if (directives.thinkLevel === "max" && displayedThinkLevel !== "max") parts.push(`max not supported for ${resolvedProvider}/${resolvedModel}; using ${displayedThinkLevel}.`);
	}
	if (directives.clearFastMode) parts.push(require_directive_handling_shared.formatDirectiveAck("Fast mode reset to default."));
	else if (directives.hasFastDirective && directives.fastMode !== void 0) parts.push(directives.fastMode === "auto" ? require_directive_handling_shared.formatDirectiveAck("Fast mode set to auto.") : directives.fastMode ? require_directive_handling_shared.formatDirectiveAck("Fast mode enabled.") : require_directive_handling_shared.formatDirectiveAck("Fast mode disabled."));
	if (directives.hasVerboseDirective && directives.verboseLevel) parts.push(!allowInternalVerbosePersistence ? require_directive_handling_shared.formatDirectiveAck(require_directive_handling_shared.formatInternalVerboseCurrentReplyOnlyText()) : directives.verboseLevel === "off" ? require_directive_handling_shared.formatDirectiveAck("Verbose logging disabled.") : directives.verboseLevel === "full" ? require_directive_handling_shared.formatDirectiveAck("Verbose logging set to full.") : require_directive_handling_shared.formatDirectiveAck("Verbose logging enabled."));
	if (directives.hasTraceDirective && directives.traceLevel) parts.push(directives.traceLevel === "off" ? require_directive_handling_shared.formatDirectiveAck("Trace disabled.") : directives.traceLevel === "raw" ? require_directive_handling_shared.formatDirectiveAck("Trace set to raw. Warning: trace output may contain sensitive information.") : require_directive_handling_shared.formatDirectiveAck("Trace enabled. Warning: trace output may contain sensitive information."));
	if (directives.hasVerboseDirective && directives.verboseLevel && !allowInternalVerbosePersistence) parts.push(require_directive_handling_shared.formatDirectiveAck(require_directive_handling_shared.formatInternalVerbosePersistenceDeniedText()));
	if (directives.hasReasoningDirective && directives.reasoningLevel) parts.push(directives.reasoningLevel === "off" ? require_directive_handling_shared.formatDirectiveAck("Reasoning visibility disabled.") : directives.reasoningLevel === "stream" ? require_directive_handling_shared.formatDirectiveAck("Reasoning stream enabled.") : require_directive_handling_shared.formatDirectiveAck("Reasoning visibility enabled."));
	if (directives.hasElevatedDirective && directives.elevatedLevel) {
		parts.push(directives.elevatedLevel === "off" ? require_directive_handling_shared.formatDirectiveAck("Elevated mode disabled.") : directives.elevatedLevel === "full" ? require_directive_handling_shared.formatDirectiveAck("Elevated mode set to full (auto-approve).") : require_directive_handling_shared.formatDirectiveAck("Elevated mode set to ask (approvals may still apply)."));
		if (shouldHintDirectRuntime) parts.push(require_directive_handling_shared.formatElevatedRuntimeHint());
	}
	if (directives.hasExecDirective && directives.hasExecOptions && allowInternalExecPersistence) {
		const execParts = [];
		if (directives.execHost) execParts.push(`host=${directives.execHost}`);
		if (directives.execSecurity) execParts.push(`security=${directives.execSecurity}`);
		if (directives.execAsk) execParts.push(`ask=${directives.execAsk}`);
		if (directives.execNode) execParts.push(`node=${directives.execNode}`);
		if (execParts.length > 0) parts.push(require_directive_handling_shared.formatDirectiveAck(`Exec defaults set (${execParts.join(", ")}).`));
	}
	if (directives.hasExecDirective && directives.hasExecOptions && !allowInternalExecPersistence) parts.push(require_directive_handling_shared.formatDirectiveAck(require_directive_handling_shared.formatInternalExecPersistenceDeniedText()));
	if (!directives.hasThinkDirective && shouldRemapUnsupportedThinkLevel && remappedUnsupportedThinkLevel) parts.push(`Thinking level set to ${remappedUnsupportedThinkLevel} (${nextThinkLevel} not supported for ${resolvedProvider}/${resolvedModel}).`);
	if (modelSelection && modelSelectionApplied) {
		const label = `${modelSelection.provider}/${modelSelection.model}`;
		const labelWithAlias = modelSelection.alias ? `${modelSelection.alias} (${label})` : label;
		parts.push(modelSelection.isDefault ? `Model reset to default (${labelWithAlias}).` : `Model set to ${labelWithAlias} for this session.`);
		if (profileOverride) parts.push(`Auth profile set to ${profileOverride}.`);
		if (modelRuntimeResolution.kind === "clear") parts.push("Runtime reset to configured policy.");
		else if (modelRuntimeResolution.kind === "set") parts.push(`Runtime set to ${modelRuntimeResolution.runtime} for this session.`);
	} else if (modelSelection) parts.push("Model change was not applied because the session changed. Retry.");
	if (directives.hasQueueDirective && directives.queueMode) parts.push(require_directive_handling_shared.formatDirectiveAck(`Queue mode set to ${directives.queueMode}.`));
	else if (directives.hasQueueDirective && directives.queueReset) parts.push(require_directive_handling_shared.formatDirectiveAck("Queue mode reset to default."));
	if (directives.hasQueueDirective && typeof directives.debounceMs === "number") parts.push(require_directive_handling_shared.formatDirectiveAck(`Queue debounce set to ${directives.debounceMs}ms.`));
	if (directives.hasQueueDirective && typeof directives.cap === "number") parts.push(require_directive_handling_shared.formatDirectiveAck(`Queue cap set to ${directives.cap}.`));
	if (directives.hasQueueDirective && directives.dropPolicy) parts.push(require_directive_handling_shared.formatDirectiveAck(`Queue drop set to ${directives.dropPolicy}.`));
	if (fastModeChanged) {
		const nextFastMode = directives.clearFastMode ? fastModeState.mode : sessionEntry.fastMode;
		require_system_events.enqueueSystemEvent(nextFastMode === "auto" ? "Fast mode set to auto." : `Fast mode ${nextFastMode ? "enabled" : "disabled"}.`, {
			sessionKey,
			contextKey: `fast:${require_fast_mode.formatFastModeValue(nextFastMode)}`
		});
	}
	const ack = parts.join(" ").trim();
	if (!ack && directives.hasStatusDirective) return;
	return { text: ack || "OK." };
}
//#endregion
exports.handleDirectiveOnly = handleDirectiveOnly;
