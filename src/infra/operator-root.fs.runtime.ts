// Operator root resolution imports fs through this facade so tests can replace
// filesystem behavior without mocking node:fs globally.
export { default as operatorRootFsSync } from "node:fs";
export { default as operatorRootFs } from "node:fs/promises";
