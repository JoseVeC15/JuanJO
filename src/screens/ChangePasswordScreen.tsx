import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

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

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      // 1. Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { must_change_password: false } // Limpiar el flag en metadata
      });

      if (updateError) throw updateError;

      setSuccess(true);
      // Forzar recarga suavizada para que AuthContext capte el cambio
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#16161a] border border-green-500/30 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">¡Contraseña Actualizada!</h1>
          <p className="text-gray-400">Tu cuenta ahora es segura. Redirigiendo al panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />

      <div className="w-full max-w-md bg-[#16161a] border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Actualiza tu Seguridad</h1>
          <p className="text-gray-400 mt-2">Por seguridad, debes cambiar tu contraseña temporal antes de continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Nueva Contraseña</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all group-hover:border-white/20"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="Repite la contraseña"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Actualizando...</span>
              </div>
            ) : (
              "Actualizar y Continuar"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-8 uppercase tracking-widest">
          Finance Security Protocol
        </p>
      </div>
    </div>
  );
}
