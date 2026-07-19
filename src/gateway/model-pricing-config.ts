// Gateway model-pricing config helper.
// Resolves whether cost/pricing metadata should be available to Gateway surfaces.
import type { OperatorConfig } from "../config/types.operator.js";

/** Returns whether gateway model pricing/cost metadata should be shown. */
export function isGatewayModelPricingEnabled(config: OperatorConfig): boolean {
  return config.models?.pricing?.enabled !== false;
}
