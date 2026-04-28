import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { subscribeToasts, type ToastItem } from '../../lib/toast';

const CONFIG = {
  success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', icon_color: 'text-emerald-500', text: 'text-emerald-900' },
  error:   { icon: XCircle,     bg: 'bg-rose-50',    border: 'border-rose-200',    icon_color: 'text-rose-500',    text: 'text-rose-900' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200',   icon_color: 'text-amber-500',  text: 'text-amber-900' },
  info:    { icon: Info,         bg: 'bg-blue-50',   border: 'border-blue-200',    icon_color: 'text-blue-500',   text: 'text-blue-900' },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const cfg = CONFIG[item.type];
  const Icon = cfg.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl backdrop-blur-sm max-w-sm w-full ${cfg.bg} ${cfg.border}`}
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${cfg.icon_color}`} />
      <p className={`flex-1 text-sm font-semibold leading-snug ${cfg.text}`}>{item.message}</p>
      <button onClick={onDismiss} className={`flex-shrink-0 opacity-40 hover:opacity-80 transition-opacity ${cfg.text}`}>
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  return (
    <div className="fixed bottom-6 right-4 lg:right-6 z-[300] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard
              item={t}
              onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
