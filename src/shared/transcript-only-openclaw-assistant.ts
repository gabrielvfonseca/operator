// Identifies OpenClaw-authored assistant rows that are transcript bookkeeping,
// not provider model output. Some history surfaces keep gateway-injected rows
// visible, so use the narrower delivery-mirror predicate when visibility matters.
export const OPERATOR_TRANSCRIPT_ARTIFACT_API = "operator-transcript" as const;
export const OPERATOR_TRANSCRIPT_ARTIFACT_PROVIDER = "operator" as const;
export const OPERATOR_DELIVERY_MIRROR_MODEL = "delivery-mirror" as const;
const OPERATOR_GATEWAY_INJECTED_MODEL = "gateway-injected" as const;

const TRANSCRIPT_ONLY_OPERATOR_ASSISTANT_MODELS = new Set<string>([
  OPERATOR_DELIVERY_MIRROR_MODEL,
  OPERATOR_GATEWAY_INJECTED_MODEL,
]);

export function isTranscriptOnlyOpenClawAssistantModel(provider: unknown, model: unknown): boolean {
  return (
    provider === OPERATOR_TRANSCRIPT_ARTIFACT_PROVIDER &&
    typeof model === "string" &&
    TRANSCRIPT_ONLY_OPERATOR_ASSISTANT_MODELS.has(model)
  );
}

export function isTranscriptOnlyOpenClawAssistantMessage(message: unknown): boolean {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return false;
  }
  const entry = message as { role?: unknown; provider?: unknown; model?: unknown };
  return (
    entry.role === "assistant" &&
    isTranscriptOnlyOpenClawAssistantModel(entry.provider, entry.model)
  );
}

export function isOpenClawMessageToolMirrorAssistantMessage(message: unknown): boolean {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return false;
  }
  const entry = message as { role?: unknown; operatorMessageToolMirror?: unknown };
  return entry.role === "assistant" && entry.operatorMessageToolMirror !== undefined;
}

export function isOpenClawInternalSourceReplyMirrorAssistantMessage(message: unknown): boolean {
  if (!isOpenClawMessageToolMirrorAssistantMessage(message)) {
    return false;
  }
  const marker = (message as { operatorMessageToolMirror?: unknown }).operatorMessageToolMirror;
  return (
    Boolean(marker) &&
    typeof marker === "object" &&
    !Array.isArray(marker) &&
    (marker as { sourceReplySink?: unknown }).sourceReplySink === "internal-ui"
  );
}

export function isOpenClawDeliveryMirrorAssistantMessage(message: unknown): boolean {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return false;
  }
  const entry = message as { role?: unknown; provider?: unknown; model?: unknown };
  return (
    entry.role === "assistant" &&
    entry.provider === OPERATOR_TRANSCRIPT_ARTIFACT_PROVIDER &&
    entry.model === OPERATOR_DELIVERY_MIRROR_MODEL
  );
}
