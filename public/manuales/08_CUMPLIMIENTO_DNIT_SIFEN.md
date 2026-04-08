# 08. CUMPLIMIENTO DNIT / SIFEN (PARAGUAY)

## Objetivo
Convertir Finance Pro en un sistema de facturacion con cumplimiento operativo para Paraguay, incluyendo emision, trazabilidad, auditoria y cierre fiscal.

## Marco Legal
- **Ley 6380/2019** — Modernización y Simplificación del Sistema Tributario Nacional
- **SET** (Subsecretaría de Estado de Tributación) — Autoridad reguladora
- **SIFEN** — Sistema Integrado de Facturación Electrónica Nacional (DNIT)
- **Referencia técnica completa**: Ver `09_GUIA_FISCAL_PARAGUAY.md`

## Documentos Electrónicos Soportados
| Código | Tipo | Estado en Finance Pro |
|--------|------|-----------------------|
| 1 | Factura Electrónica (FE) | ✅ Implementado |
| 4 | Autofactura Electrónica | 🔶 Parcial |
| 5 | Nota de Débito Electrónica | ⬜ Pendiente |
| 6 | Nota de Crédito Electrónica | ⬜ Pendiente |
| 7 | Nota de Remisión Electrónica | ⬜ Pendiente |

## Estado actual (base implementada)
- Emision de Factura Electrónica con motor SIFEN (Edge Function).
- Generacion de CDC (44 dígitos) con algoritmo Verhoeven.
- Generación de KuDE (PDF) con QR oficial.
- Registro de logs de emision y metricas.
- Seguridad multi-tenant con RLS.
- Validacion con constantes normativas (IVA 0/5/10, RUC, condición venta).
- Numeración secuencial fiscal por usuario + tipo + establecimiento + punto.
- Asistente de Cierre Mensual (Formulario 120 v4 proforma).
- Prorrateo de IVA Crédito Indiviso.
- Arrastre de saldo a favor entre periodos.

## IVA — Tasas Vigentes
| Tasa | Aplicación | Divisor (monto bruto) |
|------|-----------|----------------------|
| 10% | General (servicios, importaciones) | monto / 11 |
| 5% | Diferencial (alimentos, medicamentos) | monto / 21 |
| 0% | Exento (educación, exportaciones) | N/A |

## Brechas para cumplimiento total
1. Firma digital real XAdES-EPES con certificado valido (no mock).
2. Integracion completa con endpoints UAT/PROD de SIFEN.
3. Gestion documental completa: NC, ND, anulación y eventos.
4. Alertas de vencimiento de timbrado.
5. Reglas de contingencia y reconciliación.
6. KuDE homologado por tipo documental.
7. Libro IVA compras/ventas completo.
8. Suite de pruebas de regresión fiscal.

## Obligaciones Periódicas Integradas
| Obligación | Soporte Finance Pro |
|------------|-------------------|
| Formulario 120 (IVA mensual) | ✅ Proforma automática |
| Libro IVA Compras/Ventas | 🔶 Parcial (datos disponibles) |
| Retenciones (F530) | ⬜ Pendiente |
| Declaración IRE anual (F500) | ⬜ Pendiente |

## Sanciones de Referencia
| Infracción | Sanción |
|------------|---------|
| No emitir comprobante | 50%~100% del valor |
| Datos falsos | Multa + clausura |
| Omisión IVA | 50% impuesto + intereses |

## Nota
Este manual es tecnico y no sustituye asesoria legal o tributaria profesional.
El usuario es responsable de la validez de los datos fiscales ingresados.
