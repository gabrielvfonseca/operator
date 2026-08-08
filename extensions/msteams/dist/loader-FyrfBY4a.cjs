const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_legacy_names = require("./legacy-names-CjJxLNks.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
require("./scan-paths-bPESVZQ5.cjs");
const require_internal_hooks = require("./internal-hooks-CP-OV43M.cjs");
const require_config_eval = require("./config-eval-fz8eE8a4.cjs");
const require_module_loader = require("./module-loader-D_NNnfbR.cjs");
const require_frontmatter = require("./frontmatter-CVnCMs4I.cjs");
const require_configured = require("./configured-BQmsVC5S.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/hooks/policy.ts
const HOOK_SOURCE_POLICIES = {
	"operator-bundled": {
		precedence: 10,
		trustedLocalCode: true,
		defaultEnableMode: "default-on",
		canOverride: ["operator-bundled"],
		canBeOverriddenBy: ["operator-managed", "operator-plugin"]
	},
	"operator-plugin": {
		precedence: 20,
		trustedLocalCode: true,
		defaultEnableMode: "default-on",
		canOverride: ["operator-bundled", "operator-plugin"],
		canBeOverriddenBy: ["operator-managed"]
	},
	"operator-managed": {
		precedence: 30,
		trustedLocalCode: true,
		defaultEnableMode: "default-on",
		canOverride: [
			"operator-bundled",
			"operator-managed",
			"operator-plugin"
		],
		canBeOverriddenBy: ["operator-managed"]
	},
	"operator-workspace": {
		precedence: 40,
		trustedLocalCode: true,
		defaultEnableMode: "explicit-opt-in",
		canOverride: ["operator-workspace"],
		canBeOverriddenBy: ["operator-workspace"]
	}
};
/** Resolve source trust, precedence, default enablement, and override rules. */
function getHookSourcePolicy(source) {
	return HOOK_SOURCE_POLICIES[source];
}
/** Resolve explicit per-hook config by hook key. */
function resolveHookConfig(config, hookKey) {
	const hooks = config?.hooks?.internal?.entries;
	if (!hooks || typeof hooks !== "object") return;
	const entry = hooks[hookKey];
	if (!entry || typeof entry !== "object") return;
	return entry;
}
/** Resolve whether a hook is enabled before runtime requirement checks. */
function resolveHookEnableState(params) {
	const { entry, config } = params;
	const hookKey = require_frontmatter.resolveHookKey(entry.hook.name, entry);
	const hookConfig = params.hookConfig ?? resolveHookConfig(config, hookKey);
	if (entry.hook.source === "operator-plugin") return { enabled: true };
	if (hookConfig?.enabled === false) return {
		enabled: false,
		reason: "disabled in config"
	};
	if (getHookSourcePolicy(entry.hook.source).defaultEnableMode === "explicit-opt-in" && hookConfig?.enabled !== true) return {
		enabled: false,
		reason: "workspace hook (disabled by default)"
	};
	return { enabled: true };
}
function canOverrideHook(candidate, existing) {
	const candidatePolicy = getHookSourcePolicy(candidate.hook.source);
	const existingPolicy = getHookSourcePolicy(existing.hook.source);
	return candidatePolicy.canOverride.includes(existing.hook.source) && existingPolicy.canBeOverriddenBy.includes(candidate.hook.source);
}
/** Merge hook entries by name using source precedence and override policy. */
function resolveHookEntries(entries, opts) {
	const ordered = entries.map((entry, index) => ({
		entry,
		index
	})).toSorted((a, b) => {
		const precedenceDelta = getHookSourcePolicy(a.entry.hook.source).precedence - getHookSourcePolicy(b.entry.hook.source).precedence;
		return precedenceDelta !== 0 ? precedenceDelta : a.index - b.index;
	});
	const merged = /* @__PURE__ */ new Map();
	for (const { entry } of ordered) {
		const existing = merged.get(entry.hook.name);
		if (!existing) {
			merged.set(entry.hook.name, entry);
			continue;
		}
		if (canOverrideHook(entry, existing)) {
			merged.set(entry.hook.name, entry);
			continue;
		}
		opts?.onCollisionIgnored?.({
			name: entry.hook.name,
			kept: existing,
			ignored: entry
		});
	}
	return Array.from(merged.values());
}
//#endregion
//#region src/hooks/config.ts
const DEFAULT_CONFIG_VALUES = {
	"browser.enabled": true,
	"browser.evaluateEnabled": true,
	"workspace.dir": true
};
/** Evaluate a config path with hook-specific defaults for legacy runtime requirements. */
function isHookConfigPathTruthy(config, pathStr) {
	return require_config_eval.isConfigPathTruthyWithDefaults(config, pathStr, DEFAULT_CONFIG_VALUES);
}
function evaluateHookRuntimeEligibility(params) {
	const { entry, config, hookConfig, eligibility } = params;
	const remote = eligibility?.remote;
	return require_config_eval.evaluateRuntimeEligibility({
		os: entry.metadata?.os,
		remotePlatforms: remote?.platforms,
		always: entry.metadata?.always,
		requires: entry.metadata?.requires,
		hasRemoteBin: remote?.hasBin,
		hasAnyRemoteBin: remote?.hasAnyBin,
		hasBin: require_config_eval.hasBinary,
		hasEnv: (envName) => Boolean(process.env[envName] || hookConfig?.env?.[envName]),
		isConfigPathTruthy: (configPath) => isHookConfigPathTruthy(config, configPath)
	});
}
/** Return true when a hook passes enable policy and runtime requirements. */
function shouldIncludeHook(params) {
	const { entry, config, eligibility } = params;
	const hookConfig = resolveHookConfig(config, params.entry.metadata?.hookKey ?? params.entry.hook.name);
	if (!resolveHookEnableState({
		entry,
		config,
		hookConfig
	}).enabled) return false;
	return evaluateHookRuntimeEligibility({
		entry,
		config,
		hookConfig,
		eligibility
	});
}
//#endregion
//#region src/hooks/import-url.ts
/**
* Build an import URL for a hook handler module.
*
* Bundled hooks (shipped in dist/) are immutable between installs, so they
* can be imported without a cache-busting suffix — letting V8 reuse its
* module cache across gateway restarts.
*
* Workspace, managed, and plugin hooks may be edited by the user between
* restarts. For those we append `?t=<mtime>&s=<size>` so the module key
* reflects on-disk changes while staying stable for unchanged files.
*/
/**
* Sources whose handler files never change between `npm install` runs.
* Imports from these sources skip cache busting entirely.
*/
const IMMUTABLE_SOURCES = /* @__PURE__ */ new Set(["operator-bundled"]);
function buildImportUrl(handlerPath, source) {
	const base = (0, node_url.pathToFileURL)(handlerPath).href;
	if (IMMUTABLE_SOURCES.has(source)) return base;
	try {
		const { mtimeMs, size } = node_fs.default.statSync(handlerPath);
		return `${base}?t=${mtimeMs}&s=${size}`;
	} catch {
		return `${base}?t=${Date.now()}`;
	}
}
//#endregion
//#region src/hooks/internal-hook-types.ts
const KNOWN_INTERNAL_HOOK_EVENT_FAMILIES = [
	"command",
	"session",
	"agent",
	"gateway",
	"message"
];
/**
* Event keys emitted by core trigger sites (see docs/automation/hooks.md
* events table — keep both in sync when adding a trigger). Hooks can also
* subscribe to a bare family key to receive every action of that family.
* Plugins can emit additional keys via the deprecated plugin-sdk/hook-runtime
* barrel, so anything outside this set is flagged as a likely typo
* (advisory), not rejected.
*/
const KNOWN_INTERNAL_HOOK_EVENT_KEYS = [
	"agent:bootstrap",
	"command:new",
	"command:reset",
	"command:stop",
	"gateway:pre-restart",
	"gateway:shutdown",
	"gateway:startup",
	"message:preprocessed",
	"message:received",
	"message:sent",
	"message:transcribed",
	"session:compact:after",
	"session:compact:before",
	"session:patch"
];
function isKnownInternalHookEventKey(key) {
	return KNOWN_INTERNAL_HOOK_EVENT_KEYS.includes(key) || KNOWN_INTERNAL_HOOK_EVENT_FAMILIES.includes(key);
}
//#endregion
//#region src/hooks/bundled-dir.ts
function resolveBundledHooksDir() {
	const override = process.env.OPERATOR_BUNDLED_HOOKS_DIR?.trim();
	if (override) return override;
	try {
		const execDir = node_path.default.dirname(process.execPath);
		const sibling = node_path.default.join(execDir, "hooks", "bundled");
		if (node_fs.default.existsSync(sibling)) return sibling;
	} catch {}
	try {
		const moduleDir = node_path.default.dirname((0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href));
		const distBundled = node_path.default.join(moduleDir, "bundled");
		if (node_fs.default.existsSync(distBundled)) return distBundled;
	} catch {}
	try {
		const moduleDir = node_path.default.dirname((0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href));
		const root = node_path.default.resolve(moduleDir, "..", "..");
		const srcBundled = node_path.default.join(root, "src", "hooks", "bundled");
		if (node_fs.default.existsSync(srcBundled)) return srcBundled;
	} catch {}
}
//#endregion
//#region src/hooks/plugin-hooks.ts
const log$2 = require_subsystem.createSubsystemLogger("hooks");
/** Resolve hook directories declared by active plugin manifests. */
function resolvePluginHookDirs(params) {
	const workspaceDir = (params.workspaceDir ?? "").trim();
	if (!workspaceDir) return [];
	const metadataSnapshot = require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		workspaceDir,
		config: params.config ?? {},
		env: process.env
	});
	const registry = metadataSnapshot.manifestRegistry;
	if (registry.plugins.length === 0) return [];
	const normalizedPlugins = require_manifest_registry.normalizePluginsConfigWithResolver(params.config?.plugins, metadataSnapshot.normalizePluginId);
	const memorySlot = normalizedPlugins.slots.memory;
	let selectedMemoryPluginId = null;
	const seen = /* @__PURE__ */ new Set();
	const resolved = [];
	for (const record of registry.plugins) {
		if (!record.hooks || record.hooks.length === 0) continue;
		if (!require_manifest_registry.resolveEffectivePluginActivationState({
			id: record.id,
			origin: record.origin,
			config: normalizedPlugins,
			rootConfig: params.config
		}).activated) continue;
		const memoryDecision = require_manifest_registry.resolveMemorySlotDecision({
			id: record.id,
			kind: record.kind,
			slot: memorySlot,
			selectedId: selectedMemoryPluginId
		});
		if (!memoryDecision.enabled) continue;
		if (memoryDecision.selected && require_config_activation_shared.hasKind(record.kind, "memory")) selectedMemoryPluginId = record.id;
		for (const raw of record.hooks) {
			const trimmed = raw.trim();
			if (!trimmed) continue;
			const candidate = node_path.default.resolve(record.rootDir, trimmed);
			if (!node_fs.default.existsSync(candidate)) {
				log$2.warn(`plugin hook path not found (${record.id}): ${candidate}`);
				continue;
			}
			if (!(0, _openclaw_fs_safe_path.isPathInsideWithRealpath)(record.rootDir, candidate, { requireRealpath: true })) {
				log$2.warn(`plugin hook path escapes plugin root (${record.id}): ${candidate}`);
				continue;
			}
			if (seen.has(candidate)) continue;
			seen.add(candidate);
			resolved.push({
				dir: candidate,
				pluginId: record.id
			});
		}
	}
	return resolved;
}
//#endregion
//#region src/hooks/workspace.ts
const log$1 = require_subsystem.createSubsystemLogger("hooks/workspace");
function readHookPackageManifest(dir) {
	const raw = readRootFileUtf8({
		absolutePath: node_path.default.join(dir, "package.json"),
		rootPath: dir,
		boundaryLabel: "hook package directory"
	});
	if (raw === null) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function resolvePackageHooks(manifest) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(manifest[require_legacy_names.MANIFEST_KEY]?.hooks);
}
function resolveContainedDir(baseDir, targetDir) {
	const base = node_path.default.resolve(baseDir);
	const resolved = node_path.default.resolve(baseDir, targetDir);
	if (!(0, _openclaw_fs_safe_path.isPathInsideWithRealpath)(base, resolved, { requireRealpath: true })) return null;
	return resolved;
}
function loadHookFromDir(params) {
	const hookMdPath = node_path.default.join(params.hookDir, "HOOK.md");
	const content = readRootFileUtf8({
		absolutePath: hookMdPath,
		rootPath: params.hookDir,
		boundaryLabel: "hook directory"
	});
	if (content === null) return null;
	try {
		const frontmatter = require_frontmatter.parseFrontmatter(content);
		const name = frontmatter.name || params.nameHint || node_path.default.basename(params.hookDir);
		const description = frontmatter.description || "";
		const handlerCandidates = [
			"handler.ts",
			"handler.js",
			"index.ts",
			"index.js"
		];
		let handlerPath;
		for (const candidate of handlerCandidates) {
			const safeCandidatePath = resolveRootFilePath({
				absolutePath: node_path.default.join(params.hookDir, candidate),
				rootPath: params.hookDir,
				boundaryLabel: "hook directory"
			});
			if (safeCandidatePath) {
				handlerPath = safeCandidatePath;
				break;
			}
		}
		if (!handlerPath) {
			log$1.warn(`Hook "${name}" has HOOK.md but no handler file in ${params.hookDir}`);
			return null;
		}
		let baseDir = params.hookDir;
		try {
			baseDir = node_fs.default.realpathSync.native(params.hookDir);
		} catch {}
		return {
			hook: {
				name,
				description,
				source: params.source,
				pluginId: params.pluginId,
				filePath: hookMdPath,
				baseDir,
				handlerPath
			},
			frontmatter
		};
	} catch (err) {
		const message = err instanceof Error ? err.stack ?? err.message : String(err);
		log$1.warn(`Failed to load hook from ${params.hookDir}: ${message}`);
		return null;
	}
}
/**
* Scan a directory for hooks (subdirectories containing HOOK.md)
*/
function loadHooksFromDir(params) {
	const { dir, source, pluginId } = params;
	if (!node_fs.default.existsSync(dir)) return [];
	if (!node_fs.default.statSync(dir).isDirectory()) return [];
	const hooks = [];
	const entries = node_fs.default.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const hookDir = node_path.default.join(dir, entry.name);
		const manifest = readHookPackageManifest(hookDir);
		const packageHooks = manifest ? resolvePackageHooks(manifest) : [];
		if (packageHooks.length > 0) {
			for (const hookPath of packageHooks) {
				const resolvedHookDir = resolveContainedDir(hookDir, hookPath);
				if (!resolvedHookDir) {
					log$1.warn(`Ignoring out-of-package hook path "${hookPath}" in ${hookDir} (must be within package directory)`);
					continue;
				}
				const hook = loadHookFromDir({
					hookDir: resolvedHookDir,
					source,
					pluginId,
					nameHint: node_path.default.basename(resolvedHookDir)
				});
				if (hook) hooks.push(hook);
			}
			continue;
		}
		const hook = loadHookFromDir({
			hookDir,
			source,
			pluginId,
			nameHint: entry.name
		});
		if (hook) hooks.push(hook);
	}
	return hooks;
}
function loadHookEntriesFromDir(params) {
	return loadHooksFromDir({
		dir: params.dir,
		source: params.source,
		pluginId: params.pluginId
	}).map(({ hook, frontmatter }) => {
		return {
			hook: {
				...hook,
				source: params.source,
				pluginId: params.pluginId
			},
			frontmatter,
			metadata: require_frontmatter.resolveOperatorMetadata(frontmatter),
			invocation: require_frontmatter.resolveHookInvocationPolicy(frontmatter)
		};
	});
}
function discoverWorkspaceHookEntries(workspaceDir, opts) {
	const managedHooksDir = opts?.managedHooksDir ?? node_path.default.join(require_utils.CONFIG_DIR, "hooks");
	const workspaceHooksDir = node_path.default.join(workspaceDir, "hooks");
	const bundledHooksDir = opts?.bundledHooksDir ?? resolveBundledHooksDir();
	const extraDirs = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(opts?.config?.hooks?.internal?.load?.extraDirs ?? []);
	const pluginHookDirs = resolvePluginHookDirs({
		workspaceDir,
		config: opts?.config
	});
	const bundledHooks = bundledHooksDir ? loadHookEntriesFromDir({
		dir: bundledHooksDir,
		source: "operator-bundled"
	}) : [];
	const extraHooks = extraDirs.flatMap((dir) => {
		return loadHookEntriesFromDir({
			dir: require_home_dir.resolveUserPath(dir),
			source: "operator-managed"
		});
	});
	const pluginHooks = pluginHookDirs.flatMap(({ dir, pluginId }) => loadHookEntriesFromDir({
		dir,
		source: "operator-plugin",
		pluginId
	}));
	const managedHooks = loadHookEntriesFromDir({
		dir: managedHooksDir,
		source: "operator-managed"
	});
	const workspaceHooks = loadHookEntriesFromDir({
		dir: workspaceHooksDir,
		source: "operator-workspace"
	});
	return [
		...extraHooks,
		...bundledHooks,
		...pluginHooks,
		...managedHooks,
		...workspaceHooks
	];
}
function loadWorkspaceHookEntries(workspaceDir, opts) {
	return resolveHookEntries(opts?.entries ?? discoverWorkspaceHookEntries(workspaceDir, opts), { onCollisionIgnored: ({ name, kept, ignored }) => {
		log$1.warn(`Ignoring ${ignored.hook.source} hook "${name}" because it cannot override ${kept.hook.source} hook code`);
	} });
}
function readRootFileUtf8(params) {
	return withOpenedRootFileSync(params, (opened) => {
		try {
			return node_fs.default.readFileSync(opened.fd, "utf-8");
		} catch {
			return null;
		}
	});
}
function withOpenedRootFileSync(params, read) {
	const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
		absolutePath: params.absolutePath,
		rootPath: params.rootPath,
		boundaryLabel: params.boundaryLabel
	});
	if (!opened.ok) return null;
	try {
		return read({
			fd: opened.fd,
			path: opened.path
		});
	} finally {
		node_fs.default.closeSync(opened.fd);
	}
}
function resolveRootFilePath(params) {
	return withOpenedRootFileSync(params, (opened) => opened.path);
}
//#endregion
//#region src/hooks/loader.ts
/**
* Dynamic loader for hook handlers
*
* Loads hook handlers from external modules based on configuration
* and from directory-based discovery (bundled, managed, workspace)
*/
const log = require_subsystem.createSubsystemLogger("hooks:loader");
const loadedHookRegistrations = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.loadedInternalHookRegistrations"), () => []);
function safeLogValue(value) {
	return require_ansi.sanitizeForLog(value);
}
function isNonEmptyRelativePathInsideRoot(relativePath) {
	return relativePath !== "" && relativePath !== ".." && !relativePath.startsWith(`..${node_path.default.sep}`) && !node_path.default.isAbsolute(relativePath);
}
function maybeWarnTrustedHookSource(source) {
	if (source === "operator-workspace") {
		log.warn("Loading workspace hook code into the gateway process. Workspace hooks are trusted local code.");
		return;
	}
	if (source === "operator-managed") log.warn("Loading managed hook code into the gateway process. Managed hooks are trusted local code.");
}
function resetLoadedInternalHooks() {
	while (loadedHookRegistrations.length > 0) {
		const registration = loadedHookRegistrations.pop();
		if (!registration) continue;
		require_internal_hooks.unregisterInternalHook(registration.event, registration.handler);
	}
}
/**
* Load and register all hook handlers
*
* Loads hooks from both:
* 1. Directory-based discovery (bundled, managed, workspace)
* 2. Legacy config handlers (backwards compatibility)
*
* @param cfg - Operator configuration
* @param workspaceDir - Workspace directory for hook discovery
* @returns Number of handlers successfully loaded
*
* @example
* ```ts
* const config = await getRuntimeConfig();
* const workspaceDir = resolveAgentWorkspaceDir(config, agentId);
* const count = await loadInternalHooks(config, workspaceDir);
* console.log(`Loaded ${count} hook handlers`);
* ```
*/
async function loadInternalHooks(cfg, workspaceDir, opts) {
	resetLoadedInternalHooks();
	if (!require_configured.hasConfiguredInternalHooks(cfg)) return 0;
	let loadedCount = 0;
	const configuredNames = require_configured.resolveConfiguredInternalHookNames(cfg);
	try {
		const eligible = loadWorkspaceHookEntries(workspaceDir, {
			config: cfg,
			managedHooksDir: opts?.managedHooksDir,
			bundledHooksDir: opts?.bundledHooksDir
		}).filter((entry) => {
			if (configuredNames && !configuredNames.has(entry.hook.name)) return false;
			return shouldIncludeHook({
				entry,
				config: cfg
			});
		});
		for (const entry of eligible) try {
			const hookBaseDir = resolveExistingRealpath(entry.hook.baseDir);
			if (!hookBaseDir) {
				log.error(`Hook '${safeLogValue(entry.hook.name)}' base directory is no longer readable: ${safeLogValue(entry.hook.baseDir)}`);
				continue;
			}
			const opened = await (0, _openclaw_fs_safe_advanced.openRootFile)({
				absolutePath: entry.hook.handlerPath,
				rootPath: hookBaseDir,
				boundaryLabel: "hook directory"
			});
			if (!opened.ok) {
				log.error(`Hook '${safeLogValue(entry.hook.name)}' handler path fails boundary checks: ${safeLogValue(entry.hook.handlerPath)}`);
				continue;
			}
			const safeHandlerPath = opened.path;
			node_fs.default.closeSync(opened.fd);
			maybeWarnTrustedHookSource(entry.hook.source);
			const mod = await import(buildImportUrl(safeHandlerPath, entry.hook.source));
			const exportName = entry.metadata?.export ?? "default";
			const handler = require_module_loader.resolveFunctionModuleExport({
				mod,
				exportName
			});
			if (!handler) {
				log.error(`Handler '${safeLogValue(exportName)}' from ${safeLogValue(entry.hook.name)} is not a function`);
				continue;
			}
			const events = entry.metadata?.events ?? [];
			if (events.length === 0) {
				log.warn(`Hook '${safeLogValue(entry.hook.name)}' has no events defined in metadata`);
				continue;
			}
			const unknownEvents = events.filter((event) => !isKnownInternalHookEventKey(event));
			if (unknownEvents.length > 0) log.warn(`Hook '${safeLogValue(entry.hook.name)}' subscribes to event${unknownEvents.length === 1 ? "" : "s"} ${unknownEvents.map((event) => safeLogValue(event)).join(", ")} not emitted by Operator core — likely a typo; unless a plugin emits it, the hook never fires. Known events: https://docs.operator.ai/automation/hooks`);
			for (const event of events) {
				require_internal_hooks.registerInternalHook(event, handler);
				loadedHookRegistrations.push({
					event,
					handler
				});
			}
			log.debug(`Registered hook: ${safeLogValue(entry.hook.name)} -> ${events.map((event) => safeLogValue(event)).join(", ")}${exportName !== "default" ? ` (export: ${safeLogValue(exportName)})` : ""}`);
			loadedCount++;
		} catch (err) {
			log.error(`Failed to load hook ${safeLogValue(entry.hook.name)}: ${safeLogValue(require_errors.formatErrorMessage(err))}`);
		}
	} catch (err) {
		log.error(`Failed to load directory-based hooks: ${safeLogValue(require_errors.formatErrorMessage(err))}`);
	}
	const handlers = require_configured.getLegacyInternalHookHandlers(cfg);
	for (const handlerConfig of handlers) try {
		const rawModule = handlerConfig.module.trim();
		if (!rawModule) {
			log.error("Handler module path is empty");
			continue;
		}
		if (node_path.default.isAbsolute(rawModule)) {
			log.error(`Handler module path must be workspace-relative (got absolute path): ${safeLogValue(rawModule)}`);
			continue;
		}
		const baseDir = node_path.default.resolve(workspaceDir);
		const modulePath = node_path.default.resolve(baseDir, rawModule);
		const baseDirReal = resolveExistingRealpath(baseDir);
		if (!baseDirReal) {
			log.error(`Workspace directory is no longer readable while loading hooks: ${safeLogValue(baseDir)}`);
			continue;
		}
		const modulePathSafe = resolveExistingRealpath(modulePath);
		if (!modulePathSafe) {
			log.error(`Handler module path could not be resolved with realpath: ${safeLogValue(rawModule)}`);
			continue;
		}
		if (!isNonEmptyRelativePathInsideRoot(node_path.default.relative(baseDirReal, modulePathSafe))) {
			log.error(`Handler module path must stay within workspaceDir: ${safeLogValue(rawModule)}`);
			continue;
		}
		const opened = await (0, _openclaw_fs_safe_advanced.openRootFile)({
			absolutePath: modulePathSafe,
			rootPath: baseDirReal,
			boundaryLabel: "workspace directory"
		});
		if (!opened.ok) {
			log.error(`Handler module path fails boundary checks under workspaceDir: ${safeLogValue(rawModule)}`);
			continue;
		}
		const safeModulePath = opened.path;
		node_fs.default.closeSync(opened.fd);
		log.warn(`Loading legacy internal hook module from workspace path ${safeLogValue(rawModule)}. Legacy hook modules are trusted local code.`);
		const mod = await import(buildImportUrl(safeModulePath, "operator-workspace"));
		const exportName = handlerConfig.export ?? "default";
		const handler = require_module_loader.resolveFunctionModuleExport({
			mod,
			exportName
		});
		if (!handler) {
			log.error(`Handler '${safeLogValue(exportName)}' from ${safeLogValue(modulePath)} is not a function`);
			continue;
		}
		if (!isKnownInternalHookEventKey(handlerConfig.event)) log.warn(`Legacy hook handler ${safeLogValue(rawModule)} subscribes to event ${safeLogValue(handlerConfig.event)} not emitted by Operator core — likely a typo; unless a plugin emits it, the hook never fires. Known events: https://docs.operator.ai/automation/hooks`);
		require_internal_hooks.registerInternalHook(handlerConfig.event, handler);
		loadedHookRegistrations.push({
			event: handlerConfig.event,
			handler
		});
		log.debug(`Registered hook (legacy): ${safeLogValue(handlerConfig.event)} -> ${safeLogValue(modulePath)}${exportName !== "default" ? `#${safeLogValue(exportName)}` : ""}`);
		loadedCount++;
	} catch (err) {
		log.error(`Failed to load hook handler from ${safeLogValue(handlerConfig.module)}: ${safeLogValue(require_errors.formatErrorMessage(err))}`);
	}
	return loadedCount;
}
function resolveExistingRealpath(value) {
	try {
		return node_fs.default.realpathSync(value);
	} catch {
		return null;
	}
}
//#endregion
exports.loadInternalHooks = loadInternalHooks;
