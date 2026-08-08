function parseActiveManagedProxyLoopbackMode(value) {
	if (value === "gateway-only" || value === "proxy" || value === "block") return value;
}
function readInheritedActiveManagedProxyLoopbackMode() {
	if (process.env["OPERATOR_PROXY_ACTIVE"] !== "1") return;
	return parseActiveManagedProxyLoopbackMode(process.env["OPERATOR_PROXY_LOOPBACK_MODE"]) ?? "gateway-only";
}
/** Returns local loopback policy from in-process state or inherited proxy env. */
function getActiveManagedProxyLoopbackMode() {
	return readInheritedActiveManagedProxyLoopbackMode();
}
/** Returns the in-process managed proxy URL, if this process owns the proxy. */
function getActiveManagedProxyUrl() {}
/** Returns the active managed proxy TLS options used by undici/proxyline dispatchers. */
function getActiveManagedProxyTlsOptions() {}
//#endregion
Object.defineProperty(exports, "getActiveManagedProxyLoopbackMode", {
	enumerable: true,
	get: function() {
		return getActiveManagedProxyLoopbackMode;
	}
});
Object.defineProperty(exports, "getActiveManagedProxyTlsOptions", {
	enumerable: true,
	get: function() {
		return getActiveManagedProxyTlsOptions;
	}
});
Object.defineProperty(exports, "getActiveManagedProxyUrl", {
	enumerable: true,
	get: function() {
		return getActiveManagedProxyUrl;
	}
});
