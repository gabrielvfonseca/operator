require("./rolldown-runtime-u92d-OFm.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_conversation_read_origin = require("./conversation-read-origin-3ZbHjVeu.cjs");
const require_tools_invoke_shared = require("./tools-invoke-shared-7YK_P9ZO.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/server-methods/tools-invoke.ts
/**
* RPC adapter for invoking gateway-visible tools from connected clients.
*/
function resolveRpcErrorCode(params) {
	if (params.requiresApproval) return "requires_approval";
	switch (params.type) {
		case "invalid_request": return "validation_error";
		case "not_found": return "not_found";
		case "tool_call_blocked": return "forbidden";
		case "tool_error": return "internal_error";
	}
	return "internal_error";
}
/** Handles `tools.invoke` with protocol-shaped success and failure payloads. */
const toolsInvokeHandlers = { "tools.invoke": async ({ params, respond, context, client }) => {
	if (!require_src.validateToolsInvokeParams(params)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid tools.invoke params: ${require_validation_errors.formatValidationErrors(require_src.validateToolsInvokeParams.errors)}`));
		return;
	}
	const requestedToolName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.name);
	if (!requestedToolName) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid tools.invoke params: name required"));
		return;
	}
	const outcome = await require_tools_invoke_shared.invokeGatewayTool({
		cfg: context.getRuntimeConfig(),
		input: params,
		senderIsOwner: client?.connect?.scopes?.includes("operator.admin"),
		clientCaps: client?.connect?.caps,
		conversationReadOrigin: require_conversation_read_origin.resolveGatewayConversationReadOrigin({
			client,
			requestedOrigin: params.conversationReadOrigin
		}),
		toolCallIdPrefix: "rpc",
		approvalMode: params.confirm === true ? "request" : "report"
	});
	if (outcome.ok) {
		respond(true, {
			ok: true,
			toolName: outcome.toolName,
			output: outcome.result,
			source: outcome.source
		}, void 0);
		return;
	}
	respond(true, {
		ok: false,
		toolName: outcome.toolName || requestedToolName,
		...outcome.error.requiresApproval ? { requiresApproval: true } : {},
		error: {
			code: resolveRpcErrorCode(outcome.error),
			message: outcome.error.message
		}
	}, void 0);
} };
//#endregion
exports.toolsInvokeHandlers = toolsInvokeHandlers;
