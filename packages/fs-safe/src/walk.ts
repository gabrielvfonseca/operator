import { readdir, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { FsSafeError } from "./errors.js";

/**
 * Entry in a directory walk.
 */
export interface WalkDirectoryEntry {
  /** The name of the file or directory. */
  name: string;
  /** The full path to the file or directory. */
  path: string;
  /** Whether the entry is a directory. */
  isDirectory: boolean;
  /** The size of the file in bytes (if it's a file). */
  size: number;
  /** The last modified time. */
  mtime: Date;
}

/**
 * Options for walking a directory.
 */
export interface WalkDirectoryOptions {
  /** Whether to follow symbolic links. */
  followLinks?: boolean;
  /** Whether to include the root directory in the results. */
  includeRoot?: boolean;
  /** Maximum depth to traverse. */
  maxDepth?: number;
  /** Filter function to include/exclude entries. */
  filter?: (entry: WalkDirectoryEntry) => boolean;
}

/**
 * Result of walking a directory.
 */
export interface WalkDirectoryResult {
  /** The entries found during the walk. */
  entries: WalkDirectoryEntry[];
  /** The total number of directories visited. */
  directories: number;
  /** The total number of files visited. */
  files: number;
}

/**
 * Walk a directory asynchronously.
 * 
 * @param rootDir - The root directory to walk
 * @param options - Walking options
 * @returns The walk result
 */
export async function walkDirectory(
  rootDir: string,
  options: WalkDirectoryOptions = {}
): Promise<WalkDirectoryResult> {
  const absoluteRoot = resolve(rootDir);
  const opts: WalkDirectoryOptions = {
    followLinks: options.followLinks ?? false,
    includeRoot: options.includeRoot ?? false,
    maxDepth: options.maxDepth ?? Number.MAX_SAFE_INTEGER,
    filter: options.filter ?? (() => true),
    ...options
  };
  
  const result: WalkDirectoryResult = {
    entries: [],
    directories: 0,
    files: 0
  };
  
  await walkDirectoryRecursive(absoluteRoot, absoluteRoot, 0, opts, result);
  return result;
}

/**
 * Walk a directory synchronously.
 * 
 * @param rootDir - The root directory to walk
 * @param options - Walking options
 * @returns The walk result
 */
export function walkDirectorySync(
  rootDir: string,
  options: WalkDirectoryOptions = {}
): WalkDirectoryResult {
  // Synchronous version would be implemented here
  // For simplicity, we'll throw an error indicating it's not implemented
  throw new Error("walkDirectorySync is not implemented");
}

/**
 * Recursively walk a directory.
 * 
 * @param rootDir - The original root directory
 * @param currentDir - The current directory being walked
 * @param currentDepth - The current depth in the walk
 * @param options - Walking options
 * @param result - The result object to populate
 */
async function walkDirectoryRecursive(
  rootDir: string,
  currentDir: string,
  currentDepth: number,
  options: WalkDirectoryOptions,
  result: WalkDirectoryResult
): Promise<void> {
  // Check if we've exceeded the maximum depth
  if (currentDepth > (options.maxDepth ?? Number.MAX_SAFE_INTEGER)) {
    return;
  }
  
  try {
    const entries = await readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = resolve(currentDir, entry.name);
      
      // Skip if outside root (shouldn't happen, but just in case)
      if (!fullPath.startsWith(rootDir)) {
        continue;
      }
      
      // Get file stats
      const stats = await stat(fullPath);
      
      // Create the walk entry
      const walkEntry: WalkDirectoryEntry = {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        size: entry.isFile() ? stats.size : 0,
        mtime: stats.mtime
      };
      
      // Apply filter if provided
      if (!(options.filter ?? (() => true))(walkEntry)) {
        continue;
      }
      
      // Add to results
      result.entries.push(walkEntry);
      
      if (entry.isDirectory()) {
        result.directories++;
        // Recursively walk subdirectory
        await walkDirectoryRecursive(rootDir, fullPath, currentDepth + 1, options, result);
      } else {
        result.files++;
      }
    }
  } catch (error) {
    // Handle errors (e.g., permission denied)
    // For now, we'll just skip directories we can't read
    // In a production implementation, you might want to handle this differently
  }
}
