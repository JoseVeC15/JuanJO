import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, User, Globe, Save, 
  Plus, Trash2, RefreshCw, DollarSign, TrendingUp,
  Database,
  AlertCircle as AlertIcon,
  Download,
  FileCode,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';

export default function Settings() {
  const { user } = useAuth();
  const { profile, facturasGastos, proyectos, ingresos } = useSupabaseData();
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'currency' | 'backup'>('profile');
  
  const [customCategories, setCustomCategories] = useState<{id: string, label: string, color: string}[]>([]);
  const [newCatLabel, setNewCatLabel] = useState('');

  const [rates, setRates] = useState<any>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    fetchRates();
    const saved = localStorage.getItem(`finance_cats_${user?.id}`);
    if (saved) setCustomCategories(JSON.parse(saved));
  }, [user]);

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      setRates(data.rates);
    } catch (e) {
      console.error(e);
    } finally {
        setLoadingRates(false);
    }
  };

  const addCategory = () => {
    if (!newCatLabel) return;
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const newCat = {
      id: Math.random().toString(36).substr(2, 9),
      label: newCatLabel,
      color: colors[customCategories.length % colors.length]
    };
    setCustomCategories([...customCategories, newCat]);
    setNewCatLabel('');
  };

  const saveSettings = () => {
    setSavingStatus('saving');
    localStorage.setItem(`finance_cats_${user?.id}`, JSON.stringify(customCategories));
    setTimeout(() => {
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2000);
    }, 800);
  };

  const exportAllData = () => {
    const data = {
        meta: {
            user: user?.email,
            exported_at: new Date().toISOString(),
            version: 'V9-PRO'
        },
        profile,
        facturas: facturasGastos,
        proyectos,
        ingresos,
        settings: {
            custom_categories: customCategories
        }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ecosistema & Config</h1>
          <p className="text-gray-500 font-medium">Gestiona tu identidad digital y exportación de datos.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-2">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="Perfil" />
          <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<Database size={18} />} label="Categorías" />
          <TabButton active={activeTab === 'currency'} onClick={() => setActiveTab('currency')} icon={<Globe size={18} />} label="Divisas" />
          <TabButton active={activeTab === 'backup'} onClick={() => setActiveTab('backup')} icon={<FileCode size={18} />} label="Backup Pro" />
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Información del Perfil</h3>
              <div className="grid grid-cols-1 gap-6">
                <InputGroup label="Nombre Completo" value={profile?.nombre_completo || 'Freelancer'} disabled />
                <InputGroup label="Correo Electrónico" value={user?.email || ''} disabled />
                <div className="pt-4 flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest leading-none">
                    Acceso: {profile?.nivel_acceso === 1 ? 'Super Admin' : 'Freelancer Standard'}
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black uppercase tracking-widest leading-none">Status: Active</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Categorías Personalizadas</h3>
                <p className="text-sm text-gray-500">Define tus propios tipos de gasto para reportes automáticos.</p>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  placeholder="Ej: Marketing, Servidores..."
                  className="flex-1 px-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
                <button onClick={addCategory} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                  <Plus size={20} /> Añadir
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                        <span className="font-bold text-gray-700">{cat.label}</span>
                      </div>
                      <button onClick={() => setCustomCategories(customCategories.filter(c => c.id !== cat.id))} className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {customCategories.length === 0 && (
                      <div className="col-span-full py-10 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-300">
                          <Database size={32} className="mb-2" />
                          <p className="text-sm font-medium">Sin categorías personalizadas</p>
                      </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <button 
                    onClick={saveSettings}
                    disabled={savingStatus === 'saving'}
                    className="flex items-center gap-2 bg-emerald-500 text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {savingStatus === 'saving' ? <Clock size={16} className="animate-spin" /> : savingStatus === 'saved' ? <CheckCircle size={16} /> : <Save size={16} />}
                  {savingStatus === 'saving' ? 'Guardando...' : savingStatus === 'saved' ? 'Guardado' : 'Guardar Cambios'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'currency' && (
             <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="flex justify-between items-start mb-10">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center"><DollarSign size={28} className="text-emerald-400" /></div>
                        <button onClick={fetchRates} className={`p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all ${loadingRates ? 'animate-spin' : ''}`}>
                            <RefreshCw size={20} />
                        </button>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Cotización del Día (PY)</p>
                        <h4 className="text-4xl font-black mb-1">1 USD = {rates ? rates['PYG']?.toLocaleString() : '---'} <span className="text-lg text-slate-600 font-bold">PYG</span></h4>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-tighter">
                            <TrendingUp size={14} /> Mercado Real Time
                        </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/5 rounded-full" />
                </div>
                
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                 <AlertIcon size={20} className="text-amber-500 shrink-0" />
                 <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Los tipos de cambio se obtienen de Open Exchange Rates y son referenciales para la gestión interna de tu SaaS.
                 </p>
                </div>
             </motion.div>
          )}

          {activeTab === 'backup' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div className="bg-indigo-600 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Download size={24} /></div>
                          <h3 className="text-2xl font-black">Portabilidad de Datos</h3>
                      </div>
                      <p className="text-indigo-100 mb-8 max-w-md">Descarga una copia completa de toda tu actividad en formato JSON compatible. Ideal para backups externos o migración.</p>
                      
                      <button 
                        onClick={exportAllData}
                        className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                      >
                          <FileCode size={20} /> Descargar Snapshot JSON
                      </button>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full -z-0" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Incluye:</p>
                          <ul className="text-sm font-bold text-gray-700 space-y-2">
                              <li className="flex items-center gap-2 text-emerald-600"><CheckCircle size={14} /> Facturas y Gastos</li>
                              <li className="flex items-center gap-2 text-emerald-600"><CheckCircle size={14} /> Proyectos y Clientes</li>
                              <li className="flex items-center gap-2 text-emerald-600"><CheckCircle size={14} /> Historial de Ingresos</li>
                              <li className="flex items-center gap-2 text-emerald-600"><CheckCircle size={14} /> Configuración de Usuario</li>
                          </ul>
                      </div>
                      <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Privacidad</p>
                          <p className="text-xs text-indigo-700 font-medium leading-relaxed">Este backup se genera localmente en tu navegador. Tus datos financieros nunca abandonan tu entorno de forma insegura.</p>
                      </div>
                  </div>
              </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${
        active 
          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.02]' 
          : 'text-gray-400 hover:bg-white hover:text-slate-900 hover:shadow-sm'
      }`}
    >
      {icon}
      <span className="uppercase tracking-tighter text-xs">{label}</span>
    </button>
  );
}

function InputGroup({ label, value, disabled }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        disabled={disabled}
        className="w-full px-5 py-4 bg-gray-50/80 rounded-2xl border border-gray-100 font-bold text-gray-800 disabled:opacity-60"
      />
    </div>
  );
}
