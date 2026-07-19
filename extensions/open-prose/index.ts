// Open Prose plugin entrypoint registers its Operator integration.
import { definePluginEntry, type OperatorPluginApi } from "./runtime-api.js";

export default definePluginEntry({
  id: "open-prose",
  name: "OpenProse",
  description: "Plugin-shipped prose skills bundle",
  register(_api: OperatorPluginApi) {
    // OpenProse is delivered via plugin-shipped skills.
  },
});
