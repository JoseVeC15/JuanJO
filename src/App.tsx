import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout, LogOut, Loader2, PieChart, Wallet, Settings as SettingsIcon, ArrowUpRight, ArrowDownLeft, ChevronDown, ClipboardList, Sparkles } from 'lucide-react';
import { useSupabaseData } from './hooks/useSupabaseData';
import { resolveServiceProfile } from './config/serviceProfiles';
import SuspensionGuard from './components/SuspensionGuard';

const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const ChangePasswordScreen = lazy(() => import('./screens/ChangePasswordScreen'));
const Dashboard = lazy(() => import('./components/dashboard'));
const Facturas = lazy(() => import('./components/facturas'));
const Projects = lazy(() => import('./components/projects'));
const Inventario = lazy(() => import('./components/inventario'));
const Reportes = lazy(() => import('./components/reportes'));
const Settings = lazy(() => import('./components/Settings'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const ManualsScreen = lazy(() => import('./screens/ManualsScreen'));
const Servicios = lazy(() => import('./components/Servicios'));

// Componente para sub-menú en móvil
function MobileSubMenu({ item }: { item: any }) {
  const location = useLocation();
  const isParentActive = item.children?.some((child: any) => location.pathname === child.path);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex flex-col items-center gap-1 p-2 min-w-[64px] relative transition-colors ${
          isParentActive || isOpen ? 'text-emerald-600' : 'text-slate-400'
        }`}
      >
        {isParentActive && (
          <motion.div 
            layoutId="activeNavMobile"
            className="absolute top-0 w-8 h-1 bg-emerald-500 rounded-b-full"
          />
        )}
        <div className="text-xl leading-none relative">
            {item.icon}
            <motion.div 
              animate={{ rotate: isOpen ? 180 : 0 }}
              className="absolute -right-2 -top-1"
            >
              <ChevronDown size={10} />
            </motion.div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 min-w-[160px] z-50 overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                {item.children.map((child: any) => (
                  <NavLink
                    key={child.key}
                    to={child.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-slate-600 active:bg-slate-50'
                    }`}
                  >
                    {child.icon}
                    <span className="text-xs uppercase font-black tracking-tight">{child.label}</span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente para items colapsables en el sidebar
function CollapsibleNavItem({ item }: { item: any }) {
  const location = useLocation();
  const isParentActive = item.children?.some((child: any) => location.pathname === child.path);
  const [isOpen, setIsOpen] = useState(isParentActive);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden group ${
          isParentActive || isOpen
            ? 'bg-slate-800/50 text-slate-200 border border-slate-700/50'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="relative z-10">{item.icon}</span>
          <span className="relative z-10 uppercase tracking-tighter text-xs font-bold">{item.label}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className={isParentActive ? 'text-emerald-400' : 'text-slate-500'} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-4 space-y-1"
          >
            {item.children.map((child: any) => (
              <NavLink
                key={child.key}
                to={child.path}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative ${
                  isActive
                    ? 'text-emerald-400 font-bold bg-emerald-500/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <span className="text-current opacity-70">{child.icon}</span>
                    <span className="uppercase tracking-tighter text-[11px]">{child.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeSubNav"
                        className="absolute right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RouterWrapper() {
  const { user, loading: authLoading, mustChangePassword, signOut } = useAuth();
  const { profile, loadingProfile, entityScope } = useSupabaseData();
  const location = useLocation();
  const routeFallback = (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Loader2 className="text-emerald-500 animate-spin" size={32} />
    </div>
  );

  if (location.pathname === '/manuales') {
    return (
      <Suspense fallback={routeFallback}>
        <ManualsScreen />
      </Suspense>
    );
  }

  if (authLoading || (user && loadingProfile)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-emerald-500 animate-spin" size={40} />
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Iniciando Sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={routeFallback}>
        <LoginScreen />
      </Suspense>
    );
  }

  if (mustChangePassword) {
    return (
      <Suspense fallback={routeFallback}>
        <ChangePasswordScreen />
      </Suspense>
    );
  }


  const serviceProfile = resolveServiceProfile(profile);
  const multiempresaLabel = entityScope.isMultiempresa
    ? (entityScope.activeEmpresa && entityScope.activeEmpresa !== 'all' ? entityScope.activeEmpresa : 'Consolidado general')
    : null;

  const navItems = [
    { key: 'dashboard', path: '/dashboard', label: 'DASHBOARD', icon: <Layout size={20} /> },
    { 
      key: 'analizador-ia', 
      label: serviceProfile.labels?.analizador || 'FREELANCER IA', 
      icon: <PieChart size={20} className="text-emerald-400" />,
      children: [
        { key: 'gastos', path: '/analizador-ia/gastos', label: 'EGRESOS IA', icon: <ArrowDownLeft size={20} /> },
        { key: 'ingresos', path: '/analizador-ia/ingresos', label: 'INGRESOS IA', icon: <ArrowUpRight size={20} /> },
      ]
    },
    { key: 'proyectos', path: '/proyectos', label: 'PROYECTOS', icon: <Layout size={20} /> },
    { key: 'servicios', path: '/servicios', label: 'SERVICIOS', icon: <ClipboardList size={20} className="text-teal-400" /> },
    { key: 'inventario', path: '/activos', label: 'ACTIVOS', icon: <PieChart size={20} /> },
    { key: 'reportes', path: '/analisis', label: serviceProfile.labels?.reportes || 'ANÁLISIS', icon: <PieChart size={20} /> },
    { key: 'settings', path: '/config', label: 'CONFIG', icon: <SettingsIcon size={20} /> },
  ];

  if (profile?.nivel_acceso === 1) {
    (navItems as any).push({ key: 'admin', path: '/admin', label: 'Admin Panel', icon: <ShieldCheck size={20} className="text-indigo-400" /> });
  }

  const hasBillingAccess = profile?.facturacion_habilitada || profile?.nivel_acceso === 1;

  const fallbackModules = hasBillingAccess
    ? ['dashboard', 'analizador-ia', 'gastos', 'ingresos', 'proyectos', 'servicios', 'inventario', 'reportes', 'settings']
    : ['dashboard', 'analizador-ia', 'gastos', 'ingresos', 'proyectos', 'servicios', 'inventario', 'reportes', 'settings'];

  const enabledModules = (() => {
    const baseModules = (profile?.modulos_habilitados && profile.modulos_habilitados.length > 0)
      ? profile.modulos_habilitados
      : (serviceProfile.modules.length > 0 ? serviceProfile.modules : fallbackModules);

    return baseModules;
  })();

  const allowedModules = new Set(enabledModules);

  const canAccess = (moduleKey: string) => {
    if (profile?.nivel_acceso === 1) return true;
    if (!allowedModules.has(moduleKey)) return false;
    return true;
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.children) {
      const visibleChildren = item.children.filter(child => canAccess(child.key));
      return visibleChildren.length > 0;
    }
    return canAccess(item.key);
  }).map(item => {
     if (item.children) {
       return { ...item, children: item.children.filter(child => canAccess(child.key)) };
     }
     return item;
  });

  const defaultRoute = canAccess('gastos')
    ? '/analizador-ia/gastos'
    : '/dashboard';

  const hiddenModuleKeys = new Set(['catalog', 'cobros', 'agenda', 'planificacion', 'set', 'conciliacion', 'cierre', 'sifen', 'clientes']);
  const experienceCards = serviceProfile.onboarding
    .filter((card) => !hiddenModuleKeys.has(card.moduleKey))
    .map((card) => ({
      ...card,
      enabled: canAccess(card.moduleKey),
    }));

  return (
      <SuspensionGuard>
        <div className="min-h-screen bg-slate-50 flex">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:flex w-64 bg-slate-900 flex-col sticky top-0 h-screen shadow-2xl z-40">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ rotate: 5 }}
                  className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"
                >
                  <Wallet size={22} />
                </motion.div>
                <div>
                  <h1 className="text-white font-black tracking-tighter text-xl leading-none">FINANCE <span className="text-emerald-400">PRO</span></h1>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">v2.0.0</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 mt-4">
              {filteredNavItems.map((item) => {
                if (item.children) {
                  return <CollapsibleNavItem key={item.key} item={item} />;
                }
                return (
                  <NavLink
                    key={item.key}
                    to={item.path!}
                    className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden group ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div 
                            layoutId="activeNav"
                            className="absolute left-0 w-1 h-6 bg-emerald-400 rounded-r-full"
                          />
                        )}
                        <span className="relative z-10">{item.icon}</span>
                        <span className="relative z-10 uppercase tracking-tighter text-xs">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              {entityScope.isMultiempresa && (
                <div className="bg-emerald-500/10 rounded-2xl p-4 mb-4 border border-emerald-500/20">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-1 tracking-widest">Modo Multiempresa</p>
                  <p className="text-xs text-white font-semibold truncate">{multiempresaLabel}</p>
                  <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">{entityScope.availableEmpresas.length} entidades habilitadas</p>
                </div>
              )}
              <div className="bg-slate-800/40 rounded-2xl p-4 mb-4 border border-slate-700/30">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Usuario</p>
                <p className="text-xs text-slate-300 truncate font-semibold">{user.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all font-bold text-sm"
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile Nav Top */}
            <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
               <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">
                  <Wallet size={18} />
                </div>
                <h1 className="font-black text-slate-900 tracking-tight">FINANCE <span className="text-emerald-500 font-bold">PRO</span></h1>
              </div>
              <button onClick={() => signOut()} className="text-slate-400 px-2 py-1">
                <LogOut size={20} />
              </button>
            </header>

            <main className="flex-1 p-4 lg:p-10 max-w-[1600px] mx-auto w-full bg-[#fcfdfe]">
              {location.pathname === '/dashboard' && (
                <div className="mb-6 lg:mb-8 bg-white border border-slate-100 rounded-3xl p-4 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-emerald-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Acceso Rápido — {serviceProfile.name}</p>
                    </div>
                    <Link to="/config" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
                      Cambiar perfil
                    </Link>
                  </div>
                  {entityScope.isMultiempresa && (
                    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Entidad operativa</p>
                        <p className="text-sm font-bold text-slate-800">{multiempresaLabel}</p>
                      </div>
                      <p className="text-[11px] font-medium text-slate-600">Permisos vigentes en {entityScope.availableEmpresas.length} entidades configuradas para este cliente.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {experienceCards.map((card) => (
                      <Link
                        key={card.key}
                        to={card.enabled ? card.path : '/config'}
                        className={`rounded-2xl border px-4 py-4 transition-all ${card.enabled
                          ? 'border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50'
                          : 'border-slate-100 bg-slate-50 opacity-60 cursor-default'}`}
                      >
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1">{card.title}</p>
                        <p className="text-[11px] font-medium text-slate-600">{card.description}</p>
                        {!card.enabled && (
                          <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Habilitar en Config →</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <AnimatePresence mode="wait">
                <Suspense fallback={routeFallback}>
                  <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Navigate to={defaultRoute} replace />} />
                  
                  <Route path="/dashboard" element={
                    canAccess('dashboard') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Dashboard />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/gastos" element={<Navigate to="/analizador-ia/gastos" replace />} />
                  <Route path="/ingresos" element={<Navigate to="/analizador-ia/ingresos" replace />} />
                  <Route path="/impresos" element={<Navigate to="/analizador-ia/gastos" replace />} />
                  <Route path="/impresos/gastos" element={<Navigate to="/analizador-ia/gastos" replace />} />
                  <Route path="/impresos/ingresos" element={<Navigate to="/analizador-ia/ingresos" replace />} />
                  <Route path="/analizador-ia" element={<Navigate to="/analizador-ia/gastos" replace />} />
                  <Route path="/analizador-ia/gastos" element={
                    canAccess('gastos') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Facturas initialTab="gastos" />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/centro-cobros" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/agenda" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/planificacion" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/asistente-set" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/fiscal/conciliacion" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/fiscal/cierre" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/analizador-ia/ingresos" element={
                    canAccess('ingresos') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Facturas initialTab="ingresos" />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/sifen" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/sifen/clientes" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/proyectos" element={
                    canAccess('proyectos') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Projects />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/servicios" element={
                    canAccess('servicios') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Servicios />
                      </motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/activos" element={
                    canAccess('inventario') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Inventario />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/catalog" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/analisis" element={
                    canAccess('reportes') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Reportes />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/config" element={
                    canAccess('settings') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Settings />
                      </motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  {profile?.nivel_acceso === 1 && (
                    <Route path="/admin" element={
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <AdminPanel />
                      </motion.div>
                    } />
                  )}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </AnimatePresence>
            </main>

            {/* Mobile Nav Bottom */}
            <nav className="lg:hidden bg-white/80 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around sticky bottom-0 z-50">
              {filteredNavItems.filter(item => item.key !== 'settings').map((item) => {
                if (item.children) {
                   return <MobileSubMenu key={item.key} item={item} />;
                }
                return (
                  <NavLink
                     key={item.key}
                     to={item.path!}
                     className={({ isActive }) => `flex flex-col items-center gap-1 p-2 min-w-[64px] relative ${
                       isActive ? 'text-emerald-600' : 'text-slate-400'
                     }`}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div 
                            layoutId="activeNavMobile"
                            className="absolute top-0 w-8 h-1 bg-emerald-500 rounded-b-full"
                          />
                        )}
                        <div className="text-xl leading-none">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
              <NavLink
                to="/config"
                className={({ isActive }) => `flex flex-col items-center gap-1 p-2 min-w-[64px] relative ${
                  isActive ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <SettingsIcon size={20} />
                <span className="text-[10px] font-black uppercase tracking-tighter">Config</span>
              </NavLink>
            </nav>
          </div>
        </div>
      </SuspensionGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouterWrapper />
    </BrowserRouter>
  );
}
