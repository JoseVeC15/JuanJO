import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { subscribeConfirm, resolveConfirm, type ConfirmState } from '../../lib/confirm';

const EMPTY: ConfirmState = { open: false, message: '', confirmLabel: 'Confirmar', cancelLabel: 'Cancelar', danger: false };

export function ConfirmDialog() {
  const [state, setState] = useState<ConfirmState>(EMPTY);

  useEffect(() => subscribeConfirm(setState), []);

  return (
    <AnimatePresence>
      {state.open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-slate-900/40 backdrop-blur-sm"
            onClick={() => resolveConfirm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="fixed inset-0 z-[260] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full pointer-events-auto">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${state.danger ? 'bg-rose-50' : 'bg-amber-50'}`}>
                <AlertTriangle size={28} className={state.danger ? 'text-rose-500' : 'text-amber-500'} />
              </div>
              <p className="text-base font-bold text-gray-800 text-center leading-snug mb-7">{state.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => resolveConfirm(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  {state.cancelLabel}
                </button>
                <button
                  onClick={() => resolveConfirm(true)}
                  className={`flex-1 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${state.danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  {state.confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
