const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/plugins/provider-openai-chatgpt-oauth-tls.ts
/** TLS helpers for ChatGPT OAuth provider discovery in plugin runtime code. */
const TLS_CERT_ERROR_CODES = /* @__PURE__ */ new Set([
	"UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
	"UNABLE_TO_VERIFY_LEAF_SIGNATURE",
	"CERT_HAS_EXPIRED",
	"DEPTH_ZERO_SELF_SIGNED_CERT",
	"SELF_SIGNED_CERT_IN_CHAIN",
	"ERR_TLS_CERT_ALTNAME_INVALID"
]);
const TLS_CERT_ERROR_PATTERNS = [
	/unable to get local issuer certificate/i,
	/unable to verify the first certificate/i,
	/self[- ]signed certificate/i,
	/certificate has expired/i
];
const OPENAI_AUTH_PROBE_URL = "https://auth.openai.com/oauth/authorize?response_type=code&client_id=operator-preflight&redirect_uri=http%3A%2F%2Flocalhost%3A1455%2Fauth%2Fcallback&scope=openid+profile+email";
const OPENAI_PROVIDER_ID = "openai";
function extractFailure(error) {
	const root = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(error);
	const rootCause = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(root?.cause);
	const code = typeof rootCause?.code === "string" ? rootCause.code : void 0;
	const message = typeof rootCause?.message === "string" ? rootCause.message : typeof root?.message === "string" ? root.message : String(error);
	return {
		code,
		message,
		kind: (code ? TLS_CERT_ERROR_CODES.has(code) : false) || TLS_CERT_ERROR_PATTERNS.some((pattern) => pattern.test(message)) ? "tls-cert" : "network"
	};
}
function resolveHomebrewPrefixFromExecPath(execPath) {
	const marker = `${node_path.default.sep}Cellar${node_path.default.sep}`;
	const idx = execPath.indexOf(marker);
	if (idx > 0) return execPath.slice(0, idx);
	const envPrefix = process.env.HOMEBREW_PREFIX?.trim();
	return envPrefix ? envPrefix : null;
}
function resolveCertBundlePath() {
	const prefix = resolveHomebrewPrefixFromExecPath(process.execPath);
	if (!prefix) return null;
	return node_path.default.join(prefix, "etc", "openssl@3", "cert.pem");
}
function hasOpenAICodexOAuthProfile(cfg) {
	const profiles = cfg.auth?.profiles;
	if (!profiles) return false;
	return Object.values(profiles).some((profile) => profile.provider === OPENAI_PROVIDER_ID && profile.mode === "oauth");
}
function shouldRunOpenAIOAuthTlsPrerequisites(params) {
	if (params.deep === true) return true;
	return hasOpenAICodexOAuthProfile(params.cfg);
}
async function runOpenAIOAuthTlsPreflight(options) {
	const timeoutMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(options?.timeoutMs, 5e3);
	const fetchImpl = options?.fetchImpl ?? fetch;
	let response;
	try {
		response = await fetchImpl(OPENAI_AUTH_PROBE_URL, {
			method: "GET",
			redirect: "manual",
			signal: AbortSignal.timeout(timeoutMs)
		});
		return { ok: true };
	} catch (error) {
		const failure = extractFailure(error);
		return {
			ok: false,
			kind: failure.kind,
			code: failure.code,
			message: failure.message
		};
	} finally {
		if (response?.bodyUsed !== true) await response?.body?.cancel().catch(() => void 0);
	}
}
function formatOpenAIOAuthTlsPreflightFix(result) {
	if (result.kind !== "tls-cert") return [
		"OpenAI OAuth prerequisites check failed due to a network error before the browser flow.",
		`Cause: ${result.message}`,
		"Verify DNS/firewall/proxy access to auth.openai.com and retry."
	].join("\n");
	const certBundlePath = resolveCertBundlePath();
	const lines = [
		"OpenAI OAuth prerequisites check failed: Node/OpenSSL cannot validate TLS certificates.",
		`Cause: ${result.code ? `${result.code} (${result.message})` : result.message}`,
		"",
		"Fix (Homebrew Node/OpenSSL):",
		`- ${require_command_format.formatCliCommand("brew postinstall ca-certificates")}`,
		`- ${require_command_format.formatCliCommand("brew postinstall openssl@3")}`
	];
	if (certBundlePath) lines.push(`- Verify cert bundle exists: ${certBundlePath}`);
	lines.push("- Retry the OAuth login flow.");
	return lines.join("\n");
}
async function noteOpenAIOAuthTlsPrerequisites(params) {
	if (!shouldRunOpenAIOAuthTlsPrerequisites(params)) return;
	const result = await runOpenAIOAuthTlsPreflight({ timeoutMs: 4e3 });
	if (result.ok || result.kind !== "tls-cert") return;
	require_note.note(formatOpenAIOAuthTlsPreflightFix(result), "OAuth TLS prerequisites");
}
//#endregion
exports.formatOpenAIOAuthTlsPreflightFix = formatOpenAIOAuthTlsPreflightFix;
exports.noteOpenAIOAuthTlsPrerequisites = noteOpenAIOAuthTlsPrerequisites;
exports.runOpenAIOAuthTlsPreflight = runOpenAIOAuthTlsPreflight;
exports.shouldRunOpenAIOAuthTlsPrerequisites = shouldRunOpenAIOAuthTlsPrerequisites;
