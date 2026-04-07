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
  condicion_operacion: 'contado' | 'credito';
  items: ItemFacturaInput[];
}

export interface ResultadoValidacion {
  ok: boolean;
  errors: string[];
}

const RUC_REGEX = /^\d{5,8}-\d$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IVA_PERMITIDO = new Set([0, 5, 10]);

export function normalizarRucPy(ruc: string): string {
  return (ruc || '').replace(/\s+/g, '').trim();
}

export function esRucPyValido(ruc: string): boolean {
  return RUC_REGEX.test(normalizarRucPy(ruc));
}

export function validarFacturaElectronicaPayload(payload: FacturaElectronicaPayload): ResultadoValidacion {
  const errors: string[] = [];

  if (!payload.receptor_razon_social?.trim()) {
    errors.push('La razon social del receptor es obligatoria.');
  }

  const rucNormalizado = normalizarRucPy(payload.receptor_ruc);
  if (!rucNormalizado) {
    errors.push('El RUC del receptor es obligatorio.');
  } else if (!esRucPyValido(rucNormalizado)) {
    errors.push('El RUC debe cumplir el formato paraguayo 1234567-8.');
  }

  if (!payload.receptor_direccion?.trim()) {
    errors.push('La direccion fiscal del receptor es obligatoria.');
  }

  if (!payload.receptor_email?.trim()) {
    errors.push('El email del receptor es obligatorio.');
  } else if (!EMAIL_REGEX.test(payload.receptor_email.trim())) {
    errors.push('El email del receptor no tiene formato valido.');
  }

  if (!['contado', 'credito'].includes(payload.condicion_operacion)) {
    errors.push('La condicion de operacion debe ser contado o credito.');
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('La factura debe incluir al menos un item.');
  }

  payload.items.forEach((item, index) => {
    const line = index + 1;
    if (!item.descripcion?.trim()) {
      errors.push(`Item ${line}: descripcion obligatoria.`);
    }
    if (!Number.isFinite(item.cantidad) || item.cantidad <= 0) {
      errors.push(`Item ${line}: cantidad debe ser mayor a cero.`);
    }
    if (!Number.isFinite(item.precio_unitario) || item.precio_unitario <= 0) {
      errors.push(`Item ${line}: precio unitario debe ser mayor a cero.`);
    }
    if (!IVA_PERMITIDO.has(Number(item.iva_tipo))) {
      errors.push(`Item ${line}: iva_tipo permitido 0, 5 o 10.`);
    }
  });

  return {
    ok: errors.length === 0,
    errors,
  };
}
