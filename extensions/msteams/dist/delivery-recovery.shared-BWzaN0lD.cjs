const require_sleep = require("./sleep-BVpvBXin.cjs");
const require_retry = require("./retry-DXZi6qkk.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_src = require("./src-BcOJL8NE.cjs");
//#region src/infra/outbound/deliver-types.ts
/** Count platform sends without double-counting equivalent receipt representations. */
function countPhysicalOutboundSends(results) {
	return results.reduce((count, result) => {
		const receipt = result.receipt;
		if (!receipt) return count + 1;
		const receiptCount = receipt.parts.length > 0 ? receipt.parts.length : receipt.platformMessageIds.length;
		return count + Math.max(1, receiptCount);
	}, 0);
}
const PLATFORM_MESSAGE_NOT_DISPATCHED_ERROR_CODE = "OPERATOR_PLATFORM_MESSAGE_NOT_DISPATCHED";
/**
* Provider assertion that retrying cannot duplicate a recipient-visible send.
* Never use this after a finalization/send call returned an ambiguous result.
*/
var PlatformMessageNotDispatchedError = class extends Error {
	constructor(message, options) {
		super(message, { cause: options.cause });
		this.code = PLATFORM_MESSAGE_NOT_DISPATCHED_ERROR_CODE;
		this.name = "PlatformMessageNotDispatchedError";
	}
};
function isPlatformMessageNotDispatchedError(error) {
	return error instanceof PlatformMessageNotDispatchedError;
}
/** Error carrying partial delivery results when an outbound send fails mid-batch. */
var OutboundDeliveryError = class extends Error {
	constructor(message, options) {
		super(message, { cause: options.cause });
		this.name = "OutboundDeliveryError";
		this.results = [...options.results ?? []];
		this.payloadOutcomes = [...options.payloadOutcomes ?? []];
		this.sentBeforeError = this.results.length > 0;
		this.stage = options.stage ?? "unknown";
	}
};
/** Narrows unknown failures to outbound delivery errors with partial-send metadata. */
function isOutboundDeliveryError(error) {
	return error instanceof OutboundDeliveryError;
}
//#endregion
//#region src/infra/delivery-recovery.shared.ts
const RECOVERY_BACKOFF_MS = [
	5e3,
	25e3,
	12e4,
	6e5
];
const RECOVERY_REPLAY_SPACING_MS = 250;
const PRE_CONNECT_ERROR_CODES = /* @__PURE__ */ new Set([
	"ECONNREFUSED",
	"ENOTFOUND",
	"EAI_AGAIN",
	"ENETDOWN",
	"ENETUNREACH",
	"EHOSTUNREACH"
]);
const TRANSPORT_ERROR_CODE_RE = /^(?:E(?:AI_|CONN|NET|HOST|ADDR|PIPE|TIMEDOUT|SOCKET)|UND_ERR_|ERR_(?:NETWORK|HTTP2|QUIC|TLS|SSL))/;
const UNPROVEN_ERROR_BRANCH = "unproven delivery error branch";
function preserveProofBranches(branches) {
	return branches?.map((branch) => branch ?? UNPROVEN_ERROR_BRANCH) ?? [];
}
function isProvenPreConnectCandidate(candidate) {
	const code = require_errors.extractErrorCode(candidate)?.trim().toUpperCase();
	if (code === "UND_ERR_CONNECT_TIMEOUT" || code === "UND_ERR_DNS_RESOLVE_FAILED") return true;
	if (!code || !PRE_CONNECT_ERROR_CODES.has(code) || !candidate || typeof candidate !== "object") return false;
	const syscall = candidate.syscall;
	return syscall === "connect" || syscall === "getaddrinfo";
}
function nestedErrorCandidates(current) {
	const retryBranches = preserveProofBranches(require_retry.getRetryAttemptErrors(current));
	if (isPlatformMessageNotDispatchedError(current) || isProvenPreConnectCandidate(current)) return retryBranches;
	const nestedObjects = [
		current.cause,
		current.original,
		current.error,
		current.reason
	].filter((candidate) => candidate !== null && typeof candidate === "object");
	const aggregateBranches = Array.isArray(current.errors) ? preserveProofBranches(current.errors) : [];
	return [
		...retryBranches,
		...aggregateBranches,
		...nestedObjects
	];
}
function isProvenDeliveryNotSentError(err) {
	let foundNotSentProof = false;
	for (const candidate of require_errors.collectErrorGraphCandidates(err, nestedErrorCandidates)) {
		const code = require_errors.extractErrorCode(candidate)?.trim().toUpperCase();
		if (isPlatformMessageNotDispatchedError(candidate) || isProvenPreConnectCandidate(candidate)) {
			foundNotSentProof = true;
			continue;
		}
		const nested = candidate && typeof candidate === "object" ? nestedErrorCandidates(candidate) : [];
		const isPreConnectAggregateSummary = candidate !== null && typeof candidate === "object" && Array.isArray(candidate.errors) && code !== void 0 && PRE_CONNECT_ERROR_CODES.has(code);
		if (nested.length === 0 || code && !isPreConnectAggregateSummary && (PRE_CONNECT_ERROR_CODES.has(code) || TRANSPORT_ERROR_CODE_RE.test(code))) return false;
	}
	return foundNotSentProof;
}
function computeBackoffMs(retryCount) {
	return require_src.computeBackoffSchedule(RECOVERY_BACKOFF_MS, retryCount);
}
function getErrnoCode(err) {
	return err && typeof err === "object" && "code" in err ? String(err.code) : null;
}
function claimRecoveryEntry(entriesInProgress, entryId) {
	if (entriesInProgress.has(entryId)) return false;
	entriesInProgress.add(entryId);
	return true;
}
function releaseRecoveryEntry(entriesInProgress, entryId) {
	entriesInProgress.delete(entryId);
}
function createRecoveryReplayPacer() {
	let lastReplayStartedAt = 0;
	let waitQueue = Promise.resolve();
	return { async wait(deadlineMs) {
		let releaseWaiter = () => {};
		const previousWaiter = waitQueue;
		waitQueue = new Promise((resolve) => {
			releaseWaiter = resolve;
		});
		await previousWaiter;
		try {
			const now = Date.now();
			if (deadlineMs !== void 0 && now >= deadlineMs) return "deadline-exceeded";
			const elapsedMs = now - lastReplayStartedAt;
			const waitMs = elapsedMs < 0 ? 0 : Math.max(0, RECOVERY_REPLAY_SPACING_MS - elapsedMs);
			if (waitMs > 0) {
				const remainingBudgetMs = deadlineMs === void 0 ? waitMs : Math.max(0, deadlineMs - now);
				await require_sleep.sleep(Math.min(waitMs, remainingBudgetMs));
			}
			if (deadlineMs !== void 0 && Date.now() >= deadlineMs) return "deadline-exceeded";
			lastReplayStartedAt = Date.now();
			return "ready";
		} finally {
			releaseWaiter();
		}
	} };
}
//#endregion
Object.defineProperty(exports, "OutboundDeliveryError", {
	enumerable: true,
	get: function() {
		return OutboundDeliveryError;
	}
});
Object.defineProperty(exports, "claimRecoveryEntry", {
	enumerable: true,
	get: function() {
		return claimRecoveryEntry;
	}
});
Object.defineProperty(exports, "computeBackoffMs", {
	enumerable: true,
	get: function() {
		return computeBackoffMs;
	}
});
Object.defineProperty(exports, "countPhysicalOutboundSends", {
	enumerable: true,
	get: function() {
		return countPhysicalOutboundSends;
	}
});
Object.defineProperty(exports, "createRecoveryReplayPacer", {
	enumerable: true,
	get: function() {
		return createRecoveryReplayPacer;
	}
});
Object.defineProperty(exports, "getErrnoCode", {
	enumerable: true,
	get: function() {
		return getErrnoCode;
	}
});
Object.defineProperty(exports, "isOutboundDeliveryError", {
	enumerable: true,
	get: function() {
		return isOutboundDeliveryError;
	}
});
Object.defineProperty(exports, "isProvenDeliveryNotSentError", {
	enumerable: true,
	get: function() {
		return isProvenDeliveryNotSentError;
	}
});
Object.defineProperty(exports, "releaseRecoveryEntry", {
	enumerable: true,
	get: function() {
		return releaseRecoveryEntry;
	}
});
