const require_plain_object = require("./plain-object-CITRo0uW.cjs");
require("./utils-CXqBhRFw.cjs");
const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
//#region src/config/config-paths.ts
function setOwnConfigProperty(node, key, value) {
	if (Object.hasOwn(node, key)) {
		node[key] = value;
		return;
	}
	Object.defineProperty(node, key, {
		configurable: true,
		enumerable: true,
		value,
		writable: true
	});
}
/** Parses CLI/config dot-notation paths and rejects unsafe object-key segments. */
function parseConfigPath(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return {
		ok: false,
		error: "Invalid path. Use dot notation (e.g. foo.bar)."
	};
	const parts = trimmed.split(".").map((part) => part.trim());
	if (parts.some((part) => !part)) return {
		ok: false,
		error: "Invalid path. Use dot notation (e.g. foo.bar)."
	};
	if (parts.some((part) => require_prototype_keys.isBlockedObjectKey(part))) return {
		ok: false,
		error: "Invalid path segment."
	};
	return {
		ok: true,
		path: parts
	};
}
/** Sets a value at a validated config path, creating missing plain-object parents. */
function setConfigValueAtPath(root, path, value) {
	const leafKey = path.at(-1);
	if (leafKey === void 0) throw new Error("Config path must contain at least one segment");
	let cursor = root;
	for (const key of path.slice(0, -1)) {
		const existing = Object.hasOwn(cursor, key) ? cursor[key] : void 0;
		const next = require_plain_object.isPlainObject(existing) ? existing : {};
		if (next !== existing) setOwnConfigProperty(cursor, key, next);
		cursor = next;
	}
	setOwnConfigProperty(cursor, leafKey, value);
}
/** Removes a value at a config path and prunes empty parent objects created by setters. */
function unsetConfigValueAtPath(root, path) {
	const leafKey = path.at(-1);
	if (leafKey === void 0) return false;
	const stack = [];
	let cursor = root;
	for (const key of path.slice(0, -1)) {
		if (!Object.hasOwn(cursor, key)) return false;
		const next = cursor[key];
		if (!require_plain_object.isPlainObject(next)) return false;
		stack.push({
			node: cursor,
			key
		});
		cursor = next;
	}
	if (!Object.hasOwn(cursor, leafKey)) return false;
	delete cursor[leafKey];
	for (let idx = stack.length - 1; idx >= 0; idx -= 1) {
		const { node, key } = (0, _gabrielvfonseca_normalization_core.expectDefined)(stack[idx], "stack entry at idx");
		const child = node[key];
		if (require_plain_object.isPlainObject(child) && Object.keys(child).length === 0) delete node[key];
		else break;
	}
	return true;
}
/** Reads a value from a config path, stopping at the first non-plain-object parent. */
function getConfigValueAtPath(root, path) {
	let cursor = root;
	for (const key of path) {
		if (!require_plain_object.isPlainObject(cursor) || !Object.hasOwn(cursor, key)) return;
		cursor = cursor[key];
	}
	return cursor;
}
//#endregion
Object.defineProperty(exports, "getConfigValueAtPath", {
	enumerable: true,
	get: function() {
		return getConfigValueAtPath;
	}
});
Object.defineProperty(exports, "parseConfigPath", {
	enumerable: true,
	get: function() {
		return parseConfigPath;
	}
});
Object.defineProperty(exports, "setConfigValueAtPath", {
	enumerable: true,
	get: function() {
		return setConfigValueAtPath;
	}
});
Object.defineProperty(exports, "unsetConfigValueAtPath", {
	enumerable: true,
	get: function() {
		return unsetConfigValueAtPath;
	}
});
