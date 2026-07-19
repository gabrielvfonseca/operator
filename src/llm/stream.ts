// Streams LLM responses through registered providers and normalizes events.
// This facade owns the process-default AI runtime wiring: it installs the
// Operator host policy ports and registers built-in providers exactly once,
// before any caller imports the stream API.
import { defaultApiRegistry } from "@operator/ai/internal/runtime";
import { registerBuiltInApiProviders } from "@operator/ai/providers";
import "./ai-transport-host.js";

registerBuiltInApiProviders(defaultApiRegistry);

export { complete, completeSimple, stream, streamSimple } from "@operator/ai/internal/runtime";
