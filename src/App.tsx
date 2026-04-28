import { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Home, LogOut, Loader2, ShieldCheck, BarChart3, Wallet, Settings as SettingsIcon, ArrowUpRight, ArrowDownLeft, ClipboardList, Sparkles, FolderOpen, Boxes, Receipt, Package2 } from 'lucide-react';
import { useSupabaseData } from './hooks/useSupabaseData';
import { resolveActiveModules, resolveServiceProfile } from './config/serviceProfiles';
import SuspensionGuard from './components/SuspensionGuard';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Toaster } from './components/ui/Toaster';
import { ConfirmDialog } from './components/ui/ConfirmDialog';

const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const ChangePasswordScreen = lazy(() => import('./screens/ChangePasswordScreen'));
const Dashboard = lazy(() => import('./components/dashboard'));
const GastosPage = lazy(() => import('./pages/GastosPage'));
const IngresosPage = lazy(() => import('./pages/IngresosPage'));
const Projects = lazy(() => import('./components/projects'));
const Inventario = lazy(() => import('./components/inventario'));
const Reportes = lazy(() => import('./components/reportes'));
const Settings = lazy(() => import('./components/Settings'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const ManualsScreen = lazy(() => import('./screens/ManualsScreen'));
const Servicios = lazy(() => import('./components/Servicios'));
const FacturacionAutoimpresor = lazy(() => import('./components/FacturacionAutoimpresor'));
const Productos = lazy(() => import('./components/Productos'));

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
    { key: 'dashboard', path: '/dashboard', label: 'Inicio', icon: <Home size={20} /> },
    {
      key: 'analizador-ia',
      label: serviceProfile.labels?.analizador || 'Mis Facturas',
      icon: <BarChart3 size={20} className="text-emerald-400" />,
      children: [
        { key: 'gastos', path: '/analizador-ia/gastos', label: 'Mis Compras', icon: <ArrowDownLeft size={20} /> },
        { key: 'ingresos', path: '/analizador-ia/ingresos', label: 'Mis Ventas', icon: <ArrowUpRight size={20} /> },
      ]
    },
    { key: 'proyectos', path: '/proyectos', label: 'Proyectos', icon: <FolderOpen size={20} /> },
    { key: 'servicios', path: '/servicios', label: 'Servicios', icon: <ClipboardList size={20} className="text-teal-400" /> },
    { key: 'inventario', path: '/activos', label: 'Inventario', icon: <Boxes size={20} /> },
    { key: 'facturas_virtuales', path: '/facturacion-virtual', label: 'Emitir Factura', icon: <Receipt size={20} className="text-indigo-400" /> },
    { key: 'productos_catalogo', path: '/productos', label: 'Catálogo', icon: <Package2 size={20} className="text-amber-400" /> },
    { key: 'reportes', path: '/analisis', label: serviceProfile.labels?.reportes || 'Reportes', icon: <BarChart3 size={20} /> },
    { key: 'settings', path: '/config', label: 'Ajustes', icon: <SettingsIcon size={20} /> },
  ];

  if (profile?.nivel_acceso === 1) {
    (navItems as any).push({ key: 'admin', path: '/admin', label: 'Admin Panel', icon: <ShieldCheck size={20} className="text-indigo-400" /> });
  }

  const enabledModules = resolveActiveModules(profile);
  const allowedModules = new Set(enabledModules);

  const canAccess = (moduleKey: string) => {
    if (profile?.nivel_acceso === 1) return true;
    if (moduleKey === 'facturas_virtuales' || moduleKey === 'productos_catalogo') return true;
    if (!allowedModules.has(moduleKey as (typeof enabledModules)[number])) return false;
    return true;
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.children) {
      return item.children.filter(child => canAccess(child.key)).length > 0;
    }
    return canAccess(item.key);
  }).map(item => {
    if (item.children) {
      return { ...item, children: item.children.filter(child => canAccess(child.key)) };
    }
    return item;
  });

  const defaultRoute = canAccess('gastos') ? '/analizador-ia/gastos' : '/dashboard';

  const hiddenModuleKeys = new Set(['catalog', 'cobros', 'agenda', 'planificacion', 'set', 'conciliacion', 'cierre', 'sifen', 'clientes']);
  const experienceCards = serviceProfile.onboarding
    .filter((card) => !hiddenModuleKeys.has(card.moduleKey))
    .map((card) => ({ ...card, enabled: canAccess(card.moduleKey) }));

  const pageTransition = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 } };

  return (
    <SuspensionGuard>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar
          navItems={filteredNavItems}
          userEmail={user.email!}
          signOut={signOut}
          entityScope={entityScope}
          multiempresaLabel={multiempresaLabel}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
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
                      <motion.div {...pageTransition}><Dashboard /></motion.div>
                    ) : <Navigate to="/config" replace />
                  } />

                  {/* Redirects legados */}
                  <Route path="/gastos" element={<Navigate to="/analizador-ia/gastos" replace />} />
                  <Route path="/ingresos" element={<Navigate to="/analizador-ia/ingresos" replace />} />
                  <Route path="/impresos" element={<Navigate to="/analizador-ia/gastos" replace />} />
                  <Route path="/impresos/gastos" element={<Navigate to="/analizador-ia/gastos" replace />} />
                  <Route path="/impresos/ingresos" element={<Navigate to="/analizador-ia/ingresos" replace />} />
                  <Route path="/analizador-ia" element={<Navigate to="/analizador-ia/gastos" replace />} />
                  <Route path="/centro-cobros" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/agenda" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/planificacion" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/asistente-set" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/fiscal/conciliacion" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/fiscal/cierre" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/sifen" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/sifen/clientes" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/catalog" element={<Navigate to="/dashboard" replace />} />

                  <Route path="/analizador-ia/gastos" element={
                    canAccess('gastos') ? (
                      <motion.div {...pageTransition}><GastosPage /></motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/analizador-ia/ingresos" element={
                    canAccess('ingresos') ? (
                      <motion.div {...pageTransition}><IngresosPage /></motion.div>
                    ) : <Navigate to="/config" replace />
                  } />

                  <Route path="/proyectos" element={
                    canAccess('proyectos') ? (
                      <motion.div {...pageTransition}><Projects /></motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/servicios" element={
                    canAccess('servicios') ? (
                      <motion.div {...pageTransition}><Servicios /></motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/activos" element={
                    canAccess('inventario') ? (
                      <motion.div {...pageTransition}><Inventario /></motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/facturacion-virtual" element={
                    canAccess('facturas_virtuales') ? (
                      <motion.div {...pageTransition}><FacturacionAutoimpresor /></motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/productos" element={
                    canAccess('productos_catalogo') ? (
                      <motion.div {...pageTransition}><Productos /></motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/analisis" element={
                    canAccess('reportes') ? (
                      <motion.div {...pageTransition}><Reportes /></motion.div>
                    ) : <Navigate to="/config" replace />
                  } />
                  <Route path="/config" element={
                    canAccess('settings') ? (
                      <motion.div {...pageTransition}><Settings /></motion.div>
                    ) : <Navigate to="/dashboard" replace />
                  } />
                  {profile?.nivel_acceso === 1 && (
                    <Route path="/admin" element={
                      <motion.div {...pageTransition}><AdminPanel /></motion.div>
                    } />
                  )}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </AnimatePresence>
          </main>

          <MobileNav navItems={filteredNavItems} />
        </div>
      </div>
      <Toaster />
      <ConfirmDialog />
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
