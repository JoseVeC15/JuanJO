import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, User, Globe, Save, 
  Plus, Trash2, RefreshCw, DollarSign, TrendingUp,
  Database, ShieldCheck,
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
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'currency' | 'backup' | 'billing'>('profile');
  
  const [customCategories, setCustomCategories] = useState<{id: string, label: string, color: string}[]>([]);
  const [newCatLabel, setNewCatLabel] = useState('');

  const [rates, setRates] = useState<any>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Estados Fiscales (SIFEN) - Refactorizado a Español
  const [perfilFiscal, setPerfilFiscal] = useState({
      ruc: '',
      dv: '',
      razon_social: '',
      ambiente: 'test' as 'test' | 'prod'
  });

  const [configSifen, setConfigSifen] = useState({
      csc: '',
      id_csc: '',
      timbrado: '',
      establecimiento: '001',
      punto_expedicion: '001'
  });

  const [certData, setCertData] = useState<{name: string, file: File | null}>({name: '', file: null});
  const [certStatus, setCertStatus] = useState<'none' | 'uploaded' | 'expired'>('none');

  useEffect(() => {
    fetchRates();
    const saved = localStorage.getItem(`finance_cats_${user?.id}`);
    if (saved) setCustomCategories(JSON.parse(saved));
  }, [user]);

  useEffect(() => {
      const loadFiscalProfile = async () => {
          if (!user) return;
          const { data, error } = await supabase
            .from('perfiles_fiscales')
            .select('*')
            .single();
          
          if (data && !error) {
              setPerfilFiscal({
                  ruc: data.ruc,
                  dv: data.dv.toString(),
                  razon_social: data.razon_social,
                  ambiente: data.ambiente
              });
              
              const { data: config } = await supabase
                .from('configuracion_sifen')
                .select('*')
                .single();
              
              if (config) {
                  setConfigSifen({
                      csc: config.csc,
                      id_csc: config.id_csc.toString(),
                      timbrado: config.timbrado,
                      establecimiento: config.establecimiento,
                      punto_expedicion: config.punto_expedicion
                  });
              }

              const { data: cert } = await supabase
                .from('certificados_digitales')
                .select('alias, vencimiento, estado')
                .single();
              
              if (cert) {
                  setCertData(prev => ({...prev, name: cert.alias || 'Certificado Registrado'}));
                  setCertStatus(cert.estado === 'activo' ? 'uploaded' : 'expired');
              }
          }
      };
      
      if (activeTab === 'billing') {
          loadFiscalProfile();
      }
  }, [activeTab, user]);

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

  const guardarPerfilFiscal = async () => {
      setSavingStatus('saving');
      try {
          const { error } = await supabase
            .from('perfiles_fiscales')
            .upsert({
                user_id: user?.id,
                ...perfilFiscal,
                updated_at: new Date().toISOString()
            });
          
          if (error) throw error;

          const { error: configError } = await supabase
            .from('configuracion_sifen')
            .upsert({
                user_id: user?.id,
                csc: configSifen.csc,
                id_csc: parseInt(configSifen.id_csc),
                timbrado: configSifen.timbrado,
                establecimiento: configSifen.establecimiento,
                punto_expedicion: configSifen.punto_expedicion,
                updated_at: new Date().toISOString()
            });

          if (configError) throw configError;
          
          if (certData.file) {
              const reader = new FileReader();
              reader.readAsDataURL(certData.file);
              reader.onload = async () => {
                  const base64 = (reader.result as string).split(',')[1];
                  const { error: certError } = await supabase
                    .from('certificados_digitales')
                    .upsert({
                        user_id: user?.id,
                        certificate_base64: base64,
                        password_cifrada: 'PENDING_SERVER_ENCRYPTION', // Lógica de cifrado en server recomendada
                        vencimiento: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0], // +1 año default
                        alias: certData.name,
                        estado: 'activo'
                    });
                  if (certError) console.error(certError);
              };
          }

          setSavingStatus('saved');
          setTimeout(() => setSavingStatus('idle'), 2000);
      } catch (e) {
          console.error(e);
          setSavingStatus('idle');
          alert('Error al guardar el perfil fiscal. Asegúrate de haber ejecutado la migración SQL.');
      }
  };

  const exportAllData = () => {
    const data = {
        meta: {
            user: user?.email,
            exported_at: new Date().toISOString(),
            version: 'v2'
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
          <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<ShieldCheck size={18} />} label="Facturación" />
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

          {activeTab === 'billing' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Módulo SIFEN (DNIT / SET)</h3>
                        <p className="text-sm text-gray-500">Configura tu identidad fiscal para facturación electrónica legal.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setPerfilFiscal({...perfilFiscal, ambiente: perfilFiscal.ambiente === 'test' ? 'prod' : 'test'})}
                            className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${perfilFiscal.ambiente === 'test' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:shadow-lg hover:shadow-emerald-500/10'}`}
                        >
                            Ambiente: {perfilFiscal.ambiente.toUpperCase()}
                        </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                      <div className="space-y-6">
                        <InputGroup 
                            label="RUC Emisor" 
                            value={perfilFiscal.ruc} 
                            onChange={(e: any) => setPerfilFiscal({...perfilFiscal, ruc: e.target.value})}
                            placeholder="80109403" 
                        />
                        <InputGroup 
                            label="Dígito Verificador (DV)" 
                            value={perfilFiscal.dv} 
                            onChange={(e: any) => setPerfilFiscal({...perfilFiscal, dv: e.target.value})}
                            placeholder="8" 
                        />
                        <InputGroup 
                            label="Razón Social / Nombre" 
                            value={perfilFiscal.razon_social} 
                            onChange={(e: any) => setPerfilFiscal({...perfilFiscal, razon_social: e.target.value})}
                            placeholder="AOSTA SA" 
                        />
                      </div>
                      <div className="space-y-6">
                         <div className={`p-6 bg-white rounded-3xl border border-dashed flex flex-col items-center justify-center gap-3 transition-all ${certStatus === 'uploaded' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all ${certStatus === 'uploaded' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-900'}`}>
                                <ShieldCheck size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-500">{certData.name || 'Certificado Digital (.p12 / .pfx)'}</p>
                                {certStatus === 'uploaded' && <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-1">✓ Certificado Vinculado</p>}
                            </div>
                            <label className="cursor-pointer">
                                <input 
                                    type="file" 
                                    accept=".p12,.pfx" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setCertData({name: file.name, file});
                                    }}
                                />
                                <span className="text-[10px] bg-slate-900 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest shadow-lg inline-block hover:scale-105 transition-all">
                                    {certStatus === 'uploaded' ? 'Cambiar Archivo' : 'Subir Archivo'}
                                </span>
                            </label>
                         </div>
                      </div>
                  </div>

                  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 text-emerald-400 font-black text-xs uppercase tracking-widest">
                            <RefreshCw size={16} /> Configuración Técnica SIFEN
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Token CSC</label>
                                <input 
                                    type="password" 
                                    value={configSifen.csc}
                                    onChange={(e) => setConfigSifen({...configSifen, csc: e.target.value})}
                                    placeholder="89D...A22"
                                    className="w-full px-5 py-3 bg-slate-800 rounded-2xl border border-slate-700 font-bold text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ID CSC</label>
                                <input 
                                    type="text" 
                                    value={configSifen.id_csc}
                                    onChange={(e) => setConfigSifen({...configSifen, id_csc: e.target.value})}
                                    placeholder="1"
                                    className="w-full px-5 py-3 bg-slate-800 rounded-2xl border border-slate-700 font-bold text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Establecimiento</label>
                                <input 
                                    type="text" 
                                    value={configSifen.establecimiento}
                                    onChange={(e) => setConfigSifen({...configSifen, establecimiento: e.target.value})}
                                    placeholder="001"
                                    className="w-full px-5 py-3 bg-slate-800 rounded-2xl border border-slate-700 font-bold text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Punto Expedición</label>
                                <input 
                                    type="text" 
                                    value={configSifen.punto_expedicion}
                                    onChange={(e) => setConfigSifen({...configSifen, punto_expedicion: e.target.value})}
                                    placeholder="001"
                                    className="w-full px-5 py-3 bg-slate-800 rounded-2xl border border-slate-700 font-bold text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
                                />
                            </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full" />
                  </div>

                  <div className="flex justify-end gap-3">
                      <button className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs">Descartar</button>
                      <button 
                        onClick={guardarPerfilFiscal}
                        disabled={savingStatus === 'saving'}
                        className="px-10 py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                      >
                          {savingStatus === 'saving' ? 'Guardando...' : 'Guardar Identidad Fiscal'}
                      </button>
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

function InputGroup({ label, value, disabled, onChange, placeholder }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-5 py-4 bg-gray-50/80 rounded-2xl border border-gray-100 font-bold text-gray-800 disabled:opacity-60 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
      />
    </div>
  );
}
