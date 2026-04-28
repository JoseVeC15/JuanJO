import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronUp, Shield, ImageIcon, Edit2, Trash2, Loader2, Scan, Clock } from 'lucide-react';
import { formatGs } from '../../data/sampleData';
import { DetailBox } from './InvoiceWidgets';
import { confirmAsync } from '../../lib/confirm';

const estadoConfig: Record<string, { label: string; color: string }> = {
  pendiente_clasificar: { label: 'Sin clasificar', color: '#F59E0B' },
  registrada: { label: 'Registrada', color: '#3B82F6' },
  en_proceso_pago: { label: 'En proceso', color: '#8B5CF6' },
  pagada: { label: 'Pagada', color: '#10B981' },
  pendiente: { label: 'Sin cobrar', color: '#F59E0B' },
  pagado: { label: 'Cobrada', color: '#10B981' },
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

interface ItemCardProps {
  item: any;
  type: 'gastos' | 'ingresos';
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMove: (item: any, fromType: 'gastos' | 'ingresos') => void;
  isMoving: boolean;
}

export function ItemCard({ item, type, isExpanded, onToggle, onDelete, onEdit, onMove, isMoving }: ItemCardProps) {
  const isGasto = type === 'gastos';
  const isVeryNew = item.created_at ? (Date.now() - new Date(item.created_at).getTime()) < 10000 : false;
  const estado = estadoConfig[item.estado] ?? estadoConfig.pendiente_clasificar;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirmAsync({
      message: '¿Anular este documento? Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, anular',
      danger: true,
    });
    if (ok) onDelete();
  };

  const handleMove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const destino = isGasto ? 'Ingresos' : 'Gastos';
    const ok = await confirmAsync({
      message: `¿Mover este documento a ${destino.toUpperCase()}?`,
      confirmLabel: `Mover a ${destino}`,
    });
    if (ok) onMove(item, type);
  };

  return (
    <motion.div
      initial={isVeryNew ? { boxShadow: '0 0 0 4px #10b981' } : {}}
      animate={isVeryNew ? { boxShadow: '0 0 0 0px #10b981' } : {}}
      transition={{ duration: 10 }}
      className={`bg-white rounded-[2rem] border transition-all ${isExpanded ? 'border-indigo-200 shadow-2xl scale-[1.01]' : 'border-gray-100 shadow-sm'} relative overflow-hidden`}
    >
      {isVeryNew && (
        <motion.div
          initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -20 }} transition={{ duration: 10 }}
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
            <h4 className="font-black text-gray-900 text-base lg:text-lg break-words line-clamp-2">
              {isGasto ? item.proveedor : item.cliente}
            </h4>
            {item.processed_by_n8n && (
              <div className="bg-emerald-50 text-emerald-600 p-1 rounded-md" title="Procesado por IA">
                <Scan size={12} strokeWidth={3} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest items-center">
            <span className="flex items-center gap-1.5"><Clock size={12} />{isGasto ? item.fecha_factura : item.fecha_emision}</span>
            <span>•</span>
            <span className="text-gray-500">{item.numero_factura || 'Sin N° Doc'}</span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-md ${isGasto ? 'bg-rose-50/50 text-rose-400' : 'bg-emerald-50/50 text-emerald-400'}`}>Timb {item.timbrado || 'NR'}</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="font-black text-gray-900 text-xl tracking-tight">{formatGs(Number(item.monto))}</p>
          <span className="text-[9px] px-2.5 py-0.5 rounded-lg font-black uppercase tracking-widest mt-1" style={{ backgroundColor: estado.color + '15', color: estado.color }}>
            {estado.label}
          </span>
        </div>
        <div className="text-gray-300 ml-2">{isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}</div>
      </div>

      {isExpanded && (
        <div className="px-8 pb-8 border-t border-gray-50 pt-8 mt-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <DetailBox
              label={isGasto ? 'RUC Proveedor' : 'RUC Cliente'}
              value={isGasto ? item.ruc_proveedor : item.ruc_cliente}
              icon={<Shield size={14} />}
            />
            <DetailBox label="Timbrado SET" value={item.timbrado} desc={item.vencimiento_timbrado ? `Vence: ${item.vencimiento_timbrado}` : 'Vigente'} />
            <DetailBox label="Condición / CDC" value={item.condicion_venta ? item.condicion_venta.toUpperCase() : 'CONTADO'} desc={item.cdc || 'Factura Pre-impresa'} />
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between text-[11px] font-black text-gray-500 uppercase tracking-tighter">
                <span>IVA 10%</span><span className="text-blue-600">{formatGs(item.iva_10 || 0)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black text-gray-500 uppercase tracking-tighter">
                <span>IVA 5%</span><span className="text-indigo-600">{formatGs(item.iva_5 || 0)}</span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between text-[11px] font-black text-slate-800 uppercase tracking-tighter">
                <span>Exentas</span><span>{formatGs(item.exentas || 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {item.imagen_url && (
                <a href={item.imagen_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all">
                  <ImageIcon size={16} /> Ver Documento
                </a>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="flex items-center gap-2 bg-slate-100 text-slate-900 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                <Edit2 size={16} /> Corregir
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Registrado</p>
                <p className="text-[11px] text-gray-600 font-bold">{formatDateTime(item.created_at)}</p>
              </div>
              <div className="w-px h-8 bg-gray-200 mx-2" />
              <span className="text-[10px] text-gray-300 font-bold italic">ID: {item.id.split('-')[0]}...</span>
              <button
                onClick={handleMove}
                className="w-12 h-12 flex items-center justify-center text-indigo-500 bg-indigo-50 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all"
                title={`Mover a ${isGasto ? 'Ingresos' : 'Gastos'}`}
              >
                {isMoving ? <Loader2 size={20} className="animate-spin" /> : <Shield size={20} />}
              </button>
              <button
                onClick={handleDelete}
                className="w-12 h-12 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"
                title="Anular documento"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
