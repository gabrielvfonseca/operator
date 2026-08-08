const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_normalize_secret_input = require("./normalize-secret-input-Dg82qiNj.cjs");
const require_model_auth_markers = require("./model-auth-markers-CW9eHIop.cjs");
const require_setup_registry = require("./setup-registry-bM3fH6vu.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/model-auth-env.ts
/**
* Resolves model provider API keys from explicit environment variables.
*/
function expandAuthEvidencePath(rawPath, env) {
	const trimmed = rawPath.trim();
	if (!trimmed) return;
	const homeDir = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.HOME) ?? node_os.default.homedir();
	const appDataDir = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.APPDATA);
	if (trimmed.includes("${APPDATA}") && !appDataDir) return;
	return trimmed.replaceAll("${HOME}", homeDir).replaceAll("${APPDATA}", appDataDir ?? "");
}
function hasRequiredAuthEvidenceEnv(evidence, env) {
	const hasEnv = (key) => Boolean(require_normalize_secret_input.normalizeOptionalSecretInput(env[key]));
	if (evidence.requiresAnyEnv?.length && !evidence.requiresAnyEnv.some(hasEnv)) return false;
	if (evidence.requiresAllEnv?.length && !evidence.requiresAllEnv.every(hasEnv)) return false;
	return true;
}
function hasLocalFileAuthEvidence(evidence, env) {
	if (evidence.fileEnvVar) {
		const explicitPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env[evidence.fileEnvVar]);
		if (explicitPath) return node_fs.default.existsSync(explicitPath);
	}
	for (const rawPath of evidence.fallbackPaths ?? []) {
		const expandedPath = expandAuthEvidencePath(rawPath, env);
		if (expandedPath && node_fs.default.existsSync(expandedPath)) return true;
	}
	return false;
}
function resolveAuthEvidence(evidence, env) {
	for (const entry of evidence ?? []) {
		if (entry.type !== "local-file-with-env") continue;
		if (!hasRequiredAuthEvidenceEnv(entry, env) || !hasLocalFileAuthEvidence(entry, env)) continue;
		return {
			apiKey: entry.credentialMarker,
			source: entry.source ?? "local auth evidence"
		};
	}
	return null;
}
/** Reports env/local auth presence without returning or resolving credential material. */
function resolveProviderEnvAuthEvidence(provider, env = process.env, options = {}) {
	const providerId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderIdForAuth)(provider);
	const lookupMaps = !options.aliasMap || !options.candidateMap || !options.authEvidenceMap ? require_model_auth_markers.resolveProviderEnvAuthLookupMaps({
		config: options.config,
		workspaceDir: options.workspaceDir,
		env
	}) : void 0;
	const normalized = (options.aliasMap ?? lookupMaps?.aliasMap ?? {})[providerId] ?? providerId;
	const candidateMap = options.candidateMap ?? lookupMaps?.envCandidateMap ?? {};
	const authEvidenceMap = options.authEvidenceMap ?? lookupMaps?.authEvidenceMap ?? {};
	const applied = new Set(require_io.getShellEnvAppliedKeys());
	for (const envVar of candidateMap[normalized] ?? []) {
		if (!require_normalize_secret_input.normalizeOptionalSecretInput(env[envVar])) continue;
		return {
			mode: normalized === "amazon-bedrock" && envVar.startsWith("AWS_") ? "aws-sdk" : envVar.includes("OAUTH_TOKEN") ? "oauth" : "api-key",
			source: applied.has(envVar) ? `shell env: ${envVar}` : `env: ${envVar}`
		};
	}
	for (const evidence of authEvidenceMap[normalized] ?? []) {
		if (!hasRequiredAuthEvidenceEnv(evidence, env) || !hasLocalFileAuthEvidence(evidence, env)) continue;
		return {
			mode: normalized === "amazon-bedrock" ? "aws-sdk" : "api-key",
			source: evidence.source ?? "local auth evidence"
		};
	}
	return null;
}
/**
* Plans direct auth without loading a provider runtime or resolving credential material.
* Setup-provider refs are deferred evidence only; runtime lookup still decides availability.
*/
function resolveProviderDirectAuthPlanningEvidence(provider, env = process.env, options = {}) {
	const lookupMaps = !options.aliasMap || !options.candidateMap || !options.authEvidenceMap || !options.setupProviderFallbackRefs ? require_model_auth_markers.resolveProviderEnvAuthLookupMaps({
		config: options.config,
		workspaceDir: options.workspaceDir,
		env
	}) : void 0;
	const aliasMap = options.aliasMap ?? lookupMaps?.aliasMap ?? {};
	const concrete = resolveProviderEnvAuthEvidence(provider, env, {
		aliasMap,
		candidateMap: options.candidateMap ?? lookupMaps?.envCandidateMap ?? {},
		authEvidenceMap: options.authEvidenceMap ?? lookupMaps?.authEvidenceMap ?? {}
	});
	if (concrete) return {
		kind: "environment",
		...concrete
	};
	const providerId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderIdForAuth)(provider);
	const normalized = aliasMap[providerId] ?? providerId;
	return (options.setupProviderFallbackRefs ?? lookupMaps?.setupProviderFallbackRefs ?? []).some((ref) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderIdForAuth)(ref) === normalized) ? {
		kind: "setup-provider",
		mode: "api-key",
		source: "setup provider"
	} : null;
}
/** Resolve an API key or auth-evidence marker for a provider from environment state. */
function resolveEnvApiKey(provider, env = process.env, options = {}) {
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderIdForAuth)(provider);
	const lookupParams = {
		config: options.config,
		workspaceDir: options.workspaceDir,
		env
	};
	const lookupMaps = !options.aliasMap || !options.candidateMap || !options.authEvidenceMap ? require_model_auth_markers.resolveProviderEnvAuthLookupMaps(lookupParams) : void 0;
	const normalized = (options.aliasMap ?? lookupMaps?.aliasMap ?? {})[normalizedProvider] ?? normalizedProvider;
	const candidateMap = options.candidateMap ?? lookupMaps?.envCandidateMap ?? {};
	const authEvidenceMap = options.authEvidenceMap ?? lookupMaps?.authEvidenceMap ?? {};
	const applied = new Set(require_io.getShellEnvAppliedKeys());
	const pick = (envVar) => {
		const value = require_normalize_secret_input.normalizeOptionalSecretInput(env[envVar]);
		if (!value) return null;
		return {
			apiKey: value,
			source: applied.has(envVar) ? `shell env: ${envVar}` : `env: ${envVar}`
		};
	};
	const candidates = Object.hasOwn(candidateMap, normalized) ? candidateMap[normalized] : void 0;
	if (Array.isArray(candidates)) for (const envVar of candidates) {
		const resolved = pick(envVar);
		if (resolved) return resolved;
	}
	const authEvidence = resolveAuthEvidence(Object.hasOwn(authEvidenceMap, normalized) ? authEvidenceMap[normalized] : void 0, env);
	if (authEvidence) return authEvidence;
	if (Array.isArray(candidates)) return null;
	if (options.skipSetupProviderFallback === true) return null;
	const setupProvider = require_setup_registry.resolvePluginSetupProvider({
		provider: normalized,
		config: options.config,
		workspaceDir: options.workspaceDir,
		env
	});
	if (setupProvider?.resolveConfigApiKey) {
		const resolved = setupProvider.resolveConfigApiKey({
			provider: normalized,
			env
		});
		if (resolved?.trim()) return {
			apiKey: resolved,
			source: resolved === "gcp-vertex-credentials" ? "gcloud adc" : "env"
		};
	}
	return null;
}
//#endregion
Object.defineProperty(exports, "resolveEnvApiKey", {
	enumerable: true,
	get: function() {
		return resolveEnvApiKey;
	}
});
Object.defineProperty(exports, "resolveProviderDirectAuthPlanningEvidence", {
	enumerable: true,
	get: function() {
		return resolveProviderDirectAuthPlanningEvidence;
	}
});
Object.defineProperty(exports, "resolveProviderEnvAuthEvidence", {
	enumerable: true,
	get: function() {
		return resolveProviderEnvAuthEvidence;
	}
});
