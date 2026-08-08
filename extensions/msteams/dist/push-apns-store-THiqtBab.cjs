const require_errors = require("./errors-BqS4bzom.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_http_body = require("./http-body-BwUnoq2M.cjs");
const require_hostname = require("./hostname-C4OpmN1p.cjs");
const require_device_identity = require("./device-identity-C6ZGDbLx.cjs");
let node_url = require("node:url");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/push-apns.relay.ts
/** Hosted APNs relay origin used only when registrations prove they were minted there. */
const DEFAULT_APNS_RELAY_BASE_URL = "https://ios-push-relay.operator.ai";
const DEFAULT_APNS_SANDBOX_RELAY_BASE_URL = "https://ios-push-relay-sandbox.operator.ai";
const DEFAULT_APNS_RELAY_TIMEOUT_MS = 1e4;
const APNS_RELAY_MAX_RESPONSE_BYTES = 16 * 1024 * 1024;
const GATEWAY_DEVICE_ID_HEADER = "x-operator-gateway-device-id";
const GATEWAY_SIGNATURE_HEADER = "x-operator-gateway-signature";
const GATEWAY_SIGNED_AT_HEADER = "x-operator-gateway-signed-at-ms";
function normalizeNonEmptyString(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? "";
	return trimmed.length > 0 ? trimmed : null;
}
function normalizeTimeoutMs(value) {
	const raw = typeof value === "number" ? value : typeof value === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) : void 0;
	if (raw === void 0 || raw === "") return DEFAULT_APNS_RELAY_TIMEOUT_MS;
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(typeof raw === "number" ? raw : (0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictPositiveInteger)(raw), DEFAULT_APNS_RELAY_TIMEOUT_MS, 1e3);
}
function readAllowHttp(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value) : void 0;
	return normalized === "1" || normalized === "true" || normalized === "yes";
}
function isLoopbackRelayHostname(hostname) {
	const normalized = require_hostname.normalizeHostname(hostname);
	return normalized === "localhost" || normalized === "::1" || normalized === "[::1]" || /^127(?:\.\d{1,3}){3}$/.test(normalized);
}
function parseReason(value) {
	return typeof value === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) : void 0;
}
function parseRelayEnvironment(value) {
	const normalized = typeof value === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value) : "";
	if (normalized === "sandbox" || normalized === "production") return normalized;
}
function normalizeApnsRelayBaseUrlWithPolicy(baseUrl, allowLoopbackHttpWithoutEnvOptIn) {
	try {
		const parsed = new node_url.URL(baseUrl);
		if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("unsupported protocol");
		if (!parsed.hostname) throw new Error("host required");
		if (parsed.protocol === "http:" && !allowLoopbackHttpWithoutEnvOptIn) throw new Error("http relay URLs require OPERATOR_APNS_RELAY_ALLOW_HTTP=true (development only)");
		if (parsed.protocol === "http:" && !isLoopbackRelayHostname(parsed.hostname)) throw new Error("http relay URLs are limited to loopback hosts");
		if (parsed.username || parsed.password) throw new Error("userinfo is not allowed");
		if (parsed.search || parsed.hash) throw new Error("query and fragment are not allowed");
		return {
			ok: true,
			value: parsed.toString().replace(/\/+$/, "")
		};
	} catch (err) {
		return {
			ok: false,
			error: require_errors.formatErrorMessage(err)
		};
	}
}
/** Validate and canonicalize an APNs relay base URL for config and registration origins. */
function normalizeApnsRelayBaseUrl(baseUrl, env = process.env) {
	return normalizeApnsRelayBaseUrlWithPolicy(baseUrl, readAllowHttp(env.OPERATOR_APNS_RELAY_ALLOW_HTTP));
}
/** Revalidate a canonical persisted relay URL without reapplying current input policy. */
function normalizePersistedApnsRelayBaseUrl(baseUrl) {
	return normalizeApnsRelayBaseUrlWithPolicy(baseUrl, true);
}
function buildRelayGatewaySignaturePayload(params) {
	return [
		"operator-relay-send-v1",
		params.gatewayDeviceId.trim(),
		String(Math.trunc(params.signedAtMs)),
		params.bodyJson
	].join("\n");
}
/** Resolve the relay endpoint from env/config and require it to match relay-minted registrations. */
function resolveApnsRelayConfigFromEnv(env = process.env, gatewayConfig, options = {}) {
	const configuredRelay = gatewayConfig?.push?.apns?.relay;
	const envBaseUrl = normalizeNonEmptyString(env.OPERATOR_APNS_RELAY_BASE_URL);
	const configBaseUrl = normalizeNonEmptyString(configuredRelay?.baseUrl);
	const explicitBaseUrl = envBaseUrl ?? configBaseUrl;
	const normalizedRegistrationOrigin = options.registrationRelayOrigin ? normalizeApnsRelayBaseUrl(options.registrationRelayOrigin, env) : void 0;
	if (normalizedRegistrationOrigin && !normalizedRegistrationOrigin.ok) return {
		ok: false,
		error: `invalid relay registration origin (${options.registrationRelayOrigin}): ${normalizedRegistrationOrigin.error}`
	};
	const hostedRelayBaseUrl = normalizedRegistrationOrigin?.value === DEFAULT_APNS_RELAY_BASE_URL ? DEFAULT_APNS_RELAY_BASE_URL : normalizedRegistrationOrigin?.value === DEFAULT_APNS_SANDBOX_RELAY_BASE_URL ? DEFAULT_APNS_SANDBOX_RELAY_BASE_URL : void 0;
	const baseUrl = explicitBaseUrl ?? hostedRelayBaseUrl;
	const baseUrlSource = envBaseUrl ? "OPERATOR_APNS_RELAY_BASE_URL" : configBaseUrl ? "gateway.push.apns.relay.baseUrl" : "default APNs relay base URL";
	if (!baseUrl) return {
		ok: false,
		error: "APNs relay config missing: set gateway.push.apns.relay.baseUrl or OPERATOR_APNS_RELAY_BASE_URL for relay registrations without the hosted relay origin"
	};
	const normalizedBaseUrl = normalizeApnsRelayBaseUrl(baseUrl, env);
	if (!normalizedBaseUrl.ok) return {
		ok: false,
		error: `invalid ${baseUrlSource} (${baseUrl}): ${normalizedBaseUrl.error}`
	};
	if (normalizedRegistrationOrigin && normalizedRegistrationOrigin.value !== normalizedBaseUrl.value) return {
		ok: false,
		error: `APNs relay config origin mismatch: registration uses ${normalizedRegistrationOrigin.value} but ${baseUrlSource} is ${normalizedBaseUrl.value}`
	};
	return {
		ok: true,
		value: {
			baseUrl: normalizedBaseUrl.value,
			timeoutMs: normalizeTimeoutMs(env.OPERATOR_APNS_RELAY_TIMEOUT_MS ?? configuredRelay?.timeoutMs)
		}
	};
}
var ApnsRelayResponseTooLargeError = class extends Error {
	constructor(size, maxBytes) {
		super(`APNs relay response exceeded ${maxBytes} bytes (${size} bytes received)`);
		this.size = size;
		this.maxBytes = maxBytes;
		this.name = "ApnsRelayResponseTooLargeError";
	}
};
async function sendApnsRelayRequest(params) {
	const response = await fetch(`${params.relayConfig.baseUrl}/v1/push/send`, {
		method: "POST",
		redirect: "manual",
		headers: {
			authorization: `Bearer ${params.sendGrant}`,
			"content-type": "application/json",
			[GATEWAY_DEVICE_ID_HEADER]: params.gatewayDeviceId,
			[GATEWAY_SIGNATURE_HEADER]: params.signature,
			[GATEWAY_SIGNED_AT_HEADER]: String(params.signedAtMs)
		},
		body: params.bodyJson,
		signal: AbortSignal.timeout(params.relayConfig.timeoutMs)
	});
	if (response.status >= 300 && response.status < 400) return {
		ok: false,
		status: response.status,
		reason: "RelayRedirectNotAllowed"
	};
	let json;
	try {
		const buffer = await require_http_body.readResponseWithLimit(response, APNS_RELAY_MAX_RESPONSE_BYTES, { onOverflow: ({ size, maxBytes }) => new ApnsRelayResponseTooLargeError(size, maxBytes) });
		json = JSON.parse(new TextDecoder("utf-8").decode(buffer));
	} catch (err) {
		if (err instanceof ApnsRelayResponseTooLargeError) return {
			ok: false,
			status: response.status,
			reason: "RelayResponseTooLarge"
		};
		json = null;
	}
	const body = json && typeof json === "object" && !Array.isArray(json) ? json : {};
	const status = typeof body.status === "number" && Number.isFinite(body.status) ? Math.trunc(body.status) : response.status;
	const environment = parseRelayEnvironment(body.environment);
	return {
		ok: typeof body.ok === "boolean" ? body.ok : response.ok && status >= 200 && status < 300,
		status,
		apnsId: parseReason(body.apnsId),
		reason: parseReason(body.reason),
		...environment ? { environment } : {},
		tokenSuffix: parseReason(body.tokenSuffix)
	};
}
/** Sign and send an APNs relay push using the gateway device identity. */
async function sendApnsRelayPush(params) {
	const sender = params.requestSender ?? sendApnsRelayRequest;
	const gatewayIdentity = params.gatewayIdentity ?? require_device_identity.loadOrCreateProcessDeviceIdentity();
	const signedAtMs = Date.now();
	const bodyJson = JSON.stringify({
		relayHandle: params.relayHandle,
		pushType: params.pushType,
		priority: Number(params.priority),
		payload: params.payload
	});
	const signature = require_device_identity.signDevicePayload(gatewayIdentity.privateKeyPem, buildRelayGatewaySignaturePayload({
		gatewayDeviceId: gatewayIdentity.deviceId,
		signedAtMs,
		bodyJson
	}));
	return await sender({
		relayConfig: params.relayConfig,
		sendGrant: params.sendGrant,
		relayHandle: params.relayHandle,
		gatewayDeviceId: gatewayIdentity.deviceId,
		signature,
		signedAtMs,
		bodyJson,
		pushType: params.pushType,
		priority: params.priority,
		payload: params.payload
	});
}
//#endregion
//#region src/infra/push-apns-store.ts
const MAX_NODE_ID_LENGTH = 256;
const MAX_TOPIC_LENGTH = 255;
const MAX_APNS_TOKEN_HEX_LENGTH = 512;
const MAX_RELAY_IDENTIFIER_LENGTH = 256;
const MAX_SEND_GRANT_LENGTH = 1024;
const APNS_REGISTRATION_LOOKUP_CHUNK_SIZE = 500;
function apnsStateDatabaseOptions(stateDir) {
	return stateDir ? { env: {
		...process.env,
		OPERATOR_STATE_DIR: stateDir
	} } : { env: process.env };
}
function normalizeApnsNodeId(value) {
	return value.trim();
}
function isValidApnsNodeId(value) {
	return value.length > 0 && value.length <= MAX_NODE_ID_LENGTH;
}
function normalizeApnsToken(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value.trim().replace(/[<>\s]/g, ""));
}
function normalizeRelayHandle(value) {
	return value.trim();
}
function normalizeInstallationId(value) {
	return value.trim();
}
function validateRelayIdentifier(value, fieldName, maxLength = MAX_RELAY_IDENTIFIER_LENGTH) {
	if (!value) throw new Error(`${fieldName} required`);
	if (value.length > maxLength) throw new Error(`${fieldName} too long`);
	if (/[^\x21-\x7e]/.test(value)) throw new Error(`${fieldName} invalid`);
	return value;
}
function isValidRelayIdentifier(value, maxLength = MAX_RELAY_IDENTIFIER_LENGTH) {
	return value.length > 0 && value.length <= maxLength && !/[^\x21-\x7e]/.test(value);
}
function normalizeApnsTopic(value) {
	return value.trim();
}
function isValidApnsTopic(value) {
	return value.length > 0 && value.length <= MAX_TOPIC_LENGTH;
}
function normalizeTokenDebugSuffix(value) {
	if (typeof value !== "string") return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value.trim()).replace(/[^0-9a-z]/g, "");
	return normalized.length > 0 ? normalized.slice(-8) : void 0;
}
function isLikelyApnsToken(value) {
	return value.length <= MAX_APNS_TOKEN_HEX_LENGTH && /^[0-9a-f]{32,}$/i.test(value);
}
function normalizeDistribution(value) {
	if (typeof value !== "string") return null;
	return ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value) : void 0) === "official" ? "official" : null;
}
function normalizeRelayOrigin(value, env = process.env) {
	if (typeof value !== "string") return;
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return;
	const normalized = normalizeApnsRelayBaseUrl(trimmed, env);
	return normalized.ok ? normalized.value : void 0;
}
function normalizePersistedRelayOrigin(value) {
	if (typeof value !== "string") return;
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return;
	const normalized = normalizePersistedApnsRelayBaseUrl(trimmed);
	return normalized.ok ? normalized.value : void 0;
}
/** Normalizes the APNs environment string accepted by registration inputs. */
function normalizeApnsEnvironment(value) {
	if (typeof value !== "string") return null;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
	if (normalized === "sandbox" || normalized === "production") return normalized;
	return null;
}
function normalizeDirectRegistration(record) {
	if (typeof record.nodeId !== "string" || typeof record.token !== "string") return null;
	const nodeId = normalizeApnsNodeId(record.nodeId);
	const token = normalizeApnsToken(record.token);
	const topic = normalizeApnsTopic(typeof record.topic === "string" ? record.topic : "");
	const environment = normalizeApnsEnvironment(record.environment);
	const updatedAtMs = typeof record.updatedAtMs === "number" && Number.isSafeInteger(record.updatedAtMs) && record.updatedAtMs >= 0 ? record.updatedAtMs : null;
	if (!isValidApnsNodeId(nodeId) || !isValidApnsTopic(topic) || !isLikelyApnsToken(token) || !environment || updatedAtMs === null) return null;
	return {
		nodeId,
		transport: "direct",
		token,
		topic,
		environment,
		updatedAtMs
	};
}
function normalizeRelayRegistration(record, normalizeOrigin) {
	if (typeof record.nodeId !== "string" || typeof record.relayHandle !== "string" || typeof record.sendGrant !== "string" || typeof record.installationId !== "string") return null;
	const nodeId = normalizeApnsNodeId(record.nodeId);
	const relayHandle = normalizeRelayHandle(record.relayHandle);
	const sendGrant = record.sendGrant.trim();
	const installationId = normalizeInstallationId(record.installationId);
	const topic = normalizeApnsTopic(typeof record.topic === "string" ? record.topic : "");
	const environment = normalizeApnsEnvironment(record.environment);
	const distribution = normalizeDistribution(record.distribution);
	const relayOrigin = normalizeOrigin(record.relayOrigin);
	const updatedAtMs = typeof record.updatedAtMs === "number" && Number.isSafeInteger(record.updatedAtMs) && record.updatedAtMs >= 0 ? record.updatedAtMs : null;
	if (!isValidApnsNodeId(nodeId) || !isValidRelayIdentifier(relayHandle) || !isValidRelayIdentifier(sendGrant, MAX_SEND_GRANT_LENGTH) || !isValidRelayIdentifier(installationId) || !isValidApnsTopic(topic) || !environment || distribution !== "official" || updatedAtMs === null) return null;
	return {
		nodeId,
		transport: "relay",
		relayHandle,
		sendGrant,
		installationId,
		topic,
		environment,
		distribution,
		updatedAtMs,
		...relayOrigin ? { relayOrigin } : {},
		tokenDebugSuffix: normalizeTokenDebugSuffix(record.tokenDebugSuffix)
	};
}
function normalizeCanonicalApnsRegistrationWithRelayOrigin(record, normalizeOrigin) {
	if (!record || typeof record !== "object" || Array.isArray(record)) return null;
	const candidate = record;
	const transport = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(candidate.transport);
	if (transport === "relay") return normalizeRelayRegistration(candidate, normalizeOrigin);
	if (transport === "direct") return normalizeDirectRegistration(candidate);
	return null;
}
/** Normalizes one canonical registration with an explicit transport discriminator. */
function normalizeCanonicalApnsRegistration(record, env = process.env) {
	return normalizeCanonicalApnsRegistrationWithRelayOrigin(record, (value) => normalizeRelayOrigin(value, env));
}
function apnsRegistrationFromRow(row) {
	const { token } = row;
	const normalized = normalizeCanonicalApnsRegistrationWithRelayOrigin({
		nodeId: row.node_id,
		transport: row.transport,
		token,
		relayHandle: row.relay_handle ?? void 0,
		sendGrant: row.send_grant ?? void 0,
		installationId: row.installation_id ?? void 0,
		relayOrigin: row.relay_origin ?? void 0,
		topic: row.topic,
		environment: row.environment,
		distribution: row.distribution ?? void 0,
		tokenDebugSuffix: row.token_debug_suffix ?? void 0,
		updatedAtMs: row.updated_at_ms
	}, normalizePersistedRelayOrigin);
	if (!normalized) throw new Error(`invalid APNs registration row for node ${row.node_id}`);
	const canonical = apnsRegistrationToRow(normalized);
	if (canonical.node_id !== row.node_id || canonical.transport !== row.transport || canonical.token !== row.token || canonical.relay_handle !== row.relay_handle || canonical.send_grant !== row.send_grant || canonical.installation_id !== row.installation_id || canonical.relay_origin !== row.relay_origin || canonical.topic !== row.topic || canonical.environment !== row.environment || canonical.distribution !== row.distribution || canonical.token_debug_suffix !== row.token_debug_suffix || canonical.updated_at_ms !== row.updated_at_ms) throw new Error(`non-canonical APNs registration row for node ${row.node_id}`);
	return normalized;
}
function apnsRegistrationToRow(registration) {
	const base = {
		node_id: registration.nodeId,
		transport: registration.transport,
		topic: registration.topic,
		environment: registration.environment,
		updated_at_ms: registration.updatedAtMs
	};
	if (registration.transport === "direct") {
		const { token } = registration;
		return {
			...base,
			token,
			relay_handle: null,
			send_grant: null,
			installation_id: null,
			relay_origin: null,
			distribution: null,
			token_debug_suffix: null
		};
	}
	return {
		...base,
		token: null,
		relay_handle: registration.relayHandle,
		send_grant: registration.sendGrant,
		installation_id: registration.installationId,
		relay_origin: registration.relayOrigin ?? null,
		distribution: registration.distribution,
		token_debug_suffix: registration.tokenDebugSuffix ?? null
	};
}
function apnsRegistrationsEqual(left, right) {
	if (left.nodeId !== right.nodeId || left.transport !== right.transport || left.topic !== right.topic || left.environment !== right.environment || left.updatedAtMs !== right.updatedAtMs) return false;
	if (left.transport === "direct" && right.transport === "direct") return left.token === right.token;
	return left.transport === "relay" && right.transport === "relay" && left.relayHandle === right.relayHandle && left.sendGrant === right.sendGrant && left.installationId === right.installationId && left.distribution === right.distribution && left.relayOrigin === right.relayOrigin && left.tokenDebugSuffix === right.tokenDebugSuffix;
}
function nextApnsRegistrationVersion(nodeId, previousVersions) {
	let latest = -1;
	for (const version of previousVersions) {
		if (!Number.isSafeInteger(version) || version < 0) throw new Error(`invalid APNs registration version for node ${nodeId}`);
		latest = Math.max(latest, version);
	}
	if (latest === Number.MAX_SAFE_INTEGER) throw new Error(`APNs registration version exhausted for node ${nodeId}`);
	return Math.max(Date.now(), latest + 1);
}
/** Persists a validated direct or relay APNs registration for one node id. */
async function registerApnsRegistration(params) {
	const nodeId = normalizeApnsNodeId(params.nodeId);
	const topic = normalizeApnsTopic(params.topic);
	if (!isValidApnsNodeId(nodeId)) throw new Error("nodeId required");
	if (!isValidApnsTopic(topic)) throw new Error("topic required");
	let candidate;
	if (params.transport === "relay") {
		const relayHandle = validateRelayIdentifier(normalizeRelayHandle(params.relayHandle), "relayHandle");
		const sendGrant = validateRelayIdentifier(params.sendGrant.trim(), "sendGrant", MAX_SEND_GRANT_LENGTH);
		const installationId = validateRelayIdentifier(normalizeInstallationId(params.installationId), "installationId");
		const environment = normalizeApnsEnvironment(params.environment);
		const distribution = normalizeDistribution(params.distribution);
		const relayOrigin = normalizeRelayOrigin(params.relayOrigin);
		if (!environment) throw new Error("relay registrations must use valid APNs environment");
		if (distribution !== "official") throw new Error("relay registrations must use official distribution");
		candidate = {
			nodeId,
			transport: "relay",
			relayHandle,
			sendGrant,
			installationId,
			topic,
			environment,
			distribution,
			updatedAtMs: 0,
			...relayOrigin ? { relayOrigin } : {},
			tokenDebugSuffix: normalizeTokenDebugSuffix(params.tokenDebugSuffix)
		};
	} else {
		const token = normalizeApnsToken(params.token);
		const environment = normalizeApnsEnvironment(params.environment) ?? "sandbox";
		if (!isLikelyApnsToken(token)) throw new Error("invalid APNs token");
		candidate = {
			nodeId,
			transport: "direct",
			token,
			topic,
			environment,
			updatedAtMs: 0
		};
	}
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const current = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("apns_registrations").select("updated_at_ms").where("node_id", "=", nodeId));
		const tombstone = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("apns_registration_tombstones").select("deleted_at_ms").where("node_id", "=", nodeId));
		const previousVersions = [current?.updated_at_ms, tombstone?.deleted_at_ms].filter((version) => version !== void 0);
		const next = {
			...candidate,
			updatedAtMs: nextApnsRegistrationVersion(nodeId, previousVersions)
		};
		const row = apnsRegistrationToRow(next);
		const { token, relay_handle, send_grant, installation_id, relay_origin, distribution, token_debug_suffix } = row;
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("apns_registrations").values(row).onConflict((conflict) => conflict.column("node_id").doUpdateSet({
			transport: row.transport,
			token,
			relay_handle,
			send_grant,
			installation_id,
			relay_origin,
			topic: row.topic,
			environment: row.environment,
			distribution,
			token_debug_suffix,
			updated_at_ms: row.updated_at_ms
		})));
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.deleteFrom("apns_registration_tombstones").where("node_id", "=", nodeId));
		return next;
	}, apnsStateDatabaseOptions(params.baseDir));
}
/** Loads one normalized APNs registration by node id. */
async function loadApnsRegistration(nodeId, baseDir) {
	const normalizedNodeId = normalizeApnsNodeId(nodeId);
	if (!normalizedNodeId) return null;
	const database = require_openclaw_state_db.openOperatorStateDatabase(apnsStateDatabaseOptions(baseDir));
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db).selectFrom("apns_registrations").selectAll().where("node_id", "=", normalizedNodeId));
	return row ? apnsRegistrationFromRow(row) : null;
}
/** Loads normalized APNs registrations for the requested node ids, preserving request order. */
async function loadApnsRegistrations(nodeIds, baseDir) {
	const normalizedByInput = nodeIds.map((nodeId) => ({
		nodeId,
		normalizedNodeId: normalizeApnsNodeId(nodeId)
	}));
	const uniqueNodeIds = [...new Set(normalizedByInput.map((entry) => entry.normalizedNodeId).filter((nodeId) => isValidApnsNodeId(nodeId)))];
	if (uniqueNodeIds.length === 0) return [];
	const database = require_openclaw_state_db.openOperatorStateDatabase(apnsStateDatabaseOptions(baseDir));
	const registrations = /* @__PURE__ */ new Map();
	const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	for (let offset = 0; offset < uniqueNodeIds.length; offset += APNS_REGISTRATION_LOOKUP_CHUNK_SIZE) {
		const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, stateDb.selectFrom("apns_registrations").selectAll().where("node_id", "in", uniqueNodeIds.slice(offset, offset + APNS_REGISTRATION_LOOKUP_CHUNK_SIZE))).rows;
		for (const row of rows) registrations.set(row.node_id, apnsRegistrationFromRow(row));
	}
	return normalizedByInput.flatMap(({ nodeId, normalizedNodeId }) => {
		const registration = registrations.get(normalizedNodeId);
		return registration ? [{
			nodeId,
			registration
		}] : [];
	});
}
/** Clears a registration only if storage still contains the caller's observed value. */
async function clearApnsRegistrationIfCurrent(params) {
	const normalizedNodeId = normalizeApnsNodeId(params.nodeId);
	if (!normalizedNodeId) return false;
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const currentRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("apns_registrations").selectAll().where("node_id", "=", normalizedNodeId));
		if (!currentRow || !apnsRegistrationsEqual(apnsRegistrationFromRow(currentRow), params.registration)) return false;
		const tombstone = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("apns_registration_tombstones").select("deleted_at_ms").where("node_id", "=", normalizedNodeId));
		const previousVersions = [currentRow.updated_at_ms, tombstone?.deleted_at_ms].filter((version) => version !== void 0);
		const deletedAtMs = nextApnsRegistrationVersion(normalizedNodeId, previousVersions);
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("apns_registration_tombstones").values({
			node_id: normalizedNodeId,
			deleted_at_ms: deletedAtMs
		}).onConflict((conflict) => conflict.column("node_id").doUpdateSet({ deleted_at_ms: deletedAtMs })));
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.deleteFrom("apns_registrations").where("node_id", "=", normalizedNodeId));
		return true;
	}, apnsStateDatabaseOptions(params.baseDir));
}
//#endregion
Object.defineProperty(exports, "apnsRegistrationFromRow", {
	enumerable: true,
	get: function() {
		return apnsRegistrationFromRow;
	}
});
Object.defineProperty(exports, "apnsRegistrationToRow", {
	enumerable: true,
	get: function() {
		return apnsRegistrationToRow;
	}
});
Object.defineProperty(exports, "clearApnsRegistrationIfCurrent", {
	enumerable: true,
	get: function() {
		return clearApnsRegistrationIfCurrent;
	}
});
Object.defineProperty(exports, "isLikelyApnsToken", {
	enumerable: true,
	get: function() {
		return isLikelyApnsToken;
	}
});
Object.defineProperty(exports, "isValidApnsNodeId", {
	enumerable: true,
	get: function() {
		return isValidApnsNodeId;
	}
});
Object.defineProperty(exports, "isValidApnsTopic", {
	enumerable: true,
	get: function() {
		return isValidApnsTopic;
	}
});
Object.defineProperty(exports, "loadApnsRegistration", {
	enumerable: true,
	get: function() {
		return loadApnsRegistration;
	}
});
Object.defineProperty(exports, "loadApnsRegistrations", {
	enumerable: true,
	get: function() {
		return loadApnsRegistrations;
	}
});
Object.defineProperty(exports, "normalizeApnsEnvironment", {
	enumerable: true,
	get: function() {
		return normalizeApnsEnvironment;
	}
});
Object.defineProperty(exports, "normalizeApnsNodeId", {
	enumerable: true,
	get: function() {
		return normalizeApnsNodeId;
	}
});
Object.defineProperty(exports, "normalizeApnsToken", {
	enumerable: true,
	get: function() {
		return normalizeApnsToken;
	}
});
Object.defineProperty(exports, "normalizeApnsTopic", {
	enumerable: true,
	get: function() {
		return normalizeApnsTopic;
	}
});
Object.defineProperty(exports, "normalizeCanonicalApnsRegistration", {
	enumerable: true,
	get: function() {
		return normalizeCanonicalApnsRegistration;
	}
});
Object.defineProperty(exports, "registerApnsRegistration", {
	enumerable: true,
	get: function() {
		return registerApnsRegistration;
	}
});
Object.defineProperty(exports, "resolveApnsRelayConfigFromEnv", {
	enumerable: true,
	get: function() {
		return resolveApnsRelayConfigFromEnv;
	}
});
Object.defineProperty(exports, "sendApnsRelayPush", {
	enumerable: true,
	get: function() {
		return sendApnsRelayPush;
	}
});
