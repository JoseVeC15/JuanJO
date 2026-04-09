import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Plus, X, AlertCircle, CheckCircle, Search, FileText, Download, DollarSign, Settings2, Trash2 } from 'lucide-react';

const TIPOS_DOC = {
  1: 'Factura',
  2: 'AutoFactura',
  5: 'Nota de Débito',
  6: 'Nota de Crédito'
};

const CONDICIONES = ['contado', 'credito'] as const;

const ProductAutocomplete = ({ item, index, items, setItems, productos }: any) => {
   const [open, setOpen] = useState(false);
   
   const updateLocal = (changes: any) => {
       const ni = [...items];
       ni[index] = { ...ni[index], ...changes };
       setItems(ni);
   };

   const filtrados = productos?.filter((p:any) => 
       p.descripcion.toLowerCase().includes(item.descripcion.toLowerCase()) || 
       p.codigo.toLowerCase().includes(item.descripcion.toLowerCase())
   ) || [];

   return (
      <div className="relative col-span-9 md:col-span-3">
         <input 
            type="text" 
            placeholder="Descripción" 
            value={item.descripcion} 
            onChange={e => { updateLocal({ descripcion: e.target.value }); setOpen(true); }}
            onFocus={() => { if(filtrados.length > 0) setOpen(true); }}
            onBlur={() => setTimeout(() => setOpen(false), 250)}
            className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm outline-none" 
         />
         {open && filtrados.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-[150%] max-w-[300px] max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl">
               {filtrados.map((p:any) => (
                     <div 
                        key={p.id} 
                        onClick={() => {
                           updateLocal({ codigo: p.codigo, descripcion: p.descripcion, precio_unitario: p.precio_unitario, iva_tipo: p.iva_tipo });
                           setOpen(false);
                        }}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                     >
                        <p className="font-bold text-xs text-slate-800">{p.descripcion}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-1 rounded">Cód: {p.codigo}</span>
                           <span className="text-[10px] font-bold text-slate-500">{p.stock_actual} en stock</span>
                        </div>
                     </div>
               ))}
            </div>
         )}
      </div>
   );
};

export default function FacturacionAutoimpresor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { profile } = useSupabaseData(); // Para ver si es admin o multiempresa, si aplica
  
  // Flag desde el tenant o global (simplificado a un state temporal local si no hay DB de metadata)
  const [multimonedaEnabled, setMultimonedaEnabled] = useState(false); // Podría venir de global settings

  const [mostrarModal, setMostrarModal] = useState(false);
  const [search, setSearch] = useState('');
  
  // State for Form
  const [formData, setFormData] = useState({
    tipo_documento: 1,
    numero_prefijo: '001',
    numero_punto: '001',
    numero_secuencia: '',
    timbrado: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    condicion_venta: 'contado',
    cliente_razon_social: '',
    cliente_ruc: '',
    cliente_direccion: '',
    moneda: 'PYG',
    tasa_cambio: 1,
    asociado_timbrado: '',
    asociado_numero: '',
    asociado_fecha: '',
    motivo_modificacion: ''
  });

  const [items, setItems] = useState([
    { id: Date.now().toString(), codigo: '', descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10 }
  ]);

  const { data: facturas, isLoading } = useQuery({
    queryKey: ['facturas_virtuales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas_virtuales')
        .select(`
          *,
          facturas_virtuales_items (*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: productosCatalogo } = useQuery({
    queryKey: ['productos_catalogo_list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('productos_catalogo').select('*').eq('activo', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const mutationCreate = useMutation({
    mutationFn: async (payload: any) => {
      const dbPayload = {
        user_id: user?.id,
        tipo_documento: payload.tipo_documento,
        numero_documento: `${payload.numero_prefijo}-${payload.numero_punto}-${payload.numero_secuencia.padStart(7, '0')}`,
        timbrado: payload.timbrado,
        fecha_emision: payload.fecha_emision,
        condicion_venta: payload.condicion_venta,
        cliente_razon_social: payload.cliente_razon_social,
        cliente_ruc: payload.cliente_ruc,
        cliente_direccion: payload.cliente_direccion,
        moneda: payload.moneda,
        tasa_cambio: Number(payload.tasa_cambio),
        monto_total: payload.totales.total,
        total_iva_10: payload.totales.iva10,
        total_iva_5: payload.totales.iva5,
        total_exenta: payload.totales.exenta,
        asociado_timbrado: payload.asociado_timbrado || null,
        asociado_numero: payload.asociado_numero || null,
        asociado_fecha: payload.asociado_fecha || null,
        motivo_modificacion: payload.motivo_modificacion || null,
        estado: 'emitido'
      };

      const { data: facturaRow, error: errorDoc } = await supabase
        .from('facturas_virtuales')
        .insert(dbPayload)
        .select()
        .single();

      if (errorDoc) throw errorDoc;

      const itemsPayload = payload.items.map((i: any) => ({
        factura_id: facturaRow.id,
        codigo: i.codigo || null,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        iva_tipo: i.iva_tipo,
        monto_total_item: i.cantidad * i.precio_unitario
      }));

      const { error: errorItems } = await supabase.from('facturas_virtuales_items').insert(itemsPayload);
      if (errorItems) throw errorItems;

      return facturaRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas_virtuales'] });
      setMostrarModal(false);
      resetForm();
      alert('Documento guardado con éxito');
    },
    onError: (err: any) => {
      console.error(err);
      alert(`Error al guardar: ${err.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      tipo_documento: 1,
      numero_prefijo: '001',
      numero_punto: '001',
      numero_secuencia: '',
      timbrado: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      condicion_venta: 'contado',
      cliente_razon_social: '',
      cliente_ruc: '',
      cliente_direccion: '',
      moneda: 'PYG',
      tasa_cambio: 1,
      asociado_timbrado: '',
      asociado_numero: '',
      asociado_fecha: '',
      motivo_modificacion: ''
    });
    setItems([{ id: Date.now().toString(), codigo: '', descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10 }]);
  };

  const calcularTotales = () => {
    return items.reduce((acc, p) => {
      const monto = p.cantidad * p.precio_unitario;
      if (Number(p.iva_tipo) === 10) { acc.iva10 += Math.round(monto / 11); }
      if (Number(p.iva_tipo) === 5) { acc.iva5 += Math.round(monto / 21); }
      if (Number(p.iva_tipo) === 0) { acc.exenta += monto; }
      acc.total += monto;
      return acc;
    }, { iva10: 0, iva5: 0, exenta: 0, total: 0 });
  };

  const isNota = formData.tipo_documento === 5 || formData.tipo_documento === 6;

  const handleImprimir = async (factura: any) => {
      try {
          const { generarPdfAutoimpreso } = await import('../lib/pdf/autoimpresor');
          generarPdfAutoimpreso(factura);
      } catch (err) {
          console.error("Error cargando generador PDF", err);
          alert("Ocurrió un error al generar el PDF.");
      }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
            <FileText size={14} /> Físico / Pre-impreso SET
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Facturación Virtual</h1>
          <p className="text-slate-500 font-medium italic">Registro unificado para modelos Autoimpresores.</p>
        </div>
        <div className="flex gap-3">
          <button
             onClick={() => setMultimonedaEnabled(!multimonedaEnabled)}
             className={`flex items-center gap-2 px-4 py-2.5 lg:px-5 lg:py-3 rounded-xl border font-bold text-xs transition-all ${multimonedaEnabled ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
             {multimonedaEnabled ? <DollarSign size={16} /> : <Settings2 size={16} />}
             <span className="hidden sm:inline">Modo Multimoneda</span>
          </button>
          <button 
            onClick={() => { resetForm(); setMostrarModal(true); }}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
          >
            <Plus size={16} /> Registrar Comprobante
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm">
         <div className="relative group max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar por RUC o Nro de Documento..."
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
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Fecha</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Receptor</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                <th className="p-5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">Cargando...</td></tr>}
              {!isLoading && facturas?.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium italic">No hay registros aún.</td></tr>}
              {facturas?.filter((f:any) => f.cliente_ruc.includes(search) || f.numero_documento.includes(search)).map((f:any) => (
                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 font-bold text-slate-600 text-sm">{f.fecha_emision}</td>
                  <td className="p-5">
                    <p className="font-black text-slate-900 border border-slate-200 bg-white px-2 py-1 rounded inline-block text-xs">{f.numero_documento}</p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-widest">{TIPOS_DOC[f.tipo_documento as keyof typeof TIPOS_DOC]}</p>
                  </td>
                  <td className="p-5">
                     <p className="font-bold text-slate-800 truncate max-w-[200px]">{f.cliente_razon_social}</p>
                     <p className="text-[10px] font-bold text-slate-400">RUC: {f.cliente_ruc}</p>
                  </td>
                  <td className="p-5 text-right">
                     <p className="font-black text-slate-900">{f.moneda === 'PYG' ? '₲' : f.moneda} {Number(f.monto_total).toLocaleString()}</p>
                     {f.moneda !== 'PYG' && <p className="text-[9px] font-bold text-slate-400 text-right">TC: {f.tasa_cambio}</p>}
                  </td>
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => handleImprimir(f)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all inline-flex items-center gap-2 font-bold text-xs"
                    >
                      <Download size={14} /> PDF
                    </button>
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
               className="bg-white w-full max-w-4xl min-h-[85vh] lg:min-h-0 lg:max-h-[90vh] rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl flex flex-col relative"
             >
                <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20 rounded-t-[2rem]">
                  <h2 className="text-2xl font-black text-slate-900">Registrar Comprobante SET</h2>
                  <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
                  {/* Tipo doc y Cabecera legal */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo Documento</label>
                        <select 
                           value={formData.tipo_documento}
                           onChange={(e) => setFormData({...formData, tipo_documento: Number(e.target.value)})}
                           className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                           {Object.entries(TIPOS_DOC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Formato SET (Est - Pto - Secuencia)</label>
                        <div className="flex gap-2">
                           <input type="text" maxLength={3} value={formData.numero_prefijo} onChange={e => setFormData({...formData, numero_prefijo: e.target.value})} className="w-20 text-center bg-slate-50 border border-slate-200 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="001" />
                           <span className="text-xl font-black text-slate-300 self-center">-</span>
                           <input type="text" maxLength={3} value={formData.numero_punto} onChange={e => setFormData({...formData, numero_punto: e.target.value})} className="w-20 text-center bg-slate-50 border border-slate-200 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="001" />
                           <span className="text-xl font-black text-slate-300 self-center">-</span>
                           <input type="text" maxLength={7} value={formData.numero_secuencia} onChange={e => setFormData({...formData, numero_secuencia: e.target.value})} className="flex-1 text-center bg-slate-50 border border-slate-200 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0000001" />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Timbrado (8 dígitos)</label>
                        <input type="text" maxLength={8} value={formData.timbrado} onChange={e => setFormData({...formData, timbrado: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="12345678" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fecha Emisión</label>
                        <input type="date" value={formData.fecha_emision} onChange={e => setFormData({...formData, fecha_emision: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Condición Venta</label>
                        <select value={formData.condicion_venta} onChange={e => setFormData({...formData, condicion_venta: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold uppercase tracking-wide outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="contado">Contado</option><option value="credito">Crédito</option>
                        </select>
                      </div>
                  </div>

                  {multimonedaEnabled && (
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl grid grid-cols-2 gap-4 items-center">
                        <div>
                           <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">Moneda</label>
                           <select value={formData.moneda} onChange={e => setFormData({...formData, moneda: e.target.value})} className="mt-2 w-full bg-white border border-indigo-200 px-4 py-3 rounded-xl font-bold outline-none">
                              <option value="PYG">Guaraníes (PYG)</option>
                              <option value="USD">Dólares (USD)</option>
                              <option value="EUR">Euros (EUR)</option>
                              <option value="BRL">Reales (BRL)</option>
                           </select>
                        </div>
                        {formData.moneda !== 'PYG' && (
                          <div>
                              <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">Tasa de Cambio (Ley 6380)</label>
                              <input type="number" step="0.01" value={formData.tasa_cambio} onChange={e => setFormData({...formData, tasa_cambio: Number(e.target.value)})} className="mt-2 w-full bg-white border border-indigo-200 px-4 py-3 rounded-xl font-bold outline-none" placeholder="Ej: 7500" />
                          </div>
                        )}
                    </div>
                  )}

                  {/* Notas de Cred/Deb */}
                  {isNota && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-amber-50 border border-amber-200 p-5 rounded-[2rem] space-y-4">
                       <h3 className="text-xs font-black uppercase text-amber-600 tracking-widest flex items-center gap-2"><AlertCircle size={16}/> Documento Original Asociado</h3>
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <input type="text" placeholder="Timbrado (Factura orig.)" value={formData.asociado_timbrado} onChange={e => setFormData({...formData, asociado_timbrado: e.target.value})} className="bg-white border-amber-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-amber-500" />
                          <input type="text" placeholder="Nro (001-001-0000000)" value={formData.asociado_numero} onChange={e => setFormData({...formData, asociado_numero: e.target.value})} className="bg-white border-amber-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-amber-500" />
                          <input type="date" value={formData.asociado_fecha} onChange={e => setFormData({...formData, asociado_fecha: e.target.value})} className="bg-white border-amber-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-amber-500 text-slate-500" />
                       </div>
                       <input type="text" placeholder="Motivo de la modificación (Ej: Devolución, Descuento)" value={formData.motivo_modificacion} onChange={e => setFormData({...formData, motivo_modificacion: e.target.value})} className="w-full bg-white border-amber-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-amber-500" />
                    </motion.div>
                  )}

                  <hr className="border-slate-100" />

                  {/* Receptor */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Datos del Receptor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                       <input type="text" placeholder="RUC / C.I." value={formData.cliente_ruc} onChange={e => setFormData({...formData, cliente_ruc: e.target.value})} className="col-span-12 md:col-span-3 bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500" />
                       <input type="text" placeholder="Razón Social o Nombre" value={formData.cliente_razon_social} onChange={e => setFormData({...formData, cliente_razon_social: e.target.value})} className="col-span-12 md:col-span-5 bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500" />
                       <input type="text" placeholder="Dirección Fiscal (Opcional)" value={formData.cliente_direccion} onChange={e => setFormData({...formData, cliente_direccion: e.target.value})} className="col-span-12 md:col-span-4 bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  
                  <hr className="border-slate-100" />

                  {/* Items */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center bg-slate-900 rounded-2xl p-4">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest ml-1">Conceptos a Facturar</h3>
                        <button onClick={() => setItems([...items, {id: Date.now().toString(), codigo: '', descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10}])} className="text-indigo-400 hover:text-indigo-300 px-3 py-1 bg-white/10 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"><Plus size={14}/> Fila</button>
                     </div>
                     <div className="space-y-2">
                        {items.map((it, idx) => (
                           <div key={it.id} className="grid grid-cols-12 gap-2 lg:gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 relative">
                              <input 
                                 type="text" 
                                 placeholder="Cód." 
                                 value={it.codigo} 
                                 onChange={e => { 
                                    const val = e.target.value;
                                    const ni = [...items]; 
                                    ni[idx].codigo = val; 
                                    
                                    // Auto-estirar producto por código exacto
                                    const prod = productosCatalogo?.find((p: any) => p.codigo.toLowerCase() === val.trim().toLowerCase());
                                    if (prod) {
                                       ni[idx].descripcion = prod.descripcion;
                                       ni[idx].precio_unitario = prod.precio_unitario;
                                       ni[idx].iva_tipo = prod.iva_tipo;
                                    }
                                    setItems(ni); 
                                 }} 
                                 className="col-span-3 md:col-span-2 bg-white border border-slate-200 px-3 py-3 rounded-xl font-bold text-sm outline-none" 
                              />
                              <ProductAutocomplete item={it} index={idx} items={items} setItems={setItems} productos={productosCatalogo} />
                              <input type="number" placeholder="Cant" value={it.cantidad} onChange={e => { const ni = [...items]; ni[idx].cantidad = Number(e.target.value); setItems(ni); }} className="col-span-4 md:col-span-2 bg-white border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm outline-none text-center" />
                              <input type="number" placeholder="Precio U." value={it.precio_unitario} onChange={e => { const ni = [...items]; ni[idx].precio_unitario = Number(e.target.value); setItems(ni); }} className="col-span-8 md:col-span-3 bg-white border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm outline-none text-right" />
                              <select value={it.iva_tipo} onChange={e => { const ni = [...items]; ni[idx].iva_tipo = Number(e.target.value); setItems(ni); }} className="col-span-10 md:col-span-1 bg-white border border-slate-200 px-2 rounded-xl text-xs font-black text-center outline-none">
                                  <option value={10}>10%</option><option value={5}>5%</option><option value={0}>E</option>
                              </select>
                              <div className="col-span-2 md:col-span-1 flex justify-center items-center">
                                  <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500"><Trash2 size={20}/></button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                </div>

                <div className="p-6 lg:p-8 bg-slate-50 rounded-b-[2rem] border-t border-slate-200 sticky bottom-0">
                   <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                      <div className="flex gap-6 items-center">
                         <div className="text-right">
                           <p className="text-[9px] font-black uppercase text-slate-400">Total IVA</p>
                           <p className="font-bold text-slate-800">{(calcularTotales().iva10 + calcularTotales().iva5).toLocaleString()}</p>
                         </div>
                         <div className="h-8 w-px bg-slate-300 hidden lg:block"></div>
                         <div className="text-right">
                           <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Total Gral ({formData.moneda})</p>
                           <p className="text-2xl font-black text-slate-900">{calcularTotales().total.toLocaleString()}</p>
                         </div>
                      </div>
                      <button 
                         onClick={() => {
                           if (formData.numero_secuencia.length < 1 || formData.timbrado.length !== 8) {
                             alert("Verifica Numero y Timbrado (8 digitos)");
                             return;
                           }
                           mutationCreate.mutate({ ...formData, items, totales: calcularTotales() })
                         }}
                         disabled={mutationCreate.isPending || calcularTotales().total === 0}
                         className="w-full lg:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                         {mutationCreate.isPending ? 'Guardando...' : 'Guardar y Continuar'} <CheckCircle size={16}/>
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
