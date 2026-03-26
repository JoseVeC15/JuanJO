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

# 2. Obtención de Dependencias
echo ">>> Obteniendo dependencias..."
./flutter/bin/flutter pub get

# 3. Compilación Web
echo ">>> Compilando para Web..."
./flutter/bin/flutter build web --release --no-pub \
  "--dart-define=SUPABASE_URL=$SUPABASE_URL" \
  "--dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"

echo ">>> Moviendo archivos a la raíz para Vercel..."
cd ..
rm -rf public
mkdir -p public
cp -r saas_audiovisual/build/web/* public/

echo ">>> Construcción finalizada con éxito."
