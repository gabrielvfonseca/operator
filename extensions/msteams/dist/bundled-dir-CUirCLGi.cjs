const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_operator_root = require("./operator-root-D_zS4PlX.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
//#region src/skills/loading/bundled-dir.ts
function looksLikeSkillsDir(dir) {
	try {
		const entries = node_fs.default.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.name.startsWith(".")) continue;
			const fullPath = node_path.default.join(dir, entry.name);
			if (entry.isFile() && entry.name.endsWith(".md")) return true;
			if (entry.isDirectory()) {
				if (node_fs.default.existsSync(node_path.default.join(fullPath, "SKILL.md"))) return true;
			}
		}
	} catch {
		return false;
	}
	return false;
}
function resolveBundledSkillsDir(opts = {}) {
	const override = process.env.OPERATOR_BUNDLED_SKILLS_DIR?.trim();
	if (override) return override;
	try {
		const execPath = opts.execPath ?? process.execPath;
		const execDir = node_path.default.dirname(execPath);
		const sibling = node_path.default.join(execDir, "skills");
		if (node_fs.default.existsSync(sibling)) return sibling;
	} catch {}
	try {
		const moduleUrl = opts.moduleUrl ?? require("url").pathToFileURL(__filename).href;
		const moduleDir = node_path.default.dirname((0, node_url.fileURLToPath)(moduleUrl));
		const packageRoot = require_operator_root.resolveOperatorPackageRootSync({
			argv1: opts.argv1 ?? process.argv[1],
			moduleUrl,
			cwd: opts.cwd ?? process.cwd()
		});
		if (packageRoot) {
			const candidate = node_path.default.join(packageRoot, "skills");
			if (looksLikeSkillsDir(candidate)) return candidate;
		}
		let current = moduleDir;
		for (let depth = 0; depth < 6; depth += 1) {
			const candidate = node_path.default.join(current, "skills");
			if (looksLikeSkillsDir(candidate)) return candidate;
			const next = node_path.default.dirname(current);
			if (next === current) break;
			current = next;
		}
	} catch {}
}
//#endregion
Object.defineProperty(exports, "resolveBundledSkillsDir", {
	enumerable: true,
	get: function() {
		return resolveBundledSkillsDir;
	}
});
