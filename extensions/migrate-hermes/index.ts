// Migrate Hermes plugin entrypoint registers its Operator integration.
import { definePluginEntry } from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
import { buildHermesMigrationProvider } from "./provider.js";

export default definePluginEntry({
  id: "migrate-hermes",
  name: "Hermes Migration",
  description: "Imports Hermes state into Operator.",
  register(api) {
    api.registerMigrationProvider(buildHermesMigrationProvider({ runtime: api.runtime }));
  },
});
