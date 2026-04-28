import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Search, Edit2, Trash2, PackageSearch, AlertCircle, ShoppingCart, Tag, Book, Layers, DollarSign } from 'lucide-react';

export default function Productos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [activeTab, setActiveTab] = useState('generales');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Data State
  const [formData, setFormData] = useState({
    codigo: '',
    codigo_barras: '',
    descripcion: '',
    descripcion_tecnica: '',
    marca_id: '',
    familia_id: '',
    grupo_id: '',
    unidad_medida: 'UN',
    contenido: '0',
    cantidad_por_caja: '1',
    factor_conversion: '1',
    stock_actual: '0',
    stock_minimo: '0',
    controla_inventario: true,
    precio_unitario: '0',
    precio_minimo: '0',
    precio_maximo: '0',
    costo_promedio: '0',
    costo_ultimo: '0',
    iva_tipo: '10',
    activo: true
  });

  const [errorMsg, setErrorMsg] = useState('');
  
  // Prompts for Quick Add
  const handleQuickAdd = async (table: string, title: string) => {
     const val = window.prompt(`Ingrese el nombre de la nueva ${title}:`);
     if (!val) return;
     const { data, error } = await supabase.from(table).insert({ user_id: user?.id, nombre: val }).select().single();
     if (error) { alert("Error: " + error.message); return; }
     queryClient.invalidateQueries({ queryKey: [table] });
     // Auto-select the newly created id depending on the table
     if (table === 'productos_marcas') setFormData(prev => ({...prev, marca_id: data.id}));
     if (table === 'productos_familias') setFormData(prev => ({...prev, familia_id: data.id}));
  };

  // Queries
  const { data: productos, isLoading } = useQuery({ queryKey: ['productos_catalogo', user?.id], queryFn: async () => { const { data } = await supabase.from('productos_catalogo').select(`*, productos_familias(nombre), productos_marcas(nombre)`).order('descripcion'); return data || []; }, enabled: !!user });
  const { data: marcas } = useQuery({ queryKey: ['productos_marcas', user?.id], queryFn: async () => { const { data } = await supabase.from('productos_marcas').select('*').order('nombre'); return data || []; }, enabled: !!user });
  const { data: familias } = useQuery({ queryKey: ['productos_familias', user?.id], queryFn: async () => { const { data } = await supabase.from('productos_familias').select('*').order('nombre'); return data || []; }, enabled: !!user });

  const upsertMutation = useMutation({
    mutationFn: async (payload: any) => {
      const dbPayload = {
        user_id: user?.id,
        codigo: payload.codigo,
        codigo_barras: payload.codigo_barras || null,
        descripcion: payload.descripcion,
        descripcion_tecnica: payload.descripcion_tecnica || null,
        marca_id: payload.marca_id || null,
        familia_id: payload.familia_id || null,
        grupo_id: payload.grupo_id || null,
        unidad_medida: payload.unidad_medida,
        contenido: Number(payload.contenido || 0),
        cantidad_por_caja: Number(payload.cantidad_por_caja || 1),
        factor_conversion: Number(payload.factor_conversion || 1),
        stock_actual: Number(payload.stock_actual || 0),
        stock_minimo: Number(payload.stock_minimo || 0),
        controla_inventario: payload.controla_inventario,
        precio_unitario: Number(payload.precio_unitario || 0),
        precio_minimo: Number(payload.precio_minimo || 0),
        precio_maximo: Number(payload.precio_maximo || 0),
        costo_promedio: Number(payload.costo_promedio || 0),
        costo_ultimo: Number(payload.costo_ultimo || 0),
        iva_tipo: Number(payload.iva_tipo || 10),
        activo: payload.activo,
        // Cuentas contables van nulas por ahora para no romper
        cuenta_compras_id: null,
        cuenta_ventas_id: null,
        cuenta_inventario_id: null
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

  const toggleStatusMutation = useMutation({ mutationFn: async ({ id, activo }: { id: string, activo: boolean }) => { await supabase.from('productos_catalogo').update({ activo }).eq('id', id); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos_catalogo'] }) });
  const deleteMutation = useMutation({ mutationFn: async (id: string) => { await supabase.from('productos_catalogo').delete().eq('id', id); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos_catalogo'] }) });

  const resetForm = () => {
    setFormData({ codigo: '', codigo_barras: '', descripcion: '', descripcion_tecnica: '', marca_id: '', familia_id: '', grupo_id: '', unidad_medida: 'UN', contenido: '0', cantidad_por_caja: '1', factor_conversion: '1', stock_actual: '0', stock_minimo: '0', controla_inventario: true, precio_unitario: '0', precio_minimo: '0', precio_maximo: '0', costo_promedio: '0', costo_ultimo: '0', iva_tipo: '10', activo: true });
    setEditingId(null);
    setErrorMsg('');
    setActiveTab('generales');
  };

  const handleEdit = (prod: any) => {
    setFormData({
      codigo: prod.codigo, codigo_barras: prod.codigo_barras || '', descripcion: prod.descripcion, descripcion_tecnica: prod.descripcion_tecnica || '', marca_id: prod.marca_id || '', familia_id: prod.familia_id || '', grupo_id: prod.grupo_id || '', unidad_medida: prod.unidad_medida || 'UN', contenido: prod.contenido?.toString() || '0', cantidad_por_caja: prod.cantidad_por_caja?.toString() || '1', factor_conversion: prod.factor_conversion?.toString() || '1', stock_actual: prod.stock_actual?.toString() || '0', stock_minimo: prod.stock_minimo?.toString() || '0', controla_inventario: prod.controla_inventario !== false, precio_unitario: prod.precio_unitario?.toString() || '0', precio_minimo: prod.precio_minimo?.toString() || '0', precio_maximo: prod.precio_maximo?.toString() || '0', costo_promedio: prod.costo_promedio?.toString() || '0', costo_ultimo: prod.costo_ultimo?.toString() || '0', iva_tipo: prod.iva_tipo?.toString() || '10', activo: prod.activo !== false
    });
    setEditingId(prod.id);
    setActiveTab('generales');
    setMostrarModal(true);
  };

  const filteredProductos = productos?.filter((p: any) => p.descripcion.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
            <ShoppingCart size={14} /> Gestión de Artículos
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Maestro de Artículos</h1>
          <p className="text-slate-500 font-medium italic">Control avanzado de inventarios, familias y precios (A.B.M. Integral).</p>
        </div>
        <div>
          <button onClick={() => { resetForm(); setMostrarModal(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg w-full justify-center">
            <Plus size={16} /> Crear Artículo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm">
         <div className="relative group max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input type="text" placeholder="Buscar por código RUC o descripción..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[1.25rem] border-none focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none font-bold text-gray-800 placeholder:text-gray-400" />
          </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Código</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Familia</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Venta</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                <th className="p-5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">Cargando catálogo ERP...</td></tr>}
              {!isLoading && filteredProductos?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-2"><PackageSearch size={32} className="text-slate-300" /><span className="text-slate-400 font-medium italic">Catálogo vacío.</span></div>
                  </td>
                </tr>
              )}
              {filteredProductos?.map((p: any) => (
                <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${!p.activo ? 'opacity-50' : ''}`}>
                  <td className="p-5"><span className="bg-slate-100 text-slate-600 font-black text-xs px-3 py-1.5 rounded-lg font-mono">{p.codigo}</span></td>
                  <td className="p-5">
                    <p className="font-bold text-slate-800">{p.descripcion}</p>
                    {p.codigo_barras && <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1"><Book size={10}/> Cód. Barras: {p.codigo_barras}</p>}
                  </td>
                  <td className="p-5">
                     {p.productos_familias?.nombre ? <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">{p.productos_familias.nombre}</span> : <span className="text-xs text-slate-300">-</span>}
                  </td>
                  <td className="p-5 text-right font-black text-slate-900">₲ {Number(p.precio_unitario).toLocaleString()}</td>
                  <td className="p-5 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-black text-xs ${p.stock_actual <= p.stock_minimo ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                       {p.stock_actual}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => toggleStatusMutation.mutate({ id: p.id, activo: !p.activo })} className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-lg transition-colors ${p.activo ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                         {p.activo ? 'Inactivar' : 'Activar'}
                      </button>
                      <button onClick={() => handleEdit(p)} className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => { if(window.confirm('¿Borrar registro maestro? No se recomienda si ya posee facturas asociadas.')) deleteMutation.mutate(p.id) }} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
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
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-4xl min-h-[85vh] lg:min-h-0 lg:max-h-[90vh] rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl flex flex-col relative">
                <div className="px-6 lg:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl z-20 rounded-t-[2.5rem]">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                     <Layers size={24} className="text-indigo-500"/>
                     {editingId ? 'Ficha de Artículo' : 'Nuevo Artículo (A.B.M)'}
                  </h2>
                  <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
                </div>

                <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
                   {[
                      {id: 'generales', icon: <Book size={16}/>, label: 'Datos Generales'},
                      {id: 'clasificacion', icon: <Tag size={16}/>, label: 'Clasificación'},
                      {id: 'inventario', icon: <PackageSearch size={16}/>, label: 'Inventario & Costos'},
                      {id: 'precios', icon: <DollarSign size={16}/>, label: 'Precios y Política'}
                   ].map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 font-bold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:bg-slate-50'}`}>
                         {tab.icon} {tab.label}
                      </button>
                   ))}
                </div>

                <div className="p-6 lg:p-8 space-y-6 overflow-y-auto flex-1">
                   {errorMsg && <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex gap-3 text-sm font-medium"><AlertCircle className="shrink-0" size={20} /> {errorMsg}</div>}
                   
                   {activeTab === 'generales' && (
                     <div className="space-y-4">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Código Principal (Obligatorio)</label>
                               <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: ITEM-001" disabled={!!editingId} />
                            </div>
                            <div>
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Código de Barras (Opcional)</label>
                               <input type="text" value={formData.codigo_barras} onChange={e => setFormData({...formData, codigo_barras: e.target.value.toUpperCase()})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: 784000..." />
                            </div>
                         </div>
                         <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre del Artículo / Descripción Principal</label>
                            <input type="text" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Jabón Liquido 5L" />
                         </div>
                         <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Detalles Técnicos (Exclusivo Uso Interno)</label>
                            <textarea value={formData.descripcion_tecnica} onChange={e => setFormData({...formData, descripcion_tecnica: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]" placeholder="Ej: Dimensiones, componentes principales..." />
                         </div>
                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidad (U.M)</label>
                               <input type="text" value={formData.unidad_medida} onChange={e => setFormData({...formData, unidad_medida: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="UN, KG, LT" />
                            </div>
                            <div>
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contenido</label>
                               <input type="number" value={formData.contenido} onChange={e => setFormData({...formData, contenido: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cant x Caja</label>
                               <input type="number" value={formData.cantidad_por_caja} onChange={e => setFormData({...formData, cantidad_por_caja: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Factor Conv.</label>
                               <input type="number" value={formData.factor_conversion} onChange={e => setFormData({...formData, factor_conversion: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                         </div>
                     </div>
                   )}

                   {activeTab === 'clasificacion' && (
                     <div className="space-y-4">
                         <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Marca Operativa</label>
                            <div className="flex gap-2 items-center mt-2">
                               <select value={formData.marca_id} onChange={e => setFormData({...formData, marca_id: e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                  <option value="">Seleccione o cree una...</option>
                                  {marcas?.map((m: any) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                               </select>
                               <button onClick={() => handleQuickAdd('productos_marcas', 'Marca')} className="bg-slate-900 text-white p-3.5 rounded-xl hover:bg-slate-800 transition-colors"><Plus size={18}/></button>
                            </div>
                         </div>
                         <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Familia de Productos</label>
                            <div className="flex gap-2 items-center mt-2">
                               <select value={formData.familia_id} onChange={e => setFormData({...formData, familia_id: e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                  <option value="">Seleccione o cree una...</option>
                                  {familias?.map((f: any) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                               </select>
                               <button onClick={() => handleQuickAdd('productos_familias', 'Familia')} className="bg-slate-900 text-white p-3.5 rounded-xl hover:bg-slate-800 transition-colors"><Plus size={18}/></button>
                            </div>
                         </div>
                         <div className="bg-indigo-50 p-4 border border-indigo-100 rounded-2xl mt-4">
                            <p className="text-xs text-indigo-700 font-bold">Tip: La clasificación permite agrupar y emitir reportes y balances exactos (Inventario vs Ventas por Familia).</p>
                         </div>
                     </div>
                   )}

                   {activeTab === 'inventario' && (
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stk. Físico Inicial / Actual</label>
                              <input type="number" value={formData.stock_actual} onChange={e => setFormData({...formData, stock_actual: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-black text-lg outline-none focus:ring-2 focus:ring-indigo-500 text-center" />
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stk. Mínimo (Alerta)</label>
                              <input type="number" value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-black text-lg text-rose-500 outline-none focus:ring-2 focus:ring-indigo-500 text-center" />
                           </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Costo Prom. Ponderado (Gs)</label>
                              <input type="number" value={formData.costo_promedio} onChange={e => setFormData({...formData, costo_promedio: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-right" />
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Costo Úit. Compra (Gs)</label>
                              <input type="number" value={formData.costo_ultimo} onChange={e => setFormData({...formData, costo_ultimo: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-right" />
                           </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                           <span className="text-sm font-bold text-slate-700">Maneja Inventario Activo</span>
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={formData.controla_inventario} onChange={e => setFormData({...formData, controla_inventario: e.target.checked})} className="sr-only peer" />
                              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                           </label>
                        </div>
                     </div>
                   )}

                   {activeTab === 'precios' && (
                      <div className="space-y-4">
                         <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl mb-6">
                            <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Precio de Venta Default al Público (Gs)</label>
                            <input type="number" value={formData.precio_unitario} onChange={e => setFormData({...formData, precio_unitario: e.target.value})} className="mt-2 w-full bg-white border border-emerald-200 px-6 py-5 rounded-2xl font-black text-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-900" placeholder="0" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mínimo Permitido</label>
                               <input type="number" value={formData.precio_minimo} onChange={e => setFormData({...formData, precio_minimo: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Máximo Permitido</label>
                               <input type="number" value={formData.precio_maximo} onChange={e => setFormData({...formData, precio_maximo: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                         </div>
                         <div className="mt-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tributación / Tipo IVA (%)</label>
                            <select value={formData.iva_tipo} onChange={e => setFormData({...formData, iva_tipo: e.target.value})} className="mt-2 w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                               <option value="10">Gravada IVA 10%</option>
                               <option value="5">Gravada IVA 5%</option>
                               <option value="0">Exenta (0%)</option>
                            </select>
                         </div>
                         {/* Cuentas contables van ocultas como solicitó el usuario */}
                      </div>
                   )}

                </div>
                {/* Botón Flotante o Bottom Bar */}
                <div className="p-6 lg:p-8 border-t border-slate-100 bg-slate-50/50 rounded-b-[2.5rem]">
                   <button onClick={() => upsertMutation.mutate(formData)} disabled={upsertMutation.isPending || !formData.codigo || !formData.descripcion} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 shadow-xl shadow-indigo-500/20">
                      {upsertMutation.isPending ? 'Grabando Ficha ERP...' : 'Guardar Ficha Contable'}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
