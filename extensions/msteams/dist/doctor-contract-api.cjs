Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_dm_access = require("./dm-access-UxTYSelO.cjs");
require("./openclaw-state-db-BPmWhmKx.cjs");
require("./dangerous-name-matching-CRIv1nH4.cjs");
require("./security-runtime-DuzdER7a.cjs");
require("./plugin-state-store-BnlgUGbF.cjs");
require("./uninstall-C0yddP-R.cjs");
const require_session_store_runtime = require("./session-store-runtime-r4TbOUjU.cjs");
const require_polls = require("./polls-gUnIF47M.cjs");
const require_sso_token_store = require("./sso-token-store-B7TX76ow.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/config/channel-compat-normalization.ts
/** Narrows unknown config JSON values to mutable object records. */
function asObjectRecord(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function parseAliasStreamingMode(value) {
	if (typeof value !== "string") return null;
	const normalized = value.trim().toLowerCase();
	return normalized === "off" || normalized === "partial" || normalized === "block" || normalized === "progress" ? normalized : null;
}
/**
* Doctor-only stream mode resolution across nested and legacy alias keys.
*
* Runtime helpers no longer read `streamMode`, so doctor contracts use this to
* preserve legacy intent (nested mode > scalar string > streamMode > scalar
* boolean) while migrating flat aliases into `streaming.mode`.
*/
function resolveLegacyAliasStreamingMode(entry, defaultMode) {
	const nestedMode = asObjectRecord(entry.streaming)?.mode;
	const parsed = parseAliasStreamingMode(nestedMode ?? entry.streaming) ?? parseAliasStreamingMode(entry.streamMode);
	if (parsed) return parsed;
	if (typeof entry.streaming === "boolean") return entry.streaming ? "partial" : "off";
	return defaultMode;
}
/** Checks whether any account entry still carries a channel-specific legacy alias. */
function hasLegacyAccountStreamingAliases(value, match) {
	const accounts = asObjectRecord(value);
	if (!accounts) return false;
	return Object.values(accounts).some((account) => match(account));
}
function ensureNestedRecord(owner, key) {
	const existing = asObjectRecord(owner[key]);
	if (existing) return { ...existing };
	return {};
}
/**
* Moves legacy flat streaming aliases into the nested `streaming` config shape.
*
* Existing nested values win over legacy aliases, matching doctor migration rules
* that preserve explicit modern config while removing stale compatibility keys.
*/
function normalizeLegacyStreamingAliases(params) {
	const beforeStreaming = params.entry.streaming;
	const hadLegacyStreamMode = params.entry.streamMode !== void 0;
	const hasLegacyFlatFields = params.entry.chunkMode !== void 0 || params.entry.blockStreaming !== void 0 || params.entry.blockStreamingCoalesce !== void 0 || params.includePreviewChunk === true && params.entry.draftChunk !== void 0 || params.entry.nativeStreaming !== void 0;
	if (!(hadLegacyStreamMode || typeof beforeStreaming === "boolean" || typeof beforeStreaming === "string" || hasLegacyFlatFields)) return {
		entry: params.entry,
		changed: false
	};
	const updated = { ...params.entry };
	let changed = false;
	const streaming = ensureNestedRecord(updated, "streaming");
	const block = ensureNestedRecord(streaming, "block");
	const preview = ensureNestedRecord(streaming, "preview");
	let movedStreamMode = false;
	if ((hadLegacyStreamMode || typeof beforeStreaming === "boolean" || typeof beforeStreaming === "string") && streaming.mode === void 0) {
		streaming.mode = params.resolvedMode;
		if (hadLegacyStreamMode) {
			movedStreamMode = true;
			params.changes.push(`Moved ${params.pathPrefix}.streamMode → ${params.pathPrefix}.streaming.mode (${params.resolvedMode}).`);
		} else if (typeof beforeStreaming === "boolean") params.changes.push(`Moved ${params.pathPrefix}.streaming (boolean) → ${params.pathPrefix}.streaming.mode (${params.resolvedMode}).`);
		else if (typeof beforeStreaming === "string") params.changes.push(`Moved ${params.pathPrefix}.streaming (scalar) → ${params.pathPrefix}.streaming.mode (${params.resolvedMode}).`);
		changed = true;
	}
	if (hadLegacyStreamMode) {
		if (!movedStreamMode) params.changes.push(`Removed ${params.pathPrefix}.streamMode (${params.pathPrefix}.streaming.mode already set).`);
		delete updated.streamMode;
		changed = true;
	}
	const moveOrRemoveAlias = (flatKey, target, slot, nestedPath) => {
		if (updated[flatKey] === void 0) return;
		const nested = `${params.pathPrefix}.streaming.${nestedPath}`;
		if (target[slot] === void 0) {
			target[slot] = updated[flatKey];
			params.changes.push(`Moved ${params.pathPrefix}.${flatKey} → ${nested}.`);
		} else params.changes.push(`Removed ${params.pathPrefix}.${flatKey} (${nested} already set).`);
		delete updated[flatKey];
		changed = true;
	};
	moveOrRemoveAlias("chunkMode", streaming, "chunkMode", "chunkMode");
	moveOrRemoveAlias("blockStreaming", block, "enabled", "block.enabled");
	if (params.includePreviewChunk === true) moveOrRemoveAlias("draftChunk", preview, "chunk", "preview.chunk");
	moveOrRemoveAlias("blockStreamingCoalesce", block, "coalesce", "block.coalesce");
	if (updated.nativeStreaming !== void 0 && params.resolvedNativeTransport !== void 0) {
		if (streaming.nativeTransport === void 0) {
			streaming.nativeTransport = params.resolvedNativeTransport;
			params.changes.push(`Moved ${params.pathPrefix}.nativeStreaming → ${params.pathPrefix}.streaming.nativeTransport.`);
		} else params.changes.push(`Removed ${params.pathPrefix}.nativeStreaming (${params.pathPrefix}.streaming.nativeTransport already set).`);
		delete updated.nativeStreaming;
		changed = true;
	} else if (typeof beforeStreaming === "boolean" && streaming.nativeTransport === void 0 && params.resolvedNativeTransport !== void 0) {
		streaming.nativeTransport = params.resolvedNativeTransport;
		params.changes.push(`Moved ${params.pathPrefix}.streaming (boolean) → ${params.pathPrefix}.streaming.nativeTransport.`);
		changed = true;
	}
	if (changed && beforeStreaming === void 0 && streaming.mode === void 0 && params.aliasOnlyMode !== void 0) {
		streaming.mode = params.aliasOnlyMode;
		params.changes.push(`Set ${params.pathPrefix}.streaming.mode (${params.aliasOnlyMode}) to keep the previous default while migrating flat streaming keys.`);
		changed = true;
	}
	if (Object.keys(preview).length > 0) streaming.preview = preview;
	if (Object.keys(block).length > 0) streaming.block = block;
	updated.streaming = streaming;
	return {
		entry: updated,
		changed
	};
}
/**
* Root flat delivery aliases resolved per-key for every account (nested-first,
* flat-fallback), even when the account carried its own `streaming` value that
* replaces the root object wholesale at merge time. Capture them before root
* migration so replace-semantics channels can seed existing account streaming
* objects with the delivery settings those accounts previously inherited.
*/
function buildRootFlatDeliverySeed(entry, includePreviewChunk) {
	const seed = {};
	if (entry.chunkMode !== void 0) seed.chunkMode = entry.chunkMode;
	const block = {};
	if (entry.blockStreaming !== void 0) block.enabled = entry.blockStreaming;
	if (entry.blockStreamingCoalesce !== void 0) block.coalesce = entry.blockStreamingCoalesce;
	if (Object.keys(block).length > 0) seed.block = block;
	if (includePreviewChunk === true && entry.draftChunk !== void 0) seed.preview = { chunk: entry.draftChunk };
	return Object.keys(seed).length > 0 ? seed : null;
}
/**
* Rebuilds a materialized account streaming object with the per-slot
* precedence the runtime resolvers applied pre-migration. The slots disagree:
* - mode, block.enabled, preview.chunk resolve on the MERGED entry
*   (src/channels/streaming.ts nested-first), so the root nested object
*   outranked account flat aliases and preview.chunk picks atomically.
* - chunkMode resolves the raw account entry before the root entry
*   (resolveChunkModeForProvider in src/auto-reply/chunk.ts), so an account
*   flat chunkMode outranked every root spelling.
* - block.coalesce merges the account pick over the root pick per field
*   (resolveProviderBlockStreamingCoalesce in
*   src/auto-reply/reply/block-streaming.ts).
* One generic deep-fill cannot express that ladder, so seed slot by slot.
* Copying root values freezes inheritance at fix time by design (the change
* message records it); merged-entry channels (mattermost-style resolved
* accounts) would otherwise lose the root values entirely once the account
* owns a streaming object.
*/
function seedMaterializedAccountStreaming(params) {
	const { created } = params;
	const rootNested = params.rootNestedBefore ?? {};
	const rootFlat = params.rootFlat ?? {};
	let seeded = fillMissingRecordFields(structuredClone(rootNested), created).value;
	seeded = fillMissingRecordFields(seeded, rootFlat).value;
	seeded = fillMissingRecordFields(seeded, params.rootAfter).value;
	if (created.chunkMode !== void 0) seeded = {
		...seeded,
		chunkMode: created.chunkMode
	};
	const createdCoalesce = asObjectRecord(asObjectRecord(created.block)?.coalesce);
	if (createdCoalesce) {
		const rootCoalesce = asObjectRecord(asObjectRecord(rootNested.block)?.coalesce) ?? asObjectRecord(asObjectRecord(rootFlat.block)?.coalesce);
		seeded = {
			...seeded,
			block: {
				...asObjectRecord(seeded.block),
				coalesce: {
					...structuredClone(rootCoalesce ?? {}),
					...structuredClone(createdCoalesce)
				}
			}
		};
	}
	const rootNestedPreviewChunk = asObjectRecord(rootNested.preview)?.chunk;
	if (rootNestedPreviewChunk !== void 0 && asObjectRecord(created.preview)?.chunk !== void 0) seeded = {
		...seeded,
		preview: {
			...asObjectRecord(seeded.preview),
			chunk: structuredClone(rootNestedPreviewChunk)
		}
	};
	return seeded;
}
/** Deep-fills record fields missing from target with copies of source values. */
function fillMissingRecordFields(target, source) {
	let filled = false;
	const value = { ...target };
	for (const [key, sourceValue] of Object.entries(source)) {
		if (sourceValue === void 0) continue;
		const existing = value[key];
		if (existing === void 0) {
			value[key] = structuredClone(sourceValue);
			filled = true;
			continue;
		}
		const existingRecord = asObjectRecord(existing);
		const sourceRecord = asObjectRecord(sourceValue);
		if (!existingRecord || !sourceRecord) continue;
		const merged = fillMissingRecordFields(existingRecord, sourceRecord);
		if (merged.filled) {
			value[key] = merged.value;
			filled = true;
		}
	}
	return {
		value,
		filled
	};
}
/**
* Runs generic channel doctor alias migration for the root entry and accounts.
*
* Channel plugins provide streaming resolution and optional account-specific
* migrations so core can keep one compatibility path for all channel shapes.
*/
function normalizeLegacyChannelAliases(params) {
	let updated = params.entry;
	let changed = false;
	const rootFlatDeliverySeed = params.seedAccountStreamingFromRoot === true ? buildRootFlatDeliverySeed(params.entry, params.resolveStreamingOptions(params.entry).includePreviewChunk) : null;
	const rootNestedStreamingBefore = params.seedAccountStreamingFromRoot === true ? asObjectRecord(params.entry.streaming) : null;
	if (params.normalizeDm === true) {
		const dm = require_dm_access.normalizeLegacyDmAliases({
			entry: updated,
			pathPrefix: params.pathPrefix,
			changes: params.changes,
			promoteAllowFrom: params.rootDmPromoteAllowFrom
		});
		updated = dm.entry;
		changed = dm.changed;
	}
	const streaming = normalizeLegacyStreamingAliases({
		entry: updated,
		pathPrefix: params.pathPrefix,
		changes: params.changes,
		...params.resolveStreamingOptions(updated)
	});
	updated = streaming.entry;
	changed = changed || streaming.changed;
	const rawAccounts = asObjectRecord(updated.accounts);
	if (!rawAccounts) return {
		entry: updated,
		changed
	};
	const rootStreaming = asObjectRecord(updated.streaming);
	let accountsChanged = false;
	const accounts = { ...rawAccounts };
	for (const [accountId, rawAccount] of Object.entries(rawAccounts)) {
		const account = asObjectRecord(rawAccount);
		if (!account) continue;
		let accountEntry = account;
		let accountChanged = false;
		const accountPathPrefix = `${params.pathPrefix}.accounts.${accountId}`;
		if (params.normalizeAccountDm === true) {
			const accountDm = require_dm_access.normalizeLegacyDmAliases({
				entry: accountEntry,
				pathPrefix: accountPathPrefix,
				changes: params.changes
			});
			accountEntry = accountDm.entry;
			accountChanged = accountDm.changed;
		}
		const accountStreamingOptions = { ...params.resolveStreamingOptions(accountEntry) };
		if (rootStreaming) delete accountStreamingOptions.aliasOnlyMode;
		const beforeAccountStreaming = accountEntry.streaming;
		const accountStreaming = normalizeLegacyStreamingAliases({
			entry: accountEntry,
			pathPrefix: accountPathPrefix,
			changes: params.changes,
			...accountStreamingOptions
		});
		accountEntry = accountStreaming.entry;
		accountChanged = accountChanged || accountStreaming.changed;
		if (params.seedAccountStreamingFromRoot === true && accountStreaming.changed && beforeAccountStreaming === void 0 && rootStreaming) {
			const created = asObjectRecord(accountEntry.streaming);
			if (created) {
				const seeded = seedMaterializedAccountStreaming({
					created,
					rootNestedBefore: rootNestedStreamingBefore,
					rootFlat: rootFlatDeliverySeed,
					rootAfter: rootStreaming
				});
				if (JSON.stringify(seeded) !== JSON.stringify(created)) {
					accountEntry = {
						...accountEntry,
						streaming: seeded
					};
					params.changes.push(`Copied ${params.pathPrefix}.streaming into ${accountPathPrefix}.streaming to keep inherited settings while migrating flat streaming keys.`);
				}
			}
		} else if (rootFlatDeliverySeed && beforeAccountStreaming !== void 0) {
			const accountStreamingObject = asObjectRecord(accountEntry.streaming);
			if (accountStreamingObject) {
				let seededAccount = accountStreamingObject;
				if (rootFlatDeliverySeed.chunkMode !== void 0 && seededAccount.chunkMode === void 0) seededAccount = {
					...seededAccount,
					chunkMode: rootFlatDeliverySeed.chunkMode
				};
				const rootFlatBlock = asObjectRecord(rootFlatDeliverySeed.block);
				const rootFlatBlockEnabled = rootFlatBlock?.enabled;
				if (rootFlatBlockEnabled !== void 0 && asObjectRecord(seededAccount.block)?.enabled === void 0) seededAccount = {
					...seededAccount,
					block: {
						...asObjectRecord(seededAccount.block),
						enabled: rootFlatBlockEnabled
					}
				};
				const rootFlatCoalesce = asObjectRecord(rootFlatBlock?.coalesce);
				if (rootFlatCoalesce) {
					const accountCoalesce = asObjectRecord(asObjectRecord(seededAccount.block)?.coalesce);
					const mergedCoalesce = {
						...structuredClone(rootFlatCoalesce),
						...structuredClone(accountCoalesce ?? {})
					};
					if (JSON.stringify(mergedCoalesce) !== JSON.stringify(accountCoalesce ?? {})) seededAccount = {
						...seededAccount,
						block: {
							...asObjectRecord(seededAccount.block),
							coalesce: mergedCoalesce
						}
					};
				}
				const rootFlatPreviewChunk = asObjectRecord(rootFlatDeliverySeed.preview)?.chunk;
				if (rootFlatPreviewChunk !== void 0 && asObjectRecord(seededAccount.preview)?.chunk === void 0) seededAccount = {
					...seededAccount,
					preview: {
						...asObjectRecord(seededAccount.preview),
						chunk: structuredClone(rootFlatPreviewChunk)
					}
				};
				if (seededAccount !== accountStreamingObject) {
					accountEntry = {
						...accountEntry,
						streaming: seededAccount
					};
					accountChanged = true;
					params.changes.push(`Copied flat ${params.pathPrefix} delivery keys into ${accountPathPrefix}.streaming to keep inherited settings while migrating flat streaming keys.`);
				}
			}
		}
		const accountExtra = params.normalizeAccountExtra?.({
			account: accountEntry,
			accountId,
			pathPrefix: accountPathPrefix,
			changes: params.changes
		});
		if (accountExtra) {
			accountEntry = accountExtra.entry;
			accountChanged = accountChanged || accountExtra.changed;
		}
		if (accountChanged) {
			accounts[accountId] = accountEntry;
			accountsChanged = true;
		}
	}
	if (accountsChanged) {
		updated = {
			...updated,
			accounts
		};
		changed = true;
	}
	return {
		entry: updated,
		changed
	};
}
/** Detects legacy streaming aliases on one channel or account config entry. */
function hasLegacyStreamingAliases(value, options) {
	const entry = asObjectRecord(value);
	if (!entry) return false;
	return entry.streamMode !== void 0 || typeof entry.streaming === "boolean" || typeof entry.streaming === "string" || entry.chunkMode !== void 0 || entry.blockStreaming !== void 0 || entry.blockStreamingCoalesce !== void 0 || options?.includePreviewChunk === true && entry.draftChunk !== void 0 || options?.includeNativeTransport === true && entry.nativeStreaming !== void 0;
}
//#endregion
//#region src/config/channel-alias-migration.ts
function buildAliasRuleMessage(params) {
	const { streaming, prefix } = params;
	const native = streaming.resolveNativeTransport !== void 0;
	const flat = [
		...streaming.deliveryOnly ? [] : ["streamMode", "streaming (scalar)"],
		"chunkMode",
		"blockStreaming",
		...streaming.includePreviewChunk ? ["draftChunk"] : [],
		"blockStreamingCoalesce",
		...native ? ["nativeStreaming"] : []
	];
	const nested = [
		...streaming.deliveryOnly ? [] : ["mode"],
		"chunkMode",
		...streaming.includePreviewChunk ? ["preview.chunk"] : [],
		"block.enabled",
		"block.coalesce",
		...native ? ["nativeTransport"] : []
	];
	const prefixedCount = params.root && !streaming.deliveryOnly ? 2 : 1;
	const keys = flat.map((key, index) => index < prefixedCount ? `${prefix}.${key}` : key);
	return `${`${keys.slice(0, -1).join(", ")}, and ${keys.at(-1)}`} are legacy; use ${prefix}.streaming.{${nested.join(",")}}. Run "operator doctor --fix".`;
}
/**
* Builds the standard channel doctor alias-migration surface from a small spec:
* detection rules (root + accounts), the per-entry matcher, and the config
* normalizer. Channels with additional migrations compose around these pieces.
*/
function defineChannelAliasMigration(spec) {
	const { streaming } = spec;
	const pathPrefix = `channels.${spec.channelId}`;
	const hasLegacyAliases = (value) => {
		if (streaming.deliveryOnly === true) {
			const entry = asObjectRecord(value);
			return entry !== null && (entry.chunkMode !== void 0 || entry.blockStreaming !== void 0 || entry.blockStreamingCoalesce !== void 0);
		}
		return hasLegacyStreamingAliases(value, {
			includePreviewChunk: streaming.includePreviewChunk,
			includeNativeTransport: streaming.resolveNativeTransport !== void 0
		});
	};
	const resolveStreamingOptions = (entry) => ({
		resolvedMode: streaming.resolveMode?.(entry) ?? resolveLegacyAliasStreamingMode(entry, streaming.defaultMode),
		aliasOnlyMode: streaming.absentObjectDefault,
		includePreviewChunk: streaming.includePreviewChunk,
		resolvedNativeTransport: streaming.resolveNativeTransport?.(entry)
	});
	const normalizeChannelConfig = (params) => {
		const changes = params.changes ?? [];
		const channels = params.cfg.channels;
		const entry = asObjectRecord(channels?.[spec.channelId]);
		if (!entry) return {
			config: params.cfg,
			changes
		};
		if (streaming.deliveryOnly === true && !hasLegacyAliases(entry) && !hasLegacyAccountStreamingAliases(entry.accounts, hasLegacyAliases)) return {
			config: params.cfg,
			changes
		};
		const result = normalizeLegacyChannelAliases({
			entry,
			pathPrefix,
			changes,
			normalizeDm: spec.dm?.root,
			rootDmPromoteAllowFrom: spec.dm?.rootPromoteAllowFrom,
			normalizeAccountDm: spec.dm?.accounts,
			seedAccountStreamingFromRoot: spec.accountStreamingReplacesRoot,
			resolveStreamingOptions,
			normalizeAccountExtra: spec.normalizeAccountExtra
		});
		if (!result.changed) return {
			config: params.cfg,
			changes
		};
		return {
			config: {
				...params.cfg,
				channels: {
					...channels,
					[spec.channelId]: result.entry
				}
			},
			changes
		};
	};
	return {
		legacyConfigRules: [{
			path: ["channels", spec.channelId],
			message: buildAliasRuleMessage({
				streaming,
				prefix: pathPrefix,
				root: true
			}),
			match: hasLegacyAliases
		}, {
			path: [
				"channels",
				spec.channelId,
				"accounts"
			],
			message: buildAliasRuleMessage({
				streaming,
				prefix: `${pathPrefix}.accounts.<id>`,
				root: false
			}),
			match: (value) => hasLegacyAccountStreamingAliases(value, hasLegacyAliases)
		}],
		hasLegacyAliases,
		normalizeChannelConfig
	};
}
//#endregion
//#region src/plugins/doctor-state-migration-fs.ts
/** True when the legacy-state path exists and is a regular file. */
async function legacyStateFileExists(filePath) {
	try {
		return (await node_fs_promises.default.stat(filePath)).isFile();
	} catch {
		return false;
	}
}
/**
* Renames a migrated legacy source to `<path>.migrated`, recording the outcome in the
* doctor changes/warnings lists. Never throws: a failed archive leaves the source in
* place so a later doctor run can retry without losing migrated data.
*/
async function archiveLegacyStateSource(params) {
	const archivedPath = `${params.filePath}.migrated`;
	try {
		if (await legacyStateFileExists(archivedPath)) {
			const [sourceBytes, archiveBytes] = await Promise.all([node_fs_promises.default.readFile(params.filePath), node_fs_promises.default.readFile(archivedPath)]);
			if (sourceBytes.equals(archiveBytes)) {
				await node_fs_promises.default.rm(params.filePath, { force: true });
				params.changes.push(`Removed already-archived ${params.label} legacy source ${params.filePath}`);
				return;
			}
			const nextArchivePath = await firstFreeArchivePath(params.filePath);
			await node_fs_promises.default.rename(params.filePath, nextArchivePath);
			params.changes.push(`Archived ${params.label} legacy source -> ${nextArchivePath}`);
			return;
		}
		await node_fs_promises.default.rename(params.filePath, archivedPath);
		params.changes.push(`Archived ${params.label} legacy source -> ${archivedPath}`);
	} catch (err) {
		params.warnings.push(`Failed archiving ${params.label} legacy source: ${String(err)}`);
	}
}
async function firstFreeArchivePath(sourcePath) {
	for (let index = 2;; index++) {
		const candidate = `${sourcePath}.migrated.${index}`;
		if (!await legacyStateFileExists(candidate)) return candidate;
	}
}
//#endregion
//#region extensions/msteams/doctor-contract-api.ts
const streamingAliasMigration = defineChannelAliasMigration({
	channelId: "msteams",
	streaming: { defaultMode: "partial" }
});
const legacyConfigRules = streamingAliasMigration.legacyConfigRules;
function normalizeCompatibilityConfig({ cfg }) {
	return streamingAliasMigration.normalizeChannelConfig({ cfg });
}
const LEARNINGS_NAMESPACE = "feedback-learnings";
const MAX_LEARNING_ENTRIES = 1e4;
const MSTEAMS_PLUGIN_ID = "Microsoft Teams";
function encodeSessionKey(sessionKey) {
	return Buffer.from(sessionKey, "utf8").toString("base64url");
}
function learningStoreKey(storePath, sessionKey) {
	return node_crypto.default.createHash("sha256").update(`${storePath}\0${sessionKey}`, "utf8").digest("hex");
}
function decodeSessionKey(fileStem) {
	try {
		const decoded = Buffer.from(fileStem, "base64url").toString("utf8");
		return encodeSessionKey(decoded) === fileStem && decoded.trim() ? decoded : null;
	} catch {
		return null;
	}
}
function resolveLearningSessionKey(fileStem) {
	return decodeSessionKey(fileStem);
}
function legacySanitizeSessionKey(sessionKey) {
	return sessionKey.replace(/[^a-zA-Z0-9_-]/g, "_");
}
async function listKnownSessionKeys(storePath) {
	const candidates = [storePath, node_path.default.join(storePath, "sessions.json")];
	for (const candidate of candidates) try {
		const parsed = JSON.parse(await node_fs_promises.default.readFile(candidate, "utf8"));
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
		const sessions = parsed.sessions && typeof parsed.sessions === "object" && !Array.isArray(parsed.sessions) ? parsed.sessions : parsed;
		return Object.keys(sessions).filter((key) => key.trim());
	} catch {}
	return [];
}
function resolveLegacySanitizedSessionKey(fileStem, knownSessionKeys) {
	const matches = knownSessionKeys.filter((sessionKey) => legacySanitizeSessionKey(sessionKey) === fileStem);
	const [match] = matches;
	return matches.length === 1 && match ? match : null;
}
function listAgentIds(config) {
	const ids = /* @__PURE__ */ new Set(["main"]);
	for (const agent of config.agents?.list ?? []) if (typeof agent.id === "string" && agent.id.trim()) ids.add(agent.id.trim());
	return [...ids];
}
function listCandidateStorePaths(params) {
	const paths = /* @__PURE__ */ new Set();
	paths.add(require_session_store_runtime.resolveStorePath(params.config.session?.store, { env: params.env }));
	for (const agentId of listAgentIds(params.config)) paths.add(require_session_store_runtime.resolveStorePath(params.config.session?.store, {
		agentId,
		env: params.env
	}));
	return [...paths];
}
function resolveStateFilePath(stateDir, filename) {
	return node_path.default.join(stateDir, filename);
}
async function readLegacyJsonFile(filePath, parse) {
	try {
		return parse(JSON.parse(await node_fs_promises.default.readFile(filePath, "utf8")));
	} catch {
		return null;
	}
}
function isStringArray(value) {
	return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}
function parseLegacyConversationStore(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || value.version !== 1 || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.conversations)) return null;
	return require_polls.normalizeMSTeamsLegacyConversationStore({
		version: 1,
		conversations: value.conversations
	});
}
function parseLegacyPoll(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return null;
	const votes = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.votes) ? value.votes : null;
	if (typeof value.id !== "string" || !value.id || typeof value.question !== "string" || !value.question || !isStringArray(value.options) || typeof value.maxSelections !== "number" || !Number.isFinite(value.maxSelections) || typeof value.createdAt !== "string" || !votes) return null;
	const normalizedVotes = {};
	for (const [voterId, selections] of Object.entries(votes)) if (typeof voterId === "string" && isStringArray(selections)) normalizedVotes[voterId] = selections;
	return {
		id: value.id,
		question: value.question,
		options: value.options,
		maxSelections: value.maxSelections,
		createdAt: value.createdAt,
		...typeof value.updatedAt === "string" ? { updatedAt: value.updatedAt } : {},
		...typeof value.conversationId === "string" ? { conversationId: value.conversationId } : {},
		...typeof value.messageId === "string" ? { messageId: value.messageId } : {},
		votes: normalizedVotes
	};
}
function parseLegacyPollStore(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || value.version !== 1 || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.polls)) return null;
	const polls = {};
	for (const [pollId, poll] of Object.entries(value.polls)) {
		const parsed = parseLegacyPoll(poll);
		if (parsed) polls[pollId] = parsed;
	}
	return {
		version: 1,
		polls
	};
}
async function listLegacyLearningFiles(storePath) {
	let entries;
	try {
		entries = await node_fs_promises.default.readdir(storePath, { withFileTypes: true });
	} catch {
		return [];
	}
	const suffix = ".learnings.json";
	const knownSessionKeys = await listKnownSessionKeys(storePath);
	const files = [];
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(suffix)) continue;
		const fileStem = entry.name.slice(0, -15);
		const sessionKey = resolveLearningSessionKey(fileStem) ?? resolveLegacySanitizedSessionKey(fileStem, knownSessionKeys);
		const filePath = node_path.default.join(storePath, entry.name);
		try {
			const parsed = JSON.parse(await node_fs_promises.default.readFile(filePath, "utf8"));
			if (Array.isArray(parsed)) {
				const learnings = parsed.filter((item) => typeof item === "string");
				if (learnings.length > 0) files.push({
					storePath,
					sessionKey,
					filePath,
					learnings: learnings.slice(-10)
				});
			}
		} catch {}
	}
	return files;
}
function mergeLearnings(legacy, existing) {
	const seen = /* @__PURE__ */ new Set();
	const merged = [];
	for (const learning of [...legacy, ...existing?.learnings ?? []]) {
		if (seen.has(learning)) continue;
		seen.add(learning);
		merged.push(learning);
	}
	return merged.slice(-10);
}
const stateMigrations = [
	{
		id: "msteams-conversations-json-to-plugin-state",
		label: "Microsoft Teams conversations",
		async detectLegacyState(params) {
			const state = await readLegacyJsonFile(resolveStateFilePath(params.stateDir, require_polls.MSTEAMS_CONVERSATIONS_LEGACY_FILENAME), parseLegacyConversationStore);
			if (!state || Object.keys(state.conversations).length === 0) return null;
			return { preview: [`- ${MSTEAMS_PLUGIN_ID} conversations: ${Object.keys(state.conversations).length} entries -> plugin state (${require_polls.MSTEAMS_CONVERSATIONS_NAMESPACE})`] };
		},
		async migrateLegacyState(params) {
			const changes = [];
			const warnings = [];
			const filePath = resolveStateFilePath(params.stateDir, require_polls.MSTEAMS_CONVERSATIONS_LEGACY_FILENAME);
			const state = await readLegacyJsonFile(filePath, parseLegacyConversationStore);
			if (!state) return {
				changes,
				warnings
			};
			const store = params.context.openPluginStateKeyedStore({
				namespace: require_polls.MSTEAMS_CONVERSATIONS_NAMESPACE,
				maxEntries: require_polls.MSTEAMS_SQLITE_MAX_CONVERSATION_ROWS
			});
			let imported = 0;
			for (const [rawConversationId, reference] of require_polls.selectRetainedMSTeamsConversations(state.conversations)) {
				const conversationId = require_polls.normalizeStoredConversationId(rawConversationId);
				if (!conversationId) continue;
				if (await store.registerIfAbsent(require_polls.buildMSTeamsConversationStateKey(conversationId), require_polls.prepareMSTeamsConversationReferenceForStorage(conversationId, reference))) imported++;
			}
			changes.push(`Migrated ${imported} ${MSTEAMS_PLUGIN_ID} conversation ${imported === 1 ? "entry" : "entries"} -> plugin state`);
			await archiveLegacyStateSource({
				filePath,
				label: `${MSTEAMS_PLUGIN_ID} conversation`,
				changes,
				warnings
			});
			return {
				changes,
				warnings
			};
		}
	},
	{
		id: "msteams-polls-json-to-plugin-state",
		label: "Microsoft Teams polls",
		async detectLegacyState(params) {
			const state = await readLegacyJsonFile(resolveStateFilePath(params.stateDir, require_polls.MSTEAMS_POLLS_LEGACY_FILENAME), parseLegacyPollStore);
			if (!state || Object.keys(state.polls).length === 0) return null;
			return { preview: [`- ${MSTEAMS_PLUGIN_ID} polls: ${Object.keys(state.polls).length} entries -> plugin state (${require_polls.MSTEAMS_POLLS_NAMESPACE})`] };
		},
		async migrateLegacyState(params) {
			const changes = [];
			const warnings = [];
			const filePath = resolveStateFilePath(params.stateDir, require_polls.MSTEAMS_POLLS_LEGACY_FILENAME);
			const state = await readLegacyJsonFile(filePath, parseLegacyPollStore);
			if (!state) return {
				changes,
				warnings
			};
			const pollStore = params.context.openPluginStateKeyedStore({
				namespace: require_polls.MSTEAMS_POLLS_NAMESPACE,
				maxEntries: require_polls.MSTEAMS_SQLITE_MAX_POLL_ROWS
			});
			const voteBucketStore = params.context.openPluginStateKeyedStore({
				namespace: require_polls.MSTEAMS_POLL_VOTE_BUCKETS_NAMESPACE,
				maxEntries: require_polls.MSTEAMS_MAX_POLL_VOTE_BUCKET_ROWS
			});
			let imported = 0;
			for (const [pollId, poll] of require_polls.selectRetainedMSTeamsPolls(state.polls)) {
				const { metadata, votes } = require_polls.splitMSTeamsPoll(poll);
				const didImportPoll = await pollStore.registerIfAbsent(require_polls.buildMSTeamsPollStateKey(pollId), metadata);
				const buckets = /* @__PURE__ */ new Map();
				for (const [voterId, selections] of Object.entries(votes)) {
					const bucket = require_polls.selectMSTeamsPollVoteBucket(pollId, voterId);
					const bucketVotes = buckets.get(bucket) ?? {};
					bucketVotes[voterId] = selections;
					buckets.set(bucket, bucketVotes);
				}
				let importedVoteBucket = false;
				for (const [bucket, bucketVotes] of buckets) {
					const key = require_polls.buildMSTeamsPollVoteBucketKey(pollId, bucket);
					const existing = await voteBucketStore.lookup(key);
					await voteBucketStore.register(key, {
						pollId,
						bucket,
						votes: {
							...bucketVotes,
							...existing?.votes
						},
						updatedAt: poll.updatedAt ?? poll.createdAt
					});
					importedVoteBucket = true;
				}
				if (didImportPoll || importedVoteBucket) imported++;
			}
			changes.push(`Migrated ${imported} ${MSTEAMS_PLUGIN_ID} poll ${imported === 1 ? "entry" : "entries"} -> plugin state`);
			await archiveLegacyStateSource({
				filePath,
				label: `${MSTEAMS_PLUGIN_ID} poll`,
				changes,
				warnings
			});
			return {
				changes,
				warnings
			};
		}
	},
	{
		id: "msteams-sso-tokens-json-to-plugin-state",
		label: "Microsoft Teams SSO tokens",
		async detectLegacyState(params) {
			const state = await readLegacyJsonFile(resolveStateFilePath(params.stateDir, require_sso_token_store.MSTEAMS_SSO_TOKENS_LEGACY_FILENAME), (value) => require_sso_token_store.isMSTeamsSsoStoreData(value) ? value : null);
			if (!state || Object.keys(state.tokens).length === 0) return null;
			return { preview: [`- ${MSTEAMS_PLUGIN_ID} SSO tokens: ${Object.keys(state.tokens).length} entries -> plugin state (${require_sso_token_store.MSTEAMS_SSO_TOKENS_NAMESPACE})`] };
		},
		async migrateLegacyState(params) {
			const changes = [];
			const warnings = [];
			const filePath = resolveStateFilePath(params.stateDir, require_sso_token_store.MSTEAMS_SSO_TOKENS_LEGACY_FILENAME);
			const state = await readLegacyJsonFile(filePath, (value) => require_sso_token_store.isMSTeamsSsoStoreData(value) ? value : null);
			if (!state) return {
				changes,
				warnings
			};
			const store = params.context.openPluginStateKeyedStore({
				namespace: require_sso_token_store.MSTEAMS_SSO_TOKENS_NAMESPACE,
				maxEntries: require_sso_token_store.MSTEAMS_MAX_SSO_TOKENS
			});
			let imported = 0;
			let skipped = 0;
			for (const token of Object.values(state.tokens)) {
				const normalized = require_sso_token_store.normalizeMSTeamsSsoStoredToken(token);
				if (!normalized) {
					skipped++;
					continue;
				}
				if (await store.registerIfAbsent(require_sso_token_store.makeMSTeamsSsoTokenStoreKey(normalized.connectionName, normalized.userId), normalized)) imported++;
			}
			changes.push(`Migrated ${imported} ${MSTEAMS_PLUGIN_ID} SSO token ${imported === 1 ? "entry" : "entries"} -> plugin state`);
			if (skipped > 0) warnings.push(`Skipped ${skipped} malformed ${MSTEAMS_PLUGIN_ID} SSO token ${skipped === 1 ? "entry" : "entries"} during migration`);
			await archiveLegacyStateSource({
				filePath,
				label: `${MSTEAMS_PLUGIN_ID} SSO-token`,
				changes,
				warnings
			});
			return {
				changes,
				warnings
			};
		}
	},
	{
		id: "msteams-feedback-learnings-json-to-plugin-state",
		label: "Microsoft Teams feedback learnings",
		async detectLegacyState(params) {
			const files = (await Promise.all(listCandidateStorePaths(params).map((storePath) => listLegacyLearningFiles(storePath)))).flat();
			if (files.length === 0) return null;
			return { preview: [`- Microsoft Teams feedback learnings: ${files.length} ${files.length === 1 ? "file" : "files"} -> plugin state (${LEARNINGS_NAMESPACE})`] };
		},
		async migrateLegacyState(params) {
			const changes = [];
			const warnings = [];
			const files = (await Promise.all(listCandidateStorePaths(params).map((storePath) => listLegacyLearningFiles(storePath)))).flat();
			const store = params.context.openPluginStateKeyedStore({
				namespace: LEARNINGS_NAMESPACE,
				maxEntries: MAX_LEARNING_ENTRIES
			});
			const existingEntries = await store.entries();
			const existingKeys = new Set(existingEntries.map((entry) => entry.key));
			const importableFiles = files.filter((file) => file.sessionKey);
			const missingKeys = new Set(importableFiles.map((file) => learningStoreKey(file.storePath, file.sessionKey ?? "")).filter((key) => !existingKeys.has(key)));
			if (missingKeys.size > MAX_LEARNING_ENTRIES - existingKeys.size) {
				warnings.push(`Skipped Microsoft Teams feedback-learning migration because plugin state has room for ${MAX_LEARNING_ENTRIES - existingKeys.size} of ${missingKeys.size} missing entries; left legacy sources in place`);
				return {
					changes,
					warnings
				};
			}
			let imported = 0;
			for (const file of files) {
				if (!file.sessionKey) {
					warnings.push(`Left Microsoft Teams feedback-learning source in place because its legacy filename cannot be mapped to a session key: ${file.filePath}`);
					continue;
				}
				const key = learningStoreKey(file.storePath, file.sessionKey);
				const existing = await store.lookup(key);
				await store.register(key, {
					sessionKey: existing?.sessionKey ?? file.sessionKey,
					learnings: mergeLearnings(file.learnings, existing),
					updatedAt: Date.now()
				});
				imported++;
				await archiveLegacyStateSource({
					filePath: file.filePath,
					label: "Microsoft Teams feedback-learning",
					changes,
					warnings
				});
			}
			if (imported > 0) changes.unshift(`Migrated ${imported} Microsoft Teams feedback-learning ${imported === 1 ? "entry" : "entries"} -> plugin state`);
			return {
				changes,
				warnings
			};
		}
	}
];
//#endregion
exports.legacyConfigRules = legacyConfigRules;
exports.normalizeCompatibilityConfig = normalizeCompatibilityConfig;
exports.stateMigrations = stateMigrations;
