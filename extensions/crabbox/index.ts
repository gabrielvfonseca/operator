import { definePluginEntry } from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
import { createCrabboxWorkerProvider, resolveOperatorRoot } from "./src/crabbox-worker-provider.js";

export default definePluginEntry({
  id: "crabbox",
  name: "Crabbox Worker Provider",
  description: "Cloud worker provider backed by the Crabbox CLI",
  register(api) {
    api.registerWorkerProvider(
      createCrabboxWorkerProvider({ openclawRoot: resolveOperatorRoot(api.rootDir) }),
    );
  },
});
