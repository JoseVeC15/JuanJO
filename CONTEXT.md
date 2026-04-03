# Contexto del Proyecto: FINANCE PRO

Este documento sirve como guía de referencia técnica y de negocio para entender el ecosistema de **Finance Pro**.

## 🎯 Objetivo del Sistema
Convertir la gestión financiera de un freelancer en un proceso autónomo, eficiente y libre de planillas externas. El sistema busca reducir el tiempo administrativo, mejorar la tasa de cobro y asegurar el cumplimiento fiscal (Paraguay/SET/SIFEN).

---

## 🛠️ Stack Tecnológico
- **Frontend**: 
  - **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
  - **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/)
  - **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
  - **Iconografía**: [Lucide React](https://lucide.dev/)
  - **Gráficos**: [Recharts](https://recharts.org/)
- **Backend (BaaS)**: 
  - **Plataforma**: [Supabase](https://supabase.com/)
  - **Base de Datos**: PostgreSQL con RLS (Row Level Security) para multi-tenancy.
  - **Autenticación**: Supabase Auth (Email/Password).
  - **Lógica de Servidor**: Supabase Edge Functions (Deno/Typescript).
- **Herramientas de Desarrollo**:
  - **Testing**: [Playwright](https://playwright.dev/) para E2E.
  - **Despliegue**: Preparado para [Vercel](https://vercel.com/).

---

## 🏗️ Mapa de Módulos (Arquitectura Frontend)

La aplicación utiliza un patrón de **Micro-frontends Monolíticos** en `src/components/`, cargados perezosamente (`React.lazy`) según el perfil del usuario.

### 1. Núcleo Financiero
- **Dashboard (`dashboard.tsx`)**: Resumen dinámico de salud financiera.
- **Analizador IA / Facturas (`facturas.tsx`)**: Gestión de comprobantes, clasificación de ingresos/gastos y soporte para OCR/IA.
- **SIFEN (`SifenInvoiceEmitter.tsx`)**: Motor de emisión de facturación electrónica nacional.

### 2. Fiscal & Auditoría
- **Asistente SET**: Validación de cumplimiento tributario.
- **Conciliación Bancaria**: Match entre movimientos de banco y registros internos.
- **Cierre Mensual (Wizard)**: Proceso guiado para finalizar períodos contables.

### 3. Gestión de Negocio
- **Centro de Cobros**: Seguimiento de estados de facturas (Enviada, Vista, Vencida).
- **Agenda & Disponibilidad**: Planificación operativa y carga de trabajo del freelancer.
- **Catálogo & Proyectos**: Gestión de servicios, productos y rentabilidad por cliente.

---

## 🗄️ Modelo de Datos y Backend
- **Migraciones**: Gestionadas en `supabase/migrations/`. 
- **Permisos**: Sistema granular basado en la tabla de perfiles y el campo `modulos_habilitados`.
- **Funciones Críticas**:
  - `sifen-engine`: Maneja la firma digital y comunicación SOAP con la SET.
  - `admin-manage-user`: Gestión centralizada de usuarios por administradores de nivel 1.

---

## 🚀 Guía de Desarrollo Rápido
1. **Instalación**: `npm install`
2. **Entorno Local**: `npm run dev`
3. **Variables de Entorno**: Configurar `.env` con las credenciales de Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. **Testing**: `npx playwright test`

---

## 📈 Roadmap y Fase Actual (Referencia)
- **Fase 1 (Actual)**: Foco en Flujo de Caja (Cobros, Agenda, Dashboard v1).
- **Fase 2**: Rentabilidad por proyecto, plantillas y conciliación automática.
- **Fase 3**: Cierre mensual asistido (Wizard) y autonomía total.

> [!IMPORTANT]
> **Filosofía de Código**: Priorizar componentes modulares, tipado estricto con TypeScript y uso de Hooks personalizados (como `useSupabaseData`) para separar la lógica de negocio de la visualización.
