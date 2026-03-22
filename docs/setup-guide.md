# Guía de Configuración - SaaS Financiero Freelancer Audiovisual

## Pasos para Implementación

### 1. Configurar Supabase

1. **Crear proyecto en Supabase**
   - Ir a [supabase.com](https://supabase.com)
   - Crear nuevo proyecto
   - Anotar URL y keys

2. **Ejecutar esquema de base de datos**
   ```sql
   -- Ejecutar en SQL Editor de Supabase
   -- Copiar contenido de database/schema.sql
   ```

3. **Configurar Storage**
   ```sql
   -- Ejecutar en SQL Editor
   -- Copiar contenido de config/storage-setup.sql
   ```

4. **Habilitar Autenticación**
   - Ir a Authentication → Settings
   - Habilitar Email provider
   - Configurar URL de redirección

### 2. Configurar n8n

1. **Instalar n8n**
   ```bash
   # Opción 1: Docker (recomendado)
   docker run -d --name n8n -p 5678:5678 n8nio/n8n

   # Opción 2: npm
   npm install -g n8n
   n8n start
   ```

2. **Importar Workflows**
   - Ir a n8n en `http://localhost:5678`
   - Importar JSON de `workflows/`:
     - `ocr-invoice-processing.json`
     - `equipment-rental-alerts.json`
     - `payment-followup.json`

3. **Configurar Credenciales**
   - Supabase API Key
   - Google Vision API Key
   - Telegram Bot Token
   - SMTP credentials

### 3. Configurar APIs Externas

#### Google Vision API
1. Crear proyecto en Google Cloud Console
2. Habilitar Vision API
3. Crear service account y descargar key
4. Configurar en n8n o variable de entorno

#### Telegram Bot
1. Buscar @BotFather en Telegram
2. Crear nuevo bot con `/newbot`
3. Obtener token
4. Agregar bot a tu chat/grupo
5. Obtener chat ID

### 4. Configurar Frontend

#### Bubble.io
1. Crear nueva app en Bubble
2. Instalar plugin "API Connector"
3. Configurar conexión a Supabase:
   ```
   URL: https://your-project.supabase.co
   Key: your-anon-key
   ```

4. Crear data types según esquema
5. Implementar workflows según wireframes

#### FlutterFlow
1. Crear nuevo proyecto en FlutterFlow
2. Conectar a Supabase en Settings
3. Importar esquema de datos
4. Diseñar pantallas según wireframes

### 5. Variables de Entorno

Copiar `config/env.example` a `.env` y completar:

```bash
cp config/env.example .env
# Editar .env con tus credenciales
```

### 6. Scripts Útiles

#### Insertar Datos de Prueba
```bash
# Conectar a Supabase y ejecutar:
# scripts/sample-data.sql
```

#### Verificar Configuración
```sql
-- Verificar tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar buckets
SELECT * FROM storage.buckets;
```

## Estructura del Proyecto

```
├── database/
│   └── schema.sql                 # Esquema completo de BD
├── workflows/
│   ├── ocr-invoice-processing.json
│   ├── equipment-rental-alerts.json
│   └── payment-followup.json
├── frontend/
│   └── wireframes.md              # Diseños UI/UX
├── config/
│   ├── env.example               # Variables de entorno
│   └── storage-setup.sql         # Configuración storage
├── scripts/
│   └── sample-data.sql           # Datos de ejemplo
├── docs/
│   └── setup-guide.md            # Esta guía
└── README.md
```

## Flujos de Trabajo Principales

### 1. Captura de Factura
1. Usuario toma foto con app
2. Imagen se envía a n8n webhook
3. n8n sube a Supabase Storage
4. Google Vision extrae texto
5. Datos parseados se insertan en BD
6. Respuesta con datos extraídos
7. Usuario confirma/guarda en app

### 2. Alertas de Equipo Rentado
1. Cronjob diario a las 9 AM
2. Consulta equipos por vencer
3. Crea alertas en BD
4. Envía notificaciones Telegram
5. Marca alertas como enviadas

### 3. Seguimiento de Pagos
1. Cronjob semanal (lunes 10 AM)
2. Consulta pagos pendientes >30 días
3. Agrupa por cliente
4. Envía resumen Telegram/Email
5. Crea alertas en BD

## Políticas de Seguridad Implementadas

- **RLS en todas las tablas**: Usuarios solo acceden a sus datos
- **Storage privado**: Archivos accesibles solo por owner
- **URLs firmadas**: Acceso temporal a archivos
- **Validación de datos**: Constraints y triggers
- **Auditoría**: Logs de acceso a storage

## Funcionalidades Clave

### Para Freelancers
- ✅ Captura rápida de facturas con OCR
- ✅ Gestión de proyectos con margen real
- ✅ Inventario de equipo (propio/rentado)
- ✅ Alertas automáticas de vencimientos
- ✅ Reportes financieros y fiscales
- ✅ Seguimiento de pagos pendientes

### Para Equipos
- ✅ Acceso multi-usuario (por rol)
- ✅ Compartir proyectos
- ✅ Historial de equipo por proyecto
- ✅ Alertas centralizadas

## Próximos Pasos

1. **Testing**: Probar todos los flujos con datos reales
2. **Ajustes**: Modificar cálculos según necesidades
3. **UI/UX**: Refinar interfaces según feedback
4. **MVP**: Lanzar versión básica
5. **Iterar**: Agregar funcionalidades según demanda

## Soporte

Para dudas o problemas:
1. Verificar logs en n8n
2. Revisar console del navegador
3. Verificar conexión a Supabase
4. Consultar documentación de APIs