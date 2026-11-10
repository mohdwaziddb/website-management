#!/usr/bin/env bash
# Live deploy (Jenkins har push par yahi chalata hai; haath se bhi chala sakte ho).
#   backend jar  -> /opt/website-mgmt/app.jar        (service: website-mgmt)
#   frontend     -> /var/www/website-mgmt/dist       (nginx yahi se serve karta hai)
#
# Sirf jo badla wahi build hota hai — pichhla live commit $APP_DIR/.deployed-commit me yaad rehta hai:
#   frontend/ badla -> sirf frontend        backend/ badla -> sirf backend + restart
#   deploy/ badla / pehli baar / FORCE=all  -> dono
#   sirf README / tools -> kuch nahi
# Server par RAM kam hai (2 GB, billing + Jenkins + MySQL saath), isliye build halka rakha hai:
#   - node_modules dobara sirf tab install jab package-lock.json badle
#   - frontend par sirf "vite build" (tsc type-check local / tests me hota hai)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="${APP_DIR:-/opt/website-mgmt}"
WEB_DIR="${WEB_DIR:-/var/www/website-mgmt}"
STATE="$APP_DIR/.deployed-commit"
export VITE_BASE_DOMAIN="${VITE_BASE_DOMAIN:-biziotechnologies.com}"

cd "$ROOT"
HEAD="$(git rev-parse HEAD)"
LAST="$(cat "$STATE" 2>/dev/null || true)"

BACKEND=0
FRONTEND=0
if [ "${FORCE:-}" = "all" ] || [ -z "$LAST" ] || ! git cat-file -e "$LAST^{commit}" 2>/dev/null; then
  echo "==> Pehli baar / FORCE=all / pichhla commit nahi mila -> dono build"
  BACKEND=1
  FRONTEND=1
else
  CHANGED="$(git diff --name-only "$LAST" "$HEAD")"
  echo "==> $LAST..$HEAD me badli files:"
  echo "${CHANGED:-    (kuch nahi)}" | sed 's/^/    /'
  if echo "$CHANGED" | grep -q '^deploy/\|^Jenkinsfile$'; then BACKEND=1; FRONTEND=1; fi
  if echo "$CHANGED" | grep -q '^backend/'; then BACKEND=1; fi
  if echo "$CHANGED" | grep -q '^frontend/'; then FRONTEND=1; fi
fi
[ "${FORCE:-}" = "backend" ] && BACKEND=1
[ "${FORCE:-}" = "frontend" ] && FRONTEND=1

if [ "$BACKEND" = 0 ] && [ "$FRONTEND" = 0 ]; then
  echo "==> Backend / frontend me koi badlav nahi — kuch build nahi kiya"
  echo "$HEAD" > "$STATE"
  exit 0
fi

mkdir -p "$APP_DIR" "$WEB_DIR"

if [ "$FRONTEND" = 1 ]; then
  echo "==> Frontend build"
  cd "$ROOT/frontend"
  HASH="$(sha1sum package-lock.json | cut -d' ' -f1)"
  if [ ! -d node_modules ] || [ "$(cat node_modules/.lock-hash 2>/dev/null)" != "$HASH" ]; then
    echo "    package-lock badla -> npm ci"
    npm ci --no-audit --no-fund --prefer-offline
    echo "$HASH" > node_modules/.lock-hash
  fi
  NODE_OPTIONS="--max-old-space-size=768" npx vite build
  # naya dist pehle bagal me, phir ek jhatke me badlo (aadhi-adhuri website kabhi na dikhe)
  rm -rf "$WEB_DIR/dist.new" "$WEB_DIR/dist.old"
  cp -r "$ROOT/frontend/dist" "$WEB_DIR/dist.new"
  if [ -d "$WEB_DIR/dist" ]; then mv "$WEB_DIR/dist" "$WEB_DIR/dist.old"; fi
  mv "$WEB_DIR/dist.new" "$WEB_DIR/dist"
  rm -rf "$WEB_DIR/dist.old"
  echo "==> Frontend live"
else
  echo "==> Frontend me badlav nahi — skip"
fi

if [ "$BACKEND" = 1 ]; then
  echo "==> Backend build"
  cd "$ROOT/backend"
  mvn -q -B -DskipTests package
  cp "$ROOT/backend/target/website-management-1.0.0.jar" "$APP_DIR/app.jar.new"
  mv "$APP_DIR/app.jar.new" "$APP_DIR/app.jar"
  echo "==> Restart backend"
  sudo -n /usr/bin/systemctl restart website-mgmt
  UP=0
  for i in $(seq 1 40); do
    if curl -fs "http://127.0.0.1:6900/api/open/domain-check?domain=${VITE_BASE_DOMAIN}" >/dev/null; then
      UP=1
      break
    fi
    sleep 3
  done
  if [ "$UP" = 0 ]; then
    echo "!! Backend 2 min me start nahi hua — dekho: sudo journalctl -u website-mgmt -n 80" >&2
    exit 1
  fi
  echo "==> Live: backend chal raha hai"
else
  echo "==> Backend me badlav nahi — skip (restart bhi nahi)"
fi

# sab safal hua tabhi yaad rakho (fail hua to agli baar phir se try hoga)
echo "$HEAD" > "$STATE"
echo "==> Deployed $HEAD"
