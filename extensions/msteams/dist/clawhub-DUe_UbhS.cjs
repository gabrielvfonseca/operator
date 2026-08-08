const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_retry = require("./retry-DXZi6qkk.cjs");
require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_http_body = require("./http-body-BwUnoq2M.cjs");
const require_runtime_guard = require("./runtime-guard-DYLYBrMu.cjs");
require("./private-temp-workspace-CZ5HRjLT.cjs");
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
let semver = require("semver");
let _openclaw_fs_safe_temp = require("@openclaw/fs-safe/temp");
//#region src/infra/clawhub-spec.ts
/** Parses explicit `clawhub:<name>[@version]` package specs for ClawHub installs. */
function parseClawHubPluginSpec(raw) {
	const trimmed = raw.trim();
	if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed).startsWith("clawhub:")) return null;
	const spec = trimmed.slice(8).trim();
	if (!spec) return null;
	const atIndex = spec.lastIndexOf("@");
	if (atIndex <= 0) return { name: spec };
	if (atIndex >= spec.length - 1) return null;
	const name = spec.slice(0, atIndex).trim();
	const version = spec.slice(atIndex + 1).trim();
	if (!name || !version) return null;
	return {
		name,
		version
	};
}
//#endregion
//#region packages/ai/src/internal/retry-after.ts
const HTTP_DATE_MONTH_INDEX = new Map([
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
].map((month, index) => [month, index]));
const HTTP_DATE_SHORT_WEEKDAY_INDEX = new Map([
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
].map((weekday, index) => [weekday, index]));
const HTTP_DATE_LONG_WEEKDAY_INDEX = new Map([
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
].map((weekday, index) => [weekday, index]));
const IMF_FIXDATE_RE = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT$/;
const OBSOLETE_RFC850_DATE_RE = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2}) (\d{2}):(\d{2}):(\d{2}) GMT$/;
const OBSOLETE_ASCTIME_DATE_RE = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{2}| \d) (\d{2}):(\d{2}):(\d{2}) (\d{4})$/;
/** Parses the three HTTP-date forms accepted for Retry-After without Date.parse normalization. */
function parseRetryAfterHttpDateMs(value, nowMs = Date.now()) {
	const imfFixdate = IMF_FIXDATE_RE.exec(value);
	if (imfFixdate) return parseHttpDateComponentsMs({
		weekday: HTTP_DATE_SHORT_WEEKDAY_INDEX.get(imfFixdate[1] ?? ""),
		year: Number.parseInt(imfFixdate[4] ?? "", 10),
		month: HTTP_DATE_MONTH_INDEX.get(imfFixdate[3] ?? ""),
		day: Number.parseInt(imfFixdate[2] ?? "", 10),
		hours: Number.parseInt(imfFixdate[5] ?? "", 10),
		minutes: Number.parseInt(imfFixdate[6] ?? "", 10),
		seconds: Number.parseInt(imfFixdate[7] ?? "", 10)
	});
	const rfc850Date = OBSOLETE_RFC850_DATE_RE.exec(value);
	if (rfc850Date) {
		const now = new Date(nowMs);
		if (Number.isNaN(now.getTime())) return;
		const shortYear = Number.parseInt(rfc850Date[4] ?? "", 10);
		const candidateYear = Math.floor(now.getUTCFullYear() / 100) * 100 + shortYear;
		const components = {
			weekday: HTTP_DATE_LONG_WEEKDAY_INDEX.get(rfc850Date[1] ?? ""),
			month: HTTP_DATE_MONTH_INDEX.get(rfc850Date[3] ?? ""),
			day: Number.parseInt(rfc850Date[2] ?? "", 10),
			hours: Number.parseInt(rfc850Date[5] ?? "", 10),
			minutes: Number.parseInt(rfc850Date[6] ?? "", 10),
			seconds: Number.parseInt(rfc850Date[7] ?? "", 10)
		};
		const candidate = parseHttpDateCalendarMs({
			year: candidateYear,
			...components
		});
		if (candidate === void 0) return;
		return parseHttpDateComponentsMs({
			year: candidate > Date.UTC(now.getUTCFullYear() + 50, now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()) ? candidateYear - 100 : candidateYear,
			...components
		});
	}
	const asctimeDate = OBSOLETE_ASCTIME_DATE_RE.exec(value);
	if (asctimeDate) return parseHttpDateComponentsMs({
		weekday: HTTP_DATE_SHORT_WEEKDAY_INDEX.get(asctimeDate[1] ?? ""),
		year: Number.parseInt(asctimeDate[7] ?? "", 10),
		month: HTTP_DATE_MONTH_INDEX.get(asctimeDate[2] ?? ""),
		day: Number.parseInt((asctimeDate[3] ?? "").trim(), 10),
		hours: Number.parseInt(asctimeDate[4] ?? "", 10),
		minutes: Number.parseInt(asctimeDate[5] ?? "", 10),
		seconds: Number.parseInt(asctimeDate[6] ?? "", 10)
	});
}
function parseHttpDateComponentsMs(components) {
	const timestamp = parseHttpDateCalendarMs(components);
	if (timestamp === void 0) return;
	const weekdayTimestamp = components.seconds === 60 ? timestamp - 1e3 : timestamp;
	if (new Date(weekdayTimestamp).getUTCDay() !== components.weekday) return;
	return timestamp;
}
function parseHttpDateCalendarMs(components) {
	const { year, month, day, hours, minutes, seconds } = components;
	if (month === void 0 || !Number.isInteger(year) || year < 1900 || !Number.isInteger(day) || day < 1 || day > 31 || !Number.isInteger(hours) || hours < 0 || hours > 23 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59 || !Number.isInteger(seconds) || seconds < 0 || seconds > 60) return;
	const calendarSecond = Math.min(seconds, 59);
	const timestamp = Date.UTC(year, month, day, hours, minutes, calendarSecond);
	const parsedDate = new Date(timestamp);
	if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month || parsedDate.getUTCDate() !== day || parsedDate.getUTCHours() !== hours || parsedDate.getUTCMinutes() !== minutes || parsedDate.getUTCSeconds() !== calendarSecond) return;
	return seconds === 60 ? timestamp + 1e3 : timestamp;
}
//#endregion
//#region src/infra/clawhub-retry.ts
const CLAWHUB_RETRY_DELAYS_MS = [
	1e3,
	3e3,
	1e4
];
const CLAWHUB_MAX_RETRY_AFTER_MS = 6e4;
var RetryableClawHubResponse = class extends Error {
	constructor(result) {
		super(`ClawHub request returned retryable status ${result.response.status}`);
		this.result = result;
	}
};
function isRetryableClawHubStatus(status, retryRateLimit) {
	return retryRateLimit && status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}
function parseRetryAfterMs(headers) {
	const retryAfter = headers.get("retry-after")?.trim();
	if (!retryAfter) return;
	if (/^\d+$/.test(retryAfter)) {
		const seconds = Number(retryAfter);
		const delayMs = Math.round(seconds * 1e3);
		return delayMs <= CLAWHUB_MAX_RETRY_AFTER_MS ? delayMs : void 0;
	}
	const retryAt = parseRetryAfterHttpDateMs(retryAfter);
	if (retryAt === void 0) return;
	const delayMs = Math.max(0, retryAt - Date.now());
	return delayMs <= CLAWHUB_MAX_RETRY_AFTER_MS ? delayMs : void 0;
}
async function defaultSleep(ms) {
	await new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
/**
* Retries idempotent ClawHub reads on transient HTTP and transport failures.
* Callers retain the final response so their existing body limits and errors apply.
*/
async function retryClawHubRead(request, options) {
	try {
		return await require_retry.retryAsync(async () => {
			const result = await request();
			if (isRetryableClawHubStatus(result.response.status, options.retryRateLimit === true)) throw new RetryableClawHubResponse(result);
			return result;
		}, {
			attempts: CLAWHUB_RETRY_DELAYS_MS.length + 1,
			minDelayMs: 0,
			maxDelayMs: CLAWHUB_MAX_RETRY_AFTER_MS,
			delayMs: ({ attempt }) => CLAWHUB_RETRY_DELAYS_MS[attempt - 1] ?? 0,
			retryAfterMs: (error) => error instanceof RetryableClawHubResponse ? parseRetryAfterMs(error.result.response.headers) : void 0,
			onRetry: async ({ err }) => {
				if (err instanceof RetryableClawHubResponse) await options.disposeRetry(err.result);
			},
			sleep: options.sleep ?? defaultSleep
		});
	} catch (error) {
		if (error instanceof RetryableClawHubResponse) return error.result;
		throw error;
	}
}
//#endregion
//#region src/infra/temp-download.ts
const logger = require_subsystem.createSubsystemLogger("infra:temp-download");
function resolveTempRoot(tmpDir) {
	return tmpDir ?? require_tmp_operator_dir.resolvePreferredOperatorTmpDir();
}
function sanitizeTempPrefix(prefix) {
	return prefix.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "tmp";
}
function sanitizeTempExtension(extension) {
	if (!extension) return "";
	const token = ((extension.startsWith(".") ? extension : `.${extension}`).match(/[a-zA-Z0-9._-]+$/)?.[0] ?? "").replace(/^[._-]+/, "");
	return token ? `.${token}` : "";
}
function sanitizeTempFileName(fileName) {
	return node_path.default.basename(fileName).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "download.bin";
}
/** Build a stable temp path shape while keeping caller-controlled text filename-safe. */
function buildRandomTempFilePath(params) {
	const nowCandidate = params.now;
	const now = typeof nowCandidate === "number" && Number.isFinite(nowCandidate) ? Math.trunc(nowCandidate) : Date.now();
	const uuid = params.uuid?.trim() || node_crypto.default.randomUUID();
	return node_path.default.join(resolveTempRoot(params.tmpDir), `${sanitizeTempPrefix(params.prefix)}-${now}-${uuid}${sanitizeTempExtension(params.extension)}`);
}
function buildTempDownloadTarget(workspace, fileName) {
	const file = (nextName) => workspace.path(sanitizeTempFileName(nextName ?? fileName ?? "download.bin"));
	return {
		dir: workspace.dir,
		path: file(),
		file,
		cleanup: async () => {
			await workspace.cleanup();
		},
		[Symbol.asyncDispose]: workspace[Symbol.asyncDispose].bind(workspace)
	};
}
async function createTempDownloadTarget(params) {
	const workspace = await (0, _openclaw_fs_safe_temp.tempWorkspace)({
		rootDir: resolveTempRoot(params.tmpDir),
		prefix: sanitizeTempPrefix(params.prefix)
	});
	const target = buildTempDownloadTarget(workspace, params.fileName);
	const cleanup = async () => {
		try {
			await workspace.cleanup();
		} catch (err) {
			logger.warn(`temp-path cleanup failed: ${String(err)}`, { error: err });
		}
	};
	return {
		...target,
		cleanup,
		[Symbol.asyncDispose]: cleanup
	};
}
//#endregion
//#region src/infra/clawhub.ts
const DEFAULT_CLAWHUB_URL = "https://clawhub.ai";
const DEFAULT_GITHUB_CODELOAD_URL = "https://codeload.github.com";
const DEFAULT_FETCH_TIMEOUT_MS = 3e4;
const CLAWHUB_ARCHIVE_MAX_BYTES = 256 * 1024 * 1024;
const CLAWHUB_JSON_MAX_BYTES = 16 * 1024 * 1024;
const CLAWHUB_ERROR_BODY_MAX_BYTES = 8 * 1024;
const CLAWHUB_ERROR_BODY_MAX_CHARS = 400;
function resolveClawHubRequestTimeoutMs(timeoutMs) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(timeoutMs, DEFAULT_FETCH_TIMEOUT_MS);
}
var ClawHubRequestError = class extends Error {
	constructor(params) {
		super(`ClawHub ${params.path} failed (${params.status}): ${params.body}`);
		this.name = "ClawHubRequestError";
		this.status = params.status;
		this.requestPath = params.path;
		this.responseBody = params.body;
	}
};
function normalizeBaseUrl(baseUrl) {
	const envValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.OPERATOR_CLAWHUB_URL) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.CLAWHUB_URL) || DEFAULT_CLAWHUB_URL;
	return ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(baseUrl) || envValue).replace(/\/+$/, "") || DEFAULT_CLAWHUB_URL;
}
function normalizeGitHubCodeloadBaseUrl() {
	return ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.CLAWHUB_GITHUB_CODELOAD_BASE_URL) || DEFAULT_GITHUB_CODELOAD_URL).replace(/\/+$/, "") || DEFAULT_GITHUB_CODELOAD_URL;
}
function extractTokenFromClawHubConfig(value) {
	if (!value || typeof value !== "object") return;
	const record = value;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.accessToken) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.authToken) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.apiToken) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.token) ?? extractTokenFromClawHubConfig(record.auth) ?? extractTokenFromClawHubConfig(record.session) ?? extractTokenFromClawHubConfig(record.credentials) ?? extractTokenFromClawHubConfig(record.user);
}
function resolveClawHubConfigPaths() {
	const explicit = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.CLAWHUB_CONFIG_PATH) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.CLAWDHUB_CONFIG_PATH);
	if (explicit) return [explicit];
	const xdgConfigHome = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.XDG_CONFIG_HOME);
	const configHome = xdgConfigHome && xdgConfigHome.length > 0 ? xdgConfigHome : node_path.default.join(node_os.default.homedir(), ".config");
	const xdgPath = node_path.default.join(configHome, "clawhub", "config.json");
	if (process.platform === "darwin") return [node_path.default.join(node_os.default.homedir(), "Library", "Application Support", "clawhub", "config.json"), xdgPath];
	return [xdgPath];
}
async function resolveClawHubAuthToken() {
	const envToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.CLAWHUB_TOKEN) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.CLAWHUB_AUTH_TOKEN);
	if (envToken) return envToken;
	for (const configPath of resolveClawHubConfigPaths()) try {
		const raw = await node_fs_promises.default.readFile(configPath, "utf8");
		const token = extractTokenFromClawHubConfig(JSON.parse(raw));
		if (token) return token;
	} catch {}
}
function normalizePartialComparableVersion(version) {
	const trimmed = version.trim();
	return /^[vV]?[0-9]+\.[0-9]+$/.test(trimmed) ? {
		version: `${trimmed}.0`,
		isPartial: true
	} : {
		version: trimmed,
		isPartial: false
	};
}
function shouldPreservePluginApiPrereleaseFloor(target) {
	return Boolean((0, semver.prerelease)(normalizePartialComparableVersion(target).version));
}
function normalizePluginApiVersionForComparator(version, target) {
	const normalizedCorrection = normalizeOperatorNumericCorrectionForPluginApi(version);
	if (normalizedCorrection) return normalizedCorrection;
	return shouldPreservePluginApiPrereleaseFloor(target) ? version : normalizeOperatorReleaseSuffixForPluginApi(version);
}
function satisfiesComparator(version, token) {
	const trimmed = token.trim();
	if (!trimmed) return true;
	const match = /^(>=|<=|>|<|=|\^|~)?\s*(.+)$/.exec(trimmed);
	if (!match) return false;
	const operator = match[1] ?? "";
	const target = match[2]?.trim();
	if (!target || /^[<>=^~]/.test(target)) return false;
	const comparableVersion = normalizePluginApiVersionForComparator(version, target);
	const normalizedTarget = normalizePartialComparableVersion(target);
	return (0, semver.satisfies)(comparableVersion, normalizedTarget.isPartial && !operator ? `>=${normalizedTarget.version}` : `${operator}${normalizedTarget.version}`, { includePrerelease: true });
}
function satisfiesSemverRange(version, range) {
	if (range.includes("||")) return false;
	const tokens = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(range.trim().split(/\s+/));
	if (tokens.length === 0) return false;
	return tokens.every((token) => satisfiesComparator(version, token));
}
const OPERATOR_RELEASE_SUFFIX_PATTERN = /^[vV]?(\d{4}\.[1-9]\d?\.[1-9]\d*)(?:-\d+|-(?:alpha|beta|rc)\.\d+)$/i;
const OPERATOR_NUMERIC_CORRECTION_PATTERN = /^[vV]?(\d{4}\.[1-9]\d?\.[1-9]\d*)-\d+$/;
function normalizeOperatorNumericCorrectionForPluginApi(pluginApiVersion) {
	return OPERATOR_NUMERIC_CORRECTION_PATTERN.exec(pluginApiVersion.trim())?.[1];
}
function normalizeOperatorReleaseSuffixForPluginApi(pluginApiVersion) {
	return OPERATOR_RELEASE_SUFFIX_PATTERN.exec(pluginApiVersion.trim())?.[1] ?? pluginApiVersion;
}
function buildUrl(params) {
	if (params.url) {
		const url = new URL(params.url, `${normalizeBaseUrl(params.baseUrl)}/`);
		for (const [key, value] of Object.entries(params.search ?? {})) {
			if (!value) continue;
			url.searchParams.set(key, value);
		}
		return url;
	}
	if (!params.path) throw new Error("ClawHub request path is required");
	const url = new URL(`${normalizeBaseUrl(params.baseUrl)}/`);
	url.pathname = `${url.pathname.replace(/\/+$/, "")}${params.path.startsWith("/") ? params.path : `/${params.path}`}`;
	for (const [key, value] of Object.entries(params.search ?? {})) {
		if (!value) continue;
		url.searchParams.set(key, value);
	}
	return url;
}
async function clawhubRequest(params) {
	const url = buildUrl(params);
	const token = params.skipAuth ? void 0 : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.token) || await resolveClawHubAuthToken();
	const timeoutMs = resolveClawHubRequestTimeoutMs(params.timeoutMs);
	const request = async () => {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(/* @__PURE__ */ new Error(`ClawHub request timed out after ${timeoutMs}ms`)), timeoutMs);
		const headers = {
			...token ? { Authorization: `Bearer ${token}` } : {},
			...params.json === void 0 ? {} : { "Content-Type": "application/json" },
			...params.headers
		};
		const init = { signal: controller.signal };
		if (params.method) init.method = params.method;
		if (Object.keys(headers).length > 0) init.headers = headers;
		if (params.json !== void 0) init.body = JSON.stringify(params.json);
		try {
			return {
				response: await (params.fetchImpl ?? fetch)(url, init),
				url,
				hasToken: Boolean(token)
			};
		} finally {
			clearTimeout(timeout);
		}
	};
	if ((params.method ?? "GET") !== "GET" || params.retryTransientReads === false) return await request();
	return await retryClawHubRead(request, { disposeRetry: async ({ response }) => {
		await response.body?.cancel().catch(() => void 0);
	} });
}
async function readErrorBody(response, timeoutMs) {
	try {
		return await require_http_body.readResponseTextSnippet(response, {
			maxBytes: CLAWHUB_ERROR_BODY_MAX_BYTES,
			maxChars: CLAWHUB_ERROR_BODY_MAX_CHARS,
			chunkTimeoutMs: resolveClawHubRequestTimeoutMs(timeoutMs)
		}) || response.statusText || `HTTP ${response.status}`;
	} catch {
		return response.statusText || `HTTP ${response.status}`;
	}
}
async function buildClawHubError(response, url, hasToken, timeoutMs) {
	let body = await readErrorBody(response, timeoutMs);
	if (response.status === 429) {
		const suffix = formatRateLimitSuffix(response.headers, hasToken);
		if (suffix) body = `${body} ${suffix}`;
	}
	return new ClawHubRequestError({
		path: url.pathname,
		status: response.status,
		body
	});
}
function formatRateLimitSuffix(headers, hasToken) {
	const reset = normalizeHeaderValue(headers.get("RateLimit-Reset")) ?? normalizeHeaderValue(headers.get("Retry-After"));
	const segments = [];
	if (reset && Number.isFinite(Number(reset))) segments.push(`(resets in ${reset}s)`);
	if (!hasToken) segments.push("Sign in for higher rate limits.");
	return segments.join(" ");
}
async function fetchJson(params) {
	const { response, url, hasToken } = await clawhubRequest(params);
	if (!response.ok) throw await buildClawHubError(response, url, hasToken, params.timeoutMs);
	return parseClawHubJsonBody(response, url, params.timeoutMs);
}
async function parseClawHubJsonBody(response, url, timeoutMs) {
	const buffer = await require_http_body.readResponseWithLimit(response, CLAWHUB_JSON_MAX_BYTES, {
		chunkTimeoutMs: resolveClawHubRequestTimeoutMs(timeoutMs),
		onOverflow: ({ size, maxBytes }) => /* @__PURE__ */ new Error(`ClawHub ${url.pathname} response exceeded ${maxBytes} bytes (${size} bytes received)`),
		onIdleTimeout: ({ chunkTimeoutMs }) => /* @__PURE__ */ new Error(`ClawHub ${url.pathname} response stalled after ${chunkTimeoutMs}ms`)
	});
	try {
		return JSON.parse(new TextDecoder().decode(buffer));
	} catch (cause) {
		throw new Error(`ClawHub ${url.pathname} returned malformed JSON`, { cause });
	}
}
async function readClawHubResponseBytes(params) {
	const timeoutMs = resolveClawHubRequestTimeoutMs(params.timeoutMs);
	const maxBytes = params.maxBytes ?? CLAWHUB_ARCHIVE_MAX_BYTES;
	const contentEncoding = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.response.headers.get("content-encoding"));
	const declaredSize = !contentEncoding || contentEncoding.toLowerCase() === "identity" ? require_parse_finite_number.parseStrictNonNegativeInteger(params.response.headers.get("content-length")) : void 0;
	if (declaredSize !== void 0 && declaredSize > maxBytes) {
		await params.response.body?.cancel().catch(() => void 0);
		throw createClawHubBodyLimitError(params.resourceLabel, declaredSize, maxBytes, "declared");
	}
	return await require_http_body.readResponseWithLimit(params.response, maxBytes, {
		chunkTimeoutMs: timeoutMs,
		onOverflow: ({ size, maxBytes: limitBytes }) => createClawHubBodyLimitError(params.resourceLabel, size, limitBytes),
		onIdleTimeout: ({ chunkTimeoutMs }) => /* @__PURE__ */ new Error(`ClawHub ${params.resourceLabel} body stalled after ${chunkTimeoutMs}ms`)
	});
}
function createClawHubBodyLimitError(resourceLabel, size, maxBytes, measurement = "received") {
	return /* @__PURE__ */ new Error(`ClawHub ${resourceLabel} exceeded ${maxBytes} bytes (${size} bytes ${measurement})`);
}
function isJsonObject(value) {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function optionalStringField(source, field, context) {
	const value = source[field];
	if (value === void 0 || value === null || typeof value === "string") return value;
	throw new Error(`Malformed ClawHub ${context}: expected ${field} to be a string or null.`);
}
function requiredBooleanField(source, field, context) {
	const value = source[field];
	if (typeof value === "boolean") return value;
	throw new Error(`Malformed ClawHub ${context}: expected ${field} to be a boolean.`);
}
function requiredStringArrayField(source, field, context) {
	const value = source[field];
	if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) return value;
	throw new Error(`Malformed ClawHub ${context}: expected ${field} to be a string array.`);
}
function parseOptionalSecurityPackage(value) {
	if (value === void 0 || value === null) return value;
	if (!isJsonObject(value)) throw new Error("Malformed ClawHub security response: expected package to be an object or null.");
	const result = {};
	const name = optionalStringField(value, "name", "security package");
	const displayName = optionalStringField(value, "displayName", "security package");
	const family = optionalStringField(value, "family", "security package");
	if (name !== void 0) result.name = name;
	if (displayName !== void 0) result.displayName = displayName;
	if (family !== void 0) result.family = family;
	return result;
}
function parseOptionalSecurityRelease(value) {
	if (value === void 0 || value === null) return value;
	if (!isJsonObject(value)) throw new Error("Malformed ClawHub security response: expected release to be an object or null.");
	const result = {};
	const releaseId = optionalStringField(value, "releaseId", "security release");
	const legacyId = optionalStringField(value, "id", "security release");
	const version = optionalStringField(value, "version", "security release");
	const id = releaseId ?? legacyId;
	if (id !== void 0) result.id = id;
	if (version !== void 0) result.version = version;
	return result;
}
function parseClawHubPackageSecurityResponse(value) {
	if (!isJsonObject(value)) throw new Error("Malformed ClawHub security response: expected an object.");
	const trust = value.trust;
	if (!isJsonObject(trust)) throw new Error("Malformed ClawHub security response: expected trust to be an object.");
	const parsedTrust = {
		blockedFromDownload: requiredBooleanField(trust, "blockedFromDownload", "security trust"),
		reasons: requiredStringArrayField(trust, "reasons", "security trust"),
		pending: requiredBooleanField(trust, "pending", "security trust"),
		stale: requiredBooleanField(trust, "stale", "security trust")
	};
	const scanStatus = optionalStringField(trust, "scanStatus", "security trust");
	const moderationState = optionalStringField(trust, "moderationState", "security trust");
	if (scanStatus !== void 0) parsedTrust.scanStatus = scanStatus;
	if (moderationState !== void 0) parsedTrust.moderationState = moderationState;
	const result = { trust: parsedTrust };
	const parsedPackage = parseOptionalSecurityPackage(value.package);
	const parsedRelease = parseOptionalSecurityRelease(value.release);
	if (parsedPackage !== void 0) result.package = parsedPackage;
	if (parsedRelease !== void 0) result.release = parsedRelease;
	return result;
}
/** Resolves the configured ClawHub base URL, falling back to the default public host. */
function resolveClawHubBaseUrl(baseUrl) {
	return normalizeBaseUrl(baseUrl);
}
function isDefaultClawHubBaseUrl(baseUrl) {
	return normalizeBaseUrl(baseUrl) === normalizeBaseUrl(DEFAULT_CLAWHUB_URL);
}
function buildVersionOrTagSearch(params) {
	const version = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.version);
	const ownerHandle = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.ownerHandle);
	if (version) return {
		version,
		...ownerHandle ? { ownerHandle } : {}
	};
	const tag = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.tag);
	if (tag) return {
		tag,
		...ownerHandle ? { ownerHandle } : {}
	};
	return ownerHandle ? { ownerHandle } : void 0;
}
function buildGitHubZipUrl(repo, commit) {
	const url = new URL(`${normalizeGitHubCodeloadBaseUrl()}/`);
	url.pathname = `${url.pathname.replace(/\/+$/, "")}/${repo.split("/").map((segment) => encodeURIComponent(segment)).join("/")}/zip/${encodeURIComponent(commit)}`;
	return url.toString();
}
function formatSha256Integrity(bytes) {
	return `sha256-${require_crypto_digest.sha256Base64(bytes)}`;
}
function formatSha256Hex(bytes) {
	return require_crypto_digest.sha256Hex(bytes);
}
function formatSha512Integrity(bytes) {
	return `sha512-${(0, node_crypto.createHash)("sha512").update(bytes).digest("base64")}`;
}
function formatSha1Hex(bytes) {
	return (0, node_crypto.createHash)("sha1").update(bytes).digest("hex");
}
function normalizeHeaderValue(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	return normalized && normalized.length > 0 ? normalized : void 0;
}
function safePackageTarballName(name, version) {
	return `${name.replace(/^@/, "").replace(/[\\/]+/g, "-").replace(/[^A-Za-z0-9._-]/g, "-") || "package"}-${version}.tgz`;
}
/** Normalizes ClawHub SHA-256 metadata into Subresource Integrity format. */
function normalizeClawHubSha256Integrity(value) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const prefixedBase64 = /^sha256-([A-Za-z0-9+/]+={0,1})$/.exec(trimmed);
	if (prefixedBase64?.[1]) {
		try {
			const decoded = Buffer.from(prefixedBase64[1], "base64");
			if (decoded.length === 32) return `sha256-${decoded.toString("base64")}`;
		} catch {
			return null;
		}
		return null;
	}
	const prefixedHex = /^sha256:([A-Fa-f0-9]{64})$/.exec(trimmed);
	if (prefixedHex?.[1]) return `sha256-${Buffer.from(prefixedHex[1], "hex").toString("base64")}`;
	if (/^[A-Fa-f0-9]{64}$/.test(trimmed)) return `sha256-${Buffer.from(trimmed, "hex").toString("base64")}`;
	return null;
}
/** Normalizes ClawHub SHA-256 metadata into lowercase hex form. */
function normalizeClawHubSha256Hex(value) {
	const trimmed = value.trim();
	if (!/^[A-Fa-f0-9]{64}$/.test(trimmed)) return null;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
}
async function fetchClawHubPackageDetail(params) {
	return await fetchJson({
		baseUrl: params.baseUrl,
		path: `/api/v1/packages/${encodeURIComponent(params.name)}`,
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl
	});
}
async function fetchClawHubPackageVersion(params) {
	return await fetchJson({
		baseUrl: params.baseUrl,
		path: `/api/v1/packages/${encodeURIComponent(params.name)}/versions/${encodeURIComponent(params.version)}`,
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl
	});
}
async function fetchClawHubPackageArtifact(params) {
	return await fetchJson({
		baseUrl: params.baseUrl,
		path: `/api/v1/packages/${encodeURIComponent(params.name)}/versions/${encodeURIComponent(params.version)}/artifact`,
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl
	});
}
async function fetchClawHubPackageSecurity(params) {
	return parseClawHubPackageSecurityResponse(await fetchJson({
		baseUrl: params.baseUrl,
		path: `/api/v1/packages/${encodeURIComponent(params.name)}/versions/${encodeURIComponent(params.version)}/security`,
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl
	}));
}
async function searchClawHubPackages(params) {
	return (await fetchJson({
		baseUrl: params.baseUrl,
		path: "/api/v1/packages/search",
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl,
		search: {
			q: params.query.trim(),
			family: params.family,
			limit: params.limit ? String(params.limit) : void 0
		}
	})).results ?? [];
}
async function searchClawHubSkills(params) {
	return (await fetchJson({
		baseUrl: params.baseUrl,
		path: "/api/v1/search",
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl,
		search: {
			q: params.query.trim(),
			limit: params.limit ? String(params.limit) : void 0
		}
	})).results ?? [];
}
async function fetchClawHubSkillDetail(params) {
	return await fetchJson({
		baseUrl: params.baseUrl,
		path: `/api/v1/skills/${encodeURIComponent(params.slug)}`,
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl,
		search: params.ownerHandle ? { ownerHandle: params.ownerHandle } : void 0
	});
}
async function fetchClawHubSkillInstallResolution(params) {
	const { response, url, hasToken } = await clawhubRequest({
		baseUrl: params.baseUrl,
		path: `/api/v1/skills/${encodeURIComponent(params.slug)}/install`,
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl,
		search: {
			ownerHandle: params.ownerHandle,
			forceInstall: params.forceInstall ? "1" : void 0
		}
	});
	const isStructuredBlock = [
		403,
		409,
		410,
		423
	].includes(response.status);
	if (!response.ok && !isStructuredBlock) throw await buildClawHubError(response, url, hasToken, params.timeoutMs);
	return parseClawHubJsonBody(response, url, params.timeoutMs);
}
async function fetchClawHubSkillVerification(params) {
	return await fetchJson({
		baseUrl: params.baseUrl,
		path: `/api/v1/skills/${encodeURIComponent(params.slug)}/verify`,
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl,
		search: buildVersionOrTagSearch(params)
	});
}
async function fetchClawHubSkillSecurityVerdicts(params) {
	return await fetchJson({
		baseUrl: params.baseUrl,
		path: "/api/v1/skills/-/security-verdicts",
		method: "POST",
		json: { items: params.items },
		token: params.token,
		skipAuth: params.skipAuth,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl
	});
}
async function downloadClawHubPackageArchive(params) {
	if (params.artifact === "clawpack") {
		if (!params.version) throw new Error("ClawPack package downloads require an explicit version.");
		const { response, url, hasToken } = await clawhubRequest({
			baseUrl: params.baseUrl,
			path: `/api/v1/packages/${encodeURIComponent(params.name)}/versions/${encodeURIComponent(params.version)}/artifact/download`,
			token: params.token,
			timeoutMs: params.timeoutMs,
			fetchImpl: params.fetchImpl
		});
		if (!response.ok) throw await buildClawHubError(response, url, hasToken, params.timeoutMs);
		const bytes = await readClawHubResponseBytes({
			response,
			timeoutMs: params.timeoutMs,
			resourceLabel: `ClawPack download for ${params.name}@${params.version}`
		});
		const sha256Hex = formatSha256Hex(bytes);
		const npmIntegrity = formatSha512Integrity(bytes);
		const npmShasum = formatSha1Hex(bytes);
		const headerSha256 = normalizeClawHubSha256Hex(response.headers.get("X-ClawHub-Artifact-Sha256") ?? response.headers.get("X-ClawHub-ClawPack-Sha256") ?? "");
		if (!headerSha256) throw new Error(`ClawHub ClawPack download for "${params.name}@${params.version}" is missing X-ClawHub-Artifact-Sha256.`);
		if (headerSha256 !== sha256Hex) throw new Error(`ClawHub ClawPack download for "${params.name}@${params.version}" declared sha256 ${headerSha256}, got ${sha256Hex}.`);
		const headerNpmIntegrity = normalizeHeaderValue(response.headers.get("X-ClawHub-Npm-Integrity"));
		if (headerNpmIntegrity && headerNpmIntegrity !== npmIntegrity) throw new Error(`ClawHub ClawPack download for "${params.name}@${params.version}" declared npm integrity ${headerNpmIntegrity}, got ${npmIntegrity}.`);
		const headerNpmShasum = normalizeHeaderValue(response.headers.get("X-ClawHub-Npm-Shasum"));
		if (headerNpmShasum && headerNpmShasum !== npmShasum) throw new Error(`ClawHub ClawPack download for "${params.name}@${params.version}" declared npm shasum ${headerNpmShasum}, got ${npmShasum}.`);
		const npmTarballName = normalizeHeaderValue(response.headers.get("X-ClawHub-Npm-Tarball-Name")) ?? safePackageTarballName(params.name, params.version);
		const specVersion = require_parse_finite_number.parseStrictPositiveInteger(response.headers.get("X-ClawHub-ClawPack-Spec-Version"));
		const target = await createTempDownloadTarget({
			prefix: "operator-clawhub-clawpack",
			fileName: npmTarballName
		});
		await node_fs_promises.default.writeFile(target.path, bytes);
		return {
			archivePath: target.path,
			integrity: normalizeClawHubSha256Integrity(sha256Hex) ?? formatSha256Integrity(bytes),
			sha256Hex,
			artifact: "clawpack",
			clawpackHeaderSha256: headerSha256,
			...typeof specVersion === "number" && Number.isSafeInteger(specVersion) && specVersion >= 0 ? { clawpackHeaderSpecVersion: specVersion } : {},
			npmIntegrity,
			npmShasum,
			npmTarballName,
			cleanup: target.cleanup
		};
	}
	const search = params.version ? { version: params.version } : params.tag ? { tag: params.tag } : void 0;
	const { response, url, hasToken } = await clawhubRequest({
		baseUrl: params.baseUrl,
		path: `/api/v1/packages/${encodeURIComponent(params.name)}/download`,
		search,
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl
	});
	if (!response.ok) throw await buildClawHubError(response, url, hasToken, params.timeoutMs);
	const bytes = await readClawHubResponseBytes({
		response,
		timeoutMs: params.timeoutMs,
		resourceLabel: `package archive download for ${params.name}`
	});
	const sha256Hex = formatSha256Hex(bytes);
	const target = await createTempDownloadTarget({
		prefix: "operator-clawhub-package",
		fileName: `${params.name}.zip`
	});
	await node_fs_promises.default.writeFile(target.path, bytes);
	return {
		archivePath: target.path,
		integrity: formatSha256Integrity(bytes),
		sha256Hex,
		artifact: "archive",
		cleanup: target.cleanup
	};
}
async function downloadClawHubSkillArchive(params) {
	const { response, url, hasToken } = await clawhubRequest({
		baseUrl: params.baseUrl,
		path: "/api/v1/download",
		token: params.token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl,
		search: {
			slug: params.slug,
			ownerHandle: params.ownerHandle,
			version: params.version,
			tag: params.version ? void 0 : params.tag
		}
	});
	if (!response.ok) throw await buildClawHubError(response, url, hasToken, params.timeoutMs);
	const bytes = await readClawHubResponseBytes({
		response,
		timeoutMs: params.timeoutMs,
		resourceLabel: `skill archive download for ${params.slug}`
	});
	const sha256Hex = formatSha256Hex(bytes);
	const target = await createTempDownloadTarget({
		prefix: "operator-clawhub-skill",
		fileName: `${params.slug}.zip`
	});
	await node_fs_promises.default.writeFile(target.path, bytes);
	return {
		archivePath: target.path,
		integrity: formatSha256Integrity(bytes),
		sha256Hex,
		artifact: "archive",
		cleanup: target.cleanup
	};
}
async function downloadClawHubSkillArchiveUrl(params) {
	const explicitToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.token);
	const requestUrl = new URL(params.url, `${normalizeBaseUrl(params.baseUrl)}/`);
	const registryOrigin = new URL(`${normalizeBaseUrl(params.baseUrl)}/`).origin;
	const skipAuth = explicitToken == null && requestUrl.origin !== registryOrigin;
	const { response, url, hasToken } = await clawhubRequest({
		baseUrl: params.baseUrl,
		url: params.url,
		token: explicitToken,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl,
		skipAuth
	});
	if (!response.ok) throw await buildClawHubError(response, url, hasToken, params.timeoutMs);
	const bytes = await readClawHubResponseBytes({
		response,
		timeoutMs: params.timeoutMs,
		resourceLabel: `skill archive download at ${url.pathname}`
	});
	const sha256Hex = formatSha256Hex(bytes);
	const target = await createTempDownloadTarget({
		prefix: "operator-clawhub-skill",
		fileName: "skill.zip"
	});
	await node_fs_promises.default.writeFile(target.path, bytes);
	return {
		archivePath: target.path,
		integrity: formatSha256Integrity(bytes),
		sha256Hex,
		artifact: "archive",
		cleanup: target.cleanup
	};
}
async function downloadClawHubGitHubSkillArchive(params) {
	const { response, url, hasToken } = await clawhubRequest({
		url: buildGitHubZipUrl(params.repo, params.commit),
		skipAuth: true,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl
	});
	if (!response.ok) throw await buildClawHubError(response, url, hasToken, params.timeoutMs);
	const bytes = await readClawHubResponseBytes({
		response,
		timeoutMs: params.timeoutMs,
		resourceLabel: `GitHub source archive for ${params.repo}@${params.commit}`
	});
	const sha256Hex = formatSha256Hex(bytes);
	const target = await createTempDownloadTarget({
		prefix: "operator-clawhub-github-skill",
		fileName: `${params.commit}.zip`
	});
	await node_fs_promises.default.writeFile(target.path, bytes);
	return {
		archivePath: target.path,
		integrity: formatSha256Integrity(bytes),
		sha256Hex,
		artifact: "archive",
		cleanup: target.cleanup
	};
}
async function reportClawHubSkillInstallTelemetry(params) {
	const token = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.token) ?? await resolveClawHubAuthToken();
	if (!token || isClawHubTelemetryDisabled()) return;
	const slug = params.slug.trim();
	if (!slug) return;
	const { response, url, hasToken } = await clawhubRequest({
		baseUrl: params.baseUrl,
		path: "/api/cli/telemetry/install",
		method: "POST",
		token,
		timeoutMs: params.timeoutMs,
		fetchImpl: params.fetchImpl,
		json: {
			event: "install",
			slug,
			...params.ownerHandle ? { ownerHandle: params.ownerHandle } : {},
			version: params.version ?? void 0
		}
	});
	if (!response.ok) throw await buildClawHubError(response, url, hasToken, params.timeoutMs);
}
function isClawHubTelemetryDisabled() {
	const raw = process.env.CLAWHUB_DISABLE_TELEMETRY ?? process.env.CLAWDHUB_DISABLE_TELEMETRY;
	if (!raw) return false;
	return [
		"1",
		"true",
		"yes",
		"on"
	].includes(raw.trim().toLowerCase());
}
/** Resolves the preferred latest package version from detail metadata. */
function resolveLatestVersionFromPackage(detail) {
	return detail.package?.latestVersion ?? detail.package?.tags?.latest ?? null;
}
/** Checks whether a host plugin API version satisfies a ClawHub plugin API range. */
function satisfiesPluginApiRange(pluginApiVersion, pluginApiRange) {
	if (!pluginApiRange) return true;
	return satisfiesSemverRange(pluginApiVersion, pluginApiRange);
}
/** Checks whether the current gateway version satisfies a package minimum gateway version. */
function satisfiesGatewayMinimum(currentVersion, minGatewayVersion) {
	if (!minGatewayVersion) return true;
	const current = require_runtime_guard.parseSemver(currentVersion);
	const minimum = require_runtime_guard.parseSemver(minGatewayVersion);
	if (!current || !minimum) return false;
	return require_runtime_guard.isAtLeast(current, minimum);
}
//#endregion
Object.defineProperty(exports, "ClawHubRequestError", {
	enumerable: true,
	get: function() {
		return ClawHubRequestError;
	}
});
Object.defineProperty(exports, "buildRandomTempFilePath", {
	enumerable: true,
	get: function() {
		return buildRandomTempFilePath;
	}
});
Object.defineProperty(exports, "downloadClawHubGitHubSkillArchive", {
	enumerable: true,
	get: function() {
		return downloadClawHubGitHubSkillArchive;
	}
});
Object.defineProperty(exports, "downloadClawHubPackageArchive", {
	enumerable: true,
	get: function() {
		return downloadClawHubPackageArchive;
	}
});
Object.defineProperty(exports, "downloadClawHubSkillArchive", {
	enumerable: true,
	get: function() {
		return downloadClawHubSkillArchive;
	}
});
Object.defineProperty(exports, "downloadClawHubSkillArchiveUrl", {
	enumerable: true,
	get: function() {
		return downloadClawHubSkillArchiveUrl;
	}
});
Object.defineProperty(exports, "fetchClawHubPackageArtifact", {
	enumerable: true,
	get: function() {
		return fetchClawHubPackageArtifact;
	}
});
Object.defineProperty(exports, "fetchClawHubPackageDetail", {
	enumerable: true,
	get: function() {
		return fetchClawHubPackageDetail;
	}
});
Object.defineProperty(exports, "fetchClawHubPackageSecurity", {
	enumerable: true,
	get: function() {
		return fetchClawHubPackageSecurity;
	}
});
Object.defineProperty(exports, "fetchClawHubPackageVersion", {
	enumerable: true,
	get: function() {
		return fetchClawHubPackageVersion;
	}
});
Object.defineProperty(exports, "fetchClawHubSkillDetail", {
	enumerable: true,
	get: function() {
		return fetchClawHubSkillDetail;
	}
});
Object.defineProperty(exports, "fetchClawHubSkillInstallResolution", {
	enumerable: true,
	get: function() {
		return fetchClawHubSkillInstallResolution;
	}
});
Object.defineProperty(exports, "fetchClawHubSkillSecurityVerdicts", {
	enumerable: true,
	get: function() {
		return fetchClawHubSkillSecurityVerdicts;
	}
});
Object.defineProperty(exports, "fetchClawHubSkillVerification", {
	enumerable: true,
	get: function() {
		return fetchClawHubSkillVerification;
	}
});
Object.defineProperty(exports, "isDefaultClawHubBaseUrl", {
	enumerable: true,
	get: function() {
		return isDefaultClawHubBaseUrl;
	}
});
Object.defineProperty(exports, "normalizeClawHubSha256Hex", {
	enumerable: true,
	get: function() {
		return normalizeClawHubSha256Hex;
	}
});
Object.defineProperty(exports, "normalizeClawHubSha256Integrity", {
	enumerable: true,
	get: function() {
		return normalizeClawHubSha256Integrity;
	}
});
Object.defineProperty(exports, "parseClawHubPluginSpec", {
	enumerable: true,
	get: function() {
		return parseClawHubPluginSpec;
	}
});
Object.defineProperty(exports, "reportClawHubSkillInstallTelemetry", {
	enumerable: true,
	get: function() {
		return reportClawHubSkillInstallTelemetry;
	}
});
Object.defineProperty(exports, "resolveClawHubBaseUrl", {
	enumerable: true,
	get: function() {
		return resolveClawHubBaseUrl;
	}
});
Object.defineProperty(exports, "resolveLatestVersionFromPackage", {
	enumerable: true,
	get: function() {
		return resolveLatestVersionFromPackage;
	}
});
Object.defineProperty(exports, "satisfiesGatewayMinimum", {
	enumerable: true,
	get: function() {
		return satisfiesGatewayMinimum;
	}
});
Object.defineProperty(exports, "satisfiesPluginApiRange", {
	enumerable: true,
	get: function() {
		return satisfiesPluginApiRange;
	}
});
Object.defineProperty(exports, "searchClawHubPackages", {
	enumerable: true,
	get: function() {
		return searchClawHubPackages;
	}
});
Object.defineProperty(exports, "searchClawHubSkills", {
	enumerable: true,
	get: function() {
		return searchClawHubSkills;
	}
});
