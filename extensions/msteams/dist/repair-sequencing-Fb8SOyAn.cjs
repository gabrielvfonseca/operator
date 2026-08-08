require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_dm_access = require("./dm-access-UxTYSelO.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_pairing_store = require("./pairing-store-qtDtw17r.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
const require_object = require("./object-Be4AQnVV.cjs");
const require_configured_runtime_plugin_installs = require("./configured-runtime-plugin-installs-CWK0S1IQ.cjs");
const require_update_phase = require("./update-phase-noJPNQLY.cjs");
const require_missing_configured_plugin_install = require("./missing-configured-plugin-install-BXc1994T.cjs");
const require_doctor_auth_flat_profiles = require("./doctor-auth-flat-profiles-DHG-0EU-.cjs");
const require_doctor_auth_oauth_sidecar = require("./doctor-auth-oauth-sidecar-B7L0y89u.cjs");
const require_config_mutation_state = require("./config-mutation-state-CfsL4joZ.cjs");
const require_doctor_plugin_registry = require("./doctor-plugin-registry-D6vxCw0T.cjs");
const require_active_tool_schema_warnings = require("./active-tool-schema-warnings--49NhIat.cjs");
const require_channel_capabilities = require("./channel-capabilities-DPMAK62I.cjs");
const require_bundled_plugin_load_paths = require("./bundled-plugin-load-paths-C1N5AQUz.cjs");
const require_channel_doctor = require("./channel-doctor-BmUKQKvS.cjs");
const require_codex_route_warnings = require("./codex-route-warnings-DZiR4oAu.cjs");
const require_context_engine_host_compat = require("./context-engine-host-compat-TfUbOMO9.cjs");
const require_empty_allowlist_scan = require("./empty-allowlist-scan-DUQXux0n.cjs");
const require_exec_safe_bins = require("./exec-safe-bins-CAR4sxsv.cjs");
const require_legacy_tools_by_sender = require("./legacy-tools-by-sender-B8iU08xW.cjs");
const require_open_policy_allowfrom = require("./open-policy-allowfrom-UtsNAu9x.cjs");
const require_plugin_dependency_cleanup = require("./plugin-dependency-cleanup-CMo92LUY.cjs");
const require_stale_auth_order = require("./stale-auth-order-BrE0Cj_K.cjs");
const require_stale_oauth_profile_shadows = require("./stale-oauth-profile-shadows-Ca4xmxY3.cjs");
const require_stale_plugin_config = require("./stale-plugin-config-Dmz-RtD4.cjs");
const require_stale_subagent_allowlist = require("./stale-subagent-allowlist-AR6qHPka.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/doctor/shared/allowfrom-fallback-migration.ts
const PSEUDO_CHANNEL_KEYS = /* @__PURE__ */ new Set([
	"defaults",
	"modelByChannel",
	"tools"
]);
const ACCOUNT_SCHEMA_WILDCARD = "*";
const CHANNEL_GROUP_ALLOW_FROM_PATH = ["groupAllowFrom"];
const ACCOUNT_GROUP_ALLOW_FROM_PATH = [
	"accounts",
	ACCOUNT_SCHEMA_WILDCARD,
	"groupAllowFrom"
];
function isDisabled(record) {
	return record.enabled === false;
}
function normalizeAllowFrom(raw) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(Array.isArray(raw) ? raw : []);
}
function readGroupAllowFrom(record) {
	return normalizeAllowFrom(record.groupAllowFrom);
}
function readDmAllowFrom(params) {
	return normalizeAllowFrom(require_dm_access.resolveChannelDmAllowFrom({
		account: params.account,
		parent: params.parent,
		mode: require_channel_capabilities.getDoctorChannelCapabilities(params.channelName).dmAllowFromMode
	}));
}
function readOwnDmAllowFrom(params) {
	return normalizeAllowFrom(require_dm_access.resolveChannelDmAllowFrom({
		account: params.account,
		mode: require_channel_capabilities.getDoctorChannelCapabilities(params.channelName).dmAllowFromMode
	}));
}
function findGeneratedChannelConfigSchema(channelName) {
	const normalizedChannelId = require_registry_normalize.normalizeAnyChannelId(channelName);
	return require_ids.GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA.find((entry) => entry.channelId === channelName || entry.channelId === normalizedChannelId)?.schema;
}
function schemaAllowsConfigPath(schema, path) {
	if (path.length === 0) return true;
	const node = require_object.asObjectRecord(schema);
	if (!node) return true;
	const anyOf = Array.isArray(node.anyOf) ? node.anyOf : void 0;
	if (anyOf) return anyOf.some((branch) => schemaAllowsConfigPath(branch, path));
	const oneOf = Array.isArray(node.oneOf) ? node.oneOf : void 0;
	if (oneOf) return oneOf.some((branch) => schemaAllowsConfigPath(branch, path));
	const allOf = Array.isArray(node.allOf) ? node.allOf : void 0;
	if (allOf) return allOf.every((branch) => schemaAllowsConfigPath(branch, path));
	const segment = (0, _gabrielvfonseca_normalization_core.expectDefined)(path[0], "schema path segment");
	const rest = path.slice(1);
	const properties = require_object.asObjectRecord(node.properties);
	if (segment !== ACCOUNT_SCHEMA_WILDCARD && properties && Object.hasOwn(properties, segment)) return schemaAllowsConfigPath((0, _gabrielvfonseca_normalization_core.expectDefined)(properties[segment], "schema property"), rest);
	const additionalProperties = node.additionalProperties;
	if (additionalProperties === false) return false;
	if (additionalProperties && typeof additionalProperties === "object") return schemaAllowsConfigPath(additionalProperties, rest);
	return true;
}
function generatedSchemaAllowsGroupAllowFrom(channelName, path) {
	const schema = findGeneratedChannelConfigSchema(channelName);
	return !schema || schemaAllowsConfigPath(schema, path);
}
function migrateRecord(params) {
	if (!params.canWriteGroupAllowFrom) return false;
	if (readGroupAllowFrom(params.account).length > 0) return false;
	if (params.parent && params.parentHadGroupAllowFrom) return false;
	const ownAllowFrom = readOwnDmAllowFrom(params);
	if (params.parent && ownAllowFrom.length === 0 && readGroupAllowFrom(params.parent).length > 0) return false;
	const allowFrom = readDmAllowFrom(params);
	if (allowFrom.length === 0) return false;
	params.account.groupAllowFrom = allowFrom;
	const noun = allowFrom.length === 1 ? "entry" : "entries";
	params.changes.push(`${params.prefix}.groupAllowFrom: copied ${allowFrom.length} sender ${noun} from allowFrom for explicit group allowlist.`);
	return true;
}
/** Copy legacy allowFrom entries into groupAllowFrom where channel metadata permits fallback. */
function maybeRepairGroupAllowFromFallback(cfg) {
	if (!require_object.asObjectRecord(cfg.channels)) return {
		config: cfg,
		changes: []
	};
	const next = structuredClone(cfg);
	const nextChannels = next.channels;
	const changes = [];
	for (const [channelName, channelConfig] of Object.entries(nextChannels)) {
		if (PSEUDO_CHANNEL_KEYS.has(channelName) || !channelConfig || typeof channelConfig !== "object") continue;
		if (isDisabled(channelConfig)) continue;
		if (!require_channel_capabilities.getDoctorChannelCapabilities(channelName).groupAllowFromFallbackToAllowFrom) continue;
		const hadGroupAllowFrom = readGroupAllowFrom(channelConfig).length > 0;
		migrateRecord({
			account: channelConfig,
			canWriteGroupAllowFrom: generatedSchemaAllowsGroupAllowFrom(channelName, CHANNEL_GROUP_ALLOW_FROM_PATH),
			channelName,
			changes,
			prefix: `channels.${channelName}`
		});
		const accounts = require_object.asObjectRecord(channelConfig.accounts);
		if (!accounts) continue;
		const canWriteAccountGroupAllowFrom = generatedSchemaAllowsGroupAllowFrom(channelName, ACCOUNT_GROUP_ALLOW_FROM_PATH);
		for (const [accountId, accountConfig] of Object.entries(accounts)) {
			const account = require_object.asObjectRecord(accountConfig);
			if (!account || isDisabled(account)) continue;
			migrateRecord({
				account,
				canWriteGroupAllowFrom: canWriteAccountGroupAllowFrom,
				channelName,
				changes,
				parent: channelConfig,
				parentHadGroupAllowFrom: hadGroupAllowFrom,
				prefix: `channels.${channelName}.accounts.${accountId}`
			});
		}
	}
	if (changes.length === 0) return {
		config: cfg,
		changes: []
	};
	return {
		config: next,
		changes
	};
}
//#endregion
//#region src/commands/doctor/shared/allowlist-policy-repair.ts
/** Restore missing allowFrom entries for allowlist DM policies from persisted pairing stores. */
async function maybeRepairAllowlistPolicyAllowFrom(cfg) {
	const channels = cfg.channels;
	if (!channels || typeof channels !== "object") return {
		config: cfg,
		changes: []
	};
	const next = structuredClone(cfg);
	const changes = [];
	const applyRecoveredAllowFrom = (params) => {
		const count = params.allowFrom.length;
		const noun = count === 1 ? "entry" : "entries";
		require_dm_access.setCanonicalDmAllowFrom({
			entry: params.account,
			mode: params.mode,
			allowFrom: params.allowFrom,
			pathPrefix: params.prefix,
			changes,
			reason: `restored ${count} sender ${noun} from pairing store (dmPolicy="allowlist").`
		});
	};
	const recoverAllowFromForAccount = async (params) => {
		const dmEntry = params.account.dm;
		const dm = dmEntry && typeof dmEntry === "object" && !Array.isArray(dmEntry) ? dmEntry : void 0;
		if ((params.account.dmPolicy ?? dm?.policy) !== "allowlist") return;
		const topAllowFrom = params.account.allowFrom;
		const nestedAllowFrom = dm?.allowFrom;
		if (require_empty_allowlist_scan.hasAllowFromEntries(topAllowFrom) || require_empty_allowlist_scan.hasAllowFromEntries(nestedAllowFrom)) return;
		const normalizedChannelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(require_ids.normalizeChatChannelId(params.channelName) ?? params.channelName);
		if (!normalizedChannelId) return;
		const normalizedAccountId = require_account_id.normalizeAccountId(params.accountId) || "default";
		const recovered = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(await require_pairing_store.readChannelAllowFromStore(normalizedChannelId, process.env, normalizedAccountId).catch(() => []));
		if (recovered.length === 0) return;
		applyRecoveredAllowFrom({
			account: params.account,
			allowFrom: recovered,
			mode: require_open_policy_allowfrom.resolveAllowFromMode(params.channelName),
			prefix: params.prefix
		});
	};
	const nextChannels = next.channels;
	for (const [channelName, channelConfig] of Object.entries(nextChannels)) {
		if (!channelConfig || typeof channelConfig !== "object") continue;
		if (channelConfig.enabled === false) continue;
		await recoverAllowFromForAccount({
			channelName,
			account: channelConfig,
			prefix: `channels.${channelName}`
		});
		const accounts = require_object.asObjectRecord(channelConfig.accounts);
		if (!accounts) continue;
		for (const [accountId, accountConfig] of Object.entries(accounts)) {
			if (!accountConfig || typeof accountConfig !== "object") continue;
			if (accountConfig.enabled === false) continue;
			await recoverAllowFromForAccount({
				channelName,
				account: accountConfig,
				accountId,
				prefix: `channels.${channelName}.accounts.${accountId}`
			});
		}
	}
	if (changes.length === 0) return {
		config: cfg,
		changes: []
	};
	return {
		config: next,
		changes
	};
}
//#endregion
//#region src/commands/doctor/shared/invalid-plugin-config.ts
const PLUGIN_CONFIG_ISSUE_RE = /^plugins\.entries\.([^.]+)\.config(?:\.|$)/;
function scanInvalidPluginConfig(cfg) {
	const validation = require_io.validateConfigObjectWithPlugins(cfg);
	if (validation.ok) return [];
	const hits = [];
	const seen = /* @__PURE__ */ new Set();
	for (const issue of validation.issues) {
		if (!issue.message.startsWith("invalid config:")) continue;
		const pluginId = issue.path.match(PLUGIN_CONFIG_ISSUE_RE)?.[1];
		if (!pluginId || seen.has(pluginId)) continue;
		seen.add(pluginId);
		hits.push({
			pluginId,
			pathLabel: `plugins.entries.${pluginId}.config`
		});
	}
	return hits;
}
/** Disable plugin entries and clear config when plugin validation marks their config invalid. */
function maybeRepairInvalidPluginConfig(cfg) {
	const hits = scanInvalidPluginConfig(cfg);
	if (hits.length === 0) return {
		config: cfg,
		changes: []
	};
	const next = structuredClone(cfg);
	const entries = require_object.asObjectRecord(next.plugins?.entries);
	if (!entries) return {
		config: cfg,
		changes: []
	};
	const quarantined = [];
	for (const hit of hits) {
		const entry = require_object.asObjectRecord(entries[hit.pluginId]);
		if (!entry) continue;
		if ("config" in entry) delete entry.config;
		entry.enabled = false;
		quarantined.push(hit.pluginId);
	}
	if (quarantined.length === 0) return {
		config: cfg,
		changes: []
	};
	return {
		config: next,
		changes: [require_ansi.sanitizeForLog(`- plugins.entries: quarantined ${quarantined.length} invalid plugin config${quarantined.length === 1 ? "" : "s"} (${quarantined.join(", ")})`)]
	};
}
//#endregion
//#region src/commands/doctor/repair-sequencing.ts
/** Run doctor auto-repairs in dependency order and collect sanitized user notes. */
async function runDoctorRepairSequence(params) {
	let state = params.state;
	const changeNotes = [];
	const warningNotes = [];
	const env = params.env ?? process.env;
	const sanitizeLines = (lines) => lines.map((line) => require_ansi.sanitizeForLog(line)).join("\n");
	const applyMutation = (mutation) => {
		if (mutation.changes.length > 0) {
			changeNotes.push(sanitizeLines(mutation.changes));
			state = require_config_mutation_state.applyDoctorConfigMutation({
				state,
				mutation,
				shouldRepair: true
			});
		}
		if (mutation.warnings && mutation.warnings.length > 0) warningNotes.push(sanitizeLines(mutation.warnings));
	};
	for (const mutation of await require_channel_doctor.collectChannelDoctorRepairMutations({
		cfg: state.candidate,
		doctorFixCommand: params.doctorFixCommand,
		env
	})) applyMutation(mutation);
	applyMutation(require_bundled_plugin_load_paths.maybeRepairBundledPluginLoadPaths(state.candidate, env));
	require_doctor_plugin_registry.maybeRepairStaleManagedNpmBundledPlugins({
		config: state.candidate,
		env,
		prompter: { shouldRepair: true }
	});
	await require_doctor_plugin_registry.maybeRepairManagedNpmOperatorPeerLinks({
		config: state.candidate,
		env,
		prompter: { shouldRepair: true }
	});
	const codexRouteRepair = require_codex_route_warnings.maybeRepairCodexRoutes({
		cfg: state.candidate,
		env,
		shouldRepair: true,
		blockedProviderPlan: params.blockedCodexProviderPlan
	});
	applyMutation({
		config: codexRouteRepair.cfg,
		changes: codexRouteRepair.changes,
		warnings: codexRouteRepair.warnings
	});
	applyMutation(require_doctor_auth_flat_profiles.maybeRepairOpenAICodexAuthConfig(state.candidate, { profileIdMap: require_doctor_auth_flat_profiles.collectOpenAICodexAuthProfileStoreIdMap({
		cfg: state.candidate,
		env
	}) }));
	applyMutation(await require_context_engine_host_compat.maybeRepairContextEngineHostCompatibility({
		cfg: state.candidate,
		doctorFixCommand: params.doctorFixCommand,
		env
	}));
	const missingConfiguredPluginInstallRepair = await require_missing_configured_plugin_install.repairMissingConfiguredPluginInstalls({
		cfg: state.candidate,
		env
	});
	if (missingConfiguredPluginInstallRepair.changes.length > 0) {
		changeNotes.push(sanitizeLines(missingConfiguredPluginInstallRepair.changes));
		applyMutation(require_plugin_auto_enable.applyPluginAutoEnable({
			config: state.candidate,
			env
		}));
		const repairedPluginIds = missingConfiguredPluginInstallRepair.repairedPluginIds ?? [];
		if (repairedPluginIds.length > 0) applyMutation(require_plugin_auto_enable.materializePluginAutoEnableCandidates({
			config: state.candidate,
			env,
			candidates: repairedPluginIds.map((pluginId) => ({
				pluginId,
				kind: "configured-plugin-repaired"
			}))
		}));
	}
	if (missingConfiguredPluginInstallRepair.warnings.length > 0) warningNotes.push(sanitizeLines(missingConfiguredPluginInstallRepair.warnings));
	const missingConfiguredPluginInstallNotices = missingConfiguredPluginInstallRepair.notices ?? [];
	if (missingConfiguredPluginInstallNotices.length > 0) warningNotes.push(sanitizeLines(missingConfiguredPluginInstallNotices));
	const failedPluginIds = missingConfiguredPluginInstallRepair.failedPluginIds ?? [];
	const hasUnscopedInstallRepairWarnings = missingConfiguredPluginInstallRepair.warnings.length > 0 && failedPluginIds.length === 0;
	if (!require_update_phase.isUpdatePackageSwapInProgress(env) && !hasUnscopedInstallRepairWarnings) applyMutation(require_stale_plugin_config.maybeRepairStalePluginConfig(state.candidate, env, {
		preservePluginIds: failedPluginIds,
		surfacePreservePluginIds: require_configured_runtime_plugin_installs.VERSION_BOUND_RUNTIME_PLUGIN_POLICY_IDS_BY_SURFACE
	}));
	applyMutation(maybeRepairInvalidPluginConfig(state.candidate));
	applyMutation(await maybeRepairAllowlistPolicyAllowFrom(state.candidate));
	applyMutation(require_open_policy_allowfrom.maybeRepairOpenPolicyAllowFrom(state.candidate));
	applyMutation(maybeRepairGroupAllowFromFallback(state.candidate));
	applyMutation(require_stale_subagent_allowlist.maybeRepairStaleSubagentAllowlists(state.candidate));
	const emptyAllowlistWarnings = require_empty_allowlist_scan.scanEmptyAllowlistPolicyWarnings(state.candidate, {
		doctorFixCommand: params.doctorFixCommand,
		...require_channel_doctor.createChannelDoctorEmptyAllowlistPolicyHooks({
			cfg: state.candidate,
			env
		})
	});
	if (emptyAllowlistWarnings.length > 0) warningNotes.push(sanitizeLines(emptyAllowlistWarnings));
	applyMutation(require_legacy_tools_by_sender.maybeRepairLegacyToolsBySenderKeys(state.candidate));
	applyMutation(require_exec_safe_bins.maybeRepairExecSafeBinProfiles(state.candidate));
	const pluginDependencyCleanup = await require_plugin_dependency_cleanup.cleanupLegacyPluginDependencyState({ env });
	if (pluginDependencyCleanup.changes.length > 0) changeNotes.push(sanitizeLines(pluginDependencyCleanup.changes));
	if (pluginDependencyCleanup.warnings.length > 0) warningNotes.push(sanitizeLines(pluginDependencyCleanup.warnings));
	const legacyOAuthSidecarRepair = await require_doctor_auth_oauth_sidecar.maybeRepairLegacyOAuthSidecarProfiles({
		cfg: state.candidate,
		prompter: { confirmAutoFix: async () => true },
		emitNotes: false,
		env
	});
	if (legacyOAuthSidecarRepair.changes.length > 0) changeNotes.push(sanitizeLines(legacyOAuthSidecarRepair.changes));
	if (legacyOAuthSidecarRepair.warnings.length > 0) warningNotes.push(sanitizeLines(legacyOAuthSidecarRepair.warnings));
	const openAIAuthProviderRepair = await require_doctor_auth_flat_profiles.maybeRepairOpenAICodexAuthProfileStores({
		cfg: state.candidate,
		env
	});
	if (openAIAuthProviderRepair.changes.length > 0) changeNotes.push(sanitizeLines(openAIAuthProviderRepair.changes));
	if (openAIAuthProviderRepair.warnings.length > 0) warningNotes.push(sanitizeLines(openAIAuthProviderRepair.warnings));
	const staleOAuthShadowRepair = await require_stale_oauth_profile_shadows.repairStaleOAuthProfileShadows({
		cfg: state.candidate,
		env
	});
	if (staleOAuthShadowRepair.changes.length > 0) changeNotes.push(sanitizeLines(staleOAuthShadowRepair.changes));
	if (staleOAuthShadowRepair.warnings.length > 0) warningNotes.push(sanitizeLines(staleOAuthShadowRepair.warnings));
	const authProfileSqliteMigration = await require_doctor_auth_flat_profiles.maybeMigrateAuthProfileJsonStoresToSqlite({
		cfg: state.candidate,
		prompter: { confirmAutoFix: async () => true },
		env
	});
	if (authProfileSqliteMigration.configChanged) state = require_config_mutation_state.applyDoctorConfigMutation({
		state,
		mutation: {
			config: state.candidate,
			changes: ["Auth profile SQLite migration updated auth.profiles."]
		},
		shouldRepair: true
	});
	if (authProfileSqliteMigration.changes.length > 0) changeNotes.push(sanitizeLines(authProfileSqliteMigration.changes));
	if (authProfileSqliteMigration.warnings.length > 0) warningNotes.push(sanitizeLines(authProfileSqliteMigration.warnings));
	applyMutation(require_stale_auth_order.maybeRepairStaleConfiguredAuthOrders({
		cfg: state.candidate,
		env
	}));
	const authProfilesRepaired = legacyOAuthSidecarRepair.changes.length > 0 || openAIAuthProviderRepair.changes.length > 0 || staleOAuthShadowRepair.changes.length > 0 || authProfileSqliteMigration.changes.length > 0;
	const activeToolSchemaWarnings = require_active_tool_schema_warnings.collectActiveToolSchemaProjectionWarnings({
		cfg: state.candidate,
		env
	});
	if (activeToolSchemaWarnings.length > 0) warningNotes.push(sanitizeLines(activeToolSchemaWarnings));
	return {
		state,
		changeNotes,
		warningNotes,
		authProfilesRepaired
	};
}
//#endregion
exports.runDoctorRepairSequence = runDoctorRepairSequence;
