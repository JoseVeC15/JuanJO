import { jsPDF } from 'jspdf';
import type { TipoComprobante } from '../../data/sampleData';
import { TIPO_COMPROBANTE_CONFIG } from '../../data/sampleData';

/**
 * Generador de PDF para Factura Autoimpreso conforme DNIT Paraguay
 * Regulacion: Decretos 8345/06, 10797/13
 * Diferente del KuDE electronico - no lleva CDC ni QR
 */

export interface ItemAutoimpreso {
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    iva_tipo: number; // 10, 5, 0
    total_item: number;
}

export interface ParametrosAutoimpresoPDF {
    // Datos del emisor
    rucEmisor: string;
    razonSocialEmisor: string;
    nombreFantasia?: string;
    direccionEmisor: string;
    telefonoEmisor?: string;

    // Datos del documento
    tipo_comprobante: TipoComprobante;
    numero_documento: string; // XXX-XXX-XXXXXXX
    timbrado: string;
    vencimiento_timbrado?: string;
    fecha_emision: string;
    establecimiento: string;
    punto_expedicion: string;
    condicion_operacion: string;

    // Datos del receptor
    razon_social_receptor: string;
    ruc_receptor: string;

    // Items y totales
    items: ItemAutoimpreso[];
    subtotal_iva_10: number;
    subtotal_iva_5: number;
    total_exentas: number;
    iva_10: number;
    iva_5: number;
    monto_total: number;

    notas?: string;
}

export function generarPDFAutoimpreso(parametros: ParametrosAutoimpresoPDF) {
    const doc = new jsPDF();
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const margen = 15;
    let y = margen;

    const tipoDoc = TIPO_COMPROBANTE_CONFIG[parametros.tipo_comprobante];

    // ============================================
    // 1. CABECERA - Borde exterior del documento
    // ============================================
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(1.5);
    doc.rect(8, 5, ancho - 16, alto - 10);
    doc.setLineWidth(0.5);
    doc.rect(10, 7, ancho - 20, alto - 14);

    // ============================================
    // 2. SECCION EMISOR
    // ============================================
    y = 14;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(parametros.razonSocialEmisor, margen, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(parametros.nombreFantasia || '', margen, y);
    y += 5;

    doc.setFontSize(8);
    doc.text(`RUC: ${parametros.rucEmisor}`, margen, y);
    y += 5;
    doc.text(parametros.direccionEmisor, margen, y);
    if (parametros.telefonoEmisor) {
        doc.text(`Tel: ${parametros.telefonoEmisor}`, margen, y + 5);
        y += 5;
    }

    // ============================================
    // 3. SECCION TIPO COMPROBANTE (lado derecho)
    // ============================================
    const xDerecho = ancho - margen;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(tipoDoc.label.toUpperCase(), xDerecho, 16, { align: 'right' });

    doc.setFontSize(9);
    doc.text(`N° ${parametros.numero_documento}`, xDerecho, 24, { align: 'right' });

    // ============================================
    // 4. SECCION TIMBRADO
    // ============================================
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.3);
    doc.line(margen, 38, ancho - margen, 38);

    y = 44;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`N° TIMBRADO: ${parametros.timbrado}`, margen, y);
    doc.text(`EST: ${parametros.establecimiento} - P.E.: ${parametros.punto_expedicion}`, xDerecho, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Condicion: ${parametros.condicion_operacion.toUpperCase()}`, margen, y);
    doc.text(`Fecha: ${parametros.fecha_emision}`, xDerecho, y, { align: 'right' });
    if (parametros.vencimiento_timbrado) {
        y += 5;
        doc.setFontSize(7);
        doc.text(`Vto. Timbrado: ${parametros.vencimiento_timbrado}`, margen, y);
    }

    y = 60;
    doc.setDrawColor(60, 60, 60);
    doc.line(margen, y, ancho - margen, y);

    // ============================================
    // 5. DATOS DEL RECEPTOR
    // ============================================
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL RECEPTOR (CLIENTE)', margen, y);
    y += 5;
    doc.setDrawColor(180, 180, 180);
    doc.line(margen, y, ancho - margen, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Razon Social: ${parametros.razon_social_receptor}`, margen, y);
    y += 5;
    doc.text(`RUC: ${parametros.ruc_receptor}`, margen, y);

    // ============================================
    // 6. TABLA DE ITEMS / CONCEPTOS
    // ============================================
    y = 90;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE LA OPERACION', margen, y);
    y += 2;
    doc.line(margen, y, ancho - margen, y);

    // Encabezados
    y += 5;
    doc.setFillColor(243, 244, 246);
    doc.rect(margen, y - 4, ancho - 2 * margen, 8, 'F');
    doc.text('Descripcion', margen + 2, y);
    doc.text('Cant.', 115, y, { align: 'center' });
    doc.text('Precio Unit.', 140, y, { align: 'right' });
    doc.text('IVA', 162, y, { align: 'center' });
    doc.text('Subtotal', ancho - margen - 2, y, { align: 'right' });

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    parametro.items.forEach((item) => {
        if (y > alto - 50) {
            doc.addPage();
            y = 20;
        }
        const lines = doc.splitTextToSize(item.descripcion, 65);
        doc.text(lines[0], margen + 2, y);
        doc.text(item.cantidad.toString(), 115, y, { align: 'center' });
        doc.text(formatGs(item.precio_unitario), 140, y, { align: 'right' });
        doc.text(item.iva_tipo > 0 ? `${item.iva_tipo}%` : 'Exe', 162, y, { align: 'center' });
        doc.text(formatGs(item.total_item), ancho - margen - 2, y, { align: 'right' });
        y += lines.length * 4 + 2;
    });

    // ============================================
    // 7. RESUMEN DE TOTALES
    // ============================================
    const yTotales = Math.max(y + 10, alto - 85);
    const xTotales = ancho - 80;

    // Linea separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(30, 41, 59);
    doc.line(xTotales - 5, yTotales - 3, ancho - margen, yTotales - 3);

    doc.setFontSize(9);
    let yTot = yTotales + 4;

    if (parametros.subtotal_iva_10 > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal IVA 10%:', xTotales, yTot);
        doc.text(formatGs(parametros.subtotal_iva_10), ancho - margen - 2, yTot, { align: 'right' });
        yTot += 5;
        doc.setFontSize(7);
        doc.text(`(IVA: ${formatGs(parametros.iva_10)})`, xTotales + 3, yTot);
        yTot += 5;
        doc.setFontSize(9);
    }

    if (parametros.subtotal_iva_5 > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal IVA 5%:', xTotales, yTot);
        doc.text(formatGs(parametros.subtotal_iva_5), ancho - margen - 2, yTot, { align: 'right' });
        yTot += 5;
        doc.setFontSize(7);
        doc.text(`(IVA: ${formatGs(parametros.iva_5)})`, xTotales + 3, yTot);
        yTot += 5;
        doc.setFontSize(9);
    }

    if (parametros.total_exentas > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text('Ventas Exentas:', xTotales, yTot);
        doc.text(formatGs(parametros.total_exentas), ancho - margen - 2, yTot, { align: 'right' });
        yTot += 5;
    }

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.7);
    doc.line(xTotales - 5, yTot - 2, ancho - margen, yTot - 2);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL GENERAL:', xTotales, yTot + 5);
    doc.text(formatGs(parametros.monto_total), ancho - margen - 2, yTot + 5, { align: 'right' });

    // ============================================
    // 8. PIE LEGAL (DNIT - Autoimpreso)
    // ============================================
    const yPie = alto - 30;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(margen, yPie, ancho - margen, yPie);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    doc.text('Documento autorizado por la Direccion Nacional de Impuestos y Tributos (DNIT)', 105, yPie + 5, { align: 'center' });
    doc.text(`Timbrado N° ${parametros.timbrado} - ${parametros.establecimiento}-${parametros.punto_expedicion}`, 105, yPie + 10, { align: 'center' });
    doc.text('Este documento es comprobante fiscal valido conforme Decretos 8345/06 y 10797/13', 105, yPie + 15, { align: 'center' });

    if (parametros.notas) {
        doc.setFontSize(7);
        doc.text(`Notas: ${parametros.notas}`, margen, alto - 10);
    }

    // ============================================
    // GUARDAR
    // ============================================
    const sigla = tipoDoc.sigla;
    doc.save(`${sigla}_${parametros.numero_documento}_${parametros.fecha_emision}.pdf`);
}

function formatGs(monto: number): string {
    return 'Gs. ' + monto.toLocaleString('es-PY');
}
