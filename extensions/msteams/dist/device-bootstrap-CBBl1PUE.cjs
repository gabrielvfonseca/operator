const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_device_auth = require("./device-auth-Bt1d1HUq.cjs");
const require_device_identity = require("./device-identity-C6ZGDbLx.cjs");
const require_secret_equal = require("./secret-equal-_vlQ14qZ.cjs");
const require_operator_scope_compat = require("./operator-scope-compat-C_XF682D.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let node_crypto = require("node:crypto");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/shared/device-bootstrap-profile.ts
/** Operator scopes allowed to cross the short-lived bootstrap handoff boundary. */
const BOOTSTRAP_HANDOFF_OPERATOR_SCOPES = [
	"operator.approvals",
	"operator.read",
	"operator.talk.secrets",
	"operator.write"
];
const BOOTSTRAP_HANDOFF_OPERATOR_SCOPE_SET = new Set(BOOTSTRAP_HANDOFF_OPERATOR_SCOPES);
/** Full native-mobile operator scopes allowed only by the closed mobile setup profile. */
const MOBILE_FULL_ACCESS_OPERATOR_SCOPES = ["operator.admin", ...BOOTSTRAP_HANDOFF_OPERATOR_SCOPES];
const MOBILE_FULL_ACCESS_OPERATOR_SCOPE_SET = new Set(MOBILE_FULL_ACCESS_OPERATOR_SCOPES);
/** Existing least-privilege setup-code/QR profile. */
const PAIRING_SETUP_BOOTSTRAP_PROFILE = {
	roles: ["node", "operator"],
	scopes: [...BOOTSTRAP_HANDOFF_OPERATOR_SCOPES]
};
/** Full native-mobile setup profile for explicitly authorized setup surfaces. */
const FULL_ACCESS_PAIRING_SETUP_BOOTSTRAP_PROFILE = {
	roles: ["node", "operator"],
	scopes: [...MOBILE_FULL_ACCESS_OPERATOR_SCOPES],
	purpose: "mobile-full"
};
/** Node-only setup profile for companions that never act as operators. */
const NODE_PAIRING_SETUP_BOOTSTRAP_PROFILE = {
	roles: ["node"],
	scopes: []
};
/** Compare normalized bootstrap profiles, including their closed purpose. */
function deviceBootstrapProfilesEqual(left, right) {
	const profile = normalizeDeviceBootstrapProfile(left);
	const expected = normalizeDeviceBootstrapProfile(right);
	return profile.purpose === expected.purpose && profile.roles.length === expected.roles.length && profile.scopes.length === expected.scopes.length && profile.roles.every((role, index) => role === expected.roles[index]) && profile.scopes.every((scope, index) => scope === expected.scopes[index]);
}
function matchesBootstrapProfile(input, expected) {
	return deviceBootstrapProfilesEqual(input, expected);
}
/** Return whether an input matches either supported native-mobile setup profile. */
function isMobilePairingSetupBootstrapProfile(input) {
	return isPairingSetupBootstrapProfile(input) || matchesBootstrapProfile(input, FULL_ACCESS_PAIRING_SETUP_BOOTSTRAP_PROFILE);
}
/** Return whether an input exactly matches the existing limited setup profile. */
function isPairingSetupBootstrapProfile(input) {
	return matchesBootstrapProfile(input, PAIRING_SETUP_BOOTSTRAP_PROFILE);
}
/** Return whether an input exactly matches the node-only companion setup profile. */
function isNodePairingSetupBootstrapProfile(input) {
	return matchesBootstrapProfile(input, NODE_PAIRING_SETUP_BOOTSTRAP_PROFILE);
}
/** Resolve the subset of requested scopes a bootstrap profile may carry for one role. */
function resolveBootstrapProfileScopesForRole(role, scopes, purpose) {
	const normalizedRole = require_device_auth.normalizeDeviceAuthRole(role);
	const normalizedScopes = require_device_auth.normalizeDeviceAuthScopes(Array.from(scopes));
	if (normalizedRole === "operator") {
		const allowedScopes = purpose === "mobile-full" ? MOBILE_FULL_ACCESS_OPERATOR_SCOPE_SET : BOOTSTRAP_HANDOFF_OPERATOR_SCOPE_SET;
		return normalizedScopes.filter((scope) => allowedScopes.has(scope));
	}
	return [];
}
/** Resolve bounded bootstrap handoff scopes across a role set. */
function resolveBootstrapProfileScopesForRoles(roles, scopes, purpose) {
	return require_device_auth.normalizeDeviceAuthScopes(roles.flatMap((role) => resolveBootstrapProfileScopesForRole(role, scopes, purpose)));
}
/** Resolve one role's scopes directly from a normalized bootstrap profile. */
function resolveDeviceProfileRoleScopes(profile, role, scopes = profile.scopes) {
	return resolveBootstrapProfileScopesForRole(role, scopes, profile.purpose);
}
/** Resolve role-set scopes directly from a normalized bootstrap profile. */
function resolveDeviceProfileScopes(profile, roles, scopes = profile.scopes) {
	return resolveBootstrapProfileScopesForRoles(roles, scopes, profile.purpose);
}
/** Normalize a requested bootstrap profile and strip scopes outside the handoff allowlist. */
function normalizeDeviceBootstrapHandoffProfile(input) {
	const profile = normalizeDeviceBootstrapProfile(input);
	return {
		roles: profile.roles,
		scopes: resolveBootstrapProfileScopesForRoles(profile.roles, profile.scopes, profile.purpose),
		...profile.purpose ? { purpose: profile.purpose } : {}
	};
}
function normalizeBootstrapRoles(roles) {
	if (!Array.isArray(roles)) return [];
	const out = /* @__PURE__ */ new Set();
	for (const role of roles) {
		const normalized = require_device_auth.normalizeDeviceAuthRole(role);
		if (normalized) out.add(normalized);
	}
	return [...out].toSorted();
}
/** Normalize caller-provided bootstrap roles/scopes without applying handoff bounds. */
function normalizeDeviceBootstrapProfile(input) {
	const purpose = input?.purpose === "control-ui" || input?.purpose === "mobile-full" ? input.purpose : void 0;
	return {
		roles: normalizeBootstrapRoles(input?.roles),
		scopes: require_device_auth.normalizeDeviceAuthScopes(input?.scopes ? [...input.scopes] : []),
		...purpose ? { purpose } : {}
	};
}
//#endregion
//#region src/infra/device-pairing-store.ts
/** Route an explicit pairing base dir (tests, alternate state roots) to that dir's DB. */
function resolveDevicePairingStateDbOptions(baseDir) {
	return baseDir ? { env: {
		...process.env,
		OPERATOR_STATE_DIR: baseDir
	} } : {};
}
const APPROVAL_KINDS = new Set(Object.keys({
	owner: true,
	silent: true,
	"trusted-cidr": true,
	"ssh-verified": true,
	bootstrap: true
}));
function toJsonColumn(value) {
	return value === void 0 ? null : JSON.stringify(value);
}
function fromJsonColumn(value) {
	return value === null ? void 0 : JSON.parse(value);
}
function toBooleanColumn(value) {
	return value === void 0 ? null : value ? 1 : 0;
}
function optional(key, value) {
	return value === null ? {} : { [key]: value };
}
function toPendingRow(record) {
	return {
		request_id: record.requestId,
		device_id: record.deviceId,
		public_key: record.publicKey,
		display_name: record.displayName ?? null,
		platform: record.platform ?? null,
		device_family: record.deviceFamily ?? null,
		client_id: record.clientId ?? null,
		client_mode: record.clientMode ?? null,
		role: record.role ?? null,
		roles_json: toJsonColumn(record.roles),
		scopes_json: toJsonColumn(record.scopes),
		remote_ip: record.remoteIp ?? null,
		silent: toBooleanColumn(record.silent),
		is_repair: toBooleanColumn(record.isRepair),
		ts: record.ts,
		refreshed_at_ms: record.refreshedAtMs ?? null
	};
}
function fromPendingRow(row) {
	return {
		requestId: row.request_id,
		deviceId: row.device_id,
		publicKey: row.public_key,
		...optional("displayName", row.display_name),
		...optional("platform", row.platform),
		...optional("deviceFamily", row.device_family),
		...optional("clientId", row.client_id),
		...optional("clientMode", row.client_mode),
		...optional("role", row.role),
		...optional("roles", fromJsonColumn(row.roles_json) ?? null),
		...optional("scopes", fromJsonColumn(row.scopes_json) ?? null),
		...optional("remoteIp", row.remote_ip),
		...optional("silent", row.silent === null ? null : row.silent !== 0),
		...optional("isRepair", row.is_repair === null ? null : row.is_repair !== 0),
		ts: row.ts,
		...optional("refreshedAtMs", row.refreshed_at_ms)
	};
}
function toPairedRow(device) {
	return {
		device_id: device.deviceId,
		public_key: device.publicKey,
		display_name: device.displayName ?? null,
		operator_label: device.operatorLabel ?? null,
		platform: device.platform ?? null,
		device_family: device.deviceFamily ?? null,
		client_id: device.clientId ?? null,
		client_mode: device.clientMode ?? null,
		role: device.role ?? null,
		roles_json: toJsonColumn(device.roles),
		scopes_json: toJsonColumn(device.scopes),
		approved_scopes_json: toJsonColumn(device.approvedScopes),
		remote_ip: device.remoteIp ?? null,
		tokens_json: toJsonColumn(device.tokens),
		approved_via: device.approvedVia ?? null,
		node_surface_json: toJsonColumn(device.nodeSurface),
		pending_node_surface_json: toJsonColumn(device.pendingNodeSurface),
		created_at_ms: device.createdAtMs,
		approved_at_ms: device.approvedAtMs,
		last_seen_at_ms: device.lastSeenAtMs ?? null,
		last_seen_reason: device.lastSeenReason ?? null
	};
}
function fromApprovedViaColumn(value) {
	return value !== null && APPROVAL_KINDS.has(value) ? value : null;
}
function fromPairedRow(row) {
	return {
		deviceId: row.device_id,
		publicKey: row.public_key,
		...optional("displayName", row.display_name),
		...optional("operatorLabel", row.operator_label),
		...optional("platform", row.platform),
		...optional("deviceFamily", row.device_family),
		...optional("clientId", row.client_id),
		...optional("clientMode", row.client_mode),
		...optional("role", row.role),
		...optional("roles", fromJsonColumn(row.roles_json) ?? null),
		...optional("scopes", fromJsonColumn(row.scopes_json) ?? null),
		...optional("approvedScopes", fromJsonColumn(row.approved_scopes_json) ?? null),
		...optional("remoteIp", row.remote_ip),
		...optional("tokens", fromJsonColumn(row.tokens_json) ?? null),
		...optional("approvedVia", fromApprovedViaColumn(row.approved_via)),
		...optional("nodeSurface", fromJsonColumn(row.node_surface_json) ?? null),
		...optional("pendingNodeSurface", fromJsonColumn(row.pending_node_surface_json) ?? null),
		createdAtMs: row.created_at_ms,
		approvedAtMs: row.approved_at_ms,
		...optional("lastSeenAtMs", row.last_seen_at_ms),
		...optional("lastSeenReason", row.last_seen_reason)
	};
}
function toBootstrapRow(tokenKey, record) {
	return {
		token_key: tokenKey,
		token: record.token,
		ts: record.ts,
		device_id: record.deviceId ?? null,
		public_key: record.publicKey ?? null,
		profile_json: toJsonColumn(record.profile),
		redeemed_profile_json: toJsonColumn(record.redeemedProfile),
		pending_profile_json: toJsonColumn(record.pendingProfile),
		issued_at_ms: record.issuedAtMs,
		last_used_at_ms: record.lastUsedAtMs ?? null
	};
}
function fromBootstrapRow(row) {
	return {
		token: row.token,
		ts: row.ts,
		...optional("deviceId", row.device_id),
		...optional("publicKey", row.public_key),
		...optional("profile", fromJsonColumn(row.profile_json) ?? null),
		...optional("redeemedProfile", fromJsonColumn(row.redeemed_profile_json) ?? null),
		...optional("pendingProfile", fromJsonColumn(row.pending_profile_json) ?? null),
		issuedAtMs: row.issued_at_ms,
		...optional("lastUsedAtMs", row.last_used_at_ms)
	};
}
/** Load the full pending + paired device snapshot from the shared state DB. */
function loadDevicePairingStoreState(baseDir) {
	const { db } = require_openclaw_state_db.openOperatorStateDatabase(resolveDevicePairingStateDbOptions(baseDir));
	const kysely = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
	const pendingById = {};
	for (const row of require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.selectFrom("device_pairing_pending").selectAll()).rows) pendingById[row.request_id] = fromPendingRow(row);
	const pairedByDeviceId = {};
	for (const row of require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.selectFrom("device_pairing_paired").selectAll()).rows) pairedByDeviceId[row.device_id] = fromPairedRow(row);
	return {
		pendingById,
		pairedByDeviceId
	};
}
/** Replace the pending and/or paired table contents with the given snapshot. */
function persistDevicePairingStoreState(state, baseDir, target) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const kysely = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		if (target !== "paired") {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("device_pairing_pending"));
			const rows = Object.values(state.pendingById).map(toPendingRow);
			if (rows.length > 0) require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.insertInto("device_pairing_pending").values(rows));
		}
		if (target !== "pending") {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("device_pairing_paired"));
			const rows = Object.values(state.pairedByDeviceId).map(toPairedRow);
			if (rows.length > 0) require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.insertInto("device_pairing_paired").values(rows));
		}
	}, resolveDevicePairingStateDbOptions(baseDir));
}
/** Load all bootstrap token records keyed by token key. */
function loadDeviceBootstrapTokenRecords(baseDir) {
	const { db } = require_openclaw_state_db.openOperatorStateDatabase(resolveDevicePairingStateDbOptions(baseDir));
	const kysely = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
	const state = {};
	for (const row of require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.selectFrom("device_bootstrap_tokens").selectAll()).rows) state[row.token_key] = fromBootstrapRow(row);
	return state;
}
/** Replace the bootstrap token table contents with the given snapshot. */
function persistDeviceBootstrapTokenRecords(state, baseDir) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const kysely = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.deleteFrom("device_bootstrap_tokens"));
		const rows = Object.entries(state).map(([tokenKey, record]) => toBootstrapRow(tokenKey, record));
		if (rows.length > 0) require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.insertInto("device_bootstrap_tokens").values(rows));
	}, resolveDevicePairingStateDbOptions(baseDir));
}
//#endregion
//#region src/infra/pairing-files.ts
/** Resolve pending/paired JSON file locations for one pairing namespace. */
function resolvePairingPaths(baseDir, subdir) {
	const root = baseDir ?? require_paths.resolveStateDir();
	const dir = node_path.default.join(root, subdir);
	return {
		dir,
		pendingPath: node_path.default.join(dir, "pending.json"),
		pairedPath: node_path.default.join(dir, "paired.json")
	};
}
/** Coerce persisted pairing maps, treating malformed arrays/scalars as empty state. */
function coercePairingStateRecord(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};
	return value;
}
/** Remove pending requests older than the caller's pairing TTL. */
function pruneExpiredPending(pendingById, nowMs, ttlMs) {
	for (const [id, req] of Object.entries(pendingById)) if (nowMs - (req.refreshedAtMs ?? req.ts) > ttlMs) delete pendingById[id];
}
//#endregion
//#region src/infra/pairing-token.ts
/** Random byte length for base64url device/node/bootstrap bearer tokens. */
const PAIRING_TOKEN_BYTES = 32;
/** Generate a URL-safe bearer token for pairing and bootstrap flows. */
function generatePairingToken() {
	return (0, node_crypto.randomBytes)(PAIRING_TOKEN_BYTES).toString("base64url");
}
/** Verify nonblank pairing tokens with constant-time secret comparison. */
function verifyPairingToken(provided, expected) {
	if (provided.trim().length === 0 || expected.trim().length === 0) return false;
	return require_secret_equal.safeEqualSecret(provided, expected);
}
//#endregion
//#region src/infra/device-bootstrap.ts
/** Bootstrap pairing tokens are short-lived bearer credentials for first device auth. */
const DEVICE_BOOTSTRAP_TOKEN_TTL_MS = 600 * 1e3;
const withLock = (0, _openclaw_fs_safe_advanced.createAsyncLock)();
const log = require_subsystem.createSubsystemLogger("device-bootstrap");
function resolveIssuedBootstrapProfileInput(params) {
	if (params.profile) return params.profile;
	if (params.roles || params.scopes) return {
		roles: params.roles,
		scopes: params.scopes
	};
}
function resolvePersistedBootstrapProfile(record) {
	return normalizeDeviceBootstrapProfile(record.profile);
}
function resolvePersistedRedeemedProfile(record) {
	return normalizeDeviceBootstrapProfile(record.redeemedProfile);
}
function resolvePersistedPendingProfile(record) {
	return record.pendingProfile ? normalizeDeviceBootstrapProfile(record.pendingProfile) : null;
}
function resolveRequestedBootstrapProfile(params) {
	return normalizeDeviceBootstrapProfile({
		roles: [params.role],
		scopes: resolveBootstrapProfileScopesForRole(params.role, params.scopes, params.purpose),
		purpose: params.purpose
	});
}
function resolveIssuedBootstrapProfile(params) {
	const input = resolveIssuedBootstrapProfileInput(params);
	if (input) return normalizeDeviceBootstrapHandoffProfile(input);
	return PAIRING_SETUP_BOOTSTRAP_PROFILE;
}
function warnIfIssuedBootstrapScopesWereStripped(params) {
	if (!params.input) return;
	const requestedProfile = normalizeDeviceBootstrapProfile(params.input);
	const requestedScopes = requestedProfile.scopes;
	if (requestedScopes.length === 0) return;
	const retainedScopeSet = new Set(params.profile.scopes);
	const strippedScopes = requestedScopes.filter((scope) => !retainedScopeSet.has(scope));
	if (strippedScopes.length === 0) return;
	log.warn("bootstrap_token_scopes_stripped", {
		roles: requestedProfile.roles,
		requestedScopes,
		retainedScopes: params.profile.scopes,
		strippedScopes,
		consoleMessage: "bootstrap token scopes stripped to bootstrap handoff allowlist"
	});
}
function bootstrapProfileAllowsRequest(params) {
	return params.allowedProfile.roles.includes(params.requestedRole) && require_operator_scope_compat.roleScopesAllow({
		role: params.requestedRole,
		requestedScopes: params.requestedScopes,
		allowedScopes: params.allowedProfile.scopes
	});
}
function bootstrapProfileSatisfiesProfile(params) {
	for (const requiredRole of params.requiredProfile.roles) {
		if (!params.actualProfile.roles.includes(requiredRole)) return false;
		const requiredScopes = resolveBootstrapProfileScopesForRole(requiredRole, params.requiredProfile.scopes, params.requiredProfile.purpose);
		if (requiredScopes.length > 0 && !bootstrapProfileAllowsRequest({
			allowedProfile: params.actualProfile,
			requestedRole: requiredRole,
			requestedScopes: requiredScopes
		})) return false;
	}
	return true;
}
function normalizeBootstrapPublicKey(publicKey) {
	const trimmed = publicKey.trim();
	if (!trimmed) return "";
	if (trimmed.includes("BEGIN") || /[+/=]/.test(trimmed)) return require_device_identity.normalizeDevicePublicKeyBase64Url(trimmed) ?? trimmed;
	return trimmed;
}
async function loadState(baseDir) {
	const state = loadDeviceBootstrapTokenRecords(baseDir);
	pruneExpiredPending(state, (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(Date.now()) ?? 0, DEVICE_BOOTSTRAP_TOKEN_TTL_MS);
	return state;
}
/** Issue a short-lived bootstrap token with a bounded role/scope handoff profile. */
async function issueDeviceBootstrapToken(params = {}) {
	return await withLock(async () => {
		const state = await loadState(params.baseDir);
		const token = generatePairingToken();
		const issuedAtMs = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(Date.now());
		const expiresAtMs = issuedAtMs === void 0 ? void 0 : (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(DEVICE_BOOTSTRAP_TOKEN_TTL_MS, { nowMs: issuedAtMs });
		if (issuedAtMs === void 0 || expiresAtMs === void 0) throw new Error("Device bootstrap token expiry could not be resolved.");
		const profileInput = resolveIssuedBootstrapProfileInput(params);
		const profile = resolveIssuedBootstrapProfile(params);
		warnIfIssuedBootstrapScopesWereStripped({
			input: profileInput,
			profile
		});
		state[token] = {
			token,
			ts: issuedAtMs,
			profile,
			redeemedProfile: normalizeDeviceBootstrapProfile(void 0),
			issuedAtMs
		};
		persistDeviceBootstrapTokenRecords(state, params.baseDir);
		return {
			token,
			expiresAtMs
		};
	});
}
/** Revoke one bootstrap token and return its record for best-effort restore flows. */
async function revokeDeviceBootstrapToken(params) {
	return await withLock(async () => {
		const providedToken = params.token.trim();
		if (!providedToken) return { removed: false };
		const state = await loadState(params.baseDir);
		const found = Object.entries(state).find(([, candidate]) => verifyPairingToken(providedToken, candidate.token));
		if (!found) return { removed: false };
		const [tokenKey, record] = found;
		delete state[tokenKey];
		persistDeviceBootstrapTokenRecords(state, params.baseDir);
		return {
			removed: true,
			record
		};
	});
}
/** Revoke bootstrap tokens that are already bound to a specific device identity. */
async function revokeDeviceBootstrapTokensForDevice(params) {
	return await withLock(async () => {
		const deviceId = params.deviceId.trim();
		const publicKey = normalizeBootstrapPublicKey(params.publicKey);
		if (!deviceId || !publicKey) return { removed: 0 };
		const state = await loadState(params.baseDir);
		let removed = 0;
		for (const [tokenKey, record] of Object.entries(state)) {
			const recordPublicKey = typeof record.publicKey === "string" ? normalizeBootstrapPublicKey(record.publicKey) : void 0;
			if (record.deviceId?.trim() === deviceId && recordPublicKey === publicKey) {
				delete state[tokenKey];
				removed += 1;
			}
		}
		if (removed > 0) persistDeviceBootstrapTokenRecords(state, params.baseDir);
		return { removed };
	});
}
/** Restore a previously revoked bootstrap token record after a downstream send failure. */
async function restoreDeviceBootstrapToken(params) {
	return await withLock(async () => {
		const state = await loadState(params.baseDir);
		state[params.record.token] = params.record;
		persistDeviceBootstrapTokenRecords(state, params.baseDir);
	});
}
/** Read the issued profile for a valid token without binding or redeeming it. */
async function getDeviceBootstrapTokenProfile(params) {
	return await withLock(async () => {
		const providedToken = params.token.trim();
		if (!providedToken) return null;
		const state = await loadState(params.baseDir);
		const found = Object.values(state).find((candidate) => verifyPairingToken(providedToken, candidate.token));
		return found ? resolvePersistedBootstrapProfile(found) : null;
	});
}
/** Record that one role/scope leg of a multi-role bootstrap handoff was redeemed. */
async function redeemDeviceBootstrapTokenProfile(params) {
	return await withLock(async () => {
		const providedToken = params.token.trim();
		if (!providedToken) return {
			recorded: false,
			fullyRedeemed: false
		};
		const state = await loadState(params.baseDir);
		const found = Object.entries(state).find(([, candidate]) => verifyPairingToken(providedToken, candidate.token));
		if (!found) return {
			recorded: false,
			fullyRedeemed: false
		};
		const [tokenKey, record] = found;
		const issuedProfile = resolvePersistedBootstrapProfile(record);
		const pendingProfile = resolvePersistedPendingProfile(record);
		const redeemedProfile = normalizeDeviceBootstrapProfile({
			roles: [...resolvePersistedRedeemedProfile(record).roles, params.role],
			scopes: [...resolvePersistedRedeemedProfile(record).scopes, ...resolveBootstrapProfileScopesForRole(params.role, params.scopes, issuedProfile.purpose)],
			purpose: issuedProfile.purpose
		});
		const nextPendingProfile = pendingProfile && !bootstrapProfileSatisfiesProfile({
			actualProfile: redeemedProfile,
			requiredProfile: pendingProfile
		}) ? pendingProfile : void 0;
		const nextRecord = {
			...record,
			profile: issuedProfile,
			redeemedProfile
		};
		if (nextPendingProfile) nextRecord.pendingProfile = nextPendingProfile;
		else delete nextRecord.pendingProfile;
		state[tokenKey] = nextRecord;
		persistDeviceBootstrapTokenRecords(state, params.baseDir);
		return {
			recorded: true,
			fullyRedeemed: bootstrapProfileSatisfiesProfile({
				actualProfile: redeemedProfile,
				requiredProfile: issuedProfile
			})
		};
	});
}
/** Verify a bootstrap token, bind it to the first device identity, and stage requested scopes. */
async function verifyDeviceBootstrapToken(params) {
	return await withLock(async () => {
		const state = await loadState(params.baseDir);
		const providedToken = params.token.trim();
		if (!providedToken) return {
			ok: false,
			reason: "bootstrap_token_invalid"
		};
		const found = Object.entries(state).find(([, candidate]) => verifyPairingToken(providedToken, candidate.token));
		if (!found) return {
			ok: false,
			reason: "bootstrap_token_invalid"
		};
		const [tokenKey, record] = found;
		const deviceId = params.deviceId.trim();
		const publicKey = normalizeBootstrapPublicKey(params.publicKey);
		const role = params.role.trim();
		if (!deviceId || !publicKey || !role) return {
			ok: false,
			reason: "bootstrap_token_invalid"
		};
		const allowedProfile = resolvePersistedBootstrapProfile(record);
		if (allowedProfile.roles.length === 0 || !bootstrapProfileAllowsRequest({
			allowedProfile,
			requestedRole: role,
			requestedScopes: params.scopes
		})) return {
			ok: false,
			reason: "bootstrap_token_invalid"
		};
		const requestedProfile = resolveRequestedBootstrapProfile({
			role,
			scopes: params.scopes,
			purpose: allowedProfile.purpose
		});
		const boundDeviceId = record.deviceId?.trim();
		const boundPublicKey = typeof record.publicKey === "string" ? normalizeBootstrapPublicKey(record.publicKey) : void 0;
		if (boundDeviceId || boundPublicKey) {
			if (boundDeviceId !== deviceId || boundPublicKey !== publicKey) return {
				ok: false,
				reason: "bootstrap_token_invalid"
			};
			const pendingProfile = resolvePersistedPendingProfile(record);
			if (pendingProfile && !deviceBootstrapProfilesEqual(pendingProfile, requestedProfile)) return {
				ok: false,
				reason: "bootstrap_token_invalid"
			};
			state[tokenKey] = {
				...record,
				profile: allowedProfile,
				pendingProfile: pendingProfile ?? requestedProfile,
				deviceId,
				publicKey,
				lastUsedAtMs: Date.now()
			};
			persistDeviceBootstrapTokenRecords(state, params.baseDir);
			return { ok: true };
		}
		state[tokenKey] = {
			...record,
			profile: allowedProfile,
			pendingProfile: requestedProfile,
			deviceId,
			publicKey,
			lastUsedAtMs: Date.now()
		};
		persistDeviceBootstrapTokenRecords(state, params.baseDir);
		return { ok: true };
	});
}
/**
* Reads the already-bound bootstrap profile for a verified device identity.
*
* Call this only after `verifyDeviceBootstrapToken()` has returned `{ ok: true }`
* for the same `token` / `deviceId` / `publicKey` tuple in the current handshake.
*/
async function getBoundDeviceBootstrapProfile(params) {
	return await withLock(async () => {
		const state = await loadState(params.baseDir);
		const providedToken = params.token.trim();
		if (!providedToken) return null;
		const found = Object.entries(state).find(([, candidate]) => verifyPairingToken(providedToken, candidate.token));
		if (!found) return null;
		const [, record] = found;
		const deviceId = params.deviceId.trim();
		const publicKey = normalizeBootstrapPublicKey(params.publicKey);
		if (!deviceId || !publicKey) return null;
		const recordPublicKey = typeof record.publicKey === "string" ? normalizeBootstrapPublicKey(record.publicKey) : void 0;
		if (record.deviceId?.trim() !== deviceId || recordPublicKey !== publicKey) return null;
		return resolvePersistedBootstrapProfile(record);
	});
}
//#endregion
Object.defineProperty(exports, "BOOTSTRAP_HANDOFF_OPERATOR_SCOPES", {
	enumerable: true,
	get: function() {
		return BOOTSTRAP_HANDOFF_OPERATOR_SCOPES;
	}
});
Object.defineProperty(exports, "FULL_ACCESS_PAIRING_SETUP_BOOTSTRAP_PROFILE", {
	enumerable: true,
	get: function() {
		return FULL_ACCESS_PAIRING_SETUP_BOOTSTRAP_PROFILE;
	}
});
Object.defineProperty(exports, "NODE_PAIRING_SETUP_BOOTSTRAP_PROFILE", {
	enumerable: true,
	get: function() {
		return NODE_PAIRING_SETUP_BOOTSTRAP_PROFILE;
	}
});
Object.defineProperty(exports, "PAIRING_SETUP_BOOTSTRAP_PROFILE", {
	enumerable: true,
	get: function() {
		return PAIRING_SETUP_BOOTSTRAP_PROFILE;
	}
});
Object.defineProperty(exports, "coercePairingStateRecord", {
	enumerable: true,
	get: function() {
		return coercePairingStateRecord;
	}
});
Object.defineProperty(exports, "deviceBootstrapProfilesEqual", {
	enumerable: true,
	get: function() {
		return deviceBootstrapProfilesEqual;
	}
});
Object.defineProperty(exports, "generatePairingToken", {
	enumerable: true,
	get: function() {
		return generatePairingToken;
	}
});
Object.defineProperty(exports, "getBoundDeviceBootstrapProfile", {
	enumerable: true,
	get: function() {
		return getBoundDeviceBootstrapProfile;
	}
});
Object.defineProperty(exports, "getDeviceBootstrapTokenProfile", {
	enumerable: true,
	get: function() {
		return getDeviceBootstrapTokenProfile;
	}
});
Object.defineProperty(exports, "isMobilePairingSetupBootstrapProfile", {
	enumerable: true,
	get: function() {
		return isMobilePairingSetupBootstrapProfile;
	}
});
Object.defineProperty(exports, "isNodePairingSetupBootstrapProfile", {
	enumerable: true,
	get: function() {
		return isNodePairingSetupBootstrapProfile;
	}
});
Object.defineProperty(exports, "issueDeviceBootstrapToken", {
	enumerable: true,
	get: function() {
		return issueDeviceBootstrapToken;
	}
});
Object.defineProperty(exports, "loadDevicePairingStoreState", {
	enumerable: true,
	get: function() {
		return loadDevicePairingStoreState;
	}
});
Object.defineProperty(exports, "persistDevicePairingStoreState", {
	enumerable: true,
	get: function() {
		return persistDevicePairingStoreState;
	}
});
Object.defineProperty(exports, "pruneExpiredPending", {
	enumerable: true,
	get: function() {
		return pruneExpiredPending;
	}
});
Object.defineProperty(exports, "redeemDeviceBootstrapTokenProfile", {
	enumerable: true,
	get: function() {
		return redeemDeviceBootstrapTokenProfile;
	}
});
Object.defineProperty(exports, "resolveBootstrapProfileScopesForRole", {
	enumerable: true,
	get: function() {
		return resolveBootstrapProfileScopesForRole;
	}
});
Object.defineProperty(exports, "resolveBootstrapProfileScopesForRoles", {
	enumerable: true,
	get: function() {
		return resolveBootstrapProfileScopesForRoles;
	}
});
Object.defineProperty(exports, "resolveDeviceProfileRoleScopes", {
	enumerable: true,
	get: function() {
		return resolveDeviceProfileRoleScopes;
	}
});
Object.defineProperty(exports, "resolveDeviceProfileScopes", {
	enumerable: true,
	get: function() {
		return resolveDeviceProfileScopes;
	}
});
Object.defineProperty(exports, "resolvePairingPaths", {
	enumerable: true,
	get: function() {
		return resolvePairingPaths;
	}
});
Object.defineProperty(exports, "restoreDeviceBootstrapToken", {
	enumerable: true,
	get: function() {
		return restoreDeviceBootstrapToken;
	}
});
Object.defineProperty(exports, "revokeDeviceBootstrapToken", {
	enumerable: true,
	get: function() {
		return revokeDeviceBootstrapToken;
	}
});
Object.defineProperty(exports, "revokeDeviceBootstrapTokensForDevice", {
	enumerable: true,
	get: function() {
		return revokeDeviceBootstrapTokensForDevice;
	}
});
Object.defineProperty(exports, "verifyDeviceBootstrapToken", {
	enumerable: true,
	get: function() {
		return verifyDeviceBootstrapToken;
	}
});
Object.defineProperty(exports, "verifyPairingToken", {
	enumerable: true,
	get: function() {
		return verifyPairingToken;
	}
});
