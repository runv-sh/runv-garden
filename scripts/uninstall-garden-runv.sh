#!/usr/bin/env bash
set -euo pipefail

APP_DOMAIN="${APP_DOMAIN:-garden.runv.club}"
APP_DIR="${APP_DIR:-/opt/runv-garden}"
WEB_ROOT="${WEB_ROOT:-/var/www/${APP_DOMAIN}}"
APP_DATA_DIR="${APP_DATA_DIR:-/var/lib/runv-garden/data}"
PLANTIT_ROOT="/usr/local/bin/plantit-root"
PLANTIT_USER="/usr/local/bin/plantit"
PLANTIT_SUDOERS="/etc/sudoers.d/runv-garden-plantit"
REMOVE_CERTS="${REMOVE_CERTS:-false}"
REMOVE_CODE="${REMOVE_CODE:-false}"
REMOVE_DATA="${REMOVE_DATA:-false}"

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

case "$APP_DATA_DIR" in
  /|/root|/home|/var|/var/lib|"")
    echo "APP_DATA_DIR inseguro: $APP_DATA_DIR" >&2
    exit 1
    ;;
esac

echo "Este desinstalador remove apenas artefatos da instalacao do ${APP_DOMAIN}."
echo "Ele NAO remove pacotes do sistema, NAO reverte configuracoes globais do Apache e NAO mexe em outros sites."
echo "Os dados persistentes das plantas sao preservados por padrao."

echo "[1/8] Desativando site do Apache..."
if [[ -f "/etc/apache2/sites-available/${APP_DOMAIN}.conf" ]]; then
  a2dissite "${APP_DOMAIN}.conf" >/dev/null || true
  rm -f "/etc/apache2/sites-available/${APP_DOMAIN}.conf"
fi

if [[ -f "/etc/apache2/sites-enabled/${APP_DOMAIN}.conf" ]]; then
  rm -f "/etc/apache2/sites-enabled/${APP_DOMAIN}.conf"
fi

echo "[2/8] Removendo conteudo publicado desta instalacao..."
rm -rf "$WEB_ROOT"

echo "[3/8] Removendo comando global plantit desta instalacao..."
rm -f "$PLANTIT_USER" "$PLANTIT_ROOT" "$PLANTIT_SUDOERS"

echo "[4/8] Removendo renovacao cron desta instalacao, se existir..."
rm -f /etc/cron.d/certbot-renew-runv-garden

if [[ "$REMOVE_CERTS" == "true" ]]; then
  echo "[5/8] Removendo certificados do dominio desta instalacao..."
  certbot delete --non-interactive --cert-name "$APP_DOMAIN" || true
else
  echo "[5/8] Certificados preservados. Use REMOVE_CERTS=true para apagar."
fi

if [[ "$REMOVE_CODE" == "true" ]]; then
  echo "[6/8] Removendo codigo-fonte local desta instalacao..."
  rm -rf "$APP_DIR"
else
  echo "[6/8] Codigo-fonte preservado em $APP_DIR. Use REMOVE_CODE=true para apagar."
fi

if [[ "$REMOVE_DATA" == "true" ]]; then
  echo "[7/8] Removendo dados persistentes desta instalacao..."
  rm -rf "$APP_DATA_DIR"
else
  echo "[7/8] Dados persistentes preservados em $APP_DATA_DIR. Use REMOVE_DATA=true para apagar."
fi

echo "[8/8] Recarregando Apache..."
apache2ctl configtest || true
systemctl reload apache2 || systemctl restart apache2 || true

cat <<EOF

Desinstalacao concluida.

Dominio: ${APP_DOMAIN}
DocumentRoot removido: ${WEB_ROOT}
Certificados removidos: ${REMOVE_CERTS}
Codigo-fonte removido: ${REMOVE_CODE}
Dados persistentes removidos: ${REMOVE_DATA}
Comando plantit removido: true

Observacao:
  Apenas artefatos desta instalacao foram removidos.
  Por padrao, o JSON persistente das plantas e preservado.

EOF