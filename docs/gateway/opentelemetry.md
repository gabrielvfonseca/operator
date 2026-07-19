---
summary: "Export Operator diagnostics to OpenTelemetry collectors or stdout JSONL via the diagnostics-otel plugin"
title: "OpenTelemetry export"
read_when:
  - You want to send Operator model usage, message flow, or session metrics to an OpenTelemetry collector
  - You are wiring traces, metrics, or logs into Grafana, Datadog, Honeycomb, New Relic, Tempo, or another OTLP backend
  - You need the exact metric names, span names, or attribute shapes to build dashboards or alerts
---

Operator exports diagnostics through the official `diagnostics-otel` plugin
using **OTLP/HTTP (protobuf)**. Logs can also be written as stdout JSONL for
container and sandbox log pipelines. Any collector or backend that accepts
OTLP/HTTP works without code changes. For local file logs, see
[Logging](/logging).

- **Diagnostics events** are structured, in-process records emitted by the
  Gateway and bundled plugins for model runs, message flow, sessions, queues,
  and exec.
- **`diagnostics-otel`** subscribes to those events and exports them as
  OpenTelemetry **metrics**, **traces**, and **logs** over OTLP/HTTP, and can
  mirror log records to stdout JSONL.
- **Provider calls** receive a W3C `traceparent` header from Operator's
  trusted model-call span context when the provider transport accepts custom
  headers. Plugin-emitted trace context is not propagated.
- Exporters attach only when both the diagnostics surface and the plugin are
  enabled, so in-process cost stays near zero by default.

## Quick start

```bash
operator plugins install clawhub:@gabrielvfonseca/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "operator-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

Or enable the plugin from the CLI: `operator plugins enable diagnostics-otel`.

<Note>
`protocol` supports `http/protobuf` only. Since `traces` and `metrics` default to enabled, any other value (including `grpc`) aborts the entire diagnostics-otel subscription with an `unsupported protocol` warning - this also stops stdout log export. Explicitly set `traces: false` and `metrics: false` if you only want `logsExporter: "stdout"` with a non-OTLP protocol value.
</Note>

## Signals exported

| Signal      | What goes in it                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | Counters/histograms for token usage, cost, run duration, failover, skill usage, message flow, Talk events, queue lanes, session state/recovery, tool execution, exec, memory, liveness, and exporter health. |
| **Traces**  | Spans for model usage, model calls, harness lifecycle, skill usage, tool execution, exec, webhook/message processing, context assembly, and tool loops.                                                      |
| **Logs**    | Structured `logging.file` records exported over OTLP or stdout JSONL when `diagnostics.otel.logs` is enabled; log bodies are withheld unless content capture is explicitly enabled.                          |

Toggle `traces`, `metrics`, and `logs` independently. Traces and metrics
default to on when `diagnostics.otel.enabled` is true; logs default to off
and export only when `diagnostics.otel.logs` is explicitly `true`. Log export
defaults to OTLP; set `diagnostics.otel.logsExporter` to `stdout` for JSONL on
stdout, or `both` for both.

## Configuration reference

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc disables OTLP export
      serviceName: "operator-gateway", // unset falls back to OTEL_SERVICE_NAME, then "@gabrielvfonseca/operator"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### Environment variables

| Variable                                                                                                          | Purpose                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Fallback for `diagnostics.otel.endpoint` when the config key is unset.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Signal-specific endpoint fallbacks used when the matching `diagnostics.otel.*Endpoint` config key is unset. Signal-specific config wins over signal-specific env, which wins over the shared endpoint.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Fallback for `diagnostics.otel.serviceName` when the config key is unset. Default service name is `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Fallback for the wire protocol when `diagnostics.otel.protocol` is unset. Only `http/protobuf` enables export.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Set to `gen_ai_latest_experimental` to emit the latest GenAI inference span shape: `{gen_ai.operation.name} {gen_ai.request.model}` span names, `CLIENT` span kind, and `gen_ai.provider.name` instead of the legacy `gen_ai.system`. GenAI metrics always use bounded, low-cardinality attributes regardless. |
| `OPERATOR_OTEL_PRELOADED`                                                                                         | Set to `1` when another preload or host process already registered the global OpenTelemetry SDK. The plugin then skips its own NodeSDK lifecycle but still wires diagnostic listeners and honors `traces`/`metrics`/`logs`.                                                                                    |

## Privacy and content capture

Raw model/tool content is **not** exported by default. Spans carry bounded
identifiers (channel, provider, model, error category, hash-only request ids,
tool source, tool owner, skill name/source) and never include prompt text,
response text, tool inputs, tool outputs, skill file paths, or session keys.
Values that look like scoped agent session keys (for example starting with
`agent:`) are replaced with `unknown` on low-cardinality attributes. OTLP log
records keep severity, logger, code location, trusted trace context, and
sanitized attributes by default; the raw log message body is exported only
when `diagnostics.otel.captureContent` is boolean `true`. Granular
`captureContent.*` subkeys never enable log bodies. Talk metrics export only
bounded event metadata (mode, transport, provider, event type) - no
transcripts, audio payloads, session ids, turn ids, call ids, room ids, or
handoff tokens.

Outbound model requests may include a W3C `traceparent` header generated only
from Operator-owned diagnostic trace context for the active model call.
Existing caller-supplied `traceparent` headers are replaced, so plugins or
custom provider options cannot spoof cross-service trace ancestry.

Set `diagnostics.otel.captureContent.*` to `true` only when your collector
and retention policy are approved for prompt, response, tool, or
system-prompt text. Each subkey is independent:

- `inputMessages` - user prompt content.
- `outputMessages` - model response content.
- `toolInputs` - tool argument payloads.
- `toolOutputs` - tool result payloads.
- `systemPrompt` - assembled system/developer prompt.
- `toolDefinitions` - model tool names, descriptions, and schemas.

When any subkey is enabled, model and tool spans get bounded, redacted
`operator.content.*` attributes for that class only.

<Note>
Boolean `captureContent: true` enables `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions`, and OTLP log bodies together, but **not** `systemPrompt` - set `captureContent.systemPrompt: true` explicitly if you also need the assembled system prompt.
</Note>

`toolInputs`/`toolOutputs` content is captured for the built-in agent
runtime's tool executions (`operator.content.tool_input` and
`gen_ai.tool.call.arguments` on completed/error spans;
`operator.content.tool_output` and `gen_ai.tool.call.result` on completed
spans). The `operator.content.*` names remain the stable Operator attribute
names; the `gen_ai.tool.call.*` copies mirror them for semconv-native viewers.
External harness tool calls (Codex, Claude CLI) emit
`tool.execution.*` spans without content payloads. Captured content travels on a
trusted, listener-only channel and is never placed on the public diagnostic event
bus.

## Sampling and flushing

- **Traces:** `diagnostics.otel.sampleRate` sets a `TraceIdRatioBasedSampler`
  on the root span only (`0.0` drops all, `1.0` keeps all). Unset uses the
  OpenTelemetry SDK default (always-on).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (clamped to a minimum of
  `1000`); unset uses the SDK's periodic-export default.
- **Logs:** OTLP logs respect `logging.level` (file log level) and use the
  diagnostic log-record redaction path, not console formatting. High-volume
  installs should prefer OTLP collector sampling/filtering over local
  sampling. Set `diagnostics.otel.logsExporter: "stdout"` when your platform
  already ships stdout/stderr to a log processor and you have no OTLP logs
  collector. Stdout records are one JSON object per line with `ts`, `signal`,
  `service.name`, severity, body, redacted attributes, and trusted trace
  fields when available.
- **File-log correlation:** JSONL file logs include top-level `traceId`,
  `spanId`, `parentSpanId`, and `traceFlags` when the log call carries a valid
  diagnostic trace context, letting log processors join local log lines with
  exported spans.
- **Request correlation:** Gateway HTTP requests and WebSocket frames create
  an internal request trace scope. Logs and diagnostic events inside that
  scope inherit the request trace by default, while agent run and model-call
  spans are created as children so provider `traceparent` headers stay on the
  same trace.
- **Model-call correlation:** `operator.model.call` spans include safe prompt
  component sizes by default and per-call token attributes when the provider
  result exposes usage. `operator.model.usage` remains the run-level
  accounting span for aggregate cost, context, and channel dashboards, and
  stays on the same diagnostic trace when the emitting runtime has trusted
  trace context.

## Exported metrics

### Model usage

- `operator.tokens` (counter, attrs: `operator.token`, `operator.channel`, `operator.provider`, `operator.model`, `operator.agent`)
- `operator.cost.usd` (counter, attrs: `operator.channel`, `operator.provider`, `operator.model`)
- `operator.run.duration_ms` (histogram, attrs: `operator.channel`, `operator.provider`, `operator.model`)
- `operator.context.tokens` (histogram, attrs: `operator.context`, `operator.channel`, `operator.provider`, `operator.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconds, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `operator.model_call.duration_ms` (histogram, attrs: `operator.provider`, `operator.model`, `operator.api`, `operator.transport`, plus `operator.errorCategory` and `operator.failureKind` on classified errors)
- `operator.model_call.request_bytes` (histogram, UTF-8 byte size of the final model request payload; no raw payload content)
- `operator.model_call.response_bytes` (histogram, UTF-8 byte size of streamed response chunk payloads; high-frequency text, thinking, and tool-call deltas count only incremental `delta` bytes; no raw response content)
- `operator.model_call.time_to_first_byte_ms` (histogram, elapsed time before the first streamed response event)
- `operator.model.failover` (counter, attrs: `operator.provider`, `operator.model`, `operator.failover.to_provider`, `operator.failover.to_model`, `operator.failover.reason`, `operator.failover.suspended`, `operator.lane`)
- `operator.skill.used` (counter, attrs: `operator.skill.name`, `operator.skill.source`, `operator.skill.activation`, optional `operator.agent`, optional `operator.toolName`)

### Message flow

- `operator.webhook.received` (counter, attrs: `operator.channel`, `operator.webhook`)
- `operator.webhook.error` (counter, attrs: `operator.channel`, `operator.webhook`)
- `operator.webhook.duration_ms` (histogram, attrs: `operator.channel`, `operator.webhook`)
- `operator.message.queued` (counter, attrs: `operator.channel`, `operator.source`)
- `operator.message.received` (counter, attrs: `operator.channel`, `operator.source`)
- `operator.message.dispatch.started` (counter, attrs: `operator.channel`, `operator.source`)
- `operator.message.dispatch.completed` (counter, attrs: `operator.channel`, `operator.outcome`, `operator.reason`, `operator.source`)
- `operator.message.dispatch.duration_ms` (histogram, attrs: `operator.channel`, `operator.outcome`, `operator.reason`, `operator.source`)
- `operator.message.processed` (counter, attrs: `operator.channel`, `operator.outcome`)
- `operator.message.duration_ms` (histogram, attrs: `operator.channel`, `operator.outcome`)
- `operator.message.delivery.started` (counter, attrs: `operator.channel`, `operator.delivery.kind`)
- `operator.message.delivery.duration_ms` (histogram, attrs: `operator.channel`, `operator.delivery.kind`, `operator.outcome`, `operator.errorCategory`)

### Talk

- `operator.talk.event` (counter, attrs: `operator.talk.event_type`, `operator.talk.mode`, `operator.talk.transport`, `operator.talk.brain`, `operator.talk.provider`)
- `operator.talk.event.duration_ms` (histogram, attrs: same as `operator.talk.event`; emitted when a Talk event reports duration)
- `operator.talk.audio.bytes` (histogram, attrs: same as `operator.talk.event`; emitted for Talk audio frame events that report byte length)

### Queues and sessions

- `operator.queue.lane.enqueue` (counter, attrs: `operator.lane`)
- `operator.queue.lane.dequeue` (counter, attrs: `operator.lane`)
- `operator.queue.depth` (histogram, attrs: `operator.lane` or `operator.channel=heartbeat`)
- `operator.queue.wait_ms` (histogram, attrs: `operator.lane`)
- `operator.session.state` (counter, attrs: `operator.state`, `operator.reason`)
- `operator.session.stuck` (counter, attrs: `operator.state`; emitted for recoverable stale session bookkeeping)
- `operator.session.stuck_age_ms` (histogram, attrs: `operator.state`; emitted for recoverable stale session bookkeeping)
- `operator.session.turn.created` (counter, attrs: `operator.agent`, `operator.channel`, `operator.trigger`)
- `operator.session.recovery.requested` (counter, attrs: `operator.state`, `operator.action`, `operator.active_work_kind`, `operator.reason`)
- `operator.session.recovery.completed` (counter, attrs: `operator.state`, `operator.action`, `operator.status`, `operator.active_work_kind`, `operator.reason`)
- `operator.session.recovery.age_ms` (histogram, attrs: same as the matching recovery counter)
- `operator.run.attempt` (counter, attrs: `operator.attempt`)

### Session liveness telemetry

`diagnostics.stuckSessionWarnMs` is the no-progress age threshold for session
liveness diagnostics. A `processing` session does not age toward this
threshold while Operator observes reply, tool, status, block, or ACP runtime
progress. Typing keepalives do not count as progress, so a silent model or
harness can still be detected.

Operator classifies sessions by the work it can still observe:

- `session.long_running`: active embedded work, model calls, or tool calls
  are still making progress. Owned model calls that stay silent past
  `diagnostics.stuckSessionWarnMs` also report as long-running before
  `diagnostics.stuckSessionAbortMs`, so slow or non-streaming model providers
  do not look like stalled gateway sessions while abort-observable.
- `session.stalled`: active work exists, but the active run has not reported
  recent progress. Owned model calls switch from `session.long_running` to
  `session.stalled` at or after `diagnostics.stuckSessionAbortMs`; ownerless
  stale model/tool activity is not treated as harmless long-running work.
  Stalled embedded runs stay observe-only at first, then abort-drain after
  `diagnostics.stuckSessionAbortMs` with no progress so queued turns behind
  the lane can resume. When unset, the abort threshold defaults to the safer
  extended window of at least 5 minutes and 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: stale session bookkeeping with no active work, or an idle
  queued session with stale ownerless model/tool activity. This releases the
  affected session lane immediately after recovery gates pass.

Recovery emits structured `session.recovery.requested` and
`session.recovery.completed` events. Diagnostic session state is marked idle
only after a mutating recovery outcome (`aborted` or `released`) and only if
the same processing generation is still current.

Only `session.stuck` emits the `operator.session.stuck` counter, the
`operator.session.stuck_age_ms` histogram, and the `operator.session.stuck`
span. Repeated `session.stuck` diagnostics back off while the session remains
unchanged, so dashboards should alert on sustained increases rather than
every heartbeat tick. For the config knob and defaults, see
[Configuration reference](/gateway/configuration-reference#diagnostics).

Liveness warnings also emit:

- `operator.liveness.warning` (counter, attrs: `operator.liveness.reason`)
- `operator.liveness.event_loop_delay_p99_ms` (histogram, attrs: `operator.liveness.reason`)
- `operator.liveness.event_loop_delay_max_ms` (histogram, attrs: `operator.liveness.reason`)
- `operator.liveness.event_loop_utilization` (histogram, attrs: `operator.liveness.reason`)
- `operator.liveness.cpu_core_ratio` (histogram, attrs: `operator.liveness.reason`)

### Harness lifecycle

- `operator.harness.duration_ms` (histogram, attrs: `operator.harness.id`, `operator.harness.plugin`, `operator.outcome`, `operator.harness.phase` on errors)

### Tool execution and loop detection

- `operator.tool.execution.duration_ms` (histogram, attrs: `gen_ai.tool.name`, `operator.toolName`, `operator.tool.source`, `operator.tool.owner`, `operator.tool.params.kind`, plus `operator.errorCategory` on errors)
- `operator.tool.execution.blocked` (counter, attrs: `gen_ai.tool.name`, `operator.toolName`, `operator.tool.source`, `operator.tool.owner`, `operator.tool.params.kind`, `operator.deniedReason`)
- `operator.tool.loop` (counter, attrs: `operator.toolName`, `operator.loop.level`, `operator.loop.action`, `operator.loop.detector`, `operator.loop.count`, optional `operator.loop.paired_tool`; emitted when a repetitive tool-call loop is detected)

### Exec

- `operator.exec.duration_ms` (histogram, attrs: `operator.exec.target`, `operator.exec.mode`, `operator.outcome`, `operator.failureKind`)

### Diagnostics internals (memory, payloads, exporter health)

- `operator.payload.large` (counter, attrs: `operator.payload.surface`, `operator.payload.action`, `operator.channel`, `operator.plugin`, `operator.reason`)
- `operator.payload.large_bytes` (histogram, attrs: same as `operator.payload.large`)
- `operator.memory.rss_bytes` / `operator.memory.heap_used_bytes` / `operator.memory.heap_total_bytes` / `operator.memory.external_bytes` / `operator.memory.array_buffers_bytes` (histograms, no attrs; process memory samples)
- `operator.memory.pressure` (counter, attrs: `operator.memory.level`, `operator.memory.reason`)
- `operator.diagnostic.async_queue.dropped` (counter, attrs: `operator.diagnostic.async_queue.drop_class`; internal diagnostic-queue backpressure drops)
- `operator.telemetry.exporter.events` (counter, attrs: `operator.exporter`, `operator.signal`, `operator.status`, optional `operator.reason`, optional `operator.errorCategory`; exporter lifecycle/failure self-telemetry)

## Exported spans

- `operator.model.usage`
  - `operator.channel`, `operator.provider`, `operator.model`
  - `operator.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` by default, or `gen_ai.provider.name` when the latest GenAI semantic conventions are opted in
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `operator.run`
  - `operator.outcome`, `operator.channel`, `operator.provider`, `operator.model`, `operator.errorCategory`
- `operator.model.call`
  - `gen_ai.system` by default, or `gen_ai.provider.name` when the latest GenAI semantic conventions are opted in
  - `gen_ai.request.model`, `gen_ai.operation.name`, `operator.provider`, `operator.model`, `operator.api`, `operator.transport`
  - `operator.errorCategory`, `error.type`, and optional `operator.failureKind` on errors
  - `operator.model_call.request_bytes`, `operator.model_call.response_bytes`, `operator.model_call.time_to_first_byte_ms`
  - `operator.model_call.prompt.input_messages_count`, `operator.model_call.prompt.input_messages_chars`, `operator.model_call.prompt.system_prompt_chars`, `operator.model_call.prompt.tool_definitions_count`, `operator.model_call.prompt.tool_definitions_chars`, `operator.model_call.prompt.total_chars` (safe component sizes only, no prompt text)
  - `operator.model_call.usage.*` and `gen_ai.usage.*` when the model-call result carries provider usage for that individual call
  - Span event `operator.provider.request` with attribute `operator.upstreamRequestIdHash` (bounded, hash-based) when the upstream provider result exposes a request id; raw ids are never exported
  - With `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, model-call spans use the latest GenAI inference span name `{gen_ai.operation.name} {gen_ai.request.model}` and `CLIENT` span kind instead of `operator.model.call`.
- `operator.harness.run`
  - `operator.harness.id`, `operator.harness.plugin`, `operator.outcome`, `operator.provider`, `operator.model`, `operator.channel`
  - On completion: `operator.harness.result_classification`, `operator.harness.yield_detected`, `operator.harness.items.started`, `operator.harness.items.completed`, `operator.harness.items.active`
  - On error: `operator.harness.phase`, `operator.errorCategory`, optional `operator.harness.cleanup_failed`
- `operator.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `operator.toolName`, `operator.tool.source`, optional `gen_ai.tool.call.id`, `operator.tool.owner`, `operator.tool.params.*`
  - Optional `operator.errorCategory`/`operator.errorCode` on errors, `operator.deniedReason` and `operator.outcome=blocked` when denied by policy or sandbox
- `operator.exec`
  - `operator.exec.target`, `operator.exec.mode`, `operator.outcome`, `operator.failureKind`, `operator.exec.command_length`, `operator.exec.exit_code`, `operator.exec.exit_signal`, `operator.exec.timed_out`
- `operator.webhook.processed`
  - `operator.channel`, `operator.webhook`
- `operator.webhook.error`
  - `operator.channel`, `operator.webhook`, `operator.error`
- `operator.message.processed`
  - `operator.channel`, `operator.outcome`, `operator.reason`
- `operator.message.delivery`
  - `operator.channel`, `operator.delivery.kind`, `operator.outcome`, `operator.errorCategory`, `operator.delivery.result_count`
- `operator.session.stuck`
  - `operator.state`, `operator.ageMs`, `operator.queueDepth`
- `operator.context.assembled`
  - `operator.prompt.size`, `operator.history.size`, `operator.context.tokens`, `operator.errorCategory` (no prompt, history, response, or session-key content)
- `operator.tool.loop`
  - `operator.toolName`, `operator.loop.level`, `operator.loop.action`, `operator.loop.detector`, `operator.loop.count`, optional `operator.loop.paired_tool` (no loop messages, params, or tool output)
- `operator.memory.pressure`
  - `operator.memory.level`, `operator.memory.reason`, `operator.memory.rss_bytes`, `operator.memory.heap_used_bytes`, `operator.memory.heap_total_bytes`, `operator.memory.external_bytes`, `operator.memory.array_buffers_bytes`, optional `operator.memory.threshold_bytes`/`operator.memory.rss_growth_bytes`/`operator.memory.window_ms`

When content capture is explicitly enabled, model and tool spans can also
include bounded, redacted `operator.content.*` attributes for the specific
content classes you opted into.

## Diagnostic event catalog

The events below back the metrics and spans above. Plugins can also
subscribe to them directly without OTLP export.

**Model usage**

- `model.usage` - tokens, cost, duration, context, provider/model/channel,
  session ids. `usage` is provider/turn accounting for cost and telemetry;
  `context.used` is the current prompt/context snapshot and can be lower than
  provider `usage.total` when cached input or tool-loop calls are involved.

**Message flow**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Queue and session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (aggregate counters: webhooks/queue/session)

**Harness lifecycle**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  per-run lifecycle for the agent harness. Includes `harnessId`, optional
  `pluginId`, provider/model/channel, and run id. Completion adds
  `durationMs`, `outcome`, optional `resultClassification`, `yieldDetected`,
  and `itemLifecycle` counts. Errors add `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, and
  optional `cleanupFailed`.

**Exec**

- `exec.process.completed` - terminal outcome, duration, target, mode, exit
  code, and failure kind. Command text and working directories are not
  included.
- `exec.approval.followup_suppressed` - stale approval follow-up dropped
  after a session rebound. Includes `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` or `gateway_preflight`),
  and the dispatcher timestamp. Session keys, routes, and command text are
  not included.

## Without an exporter

Keep diagnostics events available to plugins or custom sinks without running
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

For targeted debug output without raising `logging.level`, use diagnostics
flags. Flags are case-insensitive and support wildcards (`telegram.*` or
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Or as a one-off env override:

```bash
OPERATOR_DIAGNOSTICS=telegram.http,telegram.payload operator gateway
```

Flag output goes to the standard log file (`logging.file`) and is still
redacted by `logging.redactSensitive`. Full guide:
[Diagnostics flags](/diagnostics/flags).

## Disable

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Or leave `diagnostics-otel` out of `plugins.allow`, or run
`operator plugins disable diagnostics-otel`.

## Related

- [Logging](/logging) - file logs, console output, CLI tailing, and the Control UI Logs tab
- [Gateway logging internals](/gateway/logging) - WS log styles, subsystem prefixes, and console capture
- [Diagnostics flags](/diagnostics/flags) - targeted debug-log flags
- [Diagnostics export](/gateway/diagnostics) - operator support-bundle tool (separate from OTEL export)
- [Configuration reference](/gateway/configuration-reference#diagnostics) - full `diagnostics.*` field reference
