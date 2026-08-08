const require_normalize_secret_input = require("./normalize-secret-input-Dg82qiNj.cjs");
//#region src/agents/model-auth-runtime-shared.ts
/**
* Shared provider-auth runtime types and errors. Provider calls use these
* helpers to fail with actionable auth provenance while keeping secret
* normalization local.
*/
const AWS_BEARER_ENV = "AWS_BEARER_TOKEN_BEDROCK";
const AWS_ACCESS_KEY_ENV = "AWS_ACCESS_KEY_ID";
const AWS_SECRET_KEY_ENV = "AWS_SECRET_ACCESS_KEY";
const AWS_PROFILE_ENV = "AWS_PROFILE";
/** Base provider auth error with a stable code for retry/fallback logic. */
var ProviderAuthError = class extends Error {
	constructor(code, provider, message) {
		super(message);
		this.name = "ProviderAuthError";
		this.code = code;
		this.provider = provider;
	}
};
/** Auth error raised when a resolved provider auth source lacks usable material. */
var MissingProviderAuthError = class extends ProviderAuthError {
	constructor(provider, auth) {
		super("missing-api-key", provider, formatMissingAuthError(auth, provider));
		this.name = "MissingProviderAuthError";
		this.mode = auth.mode;
		this.source = auth.source;
	}
};
/** Narrow unknown errors to provider auth errors, optionally by code. */
function isProviderAuthError(err, code) {
	return err instanceof ProviderAuthError && (!code || err.code === code);
}
/** Narrow unknown errors to missing-provider-auth failures. */
function isMissingProviderAuthError(err) {
	return err instanceof MissingProviderAuthError;
}
/** Return the AWS credential env var that proves SDK auth is configured. */
function resolveAwsSdkEnvVarName(env = process.env) {
	if (env[AWS_BEARER_ENV]?.trim()) return AWS_BEARER_ENV;
	if (env[AWS_ACCESS_KEY_ENV]?.trim() && env[AWS_SECRET_KEY_ENV]?.trim()) return AWS_ACCESS_KEY_ENV;
	if (env[AWS_PROFILE_ENV]?.trim()) return AWS_PROFILE_ENV;
}
/** Format the user-facing missing-auth error from auth provenance. */
function formatMissingAuthError(auth, provider) {
	return `No API key resolved for provider "${provider}" (auth mode: ${auth.mode}, checked: ${auth.source}).`;
}
/** Require a normalized API key or throw a provider-auth error. */
function requireApiKey(auth, provider) {
	const key = require_normalize_secret_input.normalizeSecretInput(auth.apiKey);
	if (key) return key;
	throw new MissingProviderAuthError(provider, auth);
}
//#endregion
Object.defineProperty(exports, "MissingProviderAuthError", {
	enumerable: true,
	get: function() {
		return MissingProviderAuthError;
	}
});
Object.defineProperty(exports, "ProviderAuthError", {
	enumerable: true,
	get: function() {
		return ProviderAuthError;
	}
});
Object.defineProperty(exports, "formatMissingAuthError", {
	enumerable: true,
	get: function() {
		return formatMissingAuthError;
	}
});
Object.defineProperty(exports, "isMissingProviderAuthError", {
	enumerable: true,
	get: function() {
		return isMissingProviderAuthError;
	}
});
Object.defineProperty(exports, "isProviderAuthError", {
	enumerable: true,
	get: function() {
		return isProviderAuthError;
	}
});
Object.defineProperty(exports, "requireApiKey", {
	enumerable: true,
	get: function() {
		return requireApiKey;
	}
});
Object.defineProperty(exports, "resolveAwsSdkEnvVarName", {
	enumerable: true,
	get: function() {
		return resolveAwsSdkEnvVarName;
	}
});
