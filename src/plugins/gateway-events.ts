import type { PluginJsonValue } from "./host-hook-json.js";

export type OperatorPluginGatewayEventScope = "operator.read" | "operator.write" | "operator.admin";

export type OperatorPluginGatewayEvents = {
  emit: (
    event: string,
    payload: PluginJsonValue,
    opts: { scope: OperatorPluginGatewayEventScope },
  ) => void;
};
