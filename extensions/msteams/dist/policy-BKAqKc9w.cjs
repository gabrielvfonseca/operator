const require_extract = require("./extract-D3xT_vMP.cjs");
const require_exec_approvals_allowlist = require("./exec-approvals-allowlist-DtyPjYFC.cjs");
//#region src/infra/command-analysis/policy.ts
/** Parses a shell or argv command into command segments for approval policy checks. */
function analyzeCommandForPolicy(params) {
	const analysis = require_exec_approvals_allowlist.analyzeArgvCommand({
		argv: params.argv,
		cwd: params.cwd,
		env: params.env
	});
	if (!analysis.ok) return {
		ok: false,
		source: params.source,
		reason: analysis.reason,
		analysis,
		segments: []
	};
	return {
		ok: true,
		source: params.source,
		analysis,
		segments: analysis.segments
	};
}
function detectPolicyInlineEval(segments) {
	return require_extract.detectInlineEvalInSegments(segments);
}
//#endregion
Object.defineProperty(exports, "analyzeCommandForPolicy", {
	enumerable: true,
	get: function() {
		return analyzeCommandForPolicy;
	}
});
Object.defineProperty(exports, "detectPolicyInlineEval", {
	enumerable: true,
	get: function() {
		return detectPolicyInlineEval;
	}
});
