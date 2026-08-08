const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_codex_route_model_ref = require("./codex-route-model-ref-CKO9Qire.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/doctor/cron/runtime-policy-migration.ts
var runtime_policy_migration_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	planCronCodexRefRewriteAgainstPersistedConfig: () => planCronCodexRefRewriteAgainstPersistedConfig,
	repairCronCodexRuntimePolicies: () => repairCronCodexRuntimePolicies
});
function ensureRecord(container, key) {
	const existing = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(container[key]);
	if (existing) return existing;
	const created = {};
	container[key] = created;
	return created;
}
function resolvePolicyOwner(params) {
	const root = params.cfg;
	const agents = ensureRecord(root, "agents");
	const requestedAgentId = params.target.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.target.agentId) : void 0;
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(params.cfg);
	const effectiveAgentId = requestedAgentId ?? defaultAgentId;
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)((Array.isArray(agents.list) ? agents.list : []).find((entry) => {
		const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(entry);
		return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(typeof record?.id === "string" ? record.id : "") === effectiveAgentId;
	}));
	if (record) return {
		owner: record,
		path: `agents.list.${effectiveAgentId}`
	};
	return !requestedAgentId || requestedAgentId === defaultAgentId ? {
		owner: ensureRecord(agents, "defaults"),
		path: "agents.defaults"
	} : void 0;
}
/** Install model-scoped Codex runtime intent for canonical refs migrated out of cron payloads. */
function repairCronCodexRuntimePolicies(params) {
	if (params.targets.length === 0) return {
		config: params.cfg,
		changes: [],
		warnings: [],
		blockedTargets: [],
		changedTargets: []
	};
	const next = structuredClone(params.cfg);
	const changes = [];
	const warnings = [];
	const blockedTargets = [];
	const changedTargets = [];
	const decisions = /* @__PURE__ */ new Map();
	for (const target of params.targets) {
		if (require_codex_route_model_ref.isBlockedLegacyCodexModelRef({
			modelRef: target.legacyModelRef ?? target.modelRef,
			blockedModelIdentities: params.blockedModelIdentities
		})) {
			blockedTargets.push(target);
			continue;
		}
		const owner = resolvePolicyOwner({
			cfg: next,
			target
		});
		const targetLabel = target.agentId ? `agent ${target.agentId}` : "the default agent";
		if (!owner) {
			blockedTargets.push(target);
			warnings.push(`Cron model ${target.modelRef} was migrated to openai/*, but ${targetLabel} has no configured agent entry; set its model-scoped agentRuntime.id to "codex" manually.`);
			continue;
		}
		const key = `${owner.path}\u0000${target.modelRef}`;
		const priorDecision = decisions.get(key);
		if (priorDecision) {
			if (priorDecision === "blocked") blockedTargets.push(target);
			else if (priorDecision === "changed") changedTargets.push(target);
			continue;
		}
		const modelEntry = ensureRecord(ensureRecord(owner.owner, "models"), target.modelRef);
		const priorRuntime = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(modelEntry.agentRuntime);
		const priorRuntimeId = require_codex_route_model_ref.normalizeRuntimeString(priorRuntime?.id);
		if (priorRuntimeId && priorRuntimeId !== "codex" && priorRuntimeId !== "auto") {
			decisions.set(key, "blocked");
			blockedTargets.push(target);
			warnings.push(`Retained ${owner.path}.models.${target.modelRef}.agentRuntime.id="${priorRuntimeId}": it conflicts with migrated cron Codex runtime intent; repair the cron model or runtime policy manually.`);
			continue;
		}
		if (priorRuntimeId === "codex") {
			decisions.set(key, "noop");
			continue;
		}
		decisions.set(key, "changed");
		modelEntry.agentRuntime = {
			...priorRuntime,
			id: "codex"
		};
		changedTargets.push(target);
		changes.push(`Set ${owner.path}.models.${target.modelRef}.agentRuntime.id to "codex" for migrated cron runtime intent.`);
	}
	return {
		config: changes.length > 0 ? next : params.cfg,
		changes,
		warnings,
		blockedTargets,
		changedTargets
	};
}
/** Restrict a post-config-write cron rewrite to runtime policies already on disk. */
function planCronCodexRefRewriteAgainstPersistedConfig(params) {
	const policyPlan = repairCronCodexRuntimePolicies(params);
	return {
		warnings: [...policyPlan.warnings, ...policyPlan.changedTargets.map((target) => `Retained the legacy cron route for ${target.modelRef} because its model-scoped agentRuntime.id="codex" policy is not present in persisted config; rerun doctor --fix.`)],
		blockedTargets: [...policyPlan.blockedTargets, ...policyPlan.changedTargets]
	};
}
//#endregion
Object.defineProperty(exports, "planCronCodexRefRewriteAgainstPersistedConfig", {
	enumerable: true,
	get: function() {
		return planCronCodexRefRewriteAgainstPersistedConfig;
	}
});
Object.defineProperty(exports, "runtime_policy_migration_exports", {
	enumerable: true,
	get: function() {
		return runtime_policy_migration_exports;
	}
});
