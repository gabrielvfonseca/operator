// Discord plugin module implements approval runtime behavior.
export {
  isChannelExecApprovalClientEnabledFromConfig,
  matchesApprovalRequestFilters,
  getExecApprovalReplyMetadata,
} from "@gabrielvfonseca/operator/plugin-sdk/approval-client-runtime";
export { resolveApprovalApprovers } from "@gabrielvfonseca/operator/plugin-sdk/approval-auth-runtime";
export { createApproverRestrictedNativeApprovalCapability } from "@gabrielvfonseca/operator/plugin-sdk/approval-delivery-runtime";
export {
  createChannelApproverDmTargetResolver,
  createChannelNativeOriginTargetResolver,
} from "@gabrielvfonseca/operator/plugin-sdk/approval-native-runtime";
