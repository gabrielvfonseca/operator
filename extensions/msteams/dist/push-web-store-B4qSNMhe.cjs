const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
//#region src/infra/push-web-store.ts
const WEB_PUSH_VAPID_KEY_ID = "default";
const DEFAULT_WEB_PUSH_VAPID_SUBJECT = "https://operator.ai";
const WEB_PUSH_MAX_ENDPOINT_LENGTH = 2048;
const WEB_PUSH_MAX_KEY_LENGTH = 512;
function createWebPushVapidKeyPair(publicKey, privateKey, subject) {
	return {
		publicKey,
		privateKey,
		subject
	};
}
function webPushStateDatabaseOptions(stateDir) {
	return stateDir ? { env: {
		...process.env,
		OPERATOR_STATE_DIR: stateDir
	} } : { env: process.env };
}
function hashWebPushEndpoint(endpoint) {
	return require_crypto_digest.sha256HexPrefix(endpoint, 32);
}
function isValidWebPushEndpoint(endpoint) {
	if (!endpoint || endpoint.length > WEB_PUSH_MAX_ENDPOINT_LENGTH) return false;
	try {
		return new URL(endpoint).protocol === "https:";
	} catch {
		return false;
	}
}
function isValidWebPushKey(key) {
	return typeof key === "string" && key.length > 0 && key.length <= WEB_PUSH_MAX_KEY_LENGTH;
}
function webPushSubscriptionFromRow(row) {
	return {
		subscriptionId: row.subscription_id,
		endpoint: row.endpoint,
		keys: {
			p256dh: row.p256dh,
			auth: row.auth
		},
		createdAtMs: row.created_at_ms,
		updatedAtMs: row.updated_at_ms
	};
}
function webPushSubscriptionToRow(params) {
	return {
		endpoint_hash: params.endpointHash,
		subscription_id: params.subscription.subscriptionId,
		endpoint: params.subscription.endpoint,
		p256dh: params.subscription.keys.p256dh,
		auth: params.subscription.keys.auth,
		created_at_ms: params.subscription.createdAtMs,
		updated_at_ms: params.subscription.updatedAtMs
	};
}
function webPushVapidKeyPairToRow(params) {
	return {
		key_id: WEB_PUSH_VAPID_KEY_ID,
		public_key: params.keyPair.publicKey,
		private_key: params.keyPair.privateKey,
		subject: params.keyPair.subject,
		updated_at_ms: params.nowMs
	};
}
function webPushSubscriptionsEqual(left, right) {
	return left.subscriptionId === right.subscriptionId && left.endpoint === right.endpoint && left.keys.p256dh === right.keys.p256dh && left.keys.auth === right.keys.auth && left.createdAtMs === right.createdAtMs && left.updatedAtMs === right.updatedAtMs;
}
function listWebPushSubscriptions(stateDir) {
	const database = require_openclaw_state_db.openOperatorStateDatabase(webPushStateDatabaseOptions(stateDir));
	const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, stateDb.selectFrom("web_push_subscriptions").selectAll().orderBy("created_at_ms", "asc").orderBy("subscription_id", "asc")).rows.map(webPushSubscriptionFromRow);
}
/** Reread the endpoint row inside the write transaction before creating or updating it. */
function upsertWebPushSubscription(params) {
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const existingRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("web_push_subscriptions").selectAll().where("endpoint_hash", "=", params.endpointHash));
		if (existingRow && existingRow.endpoint !== params.endpoint) throw new Error("web push endpoint hash collision");
		const subscription = {
			subscriptionId: existingRow?.subscription_id ?? params.candidateSubscriptionId,
			endpoint: params.endpoint,
			keys: { ...params.keys },
			createdAtMs: existingRow?.created_at_ms ?? params.nowMs,
			updatedAtMs: params.nowMs
		};
		const row = webPushSubscriptionToRow({
			endpointHash: params.endpointHash,
			subscription
		});
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("web_push_subscriptions").values(row).onConflict((conflict) => conflict.column("endpoint_hash").doUpdateSet({
			subscription_id: row.subscription_id,
			endpoint: row.endpoint,
			p256dh: row.p256dh,
			auth: row.auth,
			updated_at_ms: row.updated_at_ms
		})));
		return subscription;
	}, webPushStateDatabaseOptions(params.stateDir));
}
function deleteWebPushSubscriptionByEndpoint(params) {
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const result = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).deleteFrom("web_push_subscriptions").where("endpoint_hash", "=", params.endpointHash).where("endpoint", "=", params.endpoint));
		return Number(result.numAffectedRows ?? 0) > 0;
	}, webPushStateDatabaseOptions(params.stateDir));
}
/** Delete an expired send target only if no newer registration replaced it in flight. */
function deleteWebPushSubscriptionIfCurrent(params) {
	const subscription = params.subscription;
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const result = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).deleteFrom("web_push_subscriptions").where("endpoint_hash", "=", params.endpointHash).where("subscription_id", "=", subscription.subscriptionId).where("endpoint", "=", subscription.endpoint).where("p256dh", "=", subscription.keys.p256dh).where("auth", "=", subscription.keys.auth).where("updated_at_ms", "=", subscription.updatedAtMs));
		return Number(result.numAffectedRows ?? 0) > 0;
	}, webPushStateDatabaseOptions(params.stateDir));
}
function readPersistedVapidKeyPair(stateDir) {
	const database = require_openclaw_state_db.openOperatorStateDatabase(webPushStateDatabaseOptions(stateDir));
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db).selectFrom("web_push_vapid_keys").selectAll().where("key_id", "=", WEB_PUSH_VAPID_KEY_ID));
	return row ? createWebPushVapidKeyPair(row.public_key, row.private_key, row.subject) : null;
}
/** First committed keypair wins so concurrent gateway bootstraps share one signing identity. */
function insertVapidKeyPairIfAbsent(params) {
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const existing = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("web_push_vapid_keys").selectAll().where("key_id", "=", WEB_PUSH_VAPID_KEY_ID));
		if (existing) return createWebPushVapidKeyPair(existing.public_key, existing.private_key, existing.subject);
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("web_push_vapid_keys").values(webPushVapidKeyPairToRow({
			keyPair: params.candidate,
			nowMs: params.nowMs
		})));
		return params.candidate;
	}, webPushStateDatabaseOptions(params.stateDir));
}
//#endregion
Object.defineProperty(exports, "DEFAULT_WEB_PUSH_VAPID_SUBJECT", {
	enumerable: true,
	get: function() {
		return DEFAULT_WEB_PUSH_VAPID_SUBJECT;
	}
});
Object.defineProperty(exports, "WEB_PUSH_VAPID_KEY_ID", {
	enumerable: true,
	get: function() {
		return WEB_PUSH_VAPID_KEY_ID;
	}
});
Object.defineProperty(exports, "createWebPushVapidKeyPair", {
	enumerable: true,
	get: function() {
		return createWebPushVapidKeyPair;
	}
});
Object.defineProperty(exports, "deleteWebPushSubscriptionByEndpoint", {
	enumerable: true,
	get: function() {
		return deleteWebPushSubscriptionByEndpoint;
	}
});
Object.defineProperty(exports, "deleteWebPushSubscriptionIfCurrent", {
	enumerable: true,
	get: function() {
		return deleteWebPushSubscriptionIfCurrent;
	}
});
Object.defineProperty(exports, "hashWebPushEndpoint", {
	enumerable: true,
	get: function() {
		return hashWebPushEndpoint;
	}
});
Object.defineProperty(exports, "insertVapidKeyPairIfAbsent", {
	enumerable: true,
	get: function() {
		return insertVapidKeyPairIfAbsent;
	}
});
Object.defineProperty(exports, "isValidWebPushEndpoint", {
	enumerable: true,
	get: function() {
		return isValidWebPushEndpoint;
	}
});
Object.defineProperty(exports, "isValidWebPushKey", {
	enumerable: true,
	get: function() {
		return isValidWebPushKey;
	}
});
Object.defineProperty(exports, "listWebPushSubscriptions", {
	enumerable: true,
	get: function() {
		return listWebPushSubscriptions;
	}
});
Object.defineProperty(exports, "readPersistedVapidKeyPair", {
	enumerable: true,
	get: function() {
		return readPersistedVapidKeyPair;
	}
});
Object.defineProperty(exports, "upsertWebPushSubscription", {
	enumerable: true,
	get: function() {
		return upsertWebPushSubscription;
	}
});
Object.defineProperty(exports, "webPushSubscriptionFromRow", {
	enumerable: true,
	get: function() {
		return webPushSubscriptionFromRow;
	}
});
Object.defineProperty(exports, "webPushSubscriptionToRow", {
	enumerable: true,
	get: function() {
		return webPushSubscriptionToRow;
	}
});
Object.defineProperty(exports, "webPushSubscriptionsEqual", {
	enumerable: true,
	get: function() {
		return webPushSubscriptionsEqual;
	}
});
Object.defineProperty(exports, "webPushVapidKeyPairToRow", {
	enumerable: true,
	get: function() {
		return webPushVapidKeyPairToRow;
	}
});
