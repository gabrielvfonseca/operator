const require_frontmatter = require("./frontmatter-WKYeKqrx.cjs");
const require_frontmatter$1 = require("./frontmatter-Ds4xTxGo.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/hooks/frontmatter.ts
/** Parse HOOK.md frontmatter into the generic hook frontmatter record. */
function parseFrontmatter(content) {
	return require_frontmatter.parseFrontmatterBlock(content);
}
function parseInstallSpec(input) {
	const parsed = require_frontmatter$1.parseOperatorManifestInstallBase(input, [
		"bundled",
		"npm",
		"git"
	]);
	if (!parsed) return;
	const { raw } = parsed;
	const spec = require_frontmatter$1.applyOperatorManifestInstallCommonFields({ kind: parsed.kind }, parsed);
	if (typeof raw.package === "string") spec.package = raw.package;
	if (typeof raw.repository === "string") spec.repository = raw.repository;
	return spec;
}
/** Resolve Operator hook metadata from the manifest block in HOOK.md frontmatter. */
function resolveOperatorMetadata(frontmatter) {
	const metadataObj = require_frontmatter$1.resolveOperatorManifestBlock({ frontmatter });
	if (!metadataObj) return;
	const requires = require_frontmatter$1.resolveOperatorManifestRequires(metadataObj);
	const install = require_frontmatter$1.resolveOperatorManifestInstall(metadataObj, parseInstallSpec);
	const osRaw = require_frontmatter$1.resolveOperatorManifestOs(metadataObj);
	const eventsRaw = require_frontmatter$1.normalizeStringList(metadataObj.events);
	return {
		always: typeof metadataObj.always === "boolean" ? metadataObj.always : void 0,
		emoji: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(metadataObj.emoji),
		homepage: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(metadataObj.homepage),
		hookKey: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(metadataObj.hookKey),
		export: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(metadataObj.export),
		os: osRaw.length > 0 ? osRaw : void 0,
		events: eventsRaw.length > 0 ? eventsRaw : [],
		requires,
		install: install.length > 0 ? install : void 0
	};
}
/** Resolve invocation policy from top-level hook frontmatter flags. */
function resolveHookInvocationPolicy(frontmatter) {
	return { enabled: require_frontmatter$1.parseFrontmatterBool(require_frontmatter$1.getFrontmatterString(frontmatter, "enabled"), true) };
}
/** Resolve the config key for a hook, honoring metadata hookKey overrides. */
function resolveHookKey(hookName, entry) {
	return entry?.metadata?.hookKey ?? hookName;
}
//#endregion
Object.defineProperty(exports, "parseFrontmatter", {
	enumerable: true,
	get: function() {
		return parseFrontmatter;
	}
});
Object.defineProperty(exports, "resolveHookInvocationPolicy", {
	enumerable: true,
	get: function() {
		return resolveHookInvocationPolicy;
	}
});
Object.defineProperty(exports, "resolveHookKey", {
	enumerable: true,
	get: function() {
		return resolveHookKey;
	}
});
Object.defineProperty(exports, "resolveOperatorMetadata", {
	enumerable: true,
	get: function() {
		return resolveOperatorMetadata;
	}
});
