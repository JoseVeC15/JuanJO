import { useState } from 'react';
import {
  Search, Package, Shield, PenTool, ExternalLink,
  ChevronDown, ChevronUp, AlertCircle, Loader2
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import {
  formatGsShort, getEquipmentIcon,
} from '../data/sampleData';

const condConfig: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: 'text-emerald-600 bg-emerald-50' },
  bueno: { label: 'Bueno', color: 'text-blue-600 bg-blue-50' },
  regular: { label: 'Regular', color: 'text-amber-600 bg-amber-50' },
  reparacion: { label: 'Reparación', color: 'text-red-600 bg-red-50' },
};

export default function Inventario() {
  const { inventarioEquipo, loading } = useSupabaseData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'PROPIO' | 'RENTADO'>('PROPIO');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="text-emerald-500 animate-spin" size={32} />
      </div>
    );
  }

  const filtered = inventarioEquipo
    .filter(e => e.tipo_propiedad === activeTab)
    .filter(e =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (e.marca_modelo?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (e.numero_serie?.toLowerCase() || '').includes(search.toLowerCase())
    );

  const totalPropio = inventarioEquipo.filter(e => e.tipo_propiedad === 'PROPIO').length;
  const totalRentado = inventarioEquipo.filter(e => e.tipo_propiedad === 'RENTADO').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Inventario y Equipos</h1>
          <p className="text-gray-500 mt-1">{inventarioEquipo.length} equipos en total</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <TabBtn label={`Propio (${totalPropio})`} active={activeTab === 'PROPIO'} onClick={() => setActiveTab('PROPIO')} />
          <TabBtn label={`Rentado (${totalRentado})`} active={activeTab === 'RENTADO'} onClick={() => setActiveTab('RENTADO')} />
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar equipo, marca o serie..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(equipo => {
          const isExpanded = expandedId === equipo.id;
          const cond = condConfig[equipo.condicion] || condConfig.bueno;

          return (
            <div key={equipo.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {getEquipmentIcon(equipo.tipo)}
                </div>
                <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${cond.color}`}>
                  {cond.label}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 text-lg mb-1">{equipo.nombre}</h3>
              <p className="text-sm text-gray-500 mb-4">{equipo.marca_modelo}</p>

              <div className="space-y-3 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Nº Serie:</span>
                  <span className="font-medium text-gray-700">{equipo.numero_serie || 'N/A'}</span>
                </div>
                
                {equipo.tipo_propiedad === 'PROPIO' ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Valor Est.:</span>
                    <span className="font-bold text-gray-900">{formatGsShort(Number(equipo.valor_actual || 0))}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Costo/Día:</span>
                      <span className="font-bold text-emerald-600">{formatGsShort(Number(equipo.costo_renta_dia || 0))}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1.5 rounded-lg text-[10px] font-bold">
                      <AlertCircle size={12} />
                      Vence: {equipo.fecha_fin_renta}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
        active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );
}
