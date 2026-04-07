// ============================================================
// SERVICE CATALOG — Finance SaaS Paraguay
//
// Fuente única de verdad para configuración por tipo de servicio.
// Toda la lógica de negocio compartida vive en FINANCIAL_CORE.
// Cada perfil hereda el núcleo y solo configura sus diferencias.
//
// DB: al agregar un ServiceType nuevo, actualizar también:
//   supabase/migrations/202604070002_add_service_type_profiles.sql
//   → constraint profiles_service_type_check
// ============================================================

import type {
  BusinessArchitecturePreset,
  FullServiceConfig,
  ServiceModuleKey,
  DashboardWidgetKey,
  KPIConfig,
  ReportPresetKey,
  ServiceType,
  ServiceProfileConfig,
} from '../types/service';
import { BUSINESS_ARCHITECTURE } from './businessArchitecture';
import { getModuleLabel } from './moduleCatalog';

// ============================================================
// NÚCLEO FINANCIERO COMPARTIDO
// Se reutiliza en todos los perfiles — no duplicar aquí.
// ============================================================

const CORE_MODULOS: ServiceModuleKey[] = [
  'dashboard', 'gastos', 'ingresos', 'cobros', 'reportes', 'settings',
];

const CORE_DASHBOARD: DashboardWidgetKey[] = [
  'ingresos_cobrados', 'egresos_registrados', 'balance_neto', 'cuentas_por_cobrar',
];

const CORE_KPIS: KPIConfig[] = [
  {
    key: 'ingresos_cobrados',
    label: 'Ingresos Cobrados',
    formato: 'guaranies',
    visible: true,
    destacado: true,
    tooltip: 'Total efectivamente cobrado en el período.',
  },
  {
    key: 'egresos_registrados',
    label: 'Egresos Registrados',
    formato: 'guaranies',
    visible: true,
    destacado: true,
    tooltip: 'Suma de gastos documentados en el período.',
  },
  {
    key: 'balance_neto',
    label: 'Balance Neto',
    formato: 'guaranies',
    visible: true,
    destacado: true,
    tooltip: 'Ingresos cobrados menos egresos registrados.',
  },
  {
    key: 'cuentas_por_cobrar',
    label: 'Cuentas por Cobrar',
    formato: 'guaranies',
    visible: true,
    tooltip: 'Total facturado aún no cobrado.',
  },
];

const CORE_EGRESOS: string[] = [
  'transporte', 'alimentacion', 'software_licencias', 'capacitacion', 'impuestos', 'otros',
];

const CORE_REPORTES: ReportPresetKey[] = ['resumen_simple'];

// --------------- Helpers de composición ---------------

/** Merge módulos del núcleo con los específicos del perfil (sin duplicados). */
function withModulos(...extra: ServiceModuleKey[][]): ServiceModuleKey[] {
  return Array.from(new Set([...CORE_MODULOS, ...extra.flat()]));
}

/** KPIs del núcleo más los específicos (sin duplicar claves). */
function withKPIs(...extra: KPIConfig[]): KPIConfig[] {
  const coreKeys = new Set(CORE_KPIS.map(k => k.key));
  return [...CORE_KPIS, ...extra.filter(e => !coreKeys.has(e.key))];
}

/** Reportes del núcleo más los específicos (sin duplicados). */
function withReportes(...extra: ReportPresetKey[]): ReportPresetKey[] {
  return Array.from(new Set([...CORE_REPORTES, ...extra]));
}

/** Categorías de egreso del núcleo más las específicas. */
function withEgresos(...extra: string[]): string[] {
  return Array.from(new Set([...CORE_EGRESOS, ...extra]));
}

export const SERVICE_TYPE_ALIASES: Record<string, ServiceType> = {
  comercio: 'comercio_minorista',
  sifen: 'sifen_empresarial',
  logistica: 'distribucion_flota',
};

export const SELECTABLE_SERVICE_TYPES: ServiceType[] = [
  'freelancer',
  'servicios_profesionales',
  'sifen_empresarial',
  'autofactura_guiada',
  'distribucion_flota',
  'comercio_minorista',
  'multiempresa',
  'audiovisual',
  'salud',
  'educacion',
];

// ============================================================
// CATÁLOGO POR TIPO DE SERVICIO
// ============================================================

export const SERVICE_CATALOG: Record<ServiceType, FullServiceConfig> = {

  // 1 ─── DISTRIBUCIÓN FLOTA ─────────────────────────────────
  distribucion_flota: {
    id: 'distribucion_flota',
    nombre: 'Distribución y Flota',
    descripcion: 'Operadores que gestionan flotas de vehículos, viajes y costos por ruta.',
    audiencia_objetivo: 'Distribuidores con vehículos propios o alquilados.',
    modulos_clave: ['vehículos', 'rutas', 'combustible', 'mantenimiento', 'alquileres', 'costo por unidad'],
    visible_en_selector: true,
    modulos_habilitados: withModulos(['agenda', 'proyectos', 'inventario', 'conciliacion', 'cierre']),
    dashboard_default: [...CORE_DASHBOARD, 'flujo_financiero'],
    kpis_visibles: withKPIs(
      { key: 'costo_por_km', label: 'Costo por KM', formato: 'guaranies', visible: true, tooltip: 'Gasto operativo dividido por kilómetros recorridos.' },
      { key: 'flota_activa', label: 'Vehículos Activos', formato: 'numero', visible: true, destacado: true },
      { key: 'mantenimiento_pendiente', label: 'Mantenimientos Pendientes', formato: 'numero', visible: true },
    ),
    reportes_habilitados: withReportes('operativo_logistico', 'flota_operativa'),
    categorias_ingresos: [
      'flete_nacional', 'flete_internacional', 'carga_consolidada',
      'servicio_urgente', 'almacenaje', 'otro_ingreso',
    ],
    categorias_egresos: withEgresos(
      'combustible', 'peaje', 'mantenimiento_vehiculo', 'seguro_vehicular',
      'neumaticos', 'chofer_subcontratado', 'alquiler_equipo_pesado',
    ),
    campos_extra_por_formulario: {
      proyecto: [
        { key: 'vehiculo_id',   label: 'Vehículo Asignado', tipo: 'select',   requerido: true },
        { key: 'origen',        label: 'Punto de Origen',   tipo: 'text',     requerido: true },
        { key: 'destino',       label: 'Punto de Destino',  tipo: 'text',     requerido: true },
        { key: 'km_recorridos', label: 'KM Recorridos',     tipo: 'number' },
        { key: 'carga_kg',      label: 'Carga (kg)',        tipo: 'number' },
      ],
      egreso: [
        { key: 'vehiculo_id', label: 'Vehículo',  tipo: 'select' },
        { key: 'km_actual',   label: 'KM Actual', tipo: 'number' },
      ],
    },
    labels_personalizados: {
      proyectos: 'VIAJES Y RUTAS',
      inventario: 'MI FLOTA',
      ingresos:   'INGRESOS POR FLETE',
      gastos:     'COSTOS OPERATIVOS',
      cobros:     'COBROS DE FLETES',
    },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['agenda', 'proyectos', 'inventario', 'conciliacion', 'cierre', 'sifen', 'clientes', 'set', 'admin']),
        facturacion_habilitada: true,
        notas: 'Acceso completo. SIFEN habilitado para emitir facturas de flete.',
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['agenda', 'proyectos', 'inventario']),
        facturacion_habilitada: false,
        notas: 'Operador de ruta: registra viajes y costos sin acceso fiscal.',
      },
    },
    onboarding: [
      { key: 'proyectos',  title: 'Registrar Viaje',   description: 'Carga un nuevo viaje con vehículo, ruta e ingresos esperados.', path: '/proyectos',      moduleKey: 'proyectos' },
      { key: 'inventario', title: 'Configurar Flota',  description: 'Agrega tus vehículos con costos y estado operativo.',          path: '/activos',        moduleKey: 'inventario' },
      { key: 'cobros',     title: 'Cobros de Flete',   description: 'Gestiona pagos pendientes de clientes de transporte.',        path: '/centro-cobros',  moduleKey: 'cobros' },
    ],
    tips: [
      'Carga el combustible por vehículo: el sistema calculará el costo real por KM recorrido.',
      'El IVA de combustible e insumos de transporte es crédito fiscal deducible.',
      'Usa el módulo de proyectos para cada viaje individual y asigna sus costos directos.',
      'El cierre mensual genera el resumen fiscal listo para el formulario 120 del SET.',
    ],
  },

  // 2 ─── FREELANCER ─────────────────────────────────────────
  freelancer: {
    id: 'freelancer',
    nombre: 'Freelancer Servicios',
    descripcion: 'Profesionales independientes con control financiero simple y orientado a cobros e impuestos.',
    audiencia_objetivo: 'Independientes y profesionales.',
    modulos_clave: ['ingresos', 'gastos', 'cobros pendientes', 'IA', 'impuestos estimados'],
    visible_en_selector: true,
    modulos_habilitados: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda']),
    dashboard_default: [...CORE_DASHBOARD, 'iva_estimado', 'sugerencias'],
    kpis_visibles: withKPIs(
      { key: 'iva_estimado',    label: 'IVA Estimado',     formato: 'guaranies',  visible: true,  tooltip: 'Estimación de IVA a pagar al SET este período.' },
      { key: 'margen_bruto',   label: 'Margen Bruto',     formato: 'porcentaje', visible: true },
      { key: 'horas_facturadas', label: 'Horas Facturadas', formato: 'numero',   visible: false },
    ),
    reportes_habilitados: withReportes('fiscal_iva'),
    categorias_ingresos: [
      'honorarios', 'contrato_proyecto', 'consultoria',
      'capacitacion_dictada', 'trabajo_eventual', 'otro_ingreso',
    ],
    categorias_egresos: withEgresos('equipo_profesional', 'marketing_personal', 'coworking', 'suscripciones'),
    campos_extra_por_formulario: {
      ingreso: [
        { key: 'horas_trabajadas',   label: 'Horas Trabajadas',      tipo: 'number' },
        { key: 'tarifa_hora',        label: 'Tarifa por Hora (Gs)',   tipo: 'number' },
        { key: 'referencia_proyecto', label: 'Referencia de Proyecto', tipo: 'text' },
      ],
    },
    labels_personalizados: {
      analizador: 'FREELANCER IA',
      gestion:    'AUTOFACTURA GUIADA',
      reportes:   'ANÁLISIS',
      gastos:     'MIS GASTOS',
      ingresos:   'MIS COBROS',
    },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda', 'sifen', 'clientes', 'set', 'conciliacion', 'cierre']),
        facturacion_habilitada: true,
        notas: 'Freelancer con SIFEN habilitado para emitir facturas electrónicas.',
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda']),
        facturacion_habilitada: false,
        notas: 'Control de ingresos, gastos y cobros sin módulo fiscal.',
      },
    },
    onboarding: [
      { key: 'sifen',  title: 'Perfil Fiscal',      description: 'Configura tu RUC y timbrado para emitir facturas electrónicas.', path: '/sifen',             moduleKey: 'sifen' },
      { key: 'gastos', title: 'Cargar Egresos',     description: 'Sube tus facturas de gastos con OCR automático.',                path: '/analizador-ia/gastos', moduleKey: 'gastos' },
      { key: 'cobros', title: 'Cobros Pendientes',  description: 'Visualiza y gestiona cuánto te deben hoy.',                      path: '/centro-cobros',    moduleKey: 'cobros' },
    ],
    tips: [
      'Registra todos tus gastos deducibles para reducir el IVA a pagar cada mes.',
      'El módulo SIFEN se activa con facturación habilitada en tu cuenta.',
      'Configura tu RUC y timbrado en Config → Facturación antes de emitir documentos.',
      'Usa la agenda para no perder vencimientos del formulario 120 del SET.',
    ],
  },

  // 3 ─── SIFEN (perfil orientado a emisión electrónica DNIT) ─
  sifen_empresarial: {
    id: 'sifen_empresarial',
    nombre: 'SIFEN Empresarial',
    descripcion: 'Empresas cuyo eje es la emisión de documentos electrónicos DNIT con gestión fiscal completa.',
    audiencia_objetivo: 'Empresas que emiten electrónicamente en Paraguay.',
    modulos_clave: ['facturación electrónica', 'estados DTE', 'validación', 'historial tributario'],
    visible_en_selector: true,
    modulos_habilitados: withModulos(['sifen', 'clientes', 'set', 'conciliacion', 'cierre', 'analizador-ia']),
    dashboard_default: [...CORE_DASHBOARD, 'iva_estimado', 'flujo_financiero'],
    kpis_visibles: withKPIs(
      { key: 'facturas_emitidas',  label: 'Facturas Emitidas',   formato: 'numero',    visible: true, destacado: true },
      { key: 'facturas_aprobadas', label: 'Aprobadas DNIT',      formato: 'numero',    visible: true },
      { key: 'iva_debito',         label: 'IVA Débito (Ventas)', formato: 'guaranies', visible: true },
      { key: 'iva_credito',        label: 'IVA Crédito (Compras)', formato: 'guaranies', visible: true },
      { key: 'iva_a_pagar',        label: 'IVA Neto a Pagar',   formato: 'guaranies', visible: true, destacado: true, tooltip: 'Débito fiscal menos crédito fiscal del período.' },
    ),
    reportes_habilitados: withReportes('fiscal_iva'),
    categorias_ingresos: [
      'venta_producto', 'venta_servicio', 'exportacion', 'anticipo', 'reversion_nota_credito',
    ],
    categorias_egresos: withEgresos('materia_prima', 'insumos_productivos', 'servicios_contratados', 'logistica_compra'),
    campos_extra_por_formulario: {
      documento: [
        { key: 'cdc',              label: 'CDC (Código de Control)',   tipo: 'text',   requerido: true },
        { key: 'tipo_documento',   label: 'Tipo de Documento',         tipo: 'select', requerido: true, opciones: ['factura_electronica', 'nota_credito', 'nota_debito', 'autofactura', 'nota_remision'] },
        { key: 'condicion_venta',  label: 'Condición de Venta',        tipo: 'select', requerido: true, opciones: ['contado', 'credito'] },
      ],
      ingreso: [
        { key: 'numero_factura_electronica', label: 'N° Factura Electrónica', tipo: 'text' },
        { key: 'estado_sifen',               label: 'Estado SIFEN',            tipo: 'select', opciones: ['pendiente', 'aprobado', 'rechazado', 'anulado'] },
      ],
    },
    labels_personalizados: {
      ingresos: 'FACTURAS EMITIDAS',
      gastos:   'FACTURAS RECIBIDAS',
      clientes: 'RECEPTORES',
      cobros:   'CUENTAS POR COBRAR',
    },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['sifen', 'clientes', 'set', 'conciliacion', 'cierre', 'analizador-ia', 'admin']),
        facturacion_habilitada: true,
        notas: 'Acceso total: configuración SIFEN, ambiente prod/test y certificados digitales.',
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['sifen', 'clientes', 'analizador-ia']),
        facturacion_habilitada: true,
        notas: 'Puede emitir documentos, no accede a conciliación ni cierre.',
      },
    },
    onboarding: [
      { key: 'settings', title: 'Configurar SIFEN',    description: 'RUC, timbrado, CSC y ambiente de emisión DNIT.',       path: '/config',        moduleKey: 'sifen' },
      { key: 'clientes', title: 'Cargar Receptores',   description: 'Directorio de clientes con RUC para emisión rápida.',  path: '/sifen',         moduleKey: 'clientes' },
      { key: 'set',      title: 'Asistente SET',       description: 'Liquidación de IVA y control del formulario 120.',     path: '/asistente-set', moduleKey: 'set' },
    ],
    tips: [
      'Verifica que el CSC y el timbrado estén activos en el portal DNIT antes de emitir en producción.',
      'Los documentos rechazados deben ser anulados y re-emitidos; nunca editados directamente.',
      'El ambiente TEST no genera obligaciones fiscales; úsalo para validar el flujo completo.',
      'El formulario 120 se genera con datos de débito y crédito fiscal del período cerrado.',
    ],
  },

  // 4 ─── AUTOFACTURA GUIADA ─────────────────────────────────
  autofactura_guiada: {
    id: 'autofactura_guiada',
    nombre: 'Autofactura Guiada',
    descripcion: 'Flujo restringido y asistido para emitir autofacturas con validación previa y respaldo documental obligatorio.',
    modulos_habilitados: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda']),
    dashboard_default: [...CORE_DASHBOARD, 'iva_estimado'],
    kpis_visibles: withKPIs(
      { key: 'autofacturas_emitidas', label: 'Autofacturas Emitidas', formato: 'numero',    visible: true, destacado: true },
      { key: 'iva_estimado',          label: 'IVA 5% Acumulado',      formato: 'guaranies', visible: true },
    ),
    reportes_habilitados: withReportes('fiscal_iva', 'autofactura_set'),
    categorias_ingresos: [
      'servicios_personales', 'honorarios_eventuales', 'obra_contratada',
      'trabajo_manual', 'prestacion_eventual',
    ],
    categorias_egresos: withEgresos('materiales_obra', 'herramientas', 'alquiler_equipos_obra'),
    campos_extra_por_formulario: {
      documento: [
        { key: 'tipo_servicio_personal', label: 'Tipo de Servicio Personal', tipo: 'select',   requerido: true, opciones: ['construccion', 'reparacion', 'limpieza', 'transporte', 'cuidado', 'tecnologia', 'otro'] },
        { key: 'respaldo_url',           label: 'URL Respaldo Documental',   tipo: 'url',      requerido: true, placeholder: 'https://... (contrato, recibo escaneado, foto)' },
        { key: 'descripcion_trabajo',    label: 'Descripción del Trabajo',   tipo: 'textarea', requerido: true },
        { key: 'checklist_validado',     label: 'Checklist Previo Completado', tipo: 'boolean', requerido: true },
      ],
    },
    labels_personalizados: {
      gestion:  'AUTOFACTURA GUIADA',
      ingresos: 'AUTOFACTURAS',
      gastos:   'GASTOS SOPORTE',
    },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda', 'sifen', 'set']),
        facturacion_habilitada: true,
        notas: 'Puede emitir autofacturas y revisar estado fiscal.',
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['analizador-ia', 'gestion-freelancer']),
        facturacion_habilitada: false,
        notas: 'Solo carga de datos previos; emisión requiere revisión de admin.',
      },
    },
    onboarding: [
      { key: 'gastos',   title: 'Cargar Egresos',      description: 'Registra los gastos con respaldo antes de emitir.',           path: '/analizador-ia/gastos',    moduleKey: 'gastos' },
      { key: 'ingresos', title: 'Nueva Autofactura',   description: 'Flujo guiado: prevalidación, checklist y respaldo.',          path: '/analizador-ia/ingresos',  moduleKey: 'ingresos' },
      { key: 'cobros',   title: 'Control de Cobros',   description: 'Seguimiento de servicios prestados pendientes de cobro.',     path: '/centro-cobros',           moduleKey: 'cobros' },
    ],
    tips: [
      'La autofactura aplica solo a trabajadores del sector privado sin empresa formal registrada.',
      'Adjunta siempre un respaldo documental: foto del acuerdo o mensaje escrito es válido.',
      'El IVA de autofactura es del 5% sobre el monto total del servicio personal.',
      'Completa el checklist de control antes de emitir para evitar observaciones del SET.',
    ],
  },

  // 5 ─── SERVICIOS PROFESIONALES ───────────────────────────
  servicios_profesionales: {
    id: 'servicios_profesionales',
    nombre: 'Servicios Profesionales',
    descripcion: 'Consultoras, estudios contables, agencias y freelancers que facturan por proyectos o tiempo.',
    audiencia_objetivo: 'Agencias, estudios, productoras y consultores.',
    modulos_clave: ['proyectos', 'horas', 'propuestas', 'facturación por servicio', 'rentabilidad por cliente'],
    visible_en_selector: true,
    modulos_habilitados: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda', 'clientes', 'proyectos', 'catalog', 'sifen', 'set', 'conciliacion', 'cierre']),
    dashboard_default: [...CORE_DASHBOARD, 'flujo_financiero', 'sugerencias'],
    kpis_visibles: withKPIs(
      { key: 'proyectos_activos', label: 'Proyectos Activos', formato: 'numero',    visible: true, destacado: true },
      { key: 'margen_bruto',      label: 'Margen Bruto',      formato: 'porcentaje', visible: true, destacado: true, tooltip: '(Ingresos - Egresos directos) / Ingresos × 100.' },
      { key: 'horas_facturadas',  label: 'Horas Facturadas',  formato: 'numero',    visible: true },
      { key: 'iva_estimado',      label: 'IVA Estimado',      formato: 'guaranies', visible: true },
      { key: 'tasa_conversion',   label: 'Tasa de Conversión', formato: 'porcentaje', visible: false },
    ),
    reportes_habilitados: withReportes('fiscal_iva', 'rentabilidad_servicios', 'rentabilidad_proyectos'),
    categorias_ingresos: [
      'consultoria', 'auditoria', 'diseno_profesional', 'desarrollo_software',
      'capacitacion_corporativa', 'asesoria_legal', 'contabilidad_outsourcing', 'implementacion',
    ],
    categorias_egresos: withEgresos('subcontratacion', 'plataformas_saas', 'marketing_digital', 'viajes_gestion', 'papeleria_oficina'),
    campos_extra_por_formulario: {
      proyecto: [
        { key: 'horas_estimadas',      label: 'Horas Estimadas',        tipo: 'number',   requerido: true },
        { key: 'tarifa_hora',          label: 'Tarifa Hora (Gs)',        tipo: 'number' },
        { key: 'contrato_referencia',  label: 'N° Contrato / Referencia', tipo: 'text' },
        { key: 'entregable_principal', label: 'Entregable Principal',   tipo: 'textarea' },
      ],
      ingreso: [
        { key: 'proyecto_ref',  label: 'Proyecto Asociado',       tipo: 'select' },
        { key: 'horas_reales',  label: 'Horas Reales Trabajadas', tipo: 'number' },
      ],
      cliente: [
        { key: 'sector_industria',    label: 'Sector / Industria',    tipo: 'select', opciones: ['tecnologia', 'finanzas', 'salud', 'educacion', 'gobierno', 'retail', 'logistica', 'otro'] },
        { key: 'contacto_principal',  label: 'Contacto Principal',    tipo: 'text' },
        { key: 'telefono_contacto',   label: 'Teléfono de Contacto',  tipo: 'text' },
      ],
    },
    labels_personalizados: {
      proyectos: 'PROYECTOS Y CONTRATOS',
      clientes:  'CARTERA DE CLIENTES',
      ingresos:  'FACTURACIÓN EMITIDA',
      cobros:    'COBROS Y CUOTAS',
      agenda:    'CATÁLOGO',
    },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda', 'clientes', 'proyectos', 'catalog', 'sifen', 'set', 'conciliacion', 'cierre', 'admin']),
        facturacion_habilitada: true,
        notas: 'Acceso total: proyectos, clientes, SIFEN, conciliación y reportes.',
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda', 'clientes', 'proyectos', 'catalog']),
        facturacion_habilitada: false,
        notas: 'Acceso operativo: carga horas y gestiona proyectos sin módulo fiscal.',
      },
    },
    onboarding: [
      { key: 'proyectos', title: 'Crear Proyecto',        description: 'Define alcance, horas estimadas y tarifa del contrato.',   path: '/proyectos',    moduleKey: 'proyectos' },
      { key: 'clientes',  title: 'Cargar Cliente',        description: 'RUC y datos del cliente para emisión de facturas.',         path: '/sifen',        moduleKey: 'clientes' },
      { key: 'catalog',   title: 'Catálogo de Servicios', description: 'Define tarifas base reutilizables en propuestas.',          path: '/catalog',      moduleKey: 'catalog' },
    ],
    tips: [
      'Asigna cada hora trabajada a un proyecto para calcular el margen real por contrato.',
      'El catálogo de servicios acelera la creación de propuestas con precios predefinidos.',
      'Activa el módulo SIFEN para emitir facturas electrónicas directamente desde los proyectos.',
      'La conciliación bancaria al cierre del mes valida que no quede ningún ingreso sin registrar.',
    ],
  },

  // 6 ─── COMERCIO ───────────────────────────────────────────
  comercio_minorista: {
    id: 'comercio_minorista',
    nombre: 'Comercio Minorista',
    descripcion: 'Negocios de venta de productos al por menor o mayor, con control de IVA y facturación electrónica.',
    audiencia_objetivo: 'Tiendas y pequeños comercios.',
    modulos_clave: ['ventas', 'compras', 'inventario', 'caja diaria', 'cuentas por cobrar/pagar'],
    visible_en_selector: true,
    modulos_habilitados: withModulos(['sifen', 'clientes', 'analizador-ia', 'set', 'conciliacion', 'cierre']),
    dashboard_default: [...CORE_DASHBOARD, 'iva_estimado'],
    kpis_visibles: withKPIs(
      { key: 'iva_a_pagar',       label: 'IVA a Liquidar',      formato: 'guaranies',  visible: true, destacado: true },
      { key: 'margen_bruto',      label: 'Margen Bruto',        formato: 'porcentaje', visible: true },
      { key: 'facturas_emitidas', label: 'Facturas del Período', formato: 'numero',    visible: true },
    ),
    reportes_habilitados: withReportes('fiscal_iva'),
    categorias_ingresos: [
      'venta_contado', 'venta_credito', 'venta_mayorista', 'anticipo_cliente', 'nota_credito_emitida',
    ],
    categorias_egresos: withEgresos('mercaderia', 'insumos_packaging', 'alquiler_local', 'personal_dependiente', 'servicios_basicos', 'comisiones'),
    campos_extra_por_formulario: {
      ingreso: [
        { key: 'numero_ticket',      label: 'N° Ticket / Factura', tipo: 'text' },
        { key: 'descuento_aplicado', label: 'Descuento (%)',        tipo: 'number' },
        { key: 'metodo_pago',        label: 'Método de Pago',       tipo: 'select', opciones: ['efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'qr_bancard'] },
      ],
      egreso: [
        { key: 'proveedor_ruc',          label: 'RUC Proveedor',       tipo: 'text', requerido: true },
        { key: 'numero_factura_compra',  label: 'N° Factura Compra',   tipo: 'text', requerido: true },
      ],
    },
    labels_personalizados: {
      ingresos: 'VENTAS',
      gastos:   'COMPRAS Y GASTOS',
      clientes: 'CLIENTES / COMPRADORES',
      cobros:   'CUENTAS A COBRAR',
    },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['sifen', 'clientes', 'analizador-ia', 'set', 'conciliacion', 'cierre', 'admin']),
        facturacion_habilitada: true,
        notas: 'Control fiscal completo: emisión SIFEN, conciliación y cierre mensual.',
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['sifen', 'clientes', 'analizador-ia']),
        facturacion_habilitada: true,
        notas: 'Cajero: puede emitir facturas y registrar compras sin acceso a cierres.',
      },
    },
    onboarding: [
      { key: 'sifen',    title: 'Facturación SIFEN',   description: 'Configura timbrado y emite facturas electrónicas.',   path: '/sifen',          moduleKey: 'sifen' },
      { key: 'clientes', title: 'Clientes Frecuentes', description: 'RUC y datos para facturar más rápido.',                path: '/sifen',          moduleKey: 'clientes' },
      { key: 'cobros',   title: 'Ventas a Crédito',    description: 'Controla cuotas y saldos pendientes de clientes.',    path: '/centro-cobros',  moduleKey: 'cobros' },
    ],
    tips: [
      'Separa ventas IVA 10% (productos en general) de IVA 5% (productos de canasta básica).',
      'El formulario 120 del SET se genera cada mes con débito vs crédito fiscal.',
      'Registra todas las facturas de compra a proveedores: son crédito fiscal IVA deducible.',
      'Activa el cierre mensual para conciliar el libro IVA antes de presentar al SET.',
    ],
  },

  multiempresa: {
    id: 'multiempresa',
    nombre: 'Multiempresa',
    descripcion: 'Grupos con varias razones sociales o unidades operativas que necesitan una base única con vistas consolidadas.',
    audiencia_objetivo: 'Grupos con varias razones sociales o unidades.',
    modulos_clave: ['consolidado', 'reportes por entidad', 'permisos por empresa'],
    visible_en_selector: true,
    modulos_habilitados: withModulos(['clientes', 'proyectos', 'catalog', 'sifen', 'set', 'conciliacion', 'cierre', 'admin']),
    dashboard_default: [...CORE_DASHBOARD, 'flujo_financiero', 'iva_estimado'],
    kpis_visibles: withKPIs(
      { key: 'facturas_emitidas', label: 'Facturas Emitidas', formato: 'numero', visible: true, destacado: true },
      { key: 'iva_a_pagar', label: 'IVA Consolidado', formato: 'guaranies', visible: true },
      { key: 'proyectos_activos', label: 'Operaciones Activas', formato: 'numero', visible: true },
    ),
    reportes_habilitados: withReportes('fiscal_iva', 'rentabilidad_proyectos'),
    categorias_ingresos: ['venta_grupo', 'servicio_intercompany', 'venta_contado', 'venta_credito', 'honorarios'],
    categorias_egresos: withEgresos('mercaderia', 'servicios_compartidos', 'alquiler_local', 'personal_dependiente', 'transferencia_intercompany'),
    campos_extra_por_formulario: {
      cliente: [
        { key: 'empresa_origen', label: 'Empresa Origen', tipo: 'select', requerido: true },
        { key: 'unidad_negocio', label: 'Unidad de Negocio', tipo: 'text' },
      ],
      ingreso: [
        { key: 'empresa_origen', label: 'Empresa Emisora', tipo: 'select', requerido: true },
      ],
      egreso: [
        { key: 'empresa_origen', label: 'Empresa Receptora', tipo: 'select', requerido: true },
      ],
    },
    labels_personalizados: {
      ingresos: 'INGRESOS CONSOLIDADOS',
      gastos: 'EGRESOS CONSOLIDADOS',
      clientes: 'CLIENTES POR EMPRESA',
      cobros: 'COBROS POR ENTIDAD',
      proyectos: 'OPERACIONES DEL GRUPO',
    },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['clientes', 'proyectos', 'catalog', 'sifen', 'set', 'conciliacion', 'cierre', 'admin']),
        facturacion_habilitada: true,
        notas: 'Admin corporativo con visibilidad global y cierres por entidad.',
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['clientes', 'proyectos', 'catalog', 'sifen']),
        facturacion_habilitada: true,
        notas: 'Operador limitado a su entidad o unidad de negocio.',
      },
    },
    onboarding: [
      { key: 'clientes', title: 'Empresas del Grupo', description: 'Define entidades y receptores por razón social.', path: '/sifen', moduleKey: 'clientes' },
      { key: 'proyectos', title: 'Operaciones por Unidad', description: 'Separa proyectos y rentabilidad por empresa.', path: '/proyectos', moduleKey: 'proyectos' },
      { key: 'reportes', title: 'Consolidado Fiscal', description: 'Compara KPIs y cierres entre empresas del grupo.', path: '/analisis', moduleKey: 'reportes' },
    ],
    tips: [
      'Usa una empresa origen por cada documento para consolidar sin perder trazabilidad.',
      'Los cierres deben poder verse por entidad y también en consolidado.',
      'Mantén permisos por empresa para que cada operador vea solo su unidad.',
      'La capa multiempresa se apoya en una base central con reportes consolidados.',
    ],
  },

  // ── Tipos existentes (backward compat) ──────────────────────

  audiovisual: {
    id: 'audiovisual',
    nombre: 'Productora Audiovisual',
    descripcion: 'Productoras que gestionan proyectos audiovisuales, equipos y servicios de producción.',
    modulos_habilitados: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda', 'planificacion', 'proyectos', 'servicios', 'inventario', 'catalog']),
    dashboard_default: [...CORE_DASHBOARD, 'flujo_financiero', 'sugerencias'],
    kpis_visibles: withKPIs(
      { key: 'proyectos_activos', label: 'Producciones Activas', formato: 'numero',    visible: true, destacado: true },
      { key: 'margen_bruto',      label: 'Margen Bruto',         formato: 'porcentaje', visible: true },
    ),
    reportes_habilitados: withReportes('rentabilidad_servicios'),
    categorias_ingresos: ['filmacion', 'edicion', 'produccion_completa', 'fotografia', 'motion_graphics', 'drone', 'live_streaming', 'otro'],
    categorias_egresos: withEgresos('alquiler_equipo', 'material_produccion', 'subcontratacion', 'marketing'),
    campos_extra_por_formulario: {
      proyecto: [
        { key: 'tipo_produccion', label: 'Tipo de Producción', tipo: 'select', opciones: ['corporativo', 'publicitario', 'documental', 'evento', 'social'] },
      ],
    },
    labels_personalizados: { proyectos: 'PRODUCCIONES', inventario: 'EQUIPOS' },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda', 'planificacion', 'proyectos', 'servicios', 'inventario', 'catalog', 'sifen', 'set', 'conciliacion', 'cierre', 'admin']),
        facturacion_habilitada: true,
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['analizador-ia', 'gestion-freelancer', 'agenda', 'planificacion', 'proyectos', 'inventario']),
        facturacion_habilitada: false,
      },
    },
    onboarding: [
      { key: 'proyectos',  title: 'Nueva Producción',   description: 'Crea un proyecto audiovisual con presupuesto y fechas.', path: '/proyectos', moduleKey: 'proyectos' },
      { key: 'catalog',    title: 'Mis Servicios',       description: 'Define precios por tipo de servicio audiovisual.',       path: '/catalog',   moduleKey: 'catalog' },
      { key: 'inventario', title: 'Equipos y Activos',   description: 'Control de disponibilidad de equipo de producción.',    path: '/activos',   moduleKey: 'inventario' },
    ],
    tips: [
      'Asigna cada gasto a un proyecto para calcular la rentabilidad real por producción.',
      'Monitorea equipos rentados para evitar solapamientos de disponibilidad.',
      'El catálogo te permite pre-cargar precios y agilizar la creación de propuestas.',
    ],
  },

  logistica: {
    id: 'logistica',
    nombre: 'Operador Logístico',
    descripcion: 'Empresas de logística y almacenamiento con control de operaciones de distribución.',
    modulos_habilitados: withModulos(['agenda', 'proyectos', 'inventario']),
    dashboard_default: [...CORE_DASHBOARD, 'flujo_financiero'],
    kpis_visibles: withKPIs(
      { key: 'proyectos_activos', label: 'Operaciones Activas', formato: 'numero', visible: true },
    ),
    reportes_habilitados: withReportes('operativo_logistico'),
    categorias_ingresos: ['servicio_logistico', 'almacenaje', 'distribucion', 'otro_ingreso'],
    categorias_egresos: withEgresos('combustible', 'mantenimiento_vehiculo', 'alquiler_deposito'),
    campos_extra_por_formulario: {},
    labels_personalizados: { proyectos: 'OPERACIONES', inventario: 'FLOTA Y ACTIVOS' },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['agenda', 'proyectos', 'inventario', 'sifen', 'set', 'admin']),
        facturacion_habilitada: true,
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['agenda', 'proyectos', 'inventario']),
        facturacion_habilitada: false,
      },
    },
    onboarding: [
      { key: 'proyectos',  title: 'Registrar Operación', description: 'Nueva orden de distribución o servicio logístico.',  path: '/proyectos',     moduleKey: 'proyectos' },
      { key: 'inventario', title: 'Activos Logísticos',  description: 'Vehículos, equipos y activos de la operación.',     path: '/activos',       moduleKey: 'inventario' },
      { key: 'cobros',     title: 'Cobros',              description: 'Pagos pendientes de servicios prestados.',           path: '/centro-cobros', moduleKey: 'cobros' },
    ],
    tips: ['Registra cada operación como proyecto para controlar costos e ingresos por servicio.'],
  },

  salud: {
    id: 'salud',
    nombre: 'Servicios de Salud',
    descripcion: 'Clínicas, consultorios y profesionales de salud con facturación IVA 5%.',
    modulos_habilitados: withModulos(['sifen', 'clientes', 'agenda']),
    dashboard_default: [...CORE_DASHBOARD, 'iva_estimado'],
    kpis_visibles: withKPIs(
      { key: 'iva_estimado', label: 'IVA 5% Estimado', formato: 'guaranies', visible: true },
    ),
    reportes_habilitados: withReportes('fiscal_iva'),
    categorias_ingresos: ['consulta_medica', 'procedimiento', 'cirugia', 'medicamento', 'insumo_medico', 'obra_social'],
    categorias_egresos: withEgresos('insumos_medicos', 'equipamiento_medico', 'alquiler_consultorio', 'personal_salud'),
    campos_extra_por_formulario: {
      ingreso: [
        { key: 'tipo_servicio_medico', label: 'Tipo de Servicio', tipo: 'select', opciones: ['consulta', 'procedimiento', 'internacion', 'cirugia', 'otro'] },
      ],
    },
    labels_personalizados: { clientes: 'PACIENTES', ingresos: 'HONORARIOS MÉDICOS' },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['sifen', 'clientes', 'agenda', 'set', 'conciliacion', 'admin']),
        facturacion_habilitada: true,
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['sifen', 'clientes', 'agenda']),
        facturacion_habilitada: true,
        notas: 'Recepcionista: emite y registra sin acceder a reportes fiscales.',
      },
    },
    onboarding: [
      { key: 'sifen',    title: 'Facturación Médica',    description: 'Facturas con IVA 5% para servicios de salud.',    path: '/sifen',          moduleKey: 'sifen' },
      { key: 'cobros',   title: 'Cobros de Consultas',   description: 'Pagos pendientes de pacientes y obras sociales.', path: '/centro-cobros',  moduleKey: 'cobros' },
      { key: 'clientes', title: 'Registro de Pacientes', description: 'Directorio para emisión correcta de facturas.',   path: '/sifen',          moduleKey: 'clientes' },
    ],
    tips: ['Los servicios médicos tributan IVA 5%. Configura los ítems del catálogo correctamente.'],
  },

  educacion: {
    id: 'educacion',
    nombre: 'Academias y Educación',
    descripcion: 'Academias, institutos y docentes particulares con cobros de cuotas mensuales.',
    modulos_habilitados: withModulos(['agenda', 'clientes']),
    dashboard_default: [...CORE_DASHBOARD, 'sugerencias'],
    kpis_visibles: withKPIs(),
    reportes_habilitados: withReportes(),
    categorias_ingresos: ['cuota_mensual', 'matricula', 'taller', 'certificacion', 'material_educativo'],
    categorias_egresos: withEgresos('docentes', 'material_didactico', 'alquiler_aula', 'plataformas_educativas'),
    campos_extra_por_formulario: {
      ingreso: [
        { key: 'mes_cuota',     label: 'Mes de Cuota',     tipo: 'select', opciones: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'] },
        { key: 'alumno_nombre', label: 'Nombre del Alumno', tipo: 'text' },
      ],
    },
    labels_personalizados: { clientes: 'ALUMNOS', cobros: 'CUOTAS PENDIENTES', ingresos: 'CUOTAS COBRADAS' },
    permisos_recomendados: {
      admin: {
        rol: 'admin',
        modulos: withModulos(['agenda', 'clientes', 'sifen', 'set', 'admin']),
        facturacion_habilitada: true,
      },
      standard: {
        rol: 'standard',
        modulos: withModulos(['agenda', 'clientes', 'cobros']),
        facturacion_habilitada: false,
        notas: 'Administrativo: gestiona alumnos, cuotas y agenda sin módulo fiscal.',
      },
    },
    onboarding: [
      { key: 'cobros',   title: 'Cobrar Cuotas',       description: 'Registra y gestiona los pagos mensuales de alumnos.', path: '/centro-cobros', moduleKey: 'cobros' },
      { key: 'agenda',   title: 'Agenda de Clases',    description: 'Planifica turnos y disponibilidad del plantel.',      path: '/agenda',       moduleKey: 'agenda' },
      { key: 'reportes', title: 'Resumen Financiero',  description: 'Ingresos vs gastos operativos del mes.',              path: '/analisis',     moduleKey: 'reportes' },
    ],
    tips: ['Los servicios educativos son exentos de IVA. Configura cada ítem como Exento en el catálogo.'],
  },
};

function getArchitecturePreset(serviceType: ServiceType): BusinessArchitecturePreset {
  return BUSINESS_ARCHITECTURE[serviceType];
}

export function getServiceCatalogConfig(serviceType: ServiceType): FullServiceConfig {
  const config = SERVICE_CATALOG[serviceType];
  const architecture = getArchitecturePreset(serviceType);

  return {
    ...config,
    estado: config.estado ?? architecture.status,
    audiencia_objetivo: config.audiencia_objetivo ?? architecture.audience,
    modulos_clave_ids: config.modulos_clave_ids ?? architecture.keyModuleKeys,
    modulos_clave: config.modulos_clave ?? architecture.keyModuleKeys.map(getModuleLabel),
    modulos_editables: config.modulos_editables ?? config.modulos_habilitados,
    dashboard_experience: config.dashboard_experience ?? architecture.dashboardExperience,
    tono_lenguaje: config.tono_lenguaje ?? architecture.languageTone,
    flujos_operativos: config.flujos_operativos ?? architecture.operationalFlows,
  };
}

// ============================================================
// ADAPTADOR — SERVICE_CATALOG → ServiceProfileConfig (slim)
// Convierte la config completa al formato que consume la UI existente.
// ============================================================

export function deriveProfileConfig(full: FullServiceConfig): ServiceProfileConfig {
  const resolved = getServiceCatalogConfig(full.id);

  return {
    id: resolved.id,
    name: resolved.nombre,
    status: resolved.estado || 'disponible',
    audience: resolved.audiencia_objetivo || resolved.descripcion,
    keyModules: resolved.modulos_clave || [],
    keyModuleKeys: resolved.modulos_clave_ids || [],
    modules: resolved.modulos_habilitados,
    editableModules: resolved.modulos_editables || resolved.modulos_habilitados,
    dashboardWidgets: resolved.dashboard_default,
    dashboardExperience: resolved.dashboard_experience || '',
    reportPresets: resolved.reportes_habilitados,
    languageTone: resolved.tono_lenguaje || 'freelancer',
    operationalFlows: resolved.flujos_operativos || [],
    labels: {
      analizador: resolved.labels_personalizados.analizador,
      gestion:    resolved.labels_personalizados.gestion,
      reportes:   resolved.labels_personalizados.reportes,
    },
    onboarding: resolved.onboarding,
    tips:       resolved.tips,
  };
}
