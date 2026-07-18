import "./model-discovery-cache.js";

type ModelDiscoveryCacheTestApi = {
  resetModelDiscoveryCacheForTest(): void;
};

function getTestApi(): ModelDiscoveryCacheTestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("operator.modelDiscoveryCacheTestApi")
  ] as ModelDiscoveryCacheTestApi;
}

export function resetModelDiscoveryCacheForTest(): void {
  getTestApi().resetModelDiscoveryCacheForTest();
}
