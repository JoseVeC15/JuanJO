import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Plus, Trash2, ShieldCheck, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
    validarFacturaElectronicaPayload,
    TIPO_DOCUMENTO_SIFEN,
    TIPO_DOCUMENTO_LABELS,
    TASAS_IVA,
    CONDICIONES_VENTA,
    type CondicionVenta,
} from '../lib/sifen/paraguayCompliance';

interface PropiedadesEmisorSifen {
    onClose: () => void;
    onSuccess: () => void;
    sifenConfig: any;
}

export default function SifenInvoiceEmitter({ onClose: alCerrar, onSuccess: alExito, sifenConfig: configSifen }: PropiedadesEmisorSifen) {
    const [cargando, setCargando] = useState(false);
    const [paso, setPaso] = useState<'formulario' | 'estado'>('formulario');
    const [estadoEmision, setEstadoEmision] = useState<'pendiente' | 'exito' | 'error'>('pendiente');
    const [errorDetalle, setErrorDetalle] = useState('');

    const [tipoDocumento, setTipoDocumento] = useState<string>(TIPO_DOCUMENTO_SIFEN.FACTURA_ELECTRONICA);

    const [cliente, setCliente] = useState({
        id: '',
        razon_social: '',
        ruc: '',
        direccion: '',
        email: ''
    });

    const [buscandoCliente, setBuscandoCliente] = useState(false);

    const [condicionOperacion, setCondicionOperacion] = useState<CondicionVenta>('contado');

    const [clientesSugeridos, setClientesSugeridos] = useState<any[]>([]);

    useEffect(() => {
        if (cliente.ruc.length > 2 || cliente.razon_social.length > 2) {
            buscarClientesLocal();
        }
    }, [cliente.ruc, cliente.razon_social]);

    const buscarClientesLocal = async (term = '') => {
        setBuscandoCliente(true);
        let query = supabase.from('clientes').select('*').limit(5);
        
        if (term.length > 0) {
            query = query.or(`razon_social.ilike.%${term}%,ruc.ilike.%${term}%`);
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data } = await query;
        setClientesSugeridos(data || []);
        setBuscandoCliente(false);
    };

    const [productos, setProductos] = useState<{ id: string; descripcion: string; cantidad: number; precio_unitario: number; iva_tipo: number }[]>([
        { id: '1', descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: TASAS_IVA.GENERAL }
    ]);

    const [itemsSugeridos, setItemsSugeridos] = useState<{ [key: string]: any[] }>({});

    const agregarProducto = () => {
        setProductos([...productos, { id: Date.now().toString(), descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: TASAS_IVA.GENERAL }]);
    };

    const eliminarProducto = (id: string) => {
        setProductos(productos.filter(p => p.id !== id));
        const nuevasSugerencias = { ...itemsSugeridos };
        delete nuevasSugerencias[id];
        setItemsSugeridos(nuevasSugerencias);
    };

    const buscarItemsCatalogo = async (texto: string, productoId: string) => {
        if (texto.length < 2) {
            setItemsSugeridos(prev => ({ ...prev, [productoId]: [] }));
            return;
        }
        const { data } = await supabase
            .from('items_catalogo')
            .select('*')
            .ilike('nombre', `%${texto}%`)
            .limit(5);
        
        setItemsSugeridos(prev => ({ ...prev, [productoId]: data || [] }));
    };

    const calcularTotalesPorIva = () => {
        return productos.reduce((acc, p) => {
            const monto = p.cantidad * p.precio_unitario;
            if (p.iva_tipo === TASAS_IVA.GENERAL) acc.iva10 += Math.round(monto / 11);
            if (p.iva_tipo === TASAS_IVA.DIFERENCIAL) acc.iva5 += Math.round(monto / 21);
            acc.total += monto;
            return acc;
        }, { iva10: 0, iva5: 0, total: 0 });
    };

    const calcularTotal = () => calcularTotalesPorIva().total;

    const getBusinessErrorMessage = (errorCode?: string) => {
        const code = errorCode || 'UNEXPECTED';
        const mensajes: Record<string, string> = {
            CONFIG_INCOMPLETA: 'Configuración SIFEN incompleta. Verifica perfil fiscal, CSC e ID CSC en Configuración.',
            CERTIFICADO_AUSENTE: 'No existe certificado digital cargado. Sube tu .p12/.pfx en Configuración.',
            CERTIFICADO_VENCIDO: 'El certificado digital está vencido. Debes renovarlo para continuar.',
            RUC_INVALIDO: 'El RUC del receptor tiene formato inválido. Corrígelo e intenta nuevamente.',
            DOCUMENTO_NO_ENCONTRADO: 'No se encontró el documento generado. Vuelve a emitir para regenerarlo.',
            BAD_REQUEST: 'Solicitud inválida. Revisa los datos de emisión.',
            SIFEN_TIMEOUT: 'El servicio SIFEN tardó demasiado en responder. Intenta de nuevo en unos segundos.',
            UNEXPECTED: 'Error inesperado en la emisión. Si persiste, contacta soporte.',
        };
        return mensajes[code] || mensajes.UNEXPECTED;
    };

    const invokeSifenWithRetry = async (facturaId: string, userId: string, maxAttempts = 3) => {
        let attempt = 0;
        let lastError: any = null;

        while (attempt < maxAttempts) {
            attempt += 1;

            const { data: respuesta, error: errorMotor } = await supabase.functions.invoke('sifen-engine', {
                body: { documento_id: facturaId, user_id: userId }
            });

            if (!errorMotor && respuesta?.success) {
                return respuesta;
            }

            const errorCode = respuesta?.error_code || (errorMotor ? 'UNEXPECTED' : 'UNEXPECTED');
            lastError = { errorCode, response: respuesta, raw: errorMotor };

            const retryable = ['SIFEN_TIMEOUT', 'UNEXPECTED'].includes(errorCode);
            if (!retryable || attempt >= maxAttempts) break;

            await new Promise(resolve => setTimeout(resolve, 700 * attempt));
        }

        throw lastError;
    };

    const procesarEmision = async () => {
        const validacionFiscal = validarFacturaElectronicaPayload({
            receptor_razon_social: cliente.razon_social,
            receptor_ruc: cliente.ruc,
            receptor_direccion: cliente.direccion,
            receptor_email: cliente.email,
            condicion_operacion: condicionOperacion,
            tipo_documento: tipoDocumento,
            items: productos,
        });

        if (!validacionFiscal.ok) {
            setPaso('estado');
            setEstadoEmision('error');
            setErrorDetalle(validacionFiscal.errors[0]);
            return;
        }

        setCargando(true);
        setPaso('estado');
        setEstadoEmision('pendiente');
        setErrorDetalle('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");

            // 1. Generar numeracion secuencial fiscal desde DB
            const establecimiento = configSifen.establecimiento || '001';
            const puntoExpedicion = configSifen.punto_expedicion || '001';
            const { data: numeroFactura, error: errorNumero } = await supabase.rpc('obtener_siguiente_numero_factura', {
                p_tipo_documento: tipoDocumento,
                p_establecimiento: establecimiento,
                p_punto_expedicion: puntoExpedicion,
            });

            if (errorNumero || !numeroFactura) {
                throw errorNumero || new Error('No fue posible obtener numeracion fiscal.');
            }

            // 2. Registrar en Base de Datos Local (Auditoría interna)
            const { data: factura, error: errorFactura } = await supabase
                .from('documentos_electronicos')
                .insert({
                    user_id: user.id,
                    tipo_documento: tipoDocumento,
                    numero_factura: numeroFactura,
                    fecha_emision: new Date().toISOString().split('T')[0],
                    monto_total: calcularTotal(),
                    condicion_operacion: condicionOperacion,
                    receptor_ruc: cliente.ruc.trim(),
                    receptor_razon_social: cliente.razon_social.trim(),
                    receptor_direccion: cliente.direccion.trim(),
                    receptor_email: cliente.email.trim(),
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
                    iva_tipo: p.iva_tipo,
                    monto_total_item: p.cantidad * p.precio_unitario
                }))
            );

            if (errorItems) throw errorItems;

            // 4. Disparar Motor SIFEN v2.0 (Edge Function) con reintentos controlados
            await invokeSifenWithRetry(factura.id, user.id);

            setEstadoEmision('exito');
            alExito();
        } catch (e: any) {
            console.error("Error en proceso SIFEN:", e);
            setErrorDetalle(getBusinessErrorMessage(e?.errorCode || e?.response?.error_code));
            setEstadoEmision('error');
        } finally {
            setCargando(false);
        }
    };

    const esInvalido = 
        !cliente.razon_social?.trim() || 
        !cliente.ruc?.trim() || 
        !cliente.email?.trim() || 
        !cliente.direccion?.trim() ||
        productos.length === 0 ||
        productos.some(p => !p.descripcion?.trim() || p.cantidad <= 0 || p.precio_unitario <= 0);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] lg:max-h-[90vh]"
            >
                <div className="p-4 lg:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase rounded-lg">SIFEN V1.5</span>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Emisión Electrónica</h3>
                        </div>
                        <p className="text-slate-400 text-sm">Emisión de Factura con Validez Jurídica ante DNIT.</p>
                    </div>
                    <button onClick={alCerrar} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 lg:space-y-8">
                    <AnimatePresence mode="wait">
                        {paso === 'formulario' ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                                <section>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-violet-500" /> Tipo de Documento Electrónico
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(TIPO_DOCUMENTO_LABELS).map(([code, label]) => (
                                            <button
                                                key={code}
                                                type="button"
                                                onClick={() => setTipoDocumento(code)}
                                                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                    tipoDocumento === code
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-indigo-500" /> Datos del Receptor
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
                                        <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                                            <div className="relative flex items-center">
                                                <input 
                                                    placeholder="Buscar por Razón Social o RUC..." 
                                                    value={cliente.razon_social}
                                                    readOnly={!!cliente.id}
                                                    onFocus={() => !cliente.id && buscarClientesLocal(cliente.razon_social)}
                                                    onChange={e => {
                                                        setCliente({ ...cliente, id: '', razon_social: e.target.value });
                                                        buscarClientesLocal(e.target.value);
                                                    }}
                                                    className={`w-full px-5 py-4 bg-slate-50 border ${!cliente.razon_social.trim() ? 'border-amber-200' : cliente.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-100'} rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                                                />
                                                {buscandoCliente && !cliente.id && (
                                                    <Loader2 className="absolute right-4 animate-spin text-slate-300" size={16} />
                                                )}
                                                {cliente.id && (
                                                    <button 
                                                        onClick={() => setCliente({ id: '', razon_social: '', ruc: '', direccion: '', email: '' })}
                                                        className="absolute right-3 text-[10px] font-black text-rose-500 uppercase hover:bg-rose-50 px-2 py-1 rounded-md"
                                                    >
                                                        Limpiar
                                                    </button>
                                                )}
                                            </div>
                                            {clientesSugeridos.length > 0 && !cliente.id && (
                                                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-[130] overflow-hidden">
                                                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resultados en Base de Datos</span>
                                                        <button onClick={() => setClientesSugeridos([])}><X size={12} className="text-slate-400" /></button>
                                                    </div>
                                                    {clientesSugeridos.map(c => (
                                                        <button 
                                                            key={c.id}
                                                            onClick={() => {
                                                                setCliente({ 
                                                                    id: c.id,
                                                                    razon_social: c.razon_social, 
                                                                    ruc: c.ruc, 
                                                                    direccion: c.direccion || '',
                                                                    email: c.email || '' 
                                                                });
                                                                setClientesSugeridos([]);
                                                            }}
                                                            className="w-full px-4 py-3 text-left hover:bg-emerald-50 border-b border-slate-50 last:border-0 flex items-center gap-3 transition-colors"
                                                        >
                                                            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-black text-[10px]">{c.razon_social.charAt(0)}</div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-black text-slate-700 uppercase">{c.razon_social}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">RUC: {c.ruc} • {c.email || 'Sin email'}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <input 
                                            placeholder="RUC Cliente" 
                                            value={cliente.ruc}
                                            readOnly={!!cliente.id}
                                            onChange={e => setCliente({...cliente, id: '', ruc: e.target.value})}
                                            className={`px-5 py-4 bg-slate-50 border ${!cliente.ruc.trim() ? 'border-amber-200' : 'border-slate-100'} rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50`}
                                        />
                                        <input 
                                            placeholder="Email del Receptor" 
                                            type="email"
                                            value={cliente.email}
                                            readOnly={!!cliente.id}
                                            onChange={e => setCliente({...cliente, id: '', email: e.target.value})}
                                            className={`px-5 py-4 bg-slate-50 border ${!cliente.email.trim() ? 'border-amber-200' : 'border-slate-100'} rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50`}
                                        />
                                        <div className="col-span-1 md:col-span-2 flex gap-4">
                                            <input 
                                                placeholder="Dirección Fiscal" 
                                                value={cliente.direccion}
                                                readOnly={!!cliente.id}
                                                onChange={e => setCliente({...cliente, id: '', direccion: e.target.value})}
                                                className={`flex-1 px-5 py-4 bg-slate-50 border ${!cliente.direccion.trim() ? 'border-amber-200' : 'border-slate-100'} rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50`}
                                            />
                                            <select 
                                                value={condicionOperacion}
                                                onChange={e => setCondicionOperacion(e.target.value as CondicionVenta)}
                                                className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            >
                                                {CONDICIONES_VENTA.map(c => (
                                                    <option key={c} value={c}>{c.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
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
                                            <div key={producto.id} className={`grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-2xl border ${!producto.descripcion.trim() || producto.precio_unitario <= 0 ? 'border-amber-200' : 'border-slate-100'} shadow-sm relative`}>
                                                <div className="col-span-6 relative">
                                                   <input 
                                                        placeholder="Descripción del producto o servicio" 
                                                        value={producto.descripcion}
                                                        onChange={e => {
                                                            const nuevosProductos = [...productos];
                                                            nuevosProductos[indice].descripcion = e.target.value;
                                                            setProductos(nuevosProductos);
                                                            buscarItemsCatalogo(e.target.value, producto.id);
                                                        }}
                                                        className="w-full bg-transparent font-bold text-sm outline-none"
                                                   />
                                                   {itemsSugeridos[producto.id]?.length > 0 && (
                                                       <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-[140] overflow-hidden">
                                                           {itemsSugeridos[producto.id].map(item => (
                                                               <button 
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        const nuevosProductos = [...productos];
                                                                        nuevosProductos[indice] = {
                                                                            ...nuevosProductos[indice],
                                                                            descripcion: item.nombre,
                                                                            precio_unitario: Number(item.precio_sugerido),
                                                                            iva_tipo: Number(item.iva_tipo)
                                                                        };
                                                                        setProductos(nuevosProductos);
                                                                        setItemsSugeridos(prev => ({ ...prev, [producto.id]: [] }));
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between"
                                                               >
                                                                   <span className="text-xs font-black text-slate-700 uppercase">{item.nombre}</span>
                                                                   <span className="text-[10px] font-bold text-indigo-500">₲ {item.precio_sugerido.toLocaleString()}</span>
                                                               </button>
                                                           ))}
                                                       </div>
                                                   )}
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
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="number"
                                                            placeholder="Precio" 
                                                            value={producto.precio_unitario}
                                                            onChange={e => {
                                                                const nuevosProductos = [...productos];
                                                                nuevosProductos[indice].precio_unitario = Number(e.target.value);
                                                                setProductos(nuevosProductos);
                                                            }}
                                                            className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 font-bold text-right text-sm"
                                                        />
                                                        <select 
                                                            value={producto.iva_tipo}
                                                            onChange={e => {
                                                                const nuevosProductos = [...productos];
                                                                nuevosProductos[indice].iva_tipo = Number(e.target.value);
                                                                setProductos(nuevosProductos);
                                                            }}
                                                            className="bg-white px-2 py-2 rounded-xl border border-slate-200 font-black text-[10px] text-center"
                                                        >
                                                            <option value={10}>10%</option>
                                                            <option value={5}>5%</option>
                                                            <option value={0}>Ext</option>
                                                        </select>
                                                    </div>
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
                                        <p className="text-red-500 mt-2">{errorDetalle || 'No se pudo autorizar el documento en esta emisión.'}</p>
                                        <button onClick={() => setPaso('formulario')} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Volver a Intentar</button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {paso === 'formulario' && (
                    <div className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                        <div className="flex gap-8 items-center">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Liquidación IVA 10%</p>
                                <p className="text-sm font-black text-slate-600">₲ {calcularTotalesPorIva().iva10.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Liquidación IVA 5%</p>
                                <p className="text-sm font-black text-slate-600">₲ {calcularTotalesPorIva().iva5.toLocaleString()}</p>
                            </div>
                            <div className="text-right ml-4 border-l pl-8 border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Total a Facturar</p>
                                <p className="text-3xl font-black text-slate-900">₲ {calcularTotal().toLocaleString()}</p>
                            </div>
                        </div>
                        <button 
                            onClick={procesarEmision} 
                            disabled={esInvalido || cargando}
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
