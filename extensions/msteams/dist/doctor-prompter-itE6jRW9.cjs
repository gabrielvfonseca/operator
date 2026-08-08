require("./rolldown-runtime-u92d-OFm.cjs");
const require_prompt_style = require("./prompt-style-DDurS--q.cjs");
const require_prompt_select_styled_params = require("./prompt-select-styled-params-D3WyR__7.cjs");
const require_onboard_helpers = require("./onboard-helpers-B8YMO226.cjs");
const require_doctor_repair_mode = require("./doctor-repair-mode-s5zP9NjH.cjs");
let _clack_prompts = require("@clack/prompts");
//#region src/commands/doctor-prompter.ts
/** Doctor prompt adapter that centralizes repair, force, update, and noninteractive behavior. */
/** Creates a doctor prompter honoring --fix, --yes, --force, noninteractive, and update modes. */
function createDoctorPrompter(params) {
	const repairMode = require_doctor_repair_mode.resolveDoctorRepairMode(params.options);
	const confirmDefault = async (p) => {
		if (require_doctor_repair_mode.shouldAutoApproveDoctorFix(repairMode)) return true;
		if (repairMode.nonInteractive) return false;
		if (!repairMode.canPrompt) return p.initialValue ?? false;
		return require_onboard_helpers.guardCancel(await (0, _clack_prompts.confirm)({
			...p,
			message: require_prompt_style.stylePromptMessage(p.message)
		}), params.runtime, 130);
	};
	return {
		confirm: confirmDefault,
		confirmAutoFix: confirmDefault,
		confirmAggressiveAutoFix: async (p) => {
			if (require_doctor_repair_mode.shouldAutoApproveDoctorFix(repairMode, { requiresForce: true })) return true;
			if (repairMode.nonInteractive) return false;
			if (repairMode.shouldRepair && !repairMode.shouldForce) return false;
			if (!repairMode.canPrompt) return p.initialValue ?? false;
			return require_onboard_helpers.guardCancel(await (0, _clack_prompts.confirm)({
				...p,
				message: require_prompt_style.stylePromptMessage(p.message)
			}), params.runtime, 130);
		},
		confirmRuntimeRepair: async (p) => {
			const { requiresInteractiveConfirmation, ...confirmParams } = p;
			if (requiresInteractiveConfirmation !== true && require_doctor_repair_mode.shouldAutoApproveDoctorFix(repairMode, { blockDuringUpdate: true })) return true;
			if (requiresInteractiveConfirmation === true && !repairMode.canPrompt) return false;
			if (repairMode.nonInteractive) return false;
			if (!repairMode.canPrompt) return confirmParams.initialValue ?? false;
			return require_onboard_helpers.guardCancel(await (0, _clack_prompts.confirm)({
				...confirmParams,
				message: require_prompt_style.stylePromptMessage(confirmParams.message)
			}), params.runtime, 130);
		},
		select: async (p, fallback) => {
			if (!repairMode.canPrompt || repairMode.shouldRepair) return fallback;
			return require_onboard_helpers.guardCancel(await (0, _clack_prompts.select)(require_prompt_select_styled_params.styleSelectParams(p)), params.runtime, 130);
		},
		shouldRepair: repairMode.shouldRepair,
		shouldForce: repairMode.shouldForce,
		repairMode
	};
}
//#endregion
exports.createDoctorPrompter = createDoctorPrompter;
