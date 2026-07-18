type FallbackSkipCacheState = {
  buckets: Map<string, Map<string, unknown>>;
  lastGlobalPruneAtMs: number;
};

function getFallbackSkipCacheGlobals() {
  return globalThis as typeof globalThis & {
    operatorFallbackSkipCache?: Map<string, Map<string, unknown>>;
    operatorFallbackSkipCacheState?: FallbackSkipCacheState;
  };
}

export function resetFallbackSkipCacheForTest(): void {
  const globals = getFallbackSkipCacheGlobals();
  globals.operatorFallbackSkipCache?.clear();
  globals.operatorFallbackSkipCacheState?.buckets.clear();
  if (globals.operatorFallbackSkipCacheState) {
    globals.operatorFallbackSkipCacheState.lastGlobalPruneAtMs = 0;
  }
}

export function listFallbackSkipCacheSessionIdsForTest(): string[] {
  const globals = getFallbackSkipCacheGlobals();
  return [...(globals.operatorFallbackSkipCacheState?.buckets.keys() ?? [])];
}
