require("./rolldown-runtime-u92d-OFm.cjs");
const require_runtime_state = require("./runtime-state-DbA1_jkE.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_core_descriptors = require("./core-descriptors-DnvIcTik.cjs");
const require_registry = require("./registry-CRaYjnOZ.cjs");
const require_gateway_request_scope = require("./gateway-request-scope-Dy7CSqxn.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_control_plane_rate_limit = require("./control-plane-rate-limit-CoRWsoiI.cjs");
const require_startup_unavailable = require("./startup-unavailable-CFwHGTa9.cjs");
const require_control_plane_audit = require("./control-plane-audit-OJXxLDr7.cjs");
const require_role_policy = require("./role-policy-DpxCs0_d.cjs");
//#region src/gateway/server-methods-node-methods.ts
const NODE_PAIR_GATEWAY_METHODS = [
	"node.pair.list",
	"node.pair.approve",
	"node.pair.reject"
];
//#endregion
//#region src/gateway/server-methods/lazy-core-handlers.ts
function lazyHandlerModule(loadModule, selectHandlers) {
	let handlersPromise = null;
	return () => handlersPromise ??= loadModule().then(selectHandlers);
}
function createLazyCoreHandlers(params) {
	return Object.fromEntries(params.methods.map((method) => [method, async (opts) => {
		const handler = (await params.loadHandlers())[method];
		if (!handler) throw new Error(`lazy gateway handler not found: ${method}`);
		await handler(opts);
	}]));
}
//#endregion
//#region src/gateway/server-methods/skills-method-names.ts
const SKILLS_GATEWAY_METHOD_NAMES = [
	"skills.upload.begin",
	"skills.upload.chunk",
	"skills.upload.commit",
	"skills.status",
	"skills.bins",
	"skills.search",
	"skills.detail",
	"skills.securityVerdicts",
	"skills.skillCard",
	"skills.install",
	"skills.update",
	"skills.curator.status",
	"skills.curator.pin",
	"skills.curator.unpin",
	"skills.curator.restore",
	"skills.proposals.list",
	"skills.proposals.inspect",
	"skills.proposals.historyStatus",
	"skills.proposals.historyScan",
	"skills.proposals.create",
	"skills.proposals.update",
	"skills.proposals.revise",
	"skills.proposals.requestRevision",
	"skills.proposals.apply",
	"skills.proposals.reject",
	"skills.proposals.quarantine"
];
//#endregion
//#region src/gateway/server-methods.ts
const loadAgentHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./agent-C5Ud9P29.cjs")), (module) => module.agentHandlers);
const loadAgentsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./agents-DB8tNptQ.cjs")), (module) => module.agentsHandlers);
const loadAgentsWorkspaceHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./agents-workspace-DBH-T7jD.cjs")), (module) => module.agentsWorkspaceHandlers);
const loadArtifactsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./artifacts-DO8wiwiF.cjs")), (module) => module.artifactsHandlers);
const loadAuditHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./audit-BkOvoSX_.cjs")), (module) => module.auditHandlers);
const loadAttachHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./attach-BMBjw4ia.cjs")), (module) => module.attachHandlers);
const loadChannelsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./channels-Ulx_fu0p.cjs")), (module) => module.channelsHandlers);
const loadChatHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./chat-ByfwVz6X.cjs")).then((n) => n.chat_exports), (module) => module.chatHandlers);
const loadCommandsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./commands-C8da3cUg.cjs")), (module) => module.commandsHandlers);
const loadConfigHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./config-DnPIPhWi.cjs")), (module) => module.configHandlers);
const loadConnectHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./connect-CjOy1zxQ.cjs")), (module) => module.connectHandlers);
const loadControlUiHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./control-ui-CfLC-pN8.cjs")), (module) => module.controlUiHandlers);
const loadCronHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./cron-D15Oo1WR.cjs")), (module) => module.cronHandlers);
const loadDeviceHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./devices-CrHnP80o.cjs")), (module) => module.deviceHandlers);
const loadDevicePairSetupHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./device-pair-setup-BuVIaDpP.cjs")), (module) => module.devicePairSetupHandlers);
const loadDiagnosticsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./diagnostics-Y85PhwyY.cjs")), (module) => module.diagnosticsHandlers);
const loadDoctorHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./doctor-DU04vT1r.cjs")), (module) => module.doctorHandlers);
const loadEnvironmentsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./environments-DS8UxFw2.cjs")), (module) => module.environmentsHandlers);
const loadWorktreesHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./worktrees-CFzTwtAj.cjs")), (module) => module.worktreesHandlers);
const loadExecApprovalsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./exec-approvals-Dxm2NjTa.cjs")), (module) => module.execApprovalsHandlers);
const loadFsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./fs-CMOgPG6O.cjs")), (module) => module.fsHandlers);
const loadHealthHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./health-uee_O-GO.cjs")), (module) => module.healthHandlers);
const loadLogsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./logs-u3gojgu7.cjs")), (module) => module.logsHandlers);
const loadTerminalHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./terminal-DH1vlvO_.cjs")), (module) => module.terminalHandlers);
const loadModelsAuthStatusHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./models-auth-status-tf_lgpeg.cjs")), (module) => module.modelsAuthStatusHandlers);
const loadModelsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./models-JHlO02cU.cjs")), (module) => module.modelsHandlers);
const loadModelsProbeHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./models-probe-kZAYplWF.cjs")), (module) => module.modelsProbeHandlers);
const loadNativeHookRelayHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./native-hook-relay-C_STqzT6.cjs")), (module) => module.nativeHookRelayHandlers);
const loadNodePendingHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./nodes-pending-rL3wQz8q.cjs")), (module) => module.nodePendingHandlers);
const loadNodeHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./nodes-DTMZ-I8B.cjs")), (module) => module.nodeHandlers);
const loadPluginHostHookHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./plugin-host-hooks-C7JinubF.cjs")), (module) => module.pluginHostHookHandlers);
const loadPluginsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./plugins-Dx4JP7Id.cjs")), (module) => module.pluginsHandlers);
const loadMigrationsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./migrations-Ddc28lc1.cjs")), (module) => module.migrationsHandlers);
const loadPushHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./push-BS3FHiCw.cjs")), (module) => module.pushHandlers);
const loadRestartHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./restart-R9KjHHEz.cjs")), (module) => module.restartHandlers);
const loadSuspendHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./suspend-DENlBBO5.cjs")), (module) => module.suspendHandlers);
const loadSendHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./send-D_b7676D.cjs")), (module) => module.sendHandlers);
const loadSessionsFilesHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./sessions-files-BrhRzpsg.cjs")), (module) => module.sessionsFilesHandlers);
const loadSessionsDiffHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./sessions-diff-5UBxFboz.cjs")), (module) => module.sessionsDiffHandlers);
const loadSessionsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./sessions-DwuqFzzg.cjs")), (module) => module.sessionsHandlers);
const loadSessionCatalogHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./session-catalog-BfN_zCEC.cjs")).then((n) => n.session_catalog_exports), (module) => module.sessionCatalogHandlers);
const loadSkillsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./skills-CdanUxl9.cjs")), (module) => module.skillsHandlers);
const loadSystemHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./system-OfhXfcp7.cjs")), (module) => module.systemHandlers);
const loadTalkHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./talk-Qw6-w5VL.cjs")), (module) => module.talkHandlers);
const loadTasksHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./tasks-6XLdKqcv.cjs")), (module) => module.tasksHandlers);
const loadTaskSuggestionsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./task-suggestions-pV3CV3wG.cjs")), (module) => module.taskSuggestionsHandlers);
const loadToolsCatalogHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./tools-catalog-C8t-RlTF.cjs")), (module) => module.toolsCatalogHandlers);
const loadToolsEffectiveHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./tools-effective-DazHWA14.cjs")), (module) => module.toolsEffectiveHandlers);
const loadToolsInvokeHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./tools-invoke-DgauVHOk.cjs")), (module) => module.toolsInvokeHandlers);
const loadMcpAppHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./mcp-app-DLN_zB0_.cjs")), (module) => module.mcpAppHandlers);
const loadTtsHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./tts-M38o6UvD.cjs")), (module) => module.ttsHandlers);
const loadUpdateHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./update-BxbH7eRj.cjs")), (module) => module.updateHandlers);
const loadUsageHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./usage-D1-jI1lj.cjs")), (module) => module.usageHandlers);
const loadVoicewakeRoutingHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./voicewake-routing-cHgs5ssB.cjs")), (module) => module.voicewakeRoutingHandlers);
const loadVoicewakeHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./voicewake-D6gLhpIJ.cjs")), (module) => module.voicewakeHandlers);
const loadWebHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./web-s8gDorNQ.cjs")), (module) => module.webHandlers);
const loadSystemAgentHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./system-agent-CPOfHEsv.cjs")), (module) => module.systemAgentHandlers);
const loadWizardHandlers = lazyHandlerModule(() => Promise.resolve().then(() => require("./wizard-Cid6PHpZ.cjs")), (module) => module.wizardHandlers);
function authorizeGatewayMethod(method, client, params, methodRegistry) {
	if (!client?.connect) return null;
	if (method === "health") return null;
	const roleRaw = client.connect.role ?? "operator";
	const role = require_role_policy.parseGatewayRole(roleRaw);
	if (!role) return require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unauthorized role: ${roleRaw}`);
	const scopes = client.connect.scopes ?? [];
	if (!require_role_policy.isRoleAuthorizedForMethod(role, method)) return require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unauthorized role: ${role}`);
	if (role === "node") return null;
	if (scopes.includes("operator.admin")) return null;
	const registeredScope = methodRegistry.getScope(method);
	const scopeAuth = require_operator_scopes.isOperatorScope(registeredScope) ? require_method_scopes.authorizeOperatorScopesForRequiredScope(registeredScope, scopes) : require_method_scopes.authorizeOperatorScopesForMethod(method, scopes, params);
	if (!scopeAuth.allowed) return require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `missing scope: ${scopeAuth.missingScope}`);
	return null;
}
const SUSPEND_CONTROL_METHODS = /* @__PURE__ */ new Set([
	"gateway.suspend.prepare",
	"gateway.suspend.status",
	"gateway.suspend.resume"
]);
function isGatewayMethodAllowedDuringSuspension(method) {
	return SUSPEND_CONTROL_METHODS.has(method);
}
const coreGatewayHandlers = {
	...createLazyCoreHandlers({
		methods: ["connect"],
		loadHandlers: loadConnectHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["attach.grant", "attach.revoke"],
		loadHandlers: loadAttachHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["logs.tail"],
		loadHandlers: loadLogsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"terminal.open",
			"terminal.input",
			"terminal.resize",
			"terminal.close",
			"terminal.attach",
			"terminal.list",
			"terminal.text",
			"terminal.upload"
		],
		loadHandlers: loadTerminalHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["voicewake.get", "voicewake.set"],
		loadHandlers: loadVoicewakeHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["voicewake.routing.get", "voicewake.routing.set"],
		loadHandlers: loadVoicewakeRoutingHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["health", "status"],
		loadHandlers: loadHealthHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"channels.status",
			"channels.start",
			"channels.stop",
			"channels.logout"
		],
		loadHandlers: loadChannelsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"chat.history",
			"chat.startup",
			"chat.metadata",
			"chat.message.get",
			"chat.toolTitles",
			"chat.abort",
			"chat.send",
			"chat.inject"
		],
		loadHandlers: loadChatHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["commands.list"],
		loadHandlers: loadCommandsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"wake",
			"cron.list",
			"cron.status",
			"cron.get",
			"cron.add",
			"cron.update",
			"cron.remove",
			"cron.run",
			"cron.runs"
		],
		loadHandlers: loadCronHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"device.pair.list",
			"device.pair.approve",
			"device.pair.reject",
			"device.pair.remove",
			"device.pair.rename",
			"device.token.rotate",
			"device.token.revoke"
		],
		loadHandlers: loadDeviceHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["device.pair.setupCode"],
		loadHandlers: loadDevicePairSetupHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["diagnostics.stability"],
		loadHandlers: loadDiagnosticsHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["controlUi.githubPreview", "controlUi.sessionPullRequests"],
		loadHandlers: loadControlUiHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"doctor.memory.status",
			"doctor.memory.dreamDiary",
			"doctor.memory.backfillDreamDiary",
			"doctor.memory.resetDreamDiary",
			"doctor.memory.resetGroundedShortTerm",
			"doctor.memory.repairDreamingArtifacts",
			"doctor.memory.dedupeDreamDiary",
			"doctor.memory.remHarness"
		],
		loadHandlers: loadDoctorHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"environments.list",
			"environments.status",
			"environments.create",
			"environments.destroy"
		],
		loadHandlers: loadEnvironmentsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"worktrees.list",
			"worktrees.branches",
			"worktrees.create",
			"worktrees.remove",
			"worktrees.restore",
			"worktrees.gc"
		],
		loadHandlers: loadWorktreesHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"exec.approvals.get",
			"exec.approvals.set",
			"exec.approvals.node.get",
			"exec.approvals.node.set"
		],
		loadHandlers: loadExecApprovalsHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["fs.listDir"],
		loadHandlers: loadFsHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["web.login.start", "web.login.wait"],
		loadHandlers: loadWebHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["models.list"],
		loadHandlers: loadModelsHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["models.probe"],
		loadHandlers: loadModelsProbeHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["models.authLogout", "models.authStatus"],
		loadHandlers: loadModelsAuthStatusHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["nativeHook.invoke"],
		loadHandlers: loadNativeHookRelayHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["plugins.uiDescriptors", "plugins.sessionAction"],
		loadHandlers: loadPluginHostHookHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"plugins.list",
			"plugins.search",
			"plugins.install",
			"plugins.setEnabled",
			"plugins.uninstall"
		],
		loadHandlers: loadPluginsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"config.get",
			"config.schema",
			"config.schema.lookup",
			"config.set",
			"config.patch",
			"config.apply",
			"config.openFile"
		],
		loadHandlers: loadConfigHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"wizard.start",
			"wizard.next",
			"wizard.cancel",
			"wizard.status"
		],
		loadHandlers: loadWizardHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"operator.chat",
			"operator.approval.list",
			"operator.setup.detect",
			"operator.setup.verify",
			"operator.setup.activate",
			"operator.setup.auth.start"
		],
		loadHandlers: loadSystemAgentHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"talk.session.create",
			"talk.session.join",
			"talk.session.appendAudio",
			"talk.session.startTurn",
			"talk.session.endTurn",
			"talk.session.cancelTurn",
			"talk.session.cancelOutput",
			"talk.session.acknowledgeMark",
			"talk.session.submitToolResult",
			"talk.session.steer",
			"talk.session.close",
			"talk.client.create",
			"talk.client.toolCall",
			"talk.client.steer",
			"talk.catalog",
			"talk.config",
			"talk.speak",
			"talk.mode"
		],
		loadHandlers: loadTalkHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["audit.list", "audit.activity.list"],
		loadHandlers: loadAuditHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"tasks.list",
			"tasks.get",
			"tasks.cancel"
		],
		loadHandlers: loadTasksHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"taskSuggestions.list",
			"taskSuggestions.create",
			"taskSuggestions.accept",
			"taskSuggestions.dismiss"
		],
		loadHandlers: loadTaskSuggestionsHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["tools.catalog"],
		loadHandlers: loadToolsCatalogHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["tools.effective"],
		loadHandlers: loadToolsEffectiveHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["tools.invoke"],
		loadHandlers: loadToolsInvokeHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"mcp.app.view",
			"mcp.app.callTool",
			"mcp.app.listTools",
			"mcp.app.listResources",
			"mcp.app.listResourceTemplates",
			"mcp.app.readResource"
		],
		loadHandlers: loadMcpAppHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"tts.status",
			"tts.enable",
			"tts.disable",
			"tts.convert",
			"tts.speak",
			"tts.setProvider",
			"tts.personas",
			"tts.setPersona",
			"tts.providers"
		],
		loadHandlers: loadTtsHandlers
	}),
	...createLazyCoreHandlers({
		methods: SKILLS_GATEWAY_METHOD_NAMES,
		loadHandlers: loadSkillsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"sessions.catalog.list",
			"sessions.catalog.read",
			"sessions.catalog.continue",
			"sessions.catalog.archive"
		],
		loadHandlers: loadSessionCatalogHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"sessions.list",
			"sessions.search",
			"sessions.cleanup",
			"sessions.subscribe",
			"sessions.unsubscribe",
			"sessions.messages.subscribe",
			"sessions.messages.unsubscribe",
			"sessions.preview",
			"sessions.describe",
			"sessions.resolve",
			"sessions.compaction.list",
			"sessions.compaction.get",
			"sessions.create",
			"sessions.compaction.branch",
			"sessions.compaction.restore",
			"sessions.send",
			"sessions.steer",
			"sessions.abort",
			"sessions.patch",
			"sessions.pluginPatch",
			"sessions.reset",
			"sessions.delete",
			"sessions.get",
			"sessions.compact",
			"sessions.groups.list",
			"sessions.groups.put",
			"sessions.groups.rename",
			"sessions.groups.delete",
			"sessions.dispatch",
			"sessions.reclaim"
		],
		loadHandlers: loadSessionsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"gateway.identity.get",
			"last-heartbeat",
			"set-heartbeats",
			"system-presence",
			"system.info",
			"system-event"
		],
		loadHandlers: loadSystemHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["update.status", "update.run"],
		loadHandlers: loadUpdateHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			...NODE_PAIR_GATEWAY_METHODS,
			"node.pair.remove",
			"node.rename",
			"node.list",
			"node.describe",
			"node.pluginSurface.refresh",
			"node.pluginTools.update",
			"node.skills.update",
			"node.pending.pull",
			"node.pending.ack",
			"node.invoke",
			"node.invoke.progress",
			"node.invoke.result",
			"node.event"
		],
		loadHandlers: loadNodeHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["node.pending.drain", "node.pending.enqueue"],
		loadHandlers: loadNodePendingHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"push.test",
			"push.web.vapidPublicKey",
			"push.web.subscribe",
			"push.web.unsubscribe",
			"push.web.test"
		],
		loadHandlers: loadPushHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["gateway.restart.request", "gateway.restart.preflight"],
		loadHandlers: loadRestartHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"gateway.suspend.prepare",
			"gateway.suspend.status",
			"gateway.suspend.resume"
		],
		loadHandlers: loadSuspendHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"message.action",
			"send",
			"poll"
		],
		loadHandlers: loadSendHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"usage.status",
			"usage.cost",
			"sessions.usage",
			"sessions.usage.timeseries",
			"sessions.usage.logs"
		],
		loadHandlers: loadUsageHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"agent",
			"agent.identity.get",
			"agent.wait"
		],
		loadHandlers: loadAgentHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"agents.list",
			"agents.create",
			"agents.update",
			"agents.delete",
			"agents.files.list",
			"agents.files.get",
			"agents.files.set"
		],
		loadHandlers: loadAgentsHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["agents.workspace.list", "agents.workspace.get"],
		loadHandlers: loadAgentsWorkspaceHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"artifacts.list",
			"artifacts.get",
			"artifacts.download"
		],
		loadHandlers: loadArtifactsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"sessions.files.list",
			"sessions.files.get",
			"sessions.files.set"
		],
		loadHandlers: loadSessionsFilesHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["sessions.diff"],
		loadHandlers: loadSessionsDiffHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["migrations.memory.plan", "migrations.memory.apply"],
		loadHandlers: loadMigrationsHandlers
	})
};
/** Builds the per-request method registry from core, plugin, and explicit extra handlers. */
function createRequestGatewayMethodRegistry(extraHandlers) {
	const activePluginRegistry = require_runtime_state.getPluginRegistryState()?.activeRegistry;
	const activePluginHandlers = activePluginRegistry?.gatewayHandlers ?? {};
	const extraHandlerEntries = Object.entries(extraHandlers ?? {});
	const pluginMethodNames = new Set(Object.keys(activePluginHandlers));
	const coreDescriptorHandlers = { ...coreGatewayHandlers };
	for (const [method, extraHandler] of extraHandlerEntries) if (!pluginMethodNames.has(method) && require_core_descriptors.isCoreGatewayMethodClassified(method)) coreDescriptorHandlers[method] = extraHandler;
	const coreDescriptors = require_core_descriptors.createCoreGatewayMethodDescriptors(coreDescriptorHandlers);
	for (const descriptor of coreDescriptors) {
		const extraHandler = extraHandlers?.[descriptor.name];
		if (extraHandler && !pluginMethodNames.has(descriptor.name)) descriptor.handler = extraHandler;
	}
	const coreMethodNames = new Set(coreDescriptors.map((descriptor) => descriptor.name));
	const auxHandlers = Object.fromEntries(extraHandlerEntries.filter(([method]) => !pluginMethodNames.has(method) && !coreMethodNames.has(method)));
	return require_registry.createGatewayMethodRegistry([
		...coreDescriptors,
		...activePluginRegistry ? require_registry.createPluginGatewayMethodDescriptors(activePluginRegistry) : [],
		...require_registry.createGatewayMethodDescriptorsFromHandlers({
			handlers: auxHandlers,
			owner: {
				kind: "aux",
				area: "gateway-extra"
			},
			defaultScope: require_operator_scopes.ADMIN_SCOPE
		})
	]);
}
/** Authorizes and dispatches one gateway JSON-RPC-style request. */
async function handleGatewayRequest(opts) {
	const { req, respond, client, isWebchatConnect, context } = opts;
	const methodRegistry = opts.methodRegistry?.getHandler(req.method) !== void 0 ? opts.methodRegistry : createRequestGatewayMethodRegistry(opts.extraHandlers);
	const authError = authorizeGatewayMethod(req.method, client, req.params, methodRegistry);
	if (authError) {
		respond(false, void 0, authError);
		return;
	}
	if (context.unavailableGatewayMethods?.has(req.method)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `${req.method} unavailable during gateway startup`, {
			retryable: true,
			retryAfterMs: 500,
			details: {
				...require_startup_unavailable.gatewayStartupUnavailableDetails(),
				method: req.method
			}
		}));
		return;
	}
	const rejectRateLimitedControlPlaneWrite = () => {
		if (!methodRegistry.isControlPlaneWrite(req.method)) return false;
		const budget = require_control_plane_rate_limit.consumeControlPlaneWriteBudget({ client });
		if (budget.allowed) return false;
		const actor = require_control_plane_audit.resolveControlPlaneActor(client);
		context.logGateway.warn(`control-plane write rate-limited method=${req.method} ${require_control_plane_audit.formatControlPlaneActor(actor)} retryAfterMs=${budget.retryAfterMs} key=${budget.key}`);
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `rate limit exceeded for ${req.method}; retry after ${Math.ceil(budget.retryAfterMs / 1e3)}s`, {
			retryable: true,
			retryAfterMs: budget.retryAfterMs,
			details: {
				method: req.method,
				limit: "3 per 60s"
			}
		}));
		return true;
	};
	const isSuspendPrepare = req.method === "gateway.suspend.prepare";
	if (isSuspendPrepare && rejectRateLimitedControlPlaneWrite()) return;
	const handler = methodRegistry.getHandler(req.method);
	if (!handler) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown method: ${req.method}`));
		return;
	}
	const rootWorkAdmission = require_gateway_work_admission.tryBeginGatewayRootWorkAdmission();
	if (req.method === "gateway.suspend.prepare" && rootWorkAdmission && !rootWorkAdmission.ownsRoot) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "gateway suspension cannot begin from a nested request", {
			retryable: true,
			retryAfterMs: 1e3,
			details: {
				method: req.method,
				reason: "nested-gateway-request"
			}
		}));
		return;
	}
	if (!rootWorkAdmission && !isGatewayMethodAllowedDuringSuspension(req.method)) {
		const restartDraining = require_gateway_work_admission.isGatewayRestartDraining();
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `${req.method} unavailable during gateway ${restartDraining ? "restart" : "suspension"}`, {
			retryable: true,
			retryAfterMs: 1e3,
			details: {
				method: req.method,
				reason: restartDraining ? "gateway-restarting" : "gateway-suspending",
				phase: require_gateway_work_admission.getGatewaySuspendAdmissionPhase()
			}
		}));
		return;
	}
	if (!isSuspendPrepare && rejectRateLimitedControlPlaneWrite()) {
		rootWorkAdmission?.release();
		return;
	}
	const invokeHandler = () => handler({
		req,
		params: req.params ?? {},
		client,
		isWebchatConnect,
		respond,
		context
	});
	const invokeWithRequestScope = async () => await require_gateway_request_scope.withPluginRuntimeGatewayRequestScope({
		context,
		client,
		isWebchatConnect
	}, invokeHandler);
	if (!rootWorkAdmission) {
		await invokeWithRequestScope();
		return;
	}
	try {
		await rootWorkAdmission.run(invokeWithRequestScope);
	} finally {
		rootWorkAdmission.release();
	}
}
//#endregion
exports.coreGatewayHandlers = coreGatewayHandlers;
exports.handleGatewayRequest = handleGatewayRequest;
