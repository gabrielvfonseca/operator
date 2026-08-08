require("./utils-CXqBhRFw.cjs");
const require_legacy_names = require("./legacy-names-CjJxLNks.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
const require_http_body = require("./http-body-BwUnoq2M.cjs");
const require_official_external_plugin_bundled_catalogs = require("./official-external-plugin-bundled-catalogs-D4053ETf.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/plugins/official-external-plugin-catalog.ts
/** Reads official external plugin/channel/provider catalogs into manifest-like metadata. */
var HostedCatalogSnapshotWriteError = class extends Error {
	constructor(originalError) {
		super("hosted catalog snapshot write failed");
		this.name = "HostedCatalogSnapshotWriteError";
		this.originalError = originalError;
	}
};
const SUPPORTED_OFFICIAL_EXTERNAL_CATALOG_FEED_SCHEMA_VERSIONS = /* @__PURE__ */ new Set([1, 2]);
const DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_URL = "https://clawhub.ai/v1/feeds/plugins";
const DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_PROFILE = "clawhub-public";
const DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_CLAWHUB_SOURCE_REF = "public-clawhub";
const DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_NPM_SOURCE_REF = "public-npm";
const DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_PROFILE_CONFIG = {
	feeds: { [DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_PROFILE]: { url: DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_URL } },
	sources: {
		[DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_CLAWHUB_SOURCE_REF]: {
			type: "clawhub",
			baseUrl: "https://clawhub.ai"
		},
		[DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_NPM_SOURCE_REF]: {
			type: "npm",
			registry: "https://registry.npmjs.org/"
		}
	}
};
const DEFAULT_HOSTED_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_TIMEOUT_MS = 5e3;
const DEFAULT_HOSTED_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_MAX_BYTES = 1024 * 1024;
const DEFAULT_HOSTED_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_CHUNK_TIMEOUT_MS = 5e3;
const OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_HOSTNAME_ALLOWLIST = ["clawhub.ai"];
function isOfficialExternalPluginCatalogFeed(raw) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return false;
	const sequence = raw.sequence;
	const entries = raw.entries;
	return typeof raw.schemaVersion === "number" && SUPPORTED_OFFICIAL_EXTERNAL_CATALOG_FEED_SCHEMA_VERSIONS.has(raw.schemaVersion) && typeof raw.id === "string" && raw.id.trim().length > 0 && typeof raw.generatedAt === "string" && raw.generatedAt.trim().length > 0 && typeof sequence === "number" && Number.isInteger(sequence) && sequence >= 0 && Array.isArray(entries);
}
function parseOfficialExternalPluginCatalogEntries(raw) {
	if (Array.isArray(raw)) return raw.filter((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry));
	if (isOfficialExternalPluginCatalogFeed(raw)) return raw.entries.filter((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return [];
	if ("schemaVersion" in raw) return [];
	const list = raw.entries ?? raw.packages ?? raw.plugins;
	if (!Array.isArray(list)) return [];
	return list.filter((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry));
}
function normalizeHostedCatalogHeader(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) || void 0;
}
function sha256Hex(value) {
	return `sha256:${(0, node_crypto.createHash)("sha256").update(value).digest("hex")}`;
}
function resolveHostedCatalogFeedUrl(raw) {
	let parsed;
	try {
		parsed = new URL(raw.trim());
	} catch {
		throw new Error("hosted catalog feed URL is invalid");
	}
	if (parsed.protocol !== "https:") throw new Error("hosted catalog feed URL must use HTTPS");
	if (parsed.username || parsed.password) throw new Error("hosted catalog feed URL must not include credentials");
	if (parsed.search || parsed.hash) throw new Error("hosted catalog feed URL must not include query strings or fragments");
	return parsed;
}
function resolveOfficialExternalPluginCatalogProfileConfig(config) {
	return {
		feeds: {
			...DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_PROFILE_CONFIG.feeds,
			...config?.feeds
		},
		sources: {
			...DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_PROFILE_CONFIG.sources,
			...config?.sources
		}
	};
}
function resolveHostedCatalogFeedSource(params) {
	const profileConfig = resolveOfficialExternalPluginCatalogProfileConfig(params.catalogConfig);
	const explicitFeedUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.feedUrl);
	const explicitProfileName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.feedProfile);
	if (explicitFeedUrl) {
		const url = resolveHostedCatalogFeedUrl(explicitFeedUrl);
		if (!OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_HOSTNAME_ALLOWLIST.includes(url.hostname)) throw new Error("hosted catalog feed URL hostname is not allowed");
		const profile = explicitProfileName === void 0 ? void 0 : profileConfig.feeds[explicitProfileName];
		if (explicitProfileName !== void 0 && !profile) throw new Error(`hosted catalog feed profile "${explicitProfileName}" is not configured`);
		return {
			url,
			hostnameAllowlist: OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_HOSTNAME_ALLOWLIST,
			...profile?.verification ? { verification: profile.verification } : {}
		};
	}
	const profileName = explicitProfileName ?? DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_PROFILE;
	const profile = profileConfig.feeds[profileName];
	if (!profile) throw new Error(`hosted catalog feed profile "${profileName}" is not configured`);
	const url = resolveHostedCatalogFeedUrl(profile.url);
	return {
		url,
		hostnameAllowlist: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_HOSTNAME_ALLOWLIST, url.hostname]),
		verification: profile.verification
	};
}
function getOfficialExternalPluginCatalogSourceRefs(config) {
	return new Set(Object.keys(resolveOfficialExternalPluginCatalogProfileConfig(config).sources));
}
function getFeedEntryInstallCandidateRecords(entry) {
	const candidates = ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.install) ? entry.install : void 0)?.candidates;
	if (!Array.isArray(candidates)) return [];
	return candidates.filter((candidate) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(candidate));
}
function getFeedEntryInstallCandidates(entry) {
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.state) !== "available") return [];
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.publisher?.trust) !== "official") return [];
	return getFeedEntryInstallCandidateRecords(entry);
}
function shouldRequireManifestInstallSourceRef(params) {
	const feedUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.feedUrl);
	if (feedUrl) try {
		return resolveHostedCatalogFeedUrl(feedUrl).href !== resolveHostedCatalogFeedUrl(DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_URL).href;
	} catch {
		return true;
	}
	const profileName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.feedProfile) ?? DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_PROFILE;
	if (profileName !== DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_PROFILE) return true;
	const profileUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolveOfficialExternalPluginCatalogProfileConfig(params.catalogConfig).feeds[profileName]?.url);
	try {
		return resolveHostedCatalogFeedUrl(profileUrl ?? DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_URL).href !== resolveHostedCatalogFeedUrl(DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_FEED_URL).href;
	} catch {
		return true;
	}
}
function getManifestInstallSourceRefCandidate(entry) {
	const install = getOfficialExternalPluginCatalogManifest(entry)?.install;
	if (!install) return;
	if (!Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install.clawhubSpec) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install.npmSpec) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install.localPath))) return;
	return {
		sourceRef: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install.sourceRef),
		package: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install.npmSpec) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install.clawhubSpec)
	};
}
function validateOfficialExternalPluginCatalogEntrySourceRefs(entry, params) {
	const configuredSourceRefs = getOfficialExternalPluginCatalogSourceRefs(params?.catalogConfig);
	const errors = [];
	let candidates = getFeedEntryInstallCandidateRecords(entry);
	if (params?.requireManifestInstallSourceRef) {
		const manifestCandidate = getManifestInstallSourceRefCandidate(entry);
		if (manifestCandidate) candidates = [...candidates, manifestCandidate];
		else if (candidates.length === 0) candidates = [{}];
	}
	for (const candidate of candidates) {
		const sourceRef = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.sourceRef);
		if (!sourceRef) errors.push("feed install candidate is missing sourceRef");
		else if (!configuredSourceRefs.has(sourceRef)) errors.push(`feed install candidate references unknown sourceRef "${sourceRef}"`);
	}
	return errors;
}
function filterOfficialExternalPluginCatalogEntriesBySourceRefs(entries, params) {
	return entries.filter((entry) => validateOfficialExternalPluginCatalogEntrySourceRefs(entry, params).length === 0);
}
function parseHostedCatalogContentLength(raw, maxBytes) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw);
	if (!normalized) return;
	if (!/^\d+$/.test(normalized)) throw new Error("hosted catalog feed has invalid content-length");
	const size = Number(normalized);
	if (!Number.isSafeInteger(size) || size > maxBytes) throw new Error(`hosted catalog feed exceeds ${maxBytes} bytes`);
}
async function readHostedCatalogResponseText(params) {
	parseHostedCatalogContentLength(params.response.headers.get("content-length"), params.maxBytes);
	if (!params.response.body || typeof params.response.body.getReader !== "function") throw new Error("hosted catalog feed streaming response body unavailable");
	const buffer = await require_http_body.readResponseWithLimit(params.response, params.maxBytes, {
		chunkTimeoutMs: params.chunkTimeoutMs,
		onOverflow: ({ maxBytes }) => /* @__PURE__ */ new Error(`hosted catalog feed exceeds ${maxBytes} bytes`),
		onIdleTimeout: ({ chunkTimeoutMs }) => /* @__PURE__ */ new Error(`hosted catalog feed read timed out after ${chunkTimeoutMs}ms`)
	});
	return new TextDecoder().decode(buffer);
}
function bundledOfficialExternalPluginCatalogEntries() {
	return require_official_external_plugin_bundled_catalogs.BUNDLED_OFFICIAL_EXTERNAL_PLUGIN_CATALOGS.flatMap((source) => filterOfficialExternalPluginCatalogEntriesBySourceRefs(parseOfficialExternalPluginCatalogEntries(source)));
}
function dedupeOfficialExternalPluginCatalogEntries(entries) {
	const resolved = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		const key = resolveOfficialExternalPluginCatalogEntryKey(entry);
		if (key && !resolved.has(key)) resolved.set(key, entry);
	}
	return [...resolved.values()];
}
function resolveOfficialExternalPluginCatalogEntryKey(entry) {
	const pluginId = resolveOfficialExternalPluginId(entry);
	if (pluginId) return `${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.kind) ?? "plugin"}:${pluginId}`;
	const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.name);
	if (name) return name;
	const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.id);
	if (id) return `${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.kind) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.type) ?? "plugin"}:${id}`;
}
function formatHostedCatalogError(error) {
	return error instanceof Error ? error.message : String(error);
}
function bundledFallbackResult(error, metadata) {
	return {
		source: "bundled-fallback",
		entries: listOfficialExternalPluginCatalogEntries(),
		error: formatHostedCatalogError(error),
		...metadata ? { metadata } : {}
	};
}
function emptyBundledFallbackResult(error) {
	return {
		source: "bundled-fallback",
		entries: [],
		error: formatHostedCatalogError(error)
	};
}
async function parseHostedCatalogFeedBody(params) {
	const raw = JSON.parse(params.body);
	if (params.verification?.mode === "signed") {
		const { verifyOfficialExternalPluginCatalogSignedEnvelope } = await Promise.resolve().then(() => require("./official-external-plugin-catalog-envelope-kq6ZMaFS.cjs"));
		const threshold = params.verification.threshold ?? 1;
		const verification = verifyOfficialExternalPluginCatalogSignedEnvelope(raw, {
			trustedKeys: params.verification.keys,
			threshold
		});
		if (!verification.ok) throw new Error(verification.message);
		return {
			feed: verification.feed,
			trust: {
				mode: "signed",
				signedBy: verification.signedBy,
				signatureCount: verification.signatureCount ?? 1,
				threshold,
				verifiedAt: params.verifiedAt
			}
		};
	}
	if (!isOfficialExternalPluginCatalogFeed(raw)) throw new Error("hosted catalog feed did not match a supported schema version");
	return { feed: raw };
}
async function loadHostedCatalogSnapshotResult(params) {
	assertSnapshotMatchesRequestValidators({
		snapshot: params.snapshot,
		ifNoneMatch: params.ifNoneMatch,
		ifModifiedSince: params.ifModifiedSince
	});
	const checksum = sha256Hex(params.snapshot.body);
	if (checksum !== params.snapshot.metadata.checksum) throw new Error("hosted catalog snapshot checksum mismatch");
	if (params.expectedSha256 && params.expectedSha256 !== checksum) throw new Error("hosted catalog snapshot checksum did not match expected checksum");
	const parsed = await parseHostedCatalogFeedBody({
		body: params.snapshot.body,
		verification: params.verification,
		verifiedAt: params.snapshot.trust?.verifiedAt ?? params.snapshot.savedAt
	});
	return {
		source: "hosted-snapshot",
		entries: dedupeOfficialExternalPluginCatalogEntries(filterOfficialExternalPluginCatalogEntriesBySourceRefs(parseOfficialExternalPluginCatalogEntries(parsed.feed), {
			catalogConfig: params.catalogConfig,
			requireManifestInstallSourceRef: params.requireManifestInstallSourceRef
		})),
		feed: parsed.feed,
		metadata: params.snapshot.metadata,
		snapshot: params.snapshot,
		...parsed.trust ? { trust: parsed.trust } : {},
		error: formatHostedCatalogError(params.error)
	};
}
function isHostedCatalogSignedFeedRollback(params) {
	if (params.candidate.sequence < params.current.sequence) return true;
	if (params.candidate.sequence > params.current.sequence) return false;
	return Date.parse(params.candidate.generatedAt) < Date.parse(params.current.generatedAt);
}
function assertSnapshotMatchesRequestValidators(params) {
	if (params.ifNoneMatch && params.snapshot.metadata.etag !== params.ifNoneMatch) throw new Error("hosted catalog snapshot ETag did not match request validator");
	if (!params.ifNoneMatch && params.ifModifiedSince && params.snapshot.metadata.lastModified !== params.ifModifiedSince) throw new Error("hosted catalog snapshot Last-Modified did not match request validator");
}
async function snapshotOrBundledFallbackResult(params) {
	if (params.snapshotStore) try {
		const snapshot = await params.snapshotStore.read(params.url);
		if (snapshot) return await loadHostedCatalogSnapshotResult({
			snapshot,
			error: params.error,
			expectedSha256: params.expectedSha256,
			ifNoneMatch: params.ifNoneMatch,
			ifModifiedSince: params.ifModifiedSince,
			catalogConfig: params.catalogConfig,
			requireManifestInstallSourceRef: params.requireManifestInstallSourceRef,
			verification: params.verification
		});
	} catch (snapshotErr) {
		if (params.verification?.mode === "signed") return emptyBundledFallbackResult(`${formatHostedCatalogError(params.error)}; snapshot fallback failed: ${formatHostedCatalogError(snapshotErr)}`);
		return bundledFallbackResult(`${formatHostedCatalogError(params.error)}; snapshot fallback failed: ${formatHostedCatalogError(snapshotErr)}`, params.metadata);
	}
	if (params.verification?.mode === "signed") return emptyBundledFallbackResult(params.error);
	return bundledFallbackResult(params.error, params.metadata);
}
async function resolveHostedCatalogSnapshotStore(params) {
	if (params.snapshotStore !== void 0) return params.snapshotStore ?? void 0;
	const { createSqliteHostedOfficialExternalPluginCatalogSnapshotStore } = await Promise.resolve().then(() => require("./official-external-plugin-catalog-snapshot-store-BgKxfh-q.cjs"));
	return createSqliteHostedOfficialExternalPluginCatalogSnapshotStore({
		...params.env ? { env: params.env } : {},
		...params.stateDir ? { stateDir: params.stateDir } : {},
		...params.stateDatabasePath ? { stateDatabasePath: params.stateDatabasePath } : {}
	});
}
async function loadHostedOfficialExternalPluginCatalogEntries(params) {
	let source;
	try {
		source = resolveHostedCatalogFeedSource({
			feedUrl: params?.feedUrl,
			feedProfile: params?.feedProfile,
			catalogConfig: params?.catalogConfig
		});
	} catch (err) {
		return bundledFallbackResult(err);
	}
	const { url } = source;
	const snapshotStore = await resolveHostedCatalogSnapshotStore({
		snapshotStore: params?.snapshotStore,
		env: params?.env,
		stateDir: params?.stateDir,
		stateDatabasePath: params?.stateDatabasePath
	});
	const expectedSha256 = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params?.expectedSha256);
	const requireManifestInstallSourceRef = shouldRequireManifestInstallSourceRef({
		feedUrl: params?.feedUrl,
		feedProfile: params?.feedProfile,
		catalogConfig: params?.catalogConfig
	});
	if (params?.offline === true) return await snapshotOrBundledFallbackResult({
		error: "hosted catalog feed offline mode",
		snapshotStore,
		url: url.href,
		expectedSha256,
		catalogConfig: params?.catalogConfig,
		requireManifestInstallSourceRef,
		verification: source.verification
	});
	const headers = new Headers();
	const ifNoneMatch = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params?.ifNoneMatch);
	const ifModifiedSince = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params?.ifModifiedSince);
	if (ifNoneMatch) headers.set("if-none-match", ifNoneMatch);
	if (ifModifiedSince) headers.set("if-modified-since", ifModifiedSince);
	const metadataBase = (response) => {
		const etag = normalizeHostedCatalogHeader(response.headers.get("etag"));
		const lastModified = normalizeHostedCatalogHeader(response.headers.get("last-modified"));
		return {
			url: url.href,
			status: response.status,
			...etag ? { etag } : {},
			...lastModified ? { lastModified } : {}
		};
	};
	let response;
	let release;
	try {
		const { fetchWithSsrFGuard } = await Promise.resolve().then(() => require("./fetch-guard-D5DTj23w.cjs")).then((n) => n.fetch_guard_exports);
		const guarded = await fetchWithSsrFGuard({
			url: url.href,
			fetchImpl: params?.fetchImpl,
			init: {
				method: "GET",
				headers
			},
			requireHttps: true,
			maxRedirects: 2,
			timeoutMs: params?.timeoutMs ?? DEFAULT_HOSTED_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_TIMEOUT_MS,
			policy: { hostnameAllowlist: source.hostnameAllowlist },
			auditContext: "official-external-plugin-catalog-feed"
		});
		response = guarded.response;
		release = guarded.release;
		const base = metadataBase(response);
		if (response.status === 304) return await snapshotOrBundledFallbackResult({
			error: "hosted catalog feed returned HTTP 304",
			snapshotStore,
			url: url.href,
			metadata: base,
			expectedSha256,
			ifNoneMatch,
			ifModifiedSince,
			catalogConfig: params?.catalogConfig,
			requireManifestInstallSourceRef,
			verification: source.verification
		});
		if (!response.ok) return await snapshotOrBundledFallbackResult({
			error: `hosted catalog feed returned HTTP ${response.status}`,
			snapshotStore,
			url: url.href,
			metadata: base,
			expectedSha256,
			ifNoneMatch,
			ifModifiedSince,
			catalogConfig: params?.catalogConfig,
			requireManifestInstallSourceRef,
			verification: source.verification
		});
		const body = await readHostedCatalogResponseText({
			response,
			maxBytes: params?.maxBytes ?? DEFAULT_HOSTED_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_MAX_BYTES,
			chunkTimeoutMs: params?.chunkTimeoutMs ?? DEFAULT_HOSTED_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_CHUNK_TIMEOUT_MS
		});
		const checksum = sha256Hex(body);
		const metadata = {
			...base,
			checksum
		};
		if (expectedSha256 && expectedSha256 !== checksum) return await snapshotOrBundledFallbackResult({
			error: `hosted catalog feed checksum mismatch: expected ${expectedSha256}`,
			snapshotStore,
			url: url.href,
			metadata,
			expectedSha256,
			ifNoneMatch,
			ifModifiedSince,
			catalogConfig: params?.catalogConfig,
			requireManifestInstallSourceRef,
			verification: source.verification
		});
		const verifiedAt = (params?.now?.() ?? /* @__PURE__ */ new Date()).toISOString();
		const parsed = await parseHostedCatalogFeedBody({
			body,
			verification: source.verification,
			verifiedAt
		}).catch(async (err) => {
			return await snapshotOrBundledFallbackResult({
				error: err,
				snapshotStore,
				url: url.href,
				metadata,
				expectedSha256,
				ifNoneMatch,
				ifModifiedSince,
				catalogConfig: params?.catalogConfig,
				requireManifestInstallSourceRef,
				verification: source.verification
			});
		});
		if ("source" in parsed) return parsed;
		if (snapshotStore && parsed.trust?.mode === "signed") {
			const currentSnapshot = await snapshotStore.read(url.href);
			if (currentSnapshot?.trust?.mode === "signed") {
				const current = await parseHostedCatalogFeedBody({
					body: currentSnapshot.body,
					verification: source.verification,
					verifiedAt: currentSnapshot.trust.verifiedAt
				});
				if (isHostedCatalogSignedFeedRollback({
					candidate: parsed.feed,
					current: current.feed
				})) throw new Error("hosted catalog signed feed sequence is older than current snapshot");
			}
		}
		const entries = filterOfficialExternalPluginCatalogEntriesBySourceRefs(parseOfficialExternalPluginCatalogEntries(parsed.feed), {
			catalogConfig: params?.catalogConfig,
			requireManifestInstallSourceRef
		});
		await snapshotStore?.write({
			body,
			metadata,
			savedAt: verifiedAt,
			...parsed.trust ? { trust: parsed.trust } : {},
			...parsed.trust?.mode === "signed" ? { monotonic: {
				mode: "signed-feed",
				sequence: parsed.feed.sequence,
				generatedAt: parsed.feed.generatedAt
			} } : {}
		}).catch((err) => {
			if (err instanceof Error && err.message.includes("hosted catalog signed feed sequence is older")) throw err;
			if (params?.requireSnapshotWrite) throw new HostedCatalogSnapshotWriteError(err);
		});
		return {
			source: "hosted",
			entries: dedupeOfficialExternalPluginCatalogEntries(entries),
			feed: parsed.feed,
			metadata,
			...parsed.trust ? { trust: parsed.trust } : {}
		};
	} catch (err) {
		if (err instanceof HostedCatalogSnapshotWriteError) throw err.originalError;
		return await snapshotOrBundledFallbackResult({
			error: err,
			snapshotStore,
			url: url.href,
			expectedSha256,
			ifNoneMatch,
			ifModifiedSince,
			catalogConfig: params?.catalogConfig,
			requireManifestInstallSourceRef,
			verification: source.verification
		});
	} finally {
		if (response?.bodyUsed !== true) await response?.body?.cancel().catch(() => void 0);
		await release?.().catch(() => void 0);
	}
}
function normalizeDefaultChoice(value) {
	return value === "clawhub" || value === "npm" || value === "local" ? value : void 0;
}
function formatFeedInstallCandidateSpec(candidate) {
	const packageName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.package);
	if (!packageName) return;
	const version = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.version);
	if (!version || packageName.endsWith(`@${version}`)) return packageName;
	return `${packageName}@${version}`;
}
function getFeedEntryCandidateSourceType(candidate, config) {
	const sourceRef = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.sourceRef);
	if (!sourceRef) return;
	return resolveOfficialExternalPluginCatalogProfileConfig(config).sources[sourceRef]?.type;
}
function getPreferredFeedEntryInstallCandidate(params) {
	const candidates = getFeedEntryInstallCandidates(params.entry).filter((candidate) => Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.package)));
	return candidates.find((candidate) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.sourceRef) === DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_CLAWHUB_SOURCE_REF) ?? candidates.find((candidate) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.sourceRef) === DEFAULT_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_NPM_SOURCE_REF) ?? candidates.find((candidate) => Boolean(getFeedEntryCandidateSourceType(candidate, params.catalogConfig)));
}
function resolveFeedEntryInstallCandidate(params) {
	const candidate = getPreferredFeedEntryInstallCandidate(params);
	if (!candidate) return null;
	const spec = formatFeedInstallCandidateSpec(candidate);
	if (!spec) return null;
	const sourceType = getFeedEntryCandidateSourceType(candidate, params.catalogConfig);
	if (sourceType === "clawhub") {
		const expectedIntegrity = normalizeClawHubSha256ExpectedIntegrity(candidate.integrity);
		return {
			clawhubSpec: `clawhub:${spec}`,
			defaultChoice: "clawhub",
			...expectedIntegrity ? { expectedIntegrity } : {}
		};
	}
	if (sourceType === "npm") {
		const expectedIntegrity = normalizeNpmExpectedIntegrity(candidate.integrity);
		return {
			npmSpec: spec,
			defaultChoice: "npm",
			...expectedIntegrity ? { expectedIntegrity } : {}
		};
	}
	return null;
}
function normalizeClawHubSha256ExpectedIntegrity(value) {
	const integrity = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	return integrity ? require_clawhub.normalizeClawHubSha256Integrity(integrity) ?? void 0 : void 0;
}
function normalizeNpmExpectedIntegrity(value) {
	const integrity = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!integrity || !/^[a-z0-9]+-[A-Za-z0-9+/=]+$/i.test(integrity)) return;
	return integrity;
}
/** Returns manifest metadata from an official external catalog entry when present. */
function getOfficialExternalPluginCatalogManifest(entry) {
	const manifest = entry[require_legacy_names.MANIFEST_KEY];
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(manifest) ? manifest : void 0;
}
function resolveOfficialExternalPluginId(entry) {
	const manifest = getOfficialExternalPluginCatalogManifest(entry);
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.plugin?.id) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.channel?.id) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.providers?.[0]?.id) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.id);
}
function resolveOfficialExternalPluginLookupIds(entry) {
	const manifest = getOfficialExternalPluginCatalogManifest(entry);
	const lookupIds = [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.plugin?.id), (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.channel?.id)];
	for (const provider of manifest?.providers ?? []) {
		lookupIds.push((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(provider.id));
		for (const alias of provider.aliases ?? []) lookupIds.push((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(alias));
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(lookupIds.filter((value) => Boolean(value)));
}
function resolveOfficialExternalPluginLabel(entry) {
	const manifest = getOfficialExternalPluginCatalogManifest(entry);
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.plugin?.label) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.channel?.label) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.providers?.[0]?.name) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.title) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.name) ?? resolveOfficialExternalPluginId(entry) ?? "plugin";
}
function resolveOfficialExternalPluginInstall(entry, params) {
	const install = getOfficialExternalPluginCatalogManifest(entry)?.install;
	const clawhubSpec = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install?.clawhubSpec);
	const manifestNpmSpec = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install?.npmSpec);
	const localPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install?.localPath);
	const candidateInstall = resolveFeedEntryInstallCandidate({
		entry,
		catalogConfig: params?.catalogConfig
	});
	if (candidateInstall) return {
		...candidateInstall,
		...install?.minHostVersion ? { minHostVersion: install.minHostVersion } : {},
		...install?.expectedIntegrity && !candidateInstall.expectedIntegrity ? { expectedIntegrity: install.expectedIntegrity } : {},
		...install?.allowInvalidConfigRecovery === true ? { allowInvalidConfigRecovery: true } : {}
	};
	const hasFeedInstallCandidates = getFeedEntryInstallCandidateRecords(entry).length > 0;
	const npmSpec = manifestNpmSpec ?? (hasFeedInstallCandidates ? void 0 : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.name));
	const defaultChoice = normalizeDefaultChoice(install?.defaultChoice) ?? (npmSpec ? "npm" : clawhubSpec ? "clawhub" : localPath ? "local" : void 0);
	if (!clawhubSpec && !npmSpec && !localPath) return null;
	return {
		...clawhubSpec ? { clawhubSpec } : {},
		...npmSpec ? { npmSpec } : {},
		...localPath ? { localPath } : {},
		...defaultChoice ? { defaultChoice } : {},
		...install?.minHostVersion ? { minHostVersion: install.minHostVersion } : {},
		...install?.expectedIntegrity ? { expectedIntegrity: install.expectedIntegrity } : {},
		...install?.allowInvalidConfigRecovery === true ? { allowInvalidConfigRecovery: true } : {}
	};
}
function resolveOfficialExternalPluginCatalogProfileConfigFromConfig(config) {
	return config?.marketplaces;
}
async function loadConfiguredHostedOfficialExternalPluginCatalogEntries(config, params) {
	return await loadHostedOfficialExternalPluginCatalogEntries({
		...params,
		catalogConfig: resolveOfficialExternalPluginCatalogProfileConfigFromConfig(config)
	});
}
function listOfficialExternalPluginCatalogEntries() {
	return dedupeOfficialExternalPluginCatalogEntries(bundledOfficialExternalPluginCatalogEntries());
}
/** Returns whether an id is the canonical id of an official external plugin. */
function isOfficialExternalPluginId(pluginId) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(pluginId)?.toLowerCase();
	if (!normalized) return false;
	return listOfficialExternalPluginCatalogEntries().some((entry) => resolveOfficialExternalPluginId(entry)?.toLowerCase() === normalized);
}
/** Resolves official external plugin owners for configured capability provider ids. */
function resolveOfficialExternalProviderContractPluginIds(params) {
	const configuredProviderIds = new Set([...params.providerIds].map((providerId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerId)?.toLowerCase()).filter((providerId) => Boolean(providerId)));
	if (configuredProviderIds.size === 0) return [];
	const pluginIds = /* @__PURE__ */ new Set();
	for (const entry of listOfficialExternalPluginCatalogEntries()) {
		const pluginId = resolveOfficialExternalPluginId(entry);
		const providerIds = getOfficialExternalPluginCatalogManifest(entry)?.contracts?.[params.contract];
		if (pluginId && providerIds?.some((providerId) => {
			const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerId)?.toLowerCase();
			return normalized ? configuredProviderIds.has(normalized) : false;
		})) pluginIds.add(pluginId);
	}
	return [...pluginIds].toSorted((left, right) => left.localeCompare(right));
}
/** Resolves official web provider owners from matching documented environment credentials. */
function resolveOfficialExternalWebProviderContractPluginIdsForEnv(params) {
	const pluginIds = /* @__PURE__ */ new Set();
	for (const entry of listOfficialExternalPluginCatalogEntries()) {
		const pluginId = resolveOfficialExternalPluginId(entry);
		const manifest = getOfficialExternalPluginCatalogManifest(entry);
		const contractProviderIds = new Set((manifest?.contracts?.[params.contract] ?? []).map((providerId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerId)?.toLowerCase()).filter((providerId) => Boolean(providerId)));
		if (pluginId && contractProviderIds.size > 0 && manifest?.webSearchProviders?.some((provider) => {
			const providerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(provider.id)?.toLowerCase();
			return providerId !== void 0 && contractProviderIds.has(providerId) && provider.envVars?.some((envVar) => Boolean(params.env[envVar]?.trim()));
		})) pluginIds.add(pluginId);
	}
	return [...pluginIds].toSorted((left, right) => left.localeCompare(right));
}
/** Resolves official external plugin owners for configured model provider ids. */
function resolveOfficialExternalProviderPluginIds(params) {
	const configuredProviderIds = new Set([...params.providerIds].map((providerId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerId)?.toLowerCase()).filter((providerId) => Boolean(providerId)));
	if (configuredProviderIds.size === 0) return [];
	const pluginIds = /* @__PURE__ */ new Set();
	for (const entry of listOfficialExternalProviderCatalogEntries()) {
		const pluginId = resolveOfficialExternalPluginId(entry);
		const providers = getOfficialExternalPluginCatalogManifest(entry)?.providers;
		if (pluginId && providers?.some((provider) => [provider.id, ...provider.aliases ?? []].some((providerId) => {
			const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerId)?.toLowerCase();
			return normalized ? configuredProviderIds.has(normalized) : false;
		}))) pluginIds.add(pluginId);
	}
	return [...pluginIds].toSorted((left, right) => left.localeCompare(right));
}
/** Resolves official external provider owners with configured environment credentials. */
function resolveOfficialExternalProviderPluginIdsForEnv(env) {
	const pluginIds = /* @__PURE__ */ new Set();
	for (const entry of listOfficialExternalProviderCatalogEntries()) {
		const pluginId = resolveOfficialExternalPluginId(entry);
		const providers = getOfficialExternalPluginCatalogManifest(entry)?.providers;
		if (pluginId && providers?.some((provider) => provider.envVars?.some((envVar) => Boolean(env[envVar]?.trim())))) pluginIds.add(pluginId);
	}
	return [...pluginIds].toSorted((left, right) => left.localeCompare(right));
}
function listOfficialExternalChannelCatalogEntries() {
	return listOfficialExternalPluginCatalogEntries().filter((entry) => Boolean(getOfficialExternalPluginCatalogManifest(entry)?.channel));
}
function listOfficialExternalChannelEnvVars() {
	return listOfficialExternalChannelCatalogEntries().flatMap((entry) => {
		const channel = getOfficialExternalPluginCatalogManifest(entry)?.channel;
		const channelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(channel?.id)?.toLowerCase();
		const envVars = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((channel?.envVars ?? []).map((envVar) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(envVar)).filter((envVar) => Boolean(envVar)));
		return channelId && envVars.length > 0 ? [{
			channelId,
			envVars
		}] : [];
	});
}
function listOfficialExternalProviderCatalogEntries() {
	return listOfficialExternalPluginCatalogEntries().filter((entry) => (getOfficialExternalPluginCatalogManifest(entry)?.providers?.length ?? 0) > 0);
}
function getOfficialExternalPluginCatalogEntry(pluginId) {
	const normalized = pluginId.trim();
	if (!normalized) return;
	return listOfficialExternalPluginCatalogEntries().find((entry) => resolveOfficialExternalPluginLookupIds(entry).includes(normalized));
}
function getOfficialExternalPluginCatalogEntryForPackage(packageName) {
	const normalized = packageName?.trim();
	if (!normalized) return;
	return listOfficialExternalPluginCatalogEntries().find((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.name) === normalized);
}
//#endregion
Object.defineProperty(exports, "getOfficialExternalPluginCatalogEntry", {
	enumerable: true,
	get: function() {
		return getOfficialExternalPluginCatalogEntry;
	}
});
Object.defineProperty(exports, "getOfficialExternalPluginCatalogEntryForPackage", {
	enumerable: true,
	get: function() {
		return getOfficialExternalPluginCatalogEntryForPackage;
	}
});
Object.defineProperty(exports, "getOfficialExternalPluginCatalogManifest", {
	enumerable: true,
	get: function() {
		return getOfficialExternalPluginCatalogManifest;
	}
});
Object.defineProperty(exports, "isOfficialExternalPluginCatalogFeed", {
	enumerable: true,
	get: function() {
		return isOfficialExternalPluginCatalogFeed;
	}
});
Object.defineProperty(exports, "isOfficialExternalPluginId", {
	enumerable: true,
	get: function() {
		return isOfficialExternalPluginId;
	}
});
Object.defineProperty(exports, "listOfficialExternalChannelCatalogEntries", {
	enumerable: true,
	get: function() {
		return listOfficialExternalChannelCatalogEntries;
	}
});
Object.defineProperty(exports, "listOfficialExternalChannelEnvVars", {
	enumerable: true,
	get: function() {
		return listOfficialExternalChannelEnvVars;
	}
});
Object.defineProperty(exports, "listOfficialExternalPluginCatalogEntries", {
	enumerable: true,
	get: function() {
		return listOfficialExternalPluginCatalogEntries;
	}
});
Object.defineProperty(exports, "listOfficialExternalProviderCatalogEntries", {
	enumerable: true,
	get: function() {
		return listOfficialExternalProviderCatalogEntries;
	}
});
Object.defineProperty(exports, "loadConfiguredHostedOfficialExternalPluginCatalogEntries", {
	enumerable: true,
	get: function() {
		return loadConfiguredHostedOfficialExternalPluginCatalogEntries;
	}
});
Object.defineProperty(exports, "resolveOfficialExternalPluginId", {
	enumerable: true,
	get: function() {
		return resolveOfficialExternalPluginId;
	}
});
Object.defineProperty(exports, "resolveOfficialExternalPluginInstall", {
	enumerable: true,
	get: function() {
		return resolveOfficialExternalPluginInstall;
	}
});
Object.defineProperty(exports, "resolveOfficialExternalPluginLabel", {
	enumerable: true,
	get: function() {
		return resolveOfficialExternalPluginLabel;
	}
});
Object.defineProperty(exports, "resolveOfficialExternalProviderContractPluginIds", {
	enumerable: true,
	get: function() {
		return resolveOfficialExternalProviderContractPluginIds;
	}
});
Object.defineProperty(exports, "resolveOfficialExternalProviderPluginIds", {
	enumerable: true,
	get: function() {
		return resolveOfficialExternalProviderPluginIds;
	}
});
Object.defineProperty(exports, "resolveOfficialExternalProviderPluginIdsForEnv", {
	enumerable: true,
	get: function() {
		return resolveOfficialExternalProviderPluginIdsForEnv;
	}
});
Object.defineProperty(exports, "resolveOfficialExternalWebProviderContractPluginIdsForEnv", {
	enumerable: true,
	get: function() {
		return resolveOfficialExternalWebProviderContractPluginIdsForEnv;
	}
});
