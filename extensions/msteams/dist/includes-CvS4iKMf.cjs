const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_plain_object = require("./plain-object-CITRo0uW.cjs");
require("./utils-CXqBhRFw.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_parse_json_compat = require("./parse-json-compat-C77_sznm.cjs");
require("./boundary-path-r6xSCXfB.cjs");
require("./scan-paths-bPESVZQ5.cjs");
const require_deep_merge = require("./deep-merge-DKT_G9Uv.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/config/includes.ts
/**
* Config includes: $include directive for modular configs
*
* @example
* ```json5
* {
*   "$include": "./base.json5",           // single file
*   "$include": ["./a.json5", "./b.json5"] // merge multiple
* }
* ```
*/
const INCLUDE_KEY = "$include";
const MAX_INCLUDE_FILE_BYTES = 2 * 1024 * 1024;
/** Maximum length for $include path and resolved path (CWE-22 hardening). */
const MAX_INCLUDE_PATH_LENGTH = 4096;
function hashConfigIncludeRaw(raw) {
	const hash = node_crypto.default.createHash("sha256");
	if (raw === null) hash.update("missing");
	else {
		hash.update("present\0");
		hash.update(raw, "utf-8");
	}
	return hash.digest("hex");
}
/** Resolve an include write target through its current ancestors and allowed roots. */
function resolveConfigIncludeWritePath(params) {
	const resolvedPath = node_path.default.normalize(node_path.default.resolve(params.includePath));
	const roots = [node_path.default.dirname(params.configPath), ...params.allowedRoots ?? []].filter((root) => node_path.default.isAbsolute(root)).map((root) => node_path.default.normalize(root));
	if (!roots.some((root) => (0, _openclaw_fs_safe_path.isPathInside)(root, resolvedPath))) throw new ConfigIncludeError(`Include write path escapes config directory: ${params.includePath}`, params.includePath);
	const canonicalPath = node_path.default.normalize((0, _openclaw_fs_safe_advanced.resolvePathViaExistingAncestorSync)(resolvedPath));
	if (!roots.map((root) => node_path.default.normalize(safeRealpath(root))).some((root) => (0, _openclaw_fs_safe_path.isPathInside)(root, canonicalPath))) throw new ConfigIncludeError(`Include write path resolves outside config directory (symlink): ${params.includePath}`, params.includePath);
	return canonicalPath;
}
var ConfigIncludeError = class extends Error {
	constructor(message, includePath, cause) {
		super(message);
		this.includePath = includePath;
		this.cause = cause;
		this.name = "ConfigIncludeError";
	}
};
var CircularIncludeError = class extends ConfigIncludeError {
	constructor(chain) {
		super(`Circular include detected: ${chain.join(" -> ")}`, (0, _gabrielvfonseca_normalization_core.expectDefined)(chain[chain.length - 1], "chain entry at chain.length 1"));
		this.chain = chain;
		this.name = "CircularIncludeError";
	}
};
/** Deep merge: arrays concatenate, objects merge recursively, primitives: source wins */
function deepMerge(target, source) {
	return require_deep_merge.mergeDeep(target, source, {
		arrays: "concat",
		undefinedValues: "replace"
	});
}
var IncludeProcessor = class IncludeProcessor {
	constructor(basePath, resolver, boundary) {
		this.basePath = basePath;
		this.resolver = resolver;
		this.boundary = boundary;
		this.visited = /* @__PURE__ */ new Set();
		this.depth = 0;
		this.visited.add(node_path.default.normalize(basePath));
	}
	get rootDir() {
		return this.boundary.configRoot.rootDir;
	}
	process(obj) {
		if (Array.isArray(obj)) return obj.map((item) => this.process(item));
		if (!require_plain_object.isPlainObject(obj)) return obj;
		if (!("$include" in obj)) return this.processObject(obj);
		return this.processInclude(obj);
	}
	processObject(obj) {
		const result = {};
		for (const [key, value] of Object.entries(obj)) result[key] = this.process(value);
		return result;
	}
	processInclude(obj) {
		const includeValue = obj[INCLUDE_KEY];
		const otherKeys = Object.keys(obj).filter((k) => k !== INCLUDE_KEY);
		const included = this.resolveInclude(includeValue);
		if (otherKeys.length === 0) return included;
		if (!require_plain_object.isPlainObject(included)) throw new ConfigIncludeError("Sibling keys require included content to be an object", typeof includeValue === "string" ? includeValue : INCLUDE_KEY);
		const rest = {};
		for (const key of otherKeys) rest[key] = this.process(obj[key]);
		return deepMerge(included, rest);
	}
	resolveInclude(value) {
		if (typeof value === "string") return this.loadFile(value);
		if (Array.isArray(value)) return value.reduce((merged, item) => {
			if (typeof item !== "string") throw new ConfigIncludeError(`Invalid $include array item: expected string, got ${typeof item}`, String(item));
			return deepMerge(merged, this.loadFile(item));
		}, {});
		throw new ConfigIncludeError(`Invalid $include value: expected string or array of strings, got ${typeof value}`, String(value));
	}
	loadFile(includePath) {
		const { resolvedPath, root } = this.resolvePath(includePath);
		this.checkCircular(resolvedPath);
		this.checkDepth(includePath);
		const raw = this.readFile(includePath, resolvedPath, root);
		const parsed = this.parseFile(includePath, resolvedPath, raw);
		return this.processNested(resolvedPath, parsed);
	}
	resolvePath(includePath) {
		if (includePath.includes("\0")) throw new ConfigIncludeError("Include path must not contain null bytes", includePath);
		if (includePath.length >= MAX_INCLUDE_PATH_LENGTH) throw new ConfigIncludeError(`Include path exceeds maximum length (${MAX_INCLUDE_PATH_LENGTH} characters)`, includePath);
		const configDir = node_path.default.dirname(this.basePath);
		const resolved = node_path.default.isAbsolute(includePath) ? includePath : node_path.default.resolve(configDir, includePath);
		const normalized = node_path.default.normalize(resolved);
		if (normalized.length >= MAX_INCLUDE_PATH_LENGTH) throw new ConfigIncludeError(`Resolved include path exceeds maximum length (${MAX_INCLUDE_PATH_LENGTH} characters)`, includePath);
		const lexicalMatch = this.findContainingRoot(normalized, "rootDir");
		if (!lexicalMatch) throw new ConfigIncludeError(`Include path escapes config directory: ${includePath} (root: ${this.rootDir})`, includePath);
		try {
			const real = node_fs.default.realpathSync(normalized);
			const realMatch = this.findContainingRoot(real, "rootRealDir");
			if (!realMatch) throw new ConfigIncludeError(`Include path resolves outside config directory (symlink): ${includePath} (root: ${this.rootDir})`, includePath);
			return {
				resolvedPath: normalized,
				root: realMatch
			};
		} catch (err) {
			if (err instanceof ConfigIncludeError) throw err;
			if (isNotFoundError(err)) return {
				resolvedPath: normalized,
				root: lexicalMatch
			};
			throw new ConfigIncludeError(`Failed to resolve include file realpath: ${includePath} (resolved: ${normalized})`, includePath, err instanceof Error ? err : void 0);
		}
	}
	findContainingRoot(candidate, field) {
		if ((0, _openclaw_fs_safe_path.isPathInside)(this.boundary.configRoot[field], candidate)) return this.boundary.configRoot;
		for (const root of this.boundary.allowedRoots) if ((0, _openclaw_fs_safe_path.isPathInside)(root[field], candidate)) return root;
		return null;
	}
	checkCircular(resolvedPath) {
		if (this.visited.has(resolvedPath)) throw new CircularIncludeError([...this.visited, resolvedPath]);
	}
	checkDepth(includePath) {
		if (this.depth >= 10) throw new ConfigIncludeError(`Maximum include depth (10) exceeded at: ${includePath}`, includePath);
	}
	readFile(includePath, resolvedPath, root) {
		try {
			if (this.resolver.readFileWithGuards) return this.resolver.readFileWithGuards({
				includePath,
				resolvedPath,
				rootRealDir: root.rootRealDir
			});
			return this.resolver.readFile(resolvedPath);
		} catch (err) {
			if (err instanceof ConfigIncludeError) throw err;
			throw new ConfigIncludeError(`Failed to read include file: ${includePath} (resolved: ${resolvedPath})`, includePath, err instanceof Error ? err : void 0);
		}
	}
	parseFile(includePath, resolvedPath, raw) {
		try {
			return this.resolver.parseJson(raw);
		} catch (err) {
			throw new ConfigIncludeError(`Failed to parse include file: ${includePath} (resolved: ${resolvedPath})`, includePath, err instanceof Error ? err : void 0);
		}
	}
	processNested(resolvedPath, parsed) {
		const nested = new IncludeProcessor(resolvedPath, this.resolver, this.boundary);
		nested.visited = /* @__PURE__ */ new Set([...this.visited, resolvedPath]);
		nested.depth = this.depth + 1;
		return nested.process(parsed);
	}
};
function safeRealpath(target) {
	try {
		return node_fs.default.realpathSync(target);
	} catch {
		return target;
	}
}
/** Capture the lexical and canonical include roots once for a resolver traversal. */
function createConfigIncludeBoundary(configPath, allowedRoots = []) {
	const configRootDir = node_path.default.normalize(node_path.default.dirname(configPath));
	return {
		configRoot: {
			rootDir: configRootDir,
			rootRealDir: node_path.default.normalize(safeRealpath(configRootDir))
		},
		allowedRoots: allowedRoots.filter((entry) => typeof entry === "string" && entry.length > 0 && node_path.default.isAbsolute(entry)).map((entry) => {
			const rootDir = node_path.default.normalize(entry);
			return {
				rootDir,
				rootRealDir: node_path.default.normalize(safeRealpath(rootDir))
			};
		})
	};
}
function isNotFoundError(error) {
	return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}
function readConfigIncludeFileWithGuards(params) {
	const ioFs = params.ioFs ?? node_fs.default;
	const maxBytes = params.maxBytes ?? MAX_INCLUDE_FILE_BYTES;
	if (!(0, _openclaw_fs_safe_advanced.canUseRootFileOpen)(ioFs)) {
		const raw = ioFs.readFileSync(params.resolvedPath, "utf-8");
		try {
			params.onResolvedPath?.(node_path.default.normalize(ioFs.realpathSync(params.resolvedPath)));
		} catch {}
		return raw;
	}
	const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
		absolutePath: params.resolvedPath,
		rootPath: params.rootRealDir,
		rootRealPath: params.rootRealDir,
		boundaryLabel: "config directory",
		skipLexicalRootCheck: true,
		maxBytes,
		ioFs
	});
	if (!opened.ok) {
		if (opened.reason === "validation") throw new ConfigIncludeError(`Include file failed security checks (regular file, max ${maxBytes} bytes, no hardlinks): ${params.includePath}`, params.includePath);
		throw new ConfigIncludeError(`Failed to read include file: ${params.includePath} (resolved: ${params.resolvedPath})`, params.includePath, opened.error instanceof Error ? opened.error : void 0);
	}
	try {
		const raw = ioFs.readFileSync(opened.fd, "utf-8");
		params.onResolvedPath?.(node_path.default.normalize(opened.path));
		return raw;
	} finally {
		ioFs.closeSync(opened.fd);
	}
}
const defaultResolver = {
	readFile: (p) => node_fs.default.readFileSync(p, "utf-8"),
	readFileWithGuards: ({ includePath, resolvedPath, rootRealDir }) => readConfigIncludeFileWithGuards({
		includePath,
		resolvedPath,
		rootRealDir
	}),
	parseJson: require_parse_json_compat.parseJsonWithJson5Fallback
};
function resolveConfigIncludesWithinBoundary(obj, configPath, resolver, boundary) {
	return new IncludeProcessor(configPath, resolver, boundary).process(obj);
}
/**
* Creates a resolver that shares one immutable root snapshot across independent
* include resolutions. Used when callers must isolate malformed sibling graphs.
*/
function createConfigIncludeResolutionSession(configPath, allowedRoots = []) {
	const boundary = createConfigIncludeBoundary(configPath, allowedRoots);
	return (obj, basePath, resolver = defaultResolver) => resolveConfigIncludesWithinBoundary(obj, basePath, resolver, boundary);
}
/**
* Resolves all $include directives in a parsed config object.
*/
function resolveConfigIncludes(obj, configPath, resolver = defaultResolver, options = {}) {
	return resolveConfigIncludesWithinBoundary(obj, configPath, resolver, createConfigIncludeBoundary(configPath, options.allowedRoots ?? []));
}
//#endregion
Object.defineProperty(exports, "ConfigIncludeError", {
	enumerable: true,
	get: function() {
		return ConfigIncludeError;
	}
});
Object.defineProperty(exports, "INCLUDE_KEY", {
	enumerable: true,
	get: function() {
		return INCLUDE_KEY;
	}
});
Object.defineProperty(exports, "createConfigIncludeResolutionSession", {
	enumerable: true,
	get: function() {
		return createConfigIncludeResolutionSession;
	}
});
Object.defineProperty(exports, "hashConfigIncludeRaw", {
	enumerable: true,
	get: function() {
		return hashConfigIncludeRaw;
	}
});
Object.defineProperty(exports, "readConfigIncludeFileWithGuards", {
	enumerable: true,
	get: function() {
		return readConfigIncludeFileWithGuards;
	}
});
Object.defineProperty(exports, "resolveConfigIncludeWritePath", {
	enumerable: true,
	get: function() {
		return resolveConfigIncludeWritePath;
	}
});
Object.defineProperty(exports, "resolveConfigIncludes", {
	enumerable: true,
	get: function() {
		return resolveConfigIncludes;
	}
});
