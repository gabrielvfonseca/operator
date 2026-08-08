const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_net = require("./net-CakPoh2E.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_net_policy_redact_sensitive_url = require("@gabrielvfonseca/net-policy/redact-sensitive-url");
//#region src/gateway/connection-details.ts
/** Build gateway target details and reject unsafe remote plaintext websocket URLs. */
function buildGatewayConnectionDetailsWithResolvers(options = {}, resolvers = {}) {
	const config = options.config ?? resolvers.getRuntimeConfig?.() ?? {};
	const configPath = options.configPath ?? resolvers.resolveConfigPath?.(process.env) ?? require_paths.resolveConfigPath(process.env);
	const isRemoteMode = config.gateway?.mode === "remote";
	const remote = isRemoteMode ? config.gateway?.remote : void 0;
	const tlsEnabled = config.gateway?.tls?.enabled === true;
	const localPort = options.localPortOverride ?? resolvers.resolveGatewayPort?.(config, process.env) ?? require_paths.resolveGatewayPort(config);
	const bindMode = config.gateway?.bind ?? "loopback";
	const localUrl = `${tlsEnabled ? "wss" : "ws"}://127.0.0.1:${localPort}`;
	const cliUrlOverride = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(options.url);
	const envUrlOverride = cliUrlOverride || options.ignoreEnvUrlOverride || options.localPortOverride !== void 0 ? void 0 : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.OPERATOR_GATEWAY_URL);
	const urlOverride = cliUrlOverride ?? envUrlOverride;
	const remoteUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(remote?.url);
	const remoteMisconfigured = isRemoteMode && !urlOverride && !remoteUrl;
	const urlSourceHint = options.urlSource ?? (cliUrlOverride ? "cli" : envUrlOverride ? "env" : void 0);
	const url = urlOverride || remoteUrl || localUrl;
	const displayUrl = (0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(url);
	const urlSource = urlOverride ? urlSourceHint === "env" ? "env OPERATOR_GATEWAY_URL" : "cli --url" : remoteUrl ? "config gateway.remote.url" : remoteMisconfigured ? "missing gateway.remote.url (fallback local)" : "local loopback";
	const bindDetail = !urlOverride && !remoteUrl ? `Bind: ${bindMode}` : void 0;
	const remoteFallbackNote = remoteMisconfigured ? "Warn: gateway.mode=remote but gateway.remote.url is missing; set gateway.remote.url or switch gateway.mode=local." : void 0;
	const allowPrivateWs = process.env.OPERATOR_ALLOW_INSECURE_PRIVATE_WS === "1";
	if (!require_net.isSecureWebSocketUrl(url, { allowPrivateWs })) throw new Error([
		`SECURITY ERROR: Gateway URL "${displayUrl}" uses plaintext ws:// to a non-loopback address.`,
		"Both credentials and chat data would be exposed to network interception.",
		`Source: ${urlSource}`,
		`Config: ${configPath}`,
		"Fix: Use wss:// for remote gateway URLs.",
		"Safe remote access defaults:",
		"- keep gateway.bind=loopback and use an SSH tunnel (ssh -N -L 18789:127.0.0.1:18789 user@gateway-host)",
		"- or use Tailscale Serve/Funnel for HTTPS remote access",
		allowPrivateWs ? void 0 : "Break-glass (trusted private networks only): set OPERATOR_ALLOW_INSECURE_PRIVATE_WS=1",
		"Doctor: openclaw doctor --fix",
		"Docs: https://docs.operator.ai/gateway/remote"
	].join("\n"));
	return {
		url,
		urlSource,
		bindDetail,
		remoteFallbackNote,
		message: [
			`Gateway target: ${displayUrl}`,
			`Source: ${urlSource}`,
			`Config: ${configPath}`,
			bindDetail,
			remoteFallbackNote
		].filter(Boolean).join("\n")
	};
}
//#endregion
Object.defineProperty(exports, "buildGatewayConnectionDetailsWithResolvers", {
	enumerable: true,
	get: function() {
		return buildGatewayConnectionDetailsWithResolvers;
	}
});
