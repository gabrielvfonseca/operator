export class FsSafeError extends Error {
  public readonly code: string;
  public readonly cause?: Error;

  constructor(code: string, message: string, options: { cause?: Error } = {}) {
    super(message);
    this.code = code;
    this.cause = options.cause;
  }
}

export type FsSafeErrorCode = 
  | "not-found"
  | "symlink"
  | "invalid-path"
  | "not-directory"
  | "not-file"
  | "already-exists"
  | "permission-denied"
  | "out-of-root"
  | "too-large"
  | "unsupported-operation"
  | string;
