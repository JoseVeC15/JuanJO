import { useState, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

export function SummaryCard({ label, value, desc, color }: {
  label: string; value: string; desc: string; color: string;
}) {
  return (
    <div className={`rounded-[2rem] p-8 border shadow-sm transition-all hover:shadow-lg ${color}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{label}</p>
      <p className="text-2xl font-black mb-1">{value}</p>
      <p className="text-[10px] font-bold opacity-50">{desc}</p>
    </div>
  );
}

export function DetailBox({ label, value, desc, icon }: {
  label: string; value?: string | null; desc?: string; icon?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className="font-black text-slate-900 text-lg tracking-tight">{value || '-'}</p>
      {desc && <p className="text-[10px] text-emerald-500 font-black mt-0.5">{desc}</p>}
    </div>
  );
}

export function ModalInput({ label, value, onChange, type = 'text', className = '', hint }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; className?: string; hint?: string;
}) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 ml-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        {hint && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowHint(true)}
              onMouseLeave={() => setShowHint(false)}
              onFocus={() => setShowHint(true)}
              onBlur={() => setShowHint(false)}
              className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-indigo-400 transition-colors"
            >
              <HelpCircle size={13} />
            </button>
            {showHint && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-white text-[11px] font-medium rounded-xl p-3 z-50 shadow-xl leading-snug">
                {hint}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            )}
          </div>
        )}
      </div>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-inner ${className}`}
      />
    </div>
  );
}
