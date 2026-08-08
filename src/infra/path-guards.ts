// Exposes generic path guard helpers with fs-safe defaults.
import "./fs-safe-defaults.js";

// Generic path guard facade for containment checks and safe relative paths.
export {
  isNotFoundPathError,
  isPathInside,
  normalizeWindowsPathForComparison,
  safeStatSync,
} from "@operator/fs-safe/path";
