import "./openai-completions-transport.js";
import "./openai-responses-transport.js";

const completionsTesting = globalThis.operatorOpenAICompletionsTransportTestApi;
const responsesTesting = globalThis.operatorOpenAIResponsesTransportTestApi;
if (!completionsTesting || !responsesTesting) {
  throw new Error("OpenAI transport test APIs are unavailable outside test mode");
}

export const testing = {
  ...responsesTesting,
  ...completionsTesting,
};
