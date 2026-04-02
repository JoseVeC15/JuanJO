import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Coffee, Plane, Thermometer, Plus, 
  Trash2, Info, CheckCircle, ShieldAlert,
  Loader2, X
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';

const typeConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  vacacion: { label: 'Vacaciones', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: <Plane size={14} /> },
  feriado: { label: 'Feriado', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: <Calendar size={14} /> },
  enfermedad: { label: 'Enfermedad', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', icon: <Thermometer size={14} /> },
  personal: { label: 'Personal', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', icon: <Coffee size={14} /> },
};

export default function Disponibilidad() {
    const { bloqueos, addBloqueo, deleteBloqueo, loading } = useSupabaseData();
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ date: '', type: 'vacacion', note: '' });

    const statsMes = useMemo(() => {
        const totalDiasMes = 30; 
        const diasBloqueados = (bloqueos || []).length;
        const capacidadReal = Math.round(((totalDiasMes - diasBloqueados) / totalDiasMes) * 100);
        
        return {
            totalDiasMes,
            diasBloqueados,
            capacidadReal
        };
    }, [bloqueos]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addBloqueo(formData);
            setIsAdding(false);
            setFormData({ date: '', type: 'vacacion', note: '' });
        } catch (error) {
            console.error("Error adding blockage:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await deleteBloqueo(id);
        } catch (error) {
            console.error("Error removing blockage:", error);
        }
    };

    if (loading && (!bloqueos || bloqueos.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="text-emerald-500 animate-spin" size={40} />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando Disponibilidad...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                        <Calendar size={14} /> Planificación de Compromisos
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                        Gestión de Disponibilidad
                    </h1>
                    <p className="text-gray-500 font-medium italic">Controla tus días de descanso y capacidad operativa real.</p>
                </motion.div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Bloquear Fecha
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CapacityCard 
                    label="Capacidad Laboral Mensual" 
                    value={`${statsMes.capacidadReal}%`} 
                    icon={<Coffee size={20} />} 
                    color="bg-white"
                />
                <CapacityCard 
                    label="Días No Laborables" 
                    value={statsMes.diasBloqueados} 
                    icon={<Plane size={20} />} 
                    color="bg-white text-rose-500"
                />
                <CapacityCard 
                    label="Salud Mental (Burnout)" 
                    value={statsMes.capacidadReal < 60 ? "CRÍTICO" : statsMes.capacidadReal < 80 ? "ALERTA" : "ÓPTIMO"} 
                    icon={<Thermometer size={20} />} 
                    color={statsMes.capacidadReal < 80 ? "bg-amber-50 border-amber-100 text-amber-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                        <CheckCircle size={20} className="text-indigo-500" /> Próximas Inactivaciones
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {(bloqueos || []).length === 0 ? (
                                <div className="col-span-full py-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay fechas bloqueadas</p>
                                </div>
                            ) : bloqueos.map((b: any) => {
                                const cfg = typeConfig[b.type] || typeConfig.vacacion;
                                return (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={b.id} 
                                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${cfg.bg} ${cfg.color}`}>
                                                {cfg.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{new Date(b.date).toLocaleDateString('es-PY', { day: 'numeric', month: 'long', timeZone: 'UTC' })}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemove(b.id)}
                                            className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -z-0" />
                        <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2 relative z-10">
                            <ShieldAlert size={20} className="text-emerald-400" /> Planificación Inteligente
                        </h3>
                        <p className="text-indigo-100 text-xs leading-relaxed mb-6 font-medium relative z-10">
                            Bloquear tus fines de semana y feriados permite que el sistema de **Agendas** no te asigne tareas automáticas en esos días, manteniendo tu ritmo de trabajo saludable.
                        </p>
                        <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 relative z-10">
                            <Info size={18} className="text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Consejo: Bloquea tu cumple!</span>
                        </div>
                    </div>
                 </div>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900">Bloquear Fecha</h2>
                                    <p className="text-indigo-500 font-bold uppercase tracking-widest text-[10px] mt-1">Marcar día como no laborable</p>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-xl transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Fecha</label>
                                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Tipo de Bloqueo</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20">
                                        <option value="vacacion">🏝️ Vacaciones</option>
                                        <option value="feriado">🏛️ Feriado / Festivo</option>
                                        <option value="enfermedad">🤒 Enfermedad</option>
                                        <option value="personal">🔒 Asuntos Personale</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Nota (Opcional)</label>
                                    <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]" placeholder="Ej: Viaje a Encarnación..." />
                                </div>

                                <button disabled={isSubmitting} type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />} Bloquear en Calendario
                                </button>
                            </form>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-bl-full -z-0" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CapacityCard({ label, value, icon, color }: any) {
    return (
        <div className={`p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-lg ${color}`}>
            <div className="flex items-center gap-3 opacity-60 mb-3">
                {icon}
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
            </div>
            <p className="text-3xl font-black tracking-tight">{value}</p>
        </div>
    );
}
