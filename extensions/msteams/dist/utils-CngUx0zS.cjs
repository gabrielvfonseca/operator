//#region src/agents/embedded-agent-runner/utils.ts
function normalizeContextTokenBudget(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : void 0;
}
/** Converts logical product modes into provider-facing effort values. */
function mapThinkingLevelForProvider(level) {
	return level === "ultra" ? "max" : level;
}
function mapThinkingLevel(level) {
	const providerLevel = mapThinkingLevelForProvider(level);
	if (!providerLevel) return "off";
	if (providerLevel === "adaptive") return "high";
	return providerLevel;
}
//#endregion
Object.defineProperty(exports, "mapThinkingLevel", {
	enumerable: true,
	get: function() {
		return mapThinkingLevel;
	}
});
Object.defineProperty(exports, "mapThinkingLevelForProvider", {
	enumerable: true,
	get: function() {
		return mapThinkingLevelForProvider;
	}
});
Object.defineProperty(exports, "normalizeContextTokenBudget", {
	enumerable: true,
	get: function() {
		return normalizeContextTokenBudget;
	}
});
