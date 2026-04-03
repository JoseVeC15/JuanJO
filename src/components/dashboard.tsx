import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Wallet,
  ArrowUpRight, Loader2,
  Activity,
  ShieldCheck, AlertTriangle, Shield, Calendar, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useSupabaseData } from '../hooks/useSupabaseData';
import SifenInvoiceEmitter from './SifenInvoiceEmitter';
import SafeToSpendCard from './SafeToSpendCard';
import {
  formatGs, formatGsShort,
  getGastoLabel, getGastoColor
} from '../data/sampleData';
import { useAuth } from '../contexts/AuthContext';
import SmartSuggestions from './SmartSuggestions';

export default function Dashboard() {
  const { 
    proyectos, facturasGastos, ingresos, configSifen, 
    rentabilidadHoraria, financialIntelligence,
    loadingProfile, loadingFacturas, loadingIngresos, loadingSifen,
    profile 
  } = useSupabaseData();
  const { user } = useAuth();
  const [showSifenEmitter, setShowSifenEmitter] = useState(false);
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(7550); // Default fallback
  const [loadingRate, setLoadingRate] = useState(true);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        setLoadingRate(true);
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data && data.rates && data.rates.PYG) {
          setExchangeRate(data.rates.PYG);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      } finally {
        setLoadingRate(false);
      }
    };
    fetchRate();
  }, []);
  
  // Default to current month YYYY-MM
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Generate available periods from data
  const availablePeriods = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonthStr);
    
    ingresos.forEach((i: any) => { if (i.fecha_emision) months.add(i.fecha_emision.substring(0, 7)); });
    facturasGastos.forEach((f: any) => { if (f.fecha_factura) months.add(f.fecha_factura.substring(0, 7)); });
    
    return Array.from(months).sort().reverse();
  }, [ingresos, facturasGastos, currentMonthStr]);

  const stats = useMemo(() => {
    if (loadingProfile) return null;

    const totalIngresos = ingresos.filter((i: any) => i.estado === 'cobrada').reduce((s: number, i: any) => s + Number(i.monto), 0);
    const totalGastos = facturasGastos.reduce((s: number, f: any) => s + Number(f.monto), 0);
    const ingresosPendientes = ingresos.filter((i: any) => i.estado !== 'cobrada').reduce((s: number, i: any) => s + Number(i.monto), 0);
    const cajaProyectada = (totalIngresos - totalGastos) + ingresosPendientes;
    const margen = totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos * 100) : 0;
    const proyectosActivos = proyectos.filter((p: any) => p.estado === 'en_progreso' || p.estado === 'cotizacion').length;

    const currentYear = new Date().getFullYear();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const filteredIngresos = selectedMonth === 'total' 
      ? ingresos 
      : ingresos.filter((i: any) => (i.fecha_emision || '').startsWith(selectedMonth));
    
    const filteredGastos = selectedMonth === 'total' 
      ? facturasGastos 
      : facturasGastos.filter((f: any) => (f.fecha_factura || '').startsWith(selectedMonth));

    const ivaDebito10 = filteredIngresos.reduce((s: number, i: any) => s + (Number(i.iva_10 || 0)), 0);
    const ivaDebito5 = filteredIngresos.reduce((s: number, i: any) => s + (Number(i.iva_5 || 0)), 0);
    const ivaDebitoTotal = ivaDebito10 + ivaDebito5;

    const ivaCredito10 = filteredGastos.reduce((s: number, f: any) => s + (Number(f.iva_10 || 0)), 0);
    const ivaCredito5 = filteredGastos.reduce((s: number, f: any) => s + (Number(f.iva_5 || 0)), 0);
    const ivaCreditoTotal = ivaCredito10 + ivaCredito5;

    const netIvaBalance = ivaDebitoTotal - ivaCreditoTotal;
    const ivaAPagar = Math.max(0, netIvaBalance);

    const monthlyData = months.map((m, index) => {
      const monthStr = (index + 1).toString().padStart(2, '0');
      const monthIngresos = ingresos
        .filter((ing: any) => ing.estado === 'cobrada' && (ing.fecha_emision || '').startsWith(`${currentYear}-${monthStr}`))
        .reduce((s: number, ing: any) => s + Number(ing.monto), 0);
      const monthGastos = facturasGastos
        .filter((gas: any) => (gas.fecha_factura || '').startsWith(`${currentYear}-${monthStr}`))
        .reduce((s: number, gas: any) => s + Number(gas.monto), 0);
      return { mes: m, ingresos: monthIngresos, gastos: monthGastos };
    }).filter(d => d.ingresos > 0 || d.gastos > 0).slice(-6);

    const finalMonthlyData = monthlyData.length > 0 ? monthlyData : [{ mes: 'Ene', ingresos: 0, gastos: 0 }];

    const pieData = Object.entries(
      facturasGastos.reduce((acc: any, f: any) => {
        acc[f.tipo_gasto] = (acc[f.tipo_gasto] || 0) + Number(f.monto);
        return acc;
      }, {} as Record<string, number>)
    ).map(([key, value]) => ({ 
      name: getGastoLabel(key as any), 
      value, 
      color: getGastoColor(key as any) 
    })).sort((a: any, b: any) => b.value - a.value);

    const activeProjectsList = proyectos.filter((p: any) => ['en_progreso', 'cotizacion', 'entregado', 'facturado', 'pagado'].includes(p.estado));

    return { 
        totalIngresos, totalGastos, margen, proyectosActivos, 
        monthlyData: finalMonthlyData, pieData, activeProjectsList,
        ivaAPagar, netIvaBalance, ivaDebitoTotal, ivaCreditoTotal,
        iva10: ivaDebito10 - ivaCredito10,
        iva5: ivaDebito5 - ivaCredito5,
        ingresosPendientes, cajaProyectada
    };
  }, [loadingProfile, loadingIngresos, loadingFacturas, ingresos, facturasGastos, proyectos, selectedMonth]);

  if (loadingProfile || !stats) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 shadow-sm" />)}
        </div>
        <div className="h-64 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 pb-12 px-4 lg:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
            <Activity size={14} /> SaaS PRO Dashboard
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
            Hola, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">Visión consolidada alineada con DNIT/SET (PY).</p>
        </motion.div>
      </div>

      <AnimatePresence>
        {showUpgradeAlert && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-slate-900 text-white p-6 rounded-3xl shadow-2xl shadow-emerald-900/40 z-50 flex items-start gap-4 max-w-sm border border-slate-700"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
               <ShieldCheck size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-black tracking-tight text-white mb-1">Función Premium</h4>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">La emisión de facturas electrónicas no está incluida en tu plan actual. Contáctanos para habilitar esta red en tu licencia.</p>
              <button onClick={() => setShowUpgradeAlert(false)} className="mt-4 text-[10px] font-black bg-white/10 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/20 transition-all uppercase tracking-widest">
                Entendido
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard index={0} title="Efectivo en Caja" value={formatGs(stats.totalIngresos - stats.totalGastos)} desc="Saldo real disponible" icon={<Wallet size={20} />} color="emerald" tooltip="Dinero real disponible tras restar todos los gastos de tus ingresos cobrados." loading={loadingIngresos || loadingFacturas} />
        <StatCard index={1} title="Cobros Pendientes" value={formatGs(stats.ingresosPendientes)} desc="Facturas por cobrar" icon={<Clock size={20} />} color="indigo" tooltip="Suma de todas las facturas emitidas, enviadas o vencidas que aún no han sido cobradas." loading={loadingIngresos} />
        <StatCard index={2} title="Caja Proyectada (30d)" value={formatGs(stats.cajaProyectada)} desc="Estimado con cobros" icon={<TrendingUp size={20} />} color="emerald" tooltip="Saldo actual + Cobros pendientes. Refleja tu liquidez potencial al cierre del ciclo." loading={loadingIngresos || loadingFacturas} />
        <StatCard index={3} title="Rentabilidad Horaria" value={formatGsShort(rentabilidadHoraria)} desc="Ingreso real / hora" icon={<Activity size={20} />} color="indigo" tooltip="Promedio de ganancia por hora trabajada en proyectos cerrados." loading={loadingIngresos || loadingFacturas} />
        <StatCard index={4} title="Salud Fiscal (SET)" value={formatGs(stats.ivaAPagar)} desc="IVA Neto Estimado" icon={<ShieldCheck size={20} />} color="amber" tooltip="Proyección de IVA a pagar (Débito - Crédito). Es tu obligación fiscal estimada." loading={loadingIngresos || loadingFacturas} />
      </div>

      <SmartSuggestions />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="xl:col-span-2 bg-white rounded-3xl lg:rounded-[2.5rem] border border-gray-100 p-6 lg:p-10 shadow-sm relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -z-10" />
          <div className="h-[300px] w-full">
            {(loadingIngresos || loadingFacturas) ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Calculando Proyección...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...stats.monthlyData, ...financialIntelligence.proyecciones]}>
                  <defs>
                    <linearGradient id="ingresGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gastosGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F43F5E" stopOpacity={0.1}/><stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/></linearGradient>
                    <linearGradient id="proyecGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366F1" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(val) => formatGs(Number(val))} />
                  <Area type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={5} fillOpacity={1} fill="url(#ingresGrad)" />
                  <Area type="monotone" dataKey="gastos" stroke="#F43F5E" strokeWidth={5} fillOpacity={1} fill="url(#gastosGrad)" />
                  <Area name="Proyección" type="monotone" dataKey="ingresos" data={financialIntelligence.proyecciones} stroke="#6366F1" strokeWidth={3} strokeDasharray="10 10" fillOpacity={1} fill="url(#proyecGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <div className="space-y-6 lg:space-y-8">
            <SafeToSpendCard 
                disponible={financialIntelligence.disponibleReal}
                ivaEstimado={financialIntelligence.ivaEstimadoAPagar}
                reserva={financialIntelligence.reservaEmergencia}
                gastosFijos={financialIntelligence.gastosFijosMes}
            />
            {(profile?.facturacion_habilitada || profile?.nivel_acceso === 1) ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="bg-slate-900 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="flex items-center justify-between gap-3 mb-8">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform"><Shield size={24} /></div>
                          <h3 className="font-bold text-xl tracking-tight">Resguardo DNIT</h3>
                      </div>
                      {/* Period Selector */}
                      <div className="relative">
                          <select 
                              value={selectedMonth} 
                              onChange={(e) => setSelectedMonth(e.target.value)}
                              className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer pr-8"
                          >
                              <option value="total">Histórico</option>
                              {availablePeriods.map(p => (
                                  <option key={p} value={p}>{p}</option>
                              ))}
                          </select>
                          <Calendar size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                  </div>
                  <div className="space-y-5">
                      {loadingSifen ? (
                        <div className="space-y-4 animate-pulse">
                          <div className="h-4 bg-white/5 rounded w-full" />
                          <div className="h-4 bg-white/5 rounded w-full" />
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center"><span className="text-xs text-slate-400">IVA Débito (Ventas)</span><span className="text-sm font-bold text-emerald-400">+{formatGs(stats.ivaDebitoTotal)}</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs text-slate-400">IVA Crédito (Compras)</span><span className="text-sm font-bold text-rose-400">-{formatGs(stats.ivaCreditoTotal)}</span></div>
                        </>
                      )}
                      <div className="h-px bg-slate-800 my-4" />
                      <div className="p-5 bg-white/5 rounded-3xl flex justify-between items-center border border-white/5">
                          <div>
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                                  {stats.netIvaBalance >= 0 ? 'Saldo a Pagar' : 'Crédito Fiscal'}
                              </p>
                              <p className={`text-2xl font-black ${stats.netIvaBalance < 0 ? 'text-emerald-400' : ''}`}>
                                  {formatGs(stats.netIvaBalance)}
                              </p>
                          </div>
                          {stats.ivaAPagar > 2000000 && <AlertTriangle className="text-amber-500" size={28} />}
                      </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                      <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Tasa 10%</p>
                          <p className="text-xs font-black text-blue-400">{formatGsShort(stats.iva10)}</p>
                      </div>
                      <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Tasa 5%</p>
                          <p className="text-xs font-black text-indigo-400">{formatGsShort(stats.iva5)}</p>
                      </div>
                  </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="bg-slate-900 rounded-3xl lg:rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-slate-700">
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6"><ShieldCheck size={32} /></div>
                  <h3 className="text-xl font-black mb-2">Servicios Avanzados</h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">Habilita el módulo de Facturación SIFEN e Ingresos para acceder a este panel de control fiscal en tiempo real.</p>
                  <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all">Saber Más</button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
              </motion.div>
            )}

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.6 }} 
                className={`${loadingRate ? 'bg-emerald-600' : 'bg-emerald-500'} rounded-2xl lg:rounded-[2rem] p-6 lg:p-8 text-slate-900 relative shadow-xl shadow-emerald-500/10 transition-colors`}
            >
                <div className="flex justify-between items-center mb-5">
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-80">Monitor PYG/USD</span>
                    <div className="flex items-center gap-2">
                        {loadingRate ? <Loader2 size={14} className="animate-spin opacity-40" /> : <ArrowUpRight size={18} className="text-slate-900/40" />}
                    </div>
                </div>
                <div className="flex items-end gap-3">
                    <h4 className="text-4xl font-black tracking-tighter">
                        ₲ {exchangeRate.toLocaleString('es-PY')}
                    </h4>
                    <span className="text-sm font-black mb-1.5 opacity-60">/ 1$</span>
                </div>
                {loadingRate && (
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] rounded-[inherit] pointer-events-none" />
                )}
            </motion.div>
        </div>
      </div>
      {showSifenEmitter && (
        <SifenInvoiceEmitter 
          onClose={() => setShowSifenEmitter(false)} 
          onSuccess={() => setShowSifenEmitter(false)}
          sifenConfig={configSifen}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, desc, icon, color, index, tooltip, loading }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const themes = {
    emerald: 'bg-emerald-50/50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50/50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50/50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50/50 text-amber-600 border-amber-100',
  };
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.1 * index }} 
      whileHover={{ y: -5 }} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white p-4 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-0 cursor-help"
    >
      <div className={`w-12 h-12 lg:w-14 lg:h-14 shrink-0 rounded-xl lg:rounded-2xl flex items-center justify-center mb-0 lg:mb-6 transition-transform group-hover:scale-110 shadow-sm ${themes[color as keyof typeof themes]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 lg:mb-2">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <>
            <h4 className="text-lg lg:text-2xl font-black text-gray-900 mb-0.5 lg:mb-1 leading-none">{value}</h4>
            <p className="text-[10px] lg:text-xs text-gray-400 font-medium leading-tight">{desc}</p>
          </>
        )}
      </div>

      <AnimatePresence>
        {isHovered && tooltip && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 5 }}
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm p-6 flex flex-col justify-center items-center text-center z-20"
          >
             <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">{title}</p>
             <p className="text-xs font-medium text-slate-100 leading-relaxed">{tooltip}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform -z-0 pointer-events-none" />
    </motion.div>
  );
}
