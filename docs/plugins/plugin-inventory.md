---
summary: "Generated inventory of OpenClaw plugins shipped in core, published externally, or kept source-only"
read_when:
  - You are deciding whether a plugin ships in the core npm package or installs separately
  - You are updating bundled plugin package metadata or release automation
  - You need the canonical internal vs external plugin list
title: "Plugin inventory"
---

# Plugin inventory

This page is generated from `extensions/*/package.json`, `openclaw.plugin.json`,
and the root npm package `files` exclusions. Regenerate it with:

```bash
pnpm plugins:inventory:gen
```

## Definitions

- **Core npm package:** built into the `openclaw` npm package and available without a separate plugin install.
- **Official external package:** OpenClaw-maintained plugin omitted from the core npm package, kept in this official inventory, and installed on demand through ClawHub and/or npm.
- **Source checkout only:** repo-local plugin omitted from published npm artifacts and not advertised as an installable package.

Source checkouts are different from npm installs: after `pnpm install`, bundled
plugins load from `extensions/<id>` so local edits and package-local workspace
dependencies are available.

## Install a plugin

Use the install route in each entry to decide whether install is needed. Plugins
that say `included in OpenClaw` are already present in the core package.
Official external packages need one install, then a Gateway restart.

For example, Discord is an official external package:

```bash
openclaw plugins install @operator/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

During the launch cutover, ordinary bare package specs still install from npm.
Use `clawhub:@operator/discord` or `npm:@operator/discord` when you need an
explicit source. After install, follow the plugin's setup doc, such as
[Discord](/channels/discord), to add credentials and channel config. See
[Manage plugins](/plugins/manage-plugins) for update, uninstall, and publishing
commands.

Each entry lists the package, distribution route, and description.

## Core npm package

68 plugins

- **[admin-http-rpc](/plugins/reference/admin-http-rpc)** (`@operator/admin-http-rpc`) - included in OpenClaw. OpenClaw admin HTTP RPC endpoint.

- **[alibaba](/plugins/reference/alibaba)** (`@operator/alibaba-provider`) - included in OpenClaw. Adds video generation provider support.

- **[anthropic](/plugins/reference/anthropic)** (`@operator/anthropic-provider`) - included in OpenClaw. Anthropic models, Claude CLI, and native Claude session catalog.

- **[azure-speech](/plugins/reference/azure-speech)** (`@operator/azure-speech`) - included in OpenClaw. Azure AI Speech text-to-speech (MP3, native Ogg/Opus voice notes, PCM telephony).

- **[bonjour](/plugins/reference/bonjour)** (`@operator/bonjour`) - included in OpenClaw. Advertise the local OpenClaw gateway over Bonjour/mDNS.

- **[browser](/plugins/reference/browser)** (`@operator/browser-plugin`) - included in OpenClaw. Adds agent-callable tools.

- **[byteplus](/plugins/reference/byteplus)** (`@operator/byteplus-provider`) - included in OpenClaw. Adds BytePlus, BytePlus Plan model provider support to OpenClaw.

- **[canvas](/plugins/reference/canvas)** (`@operator/canvas-plugin`) - included in OpenClaw. Experimental Canvas control and A2UI rendering surfaces for paired nodes.

- **[clawrouter](/plugins/reference/clawrouter)** (`@operator/clawrouter`) - included in OpenClaw. Adds ClawRouter model provider support to OpenClaw.

- **[cohere](/plugins/reference/cohere)** (`@operator/cohere-provider`) - included in OpenClaw; npm; ClawHub: `clawhub:@operator/cohere-provider`. OpenClaw Cohere provider plugin.

- **[comfy](/plugins/reference/comfy)** (`@operator/comfy-provider`) - included in OpenClaw. Adds ComfyUI model provider support to OpenClaw.

- **[copilot-proxy](/plugins/reference/copilot-proxy)** (`@operator/copilot-proxy`) - included in OpenClaw. Adds Copilot Proxy model provider support to OpenClaw.

- **[crabbox](/plugins/reference/crabbox)** (`@operator/crabbox-provider`) - included in OpenClaw. Cloud worker provider backed by the Crabbox CLI.

- **[deepgram](/plugins/reference/deepgram)** (`@operator/deepgram-provider`) - included in OpenClaw. Adds media understanding provider support. Adds realtime transcription provider support.

- **[document-extract](/plugins/reference/document-extract)** (`@operator/document-extract-plugin`) - included in OpenClaw. Extract text and fallback page images from local document attachments.

- **[duckduckgo](/plugins/reference/duckduckgo)** (`@operator/duckduckgo-plugin`) - included in OpenClaw. Adds web search provider support.

- **[elevenlabs](/plugins/reference/elevenlabs)** (`@operator/elevenlabs-speech`) - included in OpenClaw. Adds media understanding provider support. Adds realtime transcription provider support. Adds text-to-speech provider support.

- **[fal](/plugins/reference/fal)** (`@operator/fal-provider`) - included in OpenClaw. Adds fal model provider support to OpenClaw.

- **[file-transfer](/plugins/reference/file-transfer)** (`@operator/file-transfer`) - included in OpenClaw. Fetch, list, and write files on paired nodes via dedicated node commands. Bypasses bash stdout truncation by using base64 over node.invoke for binaries up to 16 MB.

- **[github-copilot](/plugins/reference/github-copilot)** (`@operator/github-copilot-provider`) - included in OpenClaw. Adds GitHub Copilot model provider support to OpenClaw.

- **[google](/plugins/reference/google)** (`@operator/google-plugin`) - included in OpenClaw. Adds Google, Google Gemini CLI, Google Vertex model provider support to OpenClaw.

- **[huggingface](/plugins/reference/huggingface)** (`@operator/huggingface-provider`) - included in OpenClaw. Adds Hugging Face model provider support to OpenClaw.

- **[imessage](/plugins/reference/imessage)** (`@operator/imessage`) - included in OpenClaw. Adds the iMessage channel surface for sending and receiving OpenClaw messages.

- **[linux-canvas](/plugins/reference/linux-canvas)** (`@operator/linux-canvas`) - included in OpenClaw. Canvas rendering bridge for the OpenClaw Linux desktop app.

- **[linux-node](/plugins/reference/linux-node)** (`@operator/linux-node`) - included in OpenClaw. Desktop notifications, camera capture, and location for Linux node hosts.

- **[litellm](/plugins/reference/litellm)** (`@operator/litellm-provider`) - included in OpenClaw. Adds LiteLLM model provider support to OpenClaw.

- **[llm-task](/plugins/reference/llm-task)** (`@operator/llm-task`) - included in OpenClaw. Generic JSON-only LLM tool for structured tasks callable from workflows.

- **[lmstudio](/plugins/reference/lmstudio)** (`@operator/lmstudio-provider`) - included in OpenClaw. Adds LM Studio model provider support to OpenClaw.

- **[logbook](/plugins/reference/logbook)** (`@operator/logbook`) - included in OpenClaw. Automatic work journal: captures periodic screen snapshots from a paired node and turns them into a reviewable timeline of your day.

- **[memory-core](/plugins/reference/memory-core)** (`@operator/memory-core`) - included in OpenClaw. Adds agent-callable tools.

- **[memory-wiki](/plugins/reference/memory-wiki)** (`@operator/memory-wiki`) - included in OpenClaw. Persistent wiki compiler and Obsidian-friendly knowledge vault for OpenClaw.

- **[meta](/plugins/reference/meta)** (`@operator/meta-provider`) - included in OpenClaw; npm; ClawHub: `clawhub:@operator/meta-provider`. Adds Meta model provider support to OpenClaw.

- **[microsoft](/plugins/reference/microsoft)** (`@operator/microsoft-speech`) - included in OpenClaw. Adds text-to-speech provider support.

- **[microsoft-foundry](/plugins/reference/microsoft-foundry)** (`@operator/microsoft-foundry`) - included in OpenClaw. Adds Microsoft Foundry model provider support to OpenClaw.

- **[migrate-claude](/plugins/reference/migrate-claude)** (`@operator/migrate-claude`) - included in OpenClaw. Imports Claude Code and Claude Desktop instructions, MCP servers, skills, and safe configuration into OpenClaw.

- **[migrate-hermes](/plugins/reference/migrate-hermes)** (`@operator/migrate-hermes`) - included in OpenClaw. Imports Hermes configuration, memories, skills, and supported credentials into OpenClaw.

- **[minimax](/plugins/reference/minimax)** (`@operator/minimax-provider`) - included in OpenClaw. Adds MiniMax, MiniMax Portal model provider support to OpenClaw.

- **[mistral](/plugins/reference/mistral)** (`@operator/mistral-provider`) - included in OpenClaw. Adds Mistral model provider support to OpenClaw.

- **[novita](/plugins/reference/novita)** (`@operator/novita-provider`) - included in OpenClaw. Adds Novita, Novita AI, Novitaai model provider support to OpenClaw.

- **[nvidia](/plugins/reference/nvidia)** (`@operator/nvidia-provider`) - included in OpenClaw. Adds NVIDIA model provider support to OpenClaw.

- **[oc-path](/plugins/reference/oc-path)** (`@operator/oc-path`) - included in OpenClaw. Adds the openclaw path CLI for oc:// workspace file addressing.

- **[ollama](/plugins/reference/ollama)** (`@operator/ollama-provider`) - included in OpenClaw. Adds Ollama, Ollama Cloud model provider support to OpenClaw.

- **[onepassword](/plugins/reference/onepassword)** (`@operator/onepassword`) - included in OpenClaw. Curated 1Password secrets broker with approval policy and SQLite audit history.

- **[open-prose](/plugins/reference/open-prose)** (`@operator/open-prose`) - included in OpenClaw. OpenProse VM skill pack with a /prose slash command.

- **[openai](/plugins/reference/openai)** (`@operator/openai-provider`) - included in OpenClaw. Adds OpenAI model provider support to OpenClaw.

- **[opencode](/plugins/reference/opencode)** (`@operator/opencode-provider`) - included in OpenClaw. Adds OpenCode model provider support to OpenClaw.

- **[opencode-go](/plugins/reference/opencode-go)** (`@operator/opencode-go-provider`) - included in OpenClaw. Adds OpenCode Go model provider support to OpenClaw.

- **[openrouter](/plugins/reference/openrouter)** (`@operator/openrouter-provider`) - included in OpenClaw. Adds OpenRouter model provider support to OpenClaw.

- **[policy](/plugins/reference/policy)** (`@operator/policy`) - included in OpenClaw. Adds policy-backed doctor checks for workspace conformance.

- **[reef](/plugins/reference/reef)** (`@operator/reef`) - included in OpenClaw. Guarded end-to-end encrypted claw channel.

- **[runway](/plugins/reference/runway)** (`@operator/runway-provider`) - included in OpenClaw. Adds video generation provider support.

- **[senseaudio](/plugins/reference/senseaudio)** (`@operator/senseaudio-provider`) - included in OpenClaw. Adds media understanding provider support.

- **[sglang](/plugins/reference/sglang)** (`@operator/sglang-provider`) - included in OpenClaw. Adds SGLang model provider support to OpenClaw.

- **[synthetic](/plugins/reference/synthetic)** (`@operator/synthetic-provider`) - included in OpenClaw. Adds Synthetic model provider support to OpenClaw.

- **[telegram](/plugins/reference/telegram)** (`@operator/telegram`) - included in OpenClaw. Adds the Telegram channel surface for sending and receiving OpenClaw messages.

- **[together](/plugins/reference/together)** (`@operator/together-provider`) - included in OpenClaw. Adds Together model provider support to OpenClaw.

- **[tts-local-cli](/plugins/reference/tts-local-cli)** (`@operator/tts-local-cli`) - included in OpenClaw. Adds text-to-speech provider support.

- **[vault](/plugins/reference/vault)** (`@operator/vault`) - included in OpenClaw. HashiCorp Vault SecretRef provider integration.

- **[vllm](/plugins/reference/vllm)** (`@operator/vllm-provider`) - included in OpenClaw. Adds vLLM model provider support to OpenClaw.

- **[volcengine](/plugins/reference/volcengine)** (`@operator/volcengine-provider`) - included in OpenClaw. Adds Volcengine, Volcengine Plan model provider support to OpenClaw.

- **[voyage](/plugins/reference/voyage)** (`@operator/voyage-provider`) - included in OpenClaw. Adds memory embedding provider support.

- **[vydra](/plugins/reference/vydra)** (`@operator/vydra-provider`) - included in OpenClaw. Adds Vydra model provider support to OpenClaw.

- **[web-readability](/plugins/reference/web-readability)** (`@operator/web-readability-plugin`) - included in OpenClaw. Extract readable article content from local HTML web fetch responses.

- **[webhooks](/plugins/reference/webhooks)** (`@operator/webhooks`) - included in OpenClaw. Authenticated inbound webhooks that bind external automation to OpenClaw TaskFlows.

- **[workboard](/plugins/reference/workboard)** (`@operator/workboard`) - included in OpenClaw. Dashboard workboard for agent-owned issues and sessions.

- **[workspaces](/plugins/reference/workspaces)** (`@operator/workspaces-plugin`) - included in OpenClaw. Agent-composable Workspaces document and control-plane backend.

- **[xai](/plugins/reference/xai)** (`@operator/xai-plugin`) - included in OpenClaw. Adds xAI model provider support to OpenClaw.

- **[xiaomi](/plugins/reference/xiaomi)** (`@operator/xiaomi-provider`) - included in OpenClaw. Adds Xiaomi, Xiaomi Token Plan model provider support to OpenClaw.

## Official external packages

71 plugins

- **[acpx](/plugins/reference/acpx)** (`@operator/acpx`) - npm; ClawHub. OpenClaw ACP runtime backend with plugin-owned session and transport management.

- **[amazon-bedrock](/plugins/reference/amazon-bedrock)** (`@operator/amazon-bedrock-provider`) - npm; ClawHub. OpenClaw Amazon Bedrock provider plugin with model discovery, embeddings, and guardrail support.

- **[amazon-bedrock-mantle](/plugins/reference/amazon-bedrock-mantle)** (`@operator/amazon-bedrock-mantle-provider`) - npm; ClawHub. OpenClaw Amazon Bedrock Mantle provider plugin for OpenAI-compatible model routing.

- **[anthropic-vertex](/plugins/reference/anthropic-vertex)** (`@operator/anthropic-vertex-provider`) - npm; ClawHub. OpenClaw Anthropic Vertex provider plugin for Claude models on Google Vertex AI.

- **[arcee](/plugins/reference/arcee)** (`@operator/arcee-provider`) - npm; ClawHub: `clawhub:@operator/arcee-provider`. Adds Arcee model provider support to OpenClaw.

- **[brave](/plugins/reference/brave)** (`@operator/brave-plugin`) - npm; ClawHub. OpenClaw Brave Search provider plugin for web search.

- **[cerebras](/plugins/reference/cerebras)** (`@operator/cerebras-provider`) - npm; ClawHub: `clawhub:@operator/cerebras-provider`. Adds Cerebras model provider support to OpenClaw.

- **[chutes](/plugins/reference/chutes)** (`@operator/chutes-provider`) - npm; ClawHub: `clawhub:@operator/chutes-provider`. Adds Chutes model provider support to OpenClaw.

- **[clickclack](/plugins/reference/clickclack)** (`@operator/clickclack`) - npm; ClawHub: `clawhub:@operator/clickclack`. Adds the Clickclack channel surface for sending and receiving OpenClaw messages.

- **[cloudflare-ai-gateway](/plugins/reference/cloudflare-ai-gateway)** (`@operator/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@operator/cloudflare-ai-gateway-provider`. Adds Cloudflare AI Gateway model provider support to OpenClaw.

- **[codex](/plugins/reference/codex)** (`@operator/codex`) - npm; ClawHub. Codex app-server harness, model provider, and native session catalog.

- **[copilot](/plugins/reference/copilot)** (`@operator/copilot`) - npm; ClawHub: `clawhub:@operator/copilot`. Registers the GitHub Copilot agent runtime.

- **[deepinfra](/plugins/reference/deepinfra)** (`@operator/deepinfra-provider`) - npm; ClawHub: `clawhub:@operator/deepinfra-provider`. Adds DeepInfra model provider support to OpenClaw.

- **[deepseek](/plugins/reference/deepseek)** (`@operator/deepseek-provider`) - npm; ClawHub: `clawhub:@operator/deepseek-provider`. Adds DeepSeek model provider support to OpenClaw.

- **[diagnostics-otel](/plugins/reference/diagnostics-otel)** (`@operator/diagnostics-otel`) - npm; ClawHub: `clawhub:@operator/diagnostics-otel`. OpenClaw diagnostics OpenTelemetry exporter for metrics, traces, and logs.

- **[diagnostics-prometheus](/plugins/reference/diagnostics-prometheus)** (`@operator/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@operator/diagnostics-prometheus`. OpenClaw diagnostics Prometheus exporter for runtime metrics.

- **[diffs](/plugins/reference/diffs)** (`@operator/diffs`) - npm; ClawHub. OpenClaw read-only diff viewer plugin and file renderer for agents.

- **[diffs-language-pack](/plugins/reference/diffs-language-pack)** (`@operator/diffs-language-pack`) - npm; ClawHub: `clawhub:@operator/diffs-language-pack`. Adds syntax highlighting for languages outside the default diffs viewer set.

- **[discord](/plugins/reference/discord)** (`@operator/discord`) - npm; ClawHub. OpenClaw Discord channel plugin for channels, DMs, commands, and app events.

- **[exa](/plugins/reference/exa)** (`@operator/exa-plugin`) - npm; ClawHub: `clawhub:@operator/exa-plugin`. Adds web search provider support.

- **[featherless](/plugins/reference/featherless)** (`@operator/featherless-provider`) - npm; ClawHub: `clawhub:@operator/featherless-provider`. OpenClaw Featherless AI provider plugin.

- **[feishu](/plugins/reference/feishu)** (`@operator/feishu`) - npm; ClawHub. OpenClaw Feishu/Lark channel plugin for chats and workplace tools (community maintained by @m1heng).

- **[firecrawl](/plugins/reference/firecrawl)** (`@operator/firecrawl-plugin`) - npm; ClawHub: `clawhub:@operator/firecrawl-plugin`. Adds agent-callable tools. Adds web fetch provider support. Adds web search provider support.

- **[fireworks](/plugins/reference/fireworks)** (`@operator/fireworks-provider`) - npm; ClawHub: `clawhub:@operator/fireworks-provider`. Adds Fireworks model provider support to OpenClaw.

- **[gmi](/plugins/reference/gmi)** (`@operator/gmi-provider`) - npm; ClawHub: `clawhub:@operator/gmi-provider`. OpenClaw GMI Cloud provider plugin.

- **[google-meet](/plugins/reference/google-meet)** (`@operator/google-meet`) - npm; ClawHub. OpenClaw Google Meet participant plugin for joining calls through Chrome or Twilio transports.

- **[googlechat](/plugins/reference/googlechat)** (`@operator/googlechat`) - npm; ClawHub. OpenClaw Google Chat channel plugin for spaces and direct messages.

- **[gradium](/plugins/reference/gradium)** (`@operator/gradium-speech`) - npm; ClawHub: `clawhub:@operator/gradium-speech`. Adds text-to-speech provider support.

- **[groq](/plugins/reference/groq)** (`@operator/groq-provider`) - npm; ClawHub: `clawhub:@operator/groq-provider`. Adds Groq model provider support to OpenClaw.

- **[inworld](/plugins/reference/inworld)** (`@operator/inworld-speech`) - npm; ClawHub: `clawhub:@operator/inworld-speech`. Inworld streaming text-to-speech (MP3, OGG_OPUS, PCM telephony).

- **[irc](/plugins/reference/irc)** (`@operator/irc`) - npm; ClawHub: `clawhub:@operator/irc`. Adds the IRC channel surface for sending and receiving OpenClaw messages.

- **[kilocode](/plugins/reference/kilocode)** (`@operator/kilocode-provider`) - npm; ClawHub: `clawhub:@operator/kilocode-provider`. Adds Kilocode model provider support to OpenClaw.

- **[kimi](/plugins/reference/kimi)** (`@operator/kimi-provider`) - npm; ClawHub: `clawhub:@operator/kimi-provider`. Adds Kimi, Kimi Coding model provider support to OpenClaw.

- **[line](/plugins/reference/line)** (`@operator/line`) - npm; ClawHub. OpenClaw LINE channel plugin for LINE Bot API chats.

- **[llama-cpp](/plugins/reference/llama-cpp)** (`@operator/llama-cpp-provider`) - npm; ClawHub. Local GGUF embeddings through node-llama-cpp.

- **[lobster](/plugins/reference/lobster)** (`@operator/lobster`) - npm; ClawHub. Lobster workflow tool plugin for typed pipelines and resumable approvals.

- **[longcat](/plugins/reference/longcat)** (`@operator/longcat-provider`) - npm; ClawHub: `clawhub:@operator/longcat-provider`. OpenClaw LongCat provider plugin.

- **[matrix](/plugins/reference/matrix)** (`@operator/matrix`) - ClawHub: `clawhub:@operator/matrix`; npm. OpenClaw Matrix channel plugin for rooms and direct messages.

- **[mattermost](/plugins/reference/mattermost)** (`@operator/mattermost`) - npm; ClawHub: `clawhub:@operator/mattermost`. Adds the Mattermost channel surface for sending and receiving OpenClaw messages.

- **[memory-lancedb](/plugins/reference/memory-lancedb)** (`@operator/memory-lancedb`) - npm; ClawHub. OpenClaw LanceDB-backed long-term memory plugin with auto-recall, auto-capture, and vector search.

- **[moonshot](/plugins/reference/moonshot)** (`@operator/moonshot-provider`) - npm; ClawHub: `clawhub:@operator/moonshot-provider`. Adds Moonshot model provider support to OpenClaw.

- **[msteams](/plugins/reference/msteams)** (`@operator/msteams`) - npm; ClawHub. OpenClaw Microsoft Teams channel plugin for bot conversations.

- **[mxc](/plugins/reference/mxc)** (`@operator/mxc-sandbox`) - npm; ClawHub. OS-level sandboxed tool execution via MXC for MXC-capable Windows hosts: runs commands in ProcessContainer (Windows) with configured MXC policy files.

- **[nextcloud-talk](/plugins/reference/nextcloud-talk)** (`@operator/nextcloud-talk`) - npm; ClawHub. OpenClaw Nextcloud Talk channel plugin for conversations.

- **[nostr](/plugins/reference/nostr)** (`@operator/nostr`) - npm; ClawHub. OpenClaw Nostr channel plugin for NIP-04 encrypted direct messages.

- **[openshell](/plugins/reference/openshell)** (`@operator/openshell-sandbox`) - npm; ClawHub. OpenClaw sandbox backend for the NVIDIA OpenShell CLI with mirrored local workspaces and SSH command execution.

- **[parallel](/tools/parallel-search)** (`@operator/parallel-plugin`) - npm; ClawHub: `clawhub:@operator/parallel-plugin`. Adds web search provider support.

- **[perplexity](/plugins/reference/perplexity)** (`@operator/perplexity-plugin`) - npm; ClawHub: `clawhub:@operator/perplexity-plugin`. Adds web search provider support.

- **[pixverse](/plugins/reference/pixverse)** (`@operator/pixverse-provider`) - npm; ClawHub: `clawhub:@operator/pixverse-provider`. OpenClaw PixVerse video generation provider plugin.

- **[qianfan](/plugins/reference/qianfan)** (`@operator/qianfan-provider`) - npm; ClawHub: `clawhub:@operator/qianfan-provider`. Adds Qianfan model provider support to OpenClaw.

- **[qqbot](/plugins/reference/qqbot)** (`@operator/qqbot`) - npm; ClawHub. OpenClaw QQ Bot channel plugin for group and direct-message workflows.

- **[qwen](/plugins/reference/qwen)** (`@operator/qwen-provider`) - npm; ClawHub: `clawhub:@operator/qwen-provider`. Adds Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI, Qwen Token Plan, Bailian Token Plan model provider support to OpenClaw.

- **[raft](/plugins/reference/raft)** (`@operator/raft`) - npm; ClawHub. OpenClaw Raft channel plugin for secure CLI wake bridges.

- **[searxng](/plugins/reference/searxng)** (`@operator/searxng-plugin`) - npm; ClawHub: `clawhub:@operator/searxng-plugin`. Adds web search provider support.

- **[signal](/plugins/reference/signal)** (`@operator/signal`) - npm; ClawHub: `clawhub:@operator/signal`. Adds the Signal channel surface for sending and receiving OpenClaw messages.

- **[slack](/plugins/reference/slack)** (`@operator/slack`) - npm; ClawHub. OpenClaw Slack channel plugin for channels, DMs, commands, and app events.

- **[sms](/plugins/reference/sms)** (`@operator/sms`) - npm; ClawHub: `clawhub:@operator/sms`. Twilio SMS channel plugin for OpenClaw text messages.

- **[stepfun](/plugins/reference/stepfun)** (`@operator/stepfun-provider`) - npm; ClawHub: `clawhub:@operator/stepfun-provider`. Adds StepFun, StepFun Plan model provider support to OpenClaw.

- **[synology-chat](/plugins/reference/synology-chat)** (`@operator/synology-chat`) - npm; ClawHub. Synology Chat channel plugin for OpenClaw channels and direct messages.

- **[tavily](/plugins/reference/tavily)** (`@operator/tavily-plugin`) - npm; ClawHub: `clawhub:@operator/tavily-plugin`. Adds agent-callable tools. Adds web search provider support.

- **[tencent](/plugins/reference/tencent)** (`@operator/tencent-provider`) - npm; ClawHub: `clawhub:@operator/tencent-provider`. Adds Tencent TokenHub, Tencent Tokenplan model provider support to OpenClaw.

- **[tlon](/plugins/reference/tlon)** (`@operator/tlon`) - npm; ClawHub. OpenClaw Tlon/Urbit channel plugin for chat workflows.

- **[tokenjuice](/plugins/reference/tokenjuice)** (`@operator/tokenjuice`) - npm; ClawHub: `clawhub:@operator/tokenjuice`. Compacts exec and bash tool results with tokenjuice reducers.

- **[twitch](/plugins/reference/twitch)** (`@operator/twitch`) - npm; ClawHub. OpenClaw Twitch channel plugin for chat and moderation workflows.

- **[venice](/plugins/reference/venice)** (`@operator/venice-provider`) - npm; ClawHub: `clawhub:@operator/venice-provider`. Adds Venice model provider support to OpenClaw.

- **[vercel-ai-gateway](/plugins/reference/vercel-ai-gateway)** (`@operator/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@operator/vercel-ai-gateway-provider`. Adds Vercel AI Gateway model provider support to OpenClaw.

- **[voice-call](/plugins/reference/voice-call)** (`@operator/voice-call`) - npm; ClawHub. OpenClaw voice-call plugin for Twilio, Telnyx, and Plivo phone calls.

- **[whatsapp](/plugins/reference/whatsapp)** (`@operator/whatsapp`) - ClawHub: `clawhub:@operator/whatsapp`; npm. OpenClaw WhatsApp channel plugin for WhatsApp Web chats.

- **[zai](/plugins/reference/zai)** (`@operator/zai-provider`) - npm; ClawHub: `clawhub:@operator/zai-provider`. Adds Z.AI model provider support to OpenClaw.

- **[zalo](/plugins/reference/zalo)** (`@operator/zalo`) - npm; ClawHub. OpenClaw Zalo channel plugin for bot and webhook chats.

- **[zalouser](/plugins/reference/zalouser)** (`@operator/zalouser`) - npm; ClawHub. OpenClaw Zalo Personal Account plugin via native zca-js integration.

## Source checkout only

2 plugins

- **[qa-channel](/plugins/reference/qa-channel)** (`@operator/qa-channel`) - source checkout only. Adds the QA Channel surface for sending and receiving OpenClaw messages.

- **[qa-lab](/plugins/reference/qa-lab)** (`@operator/qa-lab`) - source checkout only. OpenClaw QA lab plugin with private debugger UI and scenario runner.
