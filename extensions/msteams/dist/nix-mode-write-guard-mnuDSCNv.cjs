const require_paths = require("./paths-C5Qy0ueD.cjs");
//#region src/config/nix-mode-write-guard.ts
/** Agent-first Nix install docs shown when runtime config writes are blocked. */
const NIX_OPERATOR_AGENT_FIRST_URL = "https://github.com/openclaw/nix-openclaw#quick-start";
/** Public Operator Nix overview shown with immutable-config errors. */
const OPERATOR_NIX_OVERVIEW_URL = "https://docs.operator.ai/install/nix";
/** Error thrown when a mutating config path is attempted while Nix owns config state. */
var NixModeConfigMutationError = class extends Error {
	constructor(params = {}) {
		super(formatNixModeConfigMutationMessage(params));
		this.code = "OPERATOR_NIX_MODE_CONFIG_IMMUTABLE";
		this.name = "NixModeConfigMutationError";
	}
};
/** Build the operator-facing immutable-config message for Nix-managed installs. */
function formatNixModeConfigMutationMessage(params = {}) {
	return [
		"Config is managed by Nix (`OPERATOR_NIX_MODE=1`), so Operator treats operator.json as immutable.",
		"This usually means nix-openclaw, the first-party Nix distribution, or another Nix-managed package set this mode.",
		...params.configPath ? [`Config path: ${params.configPath}`] : [],
		"Do not run setup, onboarding, openclaw update, plugin install/update/uninstall/enable, doctor repair/token-generation, or config set against this file.",
		"Edit the Nix source for this install instead. For nix-openclaw, edit `programs.operator.config` or `instances.<name>.config`, then rebuild with Home Manager or NixOS.",
		`Agent-first Nix setup: ${NIX_OPERATOR_AGENT_FIRST_URL}`,
		`Operator Nix overview: ${OPERATOR_NIX_OVERVIEW_URL}`
	].join("\n");
}
/** Throw when the current environment marks Operator config as Nix-managed and immutable. */
function assertConfigWriteAllowedInCurrentMode(params = {}) {
	if (!require_paths.resolveIsNixMode(params.env)) return;
	throw new NixModeConfigMutationError({ configPath: params.configPath });
}
//#endregion
Object.defineProperty(exports, "NixModeConfigMutationError", {
	enumerable: true,
	get: function() {
		return NixModeConfigMutationError;
	}
});
Object.defineProperty(exports, "assertConfigWriteAllowedInCurrentMode", {
	enumerable: true,
	get: function() {
		return assertConfigWriteAllowedInCurrentMode;
	}
});
