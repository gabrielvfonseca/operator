const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_filter = require("./agent-filter-D9eRLjzT.cjs");
const require_stable_stringify = require("./stable-stringify-WjfDEBwS.cjs");
const require_workspace = require("./workspace-BaJ9ukou.cjs");
const require_plugin_skills = require("./plugin-skills-ajAxY2PH.cjs");
const require_redact_snapshot = require("./redact-snapshot-CmW094US.cjs");
const require_refresh = require("./refresh-x6Fok_sy.cjs");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/skills/runtime/snapshot-hydration.ts
function hydrateResolvedSkills(snapshot, rebuild) {
	if (snapshot.resolvedSkills !== void 0) return snapshot;
	return {
		...snapshot,
		resolvedSkills: rebuild().resolvedSkills
	};
}
//#endregion
//#region src/skills/runtime/session-snapshot.ts
const resolvedSkillsCache = /* @__PURE__ */ new Map();
const RESOLVED_SKILLS_CACHE_MAX = 10;
function fingerprintSkillSnapshotConfig(config) {
	return node_crypto.default.createHash("sha256").update(require_stable_stringify.stableStringify(require_redact_snapshot.redactConfigObject(config))).digest("hex");
}
function cacheResolvedSkills(cacheKey, snapshot) {
	resolvedSkillsCache.set(cacheKey, snapshot.resolvedSkills);
	if (resolvedSkillsCache.size > RESOLVED_SKILLS_CACHE_MAX) {
		const oldest = resolvedSkillsCache.keys().next().value;
		if (oldest !== void 0) resolvedSkillsCache.delete(oldest);
	}
	return snapshot;
}
function resolveReusableWorkspaceSkillSnapshot(params) {
	if (params.watch !== false) require_refresh.ensureSkillsWatcher({
		workspaceDir: params.workspaceDir,
		config: params.config
	});
	const snapshotVersion = params.snapshotVersion ?? require_plugin_skills.getSkillsSnapshotVersion(params.workspaceDir);
	const promptFormatChanged = params.existingSnapshot?.promptFormatVersion !== 2;
	const skillVersionChanged = require_plugin_skills.shouldRefreshSnapshotForVersion(params.existingSnapshot?.version, snapshotVersion);
	const nodeSkillsEligibilityChanged = require_stable_stringify.stableStringify(params.existingSnapshot?.nodeSkillsEligibility) !== require_stable_stringify.stableStringify(params.eligibility?.nodeSkills);
	const shouldRefresh = promptFormatChanged || skillVersionChanged || nodeSkillsEligibilityChanged || !require_agent_filter.matchesSkillFilter(params.existingSnapshot?.skillFilter, params.skillFilter);
	const buildSnapshot = () => {
		return require_workspace.buildWorkspaceSkillSnapshot(params.workspaceDir, {
			config: params.config,
			agentId: params.agentId,
			skillFilter: params.skillFilter,
			eligibility: params.eligibility,
			snapshotVersion
		});
	};
	const configFingerprint = fingerprintSkillSnapshotConfig(params.config);
	const snapshotCacheKey = JSON.stringify([
		params.workspaceDir,
		snapshotVersion,
		params.skillFilter,
		params.agentId,
		params.eligibility,
		configFingerprint
	]);
	const cachedRebuild = () => {
		if (resolvedSkillsCache.has(snapshotCacheKey)) return { resolvedSkills: resolvedSkillsCache.get(snapshotCacheKey) };
		return cacheResolvedSkills(snapshotCacheKey, buildSnapshot());
	};
	return {
		snapshot: !params.existingSnapshot || shouldRefresh ? cacheResolvedSkills(snapshotCacheKey, buildSnapshot()) : params.hydrateExisting === false ? params.existingSnapshot : hydrateResolvedSkills(params.existingSnapshot, cachedRebuild),
		shouldRefresh,
		snapshotVersion
	};
}
//#endregion
Object.defineProperty(exports, "resolveReusableWorkspaceSkillSnapshot", {
	enumerable: true,
	get: function() {
		return resolveReusableWorkspaceSkillSnapshot;
	}
});
