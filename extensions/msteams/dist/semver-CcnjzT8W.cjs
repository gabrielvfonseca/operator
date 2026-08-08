let semver = require("semver");
//#region src/infra/semver.ts
function compareValidSemver(left, right) {
	const parsedLeft = (0, semver.parse)(left);
	const parsedRight = (0, semver.parse)(right);
	return parsedLeft && parsedRight ? parsedLeft.compare(parsedRight) : null;
}
function isOperatorCorrectionSemver(version) {
	return version.prerelease.length === 1 && typeof version.prerelease[0] === "number";
}
function toOperatorComparableVersion(version) {
	if (isOperatorCorrectionSemver(version)) return `${version.major}.${version.minor}.${version.patch}+${version.prerelease[0]}`;
	return version.version;
}
/** Compares prereleases, stable releases, then Operator numeric corrections. */
function compareOperatorSemver(left, right) {
	return (0, semver.compareBuild)(toOperatorComparableVersion(left), toOperatorComparableVersion(right));
}
/** Converts legacy Operator `1.2.3.beta.N` tags into valid SemVer prereleases. */
function normalizeLegacyDotBetaVersion(version) {
	const trimmed = version.trim();
	const dotBetaMatch = /^([vV]?[0-9]+\.[0-9]+\.[0-9]+)\.beta(?:\.([0-9A-Za-z.-]+))?$/.exec(trimmed);
	if (!dotBetaMatch) return trimmed;
	const base = dotBetaMatch[1];
	const suffix = dotBetaMatch[2];
	return suffix ? `${base}-beta.${suffix}` : `${base}-beta`;
}
//#endregion
Object.defineProperty(exports, "compareOperatorSemver", {
	enumerable: true,
	get: function() {
		return compareOperatorSemver;
	}
});
Object.defineProperty(exports, "compareValidSemver", {
	enumerable: true,
	get: function() {
		return compareValidSemver;
	}
});
Object.defineProperty(exports, "isOperatorCorrectionSemver", {
	enumerable: true,
	get: function() {
		return isOperatorCorrectionSemver;
	}
});
Object.defineProperty(exports, "normalizeLegacyDotBetaVersion", {
	enumerable: true,
	get: function() {
		return normalizeLegacyDotBetaVersion;
	}
});
