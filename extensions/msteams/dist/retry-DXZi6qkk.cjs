const require_src = require("./src-BcOJL8NE.cjs");
let node_crypto = require("node:crypto");
//#region src/infra/secure-random.ts
/** Generates a cryptographically secure UUID for runtime ids and cache keys. */
function generateSecureUuid() {
	return (0, node_crypto.randomUUID)();
}
/** Generates a URL-safe cryptographic token from the requested byte count. */
function generateSecureToken(bytes = 16) {
	return (0, node_crypto.randomBytes)(bytes).toString("base64url");
}
/** Returns a cryptographically secure fraction in the range [0, 1). */
function generateSecureFraction() {
	return (0, node_crypto.randomBytes)(4).readUInt32BE(0) / 4294967296;
}
function generateSecureInt(a, b) {
	return typeof b === "number" ? (0, node_crypto.randomInt)(a, b) : (0, node_crypto.randomInt)(a);
}
//#endregion
//#region src/infra/retry-attempt-errors.ts
const retryAttemptErrors = /* @__PURE__ */ new WeakMap();
function recordRetryAttemptErrors(error, attemptErrors) {
	retryAttemptErrors.set(error, [...attemptErrors]);
}
function getRetryAttemptErrors(err) {
	return err !== null && (typeof err === "object" || typeof err === "function") ? retryAttemptErrors.get(err) : void 0;
}
//#endregion
//#region src/infra/retry.ts
function createRetryFailure(rawAttemptErrors) {
	const attemptErrors = rawAttemptErrors.flatMap((err) => getRetryAttemptErrors(err) ?? [err]);
	const failure = require_src.toRetryError(attemptErrors.at(-1) ?? /* @__PURE__ */ new Error("Retry failed"), "Non-Error thrown");
	if (attemptErrors.length > 1) recordRetryAttemptErrors(failure, attemptErrors);
	return failure;
}
/** Runs an async operation until it succeeds, policy stops, or attempts are exhausted. */
const retryAsync = require_src.createRetryRunner({
	random: generateSecureFraction,
	createFailure: createRetryFailure
});
//#endregion
Object.defineProperty(exports, "generateSecureInt", {
	enumerable: true,
	get: function() {
		return generateSecureInt;
	}
});
Object.defineProperty(exports, "generateSecureToken", {
	enumerable: true,
	get: function() {
		return generateSecureToken;
	}
});
Object.defineProperty(exports, "generateSecureUuid", {
	enumerable: true,
	get: function() {
		return generateSecureUuid;
	}
});
Object.defineProperty(exports, "getRetryAttemptErrors", {
	enumerable: true,
	get: function() {
		return getRetryAttemptErrors;
	}
});
Object.defineProperty(exports, "retryAsync", {
	enumerable: true,
	get: function() {
		return retryAsync;
	}
});
