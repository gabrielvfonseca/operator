require("./rolldown-runtime-u92d-OFm.cjs");
const require_probe_target = require("./probe-target-COL7xGKv.cjs");
const require_probe_auth = require("./probe-auth-bAQnhTXC.cjs");
//#region src/commands/status.gateway-probe.ts
/** Resolves gateway probe auth plus any non-secret warning about credential lookup. */
async function resolveGatewayProbeAuthResolution(cfg) {
	return require_probe_auth.resolveGatewayProbeAuthSafeWithSecretInputs({
		cfg,
		mode: require_probe_target.resolveGatewayProbeTarget(cfg).mode,
		env: process.env
	});
}
//#endregion
exports.resolveGatewayProbeAuthResolution = resolveGatewayProbeAuthResolution;
