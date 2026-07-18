// Exposes root-scoped path resolution helpers with fs-safe defaults.
import "./fs-safe-defaults.js";

// Root path helpers resolve writable and existing paths without allowing
// traversal outside the configured root.
export {
  resolveExistingPathsWithinRoot,
  resolveStrictExistingPathsWithinRoot,
} from "@operator/fs-safe/advanced";
export { pathScope } from "@operator/fs-safe/advanced";
