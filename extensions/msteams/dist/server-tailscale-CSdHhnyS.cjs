require("./rolldown-runtime-u92d-OFm.cjs");
const require_tailscale_status = require("./tailscale-status-DgagbaYD.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_tailscale = require("./tailscale-ViriHRUQ.cjs");
//#region src/gateway/server-tailscale.ts
async function startGatewayTailscaleExposure(params) {
	if (params.tailscaleMode === "off") return null;
	const serviceName = params.tailscaleMode === "serve" ? params.serviceName?.trim() || void 0 : void 0;
	try {
		if (params.tailscaleMode === "serve") {
			if (params.preserveFunnel === true) {
				if (await require_tailscale.hasTailscaleFunnelRouteForPort(params.port)) {
					const resetSuffix = params.resetOnExit ? "; resetOnExit is a no-op because no Serve route was applied this run" : "";
					params.logTailscale.info(`serve skipped: preserving externally configured Tailscale Funnel for port ${params.port}${resetSuffix}`);
					return null;
				}
			}
			if (serviceName) await require_tailscale.enableTailscaleServe(params.port, void 0, serviceName);
			else await require_tailscale.enableTailscaleServe(params.port);
		} else await require_tailscale.enableTailscaleFunnel(params.port);
		const host = await require_tailscale.getTailnetHostname().catch(() => null);
		if (host) {
			const uiPath = params.controlUiBasePath ? `${params.controlUiBasePath}/` : "/";
			const publicHost = require_tailscale_status.resolveTailscalePublishedHost({
				tailscaleMode: params.tailscaleMode,
				tailnetHost: host,
				serviceName
			});
			if (publicHost) {
				const serviceLabel = serviceName ? ` for ${serviceName}` : "";
				params.logTailscale.info(`${params.tailscaleMode} enabled${serviceLabel}: https://${publicHost}${uiPath} (WS via wss://${publicHost})`);
			} else params.logTailscale.info(`${params.tailscaleMode} enabled`);
		} else params.logTailscale.info(`${params.tailscaleMode} enabled`);
	} catch (err) {
		params.logTailscale.warn(`${params.tailscaleMode} failed: ${require_errors.formatErrorMessage(err)}`);
	}
	if (!params.resetOnExit) return null;
	return async () => {
		try {
			if (params.tailscaleMode === "serve") if (serviceName) await require_tailscale.disableTailscaleServe(void 0, serviceName);
			else await require_tailscale.disableTailscaleServe();
			else await require_tailscale.disableTailscaleFunnel();
		} catch (err) {
			params.logTailscale.warn(`${params.tailscaleMode} cleanup failed: ${require_errors.formatErrorMessage(err)}`);
		}
	};
}
//#endregion
exports.startGatewayTailscaleExposure = startGatewayTailscaleExposure;
