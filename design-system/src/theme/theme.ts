/**
 * Theme resolution ported from the legacy Control UI `index.html` bootstrap.
 *
 * Preserves the persisted settings key `openclaw.control.settings.v1` and the
 * theme/mode model so existing users keep their appearance after migration.
 */

export type ThemeName = "claw" | "knot" | "dash";
export type ThemeMode = "system" | "light" | "dark";
export type ResolvedThemeMode = "light" | "dark";

export const LEGACY_SETTINGS_KEY_PREFIX = "openclaw.control.settings.v1";

const THEMES: Record<string, 1> = { claw: 1, knot: 1, dash: 1 };
const MODES: Record<string, 1> = { system: 1, light: 1, dark: 1 };
const LEGACY: Record<string, string> = {
  dark: "claw:dark",
  light: "claw:light",
  openknot: "knot:dark",
  fieldmanual: "dash:dark",
  clawdash: "dash:light",
  system: "claw:system",
};

export type ResolvedTheme = {
  theme: ThemeName;
  mode: ResolvedThemeMode;
  /** Value applied to `data-theme` (includes -light variants for knot/dash). */
  dataTheme: string;
};

function resolveDataTheme(theme: ThemeName, mode: ResolvedThemeMode): string {
  if (theme === "knot") {
    return mode === "light" ? "openknot-light" : "openknot";
  }
  if (theme === "dash") {
    return mode === "light" ? "dash-light" : "dash";
  }
  return mode === "light" ? "light" : "dark";
}

export function resolveTheme(
  rawTheme: string | undefined,
  rawMode: string | undefined,
  prefersLight: boolean,
): ResolvedTheme {
  let t = typeof rawTheme === "string" ? rawTheme : "";
  let m = typeof rawMode === "string" ? rawMode : "";
  const legacy = LEGACY[t];
  const theme = (THEMES[t] ? t : legacy ? legacy.split(":")[0] : "claw") as ThemeName;
  let mode: ThemeMode = (MODES[m] ? m : legacy ? legacy.split(":")[1] : "system") as ThemeMode;
  let resolvedMode: ResolvedThemeMode;
  if (mode === "system") {
    resolvedMode = prefersLight ? "light" : "dark";
  } else {
    resolvedMode = mode;
  }
  return { theme, mode: resolvedMode, dataTheme: resolveDataTheme(theme, resolvedMode) };
}

/** Read the persisted legacy settings blob from localStorage, if present. */
export function readLegacyThemeSettings(
  storage: Pick<Storage, "getItem" | "length" | "key"> | null | undefined,
): { theme?: string; themeMode?: string } | null {
  if (!storage) {
    return null;
  }
  try {
    let raw: string | null = null;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.indexOf(LEGACY_SETTINGS_KEY_PREFIX) === 0) {
        raw = storage.getItem(key);
        if (raw) {
          break;
        }
      }
    }
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { theme?: unknown; themeMode?: unknown };
    return {
      theme: typeof parsed.theme === "string" ? parsed.theme : undefined,
      themeMode: typeof parsed.themeMode === "string" ? parsed.themeMode : undefined,
    };
  } catch {
    return null;
  }
}

/** Apply resolved theme attributes to a document element. */
export function applyThemeToElement(element: HTMLElement, resolved: ResolvedTheme): void {
  element.setAttribute("data-theme", resolved.dataTheme);
  element.setAttribute("data-theme-mode", resolved.mode);
}
