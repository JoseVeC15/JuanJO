import { 
  BarChart3, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, 
  Download, Loader2 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { resolveServiceProfile } from '../config/serviceProfiles';
import { formatGs, formatGsShort, getGastoLabel, getGastoColor } from '../data/sampleData';

export default function Reportes() {
  const { facturasGastos, ingresos, loadingFacturas, loadingIngresos, profile } = useSupabaseData();
  const serviceProfile = resolveServiceProfile(profile);
  const reportPresetSet = new Set(serviceProfile.reportPresets);

  if (loadingFacturas || loadingIngresos) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="text-emerald-500 animate-spin" size={36} />
        <p className="text-gray-400 font-bold text-sm">Calculando tus reportes...</p>
      </div>
    );
  }

  // Aggregate by category
  const gastosPorCategoria = facturasGastos.reduce((acc, f) => {
    acc[f.tipo_gasto] = (acc[f.tipo_gasto] || 0) + Number(f.monto);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(gastosPorCategoria).map(([name, value]) => ({
    name: getGastoLabel(name as any),
    value: value as number,
    color: getGastoColor(name as any)
  })).sort((a, b) => b.value - a.value);

  const totalIngresos = ingresos.filter(i => i.estado === 'cobrada' || i.estado === 'pagado').reduce((s, i) => s + Number(i.monto), 0);
  const totalGastos = facturasGastos.reduce((s, f) => s + Number(f.monto), 0);
  const cuentasPorCobrar = ingresos.filter(i => i.estado !== 'cobrada' && i.estado !== 'pagado').reduce((s, i) => s + Number(i.monto), 0);
  const ivaEstimado = Math.max(0,
    ingresos.reduce((s, i) => s + Number(i.iva_10 || 0) + Number(i.iva_5 || 0), 0) -
    facturasGastos.reduce((s, f) => s + Number(f.iva_10 || 0) + Number(f.iva_5 || 0), 0)
  );
  const utilidad = totalIngresos - totalGastos;

  const recomendaciones = [
    cuentasPorCobrar > 0 ? `Prioriza cobros por ${formatGs(cuentasPorCobrar)} para mejorar caja.` : 'No tienes cobros pendientes relevantes hoy.',
    totalGastos > totalIngresos ? 'Tus gastos superan ingresos: recorta costos variables esta semana.' : 'Tus gastos están por debajo de ingresos: buen control de costos.',
    ivaEstimado > 0 ? `Reserva ${formatGs(ivaEstimado)} para impuestos estimados.` : 'No se observa impuesto estimado a pagar en este corte.',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reportes - {serviceProfile.name}</h1>
          <p className="text-gray-500 mt-1">Vista clara según el tipo de servicio activo.</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
          <Download size={18} />
          Exportar PDF
        </button>
      </div>

      {reportPresetSet.has('resumen_simple') && (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Recomendaciones Automáticas</p>
        <div className="space-y-2">
          {recomendaciones.map((item, idx) => (
            <p key={idx} className="text-sm font-medium text-slate-700">• {item}</p>
          ))}
        </div>
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReportCard label="Ingresos Cobrados" value={formatGs(totalIngresos)} trend={0} />
            <ReportCard label="Gastos Totales" value={formatGs(totalGastos)} trend={0} />
            <ReportCard label="Balance Neto" value={formatGs(utilidad)} trend={0} />
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm min-w-0">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <BarChart3 className="text-emerald-500" size={20} />
              Ingresos vs Gastos (corte actual)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[{ name: 'Actual', ingresos: totalIngresos, gastos: totalGastos }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis tickFormatter={(v) => formatGsShort(v)} tick={{fontSize: 12}} />
                <Tooltip formatter={(v) => formatGs(Number(v))} />
                <Bar dataKey="ingresos" fill="#10B981" radius={[6, 6, 0, 0]} barSize={60} />
                <Bar dataKey="gastos" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm min-w-0">
           <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <PieIcon className="text-emerald-500" size={20} />
            ¿En qué se te va el dinero?
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatGs(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-3">
            {pieData.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900">{formatGsShort(item.value)}</span>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-100 text-sm font-bold text-slate-700">
              Cobros pendientes: {formatGs(cuentasPorCobrar)}
            </div>
            {reportPresetSet.has('fiscal_iva') && <div className="text-sm font-bold text-slate-700">
              Impuesto estimado: {formatGs(ivaEstimado)}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ label, value, trend }: { label: string; value: string; trend: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      {trend !== 0 && (
        <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}% vs mes anterior
        </div>
      )}
    </div>
  );
}
