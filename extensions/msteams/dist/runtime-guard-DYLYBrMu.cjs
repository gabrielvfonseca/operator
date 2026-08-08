const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_process = require("node:process");
node_process = require_rolldown_runtime.__toESM(node_process, 1);
//#region src/infra/runtime-guard.ts
const MIN_NODE_22 = {
	major: 22,
	minor: 22,
	patch: 3
};
const MIN_NODE_24 = {
	major: 24,
	minor: 15,
	patch: 0
};
const MIN_NODE_25 = {
	major: 25,
	minor: 9,
	patch: 0
};
const SEMVER_RE = /(\d+)\.(\d+)\.(\d+)/;
/** Parses the first major/minor/patch triple from a runtime or package version label. */
function parseSemver(version) {
	if (!version) return null;
	const match = version.match(SEMVER_RE);
	if (!match) return null;
	const [, major, minor, patch] = match;
	return {
		major: Number.parseInt((0, _gabrielvfonseca_normalization_core.expectDefined)(major, "runtime guard major"), 10),
		minor: Number.parseInt((0, _gabrielvfonseca_normalization_core.expectDefined)(minor, "runtime guard minor"), 10),
		patch: Number.parseInt((0, _gabrielvfonseca_normalization_core.expectDefined)(patch, "runtime guard patch"), 10)
	};
}
/** Compares parsed semver triples against an inclusive minimum version. */
function isAtLeast(version, minimum) {
	if (!version) return false;
	if (version.major !== minimum.major) return version.major > minimum.major;
	if (version.minor !== minimum.minor) return version.minor > minimum.minor;
	return version.patch >= minimum.patch;
}
/** Checks a Node version label against Operator's supported Node version range. */
function isSupportedNodeVersion(version) {
	const parsed = parseSemver(version);
	if (!parsed) return false;
	if (parsed.major === MIN_NODE_22.major) return isAtLeast(parsed, MIN_NODE_22);
	if (parsed.major === MIN_NODE_24.major) return isAtLeast(parsed, MIN_NODE_24);
	if (parsed.major === MIN_NODE_25.major) return isAtLeast(parsed, MIN_NODE_25);
	return parsed.major > MIN_NODE_25.major;
}
//#endregion
Object.defineProperty(exports, "isAtLeast", {
	enumerable: true,
	get: function() {
		return isAtLeast;
	}
});
Object.defineProperty(exports, "isSupportedNodeVersion", {
	enumerable: true,
	get: function() {
		return isSupportedNodeVersion;
	}
});
Object.defineProperty(exports, "parseSemver", {
	enumerable: true,
	get: function() {
		return parseSemver;
	}
});
