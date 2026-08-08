const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let node_fs_promises = require("node:fs/promises");
let node_fs = require("node:fs");
//#region src/infra/openclaw-root.ts
var openclaw_root_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolveOperatorPackageRoot: () => resolveOperatorPackageRoot,
	resolveOperatorPackageRootSync: () => resolveOperatorPackageRootSync,
	resolveOperatorPackageRootsSync: () => resolveOperatorPackageRootsSync
});
const CORE_PACKAGE_NAMES = /* @__PURE__ */ new Set(["@gabrielvfonseca/operator"]);
const packageNameCache = /* @__PURE__ */ new Map();
const packageRootCache = /* @__PURE__ */ new Map();
const packageRootsCache = /* @__PURE__ */ new Map();
const argv1CandidateCache = /* @__PURE__ */ new Map();
function parsePackageName(raw) {
	const parsed = JSON.parse(raw);
	return typeof parsed.name === "string" ? parsed.name : null;
}
async function readPackageName(dir) {
	const packageJsonPath = node_path.default.join(node_path.default.resolve(dir), "package.json");
	if (packageNameCache.has(packageJsonPath)) return packageNameCache.get(packageJsonPath) ?? null;
	try {
		const name = parsePackageName(await node_fs_promises.default.readFile(packageJsonPath, "utf-8"));
		packageNameCache.set(packageJsonPath, name);
		return name;
	} catch {
		packageNameCache.set(packageJsonPath, null);
		return null;
	}
}
function readPackageNameSync(dir) {
	const packageJsonPath = node_path.default.join(node_path.default.resolve(dir), "package.json");
	if (packageNameCache.has(packageJsonPath)) return packageNameCache.get(packageJsonPath) ?? null;
	try {
		const name = parsePackageName(node_fs.default.readFileSync(packageJsonPath, "utf-8"));
		packageNameCache.set(packageJsonPath, name);
		return name;
	} catch {
		packageNameCache.set(packageJsonPath, null);
		return null;
	}
}
async function findPackageRoot(startDir, maxDepth = 12) {
	for (const current of iterAncestorDirs(startDir, maxDepth)) {
		const name = await readPackageName(current);
		if (name && CORE_PACKAGE_NAMES.has(name)) return current;
	}
	return null;
}
function findPackageRootSync(startDir, maxDepth = 12) {
	for (const current of iterAncestorDirs(startDir, maxDepth)) {
		const name = readPackageNameSync(current);
		if (name && CORE_PACKAGE_NAMES.has(name)) return current;
	}
	return null;
}
function* iterAncestorDirs(startDir, maxDepth) {
	let current = node_path.default.resolve(startDir);
	for (let i = 0; i < maxDepth; i += 1) {
		yield current;
		if (node_path.default.basename(current) === "node_modules") break;
		const parent = node_path.default.dirname(current);
		if (parent === current) break;
		current = parent;
	}
}
function candidateDirsFromArgv1(argv1) {
	const cacheKey = node_path.default.resolve(argv1);
	const cached = argv1CandidateCache.get(cacheKey);
	if (cached) return [...cached];
	const normalized = node_path.default.resolve(argv1);
	const candidates = [];
	try {
		const resolved = node_fs.default.realpathSync(normalized);
		if (resolved !== normalized) candidates.push(node_path.default.dirname(resolved));
	} catch {}
	candidates.push(node_path.default.dirname(normalized));
	const parts = normalized.split(node_path.default.sep);
	const binIndex = parts.lastIndexOf(".bin");
	if (binIndex > 0 && parts[binIndex - 1] === "node_modules") {
		const binName = node_path.default.basename(normalized);
		const nodeModulesDir = parts.slice(0, binIndex).join(node_path.default.sep);
		candidates.push(node_path.default.join(nodeModulesDir, binName));
	}
	const deduped = dedupeCandidates(candidates);
	argv1CandidateCache.set(cacheKey, deduped);
	return [...deduped];
}
async function resolveOperatorPackageRoot(opts) {
	const candidates = buildCandidates(opts);
	const cacheKey = createPackageRootCacheKey(candidates);
	if (packageRootCache.has(cacheKey)) return packageRootCache.get(cacheKey) ?? null;
	for (const candidate of candidates) {
		const found = await findPackageRoot(candidate);
		if (found) {
			packageRootCache.set(cacheKey, found);
			return found;
		}
	}
	packageRootCache.set(cacheKey, null);
	return null;
}
function resolveOperatorPackageRootsSync(opts) {
	const candidates = buildCandidates(opts);
	const cacheKey = createPackageRootCacheKey(candidates);
	const cached = packageRootsCache.get(cacheKey);
	if (cached) return [...cached];
	const seen = /* @__PURE__ */ new Set();
	const roots = [];
	for (const candidate of candidates) {
		const found = findPackageRootSync(candidate);
		if (found && !seen.has(found)) {
			seen.add(found);
			roots.push(found);
		}
	}
	packageRootsCache.set(cacheKey, roots);
	return [...roots];
}
function resolveOperatorPackageRootSync(opts) {
	return resolveOperatorPackageRootsSync(opts)[0] ?? null;
}
function buildCandidates(opts) {
	const candidates = [];
	if (opts.moduleUrl) try {
		candidates.push(node_path.default.dirname((0, node_url.fileURLToPath)(opts.moduleUrl)));
	} catch {}
	if (opts.argv1) candidates.push(...candidateDirsFromArgv1(opts.argv1));
	if (opts.cwd) candidates.push(opts.cwd);
	return dedupeCandidates(candidates);
}
function dedupeCandidates(candidates) {
	const seen = /* @__PURE__ */ new Set();
	const deduped = [];
	for (const candidate of candidates) {
		const resolved = node_path.default.resolve(candidate);
		if (seen.has(resolved)) continue;
		seen.add(resolved);
		deduped.push(resolved);
	}
	return deduped;
}
function createPackageRootCacheKey(candidates) {
	return candidates.join("\0");
}
//#endregion
Object.defineProperty(exports, "openclaw_root_exports", {
	enumerable: true,
	get: function() {
		return openclaw_root_exports;
	}
});
Object.defineProperty(exports, "resolveOperatorPackageRoot", {
	enumerable: true,
	get: function() {
		return resolveOperatorPackageRoot;
	}
});
Object.defineProperty(exports, "resolveOperatorPackageRootSync", {
	enumerable: true,
	get: function() {
		return resolveOperatorPackageRootSync;
	}
});
