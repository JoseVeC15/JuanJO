import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, X, CheckCircle, Search, FileText, Download,
  Trash2, ChevronDown, AlertCircle, Settings2, Zap
} from 'lucide-react';
import { toast } from '../lib/toast';
import { confirmAsync } from '../lib/confirm';

const TIPOS_DOC: Record<number, string> = {
  1: 'Factura',
  2: 'AutoFactura',
  5: 'Nota de Débito',
  6: 'Nota de Crédito',
};

type SifenConfig = {
  prefijo: string;
  punto: string;
  timbrado: string;
  vencimiento_timbrado: string;
};

function loadConfig(): SifenConfig {
  try {
    const s = localStorage.getItem('sifen_auto_config');
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }
  return { prefijo: '001', punto: '001', timbrado: '', vencimiento_timbrado: '' };
}

function saveConfig(c: SifenConfig) {
  localStorage.setItem('sifen_auto_config', JSON.stringify(c));
}

type LineItem = {
  id: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  iva_tipo: number;
};

function emptyItem(): LineItem {
  return { id: Date.now().toString() + Math.random(), codigo: '', descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10 };
}

/* ─── Product autocomplete ─── */
const ProductAutocomplete = ({ item, index, items, setItems, productos }: {
  item: LineItem; index: number; items: LineItem[];
  setItems: (i: LineItem[]) => void; productos: any[];
}) => {
  const [open, setOpen] = useState(false);

  const update = (changes: Partial<LineItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...changes };
    setItems(next);
  };

  const filtered = productos.filter(p =>
    p.descripcion.toLowerCase().includes((item.descripcion || '').toLowerCase()) ||
    p.codigo.toLowerCase().includes((item.descripcion || '').toLowerCase())
  );

  return (
    <div className="relative col-span-9 md:col-span-4">
      <input
        type="text"
        placeholder="Producto o servicio"
        value={item.descripcion}
        onChange={e => { update({ descripcion: e.target.value }); setOpen(true); }}
        onFocus={() => { if (filtered.length > 0) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-300"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-[160%] max-w-[340px] max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl">
          {filtered.map((p: any) => (
            <div
              key={p.id}
              onMouseDown={() => {
                update({ codigo: p.codigo, descripcion: p.descripcion, precio_unitario: p.precio_unitario, iva_tipo: p.iva_tipo });
                setOpen(false);
              }}
              className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
            >
              <p className="font-bold text-xs text-slate-800">{p.descripcion}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                  Cód: {p.codigo}
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  ₲ {Number(p.precio_unitario).toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Stock: {p.stock_actual ?? '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Config Panel ─── */
function ConfigPanel({ config, setConfig, onSave }: {
  config: SifenConfig;
  setConfig: (c: SifenConfig) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
        <p className="text-sm font-bold text-amber-700">
          Configurá tu timbrado una sola vez. Al facturar solo necesitarás el nombre del cliente y los productos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
            Timbrado SET (8 dígitos)
          </label>
          <input
            type="text" maxLength={8}
            value={config.timbrado}
            onChange={e => setConfig({ ...config, timbrado: e.target.value.replace(/\D/g, '') })}
            placeholder="12345678"
            className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-xl tracking-widest text-center"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
            Vencimiento del Timbrado
          </label>
          <input
            type="date"
            value={config.vencimiento_timbrado}
            onChange={e => setConfig({ ...config, vencimiento_timbrado: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
          Punto de Expedición (Establecimiento - Punto)
        </label>
        <div className="flex gap-3 items-center">
          <input
            type="text" maxLength={3}
            value={config.prefijo}
            onChange={e => setConfig({ ...config, prefijo: e.target.value })}
            placeholder="001"
            className="w-24 text-center bg-slate-50 border border-slate-200 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-2xl font-black text-slate-300">-</span>
          <input
            type="text" maxLength={3}
            value={config.punto}
            onChange={e => setConfig({ ...config, punto: e.target.value })}
            placeholder="001"
            className="w-24 text-center bg-slate-50 border border-slate-200 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-sm font-bold text-slate-400 ml-2">— la secuencia se calcula sola</span>
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={config.timbrado.length !== 8}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all"
      >
        <CheckCircle size={18} /> Guardar Configuración y Continuar
      </button>
    </div>
  );
}

/* ─── Main Component ─── */
export default function FacturacionAutoimpresor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [config, setConfig] = useState<SifenConfig>(loadConfig);
  const [editingConfig, setEditingConfig] = useState(false);
  const configOk = config.timbrado.length === 8;

  /* Quick form */
  const [condicion, setCondicion] = useState<'contado' | 'credito'>('contado');
  const [cliente, setCliente] = useState({ razon_social: '', ruc: '' });
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  /* Advanced */
  const [tipoDoc, setTipoDoc] = useState(1);
  const [multimoneda, setMultimoneda] = useState(false);
  const [moneda, setMoneda] = useState('PYG');
  const [tasaCambio, setTasaCambio] = useState(1);
  const [docAsociado, setDocAsociado] = useState({ timbrado: '', numero: '', fecha: '' });
  const [motivoMod, setMotivoMod] = useState('');

  const isNota = tipoDoc === 5 || tipoDoc === 6;

  /* ── Queries ── */
  const { data: facturas, isLoading } = useQuery({
    queryKey: ['facturas_virtuales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas_virtuales')
        .select('*, facturas_virtuales_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: perfilFiscal } = useQuery({
    queryKey: ['perfil_fiscal', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfiles_fiscales')
        .select('*')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos_catalogo_list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos_catalogo')
        .select('*')
        .eq('activo', true)
        .order('descripcion');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  /* ── Auto-sequence ── */
  function nextSequence(): string {
    if (!facturas || facturas.length === 0) return '0000001';
    const last = facturas[0];
    if (!last.numero_documento) return '0000001';
    const parts = last.numero_documento.split('-');
    if (parts.length === 3) {
      const n = parseInt(parts[2], 10);
      if (!isNaN(n)) return String(n + 1).padStart(7, '0');
    }
    return '0000001';
  }

  /* ── Reset quick form ── */
  function resetForm() {
    setCondicion('contado');
    setCliente({ razon_social: '', ruc: '' });
    setItems([emptyItem()]);
    setTipoDoc(1);
    setShowAdvanced(false);
    setDocAsociado({ timbrado: '', numero: '', fecha: '' });
    setMotivoMod('');
  }

  /* ── Open modal ── */
  function openModal() {
    resetForm();
    setEditingConfig(!configOk);
    setMostrarModal(true);
  }

  /* ── Totals ── */
  function calcTotals() {
    return items.reduce(
      (acc, p) => {
        const monto = p.cantidad * p.precio_unitario;
        if (Number(p.iva_tipo) === 10) acc.iva10 += Math.round(monto / 11);
        if (Number(p.iva_tipo) === 5) acc.iva5 += Math.round(monto / 21);
        if (Number(p.iva_tipo) === 0) acc.exenta += monto;
        acc.total += monto;
        return acc;
      },
      { iva10: 0, iva5: 0, exenta: 0, total: 0 }
    );
  }

  /* ── Create mutation ── */
  const createMutation = useMutation({
    mutationFn: async () => {
      const seq = nextSequence();
      const fechaHoy = new Date().toISOString().split('T')[0];
      const totales = calcTotals();

      const dbPayload = {
        user_id: user?.id,
        tipo_documento: tipoDoc,
        numero_documento: `${config.prefijo}-${config.punto}-${seq}`,
        timbrado: config.timbrado,
        vencimiento_timbrado: config.vencimiento_timbrado || null,
        emisor_razon_social: perfilFiscal?.razon_social ?? null,
        emisor_ruc: perfilFiscal?.ruc ?? null,
        emisor_direccion: perfilFiscal?.direccion ?? null,
        emisor_telefono: perfilFiscal?.telefono ?? null,
        fecha_emision: fechaHoy,
        condicion_venta: condicion,
        cliente_razon_social: cliente.razon_social,
        cliente_ruc: cliente.ruc,
        cliente_direccion: null,
        moneda: multimoneda ? moneda : 'PYG',
        tasa_cambio: multimoneda && moneda !== 'PYG' ? tasaCambio : 1,
        monto_total: totales.total,
        total_iva_10: totales.iva10,
        total_iva_5: totales.iva5,
        total_exenta: totales.exenta,
        asociado_timbrado: isNota ? docAsociado.timbrado : null,
        asociado_numero: isNota ? docAsociado.numero : null,
        asociado_fecha: isNota ? docAsociado.fecha : null,
        motivo_modificacion: isNota ? motivoMod : null,
        estado: 'emitido',
      };

      const { data: facturaRow, error: errDoc } = await supabase
        .from('facturas_virtuales')
        .insert(dbPayload)
        .select()
        .single();
      if (errDoc) throw errDoc;

      const itemsPayload = items.map(i => ({
        factura_id: facturaRow.id,
        codigo: i.codigo || null,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        iva_tipo: i.iva_tipo,
        monto_total_item: i.cantidad * i.precio_unitario,
      }));
      const { error: errItems } = await supabase.from('facturas_virtuales_items').insert(itemsPayload);
      if (errItems) throw errItems;

      for (const item of items) {
        if (item.codigo) {
          const { data: prod } = await supabase
            .from('productos_catalogo')
            .select('id, stock_actual')
            .eq('codigo', item.codigo)
            .maybeSingle();
          if (prod) {
            await supabase
              .from('productos_catalogo')
              .update({ stock_actual: Math.max(0, (prod.stock_actual || 0) - item.cantidad) })
              .eq('id', prod.id);
          }
        }
      }

      return facturaRow;
    },
    onSuccess: (facturaRow) => {
      saveConfig(config);
      queryClient.invalidateQueries({ queryKey: ['facturas_virtuales'] });
      queryClient.invalidateQueries({ queryKey: ['productos_catalogo_list'] });
      setMostrarModal(false);
      toast.success(`Factura ${facturaRow.numero_documento} emitida correctamente.`);
    },
    onError: (err: any) => {
      toast.error(`Error al emitir: ${err.message}`);
    },
  });

  /* ── Anular ── */
  const anularMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('facturas_virtuales')
        .update({ estado: 'anulado' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas_virtuales'] });
      toast.success('Comprobante anulado.');
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  });

  async function handleAnular(id: string) {
    const ok = await confirmAsync({
      message: '¿Anular este comprobante? Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, anular',
      danger: true,
    });
    if (ok) anularMutation.mutate(id);
  }

  async function handleImprimir(factura: any) {
    try {
      const { generarPdfAutoimpreso } = await import('../lib/pdf/autoimpresor');
      generarPdfAutoimpreso(factura, perfilFiscal ? {
        razon_social: perfilFiscal.razon_social,
        ruc: perfilFiscal.ruc,
        nombre_fantasia: perfilFiscal.nombre_fantasia,
        direccion: perfilFiscal.direccion,
        telefono: perfilFiscal.telefono,
      } : undefined);
    } catch {
      toast.error('Error al generar el PDF.');
    }
  }

  function handleEmitir() {
    if (!cliente.razon_social.trim()) {
      toast.warning('Ingresá el nombre del cliente antes de emitir.');
      return;
    }
    if (items.every(i => !i.descripcion.trim())) {
      toast.warning('Agregá al menos un producto o servicio.');
      return;
    }
    if (calcTotals().total === 0) {
      toast.warning('El total no puede ser cero.');
      return;
    }
    createMutation.mutate();
  }

  const filtered = facturas?.filter(
    (f: any) =>
      (f.cliente_ruc || '').includes(search) ||
      (f.numero_documento || '').includes(search) ||
      (f.cliente_razon_social || '').toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const totales = calcTotals();

  /* ── Render ── */
  return (
    <div className="space-y-6 pb-24">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
            <FileText size={14} /> Autoimpresor SET · Paraguay
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Emitir Factura</h1>
          <p className="text-slate-500 font-medium italic">
            {configOk
              ? `Timbrado ${config.timbrado} · ${config.prefijo}-${config.punto} · próx. ${nextSequence()}`
              : 'Configurá tu timbrado una sola vez para empezar a facturar.'}
          </p>
        </div>
        <div className="flex gap-3">
          {configOk && (
            <button
              onClick={() => { setEditingConfig(true); setMostrarModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
            >
              <Settings2 size={16} /> Timbrado
            </button>
          )}
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
          >
            <Plus size={16} /> {configOk ? 'Nueva Factura' : 'Configurar y Facturar'}
          </button>
        </div>
      </div>

      {/* Config banner when no timbrado */}
      {!configOk && (
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Zap size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-black text-amber-900 mb-1">Primer paso: configurar el timbrado</p>
            <p className="text-sm text-amber-700">
              Hacé clic en <strong>"Configurar y Facturar"</strong> e ingresá tu timbrado habilitado por la SET.
              Solo se hace una vez — después solo necesitarás nombre del cliente y producto.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm">
        <div className="relative group max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente, RUC o número..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[1.25rem] border-none focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-gray-800 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Fecha</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                <th className="p-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">Cargando...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <FileText size={24} className="text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-400">Aún no hay facturas emitidas</p>
                      <p className="text-sm text-slate-300">Las facturas que emitas aparecerán aquí.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((f: any) => (
                <tr key={f.id} className={`hover:bg-slate-50/50 transition-colors ${f.estado === 'anulado' ? 'opacity-50' : ''}`}>
                  <td className="p-5 font-bold text-slate-600 text-sm whitespace-nowrap">{f.fecha_emision}</td>
                  <td className="p-5">
                    <p className="font-black text-slate-900 border border-slate-200 bg-white px-2 py-1 rounded inline-block text-xs">
                      {f.numero_documento}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                        {TIPOS_DOC[f.tipo_documento as number] ?? 'Factura'}
                      </p>
                      {f.estado === 'anulado' && (
                        <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase">Anulado</span>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="font-bold text-slate-800 truncate max-w-[200px]">{f.cliente_razon_social || '—'}</p>
                    {f.cliente_ruc && <p className="text-[10px] font-bold text-slate-400">RUC: {f.cliente_ruc}</p>}
                  </td>
                  <td className="p-5 text-right">
                    <p className="font-black text-slate-900">
                      {f.moneda === 'PYG' ? '₲' : f.moneda} {Number(f.monto_total).toLocaleString()}
                    </p>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleImprimir(f)}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all inline-flex items-center gap-1.5 font-bold text-xs"
                      >
                        <Download size={13} /> PDF
                      </button>
                      {f.estado !== 'anulado' && (
                        <button
                          onClick={() => handleAnular(f.id)}
                          className="px-3 py-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all font-bold text-xs"
                        >
                          Anular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {mostrarModal && (
          <div className="fixed inset-0 z-[100] flex justify-center p-4 lg:p-10 bg-slate-900/60 backdrop-blur-sm lg:items-center overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl flex flex-col relative self-start lg:self-auto"
            >
              {/* Modal header */}
              <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-20 rounded-t-[2rem]">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {editingConfig ? 'Configuración del Timbrado' : 'Nueva Factura'}
                  </h2>
                  {!editingConfig && configOk && (
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                      Timbrado {config.timbrado} · Nro. {config.prefijo}-{config.punto}-{nextSequence()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!editingConfig && (
                    <button
                      onClick={() => setEditingConfig(true)}
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                      title="Editar configuración del timbrado"
                    >
                      <Settings2 size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => setMostrarModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">

                {/* ── Config mode ── */}
                {editingConfig && (
                  <ConfigPanel
                    config={config}
                    setConfig={setConfig}
                    onSave={() => {
                      saveConfig(config);
                      toast.success('Configuración guardada.');
                      setEditingConfig(false);
                    }}
                  />
                )}

                {/* ── Quick billing mode ── */}
                {!editingConfig && (
                  <>
                    {/* Customer */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        ¿A quién le facturás?
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <input
                          type="text"
                          placeholder="RUC / C.I. (opcional)"
                          value={cliente.ruc}
                          onChange={e => setCliente({ ...cliente, ruc: e.target.value })}
                          className="col-span-2 bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <input
                          type="text"
                          placeholder="Nombre o Razón Social *"
                          value={cliente.razon_social}
                          onChange={e => setCliente({ ...cliente, razon_social: e.target.value })}
                          className="col-span-3 bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Products */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Productos o servicios
                        </h3>
                        <button
                          onClick={() => setItems([...items, emptyItem()])}
                          className="text-indigo-500 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <Plus size={13} /> Agregar fila
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* Column headers */}
                        <div className="hidden md:grid grid-cols-12 gap-2 px-1">
                          <p className="col-span-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">Cód.</p>
                          <p className="col-span-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Descripción</p>
                          <p className="col-span-2 text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">Cant.</p>
                          <p className="col-span-2 text-[9px] font-black text-slate-300 uppercase tracking-widest text-right">Precio U.</p>
                          <p className="col-span-1 text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">IVA</p>
                          <p className="col-span-1"></p>
                        </div>

                        {items.map((it, idx) => (
                          <div key={it.id} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <input
                              type="text"
                              placeholder="Cód."
                              value={it.codigo}
                              onChange={e => {
                                const val = e.target.value;
                                const next = [...items];
                                next[idx].codigo = val;
                                const prod = productos.find((p: any) => p.codigo.toLowerCase() === val.trim().toLowerCase());
                                if (prod) {
                                  next[idx].descripcion = prod.descripcion;
                                  next[idx].precio_unitario = prod.precio_unitario;
                                  next[idx].iva_tipo = prod.iva_tipo;
                                }
                                setItems(next);
                              }}
                              className="col-span-3 md:col-span-2 bg-white border border-slate-200 px-3 py-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                            <ProductAutocomplete
                              item={it} index={idx} items={items} setItems={setItems} productos={productos}
                            />
                            <input
                              type="number"
                              placeholder="Cant."
                              value={it.cantidad}
                              min={1}
                              onChange={e => { const n = [...items]; n[idx].cantidad = Number(e.target.value); setItems(n); }}
                              className="col-span-4 md:col-span-2 bg-white border border-slate-200 px-3 py-3 rounded-xl font-bold text-sm outline-none text-center focus:ring-2 focus:ring-indigo-300"
                            />
                            <input
                              type="number"
                              placeholder="Precio"
                              value={it.precio_unitario || ''}
                              onChange={e => { const n = [...items]; n[idx].precio_unitario = Number(e.target.value); setItems(n); }}
                              className="col-span-8 md:col-span-2 bg-white border border-slate-200 px-3 py-3 rounded-xl font-bold text-sm outline-none text-right focus:ring-2 focus:ring-indigo-300"
                            />
                            <select
                              value={it.iva_tipo}
                              onChange={e => { const n = [...items]; n[idx].iva_tipo = Number(e.target.value); setItems(n); }}
                              className="col-span-3 md:col-span-1 bg-white border border-slate-200 px-1 rounded-xl text-xs font-black text-center outline-none"
                            >
                              <option value={10}>10%</option>
                              <option value={5}>5%</option>
                              <option value={0}>Exento</option>
                            </select>
                            <div className="col-span-1 flex justify-center items-center">
                              <button
                                onClick={() => items.length > 1 && setItems(items.filter((_, i) => i !== idx))}
                                className="text-red-300 hover:text-red-500 transition-colors disabled:opacity-30"
                                disabled={items.length === 1}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Condicion */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCondicion('contado')}
                        className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 transition-all ${condicion === 'contado' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}
                      >
                        Contado
                      </button>
                      <button
                        onClick={() => setCondicion('credito')}
                        className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 transition-all ${condicion === 'credito' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}`}
                      >
                        Crédito
                      </button>
                    </div>

                    {/* Advanced toggle */}
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                      <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                      Opciones avanzadas (Notas de C/D, Multimoneda, Tipo)
                    </button>

                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-6 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Documento</label>
                                <select
                                  value={tipoDoc}
                                  onChange={e => setTipoDoc(Number(e.target.value))}
                                  className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                  {Object.entries(TIPOS_DOC).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Moneda</label>
                                <div className="flex gap-2 items-center">
                                  <button
                                    onClick={() => setMultimoneda(!multimoneda)}
                                    className={`px-4 py-4 rounded-2xl font-bold text-xs border transition-all ${multimoneda ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
                                  >
                                    {multimoneda ? 'Multimoneda ON' : 'PYG (defecto)'}
                                  </button>
                                  {multimoneda && (
                                    <select
                                      value={moneda}
                                      onChange={e => setMoneda(e.target.value)}
                                      className="flex-1 bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold outline-none"
                                    >
                                      <option value="PYG">Guaraníes (PYG)</option>
                                      <option value="USD">Dólares (USD)</option>
                                      <option value="EUR">Euros (EUR)</option>
                                      <option value="BRL">Reales (BRL)</option>
                                    </select>
                                  )}
                                </div>
                              </div>
                            </div>

                            {multimoneda && moneda !== 'PYG' && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                                  Tasa de Cambio (Ley 6380)
                                </label>
                                <input
                                  type="number" step="0.01"
                                  value={tasaCambio}
                                  onChange={e => setTasaCambio(Number(e.target.value))}
                                  className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl font-bold outline-none"
                                  placeholder="Ej: 7500"
                                />
                              </div>
                            )}

                            {isNota && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 border border-amber-200 p-5 rounded-[2rem] space-y-4">
                                <h3 className="text-xs font-black uppercase text-amber-600 tracking-widest flex items-center gap-2">
                                  <AlertCircle size={16} /> Documento Original Asociado
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                  <input
                                    type="text" placeholder="Timbrado (Factura orig.)"
                                    value={docAsociado.timbrado}
                                    onChange={e => setDocAsociado({ ...docAsociado, timbrado: e.target.value })}
                                    className="bg-white border border-amber-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm"
                                  />
                                  <input
                                    type="text" placeholder="Nro (001-001-0000000)"
                                    value={docAsociado.numero}
                                    onChange={e => setDocAsociado({ ...docAsociado, numero: e.target.value })}
                                    className="bg-white border border-amber-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm"
                                  />
                                  <input
                                    type="date"
                                    value={docAsociado.fecha}
                                    onChange={e => setDocAsociado({ ...docAsociado, fecha: e.target.value })}
                                    className="bg-white border border-amber-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm"
                                  />
                                </div>
                                <input
                                  type="text" placeholder="Motivo (Ej: Devolución, Descuento)"
                                  value={motivoMod}
                                  onChange={e => setMotivoMod(e.target.value)}
                                  className="w-full bg-white border border-amber-200 px-4 py-4 rounded-2xl outline-none font-bold text-sm"
                                />
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              {/* Modal footer */}
              {!editingConfig && (
                <div className="p-6 lg:p-8 bg-slate-50 rounded-b-[2rem] border-t border-slate-200 sticky bottom-0">
                  <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex gap-6 items-center">
                      {totales.iva10 > 0 && (
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-slate-400">IVA 10%</p>
                          <p className="font-bold text-slate-700">₲ {totales.iva10.toLocaleString()}</p>
                        </div>
                      )}
                      {totales.iva5 > 0 && (
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-slate-400">IVA 5%</p>
                          <p className="font-bold text-slate-700">₲ {totales.iva5.toLocaleString()}</p>
                        </div>
                      )}
                      <div className="h-8 w-px bg-slate-200 hidden lg:block" />
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Total</p>
                        <p className="text-2xl font-black text-slate-900">
                          {multimoneda && moneda !== 'PYG' ? moneda : '₲'} {totales.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleEmitir}
                      disabled={createMutation.isPending}
                      className="w-full lg:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
                    >
                      {createMutation.isPending ? 'Emitiendo...' : 'Emitir Factura'} <CheckCircle size={16} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
