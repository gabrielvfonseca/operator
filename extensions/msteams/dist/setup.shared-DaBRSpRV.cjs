const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_plain_object = require("./plain-object-CITRo0uW.cjs");
require("./utils-CXqBhRFw.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_config = require("./config-DT0qiglW.cjs");
const require_prompts = require("./prompts-DyiRjrc3.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_install_record_commit = require("./install-record-commit-BUsKCeHe.cjs");
let chalk = require("chalk");
chalk = require_rolldown_runtime.__toESM(chalk, 1);
let node_util = require("node:util");
//#region src/wizard/setup.security-note.ts
const heading = (text) => chalk.default.bold(text);
function getSecurityNoteTitle() {
	return require_i18n.t("wizard.security.title");
}
function getSecurityConfirmMessage() {
	return require_i18n.t("wizard.security.confirm");
}
function getSecurityNoteMessage() {
	return [
		require_i18n.t("wizard.security.beta"),
		require_i18n.t("wizard.security.personalAgent"),
		require_i18n.t("wizard.security.toolAccess"),
		require_i18n.t("wizard.security.promptRisk"),
		"",
		require_i18n.t("wizard.security.notMultitenant"),
		require_i18n.t("wizard.security.sharedAuthority"),
		"",
		require_i18n.t("wizard.security.hardeningRequired"),
		require_i18n.t("wizard.security.askForHelp"),
		"",
		heading(require_i18n.t("wizard.security.recommendedBaseline")),
		`- ${require_i18n.t("wizard.security.baselinePairing")}`,
		`- ${require_i18n.t("wizard.security.baselineSharedInbox")}`,
		`- ${require_i18n.t("wizard.security.baselineSandbox")}`,
		`- ${require_i18n.t("wizard.security.baselineDmSessions")}`,
		`- ${require_i18n.t("wizard.security.baselineSecrets")}`,
		`- ${require_i18n.t("wizard.security.baselineStrongModel")}`,
		"",
		heading(require_i18n.t("wizard.security.runRegularly")),
		require_command_format.formatCliCommand("operator security audit --deep"),
		require_command_format.formatCliCommand("operator security audit --fix"),
		"",
		heading(require_i18n.t("wizard.security.learnMore")),
		"- https://docs.operator.ai/gateway/security"
	].join("\n");
}
//#endregion
//#region src/wizard/setup.shared.ts
function mergeWizardConfigValueOntoLatest(current, base, next) {
	if ((0, node_util.isDeepStrictEqual)(next, base)) return current;
	if (require_plain_object.isPlainObject(current) && require_plain_object.isPlainObject(base) && require_plain_object.isPlainObject(next)) {
		const merged = { ...current };
		const keys = /* @__PURE__ */ new Set([
			...Object.keys(current),
			...Object.keys(base),
			...Object.keys(next)
		]);
		for (const key of keys) {
			const mergedValue = mergeWizardConfigValueOntoLatest(current[key], base[key], next[key]);
			if (mergedValue === void 0) delete merged[key];
			else merged[key] = mergedValue;
		}
		return merged;
	}
	return structuredClone(next);
}
/** Preserve concurrent edits while applying only changes made by an interactive wizard. */
function mergeWizardConfigOntoLatest(current, base, next) {
	return mergeWizardConfigValueOntoLatest(current, base, next);
}
/**
* Config writes go through the pending-plugin-install commit helper so wizard
* flows never drop install records that a concurrent migration already staged.
*/
async function writeWizardConfigFile(configInput, opts = {}) {
	let config = configInput;
	let baseHash = opts.baseHash;
	const allowConfigSizeDrop = opts.allowConfigSizeDrop === true;
	if (!allowConfigSizeDrop && require_install_record_commit.hasPendingPluginInstallRecords(config)) {
		if (!Object.hasOwn(opts, "migrationBaseConfig")) throw new Error("Wizard config writes with pending plugin installs must declare migration ownership.");
		const migrationBaseConfig = opts.migrationBaseConfig;
		if (migrationBaseConfig && require_install_record_commit.hasPendingPluginInstallRecords(migrationBaseConfig)) {
			baseHash = (await require_install_record_commit.commitConfigWriteWithPendingPluginInstalls({
				nextConfig: migrationBaseConfig,
				sourceConfig: migrationBaseConfig,
				writeOptions: { allowConfigSizeDrop: true },
				commit: async (nextConfig, writeOptions) => {
					return await require_config.replaceConfigFile({
						nextConfig,
						...baseHash !== void 0 ? { baseHash } : {},
						...writeOptions ? { writeOptions } : {},
						afterWrite: { mode: "auto" }
					});
				}
			})).persistedHash ?? void 0;
			config = require_install_record_commit.stripPendingPluginInstallRecords(config, require_install_record_commit.unchangedPendingPluginInstallRecordIds(config, migrationBaseConfig));
			opts.onPendingPluginInstallMigration?.();
		}
	}
	return (await require_install_record_commit.commitConfigWriteWithPendingPluginInstalls({
		nextConfig: config,
		writeOptions: { allowConfigSizeDrop },
		commit: async (nextConfig, writeOptions) => {
			return await require_config.replaceConfigFile({
				nextConfig,
				...baseHash !== void 0 ? { baseHash } : {},
				...writeOptions ? { writeOptions } : {},
				afterWrite: { mode: "auto" }
			});
		}
	})).config;
}
async function readSetupConfigFileSnapshot() {
	return await require_io.createConfigIO({ pluginValidation: "skip" }).readConfigFileSnapshot();
}
async function readValidSetupConfigFile() {
	const snapshot = await readSetupConfigFileSnapshot();
	if (!snapshot.valid) throw new Error("Migration target config became invalid. Run `operator doctor`.");
	return snapshot.exists ? snapshot.sourceConfig ?? snapshot.config : {};
}
/** One-time security acknowledgement; persisted so reruns stay quiet. */
async function requireRiskAcknowledgement(params) {
	if (params.config.wizard?.securityAcknowledgedAt) return params.config;
	if (params.opts.acceptRisk === true) return applySecurityAcknowledgement(params.config);
	await params.prompter.note(getSecurityNoteMessage(), getSecurityNoteTitle());
	if (!await params.prompter.confirm({
		message: getSecurityConfirmMessage(),
		initialValue: true,
		layout: "vertical"
	})) throw new require_prompts.WizardCancelledError(require_i18n.t("wizard.setup.riskNotAccepted"));
	return applySecurityAcknowledgement(params.config);
}
function applySecurityAcknowledgement(config) {
	if (config.wizard?.securityAcknowledgedAt) return config;
	return {
		...config,
		wizard: {
			...config.wizard,
			securityAcknowledgedAt: (/* @__PURE__ */ new Date()).toISOString()
		}
	};
}
/** Derive quickstart gateway defaults, preserving any existing gateway settings. */
function resolveQuickstartGatewayDefaults(baseConfig) {
	const hasExisting = typeof baseConfig.gateway?.port === "number" || baseConfig.gateway?.bind !== void 0 || baseConfig.gateway?.auth?.mode !== void 0 || baseConfig.gateway?.auth?.token !== void 0 || baseConfig.gateway?.auth?.password !== void 0 || baseConfig.gateway?.customBindHost !== void 0 || baseConfig.gateway?.tailscale?.mode !== void 0;
	const bindRaw = baseConfig.gateway?.bind;
	const bind = bindRaw === "loopback" || bindRaw === "lan" || bindRaw === "auto" || bindRaw === "custom" || bindRaw === "tailnet" ? bindRaw : "loopback";
	let authMode = "token";
	if (baseConfig.gateway?.auth?.mode === "token" || baseConfig.gateway?.auth?.mode === "password") authMode = baseConfig.gateway.auth.mode;
	else if (baseConfig.gateway?.auth?.token) authMode = "token";
	else if (baseConfig.gateway?.auth?.password) authMode = "password";
	const tailscaleRaw = baseConfig.gateway?.tailscale?.mode;
	const tailscaleMode = tailscaleRaw === "off" || tailscaleRaw === "serve" || tailscaleRaw === "funnel" ? tailscaleRaw : "off";
	return {
		hasExisting,
		port: require_paths.resolveGatewayPort(baseConfig),
		bind,
		authMode,
		tailscaleMode,
		token: baseConfig.gateway?.auth?.token,
		password: baseConfig.gateway?.auth?.password,
		customBindHost: baseConfig.gateway?.customBindHost,
		tailscaleResetOnExit: baseConfig.gateway?.tailscale?.resetOnExit ?? false
	};
}
//#endregion
exports.mergeWizardConfigOntoLatest = mergeWizardConfigOntoLatest;
exports.readSetupConfigFileSnapshot = readSetupConfigFileSnapshot;
exports.readValidSetupConfigFile = readValidSetupConfigFile;
exports.requireRiskAcknowledgement = requireRiskAcknowledgement;
exports.resolveQuickstartGatewayDefaults = resolveQuickstartGatewayDefaults;
exports.writeWizardConfigFile = writeWizardConfigFile;
