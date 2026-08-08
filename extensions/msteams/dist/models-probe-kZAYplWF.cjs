const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
require("./workspace-oX0zfOZq.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_openclaw_agent_db = require("./openclaw-agent-db-CMNDs1oU.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_sqlite = require("./sqlite-CKOduXJ-.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profiles = require("./profiles-m8TkqupR.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_failover_error = require("./failover-error-voHYvp7k.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
const require_auth_profiles = require("./auth-profiles-DQeiAyJi.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_model_auth_env = require("./model-auth-env-C9t8YSK1.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_model_catalog = require("./model-catalog-BFgB2-Jk.cjs");
require("./shared-DHbcE08y.cjs");
const require_format = require("./format-Y6on_ttU.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let p_map = require("p-map");
p_map = require_rolldown_runtime.__toESM(p_map, 1);
//#region src/commands/models/list.probe.models.ts
/** Model candidate normalization and catalog selection for auth probes. */
/** Groups configured model candidates by their requested provider identity. */
function buildProbeCandidateMap(modelCandidates) {
	const map = /* @__PURE__ */ new Map();
	for (const raw of modelCandidates) {
		const parsed = require_model_selection_normalize.parseModelRef(raw ?? "", require_defaults.DEFAULT_PROVIDER);
		if (!parsed) continue;
		const list = map.get(parsed.provider) ?? [];
		if (!list.includes(parsed.model)) list.push(parsed.model);
		map.set(parsed.provider, list);
	}
	return map;
}
function catalogProbePriority(provider, modelId) {
	const id = modelId.trim().toLowerCase();
	if (provider !== "anthropic") return 50;
	if (/^claude-haiku-4-5-\d{8}$/.test(id)) return 0;
	if (id === "claude-haiku-4-5") return 1;
	if (id === "claude-sonnet-5" || id.startsWith("claude-sonnet-5-")) return 2;
	if (id === "claude-sonnet-4-6" || id.startsWith("claude-sonnet-4-6-")) return 3;
	if (id.startsWith("claude-sonnet-4-")) return 4;
	if (id.startsWith("claude-3-")) return 100;
	return 50;
}
/** Selects a requested-provider candidate before falling back to its catalog rows. */
function selectProbeModel(params) {
	const { provider, candidates, catalog } = params;
	const direct = candidates.get(provider);
	if (direct && direct.length > 0) return {
		provider,
		model: (0, _gabrielvfonseca_normalization_core.expectDefined)(direct[0], "direct entry at 0")
	};
	const fromCatalog = catalog.map((entry, index) => ({
		entry,
		index
	})).filter(({ entry }) => require_model_selection_normalize.normalizeProviderId(entry.provider) === provider).toSorted((left, right) => {
		return catalogProbePriority(provider, left.entry.id) - catalogProbePriority(provider, right.entry.id) || left.index - right.index;
	})[0]?.entry;
	return fromCatalog ? {
		provider,
		model: fromCatalog.id
	} : null;
}
//#endregion
//#region src/commands/models/list.probe.ts
/** Auth probe planning and execution helpers for model diagnostics. */
const PROBE_PROMPT = "Reply with OK. Do not use tools.";
/** Scrubs credential-shaped text before probe failures cross a UI or CLI boundary. */
function redactAuthProbeError(error) {
	return require_format.redactSecrets(error);
}
const embeddedRunnerModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./embedded-agent-C44j1_Yh.cjs")).then((n) => n.embedded_agent_exports));
function loadEmbeddedRunnerModule() {
	return embeddedRunnerModuleLoader.load();
}
/** Maps runtime failover reasons into stable auth probe status buckets. */
function mapFailoverReasonToProbeStatus(reason) {
	if (!reason) return "unknown";
	if (reason === "auth" || reason === "auth_permanent") return "auth";
	if (reason === "rate_limit" || reason === "overloaded") return "rate_limit";
	if (reason === "billing") return "billing";
	if (reason === "timeout") return "timeout";
	if (reason === "model_not_found") return "format";
	if (reason === "format") return "format";
	return "unknown";
}
function mapEligibilityReasonToProbeReasonCode(reasonCode) {
	if (reasonCode === "missing_credential") return "missing_credential";
	if (reasonCode === "expired") return "expired";
	if (reasonCode === "invalid_expires") return "invalid_expires";
	if (reasonCode === "unresolved_ref") return "unresolved_ref";
	return "ineligible_profile";
}
function formatMissingCredentialProbeError(reasonCode) {
	const legacyLine = "Auth profile credentials are missing or expired.";
	if (reasonCode === "expired") return `${legacyLine}\n↳ Auth reason [expired]: token credentials are expired.`;
	if (reasonCode === "invalid_expires") return `${legacyLine}\n↳ Auth reason [invalid_expires]: token expires must be a positive Unix ms timestamp.`;
	if (reasonCode === "missing_credential") return `${legacyLine}\n↳ Auth reason [missing_credential]: no inline credential or SecretRef is configured.`;
	if (reasonCode === "unresolved_ref") return `${legacyLine}\n↳ Auth reason [unresolved_ref]: configured SecretRef could not be resolved.`;
	return `${legacyLine}\n↳ Auth reason [ineligible_profile]: profile is incompatible with provider config.`;
}
function resolveProbeSecretRef(profile, cfg) {
	const defaults = cfg.secrets?.defaults;
	if (profile.type === "api_key") {
		if (require_types_secrets.normalizeSecretInputString(profile.key) !== void 0) return null;
		return require_types_secrets.coerceSecretRef(profile.keyRef, defaults);
	}
	if (profile.type === "token") {
		if (require_types_secrets.normalizeSecretInputString(profile.token) !== void 0) return null;
		return require_types_secrets.coerceSecretRef(profile.tokenRef, defaults);
	}
	return null;
}
function formatUnresolvedRefProbeError(refLabel) {
	return `Auth profile credentials are missing or expired.\n↳ Auth reason [unresolved_ref]: could not resolve SecretRef "${refLabel}".`;
}
function withDirectCredential(cfg, provider, value, mode) {
	const providers = cfg.models?.providers ?? {};
	const configKey = Object.keys(providers).find((key) => require_model_selection_normalize.normalizeProviderId(key) === provider) ?? provider;
	const configured = providers[configKey];
	if (!configured) return withoutProfileFallback(cfg, provider);
	const auth = mode === "oauth" || mode === "token" ? mode : "api-key";
	return {
		...cfg,
		models: {
			...cfg.models,
			providers: {
				...providers,
				[configKey]: {
					...configured,
					apiKey: value,
					auth
				}
			}
		},
		auth: {
			...cfg.auth,
			order: {
				...cfg.auth?.order,
				[provider]: []
			}
		}
	};
}
function withoutProfileFallback(cfg, provider) {
	return {
		...cfg,
		auth: {
			...cfg.auth,
			order: {
				...cfg.auth?.order,
				[provider]: []
			}
		}
	};
}
async function resolveConfiguredProbeCredential(params) {
	const literal = require_types_secrets.normalizeSecretInputString(params.input);
	if (literal !== void 0) return literal;
	const ref = require_types_secrets.coerceSecretRef(params.input, params.cfg.secrets?.defaults);
	if (!ref) return null;
	try {
		return await require_resolve.resolveSecretRefString(ref, {
			config: params.cfg,
			env: process.env,
			cache: params.cache
		});
	} catch {
		return null;
	}
}
async function maybeResolveUnresolvedRefIssue(params) {
	if (!params.profile) return null;
	const ref = resolveProbeSecretRef(params.profile, params.cfg);
	if (!ref) return null;
	try {
		await require_resolve.resolveSecretRefString(ref, {
			config: params.cfg,
			env: process.env,
			cache: params.cache
		});
		return null;
	} catch {
		return {
			reasonCode: "unresolved_ref",
			error: formatUnresolvedRefProbeError(`${ref.source}:${ref.provider}:${ref.id}`)
		};
	}
}
/** Builds probe targets plus preflight failures for missing/invalid credentials. */
async function buildProbeTargets(params) {
	const { cfg, agentDir, providers, modelCandidates, options, workspaceDir } = params;
	const authAliasLookupParams = {
		config: cfg,
		workspaceDir
	};
	const store = require_store.ensureAuthProfileStore(agentDir, { externalCli: require_external_cli_discovery.externalCliDiscoveryScoped({
		config: cfg,
		allowKeychainPrompt: false,
		providerIds: providers.map((provider) => require_provider_auth_aliases.resolveProviderIdForAuth(provider, authAliasLookupParams)),
		profileIds: options.profileIds
	}) });
	const providerFilter = options.provider?.trim();
	const providerFilterKey = providerFilter ? require_model_selection_normalize.normalizeProviderId(providerFilter) : null;
	const profileFilter = new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(options.profileIds));
	const refResolveCache = {};
	const catalog = await require_model_catalog.loadModelCatalog({ config: cfg });
	const candidates = buildProbeCandidateMap(modelCandidates);
	const targets = [];
	const results = [];
	for (const provider of providers) {
		const providerKey = require_model_selection_normalize.normalizeProviderId(provider);
		const authProviderKey = require_provider_auth_aliases.resolveProviderIdForAuth(providerKey, authAliasLookupParams);
		if (providerFilterKey && providerKey !== providerFilterKey) continue;
		const model = selectProbeModel({
			provider: providerKey,
			candidates,
			catalog
		});
		const configuredProvider = require_model_selection_normalize.findNormalizedProviderValue(cfg.models?.providers, providerKey);
		const includeDirectKeys = options.includeDirectKeys === true && profileFilter.size === 0;
		const includeConfigKey = includeDirectKeys && profileFilter.size === 0 && require_types_secrets.hasConfiguredSecretInput(configuredProvider?.apiKey, cfg.secrets?.defaults);
		const profileIds = [.../* @__PURE__ */ new Set([...require_profile_list.listProfilesForProvider(store, authProviderKey), ...authProviderKey === providerKey ? [] : require_profile_list.listProfilesForProvider(store, providerKey)])];
		const configuredReference = includeConfigKey ? require_model_auth.resolveProviderEntryApiKeyProfileReference({
			cfg,
			provider: providerKey,
			store
		}) : { kind: "none" };
		const configuredBinding = configuredReference.kind === "profile" && !profileIds.includes(configuredReference.profileId) ? await require_model_auth.resolveProviderEntryApiKeyBinding({
			cfg,
			provider: providerKey,
			store,
			agentDir
		}) : null;
		const configuredValue = includeConfigKey && configuredReference.kind !== "profile" && configuredReference.kind !== "profile-incompatible" ? configuredReference.kind === "marker" ? require_model_auth.resolveUsableCustomProviderApiKey({
			cfg,
			provider: providerKey,
			env: process.env
		})?.apiKey ?? null : await resolveConfiguredProbeCredential({
			cfg,
			input: configuredProvider?.apiKey,
			cache: refResolveCache
		}) : null;
		const configuredMode = configuredProvider?.auth === "oauth" || configuredProvider?.auth === "token" ? configuredProvider.auth : "api_key";
		const resolvedEnvironmentValue = includeDirectKeys ? require_model_auth_env.resolveEnvApiKey(authProviderKey, process.env, {
			config: cfg,
			workspaceDir
		}) : null;
		const environmentValue = resolvedEnvironmentValue?.apiKey === configuredValue ? null : resolvedEnvironmentValue;
		const appendDirectTargets = () => {
			if (includeConfigKey) if (configuredReference.kind === "profile-incompatible") results.push({
				provider: providerKey,
				model: model ? `${model.provider}/${model.model}` : void 0,
				profileId: configuredReference.profileId,
				label: "config",
				source: "models.json",
				mode: configuredMode,
				status: "unknown",
				reasonCode: "ineligible_profile",
				error: "Configured API key references an incompatible auth profile."
			});
			else if (configuredReference.kind === "profile") {
				if (!profileIds.includes(configuredReference.profileId)) if (configuredBinding?.kind === "profile-resolved" && model) targets.push({
					provider: providerKey,
					model,
					profileId: configuredBinding.auth.profileId,
					label: "config",
					source: "models.json",
					mode: configuredBinding.auth.mode,
					boundValue: configuredBinding.auth.apiKey
				});
				else results.push({
					provider: providerKey,
					model: model ? `${model.provider}/${model.model}` : void 0,
					profileId: configuredReference.profileId,
					label: "config",
					source: "models.json",
					mode: configuredMode,
					status: model ? "unknown" : "no_model",
					reasonCode: model ? "unresolved_ref" : "no_model",
					error: model ? "Configured auth profile could not be resolved." : "No model available for probe"
				});
			} else if (!configuredValue) results.push({
				provider: providerKey,
				model: model ? `${model.provider}/${model.model}` : void 0,
				label: "config",
				source: "models.json",
				mode: configuredMode,
				status: model ? "unknown" : "no_model",
				reasonCode: model ? "unresolved_ref" : "no_model",
				error: model ? "Configured API key could not be resolved." : "No model available for probe"
			});
			else if (model) targets.push({
				provider: providerKey,
				model,
				label: "config",
				source: "models.json",
				mode: configuredMode,
				boundValue: configuredValue,
				...configuredReference.kind === "marker" ? { useRuntimeAuth: true } : {}
			});
			else results.push({
				provider: providerKey,
				model: void 0,
				label: "config",
				source: "models.json",
				mode: configuredMode,
				status: "no_model",
				reasonCode: "no_model",
				error: "No model available for probe"
			});
			if (environmentValue) {
				const mode = configuredProvider?.auth === "oauth" || configuredProvider?.auth === "token" ? configuredProvider.auth : environmentValue.source.includes("OAUTH_TOKEN") ? "oauth" : "api_key";
				if (model) targets.push({
					provider: providerKey,
					model,
					label: environmentValue.source,
					source: "env",
					mode,
					boundValue: environmentValue.apiKey
				});
				else results.push({
					provider: providerKey,
					model: void 0,
					label: environmentValue.source,
					source: "env",
					mode,
					status: "no_model",
					reasonCode: "no_model",
					error: "No model available for probe"
				});
			}
		};
		const explicitOrder = require_model_selection_normalize.findNormalizedProviderValue(store.order, authProviderKey) ?? require_model_selection_normalize.findNormalizedProviderValue(store.order, providerKey) ?? require_model_selection_normalize.findNormalizedProviderValue(cfg?.auth?.order, authProviderKey) ?? require_model_selection_normalize.findNormalizedProviderValue(cfg?.auth?.order, providerKey);
		const orderResolution = require_order.resolveAuthProfileOrderWithMetadata({
			cfg,
			store,
			provider: providerKey,
			forModel: model?.model
		});
		const allowedProfiles = orderResolution.hasExplicitOrder ? new Set(orderResolution.profileIds) : null;
		const filteredProfiles = profileFilter.size ? profileIds.filter((id) => profileFilter.has(id)) : profileIds;
		if (filteredProfiles.length > 0) {
			for (const profileId of filteredProfiles) {
				const profile = store.profiles[profileId];
				const mode = profile?.type;
				const label = require_auth_profiles.resolveAuthProfileDisplayLabel({
					cfg,
					store,
					profileId
				});
				const isConfigBoundProfile = includeConfigKey && configuredReference.kind === "profile" && profileId === configuredReference.profileId;
				if (!isConfigBoundProfile && explicitOrder && !explicitOrder.includes(profileId)) {
					results.push({
						provider: providerKey,
						profileId,
						model: model ? `${model.provider}/${model.model}` : void 0,
						label,
						source: "profile",
						mode,
						status: "unknown",
						reasonCode: "excluded_by_auth_order",
						error: "Excluded by auth.order for this provider."
					});
					continue;
				}
				if (!isConfigBoundProfile && allowedProfiles && !allowedProfiles.has(profileId)) {
					const reasonCode = mapEligibilityReasonToProbeReasonCode(require_order.resolveAuthProfileEligibility({
						cfg,
						store,
						provider: providerKey,
						profileId
					}).reasonCode);
					results.push({
						provider: providerKey,
						model: model ? `${model.provider}/${model.model}` : void 0,
						profileId,
						label,
						source: "profile",
						mode,
						status: "unknown",
						reasonCode,
						error: formatMissingCredentialProbeError(reasonCode)
					});
					continue;
				}
				const unresolvedRefIssue = await maybeResolveUnresolvedRefIssue({
					cfg,
					profile,
					cache: refResolveCache
				});
				if (unresolvedRefIssue) {
					results.push({
						provider: providerKey,
						model: model ? `${model.provider}/${model.model}` : void 0,
						profileId,
						label,
						source: "profile",
						mode,
						status: "unknown",
						reasonCode: unresolvedRefIssue.reasonCode,
						error: unresolvedRefIssue.error
					});
					continue;
				}
				if (!model) {
					results.push({
						provider: providerKey,
						model: void 0,
						profileId,
						label,
						source: "profile",
						mode,
						status: "no_model",
						reasonCode: "no_model",
						error: "No model available for probe"
					});
					continue;
				}
				targets.push({
					provider: providerKey,
					model,
					profileId,
					label,
					source: "profile",
					mode
				});
			}
			appendDirectTargets();
			continue;
		}
		if (profileFilter.size > 0) continue;
		appendDirectTargets();
		if (includeConfigKey || environmentValue) continue;
		const hasUsableModelsJsonKey = require_model_auth.hasUsableCustomProviderApiKey(cfg, providerKey);
		if (orderResolution.hasExplicitOrder && !hasUsableModelsJsonKey) continue;
		const envKey = orderResolution.hasExplicitOrder ? null : require_model_auth_env.resolveEnvApiKey(authProviderKey, process.env, {
			config: cfg,
			workspaceDir
		});
		if (!envKey && !hasUsableModelsJsonKey) continue;
		const label = envKey ? "env" : "models.json";
		const source = envKey ? "env" : "models.json";
		const mode = envKey?.source.includes("OAUTH_TOKEN") ? "oauth" : "api_key";
		if (!model) {
			results.push({
				provider: providerKey,
				model: void 0,
				label,
				source,
				mode,
				status: "no_model",
				reasonCode: "no_model",
				error: "No model available for probe"
			});
			continue;
		}
		targets.push({
			provider: providerKey,
			model,
			label,
			source,
			mode
		});
	}
	return {
		targets,
		results
	};
}
async function probeTarget(params) {
	const { cfg, agentId, agentDir, workspaceDir, sessionDir, target, timeoutMs, maxTokens } = params;
	const probeConfig = !target.boundValue ? cfg : target.useRuntimeAuth ? withoutProfileFallback(cfg, target.provider) : withDirectCredential(cfg, target.provider, target.boundValue, target.mode);
	if (!target.model) return {
		provider: target.provider,
		model: void 0,
		profileId: target.profileId,
		label: target.label,
		source: target.source,
		mode: target.mode,
		status: "no_model",
		reasonCode: "no_model",
		error: "No model available for probe"
	};
	const model = target.model;
	const sessionId = `probe-${target.provider}-${node_crypto.default.randomUUID()}`;
	const sessionFile = require_paths.resolveSessionTranscriptPath(sessionId, agentId);
	await node_fs_promises.default.mkdir(sessionDir, { recursive: true });
	let isolatedAgentDir = null;
	let isolatedProfileId;
	const start = Date.now();
	const buildResult = (status, error) => ({
		provider: target.provider,
		model: `${model.provider}/${model.model}`,
		profileId: target.profileId,
		label: target.label,
		source: target.source,
		mode: target.mode,
		status,
		...error ? { error } : {},
		latencyMs: Date.now() - start
	});
	try {
		if (target.boundValue) isolatedAgentDir = await node_fs_promises.default.realpath(await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-auth-probe-")));
		if (target.boundValue && !target.useRuntimeAuth && isolatedAgentDir) {
			isolatedProfileId = `${target.provider}:probe-${node_crypto.default.randomUUID()}`;
			const value = target.boundValue;
			const profile = target.mode === "oauth" ? {
				type: "oauth",
				provider: target.provider,
				access: value,
				refresh: "not-a-real",
				expires: Date.now() + 3600 * 1e3
			} : target.mode === "token" ? {
				type: "token",
				provider: target.provider,
				token: value
			} : {
				type: "api_key",
				provider: target.provider,
				key: value
			};
			if (!await require_profiles.upsertAuthProfileWithLock({
				profileId: isolatedProfileId,
				credential: profile,
				agentDir: isolatedAgentDir
			})) throw new Error("Could not prepare isolated auth probe profile");
		}
		const { runEmbeddedAgent } = await loadEmbeddedRunnerModule();
		await runEmbeddedAgent({
			sessionId,
			sessionFile,
			agentId,
			workspaceDir,
			agentDir: isolatedAgentDir ?? agentDir,
			config: probeConfig,
			prompt: PROBE_PROMPT,
			provider: target.model.provider,
			model: target.model.model,
			authProfileId: isolatedProfileId ?? target.profileId,
			authProfileIdSource: isolatedProfileId || target.profileId ? "user" : void 0,
			timeoutMs,
			runId: `probe-${node_crypto.default.randomUUID()}`,
			lane: `auth-probe:${target.provider}:${target.profileId ?? target.source}`,
			thinkLevel: "off",
			reasoningLevel: "off",
			verboseLevel: "off",
			streamParams: { maxTokens },
			disableTools: true,
			modelRun: true,
			cleanupBundleMcpOnRunEnd: true
		});
		return buildResult("ok");
	} catch (err) {
		const described = require_failover_error.describeFailoverError(err);
		return buildResult(mapFailoverReasonToProbeStatus(described.reason), redactAuthProbeError(described.message));
	} finally {
		if (isolatedAgentDir) {
			require_store.clearRuntimeAuthProfileStoreSnapshot(isolatedAgentDir);
			require_openclaw_agent_db.disposeOperatorAgentDatabaseByPath(require_sqlite.resolveAuthProfileDatabasePath(isolatedAgentDir));
			await node_fs_promises.default.rm(isolatedAgentDir, {
				recursive: true,
				force: true
			});
		}
	}
}
async function runTargetsWithConcurrency(params) {
	const { cfg, targets, timeoutMs, maxTokens, onProgress } = params;
	const concurrency = Math.max(1, Math.min(targets.length || 1, params.concurrency));
	const agentId = params.agentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg);
	const agentDir = params.agentDir ?? require_agent_scope_config.resolveAgentDir(cfg, agentId);
	const workspaceDir = params.workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId) ?? require_agent_scope_config.resolveDefaultAgentWorkspaceDir();
	const sessionDir = require_paths.resolveSessionTranscriptsDirForAgent(agentId);
	await node_fs_promises.default.mkdir(workspaceDir, { recursive: true });
	let completed = 0;
	return await (0, p_map.default)(targets, async (target) => {
		onProgress?.({
			completed,
			total: targets.length,
			label: `Probing ${target.provider}${target.profileId ? ` (${target.label})` : ""}`
		});
		const result = await probeTarget({
			cfg,
			agentId,
			agentDir,
			workspaceDir,
			sessionDir,
			target,
			timeoutMs,
			maxTokens
		});
		completed += 1;
		onProgress?.({
			completed,
			total: targets.length
		});
		return result;
	}, {
		concurrency,
		stopOnError: true
	});
}
/** Runs all auth probes with bounded concurrency and returns a summary. */
async function runAuthProbes(params) {
	const startedAt = Date.now();
	const plan = await buildProbeTargets({
		cfg: params.cfg,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		providers: params.providers,
		modelCandidates: params.modelCandidates,
		options: params.options
	});
	const totalTargets = plan.targets.length;
	params.onProgress?.({
		completed: 0,
		total: totalTargets
	});
	const results = totalTargets ? await runTargetsWithConcurrency({
		cfg: params.cfg,
		agentId: params.agentId,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		targets: plan.targets,
		timeoutMs: params.options.timeoutMs,
		maxTokens: params.options.maxTokens,
		concurrency: params.options.concurrency,
		onProgress: params.onProgress
	}) : [];
	const finishedAt = Date.now();
	return {
		startedAt,
		finishedAt,
		durationMs: finishedAt - startedAt,
		totalTargets,
		options: params.options,
		results: [...plan.results, ...results]
	};
}
//#endregion
//#region src/gateway/server-methods/models-probe.ts
const DEFAULT_TIMEOUT_MS = 2e4;
const MIN_TIMEOUT_MS = 5e3;
const MAX_TIMEOUT_MS = 6e4;
const PROBE_CONCURRENCY = 2;
const PROBE_MAX_TOKENS = 8;
const FAILURE_PRIORITY = [
	"auth",
	"billing",
	"rate_limit",
	"timeout",
	"format",
	"no_model",
	"unknown"
];
const PROBE_ERROR_MESSAGES = {
	auth: "Authentication failed.",
	rate_limit: "The provider rate limit was reached.",
	billing: "The provider reported a billing problem.",
	timeout: "The connection timed out.",
	format: "The provider rejected the model or request format.",
	unknown: "The connection probe failed.",
	no_model: "No model is available for this provider."
};
function safeProbeError(status) {
	return status === "ok" ? void 0 : PROBE_ERROR_MESSAGES[status];
}
function modelCandidatesFromConfig(cfg) {
	const configured = cfg.agents?.defaults?.model;
	return [
		typeof configured === "string" ? configured : configured?.primary,
		...typeof configured === "string" ? [] : configured?.fallbacks ?? [],
		cfg.agents?.defaults?.utilityModel
	].filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean);
}
function selectRollupStatus(results) {
	if (results.some((result) => result.status === "ok")) return "ok";
	return FAILURE_PRIORITY.find((status) => results.some((result) => result.status === status)) ?? "unknown";
}
function mapProbeResult(provider, results) {
	const status = selectRollupStatus(results);
	const latencyMs = results.filter((result) => result.status === status).map((result) => result.latencyMs).filter((value) => typeof value === "number").toSorted((left, right) => left - right)[0];
	const error = safeProbeError(status);
	return {
		provider,
		status,
		...latencyMs !== void 0 ? { latencyMs } : {},
		...error ? { error } : {},
		results: results.map((result) => ({
			...result.profileId ? { profileId: result.profileId } : {},
			label: result.label,
			status: result.status,
			...result.latencyMs !== void 0 ? { latencyMs: result.latencyMs } : {},
			...result.error ? { error: safeProbeError(result.status) } : {}
		}))
	};
}
const modelsProbeHandlers = { "models.probe": async ({ params, respond, context }) => {
	if (!require_src.validateModelsProbeParams(params)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid models.probe params: ${require_validation_errors.formatValidationErrors(require_src.validateModelsProbeParams.errors)}`));
		return;
	}
	const request = params;
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(request.provider);
	const profileId = request.profileId?.trim();
	if (!provider || request.profileId !== void 0 && !profileId) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "provider and profileId must not be blank"));
		return;
	}
	const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, request.timeoutMs ?? DEFAULT_TIMEOUT_MS));
	try {
		const cfg = context.getRuntimeConfig();
		const result = mapProbeResult(provider, (await runAuthProbes({
			cfg,
			providers: [provider],
			modelCandidates: modelCandidatesFromConfig(cfg),
			options: {
				provider,
				...profileId ? { profileIds: [profileId] } : {},
				...!profileId ? { includeDirectKeys: true } : {},
				timeoutMs,
				concurrency: PROBE_CONCURRENCY,
				maxTokens: PROBE_MAX_TOKENS
			}
		})).results);
		if (result.results.length === 0) result.error = "No probe targets are available for this provider.";
		respond(true, result, void 0);
	} catch {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "Connection probe failed."));
	}
} };
//#endregion
exports.modelsProbeHandlers = modelsProbeHandlers;
