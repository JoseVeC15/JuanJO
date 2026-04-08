// ============================================================
// COMPLIANCE ENGINE — Paraguay / SET / SIFEN
// Fuente normativa: Ley 6380/2019 + Manual Técnico SIFEN DNIT
// ============================================================

// ── CONSTANTES NORMATIVAS ────────────────────────────────────

/** Tipos de Documento Electrónico reconocidos por SIFEN */
export const TIPO_DOCUMENTO_SIFEN = {
  FACTURA_ELECTRONICA: '1',
  AUTOFACTURA_ELECTRONICA: '4',
  NOTA_DEBITO_ELECTRONICA: '5',
  NOTA_CREDITO_ELECTRONICA: '6',
  NOTA_REMISION_ELECTRONICA: '7',
} as const;

export const TIPO_DOCUMENTO_LABELS: Record<string, string> = {
  '1': 'Factura Electrónica',
  '4': 'Autofactura Electrónica',
  '5': 'Nota de Débito Electrónica',
  '6': 'Nota de Crédito Electrónica',
  '7': 'Nota de Remisión Electrónica',
};

/** Tasas de IVA vigentes según Ley 6380/2019 */
export const TASAS_IVA = {
  GENERAL: 10,      // Servicios, importaciones, productos generales
  DIFERENCIAL: 5,   // Alimentos básicos, medicamentos, productos agropecuarios
  EXENTO: 0,        // Servicios educativos, financieros, exportaciones
} as const;

/** Divisores para extraer IVA del monto bruto (IVA incluido) */
export const DIVISOR_IVA: Record<number, number> = {
  10: 11,   // monto / 11 = IVA 10%
  5: 21,    // monto / 21 = IVA 5%
  0: 0,     // exento
};

/** Condiciones de venta reconocidas */
export const CONDICIONES_VENTA = ['contado', 'credito'] as const;
export type CondicionVenta = typeof CONDICIONES_VENTA[number];

/** Ambientes SIFEN */
export const AMBIENTES_SIFEN = {
  TEST: { url: 'https://sifen-test.set.gov.py', label: 'Prueba', validezLegal: false },
  PROD: { url: 'https://sifen.set.gov.py', label: 'Producción', validezLegal: true },
} as const;

/** Formato de numeración fiscal: EEE-PPP-NNNNNNN */
export const FORMATO_NUMERO_FACTURA = /^\d{3}-\d{3}-\d{7}$/;

/** Regímenes impositivos */
export const REGIMENES = {
  GENERAL: { id: 'general', nombre: 'Régimen General', descripcion: 'Empresas medianas y grandes — Facturas con IVA' },
  SIMPLIFICADO: { id: 'simplificado', nombre: 'Régimen Simplificado', descripcion: 'Ingresos ≤ 80M Gs/año — Boletas simplificadas' },
  IRAGRO: { id: 'iragro', nombre: 'IRAGRO', descripcion: 'Actividades agropecuarias' },
} as const;

/** Tasas de retención comunes */
export const TASAS_RETENCION = {
  IVA_30: { tasa: 0.30, descripcion: 'IVA 30% — Operaciones generales' },
  IVA_50: { tasa: 0.50, descripcion: 'IVA 50% — Servicios personales' },
  IVA_100: { tasa: 1.00, descripcion: 'IVA 100% — Contribuyentes no inscritos' },
  IRE_1: { tasa: 0.01, descripcion: 'IRE 1%' },
  IRE_3: { tasa: 0.03, descripcion: 'IRE 3%' },
} as const;

/** Formularios obligatorios (SET / Marangatú) */
export const FORMULARIOS_SET = {
  F120: { id: '120', nombre: 'Declaración Jurada IVA', periodicidad: 'mensual', version: 'v4' },
  F530: { id: '530', nombre: 'Retenciones', periodicidad: 'mensual' },
  F500: { id: '500', nombre: 'Declaración IRE', periodicidad: 'anual' },
  F510: { id: '510', nombre: 'Declaración IRP', periodicidad: 'anual' },
} as const;

/** Sanciones referencia (Art. 176-181, Ley 6380/2019) */
export const SANCIONES_REFERENCIA = [
  { infraccion: 'No emitir comprobante', sancion: '50% ~ 100% del valor de la operación' },
  { infraccion: 'Emitir con datos falsos', sancion: 'Multa + posible clausura' },
  { infraccion: 'Clausura de establecimiento', sancion: '1 a 30 días según reincidencia' },
  { infraccion: 'Omisión de IVA', sancion: '50% del impuesto omitido + intereses' },
  { infraccion: 'No llevar contabilidad', sancion: 'Hasta 300 jornales mínimos' },
] as const;

/** Plazo de conservación documental */
export const PLAZO_CONSERVACION_ANIOS = 5;

/** IRE tasa vigente */
export const TASA_IRE = 0.10; // 10% sobre renta neta (Ley 6380/2019)

// ── INTERFACES ───────────────────────────────────────────────

export interface ItemFacturaInput {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  iva_tipo: number;
}

export interface FacturaElectronicaPayload {
  receptor_razon_social: string;
  receptor_ruc: string;
  receptor_direccion: string;
  receptor_email: string;
  condicion_operacion: CondicionVenta;
  items: ItemFacturaInput[];
  tipo_documento?: string;
}

export interface ResultadoValidacion {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

// ── VALIDACIONES ─────────────────────────────────────────────

const RUC_REGEX = /^\d{5,8}-\d$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IVA_PERMITIDO = new Set<number>([TASAS_IVA.EXENTO, TASAS_IVA.DIFERENCIAL, TASAS_IVA.GENERAL]);
const TIPOS_DOCUMENTO_VALIDOS = new Set<string>(Object.values(TIPO_DOCUMENTO_SIFEN));

export function normalizarRucPy(ruc: string): string {
  return (ruc || '').replace(/\s+/g, '').trim();
}

export function esRucPyValido(ruc: string): boolean {
  return RUC_REGEX.test(normalizarRucPy(ruc));
}

/** Calcula el IVA contenido en un monto bruto */
export function calcularIvaContenido(montoBruto: number, tasaIva: number): number {
  const divisor = DIVISOR_IVA[tasaIva];
  if (!divisor) return 0;
  return Math.round(montoBruto / divisor);
}

/** Calcula la base imponible a partir de un monto con IVA incluido */
export function calcularBaseImponible(montoBruto: number, tasaIva: number): number {
  return montoBruto - calcularIvaContenido(montoBruto, tasaIva);
}

/** Validación completa de payload para emisión electrónica */
export function validarFacturaElectronicaPayload(payload: FacturaElectronicaPayload): ResultadoValidacion {
  const errors: string[] = [];
  const warnings: string[] = [];

  // --- Receptor ---
  if (!payload.receptor_razon_social?.trim()) {
    errors.push('La razón social del receptor es obligatoria.');
  }

  const rucNormalizado = normalizarRucPy(payload.receptor_ruc);
  if (!rucNormalizado) {
    errors.push('El RUC del receptor es obligatorio.');
  } else if (!esRucPyValido(rucNormalizado)) {
    errors.push('El RUC debe cumplir el formato paraguayo XXXXXXXX-N (ej: 80109403-8).');
  }

  if (!payload.receptor_direccion?.trim()) {
    errors.push('La dirección fiscal del receptor es obligatoria.');
  }

  if (!payload.receptor_email?.trim()) {
    errors.push('El email del receptor es obligatorio para envío del KuDE.');
  } else if (!EMAIL_REGEX.test(payload.receptor_email.trim())) {
    errors.push('El email del receptor no tiene formato válido.');
  }

  // --- Condición de venta ---
  if (!CONDICIONES_VENTA.includes(payload.condicion_operacion as CondicionVenta)) {
    errors.push('La condición de operación debe ser "contado" o "crédito".');
  }

  // --- Tipo de documento ---
  if (payload.tipo_documento && !TIPOS_DOCUMENTO_VALIDOS.has(payload.tipo_documento)) {
    errors.push(`Tipo de documento "${payload.tipo_documento}" no reconocido por SIFEN. Valores válidos: ${Object.values(TIPO_DOCUMENTO_SIFEN).join(', ')}.`);
  }

  // --- Ítems ---
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('La factura debe incluir al menos un ítem (Art. 85, Ley 6380).');
  }

  let totalFactura = 0;

  payload.items.forEach((item, index) => {
    const line = index + 1;
    if (!item.descripcion?.trim()) {
      errors.push(`Ítem ${line}: la descripción es obligatoria.`);
    }
    if (!Number.isFinite(item.cantidad) || item.cantidad <= 0) {
      errors.push(`Ítem ${line}: la cantidad debe ser mayor a cero.`);
    }
    if (!Number.isFinite(item.precio_unitario) || item.precio_unitario <= 0) {
      errors.push(`Ítem ${line}: el precio unitario debe ser mayor a cero.`);
    }
    if (!IVA_PERMITIDO.has(Number(item.iva_tipo))) {
      errors.push(`Ítem ${line}: tasa IVA no reconocida. Permitidos: 0% (exento), 5% (diferencial), 10% (general).`);
    }

    totalFactura += item.cantidad * item.precio_unitario;
  });

  // --- Advertencias (no bloquean) ---
  if (totalFactura === 0 && errors.length === 0) {
    warnings.push('El monto total de la factura es Gs. 0. Verifica los precios antes de emitir.');
  }

  if (payload.condicion_operacion === 'credito') {
    warnings.push('Operación a crédito: recuerda registrar los plazos y cuotas para el control de cobros.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

/** Valida formato de timbrado (número de hasta 8 dígitos) */
export function esTimbradoValido(timbrado: string): boolean {
  return /^\d{7,8}$/.test((timbrado || '').trim());
}

/** Valida formato de establecimiento/punto (3 dígitos) */
export function esCodigoEstablecimientoValido(codigo: string): boolean {
  return /^\d{3}$/.test((codigo || '').trim());
}

/** Valida CSC (Código de Seguridad del Contribuyente) */
export function esCscValido(csc: string): boolean {
  return (csc || '').trim().length >= 8;
}
