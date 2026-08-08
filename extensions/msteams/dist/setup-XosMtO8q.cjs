const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
require("./config-DT0qiglW.cjs");
const require_file_lock = require("./file-lock-BhHrzsWW.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_prompts = require("./prompts-DyiRjrc3.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_status = require("./status-pSULYkKm.cjs");
const require_onboarding_plugin_install = require("./onboarding-plugin-install-BVkG7njW.cjs");
const require_setup_secret_input = require("./setup.secret-input-BaApiN1b.cjs");
const require_setup_shared = require("./setup.shared-DaBRSpRV.cjs");
const require_migration = require("./migration-ty5IFml7.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/wizard/navigation-prompter.ts
function inertProgress() {
	return {
		update: () => {},
		stop: () => {}
	};
}
function stableKey(value) {
	if (value === void 0) return "undefined";
	try {
		return JSON.stringify(value);
	} catch {
		return Object.prototype.toString.call(value);
	}
}
function optionSignature(options) {
	return stableKey(options.map((option) => [stableKey(option.value), option.label]));
}
function buildPromptSignature(kind, params) {
	return stableKey({
		kind,
		message: params.message,
		options: params.options ? optionSignature(params.options) : void 0,
		layout: params.layout
	});
}
function applyNavigation(params, navigation) {
	return {
		...params,
		navigation
	};
}
var WizardPromptNavigator = class {
	constructor(base) {
		this.base = base;
		this.cursor = 0;
		this.restartRequested = false;
		this.backNavigationDisabled = false;
		this.records = [];
		this.prompter = {
			intro: async (title) => {
				if (!this.shouldSuppressOutput()) await this.base.intro(title);
			},
			outro: async (message) => {
				if (!this.shouldSuppressOutput()) await this.base.outro(message);
			},
			note: async (message, title) => {
				if (!this.shouldSuppressOutput()) await this.base.note(message, title);
			},
			plain: async (message) => {
				if (!this.shouldSuppressOutput()) await this.base.plain?.(message);
			},
			select: async (params) => await this.prompt({
				kind: "select",
				params,
				signature: buildPromptSignature("select", params),
				cacheAnswer: true,
				withInitial: (nextParams, answer) => ({
					...nextParams,
					initialValue: answer
				}),
				call: (nextParams) => this.base.select(nextParams)
			}),
			multiselect: async (params) => await this.prompt({
				kind: "multiselect",
				params,
				signature: buildPromptSignature("multiselect", params),
				cacheAnswer: true,
				withInitial: (nextParams, answer) => ({
					...nextParams,
					initialValues: Array.isArray(answer) ? answer : nextParams.initialValues
				}),
				call: (nextParams) => this.base.multiselect(nextParams)
			}),
			text: async (params) => await this.prompt({
				kind: "text",
				params,
				signature: buildPromptSignature("text", params),
				cacheAnswer: params.sensitive !== true,
				withInitial: (nextParams, answer) => ({
					...nextParams,
					initialValue: typeof answer === "string" ? answer : nextParams.initialValue
				}),
				call: (nextParams) => this.base.text(nextParams)
			}),
			confirm: async (params) => await this.prompt({
				kind: "confirm",
				params,
				signature: buildPromptSignature("confirm", params),
				cacheAnswer: true,
				withInitial: (nextParams, answer) => ({
					...nextParams,
					initialValue: typeof answer === "boolean" ? answer : nextParams.initialValue
				}),
				call: (nextParams) => this.base.confirm(nextParams)
			}),
			progress: (label) => this.shouldSuppressOutput() ? inertProgress() : this.base.progress(label),
			disableBackNavigation: () => {
				this.backNavigationDisabled = true;
				this.targetIndex = void 0;
			}
		};
	}
	beginPass() {
		this.cursor = 0;
		this.restartRequested = false;
	}
	hasRestartRequest() {
		return this.restartRequested;
	}
	shouldSuppressOutput() {
		return this.targetIndex !== void 0 && this.cursor <= this.targetIndex;
	}
	matchingRecord(index, kind, signature) {
		const record = this.records[index];
		if (!record) return;
		if (record.kind === kind && record.signature === signature) return record;
		this.records.splice(index);
		if (this.targetIndex !== void 0 && index < this.targetIndex) this.targetIndex = void 0;
	}
	remember(index, request, answer) {
		if (!request.cacheAnswer) {
			this.records[index] = void 0;
			this.records.splice(index + 1);
			return;
		}
		const answerKey = stableKey(answer);
		const previous = this.records[index];
		this.records[index] = {
			kind: request.kind,
			signature: request.signature,
			answer,
			answerKey
		};
		if (!previous || previous.answerKey !== answerKey || previous.signature !== request.signature) this.records.splice(index + 1);
	}
	async prompt(request) {
		const index = this.cursor;
		const record = this.matchingRecord(index, request.kind, request.signature);
		if (this.targetIndex !== void 0 && index < this.targetIndex && record) {
			this.cursor = index + 1;
			return record.answer;
		}
		const paramsWithNavigation = applyNavigation(record ? request.withInitial(request.params, record.answer) : request.params, {
			canGoBack: !this.backNavigationDisabled && index > 0,
			canGoForward: record !== void 0
		});
		try {
			const answer = await request.call(paramsWithNavigation);
			this.remember(index, request, answer);
			this.cursor = index + 1;
			if (this.targetIndex !== void 0 && index >= this.targetIndex) this.targetIndex = void 0;
			return answer;
		} catch (error) {
			if (error instanceof require_prompts.WizardNavigationError) {
				if (error.direction === "forward" && record) {
					this.cursor = index + 1;
					this.targetIndex = void 0;
					return record.answer;
				}
				if (error.direction === "back" && !this.backNavigationDisabled && index > 0) {
					this.targetIndex = index - 1;
					this.restartRequested = true;
				}
			}
			throw error;
		}
	}
};
async function runWizardWithPromptNavigation(basePrompter, runner) {
	const navigator = new WizardPromptNavigator(basePrompter);
	while (true) {
		navigator.beginPass();
		try {
			await runner(navigator.prompter);
			return;
		} catch (error) {
			if (error instanceof require_prompts.WizardNavigationError && error.direction === "back" && navigator.hasRestartRequest()) continue;
			throw error;
		}
	}
}
//#endregion
//#region src/wizard/setup.migration-recovery.ts
const SETUP_MIGRATION_ATTEMPT_FILE = "onboarding-attempt.json";
const SETUP_MIGRATION_ATTEMPT_VERSION = 1;
/** Hermes enumerates its replay inputs and has idempotent or conflict-checked item writes. */
function setupMigrationProviderSupportsRecovery(providerId) {
	return providerId === "hermes";
}
function buildPathHash(value) {
	return node_crypto.default.createHash("sha256").update(value).digest("hex");
}
function buildSourceHash(source) {
	return buildPathHash(node_path.default.resolve(require_home_dir.resolveUserPath(source.trim())));
}
function buildWorkspaceHash(workspaceDir) {
	return buildPathHash(node_path.default.resolve(workspaceDir));
}
function canonicalizeJsonValue$1(value) {
	if (Array.isArray(value)) return value.map(canonicalizeJsonValue$1);
	if (!value || typeof value !== "object") return value;
	const record = value;
	return Object.fromEntries(Object.keys(record).toSorted().filter((key) => record[key] !== void 0).map((key) => [key, canonicalizeJsonValue$1(record[key])]));
}
function buildMigrationItemFingerprint(item) {
	const { status: _status, reason: _reason, ...identity } = item;
	return buildPathHash(JSON.stringify(canonicalizeJsonValue$1(identity)));
}
function buildMigrationPlanFingerprint(plan) {
	return buildPathHash(JSON.stringify(canonicalizeJsonValue$1({
		providerId: plan.providerId,
		source: plan.source,
		target: plan.target,
		metadata: plan.metadata
	})));
}
function isMigrationItemStatus(value) {
	return value === "planned" || value === "migrated" || value === "skipped" || value === "warning" || value === "conflict" || value === "error";
}
function isSetupMigrationAttemptItem(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const item = value;
	return typeof item.id === "string" && typeof item.fingerprint === "string" && /^[a-f0-9]{64}$/.test(item.fingerprint) && (item.resultStatus === void 0 || isMigrationItemStatus(item.resultStatus));
}
function isSetupMigrationAttempt(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const record = value;
	return record.version === SETUP_MIGRATION_ATTEMPT_VERSION && typeof record.providerId === "string" && typeof record.sourceHash === "string" && /^[a-f0-9]{64}$/.test(record.sourceHash) && typeof record.sourceSnapshotHash === "string" && /^[a-f0-9]{64}$/.test(record.sourceSnapshotHash) && typeof record.workspaceHash === "string" && /^[a-f0-9]{64}$/.test(record.workspaceHash) && typeof record.planFingerprint === "string" && /^[a-f0-9]{64}$/.test(record.planFingerprint) && Array.isArray(record.items) && record.items.every(isSetupMigrationAttemptItem) && typeof record.itemStatusesCaptured === "boolean" && typeof record.targetSnapshotHashPrepared === "string" && /^[a-f0-9]{64}$/.test(record.targetSnapshotHashPrepared) && typeof record.targetSnapshotHashBefore === "string" && /^[a-f0-9]{64}$/.test(record.targetSnapshotHashBefore) && (record.targetSnapshotHashAfter === void 0 || typeof record.targetSnapshotHashAfter === "string" && /^[a-f0-9]{64}$/.test(record.targetSnapshotHashAfter)) && (record.status === "applying" || record.status === "failed" || record.status === "succeeded") && (record.status !== "failed" || record.targetSnapshotHashAfter !== void 0) && typeof record.startedAt === "string" && typeof record.updatedAt === "string";
}
function isMissingPathError$1(error) {
	return error?.code === "ENOENT";
}
function createSetupMigrationAttempt(params, now = /* @__PURE__ */ new Date()) {
	const timestamp = now.toISOString();
	const previousItems = params.previousAttempt?.items;
	return {
		version: SETUP_MIGRATION_ATTEMPT_VERSION,
		providerId: params.providerId,
		sourceHash: buildSourceHash(params.source),
		sourceSnapshotHash: params.sourceSnapshotHash,
		workspaceHash: buildWorkspaceHash(params.workspaceDir),
		planFingerprint: buildMigrationPlanFingerprint(params.plan),
		items: params.plan.items.map((item, index) => {
			const fingerprint = buildMigrationItemFingerprint(item);
			const previous = previousItems?.[index];
			return {
				id: item.id,
				fingerprint,
				...previous?.id === item.id && previous.fingerprint === fingerprint ? { resultStatus: previous.resultStatus } : {}
			};
		}),
		itemStatusesCaptured: false,
		targetSnapshotHashPrepared: params.preparedTargetSnapshotHash ?? params.targetSnapshotHash,
		targetSnapshotHashBefore: params.targetSnapshotHash,
		status: "applying",
		startedAt: timestamp,
		updatedAt: timestamp
	};
}
async function writeSetupMigrationAttempt(params) {
	const resultItems = params.result?.items;
	const itemStatusesCaptured = resultItems?.length === params.attempt.items.length && resultItems.every((item, index) => item.id === params.attempt.items[index]?.id);
	const items = itemStatusesCaptured ? params.attempt.items.map((item, index) => ({
		...item,
		resultStatus: item.resultStatus === "migrated" && resultItems?.[index]?.status === "skipped" ? "migrated" : resultItems?.[index]?.status
	})) : params.attempt.items;
	await (0, _openclaw_fs_safe_json.writeJson)(node_path.default.join(params.reportDir, SETUP_MIGRATION_ATTEMPT_FILE), {
		...params.attempt,
		items,
		itemStatusesCaptured,
		...params.targetSnapshotHash ? { targetSnapshotHashAfter: params.targetSnapshotHash } : {},
		status: params.status,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	}, {
		mode: 384,
		dirMode: 448,
		trailingNewline: true
	});
}
/** Runs provider apply while durably recording completion or a safe retry boundary. */
async function runSetupMigrationAttempt(params) {
	await writeSetupMigrationAttempt({
		reportDir: params.reportDir,
		attempt: params.attempt,
		status: "applying"
	});
	let result;
	try {
		result = await params.apply();
		params.assertSucceeded(result);
	} catch (error) {
		try {
			await writeSetupMigrationAttempt({
				reportDir: params.reportDir,
				attempt: params.attempt,
				status: "failed",
				result,
				targetSnapshotHash: await params.readTargetSnapshot()
			});
		} catch (recoveryError) {
			throw new AggregateError([error, recoveryError], "Migration import failed and its retry record could not be updated.", { cause: recoveryError });
		}
		throw error;
	}
	await writeSetupMigrationAttempt({
		reportDir: params.reportDir,
		attempt: params.attempt,
		status: "succeeded",
		result
	});
	return result;
}
async function findLatestSetupMigrationAttempt(params) {
	const providerReportRoot = node_path.default.join(params.stateDir, "migration", params.providerId);
	let entries;
	try {
		entries = await node_fs_promises.default.readdir(providerReportRoot, { withFileTypes: true });
	} catch (error) {
		if (isMissingPathError$1(error)) return;
		throw error;
	}
	for (const entry of entries.filter((candidate) => candidate.isDirectory()).toSorted((left, right) => left.name < right.name ? 1 : left.name > right.name ? -1 : 0)) {
		const recordPath = node_path.default.join(providerReportRoot, entry.name, SETUP_MIGRATION_ATTEMPT_FILE);
		let value;
		try {
			value = await (0, _openclaw_fs_safe_json.readJsonIfExists)(recordPath);
		} catch (error) {
			throw new Error(`Invalid onboarding migration recovery record: ${recordPath}`, { cause: error });
		}
		if (value === null) continue;
		if (!isSetupMigrationAttempt(value)) throw new Error(`Invalid onboarding migration recovery record: ${recordPath}`);
		if (value.providerId === params.providerId && params.matches(value)) return value;
	}
}
/** Allows retry only while the target still matches the recorded attempt boundary. */
async function resolveSetupMigrationRecovery(params) {
	const workspaceHash = buildWorkspaceHash(params.workspaceDir);
	const attempt = await findLatestSetupMigrationAttempt({
		stateDir: params.stateDir,
		providerId: params.providerId,
		matches: (candidate) => candidate.workspaceHash === workspaceHash
	});
	if (!attempt || attempt.status === "succeeded") return { kind: "none" };
	if (attempt.status === "applying") return attempt.targetSnapshotHashPrepared === params.targetSnapshotHash || attempt.targetSnapshotHashBefore === params.targetSnapshotHash ? {
		kind: "recoverable",
		attempt
	} : { kind: "none" };
	if (attempt.targetSnapshotHashAfter !== params.targetSnapshotHash) return { kind: "none" };
	return attempt.itemStatusesCaptured || attempt.targetSnapshotHashPrepared === params.targetSnapshotHash || attempt.targetSnapshotHashBefore === params.targetSnapshotHash ? {
		kind: "recoverable",
		attempt
	} : { kind: "none" };
}
function setupMigrationAttemptMatchesSource(attempt, source) {
	return attempt.sourceHash === buildSourceHash(source);
}
/** Reuses an unchanged plan while suppressing items already completed by the failed run. */
function prepareSetupMigrationRetryPlan(plan, attempt, sourceSnapshotHash) {
	if (attempt.sourceSnapshotHash !== sourceSnapshotHash) throw new Error("Migration source changed since the failed attempt. Review it before starting a new import.");
	if (attempt.planFingerprint !== buildMigrationPlanFingerprint(plan)) throw new Error("Migration retry plan context changed since the failed attempt. Review it before retrying.");
	if (plan.items.length !== attempt.items.length || plan.items.some((item, index) => {
		const previous = attempt.items[index];
		return !previous || previous.id !== item.id || previous.fingerprint !== buildMigrationItemFingerprint(item);
	})) throw new Error("Migration retry plan changed since the failed attempt. Review the source and target before retrying.");
	const items = plan.items.map((item, index) => {
		if (attempt.items[index]?.resultStatus !== "migrated" || item.action === "archive") return item;
		return {
			...item,
			status: "skipped",
			reason: "already completed by the previous onboarding import attempt"
		};
	});
	return {
		...plan,
		items,
		summary: require_migration.summarizeMigrationItems(items)
	};
}
//#endregion
//#region src/wizard/setup.migration-snapshot.ts
const SETUP_MIGRATION_LOCK_OPTIONS = {
	retries: {
		retries: 60,
		factor: 1,
		minTimeout: 500,
		maxTimeout: 500
	},
	stale: 1800 * 1e3,
	staleRecovery: "remove-if-unchanged"
};
const MEANINGFUL_CONFIG_IGNORED_KEYS = /* @__PURE__ */ new Set(["$schema", "meta"]);
const MEANINGFUL_WIZARD_CONFIG_IGNORED_KEYS = /* @__PURE__ */ new Set(["securityAcknowledgedAt"]);
const MEANINGFUL_WORKSPACE_ENTRIES = [
	"AGENTS.md",
	"SOUL.md",
	"USER.md",
	"IDENTITY.md",
	"MEMORY.md",
	"skills"
];
const MEANINGFUL_STATE_ENTRIES = [
	"credentials",
	"sessions",
	"agents"
];
function isMissingPathError(error) {
	return error?.code === "ENOENT";
}
function canonicalizeJsonValue(value) {
	if (Array.isArray(value)) return value.map(canonicalizeJsonValue);
	if (!value || typeof value !== "object") return value;
	const record = value;
	return Object.fromEntries(Object.keys(record).toSorted().filter((key) => record[key] !== void 0).map((key) => [key, canonicalizeJsonValue(record[key])]));
}
async function exists(candidate) {
	try {
		await node_fs_promises.default.access(candidate);
		return true;
	} catch {
		return false;
	}
}
async function hasDirectoryEntries(candidate) {
	try {
		return (await node_fs_promises.default.readdir(candidate)).length > 0;
	} catch {
		return false;
	}
}
function hasMeaningfulWizardConfig(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return true;
	return Object.keys(value).some((key) => !MEANINGFUL_WIZARD_CONFIG_IGNORED_KEYS.has(key));
}
function hasMeaningfulConfig(config) {
	return Object.entries(config).some(([key, value]) => {
		if (MEANINGFUL_CONFIG_IGNORED_KEYS.has(key)) return false;
		return key === "wizard" ? hasMeaningfulWizardConfig(value) : true;
	});
}
function buildSetupMigrationSnapshotConfig(config) {
	const snapshot = {};
	for (const [key, value] of Object.entries(config)) {
		if (MEANINGFUL_CONFIG_IGNORED_KEYS.has(key)) continue;
		if (key !== "wizard" || !value || typeof value !== "object" || Array.isArray(value)) {
			snapshot[key] = value;
			continue;
		}
		const wizard = Object.fromEntries(Object.entries(value).filter(([wizardKey]) => !MEANINGFUL_WIZARD_CONFIG_IGNORED_KEYS.has(wizardKey)));
		if (Object.keys(wizard).length > 0) snapshot[key] = wizard;
	}
	return snapshot;
}
async function inspectSetupMigrationFreshness(params) {
	const reasons = [];
	if (hasMeaningfulConfig(params.baseConfig)) reasons.push("existing config values are loaded");
	for (const entry of MEANINGFUL_WORKSPACE_ENTRIES) if (await exists(node_path.default.join(params.workspaceDir, entry))) reasons.push(`workspace ${entry} exists`);
	for (const entry of MEANINGFUL_STATE_ENTRIES) if (await hasDirectoryEntries(node_path.default.join(params.stateDir, entry))) reasons.push(`state ${entry}/ exists`);
	return {
		fresh: reasons.length === 0,
		reasons
	};
}
/** Preserves the acknowledgement accepted in-memory before the import lock is acquired. */
function preserveSetupMigrationSecurityAcknowledgement(config, inMemoryConfig) {
	const securityAcknowledgedAt = inMemoryConfig.wizard?.securityAcknowledgedAt;
	if (!securityAcknowledgedAt || config.wizard?.securityAcknowledgedAt) return config;
	return {
		...config,
		wizard: {
			...config.wizard,
			securityAcknowledgedAt
		}
	};
}
async function hashTargetPath(hash, candidate, snapshotPath) {
	let stat;
	try {
		stat = await node_fs_promises.default.lstat(candidate);
	} catch (error) {
		if (isMissingPathError(error)) {
			hash.update(`missing:${snapshotPath}\0`);
			return;
		}
		throw error;
	}
	if (stat.isSymbolicLink()) {
		hash.update(`symlink:${snapshotPath}\0${await node_fs_promises.default.readlink(candidate)}\0`);
		return;
	}
	if (stat.isDirectory()) {
		hash.update(`directory:${snapshotPath}\0`);
		for (const entry of (await node_fs_promises.default.readdir(candidate)).toSorted()) await hashTargetPath(hash, node_path.default.join(candidate, entry), `${snapshotPath}/${entry}`);
		return;
	}
	if (stat.isFile()) {
		hash.update(`file:${snapshotPath}\0${stat.size}\0`);
		for await (const chunk of (0, node_fs.createReadStream)(candidate)) hash.update(chunk);
		hash.update("\0");
		return;
	}
	hash.update(`other:${snapshotPath}\0`);
}
async function hashSourcePath(hash, candidate, snapshotPath, followedRealPaths = /* @__PURE__ */ new Set()) {
	let stat;
	try {
		stat = await node_fs_promises.default.lstat(candidate);
	} catch (error) {
		if (isMissingPathError(error)) {
			hash.update(`missing:${snapshotPath}\0`);
			return;
		}
		throw error;
	}
	if (stat.isSymbolicLink()) {
		hash.update(`symlink:${snapshotPath}\0${await node_fs_promises.default.readlink(candidate)}\0`);
		let realPath;
		try {
			realPath = await node_fs_promises.default.realpath(candidate);
		} catch (error) {
			hash.update(`unresolved:${error.code ?? "unknown"}\0`);
			return;
		}
		if (followedRealPaths.has(realPath)) {
			hash.update(`cycle:${snapshotPath}\0`);
			return;
		}
		followedRealPaths.add(realPath);
		await hashSourcePath(hash, realPath, `${snapshotPath}/referent`, followedRealPaths);
		followedRealPaths.delete(realPath);
		return;
	}
	if (stat.isDirectory()) {
		hash.update(`directory:${snapshotPath}\0`);
		for (const entry of (await node_fs_promises.default.readdir(candidate)).toSorted()) await hashSourcePath(hash, node_path.default.join(candidate, entry), `${snapshotPath}/${entry}`, followedRealPaths);
		return;
	}
	if (stat.isFile()) {
		hash.update(`file:${snapshotPath}\0${stat.size}\0`);
		for await (const chunk of (0, node_fs.createReadStream)(candidate)) hash.update(chunk);
		hash.update("\0");
		return;
	}
	hash.update(`other:${snapshotPath}\0`);
}
/** Hashes migration-owned target state without persisting raw paths or values. */
async function buildSetupMigrationTargetSnapshot(params) {
	const hash = node_crypto.default.createHash("sha256");
	const targetConfig = buildSetupMigrationSnapshotConfig(params.config);
	hash.update(`config:${JSON.stringify(canonicalizeJsonValue(targetConfig))}\0`);
	for (const entry of MEANINGFUL_WORKSPACE_ENTRIES) await hashTargetPath(hash, node_path.default.join(params.workspaceDir, entry), `workspace/${entry}`);
	for (const entry of MEANINGFUL_STATE_ENTRIES) await hashTargetPath(hash, node_path.default.join(params.stateDir, entry), `state/${entry}`);
	return hash.digest("hex");
}
/** Hashes only source paths represented by the provider's concrete migration plan. */
async function buildSetupMigrationPlanSourceSnapshot(plan) {
	const hash = node_crypto.default.createHash("sha256");
	const itemSources = [...new Set(plan.items.map((item) => item.source?.trim()).filter((source) => Boolean(source)).map((source) => node_path.default.resolve(require_home_dir.resolveUserPath(source))))].toSorted();
	const sources = [...new Set(itemSources.flatMap((source) => node_path.default.extname(source) === ".db" ? [
		source,
		`${source}-wal`,
		`${source}-shm`,
		`${source}-journal`
	] : [source]))].toSorted();
	for (const [index, source] of sources.entries()) await hashSourcePath(hash, source, `source/${index}`);
	return hash.digest("hex");
}
/** Verifies planning inputs and builds the exact provider-side-effect retry boundary. */
async function prepareSetupMigrationAttemptBoundary(params) {
	const currentTargetSnapshotHash = await buildSetupMigrationTargetSnapshot({
		config: params.currentConfig,
		stateDir: params.stateDir,
		workspaceDir: params.workspaceDir
	});
	if (currentTargetSnapshotHash !== params.expectedTargetSnapshotHash) throw new Error("Migration target changed while preparing the import. Review it and retry.");
	const sourceSnapshotHash = await buildSetupMigrationPlanSourceSnapshot(params.plan);
	if (sourceSnapshotHash !== params.expectedSourceSnapshotHash) throw new Error("Migration source changed while preparing the import. Review it and retry.");
	return {
		sourceSnapshotHash,
		preparedTargetSnapshotHash: currentTargetSnapshotHash,
		targetSnapshotHash: await buildSetupMigrationTargetSnapshot({
			config: params.targetConfig,
			stateDir: params.stateDir,
			workspaceDir: params.workspaceDir
		})
	};
}
/** Serializes all onboarding migration writes that share one Operator state target. */
async function withSetupMigrationTargetLock(stateDir, fn) {
	const migrationDir = node_path.default.join(stateDir, "migration");
	await node_fs_promises.default.mkdir(migrationDir, {
		recursive: true,
		mode: 448
	});
	return await require_file_lock.withFileLock(node_path.default.join(migrationDir, "onboarding.lock-target"), SETUP_MIGRATION_LOCK_OPTIONS, fn);
}
function assertFreshSetupMigrationTarget(freshness) {
	if (freshness.fresh || process.env.OPERATOR_MIGRATION_EXISTING_IMPORT === "1") return;
	throw new Error([
		"Migration import during onboarding requires a fresh Operator setup.",
		"Create a fresh setup or reset config, credentials, sessions, and workspace before importing.",
		"Backup plus overwrite/merge imports are feature-gated for now.",
		"Existing setup:",
		...freshness.reasons.map((reason) => `- ${reason}`)
	].join("\n"));
}
//#endregion
//#region src/wizard/setup.migration-import.ts
const loadMigrationProviderRuntimeModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./migration-provider-runtime-BfZcEKfA.cjs")).then((n) => n.migration_provider_runtime_exports));
const loadMigrationContextModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./context-BZlEBcHB.cjs")).then((n) => n.context_exports));
const loadConfigPathsModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./paths-C5Qy0ueD.cjs")).then((n) => n.paths_exports));
async function detectSetupMigrationSources(params) {
	const [{ ensureStandaloneMigrationProviderRegistryLoaded, resolvePluginMigrationProviders }, { createMigrationLogger }, { resolveStateDir }] = await Promise.all([
		loadMigrationProviderRuntimeModule(),
		loadMigrationContextModule(),
		loadConfigPathsModule()
	]);
	ensureStandaloneMigrationProviderRegistryLoaded({ cfg: params.config });
	const stateDir = resolveStateDir();
	const logger = createMigrationLogger(params.runtime);
	const detections = [];
	for (const provider of resolvePluginMigrationProviders({ cfg: params.config })) {
		if (!provider.detect) continue;
		try {
			const detection = await provider.detect({
				config: params.config,
				stateDir,
				logger
			});
			if (detection.found) detections.push({
				providerId: provider.id,
				label: detection.label ?? provider.label,
				...detection.source ? { source: detection.source } : {},
				...detection.message ? { message: detection.message } : {}
			});
		} catch (error) {
			logger.debug?.(`Migration provider ${provider.id} detection failed: ${require_errors.formatErrorMessage(error)}`);
		}
	}
	return detections;
}
function resolveImportSourceDefault(params) {
	const detected = params.detections.find((detection) => detection.providerId === params.providerId);
	if (detected?.source) return detected.source;
	return params.providerId === "hermes" ? "~/.hermes" : "";
}
function resolveInstallableSetupMigrationProviders() {
	const providers = [];
	for (const catalogEntry of require_official_external_plugin_catalog.listOfficialExternalPluginCatalogEntries()) {
		const manifest = require_official_external_plugin_catalog.getOfficialExternalPluginCatalogManifest(catalogEntry);
		const pluginId = require_official_external_plugin_catalog.resolveOfficialExternalPluginId(catalogEntry);
		const install = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(catalogEntry);
		if (!pluginId || !install) continue;
		for (const providerId of manifest?.contracts?.migrationProviders ?? []) providers.push({
			providerId,
			entry: {
				pluginId,
				label: require_official_external_plugin_catalog.resolveOfficialExternalPluginLabel(catalogEntry),
				install,
				trustedSourceLinkedOfficialInstall: true
			},
			...catalogEntry.description ? { description: catalogEntry.description } : {}
		});
	}
	return providers;
}
function formatMigrationProviderId(providerId) {
	return providerId.split(/[-_]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
function resolveManifestMigrationProviderLabel(params) {
	return params.pluginName?.trim().replace(/\s+Migration$/i, "") || formatMigrationProviderId(params.providerId) || params.providerId;
}
function resolveManifestSetupMigrationProviders(baseConfig) {
	return require_manifest_contract_eligibility.listAvailableManifestContractPlugins({
		snapshot: require_manifest_contract_eligibility.loadManifestContractSnapshot({ config: baseConfig }),
		contract: "migrationProviders",
		config: baseConfig
	}).flatMap((plugin) => (plugin.contracts?.migrationProviders ?? []).map((providerId) => {
		const provider = {
			providerId,
			label: resolveManifestMigrationProviderLabel({
				providerId,
				pluginName: plugin.name
			})
		};
		if (plugin.description) provider.description = plugin.description;
		return provider;
	}));
}
async function listSetupMigrationOptions(params) {
	const { resolvePluginMigrationProviders } = await loadMigrationProviderRuntimeModule();
	const providers = resolvePluginMigrationProviders({ cfg: params.baseConfig });
	const options = [];
	const providerIds = /* @__PURE__ */ new Set();
	const addOption = (option) => {
		if (providerIds.has(option.providerId)) return;
		providerIds.add(option.providerId);
		options.push(option);
	};
	for (const detection of params.detections) addOption({
		providerId: detection.providerId,
		label: detection.label,
		...detection.source || detection.message ? { hint: detection.source ?? detection.message } : {}
	});
	for (const provider of providers) addOption({
		providerId: provider.id,
		label: provider.label,
		hint: provider.description ?? require_i18n.t("wizard.migration.sourcePathHint")
	});
	for (const provider of resolveManifestSetupMigrationProviders(params.baseConfig)) addOption({
		providerId: provider.providerId,
		label: provider.label,
		hint: provider.description ?? require_i18n.t("wizard.migration.sourcePathHint")
	});
	for (const provider of resolveInstallableSetupMigrationProviders()) addOption({
		providerId: provider.providerId,
		label: provider.entry.label,
		hint: provider.description ?? require_i18n.t("wizard.migration.sourcePathHint")
	});
	return options;
}
async function selectSetupMigrationProvider(params) {
	const options = await listSetupMigrationOptions({
		baseConfig: params.baseConfig,
		detections: params.detections
	});
	if (options.length === 0) throw new Error("No migration providers found.");
	const providerId = params.opts.importFrom?.trim() || await params.prompter.select({
		message: require_i18n.t("wizard.migration.source"),
		options: options.map((option) => ({
			value: option.providerId,
			label: option.label,
			...option.hint ? { hint: option.hint } : {}
		})),
		initialValue: params.detections[0]?.providerId ?? options[0]?.providerId
	});
	if (!options.some((option) => option.providerId === providerId)) throw new Error(`Unknown migration provider "${providerId}".`);
	return providerId;
}
async function resolveSetupMigrationProvider(params) {
	const { ensureStandaloneMigrationProviderRegistryLoaded, resolvePluginMigrationProvider } = await loadMigrationProviderRuntimeModule();
	ensureStandaloneMigrationProviderRegistryLoaded({
		cfg: params.baseConfig,
		providerId: params.providerId
	});
	const existing = resolvePluginMigrationProvider({
		providerId: params.providerId,
		cfg: params.baseConfig
	});
	if (existing) return {
		provider: existing,
		baseConfig: params.baseConfig
	};
	const installable = resolveInstallableSetupMigrationProviders().find((provider) => provider.providerId === params.providerId);
	if (!installable) throw new Error(`Unknown migration provider "${params.providerId}".`);
	const result = await require_onboarding_plugin_install.ensureOnboardingPluginInstalled({
		cfg: params.baseConfig,
		entry: installable.entry,
		prompter: params.prompter,
		runtime: params.runtime,
		workspaceDir: params.workspaceDir,
		promptInstall: false
	});
	if (!result.installed) throw new Error(`Could not install migration provider "${params.providerId}".`);
	ensureStandaloneMigrationProviderRegistryLoaded({
		cfg: result.cfg,
		providerId: params.providerId
	});
	const provider = resolvePluginMigrationProvider({
		providerId: params.providerId,
		cfg: result.cfg
	});
	if (!provider) throw new Error(`Installed plugin did not register migration provider "${params.providerId}".`);
	return {
		provider,
		baseConfig: result.cfg
	};
}
function hasCredentialCandidate(plan) {
	return plan.items.some((item) => item.kind === "auth" || item.kind === "secret" || item.sensitive === true);
}
async function createSetupMigrationPlan(params) {
	let ctx = {
		...params.ctx,
		includeSecrets: params.importSecrets
	};
	let plan = await params.provider.plan(ctx);
	if (params.nonInteractive || params.importSecrets || !hasCredentialCandidate(plan)) return {
		ctx,
		plan
	};
	if (!await params.prompter.confirm({
		message: require_i18n.t("wizard.migration.includeCredentials"),
		initialValue: true
	})) return {
		ctx,
		plan
	};
	ctx = {
		...ctx,
		includeSecrets: true
	};
	plan = await params.provider.plan(ctx);
	return {
		ctx,
		plan
	};
}
async function runSetupMigrationImport(params) {
	const [{ applyLocalSetupWorkspaceConfig, applySkipBootstrapConfig }, { createMigrationLogger, buildMigrationReportDir }, { createPreMigrationBackup }, { assertApplySucceeded, assertConflictFreePlan, formatMigrationPreview, formatMigrationResult }, { resolveStateDir }, onboardHelpers] = await Promise.all([
		Promise.resolve().then(() => require("./onboard-config-COaJmNhR.cjs")),
		loadMigrationContextModule(),
		Promise.resolve().then(() => require("./apply-B8BP96o8.cjs")),
		Promise.resolve().then(() => require("./output-yAsarn29.cjs")).then((n) => n.output_exports),
		loadConfigPathsModule(),
		Promise.resolve().then(() => require("./onboard-helpers-B8YMO226.cjs"))
	]);
	const providerId = await selectSetupMigrationProvider({
		opts: params.opts,
		baseConfig: params.baseConfig,
		detections: params.detections,
		prompter: params.prompter
	});
	const workspaceDir = require_home_dir.resolveUserPath((params.opts.workspace ?? (params.opts.nonInteractive ? params.baseConfig.agents?.defaults?.workspace ?? onboardHelpers.DEFAULT_WORKSPACE : await params.prompter.text({
		message: require_i18n.t("wizard.migration.targetWorkspace"),
		initialValue: params.baseConfig.agents?.defaults?.workspace ?? onboardHelpers.DEFAULT_WORKSPACE
	}))).trim() || onboardHelpers.DEFAULT_WORKSPACE);
	const stateDir = resolveStateDir();
	await withSetupMigrationTargetLock(stateDir, async () => {
		const lockedBaseConfig = preserveSetupMigrationSecurityAcknowledgement(await params.readConfigFile(), params.baseConfig);
		const initialTargetSnapshotHash = await buildSetupMigrationTargetSnapshot({
			config: lockedBaseConfig,
			stateDir,
			workspaceDir
		});
		const freshness = await inspectSetupMigrationFreshness({
			baseConfig: lockedBaseConfig,
			stateDir,
			workspaceDir
		});
		const recoveryState = !setupMigrationProviderSupportsRecovery(providerId) || process.env.OPERATOR_MIGRATION_EXISTING_IMPORT === "1" ? { kind: "none" } : await resolveSetupMigrationRecovery({
			stateDir,
			providerId,
			workspaceDir,
			targetSnapshotHash: initialTargetSnapshotHash
		});
		const recoveryAttempt = !freshness.fresh && recoveryState.kind === "recoverable" ? recoveryState.attempt : void 0;
		if (!recoveryAttempt) assertFreshSetupMigrationTarget(freshness);
		const resolvedProvider = await resolveSetupMigrationProvider({
			providerId,
			baseConfig: lockedBaseConfig,
			prompter: params.prompter,
			runtime: params.runtime,
			workspaceDir
		});
		const planningTargetSnapshotHash = await buildSetupMigrationTargetSnapshot({
			config: await params.readConfigFile(),
			stateDir,
			workspaceDir
		});
		const migrationLogger = createMigrationLogger(params.runtime);
		const selectedDetections = [...params.detections];
		if (resolvedProvider.provider.detect && !selectedDetections.some((detection) => detection.providerId === providerId)) try {
			const detection = await resolvedProvider.provider.detect({
				config: resolvedProvider.baseConfig,
				stateDir,
				logger: migrationLogger
			});
			if (detection.found) selectedDetections.push({
				providerId,
				label: detection.label ?? resolvedProvider.provider.label,
				...detection.source ? { source: detection.source } : {},
				...detection.message ? { message: detection.message } : {}
			});
		} catch (error) {
			migrationLogger.debug?.(`Migration provider ${providerId} detection failed: ${require_errors.formatErrorMessage(error)}`);
		}
		const sourceDefault = resolveImportSourceDefault({
			providerId,
			detections: selectedDetections
		});
		const sourceDir = params.opts.importSource?.trim() || sourceDefault || (params.opts.nonInteractive ? (() => {
			throw new Error("--import-source is required for non-interactive migration import.");
		})() : await params.prompter.text({
			message: require_i18n.t("wizard.migration.sourceAgentHome"),
			initialValue: providerId === "hermes" ? "~/.hermes" : void 0
		}));
		const retryingFailedAttempt = recoveryAttempt !== void 0 && setupMigrationAttemptMatchesSource(recoveryAttempt, sourceDir);
		if (!retryingFailedAttempt) assertFreshSetupMigrationTarget(freshness);
		else if (planningTargetSnapshotHash !== initialTargetSnapshotHash) throw new Error("Migration target changed while preparing the retry. Review it and retry.");
		let targetConfig = applyLocalSetupWorkspaceConfig(resolvedProvider.baseConfig, workspaceDir);
		if (params.opts.skipBootstrap) targetConfig = applySkipBootstrapConfig(targetConfig);
		const initialCtx = {
			config: targetConfig,
			stateDir,
			source: sourceDir,
			overwrite: false,
			logger: migrationLogger
		};
		const planned = await createSetupMigrationPlan({
			provider: resolvedProvider.provider,
			ctx: initialCtx,
			importSecrets: Boolean(params.opts.importSecrets),
			nonInteractive: Boolean(params.opts.nonInteractive),
			prompter: params.prompter
		});
		const plannedSourceSnapshotHash = await buildSetupMigrationPlanSourceSnapshot(planned.plan);
		const ctx = planned.ctx;
		const plan = retryingFailedAttempt && recoveryAttempt ? prepareSetupMigrationRetryPlan(planned.plan, recoveryAttempt, plannedSourceSnapshotHash) : planned.plan;
		await params.prompter.note(formatMigrationPreview(plan).join("\n"), require_i18n.t("wizard.migration.previewTitle"));
		assertConflictFreePlan(plan, providerId);
		if (!(params.opts.nonInteractive === true ? true : await params.prompter.confirm({
			message: require_i18n.t("wizard.migration.apply"),
			initialValue: true
		}))) throw new require_prompts.WizardCancelledError(require_i18n.t("wizard.migration.cancelled"));
		const reportDir = buildMigrationReportDir(providerId, stateDir);
		const backupPath = await createPreMigrationBackup({});
		targetConfig = onboardHelpers.applyWizardMetadata(targetConfig, {
			command: "onboard",
			mode: "local"
		});
		const boundary = await prepareSetupMigrationAttemptBoundary({
			currentConfig: await params.readConfigFile(),
			targetConfig,
			stateDir,
			workspaceDir,
			plan: planned.plan,
			expectedTargetSnapshotHash: planningTargetSnapshotHash,
			expectedSourceSnapshotHash: plannedSourceSnapshotHash
		});
		const withReport = await runSetupMigrationAttempt({
			reportDir,
			attempt: createSetupMigrationAttempt({
				providerId,
				source: sourceDir,
				workspaceDir,
				plan,
				sourceSnapshotHash: boundary.sourceSnapshotHash,
				preparedTargetSnapshotHash: boundary.preparedTargetSnapshotHash,
				targetSnapshotHash: boundary.targetSnapshotHash,
				...recoveryAttempt ? { previousAttempt: recoveryAttempt } : {}
			}),
			assertSucceeded: assertApplySucceeded,
			async readTargetSnapshot() {
				return await buildSetupMigrationTargetSnapshot({
					config: await params.readConfigFile(),
					stateDir,
					workspaceDir
				});
			},
			async apply() {
				targetConfig = await params.commitConfigFile(targetConfig);
				const result = await resolvedProvider.provider.apply({
					...ctx,
					config: targetConfig,
					...backupPath ? { backupPath } : {},
					reportDir
				}, plan);
				return {
					...result,
					...result.backupPath ?? backupPath ? { backupPath: result.backupPath ?? backupPath } : {},
					reportDir: result.reportDir ?? reportDir
				};
			}
		});
		await params.prompter.note(formatMigrationResult(withReport).join("\n"), require_i18n.t("wizard.migration.appliedTitle"));
		if (params.continueOnboarding) await params.prompter.note(require_i18n.t("wizard.migration.continuing"), require_i18n.t("wizard.migration.appliedTitle"));
		else await params.prompter.outro(require_i18n.t("wizard.migration.complete"));
	});
}
//#endregion
//#region src/wizard/setup.model-auth.ts
const loadAuthChoiceModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./auth-choice-D4L_IVSJ.cjs")));
const loadModelPickerModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./model-picker-BTSAmJfO.cjs")));
function isAuthChoiceSelected(value, keepCurrentAuthChoice) {
	return keepCurrentAuthChoice === void 0 || value !== keepCurrentAuthChoice;
}
async function resolveAuthChoiceModelSelectionPolicy(params) {
	const preferredProvider = await params.resolvePreferredProviderForAuthChoice({
		choice: params.authChoice,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	const [{ resolveManifestProviderAuthChoice }, { resolvePluginSetupProvider }] = await Promise.all([Promise.resolve().then(() => require("./provider-auth-choices-Dr0zOwrP.cjs")).then((n) => n.provider_auth_choices_exports), Promise.resolve().then(() => require("./setup-registry-bM3fH6vu.cjs")).then((n) => n.setup_registry_exports)]);
	const manifestChoice = resolveManifestProviderAuthChoice(params.authChoice, {
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includeUntrustedWorkspacePlugins: false
	});
	if (manifestChoice) {
		const setupProvider = resolvePluginSetupProvider({
			provider: manifestChoice.providerId,
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			pluginIds: [manifestChoice.pluginId]
		});
		const setupPolicy = (setupProvider?.auth.find((method) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(method.id) === (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(manifestChoice.methodId)))?.wizard?.modelSelection ?? setupProvider?.wizard?.setup?.modelSelection;
		return {
			preferredProvider,
			promptWhenAuthChoiceProvided: setupPolicy?.promptWhenAuthChoiceProvided === true,
			allowKeepCurrent: setupPolicy?.allowKeepCurrent ?? true
		};
	}
	const { resolvePluginProviders, resolveProviderPluginChoice } = await Promise.resolve().then(() => require("./provider-auth-choice.runtime-Vopx4913.cjs"));
	const providers = resolvePluginProviders({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		mode: "setup"
	});
	const resolvedChoice = resolveProviderPluginChoice({
		providers,
		choice: params.authChoice
	});
	const matchedProvider = resolvedChoice?.provider ?? (() => {
		const preferredId = preferredProvider?.trim();
		if (!preferredId) return;
		return providers.find((provider) => typeof provider.id === "string" && provider.id.trim() === preferredId);
	})();
	const setupPolicy = resolvedChoice?.wizard?.modelSelection ?? matchedProvider?.wizard?.setup?.modelSelection;
	return {
		preferredProvider,
		promptWhenAuthChoiceProvided: setupPolicy?.promptWhenAuthChoiceProvided === true,
		allowKeepCurrent: setupPolicy?.allowKeepCurrent ?? true
	};
}
/**
* Run the provider auth-choice + default-model selection loop. When
* `opts.authChoice` is set the prompt is skipped and the flag drives the flow
* (public onboarding automation contract).
*/
async function runSetupModelAuthStep(params) {
	const { opts, prompter, runtime, workspaceDir } = params;
	let nextConfig = params.config;
	const authChoiceFromPrompt = opts.authChoice === void 0;
	let authChoice = opts.authChoice;
	let authStore;
	let promptAuthChoiceGrouped;
	let keepCurrentAuthChoice;
	if (authChoiceFromPrompt) {
		const { ensureAuthProfileStore } = await Promise.resolve().then(() => require("./auth-profiles.runtime-DodZExCU.cjs"));
		const authChoicePromptModule = await Promise.resolve().then(() => require("./auth-choice-prompt-BbEEGxQZ.cjs"));
		promptAuthChoiceGrouped = authChoicePromptModule.promptAuthChoiceGrouped;
		keepCurrentAuthChoice = authChoicePromptModule.KEEP_CURRENT_AUTH_CHOICE;
		authStore = ensureAuthProfileStore(void 0, { allowKeychainPrompt: false });
	}
	while (true) {
		if (authChoiceFromPrompt) authChoice = await promptAuthChoiceGrouped({
			prompter,
			store: authStore,
			includeSkip: true,
			config: nextConfig,
			workspaceDir,
			allowKeepCurrentProvider: true
		});
		if (authChoice === void 0) throw new require_prompts.WizardCancelledError(require_i18n.t("wizard.setup.authChoiceRequired"));
		if (!isAuthChoiceSelected(authChoice, keepCurrentAuthChoice)) break;
		if (authChoice === "custom-api-key") {
			const { promptCustomApiConfig } = await Promise.resolve().then(() => require("./onboard-custom-A7xHjS5n.cjs"));
			nextConfig = (await promptCustomApiConfig({
				prompter,
				runtime,
				config: nextConfig,
				secretInputMode: opts.secretInputMode
			})).config;
			prompter.disableBackNavigation?.();
			break;
		}
		if (authChoice === "skip") {
			if (authChoiceFromPrompt) {
				const { applyPrimaryModel, promptDefaultModel } = await loadModelPickerModule();
				const modelSelection = await promptDefaultModel({
					config: nextConfig,
					prompter,
					allowKeep: true,
					ignoreAllowlist: true,
					includeProviderPluginSetups: false,
					loadCatalog: false,
					workspaceDir,
					runtime
				});
				if (modelSelection.config) nextConfig = modelSelection.config;
				if (modelSelection.model) nextConfig = applyPrimaryModel(nextConfig, modelSelection.model);
				const { warnIfModelConfigLooksOff } = await loadAuthChoiceModule();
				await warnIfModelConfigLooksOff(nextConfig, prompter, { validateCatalog: false });
			}
			break;
		}
		const [{ applyAuthChoice, resolvePreferredProviderForAuthChoice, warnIfModelConfigLooksOff }, { applyPrimaryModel, promptDefaultModel }] = await Promise.all([loadAuthChoiceModule(), loadModelPickerModule()]);
		prompter.disableBackNavigation?.();
		let authResult;
		try {
			authResult = await applyAuthChoice({
				authChoice,
				config: nextConfig,
				prompter,
				runtime,
				setDefaultModel: true,
				preserveExistingDefaultModel: true,
				opts: {
					...opts,
					token: opts.authChoice === "apiKey" && opts.token ? opts.token : void 0
				}
			});
		} catch (error) {
			if (error instanceof require_prompts.WizardCancelledError || !authChoiceFromPrompt) throw error;
			await prompter.note([require_errors.formatErrorMessage(error), require_i18n.t("wizard.setup.authChoiceFailedRetry")].join("\n"), require_i18n.t("wizard.setup.authChoiceFailedTitle"));
			continue;
		}
		nextConfig = authResult.config;
		if (authResult.retrySelection) {
			if (authChoiceFromPrompt) continue;
			break;
		}
		if (authResult.agentModelOverride) nextConfig = applyPrimaryModel(nextConfig, authResult.agentModelOverride);
		const authChoiceModelSelectionPolicy = await resolveAuthChoiceModelSelectionPolicy({
			authChoice,
			config: nextConfig,
			workspaceDir,
			resolvePreferredProviderForAuthChoice
		});
		if (authChoiceFromPrompt || authChoiceModelSelectionPolicy?.promptWhenAuthChoiceProvided) {
			const modelSelection = await promptDefaultModel({
				config: nextConfig,
				prompter,
				allowKeep: authChoiceModelSelectionPolicy?.allowKeepCurrent ?? true,
				ignoreAllowlist: true,
				includeProviderPluginSetups: true,
				preferredProvider: authChoiceModelSelectionPolicy?.preferredProvider,
				browseCatalogOnDemand: true,
				workspaceDir,
				runtime
			});
			if (modelSelection.config) nextConfig = modelSelection.config;
			if (modelSelection.model) nextConfig = applyPrimaryModel(nextConfig, modelSelection.model);
		}
		await warnIfModelConfigLooksOff(nextConfig, prompter, { validateCatalog: false });
		break;
	}
	return nextConfig;
}
//#endregion
//#region src/wizard/setup.ts
const loadConfigLoggingModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./logging-r9lZv9sT.cjs")));
const loadOnboardConfigModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./onboard-config-COaJmNhR.cjs")));
function hasConfiguredDefaultModel(config) {
	return require_model_input.resolveAgentModelPrimaryValue(config.agents?.defaults?.model) !== void 0;
}
async function offerLiveModelVerification(params) {
	if (!await params.prompter.confirm({
		message: require_i18n.t("wizard.setup.testAiAccess"),
		initialValue: true
	})) return params.config;
	const { verifySetupInference } = await Promise.resolve().then(() => require("./setup-inference-BpDIKr54.cjs"));
	const verify = async () => {
		const progress = params.prompter.progress(require_i18n.t("wizard.setup.testAiProgress"));
		const result = await require_subsystem.withConsoleSubsystemsSuppressed(() => verifySetupInference({ runtime: params.runtime }));
		progress.stop();
		if (result.ok) await params.prompter.note(require_i18n.t("wizard.setup.testAiSuccess", { seconds: (result.latencyMs / 1e3).toFixed(1) }), require_i18n.t("wizard.setup.testAiTitle"));
		else await params.prompter.note(require_i18n.t("wizard.setup.testAiFailure", { reason: result.error }), require_i18n.t("wizard.setup.testAiTitle"));
		return result;
	};
	if ((await verify()).ok) return params.config;
	if (await params.prompter.select({
		message: require_i18n.t("wizard.setup.testAiFailureChoice"),
		options: [{
			value: "fix",
			label: require_i18n.t("wizard.setup.testAiFix")
		}, {
			value: "continue",
			label: require_i18n.t("wizard.setup.testAiContinue")
		}]
	}) === "continue") return params.config;
	const fixedConfig = await runSetupModelAuthStep({
		config: params.config,
		opts: {
			...params.opts,
			authChoice: void 0
		},
		prompter: params.prompter,
		runtime: params.runtime,
		workspaceDir: params.workspaceDir
	});
	const persistedConfig = await params.writeConfig(fixedConfig);
	await verify();
	return persistedConfig;
}
function isSetupImportFlowChoice(flow) {
	return flow === "import" || flow.startsWith("import:");
}
function resolveImportProviderFromFlowChoice(flow) {
	return flow.startsWith("import:") ? flow.slice(7) : void 0;
}
async function runSetupWizard(opts, runtimeInput, prompter) {
	await runWizardWithPromptNavigation(prompter, async (navigationPrompter) => await runSetupWizardOnce(opts, runtimeInput, navigationPrompter));
}
async function runSetupWizardOnce(opts, runtimeInput, prompter) {
	let runtime = runtimeInput;
	runtime ??= require_runtime.defaultRuntime;
	const onboardHelpers = await Promise.resolve().then(() => require("./onboard-helpers-B8YMO226.cjs"));
	await onboardHelpers.printWizardHeader(runtime);
	await prompter.intro(require_i18n.t("wizard.setup.intro"));
	const snapshot = await require_setup_shared.readSetupConfigFileSnapshot();
	let baseConfig = snapshot.valid ? snapshot.exists ? snapshot.sourceConfig ?? snapshot.config : {} : {};
	baseConfig = await require_setup_shared.requireRiskAcknowledgement({
		opts,
		prompter,
		config: baseConfig
	});
	let pendingPluginInstallMigrationBaseConfig = baseConfig;
	const writeSetupConfigFile = async (config, optsLocal = {}) => await require_setup_shared.writeWizardConfigFile(config, {
		...optsLocal,
		migrationBaseConfig: pendingPluginInstallMigrationBaseConfig,
		onPendingPluginInstallMigration: () => {
			pendingPluginInstallMigrationBaseConfig = void 0;
		}
	});
	if (snapshot.exists && !snapshot.valid) {
		await prompter.note(onboardHelpers.summarizeExistingConfig(baseConfig), require_i18n.t("wizard.setup.invalidConfigTitle"));
		if (snapshot.issues.length > 0) await prompter.note([
			...snapshot.issues.map((iss) => `- ${iss.path}: ${iss.message}`),
			"",
			"Docs: https://docs.operator.ai/gateway/configuration"
		].join("\n"), "Config issues");
		await prompter.outro(`Config invalid. Run \`${require_command_format.formatCliCommand("openclaw doctor")}\` to repair it, then re-run setup.`);
		runtime.exit(1);
		return;
	}
	const compatibilityNotices = snapshot.valid ? require_status.buildPluginCompatibilitySnapshotNotices({ config: baseConfig }) : [];
	if (compatibilityNotices.length > 0) await prompter.note([
		`Detected ${compatibilityNotices.length} plugin compatibility notice${compatibilityNotices.length === 1 ? "" : "s"} in the current config.`,
		...compatibilityNotices.slice(0, 4).map((notice) => `- ${require_status.formatPluginCompatibilityNotice(notice)}`),
		...compatibilityNotices.length > 4 ? [`- ... +${compatibilityNotices.length - 4} more`] : [],
		"",
		`Review: ${require_command_format.formatCliCommand("openclaw doctor")}`,
		`Inspect: ${require_command_format.formatCliCommand("openclaw plugins inspect --all")}`
	].join("\n"), require_i18n.t("wizard.setup.pluginCompatibilityTitle"));
	const quickstartHint = require_i18n.t("wizard.setup.flowQuickstartHint", { command: require_command_format.formatCliCommand("openclaw configure") });
	const manualHint = require_i18n.t("wizard.setup.flowAdvancedHint");
	const hasExistingModelConfig = hasConfiguredDefaultModel(baseConfig);
	const migrationDetections = await detectSetupMigrationSources({
		config: baseConfig,
		runtime
	});
	const importOptions = (await listSetupMigrationOptions({
		baseConfig,
		detections: migrationDetections
	})).map((option) => {
		const choice = {
			value: `import:${option.providerId}`,
			label: require_i18n.t("wizard.migration.importFrom", { source: option.label })
		};
		if (option.hint) choice.hint = option.hint;
		return choice;
	});
	const explicitFlowRaw = opts.flow?.trim();
	const normalizedExplicitFlow = explicitFlowRaw === "manual" ? "advanced" : explicitFlowRaw;
	if (normalizedExplicitFlow && normalizedExplicitFlow !== "quickstart" && normalizedExplicitFlow !== "advanced" && normalizedExplicitFlow !== "import") {
		runtime.error("Invalid --flow. Use quickstart, manual, advanced, or import. Example: openclaw onboard --flow quickstart");
		runtime.exit(1);
		return;
	}
	const explicitFlow = normalizedExplicitFlow === "quickstart" || normalizedExplicitFlow === "advanced" || normalizedExplicitFlow === "import" ? normalizedExplicitFlow : void 0;
	const keepModelOption = hasExistingModelConfig ? {
		value: "keep-model",
		label: require_i18n.t("wizard.setup.flowKeepModel"),
		hint: require_i18n.t("wizard.setup.flowKeepModelHint")
	} : void 0;
	let flow = explicitFlow ?? await prompter.select({
		message: require_i18n.t("wizard.setup.setupMode"),
		options: [
			...keepModelOption ? [keepModelOption] : [],
			{
				value: "quickstart",
				label: require_i18n.t("wizard.setup.flowQuickstart"),
				hint: quickstartHint
			},
			{
				value: "advanced",
				label: require_i18n.t("wizard.setup.flowAdvanced"),
				hint: manualHint
			},
			...importOptions
		],
		initialValue: hasExistingModelConfig ? "keep-model" : "quickstart"
	});
	let keepExistingModelConfig = flow === "keep-model";
	if (keepExistingModelConfig) flow = "quickstart";
	if (opts.mode === "remote" && flow === "quickstart") {
		await prompter.note(require_i18n.t("wizard.setup.quickstartOnlyLocal"), require_i18n.t("wizard.setup.quickstartTitle"));
		flow = "advanced";
	}
	if (snapshot.exists && !keepExistingModelConfig) await prompter.note(onboardHelpers.summarizeExistingConfig(baseConfig), require_i18n.t("wizard.setup.existingConfigTitle"));
	const usedImportFlow = Boolean(opts.importFrom || isSetupImportFlowChoice(flow));
	if (usedImportFlow) {
		const importFrom = opts.importFrom ?? resolveImportProviderFromFlowChoice(flow);
		prompter.disableBackNavigation?.();
		await runSetupMigrationImport({
			opts: {
				...opts,
				...importFrom ? { importFrom } : {}
			},
			baseConfig,
			detections: migrationDetections,
			prompter,
			runtime,
			readConfigFile: require_setup_shared.readValidSetupConfigFile,
			commitConfigFile: (cfg) => require_setup_shared.writeWizardConfigFile(cfg, { allowConfigSizeDrop: true }),
			continueOnboarding: true
		});
		const migratedSnapshot = await require_setup_shared.readSetupConfigFileSnapshot();
		if (!migratedSnapshot.valid) throw new Error("Migration produced an invalid Operator config. Run `openclaw doctor`.");
		baseConfig = migratedSnapshot.sourceConfig ?? migratedSnapshot.config;
		pendingPluginInstallMigrationBaseConfig = baseConfig;
		keepExistingModelConfig ||= hasConfiguredDefaultModel(baseConfig);
		flow = "quickstart";
	}
	const wizardFlow = flow === "advanced" ? "advanced" : "quickstart";
	const quickstartGateway = require_setup_shared.resolveQuickstartGatewayDefaults(baseConfig);
	if (flow === "quickstart") {
		const formatBind = (value) => {
			if (value === "loopback") return require_i18n.t("wizard.gateway.bindLoopback");
			if (value === "lan") return require_i18n.t("wizard.gateway.bindLan");
			if (value === "custom") return require_i18n.t("wizard.gateway.bindCustom");
			if (value === "tailnet") return require_i18n.t("wizard.gateway.bindTailnet");
			return require_i18n.t("wizard.gateway.bindAuto");
		};
		const formatAuth = (value) => {
			if (value === "token") return require_i18n.t("wizard.setup.quickstartAuthTokenDefault");
			return require_i18n.t("common.password");
		};
		const formatTailscale = (value) => {
			return require_i18n.t(`wizard.gatewayTailscale.${value}`);
		};
		const quickstartLines = quickstartGateway.hasExisting ? [
			require_i18n.t("wizard.setup.quickstartKeepSettings"),
			require_i18n.t("wizard.setup.quickstartGatewayPort", { port: quickstartGateway.port }),
			require_i18n.t("wizard.setup.quickstartGatewayBind", { bind: formatBind(quickstartGateway.bind) }),
			...quickstartGateway.bind === "custom" && quickstartGateway.customBindHost ? [require_i18n.t("wizard.setup.quickstartGatewayCustomIp", { host: quickstartGateway.customBindHost })] : [],
			require_i18n.t("wizard.setup.quickstartGatewayAuth", { auth: formatAuth(quickstartGateway.authMode) }),
			require_i18n.t("wizard.setup.quickstartTailscaleExposure", { exposure: formatTailscale(quickstartGateway.tailscaleMode) }),
			require_i18n.t("wizard.setup.quickstartDirectChannels")
		] : [
			require_i18n.t("wizard.setup.quickstartGatewayPort", { port: quickstartGateway.port }),
			require_i18n.t("wizard.setup.quickstartGatewayBind", { bind: require_i18n.t("wizard.gateway.bindLoopback") }),
			require_i18n.t("wizard.setup.quickstartGatewayAuth", { auth: require_i18n.t("wizard.setup.quickstartAuthTokenDefault") }),
			require_i18n.t("wizard.setup.quickstartTailscaleExposure", { exposure: require_i18n.t("wizard.gatewayTailscale.off") }),
			require_i18n.t("wizard.setup.quickstartDirectChannels")
		];
		await prompter.note(quickstartLines.join("\n"), "QuickStart");
	}
	const localPort = require_paths.resolveGatewayPort(baseConfig);
	const localUrl = `ws://127.0.0.1:${localPort}`;
	let localGatewayToken = process.env.OPERATOR_GATEWAY_TOKEN;
	try {
		const resolvedGatewayToken = await require_setup_secret_input.resolveSetupSecretInputString({
			config: baseConfig,
			value: baseConfig.gateway?.auth?.token,
			path: "gateway.auth.token",
			env: process.env
		});
		if (resolvedGatewayToken) localGatewayToken = resolvedGatewayToken;
	} catch (error) {
		await prompter.note([require_i18n.t("wizard.setup.secretRefProbeFailed", { field: "gateway.auth.token" }), require_errors.formatErrorMessage(error)].join("\n"), require_i18n.t("wizard.gateway.auth"));
	}
	let localGatewayPassword = process.env.OPERATOR_GATEWAY_PASSWORD;
	try {
		const resolvedGatewayPassword = await require_setup_secret_input.resolveSetupSecretInputString({
			config: baseConfig,
			value: baseConfig.gateway?.auth?.password,
			path: "gateway.auth.password",
			env: process.env
		});
		if (resolvedGatewayPassword) localGatewayPassword = resolvedGatewayPassword;
	} catch (error) {
		await prompter.note([require_i18n.t("wizard.setup.secretRefProbeFailed", { field: "gateway.auth.password" }), require_errors.formatErrorMessage(error)].join("\n"), require_i18n.t("wizard.gateway.auth"));
	}
	const localProbe = await onboardHelpers.probeGatewayReachable({
		url: localUrl,
		token: localGatewayToken,
		password: localGatewayPassword
	});
	const remoteUrl = baseConfig.gateway?.remote?.url?.trim() ?? "";
	let remoteGatewayToken = require_types_secrets.normalizeSecretInputString(baseConfig.gateway?.remote?.token);
	try {
		const resolvedRemoteGatewayToken = await require_setup_secret_input.resolveSetupSecretInputString({
			config: baseConfig,
			value: baseConfig.gateway?.remote?.token,
			path: "gateway.remote.token",
			env: process.env
		});
		if (resolvedRemoteGatewayToken) remoteGatewayToken = resolvedRemoteGatewayToken;
	} catch (error) {
		await prompter.note(["Could not resolve gateway.remote.token SecretRef for setup probe.", require_errors.formatErrorMessage(error)].join("\n"), "Gateway auth");
	}
	const remoteProbe = remoteUrl ? await onboardHelpers.probeGatewayReachable({
		url: remoteUrl,
		token: remoteGatewayToken
	}) : null;
	const mode = opts.mode ?? (flow === "quickstart" ? "local" : await prompter.select({
		message: require_i18n.t("wizard.setup.whatSetup"),
		options: [{
			value: "local",
			label: require_i18n.t("wizard.setup.localGateway"),
			hint: localProbe.ok ? require_i18n.t("wizard.setup.localGatewayReachable", { url: localUrl }) : require_i18n.t("wizard.setup.localGatewayMissing", { url: localUrl })
		}, {
			value: "remote",
			label: require_i18n.t("wizard.setup.remoteGateway"),
			hint: !remoteUrl ? require_i18n.t("wizard.setup.remoteGatewayMissing") : remoteProbe?.ok ? require_i18n.t("wizard.setup.remoteGatewayReachable", { url: remoteUrl }) : require_i18n.t("wizard.setup.remoteGatewayUnreachable", { url: remoteUrl })
		}]
	}));
	if (mode === "remote") {
		const { promptRemoteGatewayConfig } = await Promise.resolve().then(() => require("./onboard-remote-DEXfdp-l.cjs"));
		const { applySkipBootstrapConfig } = await loadOnboardConfigModule();
		const { logConfigUpdated } = await loadConfigLoggingModule();
		let nextConfig = await promptRemoteGatewayConfig(baseConfig, prompter, { secretInputMode: opts.secretInputMode });
		if (opts.skipBootstrap) nextConfig = applySkipBootstrapConfig(nextConfig);
		nextConfig = onboardHelpers.applyWizardMetadata(nextConfig, {
			command: "onboard",
			mode
		});
		prompter.disableBackNavigation?.();
		await writeSetupConfigFile(nextConfig, { allowConfigSizeDrop: false });
		logConfigUpdated(runtime);
		await prompter.outro(require_i18n.t("wizard.setup.remoteConfigured"));
		return;
	}
	const workspaceDir = require_home_dir.resolveUserPath((opts.workspace ?? (flow === "quickstart" ? baseConfig.agents?.defaults?.workspace ?? onboardHelpers.DEFAULT_WORKSPACE : await prompter.text({
		message: require_i18n.t("wizard.setup.workspaceDirectory"),
		initialValue: baseConfig.agents?.defaults?.workspace ?? onboardHelpers.DEFAULT_WORKSPACE
	}))).trim() || onboardHelpers.DEFAULT_WORKSPACE);
	const { applyLocalSetupWorkspaceConfig, applySkipBootstrapConfig } = await loadOnboardConfigModule();
	let nextConfig = applyLocalSetupWorkspaceConfig(baseConfig, workspaceDir);
	if (opts.skipBootstrap) nextConfig = applySkipBootstrapConfig(nextConfig);
	if (!keepExistingModelConfig) nextConfig = await runSetupModelAuthStep({
		config: nextConfig,
		opts,
		prompter,
		runtime,
		workspaceDir
	});
	const { configureGatewayForSetup } = await Promise.resolve().then(() => require("./setup.gateway-config-BnBdL7j5.cjs"));
	const gateway = await configureGatewayForSetup({
		flow: wizardFlow,
		baseConfig,
		nextConfig,
		localPort,
		quickstartGateway,
		secretInputMode: opts.secretInputMode,
		prompter,
		runtime
	});
	nextConfig = gateway.nextConfig;
	const settings = gateway.settings;
	nextConfig = await writeSetupConfigFile(nextConfig, { allowConfigSizeDrop: false });
	if (opts.nonInteractive !== true && opts.authChoice !== "skip" && !usedImportFlow && hasConfiguredDefaultModel(nextConfig)) nextConfig = await offerLiveModelVerification({
		config: nextConfig,
		opts,
		prompter,
		runtime,
		workspaceDir,
		writeConfig: async (config) => await writeSetupConfigFile(config, { allowConfigSizeDrop: false })
	});
	prompter.disableBackNavigation?.();
	if (opts.skipChannels ?? opts.skipProviders) await prompter.note(require_i18n.t("wizard.setup.skipChannels"), require_i18n.t("wizard.setup.channelsTitle"));
	else {
		const { listChannelPlugins } = await Promise.resolve().then(() => require("./plugins-_-82JYfc.cjs")).then((n) => n.plugins_exports);
		const { setupChannels } = await Promise.resolve().then(() => require("./onboard-channels-BgLQ52s3.cjs"));
		const quickstartAllowFromChannels = flow === "quickstart" ? listChannelPlugins().filter((plugin) => plugin.meta.quickstartAllowFrom).map((plugin) => plugin.id) : [];
		nextConfig = await setupChannels(nextConfig, runtime, prompter, {
			allowIMessageInstall: true,
			allowSignalInstall: true,
			deferStatusUntilSelection: flow === "quickstart",
			forceAllowFromChannels: quickstartAllowFromChannels,
			skipDmPolicyPrompt: flow === "quickstart",
			skipConfirm: flow === "quickstart",
			quickstartDefaults: flow === "quickstart",
			secretInputMode: opts.secretInputMode
		});
	}
	nextConfig = await writeSetupConfigFile(nextConfig, { allowConfigSizeDrop: false });
	const { logConfigUpdated } = await loadConfigLoggingModule();
	logConfigUpdated(runtime);
	await onboardHelpers.ensureWorkspaceAndSessions(workspaceDir, runtime, {
		skipBootstrap: Boolean(nextConfig.agents?.defaults?.skipBootstrap),
		skipOptionalBootstrapFiles: nextConfig.agents?.defaults?.skipOptionalBootstrapFiles
	});
	if (opts.skipSearch) await prompter.note(require_i18n.t("wizard.setup.skipSearch"), require_i18n.t("wizard.setup.searchTitle"));
	else {
		const { setupSearch } = await Promise.resolve().then(() => require("./onboard-search-7e_Eax2M.cjs"));
		nextConfig = await setupSearch(nextConfig, runtime, prompter, {
			quickstartDefaults: flow === "quickstart",
			secretInputMode: opts.secretInputMode
		});
	}
	if (opts.skipSkills) await prompter.note(require_i18n.t("wizard.setup.skipSkills"), require_i18n.t("wizard.setup.skillsTitle"));
	else {
		const { setupSkills } = await Promise.resolve().then(() => require("./onboard-skills-BBZAucsB.cjs"));
		nextConfig = await setupSkills(nextConfig, workspaceDir, runtime, prompter, { nodeManager: opts.nodeManager });
	}
	if (flow !== "quickstart") {
		const { setupOfficialPluginInstalls } = await Promise.resolve().then(() => require("./setup.official-plugins-C78T9pW0.cjs"));
		nextConfig = await setupOfficialPluginInstalls({
			config: nextConfig,
			prompter,
			runtime,
			workspaceDir
		});
		const { setupPluginConfig } = await Promise.resolve().then(() => require("./setup.plugin-config-fBPQur45.cjs"));
		nextConfig = await setupPluginConfig({
			config: nextConfig,
			prompter,
			workspaceDir
		});
	}
	if (!opts.skipHooks) {
		const { enableDefaultOnboardingInternalHooks } = await Promise.resolve().then(() => require("./onboard-hooks-CEfyHTNi.cjs"));
		nextConfig = enableDefaultOnboardingInternalHooks(nextConfig);
	}
	nextConfig = onboardHelpers.applyWizardMetadata(nextConfig, {
		command: "onboard",
		mode
	});
	nextConfig = await writeSetupConfigFile(nextConfig, { allowConfigSizeDrop: false });
	const { finalizeSetupWizard } = await Promise.resolve().then(() => require("./setup.finalize-CDDo1Ofs.cjs"));
	if ((await finalizeSetupWizard({
		flow: wizardFlow,
		opts,
		baseConfig,
		hadExistingConfig: snapshot.exists,
		nextConfig,
		workspaceDir,
		settings,
		prompter,
		runtime
	})).launchedTui) runtime.exit(0);
}
//#endregion
exports.runSetupWizard = runSetupWizard;
