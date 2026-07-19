import { SpanStatusCode } from "@opentelemetry/api";
import { redactSensitiveText } from "../api.js";
import type { DiagnosticEventMetadata, DiagnosticEventPayload } from "../api.js";
import { lowCardinalityAttr } from "./service-attributes.js";
import { positiveFiniteNumber } from "./service-genai-attributes.js";
import {
  assignOtelToolContentAttributes,
  assignOtelToolIdentityAttributes,
} from "./service-genai-content.js";
import type { OtelToolCallContent } from "./service-genai-content.js";
import type { DiagnosticsRecorderRuntime } from "./service-recorder-runtime.js";
import type { TelemetryExporterDiagnosticEvent } from "./service-types.js";

export function createToolAndSystemRecorders(runtime: DiagnosticsRecorderRuntime) {
  const {
    queueDepthHistogram,
    skillUsedCounter,
    toolExecutionDurationHistogram,
    toolExecutionBlockedCounter,
    execProcessDurationHistogram,
    payloadLargeCounter,
    payloadLargeBytesHistogram,
    livenessWarningCounter,
    livenessEventLoopDelayP99Histogram,
    livenessEventLoopDelayMaxHistogram,
    livenessEventLoopUtilizationHistogram,
    livenessCpuCoreRatioHistogram,
    telemetryExporterCounter,
    spanWithDuration,
    activeTrustedParentContext,
    trackTrustedSpan,
    takeTrackedTrustedSpan,
    setSpanAttrs,
    addRunAttrs,
    paramsSummaryAttrs,
    contentCapturePolicy,
    tracesEnabled,
  } = runtime;

  const toolExecutionBaseAttrs = (
    evt: Extract<
      DiagnosticEventPayload,
      {
        type:
          | "tool.execution.started"
          | "tool.execution.completed"
          | "tool.execution.error"
          | "tool.execution.blocked";
      }
    >,
  ): Record<string, string | number | boolean> => ({
    "operator.toolName": evt.toolName,
    "operator.tool.source": lowCardinalityAttr(evt.toolSource, "core"),
    "gen_ai.tool.name": evt.toolName,
    ...(evt.toolOwner ? { "operator.tool.owner": lowCardinalityAttr(evt.toolOwner) } : {}),
    ...paramsSummaryAttrs(evt.paramsSummary),
  });

  const skillUsedAttrs = (
    evt: Extract<DiagnosticEventPayload, { type: "skill.used" }>,
  ): Record<string, string | number | boolean> => ({
    "operator.skill.name": lowCardinalityAttr(evt.skillName, "skill"),
    "operator.skill.source": lowCardinalityAttr(evt.skillSource),
    "operator.skill.activation": lowCardinalityAttr(evt.activation),
    ...(evt.agentId ? { "operator.agent": lowCardinalityAttr(evt.agentId) } : {}),
    ...(evt.toolName ? { "operator.toolName": lowCardinalityAttr(evt.toolName, "tool") } : {}),
  });

  const recordSkillUsed = (
    evt: Extract<DiagnosticEventPayload, { type: "skill.used" }>,
    metadata: DiagnosticEventMetadata,
  ) => {
    if (!metadata.trusted) {
      return;
    }
    const attrs = skillUsedAttrs(evt);
    skillUsedCounter.add(1, attrs);
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = { ...attrs };
    addRunAttrs(spanAttrs, evt);
    const span = spanWithDuration("operator.skill.used", spanAttrs, 0, {
      parentContext: activeTrustedParentContext(evt, metadata),
      endTimeMs: evt.ts,
    });
    setSpanAttrs(span, spanAttrs);
    span.end(evt.ts);
  };

  const recordToolExecutionStarted = (
    evt: Extract<DiagnosticEventPayload, { type: "tool.execution.started" }>,
    metadata: DiagnosticEventMetadata,
  ) => {
    if (!tracesEnabled || !metadata.trusted) {
      return;
    }
    const spanAttrs = toolExecutionBaseAttrs(evt);
    assignOtelToolIdentityAttributes(spanAttrs, evt);
    trackTrustedSpan(
      evt,
      metadata,
      spanWithDuration("operator.tool.execution", spanAttrs, undefined, {
        parentContext: activeTrustedParentContext(evt, metadata),
        startTimeMs: evt.ts,
      }),
    );
  };

  const recordToolExecutionCompleted = (
    evt: Extract<DiagnosticEventPayload, { type: "tool.execution.completed" }>,
    metadata: DiagnosticEventMetadata,
    toolContent?: OtelToolCallContent,
  ) => {
    const attrs = toolExecutionBaseAttrs(evt);
    toolExecutionDurationHistogram.record(evt.durationMs, attrs);
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = { ...attrs };
    addRunAttrs(spanAttrs, evt);
    assignOtelToolIdentityAttributes(spanAttrs, evt);
    assignOtelToolContentAttributes(spanAttrs, toolContent, contentCapturePolicy);
    const span =
      takeTrackedTrustedSpan(evt, metadata) ??
      spanWithDuration("operator.tool.execution", spanAttrs, evt.durationMs, {
        parentContext: activeTrustedParentContext(evt, metadata),
        endTimeMs: evt.ts,
      });
    setSpanAttrs(span, spanAttrs);
    span.end(evt.ts);
  };

  const recordToolExecutionError = (
    evt: Extract<DiagnosticEventPayload, { type: "tool.execution.error" }>,
    metadata: DiagnosticEventMetadata,
    toolContent?: OtelToolCallContent,
  ) => {
    const attrs = {
      ...toolExecutionBaseAttrs(evt),
      "operator.errorCategory": lowCardinalityAttr(evt.errorCategory, "other"),
    };
    toolExecutionDurationHistogram.record(evt.durationMs, attrs);
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = { ...attrs };
    addRunAttrs(spanAttrs, evt);
    assignOtelToolIdentityAttributes(spanAttrs, evt);
    if (evt.errorCode) {
      spanAttrs["operator.errorCode"] = lowCardinalityAttr(evt.errorCode, "other");
    }
    assignOtelToolContentAttributes(spanAttrs, toolContent, contentCapturePolicy);
    const span =
      takeTrackedTrustedSpan(evt, metadata) ??
      spanWithDuration("operator.tool.execution", spanAttrs, evt.durationMs, {
        parentContext: activeTrustedParentContext(evt, metadata),
        endTimeMs: evt.ts,
      });
    setSpanAttrs(span, spanAttrs);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: redactSensitiveText(evt.errorCategory),
    });
    span.end(evt.ts);
  };

  const recordToolExecutionBlocked = (
    evt: Extract<DiagnosticEventPayload, { type: "tool.execution.blocked" }>,
    metadata: DiagnosticEventMetadata,
  ) => {
    toolExecutionBlockedCounter.add(1, {
      ...toolExecutionBaseAttrs(evt),
      "operator.deniedReason": lowCardinalityAttr(evt.deniedReason, "other"),
    });
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = {
      ...toolExecutionBaseAttrs(evt),
      "operator.outcome": "blocked",
      "operator.deniedReason": lowCardinalityAttr(evt.deniedReason, "other"),
    };
    addRunAttrs(spanAttrs, evt);
    assignOtelToolIdentityAttributes(spanAttrs, evt);
    const span = spanWithDuration("operator.tool.execution", spanAttrs, 0, {
      parentContext: activeTrustedParentContext(evt, metadata),
      endTimeMs: evt.ts,
    });
    setSpanAttrs(span, spanAttrs);
    span.end(evt.ts);
  };

  const recordPayloadLarge = (evt: Extract<DiagnosticEventPayload, { type: "payload.large" }>) => {
    const attrs = {
      "operator.payload.action": evt.action,
      "operator.payload.surface": lowCardinalityAttr(evt.surface, "unknown"),
      "operator.channel": lowCardinalityAttr(evt.channel, "none"),
      "operator.plugin": lowCardinalityAttr(evt.pluginId, "none"),
      "operator.reason": lowCardinalityAttr(evt.reason, "none"),
    };
    payloadLargeCounter.add(1, attrs);
    const bytes = positiveFiniteNumber(evt.bytes);
    if (bytes !== undefined) {
      payloadLargeBytesHistogram.record(bytes, attrs);
    }
  };

  const recordExecProcessCompleted = (
    evt: Extract<DiagnosticEventPayload, { type: "exec.process.completed" }>,
  ) => {
    const attrs: Record<string, string | number> = {
      "operator.exec.target": evt.target,
      "operator.exec.mode": evt.mode,
      "operator.outcome": evt.outcome,
    };
    if (evt.failureKind) {
      attrs["operator.failureKind"] = evt.failureKind;
    }
    execProcessDurationHistogram.record(evt.durationMs, attrs);
    if (!tracesEnabled) {
      return;
    }

    const spanAttrs: Record<string, string | number | boolean> = {
      ...attrs,
      "operator.exec.command_length": evt.commandLength,
    };
    if (typeof evt.exitCode === "number") {
      spanAttrs["operator.exec.exit_code"] = evt.exitCode;
    }
    if (evt.exitSignal) {
      spanAttrs["operator.exec.exit_signal"] = lowCardinalityAttr(evt.exitSignal, "other");
    }
    if (evt.timedOut !== undefined) {
      spanAttrs["operator.exec.timed_out"] = evt.timedOut;
    }

    const span = spanWithDuration("operator.exec", spanAttrs, evt.durationMs, {
      endTimeMs: evt.ts,
    });
    if (evt.outcome === "failed") {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        ...(evt.failureKind ? { message: evt.failureKind } : {}),
      });
    }
    span.end(evt.ts);
  };

  const recordHeartbeat = (
    evt: Extract<DiagnosticEventPayload, { type: "diagnostic.heartbeat" }>,
  ) => {
    queueDepthHistogram.record(evt.queued, { "operator.channel": "heartbeat" });
  };

  const recordLivenessWarning = (
    evt: Extract<DiagnosticEventPayload, { type: "diagnostic.liveness.warning" }>,
  ) => {
    const reason = evt.reasons.join(":");
    const attrs = {
      "operator.liveness.reason": lowCardinalityAttr(reason, "unknown"),
    };
    livenessWarningCounter.add(1, attrs);
    queueDepthHistogram.record(evt.queued, { "operator.channel": "liveness" });
    if (evt.eventLoopDelayP99Ms !== undefined) {
      livenessEventLoopDelayP99Histogram.record(evt.eventLoopDelayP99Ms, attrs);
    }
    if (evt.eventLoopDelayMaxMs !== undefined) {
      livenessEventLoopDelayMaxHistogram.record(evt.eventLoopDelayMaxMs, attrs);
    }
    if (evt.eventLoopUtilization !== undefined) {
      livenessEventLoopUtilizationHistogram.record(evt.eventLoopUtilization, attrs);
    }
    if (evt.cpuCoreRatio !== undefined) {
      livenessCpuCoreRatioHistogram.record(evt.cpuCoreRatio, attrs);
    }
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number> = {
      ...attrs,
      "operator.liveness.active": evt.active,
      "operator.liveness.waiting": evt.waiting,
      "operator.liveness.queued": evt.queued,
      "operator.liveness.interval_ms": evt.intervalMs,
      ...(evt.eventLoopDelayP99Ms !== undefined
        ? { "operator.liveness.event_loop_delay_p99_ms": evt.eventLoopDelayP99Ms }
        : {}),
      ...(evt.eventLoopDelayMaxMs !== undefined
        ? { "operator.liveness.event_loop_delay_max_ms": evt.eventLoopDelayMaxMs }
        : {}),
      ...(evt.eventLoopUtilization !== undefined
        ? { "operator.liveness.event_loop_utilization": evt.eventLoopUtilization }
        : {}),
      ...(evt.cpuUserMs !== undefined ? { "operator.liveness.cpu_user_ms": evt.cpuUserMs } : {}),
      ...(evt.cpuSystemMs !== undefined
        ? { "operator.liveness.cpu_system_ms": evt.cpuSystemMs }
        : {}),
      ...(evt.cpuTotalMs !== undefined ? { "operator.liveness.cpu_total_ms": evt.cpuTotalMs } : {}),
      ...(evt.cpuCoreRatio !== undefined
        ? { "operator.liveness.cpu_core_ratio": evt.cpuCoreRatio }
        : {}),
    };
    const span = spanWithDuration("operator.liveness.warning", spanAttrs, 0, {
      endTimeMs: evt.ts,
    });
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: reason,
    });
    span.end(evt.ts);
  };

  const recordDiagnosticPhaseCompleted = (
    evt: Extract<DiagnosticEventPayload, { type: "diagnostic.phase.completed" }>,
  ) => {
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number> = {
      "operator.phase": lowCardinalityAttr(evt.name, "unknown"),
      ...(evt.cpuUserMs !== undefined ? { "operator.phase.cpu_user_ms": evt.cpuUserMs } : {}),
      ...(evt.cpuSystemMs !== undefined ? { "operator.phase.cpu_system_ms": evt.cpuSystemMs } : {}),
      ...(evt.cpuTotalMs !== undefined ? { "operator.phase.cpu_total_ms": evt.cpuTotalMs } : {}),
      ...(evt.cpuCoreRatio !== undefined
        ? { "operator.phase.cpu_core_ratio": evt.cpuCoreRatio }
        : {}),
    };
    for (const [key, value] of Object.entries(evt.details ?? {})) {
      spanAttrs[`operator.phase.detail.${key}`] =
        typeof value === "boolean" ? String(value) : value;
    }
    const span = spanWithDuration("operator.diagnostic.phase", spanAttrs, evt.durationMs, {
      endTimeMs: evt.ts,
    });
    span.end(evt.ts);
  };

  const recordTelemetryExporter = (
    evt: TelemetryExporterDiagnosticEvent,
    metadata: DiagnosticEventMetadata,
  ) => {
    if (!metadata.trusted) {
      return;
    }
    telemetryExporterCounter.add(1, {
      "operator.exporter": lowCardinalityAttr(evt.exporter, "unknown"),
      "operator.signal": evt.signal,
      "operator.status": evt.status,
      ...(evt.reason ? { "operator.reason": evt.reason } : {}),
      ...(evt.errorCategory
        ? { "operator.errorCategory": lowCardinalityAttr(evt.errorCategory, "other") }
        : {}),
    });
  };

  return {
    recordSkillUsed,
    recordToolExecutionStarted,
    recordToolExecutionCompleted,
    recordToolExecutionError,
    recordToolExecutionBlocked,
    recordPayloadLarge,
    recordExecProcessCompleted,
    recordHeartbeat,
    recordLivenessWarning,
    recordDiagnosticPhaseCompleted,
    recordTelemetryExporter,
  };
}
