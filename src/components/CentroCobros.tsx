import { useSupabaseData } from '../hooks/useSupabaseData';
import { formatGs, EstadoIngreso } from '../data/sampleData';
import { Clock, CheckCircle2, AlertCircle, FileText, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const statusConfig: Record<EstadoIngreso, { label: string; color: string; bg: string; icon: any }> = {
  emitida: { label: 'Emitida', color: 'text-blue-600', bg: 'bg-blue-50', icon: FileText },
  enviada: { label: 'Enviada', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Clock },
  vista: { label: 'Vista', color: 'text-purple-600', bg: 'bg-purple-50', icon: Search },
  vencida: { label: 'Vencida', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
  cobrada: { label: 'Cobrada', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
};

export default function CentroCobros() {
  const { ingresos, loading } = useSupabaseData();

  const totalDeuda = ingresos
    .filter(i => i.estado !== 'cobrada')
    .reduce((acc, curr) => acc + curr.monto, 0);

  if (loading) return <div className="p-8 text-center">Cargando centro de cobros...</div>;

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Centro de Cobros</h2>
          <p className="text-slate-500 font-medium">Gestión activa de facturación y seguimiento de pagos.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 px-8">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Deuda Total Pendiente</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{formatGs(totalDeuda)}</p>
          </div>
        </div>
      </div>

      {/* Grid de Facturas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ingresos.map((factura) => {
          const config = statusConfig[factura.estado];
          const Icon = config.icon;

          return (
            <motion.div
              key={factura.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`${config.bg} ${config.color} p-3 rounded-2xl`}>
                  <Icon size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
              </div>

              <div className="space-y-1 mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{factura.cliente}</p>
                <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                  {factura.numero_factura || 'Sin número'}
                </h3>
                <p className="text-2xl font-black text-slate-900">{formatGs(factura.monto)}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Vencimiento</span>
                  <span className="text-xs font-bold text-slate-700">{factura.fecha_vencimiento || 'N/A'}</span>
                </div>
                <button className="text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-tighter bg-emerald-50 px-4 py-2 rounded-xl transition-colors">
                  Ver detalle
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
