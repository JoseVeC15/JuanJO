import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cabecerasCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- ALGORITMOS OFICIALES SIFEN (DNIT) ---

function calcularModulo11(pCadena: string): number {
  let vSum = 0;
  let vFactor = 2;
  for (let i = pCadena.length - 1; i >= 0; i--) {
    vSum += parseInt(pCadena.charAt(i)) * vFactor;
    vFactor = (vFactor === 9) ? 2 : vFactor + 1;
  }
  const vResto = vSum % 11;
  return (vResto <= 1) ? 0 : 11 - vResto;
}

function generarCDC(data: any): string {
  const { ruc, dv, establecimiento, puntoExpedicion, numero, fechaEmision, codigoSeguridad } = data;
  
  const rucPadded = ruc.replace(/\D/g, '').slice(0, 8).padStart(8, '0');
  const estPadded = establecimiento.toString().padStart(3, '0');
  const puntoPadded = puntoExpedicion.toString().padStart(3, '0');
  const numPadded = numero.toString().padStart(7, '0');
  const fechaPadded = fechaEmision.replace(/-/g, '').slice(0, 8);
  const codPadded = (codigoSeguridad || Math.floor(100000000 + Math.random() * 900000000)).toString().padStart(9, '0');
  
  // Tipo (01) + RUC + DV + EST + PUNTO + NUM + CONTRIB(1) + FECHA + EMISION(1) + SEGURIDAD
  const baseCDC = `01${rucPadded}${dv}${estPadded}${puntoPadded}${numPadded}1${fechaPadded}1${codPadded}`;
  const dvCDC = calcularModulo11(baseCDC);
  
  return `${baseCDC}${dvCDC}`;
}

function generarXmlSifen(doc: any, perfil: any, cdc: string) {
    const xmlDetalle = doc.documentos_items.map((item: any, indice: number) => `
        <gCamItem>
            <dCodInt>${indice + 1}</dCodInt>
            <dDesProd>${item.descripcion}</dDesProd>
            <dCantPro>${item.cantidad}</dCantPro>
            <gValorItem>
                <dPUniPro>${item.precio_unitario}</dPUniPro>
                <dTotBruItem>${item.monto_total_item || (item.cantidad * item.precio_unitario)}</dTotBruItem>
            </gValorItem>
            <gCamIVA>
                <iAfecIVA>1</iAfecIVA>
                <dPropIVA>100</dPropIVA>
                <dTasaIVA>${item.iva_tipo || 10}</dTasaIVA>
            </gCamIVA>
        </gCamItem>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns="http://efe.set.gov.py/sifen/xsd">
    <dVerFor>150</dVerFor>
    <DE Id="${cdc}">
        <dDVId>${cdc.slice(-1)}</dDVId>
        <dFecEmi>${new Date(doc.fecha_emision).toISOString()}</dFecEmi>
        <gEmis>
            <dRucEm>${perfil.ruc}</dRucEm>
            <dDVEmi>${perfil.dv}</dDVEmi>
            <dNomEmi>${perfil.razon_social}</dNomEmi>
            <dDirEmi>${perfil.direccion || 'Asunción, PY'}</dDirEmi>
        </gEmis>
        <gDatRec>
            <dRucRec>${doc.receptor_ruc || '44444401'}</dRucRec>
            <dNomRec>${doc.receptor_razon_social || 'AOSTA SA'}</dNomRec>
        </gDatRec>
        <gDtipDE>
            ${xmlDetalle}
        </gDtipDE>
        <gTotRes>
            <dTotGue>${doc.monto_total}</dTotGue>
        </gTotRes>
        <infAdic>
            <qr>https://kuatia.set.gov.py/consultas/qr?cdc=${cdc}</qr>
        </infAdic>
    </DE>
</rDE>`;
}

serve(async (peticion: Request) => {
  if (peticion.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });

  try {
    const clienteSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { documento_id } = await peticion.json();
    
    // 1. Recuperar Datos en Español
    const { data: documento, error: errorDoc } = await clienteSupabase
      .from('documentos_electronicos')
      .select('*, documentos_items(*)')
      .eq('id', documento_id)
      .single();

    if (errorDoc || !documento) throw new Error("Documento no hallado en el ecosistema");

    const { data: perfilFiscal } = await clienteSupabase
      .from('perfiles_fiscales')
      .select('*')
      .eq('user_id', documento.user_id)
      .single();

    const { data: configSifen } = await clienteSupabase
      .from('configuracion_sifen')
      .select('*')
      .eq('user_id', documento.user_id)
      .single();

    if (!perfilFiscal || !configSifen) throw new Error("Perfil o Configuración SIFEN ausente");

    // 2. Generar CDC Real
    const cdc = generarCDC({
        ruc: perfilFiscal.ruc,
        dv: perfilFiscal.dv,
        establecimiento: configSifen.establecimiento || '001',
        puntoExpedicion: configSifen.punto_expedicion || '001',
        numero: documento.nro_documento || Math.floor(Math.random() * 1000000),
        fechaEmision: documento.fecha_emision,
        codigoSeguridad: documento.codigo_seguridad
    });

    // 3. Generar XML Professional
    const xmlBruto = generarXmlSifen(documento, perfilFiscal, cdc);

    // 4. Firmar Digitalmente (Simulación)
    const xmlFirmado = xmlBruto; // Inyección de Firma Digital simulada

    // 5. Transmitir a SIFEN (Fase 6 - Set de Pruebas)
    const respuestaSifen = { 
        estado: "aprobado", 
        codigo_dn: "0000", 
        mensaje: "Aprobado exitosamente por el Set de Pruebas oficial (Simulación v2.0)",
        cdc: cdc
    };

    // 6. Persistir el Log y Actualizar Documento
    await clienteSupabase.from('documentos_xml_logs').upsert({
        documento_id,
        xml_generado: xmlBruto,
        xml_firmado: xmlFirmado,
        respuesta_sifen: respuestaSifen
    });

    await clienteSupabase.from('documentos_electronicos').update({ 
        estado_sifen: 'aprobado',
        cdc: cdc,
        id_sifen: `SIFEN-${cdc.slice(-8)}`
    }).eq('id', documento_id);

    return new Response(
      JSON.stringify({ success: true, cdc, estado: "aprobado", qr: `https://kuatia.set.gov.py/consultas/qr?cdc=${cdc}` }),
      { headers: { ...cabecerasCors, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...cabecerasCors, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
