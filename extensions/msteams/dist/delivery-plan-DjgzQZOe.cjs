const require_channel_target_prefix = require("./channel-target-prefix-HjpWN9Zt.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/cron/delivery-plan.ts
/** Resolves cron delivery and failure-notification routing from job config. */
/** Returns whether a delivery plan names a concrete channel, recipient, thread, or account. */
function hasExplicitCronDeliveryTarget(plan) {
	return Boolean(plan.channel && plan.channel !== "last" || plan.to || plan.threadId != null || plan.accountId);
}
function normalizeChannel(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (!trimmed) return;
	return trimmed;
}
function normalizeThreadIdentity(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalThreadValue)(value);
	return normalized == null ? void 0 : String(normalized);
}
function resolveAnnounceChannel(params) {
	if (params.channel && params.channel !== "last") return params.channel;
	return require_channel_target_prefix.resolveTargetPrefixedChannel(params.to) ?? params.channel ?? "last";
}
/** Resolves primary delivery config into the runtime mode/channel/target plan. */
function resolveCronDeliveryPlan(job) {
	const delivery = job.delivery;
	const hasDelivery = delivery && typeof delivery === "object";
	const rawMode = hasDelivery ? delivery.mode : void 0;
	const normalizedMode = typeof rawMode === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(rawMode) : rawMode;
	const mode = normalizedMode === "announce" ? "announce" : normalizedMode === "webhook" ? "webhook" : normalizedMode === "none" ? "none" : normalizedMode === "deliver" ? "announce" : void 0;
	const deliveryChannel = normalizeChannel(delivery?.channel);
	const deliveryTo = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery?.to);
	const deliveryThreadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalThreadValue)(delivery?.threadId);
	const to = deliveryTo;
	const deliveryAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery?.accountId);
	if (hasDelivery) {
		const resolvedMode = mode ?? "announce";
		const channel = resolvedMode === "announce" ? resolveAnnounceChannel({
			channel: deliveryChannel,
			to
		}) : deliveryChannel;
		return {
			mode: resolvedMode,
			channel: resolvedMode === "webhook" ? void 0 : channel,
			to,
			threadId: resolvedMode === "webhook" ? void 0 : deliveryThreadId,
			accountId: deliveryAccountId,
			source: "delivery",
			requested: resolvedMode === "announce"
		};
	}
	const resolvedMode = (job.payload.kind === "agentTurn" || job.payload.kind === "command") && typeof job.sessionTarget === "string" && (job.sessionTarget === "isolated" || job.sessionTarget === "current" || job.sessionTarget.startsWith("session:")) ? "announce" : "none";
	return {
		mode: resolvedMode,
		channel: resolvedMode === "announce" ? "last" : void 0,
		to: void 0,
		threadId: void 0,
		source: "delivery",
		requested: resolvedMode === "announce"
	};
}
function normalizeFailureMode(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (trimmed === "announce" || trimmed === "webhook") return trimmed;
}
/** Resolves job-level failure notification routing layered over global defaults. */
function resolveFailureDestination(job, globalConfig) {
	const delivery = job.delivery;
	const jobFailureDest = delivery?.failureDestination;
	const hasJobFailureDest = jobFailureDest && typeof jobFailureDest === "object";
	let channel;
	let to;
	let accountId;
	let mode;
	if (globalConfig) {
		channel = normalizeChannel(globalConfig.channel);
		to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(globalConfig.to);
		accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(globalConfig.accountId);
		mode = normalizeFailureMode(globalConfig.mode);
	}
	if (hasJobFailureDest) {
		const jobChannel = normalizeChannel(jobFailureDest.channel);
		const jobTo = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(jobFailureDest.to);
		const jobAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(jobFailureDest.accountId);
		const jobMode = normalizeFailureMode(jobFailureDest.mode);
		const hasJobChannelField = "channel" in jobFailureDest;
		const hasJobToField = "to" in jobFailureDest;
		const hasJobAccountIdField = "accountId" in jobFailureDest;
		const hasJobModeField = "mode" in jobFailureDest;
		const jobToExplicitValue = hasJobToField && jobTo !== void 0;
		if (hasJobChannelField) channel = jobChannel;
		if (hasJobToField) to = jobTo;
		if (hasJobAccountIdField) accountId = jobAccountId;
		const jobImpliesAnnounce = !hasJobModeField && jobChannel !== void 0;
		if (hasJobModeField || jobImpliesAnnounce) {
			const effectiveJobMode = jobImpliesAnnounce ? "announce" : jobMode;
			if (!jobToExplicitValue && (mode ?? "announce") !== (effectiveJobMode ?? "announce")) to = void 0;
			mode = effectiveJobMode;
		}
	}
	if (!channel && !to && !accountId && !mode) return null;
	const resolvedMode = mode ?? "announce";
	if (resolvedMode === "webhook" && !to) return null;
	const result = {
		mode: resolvedMode,
		channel: resolvedMode === "announce" ? resolveAnnounceChannel({
			channel,
			to
		}) : void 0,
		to,
		accountId
	};
	if (delivery && isSameDeliveryTarget(delivery, result)) return null;
	return result;
}
function isSameDeliveryTarget(delivery, failurePlan) {
	const primaryMode = delivery.mode ?? "announce";
	if (primaryMode === "none") return false;
	const primaryTo = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery.to);
	const primaryAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery.accountId);
	const primaryThreadId = normalizeThreadIdentity(delivery.threadId);
	if (failurePlan.mode === "webhook") return primaryMode === "webhook" && primaryTo === failurePlan.to;
	const primaryChannelNormalized = resolveAnnounceChannel({
		channel: normalizeChannel(delivery.channel),
		to: primaryTo
	});
	return (failurePlan.channel ?? "last") === primaryChannelNormalized && failurePlan.to === primaryTo && failurePlan.accountId === primaryAccountId && primaryThreadId === void 0;
}
//#endregion
Object.defineProperty(exports, "hasExplicitCronDeliveryTarget", {
	enumerable: true,
	get: function() {
		return hasExplicitCronDeliveryTarget;
	}
});
Object.defineProperty(exports, "resolveCronDeliveryPlan", {
	enumerable: true,
	get: function() {
		return resolveCronDeliveryPlan;
	}
});
Object.defineProperty(exports, "resolveFailureDestination", {
	enumerable: true,
	get: function() {
		return resolveFailureDestination;
	}
});
