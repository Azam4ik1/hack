#!/bin/sh
# Self-signed cert for Telegram webhook on 8443 (80/443 belong to ejournal).
set -eu
HOST="${TAAP_TLS_HOST:-srv1957432.hstgr.cloud}"
IP="${TAAP_TLS_IP:-69.62.119.190}"
DIR="${1:-./certs}"
mkdir -p "$DIR"
if [ -f "$DIR/tls.crt" ] && [ -f "$DIR/tls.key" ]; then
  echo "tls already present"
  exit 0
fi
openssl req -x509 -newkey rsa:2048 -sha256 -days 825 -nodes \
  -keyout "$DIR/tls.key" \
  -out "$DIR/tls.crt" \
  -subj "/CN=${HOST}" \
  -addext "subjectAltName=DNS:${HOST},IP:${IP}"
chmod 600 "$DIR/tls.key"
chmod 644 "$DIR/tls.crt"
