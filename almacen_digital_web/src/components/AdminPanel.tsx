import { useState } from 'react';
import { 
  Users, UserPlus, Mail, Shield, Search, 
  Loader2, CheckCircle2, AlertCircle, X, Lock, Edit2, Key, Trash2
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Profile } from '../data/sampleData';

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const { profile: adminProfile } = useSupabaseData();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre_completo: ''
  });

  const [editData, setEditData] = useState<{ id: string, name: string } | null>(null);
  const [resetData, setResetData] = useState<{ id: string, email: string, newPass?: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: allProfiles = [], isLoading } = useQuery({
    queryKey: ['admin_all_profiles'],
    enabled: adminProfile?.nivel_acceso === 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    }
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      // LLAMADA A EDGE FUNCTION (TIP)
      // Nota: Asumimos que la function se llama 'create-client-user'
      const { error } = await supabase.functions.invoke('create-client-user', {
        body: formData
      });

      if (error) {
        // Error de red o de la propia función
        let errorMsg = 'Error al registrar cliente';
        try {
          const body = await error.context?.json();
          errorMsg = body?.error || body?.message || error.message;
        } catch {
          errorMsg = error.message || 'Error desconocido en la función';
        }
        throw new Error(`${errorMsg} (Status: ${error.status || '???'})`);
      }

      setStatus({ type: 'success', msg: 'Cliente registrado con éxito.' });
      setFormData({ email: '', password: '', nombre_completo: '' });
      queryClient.invalidateQueries({ queryKey: ['admin_all_profiles'] });
      setTimeout(() => setShowCreateModal(false), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminOp = async (action: 'delete_user' | 'update_user' | 'reset_password', userId: string, dataObj?: any) => {
    console.log(`[ADMIN OP] Inicia: ${action} para ${userId}`, dataObj);
    setIsSubmitting(true);
    setStatus(null);
    try {
      const { error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action, userId, data: dataObj }
      });

      console.log(`[ADMIN OP] Resultado:`, { data, error });

      if (error) {
        let errorMsg = 'Fallo en la operación administrativa';
        try {
          const body = await error.context?.json();
          errorMsg = body?.error || body?.message || error.message;
        } catch {
          errorMsg = error.message || 'Error desconocido';
        }
        throw new Error(`${errorMsg} (Status: ${error.status || '???'})`);
      }

      setStatus({ type: 'success', msg: `Operación ${action} completada con éxito.` });
      await queryClient.invalidateQueries({ queryKey: ['admin_all_profiles'] });
      
      // Cerrar modales
      setEditData(null);
      setResetData(null);
      setDeleteId(null);

    } catch (err: any) {
      console.error("[ADMIN OP ERROR]:", err);
      setStatus({ type: 'error', msg: err?.message || 'Error en la conexión con la función administrativa.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = allProfiles.filter(p => 
    p.nombre_completo.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="text-indigo-600" size={32} />
            Panel Súper Admin (Nivel 1)
          </h1>
          <p className="text-gray-500 mt-1">Gestión centralizada de licencias y clientes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          <UserPlus size={20} />
          Registrar Cliente
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <AdminStatCard 
            label="Clientes Activos" 
            value={allProfiles.filter(p => p.nivel_acceso === 2).length.toString()} 
            icon={<Users className="text-indigo-600" />} 
          />
         <AdminStatCard 
            label="Administradores" 
            value={allProfiles.filter(p => p.nivel_acceso === 1).length.toString()} 
            icon={<Shield className="text-amber-600" />} 
          />
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar cliente por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Nivel</th>
                <th className="px-6 py-4">Fecha Registro</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                   <td colSpan={4} className="px-6 py-12 text-center">
                      <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto" />
                   </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${p.nivel_acceso === 1 ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                        {p.nombre_completo[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{p.nombre_completo}</p>
                        <p className="text-xs text-gray-400">{p.email || 'Sin email registrado'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter ${p.nivel_acceso === 1 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                      {p.nivel_acceso === 1 ? 'Súper Admin' : 'Cliente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-60 hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditData({ id: p.id, name: p.nombre_completo })}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Editar Nombre"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setResetData({ id: p.id, email: p.email || '' })}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        title="Resetear Contraseña"
                      >
                        <Key size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteId(p.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar Cliente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserPlus className="text-indigo-600" size={24} />
                  Nuevo Cliente
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                {status && (
                  <div className={`p-4 rounded-xl flex items-start gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <p className="text-sm font-medium">{status.msg}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Nombre Completo</label>
                    <div className="relative">
                      <input 
                        required
                        type="text" 
                        value={formData.nombre_completo}
                        onChange={e => setFormData({...formData, nombre_completo: e.target.value})}
                        placeholder="Juan Pérez"
                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        placeholder="cliente@nombre.com"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Contraseña Temporal</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        type="text" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder="min. 6 caracteres"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    Finalizar Registro
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-3 px-4">
                    Al confirmar, se creará una cuenta de Nivel 2. El cliente podrá acceder inmediatamente con sus credenciales.
                  </p>
                </div>
              </form>
           </div>
        </div>
      )}
      {/* Edit Name Modal */}
      {editData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4 text-left">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit2 className="text-indigo-600" size={24} />
              Editar Nombre
            </h3>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Nuevo Nombre</label>
              <input 
                type="text"
                value={editData.name}
                onChange={e => setEditData({...editData, name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            {status && (
              <div className={`p-4 rounded-xl flex items-start gap-3 my-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-medium">{status.msg}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setEditData(null)}
                className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleAdminOp('update_user', editData.id, { nombre_completo: editData.name })}
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4 text-left">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 text-amber-600">
              <Key size={24} />
              Resetear Contraseña
            </h3>
            <p className="text-sm text-gray-500 italic">Cliente: {resetData.email}</p>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Nueva Clave Temporal</label>
              <div className="relative group">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                  type="text"
                  placeholder="Ej: NuevaClave2024"
                  value={resetData.newPass || ''}
                  onChange={e => setResetData({...resetData, newPass: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                />
              </div>
            </div>
            {status && (
              <div className={`p-4 rounded-xl flex items-start gap-3 my-2 ${status.type === 'success' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-medium">{status.msg}</p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button onClick={() => { setResetData(null); setStatus(null); }} className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (resetData.newPass) handleAdminOp('reset_password', resetData.id, { new_password: resetData.newPass });
                }}
                disabled={isSubmitting || !resetData.newPass}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Confirmar Reset"}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-2">
              Se obligará al cliente a cambiar esta clave al entrar
            </p>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={40} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Cliente?</h3>
              <p className="text-sm text-gray-500">Esta acción es irreversible y el cliente perderá acceso al sistema.</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {status && (
                <div className={`p-4 rounded-xl flex items-start gap-3 mb-4 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <p className="text-sm font-medium">{status.msg}</p>
                </div>
              )}
              <button 
                onClick={() => handleAdminOp('delete_user', deleteId)}
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-100 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Sí, Eliminar Definitivamente"}
              </button>
              <button onClick={() => { setDeleteId(null); setStatus(null); }} className="w-full py-3 text-gray-500 font-bold hover:text-gray-700 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminStatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}
