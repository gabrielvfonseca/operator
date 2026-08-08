const require_globals = require("./globals-D7PiAd5y.cjs");
const require_command_turn_context = require("./command-turn-context-DgIVffox.cjs");
const require_commands_flags = require("./commands.flags-BZYis-vI.cjs");
const require_redact_identifier = require("./redact-identifier-DrE35Pyt.cjs");
//#region src/auto-reply/reply/command-gates.ts
function buildNativeCommandGateReply(text) {
	return {
		shouldContinue: false,
		reply: { text }
	};
}
function rejectUnauthorizedCommand(params, commandLabel) {
	if (params.command.isAuthorizedSender) return null;
	require_globals.logVerbose(`Ignoring ${commandLabel} from unauthorized sender: ${require_redact_identifier.redactIdentifier(params.command.senderId)}`);
	if (require_command_turn_context.isNativeCommandTurn(require_command_turn_context.resolveCommandTurnContext(params.ctx))) return buildNativeCommandGateReply("You are not authorized to use this command.");
	return { shouldContinue: false };
}
function rejectNonOwnerCommand(params, commandLabel) {
	if (params.command.senderIsOwner) return null;
	require_globals.logVerbose(`Ignoring ${commandLabel} from non-owner sender: ${require_redact_identifier.redactIdentifier(params.command.senderId)}`);
	if (require_command_turn_context.isNativeCommandTurn(require_command_turn_context.resolveCommandTurnContext(params.ctx))) return buildNativeCommandGateReply("You are not authorized to use this command.");
	return { shouldContinue: false };
}
function requireGatewayClientScope(params, config) {
	const scopes = params.ctx.GatewayClientScopes;
	if (!Array.isArray(scopes)) return null;
	if (config.allowedScopes.some((scope) => scopes.includes(scope))) return null;
	require_globals.logVerbose(`Ignoring ${config.label} from gateway client missing scope: ${config.allowedScopes.join(" or ")}`);
	return {
		shouldContinue: false,
		reply: { text: config.missingText }
	};
}
function buildDisabledCommandReply(params) {
	const disabledVerb = params.disabledVerb ?? "is";
	const docsSuffix = params.docsUrl ? ` Docs: ${params.docsUrl}` : "";
	return { text: `⚠️ ${params.label} ${disabledVerb} disabled. Set commands.${params.configKey}=true to enable.${docsSuffix}` };
}
function requireCommandFlagEnabled(cfg, params) {
	if (require_commands_flags.isCommandFlagEnabled(cfg, params.configKey)) return null;
	return {
		shouldContinue: false,
		reply: buildDisabledCommandReply(params)
	};
}
//#endregion
Object.defineProperty(exports, "buildDisabledCommandReply", {
	enumerable: true,
	get: function() {
		return buildDisabledCommandReply;
	}
});
Object.defineProperty(exports, "rejectNonOwnerCommand", {
	enumerable: true,
	get: function() {
		return rejectNonOwnerCommand;
	}
});
Object.defineProperty(exports, "rejectUnauthorizedCommand", {
	enumerable: true,
	get: function() {
		return rejectUnauthorizedCommand;
	}
});
Object.defineProperty(exports, "requireCommandFlagEnabled", {
	enumerable: true,
	get: function() {
		return requireCommandFlagEnabled;
	}
});
Object.defineProperty(exports, "requireGatewayClientScope", {
	enumerable: true,
	get: function() {
		return requireGatewayClientScope;
	}
});
