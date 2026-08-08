require("./rolldown-runtime-u92d-OFm.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
const require_status = require("./status-pSULYkKm.cjs");
const require_progress = require("./progress-JkW4pQSo.cjs");
const require_status_scan_overview = require("./status.scan-overview-CfkCsnYL.cjs");
const require_status_scan_fast_json = require("./status.scan.fast-json-S2NvxRqq.cjs");
//#region src/commands/status.scan.ts
/** Runs the status scan for text or JSON command modes. */
async function scanStatus(opts, _runtime) {
	if (opts.json) return await require_status_scan_fast_json.scanStatusJsonWithPolicy({
		timeoutMs: opts.timeoutMs,
		all: opts.all
	}, _runtime, {
		commandName: "status --json",
		resolveHasConfiguredChannels: (cfg, sourceConfig) => require_channel_presence_policy.hasConfiguredChannelsForReadOnlyScope({
			config: cfg,
			activationSourceConfig: sourceConfig
		}),
		resolveMemory: async ({ cfg, agentStatus, memoryPlugin }) => await require_status_scan_fast_json.resolveStatusMemoryStatusSnapshot({
			cfg,
			agentStatus,
			memoryPlugin
		})
	});
	return await require_progress.withProgress({
		label: "Scanning status…",
		total: 10,
		enabled: true
	}, async (progress) => {
		const isFullScan = opts.all === true || opts.deep === true;
		const overview = await require_status_scan_overview.collectStatusScanOverview({
			commandName: "status",
			opts,
			showSecrets: process.env.OPERATOR_SHOW_SECRETS?.trim() !== "0",
			includeLiveChannelStatus: isFullScan,
			includeChannelSetupRuntimeFallback: isFullScan,
			channelCredentialResolutionSkipped: !isFullScan,
			includeChannelSecretTargets: isFullScan ? void 0 : false,
			fetchGitUpdate: isFullScan,
			includeRegistryUpdate: isFullScan,
			includeAdvertisedControlUiLinks: true,
			progress,
			labels: {
				loadingConfig: "Loading config…",
				checkingTailscale: "Checking Tailscale…",
				checkingForUpdates: "Checking for updates…",
				resolvingAgents: "Resolving agents…",
				probingGateway: "Probing gateway…",
				queryingChannelStatus: "Querying channel status…",
				summarizingChannels: "Summarizing channels…"
			}
		});
		progress.setLabel("Checking plugins…");
		const pluginCompatibility = opts.all ? require_status.buildPluginCompatibilitySnapshotNotices({ config: overview.cfg }) : [];
		progress.tick();
		progress.setLabel("Checking memory and sessions…");
		const result = await require_status_scan_fast_json.executeStatusScanFromOverview({
			overview,
			resolveMemory: async ({ cfg, agentStatus, memoryPlugin }) => opts.all ? await require_status_scan_fast_json.resolveStatusMemoryStatusSnapshot({
				cfg,
				agentStatus,
				memoryPlugin
			}) : null,
			channelIssues: overview.channelIssues,
			channels: overview.channels,
			pluginCompatibility
		});
		progress.tick();
		progress.setLabel("Rendering…");
		progress.tick();
		return result;
	});
}
//#endregion
exports.scanStatus = scanStatus;
