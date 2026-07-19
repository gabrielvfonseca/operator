/** Detects whether a daemon was launched by Operator's container-aware service wrapper. */
import { normalizeOptionalString } from "@operator/normalization-core/string-coerce";

/** Resolves the daemon container hint exposed by managed service environments. */
export function resolveDaemonContainerContext(
  env: Record<string, string | undefined> = process.env,
): string | null {
  return (
    normalizeOptionalString(env.OPERATOR_CONTAINER_HINT) ||
    normalizeOptionalString(env.OPERATOR_CONTAINER) ||
    null
  );
}
