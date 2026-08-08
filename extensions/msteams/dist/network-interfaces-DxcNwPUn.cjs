const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
//#region src/infra/network-interfaces.ts
function normalizeNetworkInterfaceFamily(family) {
	if (family === "IPv4" || family === 4) return "IPv4";
	if (family === "IPv6" || family === 6) return "IPv6";
}
/** Reads the current network interface snapshot, allowing tests to inject a reader. */
function readNetworkInterfaces(networkInterfaces = node_os.default.networkInterfaces) {
	return networkInterfaces();
}
/** Best-effort interface read that returns undefined when OS inspection fails. */
function safeNetworkInterfaces(networkInterfaces = node_os.default.networkInterfaces) {
	try {
		return readNetworkInterfaces(networkInterfaces);
	} catch {
		return;
	}
}
/** Lists non-internal interface addresses, optionally filtered by IP family. */
function listExternalInterfaceAddresses(snapshot, family) {
	const addresses = [];
	if (!snapshot) return addresses;
	for (const [name, entries] of Object.entries(snapshot)) {
		if (!entries) continue;
		for (const entry of entries) {
			if (!entry || entry.internal) continue;
			const address = entry.address?.trim();
			if (!address) continue;
			const entryFamily = normalizeNetworkInterfaceFamily(entry.family);
			if (!entryFamily || family && entryFamily !== family) continue;
			addresses.push({
				name,
				address,
				family: entryFamily
			});
		}
	}
	return addresses;
}
/** Picks a matching external address, honoring preferred interface names first. */
function pickMatchingExternalInterfaceAddress(snapshot, params) {
	const { family, preferredNames = [], matches = () => true } = params;
	const addresses = listExternalInterfaceAddresses(snapshot, family);
	for (const name of preferredNames) {
		const preferred = addresses.find((entry) => entry.name === name && matches(entry.address));
		if (preferred) return preferred.address;
	}
	return addresses.find((entry) => matches(entry.address))?.address;
}
//#endregion
Object.defineProperty(exports, "listExternalInterfaceAddresses", {
	enumerable: true,
	get: function() {
		return listExternalInterfaceAddresses;
	}
});
Object.defineProperty(exports, "pickMatchingExternalInterfaceAddress", {
	enumerable: true,
	get: function() {
		return pickMatchingExternalInterfaceAddress;
	}
});
Object.defineProperty(exports, "readNetworkInterfaces", {
	enumerable: true,
	get: function() {
		return readNetworkInterfaces;
	}
});
Object.defineProperty(exports, "safeNetworkInterfaces", {
	enumerable: true,
	get: function() {
		return safeNetworkInterfaces;
	}
});
