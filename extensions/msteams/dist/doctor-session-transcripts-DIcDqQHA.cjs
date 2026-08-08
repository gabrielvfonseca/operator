const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_internal_runtime_context = require("./internal-runtime-context-C0HOZ5eF.cjs");
const require_transcript_tree = require("./transcript-tree-0YpOJFJQ.cjs");
const require_session_dirs = require("./session-dirs-CZJH_seJ.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_codex_route_model_ref = require("./codex-route-model-ref-CKO9Qire.cjs");
const require_doctor_sqlite_maintenance_lock = require("./doctor-sqlite-maintenance-lock-DBgRaRhw.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/commands/doctor-session-transcripts.ts
const SESSION_TRANSCRIPTS_CHECK_ID = "core/doctor/session-transcripts";
const OPENAI_PROVIDER_ID = "openai";
const LEGACY_OPENAI_CODEX_RESPONSES_API = "openai-codex-responses";
const OPENAI_CHATGPT_RESPONSES_API = "openai-chatgpt-responses";
function parseTranscriptEntries(raw) {
	const entries = [];
	for (const line of raw.split(/\r?\n/)) {
		if (!line.trim()) continue;
		try {
			const parsed = JSON.parse(line);
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) entries.push(parsed);
		} catch {
			return [];
		}
	}
	return entries;
}
function getEntryId(entry) {
	return typeof entry.id === "string" && entry.id.trim() ? entry.id : null;
}
function getParentId(entry) {
	return typeof entry.parentId === "string" && entry.parentId.trim() ? entry.parentId : null;
}
function getMessage(entry) {
	return entry.message && typeof entry.message === "object" && !Array.isArray(entry.message) ? entry.message : null;
}
function withSelectedParent(entry, parentId) {
	return entry.parentId === parentId ? entry : {
		...entry,
		parentId
	};
}
function normalizeLegacyOpenAICodexTranscriptMetadata(entries) {
	let changed = 0;
	for (const entry of entries) {
		const message = getMessage(entry);
		if (!message) continue;
		let touched = false;
		if (require_codex_route_model_ref.isLegacyCodexProviderId(message.provider)) {
			message.provider = OPENAI_PROVIDER_ID;
			touched = true;
		}
		if (message.api === LEGACY_OPENAI_CODEX_RESPONSES_API) {
			message.api = OPENAI_CHATGPT_RESPONSES_API;
			touched = true;
		}
		if (touched) changed += 1;
	}
	return changed;
}
function textFromContent(content) {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return null;
	return content.map((part) => part && typeof part === "object" && typeof part.text === "string" ? part.text : "").join("") || null;
}
function selectActivePath(entries) {
	const sessionEntries = entries.filter((entry) => entry.type !== "session");
	const tree = require_transcript_tree.scanSessionTranscriptTree(sessionEntries);
	if (!tree.hasExplicitLeafUpdate) {
		const byId = /* @__PURE__ */ new Map();
		for (const entry of sessionEntries) {
			const id = getEntryId(entry);
			if (id) byId.set(id, entry);
		}
		const active = [];
		const seen = /* @__PURE__ */ new Set();
		let current = sessionEntries.at(-1);
		while (current) {
			const id = getEntryId(current);
			if (!id || seen.has(id)) return null;
			seen.add(id);
			active.unshift(current);
			const parentId = getParentId(current);
			current = parentId ? byId.get(parentId) : void 0;
		}
		return active.length > 0 ? {
			entries: active,
			entriesToPersist: active,
			terminalLeafControl: null,
			appendParentId: getEntryId(active.at(-1) ?? {})
		} : null;
	}
	if (!tree.hasLeafUpdate) return null;
	const visiblePath = require_transcript_tree.selectSessionTranscriptTreePathNodes(tree, tree.leafId);
	const appendPath = require_transcript_tree.selectSessionTranscriptTreePathNodes(tree, tree.appendParentId);
	const visibleEntries = require_transcript_tree.mergeSessionTranscriptTreePaths([visiblePath]).map((node) => withSelectedParent(node.entry, node.selectedParentId));
	const persistedPath = require_transcript_tree.mergeSessionTranscriptVisiblePathWithOpaqueAppendPath({
		visiblePath,
		appendPath,
		appendParentId: tree.appendParentId
	});
	const entriesToPersist = persistedPath.nodes.map((node) => withSelectedParent(node.entry, node.selectedParentId));
	const lastLeafUpdateEntry = tree.nodes.findLast((node) => node.leafId !== void 0)?.entry;
	return {
		entries: visibleEntries,
		entriesToPersist,
		terminalLeafControl: require_transcript_tree.isSessionTranscriptLeafControl(lastLeafUpdateEntry) ? lastLeafUpdateEntry : null,
		appendParentId: persistedPath.appendParentId
	};
}
function hasBrokenPromptRewriteBranch(entries, activePath) {
	const activeIds = new Set(activePath.map(getEntryId).filter((id) => Boolean(id)));
	const activeUserByParentAndText = /* @__PURE__ */ new Set();
	for (const entry of activePath) {
		const id = getEntryId(entry);
		const message = getMessage(entry);
		if (!id || message?.role !== "user") continue;
		const text = textFromContent(message.content);
		if (text !== null) activeUserByParentAndText.add(`${getParentId(entry) ?? ""}\0${text.trim()}`);
	}
	for (const entry of entries) {
		const id = getEntryId(entry);
		if (!id || activeIds.has(id)) continue;
		const message = getMessage(entry);
		if (message?.role !== "user") continue;
		const text = textFromContent(message.content);
		if (!text || !require_internal_runtime_context.hasInternalRuntimeContext(text)) continue;
		const visibleText = require_internal_runtime_context.stripInternalRuntimeContext(text).trim();
		if (visibleText && activeUserByParentAndText.has(`${getParentId(entry) ?? ""}\0${visibleText}`)) return true;
	}
	return false;
}
async function writeActiveTranscript(params) {
	const header = params.entries.find((entry) => entry.type === "session");
	if (!header) throw new Error("missing session header");
	const backupPath = `${params.filePath}.pre-doctor-branch-repair-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.bak`;
	await node_fs_promises.default.copyFile(params.filePath, backupPath);
	const lastPersistedId = getEntryId(params.activePath.entriesToPersist.at(-1) ?? {});
	const terminalLeafControl = params.activePath.terminalLeafControl ? {
		...params.activePath.terminalLeafControl,
		parentId: lastPersistedId,
		appendParentId: params.activePath.appendParentId
	} : null;
	const next = [
		header,
		...params.activePath.entriesToPersist,
		...terminalLeafControl ? [terminalLeafControl] : []
	].map((entry) => JSON.stringify(entry)).join("\n");
	await node_fs_promises.default.writeFile(params.filePath, `${next}\n`, "utf-8");
	return backupPath;
}
async function writeTranscriptEntries(params) {
	const backupPath = `${params.filePath}.pre-doctor-openai-codex-repair-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.bak`;
	await node_fs_promises.default.copyFile(params.filePath, backupPath);
	const next = params.entries.map((entry) => JSON.stringify(entry)).join("\n");
	await node_fs_promises.default.writeFile(params.filePath, `${next}\n`, "utf-8");
	return backupPath;
}
/** Repairs one transcript file by keeping the active branch and backing up the original file. */
async function repairBrokenSessionTranscriptFile(params) {
	try {
		const entries = parseTranscriptEntries(await node_fs_promises.default.readFile(params.filePath, "utf-8"));
		const legacyOpenAICodexEntries = normalizeLegacyOpenAICodexTranscriptMetadata(entries);
		const activePath = selectActivePath(entries);
		if (!activePath) {
			if (legacyOpenAICodexEntries > 0 && params.shouldRepair) {
				const backupPath = await writeTranscriptEntries({
					filePath: params.filePath,
					entries
				});
				return {
					filePath: params.filePath,
					broken: true,
					repaired: true,
					originalEntries: entries.length,
					activeEntries: 0,
					legacyOpenAICodexEntries,
					backupPath,
					reason: "no active branch"
				};
			}
			return {
				filePath: params.filePath,
				broken: legacyOpenAICodexEntries > 0,
				repaired: false,
				originalEntries: entries.length,
				activeEntries: 0,
				legacyOpenAICodexEntries,
				reason: "no active branch"
			};
		}
		const broken = hasBrokenPromptRewriteBranch(entries, activePath.entries);
		if (!broken && legacyOpenAICodexEntries === 0) return {
			filePath: params.filePath,
			broken: false,
			repaired: false,
			originalEntries: entries.length,
			activeEntries: activePath.entries.length,
			legacyOpenAICodexEntries
		};
		if (!params.shouldRepair) return {
			filePath: params.filePath,
			broken: true,
			repaired: false,
			originalEntries: entries.length,
			activeEntries: activePath.entries.length,
			legacyOpenAICodexEntries
		};
		const backupPath = broken ? await writeActiveTranscript({
			filePath: params.filePath,
			entries,
			activePath
		}) : await writeTranscriptEntries({
			filePath: params.filePath,
			entries
		});
		return {
			filePath: params.filePath,
			broken: true,
			repaired: true,
			originalEntries: entries.length,
			activeEntries: activePath.entries.length,
			legacyOpenAICodexEntries,
			backupPath
		};
	} catch (err) {
		return {
			filePath: params.filePath,
			broken: false,
			repaired: false,
			originalEntries: 0,
			activeEntries: 0,
			legacyOpenAICodexEntries: 0,
			reason: String(err)
		};
	}
}
async function listSessionTranscriptFiles(sessionDirs) {
	const files = [];
	for (const sessionsDir of sessionDirs) {
		let entries;
		try {
			entries = await node_fs_promises.default.readdir(sessionsDir, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) if (entry.isFile() && entry.name.endsWith(".jsonl")) files.push(node_path.default.join(sessionsDir, entry.name));
	}
	return files.toSorted((a, b) => a.localeCompare(b));
}
async function detectSessionTranscriptHealthIssues(params) {
	let sessionDirs = params?.sessionDirs;
	try {
		sessionDirs ??= await require_session_dirs.resolveAgentSessionDirs(require_paths.resolveStateDir(process.env));
	} catch {
		return [];
	}
	const files = await listSessionTranscriptFiles(sessionDirs);
	const issues = [];
	for (const filePath of files) {
		const result = await repairBrokenSessionTranscriptFile({
			filePath,
			shouldRepair: false
		});
		if (result.broken) issues.push(result);
	}
	return issues;
}
function sessionTranscriptIssueToHealthFinding(issue) {
	const metadata = issue.legacyOpenAICodexEntries > 0 ? ` ${issue.legacyOpenAICodexEntries} legacy OpenAI Codex metadata entr${issue.legacyOpenAICodexEntries === 1 ? "y" : "ies"}` : "";
	return {
		checkId: SESSION_TRANSCRIPTS_CHECK_ID,
		severity: "info",
		message: `Session transcript has legacy branch or provider metadata that can be cleaned up.${metadata}`,
		path: issue.filePath,
		fixHint: "To clean up the advisory artifact, run `operator doctor --fix` to rewrite affected transcripts to their active branch."
	};
}
function sessionTranscriptIssueToRepairEffect(issue) {
	return {
		kind: "file",
		action: "would-rewrite-session-transcript",
		target: issue.filePath,
		dryRunSafe: false
	};
}
/** Scans session transcript files and reports or repairs legacy/broken transcript state. */
async function noteSessionTranscriptHealth(params) {
	const shouldRepair = params?.shouldRepair === true;
	let sessionDirs = params?.sessionDirs;
	try {
		sessionDirs ??= await require_session_dirs.resolveAgentSessionDirs(require_paths.resolveStateDir(process.env));
	} catch (err) {
		require_note.note(`- Failed to inspect session transcripts: ${String(err)}`, "Session transcripts");
		return;
	}
	const results = [];
	const files = await listSessionTranscriptFiles(sessionDirs);
	if (files.length > 0 && shouldRepair) for (const filePath of files) results.push(await repairBrokenSessionTranscriptFile({
		filePath,
		shouldRepair
	}));
	else if (files.length > 0) results.push(...await detectSessionTranscriptHealthIssues({ sessionDirs }));
	const broken = results.filter((result) => result.broken);
	if (broken.length > 0) {
		const repairedCount = broken.filter((result) => result.repaired).length;
		const lines = [`- Found ${broken.length} transcript file${broken.length === 1 ? "" : "s"} with legacy state.`, ...broken.slice(0, 20).map((result) => {
			const backup = result.backupPath ? ` backup=${require_utils.shortenHomePath(result.backupPath)}` : "";
			const status = result.repaired ? "repaired" : "needs repair";
			const metadata = result.legacyOpenAICodexEntries > 0 ? ` openai-codex=${result.legacyOpenAICodexEntries}` : "";
			return `- ${require_utils.shortenHomePath(result.filePath)} ${status} entries=${result.originalEntries}->${result.activeEntries + 1}${metadata}${backup}`;
		})];
		if (broken.length > 20) lines.push(`- ...and ${broken.length - 20} more.`);
		if (!shouldRepair) lines.push("- Run \"operator doctor --fix\" to rewrite affected files to their active branch.");
		else if (repairedCount > 0) lines.push(`- Repaired ${repairedCount} transcript file${repairedCount === 1 ? "" : "s"}.`);
		require_note.note(lines.join("\n"), "Session transcripts");
	}
	if (params?.sessionDirs === void 0 || params.sessionSqlite === true) await noteSessionSqliteMigrationHealth({
		cfg: params?.cfg,
		env: params?.env ?? process.env,
		shouldRepair
	});
}
async function noteSessionSqliteMigrationHealth(params) {
	const { runDoctorSessionSqlite } = await Promise.resolve().then(() => require("./doctor-session-sqlite-DLuT4my5.cjs"));
	const runSessionSqlite = async () => await runDoctorSessionSqlite({
		allAgents: true,
		...params.cfg ? { cfg: params.cfg } : {},
		env: params.env,
		mode: params.shouldRepair ? "import" : "dry-run"
	});
	const report = params.shouldRepair ? await require_doctor_sqlite_maintenance_lock.withDoctorSqliteMaintenanceLock({
		env: params.env,
		operation: "session SQLite import",
		run: runSessionSqlite
	}) : await runSessionSqlite();
	if (report.totals.legacyEntries === 0 && report.totals.unreferencedJsonlFiles === 0 && report.totals.issues === 0) return;
	const lines = [`- Legacy entries: ${report.totals.legacyEntries}; SQLite entries: ${report.totals.sqliteEntries}.`, `- Transcript events: imported=${report.totals.importedTranscriptEvents}; validated=${report.totals.validatedTranscriptEvents}.`];
	if (report.totals.archivedTranscriptFiles > 0) lines.push(`- Archived ${report.totals.archivedTranscriptFiles} legacy transcript artifact(s).`);
	if (report.totals.archivedUnreferencedJsonlFiles > 0) lines.push(`- Archived ${report.totals.archivedUnreferencedJsonlFiles} unreferenced JSONL artifact(s).`);
	if (report.totals.issues > 0) lines.push(`- Found ${report.totals.issues} session SQLite issue(s).`);
	if (!params.shouldRepair) lines.push("- Run \"operator doctor --fix\" to migrate legacy session metadata/transcripts to SQLite.");
	require_note.note(lines.join("\n"), "Session SQLite");
}
//#endregion
exports.detectSessionTranscriptHealthIssues = detectSessionTranscriptHealthIssues;
exports.noteSessionTranscriptHealth = noteSessionTranscriptHealth;
exports.sessionTranscriptIssueToHealthFinding = sessionTranscriptIssueToHealthFinding;
exports.sessionTranscriptIssueToRepairEffect = sessionTranscriptIssueToRepairEffect;
