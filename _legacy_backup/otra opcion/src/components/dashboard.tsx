import { useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Folder, Package,
  AlertTriangle, Camera, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  proyectos, facturasGastos, inventarioEquipo, alertas, ingresos,
  monthlyFinancials, formatGs, formatGsShort,
  getServiceIcon, getStatusLabel, getStatusColor,
  getGastoLabel, getGastoColor,
  type Alerta
} from '../data/sampleData';

const severityConfig: Record<Alerta['severidad'], { bg: string; border: string; icon: string; dot: string }> = {
  critica: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', dot: 'bg-red-500' },
  advertencia: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', dot: 'bg-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', dot: 'bg-blue-500' },
};

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  // Compute stats
  const totalIngresos = ingresos.filter(i => i.estado === 'pagado').reduce((s, i) => s + i.monto, 0);
  const totalGastos = facturasGastos.reduce((s, f) => s + f.monto, 0);
  const margen = totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos * 100) : 0;
  const proyectosActivos = proyectos.filter(p => p.estado === 'en_progreso' || p.estado === 'cotizacion').length;
  const equiposPorVencer = inventarioEquipo.filter(e => e.tipo_propiedad === 'RENTADO' && e.fecha_fin_renta).length;
  const alertasNoLeidas = alertas.filter(a => !a.leida).length;

  // Expense by category
  const gastosPorCategoria = facturasGastos.reduce((acc, f) => {
    acc[f.tipo_gasto] = (acc[f.tipo_gasto] || 0) + f.monto;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(gastosPorCategoria)
    .map(([key, value]) => ({ name: getGastoLabel(key as any), value, color: getGastoColor(key as any) }))
    .sort((a, b) => b.value - a.value);

  const activeProjects = proyectos.filter(p => ['en_progreso', 'cotizacion', 'entregado', 'facturado'].includes(p.estado));
  const activeAlerts = alertas.filter(a => !a.leida);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">¡Hola, JuanJo! 👋</h1>
          <p className="text-gray-500 mt-1">Aquí está tu resumen de hoy</p>
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
          trend={12.5}
        />
        <StatCard
          title="Gastos"
          value={formatGsShort(totalGastos)}
          subtitle="este período"
          icon={<TrendingDown size={22} />}
          color="red"
          trend={-3.2}
        />
        <StatCard
          title="Margen"
          value={`${margen.toFixed(1)}%`}
          subtitle={margen >= 0 ? 'positivo' : 'negativo'}
          icon={<DollarSign size={22} />}
          color="blue"
          trend={margen >= 50 ? 5.0 : -2.0}
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

      {/* Alerts Banner */}
      {alertasNoLeidas > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-amber-900">Alertas ({alertasNoLeidas})</h3>
          </div>
          <div className="space-y-2">
            {activeAlerts.map(alert => {
              const cfg = severityConfig[alert.severidad];
              return (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl ${cfg.bg} ${cfg.border} border`}>
                  <div className={`w-2 h-2 rounded-full mt-2 ${cfg.dot} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{alert.titulo}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{alert.descripcion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Income vs Expenses Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-1">Ingresos vs Gastos</h3>
          <p className="text-sm text-gray-500 mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyFinancials}>
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

        {/* Expense Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-1">Gastos por Categoría</h3>
          <p className="text-sm text-gray-500 mb-4">Distribución actual</p>
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

      {/* Projects + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Proyectos Activos</h3>
            <button onClick={() => onNavigate('proyectos')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver todos →
            </button>
          </div>
          <div className="space-y-3">
            {activeProjects.slice(0, 4).map(project => {
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
                      <p className="text-xs text-gray-500">Entrega: {project.fecha_entrega}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Facturado: {formatGsShort(project.monto_facturado)}</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: progress >= 100 ? '#10B981' : getStatusColor(project.estado),
                        }}
                      />
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
          <QuickAction
            icon="📸"
            label="Subir Factura"
            desc="Captura y registra"
            color="#10B981"
            onClick={() => onNavigate('facturas')}
          />
          <QuickAction
            icon="📁"
            label="Proyectos"
            desc="Ver todos"
            color="#3B82F6"
            onClick={() => onNavigate('proyectos')}
          />
          <QuickAction
            icon="📦"
            label="Inventario"
            desc="Gestionar equipos"
            color="#F59E0B"
            onClick={() => onNavigate('inventario')}
          />
          <QuickAction
            icon="📊"
            label="Reportes"
            desc="Ver finanzas"
            color="#8B5CF6"
            onClick={() => onNavigate('reportes')}
          />
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
