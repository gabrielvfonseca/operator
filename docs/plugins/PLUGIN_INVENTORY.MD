---
summary: "Generated inventory of Operator plugins shipped in core, published externally, or kept source-only"
read_when:
  - You are deciding whether a plugin ships in the core npm package or installs separately
  - You are updating bundled plugin package metadata or release automation
  - You need the canonical internal vs external plugin list
title: "Plugin inventory"
---

# Plugin inventory

This page is generated from `extensions/*/package.json`, `operator.plugin.json`,
and the root npm package `files` exclusions. Regenerate it with:

```bash
pnpm plugins:inventory:gen
```

## Definitions

- **Core npm package:** built into the `openclaw` npm package and available without a separate plugin install.
- **Official external package:** Operator-maintained plugin omitted from the core npm package, kept in this official inventory, and installed on demand through ClawHub and/or npm.
- **Source checkout only:** repo-local plugin omitted from published npm artifacts and not advertised as an installable package.

Source checkouts are different from npm installs: after `pnpm install`, bundled
plugins load from `extensions/<id>` so local edits and package-local workspace
dependencies are available.

## Install a plugin

Use the install route in each entry to decide whether install is needed. Plugins
that say `included in Operator` are already present in the core package.
Official external packages need one install, then a Gateway restart.

For example, Discord is an official external package:

```bash
operator plugins install @gabrielvfonseca/discord
operator gateway restart
operator plugins inspect discord --runtime --json
```

During the launch cutover, ordinary bare package specs still install from npm.
Use `clawhub:@gabrielvfonseca/discord` or `npm:@gabrielvfonseca/discord` when you need an
explicit source. After install, follow the plugin's setup doc, such as
[Discord](/channels/discord), to add credentials and channel config. See
[Manage plugins](/plugins/manage-plugins) for update, uninstall, and publishing
commands.

Each entry lists the package, distribution route, and description.

## Core npm package

68 plugins

- **[admin-http-rpc](/plugins/reference/admin-http-rpc)** (`@gabrielvfonseca/admin-http-rpc`) - included in Operator. Operator admin HTTP RPC endpoint.

- **[alibaba](/plugins/reference/alibaba)** (`@gabrielvfonseca/alibaba-provider`) - included in Operator. Adds video generation provider support.

- **[anthropic](/plugins/reference/anthropic)** (`@gabrielvfonseca/anthropic-provider`) - included in Operator. Anthropic models, Claude CLI, and native Claude session catalog.

- **[azure-speech](/plugins/reference/azure-speech)** (`@gabrielvfonseca/azure-speech`) - included in Operator. Azure AI Speech text-to-speech (MP3, native Ogg/Opus voice notes, PCM telephony).

- **[bonjour](/plugins/reference/bonjour)** (`@gabrielvfonseca/bonjour`) - included in Operator. Advertise the local Operator gateway over Bonjour/mDNS.

- **[browser](/plugins/reference/browser)** (`@gabrielvfonseca/browser-plugin`) - included in Operator. Adds agent-callable tools.

- **[byteplus](/plugins/reference/byteplus)** (`@gabrielvfonseca/byteplus-provider`) - included in Operator. Adds BytePlus, BytePlus Plan model provider support to Operator.

- **[canvas](/plugins/reference/canvas)** (`@gabrielvfonseca/canvas-plugin`) - included in Operator. Experimental Canvas control and A2UI rendering surfaces for paired nodes.

- **[clawrouter](/plugins/reference/clawrouter)** (`@gabrielvfonseca/clawrouter`) - included in Operator. Adds ClawRouter model provider support to Operator.

- **[cohere](/plugins/reference/cohere)** (`@gabrielvfonseca/cohere-provider`) - included in Operator; npm; ClawHub: `clawhub:@gabrielvfonseca/cohere-provider`. Operator Cohere provider plugin.

- **[comfy](/plugins/reference/comfy)** (`@gabrielvfonseca/comfy-provider`) - included in Operator. Adds ComfyUI model provider support to Operator.

- **[copilot-proxy](/plugins/reference/copilot-proxy)** (`@gabrielvfonseca/copilot-proxy`) - included in Operator. Adds Copilot Proxy model provider support to Operator.

- **[crabbox](/plugins/reference/crabbox)** (`@gabrielvfonseca/crabbox-provider`) - included in Operator. Cloud worker provider backed by the Crabbox CLI.

- **[deepgram](/plugins/reference/deepgram)** (`@gabrielvfonseca/deepgram-provider`) - included in Operator. Adds media understanding provider support. Adds realtime transcription provider support.

- **[document-extract](/plugins/reference/document-extract)** (`@gabrielvfonseca/document-extract-plugin`) - included in Operator. Extract text and fallback page images from local document attachments.

- **[duckduckgo](/plugins/reference/duckduckgo)** (`@gabrielvfonseca/duckduckgo-plugin`) - included in Operator. Adds web search provider support.

- **[elevenlabs](/plugins/reference/elevenlabs)** (`@gabrielvfonseca/elevenlabs-speech`) - included in Operator. Adds media understanding provider support. Adds realtime transcription provider support. Adds text-to-speech provider support.

- **[fal](/plugins/reference/fal)** (`@gabrielvfonseca/fal-provider`) - included in Operator. Adds fal model provider support to Operator.

- **[file-transfer](/plugins/reference/file-transfer)** (`@gabrielvfonseca/file-transfer`) - included in Operator. Fetch, list, and write files on paired nodes via dedicated node commands. Bypasses bash stdout truncation by using base64 over node.invoke for binaries up to 16 MB.

- **[github-copilot](/plugins/reference/github-copilot)** (`@gabrielvfonseca/github-copilot-provider`) - included in Operator. Adds GitHub Copilot model provider support to Operator.

- **[google](/plugins/reference/google)** (`@gabrielvfonseca/google-plugin`) - included in Operator. Adds Google, Google Gemini CLI, Google Vertex model provider support to Operator.

- **[huggingface](/plugins/reference/huggingface)** (`@gabrielvfonseca/huggingface-provider`) - included in Operator. Adds Hugging Face model provider support to Operator.

- **[imessage](/plugins/reference/imessage)** (`@gabrielvfonseca/imessage`) - included in Operator. Adds the iMessage channel surface for sending and receiving Operator messages.

- **[linux-canvas](/plugins/reference/linux-canvas)** (`@gabrielvfonseca/linux-canvas`) - included in Operator. Canvas rendering bridge for the Operator Linux desktop app.

- **[linux-node](/plugins/reference/linux-node)** (`@gabrielvfonseca/linux-node`) - included in Operator. Desktop notifications, camera capture, and location for Linux node hosts.

- **[litellm](/plugins/reference/litellm)** (`@gabrielvfonseca/litellm-provider`) - included in Operator. Adds LiteLLM model provider support to Operator.

- **[llm-task](/plugins/reference/llm-task)** (`@gabrielvfonseca/llm-task`) - included in Operator. Generic JSON-only LLM tool for structured tasks callable from workflows.

- **[lmstudio](/plugins/reference/lmstudio)** (`@gabrielvfonseca/lmstudio-provider`) - included in Operator. Adds LM Studio model provider support to Operator.

- **[logbook](/plugins/reference/logbook)** (`@gabrielvfonseca/logbook`) - included in Operator. Automatic work journal: captures periodic screen snapshots from a paired node and turns them into a reviewable timeline of your day.

- **[memory-core](/plugins/reference/memory-core)** (`@gabrielvfonseca/memory-core`) - included in Operator. Adds agent-callable tools.

- **[memory-wiki](/plugins/reference/memory-wiki)** (`@gabrielvfonseca/memory-wiki`) - included in Operator. Persistent wiki compiler and Obsidian-friendly knowledge vault for Operator.

- **[meta](/plugins/reference/meta)** (`@gabrielvfonseca/meta-provider`) - included in Operator; npm; ClawHub: `clawhub:@gabrielvfonseca/meta-provider`. Adds Meta model provider support to Operator.

- **[microsoft](/plugins/reference/microsoft)** (`@gabrielvfonseca/microsoft-speech`) - included in Operator. Adds text-to-speech provider support.

- **[microsoft-foundry](/plugins/reference/microsoft-foundry)** (`@gabrielvfonseca/microsoft-foundry`) - included in Operator. Adds Microsoft Foundry model provider support to Operator.

- **[migrate-claude](/plugins/reference/migrate-claude)** (`@gabrielvfonseca/migrate-claude`) - included in Operator. Imports Claude Code and Claude Desktop instructions, MCP servers, skills, and safe configuration into Operator.

- **[migrate-hermes](/plugins/reference/migrate-hermes)** (`@gabrielvfonseca/migrate-hermes`) - included in Operator. Imports Hermes configuration, memories, skills, and supported credentials into Operator.

- **[minimax](/plugins/reference/minimax)** (`@gabrielvfonseca/minimax-provider`) - included in Operator. Adds MiniMax, MiniMax Portal model provider support to Operator.

- **[mistral](/plugins/reference/mistral)** (`@gabrielvfonseca/mistral-provider`) - included in Operator. Adds Mistral model provider support to Operator.

- **[novita](/plugins/reference/novita)** (`@gabrielvfonseca/novita-provider`) - included in Operator. Adds Novita, Novita AI, Novitaai model provider support to Operator.

- **[nvidia](/plugins/reference/nvidia)** (`@gabrielvfonseca/nvidia-provider`) - included in Operator. Adds NVIDIA model provider support to Operator.

- **[oc-path](/plugins/reference/oc-path)** (`@gabrielvfonseca/oc-path`) - included in Operator. Adds the operator path CLI for oc:// workspace file addressing.

- **[ollama](/plugins/reference/ollama)** (`@gabrielvfonseca/ollama-provider`) - included in Operator. Adds Ollama, Ollama Cloud model provider support to Operator.

- **[onepassword](/plugins/reference/onepassword)** (`@gabrielvfonseca/onepassword`) - included in Operator. Curated 1Password secrets broker with approval policy and SQLite audit history.

- **[open-prose](/plugins/reference/open-prose)** (`@gabrielvfonseca/open-prose`) - included in Operator. OpenProse VM skill pack with a /prose slash command.

- **[openai](/plugins/reference/openai)** (`@gabrielvfonseca/openai-provider`) - included in Operator. Adds OpenAI model provider support to Operator.

- **[opencode](/plugins/reference/opencode)** (`@gabrielvfonseca/opencode-provider`) - included in Operator. Adds OpenCode model provider support to Operator.

- **[opencode-go](/plugins/reference/opencode-go)** (`@gabrielvfonseca/opencode-go-provider`) - included in Operator. Adds OpenCode Go model provider support to Operator.

- **[openrouter](/plugins/reference/openrouter)** (`@gabrielvfonseca/openrouter-provider`) - included in Operator. Adds OpenRouter model provider support to Operator.

- **[policy](/plugins/reference/policy)** (`@gabrielvfonseca/policy`) - included in Operator. Adds policy-backed doctor checks for workspace conformance.

- **[reef](/plugins/reference/reef)** (`@gabrielvfonseca/reef`) - included in Operator. Guarded end-to-end encrypted claw channel.

- **[runway](/plugins/reference/runway)** (`@gabrielvfonseca/runway-provider`) - included in Operator. Adds video generation provider support.

- **[senseaudio](/plugins/reference/senseaudio)** (`@gabrielvfonseca/senseaudio-provider`) - included in Operator. Adds media understanding provider support.

- **[sglang](/plugins/reference/sglang)** (`@gabrielvfonseca/sglang-provider`) - included in Operator. Adds SGLang model provider support to Operator.

- **[synthetic](/plugins/reference/synthetic)** (`@gabrielvfonseca/synthetic-provider`) - included in Operator. Adds Synthetic model provider support to Operator.

- **[telegram](/plugins/reference/telegram)** (`@gabrielvfonseca/telegram`) - included in Operator. Adds the Telegram channel surface for sending and receiving Operator messages.

- **[together](/plugins/reference/together)** (`@gabrielvfonseca/together-provider`) - included in Operator. Adds Together model provider support to Operator.

- **[tts-local-cli](/plugins/reference/tts-local-cli)** (`@gabrielvfonseca/tts-local-cli`) - included in Operator. Adds text-to-speech provider support.

- **[vault](/plugins/reference/vault)** (`@gabrielvfonseca/vault`) - included in Operator. HashiCorp Vault SecretRef provider integration.

- **[vllm](/plugins/reference/vllm)** (`@gabrielvfonseca/vllm-provider`) - included in Operator. Adds vLLM model provider support to Operator.

- **[volcengine](/plugins/reference/volcengine)** (`@gabrielvfonseca/volcengine-provider`) - included in Operator. Adds Volcengine, Volcengine Plan model provider support to Operator.

- **[voyage](/plugins/reference/voyage)** (`@gabrielvfonseca/voyage-provider`) - included in Operator. Adds memory embedding provider support.

- **[vydra](/plugins/reference/vydra)** (`@gabrielvfonseca/vydra-provider`) - included in Operator. Adds Vydra model provider support to Operator.

- **[web-readability](/plugins/reference/web-readability)** (`@gabrielvfonseca/web-readability-plugin`) - included in Operator. Extract readable article content from local HTML web fetch responses.

- **[webhooks](/plugins/reference/webhooks)** (`@gabrielvfonseca/webhooks`) - included in Operator. Authenticated inbound webhooks that bind external automation to Operator TaskFlows.

- **[workboard](/plugins/reference/workboard)** (`@gabrielvfonseca/workboard`) - included in Operator. Dashboard workboard for agent-owned issues and sessions.

- **[workspaces](/plugins/reference/workspaces)** (`@gabrielvfonseca/workspaces-plugin`) - included in Operator. Agent-composable Workspaces document and control-plane backend.

- **[xai](/plugins/reference/xai)** (`@gabrielvfonseca/xai-plugin`) - included in Operator. Adds xAI model provider support to Operator.

- **[xiaomi](/plugins/reference/xiaomi)** (`@gabrielvfonseca/xiaomi-provider`) - included in Operator. Adds Xiaomi, Xiaomi Token Plan model provider support to Operator.

## Official external packages

71 plugins

- **[acpx](/plugins/reference/acpx)** (`@gabrielvfonseca/acpx`) - npm; ClawHub. Operator ACP runtime backend with plugin-owned session and transport management.

- **[amazon-bedrock](/plugins/reference/amazon-bedrock)** (`@gabrielvfonseca/amazon-bedrock-provider`) - npm; ClawHub. Operator Amazon Bedrock provider plugin with model discovery, embeddings, and guardrail support.

- **[amazon-bedrock-mantle](/plugins/reference/amazon-bedrock-mantle)** (`@gabrielvfonseca/amazon-bedrock-mantle-provider`) - npm; ClawHub. Operator Amazon Bedrock Mantle provider plugin for OpenAI-compatible model routing.

- **[anthropic-vertex](/plugins/reference/anthropic-vertex)** (`@gabrielvfonseca/anthropic-vertex-provider`) - npm; ClawHub. Operator Anthropic Vertex provider plugin for Claude models on Google Vertex AI.

- **[arcee](/plugins/reference/arcee)** (`@gabrielvfonseca/arcee-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/arcee-provider`. Adds Arcee model provider support to Operator.

- **[brave](/plugins/reference/brave)** (`@gabrielvfonseca/brave-plugin`) - npm; ClawHub. Operator Brave Search provider plugin for web search.

- **[cerebras](/plugins/reference/cerebras)** (`@gabrielvfonseca/cerebras-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/cerebras-provider`. Adds Cerebras model provider support to Operator.

- **[chutes](/plugins/reference/chutes)** (`@gabrielvfonseca/chutes-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/chutes-provider`. Adds Chutes model provider support to Operator.

- **[clickclack](/plugins/reference/clickclack)** (`@gabrielvfonseca/clickclack`) - npm; ClawHub: `clawhub:@gabrielvfonseca/clickclack`. Adds the Clickclack channel surface for sending and receiving Operator messages.

- **[cloudflare-ai-gateway](/plugins/reference/cloudflare-ai-gateway)** (`@gabrielvfonseca/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/cloudflare-ai-gateway-provider`. Adds Cloudflare AI Gateway model provider support to Operator.

- **[codex](/plugins/reference/codex)** (`@gabrielvfonseca/codex`) - npm; ClawHub. Codex app-server harness, model provider, and native session catalog.

- **[copilot](/plugins/reference/copilot)** (`@gabrielvfonseca/copilot`) - npm; ClawHub: `clawhub:@gabrielvfonseca/copilot`. Registers the GitHub Copilot agent runtime.

- **[deepinfra](/plugins/reference/deepinfra)** (`@gabrielvfonseca/deepinfra-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/deepinfra-provider`. Adds DeepInfra model provider support to Operator.

- **[deepseek](/plugins/reference/deepseek)** (`@gabrielvfonseca/deepseek-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/deepseek-provider`. Adds DeepSeek model provider support to Operator.

- **[diagnostics-otel](/plugins/reference/diagnostics-otel)** (`@gabrielvfonseca/diagnostics-otel`) - npm; ClawHub: `clawhub:@gabrielvfonseca/diagnostics-otel`. Operator diagnostics OpenTelemetry exporter for metrics, traces, and logs.

- **[diagnostics-prometheus](/plugins/reference/diagnostics-prometheus)** (`@gabrielvfonseca/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@gabrielvfonseca/diagnostics-prometheus`. Operator diagnostics Prometheus exporter for runtime metrics.

- **[diffs](/plugins/reference/diffs)** (`@gabrielvfonseca/diffs`) - npm; ClawHub. Operator read-only diff viewer plugin and file renderer for agents.

- **[diffs-language-pack](/plugins/reference/diffs-language-pack)** (`@gabrielvfonseca/diffs-language-pack`) - npm; ClawHub: `clawhub:@gabrielvfonseca/diffs-language-pack`. Adds syntax highlighting for languages outside the default diffs viewer set.

- **[discord](/plugins/reference/discord)** (`@gabrielvfonseca/discord`) - npm; ClawHub. Operator Discord channel plugin for channels, DMs, commands, and app events.

- **[exa](/plugins/reference/exa)** (`@gabrielvfonseca/exa-plugin`) - npm; ClawHub: `clawhub:@gabrielvfonseca/exa-plugin`. Adds web search provider support.

- **[featherless](/plugins/reference/featherless)** (`@gabrielvfonseca/featherless-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/featherless-provider`. Operator Featherless AI provider plugin.

- **[feishu](/plugins/reference/feishu)** (`@gabrielvfonseca/feishu`) - npm; ClawHub. Operator Feishu/Lark channel plugin for chats and workplace tools (community maintained by @m1heng).

- **[firecrawl](/plugins/reference/firecrawl)** (`@gabrielvfonseca/firecrawl-plugin`) - npm; ClawHub: `clawhub:@gabrielvfonseca/firecrawl-plugin`. Adds agent-callable tools. Adds web fetch provider support. Adds web search provider support.

- **[fireworks](/plugins/reference/fireworks)** (`@gabrielvfonseca/fireworks-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/fireworks-provider`. Adds Fireworks model provider support to Operator.

- **[gmi](/plugins/reference/gmi)** (`@gabrielvfonseca/gmi-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/gmi-provider`. Operator GMI Cloud provider plugin.

- **[google-meet](/plugins/reference/google-meet)** (`@gabrielvfonseca/google-meet`) - npm; ClawHub. Operator Google Meet participant plugin for joining calls through Chrome or Twilio transports.

- **[googlechat](/plugins/reference/googlechat)** (`@gabrielvfonseca/googlechat`) - npm; ClawHub. Operator Google Chat channel plugin for spaces and direct messages.

- **[gradium](/plugins/reference/gradium)** (`@gabrielvfonseca/gradium-speech`) - npm; ClawHub: `clawhub:@gabrielvfonseca/gradium-speech`. Adds text-to-speech provider support.

- **[groq](/plugins/reference/groq)** (`@gabrielvfonseca/groq-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/groq-provider`. Adds Groq model provider support to Operator.

- **[inworld](/plugins/reference/inworld)** (`@gabrielvfonseca/inworld-speech`) - npm; ClawHub: `clawhub:@gabrielvfonseca/inworld-speech`. Inworld streaming text-to-speech (MP3, OGG_OPUS, PCM telephony).

- **[irc](/plugins/reference/irc)** (`@gabrielvfonseca/irc`) - npm; ClawHub: `clawhub:@gabrielvfonseca/irc`. Adds the IRC channel surface for sending and receiving Operator messages.

- **[kilocode](/plugins/reference/kilocode)** (`@gabrielvfonseca/kilocode-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/kilocode-provider`. Adds Kilocode model provider support to Operator.

- **[kimi](/plugins/reference/kimi)** (`@gabrielvfonseca/kimi-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/kimi-provider`. Adds Kimi, Kimi Coding model provider support to Operator.

- **[line](/plugins/reference/line)** (`@gabrielvfonseca/line`) - npm; ClawHub. Operator LINE channel plugin for LINE Bot API chats.

- **[llama-cpp](/plugins/reference/llama-cpp)** (`@gabrielvfonseca/llama-cpp-provider`) - npm; ClawHub. Local GGUF embeddings through node-llama-cpp.

- **[lobster](/plugins/reference/lobster)** (`@gabrielvfonseca/lobster`) - npm; ClawHub. Lobster workflow tool plugin for typed pipelines and resumable approvals.

- **[longcat](/plugins/reference/longcat)** (`@gabrielvfonseca/longcat-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/longcat-provider`. Operator LongCat provider plugin.

- **[matrix](/plugins/reference/matrix)** (`@gabrielvfonseca/matrix`) - ClawHub: `clawhub:@gabrielvfonseca/matrix`; npm. Operator Matrix channel plugin for rooms and direct messages.

- **[mattermost](/plugins/reference/mattermost)** (`@gabrielvfonseca/mattermost`) - npm; ClawHub: `clawhub:@gabrielvfonseca/mattermost`. Adds the Mattermost channel surface for sending and receiving Operator messages.

- **[memory-lancedb](/plugins/reference/memory-lancedb)** (`@gabrielvfonseca/memory-lancedb`) - npm; ClawHub. Operator LanceDB-backed long-term memory plugin with auto-recall, auto-capture, and vector search.

- **[moonshot](/plugins/reference/moonshot)** (`@gabrielvfonseca/moonshot-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/moonshot-provider`. Adds Moonshot model provider support to Operator.

- **[msteams](/plugins/reference/msteams)** (`@gabrielvfonseca/msteams`) - npm; ClawHub. Operator Microsoft Teams channel plugin for bot conversations.

- **[mxc](/plugins/reference/mxc)** (`@gabrielvfonseca/mxc-sandbox`) - npm; ClawHub. OS-level sandboxed tool execution via MXC for MXC-capable Windows hosts: runs commands in ProcessContainer (Windows) with configured MXC policy files.

- **[nextcloud-talk](/plugins/reference/nextcloud-talk)** (`@gabrielvfonseca/nextcloud-talk`) - npm; ClawHub. Operator Nextcloud Talk channel plugin for conversations.

- **[nostr](/plugins/reference/nostr)** (`@gabrielvfonseca/nostr`) - npm; ClawHub. Operator Nostr channel plugin for NIP-04 encrypted direct messages.

- **[openshell](/plugins/reference/openshell)** (`@gabrielvfonseca/openshell-sandbox`) - npm; ClawHub. Operator sandbox backend for the NVIDIA OpenShell CLI with mirrored local workspaces and SSH command execution.

- **[parallel](/tools/parallel-search)** (`@gabrielvfonseca/parallel-plugin`) - npm; ClawHub: `clawhub:@gabrielvfonseca/parallel-plugin`. Adds web search provider support.

- **[perplexity](/plugins/reference/perplexity)** (`@gabrielvfonseca/perplexity-plugin`) - npm; ClawHub: `clawhub:@gabrielvfonseca/perplexity-plugin`. Adds web search provider support.

- **[pixverse](/plugins/reference/pixverse)** (`@gabrielvfonseca/pixverse-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/pixverse-provider`. Operator PixVerse video generation provider plugin.

- **[qianfan](/plugins/reference/qianfan)** (`@gabrielvfonseca/qianfan-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/qianfan-provider`. Adds Qianfan model provider support to Operator.

- **[qqbot](/plugins/reference/qqbot)** (`@gabrielvfonseca/qqbot`) - npm; ClawHub. Operator QQ Bot channel plugin for group and direct-message workflows.

- **[qwen](/plugins/reference/qwen)** (`@gabrielvfonseca/qwen-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/qwen-provider`. Adds Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI, Qwen Token Plan, Bailian Token Plan model provider support to Operator.

- **[raft](/plugins/reference/raft)** (`@gabrielvfonseca/raft`) - npm; ClawHub. Operator Raft channel plugin for secure CLI wake bridges.

- **[searxng](/plugins/reference/searxng)** (`@gabrielvfonseca/searxng-plugin`) - npm; ClawHub: `clawhub:@gabrielvfonseca/searxng-plugin`. Adds web search provider support.

- **[signal](/plugins/reference/signal)** (`@gabrielvfonseca/signal`) - npm; ClawHub: `clawhub:@gabrielvfonseca/signal`. Adds the Signal channel surface for sending and receiving Operator messages.

- **[slack](/plugins/reference/slack)** (`@gabrielvfonseca/slack`) - npm; ClawHub. Operator Slack channel plugin for channels, DMs, commands, and app events.

- **[sms](/plugins/reference/sms)** (`@gabrielvfonseca/sms`) - npm; ClawHub: `clawhub:@gabrielvfonseca/sms`. Twilio SMS channel plugin for Operator text messages.

- **[stepfun](/plugins/reference/stepfun)** (`@gabrielvfonseca/stepfun-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/stepfun-provider`. Adds StepFun, StepFun Plan model provider support to Operator.

- **[synology-chat](/plugins/reference/synology-chat)** (`@gabrielvfonseca/synology-chat`) - npm; ClawHub. Synology Chat channel plugin for Operator channels and direct messages.

- **[tavily](/plugins/reference/tavily)** (`@gabrielvfonseca/tavily-plugin`) - npm; ClawHub: `clawhub:@gabrielvfonseca/tavily-plugin`. Adds agent-callable tools. Adds web search provider support.

- **[tencent](/plugins/reference/tencent)** (`@gabrielvfonseca/tencent-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/tencent-provider`. Adds Tencent TokenHub, Tencent Tokenplan model provider support to Operator.

- **[tlon](/plugins/reference/tlon)** (`@gabrielvfonseca/tlon`) - npm; ClawHub. Operator Tlon/Urbit channel plugin for chat workflows.

- **[tokenjuice](/plugins/reference/tokenjuice)** (`@gabrielvfonseca/tokenjuice`) - npm; ClawHub: `clawhub:@gabrielvfonseca/tokenjuice`. Compacts exec and bash tool results with tokenjuice reducers.

- **[twitch](/plugins/reference/twitch)** (`@gabrielvfonseca/twitch`) - npm; ClawHub. Operator Twitch channel plugin for chat and moderation workflows.

- **[venice](/plugins/reference/venice)** (`@gabrielvfonseca/venice-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/venice-provider`. Adds Venice model provider support to Operator.

- **[vercel-ai-gateway](/plugins/reference/vercel-ai-gateway)** (`@gabrielvfonseca/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/vercel-ai-gateway-provider`. Adds Vercel AI Gateway model provider support to Operator.

- **[voice-call](/plugins/reference/voice-call)** (`@gabrielvfonseca/voice-call`) - npm; ClawHub. Operator voice-call plugin for Twilio, Telnyx, and Plivo phone calls.

- **[whatsapp](/plugins/reference/whatsapp)** (`@gabrielvfonseca/whatsapp`) - ClawHub: `clawhub:@gabrielvfonseca/whatsapp`; npm. Operator WhatsApp channel plugin for WhatsApp Web chats.

- **[zai](/plugins/reference/zai)** (`@gabrielvfonseca/zai-provider`) - npm; ClawHub: `clawhub:@gabrielvfonseca/zai-provider`. Adds Z.AI model provider support to Operator.

- **[zalo](/plugins/reference/zalo)** (`@gabrielvfonseca/zalo`) - npm; ClawHub. Operator Zalo channel plugin for bot and webhook chats.

- **[zalouser](/plugins/reference/zalouser)** (`@gabrielvfonseca/zalouser`) - npm; ClawHub. Operator Zalo Personal Account plugin via native zca-js integration.

## Source checkout only

2 plugins

- **[qa-channel](/plugins/reference/qa-channel)** (`@gabrielvfonseca/qa-channel`) - source checkout only. Adds the QA Channel surface for sending and receiving Operator messages.

- **[qa-lab](/plugins/reference/qa-lab)** (`@gabrielvfonseca/qa-lab`) - source checkout only. Operator QA lab plugin with private debugger UI and scenario runner.
