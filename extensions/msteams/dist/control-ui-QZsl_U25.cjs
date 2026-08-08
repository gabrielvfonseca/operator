const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
require("./path-safety-D8QlW0vG.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_net = require("./net-CakPoh2E.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_identity_avatar_file = require("./identity-avatar-file-Cw3zle5k.cjs");
const require_identity_avatar = require("./identity-avatar-CUd-0EuL.cjs");
const require_store = require("./store-BW6t6tIi.cjs");
require("./local-file-access-r6xSCXfB.cjs");
const require_local_roots = require("./local-roots-w2A4ItE4.cjs");
const require_media_reference = require("./media-reference-1HgJGiDy.cjs");
const require_local_media_access = require("./local-media-access-BP_UZdmB.cjs");
const require_secret_equal = require("./secret-equal-_vlQ14qZ.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_auth_rate_limit = require("./auth-rate-limit-BjLy1S3-.cjs");
const require_auth = require("./auth-DnGY7_cY.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
require("./http-utils-C_86u7P2.cjs");
const require_device_bootstrap = require("./device-bootstrap-CBBl1PUE.cjs");
const require_device_pairing = require("./device-pairing-DpNh5_Ue.cjs");
const require_control_ui_shared = require("./control-ui-shared-ggCalNPl.cjs");
const require_control_ui_assets = require("./control-ui-assets-CAB0clox.cjs");
const require_assistant_identity = require("./assistant-identity-epF-1Qcg.cjs");
const require_assistant_avatar = require("./assistant-avatar-DOmpDOWL.cjs");
const require_control_ui_routing = require("./control-ui-routing-zoJOCkkX.cjs");
const require_ws_shared_generation = require("./ws-shared-generation-Bcwr1LuX.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_media_core_mime = require("@gabrielvfonseca/media-core/mime");
let node_zlib = require("node:zlib");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_errors = require("@openclaw/fs-safe/errors");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/infra/dev-install-branch.ts
const GIT_TIMEOUT_MS = 3e3;
const HIDDEN_BRANCHES = /* @__PURE__ */ new Set([
	"main",
	"master",
	"HEAD"
]);
async function detectDevInstallGitBranch(params) {
	const run = params.runCommand ?? require_exec.runCommandWithTimeout;
	const root = params.root ? node_path.default.resolve(params.root) : null;
	if (!root) return null;
	const topRes = await run([
		"git",
		"-C",
		root,
		"rev-parse",
		"--show-toplevel"
	], { timeoutMs: GIT_TIMEOUT_MS }).catch(() => null);
	if (topRes?.code !== 0) return null;
	const rootReal = await node_fs_promises.default.realpath(root).catch(() => root);
	const top = topRes.stdout.trim();
	if (!top || node_path.default.resolve(top) !== node_path.default.resolve(rootReal)) return null;
	const branchRes = await run([
		"git",
		"-C",
		root,
		"rev-parse",
		"--abbrev-ref",
		"HEAD"
	], { timeoutMs: GIT_TIMEOUT_MS }).catch(() => null);
	if (branchRes?.code !== 0) return null;
	const branch = branchRes.stdout.trim();
	return branch && !HIDDEN_BRANCHES.has(branch) ? branch : null;
}
let cached = null;
function resolveDevInstallGitBranch() {
	cached ??= require_openclaw_root.resolveOperatorPackageRoot({
		argv1: process.argv[1],
		cwd: process.cwd(),
		moduleUrl: require("url").pathToFileURL(__filename).href
	}).then((root) => detectDevInstallGitBranch({ root })).catch(() => null);
	return cached;
}
//#endregion
//#region src/gateway/control-ui-contract.ts
/** HTTP path for the Control UI bootstrap config payload. */
const CONTROL_UI_BOOTSTRAP_CONFIG_PATH = "/control-ui-config.json";
/** Carries the gateway-configured Control UI mount path into browser bootstrap. */
const CONTROL_UI_BASE_PATH_ATTRIBUTE = "data-operator-control-ui-base-path";
/** Marks whether the served document CSP permits the terminal WASM runtime. */
const CONTROL_UI_TERMINAL_ENABLED_ATTRIBUTE = "data-operator-terminal-enabled";
//#endregion
//#region src/gateway/control-ui-csp.ts
const SCRIPT_ATTRIBUTE_NAME_RE = /\s([^\s=/>]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g;
/**
* Compute SHA-256 CSP hashes for inline `<script>` blocks in an HTML string.
* Only scripts without a `src` attribute are considered inline.
*/
function computeInlineScriptHashes(html) {
	const hashes = [];
	const re = /<script(?:\s[^>]*)?>([^]*?)<\/script>/gi;
	let match;
	while ((match = re.exec(html)) !== null) {
		if (hasScriptSrcAttribute(match[0].slice(0, match[0].indexOf(">") + 1))) continue;
		const content = match[1];
		if (!content) continue;
		const hash = (0, node_crypto.createHash)("sha256").update(content, "utf8").digest("base64");
		hashes.push(`sha256-${hash}`);
	}
	return hashes;
}
function hasScriptSrcAttribute(openTag) {
	return Array.from(openTag.matchAll(SCRIPT_ATTRIBUTE_NAME_RE)).some((match) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(match[1]) === "src");
}
/** Build the CSP header applied to Gateway-served Control UI HTML. */
function buildControlUiCspHeader(opts) {
	const hashes = opts?.inlineScriptHashes;
	const scriptTokens = ["'self'"];
	if (hashes?.length) scriptTokens.push(...hashes.map((h) => `'${h}'`));
	if (opts?.allowWasm) scriptTokens.push("'wasm-unsafe-eval'");
	return [
		"default-src 'self'",
		"base-uri 'none'",
		"object-src 'none'",
		"frame-ancestors 'none'",
		"frame-src 'self' http: https:",
		`script-src ${scriptTokens.join(" ")}`,
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"img-src 'self' data: blob:",
		"media-src 'self' data: blob:",
		"font-src 'self' https://fonts.gstatic.com",
		"worker-src 'self'",
		`connect-src ${[
			"'self'",
			"ws:",
			"wss:",
			"data:",
			"https://api.openai.com",
			"https://tweakcn.com"
		].join(" ")}`
	].join("; ");
}
//#endregion
//#region src/gateway/control-ui-static.ts
const CONTROL_UI_IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
const CONTROL_UI_HTML_COMPRESSION_CACHE_MAX_ENTRIES = 4;
const CONTROL_UI_COMPRESSIBLE_EXTENSIONS = /* @__PURE__ */ new Set([
	".css",
	".html",
	".js",
	".json",
	".svg",
	".txt",
	".wasm",
	".webmanifest"
]);
const CONTROL_UI_PRECOMPRESSED_ASSET_EXTENSIONS = /* @__PURE__ */ new Set([".br", ".gz"]);
/**
* Missing files with these extensions return 404 instead of the SPA index.
* `.html` stays excluded because client-side routes may use that suffix.
*/
const CONTROL_UI_STATIC_ASSET_EXTENSIONS = /* @__PURE__ */ new Set([
	".js",
	".css",
	".json",
	".map",
	".svg",
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
	".ico",
	".txt",
	".wasm",
	".webmanifest"
]);
function isControlUiStaticAssetExtension(extension) {
	return CONTROL_UI_STATIC_ASSET_EXTENSIONS.has(extension);
}
function isControlUiCompressibleExtension(extension) {
	return CONTROL_UI_COMPRESSIBLE_EXTENSIONS.has(extension);
}
function isControlUiPrecompressedAssetExtension(extension) {
	return CONTROL_UI_PRECOMPRESSED_ASSET_EXTENSIONS.has(extension);
}
const CONTROL_UI_DYNAMIC_ENCODINGS = /* @__PURE__ */ new Set(["br", "gzip"]);
const CONTROL_UI_QVALUE_PATTERN = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;
const controlUiHtmlCompressionCache = /* @__PURE__ */ new Map();
function contentTypeForExtension(ext) {
	switch (ext) {
		case ".html": return "text/html; charset=utf-8";
		case ".js": return "application/javascript; charset=utf-8";
		case ".css": return "text/css; charset=utf-8";
		case ".json":
		case ".map": return "application/json; charset=utf-8";
		case ".svg": return "image/svg+xml";
		case ".png": return "image/png";
		case ".jpg":
		case ".jpeg": return "image/jpeg";
		case ".gif": return "image/gif";
		case ".webp": return "image/webp";
		case ".ico": return "image/x-icon";
		case ".txt": return "text/plain; charset=utf-8";
		case ".wasm": return "application/wasm";
		case ".webmanifest": return "application/manifest+json; charset=utf-8";
		default: return "application/octet-stream";
	}
}
function normalizedAcceptEncoding(req) {
	const value = req.headers?.["accept-encoding"];
	return Array.isArray(value) ? value.join(",") : value ?? "";
}
function resolveControlUiContentEncoding(req, availableEncodings) {
	const qualities = /* @__PURE__ */ new Map();
	for (const entry of normalizedAcceptEncoding(req).split(",")) {
		const [rawName, ...rawParams] = entry.split(";");
		const name = rawName?.trim().toLowerCase();
		if (!name) continue;
		const qualityText = rawParams.find((param) => param.trim().toLowerCase().startsWith("q="))?.trim().slice(2);
		const parsedQuality = qualityText === void 0 ? 1 : CONTROL_UI_QVALUE_PATTERN.test(qualityText) ? Number(qualityText) : NaN;
		const quality = Number.isFinite(parsedQuality) && parsedQuality >= 0 && parsedQuality <= 1 ? parsedQuality : 0;
		qualities.set(name, Math.max(qualities.get(name) ?? 0, quality));
	}
	if (!(normalizedAcceptEncoding(req).trim().length > 0)) return "identity";
	const wildcardQuality = qualities.get("*");
	const qualityFor = (name) => qualities.has(name) ? qualities.get(name) ?? 0 : wildcardQuality ?? 0;
	const candidates = [{
		encoding: "identity",
		quality: qualities.has("identity") ? qualities.get("identity") ?? 0 : wildcardQuality === 0 ? 0 : 1,
		rank: 0
	}];
	if (availableEncodings.has("gzip")) candidates.push({
		encoding: "gzip",
		quality: qualityFor("gzip"),
		rank: 1
	});
	if (availableEncodings.has("br")) candidates.push({
		encoding: "br",
		quality: qualityFor("br"),
		rank: 2
	});
	return candidates.filter((candidate) => candidate.quality > 0).toSorted((left, right) => right.quality - left.quality || right.rank - left.rank)[0]?.encoding ?? "not-acceptable";
}
function resolveControlUiHtmlEncoding(req) {
	return resolveControlUiContentEncoding(req, CONTROL_UI_DYNAMIC_ENCODINGS);
}
function resolveOpenedControlUiRepresentation(params) {
	const { req, sourceFile, precompressed, openPrecompressedFile } = params;
	const extension = node_path.default.extname(sourceFile.path).toLowerCase();
	const availableEncodings = precompressed && isControlUiCompressibleExtension(extension) ? new Set(CONTROL_UI_DYNAMIC_ENCODINGS) : /* @__PURE__ */ new Set();
	for (;;) {
		const selected = resolveControlUiContentEncoding(req, availableEncodings);
		if (selected === "not-acceptable") {
			node_fs.default.closeSync(sourceFile.fd);
			return null;
		}
		if (selected === "identity") return {
			bodyFile: sourceFile,
			contentPath: sourceFile.path
		};
		const suffix = selected === "br" ? ".br" : ".gz";
		let compressedFile;
		try {
			compressedFile = openPrecompressedFile(`${sourceFile.path}${suffix}`);
		} catch (error) {
			node_fs.default.closeSync(sourceFile.fd);
			throw error;
		}
		if (compressedFile) {
			node_fs.default.closeSync(sourceFile.fd);
			return {
				bodyFile: compressedFile,
				contentPath: sourceFile.path,
				encoding: selected
			};
		}
		availableEncodings.delete(selected);
	}
}
function setControlUiEncodingHeaders(res, extension, encoding) {
	res.setHeader("Vary", "Accept-Encoding");
	if (!CONTROL_UI_COMPRESSIBLE_EXTENSIONS.has(extension)) return;
	if (encoding !== "identity") res.setHeader("Content-Encoding", encoding);
}
function setControlUiFileHeaders(res, filePath, options) {
	const extension = node_path.default.extname(filePath).toLowerCase();
	res.setHeader("Content-Type", contentTypeForExtension(extension));
	res.setHeader("Cache-Control", options?.immutable ? CONTROL_UI_IMMUTABLE_CACHE_CONTROL : "no-cache");
	setControlUiEncodingHeaders(res, extension, options?.encoding ?? "identity");
}
function respondHeadForControlUiFile(res, filePath, options) {
	res.statusCode = 200;
	setControlUiFileHeaders(res, filePath, options);
	res.end();
}
function compressControlUiBody(body, encoding) {
	return new Promise((resolve, reject) => {
		const callback = (error, compressed) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(compressed);
		};
		if (encoding === "br") {
			(0, node_zlib.brotliCompress)(body, { params: { [node_zlib.constants.BROTLI_PARAM_QUALITY]: 4 } }, callback);
			return;
		}
		(0, node_zlib.gzip)(body, { level: 6 }, callback);
	});
}
async function serveControlUiAsset(res, filePath, body, options) {
	setControlUiFileHeaders(res, filePath, options);
	res.end(body);
}
function cachedCompressedControlUiHtml(body, encoding) {
	const key = `${encoding}\0${body}`;
	const cached = controlUiHtmlCompressionCache.get(key);
	if (cached) {
		controlUiHtmlCompressionCache.delete(key);
		controlUiHtmlCompressionCache.set(key, cached);
		return cached;
	}
	const compression = compressControlUiBody(Buffer.from(body), encoding);
	controlUiHtmlCompressionCache.set(key, compression);
	compression.catch(() => {
		if (controlUiHtmlCompressionCache.get(key) === compression) controlUiHtmlCompressionCache.delete(key);
	});
	while (controlUiHtmlCompressionCache.size > CONTROL_UI_HTML_COMPRESSION_CACHE_MAX_ENTRIES) {
		const oldestKey = controlUiHtmlCompressionCache.keys().next().value;
		if (oldestKey === void 0) break;
		controlUiHtmlCompressionCache.delete(oldestKey);
	}
	return compression;
}
function respondControlUiNotAcceptable(res) {
	res.statusCode = 406;
	res.setHeader("Content-Type", "text/plain; charset=utf-8");
	res.setHeader("Cache-Control", "no-store");
	res.setHeader("Vary", "Accept-Encoding");
	res.end("Not Acceptable");
}
async function sendControlUiHtmlBody(req, res, body) {
	const encoding = resolveControlUiHtmlEncoding(req);
	if (encoding === "not-acceptable") {
		respondControlUiNotAcceptable(res);
		return;
	}
	setControlUiEncodingHeaders(res, ".html", encoding);
	res.end(encoding === "identity" ? body : await cachedCompressedControlUiHtml(body, encoding));
}
function readOpenedFile(fd) {
	return new Promise((resolve, reject) => {
		node_fs.default.readFile(fd, (error, data) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(data);
		});
	});
}
async function readAndCloseControlUiFile(fd) {
	try {
		return await readOpenedFile(fd);
	} finally {
		node_fs.default.closeSync(fd);
	}
}
async function readAndCloseControlUiFileText(fd) {
	return (await readAndCloseControlUiFile(fd)).toString("utf8");
}
//#endregion
//#region src/gateway/control-ui.ts
const ROOT_PREFIX = "/";
const CONTROL_UI_ASSISTANT_MEDIA_PREFIX = "/__operator__/assistant-media";
const CONTROL_UI_ASSISTANT_MEDIA_TICKET_SCOPE = "assistant-media";
const CONTROL_UI_ASSISTANT_MEDIA_TICKET_TTL_MS = 300 * 1e3;
const CONTROL_UI_ASSETS_MISSING_MESSAGE = "Control UI assets not found. Build them with `pnpm ui:build` (auto-installs UI deps), or run `pnpm ui:dev` during development.";
const CONTROL_UI_OPERATOR_READ_SCOPE = "operator.read";
const CONTROL_UI_OPERATOR_ROLE = "operator";
const controlUiAssistantMediaTicketSecret = (0, node_crypto.randomBytes)(32);
function buildAssistantMediaContentDisposition(filename, mime) {
	const fallback = filename.replace(/[^\x20-\x7e]|[%"\\]/g, "_") || "download";
	const extended = encodeURIComponent(filename).replace(/[\x27()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
	const kind = (0, _gabrielvfonseca_media_core_mime.kindFromMime)(mime);
	return `${kind === "image" || kind === "audio" || kind === "video" ? "inline" : "attachment"}; filename="${fallback}"; filename*=UTF-8''${extended}`;
}
const CONTROL_UI_NAMESPACE_PREFIX = "/__operator__/";
const CONTROL_UI_ROOT_PUBLIC_ASSETS = /* @__PURE__ */ new Set([
	"apple-touch-icon.png",
	"favicon-32.png",
	"favicon.ico",
	"favicon.svg",
	"manifest.webmanifest",
	"sw.js"
]);
/** Rewrites root-absolute Control UI public asset hrefs for configured base paths. */
function rewriteControlUiIndexHtmlPublicAssetHrefs(html, basePath) {
	const normalized = require_control_ui_shared.normalizeControlUiBasePath(basePath);
	if (!normalized) return html;
	let next = html;
	for (const asset of CONTROL_UI_ROOT_PUBLIC_ASSETS) {
		const rootHref = `href="/${asset}"`;
		const baseHref = `href="${normalized}/${asset}"`;
		next = next.split(rootHref).join(baseHref);
	}
	return next;
}
function escapeHtmlAttribute(value) {
	return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("'", "&#39;");
}
function controlUiAvatarResolutionMeta(resolved) {
	if (!resolved) return {
		avatarSource: null,
		avatarStatus: null,
		avatarReason: null
	};
	return {
		avatarSource: require_identity_avatar.resolvePublicAgentAvatarSource(resolved) ?? null,
		avatarStatus: resolved.kind,
		avatarReason: resolved.kind === "none" ? resolved.reason : null
	};
}
function applyControlUiSecurityHeaders(res) {
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("Content-Security-Policy", buildControlUiCspHeader());
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("Referrer-Policy", "no-referrer");
	res.setHeader("Permissions-Policy", "camera=*, microphone=*, geolocation=*, clipboard-write=*");
}
function sendJson(res, status, body) {
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.setHeader("Cache-Control", "no-cache");
	res.end(JSON.stringify(body));
}
function respondControlUiAssetsUnavailable(res, options) {
	if (options?.configuredRootPath) {
		require_control_ui_routing.respondPlainText(res, 503, `Control UI assets not found at ${options.configuredRootPath}. Build them with \`pnpm ui:build\` (auto-installs UI deps), or update gateway.controlUi.root.`);
		return;
	}
	require_control_ui_routing.respondPlainText(res, 503, CONTROL_UI_ASSETS_MISSING_MESSAGE);
}
function isValidAgentId(agentId) {
	return /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(agentId);
}
function normalizeAssistantMediaSource(source) {
	const trimmed = source.trim();
	if (!trimmed) return null;
	if (trimmed.startsWith("file://")) try {
		return (0, _openclaw_fs_safe_advanced.safeFileURLToPath)(trimmed);
	} catch {
		return null;
	}
	if (trimmed.startsWith("~")) return require_home_dir.resolveUserPath(trimmed);
	return trimmed;
}
function resolveAssistantMediaRoutePath(basePath) {
	return `${basePath && basePath !== "/" ? basePath.endsWith("/") ? basePath.slice(0, -1) : basePath : ""}${CONTROL_UI_ASSISTANT_MEDIA_PREFIX}`;
}
function resolveAssistantMediaAuthToken(req) {
	const bearer = require_http_auth_utils.getBearerToken(req);
	if (bearer) return bearer;
	const urlRaw = req.url;
	if (!urlRaw) return;
	try {
		return new URL(urlRaw, "http://localhost").searchParams.get("token")?.trim() || void 0;
	} catch {
		return;
	}
}
function resolveControlUiReadAuthToken(req, opts) {
	const bearer = require_http_auth_utils.getBearerToken(req);
	if (bearer) return bearer;
	if (!opts?.allowQueryToken) return;
	return resolveAssistantMediaAuthToken(req);
}
async function authorizeControlUiReadRequest(req, res, opts) {
	if (!opts?.auth) return true;
	const token = resolveControlUiReadAuthToken(req, { allowQueryToken: opts.allowQueryToken });
	const clientIp = require_net.resolveRequestClientIp(req, opts.trustedProxies, opts.allowRealIpFallback === true) ?? req.socket?.remoteAddress;
	let resolvedAuthResult = await require_auth.authorizeHttpGatewayConnect({
		auth: opts.auth,
		connectAuth: token ? {
			token,
			password: token
		} : null,
		req,
		browserOriginPolicy: require_http_auth_utils.resolveHttpBrowserOriginPolicy(req),
		trustedProxies: opts.trustedProxies,
		allowRealIpFallback: opts.allowRealIpFallback,
		rateLimiter: token ? opts.rateLimiter : void 0,
		clientIp,
		rateLimitScope: require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_SHARED_SECRET
	});
	if (!resolvedAuthResult.ok && token && opts.auth.mode !== "trusted-proxy" && opts.auth.mode !== "none") {
		const deviceRateCheck = opts.rateLimiter?.check(clientIp, require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_DEVICE_TOKEN);
		if (deviceRateCheck && !deviceRateCheck.allowed) resolvedAuthResult = {
			ok: false,
			reason: "rate_limited",
			rateLimited: true,
			retryAfterMs: deviceRateCheck.retryAfterMs
		};
		else if (await authorizeControlUiDeviceReadToken(token, { requiredSharedGatewaySessionGeneration: require_ws_shared_generation.resolveSharedGatewaySessionGeneration(opts.auth, opts.trustedProxies) })) {
			opts.rateLimiter?.reset(clientIp, require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_DEVICE_TOKEN);
			opts.rateLimiter?.reset(clientIp, require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_SHARED_SECRET);
			resolvedAuthResult = {
				ok: true,
				method: "device-token"
			};
		} else opts.rateLimiter?.recordFailure(clientIp, require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_DEVICE_TOKEN);
	}
	if (!resolvedAuthResult.ok) {
		require_http_common.sendGatewayAuthFailure(res, resolvedAuthResult);
		return false;
	}
	const trustDeclaredOperatorScopes = resolvedAuthResult.method === "trusted-proxy";
	if (!trustDeclaredOperatorScopes) return true;
	const requestedScopes = require_http_auth_utils.resolveTrustedHttpOperatorScopes(req, { trustDeclaredOperatorScopes });
	const scopeAuth = require_method_scopes.authorizeOperatorScopesForMethod(opts.requiredOperatorMethod ?? "assistant.media.get", requestedScopes);
	if (!scopeAuth.allowed) {
		sendJson(res, 403, require_http_common.buildMissingScopeForbiddenBody(scopeAuth.missingScope));
		return false;
	}
	return true;
}
async function authorizeControlUiDeviceReadToken(token, opts) {
	const pairing = await require_device_pairing.listDevicePairing();
	for (const device of pairing.paired) {
		const operatorToken = device.tokens?.[CONTROL_UI_OPERATOR_ROLE];
		if (!operatorToken || operatorToken.revokedAtMs) continue;
		if (!require_device_bootstrap.verifyPairingToken(token, operatorToken.token)) continue;
		if ((await require_device_pairing.verifyDeviceToken({
			deviceId: device.deviceId,
			token,
			role: CONTROL_UI_OPERATOR_ROLE,
			scopes: [CONTROL_UI_OPERATOR_READ_SCOPE],
			requiredSharedGatewaySessionGeneration: opts.requiredSharedGatewaySessionGeneration
		})).ok) return true;
	}
	return false;
}
function signAssistantMediaTicketPayload(encodedPayload) {
	return (0, node_crypto.createHmac)("sha256", controlUiAssistantMediaTicketSecret).update(encodedPayload).digest("base64url");
}
function createAssistantMediaTicket(source, nowMs = Date.now()) {
	const now = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(nowMs);
	if (now === void 0) return {};
	const exp = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(now + CONTROL_UI_ASSISTANT_MEDIA_TICKET_TTL_MS);
	if (exp === void 0) return {};
	const payload = {
		scope: CONTROL_UI_ASSISTANT_MEDIA_TICKET_SCOPE,
		source,
		exp
	};
	const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
	return {
		mediaTicket: `v1.${encodedPayload}.${signAssistantMediaTicketPayload(encodedPayload)}`,
		mediaTicketExpiresAt: (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimestampMsToIsoString)(exp)
	};
}
function verifyAssistantMediaTicket(ticket, source, nowMs = Date.now()) {
	const now = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(nowMs);
	if (now === void 0) return false;
	const parts = ticket?.split(".");
	if (parts?.length !== 3 || parts[0] !== "v1") return false;
	const [, encodedPayload, sig] = parts;
	if (!encodedPayload || !sig) return false;
	if (!require_secret_equal.safeEqualSecret(sig, signAssistantMediaTicketPayload(encodedPayload))) return false;
	try {
		const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
		return payload.scope === CONTROL_UI_ASSISTANT_MEDIA_TICKET_SCOPE && payload.source === source && typeof payload.exp === "number" && Number.isFinite(payload.exp) && payload.exp >= now;
	} catch {
		return false;
	}
}
function classifyAssistantMediaError(err) {
	if (err instanceof _openclaw_fs_safe_errors.FsSafeError) switch (err.code) {
		case "not-found": return {
			available: false,
			code: "file-not-found",
			reason: "File not found"
		};
		case "not-file": return {
			available: false,
			code: "not-a-file",
			reason: "Not a file"
		};
		case "invalid-path":
		case "path-mismatch":
		case "symlink": return {
			available: false,
			code: "invalid-file",
			reason: "Invalid file"
		};
		default: return {
			available: false,
			code: "attachment-unavailable",
			reason: "Attachment unavailable"
		};
	}
	if (err instanceof Error && "code" in err) {
		const errorCode = err.code;
		switch (typeof errorCode === "string" ? errorCode : "") {
			case "path-not-allowed": return {
				available: false,
				code: "outside-allowed-folders",
				reason: "Outside allowed folders"
			};
			case "invalid-file-url":
			case "invalid-path":
			case "unsafe-bypass":
			case "network-path-not-allowed":
			case "invalid-root": return {
				available: false,
				code: "blocked-local-file",
				reason: "Blocked local file"
			};
			case "not-found": return {
				available: false,
				code: "file-not-found",
				reason: "File not found"
			};
			case "not-file": return {
				available: false,
				code: "not-a-file",
				reason: "Not a file"
			};
			default: break;
		}
	}
	return {
		available: false,
		code: "attachment-unavailable",
		reason: "Attachment unavailable"
	};
}
async function resolveAssistantMediaAvailability(source, localRoots) {
	try {
		const localPath = await require_media_reference.resolveMediaReferenceLocalPath(source);
		await require_local_media_access.assertLocalMediaAllowed(localPath, localRoots);
		await (await (0, _openclaw_fs_safe_root.openLocalFileSafely)({ filePath: localPath })).handle.close();
		return { available: true };
	} catch (err) {
		return classifyAssistantMediaError(err);
	}
}
async function handleControlUiAssistantMediaRequest(req, res, opts) {
	const urlRaw = req.url;
	if (!urlRaw || !require_control_ui_routing.isReadHttpMethod(req.method)) return false;
	const url = new URL(urlRaw, "http://localhost");
	if (url.pathname !== resolveAssistantMediaRoutePath(opts?.basePath)) return false;
	applyControlUiSecurityHeaders(res);
	const source = normalizeAssistantMediaSource(url.searchParams.get("source") ?? "");
	if (!source) {
		require_control_ui_routing.respondNotFound(res);
		return true;
	}
	const isMetaRequest = url.searchParams.get("meta") === "1";
	if (!(!isMetaRequest && verifyAssistantMediaTicket(url.searchParams.get("mediaTicket"), source)) && !await authorizeControlUiReadRequest(req, res, {
		auth: opts?.auth,
		trustedProxies: opts?.trustedProxies,
		allowRealIpFallback: opts?.allowRealIpFallback,
		rateLimiter: opts?.rateLimiter,
		allowQueryToken: true
	})) return true;
	const localRoots = opts?.config ? require_local_roots.getAgentScopedMediaLocalRoots(opts.config, opts.agentId) : require_local_media_access.getDefaultLocalRoots();
	if (isMetaRequest) {
		const availability = await resolveAssistantMediaAvailability(source, localRoots);
		sendJson(res, 200, availability.available ? {
			...availability,
			...createAssistantMediaTicket(source)
		} : availability);
		return true;
	}
	let opened = null;
	let localPath;
	let handleClosed = false;
	const closeOpenedHandle = async () => {
		if (!opened || handleClosed) return;
		handleClosed = true;
		await opened.handle.close().catch(() => {});
	};
	try {
		const resolvedReference = await require_media_reference.resolveMediaReferenceLocalPathInfo(source);
		localPath = resolvedReference.path;
		await require_local_media_access.assertLocalMediaAllowed(localPath, localRoots);
		opened = await (0, _openclaw_fs_safe_root.openLocalFileSafely)({ filePath: localPath });
		const sniffLength = Math.min(opened.stat.size, 8192);
		const sniffBuffer = sniffLength > 0 ? Buffer.allocUnsafe(sniffLength) : void 0;
		const bytesRead = sniffBuffer && sniffLength > 0 ? (await opened.handle.read(sniffBuffer, 0, sniffLength, 0)).bytesRead : 0;
		const contentType = await (0, _gabrielvfonseca_media_core_mime.detectMime)({
			buffer: sniffBuffer?.subarray(0, bytesRead),
			filePath: localPath
		}) ?? "application/octet-stream";
		const filename = resolvedReference.kind === "inbound" ? require_store.extractOriginalFilename(localPath) : node_path.default.basename(localPath);
		res.setHeader("Content-Type", contentType);
		res.setHeader("Content-Disposition", buildAssistantMediaContentDisposition(filename, contentType));
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Content-Length", String(opened.stat.size));
		const stream = opened.handle.createReadStream({
			start: 0,
			autoClose: false
		});
		const finishClose = () => {
			closeOpenedHandle();
		};
		stream.once("end", finishClose);
		stream.once("close", finishClose);
		stream.once("error", () => {
			closeOpenedHandle();
			if (!res.headersSent) require_control_ui_routing.respondNotFound(res);
			else res.destroy();
		});
		res.once("close", finishClose);
		stream.pipe(res);
		return true;
	} catch {
		await closeOpenedHandle();
		require_control_ui_routing.respondNotFound(res);
		return true;
	}
}
async function handleControlUiAvatarRequest(req, res, opts) {
	const urlRaw = req.url;
	if (!urlRaw) return false;
	if (!require_control_ui_routing.isReadHttpMethod(req.method)) return false;
	const url = new URL(urlRaw, "http://localhost");
	const basePath = require_control_ui_shared.normalizeControlUiBasePath(opts.basePath);
	const pathname = url.pathname;
	const pathWithBase = basePath ? `${basePath}${require_control_ui_shared.CONTROL_UI_AVATAR_PREFIX}/` : `${require_control_ui_shared.CONTROL_UI_AVATAR_PREFIX}/`;
	if (!pathname.startsWith(pathWithBase)) return false;
	applyControlUiSecurityHeaders(res);
	const agentIdParts = pathname.slice(pathWithBase.length).split("/").filter(Boolean);
	const agentId = agentIdParts[0] ?? "";
	if (agentIdParts.length !== 1 || !agentId || !isValidAgentId(agentId)) {
		require_control_ui_routing.respondNotFound(res);
		return true;
	}
	if (!await authorizeControlUiReadRequest(req, res, {
		auth: opts.auth,
		trustedProxies: opts.trustedProxies,
		allowRealIpFallback: opts.allowRealIpFallback,
		rateLimiter: opts.rateLimiter
	})) return true;
	const identity = require_assistant_identity.resolveAssistantIdentity({
		cfg: opts.config,
		agentId
	});
	const projection = require_assistant_avatar.openGatewayAssistantAvatar({
		cfg: opts.config,
		identity
	});
	const resolved = projection.resolution;
	if (url.searchParams.get("meta") === "1") {
		try {
			const meta = controlUiAvatarResolutionMeta(resolved);
			sendJson(res, 200, {
				avatarUrl: resolved?.kind === "local" ? require_control_ui_shared.buildControlUiAvatarUrl(basePath, agentId) : resolved?.kind === "remote" || resolved?.kind === "data" ? resolved.url : null,
				avatarSource: meta.avatarSource,
				avatarStatus: meta.avatarStatus,
				avatarReason: meta.avatarReason
			});
		} finally {
			if (projection.openedFile) node_fs.default.closeSync(projection.openedFile.fd);
		}
		return true;
	}
	if (resolved?.kind !== "local" || !projection.openedFile) {
		require_control_ui_routing.respondNotFound(res);
		return true;
	}
	try {
		res.setHeader("Content-Type", require_io.resolveAvatarMime(projection.openedFile.path));
		res.setHeader("Cache-Control", "no-cache");
		if (req.method === "HEAD") {
			res.statusCode = 200;
			res.end();
			return true;
		}
		const body = await require_identity_avatar_file.readFileDescriptorBounded(projection.openedFile.fd, require_io.AVATAR_MAX_BYTES);
		res.end(body);
		return true;
	} catch {
		require_control_ui_routing.respondNotFound(res);
		return true;
	} finally {
		node_fs.default.closeSync(projection.openedFile.fd);
	}
}
async function serveResolvedIndexHtml(req, res, body, basePath, allowWasm) {
	const normalizedBasePath = require_control_ui_shared.normalizeControlUiBasePath(basePath);
	const withBasePath = rewriteControlUiIndexHtmlPublicAssetHrefs(body, normalizedBasePath);
	const basePathAttribute = normalizedBasePath ? ` ${CONTROL_UI_BASE_PATH_ATTRIBUTE}="${escapeHtmlAttribute(normalizedBasePath)}"` : "";
	const prepared = withBasePath.replace(/<html\b/i, `<html${basePathAttribute} ${CONTROL_UI_TERMINAL_ENABLED_ATTRIBUTE}="${allowWasm === true}"`);
	const hashes = computeInlineScriptHashes(prepared);
	res.setHeader("Content-Security-Policy", buildControlUiCspHeader({
		inlineScriptHashes: hashes,
		allowWasm
	}));
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.setHeader("Cache-Control", "no-cache");
	await sendControlUiHtmlBody(req, res, prepared);
}
function isExpectedSafePathError(error) {
	const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
	return code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP";
}
function resolveSafeControlUiFile(rootReal, filePath, rejectHardlinks) {
	const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
		absolutePath: filePath,
		rootPath: rootReal,
		rootRealPath: rootReal,
		boundaryLabel: "control ui root",
		skipLexicalRootCheck: true,
		rejectHardlinks
	});
	if (!opened.ok) return (0, _openclaw_fs_safe_advanced.matchRootFileOpenFailure)(opened, {
		io: (failure) => {
			throw failure.error;
		},
		fallback: () => null
	});
	return {
		path: opened.path,
		fd: opened.fd
	};
}
function isSafeRelativePath(relPath) {
	if (!relPath) return false;
	const normalized = node_path.default.posix.normalize(relPath);
	if (node_path.default.posix.isAbsolute(normalized) || node_path.default.win32.isAbsolute(normalized)) return false;
	if (normalized.startsWith("../") || normalized === "..") return false;
	if (normalized.includes("\0")) return false;
	return true;
}
const CONTROL_UI_DEFAULT_NAMESPACE_BOOTSTRAP_CONFIG_PATH = `${CONTROL_UI_NAMESPACE_PREFIX.replace(/\/$/, "")}${CONTROL_UI_BOOTSTRAP_CONFIG_PATH}`;
const LEGACY_BOOTSTRAP_CONFIG_PATH = `/__operator${CONTROL_UI_BOOTSTRAP_CONFIG_PATH}`;
/**
* Whether `pathname` should be served the Control UI bootstrap config payload.
*
* The canonical endpoint is the configured base path joined with the shared
* bootstrap constant (or the bare constant when no base path is configured).
* For every base path (configured or empty) we additionally accept the legacy
* single-underscore suffix `${basePath}/__operator/control-ui-config.json` that
* current main and v2026.6.1 serve and document, so older bundles and clients
* that still request the pre-#66946 endpoint keep receiving config after an
* upgrade instead of 404ing. When no base path is configured we further accept
* the default-namespace alias `/__operator__/control-ui-config.json`, which is
* what the default `/__operator__/` entry requests after inferring its base path
* from the URL. All compatibility endpoints are preserved; no path is removed.
*/
function matchesControlUiBootstrapConfigPath(pathname, basePath) {
	if (pathname === `${basePath}/control-ui-config.json` || pathname === `${basePath}${LEGACY_BOOTSTRAP_CONFIG_PATH}`) return true;
	return basePath === "" && pathname === CONTROL_UI_DEFAULT_NAMESPACE_BOOTSTRAP_CONFIG_PATH;
}
async function handleControlUiHttpRequest(req, res, opts) {
	const urlRaw = req.url;
	if (!urlRaw) return false;
	const url = new URL(urlRaw, "http://localhost");
	const basePath = require_control_ui_shared.normalizeControlUiBasePath(opts?.basePath);
	const pathname = url.pathname;
	const terminalEnabled = opts?.terminalEnabled ?? opts?.config?.gateway?.terminal?.enabled === true;
	const route = require_control_ui_routing.classifyControlUiRequest({
		basePath,
		pathname,
		search: url.search,
		method: req.method
	});
	if (route.kind === "not-control-ui") return false;
	if (route.kind === "not-found") {
		applyControlUiSecurityHeaders(res);
		require_control_ui_routing.respondNotFound(res);
		return true;
	}
	if (route.kind === "redirect") {
		applyControlUiSecurityHeaders(res);
		res.statusCode = 302;
		res.setHeader("Location", route.location);
		res.end();
		return true;
	}
	applyControlUiSecurityHeaders(res);
	if (matchesControlUiBootstrapConfigPath(pathname, basePath)) {
		if (!await authorizeControlUiReadRequest(req, res, {
			auth: opts?.auth,
			trustedProxies: opts?.trustedProxies,
			allowRealIpFallback: opts?.allowRealIpFallback,
			rateLimiter: opts?.rateLimiter
		})) return true;
		if (req.method === "HEAD") {
			res.statusCode = 200;
			res.setHeader("Content-Type", "application/json; charset=utf-8");
			res.setHeader("Cache-Control", "no-cache");
			res.end();
			return true;
		}
		const config = opts?.config;
		const identity = config ? require_assistant_identity.resolveAssistantIdentity({
			cfg: config,
			agentId: opts?.agentId
		}) : require_assistant_identity.DEFAULT_ASSISTANT_IDENTITY;
		const avatarProjection = config ? require_assistant_avatar.resolveGatewayAssistantAvatar({
			cfg: config,
			identity
		}) : {
			avatar: identity.avatar,
			resolution: null
		};
		const avatarMeta = controlUiAvatarResolutionMeta(avatarProjection.resolution);
		sendJson(res, 200, {
			basePath,
			assistantName: identity.name,
			assistantAvatar: avatarProjection.avatar,
			assistantAvatarSource: avatarMeta.avatarSource,
			assistantAvatarStatus: avatarMeta.avatarStatus,
			assistantAvatarReason: avatarMeta.avatarReason,
			assistantAgentId: identity.agentId,
			serverVersion: require_version.resolveRuntimeServiceVersion(process.env),
			devGitBranch: await resolveDevInstallGitBranch() ?? void 0,
			localMediaPreviewRoots: [...require_local_roots.getAgentScopedMediaLocalRoots(config ?? {}, identity.agentId)],
			embedSandbox: config?.gateway?.controlUi?.embedSandbox === "trusted" ? "trusted" : config?.gateway?.controlUi?.embedSandbox === "strict" ? "strict" : "scripts",
			allowExternalEmbedUrls: config?.gateway?.controlUi?.allowExternalEmbedUrls === true,
			chatMessageMaxWidth: config?.gateway?.controlUi?.chatMessageMaxWidth,
			seamColor: config?.ui?.seamColor,
			timeFormat: config?.agents?.defaults?.timeFormat,
			terminalEnabled
		});
		return true;
	}
	const rootState = opts?.root;
	if (rootState?.kind === "invalid") {
		respondControlUiAssetsUnavailable(res, { configuredRootPath: rootState.path });
		return true;
	}
	if (rootState?.kind === "missing") {
		respondControlUiAssetsUnavailable(res);
		return true;
	}
	const root = rootState?.kind === "resolved" || rootState?.kind === "bundled" ? rootState.path : require_control_ui_assets.resolveControlUiRootSync({
		moduleUrl: require("url").pathToFileURL(__filename).href,
		argv1: process.argv[1],
		cwd: process.cwd()
	});
	if (!root) {
		respondControlUiAssetsUnavailable(res);
		return true;
	}
	const rootReal = (() => {
		try {
			return node_fs.default.realpathSync(root);
		} catch (error) {
			if (isExpectedSafePathError(error)) return null;
			throw error;
		}
	})();
	if (!rootReal) {
		respondControlUiAssetsUnavailable(res);
		return true;
	}
	const uiPath = basePath && pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
	const approvalDocument = require_control_ui_routing.isControlUiApprovalDocumentPath({
		basePath,
		pathname
	});
	const rel = (() => {
		if (uiPath === ROOT_PREFIX) return "";
		if (uiPath.startsWith(CONTROL_UI_NAMESPACE_PREFIX)) {
			const namespacedRel = uiPath.slice(14);
			if (CONTROL_UI_ROOT_PUBLIC_ASSETS.has(namespacedRel)) return namespacedRel;
		}
		const assetsIndex = uiPath.indexOf("/assets/");
		if (assetsIndex >= 0) return uiPath.slice(assetsIndex + 1);
		return uiPath.slice(1);
	})();
	const fileRel = (approvalDocument ? "index.html" : rel && !rel.endsWith("/") ? rel : `${rel}index.html`) || "index.html";
	if (!isSafeRelativePath(fileRel)) {
		require_control_ui_routing.respondNotFound(res);
		return true;
	}
	const filePath = node_path.default.resolve(root, fileRel);
	if (!(0, _openclaw_fs_safe_path.isWithinDir)(root, filePath)) {
		require_control_ui_routing.respondNotFound(res);
		return true;
	}
	const isBundledRoot = rootState?.kind === "bundled" || rootState === void 0 && require_control_ui_assets.isPackageProvenControlUiRootSync(root, {
		moduleUrl: require("url").pathToFileURL(__filename).href,
		argv1: process.argv[1],
		cwd: process.cwd()
	});
	if (isBundledRoot && isControlUiPrecompressedAssetExtension(node_path.default.extname(fileRel).toLowerCase())) {
		require_control_ui_routing.respondNotFound(res);
		return true;
	}
	const rejectHardlinks = !isBundledRoot;
	const immutableAsset = isBundledRoot && fileRel.startsWith("assets/");
	const safeFile = resolveSafeControlUiFile(rootReal, filePath, rejectHardlinks);
	if (safeFile) {
		if (node_path.default.basename(safeFile.path) === "index.html") {
			if (req.method === "HEAD") try {
				const encoding = resolveControlUiHtmlEncoding(req);
				if (encoding === "not-acceptable") {
					respondControlUiNotAcceptable(res);
					return true;
				}
				respondHeadForControlUiFile(res, safeFile.path, { encoding: encoding === "identity" ? void 0 : encoding });
				return true;
			} finally {
				node_fs.default.closeSync(safeFile.fd);
			}
			await serveResolvedIndexHtml(req, res, await readAndCloseControlUiFileText(safeFile.fd), basePath, terminalEnabled);
			return true;
		}
		const representation = resolveOpenedControlUiRepresentation({
			req,
			sourceFile: safeFile,
			precompressed: immutableAsset,
			openPrecompressedFile: (compressedPath) => resolveSafeControlUiFile(rootReal, compressedPath, false)
		});
		if (!representation) {
			respondControlUiNotAcceptable(res);
			return true;
		}
		if (req.method === "HEAD") try {
			respondHeadForControlUiFile(res, representation.contentPath, {
				immutable: immutableAsset,
				encoding: representation.encoding
			});
			return true;
		} finally {
			node_fs.default.closeSync(representation.bodyFile.fd);
		}
		const body = await readAndCloseControlUiFile(representation.bodyFile.fd);
		await serveControlUiAsset(res, representation.contentPath, body, {
			immutable: immutableAsset,
			encoding: representation.encoding
		});
		return true;
	}
	if (isControlUiStaticAssetExtension(node_path.default.extname(fileRel).toLowerCase())) {
		require_control_ui_routing.respondNotFound(res);
		return true;
	}
	const safeIndex = resolveSafeControlUiFile(rootReal, node_path.default.join(root, "index.html"), rejectHardlinks);
	if (safeIndex) {
		if (req.method === "HEAD") try {
			const encoding = resolveControlUiHtmlEncoding(req);
			if (encoding === "not-acceptable") {
				respondControlUiNotAcceptable(res);
				return true;
			}
			respondHeadForControlUiFile(res, safeIndex.path, { encoding: encoding === "identity" ? void 0 : encoding });
			return true;
		} finally {
			node_fs.default.closeSync(safeIndex.fd);
		}
		await serveResolvedIndexHtml(req, res, await readAndCloseControlUiFileText(safeIndex.fd), basePath, terminalEnabled);
		return true;
	}
	require_control_ui_routing.respondNotFound(res);
	return true;
}
//#endregion
exports.handleControlUiAssistantMediaRequest = handleControlUiAssistantMediaRequest;
exports.handleControlUiAvatarRequest = handleControlUiAvatarRequest;
exports.handleControlUiHttpRequest = handleControlUiHttpRequest;
