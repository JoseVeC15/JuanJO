import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Manejo seguro del import de fuentes
(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : pdfFonts;

const Unidades = (num: number) => {
    switch (num) {
        case 1: return 'UN';
        case 2: return 'DOS';
        case 3: return 'TRES';
        case 4: return 'CUATRO';
        case 5: return 'CINCO';
        case 6: return 'SEIS';
        case 7: return 'SIETE';
        case 8: return 'OCHO';
        case 9: return 'NUEVE';
        default: return '';
    }
};

const Decenas = (num: number) => {
    const decena = Math.floor(num / 10);
    const unidad = num - (decena * 10);
    switch (decena) {
        case 1:
            switch (unidad) {
                case 0: return 'DIEZ';
                case 1: return 'ONCE';
                case 2: return 'DOCE';
                case 3: return 'TRECE';
                case 4: return 'CATORCE';
                case 5: return 'QUINCE';
                default: return 'DIECI' + Unidades(unidad);
            }
        case 2:
            switch (unidad) {
                case 0: return 'VEINTE';
                default: return 'VEINTI' + Unidades(unidad);
            }
        case 3: return DecenasY('TREINTA', unidad);
        case 4: return DecenasY('CUARENTA', unidad);
        case 5: return DecenasY('CINCUENTA', unidad);
        case 6: return DecenasY('SESENTA', unidad);
        case 7: return DecenasY('SETENTA', unidad);
        case 8: return DecenasY('OCHENTA', unidad);
        case 9: return DecenasY('NOVENTA', unidad);
        case 0: return Unidades(unidad);
        default: return '';
    }
};

const DecenasY = (strSin: string, numUnidades: number) => {
    if (numUnidades > 0) return strSin + ' Y ' + Unidades(numUnidades);
    return strSin;
};

const Centenas = (num: number) => {
    const centenas = Math.floor(num / 100);
    const decenas = num - (centenas * 100);
    switch (centenas) {
        case 1:
            if (decenas > 0) return 'CIENTO ' + Decenas(decenas);
            return 'CIEN';
        case 2: return 'DOSCIENTOS ' + Decenas(decenas);
        case 3: return 'TRESCIENTOS ' + Decenas(decenas);
        case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
        case 5: return 'QUINIENTOS ' + Decenas(decenas);
        case 6: return 'SEISCIENTOS ' + Decenas(decenas);
        case 7: return 'SETECIENTOS ' + Decenas(decenas);
        case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
        case 9: return 'NOVECIENTOS ' + Decenas(decenas);
        default: return Decenas(decenas);
    }
};

const Seccion = (num: number, divisor: number, strSingular: string, strPlural: string) => {
    const cientos = Math.floor(num / divisor);
    const resto = num - (cientos * divisor);
    let letras = '';
    if (cientos > 0) {
        if (cientos > 1) {
            letras = Centenas(cientos) + ' ' + strPlural;
        } else {
            letras = strSingular;
        }
    }
    if (resto > 0) {
        letras += '';
    }
    return letras;
};

const Miles = (num: number) => {
    const divisor = 1000;
    const cientos = Math.floor(num / divisor);
    const resto = num - (cientos * divisor);
    const strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
    const strCentenas = Centenas(resto);
    if (strMiles === '') return strCentenas;
    return strMiles + ' ' + strCentenas;
};

const Millones = (num: number) => {
    const divisor = 1000000;
    const cientos = Math.floor(num / divisor);
    const resto = num - (cientos * divisor);
    const strMillones = Seccion(num, divisor, 'UN MILLON', 'MILLONES');
    const strMiles = Miles(resto);
    if (strMillones === '') return strMiles;
    return strMillones + ' ' + strMiles;
};

const numeroALetras = (num: number, moneda: string = 'GUARANÍES') => {
    if (num === 0) return 'CERO ' + moneda;
    const enteros = Math.floor(num);
    return Millones(enteros).trim() + ` ${moneda}`;
};

export const generarPdfAutoimpreso = (factura: any) => {
    
    // Format numbers
    const formatPy = (num: number) => num ? num.toLocaleString('es-PY') : '0';

    const TIPOS_DOC = {
        1: 'FACTURA',
        2: 'AUTOFACTURA',
        5: 'NOTA DE DÉBITO',
        6: 'NOTA DE CRÉDITO'
    };

    const documentTitle = TIPOS_DOC[factura.tipo_documento as keyof typeof TIPOS_DOC] || 'FACTURA';
    const isCredito = factura.condicion_venta?.toLowerCase() === 'credito';

    // Preparar Items para la tabla principal
    const itemsRows = factura.facturas_virtuales_items?.map((item: any, i: number) => [
        { text: `${i + 1}`, style: 'td' }, // Código provisional
        { text: item.descripcion, style: 'td' },
        { text: formatPy(item.precio_unitario), style: 'td', alignment: 'right' },
        { text: item.cantidad, style: 'td', alignment: 'center' },
        { text: formatPy(item.monto_total_item), style: 'td', alignment: 'right' }, // Sub total (precio x cant)
        { text: item.iva_tipo === 0 ? formatPy(item.monto_total_item) : '0', style: 'td', alignment: 'right' },
        { text: item.iva_tipo === 5 ? formatPy(item.monto_total_item) : '0', style: 'td', alignment: 'right' },
        { text: item.iva_tipo === 10 ? formatPy(item.monto_total_item) : '0', style: 'td', alignment: 'right' }
    ]) || [];

    // Llenar filas vacías si hay pocos items (para empujar el subtotales abajo y mantener diseño)
    const minRows = 15;
    for (let i = itemsRows.length; i < minRows; i++) {
        itemsRows.push([
            { text: '\n', style: 'td' }, { text: '', style: 'td' }, { text: '', style: 'td' }, { text: '', style: 'td' }, 
            { text: '', style: 'td' }, { text: '', style: 'td' }, { text: '', style: 'td' }, { text: '', style: 'td' }
        ]);
    }

    const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [20, 20, 20, 20],
        defaultStyle: {
            fontSize: 9,
            lineHeight: 1.1
        },
        content: [
            // Contenedor General (borde absoluto exterior puede simularse con layout table)
            {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                // ================= HEADER =================
                                margin: [0, 0, 0, 0],
                                border: [false, false, false, false], // Sin borde extra interno
                                table: {
                                    widths: ['50%', '50%'],
                                    body: [
                                        [
                                            {
                                                stack: [
                                                    { text: 'FINANCE PRO SA', fontSize: 18, bold: true, color: '#3f51b5', margin: [0, 10, 0, 5] },
                                                    { text: 'SISTEMAS EMPRESARIALES', fontSize: 8, bold: true, margin: [0, 0, 0, 10] },
                                                    { text: `Tel: +595981123456         Dirección: Edificio Central Of. 4`, fontSize: 8 }
                                                ],
                                                border: [false, false, true, true],
                                                margin: [5, 5, 5, 5],
                                                alignment: 'left'
                                            },
                                            {
                                                stack: [
                                                    { text: documentTitle, fontSize: 16, bold: true, margin: [0, 0, 0, 2] },
                                                    { text: factura.numero_documento, fontSize: 12, bold: true, margin: [0, 0, 0, 2] },
                                                    { text: `TIMBRADO: ${factura.timbrado}`, fontSize: 10, margin: [0, 0, 0, 2] },
                                                    { text: `R.U.C: 80000001-2`, fontSize: 10, margin: [0, 0, 0, 2] },
                                                    { text: `VIGENCIA: -`, fontSize: 8 } // Hardcoded vigencia placeholder
                                                ],
                                                border: [false, false, false, true],
                                                margin: [5, 5, 5, 5],
                                                alignment: 'center'
                                            }
                                        ],
                                        // ================= FILA FECHA / CONDICION =================
                                        [
                                            { text: `Fecha: ${factura.fecha_emision.split('-').reverse().join('-')}`, border: [false, false, true, true], margin: [5, 2, 5, 2] },
                                            { text: `Condición: contado(${!isCredito ? 'x' : ' '}) credito(${isCredito ? 'x' : ' '})`, border: [false, false, false, true], margin: [5, 2, 5, 2] }
                                        ],
                                        // ================= FILA RAZON SOCIAL / RUC =================
                                        [
                                            { text: `Razón Social: ${factura.cliente_razon_social}`, border: [false, false, true, false], margin: [5, 2, 5, 2] },
                                            { text: `R.U.C: ${factura.cliente_ruc}`, border: [false, false, false, false], margin: [5, 2, 5, 2] }
                                        ],
                                        // ================= FILA DIRECCION / TEL =================
                                        [
                                            { text: `Dirección: ${factura.cliente_direccion || ''}`, border: [false, false, true, true], margin: [5, 2, 5, 2] },
                                            { text: `Teléfono: `, border: [false, false, false, true], margin: [5, 2, 5, 2] }
                                        ]
                                    ]
                                },
                                layout: {
                                    hLineWidth: () => 1,
                                    vLineWidth: () => 1,
                                    hLineColor: () => '#000',
                                    vLineColor: () => '#000',
                                }
                            }
                        ],
                        [
                            {
                                // ================= MAIN TABLE =================
                                margin: [0, -1, 0, 0], // Evitar doble borde horizontal
                                table: {
                                    headerRows: 1,
                                    widths: ['10%', '35%', '10%', '10%', '10%', '8%', '8%', '9%'],
                                    body: [
                                        // CABESERAS TABLA OBLIGATORIA
                                        [
                                            { text: 'CÓDIGO', style: 'th', alignment: 'center' },
                                            { text: 'DESCRIPCIÓN', style: 'th', alignment: 'left' },
                                            { text: 'PRECIO', style: 'th', alignment: 'center' },
                                            { text: 'CANT.', style: 'th', alignment: 'center' },
                                            { text: 'SUB. TOTAL', style: 'th', alignment: 'center' },
                                            { text: 'EXE.', style: 'th', alignment: 'center' },
                                            { text: 'IVA 5', style: 'th', alignment: 'center' },
                                            { text: 'IVA 10', style: 'th', alignment: 'center' }
                                        ],
                                        // CUERPO (LISTADO)
                                        ...itemsRows,
                                        // FILA SUB TOTAL
                                        [
                                            { text: 'SUB TOTAL', colSpan: 4, bold: true, alignment: 'left', border: [false, true, true, true], margin: [5, 2, 0, 2] },
                                            {},{},{},
                                            { text: formatPy(factura.monto_total), alignment: 'right', bold: true, margin: [0, 2, 5, 2] },
                                            { text: formatPy(factura.total_exenta), alignment: 'right', margin: [0, 2, 5, 2] },
                                            { text: formatPy(factura.facturas_virtuales_items?.filter((i:any)=>i.iva_tipo===5).reduce((s:number,i:any)=>s+i.monto_total_item,0)), alignment: 'right', margin: [0, 2, 5, 2] },
                                            { text: formatPy(factura.facturas_virtuales_items?.filter((i:any)=>i.iva_tipo===10).reduce((s:number,i:any)=>s+i.monto_total_item,0)), alignment: 'right', margin: [0, 2, 5, 2] }
                                        ]
                                    ]
                                },
                                layout: {
                                    hLineWidth: () => 1,
                                    vLineWidth: () => 1,
                                    hLineColor: () => '#000',
                                    vLineColor: () => '#000',
                                }
                            }
                        ],
                        [
                            {
                                // ================= BLOQUE FINAL (Desc, Iva, Total) =================
                                margin: [0, -1, 0, 0],
                                table: {
                                    widths: ['20%', '80%'],
                                    body: [
                                        [
                                            { text: 'DESCUENTO', bold: true, border: [false, false, true, true], margin: [5, 2, 0, 2] },
                                            { text: '0', alignment: 'right', border: [false, false, false, true], margin: [0, 2, 5, 2] }
                                        ],
                                        [
                                            { text: 'LIQUIDACION IVA', bold: true, border: [false, false, true, true], margin: [5, 2, 0, 2] },
                                            { 
                                                text: `IVA 5:         ${formatPy(factura.total_iva_5)}        IVA 10:         ${formatPy(factura.total_iva_10)}        EXENTO:         0        TOTAL IVA:         ${formatPy(factura.total_iva_5 + factura.total_iva_10)}`, 
                                                border: [false, false, false, true], 
                                                margin: [5, 2, 5, 2],
                                                fontSize: 8
                                            }
                                        ],
                                        [
                                            { text: 'TOTAL A PAGAR', bold: true, border: [false, false, true, false], margin: [5, 2, 0, 2] },
                                            {
                                                columns: [
                                                    { text: `(${numeroALetras(factura.monto_total, factura.moneda)})`, width: '80%', alignment: 'left', fontSize: 8, margin: [5, 2, 0, 2] },
                                                    { text: formatPy(factura.monto_total), width: '20%', alignment: 'right', bold: true, margin: [0, 2, 5, 2] }
                                                ],
                                                border: [false, false, false, false]
                                            }
                                        ]
                                    ]
                                },
                                layout: {
                                    hLineWidth: () => 1,
                                    vLineWidth: () => 1,
                                    hLineColor: () => '#000',
                                    vLineColor: () => '#000',
                                }
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#000',
                    vLineColor: () => '#000',
                }
            }
        ],
        styles: {
            th: { bold: true, fontSize: 8, margin: [0, 4, 0, 4] },
            td: { fontSize: 8, margin: [0, 2, 0, 2] }
        }
    };

    pdfMake.createPdf(docDefinition).download(`Documento_${factura.numero_documento}.pdf`);
};
