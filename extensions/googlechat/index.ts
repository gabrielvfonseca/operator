// Googlechat plugin entrypoint registers its Operator integration.
import { defineBundledChannelEntry } from "@gabrielvfonseca/operator/plugin-sdk/channel-entry-contract";

export default defineBundledChannelEntry({
  id: "googlechat",
  name: "Google Chat",
  description: "Operator Google Chat channel plugin",
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "googlechatPlugin",
  },
  secrets: {
    specifier: "./secret-contract-api.js",
    exportName: "channelSecrets",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setGoogleChatRuntime",
  },
});
