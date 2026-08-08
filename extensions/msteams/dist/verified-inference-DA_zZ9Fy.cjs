const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
require("./path-safety-m1VY3jod.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_manifest_owner_policy = require("./manifest-owner-policy-BI1K0z-h.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_providers = require("./providers-MmlTBfO9.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
const require_execution_auth_binding = require("./execution-auth-binding-DbwshiTD.cjs");
const require_cli_auth_epoch = require("./cli-auth-epoch-BktnfdBu.cjs");
const require_runtime_plugin = require("./runtime-plugin-9QTLb6UB.cjs");
const require_inference_route = require("./inference-route-2IwhuIcI.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let node_util = require("node:util");
let _openclaw_fs_safe_walk = require("@openclaw/fs-safe/walk");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/plugin-runtime-artifact-identity.ts
/** Computes a bounded content identity for plugin-owned runtime artifacts. */
const MAX_RUNTIME_ARTIFACT_DEPTH = 64;
const MAX_RUNTIME_ARTIFACT_ENTRIES = 5e4;
const MAX_RUNTIME_ARTIFACT_FILE_BYTES = 256 * 1024 * 1024;
const MAX_RUNTIME_ARTIFACT_TOTAL_BYTES = 512 * 1024 * 1024;
const READ_CHUNK_BYTES = 64 * 1024;
const EXCLUDED_RUNTIME_ARTIFACT_DIRECTORIES = /* @__PURE__ */ new Set([
	".git",
	".hg",
	".svn",
	"node_modules"
]);
function normalizeRelativePath(filePath) {
	return filePath.split(node_path.default.sep).join("/");
}
function listRuntimeArtifactFiles(rootDir) {
	const scan = (0, _openclaw_fs_safe_walk.walkDirectorySync)(rootDir, {
		maxDepth: MAX_RUNTIME_ARTIFACT_DEPTH,
		maxEntries: MAX_RUNTIME_ARTIFACT_ENTRIES,
		symlinks: "include",
		descend: (entry) => !EXCLUDED_RUNTIME_ARTIFACT_DIRECTORIES.has(entry.name),
		include: (entry) => entry.kind !== "directory" && !EXCLUDED_RUNTIME_ARTIFACT_DIRECTORIES.has(entry.name)
	});
	if (scan.truncated) throw new Error("plugin runtime artifact exceeds the bounded file scan");
	if ((scan.failedDirs?.length ?? 0) > 0) throw new Error("plugin runtime artifact contains an unreadable directory");
	return scan.entries.map((entry) => {
		if (entry.kind !== "file") throw new Error(`plugin runtime artifact contains unsupported ${entry.kind} entry`);
		return normalizeRelativePath(entry.relativePath);
	}).toSorted();
}
function sameOpenedFile(before, after) {
	return before.dev === after.dev && before.ino === after.ino && before.size === after.size && before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs;
}
function hashRuntimeArtifactFile(params) {
	const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
		absolutePath: node_path.default.join(params.rootDir, params.relativePath),
		rootPath: params.rootDir,
		rootRealPath: params.rootRealPath,
		boundaryLabel: "plugin runtime artifact",
		maxBytes: MAX_RUNTIME_ARTIFACT_FILE_BYTES,
		rejectHardlinks: false
	});
	if (!opened.ok) throw new Error(`plugin runtime artifact file is not readable: ${params.relativePath}`);
	try {
		const hash = node_crypto.default.createHash("sha256");
		const buffer = Buffer.allocUnsafe(READ_CHUNK_BYTES);
		let offset = 0;
		while (offset < opened.stat.size) {
			const read = node_fs.default.readSync(opened.fd, buffer, 0, Math.min(buffer.length, opened.stat.size - offset), offset);
			if (read === 0) throw new Error(`plugin runtime artifact file changed while reading: ${params.relativePath}`);
			hash.update(buffer.subarray(0, read));
			offset += read;
		}
		const after = node_fs.default.fstatSync(opened.fd);
		if (!sameOpenedFile(opened.stat, after)) throw new Error(`plugin runtime artifact file changed while reading: ${params.relativePath}`);
		return {
			hash: hash.digest("hex"),
			size: opened.stat.size,
			mode: opened.stat.mode
		};
	} finally {
		node_fs.default.closeSync(opened.fd);
	}
}
/**
* Hashes plugin-owned files only. Dependency stores and VCS metadata are
* separate runtime owners; plugin installs/updates must replace this digest.
*/
function fingerprintPluginRuntimeArtifact(record) {
	const runtimeArtifact = record.source ? require_loader.resolvePluginRuntimeArtifact({
		pluginId: record.pluginId,
		entryKind: "runtime",
		source: record.source,
		rootDir: record.rootDir,
		origin: record.origin,
		preferBuiltPluginArtifacts: true,
		...record.packageBuild ? { packageManifest: { build: record.packageBuild } } : {}
	}) : {
		rootDir: record.rootDir,
		source: void 0
	};
	const rootRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(node_path.default.resolve(runtimeArtifact.rootDir));
	if (!rootRealPath) throw new Error(`plugin runtime root is unavailable: ${record.pluginId}`);
	const source = runtimeArtifact.source ? node_path.default.isAbsolute(runtimeArtifact.source) ? runtimeArtifact.source : node_path.default.resolve(rootRealPath, runtimeArtifact.source) : null;
	const sourceRelativePath = source ? node_path.default.relative(rootRealPath, (0, _openclaw_fs_safe_path.safeRealpathSync)(source) ?? source) : null;
	if (sourceRelativePath !== null && (sourceRelativePath === ".." || sourceRelativePath.startsWith(`..${node_path.default.sep}`) || node_path.default.isAbsolute(sourceRelativePath))) throw new Error(`plugin runtime entry escapes its root: ${record.pluginId}`);
	const beforeFiles = listRuntimeArtifactFiles(rootRealPath);
	if (sourceRelativePath !== null && !beforeFiles.includes(normalizeRelativePath(sourceRelativePath))) throw new Error(`plugin runtime entry is unavailable: ${record.pluginId}`);
	const hash = node_crypto.default.createHash("sha256");
	hash.update("operator-plugin-runtime-artifact-v1\0");
	hash.update(sourceRelativePath ? normalizeRelativePath(sourceRelativePath) : "<no-source>");
	hash.update("\0");
	let totalBytes = 0;
	for (const relativePath of beforeFiles) {
		const file = hashRuntimeArtifactFile({
			rootDir: rootRealPath,
			rootRealPath,
			relativePath
		});
		totalBytes += file.size;
		if (totalBytes > MAX_RUNTIME_ARTIFACT_TOTAL_BYTES) throw new Error("plugin runtime artifact exceeds the bounded content scan");
		hash.update(relativePath);
		hash.update("\0");
		hash.update(String(file.mode));
		hash.update("\0");
		hash.update(String(file.size));
		hash.update("\0");
		hash.update(file.hash);
		hash.update("\0");
	}
	const afterFiles = listRuntimeArtifactFiles(rootRealPath);
	if (beforeFiles.length !== afterFiles.length || beforeFiles.some((file, i) => file !== afterFiles[i])) throw new Error("plugin runtime artifact changed while reading");
	return hash.digest("hex");
}
//#endregion
//#region src/system-agent/verified-inference.ts
/** Exact child harness artifact every verified embedded Operator call must carry. */
function resolveSystemAgentExpectedAgentHarnessRuntimeArtifact(binding) {
	if (binding.execution.runner !== "embedded" || binding.execution.agentHarnessRuntimeOverride === "@gabrielvfonseca/operator") return;
	const harnessId = binding.execution.agentHarnessRuntimeOverride;
	const artifactId = binding.auth.runtimeArtifactId?.trim();
	const fingerprint = binding.auth.runtimeArtifactFingerprint;
	if (binding.auth.agentHarnessId !== harnessId || !artifactId || !fingerprint) throw new Error("The verified inference harness artifact is incomplete.");
	return {
		harnessId,
		artifact: {
			id: artifactId,
			fingerprint
		}
	};
}
async function validateAgentHarnessRuntimeArtifact(params) {
	try {
		if (params.deps.validateAgentHarnessRuntimeArtifact) return await params.deps.validateAgentHarnessRuntimeArtifact({
			harnessId: params.harnessId,
			artifact: params.artifact
		});
		return await (require_registry.getRegisteredAgentHarness(params.harnessId)?.harness)?.runtimeArtifact?.validate(params.artifact) === true;
	} catch {
		return false;
	}
}
async function resolveAgentHarnessAuthBindingFingerprint(params) {
	const input = {
		harnessId: params.harnessId,
		authProfileId: params.authProfileId,
		authProfileStore: params.authProfileStore,
		agentDir: params.agentDir,
		config: params.config
	};
	if (params.deps.resolveAgentHarnessAuthBindingFingerprint) return params.deps.resolveAgentHarnessAuthBindingFingerprint(input);
	return require_registry.getRegisteredAgentHarness(params.harnessId)?.harness.authBinding?.fingerprint(input);
}
function systemAgentRouteIdentity(route) {
	const { runConfig: _runConfig, authProfileId: _authProfileId, ...identity } = route;
	return identity;
}
async function resolveCurrentRuntimeOwnerFingerprint(params) {
	if (params.route.runner === "cli") {
		if (params.kind !== "cli-runtime") return;
		return (params.deps.resolveCliRuntimeOwnerFingerprint ?? require_cli_auth_epoch.resolveCliRuntimeOwnerFingerprint)({
			provider: params.route.provider,
			config: params.route.runConfig,
			agentDir: params.route.agentDir,
			agentId: "@gabrielvfonseca/operator",
			runtimeOwnerId: params.runtimeOwnerId,
			...params.authProfileId ? { authProfileId: params.authProfileId } : {},
			...params.skipLocalCredential ? { skipLocalCredential: true } : {},
			...params.runtimeArtifactFingerprint ? { runtimeArtifactFingerprint: params.runtimeArtifactFingerprint } : {}
		});
	}
	let authProfileOwnerFingerprint;
	if (params.authProfileId) {
		const store = (params.deps.ensureAuthProfileStore ?? require_store.ensureAuthProfileStore)(params.route.agentDir, {
			readOnly: true,
			allowKeychainPrompt: false,
			config: params.route.runConfig,
			externalCliProviderIds: [params.route.provider]
		});
		authProfileOwnerFingerprint = require_execution_auth_binding.fingerprintAuthProfileOwnerShape({
			profileId: params.authProfileId,
			credential: store.profiles[params.authProfileId]
		});
		if (!authProfileOwnerFingerprint) return;
	}
	if (params.kind === "plugin-harness") {
		if (params.route.agentHarnessRuntimeOverride === "@gabrielvfonseca/operator") return;
		return require_execution_auth_binding.fingerprintOpaqueRuntimeOwner({
			kind: "plugin-harness",
			runner: "embedded",
			provider: params.route.provider,
			backendId: params.route.agentHarnessRuntimeOverride,
			...params.runtimeArtifactFingerprint ? { runtimeArtifactFingerprint: params.runtimeArtifactFingerprint } : {},
			...params.authProfileId ? { authProfileId: params.authProfileId } : {},
			...authProfileOwnerFingerprint ? { authProfileOwnerFingerprint } : {}
		});
	}
	if (params.kind !== "aws-sdk") return;
	const auth = await (params.deps.resolveApiKeyForProvider ?? require_model_auth.resolveApiKeyForProvider)({
		provider: params.route.provider,
		cfg: params.route.runConfig,
		agentDir: params.route.agentDir,
		workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(params.route.runConfig, params.route.agentId, process.env),
		...params.authProfileId ? {
			profileId: params.authProfileId,
			lockedProfile: true
		} : {},
		secretSentinels: true
	});
	if (params.authProfileId && auth.profileId !== params.authProfileId) return;
	return require_execution_auth_binding.fingerprintAwsSdkRuntimeOwner({
		provider: params.route.provider,
		backendId: params.route.agentHarnessRuntimeOverride,
		auth
	});
}
function projectRelevantPlugins(config, route, ownerPluginIds) {
	if (!route || ownerPluginIds.length === 0) return;
	const normalizedPlugins = require_config_state.normalizePluginsConfig(config.plugins);
	return Object.fromEntries(ownerPluginIds.map((id) => [id, {
		active: require_manifest_owner_policy.passesManifestOwnerBasePolicy({
			plugin: { id },
			normalizedConfig: normalizedPlugins
		}),
		entry: normalizedPlugins.entries[id]
	}]));
}
function projectOwnerPluginRuntime(record) {
	return {
		pluginId: record.pluginId,
		origin: record.origin,
		rootDir: record.rootDir,
		manifestPath: record.manifestPath,
		manifestHash: record.manifestHash,
		source: record.source ?? null,
		packageName: record.packageName ?? null,
		packageVersion: record.packageVersion ?? null,
		installRecordHash: record.installRecordHash ?? null,
		packageJson: record.packageJson ? {
			path: record.packageJson.path,
			hash: record.packageJson.hash
		} : null
	};
}
function projectOwnerPluginRuntimes(params) {
	if (params.ownerPluginIds.length === 0) return [];
	const loadRegistry = params.deps.loadPluginRegistrySnapshot ?? require_plugin_registry.loadPluginRegistrySnapshot;
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.config, params.route.agentId, process.env);
	const registry = loadRegistry({
		config: params.config,
		workspaceDir,
		env: process.env
	});
	const recordsById = new Map(registry.plugins.map((record) => [record.pluginId, record]));
	return params.ownerPluginIds.map((pluginId) => {
		const record = recordsById.get(pluginId);
		if (!record) throw new Error(`The inference owner plugin ${pluginId} is not installed.`);
		return projectOwnerPluginRuntime(record);
	});
}
function projectOwnerPluginArtifacts(params) {
	if (params.ownerPluginIds.length === 0) return [];
	const loadRegistry = params.deps.loadPluginRegistrySnapshot ?? require_plugin_registry.loadPluginRegistrySnapshot;
	const fingerprintArtifact = params.deps.fingerprintPluginRuntimeArtifact ?? fingerprintPluginRuntimeArtifact;
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.config, params.route.agentId, process.env);
	const registry = loadRegistry({
		config: params.config,
		workspaceDir,
		env: process.env
	});
	const recordsById = new Map(registry.plugins.map((record) => [record.pluginId, record]));
	return params.ownerPluginIds.map((pluginId) => {
		const record = recordsById.get(pluginId);
		if (!record) throw new Error(`The inference owner plugin ${pluginId} is not installed.`);
		return {
			pluginId,
			fingerprint: fingerprintArtifact({
				pluginId,
				origin: record.origin,
				rootDir: record.rootDir,
				...record.source ? { source: record.source } : {},
				...record.packageBuild ? { packageBuild: record.packageBuild } : {}
			})
		};
	});
}
async function projectVerifiedExecutionFingerprint(config, route, ownerPluginIds, deps) {
	const projection = await require_inference_route.projectInferenceRoute(config, route.agentId);
	return {
		route: projection.route ? (() => {
			const { authProfileId: _authProfileId, ...routeWithoutAuthProfile } = projection.route;
			return routeWithoutAuthProfile;
		})() : null,
		defaultSelection: projection.defaultSelection,
		auth: projection.auth,
		models: projection.models,
		defaults: projection.defaults,
		...projection.agent === void 0 ? {} : { agent: projection.agent },
		plugins: projectRelevantPlugins(config, projection.route, ownerPluginIds),
		ownerPluginRuntimes: projectOwnerPluginRuntimes({
			config,
			route,
			ownerPluginIds,
			deps
		})
	};
}
function resolveRouteHarnessOwnerPluginIds(config, route) {
	if (route.runner !== "embedded" || route.agentHarnessRuntimeOverride === "@gabrielvfonseca/operator") return [];
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(config, route.agentId, process.env);
	return require_runtime_plugin.resolveAgentHarnessOwnerPluginIds({
		runtime: route.agentHarnessRuntimeOverride,
		provider: route.provider,
		config,
		workspaceDir
	});
}
function resolveRouteOwnerPluginIds(config, route) {
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(config, route.agentId, process.env);
	return [
		...require_providers.resolveOwningPluginIdsForModelRefs({
			models: [route.modelLabel],
			config,
			workspaceDir,
			env: process.env
		}),
		...require_providers.resolveOwningPluginIdsForProviderRef({
			provider: route.provider,
			config,
			workspaceDir,
			env: process.env
		}) ?? [],
		...resolveRouteHarnessOwnerPluginIds(config, route)
	].filter((id, index, ids) => ids.indexOf(id) === index).toSorted();
}
/** Capture once immediately before a live setup turn. */
function captureSystemAgentOwnerPluginArtifacts(params) {
	const deps = params.deps ?? {};
	const ownerPluginIds = resolveRouteOwnerPluginIds(params.config, params.executionRoute);
	return {
		ownerPluginIds,
		ownerPluginArtifacts: projectOwnerPluginArtifacts({
			config: params.config,
			route: params.executionRoute,
			ownerPluginIds,
			deps
		})
	};
}
async function resolveCurrentAuthFingerprint(params) {
	if (params.route.runner === "cli") {
		const resolveBinding = params.deps.resolveCliAuthBindingFingerprint ?? require_cli_auth_epoch.resolveCliAuthBindingFingerprint;
		let resolvedAuth;
		if (params.authProfileId) {
			const authCredential = (params.deps.ensureAuthProfileStore ?? require_store.ensureAuthProfileStore)(params.route.agentDir, {
				readOnly: true,
				allowKeychainPrompt: false,
				config: params.route.runConfig,
				externalCliProviderIds: [params.route.provider]
			}).profiles[params.authProfileId];
			if (authCredential?.type === "api_key" && !authCredential.key || authCredential?.type === "token" && !authCredential.token) {
				resolvedAuth = await (params.deps.resolveApiKeyForProvider ?? require_model_auth.resolveApiKeyForProvider)({
					provider: params.route.provider,
					cfg: params.route.runConfig,
					agentDir: params.route.agentDir,
					workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(params.route.runConfig, params.route.agentId, process.env),
					profileId: params.authProfileId,
					lockedProfile: true,
					secretSentinels: false
				});
				if (resolvedAuth.profileId !== params.authProfileId || !resolvedAuth.apiKey || !authCredential) return;
			}
		}
		return resolveBinding({
			provider: params.route.provider,
			config: params.route.runConfig,
			agentDir: params.route.agentDir,
			...params.authProfileId ? { authProfileId: params.authProfileId } : {},
			...resolvedAuth ? { resolvedAuth } : {},
			...params.skipLocalCredential ? { skipLocalCredential: true } : {}
		});
	}
	if (params.authProfileId) {
		const store = (params.deps.ensureAuthProfileStore ?? require_store.ensureAuthProfileStore)(params.route.agentDir, {
			readOnly: true,
			allowKeychainPrompt: false,
			config: params.route.runConfig,
			externalCliProviderIds: [params.route.provider]
		});
		const credential = store.profiles[params.authProfileId];
		if (!credential) return;
		if (credential.type === "oauth" || params.route.runner === "embedded" && params.route.agentHarnessRuntimeOverride !== "@gabrielvfonseca/operator") {
			if (credential.type === "oauth") return require_execution_auth_binding.fingerprintAuthProfileCredential({
				profileId: params.authProfileId,
				credential
			});
			const harnessId = params.route.agentHarnessRuntimeOverride;
			if ((require_registry.getRegisteredAgentHarness(harnessId)?.harness)?.authBootstrap === "harness") return resolveAgentHarnessAuthBindingFingerprint({
				harnessId,
				authProfileId: params.authProfileId,
				authProfileStore: store,
				agentDir: params.route.agentDir,
				config: params.route.runConfig,
				deps: params.deps
			});
			const auth = await (params.deps.resolveApiKeyForProvider ?? require_model_auth.resolveApiKeyForProvider)({
				provider: params.route.provider,
				cfg: params.route.runConfig,
				agentDir: params.route.agentDir,
				workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(params.route.runConfig, params.route.agentId, process.env),
				profileId: params.authProfileId,
				lockedProfile: true,
				secretSentinels: false
			});
			if (auth.profileId !== params.authProfileId || !auth.apiKey) return;
			return require_execution_auth_binding.fingerprintResolvedAuthProfileCredential({
				profileId: params.authProfileId,
				credential,
				resolvedAuth: auth
			});
		}
	}
	const auth = await (params.deps.resolveApiKeyForProvider ?? require_model_auth.resolveApiKeyForProvider)({
		provider: params.route.provider,
		cfg: params.route.runConfig,
		agentDir: params.route.agentDir,
		workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(params.route.runConfig, params.route.agentId, process.env),
		...params.authProfileId ? {
			profileId: params.authProfileId,
			lockedProfile: true
		} : {},
		secretSentinels: true
	});
	if (params.authProfileId && auth.profileId !== params.authProfileId) return;
	return require_execution_auth_binding.fingerprintResolvedProviderAuth(auth);
}
async function createSystemAgentVerifiedInferenceBinding(params) {
	const deps = params.deps ?? {};
	const runConfig = structuredClone(params.executionRoute.runConfig);
	const execution = {
		...params.executionRoute,
		runConfig
	};
	const authProfileId = params.auth.authProfileId ?? execution.authProfileId;
	if (authProfileId) execution.authProfileId = authProfileId;
	const proofKind = params.auth.runtimeOwnerFingerprint ? "runtime-owner" : "credential";
	if (params.auth.authFingerprint && params.auth.runtimeOwnerFingerprint || !params.auth.authFingerprint && !params.auth.runtimeOwnerFingerprint) throw new Error("The successful inference run did not report one exact execution owner.");
	const runtimeOwnerId = params.auth.runtimeOwnerId?.trim();
	if (proofKind === "runtime-owner" && (!params.auth.runtimeOwnerKind || !runtimeOwnerId)) throw new Error("The successful inference run did not report its exact runtime owner.");
	let successfulHarnessId;
	if (execution.runner === "embedded") {
		const configuredHarnessId = execution.agentHarnessRuntimeOverride.trim();
		const reportedHarnessId = params.auth.agentHarnessId?.trim();
		if (!configuredHarnessId) throw new Error("The configured inference route did not select an agent harness.");
		if (configuredHarnessId === "auto" && !reportedHarnessId) throw new Error("The successful inference run did not report its exact agent harness.");
		if (reportedHarnessId && configuredHarnessId !== "auto" && reportedHarnessId !== configuredHarnessId) throw new Error(`The successful inference run used agent harness "${reportedHarnessId}" instead of "${configuredHarnessId}".`);
		successfulHarnessId = reportedHarnessId ?? configuredHarnessId;
		execution.agentHarnessRuntimeOverride = successfulHarnessId;
	}
	let currentRuntimeArtifactFingerprint;
	if (execution.runner === "cli") {
		if (!params.auth.runtimeArtifactFingerprint || !params.auth.runtimeArtifactId?.trim()) throw new Error("The successful CLI inference run did not report its runtime artifact.");
		currentRuntimeArtifactFingerprint = await (deps.resolveCliRuntimeArtifactFingerprint ?? require_cli_auth_epoch.resolveCliRuntimeArtifactFingerprint)({
			provider: execution.provider,
			config: execution.runConfig,
			agentId: "@gabrielvfonseca/operator",
			runtimeArtifactId: params.auth.runtimeArtifactId.trim()
		});
		if (currentRuntimeArtifactFingerprint !== params.auth.runtimeArtifactFingerprint) throw new Error("The successful CLI runtime artifact is no longer active.");
	}
	const pluginHarnessId = execution.runner === "embedded" && successfulHarnessId !== "@gabrielvfonseca/operator" ? successfulHarnessId : void 0;
	if (pluginHarnessId) {
		if (params.auth.runtimeOwnerKind !== "plugin-harness" || runtimeOwnerId !== pluginHarnessId || !params.auth.runtimeArtifactId?.trim() || !params.auth.runtimeArtifactFingerprint) throw new Error("The successful inference harness did not report its exact runtime artifact.");
		const artifact = {
			id: params.auth.runtimeArtifactId.trim(),
			fingerprint: params.auth.runtimeArtifactFingerprint
		};
		if (!await validateAgentHarnessRuntimeArtifact({
			harnessId: pluginHarnessId,
			artifact,
			deps
		})) throw new Error("The successful inference harness runtime artifact is no longer active.");
		currentRuntimeArtifactFingerprint = artifact.fingerprint;
	}
	const currentAuthFingerprint = await (proofKind === "runtime-owner" ? resolveCurrentRuntimeOwnerFingerprint({
		route: execution,
		kind: params.auth.runtimeOwnerKind,
		runtimeOwnerId: params.auth.runtimeOwnerId,
		...authProfileId ? { authProfileId } : {},
		...params.auth.skipLocalCredential ? { skipLocalCredential: true } : {},
		...currentRuntimeArtifactFingerprint ? { runtimeArtifactFingerprint: currentRuntimeArtifactFingerprint } : {},
		deps
	}) : resolveCurrentAuthFingerprint({
		route: execution,
		...authProfileId ? { authProfileId } : {},
		...params.auth.skipLocalCredential ? { skipLocalCredential: true } : {},
		deps
	}));
	const reportedAuthFingerprint = params.auth.authFingerprint ?? params.auth.runtimeOwnerFingerprint;
	if (!currentAuthFingerprint || reportedAuthFingerprint !== currentAuthFingerprint) throw new Error("The successful inference credential is no longer the active route owner.");
	const authFingerprint = reportedAuthFingerprint;
	if (!authFingerprint) throw new Error("The successful inference run did not report an execution owner.");
	if (pluginHarnessId && resolveRouteHarnessOwnerPluginIds(params.configuredRoute.runConfig, execution).length === 0) throw new Error("The successful inference harness has no trusted manifest owner.");
	const { ownerPluginIds, ownerPluginArtifacts } = captureSystemAgentOwnerPluginArtifacts({
		config: params.configuredRoute.runConfig,
		executionRoute: execution,
		deps
	});
	return {
		configuredRoute: systemAgentRouteIdentity(params.configuredRoute),
		execution,
		executionFingerprint: await projectVerifiedExecutionFingerprint(params.configuredRoute.runConfig, execution, ownerPluginIds, deps),
		ownerPluginIds,
		ownerPluginArtifacts,
		auth: {
			...authProfileId ? { authProfileId } : {},
			...successfulHarnessId ? { agentHarnessId: successfulHarnessId } : {},
			authFingerprint,
			...proofKind === "runtime-owner" ? { proofKind } : {},
			...params.auth.runtimeOwnerKind ? { runtimeOwnerKind: params.auth.runtimeOwnerKind } : {},
			...runtimeOwnerId ? { runtimeOwnerId } : {},
			...params.auth.runtimeArtifactFingerprint ? { runtimeArtifactFingerprint: params.auth.runtimeArtifactFingerprint } : {},
			...params.auth.runtimeArtifactId ? { runtimeArtifactId: params.auth.runtimeArtifactId.trim() } : {},
			...params.auth.skipLocalCredential ? { skipLocalCredential: true } : {}
		}
	};
}
/** Re-hash plugin-owned runtime files only at a persistent side-effect boundary. */
async function hasCurrentSystemAgentOwnerPluginArtifacts(binding, deps = {}) {
	const snapshot = await (deps.readConfigFileSnapshot ?? (await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports)).readConfigFileSnapshot)();
	if (!snapshot.exists || !snapshot.valid) return false;
	const config = snapshot.runtimeConfig ?? snapshot.config;
	try {
		const ownerPluginIds = resolveRouteOwnerPluginIds(config, binding.execution);
		if (!(0, node_util.isDeepStrictEqual)(ownerPluginIds, binding.ownerPluginIds)) return false;
		return (0, node_util.isDeepStrictEqual)(projectOwnerPluginArtifacts({
			config,
			route: binding.execution,
			ownerPluginIds,
			deps
		}), binding.ownerPluginArtifacts);
	} catch {
		return false;
	}
}
/**
* Re-check authored route ownership, then return only the frozen verified run.
* Workspace/channel changes are excluded; broad plugin/env/tool config cannot
* switch this frozen run, while relevant runtime plugin membership and the
* actual selected credential are checked explicitly.
*/
async function resolveSystemAgentVerifiedInferenceRoute(binding, deps = {}) {
	const snapshot = await (deps.readConfigFileSnapshot ?? (await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports)).readConfigFileSnapshot)();
	if (!snapshot.exists || !snapshot.valid) return null;
	const config = snapshot.runtimeConfig ?? snapshot.config;
	const currentRoute = await require_inference_route.resolveSystemAgentConfiguredRouteFromConfig(config, binding.execution.agentId);
	if (!currentRoute || !(0, node_util.isDeepStrictEqual)(systemAgentRouteIdentity(currentRoute), binding.configuredRoute)) return null;
	const currentExecution = {
		...binding.execution,
		runConfig: currentRoute.runConfig
	};
	let currentOwnerPluginIds;
	let currentFingerprint;
	try {
		currentOwnerPluginIds = resolveRouteOwnerPluginIds(config, currentExecution);
		if (!(0, node_util.isDeepStrictEqual)(currentOwnerPluginIds, binding.ownerPluginIds)) return null;
		currentFingerprint = await projectVerifiedExecutionFingerprint(config, currentExecution, currentOwnerPluginIds, deps);
	} catch {
		return null;
	}
	if (!(0, node_util.isDeepStrictEqual)(currentFingerprint, binding.executionFingerprint)) return null;
	if (binding.execution.runner === "embedded" && binding.auth.agentHarnessId !== binding.execution.agentHarnessRuntimeOverride) return null;
	let currentRuntimeArtifactFingerprint;
	if (binding.execution.runner === "cli") {
		currentRuntimeArtifactFingerprint = await (deps.resolveCliRuntimeArtifactFingerprint ?? require_cli_auth_epoch.resolveCliRuntimeArtifactFingerprint)({
			provider: currentExecution.provider,
			config: currentExecution.runConfig,
			agentId: "@gabrielvfonseca/operator",
			runtimeArtifactId: binding.auth.runtimeArtifactId
		}).catch(() => void 0);
		if (currentRuntimeArtifactFingerprint !== binding.auth.runtimeArtifactFingerprint) return null;
	} else if (binding.execution.runner === "embedded" && binding.execution.agentHarnessRuntimeOverride !== "@gabrielvfonseca/operator") {
		const harnessId = binding.execution.agentHarnessRuntimeOverride;
		const artifactId = binding.auth.runtimeArtifactId?.trim();
		const artifactFingerprint = binding.auth.runtimeArtifactFingerprint;
		if (!harnessId || !artifactId || !artifactFingerprint) return null;
		if (!await validateAgentHarnessRuntimeArtifact({
			harnessId,
			artifact: {
				id: artifactId,
				fingerprint: artifactFingerprint
			},
			deps
		})) return null;
		currentRuntimeArtifactFingerprint = artifactFingerprint;
	}
	if (await (binding.auth.proofKind === "runtime-owner" ? resolveCurrentRuntimeOwnerFingerprint({
		route: currentExecution,
		kind: binding.auth.runtimeOwnerKind,
		runtimeOwnerId: binding.auth.runtimeOwnerId,
		...binding.auth.authProfileId ? { authProfileId: binding.auth.authProfileId } : {},
		...binding.auth.skipLocalCredential ? { skipLocalCredential: true } : {},
		...currentRuntimeArtifactFingerprint ? { runtimeArtifactFingerprint: currentRuntimeArtifactFingerprint } : {},
		deps
	}) : resolveCurrentAuthFingerprint({
		route: currentExecution,
		...binding.auth.authProfileId ? { authProfileId: binding.auth.authProfileId } : {},
		...binding.auth.skipLocalCredential ? { skipLocalCredential: true } : {},
		deps
	})).catch(() => void 0) !== binding.auth.authFingerprint) return null;
	return binding.execution;
}
//#endregion
Object.defineProperty(exports, "captureSystemAgentOwnerPluginArtifacts", {
	enumerable: true,
	get: function() {
		return captureSystemAgentOwnerPluginArtifacts;
	}
});
Object.defineProperty(exports, "createSystemAgentVerifiedInferenceBinding", {
	enumerable: true,
	get: function() {
		return createSystemAgentVerifiedInferenceBinding;
	}
});
Object.defineProperty(exports, "hasCurrentSystemAgentOwnerPluginArtifacts", {
	enumerable: true,
	get: function() {
		return hasCurrentSystemAgentOwnerPluginArtifacts;
	}
});
Object.defineProperty(exports, "resolveSystemAgentExpectedAgentHarnessRuntimeArtifact", {
	enumerable: true,
	get: function() {
		return resolveSystemAgentExpectedAgentHarnessRuntimeArtifact;
	}
});
Object.defineProperty(exports, "resolveSystemAgentVerifiedInferenceRoute", {
	enumerable: true,
	get: function() {
		return resolveSystemAgentVerifiedInferenceRoute;
	}
});
