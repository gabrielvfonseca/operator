const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
const require_zod_schema_core = require("./zod-schema.core-B7xBEBon.cjs");
const require_path_array_index = require("./path-array-index-C9RRFl-Q.cjs");
const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
require("./paths-C5Qy0ueD.cjs");
require("./theme-DwRpEiJc.cjs");
require("./redact-Bg-yc44I.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_config = require("./config-DT0qiglW.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
const require_target_registry = require("./target-registry-C5xgrPiJ.cjs");
require("./redact-snapshot-CmW094US.cjs");
const require_runtime_schema = require("./runtime-schema-8V3DG-Kf.cjs");
const require_config_diff = require("./config-diff-H8SBw0bH.cjs");
const require_config_reload_plan = require("./config-reload-plan-Br2Lvuc3.cjs");
const require_config_reload_settings = require("./config-reload-settings-DfutOn_X.cjs");
const require_config_recovery_hints = require("./config-recovery-hints-A_lub-Kc.cjs");
const require_error_format = require("./error-format-IzEUBRNs.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let json5 = require("json5");
json5 = require_rolldown_runtime.__toESM(json5, 1);
//#region src/cli/config-set-input.ts
function hasBatchMode(opts) {
	return Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.batchJson) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.batchFile));
}
function hasRefBuilderOptions(opts) {
	return Boolean(opts.refProvider || opts.refSource || opts.refId);
}
function hasProviderBuilderOptions(opts) {
	return Boolean(opts.providerSource || opts.providerAllowlist?.length || opts.providerPath || opts.providerMode || opts.providerTimeoutMs || opts.providerMaxBytes || opts.providerCommand || opts.providerArg?.length || opts.providerNoOutputTimeoutMs || opts.providerMaxOutputBytes || opts.providerJsonOnly || opts.providerEnv?.length || opts.providerPassEnv?.length || opts.providerTrustedDir?.length || opts.providerAllowInsecurePath || opts.providerAllowSymlinkCommand);
}
function parseJson5Raw(raw, label) {
	try {
		return json5.default.parse(raw);
	} catch (err) {
		throw new Error(`Failed to parse ${label}: ${String(err)}`, { cause: err });
	}
}
function parseBatchEntries(raw, sourceLabel) {
	const parsed = parseJson5Raw(raw, sourceLabel);
	if (!Array.isArray(parsed)) throw new Error(`${sourceLabel} must be a JSON array.`);
	const out = [];
	for (const [index, entry] of parsed.entries()) {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error(`${sourceLabel}[${index}] must be an object.`);
		const typed = entry;
		const path = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(typed.path) ?? "";
		if (!path) throw new Error(`${sourceLabel}[${index}].path is required.`);
		const hasValue = Object.hasOwn(typed, "value");
		const hasRef = Object.hasOwn(typed, "ref");
		const hasProvider = Object.hasOwn(typed, "provider");
		if (Number(hasValue) + Number(hasRef) + Number(hasProvider) !== 1) throw new Error(`${sourceLabel}[${index}] must include exactly one of: value, ref, provider.`);
		out.push({
			path,
			...hasValue ? { value: typed.value } : {},
			...hasRef ? { ref: typed.ref } : {},
			...hasProvider ? { provider: typed.provider } : {}
		});
	}
	return out;
}
function parseBatchSource(opts) {
	const batchJson = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.batchJson);
	const batchFile = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.batchFile);
	const hasInline = Boolean(batchJson);
	const hasFile = Boolean(batchFile);
	if (!hasInline && !hasFile) return null;
	if (hasInline && hasFile) throw new Error("Use either --batch-json or --batch-file, not both.");
	if (hasInline) return parseBatchEntries(batchJson, "--batch-json");
	const pathname = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(opts.batchFile) ?? "";
	if (!pathname) throw new Error("--batch-file must not be empty.");
	return parseBatchEntries(node_fs.default.readFileSync(pathname, "utf8"), "--batch-file");
}
//#endregion
//#region src/cli/config-set-parser.ts
/** Resolve the config-set input mode or return the exact flag-conflict error. */
function resolveConfigSetMode(params) {
	if (params.hasBatchMode) {
		if (params.hasRefBuilderOptions || params.hasProviderBuilderOptions) return {
			ok: false,
			error: "batch mode (--batch-json/--batch-file) cannot be combined with ref builder (--ref-*) or provider builder (--provider-*) flags."
		};
		return {
			ok: true,
			mode: "batch"
		};
	}
	if (params.hasRefBuilderOptions && params.hasProviderBuilderOptions) return {
		ok: false,
		error: "choose exactly one mode: ref builder (--ref-provider/--ref-source/--ref-id) or provider builder (--provider-*), not both."
	};
	if (params.hasRefBuilderOptions) return {
		ok: true,
		mode: "ref_builder"
	};
	if (params.hasProviderBuilderOptions) return {
		ok: true,
		mode: "provider_builder"
	};
	return {
		ok: true,
		mode: params.strictJson ? "json" : "value"
	};
}
//#endregion
//#region src/cli/config-cli.ts
function normalizeAgentDefaultModelValueForConfigMutation(value) {
	if (typeof value === "string") return require_model_input.normalizeAgentModelRefForConfig(value);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return value;
	const next = { ...value };
	if (typeof next.primary === "string") next.primary = require_model_input.normalizeAgentModelRefForConfig(next.primary);
	if (Array.isArray(next.fallbacks)) next.fallbacks = next.fallbacks.map((fallback) => typeof fallback === "string" ? require_model_input.normalizeAgentModelRefForConfig(fallback) : fallback);
	return next;
}
function normalizeAgentListModelRefsForConfigMutation(value) {
	if (!Array.isArray(value)) return value;
	let mutated = false;
	const next = value.map((agent) => {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agent)) return agent;
		let nextAgent = agent;
		if (Object.hasOwn(agent, "model")) {
			const model = normalizeAgentDefaultModelValueForConfigMutation(agent.model);
			if (model !== agent.model) {
				nextAgent = {
					...nextAgent,
					model
				};
				mutated = true;
			}
		}
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agent.models)) {
			const models = require_model_input.normalizeAgentModelMapForConfig(agent.models);
			if (models !== agent.models) {
				nextAgent = {
					...nextAgent,
					models
				};
				mutated = true;
			}
		}
		return nextAgent;
	});
	return mutated ? next : value;
}
function normalizeProviderCatalogModelsForConfigMutation(provider, models) {
	if (!Array.isArray(models)) return models;
	let mutated = false;
	const next = models.map((model) => {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(model) || typeof model.id !== "string") return model;
		const trimmed = model.id.trim();
		if (!trimmed) return model;
		const id = require_model_selection_normalize.normalizeConfiguredProviderCatalogModelId(provider, trimmed);
		if (id === model.id) return model;
		mutated = true;
		return {
			...model,
			id
		};
	});
	return mutated ? next : models;
}
function normalizeModelProviderRefsForConfigMutation(providers) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providers)) return providers;
	let mutated = false;
	const nextProviders = { ...providers };
	for (const [provider, providerConfig] of Object.entries(providers)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providerConfig)) continue;
		const models = normalizeProviderCatalogModelsForConfigMutation(provider, providerConfig.models);
		if (models === providerConfig.models) continue;
		nextProviders[provider] = {
			...providerConfig,
			models
		};
		mutated = true;
	}
	return mutated ? nextProviders : providers;
}
function normalizeConfigMutationModelRefs(cfg) {
	const defaults = cfg.agents?.defaults;
	const agentList = cfg.agents?.list;
	const providers = cfg.models?.providers;
	const normalizedAgentList = normalizeAgentListModelRefsForConfigMutation(agentList);
	const normalizedProviders = normalizeModelProviderRefsForConfigMutation(providers);
	return {
		...cfg,
		...defaults || normalizedAgentList !== agentList ? { agents: {
			...cfg.agents,
			...defaults ? { defaults: {
				...defaults,
				...defaults.model !== void 0 ? { model: normalizeAgentDefaultModelValueForConfigMutation(defaults.model) } : void 0,
				...defaults.models !== void 0 ? { models: require_model_input.normalizeAgentModelMapForConfig(defaults.models) } : void 0
			} } : void 0,
			...normalizedAgentList !== agentList ? { list: normalizedAgentList } : void 0
		} } : void 0,
		...normalizedProviders !== providers ? { models: {
			...cfg.models,
			providers: normalizedProviders
		} } : void 0
	};
}
function normalizeConfigMutationExplicitSetPath(path) {
	if (path.length >= 4 && path[0] === "agents" && path[1] === "defaults" && path[2] === "models") {
		const normalizedModelId = require_model_input.normalizeAgentModelRefForConfig((0, _gabrielvfonseca_normalization_core.expectDefined)(path[3], "path entry at 3"));
		return normalizedModelId === path[3] ? path : [
			...path.slice(0, 3),
			normalizedModelId,
			...path.slice(4)
		];
	}
	return path;
}
const GATEWAY_AUTH_MODE_PATH = [
	"gateway",
	"auth",
	"mode"
];
const SECRET_PROVIDER_PATH_PREFIX = ["secrets", "providers"];
const PLUGIN_INSTALL_RECORD_PATH_PREFIX = ["plugins", "installs"];
const CONFIG_SET_EXAMPLE_VALUE = require_command_format.formatCliCommand("openclaw config set gateway.port 19001 --strict-json");
const CONFIG_SET_EXAMPLE_REF = require_command_format.formatCliCommand("openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN");
const CONFIG_SET_EXAMPLE_PROVIDER = require_command_format.formatCliCommand("openclaw config set secrets.providers.vault --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json");
const CONFIG_SET_EXAMPLE_BATCH = require_command_format.formatCliCommand("openclaw config set --batch-file ./config-set.batch.json --dry-run");
const CONFIG_PATCH_EXAMPLE_FILE = require_command_format.formatCliCommand("openclaw config patch --file ./operator.patch.json5 --dry-run");
const CONFIG_PATCH_EXAMPLE_STDIN = require_command_format.formatCliCommand("openclaw config patch --stdin");
[
	"Set config values by path (value mode, ref/provider builder mode, or batch JSON mode).",
	"Examples:",
	CONFIG_SET_EXAMPLE_VALUE,
	CONFIG_SET_EXAMPLE_REF,
	CONFIG_SET_EXAMPLE_PROVIDER,
	CONFIG_SET_EXAMPLE_BATCH
].join("\n");
[
	"Patch config from a JSON5 object in one validated write.",
	"Objects merge recursively, arrays/scalars replace, and null deletes a path.",
	"Examples:",
	CONFIG_PATCH_EXAMPLE_FILE,
	CONFIG_PATCH_EXAMPLE_STDIN
].join("\n");
const CONFIG_SET_POLICY_ERROR_MAX_ISSUES = 5;
var ConfigSetDryRunValidationError = class extends Error {
	constructor(result) {
		super("config set dry-run validation failed");
		this.result = result;
		this.name = "ConfigSetDryRunValidationError";
	}
};
function isIndexSegment(raw) {
	return parseIndexSegment(raw) !== void 0;
}
function parseIndexSegment(raw) {
	return require_path_array_index.parseConfigPathArrayIndex(raw);
}
function parseBracketPathSegment(raw, fullPath) {
	const trimmed = raw.trim();
	if (!trimmed) throw new Error(`Invalid path (empty "[]"): ${fullPath}`);
	if (trimmed.startsWith("\"") || trimmed.startsWith("'")) {
		try {
			const parsed = json5.default.parse(trimmed);
			if (typeof parsed === "string" && parsed.trim()) return parsed;
		} catch (err) {
			throw new Error(`Invalid path bracket string (${trimmed}): ${fullPath}`, { cause: err });
		}
		throw new Error(`Invalid path bracket string (${trimmed}): ${fullPath}`);
	}
	return trimmed;
}
function assertNotWhitespaceSegment(current, raw) {
	if (current.length > 0 && !current.trim()) throw new Error(`Invalid path (empty segment): ${raw}`);
}
function parsePath(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return [];
	const parts = [];
	let current = "";
	let segmentEmitted = false;
	let i = 0;
	while (i < trimmed.length) {
		const ch = trimmed[i];
		if (ch === "\\") {
			const next = trimmed[i + 1];
			if (next) current += next;
			i += 2;
			continue;
		}
		if (ch === ".") {
			assertNotWhitespaceSegment(current, raw);
			if (!segmentEmitted && !current.trim()) throw new Error(`Invalid path (empty segment): ${raw}`);
			if (current) parts.push(current);
			current = "";
			segmentEmitted = false;
			i += 1;
			continue;
		}
		if (ch === "[") {
			assertNotWhitespaceSegment(current, raw);
			if (!current.trim() && !segmentEmitted && parts.length > 0) throw new Error(`Invalid path (empty segment): ${raw}`);
			if (current) parts.push(current);
			current = "";
			const close = trimmed.indexOf("]", i);
			if (close === -1) throw new Error(`Invalid path (missing "]"): ${raw}`);
			const inside = trimmed.slice(i + 1, close).trim();
			if (!inside) throw new Error(`Invalid path (empty "[]"): ${raw}`);
			parts.push(parseBracketPathSegment(inside, raw));
			segmentEmitted = true;
			i = close + 1;
			continue;
		}
		current += ch;
		i += 1;
	}
	if (!segmentEmitted && !current.trim()) throw new Error(`Invalid path (empty segment): ${raw}`);
	if (current) parts.push(current);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(parts);
}
function parseValue(raw, opts) {
	const trimmed = raw.trim();
	if (opts.strictJson) try {
		return JSON.parse(trimmed);
	} catch (err) {
		throw new Error(require_error_format.formatStrictJsonParseFailure({
			value: raw,
			cause: err
		}), { cause: err });
	}
	try {
		return json5.default.parse(trimmed);
	} catch {
		return raw;
	}
}
function hasOwnPathKey(value, key) {
	return Object.hasOwn(value, key);
}
function formatDoctorHint(message) {
	return `Run \`${require_command_format.formatCliCommand("openclaw doctor --fix")}\` ${message}`;
}
function formatInvalidConfigRepairHint(snapshot, doctorMessage) {
	return require_io.isPluginPackagingRuntimeOutputInvalidConfigSnapshot(snapshot) ? require_config_recovery_hints.formatPluginPackagingRuntimeOutputRecoveryHint() : formatDoctorHint(doctorMessage);
}
function formatUnsupportedSecretRefPolicyFailureMessage(issues) {
	const lines = ["Config policy validation failed: unsupported SecretRef usage was detected.", ...issues.slice(0, CONFIG_SET_POLICY_ERROR_MAX_ISSUES).map((issue) => `- ${issue}`)];
	if (issues.length > CONFIG_SET_POLICY_ERROR_MAX_ISSUES) lines.push(`- ... ${issues.length - CONFIG_SET_POLICY_ERROR_MAX_ISSUES} more`);
	return lines.join("\n");
}
function validatePathSegments(path) {
	for (const segment of path) if (!isIndexSegment(segment) && require_prototype_keys.isBlockedObjectKey(segment)) throw new Error(`Invalid path segment: ${segment}`);
}
function getAtPath(root, path) {
	let current = root;
	for (const segment of path) {
		if (!current || typeof current !== "object") return { found: false };
		if (Array.isArray(current)) {
			if (!isIndexSegment(segment)) return { found: false };
			const index = parseIndexSegment(segment);
			if (index === void 0 || index >= current.length) return { found: false };
			current = current[index];
			continue;
		}
		const record = current;
		if (!hasOwnPathKey(record, segment)) return { found: false };
		current = record[segment];
	}
	return {
		found: true,
		value: current
	};
}
function isSchemaRecord(value) {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function schemaTypes(schema) {
	if (typeof schema.type === "string") return /* @__PURE__ */ new Set([schema.type]);
	if (Array.isArray(schema.type)) return new Set(schema.type.filter((entry) => typeof entry === "string"));
	return /* @__PURE__ */ new Set();
}
function schemaAlternatives(schema, seen = /* @__PURE__ */ new Set()) {
	if (seen.has(schema)) return [];
	seen.add(schema);
	const alternatives = [schema];
	for (const key of [
		"anyOf",
		"oneOf",
		"allOf"
	]) {
		const entries = schema[key];
		if (!Array.isArray(entries)) continue;
		for (const entry of entries) if (isSchemaRecord(entry)) alternatives.push(...schemaAlternatives(entry, seen));
	}
	return alternatives;
}
function schemaLooksArray(schema) {
	return schemaTypes(schema).has("array") || isSchemaRecord(schema.items) || Array.isArray(schema.items);
}
function schemaLooksObject(schema) {
	return schemaTypes(schema).has("object") || isSchemaRecord(schema.properties) || schema.additionalProperties === true || isSchemaRecord(schema.additionalProperties);
}
function propertySchema(schema, segment) {
	const schemas = [];
	for (const alternative of schemaAlternatives(schema)) {
		if (schemaLooksArray(alternative)) {
			const index = parseIndexSegment(segment);
			if (index !== void 0) {
				const indexedItem = Array.isArray(alternative.items) ? alternative.items[index] : alternative.items;
				if (isSchemaRecord(indexedItem)) schemas.push(indexedItem);
			}
			continue;
		}
		const explicit = (isSchemaRecord(alternative.properties) ? alternative.properties : void 0)?.[segment];
		if (isSchemaRecord(explicit)) {
			schemas.push(explicit);
			continue;
		}
		if (isSchemaRecord(alternative.additionalProperties)) schemas.push(alternative.additionalProperties);
	}
	return schemas;
}
function schemasAtPath(schema, path) {
	if (!schema) return [];
	let schemas = [schema];
	for (const segment of path) {
		schemas = schemas.flatMap((candidate) => propertySchema(candidate, segment));
		if (schemas.length === 0) return [];
	}
	return schemas;
}
function schemaPrefersArrayAtPath(schema, path) {
	const candidates = schemasAtPath(schema, path).flatMap((candidate) => schemaAlternatives(candidate));
	if (candidates.length === 0) return;
	const hasArray = candidates.some((candidate) => schemaLooksArray(candidate));
	const hasObject = candidates.some((candidate) => schemaLooksObject(candidate));
	if (hasArray && !hasObject) return true;
	if (hasObject && !hasArray) return false;
}
function shouldCreateArrayForMissingPathSegment(params) {
	if (!params.next || params.options?.numericObjectKeys || !isIndexSegment(params.next)) return false;
	const parentPath = params.path.slice(0, params.segmentIndex + 1);
	const schemaPreference = schemaPrefersArrayAtPath(params.options?.schema, parentPath);
	if (schemaPreference !== void 0) return schemaPreference;
	return true;
}
function setAtPath(root, path, value, options) {
	const last = path.at(-1);
	if (last === void 0) throw new Error("Config path must contain at least one segment");
	let current = root;
	for (const [i, segment] of path.slice(0, -1).entries()) {
		const next = path[i + 1];
		const nextIsIndex = shouldCreateArrayForMissingPathSegment({
			path,
			segmentIndex: i,
			next,
			options
		});
		if (Array.isArray(current)) {
			if (!isIndexSegment(segment)) throw new Error(`Expected numeric index for array segment "${segment}"`);
			const index = parseIndexSegment(segment);
			if (index === void 0) throw new Error(`Expected numeric index for array segment "${segment}"`);
			const existing = current[index];
			if (!existing || typeof existing !== "object") current[index] = nextIsIndex ? [] : {};
			current = current[index];
			continue;
		}
		if (!current || typeof current !== "object") throw new Error(`Cannot traverse into "${segment}" (not an object)`);
		const record = current;
		const existing = hasOwnPathKey(record, segment) ? record[segment] : void 0;
		if (!existing || typeof existing !== "object") record[segment] = nextIsIndex ? [] : {};
		current = record[segment];
	}
	if (Array.isArray(current)) {
		if (!isIndexSegment(last)) throw new Error(`Expected numeric index for array segment "${last}"`);
		const index = parseIndexSegment(last);
		if (index === void 0) throw new Error(`Expected numeric index for array segment "${last}"`);
		current[index] = value;
		return;
	}
	if (!current || typeof current !== "object") throw new Error(`Cannot set "${last}" (parent is not an object)`);
	current[last] = value;
}
function modelArrayIds(value) {
	if (!Array.isArray(value)) return null;
	const ids = /* @__PURE__ */ new Set();
	for (const entry of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) || typeof entry.id !== "string" || !entry.id.trim()) return null;
		ids.add(entry.id.trim());
	}
	return ids;
}
function mergeModelArrays(existing, patch) {
	const merged = [...existing];
	const indexById = /* @__PURE__ */ new Map();
	for (const [index, entry] of merged.entries()) if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) && typeof entry.id === "string" && entry.id.trim()) indexById.set(entry.id.trim(), index);
	for (const entry of patch) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) || typeof entry.id !== "string" || !entry.id.trim()) {
			merged.push(entry);
			continue;
		}
		const id = entry.id.trim();
		const existingIndex = indexById.get(id);
		if (existingIndex === void 0) {
			indexById.set(id, merged.length);
			merged.push(entry);
			continue;
		}
		const existingEntry = merged[existingIndex];
		merged[existingIndex] = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(existingEntry) ? {
			...existingEntry,
			...entry
		} : entry;
	}
	return merged;
}
function mergeConfigValue(existing, patch, path) {
	if (isProviderModelListPath(path) && Array.isArray(existing) && Array.isArray(patch)) return mergeModelArrays(existing, patch);
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(existing) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(patch)) {
		const next = { ...existing };
		for (const [key, value] of Object.entries(patch)) next[key] = hasOwnPathKey(next, key) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next[key]) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) ? mergeConfigValue(next[key], value, [...path, key]) : value;
		return next;
	}
	throw new Error(`Cannot merge ${toDotPath(path)}; use --replace to replace intentionally.`);
}
function mergeAtPath(root, path, value, options) {
	const existing = getAtPath(root, path);
	if (!existing.found) {
		setAtPath(root, path, value, options);
		return;
	}
	setAtPath(root, path, mergeConfigValue(existing.value, value, path), options);
}
function isProviderModelListPath(path) {
	return path.length === 4 && path[0] === "models" && path[1] === "providers" && path[3] === "models";
}
function isProtectedMapReplacementPath(path) {
	if (path.join(".") === "agents.defaults.models") return true;
	if (path.join(".") === "models.providers") return true;
	if (path.length === 3 && path[0] === "models" && path[1] === "providers") return true;
	if (path.join(".") === "plugins.entries") return true;
	if (path.join(".") === "auth.profiles") return true;
	return false;
}
function isProtectedArrayReplacementPath(path) {
	return isProviderModelListPath(path) || path.join(".") === "agents.list";
}
function formatRemovedEntries(entries) {
	const visible = entries.slice(0, 6);
	const suffix = entries.length > visible.length ? `, ... ${entries.length - visible.length} more` : "";
	return `${visible.join(", ")}${suffix}`;
}
function assertNonDestructiveReplacement(params) {
	if (params.allowReplace) return;
	const existing = getAtPath(params.root, params.path);
	if (!existing.found) return;
	const pathLabel = toDotPath(params.path);
	if (isProtectedMapReplacementPath(params.path) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(existing.value)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.value)) return;
		const nextKeys = new Set(Object.keys(params.value));
		const removed = Object.keys(existing.value).filter((key) => !nextKeys.has(key));
		if (removed.length > 0) throw new Error(`Refusing to replace ${pathLabel}; it would remove existing entries: ${formatRemovedEntries(removed)}. Use --merge to merge object values or --replace to replace intentionally.`);
	}
	if (isProtectedArrayReplacementPath(params.path)) {
		const existingIds = modelArrayIds(existing.value);
		const nextIds = modelArrayIds(params.value);
		if (!existingIds || !nextIds) return;
		const removed = [...existingIds].filter((id) => !nextIds.has(id));
		if (removed.length > 0) throw new Error(`Refusing to replace ${pathLabel}; it would remove existing entries: ${formatRemovedEntries(removed)}. Use --merge to merge by id or --replace to replace intentionally.`);
	}
}
function unsetAtPath(root, path) {
	const last = path.at(-1);
	if (last === void 0) return { removed: false };
	let current = root;
	for (const segment of path.slice(0, -1)) {
		if (!current || typeof current !== "object") return { removed: false };
		if (Array.isArray(current)) {
			if (!isIndexSegment(segment)) return { removed: false };
			const index = parseIndexSegment(segment);
			if (index === void 0 || index >= current.length) return { removed: false };
			current = current[index];
			continue;
		}
		const record = current;
		if (!hasOwnPathKey(record, segment)) return { removed: false };
		current = record[segment];
	}
	if (Array.isArray(current)) {
		if (!isIndexSegment(last)) return { removed: false };
		const index = parseIndexSegment(last);
		if (index === void 0 || index >= current.length) return { removed: false };
		current.splice(index, 1);
		return {
			removed: true,
			leafContainer: "array"
		};
	}
	if (!current || typeof current !== "object") return { removed: false };
	const record = current;
	if (!hasOwnPathKey(record, last)) return { removed: false };
	delete record[last];
	return {
		removed: true,
		leafContainer: "object"
	};
}
async function loadValidConfig(runtime = require_runtime.defaultRuntime) {
	const snapshot = await require_io.readConfigFileSnapshot();
	if (snapshot.valid) return snapshot;
	runtime.error(`Operator config is invalid: ${require_utils.shortenHomePath(snapshot.path)}`);
	for (const line of require_io.formatConfigIssueLines(snapshot.issues, "-", { normalizeRoot: true })) runtime.error(line);
	runtime.error(formatInvalidConfigRepairHint(snapshot, "to repair, then retry."));
	runtime.exit(1);
	return snapshot;
}
/** Parse and validate the exact path grammar accepted by config set/get/unset. */
function parseConfigSetPath(path) {
	const parsedPath = parsePath(path);
	if (parsedPath.length === 0) throw new Error("Path is empty.");
	validatePathSegments(parsedPath);
	return parsedPath;
}
function pathEquals(path, expected) {
	return path.length === expected.length && path.every((segment, index) => segment === expected[index]);
}
function pruneInactiveGatewayAuthCredentials(params) {
	if (!params.operations.some((operation) => pathEquals(operation.requestedPath, GATEWAY_AUTH_MODE_PATH))) return [];
	const gatewayRaw = params.root.gateway;
	if (!gatewayRaw || typeof gatewayRaw !== "object" || Array.isArray(gatewayRaw)) return [];
	const authRaw = gatewayRaw.auth;
	if (!authRaw || typeof authRaw !== "object" || Array.isArray(authRaw)) return [];
	const auth = authRaw;
	const mode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(auth.mode) ?? "";
	const removedPaths = [];
	const remove = (key) => {
		if (Object.hasOwn(auth, key)) {
			delete auth[key];
			removedPaths.push(`gateway.auth.${key}`);
		}
	};
	if (mode === "token") remove("password");
	else if (mode === "password") remove("token");
	else if (mode === "trusted-proxy") {
		remove("token");
		remove("password");
	}
	return removedPaths;
}
function toDotPath(path) {
	return path.join(".");
}
const RESTART_HINT = "Restart the gateway to apply.";
const HOT_RELOAD_HINT = "Change will apply without restarting the gateway.";
const NO_RELOAD_HINT = "No gateway restart needed.";
function isPluginEntryConfigPath(path) {
	return path === "plugins.entries" || path.startsWith("plugins.entries.");
}
function configApplyHintForPaths(paths, afterConfig) {
	if (paths.length === 0) return RESTART_HINT;
	if (paths.some(isPluginEntryConfigPath)) return RESTART_HINT;
	const plan = require_config_reload_plan.buildGatewayReloadPlan(paths);
	if (plan.restartGateway) return RESTART_HINT;
	if (plan.hotReasons.length > 0) {
		const { mode } = require_config_reload_settings.resolveGatewayReloadSettings(afterConfig);
		if (mode === "off" || mode === "restart") return RESTART_HINT;
		return HOT_RELOAD_HINT;
	}
	return NO_RELOAD_HINT;
}
function configApplyHintForOperations(operations, beforeConfig, afterConfig) {
	const requestedPaths = [];
	for (const operation of operations) {
		if (!operation.requestedPath) return RESTART_HINT;
		requestedPaths.push(toDotPath(operation.requestedPath));
	}
	return configApplyHintForPaths(expandActualChangedPathsWithRequestedDescendants(require_config_diff.diffConfigPaths(beforeConfig, afterConfig), requestedPaths, beforeConfig, afterConfig), afterConfig);
}
function expandActualChangedPathsWithRequestedDescendants(actualChangedPaths, requestedPaths, beforeConfig, afterConfig) {
	const expanded = /* @__PURE__ */ new Set();
	for (const actualPath of actualChangedPaths) {
		const requestedDescendants = requestedPaths.filter((requestedPath) => requestedPath !== actualPath && requestedPath.startsWith(`${actualPath}.`));
		if (requestedDescendants.length > 0) {
			for (const requestedPath of requestedDescendants) expanded.add(requestedPath);
			continue;
		}
		for (const expandedPath of expandWholeValueChangePath(actualPath, beforeConfig, afterConfig)) expanded.add(expandedPath);
	}
	return [...expanded];
}
function expandWholeValueChangePath(actualPath, beforeConfig, afterConfig) {
	const path = actualPath === "<root>" ? [] : actualPath.split(".");
	const before = getAtPath(beforeConfig, path);
	const after = getAtPath(afterConfig, path);
	if (before.found && !after.found) return collectChangedLeafPaths(before.value, actualPath);
	if (!before.found && after.found) return collectChangedLeafPaths(after.value, actualPath);
	return [actualPath];
}
function collectChangedLeafPaths(value, prefix) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return [prefix];
	const entries = Object.entries(value);
	if (entries.length === 0) return [prefix];
	return entries.flatMap(([key, child]) => collectChangedLeafPaths(child, prefix ? `${prefix}.${key}` : key));
}
function parseSecretRefSource(raw, label) {
	const source = raw.trim();
	if (source === "env" || source === "file" || source === "exec") return source;
	throw new Error(`${label} must be one of: env, file, exec.`);
}
function parseSecretRefBuilder(params) {
	const provider = params.provider.trim();
	if (!provider) throw new Error(`${params.fieldPrefix}.provider is required.`);
	if (!require_ref_contract.isValidSecretProviderAlias(provider)) throw new Error(`${params.fieldPrefix}.provider must match /^[a-z][a-z0-9_-]{0,63}$/ (example: "default").`);
	const source = parseSecretRefSource(params.source, `${params.fieldPrefix}.source`);
	const id = params.id.trim();
	if (!id) throw new Error(`${params.fieldPrefix}.id is required.`);
	if (source === "env" && !require_types_secrets.isValidEnvSecretRefId(id)) throw new Error(`${params.fieldPrefix}.id must match /^[A-Z][A-Z0-9_]{0,127}$/ for env refs.`);
	if (source === "file" && !require_ref_contract.isValidFileSecretRefId(id)) throw new Error(`${params.fieldPrefix}.id must be an absolute JSON pointer (or "value" for singleValue mode).`);
	if (source === "exec") {
		if (!require_ref_contract.validateExecSecretRefId(id).ok) throw new Error(require_ref_contract.formatExecSecretRefIdValidationMessage());
	}
	return {
		source,
		provider,
		id
	};
}
function parseOptionalPositiveInteger(raw, flag) {
	if (raw === void 0) return;
	const trimmed = raw.trim();
	if (!trimmed) throw new Error(`${flag} must not be empty.`);
	const parsed = require_parse_finite_number.parseStrictPositiveInteger(trimmed);
	if (parsed === void 0) throw new Error(`${flag} must be a positive integer.`);
	return parsed;
}
function parseProviderEnvEntries(entries) {
	if (!entries || entries.length === 0) return;
	const env = {};
	for (const entry of entries) {
		const separator = entry.indexOf("=");
		if (separator <= 0) throw new Error(`--provider-env expects KEY=VALUE entries (received: "${entry}").`);
		const key = entry.slice(0, separator).trim();
		if (!key) throw new Error(`--provider-env key must not be empty (received: "${entry}").`);
		env[key] = entry.slice(separator + 1);
	}
	return Object.keys(env).length > 0 ? env : void 0;
}
function parseProviderAliasPath(path) {
	if (!(path.length === 3 && path[0] === SECRET_PROVIDER_PATH_PREFIX[0] && path[1] === SECRET_PROVIDER_PATH_PREFIX[1])) throw new Error("Provider builder mode requires path \"secrets.providers.<alias>\" (example: secrets.providers.vault).");
	const alias = path[2] ?? "";
	if (!require_ref_contract.isValidSecretProviderAlias(alias)) throw new Error(`Provider alias "${alias}" must match /^[a-z][a-z0-9_-]{0,63}$/ (example: "default").`);
	return alias;
}
function buildProviderFromBuilder(opts) {
	const sourceRaw = opts.providerSource?.trim();
	if (!sourceRaw) throw new Error("--provider-source is required in provider builder mode.");
	const source = parseSecretRefSource(sourceRaw, "--provider-source");
	const timeoutMs = parseOptionalPositiveInteger(opts.providerTimeoutMs, "--provider-timeout-ms");
	const maxBytes = parseOptionalPositiveInteger(opts.providerMaxBytes, "--provider-max-bytes");
	const noOutputTimeoutMs = parseOptionalPositiveInteger(opts.providerNoOutputTimeoutMs, "--provider-no-output-timeout-ms");
	const maxOutputBytes = parseOptionalPositiveInteger(opts.providerMaxOutputBytes, "--provider-max-output-bytes");
	const providerEnv = parseProviderEnvEntries(opts.providerEnv);
	let provider;
	if (source === "env") {
		const allowlist = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(opts.providerAllowlist);
		for (const envName of allowlist) if (!require_types_secrets.isValidEnvSecretRefId(envName)) throw new Error(`--provider-allowlist entry "${envName}" must match /^[A-Z][A-Z0-9_]{0,127}$/.`);
		provider = {
			source: "env",
			...allowlist.length > 0 ? { allowlist } : {}
		};
	} else if (source === "file") {
		const filePath = opts.providerPath?.trim();
		if (!filePath) throw new Error("--provider-path is required when --provider-source file is used.");
		const modeRaw = opts.providerMode?.trim();
		if (modeRaw && modeRaw !== "singleValue" && modeRaw !== "json") throw new Error("--provider-mode must be one of: singleValue, json.");
		const mode = modeRaw === "singleValue" || modeRaw === "json" ? modeRaw : void 0;
		provider = {
			source: "file",
			path: filePath,
			...mode ? { mode } : {},
			...timeoutMs !== void 0 ? { timeoutMs } : {},
			...maxBytes !== void 0 ? { maxBytes } : {},
			...opts.providerAllowInsecurePath ? { allowInsecurePath: true } : {}
		};
	} else {
		const command = opts.providerCommand?.trim();
		if (!command) throw new Error("--provider-command is required when --provider-source exec is used.");
		provider = {
			source: "exec",
			command,
			...opts.providerArg && opts.providerArg.length > 0 ? { args: opts.providerArg.map((entry) => entry.trim()) } : {},
			...timeoutMs !== void 0 ? { timeoutMs } : {},
			...noOutputTimeoutMs !== void 0 ? { noOutputTimeoutMs } : {},
			...maxOutputBytes !== void 0 ? { maxOutputBytes } : {},
			...opts.providerJsonOnly ? { jsonOnly: true } : {},
			...providerEnv ? { env: providerEnv } : {},
			...opts.providerPassEnv && opts.providerPassEnv.length > 0 ? { passEnv: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(opts.providerPassEnv) } : {},
			...opts.providerTrustedDir && opts.providerTrustedDir.length > 0 ? { trustedDirs: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(opts.providerTrustedDir) } : {},
			...opts.providerAllowInsecurePath ? { allowInsecurePath: true } : {},
			...opts.providerAllowSymlinkCommand ? { allowSymlinkCommand: true } : {}
		};
	}
	const validated = require_zod_schema_core.SecretProviderSchema.safeParse(provider);
	if (!validated.success) {
		const issue = validated.error.issues[0];
		const issuePath = issue?.path?.join(".") ?? "<provider>";
		const issueMessage = issue?.message ?? "Invalid provider config.";
		throw new Error(`Provider builder config invalid at ${issuePath}: ${issueMessage}`);
	}
	return validated.data;
}
function parseSecretRefFromUnknown(value, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object with source/provider/id.`);
	const candidate = value;
	if (typeof candidate.provider !== "string" || typeof candidate.source !== "string" || typeof candidate.id !== "string") throw new Error(`${label} must include string fields: source, provider, id.`);
	return parseSecretRefBuilder({
		provider: candidate.provider,
		source: candidate.source,
		id: candidate.id,
		fieldPrefix: label
	});
}
function buildRefAssignmentOperation(params) {
	const resolved = require_target_registry.resolveConfigSecretTargetByPath(params.requestedPath);
	if (resolved?.entry.secretShape === "sibling_ref" && resolved.refPathSegments) return {
		inputMode: params.inputMode,
		requestedPath: params.requestedPath,
		setPath: resolved.refPathSegments,
		value: params.ref,
		schemaValidated: true,
		touchedSecretTargetPath: toDotPath(resolved.pathSegments),
		assignedRef: params.ref,
		...resolved.providerId ? { touchedProviderAlias: resolved.providerId } : {}
	};
	return {
		inputMode: params.inputMode,
		requestedPath: params.requestedPath,
		setPath: params.requestedPath,
		value: params.ref,
		...resolved ? { schemaValidated: true } : {},
		touchedSecretTargetPath: resolved ? toDotPath(resolved.pathSegments) : toDotPath(params.requestedPath),
		assignedRef: params.ref,
		...resolved?.providerId ? { touchedProviderAlias: resolved.providerId } : {}
	};
}
function parseProviderAliasFromTargetPath(path) {
	if (path.length >= 3 && path[0] === SECRET_PROVIDER_PATH_PREFIX[0] && path[1] === SECRET_PROVIDER_PATH_PREFIX[1]) return path[2] ?? null;
	return null;
}
function touchesSecretProviderCollection(path) {
	return path.length === 1 && path[0] === "secrets" || path.length === 2 && path[0] === "secrets" && path[1] === "providers";
}
function buildValueAssignmentOperation(params) {
	const resolved = require_target_registry.resolveConfigSecretTargetByPath(params.requestedPath);
	const providerAlias = parseProviderAliasFromTargetPath(params.requestedPath);
	const coercedRef = require_types_secrets.coerceSecretRef(params.value);
	return {
		inputMode: params.inputMode,
		requestedPath: params.requestedPath,
		setPath: params.requestedPath,
		value: params.value,
		...resolved ? { touchedSecretTargetPath: toDotPath(resolved.pathSegments) } : {},
		...providerAlias ? { touchedProviderAlias: providerAlias } : {},
		...coercedRef ? { assignedRef: coercedRef } : {}
	};
}
function parseBatchOperations(entries) {
	const operations = [];
	for (const [index, entry] of entries.entries()) {
		const path = parseConfigSetPath(entry.path);
		if (entry.ref !== void 0) {
			const ref = parseSecretRefFromUnknown(entry.ref, `batch[${index}].ref`);
			operations.push(buildRefAssignmentOperation({
				requestedPath: path,
				ref,
				inputMode: "json"
			}));
			continue;
		}
		if (entry.provider !== void 0) {
			const alias = parseProviderAliasPath(path);
			const validated = require_zod_schema_core.SecretProviderSchema.safeParse(entry.provider);
			if (!validated.success) {
				const issue = validated.error.issues[0];
				const issuePath = issue?.path?.join(".") ?? "<provider>";
				throw new Error(`batch[${index}].provider invalid at ${issuePath}: ${issue?.message ?? ""}`);
			}
			operations.push({
				inputMode: "json",
				requestedPath: path,
				setPath: path,
				value: validated.data,
				schemaValidated: true,
				touchedProviderAlias: alias
			});
			continue;
		}
		operations.push(buildValueAssignmentOperation({
			requestedPath: path,
			value: entry.value,
			inputMode: "json"
		}));
	}
	return operations;
}
function collectSecretRefsFromUnknown(value) {
	const refs = [];
	const visit = (candidate) => {
		const ref = require_types_secrets.coerceSecretRef(candidate);
		if (ref) {
			refs.push(ref);
			return;
		}
		if (Array.isArray(candidate)) {
			for (const entry of candidate) visit(entry);
			return;
		}
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(candidate)) for (const entry of Object.values(candidate)) visit(entry);
	};
	visit(value);
	return refs;
}
function modeError(message) {
	return /* @__PURE__ */ new Error(`config set mode error: ${message}`);
}
function buildSingleSetOperations(params) {
	const pathProvided = typeof params.path === "string" && params.path.trim().length > 0;
	const parsedPath = pathProvided ? parseConfigSetPath(params.path) : null;
	const strictJson = Boolean(params.opts.strictJson || params.opts.json);
	const modeResolution = resolveConfigSetMode({
		hasBatchMode: false,
		hasRefBuilderOptions: hasRefBuilderOptions(params.opts),
		hasProviderBuilderOptions: hasProviderBuilderOptions(params.opts),
		strictJson
	});
	if (!modeResolution.ok) throw modeError(modeResolution.error);
	if (modeResolution.mode === "ref_builder") {
		if (!pathProvided || !parsedPath) throw modeError("ref builder mode requires <path>.");
		if (params.value !== void 0) throw modeError("ref builder mode does not accept <value>.");
		if (!params.opts.refProvider || !params.opts.refSource || !params.opts.refId) throw modeError("ref builder mode requires --ref-provider <alias>, --ref-source <env|file|exec>, and --ref-id <id>.");
		return [buildRefAssignmentOperation({
			requestedPath: parsedPath,
			ref: parseSecretRefBuilder({
				provider: params.opts.refProvider,
				source: params.opts.refSource,
				id: params.opts.refId,
				fieldPrefix: "ref"
			}),
			inputMode: "builder"
		})];
	}
	if (modeResolution.mode === "provider_builder") {
		if (!pathProvided || !parsedPath) throw modeError("provider builder mode requires <path>.");
		if (params.value !== void 0) throw modeError("provider builder mode does not accept <value>.");
		const alias = parseProviderAliasPath(parsedPath);
		return [{
			inputMode: "builder",
			requestedPath: parsedPath,
			setPath: parsedPath,
			value: buildProviderFromBuilder(params.opts),
			schemaValidated: true,
			touchedProviderAlias: alias
		}];
	}
	if (!pathProvided || !parsedPath) throw modeError("value/json mode requires <path> when batch mode is not used.");
	if (params.value === void 0) throw modeError("value/json mode requires <value>.");
	return [buildValueAssignmentOperation({
		requestedPath: parsedPath,
		value: parseValue(params.value, { strictJson }),
		inputMode: modeResolution.mode === "json" ? "json" : "value"
	})];
}
function collectDryRunRefs(params) {
	const refsByKey = /* @__PURE__ */ new Map();
	const targetPaths = /* @__PURE__ */ new Set();
	const providerAliases = /* @__PURE__ */ new Set();
	let includeAllDiscoveredRefs = false;
	for (const operation of params.operations) {
		if (operation.assignedRef) refsByKey.set(require_ref_contract.secretRefKey(operation.assignedRef), operation.assignedRef);
		for (const ref of collectSecretRefsFromUnknown(operation.value)) refsByKey.set(require_ref_contract.secretRefKey(ref), ref);
		if (operation.touchedSecretTargetPath) targetPaths.add(operation.touchedSecretTargetPath);
		if (operation.touchedProviderAlias) providerAliases.add(operation.touchedProviderAlias);
		includeAllDiscoveredRefs ||= operation.touchesAllSecretRefs === true;
	}
	if (!includeAllDiscoveredRefs && targetPaths.size === 0 && providerAliases.size === 0) return [...refsByKey.values()];
	const defaults = params.config.secrets?.defaults;
	for (const target of require_target_registry.discoverConfigSecretTargets(params.config)) {
		const { ref } = require_types_secrets.resolveSecretInputRef({
			value: target.value,
			refValue: target.refValue,
			defaults
		});
		if (!ref) continue;
		if (includeAllDiscoveredRefs || targetPaths.has(target.path) || providerAliases.has(ref.provider)) refsByKey.set(require_ref_contract.secretRefKey(ref), ref);
	}
	return [...refsByKey.values()];
}
async function collectDryRunResolvabilityErrors(params) {
	const failures = [];
	for (const ref of params.refs) try {
		await require_resolve.resolveSecretRefValue(ref, {
			config: params.config,
			env: process.env
		});
	} catch (err) {
		failures.push({
			kind: "resolvability",
			message: String(err),
			ref: `${ref.source}:${ref.provider}:${ref.id}`
		});
	}
	return failures;
}
function collectDryRunStaticErrorsForSkippedExecRefs(params) {
	const failures = [];
	for (const ref of params.refs) {
		const id = ref.id.trim();
		const refLabel = `${ref.source}:${ref.provider}:${id}`;
		if (!id) {
			failures.push({
				kind: "resolvability",
				message: "Error: Secret reference id is empty.",
				ref: refLabel
			});
			continue;
		}
		if (!require_ref_contract.isValidExecSecretRefId(id)) {
			failures.push({
				kind: "resolvability",
				message: `Error: ${require_ref_contract.formatExecSecretRefIdValidationMessage()} (ref: ${refLabel}).`,
				ref: refLabel
			});
			continue;
		}
		const providerConfig = params.config.secrets?.providers?.[ref.provider];
		if (!providerConfig) {
			failures.push({
				kind: "resolvability",
				message: `Error: Secret provider "${ref.provider}" is not configured (ref: ${refLabel}).`,
				ref: refLabel
			});
			continue;
		}
		if (providerConfig.source !== ref.source) failures.push({
			kind: "resolvability",
			message: `Error: Secret provider "${ref.provider}" has source "${providerConfig.source}" but ref requests "${ref.source}".`,
			ref: refLabel
		});
	}
	return failures;
}
function selectDryRunRefsForResolution(params) {
	const refsToResolve = [];
	const skippedExecRefs = [];
	for (const ref of params.refs) {
		if (ref.source === "exec" && !params.allowExecInDryRun) {
			skippedExecRefs.push(ref);
			continue;
		}
		refsToResolve.push(ref);
	}
	return {
		refsToResolve,
		skippedExecRefs
	};
}
function pathStartsWith(path, prefix) {
	return prefix.every((segment, index) => path[index] === segment);
}
function formatPluginInstallConfigSetError() {
	return [
		"plugins.installs is managed by the plugin index and cannot be edited with config set.",
		"",
		"Use plugin commands instead:",
		`  ${require_command_format.formatCliCommand("openclaw plugins install <spec>")}`,
		`  ${require_command_format.formatCliCommand("openclaw plugins update <plugin-id>")}`,
		`  ${require_command_format.formatCliCommand("openclaw plugins uninstall <plugin-id>")}`
	].join("\n");
}
function isAutoManagedMetaPath(path) {
	return require_io.AUTO_MANAGED_CONFIG_META_PATHS.some((managedPath) => pathStartsWith(path, managedPath));
}
function valueHasAutoManagedChild(value, childPath) {
	let cursor = value;
	for (const segment of childPath) {
		if (cursor === null || typeof cursor !== "object" || Array.isArray(cursor)) return false;
		if (typeof segment !== "string") return false;
		const record = cursor;
		if (!Object.hasOwn(record, segment)) return false;
		cursor = record[segment];
	}
	return cursor !== void 0;
}
function operationClobbersAncestorChild(operation, managedPath, options) {
	if (operation.mutation === "delete") return true;
	const childPath = managedPath.slice(operation.requestedPath.length);
	if (operation.mutation === "merge" || Boolean(options.merge) && operation.mutation !== "replace") return valueHasAutoManagedChild(operation.value, childPath);
	return true;
}
function findAutoManagedMetaTargets(operations, options = {}) {
	const matches = [];
	const seen = /* @__PURE__ */ new Set();
	const record = (path) => {
		const segments = [...path];
		const key = toDotPath(segments);
		if (seen.has(key)) return;
		seen.add(key);
		matches.push(segments);
	};
	for (const operation of operations) {
		if (isAutoManagedMetaPath(operation.requestedPath)) {
			record(operation.requestedPath);
			continue;
		}
		for (const managedPath of require_io.AUTO_MANAGED_CONFIG_META_PATHS) {
			if (operation.requestedPath.length >= managedPath.length) continue;
			if (!pathStartsWith(managedPath, operation.requestedPath)) continue;
			if (operationClobbersAncestorChild(operation, managedPath, options)) record(managedPath);
		}
	}
	return matches;
}
function formatAutoManagedMetaError(paths) {
	const targets = paths.map((path) => toDotPath(path));
	return [
		`${targets.length === 1 ? targets[0] : targets.join(", ")} is auto-managed by Operator and cannot be edited; the value would be overwritten on the next config write.`,
		"",
		"These fields are stamped on every config write to record the Operator version and timestamp that produced the file."
	].join("\n");
}
async function loadConfigMutationSchema() {
	try {
		return structuredClone((await require_runtime_schema.readBestEffortRuntimeConfigSchema()).schema);
	} catch {
		return;
	}
}
function collectDryRunSchemaErrors(params) {
	const validated = require_io.validateConfigObjectRawWithPlugins(params.config);
	if (validated.ok) return [];
	return require_io.formatConfigIssueLines(validated.issues, "-", { normalizeRoot: true }).map((message) => ({
		kind: "schema",
		message
	}));
}
function collectPluginIntegrationProviderErrors(params) {
	const providers = params.config.secrets?.providers ?? {};
	let validateAllProviders = false;
	const touchedProviderAliases = /* @__PURE__ */ new Set();
	for (const operation of params.operations) {
		if (operation.touchedProviderAlias) touchedProviderAliases.add(operation.touchedProviderAlias);
		if (operation.assignedRef) touchedProviderAliases.add(operation.assignedRef.provider);
		for (const ref of collectSecretRefsFromUnknown(operation.value)) touchedProviderAliases.add(ref.provider);
		if (touchesSecretProviderCollection(operation.setPath)) validateAllProviders = true;
	}
	if (!validateAllProviders && touchedProviderAliases.size === 0) return [];
	const integrationProviders = [];
	for (const [alias, provider] of Object.entries(providers)) {
		if (!validateAllProviders && !touchedProviderAliases.has(alias)) continue;
		if (require_resolve.isPluginIntegrationSecretProviderConfig(provider)) integrationProviders.push({
			alias,
			provider
		});
	}
	if (integrationProviders.length === 0) return [];
	const manifestRegistry = require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config: params.config,
		env: process.env
	}).manifestRegistry;
	const errors = [];
	for (const { alias, provider } of integrationProviders) {
		const resolved = require_resolve.resolveSecretProviderIntegrationConfig({
			manifestRegistry,
			providerAlias: alias,
			providerConfig: provider,
			config: params.config,
			env: process.env
		});
		if (!resolved.ok) errors.push({
			kind: "schema",
			message: `secrets.providers.${alias}: ${resolved.reason}`
		});
	}
	return errors;
}
function dedupeDryRunErrors(errors) {
	const deduped = [];
	const seen = /* @__PURE__ */ new Set();
	for (const error of errors) {
		const key = error.kind === "resolvability" ? `${error.kind}\u0000${error.ref ?? ""}\u0000${error.message}` : `${error.kind}\u0000${error.message}`;
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(error);
	}
	return deduped;
}
function formatDryRunFailureMessage(params) {
	const { errors, skippedExecRefs } = params;
	const missingPathErrors = errors.filter((error) => error.kind === "missing-path");
	const schemaErrors = errors.filter((error) => error.kind === "schema");
	const resolveErrors = errors.filter((error) => error.kind === "resolvability");
	const lines = [];
	if (missingPathErrors.length > 0) lines.push(...missingPathErrors.map((error) => error.message));
	if (schemaErrors.length > 0) {
		lines.push("Dry run failed: config schema validation failed.");
		lines.push(...schemaErrors.map((error) => `- ${error.message}`));
	}
	if (resolveErrors.length > 0) {
		lines.push(`Dry run failed: ${resolveErrors.length} SecretRef assignment(s) could not be resolved.`);
		lines.push(...resolveErrors.slice(0, 5).map((error) => `- ${error.ref ?? "<unknown-ref>"} -> ${error.message}`));
		if (resolveErrors.length > 5) lines.push(`- ... ${resolveErrors.length - 5} more`);
	}
	if (skippedExecRefs > 0) lines.push(`Dry run note: skipped ${skippedExecRefs} exec SecretRef resolvability check(s). Re-run with --allow-exec to execute exec providers during dry-run.`);
	return lines.join("\n");
}
async function runConfigOperations(params) {
	const { runtime, operations, options } = params;
	if (operations.some((operation) => pathStartsWith(operation.requestedPath, PLUGIN_INSTALL_RECORD_PATH_PREFIX))) throw new Error(formatPluginInstallConfigSetError());
	const autoManagedMetaTargets = findAutoManagedMetaTargets(operations, { merge: options.merge });
	if (autoManagedMetaTargets.length > 0) throw new Error(formatAutoManagedMetaError(autoManagedMetaTargets));
	const snapshot = await loadValidConfig(runtime);
	const next = structuredClone(snapshot.resolved);
	const currentConfigForApplyHint = normalizeConfigMutationModelRefs(structuredClone(snapshot.resolved));
	const mutationSchema = await loadConfigMutationSchema();
	const unsetPaths = [];
	const explicitSetPaths = [];
	for (const operation of operations) {
		if (operation.mutation === "delete") {
			unsetAtPath(next, operation.setPath);
			unsetPaths.push(operation.setPath);
			continue;
		}
		explicitSetPaths.push(operation.setPath);
		if (operation.mutation === "merge" || options.merge && operation.mutation !== "replace") mergeAtPath(next, operation.setPath, operation.value, {
			numericObjectKeys: params.successMode === "patch",
			schema: mutationSchema
		});
		else {
			assertNonDestructiveReplacement({
				root: next,
				path: operation.setPath,
				value: operation.value,
				allowReplace: options.replace || operation.mutation === "replace"
			});
			setAtPath(next, operation.setPath, operation.value, {
				numericObjectKeys: params.successMode === "patch",
				schema: mutationSchema
			});
		}
	}
	const removedGatewayAuthPaths = pruneInactiveGatewayAuthCredentials({
		root: next,
		operations
	});
	const nextConfig = normalizeConfigMutationModelRefs(next);
	const normalizedExplicitSetPaths = explicitSetPaths.map(normalizeConfigMutationExplicitSetPath);
	const policyIssueLines = require_io.formatConfigIssueLines(require_io.collectUnsupportedSecretRefPolicyIssues(nextConfig), "", { normalizeRoot: true }).map((line) => line.trim());
	const pluginIntegrationProviderErrors = collectPluginIntegrationProviderErrors({
		config: nextConfig,
		operations
	});
	if (options.dryRun) {
		const hasJsonMode = operations.some((operation) => operation.inputMode === "json");
		const hasBuilderMode = operations.some((operation) => operation.inputMode === "builder");
		const hasUnsetMode = operations.some((operation) => operation.inputMode === "unset");
		const requiresFullSchemaValidation = operations.some((operation) => operation.inputMode === "unset" || operation.inputMode === "json" && operation.schemaValidated !== true);
		const selectedDryRunRefs = selectDryRunRefsForResolution({
			refs: hasJsonMode || hasBuilderMode || hasUnsetMode ? collectDryRunRefs({
				config: nextConfig,
				operations
			}) : [],
			allowExecInDryRun: Boolean(options.allowExec)
		});
		const errors = [];
		if ((!hasJsonMode || !requiresFullSchemaValidation) && policyIssueLines.length > 0) errors.push(...policyIssueLines.map((message) => ({
			kind: "schema",
			message
		})));
		errors.push(...pluginIntegrationProviderErrors);
		if (requiresFullSchemaValidation) errors.push(...collectDryRunSchemaErrors({ config: nextConfig }));
		if (hasJsonMode || hasBuilderMode || hasUnsetMode) {
			errors.push(...collectDryRunStaticErrorsForSkippedExecRefs({
				refs: selectedDryRunRefs.skippedExecRefs,
				config: nextConfig
			}));
			errors.push(...await collectDryRunResolvabilityErrors({
				refs: selectedDryRunRefs.refsToResolve,
				config: nextConfig
			}));
		}
		const dedupedErrors = dedupeDryRunErrors(errors);
		const dryRunResult = {
			ok: dedupedErrors.length === 0,
			operations: operations.length,
			configPath: require_utils.shortenHomePath(snapshot.path),
			inputModes: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueValues)(operations.map((operation) => operation.inputMode)),
			checks: {
				schema: requiresFullSchemaValidation || policyIssueLines.length > 0 || pluginIntegrationProviderErrors.length > 0,
				resolvability: hasJsonMode || hasBuilderMode || hasUnsetMode,
				resolvabilityComplete: (hasJsonMode || hasBuilderMode || hasUnsetMode) && selectedDryRunRefs.skippedExecRefs.length === 0
			},
			refsChecked: selectedDryRunRefs.refsToResolve.length,
			skippedExecRefs: selectedDryRunRefs.skippedExecRefs.length,
			...dedupedErrors.length > 0 ? { errors: dedupedErrors } : {}
		};
		if (dedupedErrors.length > 0) {
			if (options.json) throw new ConfigSetDryRunValidationError(dryRunResult);
			throw new Error(formatDryRunFailureMessage({
				errors: dedupedErrors,
				skippedExecRefs: selectedDryRunRefs.skippedExecRefs.length
			}));
		}
		if (options.json) require_runtime.writeRuntimeJson(runtime, dryRunResult);
		else {
			if (!dryRunResult.checks.schema && !dryRunResult.checks.resolvability) runtime.log(require_globals.info("Dry run note: value mode does not run schema/resolvability checks. Use --strict-json, builder flags, or batch mode to enable validation checks."));
			if (dryRunResult.skippedExecRefs > 0) runtime.log(require_globals.info(`Dry run note: skipped ${dryRunResult.skippedExecRefs} exec SecretRef resolvability check(s). Re-run with --allow-exec to execute exec providers during dry-run.`));
			runtime.log(require_globals.info(`Dry run successful: ${operations.length} update(s) validated against ${require_utils.shortenHomePath(snapshot.path)}.`));
		}
		return;
	}
	if (policyIssueLines.length > 0) throw new Error(formatUnsupportedSecretRefPolicyFailureMessage(policyIssueLines));
	if (pluginIntegrationProviderErrors.length > 0) throw new Error(["Config validation failed: plugin-managed SecretRef provider integration is invalid.", ...pluginIntegrationProviderErrors.map((error) => `- ${error.message}`)].join("\n"));
	await require_config.replaceConfigFile({
		nextConfig,
		...snapshot.hash !== void 0 ? { baseHash: snapshot.hash } : {},
		...unsetPaths.length > 0 || explicitSetPaths.length > 0 ? { writeOptions: {
			...unsetPaths.length > 0 ? { unsetPaths } : {},
			...normalizedExplicitSetPaths.length > 0 ? { explicitSetPaths: normalizedExplicitSetPaths } : {}
		} } : {}
	});
	if (removedGatewayAuthPaths.length > 0) runtime.log(require_globals.info(`Removed inactive ${removedGatewayAuthPaths.join(", ")} for gateway.auth.mode=${nextConfig.gateway?.auth?.mode ?? "<unset>"}.`));
	if (params.successMode === "set" && operations.length === 1) {
		const operation = operations[0];
		const action = operation?.mutation === "delete" ? "Removed" : "Updated";
		const hint = configApplyHintForOperations(operations, currentConfigForApplyHint, nextConfig);
		runtime.log(require_globals.info(`${action} ${toDotPath(operation?.requestedPath ?? [])}. ${hint}`));
		return;
	}
	const hint = configApplyHintForOperations(operations, currentConfigForApplyHint, nextConfig);
	if (params.successMode === "set") {
		runtime.log(require_globals.info(`Updated ${operations.length} config paths. ${hint}`));
		return;
	}
	runtime.log(require_globals.info(`Applied ${operations.length} config update(s). ${hint}`));
}
function handleConfigMutationError(params) {
	if (params.options.dryRun && params.options.json && params.err instanceof ConfigSetDryRunValidationError) {
		require_runtime.writeRuntimeJson(params.runtime, params.err.result);
		params.runtime.exit(1);
		return;
	}
	params.runtime.error(require_globals.danger(String(params.err)));
	params.runtime.exit(1);
}
async function runConfigSet(opts) {
	const runtime = opts.runtime ?? require_runtime.defaultRuntime;
	try {
		const modeResolution = resolveConfigSetMode({
			hasBatchMode: hasBatchMode(opts.cliOptions),
			hasRefBuilderOptions: hasRefBuilderOptions(opts.cliOptions),
			hasProviderBuilderOptions: hasProviderBuilderOptions(opts.cliOptions),
			strictJson: Boolean(opts.cliOptions.strictJson || opts.cliOptions.json)
		});
		if (!modeResolution.ok) throw modeError(modeResolution.error);
		if (opts.cliOptions.allowExec && !opts.cliOptions.dryRun) throw modeError("--allow-exec requires --dry-run.");
		if (opts.cliOptions.merge && opts.cliOptions.replace) throw modeError("choose either --merge or --replace, not both.");
		const batchEntries = parseBatchSource(opts.cliOptions);
		if (batchEntries) {
			if (opts.path !== void 0 || opts.value !== void 0) throw modeError("batch mode does not accept <path> or <value> arguments.");
		}
		await runConfigOperations({
			runtime,
			operations: batchEntries ? parseBatchOperations(batchEntries) : buildSingleSetOperations({
				path: opts.path,
				value: opts.value,
				opts: opts.cliOptions
			}),
			options: opts.cliOptions,
			successMode: "set"
		});
	} catch (err) {
		handleConfigMutationError({
			err,
			runtime,
			options: opts.cliOptions
		});
	}
}
//#endregion
exports.parseConfigSetPath = parseConfigSetPath;
exports.runConfigSet = runConfigSet;
