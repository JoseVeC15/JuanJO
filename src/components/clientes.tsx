import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Trash2, Search, Loader2, 
    UserPlus, Mail, Phone, MapPin, X, Edit2,
    CheckCircle, Info, TrendingUp, CreditCard, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import RucBuscador from './RucBuscador';

export default function Clientes({ hideHeader = false, forceOpenAddModal = false, onModalOpenHandled }: any) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { clientes, loading: loadingData } = useSupabaseData(); // useSupabaseData already provides clientes with stats
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [nuevoCliente, setNuevoCliente] = useState({
        ruc: '',
        razon_social: '',
        direccion: '',
        email: '',
        telefono: ''
    });

    useEffect(() => {
        if (forceOpenAddModal) {
            setShowAddModal(true);
            if (onModalOpenHandled) onModalOpenHandled();
        }
    }, [forceOpenAddModal, onModalOpenHandled]);

    const handleEditCliente = (cliente: any) => {
        setEditingId(cliente.id);
        setNuevoCliente({
            ruc: cliente.ruc,
            razon_social: cliente.razon_social,
            direccion: cliente.direccion || '',
            email: cliente.email || '',
            telefono: cliente.telefono || ''
        });
        setShowAddModal(true);
    };

    const handleAddFromRuc = (data: any) => {
        setEditingId(null);
        setNuevoCliente({
            ruc: data.ruc,
            razon_social: data.razon_social,
            direccion: data.direccion || '',
            email: '',
            telefono: ''
        });
        setShowAddModal(true);
    };

    const guardarCliente = async () => {
        if (!user || !nuevoCliente.ruc || !nuevoCliente.razon_social) return;
        
        try {
            setSaving(true);
            
            if (editingId) {
                const { error } = await supabase
                    .from('clientes')
                    .update(nuevoCliente)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('clientes')
                    .insert({
                        user_id: user.id,
                        ...nuevoCliente
                    });
                if (error) throw error;
            }
            
            setShowAddModal(false);
            setEditingId(null);
            setNuevoCliente({ ruc: '', razon_social: '', direccion: '', email: '', telefono: '' });
        } catch (error: any) {
            alert("Error al procesar cliente: " + (error.message || "RUC duplicado"));
        } finally {
            setSaving(false);
        }
    };

    const eliminarCliente = async (id: string) => {
        if (!confirm("¿Eliminar este cliente de tu base de datos?")) return;
        
        try {
            const { error } = await supabase.from('clientes').delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting cliente:', error);
        }
    };

    const filteredClientes = (clientes || []).filter((c: any) => 
        c.razon_social.toLowerCase().includes(search.toLowerCase()) || 
        c.ruc.includes(search)
    );

    if (loadingData && clientes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="text-indigo-500 animate-spin" size={40} />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando CRM...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {!hideHeader && (
                <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                            <Users size={14} /> Inteligencia de Cartera
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                            CRM de Clientes
                        </h1>
                        <p className="text-gray-500 font-medium italic">Control de facturación y proyectos por cuenta.</p>
                    </motion.div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                            <UserPlus size={18} /> Nuevo Cliente
                        </button>
                    </div>
                </header>
            )}

            {/* Client Stats Summary */}
            {!hideHeader && filteredClientes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SummaryCard 
                        label="Clientes Activos" 
                        value={filteredClientes.length} 
                        icon={<Users size={20} />} 
                        color="bg-white border-slate-100"
                    />
                    <SummaryCard 
                        label="Facturación Total" 
                        value={new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(
                            filteredClientes.reduce((acc, curr: any) => acc + (curr.total_facturado || 0), 0)
                        )} 
                        icon={<TrendingUp size={20} />} 
                        color="bg-emerald-50 border-emerald-100 text-emerald-700"
                    />
                    <SummaryCard 
                        label="Cuentas por Cobrar" 
                        value={new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(
                            filteredClientes.reduce((acc, curr: any) => acc + (curr.deuda_pendiente || 0), 0)
                        )} 
                        icon={<CreditCard size={20} />} 
                        color="bg-rose-50 border-rose-100 text-rose-700"
                    />
                </div>
            )}

            {/* RUC Search Engine */}
            <RucBuscador onSelect={handleAddFromRuc} />

            {/* List & Search */}
            <div className="space-y-4">
                <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm flex flex-col md:flex-row gap-5">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar en mi base de datos por RUC o Razón Social..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-[1.25rem] border-none focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none font-bold text-gray-800 placeholder:text-gray-300 shadow-inner"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClientes.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                           <Info size={40} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-slate-400 font-bold">No se encontraron clientes guardados.</p>
                           <p className="text-slate-300 text-sm mt-1">Usa la herramienta de búsqueda de RUC arriba para agregar nuevos.</p>
                        </div>
                    ) : (
                        filteredClientes.map((c: any) => (
                            <motion.div 
                                layout
                                key={c.id} 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative border-b-4 border-b-transparent hover:border-b-indigo-500 flex flex-col justify-between"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
                                
                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-slate-200">
                                            {c.razon_social.charAt(0)}
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleEditCliente(c)}
                                                className="p-3 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Editar Cliente"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => eliminarCliente(c.id)}
                                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Eliminar Cliente"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="min-h-[60px]">
                                        <h3 className="font-black text-slate-900 text-xl tracking-tight leading-7 line-clamp-2 group-hover:text-indigo-600 transition-colors uppercase">{c.razon_social}</h3>
                                        <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1 bg-indigo-50 inline-block px-2 py-0.5 rounded-lg border border-indigo-100">RUC: {c.ruc}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pb-4">
                                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Facturado</p>
                                        <p className="font-black text-slate-900 truncate">
                                          {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(c.total_facturado || 0)}
                                        </p>
                                      </div>
                                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group/btn"
                                           onClick={() => navigate('/servicios', { state: { search: c.razon_social } })}>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover/btn:text-emerald-500">Servicios / SVC</p>
                                        <p className="font-black text-slate-900 flex items-center justify-center gap-1.5"><ClipboardList size={12} className="text-slate-400 group-hover/btn:text-emerald-500" /> Gestionar</p>
                                      </div>
                                    </div>

                                    {c.deuda_pendiente > 0 && (
                                      <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center justify-between border border-rose-100 shadow-sm animate-pulse">
                                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} /> Deuda</span>
                                        <span className="font-black">
                                          {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(c.deuda_pendiente)}
                                        </span>
                                      </div>
                                    )}

                                    <div className="space-y-3 pt-2">
                                        {c.direccion && (
                                            <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                                                <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><MapPin size={14} /></div>
                                                <span className="truncate">{c.direccion}</span>
                                            </div>
                                        )}
                                        {c.email && (
                                            <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                                                <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Mail size={14} /></div>
                                                <span className="truncate">{c.email}</span>
                                            </div>
                                        )}
                                        {c.telefono && (
                                            <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                                                <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                                                <span>{c.telefono}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] w-full max-w-xl p-5 lg:p-10 space-y-6 lg:space-y-8 shadow-2xl relative overflow-hidden max-h-[95vh] overflow-y-auto flex flex-col"
                        >
                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900">Registrar Cliente</h3>
                                    <p className="text-gray-400 font-medium text-sm">Añade este receptor a tu base de datos privada.</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600"><X size={24} /></button>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nombre / Razón Social</label>
                                        <input 
                                            value={nuevoCliente.razon_social}
                                            onChange={e => setNuevoCliente({...nuevoCliente, razon_social: e.target.value})}
                                            className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">RUC</label>
                                        <input 
                                            value={nuevoCliente.ruc}
                                            onChange={e => setNuevoCliente({...nuevoCliente, ruc: e.target.value})}
                                            className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Teléfono</label>
                                        <input 
                                            value={nuevoCliente.telefono}
                                            onChange={e => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                                            className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Dirección</label>
                                        <input 
                                            value={nuevoCliente.direccion}
                                            onChange={e => setNuevoCliente({...nuevoCliente, direccion: e.target.value})}
                                            className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Email</label>
                                        <input 
                                            value={nuevoCliente.email}
                                            onChange={e => setNuevoCliente({...nuevoCliente, email: e.target.value})}
                                            className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={guardarCliente}
                                disabled={saving}
                                className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                {saving ? 'Guardando...' : 'Guardar en Directorio'}
                            </button>
                            
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-bl-full -z-0" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SummaryCard({ label, value, icon, color }: any) {
    return (
        <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all hover:shadow-lg ${color}`}>
            <div className="flex items-center gap-3 opacity-60 mb-3">
                {icon}
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
            </div>
            <p className="text-3xl font-black tracking-tight">{value}</p>
        </div>
    );
}
