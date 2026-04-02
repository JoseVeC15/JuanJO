import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search, AlertCircle, Loader2, Plus, X, 
  Package, TrendingUp, Tool, ShieldCheck, Trash2, Edit3
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  formatGsShort, getEquipmentIcon,
} from '../data/sampleData';
import { motion, AnimatePresence } from 'framer-motion';

const condConfig: Record<string, { label: string; color: string; bg: string }> = {
  nuevo: { label: 'Nuevo', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  bueno: { label: 'Bueno', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  regular: { label: 'Regular', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  reparacion: { label: 'Reparación', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
};

export default function Inventario() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { inventarioEquipo, loading, valorTotalInventario } = useSupabaseData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'PROPIO' | 'RENTADO'>('PROPIO');
  
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    marca_modelo: '',
    numero_serie: '',
    tipo: 'camara',
    condicion: 'bueno',
    tipo_propiedad: 'PROPIO',
    valor_actual: '',
    costo_renta_dia: '',
    fecha_fin_renta: ''
  });

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const submitData: any = {
        ...formData,
        user_id: user.id,
        tipo_propiedad: activeTab,
        valor_actual: formData.valor_actual ? Number(formData.valor_actual) : null,
        costo_renta_dia: formData.costo_renta_dia ? Number(formData.costo_renta_dia) : null,
        fecha_fin_renta: (formData.fecha_fin_renta || '').trim() === '' ? null : formData.fecha_fin_renta
      };

      if (activeTab === 'PROPIO') {
        submitData.costo_renta_dia = null;
        submitData.fecha_fin_renta = null;
      } else {
        submitData.valor_actual = null;
      }

      const { error } = await supabase.from('inventario_equipo').insert([submitData]);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['inventario_equipo'] });
      setIsAdding(false);
      setFormData({
        nombre: '', marca_modelo: '', numero_serie: '',
        tipo: 'camara', condicion: 'bueno',
        tipo_propiedad: 'PROPIO', valor_actual: '',
        costo_renta_dia: '', fecha_fin_renta: ''
      });
    } catch (err) {
      console.error('Error adding asset:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarEquipo = async (id: string) => {
    if (!confirm("¿Eliminar este equipo del inventario?")) return;
    try {
       const { error } = await supabase.from('inventario_equipo').delete().eq('id', id);
       if (error) throw error;
       queryClient.invalidateQueries({ queryKey: ['inventario_equipo'] });
    } catch (err) {
       console.error('Error deleting asset:', err);
    }
  };

  if (loading && inventarioEquipo.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="text-indigo-500 animate-spin" size={40} />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando Activos...</p>
      </div>
    );
  }

  const filtered = inventarioEquipo
    .filter(e => e.tipo_propiedad === activeTab)
    .filter(e =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (e.marca_modelo?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (e.numero_serie?.toLowerCase() || '').includes(search.toLowerCase())
    );

  const totalPropio = inventarioEquipo.filter(e => e.tipo_propiedad === 'PROPIO').length;
  const totalRentado = inventarioEquipo.filter(e => e.tipo_propiedad === 'RENTADO').length;
  const enReparacion = inventarioEquipo.filter(e => e.condicion === 'reparacion').length;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                  <Package size={14} /> Gestión de Activos Fijos
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                  Inventario Pro
              </h1>
              <p className="text-gray-500 font-medium italic">Control patrimonial y trazabilidad técnica.</p>
          </motion.div>
          
          <div className="flex items-center gap-3">
              <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <TabBtn label={`Propio (${totalPropio})`} active={activeTab === 'PROPIO'} onClick={() => setActiveTab('PROPIO')} />
                  <TabBtn label={`Rentado (${totalRentado})`} active={activeTab === 'RENTADO'} onClick={() => setActiveTab('RENTADO')} />
              </div>
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <Plus size={18} /> Nuevo Activo
              </button>
          </div>
      </header>

      {/* Global Inventory Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard 
              label="Valor de Flota Propia" 
              value={new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(valorTotalInventario || 0)} 
              icon={<TrendingUp size={20} />} 
              color="bg-white border-slate-100"
          />
          <SummaryCard 
              label="Equipos en Reparación" 
              value={enReparacion} 
              icon={<Tool size={20} />} 
              color={enReparacion > 0 ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}
          />
          <SummaryCard 
              label="Salud de Flota" 
              value={`${Math.round(((inventarioEquipo.length - enReparacion) / (inventarioEquipo.length || 1)) * 100)}%`} 
              icon={<ShieldCheck size={20} />} 
              color="bg-indigo-50 border-indigo-100 text-indigo-700"
          />
      </div>

      <div className="relative group">
        <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
        <input
          type="text"
          placeholder="Buscar equipo por nombre, marca o número de serie..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-16 pr-8 py-5 rounded-[2.5rem] border-none bg-white shadow-sm ring-1 ring-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-gray-800 placeholder:text-gray-300 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
            {filtered.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <Package size={40} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay equipos en esta categoría</p>
                </div>
            ) : filtered.map(equipo => {
            const cond = condConfig[equipo.condicion] || condConfig.bueno;
            return (
                <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={equipo.id} 
                    className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative border-b-4 border-b-transparent hover:border-b-indigo-500"
                >
                <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-slate-200 transition-transform group-hover:rotate-3">
                        {getEquipmentIcon(equipo.tipo)}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${cond.bg} ${cond.color}`}>
                            {cond.label}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => eliminarEquipo(equipo.id)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors"><Trash2 size={14} /></button>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-black text-gray-900 text-xl mb-1 tracking-tight group-hover:text-indigo-600 transition-colors uppercase truncate">{equipo.nombre}</h3>
                    <p className="text-sm font-bold text-gray-400 italic">{equipo.marca_modelo}</p>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-50">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Serie</span>
                    <span className="font-black text-slate-900 text-xs">{equipo.numero_serie || 'NO ASIGNADO'}</span>
                    </div>
                    
                    {equipo.tipo_propiedad === 'PROPIO' ? (
                    <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={12} /> Valor Est.</span>
                        <span className="font-black text-emerald-700">{formatGsShort(Number(equipo.valor_actual || 0))}</span>
                    </div>
                    ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Costo Renta</span>
                            <span className="font-black text-indigo-700">{formatGsShort(Number(equipo.costo_renta_dia || 0))} / día</span>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 p-3 rounded-2xl text-[10px] font-black border border-amber-100">
                        <AlertCircle size={14} />
                        VENCIMIENTO: {equipo.fecha_fin_renta}
                        </div>
                    </div>
                    )}
                </div>
                </motion.div>
            );
            })}
        </AnimatePresence>
      </div>

      {/* ADD ASSET MODAL */}
      <AnimatePresence>
        {isAdding && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl relative overflow-hidden"
            >
                <div className="p-0 mb-8 flex justify-between items-center relative z-10">
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Registrar Activo</h2>
                    <p className="text-indigo-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Sección {activeTab}</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-xl transition-colors"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleAddAsset} className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Nombre del Equipo</label>
                        <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Eje: Sony A7IV" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Marca / Modelo</label>
                        <input value={formData.marca_modelo} onChange={e => setFormData({...formData, marca_modelo: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Sony" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Nº Serie</label>
                        <input value={formData.numero_serie} onChange={e => setFormData({...formData, numero_serie: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="SN-1234..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Condición</label>
                        <select value={formData.condicion} onChange={e => setFormData({...formData, condicion: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20">
                            <option value="nuevo">Nuevo / Sellado</option>
                            <option value="bueno">Buen Estado</option>
                            <option value="regular">Regular (Desgaste)</option>
                            <option value="reparacion">En Reparación</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Categoría Técnica</label>
                        <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20">
                            <option value="camara">🎥 Cámara</option>
                            <option value="lente">👁️ Lente / Óptica</option>
                            <option value="iluminacion">💡 Iluminación</option>
                            <option value="audio">🎙️ Audio</option>
                            <option value="drone">🛸 Drone</option>
                            <option value="estabilizador">⚖️ Gimbal</option>
                            <option value="computo">💻 Edición/IT</option>
                            <option value="accesorios">🔋 Accesorio</option>
                            <option value="otro">📦 Otro</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                    {activeTab === 'PROPIO' ? (
                        <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Valor de Inversión (₲)</label>
                        <input type="number" value={formData.valor_actual} onChange={e => setFormData({...formData, valor_actual: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="0" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Costo Diario (₲)</label>
                            <input type="number" value={formData.costo_renta_dia} onChange={e => setFormData({...formData, costo_renta_dia: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Vencimiento Renta</label>
                            <input type="date" value={formData.fecha_fin_renta} onChange={e => setFormData({...formData, fecha_fin_renta: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        </div>
                    )}
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                        {isSubmitting ? 'Guardando...' : 'Integrar al Sistema'}
                    </button>
                </div>
                </form>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-bl-full -z-0" />
            </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );
}

function SummaryCard({ label, value, icon, color }: any) {
    return (
        <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all hover:shadow-lg ${color}`}>
            <div className="flex items-center gap-3 opacity-60 mb-3">
                {icon}
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
            </div>
            <p className="text-3xl font-black tracking-tight">{value}</p>
        </div>
    );
}
