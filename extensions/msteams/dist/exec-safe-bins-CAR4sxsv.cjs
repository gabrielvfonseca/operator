require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_exec_safe_bin_trust = require("./exec-safe-bin-trust-CoGK22qG.cjs");
const require_exec_safe_bin_runtime_policy = require("./exec-safe-bin-runtime-policy-D6AnTOUD.cjs");
const require_object = require("./object-Be4AQnVV.cjs");
const require_exec_safe_bin_config = require("./exec-safe-bin-config-DJSoCbfa.cjs");
//#region src/commands/doctor/shared/exec-safe-bins.ts
function collectExecSafeBinScopes(cfg) {
	const scopes = [];
	const globalExec = require_object.asObjectRecord(cfg.tools?.exec);
	const globalTrustedDirs = require_exec_safe_bin_config.normalizeConfiguredTrustedSafeBinDirs(globalExec?.safeBinTrustedDirs);
	if (globalExec) {
		const safeBins = require_exec_safe_bin_config.normalizeConfiguredSafeBins(globalExec.safeBins);
		if (safeBins.length > 0) scopes.push({
			scopePath: "tools.exec",
			safeBins,
			exec: globalExec,
			mergedProfiles: require_exec_safe_bin_runtime_policy.resolveMergedSafeBinProfileFixtures({ global: globalExec }) ?? {},
			trustedSafeBinDirs: require_exec_safe_bin_trust.getTrustedSafeBinDirs({ extraDirs: globalTrustedDirs })
		});
	}
	const agents = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
	for (const agent of agents) {
		if (!agent || typeof agent !== "object" || typeof agent.id !== "string") continue;
		const agentExec = require_object.asObjectRecord(agent.tools?.exec);
		if (!agentExec) continue;
		const safeBins = require_exec_safe_bin_config.normalizeConfiguredSafeBins(agentExec.safeBins);
		if (safeBins.length === 0) continue;
		scopes.push({
			scopePath: `agents.list.${agent.id}.tools.exec`,
			safeBins,
			exec: agentExec,
			mergedProfiles: require_exec_safe_bin_runtime_policy.resolveMergedSafeBinProfileFixtures({
				global: globalExec,
				local: agentExec
			}) ?? {},
			trustedSafeBinDirs: require_exec_safe_bin_trust.getTrustedSafeBinDirs({ extraDirs: [...globalTrustedDirs, ...require_exec_safe_bin_config.normalizeConfiguredTrustedSafeBinDirs(agentExec.safeBinTrustedDirs)] })
		});
	}
	return scopes;
}
/** Scan configured safeBins for missing profiles and risky low-friction entries. */
function scanExecSafeBinCoverage(cfg) {
	const hits = [];
	for (const scope of collectExecSafeBinScopes(cfg)) {
		const interpreterBins = new Set(require_exec_safe_bin_runtime_policy.listInterpreterLikeSafeBins(scope.safeBins));
		const riskyHits = require_exec_safe_bin_trust.listRiskyConfiguredSafeBins(scope.safeBins);
		const riskyBins = new Set(riskyHits.map((hit) => hit.bin));
		for (const bin of scope.safeBins) {
			if (scope.mergedProfiles[bin]) continue;
			if (riskyBins.has(require_exec_safe_bin_trust.normalizeSafeBinName(bin))) continue;
			hits.push({
				scopePath: scope.scopePath,
				bin,
				kind: "missingProfile",
				isInterpreter: interpreterBins.has(bin)
			});
		}
		for (const hit of riskyHits) hits.push({
			scopePath: scope.scopePath,
			bin: hit.bin,
			kind: "riskySemantics",
			warning: hit.warning
		});
	}
	return hits;
}
/** Scan configured safeBins that resolve outside trusted binary directories. */
function scanExecSafeBinTrustedDirHints(cfg) {
	const hits = [];
	for (const scope of collectExecSafeBinScopes(cfg)) for (const bin of scope.safeBins) {
		const resolution = require_exec_safe_bin_trust.resolveCommandResolutionFromArgv([bin]);
		if (!resolution?.execution.resolvedPath) continue;
		if (require_exec_safe_bin_trust.isTrustedSafeBinPath({
			resolvedPath: resolution.execution.resolvedPath,
			trustedDirs: scope.trustedSafeBinDirs
		})) continue;
		hits.push({
			scopePath: scope.scopePath,
			bin,
			resolvedPath: resolution.execution.resolvedPath
		});
	}
	return hits;
}
/** Format doctor warnings for safeBins profile coverage and risky semantics. */
function collectExecSafeBinCoverageWarnings(params) {
	if (params.hits.length === 0) return [];
	const interpreterHits = params.hits.filter((hit) => hit.kind === "missingProfile" && hit.isInterpreter);
	const customHits = params.hits.filter((hit) => hit.kind === "missingProfile" && !hit.isInterpreter);
	const riskyHits = params.hits.filter((hit) => hit.kind === "riskySemantics");
	const lines = [];
	if (interpreterHits.length > 0) {
		for (const hit of interpreterHits.slice(0, 5)) lines.push(`- ${require_ansi.sanitizeForLog(hit.scopePath)}.safeBins includes interpreter/runtime '${require_ansi.sanitizeForLog(hit.bin)}' without profile.`);
		if (interpreterHits.length > 5) lines.push(`- ${interpreterHits.length - 5} more interpreter/runtime safeBins entries are missing profiles.`);
	}
	if (customHits.length > 0) {
		for (const hit of customHits.slice(0, 5)) lines.push(`- ${require_ansi.sanitizeForLog(hit.scopePath)}.safeBins entry '${require_ansi.sanitizeForLog(hit.bin)}' is missing safeBinProfiles.${require_ansi.sanitizeForLog(hit.bin)}.`);
		if (customHits.length > 5) lines.push(`- ${customHits.length - 5} more custom safeBins entries are missing profiles.`);
	}
	if (riskyHits.length > 0) {
		for (const hit of riskyHits.slice(0, 5)) lines.push(`- ${require_ansi.sanitizeForLog(hit.scopePath)}.safeBins includes '${require_ansi.sanitizeForLog(hit.bin)}': ${require_ansi.sanitizeForLog(hit.warning ?? "prefer explicit allowlist entries or approval-gated runs.")}`);
		if (riskyHits.length > 5) lines.push(`- ${riskyHits.length - 5} more safeBins entries should not use the low-risk safeBins fast path.`);
	}
	if (customHits.length > 0) lines.push(`- Run "${params.doctorFixCommand}" to scaffold missing custom safeBinProfiles entries.`);
	return lines;
}
/** Format doctor warnings for safeBins resolved outside trusted directories. */
function collectExecSafeBinTrustedDirHintWarnings(hits) {
	if (hits.length === 0) return [];
	const lines = hits.slice(0, 5).map((hit) => `- ${require_ansi.sanitizeForLog(hit.scopePath)}.safeBins entry '${require_ansi.sanitizeForLog(hit.bin)}' resolves to '${require_ansi.sanitizeForLog(hit.resolvedPath)}' outside trusted safe-bin dirs.`);
	if (hits.length > 5) lines.push(`- ${hits.length - 5} more safeBins entries resolve outside trusted safe-bin dirs.`);
	lines.push("- If intentional, add the binary directory to tools.exec.safeBinTrustedDirs (global or agent scope).");
	return lines;
}
/** Scaffold missing custom safeBin profiles and warn on interpreter/risky entries. */
function maybeRepairExecSafeBinProfiles(cfg) {
	const next = structuredClone(cfg);
	const changes = [];
	const warnings = [];
	for (const scope of collectExecSafeBinScopes(next)) {
		const interpreterBins = new Set(require_exec_safe_bin_runtime_policy.listInterpreterLikeSafeBins(scope.safeBins));
		const riskyHits = require_exec_safe_bin_trust.listRiskyConfiguredSafeBins(scope.safeBins);
		const riskyBins = new Set(riskyHits.map((hit) => hit.bin));
		for (const hit of riskyHits) warnings.push(`- ${scope.scopePath}.safeBins includes '${hit.bin}': ${hit.warning}`);
		const missingBins = scope.safeBins.filter((bin) => !scope.mergedProfiles[bin] && !riskyBins.has(require_exec_safe_bin_trust.normalizeSafeBinName(bin)));
		if (missingBins.length === 0) continue;
		const profileHolder = require_object.asObjectRecord(scope.exec.safeBinProfiles) ?? (scope.exec.safeBinProfiles = {});
		for (const bin of missingBins) {
			if (interpreterBins.has(bin)) {
				warnings.push(`- ${scope.scopePath}.safeBins includes interpreter/runtime '${bin}' without profile; remove it from safeBins or use explicit allowlist entries.`);
				continue;
			}
			if (profileHolder[bin] !== void 0) continue;
			profileHolder[bin] = {};
			changes.push(`- ${scope.scopePath}.safeBinProfiles.${bin}: added scaffold profile {} (review and tighten flags/positionals).`);
		}
	}
	if (changes.length === 0 && warnings.length === 0) return {
		config: cfg,
		changes: [],
		warnings: []
	};
	return {
		config: next,
		changes,
		warnings
	};
}
//#endregion
exports.collectExecSafeBinCoverageWarnings = collectExecSafeBinCoverageWarnings;
exports.collectExecSafeBinTrustedDirHintWarnings = collectExecSafeBinTrustedDirHintWarnings;
exports.maybeRepairExecSafeBinProfiles = maybeRepairExecSafeBinProfiles;
exports.scanExecSafeBinCoverage = scanExecSafeBinCoverage;
exports.scanExecSafeBinTrustedDirHints = scanExecSafeBinTrustedDirHints;
