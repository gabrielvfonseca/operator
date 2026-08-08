const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_stable_stringify = require("./stable-stringify-WjfDEBwS.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_schema = require("./schema-DpZMt4ud.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_migration = require("./migration-ty5IFml7.cjs");
const require_migration_provider_runtime = require("./migration-provider-runtime-BfZcEKfA.cjs");
const require_context = require("./context-BZlEBcHB.cjs");
const require_apply = require("./apply-B8BP96o8.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/plugin-sdk/memory-migration-source.ts
const MAX_MEMORY_MIGRATION_FILE_BYTES = 64 * 1024 * 1024;
/** Bind copyable memory items to the exact source bytes reviewed by an embedded migration UI. */
async function bindMemoryMigrationPlanSources(plan, opts = {}) {
	const items = [];
	for (const item of plan.items) {
		if (item.kind !== "memory" || item.action !== "copy" || item.status !== "planned" && !(opts.includeConflicts && item.status === "conflict") || !item.source) {
			items.push(item);
			continue;
		}
		const { buffer } = await (0, _openclaw_fs_safe_advanced.readRegularFile)({
			filePath: item.source,
			maxBytes: MAX_MEMORY_MIGRATION_FILE_BYTES
		});
		items.push({
			...item,
			sourceRevision: {
				algorithm: "sha256",
				digest: node_crypto.default.createHash("sha256").update(buffer).digest("hex")
			}
		});
	}
	return {
		...plan,
		items
	};
}
//#endregion
//#region src/gateway/server-methods/migrations.ts
const MEMORY_ITEM_KIND = "memory";
const MEMORY_APPLY_DEDUPE_PREFIX = "migrations.memory.apply:";
const activeApplies = /* @__PURE__ */ new Set();
const silentRuntime = {
	log() {},
	error() {},
	exit(code) {
		throw new Error(`migration exited with ${code}`);
	}
};
function emptySummary() {
	return require_migration.summarizeMigrationItems([]);
}
function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
const inFlightMemoryApplies = /* @__PURE__ */ new WeakMap();
function memoryApplyInflightMap(dedupe) {
	let active = inFlightMemoryApplies.get(dedupe);
	if (!active) {
		active = /* @__PURE__ */ new Map();
		inFlightMemoryApplies.set(dedupe, active);
	}
	return active;
}
function memoryApplyRequestFingerprint(params) {
	return require_stable_stringify.stableStringify({
		agentId: params.agentId,
		providerId: params.providerId,
		planFingerprint: params.planFingerprint,
		itemIds: params.itemIds,
		overwrite: params.overwrite === true
	});
}
function isCachedMemoryApply(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	return typeof candidate.requestFingerprint === "string" && candidate.result !== void 0;
}
function memoryProviders(config) {
	require_migration_provider_runtime.ensureStandaloneMigrationProviderRegistryLoaded({ cfg: config });
	return require_migration_provider_runtime.resolvePluginMigrationProviders({ cfg: config }).filter((provider) => provider.supportedItemKinds?.includes(MEMORY_ITEM_KIND));
}
function memoryOnlyPlan(plan) {
	const items = plan.items.filter((item) => item.kind === MEMORY_ITEM_KIND);
	if (items.length > 2e3) throw new Error(`memory import found ${items.length} items; the maximum is ${require_schema.MAX_MEMORY_MIGRATION_ITEMS}. Narrow or split the source memory before importing.`);
	const unsupported = items.find((item) => (item.status === "planned" || item.status === "conflict") && item.action !== "copy");
	if (unsupported) throw new Error(`memory import only supports copy actions; ${unsupported.id} uses ${unsupported.action}`);
	return {
		...plan,
		items,
		summary: require_migration.summarizeMigrationItems(items)
	};
}
function toWireItem(item) {
	return {
		id: item.id,
		status: item.status,
		...item.source ? { source: item.source } : {},
		...item.target ? { target: item.target } : {},
		...item.message !== void 0 ? { message: item.message } : {},
		...item.reason !== void 0 ? { reason: item.reason } : {},
		...item.details !== void 0 ? { details: item.details } : {}
	};
}
function fingerprintMemoryPlan(params) {
	return node_crypto.default.createHash("sha256").update(require_stable_stringify.stableStringify({
		version: 2,
		agentId: params.agentId,
		workspace: params.workspace,
		providerId: params.providerId,
		overwrite: params.overwrite === true,
		plan: {
			source: params.plan.source,
			target: params.plan.target ?? null,
			items: params.plan.items.map((item) => ({
				id: item.id,
				kind: item.kind,
				action: item.action,
				status: item.status,
				source: item.source ?? null,
				target: item.target ?? null,
				reason: item.reason ?? null,
				sensitive: item.sensitive === true,
				sourceRevision: item.sourceRevision ?? null,
				details: item.details ?? null
			}))
		}
	})).digest("hex");
}
function targetAgentOrRespond(rawAgentId, config, respond) {
	if (!(0, _gabrielvfonseca_normalization_core_agent_id.isValidAgentId)(rawAgentId)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid agent id"));
		return;
	}
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(rawAgentId);
	if (!new Set(require_agent_scope_config.listAgentIds(config)).has(agentId)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown agent id"));
		return;
	}
	return agentId;
}
async function planMemoryProvider(params) {
	const base = {
		providerId: params.provider.id,
		label: params.provider.label,
		...params.provider.description ? { description: params.provider.description } : {}
	};
	try {
		const ctx = require_context.buildMigrationContext({
			runtime: silentRuntime,
			configOverride: params.config,
			targetAgentId: params.agentId,
			itemKinds: [MEMORY_ITEM_KIND],
			overwrite: params.overwrite,
			json: true
		});
		const detection = await params.provider.detect?.(ctx);
		if (detection && !detection.found) return {
			...base,
			found: false,
			...detection.source ? { source: detection.source } : {},
			...detection.confidence ? { confidence: detection.confidence } : {},
			...detection.message ? { message: detection.message } : {},
			summary: emptySummary(),
			items: []
		};
		const plan = await bindMemoryMigrationPlanSources(memoryOnlyPlan(await params.provider.plan(ctx)), { includeConflicts: params.overwrite === true });
		const found = plan.items.length > 0;
		const workspace = require_agent_scope_config.resolveAgentWorkspaceDir(params.config, params.agentId);
		return {
			...base,
			found,
			planFingerprint: fingerprintMemoryPlan({
				agentId: params.agentId,
				workspace,
				providerId: params.provider.id,
				overwrite: params.overwrite,
				plan
			}),
			source: plan.source,
			...plan.target ? { target: plan.target } : {},
			...detection?.confidence ? { confidence: detection.confidence } : {},
			...detection?.message ? { message: detection.message } : {},
			summary: plan.summary,
			items: plan.items.map(toWireItem),
			...plan.warnings?.length ? { warnings: plan.warnings } : {}
		};
	} catch (error) {
		return {
			...base,
			found: false,
			error: errorMessage(error),
			summary: emptySummary(),
			items: []
		};
	}
}
function findMemoryProvider(providers, providerId) {
	return providers.find((provider) => provider.id === providerId);
}
const migrationsHandlers = {
	"migrations.memory.plan": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateMigrationsMemoryPlanParams, "migrations.memory.plan", respond)) return;
		const config = context.getRuntimeConfig();
		const agentId = targetAgentOrRespond(params.agentId, config, respond);
		if (!agentId) return;
		const providers = memoryProviders(config);
		const planned = await Promise.all(providers.map(async (provider) => await planMemoryProvider({
			provider,
			config,
			agentId,
			overwrite: params.overwrite
		})));
		respond(true, {
			agentId,
			workspace: require_agent_scope_config.resolveAgentWorkspaceDir(config, agentId),
			providers: planned
		}, void 0);
	},
	"migrations.memory.apply": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateMigrationsMemoryApplyParams, "migrations.memory.apply", respond)) return;
		const config = context.getRuntimeConfig();
		const agentId = targetAgentOrRespond(params.agentId, config, respond);
		if (!agentId) return;
		const requestFingerprint = memoryApplyRequestFingerprint({
			agentId,
			providerId: params.providerId,
			planFingerprint: params.planFingerprint,
			itemIds: params.itemIds,
			overwrite: params.overwrite
		});
		const dedupeKey = `${MEMORY_APPLY_DEDUPE_PREFIX}${params.idempotencyKey}`;
		const cached = context.dedupe.get(dedupeKey);
		if (cached && isCachedMemoryApply(cached.payload)) {
			if (cached.payload.requestFingerprint !== requestFingerprint) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "memory import idempotency key was reused"));
				return;
			}
			respond(true, cached.payload.result, void 0, { cached: true });
			return;
		}
		const provider = findMemoryProvider(memoryProviders(config), params.providerId);
		if (!provider) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown memory migration provider"));
			return;
		}
		const inFlightMap = memoryApplyInflightMap(context.dedupe);
		const inFlight = inFlightMap.get(dedupeKey);
		if (inFlight) {
			if (inFlight.requestFingerprint !== requestFingerprint) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "memory import idempotency key was reused"));
				return;
			}
			const outcome = await inFlight.completion;
			if (outcome.ok) respond(true, outcome.result, void 0, { cached: true });
			else respond(false, void 0, outcome.error, { cached: true });
			return;
		}
		let settle;
		const completion = new Promise((resolve) => {
			settle = resolve;
		});
		inFlightMap.set(dedupeKey, {
			requestFingerprint,
			completion
		});
		const complete = (outcome) => {
			settle(outcome);
			if (outcome.ok) respond(true, outcome.result, void 0);
			else respond(false, void 0, outcome.error);
		};
		const applyKey = `${agentId}:${provider.id}`;
		if (activeApplies.has(applyKey)) {
			complete({
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "memory import already running", {
					retryable: true,
					retryAfterMs: 1e3
				})
			});
			inFlightMap.delete(dedupeKey);
			return;
		}
		activeApplies.add(applyKey);
		try {
			const ctx = require_context.buildMigrationContext({
				runtime: silentRuntime,
				configOverride: config,
				targetAgentId: agentId,
				itemKinds: [MEMORY_ITEM_KIND],
				overwrite: params.overwrite,
				json: true
			});
			const plan = await bindMemoryMigrationPlanSources(memoryOnlyPlan(await provider.plan(ctx)), { includeConflicts: params.overwrite === true });
			if (fingerprintMemoryPlan({
				agentId,
				workspace: require_agent_scope_config.resolveAgentWorkspaceDir(config, agentId),
				providerId: provider.id,
				overwrite: params.overwrite,
				plan
			}) !== params.planFingerprint) {
				complete({
					ok: false,
					error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "memory migration plan changed; refresh the plan before importing")
				});
				return;
			}
			const selectable = new Map(plan.items.filter((item) => item.status === "planned" || item.status === "conflict").map((item) => [item.id, item]));
			const unavailable = params.itemIds.filter((id) => !selectable.has(id));
			if (unavailable.length > 0) {
				complete({
					ok: false,
					error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `memory migration items changed; refresh the plan (${unavailable.join(", ")})`)
				});
				return;
			}
			const selectedConflicts = params.itemIds.filter((id) => selectable.get(id)?.status === "conflict");
			if (!params.overwrite && selectedConflicts.length > 0) {
				complete({
					ok: false,
					error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "selected memory was already imported; enable replacement and refresh the plan")
				});
				return;
			}
			const applied = await require_apply.runMigrationApply({
				runtime: silentRuntime,
				providerId: provider.id,
				provider,
				opts: {
					yes: true,
					json: true,
					configOverride: config,
					targetAgentId: agentId,
					itemKinds: [MEMORY_ITEM_KIND],
					itemIds: params.itemIds,
					overwrite: params.overwrite,
					preflightPlan: plan,
					allowPartialResult: true
				}
			});
			const result = {
				providerId: applied.providerId,
				source: applied.source,
				...applied.target ? { target: applied.target } : {},
				summary: applied.summary,
				items: applied.items.map(toWireItem),
				...applied.warnings?.length ? { warnings: applied.warnings } : {},
				...applied.backupPath ? { backupPath: applied.backupPath } : {},
				...applied.reportDir ? { reportDir: applied.reportDir } : {}
			};
			context.dedupe.set(dedupeKey, {
				ts: Date.now(),
				ok: true,
				payload: {
					requestFingerprint,
					result
				}
			});
			complete({
				ok: true,
				result
			});
		} catch (error) {
			complete({
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, errorMessage(error))
			});
		} finally {
			activeApplies.delete(applyKey);
			inFlightMap.delete(dedupeKey);
		}
	}
};
//#endregion
exports.migrationsHandlers = migrationsHandlers;
