// ============================================================
// SERVICE TYPES — Finance SaaS Paraguay
// Extiende tipado de forma incremental sin romper código existente.
// ============================================================

// --------------- Core union types ---------------

/** Tipos de perfil de servicio (UI + columna profiles.service_type en DB).
 *  Al agregar nuevos valores aquí también actualizar la constraint CHECK
 *  en supabase/migrations/20260407_add_service_type_profiles.sql
 */
export type ServiceType =
  | 'audiovisual'
  | 'logistica'
  | 'salud'
  | 'educacion'
  | 'freelancer'
  | 'distribucion_flota'
  | 'sifen_empresarial'
  | 'autofactura_guiada'
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
  | 'reportes'
  | 'settings'
  | 'admin';

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

// --------------- Configuración completa por tipo de servicio ---------------

export interface FullServiceConfig {
  id: ServiceType;
  nombre: string;
  descripcion: string;
  audiencia_objetivo?: string;
  modulos_clave?: string[];
  visible_en_selector?: boolean;
  modulos_habilitados: ServiceModuleKey[];
  dashboard_default: DashboardWidgetKey[];
  kpis_visibles: KPIConfig[];
  reportes_habilitados: ReportPresetKey[];
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
  modules: ServiceModuleKey[];
  dashboardWidgets: DashboardWidgetKey[];
  reportPresets: ReportPresetKey[];
  labels?: Partial<Record<'analizador' | 'gestion' | 'reportes', string>>;
  onboarding: OnboardingCard[];
  tips: string[];
}

export interface ServiceProfileSource {
  service_type?: string | null;
  tipo_negocio?: string | null;
}
