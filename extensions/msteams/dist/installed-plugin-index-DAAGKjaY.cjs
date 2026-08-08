const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./path-safety-m1VY3jod.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_default_enablement = require("./default-enablement-ClBEzpPw.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/compat/registry.ts
const CHANNEL_RUNTIME_SDK_SURFACE = ["operator/plugin-sdk/channel", "runtime"].join("-");
const LEGACY_CONFIG_MIGRATE_TEST_PATH = ["src/commands/doctor/shared/legacy-config", "migrate.test.ts"].join("-");
const DEPRECATED_PLUGIN_SDK_SUBPATH_RECORDS = [
	{
		code: "plugin-sdk-self-hosted-provider-setup-subpath",
		subpath: "self-hosted-provider-setup",
		owner: "provider",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/provider-setup`"
	},
	{
		code: "plugin-sdk-runtime-logger-subpath",
		subpath: "runtime-logger",
		owner: "sdk",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/runtime`"
	},
	{
		code: "plugin-sdk-runtime-secret-resolution-subpath",
		subpath: "runtime-secret-resolution",
		owner: "sdk",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/runtime` and `operator/plugin-sdk/secret-ref-runtime`"
	},
	{
		code: "plugin-sdk-setup-adapter-runtime-subpath",
		subpath: "setup-adapter-runtime",
		owner: "setup",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/setup-runtime`"
	},
	{
		code: "plugin-sdk-channel-streaming-subpath",
		subpath: "channel-streaming",
		owner: "channel",
		removeAfter: "2026-08-15",
		replacement: "`operator/plugin-sdk/channel-outbound`"
	},
	{
		code: "plugin-sdk-config-runtime-subpath",
		subpath: "config-runtime",
		owner: "config",
		removeAfter: "2026-09-01",
		replacement: "`operator/plugin-sdk/plugin-config-runtime`, `operator/plugin-sdk/config-mutation`, `operator/plugin-sdk/runtime-config-snapshot`, and `operator/plugin-sdk/config-contracts`"
	},
	{
		code: "plugin-sdk-config-types-subpath",
		subpath: "config-types",
		owner: "config",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/config-contracts`"
	},
	{
		code: "plugin-sdk-config-schema-subpath",
		subpath: "config-schema",
		owner: "config",
		removeAfter: "2026-07-30",
		replacement: "plugin-local schemas with `operator/plugin-sdk/json-schema-runtime` for JSON Schema validation"
	},
	{
		code: "plugin-sdk-reply-dedupe-subpath",
		subpath: "reply-dedupe",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/reply-runtime`"
	},
	{
		code: "plugin-sdk-inbound-reply-dispatch-subpath",
		subpath: "inbound-reply-dispatch",
		owner: "channel",
		removeAfter: "2026-08-15",
		replacement: "`operator/plugin-sdk/channel-inbound` and `operator/plugin-sdk/channel-outbound`"
	},
	{
		code: "plugin-sdk-channel-reply-pipeline-subpath",
		subpath: "channel-reply-pipeline",
		owner: "channel",
		removeAfter: "2026-09-01",
		replacement: "`operator/plugin-sdk/channel-outbound`"
	},
	{
		code: "plugin-sdk-channel-reply-options-runtime-subpath",
		subpath: "channel-reply-options-runtime",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/channel-outbound`"
	},
	{
		code: "plugin-sdk-outbound-send-deps-subpath",
		subpath: "outbound-send-deps",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/channel-outbound`"
	},
	{
		code: "plugin-sdk-outbound-runtime-subpath",
		subpath: "outbound-runtime",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/channel-outbound`"
	},
	{
		code: "plugin-sdk-infra-runtime-subpath",
		subpath: "infra-runtime",
		owner: "sdk",
		removeAfter: "2026-09-01",
		replacement: "focused subpaths including `operator/plugin-sdk/delivery-queue-runtime`, `operator/plugin-sdk/diagnostic-runtime`, `operator/plugin-sdk/error-runtime`, `operator/plugin-sdk/exec-approvals-runtime`, `operator/plugin-sdk/fetch-runtime`, and `operator/plugin-sdk/ssrf-runtime`"
	},
	{
		code: "plugin-sdk-text-runtime-subpath",
		subpath: "text-runtime",
		owner: "sdk",
		removeAfter: "2026-08-15",
		replacement: "`operator/plugin-sdk/logging-core`, `operator/plugin-sdk/text-chunking`, `operator/plugin-sdk/text-utility-runtime`, and `operator/plugin-sdk/string-coerce-runtime`"
	},
	{
		code: "plugin-sdk-channel-secret-runtime-subpath",
		subpath: "channel-secret-runtime",
		owner: "channel",
		removeAfter: "2026-08-15",
		replacement: "`operator/plugin-sdk/channel-secret-basic-runtime` and `operator/plugin-sdk/channel-secret-tts-runtime`"
	},
	{
		code: "plugin-sdk-agent-config-primitives-subpath",
		subpath: "agent-config-primitives",
		owner: "config",
		removeAfter: "2026-08-15",
		replacement: "`operator/plugin-sdk/channel-config-schema`"
	},
	{
		code: "plugin-sdk-direct-dm-subpath",
		subpath: "direct-dm",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/channel-inbound`"
	},
	{
		code: "plugin-sdk-direct-dm-access-subpath",
		subpath: "direct-dm-access",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/channel-inbound`"
	},
	{
		code: "plugin-sdk-mattermost-subpath",
		subpath: "mattermost",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/command-auth`, `operator/plugin-sdk/channel-plugin-common`, and `operator/plugin-sdk/reply-history`"
	},
	{
		code: "plugin-sdk-matrix-subpath",
		subpath: "matrix",
		owner: "channel",
		removeAfter: "2026-08-15",
		replacement: "`operator/plugin-sdk/run-command`"
	},
	{
		code: "plugin-sdk-channel-envelope-subpath",
		subpath: "channel-envelope",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/channel-inbound`"
	},
	{
		code: "plugin-sdk-channel-inbound-roots-subpath",
		subpath: "channel-inbound-roots",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/channel-inbound`"
	},
	{
		code: "plugin-sdk-channel-logging-subpath",
		subpath: "channel-logging",
		owner: "channel",
		removeAfter: "2026-08-15",
		replacement: "`operator/plugin-sdk/channel-inbound` and `operator/plugin-sdk/channel-outbound`"
	},
	{
		code: "plugin-sdk-channel-location-subpath",
		subpath: "channel-location",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/channel-inbound`"
	},
	{
		code: "plugin-sdk-channel-lifecycle-subpath",
		subpath: "channel-lifecycle",
		owner: "channel",
		removeAfter: "2026-09-01",
		replacement: "`operator/plugin-sdk/channel-outbound`"
	},
	{
		code: "plugin-sdk-channel-message-subpath",
		subpath: "channel-message",
		owner: "channel",
		removeAfter: "2026-09-01",
		replacement: "`operator/plugin-sdk/channel-outbound` and `operator/plugin-sdk/channel-inbound`"
	},
	{
		code: "plugin-sdk-channel-message-runtime-subpath",
		subpath: "channel-message-runtime",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/channel-outbound`"
	},
	{
		code: "plugin-sdk-channel-pairing-paths-subpath",
		subpath: "channel-pairing-paths",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/channel-pairing`"
	},
	{
		code: "plugin-sdk-group-access-subpath",
		subpath: "group-access",
		owner: "channel",
		removeAfter: "2026-08-15",
		replacement: "`operator/plugin-sdk/channel-ingress-runtime`"
	},
	{
		code: "plugin-sdk-media-generation-runtime-shared-subpath",
		subpath: "media-generation-runtime-shared",
		owner: "provider",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/media-generation-runtime`"
	},
	{
		code: "plugin-sdk-music-generation-core-subpath",
		subpath: "music-generation-core",
		owner: "provider",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/music-generation` for public types and assets; plugin-owned provider runtime helpers for provider registration"
	},
	{
		code: "plugin-sdk-memory-core-subpath",
		subpath: "memory-core",
		owner: "sdk",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/memory-host-core`"
	},
	{
		code: "plugin-sdk-memory-core-engine-runtime-subpath",
		subpath: "memory-core-engine-runtime",
		owner: "sdk",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/memory-host-search` for active search-manager lifecycle operations"
	},
	{
		code: "plugin-sdk-memory-core-host-multimodal-subpath",
		subpath: "memory-core-host-multimodal",
		owner: "sdk",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/memory-core-host-engine-embeddings`"
	},
	{
		code: "plugin-sdk-memory-core-host-query-subpath",
		subpath: "memory-core-host-query",
		owner: "sdk",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/memory-core-host-engine-qmd`"
	},
	{
		code: "plugin-sdk-memory-core-host-events-subpath",
		subpath: "memory-core-host-events",
		owner: "sdk",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/memory-host-events`"
	},
	{
		code: "plugin-sdk-memory-host-files-subpath",
		subpath: "memory-host-files",
		owner: "sdk",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/memory-core-host-runtime-files`"
	},
	{
		code: "plugin-sdk-memory-host-status-subpath",
		subpath: "memory-host-status",
		owner: "sdk",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/memory-core-host-status`"
	},
	{
		code: "plugin-sdk-provider-auth-login-subpath",
		subpath: "provider-auth-login",
		owner: "provider",
		removeAfter: "2026-07-30",
		replacement: "provider auth hooks built with `operator/plugin-sdk/provider-auth`"
	},
	{
		code: "plugin-sdk-provider-zai-endpoint-subpath",
		subpath: "provider-zai-endpoint",
		owner: "provider",
		removeAfter: "2026-07-30",
		replacement: "plugin-owned endpoint detection using `operator/plugin-sdk/provider-http` for generic transport helpers"
	},
	{
		code: "plugin-sdk-telegram-command-config-subpath",
		subpath: "telegram-command-config",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "plugin-local Telegram command config (no public SDK import replacement)"
	},
	{
		code: "plugin-sdk-webhook-path-subpath",
		subpath: "webhook-path",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/webhook-ingress`"
	},
	{
		code: "plugin-sdk-zalouser-subpath",
		subpath: "zalouser",
		owner: "channel",
		removeAfter: "2026-07-30",
		replacement: "`operator/plugin-sdk/command-auth`"
	},
	{
		code: "plugin-sdk-zod-subpath",
		subpath: "zod",
		owner: "sdk",
		removeAfter: "2026-08-15",
		replacement: "the direct `zod` package import"
	},
	{
		code: "plugin-sdk-agent-dir-compat-subpath",
		subpath: "agent-dir-compat",
		owner: "agent-runtime",
		removeAfter: "2026-07-30",
		replacement: "`resolveAgentDir` or `resolveDefaultAgentDir` from `operator/plugin-sdk/agent-harness-runtime`"
	}
].map(({ code, subpath, owner, removeAfter, replacement }) => ({
	code,
	status: "deprecated",
	owner,
	introduced: "2026-07-06",
	deprecated: "2026-07-06",
	warningStarts: "2026-07-06",
	removeAfter,
	replacement,
	docsPath: "/plugins/sdk-migration",
	surfaces: [`operator/plugin-sdk/${subpath}`],
	diagnostics: ["repository deprecated API usage guard for core and bundled plugins; no external runtime import warning"],
	tests: ["src/plugins/compat/registry.test.ts"]
}));
const UNUSED_PUBLIC_PLUGIN_SDK_SUBPATHS = [
	"command-gating",
	"lmstudio",
	"lmstudio-runtime",
	"secret-provider-integration",
	"skills-runtime"
];
const BUNDLED_ONLY_PUBLIC_PLUGIN_SDK_SUBPATHS = [
	"access-groups",
	"account-resolution-runtime",
	"acp-binding-resolve-runtime",
	"acp-binding-runtime",
	"acp-runtime",
	"acp-runtime-backend",
	"agent-core",
	"agent-harness-exec-review-runtime",
	"agent-harness-task-runtime",
	"agent-harness-tool-runtime",
	"agent-media-payload",
	"agent-sessions",
	"approval-reaction-runtime",
	"approval-reference-runtime",
	"async-lock-runtime",
	"browser-config",
	"bundled-channel-config-schema",
	"channel-activity-runtime",
	"channel-config-writes",
	"channel-mention-gating",
	"channel-route",
	"channel-secret-tts-runtime",
	"channel-targets",
	"chat-channel-ids",
	"cli-backend",
	"cli-runtime",
	"codex-mcp-projection",
	"command-status-runtime",
	"command-surface",
	"concurrency-runtime",
	"context-visibility-runtime",
	"conversation-binding-runtime",
	"cron-store-runtime",
	"dangerous-name-runtime",
	"delivery-queue-runtime",
	"direct-dm-guard-policy",
	"directory-config-runtime",
	"document-extractor",
	"embedding-providers",
	"exec-approvals-runtime",
	"expect-runtime",
	"fetch-runtime",
	"file-access-runtime",
	"file-lock",
	"global-singleton",
	"group-activation",
	"heartbeat-runtime",
	"host-runtime",
	"html-entity-runtime",
	"image-generation",
	"image-generation-core",
	"image-generation-runtime",
	"inline-image-data-url-runtime",
	"json-schema-runtime",
	"json-unsafe-integers",
	"keyed-async-queue",
	"llm",
	"markdown-table-runtime",
	"media-generation-runtime",
	"media-understanding",
	"memory-core-host-embedding-registry",
	"memory-core-host-engine-embeddings",
	"memory-core-host-engine-qmd",
	"memory-core-host-engine-storage",
	"memory-core-host-runtime-cli",
	"memory-core-host-runtime-core",
	"memory-core-host-runtime-files",
	"memory-core-host-secret",
	"memory-core-host-status",
	"memory-host-core",
	"memory-host-events",
	"memory-host-markdown",
	"memory-host-search",
	"message-tool-delivery-hints",
	"migration",
	"migration-runtime",
	"music-generation",
	"node-host",
	"number-runtime",
	"outbound-media",
	"pair-loop-guard-runtime",
	"plugin-config-runtime",
	"plugin-state-runtime",
	"poll-runtime",
	"process-runtime",
	"provider-auth-api-key",
	"provider-auth-login-flow-runtime",
	"provider-auth-result",
	"provider-auth-runtime",
	"provider-catalog-live-runtime",
	"provider-catalog-shared",
	"provider-entry",
	"provider-env-vars",
	"provider-http",
	"provider-model-shared",
	"provider-model-types",
	"provider-oauth-runtime",
	"provider-onboard",
	"provider-selection-runtime",
	"provider-setup",
	"provider-stream",
	"provider-stream-family",
	"provider-stream-shared",
	"provider-tools",
	"provider-transport-runtime",
	"provider-usage",
	"provider-web-fetch",
	"provider-web-fetch-contract",
	"provider-web-search",
	"provider-web-search-config-contract",
	"provider-web-search-contract",
	"qa-runner-runtime",
	"realtime-bootstrap-context",
	"realtime-transcription",
	"realtime-voice",
	"reply-reference",
	"request-url",
	"response-limit-runtime",
	"retry-runtime",
	"runtime-doctor",
	"runtime-fetch",
	"sandbox",
	"secret-file-runtime",
	"secure-random-runtime",
	"session-binding-runtime",
	"session-catalog",
	"session-key-runtime",
	"session-transcript-hit",
	"session-transcript-runtime",
	"session-visibility",
	"simple-completion-runtime",
	"speech",
	"speech-core",
	"sqlite-runtime",
	"ssrf-dispatcher",
	"string-normalization-runtime",
	"system-event-runtime",
	"talk-config-runtime",
	"target-resolver-runtime",
	"text-autolink-runtime",
	"text-utility-runtime",
	"thread-bindings-runtime",
	"thread-bindings-session-runtime",
	"time-runtime",
	"tool-payload",
	"tool-plugin",
	"tool-results",
	"transcripts",
	"transport-ready-runtime",
	"tts-runtime",
	"types",
	"video-generation",
	"video-generation-core",
	"video-generation-runtime",
	"web-content-extractor",
	"webhook-targets",
	"windows-spawn"
];
const UNUSED_PUBLIC_PLUGIN_SDK_SUBPATH_RECORDS = UNUSED_PUBLIC_PLUGIN_SDK_SUBPATHS.map((subpath) => ({
	code: `plugin-sdk-${subpath}-unused-subpath`,
	status: "deprecated",
	owner: "sdk",
	introduced: "2026-07-15",
	deprecated: "2026-07-15",
	warningStarts: "2026-07-15",
	removeAfter: "2026-07-30",
	replacement: "none needed — no known consumers; the subpath is removed without successor",
	docsPath: "/plugins/sdk-migration",
	surfaces: [`operator/plugin-sdk/${subpath}`],
	diagnostics: ["repository deprecated API usage guard for core and bundled plugins; no external runtime import warning"],
	tests: ["src/plugins/compat/registry.test.ts"],
	releaseNote: `The public \`operator/plugin-sdk/${subpath}\` subpath has no known consumers and is scheduled for removal without a successor.`
}));
const BUNDLED_ONLY_PUBLIC_PLUGIN_SDK_SUBPATH_RECORDS = BUNDLED_ONLY_PUBLIC_PLUGIN_SDK_SUBPATHS.map((subpath) => ({
	code: `plugin-sdk-${subpath}-public-demotion`,
	status: "deprecated",
	owner: "sdk",
	introduced: "2026-07-15",
	deprecated: "2026-07-15",
	warningStarts: "2026-07-15",
	removeAfter: "2026-07-30",
	replacement: "subpath becomes internal (private-local-only); no external successor — no known external consumers",
	docsPath: "/plugins/sdk-migration",
	surfaces: [`operator/plugin-sdk/${subpath}`],
	diagnostics: ["registry-backed public SDK demotion window; no external runtime import warning"],
	tests: ["src/plugins/compat/registry.test.ts"],
	releaseNote: `Only the public export for \`operator/plugin-sdk/${subpath}\` is retiring; the module stays available for bundled plugins as a private-local-only subpath.`
}));
const PLUGIN_COMPAT_RECORDS = [
	...DEPRECATED_PLUGIN_SDK_SUBPATH_RECORDS,
	...UNUSED_PUBLIC_PLUGIN_SDK_SUBPATH_RECORDS,
	...BUNDLED_ONLY_PUBLIC_PLUGIN_SDK_SUBPATH_RECORDS,
	{
		code: "legacy-before-agent-start",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-24",
		warningStarts: "2026-04-24",
		removeAfter: "2026-07-24",
		replacement: "`before_model_resolve` and `before_prompt_build` hooks",
		docsPath: "/plugins/sdk-migration",
		surfaces: [
			"plugin hooks",
			"plugins inspect",
			"status diagnostics"
		],
		diagnostics: ["plugin compatibility notice"],
		tests: ["src/plugins/status.test.ts", "src/plugins/contracts/shape.contract.test.ts"],
		releaseNote: "Legacy `before_agent_start` hook compatibility remains wired while plugins migrate to modern hook stages."
	},
	{
		code: "legacy-deactivate-hook-alias",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-05-16",
		deprecated: "2026-05-16",
		warningStarts: "2026-05-16",
		removeAfter: "2026-08-16",
		replacement: "`gateway_stop` hook",
		docsPath: "/plugins/hooks#upcoming-deprecations",
		surfaces: ["api.on(\"deactivate\", ...)", "plugin typed hook registration"],
		diagnostics: ["plugin runtime compatibility warning"],
		tests: ["src/plugins/loader.test.ts"],
		releaseNote: "`api.on(\"deactivate\", ...)` remains wired as a deprecated compatibility alias while plugins migrate to `gateway_stop`."
	},
	{
		code: "legacy-subagent-spawning-hook",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-05-30",
		deprecated: "2026-05-30",
		warningStarts: "2026-05-30",
		removeAfter: "2026-08-30",
		replacement: "`subagent_spawned` for post-launch observation; core session-binding adapters for thread routing",
		docsPath: "/plugins/hooks#upcoming-deprecations",
		surfaces: [
			"api.on(\"subagent_spawning\", ...)",
			"PluginHookSubagentSpawningEvent",
			"PluginHookSubagentSpawningResult",
			"SubagentLifecycleHookRunner.runSubagentSpawning"
		],
		diagnostics: ["plugin runtime compatibility warning"],
		tests: ["src/plugins/loader.test.ts", "src/plugins/compat/registry.test.ts"],
		releaseNote: "`api.on(\"subagent_spawning\", ...)` remains wired only for older plugins; core now owns thread-bound subagent routing."
	},
	{
		code: "hook-only-plugin-shape",
		status: "active",
		owner: "sdk",
		introduced: "2026-04-24",
		replacement: "explicit capability registration",
		docsPath: "/plugins/sdk-migration",
		surfaces: [
			"plugin shape inspection",
			"plugins inspect",
			"status diagnostics"
		],
		diagnostics: ["plugin compatibility notice"],
		tests: ["src/plugins/status.test.ts", "src/plugins/contracts/shape.contract.test.ts"]
	},
	{
		code: "deprecated-memory-embedding-provider-api",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-05-21",
		deprecated: "2026-05-21",
		warningStarts: "2026-05-21",
		removeAfter: "2026-08-21",
		replacement: "`api.registerEmbeddingProvider(...)` and `contracts.embeddingProviders`",
		docsPath: "/plugins/sdk-migration#memory-embedding-provider-api",
		surfaces: [
			"api.registerMemoryEmbeddingProvider(...)",
			"contracts.memoryEmbeddingProviders",
			"operator/plugin-sdk/memory-core-host-engine-embeddings registerMemoryEmbeddingProvider",
			"plugins inspect compatibility notices"
		],
		diagnostics: ["plugin compatibility notice", "plugin SDK package guardrail"],
		tests: [
			"src/plugins/status.test.ts",
			"src/plugins/compat/registry.test.ts",
			"src/plugins/contracts/plugin-sdk-package-contract-guardrails.test.ts"
		],
		releaseNote: "Memory-specific embedding provider registration remains wired as a deprecated compatibility path while providers migrate to the generic embedding provider contract."
	},
	{
		code: "deprecated-session-store-beta5-api",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-05-21",
		deprecated: "2026-07-12",
		warningStarts: "2026-07-12",
		removeAfter: "2026-10-12",
		replacement: "`getSessionEntry(...)`, `listSessionEntries(...)`, and row-level session mutations",
		docsPath: "/plugins/sdk-migration#removed-session-and-transcript-file-apis",
		surfaces: [
			"operator/plugin-sdk/session-store-runtime loadSessionStore",
			"operator/plugin-sdk/session-store-runtime updateSessionStore",
			"operator/plugin-sdk/session-store-runtime resolveSessionFilePath",
			"operator/plugin-sdk/session-store-runtime resolveSessionStoreEntry"
		],
		diagnostics: ["plugin SDK deprecation"],
		tests: ["src/plugin-sdk/session-store-runtime.test.ts", "src/plugins/compat/registry.test.ts"],
		releaseNote: "The beta.5 session-store import set remains available for official plugins released with v2026.7.1-beta.5 while they migrate to row-level session access."
	},
	{
		code: "removed-session-transcript-file-api",
		status: "removed",
		owner: "sdk",
		introduced: "2026-07-01",
		replacement: "session identity (`sessionKey`/`sessionId`), `SessionTranscriptUpdate.target`, and Gateway/runtime session helpers",
		docsPath: "/plugins/sdk-migration#removed-session-and-transcript-file-apis",
		surfaces: [
			"saveSessionStore",
			"resolveSessionTranscriptPathInDir",
			"resolveAndPersistSessionFile",
			"readLatestAssistantTextFromSessionTranscript",
			"SessionTranscriptUpdate.sessionFile",
			"sessionFiles",
			"transcriptPath",
			"sessionFile",
			"plugins inspect compatibility notices"
		],
		diagnostics: ["plugin compatibility notice"],
		tests: ["src/plugins/status.test.ts", "src/plugins/compat/registry.test.ts"],
		releaseNote: "Session/transcript file APIs were removed with the SQLite session storage flip; plugins now use session identity and Gateway/runtime session helpers."
	},
	{
		code: "legacy-root-sdk-import",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-24",
		warningStarts: "2026-04-24",
		removeAfter: "2026-07-24",
		replacement: "focused `operator/plugin-sdk/<subpath>` imports",
		docsPath: "/plugins/sdk-migration",
		surfaces: ["operator/plugin-sdk", "operator/plugin-sdk/compat"],
		diagnostics: ["OPERATOR_PLUGIN_SDK_COMPAT_DEPRECATED"],
		tests: [
			"src/plugins/contracts/plugin-sdk-index.test.ts",
			"src/plugins/contracts/plugin-sdk-root-alias.test.ts",
			"src/plugins/contracts/plugin-sdk-subpaths.test.ts"
		]
	},
	{
		code: "hook.before_tool_call.terminal-block-approval",
		status: "active",
		owner: "agent-runtime",
		introduced: "2026-04-29",
		docsPath: "/plugins/hooks",
		surfaces: ["before_tool_call block result", "before_tool_call approval result"],
		diagnostics: ["hook runner contract probe"],
		tests: ["src/plugins/hooks.security.test.ts", "src/agents/agent-tools.before-tool-call.e2e.test.ts"]
	},
	{
		code: "hook.llm-observer.privacy-payload",
		status: "active",
		owner: "agent-runtime",
		introduced: "2026-04-29",
		docsPath: "/plugins/hooks",
		surfaces: [
			"llm_input",
			"llm_output",
			"agent_end",
			"allowConversationAccess"
		],
		diagnostics: ["conversation access hook contract probe"],
		tests: ["src/agents/cli-runner.reliability.test.ts", "src/config/schema.help.quality.test.ts"]
	},
	{
		code: "api.capture.runtime-registrars",
		status: "active",
		owner: "plugin-execution",
		introduced: "2026-04-29",
		docsPath: "/plugins/architecture-internals",
		surfaces: [
			"createCapturedPluginRegistration",
			"capturePluginRegistration",
			"OperatorPluginApi"
		],
		diagnostics: ["runtime registration capture contract probe"],
		tests: ["src/plugins/captured-registration.test.ts"]
	},
	{
		code: "channel.runtime.envelope-config-metadata",
		status: "active",
		owner: "channel",
		introduced: "2026-04-29",
		docsPath: "/plugins/sdk-channel-plugins",
		surfaces: [
			"api.registerChannel",
			"channel setup metadata",
			"channel message envelope"
		],
		diagnostics: ["channel runtime contract probe"],
		tests: ["src/plugin-sdk/channel-entry-contract.test.ts", "src/plugins/captured-registration.test.ts"]
	},
	{
		code: "whatsapp-web-inbound-flat-message-aliases",
		status: "deprecated",
		owner: "channel",
		introduced: "2026-05-30",
		deprecated: "2026-05-30",
		warningStarts: "2026-05-30",
		removeAfter: "2026-08-30",
		replacement: "WhatsApp `WebInboundCallbackMessage` nested contexts: `event`, `payload`, `quote`, `group`, and `platform`",
		docsPath: "/plugins/compatibility",
		surfaces: [
			"@gabrielvfonseca/whatsapp WebInboundMessage flat fields",
			"WhatsApp monitorWebInbox onMessage callback",
			"WhatsApp monitorWebChannel listenerFactory injected messages"
		],
		diagnostics: ["TypeScript @deprecated WebInboundMessage flat field annotations"],
		tests: ["src/plugins/compat/registry.test.ts"],
		releaseNote: "WhatsApp WebInboundMessage flat fields remain wired as deprecated aliases while callbacks migrate to nested inbound contexts."
	},
	{
		code: "whatsapp-web-inbound-admission-top-level-fields",
		status: "deprecated",
		owner: "channel",
		introduced: "2026-06-14",
		deprecated: "2026-06-14",
		warningStarts: "2026-06-14",
		removeAfter: "2026-08-30",
		replacement: "WhatsApp `WebInboundMessage.admission` fields: `conversation.id`, `accountId`, `ingress.decision`, and `conversation.kind`",
		docsPath: "/plugins/compatibility",
		surfaces: [
			"@gabrielvfonseca/whatsapp WebInboundMessage top-level admission fields",
			"WhatsApp monitorWebInbox onMessage callback",
			"WhatsApp monitorWebChannel listenerFactory injected messages"
		],
		diagnostics: ["TypeScript @deprecated WebInboundMessage admission field annotations"],
		tests: ["src/plugins/compat/registry.test.ts"],
		releaseNote: "WhatsApp WebInboundMessage top-level admission fields remain available while callbacks migrate to the admission envelope."
	},
	{
		code: "bundled-channel-sdk-compat-facades",
		status: "active",
		owner: "sdk",
		introduced: "2026-04-28",
		replacement: "generic channel SDK subpaths or plugin-local `api.ts` / `runtime-api.ts` barrels for new plugins",
		docsPath: "/plugins/sdk-overview",
		surfaces: ["operator/plugin-sdk/discord component message helpers", "operator/plugin-sdk/telegram-account resolveTelegramAccount"],
		diagnostics: ["plugin SDK compatibility registry"],
		tests: [
			"src/plugin-sdk/discord.test.ts",
			"src/plugin-sdk/telegram-account.test.ts",
			"src/plugins/contracts/plugin-sdk-package-contract-guardrails.test.ts"
		]
	},
	{
		code: "bundled-channel-config-schema-legacy",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-28",
		deprecated: "2026-04-28",
		warningStarts: "2026-04-28",
		removeAfter: "2026-07-28",
		replacement: "`operator/plugin-sdk/bundled-channel-config-schema` for maintained bundled plugins; plugin-local schemas for third-party plugins",
		docsPath: "/plugins/sdk-migration",
		surfaces: ["operator/plugin-sdk/channel-config-schema-legacy"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/contracts/config-footprint-guardrails.test.ts", "test/extension-test-boundary.test.ts"]
	},
	{
		code: "plugin-sdk-testing-barrel",
		status: "removed",
		owner: "sdk",
		introduced: "2026-04-28",
		deprecated: "2026-04-28",
		warningStarts: "2026-04-28",
		removeAfter: "2026-07-28",
		replacement: "focused `operator/plugin-sdk/*` test subpaths such as `plugin-test-runtime`, `channel-test-helpers`, `test-env`, and `test-fixtures`",
		docsPath: "/plugins/sdk-migration#private-testing-barrel",
		surfaces: ["operator/plugin-sdk/testing"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/compat/registry.test.ts"],
		releaseNote: "The testing subpath was private-local-only and pack-excluded in shipped stables v2026.6.5 and v2026.7.1, so it was safely removed before its removeAfter date."
	},
	{
		code: "channel-route-key-aliases",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-28",
		deprecated: "2026-04-28",
		warningStarts: "2026-04-28",
		removeAfter: "2026-07-28",
		replacement: "`channelRouteDedupeKey` and `channelRouteCompactKey`",
		docsPath: "/plugins/sdk-migration",
		surfaces: ["operator/plugin-sdk/channel-route channelRouteIdentityKey", "operator/plugin-sdk/channel-route channelRouteKey"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugin-sdk/channel-route.test.ts", "src/plugins/contracts/plugin-sdk-subpaths.test.ts"]
	},
	{
		code: "channel-target-comparable-aliases",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-28",
		deprecated: "2026-04-28",
		warningStarts: "2026-04-28",
		removeAfter: "2026-07-28",
		replacement: "`ChannelRouteParsedTarget`, `channelRouteTargetsMatchExact`, `channelRouteTargetsShareConversation`, and `messaging.resolveOutboundSessionRoute` for provider-specific target grammar",
		docsPath: "/plugins/sdk-migration",
		surfaces: [
			"src/channels/plugins/target-parsing-loaded ComparableChannelTarget",
			"src/channels/plugins/target-parsing-loaded resolveComparableTargetForLoadedChannel",
			"src/channels/plugins/target-parsing-loaded comparableChannelTargetsMatch",
			"src/channels/plugins/target-parsing-loaded comparableChannelTargetsShareRoute"
		],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/channels/plugins/target-parsing.test.ts", "src/plugins/contracts/plugin-sdk-subpaths.test.ts"]
	},
	{
		code: "channel-explicit-target-parser",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-28",
		deprecated: "2026-05-23",
		warningStarts: "2026-05-23",
		removeAfter: "2026-08-23",
		replacement: "`messaging.targetResolver` for target normalization and `messaging.resolveOutboundSessionRoute` for session/thread identity",
		docsPath: "/plugins/sdk-migration",
		surfaces: [
			"ChannelMessagingAdapter.parseExplicitTarget",
			"operator/plugin-sdk/channel-route ChannelRouteExplicitTarget",
			"operator/plugin-sdk/channel-route ChannelRouteExplicitTargetParser",
			"operator/plugin-sdk/channel-route resolveChannelRouteTargetWithParser",
			"src/channels/plugins/target-parsing-loaded ParsedChannelExplicitTarget",
			"src/channels/plugins/target-parsing-loaded parseExplicitTargetForLoadedChannel",
			"src/channels/plugins/target-parsing-loaded resolveRouteTargetForLoadedChannel"
		],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/channels/plugins/contracts/test-helpers/surface-contract-suite.ts", "src/plugins/compat/registry.test.ts"]
	},
	{
		code: "channel-messaging-targets-subpath",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-28",
		deprecated: "2026-05-23",
		warningStarts: "2026-05-23",
		removeAfter: "2026-08-23",
		replacement: "`operator/plugin-sdk/channel-targets`",
		docsPath: "/plugins/sdk-migration",
		surfaces: ["operator/plugin-sdk/messaging-targets"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/compat/registry.test.ts", "src/plugins/contracts/plugin-sdk-subpaths.test.ts"]
	},
	{
		code: "bundled-plugin-allowlist",
		status: "active",
		owner: "config",
		introduced: "2026-04-24",
		replacement: "manifest-owned plugin enablement and scoped load plans",
		docsPath: "/plugins/architecture",
		surfaces: [
			"plugins.allow",
			"bundled provider startup",
			"plugins status"
		],
		diagnostics: ["plugin status report"],
		tests: ["src/plugins/status.test.ts", "src/plugins/config-state.test.ts"]
	},
	{
		code: "bundled-plugin-enablement",
		status: "active",
		owner: "config",
		introduced: "2026-04-24",
		replacement: "manifest-owned plugin defaults and scoped load plans",
		docsPath: "/plugins/architecture",
		surfaces: [
			"plugins.entries",
			"bundled provider startup",
			"plugins status"
		],
		diagnostics: ["plugin status report"],
		tests: ["src/plugins/status.test.ts", "src/plugins/config-state.test.ts"]
	},
	{
		code: "bundled-plugin-vitest-defaults",
		status: "active",
		owner: "config",
		introduced: "2026-04-24",
		replacement: "explicit test plugin config fixtures",
		docsPath: "/plugins/architecture",
		surfaces: ["Vitest plugin defaults", "bundled provider tests"],
		diagnostics: ["test-only compatibility path"],
		tests: ["src/plugins/config-state.test.ts"]
	},
	{
		code: "provider-auth-env-vars",
		status: "deprecated",
		owner: "setup",
		introduced: "2026-04-24",
		deprecated: "2026-04-24",
		warningStarts: "2026-04-24",
		removeAfter: "2026-07-24",
		replacement: "`setup.providers[].envVars` and `providerAuthChoices`",
		docsPath: "/plugins/manifest",
		surfaces: ["operator.plugin.json providerAuthEnvVars", "provider setup"],
		diagnostics: ["manifest compatibility diagnostic"],
		tests: ["src/plugins/setup-registry.test.ts", "src/plugins/provider-auth-choices.test.ts"]
	},
	{
		code: "channel-env-vars",
		status: "deprecated",
		owner: "channel",
		introduced: "2026-04-24",
		deprecated: "2026-04-24",
		warningStarts: "2026-04-24",
		removeAfter: "2026-07-24",
		replacement: "`channelConfigs.<id>.schema` and setup descriptors",
		docsPath: "/plugins/manifest",
		surfaces: ["operator.plugin.json channelEnvVars", "channel setup"],
		diagnostics: ["manifest compatibility diagnostic"],
		tests: ["src/plugins/setup-registry.test.ts", "src/channels/plugins/setup-group-access.test.ts"]
	},
	{
		code: "activation-agent-harness-hint",
		status: "active",
		owner: "plugin-execution",
		introduced: "2026-04-24",
		replacement: "top-level `cliBackends[]` for CLI aliases and future `agentRuntime` ownership metadata",
		docsPath: "/plugins/manifest",
		surfaces: ["activation.onAgentHarnesses", "activation planner"],
		diagnostics: ["activation plan compat reason"],
		tests: ["src/plugins/activation-planner.test.ts"]
	},
	{
		code: "activation-provider-hint",
		status: "active",
		owner: "plugin-execution",
		introduced: "2026-04-24",
		replacement: "`providers[]` manifest ownership",
		docsPath: "/plugins/manifest",
		surfaces: ["activation.onProviders", "activation planner"],
		diagnostics: ["activation plan compat reason"],
		tests: ["src/plugins/activation-planner.test.ts"]
	},
	{
		code: "activation-channel-hint",
		status: "active",
		owner: "plugin-execution",
		introduced: "2026-04-24",
		replacement: "`channels[]` manifest ownership",
		docsPath: "/plugins/manifest",
		surfaces: ["activation.onChannels", "activation planner"],
		diagnostics: ["activation plan compat reason"],
		tests: ["src/plugins/activation-planner.test.ts"]
	},
	{
		code: "activation-command-hint",
		status: "active",
		owner: "plugin-execution",
		introduced: "2026-04-24",
		replacement: "`commandAliases` or command contribution metadata",
		docsPath: "/plugins/manifest",
		surfaces: ["activation.onCommands", "activation planner"],
		diagnostics: ["activation plan compat reason"],
		tests: ["src/plugins/activation-planner.test.ts"]
	},
	{
		code: "activation-route-hint",
		status: "active",
		owner: "plugin-execution",
		introduced: "2026-04-24",
		replacement: "HTTP route contribution metadata",
		docsPath: "/plugins/manifest",
		surfaces: ["activation.onRoutes", "activation planner"],
		diagnostics: ["activation plan compat reason"],
		tests: ["src/plugins/activation-planner.test.ts"]
	},
	{
		code: "activation-config-path-hint",
		status: "active",
		owner: "plugin-execution",
		introduced: "2026-04-27",
		replacement: "manifest contribution ownership for root config surfaces",
		docsPath: "/plugins/manifest",
		surfaces: ["activation.onConfigPaths", "startup plugin selection"],
		diagnostics: ["activation plan compat reason"],
		tests: ["src/plugins/channel-plugin-ids.test.ts"]
	},
	{
		code: "activation-capability-hint",
		status: "active",
		owner: "plugin-execution",
		introduced: "2026-04-24",
		replacement: "manifest contribution ownership",
		docsPath: "/plugins/manifest",
		surfaces: ["activation.onCapabilities", "activation planner"],
		diagnostics: ["activation plan compat reason"],
		tests: ["src/plugins/activation-planner.test.ts"]
	},
	{
		code: "embedded-harness-config-alias",
		status: "deprecated",
		owner: "agent-runtime",
		introduced: "2026-04-24",
		deprecated: "2026-04-25",
		warningStarts: "2026-04-25",
		removeAfter: "2026-07-25",
		replacement: "`agentRuntime` config naming",
		docsPath: "/plugins/sdk-agent-harness",
		surfaces: ["agents.defaults.embeddedHarness", "model/provider runtime selection"],
		diagnostics: ["agent runtime config compatibility"],
		tests: [LEGACY_CONFIG_MIGRATE_TEST_PATH]
	},
	{
		code: "agent-harness-sdk-alias",
		status: "deprecated",
		owner: "agent-runtime",
		introduced: "2026-04-24",
		deprecated: "2026-04-25",
		warningStarts: "2026-04-25",
		removeAfter: "2026-07-25",
		replacement: "`operator/plugin-sdk/agent-runtime`",
		docsPath: "/plugins/sdk-agent-harness",
		surfaces: ["operator/plugin-sdk/agent-harness", "operator/plugin-sdk/agent-harness-runtime"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/contracts/plugin-sdk-subpaths.test.ts"]
	},
	{
		code: "embedded-pi-agent-sdk-aliases",
		status: "deprecated",
		owner: "agent-runtime",
		introduced: "2026-05-21",
		deprecated: "2026-05-21",
		warningStarts: "2026-05-21",
		removeAfter: "2026-08-21",
		replacement: "`runEmbeddedAgent` and `EmbeddedAgent*` SDK/runtime names",
		docsPath: "/plugins/sdk-runtime",
		surfaces: [
			"api.runtime.agent.runEmbeddedPiAgent",
			"operator/extension-api runEmbeddedPiAgent",
			"operator/plugin-sdk/agent-harness-runtime EmbeddedPi* aliases"
		],
		diagnostics: ["plugin SDK compatibility registry"],
		tests: ["src/plugins/runtime/index.test.ts", "src/plugins/contracts/plugin-sdk-subpaths.test.ts"],
		releaseNote: "Legacy `runEmbeddedPiAgent` and `EmbeddedPi*` plugin aliases remain as deprecated SDK compatibility only."
	},
	{
		code: "agent-harness-id-alias",
		status: "deprecated",
		owner: "agent-runtime",
		introduced: "2026-04-24",
		deprecated: "2026-04-25",
		warningStarts: "2026-04-25",
		removeAfter: "2026-07-25",
		replacement: "`agentRuntime` ids and policy metadata",
		docsPath: "/plugins/sdk-agent-harness",
		surfaces: ["manifest/catalog execution policy", "runtime selection"],
		diagnostics: ["agent runtime compatibility warning"],
		tests: ["src/plugins/provider-runtime.test.ts", "packages/web-content-core/src/provider-runtime-shared.test.ts"]
	},
	{
		code: "generated-bundled-channel-config-fallback",
		status: "active",
		owner: "channel",
		introduced: "2026-04-24",
		replacement: "manifest registry `channelConfigs` metadata",
		docsPath: "/plugins/manifest",
		surfaces: ["generated bundled channel config metadata", "channel config validation"],
		diagnostics: ["channel config metadata fallback"],
		tests: ["src/plugins/contracts/config-footprint-guardrails.test.ts"]
	},
	{
		code: "disable-persisted-plugin-registry-env",
		status: "deprecated",
		owner: "config",
		introduced: "2026-04-25",
		deprecated: "2026-04-25",
		warningStarts: "2026-04-25",
		removeAfter: "2026-07-25",
		replacement: "`operator plugins registry --refresh` and `operator doctor --fix`",
		docsPath: "/cli/plugins#registry",
		surfaces: ["OPERATOR_DISABLE_PERSISTED_PLUGIN_REGISTRY", "plugin registry reads"],
		diagnostics: ["persisted-registry-disabled"],
		tests: ["src/plugins/plugin-registry.test.ts"]
	},
	{
		code: "plugin-registry-install-migration-env",
		status: "deprecated",
		owner: "config",
		introduced: "2026-04-25",
		deprecated: "2026-04-25",
		warningStarts: "2026-04-25",
		removeAfter: "2026-07-25",
		replacement: "`operator plugins registry --refresh` and `operator doctor --fix`",
		docsPath: "/cli/plugins#registry",
		surfaces: [
			"OPERATOR_DISABLE_PLUGIN_REGISTRY_MIGRATION",
			"OPERATOR_FORCE_PLUGIN_REGISTRY_MIGRATION",
			"package postinstall plugin registry migration"
		],
		diagnostics: ["postinstall migration skip", "postinstall migration force deprecation warning"],
		tests: ["src/commands/doctor/shared/plugin-registry-migration.test.ts"]
	},
	{
		code: "plugin-install-config-ledger",
		status: "deprecated",
		owner: "config",
		introduced: "2026-04-25",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "shared SQLite `installed_plugin_index` install ledger",
		docsPath: "/cli/plugins#registry",
		surfaces: ["plugins.installs authored config", "plugin install/update migration"],
		diagnostics: ["config write migration warning", "doctor registry migration"],
		tests: ["src/config/io.write-config.test.ts", "src/commands/doctor/shared/plugin-registry-migration.test.ts"]
	},
	{
		code: "bundled-plugin-load-path-aliases",
		status: "deprecated",
		owner: "config",
		introduced: "2026-04-25",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "packaged bundled plugins resolved through the persisted plugin registry",
		docsPath: "/cli/plugins#registry",
		surfaces: ["plugins.load.paths entries pointing at bundled plugin source/dist paths"],
		diagnostics: ["doctor bundled plugin load-path warning"],
		tests: ["src/commands/doctor/shared/bundled-plugin-load-paths.test.ts"]
	},
	{
		code: "plugin-owned-web-search-config",
		status: "deprecated",
		owner: "provider",
		introduced: "2026-04-26",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`plugins.entries.<plugin>.config.webSearch`",
		docsPath: "/tools/web",
		surfaces: ["tools.web.search.apiKey", "tools.web.search.<provider>"],
		diagnostics: ["doctor legacy web-search config migration"],
		tests: ["src/commands/doctor/shared/legacy-web-search-migrate.test.ts"]
	},
	{
		code: "plugin-owned-web-fetch-config",
		status: "deprecated",
		owner: "provider",
		introduced: "2026-04-26",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`plugins.entries.firecrawl.config.webFetch`",
		docsPath: "/tools/web-fetch",
		surfaces: ["tools.web.fetch.firecrawl"],
		diagnostics: ["doctor legacy web-fetch config migration"],
		tests: ["src/commands/doctor/shared/legacy-web-fetch-migrate.test.ts"]
	},
	{
		code: "plugin-owned-x-search-config",
		status: "deprecated",
		owner: "provider",
		introduced: "2026-04-26",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`plugins.entries.xai.config.webSearch.apiKey`",
		docsPath: "/tools/grok-search",
		surfaces: ["tools.web.x_search.apiKey"],
		diagnostics: ["doctor legacy x_search config migration"],
		tests: ["src/commands/doctor/shared/legacy-x-search-migrate.test.ts", LEGACY_CONFIG_MIGRATE_TEST_PATH]
	},
	{
		code: "plugin-activate-entrypoint-alias",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`register(api)` plugin entrypoint",
		docsPath: "/plugins/sdk-entrypoints",
		surfaces: ["plugin module `activate(api)`", "plugin loader registration"],
		diagnostics: ["loader compatibility path"],
		tests: ["src/plugins/loader.test.ts"]
	},
	{
		code: "setup-runtime-fallback",
		status: "active",
		owner: "setup",
		introduced: "2026-04-24",
		replacement: "`setup.requiresRuntime: false` with complete setup descriptors",
		docsPath: "/plugins/manifest#setup-reference",
		surfaces: ["setup-api runtime fallback", "setup.requiresRuntime omitted"],
		diagnostics: ["setup registry runtime diagnostic"],
		tests: ["src/plugins/setup-registry.test.ts", "src/plugins/setup-registry.runtime.test.ts"]
	},
	{
		code: "provider-discovery-hook-alias",
		status: "deprecated",
		owner: "provider",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`catalog.run(...)` provider catalog hook",
		docsPath: "/plugins/sdk-migration",
		surfaces: ["provider plugin `discovery` hook", "provider catalog resolution"],
		diagnostics: ["provider validation warning when catalog and discovery both register"],
		tests: ["src/plugins/provider-discovery.test.ts", "src/plugins/provider-validation.test.ts"]
	},
	{
		code: "channel-exposure-legacy-aliases",
		status: "deprecated",
		owner: "channel",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`operator.channel.exposure` metadata",
		docsPath: "/plugins/sdk-setup",
		surfaces: ["operator.channel.showConfigured", "operator.channel.showInSetup"],
		diagnostics: ["channel exposure compatibility path"],
		tests: ["src/commands/channel-setup/discovery.test.ts"]
	},
	{
		code: "channel-runtime-sdk-alias",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "focused channel SDK subpaths, especially `operator/plugin-sdk/channel-runtime-context`",
		docsPath: "/plugins/sdk-migration",
		surfaces: [CHANNEL_RUNTIME_SDK_SURFACE],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/contracts/plugin-sdk-subpaths.test.ts"]
	},
	{
		code: "command-auth-status-builders",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`operator/plugin-sdk/command-status`",
		docsPath: "/plugins/sdk-migration",
		surfaces: [
			"operator/plugin-sdk/command-auth buildCommandsMessage",
			"operator/plugin-sdk/command-auth buildCommandsMessagePaginated",
			"operator/plugin-sdk/command-auth buildHelpMessage"
		],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugin-sdk/command-auth.test.ts"]
	},
	{
		code: "clawdbot-config-type-alias",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`OperatorConfig`",
		docsPath: "/plugins/sdk-migration",
		surfaces: ["operator/plugin-sdk `ClawdbotConfig` type export"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/contracts/plugin-sdk-index.test.ts"]
	},
	{
		code: "operator-schema-type-alias",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-26",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`OperatorConfig` from `operator/plugin-sdk/config-schema`",
		docsPath: "/plugins/sdk-migration",
		surfaces: ["operator/plugin-sdk `OperatorSchemaType` type export"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/contracts/plugin-sdk-index.test.ts"]
	},
	{
		code: "legacy-extension-api-import",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "injected `api.runtime.*` helpers or focused `operator/plugin-sdk/<subpath>` imports",
		docsPath: "/plugins/sdk-migration",
		surfaces: ["operator/extension-api"],
		diagnostics: ["OPERATOR_EXTENSION_API_DEPRECATED"],
		tests: ["src/plugins/sdk-alias.test.ts", "src/index.test.ts"]
	},
	{
		code: "memory-split-registration",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`api.registerMemoryCapability({ promptBuilder, flushPlanResolver, runtime })`",
		docsPath: "/plugins/sdk-migration",
		surfaces: [
			"api.registerMemoryPromptSection",
			"api.registerMemoryFlushPlan",
			"api.registerMemoryRuntime",
			"src/plugins/memory-state split registration helpers"
		],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/memory-state.test.ts", "src/plugins/loader.test.ts"]
	},
	{
		code: "provider-static-capabilities-bag",
		status: "deprecated",
		owner: "provider",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "explicit provider hooks such as `buildReplayPolicy`, `normalizeToolSchemas`, and `wrapStreamFn`",
		docsPath: "/plugins/sdk-provider-plugins",
		surfaces: ["ProviderPlugin.capabilities", "ProviderCapabilities"],
		diagnostics: ["provider validation warning"],
		tests: ["src/plugins/provider-runtime.test.ts", "src/plugins/contracts/provider-family-plugin-tests.test.ts"]
	},
	{
		code: "provider-discovery-type-aliases",
		status: "deprecated",
		owner: "provider",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`ProviderCatalogOrder`, `ProviderCatalogContext`, `ProviderCatalogResult`, and `ProviderPluginCatalog`",
		docsPath: "/plugins/sdk-migration",
		surfaces: [
			"ProviderDiscoveryOrder",
			"ProviderDiscoveryContext",
			"ProviderDiscoveryResult",
			"ProviderPluginDiscovery"
		],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/contracts/plugin-sdk-index.test.ts"]
	},
	{
		code: "provider-thinking-policy-hooks",
		status: "deprecated",
		owner: "provider",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`resolveThinkingProfile`",
		docsPath: "/plugins/sdk-provider-plugins",
		surfaces: [
			"ProviderPlugin.isBinaryThinking",
			"ProviderPlugin.supportsXHighThinking",
			"ProviderPlugin.resolveDefaultThinkingLevel"
		],
		diagnostics: ["provider runtime compatibility warning"],
		tests: ["src/plugins/provider-runtime.test.ts"]
	},
	{
		code: "provider-external-oauth-profiles-hook",
		status: "deprecated",
		owner: "provider",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`contracts.externalAuthProviders` plus `resolveExternalAuthProfiles`",
		docsPath: "/plugins/sdk-provider-plugins",
		surfaces: ["ProviderPlugin.resolveExternalOAuthProfiles"],
		diagnostics: ["provider external auth fallback warning"],
		tests: ["src/plugins/provider-runtime.test.ts"]
	},
	{
		code: "agent-tool-result-harness-alias",
		status: "deprecated",
		owner: "agent-runtime",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`runtime` and `runtimes` agent tool-result middleware fields",
		docsPath: "/plugins/sdk-agent-harness",
		surfaces: [
			"AgentToolResultMiddlewareHarness",
			"AgentToolResultMiddlewareContext.harness",
			"AgentToolResultMiddlewareOptions.harnesses",
			"normalizeAgentToolResultMiddlewareHarnesses"
		],
		diagnostics: ["agent runtime compatibility warning"],
		tests: ["src/plugins/captured-registration.test.ts", "src/agents/codex-app-server.extensions.test.ts"]
	},
	{
		code: "runtime-config-load-write",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-27",
		deprecated: "2026-04-27",
		warningStarts: "2026-04-27",
		removeAfter: "2026-07-27",
		replacement: "`api.runtime.config.current()`, passed config values, `mutateConfigFile(...)`, or `replaceConfigFile(...)`",
		docsPath: "/plugins/sdk-runtime#config-loading-and-writes",
		surfaces: ["api.runtime.config.loadConfig", "api.runtime.config.writeConfigFile"],
		diagnostics: [
			"plugin runtime compatibility warning",
			"deprecated API usage guard",
			"runtime channel config boundary guard"
		],
		tests: [
			"src/plugins/runtime/runtime-config.test.ts",
			"src/plugins/contracts/deprecated-internal-config-api.test.ts",
			"src/plugins/contracts/config-boundary-guard.test.ts"
		]
	},
	{
		code: "runtime-taskflow-legacy-alias",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`api.runtime.tasks.managedFlows` for managed mutations or `api.runtime.tasks.flows` for DTO reads",
		docsPath: "/plugins/sdk-runtime",
		surfaces: ["api.runtime.taskFlow", "api.runtime.tasks.flow"],
		diagnostics: ["plugin runtime compatibility warning"],
		tests: ["src/plugins/runtime/index.test.ts", "src/plugins/runtime/runtime-tasks.test.ts"]
	},
	{
		code: "runtime-subagent-get-session-alias",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`api.runtime.subagent.getSessionMessages`",
		docsPath: "/plugins/sdk-runtime",
		surfaces: ["api.runtime.subagent.getSession"],
		diagnostics: ["plugin runtime compatibility warning"],
		tests: ["src/plugins/runtime/index.test.ts"]
	},
	{
		code: "runtime-stt-alias",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`api.runtime.mediaUnderstanding.transcribeAudioFile`",
		docsPath: "/plugins/sdk-runtime",
		surfaces: ["api.runtime.stt.transcribeAudioFile"],
		diagnostics: ["plugin runtime compatibility warning"],
		tests: ["src/plugins/runtime/index.test.ts"]
	},
	{
		code: "runtime-inbound-envelope-alias",
		status: "deprecated",
		owner: "channel",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`BodyForAgent` plus structured user-context blocks",
		docsPath: "/plugins/sdk-runtime",
		surfaces: ["api.runtime.channel.reply.formatInboundEnvelope"],
		diagnostics: ["channel runtime compatibility warning"],
		tests: ["src/plugins/runtime/index.test.ts"]
	},
	{
		code: "channel-native-message-schema-helpers",
		status: "deprecated",
		owner: "channel",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "semantic `presentation` capabilities",
		docsPath: "/plugins/sdk-migration",
		surfaces: ["operator/plugin-sdk/channel-actions createMessageToolButtonsSchema", "operator/plugin-sdk/channel-actions createMessageToolCardSchema"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/contracts/plugin-sdk-subpaths.test.ts"]
	},
	{
		code: "channel-mention-gating-legacy-helpers",
		status: "deprecated",
		owner: "channel",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "`resolveInboundMentionDecision({ facts, policy })`",
		docsPath: "/plugins/sdk-migration",
		surfaces: [
			"operator/plugin-sdk/channel-inbound resolveMentionGating",
			"operator/plugin-sdk/channel-inbound resolveMentionGatingWithBypass",
			"operator/plugin-sdk/channel-mention-gating resolveMentionGating",
			"operator/plugin-sdk/channel-mention-gating resolveMentionGatingWithBypass"
		],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/contracts/plugin-sdk-subpaths.test.ts"]
	},
	{
		code: "provider-web-search-core-wrapper",
		status: "deprecated",
		owner: "provider",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "provider-owned `createTool(...)` on the returned `WebSearchProviderPlugin`",
		docsPath: "/plugins/sdk-provider-plugins",
		surfaces: ["operator/plugin-sdk/provider-web-search createPluginBackedWebSearchProvider"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/contracts/plugin-sdk-subpaths.test.ts"]
	},
	{
		code: "approval-capability-approvals-alias",
		status: "deprecated",
		owner: "channel",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "top-level `delivery`, `nativeRuntime`, `render`, and `native` approval capability fields",
		docsPath: "/plugins/sdk-channel-plugins",
		surfaces: ["createChannelApprovalCapability({ approvals })"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugin-sdk/approval-delivery-helpers.test.ts"]
	},
	{
		code: "plugin-sdk-test-utils-alias",
		status: "deprecated",
		owner: "sdk",
		introduced: "2026-04-24",
		deprecated: "2026-04-26",
		warningStarts: "2026-04-26",
		removeAfter: "2026-07-26",
		replacement: "focused `operator/plugin-sdk/*` test subpaths",
		docsPath: "/plugins/sdk-migration",
		surfaces: ["operator/plugin-sdk/test-utils"],
		diagnostics: ["plugin SDK compatibility warning"],
		tests: ["src/plugins/compat/registry.test.ts", "src/plugins/contracts/plugin-sdk-subpaths.test.ts"]
	}
];
const pluginCompatRecordByCode = new Map(PLUGIN_COMPAT_RECORDS.map((record) => [record.code, record]));
function listPluginCompatRecords() {
	return PLUGIN_COMPAT_RECORDS;
}
function getPluginCompatRecord(code) {
	const record = pluginCompatRecordByCode.get(code);
	if (!record) throw new Error(`Unknown plugin compatibility code: ${code}`);
	return record;
}
//#endregion
//#region src/plugins/installed-plugin-index-hash.ts
function hashString(value) {
	return node_crypto.default.createHash("sha256").update(value).digest("hex");
}
/** Hashes JSON-serializable data with SHA-256. */
function hashJson(value) {
	return hashString(JSON.stringify(value));
}
/** Safely hashes a file, optionally recording required-file diagnostics. */
function safeHashFile(params) {
	try {
		return node_crypto.default.createHash("sha256").update(node_fs.default.readFileSync(params.filePath)).digest("hex");
	} catch (err) {
		if (params.required) params.diagnostics.push({
			level: "warn",
			...params.pluginId ? { pluginId: params.pluginId } : {},
			source: params.filePath,
			message: `installed plugin index could not hash ${params.filePath}: ${err instanceof Error ? err.message : String(err)}`
		});
		return;
	}
}
/** Reads a safe file signature for installed plugin index freshness checks. */
function safeFileSignature(filePath) {
	try {
		const stat = node_fs.default.statSync(filePath);
		if (!stat.isFile()) return;
		return {
			size: stat.size,
			mtimeMs: stat.mtimeMs,
			ctimeMs: stat.ctimeMs
		};
	} catch {
		return;
	}
}
/** Compares current file metadata with a stored installed-plugin file signature. */
function fileSignatureMatches(filePath, signature) {
	if (!signature) return;
	if (typeof signature.ctimeMs !== "number") return;
	const current = safeFileSignature(filePath);
	if (!current) return false;
	return current.size === signature.size && current.mtimeMs === signature.mtimeMs && current.ctimeMs === signature.ctimeMs;
}
//#endregion
//#region src/plugins/installed-plugin-index-policy.ts
/** Hashes plugin compat registry state that can affect installed index validity. */
function resolveCompatRegistryVersion() {
	return hashJson(listPluginCompatRecords().map((record) => ({
		code: record.code,
		status: record.status,
		deprecated: record.deprecated,
		warningStarts: record.warningStarts,
		removeAfter: record.removeAfter,
		replacement: record.replacement
	})));
}
/** Hashes config policy inputs that can change installed plugin activation. */
function resolveInstalledPluginIndexPolicyHash(config) {
	const normalized = require_config_state.normalizePluginsConfig(config?.plugins);
	const channelPolicy = {};
	const channels = config?.channels;
	if (channels && typeof channels === "object" && !Array.isArray(channels)) {
		for (const [channelId, value] of Object.entries(channels)) if (value && typeof value === "object" && !Array.isArray(value)) {
			const enabled = value.enabled;
			if (typeof enabled === "boolean") channelPolicy[channelId] = enabled;
		}
	}
	return hashJson({
		plugins: {
			enabled: normalized.enabled,
			allow: normalized.allow,
			deny: normalized.deny,
			slots: normalized.slots,
			entries: Object.fromEntries(Object.entries(normalized.entries).flatMap(([pluginId, entry]) => typeof entry.enabled === "boolean" ? [[pluginId, entry.enabled]] : []).toSorted(([left], [right]) => left.localeCompare(right)))
		},
		channels: Object.fromEntries(Object.entries(channelPolicy).toSorted(([left], [right]) => left.localeCompare(right)))
	});
}
//#endregion
//#region src/plugins/installed-plugin-index-install-records.ts
function setInstallStringField(target, key, value) {
	if (typeof value !== "string") return;
	const normalized = value.trim();
	if (normalized) target[key] = normalized;
}
function setInstallNumberField(target, key, value) {
	if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) target[key] = value;
}
function setInstallBooleanField(target, key, value) {
	if (typeof value === "boolean") target[key] = value;
}
function setInstallStringArrayField(target, key, value) {
	if (!Array.isArray(value)) return;
	const normalized = value.filter((entry) => typeof entry === "string").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
	if (normalized.length > 0) target[key] = normalized;
}
function normalizeInstallRecord(record) {
	if (!record) return;
	const normalized = { source: record.source };
	setInstallStringField(normalized, "spec", record.spec);
	setInstallStringField(normalized, "sourcePath", record.sourcePath);
	setInstallStringField(normalized, "installPath", record.installPath);
	setInstallStringField(normalized, "version", record.version);
	setInstallStringField(normalized, "resolvedName", record.resolvedName);
	setInstallStringField(normalized, "resolvedVersion", record.resolvedVersion);
	setInstallStringField(normalized, "resolvedSpec", record.resolvedSpec);
	setInstallStringField(normalized, "integrity", record.integrity);
	setInstallStringField(normalized, "shasum", record.shasum);
	setInstallStringField(normalized, "resolvedAt", record.resolvedAt);
	setInstallStringField(normalized, "installedAt", record.installedAt);
	setInstallStringField(normalized, "clawhubUrl", record.clawhubUrl);
	setInstallStringField(normalized, "clawhubPackage", record.clawhubPackage);
	setInstallStringField(normalized, "clawhubFamily", record.clawhubFamily);
	setInstallStringField(normalized, "clawhubChannel", record.clawhubChannel);
	setInstallStringField(normalized, "clawhubTrustDisposition", record.clawhubTrustDisposition);
	setInstallStringField(normalized, "clawhubTrustScanStatus", record.clawhubTrustScanStatus);
	setInstallStringField(normalized, "clawhubTrustModerationState", record.clawhubTrustModerationState);
	setInstallStringArrayField(normalized, "clawhubTrustReasons", record.clawhubTrustReasons);
	setInstallBooleanField(normalized, "clawhubTrustPending", record.clawhubTrustPending);
	setInstallBooleanField(normalized, "clawhubTrustStale", record.clawhubTrustStale);
	setInstallStringField(normalized, "clawhubTrustCheckedAt", record.clawhubTrustCheckedAt);
	setInstallStringField(normalized, "clawhubTrustAcknowledgedAt", record.clawhubTrustAcknowledgedAt);
	setInstallStringField(normalized, "artifactKind", record.artifactKind);
	setInstallStringField(normalized, "artifactFormat", record.artifactFormat);
	setInstallStringField(normalized, "npmIntegrity", record.npmIntegrity);
	setInstallStringField(normalized, "npmShasum", record.npmShasum);
	setInstallStringField(normalized, "npmTarballName", record.npmTarballName);
	setInstallStringField(normalized, "clawpackSha256", record.clawpackSha256);
	setInstallNumberField(normalized, "clawpackSpecVersion", record.clawpackSpecVersion);
	setInstallStringField(normalized, "clawpackManifestSha256", record.clawpackManifestSha256);
	setInstallNumberField(normalized, "clawpackSize", record.clawpackSize);
	setInstallStringField(normalized, "gitUrl", record.gitUrl);
	setInstallStringField(normalized, "gitRef", record.gitRef);
	setInstallStringField(normalized, "gitCommit", record.gitCommit);
	setInstallStringField(normalized, "marketplaceName", record.marketplaceName);
	setInstallStringField(normalized, "marketplaceSource", record.marketplaceSource);
	setInstallStringField(normalized, "marketplacePlugin", record.marketplacePlugin);
	return normalized;
}
function restoreInstallRecord(record) {
	if (!record?.source) return;
	return structuredClone(record);
}
/** Normalizes raw plugin install records into index-safe install record metadata. */
function normalizeInstallRecordMap(records) {
	const normalized = {};
	for (const [pluginId, record] of Object.entries(records ?? {}).toSorted(([left], [right]) => left.localeCompare(right))) {
		const installRecord = normalizeInstallRecord(record);
		if (installRecord) normalized[pluginId] = installRecord;
	}
	return normalized;
}
function restoreInstallRecordMap(records) {
	const restored = {};
	for (const [pluginId, record] of Object.entries(records ?? {}).toSorted(([left], [right]) => left.localeCompare(right))) {
		const installRecord = restoreInstallRecord(record);
		if (installRecord) restored[pluginId] = installRecord;
	}
	return restored;
}
/** Extracts raw plugin install records from either current or legacy installed-index shapes. */
function extractPluginInstallRecordsFromInstalledPluginIndex(index) {
	if (index && Object.hasOwn(index, "installRecords")) return restoreInstallRecordMap(index.installRecords);
	const records = {};
	for (const plugin of index?.plugins ?? []) {
		const record = restoreInstallRecord(plugin.installRecord);
		if (record) records[plugin.pluginId] = record;
	}
	return records;
}
//#endregion
//#region src/plugins/install-source-info.ts
/** Describes package-authored plugin install source metadata and pinning warnings. */
function resolveNpmPinState(params) {
	if (params.exactVersion) return params.hasIntegrity ? "exact-with-integrity" : "exact-without-integrity";
	return params.hasIntegrity ? "floating-with-integrity" : "floating-without-integrity";
}
function resolveDefaultChoice(value) {
	return value === "clawhub" || value === "npm" || value === "local" ? value : void 0;
}
function normalizeExpectedPackageName(value) {
	const expected = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!expected) return;
	return require_npm_registry_spec.parseRegistryNpmSpec(expected)?.name ?? expected;
}
/** Describes plugin install source metadata and warnings without mutating manifests. */
function describePluginInstallSource(install, options) {
	const clawhubSpec = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install.clawhubSpec);
	const npmSpec = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install.npmSpec);
	const localPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install.localPath);
	const defaultChoice = resolveDefaultChoice(install.defaultChoice);
	const expectedIntegrity = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(install.expectedIntegrity);
	const expectedPackageName = normalizeExpectedPackageName(options?.expectedPackageName);
	const warnings = [];
	let clawhub;
	let npm;
	if (install.defaultChoice !== void 0 && !defaultChoice) warnings.push("invalid-default-choice");
	if (clawhubSpec) {
		const parsed = require_clawhub.parseClawHubPluginSpec(clawhubSpec);
		if (parsed) {
			if (!parsed.version) warnings.push("clawhub-spec-floating");
			clawhub = {
				spec: clawhubSpec,
				packageName: parsed.name,
				...parsed.version ? { version: parsed.version } : {},
				exactVersion: Boolean(parsed.version)
			};
		} else warnings.push("invalid-clawhub-spec");
	}
	if (npmSpec) {
		const parsed = require_npm_registry_spec.parseRegistryNpmSpec(npmSpec);
		if (parsed) {
			const exactVersion = parsed.selectorKind === "exact-version";
			const hasIntegrity = Boolean(expectedIntegrity);
			if (!exactVersion) warnings.push("npm-spec-floating");
			if (!hasIntegrity) warnings.push("npm-spec-missing-integrity");
			if (expectedPackageName && parsed.name !== expectedPackageName) warnings.push("npm-spec-package-name-mismatch");
			npm = {
				spec: parsed.raw,
				packageName: parsed.name,
				...expectedPackageName && parsed.name !== expectedPackageName ? { expectedPackageName } : {},
				selectorKind: parsed.selectorKind,
				exactVersion,
				pinState: resolveNpmPinState({
					exactVersion,
					hasIntegrity
				}),
				...parsed.selector ? { selector: parsed.selector } : {},
				...expectedIntegrity ? { expectedIntegrity } : {}
			};
		} else warnings.push("invalid-npm-spec");
	}
	if (defaultChoice === "clawhub" && !clawhub) warnings.push("default-choice-missing-source");
	if (defaultChoice === "npm" && !npm) warnings.push("default-choice-missing-source");
	if (defaultChoice === "local" && !localPath) warnings.push("default-choice-missing-source");
	if (expectedIntegrity && !npm) warnings.push("npm-integrity-without-source");
	return {
		...defaultChoice ? { defaultChoice } : {},
		...clawhub ? { clawhub } : {},
		...npm ? { npm } : {},
		...localPath ? { local: { path: localPath } } : {},
		warnings
	};
}
//#endregion
//#region src/plugins/installed-plugin-index-manifest.ts
/** True when a Claude bundle record omits its optional manifest file. */
function hasOptionalMissingPluginManifestFile(record) {
	return record.format === "bundle" && record.bundleFormat === "claude" && !node_fs.default.existsSync(record.manifestPath);
}
//#endregion
//#region src/plugins/installed-plugin-index-record-builder.ts
/** Builds installed-index records from normalized plugin manifest registry entries. */
function buildStartupInfo(record) {
	return {
		sidecar: record.activation?.onStartup === true,
		memory: require_config_activation_shared.hasKind(record.kind, "memory"),
		deferConfiguredChannelFullLoadUntilAfterListen: record.startupDeferConfiguredChannelFullLoadUntilAfterListen === true,
		agentHarnesses: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)([...record.activation?.onAgentHarnesses ?? [], ...record.cliBackends ?? []]),
		configPaths: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(record.activation?.onConfigPaths)
	};
}
function buildContributionInfo(record) {
	const contracts = Object.fromEntries(Object.entries(record.contracts ?? {}).map(([key, values]) => [key, (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(values)]));
	return {
		channels: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(record.channels),
		channelConfigs: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(Object.keys(record.channelConfigs ?? {})),
		providers: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(record.providers),
		modelCatalogProviders: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)([
			...Object.keys(record.modelCatalog?.providers ?? {}),
			...Object.keys(record.modelCatalog?.aliases ?? {}),
			...(record.modelCatalog?.suppressions ?? []).map((entry) => entry.provider)
		]),
		modelSupportPrefixes: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(record.modelSupport?.modelPrefixes),
		modelSupportPatterns: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(record.modelSupport?.modelPatterns),
		autoEnableProviderIds: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(record.autoEnableWhenConfiguredProviders),
		commandAliases: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(record.commandAliases?.map((alias) => alias.name)),
		contracts
	};
}
/** Collects compatibility codes implied by a manifest's legacy or activation surfaces. */
function collectPluginManifestCompatCodes(record) {
	const codes = [];
	if (record.providerAuthEnvVars && Object.keys(record.providerAuthEnvVars).length > 0) codes.push("provider-auth-env-vars");
	if (record.channelEnvVars && Object.keys(record.channelEnvVars).length > 0) codes.push("channel-env-vars");
	if (record.activation?.onProviders?.length) codes.push("activation-provider-hint");
	if (record.activation?.onAgentHarnesses?.length) codes.push("activation-agent-harness-hint");
	if (record.activation?.onChannels?.length) codes.push("activation-channel-hint");
	if (record.activation?.onCommands?.length) codes.push("activation-command-hint");
	if (record.activation?.onRoutes?.length) codes.push("activation-route-hint");
	if (record.activation?.onConfigPaths?.length) codes.push("activation-config-path-hint");
	if (record.activation?.onCapabilities?.length) codes.push("activation-capability-hint");
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(codes);
}
function resolvePackageJsonPath(candidate, realpathCache) {
	if (!candidate?.packageDir) return;
	const packageDir = (0, _openclaw_fs_safe_path.safeRealpathSync)(candidate.packageDir, realpathCache) ?? node_path.default.resolve(candidate.packageDir);
	const packageJsonPath = node_path.default.join(packageDir, "package.json");
	const rootDir = candidate.rootDir === candidate.packageDir ? packageDir : (0, _openclaw_fs_safe_path.safeRealpathSync)(candidate.rootDir, realpathCache) ?? node_path.default.resolve(candidate.rootDir);
	const packageJsonRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(packageJsonPath, realpathCache);
	return packageJsonRealPath && (0, _openclaw_fs_safe_path.isPathInside)(rootDir, packageJsonRealPath) ? packageJsonPath : void 0;
}
function resolvePackageJsonRelativePath(rootDir, packageJsonPath, realpathCache) {
	const resolvedRootDir = rootDir === node_path.default.dirname(packageJsonPath) ? node_path.default.dirname(packageJsonPath) : (0, _openclaw_fs_safe_path.safeRealpathSync)(rootDir, realpathCache) ?? node_path.default.resolve(rootDir);
	return (node_path.default.relative(resolvedRootDir, packageJsonPath) || "package.json").split(node_path.default.sep).join("/");
}
function resolvePackageJsonRecord(params) {
	if (!params.candidate?.packageDir || !params.packageJsonPath) return;
	const hash = safeHashFile({
		filePath: params.packageJsonPath,
		pluginId: params.pluginId,
		diagnostics: params.diagnostics,
		required: false
	});
	if (!hash) return;
	const fileSignature = safeFileSignature(params.packageJsonPath);
	return {
		path: resolvePackageJsonRelativePath(params.candidate.rootDir, params.packageJsonPath, params.realpathCache),
		hash,
		...fileSignature ? { fileSignature } : {}
	};
}
function describePackageInstallSource(candidate) {
	const install = candidate?.packageManifest?.install;
	if (!install) return;
	return describePluginInstallSource(install, { expectedPackageName: candidate?.packageName });
}
function normalizeStringField(value) {
	if (typeof value !== "string") return;
	const normalized = value.trim();
	return normalized ? normalized : void 0;
}
function normalizePackageChannel(channel) {
	const id = normalizeStringField(channel?.id);
	if (!id) return;
	return {
		...structuredClone(channel),
		id
	};
}
function hashManifestlessBundleRecord(record) {
	return hashJson({
		id: record.id,
		name: record.name,
		description: record.description,
		version: record.version,
		format: record.format,
		bundleFormat: record.bundleFormat,
		bundleCapabilities: record.bundleCapabilities ?? [],
		skills: record.skills ?? [],
		settingsFiles: record.settingsFiles ?? [],
		hooks: record.hooks ?? []
	});
}
function resolveManifestHash(params) {
	if (hasOptionalMissingPluginManifestFile(params.record)) return hashManifestlessBundleRecord(params.record);
	const hash = safeHashFile({
		filePath: params.record.manifestPath,
		pluginId: params.record.id,
		diagnostics: params.diagnostics,
		required: true
	});
	if (hash) return hash;
	return "";
}
function buildCandidateLookup(candidates) {
	const byRootDir = /* @__PURE__ */ new Map();
	for (const candidate of candidates) byRootDir.set(candidate.rootDir, candidate);
	return byRootDir;
}
function buildInstalledPluginIndexRecords(params) {
	const candidateByRootDir = buildCandidateLookup(params.candidates);
	const normalizedConfig = require_config_state.normalizePluginsConfig(params.config?.plugins);
	const realpathCache = /* @__PURE__ */ new Map();
	return params.registry.plugins.map((record) => {
		const candidate = candidateByRootDir.get(record.rootDir);
		const packageJsonPath = resolvePackageJsonPath(candidate, realpathCache);
		const installRecord = params.installRecords[record.id];
		const packageInstall = describePackageInstallSource(candidate);
		const packageChannel = normalizePackageChannel(record.packageChannel ?? candidate?.packageManifest?.channel);
		const manifestHash = resolveManifestHash({
			record,
			diagnostics: params.diagnostics
		});
		const manifestFile = hasOptionalMissingPluginManifestFile(record) ? void 0 : safeFileSignature(record.manifestPath);
		const packageJson = resolvePackageJsonRecord({
			candidate,
			packageJsonPath,
			diagnostics: params.diagnostics,
			pluginId: record.id,
			realpathCache
		});
		const enabled = require_config_state.resolveEffectiveEnableState({
			id: record.id,
			origin: record.origin,
			config: normalizedConfig,
			rootConfig: params.config,
			enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(record)
		}).enabled;
		const indexRecord = {
			pluginId: record.id,
			manifestPath: record.manifestPath,
			manifestHash,
			...manifestFile ? { manifestFile } : {},
			source: record.source,
			rootDir: record.rootDir,
			origin: record.origin,
			enabled,
			startup: buildStartupInfo(record),
			contributions: buildContributionInfo(record),
			compat: collectPluginManifestCompatCodes(record)
		};
		if (record.format && record.format !== "@gabrielvfonseca/operator") indexRecord.format = record.format;
		if (record.bundleFormat) indexRecord.bundleFormat = record.bundleFormat;
		if (record.enabledByDefault === true) indexRecord.enabledByDefault = true;
		if (record.enabledByDefaultOnPlatforms?.length) indexRecord.enabledByDefaultOnPlatforms = [...record.enabledByDefaultOnPlatforms];
		if (record.syntheticAuthRefs?.length) indexRecord.syntheticAuthRefs = [...record.syntheticAuthRefs];
		if (record.setupSource) indexRecord.setupSource = record.setupSource;
		if (candidate?.packageName) indexRecord.packageName = candidate.packageName;
		if (candidate?.packageVersion) indexRecord.packageVersion = candidate.packageVersion;
		if (installRecord) indexRecord.installRecordHash = hashJson(installRecord);
		if (packageInstall) indexRecord.packageInstall = packageInstall;
		if (packageChannel) indexRecord.packageChannel = packageChannel;
		if (candidate?.packageManifest?.build) indexRecord.packageBuild = structuredClone(candidate.packageManifest.build);
		if (packageJson) indexRecord.packageJson = packageJson;
		return indexRecord;
	});
}
//#endregion
//#region src/plugins/installed-plugin-index-registry.ts
/** Resolves discovery candidates and manifest registry for installed plugin index loading. */
function resolveInstalledPluginIndexRegistry(params) {
	if (params.candidates) return {
		candidates: params.candidates,
		registry: require_manifest_registry.loadPluginManifestRegistry({
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			candidates: params.candidates,
			diagnostics: params.diagnostics,
			installRecords: params.installRecords
		})
	};
	const normalized = require_config_state.normalizePluginsConfig(params.config?.plugins);
	const installRecords = params.installRecords ?? require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecordsSync({ env: params.env });
	const discovery = params.discovery ?? require_discovery.discoverOperatorPlugins({
		workspaceDir: params.workspaceDir,
		extraPaths: normalized.loadPaths,
		env: params.env,
		installRecords
	});
	return {
		candidates: discovery.candidates,
		discovery,
		registry: require_manifest_registry.loadPluginManifestRegistry({
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			candidates: discovery.candidates,
			diagnostics: discovery.diagnostics,
			installRecords
		})
	};
}
//#endregion
//#region src/plugins/installed-plugin-index-types.ts
const INSTALLED_PLUGIN_INDEX_WARNING = "DO NOT EDIT. This file is generated by Operator from plugin manifests, install records, and config policy. Use `openclaw plugins registry --refresh`, `openclaw plugins install/update/uninstall`, or `openclaw plugins enable/disable` instead.";
//#endregion
//#region src/plugins/installed-plugin-index.ts
function buildInstalledPluginIndex(params) {
	const env = params.env ?? process.env;
	const { candidates, registry, discovery } = resolveInstalledPluginIndexRegistry(params);
	const diagnostics = [...registry.diagnostics ?? []];
	const generatedAtMs = (params.now?.() ?? /* @__PURE__ */ new Date()).getTime();
	const installRecords = normalizeInstallRecordMap(params.installRecords ?? require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecordsSync({
		env,
		...params.stateDir ? { stateDir: params.stateDir } : {},
		...params.pluginIndexFilePath ? { filePath: params.pluginIndexFilePath } : {}
	}));
	const plugins = buildInstalledPluginIndexRecords({
		candidates,
		registry,
		config: params.config,
		diagnostics,
		installRecords
	});
	return {
		index: {
			version: 1,
			warning: INSTALLED_PLUGIN_INDEX_WARNING,
			hostContractVersion: require_version.resolveCompatibilityHostVersion(env),
			compatRegistryVersion: resolveCompatRegistryVersion(),
			migrationVersion: 1,
			policyHash: resolveInstalledPluginIndexPolicyHash(params.config),
			generatedAtMs,
			...params.refreshReason ? { refreshReason: params.refreshReason } : {},
			installRecords,
			plugins,
			diagnostics
		},
		discovery
	};
}
function loadInstalledPluginIndex(params = {}) {
	return buildInstalledPluginIndex(params).index;
}
function loadInstalledPluginIndexWithDiscovery(params = {}) {
	return buildInstalledPluginIndex(params);
}
function refreshInstalledPluginIndex(params) {
	return buildInstalledPluginIndex({
		...params,
		refreshReason: params.reason
	}).index;
}
function getInstalledPluginRecord(index, pluginId) {
	return index.plugins.find((plugin) => plugin.pluginId === pluginId);
}
function isInstalledPluginEnabled(index, pluginId, config) {
	const record = getInstalledPluginRecord(index, pluginId);
	if (!record) return false;
	if (!config) return record.enabled;
	const normalizedConfig = require_config_state.normalizePluginsConfig(config?.plugins);
	const state = require_config_state.resolveEffectivePluginActivationState({
		id: record.pluginId,
		origin: record.origin,
		config: normalizedConfig,
		rootConfig: config,
		enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(record)
	});
	return state.enabled && (record.enabled || state.explicitlyEnabled);
}
//#endregion
Object.defineProperty(exports, "INSTALLED_PLUGIN_INDEX_WARNING", {
	enumerable: true,
	get: function() {
		return INSTALLED_PLUGIN_INDEX_WARNING;
	}
});
Object.defineProperty(exports, "collectPluginManifestCompatCodes", {
	enumerable: true,
	get: function() {
		return collectPluginManifestCompatCodes;
	}
});
Object.defineProperty(exports, "describePluginInstallSource", {
	enumerable: true,
	get: function() {
		return describePluginInstallSource;
	}
});
Object.defineProperty(exports, "extractPluginInstallRecordsFromInstalledPluginIndex", {
	enumerable: true,
	get: function() {
		return extractPluginInstallRecordsFromInstalledPluginIndex;
	}
});
Object.defineProperty(exports, "fileSignatureMatches", {
	enumerable: true,
	get: function() {
		return fileSignatureMatches;
	}
});
Object.defineProperty(exports, "getInstalledPluginRecord", {
	enumerable: true,
	get: function() {
		return getInstalledPluginRecord;
	}
});
Object.defineProperty(exports, "getPluginCompatRecord", {
	enumerable: true,
	get: function() {
		return getPluginCompatRecord;
	}
});
Object.defineProperty(exports, "hasOptionalMissingPluginManifestFile", {
	enumerable: true,
	get: function() {
		return hasOptionalMissingPluginManifestFile;
	}
});
Object.defineProperty(exports, "hashJson", {
	enumerable: true,
	get: function() {
		return hashJson;
	}
});
Object.defineProperty(exports, "isInstalledPluginEnabled", {
	enumerable: true,
	get: function() {
		return isInstalledPluginEnabled;
	}
});
Object.defineProperty(exports, "loadInstalledPluginIndex", {
	enumerable: true,
	get: function() {
		return loadInstalledPluginIndex;
	}
});
Object.defineProperty(exports, "loadInstalledPluginIndexWithDiscovery", {
	enumerable: true,
	get: function() {
		return loadInstalledPluginIndexWithDiscovery;
	}
});
Object.defineProperty(exports, "refreshInstalledPluginIndex", {
	enumerable: true,
	get: function() {
		return refreshInstalledPluginIndex;
	}
});
Object.defineProperty(exports, "resolveCompatRegistryVersion", {
	enumerable: true,
	get: function() {
		return resolveCompatRegistryVersion;
	}
});
Object.defineProperty(exports, "resolveInstalledPluginIndexPolicyHash", {
	enumerable: true,
	get: function() {
		return resolveInstalledPluginIndexPolicyHash;
	}
});
