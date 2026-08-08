const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_setup_promotion_keys = require("./setup-promotion-keys-TEAYX4y9.cjs");
const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_bootstrap_registry = require("./bootstrap-registry-C2aRGF1a.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_config_env_vars = require("./config-env-vars-Cp6sSeHJ.cjs");
const require_setup_registry = require("./setup-registry-bM3fH6vu.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_google_api_base_url = require("./google-api-base-url-CGZJXs-z.cjs");
const require_path_utils = require("./path-utils-B5Jty5Fz.cjs");
const require_target_registry = require("./target-registry-C5xgrPiJ.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_doctor_config_analysis = require("./doctor-config-analysis-CHP-myL0.cjs");
const require_doctor_contract_registry = require("./doctor-contract-registry-jnGubuyU.cjs");
const require_legacy_config_issues = require("./legacy-config-issues-DrxN5w43.cjs");
const require_legacy_config_migrations_runtime_models = require("./legacy-config-migrations.runtime.models-0_mLlBGY.cjs");
const require_legacy_config_record_shared = require("./legacy-config-record-shared-BiSUUJgn.cjs");
const require_codex_route_model_ref = require("./codex-route-model-ref-CKO9Qire.cjs");
const require_store_migration = require("./store-migration-DHDo1ga3.cjs");
const require_config_mutation_state = require("./config-mutation-state-CfsL4joZ.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_util = require("node:util");
let _gabrielvfonseca_model_catalog_core_configured_model_refs = require("@gabrielvfonseca/model-catalog-core/configured-model-refs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/doctor/shared/channel-legacy-config-migrate.ts
function collectRelevantDoctorChannelIds(raw) {
	const channels = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.channels) ? raw.channels : null;
	if (!channels) return [];
	return Object.keys(channels).filter((channelId) => channelId !== "defaults").toSorted();
}
function resolveBundledChannelCompatibilityNormalizer(channelId) {
	const contractNormalizer = require_legacy_config_issues.loadBundledChannelDoctorContractApi(channelId)?.normalizeCompatibilityConfig;
	if (typeof contractNormalizer === "function") return contractNormalizer;
	return require_bootstrap_registry.getBootstrapChannelPlugin(channelId)?.doctor?.normalizeCompatibilityConfig;
}
function collectPluginDoctorCompatibilityIds(params) {
	const unresolvedChannelIds = new Set(params.unresolvedChannelIds);
	return [.../* @__PURE__ */ new Set([...params.unresolvedChannelIds, ...require_doctor_contract_registry.collectRelevantDoctorPluginIds(params.raw).filter((pluginId) => !unresolvedChannelIds.has(pluginId))])].toSorted();
}
/** Apply bundled and plugin channel compatibility migrations to a legacy config object. */
function applyChannelDoctorCompatibilityMigrations(cfg) {
	let nextCfg = cfg;
	const changes = [];
	const unresolvedChannelIds = [];
	for (const channelId of collectRelevantDoctorChannelIds(cfg)) {
		const normalizeCompatibilityConfig = resolveBundledChannelCompatibilityNormalizer(channelId);
		if (!normalizeCompatibilityConfig) {
			unresolvedChannelIds.push(channelId);
			continue;
		}
		const mutation = normalizeCompatibilityConfig({ cfg: nextCfg });
		if (!mutation || mutation.changes.length === 0) continue;
		nextCfg = mutation.config;
		changes.push(...mutation.changes);
	}
	const pluginIds = collectPluginDoctorCompatibilityIds({
		raw: cfg,
		unresolvedChannelIds
	});
	if (pluginIds.length > 0) {
		const compat = require_doctor_contract_registry.applyPluginDoctorCompatibilityMigrations(nextCfg, {
			config: cfg,
			pluginIds
		});
		nextCfg = compat.config;
		changes.push(...compat.changes);
	}
	return {
		next: nextCfg,
		changes
	};
}
//#endregion
//#region src/commands/doctor/shared/legacy-config-compat.ts
/** Apply all legacy doctor migrations to raw config, returning null when nothing changed. */
function applyLegacyDoctorMigrations(raw) {
	if (!raw || typeof raw !== "object") return {
		next: null,
		changes: []
	};
	const original = raw;
	const next = structuredClone(original);
	const changes = [];
	for (const migration of require_legacy_config_issues.LEGACY_CONFIG_MIGRATIONS) migration.apply(next, changes);
	const compat = applyChannelDoctorCompatibilityMigrations(next);
	changes.push(...compat.changes);
	if (changes.length === 0) return {
		next: null,
		changes: []
	};
	return {
		next: compat.next,
		changes
	};
}
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrate.ts
/** Apply legacy migrations and validate the resulting Operator config shape when possible. */
function migrateLegacyConfig(raw) {
	const { next, changes } = applyLegacyDoctorMigrations(raw);
	if (!next) return {
		config: null,
		changes: []
	};
	const validated = require_io.validateConfigObjectWithPlugins(next);
	if (!validated.ok) {
		changes.push("Migration applied; other validation issues remain — run doctor to review.");
		return {
			config: next,
			changes,
			partiallyValid: true
		};
	}
	return {
		config: validated.config,
		changes
	};
}
//#endregion
//#region src/commands/doctor/shared/legacy-config-state-migration-input.ts
function resolveStateMigrationConfigInput(params) {
	const pluginDoctorConfig = params.snapshot.sourceConfig ?? params.snapshot.config ?? params.snapshot.parsed;
	if (params.snapshot.valid) return params.snapshot.legacyIssues.length > 0 && pluginDoctorConfig !== void 0 ? {
		cfg: params.baseConfig,
		pluginDoctorConfig
	} : { cfg: params.baseConfig };
	const migrationSource = pluginDoctorConfig ?? params.snapshot.parsed;
	if (params.snapshot.legacyIssues.length === 0 || migrationSource === void 0) return null;
	const migrated = migrateLegacyConfig(migrationSource);
	if (!migrated.config) return null;
	if (migrated.partiallyValid) return { pluginDoctorConfig: pluginDoctorConfig ?? migrationSource };
	return {
		cfg: migrated.config,
		...pluginDoctorConfig ? { pluginDoctorConfig } : {}
	};
}
//#endregion
//#region src/commands/doctor-config-preflight.ts
/** Config preflight for doctor: legacy config/state migration, recovery, and snapshot loading. */
const loadDoctorStateMigrations = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./doctor-state-migrations-DQ16Flpu.cjs")));
const loadLegacyCronRepair = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./legacy-repair-DUScBn70.cjs")));
const startupPreflightTraceStartedAt = performance.now();
async function measureStartupPreflightStep(name, run) {
	if (!require_env.isTruthyEnvValue(process.env.OPERATOR_GATEWAY_STARTUP_TRACE)) return await run();
	const startedAt = performance.now();
	try {
		return await run();
	} finally {
		const durationMs = performance.now() - startedAt;
		const totalMs = performance.now() - startupPreflightTraceStartedAt;
		process.stderr.write(`[gateway] startup trace: cli.bootstrap.${name} ${durationMs.toFixed(1)}ms total=${totalMs.toFixed(1)}ms\n`);
	}
}
async function maybeMigrateLegacyConfig() {
	const changes = [];
	const home = require_utils.resolveHomeDir();
	if (!home) return changes;
	const targetDir = node_path.default.join(home, ".operator");
	const targetPath = node_path.default.join(targetDir, "operator.json");
	try {
		await node_fs_promises.default.access(targetPath);
		return changes;
	} catch {}
	const legacyCandidates = [node_path.default.join(home, ".clawdbot", "clawdbot.json")];
	let legacyPath = null;
	for (const candidate of legacyCandidates) try {
		await node_fs_promises.default.access(candidate);
		legacyPath = candidate;
		break;
	} catch {}
	if (!legacyPath) return changes;
	await node_fs_promises.default.mkdir(targetDir, { recursive: true });
	try {
		await node_fs_promises.default.copyFile(legacyPath, targetPath, node_fs_promises.default.constants.COPYFILE_EXCL);
		changes.push(`Migrated legacy config: ${legacyPath} -> ${targetPath}`);
	} catch {}
	return changes;
}
function collectDoctorLegacyIssues(snapshot) {
	if (!snapshot.exists) return [];
	const resolvedRaw = snapshot.sourceConfig ?? snapshot.config ?? {};
	return require_legacy_config_issues.findDoctorLegacyConfigIssues(resolvedRaw, snapshot.parsed ?? resolvedRaw);
}
function addDoctorLegacyIssues(snapshot) {
	const legacyIssues = collectDoctorLegacyIssues(snapshot);
	if (legacyIssues.length === 0) return snapshot;
	return {
		...snapshot,
		legacyIssues
	};
}
/** Returns true during updater-managed config rewrites where plugin validation may be stale. */
function shouldSkipPluginValidationForDoctorConfigPreflight(env = process.env) {
	return require_env.isTruthyEnvValue(env.OPERATOR_UPDATE_IN_PROGRESS);
}
function noteStateMigrationResult(result) {
	if (result.changes.length > 0) require_note.note(result.changes.map((entry) => `- ${entry}`).join("\n"), "Doctor changes");
	const notices = result.notices ?? [];
	if (notices.length > 0) require_note.note(notices.map((entry) => `- ${entry}`).join("\n"), "Doctor notices");
	if (result.warnings.length > 0) require_note.note(result.warnings.map((entry) => `- ${entry}`).join("\n"), "Doctor warnings");
}
async function runStartupUpgradeConvergence(params) {
	const { planStartupPluginConvergence } = await measureStartupPreflightStep("plugin-plan-import", () => Promise.resolve().then(() => require("./startup-plugin-convergence-plan-Ceg5tQQA.cjs")));
	const plan = await measureStartupPreflightStep("plugin-plan", () => planStartupPluginConvergence({
		config: params.cfg,
		env: params.env
	}));
	if (!plan.required) return [];
	const { runPostCorePluginConvergence } = await measureStartupPreflightStep("plugin-convergence-import", () => Promise.resolve().then(() => require("./post-core-plugin-convergence-CXt3xwwM.cjs")));
	const convergence = await measureStartupPreflightStep("plugin-convergence", () => runPostCorePluginConvergence({
		cfg: params.cfg,
		env: params.env,
		baselineInstallRecords: plan.installRecords
	}));
	if (convergence.changes.length > 0) require_note.note(convergence.changes.map((entry) => `- ${entry}`).join("\n"), "Doctor changes");
	const notices = convergence.notices ?? [];
	if (notices.length > 0) require_note.note(notices.map((notice) => `- ${notice.message} ${notice.guidance.join(" ")}`.trim()).join("\n"), "Doctor notices");
	const warnings = convergence.warnings.map((warning) => `${warning.message} ${warning.guidance.join(" ")}`.trim());
	if (warnings.length > 0) require_note.note(warnings.map((warning) => `- ${warning}`).join("\n"), "Doctor warnings");
	return warnings;
}
function formatStartupMigrationFailure(params) {
	return [
		"Operator startup migrations did not complete cleanly; refusing to report the gateway ready.",
		...[...params.warnings.map((warning) => `- ${warning}`), ...params.blockers.map((blocker) => `- ${blocker}`)],
		"Run \"openclaw doctor --fix\" against the mounted state/config, then restart the container."
	].join("\n");
}
function throwStartupMigrationGuardRejected() {
	throw new Error("Operator startup migrations were skipped because the selected config changed during startup; refusing to report the gateway ready. Retry startup so the new config can be validated.");
}
/**
* Runs early doctor config checks before the main config repair flow.
*
* It may migrate legacy state/config paths, recover corrupt target config when requested, and
* returns the best-effort config snapshot used by later doctor checks.
*/
async function runDoctorConfigPreflight(options = {}) {
	const stateMigrationsRequested = options.migrateState !== false;
	const startupCheckpoint = options.requireStartupMigrationCheckpoint === true ? await Promise.resolve().then(() => require("./startup-migration-checkpoint-Cw2amDJ3.cjs")).then((n) => n.startup_migration_checkpoint_exports) : void 0;
	let stateMigrations;
	let startupMigrationEnv = process.env;
	let shouldRecordStartupCheckpoint = false;
	let skipPristineStartupStateMigrations = options.skipPristineStartupStateMigrations === true;
	let skipPristineCoreStateMigrations = skipPristineStartupStateMigrations || options.skipPristineCoreStateMigrations === true;
	let startupMigrationLease;
	let startupMigrationHeartbeat;
	let startupMigrationHeartbeatError;
	const startupMigrationWarnings = [];
	const cronCodexRuntimePolicyTargets = [];
	const noteStartupStateMigrationResult = (result) => {
		startupMigrationWarnings.push(...result.warnings);
		noteStateMigrationResult(result);
	};
	try {
		if (startupCheckpoint && !skipPristineStartupStateMigrations) {
			const { planPristineStartupStateMigrations } = await measureStartupPreflightStep("pristine-state-plan-import", () => Promise.resolve().then(() => require("./pristine-startup-state-D47Af1Ld.cjs")));
			const pristineStatePlan = await measureStartupPreflightStep("pristine-state-plan", () => planPristineStartupStateMigrations(process.env));
			skipPristineStartupStateMigrations = pristineStatePlan.skipAllStateMigrations;
			skipPristineCoreStateMigrations ||= pristineStatePlan.skipCoreStateMigrations;
		}
		const stateMigrationsAllowed = !stateMigrationsRequested || options.beforeStateMigrations === void 0 || await options.beforeStateMigrations();
		if (startupCheckpoint && !stateMigrationsAllowed) throwStartupMigrationGuardRejected();
		if (startupCheckpoint) {
			startupMigrationEnv = require_config_env_vars.cloneEnvWithPlatformSemantics(process.env);
			shouldRecordStartupCheckpoint = startupCheckpoint.needsStartupMigrationCheckpoint({ env: startupMigrationEnv });
			startupMigrationLease = shouldRecordStartupCheckpoint ? startupCheckpoint.acquireStartupMigrationLease({ env: startupMigrationEnv }) : void 0;
			if (startupMigrationLease) {
				startupMigrationHeartbeat = setInterval(() => {
					try {
						startupMigrationLease?.heartbeat();
					} catch (error) {
						startupMigrationHeartbeatError = error;
					}
				}, 6e4);
				startupMigrationHeartbeat.unref?.();
			}
		}
		stateMigrations = stateMigrationsRequested && (!startupCheckpoint || shouldRecordStartupCheckpoint) && !skipPristineStartupStateMigrations ? await measureStartupPreflightStep("state-migrations-import", loadDoctorStateMigrations) : void 0;
		if (stateMigrations && stateMigrationsAllowed) {
			const { autoMigrateLegacyStateDir } = stateMigrations;
			noteStartupStateMigrationResult(await measureStartupPreflightStep("state-dir-migrations", () => autoMigrateLegacyStateDir({ env: process.env })));
		}
		if (options.migrateLegacyConfig !== false) {
			const legacyConfigChanges = await maybeMigrateLegacyConfig();
			if (legacyConfigChanges.length > 0) require_note.note(legacyConfigChanges.map((entry) => `- ${entry}`).join("\n"), "Doctor changes");
		}
		const readOptions = {
			...options.observe === false ? { observe: false } : {},
			skipPluginValidation: shouldSkipPluginValidationForDoctorConfigPreflight()
		};
		let snapshot = addDoctorLegacyIssues(await measureStartupPreflightStep("config-snapshot", () => require_io.readConfigFileSnapshot(readOptions)));
		if (options.repairPrefixedConfig === true && snapshot.exists && !snapshot.valid) {
			if (await require_io.recoverConfigFromJsonRootSuffix(snapshot)) {
				require_note.note("Removed non-JSON prefix from operator.json; original saved as .clobbered.*.", "Config");
				snapshot = addDoctorLegacyIssues(await require_io.readConfigFileSnapshot(readOptions));
			} else if (await require_io.recoverConfigFromLastKnownGood({
				snapshot,
				reason: "doctor-invalid-config"
			})) {
				require_note.note("Restored operator.json from last-known-good; original saved as .clobbered.*.", "Config");
				snapshot = addDoctorLegacyIssues(await require_io.readConfigFileSnapshot(readOptions));
			}
		}
		const invalidConfigNote = options.invalidConfigNote ?? "Config invalid; doctor will run with best-effort config.";
		if (invalidConfigNote && snapshot.exists && !snapshot.valid && snapshot.legacyIssues.length === 0) {
			require_note.note(invalidConfigNote, "Config");
			require_doctor_config_analysis.noteIncludeConfinementWarning(snapshot);
		}
		const warnings = snapshot.warnings ?? [];
		if (warnings.length > 0) require_note.note(require_io.formatConfigIssueLines(warnings, "-").join("\n"), "Config warnings");
		const baseConfig = snapshot.sourceConfig ?? snapshot.config ?? {};
		const stateMigrationInput = resolveStateMigrationConfigInput({
			snapshot,
			baseConfig
		});
		const freshConfigGuardAllowed = !(stateMigrations !== void 0 || shouldRecordStartupCheckpoint) || !stateMigrationsAllowed || options.beforeStateMigrations === void 0 || await options.beforeStateMigrations(snapshot);
		if (startupCheckpoint && !freshConfigGuardAllowed) throwStartupMigrationGuardRejected();
		if (stateMigrations && stateMigrationsAllowed && freshConfigGuardAllowed) {
			const { autoMigrateLegacyState, autoMigrateLegacyPluginDoctorState, autoMigrateLegacyTaskStateSidecars } = stateMigrations;
			if (stateMigrationInput) {
				const pluginDoctorOnlyConfig = stateMigrationInput.pluginDoctorConfig ?? stateMigrationInput.cfg;
				if (skipPristineCoreStateMigrations && pluginDoctorOnlyConfig) noteStartupStateMigrationResult(await autoMigrateLegacyPluginDoctorState({
					config: pluginDoctorOnlyConfig,
					env: process.env
				}));
				else if (stateMigrationInput.cfg) {
					const { collectCronCodexRuntimePolicyTargetsReadOnly, repairLegacyCronStoreWithoutPrompt } = await loadLegacyCronRepair();
					noteStartupStateMigrationResult(await repairLegacyCronStoreWithoutPrompt({
						cfg: stateMigrationInput.cfg,
						migrateCodexModelRefs: false
					}));
					if (options.repairPrefixedConfig === true) {
						const cronCodexPlan = await collectCronCodexRuntimePolicyTargetsReadOnly({ cfg: stateMigrationInput.cfg });
						cronCodexRuntimePolicyTargets.push(...cronCodexPlan.targets);
						noteStartupStateMigrationResult({
							changes: [],
							warnings: cronCodexPlan.warnings
						});
					}
					noteStartupStateMigrationResult(await autoMigrateLegacyState({
						cfg: stateMigrationInput.cfg,
						...stateMigrationInput.pluginDoctorConfig ? { pluginDoctorConfig: stateMigrationInput.pluginDoctorConfig } : {},
						env: process.env,
						recoverCorruptTargetStore: options.recoverCorruptTargetStore,
						crossStateDirImports: options.crossStateDirImports
					}));
				} else if (stateMigrationInput.pluginDoctorConfig) {
					noteStartupStateMigrationResult(await autoMigrateLegacyPluginDoctorState({
						config: stateMigrationInput.pluginDoctorConfig,
						env: process.env
					}));
					noteStartupStateMigrationResult(await autoMigrateLegacyTaskStateSidecars({
						env: process.env,
						crossStateDirImports: options.crossStateDirImports
					}));
				}
			} else noteStartupStateMigrationResult(await autoMigrateLegacyTaskStateSidecars({
				env: process.env,
				crossStateDirImports: options.crossStateDirImports
			}));
		}
		if (shouldRecordStartupCheckpoint) {
			if (startupMigrationHeartbeatError) throw startupMigrationHeartbeatError instanceof Error ? startupMigrationHeartbeatError : /* @__PURE__ */ new Error("Operator startup migration lease heartbeat failed.");
			const blockers = startupMigrationWarnings.length > 0 ? [] : snapshot.valid ? await runStartupUpgradeConvergence({
				cfg: baseConfig,
				env: process.env
			}) : ["Operator config is invalid; run \"openclaw doctor --fix\" before startup."];
			if (startupMigrationWarnings.length > 0 || blockers.length > 0) throw new Error(formatStartupMigrationFailure({
				warnings: startupMigrationWarnings,
				blockers
			}));
			startupCheckpoint?.recordSuccessfulStartupMigrations({
				env: startupMigrationEnv,
				lease: startupMigrationLease
			});
		}
		return {
			snapshot,
			baseConfig,
			...cronCodexRuntimePolicyTargets.length > 0 ? { cronCodexRuntimePolicyTargets } : {}
		};
	} finally {
		if (startupMigrationHeartbeat) clearInterval(startupMigrationHeartbeat);
		startupMigrationLease?.release();
	}
}
//#endregion
//#region src/commands/doctor/emit-notes.ts
/** Strip terminal control sequences from a potentially multi-line doctor note. */
function sanitizeDoctorNote(note) {
	return note.split("\n").map((line) => require_ansi.sanitizeForLog(line)).join("\n");
}
/** Emit grouped doctor change, info, and warning notes with sanitized content. */
function emitDoctorNotes(params) {
	for (const change of params.changeNotes ?? []) params.note(sanitizeDoctorNote(change), "Doctor changes");
	for (const info of params.infoNotes ?? []) params.note(sanitizeDoctorNote(info), "Doctor info");
	for (const warning of params.warningNotes ?? []) params.note(sanitizeDoctorNote(warning), "Doctor warnings");
}
//#endregion
//#region src/commands/doctor/finalize-config-flow.ts
/** Decide whether doctor should write the repaired candidate config or only print hints. */
async function finalizeDoctorConfigFlow(params) {
	if (!params.shouldRepair && params.pendingChanges) {
		if (await params.confirm({
			message: "Apply recommended config repairs now?",
			initialValue: true
		})) return {
			cfg: params.candidate,
			shouldWriteConfig: true
		};
		if (params.fixHints.length > 0) params.note(params.fixHints.join("\n"), "Doctor");
		return {
			cfg: params.cfg,
			shouldWriteConfig: false
		};
	}
	if (params.shouldRepair && params.pendingChanges) return {
		cfg: params.cfg,
		shouldWriteConfig: true
	};
	return {
		cfg: params.cfg,
		shouldWriteConfig: false
	};
}
//#endregion
//#region src/commands/doctor-auth-profile-config.ts
/** Protects active auth profile metadata while doctor repairs broader config state. */
const AUTH_PROFILE_MODES = /* @__PURE__ */ new Set([
	"api_key",
	"aws-sdk",
	"oauth",
	"token"
]);
function normalizeProviderId$1(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
}
function normalizeProfileId(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? null;
}
function normalizeMode(value) {
	return typeof value === "string" && AUTH_PROFILE_MODES.has(value) ? value : null;
}
function extractProviderFromModelRef(value) {
	const { model } = require_model_ref_profile.splitTrailingAuthProfile(value);
	const slash = model.indexOf("/");
	if (slash <= 0) return null;
	return normalizeProviderId$1(model.slice(0, slash)) || null;
}
function extractProviderFromProfileId(profileId) {
	const colon = profileId.indexOf(":");
	if (colon <= 0) return null;
	return normalizeProviderId$1(profileId.slice(0, colon)) || null;
}
function collectActiveAuthHints(config) {
	const activeProviders = /* @__PURE__ */ new Set();
	const explicitProfileIds = /* @__PURE__ */ new Set();
	const explicitProfileProviders = /* @__PURE__ */ new Map();
	const models = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config.models) ? config.models : {};
	const providers = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(models.providers) ? models.providers : {};
	for (const providerId of Object.keys(providers)) {
		const normalized = normalizeProviderId$1(providerId);
		if (normalized) activeProviders.add(normalized);
	}
	for (const { value } of (0, _gabrielvfonseca_model_catalog_core_configured_model_refs.collectConfiguredModelRefs)(config)) {
		const { profile } = require_model_ref_profile.splitTrailingAuthProfile(value);
		const provider = extractProviderFromModelRef(value);
		if (profile) {
			explicitProfileIds.add(profile);
			if (provider) {
				const providersLocal = explicitProfileProviders.get(profile) ?? /* @__PURE__ */ new Set();
				providersLocal.add(provider);
				explicitProfileProviders.set(profile, providersLocal);
			}
		}
		if (provider) activeProviders.add(provider);
	}
	const auth = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config.auth) ? config.auth : {};
	const order = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(auth.order) ? auth.order : {};
	for (const [providerId, profileIds] of Object.entries(order)) {
		const provider = normalizeProviderId$1(providerId);
		if (!provider || !activeProviders.has(provider) || !Array.isArray(profileIds)) continue;
		for (const profileId of profileIds) {
			const normalized = normalizeProfileId(profileId);
			if (normalized) explicitProfileIds.add(normalized);
		}
	}
	return {
		activeProviders,
		explicitProfileIds,
		explicitProfileProviders
	};
}
function isValidProfileMetadata(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return false;
	return normalizeProviderId$1(value.provider) !== "" && normalizeMode(value.mode) !== null;
}
function buildProfileMetadata(params) {
	const before = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.before) ? params.before : {};
	const after = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.after) ? params.after : {};
	const provider = normalizeProviderId$1(after.provider) || normalizeProviderId$1(before.provider) || extractProviderFromProfileId(params.profileId) || normalizeProviderId$1(params.providerHint);
	if (!provider) return null;
	const repaired = {
		provider,
		mode: normalizeMode(after.mode) ?? normalizeMode(before.mode) ?? "api_key"
	};
	const email = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(after.email) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(before.email);
	const displayName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(after.displayName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(before.displayName);
	if (email) repaired.email = email;
	if (displayName) repaired.displayName = displayName;
	return repaired;
}
function ensureAuthProfiles(config) {
	const root = config;
	const auth = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(root.auth) ? root.auth : {};
	if (root.auth !== auth) root.auth = auth;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(auth.profiles)) auth.profiles = {};
	return auth.profiles;
}
/**
* Restores valid metadata for auth profiles still referenced by active model config.
*
* Doctor can rebuild or prune auth config; this guard keeps active profiles usable when their
* provider/mode metadata can be inferred from the before/after config or profile id.
*/
function protectActiveAuthProfileConfig(params) {
	const { activeProviders, explicitProfileIds, explicitProfileProviders } = collectActiveAuthHints(params.before);
	const beforeAuth = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.before.auth) ? params.before.auth : {};
	const beforeProfiles = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(beforeAuth.profiles) ? beforeAuth.profiles : {};
	if (Object.keys(beforeProfiles).length === 0) return {
		config: params.after,
		repairs: [],
		warnings: []
	};
	const config = structuredClone(params.after);
	const afterAuth = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config.auth) ? config.auth : {};
	const afterProfiles = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(afterAuth.profiles) ? afterAuth.profiles : {};
	const repairs = [];
	const warnings = [];
	for (const [profileId, beforeProfile] of Object.entries(beforeProfiles)) {
		const afterProfile = afterProfiles[profileId];
		const afterProfileRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(afterProfile) ? afterProfile : null;
		const beforeProfileRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(beforeProfile) ? beforeProfile : null;
		if (isValidProfileMetadata(afterProfile)) continue;
		const provider = normalizeProviderId$1(afterProfileRecord?.provider) || normalizeProviderId$1(beforeProfileRecord?.provider) || extractProviderFromProfileId(profileId);
		const protectsActiveProvider = provider !== null && activeProviders.has(provider);
		const protectsExplicitProfile = explicitProfileIds.has(profileId);
		if (!protectsActiveProvider && !protectsExplicitProfile) continue;
		const repaired = buildProfileMetadata({
			profileId,
			before: beforeProfile,
			after: afterProfile,
			providerHint: explicitProfileProviders.get(profileId)?.size === 1 ? [...explicitProfileProviders.get(profileId) ?? []][0] : void 0
		});
		if (!repaired) {
			warnings.push(`auth.profiles.${profileId}: active auth profile metadata could not be inferred; repair manually before running doctor --fix.`);
			continue;
		}
		const profiles = ensureAuthProfiles(config);
		profiles[profileId] = repaired;
		repairs.push(`Repaired auth.profiles.${profileId} metadata for active ${repaired.provider} auth.`);
	}
	return {
		config,
		repairs,
		warnings
	};
}
//#endregion
//#region src/commands/doctor/shared/config-flow-steps.ts
/** Apply legacy config migrations and update preview/fix state for doctor config flow. */
function applyLegacyCompatibilityStep(params) {
	if (params.snapshot.legacyIssues.length === 0) return {
		state: params.state,
		issueLines: [],
		changeLines: []
	};
	const issueLines = require_io.formatConfigIssueLines(params.snapshot.legacyIssues, "-");
	const { config: migrated, changes, partiallyValid } = migrateLegacyConfig(params.snapshot.parsed);
	if (!migrated) return {
		state: {
			...params.state,
			pendingChanges: params.state.pendingChanges || params.snapshot.legacyIssues.length > 0,
			fixHints: params.shouldRepair ? params.state.fixHints : [...params.state.fixHints, `Run "${params.doctorFixCommand}" to migrate legacy config keys.`]
		},
		issueLines,
		changeLines: changes
	};
	return {
		state: {
			cfg: migrated,
			candidate: migrated,
			pendingChanges: params.state.pendingChanges || params.snapshot.legacyIssues.length > 0,
			fixHints: params.shouldRepair ? params.state.fixHints : [...params.state.fixHints, `Run "${params.doctorFixCommand}" to ${partiallyValid ? "finish fixing" : "migrate"} legacy config keys.`]
		},
		issueLines,
		changeLines: changes,
		partiallyValid: partiallyValid === true ? true : void 0
	};
}
/** Strip unknown config keys while preserving active auth profile settings. */
function applyUnknownConfigKeyStep(params) {
	const unknown = require_doctor_config_analysis.stripUnknownConfigKeys(params.state.candidate);
	if (unknown.removed.length === 0) return {
		state: params.state,
		removed: [],
		repairs: [],
		warnings: []
	};
	const protectedAuth = protectActiveAuthProfileConfig({
		before: params.state.candidate,
		after: unknown.config
	});
	return {
		state: {
			cfg: params.shouldRepair ? protectedAuth.config : params.state.cfg,
			candidate: protectedAuth.config,
			pendingChanges: true,
			fixHints: params.shouldRepair ? params.state.fixHints : [...params.state.fixHints, `Run "${params.doctorFixCommand}" to remove these keys.`]
		},
		removed: unknown.removed,
		repairs: protectedAuth.repairs,
		warnings: protectedAuth.warnings
	};
}
//#endregion
//#region src/secrets/legacy-secretref-env-marker.ts
function isLegacySecretRefEnvMarker(value) {
	return typeof value === "string" && value.trim().startsWith("secretref-env:");
}
function toCandidate(target, defaults) {
	if (!isLegacySecretRefEnvMarker(target.value)) return null;
	return {
		path: target.path,
		pathSegments: target.pathSegments,
		value: target.value.trim(),
		ref: require_types_secrets.parseLegacySecretRefEnvMarker(target.value, defaults?.env)
	};
}
/**
* Finds legacy env marker strings on registered secret targets without mutating config.
*/
function collectLegacySecretRefEnvMarkerCandidates(config) {
	const defaults = config.secrets?.defaults;
	return require_target_registry.discoverConfigSecretTargets(config).map((target) => toCandidate(target, defaults)).filter((candidate) => candidate !== null);
}
/**
* Converts parseable legacy env marker strings into structured env SecretRef objects.
*/
function migrateLegacySecretRefEnvMarkers(config) {
	const candidates = collectLegacySecretRefEnvMarkerCandidates(config).filter((candidate) => candidate.ref !== null);
	if (candidates.length === 0) return {
		config,
		changes: []
	};
	const next = structuredClone(config);
	const changes = [];
	for (const candidate of candidates) {
		const ref = candidate.ref;
		if (!ref) continue;
		if (require_path_utils.setPathExistingStrict(next, candidate.pathSegments, ref)) changes.push(`Moved ${candidate.path} ${require_types_secrets.LEGACY_SECRETREF_ENV_MARKER_PREFIX}${ref.id} marker → structured env SecretRef.`);
	}
	return {
		config: next,
		changes
	};
}
//#endregion
//#region src/commands/doctor/shared/legacy-config-binding-repair.ts
function pruneBindingsForMissingAgents(cfg, changes) {
	const agents = cfg.agents?.list;
	const bindings = cfg.bindings;
	if (!Array.isArray(agents) || agents.length === 0 || !Array.isArray(bindings)) return cfg;
	const validAgents = agents.filter((agent) => {
		return agent !== null && typeof agent === "object" && typeof agent.id === "string";
	});
	if (validAgents.length !== agents.length) return cfg;
	const agentIds = new Set(validAgents.map((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id)));
	const nextBindings = bindings.filter((binding) => {
		const agentId = binding && typeof binding === "object" ? binding.agentId : void 0;
		return typeof agentId !== "string" || agentIds.has((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId));
	});
	const removed = bindings.length - nextBindings.length;
	if (removed === 0) return cfg;
	changes.push(`Removed ${removed} binding${removed === 1 ? "" : "s"} that referenced missing agents.list ids.`);
	return {
		...cfg,
		...nextBindings.length > 0 ? { bindings: nextBindings } : { bindings: void 0 }
	};
}
//#endregion
//#region src/channels/plugins/setup-promotion-helpers.ts
/**
* Channel setup promotion helpers.
*
* Moves legacy single-account channel config into account-scoped config records.
*/
function asPromotionSurface(setup) {
	return setup && typeof setup === "object" ? setup : null;
}
function getLoadedChannelSetupPromotionSurface(channelKey) {
	return asPromotionSurface(require_registry.getLoadedChannelPlugin(channelKey)?.setup);
}
function getBundledChannelSetupPromotionSurface(channelKey) {
	if (!require_bundled.hasBundledChannelPackageSetupFeature(channelKey, "configPromotion")) return null;
	return asPromotionSurface(require_bundled.getBundledChannelPlugin(channelKey)?.setup);
}
/**
* Resolves all root-level keys eligible for single-account promotion.
*/
function resolveSingleAccountKeysToMove(params) {
	const { entries, hasNamedAccounts } = require_setup_promotion_keys.collectSingleAccountPromotionEntries(params.channel);
	if (entries.length === 0) return [];
	let loadedSetupSurface;
	const resolveLoadedSetupSurface = () => {
		loadedSetupSurface ??= getLoadedChannelSetupPromotionSurface(params.channelKey);
		return loadedSetupSurface;
	};
	let bundledSetupSurface;
	const resolveBundledSetupSurface = () => {
		bundledSetupSurface ??= getBundledChannelSetupPromotionSurface(params.channelKey);
		return bundledSetupSurface;
	};
	const keysToMove = entries.filter((key) => {
		if (require_setup_promotion_keys.isCommonSingleAccountPromotionKey(key)) return true;
		return Boolean(resolveLoadedSetupSurface()?.singleAccountKeysToMove?.includes(key) || resolveBundledSetupSurface()?.singleAccountKeysToMove?.includes(key));
	});
	if (!hasNamedAccounts || keysToMove.length === 0) return keysToMove;
	const namedAccountPromotionKeys = resolveLoadedSetupSurface()?.namedAccountPromotionKeys ?? resolveBundledSetupSurface()?.namedAccountPromotionKeys;
	if (!namedAccountPromotionKeys) return keysToMove;
	return keysToMove.filter((key) => namedAccountPromotionKeys.includes(key));
}
//#endregion
//#region src/commands/doctor/shared/legacy-talk-config-normalizer.ts
function buildLegacyTalkProviderCompat(talk) {
	const compat = {};
	for (const key of [
		"voiceId",
		"voiceAliases",
		"modelId",
		"outputFormat",
		"apiKey"
	]) if (talk[key] !== void 0) compat[key] = talk[key];
	return Object.keys(compat).length > 0 ? compat : void 0;
}
function buildLegacyRealtimeTalkCompat(talk, normalizedTalk) {
	if (talk.realtime !== void 0) return;
	const compat = {};
	for (const key of [
		"model",
		"voice",
		"mode",
		"transport",
		"brain"
	]) if (talk[key] !== void 0) compat[key] = talk[key];
	if (Object.keys(compat).length === 0) return;
	if (normalizedTalk.provider !== void 0) compat.provider = normalizedTalk.provider;
	if (normalizedTalk.providers !== void 0) compat.providers = normalizedTalk.providers;
	return require_io.normalizeTalkSection({ realtime: compat })?.realtime;
}
function removeDerivedRealtimeSpeakerVoice(rawTalk, normalizedTalk) {
	const rawRealtime = rawTalk.realtime;
	const normalizedRealtime = normalizedTalk.realtime;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawRealtime) || !normalizedRealtime || rawRealtime.speakerVoice !== void 0 || normalizedRealtime.speakerVoice === void 0 || normalizedRealtime.speakerVoice !== normalizedRealtime.voice) return;
	delete normalizedRealtime.speakerVoice;
}
/** Normalize legacy Talk provider/realtime fields into current talk.providers and talk.realtime. */
function normalizeLegacyTalkConfig(cfg, changes) {
	const rawTalk = cfg.talk;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawTalk)) return cfg;
	const normalizedTalk = require_io.normalizeTalkSection(rawTalk) ?? {};
	const legacyProviderCompat = buildLegacyTalkProviderCompat(rawTalk);
	if (legacyProviderCompat) normalizedTalk.providers = {
		...normalizedTalk.providers,
		elevenlabs: {
			...legacyProviderCompat,
			...normalizedTalk.providers?.elevenlabs
		}
	};
	const legacyRealtimeCompat = buildLegacyRealtimeTalkCompat(rawTalk, normalizedTalk);
	if (legacyRealtimeCompat) normalizedTalk.realtime = {
		...legacyRealtimeCompat,
		...normalizedTalk.realtime
	};
	removeDerivedRealtimeSpeakerVoice(rawTalk, normalizedTalk);
	if (Object.keys(normalizedTalk).length === 0 || (0, node_util.isDeepStrictEqual)(normalizedTalk, rawTalk)) return cfg;
	changes.push("Normalized talk.provider/providers shape (trimmed provider ids and merged missing compatibility fields).");
	if (legacyRealtimeCompat) changes.push("Moved legacy realtime Talk provider/model fields into talk.realtime.");
	return {
		...cfg,
		talk: normalizedTalk
	};
}
//#endregion
//#region src/commands/doctor/shared/legacy-config-core-normalizers.ts
const INHERITED_ACCOUNT_POLICY_KEYS = [
	"dmPolicy",
	"allowFrom",
	"groupPolicy",
	"groupAllowFrom"
];
/** Remove deprecated command config keys that no runtime reads anymore. */
function normalizeLegacyCommandsConfig(cfg, changes) {
	const rawCommands = cfg.commands;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawCommands) || !("modelsWrite" in rawCommands)) return cfg;
	const commands = { ...rawCommands };
	delete commands.modelsWrite;
	changes.push("Removed deprecated commands.modelsWrite (/models add is deprecated).");
	return {
		...cfg,
		commands
	};
}
/** Migrate legacy browser/Chrome relay config to current browser profile settings. */
function normalizeLegacyBrowserConfig(cfg, changes) {
	const rawBrowser = cfg.browser;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawBrowser)) return cfg;
	const browser = structuredClone(rawBrowser);
	let browserChanged = false;
	if ("relayBindHost" in browser) {
		delete browser.relayBindHost;
		browserChanged = true;
		changes.push("Removed browser.relayBindHost (legacy Chrome extension relay setting; the extension relay binds loopback on the profile cdpPort).");
	}
	const rawProfiles = browser.profiles;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawProfiles)) {
		const profiles = { ...rawProfiles };
		let profilesChanged = false;
		for (const [profileName, rawProfile] of Object.entries(rawProfiles)) {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawProfile)) continue;
			if (((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawProfile.driver) ?? "") !== "extension" || !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawProfile.cdpUrl)) continue;
			const nextProfile = { ...rawProfile };
			delete nextProfile.cdpUrl;
			profiles[profileName] = nextProfile;
			profilesChanged = true;
			changes.push(`Removed browser.profiles.${profileName}.cdpUrl (extension driver profiles own their relay endpoint).`);
		}
		if (profilesChanged) {
			browser.profiles = profiles;
			browserChanged = true;
		}
	}
	const rawSsrFPolicy = browser.ssrfPolicy;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawSsrFPolicy) && "allowPrivateNetwork" in rawSsrFPolicy) {
		const legacyAllowPrivateNetwork = rawSsrFPolicy.allowPrivateNetwork;
		const currentDangerousAllowPrivateNetwork = rawSsrFPolicy.dangerouslyAllowPrivateNetwork;
		let resolvedDangerousAllowPrivateNetwork = currentDangerousAllowPrivateNetwork;
		if (typeof legacyAllowPrivateNetwork === "boolean" || typeof currentDangerousAllowPrivateNetwork === "boolean") resolvedDangerousAllowPrivateNetwork = legacyAllowPrivateNetwork === true || currentDangerousAllowPrivateNetwork === true;
		else if (currentDangerousAllowPrivateNetwork === void 0) resolvedDangerousAllowPrivateNetwork = legacyAllowPrivateNetwork;
		const nextSsrFPolicy = { ...rawSsrFPolicy };
		delete nextSsrFPolicy.allowPrivateNetwork;
		if (resolvedDangerousAllowPrivateNetwork !== void 0) nextSsrFPolicy.dangerouslyAllowPrivateNetwork = resolvedDangerousAllowPrivateNetwork;
		browser.ssrfPolicy = nextSsrFPolicy;
		browserChanged = true;
		changes.push(`Moved browser.ssrfPolicy.allowPrivateNetwork → browser.ssrfPolicy.dangerouslyAllowPrivateNetwork (${String(resolvedDangerousAllowPrivateNetwork)}).`);
	}
	if (!browserChanged) return cfg;
	return {
		...cfg,
		browser
	};
}
/** Move single-account channel fields into accounts.default when account maps exist. */
function seedMissingDefaultAccountsFromSingleAccountBase(cfg, changes) {
	const channels = cfg.channels;
	if (!channels) return cfg;
	let channelsChanged = false;
	const nextChannels = { ...channels };
	for (const [channelId, rawChannel] of Object.entries(channels)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawChannel)) continue;
		const rawAccounts = rawChannel.accounts;
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawAccounts)) continue;
		const accountKeys = Object.keys(rawAccounts);
		if (accountKeys.length === 0) continue;
		if (accountKeys.some((key) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(key) === "default")) continue;
		const keysToMove = resolveSingleAccountKeysToMove({
			channelKey: channelId,
			channel: rawChannel
		});
		if (keysToMove.length === 0) continue;
		const defaultAccount = {};
		for (const key of keysToMove) {
			const value = rawChannel[key];
			defaultAccount[key] = value && typeof value === "object" ? structuredClone(value) : value;
		}
		const nextChannel = { ...rawChannel };
		for (const key of keysToMove) delete nextChannel[key];
		const inheritedPolicyKeys = INHERITED_ACCOUNT_POLICY_KEYS.filter((key) => keysToMove.includes(key));
		const nextAccounts = {
			...rawAccounts,
			[require_account_id.DEFAULT_ACCOUNT_ID]: defaultAccount
		};
		if (inheritedPolicyKeys.length > 0) for (const [accountId, rawAccount] of Object.entries(rawAccounts)) {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawAccount)) continue;
			const nextAccount = { ...rawAccount };
			let accountChanged = false;
			for (const key of inheritedPolicyKeys) {
				if (require_legacy_config_record_shared.hasOwnKey(nextAccount, key)) continue;
				const value = rawChannel[key];
				nextAccount[key] = value && typeof value === "object" ? structuredClone(value) : value;
				accountChanged = true;
			}
			if (accountChanged) nextAccounts[accountId] = nextAccount;
		}
		nextChannel.accounts = nextAccounts;
		nextChannels[channelId] = nextChannel;
		channelsChanged = true;
		changes.push(`Moved channels.${channelId} single-account top-level values into channels.${channelId}.accounts.default.`);
	}
	if (!channelsChanged) return cfg;
	return {
		...cfg,
		channels: nextChannels
	};
}
const LEGACY_CODEX_CLI_RUNTIME_ID = "codex-cli";
const CODEX_APP_SERVER_RUNTIME_ID = "codex";
function resolveLegacyWholeAgentRuntimePolicy(raw) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return;
	const runtime = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw.id);
	if (!runtime || runtime === "auto" || runtime === "@gabrielvfonseca/operator") return;
	const alias = require_legacy_config_issues.listLegacyRuntimeModelProviderAliases().find((entry) => entry.cli && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.runtime) === runtime);
	return alias ? {
		provider: alias.provider,
		runtime: alias.runtime,
		requiresRuntimePolicy: alias.requiresRuntimePolicy
	} : void 0;
}
function migratedRuntimeRequiresPolicy(legacyProvider) {
	return require_legacy_config_issues.legacyRuntimeModelAliasRequiresRuntimePolicy(legacyProvider);
}
function mergeModelEntry(legacyEntry, currentEntry) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(legacyEntry) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(currentEntry)) return currentEntry ?? legacyEntry;
	return {
		...legacyEntry,
		...currentEntry
	};
}
function normalizeLegacyCodexCliAgentRuntimePolicy(raw) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return {
		value: raw,
		changed: false
	};
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw.id) !== LEGACY_CODEX_CLI_RUNTIME_ID) return {
		value: raw,
		changed: false
	};
	return {
		value: {
			...raw,
			id: CODEX_APP_SERVER_RUNTIME_ID
		},
		changed: true
	};
}
function normalizeLegacyRuntimeAgentModelConfig(raw, blockedModelIdentities) {
	if (typeof raw === "string") {
		const migrated = require_codex_route_model_ref.isBlockedLegacyCodexModelRef({
			modelRef: raw,
			blockedModelIdentities
		}) ? null : require_legacy_config_issues.migrateLegacyRuntimeModelRef(raw);
		return migrated ? {
			value: migrated.ref,
			changed: true,
			selectedRuntime: migrated.runtime,
			selectedRuntimeRequiresPolicy: migratedRuntimeRequiresPolicy(migrated.legacyProvider),
			selectedRefs: [{
				ref: migrated.ref,
				runtime: migrated.runtime,
				requiresRuntimePolicy: migratedRuntimeRequiresPolicy(migrated.legacyProvider)
			}]
		} : {
			value: raw,
			changed: false,
			selectedRuntimeRequiresPolicy: false,
			selectedRefs: []
		};
	}
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return {
		value: raw,
		changed: false,
		selectedRuntimeRequiresPolicy: false,
		selectedRefs: []
	};
	const migratedPrimary = typeof raw.primary === "string" && !require_codex_route_model_ref.isBlockedLegacyCodexModelRef({
		modelRef: raw.primary,
		blockedModelIdentities
	}) ? require_legacy_config_issues.migrateLegacyRuntimeModelRef(raw.primary) : null;
	let changed = false;
	const next = { ...raw };
	const selectedRefs = [];
	let selectedRuntime = migratedPrimary?.runtime;
	let selectedRuntimeRequiresPolicy = migratedPrimary !== null && migratedRuntimeRequiresPolicy(migratedPrimary.legacyProvider);
	if (migratedPrimary) {
		next.primary = migratedPrimary.ref;
		selectedRefs.push({
			ref: migratedPrimary.ref,
			runtime: migratedPrimary.runtime,
			requiresRuntimePolicy: migratedRuntimeRequiresPolicy(migratedPrimary.legacyProvider)
		});
		changed = true;
	}
	if (Array.isArray(raw.fallbacks)) next.fallbacks = raw.fallbacks.map((fallback) => {
		if (typeof fallback !== "string") return fallback;
		const migratedFallback = require_codex_route_model_ref.isBlockedLegacyCodexModelRef({
			modelRef: fallback,
			blockedModelIdentities
		}) ? null : require_legacy_config_issues.migrateLegacyRuntimeModelRef(fallback);
		if (migratedFallback && (migratedFallback.runtime === selectedRuntime || migratedFallback.legacyProvider === LEGACY_CODEX_CLI_RUNTIME_ID)) {
			selectedRuntime ??= migratedFallback.runtime;
			selectedRuntimeRequiresPolicy ||= migratedRuntimeRequiresPolicy(migratedFallback.legacyProvider);
			selectedRefs.push({
				ref: migratedFallback.ref,
				runtime: migratedFallback.runtime,
				requiresRuntimePolicy: migratedRuntimeRequiresPolicy(migratedFallback.legacyProvider)
			});
			changed = true;
			return migratedFallback.ref;
		}
		return fallback;
	});
	if (!changed) return {
		value: raw,
		changed: false,
		selectedRuntimeRequiresPolicy: false,
		selectedRefs: []
	};
	return {
		value: next,
		changed: true,
		selectedRuntime,
		selectedRuntimeRequiresPolicy,
		selectedRefs
	};
}
function runtimeNeedsExplicitModelPolicy(runtime) {
	return Boolean(runtime && runtime !== "codex");
}
function modelEntryWithRuntimePolicy(entry, runtime) {
	const base = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) ? { ...entry } : {};
	const currentRuntime = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(base.agentRuntime) ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(base.agentRuntime.id) : void 0;
	if (!currentRuntime || currentRuntime === "auto") base.agentRuntime = {
		...(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(base.agentRuntime) ? base.agentRuntime : {},
		id: runtime
	};
	return base;
}
function mergeModelEntryWithRuntimePolicy(legacyEntry, currentEntry, runtime, requiresRuntimePolicy = runtimeNeedsExplicitModelPolicy(runtime)) {
	const merged = mergeModelEntry(legacyEntry, currentEntry);
	return runtime && requiresRuntimePolicy ? modelEntryWithRuntimePolicy(merged, runtime) : merged;
}
function normalizeLegacyRuntimeAllowlistModels(rawModels, selectedRuntime, selectedRuntimeRequiresPolicy, blockedModelIdentities) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModels)) return {
		value: rawModels,
		changed: false
	};
	let changed = false;
	const next = {};
	const legacyEntries = [];
	for (const [rawKey, entry] of Object.entries(rawModels)) {
		const migrated = require_codex_route_model_ref.isBlockedLegacyCodexModelRef({
			modelRef: rawKey,
			blockedModelIdentities
		}) ? null : require_legacy_config_issues.migrateLegacyRuntimeModelRef(rawKey);
		if (migrated && (migrated.runtime === selectedRuntime || migrated.legacyProvider === LEGACY_CODEX_CLI_RUNTIME_ID)) {
			changed = true;
			next[rawKey] = mergeModelEntry(entry, next[rawKey]);
			legacyEntries.push({
				migratedKey: migrated.ref,
				entry,
				runtime: migrated.runtime,
				requiresRuntimePolicy: migratedRuntimeRequiresPolicy(migrated.legacyProvider)
			});
			continue;
		}
		next[rawKey] = mergeModelEntry(entry, next[rawKey]);
	}
	for (const { migratedKey, entry, runtime, requiresRuntimePolicy } of legacyEntries) next[migratedKey] = mergeModelEntryWithRuntimePolicy(entry, next[migratedKey], runtime, requiresRuntimePolicy || runtime === selectedRuntime && selectedRuntimeRequiresPolicy);
	return {
		value: next,
		changed
	};
}
function ensureSelectedModelRuntimePolicies(rawModels, selectedRefs) {
	if (selectedRefs.length === 0) return {
		value: rawModels,
		changed: false
	};
	const next = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModels) ? { ...rawModels } : {};
	let changed = false;
	for (const { ref, runtime, requiresRuntimePolicy } of selectedRefs) {
		if (!requiresRuntimePolicy) continue;
		const current = next[ref];
		const updated = modelEntryWithRuntimePolicy(current, runtime);
		if (JSON.stringify(updated) !== JSON.stringify(current ?? {})) {
			next[ref] = updated;
			changed = true;
		}
	}
	return {
		value: next,
		changed
	};
}
function selectedCanonicalModelRefsForRuntimePolicy(rawModel, provider, runtime, requiresRuntimePolicy) {
	const refs = [];
	const addRef = (rawRef) => {
		if (typeof rawRef !== "string") return;
		const trimmed = rawRef.trim();
		const slash = trimmed.indexOf("/");
		if (slash <= 0 || slash >= trimmed.length - 1) return;
		if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(trimmed.slice(0, slash)) !== (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider)) return;
		refs.push({
			ref: trimmed,
			runtime,
			requiresRuntimePolicy
		});
	};
	if (typeof rawModel === "string") {
		addRef(rawModel);
		return refs;
	}
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModel)) return refs;
	addRef(rawModel.primary);
	if (Array.isArray(rawModel.fallbacks)) for (const fallback of rawModel.fallbacks) addRef(fallback);
	return refs;
}
function normalizeLegacyCodexCliRuntimePinsInModels(rawModels, path, changes) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModels)) return {
		value: rawModels,
		changed: false
	};
	let changed = false;
	const next = { ...rawModels };
	for (const [modelRef, rawEntry] of Object.entries(rawModels)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawEntry)) continue;
		const runtime = normalizeLegacyCodexCliAgentRuntimePolicy(rawEntry.agentRuntime);
		if (!runtime.changed) continue;
		next[modelRef] = {
			...rawEntry,
			agentRuntime: runtime.value
		};
		changed = true;
		changes.push(`Moved ${path}.${require_ansi.sanitizeForLog(modelRef)} agentRuntime.id from codex-cli to codex.`);
	}
	return {
		value: next,
		changed
	};
}
function normalizeLegacyRuntimeAgentContainer(raw, path, changes, blockedModelIdentities) {
	let changed = false;
	const next = { ...raw };
	const legacyWholeAgentRuntime = resolveLegacyWholeAgentRuntimePolicy(raw.agentRuntime);
	const model = normalizeLegacyRuntimeAgentModelConfig(raw.model, blockedModelIdentities);
	if (model.changed) {
		next.model = model.value;
		changed = true;
		const runtimeSuffix = model.selectedRuntime ? ` and selected ${model.selectedRuntime} runtime` : "";
		changes.push(`Moved ${path}.model legacy runtime primary refs to canonical provider refs${runtimeSuffix}.`);
	}
	const models = normalizeLegacyRuntimeAllowlistModels(raw.models, model.selectedRuntime, model.selectedRuntimeRequiresPolicy, blockedModelIdentities);
	if (models.changed) {
		next.models = models.value;
		changed = true;
		changes.push(`Moved ${path}.models legacy runtime keys to canonical provider keys.`);
	}
	if (model.selectedRuntime) {
		const modelRuntimes = ensureSelectedModelRuntimePolicies(next.models, model.selectedRefs);
		if (modelRuntimes.changed) {
			next.models = modelRuntimes.value;
			changed = true;
			changes.push(`Selected ${model.selectedRuntime} runtime for ${path}.models entries.`);
		}
	}
	if (legacyWholeAgentRuntime) {
		const selectedRefs = selectedCanonicalModelRefsForRuntimePolicy(next.model ?? raw.model, legacyWholeAgentRuntime.provider, legacyWholeAgentRuntime.runtime, legacyWholeAgentRuntime.requiresRuntimePolicy);
		const modelRuntimes = ensureSelectedModelRuntimePolicies(next.models, selectedRefs);
		if (modelRuntimes.changed) {
			next.models = modelRuntimes.value;
			changed = true;
			changes.push(`Moved ${path}.agentRuntime.id ${legacyWholeAgentRuntime.runtime} to matching ${legacyWholeAgentRuntime.provider} model runtime policy.`);
		}
	}
	const codexCliRuntimePins = normalizeLegacyCodexCliRuntimePinsInModels(next.models, `${path}.models`, changes);
	if (codexCliRuntimePins.changed) {
		next.models = codexCliRuntimePins.value;
		changed = true;
	}
	return {
		value: next,
		changed
	};
}
function normalizeLegacyCodexCliProviderRuntimePins(cfg, changes) {
	const rawModels = cfg.models;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModels) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModels.providers)) return {
		config: cfg,
		changed: false
	};
	let changed = false;
	const nextProviders = { ...rawModels.providers };
	for (const [providerId, rawProvider] of Object.entries(rawModels.providers)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawProvider)) continue;
		let providerChanged = false;
		const nextProvider = { ...rawProvider };
		const providerRuntime = normalizeLegacyCodexCliAgentRuntimePolicy(rawProvider.agentRuntime);
		if (providerRuntime.changed) {
			nextProvider.agentRuntime = providerRuntime.value;
			providerChanged = true;
			changes.push(`Moved models.providers.${require_ansi.sanitizeForLog(providerId)} agentRuntime.id from codex-cli to codex.`);
		}
		if (Array.isArray(rawProvider.models)) {
			const nextProviderModels = rawProvider.models.map((entry, index) => {
				if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) return entry;
				const runtime = normalizeLegacyCodexCliAgentRuntimePolicy(entry.agentRuntime);
				if (!runtime.changed) return entry;
				providerChanged = true;
				const modelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.id) ?? `[${index}]`;
				changes.push(`Moved models.providers.${require_ansi.sanitizeForLog(providerId)}.models.${require_ansi.sanitizeForLog(modelId)} agentRuntime.id from codex-cli to codex.`);
				return Object.assign({}, entry, { agentRuntime: runtime.value });
			});
			if (providerChanged) nextProvider.models = nextProviderModels;
		}
		if (providerChanged) {
			nextProviders[providerId] = nextProvider;
			changed = true;
		}
	}
	return changed ? {
		config: {
			...cfg,
			models: {
				...rawModels,
				providers: nextProviders
			}
		},
		changed: true
	} : {
		config: cfg,
		changed: false
	};
}
/** Move legacy runtime-tagged model/provider refs onto current agentRuntime policy fields. */
function normalizeLegacyRuntimeModelRefs(cfg, changes, blockedModelIdentities) {
	const cfgWithProviders = normalizeLegacyCodexCliProviderRuntimePins(cfg, changes).config;
	const rawAgents = cfgWithProviders.agents;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawAgents)) return cfgWithProviders;
	let changed = false;
	const nextAgents = { ...rawAgents };
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawAgents.defaults)) {
		const defaults = normalizeLegacyRuntimeAgentContainer(rawAgents.defaults, "agents.defaults", changes, blockedModelIdentities);
		if (defaults.changed) {
			nextAgents.defaults = defaults.value;
			changed = true;
		}
	}
	if (Array.isArray(rawAgents.list)) {
		const nextList = rawAgents.list.map((entry, index) => {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) return entry;
			const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.id);
			const agent = normalizeLegacyRuntimeAgentContainer(entry, agentId ? `agents.list.${require_ansi.sanitizeForLog(agentId)}` : `agents.list[${index}]`, changes, blockedModelIdentities);
			if (agent.changed) {
				changed = true;
				return agent.value;
			}
			return entry;
		});
		if (changed) nextAgents.list = nextList;
	}
	return changed ? {
		...cfgWithProviders,
		agents: nextAgents
	} : cfgWithProviders;
}
/** Add missing metadata source markers to legacy OpenAI Codex model catalog entries. */
function normalizeLegacyOpenAICodexModelsAddMetadata(cfg, changes) {
	const rawModels = cfg.models;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModels) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModels.providers)) return cfg;
	const rawProviders = rawModels.providers;
	let providersChanged = false;
	const nextProviders = { ...rawProviders };
	for (const [providerId, rawProvider] of Object.entries(rawProviders)) {
		if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId) !== "openai-codex" || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawProvider)) continue;
		const rawProviderModels = rawProvider.models;
		if (!Array.isArray(rawProviderModels)) continue;
		let providerChanged = false;
		const nextModels = [];
		for (const model of rawProviderModels) if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(model) && !("metadataSource" in model) && require_legacy_config_migrations_runtime_models.isLegacyModelsAddCodexMetadataModel({
			provider: providerId,
			model
		})) {
			providerChanged = true;
			const safeProviderId = require_ansi.sanitizeForLog(providerId);
			const safeModelId = require_ansi.sanitizeForLog((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(model.id) ?? "unknown");
			changes.push(`Marked models.providers.${safeProviderId}.models.${safeModelId} as /models add metadata so official OpenAI Codex metadata can override it.`);
			nextModels.push(Object.assign({}, model, { metadataSource: "models-add" }));
		} else nextModels.push(model);
		if (!providerChanged) continue;
		nextProviders[providerId] = {
			...rawProvider,
			models: nextModels
		};
		providersChanged = true;
	}
	if (!providersChanged) return cfg;
	return {
		...cfg,
		models: {
			...rawModels,
			providers: nextProviders
		}
	};
}
/** Rename legacy OpenAI API identifiers to the current completion/chat API ids. */
function normalizeLegacyOpenAIModelProviderApi(cfg, changes) {
	const rawModels = cfg.models;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModels) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModels.providers)) return cfg;
	const rawProviders = rawModels.providers;
	let providersChanged = false;
	const nextProviders = { ...rawProviders };
	for (const [providerId, rawProvider] of Object.entries(rawProviders)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawProvider)) continue;
		let providerChanged = false;
		const nextProvider = { ...rawProvider };
		if (nextProvider.api === "openai") {
			nextProvider.api = "openai-completions";
			providerChanged = true;
			changes.push(`Moved models.providers.${require_ansi.sanitizeForLog(providerId)}.api "openai" → "openai-completions".`);
		}
		const rawProviderModels = rawProvider.models;
		if (Array.isArray(rawProviderModels)) {
			let modelsChanged = false;
			const nextModels = [];
			rawProviderModels.forEach((model, index) => {
				if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(model) || model.api !== "openai") {
					nextModels.push(model);
					return;
				}
				modelsChanged = true;
				changes.push(`Moved models.providers.${require_ansi.sanitizeForLog(providerId)}.models[${index}].api "openai" → "openai-completions".`);
				nextModels.push({
					...model,
					api: "openai-completions"
				});
			});
			if (modelsChanged) {
				nextProvider.models = nextModels;
				providerChanged = true;
			}
		}
		if (!providerChanged) continue;
		nextProviders[providerId] = nextProvider;
		providersChanged = true;
	}
	if (!providersChanged) return cfg;
	return {
		...cfg,
		models: {
			...rawModels,
			providers: nextProviders
		}
	};
}
/** Remove retired bundled nano-banana skill config after migrating image generation models. */
function normalizeLegacyNanoBananaSkill(cfg, changes) {
	const NANO_BANANA_SKILL_KEY = "nano-banana-pro";
	const NANO_BANANA_MODEL = "google/gemini-3-pro-image-preview";
	const rawSkills = cfg.skills;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawSkills)) return cfg;
	let next = cfg;
	let skillsChanged = false;
	const skills = structuredClone(rawSkills);
	if (Array.isArray(skills.allowBundled)) {
		const allowBundled = skills.allowBundled.filter((value) => typeof value !== "string" || value.trim() !== NANO_BANANA_SKILL_KEY);
		if (allowBundled.length !== skills.allowBundled.length) {
			if (allowBundled.length === 0) {
				delete skills.allowBundled;
				changes.push(`Removed skills.allowBundled entry for ${NANO_BANANA_SKILL_KEY}.`);
			} else {
				skills.allowBundled = allowBundled;
				changes.push(`Removed ${NANO_BANANA_SKILL_KEY} from skills.allowBundled.`);
			}
			skillsChanged = true;
		}
	}
	const rawEntries = skills.entries;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawEntries)) {
		if (!skillsChanged) return cfg;
		return {
			...cfg,
			skills
		};
	}
	const rawLegacyEntry = rawEntries[NANO_BANANA_SKILL_KEY];
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawLegacyEntry)) {
		if (!skillsChanged) return cfg;
		return {
			...cfg,
			skills
		};
	}
	if (next.agents?.defaults?.imageGenerationModel === void 0) {
		next = {
			...next,
			agents: {
				...next.agents,
				defaults: {
					...next.agents?.defaults,
					imageGenerationModel: { primary: NANO_BANANA_MODEL }
				}
			}
		};
		changes.push(`Moved skills.entries.${NANO_BANANA_SKILL_KEY} → agents.defaults.imageGenerationModel.primary (${NANO_BANANA_MODEL}).`);
	}
	const legacyEnvApiKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawLegacyEntry.env) ? rawLegacyEntry.env : void 0)?.GEMINI_API_KEY) ?? "";
	const legacyApiKey = legacyEnvApiKey || (typeof rawLegacyEntry.apiKey === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawLegacyEntry.apiKey) : rawLegacyEntry.apiKey && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawLegacyEntry.apiKey) ? structuredClone(rawLegacyEntry.apiKey) : void 0);
	const rawModels = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next.models) ? structuredClone(next.models) : {};
	const rawProviders = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawModels.providers) ? { ...rawModels.providers } : {};
	const rawGoogle = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawProviders.google) ? { ...rawProviders.google } : {};
	if (!(rawGoogle.apiKey !== void 0) && legacyApiKey) {
		rawGoogle.apiKey = legacyApiKey;
		if (!rawGoogle.baseUrl) rawGoogle.baseUrl = require_google_api_base_url.DEFAULT_GOOGLE_API_BASE_URL;
		if (!Array.isArray(rawGoogle.models)) rawGoogle.models = [];
		rawProviders.google = rawGoogle;
		rawModels.providers = rawProviders;
		next = {
			...next,
			models: rawModels
		};
		changes.push(`Moved skills.entries.${NANO_BANANA_SKILL_KEY}.${legacyEnvApiKey ? "env.GEMINI_API_KEY" : "apiKey"} → models.providers.google.apiKey.`);
	}
	const entries = { ...rawEntries };
	delete entries[NANO_BANANA_SKILL_KEY];
	if (Object.keys(entries).length === 0) delete skills.entries;
	else skills.entries = entries;
	changes.push(`Removed legacy skills.entries.${NANO_BANANA_SKILL_KEY}.`);
	skillsChanged = true;
	if (Object.keys(skills).length === 0) {
		const { skills: _ignored, ...rest } = next;
		return rest;
	}
	if (!skillsChanged) return next;
	return {
		...next,
		skills
	};
}
/** Move legacy cross-context send boolean into explicit message crossContext policy. */
function normalizeLegacyCrossContextMessageConfig(cfg, changes) {
	const rawTools = cfg.tools;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawTools)) return cfg;
	const rawMessage = rawTools.message;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawMessage) || !("allowCrossContextSend" in rawMessage)) return cfg;
	const legacyAllowCrossContextSend = rawMessage.allowCrossContextSend;
	if (typeof legacyAllowCrossContextSend !== "boolean") return cfg;
	const nextMessage = { ...rawMessage };
	delete nextMessage.allowCrossContextSend;
	if (legacyAllowCrossContextSend) {
		const rawCrossContext = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(nextMessage.crossContext) ? structuredClone(nextMessage.crossContext) : {};
		rawCrossContext.allowWithinProvider = true;
		rawCrossContext.allowAcrossProviders = true;
		nextMessage.crossContext = rawCrossContext;
		changes.push("Moved tools.message.allowCrossContextSend → tools.message.crossContext.allowWithinProvider/allowAcrossProviders (true).");
	} else changes.push("Removed tools.message.allowCrossContextSend=false (default cross-context policy already matches canonical settings).");
	return {
		...cfg,
		tools: {
			...cfg.tools,
			message: nextMessage
		}
	};
}
function mapDeepgramCompatToProviderOptions(rawCompat) {
	const providerOptions = {};
	if (typeof rawCompat.detectLanguage === "boolean") providerOptions.detect_language = rawCompat.detectLanguage;
	if (typeof rawCompat.punctuate === "boolean") providerOptions.punctuate = rawCompat.punctuate;
	if (typeof rawCompat.smartFormat === "boolean") providerOptions.smart_format = rawCompat.smartFormat;
	return providerOptions;
}
function migrateLegacyDeepgramCompat(params) {
	const rawCompat = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.owner.deepgram) ? structuredClone(params.owner.deepgram) : null;
	if (!rawCompat) return false;
	const compatProviderOptions = mapDeepgramCompatToProviderOptions(rawCompat);
	const currentProviderOptions = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.owner.providerOptions) ? structuredClone(params.owner.providerOptions) : {};
	const currentDeepgram = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(currentProviderOptions.deepgram) ? structuredClone(currentProviderOptions.deepgram) : {};
	const mergedDeepgram = {
		...compatProviderOptions,
		...currentDeepgram
	};
	delete params.owner.deepgram;
	currentProviderOptions.deepgram = mergedDeepgram;
	params.owner.providerOptions = currentProviderOptions;
	const hadCanonicalDeepgram = Object.keys(currentDeepgram).length > 0;
	params.changes.push(hadCanonicalDeepgram ? `Merged ${params.pathPrefix}.deepgram → ${params.pathPrefix}.providerOptions.deepgram (filled missing canonical fields from legacy).` : `Moved ${params.pathPrefix}.deepgram → ${params.pathPrefix}.providerOptions.deepgram.`);
	return true;
}
/** Move legacy media provider option aliases into providerOptions maps. */
function normalizeLegacyMediaProviderOptions(cfg, changes) {
	const rawTools = cfg.tools;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawTools)) return cfg;
	const rawMedia = rawTools.media;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawMedia)) return cfg;
	let mediaChanged = false;
	const nextMedia = structuredClone(rawMedia);
	const migrateModelList = (models, pathPrefix) => {
		if (!Array.isArray(models)) return false;
		let changedAny = false;
		for (const [index, entry] of models.entries()) {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) continue;
			if (migrateLegacyDeepgramCompat({
				owner: entry,
				pathPrefix: `${pathPrefix}[${index}]`,
				changes
			})) changedAny = true;
		}
		return changedAny;
	};
	for (const capability of [
		"audio",
		"image",
		"video"
	]) {
		const config = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(nextMedia[capability]) ? structuredClone(nextMedia[capability]) : null;
		if (!config) continue;
		let configChanged = false;
		if (migrateLegacyDeepgramCompat({
			owner: config,
			pathPrefix: `tools.media.${capability}`,
			changes
		})) configChanged = true;
		if (migrateModelList(config.models, `tools.media.${capability}.models`)) configChanged = true;
		if (configChanged) {
			nextMedia[capability] = config;
			mediaChanged = true;
		}
	}
	if (migrateModelList(nextMedia.models, "tools.media.models")) mediaChanged = true;
	if (!mediaChanged) return cfg;
	return {
		...cfg,
		tools: {
			...cfg.tools,
			media: nextMedia
		}
	};
}
function normalizeConfiguredPositiveInteger(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return;
	return Math.floor(value);
}
function resolveConfiguredOllamaModelNumCtxBudget(params) {
	const modelContextWindow = normalizeConfiguredPositiveInteger(params.model.contextWindow);
	if (modelContextWindow !== void 0) return modelContextWindow;
	const providerContextWindow = normalizeConfiguredPositiveInteger(params.provider.contextWindow);
	if (providerContextWindow !== void 0) return params.providerNumCtxApplies ? void 0 : providerContextWindow;
	const modelMaxTokens = normalizeConfiguredPositiveInteger(params.model.maxTokens);
	if (modelMaxTokens !== void 0) return modelMaxTokens;
	const providerMaxTokens = normalizeConfiguredPositiveInteger(params.provider.maxTokens);
	if (providerMaxTokens !== void 0) return params.providerNumCtxApplies ? void 0 : providerMaxTokens;
}
function resolveConfiguredOllamaProviderNumCtxBudget(provider) {
	return normalizeConfiguredPositiveInteger(provider.contextWindow) ?? normalizeConfiguredPositiveInteger(provider.maxTokens);
}
function isNativeOllamaProviderConfig(_providerId, provider) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(provider.api) === "ollama";
}
function isNativeOllamaModelConfig(params) {
	const modelApi = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.model.api);
	if (modelApi) return modelApi === "ollama";
	const providerApi = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.provider.api);
	if (providerApi) return providerApi === "ollama";
	return false;
}
function hasConfiguredOllamaProviderNumCtx(provider) {
	const rawParams = provider.params;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawParams) && require_legacy_config_record_shared.hasOwnKey(rawParams, "num_ctx");
}
function applyLegacyOllamaProviderNumCtxParams(params) {
	if (!isNativeOllamaProviderConfig(params.providerId, params.provider)) return {
		provider: params.provider,
		changed: false
	};
	const rawParams = params.provider.params;
	if (rawParams !== void 0 && !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawParams)) return {
		provider: params.provider,
		changed: false
	};
	if (rawParams && require_legacy_config_record_shared.hasOwnKey(rawParams, "num_ctx")) return {
		provider: params.provider,
		changed: false
	};
	const numCtx = resolveConfiguredOllamaProviderNumCtxBudget(params.provider);
	if (numCtx === void 0) return {
		provider: params.provider,
		changed: false
	};
	params.changes.push(`Set models.providers.${require_ansi.sanitizeForLog(params.providerId)}.params.num_ctx to ${numCtx} for native Ollama compatibility.`);
	return {
		provider: {
			...params.provider,
			params: rawParams ? {
				...rawParams,
				num_ctx: numCtx
			} : { num_ctx: numCtx }
		},
		changed: true
	};
}
/** Seed native Ollama num_ctx params from legacy context-token budgets. */
function normalizeLegacyOllamaNativeNumCtxParams(cfg, changes) {
	const rawProviders = cfg.models?.providers;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawProviders)) return cfg;
	let providersChanged = false;
	const nextProviders = { ...rawProviders };
	for (const [providerId, rawProvider] of Object.entries(rawProviders)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawProvider)) continue;
		const rawModels = rawProvider.models;
		if (!Array.isArray(rawModels)) continue;
		const providerParams = applyLegacyOllamaProviderNumCtxParams({
			providerId,
			provider: rawProvider,
			changes
		});
		const providerNumCtxApplies = isNativeOllamaProviderConfig(providerId, providerParams.provider) && hasConfiguredOllamaProviderNumCtx(providerParams.provider);
		if (rawModels.length === 0) {
			if (!providerParams.changed) continue;
			nextProviders[providerId] = providerParams.provider;
			providersChanged = true;
			continue;
		}
		let modelsChanged = false;
		const nextModels = rawModels.map((model, index) => {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(model)) return model;
			if (!isNativeOllamaModelConfig({
				providerId,
				provider: providerParams.provider,
				model
			})) return model;
			const rawParams = model.params;
			if (rawParams !== void 0 && !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawParams)) return model;
			if (rawParams && require_legacy_config_record_shared.hasOwnKey(rawParams, "num_ctx")) return model;
			const numCtx = resolveConfiguredOllamaModelNumCtxBudget({
				model,
				provider: providerParams.provider,
				providerNumCtxApplies
			});
			if (numCtx === void 0) return model;
			modelsChanged = true;
			changes.push(`Set models.providers.${require_ansi.sanitizeForLog(providerId)}.models[${index}].params.num_ctx to ${numCtx} for native Ollama compatibility.`);
			return Object.assign({}, model, { params: rawParams ? {
				...rawParams,
				num_ctx: numCtx
			} : { num_ctx: numCtx } });
		});
		if (!modelsChanged && !providerParams.changed) continue;
		nextProviders[providerId] = {
			...providerParams.provider,
			models: nextModels
		};
		providersChanged = true;
	}
	if (!providersChanged) return cfg;
	return {
		...cfg,
		models: {
			...cfg.models,
			providers: nextProviders
		}
	};
}
const MISTRAL_MODEL_CACHE_READ_COST_BY_ID = {
	"codestral-latest": .03,
	"devstral-medium-latest": .04,
	"magistral-small": .05,
	"mistral-large-latest": .05,
	"mistral-medium-2508": .04,
	"mistral-medium-3-5": .15,
	"mistral-small-latest": .01,
	"pixtral-large-latest": .2
};
function normalizeLegacyMistralModelCost(params) {
	const cost = params.model.cost;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cost) || cost.cacheRead !== 0) return {
		model: params.model,
		changed: false
	};
	const normalizedCacheRead = MISTRAL_MODEL_CACHE_READ_COST_BY_ID[params.modelId.toLowerCase()];
	if (normalizedCacheRead === void 0) return {
		model: params.model,
		changed: false
	};
	params.changes.push(`Normalized models.providers.${require_ansi.sanitizeForLog(params.providerId)}.models[${params.index}].cost.cacheRead (0 → ${normalizedCacheRead}) for Mistral prompt-cache billing.`);
	return {
		model: {
			...params.model,
			cost: {
				...cost,
				cacheRead: normalizedCacheRead
			}
		},
		changed: true
	};
}
/** Normalize stale Mistral model defaults such as prompt-cache read cost. */
function normalizeLegacyMistralModelDefaults(cfg, changes) {
	const rawProviders = cfg.models?.providers;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawProviders)) return cfg;
	let providersChanged = false;
	const nextProviders = { ...rawProviders };
	for (const [providerId, rawProvider] of Object.entries(rawProviders)) {
		if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId) !== "mistral" || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawProvider)) continue;
		const rawModels = rawProvider.models;
		if (!Array.isArray(rawModels)) continue;
		let modelsChanged = false;
		const nextModels = rawModels.map((model, index) => {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(model)) return model;
			const modelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(model.id) ?? "";
			if (!modelId) return model;
			let nextModel = model;
			let modelChanged = false;
			const contextWindow = typeof model.contextWindow === "number" && Number.isFinite(model.contextWindow) ? model.contextWindow : null;
			const maxTokens = typeof model.maxTokens === "number" && Number.isFinite(model.maxTokens) ? model.maxTokens : null;
			if (contextWindow !== null && maxTokens !== null) {
				const normalizedMaxTokens = require_io.resolveNormalizedProviderModelMaxTokens({
					providerId,
					modelId,
					contextWindow,
					rawMaxTokens: maxTokens
				});
				if (normalizedMaxTokens !== maxTokens) {
					nextModel = Object.assign({}, nextModel, { maxTokens: normalizedMaxTokens });
					modelChanged = true;
					changes.push(`Normalized models.providers.${providerId}.models[${index}].maxTokens (${maxTokens} → ${normalizedMaxTokens}) to avoid Mistral context-window rejects.`);
				}
			}
			const costNormalization = normalizeLegacyMistralModelCost({
				providerId,
				model: nextModel,
				modelId,
				index,
				changes
			});
			if (costNormalization.changed) {
				nextModel = costNormalization.model;
				modelChanged = true;
			}
			if (modelChanged) modelsChanged = true;
			return modelChanged ? nextModel : model;
		});
		if (!modelsChanged) continue;
		nextProviders[providerId] = {
			...rawProvider,
			models: nextModels
		};
		providersChanged = true;
	}
	if (!providersChanged) return cfg;
	return {
		...cfg,
		models: {
			...cfg.models,
			providers: nextProviders
		}
	};
}
//#endregion
//#region src/commands/doctor/shared/legacy-web-fetch-migrate.ts
const DANGEROUS_RECORD_KEYS = /* @__PURE__ */ new Set([
	"__proto__",
	"prototype",
	"constructor"
]);
function resolveLegacyFetchConfig(raw) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return;
	const tools = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.tools) ? raw.tools : void 0;
	const web = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(tools?.web) ? tools.web : void 0;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(web?.fetch) ? web.fetch : void 0;
}
function copyLegacyFirecrawlFetchConfig(fetch) {
	const current = fetch.firecrawl;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(current)) return;
	const next = require_legacy_config_record_shared.cloneRecord(current);
	delete next.enabled;
	return next;
}
function hasMappedLegacyWebFetchConfig(raw) {
	const fetch = resolveLegacyFetchConfig(raw);
	if (!fetch) return false;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(fetch.firecrawl);
}
function migratePluginWebFetchConfig(params) {
	const entry = require_legacy_config_record_shared.ensureRecord(require_legacy_config_record_shared.ensureRecord(require_legacy_config_record_shared.ensureRecord(params.root, "plugins"), "entries"), "firecrawl");
	const config = require_legacy_config_record_shared.ensureRecord(entry, "config");
	const hadEnabled = entry.enabled !== void 0;
	const existing = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config.webFetch) ? require_legacy_config_record_shared.cloneRecord(config.webFetch) : void 0;
	if (!hadEnabled) entry.enabled = true;
	if (!existing) {
		config.webFetch = require_legacy_config_record_shared.cloneRecord(params.payload);
		params.changes.push("Moved tools.web.fetch.firecrawl → plugins.entries.firecrawl.config.webFetch.");
		return;
	}
	const merged = require_legacy_config_record_shared.cloneRecord(existing);
	require_legacy_config_migrations_runtime_models.mergeMissing(merged, params.payload);
	const changed = JSON.stringify(merged) !== JSON.stringify(existing) || !hadEnabled;
	config.webFetch = merged;
	if (changed) {
		params.changes.push("Merged tools.web.fetch.firecrawl → plugins.entries.firecrawl.config.webFetch (filled missing fields from legacy; kept explicit plugin config values).");
		return;
	}
	params.changes.push("Removed tools.web.fetch.firecrawl (plugins.entries.firecrawl.config.webFetch already set).");
}
/** Move legacy Firecrawl web-fetch config into plugins.entries.firecrawl.config.webFetch. */
function migrateLegacyWebFetchConfig(raw) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw) || !hasMappedLegacyWebFetchConfig(raw)) return {
		config: raw,
		changes: []
	};
	return normalizeLegacyWebFetchConfigRecord(raw);
}
function normalizeLegacyWebFetchConfigRecord(raw) {
	const nextRoot = structuredClone(raw);
	const web = require_legacy_config_record_shared.ensureRecord(require_legacy_config_record_shared.ensureRecord(nextRoot, "tools"), "web");
	const fetch = resolveLegacyFetchConfig(nextRoot);
	if (!fetch) return {
		config: raw,
		changes: []
	};
	const nextFetch = {};
	for (const [key, value] of Object.entries(fetch)) {
		if (key === "firecrawl" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) continue;
		if (DANGEROUS_RECORD_KEYS.has(key)) continue;
		nextFetch[key] = value;
	}
	web.fetch = nextFetch;
	const firecrawl = copyLegacyFirecrawlFetchConfig(fetch);
	const changes = [];
	if (firecrawl && Object.keys(firecrawl).length > 0) migratePluginWebFetchConfig({
		root: nextRoot,
		payload: firecrawl,
		changes
	});
	else if (require_legacy_config_record_shared.hasOwnKey(fetch, "firecrawl")) changes.push("Removed empty tools.web.fetch.firecrawl.");
	return {
		config: nextRoot,
		changes
	};
}
//#endregion
//#region src/commands/doctor/shared/legacy-config-compatibility-base.ts
/** Run common compatibility migrations before caller-specific setup/channel passes. */
function normalizeBaseCompatibilityConfigValues(cfg, changes, afterBrowser, blockedModelIdentities) {
	let next = seedMissingDefaultAccountsFromSingleAccountBase(cfg, changes);
	next = normalizeLegacyBrowserConfig(next, changes);
	next = afterBrowser ? afterBrowser(next) : next;
	for (const migrate of [
		require_legacy_config_issues.migrateLegacyWebSearchConfig,
		migrateLegacyWebFetchConfig,
		require_legacy_config_issues.migrateLegacyXSearchConfig
	]) {
		const migrated = migrate(next);
		if (migrated.changes.length === 0) continue;
		next = migrated.config;
		changes.push(...migrated.changes);
	}
	next = normalizeLegacyNanoBananaSkill(next, changes);
	next = normalizeLegacyTalkConfig(next, changes);
	next = normalizeLegacyOpenAIModelProviderApi(next, changes);
	next = normalizeLegacyRuntimeModelRefs(next, changes, blockedModelIdentities);
	next = normalizeLegacyCrossContextMessageConfig(next, changes);
	next = normalizeLegacyMediaProviderOptions(next, changes);
	next = normalizeLegacyOllamaNativeNumCtxParams(next, changes);
	return normalizeLegacyMistralModelDefaults(next, changes);
}
//#endregion
//#region src/commands/doctor/shared/legacy-config-core-migrate.ts
function repairNullAgentWorkspaces(cfg, changes) {
	const agents = cfg.agents?.list;
	if (!Array.isArray(agents)) return cfg;
	let repaired = 0;
	const nextAgents = agents.map((agent) => {
		if (agent && typeof agent === "object" && agent.workspace === null) {
			repaired += 1;
			const { workspace: _workspace, ...rest } = agent;
			return rest;
		}
		return agent;
	});
	if (repaired === 0) return cfg;
	changes.push(`Removed null workspace value${repaired === 1 ? "" : "s"} from agents.list entr${repaired === 1 ? "y" : "ies"}.`);
	return {
		...cfg,
		agents: {
			...cfg.agents,
			list: nextAgents
		}
	};
}
/** Normalize current config through core, plugin setup, channel, and secret-ref migrations. */
function normalizeCompatibilityConfigValues(cfg, options = {}) {
	const changes = [];
	let next = normalizeBaseCompatibilityConfigValues(cfg, changes, (config) => {
		const setupMigration = require_setup_registry.runPluginSetupConfigMigrations({ config });
		if (setupMigration.changes.length === 0) return config;
		changes.push(...setupMigration.changes);
		return setupMigration.config;
	}, options.blockedModelIdentities);
	const channelMigrations = applyChannelDoctorCompatibilityMigrations(next);
	if (channelMigrations.changes.length > 0) {
		next = channelMigrations.next;
		changes.push(...channelMigrations.changes);
	}
	const secretRefMarkers = migrateLegacySecretRefEnvMarkers(next);
	if (secretRefMarkers.changes.length > 0) {
		next = secretRefMarkers.config;
		changes.push(...secretRefMarkers.changes);
	}
	next = normalizeLegacyCommandsConfig(next, changes);
	next = normalizeLegacyOpenAICodexModelsAddMetadata(next, changes);
	next = repairNullAgentWorkspaces(next, changes);
	next = pruneBindingsForMissingAgents(next, changes);
	return {
		config: next,
		changes
	};
}
//#endregion
//#region src/commands/doctor-config-flow.ts
/** Main doctor config flow: preflight, migrations, previews, repairs, and final write decision. */
function hasLegacyInternalHookHandlers(raw) {
	const handlers = raw?.hooks?.internal?.handlers;
	return Array.isArray(handlers) && handlers.length > 0;
}
function collectInvalidHookTransformsDirWarnings(cfg, configPath) {
	const transformsDir = cfg.hooks?.transformsDir?.trim();
	if (!transformsDir) return [];
	const configDir = node_path.default.dirname(configPath);
	const transformsRoot = node_path.default.join(configDir, "hooks", "transforms");
	const resolved = node_path.default.isAbsolute(transformsDir) ? node_path.default.resolve(transformsDir) : node_path.default.resolve(transformsRoot, transformsDir);
	const relative = node_path.default.relative(transformsRoot, resolved);
	if (!(relative === ".." || relative.startsWith(`..${node_path.default.sep}`) || node_path.default.isAbsolute(relative))) return [];
	return [`- hooks.transformsDir: ${transformsDir} is outside ${transformsRoot}. Hook transform modules must live under ${transformsRoot}; move custom transforms there or remove hooks.transformsDir.`];
}
function collectUnsupportedInternalHookEntryWarnings(cfg) {
	const entries = cfg.hooks?.internal?.entries;
	if (!entries) return [];
	const unsupportedKeysByEntry = Object.entries(entries).filter(([, entry]) => entry && typeof entry === "object" && !Array.isArray(entry)).map(([hookKey, entry]) => {
		return {
			hookKey,
			unsupportedKeys: [
				"handler",
				"module",
				"extraDirs",
				"installs"
			].filter((key) => Object.hasOwn(entry, key))
		};
	}).filter(({ unsupportedKeys }) => unsupportedKeys.length > 0);
	if (unsupportedKeysByEntry.length === 0) return [];
	return unsupportedKeysByEntry.map(({ hookKey, unsupportedKeys }) => `- hooks.internal.entries.${hookKey}: unsupported loader key${unsupportedKeys.length === 1 ? "" : "s"} ${unsupportedKeys.join(", ")} will not load hook modules. Use bootstrap-extra-files for session bootstrap content, or create a managed/workspace hook directory with HOOK.md + handler.js. Doctor cannot rewrite this automatically because per-hook entry keys are open-ended hook configuration.`);
}
function collectConfiguredChannelIds(cfg) {
	const channels = cfg.channels && typeof cfg.channels === "object" && !Array.isArray(cfg.channels) ? cfg.channels : null;
	if (!channels) return [];
	return Object.keys(channels).filter((channelId) => channelId !== "defaults");
}
function emitDoctorChangesPanel(changeLines, shouldRepair, options = {}) {
	if (changeLines.length === 0) return;
	const body = changeLines.join("\n");
	require_note.note(options.sanitize ? sanitizeDoctorNote(body) : body, shouldRepair ? "Doctor changes" : "Doctor changes preview");
}
async function refreshGatewayAuthStateAfterAuthProfileRepair() {
	try {
		await require_call.callGateway({
			method: "secrets.reload",
			params: {},
			timeoutMs: 3e3
		});
	} catch {}
	try {
		await require_call.callGateway({
			method: "models.authStatus",
			params: { refresh: true },
			timeoutMs: 3e3
		});
	} catch {}
}
/**
* Loads config, runs doctor migrations/repairs, and returns the config write plan.
*
* This is the config-side orchestration boundary for doctor; it keeps preview notes, repair
* mutations, gateway auth refreshes, and final write confirmation in one ordered flow.
*/
async function loadAndMaybeMigrateDoctorConfig(params) {
	const shouldRepair = params.options.repair === true || params.options.yes === true;
	const preflight = await runDoctorConfigPreflight({
		repairPrefixedConfig: shouldRepair,
		recoverCorruptTargetStore: shouldRepair,
		crossStateDirImports: shouldRepair && params.options.crossStateDirImports === true
	});
	const snapshot = preflight.snapshot;
	const baseCfg = preflight.baseConfig;
	let cfg = baseCfg;
	let candidate = structuredClone(baseCfg);
	let pendingChanges = false;
	let fixHints = [];
	let shouldRepairCronCodexModelRefsAfterConfigWrite = false;
	const doctorFixCommand = require_command_format.formatCliCommand("operator doctor --fix");
	const sourceMeta = snapshot.sourceConfig?.meta;
	const sourceLastTouchedVersion = typeof sourceMeta?.lastTouchedVersion === "string" ? sourceMeta.lastTouchedVersion : void 0;
	const legacyStep = applyLegacyCompatibilityStep({
		snapshot,
		state: {
			cfg,
			candidate,
			pendingChanges,
			fixHints
		},
		shouldRepair,
		doctorFixCommand
	});
	cfg = legacyStep.state.cfg;
	candidate = legacyStep.state.candidate;
	pendingChanges = pendingChanges || legacyStep.state.pendingChanges;
	fixHints = legacyStep.state.fixHints;
	const legacyMigrationPartiallyValid = legacyStep.partiallyValid === true;
	const { collectBlockedLegacyOpenAICodexProviderPlan } = await Promise.resolve().then(() => require("./legacy-config-migrations.runtime.models-0_mLlBGY.cjs")).then((n) => n.legacy_config_migrations_runtime_models_exports);
	const blockedCodexProviderPlan = collectBlockedLegacyOpenAICodexProviderPlan(candidate);
	const blockedCodexModelIdentities = new Set(blockedCodexProviderPlan.blockedModelIdentities);
	if (preflight.cronCodexRuntimePolicyTargets?.length) {
		const { repairCronCodexRuntimePolicies } = await Promise.resolve().then(() => require("./runtime-policy-migration-BeaV9CEA.cjs")).then((n) => n.runtime_policy_migration_exports);
		const cronRuntimeRepair = repairCronCodexRuntimePolicies({
			cfg: candidate,
			targets: preflight.cronCodexRuntimePolicyTargets,
			blockedModelIdentities: blockedCodexModelIdentities
		});
		emitDoctorChangesPanel(cronRuntimeRepair.changes, shouldRepair);
		if (cronRuntimeRepair.warnings.length > 0) emitDoctorNotes({
			note: require_note.note,
			warningNotes: cronRuntimeRepair.warnings
		});
		const blockedTargets = new Set(cronRuntimeRepair.blockedTargets.map(require_store_migration.cronCodexRuntimePolicyTargetKey));
		shouldRepairCronCodexModelRefsAfterConfigWrite = preflight.cronCodexRuntimePolicyTargets.some((target) => !blockedTargets.has(require_store_migration.cronCodexRuntimePolicyTargetKey(target)));
		({cfg, candidate, pendingChanges, fixHints} = require_config_mutation_state.applyDoctorConfigMutation({
			state: {
				cfg,
				candidate,
				pendingChanges,
				fixHints
			},
			mutation: cronRuntimeRepair,
			shouldRepair,
			fixHint: `Run "${doctorFixCommand}" to preserve migrated cron runtime policy.`
		}));
	}
	const pluginLegacyIssues = await (async () => {
		if (snapshot.parsed === snapshot.sourceConfig) return [];
		const { findDoctorLegacyConfigIssues } = await Promise.resolve().then(() => require("./legacy-config-issues-DrxN5w43.cjs")).then((n) => n.legacy_config_issues_exports);
		return findDoctorLegacyConfigIssues(snapshot.parsed, snapshot.parsed);
	})();
	const seenLegacyIssues = new Set(snapshot.legacyIssues.map((issue) => `${issue.path}:${issue.message}`));
	const pluginIssueLines = pluginLegacyIssues.filter((issue) => {
		const key = `${issue.path}:${issue.message}`;
		if (seenLegacyIssues.has(key)) return false;
		seenLegacyIssues.add(key);
		return true;
	}).map((issue) => `- ${issue.path}: ${issue.message}`);
	const legacyIssueLines = [...legacyStep.issueLines, ...pluginIssueLines];
	if (pluginIssueLines.length > 0 && !shouldRepair && !fixHints.includes(`Run "${doctorFixCommand}" to migrate legacy config keys.`)) fixHints.push(`Run "${doctorFixCommand}" to migrate legacy config keys.`);
	if (legacyIssueLines.length > 0) require_note.note(legacyIssueLines.join("\n"), "Legacy config keys detected");
	emitDoctorChangesPanel(legacyStep.changeLines, shouldRepair);
	if (hasLegacyInternalHookHandlers(snapshot.parsed)) require_note.note([
		"- hooks.internal.handlers: legacy inline hook modules are no longer part of the public config surface.",
		"- Migrate each entry to a managed or workspace hook directory with HOOK.md + handler.js, then enable it through hooks.internal.entries.<hookKey> as needed.",
		"- operator doctor --fix does not rewrite this shape automatically."
	].join("\n"), "Legacy config keys detected");
	const hookTransformsDirWarnings = collectInvalidHookTransformsDirWarnings(cfg, snapshot.path);
	if (hookTransformsDirWarnings.length > 0) require_note.note(sanitizeDoctorNote(hookTransformsDirWarnings.join("\n")), "Doctor warnings");
	const unsupportedInternalHookEntryWarnings = collectUnsupportedInternalHookEntryWarnings(cfg);
	if (unsupportedInternalHookEntryWarnings.length > 0) require_note.note(sanitizeDoctorNote(unsupportedInternalHookEntryWarnings.join("\n")), "Doctor warnings");
	const normalized = normalizeCompatibilityConfigValues(candidate, { blockedModelIdentities: blockedCodexModelIdentities });
	if (normalized.changes.length > 0) {
		emitDoctorChangesPanel(normalized.changes, shouldRepair);
		({cfg, candidate, pendingChanges, fixHints} = require_config_mutation_state.applyDoctorConfigMutation({
			state: {
				cfg,
				candidate,
				pendingChanges,
				fixHints
			},
			mutation: normalized,
			shouldRepair,
			fixHint: `Run "${doctorFixCommand}" to apply these changes.`
		}));
	}
	const pluginActivationSourceConfig = candidate;
	const { applyPluginAutoEnable } = await Promise.resolve().then(() => require("./plugin-auto-enable-nYwhgNCn.cjs")).then((n) => n.plugin_auto_enable_exports);
	const autoEnable = applyPluginAutoEnable({
		config: candidate,
		env: process.env
	});
	if (autoEnable.changes.length > 0) {
		emitDoctorChangesPanel(autoEnable.changes, shouldRepair);
		({cfg, candidate, pendingChanges, fixHints} = require_config_mutation_state.applyDoctorConfigMutation({
			state: {
				cfg,
				candidate,
				pendingChanges,
				fixHints
			},
			mutation: autoEnable,
			shouldRepair,
			fixHint: `Run "${doctorFixCommand}" to apply these changes.`
		}));
	}
	const { collectPluginToolAllowlistWarnings } = await Promise.resolve().then(() => require("./plugin-tool-allowlist-warnings-BN_DfM6G.cjs"));
	const pluginToolAllowlistWarnings = collectPluginToolAllowlistWarnings({
		cfg: candidate,
		env: process.env
	});
	if (pluginToolAllowlistWarnings.length > 0) require_note.note(sanitizeDoctorNote(pluginToolAllowlistWarnings.join("\n")), "Doctor warnings");
	const hasConfiguredChannels = collectConfiguredChannelIds(candidate).length > 0;
	let collectMutableAllowlistWarnings;
	if (hasConfiguredChannels) {
		const channelDoctor = await Promise.resolve().then(() => require("./channel-doctor-BmUKQKvS.cjs")).then((n) => n.channel_doctor_exports);
		collectMutableAllowlistWarnings = channelDoctor.collectChannelDoctorMutableAllowlistWarnings;
		const channelDoctorSequence = await channelDoctor.runChannelDoctorConfigSequences({
			cfg: candidate,
			env: process.env,
			shouldRepair
		});
		emitDoctorNotes({
			note: require_note.note,
			changeNotes: channelDoctorSequence.changeNotes,
			warningNotes: channelDoctorSequence.warningNotes
		});
		for (const staleCleanup of await channelDoctor.collectChannelDoctorStaleConfigMutations(candidate, { env: process.env })) {
			if (staleCleanup.changes.length === 0) continue;
			emitDoctorChangesPanel(staleCleanup.changes, shouldRepair, { sanitize: true });
			({cfg, candidate, pendingChanges, fixHints} = require_config_mutation_state.applyDoctorConfigMutation({
				state: {
					cfg,
					candidate,
					pendingChanges,
					fixHints
				},
				mutation: staleCleanup,
				shouldRepair,
				fixHint: `Run "${doctorFixCommand}" to remove stale channel plugin references.`
			}));
		}
	}
	const { repairHooksTokenReuseGatewayAuth } = await Promise.resolve().then(() => require("./hooks-token-reuse-repair-PmBIxb0r.cjs"));
	const hooksTokenReuseRepair = await repairHooksTokenReuseGatewayAuth(candidate, process.env);
	emitDoctorChangesPanel(hooksTokenReuseRepair.changes, shouldRepair);
	({cfg, candidate, pendingChanges, fixHints} = require_config_mutation_state.applyDoctorConfigMutation({
		state: {
			cfg,
			candidate,
			pendingChanges,
			fixHints
		},
		mutation: hooksTokenReuseRepair,
		shouldRepair,
		fixHint: `Run "${doctorFixCommand}" to rotate hooks.token away from Gateway auth.`
	}));
	if (shouldRepair) {
		const { runDoctorRepairSequence } = await Promise.resolve().then(() => require("./repair-sequencing-Fb8SOyAn.cjs"));
		const repairSequence = await runDoctorRepairSequence({
			state: {
				cfg,
				candidate,
				pendingChanges,
				fixHints
			},
			doctorFixCommand,
			env: process.env,
			blockedCodexProviderPlan
		});
		({cfg, candidate, pendingChanges, fixHints} = repairSequence.state);
		if (repairSequence.authProfilesRepaired) await refreshGatewayAuthStateAfterAuthProfileRepair();
		emitDoctorNotes({
			note: require_note.note,
			changeNotes: repairSequence.changeNotes,
			warningNotes: repairSequence.warningNotes
		});
	} else {
		const { collectDoctorPreviewNotes } = await Promise.resolve().then(() => require("./preview-warnings-LDLX1SjN.cjs"));
		const previewNotes = await collectDoctorPreviewNotes({
			cfg: candidate,
			activationSourceConfig: pluginActivationSourceConfig,
			doctorFixCommand,
			env: process.env,
			allowExec: params.options.allowExec === true,
			blockedCodexProviderPlan
		});
		emitDoctorNotes({
			note: require_note.note,
			infoNotes: previewNotes.infoNotes,
			warningNotes: previewNotes.warningNotes
		});
	}
	const mutableAllowlistWarnings = collectMutableAllowlistWarnings ? await collectMutableAllowlistWarnings({
		cfg: candidate,
		env: process.env
	}) : [];
	if (mutableAllowlistWarnings.length > 0) require_note.note(sanitizeDoctorNote(mutableAllowlistWarnings.join("\n")), "Doctor warnings");
	const unknownStep = applyUnknownConfigKeyStep({
		state: {
			cfg,
			candidate,
			pendingChanges,
			fixHints
		},
		shouldRepair,
		doctorFixCommand
	});
	({cfg, candidate, pendingChanges, fixHints} = unknownStep.state);
	if (unknownStep.removed.length > 0 || unknownStep.repairs.length > 0) require_note.note([...unknownStep.removed.map((pathLocal) => `- ${pathLocal}`), ...unknownStep.repairs.map((change) => `- ${change}`)].join("\n"), shouldRepair ? "Doctor changes" : "Unknown config keys");
	if (unknownStep.warnings.length > 0) require_note.note(unknownStep.warnings.join("\n"), "Doctor warnings");
	const finalized = await finalizeDoctorConfigFlow({
		cfg,
		candidate,
		pendingChanges,
		shouldRepair,
		fixHints,
		confirm: params.confirm,
		note: require_note.note
	});
	cfg = finalized.cfg;
	require_doctor_config_analysis.noteOpencodeProviderOverrides(cfg);
	require_doctor_config_analysis.noteImplicitFallbackClobberWarnings(cfg);
	return {
		cfg,
		path: snapshot.path ?? require_paths.CONFIG_PATH,
		shouldWriteConfig: finalized.shouldWriteConfig,
		sourceConfigValid: snapshot.valid,
		preservedLegacyRootKeys: ["defaultModel"],
		...sourceLastTouchedVersion ? { sourceLastTouchedVersion } : {},
		...legacyMigrationPartiallyValid ? { skipPluginValidationOnWrite: true } : {},
		...shouldRepairCronCodexModelRefsAfterConfigWrite ? { shouldRepairCronCodexModelRefsAfterConfigWrite: true } : {},
		...blockedCodexProviderPlan.blockedModelIdentities.length > 0 ? { blockedCodexModelIdentities: blockedCodexProviderPlan.blockedModelIdentities } : {}
	};
}
//#endregion
exports.loadAndMaybeMigrateDoctorConfig = loadAndMaybeMigrateDoctorConfig;
