const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_store = require("./store-BW6t6tIi.cjs");
require("./local-file-access-r6xSCXfB.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_net_policy_url_protocol = require("@gabrielvfonseca/net-policy/url-protocol");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/media/media-reference.ts
/** Error raised when a media reference cannot be mapped to an allowed local media file. */
var MediaReferenceError = class extends Error {
	constructor(code, message, options) {
		super(message, options);
		this.code = code;
		this.name = "MediaReferenceError";
	}
};
/** Strips legacy MEDIA: prefixes while preserving canonical media:// references. */
function normalizeMediaReferenceSource(source) {
	const trimmed = source.trim();
	if (/^media:\/\//i.test(trimmed)) return trimmed;
	return trimmed.replace(/^\s*MEDIA\s*:\s*/i, "").trim();
}
/** Classifies media reference schemes before local resolution or sandbox rewriting. */
function classifyMediaReferenceSource(source, options) {
	const allowDataUrl = options?.allowDataUrl ?? true;
	const looksLikeWindowsDrivePath = /^[a-zA-Z]:[\\/]/.test(source);
	const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(source);
	const isFileUrl = /^file:/i.test(source);
	const isHttpUrl = (0, _gabrielvfonseca_net_policy_url_protocol.hasHttpUrlPrefix)(source);
	const isDataUrl = /^data:/i.test(source);
	const isMediaStoreUrl = /^media:\/\//i.test(source);
	return {
		hasScheme,
		hasUnsupportedScheme: hasScheme && !looksLikeWindowsDrivePath && !isFileUrl && !isHttpUrl && !isMediaStoreUrl && !(allowDataUrl && isDataUrl),
		isDataUrl,
		isFileUrl,
		isHttpUrl,
		isMediaStoreUrl,
		looksLikeWindowsDrivePath
	};
}
function maybeLocalPathFromSource(source) {
	if (/^file:/i.test(source)) try {
		return (0, _openclaw_fs_safe_advanced.safeFileURLToPath)(source);
	} catch {
		return null;
	}
	if (source.startsWith("~")) return require_home_dir.resolveUserPath(source);
	if (node_path.default.isAbsolute(source)) return source;
	return null;
}
function relativePathEscapesBase(relativePath) {
	return relativePath === ".." || relativePath.startsWith("../") || relativePath.startsWith("..\\") || node_path.default.isAbsolute(relativePath);
}
async function resolvePathForContainment(candidate) {
	try {
		return await node_fs_promises.default.realpath(candidate);
	} catch {
		return node_path.default.resolve(candidate);
	}
}
/** Parses canonical inbound media-store URIs and rejects nested or cross-bucket references. */
function parseInboundMediaUri(source) {
	const normalizedSource = normalizeMediaReferenceSource(source);
	if (!/^media:\/\//i.test(normalizedSource)) return null;
	let parsed;
	try {
		parsed = new URL(normalizedSource);
	} catch (err) {
		throw new MediaReferenceError("invalid-path", `Invalid media URI: ${normalizedSource}`, { cause: err });
	}
	if (parsed.hostname !== "inbound") throw new MediaReferenceError("path-not-allowed", `Unsupported media URI location: ${parsed.hostname || "(missing)"}`);
	let id;
	try {
		id = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
	} catch (err) {
		throw new MediaReferenceError("invalid-path", `Invalid media URI: ${normalizedSource}`, { cause: err });
	}
	if (!id || id.includes("/") || id.includes("\\") || id.includes("\0")) throw new MediaReferenceError("invalid-path", `Invalid media URI: ${normalizedSource}`);
	return {
		id,
		normalizedSource
	};
}
async function resolveInboundMediaUri(normalizedSource) {
	const uri = parseInboundMediaUri(normalizedSource);
	if (!uri) return null;
	return {
		...uri,
		physicalPath: await resolveInboundMediaPath(uri.id, uri.normalizedSource),
		sourceType: "uri"
	};
}
/** Rewrites inbound media-store URIs to sandbox-relative paths for staged agent inputs. */
function resolveMediaReferenceSandboxPath(source, inboundDir = "media/inbound") {
	const normalizedSource = normalizeMediaReferenceSource(source);
	const uri = parseInboundMediaUri(normalizedSource);
	if (!uri) return { resolved: normalizedSource };
	return {
		resolved: node_path.default.posix.join(inboundDir.replace(/\\/g, "/"), uri.id),
		rewrittenFrom: uri.normalizedSource
	};
}
/** Resolves inbound media:// URIs or first-level inbound file paths to concrete store files. */
async function resolveInboundMediaReference(source) {
	const normalizedSource = normalizeMediaReferenceSource(source);
	if (!normalizedSource) return null;
	const uriSource = await resolveInboundMediaUri(normalizedSource);
	if (uriSource) return uriSource;
	const localPath = maybeLocalPathFromSource(normalizedSource);
	if (!localPath) return null;
	const rawInboundDir = node_path.default.resolve(require_store.getMediaDir(), "inbound");
	const rawResolvedPath = node_path.default.resolve(localPath);
	const rawRel = node_path.default.relative(rawInboundDir, rawResolvedPath);
	const rel = rawRel && !relativePathEscapesBase(rawRel) ? rawRel : node_path.default.relative(await resolvePathForContainment(rawInboundDir), await resolvePathForContainment(localPath));
	if (!rel || relativePathEscapesBase(rel) || rel.includes(node_path.default.sep)) return null;
	return {
		id: rel,
		normalizedSource,
		physicalPath: await resolveInboundMediaPath(rel, normalizedSource),
		sourceType: "path"
	};
}
/** Resolves a media reference while preserving whether it belongs to the inbound store. */
async function resolveMediaReferenceLocalPathInfo(source) {
	const normalizedSource = normalizeMediaReferenceSource(source);
	const inboundReference = await resolveInboundMediaReference(normalizedSource);
	return inboundReference ? {
		kind: "inbound",
		path: inboundReference.physicalPath
	} : {
		kind: "local",
		path: normalizedSource
	};
}
/** Converts inbound media references for callers that need a direct local file path. */
async function resolveMediaReferenceLocalPath(source) {
	return (await resolveMediaReferenceLocalPathInfo(source)).path;
}
async function resolveInboundMediaPath(id, source) {
	try {
		return await require_store.resolveMediaBufferPath(id, "inbound");
	} catch (err) {
		throw new MediaReferenceError("invalid-path", err instanceof Error ? err.message : `Invalid media reference: ${source}`, { cause: err });
	}
}
//#endregion
Object.defineProperty(exports, "MediaReferenceError", {
	enumerable: true,
	get: function() {
		return MediaReferenceError;
	}
});
Object.defineProperty(exports, "classifyMediaReferenceSource", {
	enumerable: true,
	get: function() {
		return classifyMediaReferenceSource;
	}
});
Object.defineProperty(exports, "normalizeMediaReferenceSource", {
	enumerable: true,
	get: function() {
		return normalizeMediaReferenceSource;
	}
});
Object.defineProperty(exports, "parseInboundMediaUri", {
	enumerable: true,
	get: function() {
		return parseInboundMediaUri;
	}
});
Object.defineProperty(exports, "resolveInboundMediaReference", {
	enumerable: true,
	get: function() {
		return resolveInboundMediaReference;
	}
});
Object.defineProperty(exports, "resolveMediaReferenceLocalPath", {
	enumerable: true,
	get: function() {
		return resolveMediaReferenceLocalPath;
	}
});
Object.defineProperty(exports, "resolveMediaReferenceLocalPathInfo", {
	enumerable: true,
	get: function() {
		return resolveMediaReferenceLocalPathInfo;
	}
});
Object.defineProperty(exports, "resolveMediaReferenceSandboxPath", {
	enumerable: true,
	get: function() {
		return resolveMediaReferenceSandboxPath;
	}
});
