import type { OperatorConfig } from "../config/types.operator.js";
import { fullContextToolPayloadRedactionState } from "./redact-internal-state.js";

type LoggingConfig = OperatorConfig["logging"];

export function withFullContextToolPayloadRedaction(loggingConfig: LoggingConfig): LoggingConfig {
  return fullContextToolPayloadRedactionState.mark(loggingConfig);
}
