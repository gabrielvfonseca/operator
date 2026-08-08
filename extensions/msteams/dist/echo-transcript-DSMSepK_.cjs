const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_local_roots = require("./local-roots-w2A4ItE4.cjs");
const require_runner_entries = require("./runner.entries-C2SCXSy-.cjs");
const require_provider_supports = require("./provider-supports-R_TuI02P.cjs");
const require_minimax_vlm = require("./minimax-vlm-tDIDyu6m.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_channel_inbound_roots = require("./channel-inbound-roots-D9jR-iC-.cjs");
const require_local_audio = require("./local-audio-D1069XCm.cjs");
const require_provider_id = require("./provider-id-DSr5QyVH.cjs");
const require_defaults_constants = require("./defaults.constants-BV5EBB5p.cjs");
const require_resolve = require("./resolve-DZ2KQVXJ.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_media_core_inbound_path_policy = require("@gabrielvfonseca/media-core/inbound-path-policy");
//#region src/media-understanding/runner.attachments.ts
/** Normalizes message context media fields for the media-understanding runner. */
function normalizeMediaAttachments(ctx) {
	const attachments = require_runner_entries.normalizeAttachments(ctx);
	return ctx.SkipStickerMediaUnderstanding ? attachments.filter((attachment) => attachment.index !== 0) : attachments;
}
/** Creates the lazy attachment cache used by image, audio, video, and document providers. */
function createMediaAttachmentCache(attachments, options) {
	return new require_runner_entries.MediaAttachmentCache(attachments, options);
}
//#endregion
//#region src/media-understanding/runner.ts
const loadHasAvailableAuthForProvider = require_lazy_runtime.createLazyRuntimeNamedExport(() => Promise.resolve().then(() => require("./model-auth-D9ZnqE0T.cjs")).then((n) => n.model_auth_exports), "hasAvailableAuthForProvider");
const loadModelCatalogApi = require_lazy_runtime.createLazyRuntimeModule(async () => await Promise.resolve().then(() => require("./model-catalog-BFgB2-Jk.cjs")).then((n) => n.model_catalog_exports));
function resolveLiteralProviderApiKey(cfg, providerId) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)((0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(cfg?.models?.providers, providerId)?.apiKey);
}
async function hasProviderAuthAvailable(params) {
	if (resolveLiteralProviderApiKey(params.cfg, params.provider)) return true;
	return await (await loadHasAvailableAuthForProvider())({
		...params,
		modelApi: require_runner_entries.resolveOpenAiAudioAuthModelApi({
			capability: params.capability,
			providerId: params.provider
		})
	});
}
function resolveConfiguredKeyProviderOrder(params) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...(0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(Object.keys(params.cfg.models?.providers ?? {}).map((providerId) => require_provider_id.normalizeMediaExecutionProviderId(providerId)).filter(Boolean)).filter((providerId) => require_provider_supports.providerSupportsCapability(params.providerRegistry.get(require_provider_id.normalizeMediaProviderId(providerId)), params.capability)), ...params.fallbackProviders]);
}
function resolveConfiguredImageModelId(params) {
	if (require_minimax_vlm.isMinimaxVlmProvider(params.providerId)) return;
	return resolveConfiguredImageModel(params)?.id?.trim() || void 0;
}
function resolveConfiguredImageModel(params) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(params.cfg.models?.providers, params.providerId)?.models?.find((entry) => {
		const id = entry?.id?.trim();
		return Boolean(id) && entry?.input?.includes("image");
	});
}
function resolveCatalogImageModelId(params) {
	const matches = params.catalog.filter((entry) => require_provider_id.normalizeMediaProviderId(entry.provider) === require_provider_id.normalizeMediaProviderId(params.providerId) && params.modelSupportsVision(entry));
	if (matches.length === 0) return;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((matches.find((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry.id) === "auto") ?? matches[0])?.id);
}
function resolveDefaultMediaModelFromRegistry(params) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.providerRegistry.get(require_provider_id.normalizeMediaProviderId(params.providerId))?.defaultModels?.[params.capability]);
}
function resolveAutoMediaKeyProvidersFromRegistry(params) {
	return [...params.providerRegistry.values()].filter((provider) => provider.capabilities?.includes(params.capability) ?? require_provider_supports.providerSupportsCapability(provider, params.capability)).map((provider) => {
		const priority = provider.autoPriority?.[params.capability];
		return typeof priority === "number" && Number.isFinite(priority) ? {
			provider,
			priority
		} : null;
	}).filter((entry) => entry !== null).toSorted((left, right) => {
		if (left.priority !== right.priority) return left.priority - right.priority;
		return left.provider.id.localeCompare(right.provider.id);
	}).map((entry) => require_provider_id.normalizeMediaProviderId(entry.provider.id)).filter(Boolean);
}
async function explicitImageModelVisionStatus(params) {
	if (require_minimax_vlm.isMinimaxVlmProvider(params.providerId) && !require_minimax_vlm.isMinimaxVlmModel(params.providerId, params.model)) return "unsupported";
	const configured = resolveConfiguredImageModel(params);
	if (configured?.id?.trim() === params.model && configured.input?.includes("image")) return "supported";
	const { findModelInCatalog, loadModelCatalog, modelSupportsVision } = await loadModelCatalogApi();
	const entry = findModelInCatalog(await loadModelCatalog({ config: params.cfg }), params.providerId, params.model);
	if (!entry) return "unknown";
	return modelSupportsVision(entry) ? "supported" : "unsupported";
}
async function resolveAutoImageModelId(params) {
	const explicit = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.explicitModel);
	if (explicit) {
		if (await explicitImageModelVisionStatus({
			cfg: params.cfg,
			providerId: params.providerId,
			model: explicit
		}) !== "unsupported") return explicit;
	}
	if (require_minimax_vlm.isMinimaxVlmProvider(params.providerId)) return "MiniMax-VL-01";
	const configuredModel = resolveConfiguredImageModelId(params);
	if (configuredModel) return configuredModel;
	const defaultModel = resolveDefaultMediaModelFromRegistry({
		providerId: params.providerId,
		capability: "image",
		providerRegistry: params.providerRegistry
	});
	if (defaultModel) return defaultModel;
	const { resolveDefaultMediaModel } = await Promise.resolve().then(() => require("./defaults-B9T6G8PZ.cjs")).then((n) => n.defaults_exports);
	const bundledDefaultModel = resolveDefaultMediaModel({
		cfg: params.cfg,
		providerId: params.providerId,
		capability: "image",
		workspaceDir: params.workspaceDir
	});
	if (bundledDefaultModel) return bundledDefaultModel;
	const { loadModelCatalog, modelSupportsVision } = await loadModelCatalogApi();
	const catalog = await loadModelCatalog({ config: params.cfg });
	return resolveCatalogImageModelId({
		providerId: params.providerId,
		catalog,
		modelSupportsVision
	});
}
function buildProviderRegistry(overrides, cfg) {
	return require_defaults_constants.buildMediaUnderstandingRegistry(overrides, cfg);
}
function resolveMediaAttachmentLocalRoots(params) {
	const workspaceDir = params.ctx.MediaWorkspaceDir ?? params.workspaceDir;
	return (0, _gabrielvfonseca_media_core_inbound_path_policy.mergeInboundPathRoots)(require_local_roots.getDefaultMediaLocalRoots(), workspaceDir ? [node_path.default.resolve(workspaceDir)] : void 0, require_channel_inbound_roots.resolveChannelInboundAttachmentRoots(params));
}
const binaryCache = /* @__PURE__ */ new Map();
const antigravityCliCache = /* @__PURE__ */ new Map();
function clearMediaUnderstandingBinaryCacheForTests() {
	binaryCache.clear();
	antigravityCliCache.clear();
	require_local_audio.clearLocalAudioInspectionCacheForTests();
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.mediaUnderstandingRunnerTestApi")] = { clearMediaUnderstandingBinaryCacheForTests };
function expandHomeDir(value) {
	if (!value.startsWith("~")) return value;
	const home = node_os.default.homedir();
	if (value === "~") return home;
	if (value.startsWith("~/")) return node_path.default.join(home, value.slice(2));
	return value;
}
function hasPathSeparator(value) {
	return value.includes("/") || value.includes("\\");
}
function candidateBinaryNames(name) {
	if (process.platform !== "win32") return [name];
	if (node_path.default.extname(name)) return [name];
	return [name, ...(0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)((process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")).map((item) => item.startsWith(".") ? item : `.${item}`)).map((item) => `${name}${item}`)];
}
async function isExecutable(filePath) {
	try {
		if (!(await node_fs_promises.default.stat(filePath)).isFile()) return false;
		if (process.platform === "win32") return true;
		await node_fs_promises.default.access(filePath, node_fs.constants.X_OK);
		return true;
	} catch {
		return false;
	}
}
async function findBinary(name) {
	return await require_lazy_promise.getOrCreatePromise(binaryCache, name, async () => {
		const direct = expandHomeDir(name.trim());
		if (direct && hasPathSeparator(direct)) {
			for (const candidate of candidateBinaryNames(direct)) if (await isExecutable(candidate)) return candidate;
		}
		const searchName = name.trim();
		if (!searchName) return null;
		const pathEntries = (process.env.PATH ?? "").split(node_path.default.delimiter);
		const candidates = candidateBinaryNames(searchName);
		for (const entryRaw of pathEntries) {
			const entry = expandHomeDir(entryRaw.trim().replace(/^"(.*)"$/, "$1"));
			if (!entry) continue;
			for (const candidate of candidates) {
				const fullPath = node_path.default.join(entry, candidate);
				if (await isExecutable(fullPath)) return fullPath;
			}
		}
		return null;
	});
}
async function probeAntigravityCliCandidate(command) {
	const resolved = await findBinary(command);
	if (!resolved) return null;
	const probeDir = await node_fs_promises.default.mkdtemp(node_path.default.join(require_tmp_operator_dir.resolvePreferredOperatorTmpDir(), "operator-antigravity-probe-"));
	try {
		const { stdout } = await require_exec.runExec(resolved, ["--help"], {
			timeoutMs: 3e3,
			cwd: probeDir
		});
		return stdout.includes("--print") && stdout.includes("--add-dir") && stdout.includes("--sandbox") ? resolved : null;
	} catch {
		return null;
	} finally {
		await node_fs_promises.default.rm(probeDir, {
			recursive: true,
			force: true
		}).catch(() => {});
	}
}
async function resolveAntigravityCliBinary() {
	return await require_lazy_promise.getOrCreatePromise(antigravityCliCache, "agy", async () => {
		const candidates = [
			process.env.OPERATOR_ANTIGRAVITY_CLI?.trim(),
			"agy",
			"antigravity"
		].filter((value) => Boolean(value));
		for (const candidate of candidates) {
			const command = await probeAntigravityCliCandidate(candidate);
			if (command) return command;
		}
		return null;
	});
}
async function resolveAntigravityCliEntry(capability) {
	if (capability === "audio") return null;
	const command = await resolveAntigravityCliBinary();
	if (!command) return null;
	return {
		type: "cli",
		command,
		args: [
			"--sandbox",
			"--add-dir",
			"{{MediaDir}}",
			"--print",
			"{{Prompt}} Inspect {{MediaPath}} and reply with only the requested media description."
		]
	};
}
async function resolveKeyEntry(params) {
	const { cfg, agentDir, workspaceDir, providerRegistry, capability } = params;
	const checkProvider = async (providerId, model) => {
		const provider = require_defaults_constants.getMediaUnderstandingProvider(providerId, providerRegistry);
		if (!provider) return null;
		if (capability === "audio" && !provider.transcribeAudio) return null;
		if (capability === "image" && !provider.describeImage) return null;
		if (capability === "video" && !provider.describeVideo) return null;
		if (!await hasProviderAuthAvailable({
			capability,
			provider: providerId,
			cfg,
			agentDir,
			workspaceDir
		})) return null;
		const resolvedModel = capability === "image" ? await resolveAutoImageModelId({
			cfg,
			providerId,
			providerRegistry,
			explicitModel: model,
			workspaceDir
		}) : capability === "audio" ? resolveDefaultMediaModelFromRegistry({
			providerId,
			capability: "audio",
			providerRegistry
		}) : model ?? resolveDefaultMediaModelFromRegistry({
			providerId,
			capability: "video",
			providerRegistry
		});
		if (capability === "image" && !resolvedModel) return null;
		return {
			type: "provider",
			provider: providerId,
			model: resolvedModel
		};
	};
	const activeProvider = params.activeModel?.provider?.trim();
	if (activeProvider) {
		const activeEntry = await checkProvider(activeProvider, params.activeModel?.model);
		if (activeEntry) return activeEntry;
	}
	for (const providerId of resolveConfiguredKeyProviderOrder({
		cfg,
		providerRegistry,
		capability,
		fallbackProviders: resolveAutoMediaKeyProvidersFromRegistry({
			capability,
			providerRegistry
		})
	})) {
		const entry = await checkProvider(providerId, void 0);
		if (entry) return entry;
	}
	return null;
}
function resolveImageModelFromAgentDefaults(params) {
	const refs = [];
	const primary = require_model_input.resolveAgentModelPrimaryValue(params.cfg.agents?.defaults?.imageModel);
	if (primary?.trim()) refs.push(primary.trim());
	for (const fb of require_model_input.resolveAgentModelFallbackValues(params.cfg.agents?.defaults?.imageModel)) if (fb?.trim()) refs.push(fb.trim());
	if (refs.length === 0) return [];
	const defaultProvider = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: params.agentId
	}).provider;
	const entries = [];
	for (const ref of refs) {
		const effectiveDefaultProvider = ref.includes("/") ? defaultProvider : require_model_selection_shared.inferUniqueProviderFromConfiguredModels({
			cfg: params.cfg,
			model: ref
		}) ?? defaultProvider;
		const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
			cfg: params.cfg,
			defaultProvider: effectiveDefaultProvider
		});
		const resolved = require_model_selection_shared.resolveModelRefFromString({
			cfg: params.cfg,
			raw: ref,
			defaultProvider: effectiveDefaultProvider,
			aliasIndex
		});
		if (!resolved) continue;
		entries.push({
			type: "provider",
			provider: resolved.ref.provider,
			model: resolved.ref.model
		});
	}
	return entries;
}
function hasExplicitImageUnderstandingConfig(params) {
	return (params.config?.models?.length ?? 0) > 0;
}
function isMinimaxNativeVisionModel(params) {
	return require_minimax_vlm.isMinimaxVlmProvider(params.provider) && /^MiniMax-M3(\b|[-.])/i.test(params.model?.trim() ?? "");
}
async function activeModelSupportsNativeVision(params) {
	const activeProvider = params.activeModel?.provider?.trim();
	if (!activeProvider) return false;
	if (require_minimax_vlm.isMinimaxVlmProvider(activeProvider) && !isMinimaxNativeVisionModel({
		provider: activeProvider,
		model: params.activeModel?.model
	})) return false;
	const { findModelInCatalog, loadModelCatalog, modelSupportsVision } = await loadModelCatalogApi();
	return modelSupportsVision(findModelInCatalog(await loadModelCatalog({ config: params.cfg }), activeProvider, params.activeModel?.model ?? ""));
}
async function resolveAutoEntries(params) {
	if (params.capability === "image") {
		if (!await activeModelSupportsNativeVision({
			cfg: params.cfg,
			activeModel: params.activeModel
		})) {
			const imageModelEntries = resolveImageModelFromAgentDefaults({
				cfg: params.cfg,
				agentId: params.agentId
			});
			if (imageModelEntries.length > 0) return imageModelEntries;
		}
	}
	const activeEntry = await resolveActiveModelEntry(params);
	if (activeEntry) return [activeEntry];
	if (params.capability === "audio") {
		const keyEntry = await resolveKeyEntry(params);
		if (keyEntry) return [keyEntry];
		const localAudio = await require_local_audio.inspectLocalAudioSelection();
		if (localAudio.entries.length > 0) return localAudio.entries;
	}
	const keys = await resolveKeyEntry(params);
	if (keys) return [keys];
	const antigravity = await resolveAntigravityCliEntry(params.capability);
	if (antigravity) return [antigravity];
	return [];
}
async function resolveActiveModelEntry(params) {
	const activeProviderRaw = params.activeModel?.provider?.trim();
	if (!activeProviderRaw) return null;
	const providerId = require_provider_id.normalizeMediaExecutionProviderId(activeProviderRaw);
	if (!providerId) return null;
	const provider = require_defaults_constants.getMediaUnderstandingProvider(providerId, params.providerRegistry);
	if (!provider) return null;
	if (params.capability === "audio" && !provider.transcribeAudio) return null;
	if (params.capability === "image" && !provider.describeImage) return null;
	if (params.capability === "video" && !provider.describeVideo) return null;
	if (!await hasProviderAuthAvailable({
		capability: params.capability,
		provider: providerId,
		cfg: params.cfg,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir
	})) return null;
	let model;
	if (params.capability === "image") model = await resolveAutoImageModelId({
		cfg: params.cfg,
		providerId,
		providerRegistry: params.providerRegistry,
		explicitModel: params.activeModel?.model,
		workspaceDir: params.workspaceDir
	});
	else if (params.capability === "audio") model = resolveDefaultMediaModelFromRegistry({
		providerId,
		capability: "audio",
		providerRegistry: params.providerRegistry
	});
	else model = params.activeModel?.model ?? resolveDefaultMediaModelFromRegistry({
		providerId,
		capability: "video",
		providerRegistry: params.providerRegistry
	});
	if (params.capability === "image" && !model) return null;
	return {
		type: "provider",
		provider: providerId,
		model
	};
}
async function runAttachmentEntries(params) {
	const { entries, capability } = params;
	const attempts = [];
	for (const entry of entries) {
		const entryType = entry.type ?? (entry.command ? "cli" : "provider");
		try {
			const result = entryType === "cli" ? await require_runner_entries.runCliEntry({
				capability,
				entry,
				cfg: params.cfg,
				ctx: params.ctx,
				attachmentIndex: params.attachmentIndex,
				cache: params.cache,
				config: params.config
			}) : await require_runner_entries.runProviderEntry({
				capability,
				entry,
				cfg: params.cfg,
				ctx: params.ctx,
				attachmentIndex: params.attachmentIndex,
				cache: params.cache,
				agentDir: params.agentDir,
				workspaceDir: params.workspaceDir,
				providerRegistry: params.providerRegistry,
				config: params.config
			});
			if (result) {
				const decision = require_runner_entries.buildModelDecision({
					entry,
					entryType,
					outcome: "success"
				});
				if (result.provider) decision.provider = result.provider;
				if (result.model) decision.model = result.model;
				if (result.requestedBackend) decision.requestedBackend = result.requestedBackend;
				if (result.observedBackend) decision.observedBackend = result.observedBackend;
				attempts.push(decision);
				return {
					output: result,
					attempts
				};
			}
			attempts.push(require_runner_entries.buildModelDecision({
				entry,
				entryType,
				outcome: "skipped",
				reason: "empty output"
			}));
		} catch (err) {
			if (require_runner_entries.isMediaUnderstandingSkipError(err)) {
				attempts.push(require_runner_entries.buildModelDecision({
					entry,
					entryType,
					outcome: "skipped",
					reason: `${err.reason}: ${err.message}`
				}));
				if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`Skipping ${capability} model due to ${err.reason}: ${err.message}`);
				continue;
			}
			attempts.push(require_runner_entries.buildModelDecision({
				entry,
				entryType,
				outcome: "failed",
				reason: String(err)
			}));
			if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`${capability} understanding failed: ${String(err)}`);
		}
	}
	return {
		output: null,
		attempts
	};
}
function hasFailedMediaAttempt(attachments) {
	return attachments.some((attachment) => attachment.attempts.some((attempt) => attempt.outcome === "failed"));
}
async function runCapability(params) {
	const { capability, cfg, ctx } = params;
	const config = params.config ?? cfg.tools?.media?.[capability];
	if (config?.enabled === false) return {
		outputs: [],
		decision: {
			capability,
			outcome: "disabled",
			attachments: []
		}
	};
	const attachmentPolicy = config?.attachments;
	const selected = require_runner_entries.selectAttachments({
		capability,
		attachments: params.media,
		policy: attachmentPolicy
	});
	if (selected.length === 0) return {
		outputs: [],
		decision: {
			capability,
			outcome: "no-attachment",
			attachments: []
		}
	};
	if (require_resolve.resolveScopeDecision({
		scope: config?.scope,
		ctx
	}) === "deny") {
		if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`${capability} understanding disabled by scope policy.`);
		return {
			outputs: [],
			decision: {
				capability,
				outcome: "scope-deny",
				attachments: selected.map((item) => ({
					attachmentIndex: item.index,
					attempts: []
				}))
			}
		};
	}
	const activeProvider = params.activeModel?.provider?.trim();
	if (capability === "image" && activeProvider && !hasExplicitImageUnderstandingConfig({ config })) {
		if (await activeModelSupportsNativeVision({
			cfg,
			activeModel: params.activeModel
		})) {
			if (require_globals.shouldLogVerbose()) require_globals.logVerbose("Skipping image understanding: primary model supports vision natively");
			const model = params.activeModel?.model?.trim();
			const reason = "primary model supports vision natively";
			return {
				outputs: [],
				decision: {
					capability,
					outcome: "skipped",
					attachments: selected.map((item) => {
						const attempt = {
							type: "provider",
							provider: activeProvider,
							model: model || void 0,
							outcome: "skipped",
							reason
						};
						return {
							attachmentIndex: item.index,
							attempts: [attempt],
							chosen: attempt
						};
					})
				}
			};
		}
	}
	let resolvedEntries = require_resolve.resolveModelEntries({
		cfg,
		capability,
		config,
		providerRegistry: params.providerRegistry
	});
	if (resolvedEntries.length === 0) resolvedEntries = await resolveAutoEntries({
		cfg,
		agentId: params.agentId,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		providerRegistry: params.providerRegistry,
		capability,
		activeModel: params.activeModel
	});
	if (resolvedEntries.length === 0) return {
		outputs: [],
		decision: {
			capability,
			outcome: "skipped",
			attachments: selected.map((item) => ({
				attachmentIndex: item.index,
				attempts: []
			}))
		}
	};
	const outputs = [];
	const attachmentDecisions = [];
	for (const attachment of selected) {
		const { output, attempts } = await runAttachmentEntries({
			capability,
			cfg,
			ctx,
			attachmentIndex: attachment.index,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			providerRegistry: params.providerRegistry,
			cache: params.attachments,
			entries: resolvedEntries,
			config
		});
		if (output) outputs.push(output);
		attachmentDecisions.push({
			attachmentIndex: attachment.index,
			attempts,
			chosen: attempts.find((attempt) => attempt.outcome === "success")
		});
	}
	const decision = {
		capability,
		outcome: outputs.length > 0 ? "success" : hasFailedMediaAttempt(attachmentDecisions) ? "failed" : "skipped",
		attachments: attachmentDecisions
	};
	if (decision.outcome === "failed") require_logger.logWarn(`media-understanding: ${require_runner_entries.formatDecisionSummary(decision)}`);
	else if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`Media understanding ${require_runner_entries.formatDecisionSummary(decision)}`);
	return {
		outputs,
		decision
	};
}
//#endregion
//#region src/media-understanding/echo-transcript.ts
const loadMessageRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./runtime-CIO0BRex.cjs")).then((n) => n.runtime_exports));
/** Default operator-visible transcript echo format for preflight audio transcription. */
const DEFAULT_ECHO_TRANSCRIPT_FORMAT = "📝 \"{transcript}\"";
function formatEchoTranscript(transcript, format) {
	return format.replace("{transcript}", () => transcript);
}
/** Sends a best-effort transcript echo back to the originating deliverable chat. */
async function sendTranscriptEcho(params) {
	const { ctx, cfg, transcript } = params;
	const channel = ctx.Provider ?? ctx.Surface ?? "";
	const to = ctx.OriginatingTo ?? ctx.From ?? "";
	if (!channel || !to) {
		if (require_globals.shouldLogVerbose()) require_globals.logVerbose("media: echo-transcript skipped (no channel/to resolved from ctx)");
		return;
	}
	const normalizedChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(channel);
	if (!require_message_channel.isDeliverableMessageChannel(normalizedChannel)) {
		if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`media: echo-transcript skipped (channel "${normalizedChannel}" is not deliverable)`);
		return;
	}
	const text = formatEchoTranscript(transcript, params.format ?? "📝 \"{transcript}\"");
	try {
		const { sendDurableMessageBatch } = await loadMessageRuntime();
		const send = await sendDurableMessageBatch({
			cfg,
			channel: normalizedChannel,
			to,
			accountId: ctx.AccountId ?? void 0,
			threadId: ctx.MessageThreadId ?? void 0,
			payloads: [{ text }],
			bestEffort: true,
			durability: "best_effort"
		});
		if (send.status === "failed") throw send.error;
		if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`media: echo-transcript sent to ${normalizedChannel}/${to}`);
	} catch (err) {
		require_globals.logVerbose(`media: echo-transcript delivery failed: ${String(err)}`);
	}
}
//#endregion
Object.defineProperty(exports, "DEFAULT_ECHO_TRANSCRIPT_FORMAT", {
	enumerable: true,
	get: function() {
		return DEFAULT_ECHO_TRANSCRIPT_FORMAT;
	}
});
Object.defineProperty(exports, "buildProviderRegistry", {
	enumerable: true,
	get: function() {
		return buildProviderRegistry;
	}
});
Object.defineProperty(exports, "createMediaAttachmentCache", {
	enumerable: true,
	get: function() {
		return createMediaAttachmentCache;
	}
});
Object.defineProperty(exports, "normalizeMediaAttachments", {
	enumerable: true,
	get: function() {
		return normalizeMediaAttachments;
	}
});
Object.defineProperty(exports, "resolveMediaAttachmentLocalRoots", {
	enumerable: true,
	get: function() {
		return resolveMediaAttachmentLocalRoots;
	}
});
Object.defineProperty(exports, "runCapability", {
	enumerable: true,
	get: function() {
		return runCapability;
	}
});
Object.defineProperty(exports, "sendTranscriptEcho", {
	enumerable: true,
	get: function() {
		return sendTranscriptEcho;
	}
});
