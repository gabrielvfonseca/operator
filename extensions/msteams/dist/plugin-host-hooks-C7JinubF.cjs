require("./rolldown-runtime-u92d-OFm.cjs");
const require_schema_validator = require("./schema-validator-pDawCDK6.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_host_hook_json = require("./host-hook-json-BhDT-UAu.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/server-methods/plugin-host-hooks.ts
const log = require_subsystem.createSubsystemLogger("gateway/plugin-host-hooks");
function formatSessionActionPayloadSchemaErrors(errors) {
	return errors.map((error) => error.text).join("; ");
}
/** Ensures plugin action result extension fields stay JSON-compatible on the wire. */
function validatePluginSessionActionJsonFields(result) {
	for (const field of [
		"result",
		"reply",
		"details"
	]) if (result[field] !== void 0 && !require_host_hook_json.isPluginJsonValue(result[field])) return `plugin session action ${field} must be JSON-compatible`;
}
/** Gateway handlers for plugin-declared Control UI descriptors and session actions. */
const pluginHostHookHandlers = {
	"plugins.uiDescriptors": ({ params, respond }) => {
		if (!require_src.validatePluginsUiDescriptorsParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid plugins.uiDescriptors params: ${require_validation_errors.formatValidationErrors(require_src.validatePluginsUiDescriptorsParams.errors)}`));
			return;
		}
		const result = {
			ok: true,
			descriptors: (require_runtime.getActivePluginRegistry()?.controlUiDescriptors ?? []).map((entry) => {
				const descriptor = {
					id: entry.descriptor.id,
					pluginId: entry.pluginId,
					pluginName: entry.pluginName,
					surface: entry.descriptor.surface,
					label: entry.descriptor.label
				};
				if (entry.descriptor.description !== void 0) descriptor.description = entry.descriptor.description;
				if (entry.descriptor.placement !== void 0) descriptor.placement = entry.descriptor.placement;
				if (entry.descriptor.schema !== void 0) descriptor.schema = entry.descriptor.schema;
				if (entry.descriptor.requiredScopes !== void 0) descriptor.requiredScopes = entry.descriptor.requiredScopes;
				return descriptor;
			})
		};
		if (!require_src.validatePluginsUiDescriptorsResult(result)) {
			log.warn("invalid plugins.uiDescriptors result", { errors: require_src.validatePluginsUiDescriptorsResult.errors });
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `invalid plugins.uiDescriptors result: ${require_validation_errors.formatValidationErrors(require_src.validatePluginsUiDescriptorsResult.errors)}`));
			return;
		}
		respond(true, result, void 0);
	},
	"plugins.sessionAction": async ({ params, client, respond }) => {
		if (!require_src.validatePluginsSessionActionParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid plugins.sessionAction params: ${require_validation_errors.formatValidationErrors(require_src.validatePluginsSessionActionParams.errors)}`));
			return;
		}
		const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.pluginId);
		const actionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.actionId);
		const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
		if (!pluginId || !actionId) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "plugins.sessionAction pluginId and actionId must be non-empty"));
			return;
		}
		const registry = require_runtime.getActivePluginRegistry();
		const pluginLoaded = Boolean(registry?.plugins.some((plugin) => plugin.id === pluginId && plugin.status === "loaded"));
		const registration = (registry?.sessionActions ?? []).find((entry) => entry.pluginId === pluginId && entry.action.id === actionId);
		if (!registration || !pluginLoaded) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `unknown plugin session action: ${pluginId}/${actionId}`));
			return;
		}
		const scopes = Array.isArray(client?.connect.scopes) ? client.connect.scopes : [];
		const hasAdmin = scopes.includes(require_operator_scopes.ADMIN_SCOPE);
		const missingScope = (registration.action.requiredScopes && registration.action.requiredScopes.length > 0 ? registration.action.requiredScopes : [require_operator_scopes.WRITE_SCOPE]).find((scope) => !hasAdmin && !scopes.includes(scope) && !(scope === "operator.read" && scopes.includes("operator.write")));
		if (missingScope) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `missing scope: ${missingScope}`));
			return;
		}
		try {
			if (params.payload !== void 0 && !require_host_hook_json.isPluginJsonValue(params.payload)) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "plugin session action payload must be JSON-compatible"));
				return;
			}
			if (registration.action.schema !== void 0) {
				if (typeof registration.action.schema !== "boolean" && !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(registration.action.schema)) {
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "plugin session action schema must be an object or boolean"));
					return;
				}
				const validation = require_schema_validator.validateJsonSchemaValue({
					schema: registration.action.schema,
					cacheKey: `plugin-session-action:${pluginId}:${actionId}`,
					value: params.payload
				});
				if (!validation.ok) {
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `plugin session action payload does not match schema: ${formatSessionActionPayloadSchemaErrors(validation.errors)}`));
					return;
				}
			}
			const result = await registration.action.handler({
				pluginId,
				actionId,
				...sessionKey ? { sessionKey } : {},
				...params.payload !== void 0 ? { payload: params.payload } : {},
				client: {
					...client?.connId ? { connId: client.connId } : {},
					scopes: [...scopes]
				}
			});
			if (result !== void 0 && !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(result)) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "plugin session action result must be an object"));
				return;
			}
			const wireResult = result?.ok === false ? result : {
				ok: true,
				...result
			};
			if (!require_src.validatePluginsSessionActionResult(wireResult)) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid plugin session action result: ${require_validation_errors.formatValidationErrors(require_src.validatePluginsSessionActionResult.errors)}`));
				return;
			}
			const jsonFieldError = result ? validatePluginSessionActionJsonFields(result) : void 0;
			if (jsonFieldError) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, jsonFieldError));
				return;
			}
			if (!wireResult.ok) {
				respond(true, {
					ok: false,
					error: wireResult.error,
					...wireResult.code !== void 0 ? { code: wireResult.code } : {},
					...wireResult.details !== void 0 ? { details: wireResult.details } : {}
				}, void 0);
				return;
			}
			respond(true, {
				ok: true,
				...wireResult.result !== void 0 ? { result: wireResult.result } : {},
				...wireResult.continueAgent !== void 0 ? { continueAgent: wireResult.continueAgent } : {},
				...wireResult.reply !== void 0 ? { reply: wireResult.reply } : {}
			});
		} catch (error) {
			log.warn(`plugin session action failed plugin=${pluginId} action=${actionId}: ${require_errors.formatErrorMessage(error)}`);
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "plugin session action failed"));
		}
	}
};
//#endregion
exports.pluginHostHookHandlers = pluginHostHookHandlers;
