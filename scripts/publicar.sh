#!/usr/bin/env bash
# Publica web/ en GitHub Pages (rama gh-pages) y sube main.
# Uso: bash scripts/publicar.sh
# Antes de publicar cambios en la app, sube VERSION en web/sw.js para que los teléfonos se actualicen.
set -e
cd "$(dirname "$0")/.."
git push origin main
git subtree push --prefix web origin gh-pages
echo "Publicado: https://controlmecharv-sys.github.io/tm-app/"
