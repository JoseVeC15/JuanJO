import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Zap, ArrowRight, Wallet, 
    ShieldCheck, AlertTriangle, CheckCircle2,
    Clock
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { formatGs, getIVAExpirationDate } from '../data/sampleData';

interface Suggestion {
    id: string;
    type: 'collection' | 'profitability' | 'tax' | 'agenda' | 'success';
    title: string;
    description: string;
    actionLabel: string;
    icon: React.ReactNode;
    color: string;
    priority: number;
}

export default function SmartSuggestions() {
    const { 
        ingresos, proyectos, financialIntelligence, 
        agendaTareas, loading, perfilFiscal 
    } = useSupabaseData();

    const suggestions = useMemo(() => {
        if (loading) return [];

        const items: Suggestion[] = [];

        // 1. Detección de Cobros Vencidos
        const vencidos = ingresos.filter(i => i.estado === 'vencida');
        if (vencidos.length > 0) {
            const totalVencido = vencidos.reduce((s, i) => s + Number(i.monto), 0);
            items.push({
                id: 'overdue-collection',
                type: 'collection',
                title: '¡No olvides cobrar!',
                description: `Tienes ${vencidos.length} facturas vencidas por un total de ${formatGs(totalVencido)}. ¿Le enviamos un recordatorio amable a los clientes?`,
                actionLabel: 'Ver Cobros',
                icon: <Wallet size={20} />,
                color: 'rose',
                priority: 1
            });
        }

        // 2. Alerta de Rentabilidad (Basada en el margen del cliente/proyecto)
        const proyectosBajoMargen = proyectos.filter(p => 
            p.estado === 'en_progreso' && 
            p.margen_real_porc !== undefined && 
            p.margen_objetivo !== undefined &&
            p.margen_real_porc < p.margen_objetivo
        );

        if (proyectosBajoMargen.length > 0) {
            const p = proyectosBajoMargen[0];
            items.push({
                id: 'low-profit',
                type: 'profitability',
                title: 'Ajuste de rentabilidad',
                description: `He notado que el proyecto "${p.nombre_cliente}" está operando con un margen del ${p.margen_real_porc?.toFixed(1)}%, por debajo de tu objetivo del ${p.margen_objetivo}%. Revisa los gastos asociados.`,
                actionLabel: 'Analizar Proyecto',
                icon: <AlertTriangle size={20} />,
                color: 'amber',
                priority: 2
            });
        }

        // 3. Optimización Fiscal
        if (financialIntelligence.ivaEstimadoAPagar > 2000000) {
            items.push({
                id: 'tax-optimization',
                type: 'tax',
                title: 'Oportunidad de ahorro IVA',
                description: `Tu IVA estimado este mes es de ${formatGs(financialIntelligence.ivaEstimadoAPagar)}. Todavía puedes registrar facturas de gastos para equilibrar tu balance fiscal.`,
                actionLabel: 'Subir Gastos',
                icon: <ShieldCheck size={20} />,
                color: 'indigo',
                priority: 3
            });
        }

        // 4. Vencimiento SET (Formulario 120)
        if (perfilFiscal?.ruc) {
            const hoyObj = new Date();
            const lastMonth = hoyObj.getMonth() === 0 ? 12 : hoyObj.getMonth();
            const lastYear = hoyObj.getMonth() === 0 ? hoyObj.getFullYear() - 1 : hoyObj.getFullYear();
            
            const vencimiento = getIVAExpirationDate(perfilFiscal.ruc, lastMonth, lastYear);
            const daysLeft = Math.ceil((vencimiento.getTime() - hoyObj.getTime()) / (1000 * 60 * 60 * 24));

            if (daysLeft > 0 && daysLeft <= 10) {
                items.push({
                    id: 'set-deadline',
                    type: 'tax',
                    title: '¡Vencimiento IVA Próximo!',
                    description: `Tu formulario 120 de ${new Date(lastYear, lastMonth - 1).toLocaleString('es-PY', { month: 'long' })} vence el ${vencimiento.toLocaleDateString('es-PY')}. Tienes ${daysLeft} días para cerrar tu periodo fiscal.`,
                    actionLabel: 'Iniciar Cierre',
                    icon: <ShieldCheck size={20} />,
                    color: 'indigo',
                    priority: 0 // Máxima prioridad
                });
            }
        }

        // 5. Agenda Próxima
        const hoy = new Date().toISOString().split('T')[0];
        const tareasHoy = agendaTareas.filter(t => !t.completada && t.fecha_limite === hoy);
        if (tareasHoy.length > 0) {
            items.push({
                id: 'agenda-today',
                type: 'agenda',
                title: 'Tu día hoy',
                description: `¡Hola! Tienes ${tareasHoy.length} tareas clave para hoy. Mantén el ritmo para cerrar la semana con éxito.`,
                actionLabel: 'Ver Agenda',
                icon: <Clock size={20} />,
                color: 'emerald',
                priority: 4
            });
        }

        // 5. Mensaje de Éxito (si no hay urgencias)
        if (items.length === 0) {
            items.push({
                id: 'all-good',
                type: 'success',
                title: '¡Todo bajo control!',
                description: 'Tu flujo de caja y rentabilidad están en niveles óptimos. No detecto urgencias financieras hoy. ¡Sigue así!',
                actionLabel: 'Ver Reportes',
                icon: <CheckCircle2 size={20} />,
                color: 'emerald',
                priority: 5
            });
        }

        return items.sort((a, b) => a.priority - b.priority).slice(0, 3);
    }, [ingresos, proyectos, financialIntelligence, agendaTareas, loading]);

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
