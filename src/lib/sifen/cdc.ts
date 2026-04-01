/**
 * Generador de CDC (Código de Control) - SIFEN Paraguay 🇵🇾
 * Basado en la normativa DNIT: CDC (44 dígitos)
 */

export function calcularDigitoVerhoeven(numeroCadena: string): number {
    const tabla: number[][] = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const permutacion: number[][] = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    const inversa: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

    let acumulador = 0;
    const digitos = numeroCadena.split('').map(Number).reverse();

    for (let i = 0; i < digitos.length; i++) {
        acumulador = tabla[acumulador][permutacion[(i + 1) % 8][digitos[i]]];
    }

    return inversa[acumulador];
}

export function generarCDC(parametros: {
    tipoDocumento: string; // 2 dígitos (ej: 01)
    ruc: string; // 8 dígitos (sin DV)
    dvRuc: string; // 1 dígito
    establecimiento: string; // 3 dígitos
    puntoExpedicion: string; // 3 dígitos
    numero: string; // 7 dígitos
    tipoContribuyente: string; // 1: Persona Física, 2: Jurídica
    fecha: string; // AAAAMMDD
    tipoEmision: string; // 1: Normal, 2: Contingencia
    codigoSeguridad: string; // 9 dígitos aleatorios
}): string {
    // 1. Normalizar longitudes deseadas
    const rucNormalizado = parametros.ruc.replace(/\D/g, '').padStart(8, '0');
    const numeroNormalizado = parametros.numero.padStart(7, '0');
    const codigoSeguridadNormalizado = parametros.codigoSeguridad.padStart(9, '0');

    // 2. Concatenar los 43 dígitos base del CDC
    const base43 = 
        parametros.tipoDocumento + 
        rucNormalizado + 
        parametros.dvRuc + 
        parametros.establecimiento + 
        parametros.puntoExpedicion + 
        numeroNormalizado + 
        parametros.tipoContribuyente + 
        parametros.fecha + 
        parametros.tipoEmision + 
        codigoSeguridadNormalizado;

    // 3. Calcular el Dígito Verificador (DV) usando Verhoeven
    const dvFinal = calcularDigitoVerhoeven(base43);

    return base43 + dvFinal.toString();
}
