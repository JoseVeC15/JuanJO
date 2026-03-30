import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, Scan, Loader2, Image as ImageIcon,
  Trash2, Edit2, X, Table as TableIcon, LayoutGrid,
  Filter, Download, CheckSquare, Square, MoreHorizontal,
  ArrowUpRight, ArrowDownLeft, Plus, Shield
} from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useAuth } from '../contexts/AuthContext';
import {
  formatGs, formatGsShort,
  getGastoLabel, getGastoColor
} from '../data/sampleData';

const estadoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente_clasificar: { label: 'Pendiente', color: '#F59E0B', icon: <Clock size={14} /> },
  registrada: { label: 'Registrada', color: '#3B82F6', icon: <FileText size={14} /> },
  en_proceso_pago: { label: 'En Proceso', color: '#8B5CF6', icon: <AlertCircle size={14} /> },
  pagada: { label: 'Pagada', color: '#10B981', icon: <CheckCircle size={14} /> },
  pendiente: { label: 'Pendiente', color: '#F59E0B', icon: <Clock size={14} /> },
  pagado: { label: 'Cobrado', color: '#10B981', icon: <CheckCircle size={14} /> },
};

export default function Facturas() {
  const queryClient = useQueryClient();
  const { facturasGastos, ingresos, loading: dataLoading } = useSupabaseData();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'gastos' | 'ingresos'>('gastos');
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOCR, setShowOCR] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'gastos' | 'ingresos' }) => {
      const table = type === 'gastos' ? 'facturas_gastos' : 'ingresos';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab === 'gastos' ? 'facturas_gastos' : 'ingresos'] });
    }
  });

  const filteredData = useMemo(() => {
    const data = activeTab === 'gastos' ? facturasGastos : ingresos;
    return data
      .filter(f => filterEstado === 'todos' || f.estado === filterEstado)
      .filter(f => {
        const text = activeTab === 'gastos' 
            ? `${(f as any).proveedor} ${f.numero_factura} ${(f as any).concepto_ocr}` 
            : `${(f as any).cliente} ${f.numero_factura} ${(f as any).ruc_cliente} ${(f as any).fecha_emision}`;
        return (text || '').toLowerCase().includes(search.toLowerCase());
      });
  }, [activeTab, facturasGastos, ingresos, filterEstado, search]);

  const stats = useMemo(() => {
    const total = filteredData.reduce((s, f) => s + Number(f.monto), 0);
    const iva10 = filteredData.reduce((s, f) => s + Number(f.iva_10 || 0), 0);
    const iva5 = filteredData.reduce((s, f) => s + Number(f.iva_5 || 0), 0);
    return { total, iva10, iva5 };
  }, [filteredData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setUploadStatus('idle');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const webhookUrl = (import.meta as any).env?.VITE_N8N_WEBHOOK_URL || '';
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: user.id, 
            image_base64: base64String, 
            type: activeTab === 'gastos' ? 'expense' : 'income' // Inform n8n of the document type
          })
        });
        if (response.ok) {
          setUploadStatus('success');
          setTimeout(() => setShowOCR(false), 3000);
        } else {
          setUploadStatus('error');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadStatus('error');
      setUploading(false);
    }
  };

  const exportToCSV = () => {
    const headers = activeTab === 'gastos' 
        ? ['Fecha', 'Proveedor', 'RUC', 'Nro Factura', 'Timbrado', 'Monto', 'IVA 10', 'IVA 5', 'Estado']
        : ['Fecha', 'Cliente', 'RUC', 'Nro Factura', 'Timbrado', 'Condicion', 'Monto', 'IVA 10', 'IVA 5', 'Exentas', 'Estado'];
    
    const rows = filteredData.map(f => {
        if (activeTab === 'gastos') {
            const g = f as any;
            return [g.fecha_factura, g.proveedor, g.ruc_proveedor, g.numero_factura, g.timbrado, g.monto, g.iva_10, g.iva_5, g.estado];
        } else {
            const i = f as any;
            return [i.fecha, i.cliente, i.ruc_cliente, i.numero_factura, i.timbrado, i.condicion_venta, i.monto, i.iva_10, i.iva_5, i.exentas, i.estado];
        }
    });

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}_set_finance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (dataLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="text-emerald-500 animate-spin" size={32} /></div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

      {/* Tabs Selector */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-full sm:w-fit border border-gray-200/50 shadow-inner">
        <button 
          onClick={() => { setActiveTab('gastos'); setFilterEstado('todos'); }}
          className={`flex-1 sm:flex-none flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'gastos' ? 'bg-white text-slate-900 shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ArrowDownLeft size={16} className={activeTab === 'gastos' ? 'text-rose-500' : ''} />
          Gastos (Compras)
        </button>
        <button 
          onClick={() => { setActiveTab('ingresos'); setFilterEstado('todos'); }}
          className={`flex-1 sm:flex-none flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'ingresos' ? 'bg-white text-slate-900 shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ArrowUpRight size={16} className={activeTab === 'ingresos' ? 'text-emerald-500' : ''} />
          Ingresos (Ventas)
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
             <Shield size={14} /> Alineación Fiscal DNIT/SET
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
            {activeTab === 'gastos' ? 'Gestión de Compras' : 'Facturación Emitida'}
          </h1>
          <p className="text-gray-500 font-medium italic">Control avanzado de documentos con respaldo IA.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-gray-100 p-1.5 rounded-2xl flex shadow-sm">
            <button onClick={() => setViewMode('cards')} className={`p-2 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}><TableIcon size={20} /></button>
          </div>
          <button onClick={exportToCSV} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-2xl font-bold shadow-sm hover:border-emerald-200 hover:text-emerald-600 transition-all">
            <Download size={18} /> SET CSV
          </button>
          <button 
            onClick={() => setShowOCR(!showOCR)} 
            className={`flex items-center gap-2 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 ${activeTab === 'gastos' ? 'bg-slate-900 shadow-slate-200' : 'bg-emerald-600 shadow-emerald-200'}`}
          >
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Scan size={18} />}
            {uploading ? 'Segundos...' : 'Subir SET (IA)'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard label={activeTab === 'gastos' ? "Total Compras (IVA Incl)" : "Total Facturado (IVA Incl)"} value={formatGs(stats.total)} desc="Monto bruto registrado" color={activeTab === 'gastos' ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"} />
        <SummaryCard label={activeTab === 'gastos' ? "IVA Crédito Fiscal (10%)" : "IVA Débito Fiscal (10%)"} value={formatGs(stats.iva10)} desc="Reserva impositiva 10%" color="bg-blue-50 text-blue-700 border-blue-100" />
        <SummaryCard label="IVA 5%" value={formatGs(stats.iva5)} desc="Rubros tasa reducida" color="bg-indigo-50 text-indigo-700 border-indigo-100" />
      </div>

      {/* OCR Dropbox UI */}
      <AnimatePresence>
        {showOCR && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center shadow-xl relative overflow-hidden group hover:border-emerald-400 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -z-0 opacity-50" />
                <div className="relative z-10">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform">
                        <Scan size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Análisis de Documento {activeTab === 'gastos' ? 'Compra' : 'Venta'}</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">Sube tu factura (JPEG/PNG) para que la IA extraiga el **Timbrado**, **RUC**, **Monto** e **IVA** automáticamente según normas de la SET.</p>
                    
                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={uploading}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                        >
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            Seleccionar Archivo
                        </button>
                        <button onClick={() => setShowOCR(false)} className="bg-gray-100 text-gray-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cerrar</button>
                    </div>

                    {uploadStatus === 'success' && <p className="mt-6 text-emerald-600 font-bold flex items-center justify-center gap-2"><CheckCircle size={18} /> ¡Documento enviado a n8n con éxito!</p>}
                    {uploadStatus === 'error' && <p className="mt-6 text-rose-500 font-bold flex items-center justify-center gap-2"><AlertCircle size={18} /> Error en la conexión con el servidor IA.</p>}
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Actions */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm flex flex-col md:flex-row gap-5">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'gastos' ? "Proveedor, N° factura, RUC..." : "Cliente, N° factura, RUC..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[1.25rem] border-none focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none font-bold text-gray-800 placeholder:text-gray-300 shadow-inner"
          />
        </div>
        <div className="flex gap-4">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="pl-5 pr-12 py-4 bg-gray-50 border-none rounded-[1.25rem] focus:ring-2 focus:ring-emerald-500/20 font-black text-[10px] uppercase tracking-widest text-gray-600 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat shadow-inner min-w-[180px]"
            >
              <option value="todos">Todos los Estados</option>
              {activeTab === 'gastos' ? (
                  <>
                    <option value="pendiente_clasificar">Pendientes</option>
                    <option value="registrada">Registradas</option>
                    <option value="pagada">Pagadas</option>
                  </>
              ) : (
                  <>
                    <option value="pendiente">Pendientes</option>
                    <option value="pagado">Cobradas (SET)</option>
                  </>
              )}
            </select>
        </div>
      </div>

      {/* Main List Area */}
      <AnimatePresence mode="popLayout">
          {viewMode === 'cards' ? (
            <motion.div layout className="space-y-4">
              {filteredData.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  type={activeTab}
                  isExpanded={expandedId === item.id}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onDelete={() => deleteMutation.mutate({ id: item.id, type: activeTab })}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                 <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeTab === 'gastos' ? 'Proveedor' : 'Cliente'} / RUC</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento / Timbrado</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">IVA 10% / 5%</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Monto Total</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                      <th className="p-6 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredData.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-6 text-xs font-bold text-gray-600">
                          {activeTab === 'gastos' 
                            ? (f as any).fecha_factura 
                            : ((f as any).fecha || (f as any).fecha_emision)}
                        </td>
                        <td className="p-6">
                          <p className="text-sm font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{activeTab === 'gastos' ? (f as any).proveedor : (f as any).cliente}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">{activeTab === 'gastos' ? (f as any).ruc_proveedor : (f as any).ruc_cliente || '-'}</p>
                        </td>
                        <td className="p-6">
                            <p className="text-xs font-black text-gray-700">{f.numero_factura || '-'}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Timb: {(f as any).timbrado || 'N/A'}</p>
                        </td>
                        <td className="p-6 text-right">
                            <p className="text-[11px] font-bold text-blue-600">+{formatGsShort(f.iva_10 || 0)}</p>
                            <p className="text-[10px] font-semibold text-indigo-500 mt-0.5">+{formatGsShort(f.iva_5 || 0)}</p>
                        </td>
                        <td className="p-6 text-sm font-black text-gray-900 text-right">{formatGs(f.monto)}</td>
                        <td className="p-6 text-center">
                            <span className="text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest" style={{ backgroundColor: (estadoConfig[f.estado] || estadoConfig.pendiente_clasificar).color + '15', color: (estadoConfig[f.estado] || estadoConfig.pendiente_clasificar).color }}>
                            {(estadoConfig[f.estado] || estadoConfig.pendiente_clasificar).label}
                          </span>
                        </td>
                        <td className="p-6"><button className="text-gray-300 hover:text-rose-500 transition-colors"><MoreHorizontal size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Manual Modal Simplified UI */}
      {showAddManual && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h3 className="text-3xl font-black text-gray-900">Emisión de Factura</h3>
                        <p className="text-gray-400 font-medium text-sm">Registro manual para cumplimiento SET.</p>
                    </div>
                    <button onClick={() => setShowAddManual(false)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div className="col-span-2"><InputGroup label="Razón Social / Cliente" placeholder="Ej: Paraguay S.A." /></div>
                    <div><InputGroup label="RUC Cliente" placeholder="800XXXXX-X" /></div>
                    <div><InputGroup label="N° Factura" placeholder="001-001-XXXXXXX" /></div>
                    <div><InputGroup label="N° Timbrado" placeholder="12345678" /></div>
                    <div><InputGroup label="Monto Bruto (₲)" placeholder="0" type="number" /></div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Condición</label>
                        <select className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/20">
                            <option value="contado">Contado</option>
                            <option value="credito">Crédito</option>
                        </select>
                    </div>
                </div>

                <button className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all">Sincronizar con SET</button>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-bl-full -z-0" />
             </motion.div>
           </div>
      )}
    </div>
  );
}

function ItemCard({ item, type, isExpanded, onToggle, onDelete }: any) {
  const isGasto = type === 'gastos';
  const data = item as any;
  return (
    <motion.div layout className={`bg-white rounded-[2rem] border transition-all ${isExpanded ? 'border-indigo-200 shadow-2xl scale-[1.01]' : 'border-gray-100 shadow-sm'} relative overflow-hidden`}>
      {isExpanded && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-indigo-400 to-emerald-400" />}
      <div className="p-6 flex items-center gap-5 cursor-pointer" onClick={onToggle}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${isExpanded ? 'rotate-3' : ''} ${isGasto ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
          {isGasto ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="font-black text-gray-900 truncate leading-none text-lg">{isGasto ? data.proveedor : data.cliente}</h4>
            {data.processed_by_n8n && (
                <div className="bg-emerald-50 text-emerald-600 p-1 rounded-md" title="Auditado por IA"><Scan size={12} strokeWidth={3} /></div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest items-center">
            <span className="flex items-center gap-1.5">
              <CalendarIcon size={12} /> 
              {isGasto ? data.fecha_factura : (data.fecha || data.fecha_emision)}
            </span>
            <span>•</span>
            <span className="text-gray-500">{data.numero_factura || 'Sin N° Doc'}</span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-md ${isGasto ? 'bg-rose-50/50 text-rose-400' : 'bg-emerald-50/50 text-emerald-400'}`}>SET {data.timbrado || 'NR'}</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="font-black text-gray-900 text-xl tracking-tight">{formatGsShort(Number(data.monto))}</p>
          <span className="text-[9px] px-2.5 py-0.5 rounded-lg font-black uppercase tracking-widest mt-1" style={{ backgroundColor: (estadoConfig[data.estado] || estadoConfig.pendiente_clasificar).color + '15', color: (estadoConfig[data.estado] || estadoConfig.pendiente_clasificar).color }}>
            {(estadoConfig[data.estado] || estadoConfig.pendiente_clasificar).label}
          </span>
        </div>
        <div className="text-gray-300 ml-2">{isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}</div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-8 pb-8 border-t border-gray-50 pt-8 mt-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <DetailBox label={isGasto ? "RUC Emisor (Proveedor)" : "RUC Receptor (Cliente)"} value={isGasto ? data.ruc_proveedor : data.ruc_cliente} icon={<Shield size={14} />} />
                <DetailBox label="Timbrado SET" value={data.timbrado} desc={data.vencimiento_timbrado ? `Vence: ${data.vencimiento_timbrado}` : 'Vigente'} />
                <DetailBox label="Condición / CDC" value={data.condicion_venta ? data.condicion_venta.toUpperCase() : 'CONTADO'} desc={data.cdc || 'Factura Pre-impresa'} />
                <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center text-[11px] font-black text-gray-500 uppercase tracking-tighter"><span>IVA 10%</span><span className="text-blue-600">{formatGs(data.iva_10 || 0)}</span></div>
                    <div className="flex justify-between items-center text-[11px] font-black text-gray-500 uppercase tracking-tighter"><span>IVA 5%</span><span className="text-indigo-600">{formatGs(data.iva_5 || 0)}</span></div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex justify-between items-center text-[11px] font-black text-slate-800 uppercase tracking-tighter"><span>Exentas</span><span>{formatGs(data.exentas || 0)}</span></div>
                </div>
            </div>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                {data.imagen_url && (
                  <a href={data.imagen_url} target="_blank" className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all">
                    <ImageIcon size={16} /> Ver Documento SET
                  </a>
                )}
                <button className="flex items-center gap-2 bg-slate-100 text-slate-900 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"><Edit2 size={16} /> Corregir Datos</button>
              </div>
              <div className="flex items-center gap-4">
                  <span className="text-[10px] text-gray-300 font-bold italic">ID Interno: {data.id}</span>
                  <button onClick={(e) => { e.stopPropagation(); confirm('¿Anular este documento fiscal?') && onDelete(); }} className="w-12 h-12 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><Trash2 size={20} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailBox({ label, value, desc, icon }: any) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
          {icon && <span className="text-gray-400">{icon}</span>}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className="font-black text-slate-900 text-lg tracking-tight">{value || '-'}</p>
      {desc && <p className="text-[10px] text-emerald-500 font-black mt-0.5">{desc}</p>}
    </div>
  );
}

function SummaryCard({ label, value, desc, color }: { label: string; value: string; desc: string; color: string }) {
  return (
    <div className={`rounded-[2rem] p-8 border shadow-sm transition-all hover:shadow-lg ${color}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{label}</p>
      <p className="text-2xl font-black mb-1">{value}</p>
      <p className="text-[10px] font-bold opacity-50">{desc}</p>
    </div>
  );
}

function InputGroup({ label, placeholder, type = "text" }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <input 
                type={type} 
                placeholder={placeholder}
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/20" 
            />
        </div>
    );
}

function CalendarIcon(props: any) {
    return <Clock {...props} />; // Placeholder
}
