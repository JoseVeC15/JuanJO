import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  facturasGastos, ingresos, proyectos, monthlyFinancials,
  formatGs, formatGsShort,
  getGastoLabel, getGastoColor, getStatusLabel, getStatusColor,
} from '../data/sampleData';

export default function Reportes() {
  // Income by project
  const ingresosByProject = proyectos.map(p => ({
    name: p.nombre_cliente.length > 12 ? p.nombre_cliente.substring(0, 12) + '…' : p.nombre_cliente,
    presupuestado: p.monto_presupuestado,
    facturado: p.monto_facturado,
  }));

  // Expenses by category
  const gastosCat = facturasGastos.reduce((acc, f) => {
    acc[f.tipo_gasto] = (acc[f.tipo_gasto] || 0) + f.monto;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(gastosCat)
    .map(([key, value]) => ({
      name: getGastoLabel(key as any),
      value,
      color: getGastoColor(key as any),
    }))
    .sort((a, b) => b.value - a.value);

  // Project status distribution
  const statusCount = proyectos.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusPie = Object.entries(statusCount).map(([key, value]) => ({
    name: getStatusLabel(key as any),
    value,
    color: getStatusColor(key as any),
  }));

  // Payment methods
  const metodoPago = facturasGastos.reduce((acc, f) => {
    const label = f.metodo_pago.replace('_', ' ');
    acc[label] = (acc[label] || 0) + f.monto;
    return acc;
  }, {} as Record<string, number>);

  const paymentData = Object.entries(metodoPago).map(([name, value]) => ({ name, value }));

  // Totals
  const totalIngresos = ingresos.filter(i => i.estado === 'pagado').reduce((s, i) => s + i.monto, 0);
  const totalGastos = facturasGastos.reduce((s, f) => s + f.monto, 0);
  const utilidad = totalIngresos - totalGastos;
  const margen = totalIngresos > 0 ? (utilidad / totalIngresos * 100) : 0;

  // Monthly margin
  const marginData = monthlyFinancials.map(m => ({
    mes: m.mes,
    margen: m.ingresos > 0 ? ((m.ingresos - m.gastos) / m.ingresos * 100) : 0,
    utilidad: m.ingresos - m.gastos,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reportes Financieros</h1>
        <p className="text-gray-500 mt-1">Dashboard premium de salud financiera</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Ingresos Cobrados"
          value={formatGsShort(totalIngresos)}
          bg="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <KPICard
          label="Gastos Totales"
          value={formatGsShort(totalGastos)}
          bg="bg-gradient-to-br from-red-400 to-red-600"
        />
        <KPICard
          label="Utilidad Neta"
          value={formatGsShort(utilidad)}
          bg="bg-gradient-to-br from-blue-400 to-blue-600"
        />
        <KPICard
          label="Margen"
          value={`${margen.toFixed(1)}%`}
          bg="bg-gradient-to-br from-purple-400 to-purple-600"
        />
      </div>

      {/* Row 1: Monthly Trend + Margin */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Ingresos vs Gastos Mensual">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyFinancials}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: any) => formatGs(Number(value))} />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Evolución del Margen">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={marginData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
              <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)}%`} />
              <Line type="monotone" dataKey="margen" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 5 }} name="Margen %" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: By Project + Categories */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Presupuesto vs Facturado por Proyecto">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ingresosByProject} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip formatter={(value: any) => formatGs(Number(value))} />
              <Legend />
              <Bar dataKey="presupuestado" name="Presupuestado" fill="#93c5fd" radius={[0, 4, 4, 0]} />
              <Bar dataKey="facturado" name="Facturado" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribución de Gastos">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatGs(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600 flex-1">{item.name}</span>
                  <span className="text-xs font-bold text-gray-800">{formatGsShort(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 3: Status + Payment */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Estado de Proyectos">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPie.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {statusPie.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                  <span className="bg-gray-100 text-gray-800 text-sm font-bold px-3 py-1 rounded-lg">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Métodos de Pago">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={paymentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: any) => formatGs(Number(value))} />
              <Bar dataKey="value" name="Monto" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function KPICard({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} text-white rounded-2xl p-5 shadow-lg`}>
      <p className="text-white/80 text-sm">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}
