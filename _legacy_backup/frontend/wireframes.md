# Wireframes Frontend - SaaS Financiero Freelancer Audiovisual

## 1. Home/Dashboard

### Layout Mobile (375x812)

```
┌─────────────────────────────────────┐
│  👤 Juan Pérez              🔔 3   │
│  "Freelancer Audiovisual"          │
├─────────────────────────────────────┤
│  Resumen del Mes                   │
│  ┌─────────┐ ┌─────────┐          │
│  │ $25,400 │ │ $8,200  │          │
│  │ Ingresos│ │ Gastos  │          │
│  └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐          │
│  │  68%    │ │   4     │          │
│  │ Margen  │ │Proyectos│          │
│  └─────────┘ └─────────┘          │
├─────────────────────────────────────┤
│  Alertas (3)                        │
│  🔴 Equipo rentado vence HOY       │
│  🟠 Pago pendiente 45 días         │
│  🟡 Proyecto sin facturar          │
├─────────────────────────────────────┤
│  Proyectos Activos                  │
│  ┌──────────────────────────────┐  │
│  │ 🎬 Cliente ABC               │  │
│  │ Edición • 60% completado     │  │
│  │ $15,000 / $25,000           │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 📸 Cliente XYZ               │  │
│  │ Fotografía • 30% completado │  │
│  │ $4,500 / $15,000            │  │
│  └──────────────────────────────┘  │
├─────────────────────────────────────┤
│  📸  🎯  📦  📊  👤              │
│  Captura  Proy  Equipo  Repo  Perf │
└─────────────────────────────────────┘
```

### Componentes Clave:
- **Cards de Resumen**: Grid 2x2 con métricas del mes
- **Alertas**: Lista con colores (rojo/naranja/amarillo)
- **Proyectos**: Cards con barra de progreso
- **Floating Action Button**: Botón grande para nueva factura
- **Bottom Navigation**: 5 tabs principales

---

## 2. Captura de Factura (Flujo Estrella)

### Pantalla 1: Cámara/Galería
```
┌─────────────────────────────────────┐
│  ← Nueva Factura                    │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────────────────────────┐  │
│    │                             │  │
│    │      📷 Vista Cámara        │  │
│    │                             │  │
│    │      ┌─────────────────┐   │  │
│    │      │   FACTURA       │   │  │
│    │      │   $1,500.00     │   │  │
│    │      │   Empresa ABC   │   │  │
│    │      └─────────────────┘   │  │
│    │                             │  │
│    └─────────────────────────────┘  │
│                                     │
│  [📸 Tomar Foto]    [🖼️ Galería]    │
│                                     │
│  Tips:                              │
│  • Asegura buena iluminación        │
│  • Enfoca el total de la factura    │
│  • Incluye fecha y proveedor        │
└─────────────────────────────────────┘
```

### Pantalla 2: Procesando
```
┌─────────────────────────────────────┐
│  ← Nueva Factura                    │
├─────────────────────────────────────┤
│                                     │
│         ┌─────────────────┐        │
│         │   ⏳ Procesando  │        │
│         │                  │        │
│         │  ┌────────────┐ │        │
│         │  │            │ │        │
│         │  │   Factura  │ │        │
│         │  │   imagen   │ │        │
│         │  │            │ │        │
│         │  └────────────┘ │        │
│         └─────────────────┘        │
│                                     │
│    🔍 Extrayendo datos...          │
│    📝 Reconociendo texto...        │
│    💰 Identificando montos...      │
│    📅 Detectando fechas...         │
│                                     │
│    ████████████░░░░░░ 75%          │
│                                     │
└─────────────────────────────────────┘
```

### Pantalla 3: Confirmación
```
┌─────────────────────────────────────┐
│  ← Confirmar Factura        Guardar│
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐ Monto detectado:     │
│  │ Factura  │ $1,500.00            │
│  │ Preview  │ [✏️ Editar]          │
│  └──────────┘                      │
│                                     │
│  Monto: [ $1,500.00 ] $           │
│  Fecha: [ 15/03/2026 ] 📅          │
│  Proveedor: [ Empresa ABC ]        │
│                                     │
│  Tipo de gasto: [▼ Alimentación]   │
│  ├─ Equipamiento compra            │
│  ├─ Alquiler equipo                │
│  ├─ Transporte                     │
│  ├─ Alimentación                   │
│  ├─ Software/Licencias             │
│  └─ Otros                          │
│                                     │
│  ¿A qué proyecto? [▼ Sin proyecto] │
│  ├─ Cliente ABC - Edición          │
│  ├─ Cliente XYZ - Fotografía       │
│  └─ Sin proyecto                   │
│                                     │
│  Deducible: [✓] Sí                 │
│  Método pago: [▼ Efectivo]         │
│  Notas: [___________________]      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │       💾 Guardar Factura      │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 3. Proyectos - Listado

```
┌─────────────────────────────────────┐
│  Proyectos              [+ Nuevo]   │
├─────────────────────────────────────┤
│  Todos | En progreso | Por facturar│
│              | Pagados              │
├─────────────────────────────────────┤
│  🔍 Buscar proyecto...             │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ 🎬 Cliente ABC               │  │
│  │ Edición de video             │  │
│  │ 15 Mar - 30 Mar 2026         │  │
│  │                              │  │
│  │ Progreso: ████████░░ 80%     │  │
│  │ $20,000 / $25,000           │  │
│  │                              │  │
│  │ Estado: En progreso 🟢       │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 📸 Cliente XYZ               │  │
│  │ Fotografía de producto       │  │
│  │ 10 Mar - 20 Mar 2026         │  │
│  │                              │  │
│  │ Progreso: ████░░░░░░ 40%     │  │
│  │ $6,000 / $15,000            │  │
│  │                              │  │
│  │ Estado: Por facturar 🟡      │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 🎥 Cliente DEF               │  │
│  │ Producción completa          │  │
│  │ 01 Feb - 28 Feb 2026         │  │
│  │                              │  │
│  │ Progreso: ████████████ 100%  │  │
│  │ $50,000 / $50,000           │  │
│  │                              │  │
│  │ Estado: Pagado ✅            │  │
│  └──────────────────────────────┘  │
├─────────────────────────────────────┤
│  📸  🎯  📦  📊  👤              │
└─────────────────────────────────────┘
```

---

## 4. Detalle de Proyecto

### Pestaña: Información General
```
┌─────────────────────────────────────┐
│  ← Cliente ABC              [✏️]   │
├─────────────────────────────────────┤
│  Tipo: Edición de video            │
│  Cliente: Cliente ABC              │
│  Descripción: Edición de video     │
│  promocional para campaña...       │
│                                     │
│  Fechas:                            │
│  Inicio: 15 Mar 2026               │
│  Entrega: 30 Mar 2026              │
│                                     │
│  Presupuesto: $25,000.00           │
│  Facturado: $20,000.00             │
│  Pendiente: $5,000.00              │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  📊 Ver Finanzas del Proyecto │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  📦 Ver Equipo Asignado       │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  📄 Ver Facturas Vinculadas   │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Pestaña: Finanzas
```
┌─────────────────────────────────────┐
│  Finanzas del Proyecto              │
├─────────────────────────────────────┤
│  Resumen:                           │
│  ┌──────────────────────────────┐  │
│  │ Ingresos:       +$20,000.00 │  │
│  │ Gastos:         - $8,500.00 │  │
│  │ ─────────────────────────── │  │
│  │ Margen Bruto:    $11,500.00 │  │
│  │ Margen:             46%     │  │
│  └──────────────────────────────┘  │
│                                     │
│  Gastos por Categoría:             │
│  ┌──────────────────────────────┐  │
│  │ 🎬 Equipamiento    $3,000   │  │
│  │ ████████████░░░░░ 35%       │  │
│  │                              │  │
│  │ 🍕 Alimentación    $2,500   │  │
│  │ ████████░░░░░░░░░ 29%       │  │
│  │                              │  │
│  │ 🚗 Transporte      $2,000   │  │
│  │ ██████░░░░░░░░░░░ 24%       │  │
│  │                              │  │
│  │ 🎯 Otros           $1,000   │  │
│  │ ███░░░░░░░░░░░░░░ 12%       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Pestaña: Equipo Utilizado
```
┌─────────────────────────────────────┐
│  Equipo Asignado al Proyecto        │
├─────────────────────────────────────┤
│  [+ Asignar Equipo]                 │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 📷 Canon EOS R5              │  │
│  │ Propio • 15-30 Mar           │  │
│  │ 15 días × $27.78 = $416.70  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 💡 Aputure 300D              │  │
│  │ Rentado • 15-30 Mar          │  │
│  │ 15 días × $50.00 = $750.00  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 🎤 Rode NTG5                │  │
│  │ Propio • 15-30 Mar           │  │
│  │ 15 días × $8.33 = $125.00   │  │
│  └──────────────────────────────┘  │
│                                     │
│  Total costo equipo: $1,291.70     │
└─────────────────────────────────────┘
```

---

## 5. Inventario de Equipo

### Tabs: Mi Equipo | Rentados

#### Vista "Mi Equipo" (PROPIO)
```
┌─────────────────────────────────────┐
│  Mi Equipo                     [+]  │
├─────────────────────────────────────┤
│  [Mi Equipo] | [Rentados]          │
│  ┌──────────────────────────────┐  │
│  │ 🟢 Disponible     🔍 Filtrar │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [📷] Canon EOS R5            │  │
│  │ Cámara • Buen estado         │  │
│  │ Compra: $35,000 - 2 años     │  │
│  │ Depreciado: $11,667          │  │
│  │ Valor actual: $23,333        │  │
│  │ Ubicación: En stock          │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ [💡] Aputure 300D            │  │
│  │ Iluminación • Buen estado    │  │
│  │ Compra: $8,000 - 1 año       │  │
│  │ Depreciado: $1,600           │  │
│  │ Valor actual: $6,400         │  │
│  │ Ubicación: En proyecto       │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ [🎤] Rode NTG5               │  │
│  │ Audio • Nuevo                │  │
│  │ Compra: $3,000 - 6 meses     │  │
│  │ Depreciado: $300             │  │
│  │ Valor actual: $2,700         │  │
│  │ Ubicación: En stock          │  │
│  └──────────────────────────────┘  │
│                                     │
│  Valor total inventario: $32,433   │
└─────────────────────────────────────┘
```

#### Vista "Rentados" (RENTADO)
```
┌─────────────────────────────────────┐
│  Equipo Rentado                     │
├─────────────────────────────────────┤
│  [Mi Equipo] | [Rentados]          │
│                                     │
│  Hoy: 22 Mar 2026                  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 🔴 VENCE HOY                │  │
│  │ [📷] Sony FX6                │  │
│  │ Proveedor: CineRent MX       │  │
│  │ 15-22 Mar • $600.00          │  │
│  │ [📱 Llamar] [✅ Devuelto]    │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 🟠 VENCE MAÑANA             │  │
│  │ [🎬] DJI Ronin 4D            │  │
│  │ Proveedor: DroneRent         │  │
│  │ 16-23 Mar • $450.00          │  │
│  │ [📱 Recordar]                │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 🟢 3 días restantes          │  │
│  │ [🎤] Shure SM7B             │  │
│  │ Proveedor: AudioPro          │  │
│  │ 20-30 Mar • $180.00          │  │
│  └──────────────────────────────┘  │
│                                     │
│  Total renta del mes: $1,230.00    │
└─────────────────────────────────────┘
```

---

## 6. Asignar Equipo a Proyecto

### Paso 1: Seleccionar Proyecto
```
┌─────────────────────────────────────┐
│  ← Asignar Equipo           Siguiente│
├─────────────────────────────────────┤
│  Paso 1 de 4                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Selecciona el proyecto:            │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [✓] Cliente ABC - Edición    │  │
│  │     15-30 Mar 2026           │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ [ ] Cliente XYZ - Foto       │  │
│  │     10-20 Mar 2026           │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ [ ] Cliente DEF - Producción │  │
│  │     01-28 Feb 2026           │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Paso 2: Seleccionar Equipo
```
┌─────────────────────────────────────┐
│  ← Seleccionar Equipo  Siguiente    │
├─────────────────────────────────────┤
│  Paso 2 de 4                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Para: Cliente ABC (15-30 Mar)     │
│                                     │
│  Filtros:                           │
│  Tipo: [▼ Todos]  Estado: [▼ ✅]   │
│                                     │
│  Equipo disponible:                 │
│  ┌──────────────────────────────┐  │
│  │ [✓] Canon EOS R5             │  │
│  │     Cámara • En stock         │  │
│  │     $27.78/día (PROPIO)      │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ [ ] Sony A7S III             │  │
│  │     Cámara • En stock         │  │
│  │     $40.00/día (PROPIO)      │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ [ ] Aputure 300D             │  │
│  │     Iluminación • En proyecto │  │
│  │     $50.00/día (PROPIO)      │  │
│  └──────────────────────────────┘  │
│                                     │
│  Total seleccionados: 1 equipo     │
└─────────────────────────────────────┘
```

### Paso 3: Fechas de Uso
```
┌─────────────────────────────────────┐
│  ← Fechas de Uso            Siguiente│
├─────────────────────────────────────┤
│  Paso 3 de 4                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Canon EOS R5 para Cliente ABC     │
│                                     │
│  Fechas del proyecto: 15-30 Mar    │
│                                     │
│  Fecha inicio: [ 15/03/2026 ] 📅   │
│  Fecha fin:    [ 30/03/2026 ] 📅   │
│                                     │
│  [ ] Usar mismas fechas que proyecto│
│                                     │
│  Duración: 16 días                 │
│  Costo PROPIO: 16 × $27.78        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │         💰 Calcular Costo     │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Paso 4: Confirmación
```
┌─────────────────────────────────────┐
│  ← Confirmar              Asignar   │
├─────────────────────────────────────┤
│  Paso 4 de 4                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Resumen de asignación:             │
│                                     │
│  Proyecto: Cliente ABC - Edición   │
│  Equipo: Canon EOS R5              │
│  Tipo: PROPIO (depreciación)       │
│                                     │
│  Fechas: 15-30 Mar 2026           │
│  Duración: 16 días                 │
│                                     │
│  Costo:                            │
│  Depreciación mensual: $833.33     │
│  Por día: $27.78                   │
│  Total: 16 × $27.78 = $444.48     │
│                                     │
│  Este costo se imputará al         │
│  proyecto para cálculo de margen.  │
│                                     │
│  [✅ Confirmar Asignación]         │
└─────────────────────────────────────┘
```

---

## 7. Reportes

```
┌─────────────────────────────────────┐
│  📊 Reportes Financieros            │
├─────────────────────────────────────┤
│  Período: [▼ Este mes]              │
│  ├─ Este mes                        │
│  ├─ Mes anterior                    │
│  ├─ Últimos 3 meses                │
│  ├─ Año actual                      │
│  └─ Personalizado...                │
│                                     │
│  Resumen (Mar 2026):               │
│  ┌──────────────────────────────┐  │
│  │ Ingresos:       $25,400.00  │  │
│  │ Gastos:         $ 8,200.00  │  │
│  │ Utilidad:       $17,200.00  │  │
│  │ Margen:            67.7%    │  │
│  └──────────────────────────────┘  │
│                                     │
│  Gastos Deducibles:                │
│  ┌──────────────────────────────┐  │
│  │ Equipamiento    $3,200      │  │
│  │ Transporte      $1,800      │  │
│  │ Alimentación    $1,500      │  │
│  │ Software        $  700      │  │
│  │ Otros           $1,000      │  │
│  │ ────────────────────────    │  │
│  │ Total deducible $8,200      │  │
│  └──────────────────────────────┘  │
│                                     │
│  Acciones:                          │
│  ┌───────────────────────────────┐ │
│  │  📄 Exportar PDF Resumen      │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  📊 Exportar CSV Detallado    │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  📧 Enviar a Contador        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Implementación en Flutter

### Estructura de Archivos Flutter:

```
saas_audiovisual/lib/
├── main.dart                 # Entry point con rutas
├── services/
│   └── supabase_service.dart # Todas las operaciones DB
└── screens/
    ├── login_screen.dart     # Login/Registro
    ├── home_screen.dart      # Dashboard principal
    ├── camera_screen.dart    # Captura de factura
    ├── confirm_screen.dart   # Confirmación OCR
    ├── projects_screen.dart  # Listado de proyectos
    └── inventory_screen.dart # Inventario de equipo
```

### Modelos de Datos (Supabase Tables):

| Tabla | Usada en | Descripción |
|-------|----------|-------------|
| profiles | LoginScreen | Perfil extendido de usuario |
| proyectos | ProjectsScreen | Proyectos audiovisuales |
| facturas_gastos | ConfirmScreen | Facturas con OCR |
| inventario_equipo | InventoryScreen | Equipo propio y rentado |
| ingresos | HomeScreen | Pagos recibidos |

### Servicios Implementados (supabase_service.dart):

```dart
// Auth
signIn(email, password)
signUp(email, password, fullName)
signOut()

// Proyectos
getProjects(estado)
insertProject(data)
updateProject(id, data)

// Facturas/Gastos
getExpenses(proyectoId)
insertExpense(data)

// Inventario
getEquipment(tipoPropiedad)
insertEquipment(data)

// Dashboard
getDashboardStats()
getExpensesByCategory()
```

### Configuración de Conexión Supabase:

```dart
// main.dart
await Supabase.initialize(
  url: 'https://db.yfktdnpcmdpjrdlhqrls.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
);
```

### Campos de Conexión Supabase:

```yaml
# Configuración de tablas en Bubble
Profiles:
  Table: profiles
  Fields:
    - nombre_completo (text)
    - telefono (text)
    - rfc (text)
    - created_at (date)

Proyectos:
  Table: proyectos
  Fields:
    - nombre_cliente (text)
    - tipo_servicio (enum)
    - estado (enum)
    - monto_presupuestado (number)
    - monto_facturado (number)
    - fecha_inicio (date)
    - fecha_entrega (date)

Facturas_Gastos:
  Table: facturas_gastos
  Fields:
    - monto (number)
    - proveedor (text)
    - tipo_gasto (enum)
    - estado (enum)
    - fecha_factura (date)
    - imagen_url (text)
    - concepto_ocr (text)

Inventario_Equipo:
  Table: inventario_equipo
  Fields:
    - nombre (text)
    - tipo (enum)
    - tipo_propiedad (enum)
    - condicion (enum)
    - ubicacion (enum)
    - costo_compra (number)
    - costo_renta_dia (number)
    - fecha_fin_renta (date)

Ingresos:
  Table: ingresos
  Fields:
    - cliente (text)
    - monto (number)
    - estado (enum)
    - fecha_emision (date)
    - fecha_pago_real (date)
```

### Flujos de Usuario:

1. **Flujo OCR Factura**:
   - Cámara → Preview → Webhook n8n → Respuesta OCR → Confirmación → Guardar

2. **Flujo Asignación Equipo**:
   - Seleccionar proyecto → Filtrar equipo → Definir fechas → Calcular costo → Confirmar

3. **Flujo Reportes**:
   - Seleccionar período → Generar datos → Preview → Exportar