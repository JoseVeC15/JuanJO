# Almacén Digital (JuanJo) 🚀

Plataforma SaaS profesional diseñada para la gestión integral de freelancers y empresas del sector audiovisual. Permite administrar proyectos, flujos de caja, inventarios de equipos y procesamiento automatizado de facturas con IA avanzada.

## 🛠️ Stack Tecnológico

| Componente | Herramienta | Función |
|------------|-------------|---------|
| **Frontend** | Flutter Web 3.x | Aplicación web premium y responsiva |
| **Backend/DB** | Supabase | PostgreSQL, Autenticación y Storage |
| **Automatización** | n8n | Orquestación de flujos de trabajo (Workflows) |
| **Inteligencia Artificial** | OpenAI (GPT-4o-mini) | Extracción de datos fiscales mediante OCR avanzado |
| **Cloud Computing** | Google Cloud Platform | Servicios de infraestructura y People API |
| **Despliegue** | Vercel | Hosting de alta disponibilidad para el frontend |

## ✨ Características Principales

### 🧾 Procesamiento Inteligente de Facturas (OCR)
- **Extracción de Datos Fiscales**: Detección automática de RUC Proveedor, Número de Factura, Timbrado e IVA (5%, 10%, Exentas) de Paraguay.
- **Identificación Experta**: El sistema distingue inteligentemente entre Emisor y Comprador, evitando errores comunes en tickets térmicos.
- **Sugerencia de Concepto**: OCR optimizado que resume los items de la factura para facilitar el registro de gastos.

### 📊 Gestión de Proyectos y Finanzas
- **Seguimiento en Tiempo Real**: Visualización de estados (Cotización, Proceso, Entregado, Pagado).
- **Control de Gastos**: Registro automático vinculado a proyectos específicos.
- **Dashboard Premium**: Gráficos e indicadores de salud financiera (Ingresos vs. Gastos).

### 📦 Inventario y Alertas
- **Control de Equipos**: Gestión de equipos propios y rentados.
- **Alertas Automatizadas**: Notificaciones de vencimiento de rentas enviadas vía Telegram.

## 🚀 Instalación y Configuración

### 1. Requisitos
- [Flutter SDK](https://docs.flutter.dev/get-started/install)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (opcional para desarrollo)

### 2. Configuración del Entorno
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_ANON_KEY=tu_anon_key
GOOGLE_CLOUD_PROJECT=saas-491603
GOOGLE_APPLICATION_CREDENTIALS=config/service-account.json
```

### 3. Ejecución del Frontend
```bash
cd saas_audiovisual
flutter pub get
flutter run -d chrome
```

### 4. Configuración de n8n
- Importar el archivo `workflows/COMPLETO1.json` en tu instancia de n8n.
- Configurar las credenciales de OpenAI, Supabase y Telegram.
- Asegurar que el Webhook coincida con la URL configurada en el frontend.

## 📁 Estructura del Proyecto

```text
JuanJo/
├── saas_audiovisual/   # Aplicación Flutter (Frontend)
│   ├── lib/            # Código fuente (Screens, Services, Models)
│   └── build.sh        # Script de construcción para Vercel
├── database/           # Scripts SQL (Esquema, Datos, Limpieza)
├── config/             # Configuraciones de Google Cloud y Credenciales
├── workflows/          # Workflows exportados de n8n
└── .gitignore          # Archivos excluidos del control de versiones
```

## 🔐 Seguridad y Privacidad
- El proyecto utiliza **Google Service Accounts** para integraciones seguras.
- Se recomienda no subir archivos `.json` de credenciales ni secretos al repositorio público.
- Implementación de RLS (Row Level Security) en Supabase para proteger los datos de usuario.

---
**Desarrollado para:** Juan José (JuanJo)  
**Versión:** 2.0 (Marzo 2026)  
**Estado:** Producción / Estable  
