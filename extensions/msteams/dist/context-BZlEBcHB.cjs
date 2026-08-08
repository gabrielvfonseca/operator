const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/commands/migrate/context.ts
/** Migration provider context and report-directory helpers. */
var context_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildMigrationContext: () => buildMigrationContext,
	buildMigrationReportDir: () => buildMigrationReportDir,
	createMigrationLogger: () => createMigrationLogger
});
/** Builds a migration logger that keeps JSON stdout machine-readable. */
function createMigrationLogger(runtime, opts = {}) {
	const info = opts.json ? runtime.error : runtime.log;
	return {
		debug: (message) => {
			if (process.env.OPERATOR_VERBOSE === "1") info(message);
		},
		info: (message) => info(message),
		warn: (message) => runtime.error(message),
		error: (message) => runtime.error(message)
	};
}
/** Builds the timestamped directory where a provider writes migration reports. */
function buildMigrationReportDir(providerId, stateDir, nowMs = Date.now()) {
	const stamp = (0, _gabrielvfonseca_normalization_core_number_coercion.timestampMsToIsoFileStamp)(nowMs);
	return node_path.default.join(stateDir, "migration", providerId, stamp);
}
/** Builds the provider-facing migration context from CLI options and runtime state. */
function buildMigrationContext(params) {
	return {
		config: params.configOverride ?? require_io.getRuntimeConfig(),
		stateDir: require_paths.resolveStateDir(),
		targetAgentId: params.targetAgentId,
		itemKinds: params.itemKinds,
		source: params.source,
		includeSecrets: Boolean(params.includeSecrets),
		overwrite: Boolean(params.overwrite),
		providerOptions: params.providerOptions,
		backupPath: params.backupPath,
		reportDir: params.reportDir,
		logger: createMigrationLogger(params.runtime, { json: params.json })
	};
}
//#endregion
Object.defineProperty(exports, "buildMigrationContext", {
	enumerable: true,
	get: function() {
		return buildMigrationContext;
	}
});
Object.defineProperty(exports, "buildMigrationReportDir", {
	enumerable: true,
	get: function() {
		return buildMigrationReportDir;
	}
});
Object.defineProperty(exports, "context_exports", {
	enumerable: true,
	get: function() {
		return context_exports;
	}
});
