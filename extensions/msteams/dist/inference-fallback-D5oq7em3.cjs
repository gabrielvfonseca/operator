require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
const require_inference_route = require("./inference-route-2IwhuIcI.cjs");
const require_setup_inference = require("./setup-inference-BpDIKr54.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/system-agent/inference-fallback.ts
const RETRYABLE_INFERENCE_STATUSES = /* @__PURE__ */ new Set([
	"auth",
	"rate_limit",
	"billing",
	"timeout",
	"unavailable"
]);
const CREDENTIAL_SCOPED_FAILURE_STATUSES = /* @__PURE__ */ new Set([
	"auth",
	"billing",
	"rate_limit"
]);
async function readCurrentConfig() {
	const { readConfigFileSnapshot } = await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports);
	const snapshot = await readConfigFileSnapshot();
	if (!snapshot.exists || !snapshot.valid) return {};
	return snapshot.runtimeConfig ?? snapshot.config;
}
/** Requester first. Other configured, authenticated providers: provider-id order. */
async function verifySystemAgentInferenceWithFallback(params) {
	const deps = params.deps ?? {};
	const config = await (deps.readConfig ?? readCurrentConfig)();
	const requestedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.requestingAgentId ?? require_agent_scope_config.resolveDefaultAgentId(config));
	const candidateAgentIds = [
		requestedAgentId,
		...(config.agents?.list ?? []).map((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id)),
		(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(config))
	];
	const resolveRoute = deps.resolveRoute ?? require_inference_route.resolveSystemAgentConfiguredRouteFromConfig;
	const routes = [];
	for (const agentId of candidateAgentIds) {
		const route = await resolveRoute(config, agentId);
		if (!route) continue;
		const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(route.provider);
		if (!provider) continue;
		routes.push({
			agentId,
			provider,
			route
		});
	}
	const first = routes.find((candidate) => candidate.agentId === requestedAgentId);
	const ordered = [...first ? [first] : [], ...routes.filter((candidate) => candidate !== first).toSorted((left, right) => left.provider.localeCompare(right.provider) || left.agentId.localeCompare(right.agentId))];
	const hasAuth = deps.hasAuth ?? require_model_auth.hasAvailableAuthForProvider;
	const verify = deps.verify ?? require_setup_inference.verifySetupInference;
	let lastFailure;
	const failedProviders = /* @__PURE__ */ new Set();
	const attemptedOwners = /* @__PURE__ */ new Set();
	for (const candidate of ordered) {
		if (failedProviders.has(candidate.provider)) continue;
		const ownerKey = JSON.stringify([
			candidate.provider,
			candidate.route.authProfileId ?? null,
			candidate.route.agentDir ?? null
		]);
		if (attemptedOwners.has(ownerKey)) continue;
		if (candidate !== first && !await hasAuth({
			provider: candidate.provider,
			cfg: config,
			preferredProfile: candidate.route.authProfileId,
			agentDir: candidate.route.agentDir,
			modelId: candidate.route.model
		})) continue;
		attemptedOwners.add(ownerKey);
		const result = await verify({
			runtime: params.runtime,
			bindSession: true,
			agentId: candidate.agentId
		});
		if (result.ok) return result;
		lastFailure = result;
		if (!RETRYABLE_INFERENCE_STATUSES.has(result.status)) return result;
		if (!CREDENTIAL_SCOPED_FAILURE_STATUSES.has(result.status)) failedProviders.add(candidate.provider);
	}
	return lastFailure ?? {
		ok: false,
		status: "unavailable",
		error: "No configured authenticated inference provider is available."
	};
}
//#endregion
exports.verifySystemAgentInferenceWithFallback = verifySystemAgentInferenceWithFallback;
