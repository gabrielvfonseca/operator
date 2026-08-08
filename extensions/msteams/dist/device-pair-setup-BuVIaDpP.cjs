const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_tailscale_status = require("./tailscale-status-DgagbaYD.cjs");
const require_gateway_bind_url = require("./gateway-bind-url-DgVkjoud.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_network_interfaces = require("./network-interfaces-DxcNwPUn.cjs");
const require_qr_image = require("./qr-image-Ba8a2wH9.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_device_bootstrap = require("./device-bootstrap-CBBl1PUE.cjs");
const require_auth_mode_policy = require("./auth-mode-policy-DbgAYq72.cjs");
const require_advertised_lan_host = require("./advertised-lan-host-CqXdPyiB.cjs");
const require_auth_config_utils = require("./auth-config-utils-CaQ3nKUU.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_net_policy_ip = require("@gabrielvfonseca/net-policy/ip");
//#region src/pairing/setup-code.ts
const PAIRING_SETUP_MAX_URLS = 8;
function describeSecureMobilePairingFix(source) {
	return "Tailscale and public mobile pairing require a secure gateway URL (wss://) or Tailscale Serve/Funnel." + (source ? ` Resolved source: ${source}.` : "") + " Fix: use a private LAN address, prefer gateway.tailscale.mode=serve, or set gateway.remote.url / plugins.entries.device-pair.config.publicUrl to a wss:// URL. ws:// is only valid for localhost, private LAN addresses, .local hosts, or the Android emulator.";
}
function normalizeMobilePairingHost(host) {
	let normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(host);
	if (normalized.startsWith("[") && normalized.endsWith("]")) normalized = normalized.slice(1, -1);
	if (normalized.endsWith(".")) normalized = normalized.slice(0, -1);
	const zoneIndex = normalized.indexOf("%");
	if (zoneIndex >= 0) normalized = normalized.slice(0, zoneIndex);
	return normalized;
}
function isPrivateLanHost(host) {
	const normalized = normalizeMobilePairingHost(host);
	if (normalized.endsWith(".local")) return true;
	if ((0, _gabrielvfonseca_net_policy_ip.isRfc1918Ipv4Address)(normalized)) return true;
	const parsed = (0, _gabrielvfonseca_net_policy_ip.parseCanonicalIpAddress)(normalized);
	if (!parsed) return false;
	if ((0, _gabrielvfonseca_net_policy_ip.isIpv4Address)(parsed)) {
		const normalizedIp = parsed.toString();
		return normalizedIp.startsWith("169.254.") && !(0, _gabrielvfonseca_net_policy_ip.isCarrierGradeNatIpv4Address)(normalizedIp);
	}
	if (!(0, _gabrielvfonseca_net_policy_ip.isIpv6Address)(parsed)) return false;
	const normalizedIp = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsed.toString());
	return normalizedIp.startsWith("fe80:") || normalizedIp.startsWith("fc") || normalizedIp.startsWith("fd");
}
function isMobilePairingCleartextAllowedHost(host) {
	const normalized = normalizeMobilePairingHost(host);
	return normalized === "localhost" || (0, _gabrielvfonseca_net_policy_ip.isLoopbackIpAddress)(normalized) || normalized === "10.0.2.2" || isPrivateLanHost(normalized);
}
function isFullAccessMobilePairingUrl(url) {
	try {
		const parsed = new URL(url);
		if (parsed.protocol === "wss:") return true;
		const host = normalizeMobilePairingHost(parsed.hostname);
		return parsed.protocol === "ws:" && (host === "localhost" || (0, _gabrielvfonseca_net_policy_ip.isLoopbackIpAddress)(host));
	} catch {
		return false;
	}
}
function resolvePairingSetupAccess(profile) {
	if (require_device_bootstrap.deviceBootstrapProfilesEqual(profile, require_device_bootstrap.FULL_ACCESS_PAIRING_SETUP_BOOTSTRAP_PROFILE)) return "full";
	if (require_device_bootstrap.deviceBootstrapProfilesEqual(profile, require_device_bootstrap.NODE_PAIRING_SETUP_BOOTSTRAP_PROFILE)) return "node";
	return "limited";
}
function validateMobilePairingUrl(url, source) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return "Resolved mobile pairing URL is invalid.";
	}
	const protocol = parsed.protocol === "https:" ? "wss:" : parsed.protocol === "http:" ? "ws:" : parsed.protocol;
	if (protocol === "wss:") return null;
	if (protocol !== "ws:" || isMobilePairingCleartextAllowedHost(parsed.hostname)) return null;
	return describeSecureMobilePairingFix(source);
}
const GATEWAY_SCHEME_WITHOUT_AUTHORITY_RE = /^(?:https?|wss?):(?!\/\/)/i;
const SCHEME_LIKE_PATH_RE = /^[A-Za-z][A-Za-z0-9+.-]*:\//;
function normalizeUrl(raw, schemeFallback) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	if (GATEWAY_SCHEME_WITHOUT_AUTHORITY_RE.test(trimmed)) return null;
	const parsedUrl = parseNormalizedGatewayUrl(trimmed);
	if (parsedUrl) return parsedUrl;
	if (trimmed.includes("://") || SCHEME_LIKE_PATH_RE.test(trimmed)) return null;
	const withoutPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(trimmed.split("/", 1)[0]) ?? "";
	return withoutPath ? parseNormalizedGatewayUrl(`${schemeFallback}://${withoutPath}`) : null;
}
function parseNormalizedGatewayUrl(raw) {
	try {
		const parsed = new URL(raw);
		if (parsed.username || parsed.password) return null;
		const scheme = parsed.protocol.replace(":", "");
		if (!scheme) return null;
		const resolvedScheme = scheme === "http" ? "ws" : scheme === "https" ? "wss" : scheme;
		if (resolvedScheme !== "ws" && resolvedScheme !== "wss") return null;
		const host = parsed.hostname;
		if (!host) return null;
		return `${resolvedScheme}://${host}${parsed.port ? `:${parsed.port}` : ""}`;
	} catch {
		return null;
	}
}
function resolveScheme(cfg, opts) {
	if (opts?.forceSecure) return "wss";
	return cfg.gateway?.tls?.enabled === true ? "wss" : "ws";
}
function isTailnetIPv4(address) {
	return (0, _gabrielvfonseca_net_policy_ip.isCarrierGradeNatIpv4Address)(address);
}
function pickIPv4Matching(networkInterfaces, matches) {
	return require_network_interfaces.pickMatchingExternalInterfaceAddress(require_network_interfaces.safeNetworkInterfaces(networkInterfaces), {
		family: "IPv4",
		matches
	}) ?? null;
}
function pickTailnetIPv4(networkInterfaces) {
	return pickIPv4Matching(networkInterfaces, isTailnetIPv4);
}
function resolvePairingSetupAuthLabel(cfg, env) {
	const mode = cfg.gateway?.auth?.mode;
	const defaults = cfg.secrets?.defaults;
	const tokenRef = require_types_secrets.resolveSecretInputRef({
		value: cfg.gateway?.auth?.token,
		defaults
	}).ref;
	const passwordRef = require_types_secrets.resolveSecretInputRef({
		value: cfg.gateway?.auth?.password,
		defaults
	}).ref;
	const envToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_GATEWAY_TOKEN);
	const envPassword = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_GATEWAY_PASSWORD);
	const token = envToken || (tokenRef ? void 0 : require_types_secrets.normalizeSecretInputString(cfg.gateway?.auth?.token));
	const password = envPassword || (passwordRef ? void 0 : require_types_secrets.normalizeSecretInputString(cfg.gateway?.auth?.password));
	if (mode === "password") {
		if (!password) return { error: "Gateway auth is set to password, but no password is configured." };
		return { label: "password" };
	}
	if (mode === "token") {
		if (!token) return { error: "Gateway auth is set to token, but no token is configured." };
		return { label: "token" };
	}
	if (token) return { label: "token" };
	if (password) return { label: "password" };
	return { error: "Gateway auth is not configured (no token or password)." };
}
async function resolveGatewayUrl(cfg, opts) {
	const scheme = resolveScheme(cfg, { forceSecure: opts.forceSecure });
	const port = require_paths.resolveGatewayPort(cfg, opts.env);
	if (typeof opts.publicUrl === "string" && opts.publicUrl.trim()) {
		const url = normalizeUrl(opts.publicUrl, scheme);
		if (url) return {
			url,
			source: "plugins.entries.device-pair.config.publicUrl"
		};
		return { error: "Configured publicUrl is invalid." };
	}
	const remoteUrlRaw = cfg.gateway?.remote?.url;
	const hasRemoteUrl = typeof remoteUrlRaw === "string" && remoteUrlRaw.trim();
	const remoteUrl = hasRemoteUrl ? normalizeUrl(remoteUrlRaw, scheme) : null;
	if (hasRemoteUrl && !remoteUrl) return { error: "Configured gateway.remote.url is invalid." };
	if (opts.preferRemoteUrl && remoteUrl) return {
		url: remoteUrl,
		source: "gateway.remote.url"
	};
	const tailscaleMode = cfg.gateway?.tailscale?.mode ?? "off";
	if (tailscaleMode === "serve" || tailscaleMode === "funnel") {
		const host = await require_tailscale_status.resolveTailnetHostWithRunner(opts.runCommandWithTimeout);
		if (!host) return { error: "Tailscale Serve is enabled, but MagicDNS could not be resolved." };
		const publishedHost = require_tailscale_status.resolveTailscalePublishedHost({
			tailscaleMode,
			tailnetHost: host,
			serviceName: cfg.gateway?.tailscale?.serviceName
		});
		if (!publishedHost) return { error: "Tailscale Serve serviceName is configured, but Service MagicDNS could not be derived." };
		return {
			url: `wss://${publishedHost}`,
			source: `gateway.tailscale.mode=${tailscaleMode}`
		};
	}
	if (remoteUrl) return {
		url: remoteUrl,
		source: "gateway.remote.url"
	};
	const advertisedLanHost = cfg.gateway?.bind === "lan" ? await require_advertised_lan_host.resolveAdvertisedLanHost({
		networkInterfaces: opts.networkInterfaces,
		runCommandWithTimeout: opts.runCommandWithTimeout
	}) : null;
	const bindResult = require_gateway_bind_url.resolveGatewayBindUrl({
		bind: cfg.gateway?.bind,
		customBindHost: cfg.gateway?.customBindHost,
		scheme,
		port,
		pickTailnetHost: () => pickTailnetIPv4(opts.networkInterfaces),
		pickLanHost: () => advertisedLanHost
	});
	if (bindResult) return bindResult;
	return { error: "Gateway is only bound to loopback. Set gateway.bind=lan, enable tailscale serve, or configure plugins.entries.device-pair.config.publicUrl." };
}
function encodePairingSetupCode(payload) {
	const json = JSON.stringify(payload);
	return Buffer.from(json, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function resolvePairingSetupFromConfig(cfg, options = {}) {
	require_auth_mode_policy.assertExplicitGatewayAuthModeWhenBothConfigured(cfg);
	const env = options.env ?? process.env;
	const cfgForAuth = await require_auth_config_utils.materializeGatewayAuthSecretRefs({
		cfg,
		env,
		mode: cfg.gateway?.auth?.mode,
		hasTokenCandidate: Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_GATEWAY_TOKEN)),
		hasPasswordCandidate: Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_GATEWAY_PASSWORD))
	});
	const authLabel = resolvePairingSetupAuthLabel(cfgForAuth, env);
	if (authLabel.error) return {
		ok: false,
		error: authLabel.error
	};
	const urlResult = await resolveGatewayUrl(cfgForAuth, {
		env,
		publicUrl: options.publicUrl,
		preferRemoteUrl: options.preferRemoteUrl,
		forceSecure: options.forceSecure,
		runCommandWithTimeout: options.runCommandWithTimeout,
		networkInterfaces: options.networkInterfaces ?? node_os.default.networkInterfaces
	});
	if (!urlResult.url) return {
		ok: false,
		error: urlResult.error ?? "Gateway URL unavailable."
	};
	const mobilePairingUrlError = validateMobilePairingUrl(urlResult.url, urlResult.source);
	if (mobilePairingUrlError) return {
		ok: false,
		error: mobilePairingUrlError
	};
	if (!authLabel.label) return {
		ok: false,
		error: "Gateway auth is not configured (no token or password)."
	};
	const urls = [urlResult.url];
	if (urlResult.source === "gateway.bind=lan") {
		const serveUrls = await require_tailscale_status.resolveTailscaleServeGatewayUrlsWithRunner(require_paths.resolveGatewayPort(cfgForAuth, env), options.runCommandWithTimeout);
		for (const serveUrl of serveUrls) if (!validateMobilePairingUrl(serveUrl, "tailscale serve status")) urls.push(serveUrl);
	}
	const uniqueUrls = [...new Set(urls)].slice(0, PAIRING_SETUP_MAX_URLS);
	const requestedBootstrapProfile = options.bootstrapProfile ?? require_device_bootstrap.FULL_ACCESS_PAIRING_SETUP_BOOTSTRAP_PROFILE;
	const accessDowngraded = require_device_bootstrap.deviceBootstrapProfilesEqual(requestedBootstrapProfile, require_device_bootstrap.FULL_ACCESS_PAIRING_SETUP_BOOTSTRAP_PROFILE) && uniqueUrls.some((url) => !isFullAccessMobilePairingUrl(url));
	const issuedBootstrapProfile = accessDowngraded ? require_device_bootstrap.PAIRING_SETUP_BOOTSTRAP_PROFILE : requestedBootstrapProfile;
	return {
		ok: true,
		payload: {
			url: urlResult.url,
			...uniqueUrls.length > 1 ? { urls: uniqueUrls } : {},
			bootstrapToken: (await require_device_bootstrap.issueDeviceBootstrapToken({
				baseDir: options.pairingBaseDir,
				profile: issuedBootstrapProfile
			})).token
		},
		authLabel: authLabel.label,
		urlSource: urlResult.source ?? "unknown",
		access: resolvePairingSetupAccess(issuedBootstrapProfile),
		accessDowngraded
	};
}
//#endregion
//#region src/gateway/server-methods/device-pair-setup.ts
const MAX_QR_DATA_URL_LENGTH = 16384;
function readConfiguredDevicePairPublicUrl(config) {
	const value = config.plugins?.entries?.["device-pair"]?.config?.["publicUrl"];
	return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
/** Gateway handler for producing a device-pairing setup code + connect QR. */
const devicePairSetupHandlers = { "device.pair.setupCode": async ({ params, respond, context }) => {
	if (!require_validation.assertValidParams(params, require_src.validateDevicePairSetupCodeParams, "device.pair.setupCode", respond)) return;
	try {
		const config = context.getRuntimeConfig();
		const requestPublicUrl = typeof params.publicUrl === "string" ? params.publicUrl : void 0;
		const configuredPublicUrl = params.preferRemoteUrl === true ? void 0 : readConfiguredDevicePairPublicUrl(config);
		const publicUrl = requestPublicUrl ?? configuredPublicUrl;
		const resolved = await resolvePairingSetupFromConfig(config, {
			env: process.env,
			publicUrl,
			preferRemoteUrl: params.preferRemoteUrl === true,
			...params.bootstrapProfile ? { bootstrapProfile: params.bootstrapProfile === "node" ? require_device_bootstrap.NODE_PAIRING_SETUP_BOOTSTRAP_PROFILE : require_device_bootstrap.PAIRING_SETUP_BOOTSTRAP_PROFILE } : {},
			runCommandWithTimeout: async (argv, runOpts) => await require_exec.runCommandWithTimeout(argv, { timeoutMs: runOpts.timeoutMs })
		});
		if (!resolved.ok) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, resolved.error));
			return;
		}
		const setupCode = encodePairingSetupCode(resolved.payload);
		const renderedQr = params.includeQr !== false ? await require_qr_image.renderQrPngDataUrl(setupCode).catch(() => void 0) : void 0;
		const qrDataUrl = renderedQr && renderedQr.length <= MAX_QR_DATA_URL_LENGTH ? renderedQr : void 0;
		respond(true, {
			setupCode,
			...qrDataUrl ? { qrDataUrl } : {},
			gatewayUrl: resolved.payload.url,
			...resolved.payload.urls ? { gatewayUrls: resolved.payload.urls } : {},
			auth: resolved.authLabel,
			urlSource: requestPublicUrl ? "request.publicUrl" : resolved.urlSource,
			access: resolved.access,
			...resolved.accessDowngraded ? { accessDowngraded: true } : {}
		}, void 0);
	} catch (err) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
	}
} };
//#endregion
exports.devicePairSetupHandlers = devicePairSetupHandlers;
