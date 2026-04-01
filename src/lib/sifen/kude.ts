import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generador de KuDE (Kueatia Digital de la Escritura) - Finance Pro 🇵🇾
 * Genera la representación gráfica legal de la factura electrónica.
 */

/**
 * Generador de KuDE (Kueatia Digital de la Escritura) - Finance Pro 🇵🇾
 * Genera la representación gráfica legal de la factura electrónica.
 */

export interface ParametrosKuDE {
    razonSocialEmisor: string;
    rucEmisor: string;
    direccionEmisor: string;
    telefonoEmisor?: string;
    numeroFactura: string;
    timbrado: string;
    fechaEmision: string;
    cdc: string;
    razonSocialReceptor: string;
    rucReceptor: string;
    productos: {
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        ivaTipo: number;
        totalItem: number;
    }[];
    montoTotal: number;
    ambiente: 'TEST' | 'PROD';
}

export async function generarKuDE(parametros: ParametrosKuDE) {
    const doc = new jsPDF();
    const anchoPagina = doc.internal.pageSize.getWidth();

    // 1. Cabecera - Estilo Finance Pro Premium
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, anchoPagina, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(parametros.razonSocialEmisor, 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${parametros.rucEmisor}`, 15, 28);
    doc.text(parametros.direccionEmisor, 15, 33);

    doc.setFontSize(16);
    doc.text('FACTURA ELECTRÓNICA', anchoPagina - 15, 20, { align: 'right' });
    doc.setFontSize(12);
    doc.text(parametros.numeroFactura, anchoPagina - 15, 28, { align: 'right' });

    // 2. Datos del Documento y Receptor
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL RECEPTOR (CLIENTE)', 15, 55);
    doc.line(15, 57, anchoPagina - 15, 57);

    doc.setFont('helvetica', 'normal');
    doc.text(`Razón Social: ${parametros.razonSocialReceptor}`, 15, 65);
    doc.text(`RUC: ${parametros.rucReceptor}`, 15, 72);
    doc.text(`Fecha Emisión: ${parametros.fechaEmision}`, anchoPagina - 15, 65, { align: 'right' });

    // 3. Tabla de Productos y Servicios
    let yPosicion = 85;
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.rect(15, yPosicion, anchoPagina - 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción / Concepto', 18, yPosicion + 6);
    doc.text('Cant.', 110, yPosicion + 6, { align: 'center' });
    doc.text('Precio Unit.', 145, yPosicion + 6, { align: 'right' });
    doc.text('Subtotal', anchoPagina - 18, yPosicion + 6, { align: 'right' });

    yPosicion += 15;
    doc.setFont('helvetica', 'normal');
    parametros.productos.forEach((producto) => {
        doc.text(producto.descripcion, 18, yPosicion);
        doc.text(producto.cantidad.toString(), 110, yPosicion, { align: 'center' });
        doc.text(producto.precioUnitario.toLocaleString(), 145, yPosicion, { align: 'right' });
        doc.text(producto.totalItem.toLocaleString(), anchoPagina - 18, yPosicion, { align: 'right' });
        yPosicion += 10;
    });

    // 4. Resumen de Totales
    yPosicion += 10;
    doc.line(anchoPagina - 80, yPosicion, anchoPagina - 15, yPosicion);
    yPosicion += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL GENERAL:', anchoPagina - 80, yPosicion);
    doc.text(`₲ ${parametros.montoTotal.toLocaleString()}`, anchoPagina - 18, yPosicion, { align: 'right' });

    // 5. Pie de página - CDC y QR Oficial DNIT
    const yPie = doc.internal.pageSize.getHeight() - 60;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate 400
    doc.text('ESTE DOCUMENTO ES UNA REPRESENTACIÓN GRÁFICA DE UN COMPROBANTE ELECTRÓNICO (KuDE)', 15, yPie);
    doc.setFont('helvetica', 'bold');
    doc.text(`CDC: ${parametros.cdc}`, 15, yPie + 5);

    if (parametros.ambiente === 'TEST') {
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(12);
        doc.text('*** SIN VALIDEZ TRIBUTARIA - AMBIENTE DE PRUEBAS SIFEN ***', anchoPagina / 2, yPie + 15, { align: 'center' });
    }

    // Generar Código QR (La DNIT exige URL de consulta oficial con el CDC)
    const urlQR = `https://sifen${parametros.ambiente === 'TEST' ? '-test' : ''}.set.gov.py/consulta/qr?cdc=${parametros.cdc}`;
    const imagenQR = await QRCode.toDataURL(urlQR);
    doc.addImage(imagenQR, 'PNG', anchoPagina - 45, yPie - 5, 30, 30);

    // Guardar/Descargar
    doc.save(`KuDE_${parametros.numeroFactura}.pdf`);
}
