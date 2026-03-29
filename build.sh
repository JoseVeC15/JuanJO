#!/bin/bash
set -e

echo ">>> Iniciando Construcción de Almacén Digital Web (Premium) <<<"

# 1. Entrar al directorio de React
cd almacen_digital_web

# 2. Instalar dependencias
echo ">>> Instalando dependencias de React..."
npm install

# 3. Compilar el proyecto
echo ">>> Compilando con Vite..."
npm run build

# 4. Preparar la salida para Vercel
echo ">>> Moviendo archivos a la carpeta pública..."
cd ..
rm -rf public
mkdir -p public
cp -r almacen_digital_web/dist/* public/

echo ">>> Construcción Premium finalizada con éxito."
