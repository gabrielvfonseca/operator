"use client";

import * as React from "react";
import { applyThemeToElement, readLegacyThemeSettings, resolveTheme } from "@operator/design-system";

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
    const prefersLight =
      globalThis.matchMedia?.("(prefers-color-scheme: light)").matches ?? false;
    const resolved = resolveTheme(legacy?.theme, legacy?.themeMode, prefersLight);
    applyThemeToElement(element, resolved);

    const media = globalThis.matchMedia?.("(prefers-color-scheme: light)");
    if (!media) {
      return;
    }
    const onChange = (event: MediaQueryListEvent) => {
      const current = readLegacyThemeSettings(globalThis.localStorage);
      const next = resolveTheme(current?.theme, current?.themeMode, event.matches);
      applyThemeToElement(element, next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
}
