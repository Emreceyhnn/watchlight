#!/bin/sh
set -e

CERTS_DIR="$(dirname "$0")/../certs"
mkdir -p "$CERTS_DIR"

if [ -f "$CERTS_DIR/fullchain.pem" ] && [ -f "$CERTS_DIR/privkey.pem" ]; then
  echo "TLS certificates already exist in $CERTS_DIR. Skipping generation."
  exit 0
fi

echo "Generating self-signed development/staging TLS certificates in $CERTS_DIR..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERTS_DIR/privkey.pem" \
  -out "$CERTS_DIR/fullchain.pem" \
  -subj "/C=US/ST=State/L=City/O=Watchlight/OU=SOC/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "TLS certificates generated successfully:"
echo "  - $CERTS_DIR/fullchain.pem"
echo "  - $CERTS_DIR/privkey.pem"

