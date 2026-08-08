const require_network_interfaces = require("./network-interfaces-DxcNwPUn.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_net_policy_ip = require("@gabrielvfonseca/net-policy/ip");
//#region src/infra/tailnet.ts
const TAILNET_IPV4_CIDR = "100.64.0.0/10";
const TAILNET_IPV6_CIDR = "fd7a:115c:a1e0::/48";
/** Returns true when an address is inside Tailscale's CGNAT IPv4 range. */
function isTailnetIPv4(address) {
	return (0, _gabrielvfonseca_net_policy_ip.isIpInCidr)(address, TAILNET_IPV4_CIDR);
}
function isTailnetIPv6(address) {
	return (0, _gabrielvfonseca_net_policy_ip.isIpInCidr)(address, TAILNET_IPV6_CIDR);
}
/** Lists unique Tailscale IPv4/IPv6 addresses from local external interfaces. */
function listTailnetAddresses() {
	const ipv4 = [];
	const ipv6 = [];
	for (const { address, family } of require_network_interfaces.listExternalInterfaceAddresses(require_network_interfaces.readNetworkInterfaces())) {
		if (family === "IPv4" && isTailnetIPv4(address)) ipv4.push(address);
		if (family === "IPv6" && isTailnetIPv6(address)) ipv6.push(address);
	}
	return {
		ipv4: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(ipv4),
		ipv6: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(ipv6)
	};
}
/** Returns the first discovered Tailscale IPv4 address, if any. */
function pickPrimaryTailnetIPv4() {
	return listTailnetAddresses().ipv4[0];
}
/** Returns the first discovered Tailscale IPv6 address, if any. */
function pickPrimaryTailnetIPv6() {
	return listTailnetAddresses().ipv6[0];
}
//#endregion
Object.defineProperty(exports, "isTailnetIPv4", {
	enumerable: true,
	get: function() {
		return isTailnetIPv4;
	}
});
Object.defineProperty(exports, "pickPrimaryTailnetIPv4", {
	enumerable: true,
	get: function() {
		return pickPrimaryTailnetIPv4;
	}
});
Object.defineProperty(exports, "pickPrimaryTailnetIPv6", {
	enumerable: true,
	get: function() {
		return pickPrimaryTailnetIPv6;
	}
});
