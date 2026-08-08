require("./rolldown-runtime-u92d-OFm.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_credentials = require("./credentials-CNHX5M4G.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_probe = require("./probe-ABDDskKE.cjs");
const require_health_format = require("./health-format-Cxf7oLqH.cjs");
const require_gateway_health_auth_diagnostic = require("./gateway-health-auth-diagnostic-DWXqAwbP.cjs");
const require_channels_status_issues = require("./channels-status-issues-hSu-Hv1-.cjs");
//#region src/commands/doctor-gateway-health.ts
/** Gateway health probes used by doctor before deeper daemon and memory diagnostics. */
function isGatewayCallTimeout(message) {
	return /^gateway timeout after \d+ms(?:\n|$)/.test(message);
}
function isGatewayHealthAuthUnavailableError(error) {
	return require_call.isGatewayCredentialsRequiredError(error) || require_credentials.isGatewaySecretRefUnavailableError(error);
}
function noteCliGatewayVersionSkew(status) {
	const gatewayVersion = status?.runtimeVersion?.trim();
	if (!gatewayVersion || gatewayVersion === require_version.VERSION) return;
	require_note.note([
		`This command is Operator ${require_version.VERSION}; the running Gateway is Operator ${gatewayVersion}.`,
		"Check `openclaw --version`, `which openclaw`, and `openclaw gateway status --deep`.",
		"If this mismatch is unexpected, update PATH so `openclaw` points to the version you want, or reinstall the Gateway service from that same Operator install."
	].join("\n"), "Operator version mismatch");
}
/**
* Probes gateway status and reports user-facing connection/auth/channel warnings.
*
* A credentials-required gateway still counts as healthy but unauthenticated when the preauth
* probe confirms the server is reachable.
*/
async function checkGatewayHealth(params) {
	const timeoutMs = typeof params.timeoutMs === "number" && params.timeoutMs > 0 ? params.timeoutMs : 1e4;
	let healthOk = false;
	let status;
	try {
		status = await require_call.callGateway({
			method: "status",
			params: { includeChannelSummary: false },
			timeoutMs,
			config: params.cfg
		});
		healthOk = true;
		noteCliGatewayVersionSkew(status);
		try {
			const issues = require_channels_status_issues.collectChannelStatusIssues(await require_call.callGateway({
				method: "channels.status",
				params: {
					probe: true,
					timeoutMs: 5e3
				},
				timeoutMs: 6e3
			}));
			if (issues.length > 0) require_note.note(issues.map((issue) => `- ${issue.channel} ${issue.accountId}: ${issue.message}${issue.fix ? ` (${issue.fix})` : ""}`).join("\n"), "Channel warnings");
		} catch {}
		return {
			healthOk,
			authenticated: true,
			status
		};
	} catch (err) {
		if (isGatewayHealthAuthUnavailableError(err)) {
			const probeDetails = await require_call.buildGatewayProbeConnectionDetails({ config: params.cfg });
			if (require_gateway_health_auth_diagnostic.gatewayProbeResultSawGateway(await require_probe.probeGatewayStatus({
				url: probeDetails.url,
				timeoutMs,
				tlsFingerprint: probeDetails.tlsFingerprint,
				preauthHandshakeTimeoutMs: probeDetails.preauthHandshakeTimeoutMs,
				config: params.cfg,
				json: true
			}))) {
				require_note.note(require_gateway_health_auth_diagnostic.GATEWAY_HEALTH_CREDENTIALS_REQUIRED_MESSAGE, require_gateway_health_auth_diagnostic.GATEWAY_HEALTH_CREDENTIALS_REQUIRED_TITLE);
				healthOk = true;
				return {
					healthOk,
					authenticated: false
				};
			}
		}
		if (String(err).includes("gateway closed")) {
			const gatewayDetails = require_call.buildGatewayConnectionDetails({ config: params.cfg });
			const closedDiagnostic = require_health_format.formatGatewayClosedDiagnostic(err);
			if (closedDiagnostic) require_note.note(closedDiagnostic, "Gateway");
			else require_note.note("Gateway not running.", "Gateway");
			require_note.note(gatewayDetails.message, "Gateway connection");
		} else params.runtime.error(require_health_format.formatHealthCheckFailure(err));
	}
	return {
		healthOk,
		authenticated: false,
		status
	};
}
/** Probes gateway memory readiness without forcing deep embedding checks. */
async function probeGatewayMemoryStatus(params) {
	const timeoutMs = typeof params.timeoutMs === "number" && params.timeoutMs > 0 ? params.timeoutMs : 8e3;
	try {
		const payload = await require_call.callGateway({
			method: "doctor.memory.status",
			params: { probe: false },
			timeoutMs,
			config: params.cfg
		});
		const gatewayChecked = payload.embedding.checked !== false;
		return {
			checked: gatewayChecked,
			ready: payload.embedding.ok,
			error: payload.embedding.error,
			...payload.embeddingRuntime ? { runtimeFacts: payload.embeddingRuntime } : {},
			skipped: !gatewayChecked
		};
	} catch (err) {
		const message = require_errors.formatErrorMessage(err);
		if (isGatewayCallTimeout(message)) return {
			checked: false,
			ready: false,
			error: `gateway memory probe timed out: ${message}`,
			skipped: false
		};
		return {
			checked: true,
			ready: false,
			error: `gateway memory probe unavailable: ${message}`,
			skipped: false
		};
	}
}
//#endregion
exports.checkGatewayHealth = checkGatewayHealth;
exports.probeGatewayMemoryStatus = probeGatewayMemoryStatus;
