// Builds plugin API objects from config, registries, and runtime helpers.
import type { OperatorConfig } from "../config/types.operator.js";
import { attachPluginApiFacades, type OperatorPluginApiWithoutFacades } from "./api-facades.js";
import type { PluginRuntime } from "./runtime/types.js";
import type { OperatorPluginApi, PluginLogger } from "./types.js";

type BuildPluginApiParams = {
  id: string;
  name: string;
  version?: string;
  description?: string;
  source: string;
  rootDir?: string;
  registrationMode: OperatorPluginApi["registrationMode"];
  config: OperatorConfig;
  pluginConfig?: Record<string, unknown>;
  runtime: PluginRuntime;
  logger: PluginLogger;
  resolvePath: (input: string) => string;
  handlers?: Partial<
    Pick<
      OperatorPluginApi,
      | "registerTool"
      | "registerHook"
      | "registerHttpRoute"
      | "registerHostedMediaResolver"
      | "registerMcpServerConnectionResolver"
      | "registerChannel"
      | "registerGatewayMethod"
      | "registerSessionCatalog"
      | "registerCli"
      | "registerReload"
      | "registerNodeHostCommand"
      | "registerNodeInvokePolicy"
      | "registerSecurityAuditCollector"
      | "registerService"
      | "registerGatewayDiscoveryService"
      | "registerCliBackend"
      | "registerTextTransforms"
      | "registerConfigMigration"
      | "registerMigrationProvider"
      | "registerAutoEnableProbe"
      | "registerProvider"
      | "registerWorkerProvider"
      | "registerModelCatalogProvider"
      | "registerEmbeddingProvider"
      | "registerSpeechProvider"
      | "registerRealtimeTranscriptionProvider"
      | "registerRealtimeVoiceProvider"
      | "registerMediaUnderstandingProvider"
      | "registerTranscriptSourceProvider"
      | "registerImageGenerationProvider"
      | "registerVideoGenerationProvider"
      | "registerMusicGenerationProvider"
      | "registerWebFetchProvider"
      | "registerWebSearchProvider"
      | "registerInteractiveHandler"
      | "onConversationBindingResolved"
      | "registerCommand"
      | "registerContextEngine"
      | "registerCompactionProvider"
      | "registerAgentHarness"
      | "registerCodexAppServerExtensionFactory"
      | "registerAgentToolResultMiddleware"
      | "registerSessionExtension"
      | "enqueueNextTurnInjection"
      | "registerTrustedToolPolicy"
      | "registerToolMetadata"
      | "registerControlUiDescriptor"
      | "registerRuntimeLifecycle"
      | "registerAgentEventSubscription"
      | "emitAgentEvent"
      | "setRunContext"
      | "getRunContext"
      | "clearRunContext"
      | "registerSessionSchedulerJob"
      | "registerSessionAction"
      | "sendSessionAttachment"
      | "scheduleSessionTurn"
      | "unscheduleSessionTurnsByTag"
      | "registerDetachedTaskRuntime"
      | "registerMemoryCapability"
      | "registerMemoryPromptSection"
      | "registerMemoryPromptSupplement"
      | "registerMemoryCorpusSupplement"
      | "registerMemoryFlushPlan"
      | "registerMemoryRuntime"
      | "registerMemoryEmbeddingProvider"
      | "on"
    >
  >;
};

const noopRegisterTool: OperatorPluginApi["registerTool"] = () => {};
const noopRegisterHook: OperatorPluginApi["registerHook"] = () => {};
const noopRegisterHttpRoute: OperatorPluginApi["registerHttpRoute"] = () => {};
const noopRegisterHostedMediaResolver: OperatorPluginApi["registerHostedMediaResolver"] = () => {};
const noopRegisterMcpServerConnectionResolver: OperatorPluginApi["registerMcpServerConnectionResolver"] =
  () => {};
const noopRegisterChannel: OperatorPluginApi["registerChannel"] = () => {};
const noopRegisterGatewayMethod: OperatorPluginApi["registerGatewayMethod"] = () => {};
const noopRegisterSessionCatalog: OperatorPluginApi["registerSessionCatalog"] = () => {};
const noopRegisterCli: OperatorPluginApi["registerCli"] = () => {};
const noopRegisterReload: OperatorPluginApi["registerReload"] = () => {};
const noopRegisterNodeHostCommand: OperatorPluginApi["registerNodeHostCommand"] = () => {};
const noopRegisterNodeInvokePolicy: OperatorPluginApi["registerNodeInvokePolicy"] = () => {};
const noopRegisterSecurityAuditCollector: OperatorPluginApi["registerSecurityAuditCollector"] =
  () => {};
const noopRegisterService: OperatorPluginApi["registerService"] = () => {};
const noopRegisterGatewayDiscoveryService: OperatorPluginApi["registerGatewayDiscoveryService"] =
  () => {};
const noopRegisterCliBackend: OperatorPluginApi["registerCliBackend"] = () => {};
const noopRegisterTextTransforms: OperatorPluginApi["registerTextTransforms"] = () => {};
const noopRegisterConfigMigration: OperatorPluginApi["registerConfigMigration"] = () => {};
const noopRegisterMigrationProvider: OperatorPluginApi["registerMigrationProvider"] = () => {};
const noopRegisterAutoEnableProbe: OperatorPluginApi["registerAutoEnableProbe"] = () => {};
const noopRegisterProvider: OperatorPluginApi["registerProvider"] = () => {};
const noopRegisterWorkerProvider: OperatorPluginApi["registerWorkerProvider"] = () => {};
const noopRegisterModelCatalogProvider: OperatorPluginApi["registerModelCatalogProvider"] =
  () => {};
const noopRegisterEmbeddingProvider: OperatorPluginApi["registerEmbeddingProvider"] = () => {};
const noopRegisterSpeechProvider: OperatorPluginApi["registerSpeechProvider"] = () => {};
const noopRegisterRealtimeTranscriptionProvider: OperatorPluginApi["registerRealtimeTranscriptionProvider"] =
  () => {};
const noopRegisterRealtimeVoiceProvider: OperatorPluginApi["registerRealtimeVoiceProvider"] =
  () => {};
const noopRegisterMediaUnderstandingProvider: OperatorPluginApi["registerMediaUnderstandingProvider"] =
  () => {};
const noopRegisterTranscriptsSourceProvider: OperatorPluginApi["registerTranscriptSourceProvider"] =
  () => {};
const noopRegisterImageGenerationProvider: OperatorPluginApi["registerImageGenerationProvider"] =
  () => {};
const noopRegisterVideoGenerationProvider: OperatorPluginApi["registerVideoGenerationProvider"] =
  () => {};
const noopRegisterMusicGenerationProvider: OperatorPluginApi["registerMusicGenerationProvider"] =
  () => {};
const noopRegisterWebFetchProvider: OperatorPluginApi["registerWebFetchProvider"] = () => {};
const noopRegisterWebSearchProvider: OperatorPluginApi["registerWebSearchProvider"] = () => {};
const noopRegisterInteractiveHandler: OperatorPluginApi["registerInteractiveHandler"] = () => {};
const noopOnConversationBindingResolved: OperatorPluginApi["onConversationBindingResolved"] =
  () => {};
const noopRegisterCommand: OperatorPluginApi["registerCommand"] = () => {};
const noopRegisterContextEngine: OperatorPluginApi["registerContextEngine"] = () => {};
const noopRegisterCompactionProvider: OperatorPluginApi["registerCompactionProvider"] = () => {};
const noopRegisterAgentHarness: OperatorPluginApi["registerAgentHarness"] = () => {};
const noopRegisterCodexAppServerExtensionFactory: OperatorPluginApi["registerCodexAppServerExtensionFactory"] =
  () => {};
const noopRegisterAgentToolResultMiddleware: OperatorPluginApi["registerAgentToolResultMiddleware"] =
  () => {};
const noopRegisterSessionExtension: OperatorPluginApi["registerSessionExtension"] = () => {};
const noopEnqueueNextTurnInjection: OperatorPluginApi["enqueueNextTurnInjection"] = async (
  injection,
) => ({ enqueued: false, id: "", sessionKey: injection.sessionKey });
const noopRegisterTrustedToolPolicy: OperatorPluginApi["registerTrustedToolPolicy"] = () => {};
const noopRegisterToolMetadata: OperatorPluginApi["registerToolMetadata"] = () => {};
const noopRegisterControlUiDescriptor: OperatorPluginApi["registerControlUiDescriptor"] = () => {};
const noopRegisterRuntimeLifecycle: OperatorPluginApi["registerRuntimeLifecycle"] = () => {};
const noopRegisterAgentEventSubscription: OperatorPluginApi["registerAgentEventSubscription"] =
  () => {};
const noopEmitAgentEvent: OperatorPluginApi["emitAgentEvent"] = () => ({
  emitted: false,
  reason: "not wired",
});
const noopSetRunContext: OperatorPluginApi["setRunContext"] = () => false;
const noopGetRunContext: OperatorPluginApi["getRunContext"] = () => undefined;
const noopClearRunContext: OperatorPluginApi["clearRunContext"] = () => {};
const noopRegisterSessionSchedulerJob: OperatorPluginApi["registerSessionSchedulerJob"] = () =>
  undefined;
const noopRegisterSessionAction: OperatorPluginApi["registerSessionAction"] = () => {};
const noopSendSessionAttachment: OperatorPluginApi["sendSessionAttachment"] = async () => ({
  ok: false,
  error: "not wired",
});
const noopScheduleSessionTurn: OperatorPluginApi["scheduleSessionTurn"] = async () => undefined;
const noopUnscheduleSessionTurnsByTag: OperatorPluginApi["unscheduleSessionTurnsByTag"] =
  async () => ({ removed: 0, failed: 0 });
const noopRegisterDetachedTaskRuntime: OperatorPluginApi["registerDetachedTaskRuntime"] = () => {};
const noopRegisterMemoryCapability: OperatorPluginApi["registerMemoryCapability"] = () => {};
const noopRegisterMemoryPromptSection: OperatorPluginApi["registerMemoryPromptSection"] = () => {};
const noopRegisterMemoryPromptSupplement: OperatorPluginApi["registerMemoryPromptSupplement"] =
  () => {};
const noopRegisterMemoryCorpusSupplement: OperatorPluginApi["registerMemoryCorpusSupplement"] =
  () => {};
const noopRegisterMemoryFlushPlan: OperatorPluginApi["registerMemoryFlushPlan"] = () => {};
const noopRegisterMemoryRuntime: OperatorPluginApi["registerMemoryRuntime"] = () => {};
const noopRegisterMemoryEmbeddingProvider: OperatorPluginApi["registerMemoryEmbeddingProvider"] =
  () => {};
const noopOn: OperatorPluginApi["on"] = () => {};

export function buildPluginApi(params: BuildPluginApiParams): OperatorPluginApi {
  const handlers = params.handlers ?? {};
  const registerCli = handlers.registerCli ?? noopRegisterCli;
  const api: OperatorPluginApiWithoutFacades = {
    id: params.id,
    name: params.name,
    version: params.version,
    description: params.description,
    source: params.source,
    rootDir: params.rootDir,
    registrationMode: params.registrationMode,
    config: params.config,
    pluginConfig: params.pluginConfig,
    runtime: params.runtime,
    logger: params.logger,
    registerTool: handlers.registerTool ?? noopRegisterTool,
    registerHook: handlers.registerHook ?? noopRegisterHook,
    registerHttpRoute: handlers.registerHttpRoute ?? noopRegisterHttpRoute,
    registerHostedMediaResolver:
      handlers.registerHostedMediaResolver ?? noopRegisterHostedMediaResolver,
    registerMcpServerConnectionResolver:
      handlers.registerMcpServerConnectionResolver ?? noopRegisterMcpServerConnectionResolver,
    registerChannel: handlers.registerChannel ?? noopRegisterChannel,
    registerGatewayMethod: handlers.registerGatewayMethod ?? noopRegisterGatewayMethod,
    registerSessionCatalog: handlers.registerSessionCatalog ?? noopRegisterSessionCatalog,
    registerCli,
    registerNodeCliFeature: (registrar, opts) =>
      registerCli(registrar, {
        ...opts,
        parentPath: ["nodes"],
      }),
    registerReload: handlers.registerReload ?? noopRegisterReload,
    registerNodeHostCommand: handlers.registerNodeHostCommand ?? noopRegisterNodeHostCommand,
    registerNodeInvokePolicy: handlers.registerNodeInvokePolicy ?? noopRegisterNodeInvokePolicy,
    registerSecurityAuditCollector:
      handlers.registerSecurityAuditCollector ?? noopRegisterSecurityAuditCollector,
    registerService: handlers.registerService ?? noopRegisterService,
    registerGatewayDiscoveryService:
      handlers.registerGatewayDiscoveryService ?? noopRegisterGatewayDiscoveryService,
    registerCliBackend: handlers.registerCliBackend ?? noopRegisterCliBackend,
    registerTextTransforms: handlers.registerTextTransforms ?? noopRegisterTextTransforms,
    registerConfigMigration: handlers.registerConfigMigration ?? noopRegisterConfigMigration,
    registerMigrationProvider: handlers.registerMigrationProvider ?? noopRegisterMigrationProvider,
    registerAutoEnableProbe: handlers.registerAutoEnableProbe ?? noopRegisterAutoEnableProbe,
    registerProvider: handlers.registerProvider ?? noopRegisterProvider,
    registerWorkerProvider: handlers.registerWorkerProvider ?? noopRegisterWorkerProvider,
    registerModelCatalogProvider:
      handlers.registerModelCatalogProvider ?? noopRegisterModelCatalogProvider,
    registerEmbeddingProvider: handlers.registerEmbeddingProvider ?? noopRegisterEmbeddingProvider,
    registerSpeechProvider: handlers.registerSpeechProvider ?? noopRegisterSpeechProvider,
    registerRealtimeTranscriptionProvider:
      handlers.registerRealtimeTranscriptionProvider ?? noopRegisterRealtimeTranscriptionProvider,
    registerRealtimeVoiceProvider:
      handlers.registerRealtimeVoiceProvider ?? noopRegisterRealtimeVoiceProvider,
    registerMediaUnderstandingProvider:
      handlers.registerMediaUnderstandingProvider ?? noopRegisterMediaUnderstandingProvider,
    registerTranscriptSourceProvider:
      handlers.registerTranscriptSourceProvider ?? noopRegisterTranscriptsSourceProvider,
    registerImageGenerationProvider:
      handlers.registerImageGenerationProvider ?? noopRegisterImageGenerationProvider,
    registerVideoGenerationProvider:
      handlers.registerVideoGenerationProvider ?? noopRegisterVideoGenerationProvider,
    registerMusicGenerationProvider:
      handlers.registerMusicGenerationProvider ?? noopRegisterMusicGenerationProvider,
    registerWebFetchProvider: handlers.registerWebFetchProvider ?? noopRegisterWebFetchProvider,
    registerWebSearchProvider: handlers.registerWebSearchProvider ?? noopRegisterWebSearchProvider,
    registerInteractiveHandler:
      handlers.registerInteractiveHandler ?? noopRegisterInteractiveHandler,
    onConversationBindingResolved:
      handlers.onConversationBindingResolved ?? noopOnConversationBindingResolved,
    registerCommand: handlers.registerCommand ?? noopRegisterCommand,
    registerContextEngine: handlers.registerContextEngine ?? noopRegisterContextEngine,
    registerCompactionProvider:
      handlers.registerCompactionProvider ?? noopRegisterCompactionProvider,
    registerAgentHarness: handlers.registerAgentHarness ?? noopRegisterAgentHarness,
    registerCodexAppServerExtensionFactory:
      handlers.registerCodexAppServerExtensionFactory ?? noopRegisterCodexAppServerExtensionFactory,
    registerAgentToolResultMiddleware:
      handlers.registerAgentToolResultMiddleware ?? noopRegisterAgentToolResultMiddleware,
    registerSessionExtension: handlers.registerSessionExtension ?? noopRegisterSessionExtension,
    enqueueNextTurnInjection: handlers.enqueueNextTurnInjection ?? noopEnqueueNextTurnInjection,
    registerTrustedToolPolicy: handlers.registerTrustedToolPolicy ?? noopRegisterTrustedToolPolicy,
    registerToolMetadata: handlers.registerToolMetadata ?? noopRegisterToolMetadata,
    registerControlUiDescriptor:
      handlers.registerControlUiDescriptor ?? noopRegisterControlUiDescriptor,
    registerRuntimeLifecycle: handlers.registerRuntimeLifecycle ?? noopRegisterRuntimeLifecycle,
    registerAgentEventSubscription:
      handlers.registerAgentEventSubscription ?? noopRegisterAgentEventSubscription,
    emitAgentEvent: handlers.emitAgentEvent ?? noopEmitAgentEvent,
    setRunContext: handlers.setRunContext ?? noopSetRunContext,
    getRunContext: handlers.getRunContext ?? noopGetRunContext,
    clearRunContext: handlers.clearRunContext ?? noopClearRunContext,
    registerSessionSchedulerJob:
      handlers.registerSessionSchedulerJob ?? noopRegisterSessionSchedulerJob,
    registerSessionAction: handlers.registerSessionAction ?? noopRegisterSessionAction,
    sendSessionAttachment: handlers.sendSessionAttachment ?? noopSendSessionAttachment,
    scheduleSessionTurn: handlers.scheduleSessionTurn ?? noopScheduleSessionTurn,
    unscheduleSessionTurnsByTag:
      handlers.unscheduleSessionTurnsByTag ?? noopUnscheduleSessionTurnsByTag,
    registerDetachedTaskRuntime:
      handlers.registerDetachedTaskRuntime ?? noopRegisterDetachedTaskRuntime,
    registerMemoryCapability: handlers.registerMemoryCapability ?? noopRegisterMemoryCapability,
    registerMemoryPromptSection:
      handlers.registerMemoryPromptSection ?? noopRegisterMemoryPromptSection,
    registerMemoryPromptSupplement:
      handlers.registerMemoryPromptSupplement ?? noopRegisterMemoryPromptSupplement,
    registerMemoryCorpusSupplement:
      handlers.registerMemoryCorpusSupplement ?? noopRegisterMemoryCorpusSupplement,
    registerMemoryFlushPlan: handlers.registerMemoryFlushPlan ?? noopRegisterMemoryFlushPlan,
    registerMemoryRuntime: handlers.registerMemoryRuntime ?? noopRegisterMemoryRuntime,
    registerMemoryEmbeddingProvider:
      handlers.registerMemoryEmbeddingProvider ?? noopRegisterMemoryEmbeddingProvider,
    resolvePath: params.resolvePath,
    on: handlers.on ?? noopOn,
  };
  return attachPluginApiFacades(api);
}
