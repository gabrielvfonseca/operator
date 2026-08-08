require("./rolldown-runtime-u92d-OFm.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_session = require("./session-CJIg2dUE.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/gateway/server-methods/wizard.ts
const runDefaultSetupWizard = async (...args) => {
	const { runSetupWizard } = await Promise.resolve().then(() => require("./setup-XosMtO8q.cjs"));
	return runSetupWizard(...args);
};
const runDefaultChannelSetupWizard = async (...args) => {
	const { runChannelsSetupWizard } = await Promise.resolve().then(() => require("./add-wizard-CAqkD_IC.cjs"));
	return runChannelsSetupWizard(...args);
};
function readWizardStatus(session) {
	return {
		status: session.getStatus(),
		error: session.getError()
	};
}
/** Resolves a live wizard session or sends the public not-found error. */
function findWizardSessionOrRespond(params) {
	const session = params.context.wizardSessions.get(params.sessionId);
	if (!session) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "wizard not found"));
		return null;
	}
	return session;
}
/** Gateway handlers for the interactive setup wizard session lifecycle. */
const wizardHandlers = {
	"wizard.start": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateWizardStartParams, "wizard.start", respond)) return;
		if (context.findRunningWizard()) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "wizard already running"));
			return;
		}
		const sessionId = (0, node_crypto.randomUUID)();
		const session = (params.flow ?? "setup") === "channels" ? new require_session.WizardSession((prompter, _signal, wizardSession) => context.channelWizardRunner({
			channel: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.channel),
			onConfigured: (accounts) => wizardSession.setConfiguredAccounts(accounts),
			beforePersistentEffect: async () => wizardSession.lockCancellation()
		}, require_runtime.defaultRuntime, prompter)) : new require_session.WizardSession((prompter) => context.wizardRunner({
			mode: params.mode,
			workspace: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.workspace)
		}, require_runtime.defaultRuntime, prompter));
		context.wizardSessions.set(sessionId, session);
		const result = await session.next();
		if (result.done) context.purgeWizardSession(sessionId);
		respond(true, {
			sessionId,
			...result
		}, void 0);
	},
	"wizard.next": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateWizardNextParams, "wizard.next", respond)) return;
		const sessionId = params.sessionId;
		const session = findWizardSessionOrRespond({
			context,
			respond,
			sessionId
		});
		if (!session) return;
		const answer = params.answer;
		if (answer) {
			if (session.getStatus() !== "running") {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "wizard not running"));
				return;
			}
			try {
				const validationError = await session.answer(answer.stepId ?? "", answer.value);
				if (validationError) {
					respond(true, {
						...await session.next(),
						error: validationError
					}, void 0);
					return;
				}
			} catch (err) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, require_ws_log.formatForLog(err)));
				return;
			}
		}
		const result = await session.next();
		if (result.done) context.purgeWizardSession(sessionId);
		respond(true, result, void 0);
	},
	"wizard.cancel": ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateWizardCancelParams, "wizard.cancel", respond)) return;
		const sessionId = params.sessionId;
		const session = findWizardSessionOrRespond({
			context,
			respond,
			sessionId
		});
		if (!session) return;
		const cancelled = session.cancel();
		const status = readWizardStatus(session);
		if (cancelled || status.status !== "running") context.wizardSessions.delete(sessionId);
		respond(true, status, void 0);
	},
	"wizard.status": ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateWizardStatusParams, "wizard.status", respond)) return;
		const sessionId = params.sessionId;
		const session = findWizardSessionOrRespond({
			context,
			respond,
			sessionId
		});
		if (!session) return;
		const status = readWizardStatus(session);
		if (status.status !== "running") context.wizardSessions.delete(sessionId);
		respond(true, status, void 0);
	}
};
//#endregion
exports.runDefaultChannelSetupWizard = runDefaultChannelSetupWizard;
exports.runDefaultSetupWizard = runDefaultSetupWizard;
exports.wizardHandlers = wizardHandlers;
