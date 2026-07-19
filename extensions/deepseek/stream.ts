// Deepseek plugin module implements stream behavior.
import type { ProviderWrapStreamFnContext } from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
import { createDeepSeekV4OpenAICompatibleThinkingWrapper } from "@gabrielvfonseca/operator/plugin-sdk/provider-stream-shared";
import { isDeepSeekV4ModelRef } from "./models.js";

export function createDeepSeekV4ThinkingWrapper(
  baseStreamFn: ProviderWrapStreamFnContext["streamFn"],
  thinkingLevel: ProviderWrapStreamFnContext["thinkingLevel"],
): ProviderWrapStreamFnContext["streamFn"] {
  return createDeepSeekV4OpenAICompatibleThinkingWrapper({
    baseStreamFn,
    thinkingLevel,
    shouldPatchModel: isDeepSeekV4ModelRef,
  });
}
