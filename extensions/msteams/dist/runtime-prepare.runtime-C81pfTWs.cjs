require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
const require_shared = require("./shared-Bt0YEZDW.cjs");
const require_policy = require("./policy-BnWVEcUT.cjs");
const require_runtime_config_collectors = require("./runtime-config-collectors-DvYfLIlw.cjs");
const require_runtime_shared = require("./runtime-shared-3TeB-bbT.cjs");
const require_runtime_web_tools = require("./runtime-web-tools-DVYet9PT.cjs");
//#region src/secrets/runtime-auth-collectors.ts
/** Collects auth-profile and OAuth secret refs for runtime preparation. */
function collectApiKeyProfileAssignment(params) {
	const { explicitRef: keyRef, inlineRef: inlineKeyRef, ref: resolvedKeyRef } = require_types_secrets.resolveSecretInputRef({
		value: params.profile.key,
		refValue: params.profile.keyRef,
		defaults: params.defaults
	});
	if (!resolvedKeyRef) return;
	if (!keyRef && inlineKeyRef) params.profile.keyRef = inlineKeyRef;
	if (keyRef && require_shared.isNonEmptyString(params.profile.key)) require_runtime_shared.pushWarning(params.context, {
		code: "SECRETS_REF_OVERRIDES_PLAINTEXT",
		path: `${params.agentDir}.auth-profiles.${params.profileId}.key`,
		message: `auth-profiles ${params.profileId}: keyRef is set; runtime will ignore plaintext key.`
	});
	require_runtime_shared.pushAssignment(params.context, {
		ref: resolvedKeyRef,
		path: `${params.agentDir}.auth-profiles.${params.profileId}.key`,
		expected: "string",
		apply: (value) => {
			params.profile.key = String(value);
		}
	});
}
function collectTokenProfileAssignment(params) {
	const { explicitRef: tokenRef, inlineRef: inlineTokenRef, ref: resolvedTokenRef } = require_types_secrets.resolveSecretInputRef({
		value: params.profile.token,
		refValue: params.profile.tokenRef,
		defaults: params.defaults
	});
	if (!resolvedTokenRef) return;
	if (!tokenRef && inlineTokenRef) params.profile.tokenRef = inlineTokenRef;
	if (tokenRef && require_shared.isNonEmptyString(params.profile.token)) require_runtime_shared.pushWarning(params.context, {
		code: "SECRETS_REF_OVERRIDES_PLAINTEXT",
		path: `${params.agentDir}.auth-profiles.${params.profileId}.token`,
		message: `auth-profiles ${params.profileId}: tokenRef is set; runtime will ignore plaintext token.`
	});
	require_runtime_shared.pushAssignment(params.context, {
		ref: resolvedTokenRef,
		path: `${params.agentDir}.auth-profiles.${params.profileId}.token`,
		expected: "string",
		apply: (value) => {
			params.profile.token = String(value);
		}
	});
}
/** Collects SecretRef assignments from agent auth-profile stores for runtime materialization. */
function collectAuthStoreAssignments(params) {
	require_policy.assertNoOAuthSecretRefPolicyViolations({
		store: params.store,
		cfg: params.context.sourceConfig,
		context: `auth-profiles ${params.agentDir}`
	});
	const defaults = params.context.sourceConfig.secrets?.defaults;
	for (const [profileId, profile] of Object.entries(params.store.profiles)) {
		if (profile.type === "api_key") {
			collectApiKeyProfileAssignment({
				profile,
				profileId,
				agentDir: params.agentDir,
				defaults,
				context: params.context
			});
			continue;
		}
		if (profile.type === "token") collectTokenProfileAssignment({
			profile,
			profileId,
			agentDir: params.agentDir,
			defaults,
			context: params.context
		});
	}
}
//#endregion
exports.applyResolvedAssignments = require_runtime_shared.applyResolvedAssignments;
exports.collectAuthStoreAssignments = collectAuthStoreAssignments;
exports.collectConfigAssignments = require_runtime_config_collectors.collectConfigAssignments;
exports.createResolverContext = require_runtime_shared.createResolverContext;
exports.resolveRuntimeWebTools = require_runtime_web_tools.resolveRuntimeWebTools;
exports.resolveSecretRefValues = require_resolve.resolveSecretRefValues;
