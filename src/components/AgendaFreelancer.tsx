import { useState } from 'react';
import { Calendar, CheckCircle2, Clock, FileText, Wallet, Plus, MoreVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { AgendaTarea } from '../data/sampleData';

const typeConfig: any = {
  entrega: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  facturacion: { icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50' },
  cobro: { icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-50' },
};

export default function AgendaFreelancer() {
  const { agendaTareas, loadingAgenda, addTarea, toggleTarea, deleteTarea } = useSupabaseData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTarea, setNewTarea] = useState<Partial<AgendaTarea>>({
    titulo: '',
    tipo: 'entrega',
    prioridad: 'media',
    fecha_limite: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarea.titulo) return;
    await addTarea(newTarea);
    setShowAddForm(false);
    setNewTarea({ titulo: '', tipo: 'entrega', prioridad: 'media', fecha_limite: new Date().toISOString().split('T')[0] });
  };

  const tareasHoy = agendaTareas.filter(t => !t.completada);
  const tareasCompletadas = agendaTareas.filter(t => t.completada);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Agenda Operativa</h2>
          <p className="text-slate-500 font-medium italic">"No lo dejes en tu cabeza, ponlo en Finance Pro."</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-tight hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
        >
          {showAddForm ? <X size={18} /> : <Plus size={18} />}
          {showAddForm ? 'Cancelar' : 'Nueva Tarea'}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-[2rem] border-2 border-emerald-100 shadow-xl shadow-emerald-500/5"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest pl-1">¿Qué hay que hacer?</label>
                <input 
                  type="text" 
                  value={newTarea.titulo}
                  onChange={e => setNewTarea({...newTarea, titulo: e.target.value})}
                  placeholder="Ej: Enviar presupuesto a Tigo..."
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 placeholder:text-slate-300 font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest pl-1">Tipo</label>
                <select 
                  value={newTarea.tipo}
                  onChange={e => setNewTarea({...newTarea, tipo: e.target.value as any})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="entrega">🎬 Entrega</option>
                  <option value="facturacion">📄 Facturación</option>
                  <option value="cobro">💰 Cobro</option>
                </select>
              </div>
              <button type="submit" className="bg-emerald-500 text-white font-black uppercase text-xs py-3.5 rounded-xl hover:bg-emerald-600 transition-all">
                Guardar Tarea
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Calendar size={16} />
            Pendientes ({tareasHoy.length})
          </h3>

          <div className="space-y-3">
            {loadingAgenda ? (
              <div className="p-12 text-center animate-pulse bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Clock className="mx-auto text-slate-300 mb-2 animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase">Actualizando agenda...</p>
              </div>
            ) : (
              tareasHoy.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <CheckCircle2 className="mx-auto text-emerald-300 mb-2" />
                  <p className="text-xs font-black text-slate-400 uppercase">¡Felicidades! Todo al día</p>
                </div>
              ) : (
                tareasHoy.map((tarea) => {
                  const Config = typeConfig[tarea.tipo] || typeConfig.entrega;
                  const Icon = Config.icon;

                  return (
                    <motion.div
                      key={tarea.id}
                      layoutId={tarea.id}
                      className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`${Config.bg} ${Config.color} p-2.5 rounded-xl`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{tarea.titulo}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${tarea.prioridad === 'alta' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500'}`}>
                              {tarea.prioridad}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold italic">{tarea.fecha_limite}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleTarea(tarea.id, true)}
                          className="p-2 text-slate-200 hover:text-emerald-500 transition-colors rounded-lg hover:bg-emerald-50"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                        <button 
                          onClick={() => deleteTarea(tarea.id)}
                          className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )
            )}
            
            {tareasCompletadas.length > 0 && (
              <div className="pt-8 opacity-40">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest pl-1">Recientemente completadas</h4>
                <div className="space-y-2">
                  {tareasCompletadas.map(tarea => (
                    <div key={tarea.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold text-slate-500 line-through">{tarea.titulo}</span>
                      </div>
                      <button onClick={() => toggleTarea(tarea.id, false)} className="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600">Deshacer</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Salud Operativa</p>
              <h4 className="text-3xl font-black mb-4 leading-none tracking-tighter">
                {tareasHoy.length === 0 ? 'Día Perfecto' : 'Vas por buen camino'}
              </h4>
              <p className="text-xs font-semibold opacity-90 leading-relaxed">
                {tareasHoy.length === 0 
                  ? 'No tienes tareas pendientes para hoy. ¡Disfruta de tu tiempo libre!' 
                  : `Tienes ${tareasHoy.length} tareas críticas para hoy. Tu rentabilidad proyectada mejora con cada cierre.`}
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12">
               <Calendar size={160} />
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl">
             <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">Próximos Vencimientos</h5>
             <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-2 border-emerald-500 pl-4">
                   <div>
                      <p className="text-xs font-bold leading-none mb-1">Cierre Mensual</p>
                      <p className="text-[10px] text-slate-400 font-bold italic">En 5 días</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 border-l-2 border-slate-700 pl-4 opacity-60">
                   <div>
                      <p className="text-xs font-bold leading-none mb-1">Pago Proveedores</p>
                      <p className="text-[10px] text-slate-400 font-bold italic">En 12 días</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
