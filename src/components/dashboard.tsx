import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Wallet,
  ArrowUpRight, Loader2,
  Activity, DollarSign, Plus,
  ShieldCheck, AlertTriangle, Target, Shield, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useSupabaseData } from '../hooks/useSupabaseData';
import {
  formatGs, formatGsShort,
  getGastoLabel, getGastoColor
} from '../data/sampleData';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard({ onNavigate }: { onNavigate: (page: any) => void }) {
  const { proyectos, facturasGastos, ingresos, loading } = useSupabaseData();
  const { user } = useAuth();
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);
  
  // Default to current month YYYY-MM
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Generate available periods from data
  const availablePeriods = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonthStr);
    
    ingresos.forEach(i => { if (i.fecha_emision) months.add(i.fecha_emision.substring(0, 7)); });
    facturasGastos.forEach(f => { if (f.fecha_factura) months.add(f.fecha_factura.substring(0, 7)); });
    
    return Array.from(months).sort().reverse();
  }, [ingresos, facturasGastos, currentMonthStr]);

  const stats = useMemo(() => {
    if (loading) return null;

    const totalIngresos = ingresos.filter(i => i.estado === 'pagado').reduce((s, i) => s + Number(i.monto), 0);
    const totalGastos = facturasGastos.reduce((s, f) => s + Number(f.monto), 0);
    const margen = totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos * 100) : 0;
    const proyectosActivos = proyectos.filter(p => p.estado === 'en_progreso' || p.estado === 'cotizacion').length;

    const currentYear = new Date().getFullYear();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Filter data by selected month for VAT calculation
    const filteredIngresos = selectedMonth === 'total' 
      ? ingresos 
      : ingresos.filter(i => (i.fecha_emision || '').startsWith(selectedMonth));
    
    const filteredGastos = selectedMonth === 'total' 
      ? facturasGastos 
      : facturasGastos.filter(f => (f.fecha_factura || '').startsWith(selectedMonth));

    // REAL IVA CALCULATION (SET COMPLIANT)
    // IVA Débito: Total from Issued Invoices (ingresos)
    const ivaDebito10 = filteredIngresos.reduce((s, i) => s + (Number(i.iva_10 || 0)), 0);
    const ivaDebito5 = filteredIngresos.reduce((s, i) => s + (Number(i.iva_5 || 0)), 0);
    const ivaDebitoTotal = ivaDebito10 + ivaDebito5;

    // IVA Crédito: Total from Expenses (facturas_gastos)
    const ivaCredito10 = filteredGastos.reduce((s, f) => s + (Number(f.iva_10 || 0)), 0);
    const ivaCredito5 = filteredGastos.reduce((s, f) => s + (Number(f.iva_5 || 0)), 0);
    const ivaCreditoTotal = ivaCredito10 + ivaCredito5;

    const netIvaBalance = ivaDebitoTotal - ivaCreditoTotal;
    const ivaAPagar = Math.max(0, netIvaBalance);

    const monthlyData = months.map((m, i) => {
      const monthStr = (i + 1).toString().padStart(2, '0');
      const monthIngresos = ingresos
        .filter(ing => ing.estado === 'pagado' && (ing.fecha || '').startsWith(`${currentYear}-${monthStr}`))
        .reduce((s, ing) => s + Number(ing.monto), 0);
      const monthGastos = facturasGastos
        .filter(gas => (gas.fecha_factura || '').startsWith(`${currentYear}-${monthStr}`))
        .reduce((s, gas) => s + Number(gas.monto), 0);
      return { mes: m, ingresos: monthIngresos, gastos: monthGastos };
    }).filter(d => d.ingresos > 0 || d.gastos > 0).slice(-6);

    const finalMonthlyData = monthlyData.length > 0 ? monthlyData : [
      { mes: 'Ene', ingresos: 0, gastos: 0 }
    ];

    const pieData = Object.entries(
      facturasGastos.reduce((acc, f) => {
        acc[f.tipo_gasto] = (acc[f.tipo_gasto] || 0) + Number(f.monto);
        return acc;
      }, {} as Record<string, number>)
    ).map(([key, value]) => ({ 
      name: getGastoLabel(key as any), 
      value, 
      color: getGastoColor(key as any) 
    })).sort((a, b) => b.value - a.value);

    const activeProjectsList = proyectos.filter(p => ['en_progreso', 'cotizacion', 'entregado', 'facturado'].includes(p.estado));

    return { 
        totalIngresos, totalGastos, margen, proyectosActivos, 
        monthlyData: finalMonthlyData, pieData, activeProjectsList,
        ivaAPagar, netIvaBalance, ivaDebitoTotal, ivaCreditoTotal,
        iva10: ivaDebito10 - ivaCredito10,
        iva5: ivaDebito5 - ivaCredito5
    };
  }, [loading, ingresos, facturasGastos, proyectos, selectedMonth]);

  if (loading || !stats) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="text-emerald-500 animate-spin" size={32} /></div>;
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
        
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <motion.button onClick={() => onNavigate('facturas')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 lg:px-6 lg:py-3.5 rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-sm transition-all">
            <Plus size={16} className="text-emerald-500 lg:w-[18px]" /> Nuevo Doc
          </motion.button>
          <motion.button onClick={() => setShowUpgradeAlert(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 lg:px-7 lg:py-3.5 rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 relative overflow-hidden group transition-all">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <DollarSign size={16} className="text-emerald-400 lg:w-[18px]" /> Emitir
          </motion.button>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard index={0} title="Efectivo en Caja" value={formatGs(stats.totalIngresos - stats.totalGastos)} desc="Saldo real disponible" icon={<Wallet size={20} />} color="emerald" />
        <StatCard index={1} title="Ventas del Período" value={formatGs(stats.totalIngresos)} desc="Ingresos brutos declarados" icon={<TrendingUp size={20} />} color="indigo" />
        <StatCard index={2} title="Eficiencia Operativa" value={`${stats.margen.toFixed(1)}%`} desc="Margen de rentabilidad" icon={<Target size={20} />} color="emerald" />
        <StatCard index={3} title="Salud Fiscal (SET)" value={formatGs(stats.ivaAPagar)} desc="IVA Neto Estimado" icon={<ShieldCheck size={20} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="xl:col-span-2 bg-white rounded-3xl lg:rounded-[2.5rem] border border-gray-100 p-6 lg:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -z-10" />
          <h3 className="font-black text-gray-900 text-xl mb-10">Proyección Mensual Consolidada</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData}>
                <defs>
                   <linearGradient id="ingresGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                   <linearGradient id="gastosGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F43F5E" stopOpacity={0.1}/><stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(val) => formatGs(Number(val))} />
                <Area type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={5} fillOpacity={1} fill="url(#ingresGrad)" />
                <Area type="monotone" dataKey="gastos" stroke="#F43F5E" strokeWidth={5} fillOpacity={1} fill="url(#gastosGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="space-y-6 lg:space-y-8">
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
                    <div className="flex justify-between items-center"><span className="text-xs text-slate-400">IVA Débito (Ventas)</span><span className="text-sm font-bold text-emerald-400">+{formatGs(stats.ivaDebitoTotal)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-xs text-slate-400">IVA Crédito (Compras)</span><span className="text-sm font-bold text-rose-400">-{formatGs(stats.ivaCreditoTotal)}</span></div>
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

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="bg-emerald-500 rounded-2xl lg:rounded-[2rem] p-6 lg:p-8 text-slate-900 relative shadow-xl shadow-emerald-500/10">
                <div className="flex justify-between items-center mb-5">
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-80">Monitor PYG/USD</span>
                    <ArrowUpRight size={18} className="text-slate-900/40" />
                </div>
                <div className="flex items-end gap-3">
                    <h4 className="text-4xl font-black tracking-tighter">₲ 7.420</h4>
                    <span className="text-sm font-black mb-1.5 opacity-60">/ 1$</span>
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, desc, icon, color, index }: any) {
  const themes = {
    emerald: 'bg-emerald-50/50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50/50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50/50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50/50 text-amber-600 border-amber-100',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }} whileHover={{ y: -5 }} className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
      <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center mb-4 lg:mb-6 transition-transform group-hover:scale-110 shadow-sm ${themes[color as keyof typeof themes]}`}>{icon}</div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      <h4 className="text-2xl font-black text-gray-900 mb-1">{value}</h4>
      <p className="text-xs text-gray-400 font-medium">{desc}</p>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform -z-0" />
    </motion.div>
  );
}
