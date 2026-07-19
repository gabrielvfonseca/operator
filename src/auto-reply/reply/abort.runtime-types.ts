// Shared abort runtime types for cancellation and cutoff persistence.
import type { OperatorConfig } from "../../config/types.operator.js";
import type { FinalizedMsgContext } from "../templating.js";

/** Result from the fast abort path before normal reply dispatch starts. */
type FastAbortResult = {
  handled: boolean;
  aborted: boolean;
  rejectionReason?: "finalizing";
  stoppedSubagents?: number;
};

/** Runtime hook that may convert a message into an immediate abort action. */
export type TryFastAbortFromMessage = (params: {
  ctx: FinalizedMsgContext;
  cfg: OperatorConfig;
}) => Promise<FastAbortResult>;

/** Formats the user-visible abort acknowledgement text. */
export type FormatAbortReplyText = (
  stoppedSubagents?: number,
  rejectionReason?: FastAbortResult["rejectionReason"],
) => string;
