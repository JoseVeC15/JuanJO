import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';

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
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
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
                  isActive ? 'text-emerald-400 font-bold bg-emerald-500/5' : 'text-slate-500 hover:text-slate-300'
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

interface SidebarProps {
  navItems: any[];
  userEmail: string;
  signOut: () => void;
  entityScope: any;
  multiempresaLabel: string | null;
}

export function Sidebar({ navItems, userEmail, signOut, entityScope, multiempresaLabel }: SidebarProps) {
  return (
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
            <h1 className="text-white font-black tracking-tighter text-xl leading-none">
              FINANCE <span className="text-emerald-400">PRO</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">v2.0.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 mt-4">
        {navItems.map((item) => {
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
            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">
              {entityScope.availableEmpresas.length} entidades habilitadas
            </p>
          </div>
        )}
        <div className="bg-slate-800/40 rounded-2xl p-4 mb-4 border border-slate-700/30">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Usuario</p>
          <p className="text-xs text-slate-300 truncate font-semibold">{userEmail}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
