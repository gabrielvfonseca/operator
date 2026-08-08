const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
require("./shared-Bt0YEZDW.cjs");
const require_secret_value = require("./secret-value-BpdByGIA.cjs");
//#region src/secrets/runtime-shared.ts
/**
* Creates the mutable collection context used while preparing a secrets runtime snapshot.
*/
function createResolverContext(params) {
	return {
		sourceConfig: params.sourceConfig,
		env: params.env,
		cache: {},
		...params.manifestRegistry ? { manifestRegistry: params.manifestRegistry } : {},
		warnings: [],
		warningKeys: /* @__PURE__ */ new Set(),
		assignments: []
	};
}
/**
* Records a SecretRef assignment that should be resolved and applied later.
*/
function pushAssignment(context, assignment) {
	context.assignments.push(assignment);
}
/**
* Records a resolver warning once per code/path/message tuple.
*/
function pushWarning(context, warning) {
	const warningKey = `${warning.code}:${warning.path}:${warning.message}`;
	if (context.warningKeys.has(warningKey)) return;
	context.warningKeys.add(warningKey);
	context.warnings.push(warning);
}
/**
* Emits the standard warning for refs configured on currently inactive surfaces.
*/
function pushInactiveSurfaceWarning(params) {
	pushWarning(params.context, {
		code: "SECRETS_REF_IGNORED_INACTIVE_SURFACE",
		path: params.path,
		message: params.details && params.details.trim().length > 0 ? `${params.path}: ${params.details}` : `${params.path}: secret ref is configured on an inactive surface; skipping resolution until it becomes active.`
	});
}
/**
* Converts an inline SecretInput value into a deferred assignment when its surface is active.
*/
function collectSecretInputAssignment(params) {
	const ref = require_types_secrets.coerceSecretRef(params.value, params.defaults);
	if (!ref) return;
	if (params.active === false) {
		pushInactiveSurfaceWarning({
			context: params.context,
			path: params.path,
			details: params.inactiveReason
		});
		return;
	}
	pushAssignment(params.context, {
		ref,
		path: params.path,
		expected: params.expected,
		apply: params.apply
	});
}
/**
* Applies resolved SecretRef values to their collected config targets with shape validation.
*/
function applyResolvedAssignments(params) {
	for (const assignment of params.assignments) {
		const key = require_ref_contract.secretRefKey(assignment.ref);
		if (!params.resolved.has(key)) throw new Error(`Secret reference "${key}" resolved to no value.`);
		const value = params.resolved.get(key);
		require_secret_value.assertExpectedResolvedSecretValue({
			value,
			expected: assignment.expected,
			errorMessage: assignment.expected === "string" ? `${assignment.path} resolved to a non-string or empty value.` : `${assignment.path} resolved to an unsupported value type.`
		});
		assignment.apply(value);
	}
}
//#endregion
Object.defineProperty(exports, "applyResolvedAssignments", {
	enumerable: true,
	get: function() {
		return applyResolvedAssignments;
	}
});
Object.defineProperty(exports, "collectSecretInputAssignment", {
	enumerable: true,
	get: function() {
		return collectSecretInputAssignment;
	}
});
Object.defineProperty(exports, "createResolverContext", {
	enumerable: true,
	get: function() {
		return createResolverContext;
	}
});
Object.defineProperty(exports, "pushAssignment", {
	enumerable: true,
	get: function() {
		return pushAssignment;
	}
});
Object.defineProperty(exports, "pushInactiveSurfaceWarning", {
	enumerable: true,
	get: function() {
		return pushInactiveSurfaceWarning;
	}
});
Object.defineProperty(exports, "pushWarning", {
	enumerable: true,
	get: function() {
		return pushWarning;
	}
});
