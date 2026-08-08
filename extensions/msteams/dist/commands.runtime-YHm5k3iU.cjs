require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_bootstrap_cache = require("./bootstrap-cache-CaqmJxMO.cjs");
const require_cli_session = require("./cli-session-CX50GYdw.cjs");
const require_commands_registry = require("./commands-registry-BvZ3TCTG.cjs");
const require_commands_reset_mode = require("./commands-reset-mode-DndD8dZI.cjs");
const require_targets = require("./targets-CAV0R_ib.cjs");
const require_commands_reset_hooks = require("./commands-reset-hooks-BhnetMeY.cjs");
const require_commands_status = require("./commands-status-kk5qpwsX.cjs");
const require_reset_authorization = require("./reset-authorization-D1VOY7ru.cjs");
//#region src/channels/plugins/stateful-target-drivers.ts
const registeredStatefulBindingTargetDrivers = /* @__PURE__ */ new Map();
function listStatefulBindingTargetDrivers() {
	return [...registeredStatefulBindingTargetDrivers.values()];
}
function registerStatefulBindingTargetDriver(driver) {
	const id = driver.id.trim();
	if (!id) throw new Error("Stateful binding target driver id is required");
	const normalized = {
		...driver,
		id
	};
	if (registeredStatefulBindingTargetDrivers.get(id)) return () => {};
	registeredStatefulBindingTargetDrivers.set(id, normalized);
	return () => {
		if (registeredStatefulBindingTargetDrivers.get(id) === normalized) registeredStatefulBindingTargetDrivers.delete(id);
	};
}
function resolveStatefulBindingTargetBySessionKey(params) {
	const sessionKey = params.sessionKey.trim();
	if (!sessionKey) return null;
	for (const driver of listStatefulBindingTargetDrivers()) {
		const bindingTarget = driver.resolveTargetBySessionKey?.({
			cfg: params.cfg,
			sessionKey
		});
		if (bindingTarget) return {
			driver,
			bindingTarget
		};
	}
	return null;
}
//#endregion
//#region src/channels/plugins/stateful-target-builtins.ts
/**
* Built-in stateful binding target registration.
*
* Lazily registers ACP target drivers so non-ACP channel flows avoid ACP runtime imports.
*/
let builtinsRegisteredPromise = null;
const loadAcpStatefulTargetDriverModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./acp-stateful-target-driver-Dwm6flJJ.cjs")));
async function ensureStatefulTargetBuiltinsRegistered() {
	if (builtinsRegisteredPromise) {
		await builtinsRegisteredPromise;
		return;
	}
	builtinsRegisteredPromise = (async () => {
		const { acpStatefulBindingTargetDriver } = await loadAcpStatefulTargetDriverModule();
		registerStatefulBindingTargetDriver(acpStatefulBindingTargetDriver);
	})();
	try {
		await builtinsRegisteredPromise;
	} catch (error) {
		builtinsRegisteredPromise = null;
		throw error;
	}
}
//#endregion
//#region src/channels/plugins/binding-targets.ts
/**
* Resets a stateful configured binding target in place when its driver supports reset.
*/
async function resetConfiguredBindingTargetInPlace(params) {
	let resolved = resolveStatefulBindingTargetBySessionKey({
		cfg: params.cfg,
		sessionKey: params.sessionKey
	});
	if (!resolved) {
		await ensureStatefulTargetBuiltinsRegistered();
		resolved = resolveStatefulBindingTargetBySessionKey({
			cfg: params.cfg,
			sessionKey: params.sessionKey
		});
	}
	if (!resolved?.driver.resetInPlace) return {
		ok: false,
		skipped: true
	};
	return await resolved.driver.resetInPlace({
		...params,
		bindingTarget: resolved.bindingTarget
	});
}
//#endregion
//#region src/auto-reply/reply/commands-reset.ts
/** Handles /new and /reset command flows, including soft reset and ACP-bound sessions. */
function applyAcpResetTailContext(ctx, resetTail) {
	const mutableCtx = ctx;
	mutableCtx.Body = resetTail;
	mutableCtx.RawBody = resetTail;
	mutableCtx.CommandBody = resetTail;
	mutableCtx.BodyForCommands = resetTail;
	mutableCtx.BodyForAgent = resetTail;
	mutableCtx.BodyStripped = resetTail;
	mutableCtx.AcpDispatchTailAfterReset = true;
}
function isResetAuthorized(params) {
	return require_reset_authorization.isResetAuthorizedForContext({
		ctx: params.ctx,
		cfg: params.cfg,
		commandAuthorized: params.command.isAuthorizedSender || params.ctx.CommandAuthorized === true
	});
}
/** Handles reset/new commands or returns null when another command handler should continue. */
async function maybeHandleResetCommand(params) {
	const softReset = require_commands_reset_mode.parseSoftResetCommand(params.command.commandBodyNormalized);
	if (softReset.matched) {
		if (!isResetAuthorized(params)) {
			require_globals.logVerbose(`Ignoring /reset soft from unauthorized sender: ${params.command.senderId || "<unknown>"}`);
			return { shouldContinue: false };
		}
		const boundAcpSessionKey = require_targets.resolveBoundAcpThreadSessionKey(params);
		if (boundAcpSessionKey && require_session_key.isAcpSessionKey(boundAcpSessionKey) ? boundAcpSessionKey.trim() : void 0) return {
			shouldContinue: false,
			reply: { text: "Usage: /reset soft is not available for ACP-bound sessions yet." }
		};
		const targetSessionEntry = params.sessionStore?.[params.sessionKey] ?? params.sessionEntry;
		const previousSessionEntry = params.previousSessionEntry ?? (targetSessionEntry ? { ...targetSessionEntry } : void 0);
		if (targetSessionEntry) {
			const now = Date.now();
			require_cli_session.clearAllCliSessions(targetSessionEntry);
			if (params.sessionEntry && params.sessionEntry !== targetSessionEntry) {
				require_cli_session.clearAllCliSessions(params.sessionEntry);
				params.sessionEntry.updatedAt = now;
				params.sessionEntry.lastInteractionAt = now;
			}
			if (params.sessionKey) require_bootstrap_cache.clearBootstrapSnapshot(params.sessionKey);
			targetSessionEntry.updatedAt = now;
			targetSessionEntry.lastInteractionAt = now;
			if (params.sessionStore && params.sessionKey) params.sessionStore[params.sessionKey] = targetSessionEntry;
			if (params.storePath && params.sessionKey) await require_session_accessor.updateSessionEntry({
				storePath: params.storePath,
				sessionKey: params.sessionKey
			}, async (entry) => {
				const next = { ...entry };
				require_cli_session.clearAllCliSessions(next);
				return {
					cliSessionBindings: next.cliSessionBindings,
					cliSessionIds: next.cliSessionIds,
					claudeCliSessionId: next.claudeCliSessionId,
					updatedAt: now,
					lastInteractionAt: now
				};
			});
		}
		await require_commands_reset_hooks.emitResetCommandHooks({
			action: "reset",
			ctx: params.ctx,
			cfg: params.cfg,
			command: params.command,
			sessionKey: params.sessionKey,
			storePath: params.storePath,
			sessionEntry: targetSessionEntry,
			previousSessionEntry,
			workspaceDir: params.workspaceDir
		});
		params.command.softResetTriggered = true;
		params.command.softResetTail = softReset.tail;
		return null;
	}
	const resetMatch = params.command.commandBodyNormalized.match(/^\/(new|reset)(?:\s|$)/i);
	if (!resetMatch) return null;
	if (!isResetAuthorized(params)) {
		require_globals.logVerbose(`Ignoring /reset from unauthorized sender: ${params.command.senderId || "<unknown>"}`);
		return { shouldContinue: false };
	}
	const commandAction = resetMatch[1]?.toLowerCase() === "reset" ? "reset" : "new";
	const resetTail = params.command.commandBodyNormalized.slice(resetMatch[0].length).trimStart();
	const boundAcpSessionKey = require_targets.resolveBoundAcpThreadSessionKey(params);
	const boundAcpKey = boundAcpSessionKey && require_session_key.isAcpSessionKey(boundAcpSessionKey) ? boundAcpSessionKey.trim() : void 0;
	if (boundAcpKey) {
		const resetResult = await resetConfiguredBindingTargetInPlace({
			cfg: params.cfg,
			sessionKey: boundAcpKey,
			reason: commandAction,
			commandSource: `${params.command.surface}:${params.ctx.CommandSource ?? "text"}`
		});
		if (!resetResult.ok) require_globals.logVerbose(`acp reset failed for ${boundAcpKey}: ${resetResult.error ?? "unknown error"}`);
		if (resetResult.ok) {
			if (resetResult.sessionId) params.opts?.onSessionPrepared?.({
				sessionKey: resetResult.sessionKey ?? boundAcpKey,
				sessionId: resetResult.sessionId,
				storePath: resetResult.storePath
			});
			params.command.resetHookTriggered = true;
			if (resetTail) {
				applyAcpResetTailContext(params.ctx, resetTail);
				if (params.rootCtx && params.rootCtx !== params.ctx) applyAcpResetTailContext(params.rootCtx, resetTail);
				return { shouldContinue: false };
			}
			return {
				shouldContinue: false,
				reply: { text: "✅ ACP session reset in place." }
			};
		}
		return {
			shouldContinue: false,
			reply: { text: "⚠️ ACP session reset failed. Check /acp status and try again." }
		};
	}
	const targetSessionEntry = params.sessionStore?.[params.sessionKey] ?? params.sessionEntry;
	const hookResult = await require_commands_reset_hooks.emitResetCommandHooks({
		action: commandAction,
		ctx: params.ctx,
		cfg: params.cfg,
		command: params.command,
		sessionKey: params.sessionKey,
		storePath: params.storePath,
		sessionEntry: targetSessionEntry,
		previousSessionEntry: params.previousSessionEntry,
		workspaceDir: params.workspaceDir
	});
	if (!resetTail) return {
		shouldContinue: false,
		...hookResult.routedReply ? {} : { reply: { text: commandAction === "reset" ? "✅ Session reset." : "✅ New session started." } }
	};
	return null;
}
//#endregion
//#region src/auto-reply/reply/commands-core.ts
const commandHandlersRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./commands-handlers.runtime-DljiJbKZ.cjs")));
function loadCommandHandlersRuntime() {
	return commandHandlersRuntimeLoader.load();
}
let HANDLERS = null;
function normalizeCommandHandlerResult(result) {
	if (!result.reply) return result;
	return {
		...result,
		reply: {
			...result.reply,
			replyToId: void 0,
			replyToCurrent: false
		}
	};
}
async function handleCommands(params) {
	if (HANDLERS === null) HANDLERS = (await loadCommandHandlersRuntime()).loadCommandHandlers();
	const allowCreateSessionEntry = params.allowCreateSessionEntry === true;
	const initialSessionEntry = params.initialSessionEntry ?? (allowCreateSessionEntry ? void 0 : params.sessionEntry ? { ...params.sessionEntry } : void 0);
	const commandParams = {
		...params,
		initialSessionEntry,
		allowCreateSessionEntry
	};
	const resetResult = await maybeHandleResetCommand(commandParams);
	if (resetResult) return normalizeCommandHandlerResult(resetResult);
	const allowTextCommands = require_commands_registry.shouldHandleTextCommands({
		cfg: params.cfg,
		surface: params.command.surface,
		commandSource: params.ctx.CommandSource
	});
	for (const handler of HANDLERS) {
		const result = await handler(commandParams, allowTextCommands);
		if (result) return normalizeCommandHandlerResult(result);
	}
	return { shouldContinue: true };
}
//#endregion
exports.buildStatusReply = require_commands_status.buildStatusReply;
exports.handleCommands = handleCommands;
