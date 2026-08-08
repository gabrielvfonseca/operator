const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_tailnet = require("./tailnet-DcuaBh4d.cjs");
const require_net = require("./net-CakPoh2E.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_detect_binary = require("./detect-binary-B24IC5Ac.cjs");
const require_provider_auth_mode = require("./provider-auth-mode-D_4tVmIf.cjs");
const require_provider_auth_ref = require("./provider-auth-ref-DFo0sjpQ.cjs");
const require_secret_mask = require("./secret-mask-if3T4TYf.cjs");
require("./onboard-helpers-B8YMO226.cjs");
const require_widearea_dns = require("./widearea-dns-ZJG9bwh9.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let p_limit = require("p-limit");
p_limit = require_rolldown_runtime.__toESM(p_limit, 1);
//#region src/infra/bonjour-discovery.ts
function resolveGatewayDiscoveryEndpoint(beacon) {
	const host = beacon.host?.trim();
	const port = beacon.port;
	if (!host || typeof port !== "number" || !Number.isSafeInteger(port) || port <= 0 || port > MAX_TCP_PORT) return null;
	const gatewayTls = beacon.gatewayTls === true;
	const scheme = gatewayTls ? "wss" : "ws";
	return {
		host,
		port,
		gatewayTls,
		gatewayTlsFingerprintSha256: beacon.gatewayTlsFingerprintSha256,
		scheme,
		wsUrl: `${scheme}://${host}:${port}`
	};
}
const DEFAULT_TIMEOUT_MS = 2e3;
const GATEWAY_SERVICE_TYPE = "_operator-gw._tcp";
const MAX_TCP_PORT = 65535;
function decodeDnsSdEscapes(value) {
	let decoded = false;
	const bytes = [];
	let pending = "";
	const flush = () => {
		if (!pending) return;
		bytes.push(...Buffer.from(pending, "utf8"));
		pending = "";
	};
	for (let i = 0; i < value.length; i += 1) {
		const ch = value[i] ?? "";
		if (ch === "\\" && i + 3 < value.length) {
			const escaped = value.slice(i + 1, i + 4);
			if (/^[0-9]{3}$/.test(escaped)) {
				const byte = Number.parseInt(escaped, 10);
				if (!Number.isFinite(byte) || byte < 0 || byte > 255) {
					pending += ch;
					continue;
				}
				flush();
				bytes.push(byte);
				decoded = true;
				i += 3;
				continue;
			}
		}
		pending += ch;
	}
	if (!decoded) return value;
	flush();
	return Buffer.from(bytes).toString("utf8");
}
function parseDigShortLines(stdout) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(stdout.split("\n"));
}
function parseDigTxt(stdout) {
	const tokens = [];
	for (const raw of stdout.split("\n")) {
		const line = raw.trim();
		if (!line) continue;
		const matches = Array.from(line.matchAll(/"([^"]*)"/g), (m) => m[1] ?? "");
		for (const m of matches) {
			const unescaped = m.replaceAll("\\\\", "\\").replaceAll("\\\"", "\"").replaceAll("\\n", "\n");
			tokens.push(unescaped);
		}
	}
	return tokens;
}
function parseDigSrv(stdout) {
	const line = stdout.split("\n").map((l) => l.trim()).find(Boolean);
	if (!line) return null;
	const parts = line.split(/\s+/).filter(Boolean);
	if (parts.length < 4) return null;
	const port = parsePortOrUndefined(parts[2]);
	const hostRaw = parts[3] ?? "";
	if (port === void 0) return null;
	const host = hostRaw.replace(/\.$/, "");
	if (!host) return null;
	return {
		host,
		port
	};
}
function parseTailscaleStatusIPv4s(stdout) {
	const parsed = stdout ? JSON.parse(stdout) : {};
	const out = [];
	const addIps = (value) => {
		if (!value || typeof value !== "object") return;
		const ips = value.TailscaleIPs;
		if (!Array.isArray(ips)) return;
		for (const ip of ips) {
			if (typeof ip !== "string") continue;
			const trimmed = ip.trim();
			if (trimmed && require_tailnet.isTailnetIPv4(trimmed)) out.push(trimmed);
		}
	};
	addIps(parsed.Self);
	const peerObj = parsed.Peer;
	if (peerObj && typeof peerObj === "object") for (const peer of Object.values(peerObj)) addIps(peer);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(out);
}
function parsePortOrUndefined(value) {
	if (!value) return;
	const parsed = require_parse_finite_number.parseStrictInteger(value);
	return parsed !== void 0 && parsed > 0 && parsed <= MAX_TCP_PORT ? parsed : void 0;
}
function parseTxtTokens(tokens) {
	const txt = {};
	for (const token of tokens) {
		const idx = token.indexOf("=");
		if (idx <= 0) continue;
		const key = token.slice(0, idx).trim();
		const value = decodeDnsSdEscapes(token.slice(idx + 1).trim());
		if (!key) continue;
		txt[key] = value;
	}
	return txt;
}
function parseDnsSdBrowse(stdout) {
	const instances = /* @__PURE__ */ new Set();
	for (const raw of stdout.split("\n")) {
		const line = raw.trim();
		if (!line?.includes(GATEWAY_SERVICE_TYPE)) continue;
		if (!line.includes("Add")) continue;
		const match = line.match(/_operator-gw\._tcp\.?\s+(.+)$/);
		if (match?.[1]) instances.add(decodeDnsSdEscapes(match[1].trim()));
	}
	return Array.from(instances.values());
}
function parseDnsSdResolve(stdout, instanceName) {
	const decodedInstanceName = decodeDnsSdEscapes(instanceName);
	const beacon = { instanceName: decodedInstanceName };
	let txt = {};
	for (const raw of stdout.split("\n")) {
		const line = raw.trim();
		if (!line) continue;
		if (line.includes("can be reached at")) {
			const match = line.match(/can be reached at\s+([^\s:]+):([^\s]+)/i);
			if (match?.[1]) beacon.host = match[1].replace(/\.$/, "");
			if (match?.[2]) beacon.port = parsePortOrUndefined(match[2]);
			continue;
		}
		if (line.startsWith("txt") || line.includes("txtvers=")) txt = parseTxtTokens(line.split(/\s+/).filter(Boolean));
	}
	beacon.txt = Object.keys(txt).length ? txt : void 0;
	if (txt.displayName) beacon.displayName = decodeDnsSdEscapes(txt.displayName);
	if (txt.lanHost) beacon.lanHost = txt.lanHost;
	if (txt.tailnetDns) beacon.tailnetDns = txt.tailnetDns;
	if (txt.cliPath) beacon.cliPath = txt.cliPath;
	beacon.gatewayPort = parsePortOrUndefined(txt.gatewayPort);
	beacon.sshPort = parsePortOrUndefined(txt.sshPort);
	if (txt.gatewayTls) {
		const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(txt.gatewayTls);
		beacon.gatewayTls = raw === "1" || raw === "true" || raw === "yes";
	}
	if (txt.gatewayTlsSha256) beacon.gatewayTlsFingerprintSha256 = txt.gatewayTlsSha256;
	if (txt.role) beacon.role = txt.role;
	if (txt.transport) beacon.transport = txt.transport;
	if (!beacon.displayName) beacon.displayName = decodedInstanceName;
	return beacon;
}
async function discoverViaDnsSd(domain, timeoutMs, run) {
	const instances = parseDnsSdBrowse((await run([
		"dns-sd",
		"-B",
		GATEWAY_SERVICE_TYPE,
		domain
	], { timeoutMs })).stdout);
	const results = [];
	for (const instance of instances) {
		const parsed = parseDnsSdResolve((await run([
			"dns-sd",
			"-L",
			instance,
			GATEWAY_SERVICE_TYPE,
			domain
		], { timeoutMs })).stdout, instance);
		if (parsed) results.push({
			...parsed,
			domain
		});
	}
	return results;
}
async function discoverWideAreaViaTailnetDns(domain, timeoutMs, run) {
	if (!domain || domain === "local.") return [];
	const startedAt = Date.now();
	const remainingMs = () => timeoutMs - (Date.now() - startedAt);
	const tailscaleCandidates = ["tailscale", "/Applications/Tailscale.app/Contents/MacOS/Tailscale"];
	let ips = [];
	for (const candidate of tailscaleCandidates) try {
		ips = parseTailscaleStatusIPv4s((await run([
			candidate,
			"status",
			"--json"
		], { timeoutMs: Math.max(1, Math.min(700, remainingMs())) })).stdout);
		if (ips.length > 0) break;
	} catch {}
	if (ips.length === 0) return [];
	if (remainingMs() <= 0) return [];
	ips = ips.slice(0, 40);
	const probeName = `${GATEWAY_SERVICE_TYPE}.${domain.replace(/\.$/, "")}`;
	let nameserver = null;
	let ptrs = [];
	await (0, p_limit.default)(6).map(ips, async (ip) => {
		if (nameserver !== null) return;
		const budget = remainingMs();
		if (budget <= 0 || !ip) return;
		try {
			const lines = parseDigShortLines((await run([
				"dig",
				"+short",
				"+time=1",
				"+tries=1",
				`@${ip}`,
				probeName,
				"PTR"
			], { timeoutMs: Math.max(1, Math.min(250, budget)) })).stdout);
			if (lines.length > 0) {
				nameserver = ip;
				ptrs = lines;
			}
		} catch {}
	});
	if (!nameserver || ptrs.length === 0) return [];
	if (remainingMs() <= 0) return [];
	const nameserverArg = `@${String(nameserver)}`;
	const results = [];
	for (const ptr of ptrs) {
		const budget = remainingMs();
		if (budget <= 0) break;
		const ptrName = ptr.trim().replace(/\.$/, "");
		if (!ptrName) continue;
		const instanceName = ptrName.replace(/\.?_operator-gw\._tcp\..*$/, "");
		const srv = await run([
			"dig",
			"+short",
			"+time=1",
			"+tries=1",
			nameserverArg,
			ptrName,
			"SRV"
		], { timeoutMs: Math.max(1, Math.min(350, budget)) }).catch(() => null);
		const srvParsed = srv ? parseDigSrv(srv.stdout) : null;
		if (!srvParsed) continue;
		const txtBudget = remainingMs();
		if (txtBudget <= 0) {
			results.push({
				instanceName: instanceName || ptrName,
				displayName: instanceName || ptrName,
				domain,
				host: srvParsed.host,
				port: srvParsed.port
			});
			continue;
		}
		const txt = await run([
			"dig",
			"+short",
			"+time=1",
			"+tries=1",
			nameserverArg,
			ptrName,
			"TXT"
		], { timeoutMs: Math.max(1, Math.min(350, txtBudget)) }).catch(() => null);
		const txtTokens = txt ? parseDigTxt(txt.stdout) : [];
		const txtMap = txtTokens.length > 0 ? parseTxtTokens(txtTokens) : {};
		const beacon = {
			instanceName: instanceName || ptrName,
			displayName: txtMap.displayName || instanceName || ptrName,
			domain,
			host: srvParsed.host,
			port: srvParsed.port,
			txt: Object.keys(txtMap).length ? txtMap : void 0,
			gatewayPort: parsePortOrUndefined(txtMap.gatewayPort),
			sshPort: parsePortOrUndefined(txtMap.sshPort),
			tailnetDns: txtMap.tailnetDns || void 0,
			cliPath: txtMap.cliPath || void 0
		};
		if (txtMap.gatewayTls) {
			const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(txtMap.gatewayTls);
			beacon.gatewayTls = raw === "1" || raw === "true" || raw === "yes";
		}
		if (txtMap.gatewayTlsSha256) beacon.gatewayTlsFingerprintSha256 = txtMap.gatewayTlsSha256;
		if (txtMap.role) beacon.role = txtMap.role;
		if (txtMap.transport) beacon.transport = txtMap.transport;
		results.push(beacon);
	}
	return results;
}
function parseAvahiBrowse(stdout) {
	const results = [];
	let current = null;
	for (const raw of stdout.split("\n")) {
		const line = raw.trimEnd();
		if (!line) continue;
		if (line.startsWith("=") && line.includes(GATEWAY_SERVICE_TYPE)) {
			if (current) results.push(current);
			const marker = ` ${GATEWAY_SERVICE_TYPE}`;
			const idx = line.indexOf(marker);
			const left = idx >= 0 ? line.slice(0, idx).trim() : line;
			const parts = left.split(/\s+/);
			const instanceName = parts.length > 3 ? parts.slice(3).join(" ") : left;
			current = {
				instanceName,
				displayName: instanceName
			};
			continue;
		}
		if (!current) continue;
		const trimmed = line.trim();
		if (trimmed.startsWith("hostname =")) {
			const match = trimmed.match(/hostname\s*=\s*\[([^\]]+)\]/);
			if (match?.[1]) current.host = match[1];
			continue;
		}
		if (trimmed.startsWith("port =")) {
			const match = trimmed.match(/port\s*=\s*\[(\d+)\]/);
			if (match?.[1]) current.port = parsePortOrUndefined(match[1]);
			continue;
		}
		if (trimmed.startsWith("txt =")) {
			const txt = parseTxtTokens(Array.from(trimmed.matchAll(/"([^"]*)"/g), (match) => (0, _gabrielvfonseca_normalization_core.expectDefined)(match.at(1), "Bonjour TXT token")));
			current.txt = Object.keys(txt).length ? txt : void 0;
			if (txt.displayName) current.displayName = txt.displayName;
			if (txt.lanHost) current.lanHost = txt.lanHost;
			if (txt.tailnetDns) current.tailnetDns = txt.tailnetDns;
			if (txt.cliPath) current.cliPath = txt.cliPath;
			current.gatewayPort = parsePortOrUndefined(txt.gatewayPort);
			current.sshPort = parsePortOrUndefined(txt.sshPort);
			if (txt.gatewayTls) {
				const rawLocal = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(txt.gatewayTls);
				current.gatewayTls = rawLocal === "1" || rawLocal === "true" || rawLocal === "yes";
			}
			if (txt.gatewayTlsSha256) current.gatewayTlsFingerprintSha256 = txt.gatewayTlsSha256;
			if (txt.role) current.role = txt.role;
			if (txt.transport) current.transport = txt.transport;
		}
	}
	if (current) results.push(current);
	return results;
}
async function discoverViaAvahi(domain, timeoutMs, run) {
	const args = [
		"avahi-browse",
		"-rt",
		GATEWAY_SERVICE_TYPE
	];
	if (domain && domain !== "local.") args.push("-d", domain.replace(/\.$/, ""));
	return parseAvahiBrowse((await run(args, { timeoutMs })).stdout).map((beacon) => Object.assign({}, beacon, { domain }));
}
async function discoverGatewayBeacons(opts = {}) {
	const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const platform = opts.platform ?? process.platform;
	const run = opts.run ?? require_exec.runCommandWithTimeout;
	const wideAreaDomain = require_widearea_dns.resolveWideAreaDiscoveryDomain({ configDomain: opts.wideAreaDomain });
	const domainsRaw = Array.isArray(opts.domains) ? opts.domains : [];
	const defaultDomains = ["local.", ...wideAreaDomain ? [wideAreaDomain] : []];
	const domains = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(domainsRaw.length > 0 ? domainsRaw : defaultDomains).map((d) => d.endsWith(".") ? d : `${d}.`);
	try {
		if (platform === "darwin") {
			const discovered = (await Promise.allSettled(domains.map(async (domain) => await discoverViaDnsSd(domain, timeoutMs, run)))).flatMap((r) => r.status === "fulfilled" ? r.value : []);
			const wantsWideArea = wideAreaDomain ? domains.includes(wideAreaDomain) : false;
			const hasWideArea = wideAreaDomain ? discovered.some((b) => b.domain === wideAreaDomain) : false;
			if (wantsWideArea && !hasWideArea && wideAreaDomain) {
				const fallback = await discoverWideAreaViaTailnetDns(wideAreaDomain, timeoutMs, run).catch(() => []);
				return [...discovered, ...fallback];
			}
			return discovered;
		}
		if (platform === "linux") return (await Promise.allSettled(domains.map(async (domain) => await discoverViaAvahi(domain, timeoutMs, run)))).flatMap((r) => r.status === "fulfilled" ? r.value : []);
	} catch {
		return [];
	}
	return [];
}
//#endregion
//#region src/infra/gateway-discovery-targets.ts
function pickSshPort(beacon) {
	return typeof beacon.sshPort === "number" && Number.isFinite(beacon.sshPort) && beacon.sshPort > 0 ? beacon.sshPort : null;
}
/** Build normalized connection details for a discovered gateway beacon. */
function buildGatewayDiscoveryTarget(beacon, opts) {
	const endpoint = resolveGatewayDiscoveryEndpoint(beacon);
	const sshPort = pickSshPort(beacon);
	const sshUser = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts?.sshUser) ?? "";
	const baseSshTarget = endpoint ? sshUser ? `${sshUser}@${endpoint.host}` : endpoint.host : null;
	const sshTarget = baseSshTarget && sshPort && sshPort !== 22 ? `${baseSshTarget}:${sshPort}` : baseSshTarget;
	return {
		title: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(beacon.displayName || beacon.instanceName || "Gateway") ?? "Gateway",
		domain: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(beacon.domain || "local.") ?? "local.",
		endpoint,
		wsUrl: endpoint?.wsUrl ?? null,
		sshPort,
		sshTarget
	};
}
/** Build the compact label shown in discovery lists. */
function buildGatewayDiscoveryLabel(beacon) {
	const target = buildGatewayDiscoveryTarget(beacon);
	const hint = target.endpoint ? `${target.endpoint.host}:${target.endpoint.port}` : "host unknown";
	return `${target.title} (${hint})`;
}
//#endregion
//#region src/commands/onboard-remote.ts
const DEFAULT_GATEWAY_URL = "ws://127.0.0.1:18789";
function buildLabel(beacon) {
	return buildGatewayDiscoveryLabel(beacon);
}
function ensureWsUrl(value) {
	const trimmed = value.trim();
	if (!trimmed) return DEFAULT_GATEWAY_URL;
	return trimmed;
}
function validateGatewayWebSocketUrl(value) {
	const trimmed = value.trim();
	if (!trimmed.startsWith("ws://") && !trimmed.startsWith("wss://")) return require_i18n.t("wizard.remote.validWebSocketUrl");
	if (!require_net.isSecureWebSocketUrl(trimmed, { allowPrivateWs: process.env.OPERATOR_ALLOW_INSECURE_PRIVATE_WS === "1" })) return require_i18n.t("wizard.remote.insecureRemoteUrl");
}
/** Prompts for remote gateway connection and auth settings. */
async function promptRemoteGatewayConfig(cfg, prompter, options) {
	let selectedBeacon = null;
	let suggestedUrl = cfg.gateway?.remote?.url ?? DEFAULT_GATEWAY_URL;
	let discoveryTlsFingerprint;
	let trustedDiscoveryUrl;
	const hasBonjourTool = await require_detect_binary.detectBinary("dns-sd") || await require_detect_binary.detectBinary("avahi-browse");
	const wantsDiscover = hasBonjourTool ? await prompter.confirm({
		message: require_i18n.t("wizard.remote.bonjour"),
		initialValue: true
	}) : false;
	if (!hasBonjourTool) await prompter.note(["Bonjour discovery requires dns-sd (macOS) or avahi-browse (Linux).", "Docs: https://docs.operator.ai/gateway/discovery"].join("\n"), "Discovery");
	if (wantsDiscover) {
		const wideAreaDomain = require_widearea_dns.resolveWideAreaDiscoveryDomain({ configDomain: cfg.discovery?.wideArea?.domain });
		const spin = prompter.progress(require_i18n.t("wizard.remote.searchProgress"));
		const beacons = await discoverGatewayBeacons({
			timeoutMs: 2e3,
			wideAreaDomain
		});
		spin.stop(beacons.length > 0 ? require_i18n.t("wizard.remote.foundGateways", { count: beacons.length }) : require_i18n.t("wizard.remote.noGatewaysFound"));
		if (beacons.length > 0) {
			const selection = await prompter.select({
				message: require_i18n.t("wizard.remote.selectGateway"),
				options: [...beacons.map((beacon, index) => ({
					value: String(index),
					label: buildLabel(beacon)
				})), {
					value: "manual",
					label: require_i18n.t("wizard.remote.enterUrlManually")
				}]
			});
			if (selection !== "manual") {
				const idx = require_parse_finite_number.parseStrictNonNegativeInteger(selection);
				selectedBeacon = idx === void 0 ? null : beacons[idx] ?? null;
			}
		}
	}
	if (selectedBeacon) {
		const target = buildGatewayDiscoveryTarget(selectedBeacon);
		if (target.endpoint) {
			const { host, port } = target.endpoint;
			if (await prompter.select({
				message: require_i18n.t("wizard.remote.connectionMethod"),
				options: [{
					value: "direct",
					label: `Direct gateway WS (${host}:${port})`
				}, {
					value: "ssh",
					label: require_i18n.t("wizard.remote.sshTunnel")
				}]
			}) === "direct") {
				suggestedUrl = `wss://${host}:${port}`;
				const fingerprint = target.endpoint.gatewayTlsFingerprintSha256;
				if (await prompter.confirm({
					message: require_i18n.t("wizard.remote.trustGateway", {
						host: `${host}:${port}`,
						fingerprint: fingerprint ?? require_i18n.t("wizard.remote.fingerprintMissing")
					}),
					initialValue: false
				})) {
					discoveryTlsFingerprint = fingerprint;
					trustedDiscoveryUrl = suggestedUrl;
					await prompter.note([
						require_i18n.t("wizard.remote.directDefaultsTls"),
						`Using: ${suggestedUrl}`,
						...fingerprint ? [`TLS pin: ${fingerprint}`] : [],
						require_i18n.t("wizard.remote.loopbackSshHint")
					].join("\n"), require_i18n.t("wizard.remote.directAccessTitle"));
				} else suggestedUrl = DEFAULT_GATEWAY_URL;
			} else {
				suggestedUrl = DEFAULT_GATEWAY_URL;
				await prompter.note([
					"Start a tunnel before using the CLI:",
					`ssh -N -L 18789:127.0.0.1:18789 <user>@${host}${target.sshPort ? ` -p ${target.sshPort}` : ""}`,
					"Docs: https://docs.operator.ai/gateway/remote"
				].join("\n"), require_i18n.t("wizard.remote.sshTunnelTitle"));
			}
		}
	}
	const url = ensureWsUrl(await prompter.text({
		message: require_i18n.t("wizard.remote.websocketUrl"),
		initialValue: suggestedUrl,
		validate: (value) => validateGatewayWebSocketUrl(value)
	}));
	const pinnedDiscoveryFingerprint = discoveryTlsFingerprint && url === trustedDiscoveryUrl ? discoveryTlsFingerprint : void 0;
	const authChoice = await prompter.select({
		message: require_i18n.t("wizard.remote.auth"),
		options: [
			{
				value: "token",
				label: require_i18n.t("common.tokenRecommended")
			},
			{
				value: "password",
				label: require_i18n.t("common.password")
			},
			{
				value: "off",
				label: require_i18n.t("common.noAuth")
			}
		]
	});
	let token = cfg.gateway?.remote?.token;
	let password = cfg.gateway?.remote?.password;
	if (authChoice === "token") {
		if (await require_provider_auth_mode.resolveSecretInputModeForEnvSelection({
			prompter,
			explicitMode: options?.secretInputMode,
			copy: {
				modeMessage: require_i18n.t("wizard.gateway.remoteTokenMode"),
				plaintextLabel: require_i18n.t("wizard.remote.plaintextTokenLabel"),
				plaintextHint: require_i18n.t("wizard.remote.plaintextTokenHint")
			}
		}) === "ref") token = (await require_provider_auth_ref.promptSecretRefForSetup({
			provider: "gateway-remote-token",
			config: cfg,
			prompter,
			preferredEnvVar: "OPERATOR_GATEWAY_TOKEN",
			copy: {
				sourceMessage: require_i18n.t("wizard.remote.gatewayTokenStoredMessage"),
				envVarPlaceholder: "OPERATOR_GATEWAY_TOKEN"
			}
		})).ref;
		else {
			const existingToken = typeof token === "string" ? token : void 0;
			if (existingToken && await prompter.confirm({
				message: require_i18n.t("wizard.gateway.existingTokenConfirm", { token: require_secret_mask.maskApiKey(existingToken) }),
				initialValue: true
			})) token = existingToken;
			else token = (await prompter.text({
				message: require_i18n.t("wizard.remote.tokenPrompt"),
				validate: (value) => value?.trim() ? void 0 : require_i18n.t("common.required"),
				sensitive: true
			})).trim();
		}
		password = void 0;
	} else if (authChoice === "password") {
		if (await require_provider_auth_mode.resolveSecretInputModeForEnvSelection({
			prompter,
			explicitMode: options?.secretInputMode,
			copy: {
				modeMessage: require_i18n.t("wizard.gateway.remotePasswordMode"),
				plaintextLabel: require_i18n.t("wizard.remote.plaintextPasswordLabel"),
				plaintextHint: require_i18n.t("wizard.remote.plaintextPasswordHint")
			}
		}) === "ref") password = (await require_provider_auth_ref.promptSecretRefForSetup({
			provider: "gateway-remote-password",
			config: cfg,
			prompter,
			preferredEnvVar: "OPERATOR_GATEWAY_PASSWORD",
			copy: {
				sourceMessage: require_i18n.t("wizard.remote.gatewayPasswordStoredMessage"),
				envVarPlaceholder: "OPERATOR_GATEWAY_PASSWORD"
			}
		})).ref;
		else {
			const existingPassword = typeof password === "string" ? password : void 0;
			if (existingPassword && await prompter.confirm({
				message: require_i18n.t("wizard.gateway.existingPasswordConfirm", { password: require_secret_mask.maskApiKey(existingPassword) }),
				initialValue: true
			})) password = existingPassword;
			else password = (await prompter.text({
				message: require_i18n.t("wizard.remote.passwordPrompt"),
				validate: (value) => value?.trim() ? void 0 : require_i18n.t("common.required"),
				sensitive: true
			})).trim();
		}
		token = void 0;
	} else {
		token = void 0;
		password = void 0;
	}
	return {
		...cfg,
		gateway: {
			...cfg.gateway,
			mode: "remote",
			remote: {
				url,
				...token !== void 0 ? { token } : {},
				...password !== void 0 ? { password } : {},
				...pinnedDiscoveryFingerprint ? { tlsFingerprint: pinnedDiscoveryFingerprint } : {}
			}
		}
	};
}
//#endregion
exports.promptRemoteGatewayConfig = promptRemoteGatewayConfig;
