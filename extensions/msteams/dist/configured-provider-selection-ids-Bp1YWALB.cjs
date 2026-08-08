const require_object = require("./object-Be4AQnVV.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_model_catalog_core_configured_model_refs = require("@gabrielvfonseca/model-catalog-core/configured-model-refs");
//#region src/commands/doctor/shared/configured-provider-selection-ids.ts
function collectConfiguredProviderIds(cfg) {
	const ids = /* @__PURE__ */ new Set();
	const add = (value) => {
		const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(value);
		if (id) ids.add(id.toLowerCase());
	};
	for (const profile of Object.values(require_object.asObjectRecord(cfg.auth?.profiles) ?? {})) add(require_object.asObjectRecord(profile)?.provider);
	for (const providerId of Object.keys(require_object.asObjectRecord(cfg.models?.providers) ?? {})) add(providerId);
	const modelByChannel = require_object.asObjectRecord(cfg.channels?.modelByChannel);
	for (const [providerId, channelMap] of Object.entries(modelByChannel ?? {})) {
		add(providerId);
		for (const modelRef of Object.values(require_object.asObjectRecord(channelMap) ?? {})) {
			if (typeof modelRef !== "string") continue;
			const slash = modelRef.indexOf("/");
			if (slash > 0) add(modelRef.slice(0, slash));
		}
	}
	for (const { value } of (0, _gabrielvfonseca_model_catalog_core_configured_model_refs.collectConfiguredModelRefs)(cfg, { includeChannelModelOverrides: false })) {
		const slash = value.indexOf("/");
		if (slash > 0) add(value.slice(0, slash));
	}
	return ids;
}
function collectConfiguredMediaProviderIds(cfg) {
	const ids = /* @__PURE__ */ new Set();
	const add = (value) => {
		const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(value);
		if (id) ids.add(id.toLowerCase());
	};
	const addModels = (value) => {
		if (!Array.isArray(value)) return;
		for (const model of value) add(require_object.asObjectRecord(model)?.provider);
	};
	const media = cfg.tools?.media;
	addModels(media?.models);
	addModels(media?.image?.models);
	addModels(media?.audio?.models);
	addModels(media?.video?.models);
	return ids;
}
/** Provider ids used by static and installed-registry plugin matching. */
function collectConfiguredProviderSelectionIds(cfg) {
	return /* @__PURE__ */ new Set([...collectConfiguredProviderIds(cfg), ...collectConfiguredMediaProviderIds(cfg)]);
}
function collectConfiguredMediaProviderSelectionIds(cfg) {
	return collectConfiguredMediaProviderIds(cfg);
}
function collectConfiguredModelProviderSelectionIds(cfg) {
	return collectConfiguredProviderIds(cfg);
}
//#endregion
Object.defineProperty(exports, "collectConfiguredMediaProviderSelectionIds", {
	enumerable: true,
	get: function() {
		return collectConfiguredMediaProviderSelectionIds;
	}
});
Object.defineProperty(exports, "collectConfiguredModelProviderSelectionIds", {
	enumerable: true,
	get: function() {
		return collectConfiguredModelProviderSelectionIds;
	}
});
Object.defineProperty(exports, "collectConfiguredProviderSelectionIds", {
	enumerable: true,
	get: function() {
		return collectConfiguredProviderSelectionIds;
	}
});
