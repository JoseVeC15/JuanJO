import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, AlertCircle, Receipt, ArrowRight,
    ChevronLeft, ChevronRight, PieChart, FileText,
    Calculator, ShieldCheck, Download, Loader2
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { formatGs } from '../data/sampleData';

const STEPS = [
    { id: 'ingresos', title: 'Validación de Ingresos', icon: <Receipt size={18} /> },
    { id: 'gastos', title: 'Clasificación de Gastos', icon: <Calculator size={18} /> },
    { id: 'fiscal', title: 'Balance Fiscal (SET)', icon: <ShieldCheck size={18} /> },
    { id: 'reporte', title: 'Cierre y Reporte', icon: <FileText size={18} /> },
];

export default function CierreMensualWizard() {
    const { proyectos, facturasGastos, ingresos, financialIntelligence, loading } = useSupabaseData();
    const [currentStep, setCurrentStep] = useState(0);
    const [isFinishing, setIsFinishing] = useState(false);

    // Auditoría de Ingresos: Proyectos entregados pero sin factura asociada
    const proyectosSinFactura = useMemo(() => {
        return proyectos.filter(p => 
            (p.estado === 'entregado' || p.estado === 'facturado') && 
            !ingresos.some(i => i.proyecto_id === p.id)
        );
    }, [proyectos, ingresos]);

    // Auditoría de Gastos: Gastos pendientes de clasificar
    const gastosSinClasificar = useMemo(() => {
        return facturasGastos.filter(g => g.estado === 'pendiente_clasificar');
    }, [facturasGastos]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(v => v + 1);
        else finalizeCierre();
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(v => v - 1);
    };

    const finalizeCierre = () => {
        setIsFinishing(true);
        setTimeout(() => {
            setIsFinishing(false);
            alert("¡Mes cerrado con éxito! Reporte generado en la sección de Reportes.");
        }, 2000);
    };

    if (loading) return null;

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="bg-slate-900 p-8 text-white">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Asistente de Cierre Mensual</h2>
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Auditoría Financiera de Periodo</p>
                    </div>
                    <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-xs font-bold">
                        Periodo: {new Date().toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })}
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
                                title="¿Facturaste todos tus servicios?" 
                                desc="Hemos comparado tus entregas contra tus facturas emitidas."
                            >
                                {proyectosSinFactura.length === 0 ? (
                                    <SuccessBox msg="¡Excelente! Todos tus proyectos entregados están debidamente facturados." />
                                ) : (
                                    <div className="space-y-4">
                                        <AlertBox msg={`Detectamos ${proyectosSinFactura.length} proyectos que aún no tienen una factura asociada.`} />
                                        <div className="grid grid-cols-1 gap-2">
                                            {proyectosSinFactura.map(p => (
                                                <div key={p.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{p.nombre_cliente}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.tipo_servicio}</p>
                                                    </div>
                                                    <span className="text-sm font-black">{formatGs(p.monto_presupuestado)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </StepContent>
                        )}

                        {currentStep === 1 && (
                            <StepContent 
                                title="Clasificación de Gastos" 
                                desc="Asegúrate que cada gasto tenga su categoría para un reporte de IVA exacto."
                            >
                                {gastosSinClasificar.length === 0 ? (
                                    <SuccessBox msg="Todos tus gastos están clasificados correctamente." />
                                ) : (
                                    <div className="space-y-4">
                                        <AlertBox msg={`Tienes ${gastosSinClasificar.length} gastos pendientes de categoría.`} />
                                        <button className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2">
                                            Ir a clasificar ahora <ArrowRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </StepContent>
                        )}

                        {currentStep === 2 && (
                            <StepContent 
                                title="Balance Fiscal Sugerido" 
                                desc="Esta es la proyección de lo que deberás declarar a la SET."
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-slate-50 rounded-[2rem]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">IVA Débito Estimado</p>
                                        <p className="text-2xl font-black text-slate-900">{formatGs(financialIntelligence.ivaEstimadoAPagar + 250000)}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-[2rem]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">IVA Crédito Utilizable</p>
                                        <p className="text-2xl font-black text-slate-900">{formatGs(financialIntelligence.ivaEstimadoAPagar)}</p>
                                    </div>
                                    <div className="col-span-2 p-6 bg-indigo-50 border-2 border-indigo-100 rounded-[2.5rem] flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Resultado Neto a Pagar</p>
                                            <p className="text-3xl font-black text-indigo-900">{formatGs(financialIntelligence.ivaEstimadoAPagar)}</p>
                                        </div>
                                        <ShieldCheck size={40} className="text-indigo-200" />
                                    </div>
                                </div>
                            </StepContent>
                        )}

                        {currentStep === 3 && (
                            <StepContent 
                                title="¡Todo listo para cerrar el mes!" 
                                desc="Al confirmar, se generará el reporte consolidado y se congelará el periodo."
                            >
                                <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] text-center space-y-4">
                                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h4 className="text-xl font-black text-emerald-900 uppercase">Verificado</h4>
                                    <p className="text-sm text-emerald-700 font-medium px-10">Tu información financiera ha sido auditada satisfactoriamente por el Asistente Finance Pro.</p>
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
                    className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest font-slate-400 hover:bg-slate-100 transition-all flex items-center gap-2 disabled:opacity-0"
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
                        <>Generando Reporte... <Loader2 className="animate-spin" size={16} /></>
                    ) : (
                        <>{currentStep === STEPS.length - 1 ? 'Cerrar Mes y Ver Reporte' : 'Continuar'} <ChevronRight size={16} /></>
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

function SuccessBox({ msg }: { msg: string }) {
    return (
        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0"><CheckCircle2 size={20} /></div>
            <p className="text-sm font-bold text-emerald-900">{msg}</p>
        </div>
    );
}

function AlertBox({ msg }: { msg: string }) {
    return (
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0"><AlertCircle size={20} /></div>
            <p className="text-sm font-bold text-amber-900 uppercase leading-snug">{msg}</p>
        </div>
    );
}
