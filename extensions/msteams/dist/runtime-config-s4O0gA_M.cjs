const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
//#region src/skills/loading/runtime-config.ts
function hasConfiguredSkillApiKeyRef(config) {
	const entries = config?.skills?.entries;
	if (!entries || typeof entries !== "object") return false;
	for (const skillConfig of Object.values(entries)) {
		if (!skillConfig || typeof skillConfig !== "object") continue;
		if (require_types_secrets.coerceSecretRef(skillConfig.apiKey) !== null) return true;
	}
	return false;
}
/** Chooses the runtime config snapshot unless it would hide skill secret refs. */
function resolveSkillRuntimeConfig(config) {
	const runtimeConfig = require_runtime_snapshot.getRuntimeConfigSnapshot();
	if (!runtimeConfig) return config;
	if (!config) return runtimeConfig;
	const runtimeHasRawSkillSecretRefs = hasConfiguredSkillApiKeyRef(runtimeConfig);
	const configHasRawSkillSecretRefs = hasConfiguredSkillApiKeyRef(config);
	if (runtimeHasRawSkillSecretRefs && !configHasRawSkillSecretRefs) return config;
	return runtimeConfig;
}
//#endregion
Object.defineProperty(exports, "resolveSkillRuntimeConfig", {
	enumerable: true,
	get: function() {
		return resolveSkillRuntimeConfig;
	}
});
