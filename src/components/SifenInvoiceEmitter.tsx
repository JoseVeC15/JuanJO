import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Plus, Trash2, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PropiedadesEmisorSifen {
    onClose: () => void;
    onSuccess: () => void;
    sifenConfig: any;
}

export default function SifenInvoiceEmitter({ onClose: alCerrar, onSuccess: alExito, sifenConfig: configSifen }: PropiedadesEmisorSifen) {
    const [cargando, setCargando] = useState(false);
    const [paso, setPaso] = useState<'formulario' | 'estado'>('formulario');
    const [estadoEmision, setEstadoEmision] = useState<'pendiente' | 'exito' | 'error'>('pendiente');

    const [cliente, setCliente] = useState({
        razon_social: '',
        ruc: '',
        direccion: ''
    });

    const [clientesSugeridos, setClientesSugeridos] = useState<any[]>([]);

    useEffect(() => {
        if (cliente.ruc.length > 2 || cliente.razon_social.length > 2) {
            buscarClientesLocal();
        }
    }, [cliente.ruc, cliente.razon_social]);

    const buscarClientesLocal = async () => {
        const { data } = await supabase
            .from('clientes')
            .select('*')
            .or(`razon_social.ilike.%${cliente.razon_social}%,ruc.ilike.%${cliente.ruc}%`)
            .limit(5);
        setClientesSugeridos(data || []);
    };

    const [productos, setProductos] = useState([
        { id: '1', descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10 }
    ]);

    const agregarProducto = () => {
        setProductos([...productos, { id: Date.now().toString(), descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10 }]);
    };

    const eliminarProducto = (id: string) => {
        setProductos(productos.filter(p => p.id !== id));
    };

    const calcularTotal = () => {
        return productos.reduce((suma, p) => suma + (p.cantidad * p.precio_unitario), 0);
    };

    const procesarEmision = async () => {
        setCargando(true);
        setPaso('estado');
        setEstadoEmision('pendiente');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");

            // 1. Generar Código de Seguridad y Numeración
            const codigoSeguridad = Math.floor(100000000 + Math.random() * 900000000).toString();
            const nroFactura = Math.floor(Math.random() * 1000000); // En producción usar secuencia DB

            // 2. Registrar en Base de Datos Local (Auditoría interna)
            const { data: factura, error: errorFactura } = await supabase
                .from('documentos_electronicos')
                .insert({
                    user_id: user.id,
                    tipo_documento: 'factura',
                    nro_documento: nroFactura,
                    punto_establecimiento: configSifen.establecimiento || '001',
                    punto_expedicion: configSifen.punto_expedicion || '001',
                    fecha_emision: new Date().toISOString().split('T')[0],
                    monto_total: calcularTotal(),
                    receptor_ruc: cliente.ruc,
                    receptor_razon_social: cliente.razon_social,
                    codigo_seguridad: codigoSeguridad,
                    estado_sifen: 'pendiente'
                })
                .select()
                .single();

            if (errorFactura) throw errorFactura;

            // 3. Registrar Ítems de la Factura
            const { error: errorItems } = await supabase.from('documentos_items').insert(
                productos.map(p => ({
                    documento_id: factura.id,
                    descripcion: p.descripcion,
                    cantidad: p.cantidad,
                    precio_unitario: p.precio_unitario,
                    iva_tipo: p.iva_tipo.toString(),
                    monto_total_item: p.cantidad * p.precio_unitario
                }))
            );

            if (errorItems) throw errorItems;

            // 4. Disparar Motor SIFEN v2.0 (Edge Function)
            const { data: respuesta, error: errorMotor } = await supabase.functions.invoke('sifen-engine', {
                body: { documento_id: factura.id, user_id: user.id }
            });

            if (errorMotor || !respuesta.success) {
                console.error("Error Motor SIFEN:", errorMotor || respuesta);
                throw new Error("Fallo en la firma o transmisión oficial");
            }

            setEstadoEmision('exito');
            alExito();
        } catch (e: any) {
            console.error("Error en proceso SIFEN:", e);
            setEstadoEmision('error');
        } finally {
            setCargando(false);
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
                    <button onClick={alCerrar} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <AnimatePresence mode="wait">
                        {paso === 'formulario' ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                                <section>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-indigo-500" /> Datos del Receptor
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
                                        <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                                            <input 
                                                placeholder="Razón Social Cliente" 
                                                value={cliente.razon_social}
                                                onChange={e => setCliente({...cliente, razon_social: e.target.value})}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            />
                                            {clientesSugeridos.length > 0 && (
                                                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-[130] overflow-hidden">
                                                    {clientesSugeridos.map(c => (
                                                        <button 
                                                            key={c.id}
                                                            onClick={() => {
                                                                setCliente({ razon_social: c.razon_social, ruc: c.ruc, direccion: c.direccion || '' });
                                                                setClientesSugeridos([]);
                                                            }}
                                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center gap-3"
                                                        >
                                                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-[10px]">{c.razon_social.charAt(0)}</div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-700 uppercase">{c.razon_social}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">RUC: {c.ruc}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <input 
                                            placeholder="RUC Cliente (ej. 4444444-1)" 
                                            value={cliente.ruc}
                                            onChange={e => setCliente({...cliente, ruc: e.target.value})}
                                            className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        />
                                        <input 
                                            placeholder="Dirección Fiscal" 
                                            value={cliente.direccion}
                                            onChange={e => setCliente({...cliente, direccion: e.target.value})}
                                            className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        />
                                    </div>
                                </section>

                                <section>
                                     <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <AlertCircle size={14} className="text-amber-500" /> Ítems y Conceptos de Facturación
                                        </h4>
                                        <button onClick={agregarProducto} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                            <Plus size={14} /> Añadir Ítem
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {productos.map((producto, indice) => (
                                            <div key={producto.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                                <div className="col-span-6">
                                                   <input 
                                                        placeholder="Descripción del producto o servicio" 
                                                        value={producto.descripcion}
                                                        onChange={e => {
                                                            const nuevosProductos = [...productos];
                                                            nuevosProductos[indice].descripcion = e.target.value;
                                                            setProductos(nuevosProductos);
                                                        }}
                                                        className="w-full bg-transparent font-bold text-sm outline-none"
                                                   />
                                                </div>
                                                <div className="col-span-2">
                                                    <input 
                                                        type="number"
                                                        placeholder="Cant." 
                                                        value={producto.cantidad}
                                                        onChange={e => {
                                                            const nuevosProductos = [...productos];
                                                            nuevosProductos[indice].cantidad = Number(e.target.value);
                                                            setProductos(nuevosProductos);
                                                        }}
                                                        className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 font-bold text-center text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <input 
                                                        type="number"
                                                        placeholder="Precio (₲)" 
                                                        value={producto.precio_unitario}
                                                        onChange={e => {
                                                            const nuevosProductos = [...productos];
                                                            nuevosProductos[indice].precio_unitario = Number(e.target.value);
                                                            setProductos(nuevosProductos);
                                                        }}
                                                        className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 font-bold text-right text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <button onClick={() => eliminarProducto(producto.id)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                                {estadoEmision === 'pendiente' && (
                                    <>
                                        <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6" />
                                        <h3 className="text-2xl font-black text-slate-900">Transmitiendo a SIFEN...</h3>
                                        <p className="text-slate-400 mt-2">Firmando digitalmente y solicitando CDC oficial.</p>
                                    </>
                                )}
                                {estadoEmision === 'exito' && (
                                    <>
                                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20">
                                            <CheckCircle size={40} />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 text-emerald-600">¡Documento Aprobado!</h3>
                                        <p className="text-slate-400 mt-2">La factura electrónica ha sido autorizada por la DNIT con éxito.</p>
                                        <button onClick={alCerrar} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Cerrar Panel</button>
                                    </>
                                )}
                                {estadoEmision === 'error' && (
                                    <>
                                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                                            <AlertCircle size={40} />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900">Error en Transmisión Fiscal</h3>
                                        <p className="text-red-500 mt-2">No se pudo autorizar el documento. Verifica tu certificado o IdCSC.</p>
                                        <button onClick={() => setPaso('formulario')} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Volver a Intentar</button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {paso === 'formulario' && (
                    <div className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Total a Facturar</p>
                            <p className="text-3xl font-black text-slate-900">₲ {calcularTotal().toLocaleString()}</p>
                        </div>
                        <button 
                            onClick={procesarEmision} 
                            disabled={productos.length === 0 || !cliente.ruc || cargando}
                            className="bg-emerald-500 text-slate-900 px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10 hover:scale-105 transition-all flex items-center gap-4 disabled:opacity-50"
                        >
                            {cargando ? 'Procesando...' : 'Emitir Factura Legal'} <Send size={20} />
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
