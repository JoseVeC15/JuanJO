import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import Dashboard from './components/dashboard';
import Facturas from './components/facturas';
import Projects from './components/projects';
import Inventario from './components/inventario';
import Reportes from './components/reportes';
import { Layout, LogOut, Loader2 } from 'lucide-react';

type Page = 'dashboard' | 'facturas' | 'proyectos' | 'inventario' | 'reportes';

function App() {
  const { user, loading, signOut } = useAuth();
  const [activePage, setActivePage] = useState<Page>('dashboard');

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

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />;
      case 'facturas': return <Facturas />;
      case 'proyectos': return <Projects />;
      case 'inventario': return <Inventario />;
      case 'reportes': return <Reportes />;
      default: return <Dashboard onNavigate={setActivePage} />;
    }
  };

  const navItems: { key: Page; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <Layout size={20} /> },
    { key: 'facturas', label: 'Facturas', icon: '🧾' },
    { key: 'proyectos', label: 'Proyectos', icon: '📂' },
    { key: 'inventario', label: 'Inventario', icon: '📦' },
    { key: 'reportes', label: 'Reportes', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-lg">
              🏙️
            </div>
            <h1 className="text-white font-bold tracking-tight">FINANCE</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activePage === item.key
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-2xl p-4 mb-4">
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
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
              🏙️
            </div>
            <h1 className="font-bold text-slate-900">FINANCE</h1>
          </div>
          <button onClick={() => signOut()} className="text-slate-400 px-2 py-1">
            <LogOut size={20} />
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
          {renderPage()}
        </main>

        {/* Mobile Nav Bottom */}
        <nav className="lg:hidden bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around sticky bottom-0 z-50">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${
                activePage === item.key ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <div className="text-xl leading-none">
                {item.icon}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default App;
