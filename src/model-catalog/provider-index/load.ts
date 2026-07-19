// Provider-index loader normalizes bundled installable-provider metadata and falls back to an empty index.
import { normalizeOperatorProviderIndex } from "./normalize.js";
import { OPERATOR_PROVIDER_INDEX } from "./openclaw-provider-index.js";
import type { OperatorProviderIndex } from "./types.js";

// Load the bundled provider index through the normalizer. Invalid generated or
// caller-supplied data falls back to an empty v1 index instead of leaking shape.
export function loadOperatorProviderIndex(
  source: unknown = OPERATOR_PROVIDER_INDEX,
): OperatorProviderIndex {
  return normalizeOperatorProviderIndex(source) ?? { version: 1, providers: {} };
}
