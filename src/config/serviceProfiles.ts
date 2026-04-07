import type {
  FullServiceConfig,
  ServiceProfileConfig,
  ServiceModuleKey,
  ServiceProfileSource,
  ServiceType,
} from '../types/service';
import {
  SERVICE_CATALOG,
  SERVICE_TYPE_ALIASES,
  SELECTABLE_SERVICE_TYPES,
  deriveProfileConfig,
  getServiceCatalogConfig,
} from './serviceCatalog';

// SERVICE_PROFILES se deriva automáticamente del catálogo.
// Para editar onboarding, tips, módulos, etc. → edita SERVICE_CATALOG en serviceCatalog.ts
export const SERVICE_PROFILES = Object.fromEntries(
  Object.keys(SERVICE_CATALOG).map((type) => {
    const serviceType = type as ServiceType;
    return [serviceType, deriveProfileConfig(getServiceCatalogConfig(serviceType))];
  })
) as Record<ServiceType, ServiceProfileConfig>;

export const SELECTABLE_SERVICE_PROFILES = SELECTABLE_SERVICE_TYPES
  .map((type) => SERVICE_PROFILES[type])
  .filter(Boolean);

// ── Fragmento eliminado: definiciones manuales reemplazadas por el catálogo ──
// Si necesitas un override one-off de un tipo específico:
// SERVICE_PROFILES['mi_tipo'] = { ...SERVICE_PROFILES['mi_tipo'], labels: { analizador: 'CUSTOM' } };


const coerceServiceType = (raw?: string | null): ServiceType | null => {
  if (!raw) return null;
  const normalized = raw.toLowerCase().trim();
  const key = (SERVICE_TYPE_ALIASES[normalized] ?? normalized) as ServiceType;
  return SERVICE_PROFILES[key] ? key : null;
};

export function resolveServiceType(source?: ServiceProfileSource | null): ServiceType {
  const localOverride = typeof window !== 'undefined' ? window.localStorage.getItem('service_type_override') : null;
  const fromOverride = coerceServiceType(localOverride);
  if (fromOverride) return fromOverride;

  const fromServiceType = coerceServiceType(source?.service_type);
  if (fromServiceType) return fromServiceType;

  const fromTipoNegocio = coerceServiceType(source?.tipo_negocio);
  if (fromTipoNegocio) return fromTipoNegocio;

  return 'freelancer';
}

export function resolveServiceProfile(source?: ServiceProfileSource | null): ServiceProfileConfig {
  const type = resolveServiceType(source);
  return SERVICE_PROFILES[type];
}

export function resolveFullServiceProfile(source?: ServiceProfileSource | null): FullServiceConfig {
  const type = resolveServiceType(source);
  return getServiceCatalogConfig(type);
}

export function resolveActiveModules(source?: ServiceProfileSource | null): ServiceModuleKey[] {
  const overrideModules = source?.modulos_habilitados?.filter(Boolean) as ServiceModuleKey[] | undefined;
  if (overrideModules && overrideModules.length > 0) {
    return overrideModules;
  }

  return resolveServiceProfile(source).modules;
}
