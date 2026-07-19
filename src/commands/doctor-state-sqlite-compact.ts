/** Explicit doctor maintenance for the canonical shared state SQLite database. */
import fs from "node:fs";
import {
  assertOperatorStateDatabaseForMaintenance,
  ensureOperatorStatePermissions,
  isOperatorStateDatabaseOpen,
} from "../state/openclaw-state-db.js";
import { resolveOperatorStateSqlitePath } from "../state/openclaw-state-db.paths.js";
import {
  compactDoctorSqliteFile,
  type DoctorSqliteCompactSnapshot,
} from "./doctor-sqlite-compact.js";
import { withDoctorSqliteMaintenanceLock } from "./doctor-sqlite-maintenance-lock.js";

type DoctorStateSqliteCompactReport =
  | {
      mode: "compact";
      path: string;
      reason: "missing";
      skipped: true;
    }
  | {
      after: DoctorSqliteCompactSnapshot;
      before: DoctorSqliteCompactSnapshot;
      integrityCheck: "ok";
      mode: "compact";
      path: string;
      quickCheck: "ok";
      reclaimedBytes: number;
      skipped: false;
    };

type DoctorStateSqliteCompactOptions = {
  env?: NodeJS.ProcessEnv;
};

type DoctorStateSqliteCompactDeps = {
  busyTimeoutMs?: number;
  withMaintenanceLock?: typeof withDoctorSqliteMaintenanceLock;
};

/** Compact only the canonical shared state database resolved for this invocation. */
export async function runDoctorStateSqliteCompact(
  options: DoctorStateSqliteCompactOptions = {},
  deps: DoctorStateSqliteCompactDeps = {},
): Promise<DoctorStateSqliteCompactReport> {
  const env = options.env ?? process.env;
  const sqlitePath = resolveOperatorStateSqlitePath(env);
  const stat = readCanonicalStateDatabaseStat(sqlitePath);
  if (!stat) {
    return {
      mode: "compact",
      path: sqlitePath,
      reason: "missing",
      skipped: true,
    };
  }
  if (!stat.isFile()) {
    throw new Error(`Canonical Operator state database is not a regular file: ${sqlitePath}`);
  }
  const withMaintenanceLock = deps.withMaintenanceLock ?? withDoctorSqliteMaintenanceLock;
  return await withMaintenanceLock({
    env,
    operation: "state SQLite compaction",
    run: () => {
      if (isOperatorStateDatabaseOpen()) {
        throw new Error(
          "The shared Operator state database is already open in this process. Stop Operator and retry.",
        );
      }

      const compact = compactDoctorSqliteFile({
        afterMutation: () => ensureOperatorStatePermissions(sqlitePath, env),
        ...(deps.busyTimeoutMs !== undefined ? { busyTimeoutMs: deps.busyTimeoutMs } : {}),
        sqlitePath,
        validateBeforeMutation: (database) =>
          assertOperatorStateDatabaseForMaintenance(database, { pathname: sqlitePath }),
      });
      return {
        ...compact,
        mode: "compact",
        path: sqlitePath,
        skipped: false,
      };
    },
  });
}

function readCanonicalStateDatabaseStat(sqlitePath: string): fs.Stats | undefined {
  try {
    return fs.lstatSync(sqlitePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}
