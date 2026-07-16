# Operations Manual

This document provides comprehensive guidance for operating and maintaining Operator instances in production environments.

## Quick Links

- **GitHub:** https://github.com/gabrielvfonseca/operator
- **Website:** https://operator.ai
- **Discord:** https://discord.gg/clawd
- **X/Twitter:** [@openclaw](https://x.com/openclaw)

## Operations Overview

The Operations Manual provides detailed procedures for managing Operator instances, including:

- **Daily Operations** - Routine maintenance and monitoring
- **Troubleshooting** - Common issues and their solutions
- **Capacity Planning** - Resource management and scaling guidance
- **Compliance** - Security and compliance requirements
- **Performance Optimization** - Tuning and optimization strategies

## Daily Operations

### System Health Monitoring

Check system health regularly:

```bash
# Check gateway status
operator gateway status

# Check system resources
uptime
free -h

# Check logs
journalctl -u operator -f
```

### Backup Procedures

Perform regular backups:

```bash
# Create backup
shared-db backup
operator gateway backup

# Verify backup
operator backup list
operator gateway backup validate
```

### Security Audit

Run security audits:

```bash
# Comprehensive security audit
operator security audit --deep

# Vulnerability scanning
pnpm check:opengrep-rule-metadata

# Secret scanning
pre-commit run --all-files detect-private-key
```

## Troubleshooting

### Common Issues

#### Gateway Won't Start

**Symptoms:** Gateway fails to start with bind address errors

**Troubleshooting Steps:**

```bash
# Check if port is already in use
netstat -tlnp | grep :3000

# Try different port
operator gateway run --port 3001

# Check configuration
operator config validate
```

#### High Memory Usage

**Symptoms:** System memory usage exceeds 80%

**Solutions:**

```bash
# Clear memory caches
sudo sync; echo 3 > /proc/sys/vm/drop_caches

# Check for memory leaks
valgrind --tool=massif ./operator.gateway
```

#### Database Performance Issues

**Symptoms:** Slow database operations

**Solutions:**

```bash
# Optimize SQLite
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
```

### Advanced Troubleshooting

#### Database Connectivity

```bash
# Test database connection
psql://user:pass@localhost:5432/operator

# Check connection pools
operator status --detailed
```

#### Plugin Issues

```bash
# List installed plugins
operator plugin list

# Check plugin health
operator plugin status <plugin-id>

# Disable problematic plugin
operator plugin disable <plugin-id>
```

## Capacity Planning

### Resource Monitoring

Monitor key resources:

```bash
# System metrics
htop
iotop
iostat

# Database metrics
./scripts/scripts/check-db-metrics.mjs

# Application metrics
curl http://localhost:3000/metrics
```

### Scaling Guidelines

#### Horizontal Scaling

Deploy multiple instances:

```bash
# Create instance configs
cat > instance-1.json << EOF
{
    "gateway": {
        "bind": "0.0.0.0",
        "port": 3000,
        "auth": { "mode": "token", "token": "instance1" }
    },
    "agent": {
        "id": "instance-1",
        "name": "Instance 1"
    }
}
EOF
```

#### Vertical Scaling

Increase resources on single instance:

```yaml
# docker-compose.yml
version: "3.8"
services:
  operator:
    image: openclaw/operator:latest
    deploy:
      resources:
        limits:
          cpus: "4"
          memory: 8G
```

## Performance Optimization

### Optimization Strategies

#### Database Optimization

```sql
-- Enable WAL mode
PRAGMA journal_mode=WAL;

-- Adjust cache size
PRAGMA cache_size = 20000;

-- Optimize for read-heavy workloads
PRAGMA mmap_size = 268435456;
```

#### Application Optimization

```bash
# Enable caching
export NODE_OPTIONS=--max-old-space-size=8192

# Optimize for production
echo "NODE_ENV=production" >> /etc/environment
```

#### Plugin Optimization

```bash
# Profile plugin performance
node --prof plugins/plugin-name

# Analyze performance
node --prof-process isolate-*.log > processed.log
```

## Compliance

### Security Requirements

Maintain compliance with security standards:

#### Access Control

```bash
# Configure user limits
# /etc/security/limits.conf

operator soft nproc 2048
operator hard nproc 4096
operator soft nofile 4096
operator hard nofile 8192
```

#### Audit Logging

```yaml
# Enable comprehensive audit logging
audit:
  enabled: true
  format: json
  path: /var/log/operator/audit
  retention: 30d
```

### Compliance Monitoring

```bash
# Regular compliance checks
operator compliance check --weekly

# Generate compliance reports
operator compliance report --format json --output /reports/compliance-$(date +%Y%m%d)
```

## Configuration Management

### Configuration Validation

Validate configurations:

```bash
# Validate operator.json
operator config validate operator.json

# Validate configuration schema
operator schema validate --schema docs/schemas/operator-config.json
```

### Configuration Templates

Use templates for consistent deployments:

```bash
# Create configuration template
cat > operator-config-template.json << EOF
{
    "gateway": {
        "bind": "0.0.0.0",
        "port": 3000,
        "auth": { "mode": "trusted-proxy" },
        "ssl": {
            "enabled": true,
            "cert": "/path/to/cert.pem",
            "key": "/path/to/key.pem"
        }
    },
    "agent": {
        "id": "production-instance",
        "name": "Production Instance"
    }
}
EOF
```

## Monitoring and Alerting

### Monitoring Setup

Configure monitoring:

```bash
# Install monitoring tools
sudo apt install prometheus node-exporter grafana
```

### Alert Configuration

```yaml
# alertmanager.yml
group_by: ["alertname"]
groups:
  - name: "operator"
    rules:
      - alert: HighMemoryUsage
        expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 80%"
```

## Backup and Recovery

### Backup Strategy

Implement backup strategy:

```bash
# Create daily backups
cat > /etc/cron.daily/operator-backup << 'EOF'
shared-db backup
operator backup create --name daily-$(date +%Y%m%d)
find /backups -name "*.tar.gz" -mtime +30 -delete
EOF

# Create weekly backups
cat > /etc/cron.weekly/operator-backup << 'EOF'
shared-db backup --full
operator gateway backup --full
operator backup create --name weekly-$(date +%Y%U)
EOF
```

### Recovery Procedures

```bash
# Emergency recovery
shared-db restore backup-20230101-full
systemctl start operator
operator gateway run --config operator.json
```

## Incident Response

### Incident Management

Implement incident response procedures:

#### Severity Levels

| Severity | Response Time | Description                   |
| -------- | ------------- | ----------------------------- |
| Critical | 15 minutes    | Complete service disruption   |
| High     | 1 hour        | Major functionality impaired  |
| Medium   | 4 hours       | Partial functionality loss    |
| Low      | 24 hours      | Minor performance degradation |

#### Incident Severity Matrix

```yaml
severity_matrix:
  response_times:
    critical: "15m"
    high: "1h"
    medium: "4h"
    low: "24h"

  contacts:
    - oncall-engineer
    - devops-team
    - business-hours-contact
```

#### Post-Incident Review

```bash
# Conduct post-incident review
operator incident review --id <incident-id> --format json --output review-$(date +%Y%m%d)

# Update runbooks
vim docs/incident-response/runbooks/<incident-type>.md
```

## Related Resources

- **Deployers Guide** - `DEPLOYERS.md`
- **Security Guide** - `SECURITY.md`
- **Troubleshooting** - `docs/troubleshooting/`
- **Performance Tuning** - `docs/performance/`
- **Compliance** - `docs/compliance/`

## Appendix

### Reference Commands

```bash
# Daily operations
operator gateway status
operator instances list
operator config validate
operator security audit --deep
operator backup create --name daily

# Maintenance
operator gateway stop
operator gateway start
operator config apply
operator plugin status <plugin-id>

# Monitoring
curl http://localhost:3000/metrics
curl http://localhost:3000/health
journalctl -u operator -f
```

### Glossary

- **Gateway** - Core Operator runtime component
- **Instance** - Individual Operator deployment
- **Plugin** - Extension that adds functionality
- **Agent** - AI runtime that executes tools
- **Tool** - Executable functions that agents can call
- **Auth Provider** - Authentication mechanism (token/password/trusted-proxy)

## Appendix

### Troubleshooting Commands

```bash
# System diagnostics
system_profiler SPHardwareDataType
vm_stat
iostat -x 1 10

# Process management
ps aux | grep operator
df -h
lsblk

# Service management
systemctl status operator
journalctl -f -u operator
```

### Emergency Procedures

```bash
# Emergency rollback script
cat > emergency-rollback.sh << 'EOF'
#!/bin/bash
set -e

# Take emergency snapshot
operator backup create --name emergency-$(date +%s)

# Identify problematic version
BROKEN_VERSION=$(git rev-parse HEAD)

# Restore previous version
git checkout previous-stable-version

# Reapply configuration
git checkout HEAD -- operator.json

# Restart service
systemctl restart operator

# Verify health
./health-check.sh

# If success, commit rollback
cd /opt/operator
git add .
git commit -m "Emergency rollback to previous stable version"
EOF

chmod +x emergency-rollback.sh
```
