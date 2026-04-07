import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Zap, ArrowRight, Wallet, 
    ShieldCheck, AlertTriangle, CheckCircle2,
    Clock
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { formatGs } from '../data/sampleData';

interface Suggestion {
    id: string;
    type: 'income' | 'expense' | 'collection' | 'tax' | 'success';
    title: string;
    description: string;
    actionLabel: string;
    icon: React.ReactNode;
    color: string;
    priority: number;
}

export default function SmartSuggestions() {
    const { 
        ingresos, facturasGastos, financialIntelligence,
        loading
    } = useSupabaseData();

    const suggestions = useMemo(() => {
        if (loading) return [];

        const items: Suggestion[] = [];

        const ingresosCobrados = ingresos.filter(i => i.estado === 'cobrada' || i.estado === 'pagado').reduce((s, i) => s + Number(i.monto), 0);
        const gastosTotales = facturasGastos.reduce((s, g) => s + Number(g.monto), 0);
        const cuentasPorCobrar = ingresos.filter(i => i.estado !== 'cobrada' && i.estado !== 'pagado').reduce((s, i) => s + Number(i.monto), 0);
        const balanceNeto = ingresosCobrados - gastosTotales;

        if (ingresosCobrados > 0) {
            items.push({
                id: 'income-summary',
                type: 'income',
                title: 'Ingresos del período',
                description: `Ya cobraste ${formatGs(ingresosCobrados)}. Mantén este ritmo para cerrar bien el mes.`,
                actionLabel: 'Ver Ingresos',
                icon: <Wallet size={20} />,
                color: 'emerald',
                priority: 2
            });
        }

        if (gastosTotales > 0) {
            items.push({
                id: 'expense-summary',
                type: 'expense',
                title: 'Gastos acumulados',
                description: `Tus gastos van en ${formatGs(gastosTotales)}. Revisa los rubros altos para proteger margen.`,
                actionLabel: 'Ver Gastos',
                icon: <Clock size={20} />,
                color: 'amber',
                priority: 3
            });
        }

        if (cuentasPorCobrar > 0) {
            items.push({
                id: 'pending-collection',
                type: 'collection',
                title: 'Cobros pendientes',
                description: `Tienes ${formatGs(cuentasPorCobrar)} por cobrar. Prioriza seguimiento hoy para mejorar caja.`,
                actionLabel: 'Gestionar Cobros',
                icon: <AlertTriangle size={20} />,
                color: 'rose',
                priority: 0
            });
        }

        if (financialIntelligence.ivaEstimadoAPagar > 0) {
            items.push({
                id: 'tax-estimation',
                type: 'tax',
                title: 'Impuesto estimado',
                description: `Reserva ${formatGs(financialIntelligence.ivaEstimadoAPagar)} para IVA estimado del período.`,
                actionLabel: 'Ver Fiscal',
                icon: <ShieldCheck size={20} />,
                color: 'indigo',
                priority: 1
            });
        }

        if (items.length === 0) {
            items.push({
                id: 'all-good',
                type: 'success',
                title: 'Resumen simple en orden',
                description: `Balance neto actual: ${formatGs(balanceNeto)}. No hay alertas críticas ahora mismo.`,
                actionLabel: 'Ver Reportes',
                icon: <CheckCircle2 size={20} />,
                color: 'emerald',
                priority: 5
            });
        }

        return items.sort((a, b) => a.priority - b.priority).slice(0, 3);
    }, [ingresos, facturasGastos, financialIntelligence, loading]);

    if (loading || suggestions.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <Zap size={16} className="text-amber-500 fill-amber-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Asistente Finance Pro</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suggestions.map((s, idx) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer overflow-hidden`}
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-110 bg-${s.color}-500`} />
                        
                        <div className="flex flex-col h-full gap-4 relative z-10">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-${s.color}-50 text-${s.color}-600`}>
                                {s.icon}
                            </div>
                            
                            <div className="flex-1">
                                <h4 className="font-black text-slate-900 leading-tight mb-1">{s.title}</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{s.description}</p>
                            </div>

                            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">
                                {s.actionLabel} <ArrowRight size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
