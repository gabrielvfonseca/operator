let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/chat-type.ts
/**
* Channel conversation kind normalization.
*
* Maps channel-specific direct/group/channel labels into Operator chat types.
*/
/**
* Normalizes channel-specific chat type labels into Operator conversation kinds.
*/
function normalizeChatType(raw) {
	const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (!value) return;
	if (value === "direct" || value === "dm") return "direct";
	if (value === "group") return "group";
	if (value === "channel") return "channel";
}
//#endregion
Object.defineProperty(exports, "normalizeChatType", {
	enumerable: true,
	get: function() {
		return normalizeChatType;
	}
});
