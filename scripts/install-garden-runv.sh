#!/usr/bin/env bash
set -euo pipefail

APP_DOMAIN="${APP_DOMAIN:-garden.runv.club}"
ADMIN_EMAIL="${ADMIN_EMAIL:-pablomurad@pm.me}"
APP_DIR="${APP_DIR:-/opt/runv-garden}"
WEB_ROOT="${WEB_ROOT:-/var/www/${APP_DOMAIN}}"
REPO_URL="${REPO_URL:-}"
REPO_REF="${REPO_REF:-main}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-$ADMIN_EMAIL}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Execute este script como root." >&2
  exit 1
fi

if [[ -z "$REPO_URL" ]]; then
  echo "Defina REPO_URL antes de executar. Exemplo:" >&2
  echo "REPO_URL='https://github.com/seu-org/runv-garden.git' bash scripts/install-garden-runv.sh" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/9] Instalando dependencias do sistema..."
apt-get update
apt-get install -y apache2 git curl ca-certificates npm nodejs rsync certbot python3-certbot-apache cron

echo "[1.1/9] Validando Node e npm..."
node -v
npm -v
node -e "const major = Number(process.versions.node.split('.')[0]); if (major < 20) { console.error('Node.js 20+ e obrigatorio.'); process.exit(1); }"

echo "[2/9] Baixando ou atualizando o projeto..."
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "$APP_DIR" fetch --all --tags
  git -C "$APP_DIR" checkout "$REPO_REF"
  git -C "$APP_DIR" pull --ff-only origin "$REPO_REF"
else
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  git -C "$APP_DIR" checkout "$REPO_REF"
fi

echo "[3/9] Instalando dependencias JavaScript..."
cd "$APP_DIR"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "[4/9] Gerando build de producao..."
npm run build

echo "[5/9] Publicando arquivos no DocumentRoot..."
mkdir -p "$WEB_ROOT"
rsync -a --delete "$APP_DIR/dist/" "$WEB_ROOT/"

echo "[6/9] Criando configuracao do Apache..."
mkdir -p /etc/apache2/sites-available
sed \
  -e "s|__APP_DOMAIN__|${APP_DOMAIN}|g" \
  -e "s|__ADMIN_EMAIL__|${ADMIN_EMAIL}|g" \
  -e "s|__WEB_ROOT__|${WEB_ROOT}|g" \
  "$APP_DIR/deploy/apache/garden.runv.club.conf.template" \
  > "/etc/apache2/sites-available/${APP_DOMAIN}.conf"

echo "[7/9] Ativando site e modulos..."
a2enmod rewrite headers ssl >/dev/null
a2dissite 000-default >/dev/null || true
a2ensite "${APP_DOMAIN}.conf" >/dev/null
apache2ctl configtest
systemctl enable apache2
systemctl restart apache2

echo "[8/9] Provisionando SSL valido com Certbot..."
certbot --apache --non-interactive --agree-tos -m "$CERTBOT_EMAIL" -d "$APP_DOMAIN" --redirect
certbot certificates | grep -q "Domains: ${APP_DOMAIN}"

echo "[9/9] Garantindo renovacao automatica..."
if systemctl list-unit-files | grep -q '^certbot.timer'; then
  systemctl enable certbot.timer
  systemctl start certbot.timer
else
  cat >/etc/cron.d/certbot-renew-runv-garden <<CRON
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
0 3 * * * root certbot renew --quiet --deploy-hook "systemctl reload apache2"
CRON
  chmod 644 /etc/cron.d/certbot-renew-runv-garden
  systemctl enable cron
  systemctl restart cron
fi

cat <<EOF

Deploy concluido com SSL obrigatorio.

Dominio: ${APP_DOMAIN}
DocumentRoot: ${WEB_ROOT}
Codigo-fonte: ${APP_DIR}

SSL:
  - certificado valido provisionado com Certbot
  - renovacao automatica ativada via certbot.timer ou cron

Comando global planejado para o runv.club:
  !plantar [mensagem opcional]

Regra de negocio:
  - qualquer usuario do runv.club pode usar o comando
  - 1 planta por usuario a cada 24 horas
  - frase aleatoria por plantio
  - mensagem opcional anexada a planta

Observacao:
  O front ja esta publicado. A garantia do cooldown de 24h e do comando global ainda precisa ser implementada no backend/bot do runv.club.

EOF
