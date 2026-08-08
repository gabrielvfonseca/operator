const require_semver = require("./semver-CcnjzT8W.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let semver = require("semver");
//#region src/infra/npm-registry-spec.ts
const OPERATOR_RELEASE_PREFIX_RE = /^\d{4}\./;
const DIST_TAG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
function parseRegistryNpmSpecInternal(rawSpec) {
	const spec = rawSpec.trim();
	if (!spec) return {
		ok: false,
		error: "missing npm spec"
	};
	if (/\s/.test(spec)) return {
		ok: false,
		error: "unsupported npm spec: whitespace is not allowed"
	};
	if (spec.includes("://")) return {
		ok: false,
		error: "unsupported npm spec: URLs are not allowed"
	};
	if (spec.includes("#")) return {
		ok: false,
		error: "unsupported npm spec: git refs are not allowed"
	};
	if (spec.includes(":")) return {
		ok: false,
		error: "unsupported npm spec: protocol specs are not allowed"
	};
	const at = spec.lastIndexOf("@");
	const hasSelector = at > 0;
	const name = hasSelector ? spec.slice(0, at) : spec;
	const selector = hasSelector ? spec.slice(at + 1) : "";
	if (!(name.startsWith("@") ? /^@[a-z0-9][a-z0-9-._~]*\/[a-z0-9][a-z0-9-._~]*$/.test(name) : /^[a-z0-9][a-z0-9-._~]*$/.test(name))) return {
		ok: false,
		error: "unsupported npm spec: expected <name> or <name>@<version> from the npm registry"
	};
	if (!hasSelector) return {
		ok: true,
		parsed: {
			name,
			raw: spec,
			selectorKind: "none",
			selectorIsPrerelease: false
		}
	};
	if (!selector) return {
		ok: false,
		error: "unsupported npm spec: missing version/tag after @"
	};
	if (/[\\/]/.test(selector)) return {
		ok: false,
		error: "unsupported npm spec: invalid version/tag"
	};
	const exactVersion = (0, semver.valid)(selector);
	if (exactVersion) return {
		ok: true,
		parsed: {
			name,
			raw: spec,
			selector,
			selectorKind: "exact-version",
			selectorIsPrerelease: (0, semver.prerelease)(exactVersion) !== null && !isOperatorStableCorrectionVersion(selector)
		}
	};
	if (!DIST_TAG_RE.test(selector)) return {
		ok: false,
		error: "unsupported npm spec: use an exact version or dist-tag (ranges are not allowed)"
	};
	return {
		ok: true,
		parsed: {
			name,
			raw: spec,
			selector,
			selectorKind: "tag",
			selectorIsPrerelease: false
		}
	};
}
/** Parses a registry-only npm package spec into package name and optional selector metadata. */
function parseRegistryNpmSpec(rawSpec) {
	const parsed = parseRegistryNpmSpecInternal(rawSpec);
	return parsed.ok ? parsed.parsed : null;
}
/** Returns whether a user-provided npm spec resolves to the official Operator npm scope. */
function isOperatorOrgNpmSpec(rawSpec) {
	return (rawSpec ? parseRegistryNpmSpec(rawSpec) : null)?.name.startsWith("@gabrielvfonseca/") === true;
}
/** Validates a registry-only npm spec and returns a user-facing error when rejected. */
function validateRegistryNpmSpec(rawSpec) {
	const parsed = parseRegistryNpmSpecInternal(rawSpec);
	return parsed.ok ? null : parsed.error;
}
/** Returns whether a value is an exact semver selector, with optional leading `v`. */
function isExactSemverVersion(value) {
	return (0, semver.valid)(value.trim()) !== null;
}
/** Parses Operator's monthly patch stable/alpha/beta/correction version format. */
function parseOperatorReleaseVersion(value) {
	const trimmed = value.trim();
	const parsed = OPERATOR_RELEASE_PREFIX_RE.test(trimmed) ? (0, semver.parse)(trimmed) : null;
	if (!parsed || parsed.build.length > 0) return null;
	if (parsed.minor < 1 || parsed.minor > 12 || parsed.patch < 1) return null;
	const [label, sequence] = parsed.prerelease;
	const isStable = parsed.prerelease.length === 0;
	const isCorrection = require_semver.isOperatorCorrectionSemver(parsed) && typeof label === "number" && label > 0;
	const isAlpha = parsed.prerelease.length === 2 && label === "alpha" && typeof sequence === "number" && sequence > 0;
	const isBeta = parsed.prerelease.length === 2 && label === "beta" && typeof sequence === "number" && sequence > 0;
	if (!isStable && !isCorrection && !isAlpha && !isBeta) return null;
	return parsed;
}
/** Returns whether a version is an Operator monthly patch stable correction release. */
function isOperatorStableCorrectionVersion(value) {
	const parsed = parseOperatorReleaseVersion(value);
	return parsed !== null && require_semver.isOperatorCorrectionSemver(parsed);
}
/** Compares Operator monthly patch release versions across alpha, beta, stable, and corrections. */
function compareOperatorReleaseVersions(left, right) {
	const parsedLeft = parseOperatorReleaseVersion(left);
	const parsedRight = parseOperatorReleaseVersion(right);
	return parsedLeft && parsedRight ? require_semver.compareOperatorSemver(parsedLeft, parsedRight) : null;
}
/** Returns whether an exact semver value is a prerelease, excluding stable correction releases. */
function isPrereleaseSemverVersion(value) {
	const trimmed = value.trim();
	return (0, semver.prerelease)(trimmed) !== null && !isOperatorStableCorrectionVersion(trimmed);
}
/**
* Enforces explicit opt-in before an npm spec may resolve to a prerelease.
* Bare specs and `latest` stay on stable releases unless the resolved version
* is an Operator stable correction.
*/
function isPrereleaseResolutionAllowed(params) {
	if (!params.resolvedVersion || !isPrereleaseSemverVersion(params.resolvedVersion)) return true;
	if (params.spec.selectorKind === "none") return false;
	if (params.spec.selectorKind === "exact-version") return params.spec.selectorIsPrerelease;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.spec.selector) !== "latest";
}
/** Formats the install error shown when a registry spec resolves to a disallowed prerelease. */
function formatPrereleaseResolutionError(params) {
	const selectorHint = params.spec.selectorKind === "none" || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.spec.selector) === "latest" ? `Use "${params.spec.name}@beta" (or another prerelease tag) or an exact prerelease version to opt in explicitly.` : `Use an explicit prerelease tag or exact prerelease version if you want prerelease installs.`;
	return `Resolved ${params.spec.raw} to prerelease version ${params.resolvedVersion}, but prereleases are only installed when explicitly requested. ${selectorHint}`;
}
//#endregion
Object.defineProperty(exports, "compareOperatorReleaseVersions", {
	enumerable: true,
	get: function() {
		return compareOperatorReleaseVersions;
	}
});
Object.defineProperty(exports, "formatPrereleaseResolutionError", {
	enumerable: true,
	get: function() {
		return formatPrereleaseResolutionError;
	}
});
Object.defineProperty(exports, "isExactSemverVersion", {
	enumerable: true,
	get: function() {
		return isExactSemverVersion;
	}
});
Object.defineProperty(exports, "isOperatorOrgNpmSpec", {
	enumerable: true,
	get: function() {
		return isOperatorOrgNpmSpec;
	}
});
Object.defineProperty(exports, "isPrereleaseResolutionAllowed", {
	enumerable: true,
	get: function() {
		return isPrereleaseResolutionAllowed;
	}
});
Object.defineProperty(exports, "isPrereleaseSemverVersion", {
	enumerable: true,
	get: function() {
		return isPrereleaseSemverVersion;
	}
});
Object.defineProperty(exports, "parseRegistryNpmSpec", {
	enumerable: true,
	get: function() {
		return parseRegistryNpmSpec;
	}
});
Object.defineProperty(exports, "validateRegistryNpmSpec", {
	enumerable: true,
	get: function() {
		return validateRegistryNpmSpec;
	}
});
