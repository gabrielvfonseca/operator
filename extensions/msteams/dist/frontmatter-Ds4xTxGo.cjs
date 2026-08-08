const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_legacy_names = require("./legacy-names-CjJxLNks.cjs");
const require_boolean = require("./boolean-DrgQ-UMw.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let json5 = require("json5");
json5 = require_rolldown_runtime.__toESM(json5, 1);
//#region src/shared/frontmatter.ts
/** Normalizes comma-delimited or loose array metadata fields into string lists. */
function normalizeStringList(input) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeCsvOrLooseStringList)(input);
}
/** Reads a frontmatter field only when it is represented as a string value. */
function getFrontmatterString(frontmatter, key) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(frontmatter[key]);
}
/** Parses boolean frontmatter strings while preserving the caller's default for missing values. */
function parseFrontmatterBool(value, fallback) {
	const parsed = require_boolean.parseBooleanValue(value);
	return parsed === void 0 ? fallback : parsed;
}
/** Parses the JSON5 Operator manifest block embedded inside a string frontmatter field. */
function resolveOperatorManifestBlock(params) {
	const raw = getFrontmatterString(params.frontmatter, params.key ?? "metadata");
	if (!raw) return;
	try {
		const parsed = json5.default.parse(raw);
		if (!parsed || typeof parsed !== "object") return;
		const manifestKeys = [require_legacy_names.MANIFEST_KEY, ...require_legacy_names.LEGACY_MANIFEST_KEYS];
		for (const key of manifestKeys) {
			const candidate = parsed[key];
			if (candidate && typeof candidate === "object") return candidate;
		}
		return;
	} catch {
		return;
	}
}
/** Extracts normalized runtime requirement lists from an Operator manifest block. */
function resolveOperatorManifestRequires(metadataObj) {
	const requiresRaw = typeof metadataObj.requires === "object" && metadataObj.requires !== null ? metadataObj.requires : void 0;
	if (!requiresRaw) return;
	return {
		bins: normalizeStringList(requiresRaw.bins),
		anyBins: normalizeStringList(requiresRaw.anyBins),
		env: normalizeStringList(requiresRaw.env),
		config: normalizeStringList(requiresRaw.config)
	};
}
/** Parses manifest install entries with a caller-owned parser and drops unsupported specs. */
function resolveOperatorManifestInstall(metadataObj, parseInstallSpec) {
	return (Array.isArray(metadataObj.install) ? metadataObj.install : []).map((entry) => parseInstallSpec(entry)).filter((entry) => Boolean(entry));
}
/** Extracts normalized OS allowlist entries from an Operator manifest block. */
function resolveOperatorManifestOs(metadataObj) {
	return normalizeStringList(metadataObj.os);
}
/** Parses kind/type plus common install fields shared by package-manager install specs. */
function parseOperatorManifestInstallBase(input, allowedKinds) {
	if (!input || typeof input !== "object") return;
	const raw = input;
	const kind = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(typeof raw.kind === "string" ? raw.kind : typeof raw.type === "string" ? raw.type : "") ?? "";
	if (!allowedKinds.includes(kind)) return;
	const spec = {
		raw,
		kind
	};
	if (typeof raw.id === "string") spec.id = raw.id;
	if (typeof raw.label === "string") spec.label = raw.label;
	const bins = normalizeStringList(raw.bins);
	if (bins.length > 0) spec.bins = bins;
	return spec;
}
/** Copies optional common install fields onto a caller-specific install spec object. */
function applyOperatorManifestInstallCommonFields(spec, parsed) {
	if (parsed.id) spec.id = parsed.id;
	if (parsed.label) spec.label = parsed.label;
	if (parsed.bins) spec.bins = parsed.bins;
	return spec;
}
//#endregion
Object.defineProperty(exports, "applyOperatorManifestInstallCommonFields", {
	enumerable: true,
	get: function() {
		return applyOperatorManifestInstallCommonFields;
	}
});
Object.defineProperty(exports, "getFrontmatterString", {
	enumerable: true,
	get: function() {
		return getFrontmatterString;
	}
});
Object.defineProperty(exports, "normalizeStringList", {
	enumerable: true,
	get: function() {
		return normalizeStringList;
	}
});
Object.defineProperty(exports, "parseFrontmatterBool", {
	enumerable: true,
	get: function() {
		return parseFrontmatterBool;
	}
});
Object.defineProperty(exports, "parseOperatorManifestInstallBase", {
	enumerable: true,
	get: function() {
		return parseOperatorManifestInstallBase;
	}
});
Object.defineProperty(exports, "resolveOperatorManifestBlock", {
	enumerable: true,
	get: function() {
		return resolveOperatorManifestBlock;
	}
});
Object.defineProperty(exports, "resolveOperatorManifestInstall", {
	enumerable: true,
	get: function() {
		return resolveOperatorManifestInstall;
	}
});
Object.defineProperty(exports, "resolveOperatorManifestOs", {
	enumerable: true,
	get: function() {
		return resolveOperatorManifestOs;
	}
});
Object.defineProperty(exports, "resolveOperatorManifestRequires", {
	enumerable: true,
	get: function() {
		return resolveOperatorManifestRequires;
	}
});
