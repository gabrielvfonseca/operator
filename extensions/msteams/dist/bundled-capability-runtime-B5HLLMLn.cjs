const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_plugin_module_loader_cache = require("./plugin-module-loader-cache-C_Mm0NZ7.cjs");
const require_dev_source_root = require("./dev-source-root-Cr9dWf04.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_bundled_plugin_metadata = require("./bundled-plugin-metadata-h4MVizJT.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_module_export = require("./module-export-B7NLAFsm.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_api_builder = require("./api-builder-CwclmNZ2.cjs");
const require_agent_tool_result_middleware = require("./agent-tool-result-middleware-Do5BE8dK.cjs");
const require_bundled_compat = require("./bundled-compat-CE2H4H2e.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_url = require("node:url");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/captured-registration.ts
function createCapturedPluginRegistration(params) {
	const providers = [];
	const agentHarnesses = [];
	const cliRegistrars = [];
	const cliBackends = [];
	const textTransforms = [];
	const codexAppServerExtensionFactories = [];
	const agentToolResultMiddlewares = [];
	const embeddingProviders = [];
	const speechProviders = [];
	const realtimeTranscriptionProviders = [];
	const realtimeVoiceProviders = [];
	const mediaUnderstandingProviders = [];
	const transcriptSourceProviders = [];
	const imageGenerationProviders = [];
	const videoGenerationProviders = [];
	const musicGenerationProviders = [];
	const webFetchProviders = [];
	const webSearchProviders = [];
	const workerProviders = [];
	const migrationProviders = [];
	const memoryEmbeddingProviders = [];
	const sessionExtensions = [];
	const trustedToolPolicies = [];
	const toolMetadata = [];
	const controlUiDescriptors = [];
	const runtimeLifecycles = [];
	const agentEventSubscriptions = [];
	const sessionSchedulerJobs = [];
	const sessionActions = [];
	let capturedSessionTurnCount = 0;
	const tools = [];
	const modelCatalogProviders = [];
	const sessionCatalogs = [];
	const pluginId = params?.id ?? "captured-plugin-registration";
	const pluginName = params?.name ?? "Captured Plugin Registration";
	const pluginSource = params?.source ?? "captured-plugin-registration";
	return {
		providers,
		agentHarnesses,
		cliRegistrars,
		cliBackends,
		textTransforms,
		codexAppServerExtensionFactories,
		agentToolResultMiddlewares,
		embeddingProviders,
		speechProviders,
		realtimeTranscriptionProviders,
		realtimeVoiceProviders,
		mediaUnderstandingProviders,
		transcriptSourceProviders,
		imageGenerationProviders,
		videoGenerationProviders,
		musicGenerationProviders,
		webFetchProviders,
		webSearchProviders,
		workerProviders,
		migrationProviders,
		memoryEmbeddingProviders,
		sessionExtensions,
		trustedToolPolicies,
		toolMetadata,
		controlUiDescriptors,
		runtimeLifecycles,
		agentEventSubscriptions,
		sessionSchedulerJobs,
		sessionActions,
		tools,
		modelCatalogProviders,
		sessionCatalogs,
		api: require_api_builder.buildPluginApi({
			id: pluginId,
			name: pluginName,
			source: pluginSource,
			registrationMode: params?.registrationMode ?? "full",
			config: params?.config ?? {},
			runtime: {},
			logger: {
				info() {},
				warn() {},
				error() {},
				debug() {}
			},
			resolvePath: (input) => input,
			handlers: {
				registerCli(registrar, opts) {
					const parentPath = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(opts?.parentPath ?? []);
					const descriptors = (opts?.descriptors ?? []).map((descriptor) => ({
						name: descriptor.name.trim(),
						description: descriptor.description.trim(),
						hasSubcommands: descriptor.hasSubcommands
					})).filter((descriptor) => descriptor.name && descriptor.description);
					const commands = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)([...opts?.commands ?? [], ...descriptors.map((descriptor) => descriptor.name)]);
					if (commands.length === 0) return;
					cliRegistrars.push({
						register: registrar,
						parentPath,
						commands,
						descriptors
					});
				},
				registerProvider(provider) {
					providers.push(provider);
				},
				registerModelCatalogProvider(provider) {
					modelCatalogProviders.push(provider);
				},
				registerSessionCatalog(provider) {
					sessionCatalogs.push(provider);
				},
				registerAgentHarness(harness) {
					agentHarnesses.push(harness);
				},
				registerCodexAppServerExtensionFactory(factory) {
					codexAppServerExtensionFactories.push(factory);
				},
				registerAgentToolResultMiddleware(handler, options) {
					const runtimes = require_agent_tool_result_middleware.normalizeAgentToolResultMiddlewareRuntimes(options);
					agentToolResultMiddlewares.push({
						pluginId,
						pluginName,
						rawHandler: handler,
						handler,
						runtimes,
						source: pluginSource
					});
				},
				registerCliBackend(backend) {
					cliBackends.push(backend);
				},
				registerTextTransforms(transforms) {
					textTransforms.push(transforms);
				},
				registerEmbeddingProvider(provider) {
					embeddingProviders.push(provider);
				},
				registerSpeechProvider(provider) {
					speechProviders.push(provider);
				},
				registerRealtimeTranscriptionProvider(provider) {
					realtimeTranscriptionProviders.push(provider);
				},
				registerRealtimeVoiceProvider(provider) {
					realtimeVoiceProviders.push(provider);
				},
				registerMediaUnderstandingProvider(provider) {
					mediaUnderstandingProviders.push(provider);
				},
				registerTranscriptSourceProvider(provider) {
					transcriptSourceProviders.push(provider);
				},
				registerImageGenerationProvider(provider) {
					imageGenerationProviders.push(provider);
				},
				registerVideoGenerationProvider(provider) {
					videoGenerationProviders.push(provider);
				},
				registerMusicGenerationProvider(provider) {
					musicGenerationProviders.push(provider);
				},
				registerWebFetchProvider(provider) {
					webFetchProviders.push(provider);
				},
				registerWebSearchProvider(provider) {
					webSearchProviders.push(provider);
				},
				registerWorkerProvider(provider) {
					workerProviders.push(provider);
				},
				registerMigrationProvider(provider) {
					migrationProviders.push(provider);
				},
				registerMemoryEmbeddingProvider(adapter) {
					memoryEmbeddingProviders.push(adapter);
				},
				registerSessionExtension(extension) {
					sessionExtensions.push(extension);
				},
				registerTrustedToolPolicy(policy) {
					trustedToolPolicies.push(policy);
				},
				registerToolMetadata(metadata) {
					toolMetadata.push(metadata);
				},
				registerControlUiDescriptor(descriptor) {
					controlUiDescriptors.push(descriptor);
				},
				registerRuntimeLifecycle(lifecycle) {
					runtimeLifecycles.push(lifecycle);
				},
				registerAgentEventSubscription(subscription) {
					agentEventSubscriptions.push(subscription);
				},
				emitAgentEvent: () => ({
					emitted: false,
					reason: "captured registration"
				}),
				registerSessionSchedulerJob(job) {
					sessionSchedulerJobs.push(job);
					return {
						id: job.id,
						pluginId,
						sessionKey: job.sessionKey,
						kind: job.kind
					};
				},
				registerSessionAction(action) {
					sessionActions.push(action);
				},
				sendSessionAttachment: async () => ({
					ok: false,
					error: "captured registration"
				}),
				scheduleSessionTurn: async (schedule) => {
					capturedSessionTurnCount += 1;
					return {
						id: `captured-session-turn-${capturedSessionTurnCount}`,
						pluginId,
						sessionKey: schedule.sessionKey,
						kind: "session-turn"
					};
				},
				unscheduleSessionTurnsByTag: async () => ({
					removed: 0,
					failed: 0
				}),
				registerTool(tool) {
					if (typeof tool !== "function") tools.push(tool);
				}
			}
		})
	};
}
//#endregion
//#region src/plugins/bundled-capability-runtime.ts
/** Loads capability providers from bundled plugin public runtime artifacts. */
const log = require_subsystem.createSubsystemLogger("plugins");
const CAPABILITY_VITEST_SHIM_ALIASES = [
	{
		subpath: "config-runtime",
		target: new URL("./capability-runtime-vitest-shims/config-runtime.ts", require("url").pathToFileURL(__filename).href)
	},
	{
		subpath: "media-runtime",
		target: new URL("./capability-runtime-vitest-shims/media-runtime.ts", require("url").pathToFileURL(__filename).href)
	},
	{
		subpath: "provider-onboard",
		target: new URL("../plugin-sdk/provider-onboard.ts", require("url").pathToFileURL(__filename).href)
	},
	{
		subpath: "speech-core",
		target: new URL("./capability-runtime-vitest-shims/speech-core.ts", require("url").pathToFileURL(__filename).href)
	}
];
function buildVitestCapabilityShimAliasMap() {
	return Object.fromEntries(CAPABILITY_VITEST_SHIM_ALIASES.flatMap(({ subpath, target }) => {
		const targetPath = (0, node_url.fileURLToPath)(target);
		return [[`openclaw/plugin-sdk/${subpath}`, targetPath], [`@gabrielvfonseca/plugin-sdk/${subpath}`, targetPath]];
	}));
}
function applyVitestCapabilityAliasOverrides(params) {
	if (!params.env?.VITEST || params.pluginSdkResolution !== "dist") return params.aliasMap;
	const { "openclaw/plugin-sdk": _ignoredLegacyRootAlias, "@gabrielvfonseca/plugin-sdk": _ignoredScopedRootAlias, ...scopedAliasMap } = params.aliasMap;
	return {
		...scopedAliasMap,
		...buildVitestCapabilityShimAliasMap()
	};
}
function shouldApplyVitestCapabilityAliasOverrides(params) {
	return Boolean(params.env?.VITEST && params.pluginSdkResolution === "dist");
}
function buildBundledCapabilityRuntimeConfig(pluginIds, env) {
	return require_bundled_compat.withBundledPluginVitestCompat({
		config: require_bundled_compat.withBundledPluginEnablementCompat({
			config: void 0,
			pluginIds
		}),
		pluginIds,
		env
	});
}
function resolvePluginModuleExport(moduleExport) {
	const resolved = require_module_export.unwrapDefaultModuleExport(moduleExport);
	if (typeof resolved === "function") return { register: resolved };
	if (resolved && typeof resolved === "object") {
		const definition = resolved;
		return {
			definition,
			register: definition.register ?? definition.activate
		};
	}
	return {};
}
function createCapabilityPluginRecord(params) {
	return {
		id: params.id,
		name: params.name ?? params.id,
		version: params.version,
		description: params.description,
		source: params.source,
		rootDir: params.rootDir,
		origin: "bundled",
		workspaceDir: params.workspaceDir,
		enabled: true,
		status: "loaded",
		toolNames: [],
		hookNames: [],
		channelIds: [],
		cliBackendIds: [],
		providerIds: [],
		embeddingProviderIds: [],
		speechProviderIds: [],
		realtimeTranscriptionProviderIds: [],
		realtimeVoiceProviderIds: [],
		mediaUnderstandingProviderIds: [],
		transcriptSourceProviderIds: [],
		imageGenerationProviderIds: [],
		videoGenerationProviderIds: [],
		musicGenerationProviderIds: [],
		webFetchProviderIds: [],
		webSearchProviderIds: [],
		migrationProviderIds: [],
		memoryEmbeddingProviderIds: [],
		agentHarnessIds: [],
		cliCommands: [],
		services: [],
		gatewayDiscoveryServiceIds: [],
		commands: [],
		httpRoutes: 0,
		hookCount: 0,
		configSchema: true
	};
}
function recordCapabilityLoadError(registry, record, message) {
	record.status = "error";
	record.error = message;
	registry.plugins.push(record);
	registry.diagnostics.push({
		level: "error",
		pluginId: record.id,
		source: record.source,
		message: `failed to load plugin: ${message}`
	});
	log.error(`[plugins] ${record.id} failed to load from ${record.source}: ${message}`);
}
function loadBundledCapabilityRuntimeRegistry(params) {
	const env = params.env ?? process.env;
	const devSourceRoot = require_dev_source_root.resolveOperatorDevSourceRoot(env);
	const pluginIds = new Set(params.pluginIds);
	const registry = require_runtime.createEmptyPluginRegistry();
	const moduleLoaders = require_plugin_module_loader_cache.createPluginModuleLoaderCache();
	const getModuleLoader = (modulePath) => {
		const tryNative = require_plugin_module_loader_cache.shouldPreferNativeModuleLoad(modulePath) && !(env?.VITEST && params.pluginSdkResolution === "dist");
		const aliasMap = shouldApplyVitestCapabilityAliasOverrides({
			pluginSdkResolution: params.pluginSdkResolution,
			env
		}) ? applyVitestCapabilityAliasOverrides({
			aliasMap: require_plugin_module_loader_cache.buildPluginLoaderAliasMap(modulePath, process.argv[1], require("url").pathToFileURL(__filename).href, params.pluginSdkResolution, devSourceRoot),
			pluginSdkResolution: params.pluginSdkResolution,
			env
		}) : void 0;
		return require_plugin_module_loader_cache.getCachedPluginModuleLoader({
			cache: moduleLoaders,
			modulePath,
			importerUrl: require("url").pathToFileURL(__filename).href,
			devSourceRoot,
			loaderFilename: require("url").pathToFileURL(__filename).href,
			...aliasMap ? { aliasMap } : {},
			pluginSdkResolution: params.pluginSdkResolution,
			tryNative
		});
	};
	const discovery = params.discovery ?? require_discovery.discoverOperatorPlugins({ env });
	const manifestRegistry = require_manifest_registry.loadPluginManifestRegistry({
		config: buildBundledCapabilityRuntimeConfig(params.pluginIds, env),
		env,
		candidates: discovery.candidates,
		diagnostics: discovery.diagnostics
	});
	registry.diagnostics.push(...manifestRegistry.diagnostics);
	const manifestByRoot = new Map(manifestRegistry.plugins.map((record) => [record.rootDir, record]));
	const seenPluginIds = /* @__PURE__ */ new Set();
	const repoRoot = process.cwd();
	for (const candidate of discovery.candidates) {
		const manifest = manifestByRoot.get(candidate.rootDir);
		if (manifest?.origin !== "bundled" || !pluginIds.has(manifest.id)) continue;
		if (seenPluginIds.has(manifest.id)) continue;
		seenPluginIds.add(manifest.id);
		const record = createCapabilityPluginRecord({
			id: manifest.id,
			name: manifest.name,
			description: manifest.description,
			version: manifest.version,
			source: env?.VITEST && params.pluginSdkResolution === "dist" ? require_bundled_plugin_metadata.resolveBundledPluginRepoEntryPath({
				rootDir: repoRoot,
				pluginId: manifest.id,
				preferBuilt: true
			}) ?? candidate.source : candidate.source,
			rootDir: candidate.rootDir,
			workspaceDir: candidate.workspaceDir
		});
		const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
			absolutePath: record.source,
			rootPath: record.source === candidate.source ? candidate.rootDir : repoRoot,
			boundaryLabel: record.source === candidate.source ? "plugin root" : "repo root",
			rejectHardlinks: false,
			skipLexicalRootCheck: true
		});
		if (!opened.ok) {
			recordCapabilityLoadError(registry, record, "plugin entry path escapes plugin root or fails alias checks");
			continue;
		}
		const safeSource = opened.path;
		node_fs.default.closeSync(opened.fd);
		let mod;
		try {
			mod = getModuleLoader(safeSource)(safeSource);
		} catch (error) {
			recordCapabilityLoadError(registry, record, String(error));
			continue;
		}
		const register = resolvePluginModuleExport(mod).register;
		if (typeof register !== "function") {
			record.status = "disabled";
			record.error = "plugin export missing register(api)";
			registry.plugins.push(record);
			continue;
		}
		try {
			const captured = createCapturedPluginRegistration();
			register(captured.api);
			record.cliBackendIds.push(...captured.cliBackends.map((entry) => entry.id));
			record.providerIds.push(...captured.providers.map((entry) => entry.id));
			record.embeddingProviderIds.push(...captured.embeddingProviders.map((entry) => entry.id));
			record.speechProviderIds.push(...captured.speechProviders.map((entry) => entry.id));
			record.realtimeTranscriptionProviderIds.push(...captured.realtimeTranscriptionProviders.map((entry) => entry.id));
			record.realtimeVoiceProviderIds.push(...captured.realtimeVoiceProviders.map((entry) => entry.id));
			record.mediaUnderstandingProviderIds.push(...captured.mediaUnderstandingProviders.map((entry) => entry.id));
			record.transcriptSourceProviderIds.push(...captured.transcriptSourceProviders.map((entry) => entry.id));
			record.imageGenerationProviderIds.push(...captured.imageGenerationProviders.map((entry) => entry.id));
			record.videoGenerationProviderIds.push(...captured.videoGenerationProviders.map((entry) => entry.id));
			record.musicGenerationProviderIds.push(...captured.musicGenerationProviders.map((entry) => entry.id));
			record.webFetchProviderIds.push(...captured.webFetchProviders.map((entry) => entry.id));
			record.webSearchProviderIds.push(...captured.webSearchProviders.map((entry) => entry.id));
			record.migrationProviderIds.push(...captured.migrationProviders.map((entry) => entry.id));
			record.memoryEmbeddingProviderIds.push(...captured.memoryEmbeddingProviders.map((entry) => entry.id));
			record.agentHarnessIds.push(...captured.agentHarnesses.map((entry) => entry.id));
			record.toolNames.push(...captured.tools.map((entry) => entry.name));
			registry.cliBackends.push(...captured.cliBackends.map((backend) => ({
				pluginId: record.id,
				pluginName: record.name,
				backend,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.textTransforms.push(...captured.textTransforms.map((transforms) => ({
				pluginId: record.id,
				pluginName: record.name,
				transforms,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.providers.push(...captured.providers.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.embeddingProviders.push(...captured.embeddingProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.speechProviders.push(...captured.speechProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.realtimeTranscriptionProviders.push(...captured.realtimeTranscriptionProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.realtimeVoiceProviders.push(...captured.realtimeVoiceProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.mediaUnderstandingProviders.push(...captured.mediaUnderstandingProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.transcriptSourceProviders.push(...captured.transcriptSourceProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.imageGenerationProviders.push(...captured.imageGenerationProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.videoGenerationProviders.push(...captured.videoGenerationProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.musicGenerationProviders.push(...captured.musicGenerationProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.webFetchProviders.push(...captured.webFetchProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.webSearchProviders.push(...captured.webSearchProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.migrationProviders.push(...captured.migrationProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.memoryEmbeddingProviders.push(...captured.memoryEmbeddingProviders.map((provider) => ({
				pluginId: record.id,
				pluginName: record.name,
				provider,
				source: record.source,
				rootDir: record.rootDir
			})));
			registry.agentHarnesses.push(...captured.agentHarnesses.map((harness) => ({
				pluginId: record.id,
				pluginName: record.name,
				harness,
				source: record.source,
				rootDir: record.rootDir
			})));
			const declaredToolNames = require_agent_tool_result_middleware.normalizePluginToolContractNames(record.contracts);
			for (const tool of captured.tools) {
				const undeclared = require_agent_tool_result_middleware.findUndeclaredPluginToolNames({
					declaredNames: declaredToolNames,
					toolNames: [tool.name]
				});
				if (undeclared.length > 0) {
					registry.diagnostics.push({
						level: "error",
						pluginId: record.id,
						source: record.source,
						message: `plugin must declare contracts.tools for: ${undeclared.join(", ")}`
					});
					continue;
				}
				registry.tools.push({
					pluginId: record.id,
					pluginName: record.name,
					factory: () => tool,
					names: [tool.name],
					declaredNames: declaredToolNames,
					optional: false,
					source: record.source,
					rootDir: record.rootDir
				});
			}
			registry.plugins.push(record);
		} catch (error) {
			recordCapabilityLoadError(registry, record, String(error));
		}
	}
	return registry;
}
//#endregion
Object.defineProperty(exports, "loadBundledCapabilityRuntimeRegistry", {
	enumerable: true,
	get: function() {
		return loadBundledCapabilityRuntimeRegistry;
	}
});
