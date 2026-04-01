import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import Dashboard from './components/dashboard';
import Facturas from './components/facturas';
import Projects from './components/projects';
import Inventario from './components/inventario';
import Reportes from './components/reportes';
import Settings from './components/Settings';
import { Layout, LogOut, Loader2, ShieldCheck, PieChart, Wallet, Settings as SettingsIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import AdminPanel from './components/AdminPanel';
import { useSupabaseData } from './hooks/useSupabaseData';
import SuspensionGuard from './components/SuspensionGuard';
import ManualsScreen from './screens/ManualsScreen';

function RouterWrapper() {
  const { user, loading, mustChangePassword, signOut } = useAuth();
  const { profile } = useSupabaseData();
  const location = useLocation();

  if (location.pathname === '/manuales') {
    return <ManualsScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="text-emerald-500 animate-spin" size={40} />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (mustChangePassword) {
    return <ChangePasswordScreen />;
  }


  const navItems = [
    { key: 'dashboard', path: '/dashboard', label: 'DASHBOARD', icon: <Layout size={20} /> },
    { key: 'gastos', path: '/gastos', label: 'GASTOS', icon: <ArrowDownLeft size={20} /> },
    { key: 'ingresos', path: '/ingresos', label: 'INGRESOS', icon: <ArrowUpRight size={20} /> },
    { key: 'sifen', path: '/sifen', label: 'FACTURAS SIFEN', icon: <ShieldCheck size={20} /> },
    { key: 'proyectos', path: '/proyectos', label: 'PROYECTOS', icon: <Layout size={20} /> },
    { key: 'inventario', path: '/activos', label: 'ACTIVOS', icon: <PieChart size={20} /> },
    { key: 'reportes', path: '/analisis', label: 'ANÁLISIS', icon: <PieChart size={20} /> },
    { key: 'settings', path: '/config', label: 'CONFIG', icon: <SettingsIcon size={20} /> },
  ];

  if (profile?.nivel_acceso === 1) {
    (navItems as any).push({ key: 'admin', path: '/admin', label: 'Admin Panel', icon: <ShieldCheck size={20} className="text-indigo-400" /> });
  }

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
              {navItems.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path}
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
              ))}
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
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                      <Dashboard />
                    </motion.div>
                  } />
                  <Route path="/gastos" element={
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                      <Facturas initialTab="gastos" />
                    </motion.div>
                  } />
                  <Route path="/ingresos" element={
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                      <Facturas initialTab="ingresos" />
                    </motion.div>
                  } />
                  <Route path="/sifen" element={
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                      <Facturas initialTab="sifen" />
                    </motion.div>
                  } />
                  <Route path="/proyectos" element={
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                      <Projects />
                    </motion.div>
                  } />
                  <Route path="/activos" element={
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                      <Inventario />
                    </motion.div>
                  } />
                  <Route path="/analisis" element={
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                      <Reportes />
                    </motion.div>
                  } />
                  <Route path="/config" element={
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                      <Settings />
                    </motion.div>
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
              </AnimatePresence>
            </main>

            {/* Mobile Nav Bottom */}
            <nav className="lg:hidden bg-white/80 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around sticky bottom-0 z-50">
              {navItems.filter(item => item.key !== 'settings').map((item) => (
                <NavLink
                   key={item.key}
                   to={item.path}
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
              ))}
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
