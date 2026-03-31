import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search, AlertCircle, Loader2, Plus, X
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  formatGsShort, getEquipmentIcon,
} from '../data/sampleData';

const condConfig: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: 'text-emerald-600 bg-emerald-50' },
  bueno: { label: 'Bueno', color: 'text-blue-600 bg-blue-50' },
  regular: { label: 'Regular', color: 'text-amber-600 bg-amber-50' },
  reparacion: { label: 'Reparación', color: 'text-red-600 bg-red-50' },
};

export default function Inventario() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { inventarioEquipo, loading } = useSupabaseData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'PROPIO' | 'RENTADO'>('PROPIO');
  
  // ADD MODAL STATE
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
    if (!user) {
      alert('Debes iniciar sesión para agregar equipos');
      return;
    }
    setIsSubmitting(true);
    
    try {
      // Sanitize data: turn empty strings into nulls to avoid DB type errors (especially for DATE)
      const submitData: any = {
        ...formData,
        user_id: user.id, // REQUIRED for RLS
        tipo_propiedad: activeTab,
        valor_actual: formData.valor_actual ? Number(formData.valor_actual) : null,
        costo_renta_dia: formData.costo_renta_dia ? Number(formData.costo_renta_dia) : null,
        fecha_fin_renta: (formData.fecha_fin_renta || '').trim() === '' ? null : formData.fecha_fin_renta
      };

      // If it's Owned, remove Rental fields to be clean
      if (activeTab === 'PROPIO') {
        submitData.costo_renta_dia = null;
        submitData.fecha_fin_renta = null;
      } else {
        submitData.valor_actual = null;
      }

      const { error } = await supabase
        .from('inventario_equipo')
        .insert([submitData]);

      if (error) throw error;
      
      // Force immediate refresh even if subscription is slow
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
      alert('Error al agregar el equipo');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="text-emerald-500 animate-spin" size={32} />
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Inventario y Equipos</h1>
          <p className="text-gray-500 mt-1">{inventarioEquipo.length} equipos en total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <TabBtn label={`Propio (${totalPropio})`} active={activeTab === 'PROPIO'} onClick={() => setActiveTab('PROPIO')} />
            <TabBtn label={`Rentado (${totalRentado})`} active={activeTab === 'RENTADO'} onClick={() => setActiveTab('RENTADO')} />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
          >
            <Plus size={18} /> Nuevo
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar equipo, marca o serie..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(equipo => {
          const cond = condConfig[equipo.condicion] || condConfig.bueno;

          return (
            <div key={equipo.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {getEquipmentIcon(equipo.tipo)}
                </div>
                <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${cond.color}`}>
                  {cond.label}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 text-lg mb-1">{equipo.nombre}</h3>
              <p className="text-sm text-gray-500 mb-4">{equipo.marca_modelo}</p>

              <div className="space-y-3 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Nº Serie:</span>
                  <span className="font-medium text-gray-700">{equipo.numero_serie || 'N/A'}</span>
                </div>
                
                {equipo.tipo_propiedad === 'PROPIO' ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Valor Est.:</span>
                    <span className="font-bold text-gray-900">{formatGsShort(Number(equipo.valor_actual || 0))}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Costo/Día:</span>
                      <span className="font-bold text-emerald-600">{formatGsShort(Number(equipo.costo_renta_dia || 0))}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1.5 rounded-lg text-[10px] font-bold">
                      <AlertCircle size={12} />
                      Vence: {equipo.fecha_fin_renta}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD ASSET MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900">Agregar Nuevo Activo</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Sección {activeTab}</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddAsset} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nombre del Equipo</label>
                  <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-400 focus:bg-white bg-gray-50 outline-none transition-all font-bold" placeholder="Eje: Sony A7IV" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Marca / Modelo</label>
                  <input value={formData.marca_modelo} onChange={e => setFormData({...formData, marca_modelo: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-400 focus:bg-white bg-gray-50 outline-none transition-all font-bold" placeholder="Eje: Sony" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nº Serie</label>
                  <input value={formData.numero_serie} onChange={e => setFormData({...formData, numero_serie: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-400 focus:bg-white bg-gray-50 outline-none transition-all font-bold" placeholder="Eje: SN-1234..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Condición</label>
                  <select value={formData.condicion} onChange={e => setFormData({...formData, condicion: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-400 focus:bg-white bg-gray-50 outline-none transition-all font-bold">
                    <option value="nuevo">Nuevo</option>
                    <option value="bueno">Bueno</option>
                    <option value="regular">Regular</option>
                    <option value="reparacion">En Reparación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Categoría</label>
                  <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-400 focus:bg-white bg-gray-50 outline-none transition-all font-bold">
                    <option value="camara">Cámara</option>
                    <option value="lente">Lente</option>
                    <option value="iluminacion">Luces/Iluminación</option>
                    <option value="audio">Audio</option>
                    <option value="drone">Drone</option>
                    <option value="estabilizador">Gimbal/Estabilizador</option>
                    <option value="computo">Edición/PC</option>
                    <option value="accesorios">Accesorio</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="col-span-2">
                  {activeTab === 'PROPIO' ? (
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Valor Estimado (₲)</label>
                      <input type="number" value={formData.valor_actual} onChange={e => setFormData({...formData, valor_actual: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-400 focus:bg-white bg-gray-50 outline-none transition-all font-bold" placeholder="0" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Costo/Día (₲)</label>
                        <input type="number" value={formData.costo_renta_dia} onChange={e => setFormData({...formData, costo_renta_dia: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-400 focus:bg-white bg-gray-50 outline-none transition-all font-bold" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Fin de Renta</label>
                        <input type="date" value={formData.fecha_fin_renta} onChange={e => setFormData({...formData, fecha_fin_renta: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-400 focus:bg-white bg-gray-50 outline-none transition-all font-bold" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Guardar en Inventario'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
        active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );
}
