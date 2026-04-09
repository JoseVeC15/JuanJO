// ============================================================
// SERVICE TYPES — Finance SaaS Paraguay
// Extiende tipado de forma incremental sin romper código existente.
// ============================================================

// --------------- Core union types ---------------

/** Tipos de perfil de servicio (UI + columna profiles.service_type en DB).
 *  Al agregar nuevos valores aquí también actualizar la constraint CHECK
 *  en supabase/migrations/202604070002_add_service_type_profiles.sql
 */
export type ServiceType =
  | 'audiovisual'
  | 'logistica'
  | 'salud'
  | 'educacion'
  | 'freelancer'
  | 'distribucion_flota'
  | 'sifen_empresarial'
  | 'facturacion_autoimpresor'
  | 'servicios_profesionales'
  | 'comercio_minorista'
  | 'multiempresa';

export type ServiceModuleKey =
  | 'dashboard'
  | 'analizador-ia'
  | 'gastos'
  | 'ingresos'
  | 'gestion-freelancer'
  | 'cobros'
  | 'agenda'
  | 'planificacion'
  | 'set'
  | 'conciliacion'
  | 'cierre'
  | 'sifen'       // clave de módulo/ruta (≠ ServiceType 'sifen')
  | 'clientes'
  | 'proyectos'
  | 'servicios'
  | 'inventario'
  | 'catalog'
  | 'facturas_virtuales'
  | 'productos_catalogo'
  | 'reportes'
  | 'settings'
  | 'admin'
  | 'horas'
  | 'propuestas'
  | 'facturacion-servicio'
  | 'rentabilidad-cliente'
  | 'facturacion-electronica'
  | 'estados-dte'
  | 'validacion'
  | 'historial-tributario'
  | 'vehiculos'
  | 'rutas'
  | 'combustible'
  | 'mantenimiento'
  | 'alquileres'
  | 'costo-unidad'
  | 'ventas'
  | 'compras'
  | 'caja-diaria'
  | 'cuentas-por-cobrar-pagar'
  | 'consolidado'
  | 'reportes-entidad'
  | 'permisos-empresa'
  | 'impuestos-estimados';

export type ServiceProfileStatus = 'activo' | 'disponible';

export type ServiceLanguageTone =
  | 'freelancer'
  | 'corporativo'
  | 'tributario'
  | 'asistido'
  | 'operativo'
  | 'retail'
  | 'multiempresa'
  | 'audiovisual'
  | 'salud'
  | 'educacion';

export type ServiceModuleCategory = 'core' | 'finance' | 'fiscal' | 'operations' | 'analytics' | 'crm';

export type ModuleAvailability = 'implemented' | 'planned';

export type DashboardWidgetKey =
  | 'ingresos_cobrados'
  | 'egresos_registrados'
  | 'balance_neto'
  | 'cuentas_por_cobrar'
  | 'iva_estimado'
  | 'flujo_financiero'
  | 'sugerencias';

export type KPIKey =
  | 'ingresos_cobrados'
  | 'egresos_registrados'
  | 'balance_neto'
  | 'cuentas_por_cobrar'
  | 'iva_estimado'
  | 'iva_debito'
  | 'iva_credito'
  | 'iva_a_pagar'
  | 'margen_bruto'
  | 'proyectos_activos'
  | 'horas_facturadas'
  | 'facturas_emitidas'
  | 'facturas_aprobadas'
  | 'costo_por_km'
  | 'flota_activa'
  | 'mantenimiento_pendiente'
  | 'autofacturas_emitidas'
  | 'tasa_conversion';

export type ReportPresetKey =
  | 'resumen_simple'
  | 'fiscal_iva'
  | 'rentabilidad_servicios'
  | 'operativo_logistico'
  | 'flota_operativa'
  | 'rentabilidad_proyectos'
  | 'autofactura_set';

export type FormularioTarget =
  | 'ingreso'
  | 'egreso'
  | 'proyecto'
  | 'cliente'
  | 'documento';

export type CampoTipo =
  | 'text'
  | 'number'
  | 'select'
  | 'date'
  | 'boolean'
  | 'textarea'
  | 'url';

// --------------- Sub-interfaces ---------------

export interface KPIConfig {
  key: KPIKey;
  label: string;
  formato: 'guaranies' | 'porcentaje' | 'numero' | 'dias';
  visible: boolean;
  destacado?: boolean;
  tooltip?: string;
}

export interface CampoExtra {
  key: string;
  label: string;
  tipo: CampoTipo;
  requerido?: boolean;
  opciones?: string[];
  placeholder?: string;
}

export interface LabelsPersonalizados {
  analizador?: string;
  gestion?: string;
  reportes?: string;
  gastos?: string;
  ingresos?: string;
  proyectos?: string;
  inventario?: string;
  clientes?: string;
  cobros?: string;
  agenda?: string;
}

export interface PermisoRecomendado {
  rol: 'admin' | 'standard';
  modulos: ServiceModuleKey[];
  facturacion_habilitada: boolean;
  notas?: string;
}

export interface OnboardingCard {
  key: string;
  title: string;
  description: string;
  path: string;
  moduleKey: string;
}

export interface ServiceModuleDefinition {
  key: ServiceModuleKey;
  label: string;
  description: string;
  category: ServiceModuleCategory;
  availability: ModuleAvailability;
  configurable: boolean;
  path?: string;
}

export interface BusinessArchitecturePreset {
  status: ServiceProfileStatus;
  audience: string;
  keyModuleKeys: ServiceModuleKey[];
  languageTone: ServiceLanguageTone;
  dashboardExperience: string;
  operationalFlows: string[];
}

// --------------- Configuración completa por tipo de servicio ---------------

export interface FullServiceConfig {
  id: ServiceType;
  nombre: string;
  descripcion: string;
  estado?: ServiceProfileStatus;
  audiencia_objetivo?: string;
  modulos_clave?: string[];
  modulos_clave_ids?: ServiceModuleKey[];
  visible_en_selector?: boolean;
  modulos_habilitados: ServiceModuleKey[];
  modulos_editables?: ServiceModuleKey[];
  dashboard_default: DashboardWidgetKey[];
  dashboard_experience?: string;
  kpis_visibles: KPIConfig[];
  reportes_habilitados: ReportPresetKey[];
  tono_lenguaje?: ServiceLanguageTone;
  flujos_operativos?: string[];
  categorias_ingresos: string[];
  categorias_egresos: string[];
  campos_extra_por_formulario: Partial<Record<FormularioTarget, CampoExtra[]>>;
  labels_personalizados: LabelsPersonalizados;
  permisos_recomendados: {
    admin: PermisoRecomendado;
    standard: PermisoRecomendado;
  };
  onboarding: OnboardingCard[];
  tips: string[];
}

// --------------- Slim config (backward compat — usada por serviceProfiles.ts y UI existente) ---------------

export interface ServiceProfileConfig {
  id: ServiceType;
  name: string;
  status: ServiceProfileStatus;
  audience: string;
  keyModules: string[];
  keyModuleKeys: ServiceModuleKey[];
  modules: ServiceModuleKey[];
  editableModules: ServiceModuleKey[];
  dashboardWidgets: DashboardWidgetKey[];
  dashboardExperience: string;
  reportPresets: ReportPresetKey[];
  languageTone: ServiceLanguageTone;
  operationalFlows: string[];
  labels?: Partial<Record<'analizador' | 'gestion' | 'reportes', string>>;
  onboarding: OnboardingCard[];
  tips: string[];
}

export interface ServiceProfileSource {
  service_type?: string | null;
  tipo_negocio?: string | null;
  modulos_habilitados?: string[] | null;
}
