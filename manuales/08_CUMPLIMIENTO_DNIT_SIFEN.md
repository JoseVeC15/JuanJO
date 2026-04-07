# 08. CUMPLIMIENTO DNIT / SIFEN (PARAGUAY)

## Objetivo
Convertir Finance Pro en un sistema de facturacion con cumplimiento operativo para Paraguay, incluyendo emision, trazabilidad, auditoria y cierre fiscal.

## Estado actual (base implementada)
- Emision de documentos electronicos con motor SIFEN.
- Generacion de CDC y XML base.
- Registro de logs de emision y metricas.
- Seguridad multi-tenant con RLS.
- Validacion base en frontend y edge function.

## Cambios aplicados en esta iteracion
- Numeracion secuencial fiscal por usuario + tipo + establecimiento + punto.
- Validacion de payload fiscal en frontend (RUC, email, items, IVA, condicion).
- Constraints SQL minimos para tipo_documento, condicion_operacion e iva_tipo.

## Brechas para cumplimiento total
1. Firma digital real XAdES-EPES con certificado valido (no mock).
2. Integracion completa con endpoints UAT/PROD de SIFEN (recepcion de respuesta oficial y eventos).
3. Gestion documental completa por tipo: FE, NC, ND y anulacion/eventos.
4. Talonarios y vigencia de timbrado con alertas de vencimiento.
5. Reglas de contingencia, reintentos y reconciliacion automatica.
6. KuDE homologado (contenido minimo legal + QR oficial + representacion por tipo documental).
7. Libro IVA compras/ventas y reportes para declaraciones.
8. Suite de pruebas de regresion fiscal (unitarias + e2e + fixtures reales).

## Plan de ejecucion recomendado
1. Fase 1 (1-2 semanas): firma digital real + transmision UAT + validacion de respuestas.
2. Fase 2 (1-2 semanas): NC/ND, anulaciones y eventos SIFEN.
3. Fase 3 (1 semana): libro IVA + cierre mensual + auditoria.
4. Fase 4 (1 semana): endurecimiento QA fiscal y despliegue controlado.

## Criterio de salida
Se considera "cumplimiento operativo" cuando:
- Todo documento emitido queda trazable con estado oficial de SIFEN.
- No existen saltos de numeracion por punto de expedicion.
- Todo comprobante tiene KuDE valido y QR consultable.
- Existe evidencia de auditoria (logs, metricas y pruebas) para inspeccion.

## Nota
Este manual es tecnico y no sustituye asesoria legal o tributaria profesional.
