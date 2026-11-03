#!/usr/bin/env bash
# ==============================================================================
# One-Step Deployment Script for Self Excellence VPS (srv1121234)
# Run as root in /var/www/self-excellence
# ==============================================================================
set -euo pipefail

APP_DIR="/var/www/self-excellence"
echo "=== Starting deployment in ${APP_DIR} ==="

cd "${APP_DIR}"

# 1. Pull latest code
echo "--> Pulling latest code from GitHub..."
git pull origin main || git pull updated main

# 2. Configure Swap if not already active
if [ -f "${APP_DIR}/deploy/setup-swap.sh" ]; then
    echo "--> Checking swap configuration..."
    bash "${APP_DIR}/deploy/setup-swap.sh"
fi

# 3. Setup Logrotate
if [ -f "${APP_DIR}/deploy/logrotate-self-excellence.conf" ]; then
    echo "--> Installing logrotate rule..."
    cp "${APP_DIR}/deploy/logrotate-self-excellence.conf" /etc/logrotate.d/self-excellence
    chmod 644 /etc/logrotate.d/self-excellence
fi

# 4. Deterministic workspace install and verification
echo "--> Installing the locked workspace dependency graph..."
cd "${APP_DIR}"
mkdir -p logs
npm ci
npm run verify

# 5. Build Frontend
echo "--> Building production frontend..."
npm run build

# 6. PM2 Restart with 1 Worker & 280MB Memory Ceiling
echo "--> Reloading backend via PM2..."
cd "${APP_DIR}/backend"
pm2 delete self-excellence-backend 2>/dev/null || true
if pm2 list | grep -q "self-excellence"; then
    pm2 restart ecosystem.config.cjs --update-env
else
    pm2 start ecosystem.config.cjs
fi
pm2 save

# 7. Nginx Test & Reload
echo "--> Testing and reloading Nginx..."
if [ -f /etc/nginx/sites-available/self-excellence ]; then
    nginx -t && systemctl reload nginx
else
    echo "Notice: /etc/nginx/sites-available/self-excellence not found. Copying template..."
    cp "${APP_DIR}/deploy/nginx-self-excellence.conf" /etc/nginx/sites-available/self-excellence
    ln -sf /etc/nginx/sites-available/self-excellence /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
fi

echo "=== Deployment finished successfully! ==="
echo "Memory snapshot:"
free -h
echo "PM2 Status:"
pm2 status
curl -s http://localhost:5055/api/health || true
echo ""
