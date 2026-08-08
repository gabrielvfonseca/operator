const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_progress_line = require("./progress-line-CDI8nBBL.cjs");
let _clack_prompts = require("@clack/prompts");
//#region packages/terminal-core/src/osc-progress.ts
const OSC_PROGRESS_PREFIX = "\x1B]9;4;";
const OSC_PROGRESS_ST = "\x1B\\";
const OSC_PROGRESS_BEL = "\x07";
const OSC_PROGRESS_C1_ST = "";
/** Return true when the terminal is known to support OSC progress messages. */
function supportsOscProgress(env, isTty) {
	if (!isTty) return false;
	const termProgram = (env.TERM_PROGRAM ?? "").toLowerCase();
	return termProgram.includes("ghostty") || termProgram.includes("wezterm") || Boolean(env.WT_SESSION);
}
/** Remove OSC terminators and escape introducers from progress labels. */
function sanitizeOscProgressLabel(label) {
	return label.replaceAll(OSC_PROGRESS_ST, "").replaceAll(OSC_PROGRESS_BEL, "").replaceAll(OSC_PROGRESS_C1_ST, "").split("\x1B").join("").replaceAll("]", "").trim();
}
/** Format one OSC progress control sequence. */
function formatOscProgress(state, percent, label) {
	const cleanLabel = sanitizeOscProgressLabel(label);
	if (percent === null) return `${OSC_PROGRESS_PREFIX}${state};;${cleanLabel}${OSC_PROGRESS_ST}`;
	return `${OSC_PROGRESS_PREFIX}${state};${Math.max(0, Math.min(100, Math.round(percent)))};${cleanLabel}${OSC_PROGRESS_ST}`;
}
/** Create a progress controller, returning no-op methods on unsupported terminals. */
function createOscProgressController(params) {
	if (!supportsOscProgress(params.env, params.isTty)) return {
		setIndeterminate: () => {},
		setPercent: () => {},
		clear: () => {}
	};
	let lastLabel = "";
	return {
		setIndeterminate: (label) => {
			lastLabel = label;
			params.write(formatOscProgress(3, null, label));
		},
		setPercent: (label, percent) => {
			lastLabel = label;
			params.write(formatOscProgress(1, percent, label));
		},
		clear: () => {
			params.write(formatOscProgress(0, 0, lastLabel));
		}
	};
}
//#endregion
//#region src/cli/progress.ts
const DEFAULT_DELAY_MS = 0;
let activeProgress = 0;
/** Decide whether the interactive spinner is safe for the current terminal state. */
function shouldUseInteractiveProgressSpinner(params) {
	return (params.fallback === void 0 || params.fallback === "spinner") && params.streamIsTty === true && params.stdinIsRaw !== true;
}
const noopReporter = {
	setLabel: () => {},
	setPercent: () => {},
	tick: () => {},
	done: () => {}
};
/** Create a no-op, spinner, line, log, and OSC-capable progress reporter. */
function createCliProgress(options) {
	if (options.enabled === false) return noopReporter;
	if (activeProgress > 0) return noopReporter;
	const stream = options.stream ?? process.stderr;
	const isTty = stream.isTTY;
	const allowLog = !isTty && options.fallback === "log";
	if (!isTty && !allowLog) return noopReporter;
	const delayMs = (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(options.delayMs, DEFAULT_DELAY_MS, 0);
	const canOsc = isTty && supportsOscProgress(process.env, isTty);
	const stdinIsRaw = process.stdin.isRaw;
	const allowSpinner = shouldUseInteractiveProgressSpinner({
		fallback: options.fallback,
		streamIsTty: isTty,
		stdinIsRaw
	});
	const allowLine = isTty && options.fallback === "line";
	if (isTty && stdinIsRaw && (options.fallback === void 0 || options.fallback === "spinner")) return noopReporter;
	let started = false;
	let label = options.label;
	const total = options.total ?? null;
	let completed = 0;
	let percent = 0;
	let indeterminate = options.indeterminate ?? (options.total === void 0 || options.total === null);
	activeProgress += 1;
	if (isTty) require_progress_line.registerActiveProgressLine(stream);
	const controller = canOsc ? createOscProgressController({
		env: process.env,
		isTty: stream.isTTY,
		write: (chunk) => stream.write(chunk)
	}) : null;
	const spin = allowSpinner ? (0, _clack_prompts.spinner)({ output: stream }) : null;
	const renderLine = allowLine ? () => {
		if (!started) return;
		const suffix = indeterminate ? "" : ` ${percent}%`;
		require_progress_line.clearActiveProgressLine();
		stream.write(`${require_theme.theme.accent(label)}${suffix}`);
	} : null;
	const renderLog = allowLog ? (() => {
		let lastLine = "";
		let lastAt = 0;
		const throttleMs = 250;
		return () => {
			if (!started) return;
			const suffix = indeterminate ? "" : ` ${percent}%`;
			const nextLine = `${label}${suffix}`;
			const now = Date.now();
			if (nextLine === lastLine && now - lastAt < throttleMs) return;
			lastLine = nextLine;
			lastAt = now;
			stream.write(`${nextLine}\n`);
		};
	})() : null;
	let timer = null;
	const applyState = () => {
		if (!started) return;
		if (controller) if (indeterminate) controller.setIndeterminate(label);
		else controller.setPercent(label, percent);
		if (spin) spin.message(require_theme.theme.accent(label));
		if (renderLine) renderLine();
		if (renderLog) renderLog();
	};
	const start = () => {
		if (started) return;
		started = true;
		if (spin) spin.start(require_theme.theme.accent(label));
		applyState();
	};
	if (delayMs === 0) start();
	else timer = setTimeout(start, delayMs);
	const setLabel = (next) => {
		label = next;
		applyState();
	};
	const setPercent = (nextPercent) => {
		percent = Math.max(0, Math.min(100, Math.round(nextPercent)));
		indeterminate = false;
		applyState();
	};
	const tick = (delta = 1) => {
		if (!total) return;
		completed = Math.min(total, completed + delta);
		const nextPercent = total > 0 ? Math.round(completed / total * 100) : 0;
		setPercent(nextPercent);
	};
	const done = () => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		if (!started) {
			if (isTty) require_progress_line.unregisterActiveProgressLine(stream);
			activeProgress = Math.max(0, activeProgress - 1);
			return;
		}
		if (controller) controller.clear();
		if (spin) spin.stop();
		require_progress_line.clearActiveProgressLine();
		if (isTty) require_progress_line.unregisterActiveProgressLine(stream);
		activeProgress = Math.max(0, activeProgress - 1);
	};
	return {
		setLabel,
		setPercent,
		tick,
		done
	};
}
/** Run async work with a progress reporter that is always stopped in finally. */
async function withProgress(options, work) {
	const progress = createCliProgress(options);
	try {
		return await work(progress);
	} finally {
		progress.done();
	}
}
//#endregion
Object.defineProperty(exports, "createCliProgress", {
	enumerable: true,
	get: function() {
		return createCliProgress;
	}
});
Object.defineProperty(exports, "withProgress", {
	enumerable: true,
	get: function() {
		return withProgress;
	}
});
