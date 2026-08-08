require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_container_environment = require("./container-environment-BT54HraU.cjs");
const require_status = require("./status-BcOaWXbB.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_detect_binary = require("./detect-binary-B24IC5Ac.cjs");
const require_brew = require("./brew-AlfQfN6s.cjs");
require("./onboard-helpers-B8YMO226.cjs");
const require_install = require("./install-fu_O7Fut.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/commands/onboard-skills.ts
/**
* Interactive skill dependency setup for onboarding.
*
* It reports workspace skill readiness, offers safe dependency installs, and
* leaves per-skill credentials to the agent when a skill actually needs them.
*/
const HOMEBREW_PROMPT_PLATFORMS = /* @__PURE__ */ new Set(["darwin", "linux"]);
const SKIPPED_INSTALL_NAME_LIMIT = 8;
function supportsHomebrewPrompt(platform) {
	return HOMEBREW_PROMPT_PLATFORMS.has(platform);
}
function summarizeInstallFailure(message) {
	const cleaned = message.replace(/^Install failed(?:\s*\([^)]*\))?\s*:?\s*/i, "").trim();
	if (!cleaned) return;
	const maxLen = 140;
	return cleaned.length > maxLen ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(cleaned, maxLen - 1)}…` : cleaned;
}
function formatSkillHint(skill) {
	const desc = skill.description?.trim();
	const installLabel = skill.install[0]?.label?.trim();
	const combined = desc && installLabel ? `${desc} — ${installLabel}` : desc || installLabel;
	if (!combined) return "install";
	const maxLen = 90;
	return combined.length > maxLen ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(combined, maxLen - 1)}…` : combined;
}
const testing = {
	formatSkillHint,
	summarizeInstallFailure
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.onboardSkillsTestApi")] = testing;
const SKIP_REASON_LABELS = {
	brew: "Homebrew",
	go: `Go toolchain (${require_install.MIN_AUTO_GO_VERSION}+)`,
	uv: "uv"
};
function formatSkillNames(names) {
	const visible = names.slice(0, SKIPPED_INSTALL_NAME_LIMIT);
	const suffix = names.length > visible.length ? ` (+${names.length - visible.length} more)` : "";
	return `${visible.join(", ")}${suffix}`;
}
function formatSkippedInstallNote(skipped) {
	const byReason = /* @__PURE__ */ new Map();
	for (const item of skipped) {
		const names = byReason.get(item.reason) ?? [];
		names.push(item.skill.name);
		byReason.set(item.reason, names);
	}
	const lines = [require_i18n.t("wizard.skills.manualPrereqsIntro")];
	for (const reason of [
		"brew",
		"go",
		"uv"
	]) {
		const names = byReason.get(reason);
		if (!names || names.length === 0) continue;
		lines.push(`${SKIP_REASON_LABELS[reason]}: ${formatSkillNames(names)}`);
	}
	for (const item of skipped.filter((entry) => entry.detail).slice(0, SKIPPED_INSTALL_NAME_LIMIT)) lines.push(`${item.skill.name}: ${item.detail}`);
	lines.push(require_i18n.t("wizard.skills.manualPrereqsDoctorHint"));
	return lines.join("\n");
}
function isBrewOnlyInstallableSkill(skill) {
	return skill.install.length > 0 && skill.missing.bins.length > 0 && skill.install.every((option) => option.kind === "brew");
}
function isTrustedAutoInstallableSkill(skill) {
	return skill.bundled && skill.source === "operator-bundled";
}
function isNodeManagerChoice(value) {
	return value === "npm" || value === "pnpm" || value === "bun";
}
function resolveDefaultNodeManager(config, requested, runtime) {
	if (requested !== void 0) {
		if (!isNodeManagerChoice(requested)) {
			runtime.error("Invalid --node-manager. Use \"npm\", \"pnpm\", or \"bun\".");
			runtime.exit(1);
			return "npm";
		}
		return requested;
	}
	const existing = config.skills?.install?.nodeManager;
	return existing === "npm" || existing === "pnpm" || existing === "bun" ? existing : "npm";
}
/** Runs the interactive skills setup step and returns the updated config. */
async function setupSkills(cfg, workspaceDir, runtime, prompter, options = {}) {
	const report = require_status.buildWorkspaceSkillStatus(workspaceDir, { config: cfg });
	const eligible = report.skills.filter((s) => s.eligible);
	const unsupportedOs = report.skills.filter((s) => !s.disabled && !s.blockedByAllowlist && s.missing.os.length > 0);
	const missing = report.skills.filter((s) => !s.eligible && !s.disabled && !s.blockedByAllowlist && s.missing.os.length === 0);
	const blocked = report.skills.filter((s) => s.blockedByAllowlist);
	await prompter.note([
		`Eligible: ${eligible.length}`,
		`Missing requirements: ${missing.length}`,
		`Unsupported on this OS: ${unsupportedOs.length}`,
		`Blocked by allowlist: ${blocked.length}`
	].join("\n"), require_i18n.t("wizard.skills.statusTitle"));
	const baseInstallable = missing.filter((skill) => skill.install.length > 0 && skill.missing.bins.length > 0 && isTrustedAutoInstallableSkill(skill));
	let brewAvailable;
	const detectBrewOnce = async () => {
		brewAvailable ??= await require_detect_binary.detectBinary("brew") || require_brew.resolveBrewExecutable() !== void 0;
		return brewAvailable;
	};
	const readinessByKind = /* @__PURE__ */ new Map();
	const resolveKindReadinessOnce = async (kind) => {
		const cached = readinessByKind.get(kind);
		if (cached) return cached;
		const readiness = await require_install.resolveInstallerKindReadiness(kind);
		readinessByKind.set(kind, readiness);
		return readiness;
	};
	const inLinuxContainer = process.platform === "linux" && require_container_environment.isContainerEnvironment();
	let installable = baseInstallable;
	if (inLinuxContainer && baseInstallable.length > 0 && !await detectBrewOnce()) {
		const hiddenBrewOnly = baseInstallable.filter(isBrewOnlyInstallableSkill);
		installable = baseInstallable.filter((skill) => !isBrewOnlyInstallableSkill(skill));
		if (hiddenBrewOnly.length > 0) await prompter.note([require_i18n.t("wizard.skills.containerBrewHidden"), require_i18n.t("wizard.skills.containerBrewManual")].join("\n"), require_i18n.t("wizard.skills.containerInstallsTitle"));
	}
	const candidateInstallable = installable;
	const needsBrewPrompt = supportsHomebrewPrompt(process.platform) && candidateInstallable.some((skill) => skill.install.some((option) => option.kind === "brew")) && !await detectBrewOnce();
	const readyInstallable = [];
	const skippedInstallable = [];
	for (const skill of candidateInstallable) {
		const primaryInstall = skill.install[0];
		if (!primaryInstall) continue;
		const readiness = await resolveKindReadinessOnce(primaryInstall.kind);
		if (readiness.ready) readyInstallable.push(skill);
		else skippedInstallable.push({
			skill,
			reason: readiness.reason
		});
	}
	installable = readyInstallable;
	if (needsBrewPrompt) await prompter.note([
		"Many skill dependencies are shipped via Homebrew.",
		"Without brew, you'll need to build from source or download releases manually.",
		"",
		"Install Homebrew:",
		"/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
	].join("\n"), require_i18n.t("wizard.skills.homebrewRecommendedTitle"));
	if (skippedInstallable.length > 0) await prompter.note(formatSkippedInstallNote(skippedInstallable), require_i18n.t("wizard.skills.manualPrereqsTitle"));
	let next = cfg;
	if (installable.length === 0 && missing.length === 0) {
		await prompter.note([
			"No missing skill dependencies to install.",
			`To inspect available skills, run: ${require_command_format.formatCliCommand("openclaw skills list --verbose")}`,
			`To check skill status, run: ${require_command_format.formatCliCommand("openclaw skills check")}`
		].join("\n"), require_i18n.t("wizard.skills.allReadyTitle") ?? "All skills ready");
		return next;
	}
	if (installable.length > 0) {
		await prompter.note(installable.map((skill) => `${skill.name}: ${formatSkillHint(skill)}`).join("\n"), require_i18n.t("wizard.skills.installDeps"));
		const selectedSkills = installable;
		if (selectedSkills.some((skill) => skill.install.some((option) => option.kind === "node"))) {
			const nodeManager = resolveDefaultNodeManager(next, options.nodeManager, runtime);
			next = {
				...next,
				skills: {
					...next.skills,
					install: {
						...next.skills?.install,
						nodeManager
					}
				}
			};
		}
		const deferredSkippedInstallable = [];
		for (const target of selectedSkills) {
			if (target.install.length === 0) continue;
			const installId = target.install[0]?.id;
			if (!installId) continue;
			const spin = prompter.progress(require_i18n.t("wizard.skills.installing", { name: target.name }));
			const result = await require_install.installSkill({
				workspaceDir,
				skillName: target.name,
				installId,
				config: next
			});
			const warnings = result.warnings ?? [];
			if (result.ok) {
				spin.stop(warnings.length > 0 ? require_i18n.t("wizard.skills.installedWithWarnings", { name: target.name }) : require_i18n.t("wizard.skills.installed", { name: target.name }));
				for (const warning of warnings) runtime.log(warning);
				continue;
			}
			if (result.skipReason) {
				spin.stop(require_i18n.t("wizard.skills.installSkipped", { name: target.name }));
				const detail = summarizeInstallFailure(result.message);
				deferredSkippedInstallable.push({
					skill: target,
					reason: result.skipReason,
					...detail ? { detail } : {}
				});
				for (const warning of warnings) runtime.log(warning);
				continue;
			}
			const code = result.code == null ? "" : ` (exit ${result.code})`;
			const detail = summarizeInstallFailure(result.message);
			spin.stop(require_i18n.t("wizard.skills.installFailed", {
				name: target.name,
				code,
				detail: detail ? ` - ${detail}` : ""
			}));
			for (const warning of warnings) runtime.log(warning);
			if (result.stderr) runtime.log(result.stderr.trim());
			else if (result.stdout) runtime.log(result.stdout.trim());
			runtime.log(`Tip: run \`${require_command_format.formatCliCommand("openclaw doctor")}\` to review skills + requirements.`);
			runtime.log(require_i18n.t("wizard.skills.docsLine"));
		}
		if (deferredSkippedInstallable.length > 0) await prompter.note(formatSkippedInstallNote(deferredSkippedInstallable), require_i18n.t("wizard.skills.manualPrereqsTitle"));
	}
	return next;
}
//#endregion
exports.setupSkills = setupSkills;
