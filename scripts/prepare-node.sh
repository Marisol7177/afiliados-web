#!/usr/bin/env bash
set -euo pipefail

REPO="$HOME/afiliados-web"
SOURCE="${1:-https://coinfactory.info}"
DEST="${2:-$HOME/coinfactory-node/site}"

echo "=== PREPARANDO COPIA DEL NODO ==="
echo "Origen: $SOURCE"
echo "Destino: $DEST"

mkdir -p "$DEST"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo
echo "=== DESCARGANDO LA PAGINA ==="
curl -fLsS --max-time 30 "$SOURCE/" -o "$TMP/index.html"

if ! grep -qi '<html' "$TMP/index.html"; then
  echo "ERROR: la respuesta no parece una pagina HTML"
  exit 1
fi

cp "$TMP/index.html" "$DEST/index.html"

echo
echo "=== GUARDANDO INVENTARIO SHA-256 ==="
(
  cd "$DEST"
  sha256sum index.html > SHA256SUMS
)

echo
echo "=== COMPROBANDO LA COPIA ==="
(
  cd "$DEST"
  sha256sum -c SHA256SUMS
)

echo
echo "Copia inicial preparada en: $DEST"
echo "NOTA: este script prepara una copia HTML."
echo "Todavia no distribuye recursos ni conecta nodos P2P."
