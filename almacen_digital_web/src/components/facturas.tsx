import { useState, useRef } from 'react';
import {
  Search, Upload, FileText, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, Scan, Loader2, Image as ImageIcon,
  Trash2, Edit2, X, Save
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
};

export default function Facturas() {
  const queryClient = useQueryClient();
  const { facturasGastos, loading: dataLoading } = useSupabaseData();
  const { user } = useAuth();
  
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOCR, setShowOCR] = useState(false);
  
  // OCR states
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('facturas_gastos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas_gastos'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('facturas_gastos').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas_gastos'] });
      setEditingId(null);
    }
  });

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="text-emerald-500 animate-spin" size={32} />
      </div>
    );
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadStatus('idle');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        const response = await fetch(import.meta.env.VITE_N8N_WEBHOOK_URL as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            image_base64: base64String
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
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (factura: any) => {
    setEditingId(factura.id);
    setEditForm({
      proveedor: factura.proveedor,
      monto: factura.monto,
      tipo_gasto: factura.tipo_gasto || 'otros',
      fecha_factura: factura.fecha_factura,
      numero_factura: factura.numero_factura,
      ruc_proveedor: factura.ruc_proveedor,
    });
  };

  const handleSaveEdit = (id: string) => {
    updateMutation.mutate({ id, ...editForm });
  };

  const filtered = facturasGastos
    .filter(f => filterEstado === 'todos' || f.estado === filterEstado)
    .filter(f =>
      (f.proveedor?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (f.numero_factura?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (f.concepto_ocr?.toLowerCase() || '').includes(search.toLowerCase())
    );

  const totalGastos = facturasGastos.reduce((s, f) => s + Number(f.monto), 0);
  const totalIVA10 = facturasGastos.reduce((s, f) => s + Number(f.iva_10 || 0), 0);
  const totalIVA5 = facturasGastos.reduce((s, f) => s + Number(f.iva_5 || 0), 0);
  const totalExentas = facturasGastos.reduce((s, f) => s + Number(f.exentas || 0), 0);
  const ocrProcessed = facturasGastos.filter(f => f.processed_by_n8n).length;

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Facturas y Gastos</h1>
          <p className="text-gray-500 mt-1">{facturasGastos.length} registros · {ocrProcessed} con OCR</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="p-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            title="Refrescar datos"
          >
            <Loader2 size={20} className={dataLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowOCR(!showOCR)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            {uploading ? 'Procesando...' : 'Nueva Factura (OCR)'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por proveedor, N° factura, concepto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
          />
        </div>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none cursor-pointer"
        >
          <option value="todos">Todos los Estados</option>
          <option value="pendiente_clasificar">Pendientes</option>
          <option value="registrada">Registradas</option>
          <option value="en_proceso_pago">En Proceso</option>
          <option value="pagada">Pagadas</option>
        </select>
      </div>

      {/* OCR Demo Panel */}
      {showOCR && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Scan size={22} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Subida Directa a n8n</h3>
              <p className="text-slate-400 text-sm">Convirtiendo a Base64 y enviando al servidor</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                uploading ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-600 hover:border-emerald-500/50 hover:bg-slate-800/50'
              }`}
            >
              {uploading ? (
                <div className="space-y-4">
                  <Loader2 size={40} className="mx-auto text-emerald-500 animate-spin" />
                  <p className="text-emerald-400 font-bold">Analizando factura...</p>
                  <p className="text-xs text-slate-500">IA está extrayendo RUC, Timbrado e IVA</p>
                </div>
              ) : uploadStatus === 'success' ? (
                <div className="space-y-3">
                  <CheckCircle size={40} className="mx-auto text-emerald-400" />
                  <p className="text-emerald-400 font-bold">¡Enviado con éxito!</p>
                  <p className="text-xs text-slate-500">Aparecerá en la lista en unos segundos</p>
                </div>
              ) : (
                <>
                  <ImageIcon size={40} className="mx-auto text-slate-500 mb-3" />
                  <p className="font-semibold text-slate-300">Selecciona o toma una foto</p>
                  <p className="text-xs text-slate-500 mt-2">Formatos: JPG, PNG • Max: 5MB</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">Estado de Conexión</h4>
              <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Endpoint n8n:</span>
                  <span className="text-emerald-400 font-mono truncate ml-2">josevec.uk/...</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">User ID:</span>
                  <span className="text-slate-300 font-mono">{user?.id.slice(0, 8)}...</span>
                </div>
                <div className="pt-2 border-t border-slate-700">
                   <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    La imagen se procesa por un modelo GPT-4o-mini de OpenAI especializado en facturación paraguaya (SET).
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Gastos" value={formatGsShort(totalGastos)} color="bg-red-50 text-red-700" />
        <SummaryCard label="IVA 10%" value={formatGsShort(totalIVA10)} color="bg-blue-50 text-blue-700" />
        <SummaryCard label="IVA 5%" value={formatGsShort(totalIVA5)} color="bg-purple-50 text-purple-700" />
        <SummaryCard label="Exentas" value={formatGsShort(totalExentas)} color="bg-gray-50 text-gray-700" />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(factura => {
          const isExpanded = expandedId === factura.id;
          const isEditing = editingId === factura.id;
          const est = estadoConfig[factura.estado] || estadoConfig.pendiente_clasificar;

          return (
            <div key={factura.id} className={`bg-white rounded-2xl border transition-all ${isExpanded ? 'border-emerald-200 shadow-lg' : 'border-gray-100 shadow-sm'}`}>
              <div className="p-5 cursor-pointer flex items-center gap-4" onClick={() => !isEditing && setExpandedId(isExpanded ? null : factura.id)}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: getGastoColor(factura.tipo_gasto) + '15' }}>
                  <FileText size={20} style={{ color: getGastoColor(factura.tipo_gasto) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 truncate">{factura.proveedor || 'Sin Proveedor'}</h4>
                    {factura.processed_by_n8n && (
                      <span className="bg-emerald-50 text-emerald-600 text-[9px] px-1.5 py-0.5 rounded font-bold">🤖 OCR</span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: est.color + '20', color: est.color }}>
                      {est.label}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>{factura.fecha_factura}</span>
                    <span>{factura.numero_factura}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatGs(Number(factura.monto))}</p>
                </div>
                {!isEditing && (
                  <div className="ml-2 text-gray-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                )}
              </div>

              {isExpanded && isEditing && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Proveedor</label>
                      <input 
                        type="text" 
                        value={editForm.proveedor || ''} 
                        onChange={e => setEditForm({...editForm, proveedor: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Monto (Gs)</label>
                      <input 
                        type="number" 
                        value={editForm.monto || ''} 
                        onChange={e => setEditForm({...editForm, monto: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
                      <select 
                        value={editForm.tipo_gasto || 'otros'} 
                        onChange={e => setEditForm({...editForm, tipo_gasto: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none dropdown-trigger"
                      >
                        <option value="alimentacion">Alimentación</option>
                        <option value="transporte">Transporte</option>
                        <option value="oficina">Oficina</option>
                        <option value="alquiler_equipo">Alquiler de Equipo</option>
                        <option value="equipamiento_compra">Equipamiento</option>
                        <option value="otros">Otros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Emisión</label>
                      <input 
                        type="date" 
                        value={editForm.fecha_factura || ''} 
                        onChange={e => setEditForm({...editForm, fecha_factura: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 mt-2">
                    <button 
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-semibold"
                    >
                      <X size={16} /> Cancelar
                    </button>
                    <button 
                      onClick={() => handleSaveEdit(factura.id)}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                    >
                      {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {isExpanded && !isEditing && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DetailField label="RUC" value={factura.ruc_proveedor} />
                    <DetailField label="Timbrado" value={factura.timbrado} />
                    <DetailField label="IVA 10%" value={formatGs(Number(factura.iva_10 || 0))} />
                    <DetailField label="IVA 5%" value={formatGs(Number(factura.iva_5 || 0))} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {factura.tipo_gasto && (
                      <div 
                        className="p-3 rounded-xl text-sm font-medium border" 
                        style={{ 
                          backgroundColor: getGastoColor(factura.tipo_gasto) + '15', 
                          borderColor: getGastoColor(factura.tipo_gasto) + '30',
                          color: getGastoColor(factura.tipo_gasto)
                        }}
                      >
                        <p className="text-[10px] font-bold uppercase mb-1 opacity-70">Tipo de Gasto</p>
                        {getGastoLabel(factura.tipo_gasto)}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditClick(factura); }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                      >
                        <Edit2 size={16} /> Editar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(factura.id); }}
                        disabled={deleteMutation.isPending}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} 
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {factura.imagen_url && (
                    <button className="flex items-center gap-2 text-xs text-blue-600 font-bold hover:underline">
                      <ImageIcon size={14} /> Ver documento original
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-[10px] opacity-70 uppercase font-bold tracking-wider">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="font-semibold text-gray-900 border-b border-gray-100 pb-1">{value || '-'}</p>
    </div>
  );
}
