import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Proyecto, FacturaGasto, Equipo, Alerta, Ingreso } from '../data/sampleData';

export function useSupabaseData() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [facturasGastos, setFacturasGastos] = useState<FacturaGasto[]>([]);
  const [inventarioEquipo, setInventarioEquipo] = useState<Equipo[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch all data in parallel
        const [
          { data: projectsData, error: projectsError },
          { data: invoicesData, error: invoicesError },
          { data: equipmentData, error: equipmentError },
          { data: incomeData, error: incomeError },
          // { data: alertsData, error: alertsError }
        ] = await Promise.all([
          supabase.from('proyectos').select('*').order('created_at', { ascending: false }),
          supabase.from('facturas_gastos').select('*').order('fecha_factura', { ascending: false }),
          supabase.from('inventario_equipo').select('*').order('created_at', { ascending: false }),
          supabase.from('ingresos').select('*').order('fecha_emision', { ascending: false }),
        ]);

        if (projectsError) throw projectsError;
        if (invoicesError) throw invoicesError;
        if (equipmentError) throw equipmentError;
        if (incomeError) throw incomeError;

        setProyectos(projectsData || []);
        setFacturasGastos(invoicesData || []);
        setInventarioEquipo(equipmentData || []);
        setIngresos(incomeData || []);
        
        // Mock alerts for now if table is empty or differently structured
        setAlertas([]); 

      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Subscribe to changes
    const projectsSubscription = supabase.channel('public:proyectos').on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, fetchData).subscribe();
    const invoicesSubscription = supabase.channel('public:facturas_gastos').on('postgres_changes', { event: '*', schema: 'public', table: 'facturas_gastos' }, fetchData).subscribe();

    return () => {
      supabase.removeChannel(projectsSubscription);
      supabase.removeChannel(invoicesSubscription);
    };
  }, []);

  return { proyectos, facturasGastos, inventarioEquipo, alertas, ingresos, loading, error };
}
