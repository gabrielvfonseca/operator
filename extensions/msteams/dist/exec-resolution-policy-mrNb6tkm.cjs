require("./rolldown-runtime-u92d-OFm.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
//#region src/secrets/exec-resolution-policy.ts
/**
* Returns static validation errors for skipped exec refs without resolving the provider command.
*/
function getSkippedExecRefStaticError(params) {
	const id = params.ref.id.trim();
	const refLabel = `${params.ref.source}:${params.ref.provider}:${id}`;
	if (!id) return "Error: Secret reference id is empty.";
	if (!require_ref_contract.isValidExecSecretRefId(id)) return `Error: ${require_ref_contract.formatExecSecretRefIdValidationMessage()} (ref: ${refLabel}).`;
	const providerConfig = params.config.secrets?.providers?.[params.ref.provider];
	if (!providerConfig) return `Error: Secret provider "${params.ref.provider}" is not configured (ref: ${refLabel}).`;
	if (providerConfig.source !== params.ref.source) return `Error: Secret provider "${params.ref.provider}" has source "${providerConfig.source}" but ref requests "${params.ref.source}".`;
	return null;
}
//#endregion
exports.getSkippedExecRefStaticError = getSkippedExecRefStaticError;
