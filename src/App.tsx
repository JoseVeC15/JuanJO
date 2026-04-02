import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout, LogOut, Loader2, ShieldCheck, PieChart, Wallet, Settings as SettingsIcon, ArrowUpRight, ArrowDownLeft, ChevronDown, Briefcase, Calendar, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { useSupabaseData } from './hooks/useSupabaseData';
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
const CentroCobros = lazy(() => import('./components/CentroCobros'));
const AgendaFreelancer = lazy(() => import('./components/AgendaFreelancer'));
const AsistenteSET = lazy(() => import('./components/AsistenteSET'));
const Disponibilidad = lazy(() => import('./components/Disponibilidad'));
const ConciliacionBancaria = lazy(() => import('./components/ConciliacionBancaria'));
const CierreMensualWizard = lazy(() => import('./components/CierreMensualWizard'));

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
  const { profile, loadingProfile } = useSupabaseData();
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


  const navItems = [
    { key: 'dashboard', path: '/dashboard', label: 'DASHBOARD', icon: <Layout size={20} /> },
    { 
      key: 'analizador-ia', 
      label: 'ANALIZADOR IA', 
      icon: <PieChart size={20} className="text-emerald-400" />,
      children: [
        { key: 'gastos', path: '/analizador-ia/gastos', label: 'GASTOS', icon: <ArrowDownLeft size={20} /> },
        { key: 'ingresos', path: '/analizador-ia/ingresos', label: 'INGRESOS', icon: <ArrowUpRight size={20} /> },
      ]
    },
    {
      key: 'gestion-freelancer',
      label: 'GESTIÓN',
      icon: <Briefcase size={20} className="text-blue-400" />,
      children: [
        { key: 'cobros', path: '/centro-cobros', label: 'COBROS', icon: <Wallet size={20} /> },
        { key: 'agenda', path: '/agenda', label: 'AGENDA', icon: <Calendar size={20} /> },
        { key: 'planificacion', path: '/planificacion', label: 'DISPONIBILIDAD', icon: <Calendar size={20} /> },
      ]
    },
    {
      key: 'fiscal-auditoria',
      label: 'FISCAL & AUDITORÍA',
      icon: <ShieldCheck size={20} className="text-amber-400" />,
      children: [
        { key: 'set', path: '/asistente-set', label: 'ASISTENTE SET', icon: <ShieldCheck size={18} /> },
        { key: 'conciliacion', path: '/fiscal/conciliacion', label: 'CONCILIACIÓN', icon: <ArrowRightLeft size={18} /> },
        { key: 'cierre', path: '/fiscal/cierre', label: 'CIERRE MENSUAL', icon: <CheckCircle2 size={18} /> },
      ]
    },
    { key: 'sifen', path: '/sifen', label: 'FACTURAS SIFEN', icon: <ShieldCheck size={20} /> },
    { key: 'proyectos', path: '/proyectos', label: 'PROYECTOS', icon: <Layout size={20} /> },
    { key: 'inventario', path: '/activos', label: 'ACTIVOS', icon: <PieChart size={20} /> },
    { key: 'reportes', path: '/analisis', label: 'ANÁLISIS', icon: <PieChart size={20} /> },
    { key: 'settings', path: '/config', label: 'CONFIG', icon: <SettingsIcon size={20} /> },
  ];

  if (profile?.nivel_acceso === 1) {
    (navItems as any).push({ key: 'admin', path: '/admin', label: 'Admin Panel', icon: <ShieldCheck size={20} className="text-indigo-400" /> });
  }

  const hasBillingAccess = profile?.facturacion_habilitada || profile?.nivel_acceso === 1;

  const fallbackModules = hasBillingAccess
    ? ['dashboard', 'analizador-ia', 'gastos', 'ingresos', 'gestion-freelancer', 'cobros', 'agenda', 'planificacion', 'set', 'conciliacion', 'cierre', 'sifen', 'clientes', 'proyectos', 'inventario', 'reportes', 'settings']
    : ['dashboard', 'analizador-ia', 'gastos', 'ingresos', 'gestion-freelancer', 'cobros', 'agenda', 'planificacion', 'set', 'conciliacion', 'cierre', 'proyectos', 'inventario', 'reportes', 'settings'];

  const enabledModules = (() => {
    const baseModules = (profile?.modulos_habilitados && profile.modulos_habilitados.length > 0)
      ? profile.modulos_habilitados
      : fallbackModules;

    if (!hasBillingAccess) {
      return baseModules;
    }

    return Array.from(new Set([...baseModules, 'sifen', 'clientes']));
  })();

  const canAccess = (moduleKey: string) => {
    if (profile?.nivel_acceso === 1) return true;
    if (!enabledModules.includes(moduleKey)) return false;
    if (['sifen', 'clientes'].includes(moduleKey) && !hasBillingAccess) return false;
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
              <AnimatePresence mode="wait">
                <Suspense fallback={routeFallback}>
                  <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Rutas Protegidas de Facturación */}
                  {!(hasBillingAccess) && (
                    <>
                      <Route path="/sifen" element={<Navigate to={canAccess('dashboard') ? '/dashboard' : '/config'} replace />} />
                      <Route path="/sifen/clientes" element={<Navigate to={canAccess('dashboard') ? '/dashboard' : '/config'} replace />} />
                    </>
                  )}
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
                  <Route path="/centro-cobros" element={
                    canAccess('cobros') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <CentroCobros />
                      </motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/agenda" element={
                    canAccess('agenda') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <AgendaFreelancer />
                      </motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/planificacion" element={
                    canAccess('planificacion') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Disponibilidad />
                      </motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/asistente-set" element={
                    canAccess('set') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <AsistenteSET />
                      </motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/fiscal/conciliacion" element={
                    canAccess('conciliacion') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <ConciliacionBancaria />
                      </motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/fiscal/cierre" element={
                    canAccess('cierre') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <CierreMensualWizard />
                      </motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/analizador-ia/ingresos" element={
                    canAccess('ingresos') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Facturas initialTab="ingresos" />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/sifen" element={
                    canAccess('sifen') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Facturas initialTab="sifen" />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/sifen/clientes" element={
                    canAccess('clientes') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Facturas initialTab="clientes" />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/proyectos" element={
                    canAccess('proyectos') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Projects />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/activos" element={
                    canAccess('inventario') ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Inventario />
                      </motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
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
