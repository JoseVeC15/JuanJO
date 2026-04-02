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
  Clock,
  Package
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';

export default function Settings({ initialTab = 'profile' }: { initialTab?: 'profile' | 'branding' | 'categories' | 'currency' | 'backup' | 'billing' | 'catalog' }) {
  const { user } = useAuth();
  const { profile, facturasGastos, proyectos, ingresos } = useSupabaseData();
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [customCategories, setCustomCategories] = useState<{id: string, label: string, color: string}[]>([]);
  const [newCatLabel, setNewCatLabel] = useState('');

  // Estados del Catálogo
  const [itemsCatalogo, setItemsCatalogo] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [newItem, setNewItem] = useState({ nombre: '', precio: 0, iva: 10 });

  const [rates, setRates] = useState<any>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Estados Fiscales (SIFEN)
  const [perfilFiscal, setPerfilFiscal] = useState({
      ruc: '',
      dv: '',
      razon_social: '',
      direccion: 'Asunción, PY',
      ambiente: 'test' as 'test' | 'prod'
  });

  const [configSifen, setConfigSifen] = useState({
      csc: '',
      id_csc: '',
      timbrado: '',
      establecimiento: '001',
      punto_expedicion: '001'
  });

  const [branding, setBranding] = useState({
      logo_url: '',
      color_primario: '#0f172a',
      portfolio_url: '',
      telefono_contacto: '',
      direccion_fisica: ''
  });

  const [certData, setCertData] = useState<{name: string, file: File | null, password?: string}>({name: '', file: null, password: ''});
  const [certStatus, setCertStatus] = useState<'none' | 'uploaded' | 'expired'>('none');

  const hashSecret = async (secret: string) => {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    fetchRates();
    const saved = localStorage.getItem(`finance_cats_${user?.id}`);
    if (saved) setCustomCategories(JSON.parse(saved));
    
    if (profile) {
      setBranding({
        logo_url: profile.logo_url || '',
        color_primario: profile.color_primario || '#0f172a',
        portfolio_url: profile.portfolio_url || '',
        telefono_contacto: profile.telefono_contacto || '',
        direccion_fisica: profile.direccion_fisica || ''
      });
    }
  }, [user, profile]);

  useEffect(() => {
      const loadFiscalProfile = async () => {
          if (!user) return;
          const { data, error } = await supabase
            .from('perfiles_fiscales')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (data && !error) {
              setPerfilFiscal({
                  ruc: data.ruc,
                  dv: data.dv.toString(),
                  razon_social: data.razon_social,
                  direccion: data.direccion || 'Asunción, PY',
                  ambiente: data.ambiente
              });
              
              const { data: config } = await supabase
                .from('configuracion_sifen')
                .select('*')
                .eq('user_id', user.id)
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
                .eq('user_id', user.id)
                .single();
              
              if (cert) {
                  setCertData(prev => ({
                      ...prev, 
                      name: cert.alias || 'Certificado Registrado',
                      password: ''
                  }));
                  setCertStatus(cert.estado === 'activo' ? 'uploaded' : 'expired');
              }
          }
      };
      
      if (activeTab === 'billing') {
          loadFiscalProfile();
      }
      if (activeTab === 'catalog') {
          fetchCatalog();
      }
  }, [activeTab, user]);

  const fetchCatalog = async () => {
    if (!user) return;
    setLoadingCatalog(true);
    const { data } = await supabase
      .from('items_catalogo')
      .select('*')
      .order('nombre', { ascending: true });
    setItemsCatalogo(data || []);
    setLoadingCatalog(false);
  };

  const addCatalogItem = async () => {
    if (!newItem.nombre) return;
    setSavingStatus('saving');
    const { error } = await supabase
      .from('items_catalogo')
      .insert({
        user_id: user?.id,
        nombre: newItem.nombre,
        precio_sugerido: newItem.precio,
        iva_tipo: newItem.iva
      });
    
    if (!error) {
      setNewItem({ nombre: '', precio: 0, iva: 10 });
      fetchCatalog();
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } else {
      setSavingStatus('idle');
      alert('Error al guardar item');
    }
  };

  const deleteCatalogItem = async (id: string) => {
    const { error } = await supabase
      .from('items_catalogo')
      .delete()
      .eq('id', id);
    if (!error) fetchCatalog();
  };

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
        if (!/^\d{3}$/.test(configSifen.establecimiento) || !/^\d{3}$/.test(configSifen.punto_expedicion)) {
          throw new Error('Establecimiento y Punto de Expedicion deben tener 3 digitos (ej. 001).');
        }

        if (!configSifen.csc || configSifen.csc.length < 8 || Number.isNaN(parseInt(configSifen.id_csc))) {
          throw new Error('CSC e ID CSC son obligatorios y deben ser validos antes de guardar.');
        }

          const { error } = await supabase
            .from('perfiles_fiscales')
            .upsert({
                user_id: user?.id,
                ruc: perfilFiscal.ruc,
                dv: parseInt(perfilFiscal.dv) || 0,
                razon_social: perfilFiscal.razon_social,
                direccion: perfilFiscal.direccion || 'Asunción, PY',
                ambiente: perfilFiscal.ambiente,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
          
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
            }, { onConflict: 'user_id' });

          if (configError) throw configError;
          
          if (certData.file) {
              await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(certData.file as File);
                  reader.onload = async () => {
                      try {
                          const base64 = (reader.result as string).split(',')[1];
                    const passwordHash = certData.password ? await hashSecret(certData.password) : 'NO_PASSWORD';
                          const { error: certError } = await supabase
                            .from('certificados_digitales')
                            .upsert({
                                user_id: user?.id,
                      certificado_base64: base64,
                      password_cifrada: passwordHash,
                                vencimiento: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
                                alias: certData.name,
                                estado: 'activo'
                            }, { onConflict: 'user_id' });
                          if (certError) throw certError;
                          resolve(true);
                      } catch (err) {
                          reject(err);
                      }
                  };
                  reader.onerror = reject;
              });
          }

          setSavingStatus('saved');
          setTimeout(() => setSavingStatus('idle'), 2500);
      } catch (e: any) {
          console.error(e);
          setSavingStatus('idle');
          alert(`Error al guardar: ${e.message || 'Error desconocido'}`);
      }
  };

  const guardarBranding = async () => {
    setSavingStatus('saving');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          logo_url: branding.logo_url,
          color_primario: branding.color_primario,
          portfolio_url: branding.portfolio_url,
          telefono_contacto: branding.telefono_contacto,
          direccion_fisica: branding.direccion_fisica
        })
        .eq('id', user?.id);

      if (error) throw error;
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2500);
    } catch (e: any) {
      console.error(e);
      setSavingStatus('idle');
      alert(`Error al guardar: ${e.message}`);
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
          <TabButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={<Save size={18} />} label="Marca & Logo" />
          <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<Database size={18} />} label="Categorías" />
          <TabButton active={activeTab === 'currency'} onClick={() => setActiveTab('currency')} icon={<Globe size={18} />} label="Divisas" />
          <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<ShieldCheck size={18} />} label="Facturación" />
          <TabButton active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={<Package size={18} />} label="Catálogo" />
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

          {activeTab === 'branding' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Branding e Identidad Visual</h3>
                <p className="text-sm text-gray-500">Configura la apariencia de tus presupuestos y propuestas comerciales.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                <div className="space-y-6">
                  <InputGroup 
                    label="URL Logo (Empresa)" 
                    value={branding.logo_url} 
                    onChange={(e: any) => setBranding({...branding, logo_url: e.target.value})}
                    placeholder="https://tupagina.com/logo.png" 
                  />
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Color Principal Presupuestos</label>
                    <div className="flex gap-2">
                       <input 
                        type="color" 
                        value={branding.color_primario} 
                        onChange={(e) => setBranding({...branding, color_primario: e.target.value})}
                        className="w-12 h-12 bg-white rounded-xl border border-gray-100 outline-none cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={branding.color_primario} 
                        onChange={(e) => setBranding({...branding, color_primario: e.target.value})}
                        className="flex-1 px-5 py-3 bg-white rounded-xl border border-gray-100 font-bold text-gray-800 outline-none"
                      />
                    </div>
                  </div>
                  <InputGroup 
                    label="WhatsApp / Teléfono" 
                    value={branding.telefono_contacto} 
                    onChange={(e: any) => setBranding({...branding, telefono_contacto: e.target.value})}
                    placeholder="+595 981..." 
                  />
                </div>
                <div className="space-y-6">
                  <InputGroup 
                    label="Enlace a Portafolio (Vimeo / Behance)" 
                    value={branding.portfolio_url} 
                    onChange={(e: any) => setBranding({...branding, portfolio_url: e.target.value})}
                    placeholder="https://vimeo.com/usuario" 
                  />
                   <InputGroup 
                    label="Dirección Física (Opcional)" 
                    value={branding.direccion_fisica} 
                    onChange={(e: any) => setBranding({...branding, direccion_fisica: e.target.value})}
                    placeholder="Asunción, Paraguay" 
                  />
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center gap-3">
                    <Save size={20} className="text-indigo-500" />
                    <p className="text-[10px] text-indigo-700 font-medium leading-tight">
                      Estos datos se usarán para generar el código QR y la cabecera en tus presupuestos PDF automáticos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={guardarBranding}
                  disabled={savingStatus === 'saving'}
                  className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all ${
                    savingStatus === 'saved' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                  } disabled:opacity-50`}
                >
                  {savingStatus === 'saving' ? 'Guardando...' : savingStatus === 'saved' ? '¡Marca Actualizada! ✨' : 'Guardar Configuración de Marca'}
                </button>
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
                                        if (file) setCertData({...certData, name: file.name, file});
                                    }}
                                />
                                <span className="text-[10px] bg-slate-900 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest shadow-lg inline-block hover:scale-105 transition-all">
                                    {certStatus === 'uploaded' ? 'Cambiar Archivo' : 'Subir Archivo'}
                                </span>
                            </label>
                         </div>
                         <div className="space-y-1.5 w-full">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Clock size={12} className="text-slate-400" /> Contraseña del Certificado
                            </label>
                            <input 
                                type="password" 
                                value={certData.password}
                                onChange={(e) => setCertData({...certData, password: e.target.value})}
                                placeholder="Clave del archivo .p12"
                                className="w-full px-5 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
                            />
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
                        className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all ${
                          savingStatus === 'saved' ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 
                          'bg-emerald-500 text-slate-900 shadow-emerald-500/20'
                        } disabled:opacity-50`}
                      >
                          {savingStatus === 'saving' ? 'Guardando...' : 
                           savingStatus === 'saved' ? '¡Datos Sincronizados! ✨' : 
                           'Guardar Identidad Fiscal'}
                      </button>
                  </div>
              </motion.div>
          )}

          {activeTab === 'catalog' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Catálogo de Servicios y Precios</h3>
                      <p className="text-sm text-gray-500">Configura tus servicios frecuentes para facturar en un solo clic.</p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-6">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nombre del Servicio / Producto</label>
                        <input 
                            type="text" 
                            value={newItem.nombre}
                            onChange={(e) => setNewItem({...newItem, nombre: e.target.value})}
                            placeholder="Ej: Consultoría Mensual, Diseño de Logo..."
                            className="w-full px-5 py-3 bg-white rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Precio Sugerido</label>
                        <input 
                            type="number" 
                            value={newItem.precio}
                            onChange={(e) => setNewItem({...newItem, precio: Number(e.target.value)})}
                            className="w-full px-5 py-3 bg-white rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">IVA</label>
                        <select 
                            value={newItem.iva}
                            onChange={(e) => setNewItem({...newItem, iva: Number(e.target.value)})}
                            className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm appearance-none"
                        >
                            <option value={10}>10%</option>
                            <option value={5}>5%</option>
                            <option value={0}>Exenta</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <button 
                            onClick={addCatalogItem}
                            disabled={!newItem.nombre || savingStatus === 'saving'}
                            className="w-full h-[48px] bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                        >
                            <Plus size={20} />
                        </button>
                      </div>
                  </div>

                  <div className="space-y-3">
                      {loadingCatalog ? (
                          <div className="py-10 flex justify-center"><RefreshCw className="animate-spin text-slate-300" /></div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {itemsCatalogo.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-5 bg-white rounded-[1.5rem] border border-slate-100 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                            {item.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 uppercase text-xs tracking-tight">{item.nombre}</p>
                                            <p className="text-[10px] font-bold text-slate-400">
                                                ₲ {item.precio_sugerido.toLocaleString()} • IVA {item.iva_tipo === 0 ? 'Exenta' : `${item.iva_tipo}%`}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => deleteCatalogItem(item.id)}
                                        className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {itemsCatalogo.length === 0 && (
                                <div className="py-20 border-2 border-dashed border-slate-50 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
                                    <Package size={48} strokeWidth={1} className="mb-4 opacity-20" />
                                    <p className="text-sm font-black uppercase tracking-widest opacity-30">Catálogo Vacío</p>
                                </div>
                            )}
                        </div>
                      )}
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
