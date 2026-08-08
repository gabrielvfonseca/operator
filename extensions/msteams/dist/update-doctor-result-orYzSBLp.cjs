const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
require("node:crypto");
//#region src/infra/update-doctor-result.ts
var update_doctor_result_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	PACKAGE_POST_INSTALL_DOCTOR_ADVISORY: () => PACKAGE_POST_INSTALL_DOCTOR_ADVISORY,
	UPDATE_POST_INSTALL_DOCTOR_ADVISORY_EXIT_CODE: () => 86,
	UPDATE_POST_INSTALL_DOCTOR_RESULT_PATH_ENV: () => UPDATE_POST_INSTALL_DOCTOR_RESULT_PATH_ENV,
	createDeferredConfiguredPluginRepairDoctorResult: () => createDeferredConfiguredPluginRepairDoctorResult,
	writeUpdatePostInstallDoctorResult: () => writeUpdatePostInstallDoctorResult
});
const UPDATE_POST_INSTALL_DOCTOR_RESULT_PATH_ENV = "OPERATOR_UPDATE_POST_INSTALL_DOCTOR_RESULT_PATH";
const UPDATE_POST_INSTALL_DOCTOR_RESULT_FILENAME_RE = /^operator-update-doctor-\d+-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/iu;
const PACKAGE_POST_INSTALL_DOCTOR_ADVISORY = {
	kind: "package-post-install-doctor",
	message: "Post-install doctor reported a recoverable update-time repair warning after the package install was verified; continuing with post-core plugin convergence."
};
function resolveSafeUpdatePostInstallDoctorResultPath(resultPath) {
	const tempRoot = node_path.default.resolve(require_tmp_operator_dir.resolvePreferredOperatorTmpDir());
	const resolvedPath = node_path.default.resolve(resultPath);
	if (node_path.default.dirname(resolvedPath) !== tempRoot || !UPDATE_POST_INSTALL_DOCTOR_RESULT_FILENAME_RE.test(node_path.default.basename(resolvedPath))) throw new Error("Unsafe post-install doctor result path");
	return resolvedPath;
}
function createDeferredConfiguredPluginRepairDoctorResult(details) {
	return {
		status: "advisory",
		advisory: {
			...PACKAGE_POST_INSTALL_DOCTOR_ADVISORY,
			reason: "deferred-configured-plugin-repair",
			details: details.filter((line) => line.trim())
		}
	};
}
async function writeUpdatePostInstallDoctorResult(params) {
	const resultPath = resolveSafeUpdatePostInstallDoctorResultPath(params.resultPath);
	await node_fs_promises.default.writeFile(resultPath, `${JSON.stringify(params.result)}\n`, {
		encoding: "utf8",
		mode: 384,
		flag: "wx"
	});
}
//#endregion
Object.defineProperty(exports, "createDeferredConfiguredPluginRepairDoctorResult", {
	enumerable: true,
	get: function() {
		return createDeferredConfiguredPluginRepairDoctorResult;
	}
});
Object.defineProperty(exports, "update_doctor_result_exports", {
	enumerable: true,
	get: function() {
		return update_doctor_result_exports;
	}
});
