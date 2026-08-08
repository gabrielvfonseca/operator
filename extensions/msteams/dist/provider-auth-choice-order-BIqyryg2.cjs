//#region src/plugins/provider-auth-choice-order.ts
const FEATURED_PROVIDER_AUTH_GROUP_ORDER = /* @__PURE__ */ new Map([
	["openrouter", 0],
	["openai", 1],
	["xai", 2],
	["google", 3],
	["anthropic", 4]
]);
/** Keep native and CLI onboarding on one first-tier provider order. */
function isFeaturedProviderAuthChoiceGroup(groupId) {
	return FEATURED_PROVIDER_AUTH_GROUP_ORDER.has(groupId);
}
function compareProviderAuthChoiceGroups(a, b) {
	return (FEATURED_PROVIDER_AUTH_GROUP_ORDER.get(a.id) ?? Number.POSITIVE_INFINITY) - (FEATURED_PROVIDER_AUTH_GROUP_ORDER.get(b.id) ?? Number.POSITIVE_INFINITY) || a.label.localeCompare(b.label, void 0, { sensitivity: "base" }) || a.id.localeCompare(b.id, void 0, { sensitivity: "base" });
}
//#endregion
Object.defineProperty(exports, "compareProviderAuthChoiceGroups", {
	enumerable: true,
	get: function() {
		return compareProviderAuthChoiceGroups;
	}
});
Object.defineProperty(exports, "isFeaturedProviderAuthChoiceGroup", {
	enumerable: true,
	get: function() {
		return isFeaturedProviderAuthChoiceGroup;
	}
});
