let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
function modelConfigKey(provider, model) {
	const providerId = provider?.trim() ?? "";
	const modelId = model?.trim() ?? "";
	if (!providerId) return modelId;
	if (!modelId) return providerId;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelId).startsWith(`${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(providerId)}/`) ? modelId : `${providerId}/${modelId}`;
}
function modelConfigKeys(provider, model) {
	const key = modelConfigKey(provider, model);
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(provider?.trim() ?? "") !== "openai-codex") return [key];
	const openAiKey = modelConfigKey("openai", model);
	return openAiKey === key ? [key] : [key, openAiKey];
}
function resolveFastModeModelParams(params) {
	const models = params.cfg?.agents?.defaults?.models;
	if (!models) return;
	for (const key of modelConfigKeys(params.provider, params.model)) {
		const modelConfig = models[key];
		if (modelConfig?.params) return modelConfig.params;
	}
}
function normalizeFastModeAutoOnSeconds(value) {
	return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : void 0;
}
function resolveFastModeModelAutoOnSeconds(params) {
	const modelParams = resolveFastModeModelParams(params);
	return normalizeFastModeAutoOnSeconds(modelParams?.fastAutoOnSeconds) ?? normalizeFastModeAutoOnSeconds(modelParams?.fast_auto_on_seconds) ?? normalizeFastModeAutoOnSeconds(modelParams?.fastSeconds) ?? normalizeFastModeAutoOnSeconds(modelParams?.fast_seconds) ?? 60;
}
function resolveFastModeForElapsed(params) {
	const nowMs = params.nowMs ?? Date.now();
	const elapsedMs = Math.max(0, nowMs - params.startedAtMs);
	const fastAutoOnSeconds = normalizeFastModeAutoOnSeconds(params.fastAutoOnSeconds) ?? 60;
	const thresholdMs = fastAutoOnSeconds * 1e3;
	const enabled = params.mode === "auto" ? elapsedMs <= thresholdMs : params.mode === true;
	const elapsedSeconds = Math.floor(elapsedMs / 1e3);
	return {
		mode: params.mode,
		enabled,
		elapsedSeconds,
		fastAutoOnSeconds
	};
}
function formatFastModeAutoProgressText(params) {
	if (params.enabled) return "💨Fast: auto-on";
	const fastAutoOnSeconds = normalizeFastModeAutoOnSeconds(params.fastAutoOnSeconds) ?? 60;
	return `💨Fast: auto-off(${params.elapsedSeconds}s>=${fastAutoOnSeconds}s)`;
}
function formatFastModeValue(mode) {
	return mode === "auto" ? "auto" : mode === true ? "on" : "off";
}
function formatFastModeAutoLabel(params) {
	return `auto (${normalizeFastModeAutoOnSeconds(params?.fastAutoOnSeconds) ?? 60} sec)`;
}
function formatFastModeStatusValue(params) {
	if (params.mode === "auto") return formatFastModeAutoLabel({ fastAutoOnSeconds: params.fastAutoOnSeconds });
	return formatFastModeValue(params.mode);
}
function formatFastModeCommandOptions(params) {
	return `on, off, ${formatFastModeAutoLabel({ fastAutoOnSeconds: params?.fastAutoOnSeconds })}, default, status`;
}
function normalizeFastModeSource(value) {
	return value === "session" || value === "agent" || value === "config" || value === "default" ? value : void 0;
}
function formatFastModeSourceSuffix(source) {
	switch (source) {
		case "session": return " (session)";
		case "agent": return " (default: agent)";
		case "config": return " (default: model)";
		case "default": return " (default)";
		default: return "";
	}
}
function formatFastModeCurrentStatus(params) {
	return `${params.label ?? "Current fast mode"}: ${formatFastModeStatusValue({
		mode: params.mode,
		fastAutoOnSeconds: params.fastAutoOnSeconds
	})}${formatFastModeSourceSuffix(params.source)}.`;
}
//#endregion
Object.defineProperty(exports, "formatFastModeAutoLabel", {
	enumerable: true,
	get: function() {
		return formatFastModeAutoLabel;
	}
});
Object.defineProperty(exports, "formatFastModeAutoProgressText", {
	enumerable: true,
	get: function() {
		return formatFastModeAutoProgressText;
	}
});
Object.defineProperty(exports, "formatFastModeCommandOptions", {
	enumerable: true,
	get: function() {
		return formatFastModeCommandOptions;
	}
});
Object.defineProperty(exports, "formatFastModeCurrentStatus", {
	enumerable: true,
	get: function() {
		return formatFastModeCurrentStatus;
	}
});
Object.defineProperty(exports, "formatFastModeStatusValue", {
	enumerable: true,
	get: function() {
		return formatFastModeStatusValue;
	}
});
Object.defineProperty(exports, "formatFastModeValue", {
	enumerable: true,
	get: function() {
		return formatFastModeValue;
	}
});
Object.defineProperty(exports, "normalizeFastModeAutoOnSeconds", {
	enumerable: true,
	get: function() {
		return normalizeFastModeAutoOnSeconds;
	}
});
Object.defineProperty(exports, "normalizeFastModeSource", {
	enumerable: true,
	get: function() {
		return normalizeFastModeSource;
	}
});
Object.defineProperty(exports, "resolveFastModeForElapsed", {
	enumerable: true,
	get: function() {
		return resolveFastModeForElapsed;
	}
});
Object.defineProperty(exports, "resolveFastModeModelAutoOnSeconds", {
	enumerable: true,
	get: function() {
		return resolveFastModeModelAutoOnSeconds;
	}
});
Object.defineProperty(exports, "resolveFastModeModelParams", {
	enumerable: true,
	get: function() {
		return resolveFastModeModelParams;
	}
});
