import { motion } from 'framer-motion';
import { ShieldCheck, Info, TrendingDown, PiggyBank } from 'lucide-react';
import { formatGs } from '../data/sampleData';

interface SafeToSpendProps {
  disponible: number;
  ivaEstimado: number;
  reserva: number;
  gastosFijos: number;
}

export default function SafeToSpendCard({ disponible, ivaEstimado, reserva, gastosFijos }: SafeToSpendProps) {
  const isSafe = disponible > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-bl-full -z-0 group-hover:bg-emerald-500/20 transition-all duration-700" />
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-[0.2em] text-[10px]">
            <ShieldCheck size={16} /> Inteligencia Financiera
          </div>
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="p-2 bg-white/10 rounded-xl cursor-help border border-white/5"
            title="Calculado como: Cobros - (Gastos Fijos + IVA Estimado + Reserva 10%)"
          >
            <Info size={14} className="text-white/40" />
          </motion.div>
        </div>

        <div>
          <h3 className="text-white/60 font-medium text-sm mb-1 uppercase tracking-wider">Caja Realmente Disponible</h3>
          <div className="flex items-baseline gap-3">
            <span className={`text-4xl font-black tracking-tight ${isSafe ? 'text-white' : 'text-rose-400'}`}>
              {formatGs(disponible)}
            </span>
          </div>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2 italic">
            Safe-to-Spend (Metodología Tuttle)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-widest">
              <TrendingDown size={12} className="text-rose-400" /> Previsión IVA
            </div>
            <p className="text-sm font-bold">{formatGs(ivaEstimado)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-widest">
              <PiggyBank size={12} className="text-blue-400" /> Gastos Fijos
            </div>
            <p className="text-sm font-bold">{formatGs(gastosFijos)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
             <div className="flex items-center gap-2 text-white/30 text-[8px] font-black uppercase tracking-widest">
              <ShieldCheck size={10} className="text-emerald-500" /> Reserva 10%
            </div>
            <p className="text-[10px] font-bold text-white/40">{formatGs(reserva)}</p>
        </div>

        {!isSafe && (
          <div className="bg-rose-500/20 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3 mt-4">
            <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 animate-pulse" />
            <p className="text-[10px] font-bold text-rose-200 leading-relaxed uppercase tracking-wider">
              ¡Alerta! Tu flujo actual no cubre tus compromisos fijos e impuestos. Evita nuevos gastos.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
