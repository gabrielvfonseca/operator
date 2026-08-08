const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_persisted = require("./persisted-BWJt7718.cjs");
const require_json_file = require("./json-file-DCJhM2Bu.cjs");
const require_path_resolve = require("./path-resolve-BdO8BFFi.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let node_crypto = require("node:crypto");
let node_child_process = require("node:child_process");
node_child_process = require_rolldown_runtime.__toESM(node_child_process, 1);
//#region src/commands/doctor/shared/legacy-oauth-sidecar.ts
const LEGACY_OAUTH_SECRET_DIRNAME$1 = "auth-profiles";
const LEGACY_OAUTH_SECRET_VERSION = 1;
const LEGACY_OAUTH_SECRET_ALGORITHM = "aes-256-gcm";
const LEGACY_OAUTH_SECRET_KEY_ENV = "OPERATOR_AUTH_PROFILE_SECRET_KEY";
const LEGACY_OAUTH_SECRET_KEYCHAIN_SERVICE = "Operator Auth Profile Secrets";
const LEGACY_OAUTH_SECRET_KEYCHAIN_ACCOUNT = "oauth-profile-master-key";
const LEGACY_OAUTH_SECRET_KEY_FILE_NAME = "auth-profile-secret-key";
function readNonEmptyString$1(value) {
	return typeof value === "string" && value.trim() ? value : void 0;
}
/** Resolve the legacy OAuth sidecar JSON path for an auth profile ref. */
function resolveLegacyOAuthSidecarPath(ref, env = process.env) {
	return node_path.default.join(require_paths.resolveOAuthDir(env), LEGACY_OAUTH_SECRET_DIRNAME$1, `${ref.id}.json`);
}
function normalizeLegacyOAuthSecretMaterial(raw) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return null;
	const material = {
		...readNonEmptyString$1(raw.access) ? { access: readNonEmptyString$1(raw.access) } : {},
		...readNonEmptyString$1(raw.refresh) ? { refresh: readNonEmptyString$1(raw.refresh) } : {},
		...readNonEmptyString$1(raw.idToken) ? { idToken: readNonEmptyString$1(raw.idToken) } : {}
	};
	return Object.keys(material).length > 0 ? material : null;
}
function coerceLegacyOAuthEncryptedPayload(raw) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return null;
	return raw.algorithm === LEGACY_OAUTH_SECRET_ALGORITHM && typeof raw.iv === "string" && typeof raw.tag === "string" && typeof raw.ciphertext === "string" ? {
		algorithm: raw.algorithm,
		iv: raw.iv,
		tag: raw.tag,
		ciphertext: raw.ciphertext
	} : null;
}
/** Return true when raw JSON has the legacy OAuth sidecar envelope or plaintext token shape. */
function isLegacyOAuthSidecarPayload(raw) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return false;
	if (raw.version !== LEGACY_OAUTH_SECRET_VERSION || readNonEmptyString$1(raw.profileId) === void 0 || raw.provider !== "openai-codex") return false;
	return coerceLegacyOAuthEncryptedPayload(raw.encrypted) !== null || normalizeLegacyOAuthSecretMaterial(raw) !== null;
}
function buildLegacyOAuthSecretAad(params) {
	return Buffer.from(`${params.ref.id}\0${params.profileId}\0${params.provider}`, "utf8");
}
function buildLegacyOAuthSecretKey(seed) {
	return (0, node_crypto.hash)("sha256", `operator:auth-profile-oauth:${seed}`, "buffer");
}
function encryptLegacyOAuthMaterialForTest(params) {
	const iv = Buffer.from("0102030405060708090a0b0c", "hex");
	const cipher = (0, node_crypto.createCipheriv)(LEGACY_OAUTH_SECRET_ALGORITHM, buildLegacyOAuthSecretKey(params.seed), iv);
	cipher.setAAD(buildLegacyOAuthSecretAad({
		ref: params.ref,
		profileId: params.profileId,
		provider: params.provider
	}));
	const ciphertext = Buffer.concat([cipher.update(JSON.stringify(params.material), "utf8"), cipher.final()]);
	return {
		algorithm: LEGACY_OAUTH_SECRET_ALGORITHM,
		iv: iv.toString("base64url"),
		tag: cipher.getAuthTag().toString("base64url"),
		ciphertext: ciphertext.toString("base64url")
	};
}
function isPathInsideOrEqual(parentDir, candidatePath) {
	const relative = node_path.default.relative(node_path.default.resolve(parentDir), node_path.default.resolve(candidatePath));
	return relative === "" || relative !== "" && !relative.startsWith("..") && !node_path.default.isAbsolute(relative);
}
function uniquePaths(paths) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(paths.filter((entry) => Boolean(entry)));
}
function resolveLegacyOAuthSecretKeyFileCandidates(env) {
	if (process.platform === "win32") {
		const home = env.USERPROFILE?.trim() || node_os.default.homedir();
		const root = env.APPDATA?.trim() || (home ? node_path.default.join(home, "AppData", "Roaming") : void 0);
		return uniquePaths([root ? node_path.default.join(root, "Operator", LEGACY_OAUTH_SECRET_KEY_FILE_NAME) : void 0, home ? node_path.default.join(home, ".operator-auth-profile-secrets", LEGACY_OAUTH_SECRET_KEY_FILE_NAME) : void 0]);
	}
	if (process.platform === "darwin") {
		const home = env.HOME?.trim() || node_os.default.homedir();
		return uniquePaths([home ? node_path.default.join(home, "Library", "Application Support", "Operator", LEGACY_OAUTH_SECRET_KEY_FILE_NAME) : void 0, home ? node_path.default.join(home, ".operator-auth-profile-secrets", LEGACY_OAUTH_SECRET_KEY_FILE_NAME) : void 0]);
	}
	const home = env.HOME?.trim() || node_os.default.homedir();
	const root = env.XDG_CONFIG_HOME?.trim() || (home ? node_path.default.join(home, ".config") : void 0);
	return uniquePaths([root ? node_path.default.join(root, "@gabrielvfonseca/operator", LEGACY_OAUTH_SECRET_KEY_FILE_NAME) : void 0, home ? node_path.default.join(home, ".operator-auth-profile-secrets", LEGACY_OAUTH_SECRET_KEY_FILE_NAME) : void 0]);
}
function resolveLegacyOAuthSecretKeyFilePath(env) {
	const stateDir = require_paths.resolveStateDir(env);
	return resolveLegacyOAuthSecretKeyFileCandidates(env).find((candidate) => !isPathInsideOrEqual(stateDir, candidate));
}
function readLegacyOAuthSecretKeyFile(env) {
	const keyPath = resolveLegacyOAuthSecretKeyFilePath(env);
	if (!keyPath) return;
	try {
		return node_fs.default.readFileSync(keyPath, "utf8").trim() || void 0;
	} catch {
		return;
	}
}
function readLegacyMacOAuthSecretKeychainKey(params) {
	if (process.platform !== "darwin" || params.allowKeychainPrompt === false || params.env.VITEST === "true" || params.env.VITEST_WORKER_ID !== void 0) return;
	try {
		return node_child_process.execFileSync("security", [
			"find-generic-password",
			"-s",
			LEGACY_OAUTH_SECRET_KEYCHAIN_SERVICE,
			"-a",
			LEGACY_OAUTH_SECRET_KEYCHAIN_ACCOUNT,
			"-w"
		], {
			encoding: "utf8",
			timeout: 5e3,
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			]
		}).trim();
	} catch {
		return;
	}
}
function resolveLegacyOAuthSecretKeySeeds(env) {
	const seeds = [];
	const addSeed = (value) => {
		const trimmed = value?.trim();
		if (trimmed && !seeds.includes(trimmed)) seeds.push(trimmed);
	};
	addSeed(env[LEGACY_OAUTH_SECRET_KEY_ENV]);
	if (env.NODE_ENV === "test" && env.VITEST === "true") addSeed("operator-test-oauth-profile-secret-key");
	addSeed(readLegacyOAuthSecretKeyFile(env));
	return seeds;
}
function decryptLegacyOAuthSecretMaterialWithSeed(params, seed) {
	try {
		const decipher = (0, node_crypto.createDecipheriv)(LEGACY_OAUTH_SECRET_ALGORITHM, buildLegacyOAuthSecretKey(seed), Buffer.from(params.encrypted.iv, "base64url"));
		decipher.setAAD(buildLegacyOAuthSecretAad({
			ref: params.ref,
			profileId: params.profileId,
			provider: params.provider
		}));
		decipher.setAuthTag(Buffer.from(params.encrypted.tag, "base64url"));
		const plaintext = Buffer.concat([decipher.update(Buffer.from(params.encrypted.ciphertext, "base64url")), decipher.final()]).toString("utf8");
		return normalizeLegacyOAuthSecretMaterial(JSON.parse(plaintext));
	} catch {
		return null;
	}
}
function decryptLegacyOAuthSecretMaterial(params) {
	const seeds = resolveLegacyOAuthSecretKeySeeds(params.env);
	for (const seed of seeds) {
		const material = decryptLegacyOAuthSecretMaterialWithSeed(params, seed);
		if (material) return material;
	}
	const keychainSeed = readLegacyMacOAuthSecretKeychainKey({
		allowKeychainPrompt: params.allowKeychainPrompt,
		env: params.env
	});
	if (keychainSeed && !seeds.includes(keychainSeed)) return decryptLegacyOAuthSecretMaterialWithSeed(params, keychainSeed);
	if (process.platform === "darwin" && params.allowKeychainPrompt === false && params.env.VITEST !== "true" && params.env.VITEST_WORKER_ID === void 0) emitKeychainOnlyMigrationHintOnce(params.profileId);
	return null;
}
let keychainOnlyMigrationHintEmitted = false;
function emitKeychainOnlyMigrationHintOnce(profileId) {
	if (keychainOnlyMigrationHintEmitted) return;
	keychainOnlyMigrationHintEmitted = true;
	require_persisted.log.warn("Legacy Codex OAuth credentials are stored only in macOS Keychain on this host. Headless paths cannot prompt for Keychain access; run `openclaw doctor --fix` from an interactive terminal to migrate them back to inline auth-profiles.json credentials.", { profileId });
}
const legacyOAuthSidecarInternalTestUtils = { resetKeychainOnlyMigrationHint() {
	keychainOnlyMigrationHintEmitted = false;
} };
if (process.env.VITEST || false) globalThis[Symbol.for("operator.legacyOAuthSidecarInternalTestApi")] = legacyOAuthSidecarInternalTestUtils;
function loadLegacyOAuthSidecarMaterial(params) {
	const env = params.env ?? process.env;
	const raw = require_json_file.loadJsonFile(resolveLegacyOAuthSidecarPath(params.ref, env));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return null;
	if (raw.version !== LEGACY_OAUTH_SECRET_VERSION || raw.profileId !== params.profileId || raw.provider !== params.provider) return null;
	const encrypted = coerceLegacyOAuthEncryptedPayload(raw.encrypted);
	if (encrypted) return decryptLegacyOAuthSecretMaterial({
		ref: params.ref,
		profileId: params.profileId,
		provider: params.provider,
		encrypted,
		env,
		allowKeychainPrompt: params.allowKeychainPrompt
	});
	return normalizeLegacyOAuthSecretMaterial(raw);
}
const legacyOAuthSidecarTestUtils = {
	buildLegacyOAuthSecretAad,
	buildLegacyOAuthSecretKey,
	encryptLegacyOAuthMaterial: encryptLegacyOAuthMaterialForTest
};
//#endregion
//#region src/commands/doctor-auth-oauth-sidecar.ts
/** Doctor repair for legacy OAuth sidecar files and inline auth profile stores. */
const LEGACY_OAUTH_SECRET_DIRNAME = "auth-profiles";
function readNonEmptyString(value) {
	return typeof value === "string" && value.trim() ? value : void 0;
}
function addCandidate(candidates, agentDir) {
	const authPath = require_path_resolve.resolveAuthStorePath(agentDir);
	candidates.set(node_path.default.resolve(authPath), {
		agentDir,
		authPath
	});
}
function listExistingAgentDirsFromState(env) {
	const root = node_path.default.join(require_paths.resolveStateDir(env), "agents");
	let entries;
	try {
		entries = node_fs.default.readdirSync(root, { withFileTypes: true });
	} catch {
		return [];
	}
	return entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map((entry) => node_path.default.join(root, entry.name, "agent")).filter((agentDir) => {
		try {
			return node_fs.default.statSync(agentDir).isDirectory();
		} catch {
			return false;
		}
	});
}
function listAuthProfileRepairCandidates(cfg, env) {
	const candidates = /* @__PURE__ */ new Map();
	addCandidate(candidates, require_agent_scope_config.resolveDefaultAgentDir(cfg, env));
	const envAgentDir = readNonEmptyString(env.OPERATOR_AGENT_DIR);
	if (envAgentDir) addCandidate(candidates, envAgentDir);
	for (const agentId of require_agent_scope_config.listAgentIds(cfg)) addCandidate(candidates, require_agent_scope_config.resolveAgentDir(cfg, agentId, env));
	for (const agentDir of listExistingAgentDirsFromState(env)) addCandidate(candidates, agentDir);
	return [...candidates.values()];
}
function resolveLegacyOAuthSidecarStore(candidate) {
	if (!node_fs.default.existsSync(candidate.authPath)) return null;
	const raw = require_json_file.loadJsonFile(candidate.authPath);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.profiles)) return null;
	const profiles = [];
	for (const [profileId, value] of Object.entries(raw.profiles)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || value.type !== "oauth") continue;
		const ref = require_persisted.isLegacyOAuthRef(value.oauthRef) ? value.oauthRef : void 0;
		if (!ref || readNonEmptyString(value.provider) !== ref.provider) continue;
		profiles.push({
			profileId,
			provider: ref.provider,
			ref
		});
	}
	return profiles.length > 0 ? {
		...candidate,
		raw,
		profiles
	} : null;
}
function listUnreferencedLegacyOAuthSidecars(referencedRefIds, env) {
	const sidecarDir = node_path.default.join(require_paths.resolveOAuthDir(env), LEGACY_OAUTH_SECRET_DIRNAME);
	let entries;
	try {
		entries = node_fs.default.readdirSync(sidecarDir, { withFileTypes: true });
	} catch {
		return [];
	}
	return entries.flatMap((entry) => {
		if (!entry.isFile() || !entry.name.endsWith(".json")) return [];
		const refId = entry.name.slice(0, -5);
		if (!/^[a-f0-9]{32}$/.test(refId) || referencedRefIds.has(refId)) return [];
		const sidecarPath = node_path.default.join(sidecarDir, entry.name);
		return isLegacyOAuthSidecarPayload(require_json_file.loadJsonFile(sidecarPath)) ? [{ sidecarPath }] : [];
	});
}
function applyLegacyOAuthSidecarMaterial(params) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.raw.profiles)) return false;
	const entry = params.raw.profiles[params.profile.profileId];
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) return false;
	delete entry.oauthRef;
	if (params.material.access) entry.access = params.material.access;
	if (params.material.refresh) entry.refresh = params.material.refresh;
	if (params.material.idToken) entry.idToken = params.material.idToken;
	return true;
}
function backupLegacyOAuthSidecarStore(authPath, now) {
	const backupPath = `${authPath}.oauth-ref.${now()}.bak`;
	node_fs.default.copyFileSync(authPath, backupPath);
	return backupPath;
}
/**
* Migrates legacy Codex OAuth sidecar secrets back into inline auth profile credentials.
*
* Only sidecar files that were successfully imported and are not referenced by another failed
* profile are removed; unreferenced sidecars stay because unknown agent directories may use them.
*/
async function maybeRepairLegacyOAuthSidecarProfiles(params) {
	const now = params.now ?? Date.now;
	const emitNotes = params.emitNotes !== false;
	const env = params.env ?? process.env;
	const stores = listAuthProfileRepairCandidates(params.cfg, env).map(resolveLegacyOAuthSidecarStore).filter((entry) => entry !== null);
	const unreferencedSidecars = listUnreferencedLegacyOAuthSidecars(new Set(stores.flatMap((entry) => entry.profiles.map((p) => p.ref.id))), env);
	const result = {
		detected: [...stores.map((entry) => entry.authPath), ...unreferencedSidecars.map((entry) => entry.sidecarPath)],
		changes: [],
		warnings: []
	};
	if (stores.length === 0 && unreferencedSidecars.length === 0) return result;
	if (emitNotes) require_note.note([
		...stores.map((entry) => `- ${require_utils.shortenHomePath(entry.authPath)} has legacy Codex OAuth profiles to migrate.`),
		...unreferencedSidecars.length > 0 ? [`- Found ${unreferencedSidecars.length} unreferenced legacy Codex OAuth sidecar credential file${unreferencedSidecars.length === 1 ? "" : "s"}.`, `- Unreferenced sidecar files are left in place because external agent directories outside this scan may still reference them.`] : [],
		`- ${require_command_format.formatCliCommand("openclaw doctor --fix")} migrates active profiles back to inline OAuth credentials and removes only sidecar files it successfully migrated.`
	].join("\n"), "Auth profiles");
	if (!await params.prompter.confirmAutoFix({
		message: "Migrate legacy Codex OAuth credentials now?",
		initialValue: true
	})) return result;
	const migratedSidecarsByRefId = /* @__PURE__ */ new Map();
	const unresolvedRefIds = /* @__PURE__ */ new Set();
	for (const store of stores) {
		let migratedCount = 0;
		const storeMigratedSidecarsByRefId = /* @__PURE__ */ new Map();
		for (const profile of store.profiles) {
			const material = loadLegacyOAuthSidecarMaterial({
				...profile,
				env
			});
			if (!material) {
				unresolvedRefIds.add(profile.ref.id);
				result.warnings.push(`Could not decrypt legacy OAuth sidecar for ${profile.profileId} in ${require_utils.shortenHomePath(store.authPath)}; re-authenticate this profile.`);
				continue;
			}
			if (applyLegacyOAuthSidecarMaterial({
				raw: store.raw,
				profile,
				material
			})) {
				migratedCount += 1;
				storeMigratedSidecarsByRefId.set(profile.ref.id, resolveLegacyOAuthSidecarPath(profile.ref, env));
			} else unresolvedRefIds.add(profile.ref.id);
		}
		if (migratedCount === 0) continue;
		try {
			const backupPath = backupLegacyOAuthSidecarStore(store.authPath, now);
			if (!("version" in store.raw)) store.raw.version = 1;
			require_json_file.saveJsonFile(store.authPath, store.raw);
			for (const [refId, sidecarPath] of storeMigratedSidecarsByRefId) migratedSidecarsByRefId.set(refId, sidecarPath);
			result.changes.push(`Migrated ${migratedCount} legacy Codex OAuth profile${migratedCount === 1 ? "" : "s"} in ${require_utils.shortenHomePath(store.authPath)} to inline credentials (backup: ${require_utils.shortenHomePath(backupPath)}).`);
		} catch (err) {
			for (const refId of storeMigratedSidecarsByRefId.keys()) unresolvedRefIds.add(refId);
			result.warnings.push(`Failed to migrate legacy OAuth sidecars in ${require_utils.shortenHomePath(store.authPath)}: ${String(err)}`);
		}
	}
	for (const [refId, sidecarPath] of migratedSidecarsByRefId) {
		if (unresolvedRefIds.has(refId)) continue;
		try {
			node_fs.default.rmSync(sidecarPath, { force: true });
		} catch (err) {
			result.warnings.push(`Failed to remove migrated legacy OAuth sidecar ${require_utils.shortenHomePath(sidecarPath)}: ${String(err)}`);
		}
	}
	if (unreferencedSidecars.length > 0) result.warnings.push(`Found ${unreferencedSidecars.length} unreferenced legacy Codex OAuth sidecar credential file${unreferencedSidecars.length === 1 ? "" : "s"}; left in place because external agent directories outside this scan may still reference ${unreferencedSidecars.length === 1 ? "it" : "them"}.`);
	if (result.changes.length > 0) require_store.clearRuntimeAuthProfileStoreSnapshots();
	if (emitNotes && result.changes.length > 0) require_note.note(result.changes.map((change) => `- ${change}`).join("\n"), "Doctor changes");
	if (emitNotes && result.warnings.length > 0) require_note.note(result.warnings.map((warning) => `- ${warning}`).join("\n"), "Doctor warnings");
	return result;
}
const testing = {
	buildLegacyOAuthSecretAad: legacyOAuthSidecarTestUtils.buildLegacyOAuthSecretAad,
	buildLegacyOAuthSecretKey: legacyOAuthSidecarTestUtils.buildLegacyOAuthSecretKey
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.doctorAuthOAuthSidecarTestApi")] = testing;
//#endregion
exports.maybeRepairLegacyOAuthSidecarProfiles = maybeRepairLegacyOAuthSidecarProfiles;
