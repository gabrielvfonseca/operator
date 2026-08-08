const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
//#region src/infra/exec-policy.ts
function applyExecPolicyLayer(base, layer) {
	if (!layer) return base;
	if (layer.mode) return {
		...base,
		mode: layer.mode,
		...require_exec_approvals.resolveExecPolicyForMode(layer.mode)
	};
	if (layer.security !== void 0 || layer.ask !== void 0) {
		const { mode: _mode, ...baseWithoutMode } = base;
		return {
			...baseWithoutMode,
			security: layer.security ?? base.security,
			ask: layer.ask ?? base.ask
		};
	}
	return base;
}
//#endregion
Object.defineProperty(exports, "applyExecPolicyLayer", {
	enumerable: true,
	get: function() {
		return applyExecPolicyLayer;
	}
});
