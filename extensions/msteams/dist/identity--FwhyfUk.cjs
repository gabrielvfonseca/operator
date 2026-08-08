const require_identity = require("./identity-Dv2mhJl0.cjs");
const require_identity_avatar = require("./identity-avatar-CUd-0EuL.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/identity.ts
/** Trims outbound identity fields and drops empty identity payloads. */
function normalizeOutboundIdentity(identity) {
	if (!identity) return;
	const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(identity.name);
	const avatarUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(identity.avatarUrl);
	const emoji = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(identity.emoji);
	const theme = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(identity.theme);
	if (!name && !avatarUrl && !emoji && !theme) return;
	return {
		name,
		avatarUrl,
		emoji,
		theme
	};
}
/** Resolves an agent's configured identity into channel-safe outbound metadata. */
function resolveAgentOutboundIdentity(cfg, agentId) {
	const agentIdentity = require_identity.resolveAgentIdentity(cfg, agentId);
	const avatar = require_identity_avatar.resolveAgentAvatar(cfg, agentId);
	return normalizeOutboundIdentity({
		name: agentIdentity?.name,
		emoji: agentIdentity?.emoji,
		avatarUrl: avatar.kind === "remote" ? avatar.url : void 0,
		theme: agentIdentity?.theme
	});
}
//#endregion
Object.defineProperty(exports, "resolveAgentOutboundIdentity", {
	enumerable: true,
	get: function() {
		return resolveAgentOutboundIdentity;
	}
});
