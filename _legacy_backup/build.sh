#!/bin/bash
set -e

echo ">>> Iniciando Construcción de Almacén Digital Web (Premium) <<<"

# 1. Mapear variables de entorno de Vercel/System a Vite
# Si el usuario tiene SUPABASE_URL en Vercel, la convertimos a VITE_SUPABASE_URL
export VITE_SUPABASE_URL=${SUPABASE_URL:-$VITE_SUPABASE_URL}
export VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-$VITE_SUPABASE_ANON_KEY}
export VITE_N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL:-"https://n8naws.josevec.uk/webhook/process-invoice"}

# 2. Entrar al directorio de React
cd almacen_digital_web

# 3. Instalar dependencias
echo ">>> Instalando dependencias de React..."
npm install

# 4. Compilar el proyecto
echo ">>> Compilando con Vite..."
npm run build

# 5. Preparar la salida para Vercel
# Movemos todo a la raíz de la carpeta 'public' para que Vercel lo sirva directamente
echo ">>> Moviendo archivos a la carpeta pública a nivel de raíz..."
cd ..
rm -rf public
mkdir -p public
cp -r almacen_digital_web/dist/* public/

echo ">>> Construcción Premium finalizada con éxito."
