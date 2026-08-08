require("./rolldown-runtime-u92d-OFm.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_model_overrides = require("./model-overrides-BvSxD3wH.cjs");
const require_session_snapshot_merge = require("./session-snapshot-merge-BloJoO_g.cjs");
const require_model_selection_directive = require("./model-selection-directive-C1YcJtB9.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/session-reset-model.ts
/** Applies model override tokens embedded in reset/new command text. */
function splitBody(body) {
	const tokens = body.split(/\s+/).filter(Boolean);
	return {
		tokens,
		first: tokens[0],
		second: tokens[1],
		rest: tokens.slice(2)
	};
}
async function loadResetModelCatalog(cfg) {
	const { loadModelCatalog } = await Promise.resolve().then(() => require("./model-catalog-BFgB2-Jk.cjs")).then((n) => n.model_catalog_exports);
	return loadModelCatalog({ config: cfg });
}
async function resolveResetFallbackModels(params) {
	if (params.agentId) {
		const { resolveAgentModelFallbacksOverride } = await Promise.resolve().then(() => require("./agent-scope-Ce0XqMNr.cjs")).then((n) => n.agent_scope_exports);
		const override = resolveAgentModelFallbacksOverride(params.cfg, params.agentId);
		if (override !== void 0) return override;
	}
	return require_model_input.resolveAgentModelFallbackValues(params.cfg.agents?.defaults?.model);
}
async function buildResetAllowedModelKeys(params) {
	if (Object.keys(params.cfg.agents?.defaults?.models ?? {}).length > 0 || params.cfg.models?.providers) return require_model_selection_shared.buildAllowedModelSetWithFallbacks(params).allowedKeys;
	const allowedKeys = /* @__PURE__ */ new Set();
	for (const entry of params.catalog) allowedKeys.add(require_model_input.modelKey(entry.provider, entry.id));
	const defaultModel = params.defaultModel?.trim();
	if (defaultModel) allowedKeys.add(require_model_input.modelKey((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.defaultProvider), defaultModel));
	return allowedKeys;
}
function buildSelectionFromExplicit(params) {
	const resolved = require_model_selection_directive.resolveModelRefFromDirectiveString({
		raw: params.raw,
		defaultProvider: params.defaultProvider,
		aliasIndex: params.aliasIndex
	});
	if (!resolved) return;
	const key = require_model_input.modelKey(resolved.ref.provider, resolved.ref.model);
	if (params.allowedModelKeys.size > 0 && !require_model_selection_shared.isModelKeyAllowedBySet(params.allowedModelKeys, key)) return;
	const isDefault = resolved.ref.provider === params.defaultProvider && resolved.ref.model === params.defaultModel;
	return {
		provider: resolved.ref.provider,
		model: resolved.ref.model,
		isDefault,
		...resolved.alias ? { alias: resolved.alias } : void 0
	};
}
async function applySelectionToSession(params) {
	const { selection, sessionEntryHandle, sessionStore, sessionKey, storePath } = params;
	const sessionEntry = sessionEntryHandle?.getCurrent() ?? params.sessionEntry;
	if (!sessionEntry || !sessionKey) return true;
	const initialSessionEntry = { ...sessionEntry };
	const nextSessionEntry = { ...sessionEntry };
	require_model_overrides.applyModelOverrideToSessionEntry({
		entry: nextSessionEntry,
		selection
	});
	let appliedEntry = nextSessionEntry;
	let selectionApplied = true;
	if (storePath) {
		const { persistReplySessionEntry } = await Promise.resolve().then(() => require("./session-entry-persistence-CBNb94X1.cjs")).then((n) => n.session_entry_persistence_exports);
		const persistence = await persistReplySessionEntry({
			storePath,
			sessionKey,
			initialEntry: initialSessionEntry,
			entry: nextSessionEntry,
			touchedFields: require_session_snapshot_merge.SESSION_MODEL_OVERRIDE_TRANSACTION_FIELDS
		});
		if (persistence.status === "lifecycle-invalidated") throw new require_lifecycle.SessionWorkStartInvalidatedError(persistence.error);
		const persistedEntry = persistence.entry;
		appliedEntry = persistedEntry;
		selectionApplied = require_session_snapshot_merge.sessionModelOverrideChangesApplied({
			initial: initialSessionEntry,
			next: nextSessionEntry,
			current: persistedEntry
		});
	}
	require_session_snapshot_merge.adoptPersistedSessionSnapshot(sessionEntry, appliedEntry);
	if (sessionEntryHandle) sessionEntryHandle.replaceCurrent(sessionEntry);
	else if (sessionStore) sessionStore[sessionKey] = sessionEntry;
	return selectionApplied;
}
/** Applies a model override embedded in a reset command body. */
/** Applies a valid reset model override to session state and returns the cleaned body. */
async function applyResetModelOverride(params) {
	if (!params.resetTriggered) return {};
	const rawBody = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.bodyStripped);
	if (!rawBody) return {};
	const { tokens, first, second } = splitBody(rawBody);
	if (!first) return {};
	const catalog = params.modelCatalog ?? await loadResetModelCatalog(params.cfg);
	const allowedModelKeys = await buildResetAllowedModelKeys({
		cfg: params.cfg,
		catalog,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		fallbackModels: await resolveResetFallbackModels({
			cfg: params.cfg,
			agentId: params.agentId
		})
	});
	if (allowedModelKeys.size === 0) return {};
	const providers = /* @__PURE__ */ new Set();
	for (const key of allowedModelKeys) {
		const slash = key.indexOf("/");
		if (slash <= 0) continue;
		providers.add((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(key.slice(0, slash)));
	}
	const resolveSelection = (raw) => require_model_selection_directive.resolveModelDirectiveSelection({
		raw,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		aliasIndex: params.aliasIndex,
		allowedModelKeys
	});
	let selection;
	let consumed = 0;
	if (providers.has((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(first)) && second) {
		const resolved = resolveSelection(`${(0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(first)}/${second}`);
		if (resolved.selection) {
			selection = resolved.selection;
			consumed = 2;
		}
	}
	if (!selection) {
		selection = buildSelectionFromExplicit({
			raw: first,
			defaultProvider: params.defaultProvider,
			defaultModel: params.defaultModel,
			aliasIndex: params.aliasIndex,
			allowedModelKeys
		});
		if (selection) consumed = 1;
	}
	if (!selection) {
		const resolved = resolveSelection(first);
		if (providers.has((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(first)) || first.trim().length >= 6) {
			selection = resolved.selection;
			if (selection) consumed = 1;
		}
	}
	if (!selection) return {};
	const cleanedBody = tokens.slice(consumed).join(" ").trim();
	params.sessionCtx.BodyStripped = cleanedBody;
	params.sessionCtx.BodyForCommands = cleanedBody;
	return {
		selection: await applySelectionToSession({
			selection,
			sessionEntry: params.sessionEntry,
			sessionEntryHandle: params.sessionEntryHandle,
			sessionStore: params.sessionStore,
			sessionKey: params.sessionKey,
			storePath: params.storePath
		}) ? selection : void 0,
		cleanedBody
	};
}
//#endregion
exports.applyResetModelOverride = applyResetModelOverride;
