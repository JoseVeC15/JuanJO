import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  Search, ArrowRightLeft, Loader2, Download 
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { formatGs } from '../data/sampleData';

interface BankMovement {
  fecha: string;
  descripcion: string;
  monto: number; // Positivo ingreso, Negativo egreso
  id_interno?: string;
}

export default function ConciliacionBancaria() {
    const { ingresos, facturasGastos, loading } = useSupabaseData();
    const [fileContents, setFileContents] = useState<BankMovement[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            // Simulamos un parser simple de CSV (Fecha, Descripcion, Monto)
            const rows = text.split('\n').slice(1); // Saltar cabecera
            const parsed = rows.map((row, index) => {
                const [fecha, desc, monto] = row.split(',');
                return {
                    fecha: fecha?.trim(),
                    descripcion: desc?.trim(),
                    monto: Number(monto?.trim()) || 0,
                    id_interno: `bank_${index}`
                };
            }).filter(m => m.fecha && m.monto !== 0);

            setFileContents(parsed);
            setIsProcessing(false);
        };
        reader.readAsText(file);
    };

    const suggestedMatches = useMemo(() => {
        return fileContents.map(m => {
            const isIngreso = m.monto > 0;
            const targetList = isIngreso ? ingresos : facturasGastos;
            
            // Buscar por monto exacto y fecha cercana (+/- 5 días)
            const matches = targetList.filter((item: any) => {
                const itemMonto = Number(item.monto);
                const absBankMonto = Math.abs(m.monto);
                const sameAmount = Math.abs(itemMonto - absBankMonto) < 100;
                
                const itemDate = new Date(item.fecha_emision || item.fecha_factura);
                const bankDate = new Date(m.fecha);
                const diffDays = Math.abs(itemDate.getTime() - bankDate.getTime()) / (1000 * 3600 * 24);
                
                return sameAmount && diffDays <= 7;
            });

            return {
                movement: m,
                suggestion: matches[0] || null,
                multiple: matches.length > 1
            };
        });
    }, [fileContents, ingresos, facturasGastos]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preparando motor de conciliación...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                        <ArrowRightLeft size={14} /> Auditoría Bancaria
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                        Conciliación de Extractos
                    </h1>
                    <p className="text-gray-500 font-medium italic">Cruza tus movimientos bancarios reales con tus facturas registradas.</p>
                </motion.div>

                <div className="flex items-center gap-3">
                    <label className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer">
                        <Upload size={18} /> Importar CSV
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </header>

            {!fileContents.length ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Movimientos Detectados ({fileContents.length})</h3>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar en extracto..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none w-64"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {suggestedMatches.filter(s => s.movement.descripcion.toLowerCase().includes(searchTerm.toLowerCase())).map((s, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={idx}
                                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6"
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wider">{s.movement.fecha}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${s.movement.monto > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {s.movement.monto > 0 ? 'CRÉDITO' : 'DÉBITO'}
                                            </span>
                                        </div>
                                        <p className="font-bold text-slate-900 line-clamp-1 uppercase text-sm">{s.movement.descripcion}</p>
                                        <p className="text-lg font-black tracking-tight">{formatGs(Math.abs(s.movement.monto))}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-200">
                                            <ArrowRightLeft size={14} />
                                        </div>
                                        
                                        {s.suggestion ? (
                                            <div className="flex-1 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4 min-w-[280px]">
                                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sugerencia Automática</p>
                                                    <p className="text-xs font-black text-emerald-900 uppercase">{(s.suggestion as any).numero_factura || (s.suggestion as any).proveedor || (s.suggestion as any).cliente}</p>
                                                    <p className="text-xs font-medium text-emerald-700/60 ">{formatGs((s.suggestion as any).monto)} • {(s.suggestion as any).fecha_emision || (s.suggestion as any).fecha_factura}</p>
                                                </div>
                                                <button className="ml-auto bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors">
                                                    Conciliar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 min-w-[280px] opacity-60">
                                                <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                                                    <AlertCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin Coincidencias</p>
                                                    <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Vincular Manualmente</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                            <h3 className="font-black text-lg mb-4">¿Cómo funciona?</h3>
                            <ul className="space-y-4 text-xs font-medium text-indigo-100/80">
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">1</div>
                                    <p>Sube tu extracto en formato CSV (puedes descargarlo desde tu Home Banking).</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">2</div>
                                    <p>El sistema buscará facturas o gastos que tengan el mismo monto y una fecha similar.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">3</div>
                                    <p>Al hacer click en "Conciliar", se marca el registro como verificado en banco.</p>
                                </li>
                            </ul>
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <button className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    <Download size={14} /> Formato de Ejemplo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-20 flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center">
                <FileText size={48} />
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-900">No hay extractos cargados</h3>
                <p className="text-slate-400 max-w-sm mx-auto mt-2 font-medium">Sube un archivo .csv para comenzar a auditar tus movimientos bancarios.</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-[10px] font-black uppercase tracking-widest max-w-xs">
                Compatible con Itaú, Continental y Atlas (Paraguay)
            </div>
        </div>
    );
}
