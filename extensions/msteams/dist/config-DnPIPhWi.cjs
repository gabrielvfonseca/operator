require("./rolldown-runtime-u92d-OFm.cjs");
const require_plain_object = require("./plain-object-CITRo0uW.cjs");
const require_zod_schema_core = require("./zod-schema.core-B7xBEBon.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_config = require("./config-DT0qiglW.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_delivery_info = require("./delivery-info-DRjJZi5w.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_auth_resolve = require("./auth-resolve-DoTr3pVp.cjs");
const require_runtime_state = require("./runtime-state-kSoytkKT.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_redact_snapshot = require("./redact-snapshot-CmW094US.cjs");
require("./auth-DnGY7_cY.cjs");
const require_schema = require("./schema-DYOb_hMY.cjs");
const require_runtime_schema = require("./runtime-schema-8V3DG-Kf.cjs");
const require_restart_sentinel = require("./restart-sentinel-BH8dJFkM.cjs");
const require_restart = require("./restart-sBMxYOWJ.cjs");
const require_config_diff = require("./config-diff-H8SBw0bH.cjs");
const require_config_reload_plan = require("./config-reload-plan-Br2Lvuc3.cjs");
const require_config_reload_settings = require("./config-reload-settings-DfutOn_X.cjs");
const require_control_plane_audit = require("./control-plane-audit-OJXxLDr7.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_runtime = require("./runtime-Cmn4mgbi.cjs");
const require_base_hash = require("./base-hash-CZrec982.cjs");
const require_restart_request = require("./restart-request-_nAvloh8.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let node_util = require("node:util");
//#region src/config/patch-replace-paths.ts
function normalizeConfigPatchReplacePath(value) {
	const trimmed = value.trim();
	if (trimmed.endsWith("[]")) return trimmed.slice(0, -2).replace(/\[\d+\](?=\.)/g, "[]");
	return trimmed.replace(/\[\d+\](?=\.)/g, "[]");
}
function normalizeConfigPatchReplacePaths(values) {
	if (!values) return /* @__PURE__ */ new Set();
	return new Set(values.filter((value) => typeof value === "string").map(normalizeConfigPatchReplacePath).filter((value) => value.length > 0));
}
//#endregion
//#region src/gateway/config-get-response.ts
function createConfigGetResponse(snapshot, uiHints) {
	return {
		...require_redact_snapshot.redactConfigSnapshot(snapshot, uiHints),
		configRevisionHash: require_runtime_snapshot.hashRuntimeConfigValue(snapshot.sourceConfig),
		appliedConfigHash: require_runtime_snapshot.getRuntimeConfigAppliedHash()
	};
}
//#endregion
//#region src/gateway/server-methods/config-write-flow.ts
/** Resolves the on-disk config path used in config method responses. */
function resolveGatewayConfigPath(snapshot) {
	return snapshot?.path ?? require_io.createConfigIO().configPath;
}
function normalizeStringListForAuthCompare(items) {
	return [...items ?? []].toSorted();
}
function normalizeTrustedProxyAuthForCompare(auth) {
	return {
		userHeader: auth.trustedProxy?.userHeader,
		requiredHeaders: normalizeStringListForAuthCompare(auth.trustedProxy?.requiredHeaders),
		allowUsers: normalizeStringListForAuthCompare(auth.trustedProxy?.allowUsers),
		allowLoopback: auth.trustedProxy?.allowLoopback
	};
}
/** Compares the effective shared Gateway auth surface that active clients use. */
function didSharedGatewayAuthChange(prev, next) {
	const prevResolvedAuth = require_auth_resolve.resolveGatewayAuth({
		authConfig: prev.gateway?.auth,
		env: process.env,
		tailscaleMode: prev.gateway?.tailscale?.mode
	});
	const nextResolvedAuth = require_auth_resolve.resolveGatewayAuth({
		authConfig: next.gateway?.auth,
		env: process.env,
		tailscaleMode: next.gateway?.tailscale?.mode
	});
	if (prevResolvedAuth.mode === "trusted-proxy" || nextResolvedAuth.mode === "trusted-proxy") {
		if (prevResolvedAuth.mode !== nextResolvedAuth.mode) return true;
		return !(0, node_util.isDeepStrictEqual)(normalizeTrustedProxyAuthForCompare(prevResolvedAuth), normalizeTrustedProxyAuthForCompare(nextResolvedAuth)) || !(0, node_util.isDeepStrictEqual)(normalizeStringListForAuthCompare(prev.gateway?.trustedProxies), normalizeStringListForAuthCompare(next.gateway?.trustedProxies));
	}
	const prevAuth = require_auth_resolve.resolveEffectiveSharedGatewayAuth({
		authConfig: prev.gateway?.auth,
		env: process.env,
		tailscaleMode: prev.gateway?.tailscale?.mode
	});
	const nextAuth = require_auth_resolve.resolveEffectiveSharedGatewayAuth({
		authConfig: next.gateway?.auth,
		env: process.env,
		tailscaleMode: next.gateway?.tailscale?.mode
	});
	if (prevAuth === null || nextAuth === null) return prevAuth !== nextAuth;
	return prevAuth.mode !== nextAuth.mode || !(0, node_util.isDeepStrictEqual)(prevAuth.secret, nextAuth.secret);
}
/** Compares against the active secrets-expanded config when one is available. */
function didActiveSharedGatewayAuthChange(params) {
	return didSharedGatewayAuthChange(require_runtime_state.getActiveSecretsRuntimeSnapshot()?.config ?? params.fallbackPrev, params.next);
}
function queueSharedGatewayAuthDisconnect(shouldDisconnect, context) {
	if (!shouldDisconnect) return;
	queueMicrotask(() => {
		context?.disconnectClientsUsingSharedGatewayAuth?.();
	});
}
function queueSharedGatewayAuthGenerationRefresh(shouldRefresh, nextConfig, context) {
	if (!shouldRefresh) return;
	queueMicrotask(() => {
		context?.enforceSharedGatewayAuthGenerationForConfigWrite?.(nextConfig);
	});
}
function isNoopConfigReloadPlan(plan) {
	return !plan.restartGateway && plan.hotReasons.length === 0 && !plan.reloadHooks && !plan.restartGmailWatcher && !plan.restartCron && !plan.restartHeartbeat && !plan.restartHealthMonitor && !plan.reloadPlugins && !plan.disposeMcpRuntimes && plan.restartChannels.size === 0;
}
function resolveConfigRestartRequirement(params) {
	const reloadSettings = require_config_reload_settings.resolveGatewayReloadSettings(params.nextConfig);
	const plan = require_config_reload_plan.buildGatewayReloadPlan(params.changedPaths);
	if (isNoopConfigReloadPlan(plan)) return {
		requiresRestart: false,
		scheduleDirectRestart: false
	};
	if (reloadSettings.mode === "off") return {
		requiresRestart: true,
		scheduleDirectRestart: true
	};
	if (reloadSettings.mode === "restart") return {
		requiresRestart: true,
		scheduleDirectRestart: false
	};
	if (plan.restartGateway) return {
		requiresRestart: true,
		scheduleDirectRestart: reloadSettings.mode === "hot"
	};
	return {
		requiresRestart: false,
		scheduleDirectRestart: false
	};
}
function resolveConfigRestartRequest(params) {
	const { sessionKey, deliveryContext: requestedDeliveryContext, threadId: requestedThreadId, note, restartDelayMs } = require_restart_request.parseRestartRequestParams(params);
	const { deliveryContext: sessionDeliveryContext, threadId: sessionThreadId } = require_delivery_info.extractDeliveryInfo(sessionKey);
	return {
		sessionKey,
		note,
		restartDelayMs,
		deliveryContext: requestedDeliveryContext ?? sessionDeliveryContext,
		threadId: requestedThreadId ?? sessionThreadId
	};
}
function buildConfigRestartSentinelPayload(params) {
	return {
		kind: params.kind,
		status: "ok",
		ts: Date.now(),
		sessionKey: params.sessionKey,
		deliveryContext: params.deliveryContext,
		threadId: params.threadId,
		message: params.note ?? null,
		doctorHint: require_restart_sentinel.formatDoctorNonInteractiveHint(),
		stats: {
			mode: params.mode,
			root: params.configPath,
			requiresRestart: params.requiresRestart
		}
	};
}
async function tryWriteRestartSentinelPayload(payload) {
	try {
		await require_restart_sentinel.writeRestartSentinel(payload);
		return true;
	} catch {
		return false;
	}
}
/** Persists a gateway config write and returns follow-up work that must run after response. */
async function commitGatewayConfigWrite(params) {
	const result = await require_config.replaceConfigFile({
		nextConfig: params.nextConfig,
		writeOptions: {
			...params.writeOptions,
			runtimeRefresh: {
				...params.writeOptions.runtimeRefresh,
				includeAuthStoreRefs: false
			}
		},
		afterWrite: { mode: "auto" }
	});
	return {
		path: resolveGatewayConfigPath(params.snapshot),
		config: result.nextConfig,
		hash: result.persistedHash,
		queueFollowUp: () => {
			queueSharedGatewayAuthGenerationRefresh(true, result.nextConfig, params.context);
			queueSharedGatewayAuthDisconnect(Boolean(params.disconnectSharedAuthClients), params.context);
		}
	};
}
/** Builds restart sentinel/queue state for config.patch and config.apply writes. */
async function resolveGatewayConfigRestartWriteResult(params) {
	const { sessionKey, note, restartDelayMs, deliveryContext, threadId } = resolveConfigRestartRequest(params.requestParams);
	const restartRequirement = resolveConfigRestartRequirement({
		changedPaths: params.changedPaths,
		nextConfig: params.nextConfig
	});
	const payload = buildConfigRestartSentinelPayload({
		kind: params.kind,
		mode: params.mode,
		configPath: params.configPath,
		requiresRestart: restartRequirement.requiresRestart,
		sessionKey,
		deliveryContext,
		threadId,
		note
	});
	const sentinelPersisted = await tryWriteRestartSentinelPayload(payload);
	const restart = restartRequirement.scheduleDirectRestart ? require_restart.scheduleGatewaySigusr1Restart({
		delayMs: restartDelayMs,
		reason: params.mode,
		audit: {
			actor: params.actor.actor,
			deviceId: params.actor.deviceId,
			clientIp: params.actor.clientIp,
			changedPaths: params.changedPaths
		}
	}) : void 0;
	if (restart?.coalesced) params.context?.logGateway?.warn(`${params.mode} restart coalesced ${require_control_plane_audit.formatControlPlaneActor(params.actor)} delayMs=${restart.delayMs}`);
	return {
		payload,
		sentinelPersisted,
		restart
	};
}
//#endregion
//#region src/gateway/server-methods/config.ts
const MAX_CONFIG_ISSUES_IN_ERROR_MESSAGE = 3;
const CONFIG_SCHEMA_RESPONSE_CACHE_TTL_MS = 5e3;
let configSchemaResponseCache = null;
function requireConfigBaseHash(params, snapshot, respond) {
	if (!snapshot.exists) return true;
	const snapshotHash = require_io.resolveConfigSnapshotHash(snapshot);
	if (!snapshotHash) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "config base hash unavailable; re-run config.get and retry"));
		return false;
	}
	const baseHash = require_base_hash.resolveBaseHashParam(params);
	if (!baseHash) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "config base hash required; re-run config.get and retry"));
		return false;
	}
	if (baseHash !== snapshotHash) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "config changed since last load; re-run config.get and retry"));
		return false;
	}
	return true;
}
function formatConfigPatchPath(parentPath, key) {
	return parentPath ? `${parentPath}.${key}` : key;
}
function readConfigPatchReplacePaths(params) {
	const rawPaths = params.replacePaths;
	return normalizeConfigPatchReplacePaths(Array.isArray(rawPaths) ? rawPaths : void 0);
}
function collectDestructiveArrayPatchPaths(params) {
	if (!require_plain_object.isPlainObject(params.patch) || !require_plain_object.isPlainObject(params.base)) return [];
	const merged = require_plain_object.isPlainObject(params.merged) ? params.merged : {};
	const paths = [];
	for (const [key, patchValue] of Object.entries(params.patch)) {
		const path = formatConfigPatchPath(params.path ?? "", key);
		if (!require_io.isMergePatchObjectKeyAllowed(key, params.path)) continue;
		const baseValue = params.base[key];
		const mergedValue = merged[key];
		if (Array.isArray(baseValue)) {
			if (patchValue === null || !Array.isArray(patchValue)) {
				paths.push(path);
				continue;
			}
			if (Array.isArray(mergedValue)) {
				if (isConfigPatchIdKeyedArray(baseValue)) {
					if (!idKeyedArrayPreservesBaseIds(baseValue, mergedValue)) {
						paths.push(path);
						continue;
					}
					paths.push(...collectDestructiveIdKeyedArrayEntryPatchPaths({
						base: baseValue,
						patch: patchValue,
						merged: mergedValue,
						path
					}));
				} else if (!arrayPreservesBaseEntries(baseValue, mergedValue)) {
					paths.push(path);
					continue;
				}
			}
		} else if (require_plain_object.isPlainObject(baseValue) && !require_plain_object.isPlainObject(patchValue)) {
			paths.push(...collectBaseArrayPaths(baseValue, path));
			continue;
		}
		if (require_plain_object.isPlainObject(patchValue)) paths.push(...collectDestructiveArrayPatchPaths({
			base: baseValue,
			patch: patchValue,
			merged: mergedValue,
			path
		}));
	}
	return paths;
}
function collectBaseArrayPaths(base, path) {
	if (Array.isArray(base)) return [path];
	if (!require_plain_object.isPlainObject(base)) return [];
	const paths = [];
	for (const [key, value] of Object.entries(base)) {
		const childPath = formatConfigPatchPath(path, key);
		if (!require_io.isMergePatchObjectKeyAllowed(key, path)) continue;
		paths.push(...collectBaseArrayPaths(value, childPath));
	}
	return paths;
}
function isConfigPatchObjectWithStringId(value) {
	return require_plain_object.isPlainObject(value) && typeof value.id === "string" && value.id.length > 0;
}
function isConfigPatchIdKeyedArray(value) {
	return value.every(isConfigPatchObjectWithStringId);
}
function idKeyedArrayPreservesBaseIds(base, merged) {
	const mergedIds = new Set(merged.filter(isConfigPatchObjectWithStringId).map((entry) => entry.id));
	return base.every((entry) => mergedIds.has(entry.id));
}
function arrayPreservesBaseEntries(base, merged) {
	const unmatchedMerged = [...merged];
	for (const baseEntry of base) {
		const matchIndex = unmatchedMerged.findIndex((mergedEntry) => (0, node_util.isDeepStrictEqual)(mergedEntry, baseEntry));
		if (matchIndex === -1) return false;
		unmatchedMerged.splice(matchIndex, 1);
	}
	return true;
}
function collectDestructiveIdKeyedArrayEntryPatchPaths(params) {
	if (!isConfigPatchIdKeyedArray(params.base)) return [];
	const baseById = new Map(params.base.map((entry) => [entry.id, entry]));
	const mergedById = new Map(params.merged.filter(isConfigPatchObjectWithStringId).map((entry) => [entry.id, entry]));
	const paths = [];
	for (const patchEntry of params.patch) {
		if (!isConfigPatchObjectWithStringId(patchEntry)) continue;
		const baseEntry = baseById.get(patchEntry.id);
		const mergedEntry = mergedById.get(patchEntry.id);
		if (!baseEntry || !mergedEntry) continue;
		paths.push(...collectDestructiveArrayPatchPaths({
			base: baseEntry,
			patch: patchEntry,
			merged: mergedEntry,
			path: `${params.path}[]`
		}));
	}
	return paths;
}
function rejectDestructiveArrayPatchWithoutIntent(params) {
	const unconfirmedPaths = collectDestructiveArrayPatchPaths({
		base: params.currentConfig,
		patch: params.patch,
		merged: params.mergedConfig
	}).filter((path) => !params.replacePaths.has(path));
	if (unconfirmedPaths.length === 0) return false;
	params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `config.patch would remove entries from array path(s): ${unconfirmedPaths.join(", ")}. Pass replacePaths with the exact path(s) when this is intentional, or use config.apply for full-config replacement.`));
	return true;
}
async function readConfigWriteSnapshotOrRespond(params, respond) {
	const result = await require_io.readConfigFileSnapshotForWrite();
	if (!requireConfigBaseHash(params, result.snapshot, respond)) return null;
	return result;
}
function parseRawConfigOrRespond(params, requestName, respond) {
	const rawValue = params.raw;
	if (typeof rawValue !== "string") {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid ${requestName} params: raw (string) required`));
		return null;
	}
	return rawValue;
}
function sanitizeLookupPathForLog(path) {
	const sanitized = Array.from(path, (char) => {
		const code = char.charCodeAt(0);
		return code < 32 || code === 127 ? "?" : char;
	}).join("");
	return sanitized.length > 120 ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(sanitized, 117)}...` : sanitized;
}
function escapePowerShellSingleQuotedString(value) {
	return value.replaceAll("'", "''");
}
function resolveConfigOpenCommand(configPath, platform = process.platform) {
	if (platform === "win32") return {
		command: "powershell.exe",
		args: [
			"-NoProfile",
			"-NonInteractive",
			"-Command",
			`Start-Process -FilePath '${escapePowerShellSingleQuotedString(configPath)}'`
		]
	};
	return {
		command: platform === "darwin" ? "open" : "xdg-open",
		args: [configPath]
	};
}
async function execConfigOpenCommand(command) {
	await require_exec.runExec(command.command, command.args, { logOutput: false });
}
function formatConfigOpenError(error) {
	if (typeof error === "object" && error && "message" in error && typeof error.message === "string") return error.message;
	return String(error);
}
function hasOwnRecordValue(value, key) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && Object.hasOwn(value, key);
}
function stripBundledProviderRuntimeDefaults(params) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.candidate)) return params.candidate;
	const models = params.candidate.models;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(models) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(models.providers)) return params.candidate;
	const sourceModels = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.sourceConfig) ? params.sourceConfig.models : void 0;
	const sourceProviders = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(sourceModels) ? sourceModels.providers : void 0;
	let nextProviders;
	for (const [providerId, provider] of Object.entries(models.providers)) {
		if (!require_zod_schema_core.isBuiltInModelProviderOverlayId(providerId) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(provider)) continue;
		const sourceProvider = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(sourceProviders) ? sourceProviders[providerId] : void 0;
		let nextProvider;
		if (provider.baseUrl === "" && !hasOwnRecordValue(sourceProvider, "baseUrl")) {
			nextProvider = { ...provider };
			delete nextProvider.baseUrl;
		}
		if (Array.isArray(provider.models) && provider.models.length === 0 && !hasOwnRecordValue(sourceProvider, "models")) {
			nextProvider ??= { ...provider };
			delete nextProvider.models;
		}
		if (nextProvider) {
			nextProviders ??= { ...models.providers };
			nextProviders[providerId] = nextProvider;
		}
	}
	if (!nextProviders) return params.candidate;
	return {
		...params.candidate,
		models: {
			...models,
			providers: nextProviders
		}
	};
}
function parseValidateConfigFromRawOrRespond(params, requestName, snapshot, respond) {
	const rawValue = parseRawConfigOrRespond(params, requestName, respond);
	if (!rawValue) return null;
	const parsedRes = require_io.parseConfigJson5(rawValue);
	if (!parsedRes.ok) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, parsedRes.error));
		return null;
	}
	const schema = loadSchemaWithPlugins();
	const restored = require_redact_snapshot.restoreRedactedValues(parsedRes.parsed, snapshot.config, schema.uiHints);
	if (!restored.ok) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, restored.humanReadableMessage ?? "invalid config"));
		return null;
	}
	const validationCandidate = stripBundledProviderRuntimeDefaults({
		candidate: snapshot.valid ? require_io.applyMergePatch(require_io.projectSourceOntoRuntimeShape(snapshot.resolved, snapshot.config), require_io.createMergePatch(snapshot.config, restored.result)) : restored.result,
		sourceConfig: snapshot.sourceConfig
	});
	const sourceValidated = require_io.validateConfigObjectRawWithPlugins(validationCandidate);
	if (!sourceValidated.ok) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, summarizeConfigValidationIssues(sourceValidated.issues), { details: { issues: sourceValidated.issues } }));
		return null;
	}
	const validated = require_io.validateConfigObjectWithPlugins(validationCandidate);
	if (!validated.ok) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, summarizeConfigValidationIssues(validated.issues), { details: { issues: validated.issues } }));
		return null;
	}
	return {
		config: validated.config,
		writeConfig: validationCandidate,
		schema
	};
}
function summarizeConfigValidationIssues(issues) {
	const lines = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(require_io.formatConfigIssueLines(issues.slice(0, MAX_CONFIG_ISSUES_IN_ERROR_MESSAGE), "", { normalizeRoot: true }));
	if (lines.length === 0) return "invalid config";
	const hiddenCount = Math.max(0, issues.length - lines.length);
	return `invalid config: ${lines.join("; ")}${hiddenCount > 0 ? ` (+${hiddenCount} more issue${hiddenCount === 1 ? "" : "s"})` : ""}`;
}
async function ensureResolvableSecretRefsOrRespond(params) {
	try {
		return await require_runtime.prepareSecretsRuntimeSnapshot({
			config: params.config,
			includeAuthStoreRefs: false
		});
	} catch (error) {
		const details = require_errors.formatErrorMessage(error);
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid config: active SecretRef resolution failed (${details})`));
		return null;
	}
}
function clearConfigSchemaResponseCacheForTests() {
	configSchemaResponseCache = null;
}
function loadConfigSchemaResponseForTests() {
	return loadSchemaWithPlugins();
}
function clearConfigSchemaResponseCache() {
	configSchemaResponseCache = null;
}
async function respondWithConfigRestartWrite(params) {
	clearConfigSchemaResponseCache();
	const { payload, sentinelPersisted, restart } = await resolveGatewayConfigRestartWriteResult({
		requestParams: params.requestParams,
		kind: params.kind,
		mode: params.mode,
		configPath: params.writeResult.path,
		changedPaths: params.changedPaths,
		nextConfig: params.writeResult.config,
		actor: params.actor,
		context: params.context
	});
	params.respond(true, {
		ok: true,
		path: params.writeResult.path,
		...params.writeResult.hash ? { hash: params.writeResult.hash } : {},
		config: require_redact_snapshot.redactConfigObject(params.writeResult.config, params.uiHints),
		restart,
		sentinel: {
			persisted: sentinelPersisted,
			payload
		}
	}, void 0);
	params.writeResult.queueFollowUp();
}
function shouldDisconnectSharedAuthClientsForConfigWrite(params) {
	return didSharedGatewayAuthChange(params.prevConfig, params.nextConfig) || didActiveSharedGatewayAuthChange({
		fallbackPrev: params.prevConfig,
		next: params.preparedSecretsSnapshot.config
	});
}
function respondConfigPatchNoop(params) {
	params.context?.logGateway?.info(`config.patch noop ${require_control_plane_audit.formatControlPlaneActor(params.actor)} (no changed paths)`);
	params.respond(true, {
		ok: true,
		noop: true,
		path: resolveGatewayConfigPath(params.snapshot),
		config: require_redact_snapshot.redactConfigObject(params.config, params.uiHints)
	}, void 0);
}
function loadSchemaWithPlugins() {
	const now = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(Date.now());
	const cachedExpiresAt = configSchemaResponseCache === null ? void 0 : (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(configSchemaResponseCache.expiresAtMs);
	if (configSchemaResponseCache && now !== void 0 && cachedExpiresAt !== void 0 && cachedExpiresAt > now) return configSchemaResponseCache.response;
	if (configSchemaResponseCache) configSchemaResponseCache = null;
	const response = require_runtime_schema.loadGatewayRuntimeConfigSchema();
	const expiresAtMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(CONFIG_SCHEMA_RESPONSE_CACHE_TTL_MS);
	if (expiresAtMs !== void 0) configSchemaResponseCache = {
		expiresAtMs,
		response
	};
	return response;
}
const configHandlers = {
	"config.get": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validateConfigGetParams, "config.get", respond)) return;
		respond(true, createConfigGetResponse(await require_io.readConfigFileSnapshot(), loadSchemaWithPlugins().uiHints), void 0);
	},
	"config.schema": ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validateConfigSchemaParams, "config.schema", respond)) return;
		respond(true, loadSchemaWithPlugins(), void 0);
	},
	"config.schema.lookup": ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateConfigSchemaLookupParams, "config.schema.lookup", respond)) return;
		const path = params.path;
		const result = require_schema.lookupConfigSchema(loadSchemaWithPlugins(), path, require_config_reload_plan.resolveConfigReloadMetadata);
		if (!result) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "config schema path not found"));
			return;
		}
		if (!require_src.validateConfigSchemaLookupResult(result)) {
			const errors = require_src.validateConfigSchemaLookupResult.errors ?? [];
			context.logGateway.warn(`config.schema.lookup produced invalid payload for ${sanitizeLookupPathForLog(path)}: ${require_validation_errors.formatValidationErrors(errors)}`);
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "config.schema.lookup returned invalid payload", { details: { errors } }));
			return;
		}
		respond(true, result, void 0);
	},
	"config.set": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateConfigSetParams, "config.set", respond)) return;
		const writeSnapshot = await readConfigWriteSnapshotOrRespond(params, respond);
		if (!writeSnapshot) return;
		const { snapshot, writeOptions } = writeSnapshot;
		const parsed = parseValidateConfigFromRawOrRespond(params, "config.set", snapshot, respond);
		if (!parsed) return;
		if (!await ensureResolvableSecretRefsOrRespond({
			config: parsed.config,
			respond
		})) return;
		const writeResult = await commitGatewayConfigWrite({
			snapshot,
			writeOptions,
			nextConfig: parsed.writeConfig,
			context
		});
		clearConfigSchemaResponseCache();
		respond(true, {
			ok: true,
			path: writeResult.path,
			...writeResult.hash ? { hash: writeResult.hash } : {},
			config: require_redact_snapshot.redactConfigObject(writeResult.config, parsed.schema.uiHints)
		}, void 0);
		writeResult.queueFollowUp();
	},
	"config.patch": async ({ params, respond, client, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateConfigPatchParams, "config.patch", respond)) return;
		const writeSnapshot = await readConfigWriteSnapshotOrRespond(params, respond);
		if (!writeSnapshot) return;
		const { snapshot, writeOptions } = writeSnapshot;
		if (!snapshot.valid) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid config; fix before patching"));
			return;
		}
		const rawValue = params.raw;
		if (typeof rawValue !== "string") {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid config.patch params: raw (string) required"));
			return;
		}
		const parsedRes = require_io.parseConfigJson5(rawValue);
		if (!parsedRes.ok) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, parsedRes.error));
			return;
		}
		if (!parsedRes.parsed || typeof parsedRes.parsed !== "object" || Array.isArray(parsedRes.parsed)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "config.patch raw must be an object"));
			return;
		}
		const replacePaths = readConfigPatchReplacePaths(params);
		const merged = require_io.applyMergePatch(snapshot.config, parsedRes.parsed, {
			mergeObjectArraysById: true,
			replaceArrayPaths: replacePaths
		});
		const schemaPatch = loadSchemaWithPlugins();
		const restoredMerge = require_redact_snapshot.restoreRedactedValues(merged, snapshot.config, schemaPatch.uiHints);
		if (!restoredMerge.ok) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, restoredMerge.humanReadableMessage ?? "invalid config"));
			return;
		}
		if (rejectDestructiveArrayPatchWithoutIntent({
			currentConfig: snapshot.config,
			mergedConfig: restoredMerge.result,
			patch: parsedRes.parsed,
			replacePaths,
			respond
		})) return;
		const restoredChangedPaths = require_config_diff.diffConfigPaths(snapshot.config, restoredMerge.result);
		const actor = require_control_plane_audit.resolveControlPlaneActor(client);
		if (restoredChangedPaths.length === 0) {
			respondConfigPatchNoop({
				snapshot,
				config: snapshot.config,
				uiHints: schemaPatch.uiHints,
				actor,
				context,
				respond
			});
			return;
		}
		const validationCandidate = stripBundledProviderRuntimeDefaults({
			candidate: restoredMerge.result,
			sourceConfig: snapshot.sourceConfig
		});
		const sourceValidated = require_io.validateConfigObjectRawWithPlugins(validationCandidate);
		if (!sourceValidated.ok) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, summarizeConfigValidationIssues(sourceValidated.issues), { details: { issues: sourceValidated.issues } }));
			return;
		}
		const writeConfig = validationCandidate;
		const validated = require_io.validateConfigObjectWithPlugins(validationCandidate);
		if (!validated.ok) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, summarizeConfigValidationIssues(validated.issues), { details: { issues: validated.issues } }));
			return;
		}
		const preparedSecretsSnapshot = await ensureResolvableSecretRefsOrRespond({
			config: validated.config,
			respond
		});
		if (!preparedSecretsSnapshot) return;
		const changedPaths = require_config_diff.diffConfigPaths(snapshot.config, validated.config);
		if (changedPaths.length === 0) {
			respondConfigPatchNoop({
				snapshot,
				config: validated.config,
				uiHints: schemaPatch.uiHints,
				actor,
				context,
				respond
			});
			return;
		}
		context?.logGateway?.info(`config.patch write ${require_control_plane_audit.formatControlPlaneActor(actor)} changedPaths=${require_control_plane_audit.summarizeChangedPaths(changedPaths)} restartReason=config.patch`);
		await respondWithConfigRestartWrite({
			requestParams: params,
			kind: "config-patch",
			mode: "config.patch",
			writeResult: await commitGatewayConfigWrite({
				snapshot,
				writeOptions,
				nextConfig: writeConfig,
				context,
				disconnectSharedAuthClients: shouldDisconnectSharedAuthClientsForConfigWrite({
					prevConfig: snapshot.config,
					nextConfig: validated.config,
					preparedSecretsSnapshot
				})
			}),
			changedPaths,
			actor,
			context,
			respond,
			uiHints: schemaPatch.uiHints
		});
	},
	"config.apply": async ({ params, respond, client, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateConfigApplyParams, "config.apply", respond)) return;
		const writeSnapshot = await readConfigWriteSnapshotOrRespond(params, respond);
		if (!writeSnapshot) return;
		const { snapshot, writeOptions } = writeSnapshot;
		const parsed = parseValidateConfigFromRawOrRespond(params, "config.apply", snapshot, respond);
		if (!parsed) return;
		const preparedSecretsSnapshot = await ensureResolvableSecretRefsOrRespond({
			config: parsed.config,
			respond
		});
		if (!preparedSecretsSnapshot) return;
		const changedPaths = require_config_diff.diffConfigPaths(snapshot.config, parsed.config);
		const actor = require_control_plane_audit.resolveControlPlaneActor(client);
		context?.logGateway?.info(`config.apply write ${require_control_plane_audit.formatControlPlaneActor(actor)} changedPaths=${require_control_plane_audit.summarizeChangedPaths(changedPaths)} restartReason=config.apply`);
		const disconnectSharedAuthClients = shouldDisconnectSharedAuthClientsForConfigWrite({
			prevConfig: snapshot.config,
			nextConfig: parsed.config,
			preparedSecretsSnapshot
		});
		await respondWithConfigRestartWrite({
			requestParams: params,
			kind: "config-apply",
			mode: "config.apply",
			writeResult: await commitGatewayConfigWrite({
				snapshot,
				writeOptions,
				nextConfig: parsed.writeConfig,
				context,
				disconnectSharedAuthClients
			}),
			changedPaths,
			actor,
			context,
			respond,
			uiHints: parsed.schema.uiHints
		});
	},
	"config.openFile": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateConfigGetParams, "config.openFile", respond)) return;
		const configPath = require_io.createConfigIO().configPath;
		try {
			await execConfigOpenCommand(resolveConfigOpenCommand(configPath));
			respond(true, {
				ok: true,
				path: configPath
			}, void 0);
		} catch (error) {
			const errorMessage = formatConfigOpenError(error);
			const detailedError = errorMessage.includes("xdg-open") && errorMessage.includes("no method available") ? `Cannot open file in headless environment. File path: ${configPath}. This environment appears to lack a graphical or terminal browser handler.` : `Failed to open config file: ${errorMessage}`;
			context?.logGateway?.warn(`config.openFile failed path=${sanitizeLookupPathForLog(configPath)}: ${errorMessage}`);
			respond(true, {
				ok: false,
				path: configPath,
				error: detailedError
			}, void 0);
		}
	}
};
//#endregion
exports.clearConfigSchemaResponseCacheForTests = clearConfigSchemaResponseCacheForTests;
exports.configHandlers = configHandlers;
exports.loadConfigSchemaResponseForTests = loadConfigSchemaResponseForTests;
exports.resolveConfigOpenCommand = resolveConfigOpenCommand;
