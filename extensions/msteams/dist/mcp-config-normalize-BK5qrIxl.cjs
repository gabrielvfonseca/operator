require("./utils-CXqBhRFw.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/config/mcp-config-normalize.ts
const CLI_MCP_TYPE_TO_OPERATOR_TRANSPORT = {
	http: "streamable-http",
	"streamable-http": "streamable-http",
	sse: "sse",
	stdio: "stdio"
};
function normalizeMcpString(value) {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}
/** Maps CLI-native MCP type aliases to Operator HTTP transport names. */
function resolveOperatorMcpTransportAlias(value) {
	const mapped = CLI_MCP_TYPE_TO_OPERATOR_TRANSPORT[normalizeMcpString(value)];
	return mapped === "sse" || mapped === "streamable-http" ? mapped : void 0;
}
/** Checks whether a raw MCP `type` value is a legacy CLI alias Operator can rewrite. */
function isKnownCliMcpTypeAlias(value) {
	return Object.hasOwn(CLI_MCP_TYPE_TO_OPERATOR_TRANSPORT, normalizeMcpString(value));
}
/**
* Converts operator-friendly MCP server aliases into canonical config keys.
*
* Existing canonical fields win over legacy snake_case or `type` aliases so
* repeated configure commands cannot overwrite already-normalized choices.
*/
function canonicalizeConfiguredMcpServer(server) {
	const next = { ...server };
	const transportAlias = resolveOperatorMcpTransportAlias(next.type);
	if (typeof next.transport !== "string" && transportAlias) next.transport = transportAlias;
	if (isKnownCliMcpTypeAlias(next.type)) delete next.type;
	if (typeof next.connect_timeout === "number" && typeof next.connectTimeout !== "number") {
		next.connectTimeout = next.connect_timeout;
		delete next.connect_timeout;
	}
	if (typeof next.supports_parallel_tool_calls === "boolean" && typeof next.supportsParallelToolCalls !== "boolean") {
		next.supportsParallelToolCalls = next.supports_parallel_tool_calls;
		delete next.supports_parallel_tool_calls;
	}
	if (typeof next.ssl_verify === "boolean" && typeof next.sslVerify !== "boolean") {
		next.sslVerify = next.ssl_verify;
		delete next.ssl_verify;
	}
	if (typeof next.client_cert === "string" && typeof next.clientCert !== "string") {
		next.clientCert = next.client_cert;
		delete next.client_cert;
	}
	if (typeof next.client_key === "string" && typeof next.clientKey !== "string") {
		next.clientKey = next.client_key;
		delete next.client_key;
	}
	return next;
}
/** Returns a cloned map of object-shaped MCP server configs, dropping invalid entries. */
function normalizeConfiguredMcpServers(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return {};
	return Object.fromEntries(Object.entries(value).filter(([, server]) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(server)).map(([name, server]) => [name, { ...server }]));
}
//#endregion
Object.defineProperty(exports, "canonicalizeConfiguredMcpServer", {
	enumerable: true,
	get: function() {
		return canonicalizeConfiguredMcpServer;
	}
});
Object.defineProperty(exports, "isKnownCliMcpTypeAlias", {
	enumerable: true,
	get: function() {
		return isKnownCliMcpTypeAlias;
	}
});
Object.defineProperty(exports, "normalizeConfiguredMcpServers", {
	enumerable: true,
	get: function() {
		return normalizeConfiguredMcpServers;
	}
});
Object.defineProperty(exports, "resolveOperatorMcpTransportAlias", {
	enumerable: true,
	get: function() {
		return resolveOperatorMcpTransportAlias;
	}
});
