import { useState } from 'react';
import {
  Search, Upload, FileText, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, Scan
} from 'lucide-react';
import {
  facturasGastos, formatGs, formatGsShort,
  getGastoLabel, getGastoColor,
  type EstadoGasto
} from '../data/sampleData';

const estadoConfig: Record<EstadoGasto, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente_clasificar: { label: 'Pendiente', color: '#F59E0B', icon: <Clock size={14} /> },
  registrada: { label: 'Registrada', color: '#3B82F6', icon: <FileText size={14} /> },
  en_proceso_pago: { label: 'En Proceso', color: '#8B5CF6', icon: <AlertCircle size={14} /> },
  pagada: { label: 'Pagada', color: '#10B981', icon: <CheckCircle size={14} /> },
};

export default function Facturas() {
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOCR, setShowOCR] = useState(false);

  const filtered = facturasGastos
    .filter(f => filterEstado === 'todos' || f.estado === filterEstado)
    .filter(f =>
      f.proveedor.toLowerCase().includes(search.toLowerCase()) ||
      f.numero_factura.toLowerCase().includes(search.toLowerCase()) ||
      f.concepto_ocr.toLowerCase().includes(search.toLowerCase())
    );

  const totalGastos = facturasGastos.reduce((s, f) => s + f.monto, 0);
  const totalIVA10 = facturasGastos.reduce((s, f) => s + f.iva_10, 0);
  const totalIVA5 = facturasGastos.reduce((s, f) => s + f.iva_5, 0);
  const totalExentas = facturasGastos.reduce((s, f) => s + f.exentas, 0);
  const ocrProcessed = facturasGastos.filter(f => f.processed_by_n8n).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Facturas y Gastos</h1>
          <p className="text-gray-500 mt-1">{facturasGastos.length} registros · {ocrProcessed} procesados por OCR</p>
        </div>
        <button
          onClick={() => setShowOCR(!showOCR)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
        >
          <Upload size={20} />
          Nueva Factura (OCR)
        </button>
      </div>

      {/* OCR Demo Panel */}
      {showOCR && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Scan size={22} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Procesamiento Inteligente de Facturas</h3>
              <p className="text-slate-400 text-sm">Powered by OpenAI GPT-4o-mini + n8n</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-emerald-500/50 transition-colors cursor-pointer">
              <Upload size={40} className="mx-auto text-slate-500 mb-3" />
              <p className="font-semibold text-slate-300">Arrastra una factura aquí</p>
              <p className="text-sm text-slate-500 mt-1">o haz clic para seleccionar</p>
              <p className="text-xs text-slate-600 mt-3">📸 Cámara · 🖼️ Galería · 📄 PDF</p>
            </div>

            {/* OCR Features */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">Extracción Automática</h4>
              <div className="space-y-2">
                {[
                  { icon: '🏢', label: 'RUC Proveedor', desc: 'Detección automática del emisor' },
                  { icon: '📋', label: 'Nº Factura + Timbrado', desc: 'Formato paraguayo completo' },
                  { icon: '💰', label: 'IVA 5%, 10%, Exentas', desc: 'Desglose fiscal automático' },
                  { icon: '🤖', label: 'Concepto OCR', desc: 'Resumen inteligente de items' },
                  { icon: '🔍', label: 'Emisor vs Comprador', desc: 'Identificación experta' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="font-medium text-sm text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Gastos" value={formatGsShort(totalGastos)} color="bg-red-50 text-red-700" />
        <SummaryCard label="IVA 10%" value={formatGsShort(totalIVA10)} color="bg-blue-50 text-blue-700" />
        <SummaryCard label="IVA 5%" value={formatGsShort(totalIVA5)} color="bg-purple-50 text-purple-700" />
        <SummaryCard label="Exentas" value={formatGsShort(totalExentas)} color="bg-gray-50 text-gray-700" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por proveedor, factura o concepto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterBtn label="Todos" active={filterEstado === 'todos'} onClick={() => setFilterEstado('todos')} />
          <FilterBtn label="Pendientes" active={filterEstado === 'pendiente_clasificar'} onClick={() => setFilterEstado('pendiente_clasificar')} />
          <FilterBtn label="Registradas" active={filterEstado === 'registrada'} onClick={() => setFilterEstado('registrada')} />
          <FilterBtn label="Pagadas" active={filterEstado === 'pagada'} onClick={() => setFilterEstado('pagada')} />
        </div>
      </div>

      {/* Invoices Table/Cards */}
      <div className="space-y-3">
        {filtered.map(factura => {
          const isExpanded = expandedId === factura.id;
          const est = estadoConfig[factura.estado];

          return (
            <div
              key={factura.id}
              className={`bg-white rounded-2xl border transition-all ${
                isExpanded ? 'border-blue-200 shadow-lg shadow-blue-50' : 'border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Main Row */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : factura.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Category Badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: getGastoColor(factura.tipo_gasto) + '15' }}
                  >
                    <FileText size={20} style={{ color: getGastoColor(factura.tipo_gasto) }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-gray-900">{factura.proveedor}</h4>
                      <span
                        className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: est.color + '18', color: est.color }}
                      >
                        {est.icon} {est.label}
                      </span>
                      {factura.processed_by_n8n && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">
                          🤖 OCR
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{factura.concepto_ocr}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>📋 {factura.numero_factura}</span>
                      <span>📅 {factura.fecha_factura}</span>
                      {factura.proyecto_nombre && (
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                          📁 {factura.proyecto_nombre}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    <div className="hidden sm:block">
                      <p className="font-bold text-lg text-gray-900">{formatGs(factura.monto)}</p>
                      <p className="text-xs text-gray-400">
                        {getGastoLabel(factura.tipo_gasto)}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <DetailField label="RUC Proveedor" value={factura.ruc_proveedor} />
                    <DetailField label="Timbrado" value={factura.timbrado} />
                    <DetailField label="Método de Pago" value={factura.metodo_pago.replace('_', ' ')} />
                    <DetailField label="Deducible" value={factura.es_deducible ? '✅ Sí' : '❌ No'} />
                  </div>

                  {/* IVA Breakdown */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h5 className="font-semibold text-gray-700 text-sm mb-3">Desglose Fiscal (Paraguay)</h5>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Monto Total</p>
                        <p className="font-bold text-gray-900">{formatGs(factura.monto)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">IVA 10%</p>
                        <p className="font-semibold text-blue-600">{formatGs(factura.iva_10)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">IVA 5%</p>
                        <p className="font-semibold text-purple-600">{formatGs(factura.iva_5)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Exentas</p>
                        <p className="font-semibold text-gray-600">{formatGs(factura.exentas)}</p>
                      </div>
                    </div>
                  </div>

                  {/* OCR Concept */}
                  {factura.concepto_ocr && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Scan size={14} className="text-blue-600" />
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Sugerencia de Concepto (OCR)</span>
                      </div>
                      <p className="text-sm text-blue-900">{factura.concepto_ocr}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <p className="text-xs opacity-70 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-gray-800 text-sm mt-0.5 capitalize">{value}</p>
    </div>
  );
}
