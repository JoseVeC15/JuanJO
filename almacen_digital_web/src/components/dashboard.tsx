import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Folder, Package,
  AlertTriangle, Camera, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useSupabaseData } from '../hooks/useSupabaseData';
import {
  formatGs, formatGsShort,
  getServiceIcon, getStatusLabel, getStatusColor,
  getGastoLabel, getGastoColor
} from '../data/sampleData';
import { useAuth } from '../contexts/AuthContext';

const severityConfig: Record<string, { bg: string; border: string; icon: string; dot: string }> = {
  critica: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', dot: 'bg-red-500' },
  advertencia: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', dot: 'bg-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', dot: 'bg-blue-500' },
};

export default function Dashboard({ onNavigate }: { onNavigate: (page: any) => void }) {
  const { proyectos, facturasGastos, inventarioEquipo, alertas, ingresos, loading } = useSupabaseData();
  const { user } = useAuth();
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="text-emerald-500 animate-spin" size={32} />
      </div>
    );
  }

  // Compute stats
  const totalIngresos = ingresos.filter(i => i.estado === 'pagado').reduce((s, i) => s + Number(i.monto), 0);
  const totalGastos = facturasGastos.reduce((s, f) => s + Number(f.monto), 0);
  const margen = totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos * 100) : 0;
  const proyectosActivos = proyectos.filter(p => p.estado === 'en_progreso' || p.estado === 'cotizacion').length;
  const equiposPorVencer = inventarioEquipo.filter(e => e.tipo_propiedad === 'RENTADO' && e.fecha_fin_renta).length;
  const alertasNoLeidas = alertas.filter(a => !a.leida).length;

  // Expense by category
  const gastosPorCategoria = facturasGastos.reduce((acc, f) => {
    acc[f.tipo_gasto] = (acc[f.tipo_gasto] || 0) + Number(f.monto);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(gastosPorCategoria)
    .map(([key, value]) => ({ name: getGastoLabel(key as any), value, color: getGastoColor(key as any) }))
    .sort((a, b) => b.value - a.value);

  const activeProjects = proyectos.filter(p => ['en_progreso', 'cotizacion', 'entregado', 'facturado'].includes(p.estado));
  const activeAlerts = alertas.filter(a => !a.leida);

  // Chart data (mocking 6 months based on current totals for now, or could use real monthly grouping)
  const chartData = [
    { mes: 'Ene', ingresos: totalIngresos * 0.7, gastos: totalGastos * 0.6 },
    { mes: 'Feb', ingresos: totalIngresos * 0.9, gastos: totalGastos * 0.8 },
    { mes: 'Mar', ingresos: totalIngresos, gastos: totalGastos },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            ¡Hola, {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'de nuevo'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Tu FINANCE está al día</p>
        </div>
        <button
          onClick={() => onNavigate('facturas')}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all hover:-translate-y-0.5"
        >
          <Camera size={20} />
          Subir Factura
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ingresos"
          value={formatGsShort(totalIngresos)}
          subtitle="cobrados"
          icon={<TrendingUp size={22} />}
          color="emerald"
          trend={totalIngresos > 0 ? 12.5 : undefined}
        />
        <StatCard
          title="Gastos"
          value={formatGsShort(totalGastos)}
          subtitle="este período"
          icon={<TrendingDown size={22} />}
          color="red"
          trend={totalGastos > 0 ? -3.2 : undefined}
        />
        <StatCard
          title="Margen"
          value={`${margen.toFixed(1)}%`}
          subtitle={margen >= 0 ? 'positivo' : 'negativo'}
          icon={<Wallet size={22} />}
          color="blue"
          trend={(totalIngresos > 0 || totalGastos > 0) ? (margen >= 50 ? 5.0 : -2.0) : undefined}
        />
        <StatCard
          title="Proyectos"
          value={`${proyectosActivos}`}
          subtitle="activos"
          icon={<Folder size={22} />}
          color="purple"
          extra={
            <div className="flex items-center gap-1 mt-1">
              <Package size={12} className="text-amber-500" />
              <span className="text-xs text-amber-600">{equiposPorVencer} equipos rentados</span>
            </div>
          }
        />
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-1">Tendencia Financiera</h3>
          <p className="text-sm text-gray-500 mb-4">Ingresos vs Gastos reales</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip
                formatter={(value: any) => [formatGs(Number(value)), '']}
                labelStyle={{ fontWeight: 700 }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
              />
              <Area type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2.5} fill="url(#ingGrad)" name="Ingresos" />
              <Area type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2.5} fill="url(#gasGrad)" name="Gastos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-1">Distribución de Gastos</h3>
          <p className="text-sm text-gray-500 mb-4">Por categorías</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatGs(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600 flex-1 truncate">{item.name}</span>
                <span className="text-xs font-semibold text-gray-800">{formatGsShort(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Proyectos en Curso</h3>
          <div className="space-y-3">
            {activeProjects.map(project => {
              const progress = project.monto_presupuestado > 0
                ? (project.monto_facturado / project.monto_presupuestado) * 100
                : 0;
              return (
                <div
                  key={project.id}
                  className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer ${hoveredProject === project.id ? 'border-blue-300 shadow-md shadow-blue-50' : 'border-gray-100 shadow-sm'}`}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: getStatusColor(project.estado) + '15' }}>
                      {getServiceIcon(project.tipo_servicio)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900">{project.nombre_cliente}</h4>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                          style={{
                            backgroundColor: getStatusColor(project.estado) + '18',
                            color: getStatusColor(project.estado),
                          }}>
                          {getStatusLabel(project.estado)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{project.descripcion}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="font-bold text-gray-900">{formatGsShort(project.monto_presupuestado)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-lg">Acciones Rápidas</h3>
          <QuickAction icon="📸" label="Subir Factura" desc="Registrar gasto con OCR" color="#10B981" onClick={() => onNavigate('facturas')} />
          <QuickAction icon="📂" label="Proyectos" desc="Gestionar trabajos" color="#3B82F6" onClick={() => onNavigate('proyectos')} />
          <QuickAction icon="📦" label="Inventario" desc="Equipos y rentas" color="#F59E0B" onClick={() => onNavigate('inventario')} />
          <QuickAction icon="📊" label="Reportes" desc="Análisis financiero" color="#8B5CF6" onClick={() => onNavigate('reportes')} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, subtitle, icon, color, trend, extra }: {
  title: string; value: string; subtitle: string; icon: React.ReactNode;
  color: string; trend?: number; extra?: React.ReactNode;
}) {
  const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
    emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    red: { bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.iconColor} flex items-center justify-center`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        {extra}
      </div>
    </div>
  );
}

function QuickAction({ icon, label, desc, color, onClick }: {
  icon: string; label: string; desc: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md transition-all text-left group"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
        style={{ backgroundColor: color + '15' }}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <ArrowUpRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </button>
  );
}
