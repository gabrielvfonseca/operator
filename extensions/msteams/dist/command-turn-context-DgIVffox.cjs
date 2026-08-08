let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/command-turn-context.ts
/** Command-source normalization for native slash commands, text slash commands, and plain messages. */
function resolveCommandBody(input) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.CommandBody) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.BodyForCommands) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.RawBody) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.Body);
}
function parseCommandName(body) {
	if (!body?.startsWith("/")) return;
	const name = body.slice(1).split(/\s+/, 1)[0]?.split("@", 1)[0];
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(name);
}
/** Maps the internal turn discriminator to the source value used by downstream routing. */
function commandTurnKindToSource(kind) {
	if (kind === "native") return "native";
	if (kind === "text-slash") return "text";
	return "message";
}
function normalizeCommandTurnKind(value) {
	return value === "native" || value === "text-slash" || value === "normal" ? value : void 0;
}
function normalizeCommandTurnSource(value) {
	return value === "native" || value === "text" || value === "message" ? value : void 0;
}
/** Maps source metadata back to the closed turn kind used by command checks. */
function commandTurnSourceToKind(source) {
	if (source === "native") return "native";
	if (source === "text") return "text-slash";
	return "normal";
}
/** Builds a normalized command-turn context and forces normal messages to unauthorized. */
function createCommandTurnContext(source, input) {
	if (source === "native") return {
		kind: "native",
		source: "native",
		authorized: input.authorized,
		commandName: input.commandName,
		body: input.body
	};
	if (source === "text") return {
		kind: "text-slash",
		source: "text",
		authorized: input.authorized,
		commandName: input.commandName,
		body: input.body
	};
	return {
		kind: "normal",
		source: "message",
		authorized: false,
		commandName: input.commandName,
		body: input.body
	};
}
function normalizeExplicitCommandTurn(value, input) {
	if (!value || typeof value !== "object") return;
	const record = value;
	const kind = normalizeCommandTurnKind(record.kind);
	const source = normalizeCommandTurnSource(record.source) ?? (kind ? commandTurnKindToSource(kind) : void 0);
	const resolvedKind = kind ?? (source ? commandTurnSourceToKind(source) : void 0);
	if (kind && source && commandTurnKindToSource(kind) !== source) return;
	if (!resolvedKind || !source) return;
	const body = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.body) ?? resolveCommandBody(input);
	return createCommandTurnContext(source, {
		authorized: resolvedKind === "normal" ? false : typeof record.authorized === "boolean" ? record.authorized : input.CommandAuthorized === true,
		commandName: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.commandName) ?? parseCommandName(body),
		body
	});
}
/** Normalizes command metadata with a legacy body fallback for older channel contexts. */
function resolveCommandTurnContext(input) {
	const explicit = normalizeExplicitCommandTurn(input.CommandTurn, input);
	if (explicit) return explicit;
	const source = input.CommandSource === "native" ? "native" : input.CommandSource === "text" ? "text" : "message";
	const body = resolveCommandBody(input);
	return createCommandTurnContext(source, {
		authorized: commandTurnSourceToKind(source) === "normal" ? false : input.CommandAuthorized === true,
		commandName: parseCommandName(body),
		body
	});
}
/** Returns true for channel-native command turns. */
function isNativeCommandTurn(commandTurn) {
	return commandTurn?.kind === "native";
}
function isAuthorizedTextSlashCommandTurn(commandTurn) {
	return commandTurn?.kind === "text-slash" && commandTurn.authorized;
}
/** Returns true when a turn was explicitly invoked by a native or authorized text command. */
function isExplicitCommandTurn(commandTurn) {
	return commandTurn?.kind === "native" || commandTurn?.kind === "text-slash" && commandTurn.authorized;
}
/** Resolves the target session override allowed only for native command invocations. */
function resolveCommandTurnTargetSessionKey(input) {
	if (!isNativeCommandTurn(resolveCommandTurnContext(input)) || typeof input.CommandTargetSessionKey !== "string") return;
	const trimmed = input.CommandTargetSessionKey.trim();
	return trimmed.length > 0 ? trimmed : void 0;
}
//#endregion
Object.defineProperty(exports, "commandTurnKindToSource", {
	enumerable: true,
	get: function() {
		return commandTurnKindToSource;
	}
});
Object.defineProperty(exports, "createCommandTurnContext", {
	enumerable: true,
	get: function() {
		return createCommandTurnContext;
	}
});
Object.defineProperty(exports, "isAuthorizedTextSlashCommandTurn", {
	enumerable: true,
	get: function() {
		return isAuthorizedTextSlashCommandTurn;
	}
});
Object.defineProperty(exports, "isExplicitCommandTurn", {
	enumerable: true,
	get: function() {
		return isExplicitCommandTurn;
	}
});
Object.defineProperty(exports, "isNativeCommandTurn", {
	enumerable: true,
	get: function() {
		return isNativeCommandTurn;
	}
});
Object.defineProperty(exports, "resolveCommandTurnContext", {
	enumerable: true,
	get: function() {
		return resolveCommandTurnContext;
	}
});
Object.defineProperty(exports, "resolveCommandTurnTargetSessionKey", {
	enumerable: true,
	get: function() {
		return resolveCommandTurnTargetSessionKey;
	}
});
