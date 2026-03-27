#!/usr/bin/env bash
set -euo pipefail

APP_DOMAIN="${APP_DOMAIN:-garden.runv.club}"
APP_DIR="${APP_DIR:-/opt/runv-garden}"
WEB_ROOT="${WEB_ROOT:-/var/www/${APP_DOMAIN}}"
REMOVE_CERTS="${REMOVE_CERTS:-false}"
REMOVE_CODE="${REMOVE_CODE:-false}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Execute este script como root." >&2
  exit 1
fi

case "$APP_DIR" in
  /|/root|/home|/var|/var/www|"")
    echo "APP_DIR inseguro: $APP_DIR" >&2
    exit 1
    ;;
esac

case "$WEB_ROOT" in
  /|/root|/home|/var|/var/www|"")
    echo "WEB_ROOT inseguro: $WEB_ROOT" >&2
    exit 1
    ;;
esac

echo "Este desinstalador remove apenas artefatos da instalacao do ${APP_DOMAIN}."
echo "Ele NAO remove pacotes do sistema, NAO reverte configuracoes globais do Apache e NAO mexe em outros sites."

echo "[1/6] Desativando site do Apache..."
if [[ -f "/etc/apache2/sites-available/${APP_DOMAIN}.conf" ]]; then
  a2dissite "${APP_DOMAIN}.conf" >/dev/null || true
  rm -f "/etc/apache2/sites-available/${APP_DOMAIN}.conf"
fi

if [[ -f "/etc/apache2/sites-enabled/${APP_DOMAIN}.conf" ]]; then
  rm -f "/etc/apache2/sites-enabled/${APP_DOMAIN}.conf"
fi

echo "[2/6] Removendo conteudo publicado desta instalacao..."
rm -rf "$WEB_ROOT"

echo "[3/6] Removendo renovacao cron desta instalacao, se existir..."
rm -f /etc/cron.d/certbot-renew-runv-garden

if [[ "$REMOVE_CERTS" == "true" ]]; then
  echo "[4/6] Removendo certificados do dominio desta instalacao..."
  certbot delete --non-interactive --cert-name "$APP_DOMAIN" || true
else
  echo "[4/6] Certificados preservados. Use REMOVE_CERTS=true para apagar."
fi

if [[ "$REMOVE_CODE" == "true" ]]; then
  echo "[5/6] Removendo codigo-fonte local desta instalacao..."
  rm -rf "$APP_DIR"
else
  echo "[5/6] Codigo-fonte preservado em $APP_DIR. Use REMOVE_CODE=true para apagar."
fi

echo "[6/6] Recarregando Apache..."
apache2ctl configtest || true
systemctl reload apache2 || systemctl restart apache2 || true

cat <<EOF

Desinstalacao concluida.

Dominio: ${APP_DOMAIN}
DocumentRoot removido: ${WEB_ROOT}
Certificados removidos: ${REMOVE_CERTS}
Codigo-fonte removido: ${REMOVE_CODE}

Observacao:
  Apenas artefatos desta instalacao foram removidos.

EOF
