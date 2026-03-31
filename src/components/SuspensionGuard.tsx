import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';

export default function SuspensionGuard({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const { profile, loading } = useSupabaseData();

  if (loading) return <>{children}</>; // O un loader global si prefieres

  if (profile?.estado === 'suspendido') {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-6 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] w-full max-w-lg p-10 lg:p-12 shadow-2xl text-center relative z-10"
        >
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <ShieldAlert size={48} strokeWidth={1.5} />
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight uppercase">
            Cuenta Suspendida
          </h2>
          
          <div className="space-y-4 mb-10">
            <p className="text-gray-500 font-medium leading-relaxed">
              Lo sentimos, tu acceso a <span className="font-bold text-slate-900">FINANCE PRO</span> ha sido pausado temporalmente debido a una <span className="text-rose-600 font-bold">pendencia administrativa o falta de pago</span>.
            </p>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Para reactivar tu cuenta, por favor contacta con soporte.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <a 
              href="https://wa.me/595991986045?text=Hola,%20mi%20cuenta%20de%20Finance%20Pro%20está%20suspendida.%20Deseo%20regularizar%20mi%20pago."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all active:scale-95"
            >
              <MessageCircle size={22} />
              Reactivar por WhatsApp
            </a>

            <button 
              onClick={() => signOut()}
              className="flex items-center justify-center gap-2 text-gray-400 hover:text-slate-900 py-3 font-black text-xs uppercase tracking-widest transition-colors"
            >
              <LogOut size={18} />
              Cerrar Sesión Actual
            </button>
          </div>

          <div className="mt-12 flex justify-center items-center gap-2 opacity-20 hover:opacity-100 transition-opacity">
             <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[10px]">
                FP
             </div>
             <p className="text-[10px] font-black text-slate-900 tracking-tighter uppercase">Security Guard v1.0</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
