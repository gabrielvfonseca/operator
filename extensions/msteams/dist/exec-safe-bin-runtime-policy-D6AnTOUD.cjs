const require_exec_safe_bin_trust = require("./exec-safe-bin-trust-CoGK22qG.cjs");
const require_exec_approvals_allowlist = require("./exec-approvals-allowlist-DtyPjYFC.cjs");
//#region src/infra/exec-safe-bin-runtime-policy.ts
const INTERPRETER_LIKE_SAFE_BINS = /* @__PURE__ */ new Set([
	"ash",
	"awk",
	"bash",
	"busybox",
	"bun",
	"cmd",
	"cmd.exe",
	"cscript",
	"dash",
	"deno",
	"fish",
	"gawk",
	"gsed",
	"ksh",
	"lua",
	"mawk",
	"nawk",
	"node",
	"nodejs",
	"perl",
	"php",
	"powershell",
	"powershell.exe",
	"pypy",
	"pwsh",
	"pwsh.exe",
	"python",
	"python2",
	"python3",
	"ruby",
	"sed",
	"sh",
	"toybox",
	"wscript",
	"zsh"
]);
const INTERPRETER_LIKE_PATTERNS = [
	/^python\d+(?:\.\d+)?$/,
	/^ruby\d+(?:\.\d+)?$/,
	/^perl\d+(?:\.\d+)?$/,
	/^php\d+(?:\.\d+)?$/,
	/^node\d+(?:\.\d+)?$/
];
/** Returns true for safeBins that can interpret scripts or execute broad embedded programs. */
function isInterpreterLikeSafeBin(raw) {
	const normalized = require_exec_safe_bin_trust.normalizeSafeBinName(raw);
	if (!normalized) return false;
	if (INTERPRETER_LIKE_SAFE_BINS.has(normalized)) return true;
	return INTERPRETER_LIKE_PATTERNS.some((pattern) => pattern.test(normalized));
}
/** Lists normalized interpreter-like safeBins from a configured entry set. */
function listInterpreterLikeSafeBins(entries) {
	return Array.from(entries).map((entry) => require_exec_safe_bin_trust.normalizeSafeBinName(entry)).filter((entry) => entry.length > 0 && isInterpreterLikeSafeBin(entry)).toSorted();
}
/** Merges global and local safe-bin profile fixtures, with local definitions winning. */
function resolveMergedSafeBinProfileFixtures(params) {
	const global = require_exec_safe_bin_trust.normalizeSafeBinProfileFixtures(params.global?.safeBinProfiles);
	const local = require_exec_safe_bin_trust.normalizeSafeBinProfileFixtures(params.local?.safeBinProfiles);
	if (Object.keys(global).length === 0 && Object.keys(local).length === 0) return;
	return {
		...global,
		...local
	};
}
/** Resolves safe-bin names, profiles, trusted dirs, and warning metadata for exec evaluation. */
function resolveExecSafeBinRuntimePolicy(params) {
	const safeBins = require_exec_approvals_allowlist.resolveSafeBins(params.local?.safeBins ?? params.global?.safeBins);
	const safeBinProfiles = require_exec_safe_bin_trust.resolveSafeBinProfiles(resolveMergedSafeBinProfileFixtures({
		global: params.global,
		local: params.local
	}));
	const unprofiledSafeBins = Array.from(safeBins).filter((entry) => !safeBinProfiles[entry]).toSorted();
	const explicitTrustedSafeBinDirs = [...require_exec_safe_bin_trust.normalizeTrustedSafeBinDirs(params.global?.safeBinTrustedDirs), ...require_exec_safe_bin_trust.normalizeTrustedSafeBinDirs(params.local?.safeBinTrustedDirs)];
	const trustedSafeBinDirs = require_exec_safe_bin_trust.getTrustedSafeBinDirs({
		extraDirs: explicitTrustedSafeBinDirs,
		safeBins: Array.from(safeBins)
	});
	const writableTrustedSafeBinDirs = require_exec_safe_bin_trust.listWritableExplicitTrustedSafeBinDirs(explicitTrustedSafeBinDirs);
	if (params.onWarning) for (const hit of writableTrustedSafeBinDirs) {
		const scope = hit.worldWritable || hit.groupWritable ? hit.worldWritable ? "world-writable" : "group-writable" : "writable";
		params.onWarning(`exec: safeBinTrustedDirs includes ${scope} directory '${hit.dir}'; remove trust or tighten permissions (for example chmod 755).`);
	}
	return {
		safeBins,
		safeBinProfiles,
		trustedSafeBinDirs,
		unprofiledSafeBins,
		unprofiledInterpreterSafeBins: listInterpreterLikeSafeBins(unprofiledSafeBins),
		writableTrustedSafeBinDirs
	};
}
//#endregion
Object.defineProperty(exports, "listInterpreterLikeSafeBins", {
	enumerable: true,
	get: function() {
		return listInterpreterLikeSafeBins;
	}
});
Object.defineProperty(exports, "resolveExecSafeBinRuntimePolicy", {
	enumerable: true,
	get: function() {
		return resolveExecSafeBinRuntimePolicy;
	}
});
Object.defineProperty(exports, "resolveMergedSafeBinProfileFixtures", {
	enumerable: true,
	get: function() {
		return resolveMergedSafeBinProfileFixtures;
	}
});
