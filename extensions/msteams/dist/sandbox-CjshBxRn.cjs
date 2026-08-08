const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_constants = require("./constants-DD-eOR3_.cjs");
const require_tool_policy = require("./tool-policy-DWNs5HaX.cjs");
const require_config = require("./config-DEJMoJiT.cjs");
const require_runtime_status = require("./runtime-status-BGIjp9Ys.cjs");
require("./config-DT0qiglW.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
const require_sandbox_paths = require("./sandbox-paths-BmmHDLnB.cjs");
const require_network_mode = require("./network-mode-DcJhB8iN.cjs");
const require_facade_loader = require("./facade-loader-CNps1O4t.cjs");
const require_path_utils = require("./path-utils-9zbrKCrT.cjs");
const require_workspace_mounts = require("./workspace-mounts-CgU9PRS7.cjs");
require("./sanitize-env-vars-DvSenG8T.cjs");
const require_docker = require("./docker-Bz1bPNmB.cjs");
const require_validate_sandbox_security = require("./validate-sandbox-security-DveazAv6.cjs");
const require_browser_bridges = require("./browser-bridges-k53bctds.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugin-sdk/browser-control-auth.ts
let cachedBrowserControlAuthSurface;
function loadBrowserControlAuthSurface() {
	cachedBrowserControlAuthSurface ??= require_facade_loader.loadBundledPluginPublicSurfaceModuleSync({
		dirName: "browser",
		artifactBasename: "browser-control-auth.js"
	});
	return cachedBrowserControlAuthSurface;
}
/** Resolves browser control auth from config/env without generating new credentials. */
function resolveBrowserControlAuth(cfg, env = process.env) {
	return loadBrowserControlAuthSurface().resolveBrowserControlAuth(cfg, env);
}
/** Ensures browser control auth exists, returning any token generated during the call. */
async function ensureBrowserControlAuth(params) {
	return await loadBrowserControlAuthSurface().ensureBrowserControlAuth(params);
}
//#endregion
//#region src/plugin-sdk/browser-profiles.ts
/**
* Public SDK facade for browser profile defaults and activated profile resolution.
*/
/** Default browser profile accent color shown in UI surfaces. */
const DEFAULT_OPERATOR_BROWSER_COLOR = "#FF4500";
/** Default Operator-managed browser profile name. */
const DEFAULT_OPERATOR_BROWSER_PROFILE_NAME = "@gabrielvfonseca/operator";
/** Default timeout for browser actions issued through the browser plugin. */
const DEFAULT_BROWSER_ACTION_TIMEOUT_MS = 6e4;
node_path.default.join(require_tmp_operator_dir.resolvePreferredOperatorTmpDir(), "uploads");
let cachedBrowserProfilesSurface;
function loadBrowserProfilesSurface() {
	cachedBrowserProfilesSurface ??= require_facade_loader.loadBundledPluginPublicSurfaceModuleSync({
		dirName: "browser",
		artifactBasename: "browser-profiles.js"
	});
	return cachedBrowserProfilesSurface;
}
/** Resolves browser config through the activated bundled browser profile facade. */
function resolveBrowserConfig(cfg, rootConfig) {
	return loadBrowserProfilesSurface().resolveBrowserConfig(cfg, rootConfig);
}
/** Resolves one named browser profile from an already resolved browser config. */
function resolveProfile(resolved, profileName) {
	return loadBrowserProfilesSurface().resolveProfile(resolved, profileName);
}
//#endregion
//#region src/config/port-defaults.ts
function isValidPort(port) {
	return Number.isFinite(port) && port > 0 && port <= 65535;
}
function clampPort(port, fallback) {
	return isValidPort(port) ? port : fallback;
}
function derivePort(base, offset, fallback) {
	return clampPort(base + offset, fallback);
}
/** Default browser-CDP sidecar port range used when no browser-control-relative range is safe. */
const DEFAULT_BROWSER_CDP_PORT_RANGE_START = 18800;
/** Inclusive end of the default browser-CDP sidecar port range. */
const DEFAULT_BROWSER_CDP_PORT_RANGE_END = 18899;
const DEFAULT_BROWSER_CDP_PORT_RANGE_SPAN = DEFAULT_BROWSER_CDP_PORT_RANGE_END - DEFAULT_BROWSER_CDP_PORT_RANGE_START;
/** Derives the browser-CDP sidecar range from the browser-control port when it fits. */
function deriveDefaultBrowserCdpPortRange(browserControlPort) {
	const start = derivePort(browserControlPort, 9, DEFAULT_BROWSER_CDP_PORT_RANGE_START);
	const end = start + DEFAULT_BROWSER_CDP_PORT_RANGE_SPAN;
	if (end <= 65535) return {
		start,
		end
	};
	return {
		start: DEFAULT_BROWSER_CDP_PORT_RANGE_START,
		end: DEFAULT_BROWSER_CDP_PORT_RANGE_END
	};
}
//#endregion
//#region src/agents/sandbox/novnc-auth.ts
/**
* noVNC observer authentication helpers.
*
* Issues short-lived observer tokens and builds local noVNC URLs without exposing long-lived browser bridge state.
*/
const NOVNC_PASSWORD_ENV_KEY = "OPERATOR_BROWSER_NOVNC_PASSWORD";
const NOVNC_TOKEN_TTL_MS = 60 * 1e3;
const MAX_NOVNC_TOKEN_TTL_MS = NOVNC_TOKEN_TTL_MS;
const NOVNC_PASSWORD_LENGTH = 8;
const NOVNC_PASSWORD_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NO_VNC_OBSERVER_TOKENS = /* @__PURE__ */ new Map();
function pruneExpiredNoVncObserverTokens(now) {
	for (const [token, entry] of NO_VNC_OBSERVER_TOKENS) if (!(0, _gabrielvfonseca_normalization_core_number_coercion.isFutureDateTimestampMs)(entry.expiresAt, { nowMs: now })) NO_VNC_OBSERVER_TOKENS.delete(token);
}
function resolveNoVncObserverTokenExpiresAt(params) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(params.ttlMs, {
		nowMs: params.nowMs,
		minRemainingMs: 1
	}) ?? (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(NOVNC_TOKEN_TTL_MS, {
		nowMs: params.nowMs,
		minRemainingMs: 1
	});
}
function isNoVncEnabled(params) {
	return params.enableNoVnc && !params.headless;
}
function generateNoVncPassword() {
	let out = "";
	for (let i = 0; i < NOVNC_PASSWORD_LENGTH; i += 1) out += NOVNC_PASSWORD_ALPHABET[node_crypto.default.randomInt(0, 62)];
	return out;
}
function issueNoVncObserverToken(params) {
	const now = params.nowMs ?? Date.now();
	pruneExpiredNoVncObserverTokens(now);
	const token = node_crypto.default.randomBytes(24).toString("hex");
	const expiresAt = resolveNoVncObserverTokenExpiresAt({
		ttlMs: typeof params.ttlMs === "number" && params.ttlMs <= MAX_NOVNC_TOKEN_TTL_MS ? params.ttlMs : void 0,
		nowMs: now
	});
	if (expiresAt === void 0) return token;
	NO_VNC_OBSERVER_TOKENS.set(token, {
		noVncPort: params.noVncPort,
		password: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.password),
		expiresAt
	});
	return token;
}
function consumeNoVncObserverToken(token, nowMs) {
	const now = nowMs ?? Date.now();
	pruneExpiredNoVncObserverTokens(now);
	const normalized = token.trim();
	if (!normalized) return null;
	const entry = NO_VNC_OBSERVER_TOKENS.get(normalized);
	if (!entry) return null;
	NO_VNC_OBSERVER_TOKENS.delete(normalized);
	if (!(0, _gabrielvfonseca_normalization_core_number_coercion.isFutureDateTimestampMs)(entry.expiresAt, { nowMs: now })) return null;
	return {
		noVncPort: entry.noVncPort,
		password: entry.password
	};
}
function buildNoVncObserverTokenUrl(baseUrl, token) {
	return `${baseUrl}/sandbox/novnc?${new URLSearchParams({ token }).toString()}`;
}
//#endregion
//#region src/agents/sandbox/browser.ts
/**
* Sandbox browser container lifecycle.
*
* Starts or reuses Chrome/noVNC containers, exposes authenticated CDP/observer URLs, and tracks browser registry state.
*/
const HOT_BROWSER_WINDOW_MS = 300 * 1e3;
const CDP_SOURCE_RANGE_ENV_KEY = "OPERATOR_BROWSER_CDP_SOURCE_RANGE";
const CDP_AUTH_TOKEN_ENV_KEY = "OPERATOR_BROWSER_CDP_AUTH_TOKEN";
const SANDBOX_BROWSER_IMAGE_CONTRACT_LABEL = "org.operator.sandbox-browser.contract";
function buildSandboxCdpAuthHeader(token) {
	return `Basic ${Buffer.from(`operator:${token}`).toString("base64")}`;
}
function buildSandboxCdpUrl(params) {
	const url = new URL(`http://127.0.0.1:${params.cdpPort}`);
	url.username = "@gabrielvfonseca/operator";
	url.password = params.authToken;
	return url.toString().replace(/\/$/, "");
}
async function waitForSandboxCdp(params) {
	const deadline = Date.now() + Math.max(0, params.timeoutMs);
	const url = `http://127.0.0.1:${params.cdpPort}/json/version`;
	while (Date.now() < deadline) {
		try {
			const ctrl = new AbortController();
			const t = setTimeout(ctrl.abort.bind(ctrl), 1e3);
			try {
				if ((await fetch(url, {
					headers: { Authorization: buildSandboxCdpAuthHeader(params.authToken) },
					signal: ctrl.signal
				})).ok) return true;
			} finally {
				clearTimeout(t);
			}
		} catch {}
		const remainingMs = deadline - Date.now();
		if (remainingMs <= 0) break;
		await new Promise((r) => {
			setTimeout(r, Math.min(150, remainingMs));
		});
	}
	return false;
}
function buildSandboxBrowserResolvedConfig(params) {
	const cdpHost = "127.0.0.1";
	const cdpPortRange = deriveDefaultBrowserCdpPortRange(params.controlPort);
	return {
		enabled: true,
		evaluateEnabled: params.evaluateEnabled,
		controlPort: params.controlPort,
		cdpProtocol: "http",
		cdpHost,
		cdpIsLoopback: true,
		cdpPortRangeStart: cdpPortRange.start,
		cdpPortRangeEnd: cdpPortRange.end,
		remoteCdpTimeoutMs: 1500,
		remoteCdpHandshakeTimeoutMs: 3e3,
		localLaunchTimeoutMs: 15e3,
		localCdpReadyTimeoutMs: 8e3,
		actionTimeoutMs: DEFAULT_BROWSER_ACTION_TIMEOUT_MS,
		color: DEFAULT_OPERATOR_BROWSER_COLOR,
		executablePath: void 0,
		headless: params.headless,
		noSandbox: false,
		attachOnly: true,
		defaultProfile: DEFAULT_OPERATOR_BROWSER_PROFILE_NAME,
		extraArgs: [],
		tabCleanup: {
			enabled: true,
			idleMinutes: 120,
			maxTabsPerSession: 8,
			sweepMinutes: 5
		},
		profiles: { [DEFAULT_OPERATOR_BROWSER_PROFILE_NAME]: {
			cdpPort: params.cdpPort,
			cdpUrl: buildSandboxCdpUrl({
				cdpPort: params.cdpPort,
				authToken: params.cdpAuthToken
			}),
			color: DEFAULT_OPERATOR_BROWSER_COLOR
		} },
		ssrfPolicy: params.ssrfPolicy
	};
}
async function ensureSandboxBrowserImage(image) {
	const result = await require_docker.execDocker([
		"image",
		"inspect",
		"-f",
		`{{ index .Config.Labels "${SANDBOX_BROWSER_IMAGE_CONTRACT_LABEL}" }}`,
		image
	], { allowFailure: true });
	if (result.code === 0) {
		const contract = result.stdout.trim();
		if (contract === "2026-05-12-cdp-relay-auth") return;
		throw new Error(`Sandbox browser image ${image} is stale or incompatible (contract=${contract && contract !== "<no value>" ? contract : "missing"}, expected=${require_constants.SANDBOX_BROWSER_IMAGE_CONTRACT_EPOCH}). Rebuild it with scripts/sandbox-browser-setup.sh.`);
	}
	const stderr = result.stderr.trim();
	if (require_docker.isDockerDaemonUnavailable(stderr)) throw new Error(require_docker.formatDockerDaemonUnavailableError(stderr));
	throw new Error(`Sandbox browser image not found: ${image}. Build it with scripts/sandbox-browser-setup.sh.`);
}
async function ensureDockerNetwork(network, opts) {
	require_validate_sandbox_security.validateNetworkMode(network, { allowContainerNamespaceJoin: opts?.allowContainerNamespaceJoin === true });
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(network) ?? "";
	if (!normalized || normalized === "bridge" || normalized === "none") return;
	if ((await require_docker.execDocker([
		"network",
		"inspect",
		network
	], { allowFailure: true })).code === 0) return;
	await require_docker.execDocker([
		"network",
		"create",
		"--driver",
		"bridge",
		network
	]);
}
async function ensureSandboxBrowser(params) {
	if (!params.cfg.browser.enabled) return null;
	if (!require_tool_policy.isToolAllowed(params.cfg.tools, "browser")) return null;
	const slug = params.cfg.scope === "shared" ? "shared" : require_docker.slugifySessionKey(params.scopeKey);
	const containerName = `${params.cfg.browser.containerPrefix}${slug}`.slice(0, 63);
	let existing = require_browser_bridges.BROWSER_BRIDGES.get(params.scopeKey);
	const stopExistingForContainer = async () => {
		await require_browser_bridges.stopCachedBrowserBridgesForContainer(containerName);
		existing = require_browser_bridges.BROWSER_BRIDGES.get(params.scopeKey);
	};
	const state = await require_docker.dockerContainerState(containerName);
	const browserImage = params.cfg.browser.image ?? "operator-sandbox-browser:bookworm-slim";
	const cdpSourceRange = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.cfg.browser.cdpSourceRange);
	const browserDockerCfg = require_config.resolveSandboxBrowserDockerCreateConfig({
		docker: params.cfg.docker,
		browser: {
			...params.cfg.browser,
			image: browserImage
		}
	});
	const readOnlyWorkspaceSkillMounts = require_workspace_mounts.resolveReadOnlyWorkspaceSkillMounts({
		workspaceDir: params.workspaceDir,
		agentWorkspaceDir: params.agentWorkspaceDir,
		skillsWorkspaceDir: params.skillsWorkspaceDir,
		workdir: params.cfg.docker.workdir,
		workspaceAccess: params.cfg.workspaceAccess
	});
	const expectedHash = require_docker.computeSandboxBrowserConfigHash({
		docker: browserDockerCfg,
		dockerEnvPolicyEpoch: require_docker.resolveDockerEnvPolicyEpoch(browserDockerCfg.env),
		browser: {
			cdpPort: params.cfg.browser.cdpPort,
			vncPort: params.cfg.browser.vncPort,
			noVncPort: params.cfg.browser.noVncPort,
			headless: params.cfg.browser.headless,
			enableNoVnc: params.cfg.browser.enableNoVnc,
			autoStartTimeoutMs: params.cfg.browser.autoStartTimeoutMs,
			cdpSourceRange
		},
		securityEpoch: require_constants.SANDBOX_BROWSER_SECURITY_HASH_EPOCH,
		workspaceAccess: params.cfg.workspaceAccess,
		workspaceDir: params.workspaceDir,
		agentWorkspaceDir: params.agentWorkspaceDir,
		mountFormatVersion: 3,
		createArgsEpoch: require_constants.SANDBOX_DOCKER_CREATE_ARGS_EPOCH,
		readOnlyWorkspaceSkillMounts: require_workspace_mounts.formatReadOnlyWorkspaceSkillMountHashState(readOnlyWorkspaceSkillMounts)
	});
	const now = Date.now();
	let hasContainer = state.exists;
	let running = state.running;
	let currentHash = null;
	let hashMismatch = false;
	const noVncEnabled = isNoVncEnabled(params.cfg.browser);
	let noVncPassword;
	let cdpAuthToken;
	if (hasContainer) {
		if (noVncEnabled) noVncPassword = await require_docker.readDockerContainerEnvVar(containerName, "OPERATOR_BROWSER_NOVNC_PASSWORD") ?? void 0;
		cdpAuthToken = await require_docker.readDockerContainerEnvVar(containerName, CDP_AUTH_TOKEN_ENV_KEY) ?? void 0;
		if (!cdpAuthToken) {
			require_runtime.defaultRuntime.log(`Removing stale sandbox browser container ${containerName} because it lacks the current CDP relay auth contract; it will be recreated.`);
			await stopExistingForContainer();
			await require_docker.execDocker([
				"rm",
				"-f",
				containerName
			], { allowFailure: true });
			hasContainer = false;
			running = false;
		}
	}
	if (hasContainer) {
		const registryEntry = (await require_docker.readBrowserRegistry()).entries.find((entry) => entry.containerName === containerName);
		currentHash = await require_docker.readDockerContainerLabel(containerName, "operator.configHash");
		hashMismatch = !currentHash || currentHash !== expectedHash;
		if (!currentHash) {
			currentHash = registryEntry?.configHash ?? null;
			hashMismatch = !currentHash || currentHash !== expectedHash;
		}
		if (hashMismatch) {
			const lastUsedAtMs = registryEntry?.lastUsedAtMs;
			if (running && (typeof lastUsedAtMs !== "number" || now - lastUsedAtMs < HOT_BROWSER_WINDOW_MS)) {
				const hint = (() => {
					if (params.cfg.scope === "session") return `openclaw sandbox recreate --browser --session ${params.scopeKey}`;
					if (params.cfg.scope === "agent") return `openclaw sandbox recreate --browser --agent ${require_docker.resolveSandboxAgentId(params.scopeKey) ?? "main"}`;
					return "openclaw sandbox recreate --browser --all";
				})();
				require_runtime.defaultRuntime.log(`Sandbox browser config changed for ${containerName} (recently used). Recreate to apply: ${hint}`);
			} else {
				await stopExistingForContainer();
				await require_docker.execDocker([
					"rm",
					"-f",
					containerName
				], { allowFailure: true });
				hasContainer = false;
				running = false;
			}
		}
	}
	if (!hasContainer) {
		if (noVncEnabled) noVncPassword = generateNoVncPassword();
		cdpAuthToken = node_crypto.default.randomBytes(24).toString("hex");
		await ensureDockerNetwork(browserDockerCfg.network, { allowContainerNamespaceJoin: browserDockerCfg.dangerouslyAllowContainerNamespaceJoin === true });
		await ensureSandboxBrowserImage(browserImage);
		const args = require_docker.buildSandboxCreateArgs({
			name: containerName,
			cfg: browserDockerCfg,
			scopeKey: params.scopeKey,
			labels: {
				"operator.sandboxBrowser": "1",
				"operator.browserConfigEpoch": require_constants.SANDBOX_BROWSER_SECURITY_HASH_EPOCH
			},
			configHash: expectedHash,
			includeBinds: false,
			bindSourceRoots: [params.workspaceDir, params.agentWorkspaceDir]
		});
		require_workspace_mounts.appendWorkspaceMountArgs({
			args,
			workspaceDir: params.workspaceDir,
			agentWorkspaceDir: params.agentWorkspaceDir,
			skillsWorkspaceDir: params.skillsWorkspaceDir,
			workdir: params.cfg.docker.workdir,
			workspaceAccess: params.cfg.workspaceAccess,
			readOnlyWorkspaceSkillMounts,
			includeReadOnlyWorkspaceSkillMounts: false
		});
		if (browserDockerCfg.binds?.length) for (const bind of browserDockerCfg.binds) args.push("-v", bind);
		require_workspace_mounts.appendReadOnlyWorkspaceSkillMountArgs({
			args,
			readOnlyWorkspaceSkillMounts
		});
		args.push("-p", `127.0.0.1::${params.cfg.browser.cdpPort}`);
		if (noVncEnabled) args.push("-p", `127.0.0.1::${params.cfg.browser.noVncPort}`);
		args.push("-e", `OPERATOR_BROWSER_HEADLESS=${params.cfg.browser.headless ? "1" : "0"}`);
		args.push("-e", `OPERATOR_BROWSER_ENABLE_NOVNC=${params.cfg.browser.enableNoVnc ? "1" : "0"}`);
		args.push("-e", `OPERATOR_BROWSER_CDP_PORT=${params.cfg.browser.cdpPort}`);
		args.push("-e", `${CDP_AUTH_TOKEN_ENV_KEY}=${cdpAuthToken}`);
		args.push("-e", `OPERATOR_BROWSER_AUTO_START_TIMEOUT_MS=${params.cfg.browser.autoStartTimeoutMs}`);
		if (cdpSourceRange) args.push("-e", `${CDP_SOURCE_RANGE_ENV_KEY}=${cdpSourceRange}`);
		args.push("-e", `OPERATOR_BROWSER_VNC_PORT=${params.cfg.browser.vncPort}`);
		args.push("-e", `OPERATOR_BROWSER_NOVNC_PORT=${params.cfg.browser.noVncPort}`);
		args.push("-e", "OPERATOR_BROWSER_NO_SANDBOX=1");
		if (noVncEnabled && noVncPassword) args.push("-e", `${NOVNC_PASSWORD_ENV_KEY}=${noVncPassword}`);
		args.push(browserImage);
		await require_docker.execDocker(args);
		await require_docker.execDocker(["start", containerName]);
	} else if (!running) await require_docker.execDocker(["start", containerName]);
	const mappedCdp = await require_docker.readDockerPort(containerName, params.cfg.browser.cdpPort);
	if (!mappedCdp) throw new Error(`Failed to resolve CDP port mapping for ${containerName}.`);
	if (!cdpAuthToken) throw new Error(`Failed to resolve CDP relay auth for ${containerName}.`);
	const cdpUrl = buildSandboxCdpUrl({
		cdpPort: mappedCdp,
		authToken: cdpAuthToken
	});
	const mappedNoVnc = noVncEnabled ? await require_docker.readDockerPort(containerName, params.cfg.browser.noVncPort) : null;
	if (noVncEnabled && !noVncPassword) noVncPassword = await require_docker.readDockerContainerEnvVar(containerName, "OPERATOR_BROWSER_NOVNC_PASSWORD") ?? void 0;
	const existingProfile = existing ? resolveProfile(existing.bridge.state.resolved, DEFAULT_OPERATOR_BROWSER_PROFILE_NAME) : null;
	const desiredEvaluateEnabled = params.evaluateEnabled ?? true;
	let desiredAuthToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.bridgeAuth?.token);
	let desiredAuthPassword = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.bridgeAuth?.password);
	if (!desiredAuthToken && !desiredAuthPassword) {
		desiredAuthToken = existing?.authToken;
		desiredAuthPassword = existing?.authPassword;
		if (!desiredAuthToken && !desiredAuthPassword) desiredAuthToken = node_crypto.default.randomBytes(24).toString("hex");
	}
	const policyMatches = !existing || require_fetch_guard.isSameSsrFPolicy(existing.bridge.state.resolved.ssrfPolicy, params.ssrfPolicy);
	const authMatches = !existing || existing.authToken === desiredAuthToken && existing.authPassword === desiredAuthPassword;
	const evaluateMatches = !existing || existing.bridge.state.resolved.evaluateEnabled === desiredEvaluateEnabled;
	const canReuse = Boolean(existing?.bridge.server.listening && existing.containerName === containerName && existingProfile?.cdpPort === mappedCdp && existingProfile?.cdpUrl === cdpUrl && policyMatches && authMatches && evaluateMatches);
	if (existing && !canReuse) await require_browser_bridges.stopCachedBrowserBridge(params.scopeKey, existing);
	const bridge = canReuse ? existing?.bridge ?? null : null;
	const ensureBridge = async () => {
		if (bridge) return bridge;
		const onEnsureAttachTarget = params.cfg.browser.autoStart ? async () => {
			const currentState = await require_docker.dockerContainerState(containerName);
			if (currentState.exists && !currentState.running) await require_docker.execDocker(["start", containerName]);
			if (!await waitForSandboxCdp({
				cdpPort: mappedCdp,
				authToken: cdpAuthToken,
				timeoutMs: params.cfg.browser.autoStartTimeoutMs
			})) {
				await require_docker.execDocker([
					"rm",
					"-f",
					containerName
				], { allowFailure: true });
				throw new Error(`Sandbox browser CDP did not become reachable on 127.0.0.1:${mappedCdp} within ${params.cfg.browser.autoStartTimeoutMs}ms. The hung container has been forcefully removed.`);
			}
		} : void 0;
		return await require_browser_bridges.startBrowserBridgeServer({
			resolved: buildSandboxBrowserResolvedConfig({
				controlPort: 0,
				cdpPort: mappedCdp,
				cdpAuthToken,
				headless: params.cfg.browser.headless,
				evaluateEnabled: desiredEvaluateEnabled,
				ssrfPolicy: params.ssrfPolicy
			}),
			authToken: desiredAuthToken,
			authPassword: desiredAuthPassword,
			onEnsureAttachTarget,
			resolveSandboxNoVncToken: consumeNoVncObserverToken
		});
	};
	const resolvedBridge = await ensureBridge();
	if (!bridge) require_browser_bridges.BROWSER_BRIDGES.set(params.scopeKey, {
		bridge: resolvedBridge,
		containerName,
		authToken: desiredAuthToken,
		authPassword: desiredAuthPassword
	});
	await require_docker.updateBrowserRegistry({
		containerName,
		sessionKey: params.scopeKey,
		createdAtMs: now,
		lastUsedAtMs: now,
		image: browserImage,
		configHash: hashMismatch && running ? currentHash ?? void 0 : expectedHash,
		cdpPort: mappedCdp,
		noVncPort: mappedNoVnc ?? void 0
	});
	const noVncUrl = mappedNoVnc && noVncEnabled ? (() => {
		const token = issueNoVncObserverToken({
			noVncPort: mappedNoVnc,
			password: noVncPassword
		});
		return buildNoVncObserverTokenUrl(resolvedBridge.baseUrl, token);
	})() : void 0;
	return {
		bridgeUrl: resolvedBridge.baseUrl,
		noVncUrl,
		containerName
	};
}
//#endregion
//#region src/agents/sandbox/docker-user.ts
async function resolveSandboxDockerUser(params) {
	if (params.docker.user?.trim()) return params.docker;
	const stat = params.stat ?? ((workspaceDir) => node_fs_promises.default.stat(workspaceDir));
	try {
		const workspaceStat = await stat(params.workspaceDir);
		const uid = Number.isInteger(workspaceStat.uid) ? workspaceStat.uid : null;
		const gid = Number.isInteger(workspaceStat.gid) ? workspaceStat.gid : null;
		if (uid === null || gid === null || uid < 0 || gid < 0) return params.docker;
		return {
			...params.docker,
			user: `${uid}:${gid}`
		};
	} catch {
		return params.docker;
	}
}
//#endregion
//#region src/agents/sandbox/fs-bridge-path-safety.ts
/**
* Host/container path safety guard for the sandbox filesystem bridge.
*
* Proves requested container paths stay inside allowed mounts before host paths are opened or mutated.
*/
/** Validates sandbox fs bridge paths against mount, symlink, and writability boundaries. */
var SandboxFsPathGuard = class {
	constructor(params) {
		this.mountsByContainer = params.mountsByContainer;
		this.runCommand = params.runCommand;
	}
	async assertPathChecks(checks) {
		for (const check of checks) await this.assertPathSafety(check.target, check.options);
	}
	async assertPathSafety(target, options) {
		const guarded = await this.openBoundaryWithinRequiredMount(target, options.action, {
			aliasPolicy: options.aliasPolicy,
			allowedType: options.allowedType
		});
		await this.assertGuardedPathSafety(target, options, guarded);
	}
	async openReadableFile(target) {
		const opened = await this.openBoundaryWithinRequiredMount(target, "read files");
		if (!opened.ok) throw opened.error instanceof Error ? opened.error : /* @__PURE__ */ new Error(`Sandbox boundary checks failed; cannot read files: ${target.containerPath}`);
		return opened;
	}
	resolveRequiredMount(containerPath, action) {
		const lexicalMount = this.resolveMountByContainerPath(containerPath);
		if (!lexicalMount) throw new Error(`Sandbox path escapes allowed mounts; cannot ${action}: ${containerPath}`);
		return lexicalMount;
	}
	finalizePinnedEntry(params) {
		const relativeParentPath = node_path.default.posix.relative(params.mount.containerRoot, params.parentPath);
		if (require_path_utils.relativePathEscapesContainerRoot(relativeParentPath)) throw new Error(`Sandbox path escapes allowed mounts; cannot ${params.action}: ${params.targetPath}`);
		return {
			mountRootPath: params.mount.containerRoot,
			relativeParentPath: relativeParentPath === "." ? "" : relativeParentPath,
			basename: params.basename
		};
	}
	async assertGuardedPathSafety(target, options, guarded) {
		if (!guarded.ok) {
			if (guarded.reason !== "path") {
				if (!(options.allowedType === "directory" && this.pathIsExistingDirectory(target.hostPath))) throw guarded.error instanceof Error ? guarded.error : /* @__PURE__ */ new Error(`Sandbox boundary checks failed; cannot ${options.action}: ${target.containerPath}`);
			}
		} else node_fs.default.closeSync(guarded.fd);
		const canonicalContainerPath = await this.resolveCanonicalContainerPath({
			containerPath: target.containerPath,
			allowFinalSymlinkForUnlink: options.aliasPolicy?.allowFinalSymlinkForUnlink === true
		});
		const canonicalMount = this.resolveRequiredMount(canonicalContainerPath, options.action);
		if (options.requireWritable && !canonicalMount.writable) throw new Error(`Sandbox path is read-only; cannot ${options.action}: ${target.containerPath}`);
	}
	async openBoundaryWithinRequiredMount(target, action, options) {
		const lexicalMount = this.resolveRequiredMount(target.containerPath, action);
		return await (0, _openclaw_fs_safe_advanced.openRootFile)({
			absolutePath: target.hostPath,
			rootPath: lexicalMount.hostRoot,
			boundaryLabel: "sandbox mount root",
			aliasPolicy: options?.aliasPolicy,
			allowedType: options?.allowedType
		});
	}
	resolvePinnedEntry(target, action) {
		const basename = node_path.default.posix.basename(target.containerPath);
		if (!basename || basename === "." || basename === "/") throw new Error(`Invalid sandbox entry target: ${target.containerPath}`);
		const parentPath = require_path_utils.normalizeContainerPath(node_path.default.posix.dirname(target.containerPath));
		const mount = this.resolveRequiredMount(parentPath, action);
		return this.finalizePinnedEntry({
			mount,
			parentPath,
			basename,
			targetPath: target.containerPath,
			action
		});
	}
	async resolveAnchoredSandboxEntry(target, action) {
		const basename = node_path.default.posix.basename(target.containerPath);
		if (!basename || basename === "." || basename === "/") throw new Error(`Invalid sandbox entry target: ${target.containerPath}`);
		const parentPath = require_path_utils.normalizeContainerPath(node_path.default.posix.dirname(target.containerPath));
		const canonicalParentPath = await this.resolveCanonicalContainerPath({
			containerPath: parentPath,
			allowFinalSymlinkForUnlink: false
		});
		this.resolveRequiredMount(canonicalParentPath, action);
		return {
			canonicalParentPath,
			basename
		};
	}
	async resolveAnchoredPinnedEntry(target, action) {
		const anchoredTarget = await this.resolveAnchoredSandboxEntry(target, action);
		const mount = this.resolveRequiredMount(anchoredTarget.canonicalParentPath, action);
		return this.finalizePinnedEntry({
			mount,
			parentPath: anchoredTarget.canonicalParentPath,
			basename: anchoredTarget.basename,
			targetPath: target.containerPath,
			action
		});
	}
	resolvePinnedDirectoryEntry(target, action) {
		const mount = this.resolveRequiredMount(target.containerPath, action);
		const relativePath = node_path.default.posix.relative(mount.containerRoot, target.containerPath);
		if (require_path_utils.relativePathEscapesContainerRoot(relativePath)) throw new Error(`Sandbox path escapes allowed mounts; cannot ${action}: ${target.containerPath}`);
		return {
			mountRootPath: mount.containerRoot,
			relativePath: relativePath === "." ? "" : relativePath
		};
	}
	pathIsExistingDirectory(hostPath) {
		try {
			return node_fs.default.statSync(hostPath).isDirectory();
		} catch {
			return false;
		}
	}
	resolveMountByContainerPath(containerPath) {
		const normalized = require_path_utils.normalizeContainerPath(containerPath);
		for (const mount of this.mountsByContainer) if (require_path_utils.isPathInsideContainerRoot(require_path_utils.normalizeContainerPath(mount.containerRoot), normalized)) return mount;
		return null;
	}
	async resolveCanonicalContainerPath(params) {
		const script = [
			"set -eu",
			"target=\"$1\"",
			"allow_final=\"$2\"",
			"suffix=\"\"",
			"probe=\"$target\"",
			"if [ \"$allow_final\" = \"1\" ] && [ -L \"$target\" ]; then probe=$(dirname -- \"$target\"); fi",
			"cursor=\"$probe\"",
			"while [ ! -e \"$cursor\" ] && [ ! -L \"$cursor\" ]; do",
			"  parent=$(dirname -- \"$cursor\")",
			"  if [ \"$parent\" = \"$cursor\" ]; then break; fi",
			"  base=$(basename -- \"$cursor\")",
			"  suffix=\"/$base$suffix\"",
			"  cursor=\"$parent\"",
			"done",
			"canonical=$(readlink -f -- \"$cursor\")",
			"printf \"%s%s\\n\" \"$canonical\" \"$suffix\""
		].join("\n");
		const canonical = (await this.runCommand(script, { args: [params.containerPath, params.allowFinalSymlinkForUnlink ? "1" : "0"] })).stdout.toString("utf8").trim();
		if (!canonical.startsWith("/")) throw new Error(`Failed to resolve canonical sandbox path: ${params.containerPath}`);
		return require_path_utils.normalizeContainerPath(canonical);
	}
};
//#endregion
//#region src/agents/sandbox/fs-bridge-shell-command-plans.ts
/** Builds a stat command that anchors the path at its canonical parent before reading metadata. */
function buildStatPlan(target, anchoredTarget) {
	return {
		checks: [{
			target,
			options: { action: "stat files" }
		}],
		script: "set -eu\ncd -- \"$1\"\nLC_ALL=C stat -c \"%F|%s|%y\" -- \"$2\"",
		args: [anchoredTarget.canonicalParentPath, anchoredTarget.basename],
		allowFailure: true
	};
}
//#endregion
//#region src/agents/sandbox/fs-paths.ts
/**
* Sandbox filesystem mount and path resolution helpers.
*
* Builds the container-to-host mount table and maps requested sandbox paths to writable/read-only host targets.
*/
function parseSandboxBindMount(spec) {
	const trimmed = spec.trim();
	if (!trimmed) return null;
	const parsed = require_network_mode.splitSandboxBindSpec(trimmed);
	if (!parsed) return null;
	const hostToken = parsed.host.trim();
	const containerToken = parsed.container.trim();
	if (!hostToken || !containerToken || !node_path.default.posix.isAbsolute(containerToken)) return null;
	const optionsToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parsed.options) ?? "";
	const writable = !(optionsToken ? (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(optionsToken.split(",")) : []).includes("ro");
	return {
		hostRoot: node_path.default.resolve(hostToken),
		containerRoot: require_path_utils.normalizeContainerPath(containerToken),
		writable
	};
}
function buildSandboxFsMounts(sandbox) {
	const mounts = [{
		hostRoot: node_path.default.resolve(sandbox.workspaceDir),
		containerRoot: require_path_utils.normalizeContainerPath(sandbox.containerWorkdir),
		writable: sandbox.workspaceAccess === "rw",
		source: "workspace"
	}];
	if (sandbox.workspaceAccess !== "none" && node_path.default.resolve(sandbox.agentWorkspaceDir) !== node_path.default.resolve(sandbox.workspaceDir)) mounts.push({
		hostRoot: node_path.default.resolve(sandbox.agentWorkspaceDir),
		containerRoot: require_constants.SANDBOX_AGENT_WORKSPACE_MOUNT,
		writable: sandbox.workspaceAccess === "rw",
		source: "agent"
	});
	for (const mount of require_workspace_mounts.resolveReadOnlyWorkspaceSkillMounts({
		workspaceDir: sandbox.workspaceDir,
		agentWorkspaceDir: sandbox.agentWorkspaceDir,
		skillsWorkspaceDir: sandbox.skillsWorkspaceDir,
		workdir: sandbox.containerWorkdir,
		workspaceAccess: sandbox.workspaceAccess
	})) mounts.push({
		hostRoot: node_path.default.resolve(mount.hostPath),
		containerRoot: require_path_utils.normalizeContainerPath(mount.containerPath),
		writable: false,
		source: "protectedSkill"
	});
	for (const bind of sandbox.docker.binds ?? []) {
		const parsed = parseSandboxBindMount(bind);
		if (!parsed) continue;
		mounts.push({
			hostRoot: parsed.hostRoot,
			containerRoot: parsed.containerRoot,
			writable: parsed.writable,
			source: "bind"
		});
	}
	return dedupeMounts(mounts);
}
function resolveSandboxFsPathWithMounts(params) {
	const mountsByContainer = [...params.mounts].toSorted(compareMountsByContainerPath);
	const mountsByHost = [...params.mounts].toSorted(compareMountsByHostPath);
	const input = params.filePath;
	const inputPosix = normalizePosixInput(input);
	if (node_path.default.posix.isAbsolute(inputPosix)) {
		const containerMount = findMountByContainerPath(mountsByContainer, inputPosix);
		if (containerMount) return resolveMountedContainerPath({
			mount: containerMount,
			containerPath: inputPosix,
			defaultContainerRoot: params.defaultContainerRoot
		});
	}
	if (!node_path.default.posix.isAbsolute(inputPosix)) {
		const protectedContainerCandidate = resolveRelativeContainerCandidate({
			inputPosix,
			cwd: params.cwd,
			defaultContainerRoot: params.defaultContainerRoot,
			mountsByHost
		});
		const protectedContainerMount = findMountByContainerPath(mountsByContainer, protectedContainerCandidate);
		if (protectedContainerMount?.source === "protectedSkill") return resolveMountedContainerPath({
			mount: protectedContainerMount,
			containerPath: protectedContainerCandidate,
			defaultContainerRoot: params.defaultContainerRoot
		});
	}
	const hostResolved = require_sandbox_paths.resolveSandboxInputPath(input, params.cwd);
	const hostMount = findMountByHostPath(mountsByHost, hostResolved);
	if (hostMount) {
		const relHost = node_path.default.relative(hostMount.hostRoot, hostResolved);
		const relPosix = relHost ? relHost.split(node_path.default.sep).join(node_path.default.posix.sep) : "";
		const containerPath = relPosix ? node_path.default.posix.join(hostMount.containerRoot, relPosix) : hostMount.containerRoot;
		return {
			hostPath: hostResolved,
			containerPath,
			relativePath: toDisplayRelative({
				containerPath,
				defaultContainerRoot: params.defaultContainerRoot
			}),
			writable: hostMount.writable
		};
	}
	const escapeMessage = formatSandboxRootEscapeMessage({
		input,
		defaultWorkspaceRoot: params.defaultWorkspaceRoot,
		defaultContainerRoot: params.defaultContainerRoot
	});
	try {
		require_sandbox_paths.resolveSandboxPath({
			filePath: input,
			cwd: params.cwd,
			root: params.defaultWorkspaceRoot
		});
	} catch {
		throw new Error(escapeMessage);
	}
	throw new Error(escapeMessage);
}
function resolveMountedContainerPath(params) {
	const rel = node_path.default.posix.relative(params.mount.containerRoot, params.containerPath);
	const hostPath = rel ? node_path.default.resolve(params.mount.hostRoot, ...toHostSegments(rel)) : params.mount.hostRoot;
	const containerPath = rel ? node_path.default.posix.join(params.mount.containerRoot, rel) : params.mount.containerRoot;
	return {
		hostPath,
		containerPath,
		relativePath: toDisplayRelative({
			containerPath,
			defaultContainerRoot: params.defaultContainerRoot
		}),
		writable: params.mount.writable
	};
}
function resolveRelativeContainerCandidate(params) {
	const cwdMount = findMountByHostPath(params.mountsByHost, node_path.default.resolve(params.cwd));
	if (cwdMount) {
		const relHost = node_path.default.relative(cwdMount.hostRoot, node_path.default.resolve(params.cwd));
		const relPosix = relHost ? relHost.split(node_path.default.sep).join(node_path.default.posix.sep) : "";
		const containerCwd = relPosix ? node_path.default.posix.join(cwdMount.containerRoot, relPosix) : cwdMount.containerRoot;
		return require_path_utils.normalizeContainerPath(node_path.default.posix.resolve(containerCwd, params.inputPosix));
	}
	const cwdPosix = normalizePosixInput(params.cwd);
	if (node_path.default.posix.isAbsolute(cwdPosix)) return require_path_utils.normalizeContainerPath(node_path.default.posix.resolve(cwdPosix, params.inputPosix));
	return require_path_utils.normalizeContainerPath(node_path.default.posix.resolve(params.defaultContainerRoot, params.inputPosix));
}
function formatSandboxRootEscapeMessage(params) {
	const containerRoot = require_path_utils.normalizeContainerPath(params.defaultContainerRoot);
	return `Path escapes sandbox root (${shortenHomePath(node_path.default.resolve(params.defaultWorkspaceRoot))}; container root ${containerRoot}): ${params.input}. Use a path under ${containerRoot}/ instead.`;
}
function shortenHomePath(value) {
	const home = node_os.default.homedir();
	if (value === home || value.startsWith(`${home}${node_path.default.sep}`)) return `~${value.slice(home.length)}`;
	return value;
}
function compareMountsByContainerPath(a, b) {
	const byLength = b.containerRoot.length - a.containerRoot.length;
	if (byLength !== 0) return byLength;
	return mountSourcePriority(b.source) - mountSourcePriority(a.source);
}
function compareMountsByHostPath(a, b) {
	const byLength = b.hostRoot.length - a.hostRoot.length;
	if (byLength !== 0) return byLength;
	return mountSourcePriority(b.source) - mountSourcePriority(a.source);
}
function mountSourcePriority(source) {
	if (source === "protectedSkill") return 3;
	if (source === "bind") return 2;
	if (source === "agent") return 1;
	return 0;
}
function dedupeMounts(mounts) {
	const seen = /* @__PURE__ */ new Set();
	const deduped = [];
	for (const mount of mounts) {
		const key = `${mount.hostRoot}=>${mount.containerRoot}`;
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(mount);
	}
	return deduped;
}
function findMountByContainerPath(mounts, target) {
	for (const mount of mounts) if (require_path_utils.isPathInsideContainerRoot(mount.containerRoot, target)) return mount;
	return null;
}
function findMountByHostPath(mounts, target) {
	for (const mount of mounts) if (isPathInsideHost(mount.hostRoot, target)) return mount;
	return null;
}
function isPathInsideHost(root, target) {
	const canonicalRoot = require_network_mode.resolveSandboxHostPathViaExistingAncestor(node_path.default.resolve(root));
	const resolvedTarget = node_path.default.resolve(target);
	const canonicalTargetParent = require_network_mode.resolveSandboxHostPathViaExistingAncestor(node_path.default.dirname(resolvedTarget));
	return (0, _openclaw_fs_safe_path.isPathInside)(canonicalRoot, node_path.default.resolve(canonicalTargetParent, node_path.default.basename(resolvedTarget)));
}
function toHostSegments(relativePosix) {
	return relativePosix.split("/").filter(Boolean);
}
function toDisplayRelative(params) {
	const rel = node_path.default.posix.relative(params.defaultContainerRoot, params.containerPath);
	if (!rel) return "";
	if (!require_path_utils.relativePathEscapesContainerRoot(rel)) return rel;
	return params.containerPath;
}
function normalizePosixInput(value) {
	return value.replace(/\\/g, "/").trim();
}
//#endregion
//#region src/agents/sandbox/fs-bridge.ts
/**
* Sandbox filesystem bridge implementation.
*
* Resolves container paths to mounted host paths and executes guarded reads, writes, stats, renames, and deletes.
*/
/** Create the filesystem bridge for local Docker-style mounted sandboxes. */
function createSandboxFsBridge(params) {
	return new SandboxFsBridgeImpl(params.sandbox);
}
var SandboxFsBridgeImpl = class {
	constructor(sandbox) {
		this.sandbox = sandbox;
		this.mounts = buildSandboxFsMounts(sandbox);
		const mountsByContainer = [...this.mounts].toSorted((a, b) => b.containerRoot.length - a.containerRoot.length);
		this.pathGuard = new SandboxFsPathGuard({
			mountsByContainer,
			runCommand: (script, options) => this.runCommand(script, options)
		});
	}
	resolvePath(params) {
		const target = this.resolveResolvedPath(params);
		return {
			hostPath: target.hostPath,
			relativePath: target.relativePath,
			containerPath: target.containerPath
		};
	}
	async readFile(params) {
		const target = this.resolveResolvedPath(params);
		return this.readPinnedFile(target);
	}
	async writeFile(params) {
		const target = this.resolveResolvedPath(params);
		this.ensureWriteAccess(target, "write files");
		const writeCheck = {
			target,
			options: {
				action: "write files",
				requireWritable: true
			}
		};
		await this.pathGuard.assertPathSafety(target, writeCheck.options);
		const buffer = Buffer.isBuffer(params.data) ? params.data : Buffer.from(params.data, params.encoding ?? "utf8");
		const pinnedWriteTarget = await this.pathGuard.resolveAnchoredPinnedEntry(target, "write files");
		await this.runCheckedCommand({
			...require_browser_bridges.buildPinnedWritePlan({
				check: writeCheck,
				pinned: pinnedWriteTarget,
				mkdir: params.mkdir !== false
			}),
			stdin: buffer,
			signal: params.signal
		});
	}
	async mkdirp(params) {
		const target = this.resolveResolvedPath(params);
		this.ensureWriteAccess(target, "create directories");
		const mkdirCheck = {
			target,
			options: {
				action: "create directories",
				requireWritable: true,
				allowedType: "directory"
			}
		};
		await this.runCheckedCommand({
			...require_browser_bridges.buildPinnedMkdirpPlan({
				check: mkdirCheck,
				pinned: this.pathGuard.resolvePinnedDirectoryEntry(target, "create directories")
			}),
			signal: params.signal
		});
	}
	async remove(params) {
		const target = this.resolveResolvedPath(params);
		this.ensureWriteAccess(target, "remove files");
		const removeCheck = {
			target,
			options: {
				action: "remove files",
				requireWritable: true
			}
		};
		await this.runCheckedCommand({
			...require_browser_bridges.buildPinnedRemovePlan({
				check: removeCheck,
				pinned: this.pathGuard.resolvePinnedEntry(target, "remove files"),
				recursive: params.recursive,
				force: params.force
			}),
			signal: params.signal
		});
	}
	async rename(params) {
		const from = this.resolveResolvedPath({
			filePath: params.from,
			cwd: params.cwd
		});
		const to = this.resolveResolvedPath({
			filePath: params.to,
			cwd: params.cwd
		});
		this.ensureWriteAccess(from, "rename files");
		this.ensureWriteAccess(to, "rename files");
		const fromCheck = {
			target: from,
			options: {
				action: "rename files",
				requireWritable: true
			}
		};
		const toCheck = {
			target: to,
			options: {
				action: "rename files",
				requireWritable: true
			}
		};
		await this.runCheckedCommand({
			...require_browser_bridges.buildPinnedRenamePlan({
				fromCheck,
				toCheck,
				from: this.pathGuard.resolvePinnedEntry(from, "rename files"),
				to: this.pathGuard.resolvePinnedEntry(to, "rename files")
			}),
			signal: params.signal
		});
	}
	async stat(params) {
		const target = this.resolveResolvedPath(params);
		const anchoredTarget = await this.pathGuard.resolveAnchoredSandboxEntry(target, "stat files");
		const result = await this.runPlannedCommand(buildStatPlan(target, anchoredTarget), params.signal);
		if (result.code !== 0) {
			const stderr = result.stderr.toString("utf8");
			if (stderr.includes("No such file or directory")) return null;
			const message = stderr.trim() || `stat failed with code ${result.code}`;
			throw new Error(`stat failed for ${target.containerPath}: ${message}`);
		}
		const [typeRaw, sizeRaw, mtimeRaw] = result.stdout.toString("utf8").trim().split("|");
		return {
			type: coerceStatType(typeRaw),
			size: require_browser_bridges.parseSandboxStatSize(sizeRaw),
			mtimeMs: require_browser_bridges.parseSandboxStatMtimeMs(mtimeRaw)
		};
	}
	async runCommand(script, options = {}) {
		const backend = this.sandbox.backend;
		if (backend) return await backend.runShellCommand({
			script,
			args: options.args,
			stdin: options.stdin,
			allowFailure: options.allowFailure,
			signal: options.signal
		});
		return await require_browser_bridges.runDockerSandboxShellCommand({
			containerName: this.sandbox.containerName,
			script,
			args: options.args,
			stdin: options.stdin,
			allowFailure: options.allowFailure,
			signal: options.signal
		});
	}
	async readPinnedFile(target) {
		const opened = await this.pathGuard.openReadableFile(target);
		try {
			return node_fs.default.readFileSync(opened.fd);
		} finally {
			node_fs.default.closeSync(opened.fd);
		}
	}
	async runCheckedCommand(plan) {
		await this.pathGuard.assertPathChecks(plan.checks);
		if (plan.recheckBeforeCommand) await this.pathGuard.assertPathChecks(plan.checks);
		return await this.runCommand(plan.script, {
			args: plan.args,
			stdin: plan.stdin,
			allowFailure: plan.allowFailure,
			signal: plan.signal
		});
	}
	async runPlannedCommand(plan, signal) {
		return await this.runCheckedCommand({
			...plan,
			signal
		});
	}
	ensureWriteAccess(target, action) {
		if (!allowsWrites(this.sandbox.workspaceAccess) || !target.writable) throw new Error(`Sandbox path is read-only; cannot ${action}: ${target.containerPath}`);
	}
	resolveResolvedPath(params) {
		return resolveSandboxFsPathWithMounts({
			filePath: params.filePath,
			cwd: params.cwd ?? this.sandbox.workspaceDir,
			defaultWorkspaceRoot: this.sandbox.workspaceDir,
			defaultContainerRoot: this.sandbox.containerWorkdir,
			mounts: this.mounts
		});
	}
};
function allowsWrites(access) {
	return access === "rw";
}
function coerceStatType(typeRaw) {
	if (!typeRaw) return "other";
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(typeRaw) ?? "";
	if (normalized.includes("directory")) return "directory";
	if (normalized.includes("file")) return "file";
	return "other";
}
//#endregion
//#region src/agents/sandbox/context.ts
async function ensureSandboxWorkspaceLayout(params) {
	const { cfg, rawSessionKey } = params;
	const { agentWorkspaceDir, sandboxWorkspaceDir, scopeKey, skillsWorkspaceDir, workspaceDir } = require_docker.resolveSandboxWorkspaceLayoutPaths({
		cfg,
		rawSessionKey,
		workspaceDir: params.workspaceDir
	});
	return {
		agentWorkspaceDir,
		scopeKey,
		sandboxWorkspaceDir,
		skillsWorkspaceDir,
		workspaceDir
	};
}
function resolveSandboxSession(params) {
	const rawSessionKey = params.sessionKey?.trim();
	if (!rawSessionKey) return null;
	const runtime = require_runtime_status.resolveSandboxRuntimeStatus({
		cfg: params.config,
		agentId: params.agentId,
		sessionKey: rawSessionKey
	});
	if (!runtime.sandboxed) return null;
	return {
		rawSessionKey,
		runtime,
		cfg: require_config.resolveSandboxConfigForAgent(params.config, runtime.agentId)
	};
}
function resolveSandboxWorkspaceInfoWorkdir(params) {
	return require_browser_bridges.getSandboxBackendWorkdirResolver(params.cfg.backend)?.({
		sessionKey: params.rawSessionKey,
		scopeKey: params.scopeKey,
		workspaceDir: params.workspaceDir,
		agentWorkspaceDir: params.agentWorkspaceDir,
		skillsWorkspaceDir: params.skillsWorkspaceDir,
		cfg: params.cfg
	});
}
async function resolveSandboxContext(params) {
	const resolved = resolveSandboxSession(params);
	if (!resolved) return null;
	const { rawSessionKey, cfg, runtime } = resolved;
	if (cfg.prune.idleHours !== 0 || cfg.prune.maxAgeDays !== 0) await (await Promise.resolve().then(() => require("./prune-E2DaB6V9.cjs"))).maybePruneSandboxes(cfg);
	const { agentWorkspaceDir, scopeKey, skillsWorkspaceDir, workspaceDir } = await ensureSandboxWorkspaceLayout({
		cfg,
		agentId: runtime.agentId,
		rawSessionKey,
		config: params.config,
		execOverrides: params.execOverrides,
		workspaceDir: params.workspaceDir
	});
	const docker = await resolveSandboxDockerUser({
		docker: cfg.docker,
		workspaceDir
	});
	const resolvedCfg = docker === cfg.docker ? cfg : {
		...cfg,
		docker
	};
	const backend = await require_browser_bridges.requireSandboxBackendFactory(resolvedCfg.backend)({
		sessionKey: rawSessionKey,
		scopeKey,
		workspaceDir,
		agentWorkspaceDir,
		skillsWorkspaceDir,
		cfg: resolvedCfg,
		...params.requireCurrentConfig !== void 0 ? { requireCurrentConfig: params.requireCurrentConfig } : {}
	});
	await require_docker.updateRegistry({
		containerName: backend.runtimeId,
		backendId: backend.id,
		runtimeLabel: backend.runtimeLabel,
		sessionKey: scopeKey,
		createdAtMs: Date.now(),
		lastUsedAtMs: Date.now(),
		image: backend.configLabel ?? resolvedCfg.docker.image,
		configLabelKind: backend.configLabelKind ?? "Image"
	});
	const resolvedBrowserConfig = resolvedCfg.browser.enabled ? resolveBrowserConfig(params.config?.browser, params.config) : void 0;
	const evaluateEnabled = resolvedBrowserConfig?.evaluateEnabled ?? true;
	const bridgeAuth = cfg.browser.enabled ? await (async () => {
		const cfgForAuth = params.config ?? (await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports)).getRuntimeConfig();
		let browserAuth = resolveBrowserControlAuth(cfgForAuth);
		try {
			browserAuth = (await ensureBrowserControlAuth({ cfg: cfgForAuth })).auth;
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			require_runtime.defaultRuntime.error?.(`Sandbox browser auth ensure failed: ${message}`);
		}
		return browserAuth;
	})() : void 0;
	if (resolvedCfg.browser.enabled && backend.capabilities?.browser !== true) throw new Error(`Sandbox backend "${resolvedCfg.backend}" does not support browser sandboxes yet.`);
	const browser = resolvedCfg.browser.enabled && backend.capabilities?.browser === true ? await ensureSandboxBrowser({
		scopeKey,
		workspaceDir,
		agentWorkspaceDir,
		skillsWorkspaceDir,
		cfg: resolvedCfg,
		evaluateEnabled,
		bridgeAuth,
		ssrfPolicy: resolvedBrowserConfig?.ssrfPolicy
	}) : null;
	const sandboxContext = {
		enabled: true,
		backendId: backend.id,
		sessionKey: rawSessionKey,
		workspaceDir,
		agentWorkspaceDir,
		skillsWorkspaceDir,
		workspaceAccess: resolvedCfg.workspaceAccess,
		runtimeId: backend.runtimeId,
		runtimeLabel: backend.runtimeLabel,
		containerName: backend.runtimeId,
		containerWorkdir: backend.workdir,
		docker: resolvedCfg.docker,
		tools: resolvedCfg.tools,
		browserAllowHostControl: resolvedCfg.browser.allowHostControl,
		browser: browser ?? void 0,
		backend
	};
	sandboxContext.fsBridge = backend.createFsBridge?.({ sandbox: sandboxContext }) ?? createSandboxFsBridge({ sandbox: sandboxContext });
	return sandboxContext;
}
async function ensureSandboxWorkspaceForSession(params) {
	const resolved = resolveSandboxSession(params);
	if (!resolved) return null;
	const { rawSessionKey, cfg, runtime } = resolved;
	const { agentWorkspaceDir, scopeKey, skillsWorkspaceDir, workspaceDir } = await ensureSandboxWorkspaceLayout({
		cfg,
		agentId: runtime.agentId,
		rawSessionKey,
		config: params.config,
		workspaceDir: params.workspaceDir
	});
	const containerWorkdir = resolveSandboxWorkspaceInfoWorkdir({
		cfg,
		rawSessionKey,
		scopeKey,
		workspaceDir,
		agentWorkspaceDir,
		skillsWorkspaceDir
	});
	return {
		workspaceDir,
		...containerWorkdir ? { containerWorkdir } : {},
		skillsWorkspaceDir,
		workspaceAccess: cfg.workspaceAccess
	};
}
//#endregion
//#region src/agents/sandbox.ts
var sandbox_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	DEFAULT_SANDBOX_BROWSER_IMAGE: () => require_constants.DEFAULT_SANDBOX_BROWSER_IMAGE,
	DEFAULT_SANDBOX_COMMON_IMAGE: () => require_constants.DEFAULT_SANDBOX_COMMON_IMAGE,
	DEFAULT_SANDBOX_IMAGE: () => require_constants.DEFAULT_SANDBOX_IMAGE,
	resolveSandboxRuntimeStatus: () => require_runtime_status.resolveSandboxRuntimeStatus
});
//#endregion
Object.defineProperty(exports, "ensureSandboxWorkspaceForSession", {
	enumerable: true,
	get: function() {
		return ensureSandboxWorkspaceForSession;
	}
});
Object.defineProperty(exports, "resolveSandboxContext", {
	enumerable: true,
	get: function() {
		return resolveSandboxContext;
	}
});
Object.defineProperty(exports, "sandbox_exports", {
	enumerable: true,
	get: function() {
		return sandbox_exports;
	}
});
