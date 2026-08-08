//#region src/secrets/runtime-web-tools-state.ts
let activeRuntimeWebToolsMetadata = null;
/**
* Clears active web-tool metadata when the secrets runtime snapshot is reset.
*/
function clearActiveRuntimeWebToolsMetadata() {
	activeRuntimeWebToolsMetadata = null;
}
/**
* Stores web-tool metadata with clone isolation from caller-owned objects.
*/
function setActiveRuntimeWebToolsMetadata(metadata) {
	activeRuntimeWebToolsMetadata = structuredClone(metadata);
}
/**
* Returns active web-tool metadata without exposing mutable runtime state.
*/
function getActiveRuntimeWebToolsMetadata() {
	if (!activeRuntimeWebToolsMetadata) return null;
	return structuredClone(activeRuntimeWebToolsMetadata);
}
//#endregion
Object.defineProperty(exports, "clearActiveRuntimeWebToolsMetadata", {
	enumerable: true,
	get: function() {
		return clearActiveRuntimeWebToolsMetadata;
	}
});
Object.defineProperty(exports, "getActiveRuntimeWebToolsMetadata", {
	enumerable: true,
	get: function() {
		return getActiveRuntimeWebToolsMetadata;
	}
});
Object.defineProperty(exports, "setActiveRuntimeWebToolsMetadata", {
	enumerable: true,
	get: function() {
		return setActiveRuntimeWebToolsMetadata;
	}
});
