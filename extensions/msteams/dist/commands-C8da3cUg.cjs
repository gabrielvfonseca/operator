require("./rolldown-runtime-u92d-OFm.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_commands_list_result = require("./commands-list-result-CZ4ESqjh.cjs");
const require_agent_id_shared = require("./agent-id-shared-D_IljT8b.cjs");
//#region src/gateway/server-methods/commands.ts
/** Gateway handler for enumerating available chat/native commands. */
const commandsHandlers = { "commands.list": ({ params, respond, context }) => {
	if (!require_src.validateCommandsListParams(params)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid commands.list params: ${require_validation_errors.formatValidationErrors(require_src.validateCommandsListParams.errors)}`));
		return;
	}
	const resolved = require_agent_id_shared.resolveAgentIdOrRespondError({
		rawAgentId: params.agentId,
		respond,
		cfg: context.getRuntimeConfig(),
		normalize: (rawAgentId) => typeof rawAgentId === "string" ? rawAgentId.trim() : void 0
	});
	if (!resolved) return;
	respond(true, require_commands_list_result.buildCommandsListResult({
		cfg: resolved.cfg,
		agentId: resolved.agentId,
		provider: params.provider,
		scope: params.scope,
		includeArgs: params.includeArgs
	}), void 0);
} };
//#endregion
exports.buildCommandsListResult = require_commands_list_result.buildCommandsListResult;
exports.commandsHandlers = commandsHandlers;
