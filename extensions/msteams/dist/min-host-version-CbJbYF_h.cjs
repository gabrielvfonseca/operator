const require_runtime_guard = require("./runtime-guard-DYLYBrMu.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/min-host-version.ts
/** Validation message for plugin minHostVersion manifest fields. */
const MIN_HOST_VERSION_FORMAT = "operator.install.minHostVersion must use a semver floor in the form \">=x.y.z[-prerelease][+build]\"";
const SEMVER_LABEL_RE = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?`;
const MIN_HOST_VERSION_RE = new RegExp(`^>=(${SEMVER_LABEL_RE})$`);
const LEGACY_MIN_HOST_VERSION_RE = /^(\d+)\.(\d+)\.(\d+)$/;
/** Parses a plugin minHostVersion manifest field. */
function parseMinHostVersionRequirement(raw, options = {}) {
	if (typeof raw !== "string") return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const match = trimmed.match(MIN_HOST_VERSION_RE) ?? (options.allowLegacyBareSemver ? trimmed.match(LEGACY_MIN_HOST_VERSION_RE) : null);
	if (!match) return null;
	const minimumLabel = match.length >= 4 ? `${match[1]}.${match[2]}.${match[3]}` : match[1] ?? "";
	if (!require_runtime_guard.parseSemver(minimumLabel)) return null;
	return {
		raw: trimmed,
		minimumLabel
	};
}
/** Checks whether the current host satisfies a plugin minHostVersion requirement. */
function checkMinHostVersion(params) {
	if (params.minHostVersion === void 0) return {
		ok: true,
		requirement: null
	};
	const requirement = parseMinHostVersionRequirement(params.minHostVersion, { allowLegacyBareSemver: params.allowLegacyBareSemver });
	if (!requirement) return {
		ok: false,
		kind: "invalid",
		error: MIN_HOST_VERSION_FORMAT
	};
	const currentVersion = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.currentVersion) || "unknown";
	const currentSemver = require_runtime_guard.parseSemver(currentVersion);
	if (!currentSemver) return {
		ok: false,
		kind: "unknown_host_version",
		requirement
	};
	if (!require_runtime_guard.isAtLeast(currentSemver, require_runtime_guard.parseSemver(requirement.minimumLabel))) return {
		ok: false,
		kind: "incompatible",
		requirement,
		currentVersion
	};
	return {
		ok: true,
		requirement
	};
}
//#endregion
Object.defineProperty(exports, "checkMinHostVersion", {
	enumerable: true,
	get: function() {
		return checkMinHostVersion;
	}
});
