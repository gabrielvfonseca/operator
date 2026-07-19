// Matrix plugin module implements monitor route test support behavior.
export {
  registerSessionBindingAdapter,
  testing,
} from "@gabrielvfonseca/operator/plugin-sdk/session-binding-runtime";
export { resolveAgentRoute } from "@gabrielvfonseca/operator/plugin-sdk/routing";
export {
  createTestRegistry,
  setActivePluginRegistry,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-test-runtime";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
