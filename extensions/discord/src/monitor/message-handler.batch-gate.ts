// Discord plugin module implements message handler.batch gate behavior.
import type { ReplyToMode } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import type { ReplyThreadingPolicy } from "@gabrielvfonseca/operator/plugin-sdk/reply-reference";
import { resolveBatchedReplyThreadingPolicy } from "@gabrielvfonseca/operator/plugin-sdk/reply-reference";

type ReplyThreadingContext = {
  ReplyThreading?: ReplyThreadingPolicy;
};

export function applyImplicitReplyBatchGate(
  ctx: object,
  replyToMode: ReplyToMode,
  isBatched: boolean,
) {
  const replyThreading = resolveBatchedReplyThreadingPolicy(replyToMode, isBatched);
  if (!replyThreading) {
    return;
  }
  (ctx as ReplyThreadingContext).ReplyThreading = replyThreading;
}
