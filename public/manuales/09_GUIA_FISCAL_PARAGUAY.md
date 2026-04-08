# Guía Fiscal Paraguay — Finance Pro

## Base Legal y Normativa Integrada

Este documento contiene toda la normativa fiscal paraguaya aplicada en Finance Pro. Referencia técnica para el módulo SIFEN, IVA, y cumplimiento ante la SET.

---

## 1. Autoridad Reguladora: la SET

La **Subsecretaría de Estado de Tributación (SET)**, dependiente del Ministerio de Hacienda, regula y fiscaliza toda la actividad tributaria en Paraguay. Portal oficial: [ekuatia.gov.py](https://ekuatia.gov.py).

## 2. Registro Obligatorio: el RUC

Formato: `XXXXXXXX-N` (número + dígito verificador).

- **Personas físicas**: documento de identidad como base.
- **Empresas**: acta de constitución + personería jurídica.

> ⚠️ Finance Pro valida el formato RUC automáticamente al emitir documentos electrónicos.

## 3. Regímenes Impositivos

| Régimen | Descripción | Facturación |
|---------|-------------|-------------|
| **Régimen General** | Empresas medianas y grandes | Facturas con IVA |
| **Régimen Simplificado (RS)** | Ingresos ≤ 80M Gs/año | Boletas simplificadas |
| **IRAGRO** | Actividades agropecuarias | Facturas agropecuarias |

## 4. Documentos Legales Reconocidos

### Comprobantes de Venta
| Documento | Uso |
|-----------|-----|
| **Factura** | A empresas/personas con RUC. Acredita IVA. |
| **Boleta de Venta** | A consumidores finales sin RUC. |
| **Ticket** | Ventas al por menor (autorización especial). |
| **Autofactura** | El comprador emite cuando el vendedor no puede. |

### Notas Complementarias
| Documento | Uso |
|-----------|-----|
| **Nota de Débito** | Aumenta valor de factura (intereses, cargos). |
| **Nota de Crédito** | Anula o reduce valor de factura. |
| **Nota de Remisión** | Traslado de mercaderías (no fiscal, obligatoria). |

## 5. Sistema de Timbrado

- Código que autoriza la numeración de comprobantes.
- Vigencia: generalmente **1 año**.
- Numeración: `001-001-XXXXXXX` (establecimiento-punto-correlativo).
- La imprenta debe estar **certificada por la SET**.

> ⚠️ Finance Pro genera numeración secuencial automática por establecimiento y punto de expedición.

## 6. SIFEN — Facturación Electrónica Nacional

### Tipos de Documentos Electrónicos (DE)

| Código | Tipo |
|--------|------|
| 1 | Factura Electrónica (FE) |
| 4 | Autofactura Electrónica |
| 5 | Nota de Débito Electrónica |
| 6 | Nota de Crédito Electrónica |
| 7 | Nota de Remisión Electrónica |

### CDC — Código de Control (44 dígitos)

Composición:
- RUC del emisor + Tipo de documento
- Punto de expedición + Establecimiento
- Número correlativo + Fecha
- Tipo de receptor + Dígito verificador (módulo 11 Verhoeven)

### Ambientes SIFEN

| Ambiente | URL | Validez |
|----------|-----|---------|
| **Prueba** | `sifen-test.set.gov.py` | Sin validez legal |
| **Producción** | `sifen.set.gov.py` | Validez legal plena |

### Proceso de Emisión
1. Generar XML firmado digitalmente (certificado .p12/.pfx).
2. Enviar a la SET vía Web Service SOAP.
3. Recibir QR + protocolo de autorización o rechazo.
4. Generar **KuDE** (PDF legal) y enviar al receptor.
5. El receptor verifica en `ekuatia.gov.py`.

### Certificado Digital
Proveedores habilitados: CERTIFIPAR (BNF), ASCENCIO, certificados internacionales reconocidos por MIC.

## 7. Impuestos en la Facturación

### IVA — Impuesto al Valor Agregado

| Categoría | Tasa |
|-----------|------|
| Tasa General (servicios, importaciones) | **10%** |
| Tasa Diferencial (alimentos básicos, medicamentos) | **5%** |
| Exentos (educación, financieros, exportaciones) | **0%** |

**Base imponible**: precio neto + IVA 5% + IVA 10%.

> Finance Pro calcula IVA automáticamente: `monto / 11` para 10% y `monto / 21` para 5%.

### IRE — Impuesto a la Renta Empresarial
- Ley N° 6380/19 (reemplazó IRACIS e IRAGRO).
- Tasa: **10%** sobre renta neta.
- Las facturas de gastos son **deducibles** si cumplen requisitos formales.

### IRP — Impuesto a la Renta Personal
- Personas físicas con ingresos anuales > 36 salarios mínimos.
- Facturas de gastos personales deducibles hasta cierto límite.

## 8. Requisitos Formales de una Factura

Una factura válida debe contener:
- Denominación del comprobante
- Número de Timbrado y vigencia
- RUC y razón social del emisor
- Dirección y actividad económica del emisor
- Número correlativo (`001-001-XXXXXXX`)
- Fecha de emisión
- RUC/CI y nombre del receptor
- Descripción, cantidad, precio unitario, precio total
- Discriminación del IVA (5% y/o 10%) y montos exentos
- Total a pagar
- Condición de venta (contado/crédito)

## 9. Conservación de Documentos

- Obligación de conservar por **5 años** (prescripción general).
- Documentos electrónicos: almacenar en **XML original firmado**.

## 10. Infracciones y Sanciones

| Infracción | Sanción |
|------------|---------|
| No emitir comprobante | 50% ~ 100% del valor |
| Emitir con datos falsos | Multa + clausura |
| Clausura | 1 a 30 días |
| Omisión de IVA | 50% del impuesto + intereses |
| No llevar contabilidad | Hasta 300 jornales mínimos |

## 11. Obligaciones Periódicas

| Periodicidad | Obligación |
|-------------|------------|
| **Mensual** | Declaración IVA (**Formulario 120**) |
| **Mensual** | Libro IVA Compras y Ventas |
| **Mensual** | Retenciones (Formulario 530 si aplica) |
| **Anual** | Declaración IRE/IRP (Formulario 500/510) |
| **Anual** | Renovación de Timbrado |

> Finance Pro genera la proforma del **Formulario 120 v4** automáticamente mediante el Asistente de Cierre Mensual.

## 12. Retenciones

Tasas comunes:
- **IVA**: 30%, 50% o 100% según tipo de operación.
- **IRE**: 1% ~ 3% sobre monto facturado.

## 13. Facturación en Moneda Extranjera

- Facturas en USD u otra moneda permitidas.
- IVA expresado en **guaraníes** obligatoriamente.
- Tipo de cambio: BCP (Banco Central del Paraguay) del día.

---

## Descargo de Responsabilidad

> Este manual es una referencia técnica integrada en Finance Pro y no sustituye asesoría legal o tributaria profesional. El usuario es el único responsable de la validez de los datos fiscales ingresados en el sistema.

---

*Referencia técnica basada en el Manual Técnico SIFEN publicado por la SET y la Ley 6380/2019 de Modernización Tributaria.*
