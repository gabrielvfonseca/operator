import { sep } from "node:path";

/**
 * Returns true if the `testPath` is inside the `rootPath` directory.
 */
export function isPathInside(rootPath: string, testPath: string): boolean {
  const root = rootPath.endsWith(sep) ? rootPath : rootPath + sep;
  const test = testPath.endsWith(sep) ? testPath : testPath + sep;
  return test.startsWith(root);
}
