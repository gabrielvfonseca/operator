const require_tailnet = require("./tailnet-DcuaBh4d.cjs");
const require_net = require("./net-CakPoh2E.cjs");
//#region src/infra/network-discovery-display.ts
function summarizeDisplayNetworkError(error) {
	if (error instanceof Error) {
		const message = error.message.trim();
		if (message) return message;
	}
	return "network interface discovery failed";
}
function fallbackBindHostForDisplay(bindMode, customBindHost) {
	if (bindMode === "lan") return "0.0.0.0";
	if (bindMode === "custom") return customBindHost?.trim() || "0.0.0.0";
	return "127.0.0.1";
}
/** Return a LAN IPv4 for display, or undefined when interface discovery fails. */
function pickBestEffortPrimaryLanIPv4() {
	try {
		return require_net.pickPrimaryLanIPv4();
	} catch {
		return;
	}
}
/** Return a tailnet IPv4 plus an optional warning suitable for user output. */
function inspectBestEffortPrimaryTailnetIPv4(params) {
	try {
		return { tailnetIPv4: require_tailnet.pickPrimaryTailnetIPv4() };
	} catch (error) {
		const prefix = params?.warningPrefix?.trim();
		const warning = prefix ? `${prefix}: ${summarizeDisplayNetworkError(error)}.` : void 0;
		return {
			tailnetIPv4: void 0,
			...warning ? { warning } : {}
		};
	}
}
/** Resolve the gateway bind host for display, falling back to a safe placeholder. */
async function resolveBestEffortGatewayBindHostForDisplay(params) {
	try {
		return { bindHost: await require_net.resolveGatewayBindHost(params.bindMode, params.customBindHost) };
	} catch (error) {
		const prefix = params.warningPrefix?.trim();
		const warning = prefix ? `${prefix}: ${summarizeDisplayNetworkError(error)}.` : void 0;
		return {
			bindHost: fallbackBindHostForDisplay(params.bindMode, params.customBindHost),
			...warning ? { warning } : {}
		};
	}
}
//#endregion
Object.defineProperty(exports, "inspectBestEffortPrimaryTailnetIPv4", {
	enumerable: true,
	get: function() {
		return inspectBestEffortPrimaryTailnetIPv4;
	}
});
Object.defineProperty(exports, "pickBestEffortPrimaryLanIPv4", {
	enumerable: true,
	get: function() {
		return pickBestEffortPrimaryLanIPv4;
	}
});
Object.defineProperty(exports, "resolveBestEffortGatewayBindHostForDisplay", {
	enumerable: true,
	get: function() {
		return resolveBestEffortGatewayBindHostForDisplay;
	}
});
