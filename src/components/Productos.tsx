import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Search, Edit2, Trash2, PackageSearch, AlertCircle, ShoppingCart } from 'lucide-react';

export default function Productos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    precio_unitario: '',
    iva_tipo: '10',
    stock_actual: '0',
    activo: true
  });

  const [errorMsg, setErrorMsg] = useState('');

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos_catalogo', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos_catalogo')
        .select('*')
        .order('descripcion', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: any) => {
      const dbPayload = {
        user_id: user?.id,
        codigo: payload.codigo,
        descripcion: payload.descripcion,
        precio_unitario: Number(payload.precio_unitario),
        iva_tipo: Number(payload.iva_tipo),
        stock_actual: Number(payload.stock_actual),
        activo: payload.activo
      };

      if (editingId) {
        const { error } = await supabase.from('productos_catalogo').update(dbPayload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('productos_catalogo').insert(dbPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos_catalogo'] });
      setMostrarModal(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMsg(err.message.includes('unique') ? 'El código ingresado ya existe en tu catálogo.' : err.message);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string, activo: boolean }) => {
      const { error } = await supabase.from('productos_catalogo').update({ activo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos_catalogo'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('productos_catalogo').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos_catalogo'] })
  });

  const resetForm = () => {
    setFormData({ codigo: '', descripcion: '', precio_unitario: '', iva_tipo: '10', stock_actual: '0', activo: true });
    setEditingId(null);
    setErrorMsg('');
  };

  const handleEdit = (prod: any) => {
    setFormData({
      codigo: prod.codigo,
      descripcion: prod.descripcion,
      precio_unitario: prod.precio_unitario.toString(),
      iva_tipo: prod.iva_tipo.toString(),
      stock_actual: prod.stock_actual.toString(),
      activo: prod.activo
    });
    setEditingId(prod.id);
    setMostrarModal(true);
  };

  const filteredProductos = productos?.filter((p: any) => 
    p.descripcion.toLowerCase().includes(search.toLowerCase()) || 
    p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
            <ShoppingCart size={14} /> Catálogo Ventas
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Mis Productos</h1>
          <p className="text-slate-500 font-medium italic">Gestión de stock vinculado al módulo de facturación.</p>
        </div>
        <div>
          <button 
            onClick={() => { resetForm(); setMostrarModal(true); }}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg w-full lg:w-auto justify-center"
          >
            <Plus size={16} /> Crear Producto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm">
         <div className="relative group max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[1.25rem] border-none focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none font-bold text-gray-800 placeholder:text-gray-400"
            />
          </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Código</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio unitario</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Impuesto</th>
                <th className="p-5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">Cargando catálogo...</td></tr>}
              {!isLoading && filteredProductos?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <PackageSearch size={32} className="text-slate-300" />
                       <span className="text-slate-400 font-medium italic">No se encontraron productos en el catálogo.</span>
                    </div>
                  </td>
                </tr>
              )}
              {filteredProductos?.map((p: any) => (
                <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${!p.activo ? 'opacity-50' : ''}`}>
                  <td className="p-5">
                    <span className="bg-slate-100 text-slate-600 font-black text-xs px-3 py-1.5 rounded-lg font-mono">
                      {p.codigo}
                    </span>
                  </td>
                  <td className="p-5 font-bold text-slate-800">{p.descripcion}</td>
                  <td className="p-5 text-right font-black text-slate-900">₲ {Number(p.precio_unitario).toLocaleString()}</td>
                  <td className="p-5 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-black text-xs ${p.stock_actual <= 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                       {p.stock_actual}
                    </span>
                  </td>
                  <td className="p-5 text-center font-bold text-xs text-slate-500">IVA {p.iva_tipo}%</td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                         onClick={() => toggleStatusMutation.mutate({ id: p.id, activo: !p.activo })}
                         className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${p.activo ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      >
                         {p.activo ? 'Pausar' : 'Reactivar'}
                      </button>
                      <button onClick={() => handleEdit(p)} className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={16} /></button>
                      <button 
                         onClick={() => { if(window.confirm('¿Seguro de borrar estre producto? Su historial en las facturas emitidas seguirá intacto.')) deleteMutation.mutate(p.id) }} 
                         className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {mostrarModal && (
          <div className="fixed inset-0 z-[100] flex justify-center p-4 lg:p-10 bg-slate-900/60 backdrop-blur-sm lg:items-center overflow-y-auto">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white w-full max-w-xl rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl flex flex-col relative"
             >
                <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                  <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
                </div>

                <div className="p-6 lg:p-8 space-y-6">
                   {errorMsg && (
                      <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex gap-3 text-sm font-medium">
                         <AlertCircle className="shrink-0" size={20} /> {errorMsg}
                      </div>
                   )}
                   
                   <div className="space-y-4">
                      <div>
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Código o SKU</label>
                         <input 
                           type="text" 
                           value={formData.codigo} 
                           onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                           className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                           placeholder="Ej: ITEM-001" 
                           disabled={!!editingId}
                        />
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descripción del Producto/Servicio</label>
                         <input 
                           type="text" 
                           value={formData.descripcion} 
                           onChange={e => setFormData({...formData, descripcion: e.target.value})}
                           className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                           placeholder="Ej: Teclado Mecánico RGB" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Precio Unitario Gs</label>
                            <input 
                              type="number" 
                              value={formData.precio_unitario} 
                              onChange={e => setFormData({...formData, precio_unitario: e.target.value})}
                              className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-right" 
                              placeholder="0" 
                           />
                         </div>
                         <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo IVA (%)</label>
                            <select 
                              value={formData.iva_tipo} 
                              onChange={e => setFormData({...formData, iva_tipo: e.target.value})}
                              className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                               <option value="10">IVA 10%</option>
                               <option value="5">IVA 5%</option>
                               <option value="0">Exento (0%)</option>
                            </select>
                         </div>
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase text-indigo-500 tracking-widest ml-1">Stock Actual (Inventario)</label>
                         <input 
                           type="number" 
                           value={formData.stock_actual} 
                           onChange={e => setFormData({...formData, stock_actual: e.target.value})}
                           className="mt-2 w-full bg-indigo-50 border border-indigo-100 px-4 py-4 rounded-2xl font-black text-lg text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 text-center" 
                        />
                        <p className="text-xs text-slate-400 font-medium italic text-center mt-2">Al emitir facturas, este valor se reducirá automáticamente.</p>
                      </div>
                   </div>

                   <button 
                      onClick={() => upsertMutation.mutate(formData)}
                      disabled={upsertMutation.isPending || !formData.codigo || !formData.descripcion || !formData.precio_unitario}
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 mt-4"
                   >
                      {upsertMutation.isPending ? 'Guardando...' : 'Guardar Producto'}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
