const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_transcript_tree = require("./transcript-tree-0YpOJFJQ.cjs");
const require_internal_hooks = require("./internal-hooks-CP-OV43M.cjs");
//#region src/auto-reply/reply/commands-reset-hooks.ts
const routeReplyRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./route-reply.runtime-C6Gf3w1B.cjs")));
function loadRouteReplyRuntime() {
	return routeReplyRuntimeLoader.load();
}
function parseTranscriptMessages(entries) {
	return (require_transcript_tree.selectSessionTranscriptLeafControlledPath(entries) ?? entries).flatMap((entry) => {
		if (entry && typeof entry === "object" && !Array.isArray(entry) && entry.type === "message" && entry.message) return [entry.message];
		return [];
	});
}
async function loadBeforeResetTranscript(params) {
	if (!params.sessionId || !params.sessionKey || !params.storePath) {
		require_globals.logVerbose("before_reset: no session identity available, firing hook with empty messages");
		return {
			sessionFile: params.sessionFile,
			messages: []
		};
	}
	try {
		return {
			sessionFile: params.sessionFile,
			messages: parseTranscriptMessages(await require_session_accessor.loadTranscriptEvents({
				...params.agentId ? { agentId: params.agentId } : {},
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				storePath: params.storePath
			}))
		};
	} catch (err) {
		require_globals.logVerbose(`before_reset: failed to read transcript identity ${params.sessionKey}/${params.sessionId}; firing hook with empty messages (${String(err)})`);
		return {
			sessionFile: params.sessionFile,
			messages: []
		};
	}
}
async function emitResetCommandHooks(params) {
	const hookEvent = require_internal_hooks.createInternalHookEvent("command", params.action, params.sessionKey ?? "", {
		sessionEntry: params.sessionEntry,
		previousSessionEntry: params.previousSessionEntry,
		commandSource: params.command.surface,
		senderId: params.command.senderId,
		workspaceDir: params.workspaceDir,
		cfg: params.cfg
	});
	await require_internal_hooks.triggerInternalHook(hookEvent);
	params.command.resetHookTriggered = true;
	let routedReply = false;
	if (hookEvent.messages.length > 0) {
		const channel = params.ctx.OriginatingChannel || params.command.channel;
		const to = params.ctx.OriginatingTo || params.command.from || params.command.to;
		if (channel && to) {
			const { routeReply } = await loadRouteReplyRuntime();
			await routeReply({
				payload: { text: hookEvent.messages.join("\n\n") },
				channel,
				to,
				sessionKey: params.sessionKey,
				accountId: params.ctx.AccountId,
				requesterSenderId: params.command.senderId,
				requesterSenderName: params.ctx.SenderName,
				requesterSenderUsername: params.ctx.SenderUsername,
				requesterSenderE164: params.ctx.SenderE164,
				threadId: params.ctx.MessageThreadId,
				cfg: params.cfg,
				replyKind: "final"
			});
			routedReply = true;
		}
	}
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	if (hookRunner?.hasHooks("before_reset")) {
		const prevEntry = params.previousSessionEntry;
		const agentId = require_session_key.resolveAgentIdFromSessionKey(params.sessionKey);
		const beforeResetTranscript = await loadBeforeResetTranscript({
			agentId,
			sessionFile: prevEntry?.sessionFile,
			sessionId: prevEntry?.sessionId,
			sessionKey: params.sessionKey,
			storePath: params.storePath
		});
		(async () => {
			try {
				await hookRunner.runBeforeReset({
					...beforeResetTranscript,
					reason: params.action
				}, {
					agentId,
					sessionKey: params.sessionKey,
					sessionId: prevEntry?.sessionId,
					workspaceDir: params.workspaceDir
				});
			} catch (err) {
				require_globals.logVerbose(`before_reset hook failed: ${String(err)}`);
			}
		})();
	}
	return { routedReply };
}
//#endregion
Object.defineProperty(exports, "emitResetCommandHooks", {
	enumerable: true,
	get: function() {
		return emitResetCommandHooks;
	}
});
