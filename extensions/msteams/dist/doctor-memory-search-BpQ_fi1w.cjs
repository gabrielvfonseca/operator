const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_timeouts = require("./timeouts-CU8hB3Uw.cjs");
const require_plugin_state_store = require("./plugin-state-store-BnlgUGbF.cjs");
const require_provider_env_vars = require("./provider-env-vars-D_wXMNA1.cjs");
require("./openclaw-agent-db-CMNDs1oU.cjs");
const require_facade_runtime = require("./facade-runtime-BM8A5__s.cjs");
const require_windows_spawn = require("./windows-spawn-CxukckE5.cjs");
const require_source_check = require("./source-check-bi20wzmV.cjs");
const require_provider_local_service = require("./provider-local-service-BG5N87JZ.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_model_auth_env = require("./model-auth-env-C9t8YSK1.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
require("./query-expansion-F8rMGI-P.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_memory_runtime = require("./memory-runtime-Qfejy7hD.cjs");
const require_memory_search = require("./memory-search-CB0O7FbP.cjs");
require("./fs-utils-C3xuebRj.cjs");
require("./read-retry-B36vMBBL.cjs");
require("./legacy-config-record-shared-BiSUUJgn.cjs");
const require_doctor_workspace = require("./doctor-workspace-BL9MDwGb.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_child_process = require("node:child_process");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region packages/memory-host-sdk/src/host/qmd-process.ts
const DEFAULT_WINDOWS_SYSTEM_ROOT = "C:\\Windows";
function resolveQmdBinaryUnavailableReason(result) {
	return result.reason ?? "binary";
}
function resolveCliSpawnInvocation(params) {
	return require_windows_spawn.materializeWindowsSpawnProgram(require_windows_spawn.resolveWindowsSpawnProgram({
		command: params.command,
		platform: process.platform,
		env: params.env,
		execPath: process.execPath,
		packageName: params.packageName,
		allowShellFallback: false
	}), params.args);
}
async function checkQmdBinaryAvailability(params) {
	let spawnInvocation;
	try {
		spawnInvocation = resolveCliSpawnInvocation({
			command: params.command,
			args: [],
			env: params.env,
			packageName: "qmd"
		});
	} catch (err) {
		return {
			available: false,
			reason: "binary",
			error: formatQmdAvailabilityError(err)
		};
	}
	const cwd = params.cwd ?? process.cwd();
	const cwdError = validateQmdProbeCwd(cwd);
	if (cwdError) return cwdError;
	return await new Promise((resolve) => {
		let settled = false;
		let didSpawn = false;
		const finish = (result) => {
			if (settled) return;
			settled = true;
			if (timer) clearTimeout(timer);
			resolve(result);
		};
		const child = (0, node_child_process.spawn)(spawnInvocation.command, spawnInvocation.argv, {
			env: params.env,
			cwd,
			shell: spawnInvocation.shell,
			windowsHide: spawnInvocation.windowsHide,
			stdio: "ignore",
			detached: shouldUseQmdProcessGroup()
		});
		const timeoutMs = require_timeouts.resolveSafeTimeoutDelayMs(params.timeoutMs ?? 2e3, { minMs: 0 });
		const timer = setTimeout(() => {
			signalQmdProcessTree(child, "SIGKILL");
			finish({
				available: false,
				reason: "binary",
				error: `spawn ${params.command} timed out after ${timeoutMs}ms`
			});
		}, timeoutMs);
		child.once("error", (err) => {
			finish({
				available: false,
				reason: "binary",
				error: formatQmdAvailabilityError(err)
			});
		});
		child.once("spawn", () => {
			didSpawn = true;
			signalQmdProcessTree(child);
			finish({ available: true });
		});
		child.once("close", () => {
			if (!didSpawn) return;
			finish({ available: true });
		});
	});
}
function validateQmdProbeCwd(cwd) {
	try {
		if (!(0, node_fs.statSync)(cwd).isDirectory()) return {
			available: false,
			reason: "workspace-cwd",
			error: `workspace directory is not a directory: ${cwd}`
		};
		return null;
	} catch (err) {
		if (typeof err === "object" && err && "code" in err && err.code === "ENOENT") return {
			available: false,
			reason: "workspace-cwd",
			error: `workspace directory missing: ${cwd}`
		};
		return {
			available: false,
			reason: "workspace-cwd",
			error: `workspace directory unavailable: ${cwd} (${formatQmdAvailabilityError(err)})`
		};
	}
}
function shouldUseQmdProcessGroup() {
	return process.platform !== "win32";
}
function getEnvValueCaseInsensitive(env, expectedKey) {
	const direct = env[expectedKey];
	if (direct !== void 0) return direct;
	const expected = expectedKey.toUpperCase();
	const actualKey = Object.keys(env).find((key) => key.toUpperCase() === expected);
	return actualKey ? env[actualKey] : void 0;
}
function normalizeWindowsSystemRoot(raw) {
	const trimmed = raw?.trim();
	if (!trimmed || trimmed.includes("\0") || trimmed.includes("\r") || trimmed.includes("\n") || trimmed.includes(";")) return null;
	const normalized = node_path.default.win32.normalize(trimmed);
	if (!node_path.default.win32.isAbsolute(normalized) || normalized.startsWith("\\\\")) return null;
	const parsed = node_path.default.win32.parse(normalized);
	if (!/^[A-Za-z]:\\$/.test(parsed.root) || normalized.length <= parsed.root.length) return null;
	return normalized.replace(/[\\/]+$/, "");
}
function resolveWindowsTaskkillPath(env = process.env) {
	const systemRoot = normalizeWindowsSystemRoot(getEnvValueCaseInsensitive(env, "SystemRoot")) ?? normalizeWindowsSystemRoot(getEnvValueCaseInsensitive(env, "WINDIR")) ?? DEFAULT_WINDOWS_SYSTEM_ROOT;
	return node_path.default.win32.join(systemRoot, "System32", "taskkill.exe");
}
function signalQmdProcessTree(child, signal) {
	if (shouldUseQmdProcessGroup() && typeof child.pid === "number") try {
		if (signal === void 0) process.kill(-child.pid);
		else process.kill(-child.pid, signal);
		return;
	} catch {}
	if (!shouldUseQmdProcessGroup() && typeof child.pid === "number") {
		const taskkillPath = resolveWindowsTaskkillPath();
		const args = [
			"/PID",
			String(child.pid),
			"/T"
		];
		if (signal === "SIGKILL") args.push("/F");
		const result = (0, node_child_process.spawnSync)(taskkillPath, args, {
			stdio: "ignore",
			windowsHide: true
		});
		if (!result.error && result.status === 0) return;
		if (signal !== "SIGKILL") {
			const forceResult = (0, node_child_process.spawnSync)(taskkillPath, [...args, "/F"], {
				stdio: "ignore",
				windowsHide: true
			});
			if (!forceResult.error && forceResult.status === 0) return;
		}
	}
	if (signal === void 0) child.kill();
	else child.kill(signal);
}
function formatQmdAvailabilityError(err) {
	if (err instanceof Error && err.message) return err.message;
	return String(err);
}
//#endregion
//#region packages/memory-host-sdk/src/host/secret-input-utils.ts
const DEFAULT_SECRET_PROVIDER_ALIAS = "default";
const ENV_SECRET_REF_ID_RE = /^[A-Z][A-Z0-9_]{0,127}$/;
const LEGACY_SECRETREF_ENV_MARKER_PREFIX = "secretref-env:";
const ENV_SECRET_TEMPLATE_RE = /^\$\{([A-Z][A-Z0-9_]{0,127})\}$/;
const SECRET_REF_SOURCES = /* @__PURE__ */ new Set([
	"env",
	"file",
	"exec"
]);
/** Narrow unknown JSON config values to plain records. */
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Normalize literal secret strings and reject empty placeholders. */
function normalizeSecretInputString(value) {
	if (typeof value !== "string") return;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : void 0;
}
/** Narrow a string to a supported SecretRef source. */
function hasSecretRefSource(value) {
	return typeof value === "string" && SECRET_REF_SOURCES.has(value);
}
/** Narrow unknown values to non-empty strings. */
function hasNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}
/** Detect canonical three-field SecretRef objects. */
function isSecretRef(value) {
	if (!isRecord(value)) return false;
	return Object.keys(value).length === 3 && hasSecretRefSource(value.source) && hasNonEmptyString(value.provider) && hasNonEmptyString(value.id);
}
/** Detect legacy refs that predate explicit provider names. */
function isLegacySecretRefWithoutProvider(value) {
	if (!isRecord(value)) return false;
	return hasSecretRefSource(value.source) && hasNonEmptyString(value.id) && value.provider === void 0;
}
/** Parse env template shorthand such as "${OPENAI_API_KEY}". */
function parseEnvTemplateSecretRef(value) {
	if (typeof value !== "string") return null;
	const match = ENV_SECRET_TEMPLATE_RE.exec(value.trim());
	if (!match) return null;
	return {
		source: "env",
		provider: DEFAULT_SECRET_PROVIDER_ALIAS,
		id: match[1] ?? ""
	};
}
/** Parse legacy secretref-env markers from older config snapshots. */
function parseLegacySecretRefEnvMarker(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed.startsWith(LEGACY_SECRETREF_ENV_MARKER_PREFIX)) return null;
	const id = trimmed.slice(14);
	if (!ENV_SECRET_REF_ID_RE.test(id)) return null;
	return {
		source: "env",
		provider: DEFAULT_SECRET_PROVIDER_ALIAS,
		id
	};
}
/** Coerce all accepted shipped secret reference shapes to canonical SecretRef. */
function coerceSecretRef(value) {
	if (isSecretRef(value)) return value;
	if (isLegacySecretRefWithoutProvider(value)) return {
		source: value.source,
		provider: DEFAULT_SECRET_PROVIDER_ALIAS,
		id: value.id
	};
	return parseEnvTemplateSecretRef(value) ?? parseLegacySecretRefEnvMarker(value);
}
/** Return true when a secret input has either a literal value or resolvable reference shape. */
function hasConfiguredMemorySecretInputValue(value) {
	if (normalizeSecretInputString(value)) return true;
	return coerceSecretRef(value) !== null;
}
//#endregion
//#region packages/memory-host-sdk/src/host/secret-input.ts
/** Return true when a configured memory secret contains a literal value or reference. */
function hasConfiguredMemorySecretInput(value) {
	return hasConfiguredMemorySecretInputValue(value);
}
//#endregion
//#region src/plugin-sdk/memory-core-engine-runtime.ts
/**
* @deprecated Public SDK subpath has no bundled extension production imports.
* Prefer vendor-neutral memory-host SDK subpaths for new plugin code.
*/
function loadFacadeModule() {
	const module = require_facade_runtime.loadActivatedBundledPluginPublicSurfaceModuleSync({
		dirName: "memory-core",
		artifactBasename: "runtime-api.js"
	});
	module.configureMemoryCoreDreamingState((options) => require_plugin_state_store.createPluginStateKeyedStore("memory-core", options));
	return module;
}
require_provider_local_service.createConfiguredProviderLocalServiceAcquirer(require_io.getRuntimeConfig);
/** Audit short-term promotion artifacts in an agent workspace. */
const auditShortTermPromotionArtifacts = ((...args) => loadFacadeModule()["auditShortTermPromotionArtifacts"](...args));
/** Audit dreaming diary and session-corpus artifacts in an agent workspace. */
const auditDreamingArtifacts = ((...args) => loadFacadeModule()["auditDreamingArtifacts"](...args));
/** Repair invalid recall-store entries and stale short-term promotion locks. */
const repairShortTermPromotionArtifacts = ((...args) => loadFacadeModule()["repairShortTermPromotionArtifacts"](...args));
/** Repair or archive problematic dreaming artifacts. */
const repairDreamingArtifacts = ((...args) => loadFacadeModule()["repairDreamingArtifacts"](...args));
//#endregion
//#region src/commands/doctor-memory-search.ts
function formatRuntimeBytes(bytes) {
	return (0, _gabrielvfonseca_normalization_core.formatByteSize)(bytes, {
		style: "legacy-binary",
		maxUnit: "tera",
		separator: " ",
		fractionDigits: (value, unit) => unit === "byte" ? null : value >= 10 ? 0 : 1
	});
}
function formatLocalRuntimeDoctorNote(facts) {
	const backend = facts.backend ?? "unknown";
	const build = facts.buildType ? `, ${facts.buildType}` : "";
	const devices = facts.deviceNames?.length ? `\nDevices: ${facts.deviceNames.join(", ")}` : "";
	const memory = facts.memory ? `\nVRAM snapshot: ${formatRuntimeBytes(facts.memory.usedBytes)} used, ${formatRuntimeBytes(facts.memory.freeBytes)} free, ${formatRuntimeBytes(facts.memory.totalBytes)} total${facts.memory.unifiedBytes > 0 ? `, ${formatRuntimeBytes(facts.memory.unifiedBytes)} unified` : ""} (${new Date(facts.memory.observedAtMs).toISOString()})` : "";
	const offload = typeof facts.offload?.offloadedLayers === "number" && typeof facts.offload.totalLayers === "number" ? `\nGPU offload: ${facts.offload.offloadedLayers}/${facts.offload.totalLayers} layers` : facts.offload ? `\nGPU offload: ${facts.offload.supported ? "supported" : "unsupported"}` : "";
	const context = facts.context ? `\nRequested context: ${facts.context.requestedSize} tokens` : "";
	const loadError = facts.loadError ? `\nLoad error: ${facts.loadError}` : "";
	return `llama.cpp runtime: ${backend}${build}${facts.state === "ready" ? "" : ` (${facts.state})`}${devices}${memory}${offload}${context}${loadError}`;
}
const BUNDLED_MEMORY_EMBEDDING_PROVIDER_DOCTOR_METADATA = [
	{
		providerId: "github-copilot",
		authProviderId: "github-copilot",
		transport: "remote",
		autoSelectPriority: 15
	},
	{
		providerId: "openai",
		authProviderId: "openai",
		transport: "remote",
		autoSelectPriority: 20
	},
	{
		providerId: "gemini",
		authProviderId: "google",
		transport: "remote",
		autoSelectPriority: 30
	},
	{
		providerId: "voyage",
		authProviderId: "voyage",
		transport: "remote",
		autoSelectPriority: 40
	},
	{
		providerId: "mistral",
		authProviderId: "mistral",
		transport: "remote",
		autoSelectPriority: 50
	},
	{
		providerId: "bedrock",
		authProviderId: "amazon-bedrock",
		transport: "remote",
		autoSelectPriority: 60
	}
];
const DEFAULT_MEMORY_EMBEDDING_PROVIDER = "openai";
const OPENAI_COMPATIBLE_MEMORY_EMBEDDING_PROVIDER = "openai-compatible";
const OPENAI_COMPATIBLE_MODEL_APIS = /* @__PURE__ */ new Set(["openai-completions", "openai-responses"]);
function resolveMemoryEmbeddingProviderDoctorMetadata(providerId) {
	const metadata = BUNDLED_MEMORY_EMBEDDING_PROVIDER_DOCTOR_METADATA.find((candidate) => candidate.providerId === providerId) ?? null;
	if (!metadata) return null;
	return {
		...metadata,
		envVars: require_provider_env_vars.getProviderEnvVars(metadata.authProviderId)
	};
}
function listAutoSelectMemoryEmbeddingProviderDoctorMetadata() {
	return BUNDLED_MEMORY_EMBEDDING_PROVIDER_DOCTOR_METADATA.filter((provider) => typeof provider.autoSelectPriority === "number").toSorted((a, b) => (a.autoSelectPriority ?? 0) - (b.autoSelectPriority ?? 0)).map((provider) => ({
		providerId: provider.providerId,
		authProviderId: provider.authProviderId,
		transport: provider.transport,
		autoSelectPriority: provider.autoSelectPriority,
		envVars: require_provider_env_vars.getProviderEnvVars(provider.authProviderId)
	}));
}
function resolveSuggestedRemoteMemoryProvider() {
	return listAutoSelectMemoryEmbeddingProviderDoctorMetadata().find((provider) => provider.transport === "remote")?.providerId;
}
function hasConfiguredAwsSdkAuthForProvider(provider, cfg) {
	if ((0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(cfg.models?.providers, provider)?.auth === "aws-sdk") return true;
	return ((0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(cfg.auth?.order, provider) ?? (cfg.auth?.profiles ? Object.keys(cfg.auth.profiles) : [])).some((profileId) => require_order.isConfiguredAwsSdkAuthProfileForProvider({
		cfg,
		provider,
		profileId
	}));
}
function isOpenAICompatibleMemoryProvider(providerId, cfg) {
	const normalizedProviderId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	if (normalizedProviderId === OPENAI_COMPATIBLE_MEMORY_EMBEDDING_PROVIDER) return true;
	if (BUNDLED_MEMORY_EMBEDDING_PROVIDER_DOCTOR_METADATA.some((provider) => provider.providerId === normalizedProviderId)) return false;
	const providerConfig = (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(cfg.models?.providers, providerId);
	if (!providerConfig) return false;
	const api = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerConfig.api ?? "");
	if (api === OPENAI_COMPATIBLE_MEMORY_EMBEDDING_PROVIDER || OPENAI_COMPATIBLE_MODEL_APIS.has(api)) return true;
	return !api && Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerConfig.baseUrl));
}
function resolveOpenAICompatibleMemoryBaseUrl(providerId, cfg, remoteBaseUrl) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(remoteBaseUrl) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(cfg.models?.providers, providerId)?.baseUrl);
}
function isKeyOptionalMemoryProvider(providerId, cfg) {
	return providerId === "local" || providerId === "ollama" || providerId === "lmstudio" || isOpenAICompatibleMemoryProvider(providerId, cfg);
}
async function resolveRuntimeMemoryAuditContext(cfg) {
	const manager = (await require_memory_runtime.getActiveMemorySearchManager({
		cfg,
		agentId: require_agent_scope_config.resolveDefaultAgentId(cfg),
		purpose: "status"
	})).manager;
	if (!manager) return null;
	try {
		const status = manager.status();
		const customQmd = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(status.custom) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(status.custom.qmd) ? status.custom.qmd : null;
		return {
			workspaceDir: status.workspaceDir?.trim(),
			backend: status.backend,
			dbPath: status.dbPath,
			qmdCollections: typeof customQmd?.collections === "number" ? customQmd.collections : void 0
		};
	} finally {
		await manager.close?.().catch(() => void 0);
	}
}
function buildMemoryRecallIssueNote(audit) {
	if (audit.issues.length === 0) return null;
	const issueLines = audit.issues.map((issue) => `- ${issue.message}`);
	const guidance = audit.issues.some((issue) => issue.fixable) ? `Fix: ${require_command_format.formatCliCommand("openclaw doctor --fix")} or ${require_command_format.formatCliCommand("openclaw memory status --fix")}` : `Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`;
	return [
		"Memory recall artifacts need attention:",
		...issueLines,
		`Recall store: ${audit.storePath}`,
		guidance
	].join("\n");
}
function buildDreamingArtifactIssueNote(audit) {
	if (audit.issues.length === 0) return null;
	const issueLines = audit.issues.map((issue) => `- ${issue.message}`);
	const hasFixableIssue = audit.issues.some((issue) => issue.fixable);
	return [
		"Dreaming artifacts need attention:",
		...issueLines,
		`Dream corpus: ${audit.sessionCorpusDir}`,
		hasFixableIssue ? `Fix: ${require_command_format.formatCliCommand("openclaw doctor --fix")} or ${require_command_format.formatCliCommand("openclaw memory status --fix")}` : `Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
	].join("\n");
}
async function noteMemoryRecallHealth(cfg) {
	try {
		const context = await resolveRuntimeMemoryAuditContext(cfg);
		const workspaceDir = context?.workspaceDir?.trim();
		if (!workspaceDir) return;
		const message = buildMemoryRecallIssueNote(await auditShortTermPromotionArtifacts({
			workspaceDir,
			qmd: context?.backend === "qmd" ? {
				dbPath: context.dbPath,
				collections: context.qmdCollections
			} : void 0
		}));
		if (message) require_note.note(message, "Memory search");
		const dreamingMessage = buildDreamingArtifactIssueNote(await auditDreamingArtifacts({ workspaceDir }));
		if (dreamingMessage) require_note.note(dreamingMessage, "Memory search");
	} catch (err) {
		require_note.note(`Memory recall audit could not be completed: ${require_errors.formatErrorMessage(err)}`, "Memory search");
	}
}
async function maybeRepairMemoryRecallHealth(params) {
	await require_doctor_workspace.maybeRepairWorkspaceMemoryHealth(params);
	try {
		const context = await resolveRuntimeMemoryAuditContext(params.cfg);
		const workspaceDir = context?.workspaceDir?.trim();
		if (!workspaceDir) return;
		if ((await auditShortTermPromotionArtifacts({
			workspaceDir,
			qmd: context?.backend === "qmd" ? {
				dbPath: context.dbPath,
				collections: context.qmdCollections
			} : void 0
		})).issues.some((issue) => issue.fixable)) {
			if (await params.prompter.confirmRuntimeRepair({
				message: "Normalize memory recall artifacts and remove stale promotion locks?",
				initialValue: true
			})) {
				const repair = await repairShortTermPromotionArtifacts({ workspaceDir });
				if (repair.changed) {
					const removedOverflowEntries = repair.removedOverflowEntries ?? 0;
					const details = [repair.removedInvalidEntries > 0 ? `-${repair.removedInvalidEntries} invalid entries` : null, removedOverflowEntries > 0 ? `-${removedOverflowEntries} overflow entries` : null].filter(Boolean).join(", ");
					require_note.note([
						"Memory recall artifacts repaired:",
						repair.rewroteStore ? `- rewrote recall store${details ? ` (${details})` : ""}` : null,
						repair.removedStaleLock ? "- removed stale promotion lock" : null,
						`Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
					].filter(Boolean).join("\n"), "Doctor changes");
				}
			}
		}
		if (!(await auditDreamingArtifacts({ workspaceDir })).issues.some((issue) => issue.fixable)) return;
		if (!await params.prompter.confirmRuntimeRepair({
			message: "Archive contaminated dreaming artifacts and reset derived dream corpus state?",
			initialValue: true
		})) return;
		const dreamingRepair = await repairDreamingArtifacts({ workspaceDir });
		if (!dreamingRepair.changed) return;
		require_note.note([
			"Dreaming artifacts repaired:",
			dreamingRepair.archivedSessionCorpus ? "- archived session corpus" : null,
			dreamingRepair.archivedSessionIngestion ? "- archived session-ingestion state" : null,
			dreamingRepair.archivedDreamsDiary ? "- archived dream diary" : null,
			dreamingRepair.archiveDir ? `- archive dir: ${dreamingRepair.archiveDir}` : null,
			...dreamingRepair.warnings.map((warning) => `- warning: ${warning}`),
			`Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
		].filter(Boolean).join("\n"), "Doctor changes");
	} catch (err) {
		require_note.note(`Memory artifact repair could not be completed: ${require_errors.formatErrorMessage(err)}`, "Memory search");
	}
}
function hasActiveAlternateMemoryPluginSlot(cfg) {
	const plugins = require_config_state.normalizePluginsConfig(cfg.plugins);
	if (!plugins.enabled) return false;
	const memorySlot = plugins.slots.memory;
	if (typeof memorySlot !== "string" || memorySlot.length === 0) return false;
	if (memorySlot === require_config_activation_shared.defaultSlotIdForKey("memory")) return false;
	if (plugins.deny.includes(memorySlot)) return false;
	if (!Object.hasOwn(plugins.entries, memorySlot)) return false;
	const entry = plugins.entries[memorySlot];
	if (!entry || entry.enabled === false) return false;
	return entry.enabled === true || entry.config !== void 0;
}
/**
* Check whether memory search has a usable embedding provider.
* Runs as part of `openclaw doctor` — config-only checks where possible;
* may spawn a short-lived probe process when `memory.backend=qmd` to verify
* the configured `qmd` binary is available.
*/
async function noteMemorySearchHealth(cfg, opts) {
	const noteFn = opts?.noteFn ?? require_note.note;
	if (opts?.includeWorkspaceMemoryHealth !== false) await require_doctor_workspace.noteWorkspaceMemoryHealth(cfg);
	const agentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const agentDir = require_agent_scope_config.resolveAgentDir(cfg, agentId);
	const resolved = require_memory_search.resolveMemorySearchConfig(cfg, agentId);
	const hasRemoteApiKey = hasConfiguredMemorySecretInput(resolved?.remote?.apiKey);
	if (!resolved) {
		noteFn("Memory search is explicitly disabled (enabled: false).", "Memory search");
		return;
	}
	const provider = resolved.provider === "auto" ? DEFAULT_MEMORY_EMBEDDING_PROVIDER : resolved.provider;
	const backendConfig = require_memory_runtime.resolveActiveMemoryBackendConfig({
		cfg,
		agentId
	});
	if (!backendConfig) {
		if (opts?.gatewayMemoryProbe?.checked && opts.gatewayMemoryProbe.ready) return;
		if (hasActiveAlternateMemoryPluginSlot(cfg)) return;
		noteFn("No active memory plugin is registered for the current config.", "Memory search");
		return;
	}
	if (backendConfig.backend === "qmd") {
		if (opts?.skipQmdBinaryProbe !== true) {
			const qmdCheck = await checkQmdBinaryAvailability({
				command: backendConfig.qmd?.command ?? "qmd",
				env: process.env,
				cwd: require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId)
			});
			if (!qmdCheck.available) {
				const workspaceProbeFailed = resolveQmdBinaryUnavailableReason(qmdCheck) === "workspace-cwd";
				const probeError = qmdCheck.error.trim();
				noteFn([
					workspaceProbeFailed ? "QMD memory backend is configured, but the agent workspace directory could not be used for the QMD startup probe." : `QMD memory backend is configured, but the qmd binary could not be started (${backendConfig.qmd?.command ?? "qmd"}).`,
					probeError ? `Probe error: ${probeError}` : null,
					"",
					"Fix (pick one):",
					workspaceProbeFailed ? "- Create the missing workspace directory or update the agent workspace path to an existing directory." : "- Install the supported QMD package: npm install -g @tobilu/qmd (or bun install -g @tobilu/qmd)",
					workspaceProbeFailed ? "- Verify the resolved workspace path for the affected agent before retrying." : `- Set an explicit binary path: ${require_command_format.formatCliCommand("openclaw config set memory.qmd.command /absolute/path/to/qmd")}`,
					`- Or switch back to builtin memory: ${require_command_format.formatCliCommand("openclaw config set memory.backend builtin")}`,
					"",
					`Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
				].filter(Boolean).join("\n"), "Memory search");
			}
		}
		if (resolved.sources?.includes("sessions") && cfg.memory?.qmd?.sessions?.enabled !== true) noteFn([
			"QMD memory backend is configured and the default agent resolves memorySearch.sources with sessions,",
			"but QMD session transcript export is not enabled (memory.qmd.sessions.enabled is not true).",
			"Session transcript hits will not appear in QMD-backed memory search until QMD session export is enabled.",
			"",
			"Fix (pick one):",
			`- Enable QMD session export: ${require_command_format.formatCliCommand("openclaw config set memory.qmd.sessions.enabled true")}`,
			"- Or remove sessions from the default agent's memorySearch.sources if QMD session recall is not intended.",
			"",
			`Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
		].join("\n"), "Memory search");
		return;
	}
	if (provider === "none") return;
	if (provider === "local") {
		const suggestedRemoteProvider = resolveSuggestedRemoteMemoryProvider();
		const runtimeFacts = opts?.gatewayMemoryProbe?.runtimeFacts;
		if (opts?.gatewayMemoryProbe?.checked && opts.gatewayMemoryProbe.ready) {
			if (runtimeFacts) noteFn(formatLocalRuntimeDoctorNote(runtimeFacts), "Memory search");
			return;
		}
		const hasExplicitLocalModel = hasLocalEmbeddings(resolved.local ?? {});
		const hasUnavailableConfiguredLocalModel = Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolved.local?.modelPath)) && !hasExplicitLocalModel;
		if (opts?.gatewayMemoryProbe?.skipped && !hasUnavailableConfiguredLocalModel) return;
		const detail = opts?.gatewayMemoryProbe?.error?.trim();
		const gatewayDetail = detail && detail !== runtimeFacts?.loadError ? detail : null;
		noteFn([
			runtimeFacts ? formatLocalRuntimeDoctorNote(runtimeFacts) : null,
			runtimeFacts ? "" : null,
			hasExplicitLocalModel ? "Memory search provider is set to \"local\" and a local model path is configured, but local embeddings are not confirmed ready." : "Memory search provider is set to \"local\", but local embeddings are not confirmed ready.",
			gatewayDetail ? `Gateway probe: ${gatewayDetail}` : null,
			"",
			"Fix (pick one):",
			`- Install the llama.cpp provider plugin: ${require_command_format.formatCliCommand("openclaw plugins install @gabrielvfonseca/llama-cpp-provider")}`,
			`- Set a local GGUF model path in config`,
			suggestedRemoteProvider ? `- Switch to a remote provider: ${require_command_format.formatCliCommand(`openclaw config set agents.defaults.memorySearch.provider ${suggestedRemoteProvider}`)}` : `- Switch to a remote embedding provider in config`,
			"",
			`Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
		].filter(Boolean).join("\n"), "Memory search");
		return;
	}
	if (isOpenAICompatibleMemoryProvider(provider, cfg) && !resolveOpenAICompatibleMemoryBaseUrl(provider, cfg, resolved.remote?.baseUrl)) {
		noteFn([
			`Memory search provider is set to "${provider}" but no OpenAI-compatible embeddings endpoint was configured.`,
			"Set agents.defaults.memorySearch.remote.baseUrl to the /v1 endpoint for your embeddings server.",
			"",
			"Fix:",
			`- ${require_command_format.formatCliCommand("openclaw config set agents.defaults.memorySearch.remote.baseUrl http://127.0.0.1:1234/v1")}`,
			"",
			`Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
		].join("\n"), "Memory search");
		return;
	}
	if (isOpenAICompatibleMemoryProvider(provider, cfg) && !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolved.model)) {
		noteFn([
			`Memory search provider is set to "${provider}" but no OpenAI-compatible embedding model was configured.`,
			"Set agents.defaults.memorySearch.model to the embedding model id your server expects.",
			"",
			"Fix:",
			`- ${require_command_format.formatCliCommand("openclaw config set agents.defaults.memorySearch.model text-embedding-bge-m3")}`,
			"",
			`Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
		].join("\n"), "Memory search");
		return;
	}
	if (isKeyOptionalMemoryProvider(provider, cfg)) {
		if (opts?.gatewayMemoryProbe?.checked && opts.gatewayMemoryProbe.ready) return;
		if (opts?.gatewayMemoryProbe?.skipped) return;
		const gatewayProbeWarning = buildGatewayProbeWarning(opts?.gatewayMemoryProbe);
		noteFn([
			gatewayProbeWarning ? `Memory search provider "${provider}" is configured, but the gateway reports embeddings are not ready.` : `Memory search provider "${provider}" is configured, but the gateway could not confirm embeddings are ready.`,
			gatewayProbeWarning,
			`Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
		].filter(Boolean).join("\n"), "Memory search");
		return;
	}
	if (hasRemoteApiKey || await hasApiKeyForProvider(provider, cfg, agentDir, { skipProfileResolution: opts?.skipAuthProfileResolution === true })) return;
	if (opts?.gatewayMemoryProbe?.checked && opts.gatewayMemoryProbe.ready) {
		noteFn([
			`Memory search provider is set to "${provider}" but the API key was not found in the CLI environment.`,
			"The running gateway reports memory embeddings are ready for the default agent.",
			`Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
		].join("\n"), "Memory search");
		return;
	}
	const gatewayProbeWarning = buildGatewayProbeWarning(opts?.gatewayMemoryProbe);
	const envVar = resolvePrimaryMemoryProviderEnvVar(provider);
	noteFn([
		`Memory search provider is set to "${provider}" but no API key was found.`,
		`Semantic recall will not work without a valid API key.`,
		gatewayProbeWarning ? gatewayProbeWarning : null,
		"",
		"Fix (pick one):",
		`- Set ${envVar} in your environment`,
		`- Configure credentials: ${require_command_format.formatCliCommand("openclaw configure --section model")}`,
		`- To disable: ${require_command_format.formatCliCommand("openclaw config set agents.defaults.memorySearch.enabled false")}`,
		"",
		`Verify: ${require_command_format.formatCliCommand("openclaw memory status --deep")}`
	].join("\n"), "Memory search");
}
/**
* Check whether local embeddings are available.
*
*/
function hasLocalEmbeddings(local) {
	const modelPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(local.modelPath);
	if (!modelPath) return false;
	if (/^(hf:|https?:)/i.test(modelPath)) return true;
	const resolved = require_home_dir.resolveUserPath(modelPath);
	try {
		return node_fs.default.statSync(resolved).isFile();
	} catch {
		return false;
	}
}
async function hasApiKeyForProvider(provider, cfg, agentDir, opts) {
	const authProviderId = resolveMemoryEmbeddingProviderDoctorMetadata(provider)?.authProviderId ?? provider;
	if (require_model_auth_env.resolveEnvApiKey(authProviderId) || require_model_auth.resolveUsableCustomProviderApiKey({
		cfg,
		provider: authProviderId
	})) return true;
	if (opts?.skipProfileResolution === true) {
		if (authProviderId === "amazon-bedrock") return hasConfiguredAwsSdkAuthForProvider(authProviderId, cfg);
		const orderedProfileIds = (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(cfg.auth?.order, authProviderId);
		return orderedProfileIds === void 0 ? require_source_check.hasAuthProfileStoreSourceForProvider(authProviderId, agentDir) : require_source_check.hasAuthProfileStoreSourceForProvider(authProviderId, agentDir, { profileIds: orderedProfileIds });
	}
	if (authProviderId !== "amazon-bedrock" && !require_source_check.hasAnyAuthProfileStoreSource(agentDir)) return false;
	try {
		await require_model_auth.resolveApiKeyForProvider({
			provider: authProviderId,
			cfg,
			agentDir
		});
		return true;
	} catch {
		return false;
	}
}
function resolvePrimaryMemoryProviderEnvVar(provider) {
	if (provider === "openai") return "OPENAI_API_KEY";
	return resolveMemoryEmbeddingProviderDoctorMetadata(provider)?.envVars[0] ?? `${provider.toUpperCase()}_API_KEY`;
}
function buildGatewayProbeWarning(probe) {
	if (!probe?.checked || probe.ready) return null;
	const detail = probe.error?.trim();
	return detail ? `Gateway memory probe for default agent is not ready: ${detail}` : "Gateway memory probe for default agent is not ready.";
}
//#endregion
exports.maybeRepairMemoryRecallHealth = maybeRepairMemoryRecallHealth;
exports.noteMemoryRecallHealth = noteMemoryRecallHealth;
exports.noteMemorySearchHealth = noteMemorySearchHealth;
