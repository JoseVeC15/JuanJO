import { useState, useRef, useMemo, Fragment, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  TrendingUp, Search, Download, Scan, Loader2, Plus, AlertCircle,
  CheckCircle, LayoutGrid, Table as TableIcon, ChevronDown, ChevronUp,
  Shield, Upload, ArrowUpRight, Sparkles, Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { toast } from '../lib/toast';
import { SkeletonCard } from '../components/facturas/SkeletonCard';
import { formatGs, formatGsShort } from '../data/sampleData';
import { DetailBox } from '../components/facturas/InvoiceWidgets';
import { ItemCard } from '../components/facturas/ItemCard';
import { EditInvoiceModal } from '../components/facturas/EditInvoiceModal';

let pdfWorkerConfigured = false;
async function convertPdfToImage(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfWorkerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    pdfWorkerConfigured = true;
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.height = viewport.height; canvas.width = viewport.width;
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport, canvas }).promise;
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Sin cobrar', color: '#F59E0B' },
  pagado: { label: 'Cobrada', color: '#10B981' },
};

export default function IngresosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { ingresos, loadingIngresos: dataLoading, isPeriodoBloqueado } = useSupabaseData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showOCR, setShowOCR] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isDragging, setIsDragging] = useState(false);

  // ── Mutations ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ingresos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ingresos'] }); toast.success('Documento anulado correctamente.'); },
    onError: (e: any) => toast.error(`Error al anular: ${e.message}`),
  });

  const moveMutation = useMutation({
    mutationFn: async (item: any) => {
      const { error: ie } = await supabase.from('facturas_gastos').insert({
        user_id: item.user_id, monto: item.monto, iva_10: item.iva_10, iva_5: item.iva_5,
        exentas: item.exentas, numero_factura: item.numero_factura, timbrado: item.timbrado,
        imagen_url: item.imagen_url, notas: item.notas,
        proveedor: item.cliente, ruc_proveedor: item.ruc_cliente,
        fecha_factura: item.fecha_emision, condicion_venta: item.condicion_venta || 'contado',
        estado: 'pendiente_clasificar',
      });
      if (ie) throw ie;
      const { error: de } = await supabase.from('ingresos').delete().eq('id', item.id);
      if (de) throw de;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingresos'] });
      queryClient.invalidateQueries({ queryKey: ['facturas_gastos'] });
      setEditingItem(null); setExpandedId(null);
      toast.success('Documento movido a Gastos.');
    },
    onError: (e: any) => toast.error(`Error al mover: ${e.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('ingresos').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ingresos'] }); setEditingItem(null); toast.success('Cambios guardados correctamente.'); },
    onError: (e: any) => toast.error(`Error al guardar: ${e.message}`),
  });

  // ── OCR core ─────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    if (!user) return;
    if (isPeriodoBloqueado(new Date().toISOString())) {
      toast.error('Periodo CERRADO. No se pueden subir documentos.'); return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF.'); return;
    }
    setUploading(true); setUploadStatus('idle'); setShowOCR(true);
    try {
      let base64String = '';
      let mimeType = file.type;
      if (file.type === 'application/pdf') {
        base64String = await convertPdfToImage(file);
        mimeType = 'image/jpeg';
      } else {
        const reader = new FileReader();
        base64String = await new Promise((res, rej) => {
          reader.onloadend = () => res((reader.result as string).split(',')[1]);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
      }
      const { error: fnError } = await supabase.functions.invoke('analyze-invoice', {
        body: { user_id: user.id, image_base64: base64String, mime_type: mimeType, type: 'income' },
      });
      if (fnError) throw new Error(fnError.message);
      setUploadStatus('success');
      queryClient.invalidateQueries({ queryKey: ['ingresos'] });
    } catch {
      setUploadStatus('error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [user, isPeriodoBloqueado, queryClient]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ── Drag & Drop ──────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // ── Filtros ──────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return (ingresos as any[])
      .filter((f: any) => filterEstado === 'todos' || f.estado === filterEstado)
      .filter((f: any) => {
        const text = `${f.cliente} ${f.numero_factura} ${f.ruc_cliente} ${f.timbrado}`;
        return text.toLowerCase().includes(search.toLowerCase());
      });
  }, [ingresos, filterEstado, search]);

  const stats = useMemo(() => ({
    total: filteredData.reduce((s: number, f: any) => s + Number(f.monto), 0),
    iva10: filteredData.reduce((s: number, f: any) => s + Number(f.iva_10 || 0), 0),
    iva5: filteredData.reduce((s: number, f: any) => s + Number(f.iva_5 || 0), 0),
  }), [filteredData]);

  // ── Export ───────────────────────────────────────────────────
  const exportToExcel = async () => {
    const [{ default: ExcelJS }, { saveAs }] = await Promise.all([import('exceljs'), import('file-saver')]);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('INGRESOS');
    ws.columns = ['Fecha', 'Cliente', 'RUC', 'Nro Factura', 'Timbrado', 'Monto Total', 'IVA 10%', 'IVA 5%', 'Estado']
      .map(h => ({ header: h, key: h, width: h.length + 10 }));
    ws.getRow(1).font = { bold: true, size: 11 };
    filteredData.forEach((f: any) => {
      ws.addRow([f.fecha_emision, f.cliente, f.ruc_cliente, f.numero_factura, f.timbrado,
        Number(f.monto), Number(f.iva_10 || 0), Number(f.iva_5 || 0), f.estado]);
    });
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `ingresos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (dataLoading) return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-40 animate-pulse" />
        <div className="h-8 bg-gray-100 rounded-full w-72 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-[2rem] animate-pulse" />)}
      </div>
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );

  return (
    <div
      className="space-y-6 pb-20 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileInput} accept="image/*,application/pdf" className="hidden" />

      {/* Overlay drag & drop */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-emerald-500/10 backdrop-blur-sm border-4 border-dashed border-emerald-400 rounded-3xl m-4 flex flex-col items-center justify-center pointer-events-none"
          >
            <Upload size={64} className="text-emerald-400 mb-4" />
            <p className="text-emerald-600 font-black text-2xl">Soltá la factura acá</p>
            <p className="text-emerald-500 font-medium mt-2">JPG, PNG, PDF — la IA lo lee solo</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
            <ArrowUpRight size={14} /> Ventas · Control de ingresos
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Mis Facturas de Venta</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            Arrastrá una foto de tu factura o usá el botón — la IA extrae todo sola.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <div className="bg-white border border-gray-100 p-1 rounded-2xl flex shadow-sm">
            <button onClick={() => setViewMode('cards')} className={`p-2 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-slate-900 text-white' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-gray-400'}`}><TableIcon size={18} /></button>
          </div>
          {filteredData.length > 0 && (
            <button onClick={exportToExcel} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-2xl font-bold hover:text-emerald-600 transition-all text-xs">
              <Download size={16} /> Exportar Excel
            </button>
          )}
          <button
            onClick={() => { setShowOCR(!showOCR); setUploadStatus('idle'); }}
            className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:bg-emerald-600 hover:scale-105 active:scale-95"
          >
            {uploading ? <Loader2 className="animate-spin" size={16} /> : <Scan size={16} />}
            {uploading ? 'Analizando...' : 'Subir Factura'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-emerald-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">Total facturado</p>
          </div>
          <p className="text-2xl font-black text-emerald-700">{formatGs(stats.total)}</p>
          <p className="text-[11px] text-emerald-500 font-medium mt-1">Suma de todas tus ventas del período</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Info size={16} className="text-blue-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">IVA que debés al SET (10%)</p>
          </div>
          <p className="text-2xl font-black text-blue-700">{formatGs(stats.iva10)}</p>
          <p className="text-[11px] text-blue-400 font-medium mt-1">Este monto lo tenés que pagar al SET cada mes</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Info size={16} className="text-indigo-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600">IVA 5%</p>
          </div>
          <p className="text-2xl font-black text-indigo-700">{formatGs(stats.iva5)}</p>
          <p className="text-[11px] text-indigo-400 font-medium mt-1">Ventas con tasa reducida (alimentos, medicamentos)</p>
        </div>
      </div>

      {/* Panel subir factura */}
      <AnimatePresence>
        {showOCR && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white border-2 border-dashed border-emerald-200 rounded-[2.5rem] p-10 text-center shadow-xl relative overflow-hidden group hover:border-emerald-400 transition-all">
            {uploading ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
                  <Loader2 size={40} className="text-emerald-500 animate-spin" />
                </div>
                <p className="text-xl font-black text-gray-800">La IA está leyendo tu factura...</p>
                <p className="text-gray-400 font-medium">Esto tarda unos segundos. No cierres la pantalla.</p>
              </div>
            ) : uploadStatus === 'success' ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <p className="text-xl font-black text-gray-800">¡Factura registrada!</p>
                <p className="text-gray-400 font-medium">La IA extrajo todos los datos automáticamente.</p>
                <div className="flex gap-3">
                  <button onClick={() => setUploadStatus('idle')} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Subir otra</button>
                  <button onClick={() => setShowOCR(false)} className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Cerrar</button>
                </div>
              </div>
            ) : uploadStatus === 'error' ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto">
                  <AlertCircle size={40} className="text-rose-500" />
                </div>
                <p className="text-xl font-black text-gray-800">No se pudo leer la factura</p>
                <p className="text-gray-400 font-medium">Asegurate de que la foto sea clara y bien iluminada.</p>
                <div className="flex gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Intentar de nuevo</button>
                  <button onClick={() => { setShowOCR(false); setUploadStatus('idle'); }} className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                  <Upload size={36} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Sacá una foto o subí el PDF</h3>
                <p className="text-gray-400 mb-2 max-w-sm mx-auto font-medium text-sm">
                  La IA lee el RUC, timbrado, monto e IVA — vos no tenés que escribir nada.
                </p>
                <p className="text-[11px] text-gray-300 font-bold uppercase tracking-widest mb-6">También podés arrastrar el archivo directamente acá</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Elegir archivo
                  </button>
                  <button onClick={() => setShowOCR(false)} className="bg-gray-100 text-gray-500 px-8 py-4 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">Cerrar</button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!dataLoading && (ingresos as any[]).length === 0 && !showOCR && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] p-16 text-center"
        >
          <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp size={48} className="text-emerald-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-800 mb-2">Todavía no hay facturas de venta</h3>
          <p className="text-gray-400 font-medium mb-8 max-w-md mx-auto">
            Subí tu primera factura y la IA se encarga de leer todos los datos. Solo necesitás una foto.
          </p>
          <button
            onClick={() => setShowOCR(true)}
            className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-600 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Sparkles size={18} /> Subir mi primera factura
          </button>
        </motion.div>
      )}

      {/* Filtros */}
      {(ingresos as any[]).length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              type="text" placeholder="Buscar por cliente, número o RUC..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[1.25rem] border-none focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-gray-800 placeholder:text-gray-300"
            />
          </div>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}
            className="pl-5 pr-10 py-4 bg-gray-50 border-none rounded-[1.25rem] focus:ring-2 focus:ring-emerald-500/20 font-black text-[10px] uppercase tracking-widest text-gray-500 outline-none min-w-[180px]">
            <option value="todos">Todos</option>
            <option value="pendiente">Sin cobrar</option>
            <option value="pagado">Cobradas</option>
          </select>
        </div>
      )}

      {/* Lista */}
      <AnimatePresence mode="popLayout">
        {viewMode === 'cards' ? (
          <motion.div className="space-y-4">
            {filteredData.map((item: any) => (
              <ItemCard key={item.id} item={item} type="ingresos"
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onDelete={() => deleteMutation.mutate(item.id)}
                onEdit={() => setEditingItem(item)}
                onMove={(it) => moveMutation.mutate(it)}
                isMoving={moveMutation.isPending}
              />
            ))}
            {filteredData.length === 0 && (ingresos as any[]).length > 0 && (
              <div className="text-center py-16 text-gray-400 font-medium">No hay resultados para tu búsqueda.</div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {['Fecha', 'Cliente / RUC', 'Documento / Timbrado', 'IVA 10% / 5%', 'Monto Total', 'Estado', ''].map(h => (
                    <th key={h} className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((f: any) => {
                  const isVeryNew = f.created_at ? (Date.now() - new Date(f.created_at).getTime()) < 10000 : false;
                  const estado = ESTADO_CONFIG[f.estado] ?? ESTADO_CONFIG.pendiente;
                  return (
                    <Fragment key={f.id}>
                      <motion.tr
                        initial={isVeryNew ? { backgroundColor: '#f0fdf4' } : {}}
                        animate={isVeryNew ? { backgroundColor: 'rgba(255,255,255,0)' } : {}}
                        transition={{ duration: 10 }}
                        onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                        className={`hover:bg-slate-50 cursor-pointer group ${expandedId === f.id ? 'bg-emerald-50/20' : ''}`}
                      >
                        <td className="p-5 text-xs font-bold text-gray-500">{f.fecha_emision}</td>
                        <td className="p-5"><p className="text-sm font-black text-gray-900">{f.cliente}</p><p className="text-[10px] text-gray-400 font-bold mt-0.5">{f.ruc_cliente || '-'}</p></td>
                        <td className="p-5"><p className="text-xs font-black text-gray-700">{f.numero_factura || '-'}</p><p className="text-[10px] text-gray-400 font-bold mt-0.5">Timb: {f.timbrado || 'N/A'}</p></td>
                        <td className="p-5 text-right"><p className="text-[11px] font-bold text-blue-600">+{formatGsShort(f.iva_10 || 0)}</p><p className="text-[10px] font-semibold text-indigo-500 mt-0.5">+{formatGsShort(f.iva_5 || 0)}</p></td>
                        <td className="p-5 text-sm font-black text-gray-900 text-right">{formatGs(f.monto)}</td>
                        <td className="p-5 text-center"><span className="text-[9px] px-3 py-1 rounded-full font-black uppercase" style={{ backgroundColor: estado.color + '15', color: estado.color }}>{estado.label}</span></td>
                        <td className="p-5 text-right"><div className="text-gray-300 group-hover:text-emerald-500 flex justify-end">{expandedId === f.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div></td>
                      </motion.tr>
                      {expandedId === f.id && (
                        <tr className="bg-white"><td colSpan={7} className="p-0">
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            className="px-10 py-7 border-b border-emerald-100 bg-gradient-to-b from-emerald-50/20 to-transparent">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-5">
                              <DetailBox label="RUC Cliente" value={f.ruc_cliente} icon={<Shield size={14} />} />
                              <DetailBox label="Timbrado SET" value={f.timbrado} desc={f.vencimiento_timbrado ? `Vence: ${f.vencimiento_timbrado}` : 'Vigente'} />
                              <DetailBox label="Condición" value={f.condicion_venta?.toUpperCase() || 'CONTADO'} desc={f.cdc || 'Pre-impresa'} />
                              <div className="space-y-2 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase"><span>IVA 10%</span><span className="text-blue-600">{formatGs(f.iva_10 || 0)}</span></div>
                                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase"><span>IVA 5%</span><span className="text-indigo-600">{formatGs(f.iva_5 || 0)}</span></div>
                                <div className="h-px bg-gray-100" />
                                <div className="flex justify-between text-[10px] font-black text-slate-800 uppercase"><span>Exentas</span><span>{formatGs(f.exentas || 0)}</span></div>
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setEditingItem(f); }}
                              className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-5 py-3 rounded-xl font-black text-[10px] uppercase hover:border-emerald-300 hover:text-emerald-600 transition-all">
                              Editar datos
                            </button>
                          </motion.div>
                        </td></tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal edición */}
      <AnimatePresence>
        {editingItem && (
          <EditInvoiceModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={(data) => updateMutation.mutate({ id: editingItem.id, data })}
            onMove={(item) => moveMutation.mutate(item)}
            isSaving={updateMutation.isPending || moveMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
