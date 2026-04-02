import React, { useState } from 'react';
import { X, Save, DollarSign, Clock, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getServiceLabel, getStatusLabel } from '../data/sampleData';
import type { Proyecto, TipoServicio, EstadoProyecto } from '../data/sampleData';

interface ProjectFormModalProps {
  project?: Proyecto;
  onClose: () => void;
}

const TIPOS_SERVICIO: TipoServicio[] = [
  'filmacion', 'edicion', 'produccion_completa', 'fotografia', 'motion_graphics', 'drone', 'live_streaming', 'otro'
];

const ESTADOS_PROYECTO: EstadoProyecto[] = [
  'cotizacion', 'en_progreso', 'entregado', 'facturado', 'pagado', 'cancelado'
];

export default function ProjectFormModal({ project, onClose }: ProjectFormModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Proyecto>>(project || {
    nombre_cliente: '',
    tipo_servicio: 'filmacion',
    descripcion: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_entrega: '',
    monto_presupuestado: 0,
    monto_facturado: 0,
    margen_objetivo: 30,
    precio_hora: 0,
    horas_estimadas: 0,
    unidad_tiempo: 'horas',
    estado: 'cotizacion'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        user_id: user?.id,
        // Limpiar campos que no deben ir a la DB si existen
        id: undefined,
        created_at: undefined
      };

      if (project?.id) {
        const { error } = await supabase
          .from('proyectos')
          .update(dataToSave)
          .eq('id', project.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('proyectos')
          .insert([dataToSave]);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      onClose();
      alert(project?.id ? "✅ Proyecto actualizado" : "✅ Proyecto creado con éxito");
    } catch (error: any) {
      console.error("Error al guardar proyecto:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">
            {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Cliente / Nombre del Proyecto</label>
              <input 
                required
                type="text"
                value={formData.nombre_cliente}
                onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                className="w-full bg-gray-50 rounded-2xl p-4 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium"
                placeholder="Ej: Campaña Coca Cola Verano"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Tipo de Servicio</label>
              <select 
                value={formData.tipo_servicio}
                onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value as TipoServicio })}
                className="w-full bg-gray-50 rounded-2xl p-4 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium appearance-none"
              >
                {TIPOS_SERVICIO.map(t => (
                  <option key={t} value={t}>{getServiceLabel(t)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Estado</label>
              <select 
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoProyecto })}
                className="w-full bg-gray-50 rounded-2xl p-4 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium appearance-none"
              >
                {ESTADOS_PROYECTO.map(e => (
                  <option key={e} value={e}>{getStatusLabel(e)}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Descripción</label>
              <textarea 
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full bg-gray-50 rounded-2xl p-4 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium min-h-[100px]"
                placeholder="Detalles del proyecto..."
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Presupuesto (Gs)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="number"
                  value={formData.monto_presupuestado}
                  onChange={(e) => setFormData({ ...formData, monto_presupuestado: Number(e.target.value) })}
                  className="w-full bg-gray-50 rounded-2xl p-4 pl-12 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all font-black text-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Margen Objetivo (%)</label>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="number"
                  value={formData.margen_objetivo}
                  onChange={(e) => setFormData({ ...formData, margen_objetivo: Number(e.target.value) })}
                  className="w-full bg-gray-50 rounded-2xl p-4 pl-12 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all font-black text-blue-600"
                />
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-3xl p-6 col-span-2 mt-2 space-y-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-blue-500" size={20} />
                <h4 className="font-bold text-blue-900">Costos de Mano de Obra</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-blue-400 uppercase mb-2 block ml-1">Precio por Hora (Gs)</label>
                  <input 
                    type="number"
                    value={formData.precio_hora}
                    onChange={(e) => setFormData({ ...formData, precio_hora: Number(e.target.value) })}
                    className="w-full bg-white rounded-2xl p-4 border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-400 uppercase mb-2 block ml-1">
                    Tiempo Estimado ({formData.unidad_tiempo === 'dias' ? 'Días' : 'Horas'})
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      value={formData.horas_estimadas}
                      onChange={(e) => setFormData({ ...formData, horas_estimadas: Number(e.target.value) })}
                      className="flex-1 bg-white rounded-2xl p-4 border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                    <div className="flex bg-blue-100 rounded-2xl p-1">
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, unidad_tiempo: 'horas' })}
                        className={`px-3 rounded-xl text-[10px] font-black transition-all ${formData.unidad_tiempo === 'horas' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-400'}`}
                      >
                        H
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, unidad_tiempo: 'dias' })}
                        className={`px-3 rounded-xl text-[10px] font-black transition-all ${formData.unidad_tiempo === 'dias' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-400'}`}
                      >
                        D
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-white text-gray-500 font-bold rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-50"
          >
            {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
            {project ? 'Guardar Cambios' : 'Crear Proyecto'}
          </button>
        </div>
      </div>
    </div>
  );
}
