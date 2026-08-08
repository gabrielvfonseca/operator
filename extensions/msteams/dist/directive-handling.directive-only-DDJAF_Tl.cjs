const require_mentions = require("./mentions-xs5giNxG.cjs");
//#region src/auto-reply/reply/directive-handling.directive-only.ts
/** True when a message only changes directive state and has no agent body. */
function isDirectiveOnly(params) {
	const { directives, cleanedBody, ctx, cfg, agentId, isGroup } = params;
	if (!directives.hasThinkDirective && !directives.hasVerboseDirective && !directives.hasTraceDirective && !directives.hasFastDirective && !directives.hasReasoningDirective && !directives.hasElevatedDirective && !directives.hasExecDirective && !directives.hasModelDirective && !directives.hasQueueDirective) return false;
	const stripped = require_mentions.stripStructuralPrefixes(cleanedBody ?? "");
	return (isGroup ? require_mentions.stripMentions(stripped, ctx, cfg, agentId) : stripped).length === 0;
}
//#endregion
Object.defineProperty(exports, "isDirectiveOnly", {
	enumerable: true,
	get: function() {
		return isDirectiveOnly;
	}
});
