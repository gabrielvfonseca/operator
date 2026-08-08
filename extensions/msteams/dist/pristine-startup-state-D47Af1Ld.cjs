const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_startup_plugin_convergence_plan = require("./startup-plugin-convergence-plan-Ceg5tQQA.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/commands/doctor/shared/pristine-startup-state.ts
const STATEFUL_CONFIG_KEYS = /* @__PURE__ */ new Set([
	"accessGroups",
	"acp",
	"approvals",
	"audio",
	"bindings",
	"broadcast",
	"channels",
	"cloudWorkers",
	"commitments",
	"cron",
	"discovery",
	"env",
	"hooks",
	"marketplaces",
	"mcp",
	"media",
	"memory",
	"messages",
	"nodeHost",
	"proxy",
	"secrets",
	"session",
	"surfaces",
	"talk",
	"tools",
	"transcripts",
	"web"
]);
function containsObjectKey(value, targetKey) {
	if (Array.isArray(value)) return value.some((entry) => containsObjectKey(entry, targetKey));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return false;
	return Object.hasOwn(value, targetKey) || Object.values(value).some((entry) => containsObjectKey(entry, targetKey));
}
function hasOnlyMigrationSafePluginEntries(config, env) {
	const plugins = config.plugins;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(plugins)) return plugins === void 0;
	if (Object.keys(plugins).some((key) => ![
		"enabled",
		"entries",
		"allow",
		"deny"
	].includes(key))) return false;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(plugins.entries)) return plugins.entries === void 0;
	return Object.entries(plugins.entries).every(([pluginId, entry]) => {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) return false;
		if (entry.enabled === false) return true;
		if (entry.config !== void 0) return false;
		const metadata = require_startup_plugin_convergence_plan.inspectBundledPluginStartupMetadata({
			pluginId,
			env
		});
		return Boolean(metadata && !metadata.hasDoctorContract);
	});
}
function configIsPristineCoreStateSafe(config) {
	if ([...STATEFUL_CONFIG_KEYS].some((key) => Object.hasOwn(config, key))) return false;
	if (containsObjectKey(config.agents, "memorySearch")) return false;
	return true;
}
/** Revalidates the authored config after startup recovery without rereading physical state. */
function planPristineStartupConfigMigrations(config, env = process.env) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config) || containsObjectKey(config, "$include")) return {
		skipAllStateMigrations: false,
		skipCoreStateMigrations: false
	};
	const skipCoreStateMigrations = configIsPristineCoreStateSafe(config);
	return {
		skipAllStateMigrations: skipCoreStateMigrations && configIsPristineStateSafe(config, env),
		skipCoreStateMigrations
	};
}
function configIsPristineStateSafe(config, env) {
	if (!configIsPristineCoreStateSafe(config)) return false;
	if (!hasOnlyMigrationSafePluginEntries(config, env)) return false;
	return !require_startup_plugin_convergence_plan.configMayRequireStartupPluginConvergence({
		config,
		env
	});
}
function stateDirHasOnlyConfig(stateDir, configPath) {
	let entries;
	try {
		entries = node_fs.default.readdirSync(stateDir, { withFileTypes: true });
	} catch (error) {
		return error.code === "ENOENT";
	}
	const resolvedConfigPath = node_path.default.resolve(configPath);
	return entries.every((entry) => node_path.default.resolve(stateDir, entry.name) === resolvedConfigPath);
}
/**
* A missing/empty state root plus migration-free bundled config has no legacy data to migrate.
* Keep ambiguity on the full migration path; this shortcut only accepts a proven new install.
*/
function canSkipPristineStartupStateMigrations(env = process.env) {
	return planPristineStartupStateMigrations(env).skipAllStateMigrations;
}
/** Separates provably absent core state from plugin-owned migration work. */
function planPristineStartupStateMigrations(env = process.env) {
	const stateDir = require_paths.resolveStateDir(env);
	const configPath = require_paths.resolveConfigPath(env, stateDir);
	if (!stateDirHasOnlyConfig(stateDir, configPath)) return {
		skipAllStateMigrations: false,
		skipCoreStateMigrations: false
	};
	const homeDir = require_home_dir.resolveEffectiveHomeDir(env);
	if (!homeDir) return {
		skipAllStateMigrations: false,
		skipCoreStateMigrations: false
	};
	if (!require_paths.resolveLegacyStateDirs(() => homeDir).every((legacyDir) => {
		if (node_path.default.resolve(legacyDir) === node_path.default.resolve(stateDir)) return false;
		return !node_fs.default.existsSync(legacyDir);
	})) return {
		skipAllStateMigrations: false,
		skipCoreStateMigrations: false
	};
	const configPlan = planPristineStartupConfigMigrations((0, _openclaw_fs_safe_json.tryReadJsonSync)(configPath), env);
	return {
		skipAllStateMigrations: configPlan.skipAllStateMigrations,
		skipCoreStateMigrations: configPlan.skipCoreStateMigrations
	};
}
//#endregion
exports.canSkipPristineStartupStateMigrations = canSkipPristineStartupStateMigrations;
exports.planPristineStartupConfigMigrations = planPristineStartupConfigMigrations;
exports.planPristineStartupStateMigrations = planPristineStartupStateMigrations;
