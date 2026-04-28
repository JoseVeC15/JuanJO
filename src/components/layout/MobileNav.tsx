import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

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
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="absolute -right-2 -top-1">
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
              className="fixed bottom-[64px] left-2 right-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 overflow-hidden max-h-[60vh] overflow-y-auto"
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

interface MobileNavProps {
  navItems: any[];
}

export function MobileNav({ navItems }: MobileNavProps) {
  const MAX_ITEMS = 5;

  if (navItems.length <= MAX_ITEMS) {
    return (
      <nav className="lg:hidden bg-white/90 backdrop-blur-md border-t border-slate-200 px-1 py-1 flex items-center justify-around sticky bottom-0 z-50">
        {navItems.map((item) => {
          if (item.children) {
            return <MobileSubMenu key={item.key} item={item} />;
          }
          return (
            <NavLink
              key={item.key}
              to={item.path!}
              className={({ isActive }) => `flex flex-col items-center gap-1 p-2 min-w-[60px] relative transition-colors ${
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
                  <div className="text-xl leading-none">{item.icon}</div>
                  <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight max-w-[56px] truncate">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    );
  }

  const visible = navItems.slice(0, MAX_ITEMS - 1);
  const more = navItems.slice(MAX_ITEMS - 1);

  return (
    <nav className="lg:hidden bg-white/90 backdrop-blur-md border-t border-slate-200 px-1 py-1 flex items-center justify-around sticky bottom-0 z-50">
      {visible.map((item) =>
        item.children ? (
          <MobileSubMenu key={item.key} item={item} />
        ) : (
          <NavLink
            key={item.key}
            to={item.path!}
            className={({ isActive }) => `flex flex-col items-center gap-1 p-2 min-w-[60px] relative transition-colors ${
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
                <div className="text-xl leading-none">{item.icon}</div>
                <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight max-w-[56px] truncate">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        )
      )}
      <MobileSubMenu
        item={{ key: 'more', label: 'MÁS', icon: <ChevronDown size={20} />, children: more }}
      />
    </nav>
  );
}
