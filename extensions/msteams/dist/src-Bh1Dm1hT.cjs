const require_schema = require("./schema-DpZMt4ud.cjs");
const require_worker_admission = require("./worker-admission-DNxVcwiA.cjs");
require("./worker-inference-Dfl4hXJC.cjs");
//#region packages/gateway-protocol/src/terminal-validators.ts
const validateTerminalOpenParams = require_schema.lazyCompile(require_schema.TerminalOpenParamsSchema);
const validateTerminalInputParams = require_schema.lazyCompile(require_schema.TerminalInputParamsSchema);
const validateTerminalResizeParams = require_schema.lazyCompile(require_schema.TerminalResizeParamsSchema);
const validateTerminalCloseParams = require_schema.lazyCompile(require_schema.TerminalCloseParamsSchema);
const validateTerminalAttachParams = require_schema.lazyCompile(require_schema.TerminalAttachParamsSchema);
const validateTerminalTextParams = require_schema.lazyCompile(require_schema.TerminalTextParamsSchema);
const validateTerminalUploadParams = require_schema.lazyCompile(require_schema.TerminalUploadParamsSchema);
const validateTerminalUploadResult = require_schema.lazyCompile(require_schema.TerminalUploadResultSchema);
require_schema.lazyCompile(require_schema.TerminalEventSchema);
require_schema.lazyCompile(require_schema.ApprovalGetResultSchema);
require_schema.lazyCompile(require_schema.ApprovalResolveResultSchema);
//#endregion
//#region packages/gateway-protocol/src/migration-api.ts
const validateMigrationsMemoryPlanParams = require_schema.lazyCompile(require_schema.MigrationsMemoryPlanParamsSchema);
const validateMigrationsMemoryApplyParams = require_schema.lazyCompile(require_schema.MigrationsMemoryApplyParamsSchema);
//#endregion
//#region packages/gateway-protocol/src/index.ts
const validateCommandsListParams = require_schema.lazyCompile(require_schema.CommandsListParamsSchema);
const validateConnectParams = require_schema.lazyCompile(require_schema.ConnectParamsSchema);
const validateWorkerAdmissionHandshake = require_schema.lazyCompile(require_worker_admission.WorkerAdmissionHandshakeSchema);
const validateWorkerConnectRequestFrame = require_schema.lazyCompile(require_worker_admission.WorkerConnectRequestFrameSchema);
const validateWorkerHeartbeatParams = require_schema.lazyCompile(require_worker_admission.WorkerHeartbeatParamsSchema);
function checkWorkerProtocolJson(data) {
	const stack = [{
		depth: 0,
		value: data
	}];
	const seen = /* @__PURE__ */ new WeakSet();
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) break;
		if (current.depth > 32) return {
			keyword: "maxDepth",
			params: { limit: 32 },
			message: `must not exceed JSON nesting depth 32`
		};
		if (current.value === null || typeof current.value === "string" || typeof current.value === "boolean") continue;
		if (typeof current.value === "number") {
			if (!Number.isFinite(current.value)) return {
				keyword: "finite",
				message: "must contain only finite JSON numbers"
			};
			continue;
		}
		if (typeof current.value !== "object") return {
			keyword: "jsonValue",
			message: "must contain only JSON values"
		};
		if (seen.has(current.value)) return {
			keyword: "acyclic",
			message: "must be an acyclic JSON value"
		};
		seen.add(current.value);
		const values = Array.isArray(current.value) ? current.value : Object.values(current.value);
		for (const value of values) stack.push({
			depth: current.depth + 1,
			value
		});
	}
}
const validateWorkerTranscriptCommitParams = require_schema.lazyCompile(require_worker_admission.WorkerTranscriptCommitParamsSchema, checkWorkerProtocolJson);
const validateWorkerLiveEventParams = require_schema.lazyCompile(require_worker_admission.WorkerLiveEventParamsSchema, checkWorkerProtocolJson);
const validateGatewaySuspendPrepareParams = require_schema.lazyCompile(require_schema.GatewaySuspendPrepareParamsSchema);
require_schema.lazyCompile(require_schema.GatewaySuspendPrepareResultSchema);
const validateGatewaySuspendStatusParams = require_schema.lazyCompile(require_schema.GatewaySuspendStatusParamsSchema);
require_schema.lazyCompile(require_schema.GatewaySuspendStatusResultSchema);
const validateGatewaySuspendResumeParams = require_schema.lazyCompile(require_schema.GatewaySuspendResumeParamsSchema);
require_schema.lazyCompile(require_schema.GatewaySuspendResumeResultSchema);
const validateRequestFrame = require_schema.lazyCompile(require_schema.RequestFrameSchema);
require_schema.lazyCompile(require_schema.ResponseFrameSchema);
require_schema.lazyCompile(require_schema.EventFrameSchema);
const validateMessageActionParams = require_schema.lazyCompile(require_schema.MessageActionParamsSchema);
const validateSendParams = require_schema.lazyCompile(require_schema.SendParamsSchema);
const validatePollParams = require_schema.lazyCompile(require_schema.PollParamsSchema);
const validateAgentParams = require_schema.lazyCompile(require_schema.AgentParamsSchema);
const validateAuditActivityListParams = require_schema.lazyCompile(require_schema.AuditActivityListParamsSchema);
const validateAuditListParams = require_schema.lazyCompile(require_schema.AuditListParamsSchema);
const validateAgentIdentityParams = require_schema.lazyCompile(require_schema.AgentIdentityParamsSchema);
const validateAgentWaitParams = require_schema.lazyCompile(require_schema.AgentWaitParamsSchema);
const validateWakeParams = require_schema.lazyCompile(require_schema.WakeParamsSchema);
const validateAgentsListParams = require_schema.lazyCompile(require_schema.AgentsListParamsSchema);
const validateWorktreesListParams = require_schema.lazyCompile(require_schema.WorktreesListParamsSchema);
const validateWorktreesCreateParams = require_schema.lazyCompile(require_schema.WorktreesCreateParamsSchema);
const validateWorktreesRemoveParams = require_schema.lazyCompile(require_schema.WorktreesRemoveParamsSchema);
const validateWorktreesRestoreParams = require_schema.lazyCompile(require_schema.WorktreesRestoreParamsSchema);
const validateWorktreesGcParams = require_schema.lazyCompile(require_schema.WorktreesGcParamsSchema);
const validateWorktreesBranchesParams = require_schema.lazyCompile(require_schema.WorktreesBranchesParamsSchema);
const validateFsListDirParams = require_schema.lazyCompile(require_schema.FsListDirParamsSchema);
const validateFsListDirResult = require_schema.lazyCompile(require_schema.FsListDirResultSchema);
const validateAgentsCreateParams = require_schema.lazyCompile(require_schema.AgentsCreateParamsSchema);
const validateAgentsUpdateParams = require_schema.lazyCompile(require_schema.AgentsUpdateParamsSchema);
const validateAgentsDeleteParams = require_schema.lazyCompile(require_schema.AgentsDeleteParamsSchema);
const validateAgentsFilesListParams = require_schema.lazyCompile(require_schema.AgentsFilesListParamsSchema);
const validateAgentsFilesGetParams = require_schema.lazyCompile(require_schema.AgentsFilesGetParamsSchema);
const validateAgentsFilesSetParams = require_schema.lazyCompile(require_schema.AgentsFilesSetParamsSchema);
const validateAgentsWorkspaceListParams = require_schema.lazyCompile(require_schema.AgentsWorkspaceListParamsSchema);
const validateAgentsWorkspaceGetParams = require_schema.lazyCompile(require_schema.AgentsWorkspaceGetParamsSchema);
const validateArtifactsListParams = require_schema.lazyCompile(require_schema.ArtifactsListParamsSchema);
const validateArtifactsGetParams = require_schema.lazyCompile(require_schema.ArtifactsGetParamsSchema);
const validateArtifactsDownloadParams = require_schema.lazyCompile(require_schema.ArtifactsDownloadParamsSchema);
const validateNodePairListParams = require_schema.lazyCompile(require_schema.NodePairListParamsSchema);
const validateNodePairApproveParams = require_schema.lazyCompile(require_schema.NodePairApproveParamsSchema);
const validateNodePairRejectParams = require_schema.lazyCompile(require_schema.NodePairRejectParamsSchema);
const validateNodePairRemoveParams = require_schema.lazyCompile(require_schema.NodePairRemoveParamsSchema);
const validateNodeRenameParams = require_schema.lazyCompile(require_schema.NodeRenameParamsSchema);
const validateNodeListParams = require_schema.lazyCompile(require_schema.NodeListParamsSchema);
const validateNodePluginToolsUpdateParams = require_schema.lazyCompile(require_schema.NodePluginToolsUpdateParamsSchema);
const validateNodeSkillsUpdateParams = require_schema.lazyCompile(require_schema.NodeSkillsUpdateParamsSchema);
const validateEnvironmentsCreateParams = require_schema.lazyCompile(require_schema.EnvironmentsCreateParamsSchema);
const validateEnvironmentsDestroyParams = require_schema.lazyCompile(require_schema.EnvironmentsDestroyParamsSchema);
const validateEnvironmentsListParams = require_schema.lazyCompile(require_schema.EnvironmentsListParamsSchema);
const validateEnvironmentsStatusParams = require_schema.lazyCompile(require_schema.EnvironmentsStatusParamsSchema);
const validateSystemInfoParams = require_schema.lazyCompile(require_schema.SystemInfoParamsSchema);
require_schema.lazyCompile(require_schema.SystemInfoResultSchema);
const validateNodePendingAckParams = require_schema.lazyCompile(require_schema.NodePendingAckParamsSchema);
const validateNodeDescribeParams = require_schema.lazyCompile(require_schema.NodeDescribeParamsSchema);
const validateNodeInvokeParams = require_schema.lazyCompile(require_schema.NodeInvokeParamsSchema);
require_schema.lazyCompile(require_schema.NodeInvokeInputEventSchema);
const validateNodeInvokeResultParams = require_schema.lazyCompile(require_schema.NodeInvokeResultParamsSchema);
const validateNodeInvokeProgressParams = require_schema.lazyCompile(require_schema.NodeInvokeProgressParamsSchema);
const validateNodeEventParams = require_schema.lazyCompile(require_schema.NodeEventParamsSchema);
require_schema.lazyCompile(require_schema.NodeEventResultSchema);
require_schema.lazyCompile(require_schema.NodePresenceAlivePayloadSchema);
const validateNodePresenceActivityPayload = require_schema.lazyCompile(require_schema.NodePresenceActivityPayloadSchema);
const validateNodePendingDrainParams = require_schema.lazyCompile(require_schema.NodePendingDrainParamsSchema);
const validateNodePendingEnqueueParams = require_schema.lazyCompile(require_schema.NodePendingEnqueueParamsSchema);
const validatePushTestParams = require_schema.lazyCompile(require_schema.PushTestParamsSchema);
const validateWebPushVapidPublicKeyParams = require_schema.lazyCompile(require_schema.WebPushVapidPublicKeyParamsSchema);
const validateWebPushSubscribeParams = require_schema.lazyCompile(require_schema.WebPushSubscribeParamsSchema);
const validateWebPushUnsubscribeParams = require_schema.lazyCompile(require_schema.WebPushUnsubscribeParamsSchema);
const validateWebPushTestParams = require_schema.lazyCompile(require_schema.WebPushTestParamsSchema);
const validateSecretsResolveParams = require_schema.lazyCompile(require_schema.SecretsResolveParamsSchema);
const validateSecretsResolveResult = require_schema.lazyCompile(require_schema.SecretsResolveResultSchema);
const validateSessionsListParams = require_schema.lazyCompile(require_schema.SessionsListParamsSchema);
const validateSessionsCatalogListParams = require_schema.lazyCompile(require_schema.SessionsCatalogListParamsSchema);
const validateSessionsCatalogReadParams = require_schema.lazyCompile(require_schema.SessionsCatalogReadParamsSchema);
const validateSessionsCatalogContinueParams = require_schema.lazyCompile(require_schema.SessionsCatalogContinueParamsSchema);
const validateSessionsCatalogArchiveParams = require_schema.lazyCompile(require_schema.SessionsCatalogArchiveParamsSchema);
const validateSessionsSearchParams = require_schema.lazyCompile(require_schema.SessionsSearchParamsSchema);
require_schema.lazyCompile(require_schema.SessionsSearchResultSchema);
const validateSessionsCleanupParams = require_schema.lazyCompile(require_schema.SessionsCleanupParamsSchema);
const validateSessionsPreviewParams = require_schema.lazyCompile(require_schema.SessionsPreviewParamsSchema);
const validateSessionsDescribeParams = require_schema.lazyCompile(require_schema.SessionsDescribeParamsSchema);
const validateSessionsResolveParams = require_schema.lazyCompile(require_schema.SessionsResolveParamsSchema);
const validateSessionsFilesListParams = require_schema.lazyCompile(require_schema.SessionsFilesListParamsSchema);
const validateSessionsFilesGetParams = require_schema.lazyCompile(require_schema.SessionsFilesGetParamsSchema);
const validateSessionsFilesSetParams = require_schema.lazyCompile(require_schema.SessionsFilesSetParamsSchema);
const validateSessionsDiffParams = require_schema.lazyCompile(require_schema.SessionsDiffParamsSchema);
const validateSessionsCreateParams = require_schema.lazyCompile(require_schema.SessionsCreateParamsSchema);
const validateSessionsSendParams = require_schema.lazyCompile(require_schema.SessionsSendParamsSchema);
const validateSessionsDispatchParams = require_schema.lazyCompile(require_schema.SessionsDispatchParamsSchema);
require_schema.lazyCompile(require_schema.SessionsDispatchResultSchema);
const validateSessionsReclaimParams = require_schema.lazyCompile(require_schema.SessionsReclaimParamsSchema);
require_schema.lazyCompile(require_schema.SessionsReclaimResultSchema);
const validateSessionsMessagesSubscribeParams = require_schema.lazyCompile(require_schema.SessionsMessagesSubscribeParamsSchema);
const validateSessionsMessagesUnsubscribeParams = require_schema.lazyCompile(require_schema.SessionsMessagesUnsubscribeParamsSchema);
const validateSessionsAbortParams = require_schema.lazyCompile(require_schema.SessionsAbortParamsSchema);
const validateSessionsPatchParams = require_schema.lazyCompile(require_schema.SessionsPatchParamsSchema);
const validateSessionsPluginPatchParams = require_schema.lazyCompile(require_schema.SessionsPluginPatchParamsSchema);
const validateSessionsResetParams = require_schema.lazyCompile(require_schema.SessionsResetParamsSchema);
const validateSessionsDeleteParams = require_schema.lazyCompile(require_schema.SessionsDeleteParamsSchema);
const validateSessionsGroupsListParams = require_schema.lazyCompile(require_schema.SessionsGroupsListParamsSchema);
const validateSessionsGroupsPutParams = require_schema.lazyCompile(require_schema.SessionsGroupsPutParamsSchema);
const validateSessionsGroupsRenameParams = require_schema.lazyCompile(require_schema.SessionsGroupsRenameParamsSchema);
const validateSessionsGroupsDeleteParams = require_schema.lazyCompile(require_schema.SessionsGroupsDeleteParamsSchema);
const validateSessionsCompactParams = require_schema.lazyCompile(require_schema.SessionsCompactParamsSchema);
const validateSessionsCompactionListParams = require_schema.lazyCompile(require_schema.SessionsCompactionListParamsSchema);
const validateSessionsCompactionGetParams = require_schema.lazyCompile(require_schema.SessionsCompactionGetParamsSchema);
const validateSessionsCompactionBranchParams = require_schema.lazyCompile(require_schema.SessionsCompactionBranchParamsSchema);
const validateSessionsCompactionRestoreParams = require_schema.lazyCompile(require_schema.SessionsCompactionRestoreParamsSchema);
const validateSessionsUsageParams = require_schema.lazyCompile(require_schema.SessionsUsageParamsSchema);
const validateTaskSuggestionsListParams = require_schema.lazyCompile(require_schema.TaskSuggestionsListParamsSchema);
const validateTaskSuggestionsCreateParams = require_schema.lazyCompile(require_schema.TaskSuggestionsCreateParamsSchema);
const validateTaskSuggestionsAcceptParams = require_schema.lazyCompile(require_schema.TaskSuggestionsAcceptParamsSchema);
const validateTaskSuggestionsDismissParams = require_schema.lazyCompile(require_schema.TaskSuggestionsDismissParamsSchema);
const validateTasksListParams = require_schema.lazyCompile(require_schema.TasksListParamsSchema);
const validateTasksGetParams = require_schema.lazyCompile(require_schema.TasksGetParamsSchema);
const validateTasksCancelParams = require_schema.lazyCompile(require_schema.TasksCancelParamsSchema);
const validateConfigGetParams = require_schema.lazyCompile(require_schema.ConfigGetParamsSchema);
const validateConfigSetParams = require_schema.lazyCompile(require_schema.ConfigSetParamsSchema);
const validateConfigApplyParams = require_schema.lazyCompile(require_schema.ConfigApplyParamsSchema);
const validateConfigPatchParams = require_schema.lazyCompile(require_schema.ConfigPatchParamsSchema);
const validateConfigSchemaParams = require_schema.lazyCompile(require_schema.ConfigSchemaParamsSchema);
const validateConfigSchemaLookupParams = require_schema.lazyCompile(require_schema.ConfigSchemaLookupParamsSchema);
const validateConfigSchemaLookupResult = require_schema.lazyCompile(require_schema.ConfigSchemaLookupResultSchema);
const validateSystemAgentChatParams = require_schema.lazyCompile(require_schema.SystemAgentChatParamsSchema);
const validateSystemAgentSetupDetectParams = require_schema.lazyCompile(require_schema.SystemAgentSetupDetectParamsSchema);
const validateSystemAgentSetupVerifyParams = require_schema.lazyCompile(require_schema.SystemAgentSetupVerifyParamsSchema);
const validateSystemAgentSetupActivateParams = require_schema.lazyCompile(require_schema.SystemAgentSetupActivateParamsSchema);
const validateSystemAgentSetupAuthStartParams = require_schema.lazyCompile(require_schema.SystemAgentSetupAuthStartParamsSchema);
const validateWizardStartParams = require_schema.lazyCompile(require_schema.WizardStartParamsSchema);
const validateWizardNextParams = require_schema.lazyCompile(require_schema.WizardNextParamsSchema);
const validateWizardCancelParams = require_schema.lazyCompile(require_schema.WizardCancelParamsSchema);
const validateWizardStatusParams = require_schema.lazyCompile(require_schema.WizardStatusParamsSchema);
const validateTalkModeParams = require_schema.lazyCompile(require_schema.TalkModeParamsSchema);
require_schema.lazyCompile(require_schema.TalkEventSchema);
const validateTalkCatalogParams = require_schema.lazyCompile(require_schema.TalkCatalogParamsSchema);
require_schema.lazyCompile(require_schema.TalkCatalogResultSchema);
const validateTalkConfigParams = require_schema.lazyCompile(require_schema.TalkConfigParamsSchema);
require_schema.lazyCompile(require_schema.TalkConfigResultSchema);
const validateTalkClientCreateParams = require_schema.lazyCompile(require_schema.TalkClientCreateParamsSchema);
require_schema.lazyCompile(require_schema.TalkClientCreateResultSchema);
const validateTalkClientToolCallParams = require_schema.lazyCompile(require_schema.TalkClientToolCallParamsSchema);
require_schema.lazyCompile(require_schema.TalkClientToolCallResultSchema);
const validateTalkClientSteerParams = require_schema.lazyCompile(require_schema.TalkClientSteerParamsSchema);
require_schema.lazyCompile(require_schema.TalkAgentControlResultSchema);
const validateTalkSessionCreateParams = require_schema.lazyCompile(require_schema.TalkSessionCreateParamsSchema);
require_schema.lazyCompile(require_schema.TalkSessionCreateResultSchema);
const validateTalkSessionJoinParams = require_schema.lazyCompile(require_schema.TalkSessionJoinParamsSchema);
require_schema.lazyCompile(require_schema.TalkSessionJoinResultSchema);
const validateTalkSessionAppendAudioParams = require_schema.lazyCompile(require_schema.TalkSessionAppendAudioParamsSchema);
const validateTalkSessionAcknowledgeMarkParams = require_schema.lazyCompile(require_schema.TalkSessionAcknowledgeMarkParamsSchema);
const validateTalkSessionTurnParams = require_schema.lazyCompile(require_schema.TalkSessionTurnParamsSchema);
const validateTalkSessionCancelTurnParams = require_schema.lazyCompile(require_schema.TalkSessionCancelTurnParamsSchema);
const validateTalkSessionCancelOutputParams = require_schema.lazyCompile(require_schema.TalkSessionCancelOutputParamsSchema);
require_schema.lazyCompile(require_schema.TalkSessionTurnResultSchema);
const validateTalkSessionSteerParams = require_schema.lazyCompile(require_schema.TalkSessionSteerParamsSchema);
const validateTalkSessionSubmitToolResultParams = require_schema.lazyCompile(require_schema.TalkSessionSubmitToolResultParamsSchema);
const validateTalkSessionCloseParams = require_schema.lazyCompile(require_schema.TalkSessionCloseParamsSchema);
require_schema.lazyCompile(require_schema.TalkSessionOkResultSchema);
const validateTalkSpeakParams = require_schema.lazyCompile(require_schema.TalkSpeakParamsSchema);
require_schema.lazyCompile(require_schema.TalkSpeakResultSchema);
const validateTtsSpeakParams = require_schema.lazyCompile(require_schema.TtsSpeakParamsSchema);
require_schema.lazyCompile(require_schema.TtsSpeakResultSchema);
const validateChannelsStatusParams = require_schema.lazyCompile(require_schema.ChannelsStatusParamsSchema);
const validateChannelsStartParams = require_schema.lazyCompile(require_schema.ChannelsStartParamsSchema);
const validateChannelsStopParams = require_schema.lazyCompile(require_schema.ChannelsStopParamsSchema);
const validateChannelsLogoutParams = require_schema.lazyCompile(require_schema.ChannelsLogoutParamsSchema);
const validateModelsListParams = require_schema.lazyCompile(require_schema.ModelsListParamsSchema);
const validateSkillsStatusParams = require_schema.lazyCompile(require_schema.SkillsStatusParamsSchema);
const validateToolsCatalogParams = require_schema.lazyCompile(require_schema.ToolsCatalogParamsSchema);
const validateToolsEffectiveParams = require_schema.lazyCompile(require_schema.ToolsEffectiveParamsSchema);
const validateToolsInvokeParams = require_schema.lazyCompile(require_schema.ToolsInvokeParamsSchema);
const validateSkillsBinsParams = require_schema.lazyCompile(require_schema.SkillsBinsParamsSchema);
const validateSkillsInstallParams = require_schema.lazyCompile(require_schema.SkillsInstallParamsSchema);
const validateSkillsUploadBeginParams = require_schema.lazyCompile(require_schema.SkillsUploadBeginParamsSchema);
const validateSkillsUploadChunkParams = require_schema.lazyCompile(require_schema.SkillsUploadChunkParamsSchema);
const validateSkillsUploadCommitParams = require_schema.lazyCompile(require_schema.SkillsUploadCommitParamsSchema);
const validateSkillsUpdateParams = require_schema.lazyCompile(require_schema.SkillsUpdateParamsSchema);
const validateSkillsSearchParams = require_schema.lazyCompile(require_schema.SkillsSearchParamsSchema);
const validateSkillsDetailParams = require_schema.lazyCompile(require_schema.SkillsDetailParamsSchema);
const validateSkillsCuratorStatusParams = require_schema.lazyCompile(require_schema.SkillsCuratorStatusParamsSchema);
const validateSkillsCuratorActionParams = require_schema.lazyCompile(require_schema.SkillsCuratorActionParamsSchema);
const validateSkillsProposalsListParams = require_schema.lazyCompile(require_schema.SkillsProposalsListParamsSchema);
const validateSkillsProposalInspectParams = require_schema.lazyCompile(require_schema.SkillsProposalInspectParamsSchema);
const validateSkillsProposalCreateParams = require_schema.lazyCompile(require_schema.SkillsProposalCreateParamsSchema);
const validateSkillsProposalUpdateParams = require_schema.lazyCompile(require_schema.SkillsProposalUpdateParamsSchema);
const validateSkillsProposalReviseParams = require_schema.lazyCompile(require_schema.SkillsProposalReviseParamsSchema);
const validateSkillsProposalRequestRevisionParams = require_schema.lazyCompile(require_schema.SkillsProposalRequestRevisionParamsSchema);
const validateSkillsProposalActionParams = require_schema.lazyCompile(require_schema.SkillsProposalActionParamsSchema);
const validateSkillsSecurityVerdictsParams = require_schema.lazyCompile(require_schema.SkillsSecurityVerdictsParamsSchema);
const validateSkillsSkillCardParams = require_schema.lazyCompile(require_schema.SkillsSkillCardParamsSchema);
const validateCronListParams = require_schema.lazyCompile(require_schema.CronListParamsSchema);
const validateCronStatusParams = require_schema.lazyCompile(require_schema.CronStatusParamsSchema);
const validateCronGetParams = require_schema.lazyCompile(require_schema.CronGetParamsSchema);
const validateCronAddParams = require_schema.lazyCompile(require_schema.CronAddParamsSchema);
const validateCronUpdateParams = require_schema.lazyCompile(require_schema.CronUpdateParamsSchema);
const validateCronRemoveParams = require_schema.lazyCompile(require_schema.CronRemoveParamsSchema);
const validateCronRunParams = require_schema.lazyCompile(require_schema.CronRunParamsSchema);
const validateCronRunsParams = require_schema.lazyCompile(require_schema.CronRunsParamsSchema);
const validateDevicePairListParams = require_schema.lazyCompile(require_schema.DevicePairListParamsSchema);
const validateDevicePairApproveParams = require_schema.lazyCompile(require_schema.DevicePairApproveParamsSchema);
const validateDevicePairRejectParams = require_schema.lazyCompile(require_schema.DevicePairRejectParamsSchema);
const validateDevicePairRemoveParams = require_schema.lazyCompile(require_schema.DevicePairRemoveParamsSchema);
const validateDevicePairSetupCodeParams = require_schema.lazyCompile(require_schema.DevicePairSetupCodeParamsSchema);
const validateDevicePairRenameParams = require_schema.lazyCompile(require_schema.DevicePairRenameParamsSchema);
const validateDeviceTokenRotateParams = require_schema.lazyCompile(require_schema.DeviceTokenRotateParamsSchema);
const validateDeviceTokenRevokeParams = require_schema.lazyCompile(require_schema.DeviceTokenRevokeParamsSchema);
require_schema.lazyCompile(require_schema.ApprovalKindSchema);
require_schema.lazyCompile(require_schema.ApprovalDecisionSchema);
require_schema.lazyCompile(require_schema.ApprovalAllowDecisionSchema);
require_schema.lazyCompile(require_schema.ApprovalTerminalReasonSchema);
require_schema.lazyCompile(require_schema.PluginApprovalSeveritySchema);
require_schema.lazyCompile(require_schema.ExecApprovalPresentationSchema);
require_schema.lazyCompile(require_schema.PluginApprovalPresentationSchema);
const validateApprovalPresentation = require_schema.lazyCompile(require_schema.ApprovalPresentationSchema);
require_schema.lazyCompile(require_schema.PendingApprovalSnapshotSchema);
require_schema.lazyCompile(require_schema.AllowedApprovalSnapshotSchema);
require_schema.lazyCompile(require_schema.DeniedApprovalSnapshotSchema);
require_schema.lazyCompile(require_schema.ExpiredApprovalSnapshotSchema);
require_schema.lazyCompile(require_schema.CancelledApprovalSnapshotSchema);
require_schema.lazyCompile(require_schema.ApprovalSnapshotSchema);
require_schema.lazyCompile(require_schema.TerminalApprovalSnapshotSchema);
const validateApprovalGetParams = require_schema.lazyCompile(require_schema.ApprovalGetParamsSchema);
const validateApprovalResolveParams = require_schema.lazyCompile(require_schema.ApprovalResolveParamsSchema);
const validateExecApprovalsGetParams = require_schema.lazyCompile(require_schema.ExecApprovalsGetParamsSchema);
const validateExecApprovalsSetParams = require_schema.lazyCompile(require_schema.ExecApprovalsSetParamsSchema);
const validateExecApprovalGetParams = require_schema.lazyCompile(require_schema.ExecApprovalGetParamsSchema);
const validateExecApprovalRequestParams = require_schema.lazyCompile(require_schema.ExecApprovalRequestParamsSchema);
const validateExecApprovalResolveParams = require_schema.lazyCompile(require_schema.ExecApprovalResolveParamsSchema);
const validatePluginApprovalRequestParams = require_schema.lazyCompile(require_schema.PluginApprovalRequestParamsSchema);
const validatePluginApprovalResolveParams = require_schema.lazyCompile(require_schema.PluginApprovalResolveParamsSchema);
const validatePluginsListParams = require_schema.lazyCompile(require_schema.PluginsListParamsSchema);
require_schema.lazyCompile(require_schema.PluginsListResultSchema);
const validatePluginsSearchParams = require_schema.lazyCompile(require_schema.PluginsSearchParamsSchema);
require_schema.lazyCompile(require_schema.PluginsSearchResultSchema);
const validatePluginsInstallParams = require_schema.lazyCompile(require_schema.PluginsInstallParamsSchema);
require_schema.lazyCompile(require_schema.PluginsInstallResultSchema);
const validatePluginsSetEnabledParams = require_schema.lazyCompile(require_schema.PluginsSetEnabledParamsSchema);
require_schema.lazyCompile(require_schema.PluginsSetEnabledResultSchema);
const validatePluginsUninstallParams = require_schema.lazyCompile(require_schema.PluginsUninstallParamsSchema);
require_schema.lazyCompile(require_schema.PluginsUninstallResultSchema);
const validatePluginsUiDescriptorsParams = require_schema.lazyCompile(require_schema.PluginsUiDescriptorsParamsSchema);
const validatePluginsUiDescriptorsResult = require_schema.lazyCompile(require_schema.PluginsUiDescriptorsResultSchema);
const validatePluginsSessionActionParams = require_schema.lazyCompile(require_schema.PluginsSessionActionParamsSchema);
const validatePluginsSessionActionResult = require_schema.lazyCompile(require_schema.PluginsSessionActionResultSchema);
const validateExecApprovalsNodeGetParams = require_schema.lazyCompile(require_schema.ExecApprovalsNodeGetParamsSchema);
const validateExecApprovalsNodeSetParams = require_schema.lazyCompile(require_schema.ExecApprovalsNodeSetParamsSchema);
const validateExecApprovalsNodeSnapshot = require_schema.lazyCompile(require_schema.ExecApprovalsNodeSnapshotSchema);
const validateLogsTailParams = require_schema.lazyCompile(require_schema.LogsTailParamsSchema);
const validateModelsProbeParams = require_schema.lazyCompile(require_schema.ModelsProbeParamsSchema);
const validateChatHistoryParams = require_schema.lazyCompile(require_schema.ChatHistoryParamsSchema);
const validateChatMetadataParams = require_schema.lazyCompile(require_schema.ChatMetadataParamsSchema);
const validateChatMessageGetParams = require_schema.lazyCompile(require_schema.ChatMessageGetParamsSchema);
const validateChatToolTitlesParams = require_schema.lazyCompile(require_schema.ChatToolTitlesParamsSchema);
const validateChatSendParams = require_schema.lazyCompile(require_schema.ChatSendParamsSchema);
const validateChatAbortParams = require_schema.lazyCompile(require_schema.ChatAbortParamsSchema);
const validateChatInjectParams = require_schema.lazyCompile(require_schema.ChatInjectParamsSchema);
require_schema.lazyCompile(require_schema.ChatEventSchema);
require_schema.lazyCompile(require_schema.ChatMessageGetResultSchema);
const validateUpdateStatusParams = require_schema.lazyCompile(require_schema.UpdateStatusParamsSchema);
const validateUpdateRunParams = require_schema.lazyCompile(require_schema.UpdateRunParamsSchema);
const validateWebLoginStartParams = require_schema.lazyCompile(require_schema.WebLoginStartParamsSchema);
const validateWebLoginWaitParams = require_schema.lazyCompile(require_schema.WebLoginWaitParamsSchema);
//#endregion
Object.defineProperty(exports, "validateAgentIdentityParams", {
	enumerable: true,
	get: function() {
		return validateAgentIdentityParams;
	}
});
Object.defineProperty(exports, "validateAgentParams", {
	enumerable: true,
	get: function() {
		return validateAgentParams;
	}
});
Object.defineProperty(exports, "validateAgentWaitParams", {
	enumerable: true,
	get: function() {
		return validateAgentWaitParams;
	}
});
Object.defineProperty(exports, "validateAgentsCreateParams", {
	enumerable: true,
	get: function() {
		return validateAgentsCreateParams;
	}
});
Object.defineProperty(exports, "validateAgentsDeleteParams", {
	enumerable: true,
	get: function() {
		return validateAgentsDeleteParams;
	}
});
Object.defineProperty(exports, "validateAgentsFilesGetParams", {
	enumerable: true,
	get: function() {
		return validateAgentsFilesGetParams;
	}
});
Object.defineProperty(exports, "validateAgentsFilesListParams", {
	enumerable: true,
	get: function() {
		return validateAgentsFilesListParams;
	}
});
Object.defineProperty(exports, "validateAgentsFilesSetParams", {
	enumerable: true,
	get: function() {
		return validateAgentsFilesSetParams;
	}
});
Object.defineProperty(exports, "validateAgentsListParams", {
	enumerable: true,
	get: function() {
		return validateAgentsListParams;
	}
});
Object.defineProperty(exports, "validateAgentsUpdateParams", {
	enumerable: true,
	get: function() {
		return validateAgentsUpdateParams;
	}
});
Object.defineProperty(exports, "validateAgentsWorkspaceGetParams", {
	enumerable: true,
	get: function() {
		return validateAgentsWorkspaceGetParams;
	}
});
Object.defineProperty(exports, "validateAgentsWorkspaceListParams", {
	enumerable: true,
	get: function() {
		return validateAgentsWorkspaceListParams;
	}
});
Object.defineProperty(exports, "validateApprovalGetParams", {
	enumerable: true,
	get: function() {
		return validateApprovalGetParams;
	}
});
Object.defineProperty(exports, "validateApprovalPresentation", {
	enumerable: true,
	get: function() {
		return validateApprovalPresentation;
	}
});
Object.defineProperty(exports, "validateApprovalResolveParams", {
	enumerable: true,
	get: function() {
		return validateApprovalResolveParams;
	}
});
Object.defineProperty(exports, "validateArtifactsDownloadParams", {
	enumerable: true,
	get: function() {
		return validateArtifactsDownloadParams;
	}
});
Object.defineProperty(exports, "validateArtifactsGetParams", {
	enumerable: true,
	get: function() {
		return validateArtifactsGetParams;
	}
});
Object.defineProperty(exports, "validateArtifactsListParams", {
	enumerable: true,
	get: function() {
		return validateArtifactsListParams;
	}
});
Object.defineProperty(exports, "validateAuditActivityListParams", {
	enumerable: true,
	get: function() {
		return validateAuditActivityListParams;
	}
});
Object.defineProperty(exports, "validateAuditListParams", {
	enumerable: true,
	get: function() {
		return validateAuditListParams;
	}
});
Object.defineProperty(exports, "validateChannelsLogoutParams", {
	enumerable: true,
	get: function() {
		return validateChannelsLogoutParams;
	}
});
Object.defineProperty(exports, "validateChannelsStartParams", {
	enumerable: true,
	get: function() {
		return validateChannelsStartParams;
	}
});
Object.defineProperty(exports, "validateChannelsStatusParams", {
	enumerable: true,
	get: function() {
		return validateChannelsStatusParams;
	}
});
Object.defineProperty(exports, "validateChannelsStopParams", {
	enumerable: true,
	get: function() {
		return validateChannelsStopParams;
	}
});
Object.defineProperty(exports, "validateChatAbortParams", {
	enumerable: true,
	get: function() {
		return validateChatAbortParams;
	}
});
Object.defineProperty(exports, "validateChatHistoryParams", {
	enumerable: true,
	get: function() {
		return validateChatHistoryParams;
	}
});
Object.defineProperty(exports, "validateChatInjectParams", {
	enumerable: true,
	get: function() {
		return validateChatInjectParams;
	}
});
Object.defineProperty(exports, "validateChatMessageGetParams", {
	enumerable: true,
	get: function() {
		return validateChatMessageGetParams;
	}
});
Object.defineProperty(exports, "validateChatMetadataParams", {
	enumerable: true,
	get: function() {
		return validateChatMetadataParams;
	}
});
Object.defineProperty(exports, "validateChatSendParams", {
	enumerable: true,
	get: function() {
		return validateChatSendParams;
	}
});
Object.defineProperty(exports, "validateChatToolTitlesParams", {
	enumerable: true,
	get: function() {
		return validateChatToolTitlesParams;
	}
});
Object.defineProperty(exports, "validateCommandsListParams", {
	enumerable: true,
	get: function() {
		return validateCommandsListParams;
	}
});
Object.defineProperty(exports, "validateConfigApplyParams", {
	enumerable: true,
	get: function() {
		return validateConfigApplyParams;
	}
});
Object.defineProperty(exports, "validateConfigGetParams", {
	enumerable: true,
	get: function() {
		return validateConfigGetParams;
	}
});
Object.defineProperty(exports, "validateConfigPatchParams", {
	enumerable: true,
	get: function() {
		return validateConfigPatchParams;
	}
});
Object.defineProperty(exports, "validateConfigSchemaLookupParams", {
	enumerable: true,
	get: function() {
		return validateConfigSchemaLookupParams;
	}
});
Object.defineProperty(exports, "validateConfigSchemaLookupResult", {
	enumerable: true,
	get: function() {
		return validateConfigSchemaLookupResult;
	}
});
Object.defineProperty(exports, "validateConfigSchemaParams", {
	enumerable: true,
	get: function() {
		return validateConfigSchemaParams;
	}
});
Object.defineProperty(exports, "validateConfigSetParams", {
	enumerable: true,
	get: function() {
		return validateConfigSetParams;
	}
});
Object.defineProperty(exports, "validateConnectParams", {
	enumerable: true,
	get: function() {
		return validateConnectParams;
	}
});
Object.defineProperty(exports, "validateCronAddParams", {
	enumerable: true,
	get: function() {
		return validateCronAddParams;
	}
});
Object.defineProperty(exports, "validateCronGetParams", {
	enumerable: true,
	get: function() {
		return validateCronGetParams;
	}
});
Object.defineProperty(exports, "validateCronListParams", {
	enumerable: true,
	get: function() {
		return validateCronListParams;
	}
});
Object.defineProperty(exports, "validateCronRemoveParams", {
	enumerable: true,
	get: function() {
		return validateCronRemoveParams;
	}
});
Object.defineProperty(exports, "validateCronRunParams", {
	enumerable: true,
	get: function() {
		return validateCronRunParams;
	}
});
Object.defineProperty(exports, "validateCronRunsParams", {
	enumerable: true,
	get: function() {
		return validateCronRunsParams;
	}
});
Object.defineProperty(exports, "validateCronStatusParams", {
	enumerable: true,
	get: function() {
		return validateCronStatusParams;
	}
});
Object.defineProperty(exports, "validateCronUpdateParams", {
	enumerable: true,
	get: function() {
		return validateCronUpdateParams;
	}
});
Object.defineProperty(exports, "validateDevicePairApproveParams", {
	enumerable: true,
	get: function() {
		return validateDevicePairApproveParams;
	}
});
Object.defineProperty(exports, "validateDevicePairListParams", {
	enumerable: true,
	get: function() {
		return validateDevicePairListParams;
	}
});
Object.defineProperty(exports, "validateDevicePairRejectParams", {
	enumerable: true,
	get: function() {
		return validateDevicePairRejectParams;
	}
});
Object.defineProperty(exports, "validateDevicePairRemoveParams", {
	enumerable: true,
	get: function() {
		return validateDevicePairRemoveParams;
	}
});
Object.defineProperty(exports, "validateDevicePairRenameParams", {
	enumerable: true,
	get: function() {
		return validateDevicePairRenameParams;
	}
});
Object.defineProperty(exports, "validateDevicePairSetupCodeParams", {
	enumerable: true,
	get: function() {
		return validateDevicePairSetupCodeParams;
	}
});
Object.defineProperty(exports, "validateDeviceTokenRevokeParams", {
	enumerable: true,
	get: function() {
		return validateDeviceTokenRevokeParams;
	}
});
Object.defineProperty(exports, "validateDeviceTokenRotateParams", {
	enumerable: true,
	get: function() {
		return validateDeviceTokenRotateParams;
	}
});
Object.defineProperty(exports, "validateEnvironmentsCreateParams", {
	enumerable: true,
	get: function() {
		return validateEnvironmentsCreateParams;
	}
});
Object.defineProperty(exports, "validateEnvironmentsDestroyParams", {
	enumerable: true,
	get: function() {
		return validateEnvironmentsDestroyParams;
	}
});
Object.defineProperty(exports, "validateEnvironmentsListParams", {
	enumerable: true,
	get: function() {
		return validateEnvironmentsListParams;
	}
});
Object.defineProperty(exports, "validateEnvironmentsStatusParams", {
	enumerable: true,
	get: function() {
		return validateEnvironmentsStatusParams;
	}
});
Object.defineProperty(exports, "validateExecApprovalGetParams", {
	enumerable: true,
	get: function() {
		return validateExecApprovalGetParams;
	}
});
Object.defineProperty(exports, "validateExecApprovalRequestParams", {
	enumerable: true,
	get: function() {
		return validateExecApprovalRequestParams;
	}
});
Object.defineProperty(exports, "validateExecApprovalResolveParams", {
	enumerable: true,
	get: function() {
		return validateExecApprovalResolveParams;
	}
});
Object.defineProperty(exports, "validateExecApprovalsGetParams", {
	enumerable: true,
	get: function() {
		return validateExecApprovalsGetParams;
	}
});
Object.defineProperty(exports, "validateExecApprovalsNodeGetParams", {
	enumerable: true,
	get: function() {
		return validateExecApprovalsNodeGetParams;
	}
});
Object.defineProperty(exports, "validateExecApprovalsNodeSetParams", {
	enumerable: true,
	get: function() {
		return validateExecApprovalsNodeSetParams;
	}
});
Object.defineProperty(exports, "validateExecApprovalsNodeSnapshot", {
	enumerable: true,
	get: function() {
		return validateExecApprovalsNodeSnapshot;
	}
});
Object.defineProperty(exports, "validateExecApprovalsSetParams", {
	enumerable: true,
	get: function() {
		return validateExecApprovalsSetParams;
	}
});
Object.defineProperty(exports, "validateFsListDirParams", {
	enumerable: true,
	get: function() {
		return validateFsListDirParams;
	}
});
Object.defineProperty(exports, "validateFsListDirResult", {
	enumerable: true,
	get: function() {
		return validateFsListDirResult;
	}
});
Object.defineProperty(exports, "validateGatewaySuspendPrepareParams", {
	enumerable: true,
	get: function() {
		return validateGatewaySuspendPrepareParams;
	}
});
Object.defineProperty(exports, "validateGatewaySuspendResumeParams", {
	enumerable: true,
	get: function() {
		return validateGatewaySuspendResumeParams;
	}
});
Object.defineProperty(exports, "validateGatewaySuspendStatusParams", {
	enumerable: true,
	get: function() {
		return validateGatewaySuspendStatusParams;
	}
});
Object.defineProperty(exports, "validateLogsTailParams", {
	enumerable: true,
	get: function() {
		return validateLogsTailParams;
	}
});
Object.defineProperty(exports, "validateMessageActionParams", {
	enumerable: true,
	get: function() {
		return validateMessageActionParams;
	}
});
Object.defineProperty(exports, "validateMigrationsMemoryApplyParams", {
	enumerable: true,
	get: function() {
		return validateMigrationsMemoryApplyParams;
	}
});
Object.defineProperty(exports, "validateMigrationsMemoryPlanParams", {
	enumerable: true,
	get: function() {
		return validateMigrationsMemoryPlanParams;
	}
});
Object.defineProperty(exports, "validateModelsListParams", {
	enumerable: true,
	get: function() {
		return validateModelsListParams;
	}
});
Object.defineProperty(exports, "validateModelsProbeParams", {
	enumerable: true,
	get: function() {
		return validateModelsProbeParams;
	}
});
Object.defineProperty(exports, "validateNodeDescribeParams", {
	enumerable: true,
	get: function() {
		return validateNodeDescribeParams;
	}
});
Object.defineProperty(exports, "validateNodeEventParams", {
	enumerable: true,
	get: function() {
		return validateNodeEventParams;
	}
});
Object.defineProperty(exports, "validateNodeInvokeParams", {
	enumerable: true,
	get: function() {
		return validateNodeInvokeParams;
	}
});
Object.defineProperty(exports, "validateNodeInvokeProgressParams", {
	enumerable: true,
	get: function() {
		return validateNodeInvokeProgressParams;
	}
});
Object.defineProperty(exports, "validateNodeInvokeResultParams", {
	enumerable: true,
	get: function() {
		return validateNodeInvokeResultParams;
	}
});
Object.defineProperty(exports, "validateNodeListParams", {
	enumerable: true,
	get: function() {
		return validateNodeListParams;
	}
});
Object.defineProperty(exports, "validateNodePairApproveParams", {
	enumerable: true,
	get: function() {
		return validateNodePairApproveParams;
	}
});
Object.defineProperty(exports, "validateNodePairListParams", {
	enumerable: true,
	get: function() {
		return validateNodePairListParams;
	}
});
Object.defineProperty(exports, "validateNodePairRejectParams", {
	enumerable: true,
	get: function() {
		return validateNodePairRejectParams;
	}
});
Object.defineProperty(exports, "validateNodePairRemoveParams", {
	enumerable: true,
	get: function() {
		return validateNodePairRemoveParams;
	}
});
Object.defineProperty(exports, "validateNodePendingAckParams", {
	enumerable: true,
	get: function() {
		return validateNodePendingAckParams;
	}
});
Object.defineProperty(exports, "validateNodePendingDrainParams", {
	enumerable: true,
	get: function() {
		return validateNodePendingDrainParams;
	}
});
Object.defineProperty(exports, "validateNodePendingEnqueueParams", {
	enumerable: true,
	get: function() {
		return validateNodePendingEnqueueParams;
	}
});
Object.defineProperty(exports, "validateNodePluginToolsUpdateParams", {
	enumerable: true,
	get: function() {
		return validateNodePluginToolsUpdateParams;
	}
});
Object.defineProperty(exports, "validateNodePresenceActivityPayload", {
	enumerable: true,
	get: function() {
		return validateNodePresenceActivityPayload;
	}
});
Object.defineProperty(exports, "validateNodeRenameParams", {
	enumerable: true,
	get: function() {
		return validateNodeRenameParams;
	}
});
Object.defineProperty(exports, "validateNodeSkillsUpdateParams", {
	enumerable: true,
	get: function() {
		return validateNodeSkillsUpdateParams;
	}
});
Object.defineProperty(exports, "validatePluginApprovalRequestParams", {
	enumerable: true,
	get: function() {
		return validatePluginApprovalRequestParams;
	}
});
Object.defineProperty(exports, "validatePluginApprovalResolveParams", {
	enumerable: true,
	get: function() {
		return validatePluginApprovalResolveParams;
	}
});
Object.defineProperty(exports, "validatePluginsInstallParams", {
	enumerable: true,
	get: function() {
		return validatePluginsInstallParams;
	}
});
Object.defineProperty(exports, "validatePluginsListParams", {
	enumerable: true,
	get: function() {
		return validatePluginsListParams;
	}
});
Object.defineProperty(exports, "validatePluginsSearchParams", {
	enumerable: true,
	get: function() {
		return validatePluginsSearchParams;
	}
});
Object.defineProperty(exports, "validatePluginsSessionActionParams", {
	enumerable: true,
	get: function() {
		return validatePluginsSessionActionParams;
	}
});
Object.defineProperty(exports, "validatePluginsSessionActionResult", {
	enumerable: true,
	get: function() {
		return validatePluginsSessionActionResult;
	}
});
Object.defineProperty(exports, "validatePluginsSetEnabledParams", {
	enumerable: true,
	get: function() {
		return validatePluginsSetEnabledParams;
	}
});
Object.defineProperty(exports, "validatePluginsUiDescriptorsParams", {
	enumerable: true,
	get: function() {
		return validatePluginsUiDescriptorsParams;
	}
});
Object.defineProperty(exports, "validatePluginsUiDescriptorsResult", {
	enumerable: true,
	get: function() {
		return validatePluginsUiDescriptorsResult;
	}
});
Object.defineProperty(exports, "validatePluginsUninstallParams", {
	enumerable: true,
	get: function() {
		return validatePluginsUninstallParams;
	}
});
Object.defineProperty(exports, "validatePollParams", {
	enumerable: true,
	get: function() {
		return validatePollParams;
	}
});
Object.defineProperty(exports, "validatePushTestParams", {
	enumerable: true,
	get: function() {
		return validatePushTestParams;
	}
});
Object.defineProperty(exports, "validateRequestFrame", {
	enumerable: true,
	get: function() {
		return validateRequestFrame;
	}
});
Object.defineProperty(exports, "validateSecretsResolveParams", {
	enumerable: true,
	get: function() {
		return validateSecretsResolveParams;
	}
});
Object.defineProperty(exports, "validateSecretsResolveResult", {
	enumerable: true,
	get: function() {
		return validateSecretsResolveResult;
	}
});
Object.defineProperty(exports, "validateSendParams", {
	enumerable: true,
	get: function() {
		return validateSendParams;
	}
});
Object.defineProperty(exports, "validateSessionsAbortParams", {
	enumerable: true,
	get: function() {
		return validateSessionsAbortParams;
	}
});
Object.defineProperty(exports, "validateSessionsCatalogArchiveParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCatalogArchiveParams;
	}
});
Object.defineProperty(exports, "validateSessionsCatalogContinueParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCatalogContinueParams;
	}
});
Object.defineProperty(exports, "validateSessionsCatalogListParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCatalogListParams;
	}
});
Object.defineProperty(exports, "validateSessionsCatalogReadParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCatalogReadParams;
	}
});
Object.defineProperty(exports, "validateSessionsCleanupParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCleanupParams;
	}
});
Object.defineProperty(exports, "validateSessionsCompactParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCompactParams;
	}
});
Object.defineProperty(exports, "validateSessionsCompactionBranchParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCompactionBranchParams;
	}
});
Object.defineProperty(exports, "validateSessionsCompactionGetParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCompactionGetParams;
	}
});
Object.defineProperty(exports, "validateSessionsCompactionListParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCompactionListParams;
	}
});
Object.defineProperty(exports, "validateSessionsCompactionRestoreParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCompactionRestoreParams;
	}
});
Object.defineProperty(exports, "validateSessionsCreateParams", {
	enumerable: true,
	get: function() {
		return validateSessionsCreateParams;
	}
});
Object.defineProperty(exports, "validateSessionsDeleteParams", {
	enumerable: true,
	get: function() {
		return validateSessionsDeleteParams;
	}
});
Object.defineProperty(exports, "validateSessionsDescribeParams", {
	enumerable: true,
	get: function() {
		return validateSessionsDescribeParams;
	}
});
Object.defineProperty(exports, "validateSessionsDiffParams", {
	enumerable: true,
	get: function() {
		return validateSessionsDiffParams;
	}
});
Object.defineProperty(exports, "validateSessionsDispatchParams", {
	enumerable: true,
	get: function() {
		return validateSessionsDispatchParams;
	}
});
Object.defineProperty(exports, "validateSessionsFilesGetParams", {
	enumerable: true,
	get: function() {
		return validateSessionsFilesGetParams;
	}
});
Object.defineProperty(exports, "validateSessionsFilesListParams", {
	enumerable: true,
	get: function() {
		return validateSessionsFilesListParams;
	}
});
Object.defineProperty(exports, "validateSessionsFilesSetParams", {
	enumerable: true,
	get: function() {
		return validateSessionsFilesSetParams;
	}
});
Object.defineProperty(exports, "validateSessionsGroupsDeleteParams", {
	enumerable: true,
	get: function() {
		return validateSessionsGroupsDeleteParams;
	}
});
Object.defineProperty(exports, "validateSessionsGroupsListParams", {
	enumerable: true,
	get: function() {
		return validateSessionsGroupsListParams;
	}
});
Object.defineProperty(exports, "validateSessionsGroupsPutParams", {
	enumerable: true,
	get: function() {
		return validateSessionsGroupsPutParams;
	}
});
Object.defineProperty(exports, "validateSessionsGroupsRenameParams", {
	enumerable: true,
	get: function() {
		return validateSessionsGroupsRenameParams;
	}
});
Object.defineProperty(exports, "validateSessionsListParams", {
	enumerable: true,
	get: function() {
		return validateSessionsListParams;
	}
});
Object.defineProperty(exports, "validateSessionsMessagesSubscribeParams", {
	enumerable: true,
	get: function() {
		return validateSessionsMessagesSubscribeParams;
	}
});
Object.defineProperty(exports, "validateSessionsMessagesUnsubscribeParams", {
	enumerable: true,
	get: function() {
		return validateSessionsMessagesUnsubscribeParams;
	}
});
Object.defineProperty(exports, "validateSessionsPatchParams", {
	enumerable: true,
	get: function() {
		return validateSessionsPatchParams;
	}
});
Object.defineProperty(exports, "validateSessionsPluginPatchParams", {
	enumerable: true,
	get: function() {
		return validateSessionsPluginPatchParams;
	}
});
Object.defineProperty(exports, "validateSessionsPreviewParams", {
	enumerable: true,
	get: function() {
		return validateSessionsPreviewParams;
	}
});
Object.defineProperty(exports, "validateSessionsReclaimParams", {
	enumerable: true,
	get: function() {
		return validateSessionsReclaimParams;
	}
});
Object.defineProperty(exports, "validateSessionsResetParams", {
	enumerable: true,
	get: function() {
		return validateSessionsResetParams;
	}
});
Object.defineProperty(exports, "validateSessionsResolveParams", {
	enumerable: true,
	get: function() {
		return validateSessionsResolveParams;
	}
});
Object.defineProperty(exports, "validateSessionsSearchParams", {
	enumerable: true,
	get: function() {
		return validateSessionsSearchParams;
	}
});
Object.defineProperty(exports, "validateSessionsSendParams", {
	enumerable: true,
	get: function() {
		return validateSessionsSendParams;
	}
});
Object.defineProperty(exports, "validateSessionsUsageParams", {
	enumerable: true,
	get: function() {
		return validateSessionsUsageParams;
	}
});
Object.defineProperty(exports, "validateSkillsBinsParams", {
	enumerable: true,
	get: function() {
		return validateSkillsBinsParams;
	}
});
Object.defineProperty(exports, "validateSkillsCuratorActionParams", {
	enumerable: true,
	get: function() {
		return validateSkillsCuratorActionParams;
	}
});
Object.defineProperty(exports, "validateSkillsCuratorStatusParams", {
	enumerable: true,
	get: function() {
		return validateSkillsCuratorStatusParams;
	}
});
Object.defineProperty(exports, "validateSkillsDetailParams", {
	enumerable: true,
	get: function() {
		return validateSkillsDetailParams;
	}
});
Object.defineProperty(exports, "validateSkillsInstallParams", {
	enumerable: true,
	get: function() {
		return validateSkillsInstallParams;
	}
});
Object.defineProperty(exports, "validateSkillsProposalActionParams", {
	enumerable: true,
	get: function() {
		return validateSkillsProposalActionParams;
	}
});
Object.defineProperty(exports, "validateSkillsProposalCreateParams", {
	enumerable: true,
	get: function() {
		return validateSkillsProposalCreateParams;
	}
});
Object.defineProperty(exports, "validateSkillsProposalInspectParams", {
	enumerable: true,
	get: function() {
		return validateSkillsProposalInspectParams;
	}
});
Object.defineProperty(exports, "validateSkillsProposalRequestRevisionParams", {
	enumerable: true,
	get: function() {
		return validateSkillsProposalRequestRevisionParams;
	}
});
Object.defineProperty(exports, "validateSkillsProposalReviseParams", {
	enumerable: true,
	get: function() {
		return validateSkillsProposalReviseParams;
	}
});
Object.defineProperty(exports, "validateSkillsProposalUpdateParams", {
	enumerable: true,
	get: function() {
		return validateSkillsProposalUpdateParams;
	}
});
Object.defineProperty(exports, "validateSkillsProposalsListParams", {
	enumerable: true,
	get: function() {
		return validateSkillsProposalsListParams;
	}
});
Object.defineProperty(exports, "validateSkillsSearchParams", {
	enumerable: true,
	get: function() {
		return validateSkillsSearchParams;
	}
});
Object.defineProperty(exports, "validateSkillsSecurityVerdictsParams", {
	enumerable: true,
	get: function() {
		return validateSkillsSecurityVerdictsParams;
	}
});
Object.defineProperty(exports, "validateSkillsSkillCardParams", {
	enumerable: true,
	get: function() {
		return validateSkillsSkillCardParams;
	}
});
Object.defineProperty(exports, "validateSkillsStatusParams", {
	enumerable: true,
	get: function() {
		return validateSkillsStatusParams;
	}
});
Object.defineProperty(exports, "validateSkillsUpdateParams", {
	enumerable: true,
	get: function() {
		return validateSkillsUpdateParams;
	}
});
Object.defineProperty(exports, "validateSkillsUploadBeginParams", {
	enumerable: true,
	get: function() {
		return validateSkillsUploadBeginParams;
	}
});
Object.defineProperty(exports, "validateSkillsUploadChunkParams", {
	enumerable: true,
	get: function() {
		return validateSkillsUploadChunkParams;
	}
});
Object.defineProperty(exports, "validateSkillsUploadCommitParams", {
	enumerable: true,
	get: function() {
		return validateSkillsUploadCommitParams;
	}
});
Object.defineProperty(exports, "validateSystemAgentChatParams", {
	enumerable: true,
	get: function() {
		return validateSystemAgentChatParams;
	}
});
Object.defineProperty(exports, "validateSystemAgentSetupActivateParams", {
	enumerable: true,
	get: function() {
		return validateSystemAgentSetupActivateParams;
	}
});
Object.defineProperty(exports, "validateSystemAgentSetupAuthStartParams", {
	enumerable: true,
	get: function() {
		return validateSystemAgentSetupAuthStartParams;
	}
});
Object.defineProperty(exports, "validateSystemAgentSetupDetectParams", {
	enumerable: true,
	get: function() {
		return validateSystemAgentSetupDetectParams;
	}
});
Object.defineProperty(exports, "validateSystemAgentSetupVerifyParams", {
	enumerable: true,
	get: function() {
		return validateSystemAgentSetupVerifyParams;
	}
});
Object.defineProperty(exports, "validateSystemInfoParams", {
	enumerable: true,
	get: function() {
		return validateSystemInfoParams;
	}
});
Object.defineProperty(exports, "validateTalkCatalogParams", {
	enumerable: true,
	get: function() {
		return validateTalkCatalogParams;
	}
});
Object.defineProperty(exports, "validateTalkClientCreateParams", {
	enumerable: true,
	get: function() {
		return validateTalkClientCreateParams;
	}
});
Object.defineProperty(exports, "validateTalkClientSteerParams", {
	enumerable: true,
	get: function() {
		return validateTalkClientSteerParams;
	}
});
Object.defineProperty(exports, "validateTalkClientToolCallParams", {
	enumerable: true,
	get: function() {
		return validateTalkClientToolCallParams;
	}
});
Object.defineProperty(exports, "validateTalkConfigParams", {
	enumerable: true,
	get: function() {
		return validateTalkConfigParams;
	}
});
Object.defineProperty(exports, "validateTalkModeParams", {
	enumerable: true,
	get: function() {
		return validateTalkModeParams;
	}
});
Object.defineProperty(exports, "validateTalkSessionAcknowledgeMarkParams", {
	enumerable: true,
	get: function() {
		return validateTalkSessionAcknowledgeMarkParams;
	}
});
Object.defineProperty(exports, "validateTalkSessionAppendAudioParams", {
	enumerable: true,
	get: function() {
		return validateTalkSessionAppendAudioParams;
	}
});
Object.defineProperty(exports, "validateTalkSessionCancelOutputParams", {
	enumerable: true,
	get: function() {
		return validateTalkSessionCancelOutputParams;
	}
});
Object.defineProperty(exports, "validateTalkSessionCancelTurnParams", {
	enumerable: true,
	get: function() {
		return validateTalkSessionCancelTurnParams;
	}
});
Object.defineProperty(exports, "validateTalkSessionCloseParams", {
	enumerable: true,
	get: function() {
		return validateTalkSessionCloseParams;
	}
});
Object.defineProperty(exports, "validateTalkSessionCreateParams", {
	enumerable: true,
	get: function() {
		return validateTalkSessionCreateParams;
	}
});
Object.defineProperty(exports, "validateTalkSessionJoinParams", {
	enumerable: true,
	get: function() {
		return validateTalkSessionJoinParams;
	}
});
Object.defineProperty(exports, "validateTalkSessionSteerParams", {
	enumerable: true,
	get: function() {
		return validateTalkSessionSteerParams;
	}
});
Object.defineProperty(exports, "validateTalkSessionSubmitToolResultParams", {
	enumerable: true,
	get: function() {
		return validateTalkSessionSubmitToolResultParams;
	}
});
Object.defineProperty(exports, "validateTalkSessionTurnParams", {
	enumerable: true,
	get: function() {
		return validateTalkSessionTurnParams;
	}
});
Object.defineProperty(exports, "validateTalkSpeakParams", {
	enumerable: true,
	get: function() {
		return validateTalkSpeakParams;
	}
});
Object.defineProperty(exports, "validateTaskSuggestionsAcceptParams", {
	enumerable: true,
	get: function() {
		return validateTaskSuggestionsAcceptParams;
	}
});
Object.defineProperty(exports, "validateTaskSuggestionsCreateParams", {
	enumerable: true,
	get: function() {
		return validateTaskSuggestionsCreateParams;
	}
});
Object.defineProperty(exports, "validateTaskSuggestionsDismissParams", {
	enumerable: true,
	get: function() {
		return validateTaskSuggestionsDismissParams;
	}
});
Object.defineProperty(exports, "validateTaskSuggestionsListParams", {
	enumerable: true,
	get: function() {
		return validateTaskSuggestionsListParams;
	}
});
Object.defineProperty(exports, "validateTasksCancelParams", {
	enumerable: true,
	get: function() {
		return validateTasksCancelParams;
	}
});
Object.defineProperty(exports, "validateTasksGetParams", {
	enumerable: true,
	get: function() {
		return validateTasksGetParams;
	}
});
Object.defineProperty(exports, "validateTasksListParams", {
	enumerable: true,
	get: function() {
		return validateTasksListParams;
	}
});
Object.defineProperty(exports, "validateTerminalAttachParams", {
	enumerable: true,
	get: function() {
		return validateTerminalAttachParams;
	}
});
Object.defineProperty(exports, "validateTerminalCloseParams", {
	enumerable: true,
	get: function() {
		return validateTerminalCloseParams;
	}
});
Object.defineProperty(exports, "validateTerminalInputParams", {
	enumerable: true,
	get: function() {
		return validateTerminalInputParams;
	}
});
Object.defineProperty(exports, "validateTerminalOpenParams", {
	enumerable: true,
	get: function() {
		return validateTerminalOpenParams;
	}
});
Object.defineProperty(exports, "validateTerminalResizeParams", {
	enumerable: true,
	get: function() {
		return validateTerminalResizeParams;
	}
});
Object.defineProperty(exports, "validateTerminalTextParams", {
	enumerable: true,
	get: function() {
		return validateTerminalTextParams;
	}
});
Object.defineProperty(exports, "validateTerminalUploadParams", {
	enumerable: true,
	get: function() {
		return validateTerminalUploadParams;
	}
});
Object.defineProperty(exports, "validateTerminalUploadResult", {
	enumerable: true,
	get: function() {
		return validateTerminalUploadResult;
	}
});
Object.defineProperty(exports, "validateToolsCatalogParams", {
	enumerable: true,
	get: function() {
		return validateToolsCatalogParams;
	}
});
Object.defineProperty(exports, "validateToolsEffectiveParams", {
	enumerable: true,
	get: function() {
		return validateToolsEffectiveParams;
	}
});
Object.defineProperty(exports, "validateToolsInvokeParams", {
	enumerable: true,
	get: function() {
		return validateToolsInvokeParams;
	}
});
Object.defineProperty(exports, "validateTtsSpeakParams", {
	enumerable: true,
	get: function() {
		return validateTtsSpeakParams;
	}
});
Object.defineProperty(exports, "validateUpdateRunParams", {
	enumerable: true,
	get: function() {
		return validateUpdateRunParams;
	}
});
Object.defineProperty(exports, "validateUpdateStatusParams", {
	enumerable: true,
	get: function() {
		return validateUpdateStatusParams;
	}
});
Object.defineProperty(exports, "validateWakeParams", {
	enumerable: true,
	get: function() {
		return validateWakeParams;
	}
});
Object.defineProperty(exports, "validateWebLoginStartParams", {
	enumerable: true,
	get: function() {
		return validateWebLoginStartParams;
	}
});
Object.defineProperty(exports, "validateWebLoginWaitParams", {
	enumerable: true,
	get: function() {
		return validateWebLoginWaitParams;
	}
});
Object.defineProperty(exports, "validateWebPushSubscribeParams", {
	enumerable: true,
	get: function() {
		return validateWebPushSubscribeParams;
	}
});
Object.defineProperty(exports, "validateWebPushTestParams", {
	enumerable: true,
	get: function() {
		return validateWebPushTestParams;
	}
});
Object.defineProperty(exports, "validateWebPushUnsubscribeParams", {
	enumerable: true,
	get: function() {
		return validateWebPushUnsubscribeParams;
	}
});
Object.defineProperty(exports, "validateWebPushVapidPublicKeyParams", {
	enumerable: true,
	get: function() {
		return validateWebPushVapidPublicKeyParams;
	}
});
Object.defineProperty(exports, "validateWizardCancelParams", {
	enumerable: true,
	get: function() {
		return validateWizardCancelParams;
	}
});
Object.defineProperty(exports, "validateWizardNextParams", {
	enumerable: true,
	get: function() {
		return validateWizardNextParams;
	}
});
Object.defineProperty(exports, "validateWizardStartParams", {
	enumerable: true,
	get: function() {
		return validateWizardStartParams;
	}
});
Object.defineProperty(exports, "validateWizardStatusParams", {
	enumerable: true,
	get: function() {
		return validateWizardStatusParams;
	}
});
Object.defineProperty(exports, "validateWorkerAdmissionHandshake", {
	enumerable: true,
	get: function() {
		return validateWorkerAdmissionHandshake;
	}
});
Object.defineProperty(exports, "validateWorkerConnectRequestFrame", {
	enumerable: true,
	get: function() {
		return validateWorkerConnectRequestFrame;
	}
});
Object.defineProperty(exports, "validateWorkerHeartbeatParams", {
	enumerable: true,
	get: function() {
		return validateWorkerHeartbeatParams;
	}
});
Object.defineProperty(exports, "validateWorkerLiveEventParams", {
	enumerable: true,
	get: function() {
		return validateWorkerLiveEventParams;
	}
});
Object.defineProperty(exports, "validateWorkerTranscriptCommitParams", {
	enumerable: true,
	get: function() {
		return validateWorkerTranscriptCommitParams;
	}
});
Object.defineProperty(exports, "validateWorktreesBranchesParams", {
	enumerable: true,
	get: function() {
		return validateWorktreesBranchesParams;
	}
});
Object.defineProperty(exports, "validateWorktreesCreateParams", {
	enumerable: true,
	get: function() {
		return validateWorktreesCreateParams;
	}
});
Object.defineProperty(exports, "validateWorktreesGcParams", {
	enumerable: true,
	get: function() {
		return validateWorktreesGcParams;
	}
});
Object.defineProperty(exports, "validateWorktreesListParams", {
	enumerable: true,
	get: function() {
		return validateWorktreesListParams;
	}
});
Object.defineProperty(exports, "validateWorktreesRemoveParams", {
	enumerable: true,
	get: function() {
		return validateWorktreesRemoveParams;
	}
});
Object.defineProperty(exports, "validateWorktreesRestoreParams", {
	enumerable: true,
	get: function() {
		return validateWorktreesRestoreParams;
	}
});
