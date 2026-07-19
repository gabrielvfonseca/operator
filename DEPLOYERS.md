# Deployers Guide

This document provides comprehensive guidance for deploying and managing Operator instances.

## Quick Links

- **GitHub:** https://github.com/gabrielvfonseca/operator
- **Website:** https://operator.ai
- **Discord:** https://discord.gg/operator
- **X/Twitter:** [@gabfon_](https://x.com/gabfon_)

## Deployment Overview

This guide covers:

- **Production Deployment** - Setting up Operator in production environments
- **Multi-Instance Management** - Running multiple Operator instances
- **High Availability** - Configuring HA setups
- **Scaling** - Managing scaled deployments
- **Monitoring** - Observability and monitoring strategies
- **Maintenance** - Upgrade and maintenance procedures

## Deployment Methods

### Docker Deployment

For container-based deployments:

```bash
# Build and run with Docker Compose
docker-compose up -d

# Run with custom configuration
docker run -v $(pwd)/data:/app/data \
  -p 3000:3000 \
  -e OPERATOR_AUTH_TOKEN=your-secret-token \
  ghcr.io/gabrielvfonseca/operator:latest
```

### Systemd Service

For managed systemd services:

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

### Cloud Provider Deployments

- **AWS EKS** - See `docs/install/kubernetes.md`
- **Google Cloud Run** - See `docs/install/cloud-platforms.md`
- **Azure** - See deployment guides in `docs/install/azure.md`

## Multi-Instance Management

### Instance Configuration

Each Operator instance requires unique configuration:

```yaml
# operator-1.json
{
  "gateway":
    {
      "bind": "127.0.0.1",
      "port": 3000,
      "auth": { "mode": "token", "token": "instance1-secret-token" },
    },
  "agent": { "id": "instance-1", "name": "Primary Instance" },
  "data": { "path": "/opt/operator/data-1" },
}
```

### Instance Discovery

Find running instances:

```bash
# List running instances
operator instances list

# Check instance status
operator instances status <instance-id>

# Connect to specific instance
operator gateway run --config /path/to/instance-config.json
```

## High Availability

### Load Balancing

For HA configurations, use reverse proxies:

#### NGINX Configuration

```nginx
upstream operator_instances {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
    # Add more instances for scaling
}

server {
    listen 80;
    server_name operator.example.com;

    location / {
        proxy_pass http://operator_instances;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database Clustering

Operator uses SQLite by default. For production HA:

- **Primary/Replica Setup** - See `docs/gateway/clustering.md`
- **Shared Database** - Deploy managed database (PostgreSQL, MySQL)

## Scaling

### Horizontal Scaling

Deploy multiple instances behind a load balancer:

```bash
# Create instance configs
for i in {1..5}; do
  cat > instance-$i.json << EOF
{
    "gateway": {
      "bind": "0.0.0.0",
      "port": $((3000 + i - 1)),
      "auth": { "mode": "token", "token": "instance$i-token" }
    },
    "agent": {
      "id": "instance-$i",
      "name": "Instance $i"
    },
    "data": { "path": "/opt/operator/data-$i" }
  }
  EOF
done
```

### Vertical Scaling

Scale resources on a single instance:

#### Resource Limits

```yaml
# docker-compose.yml
version: "3.8"
services:
  operator:
    image: ghcr.io/gabrielvfonseca/operator:latest
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 4G
        reservations:
          cpus: "1"
          memory: 2G
    volumes:
      - ./data:/app/data
    environment:
      - NODE_OPTIONS=--max-old-space-size=4096
```

## Monitoring

### Health Checks

Implement health monitoring:

```bash
# Create health check script
#!/bin/bash
curl -f http://localhost:3000/health || exit 1
```

Add to systemd service:

```ini
[Service]
ExecStartPost=/path/to/health-check.sh
```

### Metrics Collection

Operator exposes metrics endpoints:

```bash
# Prometheus metrics
curl http://localhost:3000/metrics

# Health status
curl http://localhost:3000/health

# Detailed status
curl http://localhost:3000/status
```

### Alerting

Configure monitoring alerts:

#### Alert Manager Configuration

```yaml
# alertmanager.yml
route:
  receiver: "operator-webhook"
  routes:
    - match:
        severity: critical
      receiver: "pagerduty"

receivers:
  - name: "operator-webhook"
    webhook_configs:
      - url: "https://hooks.example.com/operator"

  - name: "pagerduty"
    pagerduty_configs:
      - integration_key: "your-pagerduty-key"
        severity: critical
```

## Maintenance

### Upgrades

#### Graceful Shutdown

```bash
# Graceful shutdown
operator gateway stop --graceful

# Force shutdown
operator gateway stop
```

#### Upgrade Process

```bash
# Backup data
shared-db backup
operator gateway backup

# Stop running instance
operator gateway stop

# Deploy new version
docker pull ghcr.io/gabrielvfonseca/operator:latest
docker run -d --name operator ...

# Verify health
./health-check.sh

# Start new instance
operator gateway run --config new-config.json
```

### Backup and Recovery

#### Automated Backup

```bash
# Create backup script
#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATA_DIR="/opt/operator/data"
BACKUP_DIR="/backups/operator"

# Backup data
mkdir -p $BACKUP_DIR/$TIMESTAMP
scp -r $DATA_DIR/* $BACKUP_DIR/$TIMESTAMP/

# Backup configuration
cp /opt/operator/operator.json $BACKUP_DIR/$TIMESTAMP/

# Compress backup
cd $BACKUP_DIR
tar czf operator-$TIMESTAMP.tar.gz $TIMESTAMP/
rm -rf $TIMESTAMP

# Cleanup old backups
find $BACKUP_DIR -name "operator-*.tar.gz" -mtime +30 -delete
```

#### Recovery Process

```bash
# Restore from backup
cd /opt/operator
tar xzf /backups/operator/operator-20230101.tar.gz
operator gateway run --config operator.json
```

### Configuration Management

#### Configuration Rotation

```bash
# Rotate auth tokens
shared-db execute "UPDATE configs SET token = ? WHERE id = ?"

# Rotate TLS certificates
# 1. Generate new cert
cfssl genkey -ca=/path/to/ca.pem -ca-key=/path/to/ca-key.pem \n      -config=/path/to/ca-config.json -host=operator.example.com | cfssljson -bare new-cert

# 2. Update service configuration
cp new-cert.pem /path/to/tls.crt
cp new-cert-key.pem /path/to/tls.key

# 3. Reload service
systemctl reload operator
```

## Troubleshooting

### Common Issues

#### High Memory Usage

```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Clear memory caches
sudo sync; echo 3 > /proc/sys/vm/drop_caches
```

#### High CPU Usage

```bash
# Check CPU usage
htop
iostat -xz 1 10

# Identify bottlenecks
valgrind --tool=massif ./operator.gateway
```

#### Database Performance

```bash
# Optimize SQLite
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
```

### Log Management

#### Log Rotation

```bash
# Create logrotate config
# /etc/logrotate.d/operator

/opt/operator/logs/operator.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 operator operator
    postrotate
        /usr/bin/kill -USR1 `cat /opt/operator/operator.pid`
    endscript
}
```

#### Log Collection

```bash
# Configure syslog forwarding
# /etc/rsyslog.d/99-operator.conf

if $programname == 'operator' then @syslog-server:514
& stop
```

## Security Considerations

### Secure Deployment

- Use TLS/HTTPS for all external traffic
- Implement proper authentication (token/password/trusted-proxy)
- Restrict network access (loopback or private networks)
- Use read-only filesystem for code, writable for data
- Regular security audits and updates

### Network Security

```bash
# Configure firewall rules
# iptables rules for Operator

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow web interface
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT

# Block everything else
iptables -A INPUT -j DROP
```

### Access Control

```bash
# Configure user limits
# /etc/security/limits.conf

operator soft nproc 1024
operator hard nproc 2048
operator soft nofile 4096
operator hard nofile 8192
```

## Compliance and Auditing

### Audit Logging

```bash
# Enable comprehensive audit logging
gateway.audit.enabled = true
gateway.audit.format = json
gateway.audit.path = /var/log/operator/audit
```

### Evidence Preservation

For compliance and forensic analysis:

```bash
# Create audit snapshots
operator audit snapshot --output /compliance/audit-$(date +%Y%m%d)

# Generate compliance reports
operator compliance report --format json --output compliance-report.json
```

## Emergency Procedures

### Disaster Recovery

```bash
# Emergency checklist

1. Assess the situation
   - Check system status
   - Identify root cause

2. Immediate response
   - If service critical: switch to standby instance
   - If data critical: restore from latest backup

3. Long-term recovery
   - Investigate and fix root cause
   - Update procedures
   - Post-incident review
```

### Rollback Procedures

```bash
# Quick rollback script
#!/bin/bash
set -e

BACKUP_DIR="/backups/operator/emergency-backup"
TARGET_DIR="/opt/operator"

# Take emergency snapshot
operator backup create --name emergency-$(date +%s)

# Identify broken version
BROKEN_VERSION=$(git rev-parse HEAD)

# Restore previous working version
git checkout previous-stable-version
git checkout HEAD -- operator.json

# Restart service
systemctl restart operator

# Verify health
./health-check.sh

# If success, commit rollback
cd /opt/operator
git add .
git commit -m "Emergency rollback to previous stable version"
```

## Documentation

For comprehensive deployment guides:

- **Kubernetes** - `docs/install/kubernetes.md`
- **Docker** - `docs/install/docker.md`
- **Systemd** - `docs/install/systemd.md`
- **Cloud Platforms** - `docs/install/cloud-platforms.md`
- **Security** - `docs/gateway/security.md`
- **Troubleshooting** - `docs/gateway/troubleshooting.md`

## Related Resources

- **Operator CLI** - `docs/cli/commands.md`
- **Configuration Reference** - `docs/gateway/configuration.md`
- **Operations Guide** - `docs/operations/overview.md`
- **Troubleshooting** - `docs/troubleshooting/
- **API Reference** - `docs/gateway/api.md`

<!-- Known Issues

[Issue 1](#) - Description
[Issue 2](#) - Description

Limitations

- Feature limitation description
- Known bug report

Maintenance

- Last updated: $(date +%Y-%m-%d)
- Version compatibility notes
-->
