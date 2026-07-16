# Frequently Asked Questions (FAQ)

This document answers common questions about Operator, its configuration, usage, and troubleshooting.

## Quick Links

- **GitHub:** https://github.com/gabrielvfonseca/operator
- **Website:** https://operator.ai
- **Discord:** https://discord.gg/clawd
- **X/Twitter:** [@openclaw](https://x.com/openclaw)

## General Questions

### What is Operator?

Operator is a personal AI assistant that you run on your own devices. It provides AI-powered assistance through various communication channels (Discord, Telegram, etc.) while keeping all data private and secure.

### What sets Operator apart from other AI assistants?

- **Privacy-first**: Runs locally on your devices, no data leaves your premises
- **Extensive platform support**: Works with Discord, Telegram, Slack, WhatsApp, and many others
- **Powerful capabilities**: Advanced reasoning models, tool execution, agent delegation
- **Easy setup**: Onboard guides you through setup step by step

### Is Operator free to use?

Yes! Operator is open-source and free to use. You can self-host it on your own devices at no cost.

## Installation and Setup

### What are the system requirements?

#### Minimum System Requirements

- **Node.js**: 22.22.3+, 24.15+, or 25.9+ (Node 24 recommended)
- **Memory**: 4GB RAM minimum, 8GB+ recommended
- **Disk Space**: 100MB for the core runtime
- **Network**: Internet connection for initial setup (can be offline afterward)

#### Platform Support

- **macOS**: macOS 10.15 or later
- **Linux**: Ubuntu 20.04 or later, other modern distributions
- **Windows**: Windows 10 or later

### What is the recommended setup process?

1. **Run the onboarding wizard**: `operator onboard` - guided step-by-step setup
2. **Choose your installation method**: Docker, systemd, or direct installation
3. **Configure your gateway**: Set up authentication and network settings
4. **Install channels**: Add communication channels you want to use
5. **Configure models**: Select AI models and providers

### How do I keep Operator updated?

```bash
# For Docker deployments
docker pull openclaw/operator:latest

# For systemd services
systemctl restart operator

# For direct installations
pnpm update && pnpm build
```

## Configuration

### How do I configure Operator?

Operator configuration is primarily done through:

1. **The onboarding wizard** - Interactive step-by-step configuration
2. **`operator.json`** - Static configuration file
3. **Environment variables** - Runtime overrides
4. **CLI arguments** - Temporary overrides

### What configuration options are available?

- **Gateway settings**: Authentication, SSL, network binding
- **Agent configuration**: Model selection, tool permissions, cache settings
- **Channel settings**: Authentication, permissions, message handling
- **Plugin configuration**: Optional plugin-specific settings

### How do I use secrets in Operator?

Operator supports two types of secret management:

1. **SecretFile**: Store secrets in files on disk
2. **SecretRef**: Runtime references to secrets

```json
{
  "gateway": {
    "auth": {
      "token": "${SECRETFILE:/run/secrets/operator-auth}"
    }
  }
}
```

### How do I migrate from older Operator versions?

```bash
# Run migration
operator doctor --fix

# Review changes
operator doctor --list
```

## Usage

### How do I use Operator?

Once setup is complete, Operator runs in the background and is accessible through:

1. **Control UI**: Web interface at `http://localhost:8080`
2. **API endpoints**: HTTP API for programmatic access
3. **Channels**: Connect your communication channels

### What can I do with Operator?

- **Chat with AI**: Interact with various models through your channels
- **Execute tools**: Code execution, web browsing, file operations
- **Delegate tasks**: Create subagents for complex workflows
- **Manage memory**: Maintain conversation history and context
- **Automate workflows**: Set up scheduled tasks and workflows

### How do I connect my channels?

Operator supports many channels out of the box:

- **Discord** - For servers and DMs
- **Telegram** - For Telegram bots
- **Slack** - For Slack workspaces
- **WhatsApp** - For WhatsApp Business
- **And many more** - See `docs/channels/` for a complete list

### How do I configure agent capabilities?

Configure agent capabilities through `operator.json`:

```json
{
  "agent": {
    "id": "your-instance",
    "model": {
      "provider": "openai",
      "model": "gpt-4o",
      "params": {
        "max_tokens": 4096,
        "temperature": 0.7
      }
    },
    "tools": {
      "allow": ["execute", "browse", "read"],
      "deny": ["sandbox"]
    }
  }
}
```

## Troubleshooting

### Operator Gateway Won't Start

**Issue**: Gateway fails to start with bind address errors

**Solution**:

```bash
# Check if port is already in use
netstat -tlnp | grep :3000

# Try different port
operator gateway run --port 3001

# Check configuration syntax
operator config validate
```

### High Memory Usage

**Issue**: System memory usage exceeds 80%

**Solutions**:

```bash
# Clear memory caches
sudo sync; echo 3 > /proc/sys/vm/drop_caches

# Check for memory leaks
valgrind --tool=massif ./operator.gateway
```

### Database Performance Issues

**Issue**: Slow database operations

**Solutions**:

```sql
-- Optimize SQLite
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
```

### Plugin Issues

**Issue**: Plugins not loading or misconfigured

**Solutions**:

```bash
# List installed plugins
operator plugin list

# Check plugin health
operator plugin status <plugin-id>

# Disable problematic plugin
operator plugin disable <plugin-id>
```

### Authentication Problems

**Issue**: Authentication fails with token or password errors

**Solutions**:

```bash
# Check secret file permissions
ls -la /run/secrets/operator-auth

# Validate secret references
operator secrets list

# Test authentication
operator gateway run --auth-mode token --auth-token <token>
```

## Advanced Topics

### How do I run multiple instances?

Run multiple instances on different ports:

```bash
# Instance 1
cat > instance-1.json << EOF
{
  "gateway": {
    "bind": "127.0.0.1",
    "port": 3000,
    "auth": { "mode": "token", "token": "instance1" }
  },
  "agent": { "id": "instance-1" }
}
EOF
operator gateway run --config instance-1.json

# Instance 2
cat > instance-2.json << EOF
{
  "gateway": {
    "bind": "127.0.0.1",
    "port": 3001,
    "auth": { "mode": "token", "token": "instance2" }
  },
  "agent": { "id": "instance-2" }
}
EOF
operator gateway run --config instance-2.json
```

### How do I configure high availability?

Deploy multiple instances behind a load balancer:

```bash
# Deploy instances with different ports
# Then configure nginx or similar load balancer
```

### How do I export/import Operator instances?

```bash
# Export instance configuration
operator export --output instance-backup.tar.gz

# Import instance configuration
operator import --input instance-backup.tar.gz
```

## Common Mistakes

### Incorrect Node.js Version

**Problem**: Using unsupported Node.js version

**Solution**: Install Node.js 22.22.3+ or 24.15+:

```bash
# macOS with nvm
nvm install 24.15
nvm use 24.15

# Linux
# Follow platform-specific installation instructions
```

### Insecure File Permissions

**Problem**: Configuration files with weak permissions

**Solution**: Use secure permissions:

```bash
# Set proper permissions
chmod 600 operator.json
chmod 600 secrets/*
```

### Missing Dependencies

**Problem**: Forgetting to install dependencies

**Solution**: Always run:

```bash
pnpm install
pnpm build
```

### Using Untrusted Plugins

**Problem**: Installing plugins from untrusted sources

**Solution**: Only install plugins from trusted sources and verify their code before enabling.

## Getting Help

### Where can I get help with Operator?

1. **Discord**: Join our Discord community at [https://discord.gg/clawd](https://discord.gg/clawd)
2. **GitHub**: File issues at [https://github.com/gabrielvfonseca/operator/issues](https://github.com/gabrielvfonseca/operator/issues)
3. **Documentation**: Browse our comprehensive documentation at [https://docs.operator.ai](https://docs.operator.ai)

### How do I report a security issue?

See the [Security Guide](SECURITY.md) for secure reporting of vulnerabilities.

### How do I contribute to Operator?

See our [Contributing Guide](CONTRIBUTING.md) for information on contributing code, documentation, or other improvements.

## Further Reading

- **Operator Website**: [https://operator.ai](https://operator.ai)
- **Documentation**: [https://docs.operator.ai](https://docs.operator.ai)
- **GitHub Repository**: [https://github.com/gabrielvfonseca/operator](https://github.com/gabrielvfonseca/operator)
- **Community Discord**: [https://discord.gg/clawd](https://discord.gg/clawd)
- **X/Twitter**: [@openclaw](https://x.com/openclaw)

## Related Resources

- **Deployers Guide** - `DEPLOYERS.md`
- **Operations Manual** - `OPERATIONS.md`
- **Security Guide** - `SECURITY.md`
- **Developer Guide** - `DEVELOPERS.md`
- **Configuration Guide** - `CONFIGURATION.md`
