const require_node_resolve = require("./node-resolve-dj6ciCKA.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/shared/node-list-parse.ts
function normalizePendingRequest(row) {
	const requestId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.requestId);
	const nodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.nodeId);
	if (requestId === void 0 || nodeId === void 0) return null;
	return {
		...row,
		requestId,
		nodeId,
		displayName: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.displayName),
		platform: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.platform),
		version: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.version),
		coreVersion: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.coreVersion),
		uiVersion: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.uiVersion),
		remoteIp: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.remoteIp)
	};
}
function normalizePairedNode(row) {
	const nodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.nodeId);
	if (nodeId === void 0) return null;
	return {
		...row,
		nodeId,
		displayName: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.displayName),
		platform: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.platform),
		version: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.version),
		coreVersion: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.coreVersion),
		uiVersion: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.uiVersion),
		remoteIp: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.remoteIp),
		lastSeenReason: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(row.lastSeenReason)
	};
}
/** Extracts pending and paired node arrays from permissive node.pair.list payloads. */
function parsePairingList(value) {
	const obj = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(value);
	return {
		pending: Array.isArray(obj.pending) ? obj.pending.map(normalizePendingRequest).filter((row) => row !== null) : [],
		paired: Array.isArray(obj.paired) ? obj.paired.map(normalizePairedNode).filter((row) => row !== null) : []
	};
}
/** Extracts the nodes array from a node.list response, treating malformed payloads as empty. */
function parseNodeList(value) {
	const obj = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(value);
	return Array.isArray(obj.nodes) ? obj.nodes : [];
}
//#endregion
//#region src/agents/tools/nodes-utils.ts
/**
* Nodes lookup helpers.
*
* Loads paired nodes from Gateway and resolves requested/default nodes with legacy pair-list fallback.
*/
function messageFromError(error) {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") return error.message;
	if (typeof error === "object" && error !== null) try {
		return JSON.stringify(error);
	} catch {
		return "";
	}
	return "";
}
function shouldFallbackToPairList(error) {
	const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(messageFromError(error)) ?? "";
	if (!message.includes("node.list")) return false;
	return message.includes("unknown method") || message.includes("method not found") || message.includes("not implemented") || message.includes("unsupported");
}
async function loadNodes(opts, signal) {
	try {
		return parseNodeList(await require_gateway.callGatewayTool("node.list", opts, {}, { signal }));
	} catch (error) {
		if (!shouldFallbackToPairList(error)) throw error;
		const { paired } = parsePairingList(await require_gateway.callGatewayTool("node.pair.list", opts, {}, { signal }));
		return paired.map((n) => ({
			nodeId: n.nodeId,
			displayName: n.displayName,
			platform: n.platform,
			remoteIp: n.remoteIp
		}));
	}
}
function isLocalMacNode(node) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(node.platform)?.startsWith("mac") === true && typeof node.nodeId === "string" && node.nodeId.startsWith("mac-");
}
function compareDefaultNodeOrder(a, b) {
	const aConnectedAt = Number.isFinite(a.connectedAtMs) ? a.connectedAtMs ?? 0 : -1;
	const bConnectedAt = Number.isFinite(b.connectedAtMs) ? b.connectedAtMs ?? 0 : -1;
	if (aConnectedAt !== bConnectedAt) return bConnectedAt - aConnectedAt;
	return a.nodeId.localeCompare(b.nodeId);
}
/** Selects the implicit node target when a tool call omits an explicit node query. */
function selectDefaultNodeFromList(nodes, options = {}) {
	const capability = options.capability?.trim();
	const withCapability = capability ? nodes.filter((n) => Array.isArray(n.caps) ? n.caps.includes(capability) : true) : nodes;
	if (withCapability.length === 0) return null;
	const connected = withCapability.filter((n) => n.connected);
	const candidates = connected.length > 0 ? connected : withCapability;
	if (candidates.length === 1) return candidates.at(0) ?? null;
	if (options.preferLocalMac ?? true) {
		const local = candidates.filter(isLocalMacNode);
		if (local.length === 1) return local.at(0) ?? null;
	}
	if ((options.fallback ?? "none") === "none") return null;
	return [...candidates].toSorted(compareDefaultNodeOrder)[0] ?? null;
}
function pickDefaultNode(nodes) {
	return selectDefaultNodeFromList(nodes, {
		capability: "canvas",
		fallback: "first",
		preferLocalMac: true
	});
}
/** Lists Gateway nodes, falling back to paired-node records for older Gateway versions. */
async function listNodes(opts, signal) {
	return loadNodes(opts, signal);
}
/** Resolves a node id from an already-loaded node list using shared node matching rules. */
function resolveNodeIdFromList(nodes, query, allowDefault = false, options = {}) {
	return require_node_resolve.resolveNodeIdFromNodeList(nodes, query, {
		allowDefault,
		allowCompactDisplayName: options.allowCompactDisplayName,
		pickDefaultNode
	});
}
/** Loads nodes from the Gateway and resolves the requested or default node id. */
async function resolveNodeId(opts, query, allowDefault = false) {
	return (await resolveNode(opts, query, allowDefault)).nodeId;
}
/** Loads nodes from the Gateway and returns the requested or default node record. */
async function resolveNode(opts, query, allowDefault = false) {
	return require_node_resolve.resolveNodeFromNodeList(await loadNodes(opts), query, {
		allowDefault,
		pickDefaultNode
	});
}
//#endregion
Object.defineProperty(exports, "listNodes", {
	enumerable: true,
	get: function() {
		return listNodes;
	}
});
Object.defineProperty(exports, "resolveNode", {
	enumerable: true,
	get: function() {
		return resolveNode;
	}
});
Object.defineProperty(exports, "resolveNodeId", {
	enumerable: true,
	get: function() {
		return resolveNodeId;
	}
});
Object.defineProperty(exports, "resolveNodeIdFromList", {
	enumerable: true,
	get: function() {
		return resolveNodeIdFromList;
	}
});
