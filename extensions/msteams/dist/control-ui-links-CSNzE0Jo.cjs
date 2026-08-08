const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_net = require("./net-CakPoh2E.cjs");
const require_advertised_lan_host = require("./advertised-lan-host-CqXdPyiB.cjs");
const require_network_discovery_display = require("./network-discovery-display-CrYyDxeY.cjs");
const require_control_ui_shared = require("./control-ui-shared-ggCalNPl.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/control-ui-links.ts
var control_ui_links_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolveAdvertisedControlUiLinks: () => resolveAdvertisedControlUiLinks,
	resolveControlUiLinks: () => resolveControlUiLinks,
	resolveLocalControlUiProbeLinks: () => resolveLocalControlUiProbeLinks
});
/** Resolve the advertised HTTP and websocket URLs for the Control UI. */
function resolveControlUiLinks(params) {
	const port = params.port;
	const bind = params.bind ?? "loopback";
	const customBindHost = params.customBindHost?.trim();
	const advertisedLanHost = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.advertisedLanHost);
	const { tailnetIPv4 } = require_network_discovery_display.inspectBestEffortPrimaryTailnetIPv4();
	const host = (() => {
		if (bind === "custom" && customBindHost && require_net.isValidIPv4(customBindHost)) return customBindHost;
		if (bind === "tailnet" && tailnetIPv4) return tailnetIPv4 ?? "127.0.0.1";
		if (bind === "lan") return advertisedLanHost ?? require_network_discovery_display.pickBestEffortPrimaryLanIPv4() ?? "127.0.0.1";
		return "127.0.0.1";
	})();
	const basePath = require_control_ui_shared.normalizeControlUiBasePath(params.basePath);
	const uiPath = basePath ? `${basePath}/` : "/";
	const wsPath = basePath ? basePath : "";
	const httpScheme = params.tlsEnabled === true ? "https" : "http";
	const wsScheme = params.tlsEnabled === true ? "wss" : "ws";
	return {
		httpUrl: `${httpScheme}://${host}:${port}${uiPath}`,
		wsUrl: `${wsScheme}://${host}:${port}${wsPath}`
	};
}
/** Resolve Control UI URLs meant for display to nearby devices. */
async function resolveAdvertisedControlUiLinks(params) {
	const advertisedLanHost = params.bind === "lan" ? await require_advertised_lan_host.resolveAdvertisedLanHost().catch(() => null) : null;
	return resolveControlUiLinks({
		...params,
		advertisedLanHost
	});
}
/** Resolve Control UI URLs for co-located readiness probes and health checks. */
function resolveLocalControlUiProbeLinks(params) {
	return resolveControlUiLinks({
		...params,
		bind: params.bind === "lan" ? "loopback" : params.bind
	});
}
//#endregion
Object.defineProperty(exports, "control_ui_links_exports", {
	enumerable: true,
	get: function() {
		return control_ui_links_exports;
	}
});
Object.defineProperty(exports, "resolveAdvertisedControlUiLinks", {
	enumerable: true,
	get: function() {
		return resolveAdvertisedControlUiLinks;
	}
});
Object.defineProperty(exports, "resolveControlUiLinks", {
	enumerable: true,
	get: function() {
		return resolveControlUiLinks;
	}
});
Object.defineProperty(exports, "resolveLocalControlUiProbeLinks", {
	enumerable: true,
	get: function() {
		return resolveLocalControlUiProbeLinks;
	}
});
