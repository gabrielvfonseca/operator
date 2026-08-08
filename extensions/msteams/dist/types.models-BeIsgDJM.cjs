const require_string_readers = require("./string-readers-DjRuUveR.cjs");
//#region src/config/types.models.ts
/** Provider API adapter ids accepted by model/provider config and schema generation. */
const MODEL_APIS = [
	"openai-completions",
	"openai-responses",
	"openai-chatgpt-responses",
	"anthropic-messages",
	"google-generative-ai",
	"google-vertex",
	"github-copilot",
	"bedrock-converse-stream",
	"ollama",
	"azure-openai-responses"
];
/** Thinking/reasoning payload dialects emitted by OpenAI-compatible providers. */
const MODEL_THINKING_FORMATS = [
	"openai",
	"openrouter",
	"deepseek",
	"together",
	"qwen",
	"qwen-chat-template",
	"zai"
];
/** Runtime guard for config-provided thinking format strings. */
function isModelThinkingFormat(value) {
	return require_string_readers.isStringOption(value, MODEL_THINKING_FORMATS);
}
//#endregion
Object.defineProperty(exports, "MODEL_APIS", {
	enumerable: true,
	get: function() {
		return MODEL_APIS;
	}
});
Object.defineProperty(exports, "MODEL_THINKING_FORMATS", {
	enumerable: true,
	get: function() {
		return MODEL_THINKING_FORMATS;
	}
});
Object.defineProperty(exports, "isModelThinkingFormat", {
	enumerable: true,
	get: function() {
		return isModelThinkingFormat;
	}
});
