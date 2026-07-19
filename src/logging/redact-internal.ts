import type { OperatorConfig } from "../config/types.operator.js";
import { fullContextToolPayloadRedactionState } from "./redact-internal-state.js";

type LoggingConfig = OperatorConfig["logging"];

export function isFullContextToolPayloadRedaction(loggingConfig: LoggingConfig): boolean {
  return fullContextToolPayloadRedactionState.isMarked(loggingConfig);
}
