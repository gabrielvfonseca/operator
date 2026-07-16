# Operators Manual

This document provides comprehensive guidance for operators responsible for deploying, managing, and maintaining Operator instances in production environments.

## Quick Links

- **GitHub:** https://github.com/gabrielvfonseca/operator
- **Website:** https://operator.ai
- **Discord:** https://discord.gg/clawd
- **X/Twitter:** [@openclaw](https://x.com/openclaw)

## Operator Overview

Operator is a personal AI assistant that runs on your own devices, providing localized AI assistance without data leaving your premises.

### Key Features

- **Privacy-First**: All data stays on your devices
- **Multi-Platform**: Works with Discord, Telegram, Slack, WhatsApp, and more
- **Powerful Capabilities**: Advanced reasoning, tool execution, agent delegation
- **Easy Setup**: Step-by-step onboarding wizard
- **Extensive Customization**: Flexible configuration and plugin system

## Installation Methods

### Docker Installation

```bash
# Pull and run
docker run -d \
  --name operator \
  -v "$(pwd)/data:/opt/operator/data" \
  -p 3000:3000 \
  -e OPERATOR_AUTH_TOKEN=your-secret-token \
  openclaw/operator:latest

# For production with SSL
cat > docker-compose.yml << EOF
version: '3.8'
services:
  operator:
    image: openclaw/operator:latest
    ports:
      - \"3000:3000\"
      - \"8080:8080\"
    volumes:
      - ./data:/opt/operator/data
    environment:
      - OPERATOR_AUTH_MODE=token
      - OPERATOR_AUTH_TOKEN=${OPERATOR_AUTH_TOKEN}
    restart: unless-stopped
EOF

docker-compose up -d
```

### Systemd Service

```ini
# /etc/systemd/system/operator.service
[Unit]
Description=Operator Gateway
After=network.target

[Service]
Type=simple
User=operator
WorkingDirectory=/opt/operator
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node /opt/operator/operator.mjs
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable operator
sudo systemctl start operator
```

### Manual Installation

```bash
# Clone repository
git clone https://github.com/gabrielvfonseca/operator.git
cd operator

# Install dependencies
pnpm install

# Build
pnpm build

# Create user
sudo useradd --system --shell /bin/bash --home-dir /opt/operator operator
sudo chown -R operator:operator /opt/operator

# Run as operator user
sudo -u operator node operator.mjs
```

## Configuration Management

### Configuration File Structure

Operator uses a hierarchical configuration system with `operator.json` as the main configuration file:

```json
{
  "gateway": {
    "bind": "0.0.0.0",
    "port": 3000,
    "auth": {
      "mode": "token",
      "token": "${SECRETFILE:/run/secrets/operator-auth}"
    },
    "ssl": {
      "enabled": true,
      "cert": "/path/to/cert.pem",
      "key": "/path/to/key.pem"
    },
    "controlUi": {
      "enabled": true,
      "port": 8080
    }
  },
  "agent": {
    "id": "production-instance",
    "name": "Production Operator",
    "model": {
      "provider": "openai",
      "model": "gpt-4o"
    }
  },
  "channels": {
    "discord": {
      "defaultAccount": "discord-account-id"
    }
  }
}
```

### Configuration Files Location

- **System-wide**: `/etc/operator/operator.json`
- **User directory**: `~/.operator/operator.json`
- **Instance-specific**: `./operator.json` (current directory)

### Configuration Templates

```bash
# Generate from template
operator config generate --template production > operator.json

# Validate configuration
operator config validate operator.json
```

## Service Management

### Systemd Commands

```bash
# View status
sudo systemctl status operator

# Check logs
sudo journalctl -u operator -f

# Restart
sudo systemctl restart operator

# Stop
sudo systemctl stop operator

# Enable at boot
sudo systemctl enable operator
```

### Docker Commands

```bash
# View logs
docker logs operator

# Restart
docker restart operator

# Stop
docker stop operator

# Start
docker start operator

# View status
docker ps | grep operator
```

### Process Management

```bash
# Check running processes
ps aux | grep operator

# Check port usage
netstat -tlnp | grep :3000

# Kill process
sudo kill -TERM <operator-PID>

# Force kill
sudo kill -KILL <operator-PID>
```

## Monitoring and Logging

### Log Locations

- **System logs**: `/var/log/operator/`
- **Application logs**: `~/.operator/logs/`
- **Audit logs**: `/var/log/operator/audit/`

### Monitoring Commands

```bash
# Check system resources
uptime
free -h

# Check process
ps aux | grep operator

# Check network
netstat -tlnp | grep :3000

# Check logs
journalctl -u operator -f --lines=50
```

### Monitoring Configuration

```yaml
# monitoring.yml
metrics:
  enabled: true
  port: 9090
  path: /metrics

logging:
  level: info
  format: json
  max_size: 100m
  rotation: daily

alerts:
  enabled: true
  webhook: https://hooks.example.com/operator
```

## Backup and Recovery

### Backup Procedures

```bash
# Create backup
shared-db backup
operator backup create --name "backup-$(date +%Y%m%d_%H%M%S)"

# Verify backup
operator backup list
operator backup validate <backup-name>
```

### Backup Strategy

1. **Daily backups**: Local backups
2. **Weekly backups**: Full backups
3. **Monthly backups**: Historical backups for compliance

### Recovery Procedures

```bash
# Emergency recovery
systemctl stop operator
shared-db restore backup-20230101-120000
operator gateway run --config operator.json
```

### Backup Configuration

```json
{
  "backup": {
    "enabled": true,
    "schedule": "0 2 * * *",
    "retention": {
      "daily": 7,
      "weekly": 4,
      "monthly": 12
    },
    "locations": ["/backup/operator", "s3://operator-backups"],
    "compression": true,
    "encryption": true
  }
}
```

## Security Management

### Security Configuration

```json
{
  "security": {
    "audit": {
      "enabled": true,
      "path": "/var/log/operator/audit",
      "retention": 30
    },
    "validation": {
      "strict": false,
      "maxMemoryUsage": "2GB"
    }
  }
}
```

### Security Commands

```bash
# Run security audit
operator security audit --deep

# Check for vulnerabilities
pnpm check:opengrep-rule-metadata

# Secret scanning
pre-commit run --all-files detect-private-key
```

## Troubleshooting

### Common Issues and Solutions

#### Gateway Won't Start

**Issue**: Gateway fails to bind to port

**Solutions**:

```bash
# Check if port is in use
netstat -tlnp | grep :3000

# Try different port
operator gateway run --port 3001

# Check configuration syntax
operator config validate
```

#### High Memory Usage

**Issue**: System memory usage exceeds 80%

**Solutions**:

```bash
# Clear memory caches
sudo sync; echo 3 > /proc/sys/vm/drop_caches

# Check for memory leaks
valgrind --tool=massif ./operator.gateway
```

#### Database Performance

**Issue**: Slow database operations

**Solutions**:

```sql
-- Optimize SQLite
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
```

### Debugging Commands

```bash
# Check service status
systemctl status operator

# Check service logs
journalctl -u operator -f

# Check process
ps aux | grep operator

# Check network
netstat -tlnp | grep :3000

# Check configuration
operator config validate
```

## Capacity Planning

### Resource Monitoring

```bash
# System monitoring
htop
iotop
iostat -xz 1 10

# Database monitoring
./scripts/check-db-metrics.mjs

# Application monitoring
curl http://localhost:3000/metrics
```

### Scaling Guidelines

#### Horizontal Scaling

```bash
# Scale to multiple instances
cat > instance-1.json << EOF
{
  "gateway": {
    "bind": "0.0.0.0",
    "port": 3000,
    "auth": { "mode": "token", "token": "instance1" }
  },
  "agent": { "id": "instance-1" }
}
EOF
operator gateway run --config instance-1.json
```

#### Vertical Scaling

```yaml
# docker-compose.yml
docker-compose.yml
services:
  operator:
    image: openclaw/operator:latest
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## Incident Response

### Severity Levels

| Severity | Response Time | Description                   |
| -------- | ------------- | ----------------------------- |
| Critical | 15 minutes    | Complete service disruption   |
| High     | 1 hour        | Major functionality impaired  |
| Medium   | 4 hours       | Partial functionality loss    |
| Low      | 24 hours      | Minor performance degradation |

### Incident Management

```bash
# Severity escalation
operator incident escalate --severity <severity> --id <incident-id>

# Assign incident to team
operator incident assign --team <team-name> --id <incident-id>

# Update incident status
operator incident update --status <status> --id <incident-id>
```

### Post-Incident Review

```bash
# Conduct review
operator incident review --id <incident-id> --format json > review-<timestamp>.json

# Update procedures
git checkout HEAD -- docs/incident-response/runbooks/<incident-type>.md

# Update checklist
cat > incident-checklist.md << EOF
- [ ] Issue identified
- [ ] Impact assessed
- [ ] Root cause determined
- [ ] Fix implemented
- [ ] Solution verified
- [ ] Documentation updated
EOF
```

## Compliance

### Audit Logging

```json
{
  "audit": {
    "enabled": true,
    "format": "json",
    "path": "/var/log/operator/audit",
    "retention": 90
  }
}
```

### Compliance Commands

```bash
# Generate compliance report
operator compliance report --format json --output /reports/compliance-$(date +%Y%m%d)

# Check compliance status
operator compliance check --status
```

## Related Resources

- **User Guide** - README.md
- **Developer Guide** - DEVELOPERS.md
- **Configuration Guide** - CONFIGURATION.md
- **Operations Manual** - OPERATIONS.md
- **Security Guide** - SECURITY.md
- **FAQ** - FAQ.md
- **Troubleshooting** - `docs/troubleshooting/`

## Quick Reference Commands

### Daily Operations

```bash
# System health
operator status
shared-db status
operator gateway status

# Backup
operator backup create --name daily

# Security
audit
operator security audit --deep

# Configuration
operator config validate
operator config apply
```

### Emergency Procedures

```bash
# Emergency rollback
cat > emergency-rollback.sh << 'EOF'
#!/bin/bash
set -e

# Stop service
systemctl stop operator

# Take emergency backup
operator backup create --name emergency-$(date +%s)

# Restore previous configuration
# (implement based on your version control)

# Start service
systemctl start operator

# Verify health
./health-check.sh
EOF

chmod +x emergency-rollback.sh
```

### Monitoring Commands

```bash
# System metrics
htop
iostat

# Service metrics
journalctl -u operator -f

# Application metrics
curl http://localhost:3000/metrics
```
