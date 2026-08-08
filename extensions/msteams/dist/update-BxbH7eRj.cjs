const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_commands_flags = require("./commands.flags-BZYis-vI.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_delivery_info = require("./delivery-info-DRjJZi5w.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_restart_sentinel = require("./restart-sentinel-BH8dJFkM.cjs");
const require_paths = require("./paths-amwIgX1d.cjs");
const require_restart = require("./restart-sBMxYOWJ.cjs");
const require_stable_node_path = require("./stable-node-path-CycXK8Qa.cjs");
const require_gateway_entrypoint = require("./gateway-entrypoint-BSWI2mN9.cjs");
const require_update_channels = require("./update-channels-BEYweYMB.cjs");
const require_package_json = require("./package-json-B6KtcVRf.cjs");
const require_update_runner = require("./update-runner-Cw_EEBKY.cjs");
const require_update_control_plane_sentinel = require("./update-control-plane-sentinel-9paZY1RI.cjs");
const require_update_managed_service_handoff = require("./update-managed-service-handoff-C5_MDgvI.cjs");
const require_control_plane_audit = require("./control-plane-audit-OJXxLDr7.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_restart_request = require("./restart-request-_nAvloh8.cjs");
const require_server_restart_sentinel = require("./server-restart-sentinel-BiYUQ4Vc.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let node_crypto = require("node:crypto");
//#region src/infra/update-post-core-context.ts
const POST_CORE_UPDATE_SOURCE_CONFIG_PATH_ENV = "OPERATOR_UPDATE_POST_CORE_SOURCE_CONFIG_PATH";
//#endregion
//#region src/infra/update-post-core-finalize.ts
const FINALIZE_PROCESS_TIMEOUT_FLOOR_MS = 30 * 6e4;
const FINALIZE_PROCESS_STEP_BUDGET_MULTIPLIER = 6;
function buildFinalizeEnv(baseEnv, effectiveChannel, compatHostVersion, sourceConfigPath, serviceRepairPolicy) {
	const env = { ...baseEnv };
	delete env.OPERATOR_SERVICE_MARKER;
	delete env.OPERATOR_SERVICE_KIND;
	delete env[require_paths.GATEWAY_SERVICE_RUNTIME_PID_ENV];
	env[require_update_channels.UPDATE_EFFECTIVE_CHANNEL_ENV] = effectiveChannel;
	if (compatHostVersion) env.OPERATOR_COMPATIBILITY_HOST_VERSION = compatHostVersion;
	if (sourceConfigPath) env[POST_CORE_UPDATE_SOURCE_CONFIG_PATH_ENV] = sourceConfigPath;
	if (serviceRepairPolicy) env.OPERATOR_SERVICE_REPAIR_POLICY = serviceRepairPolicy;
	return env;
}
const defaultFinalizeSpawner = async ({ argv, cwd, timeoutMs, env }) => {
	const res = await require_exec.runCommandWithTimeout(argv, {
		cwd,
		timeoutMs,
		env
	});
	return {
		code: res.code,
		...res.stderr ? { stderr: res.stderr } : {}
	};
};
function isGitUpdateNeedingFinalize(result) {
	return result.status === "ok" && result.mode === "git" && typeof result.root === "string" && result.root.length > 0;
}
function buildFinalizeArgv(params) {
	const argv = [
		params.nodePath,
		params.entrypoint,
		"update",
		"finalize",
		"--json",
		"--yes",
		"--no-restart"
	];
	if (typeof params.timeoutMs === "number" && Number.isFinite(params.timeoutMs)) argv.push("--timeout", String(Math.max(1, Math.ceil(params.timeoutMs / 1e3))));
	return argv;
}
async function runPostCoreFinalizeAfterGatewayUpdate(params) {
	const { result } = params;
	if (!isGitUpdateNeedingFinalize(result)) return {
		status: "skipped",
		reason: "not-git-update"
	};
	const entrypoint = await (params.resolveEntrypoint ?? require_gateway_entrypoint.resolveGatewayInstallEntrypoint)(result.root);
	if (!entrypoint) return {
		status: "skipped",
		reason: "entrypoint-missing"
	};
	const spawnFinalize = params.spawnFinalize ?? defaultFinalizeSpawner;
	const perStepTimeoutMs = typeof params.timeoutMs === "number" && Number.isFinite(params.timeoutMs) ? params.timeoutMs : void 0;
	const effectiveChannel = params.channel ?? "dev";
	const argv = buildFinalizeArgv({
		nodePath: await require_stable_node_path.resolveStableNodePath(process.execPath),
		entrypoint,
		...perStepTimeoutMs === void 0 ? {} : { timeoutMs: perStepTimeoutMs }
	});
	const compatHostVersion = result.after?.version ?? void 0;
	const processTimeoutMs = Math.max(FINALIZE_PROCESS_TIMEOUT_FLOOR_MS, (perStepTimeoutMs ?? 0) * FINALIZE_PROCESS_STEP_BUDGET_MULTIPLIER);
	let sourceConfigDir;
	try {
		let sourceConfigPath;
		if (params.preUpdateConfig) {
			sourceConfigDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-update-post-core-"));
			sourceConfigPath = node_path.default.join(sourceConfigDir, "source-config.json");
			await node_fs_promises.default.writeFile(sourceConfigPath, `${JSON.stringify(params.preUpdateConfig)}\n`, "utf-8");
		}
		const env = buildFinalizeEnv(params.env ?? process.env, effectiveChannel, compatHostVersion, sourceConfigPath, params.serviceRepairPolicy);
		const spawnResult = await spawnFinalize({
			argv,
			cwd: node_path.default.dirname(entrypoint),
			timeoutMs: processTimeoutMs,
			env
		});
		if (spawnResult.code === 0) return {
			status: "ok",
			entrypoint
		};
		return {
			status: "error",
			reason: "nonzero-exit",
			entrypoint,
			...typeof spawnResult.code === "number" ? { exitCode: spawnResult.code } : {},
			...spawnResult.stderr ? { message: spawnResult.stderr } : {}
		};
	} catch (err) {
		return {
			status: "error",
			reason: "spawn-failed",
			entrypoint,
			message: err instanceof Error ? err.message : String(err)
		};
	} finally {
		if (sourceConfigDir) await node_fs_promises.default.rm(sourceConfigDir, {
			recursive: true,
			force: true
		}).catch(() => void 0);
	}
}
function foldPostCoreFinalizeIntoResult(result, outcome) {
	if (outcome.status !== "error") return result;
	return {
		...result,
		status: "error",
		reason: "post-core-plugin-finalize-failed",
		steps: [...result.steps, {
			name: "post-core plugin finalize",
			command: "openclaw update finalize",
			cwd: result.root ?? process.cwd(),
			durationMs: 0,
			exitCode: outcome.reason === "nonzero-exit" ? outcome.exitCode ?? 1 : 1,
			...outcome.message ? { stderrTail: require_restart_sentinel.trimLogTail(outcome.message) } : {}
		}]
	};
}
//#endregion
//#region src/gateway/server-methods/update.ts
const MANAGED_HANDOFF_RESTART_DELAY_MS = 2e3;
function formatUpdateRunErrorMessage(err) {
	if (err instanceof Error) return err.message || err.name;
	return String(err);
}
function tryResolveProcessCwd() {
	try {
		return process.cwd();
	} catch {
		return;
	}
}
async function readPreUpdateConfigForPostCoreFinalize() {
	const snapshot = await require_io.readConfigFileSnapshot({ skipPluginValidation: true });
	if (!snapshot.valid) return;
	return {
		sourceConfig: snapshot.sourceConfig,
		authoredConfig: (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(snapshot.parsed) ? snapshot.parsed : snapshot.sourceConfig
	};
}
function resolveManagedServiceHandoffRestartDelayMs(restartDelayMs, supervisor) {
	const resolvedDelayMs = restartDelayMs ?? MANAGED_HANDOFF_RESTART_DELAY_MS;
	if (supervisor !== "systemd") return resolvedDelayMs;
	return Math.max(resolvedDelayMs, MANAGED_HANDOFF_RESTART_DELAY_MS);
}
function hasManagedServiceHandoffContext(env, supervisor) {
	if (supervisor === "launchd") return Boolean(env.OPERATOR_LAUNCHD_LABEL?.trim() || env.LAUNCH_JOB_LABEL?.trim() || env.LAUNCH_JOB_NAME?.trim() || env.XPC_SERVICE_NAME?.trim());
	if (supervisor === "systemd") return Boolean(env.OPERATOR_SYSTEMD_UNIT?.trim());
	if (supervisor === "schtasks") return Boolean(env.OPERATOR_WINDOWS_TASK_NAME?.trim() || env.OPERATOR_SERVICE_MARKER?.trim() === "@gabrielvfonseca/operator" && env.OPERATOR_SERVICE_KIND?.trim() === "gateway");
	return false;
}
const updateHandlers = {
	"update.status": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateUpdateStatusParams, "update.status", respond)) return;
		let sentinel;
		try {
			sentinel = await require_server_restart_sentinel.refreshLatestUpdateRestartSentinel();
		} catch (err) {
			context?.logGateway?.warn(`update.status sentinel refresh failed: ${formatUpdateRunErrorMessage(err)}`);
			sentinel = require_server_restart_sentinel.getLatestUpdateRestartSentinel();
		}
		respond(true, { sentinel });
	},
	"update.run": async ({ params, respond, client, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateUpdateRunParams, "update.run", respond)) return;
		const actor = require_control_plane_audit.resolveControlPlaneActor(client);
		const { sessionKey, deliveryContext: requestedDeliveryContext, threadId: requestedThreadId, note, continuationMessage, restartDelayMs } = require_restart_request.parseRestartRequestParams(params);
		const { deliveryContext: sessionDeliveryContext, threadId: sessionThreadId } = require_delivery_info.extractDeliveryInfo(sessionKey);
		const deliveryContext = requestedDeliveryContext ?? sessionDeliveryContext;
		const threadId = requestedThreadId ?? sessionThreadId;
		const timeoutMsRaw = params.timeoutMs;
		const timeoutMs = typeof timeoutMsRaw === "number" && Number.isFinite(timeoutMsRaw) ? Math.max(1e3, Math.floor(timeoutMsRaw)) : void 0;
		let result;
		let handoff = null;
		let managedHandoffRestart = null;
		const sentinelMeta = {
			...sessionKey ? { sessionKey } : {},
			...deliveryContext ? { deliveryContext } : {},
			...threadId ? { threadId } : {},
			...note !== void 0 ? { note } : {},
			...continuationMessage !== void 0 ? { continuationMessage } : {}
		};
		try {
			const config = context.getRuntimeConfig();
			const configChannel = require_update_channels.normalizeUpdateChannel(config.update?.channel);
			const invocationCwd = tryResolveProcessCwd();
			const root = await require_openclaw_root.resolveOperatorPackageRoot({
				moduleUrl: require("url").pathToFileURL(__filename).href,
				argv1: process.argv[1],
				...invocationCwd ? { cwd: invocationCwd } : {}
			}) ?? invocationCwd ?? node_os.default.homedir();
			const installSurface = await require_update_runner.resolveUpdateInstallSurface({
				timeoutMs,
				cwd: root,
				argv1: process.argv[1]
			});
			const supervisor = require_update_managed_service_handoff.detectRespawnSupervisor(process.env, process.platform);
			const hasHandoffContext = supervisor ? hasManagedServiceHandoffContext(process.env, supervisor) : false;
			const requiresManagedServiceHandoff = installSurface.kind === "global" || installSurface.kind === "git" && supervisor !== null;
			if (configChannel === "extended-stable" && installSurface.kind === "git") result = {
				status: "error",
				mode: "git",
				root: installSurface.root,
				reason: "unsupported_git_channel",
				steps: [],
				durationMs: 0
			};
			else if (!require_commands_flags.isRestartEnabled(config) && !supervisor) {
				const beforeVersion = installSurface.root ? await require_package_json.readPackageVersion(installSurface.root) : null;
				result = {
					status: "skipped",
					mode: installSurface.mode,
					...installSurface.root ? { root: installSurface.root } : {},
					reason: installSurface.kind === "global" ? "restart-unavailable" : "restart-disabled",
					...beforeVersion ? { before: { version: beforeVersion } } : {},
					steps: [],
					durationMs: 0
				};
			} else if (requiresManagedServiceHandoff) {
				const handoffChannel = installSurface.kind === "git" ? void 0 : configChannel ?? void 0;
				const command = require_update_managed_service_handoff.formatManagedServiceUpdateCommand({
					timeoutMs,
					...handoffChannel ? { channel: handoffChannel } : {}
				});
				if (supervisor && hasHandoffContext) try {
					const beforeVersion = installSurface.root ? await require_package_json.readPackageVersion(installSurface.root) : null;
					const startedAt = Date.now();
					const handoffId = (0, node_crypto.randomUUID)();
					const managedRestartDelayMs = resolveManagedServiceHandoffRestartDelayMs(restartDelayMs, supervisor);
					sentinelMeta.handoffId = handoffId;
					const started = await require_update_managed_service_handoff.startManagedServiceUpdateHandoff({
						root,
						timeoutMs,
						restartDrainTimeoutMs: require_restart.resolveGatewayRestartDeferralTimeoutMs(config.gateway?.reload?.deferralTimeoutMs),
						...handoffChannel ? { channel: handoffChannel } : {},
						restartDelayMs: managedRestartDelayMs,
						meta: sentinelMeta,
						handoffId,
						supervisor
					});
					handoff = {
						status: "started",
						...started.pid ? { pid: started.pid } : {},
						command: started.command
					};
					managedHandoffRestart = require_restart.scheduleGatewaySigusr1Restart({
						delayMs: managedRestartDelayMs,
						reason: "update.run",
						skipDeferral: true,
						skipCooldown: true,
						audit: {
							actor: actor.actor,
							deviceId: actor.deviceId,
							clientIp: actor.clientIp,
							changedPaths: []
						}
					});
					result = {
						status: "skipped",
						mode: installSurface.mode,
						root: installSurface.root,
						reason: require_update_control_plane_sentinel.CONTROL_PLANE_UPDATE_HANDOFF_STARTED_REASON,
						...beforeVersion ? { before: { version: beforeVersion } } : {},
						steps: [{
							name: "managed-service update handoff",
							command: started.command,
							cwd: root,
							durationMs: Date.now() - startedAt,
							exitCode: null
						}],
						durationMs: Date.now() - startedAt
					};
				} catch (err) {
					context?.logGateway?.warn(`update.run managed-service handoff failed ${require_control_plane_audit.formatControlPlaneActor(actor)} error=${formatUpdateRunErrorMessage(err)}`);
					result = {
						status: "error",
						mode: installSurface.mode,
						root: installSurface.root,
						reason: "managed-service-handoff-failed",
						steps: [],
						durationMs: 0
					};
				}
				else {
					const beforeVersion = installSurface.root ? await require_package_json.readPackageVersion(installSurface.root) : null;
					handoff = {
						status: "unavailable",
						command,
						message: require_update_managed_service_handoff.buildManagedServiceHandoffUnavailableMessage(command)
					};
					result = {
						status: "skipped",
						mode: installSurface.mode,
						root: installSurface.root,
						reason: "managed-service-handoff-unavailable",
						...beforeVersion ? { before: { version: beforeVersion } } : {},
						steps: [],
						durationMs: 0
					};
				}
			} else {
				const preUpdateConfig = installSurface.kind === "git" ? await readPreUpdateConfigForPostCoreFinalize().catch((err) => {
					context?.logGateway?.warn(`update.run could not capture pre-update config ${require_control_plane_audit.formatControlPlaneActor(actor)} error=${formatUpdateRunErrorMessage(err)}`);
				}) : void 0;
				result = await require_update_runner.runGatewayUpdate({
					timeoutMs,
					cwd: root,
					argv1: process.argv[1],
					channel: configChannel ?? void 0,
					allowGatewayServiceRepair: false,
					allowGatewayActivation: false
				});
				const finalizeOutcome = await runPostCoreFinalizeAfterGatewayUpdate({
					result,
					channel: configChannel ?? void 0,
					serviceRepairPolicy: "external",
					...timeoutMs === void 0 ? {} : { timeoutMs },
					...preUpdateConfig ? { preUpdateConfig } : {}
				});
				if (finalizeOutcome.status === "error") context?.logGateway?.warn(`update.run post-core plugin finalize failed ${require_control_plane_audit.formatControlPlaneActor(actor)} reason=${finalizeOutcome.reason}`);
				result = foldPostCoreFinalizeIntoResult(result, finalizeOutcome);
			}
		} catch {
			result = {
				status: "error",
				mode: "unknown",
				reason: "unexpected-error",
				steps: [],
				durationMs: 0
			};
		}
		const payload = require_update_control_plane_sentinel.buildUpdateRestartSentinelPayload({
			result,
			meta: sentinelMeta
		});
		let sentinelPersisted;
		try {
			await require_restart_sentinel.writeRestartSentinel(payload);
			sentinelPersisted = true;
			require_server_restart_sentinel.recordLatestUpdateRestartSentinel(payload);
		} catch {
			sentinelPersisted = false;
		}
		const updateWasPackageSwap = result.status === "ok" && result.mode !== "git";
		const restart = managedHandoffRestart ?? (result.status === "ok" ? require_restart.scheduleGatewaySigusr1Restart({
			delayMs: updateWasPackageSwap ? 0 : restartDelayMs,
			reason: "update.run",
			skipDeferral: updateWasPackageSwap,
			skipCooldown: updateWasPackageSwap,
			audit: {
				actor: actor.actor,
				deviceId: actor.deviceId,
				clientIp: actor.clientIp,
				changedPaths: []
			}
		}) : null);
		context?.logGateway?.info(`update.run completed ${require_control_plane_audit.formatControlPlaneActor(actor)} changedPaths=<n/a> restartReason=update.run status=${result.status}`);
		if (restart?.coalesced) context?.logGateway?.warn(`update.run restart coalesced ${require_control_plane_audit.formatControlPlaneActor(actor)} delayMs=${restart.delayMs}`);
		respond(true, {
			ok: result.status === "ok" || handoff?.status === "started",
			result,
			...handoff ? { handoff } : {},
			restart,
			sentinel: {
				persisted: sentinelPersisted,
				payload
			}
		}, void 0);
	}
};
//#endregion
exports.updateHandlers = updateHandlers;
