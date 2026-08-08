const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
//#region src/wizard/setup.secret-input.ts
function formatSecretResolutionError(error) {
	if (error instanceof Error && error.message.trim().length > 0) return error.message;
	return String(error);
}
async function resolveSetupSecretInputString(params) {
	const defaults = params.defaults ?? params.config.secrets?.defaults;
	const { ref } = require_types_secrets.resolveSecretInputRef({
		value: params.value,
		defaults
	});
	if (ref) try {
		return await require_resolve.resolveSecretRefString(ref, {
			config: params.config,
			env: params.env ?? process.env
		});
	} catch (error) {
		throw new Error(`${params.path}: failed to resolve SecretRef "${ref.source}:${ref.provider}:${ref.id}": ${formatSecretResolutionError(error)}`, { cause: error });
	}
	return require_types_secrets.normalizeSecretInputString(params.value);
}
//#endregion
Object.defineProperty(exports, "resolveSetupSecretInputString", {
	enumerable: true,
	get: function() {
		return resolveSetupSecretInputString;
	}
});
