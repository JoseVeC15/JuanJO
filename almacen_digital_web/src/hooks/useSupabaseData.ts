import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Proyecto, FacturaGasto, Equipo, Alerta, Ingreso, Profile } from '../data/sampleData';

export function useSupabaseData() {
  const queryClient = useQueryClient();

  const { data: sessionUser } = useQuery({
    queryKey: ['session_user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity, // Don't keep fetching user
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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
      const { data, error } = await supabase.from('proyectos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Proyecto[];
    }
  });

  const { data: facturasGastos = [], isLoading: loadingFacturas, error: errorFacturas } = useQuery({
    queryKey: ['facturas_gastos', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase.from('facturas_gastos').select('*').order('fecha_factura', { ascending: false });
      if (error) throw error;
      return data as FacturaGasto[];
    }
  });

  const { data: inventarioEquipo = [], isLoading: loadingEquipo, error: errorEquipo } = useQuery({
    queryKey: ['inventario_equipo', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase.from('inventario_equipo').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Equipo[];
    }
  });

  const { data: ingresos = [], isLoading: loadingIngresos, error: errorIngresos } = useQuery({
    queryKey: ['ingresos', sessionUser?.id],
    enabled: !!sessionUser,
    queryFn: async () => {
      const { data, error } = await supabase.from('ingresos').select('*').order('fecha_emision', { ascending: false });
      if (error) throw error;
      return data as Ingreso[];
    }
  });

  useEffect(() => {
    if (!sessionUser) return;

    const projectsSubscription = supabase.channel('public:proyectos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      }).subscribe();
      
    const invoicesSubscription = supabase.channel('public:facturas_gastos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facturas_gastos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['facturas_gastos'] });
      }).subscribe();

    return () => {
      supabase.removeChannel(projectsSubscription);
      supabase.removeChannel(invoicesSubscription);
    };
  }, [sessionUser, queryClient]);

  const loading = !sessionUser || loadingProyectos || loadingFacturas || loadingEquipo || loadingIngresos;
  const error = errorProyectos || errorFacturas || errorEquipo || errorIngresos ? 'Error fetching data' : null;

  return { 
    proyectos, 
    facturasGastos, 
    inventarioEquipo, 
    alertas: [] as Alerta[], 
    ingresos, 
    profile,
    loading: loading || loadingProfile, 
    error 
  };
}

