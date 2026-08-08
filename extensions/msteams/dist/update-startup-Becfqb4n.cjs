const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_restart = require("./restart-sBMxYOWJ.cjs");
const require_update_channels = require("./update-channels-BEYweYMB.cjs");
const require_update_check = require("./update-check-yvbRd7TR.cjs");
const require_update_control_plane_sentinel = require("./update-control-plane-sentinel-9paZY1RI.cjs");
const require_update_managed_service_handoff = require("./update-managed-service-handoff-C5_MDgvI.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/infra/update-startup.ts
var update_startup_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	getUpdateAvailable: () => getUpdateAvailable,
	runGatewayUpdateCheck: () => runGatewayUpdateCheck,
	scheduleGatewayUpdateCheck: () => scheduleGatewayUpdateCheck
});
let updateAvailableCache = null;
function getUpdateAvailable() {
	return updateAvailableCache;
}
const UPDATE_CHECK_STATE_KEY = "default";
const UPDATE_CHECK_INTERVAL_MS = 1440 * 60 * 1e3;
const ONE_HOUR_MS = 3600 * 1e3;
const AUTO_UPDATE_COMMAND_TIMEOUT_MS = 2700 * 1e3;
const AUTO_STABLE_DELAY_HOURS_DEFAULT = 6;
const AUTO_STABLE_JITTER_HOURS_DEFAULT = 12;
const AUTO_BETA_CHECK_INTERVAL_HOURS_DEFAULT = 1;
const MANAGED_AUTO_UPDATE_SYSTEMD_RESTART_GRACE_MS = 2e3;
function shouldSkipCheck(allowInTests) {
	if (allowInTests) return false;
	if (process.env.VITEST || false) return true;
	return false;
}
function resolveAutoUpdatePolicy(cfg) {
	const auto = cfg.update?.auto;
	const stableDelayHours = typeof auto?.stableDelayHours === "number" && Number.isFinite(auto.stableDelayHours) ? Math.max(0, auto.stableDelayHours) : AUTO_STABLE_DELAY_HOURS_DEFAULT;
	const stableJitterHours = typeof auto?.stableJitterHours === "number" && Number.isFinite(auto.stableJitterHours) ? Math.max(0, auto.stableJitterHours) : AUTO_STABLE_JITTER_HOURS_DEFAULT;
	const betaCheckIntervalHours = typeof auto?.betaCheckIntervalHours === "number" && Number.isFinite(auto.betaCheckIntervalHours) ? Math.max(.25, auto.betaCheckIntervalHours) : AUTO_BETA_CHECK_INTERVAL_HOURS_DEFAULT;
	return {
		enabled: Boolean(auto?.enabled),
		stableDelayHours,
		stableJitterHours,
		betaCheckIntervalHours
	};
}
function resolveCheckIntervalMs(cfg) {
	const channel = require_update_channels.normalizeUpdateChannel(cfg.update?.channel) ?? "stable";
	const auto = resolveAutoUpdatePolicy(cfg);
	if (!auto.enabled) return UPDATE_CHECK_INTERVAL_MS;
	if (channel === "beta") return Math.max(ONE_HOUR_MS / 4, Math.floor(auto.betaCheckIntervalHours * ONE_HOUR_MS));
	if (channel === "stable") return ONE_HOUR_MS;
	return UPDATE_CHECK_INTERVAL_MS;
}
function presentString(value) {
	return value ?? void 0;
}
async function readState() {
	const database = require_openclaw_state_db.openOperatorStateDatabase();
	const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, stateDb.selectFrom("update_check_state").selectAll().where("state_key", "=", UPDATE_CHECK_STATE_KEY));
	if (!row) return {};
	return {
		lastCheckedAt: presentString(row.last_checked_at),
		lastNotifiedVersion: presentString(row.last_notified_version),
		lastNotifiedTag: presentString(row.last_notified_tag),
		lastAvailableVersion: presentString(row.last_available_version),
		lastAvailableTag: presentString(row.last_available_tag),
		autoInstallId: presentString(row.auto_install_id),
		autoFirstSeenVersion: presentString(row.auto_first_seen_version),
		autoFirstSeenTag: presentString(row.auto_first_seen_tag),
		autoFirstSeenAt: presentString(row.auto_first_seen_at),
		autoLastAttemptVersion: presentString(row.auto_last_attempt_version),
		autoLastAttemptAt: presentString(row.auto_last_attempt_at),
		autoLastSuccessVersion: presentString(row.auto_last_success_version),
		autoLastSuccessAt: presentString(row.auto_last_success_at)
	};
}
async function writeState(state) {
	const updatedAtMs = Date.now();
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.deleteFrom("update_check_state").where("state_key", "=", UPDATE_CHECK_STATE_KEY));
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("update_check_state").values({
			state_key: UPDATE_CHECK_STATE_KEY,
			last_checked_at: state.lastCheckedAt ?? null,
			last_notified_version: state.lastNotifiedVersion ?? null,
			last_notified_tag: state.lastNotifiedTag ?? null,
			last_available_version: state.lastAvailableVersion ?? null,
			last_available_tag: state.lastAvailableTag ?? null,
			auto_install_id: state.autoInstallId ?? null,
			auto_first_seen_version: state.autoFirstSeenVersion ?? null,
			auto_first_seen_tag: state.autoFirstSeenTag ?? null,
			auto_first_seen_at: state.autoFirstSeenAt ?? null,
			auto_last_attempt_version: state.autoLastAttemptVersion ?? null,
			auto_last_attempt_at: state.autoLastAttemptAt ?? null,
			auto_last_success_version: state.autoLastSuccessVersion ?? null,
			auto_last_success_at: state.autoLastSuccessAt ?? null,
			updated_at_ms: updatedAtMs
		}));
	});
}
function sameUpdateAvailable(a, b) {
	if (a === b) return true;
	if (!a || !b) return false;
	return a.currentVersion === b.currentVersion && a.latestVersion === b.latestVersion && a.channel === b.channel;
}
function setUpdateAvailableCache(params) {
	if (sameUpdateAvailable(updateAvailableCache, params.next)) return;
	updateAvailableCache = params.next;
	params.onUpdateAvailableChange?.(params.next);
}
function isPersistedAvailabilityForChannel(params) {
	const tag = params.state.lastAvailableTag?.trim();
	if (params.channel === "stable") return !tag || tag === "latest";
	if (params.channel === "beta") return tag === "beta" || tag === "latest";
	return tag === params.channel;
}
function resolvePersistedUpdateAvailable(state, channel) {
	const latestVersion = state.lastAvailableVersion?.trim();
	if (!latestVersion || !isPersistedAvailabilityForChannel({
		state,
		channel
	})) return null;
	const cmp = require_update_check.compareSemverStrings(require_version.VERSION, latestVersion);
	if (cmp == null || cmp >= 0) return null;
	return {
		currentVersion: require_version.VERSION,
		latestVersion,
		channel: state.lastAvailableTag?.trim() || require_update_channels.channelToNpmTag(channel)
	};
}
function clearPersistedAvailabilityForChannel(nextState, channel) {
	if (!isPersistedAvailabilityForChannel({
		state: nextState,
		channel
	})) return;
	delete nextState.lastAvailableVersion;
	delete nextState.lastAvailableTag;
}
function resolveStableJitterMs(params) {
	if (params.jitterWindowMs <= 0) return 0;
	return (0, node_crypto.createHash)("sha256").update(`${params.installId}:${params.version}:${params.tag}`).digest().readUInt32BE(0) % (Math.floor(params.jitterWindowMs) + 1);
}
function resolveUpdateCheckNowMs(valueMs) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(valueMs) ?? (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(Date.now()) ?? 0;
}
function resolveUpdateCheckTimestamp(valueMs) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.timestampMsToIsoString)(valueMs) ?? (0, _gabrielvfonseca_normalization_core_number_coercion.timestampMsToIsoString)(resolveUpdateCheckNowMs(Date.now())) ?? (/* @__PURE__ */ new Date()).toISOString();
}
function resolveStableAutoApplyAtMs(params) {
	if (!params.nextState.autoInstallId) params.nextState.autoInstallId = params.state.autoInstallId?.trim() || (0, node_crypto.randomUUID)();
	const installId = params.nextState.autoInstallId;
	if (!(params.state.autoFirstSeenVersion === params.version && params.state.autoFirstSeenTag === params.tag)) {
		params.nextState.autoFirstSeenVersion = params.version;
		params.nextState.autoFirstSeenTag = params.tag;
		params.nextState.autoFirstSeenAt = resolveUpdateCheckTimestamp(params.nowMs);
	} else {
		params.nextState.autoFirstSeenVersion = params.state.autoFirstSeenVersion;
		params.nextState.autoFirstSeenTag = params.state.autoFirstSeenTag;
		params.nextState.autoFirstSeenAt = params.state.autoFirstSeenAt;
	}
	const parsedFirstSeenMs = params.nextState.autoFirstSeenAt ? Date.parse(params.nextState.autoFirstSeenAt) : params.nowMs;
	const firstSeenMs = Number.isFinite(parsedFirstSeenMs) ? parsedFirstSeenMs : params.nowMs;
	const baseDelayMs = Math.max(0, params.stableDelayHours) * ONE_HOUR_MS;
	const jitterWindowMs = Math.max(0, params.stableJitterHours) * ONE_HOUR_MS;
	const jitterMs = resolveStableJitterMs({
		installId,
		version: params.version,
		tag: params.tag,
		jitterWindowMs
	});
	return firstSeenMs + baseDelayMs + jitterMs;
}
function resolveAutoUpdateHandoffRoot(root) {
	if (root?.trim()) return root;
	try {
		return process.cwd();
	} catch {
		return node_os.default.homedir();
	}
}
function resolveManagedAutoUpdateRestartDelayMs(supervisor) {
	return supervisor === "systemd" ? MANAGED_AUTO_UPDATE_SYSTEMD_RESTART_GRACE_MS : 0;
}
async function startManagedServiceAutoUpdateHandoff(params) {
	const restartDelayMs = resolveManagedAutoUpdateRestartDelayMs(params.supervisor);
	const handoffId = (0, node_crypto.randomUUID)();
	try {
		const started = await require_update_managed_service_handoff.startManagedServiceUpdateHandoff({
			root: resolveAutoUpdateHandoffRoot(params.root),
			timeoutMs: params.timeoutMs,
			restartDrainTimeoutMs: params.restartDrainTimeoutMs,
			channel: params.channel,
			restartDelayMs,
			supervisor: params.supervisor,
			handoffId,
			meta: {
				handoffId,
				note: "background auto-update"
			}
		});
		require_restart.scheduleGatewaySigusr1Restart({
			delayMs: restartDelayMs,
			reason: "update.auto",
			skipCooldown: true,
			skipDeferral: true
		});
		return {
			ok: true,
			code: 0,
			reason: require_update_control_plane_sentinel.CONTROL_PLANE_UPDATE_HANDOFF_STARTED_REASON,
			command: started.command,
			logPath: started.logPath
		};
	} catch (err) {
		return {
			ok: false,
			code: null,
			reason: String(err)
		};
	}
}
async function runAutoUpdateCommand(params) {
	const supervisor = require_update_managed_service_handoff.detectRespawnSupervisor(process.env, process.platform, { includeLinuxOperatorGatewayServiceMarker: true });
	if (supervisor) return await startManagedServiceAutoUpdateHandoff({
		channel: params.channel,
		timeoutMs: params.timeoutMs,
		restartDrainTimeoutMs: params.restartDrainTimeoutMs,
		root: params.root,
		supervisor
	});
	const baseArgs = [
		"update",
		"--yes",
		"--channel",
		params.channel,
		"--json"
	];
	const execPath = process.execPath?.trim();
	const argv1 = process.argv[1]?.trim();
	const lowerExecBase = execPath ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.basename(execPath)) : "";
	const runtimeIsNodeOrBun = lowerExecBase === "node" || lowerExecBase === "node.exe" || lowerExecBase === "bun" || lowerExecBase === "bun.exe";
	const argv = [];
	if (execPath && argv1) argv.push(execPath, argv1, ...baseArgs);
	else if (execPath && !runtimeIsNodeOrBun) argv.push(execPath, ...baseArgs);
	else if (execPath && params.root) {
		const candidates = [
			node_path.default.join(params.root, "dist", "entry.js"),
			node_path.default.join(params.root, "dist", "entry.mjs"),
			node_path.default.join(params.root, "dist", "index.js"),
			node_path.default.join(params.root, "dist", "index.mjs")
		];
		for (const candidate of candidates) try {
			await node_fs_promises.default.access(candidate);
			argv.push(execPath, candidate, ...baseArgs);
			break;
		} catch {}
	}
	if (argv.length === 0) argv.push("@gabrielvfonseca/operator", ...baseArgs);
	try {
		const res = await require_exec.runCommandWithTimeout(argv, {
			timeoutMs: params.timeoutMs,
			env: { OPERATOR_AUTO_UPDATE: "1" }
		});
		return {
			ok: res.code === 0,
			code: res.code,
			stdout: res.stdout,
			stderr: res.stderr,
			reason: res.code === 0 ? void 0 : "non-zero-exit"
		};
	} catch (err) {
		return {
			ok: false,
			code: null,
			reason: String(err)
		};
	}
}
function clearAutoState(nextState) {
	delete nextState.autoFirstSeenVersion;
	delete nextState.autoFirstSeenTag;
	delete nextState.autoFirstSeenAt;
}
async function resolveStartupInstallStatus() {
	const root = await require_openclaw_root.resolveOperatorPackageRoot({
		moduleUrl: require("url").pathToFileURL(__filename).href,
		argv1: process.argv[1],
		cwd: process.cwd()
	});
	return {
		root,
		status: await require_update_check.checkUpdateStatus({
			root,
			timeoutMs: 2500,
			fetchGit: false,
			includeRegistry: false
		})
	};
}
async function runGatewayUpdateCheck(params) {
	if (shouldSkipCheck(Boolean(params.allowInTests))) return;
	if (params.isNixMode) return;
	const configuredChannel = require_update_channels.normalizeUpdateChannel(params.cfg.update?.channel) ?? "stable";
	const auto = resolveAutoUpdatePolicy(params.cfg);
	const autoDisabledByEnv = require_env.isTruthyEnvValue(process.env.OPERATOR_NO_AUTO_UPDATE);
	const shouldRunAutoUpdate = (configuredChannel === "stable" || configuredChannel === "beta") && auto.enabled && !autoDisabledByEnv;
	const shouldRunUpdateHints = params.cfg.update?.checkOnStart !== false;
	if (!shouldRunUpdateHints && !shouldRunAutoUpdate) {
		if (configuredChannel === "extended-stable") setUpdateAvailableCache({
			next: null,
			onUpdateAvailableChange: params.onUpdateAvailableChange
		});
		return;
	}
	let installStatus;
	if (configuredChannel === "extended-stable") {
		installStatus = await resolveStartupInstallStatus();
		if (installStatus.status.installKind !== "package") {
			setUpdateAvailableCache({
				next: null,
				onUpdateAvailableChange: params.onUpdateAvailableChange
			});
			return;
		}
	}
	const state = await readState();
	const rawNow = Date.now();
	const now = resolveUpdateCheckNowMs(rawNow);
	const rawNowIsValid = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(rawNow) !== void 0;
	const lastCheckedAt = state.lastCheckedAt ? Date.parse(state.lastCheckedAt) : null;
	const persistedAvailable = shouldRunUpdateHints ? resolvePersistedUpdateAvailable(state, configuredChannel) : null;
	const hasExtendedStableCheckMarker = state.lastAvailableTag?.trim() === "extended-stable";
	const shouldBypassSharedThrottle = configuredChannel === "extended-stable" && !hasExtendedStableCheckMarker;
	if (shouldRunUpdateHints) setUpdateAvailableCache({
		next: persistedAvailable,
		onUpdateAvailableChange: params.onUpdateAvailableChange
	});
	else setUpdateAvailableCache({
		next: null,
		onUpdateAvailableChange: params.onUpdateAvailableChange
	});
	const checkIntervalMs = shouldRunAutoUpdate ? resolveCheckIntervalMs(params.cfg) : UPDATE_CHECK_INTERVAL_MS;
	if (!shouldBypassSharedThrottle && rawNowIsValid && lastCheckedAt && Number.isFinite(lastCheckedAt)) {
		if (now - lastCheckedAt < checkIntervalMs) return;
	}
	installStatus ??= await resolveStartupInstallStatus();
	const { root, status } = installStatus;
	const nextState = {
		...state,
		lastCheckedAt: resolveUpdateCheckTimestamp(now)
	};
	if (status.installKind !== "package") {
		delete nextState.lastAvailableVersion;
		delete nextState.lastAvailableTag;
		clearAutoState(nextState);
		setUpdateAvailableCache({
			next: null,
			onUpdateAvailableChange: params.onUpdateAvailableChange
		});
		await writeState(nextState);
		return;
	}
	const channel = configuredChannel;
	const resolved = await require_update_check.resolveNpmChannelTag({
		channel,
		timeoutMs: 2500
	});
	const tag = resolved.tag;
	if (!resolved.version) {
		if (channel === "extended-stable") {
			clearPersistedAvailabilityForChannel(nextState, channel);
			if (!nextState.lastAvailableVersion) nextState.lastAvailableTag = channel;
			setUpdateAvailableCache({
				next: null,
				onUpdateAvailableChange: params.onUpdateAvailableChange
			});
		}
		await writeState(nextState);
		return;
	}
	const cmp = require_update_check.compareSemverStrings(require_version.VERSION, resolved.version);
	if (cmp != null && cmp < 0) {
		const nextAvailable = {
			currentVersion: require_version.VERSION,
			latestVersion: resolved.version,
			channel: tag
		};
		if (shouldRunUpdateHints) setUpdateAvailableCache({
			next: nextAvailable,
			onUpdateAvailableChange: params.onUpdateAvailableChange
		});
		nextState.lastAvailableVersion = resolved.version;
		nextState.lastAvailableTag = tag;
		const shouldNotify = state.lastNotifiedVersion !== resolved.version || state.lastNotifiedTag !== tag;
		if (shouldRunUpdateHints && shouldNotify) {
			params.log.info(`update available (${tag}): v${resolved.version} (current v${require_version.VERSION}). Run: ${require_command_format.formatCliCommand("openclaw update")}`);
			nextState.lastNotifiedVersion = resolved.version;
			nextState.lastNotifiedTag = tag;
		}
		if (channel !== "extended-stable" && auto.enabled && autoDisabledByEnv) params.log.info("auto-update disabled by OPERATOR_NO_AUTO_UPDATE", {
			version: resolved.version,
			tag
		});
		if (shouldRunAutoUpdate && (channel === "stable" || channel === "beta")) {
			const runAuto = params.runAutoUpdate ?? runAutoUpdateCommand;
			const attemptIntervalMs = channel === "beta" ? Math.max(ONE_HOUR_MS / 4, Math.floor(auto.betaCheckIntervalHours * ONE_HOUR_MS)) : ONE_HOUR_MS;
			const lastAttemptAt = state.autoLastAttemptAt ? Date.parse(state.autoLastAttemptAt) : null;
			const recentAttemptForSameVersion = state.autoLastAttemptVersion === resolved.version && lastAttemptAt != null && Number.isFinite(lastAttemptAt) && now - lastAttemptAt < attemptIntervalMs;
			let dueNow = channel === "beta";
			let applyAfterMs = null;
			if (channel === "stable") {
				applyAfterMs = resolveStableAutoApplyAtMs({
					state,
					nextState,
					nowMs: now,
					version: resolved.version,
					tag,
					stableDelayHours: auto.stableDelayHours,
					stableJitterHours: auto.stableJitterHours
				});
				dueNow = now >= applyAfterMs;
			}
			if (!dueNow) params.log.info("auto-update deferred (stable rollout window active)", {
				version: resolved.version,
				tag,
				applyAfter: applyAfterMs ? resolveUpdateCheckTimestamp(applyAfterMs) : void 0
			});
			else if (recentAttemptForSameVersion) params.log.info("auto-update deferred (recent attempt exists)", {
				version: resolved.version,
				tag
			});
			else {
				nextState.autoLastAttemptVersion = resolved.version;
				nextState.autoLastAttemptAt = resolveUpdateCheckTimestamp(now);
				const outcome = await runAuto({
					channel,
					timeoutMs: AUTO_UPDATE_COMMAND_TIMEOUT_MS,
					restartDrainTimeoutMs: require_restart.resolveGatewayRestartDeferralTimeoutMs(require_io.getRuntimeConfig().gateway?.reload?.deferralTimeoutMs),
					root: root ?? status.root ?? void 0
				});
				if (outcome.ok && outcome.reason === "managed-service-handoff-started") params.log.info("auto-update handoff started", {
					channel,
					version: resolved.version,
					tag,
					...outcome.command ? { command: outcome.command } : {},
					...outcome.logPath ? { logPath: outcome.logPath } : {}
				});
				else if (outcome.ok) {
					nextState.autoLastSuccessVersion = resolved.version;
					nextState.autoLastSuccessAt = resolveUpdateCheckTimestamp(now);
					params.log.info("auto-update applied", {
						channel,
						version: resolved.version,
						tag
					});
				} else params.log.info("auto-update attempt failed", {
					channel,
					version: resolved.version,
					tag,
					reason: outcome.reason ?? `exit:${outcome.code}`
				});
			}
		}
	} else {
		if (channel === "extended-stable") {
			clearPersistedAvailabilityForChannel(nextState, channel);
			if (!nextState.lastAvailableVersion) nextState.lastAvailableTag = channel;
		} else {
			delete nextState.lastAvailableVersion;
			delete nextState.lastAvailableTag;
			clearAutoState(nextState);
		}
		setUpdateAvailableCache({
			next: null,
			onUpdateAvailableChange: params.onUpdateAvailableChange
		});
	}
	await writeState(nextState);
}
function scheduleGatewayUpdateCheck(params) {
	if ((require_update_channels.normalizeUpdateChannel(params.cfg.update?.channel) ?? "stable") === "extended-stable" && params.cfg.update?.checkOnStart === false) return () => {};
	let stopped = false;
	let timer = null;
	let running = false;
	const tick = async () => {
		if (stopped || running) return;
		running = true;
		try {
			await runGatewayUpdateCheck(params);
		} catch {} finally {
			running = false;
		}
		if (stopped) return;
		const intervalMs = resolveCheckIntervalMs(params.cfg);
		timer = setTimeout(() => {
			tick();
		}, intervalMs);
	};
	tick();
	return () => {
		stopped = true;
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	};
}
//#endregion
Object.defineProperty(exports, "getUpdateAvailable", {
	enumerable: true,
	get: function() {
		return getUpdateAvailable;
	}
});
Object.defineProperty(exports, "update_startup_exports", {
	enumerable: true,
	get: function() {
		return update_startup_exports;
	}
});
