import type { AgentMessage } from "@gabrielvfonseca/operator/plugin-sdk/agent-harness-runtime";
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import { withSessionTranscriptWriteLock } from "@gabrielvfonseca/operator/plugin-sdk/session-transcript-runtime";
import { CLAUDE_CLI_BACKEND_ID } from "./cli-constants.js";
import type { ClaudeTranscriptItem } from "./session-catalog-transcript.js";

function importedClaudeMessage(
  item: ClaudeTranscriptItem,
  fallbackTimestamp: number,
): AgentMessage {
  const timestamp = item.timestamp ? Date.parse(item.timestamp) : fallbackTimestamp;
  const text = item.text?.trim() || "[Unsupported Claude transcript item]";
  if (item.type === "userMessage") {
    // Imported native rows are not Operator-authored; mirrorOrigin excludes them
    // from self-echo provenance so a repeated native prompt stays observable.
    return {
      role: "user",
      content: text,
      timestamp,
      __operator: { mirrorOrigin: "claude-catalog-import" },
    } as AgentMessage;
  }
  const prefix =
    item.type === "reasoning"
      ? "Thinking\n\n"
      : item.type === "toolCall"
        ? "Tool call\n\n"
        : item.type === "toolResult"
          ? "Tool result\n\n"
          : "";
  return {
    role: "assistant",
    content: [{ type: "text", text: `${prefix}${text}` }],
    timestamp,
    api: "anthropic-messages",
    provider: CLAUDE_CLI_BACKEND_ID,
    model: "native-history",
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason: "stop",
  } as AgentMessage;
}

export async function importClaudeHistory(params: {
  items: ClaudeTranscriptItem[];
  threadId: string;
  sessionFile: string;
  sessionId: string;
  sessionKey: string;
  agentId: string;
  cwd?: string;
  config: OperatorConfig;
}): Promise<void> {
  const items = params.items.toReversed();
  await withSessionTranscriptWriteLock(params, async (transcript) => {
    for (const [index, item] of items.entries()) {
      // The idempotency key rides on the message so recovery re-imports dedupe.
      const message = {
        ...(importedClaudeMessage(item, Date.now() + index) as unknown as Record<string, unknown>),
        idempotencyKey: `claude-catalog:${params.threadId}:${item.uuid ?? index}`,
      } as unknown as AgentMessage;
      await transcript.appendMessage({
        message,
        idempotencyLookup: "scan",
        cwd: params.cwd,
      });
    }
  });
}
