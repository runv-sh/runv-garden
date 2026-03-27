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
ALLOWED_CLEANGARDEN_USER="${ALLOWED_CLEANGARDEN_USER:-pmurad-admin}"
PLANTIT_ROOT="/usr/local/bin/plantit-root"
PLANTIT_USER="/usr/local/bin/plantit"
CLEANGARDEN_ROOT="/usr/local/bin/cleangarden-root"
CLEANGARDEN_USER="/usr/local/bin/cleangarden"
GARDEN_SUDOERS="/etc/sudoers.d/runv-garden-commands"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

sync_apache_rewrite_rules() {
  local conf_file="$1"
  if [[ -f "$conf_file" ]]; then
    sed -i \
      -e 's|RewriteCond %{REQUEST_FILENAME} !-f|RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} !-f|g' \
      -e 's|RewriteCond %{REQUEST_FILENAME} !-d|RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} !-d|g' \
      "$conf_file"

    if ! grep -Fq 'RewriteCond %{REQUEST_URI} !^/index\.html$' "$conf_file"; then
      perl -0pi -e 's/RewriteEngine On\n/RewriteEngine On\n    RewriteCond %{REQUEST_URI} !^\/index\\.html\$\n/' "$conf_file"
    fi
  fi
}

harden_app_tree() {
  # Preserve the checkout ownership so the local admin user can keep using git.
  find "$APP_DIR" -type d -exec chmod 755 {} +
  find "$APP_DIR" -type f -exec chmod 644 {} +
  chmod 755 "$APP_DIR/scripts/install-garden-runv.sh" "$APP_DIR/scripts/uninstall-garden-runv.sh"
  chmod 644 "$APP_DIR/scripts/plantit.mjs" "$APP_DIR/scripts/cleangarden.mjs"
}

install_garden_commands() {
  cat >"$PLANTIT_ROOT" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec /usr/bin/env node "$APP_DIR/scripts/plantit.mjs" "\$@"
EOF

  cat >"$PLANTIT_USER" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec sudo -n "$PLANTIT_ROOT" "\$@"
EOF

  cat >"$CLEANGARDEN_ROOT" <<EOF
#!/usr/bin/env bash
set -euo pipefail
export RUNV_GARDEN_ADMIN_USER="$ALLOWED_CLEANGARDEN_USER"
exec /usr/bin/env node "$APP_DIR/scripts/cleangarden.mjs" "\$@"
EOF

  cat >"$CLEANGARDEN_USER" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [[ "\$(id -un)" != "$ALLOWED_CLEANGARDEN_USER" ]]; then
  echo "Acesso negado." >&2
  exit 1
fi
exec sudo -n "$CLEANGARDEN_ROOT" "\$@"
EOF

  chown root:root "$PLANTIT_ROOT" "$PLANTIT_USER" "$CLEANGARDEN_ROOT" "$CLEANGARDEN_USER"
  chmod 755 "$PLANTIT_ROOT" "$PLANTIT_USER" "$CLEANGARDEN_ROOT" "$CLEANGARDEN_USER"

  cat >"$GARDEN_SUDOERS" <<EOF
ALL ALL=(root) NOPASSWD: $PLANTIT_ROOT, $PLANTIT_ROOT *
$ALLOWED_CLEANGARDEN_USER ALL=(root) NOPASSWD: $CLEANGARDEN_ROOT, $CLEANGARDEN_ROOT *
Defaults!$PLANTIT_ROOT !requiretty
Defaults!$CLEANGARDEN_ROOT !requiretty
EOF

  chown root:root "$GARDEN_SUDOERS"
  chmod 440 "$GARDEN_SUDOERS"

  if command -v visudo >/dev/null 2>&1; then
    visudo -cf "$GARDEN_SUDOERS" >/dev/null
  fi
}

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

echo "[1/11] Instalando dependencias do sistema..."
apt-get update
apt-get install -y apache2 git curl ca-certificates npm nodejs rsync certbot python3-certbot-apache cron sudo

echo "[1.1/11] Validando Node e npm..."
node -v
npm -v
node -e "const major = Number(process.versions.node.split('.')[0]); if (major < 20) { console.error('Node.js 20+ e obrigatorio.'); process.exit(1); }"

echo "[2/11] Baixando ou atualizando o projeto..."
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "$APP_DIR" fetch --all --tags
  git -C "$APP_DIR" checkout "$REPO_REF"
  git -C "$APP_DIR" pull --ff-only origin "$REPO_REF"
else
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  git -C "$APP_DIR" checkout "$REPO_REF"
fi

echo "[3/11] Instalando dependencias JavaScript..."
cd "$APP_DIR"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "[4/11] Gerando build de producao..."
npm run build

echo "[5/11] Preparando dados persistentes..."
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
chown -R root:root "$APP_DATA_DIR"
chmod 755 "$APP_DATA_DIR"
chmod 644 "$APP_DATA_DIR/garden-plants.json"

echo "[6/11] Publicando arquivos no DocumentRoot..."
mkdir -p "$WEB_ROOT"
rsync -a --delete "$APP_DIR/dist/" "$WEB_ROOT/"
rm -rf "$WEB_ROOT/data"
ln -sfn "$APP_DATA_DIR" "$WEB_ROOT/data"
chown -h root:root "$WEB_ROOT/data"

echo "[7/11] Endurecendo permissoes do codigo..."
harden_app_tree

echo "[8/11] Criando configuracao do Apache..."
mkdir -p /etc/apache2/sites-available
sed \
  -e "s|__APP_DOMAIN__|${APP_DOMAIN}|g" \
  -e "s|__ADMIN_EMAIL__|${ADMIN_EMAIL}|g" \
  -e "s|__WEB_ROOT__|${WEB_ROOT}|g" \
  "$APP_DIR/deploy/apache/garden.runv.club.conf.template" \
  > "/etc/apache2/sites-available/${APP_DOMAIN}.conf"
sync_apache_rewrite_rules "/etc/apache2/sites-available/${APP_DOMAIN}.conf"

echo "[9/11] Ativando site e modulos..."
a2enmod rewrite headers ssl >/dev/null
a2dissite 000-default >/dev/null || true
a2ensite "${APP_DOMAIN}.conf" >/dev/null
apache2ctl configtest
systemctl enable apache2
systemctl restart apache2

echo "[10/11] Provisionando SSL valido com Certbot..."
certbot --apache --non-interactive --agree-tos -m "$CERTBOT_EMAIL" -d "$APP_DOMAIN" --redirect
sync_apache_rewrite_rules "/etc/apache2/sites-available/${APP_DOMAIN}.conf"
sync_apache_rewrite_rules "/etc/apache2/sites-available/${APP_DOMAIN}-le-ssl.conf"
apache2ctl configtest
systemctl reload apache2
certbot certificates | grep -q "Domains: ${APP_DOMAIN}"

echo "[11/11] Instalando comandos globais e renovacao automatica..."
install_garden_commands
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

Seguranca:
  - o nome exibido vem do usuario Linux real que executa o comando
  - o JSON do jardim e root:root
  - o codigo do deploy e root:root
  - os comandos globais escrevem via sudo controlado

Comando global Linux:
  plantit [mensagem opcional]

Exemplo:
  plantit Tudo que e belo comeca de algum lugar!

Observacao:
  Reexecutar este script atualiza o deploy sem perder o JSON persistente das plantas.

EOF