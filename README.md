# FINANCE PRO Web - Documentación Completa

Esta es la versión web completa de **FINANCE PRO**, una plataforma SaaS para la gestión financiera, proyectos, inventario y facturación destinada a profesionales freelance y pequeñas empresas.

---

## 📌 Resumen rápido
- **Autenticación**: Gestión de usuarios con Supabase (email/password, OAuth) y verificación de permisos.
- **Navegación**: Menú lateral y superior responsive con submenús colapsables, rutas protegidas y carga diferida.
- **Módulos principales**: Facturación, gastos, proyectos, inventario, alertas, agenda, propuestas y reportes.
- **Tecnologías**: React 18 + TypeScript + React Router + Framer Motion + Supabase + Lucide React.

---

## 🚀 Características disponibles

### 1. Autenticación y Control de Acceso
- **Gestión de sesión**: `AuthProvider` con `useAuth` hook.
- **MFA opcional**: Verificación de `must_change_password`.
- **Roles y niveles**: `nivel_acceso` (1 = admin, 2 = usuario estándar) y permisos por módulo.

### 2. Navegación y UI
- **Sidebar** con menús colapsables (`CollapsibleNavItem`) y sub‑menús móviles (`MobileSubMenu`).
- **Transiciones animadas** con `framer-motion`.
- **Navegación protegida**: Redirecciones automáticas según `canAccess` y `hasBillingAccess`.

### 3. Gestión Financiera
- **Facturación**: Creación, seguimiento y pago de facturas.
- **Gastos**: Clasificación de gastos (alquiler, equipamiento, software, etc.) con IVAs y estados de pago.
- **Métodos de pago**: Efectivo, transferencia, tarjeta de crédito/débito, depósito.
- **Alertas**: Notificaciones de vencimientos, rentas y mantenimientos (`Alerta`).

### 4. Gestión de Proyectos
- **Estados del proyecto**: `cotizacion`, `en_progreso`, `facturado`, `pagado`, `cancelado`.
- **Tipos de servicio**: `filmacion`, `edicion`, `produccion_completa`, etc.
- **Horas registradas**: `RegistroHora` para control de tiempos.

### 5. Inventario y Equipos
- **Equipos**: Registro de cámaras, lentes, iluminación, etc. con `TipoEquipo`, `CondicionEquipo`.
- **Ubicaciones**: `en_stock`, `en_proyecto`, `prestado`, etc.
- **Alertas de mantenimiento**: Notificaciones automáticas (`Alerta`).

### 6. Agenda y Tareas
- **Tareas**: `AgendaTarea` con prioridad (`baja`, `media`, `alta`) y fechas límite.
- **Propuestas**: `Propuesta` con cálculo de montos, ivas y estado (`pendiente`, `enviado`, `aceptado`).

### 7. Reportes y Estadísticas
- **Paneles**: `Reportes` y `PropuestaCreator` para generación de informes y propuestas comerciales.
- **Visualización de datos**: Pie charts, tablas y dashboards interactivos.

### 8. Integraciones y Herramientas
- **Supabase**: Base de datos y autenticación en tiempo real.
- **Lazy Loading**: Componentes importados dinámicamente para optimizar carga inicial.
- **Exportación PDF**: Utiliza `autoimpreso` y `generadorPdf` para generación de documentos.

---

## 📂 Tipos de datos principales (exportados en `sampleData.tsx`)

```ts
export type TipoServicio = 'filmacion' | 'edicion' | 'produccion_completa' | ...;
export type EstadoProyecto = 'cotizacion' | 'en_progreso' | 'entregado' | ...;
export type TipoGasto = 'equipamiento_compra' | 'alquiler_equipo' | ...;
export type MetodoPago = 'efectivo' | 'transferencia' | ...;
export interface Profile { /* ... */ }
export interface Proyecto { /* ... */ }
export interface RegistroHora { /* ... */ }
export interface FacturaGasto { /* ... */ }
export interface Equipo { /* ... */ }
export interface Alerta { /* ... */ }
export interface Ingreso { /* ... */ }
export interface Propuesta { /* ... */ }
export interface PropuestaItem { /* ... */ }
// ... y otros tipos auxiliares (CondicionEquipo, UbicacionEquipo, etc.)
```

> **Nota**: Todos los tipos están definidos en `src/data/sampleData.tsx` y se utilizan a lo largo del códigobase para validar y tipar datos.

---

## ⚙️ Configuración y Uso

1. **Instalar dependencias**  
   ```bash
   npm install
   ```

2. **Crear base de datos en Supabase**  
   - Configurar tablas: `profiles`, `proyectos`, `facturas_gastos`, `equipos`, etc.  
   - Copiar `.env.example` a `.env` y añadir las credenciales de Supabase.

3. **Iniciar la aplicación**  
   ```bash
   npm run dev
   ```

4. **Acceso**  
   - Navegar a `http://localhost:3000`.  
   - Iniciar sesión con correo y contraseña o mediante OAuth.

5. **Gestión de módulos**  
   - Los módulos están habilitados según `modulos_habilitados` y `facturacion_habilitada`.  
   - Los administradores pueden editar los permisos directamente en la base de datos.

---

## 🛠️ Contribuir

1. **Fork** el repositorio.  
2. Crear una rama para tu_feature (`git checkout -b feature/AutoBilling`).  
3. **Commit** tus cambios siguiendo el estilo de mensajes de commit del proyecto.  
4. **Push** a tu fork y abre un Pull Request.

> **Reglas de commit**:  
> - Utilizar mensajes claros y concisos.  
> - Firmar cada commit con `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` (configuración del repo).

---

## 📜 Licencia

Este proyecto está bajo licencia propietaria de **FINANCE PRO**. No se permite su distribución ni uso fuera del entorno autorizado sin permiso explícito del propietario.

---

## 📞 Contacto

- **Desarrollador**: José Verdun (joseverdun1@gmail.com)  
- **Documentación adicional**: Revisa los issues y la wiki del repositorio para tutoriales y ejemplos.

--- 

*Este README fue actualizado para reflejar todas las funcionalidades implementadas hasta la fecha (2026‑04‑07).* 