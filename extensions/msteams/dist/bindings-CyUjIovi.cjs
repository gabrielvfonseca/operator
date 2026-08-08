//#region src/config/bindings.ts
function normalizeBindingType(binding) {
	return binding.type === "acp" ? "acp" : "route";
}
/** Narrows a configured binding to the channel route form. */
function isRouteBinding(binding) {
	return normalizeBindingType(binding) === "route";
}
function isAcpBinding(binding) {
	return normalizeBindingType(binding) === "acp";
}
/** Returns the configured binding list, treating missing/non-array config as empty. */
function listConfiguredBindings(cfg) {
	return Array.isArray(cfg.bindings) ? cfg.bindings : [];
}
/** Lists channel route bindings, including legacy bindings without an explicit type. */
function listRouteBindings(cfg) {
	return listConfiguredBindings(cfg).filter(isRouteBinding);
}
/** Lists ACP conversation bindings only. */
function listAcpBindings(cfg) {
	return listConfiguredBindings(cfg).filter(isAcpBinding);
}
//#endregion
Object.defineProperty(exports, "isRouteBinding", {
	enumerable: true,
	get: function() {
		return isRouteBinding;
	}
});
Object.defineProperty(exports, "listAcpBindings", {
	enumerable: true,
	get: function() {
		return listAcpBindings;
	}
});
Object.defineProperty(exports, "listConfiguredBindings", {
	enumerable: true,
	get: function() {
		return listConfiguredBindings;
	}
});
Object.defineProperty(exports, "listRouteBindings", {
	enumerable: true,
	get: function() {
		return listRouteBindings;
	}
});
