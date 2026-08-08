const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_frontmatter = require("./frontmatter-WKYeKqrx.cjs");
const require_config = require("./config-BmhbwvVp.cjs");
const require_status = require("./status-BcOaWXbB.cjs");
const require_frontmatter$1 = require("./frontmatter-Bd84I4zB.cjs");
const require_curator = require("./curator-D3crpveo.cjs");
const require_plugin_skills = require("./plugin-skills-ajAxY2PH.cjs");
const require_symlink_targets = require("./symlink-targets-DAKzXgvC.cjs");
const require_scanner = require("./scanner-BeCzztDo.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/skills/workshop/frontmatter.ts
function yamlScalar(value) {
	return JSON.stringify(value);
}
/** Renders proposal markdown while preserving allowed original frontmatter fields. */
function renderProposalMarkdown(params) {
	const originalFrontmatter = require_frontmatter.extractFrontmatterBlock(params.content)?.block ?? (params.fallbackFrontmatterContent ? require_frontmatter.extractFrontmatterBlock(params.fallbackFrontmatterContent)?.block : void 0);
	const keptFrontmatter = originalFrontmatter ? filterFrontmatterBlock(originalFrontmatter, [
		"name",
		"description",
		"status",
		"version",
		"date"
	]) : "";
	const body = (require_frontmatter.extractFrontmatterBlock(params.content)?.body ?? normalizeNewlines(params.content)).trimStart();
	const version = params.version ?? "v1";
	const date = params.date ?? (/* @__PURE__ */ new Date()).toISOString();
	const markdown = `---\n${[
		`name: ${yamlScalar(params.name)}`,
		`description: ${yamlScalar(params.description)}`,
		"status: proposal",
		`version: ${yamlScalar(version)}`,
		`date: ${yamlScalar(date)}`,
		keptFrontmatter
	].filter(Boolean).join("\n")}\n---\n\n${body}`;
	return markdown.endsWith("\n") ? markdown : `${markdown}\n`;
}
function readProposalFrontmatter(content) {
	const frontmatter = require_frontmatter$1.parseFrontmatter(content);
	const name = frontmatter.name?.trim();
	const description = frontmatter.description?.trim();
	const status = frontmatter.status?.trim().toLowerCase();
	if (!name || !description || status !== "proposal") return null;
	return {
		name,
		description
	};
}
function stripProposalFrontmatterForSkill(content) {
	const normalized = normalizeNewlines(content);
	const extracted = require_frontmatter.extractFrontmatterBlock(normalized);
	if (!extracted) return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
	const body = extracted.body.replace(/^\n+/, "");
	const keptLines = extracted.block.split("\n").filter((line) => {
		const key = line.match(/^([\w-]+):/)?.[1]?.toLowerCase();
		return key !== "status" && key !== "version" && key !== "date";
	}).join("\n").trim();
	const result = keptLines ? `---\n${keptLines}\n---\n\n${body}` : body;
	return result.endsWith("\n") ? result : `${result}\n`;
}
function filterFrontmatterBlock(block, keysToDrop) {
	const drop = new Set(keysToDrop.map((key) => key.toLowerCase()));
	const lines = block.split("\n");
	const kept = [];
	let dropping = false;
	for (const line of lines) {
		const key = line.match(/^([\w-]+):/)?.[1]?.toLowerCase();
		if (key) dropping = drop.has(key);
		if (!dropping) kept.push(line);
	}
	return kept.join("\n").trim();
}
function normalizeNewlines(content) {
	return content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
//#endregion
//#region src/skills/workshop/proposal-scan.ts
function scanProposalBundle(content, supportFiles = [], metadata = []) {
	const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
	const findings = [
		...require_scanner.scanSkillContent(content, "PROPOSAL.md"),
		...require_scanner.scanSource(content, "PROPOSAL.md"),
		...supportFiles.flatMap((file) => [
			...require_scanner.scanSkillContent(file.path, "support-file-path").filter((finding) => finding.ruleId === "literal-secret"),
			...require_scanner.scanSkillContent(file.content, file.path),
			...require_scanner.scanSource(file.content, file.path)
		]),
		...metadata.flatMap((entry) => entry.content ? require_scanner.scanSkillContent(entry.content, entry.file).filter((finding) => finding.ruleId === "literal-secret") : [])
	];
	const critical = findings.filter((finding) => finding.severity === "critical").length;
	const warn = findings.filter((finding) => finding.severity === "warn").length;
	const info = findings.filter((finding) => finding.severity === "info").length;
	return {
		state: critical > 0 ? "failed" : "clean",
		scannedAt,
		critical,
		warn,
		info,
		findings
	};
}
function assertProposalContainsNoLiteralSecrets(scan) {
	const finding = scan.findings.find((entry) => entry.ruleId === "literal-secret");
	if (!finding) return;
	throw new Error(`Skill proposal contains a recognized literal credential in ${finding.file}; replace it with a SecretRef or placeholder.`);
}
//#endregion
//#region src/skills/workshop/service-query.ts
function storeOptions(env) {
	return env ? { env } : {};
}
function isProposalInWorkspace(record, workspaceDir) {
	try {
		require_curator.assertInsideWorkspace(workspaceDir, record.target.skillFile, "skill file");
		require_curator.assertInsideWorkspace(workspaceDir, record.target.skillDir, "skill directory");
		return true;
	} catch {
		return false;
	}
}
async function listSkillProposals(options = {}) {
	const store = storeOptions(options.env);
	const manifest = await require_curator.readSkillProposalManifest(store);
	if (!options.workspaceDir) return manifest;
	const proposals = [];
	for (const proposal of manifest.proposals) {
		const record = await require_curator.readSkillProposalRecord(proposal.id, store);
		if (record && isProposalInWorkspace(record, options.workspaceDir)) proposals.push(proposal);
	}
	return {
		...manifest,
		proposals
	};
}
async function getSkillProposalRunProgress(options) {
	const store = storeOptions(options.env);
	const manifest = await require_curator.refreshSkillProposalManifest(store);
	const ids = [];
	let mutationCount = 0;
	for (const proposal of manifest.proposals) {
		const record = await require_curator.readSkillProposalRecord(proposal.id, store);
		if (!record || options.workspaceDir && !isProposalInWorkspace(record, options.workspaceDir)) continue;
		if (record.origin?.runId === options.runId || record.originRunIds?.includes(options.runId)) {
			ids.push(record.id);
			mutationCount += record.originRunMutationCounts?.[options.runId] ?? 1;
		}
	}
	return {
		mutationCount,
		proposalIds: ids
	};
}
async function inspectSkillProposal(proposalId, options = {}) {
	const read = await require_curator.readSkillProposal(proposalId, storeOptions(options.env));
	if (!read || options.workspaceDir && !isProposalInWorkspace(read.record, options.workspaceDir)) return null;
	return await hydrateProposalSupportFiles(read, options.env);
}
async function resolvePendingSkillProposal(input) {
	const proposalId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.proposalId);
	if (proposalId) {
		const direct = await readRequiredProposal(proposalId, input.workspaceDir, input.env);
		if (direct.record.status !== "pending") throw new Error(`Only pending proposals can be revised. Current status: ${direct.record.status}.`);
		return direct;
	}
	const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.name);
	if (!name) throw new Error("proposal_id or name required.");
	const matches = (await listSkillProposals({
		workspaceDir: input.workspaceDir,
		env: input.env
	})).proposals.filter((proposal) => proposal.status === "pending" && proposalMatchesName(proposal, name));
	if (matches.length === 0) throw new Error(`No pending skill proposal matched: ${name}`);
	if (matches.length > 1) {
		const candidates = matches.slice(0, 8).map((proposal) => `${proposal.id} (${proposal.skillKey})`).join(", ");
		throw new Error(`Multiple pending skill proposals matched ${name}: ${candidates}`);
	}
	const matched = await readRequiredProposal((0, _gabrielvfonseca_normalization_core.expectDefined)(matches[0], "matches capture group 0").id, input.workspaceDir, input.env);
	if (matched.record.status !== "pending") throw new Error(`Only pending proposals can be revised. Current status: ${matched.record.status}.`);
	return matched;
}
async function readRequiredProposal(proposalId, workspaceDir, env) {
	const read = await require_curator.readSkillProposal(proposalId, storeOptions(env));
	if (!read || workspaceDir && !isProposalInWorkspace(read.record, workspaceDir)) throw new Error(`Skill proposal not found: ${proposalId}`);
	return read;
}
async function hydrateProposalSupportFiles(read, env) {
	const supportFiles = await require_curator.readProposalSupportFiles(read.record, storeOptions(env));
	return supportFiles.length === 0 ? read : {
		...read,
		supportFiles: supportFiles.map((file) => ({
			path: file.path,
			content: file.content
		}))
	};
}
function proposalMatchesName(proposal, name) {
	const normalizedName = require_curator.normalizeSkillIndexName(name);
	return [
		proposal.id,
		proposal.skillName,
		proposal.skillKey,
		proposal.title,
		proposal.description
	].some((candidate) => {
		if (!candidate) return false;
		if (candidate === name || candidate.toLowerCase() === name.toLowerCase()) return true;
		const normalizedCandidate = require_curator.normalizeSkillIndexName(candidate);
		return Boolean(normalizedName && normalizedCandidate && (normalizedCandidate === normalizedName || normalizedCandidate.includes(normalizedName) || normalizedName.includes(normalizedCandidate)));
	});
}
//#endregion
//#region src/skills/workshop/service.ts
function proposalStoreOptions(env) {
	return env ? { env } : {};
}
const WRITABLE_WORKSPACE_SOURCES = /* @__PURE__ */ new Set(["operator-workspace", "agents-skills-project"]);
const MAX_SKILL_PROPOSAL_DESCRIPTION_BYTES = 160;
function normalizeProposalOrigin(origin) {
	const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(origin?.agentId);
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(origin?.sessionKey);
	const runId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(origin?.runId);
	const messageId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(origin?.messageId);
	if (!agentId && !sessionKey && !runId && !messageId) return;
	return {
		...agentId ? { agentId } : {},
		...sessionKey ? { sessionKey } : {},
		...runId ? { runId } : {},
		...messageId ? { messageId } : {}
	};
}
function mergeProposalOriginRunProvenance(record, origin) {
	const ids = new Set(record?.originRunIds);
	const counts = { ...record?.originRunMutationCounts };
	if (record?.origin?.runId) ids.add(record.origin.runId);
	for (const runId of ids) counts[runId] ??= 1;
	if (origin?.runId) {
		ids.add(origin.runId);
		counts[origin.runId] = (counts[origin.runId] ?? 0) + 1;
	}
	if (ids.size > 4096) throw new Error("Skill proposal run provenance exceeds the supported limit.");
	return {
		...ids.size > 0 ? { originRunIds: [...ids] } : {},
		...Object.keys(counts).length > 0 ? { originRunMutationCounts: counts } : {}
	};
}
async function proposeCreateSkill(input) {
	const name = normalizeRequired(input.name, "Skill name");
	const description = normalizeRequired(input.description, "Skill description");
	const config = require_config.resolveSkillWorkshopConfig(input.config);
	assertProposalDescriptionWithinLimit(description);
	assertProposalContentWithinLimit(input.content, config.maxSkillBytes);
	const target = require_curator.resolveSkillProposalTarget({
		workspaceDir: input.workspaceDir,
		skillName: name
	});
	if (await require_curator.readWorkspaceSkillFile(target.skillFile) !== null) throw new Error(`Skill already exists at ${target.skillFile}.`);
	const supportFiles = require_curator.prepareSkillProposalSupportFiles(input.supportFiles);
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const proposalContent = renderProposalMarkdown({
		name: target.skillKey,
		description,
		content: input.content,
		date: now
	});
	const id = require_curator.createSkillProposalId(name);
	const goal = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.goal);
	const evidence = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.evidence);
	const scan = scanProposalBundle(proposalContent, supportFiles, [
		{
			file: "skill-name",
			content: name
		},
		{
			file: "description",
			content: description
		},
		{
			file: "goal",
			content: goal
		},
		{
			file: "evidence",
			content: evidence
		}
	]);
	assertProposalContainsNoLiteralSecrets(scan);
	const origin = normalizeProposalOrigin(input.origin);
	const originRunProvenance = mergeProposalOriginRunProvenance(void 0, origin);
	const record = {
		schema: require_curator.SKILL_WORKSHOP_SCHEMA,
		id,
		kind: "create",
		status: "pending",
		title: `Create ${name}`,
		description,
		createdAt: now,
		updatedAt: now,
		createdBy: input.createdBy ?? "skill-workshop",
		...origin ? { origin } : {},
		...originRunProvenance,
		proposedVersion: "v1",
		draftFile: "PROPOSAL.md",
		draftHash: require_curator.hashSkillProposalContent(proposalContent),
		target: {
			skillName: name,
			skillKey: target.skillKey,
			skillDir: target.skillDir,
			skillFile: target.skillFile,
			source: "operator-workspace"
		},
		scan,
		...supportFiles.length > 0 ? { supportFiles: await buildSupportFileMetadata(supportFiles) } : {},
		...goal ? { goal } : {},
		...evidence ? { evidence } : {}
	};
	await require_curator.writeSkillProposal({
		record,
		content: proposalContent,
		supportFiles,
		store: proposalStoreOptions(input.env),
		beforeWrite: async (manifest) => {
			await assertCanCreatePendingProposal(input.workspaceDir, config, manifest, input.env);
		}
	});
	return {
		record,
		content: proposalContent
	};
}
/**
* Lists the workspace skills the workshop can target with update proposals, using the same
* status discovery as `proposeUpdateSkill` so callers that route corrections to existing
* skills stay in lockstep with what an update can actually write.
*/
function listWritableWorkspaceSkillSummaries(workspaceDir, opts) {
	const status = require_status.buildWorkspaceSkillStatus(workspaceDir, {
		config: opts?.config,
		agentId: opts?.agentId
	});
	const summaries = [];
	for (const skill of status.skills) {
		if (!WRITABLE_WORKSPACE_SOURCES.has(skill.source)) continue;
		summaries.push(skill.description ? {
			name: skill.skillKey,
			description: skill.description,
			filePath: skill.filePath
		} : {
			name: skill.skillKey,
			filePath: skill.filePath
		});
	}
	return summaries;
}
async function proposeUpdateSkill(input) {
	const skillName = normalizeRequired(input.skillName, "Skill name");
	const config = require_config.resolveSkillWorkshopConfig(input.config);
	const targetSkill = require_status.resolveSkillStatusEntry(require_status.buildWorkspaceSkillStatus(input.workspaceDir, {
		config: input.config,
		agentId: input.agentId
	}).skills, skillName);
	if (!targetSkill) throw new Error(`Skill not found: ${skillName}`);
	assertWritableSkillTarget(input.workspaceDir, targetSkill);
	const currentContent = await require_curator.readWorkspaceSkillFile(targetSkill.filePath);
	if (currentContent === null) throw new Error(`Skill file is missing: ${targetSkill.filePath}`);
	const description = resolveUpdateProposalDescription(input.description, targetSkill.description);
	assertProposalContentWithinLimit(input.content, config.maxSkillBytes);
	const supportFiles = require_curator.prepareSkillProposalSupportFiles(input.supportFiles);
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const proposalContent = renderProposalMarkdown({
		name: targetSkill.skillKey,
		description,
		content: input.content,
		fallbackFrontmatterContent: currentContent,
		date: now
	});
	const id = require_curator.createSkillProposalId(targetSkill.skillKey || targetSkill.name);
	const goal = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.goal);
	const evidence = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.evidence);
	const scan = scanProposalBundle(proposalContent, supportFiles, [
		{
			file: "description",
			content: description
		},
		{
			file: "goal",
			content: goal
		},
		{
			file: "evidence",
			content: evidence
		}
	]);
	assertProposalContainsNoLiteralSecrets(scan);
	const origin = normalizeProposalOrigin(input.origin);
	const originRunProvenance = mergeProposalOriginRunProvenance(void 0, origin);
	const record = {
		schema: require_curator.SKILL_WORKSHOP_SCHEMA,
		id,
		kind: "update",
		status: "pending",
		title: `Update ${targetSkill.name}`,
		description,
		createdAt: now,
		updatedAt: now,
		createdBy: input.createdBy ?? "skill-workshop",
		...origin ? { origin } : {},
		...originRunProvenance,
		proposedVersion: "v1",
		draftFile: "PROPOSAL.md",
		draftHash: require_curator.hashSkillProposalContent(proposalContent),
		target: {
			skillName: targetSkill.name,
			skillKey: targetSkill.skillKey,
			skillDir: targetSkill.baseDir,
			skillFile: targetSkill.filePath,
			source: targetSkill.source,
			currentContentHash: require_curator.hashSkillProposalContent(currentContent)
		},
		scan,
		...supportFiles.length > 0 ? { supportFiles: await buildSupportFileMetadata(supportFiles, targetSkill.baseDir) } : {},
		...goal ? { goal } : {},
		...evidence ? { evidence } : {}
	};
	await require_curator.writeSkillProposal({
		record,
		content: proposalContent,
		supportFiles,
		store: proposalStoreOptions(input.env),
		beforeWrite: async (manifest) => {
			await assertCanCreatePendingProposal(input.workspaceDir, config, manifest, input.env);
		}
	});
	return {
		record,
		content: proposalContent
	};
}
async function reviseSkillProposal(input) {
	const config = require_config.resolveSkillWorkshopConfig(input.config);
	return await withPendingSkillProposalMutation(input, "revised", async (read) => {
		const { record } = read;
		require_curator.assertInsideWorkspace(input.workspaceDir, record.target.skillFile, "skill file");
		require_curator.assertInsideWorkspace(input.workspaceDir, record.target.skillDir, "skill directory");
		if (record.kind === "create") {
			if (await require_curator.readWorkspaceSkillFile(record.target.skillFile) !== null) {
				await markProposalStale(record, "Target skill was created after proposal creation.", input.env);
				throw new Error("Target skill was created after proposal creation; proposal marked stale.");
			}
		} else {
			const currentContent = await require_curator.readWorkspaceSkillFile(record.target.skillFile);
			if (currentContent === null) throw new Error(`Target skill is missing: ${record.target.skillFile}`);
			if (record.target.currentContentHash && require_curator.hashSkillProposalContent(currentContent) !== record.target.currentContentHash) {
				await markProposalStale(record, "Target skill changed after proposal creation.", input.env);
				throw new Error("Target skill changed after proposal creation; proposal marked stale.");
			}
			await assertSupportTargetsUnchanged(record, input.env);
		}
		const supportFiles = input.supportFiles === void 0 ? await require_curator.readProposalSupportFiles(record, proposalStoreOptions(input.env)) : require_curator.prepareSkillProposalSupportFiles(input.supportFiles);
		assertProposalContentWithinLimit(input.content, config.maxSkillBytes);
		const supportFileMetadata = supportFiles.length > 0 ? await buildSupportFileMetadata(supportFiles, record.kind === "update" ? record.target.skillDir : void 0) : [];
		const nextVersion = nextProposalVersion(record.proposedVersion);
		const description = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.description) ?? record.description;
		assertProposalDescriptionWithinLimit(description);
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const proposalContent = renderProposalMarkdown({
			name: record.target.skillKey,
			description,
			content: input.content,
			fallbackFrontmatterContent: read.content,
			version: nextVersion,
			date: now
		});
		const goal = input.goal === void 0 ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.goal) : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.goal);
		const evidence = input.evidence === void 0 ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.evidence) : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.evidence);
		const origin = normalizeProposalOrigin(input.origin);
		const originRunProvenance = mergeProposalOriginRunProvenance(record, origin);
		const previousSupportFiles = record.supportFiles;
		const scan = scanProposalBundle(proposalContent, supportFiles, [
			{
				file: "description",
				content: description
			},
			{
				file: "goal",
				content: goal
			},
			{
				file: "evidence",
				content: evidence
			}
		]);
		assertProposalContainsNoLiteralSecrets(scan);
		const revised = {
			...record,
			description,
			updatedAt: now,
			proposedVersion: nextVersion,
			draftHash: require_curator.hashSkillProposalContent(proposalContent),
			scan,
			...origin ? { origin } : {},
			...originRunProvenance
		};
		if (supportFiles.length > 0) revised.supportFiles = supportFileMetadata;
		else delete revised.supportFiles;
		if (goal) revised.goal = goal;
		else delete revised.goal;
		if (evidence) revised.evidence = evidence;
		else delete revised.evidence;
		await require_curator.replaceSkillProposalDraft({
			record: revised,
			previousSupportFiles,
			content: proposalContent,
			supportFiles,
			store: proposalStoreOptions(input.env)
		});
		return {
			record: revised,
			content: proposalContent
		};
	});
}
async function rejectSkillProposal(input) {
	return await markProposal(input, "rejected");
}
async function quarantineSkillProposal(input) {
	return await withPendingSkillProposalMutation(input, "quarantined", async (read) => {
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const record = {
			...read.record,
			status: "quarantined",
			updatedAt: now,
			quarantinedAt: now,
			statusReason: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.reason),
			scan: {
				...read.record.scan,
				state: "quarantined"
			}
		};
		await require_curator.updateSkillProposalRecord({
			record,
			store: proposalStoreOptions(input.env)
		});
		return record;
	});
}
async function applySkillProposal(input) {
	return await withPendingSkillProposalMutation(input, "applied", async (read) => {
		const { record, content } = read;
		if (require_curator.hashSkillProposalContent(content) !== record.draftHash) throw new Error("Proposal draft changed without updating proposal metadata.");
		const supportFiles = await require_curator.readProposalSupportFiles(record, proposalStoreOptions(input.env));
		if (!readProposalFrontmatter(content)) throw new Error("Proposal draft must include proposal frontmatter.");
		const scan = scanProposalBundle(content, supportFiles);
		if (scan.state !== "clean") {
			await require_curator.updateSkillProposalRecord({
				record: {
					...record,
					status: "quarantined",
					updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
					quarantinedAt: (/* @__PURE__ */ new Date()).toISOString(),
					scan: {
						...scan,
						state: "quarantined"
					},
					statusReason: "Proposal scan failed."
				},
				store: proposalStoreOptions(input.env)
			});
			throw new Error("Proposal scan failed; proposal was quarantined.");
		}
		require_curator.assertInsideWorkspace(input.workspaceDir, record.target.skillFile, "skill file");
		require_curator.assertInsideWorkspace(input.workspaceDir, record.target.skillDir, "skill directory");
		const workshopConfig = require_config.resolveSkillWorkshopConfig(input.config);
		const symlinkPolicy = {
			allowWrites: workshopConfig.allowSymlinkTargetWrites,
			allowedTargetRealPaths: workshopConfig.allowSymlinkTargetWrites ? require_symlink_targets.resolveAllowedSkillSymlinkTargetRealPaths(input.config) : []
		};
		await require_curator.assertWorkspaceSkillWriteTarget({
			workspaceDir: input.workspaceDir,
			filePath: record.target.skillFile,
			symlinkPolicy
		});
		const targetState = await readApplyTargetState(record, supportFiles, input.env);
		const rollback = require_curator.createSkillProposalRollback({
			proposalId: record.id,
			targetSkillFile: record.target.skillFile,
			action: record.kind,
			...targetState.previousContent !== null ? { previousContent: targetState.previousContent } : {},
			...targetState.previousSupportFiles.length > 0 ? { supportFiles: targetState.previousSupportFiles } : {}
		});
		await require_curator.writeSkillProposalRollback({
			proposalId: record.id,
			rollback,
			store: proposalStoreOptions(input.env)
		});
		const skillContent = stripProposalFrontmatterForSkill(content);
		await require_curator.writeWorkspaceSkill({
			workspaceDir: input.workspaceDir,
			skillDir: record.target.skillDir,
			skillFile: record.target.skillFile,
			content: skillContent,
			supportFiles,
			mode: record.kind,
			symlinkPolicy
		});
		require_plugin_skills.bumpSkillsSnapshotVersion({
			workspaceDir: input.workspaceDir,
			reason: "workshop",
			changedPath: record.target.skillFile
		});
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const applied = {
			...record,
			status: "applied",
			updatedAt: now,
			appliedAt: now,
			scan
		};
		await require_curator.updateSkillProposalRecord({
			record: applied,
			store: proposalStoreOptions(input.env)
		});
		await require_curator.refreshSkillProposalManifest(proposalStoreOptions(input.env));
		return {
			record: applied,
			targetSkillFile: record.target.skillFile
		};
	});
}
async function readApplyTargetState(record, supportFiles, env) {
	const previousContent = await require_curator.readWorkspaceSkillFile(record.target.skillFile);
	if (record.kind === "create" && previousContent !== null) throw new Error(`Target skill already exists: ${record.target.skillFile}`);
	const previousSupportFiles = [];
	for (const file of supportFiles) {
		const supportRecord = record.supportFiles?.find((entry) => entry.path === file.path);
		const previousSupportContent = await require_curator.readWorkspaceSupportFile({
			skillDir: record.target.skillDir,
			relativePath: file.path
		});
		if (record.kind === "create" && previousSupportContent !== null) throw new Error(`Target support file already exists: ${node_path.default.join(record.target.skillDir, file.path)}`);
		if (record.kind === "update" && supportRecord) await assertSupportTargetUnchanged({
			record,
			file: supportRecord,
			currentContent: previousSupportContent,
			env
		});
		previousSupportFiles.push(previousSupportContent === null ? {
			path: file.path,
			existed: false
		} : {
			path: file.path,
			existed: true,
			previousContent: previousSupportContent,
			previousContentHash: require_curator.hashSkillProposalContent(previousSupportContent)
		});
	}
	if (record.kind === "update") {
		if (previousContent === null) throw new Error(`Target skill is missing: ${record.target.skillFile}`);
		if (record.target.currentContentHash && require_curator.hashSkillProposalContent(previousContent) !== record.target.currentContentHash) {
			await require_curator.updateSkillProposalRecord({
				record: {
					...record,
					status: "stale",
					updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
					staleAt: (/* @__PURE__ */ new Date()).toISOString(),
					statusReason: "Target skill changed after proposal creation."
				},
				store: proposalStoreOptions(env)
			});
			throw new Error("Target skill changed after proposal creation; proposal marked stale.");
		}
	}
	return {
		previousContent,
		previousSupportFiles
	};
}
async function assertCanCreatePendingProposal(workspaceDir, config, manifest, env) {
	if (!manifest) {
		const proposals = (await listSkillProposals({
			workspaceDir,
			env
		})).proposals;
		assertPendingProposalCountWithinLimit(proposals.filter((entry) => entry.status === "pending" || entry.status === "quarantined").length, config);
		return;
	}
	let activeProposalCount = 0;
	for (const entry of manifest.proposals) {
		if (entry.status !== "pending" && entry.status !== "quarantined") continue;
		const record = await require_curator.readSkillProposalRecord(entry.id, proposalStoreOptions(env));
		if (record && isProposalInWorkspace(record, workspaceDir)) activeProposalCount += 1;
	}
	assertPendingProposalCountWithinLimit(activeProposalCount, config);
}
function assertPendingProposalCountWithinLimit(activeProposalCount, config) {
	if (activeProposalCount >= config.maxPending) throw new Error(`Skill Workshop pending proposal limit reached (${config.maxPending}).`);
}
function assertProposalDescriptionWithinLimit(description) {
	const sizeBytes = Buffer.byteLength(description, "utf8");
	if (sizeBytes > MAX_SKILL_PROPOSAL_DESCRIPTION_BYTES) throw new Error(`Skill proposal description is too large (${sizeBytes} bytes, max ${MAX_SKILL_PROPOSAL_DESCRIPTION_BYTES}).`);
}
function resolveUpdateProposalDescription(inputDescription, currentDescription) {
	const supplied = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(inputDescription);
	if (supplied) {
		assertProposalDescriptionWithinLimit(supplied);
		return supplied;
	}
	return truncateUtf8(currentDescription.trim(), MAX_SKILL_PROPOSAL_DESCRIPTION_BYTES);
}
function truncateUtf8(value, maxBytes) {
	let out = "";
	let sizeBytes = 0;
	for (const char of value) {
		const charBytes = Buffer.byteLength(char, "utf8");
		if (sizeBytes + charBytes > maxBytes) break;
		out += char;
		sizeBytes += charBytes;
	}
	return out.trimEnd();
}
function assertProposalContentWithinLimit(content, maxSkillBytes) {
	const sizeBytes = Buffer.byteLength(content, "utf8");
	if (sizeBytes > maxSkillBytes) throw new Error(`Skill proposal content is too large (${sizeBytes} bytes, max ${maxSkillBytes}).`);
}
async function buildSupportFileMetadata(files, targetSkillDir) {
	const out = [];
	for (const file of files) {
		const metadata = {
			path: file.path,
			sizeBytes: file.sizeBytes,
			hash: file.hash
		};
		if (targetSkillDir) {
			const targetContent = await require_curator.readWorkspaceSupportFile({
				skillDir: targetSkillDir,
				relativePath: file.path
			});
			metadata.targetExisted = targetContent !== null;
			if (targetContent !== null) metadata.targetContentHash = require_curator.hashSkillProposalContent(targetContent);
		}
		out.push(metadata);
	}
	return out;
}
function nextProposalVersion(version) {
	const match = /^v(\d+)$/.exec(version.trim());
	if (!match) return "v2";
	const current = Number.parseInt(match[1] ?? "1", 10);
	return `v${Number.isSafeInteger(current) && current > 0 ? current + 1 : 2}`;
}
async function markProposal(input, status) {
	return await withPendingSkillProposalMutation(input, status, async (read) => {
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const record = {
			...read.record,
			status,
			updatedAt: now,
			rejectedAt: now,
			statusReason: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.reason)
		};
		await require_curator.updateSkillProposalRecord({
			record,
			store: proposalStoreOptions(input.env)
		});
		return record;
	});
}
async function withPendingSkillProposalMutation(input, action, fn) {
	return await require_curator.withSkillProposalTargetLock((await readRequiredProposal(input.proposalId, input.workspaceDir, input.env)).record, async () => {
		const read = await readRequiredProposal(input.proposalId, input.workspaceDir, input.env);
		if (read.record.status !== "pending") throw new Error(`Only pending proposals can be ${action}. Current status: ${read.record.status}.`);
		return await fn(read);
	}, proposalStoreOptions(input.env));
}
async function assertSupportTargetUnchanged(params) {
	const { record, file, currentContent } = params;
	if (file.targetExisted === false && currentContent !== null) {
		await markProposalStale(record, `Target support file changed after proposal creation: ${file.path}`, params.env);
		throw new Error("Target support file changed after proposal creation; proposal marked stale.");
	}
	if (file.targetExisted === true) {
		if ((currentContent === null ? void 0 : require_curator.hashSkillProposalContent(currentContent)) !== file.targetContentHash) {
			await markProposalStale(record, `Target support file changed after proposal creation: ${file.path}`, params.env);
			throw new Error("Target support file changed after proposal creation; proposal marked stale.");
		}
	}
}
async function assertSupportTargetsUnchanged(record, env) {
	if (record.kind !== "update" || !record.supportFiles) return;
	for (const file of record.supportFiles) {
		if (file.targetExisted === void 0) continue;
		await assertSupportTargetUnchanged({
			record,
			file,
			currentContent: await require_curator.readWorkspaceSupportFile({
				skillDir: record.target.skillDir,
				relativePath: file.path
			}),
			env
		});
	}
}
async function markProposalStale(record, reason, env) {
	await require_curator.updateSkillProposalRecord({
		record: {
			...record,
			status: "stale",
			updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			staleAt: (/* @__PURE__ */ new Date()).toISOString(),
			statusReason: reason
		},
		store: proposalStoreOptions(env)
	});
}
function assertWritableSkillTarget(workspaceDir, skill) {
	if (!WRITABLE_WORKSPACE_SOURCES.has(skill.source)) throw new Error(`Skill source is not writable by Skill Workshop: ${skill.source}`);
	require_curator.assertInsideWorkspace(workspaceDir, skill.filePath, "skill file");
	require_curator.assertInsideWorkspace(workspaceDir, skill.baseDir, "skill directory");
	if (node_path.default.basename(skill.filePath) !== "SKILL.md") throw new Error("Skill Workshop can only update SKILL.md targets.");
}
function normalizeRequired(value, label) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!normalized) throw new Error(`${label} is required.`);
	return normalized;
}
//#endregion
Object.defineProperty(exports, "applySkillProposal", {
	enumerable: true,
	get: function() {
		return applySkillProposal;
	}
});
Object.defineProperty(exports, "getSkillProposalRunProgress", {
	enumerable: true,
	get: function() {
		return getSkillProposalRunProgress;
	}
});
Object.defineProperty(exports, "inspectSkillProposal", {
	enumerable: true,
	get: function() {
		return inspectSkillProposal;
	}
});
Object.defineProperty(exports, "listSkillProposals", {
	enumerable: true,
	get: function() {
		return listSkillProposals;
	}
});
Object.defineProperty(exports, "listWritableWorkspaceSkillSummaries", {
	enumerable: true,
	get: function() {
		return listWritableWorkspaceSkillSummaries;
	}
});
Object.defineProperty(exports, "proposeCreateSkill", {
	enumerable: true,
	get: function() {
		return proposeCreateSkill;
	}
});
Object.defineProperty(exports, "proposeUpdateSkill", {
	enumerable: true,
	get: function() {
		return proposeUpdateSkill;
	}
});
Object.defineProperty(exports, "quarantineSkillProposal", {
	enumerable: true,
	get: function() {
		return quarantineSkillProposal;
	}
});
Object.defineProperty(exports, "rejectSkillProposal", {
	enumerable: true,
	get: function() {
		return rejectSkillProposal;
	}
});
Object.defineProperty(exports, "resolvePendingSkillProposal", {
	enumerable: true,
	get: function() {
		return resolvePendingSkillProposal;
	}
});
Object.defineProperty(exports, "reviseSkillProposal", {
	enumerable: true,
	get: function() {
		return reviseSkillProposal;
	}
});
Object.defineProperty(exports, "stripProposalFrontmatterForSkill", {
	enumerable: true,
	get: function() {
		return stripProposalFrontmatterForSkill;
	}
});
