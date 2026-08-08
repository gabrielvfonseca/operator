const require_normalize_secret_input = require("./normalize-secret-input-Dg82qiNj.cjs");
const require_credential_state = require("./credential-state-C5phrsSu.cjs");
const require_model_auth_env = require("./model-auth-env-C9t8YSK1.cjs");
const require_provider_auth_mode = require("./provider-auth-mode-D_4tVmIf.cjs");
const require_provider_auth_ref = require("./provider-auth-ref-DFo0sjpQ.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/provider-auth-input.ts
/** Normalizes provider auth input metadata collected from plugin setup flows. */
const DEFAULT_KEY_PREVIEW = {
	head: 4,
	tail: 4
};
/** Normalizes pasted API-key input, including shell assignment forms. */
function normalizeApiKeyInput(raw) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(raw) ?? "";
	if (!trimmed) return "";
	const normalizedPaste = require_normalize_secret_input.normalizeSecretInput(trimmed);
	const assignmentMatch = normalizedPaste.match(/^(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=\s*(.+)$/);
	const valuePart = assignmentMatch ? (0, _gabrielvfonseca_normalization_core.expectDefined)(assignmentMatch[1], "assignment match capture group 1").trim() : normalizedPaste;
	const withoutSemicolon = valuePart.endsWith(";") ? valuePart.slice(0, -1).trim() : valuePart;
	return require_normalize_secret_input.normalizeSecretInput(withoutSemicolon.length >= 2 && (withoutSemicolon.startsWith("\"") && withoutSemicolon.endsWith("\"") || withoutSemicolon.startsWith("'") && withoutSemicolon.endsWith("'") || withoutSemicolon.startsWith("`") && withoutSemicolon.endsWith("`")) ? withoutSemicolon.slice(1, -1) : withoutSemicolon);
}
/** Validates required API-key input for setup prompts. */
const validateApiKeyInput = (value) => {
	const normalized = normalizeApiKeyInput(value);
	if (!normalized) return "Required";
	if (require_credential_state.isMalformedApiKeyInput(normalized)) return "Paste the API key value, not an Operator onboarding command.";
};
/** Formats a redacted API-key preview for setup confirmation prompts. */
function formatApiKeyPreview(raw, opts = {}) {
	const trimmed = raw.trim();
	if (!trimmed) return "…";
	const head = opts.head ?? DEFAULT_KEY_PREVIEW.head;
	const tail = opts.tail ?? DEFAULT_KEY_PREVIEW.tail;
	if (trimmed.length <= head + tail) {
		const shortHead = Math.min(2, trimmed.length);
		const shortTail = Math.min(2, trimmed.length - shortHead);
		if (shortTail <= 0) return `${trimmed.slice(0, shortHead)}…`;
		return `${trimmed.slice(0, shortHead)}…${trimmed.slice(-shortTail)}`;
	}
	return `${trimmed.slice(0, head)}…${trimmed.slice(-tail)}`;
}
/** Normalizes a token-provider selector from CLI/options input. */
function normalizeTokenProviderInput(tokenProvider) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(tokenProvider);
}
/** Applies a CLI-provided API key when its provider selector matches this auth method. */
async function maybeApplyApiKeyFromOption(params) {
	const tokenProvider = normalizeTokenProviderInput(params.tokenProvider);
	const expectedProviders = params.expectedProviders.map((provider) => normalizeTokenProviderInput(provider)).filter((provider) => Boolean(provider));
	if (!params.token || !tokenProvider || !expectedProviders.includes(tokenProvider)) return;
	const apiKey = params.normalize(params.token);
	const validationError = params.validate?.(apiKey);
	if (validationError) throw new Error(validationError);
	await params.setCredential(apiKey, params.secretInputMode);
	return apiKey;
}
/** Resolves an API key from CLI options first, then environment or prompt fallback. */
async function ensureApiKeyFromOptionEnvOrPrompt(params) {
	const optionApiKey = await maybeApplyApiKeyFromOption({
		token: params.token,
		tokenProvider: params.tokenProvider,
		secretInputMode: params.secretInputMode,
		expectedProviders: params.expectedProviders,
		normalize: params.normalize,
		validate: params.validate,
		setCredential: params.setCredential
	});
	if (optionApiKey) return optionApiKey;
	if (params.noteMessage) await params.prompter.note(params.noteMessage, params.noteTitle);
	return await ensureApiKeyFromEnvOrPrompt({
		config: params.config,
		env: params.env,
		provider: params.provider,
		envLabel: params.envLabel,
		promptMessage: params.promptMessage,
		normalize: params.normalize,
		validate: params.validate,
		prompter: params.prompter,
		secretInputMode: params.secretInputMode,
		setCredential: params.setCredential
	});
}
/** Resolves an API key from environment or interactive prompt and records the chosen secret mode. */
async function ensureApiKeyFromEnvOrPrompt(params) {
	const selectedMode = await require_provider_auth_mode.resolveSecretInputModeForEnvSelection({
		prompter: params.prompter,
		explicitMode: params.secretInputMode
	});
	const env = params.env ?? process.env;
	const envKey = require_model_auth_env.resolveEnvApiKey(params.provider, env);
	if (selectedMode === "ref") {
		if (typeof params.prompter.select !== "function") {
			const fallback = require_provider_auth_ref.resolveRefFallbackInput({
				config: params.config,
				provider: params.provider,
				preferredEnvVar: envKey?.source ? require_provider_auth_ref.extractEnvVarFromSourceLabel(envKey.source) : void 0,
				env
			});
			await params.setCredential(fallback.ref, selectedMode);
			return fallback.resolvedValue;
		}
		const resolved = await require_provider_auth_ref.promptSecretRefForSetup({
			provider: params.provider,
			config: params.config,
			prompter: params.prompter,
			preferredEnvVar: envKey?.source ? require_provider_auth_ref.extractEnvVarFromSourceLabel(envKey.source) : void 0,
			env
		});
		await params.setCredential(resolved.ref, selectedMode);
		return resolved.resolvedValue;
	}
	if (envKey && selectedMode === "plaintext") {
		if (await params.prompter.confirm({
			message: `Use existing ${params.envLabel} (${envKey.source}, ${formatApiKeyPreview(envKey.apiKey)})?`,
			initialValue: true
		})) {
			await params.setCredential(envKey.apiKey, selectedMode);
			return envKey.apiKey;
		}
	}
	const key = await params.prompter.text({
		message: params.promptMessage,
		placeholder: "API key",
		validate: params.validate,
		sensitive: true
	});
	const apiKey = params.normalize(key ?? "");
	await params.setCredential(apiKey, selectedMode);
	return apiKey;
}
//#endregion
Object.defineProperty(exports, "ensureApiKeyFromEnvOrPrompt", {
	enumerable: true,
	get: function() {
		return ensureApiKeyFromEnvOrPrompt;
	}
});
Object.defineProperty(exports, "ensureApiKeyFromOptionEnvOrPrompt", {
	enumerable: true,
	get: function() {
		return ensureApiKeyFromOptionEnvOrPrompt;
	}
});
Object.defineProperty(exports, "normalizeApiKeyInput", {
	enumerable: true,
	get: function() {
		return normalizeApiKeyInput;
	}
});
Object.defineProperty(exports, "normalizeTokenProviderInput", {
	enumerable: true,
	get: function() {
		return normalizeTokenProviderInput;
	}
});
Object.defineProperty(exports, "validateApiKeyInput", {
	enumerable: true,
	get: function() {
		return validateApiKeyInput;
	}
});
