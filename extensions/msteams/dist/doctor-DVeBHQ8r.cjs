const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
require("./legacy-names-CjJxLNks.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_package_entry_resolution = require("./package-entry-resolution-VwWE-qTF.cjs");
const require_installed_plugin_index_store = require("./installed-plugin-index-store-vrROJGFd.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
const require_doctor_sqlite_maintenance_lock = require("./doctor-sqlite-maintenance-lock-DBgRaRhw.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/commands/doctor-post-upgrade.types.ts
/** Probe codes emitted by post-upgrade validation. */
const POST_UPGRADE_PROBE_CODES = [
	"plugin.index_unavailable",
	"plugin.entry_unresolved",
	"plugin.manifest_drift"
];
//#endregion
//#region src/commands/doctor-post-upgrade.ts
/** Post-upgrade validation probes for persisted plugin index and package extension entries. */
function buildReport(findings) {
	return {
		probesRun: [...POST_UPGRADE_PROBE_CODES],
		findings
	};
}
function isInstallsJson(value) {
	return typeof value === "object" && value !== null && Array.isArray(value.plugins) && value.plugins.every(isInstalledPluginRecord);
}
function isOptionalString(value) {
	return value === void 0 || typeof value === "string";
}
function isPackageJsonRef(value) {
	return value === void 0 || typeof value === "object" && value !== null && typeof value.path === "string";
}
function isSourceCheckoutPluginRecord(record) {
	if (record.origin === "workspace" || record.origin === "config") return true;
	return record.origin === "bundled" && isBundledSourceCheckoutPluginRoot(record.rootDir);
}
function isBundledSourceCheckoutPluginRoot(pluginRootDir) {
	let current = node_path.default.resolve(pluginRootDir);
	while (true) {
		const extensionsDir = node_path.default.dirname(current);
		if (node_path.default.basename(extensionsDir) === "extensions") {
			const packageRoot = node_path.default.dirname(extensionsDir);
			return node_fs.default.existsSync(node_path.default.join(packageRoot, ".git")) && node_fs.default.existsSync(node_path.default.join(packageRoot, "pnpm-workspace.yaml")) && node_fs.default.existsSync(node_path.default.join(packageRoot, "src"));
		}
		const next = node_path.default.dirname(current);
		if (next === current) return false;
		current = next;
	}
}
function isInstalledPluginRecord(value) {
	if (typeof value !== "object" || value === null) return false;
	const record = value;
	return typeof record.pluginId === "string" && typeof record.rootDir === "string" && typeof record.enabled === "boolean" && isOptionalString(record.origin) && isPackageJsonRef(record.packageJson) && isOptionalString(record.manifestPath) && isOptionalString(record.manifestHash);
}
async function readInstallsJson(installsPath) {
	try {
		const installsRaw = await node_fs_promises.default.readFile(installsPath, "utf-8");
		const installs = JSON.parse(installsRaw);
		return isInstallsJson(installs) ? installs : null;
	} catch {
		return null;
	}
}
async function readInstalledPluginIndex(params) {
	if (params.installsPath) return await readInstallsJson(params.installsPath);
	const index = await require_installed_plugin_index_store.readPersistedInstalledPluginIndex(params.stateDir ? { stateDir: params.stateDir } : {});
	return index && isInstallsJson(index) ? { plugins: [...index.plugins] } : null;
}
async function readInstalledPackageJson(rootDir, packageJsonRelPath) {
	const absPath = node_path.default.join(rootDir, packageJsonRelPath);
	const raw = await node_fs_promises.default.readFile(absPath, "utf-8");
	return JSON.parse(raw);
}
async function resolvePackageJsonRelPath(record) {
	if (record.packageJson) return record.packageJson.path;
	try {
		await node_fs_promises.default.access(node_path.default.join(record.rootDir, "package.json"));
		return "package.json";
	} catch {
		return;
	}
}
async function sha256OfFile(absPath) {
	try {
		const raw = await node_fs_promises.default.readFile(absPath);
		return node_crypto.default.createHash("sha256").update(raw).digest("hex");
	} catch {
		return null;
	}
}
/** Runs post-upgrade plugin probes and returns structured findings for the caller to render. */
async function runPostUpgradeProbes(params) {
	const findings = [];
	const installs = await readInstalledPluginIndex(params);
	if (!installs) {
		findings.push({
			level: "error",
			code: "plugin.index_unavailable",
			message: "Installed plugin index is missing, unreadable, or malformed. Run `operator plugins registry --refresh` to rebuild it before post-upgrade validation."
		});
		return buildReport(findings);
	}
	for (const record of installs.plugins) {
		if (!record.enabled) continue;
		const pkgRelPath = await resolvePackageJsonRelPath(record);
		if (pkgRelPath) {
			let pkg;
			try {
				pkg = await readInstalledPackageJson(record.rootDir, pkgRelPath);
			} catch (err) {
				process.stderr.write(`[doctor-post-upgrade] could not read package.json for ${record.pluginId} at ${record.rootDir}: ${err instanceof Error ? err.message : String(err)}\n`);
				continue;
			}
			const entries = pkg["@gabrielvfonseca/operator"]?.extensions ?? [];
			if (entries.length > 0) {
				const validation = await require_package_entry_resolution.validatePackageExtensionEntriesForInstall({
					packageDir: record.rootDir,
					extensions: [...entries],
					manifest: pkg,
					allowSourceTypeScriptEntries: isSourceCheckoutPluginRecord(record)
				});
				if (!validation.ok) {
					const offendingEntry = entries.find((entry) => validation.error.includes(entry));
					findings.push({
						level: "error",
						code: "plugin.entry_unresolved",
						message: `Plugin ${record.pluginId}: ${validation.error}`,
						plugin: record.pluginId,
						...offendingEntry ? { entry: offendingEntry } : {}
					});
				}
			}
		}
		if (record.manifestPath && record.manifestHash) {
			const currentHash = await sha256OfFile(record.manifestPath);
			if (currentHash && currentHash !== record.manifestHash) findings.push({
				level: "warn",
				code: "plugin.manifest_drift",
				message: `Plugin ${record.pluginId} manifest hash drifted from installs.json snapshot. Run \`operator plugins registry --refresh\` to re-sync.`,
				plugin: record.pluginId
			});
		}
	}
	return buildReport(findings);
}
//#endregion
//#region src/commands/doctor.ts
/** Top-level doctor command wrapper, including post-upgrade probe mode. */
function resolveExplicitSessionSqliteMaintenancePaths(options) {
	if (!options.sessionSqliteStore) return [];
	const targets = require_targets.resolveSessionStoreTargets({}, {
		store: options.sessionSqliteStore,
		...options.sessionSqliteAgent ? { agent: options.sessionSqliteAgent } : {},
		...options.sessionSqliteAllAgents ? { allAgents: true } : {}
	}, { env: process.env });
	const protectedPaths = /* @__PURE__ */ new Set();
	for (const target of targets) {
		protectedPaths.add(target.storePath);
		const sqlitePath = require_targets.resolveSqliteTargetFromSessionStorePath(target.storePath, { agentId: target.agentId }).path;
		if (sqlitePath) for (const databasePath of require_state_migrations_cron_run_logs.resolveSqliteDatabaseFilePaths(sqlitePath)) protectedPaths.add(databasePath);
	}
	return [...protectedPaths];
}
/** Runs doctor or the post-upgrade probe submode using the provided runtime. */
async function doctorCommand(runtime, options) {
	if (options?.stateSqlite) {
		const outputRuntime = runtime ?? require_runtime.defaultRuntime;
		const { runDoctorStateSqliteCompact } = await Promise.resolve().then(() => require("./doctor-state-sqlite-compact-C3Auktw0.cjs"));
		const report = await runDoctorStateSqliteCompact();
		if (options.json) require_runtime.writeRuntimeJson(outputRuntime, report);
		else if (report.skipped) outputRuntime.log(`state-sqlite compact: skipped; database missing at ${report.path}`);
		else {
			outputRuntime.log(`state-sqlite compact: reclaimed=${report.reclaimedBytes} bytes, db=${report.before.dbSizeBytes}->${report.after.dbSizeBytes} bytes, wal=${report.before.walSizeBytes}->${report.after.walSizeBytes} bytes`);
			outputRuntime.log(`- freelist=${report.before.freelistPages}->${report.after.freelistPages} pages, page-size=${report.after.pageSizeBytes} bytes, auto-vacuum=${report.before.autoVacuum}->${report.after.autoVacuum}`);
			outputRuntime.log(`- quick-check=${report.quickCheck}, integrity-check=${report.integrityCheck}, path=${report.path}`);
		}
		outputRuntime.exit(0);
		return;
	}
	if (options?.sessionSqlite) {
		const outputRuntime = runtime ?? require_runtime.defaultRuntime;
		const sessionSqliteMode = options.sessionSqlite;
		const { runDoctorSessionSqlite } = await Promise.resolve().then(() => require("./doctor-session-sqlite-DLuT4my5.cjs"));
		const runSessionSqlite = async () => await runDoctorSessionSqlite({
			mode: sessionSqliteMode,
			...options.sessionSqliteStore ? { store: options.sessionSqliteStore } : {},
			...options.sessionSqliteAgent ? { agent: options.sessionSqliteAgent } : {},
			...options.sessionSqliteAllAgents ? { allAgents: true } : {}
		});
		const report = require_doctor_sqlite_maintenance_lock.isDestructiveDoctorSessionSqliteMode(sessionSqliteMode) ? await require_doctor_sqlite_maintenance_lock.withDoctorSqliteMaintenanceLock({
			env: process.env,
			operation: `session SQLite ${sessionSqliteMode}`,
			...options.sessionSqliteStore ? { protectedPaths: resolveExplicitSessionSqliteMaintenancePaths(options) } : {},
			run: runSessionSqlite
		}) : await runSessionSqlite();
		if (sessionSqliteMode === "recover" && options.sessionSqliteGithubIssue === true) await maybeCreateSessionSqliteGithubIssue(outputRuntime, report, options);
		if (options.json) require_runtime.writeRuntimeJson(outputRuntime, report);
		else {
			outputRuntime.log(`session-sqlite ${report.mode}: ${report.totals.targets} target(s), ${report.totals.legacyEntries} legacy entries, ${report.totals.sqliteEntries} sqlite entries, ${report.totals.issues} issue(s)`);
			if (report.migrationRun) {
				outputRuntime.log(`- migration-run=${report.migrationRun.runId}`);
				outputRuntime.log(`- manifest=${report.migrationRun.manifestPath}`);
				if (report.migrationRun.failureReportMarkdownPath) outputRuntime.log(`- failure-report=${report.migrationRun.failureReportMarkdownPath}`);
			}
			if (report.supportIssue) {
				outputRuntime.log(`- support-issue-report=${report.supportIssue.bodyPath ?? "inline"}`);
				outputRuntime.log(`- support-issue-url=${report.supportIssue.url}`);
			}
			for (const target of report.targets) {
				outputRuntime.log(`- ${target.agentId}: imported=${target.importedEntries}/${target.importedTranscriptEvents} events, validated=${target.validatedEntries}/${target.validatedTranscriptEvents} events, archived-unreferenced-jsonl=${target.archivedUnreferencedJsonlFiles.length}, unreferenced-jsonl=${target.unreferencedJsonlFiles.length}`);
				if (target.restore) outputRuntime.log(`  restored=${target.restore.restoredFiles.length}, skipped=${target.restore.skippedFiles.length}, conflicts=${target.restore.conflicts.length}, manifests=${target.restore.manifestPaths.length}`);
				if (target.compact) outputRuntime.log(`  compact reclaimed=${target.compact.reclaimedBytes} bytes, db=${target.compact.dbSizeBeforeBytes}->${target.compact.dbSizeAfterBytes} bytes, wal=${target.compact.walSizeBeforeBytes}->${target.compact.walSizeAfterBytes} bytes`);
				if (target.corruptRecovery) outputRuntime.log(`  corrupt-db-recovery moved=${target.corruptRecovery.movedFiles.length}, skipped=${target.corruptRecovery.skippedFiles.length}`);
				for (const issue of target.issues.slice(0, 10)) outputRuntime.log(`  [${issue.code}]${issue.sessionKey ? ` ${issue.sessionKey}:` : ""} ${issue.message}`);
				if (target.issues.length > 10) outputRuntime.log(`  ...and ${target.issues.length - 10} more issue(s)`);
			}
		}
		outputRuntime.exit(report.totals.issues > 0 ? 1 : 0);
		return;
	}
	if (options?.postUpgrade) {
		const outputRuntime = runtime ?? require_runtime.defaultRuntime;
		const report = await runPostUpgradeProbes({});
		if (options.json) require_runtime.writeRuntimeJson(outputRuntime, report);
		else {
			for (const f of report.findings) outputRuntime.log(`[${f.level}] ${f.code}: ${f.message}`);
			if (report.findings.length === 0) outputRuntime.log("post-upgrade: no findings");
		}
		const hasError = report.findings.some((f) => f.level === "error");
		outputRuntime.exit(hasError ? 1 : 0);
		return;
	}
	await (await Promise.resolve().then(() => require("./doctor-health-X5HVDLwc.cjs"))).doctorCommand(runtime, options);
}
async function maybeCreateSessionSqliteGithubIssue(runtime, report, options) {
	const shouldLog = options.json !== true;
	if (!report.supportIssue) {
		if (shouldLog) runtime.log("session-sqlite recover: no support issue payload was generated");
		return;
	}
	let approved = options.yes === true;
	if (!approved && options.nonInteractive !== true && options.json !== true) {
		const { promptYesNo } = await Promise.resolve().then(() => require("./prompt-VQppewrU.cjs")).then((n) => n.prompt_exports);
		approved = await promptYesNo("Create a GitHub issue in operator/operator with the sanitized recovery report?", false);
	}
	if (!approved) {
		report.supportIssue.github = { status: "skipped" };
		if (shouldLog) runtime.log("session-sqlite recover: GitHub issue creation skipped");
		return;
	}
	const { createSessionSqliteGithubIssue } = await Promise.resolve().then(() => require("./doctor-session-sqlite-github-issue-DNq6_anC.cjs"));
	const created = createSessionSqliteGithubIssue(report.supportIssue);
	if (created.ok) {
		report.supportIssue.github = {
			status: "created",
			url: created.url
		};
		if (shouldLog) runtime.log(`session-sqlite recover: created GitHub issue ${created.url}`);
		return;
	}
	report.supportIssue.github = {
		fallbackUrl: created.fallbackUrl,
		message: created.message,
		status: "failed"
	};
	if (shouldLog) {
		runtime.log(`session-sqlite recover: GitHub issue creation unavailable: ${created.message}`);
		runtime.log(`session-sqlite recover: prefilled issue URL ${created.fallbackUrl}`);
	}
}
//#endregion
exports.doctorCommand = doctorCommand;
