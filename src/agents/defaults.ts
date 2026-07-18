// Defaults for agent metadata when upstream does not supply them.
// Keep this aligned with the product-level latest-model baseline.
export const DEFAULT_PROVIDER = "openrouter";
export const DEFAULT_MODEL = "openrouter/auto";
// Conservative fallback used when model metadata is unavailable.
export const DEFAULT_CONTEXT_TOKENS = 200_000;
