const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_legacy_names = require("./legacy-names-CjJxLNks.cjs");
const require_parse_json_compat = require("./parse-json-compat-C77_sznm.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_official_external_plugin_bundled_catalogs = require("./official-external-plugin-bundled-catalogs-D4053ETf.cjs");
const require_installed_plugin_index_store = require("./installed-plugin-index-store-vrROJGFd.cjs");
const require_boolean = require("./boolean-DrgQ-UMw.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/manifest-metadata-scan.ts
const PLUGIN_MANIFEST_FILENAME = "operator.plugin.json";
let manifestMetadataCache;
function listChildPluginDirs(root, rank, startOrder, origin) {
	if (!root || !node_fs.default.existsSync(root)) return [];
	const dirs = [];
	let order = startOrder;
	try {
		for (const entry of node_fs.default.readdirSync(root, { withFileTypes: true })) if (entry.isDirectory()) dirs.push({
			pluginDir: node_path.default.join(root, entry.name),
			rank,
			order: order++,
			origin
		});
	} catch {
		return [];
	}
	return dirs;
}
function readJsonObject(filePath) {
	try {
		const parsed = require_parse_json_compat.parseJsonWithJson5Fallback(node_fs.default.readFileSync(filePath, "utf8"));
		return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
function readManifestObject(pluginDir) {
	return readJsonObject(node_path.default.join(pluginDir, PLUGIN_MANIFEST_FILENAME));
}
function manifestFileFingerprint(pluginDir) {
	const manifestPath = node_path.default.join(pluginDir, PLUGIN_MANIFEST_FILENAME);
	try {
		const stat = node_fs.default.statSync(manifestPath);
		return `${manifestPath}:${stat.mtimeMs}:${stat.size}`;
	} catch {
		return `${manifestPath}:missing`;
	}
}
function listPersistedIndexPluginDirs(env, startOrder) {
	const index = require_installed_plugin_index_store.readPersistedInstalledPluginIndexSync({ env });
	if (!index) return [];
	const dirs = [];
	let order = startOrder;
	for (const plugin of index.plugins) {
		const rootDir = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(plugin.rootDir);
		if (!rootDir) continue;
		dirs.push({
			pluginDir: require_home_dir.resolveHomeRelativePath(rootDir, { env }),
			rank: plugin.origin === "bundled" ? 3 : 1,
			order: order++,
			origin: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(plugin.origin)
		});
	}
	return dirs;
}
function isSourceCheckoutRoot(packageRoot) {
	return node_fs.default.existsSync(node_path.default.join(packageRoot, "pnpm-workspace.yaml")) && node_fs.default.existsSync(node_path.default.join(packageRoot, "src")) && node_fs.default.existsSync(node_path.default.join(packageRoot, "extensions"));
}
function resolvePackageRootsForSourceManifestMetadata() {
	const roots = [];
	for (const params of [{ argv1: process.argv[1] }, { moduleUrl: require("url").pathToFileURL(__filename).href }]) {
		const root = require_openclaw_root.resolveOperatorPackageRootSync(params);
		if (root && !roots.includes(root)) roots.push(root);
	}
	return roots;
}
function listSourceCheckoutPluginDirs(startOrder) {
	const dirs = [];
	let order = startOrder;
	for (const packageRoot of resolvePackageRootsForSourceManifestMetadata()) {
		if (!isSourceCheckoutRoot(packageRoot)) continue;
		dirs.push(...listChildPluginDirs(node_path.default.join(packageRoot, "extensions"), 3, order, "source"));
		order = startOrder + dirs.length;
	}
	return dirs;
}
function resolveComparablePath(filePath) {
	try {
		return node_fs.default.realpathSync(filePath);
	} catch {
		return node_path.default.resolve(filePath);
	}
}
function uniqueCandidateDirs(candidates) {
	const byPath = /* @__PURE__ */ new Map();
	for (const candidate of candidates) {
		const key = resolveComparablePath(candidate.pluginDir);
		const existing = byPath.get(key);
		if (!existing || candidate.rank < existing.rank || candidate.order < existing.order) byPath.set(key, candidate);
	}
	return [...byPath.values()].toSorted((left, right) => left.rank - right.rank || left.order - right.order);
}
/** Lists plugin manifest metadata from installed, bundled, and global plugin roots. */
function listOperatorPluginManifestMetadata(env = process.env) {
	const candidates = [];
	let order = 0;
	candidates.push(...listPersistedIndexPluginDirs(env, order));
	order = candidates.length;
	candidates.push(...listChildPluginDirs(require_bundled_dir.resolveBundledPluginsDir(env), 2, order, "bundled"));
	order = candidates.length;
	candidates.push(...listSourceCheckoutPluginDirs(order));
	order = candidates.length;
	candidates.push(...listChildPluginDirs(node_path.default.join(require_paths.resolveStateDir(env), "extensions"), 4, order, "global"));
	const uniqueCandidates = uniqueCandidateDirs(candidates);
	const cacheKey = JSON.stringify(uniqueCandidates.map((candidate) => [
		candidate.pluginDir,
		candidate.rank,
		candidate.order,
		candidate.origin ?? "",
		manifestFileFingerprint(candidate.pluginDir)
	]));
	if (manifestMetadataCache?.key === cacheKey) return manifestMetadataCache.records.slice();
	const byManifestId = /* @__PURE__ */ new Map();
	const records = [];
	for (const candidate of uniqueCandidates) {
		const manifest = readManifestObject(candidate.pluginDir);
		if (!manifest) continue;
		const manifestId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest.id);
		if (manifestId) {
			const existing = byManifestId.get(manifestId);
			if (existing && existing.rank <= candidate.rank) continue;
			byManifestId.set(manifestId, candidate);
		}
		records.push({
			pluginDir: candidate.pluginDir,
			manifest,
			origin: candidate.origin
		});
	}
	manifestMetadataCache = {
		key: cacheKey,
		records
	};
	return records;
}
//#endregion
//#region src/plugins/official-external-provider-endpoints.ts
/**
* Provider endpoint metadata for officially externalized provider plugins.
*
* Endpoint classification (SSRF, attribution, payload-compat policy) keys off
* base URLs and must keep working when the owning plugin is not installed:
* dist packages exclude externalized plugins, so their manifests are invisible
* to bundled discovery. Only the repo-bundled catalog JSON feeds this table;
* hosted marketplace feeds must never influence endpoint classification.
* Kept separate from official-external-plugin-catalog.ts so provider
* transports do not pull the ClawHub install/marketplace module graph.
*/
/**
* Lists manifest-shaped catalog metadata blocks that declare provider endpoints.
*
* The catalog mirrors manifests faithfully, including endpoint classes core
* does not (yet) recognize (e.g. deepinfra-native, gmi-native). The endpoint
* reader filters unknown classes exactly as it does for installed manifests,
* so they stay inert instead of complicating the mirror contract.
*/
function listOfficialExternalProviderEndpointManifests() {
	const entries = require_official_external_plugin_bundled_catalogs.official_external_provider_catalog_default.entries;
	if (!Array.isArray(entries)) return [];
	const manifests = [];
	for (const entry of entries) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) continue;
		const manifest = entry[require_legacy_names.MANIFEST_KEY];
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(manifest) && Array.isArray(manifest.providerEndpoints)) manifests.push(manifest);
	}
	return manifests;
}
//#endregion
//#region src/agents/provider-attribution.ts
/**
* Provider endpoint attribution and request capability resolver.
*
* Classifies provider routes so transports know which attribution headers, payload features, and endpoint policies apply.
*/
function readCompatBoolean(compat, key) {
	if (!compat || typeof compat !== "object") return;
	return require_boolean.asBoolean(compat[key]);
}
const OPERATOR_ATTRIBUTION_PRODUCT = "Operator";
const OPERATOR_ATTRIBUTION_ORIGINATOR = "@gabrielvfonseca/operator";
const OPENROUTER_ATTRIBUTION_CATEGORIES = "cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent";
const LOCAL_ENDPOINT_HOSTS = /* @__PURE__ */ new Set([
	"localhost",
	"127.0.0.1",
	"::1",
	"[::1]"
]);
const OPENAI_RESPONSES_APIS = /* @__PURE__ */ new Set([
	"openai-responses",
	"azure-openai-responses",
	"openai-chatgpt-responses"
]);
const OPENAI_RESPONSES_PROVIDERS = /* @__PURE__ */ new Set([
	"openai",
	"azure-openai",
	"azure-openai-responses"
]);
const MANIFEST_PROVIDER_ENDPOINT_CLASSES = /* @__PURE__ */ new Set([
	"anthropic-public",
	"cerebras-native",
	"chutes-native",
	"deepseek-native",
	"github-copilot-native",
	"groq-native",
	"meta-native",
	"mistral-public",
	"moonshot-native",
	"modelstudio-native",
	"nvidia-native",
	"openai-public",
	"openai",
	"opencode-native",
	"azure-openai",
	"openrouter",
	"xai-native",
	"xiaomi-native",
	"zai-native",
	"google-generative-ai",
	"google-vertex"
]);
let manifestProviderEndpointCache = null;
let manifestProviderRequestCache = null;
function formatOperatorUserAgent(version) {
	return `${OPERATOR_ATTRIBUTION_ORIGINATOR}/${version}`;
}
function tryParseHostname(value) {
	try {
		return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(new URL(value).hostname);
	} catch {
		return;
	}
}
function isSchemelessHostnameCandidate(value) {
	return /^[a-z0-9.[\]-]+(?::\d+)?(?:[/?#].*)?$/i.test(value);
}
function resolveUrlHostname(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return;
	const parsedHostname = tryParseHostname(trimmed);
	if (parsedHostname) return parsedHostname;
	if (!isSchemelessHostnameCandidate(trimmed)) return;
	return tryParseHostname(`https://${trimmed}`);
}
function normalizeComparableBaseUrl(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return;
	const parsedValue = tryParseHostname(trimmed) || !isSchemelessHostnameCandidate(trimmed) ? trimmed : `https://${trimmed}`;
	try {
		const url = new URL(parsedValue);
		if (url.protocol !== "http:" && url.protocol !== "https:") return;
		url.hash = "";
		url.search = "";
		return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(url.toString().replace(/\/+$/, ""));
	} catch {
		return;
	}
}
function isManifestProviderEndpointClass(value) {
	return MANIFEST_PROVIDER_ENDPOINT_CLASSES.has(value);
}
function readManifestProviderEndpoints(manifest) {
	if (!Array.isArray(manifest.providerEndpoints)) return [];
	const entries = [];
	for (const rawEndpoint of manifest.providerEndpoints) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawEndpoint)) continue;
		const endpointClassRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawEndpoint.endpointClass);
		if (!endpointClassRaw || !isManifestProviderEndpointClass(endpointClassRaw)) continue;
		entries.push({
			endpointClass: endpointClassRaw,
			hosts: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(rawEndpoint.hosts).map((host) => host.toLowerCase()),
			hostSuffixes: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(rawEndpoint.hostSuffixes).map((host) => host.toLowerCase()),
			normalizedBaseUrls: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(rawEndpoint.baseUrls).map((baseUrl) => normalizeComparableBaseUrl(baseUrl)).filter((baseUrl) => baseUrl !== void 0),
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawEndpoint.googleVertexRegion) ? { googleVertexRegion: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawEndpoint.googleVertexRegion) } : {},
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawEndpoint.googleVertexRegionHostSuffix) ? { googleVertexRegionHostSuffix: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawEndpoint.googleVertexRegionHostSuffix) } : {}
		});
	}
	return entries;
}
function readManifestProviderRequests(manifest) {
	const providerRequest = manifest.providerRequest;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providerRequest) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providerRequest.providers)) return [];
	const entries = [];
	for (const [providerRaw, requestRaw] of Object.entries(providerRequest.providers)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(requestRaw)) continue;
		const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(providerRaw);
		if (!provider) continue;
		const compatibilityFamily = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(requestRaw.compatibilityFamily) === "moonshot" ? "moonshot" : void 0;
		const supportsStreamingUsage = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(requestRaw.openAICompletions) ? requestRaw.openAICompletions.supportsStreamingUsage : void 0;
		entries.push([provider, {
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(requestRaw.family) ? { family: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(requestRaw.family) } : {},
			...compatibilityFamily ? { compatibilityFamily } : {},
			...typeof supportsStreamingUsage === "boolean" ? { supportsOpenAICompletionsStreamingUsageCompat: supportsStreamingUsage } : {}
		}]);
	}
	return entries;
}
function collectManifestProviderEndpoints() {
	const entries = [];
	for (const { manifest } of listOperatorPluginManifestMetadata()) entries.push(...readManifestProviderEndpoints(manifest));
	for (const manifest of listOfficialExternalProviderEndpointManifests()) entries.push(...readManifestProviderEndpoints(manifest));
	return entries;
}
function collectManifestProviderRequests() {
	const entries = /* @__PURE__ */ new Map();
	for (const { manifest } of listOperatorPluginManifestMetadata()) for (const [provider, request] of readManifestProviderRequests(manifest)) entries.set(provider, request);
	return entries;
}
function loadManifestProviderEndpointCache() {
	if (!manifestProviderEndpointCache) manifestProviderEndpointCache = collectManifestProviderEndpoints();
	return manifestProviderEndpointCache;
}
function loadManifestProviderRequestCache() {
	if (!manifestProviderRequestCache) manifestProviderRequestCache = collectManifestProviderRequests();
	return manifestProviderRequestCache;
}
function resolveManifestProviderRequest(provider) {
	return provider ? loadManifestProviderRequestCache().get(provider) : void 0;
}
function hostMatchesSuffix(host, suffix) {
	if (!suffix) return false;
	return suffix.startsWith(".") || suffix.startsWith("-") ? host.endsWith(suffix) : host === suffix || host.endsWith(`.${suffix}`);
}
function buildManifestEndpointResolution(endpoint, host) {
	const regionSuffix = endpoint.googleVertexRegionHostSuffix;
	const googleVertexRegion = endpoint.googleVertexRegion ?? (regionSuffix && host.endsWith(regionSuffix) ? host.slice(0, -regionSuffix.length) : void 0);
	return {
		endpointClass: endpoint.endpointClass,
		hostname: host,
		...googleVertexRegion ? { googleVertexRegion } : {}
	};
}
function resolveManifestProviderEndpoint(params) {
	for (const endpoint of loadManifestProviderEndpointCache()) {
		if (endpoint.hosts.includes(params.host)) return buildManifestEndpointResolution(endpoint, params.host);
		if (endpoint.hostSuffixes.some((suffix) => hostMatchesSuffix(params.host, suffix))) return buildManifestEndpointResolution(endpoint, params.host);
		if (params.normalizedBaseUrl && endpoint.normalizedBaseUrls.includes(params.normalizedBaseUrl)) return buildManifestEndpointResolution(endpoint, params.host);
	}
}
function isLocalEndpointHost(host) {
	return LOCAL_ENDPOINT_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal");
}
function resolveProviderEndpoint(baseUrl) {
	if (typeof baseUrl !== "string" || !baseUrl.trim()) return { endpointClass: "default" };
	const host = resolveUrlHostname(baseUrl);
	if (!host) return { endpointClass: "invalid" };
	const manifestEndpoint = resolveManifestProviderEndpoint({
		host,
		normalizedBaseUrl: normalizeComparableBaseUrl(baseUrl)
	});
	if (manifestEndpoint) return manifestEndpoint;
	if (isLocalEndpointHost(host)) return {
		endpointClass: "local",
		hostname: host
	};
	return {
		endpointClass: "custom",
		hostname: host
	};
}
function resolveKnownProviderFamily(provider) {
	const manifestFamily = resolveManifestProviderRequest(provider)?.family;
	if (manifestFamily) return manifestFamily;
	switch (provider) {
		case "openai":
		case "azure-openai":
		case "azure-openai-responses": return "openai-family";
		default: return provider || "unknown";
	}
}
function isOpenAIResponsesApi(api) {
	const normalizedApi = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(api);
	return normalizedApi !== void 0 && OPENAI_RESPONSES_APIS.has(normalizedApi);
}
function isCanonicalOrLegacyOpenAIProvider(provider) {
	return provider === "openai";
}
function resolveProviderAttributionIdentity(env = process.env) {
	return {
		product: OPERATOR_ATTRIBUTION_PRODUCT,
		version: require_version.resolveRuntimeServiceVersion(env)
	};
}
function buildOpenRouterAttributionPolicy(env = process.env) {
	const identity = resolveProviderAttributionIdentity(env);
	return {
		provider: "openrouter",
		enabledByDefault: true,
		verification: "vendor-documented",
		hook: "request-headers",
		docsUrl: "https://openrouter.ai/docs/app-attribution",
		reviewNote: "Documented app attribution headers. Verified in Operator runtime wrapper.",
		...identity,
		headers: {
			"HTTP-Referer": "https://operator.ai",
			"X-OpenRouter-Title": identity.product,
			"X-OpenRouter-Categories": OPENROUTER_ATTRIBUTION_CATEGORIES
		}
	};
}
function buildNvidiaAttributionPolicy(env = process.env) {
	return {
		provider: "nvidia",
		enabledByDefault: true,
		verification: "vendor-documented",
		hook: "request-headers",
		reviewNote: "NVIDIA NIM billing invoke-origin attribution header. Applied only on verified NVIDIA routes.",
		...resolveProviderAttributionIdentity(env),
		headers: { "X-BILLING-INVOKE-ORIGIN": OPERATOR_ATTRIBUTION_PRODUCT }
	};
}
function buildGoogleAttributionPolicy(env = process.env) {
	const identity = resolveProviderAttributionIdentity(env);
	return {
		provider: "google",
		enabledByDefault: true,
		verification: "vendor-documented",
		hook: "request-headers",
		docsUrl: "https://ai.google.dev/gemini-api/docs/partner-integration",
		reviewNote: "Gemini API partner integration guidance requires x-goog-api-client on partner and library traffic.",
		...identity,
		headers: { "x-goog-api-client": `${OPERATOR_ATTRIBUTION_ORIGINATOR}/${identity.version}` }
	};
}
function buildOpenAIAttributionPolicy(env = process.env) {
	const identity = resolveProviderAttributionIdentity(env);
	return {
		provider: "openai",
		enabledByDefault: true,
		verification: "vendor-hidden-api-spec",
		hook: "request-headers",
		reviewNote: "OpenAI native traffic supports hidden originator/User-Agent attribution. Verified against the Codex wire contract.",
		...identity,
		headers: {
			originator: OPERATOR_ATTRIBUTION_ORIGINATOR,
			version: identity.version,
			"User-Agent": formatOperatorUserAgent(identity.version)
		}
	};
}
function buildXaiAttributionPolicy(env = process.env) {
	const identity = resolveProviderAttributionIdentity(env);
	return {
		provider: "xai",
		enabledByDefault: true,
		verification: "vendor-hidden-api-spec",
		hook: "request-headers",
		reviewNote: "xAI api.x.ai accepts a standard openclaw User-Agent. Companion originator/version headers mirror the OpenAI attribution shape for consistency; they are not validated against an xAI-specific spec and are expected to be ignored by xAI's OpenAI-compatible surface.",
		...identity,
		headers: {
			originator: OPERATOR_ATTRIBUTION_ORIGINATOR,
			version: identity.version,
			"User-Agent": formatOperatorUserAgent(identity.version)
		}
	};
}
function buildSdkHookOnlyPolicy(provider, hook, reviewNote, env = process.env) {
	return {
		provider,
		enabledByDefault: false,
		verification: "vendor-sdk-hook-only",
		hook,
		reviewNote,
		...resolveProviderAttributionIdentity(env)
	};
}
function listProviderAttributionPolicies(env = process.env) {
	return [
		buildOpenRouterAttributionPolicy(env),
		buildNvidiaAttributionPolicy(env),
		buildGoogleAttributionPolicy(env),
		buildOpenAIAttributionPolicy(env),
		buildXaiAttributionPolicy(env),
		buildSdkHookOnlyPolicy("anthropic", "default-headers", "Anthropic JS SDK exposes defaultHeaders, but app attribution is not yet verified.", env),
		buildSdkHookOnlyPolicy("groq", "default-headers", "Groq JS SDK exposes defaultHeaders, but app attribution is not yet verified.", env),
		buildSdkHookOnlyPolicy("mistral", "custom-user-agent", "Mistral JS SDK exposes a custom userAgent option, but app attribution is not yet verified.", env),
		buildSdkHookOnlyPolicy("together", "default-headers", "Together JS SDK exposes defaultHeaders, but app attribution is not yet verified.", env)
	];
}
function resolveProviderAttributionPolicy(provider, env = process.env) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider ?? "");
	const canonical = normalized === "openai" ? "openai" : normalized;
	return listProviderAttributionPolicies(env).find((policy) => policy.provider === canonical);
}
function resolveProviderRequestPolicy(input, env = process.env) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(input.provider ?? "");
	const policy = resolveProviderAttributionPolicy(provider, env);
	const endpointClass = resolveProviderEndpoint(input.baseUrl).endpointClass;
	const usesConfiguredBaseUrl = endpointClass !== "default";
	const usesKnownNativeOpenAIEndpoint = endpointClass === "openai-public" || endpointClass === "openai" || endpointClass === "azure-openai";
	const usesVerifiedOpenAIAttributionHost = endpointClass === "openai-public" || endpointClass === "openai";
	const usesXaiNativeAttributionHost = endpointClass === "xai-native";
	const usesExplicitProxyLikeEndpoint = usesConfiguredBaseUrl && !usesKnownNativeOpenAIEndpoint;
	let attributionProvider;
	if (isCanonicalOrLegacyOpenAIProvider(provider) && usesVerifiedOpenAIAttributionHost) attributionProvider = "openai";
	else if (provider === "openrouter" && policy?.enabledByDefault) {
		if (endpointClass === "openrouter" || endpointClass === "default") attributionProvider = "openrouter";
	} else if (provider === "xai" && policy?.enabledByDefault) {
		if (usesXaiNativeAttributionHost || endpointClass === "default") attributionProvider = "xai";
	}
	if (!attributionProvider && endpointClass === "nvidia-native") attributionProvider = "nvidia";
	if (!attributionProvider && endpointClass === "google-generative-ai") attributionProvider = "google";
	const attributionPolicy = attributionProvider ? resolveProviderAttributionPolicy(attributionProvider, env) : void 0;
	const attributionHeaders = attributionPolicy?.enabledByDefault ? attributionPolicy.headers : void 0;
	return {
		provider: provider || void 0,
		policy: attributionPolicy ?? policy,
		endpointClass,
		usesConfiguredBaseUrl,
		knownProviderFamily: resolveKnownProviderFamily(provider || void 0),
		attributionProvider,
		attributionHeaders,
		allowsHiddenAttribution: attributionProvider !== void 0 && attributionPolicy?.verification === "vendor-hidden-api-spec",
		usesKnownNativeOpenAIEndpoint,
		usesKnownNativeOpenAIRoute: endpointClass === "default" ? isCanonicalOrLegacyOpenAIProvider(provider) : usesKnownNativeOpenAIEndpoint,
		usesVerifiedOpenAIAttributionHost,
		usesExplicitProxyLikeEndpoint
	};
}
function resolveProviderRequestCapabilities(input, env = process.env) {
	const policy = resolveProviderRequestPolicy(input, env);
	const provider = policy.provider;
	const api = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(input.api);
	const endpointClass = policy.endpointClass;
	const isKnownNativeEndpoint = endpointClass === "anthropic-public" || endpointClass === "cerebras-native" || endpointClass === "chutes-native" || endpointClass === "deepseek-native" || endpointClass === "github-copilot-native" || endpointClass === "groq-native" || endpointClass === "meta-native" || endpointClass === "mistral-public" || endpointClass === "moonshot-native" || endpointClass === "modelstudio-native" || endpointClass === "nvidia-native" || endpointClass === "openai-public" || endpointClass === "openai" || endpointClass === "opencode-native" || endpointClass === "azure-openai" || endpointClass === "openrouter" || endpointClass === "xai-native" || endpointClass === "xiaomi-native" || endpointClass === "zai-native" || endpointClass === "google-generative-ai" || endpointClass === "google-vertex";
	const manifestProviderRequest = resolveManifestProviderRequest(provider);
	const compatibilityFamily = manifestProviderRequest?.compatibilityFamily;
	const isResponsesApi = isOpenAIResponsesApi(api);
	const promptCacheKeySupport = readCompatBoolean(input.compat, "supportsPromptCacheKey");
	const shouldStripResponsesPromptCache = promptCacheKeySupport === true ? false : promptCacheKeySupport === false ? isResponsesApi : isResponsesApi && policy.usesExplicitProxyLikeEndpoint;
	return {
		...policy,
		isKnownNativeEndpoint,
		allowsOpenAIServiceTier: isCanonicalOrLegacyOpenAIProvider(provider) && api === "openai-responses" && endpointClass === "openai-public" || isCanonicalOrLegacyOpenAIProvider(provider) && (api === "openai-chatgpt-responses" || api === "openai-responses") && endpointClass === "openai",
		supportsOpenAIReasoningCompatPayload: provider !== void 0 && api !== void 0 && !policy.usesExplicitProxyLikeEndpoint && (isCanonicalOrLegacyOpenAIProvider(provider) || provider === "azure-openai" || provider === "azure-openai-responses") && (api === "openai-completions" || api === "openai-responses" || api === "openai-chatgpt-responses" || api === "azure-openai-responses"),
		allowsAnthropicServiceTier: provider === "anthropic" && api === "anthropic-messages" && (endpointClass === "default" || endpointClass === "anthropic-public"),
		supportsResponsesStoreField: readCompatBoolean(input.compat, "supportsStore") !== false && isResponsesApi,
		allowsResponsesStore: readCompatBoolean(input.compat, "supportsStore") !== false && provider !== void 0 && isResponsesApi && OPENAI_RESPONSES_PROVIDERS.has(provider) && policy.usesKnownNativeOpenAIEndpoint,
		shouldStripResponsesPromptCache,
		supportsNativeStreamingUsageCompat: endpointClass === "moonshot-native" || endpointClass === "modelstudio-native",
		supportsOpenAICompletionsStreamingUsageCompat: manifestProviderRequest?.supportsOpenAICompletionsStreamingUsageCompat === true,
		compatibilityFamily
	};
}
function describeProviderRequestRoutingPolicy(policy) {
	if (!policy.attributionProvider) return "none";
	switch (policy.policy?.verification) {
		case "vendor-hidden-api-spec": return "hidden";
		case "vendor-documented": return "documented";
		case "vendor-sdk-hook-only": return "sdk-hook-only";
		default: return "none";
	}
}
function describeProviderRequestRouteClass(policy) {
	if (policy.endpointClass === "default") return "default";
	if (policy.endpointClass === "invalid") return "invalid";
	if (policy.endpointClass === "local") return "local";
	if (policy.endpointClass === "custom" || policy.endpointClass === "openrouter") return "proxy-like";
	return "native";
}
function describeProviderRequestRoutingSummary(input, env = process.env) {
	const policy = resolveProviderRequestPolicy(input, env);
	const api = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(input.api) ?? "unknown";
	const provider = policy.provider ?? "unknown";
	const routeClass = describeProviderRequestRouteClass(policy);
	const routingPolicy = describeProviderRequestRoutingPolicy(policy);
	return [
		`provider=${provider}`,
		`api=${api}`,
		`endpoint=${policy.endpointClass}`,
		`route=${routeClass}`,
		`policy=${routingPolicy}`
	].join(" ");
}
//#endregion
Object.defineProperty(exports, "describeProviderRequestRoutingSummary", {
	enumerable: true,
	get: function() {
		return describeProviderRequestRoutingSummary;
	}
});
Object.defineProperty(exports, "listOperatorPluginManifestMetadata", {
	enumerable: true,
	get: function() {
		return listOperatorPluginManifestMetadata;
	}
});
Object.defineProperty(exports, "resolveProviderEndpoint", {
	enumerable: true,
	get: function() {
		return resolveProviderEndpoint;
	}
});
Object.defineProperty(exports, "resolveProviderRequestCapabilities", {
	enumerable: true,
	get: function() {
		return resolveProviderRequestCapabilities;
	}
});
Object.defineProperty(exports, "resolveProviderRequestPolicy", {
	enumerable: true,
	get: function() {
		return resolveProviderRequestPolicy;
	}
});
