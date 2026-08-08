let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
//#region packages/speech-core/voice-models.ts
function normalizeString(value) {
	return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function normalizeLowercaseString(value) {
	return normalizeString(value)?.toLowerCase();
}
function normalizeTimeoutMs(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : void 0;
}
function parseVoiceModelRef(value) {
	const parsed = typeof value === "string" ? (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.parseModelCatalogRef)(value) : null;
	return parsed ? {
		provider: parsed.provider,
		model: parsed.modelId
	} : void 0;
}
function sameProvider(left, right) {
	const normalizedLeft = normalizeLowercaseString(left);
	return Boolean(normalizedLeft && normalizedLeft === normalizeLowercaseString(right));
}
/** Match provider ids case-insensitively across canonical id and aliases. */
function providerMatchesId(provider, providerId) {
	return sameProvider(provider.id, providerId) || (provider.aliases ?? []).some((alias) => sameProvider(alias, providerId));
}
/** Find the provider metadata for a configured provider id or alias. */
function findVoiceModelProvider(params) {
	return params.providers.find((provider) => providerMatchesId(provider, params.providerId));
}
/** Return true when a provider advertises the requested model. */
function voiceProviderSupportsModel(provider, model) {
	if (!provider) return false;
	const normalizedModel = normalizeString(model);
	return [provider.defaultModel, ...provider.models ?? []].some((candidate) => normalizeString(candidate) === normalizedModel);
}
/** Parse primary/fallback voice model refs from config. */
function resolveVoiceModelRefs(config) {
	const voiceModel = config;
	if (typeof voiceModel === "string") {
		const parsed = parseVoiceModelRef(voiceModel);
		return parsed ? [parsed] : [];
	}
	if (typeof voiceModel !== "object" || voiceModel === null || Array.isArray(voiceModel)) return [];
	const timeoutMs = normalizeTimeoutMs(voiceModel.timeoutMs);
	const refs = [];
	const addRef = (value) => {
		const parsed = parseVoiceModelRef(value);
		if (parsed) refs.push({
			...parsed,
			...timeoutMs === void 0 ? {} : { timeoutMs }
		});
	};
	addRef(voiceModel.primary);
	if (Array.isArray(voiceModel.fallbacks)) for (const fallback of voiceModel.fallbacks) addRef(fallback);
	return refs;
}
/** Resolve configured voice model refs that are supported by known providers. */
function resolveSupportedVoiceModelRefs(params) {
	return resolveVoiceModelRefs(params.config).flatMap((ref) => {
		const provider = findVoiceModelProvider({
			providers: params.providers,
			providerId: ref.provider
		});
		if (!provider || params.providerId && !providerMatchesId(provider, params.providerId)) return [];
		return voiceProviderSupportsModel(provider, ref.model) ? [{
			...ref,
			provider: provider.id
		}] : [];
	});
}
/** Build ordered provider candidates from primary provider plus voice-model fallbacks. */
function resolveVoiceProviderCandidates(params) {
	const primary = findVoiceModelProvider({
		providers: params.providers,
		providerId: params.primaryProvider
	})?.id ?? params.primaryProvider;
	const candidates = [];
	const seenProviders = /* @__PURE__ */ new Set();
	const addCandidate = (candidate) => {
		candidates.push(candidate);
		seenProviders.add(candidate.provider);
	};
	const refs = resolveSupportedVoiceModelRefs({
		config: params.voiceModelConfig,
		providers: params.providers
	});
	const primaryRefs = refs.filter((ref) => ref.provider === primary);
	for (const voiceModel of primaryRefs) addCandidate({
		provider: primary,
		voiceModel
	});
	if (primaryRefs.length === 0) addCandidate({ provider: primary });
	for (const voiceModel of refs) if (voiceModel.provider !== primary) addCandidate({
		provider: voiceModel.provider,
		voiceModel
	});
	for (const provider of params.providers) if (!seenProviders.has(provider.id)) addCandidate({ provider: provider.id });
	return candidates;
}
/** Resolve only the primary provider candidate for direct synthesis paths. */
function resolvePrimaryVoiceProviderCandidate(params) {
	const provider = findVoiceModelProvider({
		providers: params.providers,
		providerId: params.primaryProvider
	})?.id ?? params.primaryProvider;
	const voiceModel = resolveSupportedVoiceModelRefs({
		config: params.voiceModelConfig,
		providers: params.providers,
		providerId: provider
	})[0];
	return voiceModel ? {
		provider,
		voiceModel
	} : { provider };
}
/** Read provider config by configured id, canonical id, or alias. */
function getVoiceProviderConfig(params) {
	const candidates = [
		normalizeString(params.configuredProviderId),
		params.provider.id,
		...params.provider.aliases ?? []
	].filter((key) => Boolean(key));
	const configuredKeys = Object.keys(params.providerConfigs);
	for (const candidate of candidates) {
		if (Object.hasOwn(params.providerConfigs, candidate)) return params.providerConfigs[candidate] ?? {};
		const normalizedCandidate = normalizeLowercaseString(candidate);
		const matchingKey = configuredKeys.find((key) => normalizeLowercaseString(key) === normalizedCandidate);
		if (matchingKey) return params.providerConfigs[matchingKey] ?? {};
	}
	return {};
}
/** Convert provider metadata into static voice catalog entries. */
function synthesizeVoiceModelCatalogEntries(params) {
	const seen = /* @__PURE__ */ new Set();
	return [params.provider.defaultModel, ...params.provider.models ?? []].flatMap((entry) => {
		const model = normalizeString(entry);
		if (!model || seen.has(model)) return [];
		seen.add(model);
		return [model];
	}).map((model) => {
		const entry = {
			kind: "voice",
			provider: params.provider.id,
			model,
			source: "static",
			capabilities: params.capabilities
		};
		if (params.provider.label) entry.label = params.provider.label;
		if (model === params.provider.defaultModel) entry.default = true;
		if (params.modes) entry.modes = params.modes;
		return entry;
	});
}
//#endregion
Object.defineProperty(exports, "getVoiceProviderConfig", {
	enumerable: true,
	get: function() {
		return getVoiceProviderConfig;
	}
});
Object.defineProperty(exports, "providerMatchesId", {
	enumerable: true,
	get: function() {
		return providerMatchesId;
	}
});
Object.defineProperty(exports, "resolvePrimaryVoiceProviderCandidate", {
	enumerable: true,
	get: function() {
		return resolvePrimaryVoiceProviderCandidate;
	}
});
Object.defineProperty(exports, "resolveSupportedVoiceModelRefs", {
	enumerable: true,
	get: function() {
		return resolveSupportedVoiceModelRefs;
	}
});
Object.defineProperty(exports, "resolveVoiceModelRefs", {
	enumerable: true,
	get: function() {
		return resolveVoiceModelRefs;
	}
});
Object.defineProperty(exports, "resolveVoiceProviderCandidates", {
	enumerable: true,
	get: function() {
		return resolveVoiceProviderCandidates;
	}
});
Object.defineProperty(exports, "synthesizeVoiceModelCatalogEntries", {
	enumerable: true,
	get: function() {
		return synthesizeVoiceModelCatalogEntries;
	}
});
Object.defineProperty(exports, "voiceProviderSupportsModel", {
	enumerable: true,
	get: function() {
		return voiceProviderSupportsModel;
	}
});
