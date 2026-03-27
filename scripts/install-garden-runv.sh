#!/usr/bin/env bash
set -euo pipefail

APP_DOMAIN="${APP_DOMAIN:-garden.runv.club}"
ADMIN_EMAIL="${ADMIN_EMAIL:-pablomurad@pm.me}"
APP_DIR="${APP_DIR:-/opt/runv-garden}"
WEB_ROOT="${WEB_ROOT:-/var/www/${APP_DOMAIN}}"
APP_DATA_DIR="${APP_DATA_DIR:-/var/lib/runv-garden/data}"
REPO_URL="${REPO_URL:-}"
REPO_REF="${REPO_REF:-main}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-$ADMIN_EMAIL}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Execute este script como root." >&2
  exit 1
fi

if [[ -z "$REPO_URL" ]] && [[ -d "${DEFAULT_REPO_DIR}/.git" ]]; then
  REPO_URL="$(git -C "$DEFAULT_REPO_DIR" config --get remote.origin.url || true)"
fi

if [[ -z "$REPO_URL" ]]; then
  echo "Nao foi possivel detectar o repositorio automaticamente." >&2
  echo "Execute o script a partir de um checkout git valido ou defina REPO_URL manualmente." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/10] Instalando dependencias do sistema..."
apt-get update
apt-get install -y apache2 git curl ca-certificates npm nodejs rsync certbot python3-certbot-apache cron

echo "[1.1/10] Validando Node e npm..."
node -v
npm -v
node -e "const major = Number(process.versions.node.split('.')[0]); if (major < 20) { console.error('Node.js 20+ e obrigatorio.'); process.exit(1); }"

echo "[2/10] Baixando ou atualizando o projeto..."
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "$APP_DIR" fetch --all --tags
  git -C "$APP_DIR" checkout "$REPO_REF"
  git -C "$APP_DIR" pull --ff-only origin "$REPO_REF"
else
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  git -C "$APP_DIR" checkout "$REPO_REF"
fi

echo "[3/10] Instalando dependencias JavaScript..."
cd "$APP_DIR"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "[4/10] Gerando build de producao..."
npm run build

echo "[5/10] Preparando dados persistentes..."
mkdir -p "$APP_DATA_DIR"
if [[ ! -f "$APP_DATA_DIR/garden-plants.json" ]]; then
  if [[ -f "$WEB_ROOT/data/garden-plants.json" ]]; then
    cp "$WEB_ROOT/data/garden-plants.json" "$APP_DATA_DIR/garden-plants.json"
  elif [[ -f "$APP_DIR/dist/data/garden-plants.json" ]]; then
    cp "$APP_DIR/dist/data/garden-plants.json" "$APP_DATA_DIR/garden-plants.json"
  elif [[ -f "$APP_DIR/dist/data/garden-plants.v0.0.1.json" ]]; then
    cp "$APP_DIR/dist/data/garden-plants.v0.0.1.json" "$APP_DATA_DIR/garden-plants.json"
  fi
fi

echo "[6/10] Publicando arquivos no DocumentRoot..."
mkdir -p "$WEB_ROOT"
rsync -a --delete "$APP_DIR/dist/" "$WEB_ROOT/"
rm -rf "$WEB_ROOT/data"
ln -sfn "$APP_DATA_DIR" "$WEB_ROOT/data"

echo "[7/10] Criando configuracao do Apache..."
mkdir -p /etc/apache2/sites-available
sed \
  -e "s|__APP_DOMAIN__|${APP_DOMAIN}|g" \
  -e "s|__ADMIN_EMAIL__|${ADMIN_EMAIL}|g" \
  -e "s|__WEB_ROOT__|${WEB_ROOT}|g" \
  "$APP_DIR/deploy/apache/garden.runv.club.conf.template" \
  > "/etc/apache2/sites-available/${APP_DOMAIN}.conf"

echo "[8/10] Ativando site e modulos..."
a2enmod rewrite headers ssl >/dev/null
a2dissite 000-default >/dev/null || true
a2ensite "${APP_DOMAIN}.conf" >/dev/null
apache2ctl configtest
systemctl enable apache2
systemctl restart apache2

echo "[9/10] Provisionando SSL valido com Certbot..."
certbot --apache --non-interactive --agree-tos -m "$CERTBOT_EMAIL" -d "$APP_DOMAIN" --redirect
certbot certificates | grep -q "Domains: ${APP_DOMAIN}"

echo "[10/10] Garantindo renovacao automatica..."
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
Repositorio detectado: ${REPO_URL}
Dados persistentes: ${APP_DATA_DIR}/garden-plants.json

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
  Reexecutar este script atualiza o deploy sem perder o JSON persistente das plantas.

EOF
