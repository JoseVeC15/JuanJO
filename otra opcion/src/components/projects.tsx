import { useState } from 'react';
import { Search, Filter, Calendar, Plus } from 'lucide-react';
import {
  proyectos, formatGs, formatGsShort,
  getServiceIcon, getServiceLabel, getStatusLabel, getStatusColor,
  type Proyecto
} from '../data/sampleData';

const filterOptions: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'cotizacion', label: 'Cotización' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'facturado', label: 'Facturado' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function Projects() {
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = proyectos
    .filter(p => filter === 'todos' || p.estado === filter)
    .filter(p => p.nombre_cliente.toLowerCase().includes(search.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(search.toLowerCase()));

  // Summary stats
  const totalPresupuestado = proyectos.reduce((s, p) => s + p.monto_presupuestado, 0);
  const totalFacturado = proyectos.reduce((s, p) => s + p.monto_facturado, 0);
  const totalPagado = proyectos.filter(p => p.estado === 'pagado').reduce((s, p) => s + p.monto_facturado, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-gray-500 mt-1">{proyectos.length} proyectos totales</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          Nuevo Proyecto
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5">
          <p className="text-blue-100 text-sm">Total Presupuestado</p>
          <p className="text-2xl font-bold mt-1">{formatGsShort(totalPresupuestado)}</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl p-5">
          <p className="text-teal-100 text-sm">Total Facturado</p>
          <p className="text-2xl font-bold mt-1">{formatGsShort(totalFacturado)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-5">
          <p className="text-emerald-100 text-sm">Total Cobrado</p>
          <p className="text-2xl font-bold mt-1">{formatGsShort(totalPagado)}</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar proyecto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === opt.value
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Filter size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No hay proyectos con este filtro</p>
          </div>
        ) : (
          filtered.map(project => {
            const progress = project.monto_presupuestado > 0
              ? (project.monto_facturado / project.monto_presupuestado) * 100
              : 0;
            const isSelected = selectedProject?.id === project.id;

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(isSelected ? null : project)}
                className={`bg-white rounded-2xl border p-6 cursor-pointer transition-all ${
                  isSelected ? 'border-blue-300 shadow-lg shadow-blue-50 ring-1 ring-blue-200' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: getStatusColor(project.estado) + '15' }}
                  >
                    {getServiceIcon(project.tipo_servicio)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-lg">{project.nombre_cliente}</h3>
                      <span
                        className="text-xs px-3 py-1 rounded-full font-bold"
                        style={{
                          backgroundColor: getStatusColor(project.estado) + '18',
                          color: getStatusColor(project.estado),
                        }}
                      >
                        {getStatusLabel(project.estado)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{project.descripcion}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {project.fecha_inicio} → {project.fecha_entrega}
                      </span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        {getServiceLabel(project.tipo_servicio)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden md:block">
                    <p className="font-bold text-xl text-gray-900">{formatGsShort(project.monto_presupuestado)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Facturado: {formatGsShort(project.monto_facturado)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Progreso de facturación</span>
                    <span className="font-semibold">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: progress >= 100 ? '#10B981' : getStatusColor(project.estado),
                      }}
                    />
                  </div>
                </div>

                {/* Expanded Detail */}
                {isSelected && (
                  <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DetailItem label="Presupuesto" value={formatGs(project.monto_presupuestado)} />
                    <DetailItem label="Facturado" value={formatGs(project.monto_facturado)} />
                    <DetailItem label="Pendiente" value={formatGs(project.monto_presupuestado - project.monto_facturado)} />
                    <DetailItem label="Creado" value={project.created_at} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-gray-800 text-sm mt-0.5">{value}</p>
    </div>
  );
}

