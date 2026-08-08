const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_http_body = require("./http-body-BwUnoq2M.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
const require_module_loader = require("./module-loader-D_NNnfbR.cjs");
const require_hooks_policy = require("./hooks-policy-CZRsXWd0.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/hooks-mapping.ts
const hookPresetMappings = { gmail: [{
	id: "gmail",
	match: { path: "gmail" },
	action: "agent",
	wakeMode: "now",
	name: "Gmail",
	sessionKey: "hook:gmail:{{messages[0].id}}",
	messageTemplate: "New email from {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}\n{{messages[0].body}}"
}] };
const transformCache = /* @__PURE__ */ new Map();
/** Resolve configured hook mappings plus preset mappings into normalized matcher entries. */
function resolveHookMappings(hooks, opts) {
	const presets = hooks?.presets ?? [];
	const gmailAllowUnsafe = hooks?.gmail?.allowUnsafeExternalContent;
	const mappings = [];
	if (hooks?.mappings) mappings.push(...hooks.mappings);
	for (const preset of presets) {
		const presetMappings = hookPresetMappings[preset];
		if (!presetMappings) continue;
		if (preset === "gmail" && typeof gmailAllowUnsafe === "boolean") {
			mappings.push(...presetMappings.map((mapping) => ({
				...mapping,
				allowUnsafeExternalContent: gmailAllowUnsafe
			})));
			continue;
		}
		mappings.push(...presetMappings);
	}
	if (mappings.length === 0) return [];
	const configDir = node_path.default.resolve(opts?.configDir ?? node_path.default.dirname(require_paths.resolveConfigPathCandidate()));
	const transformsDir = resolveOptionalContainedPath(node_path.default.join(configDir, "hooks", "transforms"), hooks?.transformsDir, "Hook transformsDir");
	return mappings.map((mapping, index) => normalizeHookMapping(mapping, index, transformsDir));
}
async function applyHookMappings(mappings, ctx) {
	if (mappings.length === 0) return null;
	for (const mapping of mappings) {
		if (!mappingMatches(mapping, ctx)) continue;
		const base = buildActionFromMapping(mapping, ctx);
		if (!base.ok) return base;
		let override = null;
		if (mapping.transform) {
			override = await (await loadTransform(mapping.transform))(ctx);
			if (override === null) return {
				ok: true,
				action: null,
				skipped: true
			};
		}
		if (!base.action) return {
			ok: true,
			action: null,
			skipped: true
		};
		const merged = mergeAction(base.action, override, mapping.action);
		if (!merged.ok) return merged;
		return merged;
	}
	return null;
}
function normalizeHookMapping(mapping, index, transformsDir) {
	const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(mapping.id) || `mapping-${index + 1}`;
	const matchPath = normalizeMatchPath(mapping.match?.path);
	const matchSource = mapping.match?.source?.trim();
	const action = mapping.action ?? "agent";
	const wakeMode = mapping.wakeMode ?? "now";
	const transform = mapping.transform ? {
		modulePath: resolveContainedPath(transformsDir, mapping.transform.module, "Hook transform"),
		exportName: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(mapping.transform.export)
	} : void 0;
	return {
		id,
		matchPath,
		matchSource,
		action,
		wakeMode,
		name: mapping.name,
		agentId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(mapping.agentId),
		sessionKey: mapping.sessionKey,
		messageTemplate: mapping.messageTemplate,
		textTemplate: mapping.textTemplate,
		deliver: mapping.deliver,
		allowUnsafeExternalContent: mapping.allowUnsafeExternalContent,
		channel: mapping.channel,
		to: mapping.to,
		model: mapping.model,
		thinking: mapping.thinking,
		timeoutSeconds: mapping.timeoutSeconds,
		transform
	};
}
function mappingMatches(mapping, ctx) {
	if (mapping.matchPath) {
		if (mapping.matchPath !== normalizeMatchPath(ctx.path)) return false;
	}
	if (mapping.matchSource) {
		const source = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(ctx.payload.source);
		if (!source || source !== mapping.matchSource) return false;
	}
	return true;
}
function buildActionFromMapping(mapping, ctx) {
	if (mapping.action === "wake") return {
		ok: true,
		action: {
			kind: "wake",
			text: renderTemplate(mapping.textTemplate ?? "", ctx),
			mode: mapping.wakeMode ?? "now"
		}
	};
	return {
		ok: true,
		action: {
			kind: "agent",
			message: renderTemplate(mapping.messageTemplate ?? "", ctx),
			name: renderOptional(mapping.name, ctx),
			agentId: mapping.agentId,
			wakeMode: mapping.wakeMode ?? "now",
			sessionKey: renderOptional(mapping.sessionKey, ctx),
			sessionKeySource: getSessionKeyTemplateSource(mapping.sessionKey),
			deliver: mapping.deliver,
			allowUnsafeExternalContent: mapping.allowUnsafeExternalContent,
			channel: mapping.channel,
			to: renderOptional(mapping.to, ctx),
			model: renderOptional(mapping.model, ctx),
			thinking: renderOptional(mapping.thinking, ctx),
			timeoutSeconds: mapping.timeoutSeconds
		}
	};
}
function mergeAction(base, override, defaultAction) {
	if (!override) return validateAction(base);
	if ((override.kind ?? base.kind ?? defaultAction) === "wake") {
		const baseWake = base.kind === "wake" ? base : void 0;
		return validateAction({
			kind: "wake",
			text: typeof override.text === "string" ? override.text : baseWake?.text ?? "",
			mode: override.mode === "next-heartbeat" ? "next-heartbeat" : baseWake?.mode ?? "now"
		});
	}
	const baseAgent = base.kind === "agent" ? base : void 0;
	return validateAction({
		kind: "agent",
		message: typeof override.message === "string" ? override.message : baseAgent?.message ?? "",
		wakeMode: override.wakeMode === "next-heartbeat" ? "next-heartbeat" : baseAgent?.wakeMode ?? "now",
		name: override.name ?? baseAgent?.name,
		agentId: override.agentId ?? baseAgent?.agentId,
		sessionKey: override.sessionKey ?? baseAgent?.sessionKey,
		sessionKeySource: resolveMergedSessionKeySource(baseAgent, override),
		deliver: typeof override.deliver === "boolean" ? override.deliver : baseAgent?.deliver,
		allowUnsafeExternalContent: typeof override.allowUnsafeExternalContent === "boolean" ? override.allowUnsafeExternalContent : baseAgent?.allowUnsafeExternalContent,
		channel: override.channel ?? baseAgent?.channel,
		to: override.to ?? baseAgent?.to,
		model: override.model ?? baseAgent?.model,
		thinking: override.thinking ?? baseAgent?.thinking,
		timeoutSeconds: override.timeoutSeconds ?? baseAgent?.timeoutSeconds
	});
}
function validateAction(action) {
	if (action.kind === "wake") {
		if (!action.text?.trim()) return {
			ok: false,
			error: "hook mapping requires text"
		};
		return {
			ok: true,
			action
		};
	}
	if (!action.message?.trim()) return {
		ok: false,
		error: "hook mapping requires message"
	};
	return {
		ok: true,
		action
	};
}
function getSessionKeyTemplateSource(sessionKeyTemplate) {
	const normalizedTemplate = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKeyTemplate);
	if (!normalizedTemplate) return;
	return hasHookTemplateExpressions(normalizedTemplate) ? "templated" : "static";
}
function resolveMergedSessionKeySource(baseAgent, override) {
	if (typeof override.sessionKey === "string") {
		if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(override.sessionKey)) return;
		return override.sessionKeySource === "static" ? "static" : "templated";
	}
	return baseAgent?.sessionKeySource;
}
function hasHookTemplateExpressions(template) {
	return /\{\{\s*[^}]+\s*\}\}/.test(template);
}
async function loadTransform(transform) {
	const cacheKey = `${transform.modulePath}::${transform.exportName ?? "default"}`;
	const cached = transformCache.get(cacheKey);
	if (cached) return cached;
	const fn = resolveTransformFn(await require_module_loader.importFileModule({ modulePath: transform.modulePath }), transform.exportName);
	transformCache.set(cacheKey, fn);
	return fn;
}
function resolveTransformFn(mod, exportName) {
	const candidate = require_module_loader.resolveFunctionModuleExport({
		mod,
		exportName,
		fallbackExportNames: ["default", "transform"]
	});
	if (!candidate) throw new Error("hook transform module must export a function");
	return candidate;
}
function resolvePath(baseDir, target) {
	if (!target) return node_path.default.resolve(baseDir);
	return node_path.default.isAbsolute(target) ? node_path.default.resolve(target) : node_path.default.resolve(baseDir, target);
}
function escapesBase(baseDir, candidate) {
	const relative = node_path.default.relative(baseDir, candidate);
	return relative === ".." || relative.startsWith(`..${node_path.default.sep}`) || node_path.default.isAbsolute(relative);
}
function safeRealpathSync(candidate) {
	try {
		const nativeRealpath = node_fs.default.realpathSync.native;
		return nativeRealpath ? nativeRealpath(candidate) : node_fs.default.realpathSync(candidate);
	} catch {
		return null;
	}
}
function resolveExistingAncestor(candidate) {
	let current = node_path.default.resolve(candidate);
	while (true) {
		if (node_fs.default.existsSync(current)) return current;
		const parent = node_path.default.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
}
function resolveContainedPath(baseDir, target, label) {
	const base = node_path.default.resolve(baseDir);
	const trimmed = target?.trim();
	if (!trimmed) throw new Error(`${label} module path is required`);
	const resolved = resolvePath(base, trimmed);
	if (escapesBase(base, resolved)) throw new Error(`${label} module path must be within ${base}: ${target}`);
	const baseRealpath = safeRealpathSync(base);
	const existingAncestor = resolveExistingAncestor(resolved);
	const existingAncestorRealpath = existingAncestor ? safeRealpathSync(existingAncestor) : null;
	if (baseRealpath && existingAncestorRealpath && escapesBase(baseRealpath, existingAncestorRealpath)) throw new Error(`${label} module path must be within ${base}: ${target}`);
	return resolved;
}
function resolveOptionalContainedPath(baseDir, target, label) {
	const trimmed = target?.trim();
	if (!trimmed) return node_path.default.resolve(baseDir);
	return resolveContainedPath(baseDir, trimmed, label);
}
function normalizeMatchPath(raw) {
	if (!raw) return;
	const trimmed = raw.trim();
	if (!trimmed) return;
	return trimmed.replace(/^\/+/, "").replace(/\/+$/, "");
}
function renderOptional(value, ctx) {
	if (!value) return;
	const rendered = renderTemplate(value, ctx).trim();
	return rendered ? rendered : void 0;
}
function renderTemplate(template, ctx) {
	if (!template) return "";
	return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
		const value = resolveTemplateExpr(expr.trim(), ctx);
		if (value === void 0 || value === null) return "";
		if (typeof value === "string") return value;
		if (typeof value === "number" || typeof value === "boolean") return String(value);
		return JSON.stringify(value);
	});
}
function resolveTemplateExpr(expr, ctx) {
	if (expr === "path") return ctx.path;
	if (expr === "now") return (/* @__PURE__ */ new Date()).toISOString();
	if (expr.startsWith("headers.")) return getByPath(ctx.headers, expr.slice(8));
	if (expr.startsWith("query.")) return getByPath(Object.fromEntries(ctx.url.searchParams.entries()), expr.slice(6));
	if (expr.startsWith("payload.")) return getByPath(ctx.payload, expr.slice(8));
	return getByPath(ctx.payload, expr);
}
const BLOCKED_PATH_KEYS = /* @__PURE__ */ new Set([
	"__proto__",
	"prototype",
	"constructor"
]);
function getByPath(input, pathExpr) {
	if (!pathExpr) return;
	const parts = [];
	const re = /([^.[\]]+)|(\[(\d+)\])/g;
	let match = re.exec(pathExpr);
	while (match) {
		if (match[1]) parts.push(match[1]);
		else if (match[3]) parts.push(Number(match[3]));
		match = re.exec(pathExpr);
	}
	let current = input;
	for (const part of parts) {
		if (current === null || current === void 0) return;
		if (typeof part === "number") {
			if (!Array.isArray(current)) return;
			current = current[part];
			continue;
		}
		if (BLOCKED_PATH_KEYS.has(part)) return;
		if (typeof current !== "object") return;
		current = current[part];
	}
	return current;
}
//#endregion
//#region src/gateway/hooks.ts
const DEFAULT_HOOKS_PATH = "/hooks";
const DEFAULT_HOOKS_MAX_BODY_BYTES = 256 * 1024;
const MAX_HOOK_IDEMPOTENCY_KEY_LENGTH = 256;
/** Resolve and validate hook config, returning null when hooks are disabled. */
function resolveHooksConfig(cfg) {
	if (cfg.hooks?.enabled !== true) return null;
	const token = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cfg.hooks?.token);
	if (!token) throw new Error("hooks.enabled requires hooks.token");
	const rawPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cfg.hooks?.path) || DEFAULT_HOOKS_PATH;
	const withSlash = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
	const trimmed = withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
	if (trimmed === "/") throw new Error("hooks.path may not be '/'");
	const maxBodyBytes = cfg.hooks?.maxBodyBytes && cfg.hooks.maxBodyBytes > 0 ? cfg.hooks.maxBodyBytes : DEFAULT_HOOKS_MAX_BODY_BYTES;
	const mappings = resolveHookMappings(cfg.hooks);
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const knownAgentIds = resolveKnownAgentIds(cfg, defaultAgentId);
	const allowedAgentIds = require_hooks_policy.resolveAllowedAgentIds(cfg.hooks?.allowedAgentIds);
	const defaultSessionKey = resolveSessionKey(cfg.hooks?.defaultSessionKey);
	const allowedSessionKeyPrefixes = resolveAllowedSessionKeyPrefixes(cfg.hooks?.allowedSessionKeyPrefixes);
	if (defaultSessionKey && allowedSessionKeyPrefixes && !isSessionKeyAllowedByPrefix(defaultSessionKey, allowedSessionKeyPrefixes)) throw new Error("hooks.defaultSessionKey must match hooks.allowedSessionKeyPrefixes");
	if (!defaultSessionKey && allowedSessionKeyPrefixes && !isSessionKeyAllowedByPrefix("hook:example", allowedSessionKeyPrefixes)) throw new Error("hooks.allowedSessionKeyPrefixes must include 'hook:' when hooks.defaultSessionKey is unset");
	if (hasEffectiveTemplatedHookSessionKeyMapping(mappings) && !allowedSessionKeyPrefixes) throw new Error("hooks.allowedSessionKeyPrefixes is required when a hook mapping sessionKey uses templates, even if hooks.allowRequestSessionKey=true");
	return {
		basePath: trimmed,
		token,
		maxBodyBytes,
		mappings,
		agentPolicy: {
			defaultAgentId,
			knownAgentIds,
			allowedAgentIds
		},
		sessionPolicy: {
			defaultSessionKey,
			allowRequestSessionKey: cfg.hooks?.allowRequestSessionKey === true,
			allowedSessionKeyPrefixes
		}
	};
}
function resolveKnownAgentIds(cfg, defaultAgentId) {
	const known = new Set(require_agent_scope_config.listAgentIds(cfg));
	known.add(defaultAgentId);
	return known;
}
function resolveSessionKey(raw) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw);
}
function normalizeSessionKeyPrefix(raw) {
	const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	return value ? value : void 0;
}
function resolveAllowedSessionKeyPrefixes(raw) {
	if (!Array.isArray(raw)) return;
	const set = /* @__PURE__ */ new Set();
	for (const prefix of raw) {
		const normalized = normalizeSessionKeyPrefix(prefix);
		if (!normalized) continue;
		set.add(normalized);
	}
	return set.size > 0 ? Array.from(set) : void 0;
}
/** Check whether a hook session key satisfies the configured prefix allowlist. */
function isSessionKeyAllowedByPrefix(sessionKey, prefixes) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(sessionKey);
	if (!normalized) return false;
	return prefixes.some((prefix) => normalized.startsWith(prefix));
}
/** Extract the hook bearer token from Authorization or x-operator-token headers. */
function extractHookToken(req) {
	const auth = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(req.headers.authorization) ?? "";
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(auth).startsWith("bearer ")) {
		const token = auth.slice(7).trim();
		if (token) return token;
	}
	const headerToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(req.headers["x-operator-token"]) ?? "";
	if (headerToken) return headerToken;
}
/** Read and normalize a hook JSON request body with gateway-friendly error text. */
async function readJsonBody(req, maxBytes) {
	const result = await require_http_body.readJsonBodyWithLimit(req, {
		maxBytes,
		emptyObjectOnEmpty: true
	});
	if (result.ok) return result;
	if (result.code === "PAYLOAD_TOO_LARGE") return {
		ok: false,
		error: "payload too large"
	};
	if (result.code === "REQUEST_BODY_TIMEOUT") return {
		ok: false,
		error: "request body timeout"
	};
	if (result.code === "CONNECTION_CLOSED") return {
		ok: false,
		error: require_http_body.requestBodyErrorToText("CONNECTION_CLOSED")
	};
	return {
		ok: false,
		error: result.error
	};
}
/** Normalize request headers into lowercase string values for hook template matching. */
function normalizeHookHeaders(req) {
	const headers = {};
	for (const [key, value] of Object.entries(req.headers)) {
		const normalizedKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key);
		if (typeof value === "string") headers[normalizedKey] = value;
		else if (Array.isArray(value) && value.length > 0) headers[normalizedKey] = value.join(", ");
	}
	return headers;
}
/** Validate a hook wake payload. */
function normalizeWakePayload(payload) {
	const normalizedText = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.text) ?? "";
	if (!normalizedText) return {
		ok: false,
		error: "text required"
	};
	return {
		ok: true,
		value: {
			text: normalizedText,
			mode: payload.mode === "next-heartbeat" ? "next-heartbeat" : "now"
		}
	};
}
const listHookChannelValues = () => ["last", ...require_registry.listChannelPlugins().map((plugin) => plugin.id)];
/** Channel values accepted by hook agent dispatch. */
const getHookChannelSet = () => new Set(listHookChannelValues());
/** Render the current hook channel validation error from registered channel plugins. */
const getHookChannelError = () => `channel must be ${listHookChannelValues().join("|")}`;
/** Resolve a raw hook channel value, defaulting omitted values to `last`. */
function resolveHookChannel(raw) {
	if (raw === void 0) return "last";
	if (typeof raw !== "string") return null;
	const normalized = require_message_channel_core.normalizeMessageChannel(raw);
	if (!normalized || !getHookChannelSet().has(normalized)) return null;
	return normalized;
}
/** Resolve hook delivery opt-out; any value except false means deliver. */
function resolveHookDeliver(raw) {
	return raw !== false;
}
function resolveOptionalHookIdempotencyKey(raw) {
	if (typeof raw !== "string") return;
	const trimmed = raw.trim();
	if (!trimmed || trimmed.length > MAX_HOOK_IDEMPOTENCY_KEY_LENGTH) return;
	return trimmed;
}
/** Resolve the hook idempotency key from headers or payload within length limits. */
function resolveHookIdempotencyKey(params) {
	return resolveOptionalHookIdempotencyKey(params.headers?.["idempotency-key"]) || resolveOptionalHookIdempotencyKey(params.headers?.["x-operator-idempotency-key"]) || resolveOptionalHookIdempotencyKey(params.payload.idempotencyKey);
}
/** Resolve an optional hook target agent id to a known configured agent. */
function resolveHookTargetAgentId(hooksConfig, agentId) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentId);
	if (!raw) return;
	const normalized = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(raw);
	if (hooksConfig.agentPolicy.knownAgentIds.has(normalized)) return normalized;
	return hooksConfig.agentPolicy.defaultAgentId;
}
/** Resolve the effective hook target agent, falling back to the hook default. */
function resolveEffectiveHookTargetAgentId(hooksConfig, agentId) {
	return resolveHookTargetAgentId(hooksConfig, agentId) ?? hooksConfig.agentPolicy.defaultAgentId;
}
/** Check the hook agent allowlist against the effective target agent. */
function isHookAgentAllowed(hooksConfig, agentId) {
	const allowed = hooksConfig.agentPolicy.allowedAgentIds;
	if (allowed === void 0) return true;
	return allowed.has(resolveEffectiveHookTargetAgentId(hooksConfig, agentId));
}
/** Error message for hook agent allowlist failures. */
const getHookAgentPolicyError = () => "agentId is not allowed by hooks.allowedAgentIds";
const getHookSessionKeyRequestPolicyError = () => "sessionKey is disabled for externally supplied hook payload values; set hooks.allowRequestSessionKey=true to enable";
/** Error message for hook session-key prefix allowlist failures. */
const getHookSessionKeyPrefixError = (prefixes) => `sessionKey must start with one of: ${prefixes.join(", ")}`;
/** Resolve the hook dispatch session key from request, mapping, default, or generated id. */
function resolveHookSessionKey(params) {
	const requested = resolveSessionKey(params.sessionKey);
	if (requested) {
		if ((params.source === "request" || params.source === "mapping-templated") && !params.hooksConfig.sessionPolicy.allowRequestSessionKey) return {
			ok: false,
			error: getHookSessionKeyRequestPolicyError()
		};
		const allowedPrefixes = params.hooksConfig.sessionPolicy.allowedSessionKeyPrefixes;
		if (allowedPrefixes && !isSessionKeyAllowedByPrefix(requested, allowedPrefixes)) return {
			ok: false,
			error: getHookSessionKeyPrefixError(allowedPrefixes)
		};
		return {
			ok: true,
			value: requested
		};
	}
	const defaultSessionKey = params.hooksConfig.sessionPolicy.defaultSessionKey;
	if (defaultSessionKey) return {
		ok: true,
		value: defaultSessionKey
	};
	const generated = `hook:${(params.idFactory ?? node_crypto.randomUUID)()}`;
	const allowedPrefixes = params.hooksConfig.sessionPolicy.allowedSessionKeyPrefixes;
	if (allowedPrefixes && !isSessionKeyAllowedByPrefix(generated, allowedPrefixes)) return {
		ok: false,
		error: getHookSessionKeyPrefixError(allowedPrefixes)
	};
	return {
		ok: true,
		value: generated
	};
}
function hasTemplatedHookSessionKey(sessionKey) {
	return typeof sessionKey === "string" && hasHookTemplateExpressions(sessionKey);
}
function hasEffectiveTemplatedHookSessionKeyMapping(mappings) {
	const effectiveMappings = [];
	for (const mapping of mappings) {
		if (isHookMappingShadowed(mapping, effectiveMappings)) continue;
		effectiveMappings.push(mapping);
		if (mapping.action === "agent" && hasTemplatedHookSessionKey(mapping.sessionKey)) return true;
	}
	return false;
}
function isHookMappingShadowed(mapping, earlierMappings) {
	return earlierMappings.some((earlier) => {
		if (earlier.matchPath && earlier.matchPath !== mapping.matchPath) return false;
		return !earlier.matchSource || earlier.matchSource === mapping.matchSource;
	});
}
/** Re-scope agent-prefixed hook session keys to the selected target agent. */
function normalizeHookDispatchSessionKey(params) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey) ?? "";
	if (!trimmed || !params.targetAgentId) return trimmed;
	const parsed = require_session_key.parseAgentSessionKey(trimmed);
	if (!parsed) return trimmed;
	return `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.targetAgentId)}:${parsed.rest}`;
}
/** Validate and normalize a hook agent payload before policy/session resolution. */
function normalizeAgentPayload(payload) {
	const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.message) ?? "";
	if (!message) return {
		ok: false,
		error: "message required"
	};
	const nameRaw = payload.name;
	const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(nameRaw) ?? "Hook";
	const agentIdRaw = payload.agentId;
	const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentIdRaw);
	const idempotencyKey = resolveOptionalHookIdempotencyKey(payload.idempotencyKey);
	const wakeMode = payload.wakeMode === "next-heartbeat" ? "next-heartbeat" : "now";
	const sessionKeyRaw = payload.sessionKey;
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKeyRaw);
	const channel = resolveHookChannel(payload.channel);
	if (!channel) return {
		ok: false,
		error: getHookChannelError()
	};
	const toRaw = payload.to;
	const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(toRaw);
	const modelRaw = payload.model;
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(modelRaw);
	if (modelRaw !== void 0 && !model) return {
		ok: false,
		error: "model required"
	};
	const deliver = resolveHookDeliver(payload.deliver);
	const thinkingRaw = payload.thinking;
	const thinking = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(thinkingRaw);
	const timeoutRaw = payload.timeoutSeconds;
	return {
		ok: true,
		value: {
			message,
			name,
			agentId,
			idempotencyKey,
			wakeMode,
			sessionKey,
			deliver,
			channel,
			to,
			model,
			thinking,
			timeoutSeconds: typeof timeoutRaw === "number" && Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? Math.floor(timeoutRaw) : void 0
		}
	};
}
//#endregion
Object.defineProperty(exports, "applyHookMappings", {
	enumerable: true,
	get: function() {
		return applyHookMappings;
	}
});
Object.defineProperty(exports, "extractHookToken", {
	enumerable: true,
	get: function() {
		return extractHookToken;
	}
});
Object.defineProperty(exports, "getHookAgentPolicyError", {
	enumerable: true,
	get: function() {
		return getHookAgentPolicyError;
	}
});
Object.defineProperty(exports, "getHookChannelError", {
	enumerable: true,
	get: function() {
		return getHookChannelError;
	}
});
Object.defineProperty(exports, "getHookSessionKeyPrefixError", {
	enumerable: true,
	get: function() {
		return getHookSessionKeyPrefixError;
	}
});
Object.defineProperty(exports, "isHookAgentAllowed", {
	enumerable: true,
	get: function() {
		return isHookAgentAllowed;
	}
});
Object.defineProperty(exports, "isSessionKeyAllowedByPrefix", {
	enumerable: true,
	get: function() {
		return isSessionKeyAllowedByPrefix;
	}
});
Object.defineProperty(exports, "normalizeAgentPayload", {
	enumerable: true,
	get: function() {
		return normalizeAgentPayload;
	}
});
Object.defineProperty(exports, "normalizeHookDispatchSessionKey", {
	enumerable: true,
	get: function() {
		return normalizeHookDispatchSessionKey;
	}
});
Object.defineProperty(exports, "normalizeHookHeaders", {
	enumerable: true,
	get: function() {
		return normalizeHookHeaders;
	}
});
Object.defineProperty(exports, "normalizeWakePayload", {
	enumerable: true,
	get: function() {
		return normalizeWakePayload;
	}
});
Object.defineProperty(exports, "readJsonBody", {
	enumerable: true,
	get: function() {
		return readJsonBody;
	}
});
Object.defineProperty(exports, "resolveEffectiveHookTargetAgentId", {
	enumerable: true,
	get: function() {
		return resolveEffectiveHookTargetAgentId;
	}
});
Object.defineProperty(exports, "resolveHookChannel", {
	enumerable: true,
	get: function() {
		return resolveHookChannel;
	}
});
Object.defineProperty(exports, "resolveHookDeliver", {
	enumerable: true,
	get: function() {
		return resolveHookDeliver;
	}
});
Object.defineProperty(exports, "resolveHookIdempotencyKey", {
	enumerable: true,
	get: function() {
		return resolveHookIdempotencyKey;
	}
});
Object.defineProperty(exports, "resolveHookSessionKey", {
	enumerable: true,
	get: function() {
		return resolveHookSessionKey;
	}
});
Object.defineProperty(exports, "resolveHookTargetAgentId", {
	enumerable: true,
	get: function() {
		return resolveHookTargetAgentId;
	}
});
Object.defineProperty(exports, "resolveHooksConfig", {
	enumerable: true,
	get: function() {
		return resolveHooksConfig;
	}
});
