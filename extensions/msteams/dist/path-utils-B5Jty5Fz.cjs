const require_path_array_index = require("./path-array-index-C9RRFl-Q.cjs");
const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
require("./shared-Bt0YEZDW.cjs");
let node_util = require("node:util");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/secrets/path-utils.ts
/** Strict dotted-path get/set/delete helpers for secrets migration targets. */
function looksLikeArrayIndexSegment(segment) {
	return /^\d+$/.test(segment);
}
function parseArrayIndexSegment(segment) {
	return require_path_array_index.parseConfigPathArrayIndex(segment);
}
function requireArrayIndexSegment(segment, pathLabel) {
	const index = parseArrayIndexSegment(segment);
	if (index === void 0) throw new Error(`Invalid array index segment "${segment}" at ${pathLabel}.`);
	return index;
}
function expectedContainer(nextSegment) {
	return looksLikeArrayIndexSegment(nextSegment) ? "array" : "object";
}
function assertSafeMutationPath(segments) {
	if (segments.length === 0) throw new Error("Target path is empty.");
	const blockedSegment = segments.find(require_prototype_keys.isBlockedObjectKey);
	if (blockedSegment) throw new Error(`Refusing to mutate prototype-polluting path segment "${blockedSegment}".`);
}
function parseArrayLeafTarget(cursor, leaf, segments) {
	if (!Array.isArray(cursor)) return null;
	return {
		array: cursor,
		index: requireArrayIndexSegment(leaf, segments.join("."))
	};
}
function traverseToLeafParent(params) {
	assertSafeMutationPath(params.segments);
	let cursor = params.root;
	for (let index = 0; index < params.segments.length - 1; index += 1) {
		const segment = params.segments[index] ?? "";
		if (Array.isArray(cursor)) {
			const arrayIndex = requireArrayIndexSegment(segment, params.segments.join("."));
			if (params.requireExistingSegment && (arrayIndex < 0 || arrayIndex >= cursor.length)) throw new Error(`Path segment does not exist at ${params.segments.slice(0, index + 1).join(".")}.`);
			cursor = cursor[arrayIndex];
			continue;
		}
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cursor)) throw new Error(`Invalid path shape at ${params.segments.slice(0, index).join(".") || "<root>"}.`);
		if (params.requireExistingSegment && !Object.hasOwn(cursor, segment)) throw new Error(`Path segment does not exist at ${params.segments.slice(0, index + 1).join(".")}.`);
		cursor = cursor[segment];
	}
	return cursor;
}
/**
* Reads a config path from object/array containers.
* Missing containers, invalid array indexes, and scalar parents resolve to undefined.
*/
function getPath(root, segments) {
	if (segments.length === 0) return;
	let cursor = root;
	for (const segment of segments) {
		if (Array.isArray(cursor)) {
			const arrayIndex = parseArrayIndexSegment(segment);
			if (arrayIndex === void 0) return;
			cursor = cursor[arrayIndex];
			continue;
		}
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cursor)) return;
		cursor = cursor[segment];
	}
	return cursor;
}
/**
* Sets a config path, creating missing object or array containers from the next path segment.
* Existing non-container parents fail so callers cannot silently change config shape.
*/
function setPathCreateStrict(root, segments, value) {
	assertSafeMutationPath(segments);
	let cursor = root;
	let changed = false;
	for (let index = 0; index < segments.length - 1; index += 1) {
		const segment = segments[index] ?? "";
		const needs = expectedContainer(segments[index + 1] ?? "");
		if (Array.isArray(cursor)) {
			const arrayIndex = requireArrayIndexSegment(segment, segments.join("."));
			const existing = cursor[arrayIndex];
			if (existing === void 0 || existing === null) {
				cursor[arrayIndex] = needs === "array" ? [] : {};
				changed = true;
			} else if (needs === "array" ? !Array.isArray(existing) : !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(existing)) throw new Error(`Invalid path shape at ${segments.slice(0, index + 1).join(".")}.`);
			cursor = cursor[arrayIndex];
			continue;
		}
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cursor)) throw new Error(`Invalid path shape at ${segments.slice(0, index).join(".") || "<root>"}.`);
		const existing = cursor[segment];
		if (existing === void 0 || existing === null) {
			cursor[segment] = needs === "array" ? [] : {};
			changed = true;
		} else if (needs === "array" ? !Array.isArray(existing) : !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(existing)) throw new Error(`Invalid path shape at ${segments.slice(0, index + 1).join(".")}.`);
		cursor = cursor[segment];
	}
	const leaf = segments[segments.length - 1] ?? "";
	const arrayTarget = parseArrayLeafTarget(cursor, leaf, segments);
	if (arrayTarget) {
		if (!(0, node_util.isDeepStrictEqual)(arrayTarget.array[arrayTarget.index], value)) {
			arrayTarget.array[arrayTarget.index] = value;
			changed = true;
		}
		return changed;
	}
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cursor)) throw new Error(`Invalid path shape at ${segments.slice(0, -1).join(".") || "<root>"}.`);
	if (!(0, node_util.isDeepStrictEqual)(cursor[leaf], value)) {
		cursor[leaf] = value;
		changed = true;
	}
	return changed;
}
/**
* Sets an existing config path and throws if any parent or leaf segment is missing.
* Used by runtime resolution paths that must only replace values proven by source discovery.
*/
function setPathExistingStrict(root, segments, value) {
	const cursor = traverseToLeafParent({
		root,
		segments,
		requireExistingSegment: true
	});
	const leaf = segments[segments.length - 1] ?? "";
	const arrayTarget = parseArrayLeafTarget(cursor, leaf, segments);
	if (arrayTarget) {
		if (arrayTarget.index < 0 || arrayTarget.index >= arrayTarget.array.length) throw new Error(`Path segment does not exist at ${segments.join(".")}.`);
		if (!(0, node_util.isDeepStrictEqual)(arrayTarget.array[arrayTarget.index], value)) {
			arrayTarget.array[arrayTarget.index] = value;
			return true;
		}
		return false;
	}
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cursor)) throw new Error(`Invalid path shape at ${segments.slice(0, -1).join(".") || "<root>"}.`);
	if (!Object.hasOwn(cursor, leaf)) throw new Error(`Path segment does not exist at ${segments.join(".")}.`);
	if (!(0, node_util.isDeepStrictEqual)(cursor[leaf], value)) {
		cursor[leaf] = value;
		return true;
	}
	return false;
}
//#endregion
Object.defineProperty(exports, "getPath", {
	enumerable: true,
	get: function() {
		return getPath;
	}
});
Object.defineProperty(exports, "setPathCreateStrict", {
	enumerable: true,
	get: function() {
		return setPathCreateStrict;
	}
});
Object.defineProperty(exports, "setPathExistingStrict", {
	enumerable: true,
	get: function() {
		return setPathExistingStrict;
	}
});
