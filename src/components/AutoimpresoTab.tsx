import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Plus, X, Download, Search, Trash2, Edit2, Loader2,
    Shield, CheckCircle, AlertCircle
} from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useAuth } from '../contexts/AuthContext';
import { generateNumeroDocumento } from '../lib/autoimpreso/utils';
import {
    TIPO_COMPROBANTE_CONFIG,
    formatGs,
    type FacturaAutoimpreso,
    type TipoComprobante
} from '../data/sampleData';

interface AutoimpresoTabProps {
    perfilFiscal: any;
    configSifen: any;
    isPeriodoBloqueado: (fecha: string) => boolean;
}

export default function AutoimpresoTab({ perfilFiscal, configSifen, isPeriodoBloqueado }: AutoimpresoTabProps) {
    const { facturasAutoimpreso, loading: dataLoading } = useSupabaseData();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [filterTipo, setFilterTipo] = useState<TipoComprobante | 'todos'>('todos');
    const [filterEstado, setFilterEstado] = useState<'todos' | 'emitido' | 'anulado'>('todos');
    const [showNewModal, setShowNewModal] = useState(false);
    const [editingItem, setEditingItem] = useState<FacturaAutoimpreso | null>(null);

    const filteredData = facturasAutoimpreso.filter(f => {
        if (filterTipo !== 'todos' && f.tipo_comprobante !== filterTipo) return false;
        if (filterEstado !== 'todos' && f.estado !== filterEstado) return false;
        if (search) {
            const text = `${f.razon_social} ${f.numero_documento} ${f.ruc} ${f.timbrado}`.toLowerCase();
            return text.includes(search.toLowerCase());
        }
        return true;
    });

    const stats = filteredData.reduce((acc, f) => ({
        total: acc.total + Number(f.monto_total),
        iva10: acc.iva10 + Number(f.iva_10 || 0),
        iva5: acc.iva5 + Number(f.iva_5 || 0),
    }), { total: 0, iva10: 0, iva5: 0 });

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                        <Shield size={14} /> Cumplimiento DNIT Autoimpreso
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                        Comprobantes Autoimpresos
                    </h1>
                    <p className="text-gray-500 font-medium italic">Factura comercial, notas de credito/debito, recibos.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white border border-gray-100 p-1.5 rounded-2xl flex shadow-sm">
                        {(['todos', 'factura_comercial', 'nota_credito', 'nota_debito', 'recibo'] as const).map(tipo => (
                            <button
                                key={tipo}
                                onClick={() => setFilterTipo(tipo as any)}
                                className={`px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                                    filterTipo === tipo
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title={tipo === 'todos' ? 'Todos' : TIPO_COMPROBANTE_CONFIG[tipo]?.label}
                            >
                                {tipo === 'todos' ? 'Todos' : TIPO_COMPROBANTE_CONFIG[tipo]?.sigla}
                            </button>
                        ))}
                    </div>
                    {perfilFiscal && (
                        <button
                            onClick={() => {
                                if (isPeriodoBloqueado(new Date().toISOString())) {
                                    alert("⚠️ El periodo actual esta CERRADO. No se pueden emitir documentos.");
                                    return;
                                }
                                setShowNewModal(true);
                            }}
                            className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={18} /> Emitir Comprobante
                        </button>
                    )}
                    <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value as any)}
                        className="pl-5 pr-10 py-3 bg-white border border-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-600 outline-none shadow-sm"
                    >
                        <option value="todos">Todos</option>
                        <option value="emitido">Emitidos</option>
                        <option value="anulado">Anulados</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <SummaryCard label="Total Emitido (IVA Incl)" value={formatGs(stats.total)} desc="Monto bruto registrado" color="bg-amber-50 text-amber-700 border-amber-100" />
                <SummaryCard label="IVA Debito 10%" value={formatGs(stats.iva10)} desc="Reserva impositiva 10%" color="bg-blue-50 text-blue-700 border-blue-100" />
                <SummaryCard label="IVA Debito 5%" value={formatGs(stats.iva5)} desc="Tasa reducida" color="bg-indigo-50 text-indigo-700 border-indigo-100" />
            </div>

            {/* Search + Filters */}
            <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm flex flex-col md:flex-row gap-5">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Razon social, Nro documento, RUC, Timbrado..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[1.25rem] border-none focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-bold text-gray-800 placeholder:text-gray-300 shadow-inner"
                    />
                </div>
            </div>

            {/* Table */}
            <motion.div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Receptor / RUC</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nro Doc / Timbrado</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">IVA 10% / 5%</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto Total</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                            <th className="p-6 w-28 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.length === 0 ? (
                            <tr><td colSpan={8} className="p-20 text-center text-gray-400 font-medium italic">No hay comprobantes autoimpresos emitidos.</td></tr>
                        ) : filteredData.map((doc: any) => {
                            const tipoConfig = TIPO_COMPROBANTE_CONFIG[doc.tipo_comprobante] || TIPO_COMPROBANTE_CONFIG.factura_comercial;
                            return (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-all cursor-default group">
                                    <td className="p-6">
                                        <span className="text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest" style={{ backgroundColor: tipoConfig.color + '15', color: tipoConfig.color }}>
                                            {tipoConfig.sigla}
                                        </span>
                                    </td>
                                    <td className="p-6 text-xs font-bold text-gray-600">{doc.fecha_emision}</td>
                                    <td className="p-6">
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{doc.razon_social}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{doc.ruc}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-xs font-black text-gray-700">{doc.numero_documento}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">Timb: {doc.timbrado}</p>
                                    </td>
                                    <td className="p-6 text-right">
                                        <p className="text-[11px] font-bold text-blue-600">{formatGs(Number(doc.iva_10 || 0))}</p>
                                        <p className="text-[10px] font-semibold text-indigo-500 mt-0.5">{formatGs(Number(doc.iva_5 || 0))}</p>
                                    </td>
                                    <td className="p-6 text-sm font-black text-gray-900 text-right">{formatGs(doc.monto_total)}</td>
                                    <td className="p-6 text-center">
                                        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                                            doc.estado === 'emitido'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {doc.estado === 'emitido' ? 'Emitido' : 'Anulado'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { generarPDFAutoimpreso } = await import('../lib/autoimpreso/generadorPdf');
                                                        generarPDFAutoimpreso({
                                                            rucEmisor: perfilFiscal.ruc,
                                                            razonSocialEmisor: perfilFiscal.razon_social,
                                                            nombreFantasia: perfilFiscal.nombre_fantasia,
                                                            direccionEmisor: perfilFiscal.direccion || 'Asuncion, Paraguay',
                                                            telefonoEmisor: perfilFiscal.telefono,
                                                            tipo_comprobante: doc.tipo_comprobante,
                                                            numero_documento: doc.numero_documento,
                                                            timbrado: doc.timbrado,
                                                            vencimiento_timbrado: doc.vencimiento_timbrado,
                                                            fecha_emision: doc.fecha_emision,
                                                            establecimiento: doc.establecimiento,
                                                            punto_expedicion: doc.punto_expedicion,
                                                            condicion_operacion: doc.condicion_operacion || 'contado',
                                                            razon_social_receptor: doc.razon_social,
                                                            ruc_receptor: doc.ruc,
                                                            items: doc.items || [{ descripcion: doc.notas || 'Documento autoimpreso', cantidad: 1, precio_unitario: doc.monto_total, iva_tipo: 10, total_item: doc.monto_total }],
                                                            subtotal_iva_10: Number(doc.iva_10 || 0),
                                                            subtotal_iva_5: Number(doc.iva_5 || 0),
                                                            total_exentas: Number(doc.exentas || 0),
                                                            iva_10: Number(doc.iva_10 || 0),
                                                            iva_5: Number(doc.iva_5 || 0),
                                                            monto_total: doc.monto_total,
                                                            notas: doc.notas,
                                                        });
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }}
                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-amber-500 rounded-lg transition-colors"
                                                title="Descargar PDF"
                                            >
                                                <Download size={16} />
                                            </button>
                                            {(doc.estado === 'emitido') && (
                                                <button
                                                    onClick={async () => {
                                                        if (isPeriodoBloqueado(doc.fecha_emision)) {
                                                            alert("⚠️ No se puede anular un documento en un periodo CERRADO.");
                                                            return;
                                                        }
                                                        if (confirm(`¿Anular ${tipoConfig.label} N° ${doc.numero_documento}?`)) {
                                                            await supabase.from('facturas_autoimpreso').update({ estado: 'anulado' }).eq('id', doc.id);
                                                            queryClient.invalidateQueries({ queryKey: ['facturas_autoimpreso', user?.id] });
                                                        }
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:rose-500 transition-colors"
                                                    title="Anular"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </motion.div>

            {/* New Document Modal */}
            <AnimatePresence>
                {showNewModal && perfilFiscal && (
                    <NewDocumentModal
                        onClose={() => setShowNewModal(false)}
                        perfilFiscal={perfilFiscal}
                        configSifen={configSifen}
                        onSuccess={() => {
                            setShowNewModal(false);
                            queryClient.invalidateQueries({ queryKey: ['facturas_autoimpreso', user?.id] });
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ========================================================================== */
/* SUBCOMPONENTS                                                              */
/* ========================================================================== */

function SummaryCard({ label, value, desc, color }: { label: string; value: string; desc: string; color: string }) {
    return (
        <div className={`rounded-2xl p-6 border ${color}`}>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black mt-1">{value}</p>
            <p className="text-[10px] text-gray-500 mt-1 font-bold">{desc}</p>
        </div>
    );
}

/* ========================================================================== */
/* EMITIR COMPROBANTE MODAL                                                   */
/* ========================================================================== */

interface NewDocModalProps {
    onClose: () => void;
    perfilFiscal: any;
    configSifen: any;
    onSuccess: () => void;
}

interface LineItem {
    id: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    IVA_tipo: 10 | 5 | 0;
}

function NewDocumentModal({ onClose, perfilFiscal, configSifen, onSuccess }: NewDocModalProps) {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('factura_comercial');
    const [razonSocial, setRazonSocial] = useState('');
    const [ruc, setRuc] = useState('');
    const [condicionOperacion, setCondicionOperacion] = useState<'contado' | 'credito'>('contado');
    const [items, setItems] = useState<LineItem[]>([
        { id: '1', descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10 }
    ]);

    const [cargando, setCargando] = useState(false);

    const calcularTotales = () => {
        let iva10 = 0;
        let iva5 = 0;
        let exentas = 0;
        let total = 0;

        items.forEach(item => {
            const monto = item.cantidad * item.precio_unitario;
            total += monto;
            if (item.iva_tipo === 10) iva10 += Math.floor(monto / 11);
            else if (item.iva_tipo === 5) iva5 += Math.floor(monto / 21);
            else exentas += monto;
        });

        return {
            iva_10: iva10,
            iva_5: iva5,
            exentas,
            total
        };
    };

    const totales = calcularTotales();

    const agregarItem = () => {
        setItems([...items, { id: Date.now().toString(), descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10 }]);
    };

    const eliminarItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: string, field: keyof LineItem, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!razonSocial.trim() || !ruc.trim()) {
            alert("Complete la razon social y RUC del receptor.");
            return;
        }
        if (items.some(i => !i.descripcion.trim())) {
            alert("Todos los items deben tener una descripcion.");
            return;
        }

        setCargando(true);
        try {
            const numeroDocumento = generateNumeroDocumento(configSifen.establecimiento || '001', configSifen.punto_expedicion || '001', '');

            const { error } = await supabase.from('facturas_autoimpreso').insert({
                user_id: user.id,
                tipo_comprobante: tipoComprobante,
                numero_documento: numeroDocumento,
                timbrado: configSifen.timbrado,
                vencimiento_timbrado: configSifen.vencimiento_timbrado,
                fecha_emision: new Date().toISOString().split('T')[0],
                razon_social: razonSocial,
                ruc: ruc,
                condicion_operacion: condicionOperacion,
                monto_total: totales.total,
                iva_10: totales.iva_10,
                iva_5: totales.iva_5,
                exentas: totales.exentas,
                establecimiento: configSifen.establecimiento || '001',
                punto_expedicion: configSifen.punto_expedicion || '001',
                estado: 'emitido',
                notas: '',
            });

            if (error) throw error;

            onSuccess();
        } catch (err: any) {
            console.error(err);
            alert(`Error al emitir comprobante: ${err.message}`);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-3xl p-10 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900">Emitir {TIPO_COMPROBANTE_CONFIG[tipoComprobante].label}</h3>
                        <p className="text-gray-400 font-medium text-sm">Comprobante autoimpreso DNIT</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 mt-8 relative z-10">
                    {/* Tipo Comprobante */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Tipo de Comprobante</label>
                        <div className="grid grid-cols-4 gap-2">
                            {(Object.entries(TIPO_COMPROBANTE_CONFIG) as [TipoComprobante, typeof TIPO_COMPROBANTE_CONFIG[factura_comercial]]).map(([key, val]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTipoComprobante(key)}
                                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                                        tipoComprobante === key
                                            ? 'border-amber-500 bg-amber-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="text-lg mb-1">{val.icon}</div>
                                    <div className="text-[10px] font-black text-gray-700">{val.sigla}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Receptor */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Razon Social (Receptor)</label>
                            <input
                                type="text"
                                value={razonSocial}
                                onChange={(e) => setRazonSocial(e.target.value)}
                                placeholder="Ej: Juan Perez S.R.L."
                                className="w-full px-5 py-3 bg-gray-50 rounded-xl border-none font-bold text-gray-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">RUC Receptor</label>
                            <input
                                type="text"
                                value={ruc}
                                onChange={(e) => setRuc(e.target.value)}
                                placeholder="800XXXXX-X"
                                className="w-full px-5 py-3 bg-gray-50 rounded-xl border-none font-bold text-gray-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                    </div>

                    {/* Condicion */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Condicion de Operacion</label>
                        <div className="flex gap-2">
                            {(['contado', 'credito'] as const).map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCondicionOperacion(c)}
                                    className={`flex-1 p-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                                        condicionOperacion === c
                                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                                            : 'border-gray-200 text-gray-400'
                                    }`}
                                >
                                    {c === 'contado' ? 'Contado' : 'Credito'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Items / Conceptos</label>
                            <button type="button" onClick={agregarItem} className="flex items-center gap-1 text-amber-600 font-black text-[10px] uppercase tracking-widest hover:text-amber-700">
                                <Plus size={14} /> Agregar
                            </button>
                        </div>
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                                    <input
                                        type="text"
                                        value={item.descripcion}
                                        onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
                                        placeholder="Descripcion del item"
                                        className="flex-1 px-3 py-2 bg-white rounded-lg border-none font-medium text-sm outline-none"
                                    />
                                    <input type="number" value={item.cantidad} onChange={(e) => updateItem(item.id, 'cantidad', Number(e.target.value))} className="w-16 px-2 py-2 bg-white rounded-lg border-none font-medium text-sm outline-none text-center" />
                                    <input type="number" value={item.precio_unitario} onChange={(e) => updateItem(item.id, 'precio_unitario', Number(e.target.value))} className="w-24 px-2 py-2 bg-white rounded-lg border-none font-medium text-sm outline-none text-right" />
                                    <select
                                        value={item.iva_tipo}
                                        onChange={(e) => updateItem(item.id, 'iva_tipo', Number(e.target.value))}
                                        className="w-20 px-2 py-2 bg-white rounded-lg border-none font-medium text-sm outline-none"
                                    >
                                        <option value={10}>IVA 10%</option>
                                        <option value={5}>IVA 5%</option>
                                        <option value={0}>Exento</option>
                                    </select>
                                    <div className="text-right w-20 font-bold text-sm">
                                        {formatGs(item.cantidad * item.precio_unitario)}
                                    </div>
                                    {items.length > 1 && (
                                        <button type="button" onClick={() => eliminarItem(item.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:rose-500 rounded-lg">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totales */}
                    <div className="bg-slate-50 p-6 rounded-2xl space-y-2">
                        {totales.iva_10 > 0 && (
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-gray-500">IVA 10%</span>
                                <span>{formatGs(totales.iva_10)}</span>
                            </div>
                        )}
                        {totales.iva_5 > 0 && (
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-gray-500">IVA 5%</span>
                                <span>{formatGs(totales.iva_5)}</span>
                            </div>
                        )}
                        {totales.exentas > 0 && (
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-gray-500">Exentas</span>
                                <span>{formatGs(totales.exentas)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-black border-t border-gray-200 pt-2">
                            <span>TOTAL</span>
                            <span>{formatGs(totales.total)}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-amber-500 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {cargando ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                        {cargando ? 'Emitiendo...' : 'Emitir Comprobante'}
                    </button>
                </form>

                <div className="absolute top-0 right-0 w-56 h-56 bg-amber-50/30 rounded-bl-full -z-0" />
            </motion.div>
        </div>
    );
}
