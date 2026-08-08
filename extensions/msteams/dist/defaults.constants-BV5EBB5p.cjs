const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_provider_id = require("./provider-id-DSr5QyVH.cjs");
const require_capability_provider_runtime = require("./capability-provider-runtime-BgXXVc3C.cjs");
const require_config_provider_models = require("./config-provider-models-4WEolJcZ.cjs");
//#region src/media-understanding/image-runtime.ts
const bindImageRuntime = require_lazy_runtime.createLazyRuntimeMethodBinder(require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./image-DbSELdyJ.cjs"))));
/** Describes one image through the configured media runtime. */
const describeImageWithModel = bindImageRuntime((runtime) => runtime.describeImageWithModel);
/** Describes multiple images through the configured media runtime. */
const describeImagesWithModel = bindImageRuntime((runtime) => runtime.describeImagesWithModel);
bindImageRuntime((runtime) => runtime.describeImageWithModelPayloadTransform);
bindImageRuntime((runtime) => runtime.describeImagesWithModelPayloadTransform);
//#endregion
//#region src/media-understanding/provider-registry.ts
function mergeProviderIntoRegistry(registry, provider, registryKey = provider.id) {
	const normalizedKey = require_provider_id.normalizeMediaProviderId(registryKey);
	const existing = registry.get(normalizedKey);
	const merged = existing ? {
		...existing,
		...provider,
		capabilities: provider.capabilities ?? existing.capabilities,
		defaultModels: provider.defaultModels ?? existing.defaultModels,
		autoPriority: provider.autoPriority ?? existing.autoPriority,
		nativeDocumentInputs: provider.nativeDocumentInputs ?? existing.nativeDocumentInputs,
		documentModels: provider.documentModels ?? existing.documentModels
	} : provider;
	registry.set(normalizedKey, hydrateModelBackedMediaProvider(merged));
}
function hydrateModelBackedMediaProvider(provider) {
	if (!provider.capabilities?.includes("image")) return provider;
	if (provider.describeImage && provider.describeImages) return provider;
	return {
		...provider,
		describeImage: provider.describeImage ?? describeImageWithModel,
		describeImages: provider.describeImages ?? describeImagesWithModel
	};
}
/** Builds the media-understanding provider registry from plugin capabilities and config providers. */
function buildMediaUnderstandingRegistry(overrides, cfg) {
	const registry = /* @__PURE__ */ new Map();
	for (const provider of require_capability_provider_runtime.resolvePluginCapabilityProviders({
		key: "mediaUnderstandingProviders",
		cfg
	})) mergeProviderIntoRegistry(registry, provider);
	for (const normalizedKey of require_config_provider_models.resolveImageCapableConfigProviderIds(cfg)) if (!registry.has(normalizedKey)) mergeProviderIntoRegistry(registry, {
		id: normalizedKey,
		capabilities: ["image"],
		describeImage: describeImageWithModel,
		describeImages: describeImagesWithModel
	});
	if (overrides) for (const [key, provider] of Object.entries(overrides)) mergeProviderIntoRegistry(registry, provider, key);
	return registry;
}
/** Looks up a media-understanding provider using the same id normalization as registry builds. */
function getMediaUnderstandingProvider(id, registry) {
	return registry.get(require_provider_id.normalizeMediaProviderId(id));
}
//#endregion
//#region packages/media-understanding-common/src/defaults.ts
const MB = 1024 * 1024;
/** Default max response characters by capability. */
const DEFAULT_MAX_CHARS_BY_CAPABILITY = {
	image: 500,
	audio: void 0,
	video: 500
};
/** Default input byte limits by capability. */
const DEFAULT_MAX_BYTES = {
	image: 10 * MB,
	audio: 20 * MB,
	video: 50 * MB
};
/** Default request timeout by capability. */
const DEFAULT_TIMEOUT_SECONDS = {
	image: 60,
	audio: 60,
	video: 120
};
/** Default prompts by capability. */
const DEFAULT_PROMPT = {
	image: "Describe the image.",
	audio: "Transcribe the audio.",
	video: "Describe the video."
};
/** Upper bound for base64-expanded video payloads. */
const DEFAULT_VIDEO_MAX_BASE64_BYTES = 70 * MB;
/** CLI output buffer used by provider child processes. */
const CLI_OUTPUT_MAX_BUFFER = 5 * MB;
/** Minimum bytes for audio files before transcription is attempted. */
const MIN_AUDIO_FILE_BYTES = 1024;
//#endregion
Object.defineProperty(exports, "CLI_OUTPUT_MAX_BUFFER", {
	enumerable: true,
	get: function() {
		return CLI_OUTPUT_MAX_BUFFER;
	}
});
Object.defineProperty(exports, "DEFAULT_MAX_BYTES", {
	enumerable: true,
	get: function() {
		return DEFAULT_MAX_BYTES;
	}
});
Object.defineProperty(exports, "DEFAULT_MAX_CHARS_BY_CAPABILITY", {
	enumerable: true,
	get: function() {
		return DEFAULT_MAX_CHARS_BY_CAPABILITY;
	}
});
Object.defineProperty(exports, "DEFAULT_PROMPT", {
	enumerable: true,
	get: function() {
		return DEFAULT_PROMPT;
	}
});
Object.defineProperty(exports, "DEFAULT_TIMEOUT_SECONDS", {
	enumerable: true,
	get: function() {
		return DEFAULT_TIMEOUT_SECONDS;
	}
});
Object.defineProperty(exports, "DEFAULT_VIDEO_MAX_BASE64_BYTES", {
	enumerable: true,
	get: function() {
		return DEFAULT_VIDEO_MAX_BASE64_BYTES;
	}
});
Object.defineProperty(exports, "MIN_AUDIO_FILE_BYTES", {
	enumerable: true,
	get: function() {
		return MIN_AUDIO_FILE_BYTES;
	}
});
Object.defineProperty(exports, "buildMediaUnderstandingRegistry", {
	enumerable: true,
	get: function() {
		return buildMediaUnderstandingRegistry;
	}
});
Object.defineProperty(exports, "describeImageWithModel", {
	enumerable: true,
	get: function() {
		return describeImageWithModel;
	}
});
Object.defineProperty(exports, "describeImagesWithModel", {
	enumerable: true,
	get: function() {
		return describeImagesWithModel;
	}
});
Object.defineProperty(exports, "getMediaUnderstandingProvider", {
	enumerable: true,
	get: function() {
		return getMediaUnderstandingProvider;
	}
});
