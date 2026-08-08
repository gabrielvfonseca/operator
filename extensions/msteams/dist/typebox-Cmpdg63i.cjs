require("./channel-target-Djs5HcPj.cjs");
let typebox = require("typebox");
//#region src/agents/schema/string-enum.ts
/**
* Provider-safe TypeBox string enum helpers.
*
* Emits flat `enum` schemas instead of `anyOf` unions so provider tool-schema validators accept them.
*/
function stringEnum(values, options = {}) {
	const enumValues = Array.isArray(values) ? values : values && typeof values === "object" ? Object.values(values).filter((value) => typeof value === "string") : [];
	return enumValues.length === 0 ? typebox.Type.Unsafe({
		type: "string",
		...options
	}) : typebox.Type.Enum(enumValues, {
		type: "string",
		...options
	});
}
function optionalStringEnum(values, options = {}) {
	return typebox.Type.Optional(stringEnum(values, options));
}
//#endregion
//#region src/agents/schema/typebox.ts
/**
* Shared TypeBox schema helpers for agent tools.
*
* Tool definitions use these helpers for channel targets and common optional
* numeric fields so provider-facing schemas stay consistent.
*/
/** Builds a schema for one outbound channel target. */
function channelTargetSchema(options) {
	return typebox.Type.String({ description: options?.description ?? "Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack/Mattermost <channelId|user:ID|channel:ID>, or iMessage handle/chat_id" });
}
/** Builds a schema for multiple outbound channel targets. */
function channelTargetsSchema(options) {
	return typebox.Type.Array(channelTargetSchema({ description: options?.description ?? "Recipient/channel targets (same format as --target); accepts ids or names when the directory is available." }));
}
/** Builds an optional finite number schema with caller-provided metadata. */
function optionalFiniteNumberSchema(options = {}) {
	return typebox.Type.Optional(typebox.Type.Number(options));
}
/** Builds an optional positive integer schema. */
function optionalPositiveIntegerSchema(options = {}) {
	return typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		...options
	}));
}
/** Builds an optional non-negative integer schema. */
function optionalNonNegativeIntegerSchema(options = {}) {
	return typebox.Type.Optional(typebox.Type.Integer({
		minimum: 0,
		...options
	}));
}
//#endregion
Object.defineProperty(exports, "channelTargetSchema", {
	enumerable: true,
	get: function() {
		return channelTargetSchema;
	}
});
Object.defineProperty(exports, "channelTargetsSchema", {
	enumerable: true,
	get: function() {
		return channelTargetsSchema;
	}
});
Object.defineProperty(exports, "optionalFiniteNumberSchema", {
	enumerable: true,
	get: function() {
		return optionalFiniteNumberSchema;
	}
});
Object.defineProperty(exports, "optionalNonNegativeIntegerSchema", {
	enumerable: true,
	get: function() {
		return optionalNonNegativeIntegerSchema;
	}
});
Object.defineProperty(exports, "optionalPositiveIntegerSchema", {
	enumerable: true,
	get: function() {
		return optionalPositiveIntegerSchema;
	}
});
Object.defineProperty(exports, "optionalStringEnum", {
	enumerable: true,
	get: function() {
		return optionalStringEnum;
	}
});
Object.defineProperty(exports, "stringEnum", {
	enumerable: true,
	get: function() {
		return stringEnum;
	}
});
