import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Plus, Trash2, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateCDC } from '../lib/sifen/cdc';

interface SifenInvoiceEmitterProps {
    onClose: () => void;
    onSuccess: () => void;
    fiscalProfile: any;
    sifenConfig: any;
}

export default function SifenInvoiceEmitter({ onClose, onSuccess, fiscalProfile, sifenConfig }: SifenInvoiceEmitterProps) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'status'>('form');
    const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

    const [customer, setCustomer] = useState({
        razon_social: '',
        ruc: '',
        direccion: ''
    });

    const [items, setItems] = useState([
        { id: '1', descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10 }
    ]);

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10 }]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
    };

    const handleEmit = async () => {
        setLoading(true);
        setStep('status');
        setStatus('pending');

        try {
            // 1. Generar CDC Localmente para auditoría
            const cdc = generateCDC({
                tipoDocumento: '01', // Factura Electrónica
                ruc: fiscalProfile.ruc,
                dvRuc: fiscalProfile.dv.toString(),
                establecimiento: sifenConfig.establecimiento,
                puntoExpedicion: sifenConfig.punto_expedicion,
                numero: '0000001', // TODO: Lógica de numeración secuencial
                tipoContribuyente: '2', // Jurídica por default
                fecha: new Date().toISOString().split('T')[0].replace(/-/g, ''),
                tipoEmision: '1',
                codigoSeguridad: Math.floor(Math.random() * 1000000000).toString()
            });

            // 2. Registrar en Base de Datos Local
            const { data: doc, error: docError } = await supabase
                .from('electronic_documents')
                .insert({
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    tipo_documento: 'factura',
                    numero_factura: `${sifenConfig.establecimiento}-${sifenConfig.punto_expedicion}-0000001`,
                    cdc,
                    estado_sifen: 'pendiente',
                    monto_total: calculateTotal(),
                    receptor_ruc: customer.ruc,
                    receptor_razon_social: customer.razon_social
                })
                .select()
                .single();

            if (docError) throw docError;

            // 3. Registrar Ítems
            await supabase.from('electronic_document_items').insert(
                items.map(it => ({
                    document_id: doc.id,
                    descripcion: it.descripcion,
                    cantidad: it.cantidad,
                    precio_unitario: it.precio_unitario,
                    iva_tipo: it.iva_tipo,
                    monto_total_item: it.cantidad * it.precio_unitario
                }))
            );

            // 4. Disparar SIFEN Engine (Edge Function)
            const { data: res, error: engineError } = await supabase.functions.invoke('sifen-engine', {
                body: { document_id: doc.id }
            });

            if (engineError || !res.success) throw new Error("Fallo en la firma o transmisión");

            setStatus('success');
            onSuccess();
        } catch (e) {
            console.error(e);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase rounded-lg">SIFEN V1.5</span>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Emisión Electrónica</h3>
                        </div>
                        <p className="text-slate-400 text-sm">Emisión de Factura con Validez Jurídica ante DNIT.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <AnimatePresence mode="wait">
                        {step === 'form' ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                                <section>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-indigo-500" /> Datos del Receptor
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <input 
                                            placeholder="Razón Social Cliente" 
                                            value={customer.razon_social}
                                            onChange={e => setCustomer({...customer, razon_social: e.target.value})}
                                            className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        />
                                        <input 
                                            placeholder="RUC Cliente (ej. 4444444-1)" 
                                            value={customer.ruc}
                                            onChange={e => setCustomer({...customer, ruc: e.target.value})}
                                            className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        />
                                        <input 
                                            placeholder="Dirección" 
                                            value={customer.direccion}
                                            onChange={e => setCustomer({...customer, direccion: e.target.value})}
                                            className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        />
                                    </div>
                                </section>

                                <section>
                                     <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <AlertCircle size={14} className="text-amber-500" /> Ítems y Conceptos
                                        </h4>
                                        <button onClick={addItem} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                            <Plus size={14} /> Añadir Ítem
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {items.map((item, idx) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="col-span-6">
                                                   <input 
                                                        placeholder="Descripción del producto o servicio" 
                                                        value={item.descripcion}
                                                        onChange={e => {
                                                            const newItems = [...items];
                                                            newItems[idx].descripcion = e.target.value;
                                                            setItems(newItems);
                                                        }}
                                                        className="w-full bg-transparent font-bold text-sm outline-none"
                                                   />
                                                </div>
                                                <div className="col-span-2">
                                                    <input 
                                                        type="number"
                                                        placeholder="Cant." 
                                                        value={item.cantidad}
                                                        onChange={e => {
                                                            const newItems = [...items];
                                                            newItems[idx].cantidad = Number(e.target.value);
                                                            setItems(newItems);
                                                        }}
                                                        className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 font-bold text-center text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <input 
                                                        type="number"
                                                        placeholder="Precio (₲)" 
                                                        value={item.precio_unitario}
                                                        onChange={e => {
                                                            const newItems = [...items];
                                                            newItems[idx].precio_unitario = Number(e.target.value);
                                                            setItems(newItems);
                                                        }}
                                                        className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 font-bold text-right text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <button onClick={() => removeItem(item.id)} className="text-red-300 hover:text-red-500"><Trash2 size={18} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                                {status === 'pending' && (
                                    <>
                                        <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6" />
                                        <h3 className="text-2xl font-black text-slate-900">Transmitiendo a SIFEN...</h3>
                                        <p className="text-slate-400 mt-2">Firmando digitalmente y solicitando CDC.</p>
                                    </>
                                )}
                                {status === 'success' && (
                                    <>
                                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20">
                                            <CheckCircle size={40} />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 text-emerald-600">¡Documento Aprobado!</h3>
                                        <p className="text-slate-400 mt-2">La factura electrónica ha sido autorizada por la DNIT.</p>
                                        <button onClick={onClose} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Cerrar</button>
                                    </>
                                )}
                                {status === 'error' && (
                                    <>
                                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                                            <AlertCircle size={40} />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900">Error en Transmisión</h3>
                                        <p className="text-red-500 mt-2">No se pudo autorizar el documento. Verifica tu certificado o CSC.</p>
                                        <button onClick={() => setStep('form')} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Reintentar</button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {step === 'form' && (
                    <div className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Total Bruto</p>
                            <p className="text-3xl font-black text-slate-900">₲ {calculateTotal().toLocaleString()}</p>
                        </div>
                        <button 
                            onClick={handleEmit} 
                            disabled={items.length === 0 || !customer.ruc}
                            className="bg-emerald-500 text-slate-900 px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10 hover:scale-105 transition-all flex items-center gap-4 disabled:opacity-50"
                        >
                            Emitir Documento <Send size={20} />
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
