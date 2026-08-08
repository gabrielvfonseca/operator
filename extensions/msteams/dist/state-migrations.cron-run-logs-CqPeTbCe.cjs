const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_sqlite_runtime_version = require("./sqlite-runtime-version-BDF92yOP.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_module = require("node:module");
let node_crypto = require("node:crypto");
let kysely = require("kysely");
let node_child_process = require("node:child_process");
node_child_process = require_rolldown_runtime.__toESM(node_child_process, 1);
//#region src/infra/kysely-sync.ts
const kyselyByDatabase = /* @__PURE__ */ new WeakMap();
const compileOnlySqliteDialect = new kysely.SqliteDialect({ database: async () => {
	throw new Error("getNodeSqliteKysely() returns a compile-only Kysely facade; use executeSqliteQuerySync() to execute node:sqlite queries.");
} });
function getNodeSqliteKysely(db) {
	const existing = kyselyByDatabase.get(db);
	if (existing) return existing;
	const kysely$1 = new kysely.Kysely({ dialect: compileOnlySqliteDialect });
	kyselyByDatabase.set(db, kysely$1);
	return kysely$1;
}
/** Execute a compiled Kysely query synchronously against node:sqlite. */
function executeCompiledSqliteQuerySync(db, compiledQuery) {
	const statement = db.prepare(compiledQuery.sql);
	const parameters = compiledQuery.parameters;
	if (statement.columns().length > 0) return { rows: statement.all(...parameters) };
	const { changes, lastInsertRowid } = statement.run(...parameters);
	const result = {
		numAffectedRows: BigInt(changes),
		rows: []
	};
	if (kysely.InsertQueryNode.is(compiledQuery.query) && changes > 0) return {
		...result,
		insertId: BigInt(lastInsertRowid)
	};
	return result;
}
/** Compile and execute a Kysely query synchronously. */
function executeSqliteQuerySync(db, query) {
	return executeCompiledSqliteQuerySync(db, query.compile());
}
/** Compile and lazily iterate a Kysely query synchronously against node:sqlite. */
function* iterateSqliteQuerySync(db, query) {
	const compiledQuery = query.compile();
	const statement = db.prepare(compiledQuery.sql);
	if (statement.columns().length === 0) return;
	const parameters = compiledQuery.parameters;
	yield* statement.iterate(...parameters);
}
/** Execute a Kysely query synchronously and return its first row. */
function executeSqliteQueryTakeFirstSync(db, query) {
	return executeSqliteQuerySync(db, query).rows[0];
}
/** Drop the cached Kysely facade for a DatabaseSync after close/test reset. */
function clearNodeSqliteKyselyCacheForDatabase(db) {
	kyselyByDatabase.delete(db);
}
//#endregion
//#region src/infra/warning-filter.ts
const warningFilterKey = Symbol.for("operator.warning-filter");
/** Returns whether a process warning matches a known noisy runtime/dependency warning. */
function shouldIgnoreWarning(warning) {
	if (warning.code === "DEP0040" && warning.message?.includes("punycode")) return true;
	if (warning.code === "DEP0060" && warning.message?.includes("util._extend")) return true;
	if (warning.name === "ExperimentalWarning" && warning.message?.includes("SQLite is an experimental feature")) return true;
	return false;
}
function normalizeWarningArgs(args) {
	const warningArg = args[0];
	const secondArg = args[1];
	const thirdArg = args[2];
	let name;
	let code;
	let message;
	if (warningArg instanceof Error) {
		name = warningArg.name;
		message = warningArg.message;
		code = warningArg.code;
	} else if (typeof warningArg === "string") message = warningArg;
	if (secondArg && typeof secondArg === "object" && !Array.isArray(secondArg)) {
		const options = secondArg;
		if (typeof options.type === "string") name = options.type;
		if (typeof options.code === "string") code = options.code;
	} else {
		if (typeof secondArg === "string") name = secondArg;
		if (typeof thirdArg === "string") code = thirdArg;
	}
	return {
		name,
		code,
		message
	};
}
/** Installs the global process warning filter once for the current JS realm. */
function installProcessWarningFilter() {
	const state = require_global_singleton.resolveGlobalSingleton(warningFilterKey, () => ({ installed: false }));
	if (state.installed) return;
	const originalEmitWarning = process.emitWarning.bind(process);
	const wrappedEmitWarning = ((...args) => {
		if (shouldIgnoreWarning(normalizeWarningArgs(args))) return;
		if (args[0] instanceof Error && args[1] && typeof args[1] === "object" && !Array.isArray(args[1])) {
			const warning = args[0];
			const emitted = Object.assign(new Error(warning.message), {
				name: warning.name,
				code: warning.code
			});
			process.emit("warning", emitted);
			return;
		}
		Reflect.apply(originalEmitWarning, process, args);
	});
	process.emitWarning = wrappedEmitWarning;
	state.installed = true;
}
//#endregion
//#region src/infra/node-sqlite.ts
const require$1 = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href);
let validatedSqliteModule;
function assertSqliteWalResetSafeVersion(version, nodeVersion) {
	if (require_sqlite_runtime_version.isSqliteWalResetSafeVersion(version)) return;
	const variables = process.config?.variables;
	const isShared = variables?.node_shared_sqlite === true || variables?.node_shared_sqlite === "true";
	throw new Error(`Operator requires SQLite 3.51.3+ (or patched 3.50.7+/3.44.6+) for WAL safety; Node ${nodeVersion} ${isShared ? "uses shared system" : "embeds"} SQLite ${version}, which is affected by the upstream WAL-reset database corruption bug. ${isShared ? "Upgrade the system SQLite library to 3.51.3+ (or patched 3.50.7+/3.44.6+), or use a Node build embedding a safe version." : "Upgrade to Node 22.22.3+, 24.15.0+, or 25.9.0+ before retrying."}`);
}
function assertSafeSqliteRuntime(sqlite) {
	if (validatedSqliteModule === sqlite) return;
	const database = new sqlite.DatabaseSync(":memory:");
	try {
		const row = database.prepare("SELECT sqlite_version() AS version").get();
		assertSqliteWalResetSafeVersion(typeof row?.version === "string" ? row.version : "unknown", process.versions.node);
		validatedSqliteModule = sqlite;
	} finally {
		database.close();
	}
}
/** Load node:sqlite after installing the process warning filter. */
function requireNodeSqlite() {
	installProcessWarningFilter();
	try {
		const sqlite = require$1("node:sqlite");
		assertSafeSqliteRuntime(sqlite);
		return sqlite;
	} catch (err) {
		const message = require_errors.formatErrorMessage(err);
		throw new Error(`SQLite support is unavailable or unsafe in this Node runtime. ${message}`, { cause: err });
	}
}
//#endregion
//#region src/infra/sqlite-user-version.ts
function readSqliteUserVersion(db) {
	const row = db.prepare("PRAGMA user_version").get();
	return Number(row?.user_version ?? 0);
}
function createNewerSqliteSchemaVersionError(databaseLabel, pathname, schemaVersion, supportedVersion) {
	return /* @__PURE__ */ new Error(`${databaseLabel} ${pathname} uses newer schema version ${schemaVersion}; this Operator build supports ${supportedVersion}. Upgrade Operator before opening this database. Do not downgrade Operator or modify the database. To run this older build, use a separate state directory or restore a compatible backup.`);
}
//#endregion
//#region src/infra/approval-resolution-ref.ts
const APPROVAL_RESOLUTION_REF_LENGTH = 43;
/** Build the full SHA-256 base64url locator used only when a transport cannot carry the exact id. */
function buildApprovalResolutionRef(params) {
	return (0, node_crypto.createHash)("sha256").update(params.approvalKind, "utf8").update("\0", "utf8").update(params.approvalId, "utf8").digest("base64url");
}
function isApprovalResolutionRef(value) {
	return value.length === APPROVAL_RESOLUTION_REF_LENGTH && /^[A-Za-z0-9_-]+$/u.test(value);
}
//#endregion
//#region src/infra/private-mode.ts
const CHMOD_UNSUPPORTED_CODES = /* @__PURE__ */ new Set([
	"ENOTSUP",
	"EOPNOTSUPP",
	"EINVAL"
]);
const PRIVATE_PROBE_FILE_MODE = 384;
function hasRestrictivePermissions(target) {
	try {
		return ((0, node_fs.statSync)(target).mode & 63) === 0;
	} catch {
		return false;
	}
}
function filesystemRejectsChmod(target) {
	let probePath;
	try {
		const probeDir = (0, node_fs.statSync)(target).isDirectory() ? target : node_path.default.dirname(target);
		probePath = node_path.default.join(probeDir, `.operator-chmod-probe-${(0, node_crypto.randomUUID)()}`);
		(0, node_fs.writeFileSync)(probePath, "", {
			flag: "wx",
			mode: PRIVATE_PROBE_FILE_MODE
		});
	} catch {
		return false;
	}
	try {
		(0, node_fs.chmodSync)(probePath, PRIVATE_PROBE_FILE_MODE);
		return false;
	} catch (err) {
		return err.code === "EPERM";
	} finally {
		try {
			(0, node_fs.unlinkSync)(probePath);
		} catch {}
	}
}
function canIgnorePrivateChmodError(target, code) {
	if (code && CHMOD_UNSUPPORTED_CODES.has(code)) return true;
	if (code === "EROFS") return hasRestrictivePermissions(target);
	if (code !== "EPERM") return false;
	return hasRestrictivePermissions(target) || filesystemRejectsChmod(target);
}
/**
* Applies a private POSIX mode, reporting unsupported filesystems without
* weakening real permission failures.
*/
function applyPrivateModeSync(target, mode) {
	try {
		(0, node_fs.chmodSync)(target, mode);
		return { applied: true };
	} catch (err) {
		if (!canIgnorePrivateChmodError(target, err.code)) throw err;
		return {
			applied: false,
			error: err
		};
	}
}
//#endregion
//#region src/infra/sqlite-files.ts
/** SQLite main database plus every journal-mode sidecar that can contain database pages. */
const SQLITE_DATABASE_FILE_SUFFIXES = [
	"",
	"-wal",
	"-shm",
	"-journal"
];
/** Resolves the main database and all possible journal-mode sidecar paths. */
function resolveSqliteDatabaseFilePaths(pathname) {
	return SQLITE_DATABASE_FILE_SUFFIXES.map((suffix) => `${pathname}${suffix}`);
}
//#endregion
//#region src/infra/sqlite-index-schema.ts
const SQLITE_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/u;
/**
* Restore named unique indexes when SQLite's IF NOT EXISTS semantics preserve
* a same-name definition that no longer enforces the canonical constraint.
*/
function repairCanonicalSqliteUniqueIndexes(db, databaseLabel, indexes) {
	const drifted = indexes.filter((index) => {
		assertSqliteIdentifier(index.name);
		const row = db.prepare("SELECT sql FROM main.sqlite_schema WHERE type = 'index' AND name = ?").get(index.name);
		return typeof row?.sql !== "string" || normalizeCreateIndexSql(row.sql) !== normalizeCreateIndexSql(createIndexSql(index, index.name, false));
	});
	if (drifted.length === 0) return;
	const savepoint = "repair_canonical_unique_indexes";
	let activeIndex;
	db.exec(`SAVEPOINT ${savepoint};`);
	try {
		for (const index of drifted) {
			activeIndex = index;
			const probeName = findUnusedProbeIndexName(db, index.name);
			db.exec(createIndexSql(index, probeName, true));
			db.exec(`DROP INDEX main.${index.name};`);
			db.exec(createIndexSql(index, index.name, true));
			db.exec(`DROP INDEX main.${probeName};`);
		}
		db.exec(`RELEASE SAVEPOINT ${savepoint};`);
	} catch (error) {
		try {
			db.exec(`ROLLBACK TO SAVEPOINT ${savepoint};`);
		} finally {
			db.exec(`RELEASE SAVEPOINT ${savepoint};`);
		}
		const detail = error instanceof Error ? error.message : String(error);
		throw new Error(`SQLite canonical unique index ${activeIndex?.name ?? "repair"} failed for ${databaseLabel}: ${detail}`, { cause: error });
	}
}
function createIndexSql(index, name, qualifyMain) {
	assertSqliteIdentifier(name);
	return `CREATE UNIQUE INDEX ${qualifyMain ? `main.${name}` : name} ${index.definition};`;
}
function findUnusedProbeIndexName(db, canonicalName) {
	const prefix = `operator_probe_${canonicalName}`;
	for (let suffix = 0; suffix < 100; suffix += 1) {
		const candidate = suffix === 0 ? prefix : `${prefix}_${suffix}`;
		if (!db.prepare("SELECT 1 AS found FROM main.sqlite_schema WHERE name = ?").get(candidate)) return candidate;
	}
	throw new Error(`could not allocate a probe index name for ${canonicalName}`);
}
function assertSqliteIdentifier(identifier) {
	if (!SQLITE_IDENTIFIER_PATTERN.test(identifier)) throw new Error(`invalid SQLite identifier: ${identifier}`);
}
function normalizeCreateIndexSql(sql) {
	return sql.trim().replace(/;\s*$/u, "").replace(/^CREATE\s+UNIQUE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?/iu, "CREATE UNIQUE INDEX ").replace(/\s+/gu, " ").trim();
}
//#endregion
//#region src/infra/sqlite-integrity.ts
const MAX_REPORTED_FOREIGN_KEY_VIOLATIONS = 5;
/** Require structural, table/index, and referential consistency before trusting a database. */
function assertSqliteIntegrity(database, databaseLabel) {
	const quickCheck = runSqliteCheck(database, databaseLabel, "quick_check");
	const integrityCheck = runSqliteCheck(database, databaseLabel, "integrity_check");
	runSqliteForeignKeyCheck(database, databaseLabel);
	return {
		integrityCheck,
		quickCheck
	};
}
/** Require table and associated index consistency before trusting indexed reads. */
function assertSqliteTableIntegrity(database, databaseLabel, tableName) {
	runSqliteCheck(database, `${databaseLabel} table ${tableName}`, "integrity_check", tableName);
}
function runSqliteCheck(database, databaseLabel, pragma, tableName) {
	const argument = tableName ? `('${tableName.replaceAll("'", "''")}')` : "";
	const results = database.prepare(`PRAGMA ${pragma}${argument};`).all().map((row) => row[pragma] ?? Object.values(row)[0]);
	if (results.length === 1 && results[0] === "ok") return "ok";
	const details = results.map((result) => String(result)).join("; ") || "no result";
	throw new Error(`SQLite ${pragma} failed for ${databaseLabel}: ${details}`);
}
function runSqliteForeignKeyCheck(database, databaseLabel) {
	let violationCount = 0;
	const violations = [];
	try {
		const statement = database.prepare("PRAGMA foreign_key_check;");
		statement.setReadBigInts(true);
		for (const violation of statement.iterate()) {
			violationCount += 1;
			retainSortedForeignKeyViolation(violations, violation);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`SQLite foreign_key_check failed for ${databaseLabel}: ${message}`, { cause: error });
	}
	if (violations.length === 0) return;
	const details = violations.map(formatSqliteForeignKeyViolation);
	if (violationCount > MAX_REPORTED_FOREIGN_KEY_VIOLATIONS) details.push("additional violations omitted");
	throw new Error(`SQLite foreign_key_check failed for ${databaseLabel}: ${details.join("; ")}`);
}
function retainSortedForeignKeyViolation(retained, violation) {
	retained.push(violation);
	retained.sort(compareSqliteForeignKeyViolations);
	if (retained.length > MAX_REPORTED_FOREIGN_KEY_VIOLATIONS) retained.pop();
}
function compareSqliteForeignKeyViolations(left, right) {
	const tableOrder = Buffer.compare(Buffer.from(left.table), Buffer.from(right.table));
	if (tableOrder !== 0) return tableOrder;
	if (left.rowid === null || right.rowid === null) {
		if (left.rowid !== right.rowid) return left.rowid === null ? -1 : 1;
	} else if (left.rowid !== right.rowid) return left.rowid < right.rowid ? -1 : 1;
	const parentOrder = Buffer.compare(Buffer.from(left.parent), Buffer.from(right.parent));
	if (parentOrder !== 0) return parentOrder;
	if (left.fkid === right.fkid) return 0;
	return left.fkid < right.fkid ? -1 : 1;
}
function formatSqliteForeignKeyViolation(violation) {
	const row = violation.rowid === null ? "row without rowid" : `row ${violation.rowid.toString()}`;
	return `${violation.table} ${row} references ${violation.parent} (foreign key ${violation.fkid.toString()})`;
}
//#endregion
//#region src/infra/sqlite-schema-contract.ts
const schemaContractCache = /* @__PURE__ */ new Map();
const TABLE_CONSTRAINT_KEYWORDS = /* @__PURE__ */ new Set([
	"CHECK",
	"FOREIGN",
	"PRIMARY",
	"UNIQUE"
]);
/**
* Require every object from one committed schema while allowing unrelated
* tables and indexes that do not replace a canonical object.
*/
function assertSqliteSchemaContains(database, databaseLabel, schemaSql, compatibility = {}) {
	let expected = schemaContractCache.get(schemaSql);
	if (!expected) {
		expected = buildSqliteSchemaContract(schemaSql);
		schemaContractCache.set(schemaSql, expected);
	}
	const mismatches = [];
	for (const [tableName, expectedTable] of expected) {
		const actualTable = collectSqliteTableContract(database, tableName);
		if (!actualTable) {
			mismatches.push(`missing table ${tableName}`);
			continue;
		}
		const definitionMismatch = compareTableDefinitions(tableName, actualTable.definition, expectedTable.definition, compatibility);
		if (definitionMismatch) mismatches.push(`${definitionMismatch} differ for ${tableName}`);
		for (const expectedIndex of expectedTable.indexes) if (!actualTable.indexes.some((actualIndex) => isEqual(actualIndex, expectedIndex))) mismatches.push(`missing or drifted index ${expectedIndex.name ?? `on ${tableName}`}`);
		for (const actualIndex of actualTable.indexes) if (actualIndex.unique === 1 && !expectedTable.indexes.some((expectedIndex) => isEqual(actualIndex, expectedIndex))) mismatches.push(`unexpected unique index ${actualIndex.name ?? `on ${tableName}`}`);
		for (const expectedTrigger of expectedTable.triggers) if (!actualTable.triggers.some((actualTrigger) => isEqual(actualTrigger, expectedTrigger))) mismatches.push(`missing or drifted trigger ${expectedTrigger.name}`);
		const optionalCanonicalTriggerGroups = collectOptionalCanonicalTriggerGroups(compatibility, tableName);
		for (const triggerGroup of optionalCanonicalTriggerGroups) {
			if (!actualTable.triggers.some((actualTrigger) => triggerGroup.some((canonicalTrigger) => actualTrigger.name === canonicalTrigger.name))) continue;
			for (const canonicalTrigger of triggerGroup) if (!actualTable.triggers.some((actualTrigger) => isEqual(actualTrigger, canonicalTrigger))) mismatches.push(`missing or drifted trigger ${canonicalTrigger.name}`);
		}
		const optionalCanonicalTriggers = optionalCanonicalTriggerGroups.flat();
		for (const actualTrigger of actualTable.triggers) if (!expectedTable.triggers.some((expectedTrigger) => isEqual(actualTrigger, expectedTrigger)) && !optionalCanonicalTriggers.some((canonicalTrigger) => isEqual(actualTrigger, canonicalTrigger))) mismatches.push(`unexpected trigger ${actualTrigger.name}`);
		if (actualTable.virtualTableSql !== expectedTable.virtualTableSql) mismatches.push(`virtual table definition differs for ${tableName}`);
		if (actualTable.strict !== expectedTable.strict || actualTable.withoutRowid !== expectedTable.withoutRowid) mismatches.push(`table options differ for ${tableName}`);
	}
	if (mismatches.length > 0) {
		const shown = mismatches.slice(0, 8);
		if (mismatches.length > shown.length) shown.push(`${mismatches.length - shown.length} additional mismatch(es)`);
		throw new Error(`SQLite schema is incomplete or noncanonical for ${databaseLabel}: ${shown.join("; ")}`);
	}
}
function collectOptionalCanonicalTriggerGroups(compatibility, tableName) {
	return (compatibility.optionalCanonicalTriggerGroups ?? []).filter((group) => group.tableName === tableName).map((group) => group.triggers.map((trigger) => ({
		name: trigger.name,
		sql: normalizeOptionalCanonicalTriggerSql(trigger.sql)
	})));
}
function normalizeOptionalCanonicalTriggerSql(sql) {
	return normalizeSchemaSql(sql)?.replace(/^(CREATE TRIGGER) main\./iu, "$1 ") ?? null;
}
function buildSqliteSchemaContract(schemaSql) {
	const database = new (requireNodeSqlite()).DatabaseSync(":memory:");
	try {
		database.exec(schemaSql);
		const rows = database.prepare(`
          SELECT name
          FROM sqlite_schema
          WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `).all();
		return new Map(rows.map((row) => {
			const contract = collectSqliteTableContract(database, row.name);
			if (!contract) throw new Error(`Could not collect generated SQLite schema table ${row.name}.`);
			return [row.name, contract];
		}));
	} finally {
		database.close();
	}
}
function collectSqliteTableContract(database, tableName) {
	const table = database.prepare("SELECT name, sql FROM sqlite_schema WHERE type = 'table' AND name = ?").get(tableName);
	if (!table) return;
	const quotedTable = quoteSqliteIdentifier$1(tableName);
	const tableList = database.prepare("PRAGMA table_list").all().find((entry) => entry.name === tableName);
	if (!tableList) throw new Error(`Could not inspect SQLite table options for ${tableName}.`);
	const indexes = database.prepare(`PRAGMA index_list(${quotedTable})`).all().map((index) => collectSqliteIndexContract(database, index)).toSorted(compareJson);
	const triggers = database.prepare(`
          SELECT name, sql
          FROM sqlite_schema
          WHERE type = 'trigger' AND tbl_name = ?
          ORDER BY name
        `).all(tableName).map((trigger) => ({
		name: trigger.name,
		sql: normalizeSchemaSql(trigger.sql)
	}));
	const normalizedTableSql = normalizeSchemaSql(table.sql);
	const isVirtualTable = normalizedTableSql !== null && /^CREATE VIRTUAL TABLE /iu.test(normalizedTableSql);
	return {
		definition: isVirtualTable ? null : parseTableDefinition(table.sql, tableName),
		indexes,
		strict: tableList.strict,
		triggers,
		virtualTableSql: isVirtualTable ? normalizedTableSql : null,
		withoutRowid: tableList.wr
	};
}
function compareTableDefinitions(tableName, actual, expected, compatibility) {
	if (!actual || !expected) return actual === expected ? null : "table definition";
	if (actual.columns.size !== expected.columns.size) return "column definitions";
	for (const [columnName, expectedDefinition] of expected.columns) {
		const actualDefinition = actual.columns.get(columnName);
		if (actualDefinition === expectedDefinition) continue;
		if (!(compatibility.allowedColumnDefinitions?.[`${tableName}.${columnName}`] ?? []).some((definition) => normalizeSqlWhitespace(definition) === actualDefinition)) return "column definitions";
	}
	return isEqual(actual.constraints, expected.constraints) ? null : "table constraints";
}
function parseTableDefinition(sql, tableName) {
	if (sql === null) throw new Error(`Could not inspect SQLite table definition for ${tableName}.`);
	const open = findSqlCharacter(sql, "(");
	if (open === -1) throw new Error(`SQLite table ${tableName} has no column definition.`);
	const close = findSqlClosingParenthesis(sql, open);
	const columns = /* @__PURE__ */ new Map();
	const constraints = [];
	for (const rawDefinition of splitSqlList(sql.slice(open + 1, close))) {
		const definition = normalizeSqlWhitespace(rawDefinition);
		if (!definition) continue;
		const token = readSqlToken(definition, 0);
		if (!token) throw new Error(`SQLite table ${tableName} contains an unreadable definition.`);
		if (readTableConstraintKeyword(definition, token)) {
			constraints.push(definition);
			continue;
		}
		const columnName = normalizeSqlIdentifier(token.raw);
		if (columns.has(columnName)) throw new Error(`SQLite table ${tableName} contains duplicate column ${columnName}.`);
		columns.set(columnName, definition);
	}
	return {
		columns: new Map([...columns].toSorted(([left], [right]) => left.localeCompare(right))),
		constraints: constraints.toSorted()
	};
}
function readTableConstraintKeyword(sql, first) {
	let token = first;
	if (token.keyword === "CONSTRAINT") {
		const name = readSqlToken(sql, token.end);
		token = name ? readSqlToken(sql, name.end) : null;
	}
	return token?.keyword && TABLE_CONSTRAINT_KEYWORDS.has(token.keyword) ? token.keyword : null;
}
function readSqlToken(sql, start) {
	let index = start;
	while (index < sql.length && /\s/u.test(sql[index] ?? "")) index += 1;
	const char = sql[index];
	if (!char) return null;
	if (char === "\"" || char === "`") {
		const end = skipSqlQuoted(sql, index, char);
		return {
			end,
			keyword: null,
			raw: sql.slice(index, end)
		};
	}
	if (char === "[") {
		const end = skipSqlQuoted(sql, index, char);
		return {
			end,
			keyword: null,
			raw: sql.slice(index, end)
		};
	}
	let end = index;
	while (end < sql.length && !/[\s(,]/u.test(sql[end] ?? "")) end += 1;
	const raw = sql.slice(index, end);
	return {
		end,
		keyword: raw.toUpperCase(),
		raw
	};
}
function normalizeSqlIdentifier(identifier) {
	if (identifier.startsWith("\"") && identifier.endsWith("\"")) return identifier.slice(1, -1).replaceAll("\"\"", "\"").toLowerCase();
	if (identifier.startsWith("`") && identifier.endsWith("`")) return identifier.slice(1, -1).replaceAll("``", "`").toLowerCase();
	if (identifier.startsWith("[") && identifier.endsWith("]")) return identifier.slice(1, -1).toLowerCase();
	return identifier.toLowerCase();
}
function collectSqliteIndexContract(database, index) {
	const row = database.prepare("SELECT sql FROM sqlite_schema WHERE type = 'index' AND name = ?").get(index.name);
	const terms = database.prepare(`PRAGMA index_xinfo(${quoteSqliteIdentifier$1(index.name)})`).all().map(({ cid, coll, desc, key, name, seqno }) => ({
		coll,
		desc,
		key,
		kind: sqliteIndexTermKind(cid),
		name,
		seqno
	}));
	return {
		name: index.name.startsWith("sqlite_autoindex_") ? null : index.name,
		origin: index.origin,
		partial: index.partial,
		sql: normalizeSchemaSql(typeof row?.sql === "string" ? row.sql : null),
		terms,
		unique: index.unique
	};
}
function sqliteIndexTermKind(cid) {
	return cid === -2 ? "expression" : cid === -1 ? "rowid" : "column";
}
function normalizeSchemaSql(sql) {
	if (sql === null) return null;
	return normalizeSqlWhitespace(sql).replace(/;\s*$/u, "").trim().replace(/^(CREATE TABLE) IF NOT EXISTS /iu, "$1 ").replace(/^(CREATE VIRTUAL TABLE) IF NOT EXISTS /iu, "$1 ").replace(/^(CREATE UNIQUE INDEX) IF NOT EXISTS /iu, "$1 ").replace(/^(CREATE INDEX) IF NOT EXISTS /iu, "$1 ").replace(/^(CREATE TRIGGER) IF NOT EXISTS /iu, "$1 ");
}
function splitSqlList(sql) {
	const items = [];
	let depth = 0;
	let start = 0;
	let index = 0;
	while (index < sql.length) {
		const next = skipSqlQuotedOrComment(sql, index);
		if (next !== index) {
			index = next;
			continue;
		}
		const char = sql[index];
		if (char === "(") depth += 1;
		else if (char === ")") depth -= 1;
		else if (char === "," && depth === 0) {
			items.push(sql.slice(start, index));
			start = index + 1;
		}
		index += 1;
	}
	items.push(sql.slice(start));
	return items;
}
function findSqlCharacter(sql, character) {
	let index = 0;
	while (index < sql.length) {
		const next = skipSqlQuotedOrComment(sql, index);
		if (next !== index) {
			index = next;
			continue;
		}
		if (sql[index] === character) return index;
		index += 1;
	}
	return -1;
}
function findSqlClosingParenthesis(sql, open) {
	let depth = 0;
	let index = open;
	while (index < sql.length) {
		const next = skipSqlQuotedOrComment(sql, index);
		if (next !== index) {
			index = next;
			continue;
		}
		const char = sql[index];
		if (char === "(") depth += 1;
		else if (char === ")") {
			depth -= 1;
			if (depth === 0) return index;
		}
		index += 1;
	}
	throw new Error("SQLite schema contains an unterminated table definition.");
}
function normalizeSqlWhitespace(sql) {
	let normalized = "";
	let pendingSpace = false;
	let index = 0;
	while (index < sql.length) {
		const quoted = skipSqlQuoted(sql, index, sql[index] ?? "");
		if (quoted !== index) {
			if (pendingSpace && normalized.length > 0) normalized += " ";
			normalized += sql.slice(index, quoted);
			pendingSpace = false;
			index = quoted;
			continue;
		}
		const comment = skipSqlComment(sql, index);
		if (comment !== index) {
			pendingSpace = true;
			index = comment;
			continue;
		}
		const char = sql[index] ?? "";
		if (/\s/u.test(char)) pendingSpace = true;
		else {
			if (pendingSpace && normalized.length > 0) normalized += " ";
			normalized += char;
			pendingSpace = false;
		}
		index += 1;
	}
	return normalized.trim();
}
function skipSqlQuotedOrComment(sql, index) {
	const quoted = skipSqlQuoted(sql, index, sql[index] ?? "");
	return quoted !== index ? quoted : skipSqlComment(sql, index);
}
function skipSqlQuoted(sql, index, quote) {
	if (quote !== "'" && quote !== "\"" && quote !== "`" && quote !== "[") return index;
	const closingQuote = quote === "[" ? "]" : quote;
	let cursor = index + 1;
	while (cursor < sql.length) {
		if (sql[cursor] !== closingQuote) {
			cursor += 1;
			continue;
		}
		if (quote !== "[" && sql[cursor + 1] === closingQuote) {
			cursor += 2;
			continue;
		}
		return cursor + 1;
	}
	return sql.length;
}
function skipSqlComment(sql, index) {
	if (sql.startsWith("--", index)) {
		const newline = sql.indexOf("\n", index + 2);
		return newline === -1 ? sql.length : newline + 1;
	}
	if (sql.startsWith("/*", index)) {
		const close = sql.indexOf("*/", index + 2);
		return close === -1 ? sql.length : close + 2;
	}
	return index;
}
function quoteSqliteIdentifier$1(identifier) {
	return `"${identifier.replaceAll("\"", "\"\"")}"`;
}
function isEqual(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}
function compareJson(left, right) {
	return JSON.stringify(left).localeCompare(JSON.stringify(right));
}
//#endregion
//#region src/infra/sqlite-transaction.ts
const transactionDepthByDatabase = /* @__PURE__ */ new WeakMap();
const SQLITE_LOCK_ERROR_CODES = /* @__PURE__ */ new Set(["SQLITE_BUSY", "SQLITE_LOCKED"]);
const SQLITE_BUSY_RESULT_CODE = 5;
const SQLITE_LOCKED_RESULT_CODE = 6;
const SQLITE_PRIMARY_RESULT_CODE_MASK = 255;
const DEFAULT_SLOW_BUSY_WAIT_MS = 1e3;
const DEFAULT_SLOW_TRANSACTION_HOLD_MS = 1e3;
let nextSavepointId = 0;
const transactionLog = require_subsystem.createSubsystemLogger("sqlite/transaction");
function nextSavepointName() {
	nextSavepointId += 1;
	return `operator_tx_${nextSavepointId}`;
}
function isPromiseLike(value) {
	return Boolean(value && typeof value.then === "function");
}
function assertSyncTransactionResult(value) {
	if (isPromiseLike(value)) throw new Error("SQLite write transactions must be synchronous; Promise returns are not supported.");
}
function sqliteErrorCode(error) {
	const code = error && typeof error === "object" ? error.code : void 0;
	return typeof code === "string" ? code : void 0;
}
function sqliteExtendedResultCode(error) {
	const errcode = error && typeof error === "object" ? error.errcode : void 0;
	return typeof errcode === "number" && Number.isInteger(errcode) ? errcode : void 0;
}
function sqlitePrimaryResultCode(error) {
	const errcode = sqliteExtendedResultCode(error);
	return errcode === void 0 ? void 0 : errcode & SQLITE_PRIMARY_RESULT_CODE_MASK;
}
function isSqliteLockError(error) {
	const code = sqliteErrorCode(error);
	if (code !== void 0 && SQLITE_LOCK_ERROR_CODES.has(code)) return true;
	const primaryCode = sqlitePrimaryResultCode(error);
	return primaryCode === SQLITE_BUSY_RESULT_CODE || primaryCode === SQLITE_LOCKED_RESULT_CODE;
}
function slowBusyWaitThresholdMs(options) {
	if (options?.busyTimeoutMs === void 0) return DEFAULT_SLOW_BUSY_WAIT_MS;
	return Math.min(DEFAULT_SLOW_BUSY_WAIT_MS, Math.max(1, options.busyTimeoutMs));
}
function slowTransactionHoldThresholdMs(options) {
	return options?.slowTransactionHoldMs ?? DEFAULT_SLOW_TRANSACTION_HOLD_MS;
}
function transactionLogger(options) {
	return options?.logger ?? transactionLog;
}
function logSlowTransactionHold(params) {
	if (params.elapsedMs < slowTransactionHoldThresholdMs(params.options)) return;
	transactionLogger(params.options).warn("slow SQLite transaction hold", {
		async: false,
		...params.options?.databaseLabel ? { database: params.options.databaseLabel } : {},
		elapsedMs: params.elapsedMs,
		...params.options?.operationLabel ? { operation: params.options.operationLabel } : {},
		pid: process.pid,
		thresholdMs: slowTransactionHoldThresholdMs(params.options)
	});
}
function logSlowTransactionStep(params) {
	if (params.elapsedMs < slowBusyWaitThresholdMs(params.options)) return;
	transactionLogger(params.options).warn("slow SQLite transaction lock wait", {
		async: false,
		...params.options?.busyTimeoutMs !== void 0 ? { busyTimeoutMs: params.options.busyTimeoutMs } : {},
		...params.options?.databaseLabel ? { database: params.options.databaseLabel } : {},
		elapsedMs: params.elapsedMs,
		...params.options?.operationLabel ? { operation: params.options.operationLabel } : {},
		pid: process.pid,
		step: params.step
	});
}
function execTimedTransactionStep(params) {
	const startedAt = Date.now();
	try {
		params.db.exec(params.sql);
		const elapsedMs = Date.now() - startedAt;
		logSlowTransactionStep({
			elapsedMs,
			options: params.options,
			step: params.step
		});
		return elapsedMs;
	} catch (error) {
		const elapsedMs = Date.now() - startedAt;
		if (isSqliteLockError(error)) {
			const sqliteErrcode = sqliteExtendedResultCode(error);
			const sqlitePrimaryCode = sqlitePrimaryResultCode(error);
			transactionLogger(params.options).warn("SQLite transaction lock wait failed", {
				async: false,
				...params.options?.busyTimeoutMs !== void 0 ? { busyTimeoutMs: params.options.busyTimeoutMs } : {},
				...params.options?.databaseLabel ? { database: params.options.databaseLabel } : {},
				code: sqliteErrorCode(error),
				elapsedMs,
				failureKind: "lock-contention",
				...params.options?.operationLabel ? { operation: params.options.operationLabel } : {},
				pid: process.pid,
				...sqliteErrcode !== void 0 ? { sqliteErrcode } : {},
				...sqlitePrimaryCode !== void 0 ? { sqlitePrimaryCode } : {},
				step: params.step
			});
		}
		throw error;
	}
}
function beginTransaction(db, options, mode) {
	execTimedTransactionStep({
		db,
		options,
		sql: mode === "immediate" ? "BEGIN IMMEDIATE" : "BEGIN",
		step: "begin"
	});
}
function commitImmediateTransaction(db, options) {
	execTimedTransactionStep({
		db,
		options,
		sql: "COMMIT",
		step: "commit"
	});
}
function abortImmediateTransaction(db) {
	try {
		db.exec("ROLLBACK");
	} catch {
		try {
			db.close();
		} catch {}
	}
}
function getTransactionDepth(db) {
	return transactionDepthByDatabase.get(db) ?? 0;
}
function setTransactionDepth(db, depth) {
	if (depth <= 0) {
		transactionDepthByDatabase.delete(db);
		return;
	}
	transactionDepthByDatabase.set(db, depth);
}
function runSqliteTransactionSync(db, operation, mode, options) {
	const depth = getTransactionDepth(db);
	if (depth > 0) {
		const savepointName = nextSavepointName();
		db.exec(`SAVEPOINT ${savepointName}`);
		setTransactionDepth(db, depth + 1);
		try {
			const result = operation();
			assertSyncTransactionResult(result);
			db.exec(`RELEASE SAVEPOINT ${savepointName}`);
			return result;
		} catch (error) {
			try {
				db.exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
			} finally {
				db.exec(`RELEASE SAVEPOINT ${savepointName}`);
			}
			throw error;
		} finally {
			setTransactionDepth(db, depth);
		}
	}
	beginTransaction(db, options, mode);
	setTransactionDepth(db, 1);
	let transactionStillActive = true;
	let result;
	const transactionStartedAt = Date.now();
	try {
		result = operation();
		assertSyncTransactionResult(result);
	} catch (error) {
		try {
			abortImmediateTransaction(db);
			transactionStillActive = false;
		} catch {}
		throw error;
	} finally {
		if (!transactionStillActive) setTransactionDepth(db, 0);
	}
	try {
		logSlowTransactionHold({
			elapsedMs: Date.now() - transactionStartedAt,
			options
		});
		commitImmediateTransaction(db, options);
		transactionStillActive = false;
		return result;
	} catch (error) {
		try {
			abortImmediateTransaction(db);
			transactionStillActive = false;
		} catch {}
		throw error;
	} finally {
		if (!transactionStillActive) setTransactionDepth(db, 0);
	}
}
/** Run synchronous reads against one deferred SQLite snapshot. */
function runSqliteDeferredTransactionSync(db, operation, options) {
	return runSqliteTransactionSync(db, operation, "deferred", options);
}
function runSqliteImmediateTransactionSync(db, operation, options) {
	return runSqliteTransactionSync(db, operation, "immediate", options);
}
//#endregion
//#region src/infra/sqlite-strict.ts
const DEFAULT_STRICT_MIGRATION_BUSY_TIMEOUT_MS = 5e3;
const STRICT_MIGRATION_TABLE_PREFIX = "__operator_strict_migration_";
const SQLITE_ROWID_ALIASES = [
	"_rowid_",
	"rowid",
	"oid"
];
function quoteSqliteIdentifier(identifier) {
	return `"${identifier.replaceAll("\"", "\"\"")}"`;
}
function readMainTableList(db) {
	return db.prepare("PRAGMA table_list").all().filter((row) => row.schema === "main" && typeof row.name === "string" && !row.name.startsWith("sqlite_"));
}
function readTableColumns(db, tableName) {
	return db.prepare(`PRAGMA table_xinfo(${quoteSqliteIdentifier(tableName)})`).all();
}
function readVisibleColumns(db, tableName) {
	return readTableColumns(db, tableName).filter((row) => Number(row.hidden ?? 0) === 0).map((row) => {
		if (typeof row.name !== "string" || row.name.length === 0) throw new Error(`SQLite table ${tableName} has an invalid column name`);
		return row.name;
	});
}
function readTableRowidModel(db, tableName, tableRow) {
	if (Number(tableRow.wr ?? 0) === 1) return {
		alias: null,
		storage: "without-rowid"
	};
	const columns = readTableColumns(db, tableName);
	const primaryKeyColumns = columns.filter((column) => Number(column.pk ?? 0) > 0);
	const primaryKeyIndex = db.prepare(`SELECT 1 AS found FROM pragma_index_list(?) WHERE origin = 'pk' LIMIT 1`).get(tableName);
	const primaryKeyType = primaryKeyColumns[0]?.type;
	if (primaryKeyColumns.length === 1 && typeof primaryKeyType === "string" && primaryKeyType.toUpperCase() === "INTEGER" && !primaryKeyIndex) return {
		alias: null,
		storage: "integer-primary-key"
	};
	const declaredNames = new Set(columns.flatMap((column) => typeof column.name === "string" ? [column.name.toLowerCase()] : []));
	const alias = SQLITE_ROWID_ALIASES.find((candidate) => !declaredNames.has(candidate)) ?? null;
	if (!alias) throw new Error(`SQLite table ${tableName} shadows every rowid alias; its implicit rowids cannot be migrated safely`);
	return {
		alias,
		storage: "implicit"
	};
}
function readCanonicalStrictTables(schemaSql) {
	const canonical = new (requireNodeSqlite()).DatabaseSync(":memory:");
	try {
		canonical.exec(schemaSql);
		const tables = readMainTableList(canonical).filter((row) => row.type === "table");
		const nonStrict = tables.flatMap((row) => Number(row.strict ?? 0) === 1 || typeof row.name !== "string" ? [] : [row.name]);
		if (nonStrict.length > 0) throw new Error(`Canonical SQLite schema contains non-STRICT tables: ${nonStrict.toSorted().join(", ")}`);
		return tables.map((row) => {
			if (typeof row.name !== "string") throw new Error("Canonical SQLite schema contains an unnamed table");
			const schemaRow = canonical.prepare("SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = ?").get(row.name);
			if (typeof schemaRow?.sql !== "string") throw new Error(`Canonical SQLite table ${row.name} has no CREATE statement`);
			const rowidModel = readTableRowidModel(canonical, row.name, row);
			return {
				columns: readVisibleColumns(canonical, row.name),
				createSql: schemaRow.sql,
				name: row.name,
				rowidAlias: rowidModel.alias,
				rowidStorage: rowidModel.storage,
				usesAutoincrement: /\bAUTOINCREMENT\b/iu.test(schemaRow.sql)
			};
		}).toSorted((left, right) => left.name.localeCompare(right.name));
	} finally {
		canonical.close();
	}
}
function rewriteCreateTableName(createSql, replacementName) {
	const openingParen = createSql.indexOf("(");
	if (openingParen === -1) throw new Error("Canonical SQLite table CREATE statement has no column list");
	return `CREATE TABLE ${quoteSqliteIdentifier(replacementName)} ${createSql.slice(openingParen)}`;
}
function readPreservedSchemaObjects(db, tableNames) {
	return db.prepare("SELECT type, name, tbl_name, sql FROM sqlite_schema WHERE type IN ('index', 'trigger', 'view')").all().flatMap((row) => {
		if (row.type !== "index" && row.type !== "trigger" && row.type !== "view" || typeof row.name !== "string" || typeof row.tbl_name !== "string" || typeof row.sql !== "string" || row.type === "index" && !tableNames.has(row.tbl_name)) return [];
		return [{
			name: row.name,
			sql: row.sql,
			type: row.type
		}];
	}).toSorted((left, right) => {
		const typeOrder = {
			view: 0,
			index: 1,
			trigger: 2
		};
		return typeOrder[left.type] - typeOrder[right.type] || left.name.localeCompare(right.name);
	});
}
function readAutoincrementHighWater(db, tableName) {
	if (!db.prepare("SELECT 1 AS found FROM sqlite_schema WHERE type = 'table' AND name = 'sqlite_sequence'").get()) return null;
	const row = db.prepare("SELECT CAST(seq AS TEXT) AS seq FROM sqlite_sequence WHERE name = ?").get(tableName);
	if (row === void 0) return null;
	const normalized = typeof row.seq === "string" ? /^(\d+)(?:\.0+)?$/u.exec(row.seq)?.[1] : null;
	if (!normalized) throw new Error(`SQLite table ${tableName} has an invalid AUTOINCREMENT high-water mark (${typeof row.seq}: ${String(row.seq)})`);
	return normalized;
}
function restoreAutoincrementHighWater(db, tableName, previousHighWater) {
	if (previousHighWater === null) return;
	const currentHighWater = readAutoincrementHighWater(db, tableName);
	const restored = currentHighWater === null || BigInt(previousHighWater) > BigInt(currentHighWater) ? previousHighWater : currentHighWater;
	db.prepare("DELETE FROM sqlite_sequence WHERE name = ?").run(tableName);
	db.prepare("INSERT INTO sqlite_sequence (name, seq) VALUES (?, CAST(? AS INTEGER))").run(tableName, restored);
}
function assertMatchingColumns(tableName, currentColumns, canonicalColumns) {
	const current = new Set(currentColumns);
	const canonical = new Set(canonicalColumns);
	const missing = canonicalColumns.filter((column) => !current.has(column));
	const extra = currentColumns.filter((column) => !canonical.has(column));
	if (missing.length === 0 && extra.length === 0) return;
	const details = [missing.length > 0 ? `missing ${missing.join(", ")}` : "", extra.length > 0 ? `extra ${extra.join(", ")}` : ""].filter(Boolean).join("; ");
	throw new Error(`SQLite table ${tableName} does not match its canonical columns (${details})`);
}
function readForeignKeysEnabled(db) {
	const row = db.prepare("PRAGMA foreign_keys").get();
	return Number(row?.foreign_keys ?? 0) === 1;
}
/**
* Rebuild canonical non-STRICT tables inside the caller's transaction.
* Foreign-key enforcement must be disabled before BEGIN; integrity is checked
* before this function returns so any bad row or relationship rolls back.
*/
function migrateSqliteSchemaToStrictInTransaction(db, schemaSql, options = {}) {
	if (!db.isTransaction) throw new Error("SQLite STRICT schema migration requires an active transaction");
	const canonicalTables = readCanonicalStrictTables(schemaSql);
	db.exec(schemaSql);
	const currentTableRows = new Map(readMainTableList(db).filter((row) => row.type === "table" && typeof row.name === "string").map((row) => [row.name, row]));
	const tablesToMigrate = canonicalTables.filter((table) => Number(currentTableRows.get(table.name)?.strict ?? 0) !== 1);
	if (tablesToMigrate.length === 0) return { migratedTables: [] };
	if (readForeignKeysEnabled(db)) throw new Error("SQLite STRICT schema migration requires foreign_keys=OFF before BEGIN");
	const preservedObjects = readPreservedSchemaObjects(db, new Set(tablesToMigrate.map((table) => table.name)));
	for (const object of preservedObjects) if (object.type === "trigger") db.exec(`DROP TRIGGER ${quoteSqliteIdentifier(object.name)};`);
	for (const object of preservedObjects) if (object.type === "view") db.exec(`DROP VIEW ${quoteSqliteIdentifier(object.name)};`);
	for (const [index, table] of tablesToMigrate.entries()) {
		const migrationTable = `${STRICT_MIGRATION_TABLE_PREFIX}${index}_${table.name}`;
		if (currentTableRows.has(migrationTable)) throw new Error(`SQLite STRICT migration table already exists: ${migrationTable}`);
		const currentColumns = readVisibleColumns(db, table.name);
		assertMatchingColumns(table.name, currentColumns, table.columns);
		const currentTableRow = currentTableRows.get(table.name);
		if (!currentTableRow) throw new Error(`SQLite table ${table.name} disappeared during STRICT migration`);
		const currentRowidModel = readTableRowidModel(db, table.name, currentTableRow);
		if (currentRowidModel.storage !== table.rowidStorage) throw new Error(`SQLite table ${table.name} changes rowid storage from ${currentRowidModel.storage} to ${table.rowidStorage}; refusing an identity-changing STRICT migration`);
		const previousHighWater = table.usesAutoincrement ? readAutoincrementHighWater(db, table.name) : null;
		db.exec(rewriteCreateTableName(table.createSql, migrationTable));
		const columns = table.columns.map(quoteSqliteIdentifier);
		if (table.rowidAlias) columns.unshift(quoteSqliteIdentifier(table.rowidAlias));
		const copyColumns = columns.join(", ");
		try {
			db.exec(`INSERT INTO ${quoteSqliteIdentifier(migrationTable)} (${copyColumns}) SELECT ${copyColumns} FROM ${quoteSqliteIdentifier(table.name)};`);
		} catch (error) {
			throw new Error(`Failed migrating SQLite table ${table.name} to STRICT`, { cause: error });
		}
		db.exec(`DROP TABLE ${quoteSqliteIdentifier(table.name)};`);
		db.exec(`ALTER TABLE ${quoteSqliteIdentifier(migrationTable)} RENAME TO ${quoteSqliteIdentifier(table.name)};`);
		restoreAutoincrementHighWater(db, table.name, previousHighWater);
	}
	db.exec(schemaSql);
	const findObject = db.prepare("SELECT 1 AS found FROM sqlite_schema WHERE type = ? AND name = ? LIMIT 1");
	for (const object of preservedObjects) if (!findObject.get(object.type, object.name)) db.exec(object.sql);
	assertSqliteIntegrity(db, options.databaseLabel ?? "SQLite STRICT schema migration");
	return { migratedTables: tablesToMigrate.map((table) => table.name) };
}
/** Atomically upgrade Operator-owned tables described by a canonical STRICT schema. */
function migrateSqliteSchemaToStrict(db, schemaSql, options = {}) {
	if (db.isTransaction) throw new Error("SQLite STRICT schema migration cannot start inside a transaction");
	const foreignKeysWereEnabled = readForeignKeysEnabled(db);
	if (foreignKeysWereEnabled) db.exec("PRAGMA foreign_keys = OFF;");
	try {
		return runSqliteImmediateTransactionSync(db, () => migrateSqliteSchemaToStrictInTransaction(db, schemaSql, options), {
			busyTimeoutMs: options.busyTimeoutMs ?? DEFAULT_STRICT_MIGRATION_BUSY_TIMEOUT_MS,
			databaseLabel: options.databaseLabel,
			operationLabel: "sqlite.strict-schema-migration"
		});
	} finally {
		if (foreignKeysWereEnabled) db.exec("PRAGMA foreign_keys = ON;");
	}
}
//#endregion
//#region src/infra/sqlite-wal.ts
const DEFAULT_SQLITE_WAL_AUTOCHECKPOINT_PAGES = 1e3;
const DEFAULT_SQLITE_WAL_CHECKPOINT_INTERVAL_MS = 1800 * 1e3;
const INCREMENTAL_VACUUM_MAX_PAGES_PER_PASS = 512;
const LINUX_NFS_SUPER_MAGIC = 26985;
const LINUX_SMB_SUPER_MAGIC = 20859;
const LINUX_CIFS_SUPER_MAGIC = 4283649346;
const LINUX_SMB2_SUPER_MAGIC = 4266872130;
const PROC_MOUNTINFO_PATH = "/proc/self/mountinfo";
const NETWORK_FILESYSTEM_TYPES = /* @__PURE__ */ new Set([
	"cifs",
	"smbfs",
	"smb2",
	"smb3"
]);
const JOURNAL_MODE_RETRY_INTERVAL_MS = 10;
const JOURNAL_MODE_RETRY_SLEEP = new Int32Array(new SharedArrayBuffer(4));
function configureSqliteBusyTimeout(db, busyTimeoutMs) {
	const normalizedTimeoutMs = normalizeNonNegativeInteger(busyTimeoutMs, "busyTimeoutMs");
	db.exec(`PRAGMA busy_timeout = ${normalizedTimeoutMs};`);
	return normalizedTimeoutMs;
}
function enableIncrementalAutoVacuumForFreshDatabase(db) {
	if (db.prepare("PRAGMA page_count").get()?.page_count === 0) db.exec("PRAGMA auto_vacuum = INCREMENTAL;");
}
/**
* Configure lock retry before inspecting or mutating a fresh database header.
* Concurrent first opens can otherwise fail before schema transactions begin.
*/
function configureSqlitePreSchemaPragmas(db, options = {}) {
	if (options.busyTimeoutMs !== void 0) configureSqliteBusyTimeout(db, options.busyTimeoutMs);
	enableIncrementalAutoVacuumForFreshDatabase(db);
}
function normalizeNonNegativeInteger(value, label) {
	if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer`);
	return value;
}
function findExistingVolumePaths(targetPath) {
	let current = node_path.default.resolve(targetPath);
	while (true) {
		let stats;
		try {
			stats = node_fs.default.statSync(current);
		} catch {
			const parent = node_path.default.dirname(current);
			if (parent === current) return null;
			current = parent;
			continue;
		}
		const existingPath = node_fs.default.realpathSync(current);
		return {
			canonicalPath: stats.isDirectory() ? existingPath : node_path.default.dirname(existingPath),
			originalPath: stats.isDirectory() ? current : node_path.default.dirname(current)
		};
	}
}
function decodeMountPath(value) {
	return value.replace(/\\([0-7]{3})/g, (_match, octal) => String.fromCharCode(Number.parseInt(octal, 8)));
}
function parseProcMountInfoEntries(contents) {
	const entries = [];
	for (const line of contents.split("\n")) {
		const separator = line.indexOf(" - ");
		if (separator === -1) continue;
		const fields = line.slice(0, separator).split(" ");
		const suffixFields = line.slice(separator + 3).split(" ");
		const mountPoint = fields[4];
		const fsType = suffixFields[0];
		if (mountPoint && fsType) entries.push({
			mountPoint: decodeMountPath(mountPoint),
			fsType,
			...suffixFields[1] ? { source: decodeMountPath(suffixFields[1]) } : {}
		});
	}
	return entries;
}
function parseMountCommandEntries(contents) {
	const entries = [];
	for (const line of contents.split("\n")) {
		const linuxMatch = /^(.+) on (.+) type ([^,\s)]+) \(/.exec(line);
		if (linuxMatch) {
			entries.push({
				source: linuxMatch[1],
				mountPoint: (0, _gabrielvfonseca_normalization_core.expectDefined)(linuxMatch[2], "linux match capture group 2"),
				fsType: (0, _gabrielvfonseca_normalization_core.expectDefined)(linuxMatch[3], "linux match capture group 3")
			});
			continue;
		}
		const bsdMatch = /^(.+) on (.+) \(([^,\s)]+)/.exec(line);
		if (bsdMatch) entries.push({
			source: bsdMatch[1],
			mountPoint: (0, _gabrielvfonseca_normalization_core.expectDefined)(bsdMatch[2], "bsd match capture group 2"),
			fsType: (0, _gabrielvfonseca_normalization_core.expectDefined)(bsdMatch[3], "bsd match capture group 3")
		});
	}
	return entries;
}
function readMountEntries() {
	try {
		return parseProcMountInfoEntries(node_fs.default.readFileSync(PROC_MOUNTINFO_PATH, "utf8"));
	} catch {}
	try {
		return parseMountCommandEntries(String(node_child_process.default.execFileSync("mount", [])));
	} catch {
		return [];
	}
}
function isPathWithinMount(targetPath, mountPoint) {
	const resolvedTarget = node_path.default.resolve(targetPath);
	const resolvedMountPoint = node_path.default.resolve(mountPoint);
	return resolvedTarget === resolvedMountPoint || resolvedMountPoint === node_path.default.parse(resolvedMountPoint).root || resolvedTarget.startsWith(`${resolvedMountPoint}${node_path.default.sep}`);
}
function isSshfsMountSource(source) {
	if (!source) return false;
	const normalized = source.toLowerCase();
	return normalized === "sshfs" || normalized.startsWith("sshfs#") || normalized.startsWith("sshfs@") || /^(?:[^/\s:]+@)?[^/\s:]+:.*/u.test(source);
}
function resolveMountTypeJournalPolicy(entry) {
	const normalized = entry.fsType.toLowerCase();
	if (normalized.startsWith("nfs") || NETWORK_FILESYSTEM_TYPES.has(normalized)) return "rollback";
	if (normalized === "fuse.sshfs") return "unsupported";
	if ((normalized === "macfuse" || normalized === "osxfuse") && isSshfsMountSource(entry.source)) return "unsupported";
	return "wal";
}
function resolveMountEntryJournalPolicy(targetPath, mountEntries) {
	const mountEntry = mountEntries.filter((entry) => isPathWithinMount(targetPath, entry.mountPoint)).toSorted((a, b) => b.mountPoint.length - a.mountPoint.length)[0];
	return mountEntry ? resolveMountTypeJournalPolicy(mountEntry) : "wal";
}
function combineMountEntryJournalPolicies(targetPaths) {
	const mountEntries = readMountEntries();
	const policies = new Set(targetPaths.map((targetPath) => resolveMountEntryJournalPolicy(targetPath, mountEntries)));
	if (policies.has("unsupported")) return "unsupported";
	return policies.has("rollback") ? "rollback" : "wal";
}
function isWindowsUncPath(targetPath) {
	return /^\\\\\?\\UNC\\[^\\]+\\[^\\]+/i.test(targetPath) || /^\\\\(?![?.]\\)[^\\]+\\[^\\]+/.test(targetPath);
}
function isWindowsDrivePath(targetPath) {
	return /^[A-Za-z]:[\\/]/.test(targetPath) || /^\\\\\?\\[A-Za-z]:[\\/]/i.test(targetPath);
}
function resolvePathJournalPolicy(targetPath) {
	if (process.platform === "win32") {
		const normalizedTargetPath = node_path.default.win32.normalize(targetPath);
		if (isWindowsUncPath(normalizedTargetPath)) return "rollback";
		if (isWindowsDrivePath(normalizedTargetPath)) try {
			return isWindowsUncPath(node_path.default.win32.normalize(node_fs.default.realpathSync.native(targetPath))) ? "rollback" : "wal";
		} catch {
			return "rollback";
		}
	}
	const checkedPaths = findExistingVolumePaths(targetPath);
	if (!checkedPaths) return "wal";
	const mountLookupPaths = [checkedPaths.originalPath, checkedPaths.canonicalPath];
	if (typeof node_fs.default.statfsSync !== "function") return combineMountEntryJournalPolicies(mountLookupPaths);
	try {
		const filesystemType = node_fs.default.statfsSync(checkedPaths.canonicalPath).type;
		if (filesystemType === LINUX_NFS_SUPER_MAGIC || filesystemType === LINUX_SMB_SUPER_MAGIC || filesystemType === LINUX_CIFS_SUPER_MAGIC || filesystemType === LINUX_SMB2_SUPER_MAGIC) return "rollback";
	} catch {
		return combineMountEntryJournalPolicies(mountLookupPaths);
	}
	return combineMountEntryJournalPolicies(mountLookupPaths);
}
function readJournalModeResult(row) {
	if (!row || typeof row !== "object") return null;
	const record = row;
	const value = record.journal_mode ?? Object.values(record)[0];
	return typeof value === "string" ? value.toLowerCase() : null;
}
function hasInMemoryMainDatabase(db) {
	return db.prepare("PRAGMA database_list;").all().find((row) => row.name === "main")?.file === "";
}
function readCheckpointBusyResult(row) {
	if (!row || typeof row !== "object") return false;
	const record = row;
	const value = record.busy ?? Object.values(record)[0];
	return value === 1 || value === 1n;
}
function requireRollbackJournalMode(db, options) {
	const journalMode = readJournalModeResult(db.prepare("PRAGMA journal_mode = DELETE;").get());
	if (journalMode !== "delete") {
		const label = options.databaseLabel ?? "sqlite database";
		const location = options.databasePath ? ` at ${options.databasePath}` : "";
		throw new Error(`${label}${location} is on a network-backed volume but SQLite kept journal_mode=${journalMode ?? "unknown"}; refusing to continue with WAL on network storage.`);
	}
}
function enableWalJournalMode(db, retryTimeoutMs, options) {
	const deadline = Date.now() + retryTimeoutMs;
	let restoreBusyTimeout = false;
	try {
		while (true) try {
			db.exec("PRAGMA journal_mode = WAL;");
			const journalMode = readJournalModeResult(db.prepare("PRAGMA journal_mode;").get());
			if (journalMode === "wal") return true;
			if (journalMode === "memory" && hasInMemoryMainDatabase(db)) return false;
			const label = options.databaseLabel ?? "sqlite database";
			const location = options.databasePath ? ` at ${options.databasePath}` : "";
			throw new Error(`${label}${location} could not enable WAL; SQLite kept journal_mode=${journalMode ?? "unknown"}.`);
		} catch (error) {
			const remainingMs = deadline - Date.now();
			if (!isSqliteLockError(error) || remainingMs <= 0) throw error;
			if (!restoreBusyTimeout) {
				configureSqliteBusyTimeout(db, 0);
				restoreBusyTimeout = true;
			}
			Atomics.wait(JOURNAL_MODE_RETRY_SLEEP, 0, 0, Math.min(JOURNAL_MODE_RETRY_INTERVAL_MS, remainingMs));
		}
	} finally {
		if (restoreBusyTimeout) configureSqliteBusyTimeout(db, retryTimeoutMs);
	}
}
function enableMacosCheckpointFullfsync(db) {
	if (process.platform !== "darwin") return;
	try {
		db.exec("PRAGMA checkpoint_fullfsync = 1;");
	} catch {}
}
function refuseUnsupportedFilesystem(options) {
	const label = options.databaseLabel ?? "sqlite database";
	const location = options.databasePath ? ` at ${options.databasePath}` : "";
	throw new Error(`${label}${location} is on SSHFS, which cannot safely coordinate SQLite writes across mounts; refusing to open the database.`);
}
/** Configure safe journaling pragmas and return a handle for checkpoint/close maintenance. */
function configureSqliteWalMaintenance(db, options = {}) {
	const busyTimeoutMs = options.busyTimeoutMs === void 0 ? 0 : configureSqliteBusyTimeout(db, options.busyTimeoutMs);
	const autoCheckpointPages = normalizeNonNegativeInteger(options.autoCheckpointPages ?? DEFAULT_SQLITE_WAL_AUTOCHECKPOINT_PAGES, "autoCheckpointPages");
	const checkpointIntervalMs = normalizeNonNegativeInteger(options.checkpointIntervalMs ?? DEFAULT_SQLITE_WAL_CHECKPOINT_INTERVAL_MS, "checkpointIntervalMs");
	const timerIntervalMs = Math.min(checkpointIntervalMs, require_number_coercion.number_coercion_exports.MAX_TIMER_TIMEOUT_MS);
	const checkpointMode = options.checkpointMode ?? "TRUNCATE";
	const periodicCheckpointMode = options.checkpointMode ?? "PASSIVE";
	const journalPolicy = options.databasePath ? resolvePathJournalPolicy(options.databasePath) : "wal";
	if (journalPolicy === "unsupported") refuseUnsupportedFilesystem(options);
	if (journalPolicy === "rollback") {
		requireRollbackJournalMode(db, options);
		return {
			checkpoint: () => true,
			close: () => true
		};
	}
	if (!enableWalJournalMode(db, busyTimeoutMs, options)) return {
		checkpoint: () => true,
		close: () => true
	};
	enableMacosCheckpointFullfsync(db);
	db.exec(`PRAGMA wal_autocheckpoint = ${autoCheckpointPages};`);
	const runCheckpoint = (mode) => {
		try {
			if (readCheckpointBusyResult(db.prepare(`PRAGMA wal_checkpoint(${mode});`).get())) {
				const label = options.databaseLabel ?? "sqlite database";
				const error = /* @__PURE__ */ new Error(`${label} WAL checkpoint ${mode} remained busy`);
				options.onCheckpointError?.(error);
				return false;
			}
			return true;
		} catch (error) {
			options.onCheckpointError?.(error);
			return false;
		}
	};
	const runIncrementalVacuum = () => {
		try {
			db.exec(`PRAGMA incremental_vacuum(${INCREMENTAL_VACUUM_MAX_PAGES_PER_PASS});`);
		} catch (error) {
			options.onCheckpointError?.(error);
		}
	};
	const checkpoint = () => runCheckpoint(checkpointMode);
	let timer = null;
	if (timerIntervalMs > 0) {
		timer = setInterval(() => {
			runCheckpoint(periodicCheckpointMode);
			runIncrementalVacuum();
		}, timerIntervalMs);
		timer.unref?.();
	}
	return {
		checkpoint,
		close: () => {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
			return checkpoint();
		}
	};
}
/**
* Register a best-effort exit-time close for a SQLite handle cache. Returns an
* unregister callback the cache's orderly close path must invoke, so tests and
* runtime shutdowns do not accumulate listeners on shared worker processes.
*/
function registerSqliteCacheExitClose(closeAll) {
	const closeOnExit = () => {
		try {
			closeAll();
		} catch {}
	};
	process.once("exit", closeOnExit);
	return () => {
		process.removeListener("exit", closeOnExit);
	};
}
/** Configure per-connection SQLite pragmas in the safe lock-retry/WAL order. */
function configureSqliteConnectionPragmas(db, options = {}) {
	const { foreignKeys, synchronous, ...walOptions } = options;
	const maintenance = configureSqliteWalMaintenance(db, walOptions);
	if (synchronous) db.exec(`PRAGMA synchronous = ${synchronous};`);
	if (foreignKeys) db.exec("PRAGMA foreign_keys = ON;");
	return maintenance;
}
//#endregion
//#region src/cron/execution-error-constants.ts
/** Stable cron execution error text shared by runtime and ledger codecs. */
const CRON_JOB_EXECUTION_TIMEOUT_ERROR = "cron: job execution timed out";
//#endregion
//#region src/cron/run-diagnostics-normalize.ts
/** Dependency-light normalization helpers for stored cron run diagnostics. */
const MAX_ENTRIES = 10;
const MAX_ENTRY_CHARS = 1e3;
const MAX_SUMMARY_CHARS = 2e3;
function normalizeSeverity(value) {
	return value === "info" || value === "warn" || value === "error" ? value : "error";
}
function normalizeSource(value) {
	switch (value) {
		case "cron-preflight":
		case "cron-setup":
		case "model-preflight":
		case "agent-run":
		case "tool":
		case "exec":
		case "delivery": return value;
		default: return "agent-run";
	}
}
function normalizeTimestamp(value, nowMs) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : nowMs();
}
function formatUnknownError(error) {
	if (error instanceof Error) return error.message || error.name;
	return String(error);
}
function isRecord(value) {
	return value !== null && typeof value === "object";
}
function normalizeToolName(value) {
	if (typeof value !== "string") return;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
}
function normalizeExitCode(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	return value === null ? null : void 0;
}
function tailText(value, maxChars) {
	if (value.length <= maxChars) return value;
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(value, -maxChars);
}
function normalizeDiagnosticMessage(value, redactText) {
	if (typeof value !== "string") return {};
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!normalized) return {};
	const redacted = redactText(normalized);
	if (redacted.length <= MAX_ENTRY_CHARS) return { message: redacted };
	return {
		message: `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(redacted, MAX_ENTRY_CHARS - 1)}…`,
		truncated: true
	};
}
function trimSummary(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!normalized) return;
	if (normalized.length <= MAX_SUMMARY_CHARS) return normalized;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(normalized, MAX_SUMMARY_CHARS - 1)}…`;
}
/** Normalizes stored cron diagnostic payloads into bounded entries. */
function normalizeCronRunDiagnostics(value, opts) {
	if (!value || typeof value !== "object") return;
	const record = value;
	const nowMs = opts?.nowMs ?? Date.now;
	const redactText = opts?.redactText ?? ((text) => text);
	const entriesRaw = Array.isArray(record.entries) ? record.entries : [];
	const entries = [];
	for (const item of entriesRaw) {
		if (!item || typeof item !== "object") continue;
		const entry = item;
		const normalized = normalizeDiagnosticMessage(entry.message, redactText);
		if (!normalized.message) continue;
		entries.push({
			ts: normalizeTimestamp(entry.ts, nowMs),
			source: normalizeSource(entry.source),
			severity: normalizeSeverity(entry.severity),
			message: normalized.message,
			...typeof entry.toolName === "string" && entry.toolName.trim() ? { toolName: entry.toolName.trim() } : {},
			...typeof entry.exitCode === "number" && Number.isFinite(entry.exitCode) ? { exitCode: entry.exitCode } : entry.exitCode === null ? { exitCode: null } : {},
			...entry.truncated === true || normalized.truncated ? { truncated: true } : {}
		});
		if (entries.length > MAX_ENTRIES) entries.shift();
	}
	const summary = trimSummary(typeof record.summary === "string" ? redactText(record.summary) : void 0);
	if (entries.length === 0 && !summary) return;
	return {
		...summary ? { summary } : {},
		entries
	};
}
//#endregion
//#region src/cron/task-run-detail.ts
/** Read-side cron codec between task-ledger detail and the stable run-history wire shape.
* Deliberately free of agent/runtime imports so history reads stay dependency-light;
* the event->entry write codec lives in task-run-event-codec.ts. */
const CRON_TASK_DETAIL_KIND = "cron-run";
const CRON_FAILOVER_REASONS = /* @__PURE__ */ new Set([
	"auth",
	"auth_permanent",
	"format",
	"rate_limit",
	"overloaded",
	"billing",
	"server_error",
	"timeout",
	"model_not_found",
	"session_expired",
	"context_overflow",
	"empty_response",
	"no_error_details",
	"unclassified",
	"unknown"
]);
function toJsonValue(value) {
	const serialized = JSON.stringify(value);
	return serialized === void 0 ? void 0 : JSON.parse(serialized);
}
function isJsonObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isCronRunStatus(value) {
	return value === "ok" || value === "error" || value === "skipped";
}
function normalizeCronRunLogErrorReason(value) {
	return typeof value === "string" && CRON_FAILOVER_REASONS.has(value) ? value : void 0;
}
/** Parses stored or migrated cron history while preserving the stable wire shape. */
function parseCronRunLogEntryObject(obj, opts) {
	const jobId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts?.jobId);
	if (!obj || typeof obj !== "object") return null;
	const entryObj = obj;
	if (entryObj.action !== "finished") return null;
	if (typeof entryObj.jobId !== "string" || entryObj.jobId.trim().length === 0) return null;
	if (typeof entryObj.ts !== "number" || !Number.isFinite(entryObj.ts)) return null;
	if (jobId && entryObj.jobId !== jobId) return null;
	const usage = entryObj.usage && typeof entryObj.usage === "object" ? entryObj.usage : void 0;
	const normalizedError = typeof entryObj.error === "string" ? entryObj.error : void 0;
	const normalizedProvider = typeof entryObj.provider === "string" && entryObj.provider.trim() ? entryObj.provider : void 0;
	const entry = {
		ts: entryObj.ts,
		jobId: entryObj.jobId,
		action: "finished",
		status: entryObj.status,
		error: normalizedError,
		errorReason: normalizeCronRunLogErrorReason(entryObj.errorReason) ?? void 0,
		summary: entryObj.summary,
		runId: typeof entryObj.runId === "string" && entryObj.runId.trim() ? entryObj.runId : void 0,
		diagnostics: normalizeCronRunDiagnostics(entryObj.diagnostics),
		runAtMs: entryObj.runAtMs,
		durationMs: entryObj.durationMs,
		nextRunAtMs: entryObj.nextRunAtMs,
		triggerFired: entryObj.triggerFired === true ? true : void 0,
		model: typeof entryObj.model === "string" && entryObj.model.trim() ? entryObj.model : void 0,
		provider: normalizedProvider,
		usage: usage ? {
			input_tokens: typeof usage.input_tokens === "number" ? usage.input_tokens : void 0,
			output_tokens: typeof usage.output_tokens === "number" ? usage.output_tokens : void 0,
			total_tokens: typeof usage.total_tokens === "number" ? usage.total_tokens : void 0,
			cache_read_tokens: typeof usage.cache_read_tokens === "number" ? usage.cache_read_tokens : void 0,
			cache_write_tokens: typeof usage.cache_write_tokens === "number" ? usage.cache_write_tokens : void 0
		} : void 0
	};
	if (typeof entryObj.delivered === "boolean") entry.delivered = entryObj.delivered;
	if (entryObj.deliveryStatus === "delivered" || entryObj.deliveryStatus === "not-delivered" || entryObj.deliveryStatus === "unknown" || entryObj.deliveryStatus === "not-requested") entry.deliveryStatus = entryObj.deliveryStatus;
	if (typeof entryObj.deliveryError === "string") entry.deliveryError = entryObj.deliveryError;
	if (entryObj.failureNotificationDelivery && typeof entryObj.failureNotificationDelivery === "object") {
		const failureNotificationDelivery = entryObj.failureNotificationDelivery;
		if (failureNotificationDelivery.status === "delivered" || failureNotificationDelivery.status === "not-delivered" || failureNotificationDelivery.status === "unknown" || failureNotificationDelivery.status === "not-requested") entry.failureNotificationDelivery = {
			status: failureNotificationDelivery.status,
			...typeof failureNotificationDelivery.delivered === "boolean" ? { delivered: failureNotificationDelivery.delivered } : {},
			...typeof failureNotificationDelivery.error === "string" ? { error: failureNotificationDelivery.error } : {}
		};
	}
	if (entryObj.delivery && typeof entryObj.delivery === "object") entry.delivery = entryObj.delivery;
	if (typeof entryObj.sessionId === "string" && entryObj.sessionId.trim()) entry.sessionId = entryObj.sessionId;
	if (typeof entryObj.sessionKey === "string" && entryObj.sessionKey.trim()) entry.sessionKey = entryObj.sessionKey;
	return entry;
}
/** Encodes cron-only outcome fields; generic lifecycle fields stay on TaskRecord. */
function cronRunLogEntryToTaskDetail(entry, options) {
	return toJsonValue({
		kind: CRON_TASK_DETAIL_KIND,
		status: entry.status,
		storeKey: options.storeKey,
		errorReason: entry.errorReason,
		diagnostics: entry.diagnostics,
		delivered: entry.delivered,
		deliveryStatus: entry.deliveryStatus,
		deliveryError: entry.deliveryError,
		failureNotificationDelivery: entry.failureNotificationDelivery,
		delivery: entry.delivery,
		sessionId: entry.sessionId,
		runId: entry.runId,
		runAtMs: entry.runAtMs,
		durationMs: entry.durationMs,
		nextRunAtMs: entry.nextRunAtMs,
		triggerFired: entry.triggerFired,
		triggerStateChanged: options.triggerEval?.fired === true ? options.triggerEval.stateChanged : void 0,
		triggerState: options.triggerEval?.fired === true && options.triggerEval.stateChanged ? options.triggerEval.state : void 0,
		model: entry.model,
		provider: entry.provider,
		usage: entry.usage
	}) ?? { kind: CRON_TASK_DETAIL_KIND };
}
/** Returns the cron store partition recorded on a task row. */
function cronTaskRecordStoreKey(task) {
	return isJsonObject(task.detail) && typeof task.detail.storeKey === "string" ? task.detail.storeKey : void 0;
}
/** Reads internal trigger recovery data without adding it to run-history responses. */
function cronTaskRecordToTriggerEval(task) {
	if (!isJsonObject(task.detail) || task.detail.triggerFired !== true) return;
	return {
		fired: true,
		stateChanged: task.detail.triggerStateChanged === true,
		...task.detail.triggerStateChanged === true && "triggerState" in task.detail ? { state: task.detail.triggerState } : {}
	};
}
/** Maps the cron outcome vocabulary onto generic task terminal states. */
function cronRunStatusToTaskStatus(entry) {
	if (entry.status === "ok" || entry.status === "skipped") return "succeeded";
	return entry.error === "cron: job execution timed out" ? "timed_out" : "failed";
}
/** Reconstructs the unchanged CronRunLogEntry wire shape from a cron task row. */
function cronTaskRecordToRunLogEntry(task) {
	if (task.runtime !== "cron" || !task.sourceId || !isJsonObject(task.detail)) return null;
	if (task.detail.kind !== CRON_TASK_DETAIL_KIND) return null;
	const wireDetail = { ...task.detail };
	delete wireDetail.storeKey;
	const entry = parseCronRunLogEntryObject({
		...wireDetail,
		ts: task.endedAt ?? task.lastEventAt ?? task.createdAt,
		jobId: task.sourceId,
		action: "finished",
		status: isCronRunStatus(task.detail.status) ? task.detail.status : void 0,
		error: task.error,
		summary: task.terminalSummary,
		sessionKey: task.childSessionKey,
		runId: typeof task.detail.runId === "string" ? task.detail.runId : void 0
	}, { jobId: task.sourceId });
	if (!entry) return null;
	return {
		...entry,
		delivered: entry.delivered,
		deliveryStatus: entry.deliveryStatus,
		deliveryError: entry.deliveryError,
		sessionId: entry.sessionId,
		sessionKey: entry.sessionKey
	};
}
//#endregion
//#region src/infra/sqlite-number.ts
/** Converts a SQLite number or bigint column into a JavaScript number. */
function normalizeSqliteNumber(value) {
	if (typeof value === "bigint") return Number(value);
	return typeof value === "number" ? value : void 0;
}
//#endregion
//#region src/infra/state-migrations.cron-run-logs.ts
const CRON_RUN_LOG_TASK_IMPORT_MIGRATION_ID = "state:cron-run-logs-to-task-runs:v1";
const CRON_RUN_LOG_IMPORT_BATCH_SIZE = 500;
function tableExists(db, name) {
	return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1").get(name));
}
function parseDetail(raw) {
	if (!raw) return;
	try {
		const parsed = JSON.parse(raw);
		return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
function collectMirroredTasks(db) {
	const rows = db.prepare(`SELECT source_id, ended_at, detail_json
       FROM task_runs
       WHERE runtime = 'cron' AND source_id IS NOT NULL AND detail_json IS NOT NULL`).all();
	const bySource = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const detail = parseDetail(row.detail_json);
		if (!row.source_id || detail?.kind !== "cron-run") continue;
		const identities = bySource.get(row.source_id) ?? [];
		identities.push({
			endedAt: normalizeSqliteNumber(row.ended_at) ?? null,
			...typeof detail.runId === "string" && detail.runId ? { runId: detail.runId } : {}
		});
		bySource.set(row.source_id, identities);
	}
	return bySource;
}
function hasMirroredIdentity(identities, runId, endedAt) {
	return identities.some((identity) => runId && identity.runId ? identity.runId === runId : identity.endedAt === endedAt);
}
function integerToBoolean(value) {
	return value === null || value === void 0 ? void 0 : Number(value) !== 0;
}
/** Legacy rows trust write-time errorReason and diagnostic redaction without recomputation. */
function parseLegacyRow(row) {
	let rawEntry;
	try {
		rawEntry = JSON.parse(row.entry_json ?? "");
	} catch {
		return null;
	}
	const parsed = parseCronRunLogEntryObject(rawEntry, { jobId: row.job_id });
	if (!parsed) return null;
	return {
		...parsed,
		ts: normalizeSqliteNumber(row.ts) ?? parsed.ts,
		jobId: row.job_id,
		status: row.status ?? parsed.status,
		error: row.error ?? parsed.error,
		summary: row.summary ?? parsed.summary,
		delivered: integerToBoolean(row.delivered) ?? parsed.delivered,
		deliveryStatus: row.delivery_status ?? parsed.deliveryStatus,
		deliveryError: row.delivery_error ?? parsed.deliveryError,
		sessionId: row.session_id ?? parsed.sessionId,
		sessionKey: row.session_key ?? parsed.sessionKey,
		runId: row.run_id ?? parsed.runId,
		runAtMs: normalizeSqliteNumber(row.run_at_ms ?? null) ?? parsed.runAtMs,
		durationMs: normalizeSqliteNumber(row.duration_ms ?? null) ?? parsed.durationMs,
		nextRunAtMs: normalizeSqliteNumber(row.next_run_at_ms ?? null) ?? parsed.nextRunAtMs,
		model: row.model ?? parsed.model,
		provider: row.provider ?? parsed.provider
	};
}
function ordinalKey(jobId, ts) {
	return `${jobId}\0${ts}`;
}
/** Runs inside the state schema transaction and removes the retired table after import. */
function migrateLegacyCronRunLogsToTaskRuns(db) {
	if (!tableExists(db, "cron_run_logs")) return {
		imported: 0,
		alreadyMirrored: 0,
		malformed: 0,
		skipped: true
	};
	const mirrored = collectMirroredTasks(db);
	const ordinals = /* @__PURE__ */ new Map();
	const insert = db.prepare(`
    INSERT INTO task_runs (
      task_id, runtime, task_kind, source_id, requester_session_key, owner_key, scope_kind,
      child_session_key, parent_flow_id, parent_task_id, agent_id, requester_agent_id, run_id,
      label, task, status, delivery_status, notify_policy, created_at, started_at, ended_at,
      last_event_at, cleanup_after, error, progress_summary, terminal_summary, terminal_outcome,
      detail_json
    ) VALUES (
      @task_id, 'cron', NULL, @source_id, '', '', 'system', @child_session_key, NULL, NULL,
      NULL, NULL, @run_id, NULL, @task, @status, 'not_applicable', 'silent', @created_at,
      @started_at, @ended_at, @ended_at, NULL, @error, NULL, @terminal_summary,
      @terminal_outcome, @detail_json
    )
  `);
	let imported = 0;
	let alreadyMirrored = 0;
	let malformed = 0;
	let offset = 0;
	while (true) {
		const rows = db.prepare(`SELECT * FROM cron_run_logs
         ORDER BY job_id, ts, store_key, seq
         LIMIT ? OFFSET ?`).all(CRON_RUN_LOG_IMPORT_BATCH_SIZE, offset);
		if (rows.length === 0) break;
		offset += rows.length;
		for (const row of rows) {
			const entry = parseLegacyRow(row);
			if (!entry) {
				malformed++;
				continue;
			}
			const key = ordinalKey(entry.jobId, entry.ts);
			const ordinal = (ordinals.get(key) ?? 0) + 1;
			ordinals.set(key, ordinal);
			if (hasMirroredIdentity(mirrored.get(entry.jobId) ?? [], entry.runId, entry.ts)) {
				alreadyMirrored++;
				continue;
			}
			const taskId = `cron-runlog-import:${entry.jobId}:${entry.ts}:${ordinal}`;
			const status = cronRunStatusToTaskStatus(entry);
			insert.run({
				task_id: taskId,
				source_id: entry.jobId,
				child_session_key: entry.sessionKey ?? null,
				run_id: taskId,
				task: entry.jobId,
				status,
				created_at: entry.runAtMs ?? entry.ts,
				started_at: entry.runAtMs ?? null,
				ended_at: entry.ts,
				error: entry.error ?? null,
				terminal_summary: entry.summary ?? null,
				terminal_outcome: status === "succeeded" ? "succeeded" : null,
				detail_json: JSON.stringify(cronRunLogEntryToTaskDetail(entry, { storeKey: row.store_key }))
			});
			imported++;
		}
	}
	db.exec(`
    DROP INDEX IF EXISTS idx_cron_run_logs_store_ts;
    DROP INDEX IF EXISTS idx_cron_run_logs_job_status;
    DROP INDEX IF EXISTS idx_cron_run_logs_delivery;
    DROP TABLE cron_run_logs;
  `);
	const result = {
		imported,
		alreadyMirrored,
		malformed,
		skipped: false
	};
	const now = Date.now();
	db.prepare(`INSERT INTO migration_runs (id, started_at, finished_at, status, report_json)
     VALUES (?, ?, ?, 'completed', ?)
     ON CONFLICT(id) DO UPDATE SET
       finished_at = excluded.finished_at,
       status = excluded.status,
       report_json = excluded.report_json`).run(CRON_RUN_LOG_TASK_IMPORT_MIGRATION_ID, now, now, JSON.stringify(result));
	return result;
}
//#endregion
Object.defineProperty(exports, "CRON_JOB_EXECUTION_TIMEOUT_ERROR", {
	enumerable: true,
	get: function() {
		return CRON_JOB_EXECUTION_TIMEOUT_ERROR;
	}
});
Object.defineProperty(exports, "applyPrivateModeSync", {
	enumerable: true,
	get: function() {
		return applyPrivateModeSync;
	}
});
Object.defineProperty(exports, "assertSqliteIntegrity", {
	enumerable: true,
	get: function() {
		return assertSqliteIntegrity;
	}
});
Object.defineProperty(exports, "assertSqliteSchemaContains", {
	enumerable: true,
	get: function() {
		return assertSqliteSchemaContains;
	}
});
Object.defineProperty(exports, "assertSqliteTableIntegrity", {
	enumerable: true,
	get: function() {
		return assertSqliteTableIntegrity;
	}
});
Object.defineProperty(exports, "buildApprovalResolutionRef", {
	enumerable: true,
	get: function() {
		return buildApprovalResolutionRef;
	}
});
Object.defineProperty(exports, "clearNodeSqliteKyselyCacheForDatabase", {
	enumerable: true,
	get: function() {
		return clearNodeSqliteKyselyCacheForDatabase;
	}
});
Object.defineProperty(exports, "configureSqliteConnectionPragmas", {
	enumerable: true,
	get: function() {
		return configureSqliteConnectionPragmas;
	}
});
Object.defineProperty(exports, "configureSqlitePreSchemaPragmas", {
	enumerable: true,
	get: function() {
		return configureSqlitePreSchemaPragmas;
	}
});
Object.defineProperty(exports, "createNewerSqliteSchemaVersionError", {
	enumerable: true,
	get: function() {
		return createNewerSqliteSchemaVersionError;
	}
});
Object.defineProperty(exports, "cronRunLogEntryToTaskDetail", {
	enumerable: true,
	get: function() {
		return cronRunLogEntryToTaskDetail;
	}
});
Object.defineProperty(exports, "cronRunStatusToTaskStatus", {
	enumerable: true,
	get: function() {
		return cronRunStatusToTaskStatus;
	}
});
Object.defineProperty(exports, "cronTaskRecordStoreKey", {
	enumerable: true,
	get: function() {
		return cronTaskRecordStoreKey;
	}
});
Object.defineProperty(exports, "cronTaskRecordToRunLogEntry", {
	enumerable: true,
	get: function() {
		return cronTaskRecordToRunLogEntry;
	}
});
Object.defineProperty(exports, "cronTaskRecordToTriggerEval", {
	enumerable: true,
	get: function() {
		return cronTaskRecordToTriggerEval;
	}
});
Object.defineProperty(exports, "executeSqliteQuerySync", {
	enumerable: true,
	get: function() {
		return executeSqliteQuerySync;
	}
});
Object.defineProperty(exports, "executeSqliteQueryTakeFirstSync", {
	enumerable: true,
	get: function() {
		return executeSqliteQueryTakeFirstSync;
	}
});
Object.defineProperty(exports, "formatUnknownError", {
	enumerable: true,
	get: function() {
		return formatUnknownError;
	}
});
Object.defineProperty(exports, "getNodeSqliteKysely", {
	enumerable: true,
	get: function() {
		return getNodeSqliteKysely;
	}
});
Object.defineProperty(exports, "isApprovalResolutionRef", {
	enumerable: true,
	get: function() {
		return isApprovalResolutionRef;
	}
});
Object.defineProperty(exports, "isRecord", {
	enumerable: true,
	get: function() {
		return isRecord;
	}
});
Object.defineProperty(exports, "isSqliteLockError", {
	enumerable: true,
	get: function() {
		return isSqliteLockError;
	}
});
Object.defineProperty(exports, "iterateSqliteQuerySync", {
	enumerable: true,
	get: function() {
		return iterateSqliteQuerySync;
	}
});
Object.defineProperty(exports, "migrateLegacyCronRunLogsToTaskRuns", {
	enumerable: true,
	get: function() {
		return migrateLegacyCronRunLogsToTaskRuns;
	}
});
Object.defineProperty(exports, "migrateSqliteSchemaToStrict", {
	enumerable: true,
	get: function() {
		return migrateSqliteSchemaToStrict;
	}
});
Object.defineProperty(exports, "migrateSqliteSchemaToStrictInTransaction", {
	enumerable: true,
	get: function() {
		return migrateSqliteSchemaToStrictInTransaction;
	}
});
Object.defineProperty(exports, "normalizeCronRunDiagnostics", {
	enumerable: true,
	get: function() {
		return normalizeCronRunDiagnostics;
	}
});
Object.defineProperty(exports, "normalizeExitCode", {
	enumerable: true,
	get: function() {
		return normalizeExitCode;
	}
});
Object.defineProperty(exports, "normalizeSqliteNumber", {
	enumerable: true,
	get: function() {
		return normalizeSqliteNumber;
	}
});
Object.defineProperty(exports, "normalizeToolName", {
	enumerable: true,
	get: function() {
		return normalizeToolName;
	}
});
Object.defineProperty(exports, "parseCronRunLogEntryObject", {
	enumerable: true,
	get: function() {
		return parseCronRunLogEntryObject;
	}
});
Object.defineProperty(exports, "readSqliteUserVersion", {
	enumerable: true,
	get: function() {
		return readSqliteUserVersion;
	}
});
Object.defineProperty(exports, "registerSqliteCacheExitClose", {
	enumerable: true,
	get: function() {
		return registerSqliteCacheExitClose;
	}
});
Object.defineProperty(exports, "repairCanonicalSqliteUniqueIndexes", {
	enumerable: true,
	get: function() {
		return repairCanonicalSqliteUniqueIndexes;
	}
});
Object.defineProperty(exports, "requireNodeSqlite", {
	enumerable: true,
	get: function() {
		return requireNodeSqlite;
	}
});
Object.defineProperty(exports, "resolveSqliteDatabaseFilePaths", {
	enumerable: true,
	get: function() {
		return resolveSqliteDatabaseFilePaths;
	}
});
Object.defineProperty(exports, "runSqliteDeferredTransactionSync", {
	enumerable: true,
	get: function() {
		return runSqliteDeferredTransactionSync;
	}
});
Object.defineProperty(exports, "runSqliteImmediateTransactionSync", {
	enumerable: true,
	get: function() {
		return runSqliteImmediateTransactionSync;
	}
});
Object.defineProperty(exports, "tailText", {
	enumerable: true,
	get: function() {
		return tailText;
	}
});
