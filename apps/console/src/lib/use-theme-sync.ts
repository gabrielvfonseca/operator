"use client";

import * as React from "react";

import applyThemeToElement from "./applyThemeToElement";
import readLegacyThemeSettings from "./readLegacyThemeSettings";
import resolveTheme from "./resolveTheme";

/**
 * Applies the persisted Control UI theme to <html> before paint.
 *
 * Runs a synchronous inline pass in `layout.tsx` for SSR/first paint, and this
 * hook keeps it in sync with OS preference changes for `mode: "system"`.
 */
export function useThemeSync(): void {
  React.useEffect(() => {
    const element = document.documentElement;
    const legacy = readLegacyThemeSettings(globalThis.localStorage);
    const prefersLight = globalThis.matchMedia?.("(prefers-color-scheme: light)").matches ?? false;
    const resolved = resolveTheme(legacy?.theme, legacy?.themeMode, prefersLight);

    if (resolved?.theme && resolved?.themeMode) {
      applyThemeToElement(element, resolved.theme, resolved.themeMode);
    }
  });

  return () => {
    // Cleanup if needed
  };
}
