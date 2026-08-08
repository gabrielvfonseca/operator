const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_retry = require("./retry-DXZi6qkk.cjs");
require("./store-BW6t6tIi.cjs");
const require_load_options = require("./load-options-28l5_jW7.cjs");
const require_web_media = require("./web-media-CQULBkBb.cjs");
const require_delivery_queue_sqlite = require("./delivery-queue-sqlite-g1mFGVTq.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_media_core_media_source_url = require("@gabrielvfonseca/media-core/media-source-url");
let _openclaw_fs_safe_store = require("@openclaw/fs-safe/store");
//#region src/infra/outbound/delivery-queue-media-staging.ts
const OUTBOUND_DELIVERY_QUEUE_NAME = "outbound";
const DELIVERY_QUEUE_MEDIA_STAGING_QUEUE_NAME = "outbound-media-staging";
function createDeliveryQueueMediaRetention(artifacts, entryKind, stateDir) {
	const id = require_retry.generateSecureUuid();
	const entry = {
		id,
		enqueuedAt: Date.now(),
		retryCount: 0,
		artifacts: [...artifacts]
	};
	if (!require_delivery_queue_sqlite.upsertDeliveryQueueEntry({
		queueName: "outbound-media-staging",
		entry,
		metadata: { entryKind },
		stateDir,
		insertOnly: true
	})) throw new Error(`Delivery queue media stage already exists: ${id}`);
	return id;
}
/** Register planned artifacts before any file becomes visible to the sweeper. */
function createDeliveryQueueMediaStage(artifacts, stateDir) {
	return createDeliveryQueueMediaRetention(artifacts, "outbound-media-stage", stateDir);
}
/** Keep queue-owned artifacts visible to GC while a recovered send is active. */
function createDeliveryQueueMediaRecoveryLease(artifacts, stateDir) {
	return createDeliveryQueueMediaRetention(artifacts, "outbound-media-recovery-lease", stateDir);
}
/** Cancel a stage that will never publish an outbound queue row. */
function cancelDeliveryQueueMediaStage(id, stateDir) {
	if (!id) return;
	require_delivery_queue_sqlite.deleteDeliveryQueueEntry(DELIVERY_QUEUE_MEDIA_STAGING_QUEUE_NAME, id, stateDir);
}
/** Release an active recovery lease after its adapter attempt settles. */
function cancelDeliveryQueueMediaRecoveryLease(id, stateDir) {
	cancelDeliveryQueueMediaStage(id, stateDir);
}
/**
* Atomically expire abandoned stages and return every artifact still owned by
* either a replayable outbound row or a producer that may still commit one.
*/
function loadDeliveryQueueMediaRetentionSnapshot(params) {
	const snapshot = require_delivery_queue_sqlite.expireStagingAndLoadDeliveryQueueEntries({
		queueName: OUTBOUND_DELIVERY_QUEUE_NAME,
		stagingQueueName: DELIVERY_QUEUE_MEDIA_STAGING_QUEUE_NAME,
		expireBeforeMs: params.expireBeforeMs,
		stateDir: params.stateDir
	});
	return {
		payloads: snapshot.entries.flatMap((entry) => {
			const payloads = entry.payloads;
			return Array.isArray(payloads) ? [payloads] : [];
		}),
		stagedArtifacts: snapshot.stagingEntries.flatMap((entry) => {
			const artifacts = entry.artifacts;
			return Array.isArray(artifacts) ? artifacts.filter((artifact) => typeof artifact === "string") : [];
		})
	};
}
//#endregion
//#region src/infra/outbound/delivery-queue-media-spool.ts
const ARTIFACT_EXT_RE = /^\.[A-Za-z0-9]{1,10}$/;
const ARTIFACT_NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\.[A-Za-z0-9]{1,10})?(?:\.part)?$/;
const PART_SUFFIX = ".part";
const ORPHAN_GRACE_MS = 1440 * 6e4;
function openSpoolStore(stateDir, maxBytes) {
	return (0, _openclaw_fs_safe_store.fileStore)({
		rootDir: require_paths.resolveDeliveryQueueMediaDir(stateDir),
		dirMode: 448,
		mode: 384,
		maxBytes
	});
}
function resolveArtifactExtension(source) {
	const extension = node_path.default.extname(source.split("?")[0] ?? "");
	return ARTIFACT_EXT_RE.test(extension) ? extension.toLowerCase() : "";
}
function isNonEmptyMediaSource(source) {
	return typeof source === "string" && Boolean(source.trim());
}
function payloadMediaSources(payload) {
	const sources = [];
	if (isNonEmptyMediaSource(payload.mediaUrl)) sources.push(payload.mediaUrl);
	for (const mediaUrl of payload.mediaUrls ?? []) if (isNonEmptyMediaSource(mediaUrl)) sources.push(mediaUrl);
	return sources;
}
/** Remote and data sources carry their own bytes; only local paths need queue custody. */
function isSpoolableSource(source) {
	return !(0, _gabrielvfonseca_media_core_media_source_url.isPassThroughRemoteMediaSource)(source) && !/^data:/i.test(source);
}
function isSensitivePayload(payload) {
	return payload.sensitiveMedia === true && payloadMediaSources(payload).length > 0;
}
/**
* Copies local media into queue custody and rewrites only the queue payloads.
* The same loader and capability as the live send authorize every source.
*/
async function stageQueuePayloadMedia(params) {
	if (params.payloads.some(isSensitivePayload)) return {
		status: "not-durable",
		reason: "sensitive-media"
	};
	const spoolRoot = node_path.default.resolve(require_paths.resolveDeliveryQueueMediaDir(params.stateDir));
	const artifactsBySource = /* @__PURE__ */ new Map();
	for (const source of params.payloads.flatMap(payloadMediaSources)) if (isSpoolableSource(source) && !artifactsBySource.has(source)) artifactsBySource.set(source, node_path.default.join(spoolRoot, `${require_retry.generateSecureUuid()}${resolveArtifactExtension(source)}`));
	const artifacts = [...artifactsBySource.values()];
	const mediaStageId = artifacts.length > 0 ? createDeliveryQueueMediaStage(artifacts, params.stateDir) : void 0;
	const store = openSpoolStore(params.stateDir, params.maxBytes);
	const publishedSources = /* @__PURE__ */ new Set();
	const stageSource = async (source) => {
		const stagedPath = artifactsBySource.get(source);
		if (!stagedPath) throw new Error(`Delivery queue media source was not planned: ${source}`);
		if (publishedSources.has(source)) return stagedPath;
		const media = await require_web_media.loadWebMedia(source, require_load_options.buildOutboundMediaLoadOptions({
			maxBytes: params.maxBytes,
			mediaAccess: params.mediaAccess,
			mediaLocalRoots: params.mediaAccess?.localRoots,
			mediaReadFile: params.mediaAccess?.readFile
		}));
		const finalRelative = node_path.default.basename(stagedPath);
		const partRelative = `${finalRelative}${PART_SUFFIX}`;
		try {
			await store.write(partRelative, media.buffer, { maxBytes: params.maxBytes });
			await (await store.root()).move(partRelative, finalRelative, { overwrite: false });
			publishedSources.add(source);
		} catch (err) {
			await store.remove(partRelative).catch(() => void 0);
			throw err;
		}
		return stagedPath;
	};
	const stagedPayloads = [];
	try {
		for (const payload of params.payloads) {
			if (payloadMediaSources(payload).filter(isSpoolableSource).length === 0) {
				stagedPayloads.push(payload);
				continue;
			}
			const staged = { ...payload };
			if (isNonEmptyMediaSource(payload.mediaUrl) && isSpoolableSource(payload.mediaUrl)) staged.mediaUrl = await stageSource(payload.mediaUrl);
			if (payload.mediaUrls) {
				const stagedMediaUrls = [];
				for (const mediaUrl of payload.mediaUrls) stagedMediaUrls.push(isNonEmptyMediaSource(mediaUrl) && isSpoolableSource(mediaUrl) ? await stageSource(mediaUrl) : mediaUrl);
				staged.mediaUrls = stagedMediaUrls;
			}
			stagedPayloads.push(staged);
		}
	} catch (err) {
		cancelDeliveryQueueMediaStage(mediaStageId, params.stateDir);
		await releaseSpoolArtifacts(artifacts, params.stateDir);
		throw err;
	}
	return {
		status: "staged",
		payloads: stagedPayloads,
		artifacts,
		...mediaStageId ? { mediaStageId } : {}
	};
}
function spoolRelativePath(absolutePath, stateDir) {
	const spoolRoot = node_path.default.resolve(require_paths.resolveDeliveryQueueMediaDir(stateDir));
	const candidate = node_path.default.resolve(absolutePath);
	const relative = node_path.default.relative(spoolRoot, candidate);
	return relative && !relative.includes(node_path.default.sep) && ARTIFACT_NAME_RE.test(relative) ? relative : null;
}
async function removeArtifact(absolutePath, stateDir) {
	const relative = spoolRelativePath(absolutePath, stateDir);
	if (!relative) return;
	await openSpoolStore(stateDir).remove(relative).catch(() => void 0);
}
/** Discards spool artifacts whose durable row is already gone. Never throws. */
async function releaseSpoolArtifacts(artifacts, stateDir) {
	for (const artifact of artifacts) await removeArtifact(artifact, stateDir);
}
/** Absolute spool paths a queue entry still needs in order to replay. */
function collectEntrySpoolPaths(payloads, stateDir) {
	const paths = [];
	for (const payload of payloads) for (const source of payloadMediaSources(payload)) if (node_path.default.isAbsolute(source) && spoolRelativePath(source, stateDir)) paths.push(node_path.default.resolve(source));
	return paths;
}
/**
* Removes old unreferenced spool files. Pending-row references always win over
* age; the grace covers the stage-before-row-commit crash window and bounds all
* final and partial artifacts that never acquire a row.
*/
async function pruneDeliveryQueueMedia(params) {
	const spoolRoot = node_path.default.resolve(require_paths.resolveDeliveryQueueMediaDir(params.stateDir));
	const retainPaths = new Set([...params.retainPaths].map((entry) => node_path.default.resolve(entry)));
	const cutoffMs = (params.nowMs ?? Date.now()) - (params.orphanGraceMs ?? ORPHAN_GRACE_MS);
	const entries = await node_fs_promises.default.readdir(spoolRoot, { withFileTypes: true }).catch((err) => {
		if (err.code === "ENOENT") return null;
		throw err;
	});
	if (!entries) return;
	for (const entry of entries) {
		if (!entry.isFile() || !ARTIFACT_NAME_RE.test(entry.name)) continue;
		const artifactPath = node_path.default.join(spoolRoot, entry.name);
		if (retainPaths.has(artifactPath)) continue;
		const stats = await node_fs_promises.default.stat(artifactPath).catch((err) => {
			if (err.code === "ENOENT") return null;
			throw err;
		});
		if (!stats || stats.mtimeMs > cutoffMs) continue;
		await removeArtifact(artifactPath, params.stateDir);
	}
}
/** Reclaims queue media using the complete pending inventory as the retain set. */
async function pruneOrphanedDeliveryQueueMedia(params) {
	const nowMs = params?.nowMs ?? Date.now();
	const snapshot = loadDeliveryQueueMediaRetentionSnapshot({
		expireBeforeMs: nowMs - ORPHAN_GRACE_MS,
		stateDir: params?.stateDir
	});
	await pruneDeliveryQueueMedia({
		retainPaths: new Set(snapshot.stagedArtifacts.concat(snapshot.payloads.flatMap((payloads) => collectEntrySpoolPaths(payloads, params?.stateDir)))),
		stateDir: params?.stateDir,
		nowMs
	});
}
//#endregion
Object.defineProperty(exports, "DELIVERY_QUEUE_MEDIA_STAGING_QUEUE_NAME", {
	enumerable: true,
	get: function() {
		return DELIVERY_QUEUE_MEDIA_STAGING_QUEUE_NAME;
	}
});
Object.defineProperty(exports, "OUTBOUND_DELIVERY_QUEUE_NAME", {
	enumerable: true,
	get: function() {
		return OUTBOUND_DELIVERY_QUEUE_NAME;
	}
});
Object.defineProperty(exports, "cancelDeliveryQueueMediaRecoveryLease", {
	enumerable: true,
	get: function() {
		return cancelDeliveryQueueMediaRecoveryLease;
	}
});
Object.defineProperty(exports, "cancelDeliveryQueueMediaStage", {
	enumerable: true,
	get: function() {
		return cancelDeliveryQueueMediaStage;
	}
});
Object.defineProperty(exports, "collectEntrySpoolPaths", {
	enumerable: true,
	get: function() {
		return collectEntrySpoolPaths;
	}
});
Object.defineProperty(exports, "createDeliveryQueueMediaRecoveryLease", {
	enumerable: true,
	get: function() {
		return createDeliveryQueueMediaRecoveryLease;
	}
});
Object.defineProperty(exports, "pruneOrphanedDeliveryQueueMedia", {
	enumerable: true,
	get: function() {
		return pruneOrphanedDeliveryQueueMedia;
	}
});
Object.defineProperty(exports, "releaseSpoolArtifacts", {
	enumerable: true,
	get: function() {
		return releaseSpoolArtifacts;
	}
});
Object.defineProperty(exports, "stageQueuePayloadMedia", {
	enumerable: true,
	get: function() {
		return stageQueuePayloadMedia;
	}
});
