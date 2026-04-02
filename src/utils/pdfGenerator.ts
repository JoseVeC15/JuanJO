import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import type { Propuesta, PropuestaItem, Profile } from '../data/sampleData';

interface GeneratePDFParams {
  propuesta: Propuesta & { propuesta_items: PropuestaItem[] };
  profile: Profile;
}

export async function generateProposalPDF({ propuesta, profile }: GeneratePDFParams) {
  const doc = new jsPDF() as any;
  const primaryColor = profile.color_primario || '#0f172a';
  
  // --- CABECERA ---
  // Fondo decorativo arriba
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Nombre de la Empresa / Freelancer
  doc.setTextColor('#ffffff');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.nombre_completo || 'FREELANCER', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(profile.email || '', 20, 32);

  // Logo (si existe)
  if (profile.logo_url) {
    try {
      doc.addImage(profile.logo_url, 'PNG', 160, 10, 30, 30);
    } catch (e) {
      console.warn("No se pudo cargar el logo:", e);
    }
  }

  // --- DATOS DEL PRESUPUESTO ---
  doc.setTextColor('#1e293b');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESUPUESTO', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#64748b');
  doc.text(`Nro: PRE-${propuesta.numero_correlativo.toString().padStart(4, '0')}`, 20, 62);
  doc.text(`Fecha: ${new Date(propuesta.created_at).toLocaleDateString()}`, 20, 67);
  doc.text(`Válido hasta: ${new Date(propuesta.valido_hasta).toLocaleDateString()}`, 20, 72);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#1e293b');
  doc.text('TÍTULO DEL PROYECTO:', 120, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(propuesta.titulo.toUpperCase(), 120, 67);

  // --- TABLA DE ITEMS ---
  const tableData = propuesta.propuesta_items.map(item => [
    item.descripcion,
    item.cantidad.toString(),
    item.iva_tipo === 0 ? 'Exenta' : `${item.iva_tipo}%`,
    item.precio_unitario.toLocaleString() + ' Gs.',
    (item.cantidad * item.precio_unitario).toLocaleString() + ' Gs.'
  ]);

  (doc as any).autoTable({
    startY: 85,
    head: [['Descripción', 'Cant.', 'IVA', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    headStyles: { 
      fillColor: primaryColor, 
      textColor: '#ffffff',
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: { 
      fontSize: 9,
      textColor: '#334155'
    },
    alternateRowStyles: { 
      fillColor: '#f8fafc' 
    },
    margin: { left: 20, right: 20 }
  });

  // --- RESUMEN DE TOTALES ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal Neto:', 140, finalY);
  doc.text(propuesta.total_neto.toLocaleString() + ' Gs.', 190, finalY, { align: 'right' });
  
  doc.text('IVA 5%:', 140, finalY + 7);
  doc.text(propuesta.total_iva_5.toLocaleString() + ' Gs.', 190, finalY + 7, { align: 'right' });
  
  doc.text('IVA 10%:', 140, finalY + 14);
  doc.text(propuesta.total_iva_10.toLocaleString() + ' Gs.', 190, finalY + 14, { align: 'right' });

  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(140, finalY + 18, 190, finalY + 18);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL GENERAL:', 140, finalY + 25);
  doc.text(propuesta.total_bruto.toLocaleString() + ' Gs.', 190, finalY + 25, { align: 'right' });

  // --- NOTAS Y CÓDIGO QR ---
  const bottomY = 240;
  
  if (propuesta.notas_condiciones) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTAS Y CONDICIONES:', 20, bottomY - 30);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#64748b');
    const splitNotes = doc.splitTextToSize(propuesta.notas_condiciones, 100);
    doc.text(splitNotes, 20, bottomY - 24);
  }

  // Generar QR para el portafolio
  if (profile.portfolio_url) {
    try {
      const qrDataUrl = await QRCode.toDataURL(profile.portfolio_url, {
        margin: 1,
        color: {
          dark: primaryColor,
          light: '#ffffff'
        }
      });
      
      doc.addImage(qrDataUrl, 'PNG', 150, bottomY - 10, 40, 40);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('ESCANEA PARA VER', 170, bottomY + 35, { align: 'center' });
      doc.text('MI PORTAFOLIO', 170, bottomY + 39, { align: 'center' });
    } catch (e) {
      console.error("Error al generar QR:", e);
    }
  }

  // Pie de página
  doc.setFontSize(8);
  doc.setTextColor('#94a3b8');
  doc.text(profile.direccion_fisica || 'Asunción, Paraguay', 20, 285);
  doc.text(`WhatsApp: ${profile.telefono_contacto || ''}`, 20, 290);
  
  // Guardar PDF
  doc.save(`Presupuesto_${propuesta.numero_correlativo}_${propuesta.titulo.replace(/\s/g, '_')}.pdf`);
}
