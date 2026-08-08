const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
//#region src/agents/sessions/source-info.ts
/** Converts package-manager path metadata into the session source-info shape. */
function createSourceInfo(path, metadata) {
	return {
		path,
		source: metadata.source,
		scope: metadata.scope,
		origin: metadata.origin,
		baseDir: metadata.baseDir
	};
}
/** Builds source metadata for generated or synthetic session entries. */
function createSyntheticSourceInfo(path, options) {
	return {
		path,
		source: options.source,
		scope: options.scope ?? "temporary",
		origin: options.origin ?? "top-level",
		baseDir: options.baseDir
	};
}
//#endregion
//#region src/skills/loading/skill-version.ts
function computeSkillPromptVersion(content) {
	return `sha256:${require_crypto_digest.sha256HexPrefix(content, 16)}`;
}
//#endregion
Object.defineProperty(exports, "computeSkillPromptVersion", {
	enumerable: true,
	get: function() {
		return computeSkillPromptVersion;
	}
});
Object.defineProperty(exports, "createSourceInfo", {
	enumerable: true,
	get: function() {
		return createSourceInfo;
	}
});
Object.defineProperty(exports, "createSyntheticSourceInfo", {
	enumerable: true,
	get: function() {
		return createSyntheticSourceInfo;
	}
});
