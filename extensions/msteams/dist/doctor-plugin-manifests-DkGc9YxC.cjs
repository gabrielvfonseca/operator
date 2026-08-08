const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_zod_parse = require("./zod-parse-D5uufcMS.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let zod = require("zod");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/doctor-plugin-manifests.ts
/** Doctor migration for legacy plugin manifest capability keys into contracts.* fields. */
const LEGACY_MANIFEST_CONTRACT_KEYS = [
	"speechProviders",
	"mediaUnderstandingProviders",
	"imageGenerationProviders",
	"tools"
];
const LEGACY_PLUGIN_MANIFESTS_CHECK_ID = "core/doctor/legacy-plugin-manifests";
const JsonRecordSchema = zod.z.record(zod.z.string(), zod.z.unknown());
function readManifestJson(manifestPath) {
	try {
		return require_zod_parse.safeParseJsonWithSchema(JsonRecordSchema, node_fs.default.readFileSync(manifestPath, "utf-8"));
	} catch {
		return null;
	}
}
function manifestSeenKey(manifestPath) {
	try {
		return node_fs.default.realpathSync.native(manifestPath);
	} catch {
		return node_path.default.resolve(manifestPath);
	}
}
function buildLegacyManifestContractMigration(params) {
	const nextRaw = { ...params.raw };
	const parsedContracts = require_zod_parse.safeParseWithSchema(JsonRecordSchema, params.raw.contracts);
	const nextContracts = parsedContracts ? { ...parsedContracts } : {};
	const changeLines = [];
	for (const key of LEGACY_MANIFEST_CONTRACT_KEYS) {
		if (!(key in params.raw)) continue;
		const legacyValues = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(params.raw[key]);
		const contractValues = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(nextContracts[key]);
		if (legacyValues.length > 0 && contractValues.length === 0) {
			nextContracts[key] = legacyValues;
			changeLines.push(`- ${require_utils.shortenHomePath(params.manifestPath)}: moved ${key} to contracts.${key}`);
		} else changeLines.push(`- ${require_utils.shortenHomePath(params.manifestPath)}: removed legacy ${key} (kept contracts.${key})`);
		delete nextRaw[key];
	}
	if (changeLines.length === 0) return null;
	if (Object.keys(nextContracts).length > 0) nextRaw.contracts = nextContracts;
	else delete nextRaw.contracts;
	const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.raw.id) ?? params.manifestPath;
	return {
		manifestPath: params.manifestPath,
		pluginId,
		nextRaw,
		changeLines
	};
}
/** Collects manifest rewrites needed to move legacy top-level capability keys under contracts. */
function collectLegacyPluginManifestContractMigrations(params) {
	const seen = /* @__PURE__ */ new Set();
	const migrations = [];
	for (const root of params?.manifestRoots ?? []) {
		if (!node_fs.default.existsSync(root)) continue;
		for (const entry of node_fs.default.readdirSync(root, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const manifestPath = node_path.default.join(root, entry.name, "operator.plugin.json");
			const seenKey = manifestSeenKey(manifestPath);
			if (seen.has(seenKey)) continue;
			seen.add(seenKey);
			const raw = readManifestJson(manifestPath);
			if (!raw) continue;
			const migration = buildLegacyManifestContractMigration({
				manifestPath,
				raw
			});
			if (migration) migrations.push(migration);
		}
	}
	for (const plugin of require_manifest_registry.loadPluginManifestRegistry({
		...params?.config ? { config: params.config } : {},
		...params?.env ? { env: params.env } : {},
		...params?.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
	}).plugins) {
		const seenKey = manifestSeenKey(plugin.manifestPath);
		if (seen.has(seenKey)) continue;
		seen.add(seenKey);
		const raw = readManifestJson(plugin.manifestPath);
		if (!raw) continue;
		const migration = buildLegacyManifestContractMigration({
			manifestPath: plugin.manifestPath,
			raw
		});
		if (migration) migrations.push(migration);
	}
	return migrations.toSorted((left, right) => left.manifestPath.localeCompare(right.manifestPath));
}
function legacyPluginManifestContractMigrationToHealthFinding(migration) {
	return {
		checkId: LEGACY_PLUGIN_MANIFESTS_CHECK_ID,
		severity: "warning",
		message: `Plugin manifest ${migration.pluginId} uses legacy top-level capability keys.`,
		path: migration.manifestPath,
		target: migration.pluginId,
		requirement: "contracts-capability-keys",
		fixHint: "Run `openclaw doctor --fix` to rewrite legacy plugin manifest capability keys under contracts.*."
	};
}
function migrationToManifestJson(migration) {
	return `${JSON.stringify(migration.nextRaw, null, 2)}\n`;
}
/** Prompts and rewrites legacy plugin manifest contract fields when doctor repair is enabled. */
async function maybeRepairLegacyPluginManifestContracts(params) {
	const migrations = collectLegacyPluginManifestContractMigrations({
		...params.config ? { config: params.config } : {},
		...params.env ? { env: params.env } : {},
		...params.manifestRoots ? { manifestRoots: params.manifestRoots } : {},
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
	});
	if (migrations.length === 0) return;
	const emitNote = params.note ?? require_note.note;
	emitNote(["Legacy plugin manifest capability keys detected.", ...migrations.flatMap((migration) => migration.changeLines)].join("\n"), "Plugin manifests");
	if (!(params.prompter.shouldRepair || await params.prompter.confirmAutoFix({
		message: "Rewrite legacy plugin manifest capability keys into contracts now?",
		initialValue: true
	}))) return;
	const applied = [];
	for (const migration of migrations) try {
		node_fs.default.writeFileSync(migration.manifestPath, migrationToManifestJson(migration), "utf-8");
		applied.push(...migration.changeLines);
	} catch (error) {
		params.runtime.error(`Failed to rewrite legacy plugin manifest at ${migration.manifestPath}: ${String(error)}`);
	}
	if (applied.length > 0) emitNote(applied.join("\n"), "Doctor changes");
}
//#endregion
exports.collectLegacyPluginManifestContractMigrations = collectLegacyPluginManifestContractMigrations;
exports.legacyPluginManifestContractMigrationToHealthFinding = legacyPluginManifestContractMigrationToHealthFinding;
exports.maybeRepairLegacyPluginManifestContracts = maybeRepairLegacyPluginManifestContracts;
