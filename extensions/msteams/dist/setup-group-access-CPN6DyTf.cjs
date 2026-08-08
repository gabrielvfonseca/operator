const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./dm-access-UxTYSelO.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
require("./setup-promotion-keys-TEAYX4y9.cjs");
const require_terminal_link = require("./terminal-link-DY3YwYeO.cjs");
const require_provider_auth_mode = require("./provider-auth-mode-D_4tVmIf.cjs");
let zod = require("zod");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
zod.z.object({ useEnv: zod.z.boolean().optional() }).passthrough();
//#endregion
//#region packages/terminal-core/src/links.ts
function resolveDocsRoot() {
	return "https://docs.openclaw.ai";
}
const ABSOLUTE_HTTP_URL_RE = /^https?:\/\//i;
function formatDocsLink(path, label, opts) {
	const docsRoot = resolveDocsRoot();
	const trimmed = typeof path === "string" ? path.trim() : "";
	const url = trimmed ? ABSOLUTE_HTTP_URL_RE.test(trimmed) ? trimmed : `${docsRoot}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}` : docsRoot;
	return require_terminal_link.formatTerminalLink(label ?? url, url, {
		fallback: opts?.fallback ?? url,
		force: opts?.force
	});
}
//#endregion
//#region src/channels/plugins/setup-wizard-helpers.ts
/**
* Channel setup wizard helper functions.
*
* Prompts account ids, credentials, allowlists, and account-scoped setup config updates.
*/
const loadProviderAuthInput = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./provider-auth-ref-DFo0sjpQ.cjs")).then((n) => n.provider_auth_ref_exports));
const promptAccountId = async (params) => {
	const existingIds = params.listAccountIds(params.cfg);
	const initial = params.currentId?.trim() || params.defaultAccountId || "default";
	const choice = await params.prompter.select({
		message: `${params.label} account`,
		options: [...existingIds.map((id) => ({
			value: id,
			label: id === "default" ? "default (primary)" : id
		})), {
			value: "__new__",
			label: "Add a new account"
		}],
		initialValue: initial
	});
	if (choice !== "__new__") return require_account_id.normalizeAccountId(choice);
	const entered = await params.prompter.text({
		message: `New ${params.label} account id`,
		validate: (value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ? void 0 : "Required"
	});
	const normalized = require_account_id.normalizeAccountId(entered);
	if (((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entered) ?? "") !== normalized) await params.prompter.note(`Normalized account id to "${normalized}".`, `${params.label} account`);
	return normalized;
};
function addWildcardAllowFrom(allowFrom) {
	const next = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(allowFrom ?? []);
	if (!next.includes("*")) next.push("*");
	return next;
}
function mergeAllowFromEntries(current, additions) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)([...current ?? [], ...additions]));
}
function splitSetupEntries(raw) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(raw.split(/[\n,;]+/g));
}
function createStandardChannelSetupStatus(params) {
	const status = {
		configuredLabel: params.configuredLabel,
		unconfiguredLabel: params.unconfiguredLabel,
		resolveConfigured: params.resolveConfigured,
		...params.configuredHint ? { configuredHint: params.configuredHint } : {},
		...params.unconfiguredHint ? { unconfiguredHint: params.unconfiguredHint } : {},
		...typeof params.configuredScore === "number" ? { configuredScore: params.configuredScore } : {},
		...typeof params.unconfiguredScore === "number" ? { unconfiguredScore: params.unconfiguredScore } : {}
	};
	if (params.includeStatusLine || params.resolveExtraStatusLines) status.resolveStatusLines = async ({ cfg, accountId, configured }) => {
		const lines = params.includeStatusLine ? [`${params.channelLabel}: ${configured ? params.configuredLabel : params.unconfiguredLabel}`] : [];
		const extraLines = await params.resolveExtraStatusLines?.({
			cfg,
			accountId,
			configured
		}) ?? [];
		return [...lines, ...extraLines];
	};
	return status;
}
async function resolveAccountIdForConfigure(params) {
	const override = params.accountOverride?.trim();
	let accountId = override ? require_account_id.normalizeAccountId(override) : params.defaultAccountId;
	if (params.shouldPromptAccountIds && !override) accountId = await promptAccountId({
		cfg: params.cfg,
		prompter: params.prompter,
		label: params.label,
		currentId: accountId,
		listAccountIds: params.listAccountIds,
		defaultAccountId: params.defaultAccountId
	});
	return accountId;
}
function patchTopLevelChannelConfigSection(params) {
	const channelConfig = { ...params.cfg.channels?.[params.channel] };
	for (const field of params.clearFields ?? []) delete channelConfig[field];
	return {
		...params.cfg,
		channels: {
			...params.cfg.channels,
			[params.channel]: {
				...channelConfig,
				...params.enabled ? { enabled: true } : {},
				...params.patch
			}
		}
	};
}
function setTopLevelChannelAllowFrom(params) {
	return patchTopLevelChannelConfigSection({
		cfg: params.cfg,
		channel: params.channel,
		enabled: params.enabled,
		patch: { allowFrom: params.allowFrom }
	});
}
function setTopLevelChannelDmPolicyWithAllowFrom(params) {
	const channelConfig = params.cfg.channels?.[params.channel] ?? {};
	const existingAllowFrom = params.getAllowFrom?.(params.cfg) ?? channelConfig.allowFrom ?? void 0;
	const allowFrom = params.dmPolicy === "open" ? addWildcardAllowFrom(existingAllowFrom) : void 0;
	return patchTopLevelChannelConfigSection({
		cfg: params.cfg,
		channel: params.channel,
		patch: {
			dmPolicy: params.dmPolicy,
			...allowFrom ? { allowFrom } : {}
		}
	});
}
function setTopLevelChannelGroupPolicy(params) {
	return patchTopLevelChannelConfigSection({
		cfg: params.cfg,
		channel: params.channel,
		enabled: params.enabled,
		patch: { groupPolicy: params.groupPolicy }
	});
}
function createTopLevelChannelDmPolicy(params) {
	const setPolicy = createTopLevelChannelDmPolicySetter({
		channel: params.channel,
		getAllowFrom: params.getAllowFrom
	});
	return {
		label: params.label,
		channel: params.channel,
		policyKey: params.policyKey,
		allowFromKey: params.allowFromKey,
		getCurrent: params.getCurrent,
		setPolicy,
		...params.promptAllowFrom ? { promptAllowFrom: params.promptAllowFrom } : {}
	};
}
function createTopLevelChannelDmPolicySetter(params) {
	return (cfg, dmPolicy) => setTopLevelChannelDmPolicyWithAllowFrom({
		cfg,
		channel: params.channel,
		dmPolicy,
		getAllowFrom: params.getAllowFrom
	});
}
function createTopLevelChannelAllowFromSetter(params) {
	return (cfg, allowFrom) => setTopLevelChannelAllowFrom({
		cfg,
		channel: params.channel,
		allowFrom,
		enabled: params.enabled
	});
}
function createTopLevelChannelGroupPolicySetter(params) {
	return (cfg, groupPolicy) => setTopLevelChannelGroupPolicy({
		cfg,
		channel: params.channel,
		groupPolicy,
		enabled: params.enabled
	});
}
function buildSingleChannelSecretPromptState(params) {
	return {
		accountConfigured: params.accountConfigured,
		hasConfigToken: params.hasConfigToken,
		canUseEnv: params.allowEnv && Boolean(params.envValue?.trim()) && !params.hasConfigToken
	};
}
async function promptSingleChannelToken(params) {
	const promptToken = async () => (await params.prompter.text({
		message: params.inputPrompt,
		sensitive: true,
		validate: (value) => value?.trim() ? void 0 : "Required"
	})).trim();
	if (params.canUseEnv) {
		if (await params.prompter.confirm({
			message: params.envPrompt,
			initialValue: true
		})) return {
			useEnv: true,
			token: null
		};
		return {
			useEnv: false,
			token: await promptToken()
		};
	}
	if (params.hasConfigToken && params.accountConfigured) {
		if (await params.prompter.confirm({
			message: params.keepPrompt,
			initialValue: true
		})) return {
			useEnv: false,
			token: null
		};
	}
	return {
		useEnv: false,
		token: await promptToken()
	};
}
async function runSingleChannelSecretStep(params) {
	const promptState = buildSingleChannelSecretPromptState({
		accountConfigured: params.accountConfigured,
		hasConfigToken: params.hasConfigToken,
		allowEnv: params.allowEnv,
		envValue: params.envValue
	});
	if (!promptState.accountConfigured && params.onMissingConfigured) await params.onMissingConfigured();
	const result = await promptSingleChannelSecretInput({
		cfg: params.cfg,
		prompter: params.prompter,
		providerHint: params.providerHint,
		credentialLabel: params.credentialLabel,
		secretInputMode: params.secretInputMode,
		accountConfigured: promptState.accountConfigured,
		canUseEnv: promptState.canUseEnv,
		hasConfigToken: promptState.hasConfigToken,
		envPrompt: params.envPrompt,
		keepPrompt: params.keepPrompt,
		inputPrompt: params.inputPrompt,
		preferredEnvVar: params.preferredEnvVar
	});
	if (result.action === "use-env") return {
		cfg: params.applyUseEnv ? await params.applyUseEnv(params.cfg) : params.cfg,
		action: result.action,
		resolvedValue: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.envValue)
	};
	if (result.action === "set") return {
		cfg: params.applySet ? await params.applySet(params.cfg, result.value, result.resolvedValue) : params.cfg,
		action: result.action,
		resolvedValue: result.resolvedValue
	};
	return {
		cfg: params.cfg,
		action: result.action
	};
}
async function promptSingleChannelSecretInput(params) {
	if (await require_provider_auth_mode.resolveSecretInputModeForEnvSelection({
		prompter: params.prompter,
		explicitMode: params.secretInputMode,
		copy: {
			modeMessage: `How do you want to provide this ${params.credentialLabel}?`,
			plaintextLabel: `Enter ${params.credentialLabel}`,
			plaintextHint: "Stores the credential directly in Operator config",
			refLabel: "Use external secret provider",
			refHint: "Stores a reference to env or configured external secret providers"
		}
	}) === "plaintext") {
		const plainResult = await promptSingleChannelToken({
			prompter: params.prompter,
			accountConfigured: params.accountConfigured,
			canUseEnv: params.canUseEnv,
			hasConfigToken: params.hasConfigToken,
			envPrompt: params.envPrompt,
			keepPrompt: params.keepPrompt,
			inputPrompt: params.inputPrompt
		});
		if (plainResult.useEnv) return { action: "use-env" };
		if (plainResult.token) return {
			action: "set",
			value: plainResult.token,
			resolvedValue: plainResult.token
		};
		return { action: "keep" };
	}
	if (params.hasConfigToken && params.accountConfigured) {
		if (await params.prompter.confirm({
			message: params.keepPrompt,
			initialValue: true
		})) return { action: "keep" };
	}
	const { promptSecretRefForSetup } = await loadProviderAuthInput();
	const resolved = await promptSecretRefForSetup({
		provider: params.providerHint,
		config: params.cfg,
		prompter: params.prompter,
		preferredEnvVar: params.preferredEnvVar,
		copy: {
			sourceMessage: `Where is this ${params.credentialLabel} stored?`,
			envVarPlaceholder: params.preferredEnvVar ?? "OPERATOR_SECRET",
			envVarFormatError: "Use an env var name like \"OPERATOR_SECRET\" (uppercase letters, numbers, underscores).",
			noProvidersMessage: "No file/exec secret providers are configured yet. Add one under secrets.providers, or select Environment variable."
		}
	});
	return {
		action: "set",
		value: resolved.ref,
		resolvedValue: resolved.resolvedValue
	};
}
async function promptResolvedAllowFrom(params) {
	while (true) {
		const entry = await params.prompter.text({
			message: params.message,
			placeholder: params.placeholder,
			initialValue: params.existing[0] ? String(params.existing[0]) : void 0,
			validate: (value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ? void 0 : "Required"
		});
		const parts = params.parseInputs(entry);
		if (!params.token) {
			const ids = parts.map(params.parseId).filter(Boolean);
			if (ids.length !== parts.length) {
				await params.prompter.note(params.invalidWithoutTokenNote, params.label);
				continue;
			}
			return mergeAllowFromEntries(params.existing, ids);
		}
		const results = await params.resolveEntries({
			token: params.token,
			entries: parts
		}).catch(() => null);
		if (!results) {
			await params.prompter.note("Failed to resolve usernames. Try again.", params.label);
			continue;
		}
		const unresolved = results.filter((res) => !res.resolved || !res.id);
		if (unresolved.length > 0) {
			await params.prompter.note(`Could not resolve: ${unresolved.map((res) => res.input).join(", ")}`, params.label);
			continue;
		}
		const ids = results.map((res) => res.id);
		return mergeAllowFromEntries(params.existing, ids);
	}
}
//#endregion
//#region src/channels/plugins/setup-group-access.ts
/**
* Channel setup group access prompts.
*
* Prompts and normalizes allowlist/open/disabled group access policy choices.
*/
/**
* Parses comma, semicolon, or newline separated allowlist entries.
*/
function parseAllowlistEntries(raw) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(raw.split(/[\n,;]+/g));
}
/**
* Formats allowlist entries for setup prompt initial values.
*/
function formatAllowlistEntries(entries) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(entries).join(", ");
}
/**
* Prompts for the group access policy allowed by the channel setup flow.
*/
async function promptChannelAccessPolicy(params) {
	const options = [{
		value: "allowlist",
		label: "Allowlist (recommended)"
	}];
	if (params.allowOpen !== false) options.push({
		value: "open",
		label: "Open (allow all channels)"
	});
	if (params.allowDisabled !== false) options.push({
		value: "disabled",
		label: "Disabled (block all channels)"
	});
	const initialValue = params.currentPolicy ?? "allowlist";
	return await params.prompter.select({
		message: `${params.label} access`,
		options,
		initialValue
	});
}
/**
* Prompts for group allowlist entries and normalizes the response.
*/
async function promptChannelAllowlist(params) {
	const initialValue = params.currentEntries && params.currentEntries.length > 0 ? formatAllowlistEntries(params.currentEntries) : void 0;
	return parseAllowlistEntries(await params.prompter.text({
		message: `${params.label} allowlist (comma-separated)`,
		placeholder: params.placeholder,
		initialValue
	}));
}
/**
* Prompts for the full group access config, including allowlist entries when needed.
*/
async function promptChannelAccessConfig(params) {
	const hasEntries = (params.currentEntries ?? []).length > 0;
	const shouldPrompt = params.defaultPrompt ?? !hasEntries;
	if (!await params.prompter.confirm({
		message: params.updatePrompt ? `Update ${params.label} access?` : `Configure ${params.label} access?`,
		initialValue: shouldPrompt
	})) return null;
	const policy = await promptChannelAccessPolicy({
		prompter: params.prompter,
		label: params.label,
		currentPolicy: params.currentPolicy,
		allowOpen: params.allowOpen,
		allowDisabled: params.allowDisabled
	});
	if (policy !== "allowlist") return {
		policy,
		entries: []
	};
	if (params.skipAllowlistEntries) return {
		policy,
		entries: []
	};
	return {
		policy,
		entries: await promptChannelAllowlist({
			prompter: params.prompter,
			label: params.label,
			currentEntries: params.currentEntries,
			placeholder: params.placeholder
		})
	};
}
//#endregion
Object.defineProperty(exports, "createStandardChannelSetupStatus", {
	enumerable: true,
	get: function() {
		return createStandardChannelSetupStatus;
	}
});
Object.defineProperty(exports, "createTopLevelChannelAllowFromSetter", {
	enumerable: true,
	get: function() {
		return createTopLevelChannelAllowFromSetter;
	}
});
Object.defineProperty(exports, "createTopLevelChannelDmPolicy", {
	enumerable: true,
	get: function() {
		return createTopLevelChannelDmPolicy;
	}
});
Object.defineProperty(exports, "createTopLevelChannelGroupPolicySetter", {
	enumerable: true,
	get: function() {
		return createTopLevelChannelGroupPolicySetter;
	}
});
Object.defineProperty(exports, "formatDocsLink", {
	enumerable: true,
	get: function() {
		return formatDocsLink;
	}
});
Object.defineProperty(exports, "mergeAllowFromEntries", {
	enumerable: true,
	get: function() {
		return mergeAllowFromEntries;
	}
});
Object.defineProperty(exports, "promptChannelAccessConfig", {
	enumerable: true,
	get: function() {
		return promptChannelAccessConfig;
	}
});
Object.defineProperty(exports, "promptResolvedAllowFrom", {
	enumerable: true,
	get: function() {
		return promptResolvedAllowFrom;
	}
});
Object.defineProperty(exports, "resolveAccountIdForConfigure", {
	enumerable: true,
	get: function() {
		return resolveAccountIdForConfigure;
	}
});
Object.defineProperty(exports, "runSingleChannelSecretStep", {
	enumerable: true,
	get: function() {
		return runSingleChannelSecretStep;
	}
});
Object.defineProperty(exports, "splitSetupEntries", {
	enumerable: true,
	get: function() {
		return splitSetupEntries;
	}
});
