import { Calendar, CheckCircle2, Clock, FileText, Wallet, Plus, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const tareasEjemplo = [
  { id: '1', titulo: 'Entregables - Campaña Tigo', tipo: 'entrega', prioridad: 'alta', fecha: '2026-03-25' },
  { id: '2', titulo: 'Facturar Proyecto Banco Itaú', tipo: 'facturacion', prioridad: 'media', fecha: '2026-03-26' },
  { id: '3', titulo: 'Seguimiento Cobro Personal', tipo: 'cobro', prioridad: 'alta', fecha: '2026-03-27' },
];

const typeConfig: any = {
  entrega: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  facturacion: { icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50' },
  cobro: { icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-50' },
};

export default function AgendaFreelancer() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Agenda Operativa</h2>
          <p className="text-slate-500 font-medium italic">"No lo dejes en tu cabeza, ponlo en Finance Pro."</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-tight hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
          <Plus size={18} />
          Nueva Tarea
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Calendar size={16} />
            Tareas para hoy
          </h3>

          <div className="space-y-3">
            {tareasEjemplo.map((tarea) => {
              const Config = typeConfig[tarea.tipo];
              const Icon = Config.icon;

              return (
                <motion.div
                  key={tarea.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
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
                        <span className="text-[10px] text-slate-400 font-bold">{tarea.fecha}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-300 hover:text-emerald-500 transition-colors rounded-lg hover:bg-emerald-50">
                      <CheckCircle2 size={20} />
                    </button>
                    <button className="p-2 text-slate-200 hover:text-slate-400 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Salud Operativa</p>
              <h4 className="text-3xl font-black mb-4 leading-none tracking-tighter">Vas por buen camino</h4>
              <p className="text-xs font-semibold opacity-90 leading-relaxed">Tienes 3 tareas críticas para hoy. Tu rentabilidad proyectada mejora con cada cierre.</p>
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
