const require_safe_text = require("./safe-text-BAHCZAPT.cjs");
const require_model_selection_cli = require("./model-selection-cli-PCHB2Ve6.cjs");
require("./model-selection-BvFurMxy.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/status/agent-runtime-label.ts
const AGENT_RUNTIME_LABELS = {
	operator: "Operator Default",
	codex: "OpenAI Codex",
	"codex-cli": "OpenAI Codex",
	"claude-cli": "Claude CLI",
	"google-gemini-cli": "Gemini CLI"
};
function resolveAgentRuntimeLabel(args) {
	const acpAgentRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.sessionEntry?.acp?.agent);
	const acpAgent = acpAgentRaw ? require_safe_text.sanitizeTerminalText(acpAgentRaw) : void 0;
	if (acpAgent) {
		const backendRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.sessionEntry?.acp?.backend);
		const backend = backendRaw ? require_safe_text.sanitizeTerminalText(backendRaw) : void 0;
		return backend ? `${acpAgent} (acp/${backend})` : `${acpAgent} (acp)`;
	}
	const runtimeRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.resolvedHarness);
	const runtime = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(runtimeRaw);
	if (runtime && runtime !== "auto" && runtime !== "default") return AGENT_RUNTIME_LABELS[runtime] ?? require_safe_text.sanitizeTerminalText(runtimeRaw ?? runtime);
	const providerRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.sessionEntry?.modelProvider) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.sessionEntry?.providerOverride) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.fallbackProvider);
	const provider = providerRaw ? require_safe_text.sanitizeTerminalText(providerRaw) : void 0;
	if (provider && require_model_selection_cli.isCliProvider(provider, args.config)) return AGENT_RUNTIME_LABELS[(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerRaw) ?? ""] ?? `${provider} (cli)`;
	return (0, _gabrielvfonseca_normalization_core.expectDefined)(AGENT_RUNTIME_LABELS.operator, "Operator runtime label");
}
//#endregion
Object.defineProperty(exports, "resolveAgentRuntimeLabel", {
	enumerable: true,
	get: function() {
		return resolveAgentRuntimeLabel;
	}
});
