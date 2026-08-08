import fs from "node:fs/promises";
import { constants } from "node:fs";
import { sep, resolve } from "node:path";
import { FsSafeError } from "./errors.js";

// Re-export from root.ts to avoid duplication
export { root, type OpenResult, type ReadResult, type Root } from "./root.js";

/**
 * Assert that a path does not have symlink parents.
 */
export function assertNoSymlinkParents(path: string): void {
  // Placeholder implementation
  // In a real implementation, this would check the path for symlink parents
  // and throw an error if any are found
}

/**
 * Assert that a path does not have symlink parents (synchronous version).
 */
export function assertNoSymlinkParentsSync(path: string): void {
  // Placeholder implementation
  // In a real implementation, this would check the path for symlink parents
  // and throw an error if any are found
}

/**
 * Check if two paths refer to the same file.
 */
export function sameFileIdentity(path1: string, path2: string): boolean {
  // Placeholder implementation
  // In a real implementation, this would resolve both paths and compare them
  return path1 === path2;
}

/**
 * Sanitize an untrusted file name.
 */
export function sanitizeUntrustedFileName(name: string): string {
  // Placeholder implementation
  // Remove or replace unsafe characters
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}

/**
 * Check if a path exists.
 */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path exists (synchronous version).
 */
export function pathExistsSync(path: string): boolean {
  // Placeholder implementation
  // In a real implementation, this would use fs.accessSync
  return false;
}

/**
 * Options for moving a path to trash.
 */
export interface MovePathToTrashOptions {
  /** Whether to force the operation. */
  force?: boolean;
}

/**
 * Move a path to trash.
 */
export async function movePathToTrash(path: string, options?: MovePathToTrashOptions): Promise<void> {
  // Placeholder implementation
  // In a real implementation, this would move the file to the system trash
  return Promise.resolve();
}

/**
 * Read a local file from roots.
 */
export async function readLocalFileFromRoots(path: string): Promise<string> {
  // Placeholder implementation
  // In a real implementation, this would read from a set of root paths
  return "";
}

/**
 * Resolve a local path from roots (synchronous version).
 */
export function resolveLocalPathFromRootsSync(path: string): string {
  // Placeholder implementation
  // In a real implementation, this would resolve from a set of root paths
  return path;
}

/**
 * Append to a regular file.
 */
export async function appendRegularFile(path: string, data: string | Buffer): Promise<void> {
  // Placeholder implementation
  // In a real implementation, this would append data to the file
  await fs.appendFile(path, data);
}

/**
 * Append to a regular file (synchronous version).
 */
export function appendRegularFileSync(path: string, data: string | Buffer): void {
  // Placeholder implementation
  // In a real implementation, this would append data to the file synchronously
}

/**
 * Read a regular file.
 */
export async function readRegularFile(path: string): Promise<string | Buffer> {
  // Placeholder implementation
  // In a real implementation, this would read the file contents
  const buffer = await fs.readFile(path);
  // Try to return as string if it's valid UTF8, otherwise return buffer
  try {
    return buffer.toString("utf8");
  } catch {
    return buffer;
  }
}

/**
 * Read a regular file (synchronous version).
 */
export function readRegularFileSync(path: string): string | Buffer {
  // Placeholder implementation
  // In a real implementation, this would read the file contents synchronously
  return "";
}

/**
 * Resolve regular file append flags.
 */
export function resolveRegularFileAppendFlags(path: string): number {
  // Placeholder implementation
  // In a real implementation, this would return the appropriate flags for appending
  return 0o1024; // O_APPEND in octal
}

/**
 * Stat a regular file.
 */
export async function statRegularFile(path: string): Promise<import("node:fs").Stats> {
  // Placeholder implementation
  // In a real implementation, this would return the file stats
  return fs.stat(path);
}

/**
 * Stat a regular file (synchronous version).
 */
export function statRegularFileSync(path: string): import("node:fs").Stats {
  // Placeholder implementation
  // In a real implementation, this would return the file stats synchronously
  return {} as import("node:fs").Stats;
}

/**
 * Open a local file safely.
 */
export async function openLocalFileSafely(filePath: string): Promise<{ buffer: Buffer; realPath: string }> {
  // Placeholder implementation
  // In a real implementation, this would safely open and read the file
  const buffer = await fs.readFile(filePath);
  return { buffer, realPath: filePath };
}

/**
 * Read a local file safely.
 */
export async function readLocalFileSafely(filePath: string): Promise<string> {
  // Placeholder implementation
  // In a real implementation, this would safely read the file
  const buffer = await fs.readFile(filePath);
  return buffer.toString("utf8");
}

/**
 * Resolve the real path of an opened file handle.
 * 
 * Note: This is a placeholder implementation.
 * In a real implementation, this would take an actual file handle
 * and return its real path.
 */
export function resolveOpenedFileRealPathForHandle(filePath: string): string {
  // Placeholder implementation
  // In a real implementation, this would resolve any symlinks in the path
  return filePath;
}

/**
 * Execute a function with a timeout.
 */
export function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
  ]);
}
