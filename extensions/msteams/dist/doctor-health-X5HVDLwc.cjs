require("./rolldown-runtime-u92d-OFm.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_prompt_style = require("./prompt-style-DDurS--q.cjs");
let _clack_prompts = require("@clack/prompts");
//#region src/flows/doctor-health.ts
const intro = (message) => (0, _clack_prompts.intro)(require_prompt_style.stylePromptTitle(message) ?? message);
const outro = (message) => (0, _clack_prompts.outro)(require_prompt_style.stylePromptTitle(message) ?? message);
const loadConfigModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports));
/** Runs the full interactive doctor flow against the provided or default runtime. */
async function doctorCommand(runtime, options = {}) {
	const effectiveRuntime = runtime ?? (await Promise.resolve().then(() => require("./runtime-BOSfFY3R.cjs")).then((n) => n.runtime_exports)).defaultRuntime;
	if (options.repair === true || options.yes === true || options.generateGatewayToken === true) {
		const { assertConfigWriteAllowedInCurrentMode } = await loadConfigModule();
		assertConfigWriteAllowedInCurrentMode();
	}
	const { createDoctorPrompter } = await Promise.resolve().then(() => require("./doctor-prompter-itE6jRW9.cjs"));
	const prompter = createDoctorPrompter({
		runtime: effectiveRuntime,
		options
	});
	intro("Operator doctor");
	const { resolveOperatorPackageRoot } = await Promise.resolve().then(() => require("./openclaw-root-CMdsun7e.cjs")).then((n) => n.openclaw_root_exports);
	const root = await resolveOperatorPackageRoot({
		moduleUrl: require("url").pathToFileURL(__filename).href,
		argv1: process.argv[1],
		cwd: process.cwd()
	});
	const { maybeOfferUpdateBeforeDoctor } = await Promise.resolve().then(() => require("./doctor-update-DqKwMFuD.cjs"));
	if ((await maybeOfferUpdateBeforeDoctor({
		runtime: effectiveRuntime,
		options,
		root,
		confirm: (p) => prompter.confirm(p),
		outro
	})).handled) return;
	const { maybeRepairUiProtocolFreshness } = await Promise.resolve().then(() => require("./doctor-ui-DK9srIDw.cjs"));
	const { noteSourceInstallIssues } = await Promise.resolve().then(() => require("./doctor-install-DbbJb4L-.cjs"));
	const { noteStalePluginRuntimeSymlinks } = await Promise.resolve().then(() => require("./plugin-runtime-symlinks-OHgSPFG5.cjs")).then((n) => n.plugin_runtime_symlinks_exports);
	const { noteStartupOptimizationHints } = await Promise.resolve().then(() => require("./doctor-platform-notes-ROt7Bp6B.cjs"));
	await maybeRepairUiProtocolFreshness(effectiveRuntime, prompter);
	noteSourceInstallIssues(root);
	await noteStalePluginRuntimeSymlinks(root);
	noteStartupOptimizationHints();
	const { loadAndMaybeMigrateDoctorConfig } = await Promise.resolve().then(() => require("./doctor-config-flow-Ds3z2RqR.cjs"));
	const configResult = await loadAndMaybeMigrateDoctorConfig({
		options,
		confirm: (p) => prompter.confirm(p),
		runtime: effectiveRuntime,
		prompter
	});
	const { CONFIG_PATH } = await loadConfigModule();
	const ctx = {
		runtime: effectiveRuntime,
		options,
		prompter,
		configResult,
		cfg: configResult.cfg,
		cfgForPersistence: structuredClone(configResult.cfg),
		sourceConfigValid: configResult.sourceConfigValid ?? true,
		configPath: configResult.path ?? CONFIG_PATH
	};
	const { runDoctorHealthContributions } = await Promise.resolve().then(() => require("./doctor-health-contributions-CUhdPH0i.cjs"));
	await runDoctorHealthContributions(ctx);
	if (ctx.postInstallDoctorResult) {
		const { UPDATE_POST_INSTALL_DOCTOR_ADVISORY_EXIT_CODE, UPDATE_POST_INSTALL_DOCTOR_RESULT_PATH_ENV, writeUpdatePostInstallDoctorResult } = await Promise.resolve().then(() => require("./update-doctor-result-orYzSBLp.cjs")).then((n) => n.update_doctor_result_exports);
		const resultPath = process.env[UPDATE_POST_INSTALL_DOCTOR_RESULT_PATH_ENV]?.trim();
		if (resultPath) {
			await writeUpdatePostInstallDoctorResult({
				resultPath,
				result: ctx.postInstallDoctorResult
			});
			effectiveRuntime.exit(UPDATE_POST_INSTALL_DOCTOR_ADVISORY_EXIT_CODE);
			return;
		}
	}
	outro("Doctor complete.");
}
//#endregion
exports.doctorCommand = doctorCommand;
