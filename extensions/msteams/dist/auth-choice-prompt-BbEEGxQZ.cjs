require("./rolldown-runtime-u92d-OFm.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_provider_auth_choices = require("./provider-auth-choices-Dr0zOwrP.cjs");
const require_provider_install_catalog = require("./provider-install-catalog-Buj0eWKh.cjs");
const require_types = require("./types-UmTODxd_.cjs");
const require_provider_auth_choice_order = require("./provider-auth-choice-order-BIqyryg2.cjs");
require("./auth-choice-legacy-BwWjiCjY.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
//#region src/flows/provider-flow.ts
const DEFAULT_PROVIDER_FLOW_SCOPE = "text-inference";
function includesProviderFlowScope(scopes, scope) {
	return scopes ? scopes.includes(scope) : scope === DEFAULT_PROVIDER_FLOW_SCOPE;
}
function resolveInstallCatalogProviderSetupFlowContributions(params) {
	const scope = params?.scope ?? DEFAULT_PROVIDER_FLOW_SCOPE;
	const normalizedPluginsConfig = require_config_state.normalizePluginsConfig(params?.config?.plugins);
	return require_provider_install_catalog.resolveProviderInstallCatalogEntries({
		...params,
		includeUntrustedWorkspacePlugins: false
	}).filter((entry) => includesProviderFlowScope(entry.onboardingScopes, scope) && require_config_state.resolveEffectiveEnableState({
		id: entry.pluginId,
		origin: entry.origin,
		config: normalizedPluginsConfig,
		rootConfig: params?.config,
		enabledByDefault: true
	}).enabled).map((entry) => {
		const groupId = entry.groupId ?? entry.providerId;
		const groupLabel = entry.groupLabel ?? entry.label;
		return Object.assign({
			id: `provider:setup:${entry.choiceId}`,
			kind: `provider`,
			surface: `setup`,
			providerId: entry.providerId,
			pluginId: entry.pluginId,
			option: {
				value: entry.choiceId,
				label: entry.choiceLabel,
				...entry.choiceHint ? { hint: entry.choiceHint } : {},
				...entry.assistantPriority !== void 0 ? { assistantPriority: entry.assistantPriority } : {},
				...entry.assistantVisibility ? { assistantVisibility: entry.assistantVisibility } : {},
				group: {
					id: groupId,
					label: groupLabel,
					...entry.groupHint ? { hint: entry.groupHint } : {}
				}
			}
		}, entry.onboardingScopes ? { onboardingScopes: [...entry.onboardingScopes] } : {}, { source: `install-catalog` });
	});
}
function resolveManifestProviderSetupFlowContributions(params) {
	const scope = params?.scope ?? DEFAULT_PROVIDER_FLOW_SCOPE;
	return require_provider_auth_choices.resolveManifestProviderAuthChoices({
		...params,
		includeUntrustedWorkspacePlugins: false
	}).filter((choice) => includesProviderFlowScope(choice.onboardingScopes, scope)).map((choice) => {
		const groupId = choice.groupId ?? choice.providerId;
		const groupLabel = choice.groupLabel ?? choice.choiceLabel;
		return Object.assign({
			id: `provider:setup:${choice.choiceId}`,
			kind: `provider`,
			surface: `setup`,
			providerId: choice.providerId,
			pluginId: choice.pluginId,
			option: {
				value: choice.choiceId,
				label: choice.choiceLabel,
				...choice.choiceHint ? { hint: choice.choiceHint } : {},
				...choice.assistantPriority !== void 0 ? { assistantPriority: choice.assistantPriority } : {},
				...choice.assistantVisibility ? { assistantVisibility: choice.assistantVisibility } : {},
				...choice.onboardingFeatured ? { onboardingFeatured: true } : {},
				group: {
					id: groupId,
					label: groupLabel,
					...choice.groupHint ? { hint: choice.groupHint } : {}
				}
			}
		}, choice.onboardingScopes ? { onboardingScopes: [...choice.onboardingScopes] } : {}, { source: `manifest` });
	});
}
function resolveProviderSetupFlowContributions(params) {
	const scope = params?.scope ?? DEFAULT_PROVIDER_FLOW_SCOPE;
	const manifestContributions = resolveManifestProviderSetupFlowContributions({
		...params,
		scope
	});
	const seenOptionValues = new Set(manifestContributions.map((contribution) => contribution.option.value));
	const installCatalogContributions = resolveInstallCatalogProviderSetupFlowContributions({
		...params,
		scope
	}).filter((contribution) => !seenOptionValues.has(contribution.option.value));
	return require_types.sortFlowContributionsByLabel([...manifestContributions, ...installCatalogContributions]);
}
//#endregion
//#region src/commands/auth-choice-options.static.ts
const CORE_AUTH_CHOICE_OPTIONS = [{
	value: "custom-api-key",
	label: "Custom Provider",
	hint: "Any OpenAI or Anthropic compatible endpoint",
	groupId: "custom",
	groupLabel: "Custom Provider",
	groupHint: "Any OpenAI or Anthropic compatible endpoint"
}];
//#endregion
//#region src/commands/auth-choice-options.ts
function compareOptionLabels(a, b) {
	return a.label.localeCompare(b.label);
}
/** Keep the first-tier provider list stable; every other group belongs under More. */
function isFeaturedAuthChoiceGroup(group) {
	return require_provider_auth_choice_order.isFeaturedProviderAuthChoiceGroup(group.value);
}
function compareAssistantOptions(a, b) {
	return (a.assistantPriority ?? 0) - (b.assistantPriority ?? 0) || compareOptionLabels(a, b);
}
/** Sort auth-choice groups with featured providers first, then stable labels. */
function compareAuthChoiceGroups(a, b) {
	return require_provider_auth_choice_order.compareProviderAuthChoiceGroups({
		id: a.value,
		label: a.label
	}, {
		id: b.value,
		label: b.label
	});
}
function resolveProviderChoiceOptions(params) {
	return resolveProviderSetupFlowContributions({
		...params,
		scope: "text-inference"
	}).map((contribution) => Object.assign({}, {
		value: contribution.option.value,
		label: contribution.option.label
	}, { providerId: contribution.providerId }, contribution.option.hint ? { hint: contribution.option.hint } : {}, contribution.option.assistantPriority !== void 0 ? { assistantPriority: contribution.option.assistantPriority } : {}, contribution.option.assistantVisibility ? { assistantVisibility: contribution.option.assistantVisibility } : {}, contribution.option.group ? {
		groupId: contribution.option.group.id,
		groupLabel: contribution.option.group.label,
		...contribution.option.group.hint ? { groupHint: contribution.option.group.hint } : {}
	} : {}, contribution.option.onboardingFeatured ? { onboardingFeatured: true } : {}));
}
/** Build flat auth-choice options from core choices plus provider setup flows. */
function buildAuthChoiceOptions(params) {
	params.store;
	const optionByValue = /* @__PURE__ */ new Map();
	for (const option of CORE_AUTH_CHOICE_OPTIONS) optionByValue.set(option.value, option);
	for (const option of resolveProviderChoiceOptions({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	})) optionByValue.set(option.value, option);
	const options = Array.from(optionByValue.values()).toSorted(compareOptionLabels).filter((option) => params.assistantVisibleOnly ? option.assistantVisibility !== "manual-only" : true);
	if (params.includeSkip) options.push({
		value: "skip",
		label: "Skip for now"
	});
	return options;
}
/** Build grouped auth choices, filtering manual-only methods by default. */
function buildAuthChoiceGroups(params) {
	const options = buildAuthChoiceOptions({
		...params,
		includeSkip: false,
		assistantVisibleOnly: params.assistantVisibleOnly ?? true
	});
	const groupsById = /* @__PURE__ */ new Map();
	for (const option of options) {
		if (!option.groupId || !option.groupLabel) continue;
		const existing = groupsById.get(option.groupId);
		if (existing) {
			existing.options.push(option);
			if (option.providerId) existing.providerIds = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...existing.providerIds ?? [], option.providerId]);
			continue;
		}
		const providerIds = option.providerId ? [option.providerId] : [];
		groupsById.set(option.groupId, {
			value: option.groupId,
			label: option.groupLabel,
			...option.groupHint ? { hint: option.groupHint } : {},
			...providerIds.length > 0 ? { providerIds } : {},
			options: [option]
		});
	}
	return {
		groups: Array.from(groupsById.values()).map((group) => Object.assign({}, group, { options: [...group.options].toSorted(compareAssistantOptions) })).toSorted(compareAuthChoiceGroups),
		skipOption: params.includeSkip ? {
			value: "skip",
			label: "Skip for now"
		} : void 0
	};
}
//#endregion
//#region src/commands/auth-choice-prompt.ts
const BACK_VALUE = "__back";
const MORE_VALUE = "__more";
const KEEP_CURRENT_AUTH_CHOICE = "__keep-current";
function resolveConfiguredModelRef(config) {
	return require_model_input.resolveAgentModelPrimaryValue(config?.agents?.defaults?.model);
}
function resolveConfiguredProvider(config) {
	const modelRef = resolveConfiguredModelRef(config);
	const slashIndex = modelRef?.indexOf("/") ?? -1;
	if (!modelRef || slashIndex <= 0) return;
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(modelRef.slice(0, slashIndex)) || void 0;
}
function groupMatchesProvider(group, provider) {
	if (!provider) return false;
	return [group.value, ...group.providerIds ?? []].some((candidate) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(candidate) === provider);
}
function groupToOption(group, configuredProvider) {
	const configured = groupMatchesProvider(group, configuredProvider);
	return {
		value: group.value,
		label: configured ? `${group.label} (currently configured)` : group.label,
		hint: group.hint
	};
}
async function promptAuthChoiceGrouped(params) {
	const { groups, skipOption } = buildAuthChoiceGroups(params);
	const availableGroups = [...params.allowedChoices ? groups.map((group) => ({
		...group,
		options: group.options.filter((option) => params.allowedChoices?.has(option.value))
	})) : groups, ...params.additionalGroups ?? []].filter((group) => group.options.length > 0);
	const groupById = new Map(availableGroups.map((group) => [group.value, group]));
	const featuredGroups = availableGroups.filter(isFeaturedAuthChoiceGroup).toSorted(compareAuthChoiceGroups);
	const moreGroups = availableGroups.filter((group) => !isFeaturedAuthChoiceGroup(group)).toSorted(compareAuthChoiceGroups);
	const configuredModelRef = resolveConfiguredModelRef(params.config);
	const configuredProvider = params.allowKeepCurrentProvider ? resolveConfiguredProvider(params.config) : void 0;
	const pickMethod = async (group) => {
		const keepCurrentOption = groupMatchesProvider(group, configuredProvider) ? {
			value: KEEP_CURRENT_AUTH_CHOICE,
			label: "Keep current config",
			...configuredModelRef ? { hint: `Keep ${configuredModelRef}` } : {}
		} : void 0;
		if (group.options.length === 1 && !keepCurrentOption) return (0, _gabrielvfonseca_normalization_core.expectDefined)(group.options[0], "options entry at 0").value;
		return await params.prompter.select({
			message: `${group.label} auth method`,
			options: [
				...keepCurrentOption ? [keepCurrentOption] : [],
				...group.options,
				{
					value: BACK_VALUE,
					label: "Back"
				}
			]
		});
	};
	const pickFromMore = async () => {
		while (true) {
			const options = moreGroups.map((group) => groupToOption(group, configuredProvider));
			options.push({
				value: BACK_VALUE,
				label: "Back"
			});
			const selection = await params.prompter.select({
				message: "Model/auth provider",
				options,
				searchable: true
			});
			if (selection === BACK_VALUE) return BACK_VALUE;
			const group = groupById.get(selection);
			if (!group) continue;
			const method = await pickMethod(group);
			if (method === BACK_VALUE) continue;
			return method;
		}
	};
	const runFlat = async () => {
		while (true) {
			const flatOptions = moreGroups.map((group) => groupToOption(group, configuredProvider));
			if (skipOption) flatOptions.push({
				value: skipOption.value,
				label: skipOption.label
			});
			const selection = await params.prompter.select({
				message: "Model/auth provider",
				options: flatOptions,
				searchable: true
			});
			if (selection === "skip") return "skip";
			const group = groupById.get(selection);
			if (!group || group.options.length === 0) {
				await params.prompter.note("No auth methods available for that provider.", "Model/auth choice");
				continue;
			}
			const method = await pickMethod(group);
			if (method === BACK_VALUE) continue;
			return method;
		}
	};
	if (featuredGroups.length === 0) return runFlat();
	while (true) {
		const topTier = featuredGroups.map((group) => groupToOption(group, configuredProvider));
		if (moreGroups.length > 0) topTier.push({
			value: MORE_VALUE,
			label: "More…"
		});
		if (skipOption) topTier.push({
			value: skipOption.value,
			label: skipOption.label
		});
		const topSelection = await params.prompter.select({
			message: "Model/auth provider",
			options: topTier
		});
		if (topSelection === "skip") return "skip";
		if (topSelection === MORE_VALUE) {
			const more = await pickFromMore();
			if (more === BACK_VALUE) continue;
			return more;
		}
		const group = groupById.get(topSelection);
		if (!group || group.options.length === 0) {
			await params.prompter.note("No auth methods available for that provider.", "Model/auth choice");
			continue;
		}
		const method = await pickMethod(group);
		if (method === BACK_VALUE) continue;
		return method;
	}
}
//#endregion
exports.KEEP_CURRENT_AUTH_CHOICE = KEEP_CURRENT_AUTH_CHOICE;
exports.promptAuthChoiceGrouped = promptAuthChoiceGrouped;
