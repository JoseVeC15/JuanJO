import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, FileText, Download, Save, 
  X, Calculator, AlertCircle, ShoppingBag, 
  Info, Clock
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { generateProposalPDF } from '../utils/pdfGenerator';
import type { Proyecto, Propuesta, PropuestaItem } from '../data/sampleData';

interface ProposalCreatorProps {
  proyecto: Proyecto;
  onClose: () => void;
}

export default function ProposalCreator({ proyecto, onClose }: ProposalCreatorProps) {
  const { profile, savePropuesta, loadingPropuestas } = useSupabaseData();
  
  const [titulo, setTitulo] = useState(`Propuesta Comercial - ${proyecto.nombre_cliente}`);
  const [items, setItems] = useState<Partial<PropuestaItem>[]>([
    { id: Math.random().toString(), descripcion: proyecto.tipo_servicio, cantidad: 1, precio_unitario: proyecto.monto_presupuestado, iva_tipo: 10 }
  ]);
  const [notas, setNotas] = useState('Condiciones: Pago 50% anticipado, 50% contra entrega. Validez de la oferta: 15 días.');
  const [validoHasta, setValidoHasta] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Cálculos de Totales
  const resumen = useMemo(() => {
    let neto = 0;
    let iva10 = 0;
    let iva5 = 0;

    items.forEach(item => {
      const subtotal = (item.cantidad || 0) * (item.precio_unitario || 0);
      neto += subtotal;
      
      if (item.iva_tipo === 10) {
        iva10 += subtotal * 0.10;
      } else if (item.iva_tipo === 5) {
        iva5 += subtotal * 0.05;
      }
    });

    return {
      neto,
      iva10,
      iva5,
      bruto: neto + iva10 + iva5
    };
  }, [items]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), descripcion: '', cantidad: 1, precio_unitario: 0, iva_tipo: 10 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = async (generatePDF = false) => {
    try {
      const propuestaData: Partial<Propuesta> = {
        proyecto_id: proyecto.id,
        titulo,
        notas_condiciones: notas,
        total_neto: resumen.neto,
        total_iva_10: resumen.iva10,
        total_iva_5: resumen.iva5,
        total_bruto: resumen.bruto,
        valido_hasta: validoHasta,
        estado: 'pendiente'
      };

      const result = await savePropuesta(propuestaData, items);
      
      if (generatePDF && result && profile) {
        await generateProposalPDF({ 
          propuesta: { ...result, propuesta_items: items as PropuestaItem[] }, 
          profile 
        });
      }
      
      if (!generatePDF) onClose();
    } catch (error) {
      console.error(error);
      alert("Error al procesar la propuesta");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <FileText size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Creador de Propuesta</h2>
              <p className="text-sm text-gray-500 font-medium">Proyecto: {proyecto.nombre_cliente}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título de la Propuesta</label>
              <input 
                type="text" 
                value={titulo} 
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Validez de Oferta (Hasta)</label>
              <input 
                type="date" 
                value={validoHasta} 
                onChange={(e) => setValidoHasta(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-800"
              />
            </div>
          </div>

          {/* Items Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <ShoppingBag size={20} className="text-indigo-500" /> Detalle de Servicios
              </h3>
              <button onClick={addItem} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all">
                <Plus size={16} /> Añadir Ítem
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-12 gap-3 p-4 bg-white border border-gray-100 rounded-2xl items-center shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="col-span-5">
                      <input 
                        type="text" 
                        placeholder="Descripción del servicio..."
                        value={item.descripcion}
                        onChange={(e) => updateItem(item.id!, 'descripcion', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 font-bold text-gray-800 placeholder:text-gray-300"
                      />
                    </div>
                    <div className="col-span-1">
                      <input 
                        type="number" 
                        placeholder="1"
                        value={item.cantidad}
                        onChange={(e) => updateItem(item.id!, 'cantidad', parseFloat(e.target.value))}
                        className="w-full bg-gray-50/50 rounded-lg px-2 py-2 border-none focus:ring-1 focus:ring-indigo-500 font-bold text-center text-gray-800"
                      />
                    </div>
                    <div className="col-span-2 relative">
                      <input 
                        type="number" 
                        placeholder="0"
                        value={item.precio_unitario}
                        onChange={(e) => updateItem(item.id!, 'precio_unitario', parseFloat(e.target.value))}
                        className="w-full bg-gray-50/50 rounded-lg pl-8 pr-2 py-2 border-none focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-600"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 font-bold text-xs">₲</span>
                    </div>
                    <div className="col-span-2">
                      <select 
                        value={item.iva_tipo}
                        onChange={(e) => updateItem(item.id!, 'iva_tipo', parseInt(e.target.value))}
                        className="w-full bg-gray-50/50 rounded-lg px-3 py-2 border-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs text-gray-500"
                      >
                        <option value={10}>IVA 10%</option>
                        <option value={5}>IVA 5%</option>
                        <option value={0}>Exenta</option>
                      </select>
                    </div>
                    <div className="col-span-1 text-right font-black text-gray-900 text-xs">
                      {((item.cantidad || 0) * (item.precio_unitario || 0)).toLocaleString()}
                    </div>
                    <div className="col-span-1 text-right">
                      <button onClick={() => removeItem(item.id!)} className="p-2 text-gray-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Info size={12} /> Notas y Condiciones Legales
                </label>
                <textarea 
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full h-32 px-6 py-4 bg-gray-50 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-600 text-sm resize-none"
                  placeholder="Incluye detalles sobre el pago, plazos, etc."
                />
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  Asegúrate de que tu información de branding (Logo, Color, Portafolio) esté configurada en Ajustes para un mejor acabado profesional.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Resumen Financiero</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Subtotal Neto</span>
                  <span className="font-bold">{resumen.neto.toLocaleString()} Gs.</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">IVA 10% (+)</span>
                  <span className="font-bold text-emerald-400">+{resumen.iva10.toLocaleString()} Gs.</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">IVA 5% (+)</span>
                  <span className="font-bold text-emerald-400">+{resumen.iva5.toLocaleString()} Gs.</span>
                </div>
                <div className="h-px bg-white/10 my-4" />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Inversión Final</p>
                    <p className="text-4xl font-black">{resumen.bruto.toLocaleString()} <span className="text-lg text-slate-600">Gs.</span></p>
                  </div>
                  <Calculator size={32} className="text-white/5 mb-2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button onClick={onClose} className="px-8 py-4 text-gray-500 font-black uppercase tracking-widest text-xs">
            Cancelar
          </button>
          <div className="flex gap-4">
            <button 
              onClick={() => handleSave(false)}
              disabled={loadingPropuestas}
              className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              <Save size={18} /> Guardar Borrador
            </button>
            <button 
              onClick={() => handleSave(true)}
              disabled={loadingPropuestas}
              className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 hover:scale-105 transition-all disabled:opacity-50"
            >
              {loadingPropuestas ? <Clock size={18} className="animate-spin" /> : <Download size={18} />}
              Generar y Descargar PDF
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
