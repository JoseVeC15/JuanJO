import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generador de KuDE (Kueatia Digital de la Escritura) - Finance Pro 🇵🇾
 * Genera la representación gráfica legal de la factura electrónica.
 */

export interface KuDEParams {
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
    items: {
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        ivaTipo: number;
        totalItem: number;
    }[];
    montoTotal: number;
    ambiente: 'TEST' | 'PROD';
}

export async function generateKuDE(params: KuDEParams) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Cabecera - Estilo Finance Pro
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(params.razonSocialEmisor, 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${params.rucEmisor}`, 15, 28);
    doc.text(params.direccionEmisor, 15, 33);

    doc.setFontSize(16);
    doc.text('FACTURA ELECTRÓNICA', pageWidth - 15, 20, { align: 'right' });
    doc.setFontSize(12);
    doc.text(params.numeroFactura, pageWidth - 15, 28, { align: 'right' });

    // 2. Datos del Documento
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL RECEPTOR', 15, 55);
    doc.line(15, 57, pageWidth - 15, 57);

    doc.setFont('helvetica', 'normal');
    doc.text(`Razón Social: ${params.razonSocialReceptor}`, 15, 65);
    doc.text(`RUC: ${params.rucReceptor}`, 15, 72);
    doc.text(`Fecha: ${params.fechaEmision}`, pageWidth - 15, 65, { align: 'right' });

    // 3. Tabla de ítems
    let yPos = 85;
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción', 18, yPos + 6);
    doc.text('Cant.', 110, yPos + 6, { align: 'center' });
    doc.text('Precio Unit.', 145, yPos + 6, { align: 'right' });
    doc.text('Subtotal', pageWidth - 18, yPos + 6, { align: 'right' });

    yPos += 15;
    doc.setFont('helvetica', 'normal');
    params.items.forEach((item) => {
        doc.text(item.descripcion, 18, yPos);
        doc.text(item.cantidad.toString(), 110, yPos, { align: 'center' });
        doc.text(item.precioUnitario.toLocaleString(), 145, yPos, { align: 'right' });
        doc.text(item.totalItem.toLocaleString(), pageWidth - 18, yPos, { align: 'right' });
        yPos += 10;
    });

    // 4. Totales
    yPos += 10;
    doc.line(pageWidth - 80, yPos, pageWidth - 15, yPos);
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL GENERAL:', pageWidth - 80, yPos);
    doc.text(`G. ${params.montoTotal.toLocaleString()}`, pageWidth - 18, yPos, { align: 'right' });

    // 5. Pie de página - CDC y QR Legal
    const footerY = doc.internal.pageSize.getHeight() - 60;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate 400
    doc.text('ESTE DOCUMENTO ES UNA REPRESENTACIÓN GRÁFICA DE UN COMPROBANTE ELECTRÓNICO', 15, footerY);
    doc.setFont('helvetica', 'bold');
    doc.text(`CDC: ${params.cdc}`, 15, footerY + 5);

    if (params.ambiente === 'TEST') {
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(12);
        doc.text('*** SIN VALIDEZ TRIBUTARIA - AMBIENTE DE PRUEBAS ***', pageWidth / 2, footerY + 15, { align: 'center' });
    }

    // Generar Código QR (DNIT exige URL de consulta con el CDC)
    const qrUrl = `https://sifen${params.ambiente === 'TEST' ? '-test' : ''}.set.gov.py/consulta/qr?cdc=${params.cdc}`;
    const qrImage = await QRCode.toDataURL(qrUrl);
    doc.addImage(qrImage, 'PNG', pageWidth - 45, footerY - 5, 30, 30);

    // Descargar
    doc.save(`KuDE_${params.numeroFactura}.pdf`);
}
