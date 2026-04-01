import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Trash2, Search, Loader2, 
    UserPlus, Mail, Phone, MapPin, X, 
    CheckCircle, Info 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import RucBuscador from './RucBuscador';

interface Cliente {
    id: string;
    ruc: string;
    razon_social: string;
    direccion?: string;
    email?: string;
    telefono?: string;
    created_at: string;
}

export default function Clientes() {
    const { user } = useAuth();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [nuevoCliente, setNuevoCliente] = useState({
        ruc: '',
        razon_social: '',
        direccion: '',
        email: '',
        telefono: ''
    });

    useEffect(() => {
        if (user) fetchClientes();
    }, [user]);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('razon_social', { ascending: true });
            
            if (error) throw error;
            setClientes(data || []);
        } catch (error) {
            console.error('Error fetching clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFromRuc = (data: any) => {
        setNuevoCliente({
            ...nuevoCliente,
            ruc: data.ruc,
            razon_social: data.razon_social,
            direccion: data.direccion || ''
        });
        setShowAddModal(true);
    };

    const guardarCliente = async () => {
        if (!user || !nuevoCliente.ruc || !nuevoCliente.razon_social) return;
        
        try {
            setSaving(true);
            const { error } = await supabase
                .from('clientes')
                .insert({
                    user_id: user.id,
                    ...nuevoCliente
                });
            
            if (error) throw error;
            
            await fetchClientes();
            setShowAddModal(false);
            setNuevoCliente({ ruc: '', razon_social: '', direccion: '', email: '', telefono: '' });
        } catch (error: any) {
            alert("Error al guardar cliente: " + (error.message || "RUC duplicado"));
        } finally {
            setSaving(false);
        }
    };

    const eliminarCliente = async (id: string) => {
        if (!confirm("¿Eliminar este cliente de tu base de datos?")) return;
        
        try {
            const { error } = await supabase.from('clientes').delete().eq('id', id);
            if (error) throw error;
            fetchClientes();
        } catch (error) {
            console.error('Error deleting cliente:', error);
        }
    };

    const filteredClientes = clientes.filter(c => 
        c.razon_social.toLowerCase().includes(search.toLowerCase()) || 
        c.ruc.includes(search)
    );

    if (loading && clientes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="text-emerald-500 animate-spin" size={40} />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando Directorio...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                        <Users size={14} /> Gestión de Cartera
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                        Directorio de Clientes
                    </h1>
                    <p className="text-gray-500 font-medium italic">Base de datos privada para facturación recurrente.</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClientes.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                           <Info size={40} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-slate-400 font-bold">No se encontraron clientes guardados.</p>
                           <p className="text-slate-300 text-sm mt-1">Usa la herramienta de búsqueda de RUC arriba para agregar nuevos.</p>
                        </div>
                    ) : (
                        filteredClientes.map((c) => (
                            <motion.div 
                                layout
                                key={c.id} 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50/50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
                                
                                <div className="relative z-10 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
                                            {c.razon_social.charAt(0)}
                                        </div>
                                        <button 
                                            onClick={() => eliminarCliente(c.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="font-black text-slate-900 truncate uppercase tracking-tight">{c.razon_social}</h3>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">RUC: {c.ruc}</p>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        {c.direccion && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <MapPin size={12} className="shrink-0" /> {c.direccion}
                                            </div>
                                        )}
                                        {c.email && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <Mail size={12} className="shrink-0" /> {c.email}
                                            </div>
                                        )}
                                        {c.telefono && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <Phone size={12} className="shrink-0" /> {c.telefono}
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
                            className="bg-white rounded-[2.5rem] w-full max-w-xl p-10 space-y-8 shadow-2xl relative overflow-hidden"
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
