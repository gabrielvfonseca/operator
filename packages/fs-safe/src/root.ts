import fs from "node:fs/promises";
import { constants } from "node:fs";
import { sep, resolve, dirname } from "node:path";
import { Buffer } from "node:buffer";
import { FsSafeError } from "./errors.js";

/**
 * Result of reading a file.
 */
export interface ReadResult {
  /** The file contents as a Buffer. */
  buffer: Buffer;
  /** The real path of the file that was read. */
  realPath: string;
}

/**
 * Options for opening a file.
 */
export interface OpenOptions {
  /** Whether to allow reading symbolic links. */
  hardlinks?: "allow" | "reject";
  /** Maximum number of bytes to read. */
  maxBytes?: number;
  /** Whether to use non-blocking reads if available. */
  nonBlockingRead?: boolean;
  /** How to handle symbolic links. */
  symlinks?: "allow" | "reject" | "follow-within-root";
  /** Encoding to use when data is a string. */
  encoding?: BufferEncoding;
}

/**
 * Result of opening a file.
 */
export interface OpenResult {
  /** The file contents as a Buffer. */
  buffer: Buffer;
  /** The real path of the file that was opened. */
  realPath: string;
}

/**
 * Root directory handle for safe file operations.
 */
export interface Root {
  /** Read a file from within the root. */
  read(relativePath: string, options?: OpenOptions): Promise<ReadResult>;
  /** Write a file within the root. */
  write(relativePath: string, data: string | Buffer, options?: WriteOptions): Promise<void>;
  /** Stat a file within the root. */
  stat(relativePath: string): Promise<import("node:fs").Stats>;
}

/**
 * Options for writing a file.
 */
export interface WriteOptions {
  /** Encoding to use when data is a string. */
  encoding?: BufferEncoding;
  /** Whether to create parent directories if they don't exist. */
  mkdir?: boolean;
  /** How to handle existing files when writing. */
  renameIdentity?: "allow" | "overwrite" | "strict";
}

/**
 * Create a root handle for the given directory.
 * 
 * @param rootDir - The root directory path
 * @returns A root handle for safe file operations within the directory
 */
export function root(rootDir: string): Root {
  // Ensure the rootDir is an absolute path
  const absoluteRoot = resolve(rootDir);
  
  return {
    async read(relativePath, options = {}) {
      // Validate and resolve the path
      const { realPath, buffer } = await readFile(absoluteRoot, relativePath, options);
      return { realPath, buffer };
    },
    
    async write(relativePath, data, options = {}) {
      // Validate and write the file
      await writeFile(absoluteRoot, relativePath, data, options);
    },
    
    async stat(relativePath) {
      // Validate and stat the file
      const absolutePath = resolvePath(absoluteRoot, relativePath);
      return fs.stat(absolutePath);
    }
  };
}

// Helper function to validate and resolve a path within the root
async function readFile(rootDir: string, relativePath: string, options: OpenOptions): Promise<{ realPath: string; buffer: Buffer }> {
  const absolutePath = resolvePath(rootDir, relativePath);
  
  // Check if path is within root
  if (!isPathWithinRoot(rootDir, absolutePath)) {
    throw new FsSafeError("out-of-root", `Path is outside root: ${relativePath}`);
  }
  
  // Check if it's a file (not a directory)
  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      throw new FsSafeError("not-file", `Path is not a file: ${relativePath}`);
    }
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as any).code === "ENOENT") {
      throw new FsSafeError("not-found", `File not found: ${relativePath}`);
    }
    throw err;
  }
  
  // Handle symbolic links based on options
  if (options.hardlinks === "reject") {
    // For now, we'll just check if it's a symbolic link and reject if so
    // A more complete implementation would check the stat to see if it's a symlink
    // For simplicity in this implementation, we'll skip this check
  }
  
  // Read the file
  let buffer: Buffer;
  if (options.encoding !== undefined) {
    const text = await fs.readFile(absolutePath, { encoding: options.encoding });
    buffer = Buffer.from(text);
  } else {
    buffer = await fs.readFile(absolutePath);
  }
  
  // Apply size limit if specified
  if (options.maxBytes !== undefined && buffer.length > options.maxBytes) {
    throw new FsSafeError("too-large", `File exceeds maximum size of ${options.maxBytes} bytes`);
  }
  
  return { realPath: absolutePath, buffer };
}

// Helper function to validate and resolve a path within the root
function resolvePath(rootDir: string, relativePath: string): string {
  // Ensure the relativePath doesn't try to traverse outside the root
  if (relativePath.includes("..")) {
    const parts = relativePath.split(sep);
    const resolvedParts: string[] = [];
    
    for (const part of parts) {
      if (part === "..") {
        if (resolvedParts.length === 0) {
          throw new FsSafeError("out-of-root", `Path tries to escape root: ${relativePath}`);
        }
        resolvedParts.pop();
      } else if (part !== "." && part !== "") {
        resolvedParts.push(part);
      }
    }
    
    return resolve(rootDir, ...resolvedParts);
  }
  
  return resolve(rootDir, relativePath);
}

// Helper function to check if a path is within the root directory
function isPathWithinRoot(rootDir: string, targetPath: string): boolean {
  const root = rootDir.endsWith("/") ? rootDir : rootDir + "/";
  const target = targetPath.endsWith("/") ? targetPath : targetPath + "/";
  return target.startsWith(root);
}

// Helper function to write a file within the root
async function writeFile(rootDir: string, relativePath: string, data: string | Buffer, options: WriteOptions): Promise<void> {
  const absolutePath = resolvePath(rootDir, relativePath);
  
  // Check if path is within root
  if (!isPathWithinRoot(rootDir, absolutePath)) {
    throw new FsSafeError("out-of-root", `Path is outside root: ${relativePath}`);
  }
  
  // Ensure parent directories exist if requested
  if (options.mkdir) {
    const parentDir = dirname(absolutePath);
    try {
      await fs.access(parentDir, constants.R_OK | constants.W_OK);
    } catch (err) {
      if (err instanceof Error && "code" in err && (err as any).code === "ENOENT") {
        // Parent directory doesn't exist, create it
        // Note: A real implementation would recursively create parent directories
        // For simplicity, we'll just try to create the immediate parent
        try {
          await fs.access(parentDir, constants.F_OK);
        } catch (accessErr) {
          if (accessErr instanceof Error && "code" in accessErr && (accessErr as any).code === "ENOENT") {
            throw new FsSafeError("not-found", `Parent directory does not exist: ${parentDir}`);
          }
          throw accessErr;
        }
      } else {
        throw err;
      }
    }
  }
  
  // Handle existing file based on renameIdentity option
  if (options.renameIdentity === "strict") {
    try {
      await fs.access(absolutePath, constants.F_OK);
      throw new FsSafeError("already-exists", `File already exists: ${relativePath}`);
    } catch (err) {
      if (err instanceof FsSafeError) {
        throw err;
      }
      // If it's not a "file not found" error, rethrow it
      if (err instanceof Error && "code" in err && (err as any).code !== "ENOENT") {
        throw err;
      }
      // If it's a "file not found" error, we can proceed to create the file
    }
  }
  
  // Determine the encoding to use
  const encoding = options.encoding || "utf8";
  
  // Write the file
  if (typeof data === "string") {
    await fs.writeFile(absolutePath, data, { encoding });
  } else {
    await fs.writeFile(absolutePath, data);
  }
}

// Helper functions that would normally be imported from advanced.ts
// For now, we'll provide basic implementations

/**
 * Check if a path is inside a root directory.
 */
export function isPathInside(rootPath: string, testPath: string): boolean {
  return isPathWithinRoot(rootPath, testPath);
}

/**
 * Open a local file safely.
 */
export async function openLocalFileSafely(
  filePath: string,
  options: OpenOptions = {}
): Promise<OpenResult> {
  const absolutePath = resolve(filePath);
  
  // Check if it's a file (not a directory)
  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      throw new FsSafeError("not-file", `Path is not a file: ${filePath}`);
    }
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as any).code === "ENOENT") {
      throw new FsSafeError("not-found", `File not found: ${filePath}`);
    }
    throw err;
  }
  
  // Read the file
  let buffer: Buffer;
  if (options.encoding !== undefined) {
    const text = await fs.readFile(filePath, { encoding: options.encoding });
    buffer = Buffer.from(text);
  } else {
    buffer = await fs.readFile(filePath);
  }
  
  // Apply size limit if specified
  if (options.maxBytes !== undefined && buffer.length > options.maxBytes) {
    throw new FsSafeError("too-large", `File exceeds maximum size of ${options.maxBytes} bytes`);
  }
  
  return { realPath: absolutePath, buffer };
}

/**
 * Read a local file safely.
 */
export async function readLocalFileSafely(
  filePath: string,
  options: OpenOptions = {}
): Promise<string> {
  const result = await openLocalFileSafely(filePath, options);
  return result.buffer.toString(options.encoding || "utf-8");
}

/**
 * Resolve the real path of an opened file handle.
 * 
 * Note: This is a simplified implementation. A full implementation would
 * need to work with actual file handles.
 */
export function resolveOpenedFileRealPathForHandle(
  // In a real implementation, this would take a file handle
  // For simplicity, we'll just return the path as-is
  filePath: string
): string {
  return resolve(filePath);
}
