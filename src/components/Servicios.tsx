import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, Search, X, Loader2, Edit2, Trash2,
  CheckCircle, Clock, XCircle,
  ChevronDown, ChevronUp, LayoutGrid, Table as TableIcon,
  Receipt, User, Calendar, Tag, Wrench
} from 'lucide-react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─── Formateo de moneda en Guaraníes ────────────────────────────────────────
const formatGs = (n: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(n);

const formatFecha = (s: string | null | undefined) => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ─── Configuración de estados ────────────────────────────────────────────────
const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pendiente:   { label: 'Pendiente',   color: '#F59E0B', bg: 'bg-amber-50 text-amber-700 border-amber-200',   icon: <Clock size={13} /> },
  en_proceso:  { label: 'En Proceso',  color: '#3B82F6', bg: 'bg-blue-50 text-blue-700 border-blue-200',     icon: <Wrench size={13} /> },
  completado:  { label: 'Completado',  color: '#10B981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle size={13} /> },
  facturado:   { label: 'Facturado',   color: '#8B5CF6', bg: 'bg-violet-50 text-violet-700 border-violet-200',  icon: <Receipt size={13} /> },
  cancelado:   { label: 'Cancelado',   color: '#EF4444', bg: 'bg-red-50 text-red-700 border-red-200',         icon: <XCircle size={13} /> },
};

type FichaEstado = 'pendiente' | 'en_proceso' | 'completado' | 'facturado' | 'cancelado';

interface FichaItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  iva_tipo: number;
  total: number;
}

interface Ficha {
  id: string;
  numero_ficha: string;
  cliente_id: string | null;
  cliente_nombre: string | null;
  cliente_ruc: string | null;
  tipo_servicio: string | null;
  descripcion_trabajo: string | null;
  estado: FichaEstado;
  fecha_ingreso: string;
  fecha_entrega_estimada: string | null;
  fecha_cierre: string | null;
  monto_estimado: number;
  monto_final: number;
  items: FichaItem[];
  notas: string | null;
  factura_generada: boolean;
  created_at: string;
}

const EMPTY_FICHA = {
  numero_ficha: '',
  cliente_id: '',
  cliente_nombre: '',
  cliente_ruc: '',
  tipo_servicio: '',
  descripcion_trabajo: '',
  estado: 'pendiente' as FichaEstado,
  fecha_entrega_estimada: '',
  monto_estimado: 0,
  notas: '',
  items: [] as FichaItem[],
};

const EMPTY_ITEM: Omit<FichaItem, 'id' | 'total'> = {
  descripcion: '',
  cantidad: 1,
  precio_unitario: 0,
  iva_tipo: 10,
};

// ─── Componente Badge de Estado ──────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: FichaEstado }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.pendiente;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function Servicios() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [search, setSearch] = useState(location.state?.search || '');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFicha, setEditingFicha] = useState<Ficha | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FICHA });
  const [newItem, setNewItem] = useState({ ...EMPTY_ITEM });

  // ── Fetch fichas ────────────────────────────────────────────────────────────
  const { data: fichas = [], isLoading } = useQuery({
    queryKey: ['fichas', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fichas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Ficha[];
    },
  });

  // ── Fetch clientes para el selector ────────────────────────────────────────
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, ruc, razon_social')
        .order('razon_social');
      if (error) throw error;
      return (data || []) as { id: string; ruc: string; razon_social: string }[];
    },
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof EMPTY_FICHA & { id?: string }) => {
      const montoFinal = payload.items.reduce((acc, it) => acc + it.total, 0);
      const row = {
        user_id: user!.id,
        numero_ficha: payload.numero_ficha.trim(),
        cliente_id: payload.cliente_id || null,
        cliente_nombre: payload.cliente_nombre || null,
        cliente_ruc: payload.cliente_ruc || null,
        tipo_servicio: payload.tipo_servicio || null,
        descripcion_trabajo: payload.descripcion_trabajo || null,
        estado: payload.estado,
        fecha_entrega_estimada: payload.fecha_entrega_estimada || null,
        monto_estimado: payload.monto_estimado || 0,
        monto_final: montoFinal,
        items: payload.items,
        notas: payload.notas || null,
      };
      if ((payload as any).id) {
        const { error } = await supabase.from('fichas').update(row).eq('id', (payload as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fichas').insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fichas'] });
      closeModal();
    },
    onError: (e: any) => alert('Error al guardar: ' + (e.message || 'Error desconocido')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fichas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fichas'] }),
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: FichaEstado }) => {
      const patch: any = { estado };
      if (estado === 'completado' || estado === 'facturado') patch.fecha_cierre = new Date().toISOString();
      const { error } = await supabase.from('fichas').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fichas'] }),
  });

  // ── Helpers de modal ────────────────────────────────────────────────────────
  const openNew = () => {
    const now = new Date();
    const numero = `F-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(fichas.length + 1).padStart(4, '0')}`;
    setEditingFicha(null);
    setForm({ ...EMPTY_FICHA, numero_ficha: numero });
    setNewItem({ ...EMPTY_ITEM });
    setShowModal(true);
  };

  const openEdit = (f: Ficha) => {
    setEditingFicha(f);
    setForm({
      numero_ficha: f.numero_ficha,
      cliente_id: f.cliente_id || '',
      cliente_nombre: f.cliente_nombre || '',
      cliente_ruc: f.cliente_ruc || '',
      tipo_servicio: f.tipo_servicio || '',
      descripcion_trabajo: f.descripcion_trabajo || '',
      estado: f.estado,
      fecha_entrega_estimada: f.fecha_entrega_estimada || '',
      monto_estimado: f.monto_estimado,
      notas: f.notas || '',
      items: f.items || [],
    });
    setNewItem({ ...EMPTY_ITEM });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFicha(null);
    setForm({ ...EMPTY_FICHA });
  };

  const handleClienteChange = (clienteId: string) => {
    const c = clientes.find(c => c.id === clienteId);
    setForm(prev => ({
      ...prev,
      cliente_id: clienteId,
      cliente_nombre: c?.razon_social || '',
      cliente_ruc: c?.ruc || '',
    }));
  };

  // ── Items helpers ────────────────────────────────────────────────────────────
  const addItem = () => {
    if (!newItem.descripcion.trim()) return;
    const total = newItem.cantidad * newItem.precio_unitario;
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem, id: crypto.randomUUID(), total }],
    }));
    setNewItem({ ...EMPTY_ITEM });
  };

  const removeItem = (id: string) => {
    setForm(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const montoTotalItems = form.items.reduce((acc, it) => acc + it.total, 0);

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => fichas.filter(f => {
    const matchSearch =
      f.numero_ficha.toLowerCase().includes(search.toLowerCase()) ||
      (f.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.tipo_servicio || '').toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'todos' || f.estado === filterEstado;
    return matchSearch && matchEstado;
  }), [fichas, search, filterEstado]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: fichas.length,
    pendiente: fichas.filter(f => f.estado === 'pendiente').length,
    en_proceso: fichas.filter(f => f.estado === 'en_proceso').length,
    completado: fichas.filter(f => f.estado === 'completado').length,
    facturado: fichas.filter(f => f.estado === 'facturado').length,
    montoTotal: fichas.reduce((acc, f) => acc + (f.monto_final || 0), 0),
  }), [fichas]);

  // ─────────────────────────────────────────────────────────────────── RENDER ─
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList size={28} className="text-emerald-500" />
            Gestión de Servicios
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Órdenes de trabajo y registros de servicio</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} /> Nuevo Servicio
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-100 text-slate-700' },
          { label: 'Pendientes', value: stats.pendiente, color: 'bg-amber-50 text-amber-700' },
          { label: 'En Proceso', value: stats.en_proceso, color: 'bg-blue-50 text-blue-700' },
          { label: 'Completadas', value: stats.completado, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Facturadas', value: stats.facturado, color: 'bg-violet-50 text-violet-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 border border-current/10`}>
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por número, cliente, servicio…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="todos">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}><TableIcon size={16} /></button>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="text-emerald-500 animate-spin" />
        </div>
      )}

      {/* ── Vista Cards ──────────────────────────────────────────────────────── */}
      {!isLoading && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(f => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-black text-slate-900 text-lg leading-tight">{f.numero_ficha}</p>
                      {f.cliente_nombre && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <User size={11} /> {f.cliente_nombre}
                        </p>
                      )}
                    </div>
                    <EstadoBadge estado={f.estado} />
                  </div>

                  {f.tipo_servicio && (
                    <p className="text-xs text-slate-600 flex items-center gap-1 mb-2">
                      <Tag size={11} className="text-emerald-500" /> {f.tipo_servicio}
                    </p>
                  )}

                  {f.descripcion_trabajo && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{f.descripcion_trabajo}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar size={11} /> {formatFecha(f.fecha_ingreso)}</span>
                    {f.monto_final > 0 && (
                      <span className="font-black text-slate-900 text-sm">{formatGs(f.monto_final)}</span>
                    )}
                  </div>

                  {/* Acciones rápidas de estado */}
                  <div className="flex gap-2 flex-wrap">
                    {f.estado === 'pendiente' && (
                      <button onClick={() => cambiarEstadoMutation.mutate({ id: f.id, estado: 'en_proceso' })}
                        className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                        ▶ Iniciar
                      </button>
                    )}
                    {f.estado === 'en_proceso' && (
                      <button onClick={() => cambiarEstadoMutation.mutate({ id: f.id, estado: 'completado' })}
                        className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
                        ✓ Completar
                      </button>
                    )}
                    {f.estado === 'completado' && (
                      <button onClick={() => cambiarEstadoMutation.mutate({ id: f.id, estado: 'facturado' })}
                        className="text-[10px] font-bold px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors">
                        <Receipt size={10} className="inline mr-1" />Facturar
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer de card */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 font-bold"
                  >
                    {expandedId === f.id ? <><ChevronUp size={13} /> Ocultar</> : <><ChevronDown size={13} /> Ver detalle</>}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(f)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => { if (confirm('¿Eliminar este servicio?')) deleteMutation.mutate(f.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Detalle expandido */}
                <AnimatePresence>
                  {expandedId === f.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-3 border-t border-slate-100 pt-3">
                        {f.items && f.items.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Items del servicio</p>
                            <div className="space-y-1">
                              {f.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-slate-600">
                                  <span>{it.descripcion} × {it.cantidad}</span>
                                  <span className="font-bold">{formatGs(it.total)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {f.notas && (
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Notas</p>
                            <p className="text-xs text-slate-600">{f.notas}</p>
                          </div>
                        )}
                        {f.fecha_entrega_estimada && (
                          <p className="text-xs text-slate-500">
                            <span className="font-bold">Entrega estimada:</span> {formatFecha(f.fecha_entrega_estimada)}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No hay servicios para mostrar</p>
              <p className="text-sm">Creá el primer registro con el botón "Nuevo Servicio"</p>
            </div>
          )}
        </div>
      )}

      {/* ── Vista Tabla ──────────────────────────────────────────────────────── */}
      {!isLoading && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Ref. Servicio</th>
                  <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Servicio</th>
                  <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-right px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="text-right px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{f.numero_ficha}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{f.cliente_nombre || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{f.tipo_servicio || '—'}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={f.estado} /></td>
                    <td className="px-4 py-3 text-slate-500">{formatFecha(f.fecha_ingreso)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {f.monto_final > 0 ? formatGs(f.monto_final) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(f)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { if (confirm('¿Eliminar este registro?')) deleteMutation.mutate(f.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <ClipboardList size={36} className="mx-auto mb-2 opacity-30" />
                <p className="font-bold text-sm">Sin resultados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Crear/Editar ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header modal */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <ClipboardList size={20} className="text-emerald-500" />
                  {editingFicha ? 'Editar Registro' : 'Nuevo Servicio'}
                </h2>
                <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Número y Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Referencia *</label>
                    <input
                      value={form.numero_ficha}
                      onChange={e => setForm(p => ({ ...p, numero_ficha: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="S-2026-0001"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Estado</label>
                    <select
                      value={form.estado}
                      onChange={e => setForm(p => ({ ...p, estado: e.target.value as FichaEstado }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cliente */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Cliente</label>
                  <select
                    value={form.cliente_id}
                    onChange={e => handleClienteChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">— Sin cliente asignado —</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.razon_social} ({c.ruc})</option>
                    ))}
                  </select>
                </div>

                {/* Tipo de servicio y fecha entrega */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Tipo de Servicio</label>
                    <input
                      value={form.tipo_servicio}
                      onChange={e => setForm(p => ({ ...p, tipo_servicio: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="Ej: Mantenimiento, Reparación…"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Fecha Entrega Estimada</label>
                    <input
                      type="date"
                      value={form.fecha_entrega_estimada}
                      onChange={e => setForm(p => ({ ...p, fecha_entrega_estimada: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Descripción del Trabajo</label>
                  <textarea
                    rows={3}
                    value={form.descripcion_trabajo}
                    onChange={e => setForm(p => ({ ...p, descripcion_trabajo: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                    placeholder="Describí el trabajo a realizar o realizado…"
                  />
                </div>

                {/* Items / Líneas de detalle */}
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase mb-3">Items del Servicio</p>

                  {/* Líneas existentes */}
                  {form.items.length > 0 && (
                    <div className="mb-3 rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-bold text-slate-500">Descripción</th>
                            <th className="text-center px-3 py-2 font-bold text-slate-500">Cant.</th>
                            <th className="text-right px-3 py-2 font-bold text-slate-500">P. Unit.</th>
                            <th className="text-right px-3 py-2 font-bold text-slate-500">Total</th>
                            <th className="px-3 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {form.items.map(it => (
                            <tr key={it.id}>
                              <td className="px-3 py-2 text-slate-700">{it.descripcion}</td>
                              <td className="px-3 py-2 text-center text-slate-600">{it.cantidad}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{formatGs(it.precio_unitario)}</td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900">{formatGs(it.total)}</td>
                              <td className="px-3 py-2">
                                <button onClick={() => removeItem(it.id)} className="text-red-400 hover:text-red-600">
                                  <X size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 font-black text-slate-600 text-right">TOTAL</td>
                            <td className="px-3 py-2 font-black text-slate-900 text-right">{formatGs(montoTotalItems)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* Agregar nuevo item */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Agregar ítem</p>
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <input
                          value={newItem.descripcion}
                          onChange={e => setNewItem(p => ({ ...p, descripcion: e.target.value }))}
                          placeholder="Descripción"
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number" min={1}
                          value={newItem.cantidad}
                          onChange={e => setNewItem(p => ({ ...p, cantidad: +e.target.value }))}
                          placeholder="Cant."
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number" min={0}
                          value={newItem.precio_unitario}
                          onChange={e => setNewItem(p => ({ ...p, precio_unitario: +e.target.value }))}
                          placeholder="Precio"
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <button onClick={addItem}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-1.5 text-xs font-bold transition-colors">
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Notas internas</label>
                  <textarea
                    rows={2}
                    value={form.notas}
                    onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                    placeholder="Observaciones, materiales usados, acuerdos…"
                  />
                </div>
              </div>

              {/* Footer modal */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => saveMutation.mutate(editingFicha ? { ...form, id: editingFicha.id } : form)}
                  disabled={saveMutation.isPending || !form.numero_ficha.trim()}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {editingFicha ? 'Guardar Cambios' : 'Crear Registro'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
