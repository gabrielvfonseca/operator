import fs from "node:fs/promises";
import { resolve } from "node:path";
import { Buffer } from "node:buffer";
import { FsSafeError } from "./errors.js";

/**
 * Options for reading a secure file.
 */
export interface SecureFileReadOptions {
  /** Maximum number of bytes to read. */
  maxBytes?: number;
  /** Encoding to use when converting buffer to string. */
  encoding?: BufferEncoding;
}

/**
 * Result of reading a secure file.
 */
export interface SecureFileReadResult {
  /** The file contents as a Buffer. */
  buffer: Buffer;
  /** The file contents as a string (if encoding was provided). */
  readonly string?: string;
}

/**
 * Read a secure file from the given path.
 * 
 * @param filePath - Path to the file to read
 * @param options - Reading options
 * @returns The file contents
 */
export async function readSecureFile(
  filePath: string,
  options: SecureFileReadOptions = {}
): Promise<SecureFileReadResult> {
  // Resolve the file path
  const absolutePath = resolve(filePath);
  
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
  
  // Create the result object
  const result: SecureFileReadResult = {
    buffer: buffer
  };
  
  // If encoding is provided, also include the string version
  if (options.encoding !== undefined) {
    // We need to create a new object since string is readonly
    Object.assign(result, { string: buffer.toString(options.encoding) });
  }
  
  return result;
}
