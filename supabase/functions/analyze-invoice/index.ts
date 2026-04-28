import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPT_GASTO = `Analiza esta imagen de factura de compra/gasto. El contexto es Paraguay (moneda: Guaraníes PYG, sin decimales).

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin explicaciones adicionales:
{
  "fecha_factura": "YYYY-MM-DD",
  "proveedor": "razón social del emisor/proveedor",
  "ruc_proveedor": "RUC del proveedor, ej: 80012345-6",
  "numero_factura": "número en formato 001-001-0000001",
  "timbrado": "número de timbrado de 8 dígitos",
  "monto": 0,
  "iva_10": 0,
  "iva_5": 0,
  "exentas": 0,
  "concepto_ocr": "descripción breve de los productos/servicios",
  "tipo_gasto": "servicios|tecnologia|materiales|alquiler|transporte|alimentacion|impuestos|otros"
}

Reglas:
- Todos los montos deben ser números enteros (sin puntos ni comas).
- Si un campo no es visible, usa null.
- El número de timbrado tiene exactamente 8 dígitos.
- tipo_gasto debe ser uno de los valores listados.`;

const PROMPT_INGRESO = `Analiza esta imagen de factura de venta/ingreso. El contexto es Paraguay (moneda: Guaraníes PYG, sin decimales).

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin explicaciones adicionales:
{
  "fecha": "YYYY-MM-DD",
  "cliente": "razón social del cliente/receptor",
  "ruc_cliente": "RUC del cliente, ej: 80012345-6",
  "numero_factura": "número en formato 001-001-0000001",
  "timbrado": "número de timbrado de 8 dígitos",
  "condicion_venta": "contado|credito",
  "monto": 0,
  "iva_10": 0,
  "iva_5": 0,
  "exentas": 0
}

Reglas:
- Todos los montos deben ser números enteros (sin puntos ni comas).
- Si un campo no es visible, usa null.
- condicion_venta debe ser "contado" o "credito".`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, image_base64, mime_type, type } = await req.json();

    if (!user_id || !image_base64 || !type) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY no configurada en secrets');

    const isGasto = type === 'expense';
    const mediaType = (mime_type === 'image/png' || mime_type === 'image/gif' || mime_type === 'image/webp')
      ? mime_type
      : 'image/jpeg';

    // Llamar a Claude para extraer datos de la factura
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image_base64 },
            },
            {
              type: 'text',
              text: isGasto ? PROMPT_GASTO : PROMPT_INGRESO,
            },
          ],
        }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Claude API error ${anthropicRes.status}: ${errText}`);
    }

    const anthropicData = await anthropicRes.json();
    const rawText: string = anthropicData.content?.[0]?.text ?? '';

    // Extraer el JSON de la respuesta
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('La IA no devolvió un JSON válido');

    const extracted = JSON.parse(jsonMatch[0]);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const today = new Date().toISOString().split('T')[0];

    let insertedData;
    if (isGasto) {
      const { data, error } = await supabase
        .from('facturas_gastos')
        .insert({
          user_id,
          fecha_factura: extracted.fecha_factura || today,
          proveedor: extracted.proveedor || 'Sin especificar',
          ruc_proveedor: extracted.ruc_proveedor || '',
          numero_factura: extracted.numero_factura || '',
          timbrado: extracted.timbrado || '',
          monto: Number(extracted.monto) || 0,
          iva_10: Number(extracted.iva_10) || 0,
          iva_5: Number(extracted.iva_5) || 0,
          exentas: Number(extracted.exentas) || 0,
          concepto_ocr: extracted.concepto_ocr || '',
          tipo_gasto: extracted.tipo_gasto || 'otros',
          es_deducible: true,
          estado: 'pendiente_clasificar',
          processed_by_n8n: true,
        })
        .select()
        .single();
      if (error) throw error;
      insertedData = data;
    } else {
      const { data, error } = await supabase
        .from('ingresos')
        .insert({
          user_id,
          fecha: extracted.fecha || today,
          fecha_emision: extracted.fecha || today,
          cliente: extracted.cliente || 'Sin especificar',
          ruc_cliente: extracted.ruc_cliente || '',
          numero_factura: extracted.numero_factura || '',
          timbrado: extracted.timbrado || '',
          condicion_venta: extracted.condicion_venta || 'contado',
          monto: Number(extracted.monto) || 0,
          iva_10: Number(extracted.iva_10) || 0,
          iva_5: Number(extracted.iva_5) || 0,
          exentas: Number(extracted.exentas) || 0,
          estado: 'emitida',
          processed_by_n8n: true,
        })
        .select()
        .single();
      if (error) throw error;
      insertedData = data;
    }

    return new Response(JSON.stringify({ success: true, data: insertedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('analyze-invoice error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
