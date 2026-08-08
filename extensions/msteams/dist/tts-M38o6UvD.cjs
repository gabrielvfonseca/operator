require("./rolldown-runtime-u92d-OFm.cjs");
const require_provider_registry = require("./provider-registry-CMno4lb9.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_tts = require("./tts-KT3_E9ke.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_speech_mime = require("./speech-mime-D-kN067K.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/server-methods/tts.ts
/** Gateway request handlers for TTS status, preference mutation, and synthesis. */
const ttsHandlers = {
	"tts.status": async ({ respond, context }) => {
		try {
			const cfg = context.getRuntimeConfig();
			const config = require_tts.resolveTtsConfig(cfg);
			const prefsPath = require_tts.resolveTtsPrefsPath(config);
			const provider = require_tts.getTtsProvider(config, prefsPath);
			const persona = require_tts.getTtsPersona(config, prefsPath);
			const autoMode = require_tts.resolveTtsAutoMode({
				config,
				prefsPath
			});
			const fallbackProviders = require_tts.resolveTtsProviderOrder(provider, cfg).slice(1).filter((candidate) => require_tts.isTtsProviderConfigured(config, candidate, cfg));
			const providerStates = require_provider_registry.listSpeechProviders(cfg).map((candidate) => ({
				id: candidate.id,
				label: candidate.label,
				configured: candidate.isConfigured({
					cfg,
					providerConfig: require_tts.getResolvedSpeechProviderConfig(config, candidate.id, cfg),
					timeoutMs: config.timeoutMs
				})
			}));
			respond(true, {
				enabled: require_tts.isTtsEnabled(config, prefsPath),
				auto: autoMode,
				provider,
				persona: persona?.id ?? null,
				personas: require_tts.listTtsPersonas(config).map((entry) => ({
					id: entry.id,
					label: entry.label,
					description: entry.description,
					provider: entry.provider
				})),
				fallbackProvider: fallbackProviders[0] ?? null,
				fallbackProviders,
				prefsPath,
				providerStates
			});
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"tts.enable": async ({ respond, context }) => {
		try {
			require_tts.setTtsEnabled(require_tts.resolveTtsPrefsPath(require_tts.resolveTtsConfig(context.getRuntimeConfig())), true);
			respond(true, { enabled: true });
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"tts.disable": async ({ respond, context }) => {
		try {
			require_tts.setTtsEnabled(require_tts.resolveTtsPrefsPath(require_tts.resolveTtsConfig(context.getRuntimeConfig())), false);
			respond(true, { enabled: false });
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"tts.convert": async ({ params, respond, context }) => {
		const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.text) ?? "";
		if (!text) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "tts.convert requires text"));
			return;
		}
		try {
			const cfg = context.getRuntimeConfig();
			const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel);
			const providerRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider);
			const modelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.modelId);
			const voiceId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.voiceId);
			let overrides;
			try {
				overrides = require_tts.resolveExplicitTtsOverrides({
					cfg,
					provider: providerRaw,
					modelId,
					voiceId
				});
			} catch (err) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, require_ws_log.formatForLog(err)));
				return;
			}
			const result = await require_tts.textToSpeech({
				text,
				cfg,
				channel,
				overrides,
				disableFallback: Boolean(overrides.provider || modelId || voiceId)
			});
			if (result.success && result.audioPath) {
				respond(true, {
					audioPath: result.audioPath,
					provider: result.provider,
					outputFormat: result.outputFormat,
					voiceCompatible: result.voiceCompatible
				});
				return;
			}
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, result.error ?? "TTS conversion failed"));
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"tts.speak": async ({ params, respond, context }) => {
		if (!require_src.validateTtsSpeakParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid tts.speak params: ${require_validation_errors.formatValidationErrors(require_src.validateTtsSpeakParams.errors)}`));
			return;
		}
		const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.text);
		if (!text) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "tts.speak requires text"));
			return;
		}
		try {
			const cfg = context.getRuntimeConfig();
			const maxTextLength = require_tts.resolveTtsConfig(cfg).maxTextLength;
			if (text.length > maxTextLength) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `tts.speak text too long (${text.length} chars, max ${maxTextLength})`));
				return;
			}
			const result = await require_tts.synthesizeSpeech({
				text,
				cfg
			});
			const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(result.provider);
			if (!result.success || !result.audioBuffer || result.audioBuffer.length === 0 || !provider) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, result.error ?? "TTS synthesis failed"));
				return;
			}
			respond(true, {
				audioBase64: result.audioBuffer.toString("base64"),
				provider,
				outputFormat: result.outputFormat,
				mimeType: require_speech_mime.inferSpeechMimeType(result.outputFormat, result.fileExtension),
				fileExtension: result.fileExtension
			});
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"tts.setProvider": async ({ params, respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const provider = require_provider_registry.canonicalizeSpeechProviderId((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider) ?? "", cfg);
		if (!provider || !require_provider_registry.getSpeechProvider(provider, cfg)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "Invalid provider. Use a registered TTS provider id."));
			return;
		}
		try {
			require_tts.setTtsProvider(require_tts.resolveTtsPrefsPath(require_tts.resolveTtsConfig(cfg)), provider);
			respond(true, { provider });
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"tts.personas": async ({ respond, context }) => {
		try {
			const config = require_tts.resolveTtsConfig(context.getRuntimeConfig());
			respond(true, {
				active: require_tts.getTtsPersona(config, require_tts.resolveTtsPrefsPath(config))?.id ?? null,
				personas: require_tts.listTtsPersonas(config).map((persona) => ({
					id: persona.id,
					label: persona.label,
					description: persona.description,
					provider: persona.provider,
					fallbackPolicy: persona.fallbackPolicy,
					providers: Object.keys(persona.providers ?? {})
				}))
			});
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"tts.setPersona": async ({ params, respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const rawPersona = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.persona);
		try {
			const config = require_tts.resolveTtsConfig(cfg);
			const prefsPath = require_tts.resolveTtsPrefsPath(config);
			if (!rawPersona || [
				"off",
				"none",
				"default"
			].includes(rawPersona.toLowerCase())) {
				require_tts.setTtsPersona(prefsPath, null);
				respond(true, { persona: null });
				return;
			}
			const persona = require_tts.listTtsPersonas(config).find((entry) => entry.id === rawPersona.toLowerCase());
			if (!persona) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "Invalid persona. Use a configured TTS persona id."));
				return;
			}
			require_tts.setTtsPersona(prefsPath, persona.id);
			respond(true, { persona: persona.id });
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"tts.providers": async ({ respond, context }) => {
		try {
			const cfg = context.getRuntimeConfig();
			const config = require_tts.resolveTtsConfig(cfg);
			const prefsPath = require_tts.resolveTtsPrefsPath(config);
			respond(true, {
				providers: require_provider_registry.listSpeechProviders(cfg).map((provider) => ({
					id: provider.id,
					name: provider.label,
					configured: provider.isConfigured({
						cfg,
						providerConfig: require_tts.getResolvedSpeechProviderConfig(config, provider.id, cfg),
						timeoutMs: config.timeoutMs
					}),
					models: [...provider.models ?? []],
					voices: [...provider.voices ?? []]
				})),
				active: require_tts.getTtsProvider(config, prefsPath)
			});
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	}
};
//#endregion
exports.ttsHandlers = ttsHandlers;
