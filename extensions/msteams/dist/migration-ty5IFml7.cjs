const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
const require_record_coerce = require("./record-coerce-B82bFbwe.cjs");
//#region src/plugin-sdk/migration.ts
/** Marks an item as intentionally skipped, usually for manual follow-up. */
function markMigrationItemSkipped(item, reason) {
	return {
		...item,
		status: "skipped",
		reason
	};
}
/** Counts migration item statuses for provider plans, apply results, and CLI reports. */
function summarizeMigrationItems(items) {
	return {
		total: items.length,
		planned: items.filter((item) => item.status === "planned").length,
		migrated: items.filter((item) => item.status === "migrated").length,
		skipped: items.filter((item) => item.status === "skipped").length,
		conflicts: items.filter((item) => item.status === "conflict").length,
		errors: items.filter((item) => item.status === "error").length,
		sensitive: items.filter((item) => item.sensitive).length
	};
}
const REDACTED_MIGRATION_VALUE = "[redacted]";
const SECRET_KEY_MARKERS = [
	"accesstoken",
	"apikey",
	"authorization",
	"bearertoken",
	"clientsecret",
	"cookie",
	"credential",
	"password",
	"privatekey",
	"refreshtoken",
	"secret"
];
const SECRET_VALUE_PATTERNS = [
	/\bBearer\s+[A-Za-z0-9._~+/=-]+/gu,
	/\bsk-[A-Za-z0-9_-]{8,}\b/gu,
	/\bgh[pousr]_[A-Za-z0-9_]{16,}\b/gu,
	/\bxox[abprs]-[A-Za-z0-9-]{8,}\b/gu,
	/\bAIza[0-9A-Za-z_-]{12,}\b/gu
];
function normalizeSecretKey(key) {
	return key.toLowerCase().replaceAll(/[^a-z0-9]/gu, "");
}
function isSecretKey(key) {
	const normalized = normalizeSecretKey(key);
	if (normalized === "token" || normalized.endsWith("token")) return true;
	if (normalized === "auth" || normalized === "authorization") return true;
	return SECRET_KEY_MARKERS.some((marker) => normalized.includes(marker));
}
const MIGRATION_REASON_UNSAFE_CONFIG_PATCH_PATH = "unsafe config patch path";
function isSafeMigrationConfigPath(path) {
	return path.length > 0 && path.every((segment) => segment.length > 0 && !require_prototype_keys.isBlockedObjectKey(segment));
}
function cloneMigrationConfigValue(value) {
	if (Array.isArray(value)) return value.map((entry) => cloneMigrationConfigValue(entry));
	if (!require_record_coerce.isRecord(value)) return structuredClone(value);
	const next = {};
	for (const [key, entry] of Object.entries(value)) if (!require_prototype_keys.isBlockedObjectKey(key)) next[key] = cloneMigrationConfigValue(entry);
	return next;
}
/** Deep-merges object patches and replaces scalar/array values with a cloned target value. */
function mergeMigrationConfigValue(left, right) {
	if (!require_record_coerce.isRecord(left) || !require_record_coerce.isRecord(right)) return cloneMigrationConfigValue(right);
	const next = { ...left };
	for (const [key, value] of Object.entries(right)) {
		if (require_prototype_keys.isBlockedObjectKey(key)) continue;
		next[key] = mergeMigrationConfigValue(next[key], value);
	}
	return next;
}
/** Writes a config patch path in-place, creating missing object parents as needed. */
function writeMigrationConfigPath(root, path, value) {
	if (!isSafeMigrationConfigPath(path)) throw new Error(MIGRATION_REASON_UNSAFE_CONFIG_PATCH_PATH);
	let current = root;
	for (const segment of path.slice(0, -1)) {
		const existing = current[segment];
		if (!require_record_coerce.isRecord(existing)) current[segment] = {};
		current = current[segment];
	}
	const leaf = path.at(-1);
	if (!leaf) throw new Error(MIGRATION_REASON_UNSAFE_CONFIG_PATCH_PATH);
	current[leaf] = mergeMigrationConfigValue(current[leaf], value);
}
/** Reads config patch metadata from an item produced by `createMigrationConfigPatchItem`. */
function readMigrationConfigPatchDetails(item) {
	const path = item.details?.path;
	if (!Array.isArray(path) || !path.every((segment) => typeof segment === "string")) return;
	return {
		path,
		value: item.details?.value
	};
}
function isSecretReferenceLike(value) {
	if (!require_record_coerce.isRecord(value)) return false;
	return value.source === "env" && typeof value.id === "string" && (value.provider === void 0 || typeof value.provider === "string");
}
function redactString(value) {
	let next = value;
	for (const pattern of SECRET_VALUE_PATTERNS) next = next.replace(pattern, REDACTED_MIGRATION_VALUE);
	return next;
}
function redactMigrationValueInternal(value, seen) {
	if (typeof value === "string") return redactString(value);
	if (Array.isArray(value)) return value.map((entry) => redactMigrationValueInternal(entry, seen));
	if (!value || typeof value !== "object") return value;
	if (seen.has(value)) return REDACTED_MIGRATION_VALUE;
	seen.add(value);
	const record = value;
	const next = {};
	const redactSensitiveDetailsValue = record.sensitive === true && require_record_coerce.isRecord(record.details) && Object.hasOwn(record.details, "value");
	for (const [key, entry] of Object.entries(record)) {
		if (key === "details" && redactSensitiveDetailsValue && require_record_coerce.isRecord(entry)) {
			const details = redactMigrationValueInternal(entry, seen);
			next[key] = require_record_coerce.isRecord(details) ? {
				...details,
				value: REDACTED_MIGRATION_VALUE
			} : REDACTED_MIGRATION_VALUE;
			continue;
		}
		if (isSecretKey(key) && !isSecretReferenceLike(entry)) {
			next[key] = REDACTED_MIGRATION_VALUE;
			continue;
		}
		next[key] = redactMigrationValueInternal(entry, seen);
	}
	return next;
}
/** Redacts likely secret values while preserving SecretRef-like objects for operator context. */
function redactMigrationValue(value) {
	return redactMigrationValueInternal(value, /* @__PURE__ */ new WeakSet());
}
/** Redacts sensitive fields from a full migration plan before report/output serialization. */
function redactMigrationPlan(plan) {
	return redactMigrationValue(plan);
}
//#endregion
Object.defineProperty(exports, "markMigrationItemSkipped", {
	enumerable: true,
	get: function() {
		return markMigrationItemSkipped;
	}
});
Object.defineProperty(exports, "readMigrationConfigPatchDetails", {
	enumerable: true,
	get: function() {
		return readMigrationConfigPatchDetails;
	}
});
Object.defineProperty(exports, "redactMigrationPlan", {
	enumerable: true,
	get: function() {
		return redactMigrationPlan;
	}
});
Object.defineProperty(exports, "summarizeMigrationItems", {
	enumerable: true,
	get: function() {
		return summarizeMigrationItems;
	}
});
Object.defineProperty(exports, "writeMigrationConfigPath", {
	enumerable: true,
	get: function() {
		return writeMigrationConfigPath;
	}
});
