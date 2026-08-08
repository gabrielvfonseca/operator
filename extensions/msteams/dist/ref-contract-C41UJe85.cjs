const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
//#region src/secrets/ref-contract.ts
/** Shared SecretRef grammar and validation helpers for config, schema, SDK, and gateway parity. */
/**
* Runtime secret-reference grammar shared by config parsing, plugin SDK schemas,
* gateway parity checks, and resolver planning.
*/
const FILE_SECRET_REF_SEGMENT_PATTERN = /^(?:[^~]|~0|~1)*$/;
/** Shared alias grammar for env/file/exec secret provider names. */
const SECRET_PROVIDER_ALIAS_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const EXEC_SECRET_REF_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$/;
/** Canonical id for file secret providers that expose exactly one value. */
const SINGLE_VALUE_FILE_REF_ID = "value";
/** Builds the stable map key used to cache or compare resolved secret refs. */
function secretRefKey(ref) {
	return `${ref.source}:${ref.provider}:${ref.id}`;
}
/** Resolves the default provider alias for one source, falling back to the built-in alias. */
function resolveDefaultSecretProviderAlias(config, source, options) {
	const configured = source === "env" ? config.secrets?.defaults?.env : source === "file" ? config.secrets?.defaults?.file : config.secrets?.defaults?.exec;
	if (configured?.trim()) return configured.trim();
	if (options?.preferFirstProviderForSource) {
		const providers = config.secrets?.providers;
		if (providers) {
			for (const [providerName, provider] of Object.entries(providers)) if (provider?.source === source) return providerName;
		}
	}
	return require_types_secrets.DEFAULT_SECRET_PROVIDER_ALIAS;
}
/** Validates file secret ref ids against the shared JSON-pointer-style contract. */
function isValidFileSecretRefId(value) {
	if (value === "value") return true;
	if (!value.startsWith("/")) return false;
	return value.slice(1).split("/").every((segment) => FILE_SECRET_REF_SEGMENT_PATTERN.test(segment));
}
/** Validates a secret provider alias against the shared config/gateway grammar. */
function isValidSecretProviderAlias(value) {
	return SECRET_PROVIDER_ALIAS_PATTERN.test(value);
}
/** Validates exec secret ref ids and reports why invalid ids failed. */
function validateExecSecretRefId(value) {
	if (!EXEC_SECRET_REF_ID_PATTERN.test(value)) return {
		ok: false,
		reason: "pattern"
	};
	for (const segment of value.split("/")) if (segment === "." || segment === "..") return {
		ok: false,
		reason: "traversal-segment"
	};
	return { ok: true };
}
/** Boolean convenience wrapper for callers that only need accept/reject behavior. */
function isValidExecSecretRefId(value) {
	return validateExecSecretRefId(value).ok;
}
/** Validates a complete SecretRef against the shared provider/source/id grammar. */
function isValidSecretRef(ref) {
	if (!require_types_secrets.isSecretRef(ref)) return false;
	if (!isValidSecretProviderAlias(ref.provider)) return false;
	if (ref.source === "env") return require_types_secrets.isValidEnvSecretRefId(ref.id);
	if (ref.source === "file") return isValidFileSecretRefId(ref.id);
	return isValidExecSecretRefId(ref.id);
}
/** Formats the user-facing validation message for rejected exec secret ref ids. */
function formatExecSecretRefIdValidationMessage() {
	return [
		"Exec secret reference id must match /^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$/",
		"and must not include \".\" or \"..\" path segments",
		"(example: \"vault/openai/api-key\" or \"aws/secret#json_key\")."
	].join(" ");
}
//#endregion
Object.defineProperty(exports, "SECRET_PROVIDER_ALIAS_PATTERN", {
	enumerable: true,
	get: function() {
		return SECRET_PROVIDER_ALIAS_PATTERN;
	}
});
Object.defineProperty(exports, "SINGLE_VALUE_FILE_REF_ID", {
	enumerable: true,
	get: function() {
		return SINGLE_VALUE_FILE_REF_ID;
	}
});
Object.defineProperty(exports, "formatExecSecretRefIdValidationMessage", {
	enumerable: true,
	get: function() {
		return formatExecSecretRefIdValidationMessage;
	}
});
Object.defineProperty(exports, "isValidExecSecretRefId", {
	enumerable: true,
	get: function() {
		return isValidExecSecretRefId;
	}
});
Object.defineProperty(exports, "isValidFileSecretRefId", {
	enumerable: true,
	get: function() {
		return isValidFileSecretRefId;
	}
});
Object.defineProperty(exports, "isValidSecretProviderAlias", {
	enumerable: true,
	get: function() {
		return isValidSecretProviderAlias;
	}
});
Object.defineProperty(exports, "isValidSecretRef", {
	enumerable: true,
	get: function() {
		return isValidSecretRef;
	}
});
Object.defineProperty(exports, "resolveDefaultSecretProviderAlias", {
	enumerable: true,
	get: function() {
		return resolveDefaultSecretProviderAlias;
	}
});
Object.defineProperty(exports, "secretRefKey", {
	enumerable: true,
	get: function() {
		return secretRefKey;
	}
});
Object.defineProperty(exports, "validateExecSecretRefId", {
	enumerable: true,
	get: function() {
		return validateExecSecretRefId;
	}
});
