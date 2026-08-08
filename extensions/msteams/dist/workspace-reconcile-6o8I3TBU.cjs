const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
//#region src/gateway/worker-environments/workspace-manifest.ts
const MAX_RECONCILIATION_ENTRIES = 25e3;
const MAX_RECONCILIATION_FILE_BYTES = 64 * 1024 * 1024;
const MAX_RECONCILIATION_TOTAL_BYTES = 256 * 1024 * 1024;
const MANIFEST_REF_PATTERN = /^sha256:([a-f0-9]{64})$/u;
const GIT_COMMIT_PATTERN = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u;
function manifestPath(value) {
	if (typeof value !== "string" || !value || value.includes("\\") || node_path.default.posix.isAbsolute(value) || node_path.default.posix.normalize(value) !== value || value === "." || value === ".." || value.startsWith("../")) throw new Error("Worker workspace manifest contains an unsafe path");
	return value;
}
function manifestMode(value) {
	if (!Number.isInteger(value) || value < 0 || value > 511) throw new Error("Worker workspace manifest contains an invalid mode");
	return value;
}
function gitFileMode(mode) {
	return (mode & 73) === 0 ? 420 : 493;
}
function parseRawEntry(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Worker workspace manifest contains an invalid entry");
	const entry = value;
	const entryPath = manifestPath(entry.path);
	const mode = manifestMode(entry.mode);
	if (entry.type === "directory") return {
		path: entryPath,
		type: "directory",
		mode
	};
	if (entry.type === "file") {
		if (!Number.isSafeInteger(entry.size) || entry.size < 0 || typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/u.test(entry.sha256)) throw new Error("Worker workspace manifest contains invalid file metadata");
		return {
			path: entryPath,
			type: "file",
			mode: gitFileMode(mode),
			size: entry.size,
			sha256: entry.sha256
		};
	}
	if (entry.type === "symlink") {
		if (typeof entry.target !== "string" || !entry.target || entry.target.includes("\\") || node_path.default.posix.isAbsolute(entry.target) || node_path.default.win32.parse(entry.target).root !== "") throw new Error("Worker workspace manifest contains an unsafe symlink");
		const syntheticRoot = "/workspace";
		const resolved = node_path.default.posix.resolve(node_path.default.posix.dirname(`${syntheticRoot}/${entryPath}`), entry.target);
		if (resolved !== syntheticRoot && !resolved.startsWith(`${syntheticRoot}/`)) throw new Error("Worker workspace manifest symlink escapes its root");
		return {
			path: entryPath,
			type: "symlink",
			mode: 511,
			target: entry.target
		};
	}
	throw new Error("Worker workspace manifest contains an unsupported entry type");
}
function validateAndProjectEntries(values) {
	if (values.length > 25e4) throw new Error("Worker workspace manifest has too many entries");
	const rawEntries = values.map(parseRawEntry);
	let previous = "";
	const byPath = /* @__PURE__ */ new Map();
	for (const entry of rawEntries) {
		if (byPath.has(entry.path) || previous && previous >= entry.path) throw new Error("Worker workspace manifest paths are not unique and sorted");
		const segments = entry.path.split("/");
		for (let index = 1; index < segments.length; index += 1) if (byPath.get(segments.slice(0, index).join("/"))?.type !== "directory") throw new Error("Worker workspace manifest entry has a non-directory parent");
		byPath.set(entry.path, entry);
		previous = entry.path;
	}
	return {
		entries: rawEntries.filter((entry) => entry.type !== "directory"),
		directories: rawEntries.filter((entry) => entry.type === "directory").map((entry) => entry.path)
	};
}
function parseWorkerWorkspaceManifest(raw, expectedRef) {
	if (Buffer.byteLength(raw) > 64 * 1024 * 1024) throw new Error("Worker workspace manifest exceeds the 64 MiB safety limit");
	const match = MANIFEST_REF_PATTERN.exec(expectedRef);
	if (!match) throw new Error("Worker workspace manifest reference is invalid");
	if ((0, node_crypto.createHash)("sha256").update(raw).digest("hex") !== match[1]) throw new Error("Worker workspace manifest digest does not match its reference");
	const value = JSON.parse(raw);
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Worker workspace manifest is invalid");
	const manifest = value;
	if (manifest.version !== 1 || manifest.baseCommit !== null && (typeof manifest.baseCommit !== "string" || !GIT_COMMIT_PATTERN.test(manifest.baseCommit)) || !Array.isArray(manifest.entries)) throw new Error("Worker workspace manifest has an unsupported shape");
	return {
		version: 1,
		baseCommit: manifest.baseCommit,
		...validateAndProjectEntries(manifest.entries)
	};
}
function parseJournalEntry(value) {
	const entry = parseRawEntry(value);
	if (entry.type === "directory") throw new Error("Worker workspace reconciliation journal contains a directory entry");
	return entry;
}
function serializeWorkerWorkspaceReconciliationPlan(journal) {
	return JSON.stringify({
		version: journal.version,
		temporaryNonce: journal.temporaryNonce,
		baseManifestRef: journal.baseManifestRef,
		currentManifestRef: journal.currentManifestRef,
		baseEntries: journal.baseEntries,
		appliedEntries: journal.appliedEntries,
		baseTree: journal.baseTree,
		basePackSha256: journal.basePackSha256
	});
}
function parseWorkerWorkspaceReconciliationPlan(raw) {
	const value = JSON.parse(raw);
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Worker workspace reconciliation journal is invalid");
	const plan = value;
	if (plan.version !== 1 || typeof plan.temporaryNonce !== "string" || !/^[a-f0-9]{32}$/u.test(plan.temporaryNonce) || typeof plan.baseManifestRef !== "string" || !MANIFEST_REF_PATTERN.test(plan.baseManifestRef) || typeof plan.currentManifestRef !== "string" || !MANIFEST_REF_PATTERN.test(plan.currentManifestRef) || typeof plan.baseTree !== "string" || !/^[a-f0-9]{40}$/u.test(plan.baseTree) || typeof plan.basePackSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(plan.basePackSha256) || !Array.isArray(plan.baseEntries) || !Array.isArray(plan.appliedEntries) || plan.baseEntries.length + plan.appliedEntries.length > 25e3) throw new Error("Worker workspace reconciliation journal has an unsupported shape");
	const baseEntries = plan.baseEntries.map(parseJournalEntry);
	const appliedEntries = plan.appliedEntries.map(parseJournalEntry);
	for (const entries of [baseEntries, appliedEntries]) {
		const paths = entries.map((entry) => entry.path);
		if (new Set(paths).size !== paths.length) throw new Error("Worker workspace reconciliation journal has duplicate paths");
	}
	return {
		version: 1,
		temporaryNonce: plan.temporaryNonce,
		baseManifestRef: plan.baseManifestRef,
		currentManifestRef: plan.currentManifestRef,
		baseEntries,
		appliedEntries,
		baseTree: plan.baseTree,
		basePackSha256: plan.basePackSha256
	};
}
//#endregion
//#region src/gateway/worker-environments/workspace-reconcile.ts
const PATCH_TIMEOUT_MS = 10 * 6e4;
var ConcurrentWorkspacePathError = class extends Error {};
function localPath(root, relative) {
	return node_path.default.join(root, ...relative.split("/"));
}
async function sha256File(filePath) {
	const hash = (0, node_crypto.createHash)("sha256");
	for await (const chunk of (0, node_fs.createReadStream)(filePath)) hash.update(chunk);
	return hash.digest("hex");
}
async function absoluteEntryMatches(absolute, entry) {
	const stats = await node_fs_promises.default.lstat(absolute).catch(() => void 0);
	if (!stats) return false;
	if (entry.type === "symlink") return stats.isSymbolicLink() && await node_fs_promises.default.readlink(absolute) === entry.target;
	return stats.isFile() && !stats.isSymbolicLink() && gitFileMode(stats.mode & 511) === entry.mode && stats.size === entry.size && await sha256File(absolute) === entry.sha256;
}
async function entryMatches(root, entry) {
	return await absoluteEntryMatches(localPath(root, entry.path), entry);
}
async function assertWorkspaceMatchesManifest(params) {
	const root = await node_fs_promises.default.realpath(params.root);
	for (const entry of params.entries ?? params.manifest.entries) if (!await entryMatches(root, entry)) throw new ConcurrentWorkspacePathError(`Gateway workspace changed after cloud dispatch: ${entry.path}`);
}
function sameEntry(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}
function changedPaths(base, current) {
	const baseByPath = new Map(base.entries.map((entry) => [entry.path, entry]));
	const currentByPath = new Map(current.entries.map((entry) => [entry.path, entry]));
	return new Set([.../* @__PURE__ */ new Set([...baseByPath.keys(), ...currentByPath.keys()])].filter((entryPath) => !sameEntry(baseByPath.get(entryPath), currentByPath.get(entryPath))));
}
function hasReplacedBaseEntryAncestor(entryPath, baseByPath, currentByPath) {
	const segments = entryPath.split("/");
	for (let index = 1; index < segments.length; index += 1) {
		const ancestor = segments.slice(0, index).join("/");
		const baseEntry = baseByPath.get(ancestor);
		if (baseEntry && !sameEntry(baseEntry, currentByPath.get(ancestor))) return true;
	}
	return false;
}
function workerWorkspaceTransferPaths(current, base) {
	const changed = changedPaths(base, current);
	const paths = current.entries.filter((entry) => changed.has(entry.path)).map((entry) => {
		if (entry.type === "file" && entry.size > 67108864) throw new Error(`Cloud workspace result is too large: ${entry.path}`);
		return entry.path;
	});
	if (paths.length > 25e3) throw new Error(`Cloud workspace reconciliation exceeds the ${MAX_RECONCILIATION_ENTRIES} entry limit`);
	return paths;
}
async function preflightWorkspaceApply(params) {
	await assertWorkspaceMatchesManifest({
		root: params.root,
		manifest: params.base
	});
	const baseByPath = new Map(params.base.entries.map((entry) => [entry.path, entry]));
	const currentByPath = new Map(params.current.entries.map((entry) => [entry.path, entry]));
	const baseDirectories = new Set(params.base.directories ?? []);
	const baseNonemptyDirectories = /* @__PURE__ */ new Set();
	for (const entry of params.base.entries) {
		const segments = entry.path.split("/");
		for (let index = 1; index < segments.length; index += 1) baseNonemptyDirectories.add(segments.slice(0, index).join("/"));
	}
	const directoryContainsOnlyBase = async (entryPath) => {
		const pending = [entryPath];
		while (pending.length > 0) {
			const directory = pending.pop();
			for (const name of await node_fs_promises.default.readdir(localPath(params.root, directory))) {
				const childPath = `${directory}/${name}`;
				const stats = await node_fs_promises.default.lstat(localPath(params.root, childPath));
				if (stats.isDirectory() && !stats.isSymbolicLink()) {
					if (!baseDirectories.has(childPath)) return false;
					pending.push(childPath);
					continue;
				}
				const baseEntry = baseByPath.get(childPath);
				if (!baseEntry || !await entryMatches(params.root, baseEntry)) return false;
			}
		}
		return true;
	};
	for (const entry of params.current.entries) {
		if (baseByPath.has(entry.path)) continue;
		const segments = entry.path.split("/");
		let replacedBaseAncestor = false;
		for (let index = 1; index < segments.length; index += 1) {
			const ancestor = segments.slice(0, index).join("/");
			const existingAncestor = await node_fs_promises.default.lstat(localPath(params.root, ancestor)).catch(() => void 0);
			if (!existingAncestor || existingAncestor.isDirectory() && !existingAncestor.isSymbolicLink()) continue;
			const baseAncestor = baseByPath.get(ancestor);
			if (baseAncestor && !sameEntry(baseAncestor, currentByPath.get(ancestor))) {
				replacedBaseAncestor = true;
				break;
			}
			throw new Error(`Cloud workspace result conflicts with a local-only path: ${ancestor}`);
		}
		if (replacedBaseAncestor) continue;
		const existing = await node_fs_promises.default.lstat(localPath(params.root, entry.path)).catch(() => void 0);
		if (existing?.isDirectory() && !existing.isSymbolicLink() && baseDirectories.has(entry.path) && baseNonemptyDirectories.has(entry.path) && await directoryContainsOnlyBase(entry.path)) continue;
		if (existing && !await entryMatches(params.root, entry)) throw new Error(`Cloud workspace result conflicts with a local-only path: ${entry.path}`);
	}
}
async function assertWorkspaceResultStable(params) {
	await assertWorkspaceMatchesManifest({
		root: params.root,
		manifest: params.current
	});
	const currentPaths = new Set(params.current.entries.map((entry) => entry.path));
	const currentDirectories = new Set(params.current.directories ?? []);
	for (const entry of params.base.entries) {
		if (currentPaths.has(entry.path) || currentDirectories.has(entry.path)) continue;
		if (await node_fs_promises.default.lstat(localPath(params.root, entry.path)).catch(() => void 0)) throw new ConcurrentWorkspacePathError(`Gateway workspace changed after cloud dispatch: ${entry.path}`);
	}
}
async function requireGit(cwd, args, input, env) {
	const result = await require_exec.runCommandWithTimeout([
		"git",
		"-C",
		cwd,
		...args
	], {
		timeoutMs: PATCH_TIMEOUT_MS,
		...input ? { input } : {},
		...env ? { env } : {},
		maxOutputBytes: 1024 * 1024
	});
	if (result.termination !== "exit" || result.code !== 0) throw new Error((result.stderr || result.stdout || `git ${args[0]} failed`).trim());
	return result.stdout.trim();
}
async function materializeSnapshotEntry(params) {
	const target = localPath(params.root, params.entry.path);
	await node_fs_promises.default.mkdir(node_path.default.dirname(target), {
		recursive: true,
		mode: 448
	});
	if (params.entry.type === "symlink") {
		await node_fs_promises.default.symlink(params.entry.target, target);
		return;
	}
	if (params.content) await node_fs_promises.default.writeFile(target, params.content, {
		mode: params.entry.mode,
		flag: "wx"
	});
	else if (params.sourceRoot) await node_fs_promises.default.copyFile(localPath(params.sourceRoot, params.entry.path), target);
	else throw new Error(`Cloud workspace snapshot content is missing: ${params.entry.path}`);
	await node_fs_promises.default.chmod(target, params.entry.mode);
	if (!await absoluteEntryMatches(target, params.entry)) throw new Error(`Cloud workspace staged payload is invalid: ${params.entry.path}`);
}
async function writeRawWorkspaceTree(params) {
	const blobs = [];
	let mark = 1;
	for (const entry of params.entries.toSorted((left, right) => left.path.localeCompare(right.path))) {
		const content = entry.type === "symlink" ? Buffer.from(entry.target) : await node_fs_promises.default.readFile(localPath(params.repositoryRoot, entry.path));
		blobs.push({
			entry,
			mark,
			content
		});
		mark += 1;
	}
	const ref = `refs/heads/operator-snapshot-${(0, node_crypto.randomBytes)(16).toString("hex")}`;
	const chunks = [];
	for (const blob of blobs) {
		chunks.push(Buffer.from(`blob\nmark :${blob.mark}\ndata ${blob.content.byteLength}\n`));
		chunks.push(blob.content, Buffer.from("\n"));
	}
	chunks.push(Buffer.from(`commit ${ref}\ncommitter Operator <noreply@operator.ai> 0 +0000\ndata 0\ndeleteall\n`));
	for (const blob of blobs) {
		const mode = blob.entry.type === "symlink" ? "120000" : (blob.entry.mode & 73) !== 0 ? "100755" : "100644";
		chunks.push(Buffer.from(`M ${mode} :${blob.mark} ${JSON.stringify(blob.entry.path)}\n`));
	}
	chunks.push(Buffer.from("done\n"));
	const imported = await require_exec.runCommandBuffered([
		"git",
		"-C",
		params.repositoryRoot,
		"fast-import",
		"--quiet"
	], {
		input: Buffer.concat(chunks),
		timeoutMs: PATCH_TIMEOUT_MS,
		maxOutputBytes: {
			stdout: 1024 * 1024,
			stderr: 1024 * 1024
		}
	});
	if (imported.termination !== "exit" || imported.code !== 0) throw new Error(imported.stderr.toString("utf8").trim() || "git fast-import failed");
	return await requireGit(params.repositoryRoot, ["rev-parse", `${ref}^{tree}`]);
}
async function createWorkspacePatch(params) {
	const temporary = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-workspace-patch-"));
	try {
		await requireGit(temporary, [
			"init",
			"--quiet",
			"--object-format=sha1"
		]);
		let bytes = 0;
		for (const entry of params.baseEntries) {
			let content;
			if (entry.type === "file") {
				if (entry.size > 67108864) throw new Error(`Cloud workspace rollback file is too large: ${entry.path}`);
				content = await node_fs_promises.default.readFile(localPath(params.root, entry.path));
				bytes += content.byteLength;
			}
			if (bytes > 268435456) throw new Error("Cloud workspace rollback exceeds its byte limit");
			await materializeSnapshotEntry({
				root: temporary,
				entry,
				content
			});
		}
		const baseTree = await writeRawWorkspaceTree({
			repositoryRoot: temporary,
			entries: params.baseEntries
		});
		const packed = await require_exec.runCommandBuffered([
			"git",
			"-C",
			temporary,
			"pack-objects",
			"--stdout",
			"--revs"
		], {
			input: Buffer.from(`${baseTree}\n`),
			timeoutMs: PATCH_TIMEOUT_MS,
			maxOutputBytes: {
				stdout: 268435457,
				stderr: 1024 * 1024
			}
		});
		if (packed.termination !== "exit" || packed.code !== 0) throw new Error(packed.stderr.toString("utf8").trim() || "git pack-objects failed");
		if (packed.stdout.byteLength > 268435456) throw new Error("Cloud workspace recovery snapshot exceeds its byte limit");
		for (const name of await node_fs_promises.default.readdir(temporary)) if (name !== ".git") await node_fs_promises.default.rm(node_path.default.join(temporary, name), {
			recursive: true,
			force: true
		});
		for (const entry of params.appliedEntries) await materializeSnapshotEntry({
			root: temporary,
			entry,
			sourceRoot: params.stagingRoot
		});
		const diff = await require_exec.runCommandBuffered([
			"git",
			"-C",
			temporary,
			"diff",
			"--binary",
			"--full-index",
			"--no-renames",
			baseTree,
			await writeRawWorkspaceTree({
				repositoryRoot: temporary,
				entries: params.appliedEntries
			}),
			"--"
		], {
			timeoutMs: PATCH_TIMEOUT_MS,
			maxOutputBytes: {
				stdout: 268435457,
				stderr: 1024 * 1024
			}
		});
		if (diff.termination !== "exit" || diff.code !== 0) throw new Error(diff.stderr.toString("utf8").trim() || "git diff failed");
		if (diff.stdout.byteLength > 268435456) throw new Error("Cloud workspace patch exceeds its byte limit");
		return {
			patch: diff.stdout,
			baseTree,
			basePack: packed.stdout
		};
	} finally {
		await node_fs_promises.default.rm(temporary, {
			recursive: true,
			force: true
		});
	}
}
async function applyWorkspacePatch(params) {
	if (params.patch.byteLength === 0) return;
	const nonexistentGitDirectory = node_path.default.join(node_os.default.tmpdir(), `operator-no-git-${(0, node_crypto.randomBytes)(16).toString("hex")}`);
	await requireGit(params.root, [
		"apply",
		"--no-index",
		"--binary",
		"--whitespace=nowarn",
		...params.reverse ? ["--reverse"] : []
	], params.patch, { GIT_DIR: nonexistentGitDirectory });
}
function validateJournalSnapshot(journal) {
	if (journal.basePack.byteLength > 268435456 || !/^[a-f0-9]{40}$/u.test(journal.baseTree) || (0, node_crypto.createHash)("sha256").update(journal.basePack).digest("hex") !== journal.basePackSha256) throw new Error("Cloud workspace reconciliation recovery snapshot is invalid");
}
async function directoryContainsOnlyJournalPaths(root, directory, paths, directories) {
	for (const name of await node_fs_promises.default.readdir(localPath(root, directory))) {
		const child = `${directory}/${name}`;
		const stats = await node_fs_promises.default.lstat(localPath(root, child));
		if (stats.isDirectory() && !stats.isSymbolicLink()) {
			if (!directories.has(child)) return false;
			if (!await directoryContainsOnlyJournalPaths(root, child, paths, directories)) return false;
		} else if (!paths.has(child)) return false;
	}
	return true;
}
async function createWorkspaceRecoveryPatch(params) {
	const temporary = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-workspace-recovery-"));
	try {
		await requireGit(temporary, [
			"init",
			"--quiet",
			"--object-format=sha1"
		]);
		await requireGit(temporary, ["index-pack", "--stdin"], params.journal.basePack);
		await requireGit(temporary, [
			"cat-file",
			"-e",
			`${params.journal.baseTree}^{tree}`
		]);
		const baseByPath = new Map(params.journal.baseEntries.map((entry) => [entry.path, entry]));
		const appliedByPath = new Map(params.journal.appliedEntries.map((entry) => [entry.path, entry]));
		const paths = /* @__PURE__ */ new Set([...baseByPath.keys(), ...appliedByPath.keys()]);
		const directories = /* @__PURE__ */ new Set();
		for (const entryPath of paths) {
			const segments = entryPath.split("/");
			for (let index = 1; index < segments.length; index += 1) directories.add(segments.slice(0, index).join("/"));
		}
		const actualEntries = [];
		for (const entryPath of [...paths].toSorted()) {
			const absolute = localPath(params.root, entryPath);
			const stats = await node_fs_promises.default.lstat(absolute).catch(() => void 0);
			if (!stats) {
				const baseEntry = baseByPath.get(entryPath);
				const appliedEntry = appliedByPath.get(entryPath);
				if (baseEntry && appliedEntry) throw new ConcurrentWorkspacePathError(`Gateway workspace changed while cloud recovery was pending: ${entryPath}`);
				continue;
			}
			const baseEntry = baseByPath.get(entryPath);
			const appliedEntry = appliedByPath.get(entryPath);
			if (baseEntry && await absoluteEntryMatches(absolute, baseEntry)) {
				actualEntries.push(baseEntry);
				continue;
			}
			if (appliedEntry && await absoluteEntryMatches(absolute, appliedEntry)) {
				actualEntries.push(appliedEntry);
				continue;
			}
			if (!(stats.isDirectory() && !stats.isSymbolicLink() && directories.has(entryPath) && await directoryContainsOnlyJournalPaths(params.root, entryPath, paths, directories))) throw new ConcurrentWorkspacePathError(`Gateway workspace changed while cloud recovery was pending: ${entryPath}`);
		}
		for (const entry of actualEntries) await materializeSnapshotEntry({
			root: temporary,
			entry,
			sourceRoot: params.root
		});
		const diff = await require_exec.runCommandBuffered([
			"git",
			"-C",
			temporary,
			"diff",
			"--binary",
			"--full-index",
			"--no-renames",
			await writeRawWorkspaceTree({
				repositoryRoot: temporary,
				entries: actualEntries
			}),
			params.journal.baseTree,
			"--"
		], {
			timeoutMs: PATCH_TIMEOUT_MS,
			maxOutputBytes: {
				stdout: 268435457,
				stderr: 1024 * 1024
			}
		});
		if (diff.termination !== "exit" || diff.code !== 0) throw new Error(diff.stderr.toString("utf8").trim() || "git recovery diff failed");
		if (diff.stdout.byteLength > 268435456) throw new Error("Cloud workspace recovery patch exceeds its byte limit");
		return diff.stdout;
	} finally {
		await node_fs_promises.default.rm(temporary, {
			recursive: true,
			force: true
		});
	}
}
async function assertWorkspaceRecoveryBase(params) {
	await assertWorkspaceMatchesManifest({
		root: params.root,
		manifest: {
			version: 1,
			baseCommit: null,
			entries: params.journal.baseEntries
		}
	});
	const basePaths = new Set(params.journal.baseEntries.map((entry) => entry.path));
	const baseDirectories = /* @__PURE__ */ new Set();
	for (const entryPath of basePaths) {
		const segments = entryPath.split("/");
		for (let index = 1; index < segments.length; index += 1) baseDirectories.add(segments.slice(0, index).join("/"));
	}
	for (const entry of params.journal.appliedEntries) {
		if (basePaths.has(entry.path)) continue;
		const existing = await node_fs_promises.default.lstat(localPath(params.root, entry.path)).catch(() => void 0);
		if (existing?.isDirectory() && !existing.isSymbolicLink() && baseDirectories.has(entry.path) && await directoryContainsOnlyJournalPaths(params.root, entry.path, basePaths, baseDirectories)) continue;
		if (existing) throw new ConcurrentWorkspacePathError(`Gateway workspace changed while cloud recovery was pending: ${entry.path}`);
	}
}
async function recoverWorkerWorkspaceReconciliation(params) {
	if (params.preservePaths?.size) throw new Error("Cloud workspace patch recovery cannot preserve partial paths");
	const root = await node_fs_promises.default.realpath(params.root);
	validateJournalSnapshot(params.journal);
	try {
		await assertWorkspaceRecoveryBase({
			root,
			journal: params.journal
		});
		return;
	} catch {}
	await applyWorkspacePatch({
		root,
		patch: await createWorkspaceRecoveryPatch({
			root,
			journal: params.journal
		})
	});
	await assertWorkspaceRecoveryBase({
		root,
		journal: params.journal
	});
}
async function applyStagedWorkerWorkspace(params) {
	const root = await node_fs_promises.default.realpath(params.root);
	await preflightWorkspaceApply({
		root,
		base: params.base,
		current: params.current
	});
	const changed = changedPaths(params.base, params.current);
	if (changed.size === 0) {
		params.journal.commit(params.currentManifestRef);
		return;
	}
	const baseByPath = new Map(params.base.entries.map((entry) => [entry.path, entry]));
	const currentByPath = new Map(params.current.entries.map((entry) => [entry.path, entry]));
	const baseEntries = params.base.entries.filter((entry) => changed.has(entry.path));
	const appliedEntries = [];
	for (const entry of params.current.entries) {
		if (!changed.has(entry.path)) continue;
		if (!baseByPath.has(entry.path) && !hasReplacedBaseEntryAncestor(entry.path, baseByPath, currentByPath) && await entryMatches(root, entry)) continue;
		appliedEntries.push(entry);
	}
	if (baseEntries.length + appliedEntries.length > 25e3) throw new Error(`Cloud workspace reconciliation exceeds the ${MAX_RECONCILIATION_ENTRIES} entry limit`);
	const snapshot = await createWorkspacePatch({
		root,
		stagingRoot: params.stagingRoot,
		baseEntries,
		appliedEntries
	});
	const journal = {
		version: 1,
		temporaryNonce: (0, node_crypto.randomBytes)(16).toString("hex"),
		baseManifestRef: params.baseManifestRef,
		currentManifestRef: params.currentManifestRef,
		baseEntries,
		appliedEntries,
		baseTree: snapshot.baseTree,
		basePackSha256: (0, node_crypto.createHash)("sha256").update(snapshot.basePack).digest("hex"),
		basePack: snapshot.basePack
	};
	params.journal.begin(journal);
	try {
		await applyWorkspacePatch({
			root,
			patch: snapshot.patch
		});
		await assertWorkspaceResultStable({
			root,
			base: params.base,
			current: params.current
		});
		params.journal.commit(params.currentManifestRef);
	} catch (error) {
		try {
			await recoverWorkerWorkspaceReconciliation({
				root,
				journal
			});
			params.journal.abort();
		} catch (rollbackError) {
			const recoveryError = new Error("Cloud reconciliation failed and rollback needs recovery", { cause: error });
			Object.defineProperty(recoveryError, "rollbackError", { value: rollbackError });
			throw recoveryError;
		}
		throw error;
	}
}
//#endregion
Object.defineProperty(exports, "MAX_RECONCILIATION_ENTRIES", {
	enumerable: true,
	get: function() {
		return MAX_RECONCILIATION_ENTRIES;
	}
});
Object.defineProperty(exports, "MAX_RECONCILIATION_FILE_BYTES", {
	enumerable: true,
	get: function() {
		return MAX_RECONCILIATION_FILE_BYTES;
	}
});
Object.defineProperty(exports, "MAX_RECONCILIATION_TOTAL_BYTES", {
	enumerable: true,
	get: function() {
		return MAX_RECONCILIATION_TOTAL_BYTES;
	}
});
Object.defineProperty(exports, "applyStagedWorkerWorkspace", {
	enumerable: true,
	get: function() {
		return applyStagedWorkerWorkspace;
	}
});
Object.defineProperty(exports, "assertWorkspaceMatchesManifest", {
	enumerable: true,
	get: function() {
		return assertWorkspaceMatchesManifest;
	}
});
Object.defineProperty(exports, "assertWorkspaceResultStable", {
	enumerable: true,
	get: function() {
		return assertWorkspaceResultStable;
	}
});
Object.defineProperty(exports, "parseWorkerWorkspaceManifest", {
	enumerable: true,
	get: function() {
		return parseWorkerWorkspaceManifest;
	}
});
Object.defineProperty(exports, "parseWorkerWorkspaceReconciliationPlan", {
	enumerable: true,
	get: function() {
		return parseWorkerWorkspaceReconciliationPlan;
	}
});
Object.defineProperty(exports, "recoverWorkerWorkspaceReconciliation", {
	enumerable: true,
	get: function() {
		return recoverWorkerWorkspaceReconciliation;
	}
});
Object.defineProperty(exports, "serializeWorkerWorkspaceReconciliationPlan", {
	enumerable: true,
	get: function() {
		return serializeWorkerWorkspaceReconciliationPlan;
	}
});
Object.defineProperty(exports, "workerWorkspaceTransferPaths", {
	enumerable: true,
	get: function() {
		return workerWorkspaceTransferPaths;
	}
});
