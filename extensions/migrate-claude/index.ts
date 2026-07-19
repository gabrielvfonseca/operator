// Migrate Claude plugin entrypoint registers its Operator integration.
import { definePluginEntry } from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
import { buildClaudeMigrationProvider } from "./provider.js";

export default definePluginEntry({
  id: "migrate-claude",
  name: "Claude Migration",
  description: "Imports Claude state into Operator.",
  register(api) {
    api.registerMigrationProvider(buildClaudeMigrationProvider({ runtime: api.runtime }));
  },
});
