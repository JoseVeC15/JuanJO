import { useState, useRef, useEffect, useMemo, Fragment } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, CheckCircle, Clock, AlertCircle, FileText, ChevronDown, ChevronUp, Scan, Loader2, Image as ImageIcon, Trash2, Edit2, X, Table as TableIcon, LayoutGrid, Download, Plus, Shield, Search, Sparkles, UserPlus } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useAuth } from '../contexts/AuthContext';
import SifenInvoiceEmitter from './SifenInvoiceEmitter';
import Clientes from './clientes';
import {
  formatGs, formatGsShort, calculateSuggestedVAT10, calculateSuggestedVAT5
} from '../data/sampleData';

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

let pdfWorkerConfigured = false;

const estadoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente_clasificar: { label: 'Pendiente', color: '#F59E0B', icon: <Clock size={14} /> },
  registrada: { label: 'Registrada', color: '#3B82F6', icon: <FileText size={14} /> },
  en_proceso_pago: { label: 'En Proceso', color: '#8B5CF6', icon: <AlertCircle size={14} /> },
  pagada: { label: 'Pagada', color: '#10B981', icon: <CheckCircle size={14} /> },
  pendiente: { label: 'Pendiente', color: '#F59E0B', icon: <Clock size={14} /> },
  pagado: { label: 'Cobrado', color: '#10B981', icon: <CheckCircle size={14} /> },
};

interface FacturasProps {
  initialTab?: 'gastos' | 'ingresos' | 'sifen' | 'clientes' | 'autoimpreso';
}

export default function Facturas({ initialTab = 'gastos' }: FacturasProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    facturasGastos, ingresos, loading: dataLoading,
    perfilFiscal, configSifen, documentosElectronicos,
    isPeriodoBloqueado
  } = useSupabaseData();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'gastos' | 'ingresos' | 'sifen' | 'clientes' | 'autoimpreso'>(initialTab);
  const [sifenScreen, setSifenScreen] = useState<'bandeja' | 'emision' | 'config'>('bandeja');
  const [isEmitterOpen, setIsEmitterOpen] = useState(false);
  const [openClientModal, setOpenClientModal] = useState(false);

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOCR, setShowOCR] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab !== 'sifen') setSifenScreen('bandeja');
  }, [activeTab]);

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'gastos' | 'ingresos' }) => {
      const table = type === 'gastos' ? 'facturas_gastos' : 'ingresos';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas_gastos'] });
      queryClient.invalidateQueries({ queryKey: ['ingresos'] });
      alert("✅ Documento anulado correctamente.");
    },
    onError: (error: any) => {
      console.error("Error al anular documento:", error);
      alert(`❌ Error al intentar anular: ${error.message}`);
    }
  });

  const moveMutation = useMutation({
    mutationFn: async ({ item, fromType }: { item: any, fromType: 'gastos' | 'ingresos' }) => {
      if (!user) {
        alert("Error: Usuario no identificado.");
        return;
      }

      const toType = fromType === 'gastos' ? 'ingresos' : 'gastos';
      const fromTable = fromType === 'gastos' ? 'facturas_gastos' : 'ingresos';
      const toTable = toType === 'gastos' ? 'facturas_gastos' : 'ingresos';

      try {
        let newData: any = {
          monto: item.monto,
          user_id: user.id,
          notas: item.notas || '',
          proyecto_id: item.proyecto_id,
          // Campos universales (ahora soportados en ambas tablas)
          numero_factura: item.numero_factura,
          timbrado: item.timbrado,
          iva_10: item.iva_10 || 0,
          iva_5: item.iva_5 || 0,
          exentas: item.exentas || 0,
          imagen_url: item.imagen_url,
          processed_by_n8n: item.processed_by_n8n
        };

        if (fromType === 'gastos') {
          // Mover Gasto -> Ingreso
          newData.cliente = item.proveedor;
          newData.ruc_cliente = item.ruc_proveedor;
          newData.fecha_emision = item.fecha_factura;
          newData.condicion_venta = item.condicion_venta || 'contado';
          newData.estado = 'pendiente';
        } else {
          // Mover Ingreso -> Gasto
          newData.proveedor = item.cliente;
          newData.ruc_proveedor = item.ruc_cliente;
          newData.fecha_factura = item.fecha_emision;
          newData.estado = 'pendiente_clasificar';
          newData.tipo_gasto = 'otros';
        }

        // 1. Insertar en nueva tabla
        const { error: insertError } = await supabase.from(toTable).insert(newData);
        if (insertError) throw insertError;

        // 2. Borrar de la anterior
        const { error: deleteError } = await supabase.from(fromTable).delete().eq('id', item.id);
        if (deleteError) throw deleteError;

        return true;
      } catch (err: any) {
        console.error("Error en moveMutation:", err);
        alert(`Error al mover la factura: ${err.message || "Error desconocido"}`);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas_gastos'] });
      queryClient.invalidateQueries({ queryKey: ['ingresos'] });
      setEditingItem(null);
      setExpandedId(null);
      alert("¡Factura trasladada con éxito!");
    },
    onError: (error: any) => {
      console.error("Error al mover factura:", error);
      alert(`⚠️ No se pudo mover la factura: ${error.message || "Error de red"}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, type, data }: { id: string, type: 'gastos' | 'ingresos', data: any }) => {
      const table = type === 'gastos' ? 'facturas_gastos' : 'ingresos';
      const { error } = await supabase.from(table).update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas_gastos'] });
      queryClient.invalidateQueries({ queryKey: ['ingresos'] });
      setEditingItem(null);
      alert("✅ Cambios guardados correctamente.");
    },
    onError: (error: any) => {
      console.error("Error al actualizar factura:", error);
      alert(`❌ Error al guardar datos: ${error.message || "Verifique los campos"}`);
    }
  });

  const filteredData = useMemo(() => {
    const data = activeTab === 'gastos' ? facturasGastos : ingresos;
    return data
      .filter(f => filterEstado === 'todos' || f.estado === filterEstado)
      .filter(f => {
        const text = activeTab === 'gastos'
          ? `${(f as any).proveedor} ${f.numero_factura} ${(f as any).ruc_proveedor} ${f.timbrado}`
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

  const sifenEstadoConfig: Record<string, { label: string; color: string; stage: string }> = {
    pendiente: { label: 'Pendiente', color: 'bg-amber-50 text-amber-600', stage: 'listo_para_emitir' },
    aprobado: { label: 'Aprobado', color: 'bg-emerald-50 text-emerald-600', stage: 'confirmado_local' },
    rechazado: { label: 'Rechazado', color: 'bg-rose-50 text-rose-600', stage: 'error_validacion' },
    anulado: { label: 'Anulado', color: 'bg-slate-100 text-slate-600', stage: 'anulado' },
  };

  const filteredSifenDocs = useMemo(() => {
    return (documentosElectronicos || [])
      .filter((doc: any) => filterEstado === 'todos' || doc.estado_sifen === filterEstado)
      .filter((doc: any) => {
        const text = `${doc.numero_factura || ''} ${doc.cdc || ''} ${doc.receptor_razon_social || ''} ${doc.receptor_ruc || ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
      });
  }, [documentosElectronicos, filterEstado, search]);

  const sifenStats = useMemo(() => {
    const total = filteredSifenDocs.reduce((s: number, d: any) => s + Number(d.monto_total || 0), 0);
    const aprobados = filteredSifenDocs.filter((d: any) => d.estado_sifen === 'aprobado').length;
    const pendientes = filteredSifenDocs.filter((d: any) => d.estado_sifen === 'pendiente').length;
    const rechazados = filteredSifenDocs.filter((d: any) => d.estado_sifen === 'rechazado').length;
    return { total, aprobados, pendientes, rechazados };
  }, [filteredSifenDocs]);

  // Función para convertir PDF a Imagen (Primera página)
  // Esto es necesario porque el flujo de n8n con OpenAI Vision solo acepta imágenes
  const convertPdfToImage = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      if (!pdfWorkerConfigured) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        pdfWorkerConfigured = true;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1); // Solo procesamos la primera página de la factura
      const viewport = page.getViewport({ scale: 2.0 }); // Escala 2.0 para alta resolución (300dpi aprox)

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No se pudo crear el contexto del canvas');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Asegurar fondo blanco para evitar que los PDFs transparentes se vean negros/vacíos
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: context, viewport, canvas }).promise;

      // Retornamos el base64 sin el prefijo data:image/jpeg;base64,
      return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    } catch (error) {
      console.error('Error convirtiendo PDF:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadStatus('idle');

    try {
      let base64String = '';
      let mimeType = file.type;

      if (file.type === 'application/pdf') {
        base64String = await convertPdfToImage(file);
        mimeType = 'image/jpeg';
      } else {
        const reader = new FileReader();
        base64String = await new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const { error: fnError } = await supabase.functions.invoke('analyze-invoice', {
        body: {
          user_id: user.id,
          image_base64: base64String,
          mime_type: mimeType,
          type: activeTab === 'gastos' ? 'expense' : 'income',
        },
      });

      if (fnError) throw new Error(fnError.message);

      setUploadStatus('success');
      queryClient.invalidateQueries({ queryKey: [activeTab === 'gastos' ? 'facturas_gastos' : 'ingresos'] });
    } catch (error) {
      console.error('Error procesando archivo:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const exportToExcel = async () => {
    const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
      import('exceljs'),
      import('file-saver')
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(activeTab.toUpperCase());

    const isGasto = activeTab === 'gastos';
    const headers = isGasto
      ? ['Fecha', 'Proveedor', 'RUC', 'Nro Factura', 'Timbrado', 'Monto Total', 'IVA 10%', 'IVA 5%', 'Estado']
      : ['Fecha', 'Cliente', 'RUC', 'Nro Factura', 'Timbrado', 'Condicion', 'Monto Total', 'IVA 10%', 'IVA 5%', 'Exentas', 'Estado'];

    // Setup columns with width and alignment
    worksheet.columns = headers.map(h => ({
      header: h,
      key: h,
      width: h.length + 10,
      style: { font: { name: 'Arial', size: 10 } }
    }));

    // Bold headers
    worksheet.getRow(1).font = { bold: true, size: 11 };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };

    // Add rows
    filteredData.forEach(item => {
      const f = item as any;
      const data = isGasto
        ? [f.fecha_factura, f.proveedor, f.ruc_proveedor, f.numero_factura, f.timbrado, Number(f.monto), Number(f.iva_10 || 0), Number(f.iva_5 || 0), f.estado]
        : [f.fecha || f.fecha_emision, f.cliente, f.ruc_cliente, f.numero_factura, f.timbrado, f.condicion_venta, Number(f.monto), Number(f.iva_10 || 0), Number(f.iva_5 || 0), Number(f.exentas || 0), f.estado];
      
      const row = worksheet.addRow(data);
      
      // Amount cell indices (1-indexed in ExcelJS row.getCell)
      const amountIdx = isGasto ? 6 : 7;
      const iva10Idx = isGasto ? 7 : 8;
      const iva5Idx = isGasto ? 8 : 9;
      
      // Formatting numbers as Guaraníes (₲)
      const currencyFormat = '"₲" #,##0';
      row.getCell(amountIdx).numFmt = currencyFormat;
      row.getCell(iva10Idx).numFmt = currencyFormat;
      row.getCell(iva5Idx).numFmt = currencyFormat;

      if (!isGasto) {
        row.getCell(10).numFmt = currencyFormat; // Exentas
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${activeTab}_set_finance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (dataLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="text-emerald-500 animate-spin" size={32} /></div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf" className="hidden" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
            <Shield size={14} /> Alineación Fiscal DNIT/SET
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
            {activeTab === 'gastos' ? 'Gestión de Compras' :
              activeTab === 'ingresos' ? 'Facturación Emitida' :
              activeTab === 'clientes' ? 'Directorio de Clientes' :
              activeTab === 'sifen' && sifenScreen === 'emision' ? 'Emisión SIFEN (Guiada)' :
              activeTab === 'sifen' && sifenScreen === 'config' ? 'Configuración Fiscal SIFEN' :
                'Bandeja SIFEN'}
          </h1>
          <p className="text-gray-500 font-medium italic">
            {activeTab === 'sifen'
              ? 'Estructura base SIFEN: bandeja, emision y configuracion fiscal.'
              : 'Control avanzado de documentos con respaldo IA.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          {(activeTab === 'sifen' || activeTab === 'clientes' || activeTab === 'autoimpreso') && (
            <div className="flex bg-gray-100 p-1 rounded-xl lg:p-1.5 lg:rounded-2xl border border-gray-200">
              {['sifen', 'autoimpreso', 'clientes'].map((tab: any) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    navigate(tab === 'clientes' ? '/sifen/clientes' : '/sifen');
                  }}
                  className={`px-3 py-2 lg:px-6 lg:py-2.5 rounded-lg lg:rounded-xl font-black text-[8px] lg:text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab === 'sifen' ? 'E-DOCS' : tab === 'autoimpreso' ? 'AUTOIMPRESO' : tab.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          
          <div className="w-px h-8 bg-gray-200 mx-2 hidden lg:block" />
          
          <div className="bg-white border border-gray-100 p-1 rounded-xl lg:p-1.5 lg:rounded-2xl flex shadow-sm">
            <button onClick={() => setViewMode('cards')} className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl transition-all ${viewMode === 'cards' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}><TableIcon size={18} /></button>
          </div>
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 lg:px-5 lg:py-3 rounded-xl lg:rounded-2xl font-bold shadow-sm hover:border-emerald-200 hover:text-emerald-600 transition-all text-xs lg:text-base">
            <Download size={16} /> <span className="hidden sm:inline text-[11px] lg:text-sm">SET XLSX</span> <span className="sm:hidden">XLSX</span>
          </button>

          {activeTab === 'sifen' && sifenScreen === 'bandeja' && perfilFiscal && configSifen && (
            <button
              onClick={() => setSifenScreen('emision')}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 border border-indigo-500/30 shadow-indigo-500/10"
            >
              <Sparkles size={16} className="text-indigo-400" />
              <span className="hidden sm:inline">Emisión Guiada</span> <span className="sm:hidden">Emitir</span>
            </button>
          )}

          {activeTab === 'clientes' && (
            <button
              onClick={() => setOpenClientModal(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 border border-indigo-500/30"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Nuevo Cliente</span> <span className="sm:hidden">Nuevo</span>
            </button>
          )}

          {activeTab !== 'sifen' && activeTab !== 'clientes' && (
            <button
              onClick={() => { 
                if (isPeriodoBloqueado(new Date().toISOString())) {
                  alert("⚠️ El periodo actual está CERRADO y BLOQUEADO. No se pueden subir nuevos documentos.");
                  return;
                }
                setShowOCR(!showOCR); 
                setUploadStatus('idle'); 
              }}
              className={`flex items-center gap-2 text-white px-4 py-2.5 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 ${activeTab === 'gastos' ? 'bg-slate-900 shadow-slate-200' : 'bg-emerald-600 shadow-emerald-200'}`}
            >
              {uploading ? <Loader2 className="animate-spin" size={16} /> : <Scan size={16} />}
              <span className="hidden sm:inline">{uploading ? 'Analizando...' : 'Subir SET (IA)'}</span>
              <span className="sm:hidden">{uploading ? '...' : 'Subir'}</span>
            </button>
          )}
        </div>
      </div>

      {activeTab !== 'clientes' && activeTab !== 'sifen' && (
        <>
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
                  <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">Sube tu factura (JPEG/PNG/PDF) para que la IA extraiga el **Timbrado**, **RUC**, **Monto** e **IVA** automáticamente según normas de la SET.</p>

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

                  {uploadStatus === 'success' && (
                    <div className="mt-6 flex flex-col items-center gap-4">
                      <p className="text-emerald-600 font-bold flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> ¡Documento analizado y registrado por IA!
                      </p>
                      <button
                        onClick={() => setUploadStatus('idle')}
                        className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-200 transition-all"
                      >
                        Subir Otro de Seguido
                      </button>
                    </div>
                  )}
                  {uploadStatus === 'error' && <p className="mt-6 text-rose-500 font-bold flex items-center justify-center gap-2"><AlertCircle size={18} /> Error en la conexión con el servidor IA.</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {activeTab === 'sifen' && (
        <>
          <div className="bg-white rounded-[2rem] border border-gray-100 p-4 shadow-sm flex flex-wrap gap-3">
            {[
              { key: 'bandeja', label: 'Bandeja SIFEN' },
              { key: 'emision', label: 'Emisión Guiada' },
              { key: 'config', label: 'Config Fiscal' },
            ].map((s: any) => (
              <button
                key={s.key}
                onClick={() => setSifenScreen(s.key)}
                className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${sifenScreen === s.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {sifenScreen === 'bandeja' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard label="Documentos" value={String(filteredSifenDocs.length)} desc="Total en bandeja" color="bg-slate-50 text-slate-700 border-slate-100" />
              <SummaryCard label="Aprobados" value={String(sifenStats.aprobados)} desc="Estado tributario" color="bg-emerald-50 text-emerald-700 border-emerald-100" />
              <SummaryCard label="Pendientes" value={String(sifenStats.pendientes)} desc="Listo para emitir" color="bg-amber-50 text-amber-700 border-amber-100" />
              <SummaryCard label="Monto Total" value={formatGs(sifenStats.total)} desc="Base acumulada" color="bg-indigo-50 text-indigo-700 border-indigo-100" />
            </div>
          )}

          {sifenScreen === 'emision' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Emisión Estructurada</p>
                  <h3 className="text-2xl font-black text-slate-900">Flujo de Emisión SIFEN</h3>
                  <p className="text-sm text-slate-500">1) Receptor, 2) Ítems, 3) Validación fiscal, 4) Registro y estado de emisión.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase text-slate-500">Campos Receptor</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">RUC, Razón social, Dirección, Email, Condición</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase text-slate-500">Campos Documento</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">Tipo doc, Número, Fecha, Ítems, IVA 10/5/0, Monto</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Acción</p>
                    <p className="text-sm font-bold text-indigo-900 mt-2">Usa el emisor actual sin cambiar lógica base.</p>
                  </div>
                  <button
                    onClick={() => setIsEmitterOpen(true)}
                    className="mt-4 bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Abrir Emisor SIFEN
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {sifenScreen === 'config' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">Checklist Fiscal</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailBox label="RUC Emisor" value={perfilFiscal?.ruc || 'No configurado'} />
                <DetailBox label="Razón Social" value={perfilFiscal?.razon_social || 'No configurado'} />
                <DetailBox label="Ambiente" value={(perfilFiscal?.ambiente || 'test').toUpperCase()} />
                <DetailBox label="Timbrado" value={configSifen?.timbrado || 'No configurado'} />
                <DetailBox label="Establecimiento" value={configSifen?.establecimiento || '001'} />
                <DetailBox label="Punto Expedición" value={configSifen?.punto_expedicion || '001'} />
              </div>
              <button
                onClick={() => navigate('/config')}
                className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                Ir a Configuración
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* Filters & Actions */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm flex flex-col md:flex-row gap-5">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'gastos' ? "Proveedor, N° factura, RUC..." : activeTab === 'sifen' ? "Factura, CDC, receptor, RUC..." : "Cliente, N° factura, RUC..."}
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
            {activeTab === 'sifen' ? (
              <>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="anulado">Anulado</option>
              </>
            ) : activeTab === 'gastos' ? (
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
        {activeTab === 'clientes' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Clientes hideHeader forceOpenAddModal={openClientModal} onModalOpenHandled={() => setOpenClientModal(false)} />
          </motion.div>
        ) : activeTab === 'sifen' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nro Factura / CDC</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Receptor / RUC</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto Total</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado SIFEN</th>
                  <th className="p-6 w-10 text-center">KuDE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSifenDocs.length === 0 ? (
                  <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-medium italic">No hay facturas electrónicas emitidas aún.</td></tr>
                ) : filteredSifenDocs.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-all cursor-default">
                    <td className="p-6 text-xs font-bold text-gray-600">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="p-6">
                      <p className="text-xs font-black text-gray-700">{doc.numero_factura}</p>
                      <p className="text-[10px] text-gray-300 font-bold mt-0.5 truncate max-w-[150px]" title={doc.cdc}>{doc.cdc}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{doc.receptor_razon_social}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{doc.receptor_ruc}</p>
                    </td>
                    <td className="p-6 text-sm font-black text-gray-900 text-right">{formatGs(doc.monto_total)}</td>
                    <td className="p-6 text-center">
                      <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${sifenEstadoConfig[doc.estado_sifen]?.color || 'bg-slate-100 text-slate-500'}`}>
                        {sifenEstadoConfig[doc.estado_sifen]?.label || doc.estado_sifen}
                      </span>
                      <p className="text-[9px] text-slate-400 font-black mt-1 uppercase">{sifenEstadoConfig[doc.estado_sifen]?.stage || 'en_cola'}</p>
                    </td>
                    <td className="p-6 text-center">
                      <button
                        onClick={async () => {
                          const { generarKuDE } = await import('../lib/sifen/kude');
                          generarKuDE({
                            razonSocialEmisor: perfilFiscal.razon_social,
                            rucEmisor: perfilFiscal.ruc,
                            direccionEmisor: perfilFiscal.direccion || 'Asunción, Paraguay',
                            numeroFactura: doc.numero_factura,
                            timbrado: configSifen.timbrado,
                            fechaEmision: new Date(doc.created_at).toLocaleDateString(),
                            cdc: doc.cdc,
                            razonSocialReceptor: doc.receptor_razon_social,
                            rucReceptor: doc.receptor_ruc,
                            productos: (doc.documentos_items || []).map((i: any) => ({
                              descripcion: i.descripcion,
                              cantidad: i.cantidad,
                              precioUnitario: i.precio_unitario,
                              ivaTipo: i.iva_tipo,
                              totalItem: i.monto_total_item
                            })),
                            montoTotal: doc.monto_total,
                            ambiente: perfilFiscal.ambiente.toUpperCase() as 'TEST' | 'PROD'
                          });
                        }}
                        className="w-10 h-10 flex items-center justify-center text-indigo-500 bg-indigo-50 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all shadow-sm"
                        title="Descargar KuDE (PDF)"
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : viewMode === 'cards' ? (
          <motion.div className="space-y-4">
            {filteredData.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                type={activeTab}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onDelete={() => deleteMutation.mutate({ id: item.id, type: activeTab as 'gastos' | 'ingresos' })}
                onEdit={() => setEditingItem(item)}
                onMove={(item: any, fromType: any) => moveMutation.mutate({ item, fromType })}
                isMoving={moveMutation.isPending}
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
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((f: any) => {
                  const isVeryNew = f.created_at ? (Date.now() - new Date(f.created_at).getTime()) < 10000 : false;
                  return (
                    <Fragment key={f.id}>
                      <motion.tr
                        initial={isVeryNew ? { backgroundColor: '#10b98115' } : {}}
                        animate={isVeryNew ? { backgroundColor: 'rgba(255,255,255,0)' } : {}}
                        transition={{ duration: 10 }}
                        onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                        className={`hover:bg-slate-50 transition-all cursor-pointer group ${expandedId === f.id ? 'bg-indigo-50/30' : ''}`}
                      >
                        <td className="p-6 text-xs font-bold text-gray-600">
                          {activeTab === 'gastos' ? f.fecha_factura : f.fecha_emision}
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-gray-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">
                              {activeTab === 'gastos' ? f.proveedor : f.cliente}
                            </p>
                            {isVeryNew && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">{activeTab === 'gastos' ? f.ruc_proveedor : f.ruc_cliente || '-'}</p>
                        </td>
                        <td className="p-6">
                          <p className="text-xs font-black text-gray-700">{f.numero_factura || '-'}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">Timb: {f.timbrado || 'N/A'}</p>
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
                        <td className="p-6 text-right">
                          <div className="text-gray-300 group-hover:text-indigo-500 transition-colors flex justify-end">
                            {expandedId === f.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </td>
                      </motion.tr>
                      {expandedId === f.id && (
                        <tr className="bg-white">
                          <td colSpan={7} className="p-0">
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-12 py-10 border-b border-indigo-100 bg-gradient-to-b from-indigo-50/20 to-transparent">
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                                <DetailBox label={activeTab === 'gastos' ? "RUC Emisor (Proveedor)" : "RUC Receptor (Cliente)"} value={activeTab === 'gastos' ? f.ruc_proveedor : f.ruc_cliente} icon={<Shield size={14} />} />
                                <DetailBox label="Timbrado SET" value={f.timbrado} desc={f.vencimiento_timbrado ? `Vence: ${f.vencimiento_timbrado}` : 'Vigente'} />
                                <DetailBox label="Condición / CDC" value={f.condicion_venta ? f.condicion_venta.toUpperCase() : 'CONTADO'} desc={f.cdc || 'Factura Pre-impresa'} />
                                <div className="space-y-3 bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                                  <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest"><span>IVA 10%</span><span className="text-blue-600 font-bold">{formatGs(f.iva_10 || 0)}</span></div>
                                  <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest"><span>IVA 5%</span><span className="text-indigo-600 font-bold">{formatGs(f.iva_5 || 0)}</span></div>
                                  <div className="h-px bg-gray-100" />
                                  <div className="flex justify-between items-center text-[10px] font-black text-slate-800 uppercase tracking-widest"><span>Exentas</span><span>{formatGs(f.exentas || 0)}</span></div>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-gray-100 pt-8">
                                <div className="flex items-center gap-3">
                                  {f.imagen_url && (
                                    <a href={f.imagen_url} target="_blank" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                                      <ImageIcon size={16} /> Ver Documento SET
                                    </a>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingItem(f); }}
                                    className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                                  >
                                    <Edit2 size={16} /> Corregir Datos
                                  </button>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Registro en Sistema</p>
                                    <p className="text-[11px] text-gray-600 font-bold">{formatDateTime(f.created_at)}</p>
                                  </div>
                                  <div className="w-px h-8 bg-gray-100 mx-2" />
                                  <span className="text-[10px] text-gray-300 font-bold italic">ID: {f.id.split('-')[0]}...</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirm(`¿Cambiar este documento a la sección de ${activeTab === 'gastos' ? 'INGRESOS' : 'GASTOS'}?`) &&
                                        (activeTab === 'gastos' || activeTab === 'ingresos') &&
                                        moveMutation.mutate({ item: f, fromType: activeTab });
                                    }}
                                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                  >
                                    {moveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                                    Mover a {activeTab === 'gastos' ? 'Ingresos' : 'Gastos'}
                                  </button>
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (isPeriodoBloqueado(activeTab === 'gastos' ? f.fecha_factura : f.fecha_emision)) {
                                        alert("🛑 No se puede anular un documento en un periodo CERRADO legalmente.");
                                        return;
                                      }
                                      confirm('¿Anular este documento fiscal?') && 
                                        (activeTab === 'gastos' || activeTab === 'ingresos') &&
                                        deleteMutation.mutate({ id: f.id, type: activeTab }); 
                                    }} 
                                    className="w-12 h-12 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Modal Simplified UI */}
      {showAddManual && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] w-full max-w-2xl p-5 lg:p-10 space-y-6 lg:space-y-8 shadow-2xl relative overflow-hidden max-h-[95vh] overflow-y-auto">
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

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <EditInvoiceModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={(data: any) => updateMutation.mutate({ id: editingItem.id, type: activeTab as 'gastos' | 'ingresos', data })}
            onMove={(item: any, fromType: any) => moveMutation.mutate({ item, fromType })}
            isSaving={updateMutation.isPending || moveMutation.isPending}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEmitterOpen && (
          <SifenInvoiceEmitter
            onClose={() => setIsEmitterOpen(false)}
            sifenConfig={configSifen}
            onSuccess={() => {
              setIsEmitterOpen(false);
              queryClient.invalidateQueries({ queryKey: ['ingresos'] });
              queryClient.invalidateQueries({ queryKey: ['documentos_electronicos'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ItemCard({ item, type, isExpanded, onToggle, onDelete, onEdit, onMove, isMoving }: any) {
  const isGasto = type === 'gastos';
  const data = item as any;
  const isVeryNew = data.created_at ? (Date.now() - new Date(data.created_at).getTime()) < 10000 : false;

  return (
    <motion.div
      initial={isVeryNew ? { boxShadow: '0 0 0 4px #10b981' } : {}}
      animate={isVeryNew ? { boxShadow: '0 0 0 0px #10b981' } : {}}
      transition={{ duration: 10 }}
      className={`bg-white rounded-[2rem] border transition-all ${isExpanded ? 'border-indigo-200 shadow-2xl scale-[1.01]' : 'border-gray-100 shadow-sm'} relative overflow-hidden`}
    >
      {isVeryNew && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -20 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 pointer-events-none"
        >
          <Scan size={14} className="animate-spin" /> ✨ RECIÉN LLEGADA (IA)
        </motion.div>
      )}
      {isExpanded && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-indigo-400 to-emerald-400" />}
      <div className="p-6 flex items-center gap-5 cursor-pointer" onClick={onToggle}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${isExpanded ? 'rotate-3' : ''} ${isGasto ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
          {isGasto ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="font-black text-gray-900 leading-tight text-base lg:text-lg break-words line-clamp-2">
              {isGasto ? data.proveedor : data.cliente}
            </h4>
            {data.processed_by_n8n && (
              <div className="bg-emerald-50 text-emerald-600 p-1 rounded-md" title="Auditado por IA">
                <Scan size={12} strokeWidth={3} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest items-center">
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              {isGasto ? data.fecha_factura : data.fecha_emision}
            </span>
            <span>•</span>
            <span className="text-gray-500">{data.numero_factura || 'Sin N° Doc'}</span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-md ${isGasto ? 'bg-rose-50/50 text-rose-400' : 'bg-emerald-50/50 text-emerald-400'}`}>SET {data.timbrado || 'NR'}</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="font-black text-gray-900 text-xl tracking-tight">{formatGs(Number(data.monto))}</p>
          <span className="text-[9px] px-2.5 py-0.5 rounded-lg font-black uppercase tracking-widest mt-1" style={{ backgroundColor: (estadoConfig[data.estado] || estadoConfig.pendiente_clasificar).color + '15', color: (estadoConfig[data.estado] || estadoConfig.pendiente_clasificar).color }}>
            {(estadoConfig[data.estado] || estadoConfig.pendiente_clasificar).label}
          </span>
        </div>
        <div className="text-gray-300 ml-2">{isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}</div>
      </div>

      {isExpanded && (
        <div className="px-8 pb-8 border-t border-gray-50 pt-8 mt-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <DetailBox label={isGasto ? "RUC Emisor (Proveedor)" : "RUC Receptor (Cliente)"} value={isGasto ? data.ruc_proveedor : data.ruc_cliente} icon={<Shield size={14} />} />
            <DetailBox label="Timbrado SET" value={data.timbrado} desc={data.vencimiento_timbrado ? `Vence: ${data.vencimiento_timbrado}` : 'Vigente'} />
            <DetailBox label="Condición / CDC" value={data.condicion_venta ? data.condicion_venta.toUpperCase() : 'CONTADO'} desc={data.cdc || 'Factura Pre-impresa'} />
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center text-[11px] font-black text-gray-500 uppercase tracking-tighter">
                <span>IVA 10% {data.is_suggested_vat && <span className="text-[9px] text-blue-400 normal-case font-bold ml-1">(IA Sugerido)</span>}</span>
                <span className="text-blue-600">{formatGs(data.iva_10 || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-black text-gray-500 uppercase tracking-tighter">
                <span>IVA 5%</span>
                <span className="text-indigo-600">{formatGs(data.iva_5 || 0)}</span>
              </div>
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
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="flex items-center gap-2 bg-slate-100 text-slate-900 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                <Edit2 size={16} /> Corregir Datos
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Registro en Sistema</p>
                <p className="text-[11px] text-gray-600 font-bold">{formatDateTime(data.created_at)}</p>
              </div>
              <div className="w-px h-8 bg-gray-200 mx-2" />
              <span className="text-[10px] text-gray-300 font-bold italic">ID: {data.id.split('-')[0]}...</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirm(`¿Cambiar este documento a la sección de ${isGasto ? 'INGRESOS' : 'GASTOS'}?`) &&
                    onMove(data, type as 'gastos' | 'ingresos');
                }}
                className="w-12 h-12 flex items-center justify-center text-indigo-500 bg-indigo-50 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all shadow-sm"
                title={`Mover a ${isGasto ? 'Ingresos' : 'Gastos'}`}
              >
                {isMoving ? <Loader2 size={20} className="animate-spin" /> : <Shield size={20} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); confirm('¿Anular este documento fiscal?') && onDelete(); }} className="w-12 h-12 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><Trash2 size={20} /></button>
            </div>
          </div>
        </div>
      )}
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

function ModalInput({ label, value, onChange, type = "text", className = "" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-inner ${className}`}
      />
    </div>
  );
}

function EditInvoiceModal({ item, onClose, onSave, onMove, isSaving }: any) {
  const isGasto = !!item.proveedor;

  // Auto-suggest IVA 10% if total exists but all tax fields are zero
  const initialData = (() => {
    // Lista blanca de campos permitidos en la base de datos
    const { 
      id, user_id, created_at, processed_by_n8n, is_suggested_vat,
      ...cleanBase 
    } = item;

    if (cleanBase.monto > 0 && !cleanBase.iva_10 && !cleanBase.iva_5 && !cleanBase.exentas) {
      return { ...cleanBase, ...calculateSuggestedVAT10(cleanBase.monto) };
    }
    return cleanBase;
  })();

  const [formData, setFormData] = useState(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de Integridad Temporal
    const dateVal = isGasto ? formData.fecha_factura : (formData.fecha || formData.fecha_emision);
    const dateObj = new Date(dateVal);
    const year = dateObj.getFullYear();
    const currentYear = new Date().getFullYear();

    if (year < 2000 || year > currentYear + 1) {
      alert(`⚠️ Error de Integridad: La fecha (${year}) es inválida para el ejercicio fiscal actual. Por favor, corrígela.`);
      return;
    }

    onSave(formData);
  };

  const { checkDuplicateInvoice, suggestCategory } = useSupabaseData();
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  useEffect(() => {
    const check = async () => {
      const ruc = isGasto ? formData.ruc_proveedor : formData.ruc_cliente;
      if (ruc && formData.numero_factura && formData.timbrado) {
        const isDuplicate = await checkDuplicateInvoice(ruc, formData.numero_factura, formData.timbrado);
        setDuplicateWarning(isDuplicate);
      }
    };
    check();
  }, [formData.ruc_proveedor, formData.ruc_cliente, formData.numero_factura, formData.timbrado]);

  const handleProviderChange = (val: string) => {
    const update: any = { [isGasto ? 'proveedor' : 'cliente']: val };
    if (isGasto) {
      const suggestion = suggestCategory(val);
      if (suggestion !== 'Otros') {
        update.tipo_gasto = suggestion;
      }
    }
    setFormData({ ...formData, ...update });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] w-full max-w-4xl p-5 lg:p-12 shadow-2xl relative my-auto mx-2 overflow-y-auto max-h-[95vh]"
      >
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Corregir Documento</h3>
            <p className="text-gray-400 font-medium text-sm mt-1">Ajuste de datos fiscales para conciliación SET.</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 hover:rotate-90 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2">
              <ModalInput
                label={isGasto ? "Razón Social Proveedor" : "Nombre del Cliente"}
                value={isGasto ? formData.proveedor : formData.cliente}
                onChange={handleProviderChange}
              />
            </div>
            <ModalInput
              label="RUC"
              value={isGasto ? formData.ruc_proveedor : formData.ruc_cliente}
              onChange={(val: string) => setFormData({ ...formData, [isGasto ? 'ruc_proveedor' : 'ruc_cliente']: val })}
            />
            <ModalInput
              label="Nro. Factura"
              value={formData.numero_factura}
              onChange={(val: string) => setFormData({ ...formData, numero_factura: val })}
            />
            <div className="relative group">
              <ModalInput
                label="Timbrado"
                value={formData.timbrado}
                onChange={(val: string) => setFormData({ ...formData, timbrado: val })}
                className={duplicateWarning ? "ring-2 ring-rose-500/50" : ""}
              />
              {duplicateWarning && (
                <div className="absolute -top-1 right-0 bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-bounce">
                  ¡POSIBLE DUPLICADO!
                </div>
              )}
            </div>
            <ModalInput
              label="Fecha"
              type="date"
              value={isGasto ? formData.fecha_factura : formData.fecha_emision}
              onChange={(val: string) => setFormData({ ...formData, [isGasto ? 'fecha_factura' : 'fecha_emision']: val })}
            />
            <ModalInput
              label="Monto Bruto (₲)"
              type="number"
              value={formData.monto}
              onChange={(val: any) => setFormData({ ...formData, monto: Number(val) })}
            />
            <div className="relative group">
              <ModalInput
                label="IVA 10% (₲)"
                type="number"
                value={formData.iva_10 || 0}
                onChange={(val: any) => setFormData({ ...formData, iva_10: Number(val) })}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, ...calculateSuggestedVAT10(formData.monto) })}
                className="absolute right-3 top-9 p-1.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-indigo-100 group-hover:scale-110 active:scale-95"
                title="Auto-calcular IVA 10%"
              >
                <Scan size={14} />
              </button>
            </div>
            <div className="relative group">
              <ModalInput
                label="IVA 5% (₲)"
                type="number"
                value={formData.iva_5 || 0}
                onChange={(val: any) => setFormData({ ...formData, iva_5: Number(val) })}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, ...calculateSuggestedVAT5(formData.monto) })}
                className="absolute right-3 top-9 p-1.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-emerald-100 group-hover:scale-110 active:scale-95"
                title="Auto-calcular IVA 5%"
              >
                <Scan size={14} />
              </button>
            </div>
            <ModalInput
              label="Exentas (₲)"
              type="number"
              value={formData.exentas || 0}
              onChange={(val: any) => setFormData({ ...formData, exentas: Number(val) })}
            />
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Estado del Documento</label>
              <div className="flex flex-wrap gap-3">
                {['pendiente_clasificar', 'registrada', 'en_proceso_pago', 'pagada', 'pendiente', 'pagado'].filter(k => isGasto ? !['pendiente', 'pagado'].includes(k) : ['pendiente', 'pagado'].includes(k)).map(est => (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setFormData({ ...formData, estado: est })}
                    className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition-all ${formData.estado === est ? 'bg-slate-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {est.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {isGasto && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-4 border-t border-gray-50">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3 block flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-500" /> Categoría de Gasto Sugerida (IA)
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Marketing & Publicidad', 'Combustible & Transporte', 'Viáticos & Alimentación', 'Software & Nube', 'Recursos Creativos', 'Gasto Operativo', 'Otros'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo_gasto: cat })}
                      className={`px-3 py-2 rounded-xl font-bold text-[9px] uppercase transition-all ${formData.tipo_gasto === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6">
            <button type="submit" disabled={isSaving} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => {
                confirm(`¿Mover este documento a la sección de ${isGasto ? 'INGRESOS' : 'GASTOS'}?`) &&
                  onMove(item, isGasto ? 'gastos' : 'ingresos');
              }}
              className="px-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            >
              Pasar a {isGasto ? 'Ingreso' : 'Gasto'}
            </button>
            <button type="button" onClick={onClose} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

