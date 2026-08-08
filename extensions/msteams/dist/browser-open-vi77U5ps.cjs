const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_windows_install_roots = require("./windows-install-roots-pUuZWNtA.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
const require_detect_binary = require("./detect-binary-B24IC5Ac.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/infra/browser-open.ts
function shouldSkipBrowserOpenInTests() {
	if (process.env.VITEST) return true;
	return false;
}
function resolveWindowsRundll32Path() {
	const { systemRoot } = require_windows_install_roots.getWindowsInstallRoots();
	return node_path.default.win32.join(systemRoot, "System32", "rundll32.exe");
}
function normalizeBrowserOpenUrl(raw) {
	try {
		const parsed = new URL(raw);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
		return parsed.toString();
	} catch {
		return null;
	}
}
/** Resolve the platform command used to open an HTTP(S) URL in a browser. */
async function resolveBrowserOpenCommand() {
	const platform = process.platform;
	const hasDisplay = Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
	if ((Boolean(process.env.SSH_CLIENT) || Boolean(process.env.SSH_TTY) || Boolean(process.env.SSH_CONNECTION)) && !hasDisplay && platform !== "win32" && platform !== "darwin") return {
		argv: null,
		reason: "ssh-no-display"
	};
	if (platform === "win32") {
		const rundll32 = resolveWindowsRundll32Path();
		return {
			argv: [rundll32, "url.dll,FileProtocolHandler"],
			command: rundll32
		};
	}
	if (platform === "darwin") return await require_detect_binary.detectBinary("open") ? {
		argv: ["open"],
		command: "open"
	} : {
		argv: null,
		reason: "missing-open"
	};
	if (platform === "linux") {
		const wsl = await require_undici_global_dispatcher.isWSL();
		if (!hasDisplay && !wsl) return {
			argv: null,
			reason: "no-display"
		};
		if (wsl) {
			if (await require_detect_binary.detectBinary("wslview")) return {
				argv: ["wslview"],
				command: "wslview"
			};
			if (!hasDisplay) return {
				argv: null,
				reason: "wsl-no-wslview"
			};
		}
		return await require_detect_binary.detectBinary("xdg-open") ? {
			argv: ["xdg-open"],
			command: "xdg-open"
		} : {
			argv: null,
			reason: "missing-xdg-open"
		};
	}
	return {
		argv: null,
		reason: "unsupported-platform"
	};
}
/** Report whether browser opening is currently available. */
async function detectBrowserOpenSupport() {
	const resolved = await resolveBrowserOpenCommand();
	if (!resolved.argv) return {
		ok: false,
		reason: resolved.reason
	};
	return {
		ok: true,
		command: resolved.command
	};
}
/** Open a safe HTTP(S) URL in the user's browser when the platform supports it. */
async function openUrl(url) {
	if (shouldSkipBrowserOpenInTests()) return false;
	const normalizedUrl = normalizeBrowserOpenUrl(url);
	if (!normalizedUrl) return false;
	const resolved = await resolveBrowserOpenCommand();
	if (!resolved.argv) return false;
	const command = [...resolved.argv];
	command.push(normalizedUrl);
	try {
		await require_exec.runCommandWithTimeout(command, { timeoutMs: 5e3 });
		return true;
	} catch {
		return false;
	}
}
//#endregion
Object.defineProperty(exports, "detectBrowserOpenSupport", {
	enumerable: true,
	get: function() {
		return detectBrowserOpenSupport;
	}
});
Object.defineProperty(exports, "openUrl", {
	enumerable: true,
	get: function() {
		return openUrl;
	}
});
Object.defineProperty(exports, "resolveBrowserOpenCommand", {
	enumerable: true,
	get: function() {
		return resolveBrowserOpenCommand;
	}
});
