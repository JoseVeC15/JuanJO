import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { calculateSuggestedVAT } from '../data/sampleData';
import { useAuth } from '../contexts/AuthContext';
import type { Proyecto, FacturaGasto, Equipo, Alerta, Ingreso, Profile } from '../data/sampleData';

export function useSupabaseData() {
  const queryClient = useQueryClient();
  const { user: sessionUser } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre_completo, email, nivel_acceso, estado, created_at')
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
        .order('created_at', { ascending: false });
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
        .order('fecha_factura', { ascending: false });
      if (error) throw error;
      return data as FacturaGasto[];
    }
  });

  const facturasGastos = useMemo(() => facturasGastosRaw.map(g => {
    if (g.monto > 0 && (g.iva_10 || 0) === 0 && (g.iva_5 || 0) === 0 && (g.exentas || 0) === 0) {
      return { ...g, ...calculateSuggestedVAT(g.monto), is_suggested_vat: true };
    }
    return g;
  }), [facturasGastosRaw]);

  const { data: inventarioEquipo = [], isLoading: loadingEquipo, error: errorEquipo } = useQuery({
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
        .select('id, proyecto_id, cliente, monto, iva_10, iva_5, exentas, fecha_emision, estado, metodo_pago, created_at')
        .order('fecha_emision', { ascending: false });
      if (error) throw error;
      return data as Ingreso[];
    }
  });

  const ingresos = useMemo(() => ingresosRaw.map(i => {
    if (i.monto > 0 && (i.iva_10 || 0) === 0 && (i.iva_5 || 0) === 0 && (i.exentas || 0) === 0) {
      return { ...i, ...calculateSuggestedVAT(i.monto), is_suggested_vat: true };
    }
    return i;
  }), [ingresosRaw]);

  const { data: fiscalProfile, isLoading: loadingFiscal } = useQuery({
    queryKey: ['fiscal_profile', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_fiscal_profile')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const { data: sifenConfig, isLoading: loadingSifen } = useQuery({
    queryKey: ['sifen_config', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_sifen_config')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const { data: electronicDocuments = [], isLoading: loadingSifenDocs } = useQuery({
    queryKey: ['electronic_documents', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('electronic_documents')
        .select('*, electronic_document_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (!sessionUser) return;

    const channels = [
      { name: 'public:profiles', key: 'profile' },
      { name: 'public:proyectos', key: 'proyectos' },
      { name: 'public:facturas_gastos', key: 'facturas_gastos' },
      { name: 'public:ingresos', key: 'ingresos' },
      { name: 'public:inventario_equipo', key: 'inventario_equipo' },
      { name: 'public:tenant_fiscal_profile', key: 'fiscal_profile' },
      { name: 'public:tenant_sifen_config', key: 'sifen_config' },
      { name: 'public:electronic_documents', key: 'electronic_documents' }
    ].map(({ name, key }) => 
      supabase.channel(name)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: key === 'profile' ? 'profiles' : (key === 'fiscal_profile' ? 'tenant_fiscal_profile' : (key === 'sifen_config' ? 'tenant_sifen_config' : (key === 'electronic_documents' ? 'electronic_documents' : key))) 
        }, () => {
          queryClient.invalidateQueries({ queryKey: key === 'profile' ? ['profile', sessionUser?.id] : [key] });
        }).subscribe()
    );

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [sessionUser, queryClient]);

  // Optimización de Loading: Priorizamos datos financieros para el Dashboard
  const loading = loadingProyectos || loadingFacturas || loadingIngresos;
  const error = errorProyectos || errorFacturas || errorEquipo || errorIngresos ? 'Error fetching data' : null;

  return { 
    proyectos, 
    facturasGastos, 
    inventarioEquipo, 
    alertas: [] as Alerta[], 
    ingresos, 
    profile,
    fiscalProfile,
    sifenConfig,
    electronicDocuments,
    loading: loading || loadingProfile || loadingFiscal || loadingSifen || loadingSifenDocs, 
    loadingExtra: loadingEquipo,
    error 
  };
}


