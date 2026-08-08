const require_path_array_index = require("./path-array-index-C9RRFl-Q.cjs");
const require_bundled_plugin_metadata = require("./bundled-plugin-metadata-h4MVizJT.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_shared = require("./shared-Bt0YEZDW.cjs");
const require_path_utils = require("./path-utils-B5Jty5Fz.cjs");
const require_channel_contract_api = require("./channel-contract-api-nZGOrZ_f.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/secrets/target-registry-data.ts
const SECRET_INPUT_SHAPE = "secret_input";
const SIBLING_REF_SHAPE = "sibling_ref";
const WEB_PROVIDER_SECRET_CONFIGS = [{
	contract: "webSearchProviders",
	configPath: "webSearch.apiKey"
}, {
	contract: "webFetchProviders",
	configPath: "webFetch.apiKey"
}];
function createPluginOperatorConfigSecretTargetEntry(pluginId, configPath) {
	const pathPattern = [
		"plugins",
		"entries",
		pluginId,
		"config",
		...configPath.split(".")
	].join(".");
	return {
		id: pathPattern,
		targetType: pathPattern,
		configFile: "operator.json",
		pathPattern,
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	};
}
function hasSensitiveConfigHint(plugin, configPath) {
	return plugin.configUiHints?.[configPath]?.sensitive === true;
}
function hasWebProviderContract(plugin, contract) {
	return (plugin.contracts?.[contract]?.length ?? 0) > 0;
}
function listBundledWebProviderSecretTargetRegistryEntries(bundledPlugins) {
	const entries = [];
	for (const record of bundledPlugins) for (const config of WEB_PROVIDER_SECRET_CONFIGS) if (hasWebProviderContract(record, config.contract) && hasSensitiveConfigHint(record, config.configPath)) entries.push(createPluginOperatorConfigSecretTargetEntry(record.id, config.configPath));
	return entries.toSorted((left, right) => left.id.localeCompare(right.id));
}
function listBundledPluginConfigSecretTargetRegistryEntries(bundledPlugins) {
	const entries = [];
	const seen = /* @__PURE__ */ new Set();
	for (const record of bundledPlugins) {
		const secretInputs = record.configContracts?.secretInputs?.paths ?? [];
		for (const secretInput of secretInputs) {
			const entry = createPluginOperatorConfigSecretTargetEntry(record.id, secretInput.path);
			const key = `${entry.configFile}:${entry.pathPattern}`;
			if (seen.has(key)) continue;
			seen.add(key);
			entries.push(entry);
		}
	}
	return entries.toSorted((left, right) => left.id.localeCompare(right.id));
}
function listSourceBundledPluginConfigContractRecords() {
	return require_bundled_plugin_metadata.listBundledPluginMetadata({
		includeChannelConfigs: false,
		includeSyntheticChannelConfigs: false
	}).flatMap((metadata) => metadata.manifest.configContracts ? [{
		id: metadata.manifest.id,
		configContracts: metadata.manifest.configContracts
	}] : []);
}
function listChannelSecretTargetRegistryEntries(channelPlugins) {
	const entries = [];
	for (const record of channelPlugins) {
		if (record.channels.length === 0) continue;
		try {
			const contractApi = require_channel_contract_api.loadChannelSecretContractApiForRecord(record);
			entries.push(...contractApi?.secretTargetRegistryEntries ?? []);
		} catch {}
	}
	return entries;
}
const CORE_SECRET_TARGET_REGISTRY = [
	{
		id: "auth-profiles.api_key.key",
		targetType: "auth-profiles.api_key.key",
		configFile: "auth-profiles.json",
		pathPattern: "profiles.*.key",
		refPathPattern: "profiles.*.keyRef",
		secretShape: SIBLING_REF_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		authProfileType: "api_key"
	},
	{
		id: "auth-profiles.token.token",
		targetType: "auth-profiles.token.token",
		configFile: "auth-profiles.json",
		pathPattern: "profiles.*.token",
		refPathPattern: "profiles.*.tokenRef",
		secretShape: SIBLING_REF_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		authProfileType: "token"
	},
	{
		id: "agents.defaults.memorySearch.remote.apiKey",
		targetType: "agents.defaults.memorySearch.remote.apiKey",
		configFile: "operator.json",
		pathPattern: "agents.defaults.memorySearch.remote.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	},
	{
		id: "agents.list[].memorySearch.remote.apiKey",
		targetType: "agents.list[].memorySearch.remote.apiKey",
		configFile: "operator.json",
		pathPattern: "agents.list[].memorySearch.remote.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	},
	{
		id: "cron.webhookToken",
		targetType: "cron.webhookToken",
		configFile: "operator.json",
		pathPattern: "cron.webhookToken",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	},
	{
		id: "gateway.auth.token",
		targetType: "gateway.auth.token",
		configFile: "operator.json",
		pathPattern: "gateway.auth.token",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	},
	{
		id: "gateway.auth.password",
		targetType: "gateway.auth.password",
		configFile: "operator.json",
		pathPattern: "gateway.auth.password",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	},
	{
		id: "gateway.remote.password",
		targetType: "gateway.remote.password",
		configFile: "operator.json",
		pathPattern: "gateway.remote.password",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	},
	{
		id: "gateway.remote.token",
		targetType: "gateway.remote.token",
		configFile: "operator.json",
		pathPattern: "gateway.remote.token",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	},
	{
		id: "messages.tts.providers.*.apiKey",
		targetType: "messages.tts.providers.*.apiKey",
		configFile: "operator.json",
		pathPattern: "messages.tts.providers.*.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 3
	},
	{
		id: "agents.list[].tts.providers.*.apiKey",
		targetType: "agents.list[].tts.providers.*.apiKey",
		configFile: "operator.json",
		pathPattern: "agents.list[].tts.providers.*.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: false,
		includeInAudit: true,
		providerIdPathSegmentIndex: 4
	},
	{
		id: "models.providers.*.apiKey",
		targetType: "models.providers.apiKey",
		targetTypeAliases: ["models.providers.*.apiKey"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2,
		trackProviderShadowing: true
	},
	{
		id: "models.providers.*.headers.*",
		targetType: "models.providers.headers",
		targetTypeAliases: ["models.providers.*.headers.*"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.headers.*",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.headers.*",
		targetType: "models.providers.request.headers",
		targetTypeAliases: ["models.providers.*.request.headers.*"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.headers.*",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.auth.token",
		targetType: "models.providers.request.auth.token",
		targetTypeAliases: ["models.providers.*.request.auth.token"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.auth.token",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.auth.value",
		targetType: "models.providers.request.auth.value",
		targetTypeAliases: ["models.providers.*.request.auth.value"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.auth.value",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.proxy.tls.ca",
		targetType: "models.providers.request.proxy.tls.ca",
		targetTypeAliases: ["models.providers.*.request.proxy.tls.ca"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.proxy.tls.ca",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.proxy.tls.cert",
		targetType: "models.providers.request.proxy.tls.cert",
		targetTypeAliases: ["models.providers.*.request.proxy.tls.cert"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.proxy.tls.cert",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.proxy.tls.key",
		targetType: "models.providers.request.proxy.tls.key",
		targetTypeAliases: ["models.providers.*.request.proxy.tls.key"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.proxy.tls.key",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.proxy.tls.passphrase",
		targetType: "models.providers.request.proxy.tls.passphrase",
		targetTypeAliases: ["models.providers.*.request.proxy.tls.passphrase"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.proxy.tls.passphrase",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.tls.ca",
		targetType: "models.providers.request.tls.ca",
		targetTypeAliases: ["models.providers.*.request.tls.ca"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.tls.ca",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.tls.cert",
		targetType: "models.providers.request.tls.cert",
		targetTypeAliases: ["models.providers.*.request.tls.cert"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.tls.cert",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.tls.key",
		targetType: "models.providers.request.tls.key",
		targetTypeAliases: ["models.providers.*.request.tls.key"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.tls.key",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "models.providers.*.request.tls.passphrase",
		targetType: "models.providers.request.tls.passphrase",
		targetTypeAliases: ["models.providers.*.request.tls.passphrase"],
		configFile: "operator.json",
		pathPattern: "models.providers.*.request.tls.passphrase",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "skills.entries.*.apiKey",
		targetType: "skills.entries.apiKey",
		targetTypeAliases: ["skills.entries.*.apiKey"],
		configFile: "operator.json",
		pathPattern: "skills.entries.*.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	},
	{
		id: "talk.providers.*.apiKey",
		targetType: "talk.providers.*.apiKey",
		configFile: "operator.json",
		pathPattern: "talk.providers.*.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 2
	},
	{
		id: "talk.realtime.providers.*.apiKey",
		targetType: "talk.realtime.providers.*.apiKey",
		configFile: "operator.json",
		pathPattern: "talk.realtime.providers.*.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true,
		providerIdPathSegmentIndex: 3
	},
	{
		id: "tools.web.search.apiKey",
		targetType: "tools.web.search.apiKey",
		configFile: "operator.json",
		pathPattern: "tools.web.search.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	},
	{
		id: "tools.web.fetch.firecrawl.apiKey",
		targetType: "tools.web.fetch.firecrawl.apiKey",
		configFile: "operator.json",
		pathPattern: "tools.web.fetch.firecrawl.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: true,
		includeInAudit: true
	},
	{
		id: "tools.web.search.*.apiKey",
		targetType: "tools.web.search.*.apiKey",
		configFile: "operator.json",
		pathPattern: "tools.web.search.*.apiKey",
		secretShape: SECRET_INPUT_SHAPE,
		expectedResolvedValue: "string",
		includeInPlan: true,
		includeInConfigure: false,
		includeInAudit: true,
		providerIdPathSegmentIndex: 3
	}
];
let cachedSecretTargetRegistry = null;
function loadSecretTargetRegistryFromPluginMetadata(params) {
	const plugins = require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config: {},
		env: params.env,
		...params.preferPersisted !== void 0 ? { preferPersisted: params.preferPersisted } : {}
	}).plugins;
	const bundledPlugins = plugins.filter((record) => record.origin === "bundled");
	const channelPlugins = plugins.filter((record) => record.channels.length > 0);
	return [
		...CORE_SECRET_TARGET_REGISTRY,
		...listBundledWebProviderSecretTargetRegistryEntries(bundledPlugins),
		...listBundledPluginConfigSecretTargetRegistryEntries([...bundledPlugins, ...listSourceBundledPluginConfigContractRecords()]),
		...listChannelSecretTargetRegistryEntries(channelPlugins)
	];
}
/** Returns only core-owned secret target registry entries. */
/** Returns static core secret target registry entries without plugin-derived targets. */
function getCoreSecretTargetRegistry() {
	return CORE_SECRET_TARGET_REGISTRY;
}
/** Returns the process-cached registry including bundled plugin/channel metadata. */
/** Returns core plus plugin/channel secret target registry entries for the current metadata view. */
function getSecretTargetRegistry(params) {
	if (params?.sourceTree) return loadSecretTargetRegistryFromPluginMetadata({
		env: {
			...process.env,
			OPERATOR_BUNDLED_PLUGINS_DIR: process.env.OPERATOR_BUNDLED_PLUGINS_DIR ?? "extensions"
		},
		preferPersisted: false
	});
	if (cachedSecretTargetRegistry) return cachedSecretTargetRegistry;
	cachedSecretTargetRegistry = loadSecretTargetRegistryFromPluginMetadata({ env: process.env });
	return cachedSecretTargetRegistry;
}
//#endregion
//#region src/secrets/target-registry-pattern.ts
/** Compiles, matches, and expands secret target registry path patterns. */
function countDynamicPatternTokens(tokens) {
	return tokens.filter((token) => token.kind === "wildcard" || token.kind === "array").length;
}
/**
* Parses a dotted target pattern into literal, wildcard, and array traversal tokens.
*/
function parsePathPattern(pathPattern) {
	return require_shared.parseDotPath(pathPattern).map((segment) => {
		if (segment === "*") return { kind: "wildcard" };
		if (segment.endsWith("[]")) {
			const field = segment.slice(0, -2).trim();
			if (!field) throw new Error(`Invalid target path pattern: ${pathPattern}`);
			return {
				kind: "array",
				field
			};
		}
		return {
			kind: "literal",
			value: segment
		};
	});
}
/**
* Compiles a registry entry and verifies its value path/ref path wildcard shape matches.
*/
function compileTargetRegistryEntry(entry) {
	const pathTokens = parsePathPattern(entry.pathPattern);
	const pathDynamicTokenCount = countDynamicPatternTokens(pathTokens);
	const refPathTokens = entry.refPathPattern ? parsePathPattern(entry.refPathPattern) : void 0;
	const refPathDynamicTokenCount = refPathTokens ? countDynamicPatternTokens(refPathTokens) : 0;
	if (entry.secretShape === "sibling_ref" && !refPathTokens) throw new Error(`Missing refPathPattern for sibling_ref target: ${entry.id}`);
	if (refPathTokens && refPathDynamicTokenCount !== pathDynamicTokenCount) throw new Error(`Mismatched wildcard shape for target ref path: ${entry.id}`);
	return {
		...entry,
		pathTokens,
		pathDynamicTokenCount,
		refPathTokens,
		refPathDynamicTokenCount
	};
}
/**
* Matches concrete path segments against compiled pattern tokens and returns dynamic captures.
*/
function matchPathTokens(segments, tokens) {
	const captures = [];
	let index = 0;
	for (const token of tokens) {
		if (token.kind === "literal") {
			if (segments[index] !== token.value) return null;
			index += 1;
			continue;
		}
		if (token.kind === "wildcard") {
			const value = segments[index];
			if (!value) return null;
			captures.push(value);
			index += 1;
			continue;
		}
		if (segments[index] !== token.field) return null;
		const next = segments[index + 1];
		if (!next || require_path_array_index.parseConfigPathArrayIndex(next) === void 0) return null;
		captures.push(next);
		index += 2;
	}
	return index === segments.length ? { captures } : null;
}
/**
* Rebuilds a concrete path from tokens and captures produced by matchPathTokens/expandPathTokens.
*/
function materializePathTokens(tokens, captures) {
	const out = [];
	let captureIndex = 0;
	for (const token of tokens) {
		if (token.kind === "literal") {
			out.push(token.value);
			continue;
		}
		if (token.kind === "wildcard") {
			const value = captures[captureIndex];
			if (!value) return null;
			out.push(value);
			captureIndex += 1;
			continue;
		}
		const arrayIndex = captures[captureIndex];
		if (!arrayIndex || require_path_array_index.parseConfigPathArrayIndex(arrayIndex) === void 0) return null;
		out.push(token.field, arrayIndex);
		captureIndex += 1;
	}
	return captureIndex === captures.length ? out : null;
}
/**
* Expands a pattern across a config object and returns every matching value with captures.
*/
function expandPathTokens(root, tokens) {
	const out = [];
	const walk = (node, tokenIndex, segments, captures) => {
		const token = tokens[tokenIndex];
		if (!token) {
			out.push({
				segments,
				captures,
				value: node
			});
			return;
		}
		const isLeaf = tokenIndex === tokens.length - 1;
		if (token.kind === "literal") {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(node)) return;
			if (isLeaf) {
				out.push({
					segments: [...segments, token.value],
					captures,
					value: node[token.value]
				});
				return;
			}
			if (!Object.hasOwn(node, token.value)) return;
			walk(node[token.value], tokenIndex + 1, [...segments, token.value], captures);
			return;
		}
		if (token.kind === "wildcard") {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(node)) return;
			for (const [key, value] of Object.entries(node)) {
				if (isLeaf) {
					out.push({
						segments: [...segments, key],
						captures: [...captures, key],
						value
					});
					continue;
				}
				walk(value, tokenIndex + 1, [...segments, key], [...captures, key]);
			}
			return;
		}
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(node)) return;
		const items = node[token.field];
		if (!Array.isArray(items)) return;
		for (let index = 0; index < items.length; index += 1) {
			const item = items[index];
			const indexString = String(index);
			if (isLeaf) {
				out.push({
					segments: [
						...segments,
						token.field,
						indexString
					],
					captures: [...captures, indexString],
					value: item
				});
				continue;
			}
			walk(item, tokenIndex + 1, [
				...segments,
				token.field,
				indexString
			], [...captures, indexString]);
		}
	};
	walk(root, 0, [], []);
	return out;
}
//#endregion
//#region src/secrets/target-registry-query.ts
let compiledSecretTargetRegistryState = null;
let compiledCoreOperatorTargetState = null;
const compiledChannelOperatorTargets = /* @__PURE__ */ new Map();
function buildTargetTypeIndex(compiledSecretTargetRegistry) {
	const byType = /* @__PURE__ */ new Map();
	const append = (type, entry) => {
		const existing = byType.get(type);
		if (existing) {
			existing.push(entry);
			return;
		}
		byType.set(type, [entry]);
	};
	for (const entry of compiledSecretTargetRegistry) {
		append(entry.targetType, entry);
		for (const alias of entry.targetTypeAliases ?? []) append(alias, entry);
	}
	return byType;
}
function buildConfigTargetIdIndex(entries) {
	const byId = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		const existing = byId.get(entry.id);
		if (existing) {
			existing.push(entry);
			continue;
		}
		byId.set(entry.id, [entry]);
	}
	return byId;
}
function getCompiledSecretTargetRegistryState() {
	if (compiledSecretTargetRegistryState) return compiledSecretTargetRegistryState;
	const compiledSecretTargetRegistry = getSecretTargetRegistry().map(compileTargetRegistryEntry);
	const openClawCompiledSecretTargets = compiledSecretTargetRegistry.filter((entry) => entry.configFile === "operator.json");
	const authProfilesCompiledSecretTargets = compiledSecretTargetRegistry.filter((entry) => entry.configFile === "auth-profiles.json");
	compiledSecretTargetRegistryState = {
		authProfilesCompiledSecretTargets,
		authProfilesTargetsById: buildConfigTargetIdIndex(authProfilesCompiledSecretTargets),
		compiledSecretTargetRegistry,
		knownTargetIds: new Set(compiledSecretTargetRegistry.map((entry) => entry.id)),
		openClawCompiledSecretTargets,
		openClawTargetsById: buildConfigTargetIdIndex(openClawCompiledSecretTargets),
		targetsByType: buildTargetTypeIndex(compiledSecretTargetRegistry)
	};
	return compiledSecretTargetRegistryState;
}
function getCompiledCoreOperatorTargetState() {
	if (compiledCoreOperatorTargetState) return compiledCoreOperatorTargetState;
	const compiledCoreSecretTargets = getCoreSecretTargetRegistry().map(compileTargetRegistryEntry);
	const openClawCompiledSecretTargets = compiledCoreSecretTargets.filter((entry) => entry.configFile === "operator.json");
	compiledCoreOperatorTargetState = {
		knownTargetIds: new Set(compiledCoreSecretTargets.map((entry) => entry.id)),
		openClawCompiledSecretTargets,
		openClawTargetsById: buildConfigTargetIdIndex(openClawCompiledSecretTargets),
		planTargetsByType: buildTargetTypeIndex(compiledCoreSecretTargets)
	};
	return compiledCoreOperatorTargetState;
}
function getCompiledChannelOperatorTargets(channelId) {
	const normalizedChannelId = channelId.trim();
	if (!normalizedChannelId || normalizedChannelId === "." || normalizedChannelId === ".." || /[\\/:]/.test(normalizedChannelId)) return null;
	if (compiledChannelOperatorTargets.has(normalizedChannelId)) return compiledChannelOperatorTargets.get(normalizedChannelId) ?? null;
	const compiledEntries = require_channel_contract_api.loadChannelSecretContractApi({
		channelId: normalizedChannelId,
		config: {},
		env: process.env
	})?.secretTargetRegistryEntries?.filter((entry) => entry.configFile === "operator.json").map(compileTargetRegistryEntry) ?? null;
	compiledChannelOperatorTargets.set(normalizedChannelId, compiledEntries);
	return compiledEntries;
}
function normalizeAllowedTargetIds(targetIds) {
	if (targetIds === void 0) return null;
	return new Set(Array.from(targetIds).map((entry) => entry.trim()).filter((entry) => entry.length > 0));
}
function configHasPluginEntries(config) {
	return Boolean(config.plugins?.entries && Object.keys(config.plugins.entries).length > 0);
}
function getConfiguredChannelOperatorTargets(config) {
	return Object.keys(config.channels ?? {}).flatMap((channelId) => getCompiledChannelOperatorTargets(channelId) ?? []);
}
function resolveDiscoveryEntries(params) {
	if (params.allowedTargetIds === null) return params.defaultEntries;
	return Array.from(params.allowedTargetIds).flatMap((targetId) => params.entriesById.get(targetId) ?? []);
}
function discoverSecretTargetsFromEntries(source, discoveryEntries) {
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const entry of discoveryEntries) {
		const expanded = expandPathTokens(source, entry.pathTokens);
		for (const match of expanded) {
			const resolved = toResolvedPlanTarget(entry, match.segments, match.captures);
			if (!resolved) continue;
			const key = `${entry.id}:${resolved.pathSegments.join(".")}`;
			if (seen.has(key)) continue;
			seen.add(key);
			const refValue = resolved.refPathSegments ? require_path_utils.getPath(source, resolved.refPathSegments) : void 0;
			out.push({
				entry,
				path: resolved.pathSegments.join("."),
				pathSegments: resolved.pathSegments,
				...resolved.refPathSegments ? {
					refPathSegments: resolved.refPathSegments,
					refPath: resolved.refPathSegments.join(".")
				} : {},
				value: match.value,
				...resolved.providerId ? { providerId: resolved.providerId } : {},
				...resolved.accountId ? { accountId: resolved.accountId } : {},
				...resolved.refPathSegments ? { refValue } : {}
			});
		}
	}
	return out;
}
function toResolvedPlanTarget(entry, pathSegments, captures) {
	const providerId = entry.providerIdPathSegmentIndex !== void 0 ? pathSegments[entry.providerIdPathSegmentIndex] : void 0;
	const accountId = entry.accountIdPathSegmentIndex !== void 0 ? pathSegments[entry.accountIdPathSegmentIndex] : void 0;
	const refPathSegments = entry.refPathTokens ? materializePathTokens(entry.refPathTokens, captures) : void 0;
	if (entry.refPathTokens && !refPathSegments) return null;
	return {
		entry,
		pathSegments,
		...refPathSegments ? { refPathSegments } : {},
		...providerId ? { providerId } : {},
		...accountId ? { accountId } : {}
	};
}
/**
* Lists the full secrets target registry in public, serializable form.
*/
/** Lists all configured secret target registry entries. */
function listSecretTargetRegistryEntries() {
	return getCompiledSecretTargetRegistryState().compiledSecretTargetRegistry.map((entry) => Object.assign({
		id: entry.id,
		targetType: entry.targetType
	}, entry.targetTypeAliases ? { targetTypeAliases: [...entry.targetTypeAliases] } : {}, {
		configFile: entry.configFile,
		pathPattern: entry.pathPattern
	}, entry.refPathPattern ? { refPathPattern: entry.refPathPattern } : {}, {
		secretShape: entry.secretShape,
		expectedResolvedValue: entry.expectedResolvedValue,
		includeInPlan: entry.includeInPlan,
		includeInConfigure: entry.includeInConfigure,
		includeInAudit: entry.includeInAudit
	}, entry.providerIdPathSegmentIndex !== void 0 ? { providerIdPathSegmentIndex: entry.providerIdPathSegmentIndex } : {}, entry.accountIdPathSegmentIndex !== void 0 ? { accountIdPathSegmentIndex: entry.accountIdPathSegmentIndex } : {}, entry.authProfileType ? { authProfileType: entry.authProfileType } : {}, entry.trackProviderShadowing ? { trackProviderShadowing: true } : {}));
}
/**
* Narrows unknown input to a target id currently present in the compiled registry.
*/
function isKnownSecretTargetId(value) {
	return typeof value === "string" && getCompiledSecretTargetRegistryState().knownTargetIds.has(value);
}
/** Checks the static core registry without materializing plugin/channel contracts. */
function isKnownCoreSecretTargetId(value) {
	return typeof value === "string" && getCompiledCoreOperatorTargetState().knownTargetIds.has(value);
}
/**
* Resolves an operator.json config path to the matching plan-capable secrets target.
*/
function resolveConfigSecretTargetByPath(pathSegments) {
	for (const entry of getCompiledCoreOperatorTargetState().openClawCompiledSecretTargets) {
		if (!entry.includeInPlan) continue;
		const matched = matchPathTokens(pathSegments, entry.pathTokens);
		if (!matched) continue;
		const resolved = toResolvedPlanTarget(entry, pathSegments, matched.captures);
		if (!resolved) continue;
		return resolved;
	}
	const explicitChannelId = pathSegments[0] === "channels" ? pathSegments[1]?.trim() ?? "" : "";
	const explicitChannelEntries = explicitChannelId ? getCompiledChannelOperatorTargets(explicitChannelId) : null;
	for (const entry of explicitChannelEntries ?? []) {
		if (!entry.includeInPlan) continue;
		const matched = matchPathTokens(pathSegments, entry.pathTokens);
		if (!matched) continue;
		const resolved = toResolvedPlanTarget(entry, pathSegments, matched.captures);
		if (!resolved) continue;
		return resolved;
	}
	for (const entry of getCompiledSecretTargetRegistryState().openClawCompiledSecretTargets) {
		if (!entry.includeInPlan) continue;
		const matched = matchPathTokens(pathSegments, entry.pathTokens);
		if (!matched) continue;
		const resolved = toResolvedPlanTarget(entry, pathSegments, matched.captures);
		if (!resolved) continue;
		return resolved;
	}
	return null;
}
/**
* Discovers configured secret-bearing values in operator.json using the full registry.
*/
function discoverConfigSecretTargets(config) {
	return discoverConfigSecretTargetsByIds(config);
}
/**
* Discovers configured operator.json targets, optionally limited to selected registry ids.
*/
function discoverConfigSecretTargetsByIds(config, targetIds) {
	const allowedTargetIds = normalizeAllowedTargetIds(targetIds);
	const coreState = getCompiledCoreOperatorTargetState();
	const configuredEntries = allowedTargetIds !== null && Array.from(allowedTargetIds).every((targetId) => coreState.knownTargetIds.has(targetId)) ? coreState.openClawCompiledSecretTargets : allowedTargetIds !== null && !configHasPluginEntries(config) ? [...coreState.openClawCompiledSecretTargets, ...getConfiguredChannelOperatorTargets(config)] : null;
	const configuredEntriesById = configuredEntries ? buildConfigTargetIdIndex(configuredEntries) : null;
	const registryState = configuredEntries !== null && allowedTargetIds !== null && Array.from(allowedTargetIds).every((targetId) => configuredEntriesById?.has(targetId)) ? null : getCompiledSecretTargetRegistryState();
	return discoverSecretTargetsFromEntries(config, resolveDiscoveryEntries({
		allowedTargetIds,
		defaultEntries: configuredEntries ?? registryState?.openClawCompiledSecretTargets ?? [],
		entriesById: configuredEntriesById ?? registryState?.openClawTargetsById ?? /* @__PURE__ */ new Map()
	}));
}
//#endregion
Object.defineProperty(exports, "discoverConfigSecretTargets", {
	enumerable: true,
	get: function() {
		return discoverConfigSecretTargets;
	}
});
Object.defineProperty(exports, "discoverConfigSecretTargetsByIds", {
	enumerable: true,
	get: function() {
		return discoverConfigSecretTargetsByIds;
	}
});
Object.defineProperty(exports, "isKnownCoreSecretTargetId", {
	enumerable: true,
	get: function() {
		return isKnownCoreSecretTargetId;
	}
});
Object.defineProperty(exports, "isKnownSecretTargetId", {
	enumerable: true,
	get: function() {
		return isKnownSecretTargetId;
	}
});
Object.defineProperty(exports, "listSecretTargetRegistryEntries", {
	enumerable: true,
	get: function() {
		return listSecretTargetRegistryEntries;
	}
});
Object.defineProperty(exports, "resolveConfigSecretTargetByPath", {
	enumerable: true,
	get: function() {
		return resolveConfigSecretTargetByPath;
	}
});
