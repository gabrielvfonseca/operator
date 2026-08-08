const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_push_apns_store = require("./push-apns-store-THiqtBab.cjs");
const require_push_web_store = require("./push-web-store-B4qSNMhe.cjs");
const require_push_apns = require("./push-apns-Dgss9aNs.cjs");
const require_record_shared = require("./record-shared-Cuj_jolh.cjs");
const require_nodes_helpers = require("./nodes.helpers-SXr8Ur2w.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/infra/push-web.ts
const LEGACY_WEB_PUSH_PATHS = ["push/web-push-subscriptions.json", "push/vapid-keys.json"];
const loadWebPushRuntime = require_lazy_runtime.createLazyRuntimeModule(() => import("web-push").then((mod) => mod.default ?? mod));
function legacyWebPushPathMayExist(filePath) {
	try {
		node_fs.default.lstatSync(filePath);
		return true;
	} catch (error) {
		return error.code !== "ENOENT";
	}
}
function assertLegacyWebPushMigrationComplete(baseDir) {
	const stateDir = baseDir ?? require_paths.resolveStateDir();
	if (LEGACY_WEB_PUSH_PATHS.find((relativePath) => {
		const sourcePath = node_path.default.join(stateDir, relativePath);
		return legacyWebPushPathMayExist(sourcePath) || legacyWebPushPathMayExist(`${sourcePath}.doctor-importing`);
	})) throw new Error(`legacy Web Push state requires migration; run \`openclaw doctor --fix\` before using Web Push`);
}
async function resolveVapidKeys(baseDir) {
	assertLegacyWebPushMigrationComplete(baseDir);
	const envPublic = resolveVapidPublicKeyFromEnv();
	const envPrivate = resolveVapidPrivateKeyFromEnv();
	if (envPublic && envPrivate) return {
		publicKey: envPublic,
		privateKey: envPrivate,
		subject: resolveVapidSubjectFromEnv()
	};
	const existing = require_push_web_store.readPersistedVapidKeyPair(baseDir);
	if (existing) return {
		...existing,
		subject: resolveVapidSubjectFromEnv()
	};
	const keys = (await loadWebPushRuntime()).generateVAPIDKeys();
	return {
		...require_push_web_store.insertVapidKeyPairIfAbsent({
			candidate: require_push_web_store.createWebPushVapidKeyPair(keys.publicKey, keys.privateKey, resolveVapidSubjectFromEnv()),
			nowMs: Date.now(),
			stateDir: baseDir
		}),
		subject: resolveVapidSubjectFromEnv()
	};
}
function resolveVapidSubjectFromEnv() {
	return process.env.OPERATOR_VAPID_SUBJECT || "https://operator.ai";
}
function resolveVapidPublicKeyFromEnv() {
	return process.env.OPERATOR_VAPID_PUBLIC_KEY || void 0;
}
function resolveVapidPrivateKeyFromEnv() {
	return process.env.OPERATOR_VAPID_PRIVATE_KEY || void 0;
}
async function registerWebPushSubscription(params) {
	const { endpoint, keys, baseDir } = params;
	if (!require_push_web_store.isValidWebPushEndpoint(endpoint)) throw new Error("invalid push subscription endpoint: must be an HTTPS URL under 2048 chars");
	if (!require_push_web_store.isValidWebPushKey(keys.p256dh) || !require_push_web_store.isValidWebPushKey(keys.auth)) throw new Error("invalid push subscription keys: must be non-empty strings under 512 chars");
	assertLegacyWebPushMigrationComplete(baseDir);
	return require_push_web_store.upsertWebPushSubscription({
		endpointHash: require_push_web_store.hashWebPushEndpoint(endpoint),
		endpoint,
		keys: {
			p256dh: keys.p256dh,
			auth: keys.auth
		},
		candidateSubscriptionId: (0, node_crypto.randomUUID)(),
		nowMs: Date.now(),
		stateDir: baseDir
	});
}
async function clearWebPushSubscriptionByEndpoint(endpoint, baseDir) {
	assertLegacyWebPushMigrationComplete(baseDir);
	return require_push_web_store.deleteWebPushSubscriptionByEndpoint({
		endpointHash: require_push_web_store.hashWebPushEndpoint(endpoint),
		endpoint,
		stateDir: baseDir
	});
}
function applyVapidDetails(webPush, keys) {
	webPush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
}
async function sendPreparedWebPushNotification(webPush, subscription, payload) {
	const pushSubscription = {
		endpoint: subscription.endpoint,
		keys: {
			p256dh: subscription.keys.p256dh,
			auth: subscription.keys.auth
		}
	};
	try {
		const result = await webPush.sendNotification(pushSubscription, JSON.stringify(payload));
		return {
			ok: true,
			subscriptionId: subscription.subscriptionId,
			statusCode: result.statusCode
		};
	} catch (err) {
		const statusCode = typeof err === "object" && err !== null && "statusCode" in err ? err.statusCode : void 0;
		const message = typeof err === "object" && err !== null && "message" in err ? err.message : "unknown error";
		return {
			ok: false,
			subscriptionId: subscription.subscriptionId,
			statusCode,
			error: message
		};
	}
}
async function broadcastWebPush(payload, baseDir) {
	assertLegacyWebPushMigrationComplete(baseDir);
	const subscriptions = require_push_web_store.listWebPushSubscriptions(baseDir);
	if (subscriptions.length === 0) return [];
	const vapidKeys = await resolveVapidKeys(baseDir);
	const webPush = await loadWebPushRuntime();
	applyVapidDetails(webPush, vapidKeys);
	const mapped = (await Promise.allSettled(subscriptions.map((sub) => sendPreparedWebPushNotification(webPush, sub, payload)))).map((r, i) => r.status === "fulfilled" ? r.value : {
		ok: false,
		subscriptionId: (0, _gabrielvfonseca_normalization_core.expectDefined)(subscriptions[i], "subscriptions entry at i").subscriptionId,
		error: r.reason instanceof Error ? r.reason.message : "unknown error"
	});
	const expiredSubscriptions = mapped.map((result, i) => ({
		result,
		sub: subscriptions[i]
	})).filter(({ result }) => !result.ok && (result.statusCode === 410 || result.statusCode === 404)).map(({ sub }) => (0, _gabrielvfonseca_normalization_core.expectDefined)(sub, "push web sub"));
	for (const subscription of expiredSubscriptions) try {
		assertLegacyWebPushMigrationComplete(baseDir);
		require_push_web_store.deleteWebPushSubscriptionIfCurrent({
			endpointHash: require_push_web_store.hashWebPushEndpoint(subscription.endpoint),
			subscription,
			stateDir: baseDir
		});
	} catch {}
	return mapped;
}
//#endregion
//#region src/gateway/server-methods/push.ts
const pushHandlers = {
	"push.test": async ({ params, respond, context }) => {
		if (!require_src.validatePushTestParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "push.test",
				validator: require_src.validatePushTestParams
			});
			return;
		}
		const nodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(params.nodeId) ?? "";
		if (!nodeId) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "nodeId required"));
			return;
		}
		const title = require_record_shared.normalizeTrimmedString(params.title) ?? "Operator";
		const body = require_record_shared.normalizeTrimmedString(params.body) ?? `Push test for node ${nodeId}`;
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const registration = await require_push_apns_store.loadApnsRegistration(nodeId);
			if (!registration) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `node ${nodeId} has no APNs registration (connect iOS node first)`));
				return;
			}
			const overrideEnvironment = require_push_apns_store.normalizeApnsEnvironment(params.environment);
			const result = registration.transport === "direct" ? await (async () => {
				const auth = await require_push_apns.resolveApnsAuthConfigFromEnv(process.env);
				if (!auth.ok) {
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, auth.error));
					return null;
				}
				return await require_push_apns.sendApnsAlert({
					registration: {
						...registration,
						environment: overrideEnvironment ?? registration.environment
					},
					nodeId,
					title,
					body,
					auth: auth.value
				});
			})() : await (async () => {
				const relay = require_push_apns_store.resolveApnsRelayConfigFromEnv(process.env, context.getRuntimeConfig().gateway, { registrationRelayOrigin: registration.relayOrigin });
				if (!relay.ok) {
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, relay.error));
					return null;
				}
				return await require_push_apns.sendApnsAlert({
					registration,
					nodeId,
					title,
					body,
					relayConfig: relay.value
				});
			})();
			if (!result) return;
			if (require_push_apns.shouldClearStoredApnsRegistration({
				registration,
				result,
				overrideEnvironment
			})) await require_push_apns_store.clearApnsRegistrationIfCurrent({
				nodeId,
				registration
			});
			respond(true, result, void 0);
		});
	},
	"push.web.vapidPublicKey": async ({ params, respond }) => {
		if (!require_src.validateWebPushVapidPublicKeyParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "push.web.vapidPublicKey",
				validator: require_src.validateWebPushVapidPublicKeyParams
			});
			return;
		}
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			respond(true, { vapidPublicKey: (await resolveVapidKeys()).publicKey }, void 0);
		});
	},
	"push.web.subscribe": async ({ params, respond }) => {
		if (!require_src.validateWebPushSubscribeParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "push.web.subscribe",
				validator: require_src.validateWebPushSubscribeParams
			});
			return;
		}
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			respond(true, { subscriptionId: (await registerWebPushSubscription({
				endpoint: params.endpoint,
				keys: params.keys
			})).subscriptionId }, void 0);
		});
	},
	"push.web.unsubscribe": async ({ params, respond }) => {
		if (!require_src.validateWebPushUnsubscribeParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "push.web.unsubscribe",
				validator: require_src.validateWebPushUnsubscribeParams
			});
			return;
		}
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			respond(true, { removed: await clearWebPushSubscriptionByEndpoint(params.endpoint) }, void 0);
		});
	},
	"push.web.test": async ({ params, respond }) => {
		if (!require_src.validateWebPushTestParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "push.web.test",
				validator: require_src.validateWebPushTestParams
			});
			return;
		}
		const title = require_record_shared.normalizeTrimmedString(params.title) ?? "Operator";
		const body = require_record_shared.normalizeTrimmedString(params.body) ?? "Web push test notification";
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const results = await broadcastWebPush({
				title,
				body
			});
			if (results.length === 0) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "no web push subscriptions registered"));
				return;
			}
			respond(true, { results }, void 0);
		});
	}
};
//#endregion
exports.pushHandlers = pushHandlers;
