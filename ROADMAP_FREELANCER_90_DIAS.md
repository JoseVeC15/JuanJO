# ROADMAP FREELANCER 90 DIAS

Objetivo general: convertir Finance Pro en un sistema donde un freelancer pueda operar solo, cobrar mejor y cerrar mes sin depender de planillas externas.

## Metas de negocio (90 dias)
- Reducir tiempo administrativo semanal en 40%.
- Mejorar tasa de cobro en fecha en 25%.
- Lograr cierre mensual guiado en menos de 45 minutos.
- Aumentar retencion de usuarios activos en 20%.

## Fase 1 (Dias 1-30): Flujo de caja y operacion diaria
Objetivo: resolver lo urgente del freelancer (cobrar, no olvidar tareas, ver salud del negocio).

### Entregables
1. Centro de Cobros
- Estados: emitida, enviada, vista, vencida, cobrada.
- Filtros por vencimiento y cliente.
- Vista de deuda total y proximos 7 dias.

2. Recordatorios automaticos
- WhatsApp y/o email para facturas por vencer y vencidas.
- Plantillas editables por tono (formal, cordial, directo).

3. Agenda operativa minima
- Tareas de hoy: entregas, facturas pendientes, cobros por seguimiento.
- Notificaciones internas en dashboard.

4. Dashboard de salud financiera (v1)
- Caja proyectada 30 dias.
- Ingresos esperados vs gastos comprometidos.
- Top 5 clientes por facturacion.

### KPIs de fase
- Porcentaje de facturas con seguimiento activo.
- Cobros dentro de fecha de vencimiento.
- Usuarios que abren agenda al menos 3 veces por semana.

## Fase 2 (Dias 31-60): Productividad y rentabilidad real
Objetivo: estandarizar trabajo y evitar proyectos poco rentables.

### Entregables
1. Motor de rentabilidad por proyecto (v1)
- Costo real: horas, gastos, terceros.
- Margen real vs margen objetivo.
- Alerta cuando margen cae bajo umbral.

2. Plantillas reutilizables
- Propuesta comercial.
- Presupuesto.
- Factura recurrente.
- Contrato base editable.

3. Conciliacion simple
- Import CSV bancario y match basico con ingresos/gastos.
- Marcar movimientos conciliados y pendientes.

4. Biblioteca de automatizaciones
- Reglas: si cliente X + concepto Y => categoria sugerida.
- Reglas para vencimientos recurrentes.

### KPIs de fase
- Porcentaje de proyectos con margen calculado.
- Tiempo promedio para crear propuesta/factura.
- Porcentaje de movimientos conciliados.

## Fase 3 (Dias 61-90): Autonomia total + confianza operativa
Objetivo: cierre mensual asistido y operacion robusta sin friccion.

### Entregables
1. Cierre mensual guiado (wizard)
- Checklist: ingresos, gastos, IVA, pendientes de cobro, documentos.
- Generacion de reporte mensual PDF + snapshot JSON.

2. Asistente inteligente operativo
- Sugerencias diarias: a quien cobrar, que gasto clasificar, que proyecto revisar.
- Alertas de riesgo (caja negativa, vencimientos, baja rentabilidad).

3. Seguridad y continuidad
- Backup automatico programado.
- Restauracion validada en entorno staging.
- Registro de auditoria para cambios criticos.

4. Indicadores de negocio (v2)
- MRR/ingreso mensual freelancer.
- Churn de clientes del freelancer.
- Tasa de conversion propuesta -> cobro.

### KPIs de fase
- Tiempo real de cierre mensual.
- Incidencias operativas por mes.
- Uso de asistente (acciones sugeridas aceptadas).

## Backlog priorizado (si hay huecos)
1. App mobile ligera para captura rapida de comprobantes.
2. Firma digital de propuestas/contratos.
3. Integraciones con pasarela de pago.
4. Scoring de clientes (riesgo de mora).

## Plan de ejecucion semanal
- Semana 1: Discovery tecnico + diseno UX de Cobros y Agenda.
- Semana 2: Desarrollo Cobros + estados + filtros.
- Semana 3: Recordatorios y dashboard salud v1.
- Semana 4: QA, release fase 1 y medicion.
- Semana 5-6: Rentabilidad + plantillas.
- Semana 7-8: Conciliacion CSV + reglas.
- Semana 9: Cierre mensual wizard.
- Semana 10: Asistente operativo v1.
- Semana 11: Seguridad/backup/auditoria.
- Semana 12: Hardening, optimizacion y lanzamiento fase 3.

## Riesgos y mitigacion
1. Riesgo: sobrecarga de alcance.
- Mitigacion: limitar cada fase a maximo 4 entregables cerrados.

2. Riesgo: baja adopcion de funcionalidades nuevas.
- Mitigacion: onboarding contextual y medicion por evento.

3. Riesgo: deuda tecnica en integraciones.
- Mitigacion: feature flags y despliegue gradual por cohortes.

## Criterio de exito final
El freelancer puede:
- saber que cobrar hoy,
- registrar y clasificar rapido,
- medir rentabilidad por proyecto,
- cerrar el mes con guia y respaldo,
sin salir del sistema.
