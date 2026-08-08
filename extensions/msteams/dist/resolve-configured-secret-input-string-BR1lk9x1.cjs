const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/resolve-configured-secret-input-string.ts
function buildUnresolvedReason(params) {
	if (params.style === "generic") return `${params.path} SecretRef is unresolved (${params.refLabel}).`;
	if (params.kind === "non-string") return `${params.path} SecretRef resolved to a non-string value.`;
	if (params.kind === "empty") return `${params.path} SecretRef resolved to an empty value.`;
	return `${params.path} SecretRef is unresolved (${params.refLabel}).`;
}
async function resolveConfiguredSecretInputString(params) {
	const style = params.unresolvedReasonStyle ?? "generic";
	const { ref } = require_types_secrets.resolveSecretInputRef({
		value: params.value,
		defaults: params.config.secrets?.defaults
	});
	if (!ref) return { value: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.value) };
	const refLabel = `${ref.source}:${ref.provider}:${ref.id}`;
	try {
		const resolvedValue = (await require_resolve.resolveSecretRefValues([ref], {
			config: params.config,
			env: params.env,
			...params.manifestRegistry ? { manifestRegistry: params.manifestRegistry } : {}
		})).get(require_ref_contract.secretRefKey(ref));
		if (typeof resolvedValue !== "string") return { unresolvedRefReason: buildUnresolvedReason({
			path: params.path,
			style,
			kind: "non-string",
			refLabel
		}) };
		const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolvedValue);
		if (!trimmed) return { unresolvedRefReason: buildUnresolvedReason({
			path: params.path,
			style,
			kind: "empty",
			refLabel
		}) };
		return { value: trimmed };
	} catch {
		return { unresolvedRefReason: buildUnresolvedReason({
			path: params.path,
			style,
			kind: "unresolved",
			refLabel
		}) };
	}
}
async function resolveConfiguredSecretRefOnlyInputString(params) {
	const { ref } = require_types_secrets.resolveSecretInputRef({
		value: params.value,
		defaults: params.config.secrets?.defaults
	});
	if (!ref) return { refConfigured: false };
	return {
		refConfigured: true,
		...await resolveConfiguredSecretInputString({
			config: params.config,
			env: params.env,
			value: params.value,
			path: params.path,
			...params.manifestRegistry ? { manifestRegistry: params.manifestRegistry } : {},
			unresolvedReasonStyle: params.unresolvedReasonStyle
		})
	};
}
async function resolveRequiredConfiguredSecretRefInputString(params) {
	const resolved = await resolveConfiguredSecretRefOnlyInputString(params);
	if (!resolved.refConfigured) return;
	if (resolved.value) return resolved.value;
	throw new Error(resolved.unresolvedRefReason ?? `${params.path} resolved to an empty value.`);
}
//#endregion
Object.defineProperty(exports, "resolveConfiguredSecretInputString", {
	enumerable: true,
	get: function() {
		return resolveConfiguredSecretInputString;
	}
});
Object.defineProperty(exports, "resolveRequiredConfiguredSecretRefInputString", {
	enumerable: true,
	get: function() {
		return resolveRequiredConfiguredSecretRefInputString;
	}
});
