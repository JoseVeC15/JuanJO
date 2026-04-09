import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generarPdfAutoimpreso = (factura: any) => {
    
    // Format numbers
    const formatPy = (num: number) => num.toLocaleString('es-PY');

    const TIPOS_DOC = {
        1: 'FACTURA',
        2: 'AUTOFACTURA',
        5: 'NOTA DE DÉBITO',
        6: 'NOTA DE CRÉDITO'
    };

    const isNota = factura.tipo_documento === 5 || factura.tipo_documento === 6;
    const documentTitle = TIPOS_DOC[factura.tipo_documento as keyof typeof TIPOS_DOC] || 'DOCUMENTO';

    const itemsRows = factura.facturas_virtuales_items?.map((item: any) => [
        item.cantidad,
        item.descripcion,
        formatPy(item.precio_unitario),
        item.iva_tipo === 0 ? formatPy(item.monto_total_item) : '',
        item.iva_tipo === 5 ? formatPy(item.monto_total_item) : '',
        item.iva_tipo === 10 ? formatPy(item.monto_total_item) : ''
    ]) || [];

    const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        content: [
            // Cabecera Principal (Dos columnas: Datos Empresa y Cuadro Legal SET)
            {
                columns: [
                    {
                        width: '60%',
                        stack: [
                            { text: 'NOMBRE AL FANTASIA SA', style: 'empresaNombre' },
                            { text: 'Actividades de consultoría empresarial y otras.', style: 'empresaRubro' },
                            { text: 'Dirección: Avda. Siempre Viva 123 - Asunción, Paraguay', style: 'empresaDetalle' },
                            { text: 'Tel: +595 981 123 456\nEmail: info@empresa.com.py', style: 'empresaDetalle' }
                        ],
                        margin: [0, 0, 10, 0]
                    },
                    {
                        width: '40%',
                        table: {
                            widths: ['*'],
                            body: [
                                [
                                    {
                                        stack: [
                                            { text: `TIMBRADO N°: ${factura.timbrado}`, alignment: 'center', style: 'timbrado' },
                                            { text: 'Válido hasta: 31/12/2026', alignment: 'center', margin: [0, 2, 0, 2], fontSize: 8 },
                                            { text: `RUC: 80000001-2`, alignment: 'center', style: 'rucEmisor' },
                                            { text: `${documentTitle}`, alignment: 'center', style: 'tipoDoc' },
                                            { text: `N° ${factura.numero_documento}`, alignment: 'center', style: 'nroDoc' }
                                        ],
                                        margin: [5, 5, 5, 5]
                                    }
                                ]
                            ]
                        },
                        layout: {
                            hLineWidth: () => 1,
                            vLineWidth: () => 1,
                            hLineColor: () => '#000000',
                            vLineColor: () => '#000000',
                        }
                    }
                ],
                margin: [0, 0, 0, 15]
            },

            // Cuadro Datos de Operación (Asociado) si es Nota de Crédito/Débito
            ...(isNota ? [{
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                text: [
                                    { text: 'COMPROBANTE ORIGINAL ASOCIADO\n', bold: true, fontSize: 10 },
                                    { text: `N° Comprobante: ${factura.asociado_numero}   Timbrado: ${factura.asociado_timbrado}   Fecha: ${factura.asociado_fecha || ''}\n`, fontSize: 9 },
                                    { text: `Motivo: ${factura.motivo_modificacion || 'Modificación / Ajuste'}`, fontSize: 9 }
                                ],
                                fillColor: '#f8f8f8',
                                margin: [5, 5, 5, 5]
                            }
                        ]
                    ]
                },
                margin: [0, 0, 0, 10]
            }] : []),

            // Datos del Cliente (Receptor)
            {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                columns: [
                                    { width: '70%', text: `Fecha de Emisión: ${new Date(factura.fecha_emision).toLocaleDateString('es-PY')}\nSeñor/es o Razón Social: ${factura.cliente_razon_social}\nDirección: ${factura.cliente_direccion || ''}`, fontSize: 9, lineHeight: 1.3 },
                                    { width: '30%', text: `Condición de Venta: ${factura.condicion_venta.toUpperCase()}\nRUC/CI: ${factura.cliente_ruc}`, fontSize: 9, lineHeight: 1.3 }
                                ],
                                margin: [5, 5, 5, 5]
                            }
                        ]
                    ]
                },
                layout: 'lightHorizontalLines', // Para que parezca formulario impreso
                margin: [0, 0, 0, 15]
            },

            // Detalles y Montos
            {
                table: {
                    headerRows: 1,
                    widths: ['10%', '45%', '15%', '10%', '10%', '10%'],
                    body: [
                        // Headers
                        [
                            { text: 'CANT.', style: 'th', alignment: 'center' },
                            { text: 'DESCRIPCIÓN', style: 'th', alignment: 'center' },
                            { text: 'PRECIO UNIT.', style: 'th', alignment: 'center' },
                            { text: 'EXENTO', style: 'th', alignment: 'center' },
                            { text: '5%', style: 'th', alignment: 'center' },
                            { text: '10%', style: 'th', alignment: 'center' }
                        ],
                        ...itemsRows,
                        // Fill empty rows to make it look like a standard invoice block if few items
                        ...(itemsRows.length < 5 ? Array.from({length: 5 - itemsRows.length}).map(() => [{text: '\n', border: [true, false, true, false]}, {text:'', border: [true, false, true, false]}, {text:'', border: [true, false, true, false]}, {text:'', border: [true, false, true, false]}, {text:'', border: [true, false, true, false]}, {text:'', border: [true, false, true, false]}]) : []),
                        
                        // Fila de Subtotales (Obligatorio SET)
                        [
                            { text: 'SUBTOTALES', colSpan: 3, alignment: 'right', bold: true, fontSize: 9, margin: [0, 2, 5, 2] },
                            {},
                            {},
                            { text: formatPy(factura.total_exenta || 0), alignment: 'right', fontSize: 9, margin: [0, 2, 0, 2] },
                            { text: formatPy((factura.facturas_virtuales_items?.filter((i:any)=>i.iva_tipo===5).reduce((s:number,i:any)=>s+i.monto_total_item,0)) || 0), alignment: 'right', fontSize: 9, margin: [0, 2, 0, 2] },
                            { text: formatPy((factura.facturas_virtuales_items?.filter((i:any)=>i.iva_tipo===10).reduce((s:number,i:any)=>s+i.monto_total_item,0)) || 0), alignment: 'right', fontSize: 9, margin: [0, 2, 0, 2] }
                        ],

                        // Fila de Total
                        [
                            { text: `TOTAL GENERAL ANOTADO EN ${factura.moneda}`, colSpan: 5, bold: true, fontSize: 10, alignment: 'left', margin: [0, 5, 5, 5] },
                            {}, {}, {}, {},
                            { text: formatPy(factura.monto_total), alignment: 'right', bold: true, fontSize: 10, margin: [0, 5, 0, 5] }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length - 2 || i === node.table.body.length - 1 || i === node.table.body.length) ? 1 : 0,
                    vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 1 : 1,
                    hLineColor: () => '#000000',
                    vLineColor: () => '#000000',
                },
                margin: [0, 0, 0, 10]
            },

            // Cuadro de Liquidación de IVA (Obligatorio SET)
            {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                columns: [
                                    { text: `LIQUIDACIÓN DEL IVA:`, bold: true, fontSize: 9, width: '25%' },
                                    { text: `(5%): ${formatPy(factura.total_iva_5 || 0)}`, fontSize: 9, width: '25%' },
                                    { text: `(10%): ${formatPy(factura.total_iva_10 || 0)}`, fontSize: 9, width: '25%' },
                                    { text: `TOTAL IVA: ${formatPy((factura.total_iva_5 || 0) + (factura.total_iva_10 || 0))}`, bold: true, fontSize: 9, width: '25%' }
                                ],
                                margin: [2, 2, 2, 2]
                            }
                        ]
                    ]
                },
                layout: 'lightHorizontalLines'
            },
            
            // Si es moneda extranjera
            ...(factura.moneda !== 'PYG' ? [{
                 text: `* Tipo de Cambio referencial (Ley 6380): 1 ${factura.moneda} = ${formatPy(factura.tasa_cambio)} PYG`,
                 fontSize: 8,
                 color: '#555',
                 margin: [0, 5, 0, 0]
            }] : []),

            // Marca de agua genérica
            {
                text: 'REPRESENTACIÓN GRÁFICA — USO VIRTUAL',
                alignment: 'center',
                color: '#cccccc',
                fontSize: 10,
                bold: true,
                margin: [0, 20, 0, 0]
            }
        ],
        styles: {
            empresaNombre: { fontSize: 16, bold: true, margin: [0, 0, 0, 2] },
            empresaRubro: { fontSize: 9, italics: true, color: '#333333', margin: [0, 0, 0, 5] },
            empresaDetalle: { fontSize: 8, color: '#555555' },
            timbrado: { fontSize: 11, bold: true },
            rucEmisor: { fontSize: 12, bold: true, margin: [0, 2, 0, 4] },
            tipoDoc: { fontSize: 12, bold: true, margin: [0, 0, 0, 2] },
            nroDoc: { fontSize: 14, bold: true, color: '#aa0000' },
            th: { bold: true, fontSize: 9, fillColor: '#eeeeee', color: '#000000', margin: [0, 5, 0, 5] },
            td: { fontSize: 9, margin: [0, 2, 0, 2] }
        }
    };

    pdfMake.createPdf(docDefinition).download(`DocumentoLegal_${factura.numero_documento}.pdf`);
};
