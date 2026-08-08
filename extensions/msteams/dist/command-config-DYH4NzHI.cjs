const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_path_utils = require("./path-utils-B5Jty5Fz.cjs");
const require_secret_value = require("./secret-value-BpdByGIA.cjs");
const require_target_registry = require("./target-registry-C5xgrPiJ.cjs");
//#region src/secrets/command-config.ts
/**
* Compares source SecretRefs with the active resolved snapshot for command-time assignments.
*/
/** Analyzes command secret assignments without mutating the source config. */
function analyzeCommandSecretAssignmentsFromSnapshot(params) {
	const defaults = params.sourceConfig.secrets?.defaults;
	const assignments = [];
	const diagnostics = [];
	const unresolved = [];
	const inactive = [];
	for (const target of require_target_registry.discoverConfigSecretTargetsByIds(params.sourceConfig, params.targetIds)) {
		if (params.allowedPaths && !params.allowedPaths.has(target.path)) continue;
		const { explicitRef, ref } = require_types_secrets.resolveSecretInputRef({
			value: target.value,
			refValue: target.refValue,
			defaults
		});
		const inlineCandidateRef = explicitRef ? require_types_secrets.coerceSecretRef(target.value, defaults) : null;
		if (!ref) continue;
		const resolved = require_path_utils.getPath(params.resolvedConfig, target.pathSegments);
		if (!require_secret_value.isExpectedResolvedSecretValue(resolved, target.entry.expectedResolvedValue)) {
			if (params.inactiveRefPaths?.has(target.path)) {
				diagnostics.push(`${target.path}: secret ref is configured on an inactive surface; skipping command-time assignment.`);
				inactive.push({
					path: target.path,
					pathSegments: [...target.pathSegments]
				});
				continue;
			}
			unresolved.push({
				path: target.path,
				pathSegments: [...target.pathSegments]
			});
			continue;
		}
		assignments.push({
			path: target.path,
			pathSegments: [...target.pathSegments],
			value: resolved
		});
		if (target.entry.secretShape === "sibling_ref" && explicitRef && inlineCandidateRef) diagnostics.push(`${target.path}: both inline and sibling ref were present; sibling ref took precedence.`);
	}
	return {
		assignments,
		diagnostics,
		unresolved,
		inactive
	};
}
//#endregion
Object.defineProperty(exports, "analyzeCommandSecretAssignmentsFromSnapshot", {
	enumerable: true,
	get: function() {
		return analyzeCommandSecretAssignmentsFromSnapshot;
	}
});
