import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChangePasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres para mayor seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor, revísalas.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { must_change_password: false }
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setError(
        err.message.includes('New password should be different') 
          ? 'La nueva contraseña debe ser diferente a la anterior.'
          : 'No se pudo actualizar la contraseña. Revisa tu conexión.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-emerald-500/20 rounded-[2.5rem] p-12 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldCheck className="w-12 h-12 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">¡PROTECCIÓN ACTIVADA!</h1>
          <p className="text-slate-400 font-medium leading-relaxed">Tu cuenta ahora es segura. Redirigiendo al sistema...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/20 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/10 shadow-lg shadow-emerald-500/5">
            <Lock className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">FINANCE <span className="text-emerald-500">PRO</span> SECURITY</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Actualización Obligatoria de Seguridad</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-bold uppercase tracking-tight leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nueva Contraseña Maestra</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-emerald-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium placeholder:text-slate-700"
                  placeholder="Min. 8 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Reconfirmar Clave</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium placeholder:text-slate-700"
                  placeholder="Repite la clave"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black uppercase text-[11px] tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 active:scale-[0.97] flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                <span>BLINDANDO CUENTA...</span>
              </div>
            ) : (
              <>
                ACTUALIZAR Y CONTINUAR
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-white/5 flex flex-col items-center gap-2">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">
              FINANCE PRO v2.0.0
            </p>
            <p className="text-[8px] text-emerald-500/50 font-bold uppercase tracking-widest leading-none">
              High Encryption Auth Protocol
            </p>
        </div>
      </div>
    </div>
  );
}
