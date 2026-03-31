import { useState } from 'react';
import { Plus, Calendar, Wallet, Loader2, ArrowUpRight } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { formatGsShort, getServiceIcon, getStatusLabel, getStatusColor } from '../data/sampleData';

export default function Projects() {
  const { proyectos, loading } = useSupabaseData();
  const [filter] = useState('todos');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="text-emerald-500 animate-spin" size={32} />
      </div>
    );
  }

  const filtered = proyectos.filter(p => filter === 'todos' || p.estado === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Proyectos</h1>
          <p className="text-gray-500 mt-1">{proyectos.length} proyectos registrados</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all">
          <Plus size={20} />
          Nuevo Proyecto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProjectStat label="En Progreso" count={proyectos.filter(p => p.estado === 'en_progreso').length} bg="bg-amber-50" text="text-amber-600" />
        <ProjectStat label="Pendientes Cobro" count={proyectos.filter(p => p.estado === 'facturado').length} bg="bg-emerald-50" text="text-emerald-600" />
        <ProjectStat label="Cotizaciones" count={proyectos.filter(p => p.estado === 'cotizacion').length} bg="bg-blue-50" text="text-blue-600" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(project => {
          const progress = project.monto_presupuestado > 0 
            ? (Number(project.monto_facturado || 0) / Number(project.monto_presupuestado)) * 100 
            : 0;

          return (
            <div key={project.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: getStatusColor(project.estado) + '15' }}>
                  {getServiceIcon(project.tipo_servicio)}
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2" style={{ backgroundColor: getStatusColor(project.estado) + '20', color: getStatusColor(project.estado) }}>
                    {getStatusLabel(project.estado)}
                  </span>
                  <ArrowUpRight size={20} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1">{project.nombre_cliente}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">{project.descripcion}</p>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={16} />
                    <span className="text-xs">{project.fecha_entrega}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <Wallet size={16} className="text-emerald-500" />
                    <span>{formatGsShort(Number(project.monto_presupuestado))}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Progreso Financiero</span>
                    <span className="font-bold text-gray-700">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectStat({ label, count, bg, text }: { label: string; count: number; bg: string; text: string }) {
  return (
    <div className={`${bg} rounded-2xl p-5 flex items-center justify-between`}>
      <span className={`font-bold ${text}`}>{label}</span>
      <span className={`text-2xl font-black ${text}`}>{count}</span>
    </div>
  );
}
