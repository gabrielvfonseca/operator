const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
require("./utils-CXqBhRFw.cjs");
const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
require("./manifest-planner-Bss2KTsa.cjs");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
let _gabrielvfonseca_model_catalog_core_model_catalog_normalize = require("@gabrielvfonseca/model-catalog-core/model-catalog-normalize");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/model-catalog/provider-index/normalize.ts
const OPERATOR_PROVIDER_INDEX_VERSION = 1;
function normalizeSafeKey(value) {
	const key = require_string_coerce.normalizeOptionalString(value) ?? "";
	return key && !require_prototype_keys.isBlockedObjectKey(key) ? key : "";
}
function normalizeInstall(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const clawhubSpec = require_string_coerce.normalizeOptionalString(value.clawhubSpec);
	const parsedClawHub = clawhubSpec ? require_clawhub.parseClawHubPluginSpec(clawhubSpec) : null;
	const npmSpec = require_string_coerce.normalizeOptionalString(value.npmSpec);
	const parsedNpm = npmSpec ? require_npm_registry_spec.parseRegistryNpmSpec(npmSpec) : null;
	if (!parsedClawHub && !parsedNpm) return;
	const defaultChoice = value.defaultChoice === "clawhub" && parsedClawHub ? "clawhub" : value.defaultChoice === "npm" && parsedNpm ? "npm" : void 0;
	const minHostVersion = require_string_coerce.normalizeOptionalString(value.minHostVersion);
	const expectedIntegrity = require_string_coerce.normalizeOptionalString(value.expectedIntegrity);
	return {
		...parsedClawHub ? { clawhubSpec } : {},
		...parsedNpm ? { npmSpec: parsedNpm.raw } : {},
		...defaultChoice ? { defaultChoice } : {},
		...minHostVersion ? { minHostVersion } : {},
		...expectedIntegrity ? { expectedIntegrity } : {}
	};
}
function normalizePlugin(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const id = normalizeSafeKey(value.id);
	if (!id) return;
	const packageName = require_string_coerce.normalizeOptionalString(value.package) ?? "";
	const source = require_string_coerce.normalizeOptionalString(value.source) ?? "";
	const install = normalizeInstall(value.install);
	return {
		id,
		...packageName ? { package: packageName } : {},
		...source ? { source } : {},
		...install ? { install } : {}
	};
}
function normalizeCategories(value) {
	return require_string_normalization.normalizeUniqueTrimmedStringList(value);
}
function normalizePreviewCatalog(params) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_model_catalog_normalize.normalizeModelCatalog)({ providers: { [params.providerId]: params.value } }, { ownedProviders: /* @__PURE__ */ new Set([params.providerId]) })?.providers?.[params.providerId];
	if (!provider) return;
	for (const model of provider.models) model.status ??= "preview";
	return provider;
}
function normalizeOnboardingScopes(value) {
	const scopes = require_string_normalization.normalizeUniqueTrimmedStringList(value).filter((scope) => scope === "text-inference" || scope === "image-generation" || scope === "music-generation");
	return scopes.length > 0 ? scopes : void 0;
}
function normalizeAssistantVisibility(value) {
	return value === "visible" || value === "manual-only" ? value : void 0;
}
function normalizeAuthChoice(params) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.value)) return;
	const method = normalizeSafeKey(params.value.method);
	const choiceId = normalizeSafeKey(params.value.choiceId);
	const choiceLabel = require_string_coerce.normalizeOptionalString(params.value.choiceLabel) ?? "";
	if (!method || !choiceId || !choiceLabel) return;
	const choiceHint = require_string_coerce.normalizeOptionalString(params.value.choiceHint);
	const groupId = normalizeSafeKey(params.value.groupId) || params.providerId;
	const groupLabel = require_string_coerce.normalizeOptionalString(params.value.groupLabel) ?? params.providerName;
	const groupHint = require_string_coerce.normalizeOptionalString(params.value.groupHint);
	const optionKey = normalizeSafeKey(params.value.optionKey);
	const cliFlag = require_string_coerce.normalizeOptionalString(params.value.cliFlag);
	const cliOption = require_string_coerce.normalizeOptionalString(params.value.cliOption);
	const cliDescription = require_string_coerce.normalizeOptionalString(params.value.cliDescription);
	const assistantPriority = require_parse_finite_number.asFiniteNumber(params.value.assistantPriority);
	const assistantVisibility = normalizeAssistantVisibility(params.value.assistantVisibility);
	const onboardingScopes = normalizeOnboardingScopes(params.value.onboardingScopes);
	return {
		method,
		choiceId,
		choiceLabel,
		...choiceHint ? { choiceHint } : {},
		...assistantPriority !== void 0 ? { assistantPriority } : {},
		...assistantVisibility ? { assistantVisibility } : {},
		...groupId ? { groupId } : {},
		...groupLabel ? { groupLabel } : {},
		...groupHint ? { groupHint } : {},
		...optionKey ? { optionKey } : {},
		...cliFlag ? { cliFlag } : {},
		...cliOption ? { cliOption } : {},
		...cliDescription ? { cliDescription } : {},
		...onboardingScopes ? { onboardingScopes } : {}
	};
}
function normalizeAuthChoices(params) {
	if (!Array.isArray(params.value)) return;
	const choices = params.value.map((value) => normalizeAuthChoice({
		...params,
		value
	})).filter((choice) => Boolean(choice));
	return choices.length > 0 ? choices : void 0;
}
function normalizeProvider(rawProviderId, value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const providerId = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(rawProviderId);
	if (!providerId) return;
	const id = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(require_string_coerce.normalizeOptionalString(value.id) ?? "");
	if (id && id !== providerId) return;
	const name = require_string_coerce.normalizeOptionalString(value.name) ?? "";
	const plugin = normalizePlugin(value.plugin);
	if (!name || !plugin) return;
	const docs = require_string_coerce.normalizeOptionalString(value.docs) ?? "";
	const categories = normalizeCategories(value.categories);
	const authChoices = normalizeAuthChoices({
		providerId,
		providerName: name,
		value: value.authChoices
	});
	const previewCatalog = normalizePreviewCatalog({
		providerId,
		value: value.previewCatalog
	});
	return {
		id: providerId,
		name,
		plugin,
		...docs ? { docs } : {},
		...categories.length > 0 ? { categories } : {},
		...authChoices ? { authChoices } : {},
		...previewCatalog ? { previewCatalog } : {}
	};
}
function normalizeOperatorProviderIndex(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || value.version !== OPERATOR_PROVIDER_INDEX_VERSION) return;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.providers)) return;
	const providers = {};
	for (const [rawProviderId, rawProvider] of Object.entries(value.providers)) {
		const providerId = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(rawProviderId);
		if (!providerId || require_prototype_keys.isBlockedObjectKey(providerId)) continue;
		const provider = normalizeProvider(providerId, rawProvider);
		if (provider) providers[providerId] = provider;
	}
	return {
		version: OPERATOR_PROVIDER_INDEX_VERSION,
		providers: Object.fromEntries(Object.entries(providers).toSorted(([left], [right]) => left.localeCompare(right)))
	};
}
//#endregion
//#region src/model-catalog/provider-index/openclaw-provider-index.ts
const OPERATOR_PROVIDER_INDEX = {
	version: 1,
	providers: {
		moonshot: {
			id: "moonshot",
			name: "Moonshot AI",
			plugin: { id: "moonshot" },
			docs: "/providers/moonshot",
			categories: ["cloud", "llm"],
			previewCatalog: { models: [{
				id: "kimi-k2.6",
				name: "Kimi K2.6",
				input: ["text", "image"],
				contextWindow: 262144
			}, {
				id: "kimi-k2.7-code",
				name: "Kimi K2.7 Code",
				reasoning: true,
				input: ["text", "image"],
				contextWindow: 262144
			}] }
		},
		deepseek: {
			id: "deepseek",
			name: "DeepSeek",
			plugin: { id: "deepseek" },
			docs: "/providers/deepseek",
			categories: ["cloud", "llm"],
			previewCatalog: { models: [
				{
					id: "deepseek-v4-flash",
					name: "DeepSeek V4 Flash",
					input: ["text"],
					reasoning: true,
					contextWindow: 1e6
				},
				{
					id: "deepseek-v4-pro",
					name: "DeepSeek V4 Pro",
					input: ["text"],
					reasoning: true,
					contextWindow: 1e6
				},
				{
					id: "deepseek-chat",
					name: "DeepSeek Chat",
					input: ["text"],
					contextWindow: 1e6
				},
				{
					id: "deepseek-reasoner",
					name: "DeepSeek Reasoner",
					input: ["text"],
					reasoning: true,
					contextWindow: 1e6
				}
			] }
		}
	}
};
//#endregion
//#region src/model-catalog/provider-index/load.ts
function loadOperatorProviderIndex(source = OPERATOR_PROVIDER_INDEX) {
	return normalizeOperatorProviderIndex(source) ?? {
		version: 1,
		providers: {}
	};
}
//#endregion
Object.defineProperty(exports, "loadOperatorProviderIndex", {
	enumerable: true,
	get: function() {
		return loadOperatorProviderIndex;
	}
});
