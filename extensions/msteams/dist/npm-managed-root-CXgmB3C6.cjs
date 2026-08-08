const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_safe_package_install = require("./safe-package-install-D1effjCo.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let yaml = require("yaml");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/infra/npm-managed-root.ts
function readDependencyRecord(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return {};
	const dependencies = {};
	for (const [key, raw] of Object.entries(value)) if (typeof raw === "string") dependencies[key] = raw;
	return dependencies;
}
function isSafePackageName(name) {
	if (name.startsWith("@")) {
		const parts = name.split("/");
		return parts.length === 2 && parts.every((part) => part.length > 0 && part !== "." && part !== "..");
	}
	return name.length > 0 && !name.includes("/") && !name.includes("\\") && name !== "." && name !== "..";
}
function isManagedNpmRootHostPeerPackageName(name) {
	return name === "@gabrielvfonseca/operator";
}
function readOverrideRecord(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return {};
	const overrides = {};
	for (const [key, raw] of Object.entries(value)) if (key.trim()) overrides[key] = raw;
	return overrides;
}
function readManagedOverrideKeys(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || !Array.isArray(value.managedOverrides)) return [];
	return value.managedOverrides.filter((key) => typeof key === "string");
}
function readManagedPeerDependencyKeys(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || !Array.isArray(value.managedPeerDependencies)) return [];
	return value.managedPeerDependencies.filter((key) => typeof key === "string");
}
function buildManagedOperatorMetadata(params) {
	const metadata = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.current) ? { ...params.current } : {};
	if (params.managedOverrideKeys.length > 0) metadata.managedOverrides = params.managedOverrideKeys;
	else delete metadata.managedOverrides;
	const managedPeerDependencyKeys = params.managedPeerDependencyKeys;
	if (managedPeerDependencyKeys && managedPeerDependencyKeys.length > 0) metadata.managedPeerDependencies = managedPeerDependencyKeys;
	else if (managedPeerDependencyKeys) delete metadata.managedPeerDependencies;
	return Object.keys(metadata).length > 0 ? metadata : void 0;
}
async function readManagedNpmRootManifest(filePath) {
	const parsed = await (0, _openclaw_fs_safe_json.readJsonIfExists)(filePath);
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) ? { ...parsed } : {};
}
async function readHostWorkspaceOverrides(packageRoot) {
	const workspace = (0, yaml.parse)(await node_fs_promises.default.readFile(node_path.default.join(packageRoot, "pnpm-workspace.yaml"), "utf8"));
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(workspace) ? readOverrideRecord(workspace.overrides) : {};
}
function readHostDependencySpec(manifest, packageName) {
	return manifest.dependencies?.[packageName] ?? manifest.optionalDependencies?.[packageName] ?? manifest.peerDependencies?.[packageName] ?? manifest.devDependencies?.[packageName];
}
function resolveHostOverrideReferences(value, manifest) {
	if (typeof value === "string" && value.startsWith("$")) return readHostDependencySpec(manifest, value.slice(1)) ?? value;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return value;
	const resolved = {};
	for (const [key, nested] of Object.entries(value)) resolved[key] = resolveHostOverrideReferences(nested, manifest);
	return resolved;
}
function isUnsupportedManagedNpmOverride(value) {
	return typeof value === "string" && value.trim().startsWith("npm:");
}
function filterUnsupportedManagedNpmRootOverrides(value) {
	const overrides = readOverrideRecord(value);
	const filtered = {};
	for (const [key, raw] of Object.entries(overrides)) {
		if (isUnsupportedManagedNpmOverride(raw)) continue;
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) {
			const nested = filterUnsupportedManagedNpmRootOverrides(raw);
			if (Object.keys(nested).length > 0) filtered[key] = nested;
			continue;
		}
		filtered[key] = raw;
	}
	return filtered;
}
function readRootOverrideSpec(value) {
	if (typeof value === "string") return value;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && typeof value["."] === "string") return value["."];
}
/**
* npm rejects manifests where an override changes the effective spec of a root direct
* dependency (Arborist EOVERRIDE), which bricks every later install in the managed root.
* Managed peer pins follow the override; for owned root deps the managed override yields.
*/
function reconcileManagedNpmRootOverrideConflicts(params) {
	for (const [packageName, overrideValue] of Object.entries(params.overrides)) {
		const dependencySpec = params.dependencies[packageName];
		if (dependencySpec === void 0) continue;
		const overrideSpec = readRootOverrideSpec(overrideValue);
		if (overrideSpec === void 0 || overrideSpec === "*" || overrideSpec.startsWith("$") || overrideSpec === dependencySpec) continue;
		if (params.managedDependencyNames.has(packageName)) {
			params.dependencies[packageName] = overrideSpec;
			continue;
		}
		if (!params.managedOverrideNames.has(packageName)) continue;
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(overrideValue)) {
			const trimmed = { ...overrideValue };
			delete trimmed["."];
			if (Object.keys(trimmed).length > 0) {
				params.overrides[packageName] = trimmed;
				continue;
			}
		}
		delete params.overrides[packageName];
	}
}
/** Merge managed overrides into a managed root manifest's override record and keep the
* EOVERRIDE invariant plus metadata (keys actually written) consistent in one place. */
function applyManagedNpmRootOverrides(params) {
	const overrides = readOverrideRecord(params.manifest.overrides);
	for (const key of readManagedOverrideKeys(params.manifest.operator)) delete overrides[key];
	Object.assign(overrides, params.managedOverrides);
	reconcileManagedNpmRootOverrideConflicts({
		dependencies: params.dependencies,
		overrides,
		managedDependencyNames: params.managedDependencyNames,
		managedOverrideNames: new Set(Object.keys(params.managedOverrides))
	});
	return {
		overrides,
		managedOverrideKeys: Object.keys(params.managedOverrides).filter((key) => Object.hasOwn(overrides, key)).toSorted()
	};
}
/** Read host Operator pnpm overrides for reuse inside a managed npm root. */
async function readOperatorManagedNpmRootOverrides(params) {
	const packageRoot = params?.packageRoot ?? require_openclaw_root.resolveOperatorPackageRootSync({
		argv1: params?.argv1 ?? process.argv[1],
		moduleUrl: params?.moduleUrl ?? require("url").pathToFileURL(__filename).href,
		cwd: params?.cwd ?? process.cwd()
	});
	if (!packageRoot) return {};
	try {
		const manifest = JSON.parse(await node_fs_promises.default.readFile(node_path.default.join(packageRoot, "package.json"), "utf8"));
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(manifest)) return {};
		const hostManifest = manifest;
		const overrides = await readHostWorkspaceOverrides(packageRoot);
		return Object.fromEntries(Object.entries(overrides).map(([key, value]) => [key, resolveHostOverrideReferences(value, hostManifest)]));
	} catch {
		return {};
	}
}
/** Resolve the dependency spec to write for a parsed registry package. */
function resolveManagedNpmRootDependencySpec(params) {
	return params.resolution.version ?? params.parsedSpec.selector ?? "latest";
}
/** Insert or update a dependency and managed override metadata in package.json. */
async function upsertManagedNpmRootDependency(params) {
	await node_fs_promises.default.mkdir(params.npmRoot, { recursive: true });
	const manifestPath = node_path.default.join(params.npmRoot, "package.json");
	const manifest = await readManagedNpmRootManifest(manifestPath);
	const dependencies = readDependencyRecord(manifest.dependencies);
	const managedOverrides = params.omitUnsupportedManagedOverrides ? filterUnsupportedManagedNpmRootOverrides(params.managedOverrides) : readOverrideRecord(params.managedOverrides);
	const nextDependencies = {
		...dependencies,
		[params.packageName]: params.dependencySpec
	};
	const managedDependencyNames = new Set(readManagedPeerDependencyKeys(manifest.operator));
	managedDependencyNames.delete(params.packageName);
	const { overrides, managedOverrideKeys } = applyManagedNpmRootOverrides({
		manifest,
		managedOverrides,
		dependencies: nextDependencies,
		managedDependencyNames
	});
	const openclawMetadata = buildManagedOperatorMetadata({
		current: manifest.operator,
		managedOverrideKeys,
		managedPeerDependencyKeys: [...managedDependencyNames].toSorted()
	});
	const next = {
		...manifest,
		private: true,
		dependencies: nextDependencies
	};
	if (Object.keys(overrides).length > 0) next.overrides = overrides;
	else delete next.overrides;
	if (openclawMetadata) next.operator = openclawMetadata;
	else delete next.operator;
	await (0, _openclaw_fs_safe_json.writeJson)(manifestPath, next, { trailingNewline: true });
}
function isOptionalPeerDependency(manifest, peerName) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(manifest.peerDependenciesMeta)) return false;
	const peerMetadata = manifest.peerDependenciesMeta[peerName];
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(peerMetadata) && peerMetadata.optional === true;
}
function isDevOnlyLockPackage(value) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && value.dev === true;
}
function readStringList(value) {
	if (typeof value === "string") return [value];
	if (!Array.isArray(value)) return;
	const values = value.filter((entry) => typeof entry === "string");
	return values.length > 0 ? values : void 0;
}
function matchesNpmPlatformList(value, list) {
	if (!list) return true;
	if (list.length === 1 && list[0] === "any") return true;
	if (!value) return false;
	let negated = 0;
	let matched = false;
	for (const entry of list) {
		const negate = entry.startsWith("!");
		const test = negate ? entry.slice(1) : entry;
		if (negate) {
			negated += 1;
			if (value === test) return false;
		} else matched = matched || value === test;
	}
	return matched || negated === list.length;
}
function resolveCurrentLibc() {
	if (process.platform !== "linux") return;
	const report = process.report?.getReport();
	const header = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(report) ? report.header : void 0;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(header) && header.glibcVersionRuntime) return "glibc";
	const sharedObjects = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(report) ? report.sharedObjects : void 0;
	if (Array.isArray(sharedObjects) && sharedObjects.some((file) => typeof file === "string" && file.includes("musl"))) return "musl";
}
function isUnsupportedOptionalLockPackage(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || value.optional !== true) return false;
	return !matchesNpmPlatformList(process.platform, readStringList(value.os)) || !matchesNpmPlatformList(process.arch, readStringList(value.cpu)) || !matchesNpmPlatformList(resolveCurrentLibc(), readStringList(value.libc));
}
function hasNpmPlatformConstraint(value) {
	return value.os !== void 0 || value.cpu !== void 0 || value.libc !== void 0;
}
function readLockPackageLocationName(location) {
	const parts = location.split("/");
	for (let index = parts.length - 1; index >= 0; index -= 1) {
		if (parts[index] !== "node_modules") continue;
		const first = parts[index + 1];
		if (!first) return;
		if (!first.startsWith("@")) return first;
		const second = parts[index + 2];
		return second ? `${first}/${second}` : void 0;
	}
}
function readLockPackageName(location, value) {
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) {
		const packageName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.name);
		if (packageName) return packageName;
	}
	return readLockPackageLocationName(location);
}
function resolveManagedNpmLockPackagePath(params) {
	const npmRoot = node_path.default.resolve(params.npmRoot);
	const packagePath = node_path.default.resolve(npmRoot, ...params.location.split("/"));
	const relativePath = node_path.default.relative(npmRoot, packagePath);
	if (!relativePath || relativePath === ".." || relativePath.startsWith(`..${node_path.default.sep}`) || node_path.default.isAbsolute(relativePath)) return;
	return packagePath;
}
function isTopLevelLockPackageLocation(location) {
	return location.split("/").filter((part) => part === "node_modules").length === 1;
}
/** Lists explicitly required current-platform packages that npm recorded but did not materialize. */
async function listMissingRequiredPlatformPackages(params) {
	const requiredPackageNames = new Set(params.requiredPackageNames);
	if (requiredPackageNames.size === 0) return [];
	const parsed = await (0, _openclaw_fs_safe_json.readJson)(node_path.default.join(params.npmRoot, "package-lock.json"));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.packages)) return [];
	const missing = [];
	for (const [location, value] of Object.entries(parsed.packages)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || value.optional !== true || !hasNpmPlatformConstraint(value) || isUnsupportedOptionalLockPackage(value)) continue;
		const name = readLockPackageLocationName(location);
		const packagePath = resolveManagedNpmLockPackagePath({
			npmRoot: params.npmRoot,
			location
		});
		if (!name || !requiredPackageNames.has(name) || !isSafePackageName(name) || !packagePath) continue;
		if (!await pathExists(packagePath)) missing.push({
			name,
			packagePath
		});
	}
	return missing.toSorted((left, right) => left.packagePath.localeCompare(right.packagePath));
}
function findLockPackageVersion(params) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.lockfile.packages)) return;
	const preferredLocation = `node_modules/${params.packageName}`;
	const preferredPackage = params.lockfile.packages[preferredLocation];
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(preferredPackage) && !isDevOnlyLockPackage(preferredPackage) && !isUnsupportedOptionalLockPackage(preferredPackage)) {
		const preferredVersion = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(preferredPackage.version);
		if (preferredVersion) return preferredVersion;
	}
}
function collectNpmLockPeerDependencyPins(params) {
	const pins = /* @__PURE__ */ new Map();
	const packages = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.lockfile.packages) ? params.lockfile.packages : {};
	for (const [location, value] of Object.entries(packages).toSorted(([left], [right]) => left.localeCompare(right))) {
		if (location === "" || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || isDevOnlyLockPackage(value) || isUnsupportedOptionalLockPackage(value)) continue;
		const packageName = readLockPackageName(location, value);
		if (packageName && isManagedNpmRootHostPeerPackageName(packageName)) continue;
		const peerDependencies = readDependencyRecord(value.peerDependencies);
		for (const [peerName, peerRange] of Object.entries(peerDependencies)) {
			if (isManagedNpmRootHostPeerPackageName(peerName) || pins.has(peerName) || !isSafePackageName(peerName)) continue;
			const version = findLockPackageVersion({
				lockfile: params.lockfile,
				packageName: peerName
			});
			if (!version && isOptionalPeerDependency(value, peerName)) continue;
			if (!version && !isTopLevelLockPackageLocation(location)) continue;
			pins.set(peerName, version ?? peerRange);
		}
	}
	return Object.fromEntries([...pins.entries()].toSorted(([left], [right]) => left.localeCompare(right)));
}
async function copyPathIfExists(source, destination) {
	try {
		await node_fs_promises.default.cp(source, destination, { recursive: true });
	} catch (err) {
		if (err.code === "ENOENT") return;
		throw err;
	}
}
function scrubHostPeerFromLockPackage(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return false;
	let changed = false;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.peerDependencies) && "@gabrielvfonseca/operator" in value.peerDependencies) {
		const peerDependencies = { ...value.peerDependencies };
		delete peerDependencies.operator;
		if (Object.keys(peerDependencies).length > 0) value.peerDependencies = peerDependencies;
		else delete value.peerDependencies;
		changed = true;
	}
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.peerDependenciesMeta) && "@gabrielvfonseca/operator" in value.peerDependenciesMeta) {
		const peerDependenciesMeta = { ...value.peerDependenciesMeta };
		delete peerDependenciesMeta.operator;
		if (Object.keys(peerDependenciesMeta).length > 0) value.peerDependenciesMeta = peerDependenciesMeta;
		else delete value.peerDependenciesMeta;
		changed = true;
	}
	return changed;
}
async function scrubHostPeerFromTempPackageLock(lockPath) {
	const parsed = await (0, _openclaw_fs_safe_json.readJsonIfExists)(lockPath);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed)) return;
	let changed = false;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.packages)) for (const value of Object.values(parsed.packages)) changed = scrubHostPeerFromLockPackage(value) || changed;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.dependencies)) for (const value of Object.values(parsed.dependencies)) changed = scrubHostPeerFromLockPackage(value) || changed;
	if (changed) await (0, _openclaw_fs_safe_json.writeJson)(lockPath, parsed, { trailingNewline: true });
}
function collectExistingManagedPeerDependencyPins(dependencies, previousManagedPeerDependencies) {
	const pins = {};
	for (const packageName of previousManagedPeerDependencies) {
		const dependencySpec = dependencies[packageName];
		if (dependencySpec) pins[packageName] = dependencySpec;
	}
	return pins;
}
function isHostPeerResolutionFailure(result) {
	const output = `${result.stdout}\n${result.stderr}`;
	return /(^|[^@\w.-])openclaw(?=$|[@\s:,"'])/i.test(output);
}
function createManagedNpmPeerPlanArgs(params) {
	return [
		"npm",
		"install",
		"--package-lock-only",
		...params?.force ? ["--force"] : [],
		...require_safe_package_install.createSafeNpmInstallArgs({
			omitDev: true,
			omitPeer: true,
			legacyPeerDeps: params?.legacyPeerDeps,
			loglevel: "error",
			ignoreWorkspaces: true,
			noAudit: true,
			noFund: true
		}).slice(1)
	];
}
async function collectNpmResolvedManagedNpmRootPeerDependencyPins(params) {
	const manifest = await readManagedNpmRootManifest(node_path.default.join(params.npmRoot, "package.json"));
	const dependencies = readDependencyRecord(manifest.dependencies);
	const previousManagedPeerDependencies = readManagedPeerDependencyKeys(manifest.operator);
	const fallbackPeerPins = collectExistingManagedPeerDependencyPins(dependencies, previousManagedPeerDependencies);
	for (const packageName of previousManagedPeerDependencies) delete dependencies[packageName];
	const tempRoot = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-managed-peer-plan-"));
	try {
		delete dependencies.operator;
		await (0, _openclaw_fs_safe_json.writeJson)(node_path.default.join(tempRoot, "package.json"), {
			...manifest,
			private: true,
			dependencies
		}, { trailingNewline: true });
		await copyPathIfExists(node_path.default.join(params.npmRoot, "package-lock.json"), node_path.default.join(tempRoot, "package-lock.json"));
		const tempLockPath = node_path.default.join(tempRoot, "package-lock.json");
		await scrubHostPeerFromTempPackageLock(tempLockPath);
		await copyPathIfExists(node_path.default.join(params.npmRoot, ".npmrc"), node_path.default.join(tempRoot, ".npmrc"));
		await copyPathIfExists(node_path.default.join(params.npmRoot, "_operator-pack-archives"), node_path.default.join(tempRoot, "_operator-pack-archives"));
		const command = params.runCommand ?? require_exec.runCommandWithTimeout;
		const npmPeerPlanArgs = createManagedNpmPeerPlanArgs({ force: true });
		const npmPlanOptions = {
			cwd: tempRoot,
			timeoutMs: Math.max(params.timeoutMs ?? 3e5, 3e5),
			env: require_safe_package_install.createSafeNpmInstallEnv(process.env, {
				legacyPeerDeps: false,
				npmConfigCwd: tempRoot,
				packageLock: true,
				quiet: true
			})
		};
		const result = await command(npmPeerPlanArgs, npmPlanOptions);
		if (result.code !== 0) {
			if (isHostPeerResolutionFailure(result)) {
				if ((await command(createManagedNpmPeerPlanArgs({
					force: true,
					legacyPeerDeps: true
				}), {
					...npmPlanOptions,
					env: require_safe_package_install.createSafeNpmInstallEnv(process.env, {
						legacyPeerDeps: true,
						npmConfigCwd: tempRoot,
						packageLock: true,
						quiet: true
					})
				})).code === 0) return collectNpmLockPeerDependencyPins({ lockfile: await readManagedNpmRootManifest(tempLockPath) });
			}
			return fallbackPeerPins;
		}
		return collectNpmLockPeerDependencyPins({ lockfile: await readManagedNpmRootManifest(tempLockPath) });
	} finally {
		await node_fs_promises.default.rm(tempRoot, {
			recursive: true,
			force: true
		});
	}
}
/** Snapshot managed peer dependencies before a risky install/update operation. */
async function readManagedNpmRootPeerDependencySnapshot(params) {
	const manifest = await readManagedNpmRootManifest(node_path.default.join(params.npmRoot, "package.json"));
	const dependencies = readDependencyRecord(manifest.dependencies);
	const managedPeerDependencies = readManagedPeerDependencyKeys(manifest.operator).toSorted();
	const dependencySnapshot = {};
	for (const packageName of managedPeerDependencies) {
		const dependencySpec = dependencies[packageName];
		if (dependencySpec) dependencySnapshot[packageName] = dependencySpec;
	}
	return {
		dependencies: dependencySnapshot,
		managedPeerDependencies
	};
}
/** Restore a previously captured managed peer dependency snapshot. */
async function restoreManagedNpmRootPeerDependencySnapshot(params) {
	const manifestPath = node_path.default.join(params.npmRoot, "package.json");
	const manifest = await readManagedNpmRootManifest(manifestPath);
	const dependencies = readDependencyRecord(manifest.dependencies);
	for (const packageName of readManagedPeerDependencyKeys(manifest.operator)) delete dependencies[packageName];
	Object.assign(dependencies, params.snapshot.dependencies);
	const overrides = readOverrideRecord(manifest.overrides);
	const currentManagedOverrideKeys = readManagedOverrideKeys(manifest.operator);
	reconcileManagedNpmRootOverrideConflicts({
		dependencies,
		overrides,
		managedDependencyNames: new Set(params.snapshot.managedPeerDependencies),
		managedOverrideNames: new Set(currentManagedOverrideKeys)
	});
	const managedOverrideKeys = currentManagedOverrideKeys.filter((key) => Object.hasOwn(overrides, key)).toSorted();
	const openclawMetadata = buildManagedOperatorMetadata({
		current: manifest.operator,
		managedOverrideKeys,
		managedPeerDependencyKeys: params.snapshot.managedPeerDependencies.toSorted()
	});
	const next = {
		...manifest,
		private: true,
		dependencies
	};
	if (Object.keys(overrides).length > 0) next.overrides = overrides;
	else delete next.overrides;
	if (openclawMetadata) next.operator = openclawMetadata;
	else delete next.operator;
	await (0, _openclaw_fs_safe_json.writeJson)(manifestPath, next, { trailingNewline: true });
}
/** Sync package.json with peer dependency pins resolved from npm's lock plan. */
async function syncManagedNpmRootPeerDependencies(params) {
	const manifestPath = node_path.default.join(params.npmRoot, "package.json");
	const manifest = await readManagedNpmRootManifest(manifestPath);
	const dependencies = readDependencyRecord(manifest.dependencies);
	const previousManagedPeerDependencies = readManagedPeerDependencyKeys(manifest.operator);
	const previousManagedPeerDependencySet = new Set(previousManagedPeerDependencies);
	const peerPins = await collectNpmResolvedManagedNpmRootPeerDependencyPins({
		npmRoot: params.npmRoot,
		runCommand: params.runCommand,
		timeoutMs: params.timeoutMs
	});
	const managedPeerDependencyNames = new Set(Object.keys(peerPins).filter((packageName) => previousManagedPeerDependencySet.has(packageName) || !Object.hasOwn(dependencies, packageName)));
	const nextDependencies = { ...dependencies };
	for (const packageName of previousManagedPeerDependencies) if (!Object.hasOwn(peerPins, packageName)) delete nextDependencies[packageName];
	for (const [packageName, dependencySpec] of Object.entries(peerPins)) if (managedPeerDependencyNames.has(packageName)) nextDependencies[packageName] = dependencySpec;
	const { overrides, managedOverrideKeys } = applyManagedNpmRootOverrides({
		manifest,
		managedOverrides: params.omitUnsupportedManagedOverrides ? filterUnsupportedManagedNpmRootOverrides(params.managedOverrides) : readOverrideRecord(params.managedOverrides),
		dependencies: nextDependencies,
		managedDependencyNames: managedPeerDependencyNames
	});
	const managedPeerDependencyKeys = [...managedPeerDependencyNames].toSorted();
	const openclawMetadata = buildManagedOperatorMetadata({
		current: manifest.operator,
		managedOverrideKeys,
		managedPeerDependencyKeys
	});
	const next = {
		...manifest,
		private: true,
		dependencies: nextDependencies
	};
	if (Object.keys(overrides).length > 0) next.overrides = overrides;
	else delete next.overrides;
	if (openclawMetadata) next.operator = openclawMetadata;
	else delete next.operator;
	const changed = JSON.stringify(next) !== JSON.stringify(manifest);
	if (changed) await (0, _openclaw_fs_safe_json.writeJson)(manifestPath, next, { trailingNewline: true });
	return changed;
}
/** Remove stale managed-root openclaw peer installs while preserving active host links. */
async function repairManagedNpmRootOperatorPeer(params) {
	await node_fs_promises.default.mkdir(params.npmRoot, { recursive: true });
	const activeHostState = await readManagedNpmRootOperatorHostState({
		npmRoot: params.npmRoot,
		packageRoot: params.packageRoot
	});
	if (activeHostState === "managed-active-host") return false;
	const hasManifestDependency = "@gabrielvfonseca/operator" in readDependencyRecord((await readManagedNpmRootManifest(node_path.default.join(params.npmRoot, "package.json"))).dependencies);
	const hasLockDependency = await managedNpmRootLockfileHasOperatorPeer(params.npmRoot);
	const hasPackageDir = await pathExists(node_path.default.join(params.npmRoot, "node_modules", "@gabrielvfonseca/operator"));
	const preserveActiveHostLink = activeHostState === "linked-active-host";
	if (!hasManifestDependency && !hasLockDependency && (!hasPackageDir || preserveActiveHostLink)) return false;
	if (preserveActiveHostLink) {
		await scrubManagedNpmRootOperatorPeer({
			npmRoot: params.npmRoot,
			preservePackageDir: true
		});
		return true;
	}
	const command = params.runCommand ?? require_exec.runCommandWithTimeout;
	const npmArgs = hasManifestDependency ? [
		"npm",
		"uninstall",
		"--loglevel=error",
		"--legacy-peer-deps",
		"--ignore-scripts",
		"--no-audit",
		"--no-fund",
		"@gabrielvfonseca/operator"
	] : [
		"npm",
		"prune",
		"--loglevel=error",
		"--legacy-peer-deps",
		"--ignore-scripts",
		"--no-audit",
		"--no-fund"
	];
	try {
		const result = await command(npmArgs, {
			cwd: params.npmRoot,
			timeoutMs: Math.max(params.timeoutMs ?? 3e5, 3e5),
			env: require_safe_package_install.createSafeNpmInstallEnv(process.env, {
				legacyPeerDeps: true,
				npmConfigCwd: params.npmRoot,
				packageLock: true,
				quiet: true
			})
		});
		if (result.code !== 0) params.logger?.warn?.(`npm ${hasManifestDependency ? "uninstall openclaw" : "prune"} failed while repairing managed npm root; falling back to direct cleanup: ${result.stderr.trim() || result.stdout.trim()}`);
	} catch (error) {
		params.logger?.warn?.(`npm ${hasManifestDependency ? "uninstall openclaw" : "prune"} failed while repairing managed npm root; falling back to direct cleanup: ${String(error)}`);
	}
	await scrubManagedNpmRootOperatorPeer({ npmRoot: params.npmRoot });
	return true;
}
async function readManagedNpmRootOperatorHostState(params) {
	const packageRoot = params.packageRoot === void 0 ? require_openclaw_root.resolveOperatorPackageRootSync({
		argv1: process.argv[1],
		moduleUrl: require("url").pathToFileURL(__filename).href,
		cwd: process.cwd()
	}) : params.packageRoot;
	if (!packageRoot) return "none";
	const managedOperatorPackageDir = node_path.default.join(params.npmRoot, "node_modules", "@gabrielvfonseca/operator");
	const [hostPackageRoot, managedPackageRoot, managedPackageStat] = await Promise.all([
		realpathIfExists(packageRoot),
		realpathIfExists(managedOperatorPackageDir),
		lstatIfExists(managedOperatorPackageDir)
	]);
	if (hostPackageRoot === null || hostPackageRoot !== managedPackageRoot) return "none";
	return managedPackageStat?.isSymbolicLink() ? "linked-active-host" : "managed-active-host";
}
async function managedNpmRootLockfileHasOperatorPeer(npmRoot) {
	const lockPath = node_path.default.join(npmRoot, "package-lock.json");
	try {
		const parsed = JSON.parse(await node_fs_promises.default.readFile(lockPath, "utf8"));
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.packages)) {
			const rootPackage = parsed.packages[""];
			if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rootPackage) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rootPackage.dependencies) && "@gabrielvfonseca/operator" in rootPackage.dependencies) return true;
			if ("node_modules/openclaw" in parsed.packages) return true;
		}
		return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.dependencies) && "@gabrielvfonseca/operator" in parsed.dependencies;
	} catch (err) {
		if (err.code === "ENOENT") return false;
		throw err;
	}
}
async function realpathIfExists(filePath) {
	try {
		return await node_fs_promises.default.realpath(filePath);
	} catch (err) {
		if (err.code === "ENOENT") return null;
		throw err;
	}
}
async function lstatIfExists(filePath) {
	try {
		return await node_fs_promises.default.lstat(filePath);
	} catch (err) {
		if (err.code === "ENOENT") return null;
		throw err;
	}
}
async function pathExists(filePath) {
	return await node_fs_promises.default.lstat(filePath).then(() => true).catch((err) => {
		if (require_errors.hasErrnoCode(err, "ENOENT")) return false;
		throw err;
	});
}
async function scrubManagedNpmRootOperatorPeer(params) {
	const manifestPath = node_path.default.join(params.npmRoot, "package.json");
	const manifest = await readManagedNpmRootManifest(manifestPath);
	const dependencies = readDependencyRecord(manifest.dependencies);
	if ("@gabrielvfonseca/operator" in dependencies) {
		const { operator: _removed, ...nextDependencies } = dependencies;
		await node_fs_promises.default.writeFile(manifestPath, `${JSON.stringify({
			...manifest,
			private: true,
			dependencies: nextDependencies
		}, null, 2)}\n`, "utf8");
	}
	const lockPath = node_path.default.join(params.npmRoot, "package-lock.json");
	try {
		const parsed = JSON.parse(await node_fs_promises.default.readFile(lockPath, "utf8"));
		let lockChanged = false;
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.packages)) {
			const rootPackage = parsed.packages[""];
			if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rootPackage) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rootPackage.dependencies)) {
				const dependenciesValue = { ...rootPackage.dependencies };
				if ("@gabrielvfonseca/operator" in dependenciesValue) {
					delete dependenciesValue.operator;
					parsed.packages[""] = {
						...rootPackage,
						dependencies: dependenciesValue
					};
					lockChanged = true;
				}
			}
			if ("node_modules/openclaw" in parsed.packages) {
				delete parsed.packages["node_modules/openclaw"];
				lockChanged = true;
			}
		}
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.dependencies) && "@gabrielvfonseca/operator" in parsed.dependencies) {
			const dependenciesLocal = { ...parsed.dependencies };
			delete dependenciesLocal.operator;
			parsed.dependencies = dependenciesLocal;
			lockChanged = true;
		}
		if (lockChanged) await node_fs_promises.default.writeFile(lockPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}
	const openclawPackageDir = node_path.default.join(params.npmRoot, "node_modules", "@gabrielvfonseca/operator");
	if (!params.preservePackageDir && await pathExists(openclawPackageDir)) await node_fs_promises.default.rm(openclawPackageDir, {
		recursive: true,
		force: true
	});
	const binDir = node_path.default.join(params.npmRoot, "node_modules", ".bin");
	await Promise.all([
		"@gabrielvfonseca/operator",
		"operator.cmd",
		"operator.ps1"
	].map((binName) => node_fs_promises.default.rm(node_path.default.join(binDir, binName), { force: true })));
	await node_fs_promises.default.rm(node_path.default.join(params.npmRoot, "node_modules", ".package-lock.json"), { force: true });
}
/** Read lockfile metadata for an installed dependency in the managed root. */
async function readManagedNpmRootInstalledDependency(params) {
	const parsed = await (0, _openclaw_fs_safe_json.readJson)(node_path.default.join(params.npmRoot, "package-lock.json"));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.packages)) return null;
	const entry = parsed.packages[`node_modules/${params.packageName}`];
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) return null;
	return {
		version: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.version),
		integrity: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.integrity),
		resolved: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.resolved)
	};
}
/** Remove a dependency from the managed root manifest. */
async function removeManagedNpmRootDependency(params) {
	const manifestPath = node_path.default.join(params.npmRoot, "package.json");
	const manifest = await readManagedNpmRootManifest(manifestPath);
	const dependencies = readDependencyRecord(manifest.dependencies);
	if (!(params.packageName in dependencies)) return;
	const { [params.packageName]: _removed, ...nextDependencies } = dependencies;
	await (0, _openclaw_fs_safe_json.writeJson)(manifestPath, {
		...manifest,
		private: true,
		dependencies: nextDependencies
	}, { trailingNewline: true });
}
//#endregion
Object.defineProperty(exports, "listMissingRequiredPlatformPackages", {
	enumerable: true,
	get: function() {
		return listMissingRequiredPlatformPackages;
	}
});
Object.defineProperty(exports, "readManagedNpmRootInstalledDependency", {
	enumerable: true,
	get: function() {
		return readManagedNpmRootInstalledDependency;
	}
});
Object.defineProperty(exports, "readManagedNpmRootPeerDependencySnapshot", {
	enumerable: true,
	get: function() {
		return readManagedNpmRootPeerDependencySnapshot;
	}
});
Object.defineProperty(exports, "readOperatorManagedNpmRootOverrides", {
	enumerable: true,
	get: function() {
		return readOperatorManagedNpmRootOverrides;
	}
});
Object.defineProperty(exports, "removeManagedNpmRootDependency", {
	enumerable: true,
	get: function() {
		return removeManagedNpmRootDependency;
	}
});
Object.defineProperty(exports, "repairManagedNpmRootOperatorPeer", {
	enumerable: true,
	get: function() {
		return repairManagedNpmRootOperatorPeer;
	}
});
Object.defineProperty(exports, "resolveManagedNpmRootDependencySpec", {
	enumerable: true,
	get: function() {
		return resolveManagedNpmRootDependencySpec;
	}
});
Object.defineProperty(exports, "restoreManagedNpmRootPeerDependencySnapshot", {
	enumerable: true,
	get: function() {
		return restoreManagedNpmRootPeerDependencySnapshot;
	}
});
Object.defineProperty(exports, "syncManagedNpmRootPeerDependencies", {
	enumerable: true,
	get: function() {
		return syncManagedNpmRootPeerDependencies;
	}
});
Object.defineProperty(exports, "upsertManagedNpmRootDependency", {
	enumerable: true,
	get: function() {
		return upsertManagedNpmRootDependency;
	}
});
