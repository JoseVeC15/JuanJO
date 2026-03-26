#!/bin/bash
set -e

echo ">>> Iniciando Proceso de Construcción Detallado <<<"

# Configuración
FLUTTER_CHANNEL="stable"
PROJ_DIR="saas_audiovisual"

cd $PROJ_DIR

# 1. Instalación/Verificación de Flutter
if [ ! -d "flutter" ]; then
  echo ">>> Descargando Flutter SDK..."
  git clone https://github.com/flutter/flutter.git -b $FLUTTER_CHANNEL --depth 1
fi

export PATH="$PATH:`pwd`/flutter/bin"

echo ">>> Versión de Flutter:"
./flutter/bin/flutter --version

echo ">>> Ayuda de build web (Primeros 20 líneas):"
./flutter/bin/flutter build web -h | head -n 20

echo ">>> Limpiando proyecto..."
./flutter/bin/flutter clean

echo ">>> Obteniendo dependencias..."
./flutter/bin/flutter pub get

# 2. Inyección de variables de entorno (Debug)
echo ">>> SUPABASE_URL: ${SUPABASE_URL:0:10}..."

# 3. Compilación Web (Con Verbose para diagnóstico profundo)
echo ">>> Compilando para Web (VERBOSE)..."
./flutter/bin/flutter build web --release --verbose --no-pub \
  "--dart-define=SUPABASE_URL=$SUPABASE_URL" \
  "--dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"

echo ">>> Construcción finalizada con éxito."
