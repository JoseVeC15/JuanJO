import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ChevronLeft, 
  BookOpen, 
  Search, 
  ArrowLeft, 
  FileText, 
  Activity, 
  Shield, 
  Zap, 
  Layout, 
  PieChart,
  ChevronRight,
  Wallet,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MANUALS = [
  { id: '00_BIENVENIDA.md', title: 'Bienvenida', icon: <BookOpen size={18} />, description: 'Introducción a Finance Pro' },
  { id: '01_DASHBOARD_ESTRATEGICO.md', title: 'Dashboard', icon: <Layout size={18} />, description: 'Control total de tus finanzas' },
  { id: '02_GESTION_DOCUMENTAL.md', title: 'Gastos e Ingresos', icon: <Zap size={18} />, description: 'Procesamiento automático' },
  { id: '03_CENTRO_PROYECTOS.md', title: 'Proyectos', icon: <Activity size={18} />, description: 'Seguimiento de rentabilidad' },
  { id: '04_CONTROL_ACTIVOS.md', title: 'Activos', icon: <Shield size={18} />, description: 'Inventario y depreciación' },
  { id: '05_REPORTES_Y_AUDITORIA.md', title: 'Reportes', icon: <PieChart size={18} />, description: 'Análisis profundo de datos' },
  { id: '06_GESTION_FREELANCER.md', title: 'Freelancer', icon: <Briefcase size={18} />, description: 'Agenda, Catálogo y Planificación' },
  { id: '07_ASISTENTE_FISCAL_SET.md', title: 'Asistente SET', icon: <ShieldCheck size={18} />, description: 'Compliance y Fiscalidad' },
  { id: '08_CUMPLIMIENTO_DNIT_SIFEN.md', title: 'Sifen / DNIT', icon: <ShieldCheck size={18} />, description: 'Facturación Electrónica' },
  { id: '09_GUIA_FISCAL_PARAGUAY.md', title: 'Guia Fiscal PY', icon: <FileText size={18} />, description: 'Normativa SET Completa' },
];

export default function ManualsScreen() {
  const [selectedManual, setSelectedManual] = useState(MANUALS[0]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchManual = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/manuales/${selectedManual.id}`);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Error loading manual:', error);
        setContent('# Error\nNo se pudo cargar el manual seleccionado.');
      } finally {
        setLoading(false);
      }
    };

    fetchManual();
  }, [selectedManual]);

  const filteredManuals = MANUALS.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] grid grid-cols-1 lg:grid-cols-[320px_1fr] lg:overflow-hidden font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar */}
      <aside className="bg-white border-b lg:border-r border-slate-200 flex flex-col h-auto lg:h-screen shadow-sm z-20">
        <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors text-sm font-bold mb-6 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            VOLVER AL LOGIN
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-md shadow-emerald-500/10">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="font-black text-slate-900 leading-none tracking-tighter text-xl">CENTRO DE <span className="text-emerald-500">AYUDA</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manuales de Usuario</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar tema..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[35vh] lg:max-h-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {filteredManuals.map((manual) => (
            <button
               key={manual.id}
              onClick={() => {
                setSelectedManual(manual);
                if (window.innerWidth < 1024) {
                   setTimeout(() => document.getElementById('manual-content')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
                selectedManual.id === manual.id 
                  ? 'bg-emerald-50 border-emerald-100' 
                  : 'hover:bg-slate-50 border-transparent'
              } border`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                selectedManual.id === manual.id 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                  : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
              }`}>
                {manual.icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-bold truncate ${
                   selectedManual.id === manual.id ? 'text-emerald-900' : 'text-slate-700'
                }`}>
                  {manual.title}
                </p>
                <p className="text-[11px] text-slate-400 font-medium truncate italic antialiased leading-tight mt-0.5">
                  {manual.description}
                </p>
              </div>
              {selectedManual.id === manual.id && (
                <motion.div layoutId="activePointer" className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 italic">
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
            * Finance Pro se reserva el derecho de actualizar estas funcionalidades para mejorar la experiencia del usuario.
          </p>
        </div>
      </aside>

      {/* Content Area */}
      <main id="manual-content" className="w-full h-auto lg:h-screen overflow-y-auto bg-white relative selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
        <div className="w-full max-w-4xl mx-auto px-6 py-12 lg:px-12 lg:py-20 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedManual.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="prose prose-slate prose-emerald max-w-none prose-headings:font-black prose-h1:text-4xl prose-h1:tracking-tighter prose-h1:mb-8 prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900 prose-img:rounded-3xl prose-img:shadow-2xl prose-img:my-12 prose-li:text-slate-600 prose-code:text-emerald-600 prose-code:bg-emerald-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none"
            >
              {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Activity className="text-emerald-500" size={32} />
                  </motion.div>
                </div>
              ) : (
                 <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      blockquote: ({node, children, ...props}) => {
                        // Extract text deep from react node to check if it's an alert
                        const extractText = (elem: any): string => {
                          if (typeof elem === 'string') return elem;
                          if (Array.isArray(elem)) return elem.map(extractText).join('');
                          if (elem && elem.props && elem.props.children) return extractText(elem.props.children);
                          return '';
                        };
                        
                        const text = extractText(children);

                        const isNote = text.includes('[!NOTE]');
                        const isTip = text.includes('[!TIP]');
                        const isImport = text.includes('[!IMPORTANT]');
                        const isWarn = text.includes('[!WARNING]');
                        const isCaution = text.includes('[!CAUTION]');

                        if (isNote || isTip || isImport || isWarn || isCaution) {
                           let bgClass = 'bg-slate-100 border-slate-300';
                           let icon = 'ℹ️';
                           let title = 'NOTA';
                           let titleClass = 'text-slate-700';

                           if (isTip) { bgClass = 'bg-emerald-50 border-emerald-200'; icon = '💡'; title = 'CONSEJO'; titleClass = 'text-emerald-800'; }
                           if (isImport) { bgClass = 'bg-blue-50 border-blue-200'; icon = '⭐'; title = 'IMPORTANTE'; titleClass = 'text-blue-800'; }
                           if (isWarn) { bgClass = 'bg-amber-50 border-amber-200'; icon = '⚠️'; title = 'ADVERTENCIA'; titleClass = 'text-amber-800'; }
                           if (isCaution) { bgClass = 'bg-red-50 border-red-200'; icon = '🛑'; title = 'PRECAUCIÓN'; titleClass = 'text-red-800'; }

                           // Clean up the bracket text from children
                           const cleanChildren = React.Children.map(children, child => {
                              if (React.isValidElement(child)) {
                                  const childEl = child as React.ReactElement<any>;
                                  const textVal = childEl.props.children;
                                  if (typeof textVal === 'string') {
                                      return React.cloneElement(childEl, {}, textVal.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/g, ''));
                                  }
                                  if (Array.isArray(textVal)) {
                                      const cleanedArray = textVal.map((t: any) => typeof t === 'string' ? t.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/g, '') : t);
                                      return React.cloneElement(childEl, {}, cleanedArray);
                                  }
                              }
                              return child;
                           });

                           return (
                             <div className={`my-6 rounded-xl border-l-4 p-4 ${bgClass}`}>
                               <div className={`font-bold text-xs flex items-center gap-2 mb-2 uppercase tracking-widest ${titleClass}`}>
                                  <span>{icon}</span> {title}
                               </div>
                               <div className="text-sm m-0 [&>p]:m-0 opacity-90">
                                 {cleanChildren}
                               </div>
                             </div>
                           );
                        }

                        // Default blockquote
                        return <blockquote className="border-l-4 border-slate-200 pl-4 italic text-slate-500 my-6" {...props}>{children}</blockquote>;
                      }
                    }}
                 >
                  {content}
                 </ReactMarkdown>
              )}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-20 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                 <BookOpen size={16} />
               </div>
               <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">FINANCE PRO DOCUMENTATION</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">v2.0.0</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <button 
                onClick={() => window.print()}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-xs font-bold"
               >
                 <FileText size={14} className="group-hover:scale-110 transition-transform" />
                 DESCARGAR PDF
               </button>
               <button 
                onClick={() => navigate('/')}
                className="group flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition-all text-xs font-bold shadow-lg shadow-slate-900/10"
               >
                 EMPEZAR AHORA
                 <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </footer>
        </div>

        {/* Action Button Floater */}
        <div className="fixed bottom-8 right-8 lg:hidden">
          <button 
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
             className="w-12 h-12 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          >
            <ChevronLeft size={24} className="rotate-90" />
          </button>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
}
