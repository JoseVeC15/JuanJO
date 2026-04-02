import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Calculator, ArrowUpRight, 
  ArrowDownLeft, Info, Download, Calendar
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';

export default function AsistenteSET() {
    const { facturasGastos, ingresos } = useSupabaseData(); // ingresos calculated from ingresosRaw
    const [mesActual, setMesActual] = useState(new Date().getMonth());
    const [anioActual, setAnioActual] = useState(new Date().getFullYear());

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const statsMes = useMemo(() => {
        const gastosFiltrados = (facturasGastos || []).filter((g: any) => {
            const date = new Date(g.fecha_factura);
            return date.getMonth() === mesActual && date.getFullYear() === anioActual;
        });

        const ingresosFiltrados = (ingresos || []).filter((i: any) => {
            const date = new Date(i.fecha_emision);
            return date.getMonth() === mesActual && date.getFullYear() === anioActual;
        });

        const totalVentas10 = ingresosFiltrados.reduce((sum: number, i: any) => sum + (Number(i.monto) || 0), 0);
        const totalGastos10 = gastosFiltrados.reduce((sum: number, g: any) => sum + (Number(g.monto) || 0), 0);

        const ivaDebito = Math.round(totalVentas10 / 11);
        const ivaCredito = Math.round(totalGastos10 / 11);
        const saldoSET = ivaDebito - ivaCredito;

        return {
            totalVentas10,
            totalGastos10,
            ivaDebito,
            ivaCredito,
            saldoSET
        };
    }, [facturasGastos, ingresos, mesActual, anioActual]);

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                        <ShieldCheck size={14} /> Cumplimiento Tributario
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                        Asistente Fiscal SET
                    </h1>
                    <p className="text-gray-500 font-medium italic">Resumen de IVA y preparación para el Formulario 120.</p>
                </motion.div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <select 
                        value={mesActual} 
                        onChange={(e) => setMesActual(Number(e.target.value))}
                        className="bg-transparent border-none font-bold text-slate-800 outline-none px-4 py-2"
                    >
                        {meses.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select 
                        value={anioActual} 
                        onChange={(e) => setAnioActual(Number(e.target.value))}
                        className="bg-transparent border-none font-bold text-slate-800 outline-none px-4 py-2"
                    >
                        {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatBox 
                    label="IVA Débito (Ventas)" 
                    value={statsMes.ivaDebito} 
                    icon={<ArrowUpRight size={20} className="text-rose-500" />}
                    color="bg-white"
                />
                <StatBox 
                    label="IVA Crédito (Gastos)" 
                    value={statsMes.ivaCredito} 
                    icon={<ArrowDownLeft size={20} className="text-emerald-500" />}
                    color="bg-white"
                />
                <StatBox 
                    label={statsMes.saldoSET >= 0 ? "IVA a Pagar" : "Saldo a Favor"} 
                    value={Math.abs(statsMes.saldoSET)} 
                    icon={<Calculator size={20} className="text-indigo-500" />}
                    color={statsMes.saldoSET >= 0 ? "bg-indigo-50 border-indigo-100 text-indigo-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-bl-full -z-0" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                <Calculator size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Guía Formulario 120</h3>
                        </div>

                        <div className="space-y-4">
                            <HelperRow label="Casilla 10 (Ventas Gravadas 10%)" value={statsMes.totalVentas10} code="10" />
                            <HelperRow label="Casilla 26 (IVA Débito 10%)" value={statsMes.ivaDebito} code="26" />
                            <HelperRow label="Casilla 34 (Compras Gravadas 10%)" value={statsMes.totalGastos10} code="34" />
                            <HelperRow label="Casilla 45 (IVA Crédito 10%)" value={statsMes.ivaCredito} code="45" />
                        </div>

                        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                            <Info size={18} className="text-slate-400 mt-1" />
                            <p className="text-xs text-slate-500 leading-relaxed italic">
                                * Estos valores son referenciales basados en tus facturas cargadas. Verificá siempre con tu contador antes de presentar.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                                <Download size={20} className="text-emerald-400" /> Reporte para Contador
                            </h3>
                            <button className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 px-4 py-2 rounded-xl">Descargar XLSX</button>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Genera un archivo Excel con el detalle de todas tus compras y ventas del mes en formato compatible con el sistema Marangatú.
                        </p>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                            <Calendar size={18} className="text-emerald-400" />
                            <span className="text-xs font-bold">Vencimiento estimado: 07/{mesActual + 2}/2026</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, icon, color }: any) {
    return (
        <div className={`p-8 rounded-[2.5rem] border border-slate-100 shadow-sm ${color}`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">
                {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value)}
            </p>
        </div>
    );
}

function HelperRow({ label, value, code }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">C-{code}</p>
                <p className="text-sm font-bold text-slate-700">{label}</p>
            </div>
            <p className="font-black text-slate-900">
                {new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(value)}
            </p>
        </div>
    );
}
