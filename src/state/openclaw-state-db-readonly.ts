import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { clearNodeSqliteKyselyCacheForDatabase } from "../infra/kysely-sync.js";
import { requireNodeSqlite } from "../infra/node-sqlite.js";
import {
  createNewerSqliteSchemaVersionError,
  readSqliteUserVersion,
} from "../infra/sqlite-user-version.js";
import {
  OPERATOR_SQLITE_BUSY_TIMEOUT_MS,
  OPERATOR_STATE_SCHEMA_VERSION,
  type OperatorStateDatabaseOptions,
} from "./openclaw-state-db.js";
import { resolveOperatorStateSqlitePath } from "./openclaw-state-db.paths.js";

type OperatorStateReadOnlyDatabase = {
  db: DatabaseSync;
  path: string;
};

function assertSupportedSchemaVersion(db: DatabaseSync, pathname: string): void {
  const userVersion = readSqliteUserVersion(db);
  if (userVersion > OPERATOR_STATE_SCHEMA_VERSION) {
    throw createNewerSqliteSchemaVersionError(
      "Operator state database",
      pathname,
      userVersion,
      OPERATOR_STATE_SCHEMA_VERSION,
    );
  }
}

/**
 * Read shared state without joining the writable lifecycle.
 *
 * CLI metadata reads can overlap a live Gateway. Keep them off schema repair,
 * journal-mode setup, checkpoints, and permission mutation owned by writers.
 */
export function withOperatorStateDatabaseReadOnly<T>(
  operation: (database: OperatorStateReadOnlyDatabase) => T,
  options: OperatorStateDatabaseOptions = {},
): T {
  const pathname = path.resolve(
    options.path ?? resolveOperatorStateSqlitePath(options.env ?? process.env),
  );
  const sqlite = requireNodeSqlite();
  const db = new sqlite.DatabaseSync(pathname, { readOnly: true });
  try {
    db.exec(`PRAGMA busy_timeout = ${OPERATOR_SQLITE_BUSY_TIMEOUT_MS};`);
    assertSupportedSchemaVersion(db, pathname);
    return operation({ db, path: pathname });
  } finally {
    clearNodeSqliteKyselyCacheForDatabase(db);
    db.close();
  }
}
