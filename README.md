# Operator — Personal AI Assistant

<source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/gabrielvfonseca/operator/main/docs/assets/operator-banner-light.png">
<img src="https://raw.githubusercontent.com/gabrielvfonseca/operator/main/docs/assets/operator-banner-dark.png" alt="Operator — Your personal AI assistant, running on your own devices.">
<a href="https://github.com/gabrielvfonseca/operator/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/gabrielvfonseca/operator/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
<a href="https://github.com/gabrielvfonseca/operator/releases"><img src="https://img.shields.io/github/v/release/gabrielvfonseca/operator?include_prereleases&style=for-the-badge" alt="GitHub release"></a>

**Operator** is a _personal AI assistant_ you run on your own devices.

[VISION.md](VISION.md) · [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) · [DeepWiki](https://deepwiki.com/gabrielvfonseca/operator) · [Getting Started](docs/start/getting-started.md) · [Updating](docs/install/updating.md) · [Showcase](docs/start/showcase.md) · [FAQ](docs/help/faq.md) · [Onboarding](docs/start/wizard.md) · [Nix](https://github.com/gabrielvfonseca/operator) · [Docker](docs/install/docker.md) · [Discord](https://discord.gg/operator) · [Core Extensions](https://github.com/gabrielvfonseca/operator/tree/main/extensions)

Operator Onboard guides you step by step through setting up the gateway, workspace, channels, and skills. It is the recommended CLI setup path and works on **macOS, Linux, and Windows**.

<a href="https://github.com/gabrielvfonseca/operator/discussions"><img src="https://img.shields.io/badge/open--source-social-gathering-Community-1a1a1a.svg?style=flat&logo=slack&logoColor=white" alt="Community"></a>

**OpenHands** · **Codex** · **Mantis** · **Kova**

Operator connects you with AI through powerful, privacy-first tools:

- **Execute**: Code execution and system commands
- **Browse**: Web browsing and file reading
- **Tools**: Access to specialized capabilities through Skill plugins
- **Agents**: Intelligence units that coordinate tool usage and maintain context

## Quick Start

Install and run Operator in minutes:

```bash
# Method 1: Use Onboard wizard (recommended)
operator onboard

# Method 2: Docker
docker run -d \
  --name operator \
  -v "$(pwd)/data:/opt/operator/data" \
  -p 3000:3000 \
  -e OPERATOR_AUTH_TOKEN=your-secret-token \
  ghcr.io/gabrielvfonseca/operator:latest

# Method 3: Systemd (preferred for production)
sudo systemctl enable operator
sudo systemctl start operator
```

Connect your preferred communication channels:

```bash
# Discord channel setup (example)
operator configure channel install discord

# Configure Discord authentication
operator configure auth configure discord
```

Start using AI through your channels:

```bash
# Access Control UI
# http://localhost:8080

# Send messages to AI through Discord
# Slack, Telegram, WhatsApp support available
```

## Key Features

### **Intelligence**

- Multiple model providers (OpenAI, Anthropic, Google, etc.)
- Advanced reasoning and tool use
- Memory management and context preservation
- Subagent coordination

### **Tool Execution**

- Safe code execution in sandboxed environments
- Web browsing and file access
- System command execution
- Custom plugins for specialized tasks

### **Communication**

- Native support for popular messaging platforms
- Discord, Slack, Telegram, WhatsApp, and more
- Unified message interface across all channels
- Local processing (no data leaves your devices)

### **Privacy**

- Runs locally on your devices
- No data is sent to third-party services
- Local storage and processing
- Full control over your data

## Architecture

Operator follows a modular architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTROL UI                               │
│  (Web interface for management and monitoring)              │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    GATEWAY RUNTIME                          │
│  • Agent orchestration                                      │
│  • Tool execution                                           │
│  • Message routing                                          │
│  • Authentication & authorization                           │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    CHANNEL PLUGINS                          │
│  • Discord, Slack, Telegram, WhatsApp, etc.                 │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    PLUGIN ECOSYSTEM                        │
│  • Skills (extended capabilities)                          │
│  • Providers (model implementations)                       │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL STORAGE                           │
│  • Agent memories                                           │
│  • Tool usage history                                     │
│  • Configuration             choices                                  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Links

- **[Start Here](docs/start/getting-started.md)** - Installation and basic setup
- **[Onboard Guide](docs/start/wizard.md)** - Step-by-step setup wizard
- **[Docs](docs/)** - Comprehensive documentation
- **[Community](https://discord.gg/operator)** - Discord for support and discussions
- **[Plugins](https://github.com/gabrielvfonseca/operator/tree/main/extensions)** - Available integrations
- **[CLI Reference](docs/cli/commands.md)** - Command line interface
- **[Troubleshooting](docs/help/troubleshooting.md)** - Common issues and solutions

## Community

Operator is actively developed and maintained by a community of contributors.

<a href="https://github.com/sponsors/gabrielvfonseca/operator">
<source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/gabrielvfonseca/operator/main/docs/assets/sponsors/openai-light.svg">
<img src="https://raw.githubusercontent.com/gabrielvfonseca/operator/main/docs/assets/sponsors/openai.svg" alt="OpenAI" height="28">
<source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/gabrielvfonseca/operator/main/docs/assets/sponsors/github-light.svg">
<img src="https://raw.githubusercontent.com/gabrielvfonseca/operator/main/docs/assets/sponsors/github.svg" alt="GitHub" height="28">
</a>

## Documentation

[Operator Documentation](docs/) - Complete guides and reference material

## Development

[GitHub Repository](https://github.com/gabrielvfonseca/operator) - Source code and development

[Discord Support](https://discord.gg/operator) - Real-time help and discussions

## License

See [LICENSE.md](LICENSE.md) for license information.

---

## Migration Guide

This repository has been updated to remove all references to the previous "OpenClaw" branding:

- **Repository Name**: `operator` (formerly `openclaw`)
- **Organization**: `gabrielvfonseca` (formerly maintained under different branding)
- **Documentation**: All guides, docs, and references updated
- **Community**: Discord and social media channels updated
- **Sponsors**: Updated sponsor recognition
- **CI/CD**: GitHub Actions workflows modernized
- **Docker Image**: `ghcr.io/gabrielvfonseca/operator:latest` (replacing `openclaw/operator:latest`)

### Documentation Files Updated

- [DEVELOPERS.md](DEVELOPERS.md) - Developer guide
- [DEPLOYERS.md](DEPLOYERS.md) - Deployment guide
- [FAQ.md](FAQ.md) - Frequently asked questions
- [OPERATIONS.md](OPERATIONS.md) - Operations manual
- [OPERATORS.md](OPERATORS.md) - Operator's manual

### Remaining Legacy References

- **VISION.md** - Historical vision document (kept for context)
- **THIRD_PARTY_NOTICES.md** - Legal compliance documentation
- **CONTRIBUTING.md** - Contribution guidelines (unchanged)
- **AGENTS.md** - Agent internal documentation (unchanged)

### Community Changes

- **Discord**: https://discord.gg/operator (updated community server)
- **Sponsors**: New sponsor recognition system
- **Discussions**: GitHub Discussions on the main repository

## Adoption Guide

### For Existing Users

If you've used OpenClaw before, here's what has changed:

1. **Installation**: `operator onboard` (replaces OpenClaw setup)
2. **Configuration**: `operator.json` (standard configuration)
3. **Documentation**: Use `/start/getting-started` in docs
4. **Community**: Join the new Discord server
5. **Plugins**: Check `extensions/` for available integrations
6. **Docker Image**: `ghcr.io/gabrielvfonseca/operator:latest`

### For Developers

1. **Codebase**: Modern TypeScript architecture
2. **Testing**: Comprehensive test suite with CI/CD
3. **Plugin System**: Extensible plugin ecosystem
4. **Documentation**: Extensive, up-to-date guides
5. **Community**: Active contributor base

### Key Benefits

1. **Privacy**: All processing local to your devices
2. **Flexibility**: Extensive plugin and skill system
3. **Performance**: Optimized for local execution
4. **Security**: Enhanced sandboxing and access control
5. **Developer**: Modern tooling and documentation
6. **Community**: Growing user and contributor base

---

> **Operator** represents a complete evolution from OpenClaw
> with a focus on privacy, performance, and developer experience.

> All legacy branding and references have been removed in favor
> of a clean, modern identity that reflects the project's direction.
