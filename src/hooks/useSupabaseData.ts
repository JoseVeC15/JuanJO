import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { calculateSuggestedVAT10 } from '../data/sampleData';
import { useAuth } from '../contexts/AuthContext';
import type { Proyecto, FacturaGasto, Equipo, Alerta, Ingreso, Profile, AgendaTarea, EstadoIngreso } from '../data/sampleData';

export function useSupabaseData() {
  const queryClient = useQueryClient();
  const { user: sessionUser } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre_completo, email, nivel_acceso, estado, facturacion_habilitada, modulos_habilitados, created_at')
        .eq('id', sessionUser?.id)
        .single();
      if (error) throw error;
      return data as Profile;
    }
  });

  const { data: proyectos = [], isLoading: loadingProyectos, error: errorProyectos } = useQuery({
    queryKey: ['proyectos', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre_cliente, tipo_servicio, descripcion, fecha_inicio, fecha_entrega, monto_presupuestado, monto_facturado, estado, created_at')
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
        .select('id, proyecto_id, monto, fecha_factura, proveedor, tipo_gasto, iva_10, iva_5, exentas, estado, metodo_pago, created_at')
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
        .select('id, nombre, tipo, condicion, tipo_propiedad, ubicacion, created_at')
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
        .select('id, proyecto_id, cliente, monto, iva_10, iva_5, exentas, fecha_emision, fecha_vencimiento, estado, metodo_pago, created_at')
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
      { nombre: 'public:agenda_tareas', clave: 'agenda_tareas', tabla: 'agenda_tareas' }
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

  // Optimización de Carga: Priorizamos datos financieros para el Dashboard
  const cargandoBase = loadingProyectos || loadingFacturas || loadingIngresos;
  const error = errorProyectos || errorFacturas || errorEquipo || errorIngresos ? 'Error al obtener datos' : null;

  return { 
    proyectos, 
    facturasGastos, 
    inventarioEquipo, 
    alertas: [] as Alerta[], 
    ingresos, 
    profile,
    perfilFiscal,
    configSifen,
    documentosElectronicos,
    agendaTareas,
    loading: cargandoBase || loadingProfile || cargandoPerfilFiscal || cargandoSifen || cargandoDocsSifen || loadingAgenda, 
    loadingProfile,
    loadingProyectos,
    loadingFacturas,
    loadingIngresos,
    loadingAgenda,
    loadingSifen: cargandoSifen || cargandoDocsSifen,
    error,
    // Mutations for Phase 1
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
    }
  };
}


