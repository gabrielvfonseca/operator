const require_bootstrap_registry = require("./bootstrap-registry-C2aRGF1a.cjs");
require("./shared-Bt0YEZDW.cjs");
const require_provider_id = require("./provider-id-DSr5QyVH.cjs");
const require_capability_provider_runtime = require("./capability-provider-runtime-BgXXVc3C.cjs");
const require_config_provider_models = require("./config-provider-models-4WEolJcZ.cjs");
const require_entry_capabilities = require("./entry-capabilities-By50OsTu.cjs");
const require_channel_contract_api = require("./channel-contract-api-nZGOrZ_f.cjs");
const require_runtime_shared = require("./runtime-shared-3TeB-bbT.cjs");
const require_runtime_gateway_auth_surfaces = require("./runtime-gateway-auth-surfaces-Y3SuOzZh.cjs");
const require_runtime_config_collectors_plugins = require("./runtime-config-collectors-plugins-B1RcVktF.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/secrets/runtime-config-collectors-channels.ts
/** Collects channel contract secret assignments during runtime preparation. */
/** Collects SecretRef assignments declared by active channel/plugin channel contracts. */
function collectChannelConfigAssignments(params) {
	const channelIds = Object.keys(params.config.channels ?? {});
	if (channelIds.length === 0) return;
	for (const channelId of channelIds) (require_channel_contract_api.loadChannelSecretContractApi({
		channelId,
		config: params.config,
		env: params.context.env,
		loadablePluginOrigins: params.loadablePluginOrigins
	})?.collectRuntimeConfigAssignments ?? require_bootstrap_registry.getBootstrapChannelSecrets(channelId)?.collectRuntimeConfigAssignments)?.(params);
}
//#endregion
//#region src/media-understanding/provider-capability-registry.ts
function mergeProviderCapabilities(registry, provider) {
	const normalizedKey = require_provider_id.normalizeMediaProviderId(provider.id);
	const existing = registry.get(normalizedKey);
	registry.set(normalizedKey, { capabilities: provider.capabilities ?? existing?.capabilities });
}
/** Builds provider capability metadata used to filter shared media model entries. */
function buildMediaUnderstandingCapabilityRegistry(cfg) {
	const registry = /* @__PURE__ */ new Map();
	for (const provider of require_capability_provider_runtime.resolvePluginCapabilityProviders({
		key: "mediaUnderstandingProviders",
		cfg
	})) mergeProviderCapabilities(registry, provider);
	for (const normalizedKey of require_config_provider_models.resolveImageCapableConfigProviderIds(cfg)) if (!registry.has(normalizedKey)) mergeProviderCapabilities(registry, {
		id: normalizedKey,
		capabilities: ["image"]
	});
	return registry;
}
//#endregion
//#region src/secrets/runtime-config-collectors-tts.ts
/** Collects text-to-speech secret refs from runtime config. */
function collectProviderApiKeyAssignment(params) {
	require_runtime_shared.collectSecretInputAssignment({
		value: params.providerConfig.apiKey,
		path: `${params.pathPrefix}.providers.${params.providerId}.apiKey`,
		expected: "string",
		defaults: params.defaults,
		context: params.context,
		active: params.active,
		inactiveReason: params.inactiveReason,
		apply: (value) => {
			params.providerConfig.apiKey = value;
		}
	});
}
/** Collects provider API key SecretRefs from a TTS config block. */
function collectTtsApiKeyAssignments(params) {
	const providers = params.tts.providers;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providers)) for (const [providerId, providerConfig] of Object.entries(providers)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providerConfig)) continue;
		collectProviderApiKeyAssignment({
			providerId,
			providerConfig,
			pathPrefix: params.pathPrefix,
			defaults: params.defaults,
			context: params.context,
			active: params.active,
			inactiveReason: params.inactiveReason
		});
	}
}
//#endregion
//#region src/secrets/runtime-config-collectors-core.ts
/** Collects core config secret refs during runtime preparation. */
function collectModelProviderAssignments(params) {
	for (const [providerId, provider] of Object.entries(params.providers)) {
		const providerIsActive = provider.enabled !== false;
		require_runtime_shared.collectSecretInputAssignment({
			value: provider.apiKey,
			path: `models.providers.${providerId}.apiKey`,
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: providerIsActive,
			inactiveReason: "provider is disabled.",
			apply: (value) => {
				provider.apiKey = value;
			}
		});
		const headers = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(provider.headers) ? provider.headers : void 0;
		if (headers) for (const [headerKey, headerValue] of Object.entries(headers)) require_runtime_shared.collectSecretInputAssignment({
			value: headerValue,
			path: `models.providers.${providerId}.headers.${headerKey}`,
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: providerIsActive,
			inactiveReason: "provider is disabled.",
			apply: (value) => {
				headers[headerKey] = value;
			}
		});
		const request = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(provider.request) ? provider.request : void 0;
		if (request) collectProviderRequestAssignments({
			request,
			pathPrefix: `models.providers.${providerId}.request`,
			defaults: params.defaults,
			context: params.context,
			active: providerIsActive,
			inactiveReason: "provider is disabled.",
			collectTransportSecrets: true
		});
	}
}
function collectSkillAssignments(params) {
	for (const [skillKey, entry] of Object.entries(params.entries)) require_runtime_shared.collectSecretInputAssignment({
		value: entry.apiKey,
		path: `skills.entries.${skillKey}.apiKey`,
		expected: "string",
		defaults: params.defaults,
		context: params.context,
		active: entry.enabled !== false,
		inactiveReason: "skill entry is disabled.",
		apply: (value) => {
			entry.apiKey = value;
		}
	});
}
function collectAgentMemorySearchAssignments(params) {
	const agents = params.config.agents;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agents)) return;
	const defaultsConfig = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agents.defaults) ? agents.defaults : void 0;
	const defaultsMemorySearch = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(defaultsConfig?.memorySearch) ? defaultsConfig.memorySearch : void 0;
	const defaultsEnabled = defaultsMemorySearch?.enabled !== false;
	const list = Array.isArray(agents.list) ? agents.list : [];
	let hasEnabledAgentWithoutOverride = false;
	for (const rawAgent of list) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawAgent)) continue;
		if (rawAgent.enabled === false) continue;
		const memorySearch = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawAgent.memorySearch) ? rawAgent.memorySearch : void 0;
		if (memorySearch?.enabled === false) continue;
		if (!memorySearch || !Object.hasOwn(memorySearch, "remote")) {
			hasEnabledAgentWithoutOverride = true;
			continue;
		}
		const remote = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(memorySearch.remote) ? memorySearch.remote : void 0;
		if (!remote || !Object.hasOwn(remote, "apiKey")) hasEnabledAgentWithoutOverride = true;
	}
	if (defaultsMemorySearch && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(defaultsMemorySearch.remote)) {
		const remote = defaultsMemorySearch.remote;
		require_runtime_shared.collectSecretInputAssignment({
			value: remote.apiKey,
			path: "agents.defaults.memorySearch.remote.apiKey",
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: defaultsEnabled && (hasEnabledAgentWithoutOverride || list.length === 0),
			inactiveReason: hasEnabledAgentWithoutOverride ? void 0 : "all enabled agents override memorySearch.remote.apiKey.",
			apply: (value) => {
				remote.apiKey = value;
			}
		});
	}
	list.forEach((rawAgent, index) => {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawAgent)) return;
		const memorySearch = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawAgent.memorySearch) ? rawAgent.memorySearch : void 0;
		if (!memorySearch) return;
		const remote = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(memorySearch.remote) ? memorySearch.remote : void 0;
		if (!remote || !Object.hasOwn(remote, "apiKey")) return;
		const enabled = rawAgent.enabled !== false && memorySearch.enabled !== false;
		require_runtime_shared.collectSecretInputAssignment({
			value: remote.apiKey,
			path: `agents.list.${index}.memorySearch.remote.apiKey`,
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: enabled,
			inactiveReason: "agent or memorySearch override is disabled.",
			apply: (value) => {
				remote.apiKey = value;
			}
		});
	});
}
function collectTalkAssignments(params) {
	const talk = params.config.talk;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(talk)) return;
	require_runtime_shared.collectSecretInputAssignment({
		value: talk.apiKey,
		path: "talk.apiKey",
		expected: "string",
		defaults: params.defaults,
		context: params.context,
		apply: (value) => {
			talk.apiKey = value;
		}
	});
	collectTalkProviderApiKeyAssignments({
		providers: talk.providers,
		pathPrefix: "talk.providers",
		defaults: params.defaults,
		context: params.context
	});
	collectTalkProviderApiKeyAssignments({
		providers: ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(talk.realtime) ? talk.realtime : void 0)?.providers,
		pathPrefix: "talk.realtime.providers",
		defaults: params.defaults,
		context: params.context
	});
}
function collectTalkProviderApiKeyAssignments(params) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.providers)) return;
	for (const [providerId, providerConfig] of Object.entries(params.providers)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providerConfig)) continue;
		require_runtime_shared.collectSecretInputAssignment({
			value: providerConfig.apiKey,
			path: `${params.pathPrefix}.${providerId}.apiKey`,
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			apply: (value) => {
				providerConfig.apiKey = value;
			}
		});
	}
}
function collectGatewayAssignments(params) {
	const gateway = params.config.gateway;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(gateway)) return;
	const auth = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(gateway.auth) ? gateway.auth : void 0;
	const remote = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(gateway.remote) ? gateway.remote : void 0;
	const gatewaySurfaceStates = require_runtime_gateway_auth_surfaces.evaluateGatewayAuthSurfaceStates({
		config: params.config,
		env: params.context.env,
		defaults: params.defaults
	});
	if (auth) {
		require_runtime_shared.collectSecretInputAssignment({
			value: auth.token,
			path: "gateway.auth.token",
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: gatewaySurfaceStates["gateway.auth.token"].active,
			inactiveReason: gatewaySurfaceStates["gateway.auth.token"].reason,
			apply: (value) => {
				auth.token = value;
			}
		});
		require_runtime_shared.collectSecretInputAssignment({
			value: auth.password,
			path: "gateway.auth.password",
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: gatewaySurfaceStates["gateway.auth.password"].active,
			inactiveReason: gatewaySurfaceStates["gateway.auth.password"].reason,
			apply: (value) => {
				auth.password = value;
			}
		});
	}
	if (remote) {
		require_runtime_shared.collectSecretInputAssignment({
			value: remote.token,
			path: "gateway.remote.token",
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: gatewaySurfaceStates["gateway.remote.token"].active,
			inactiveReason: gatewaySurfaceStates["gateway.remote.token"].reason,
			apply: (value) => {
				remote.token = value;
			}
		});
		require_runtime_shared.collectSecretInputAssignment({
			value: remote.password,
			path: "gateway.remote.password",
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: gatewaySurfaceStates["gateway.remote.password"].active,
			inactiveReason: gatewaySurfaceStates["gateway.remote.password"].reason,
			apply: (value) => {
				remote.password = value;
			}
		});
	}
}
function collectProviderRequestAssignments(params) {
	const headers = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.request.headers) ? params.request.headers : void 0;
	if (headers) for (const [headerKey, headerValue] of Object.entries(headers)) require_runtime_shared.collectSecretInputAssignment({
		value: headerValue,
		path: `${params.pathPrefix}.headers.${headerKey}`,
		expected: "string",
		defaults: params.defaults,
		context: params.context,
		active: params.active,
		inactiveReason: params.inactiveReason,
		apply: (value) => {
			headers[headerKey] = value;
		}
	});
	const auth = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.request.auth) ? params.request.auth : void 0;
	if (auth) {
		require_runtime_shared.collectSecretInputAssignment({
			value: auth.token,
			path: `${params.pathPrefix}.auth.token`,
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: params.active,
			inactiveReason: params.inactiveReason,
			apply: (value) => {
				auth.token = value;
			}
		});
		require_runtime_shared.collectSecretInputAssignment({
			value: auth.value,
			path: `${params.pathPrefix}.auth.value`,
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: params.active,
			inactiveReason: params.inactiveReason,
			apply: (value) => {
				auth.value = value;
			}
		});
	}
	const collectTlsAssignments = (tls, pathPrefix) => {
		if (!tls) return;
		for (const key of [
			"ca",
			"cert",
			"key",
			"passphrase"
		]) require_runtime_shared.collectSecretInputAssignment({
			value: tls[key],
			path: `${pathPrefix}.${key}`,
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active: params.active,
			inactiveReason: params.inactiveReason,
			apply: (value) => {
				tls[key] = value;
			}
		});
	};
	if (params.collectTransportSecrets !== false) {
		collectTlsAssignments((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.request.tls) ? params.request.tls : void 0, `${params.pathPrefix}.tls`);
		const proxy = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.request.proxy) ? params.request.proxy : void 0;
		collectTlsAssignments((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(proxy?.tls) ? proxy.tls : void 0, `${params.pathPrefix}.proxy.tls`);
	}
}
function collectMediaRequestAssignments(params) {
	const tools = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.config.tools) ? params.config.tools : void 0;
	const media = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(tools?.media) ? tools.media : void 0;
	if (!media) return;
	let providerRegistry;
	const getProviderRegistry = () => {
		providerRegistry ??= buildMediaUnderstandingCapabilityRegistry(params.config);
		return providerRegistry;
	};
	const capabilityKeys = [
		"audio",
		"image",
		"video"
	];
	const isCapabilityEnabled = (capability) => ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(media[capability]) ? media[capability] : void 0)?.enabled !== false;
	const collectModelAssignments = (models, pathPrefix, resolveActivity) => {
		if (!Array.isArray(models)) return;
		models.forEach((rawModel, index) => {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModel) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModel.request)) return;
			const { active, inactiveReason } = resolveActivity(rawModel);
			collectProviderRequestAssignments({
				request: rawModel.request,
				pathPrefix: `${pathPrefix}.${index}.request`,
				defaults: params.defaults,
				context: params.context,
				active,
				inactiveReason
			});
		});
	};
	collectModelAssignments(media.models, "tools.media.models", (rawModel) => {
		const entry = rawModel;
		const capabilities = require_entry_capabilities.resolveConfiguredMediaEntryCapabilities(entry) ?? require_entry_capabilities.resolveEffectiveMediaEntryCapabilities({
			entry,
			source: "shared",
			providerRegistry: getProviderRegistry()
		});
		if (!capabilities || capabilities.length === 0) return {
			active: false,
			inactiveReason: "shared media model does not declare capabilities and none could be inferred from its provider."
		};
		return {
			active: capabilities.some((capability) => isCapabilityEnabled(capability)),
			inactiveReason: `all configured media capabilities for this shared model are disabled: ${capabilities.join(", ")}.`
		};
	});
	for (const capability of capabilityKeys) {
		const section = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(media[capability]) ? media[capability] : void 0;
		const active = isCapabilityEnabled(capability);
		const inactiveReason = `${capability} media understanding is disabled.`;
		if (section && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(section.request)) collectProviderRequestAssignments({
			request: section.request,
			pathPrefix: `tools.media.${capability}.request`,
			defaults: params.defaults,
			context: params.context,
			active,
			inactiveReason
		});
		collectModelAssignments(section?.models, `tools.media.${capability}.models`, (rawModel) => ({
			active: active && (() => {
				const configuredCapabilities = require_entry_capabilities.resolveConfiguredMediaEntryCapabilities(rawModel);
				return configuredCapabilities ? configuredCapabilities.includes(capability) : true;
			})(),
			inactiveReason: active ? `${capability} media model is filtered out by its configured capabilities.` : inactiveReason
		}));
	}
}
function collectMessagesTtsAssignments(params) {
	const messages = params.config.messages;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(messages) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(messages.tts)) return;
	collectTtsApiKeyAssignments({
		tts: messages.tts,
		pathPrefix: "messages.tts",
		defaults: params.defaults,
		context: params.context
	});
}
function collectAgentTtsAssignments(params) {
	const list = params.config.agents?.list;
	if (!Array.isArray(list)) return;
	for (const [index, entry] of list.entries()) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.tts)) continue;
		collectTtsApiKeyAssignments({
			tts: entry.tts,
			pathPrefix: `agents.list.${index}.tts`,
			defaults: params.defaults,
			context: params.context
		});
	}
}
function collectCronAssignments(params) {
	const cron = params.config.cron;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cron)) return;
	require_runtime_shared.collectSecretInputAssignment({
		value: cron.webhookToken,
		path: "cron.webhookToken",
		expected: "string",
		defaults: params.defaults,
		context: params.context,
		apply: (value) => {
			cron.webhookToken = value;
		}
	});
}
function collectSandboxSshAssignments(params) {
	const agents = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.config.agents) ? params.config.agents : void 0;
	if (!agents) return;
	const defaultsAgent = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agents.defaults) ? agents.defaults : void 0;
	const defaultsSandbox = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(defaultsAgent?.sandbox) ? defaultsAgent.sandbox : void 0;
	const defaultsSsh = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(defaultsSandbox?.ssh) ? defaultsSandbox.ssh : void 0;
	const defaultsBackend = typeof defaultsSandbox?.backend === "string" ? defaultsSandbox.backend : void 0;
	const defaultsMode = typeof defaultsSandbox?.mode === "string" ? defaultsSandbox.mode : void 0;
	const inheritedDefaultsUsage = {
		identityData: false,
		certificateData: false,
		knownHostsData: false
	};
	(Array.isArray(agents.list) ? agents.list : []).forEach((rawAgent, index) => {
		const agentRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawAgent) ? rawAgent : null;
		if (!agentRecord || agentRecord.enabled === false) return;
		const sandbox = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agentRecord.sandbox) ? agentRecord.sandbox : void 0;
		const ssh = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(sandbox?.ssh) ? sandbox.ssh : void 0;
		const effectiveBackend = (typeof sandbox?.backend === "string" ? sandbox.backend : void 0) ?? defaultsBackend ?? "docker";
		const effectiveMode = (typeof sandbox?.mode === "string" ? sandbox.mode : void 0) ?? defaultsMode ?? "off";
		const active = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(effectiveBackend) === "ssh" && effectiveMode !== "off";
		for (const key of [
			"identityData",
			"certificateData",
			"knownHostsData"
		]) if (ssh && Object.hasOwn(ssh, key)) require_runtime_shared.collectSecretInputAssignment({
			value: ssh[key],
			path: `agents.list.${index}.sandbox.ssh.${key}`,
			expected: "string",
			defaults: params.defaults,
			context: params.context,
			active,
			inactiveReason: "sandbox SSH backend is not active for this agent.",
			apply: (value) => {
				ssh[key] = value;
			}
		});
		else if (active) inheritedDefaultsUsage[key] = true;
	});
	if (!defaultsSsh) return;
	const defaultsActive = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(defaultsBackend) === "ssh" && defaultsMode !== "off" || inheritedDefaultsUsage.identityData || inheritedDefaultsUsage.certificateData || inheritedDefaultsUsage.knownHostsData;
	for (const key of [
		"identityData",
		"certificateData",
		"knownHostsData"
	]) require_runtime_shared.collectSecretInputAssignment({
		value: defaultsSsh[key],
		path: `agents.defaults.sandbox.ssh.${key}`,
		expected: "string",
		defaults: params.defaults,
		context: params.context,
		active: defaultsActive || inheritedDefaultsUsage[key],
		inactiveReason: "sandbox SSH backend is not active.",
		apply: (value) => {
			defaultsSsh[key] = value;
		}
	});
}
/** Collects SecretRef assignments from core-owned config surfaces. */
/** Collects SecretRef assignments from core non-plugin config surfaces. */
function collectCoreConfigAssignments(params) {
	const providers = params.config.models?.providers;
	if (providers) collectModelProviderAssignments({
		providers,
		defaults: params.defaults,
		context: params.context
	});
	const skillEntries = params.config.skills?.entries;
	if (skillEntries) collectSkillAssignments({
		entries: skillEntries,
		defaults: params.defaults,
		context: params.context
	});
	collectAgentMemorySearchAssignments(params);
	collectTalkAssignments(params);
	collectGatewayAssignments(params);
	collectSandboxSshAssignments(params);
	collectMessagesTtsAssignments(params);
	collectAgentTtsAssignments(params);
	collectCronAssignments(params);
	collectMediaRequestAssignments(params);
}
//#endregion
//#region src/secrets/runtime-config-collectors.ts
/** Collects every config-backed SecretRef assignment before runtime values are materialized. */
/** Collects concrete config path assignments that may need SecretRef conversion. */
function collectConfigAssignments(params) {
	const defaults = params.context.sourceConfig.secrets?.defaults;
	collectCoreConfigAssignments({
		config: params.config,
		defaults,
		context: params.context
	});
	collectChannelConfigAssignments({
		config: params.config,
		defaults,
		context: params.context,
		loadablePluginOrigins: params.loadablePluginOrigins
	});
	require_runtime_config_collectors_plugins.collectPluginConfigAssignments({
		config: params.config,
		defaults,
		context: params.context,
		loadablePluginOrigins: params.loadablePluginOrigins
	});
}
//#endregion
Object.defineProperty(exports, "collectConfigAssignments", {
	enumerable: true,
	get: function() {
		return collectConfigAssignments;
	}
});
