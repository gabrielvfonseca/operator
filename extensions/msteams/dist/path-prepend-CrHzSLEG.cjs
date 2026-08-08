const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/infra/path-prepend.ts
/**
* Find the actual key used for PATH in the env object.
* On Windows, `process.env` stores it as `Path` (not `PATH`),
* and after copying to a plain object the original casing is preserved.
*/
function findPathKey(env) {
	if ("PATH" in env) return "PATH";
	for (const key of Object.keys(env)) if (key.toUpperCase() === "PATH") return key;
	return "PATH";
}
/** Normalizes configured PATH prepends by trimming blanks and preserving first-seen order. */
function normalizePathPrepend(entries) {
	if (!Array.isArray(entries)) return [];
	const seen = /* @__PURE__ */ new Set();
	const normalized = [];
	for (const entry of entries) {
		if (typeof entry !== "string") continue;
		const trimmed = entry.trim();
		if (!trimmed || seen.has(trimmed)) continue;
		seen.add(trimmed);
		normalized.push(trimmed);
	}
	return normalized;
}
/** Merges prepended PATH entries ahead of the existing PATH while deduping normalized parts. */
function mergePathPrepend(existing, prepend) {
	if (prepend.length === 0) return existing;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)([...prepend, ...(existing ?? "").split(node_path.default.delimiter)]).join(node_path.default.delimiter);
}
/** Removes managed prepend entries from an existing PATH, including later duplicate copies. */
function removePathPrepend(existing, prepend) {
	if (!existing || prepend.length === 0) return existing;
	const prependEntries = new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(prepend));
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)((existing ?? "").split(node_path.default.delimiter)).filter((part) => !prependEntries.has(part)).join(node_path.default.delimiter);
}
/** Applies configured PATH prepends in-place, preserving Windows PATH key casing. */
function applyPathPrepend(env, prepend, options) {
	if (!Array.isArray(prepend) || prepend.length === 0) return;
	const pathKey = findPathKey(env);
	if (options?.requireExisting && !env[pathKey]) return;
	const merged = mergePathPrepend(env[pathKey], prepend);
	if (merged) env[pathKey] = merged;
}
//#endregion
Object.defineProperty(exports, "applyPathPrepend", {
	enumerable: true,
	get: function() {
		return applyPathPrepend;
	}
});
Object.defineProperty(exports, "findPathKey", {
	enumerable: true,
	get: function() {
		return findPathKey;
	}
});
Object.defineProperty(exports, "mergePathPrepend", {
	enumerable: true,
	get: function() {
		return mergePathPrepend;
	}
});
Object.defineProperty(exports, "normalizePathPrepend", {
	enumerable: true,
	get: function() {
		return normalizePathPrepend;
	}
});
Object.defineProperty(exports, "removePathPrepend", {
	enumerable: true,
	get: function() {
		return removePathPrepend;
	}
});
