import type { OperatorPluginApi } from "./plugin-api.types.js";
import type { OperatorPluginConfigSchema } from "./plugin-config-schema.types.js";
import type { PluginKind } from "./plugin-kind.types.js";
import type {
  OperatorPluginReloadRegistration,
  OperatorPluginSecurityAuditCollector,
} from "./plugin-registration.types.js";
import type { OperatorPluginNodeHostCommand } from "./types.node-host.js";

/** Module-level plugin definition loaded from a native plugin entry file. */
export type OperatorPluginDefinition = {
  id?: string;
  name?: string;
  description?: string;
  version?: string;
  /**
   * @deprecated Declare exclusive plugin kind in `operator.plugin.json` via
   * manifest `kind`. Runtime-exported `kind` is kept as a compatibility
   * fallback for older plugins and may require loading plugin runtime on
   * metadata-only command paths.
   */
  kind?: PluginKind | PluginKind[];
  configSchema?: OperatorPluginConfigSchema;
  reload?: OperatorPluginReloadRegistration;
  nodeHostCommands?: OperatorPluginNodeHostCommand[];
  securityAuditCollectors?: OperatorPluginSecurityAuditCollector[];
  register?: (api: OperatorPluginApi) => void;
  activate?: (api: OperatorPluginApi) => void;
};

export type OperatorPluginModule = OperatorPluginDefinition | ((api: OperatorPluginApi) => void);
