require("./rolldown-runtime-u92d-OFm.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_target_registry = require("./target-registry-C5xgrPiJ.cjs");
//#region src/gateway/server-methods/secrets.ts
function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
function invalidSecretsResolveField(errors) {
	for (const issue of errors ?? []) {
		const instancePath = issue.instancePath ?? "";
		if (instancePath === "/commandName" || instancePath === "" && (String(issue.params?.missingProperty) === "commandName" || Array.isArray(issue.params?.requiredProperties) && issue.params.requiredProperties.includes("commandName"))) return "commandName";
		if (instancePath.startsWith("/allowedPaths")) return "allowedPaths";
		if (instancePath.startsWith("/forcedActivePaths")) return "forcedActivePaths";
		if (instancePath.startsWith("/optionalActivePaths")) return "optionalActivePaths";
		if (instancePath.startsWith("/providerOverrides")) return "providerOverrides";
	}
	return "targetIds";
}
function createSecretsHandlers(params) {
	return {
		"secrets.reload": async ({ respond }) => {
			try {
				respond(true, {
					ok: true,
					warningCount: (await params.reloadSecrets()).warningCount
				});
			} catch (error) {
				params.log?.warn?.(`secrets.reload failed: ${errorMessage(error)}`);
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "secrets.reload failed"));
			}
		},
		"secrets.resolve": async ({ params: requestParams, respond }) => {
			if (!require_src.validateSecretsResolveParams(requestParams)) {
				const field = invalidSecretsResolveField(require_src.validateSecretsResolveParams.errors);
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid secrets.resolve params: ${field}`));
				return;
			}
			const commandName = requestParams.commandName.trim();
			if (!commandName) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid secrets.resolve params: commandName"));
				return;
			}
			const targetIds = requestParams.targetIds.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
			const allowedPaths = requestParams.allowedPaths?.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
			const forcedActivePaths = requestParams.forcedActivePaths?.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
			const optionalActivePaths = requestParams.optionalActivePaths?.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
			const providerOverrides = {
				...requestParams.providerOverrides?.webSearch?.trim() ? { webSearch: requestParams.providerOverrides.webSearch.trim() } : {},
				...requestParams.providerOverrides?.webFetch?.trim() ? { webFetch: requestParams.providerOverrides.webFetch.trim() } : {}
			};
			for (const targetId of targetIds) if (!require_target_registry.isKnownCoreSecretTargetId(targetId) && !require_target_registry.isKnownSecretTargetId(targetId)) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid secrets.resolve params: unknown target id "${String(targetId)}"`));
				return;
			}
			try {
				const result = await params.resolveSecrets({
					commandName,
					targetIds,
					...allowedPaths ? { allowedPaths } : {},
					...forcedActivePaths ? { forcedActivePaths } : {},
					...optionalActivePaths ? { optionalActivePaths } : {},
					...Object.keys(providerOverrides).length > 0 ? { providerOverrides } : {}
				});
				const payload = {
					ok: true,
					assignments: result.assignments,
					diagnostics: result.diagnostics,
					inactiveRefPaths: result.inactiveRefPaths
				};
				if (!require_src.validateSecretsResolveResult(payload)) throw new Error("secrets.resolve returned invalid payload.");
				respond(true, payload);
			} catch (error) {
				params.log?.warn?.(`secrets.resolve failed: ${errorMessage(error)}`);
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "secrets.resolve failed"));
			}
		}
	};
}
//#endregion
exports.createSecretsHandlers = createSecretsHandlers;
