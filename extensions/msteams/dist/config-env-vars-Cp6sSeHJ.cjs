const require_version = require("./version-B8VHpWoT.cjs");
const require_semver = require("./semver-CcnjzT8W.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_env_substitution = require("./env-substitution-CP7V8_Ov.cjs");
const require_host_env_security = require("./host-env-security-DTRiezH-.cjs");
let semver = require("semver");
//#region src/config/version.ts
/** Parses stable, prerelease, and legacy dot-beta Operator versions. */
function parseOperatorVersion(raw) {
	if (!raw) return null;
	return (0, semver.parse)(require_semver.normalizeLegacyDotBetaVersion(raw.trim()));
}
function normalizeOperatorVersionBase(raw) {
	const parsed = parseOperatorVersion(raw);
	if (!parsed) return null;
	return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}
function compareOperatorVersions(a, b) {
	const parsedA = parseOperatorVersion(a);
	const parsedB = parseOperatorVersion(b);
	if (!parsedA || !parsedB) return null;
	return require_semver.compareOperatorSemver(parsedA, parsedB);
}
function shouldWarnOnTouchedVersion(current, touched) {
	const parsedCurrent = parseOperatorVersion(current);
	const parsedTouched = parseOperatorVersion(touched);
	if (parsedCurrent && parsedTouched && parsedCurrent.compareMain(parsedTouched) === 0) {
		if (parsedTouched.prerelease.length === 0 || require_semver.isOperatorCorrectionSemver(parsedTouched)) return false;
	}
	return parsedCurrent !== null && parsedTouched !== null ? require_semver.compareOperatorSemver(parsedCurrent, parsedTouched) < 0 : false;
}
//#endregion
//#region src/config/future-version-guard.ts
/** Override env var for intentional older-binary destructive config actions. */
const ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS_ENV = "OPERATOR_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS";
function allowOlderBinaryDestructiveActions(env) {
	const raw = env[ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS_ENV]?.trim().toLowerCase();
	return raw === "1" || raw === "true" || raw === "yes";
}
function resolveTouchedVersion(params) {
	return params.snapshot?.sourceConfig?.meta?.lastTouchedVersion?.trim() || params.snapshot?.config?.meta?.lastTouchedVersion?.trim() || params.config?.meta?.lastTouchedVersion?.trim() || null;
}
/** Resolves whether a destructive action should be blocked by future config metadata. */
function resolveFutureConfigActionBlock(params) {
	if (allowOlderBinaryDestructiveActions(params.env ?? process.env)) return null;
	const currentVersion = params.currentVersion ?? require_version.VERSION;
	const touchedVersion = resolveTouchedVersion(params);
	if (!touchedVersion || !shouldWarnOnTouchedVersion(currentVersion, touchedVersion)) return null;
	return {
		action: params.action,
		currentVersion,
		touchedVersion,
		message: `Refusing to ${params.action} because this Operator binary (${currentVersion}) is older than the config last written by Operator ${touchedVersion}.`,
		hints: ["Run the newer operator binary on PATH, or reinstall the intended gateway service from the newer install.", `Set ${ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS_ENV}=1 only for an intentional downgrade or recovery action.`]
	};
}
/** Formats a future-config action block for CLI/service error output. */
function formatFutureConfigActionBlock(block) {
	return [block.message, ...block.hints].join("\n");
}
//#endregion
//#region src/config/config-env-vars.ts
function isBlockedConfigEnvVar(key) {
	return key.toUpperCase() === "OPERATOR_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS" || key.toUpperCase() === "OPERATOR_INCLUDE_ROOTS" || require_host_env_security.isDangerousHostEnvVarName(key) || require_host_env_security.isDangerousHostEnvOverrideVarName(key);
}
/** Returns whether a config-controlled environment entry is safe to apply at runtime. */
function isConfigRuntimeEnvVarAllowed(key, value) {
	return Boolean(value.trim()) && !isBlockedConfigEnvVar(key) && !require_env_substitution.containsEnvVarReference(value);
}
function collectConfigEnvVarsByTarget(cfg) {
	const envConfig = cfg?.env;
	if (!envConfig) return {};
	const entries = {};
	if (envConfig.vars) for (const [rawKey, value] of Object.entries(envConfig.vars)) {
		if (typeof value !== "string" || !value.trim()) continue;
		const key = require_host_env_security.normalizeEnvVarKey(rawKey, { portable: true });
		if (!key) continue;
		if (!isConfigRuntimeEnvVarAllowed(key, value)) continue;
		entries[key] = value;
	}
	for (const [rawKey, value] of Object.entries(envConfig)) {
		if (rawKey === "shellEnv" || rawKey === "vars") continue;
		if (typeof value !== "string" || !value.trim()) continue;
		const key = require_host_env_security.normalizeEnvVarKey(rawKey, { portable: true });
		if (!key) continue;
		if (!isConfigRuntimeEnvVarAllowed(key, value)) continue;
		entries[key] = value;
	}
	return entries;
}
function findCaseInsensitiveEnvKey(env, key) {
	if (Object.hasOwn(env, key)) return key;
	const upperKey = key.toUpperCase();
	return Object.keys(env).find((candidate) => candidate.toUpperCase() === upperKey);
}
function envSnapshotKey(key) {
	return process.platform === "win32" ? key.toUpperCase() : key;
}
function snapshotEnvByPlatformKey(env) {
	const snapshot = /* @__PURE__ */ new Map();
	for (const [key, value] of Object.entries(env)) {
		const platformKey = envSnapshotKey(key);
		if (!snapshot.has(platformKey)) snapshot.set(platformKey, {
			key,
			value
		});
	}
	return snapshot;
}
function envSnapshotEntriesEqual(left, right) {
	return left?.key === right?.key && left?.value === right?.value;
}
function replaceEnvSnapshotEntry(env, current, next) {
	if (current) delete env[current.key];
	if (next?.value !== void 0) env[next.key] = next.value;
}
function cloneEnvWithPlatformSemantics(env) {
	const cloned = { ...env };
	if (process.platform !== "win32") return cloned;
	return new Proxy(cloned, {
		deleteProperty(target, property) {
			if (typeof property !== "string") return Reflect.deleteProperty(target, property);
			const key = findCaseInsensitiveEnvKey(target, property);
			return key ? Reflect.deleteProperty(target, key) : true;
		},
		get(target, property, receiver) {
			if (typeof property !== "string") return Reflect.get(target, property, receiver);
			const key = findCaseInsensitiveEnvKey(target, property);
			return key ? target[key] : Reflect.get(target, property, receiver);
		},
		getOwnPropertyDescriptor(target, property) {
			if (typeof property !== "string") return Reflect.getOwnPropertyDescriptor(target, property);
			const key = findCaseInsensitiveEnvKey(target, property);
			if (!key) return;
			return {
				configurable: true,
				enumerable: true,
				value: target[key],
				writable: true
			};
		},
		has(target, property) {
			return typeof property === "string" ? findCaseInsensitiveEnvKey(target, property) !== void 0 : Reflect.has(target, property);
		},
		set(target, property, value) {
			if (typeof property !== "string") return Reflect.set(target, property, value);
			target[findCaseInsensitiveEnvKey(target, property) ?? property] = value;
			return true;
		}
	});
}
/** Collects config env vars safe to inject into runtime process environments. */
function collectConfigRuntimeEnvVars(cfg) {
	return collectConfigEnvVarsByTarget(cfg);
}
/** Collects config env vars safe to persist into managed service environments. */
function collectConfigServiceEnvVars(cfg) {
	return collectConfigEnvVarsByTarget(cfg);
}
/** Builds a cloned environment with config env vars applied without mutating the base env. */
function createConfigRuntimeEnv(cfg, baseEnv = process.env) {
	const env = cloneEnvWithPlatformSemantics(baseEnv);
	applyConfigEnvVars(cfg, env);
	return env;
}
let publishedConfigRuntimeEnvState = {
	generation: 0,
	ownedEnv: {},
	sourceConfig: null
};
let publishedConfigRuntimeEnvEpoch = 0;
let pendingConfigRuntimeEnvPublication = null;
function applyPublishedConfigRuntimeEnvRollback(publication) {
	for (const [key, change] of publication.changes) {
		const currentEntry = snapshotEnvByPlatformKey(process.env).get(key);
		if (!envSnapshotEntriesEqual(currentEntry, change.after)) continue;
		replaceEnvSnapshotEntry(process.env, currentEntry, change.before);
	}
	publishedConfigRuntimeEnvState = {
		generation: publishedConfigRuntimeEnvState.generation + 1,
		ownedEnv: publication.previousState.ownedEnv,
		sourceConfig: publication.previousState.sourceConfig
	};
}
function isPendingConfigRuntimeEnvPublication(publication) {
	let current = pendingConfigRuntimeEnvPublication;
	while (current) {
		if (current === publication) return true;
		current = current.previous;
	}
	return false;
}
function unwindRequestedConfigRuntimeEnvPublications() {
	while (pendingConfigRuntimeEnvPublication?.rollbackRequested) {
		const publication = pendingConfigRuntimeEnvPublication;
		applyPublishedConfigRuntimeEnvRollback(publication);
		const previous = publication.previous;
		if (!previous || previous.committed) {
			pendingConfigRuntimeEnvPublication = null;
			return;
		}
		pendingConfigRuntimeEnvPublication = previous;
	}
}
function getPublishedConfigRuntimeEnvState() {
	return publishedConfigRuntimeEnvState;
}
function collectConfigRuntimeEnvOwnership(sourceConfig, before, after, options = {}) {
	const ownedEnv = {};
	const replacedLowerPrecedenceKeys = new Set((options.replacedLowerPrecedenceKeys ?? []).map(envSnapshotKey));
	for (const [key, value] of Object.entries(collectConfigRuntimeEnvVars(sourceConfig))) for (const normalizedKey of require_env.resolveEnvNormalizationKeys(key)) {
		const afterKey = findCaseInsensitiveEnvKey(after, normalizedKey);
		if (!afterKey || after[afterKey] !== value) continue;
		const beforeKey = findCaseInsensitiveEnvKey(before, normalizedKey);
		if (beforeKey && before[beforeKey] === value && !replacedLowerPrecedenceKeys.has(envSnapshotKey(afterKey))) continue;
		ownedEnv[afterKey] = value;
	}
	return ownedEnv;
}
function filterConfigRuntimeEnvOwnership(sourceConfig, env, ownedEnv) {
	const allowedValues = /* @__PURE__ */ new Map();
	for (const [key, value] of Object.entries(collectConfigRuntimeEnvVars(sourceConfig))) for (const normalizedKey of require_env.resolveEnvNormalizationKeys(key)) {
		const values = allowedValues.get(normalizedKey) ?? /* @__PURE__ */ new Set();
		values.add(value);
		allowedValues.set(normalizedKey, values);
	}
	const filtered = {};
	for (const [key, value] of Object.entries(ownedEnv)) {
		const normalizedKey = require_env.resolveEnvNormalizationKeys(key)[0] ?? key;
		const actualKey = findCaseInsensitiveEnvKey(env, key);
		if (actualKey && env[actualKey] === value && allowedValues.get(normalizedKey)?.has(value)) filtered[actualKey] = value;
	}
	return filtered;
}
function initializePublishedConfigRuntimeEnv(sourceConfig, options = {}) {
	const ownedEnv = filterConfigRuntimeEnvOwnership(sourceConfig, process.env, options.preserveExistingOwnership ? {
		...publishedConfigRuntimeEnvState.ownedEnv,
		...options.ownedEnv
	} : options.ownedEnv ?? {});
	publishedConfigRuntimeEnvState = {
		generation: publishedConfigRuntimeEnvState.generation + 1,
		ownedEnv,
		sourceConfig
	};
	publishedConfigRuntimeEnvEpoch += 1;
	pendingConfigRuntimeEnvPublication = null;
}
function resetPublishedConfigRuntimeEnv() {
	publishedConfigRuntimeEnvState = {
		generation: 0,
		ownedEnv: {},
		sourceConfig: null
	};
	publishedConfigRuntimeEnvEpoch += 1;
	pendingConfigRuntimeEnvPublication = null;
}
/** Removes the active config-owned layer from an isolated read environment. */
function createConfigRuntimeEnvBase(activeConfig, env = process.env, options = {}) {
	const isolated = cloneEnvWithPlatformSemantics(env);
	const ownedEnv = filterConfigRuntimeEnvOwnership(activeConfig, env, options.ownedEnv ?? (env === process.env ? publishedConfigRuntimeEnvState.ownedEnv : {}));
	for (const [key, ownedValue] of Object.entries(ownedEnv)) {
		if (options.preservedKeys?.has(key.toUpperCase())) continue;
		if (isolated[key] === ownedValue) delete isolated[key];
	}
	return isolated;
}
/** Prepares a config-owned env layer without mutating the live process. */
function prepareConfigRuntimeEnv(params) {
	const targetEnv = params.env ?? process.env;
	const before = snapshotEnvByPlatformKey(targetEnv);
	const preparedEnv = createConfigRuntimeEnvBase(params.previousConfig, targetEnv, params.previousOwnedEnv ? { ownedEnv: params.previousOwnedEnv } : {});
	const base = { ...preparedEnv };
	applyConfigEnvVars(params.nextConfig, preparedEnv);
	const after = { ...preparedEnv };
	const afterByPlatformKey = snapshotEnvByPlatformKey(after);
	const preparedOwnedEnv = collectConfigRuntimeEnvOwnership(params.nextConfig, base, after);
	return {
		env: preparedEnv,
		publish: () => {
			const processPublication = targetEnv === process.env;
			const previousPublishedState = publishedConfigRuntimeEnvState;
			const previousPublication = processPublication ? pendingConfigRuntimeEnvPublication : null;
			const published = /* @__PURE__ */ new Map();
			const keys = /* @__PURE__ */ new Set([
				...before.keys(),
				...afterByPlatformKey.keys(),
				...previousPublication?.changes.keys() ?? []
			]);
			for (const key of keys) {
				const beforeEntry = before.get(key);
				const afterEntry = afterByPlatformKey.get(key);
				const currentEntry = snapshotEnvByPlatformKey(targetEnv).get(key);
				const previousChange = previousPublication?.changes.get(key);
				const continuesPreviousPublication = previousChange !== void 0 && envSnapshotEntriesEqual(currentEntry, previousChange.after) && envSnapshotEntriesEqual(beforeEntry, previousChange.preparedBefore);
				const appliesToPreparedSnapshot = !envSnapshotEntriesEqual(beforeEntry, afterEntry) && envSnapshotEntriesEqual(currentEntry, beforeEntry);
				if (!continuesPreviousPublication && !appliesToPreparedSnapshot) continue;
				published.set(key, {
					before: currentEntry,
					after: afterEntry,
					preparedBefore: beforeEntry
				});
				if (!envSnapshotEntriesEqual(currentEntry, afterEntry)) replaceEnvSnapshotEntry(targetEnv, currentEntry, afterEntry);
			}
			const publicationGeneration = processPublication ? publishedConfigRuntimeEnvState.generation + 1 : null;
			const publicationEpoch = publishedConfigRuntimeEnvEpoch;
			let processPublicationState = null;
			if (publicationGeneration !== null) {
				const ownedEnv = {};
				for (const [key, value] of Object.entries(preparedOwnedEnv)) {
					const platformKey = envSnapshotKey(key);
					const currentEntry = snapshotEnvByPlatformKey(targetEnv).get(platformKey);
					const preparedEntry = afterByPlatformKey.get(platformKey);
					const previousOwnedKey = findCaseInsensitiveEnvKey(previousPublishedState.ownedEnv, key);
					if (currentEntry?.value === value && envSnapshotEntriesEqual(currentEntry, preparedEntry) && (published.has(platformKey) || previousOwnedKey !== void 0 && previousPublishedState.ownedEnv[previousOwnedKey] === value)) ownedEnv[currentEntry.key] = value;
				}
				publishedConfigRuntimeEnvState = {
					generation: publicationGeneration,
					ownedEnv,
					sourceConfig: params.nextConfig
				};
				processPublicationState = {
					epoch: publicationEpoch,
					previous: previousPublication,
					previousState: previousPublishedState,
					changes: published,
					committed: false,
					rollbackRequested: false
				};
				pendingConfigRuntimeEnvPublication = processPublicationState;
			}
			let active = true;
			const rollback = (() => {
				if (!active) return;
				active = false;
				if (processPublicationState) {
					if (processPublicationState.epoch !== publishedConfigRuntimeEnvEpoch) return;
					processPublicationState.rollbackRequested = true;
					if (!isPendingConfigRuntimeEnvPublication(processPublicationState)) return;
					unwindRequestedConfigRuntimeEnvPublications();
					return;
				}
				for (const [key, publication] of published) {
					const currentEntry = snapshotEnvByPlatformKey(targetEnv).get(key);
					if (!envSnapshotEntriesEqual(currentEntry, publication.after)) continue;
					replaceEnvSnapshotEntry(targetEnv, currentEntry, publication.before);
				}
			});
			rollback.commit = () => {
				if (!active) return;
				active = false;
				if (!processPublicationState) return;
				processPublicationState.committed = true;
				processPublicationState.rollbackRequested = false;
				processPublicationState.previous = null;
				if (pendingConfigRuntimeEnvPublication === processPublicationState) pendingConfigRuntimeEnvPublication = null;
			};
			return rollback;
		}
	};
}
/** Applies config env vars to an environment without overwriting existing non-empty values. */
function applyConfigEnvVars(cfg, env = process.env, options = {}) {
	const entries = collectConfigRuntimeEnvVars(cfg);
	const lowerPrecedenceEntries = Object.entries(options.lowerPrecedenceEnv ?? {});
	const normalizeKey = (key) => process.platform === "win32" ? key.toUpperCase() : key;
	const lowerPrecedenceEnv = new Map(lowerPrecedenceEntries.map(([key, value]) => [normalizeKey(key), value]));
	const configEnvKeys = require_env.expandEnvNormalizationKeys(Object.keys(entries));
	const configValuesByKey = /* @__PURE__ */ new Map();
	for (const [key, value] of Object.entries(entries)) for (const normalizedKey of require_env.resolveEnvNormalizationKeys(key)) {
		const values = configValuesByKey.get(normalizedKey) ?? /* @__PURE__ */ new Set();
		values.add(value);
		configValuesByKey.set(normalizedKey, values);
	}
	const higherPrecedenceValues = /* @__PURE__ */ new Map();
	for (const key of Object.keys(entries)) {
		const normalizedKeys = require_env.resolveEnvNormalizationKeys(key);
		const winningValue = normalizedKeys.map((normalizedKey) => [normalizedKey, env[normalizedKey]]).find(([normalizedKey, currentValue]) => currentValue?.trim() && lowerPrecedenceEnv.get(normalizedKey) !== currentValue && !configValuesByKey.get(normalizedKey)?.has(currentValue))?.[1];
		if (winningValue !== void 0) for (const normalizedKey of normalizedKeys) higherPrecedenceValues.set(normalizedKey, winningValue);
	}
	const replacedLowerPrecedenceKeys = [];
	for (const [key, value] of lowerPrecedenceEntries) if (configEnvKeys.has(normalizeKey(key)) && env[key] === value) {
		delete env[key];
		replacedLowerPrecedenceKeys.push(key);
	}
	if (replacedLowerPrecedenceKeys.length > 0) options.onLowerPrecedenceKeysReplaced?.(replacedLowerPrecedenceKeys);
	for (const [key, value] of Object.entries(entries)) {
		const higherPrecedenceValue = higherPrecedenceValues.get(normalizeKey(key));
		if (higherPrecedenceValue !== void 0) {
			env[key] = higherPrecedenceValue;
			continue;
		}
		const currentValue = env[key];
		if (currentValue?.trim() && lowerPrecedenceEnv.get(normalizeKey(key)) !== currentValue) continue;
		if (require_env_substitution.containsEnvVarReference(value)) continue;
		env[key] = value;
	}
	require_env.normalizeZaiEnv(env);
}
//#endregion
Object.defineProperty(exports, "ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS_ENV", {
	enumerable: true,
	get: function() {
		return ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS_ENV;
	}
});
Object.defineProperty(exports, "applyConfigEnvVars", {
	enumerable: true,
	get: function() {
		return applyConfigEnvVars;
	}
});
Object.defineProperty(exports, "cloneEnvWithPlatformSemantics", {
	enumerable: true,
	get: function() {
		return cloneEnvWithPlatformSemantics;
	}
});
Object.defineProperty(exports, "collectConfigRuntimeEnvOwnership", {
	enumerable: true,
	get: function() {
		return collectConfigRuntimeEnvOwnership;
	}
});
Object.defineProperty(exports, "collectConfigRuntimeEnvVars", {
	enumerable: true,
	get: function() {
		return collectConfigRuntimeEnvVars;
	}
});
Object.defineProperty(exports, "collectConfigServiceEnvVars", {
	enumerable: true,
	get: function() {
		return collectConfigServiceEnvVars;
	}
});
Object.defineProperty(exports, "compareOperatorVersions", {
	enumerable: true,
	get: function() {
		return compareOperatorVersions;
	}
});
Object.defineProperty(exports, "createConfigRuntimeEnv", {
	enumerable: true,
	get: function() {
		return createConfigRuntimeEnv;
	}
});
Object.defineProperty(exports, "createConfigRuntimeEnvBase", {
	enumerable: true,
	get: function() {
		return createConfigRuntimeEnvBase;
	}
});
Object.defineProperty(exports, "formatFutureConfigActionBlock", {
	enumerable: true,
	get: function() {
		return formatFutureConfigActionBlock;
	}
});
Object.defineProperty(exports, "getPublishedConfigRuntimeEnvState", {
	enumerable: true,
	get: function() {
		return getPublishedConfigRuntimeEnvState;
	}
});
Object.defineProperty(exports, "initializePublishedConfigRuntimeEnv", {
	enumerable: true,
	get: function() {
		return initializePublishedConfigRuntimeEnv;
	}
});
Object.defineProperty(exports, "normalizeOperatorVersionBase", {
	enumerable: true,
	get: function() {
		return normalizeOperatorVersionBase;
	}
});
Object.defineProperty(exports, "prepareConfigRuntimeEnv", {
	enumerable: true,
	get: function() {
		return prepareConfigRuntimeEnv;
	}
});
Object.defineProperty(exports, "resetPublishedConfigRuntimeEnv", {
	enumerable: true,
	get: function() {
		return resetPublishedConfigRuntimeEnv;
	}
});
Object.defineProperty(exports, "resolveFutureConfigActionBlock", {
	enumerable: true,
	get: function() {
		return resolveFutureConfigActionBlock;
	}
});
Object.defineProperty(exports, "shouldWarnOnTouchedVersion", {
	enumerable: true,
	get: function() {
		return shouldWarnOnTouchedVersion;
	}
});
