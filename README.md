# SaaS Financiero Freelancer Audiovisual

Sistema de gestión financiera diseñado específicamente para freelancers y pequeños equipos de producción audiovisual. Permite controlar proyectos, gastos, inventario de equipo, facturas con OCR automático y automatizaciones.

## Stack Tecnológico

| Componente | Herramienta | Función |
|------------|-------------|---------|
| **Frontend** | Flutter Web 3.x | Interfaz mobile-first PWA |
| **Base de datos** | Supabase | PostgreSQL + Auth + Storage |
| **Automatizaciones** | n8n | Workflows OCR y alertas |
| **OCR/IA** | OpenAI GPT-4 Vision | Extracción inteligente de datos |
| **Storage** | Supabase Storage | Imágenes de facturas y equipos |
| **Notificaciones** | Telegram Bot | Alertas y recordatorios |
| **Deployment** | Easypanel + Docker | Hosting y orquestación |

## Credenciales del Proyecto

### Supabase
- **URL**: `https://db.yfktdnpcmdpjrdlhqrls.supabase.co`
- **Anon Key**: Disponible en `config/env.example`

### n8n
- **URL**: `https://n8nlocal.josevec.uk`
- **Webhook OCR**: `/webhook-test/c9900166-2986-41b5-9113-8d87682964d4`

### Telegram Bot
- **User ID**: `1561439670`
- **Bot Token**: Configurar en variables de entorno n8n

## Requisitos Previos

### Desarrollo Local
- Flutter SDK 3.x
- Dart SDK 3.x
- Git
- Chrome (para pruebas web)

### Producción
- Docker y Docker Compose
- Easypanel (opcional)
- Dominio con Cloudflare (opcional)

## Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd JuanJo
```

### 2. Configurar Supabase
```bash
# Ejecutar esquema principal
psql -h <host> -U postgres -d postgres -f database/schema.sql

# Configurar storage
psql -h <host> -U postgres -d postgres -f config/storage-setup.sql

# Cargar datos de prueba (opcional)
psql -h <host> -U postgres -d postgres -f scripts/sample-data-simple.sql
```

### 3. Configurar n8n
```bash
# Importar workflows
# 1. Abrir n8n en https://n8nlocal.josevec.uk
# 2. Importar cada archivo JSON de workflows/
# 3. Configurar credenciales:
#    - OpenAI API Key
#    - Telegram Bot Token
#    - Supabase URL y Service Key
```

### 4. Ejecutar Frontend (Desarrollo)
```bash
cd saas_audiovisual
flutter pub get
flutter run -d chrome
```

### 5. Ejecutar Frontend (Producción)
```bash
cd saas_audiovisual
docker-compose up -d
```

## Estructura del Proyecto

```
JuanJo/
├── saas_audiovisual/           # Aplicación Flutter Web
│   ├── lib/
│   │   ├── main.dart           # Entry point con rutas
│   │   ├── screens/            # Pantallas de la app
│   │   │   ├── login_screen.dart
│   │   │   ├── home_screen.dart
│   │   │   ├── camera_screen.dart
│   │   │   ├── confirm_screen.dart
│   │   │   ├── projects_screen.dart
│   │   │   └── inventory_screen.dart
│   │   └── services/
│   │       └── supabase_service.dart
│   ├── Dockerfile              # Container multi-stage
│   ├── docker-compose.yml      # Orquestación completa
│   ├── nginx.conf              # Configuración web server
│   └── pubspec.yaml            # Dependencias Flutter
│
├── database/
│   └── schema.sql              # Esquema completo (tablas, RLS, triggers)
│
├── config/
│   ├── env.example             # Variables de entorno
│   └── storage-setup.sql       # Configuración buckets storage
│
├── workflows/
│   ├── ocr-invoice-processing.json
│   ├── equipment-rental-alerts.json
│   └── payment-followup.json
│
├── scripts/
│   ├── sample-data.sql         # Datos de prueba completos
│   └── sample-data-simple.sql  # Datos mínimos para testing
│
├── docs/
│   └── setup-guide.md          # Guía detallada de setup
│
└── frontend/
    └── wireframes.md           # Diseños UI/UX
```

## Pantallas de la Aplicación

| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Login | `login_screen.dart` | Autenticación con email/password |
| Dashboard | `home_screen.dart` | Resumen financiero, gráficos, alertas |
| Cámara | `camera_screen.dart` | Captura de factura (imagen/galería) |
| Confirmar | `confirm_screen.dart` | Revisión datos OCR, guardar factura |
| Proyectos | `projects_screen.dart` | Listado, filtros por estado, CRUD |
| Inventario | `inventory_screen.dart` | Equipo propio/rentado, alertas vencimiento |

## Características Principales

### Gestión de Proyectos
- Crear/editar proyectos audiovisuales
- Tracking de presupuesto vs facturado
- Estados: cotización → en progreso → entregado → facturado → pagado
- Filtros por estado y búsqueda

### Captura de Facturas con OCR
- Cámara o galería para capturar imagen
- Procesamiento con OpenAI GPT-4 Vision
- Extracción automática: monto, fecha, proveedor
- Asignación a proyecto y categoría de gasto

### Inventario de Equipo
- Equipo propio: depreciación, valor actual, ubicación
- Equipo rentado: proveedor, fechas, costo diario
- Alertas de vencimiento de renta
- Asignación a proyectos

### Dashboard Financiero
- Ingresos y gastos del mes
- Margen de ganancia
- Gráfico de gastos por categoría
- Proyectos activos
- Alertas de equipo por vencer

### Automatizaciones (n8n)
- OCR automático de facturas
- Alertas de renta próxima a vencer
- Seguimiento de pagos pendientes
- Notificaciones vía Telegram

## Comandos Útiles

### Flutter
```bash
# Ejecutar en desarrollo
flutter run -d chrome

# Build para producción
flutter build web --release

# Analizar código
flutter analyze

# Ejecutar tests
flutter test
```

### Docker
```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f frontend

# Detener servicios
docker-compose down

# Reconstruir imagen
docker-compose build --no-cache frontend
```

### Base de Datos
```bash
# Conectar a Supabase (vía psql o cliente)
# Tablas principales:
# - profiles
# - proyectos
# - facturas_gastos
# - inventario_equipo
# - ingresos
# - alertas_programadas
```

## Variables de Entorno

### Supabase (Flutter)
Configuradas en `lib/main.dart`:
```dart
url: 'https://db.yfktdnpcmdpjrdlhqrls.supabase.co'
anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### n8n (docker-compose.yml o Easypanel)
```
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<tu-contraseña>
TELEGRAM_BOT_TOKEN=<tu-token>
OPENAI_API_KEY=<tu-api-key>
```

## Deployment en Easypanel

1. Conectar repositorio Git en Easypanel
2. Configurar build: `saas_audiovisual/`
3. Puerto: `8080`
4. Variables de entorno desde `config/env.example`
5. Dominio: configurar en Cloudflare

## URLs del Proyecto

| Servicio | URL |
|----------|-----|
| Frontend (local) | `http://localhost:8080` |
| n8n | `https://n8nlocal.josevec.uk` |
| Supabase Dashboard | `https://supabase.com/dashboard` |
| Easypanel | Configurar según hosting |

## Troubleshooting

### Error de CORS en Supabase
- Verificar que el dominio está autorizado en Supabase Dashboard
- Agregar URL de producción en Authentication → URL Configuration

### n8n no accede a variables de entorno
- Configurar `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` o
- Hardcodear valores directamente en los nodos

### Flutter build falla
- Ejecutar `flutter clean && flutter pub get`
- Verificar versión de Flutter: `flutter --version`

## Documentación Adicional

- `docs/setup-guide.md` - Guía detallada de configuración
- `frontend/wireframes.md` - Wireframes y diseños UI
- `database/schema.sql` - Documentación inline del esquema

## License

Propietario: Juan José (JuanJo)
Proyecto: SaaS Financiero Freelancer Audiovisual
Fecha: Marzo 2026
