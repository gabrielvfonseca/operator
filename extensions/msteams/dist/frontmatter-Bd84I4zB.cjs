const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_frontmatter = require("./frontmatter-WKYeKqrx.cjs");
const require_frontmatter$1 = require("./frontmatter-Ds4xTxGo.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/skills/loading/frontmatter.ts
function parseFrontmatter(content) {
	return require_frontmatter.parseFrontmatterBlock(content);
}
const BREW_FORMULA_PATTERN = /^[A-Za-z0-9][A-Za-z0-9@+._/-]*$/;
const GO_MODULE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~+\-/]*(?:@[A-Za-z0-9][A-Za-z0-9._~+\-/]*)?$/;
const UV_PACKAGE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._\-[\]=<>!~+,]*$/;
function normalizeSafeBrewFormula(raw) {
	if (typeof raw !== "string") return;
	const formula = raw.trim();
	if (!formula || formula.startsWith("-") || formula.includes("\\") || formula.includes("..")) return;
	if (!BREW_FORMULA_PATTERN.test(formula)) return;
	return formula;
}
function normalizeSafeNpmSpec(raw) {
	if (typeof raw !== "string") return;
	const spec = raw.trim();
	if (!spec || spec.startsWith("-")) return;
	if (require_npm_registry_spec.validateRegistryNpmSpec(spec) !== null) return;
	return spec;
}
function normalizeSafeGoModule(raw) {
	if (typeof raw !== "string") return;
	const moduleSpec = raw.trim();
	if (!moduleSpec || moduleSpec.startsWith("-") || moduleSpec.includes("\\") || moduleSpec.includes("://")) return;
	if (!GO_MODULE_PATTERN.test(moduleSpec)) return;
	return moduleSpec;
}
function normalizeSafeUvPackage(raw) {
	if (typeof raw !== "string") return;
	const pkg = raw.trim();
	if (!pkg || pkg.startsWith("-") || pkg.includes("\\") || pkg.includes("://")) return;
	if (!UV_PACKAGE_PATTERN.test(pkg)) return;
	return pkg;
}
function normalizeSafeDownloadUrl(raw) {
	if (typeof raw !== "string") return;
	const value = raw.trim();
	if (!value || /\s/.test(value)) return;
	try {
		const parsed = new URL(value);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
		return parsed.toString();
	} catch {
		return;
	}
}
function parseInstallSpec(input) {
	const parsed = require_frontmatter$1.parseOperatorManifestInstallBase(input, [
		"brew",
		"node",
		"go",
		"uv",
		"download"
	]);
	if (!parsed) return;
	const { raw } = parsed;
	const spec = require_frontmatter$1.applyOperatorManifestInstallCommonFields({ kind: parsed.kind }, parsed);
	const osList = require_frontmatter$1.normalizeStringList(raw.os);
	if (osList.length > 0) spec.os = osList;
	const formula = normalizeSafeBrewFormula(raw.formula);
	if (formula) spec.formula = formula;
	const cask = normalizeSafeBrewFormula(raw.cask);
	if (!spec.formula && cask) spec.formula = cask;
	if (spec.kind === "node") {
		const pkg = normalizeSafeNpmSpec(raw.package);
		if (pkg) spec.package = pkg;
	} else if (spec.kind === "uv") {
		const pkg = normalizeSafeUvPackage(raw.package);
		if (pkg) spec.package = pkg;
	}
	const moduleSpec = normalizeSafeGoModule(raw.module);
	if (moduleSpec) spec.module = moduleSpec;
	const downloadUrl = normalizeSafeDownloadUrl(raw.url);
	if (downloadUrl) spec.url = downloadUrl;
	if (typeof raw.archive === "string") spec.archive = raw.archive;
	if (typeof raw.extract === "boolean") spec.extract = raw.extract;
	if (typeof raw.stripComponents === "number") spec.stripComponents = raw.stripComponents;
	if (typeof raw.targetDir === "string") spec.targetDir = raw.targetDir;
	if (spec.kind === "brew" && !spec.formula) return;
	if (spec.kind === "node" && !spec.package) return;
	if (spec.kind === "go" && !spec.module) return;
	if (spec.kind === "uv" && !spec.package) return;
	if (spec.kind === "download" && !spec.url) return;
	return spec;
}
function resolveOperatorMetadata(frontmatter) {
	const metadataObj = require_frontmatter$1.resolveOperatorManifestBlock({ frontmatter });
	if (!metadataObj) return;
	const requires = require_frontmatter$1.resolveOperatorManifestRequires(metadataObj);
	const install = require_frontmatter$1.resolveOperatorManifestInstall(metadataObj, parseInstallSpec);
	const osRaw = require_frontmatter$1.resolveOperatorManifestOs(metadataObj);
	return {
		always: typeof metadataObj.always === "boolean" ? metadataObj.always : void 0,
		emoji: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(metadataObj.emoji),
		homepage: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(metadataObj.homepage),
		skillKey: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(metadataObj.skillKey),
		primaryEnv: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(metadataObj.primaryEnv),
		os: osRaw.length > 0 ? osRaw : void 0,
		requires,
		install: install.length > 0 ? install : void 0
	};
}
function resolveSkillInvocationPolicy(frontmatter) {
	return {
		userInvocable: require_frontmatter$1.parseFrontmatterBool(require_frontmatter$1.getFrontmatterString(frontmatter, "user-invocable"), true),
		disableModelInvocation: require_frontmatter$1.parseFrontmatterBool(require_frontmatter$1.getFrontmatterString(frontmatter, "disable-model-invocation"), false)
	};
}
function resolveSkillKey(skill, entry) {
	return entry?.metadata?.skillKey ?? skill.name;
}
//#endregion
Object.defineProperty(exports, "parseFrontmatter", {
	enumerable: true,
	get: function() {
		return parseFrontmatter;
	}
});
Object.defineProperty(exports, "resolveOperatorMetadata", {
	enumerable: true,
	get: function() {
		return resolveOperatorMetadata;
	}
});
Object.defineProperty(exports, "resolveSkillInvocationPolicy", {
	enumerable: true,
	get: function() {
		return resolveSkillInvocationPolicy;
	}
});
Object.defineProperty(exports, "resolveSkillKey", {
	enumerable: true,
	get: function() {
		return resolveSkillKey;
	}
});
