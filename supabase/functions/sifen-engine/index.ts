import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cabecerasCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (peticion: Request) => {
  if (peticion.method === 'OPTIONS') {
    return new Response('ok', { headers: cabecerasCors })
  }

  try {
    const clienteSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Obtener datos de la petición
    const { documento_id } = await peticion.json()
    
    // 2. Recuperar Datos en Español (Perfiles y Documentos)
    const { data: documento, error: errorDoc } = await clienteSupabase
      .from('documentos_electronicos')
      .select('*, documentos_items(*)')
      .eq('id', documento_id)
      .single()

    if (errorDoc || !documento) throw new Error("Documento no hallado en el ecosistema")

    const { data: perfilFiscal } = await clienteSupabase
      .from('perfiles_fiscales')
      .select('*')
      .eq('user_id', documento.user_id)
      .single()

    const { data: certificado } = await clienteSupabase
      .from('certificados_digitales')
      .select('*')
      .eq('user_id', documento.user_id)
      .single()

    // 3. Generar XML SIFEN (Mapeo v1.5)
    const xmlBruto = generarXmlSifen(documento, perfilFiscal)

    // 4. Firmar Digitalmente (Simulación Fase 6)
    const xmlFirmado = firmarXml(xmlBruto, certificado)

    // 5. Transmitir a SIFEN (Simulación Set de Pruebas DNIT)
    const respuestaSifen = await transmitirASifen(xmlFirmado, perfilFiscal.ambiente)

    // 6. Persistir el Log en las nuevas tablas españolas
    await clienteSupabase
      .from('documentos_xml_logs')
      .upsert({
        documento_id,
        xml_generado: xmlBruto,
        xml_firmado: xmlFirmado,
        respuesta_sifen: respuestaSifen
      })

    // 7. Actualizar Estado del Documento a 'aprobado' (Simulado)
    await clienteSupabase
      .from('documentos_electronicos')
      .update({ estado_sifen: 'aprobado' })
      .eq('id', documento_id)

    return new Response(
      JSON.stringify({ success: true, cdc: documento.cdc, estado: "aprobado" }),
      { headers: { ...cabecerasCors, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...cabecerasCors, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// --- MOTOR DE PROCESAMIENTO SIFEN (ESPAÑOL) ---

function generarXmlSifen(doc: any, perfil: any) {
    const xmlDetalle = doc.documentos_items.map((item: any, indice: number) => `
        <gCamItem>
            <dCodInt>${indice + 1}</dCodInt>
            <dDesProd>${item.descripcion}</dDesProd>
            <dCantPro>${item.cantidad}</dCantPro>
            <gValorItem>
                <dPUniPro>${item.precio_unitario}</dPUniPro>
                <dTotBruItem>${item.monto_total_item}</dTotBruItem>
            </gValorItem>
            <gCamIVA>
                <iAfecIVA>1</iAfecIVA>
                <dPropIVA>100</dPropIVA>
                <dTasaIVA>${item.iva_tipo}</dTasaIVA>
            </gCamIVA>
        </gCamItem>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns="http://efe.set.gov.py/sifen/xsd">
    <dVerFor>150</dVerFor>
    <DE Id="${doc.cdc}">
        <dFecEmi>${new Date(doc.fecha_emision).toISOString()}</dFecEmi>
        <gEmis>
            <dRucEm>${perfil.ruc}</dRucEm>
            <dDVEmi>${perfil.dv}</dDVEmi>
            <dNomEmi>${perfil.razon_social}</dNomEmi>
            <dDirEmi>${perfil.direccion || 'Asunción, PY'}</dDirEmi>
        </gEmis>
        <gDatRec>
            <dRucRec>${doc.receptor_ruc || '44444401'}</dRucRec>
            <dNomRec>${doc.receptor_razon_social}</dNomRec>
        </gDatRec>
        <gDtipDE>
            ${xmlDetalle}
        </gDtipDE>
        <gTotRes>
            <dTotGue>${doc.monto_total}</dTotGue>
        </gTotRes>
    </DE>
</rDE>`;
}

function firmarXml(xml: string, certificado: any) {
    console.log("Firma Digital Simulada con certificado:", certificado?.id || 'TEST_CERT');
    return xml // En producción aquí se inyectaría el Signature XMLDSig
}

async function transmitirASifen(xmlFirmado: string, ambiente: string) {
    console.log(`[FASE 6 - DNIT TEST] Recibiendo documento en ambiente: ${ambiente}`);
    // Simulación de respuesta 200 OK de la SET
    return { 
        estado: "aprobado", 
        codigo_dn: "0000", 
        mensaje: "Aprobado por el Set de Pruebas oficial (Simulación)" 
    }
}
