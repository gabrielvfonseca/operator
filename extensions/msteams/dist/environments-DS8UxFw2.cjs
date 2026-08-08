require("./rolldown-runtime-u92d-OFm.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_device_pairing = require("./device-pairing-DpNh5_Ue.cjs");
const require_node_pairing = require("./node-pairing-B0aSCGFJ.cjs");
const require_node_catalog = require("./node-catalog-BavRyR-l.cjs");
const require_nodes_helpers = require("./nodes.helpers-SXr8Ur2w.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/gateway/server-methods/environments.ts
const GATEWAY_ENVIRONMENT = {
	id: "gateway",
	type: "local",
	label: "Gateway local",
	status: "available",
	capabilities: [
		"agent.run",
		"sessions",
		"tools",
		"workspace"
	]
};
const WORKER_STATUS = {
	requested: "starting",
	provisioning: "starting",
	bootstrapping: "starting",
	ready: "available",
	attached: "available",
	idle: "available",
	draining: "stopping",
	destroying: "stopping",
	destroyed: "unavailable",
	failed: "error",
	orphaned: "error"
};
function uniqueSortedStrings(...items) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueTrimmedStringList)(items.flatMap((item) => item ?? []));
}
function rejectInvalid(respond, method, validator) {
	return require_nodes_helpers.respondInvalidParams({
		respond,
		method,
		validator
	});
}
function summarizeNodeEnvironment(node) {
	const capabilities = uniqueSortedStrings(node.caps, node.commands);
	return {
		id: `node:${node.nodeId}`,
		type: "node",
		label: node.displayName ?? node.nodeId,
		status: node.connected ? "available" : "unavailable",
		...capabilities.length > 0 ? { capabilities } : {}
	};
}
/** Projects a durable worker row without exposing its SSH credential reference. */
function summarizeWorkerEnvironment(record, now = Date.now()) {
	return {
		id: record.environmentId,
		type: "worker",
		status: WORKER_STATUS[record.state],
		worker: {
			providerId: record.providerId,
			...record.leaseId ? { leaseId: record.leaseId } : {},
			state: record.state,
			ageMs: Math.max(0, Math.trunc(now - record.createdAtMs)),
			...record.state === "idle" && record.idleSinceAtMs !== null ? { idleMs: Math.max(0, Math.trunc(now - record.idleSinceAtMs)) } : {},
			attachedSessionIds: uniqueSortedStrings(record.attachedSessionIds),
			tunnelStatus: record.tunnelStatus
		}
	};
}
async function listEnvironments(context) {
	const [devices, nodes] = await Promise.all([require_device_pairing.listDevicePairing(), require_node_pairing.listNodePairing()]);
	const catalog = require_node_catalog.createKnownNodeCatalog({
		pairedDevices: devices.paired,
		pairedNodes: nodes.paired,
		connectedNodes: context.nodeRegistry.listConnected()
	});
	return [GATEWAY_ENVIRONMENT, ...require_node_catalog.listKnownNodes(catalog).map(summarizeNodeEnvironment)];
}
function listWorkerEnvironments(context) {
	try {
		return context.workerEnvironmentService?.list() ?? [];
	} catch {
		return [];
	}
}
function listWorkerProfiles(context) {
	if (!context.workerEnvironmentService || !context.workerPlacementDispatchService) return [];
	const profiles = context.getRuntimeConfig().cloudWorkers?.profiles ?? {};
	return Object.entries(profiles).flatMap(([id, profile]) => {
		const providerId = typeof profile.provider === "string" ? profile.provider.trim() : "";
		return id.trim() && providerId ? [{
			id: id.trim(),
			providerId
		}] : [];
	}).toSorted((left, right) => left.id.localeCompare(right.id));
}
async function respondWorkerMutation(respond, run, invalidCodes, unavailableMessage) {
	try {
		respond(true, summarizeWorkerEnvironment(await run()), void 0);
	} catch (error) {
		const code = error && typeof error === "object" && "code" in error ? error.code : void 0;
		const invalid = typeof code === "string" && invalidCodes.includes(code);
		const message = invalid && error instanceof Error ? error.message : unavailableMessage;
		respond(false, void 0, require_error_codes.errorShape(invalid ? require_error_codes.ErrorCodes.INVALID_REQUEST : require_error_codes.ErrorCodes.UNAVAILABLE, message));
	}
}
const environmentsHandlers = {
	"environments.list": async ({ params, respond, context }) => {
		if (!require_src.validateEnvironmentsListParams(params)) return rejectInvalid(respond, "environments.list", require_src.validateEnvironmentsListParams);
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const environments = await listEnvironments(context);
			const workers = listWorkerEnvironments(context);
			const summarizedAtMs = Date.now();
			environments.push(...workers.map((record) => summarizeWorkerEnvironment(record, summarizedAtMs)));
			const profiles = listWorkerProfiles(context);
			respond(true, {
				environments,
				...profiles.length > 0 ? { profiles } : {}
			}, void 0);
		});
	},
	"environments.status": async ({ params, respond, context }) => {
		if (!require_src.validateEnvironmentsStatusParams(params)) return rejectInvalid(respond, "environments.status", require_src.validateEnvironmentsStatusParams);
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const environment = (await listEnvironments(context)).find((entry) => entry.id === params.environmentId);
			if (environment) {
				respond(true, environment, void 0);
				return;
			}
			let worker;
			try {
				worker = context.workerEnvironmentService?.get(params.environmentId);
			} catch {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "environment status unavailable"));
				return;
			}
			respond(Boolean(worker), worker ? summarizeWorkerEnvironment(worker) : void 0, worker ? void 0 : require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown environmentId"));
		});
	},
	"environments.create": async ({ params, respond, context }) => {
		if (!require_src.validateEnvironmentsCreateParams(params)) return rejectInvalid(respond, "environments.create", require_src.validateEnvironmentsCreateParams);
		const service = context.workerEnvironmentService;
		if (!service) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "cloud worker environments are not configured"));
			return;
		}
		await respondWorkerMutation(respond, () => service.create(params.profileId, params.idempotencyKey), ["profile_not_found", "invalid_profile"], "worker environment creation failed");
	},
	"environments.destroy": async ({ params, respond, context }) => {
		if (!require_src.validateEnvironmentsDestroyParams(params)) return rejectInvalid(respond, "environments.destroy", require_src.validateEnvironmentsDestroyParams);
		const service = context.workerEnvironmentService;
		if (!service) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown environmentId"));
			return;
		}
		await respondWorkerMutation(respond, async () => {
			const placementService = context.workerPlacementDispatchService;
			if (params.force && !placementService?.forceDestroyEnvironment) throw new Error("cloud worker placement control is unavailable");
			const destroyed = params.force ? await placementService.forceDestroyEnvironment(params.environmentId) : await service.destroyUnattached(params.environmentId);
			try {
				await context.workerPlacementDispatchService?.reconcileActive?.(params.environmentId);
			} catch (error) {
				context.logGateway.warn(`worker placement reconciliation after destroy failed: ${require_ws_log.formatForLog(error)}`);
			}
			return destroyed;
		}, ["environment_not_found", "invalid_state"], "worker environment destruction failed");
	}
};
//#endregion
exports.environmentsHandlers = environmentsHandlers;
exports.summarizeWorkerEnvironment = summarizeWorkerEnvironment;
