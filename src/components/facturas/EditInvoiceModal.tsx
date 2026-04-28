import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Scan, Sparkles } from 'lucide-react';
import { calculateSuggestedVAT10, calculateSuggestedVAT5 } from '../../data/sampleData';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { ModalInput } from './InvoiceWidgets';
import { confirmAsync } from '../../lib/confirm';

interface Props {
  item: any;
  onClose: () => void;
  onSave: (data: any) => void;
  onMove: (item: any, fromType: 'gastos' | 'ingresos') => void;
  isSaving: boolean;
}

export function EditInvoiceModal({ item, onClose, onSave, onMove, isSaving }: Props) {
  const isGasto = !!item.proveedor;
  const { checkDuplicateInvoice, suggestCategory } = useSupabaseData();
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const initialData = (() => {
    const { id: _id, user_id: _uid, created_at: _cat, processed_by_n8n: _p, is_suggested_vat: _s, ...cleanBase } = item;
    if (cleanBase.monto > 0 && !cleanBase.iva_10 && !cleanBase.iva_5 && !cleanBase.exentas) {
      return { ...cleanBase, ...calculateSuggestedVAT10(cleanBase.monto) };
    }
    return cleanBase;
  })();

  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    const check = async () => {
      const ruc = isGasto ? formData.ruc_proveedor : formData.ruc_cliente;
      if (ruc && formData.numero_factura && formData.timbrado) {
        const isDuplicate = await checkDuplicateInvoice(ruc, formData.numero_factura, formData.timbrado);
        setDuplicateWarning(isDuplicate);
      }
    };
    check();
  }, [formData.ruc_proveedor, formData.ruc_cliente, formData.numero_factura, formData.timbrado]);

  const handleProviderChange = (val: string) => {
    const update: any = { [isGasto ? 'proveedor' : 'cliente']: val };
    if (isGasto) {
      const suggestion = suggestCategory(val);
      if (suggestion !== 'Otros') update.tipo_gasto = suggestion;
    }
    setFormData({ ...formData, ...update });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateVal = isGasto ? formData.fecha_factura : (formData.fecha || formData.fecha_emision);
    const year = new Date(dateVal).getFullYear();
    if (year < 2000 || year > new Date().getFullYear() + 1) {
      alert(`⚠️ La fecha (${year}) es inválida para el ejercicio fiscal actual.`);
      return;
    }
    onSave(formData);
  };

  const handleMove = async () => {
    const ok = await confirmAsync({
      message: `¿Mover este documento a ${isGasto ? 'INGRESOS' : 'GASTOS'}?`,
      confirmLabel: 'Sí, mover',
      danger: false,
    });
    if (ok) onMove(item, isGasto ? 'gastos' : 'ingresos');
  };

  const ESTADOS_GASTO = ['pendiente_clasificar', 'registrada', 'en_proceso_pago', 'pagada'];
  const ESTADOS_INGRESO = ['pendiente', 'pagado'];
  const estados = isGasto ? ESTADOS_GASTO : ESTADOS_INGRESO;

  const ESTADO_LABELS: Record<string, string> = {
    pendiente_clasificar: 'Sin clasificar',
    registrada: 'Registrada',
    en_proceso_pago: 'En proceso',
    pagada: 'Pagada',
    pendiente: 'Sin cobrar',
    pagado: 'Cobrada',
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-4xl p-5 lg:p-12 shadow-2xl my-auto mx-2 overflow-y-auto max-h-[95vh]"
      >
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Corregir Documento</h3>
            <p className="text-gray-400 font-medium text-sm mt-1">Ajustá los datos si la IA cometió algún error.</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 hover:rotate-90 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2">
              <ModalInput
                label={isGasto ? 'Razón Social Proveedor' : 'Nombre del Cliente'}
                value={isGasto ? formData.proveedor : formData.cliente}
                onChange={handleProviderChange}
              />
            </div>
            <ModalInput
              label="RUC"
              hint="Registro Único del Contribuyente — identifica al proveedor o cliente ante el SET. Tiene formato XXXXXXXX-X."
              value={isGasto ? formData.ruc_proveedor : formData.ruc_cliente}
              onChange={(v) => setFormData({ ...formData, [isGasto ? 'ruc_proveedor' : 'ruc_cliente']: v })}
            />
            <ModalInput
              label="Nro. Factura"
              hint="Número de la factura en formato 001-001-0000001 (punto de expedición - talonario - número)."
              value={formData.numero_factura}
              onChange={(v) => setFormData({ ...formData, numero_factura: v })}
            />
            <div className="relative group">
              <ModalInput
                label="Timbrado"
                hint="Código de 8 dígitos que el SET otorga para autorizar la emisión de facturas. Cada timbrado tiene una fecha de vencimiento."
                value={formData.timbrado}
                onChange={(v) => setFormData({ ...formData, timbrado: v })}
                className={duplicateWarning ? 'ring-2 ring-rose-500/50' : ''}
              />
              {duplicateWarning && (
                <div className="absolute -top-1 right-0 bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-bounce">
                  ¡POSIBLE DUPLICADO!
                </div>
              )}
            </div>
            <ModalInput
              label="Fecha" type="date"
              value={isGasto ? formData.fecha_factura : formData.fecha_emision}
              onChange={(v) => setFormData({ ...formData, [isGasto ? 'fecha_factura' : 'fecha_emision']: v })}
            />
            <ModalInput
              label="Monto Bruto (₲)" type="number"
              hint="Monto total de la factura incluyendo todos los impuestos (IVA 10% + IVA 5% + Exentas)."
              value={formData.monto}
              onChange={(v) => setFormData({ ...formData, monto: Number(v) })}
            />
            <div className="relative group">
              <ModalInput
                label="IVA 10% (₲)" type="number"
                hint="Impuesto al Valor Agregado a tasa general del 10%. Se calcula como: Monto × 10/110. Aplica a mayoría de productos y servicios."
                value={formData.iva_10 || 0}
                onChange={(v) => setFormData({ ...formData, iva_10: Number(v) })}
                className="pr-12"
              />
              <button type="button"
                onClick={() => setFormData({ ...formData, ...calculateSuggestedVAT10(formData.monto) })}
                className="absolute right-3 top-9 p-1.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-indigo-100"
                title="Auto-calcular IVA 10%"><Scan size={14} /></button>
            </div>
            <div className="relative group">
              <ModalInput
                label="IVA 5% (₲)" type="number"
                hint="Tasa reducida del 5% para alimentos de primera necesidad, medicamentos, y algunos servicios esenciales."
                value={formData.iva_5 || 0}
                onChange={(v) => setFormData({ ...formData, iva_5: Number(v) })}
                className="pr-12"
              />
              <button type="button"
                onClick={() => setFormData({ ...formData, ...calculateSuggestedVAT5(formData.monto) })}
                className="absolute right-3 top-9 p-1.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-emerald-100"
                title="Auto-calcular IVA 5%"><Scan size={14} /></button>
            </div>
            <ModalInput
              label="Exentas (₲)" type="number"
              hint="Operaciones que no generan IVA: servicios educativos, alquileres habitacionales, exportaciones, etc."
              value={formData.exentas || 0}
              onChange={(v) => setFormData({ ...formData, exentas: Number(v) })}
            />

            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Estado del Documento</label>
              <div className="flex flex-wrap gap-3">
                {estados.map(est => (
                  <button key={est} type="button" onClick={() => setFormData({ ...formData, estado: est })}
                    className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition-all ${formData.estado === est ? 'bg-slate-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                    {ESTADO_LABELS[est] || est}
                  </button>
                ))}
              </div>
            </div>

            {isGasto && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-4 border-t border-gray-50">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-500" /> Categoría de Gasto
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Marketing & Publicidad', 'Combustible & Transporte', 'Viáticos & Alimentación', 'Software & Nube', 'Recursos Creativos', 'Gasto Operativo', 'Otros'].map(cat => (
                    <button key={cat} type="button" onClick={() => setFormData({ ...formData, tipo_gasto: cat })}
                      className={`px-3 py-2 rounded-xl font-bold text-[9px] uppercase transition-all ${formData.tipo_gasto === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6">
            <button type="submit" disabled={isSaving} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={handleMove}
              className="px-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all text-xs">
              Pasar a {isGasto ? 'Ingreso' : 'Gasto'}
            </button>
            <button type="button" onClick={onClose} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs">
              Cancelar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
