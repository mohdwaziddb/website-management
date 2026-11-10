#!/usr/bin/env bash
# Live deploy (Jenkins har push par yahi chalata hai; haath se bhi chala sakte ho).
#   backend jar  -> /opt/website-mgmt/app.jar        (service: website-mgmt)
#   frontend     -> /var/www/website-mgmt/dist       (nginx yahi se serve karta hai)
# Server par RAM kam hai (2 GB, billing + Jenkins + MySQL saath), isliye build halka rakha hai:
#   - node_modules dobara sirf tab install jab package-lock.json badle
#   - frontend par sirf "vite build" (tsc type-check local / tests me hota hai)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="${APP_DIR:-/opt/website-mgmt}"
WEB_DIR="${WEB_DIR:-/var/www/website-mgmt}"
export VITE_BASE_DOMAIN="${VITE_BASE_DOMAIN:-biziotechnologies.com}"

echo "==> Backend build"
cd "$ROOT/backend"
mvn -q -B -DskipTests package

echo "==> Frontend build"
cd "$ROOT/frontend"
HASH="$(sha1sum package-lock.json | cut -d' ' -f1)"
if [ ! -d node_modules ] || [ "$(cat node_modules/.lock-hash 2>/dev/null)" != "$HASH" ]; then
  echo "    package-lock badla -> npm ci"
  npm ci --no-audit --no-fund --prefer-offline
  echo "$HASH" > node_modules/.lock-hash
fi
NODE_OPTIONS="--max-old-space-size=768" npx vite build

echo "==> Copy"
mkdir -p "$APP_DIR" "$WEB_DIR"
cp "$ROOT/backend/target/website-management-1.0.0.jar" "$APP_DIR/app.jar.new"
mv "$APP_DIR/app.jar.new" "$APP_DIR/app.jar"
# naya dist pehle bagal me, phir ek jhatke me badlo (aadhi-adhuri website kabhi na dikhe)
rm -rf "$WEB_DIR/dist.new" "$WEB_DIR/dist.old"
cp -r "$ROOT/frontend/dist" "$WEB_DIR/dist.new"
if [ -d "$WEB_DIR/dist" ]; then mv "$WEB_DIR/dist" "$WEB_DIR/dist.old"; fi
mv "$WEB_DIR/dist.new" "$WEB_DIR/dist"
rm -rf "$WEB_DIR/dist.old"

echo "==> Restart backend"
sudo -n /usr/bin/systemctl restart website-mgmt
for i in $(seq 1 30); do
  if curl -fs "http://127.0.0.1:6900/api/open/domain-check?domain=${VITE_BASE_DOMAIN}" >/dev/null; then
    echo "==> Live: backend chal raha hai"
    exit 0
  fi
  sleep 3
done
echo "!! Backend 90 sec me start nahi hua — dekho: sudo journalctl -u website-mgmt -n 80" >&2
exit 1
