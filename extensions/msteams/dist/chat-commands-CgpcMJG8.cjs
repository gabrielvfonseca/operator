const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./json-files-Bp0Z4DKb.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_filter = require("./agent-filter-D9eRLjzT.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_bundle_manifest = require("./bundle-manifest-DNijUZc1.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_commands_registry_data = require("./commands-registry.data-Yy8_zwjC.cjs");
const require_frontmatter = require("./frontmatter-WKYeKqrx.cjs");
require("./scan-paths-bPESVZQ5.cjs");
const require_source = require("./source-Bzj4-gl0.cjs");
const require_workspace = require("./workspace-BaJ9ukou.cjs");
const require_curator = require("./curator-D3crpveo.cjs");
const require_exec_defaults = require("./exec-defaults-DvQXwpzS.cjs");
const require_remote = require("./remote-Dds9m5_I.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/skills/discovery/chat-command-invocation.ts
/** Lists slash command names reserved by built-in chat commands and callers. */
function listReservedChatSlashCommandNames(extraNames = []) {
	const reserved = /* @__PURE__ */ new Set();
	for (const command of require_commands_registry_data.getChatCommands()) {
		if (command.nativeName) reserved.add((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(command.nativeName) ?? "");
		for (const alias of command.textAliases) {
			const trimmed = alias.trim();
			if (!trimmed.startsWith("/")) continue;
			reserved.add((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed.slice(1)));
		}
	}
	for (const name of extraNames) {
		const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(name);
		if (trimmed) reserved.add(trimmed);
	}
	return reserved;
}
function normalizeSkillCommandLookup(value) {
	return ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value) ?? "").replace(/[\s_]+/g, "-");
}
function findSkillCommand(skillCommands, rawName) {
	const trimmed = rawName.trim();
	if (!trimmed) return;
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(trimmed) ?? "";
	const normalized = normalizeSkillCommandLookup(trimmed);
	return skillCommands.find((entry) => {
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry.name) === lowered) return true;
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry.skillName) === lowered) return true;
		return normalizeSkillCommandLookup(entry.name) === normalized || normalizeSkillCommandLookup(entry.skillName) === normalized;
	});
}
function resolveSkillCommandInvocation(params) {
	const trimmed = params.commandBodyNormalized.trim();
	if (!trimmed.startsWith("/")) return null;
	const match = trimmed.match(/^\/([^\s]+)(?:\s+([\s\S]+))?$/);
	if (!match) return null;
	const commandName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(match[1]);
	if (!commandName) return null;
	if (commandName === "skill") {
		const remainder = match[2]?.trim();
		if (!remainder) return null;
		const skillMatch = remainder.match(/^([^\s]+)(?:\s+([\s\S]+))?$/);
		if (!skillMatch) return null;
		const skillCommand = findSkillCommand(params.skillCommands, skillMatch[1] ?? "");
		if (!skillCommand) return null;
		return {
			command: skillCommand,
			args: skillMatch[2]?.trim() || void 0
		};
	}
	const command = params.skillCommands.find((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry.name) === commandName);
	if (!command) return null;
	return {
		command,
		args: match[2]?.trim() || void 0
	};
}
//#endregion
//#region src/plugins/bundle-commands.ts
function parseFrontmatterBool(value, fallback) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (!normalized) return fallback;
	if (normalized === "true" || normalized === "yes" || normalized === "1") return true;
	if (normalized === "false" || normalized === "no" || normalized === "0") return false;
	return fallback;
}
function readClaudeBundleManifest(rootDir) {
	const result = (0, _openclaw_fs_safe_json.readRootJsonObjectSync)({
		rootDir,
		relativePath: require_bundle_manifest.CLAUDE_BUNDLE_MANIFEST_RELATIVE_PATH,
		boundaryLabel: "plugin root",
		rejectHardlinks: true
	});
	return result.ok ? result.value : {};
}
function resolveClaudeCommandRootDirs(rootDir) {
	const declared = require_bundle_manifest.normalizeBundlePathList(readClaudeBundleManifest(rootDir).commands);
	return require_bundle_manifest.mergeBundlePathLists(node_fs.default.existsSync(node_path.default.join(rootDir, "commands")) ? ["commands"] : [], declared);
}
function listMarkdownFilesRecursive(rootDir) {
	const pending = [rootDir];
	const files = [];
	while (pending.length > 0) {
		const current = pending.pop();
		if (!current) continue;
		let entries;
		try {
			entries = node_fs.default.readdirSync(current, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (entry.name.startsWith(".")) continue;
			const fullPath = node_path.default.join(current, entry.name);
			if (entry.isDirectory()) {
				pending.push(fullPath);
				continue;
			}
			if (entry.isFile() && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry.name)?.endsWith(".md")) files.push(fullPath);
		}
	}
	return files.toSorted((a, b) => a.localeCompare(b));
}
function toDefaultCommandName(rootDir, filePath) {
	return node_path.default.relative(rootDir, filePath).replace(/\.[^.]+$/u, "").split(node_path.default.sep).join(":");
}
function toDefaultDescription(rawName, promptTemplate) {
	return promptTemplate.split(/\r?\n/u).map((line) => line.trim()).find(Boolean) || rawName;
}
function loadBundleCommandsFromRoot(params) {
	const entries = [];
	for (const filePath of listMarkdownFilesRecursive(params.commandRoot)) {
		let raw;
		try {
			raw = node_fs.default.readFileSync(filePath, "utf-8");
		} catch {
			continue;
		}
		const frontmatter = require_frontmatter.parseFrontmatterBlock(raw);
		if (parseFrontmatterBool(frontmatter["disable-model-invocation"], false)) continue;
		const promptTemplate = require_frontmatter.stripFrontmatterBlock(raw);
		if (!promptTemplate) continue;
		const rawName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(frontmatter.name) || toDefaultCommandName(params.commandRoot, filePath);
		if (!rawName) continue;
		const description = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(frontmatter.description) || toDefaultDescription(rawName, promptTemplate);
		entries.push({
			pluginId: params.pluginId,
			rawName,
			description,
			promptTemplate,
			sourceFilePath: filePath
		});
	}
	return entries;
}
function loadEnabledClaudeBundleCommands(params) {
	if (!require_config_state.hasExplicitPluginConfig(params.cfg?.plugins)) return [];
	const registry = require_plugin_registry.loadPluginManifestRegistryForPluginRegistry({
		workspaceDir: params.workspaceDir,
		config: params.cfg,
		includeDisabled: true
	});
	const normalizedPlugins = require_config_state.normalizePluginsConfig(params.cfg?.plugins);
	const commands = [];
	for (const record of registry.plugins) {
		if (record.format !== "bundle" || record.bundleFormat !== "claude" || !(record.bundleCapabilities ?? []).includes("commands")) continue;
		if (!require_config_state.resolveEffectivePluginActivationState({
			id: record.id,
			origin: record.origin,
			config: normalizedPlugins,
			rootConfig: params.cfg
		}).activated) continue;
		for (const relativeRoot of resolveClaudeCommandRootDirs(record.rootDir)) {
			const commandRoot = node_path.default.resolve(record.rootDir, relativeRoot);
			if (!node_fs.default.existsSync(commandRoot)) continue;
			if (!(0, _openclaw_fs_safe_path.isPathInsideWithRealpath)(record.rootDir, commandRoot, { requireRealpath: true })) continue;
			commands.push(...loadBundleCommandsFromRoot({
				pluginId: record.id,
				commandRoot
			}));
		}
	}
	return commands;
}
//#endregion
//#region src/skills/discovery/command-specs.ts
const skillsLogger = require_subsystem.createSubsystemLogger("skills");
const skillCommandDebugOnce = /* @__PURE__ */ new Set();
const SKILL_COMMAND_MAX_LENGTH = 32;
const SKILL_COMMAND_FALLBACK = "skill";
function debugSkillCommandOnce(messageKey, message, meta) {
	if (skillCommandDebugOnce.has(messageKey)) return;
	skillCommandDebugOnce.add(messageKey);
	skillsLogger.debug(message, meta);
}
function traceSkillCommandOnce(messageKey, message, meta) {
	if (skillCommandDebugOnce.has(messageKey)) return;
	skillCommandDebugOnce.add(messageKey);
	skillsLogger.trace(message, meta);
}
function sanitizeSkillCommandName(raw) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw).replace(/[^a-z0-9_]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, SKILL_COMMAND_MAX_LENGTH) || SKILL_COMMAND_FALLBACK;
}
function resolveUniqueSkillCommandName(base, used) {
	const normalizedBase = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(base);
	if (!used.has(normalizedBase)) return base;
	for (let index = 2; index < 1e3; index += 1) {
		const suffix = `_${index}`;
		const maxBaseLength = Math.max(1, SKILL_COMMAND_MAX_LENGTH - suffix.length);
		const candidate = `${base.slice(0, maxBaseLength)}${suffix}`;
		const candidateKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(candidate);
		if (!used.has(candidateKey)) return candidate;
	}
	return `${base.slice(0, Math.max(1, SKILL_COMMAND_MAX_LENGTH - 2))}_x`;
}
/** Builds user-invocable slash command specs for visible workspace skills. */
function buildWorkspaceSkillCommandSpecs(workspaceDir, opts) {
	const effectiveSkillFilter = opts?.skillFilter ?? require_agent_filter.resolveEffectiveAgentSkillFilter(opts?.config, opts?.agentId);
	const userInvocable = require_curator.filterUserInvocableSkillEntries(opts?.entries ? require_workspace.filterWorkspaceSkillEntriesWithOptions(opts.entries, {
		config: opts?.config,
		skillFilter: effectiveSkillFilter,
		eligibility: opts?.eligibility
	}) : require_workspace.loadVisibleWorkspaceSkillEntries(workspaceDir, {
		config: opts?.config,
		managedSkillsDir: opts?.managedSkillsDir,
		bundledSkillsDir: opts?.bundledSkillsDir,
		skillFilter: effectiveSkillFilter,
		eligibility: opts?.eligibility
	}));
	const used = /* @__PURE__ */ new Set();
	for (const reserved of opts?.reservedNames ?? []) used.add((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(reserved));
	const specs = [];
	for (const entry of userInvocable) {
		const rawName = entry.skill.name;
		const base = sanitizeSkillCommandName(rawName);
		if (base !== rawName) traceSkillCommandOnce(`sanitize:${rawName}:${base}`, `Sanitized skill command name "${rawName}" to "/${base}".`, {
			rawName,
			sanitized: `/${base}`
		});
		const unique = resolveUniqueSkillCommandName(base, used);
		if (unique !== base) traceSkillCommandOnce(`dedupe:${rawName}:${unique}`, `De-duplicated skill command name for "${rawName}" to "/${unique}".`, {
			rawName,
			deduped: `/${unique}`
		});
		used.add((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(unique));
		const description = entry.skill.description?.trim() || rawName;
		const dispatch = entry.disableCommandDispatch ? void 0 : (() => {
			const kindRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry.frontmatter?.["command-dispatch"] ?? entry.frontmatter?.["command_dispatch"] ?? "");
			if (!kindRaw || kindRaw !== "tool") return;
			const toolName = (entry.frontmatter?.["command-tool"] ?? entry.frontmatter?.["command_tool"] ?? "").trim();
			if (!toolName) {
				debugSkillCommandOnce(`dispatch:missingTool:${rawName}`, `Skill command "/${unique}" requested tool dispatch but did not provide command-tool. Ignoring dispatch.`, {
					skillName: rawName,
					command: unique
				});
				return;
			}
			const argModeRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry.frontmatter?.["command-arg-mode"] ?? entry.frontmatter?.["command_arg_mode"] ?? "");
			if (!(!argModeRaw || argModeRaw === "raw" ? "raw" : null)) debugSkillCommandOnce(`dispatch:badArgMode:${rawName}:${argModeRaw}`, `Skill command "/${unique}" requested tool dispatch but has unknown command-arg-mode. Falling back to raw.`, {
				skillName: rawName,
				command: unique,
				argMode: argModeRaw
			});
			return {
				kind: "tool",
				toolName,
				argMode: "raw"
			};
		})();
		specs.push({
			name: unique,
			skillFile: require_curator.canonicalizePath(entry.skill.filePath),
			skillName: rawName,
			description,
			skillSource: require_source.resolveSkillTelemetrySource(entry.skill),
			...dispatch ? { dispatch } : {}
		});
	}
	const bundleCommands = loadEnabledClaudeBundleCommands({
		workspaceDir,
		cfg: opts?.config
	});
	for (const entry of bundleCommands) {
		const base = sanitizeSkillCommandName(entry.rawName);
		if (base !== entry.rawName) debugSkillCommandOnce(`bundle-sanitize:${entry.rawName}:${base}`, `Sanitized bundle command name "${entry.rawName}" to "/${base}".`, {
			rawName: entry.rawName,
			sanitized: `/${base}`
		});
		const unique = resolveUniqueSkillCommandName(base, used);
		if (unique !== base) debugSkillCommandOnce(`bundle-dedupe:${entry.rawName}:${unique}`, `De-duplicated bundle command name for "${entry.rawName}" to "/${unique}".`, {
			rawName: entry.rawName,
			deduped: `/${unique}`
		});
		used.add((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(unique));
		specs.push({
			name: unique,
			skillName: entry.rawName,
			description: entry.description,
			promptTemplate: entry.promptTemplate,
			sourceFilePath: entry.sourceFilePath
		});
	}
	return specs;
}
//#endregion
//#region src/skills/discovery/chat-commands.ts
function listSkillCommandsForWorkspace(params) {
	const nodeSkills = require_exec_defaults.resolveNodeExecEligibility({
		cfg: params.cfg,
		agentId: params.agentId,
		sessionEntry: params.sessionEntry,
		sessionKey: params.sessionKey,
		execOverrides: params.execOverrides
	});
	return buildWorkspaceSkillCommandSpecs(params.workspaceDir, {
		config: params.cfg,
		agentId: params.agentId,
		skillFilter: params.skillFilter,
		eligibility: {
			nodeSkills,
			remote: require_remote.getRemoteSkillEligibility({ advertiseExecNode: nodeSkills.canExec })
		},
		reservedNames: listReservedChatSlashCommandNames()
	});
}
function dedupeBySkillName(commands) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const cmd of commands) {
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(cmd.skillName);
		if (key && seen.has(key)) continue;
		if (key) seen.add(key);
		out.push(cmd);
	}
	return out;
}
function listSkillCommandsForAgents(params) {
	const agentIds = params.agentIds ?? require_agent_scope_config.listAgentIds(params.cfg);
	const used = listReservedChatSlashCommandNames();
	const entries = [];
	const hasSingleAgentContext = agentIds.length === 1;
	const workspaceAgents = [];
	for (const agentId of agentIds) {
		const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId);
		if (!node_fs.default.existsSync(workspaceDir)) {
			require_globals.logVerbose(`Skipping agent "${agentId}": workspace does not exist: ${workspaceDir}`);
			continue;
		}
		try {
			node_fs.default.realpathSync(workspaceDir);
		} catch {
			require_globals.logVerbose(`Skipping agent "${agentId}": cannot resolve workspace: ${workspaceDir}`);
			continue;
		}
		workspaceAgents.push({
			agentId,
			workspaceDir,
			skillFilter: require_agent_filter.resolveEffectiveAgentSkillFilter(params.cfg, agentId)
		});
	}
	for (const { agentId, workspaceDir, skillFilter } of workspaceAgents) {
		const nodeSkills = require_exec_defaults.resolveNodeExecEligibility({
			cfg: params.cfg,
			agentId,
			...hasSingleAgentContext ? {
				sessionEntry: params.sessionEntry,
				sessionKey: params.sessionKey,
				execOverrides: params.execOverrides
			} : {}
		});
		const commands = buildWorkspaceSkillCommandSpecs(workspaceDir, {
			config: params.cfg,
			agentId,
			skillFilter,
			eligibility: {
				nodeSkills,
				remote: require_remote.getRemoteSkillEligibility({ advertiseExecNode: nodeSkills.canExec })
			},
			reservedNames: used
		});
		for (const command of commands) {
			used.add((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(command.name));
			entries.push(command);
		}
	}
	return dedupeBySkillName(entries).toSorted((left, right) => left.skillName.localeCompare(right.skillName, "en"));
}
//#endregion
Object.defineProperty(exports, "listReservedChatSlashCommandNames", {
	enumerable: true,
	get: function() {
		return listReservedChatSlashCommandNames;
	}
});
Object.defineProperty(exports, "listSkillCommandsForAgents", {
	enumerable: true,
	get: function() {
		return listSkillCommandsForAgents;
	}
});
Object.defineProperty(exports, "listSkillCommandsForWorkspace", {
	enumerable: true,
	get: function() {
		return listSkillCommandsForWorkspace;
	}
});
Object.defineProperty(exports, "resolveSkillCommandInvocation", {
	enumerable: true,
	get: function() {
		return resolveSkillCommandInvocation;
	}
});
