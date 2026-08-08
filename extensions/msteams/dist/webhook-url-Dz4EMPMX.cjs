let _gabrielvfonseca_net_policy_url_protocol = require("@gabrielvfonseca/net-policy/url-protocol");
//#region src/cron/webhook-url.ts
/** Normalizes cron webhook URLs while rejecting empty, malformed, and non-HTTP(S) values. */
function normalizeHttpWebhookUrl(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (!(0, _gabrielvfonseca_net_policy_url_protocol.isHttpUrl)(trimmed)) return null;
	return trimmed;
}
//#endregion
Object.defineProperty(exports, "normalizeHttpWebhookUrl", {
	enumerable: true,
	get: function() {
		return normalizeHttpWebhookUrl;
	}
});
