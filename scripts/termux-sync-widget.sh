#!/data/data/com.termux/files/usr/bin/bash
# Operator OAuth Sync Widget
# Syncs Claude Code tokens to Operator over SSH
# Place in ~/.shortcuts/ on phone for Termux:Widget

termux-toast "Syncing Operator auth..."

# Run sync on the configured Operator host.
SERVER="${OPENCLAW_SERVER:-operator-host}"
RESULT=$(ssh "$SERVER" '$HOME/operator/scripts/sync-claude-code-auth.sh' 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    # Extract expiry time from output
    EXPIRY=$(echo "$RESULT" | grep "Token expires:" | cut -d: -f2-)

    termux-vibrate -d 100
    termux-toast "Operator synced! Expires:${EXPIRY}"

    # Optional: restart operator service
    ssh "$SERVER" 'systemctl --user restart operator' 2>/dev/null
else
    termux-vibrate -d 300
    termux-toast "Sync failed: ${RESULT}"
fi
