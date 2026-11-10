#!/usr/bin/env bash
# Nayi website ek command me:  sudo add-website <code> "<Website ka naam>"
#   e.g.  sudo add-website abc "ABC School"   ->  https://abc.biziotechnologies.com
# Kya karta hai:
#   1. wm_master.tenants me row (DB naam = code, Super Admin login pehli website se copy — sab ka common)
#   2. nginx ki website-mgmt file me abc.biziotechnologies.com jodta hai + reload (galat ho to purani config wapas)
#   3. backend restart => DB + tables + Super Admin apne aap; ban jaane tak rukta hai
# Ek baar link:  sudo ln -sf /var/lib/jenkins/workspace/website-mgmt/deploy/add-website.sh /usr/local/bin/add-website
set -euo pipefail

DOMAIN="${BASE_DOMAIN:-biziotechnologies.com}"
NGINX_FILE="${NGINX_FILE:-/etc/nginx/sites-available/website-mgmt}"
MYSQL="${MYSQL:-mysql}"

if [ "$(id -u)" != 0 ]; then echo "sudo ke saath chalao: sudo add-website <code> \"<naam>\"" >&2; exit 1; fi
if [ $# -lt 2 ]; then
  echo "Use: sudo add-website <code> \"<Website ka naam>\"     e.g. sudo add-website abc \"ABC School\"" >&2
  exit 1
fi

CODE="$(echo "$1" | tr 'A-Z' 'a-z')"
NAME="$2"
# code = subdomain: sirf a-z, 0-9, '-' ; DB naam me '-' => '_'
if ! [[ "$CODE" =~ ^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$ ]]; then
  echo "Code galat: sirf a-z, 0-9 aur '-' (1-40), shuru / ant me '-' nahi" >&2; exit 1
fi
case "$CODE" in www|admin|api|app|mail) echo "'$CODE' reserved hai, koi aur naam lo" >&2; exit 1;; esac
DB="${CODE//-/_}"
HOST="$CODE.$DOMAIN"
NAME_SQL="${NAME//\\/\\\\}"
NAME_SQL="${NAME_SQL//\'/\'\'}"

q() { $MYSQL -N -B -e "$1"; }

echo "==> 1/3 Master me website: $CODE ($NAME)"
if [ "$(q "SELECT COUNT(*) FROM wm_master.tenants WHERE code='$CODE' OR subdomain='$CODE' OR db_name='$DB'")" != 0 ]; then
  echo "    '$CODE' pehle se hai — row skip"
else
  if [ "$(q "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='$DB'")" != 0 ]; then
    echo "!! MySQL me '$DB' naam ka database pehle se hai (shayad billing ya kuch aur). Koi aur code lo." >&2; exit 1
  fi
  # Super Admin: sab websites ka common — pehli website wala
  q "INSERT INTO wm_master.tenants (code, subdomain, custom_domain, name, db_name, admin_username, admin_password)
     SELECT '$CODE', '$CODE', NULL, '$NAME_SQL', '$DB', admin_username, admin_password
     FROM wm_master.tenants WHERE admin_username IS NOT NULL ORDER BY id LIMIT 1"
  if [ "$(q "SELECT COUNT(*) FROM wm_master.tenants WHERE code='$CODE'")" = 0 ]; then
    echo "!! Row nahi bani — master me koi website Super Admin ke saath nahi mili" >&2; exit 1
  fi
fi

echo "==> 2/3 nginx: $HOST"
if grep -qE "server_name[^;]*[[:space:]]$HOST[;[:space:]]" "$NGINX_FILE"; then
  echo "    pehle se hai"
else
  cp "$NGINX_FILE" "$NGINX_FILE.bak"
  sed -i -E "s/^([[:space:]]*server_name[^;]*);/\1 $HOST;/" "$NGINX_FILE"
  if ! nginx -t 2>/dev/null; then
    cp "$NGINX_FILE.bak" "$NGINX_FILE"
    echo "!! nginx config galat bani — purani wapas lagayi. 'sudo nginx -t' dekho" >&2; exit 1
  fi
  systemctl reload nginx
  rm -f "$NGINX_FILE.bak"
fi

echo "==> 3/3 Backend restart (DB + tables + Super Admin)"
SINCE="$(date '+%Y-%m-%d %H:%M:%S')"
systemctl restart website-mgmt
READY=0
for i in $(seq 1 60); do
  # website tab taiyaar jab uske DB me Super Admin aa gaya
  if [ "$(q "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB' AND table_name='users'")" != 0 ] \
     && [ "$(q "SELECT COUNT(*) FROM \`$DB\`.users WHERE role='SUPER_ADMIN'")" != 0 ]; then
    READY=1; break
  fi
  if journalctl -u website-mgmt --since "$SINCE" --no-pager 2>/dev/null | grep -q "Setup failed for tenant $CODE"; then break; fi
  sleep 3
done
if [ "$READY" = 0 ]; then
  echo "!! Website 3 min me taiyaar nahi hui — dekho: sudo journalctl -u website-mgmt -n 80" >&2; exit 1
fi

echo
echo "Ho gaya:  https://$HOST        admin: https://$HOST/admin"
echo "Login: master wala Super Admin. Andar Users page se client ka login banao."
