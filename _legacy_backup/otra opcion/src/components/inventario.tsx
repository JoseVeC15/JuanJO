import { useState } from 'react';
import { Package, Plus, MapPin, Clock, AlertTriangle, Hash } from 'lucide-react';
import {
  inventarioEquipo, formatGsShort,
  getEquipmentIcon,
  type Equipo
} from '../data/sampleData';

const conditionConfig: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: '#10B981' },
  bueno: { label: 'Bueno', color: '#3B82F6' },
  regular: { label: 'Regular', color: '#F59E0B' },
  reparacion: { label: 'Reparación', color: '#EF4444' },
};

const ubicacionLabels: Record<string, string> = {
  en_stock: 'En Stock',
  en_proyecto: 'En Proyecto',
  mantenimiento: 'Mantenimiento',
  prestado: 'Prestado',
  vendido: 'Vendido',
};

function getDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Inventario() {
  const [tab, setTab] = useState<'PROPIO' | 'RENTADO'>('PROPIO');

  const propios = inventarioEquipo.filter(e => e.tipo_propiedad === 'PROPIO');
  const rentados = inventarioEquipo.filter(e => e.tipo_propiedad === 'RENTADO');
  const current = tab === 'PROPIO' ? propios : rentados;

  const totalValorPropios = propios.reduce((s, e) => s + (e.valor_actual || 0), 0);
  const totalCostoRenta = rentados.reduce((s, e) => s + (e.costo_renta_dia || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Inventario de Equipos</h1>
          <p className="text-gray-500 mt-1">
            {propios.length} propios · {rentados.length} rentados
          </p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all">
          <Plus size={20} />
          Agregar Equipo
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-5">
          <p className="text-blue-100 text-sm">Valor Total Equipos Propios</p>
          <p className="text-2xl font-bold mt-1">{formatGsShort(totalValorPropios)}</p>
          <p className="text-blue-200 text-xs mt-1">{propios.length} equipos</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-5">
          <p className="text-purple-100 text-sm">Costo Diario Total Rentas</p>
          <p className="text-2xl font-bold mt-1">{formatGsShort(totalCostoRenta)}/día</p>
          <p className="text-purple-200 text-xs mt-1">{rentados.length} equipos rentados</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('PROPIO')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'PROPIO' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📦 Propios ({propios.length})
        </button>
        <button
          onClick={() => setTab('RENTADO')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'RENTADO' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔄 Rentados ({rentados.length})
        </button>
      </div>

      {/* Equipment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {current.map(equipo => (
          <EquipmentCard key={equipo.id} equipo={equipo} />
        ))}
      </div>
    </div>
  );
}

function EquipmentCard({ equipo }: { equipo: Equipo }) {
  const isRented = equipo.tipo_propiedad === 'RENTADO';
  const cond = conditionConfig[equipo.condicion] || conditionConfig.bueno;
  const daysLeft = isRented ? getDaysLeft(equipo.fecha_fin_renta) : null;

  let countdownColor = 'text-green-600 bg-green-50';
  let countdownText = '';
  if (daysLeft !== null) {
    if (daysLeft <= 0) {
      countdownColor = 'text-red-600 bg-red-50';
      countdownText = '¡VENCIDO!';
    } else if (daysLeft <= 2) {
      countdownColor = 'text-red-600 bg-red-50';
      countdownText = `${daysLeft} día${daysLeft > 1 ? 's' : ''} restante${daysLeft > 1 ? 's' : ''}`;
    } else if (daysLeft <= 5) {
      countdownColor = 'text-amber-600 bg-amber-50';
      countdownText = `${daysLeft} días restantes`;
    } else {
      countdownColor = 'text-green-600 bg-green-50';
      countdownText = `${daysLeft} días restantes`;
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-3xl flex-shrink-0">
          {getEquipmentIcon(equipo.tipo)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-gray-900 text-lg">{equipo.nombre}</h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{ backgroundColor: cond.color + '15', color: cond.color }}
            >
              {cond.label}
            </span>
          </div>
          {equipo.marca_modelo && (
            <p className="text-sm text-gray-500">{equipo.marca_modelo}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-4">
        {equipo.numero_serie && (
          <Tag icon={<Hash size={11} />} text={`S/N: ${equipo.numero_serie}`} />
        )}
        {!isRented && equipo.ubicacion && (
          <Tag icon={<MapPin size={11} />} text={ubicacionLabels[equipo.ubicacion] || equipo.ubicacion} />
        )}
        {isRented && equipo.proveedor_renta && (
          <Tag icon={<Package size={11} />} text={equipo.proveedor_renta} />
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-4" />

      {/* Footer */}
      <div className="flex items-end justify-between">
        {!isRented && (
          <div>
            <p className="text-xs text-gray-400">Valor Actual</p>
            <p className="text-xl font-bold text-gray-900">{formatGsShort(equipo.valor_actual || 0)}</p>
            {equipo.costo_compra && (
              <p className="text-xs text-gray-400 mt-0.5">
                Compra: {formatGsShort(equipo.costo_compra)} · {equipo.fecha_compra}
              </p>
            )}
          </div>
        )}
        {isRented && (
          <div>
            <p className="text-xs text-gray-400">Costo por Día</p>
            <p className="text-xl font-bold text-gray-900">{formatGsShort(equipo.costo_renta_dia || 0)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {equipo.fecha_inicio_renta} → {equipo.fecha_fin_renta}
            </p>
          </div>
        )}

        {isRented && daysLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${countdownColor}`}>
            {daysLeft <= 2 ? <AlertTriangle size={14} /> : <Clock size={14} />}
            {countdownText}
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
      {icon}
      {text}
    </span>
  );
}
