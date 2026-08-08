require("./fs-safe-BptZQDa1.cjs");
const require_string_readers = require("./string-readers-DjRuUveR.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_channel_target = require("./channel-target-Djs5HcPj.cjs");
const require_common = require("./common-lfuK3YJR.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_payloads = require("./payloads-MFaWqn01.cjs");
require("./src-C56Dr8YU.cjs");
require("./store-BW6t6tIi.cjs");
const require_load_options = require("./load-options-28l5_jW7.cjs");
require("./local-file-access-r6xSCXfB.cjs");
const require_web_media = require("./web-media-CQULBkBb.cjs");
const require_outbound_attachment = require("./outbound-attachment-ry_WMADm.cjs");
const require_sandbox_paths = require("./sandbox-paths-BmmHDLnB.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_store$1 = require("./store-DCwJguwr.cjs");
const require_read_capability = require("./read-capability-CG92FLhs.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_transcript = require("./transcript-BHT2QzlI.cjs");
const require_conversation_read_origin = require("./conversation-read-origin-C-xn-esF.cjs");
const require_message_action_discovery = require("./message-action-discovery-BroWFszp.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_media_core_mime = require("@gabrielvfonseca/media-core/mime");
let _gabrielvfonseca_media_core_base64 = require("@gabrielvfonseca/media-core/base64");
let _gabrielvfonseca_media_core_file_name = require("@gabrielvfonseca/media-core/file-name");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
//#region packages/normalization-core/src/boolean-coercion.ts
/** Parses booleans and case-insensitive `true`/`false` string tokens. */
function parseBoolean(value) {
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return;
	const normalized = value.trim().toLowerCase();
	if (normalized === "true") return true;
	if (normalized === "false") return false;
}
//#endregion
//#region src/plugin-sdk/boolean-param.ts
/** Read loose boolean params from tool input that may arrive as booleans or "true"/"false" strings. */
function readBooleanParam$1(params, key) {
	return parseBoolean(params[key]);
}
//#endregion
//#region src/infra/outbound/message-action-params.ts
/** Shared boolean param reader used by message-action argument normalization. */
const readBooleanParam = readBooleanParam$1;
const BASE_ACTION_MEDIA_SOURCE_PARAM_KEYS = [
	"media",
	"path",
	"filePath",
	"mediaUrl",
	"fileUrl",
	"image"
];
const STRUCTURED_ATTACHMENT_MEDIA_SOURCE_PARAM_KEYS = [
	"media",
	"mediaUrl",
	"path",
	"filePath",
	"fileUrl",
	"url"
];
const STRUCTURED_ATTACHMENT_FILE_SOURCE_PARAM_KEYS = /* @__PURE__ */ new Set([
	"path",
	"filePath",
	"fileUrl"
]);
const SEND_BUFFER_DRY_RUN_MEDIA_URL = "buffer://message-send/attachment";
function readMediaParam(args, key) {
	return require_common.readStringParam(args, key, { trim: false });
}
function resolveMediaParamEntry(args, key) {
	const resolvedKey = require_common.resolveSnakeCaseParamKey(args, key);
	if (!resolvedKey) return;
	const value = readMediaParam(args, key);
	if (!value) return;
	return {
		key: resolvedKey,
		value
	};
}
function hasExplicitAttachmentPayload(args, extraParamKeys) {
	if (require_common.readStringParam(args, "buffer", { trim: false })) return true;
	return buildActionMediaSourceParamKeys(extraParamKeys).some((key) => {
		const entry = resolveMediaParamEntry(args, key);
		return Boolean(entry && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.value));
	});
}
function hasExplicitSendMediaSource(args, extraParamKeys) {
	if (buildActionMediaSourceParamKeys(extraParamKeys).some((key) => {
		const entry = resolveMediaParamEntry(args, key);
		const value = entry ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.value) : void 0;
		return Boolean(value && value !== SEND_BUFFER_DRY_RUN_MEDIA_URL);
	})) return true;
	if (require_common.readStringArrayParam(args, "mediaUrls")?.some((value) => {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
		return Boolean(normalized && normalized !== SEND_BUFFER_DRY_RUN_MEDIA_URL);
	})) return true;
	return collectStructuredAttachmentSources(args).some((source) => Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(source.value)));
}
function collectStructuredAttachmentSources(args) {
	const attachments = args.attachments;
	if (!Array.isArray(attachments)) return [];
	const sources = [];
	for (const attachment of attachments) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(attachment)) continue;
		for (const key of STRUCTURED_ATTACHMENT_MEDIA_SOURCE_PARAM_KEYS) {
			const entry = resolveMediaParamEntry(attachment, key);
			if (!entry || !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.value)) continue;
			sources.push({
				attachment,
				key: entry.key,
				value: entry.value,
				kind: STRUCTURED_ATTACHMENT_FILE_SOURCE_PARAM_KEYS.has(key) ? "file" : "media",
				contentType: require_common.readStringParam(attachment, "contentType") ?? require_common.readStringParam(attachment, "mimeType"),
				filename: require_common.readStringParam(attachment, "filename") ?? require_common.readStringParam(attachment, "name")
			});
			break;
		}
	}
	return sources;
}
function resolveStructuredAttachmentSource(args, extraParamKeys) {
	if (hasExplicitAttachmentPayload(args, extraParamKeys)) return;
	return collectStructuredAttachmentSources(args)[0];
}
function buildActionMediaSourceParamKeys(extraParamKeys) {
	const keys = new Set(BASE_ACTION_MEDIA_SOURCE_PARAM_KEYS);
	extraParamKeys?.forEach((key) => keys.add(key));
	return Array.from(keys);
}
/** Resolves plugin-declared media source param aliases for a message action. */
function resolveExtraActionMediaSourceParamKeys(params) {
	if (!require_channel_target.hasPotentialPluginActionParam(params.args)) return [];
	return require_message_action_discovery.resolveChannelMessageToolMediaSourceParamKeys({
		cfg: params.cfg,
		action: params.action,
		channel: params.channel,
		accountId: params.accountId,
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		agentId: params.agentId,
		requesterSenderId: params.requesterSenderId,
		senderIsOwner: params.senderIsOwner
	});
}
/** Collects candidate media source strings from message-action args. */
function collectActionMediaSourceHints(args, extraParamKeys, options) {
	const sources = [];
	for (const key of buildActionMediaSourceParamKeys(extraParamKeys)) {
		const entry = resolveMediaParamEntry(args, key);
		if (entry && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.value)) sources.push(entry.value);
	}
	for (const value of require_common.readStringArrayParam(args, "mediaUrls") ?? []) if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value)) sources.push(value);
	if (options?.structuredAttachments === "all") sources.push(...collectStructuredAttachmentSources(args).map((source) => source.value));
	else {
		const attachmentSource = resolveStructuredAttachmentSource(args, extraParamKeys);
		if (attachmentSource) sources.push(attachmentSource.value);
	}
	return sources;
}
function readAttachmentMediaHint(args) {
	return readMediaParam(args, "media") ?? readMediaParam(args, "mediaUrl");
}
function readAttachmentFileHint(args) {
	return readMediaParam(args, "path") ?? readMediaParam(args, "filePath") ?? readMediaParam(args, "fileUrl");
}
function resolveAttachmentMaxBytes(params) {
	const limitMb = require_read_capability.resolveChannelAccountMediaMaxMb(params) ?? params.cfg.agents?.defaults?.mediaMaxMb;
	return typeof limitMb === "number" ? limitMb * 1024 * 1024 : void 0;
}
function inferAttachmentFilename(params) {
	const mediaHint = params.mediaHint?.trim();
	if (mediaHint) {
		const base = (0, _openclaw_fs_safe_advanced.basenameFromMediaSource)(mediaHint);
		const safeBase = base ? (0, _gabrielvfonseca_media_core_file_name.basenameFromAnyPath)(base) : void 0;
		if (safeBase) return safeBase;
	}
	const ext = params.contentType ? (0, _gabrielvfonseca_media_core_mime.extensionForMime)(params.contentType) : void 0;
	return ext ? `attachment${ext}` : "attachment";
}
function normalizeBase64Payload(params) {
	if (!params.base64) return {
		base64: params.base64,
		contentType: params.contentType
	};
	const match = /^data:([^;]+);base64,(.*)$/i.exec(params.base64.trim());
	if (!match) return {
		base64: params.base64,
		contentType: params.contentType
	};
	const [, mime, payload] = match;
	return {
		base64: payload,
		contentType: params.contentType ?? mime
	};
}
function resolveSendBufferMaxBytes(params) {
	return resolveAttachmentMaxBytes({
		cfg: params.cfg,
		channel: params.channel,
		accountId: params.accountId
	}) ?? 5242880;
}
function decodeBoundedBase64Attachment(params) {
	const estimatedBytes = (0, _gabrielvfonseca_media_core_base64.estimateBase64DecodedBytes)(params.base64);
	if (estimatedBytes > params.maxBytes) throw new Error(`Media too large: ${estimatedBytes} bytes (limit: ${params.maxBytes} bytes)`);
	const canonicalBase64 = (0, _gabrielvfonseca_media_core_base64.canonicalizeBase64)(params.base64);
	if (!canonicalBase64) throw new Error("message.send buffer has invalid base64 data");
	const buffer = Buffer.from(canonicalBase64, "base64");
	if (buffer.byteLength > params.maxBytes) throw new Error(`Media too large: ${buffer.byteLength} bytes (limit: ${params.maxBytes} bytes)`);
	return buffer;
}
async function hydrateSendBufferMediaParams(params) {
	if (hasExplicitSendMediaSource(params.args, params.extraParamKeys)) {
		delete params.args.buffer;
		return;
	}
	const rawBuffer = require_common.readStringParam(params.args, "buffer", { trim: false });
	if (!rawBuffer) return;
	const normalized = normalizeBase64Payload({
		base64: rawBuffer,
		contentType: require_common.readStringParam(params.args, "contentType") ?? void 0
	});
	if (!normalized.base64) return;
	const contentType = require_common.readStringParam(params.args, "contentType") ?? require_common.readStringParam(params.args, "mimeType") ?? normalized.contentType;
	const filename = require_common.readStringParam(params.args, "filename") ?? inferAttachmentFilename({ contentType: contentType ?? void 0 });
	const maxBytes = resolveSendBufferMaxBytes(params);
	if (params.dryRun || params.preserveBuffer) {
		decodeBoundedBase64Attachment({
			base64: normalized.base64,
			maxBytes
		});
		params.args.media = SEND_BUFFER_DRY_RUN_MEDIA_URL;
		params.args.mediaUrl = SEND_BUFFER_DRY_RUN_MEDIA_URL;
		params.args.mediaUrls = [SEND_BUFFER_DRY_RUN_MEDIA_URL];
		if (!params.preserveBuffer) delete params.args.buffer;
		if (normalized.contentType && !require_common.readStringParam(params.args, "contentType")) params.args.contentType = normalized.contentType;
		if (filename && !require_common.readStringParam(params.args, "filename")) params.args.filename = filename;
		return;
	}
	const staged = await require_outbound_attachment.resolveOutboundAttachmentFromBuffer(decodeBoundedBase64Attachment({
		base64: normalized.base64,
		maxBytes
	}), maxBytes, {
		contentType: contentType ?? void 0,
		filename
	});
	params.args.media = staged.path;
	params.args.mediaUrl = staged.path;
	params.args.mediaUrls = [staged.path];
	delete params.args.buffer;
	if (staged.contentType && !require_common.readStringParam(params.args, "contentType")) params.args.contentType = staged.contentType;
	if (filename && !require_common.readStringParam(params.args, "filename")) params.args.filename = filename;
}
/** Chooses sandbox or host media loading policy for attachment hydration. */
function resolveAttachmentMediaPolicy(params) {
	const sandboxRoot = params.sandboxRoot?.trim();
	if (sandboxRoot) return {
		mode: "sandbox",
		sandboxRoot
	};
	const explicitLocalRoots = require_load_options.resolveOutboundMediaLocalRoots(params.mediaLocalRoots);
	return {
		mode: "host",
		mediaAccess: require_load_options.resolveOutboundMediaAccess({
			mediaAccess: params.mediaAccess,
			mediaLocalRoots: explicitLocalRoots === "any" ? void 0 : explicitLocalRoots,
			mediaReadFile: params.mediaAccess?.readFile ? void 0 : params.mediaReadFile
		}),
		...explicitLocalRoots !== void 0 ? { mediaLocalRoots: explicitLocalRoots } : {},
		...params.mediaAccess?.readFile ? {} : params.mediaReadFile ? { mediaReadFile: params.mediaReadFile } : {}
	};
}
function buildAttachmentMediaLoadOptions(params) {
	if (params.policy.mode === "sandbox") {
		const sandboxRoot = params.policy.sandboxRoot.trim();
		let sandboxFsPromise;
		const readSandboxFile = async (filePath) => {
			sandboxFsPromise ??= (0, _openclaw_fs_safe_root.root)(sandboxRoot);
			return await (await sandboxFsPromise).readBytes(filePath);
		};
		return {
			maxBytes: params.maxBytes,
			...params.optimizeImages !== void 0 ? { optimizeImages: params.optimizeImages } : {},
			sandboxValidated: true,
			readFile: readSandboxFile
		};
	}
	return require_load_options.buildOutboundMediaLoadOptions({
		maxBytes: params.maxBytes,
		mediaAccess: params.policy.mediaAccess,
		mediaLocalRoots: params.policy.mediaLocalRoots,
		mediaReadFile: params.policy.mediaReadFile,
		optimizeImages: params.optimizeImages
	});
}
async function hydrateAttachmentPayload(params) {
	const contentTypeParam = params.contentTypeParam ?? void 0;
	const rawBuffer = require_common.readStringParam(params.args, "buffer", { trim: false });
	const normalized = normalizeBase64Payload({
		base64: rawBuffer,
		contentType: contentTypeParam ?? void 0
	});
	if (normalized.base64 !== rawBuffer && normalized.base64) {
		params.args.buffer = normalized.base64;
		if (normalized.contentType && !contentTypeParam) params.args.contentType = normalized.contentType;
	}
	const filename = require_common.readStringParam(params.args, "filename");
	const mediaSource = (params.mediaHint ?? void 0) || (params.fileHint ?? void 0);
	if (!params.dryRun && !require_common.readStringParam(params.args, "buffer", { trim: false }) && mediaSource) {
		const maxBytes = resolveAttachmentMaxBytes({
			cfg: params.cfg,
			channel: params.channel,
			accountId: params.accountId
		});
		const media = await require_web_media.loadWebMedia(mediaSource, buildAttachmentMediaLoadOptions({
			policy: params.mediaPolicy,
			maxBytes,
			optimizeImages: params.optimizeImages
		}));
		params.args.buffer = media.buffer.toString("base64");
		if (!contentTypeParam && media.contentType) params.args.contentType = media.contentType;
		if (!filename) params.args.filename = inferAttachmentFilename({
			mediaHint: media.fileName ?? mediaSource,
			contentType: media.contentType ?? contentTypeParam ?? void 0
		});
	} else if (!filename) params.args.filename = inferAttachmentFilename({
		mediaHint: mediaSource,
		contentType: contentTypeParam ?? void 0
	});
}
/** Rewrites action media params to sandbox-safe paths and rejects data URLs. */
async function normalizeSandboxMediaParams(params) {
	const sandboxRoot = params.mediaPolicy.mode === "sandbox" ? params.mediaPolicy.sandboxRoot.trim() : void 0;
	for (const key of buildActionMediaSourceParamKeys(params.extraParamKeys)) {
		const entry = resolveMediaParamEntry(params.args, key);
		if (!entry) continue;
		require_sandbox_paths.assertMediaNotDataUrl(entry.value);
		if (!sandboxRoot) continue;
		const normalized = await require_sandbox_paths.resolveSandboxedMediaSource({
			media: entry.value,
			sandboxRoot
		});
		if (normalized !== entry.value) params.args[entry.key] = normalized;
	}
	const attachmentSources = params.structuredAttachments === "all" ? collectStructuredAttachmentSources(params.args) : [resolveStructuredAttachmentSource(params.args, params.extraParamKeys)].filter((source) => Boolean(source));
	if (attachmentSources.length === 0) return;
	for (const attachmentSource of attachmentSources) {
		require_sandbox_paths.assertMediaNotDataUrl(attachmentSource.value);
		if (!sandboxRoot) continue;
		const normalized = await require_sandbox_paths.resolveSandboxedMediaSource({
			media: attachmentSource.value,
			sandboxRoot
		});
		if (normalized !== attachmentSource.value) attachmentSource.attachment[attachmentSource.key] = normalized;
	}
}
/** Normalizes a list of media hints against an optional sandbox root. */
async function normalizeSandboxMediaList(params) {
	const sandboxRoot = params.sandboxRoot?.trim();
	const normalized = [];
	const seen = /* @__PURE__ */ new Set();
	for (const value of params.values) {
		const raw = value?.trim();
		if (!raw) continue;
		require_sandbox_paths.assertMediaNotDataUrl(raw);
		const resolved = sandboxRoot ? await require_sandbox_paths.resolveSandboxedMediaSource({
			media: raw,
			sandboxRoot
		}) : raw;
		if (seen.has(resolved)) continue;
		seen.add(resolved);
		normalized.push(resolved);
	}
	return normalized;
}
async function hydrateAttachmentActionPayload(params) {
	const attachmentSource = resolveStructuredAttachmentSource(params.args, params.extraParamKeys);
	const mediaHint = readAttachmentMediaHint(params.args);
	const fileHint = readAttachmentFileHint(params.args);
	const contentTypeParam = require_common.readStringParam(params.args, "contentType") ?? require_common.readStringParam(params.args, "mimeType") ?? attachmentSource?.contentType;
	if (attachmentSource?.filename && !require_common.readStringParam(params.args, "filename")) params.args.filename = attachmentSource.filename;
	if (attachmentSource?.contentType && !require_common.readStringParam(params.args, "contentType")) params.args.contentType = attachmentSource.contentType;
	if (params.allowMessageCaptionFallback) {
		const caption = require_common.readStringParam(params.args, "caption", { allowEmpty: true })?.trim();
		const message = require_common.readStringParam(params.args, "message", { allowEmpty: true })?.trim();
		if (!caption && message) params.args.caption = message;
	}
	await hydrateAttachmentPayload({
		cfg: params.cfg,
		channel: params.channel,
		accountId: params.accountId,
		args: params.args,
		dryRun: params.dryRun,
		contentTypeParam,
		mediaHint: mediaHint ?? (attachmentSource?.kind === "media" ? attachmentSource.value : void 0),
		fileHint: fileHint ?? (attachmentSource?.kind === "file" ? attachmentSource.value : void 0),
		mediaPolicy: params.mediaPolicy,
		optimizeImages: params.optimizeImages
	});
}
/** Hydrates attachment-bearing message actions with base64 buffers and metadata. */
async function hydrateAttachmentParamsForAction(params) {
	const shouldHydrateUploadFile = params.action === "upload-file";
	if (params.action === "send") {
		await hydrateSendBufferMediaParams({
			cfg: params.cfg,
			channel: params.channel,
			accountId: params.accountId,
			args: params.args,
			dryRun: params.dryRun,
			preserveBuffer: params.preserveSendBuffer,
			extraParamKeys: params.extraParamKeys
		});
		return;
	}
	if (params.action !== "sendAttachment" && params.action !== "setGroupIcon" && params.action !== "reply" && !shouldHydrateUploadFile) return;
	const forceDocument = readBooleanParam$1(params.args, "forceDocument") ?? readBooleanParam$1(params.args, "asDocument") ?? false;
	await hydrateAttachmentActionPayload({
		cfg: params.cfg,
		channel: params.channel,
		accountId: params.accountId,
		args: params.args,
		dryRun: params.dryRun,
		mediaPolicy: params.mediaPolicy,
		extraParamKeys: params.extraParamKeys,
		optimizeImages: shouldHydrateUploadFile && forceDocument ? false : void 0,
		allowMessageCaptionFallback: params.action === "sendAttachment" || shouldHydrateUploadFile
	});
}
/** Parses a named string param as JSON for structured message action fields. */
function parseJsonMessageParam(params, key) {
	const raw = params[key];
	if (typeof raw !== "string") return;
	const trimmed = raw.trim();
	if (!trimmed) {
		delete params[key];
		return;
	}
	try {
		params[key] = JSON.parse(trimmed);
	} catch {
		throw new Error(`--${key} must be valid JSON`);
	}
}
/** Parses the interactive message action param as JSON when provided as a string. */
function parseInteractiveParam(params) {
	const raw = params.interactive;
	if (typeof raw !== "string") return;
	const trimmed = raw.trim();
	if (!trimmed) {
		delete params.interactive;
		return;
	}
	try {
		params.interactive = JSON.parse(trimmed);
	} catch {
		throw new Error("--interactive must be valid JSON");
	}
}
//#endregion
//#region src/channels/plugins/message-action-dispatch.ts
const READ_DEPENDENT_ACTIONS = /* @__PURE__ */ new Set([
	"poll-vote",
	"react",
	"reactions",
	"read",
	"edit",
	"unsend",
	"delete",
	"pin",
	"unpin",
	"list-pins",
	"permissions",
	"thread-list",
	"search",
	"sticker-search",
	"member-info",
	"role-info",
	"emoji-list",
	"channel-info",
	"channel-list",
	"voice-status",
	"event-list",
	"download-file"
]);
const BUNDLED_CHANNELS_WITH_PROVIDER_READ_GATES = /* @__PURE__ */ new Set([
	"discord",
	"feishu",
	"matrix",
	"msteams",
	"slack"
]);
const HOST_TARGET_KIND_PREFIXES = /* @__PURE__ */ new Set([
	"user",
	"channel",
	"room",
	"chat",
	"group",
	"dm",
	"conversation"
]);
function stripHostProviderPrefix(params) {
	const prefixes = [params.channel, ...params.providerPrefixes ?? []].map((prefix) => prefix.trim().toLowerCase()).filter((prefix) => Boolean(prefix) && !HOST_TARGET_KIND_PREFIXES.has(prefix));
	const lowered = params.value.toLowerCase();
	const prefix = prefixes.find((candidate) => lowered.startsWith(`${candidate}:`));
	return prefix ? params.value.slice(prefix.length + 1).trim() : params.value;
}
function normalizeHostConversationTarget(params) {
	if (typeof params.value !== "string") return;
	const rawValue = params.value.trim();
	const value = params.normalizeTarget ? params.normalizeTarget(rawValue)?.trim() : rawValue;
	if (!value) return;
	const withoutProvider = stripHostProviderPrefix({
		value,
		channel: params.channel,
		providerPrefixes: params.providerPrefixes
	});
	if (!withoutProvider) return;
	const typedTarget = withoutProvider.match(/^(user|channel|room|chat|group|dm|conversation):(.*)$/i);
	if (typedTarget) {
		const id = typedTarget[2]?.trim();
		if (!id) return;
		return {
			id,
			kind: typedTarget[1]?.toLowerCase()
		};
	}
	return {
		id: withoutProvider,
		...params.impliedKind ? { kind: params.impliedKind } : {}
	};
}
function targetKey(target) {
	return `${target.kind ?? ""}\0${target.id}`;
}
function addHostConversationTarget(targets, target) {
	if (target) targets.set(targetKey(target), target);
}
function hasConflictingTargetKinds(targets) {
	const kindsById = /* @__PURE__ */ new Map();
	for (const target of targets) {
		if (!target.kind) continue;
		const kinds = kindsById.get(target.id) ?? /* @__PURE__ */ new Set();
		kinds.add(target.kind);
		kindsById.set(target.id, kinds);
	}
	return Array.from(kindsById.values()).some((kinds) => kinds.size > 1);
}
function currentTargetsMatchRequested(params) {
	const sameId = params.currentTargets.filter((currentTarget) => currentTarget.id === params.requestedTarget.id);
	if (sameId.length === 0 || !params.requestedTarget.kind) return sameId.length > 0;
	const typedCurrentTargets = sameId.filter((currentTarget) => currentTarget.kind);
	if (typedCurrentTargets.length === 0) {
		if (!params.requestedTargets.some((requestedTarget) => requestedTarget.id === params.requestedTarget.id && !requestedTarget.kind)) return false;
		if (params.currentChatType === "direct") return params.requestedTarget.kind === "user" || params.requestedTarget.kind === "dm";
		if (params.currentChatType === "group") return params.requestedTarget.kind === "group" || params.requestedTarget.kind === "room";
		if (params.currentChatType === "channel") return params.requestedTarget.kind === "channel";
		return false;
	}
	return typedCurrentTargets.some((currentTarget) => currentTarget.kind === params.requestedTarget.kind);
}
function hasMatchingCurrentAccountContext(ctx) {
	const rawAccountId = ctx.accountId?.trim() ?? "";
	const rawRequesterAccountId = ctx.requesterAccountId?.trim() ?? "";
	if (!rawRequesterAccountId) return false;
	if (rawAccountId && !require_account_id.normalizeOptionalAccountId(rawAccountId) || !require_account_id.normalizeOptionalAccountId(rawRequesterAccountId)) return false;
	return require_account_id.normalizeAccountId(rawAccountId) === require_account_id.normalizeAccountId(rawRequesterAccountId);
}
function hasMatchingCurrentProviderContext(ctx) {
	const currentProvider = ctx.toolContext?.currentChannelProvider?.trim().toLowerCase();
	return Boolean(currentProvider && currentProvider === ctx.channel.trim().toLowerCase());
}
function hasCurrentConversationTarget(ctx) {
	return [ctx.toolContext?.currentChannelId, ctx.toolContext?.currentMessagingTarget].some((value) => typeof value === "string" && Boolean(value.trim()));
}
function hasTargetInput(value) {
	if (typeof value === "string") return Boolean(value.trim());
	return typeof value === "number" && Number.isFinite(value);
}
function isExactCurrentConversation(params) {
	if (!hasMatchingCurrentProviderContext(params.ctx) || !hasMatchingCurrentAccountContext(params.ctx)) return false;
	const normalizeTarget = params.pluginOrigin === "bundled" ? params.plugin.messaging?.normalizeTarget : void 0;
	const providerPrefixes = params.plugin.messaging?.targetPrefixes;
	const aliasSpec = params.pluginOrigin === "bundled" ? params.plugin.actions?.messageActionTargetAliases?.[params.ctx.action] : void 0;
	const deliveryTargetAliases = new Set(aliasSpec?.deliveryTargetAliases ?? []);
	const requestedTargets = /* @__PURE__ */ new Map();
	for (const [key, impliedKind] of [
		["target", void 0],
		["to", void 0],
		["channelId", "channel"],
		["roomId", "room"],
		["chatId", "chat"]
	]) {
		const rawTarget = params.ctx.params[key];
		if (deliveryTargetAliases.has(key)) continue;
		const normalizedTarget = normalizeHostConversationTarget({
			value: rawTarget,
			channel: params.ctx.channel,
			impliedKind,
			normalizeTarget,
			providerPrefixes
		});
		if (hasTargetInput(rawTarget) && !normalizedTarget) return false;
		addHostConversationTarget(requestedTargets, normalizedTarget);
	}
	let hasDeliveryAliasInput = false;
	let normalizedAliasTarget;
	if (params.pluginOrigin === "bundled") {
		hasDeliveryAliasInput = (aliasSpec?.deliveryTargetAliases ?? []).some((alias) => hasTargetInput(params.ctx.params[alias]));
		const resolvedAliasTarget = aliasSpec?.resolveDeliveryTarget?.({ args: params.ctx.params });
		normalizedAliasTarget = normalizeHostConversationTarget({
			value: resolvedAliasTarget,
			channel: params.ctx.channel,
			normalizeTarget,
			providerPrefixes
		});
		if (hasDeliveryAliasInput && !resolvedAliasTarget || resolvedAliasTarget !== void 0 && !normalizedAliasTarget) return false;
		addHostConversationTarget(requestedTargets, normalizedAliasTarget);
	}
	const normalizedAliasTargetKey = normalizedAliasTarget ? targetKey(normalizedAliasTarget) : void 0;
	const nonAliasRequestedTargets = Array.from(requestedTargets.values()).filter((target) => targetKey(target) !== normalizedAliasTargetKey);
	const requestedTargetList = Array.from(requestedTargets.values());
	if (hasConflictingTargetKinds(requestedTargetList)) return false;
	const currentTargets = /* @__PURE__ */ new Map();
	for (const value of [params.ctx.toolContext?.currentChannelId, params.ctx.toolContext?.currentMessagingTarget]) addHostConversationTarget(currentTargets, normalizeHostConversationTarget({
		value,
		channel: params.ctx.channel,
		normalizeTarget,
		providerPrefixes
	}));
	const currentTargetList = Array.from(currentTargets.values());
	if (currentTargetList.length === 0 || hasConflictingTargetKinds(currentTargetList)) return false;
	if (requestedTargetList.length === 0) return false;
	const currentChatType = require_chat_type.normalizeChatType(params.ctx.toolContext?.currentChatType);
	const matchesCurrentTarget = (requestedTarget) => currentTargetsMatchRequested({
		currentTargets: currentTargetList,
		requestedTargets: requestedTargetList,
		requestedTarget,
		currentChatType
	});
	if (requestedTargetList.every(matchesCurrentTarget)) return true;
	if (params.pluginOrigin !== "bundled" || !hasDeliveryAliasInput || !params.ctx.toolContext || !aliasSpec?.matchesCurrentConversation || !nonAliasRequestedTargets.every(matchesCurrentTarget)) return false;
	return aliasSpec.matchesCurrentConversation({
		args: params.ctx.params,
		accountId: require_account_id.normalizeAccountId(params.ctx.accountId),
		toolContext: params.ctx.toolContext
	});
}
function assertConversationReadAllowed(params) {
	const usesBundledProviderReadGate = params.pluginOrigin === "bundled" && BUNDLED_CHANNELS_WITH_PROVIDER_READ_GATES.has(params.ctx.channel);
	if (require_conversation_read_origin.normalizeConversationReadInvocationOrigin(params.ctx.conversationReadOrigin) === "direct-operator" || usesBundledProviderReadGate || !READ_DEPENDENT_ACTIONS.has(params.ctx.action)) return;
	if (params.pluginOrigin === "bundled" && params.ctx.action === "sticker-search" && hasMatchingCurrentProviderContext(params.ctx) && hasMatchingCurrentAccountContext(params.ctx) && hasCurrentConversationTarget(params.ctx) || isExactCurrentConversation({
		ctx: params.ctx,
		plugin: params.plugin,
		pluginOrigin: params.pluginOrigin
	})) return;
	throw new Error(`Delegated ${params.ctx.channel}:${params.ctx.action} requires the exact current conversation and account for this plugin.`);
}
function canonicalizeExternalExactCurrentTarget(params) {
	if (params.pluginOrigin === "bundled" || require_conversation_read_origin.normalizeConversationReadInvocationOrigin(params.ctx.conversationReadOrigin) === "direct-operator" || !READ_DEPENDENT_ACTIONS.has(params.ctx.action)) return;
	const target = params.ctx.params.target;
	const resolvedTarget = [params.ctx.params.to, params.ctx.params.channelId].find((value) => typeof value === "string" && Boolean(value.trim()));
	if (typeof target === "string" && target.trim() && resolvedTarget) params.ctx.params.target = resolvedTarget;
}
function requiresTrustedRequesterSender(ctx, plugin) {
	return Boolean(plugin?.actions?.requiresTrustedRequesterSender?.({
		action: ctx.action,
		toolContext: ctx.toolContext
	}));
}
/**
* Runs a channel message action if the target plugin supports it.
*/
async function dispatchChannelMessageAction(ctx) {
	const registration = require_registry.resolveChannelPluginRegistration(ctx.channel);
	if (!registration) return null;
	const { plugin } = registration;
	const actions = plugin.actions;
	if (!actions?.handleAction) return null;
	assertConversationReadAllowed({
		ctx,
		plugin,
		pluginOrigin: registration.origin
	});
	canonicalizeExternalExactCurrentTarget({
		ctx,
		pluginOrigin: registration.origin
	});
	if (requiresTrustedRequesterSender(ctx, plugin) && !ctx.requesterSenderId?.trim()) throw new Error(`Trusted sender identity is required for ${ctx.channel}:${ctx.action} in tool-driven contexts.`);
	if (actions.supportsAction && !actions.supportsAction({ action: ctx.action })) return null;
	return await actions.handleAction(ctx);
}
//#endregion
//#region src/plugin-sdk/tool-payload.ts
function isToolPayloadTextBlock(block) {
	return Boolean(block) && typeof block === "object" && block.type === "text" && typeof block.text === "string";
}
/**
* Extract the most useful payload from tool result-like objects shared across
* outbound core flows and bundled plugin helpers.
*/
function extractToolPayload(result) {
	if (!result) return;
	if (result.details !== void 0) return result.details;
	const text = (Array.isArray(result.content) ? result.content.find(isToolPayloadTextBlock) : void 0)?.text;
	if (!text) return result.content ?? result;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
//#endregion
//#region src/config/sessions/restart-recovery-receipt.ts
function hasActiveClaim(entry, scope) {
	return entry.sessionId === scope.sessionId && require_store$1.hasActiveRestartRecoverySourceClaim(entry, scope.sourceTurnId);
}
function hasExactDeliveryClaim(entry, scope) {
	return hasActiveClaim(entry, scope) && entry.restartRecoveryDeliveryToolCallId === scope.toolCallId;
}
function hasClaimlessLiveDeliveryState(entry, scope) {
	return entry.sessionId === scope.sessionId && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliveryRunId) === void 0 && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliverySourceRunId) === void 0 && entry.restartRecoveryDeliveryReceiptState === void 0 && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliveryToolCallId) === void 0;
}
function loadCurrent(scope) {
	return require_session_accessor.loadSessionEntry({
		sessionKey: scope.sessionKey,
		storePath: scope.storePath,
		readConsistency: "latest"
	});
}
/** Persists ambiguity before a terminal external send is allowed to start. */
async function beginRestartRecoveryTerminalDelivery(scope) {
	let started = false;
	const updated = await require_session_accessor.updateSessionEntry({
		sessionKey: scope.sessionKey,
		storePath: scope.storePath
	}, (entry) => {
		if (!hasActiveClaim(entry, scope) || entry.restartRecoveryDeliveryReceiptState || entry.restartRecoveryDeliveryToolCallId) return null;
		started = true;
		return {
			restartRecoveryDeliveryReceiptState: "terminal-pending",
			restartRecoveryDeliveryToolCallId: scope.toolCallId,
			updatedAt: Date.now()
		};
	}, {
		skipMaintenance: true,
		takeCacheOwnership: true
	});
	if (started && updated !== null && hasExactDeliveryClaim(updated, scope) && updated.restartRecoveryDeliveryReceiptState === "terminal-pending") return "started";
	const current = loadCurrent(scope);
	if (current?.sessionId === scope.sessionId && require_store$1.hasRestartRecoveryTerminalRun(current, scope.sourceTurnId)) return "blocked";
	if (current && hasClaimlessLiveDeliveryState(current, scope)) return "not-applicable";
	if (!current || !hasActiveClaim(current, scope)) return "stale";
	if (current.restartRecoveryDeliveryReceiptState || current.restartRecoveryDeliveryToolCallId) return "blocked";
	throw new Error("failed to persist terminal delivery intent");
}
/** Resolves a pre-send ambiguity only after the provider confirms delivery. */
async function completeRestartRecoveryTerminalDelivery(scope) {
	const updated = await require_session_accessor.updateSessionEntry({
		sessionKey: scope.sessionKey,
		storePath: scope.storePath
	}, (entry) => {
		if (!hasExactDeliveryClaim(entry, scope) || entry.restartRecoveryDeliveryReceiptState !== "terminal-pending") return null;
		return {
			restartRecoveryDeliveryReceiptState: "delivered-terminal",
			updatedAt: Date.now()
		};
	}, {
		skipMaintenance: true,
		takeCacheOwnership: true
	});
	if (updated !== null && hasExactDeliveryClaim(updated, scope) && updated.restartRecoveryDeliveryReceiptState === "delivered-terminal") return "recorded";
	const current = loadCurrent(scope);
	if (!current || !hasActiveClaim(current, scope)) return "stale";
	if (hasExactDeliveryClaim(current, scope) && current.restartRecoveryDeliveryReceiptState === "delivered-terminal") return "recorded";
	throw new Error("failed to persist terminal delivery completion");
}
/** Clears the pre-send intent only when the provider proves no delivery occurred. */
async function cancelRestartRecoveryTerminalDelivery(scope) {
	const updated = await require_session_accessor.updateSessionEntry({
		sessionKey: scope.sessionKey,
		storePath: scope.storePath
	}, (entry) => {
		if (!hasExactDeliveryClaim(entry, scope) || entry.restartRecoveryDeliveryReceiptState !== "terminal-pending") return null;
		return {
			restartRecoveryDeliveryReceiptState: void 0,
			restartRecoveryDeliveryToolCallId: void 0,
			updatedAt: Date.now()
		};
	}, {
		skipMaintenance: true,
		takeCacheOwnership: true
	});
	if (updated !== null && hasActiveClaim(updated, scope) && !updated.restartRecoveryDeliveryReceiptState && !updated.restartRecoveryDeliveryToolCallId) return "cleared";
	const current = loadCurrent(scope);
	if (!current || !hasActiveClaim(current, scope)) return "stale";
	if (!current.restartRecoveryDeliveryReceiptState && !current.restartRecoveryDeliveryToolCallId) return "cleared";
	if (hasExactDeliveryClaim(current, scope) && current.restartRecoveryDeliveryReceiptState === "delivered-terminal") return "stale";
	throw new Error("failed to clear terminal delivery intent");
}
//#endregion
//#region src/infra/outbound/source-reply-mirror.ts
function readStringArray(value) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeOptionalTrimmedStringList)(value);
}
function asRecord(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function readFirstString(params, keys) {
	return require_string_readers.readTrimmedStringAlias(params, keys);
}
function resolveSourceReplyTarget(params) {
	return readFirstString(params, [
		"target",
		"to",
		"channelId",
		"chatId"
	]);
}
function resolveSourceReplyThreadId(params) {
	return readFirstString(params.actionParams, ["threadId", "messageThreadId"]);
}
function resolveDeliveredThreadPlacement(params, currentThreadId) {
	const payload = asRecord(params.deliveredPayload);
	const receipt = asRecord(asRecord(payload?.result)?.receipt) ?? asRecord(payload?.receipt);
	if (!receipt) return;
	const deliveredThreadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(receipt.threadId);
	return deliveredThreadId ? deliveredThreadId === currentThreadId ? "match" : "mismatch" : currentThreadId ? "mismatch" : "match";
}
function resolveSourceReplyThreadPlacement(params) {
	const currentThreadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.toolContext?.currentThreadTs);
	const deliveredPlacement = resolveDeliveredThreadPlacement(params, currentThreadId);
	if (deliveredPlacement) return deliveredPlacement;
	if (params.actionParams.topLevel === true) return currentThreadId ? "mismatch" : "match";
	for (const key of ["threadId", "messageThreadId"]) {
		if (!Object.hasOwn(params.actionParams, key)) continue;
		const explicitThreadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.actionParams[key]);
		if (!explicitThreadId) return currentThreadId ? "mismatch" : "match";
		return explicitThreadId === currentThreadId ? "match" : "mismatch";
	}
	return currentThreadId ? "unknown" : "match";
}
function resolveThreadedSourceTarget(params, requestedTarget) {
	const threadId = resolveSourceReplyThreadId(params);
	if (!threadId) return requestedTarget;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_registry.getChannelPlugin(params.channel)?.threading?.resolveCurrentChannelId?.({
		to: requestedTarget,
		threadId
	})) ?? requestedTarget;
}
function hasExplicitDeliveryFailure(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
	const record = payload;
	if (record.ok === false) return true;
	const status = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(record.status);
	if (status === "failed" || status === "error") return true;
	const deliveryStatus = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(record.deliveryStatus);
	return deliveryStatus === "failed" || deliveryStatus === "error";
}
function resolveCurrentSourceTurnId(toolContext) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(toolContext?.currentSourceTurnId);
}
function resolveTerminalSourceReplyDeliveryReceipt(params) {
	const toolCallId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.toolCallId);
	if (params.sourceReplyFinal !== true) return;
	if (!toolCallId) throw new Error("terminal source reply requires tool-call correlation");
	if (!params.sessionId || !isCurrentSourceConversation(params)) return;
	const sourceTurnId = resolveCurrentSourceTurnId(params.toolContext);
	if (!sourceTurnId) return;
	const agentId = params.agentId ?? require_session_key.resolveAgentIdFromSessionKey(params.sessionKey);
	return {
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		sourceTurnId,
		storePath: require_paths.resolveStorePath(params.cfg.session?.store, { agentId }),
		toolCallId
	};
}
/** Arms the fail-closed state before a terminal source reply can reach a provider. */
async function beginTerminalSourceReplyDelivery(params) {
	const receipt = resolveTerminalSourceReplyDeliveryReceipt(params);
	if (!receipt) return;
	const result = await beginRestartRecoveryTerminalDelivery(receipt);
	if (result === "not-applicable") return;
	if (result === "blocked") throw new Error("terminal source reply already has a durable delivery outcome");
	if (result === "stale") throw new Error("terminal source reply lost restart recovery ownership");
	return receipt;
}
/** Cancels a pre-send intent only when dispatch proved that no send occurred. */
async function cancelTerminalSourceReplyDelivery(receipt) {
	if (receipt) await cancelRestartRecoveryTerminalDelivery(receipt);
}
/** Reconciles the provider result while an unresolved intent remains fail closed. */
async function reconcileTerminalSourceReplyDelivery(params) {
	if (!params.receipt) return "not-applicable";
	if (hasExplicitDeliveryFailure(params.deliveredPayload)) {
		if (params.preservePendingOnExplicitFailure) return "pending";
		await cancelRestartRecoveryTerminalDelivery(params.receipt);
		return "not-delivered";
	}
	if (!isExactCurrentSourceConversation({
		...params.mirror,
		deliveredPayload: params.deliveredPayload
	})) return "not-source";
	await completeRestartRecoveryTerminalDelivery(params.receipt);
	return "delivered";
}
function resolveTranscriptMirrorIdempotencyKey(params) {
	if (params.sourceReplyFinal !== true || !params.idempotencyKey || !params.sourceTurnId) return params.idempotencyKey;
	return `${params.idempotencyKey}:terminal-receipt:${params.sourceTurnId}`;
}
function isCurrentSourceConversation(params) {
	if (params.action !== "send") return false;
	if (!params.sessionKey?.trim()) return false;
	const toolContext = params.toolContext;
	if (!toolContext) return false;
	const currentChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(toolContext.currentChannelProvider);
	if (!currentChannel || currentChannel !== (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel)) return false;
	const currentTargets = [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(toolContext.currentMessagingTarget), (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(toolContext.currentChannelId)].filter((target) => Boolean(target));
	if (currentTargets.length === 0) return false;
	const requestedTarget = resolveSourceReplyTarget(params.actionParams);
	if (!requestedTarget) return false;
	const threadPlacement = resolveSourceReplyThreadPlacement(params);
	if (threadPlacement === "mismatch") return false;
	const threadedTarget = resolveThreadedSourceTarget(params, requestedTarget);
	const matchesToolContextTarget = require_registry.getChannelPlugin(params.channel)?.threading?.matchesToolContextTarget;
	if (threadPlacement === "match" && (matchesToolContextTarget?.({
		target: requestedTarget,
		toolContext
	}) || threadedTarget !== requestedTarget && matchesToolContextTarget?.({
		target: threadedTarget,
		toolContext
	}))) return true;
	return currentTargets.some((currentTarget) => requestedTarget === currentTarget || threadedTarget === currentTarget);
}
function isExactCurrentSourceConversation(params) {
	return resolveSourceReplyThreadPlacement(params) === "match" && isCurrentSourceConversation(params);
}
/** Mirrors successful outbound source replies into the owning session transcript. */
async function mirrorDeliveredSourceReplyToTranscript(params) {
	if (hasExplicitDeliveryFailure(params.deliveredPayload)) return false;
	if (!isCurrentSourceConversation(params)) return false;
	if (params.sourceReplyFinal === true && !isExactCurrentSourceConversation(params)) return false;
	const mirror = require_payloads.projectOutboundPayloadPlanForMirror(require_payloads.createOutboundPayloadPlan([{
		text: readFirstString(params.actionParams, [
			"message",
			"content",
			"text",
			"caption"
		]) ?? "",
		mediaUrl: readFirstString(params.actionParams, [
			"mediaUrl",
			"media",
			"path",
			"filePath",
			"fileUrl"
		]),
		mediaUrls: readStringArray(params.actionParams.mediaUrls),
		presentation: params.actionParams.presentation,
		interactive: params.actionParams.interactive,
		channelData: params.actionParams.channelData
	}]));
	if (!mirror.text && mirror.mediaUrls.length === 0) return false;
	const sourceTurnId = resolveCurrentSourceTurnId(params.toolContext);
	if ((await require_transcript.appendAssistantMessageToSessionTranscript({
		agentId: params.agentId,
		sessionKey: params.sessionKey,
		...params.sessionId ? { expectedSessionId: params.sessionId } : {},
		text: mirror.text,
		mediaUrls: mirror.mediaUrls.length ? mirror.mediaUrls : void 0,
		idempotencyKey: resolveTranscriptMirrorIdempotencyKey({
			idempotencyKey: params.idempotencyKey,
			sourceReplyFinal: params.sourceReplyFinal,
			sourceTurnId
		}),
		...params.sourceReplyFinal !== void 0 ? { deliveryMirror: {
			kind: "message-tool-source-reply",
			final: params.sourceReplyFinal,
			...params.toolCallId ? { toolCallId: params.toolCallId } : {},
			...sourceTurnId ? { sourceTurnId } : {}
		} } : {},
		config: params.cfg
	})).ok) return true;
	return false;
}
//#endregion
Object.defineProperty(exports, "beginTerminalSourceReplyDelivery", {
	enumerable: true,
	get: function() {
		return beginTerminalSourceReplyDelivery;
	}
});
Object.defineProperty(exports, "cancelTerminalSourceReplyDelivery", {
	enumerable: true,
	get: function() {
		return cancelTerminalSourceReplyDelivery;
	}
});
Object.defineProperty(exports, "collectActionMediaSourceHints", {
	enumerable: true,
	get: function() {
		return collectActionMediaSourceHints;
	}
});
Object.defineProperty(exports, "dispatchChannelMessageAction", {
	enumerable: true,
	get: function() {
		return dispatchChannelMessageAction;
	}
});
Object.defineProperty(exports, "extractToolPayload", {
	enumerable: true,
	get: function() {
		return extractToolPayload;
	}
});
Object.defineProperty(exports, "hydrateAttachmentParamsForAction", {
	enumerable: true,
	get: function() {
		return hydrateAttachmentParamsForAction;
	}
});
Object.defineProperty(exports, "mirrorDeliveredSourceReplyToTranscript", {
	enumerable: true,
	get: function() {
		return mirrorDeliveredSourceReplyToTranscript;
	}
});
Object.defineProperty(exports, "normalizeSandboxMediaList", {
	enumerable: true,
	get: function() {
		return normalizeSandboxMediaList;
	}
});
Object.defineProperty(exports, "normalizeSandboxMediaParams", {
	enumerable: true,
	get: function() {
		return normalizeSandboxMediaParams;
	}
});
Object.defineProperty(exports, "parseInteractiveParam", {
	enumerable: true,
	get: function() {
		return parseInteractiveParam;
	}
});
Object.defineProperty(exports, "parseJsonMessageParam", {
	enumerable: true,
	get: function() {
		return parseJsonMessageParam;
	}
});
Object.defineProperty(exports, "readBooleanParam", {
	enumerable: true,
	get: function() {
		return readBooleanParam;
	}
});
Object.defineProperty(exports, "reconcileTerminalSourceReplyDelivery", {
	enumerable: true,
	get: function() {
		return reconcileTerminalSourceReplyDelivery;
	}
});
Object.defineProperty(exports, "resolveAttachmentMediaPolicy", {
	enumerable: true,
	get: function() {
		return resolveAttachmentMediaPolicy;
	}
});
Object.defineProperty(exports, "resolveExtraActionMediaSourceParamKeys", {
	enumerable: true,
	get: function() {
		return resolveExtraActionMediaSourceParamKeys;
	}
});
