import React, { useState } from 'react';
import { X, Clock, TrendingUp, Wallet, Receipt, Plus, AlertCircle } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { formatGsShort, getStatusLabel, getStatusColor } from '../data/sampleData';
import type { Proyecto, RegistroHora } from '../data/sampleData';

interface ProjectDetailsModalProps {
  project: Proyecto & {
    ingreso_real: number;
    gasto_real: number;
    horas_reales: number;
    costo_mano_obra: number;
    costo_total: number;
    margen_real_gs: number;
    margen_real_porc: number;
    salud_margen: string;
  };
  onClose: () => void;
}

export default function ProjectDetailsModal({ project, onClose }: ProjectDetailsModalProps) {
  const { facturasGastos, addHorasTrabajadas } = useSupabaseData();
  const [isAddingHours, setIsAddingHours] = useState(false);
  const [newHour, setNewHour] = useState({ cantidad_horas: 1, descripcion: '', fecha: new Date().toISOString().split('T')[0] });

  const projectGastos = facturasGastos.filter(g => g.proyecto_id === project.id);

  const handleAddHours = async () => {
    if (newHour.descripcion.trim() === '') return;
    await addHorasTrabajadas({
      proyecto_id: project.id,
      ...newHour
    });
    setIsAddingHours(false);
    setNewHour({ cantidad_horas: 1, descripcion: '', fecha: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm" style={{ backgroundColor: getStatusColor(project.estado) + '20' }}>
              🎬
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{project.nombre_cliente}</h2>
              <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider" style={{ backgroundColor: getStatusColor(project.estado) + '20', color: getStatusColor(project.estado) }}>
                {getStatusLabel(project.estado)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-100">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
          {/* Dashboard de Rentabilidad */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <MetricCard 
              label="Ingresos" 
              value={formatGsShort(project.ingreso_real)} 
              icon={<Wallet className="text-emerald-500" />} 
              color="text-emerald-600"
            />
            <MetricCard 
              label="Costos Totales" 
              value={formatGsShort(project.costo_total)} 
              icon={<Receipt className="text-rose-500" />} 
              color="text-rose-600"
              subtext={`Gasto: ${formatGsShort(project.gasto_real)} / Mano Obra: ${formatGsShort(project.costo_mano_obra)}`}
            />
            <MetricCard 
              label="Margen Real" 
              value={`${project.margen_real_porc.toFixed(1)}%`} 
              icon={<TrendingUp className={project.salud_margen === 'alerta' ? 'text-rose-500' : 'text-emerald-500'} />} 
              color={project.salud_margen === 'alerta' ? 'text-rose-600' : 'text-emerald-600'}
              subtext={`Objetivo: ${project.margen_objetivo}%`}
            />
            <MetricCard 
              label="Tiempo Real" 
              value={`${project.horas_reales}h`} 
              icon={<Clock className="text-blue-500" />} 
              color="text-blue-600"
              subtext={`Estimado: ${project.horas_estimadas || 0}h`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Registro de Horas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={20} className="text-blue-500" />
                  Mano de Obra (Horas)
                </h3>
                <button 
                  onClick={() => setIsAddingHours(!isAddingHours)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>

              {isAddingHours && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 mb-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block ml-1">Horas</label>
                      <input 
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={newHour.cantidad_horas}
                        onChange={(e) => setNewHour({ ...newHour, cantidad_horas: Number(e.target.value) })}
                        className="w-full bg-white rounded-2xl p-3 border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block ml-1">Fecha</label>
                      <input 
                        type="date"
                        value={newHour.fecha}
                        onChange={(e) => setNewHour({ ...newHour, fecha: e.target.value })}
                        className="w-full bg-white rounded-2xl p-3 border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block ml-1">Descripción de la Tarea</label>
                    <input 
                      type="text"
                      placeholder="Ej: Edición preliminar v1"
                      value={newHour.descripcion}
                      onChange={(e) => setNewHour({ ...newHour, descripcion: e.target.value })}
                      className="w-full bg-white rounded-2xl p-3 border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAddHours}
                      className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 transition-colors"
                    >
                      Guardar Log
                    </button>
                    <button 
                      onClick={() => setIsAddingHours(false)}
                      className="px-6 bg-white text-gray-400 font-bold py-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Horas - Simulado u obtenido del hook si existiera una lista filtrada */}
              <div className="bg-gray-50 rounded-3xl p-6 min-h-[200px]">
                <p className="text-gray-400 text-sm text-center italic mt-4">Los registros de horas aparecerán aquí una vez que ejecutes el comando SQL en Supabase.</p>
              </div>
            </div>

            {/* Listado de Gastos */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt size={20} className="text-rose-500" />
                Gastos Vinculados ({projectGastos.length})
              </h3>
              <div className="bg-gray-50 rounded-3xl p-6 space-y-3">
                {projectGastos.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 italic">No hay gastos asociados</p>
                ) : (
                  projectGastos.map(g => (
                    <div key={g.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{g.proveedor}</p>
                        <p className="text-[10px] text-gray-400">{g.tipo_gasto} • {g.fecha_factura}</p>
                      </div>
                      <p className="font-black text-rose-600">{formatGsShort(g.monto)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className={project.salud_margen === 'alerta' ? 'text-amber-400' : 'text-emerald-400'} size={24} />
            <p className="text-sm">
              Tu margen es de <span className="font-black">{project.margen_real_porc.toFixed(1)}%</span>. 
              {project.salud_margen === 'alerta' ? " Está por debajo de tu objetivo del " + project.margen_objetivo + "%." : " ¡Buen trabajo!"}
            </p>
          </div>
          <p className="text-xs text-slate-400">ID: {project.id}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, subtext }: { label: string; value: string; icon: React.ReactNode; color: string; subtext?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {subtext && <p className="text-[10px] text-gray-400 mt-2 font-medium">{subtext}</p>}
    </div>
  );
}
