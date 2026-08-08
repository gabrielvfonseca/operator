const require_provider_env_vars = require("./provider-env-vars-D_wXMNA1.cjs");
const require_provider_attribution = require("./provider-attribution-CIUHVFNx.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/agents/model-auth-env-vars.ts
/**
* Provider auth env/evidence lookup facade for agent auth code. It keeps
* provider-env-var source paths centralized while exposing API-key oriented
* helper names to model/auth modules.
*/
/** Resolves both env-var candidates and richer auth evidence from one manifest snapshot. */
function resolveProviderEnvAuthLookupMaps(params) {
	return require_provider_env_vars.resolveProviderAuthLookupMaps(params);
}
/** Lists every provider key represented by either env candidates or auth evidence. */
function listProviderEnvAuthLookupKeys(params) {
	return Array.from(/* @__PURE__ */ new Set([...Object.keys(params.envCandidateMap), ...Object.keys(params.authEvidenceMap)])).toSorted((a, b) => a.localeCompare(b));
}
/** Lists known provider API-key env var names for redaction and marker matching. */
function listKnownProviderEnvApiKeyNames() {
	return require_provider_env_vars.listKnownProviderAuthEnvVarNames();
}
//#endregion
//#region src/agents/model-auth-markers.ts
/**
* Non-secret model-auth marker helpers.
* Distinguishes persisted auth markers, env-var placeholders, OAuth markers,
* local auth sentinels, and secret-ref header markers without exposing secrets.
*/
/** Prefix for persisted OAuth-backed API-key marker values. */
const OAUTH_API_KEY_MARKER_PREFIX = "oauth:";
/** Marker for local Ollama auth that does not use a real API key. */
const OLLAMA_LOCAL_AUTH_MARKER = "ollama-local";
/** @deprecated Bundled local-provider marker; do not use from third-party plugins. */
const CUSTOM_LOCAL_AUTH_MARKER = "custom-local";
/** @deprecated Codex provider-owned marker; do not use from third-party plugins. */
const CODEX_APP_SERVER_AUTH_MARKER = "codex-app-server";
/** Marker for Google Vertex credentials resolved outside plain API-key env vars. */
const GCP_VERTEX_CREDENTIALS_MARKER = "gcp-vertex-credentials";
/** Marker for a secret-ref-managed credential that is not stored as an env var. */
const NON_ENV_SECRETREF_MARKER = "secretref-managed";
/** Prefix for secret-ref header markers that name an env-backed source. */
const SECRETREF_ENV_HEADER_MARKER_PREFIX = "secretref-env:";
const AWS_SDK_ENV_MARKERS = /* @__PURE__ */ new Set([
	"AWS_BEARER_TOKEN_BEDROCK",
	"AWS_ACCESS_KEY_ID",
	"AWS_PROFILE"
]);
const CORE_NON_SECRET_API_KEY_MARKERS = [
	CUSTOM_LOCAL_AUTH_MARKER,
	CODEX_APP_SERVER_AUTH_MARKER,
	GCP_VERTEX_CREDENTIALS_MARKER,
	OLLAMA_LOCAL_AUTH_MARKER,
	NON_ENV_SECRETREF_MARKER
];
let knownEnvApiKeyMarkersCache;
let knownNonSecretApiKeyMarkersCache;
const LEGACY_ENV_API_KEY_MARKERS = [
	"GOOGLE_API_KEY",
	"DEEPSEEK_API_KEY",
	"PERPLEXITY_API_KEY",
	"FIREWORKS_API_KEY",
	"NOVITA_API_KEY",
	"AZURE_OPENAI_API_KEY",
	"AZURE_API_KEY",
	"MINIMAX_CODE_PLAN_KEY"
];
function listKnownEnvApiKeyMarkers() {
	knownEnvApiKeyMarkersCache ??= /* @__PURE__ */ new Set([
		...listKnownProviderEnvApiKeyNames(),
		...LEGACY_ENV_API_KEY_MARKERS,
		...AWS_SDK_ENV_MARKERS
	]);
	return knownEnvApiKeyMarkersCache;
}
/** List non-secret auth markers known from core and bundled plugin manifests. */
function listKnownNonSecretApiKeyMarkers() {
	knownNonSecretApiKeyMarkersCache ??= (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...CORE_NON_SECRET_API_KEY_MARKERS, ...require_provider_attribution.listOperatorPluginManifestMetadata().flatMap((plugin) => plugin.origin === "bundled" ? (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(plugin.manifest.nonSecretAuthMarkers) : [])]);
	return [...knownNonSecretApiKeyMarkersCache];
}
/** Return true for AWS SDK env marker values that represent ambient auth. */
function isAwsSdkAuthMarker(value) {
	return AWS_SDK_ENV_MARKERS.has(value.trim());
}
/** Return true for recognized env-var API-key placeholders, excluding AWS SDK markers. */
function isKnownEnvApiKeyMarker(value) {
	const trimmed = value.trim();
	return listKnownEnvApiKeyMarkers().has(trimmed) && !isAwsSdkAuthMarker(trimmed);
}
/** Return true when a marker value points at provider OAuth auth. */
function isOAuthApiKeyMarker(value) {
	return value.trim().startsWith(OAUTH_API_KEY_MARKER_PREFIX);
}
/** Resolve the API-key placeholder for a non-env secret-ref source. */
function resolveNonEnvSecretRefApiKeyMarker(_source) {
	return NON_ENV_SECRETREF_MARKER;
}
/** Resolve the header-value placeholder for a non-env secret-ref source. */
function resolveNonEnvSecretRefHeaderValueMarker(_source) {
	return NON_ENV_SECRETREF_MARKER;
}
/** Resolve the header-value placeholder for an env-backed secret-ref source. */
function resolveEnvSecretRefHeaderValueMarker(envVarName) {
	return `${SECRETREF_ENV_HEADER_MARKER_PREFIX}${envVarName.trim()}`;
}
/** Return true for secret-ref placeholders used in auth header values. */
function isSecretRefHeaderValueMarker(value) {
	const trimmed = value.trim();
	return trimmed === "secretref-managed" || trimmed.startsWith("secretref-env:");
}
/** Return true for persisted non-secret placeholders that should not be treated as real keys. */
function isNonSecretApiKeyMarker(value, opts) {
	const trimmed = value.trim();
	if (!trimmed) return false;
	if (isOAuthApiKeyMarker(trimmed) || listKnownNonSecretApiKeyMarkers().includes(trimmed) || isAwsSdkAuthMarker(trimmed) || isSecretRefHeaderValueMarker(trimmed)) return true;
	if (opts?.includeEnvVarName === false) return false;
	return listKnownEnvApiKeyMarkers().has(trimmed);
}
//#endregion
Object.defineProperty(exports, "CODEX_APP_SERVER_AUTH_MARKER", {
	enumerable: true,
	get: function() {
		return CODEX_APP_SERVER_AUTH_MARKER;
	}
});
Object.defineProperty(exports, "CUSTOM_LOCAL_AUTH_MARKER", {
	enumerable: true,
	get: function() {
		return CUSTOM_LOCAL_AUTH_MARKER;
	}
});
Object.defineProperty(exports, "GCP_VERTEX_CREDENTIALS_MARKER", {
	enumerable: true,
	get: function() {
		return GCP_VERTEX_CREDENTIALS_MARKER;
	}
});
Object.defineProperty(exports, "NON_ENV_SECRETREF_MARKER", {
	enumerable: true,
	get: function() {
		return NON_ENV_SECRETREF_MARKER;
	}
});
Object.defineProperty(exports, "SECRETREF_ENV_HEADER_MARKER_PREFIX", {
	enumerable: true,
	get: function() {
		return SECRETREF_ENV_HEADER_MARKER_PREFIX;
	}
});
Object.defineProperty(exports, "isKnownEnvApiKeyMarker", {
	enumerable: true,
	get: function() {
		return isKnownEnvApiKeyMarker;
	}
});
Object.defineProperty(exports, "isNonSecretApiKeyMarker", {
	enumerable: true,
	get: function() {
		return isNonSecretApiKeyMarker;
	}
});
Object.defineProperty(exports, "isSecretRefHeaderValueMarker", {
	enumerable: true,
	get: function() {
		return isSecretRefHeaderValueMarker;
	}
});
Object.defineProperty(exports, "listProviderEnvAuthLookupKeys", {
	enumerable: true,
	get: function() {
		return listProviderEnvAuthLookupKeys;
	}
});
Object.defineProperty(exports, "resolveEnvSecretRefHeaderValueMarker", {
	enumerable: true,
	get: function() {
		return resolveEnvSecretRefHeaderValueMarker;
	}
});
Object.defineProperty(exports, "resolveNonEnvSecretRefApiKeyMarker", {
	enumerable: true,
	get: function() {
		return resolveNonEnvSecretRefApiKeyMarker;
	}
});
Object.defineProperty(exports, "resolveNonEnvSecretRefHeaderValueMarker", {
	enumerable: true,
	get: function() {
		return resolveNonEnvSecretRefHeaderValueMarker;
	}
});
Object.defineProperty(exports, "resolveProviderEnvAuthLookupMaps", {
	enumerable: true,
	get: function() {
		return resolveProviderEnvAuthLookupMaps;
	}
});
