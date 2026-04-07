/**
 * Utilidades para facturacion autoimpreso DNIT Paraguay
 */

/**
 * Genera el siguiente numero de documento autoimpreso
 * Formato: XXX-XXX-XXXXXXX (Establecimiento - Punto Expedicion - Secuencia)
 */
export function generateNumeroDocumento(
    establecimiento: string,
    puntoExpedicion: string,
    ultimoNumero: string
): string {
    const seq = ultimoNumero ? parseSecuencia(ultimoNumero) + 1 : 1;
    return `${establecimiento}-${puntoExpedicion}-${seq.toString().padStart(7, '0')}`;
}

function parseSecuencia(numeroDocumento: string): number {
    const parts = numeroDocumento.split('-');
    const seq = parts[parts.length - 1];
    return parseInt(seq, 10) || 0;
}

/**
 * Valida formato RUC paraguayo: 2 opciones
 * - Persona juridica: 800XXXXX-X (800 + 6 digitos + guion + DV)
 * - Persona fisica: XXXXXXX-X (7 digitos + guion + DV)
 * - Foraneas: EXT-XXXXX (otro formato)
 */
export function validarRUC(ruc: string): boolean {
    if (!ruc) return false;
    // Persona fisica: 7 digits + guion + 1 digit
    if (/^\d{7}-\d$/.test(ruc)) return true;
    // Persona juridica: 800 + 5-6 digits + guion + 1 digit
    if (/^800\d{5,6}-\d$/.test(ruc)) return true;
    // Ext: EXT-XXXXX u otro no local
    if (/^EXT-\d{5}$/.test(ruc)) return true;
    return false;
}
