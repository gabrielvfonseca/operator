// Discord plugin module implements native command behavior.
import { resolveDirectStatusReplyForSession } from "@gabrielvfonseca/operator/plugin-sdk/command-status-runtime";
import * as pluginRuntime from "@gabrielvfonseca/operator/plugin-sdk/plugin-runtime";
import { dispatchReplyWithDispatcher } from "@gabrielvfonseca/operator/plugin-sdk/reply-dispatch-runtime";
import { getSessionEntry } from "@gabrielvfonseca/operator/plugin-sdk/session-store-runtime";
import { resolveDiscordNativeInteractionRouteState } from "./native-command-route.js";

export const nativeCommandRuntime = {
  matchPluginCommand: pluginRuntime.matchPluginCommand,
  executePluginCommand: pluginRuntime.executePluginCommand,
  dispatchReplyWithDispatcher,
  resolveDirectStatusReplyForSession,
  resolveDiscordNativeInteractionRouteState,
  getSessionEntry,
};
