require("./rolldown-runtime-u92d-OFm.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_gmail_watcher = require("./gmail-watcher-BhEHZ6Qi.cjs");
//#region src/hooks/gmail-watcher-lifecycle.ts
/** Start the Gmail watcher with startup logs and env-based skip handling. */
async function startGmailWatcherWithLogs(params) {
	if (require_env.isTruthyEnvValue(process.env.OPERATOR_SKIP_GMAIL_WATCHER)) {
		params.onSkipped?.();
		return;
	}
	try {
		const gmailResult = await require_gmail_watcher.startGmailWatcher(params.cfg, {
			isCancelled: params.isCancelled,
			signal: params.signal
		});
		if (gmailResult.started) {
			params.log.info("gmail watcher started");
			return;
		}
		if (gmailResult.reason && gmailResult.reason !== "hooks not enabled" && gmailResult.reason !== "no gmail account configured") params.log.warn(`gmail watcher not started: ${gmailResult.reason}`);
	} catch (err) {
		params.log.error(`gmail watcher failed to start: ${String(err)}`);
	}
}
//#endregion
exports.startGmailWatcherWithLogs = startGmailWatcherWithLogs;
