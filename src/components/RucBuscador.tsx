import { useState } from 'react';
import { Search, Loader2, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = "https://turuc.com.py/api/v1";

interface RucData {
    ruc: string;
    razon_social: string;
    estado?: string;
    ruc_anterior?: string;
    dv?: string;
    tipo_contribuyente?: string;
}

interface RucBuscadorProps {
    onSelect?: (data: RucData) => void;
}

export default function RucBuscador({ onSelect }: RucBuscadorProps) {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [results, setResults] = useState<RucData[]>([]);
    const [updating, setUpdating] = useState<string | null>(null);

    const buscarRuc = async () => {
        if (query.trim().length < 2) {
            setMsg("Escribe al menos 2 caracteres.");
            return;
        }

        setLoading(true);
        setMsg("Buscando en servicios tributarios...");
        setResults([]);

        try {
            // Usamos un proxy CORS (AllOrigins) para evitar bloqueos del navegador
            const targetUrl = `${API_URL}/search/${encodeURIComponent(query)}`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
            
            const res = await fetch(proxyUrl);
            const proxyData = await res.json();
            const data = JSON.parse(proxyData.contents);

            // El formato de TuRuc puede variar, ajustamos extracción
            if (!data || !Array.isArray(data)) {
                // Si no es un array, tal vez sea un solo resultado o tenga éxito/data
                const searchResults = data?.data || (data?.ruc ? [data] : []);
                if (searchResults.length === 0) {
                    setMsg("No se encontraron resultados.");
                    return;
                }
                setResults(searchResults);
                setMsg(`Resultados: ${searchResults.length}`);
            } else {
                if (data.length === 0) {
                    setMsg("Contribuyente no encontrado.");
                    return;
                }
                setResults(data);
                setMsg(`Resultados: ${data.length}`);
            }
        } catch (e) {
            console.error("RUC Search Error:", e);
            setMsg("Servicio de consulta temporalmente saturado. Reintente en unos segundos.");
        } finally {
            setLoading(false);
        }
    };

    const actualizarRuc = async (ruc: string) => {
        if (!ruc) return;
        setUpdating(ruc);
        setMsg(`Obteniendo detalles de ${ruc}...`);

        try {
            const targetUrl = `${API_URL}/ruc/${encodeURIComponent(ruc)}`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
            
            const res = await fetch(proxyUrl);
            const proxyData = await res.json();
            const d = JSON.parse(proxyData.contents);

            if (!d || !d.ruc) {
                setMsg("No se pudieron obtener más detalles.");
                return;
            }

            const oblig = d.tipo_contribuyente ? ` | Tipo: ${d.tipo_contribuyente}` : "";
            setMsg(`RUC ${d.ruc} | Estado: ${d.estado || "Buscando..."}${oblig}`);
            
            // Actualizar el resultado en la lista si existe
            setResults(prev => prev.map(item => item.ruc === ruc ? { ...item, ...d } : item));
        } catch {
            setMsg("Error al conectar con la base de datos de la SET.");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consulta de RUC (SET PY)</label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input 
                            type="search" 
                            placeholder="Ingrese RUC, nombre o razon social..." 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && buscarRuc()}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
                        />
                    </div>
                </div>
                <button 
                    onClick={buscarRuc}
                    disabled={loading}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Buscar
                </button>
            </div>

            <AnimatePresence>
                {msg && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"
                    >
                        {msg.includes("Error") ? <AlertCircle size={14} className="text-red-500" /> : <Loader2 size={14} className="text-emerald-500 animate-spin" />}
                        {msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="overflow-x-auto rounded-2xl border border-slate-50">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">RUC</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Razón Social</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {results.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400 font-medium italic italic">
                                    {loading ? 'Consultando servicios tributarios...' : 'Ingrese datos para iniciar búsqueda'}
                                </td>
                            </tr>
                        ) : results.map((i) => (
                            <tr key={i.ruc} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4 text-xs font-black text-slate-700">{i.ruc}</td>
                                <td className="p-4 text-xs font-bold text-slate-600 uppercase">{i.razon_social}</td>
                                <td className="p-4 text-center">
                                    <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${i.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {i.estado || 'S/D'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => actualizarRuc(i.ruc)}
                                            disabled={updating === i.ruc}
                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                            title="Actualizar datos desde SET"
                                        >
                                            <RefreshCw size={14} className={updating === i.ruc ? "animate-spin" : ""} />
                                        </button>
                                        {onSelect && (
                                            <button 
                                                onClick={() => onSelect(i)}
                                                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                title="Usar estos datos"
                                            >
                                                <UserPlus size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
