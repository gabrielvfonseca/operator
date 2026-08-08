require("./zod-schema.core-B7xBEBon.cjs");
const require_schema_validator = require("./schema-validator-pDawCDK6.cjs");
const require_path_array_index = require("./path-array-index-C9RRFl-Q.cjs");
let zod = require("zod");
//#region src/channels/plugins/config-schema.ts
/**
* Channel config schema helpers.
*
* Builds common zod/JSON schema shapes and parses runtime config issues for channel plugins.
*/
/** Shared allowlist entry shape for channel sender/user ids. */
const AllowFromEntrySchema = zod.z.union([zod.z.string(), zod.z.number()]);
zod.z.array(AllowFromEntrySchema).optional();
function cloneRuntimeIssue(issue) {
	const record = issue && typeof issue === "object" ? issue : {};
	const path = Array.isArray(record.path) ? record.path.filter((segment) => {
		const kind = typeof segment;
		return kind === "string" || kind === "number";
	}) : void 0;
	return {
		...record,
		...path ? { path } : {}
	};
}
function safeParseRuntimeSchema(schema, value) {
	const result = schema.safeParse(value);
	if (result.success) return {
		success: true,
		data: result.data
	};
	return {
		success: false,
		issues: result.error.issues.map((issue) => cloneRuntimeIssue(issue))
	};
}
function toIssuePath(path) {
	if (!path || path === "<root>") return [];
	return path.split(".").map((segment) => {
		return require_path_array_index.parseConfigPathArrayIndex(segment) ?? segment;
	});
}
function safeParseJsonSchema(schema, cacheKey, value) {
	const result = require_schema_validator.validateJsonSchemaValue({
		schema,
		cacheKey,
		value,
		applyDefaults: true
	});
	if (result.ok) return {
		success: true,
		data: result.value
	};
	return {
		success: false,
		issues: result.errors.map((issue) => ({
			path: toIssuePath(issue.path),
			message: issue.message
		}))
	};
}
/** Build a channel config schema from JSON Schema with runtime validation/default support. */
function buildJsonChannelConfigSchema(schema, options) {
	return {
		schema,
		...options?.uiHints ? { uiHints: options.uiHints } : {},
		runtime: options?.runtime ?? { safeParse: (value) => safeParseJsonSchema(schema, options?.cacheKey ?? "channel-config-schema:json", value) }
	};
}
/** Build a channel config schema from Zod, exporting JSON Schema when available. */
function buildChannelConfigSchema(schema, options) {
	const schemaWithJson = schema;
	if (typeof schemaWithJson.toJSONSchema === "function") return {
		schema: schemaWithJson.toJSONSchema({
			target: "draft-07",
			...options?.jsonSchemaMode ? { io: options.jsonSchemaMode } : {},
			unrepresentable: "any"
		}),
		...options?.uiHints ? { uiHints: options.uiHints } : {},
		runtime: { safeParse: (value) => safeParseRuntimeSchema(schema, value) }
	};
	return {
		schema: {
			type: "object",
			additionalProperties: true
		},
		...options?.uiHints ? { uiHints: options.uiHints } : {},
		runtime: { safeParse: (value) => safeParseRuntimeSchema(schema, value) }
	};
}
/** Return a channel config schema for channels that intentionally accept no config keys. */
function emptyChannelConfigSchema() {
	return {
		schema: {
			type: "object",
			additionalProperties: false,
			properties: {}
		},
		runtime: { safeParse(value) {
			if (value === void 0) return {
				success: true,
				data: void 0
			};
			if (!value || typeof value !== "object" || Array.isArray(value)) return {
				success: false,
				issues: [{
					path: [],
					message: "expected config object"
				}]
			};
			if (Object.keys(value).length > 0) return {
				success: false,
				issues: [{
					path: [],
					message: "config must be empty"
				}]
			};
			return {
				success: true,
				data: value
			};
		} }
	};
}
//#endregion
Object.defineProperty(exports, "buildChannelConfigSchema", {
	enumerable: true,
	get: function() {
		return buildChannelConfigSchema;
	}
});
Object.defineProperty(exports, "buildJsonChannelConfigSchema", {
	enumerable: true,
	get: function() {
		return buildJsonChannelConfigSchema;
	}
});
Object.defineProperty(exports, "emptyChannelConfigSchema", {
	enumerable: true,
	get: function() {
		return emptyChannelConfigSchema;
	}
});
