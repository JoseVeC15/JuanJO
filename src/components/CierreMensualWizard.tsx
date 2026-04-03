import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, AlertCircle, Receipt,
    ChevronLeft, ChevronRight,
    Calculator, ShieldCheck, Download, Loader2,
    Lock, Unlock, History, AlertTriangle, PieChart
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { formatGs } from '../data/sampleData';

const STEPS = [
    { id: 'ingresos', title: 'Auditoría de Ventas', icon: <Receipt size={18} /> },
    { id: 'gastos', title: 'Auditoría de Compras', icon: <Calculator size={18} /> },
    { id: 'fiscal', title: 'Liquidación SET', icon: <ShieldCheck size={18} /> },
    { id: 'confirmacion', title: 'Cierre Legal', icon: <Lock size={18} /> },
];

export default function CierreMensualWizard() {
    const { 
        facturasGastos, ingresos, 
        loading, ejecutarCierre, cierresPeriodos,
        profile, reabrirPeriodo, perfilFiscal
    } = useSupabaseData();
    
    const [currentStep, setCurrentStep] = useState(0);
    const [isFinishing, setIsFinishing] = useState(false);
    const [view, setView] = useState<'wizard' | 'history'>('wizard');
    const [reopenReason, setReopenReason] = useState('');
    const [showReopenModal, setShowReopenModal] = useState<string | null>(null);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // --- LÓGICA DE AUDITORÍA SET ---

    // 1. Desglose de Ventas (SIFEN + Manual)
    const statsVentas = useMemo(() => {
        const delMes = ingresos.filter(i => {
            const d = new Date(i.fecha || i.fecha_emision || '');
            return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
        });

        return {
            total: delMes.reduce((s, i) => s + Number(i.monto), 0),
            v10: delMes.reduce((s, i) => s + Number(i.iva_10 || 0), 0) * 10, // Base imponible = IVA * 10
            v5: delMes.reduce((s, i) => s + Number(i.iva_5 || 0), 0) * 20,  // Base imponible = IVA * 20
            ex: delMes.reduce((s, i) => s + Number(i.exentas || 0), 0),
            iva10: delMes.reduce((s, i) => s + Number(i.iva_10 || 0), 0),
            iva5: delMes.reduce((s, i) => s + Number(i.iva_5 || 0), 0),
            count: delMes.length
        };
    }, [ingresos, currentMonth, currentYear]);

    // 2. Desglose de Compras (OCR + Manual)
    const statsCompras = useMemo(() => {
        const delMes = facturasGastos.filter(g => {
            const d = new Date(g.fecha_factura);
            return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
        });

        return {
            total: delMes.reduce((s, g) => s + Number(g.monto), 0),
            c10: delMes.reduce((s, g) => s + Number(g.iva_10 || 0), 0) * 10,
            c5: delMes.reduce((s, g) => s + Number(g.iva_5 || 0), 0) * 20,
            ex: delMes.reduce((s, g) => s + Number(g.exentas || 0), 0),
            iva10: delMes.reduce((s, g) => s + Number(g.iva_10 || 0), 0),
            iva5: delMes.reduce((s, g) => s + Number(g.iva_5 || 0), 0),
            count: delMes.length,
            pendientes: delMes.filter(g => g.estado === 'pendiente_clasificar').length
        };
    }, [facturasGastos, currentMonth, currentYear]);

    // 3. Arrastre de Saldo del Mes Anterior (DNIT v4)
    const saldoArrastrado = useMemo(() => {
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const cierrePrevio = cierresPeriodos.find(c => c.mes === prevMonth && c.anio === prevYear);
        return cierrePrevio ? Number(cierrePrevio.saldo_a_favor_contribuyente || 0) : 0;
    }, [cierresPeriodos, currentMonth, currentYear]);

    const ivaDebitoTotal = statsVentas.iva10 + statsVentas.iva5;
    const ivaCreditoTotal = statsCompras.iva10 + statsCompras.iva5 + saldoArrastrado;
    const saldoTecnico = ivaDebitoTotal - ivaCreditoTotal;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(v => v + 1);
        else finalizeCierre();
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(v => v - 1);
    };

    const finalizeCierre = async () => {
        setIsFinishing(true);
        try {
            const dataCierre = {
                mes: currentMonth,
                anio: currentYear,
                ventas_10: statsVentas.v10,
                ventas_5: statsVentas.v5,
                ventas_exentas: statsVentas.ex,
                compras_10: statsCompras.c10,
                compras_5: statsCompras.c5,
                compras_exentas: statsCompras.ex,
                iva_debito_total: ivaDebitoTotal,
                iva_credito_total: ivaCreditoTotal,
                saldo_arrastrado: saldoArrastrado,
                saldo_a_favor_contribuyente: saldoTecnico < 0 ? Math.abs(saldoTecnico) : 0,
                saldo_a_favor_fisco: saldoTecnico > 0 ? saldoTecnico : 0,
            };
            
            await ejecutarCierre(dataCierre);
            generarPDFReporte(dataCierre);
            alert("¡Periodo Fiscal cerrado y bloqueado con éxito!");
            setView('history');
        } catch (error) {
            console.error(error);
            alert("Error al procesar el cierre legal.");
        } finally {
            setIsFinishing(false);
        }
    };

    const generarPDFReporte = (datos: any) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = 20;

        // --- ENCABEZADO ESTILO OFICIAL ---
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, y, pageWidth - (margin * 2), 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('FORMULARIO 120 v.4 - PROFORMA DE DECLARACIÓN JURADA (IVA)', margin + 5, y + 10);
        y += 20;

        // Info Contribuyente
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.text(`CONTRIBUYENTE: ${profile?.nombre_completo || 'N/A'}`, margin, y);
        doc.text(`RUC: ${perfilFiscal?.ruc || 'N/A'}`, margin + 100, y);
        y += 5;
        doc.text(`PERIODO FISCAL: ${datos.mes}/${datos.anio}`, margin, y);
        doc.text(`FECHA DE CIERRE: ${new Date().toLocaleDateString('es-PY')}`, margin + 100, y);
        y += 10;

        const drawRubroHeader = (titulo: string) => {
            doc.setFillColor(241, 245, 249);
            doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(titulo, margin + 2, y + 5);
            y += 12;
        };

        const drawCasilla = (numero: string, descripcion: string, monto: number | string, isTotal = false) => {
            doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text(numero, margin, y);
            doc.text(descripcion, margin + 10, y);
            doc.setFont('courier', 'bold');
            doc.text(String(monto).padStart(15, ' '), pageWidth - margin - 35, y);
            y += 6;
        };

        // RUBRO 1: VENTAS (DÉBITO)
        drawRubroHeader('RUBRO 1: ENAJENACIÓN DE BIENES Y PRESTACIÓN DE SERVICIOS (DÉBITO FISCAL)');
        drawCasilla('C10', 'Enajenación de bienes y/o prestación de servicios gravados con la tasa del 10%', formatGs(datos.ventas_10));
        drawCasilla('C11', 'Enajenación de bienes y/o prestación de servicios gravados con la tasa del 5%', formatGs(datos.ventas_5));
        drawCasilla('C12', 'Enajenación de bienes y/o prestación de servicios exonerados (Exentas)', formatGs(datos.ventas_exentas));
        y += 2;
        doc.setLineWidth(0.1);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
        drawCasilla('C15', 'TOTAL IMPUESTO DEVENGADO (DÉBITO FISCAL DEL MES)', formatGs(datos.iva_debito_total), true);
        y += 5;

        // RUBRO 2: COMPRAS (CRÉDITO)
        drawRubroHeader('RUBRO 2: COMPRAS LOCALES E IMPORTACIONES (CRÉDITO FISCAL)');
        drawCasilla('C28', 'Compras locales gravadas con la tasa del 10%', formatGs(datos.compras_10));
        drawCasilla('C29', 'Compras locales gravadas con la tasa del 5%', formatGs(datos.compras_5));
        drawCasilla('C30', 'Compras locales y/o importaciones exoneradas (Exentas)', formatGs(datos.compras_exentas));
        y += 2;
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
        drawCasilla('C35', 'TOTAL IMPUESTO ACREDITABLE (CRÉDITO FISCAL DEL MES)', formatGs(datos.compras_10 * 0.1 + datos.compras_5 * 0.05), true);
        y += 5;

        // RUBRO 3: LIQUIDACIÓN
        drawRubroHeader('RUBRO 3: LIQUIDACIÓN Y DETERMINACIÓN DEL IMPUESTO');
        drawCasilla('C56', 'Saldo a favor del contribuyente (Periodo Anterior)', formatGs(datos.saldo_arrastrado));
        y += 4;
        
        const saldoFisco = datos.saldo_a_favor_fisco;
        const saldoContribuyente = datos.saldo_a_favor_contribuyente;

        if (saldoFisco > 0) {
            drawCasilla('C89', 'SALDO TÉCNICO A FAVOR DEL FISCO', formatGs(saldoFisco), true);
        } else {
            drawCasilla('C90', 'SALDO TÉCNICO A FAVOR DEL CONTRIBUYENTE', formatGs(saldoContribuyente), true);
        }

        // --- PIE DE PÁGINA Y VALIDACIÓN ---
        y = 260;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        const disclaimer = 'Este documento es una proforma generada por Finance Pro para facilitar el llenado del Formulario 120 v.4 en el Sistema Marangatú. No constituye una declaración jurada oficial ante la DNIT.';
        doc.text(doc.splitTextToSize(disclaimer, pageWidth - (margin * 2)), margin, y);
        
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.text(`Identificador de Auditoría: ${Math.random().toString(36).substring(2, 15).toUpperCase()}`, margin, y);
        doc.text('Página 1 de 1', pageWidth - margin - 15, y);

        doc.save(`F120_V4_PROFORMA_${datos.mes}_${datos.anio}.pdf`);
    };

    if (loading) return null;

    if (view === 'history') {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <History size={24} className="text-indigo-500" /> Historial de Cierres SET
                    </h2>
                    <button 
                        onClick={() => setView('wizard')}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg"
                    >
                        + Nuevo Cierre
                    </button>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Periodo</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Result. IVA</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {cierresPeriodos.length === 0 ? (
                                <tr><td colSpan={4} className="p-20 text-center text-slate-400 italic">No hay cierres registrados.</td></tr>
                            ) : cierresPeriodos.map((c: any) => (
                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 font-black text-slate-700">{c.mes.toString().padStart(2, '0')}/{c.anio}</td>
                                    <td className="p-6 font-bold text-slate-900">{formatGs(c.saldo_a_favor_fisco || c.saldo_a_favor_contribuyente)}</td>
                                    <td className="p-6">
                                        {c.bloqueado ? (
                                            <span className="flex items-center gap-1.5 text-rose-600 font-black text-[9px] uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full w-fit">
                                                <Lock size={10} /> Bloqueado
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit">
                                                <Unlock size={10} /> Abierto
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right space-x-2">
                                        <button 
                                            onClick={() => generarPDFReporte(c)}
                                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Descargar Reporte"
                                        >
                                            <Download size={18} />
                                        </button>
                                        {c.bloqueado && profile?.nivel_acceso === 1 && (
                                            <button 
                                                onClick={() => setShowReopenModal(c.id)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Reabrir Periodo (Superadmin)"
                                            >
                                                <Unlock size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showReopenModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full space-y-6 shadow-2xl">
                            <div className="flex items-center gap-3 text-rose-600">
                                <AlertTriangle size={24} />
                                <h3 className="text-xl font-black uppercase tracking-tight">Reapertura de Periodo</h3>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">Esta acción desbloqueará la edición de facturas del periodo seleccionado. **Quedará registrado en la bitácora de auditoría.**</p>
                            <textarea 
                                placeholder="Motivo de la reapertura..."
                                value={reopenReason}
                                onChange={(e) => setReopenReason(e.target.value)}
                                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm outline-none focus:ring-2 focus:ring-rose-500/20"
                                rows={3}
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowReopenModal(null)} className="flex-1 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Cancelar</button>
                                <button 
                                    onClick={() => {
                                        reabrirPeriodo(showReopenModal, reopenReason);
                                        setShowReopenModal(null);
                                        setReopenReason('');
                                    }}
                                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200"
                                >
                                    Confirmar Reapertura
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="bg-slate-900 p-8 text-white">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Asistente de Cierre Mensual SET</h2>
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Cumplimiento DNIT / Formulario 120</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setView('history')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold transition-all flex items-center gap-2">
                            <History size={14} /> Historial
                        </button>
                        <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs font-bold text-emerald-400">
                            Mes: {currentMonth.toString().padStart(2, '0')}/{currentYear}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    {STEPS.map((s, idx) => (
                        <div key={s.id} className="flex-1 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                                idx <= currentStep ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/10 text-white/20'
                            }`}>
                                {idx < currentStep ? <CheckCircle2 size={14} /> : idx + 1}
                            </div>
                            <span className={`hidden md:block text-[10px] font-black uppercase tracking-widest ${
                                idx <= currentStep ? 'text-white' : 'text-white/20'
                            }`}>{s.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-10 min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {currentStep === 0 && (
                            <StepContent 
                                title="Ingresos Declarables" 
                                desc="Auditoría de facturas emitidas (electrónicas y manuales)."
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <MetricBox label="Cant. Documentos" value={statsVentas.count.toString()} />
                                    <MetricBox label="Exentas" value={formatGs(statsVentas.ex)} />
                                    <MetricBox label="Facturado (IVA Incl)" value={formatGs(statsVentas.total)} highlight />
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[2rem] space-y-3">
                                    <div className="flex justify-between text-xs font-medium text-slate-500">
                                        <span>Base Gravada 10%</span>
                                        <span>{formatGs(statsVentas.v10)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium text-slate-500">
                                        <span>IVA Débito (10%)</span>
                                        <span className="font-bold text-slate-900">+{formatGs(statsVentas.iva10)}</span>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div className="flex justify-between text-xs font-medium text-slate-500">
                                        <span>IVA Débito (5%)</span>
                                        <span className="font-bold text-slate-900">+{formatGs(statsVentas.iva5)}</span>
                                    </div>
                                </div>
                            </StepContent>
                        )}

                        {currentStep === 1 && (
                            <StepContent 
                                title="Compras y Crédito Fiscal" 
                                desc="Validación de gastos deducibles registrados."
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <MetricBox label="Gastos Deducibles" value={formatGs(statsCompras.total)} highlight />
                                    <MetricBox label="IVA Crédito (10%)" value={formatGs(statsCompras.iva10)} />
                                    <MetricBox label="IVA Crédito (5%)" value={formatGs(statsCompras.iva5)} />
                                </div>
                                {statsCompras.pendientes > 0 && (
                                    <AlertBox msg={`Atención: Tienes ${statsCompras.pendientes} gastos sin clasificar. Verifícalos para no perder crédito fiscal.`} />
                                )}
                            </StepContent>
                        )}

                        {currentStep === 2 && (
                            <StepContent 
                                title="Liquidación del Periodo (Rubros F120)" 
                                desc="Proyección detallada según estructura de la DNIT v4."
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Ventas (Débito Fiscal)</p>
                                            <div className="flex justify-between text-xs"><span>Base 10%</span><span className="font-bold">{formatGs(statsVentas.v10)}</span></div>
                                            <div className="flex justify-between text-xs"><span>Base 5%</span><span className="font-bold">{formatGs(statsVentas.v5)}</span></div>
                                            <div className="flex justify-between text-xs"><span>Exentas</span><span className="font-bold">{formatGs(statsVentas.ex)}</span></div>
                                            <div className="h-px bg-slate-50" />
                                            <div className="flex justify-between text-xs text-rose-600 font-black"><span>IVA DÉBITO</span><span>{formatGs(ivaDebitoTotal)}</span></div>
                                        </div>
                                        <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Compras y Créditos (Rubro 2/3)</p>
                                            <div className="flex justify-between text-xs"><span>IVA Crédito (10% + 5%)</span><span className="font-bold">{formatGs(statsCompras.iva10 + statsCompras.iva5)}</span></div>
                                            <div className="flex justify-between text-xs text-indigo-500 font-bold">
                                                <span>Arrastre Mes Anterior</span>
                                                <span>+{formatGs(saldoArrastrado)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs"><span>Exentas</span><span className="font-bold">{formatGs(statsCompras.ex)}</span></div>
                                            <div className="h-px bg-slate-50" />
                                            <div className="flex justify-between text-xs text-emerald-600 font-black"><span>IVA CRÉDITO TOTAL</span><span>{formatGs(ivaCreditoTotal)}</span></div>
                                        </div>
                                    </div>

                                    <div className={`p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between border-4 ${saldoTecnico > 0 ? 'bg-amber-50 border-amber-100' : 'bg-indigo-50 border-indigo-100'} gap-6`}>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <ShieldCheck size={16} className={saldoTecnico > 0 ? 'text-amber-500' : 'text-indigo-500'} />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                                                    {saldoTecnico > 0 ? 'Saldo a Favor del Fisco' : 'Saldo a Favor Contribuyente'}
                                                </p>
                                            </div>
                                            <p className={`text-4xl font-black ${saldoTecnico > 0 ? 'text-amber-900' : 'text-indigo-900'}`}>{formatGs(Math.abs(saldoTecnico))}</p>
                                            <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-widest italic">* Montos redondeados sin centavos según norma DNIT.</p>
                                        </div>
                                        <div className="shrink-0">
                                            <PieChart size={64} className={saldoTecnico > 0 ? 'text-amber-200' : 'text-indigo-200'} />
                                        </div>
                                    </div>
                                </div>
                            </StepContent>
                        )}

                        {currentStep === 3 && (
                            <StepContent 
                                title="Finalizar Cierre Legal" 
                                desc="Confirma que la información declarada es correcta."
                            >
                                <div className="space-y-6">
                                    <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full" />
                                        <div className="relative z-10 space-y-4">
                                            <h4 className="text-lg font-black uppercase italic">Aviso Legal y Descargo</h4>
                                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                Al confirmar este cierre, el periodo {currentMonth}/{currentYear} quedará **BLOQUEADO**. No podrás añadir, editar ni borrar facturas ni gastos. 
                                                Toda la información generada es una proforma automatizada. Asegúrate de verificar los datos contra tus documentos físicos antes de proceder.
                                            </p>
                                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                                <input type="checkbox" id="confirm-check" className="w-5 h-5 rounded bg-white/10 border-white/20 text-emerald-500 focus:ring-0" />
                                                <label htmlFor="confirm-check" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">He verificado y acepto la responsabilidad de los datos cargados.</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </StepContent>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-8 border-t border-slate-50 flex justify-between items-center bg-slate-50/50">
                <button 
                    disabled={currentStep === 0}
                    onClick={handleBack}
                    className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all flex items-center gap-2 disabled:opacity-0"
                >
                    <ChevronLeft size={16} /> Volver
                </button>

                <button 
                    onClick={handleNext}
                    disabled={isFinishing}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl ${
                        currentStep === STEPS.length - 1 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                >
                    {isFinishing ? (
                        <>Procesando Cierre... <Loader2 className="animate-spin" size={16} /></>
                    ) : (
                        <>{currentStep === STEPS.length - 1 ? 'Cerrar Periodo Fiscal' : 'Continuar'} <ChevronRight size={16} /></>
                    )}
                </button>
            </div>
        </div>
    );
}

function StepContent({ title, desc, children }: any) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-black text-slate-900">{title}</h3>
                <p className="text-slate-400 font-medium">{desc}</p>
            </div>
            {children}
        </div>
    );
}

function MetricBox({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
    return (
        <div className={`p-6 rounded-[2rem] border transition-all ${highlight ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-900 border-slate-100'}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
            <p className="text-xl font-black">{value}</p>
        </div>
    );
}

function AlertBox({ msg }: { msg: string }) {
    return (
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0"><AlertCircle size={20} /></div>
            <p className="text-xs font-bold text-amber-900 uppercase leading-snug">{msg}</p>
        </div>
    );
}
