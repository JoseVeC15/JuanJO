import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { calculateSuggestedVAT10 } from '../data/sampleData';
import { useAuth } from '../contexts/AuthContext';
import type { Proyecto, FacturaGasto, Equipo, Alerta, Ingreso, Profile, AgendaTarea, EstadoIngreso, RegistroHora, Propuesta, PropuestaItem } from '../data/sampleData';

export function useSupabaseData() {
  const queryClient = useQueryClient();
  const { user: sessionUser } = useAuth();
  const [loadingPropuestas, setLoadingPropuestas] = useState(false);

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre_completo, email, nivel_acceso, estado, facturacion_habilitada, modulos_habilitados, logo_url, color_primario, portfolio_url, telefono_contacto, direccion_fisica, created_at')
        .eq('id', sessionUser?.id)
        .single();
      if (error) throw error;
      return data as Profile;
    }
  });

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('razon_social', { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    }
  });

  const { data: proyectos = [], isLoading: loadingProyectos, error: errorProyectos } = useQuery({
    queryKey: ['proyectos', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre_cliente, tipo_servicio, descripcion, fecha_inicio, fecha_entrega, monto_presupuestado, monto_facturado, margen_objetivo, precio_hora, horas_estimadas, unidad_tiempo, estado, created_at')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Proyecto[];
    }
  });

  const { data: facturasGastosRaw = [], isLoading: loadingFacturas, error: errorFacturas } = useQuery({
    queryKey: ['facturas_gastos', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas_gastos')
        .select('id, proyecto_id, monto, fecha_factura, proveedor, ruc_proveedor, numero_factura, timbrado, tipo_gasto, iva_10, iva_5, exentas, estado, metodo_pago, created_at')
        .order('fecha_factura', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as FacturaGasto[];
    }
  });

  const facturasGastos = useMemo(() => facturasGastosRaw.map(g => {
    if (g.monto > 0 && (g.iva_10 || 0) === 0 && (g.iva_5 || 0) === 0 && (g.exentas || 0) === 0) {
      return { ...g, ...calculateSuggestedVAT10(g.monto), is_suggested_vat: true };
    }
    return g;
  }), [facturasGastosRaw]);

  const { data: inventarioEquipo = [], error: errorEquipo } = useQuery({
    queryKey: ['inventario_equipo', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventario_equipo')
        .select('id, nombre, tipo, condicion, tipo_propiedad, ubicacion, created_at, valor_actual, costo_renta_dia, fecha_fin_renta, marca_modelo, numero_serie')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Equipo[];
    }
  });

  const { data: ingresosRaw = [], isLoading: loadingIngresos, error: errorIngresos } = useQuery({
    queryKey: ['ingresos', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingresos')
        .select('id, proyecto_id, cliente, ruc_cliente, numero_factura, timbrado, monto, iva_10, iva_5, exentas, fecha_emision, fecha_vencimiento, estado, metodo_pago, created_at')
        .order('fecha_emision', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Ingreso[];
    }
  });

  const { data: agendaTareas = [], isLoading: loadingAgenda } = useQuery({
    queryKey: ['agenda_tareas', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agenda_tareas')
        .select('*')
        .order('fecha_limite', { ascending: true });
      if (error && error.code !== 'PGRST116') throw error;
      return (data || []) as AgendaTarea[];
    }
  });

  const ingresos = useMemo(() => ingresosRaw.map(i => {
    if (i.monto > 0 && (i.iva_10 || 0) === 0 && (i.iva_5 || 0) === 0 && (i.exentas || 0) === 0) {
      return { ...i, ...calculateSuggestedVAT10(i.monto), is_suggested_vat: true };
    }
    return i;
  }), [ingresosRaw]);

  const { data: perfilFiscal, isLoading: cargandoPerfilFiscal } = useQuery({
    queryKey: ['perfil_fiscal', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfiles_fiscales')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const { data: configSifen, isLoading: cargandoSifen } = useQuery({
    queryKey: ['configuracion_sifen', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracion_sifen')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const { data: documentosElectronicos = [], isLoading: cargandoDocsSifen } = useQuery({
    queryKey: ['documentos_electronicos', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos_electronicos')
        .select('*, documentos_items(*)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    }
  });

  const { data: horasTrabajadas = [], isLoading: loadingHoras } = useQuery({
    queryKey: ['horas_trabajadas', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('horas_trabajadas')
        .select('*')
        .order('fecha', { ascending: false });
      if (error && error.code !== 'PGRST116') throw error;
      return (data || []) as RegistroHora[];
    }
  });

  const { data: propuestas = [], isLoading: loadingPropuestasQuery } = useQuery({
    queryKey: ['propuestas', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propuestas')
        .select('*, propuesta_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as (Propuesta & { propuesta_items: PropuestaItem[] })[];
    }
  });

  const { data: bloqueos = [], isLoading: loadingBloqueos } = useQuery({
    queryKey: ['calendario_bloqueos', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendario_bloqueos')
        .select('*')
        .order('date', { ascending: true });
      if (error && error.code !== 'PGRST116') throw error;
      return data || [];
    }
  });

  // ========== MOTOR DE RENTABILIDAD ==========
  const proyectosConRentabilidad = useMemo(() => {
    return proyectos.map(p => {
      const ingresosProyecto = ingresosRaw
        .filter(i => i.proyecto_id === p.id)
        .reduce((sum, i) => sum + (Number(i.monto) || 0), 0);

      const gastosFacturas = facturasGastosRaw
        .filter(g => g.proyecto_id === p.id)
        .reduce((sum, g) => sum + (Number(g.monto) || 0), 0);

      const horasProyecto = horasTrabajadas
        .filter(h => h.proyecto_id === p.id)
        .reduce((sum, h) => sum + (Number(h.cantidad_horas) || 0), 0);
      
      const costoManoObra = horasProyecto * (Number(p.precio_hora) || 0);
      const costoTotal = gastosFacturas + costoManoObra;
      const margenRealGs = ingresosProyecto - costoTotal;
      const margenRealPorc = ingresosProyecto > 0 
        ? (margenRealGs / ingresosProyecto) * 100 
        : 0;

      return {
        ...p,
        ingreso_real: ingresosProyecto,
        gasto_real: gastosFacturas,
        horas_reales: horasProyecto,
        costo_mano_obra: costoManoObra,
        costo_total: costoTotal,
        margen_real_gs: margenRealGs,
        margen_real_porc: margenRealPorc,
        salud_margen: p.margen_objetivo ? (margenRealPorc >= p.margen_objetivo ? 'buena' : 'alerta') : 'n/a'
      };
    });
  }, [proyectos, ingresosRaw, facturasGastosRaw, horasTrabajadas]);

  const clientesConStats = useMemo(() => {
    return (clientes || []).map((c: any) => {
      const ingresosCliente = ingresosRaw
        .filter(i => i.ruc_cliente === c.ruc || i.cliente.toLowerCase() === c.razon_social.toLowerCase())
        .reduce((sum, i) => sum + (Number(i.monto) || 0), 0);
      
      const proyectosCliente = proyectos.filter(p => p.nombre_cliente.toLowerCase() === c.razon_social.toLowerCase()).length;
      const deudaPendiente = ingresosRaw
        .filter(i => (i.ruc_cliente === c.ruc || i.cliente.toLowerCase() === c.razon_social.toLowerCase()) && (i.estado as string) !== 'cobrada')
        .reduce((sum, i) => sum + (Number(i.monto) || 0), 0);

      return {
        ...c,
        total_facturado: ingresosCliente,
        total_proyectos: proyectosCliente,
        deuda_pendiente: deudaPendiente
      };
    });
  }, [clientes, ingresosRaw, proyectos]);

  const valorTotalInventario = useMemo(() => {
    return inventarioEquipo
      .filter(e => e.tipo_propiedad === 'PROPIO')
      .reduce((sum, e) => sum + (Number(e.valor_actual) || 0), 0);
  }, [inventarioEquipo]);

  const rentabilidadHoraria = useMemo(() => {
    const proyectosFinalizados = proyectosConRentabilidad.filter(p => (p.estado === 'entregado' || p.estado === 'facturado' || p.estado === 'pagado') && p.ingreso_real > 0);
    const totalIngresos = proyectosFinalizados.reduce((acc, p) => acc + p.ingreso_real, 0);
    const totalHoras = proyectosFinalizados.reduce((acc, p) => acc + p.horas_reales, 0);
    return totalHoras > 0 ? Math.round(totalIngresos / totalHoras) : 0;
  }, [proyectosConRentabilidad]);

  // ========== MOTOR DE PROYECCIONES & SAFE-TO-SPEND (Fase 6) ==========
  const financialIntelligence = useMemo(() => {
    // 1. Safe-to-Spend logic
    const totalCobradoMes = ingresos.filter(i => i.estado === 'cobrada').reduce((s, i) => s + Number(i.monto), 0);
    const gastosFijosMes = facturasGastos.filter(g => g.tipo_gasto === 'oficina' || g.tipo_gasto === 'software_licencias' || g.tipo_gasto === 'marketing').reduce((s, g) => s + Number(g.monto), 0);
    
    // Estimación de IVA SET (Phase 5)
    const ivaDebito = ingresos.reduce((s, i) => s + (Number(i.iva_10 || 0) + Number(i.iva_5 || 0)), 0);
    const ivaCredito = facturasGastos.reduce((s, f) => s + (Number(f.iva_10 || 0) + Number(f.iva_5 || 0)), 0);
    const ivaEstimadoAPagar = Math.max(0, ivaDebito - ivaCredito);
    
    const reservaEmergencia = totalCobradoMes * 0.10; // 10% sugerido
    const disponibleReal = Math.max(0, (totalCobradoMes - gastosFijosMes - ivaEstimadoAPagar - reservaEmergencia));

    // 2. Proyecciones (Forecasting 3 meses)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const proyecciones = [1, 2, 3].map(offset => {
      const targetDate = new Date(currentYear, currentMonth + offset, 1);
      const label = targetDate.toLocaleDateString('es-PY', { month: 'short' });
      
      // Proyección basada en propuestas aceptadas
      const ingresosPropuestas = propuestas
        .filter(p => p.estado === 'aceptado' && p.valido_hasta && new Date(p.valido_hasta).getMonth() === targetDate.getMonth())
        .reduce((s, p) => s + Number(p.total_bruto), 0);

      // Proyección basada en contratos/proyectos recurrentes (Placeholder para futuro módulo de contratos)
      const ingresosRecurrentes = 0; 
      
      return { mes: label, ingresos: ingresosPropuestas + ingresosRecurrentes };
    });

    return {
      disponibleReal,
      ivaEstimadoAPagar,
      reservaEmergencia,
      gastosFijosMes,
      proyecciones
    };
  }, [ingresos, facturasGastos, propuestas]);

  useEffect(() => {
    if (!sessionUser) return;

    const canales = [
      { nombre: 'public:profiles', clave: 'profile', tabla: 'profiles' },
      { nombre: 'public:proyectos', clave: 'proyectos', tabla: 'proyectos' },
      { nombre: 'public:facturas_gastos', clave: 'facturas_gastos', tabla: 'facturas_gastos' },
      { nombre: 'public:ingresos', clave: 'ingresos', tabla: 'ingresos' },
      { nombre: 'public:inventario_equipo', clave: 'inventario_equipo', tabla: 'inventario_equipo' },
      { nombre: 'public:perfiles_fiscales', clave: 'perfil_fiscal', tabla: 'perfiles_fiscales' },
      { nombre: 'public:configuracion_sifen', clave: 'configuracion_sifen', tabla: 'configuracion_sifen' },
      { nombre: 'public:documentos_electronicos', clave: 'documentos_electronicos', tabla: 'documentos_electronicos' },
      { nombre: 'public:agenda_tareas', clave: 'agenda_tareas', tabla: 'agenda_tareas' },
      { nombre: 'public:propuestas', clave: 'propuestas', tabla: 'propuestas' },
      { nombre: 'public:calendario_bloqueos', clave: 'calendario_bloqueos', tabla: 'calendario_bloqueos' }
    ].map(({ nombre, clave, tabla }) => 
      supabase.channel(nombre)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: tabla
        }, () => {
          queryClient.invalidateQueries({ queryKey: [clave, sessionUser.id] });
        }).subscribe()
    );

    return () => {
      canales.forEach(canal => supabase.removeChannel(canal));
    };
  }, [sessionUser, queryClient]);

  const cargandoBase = loadingProyectos || loadingFacturas || loadingIngresos || loadingBloqueos;

  const suggestCategory = (desc: string): string => {
    const d = desc.toLowerCase();
    if (d.includes('facebook') || d.includes('google ads') || d.includes('meta') || d.includes('publicidad') || d.includes('smm')) return 'Marketing & Publicidad';
    if (d.includes('surtidor') || d.includes('gasolin') || d.includes('petro') || d.includes('viatico') || d.includes('transporte')) return 'Combustible & Transporte';
    if (d.includes('biggie') || d.includes('super') || d.includes('comida') || d.includes('almuerzo') || d.includes('cena')) return 'Viáticos & Alimentación';
    if (d.includes('aws') || d.includes('vercel') || d.includes('supabase') || d.includes('saas') || d.includes('suscrip')) return 'Software & Nube';
    if (d.includes('adobe') || d.includes('envato') || d.includes('asset') || d.includes('musica')) return 'Recursos Creativos';
    if (d.includes('oficina') || d.includes('papel') || d.includes('admin') || d.includes('alquiler')) return 'Gasto Operativo';
    return 'Otros';
  };

  return { 
    proyectos: proyectosConRentabilidad, 
    facturasGastos, 
    inventarioEquipo, 
    valorTotalInventario,
    clientes: clientesConStats,
    alertas: [] as Alerta[], 
    ingresos, 
    ingresosRaw,
    propuestas,
    bloqueos,
    rentabilidadHoraria,
    financialIntelligence,
    profile,
    perfilFiscal,
    configSifen,
    documentosElectronicos,
    agendaTareas,
    loading: cargandoBase || loadingProfile || cargandoPerfilFiscal || cargandoSifen || cargandoDocsSifen || loadingAgenda || loadingPropuestasQuery || loadingHoras || loadingClientes, 
    loadingProfile,
    loadingProyectos,
    loadingFacturas,
    loadingIngresos,
    loadingAgenda,
    loadingHoras,
    loadingClientes,
    loadingSifen: cargandoSifen || cargandoDocsSifen,
    loadingPropuestas: loadingPropuestasQuery,
    error: errorProyectos || errorFacturas || errorEquipo || errorIngresos ? 'Error al obtener datos' : null,
    async toggleTarea(id: string, completada: boolean) {
      const { error } = await supabase.from('agenda_tareas').update({ completada }).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['agenda_tareas', sessionUser?.id] });
    },
    async addTarea(tarea: Partial<AgendaTarea>) {
      const { error } = await supabase.from('agenda_tareas').insert({ ...tarea, user_id: sessionUser?.id });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['agenda_tareas', sessionUser?.id] });
    },
    async deleteTarea(id: string) {
      const { error } = await supabase.from('agenda_tareas').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['agenda_tareas', sessionUser?.id] });
    },
    async updateIngresoEstado(id: string, estado: EstadoIngreso) {
      const { error } = await supabase.from('ingresos').update({ estado }).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['ingresos', sessionUser?.id] });
    },
    async addHorasTrabajadas(registro: Partial<RegistroHora>) {
      const { error } = await supabase.from('horas_trabajadas').insert({ ...registro, user_id: sessionUser?.id });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['horas_trabajadas', sessionUser?.id] });
    },
    async deleteHorasTrabajadas(id: string) {
      const { error } = await supabase.from('horas_trabajadas').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['horas_trabajadas', sessionUser?.id] });
    },
    async savePropuesta(propuesta: Partial<Propuesta>, items: Partial<PropuestaItem>[]) {
      setLoadingPropuestas(true);
      try {
        const { data: propData, error: propError } = await supabase
          .from('propuestas')
          .upsert({ ...propuesta, user_id: sessionUser?.id })
          .select()
          .single();
        
        if (propError) throw propError;

        await supabase.from('propuesta_items').delete().eq('propuesta_id', propData.id);
        
        const itemsWithId = items.map(item => ({ ...item, propuesta_id: propData.id }));
        const { error: itemsError } = await supabase.from('propuesta_items').insert(itemsWithId);
        
        if (itemsError) throw itemsError;

        queryClient.invalidateQueries({ queryKey: ['propuestas', sessionUser?.id] });
        return propData;
      } finally {
        setLoadingPropuestas(false);
      }
    },
    async deletePropuesta(id: string) {
      const { error } = await supabase.from('propuestas').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['propuestas', sessionUser?.id] });
    },
    async checkDuplicateInvoice(ruc: string, nro: string, timbrado: string) {
      if (!ruc || !nro) return false;
      const { data } = await supabase
        .from('facturas_gastos')
        .select('id')
        .eq('ruc_proveedor', ruc)
        .eq('numero_factura', nro)
        .eq('timbrado', timbrado)
        .limit(1);
      return (data?.length || 0) > 0;
    },
    async addBloqueo(bloqueo: { date: string; type: string; note?: string }) {
      const { error } = await supabase.from('calendario_bloqueos').insert({ ...bloqueo, user_id: sessionUser?.id });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['calendario_bloqueos', sessionUser?.id] });
    },
    async deleteBloqueo(id: string) {
      const { error } = await supabase.from('calendario_bloqueos').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['calendario_bloqueos', sessionUser?.id] });
    },
    suggestCategory
  };
}
