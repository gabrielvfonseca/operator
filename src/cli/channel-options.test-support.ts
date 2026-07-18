import "./channel-options.js";

type CliChannelOptionsTestApi = {
  resetPrecomputedChannelOptionsForTests(): void;
};

function getTestApi(): CliChannelOptionsTestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("operator.cliChannelOptionsTestApi")
  ] as CliChannelOptionsTestApi;
}

export const testing = {
  resetPrecomputedChannelOptionsForTests(): void {
    getTestApi().resetPrecomputedChannelOptionsForTests();
  },
};
