Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
require("./rolldown-runtime-u92d-OFm.cjs");
require("./types.secrets-2BFwbY6H.cjs");
require("./shared-Bt0YEZDW.cjs");
const require_runtime_shared = require("./runtime-shared-3TeB-bbT.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/secrets/channel-secret-basic-runtime.ts
function buildChannelSecretTargetRegistryEntry(params) {
	const spec = typeof params.spec === "string" ? { path: params.spec } : params.spec;
	const scopePrefix = params.scope === "account" ? `channels.${params.channelKey}.accounts.*` : `channels.${params.channelKey}`;
	const pathPattern = `${scopePrefix}.${spec.path}`;
	return {
		id: pathPattern,
		targetType: spec.targetType ?? pathPattern,
		...spec.targetTypeAliases ? { targetTypeAliases: spec.targetTypeAliases } : {},
		configFile: "operator.json",
		pathPattern,
		...spec.refPath ? { refPathPattern: `${scopePrefix}.${spec.refPath}` } : {},
		secretShape: spec.secretShape ?? "secret_input",
		expectedResolvedValue: spec.expectedResolvedValue ?? "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		...spec.accountIdPathSegmentIndex !== void 0 ? { accountIdPathSegmentIndex: spec.accountIdPathSegmentIndex } : {}
	};
}
function createChannelSecretTargetRegistryEntries(params) {
	return [...(params.account ?? []).map((spec) => buildChannelSecretTargetRegistryEntry({
		channelKey: params.channelKey,
		scope: "account",
		spec
	})), ...(params.channel ?? []).map((spec) => buildChannelSecretTargetRegistryEntry({
		channelKey: params.channelKey,
		scope: "channel",
		spec
	}))];
}
/** Reads a channel config block when it exists as an object. */
function getChannelRecord(config, channelKey) {
	const channels = config.channels;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channels)) return;
	const channel = channels[channelKey];
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channel) ? channel : void 0;
}
//#endregion
//#region extensions/msteams/src/secret-contract.ts
const secretTargetRegistryEntries = createChannelSecretTargetRegistryEntries({
	channelKey: "msteams",
	channel: ["appPassword"]
});
function collectRuntimeConfigAssignments(params) {
	const msteams = getChannelRecord(params.config, "msteams");
	if (!msteams) return;
	require_runtime_shared.collectSecretInputAssignment({
		value: msteams.appPassword,
		path: "channels.msteams.appPassword",
		expected: "string",
		defaults: params.defaults,
		context: params.context,
		active: msteams.enabled !== false,
		inactiveReason: "Microsoft Teams channel is disabled.",
		apply: (value) => {
			msteams.appPassword = value;
		}
	});
}
const channelSecrets = {
	secretTargetRegistryEntries,
	collectRuntimeConfigAssignments
};
//#endregion
exports.channelSecrets = channelSecrets;
exports.collectRuntimeConfigAssignments = collectRuntimeConfigAssignments;
exports.secretTargetRegistryEntries = secretTargetRegistryEntries;
