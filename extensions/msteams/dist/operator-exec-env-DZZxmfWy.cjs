//#region src/infra/openclaw-exec-env.ts
/** Process env key that marks child commands as launched by the Operator CLI. */
const OPERATOR_CLI_ENV_VAR = "OPERATOR_CLI";
/** Stable marker value used for Operator-launched subprocess detection. */
const OPERATOR_CLI_ENV_VALUE = "1";
/** Returns a cloned env object with the Operator CLI marker set. */
function markOperatorExecEnv(env) {
	return {
		...env,
		[OPERATOR_CLI_ENV_VAR]: OPERATOR_CLI_ENV_VALUE
	};
}
//#endregion
Object.defineProperty(exports, "OPERATOR_CLI_ENV_VAR", {
	enumerable: true,
	get: function() {
		return OPERATOR_CLI_ENV_VAR;
	}
});
Object.defineProperty(exports, "markOperatorExecEnv", {
	enumerable: true,
	get: function() {
		return markOperatorExecEnv;
	}
});
