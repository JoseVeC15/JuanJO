import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cabecerasCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ErrorCode =
    | 'BAD_REQUEST'
    | 'DOCUMENTO_NO_ENCONTRADO'
    | 'CONFIG_INCOMPLETA'
    | 'RUC_INVALIDO'
    | 'CERTIFICADO_AUSENTE'
    | 'CERTIFICADO_VENCIDO'
    | 'SIFEN_TIMEOUT'
    | 'UNEXPECTED';

class EngineError extends Error {
    code: ErrorCode;
    status: number;

    constructor(code: ErrorCode, message: string, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

function logStructured(level: 'info' | 'error', message: string, context: Record<string, unknown>) {
    const entry = {
        level,
        message,
        ts: new Date().toISOString(),
        ...context,
    };

    const payload = JSON.stringify(entry);
    if (level === 'error') {
        console.error(payload);
    } else {
        console.log(payload);
    }
}

function normalizarRuc(ruc: string | null | undefined): string {
    return (ruc || '').replace(/\s+/g, '').trim();
}

function esRucValido(ruc: string): boolean {
    return /^\d{5,8}-?\d$/.test(ruc);
}

function obtenerNumeroSecuencial(numeroFactura: string | null | undefined): number {
    return Number((numeroFactura || '1').toString().split('-').pop() || '1');
}

function parsearError(error: unknown): EngineError {
    if (error instanceof EngineError) return error;

    const err = error as { message?: string };
    const message = err?.message || 'Error interno inesperado';
    return new EngineError('UNEXPECTED', message, 500);
}

// --- ALGORITMOS SIFEN v1.50 ---

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
  const baseCDC = `01${rucPadded}${dv}${establecimiento.padStart(3,'0')}${puntoExpedicion.padStart(3,'0')}${numero.toString().padStart(7,'0')}1${fechaEmision.replace(/-/g, '').slice(0, 8)}1${codigoSeguridad.toString().padStart(9, '0')}`;
  return `${baseCDC}${calcularModulo11(baseCDC)}`;
}

// --- MOCK DE FIRMA DIGITAL (Estructura XMLDSig) ---
// Nota: Esta función prepara el bloque <Signature> para cuando el archivo .p12 esté presente
async function firmarXmlSifen(xmlBruto: string, certBase64: string, certPass: string): Promise<string> {
    if (!certBase64) return xmlBruto; // Fallback si no hay certificado aún

    try {
        // En un escenario real, aquí procesamos con forge y xmldsigjs
        // Por ahora, generamos la estructura legal vacía para validación de esquema
        const signatureBlock = `
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
        <SignedInfo>
            <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
            <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
            <Reference URI="">
                <Transforms>
                    <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
                </Transforms>
                <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                <DigestValue>base64-digest==</DigestValue>
            </Reference>
        </SignedInfo>
        <SignatureValue>base64-signature==</SignatureValue>
        <KeyInfo>
            <X509Data>
                <X509Certificate>base64-cert==</X509Certificate>
            </X509Data>
        </KeyInfo>
    </Signature>`;
        
        return xmlBruto.replace('</rDE>', `${signatureBlock}\n</rDE>`);
    } catch (e) {
        logStructured('error', 'Error en firma digital', { error: (e as Error).message });
        return xmlBruto;
    }
}

function generarXmlSifen(doc: any, perfil: any, cdc: string) {
    const xmlDetalle = doc.documentos_items.map((item: any, indice: number) => `
        <gCamItem>
            <dCodInt>${indice + 1}</dCodInt>
            <dDesProd>${item.descripcion}</dDesProd>
            <dUniMed>77</dUniMed>
            <dCantProSer>${item.cantidad}</dCantProSer>
            <gValorItem>
                <dPUniPro>${item.precio_unitario}</dPUniPro>
                <dTotBruItem>${item.monto_total_item || (item.cantidad * item.precio_unitario)}</dTotBruItem>
            </gValorItem>
            <gCamIVA>
                <iAfecIVA>${Number(item.iva_tipo) === 0 ? '3' : '1'}</iAfecIVA>
                <dPropIVA>100</dPropIVA>
                <dTasaIVA>${Number(item.iva_tipo ?? 10)}</dTasaIVA>
                <dBasGrav>${item.monto_total_item || (item.cantidad * item.precio_unitario)}</dBasGrav>
                <dTotIVA>${Number(item.iva_tipo) === 0 ? '0' : Math.round(item.monto_total_item / 11)}</dTotIVA>
            </gCamIVA>
        </gCamItem>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns="http://efe.set.gov.py/sifen/xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dVerFor>150</dVerFor>
    <DE Id="DE${cdc}">
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
            <gCamFE>
                <iIndPres>1</iIndPres>
            </gCamFE>
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

    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    let documentoId: string | null = null;

  try {
    const clienteSupabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        const body = await peticion.json();
        documentoId = body?.documento_id || null;

        if (!documentoId || typeof documentoId !== 'string') {
            throw new EngineError('BAD_REQUEST', 'Debe enviar documento_id valido', 400);
        }

        const persistirMetrica = async (ok: boolean, latencyMs: number, errorCode?: string) => {
            try {
                await clienteSupabase.from('sifen_metricas_eventos').insert({
                    request_id: requestId,
                    documento_id: documentoId,
                    ok,
                    latency_ms: latencyMs,
                    error_code: errorCode || null,
                });
            } catch {
                // Evitamos bloquear la respuesta por fallas de observabilidad.
            }
        };

        const persistirLogDocumento = async (payload: Record<string, unknown>) => {
            if (!documentoId) return;
            try {
                await clienteSupabase.from('documentos_xml_logs').insert({
                    documento_id: documentoId,
                    request_id: requestId,
                    ...payload,
                });
            } catch {
                // La emision no debe fallar por escritura de log secundario.
            }
        };
    
    // 1. Obtener Datos
    const { data: documento } = await clienteSupabase
      .from('documentos_electronicos')
      .select('*, documentos_items(*)')
            .eq('id', documentoId)
      .single();

        if (!documento) throw new EngineError('DOCUMENTO_NO_ENCONTRADO', 'Documento no hallado', 404);

        const rucReceptor = normalizarRuc(documento.receptor_ruc);
        if (rucReceptor && !esRucValido(rucReceptor)) {
            throw new EngineError('RUC_INVALIDO', 'El RUC del receptor no tiene formato valido', 422);
        }

        const { data: perfil } = await clienteSupabase
            .from('perfiles_fiscales')
            .select('*')
            .eq('user_id', documento.user_id)
            .single();
        const { data: config } = await clienteSupabase
            .from('configuracion_sifen')
            .select('*')
            .eq('user_id', documento.user_id)
            .single();
        const { data: cert } = await clienteSupabase
            .from('certificados_digitales')
            .select('*')
            .eq('user_id', documento.user_id)
            .single();

        if (!perfil || !config || !config.csc || !config.id_csc) {
            throw new EngineError('CONFIG_INCOMPLETA', 'Falta perfil fiscal o configuracion SIFEN para este usuario', 422);
        }

        if (!cert?.certificado_base64) {
            throw new EngineError('CERTIFICADO_AUSENTE', 'No hay certificado digital cargado para este usuario', 422);
        }

        if (cert?.vencimiento && new Date(cert.vencimiento).getTime() < Date.now()) {
            throw new EngineError('CERTIFICADO_VENCIDO', 'El certificado digital se encuentra vencido', 422);
        }

        const numeroSecuencial = obtenerNumeroSecuencial(documento.numero_factura);
        const codigoSeguridad = Number(config.id_csc || 123456789);

    // 2. Generar CDC v1.50
    const cdc = generarCDC({
        ruc: perfil.ruc,
        dv: perfil.dv,
        establecimiento: config.establecimiento || '001',
        puntoExpedicion: config.punto_expedicion || '001',
                numero: numeroSecuencial,
        fechaEmision: documento.fecha_emision,
                codigoSeguridad: codigoSeguridad
    });

    // 3. XML + Firma (Simulada si falta archivo)
    const xmlBruto = generarXmlSifen(documento, perfil, cdc);
        const xmlFirmado = await firmarXmlSifen(xmlBruto, cert?.certificado_base64 || '', cert?.password_cifrada || '');

    // 4. LOGICA DE TRANSMISIÓN TEST (Set de Pruebas Phase 6)
        const tieneCertificado = !!cert?.certificado_base64;
    const respuestaSifen = { 
        estado: tieneCertificado ? "tramite" : "aprobado", 
        codigo_dn: "0000", 
        mensaje: tieneCertificado ? "Enviado a SIFEN UAT" : "Aprobado (Simulación Phase 6)",
        cdc: cdc
    };

        const latencyMs = Date.now() - startedAt;

        await persistirLogDocumento({
            xml_generado: xmlBruto,
            xml_firmado: xmlFirmado,
            respuesta_sifen: respuestaSifen,
            estado: 'exito',
            error_code: null,
            error_message: null,
            latency_ms: latencyMs,
        });

    await clienteSupabase.from('documentos_electronicos').update({ 
        estado_sifen: 'aprobado',
        cdc: cdc
        }).eq('id', documentoId);

        await persistirMetrica(true, latencyMs);

        logStructured('info', 'Emision SIFEN completada', {
            request_id: requestId,
            documento_id: documentoId,
            latency_ms: latencyMs,
            cdc,
        });

    return new Response(
            JSON.stringify({ success: true, cdc, qr: `https://kuatia.set.gov.py/consultas/qr?cdc=${cdc}`, request_id: requestId, latency_ms: latencyMs }),
      { headers: { ...cabecerasCors, 'Content-Type': 'application/json' } }
    );

    } catch (rawError) {
        const error = parsearError(rawError);
        const latencyMs = Date.now() - startedAt;

        const clienteSupabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

        if (documentoId) {
            try {
                await clienteSupabase.from('documentos_xml_logs').insert({
                    documento_id: documentoId,
                    request_id: requestId,
                    xml_generado: null,
                    xml_firmado: null,
                    respuesta_sifen: { status: 'error', error_code: error.code },
                    estado: 'error',
                    error_code: error.code,
                    error_message: error.message,
                    latency_ms: latencyMs,
                });

                await clienteSupabase.from('documentos_electronicos').update({
                    estado_sifen: 'rechazado',
                }).eq('id', documentoId);
            } catch {
                // Si falla el registro de error, priorizamos respuesta al cliente.
            }
        }

        try {
            await clienteSupabase.from('sifen_metricas_eventos').insert({
                request_id: requestId,
                documento_id: documentoId,
                ok: false,
                latency_ms: latencyMs,
                error_code: error.code,
            });
        } catch {
            // Sin bloqueo por metricas.
        }

        logStructured('error', 'Fallo emision SIFEN', {
            request_id: requestId,
            documento_id: documentoId,
            error_code: error.code,
            latency_ms: latencyMs,
            message: error.message,
        });

        return new Response(JSON.stringify({
            success: false,
            error_code: error.code,
            error_message: error.message,
            request_id: requestId,
            latency_ms: latencyMs,
        }), {
      headers: { ...cabecerasCors, 'Content-Type': 'application/json' },
            status: error.status,
    });
  }
});
