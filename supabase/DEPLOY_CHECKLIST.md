# Checklist De Migracion (Staging -> Produccion)

## Pre-deploy
1. Confirmar backup reciente de produccion.
2. Validar que CI build este en verde (`npm run build`).
3. Revisar diferencias de migraciones pendientes.
4. Confirmar variables de entorno y secretos vigentes.

## Orden de migraciones
1. `supabase/migrations/20260401_clientes_table.sql`
2. `supabase/migrations/20260401_billing_module.sql`
3. `supabase/migrations/20260401_add_billing_flag.sql`
4. `supabase/migrations/20260401_sifen_compat_patch.sql`
5. `supabase/migrations/20260401_observability_and_security_hardening.sql`

## Validaciones post-migracion
1. Verificar RLS habilitado en tablas SIFEN y clientes.
2. Emitir documento de prueba SIFEN en ambiente test.
3. Confirmar inserciones en `documentos_xml_logs` y `sifen_metricas_eventos`.
4. Validar rutas protegidas: `/sifen`, `/sifen/clientes`.

## Rollback rapido
1. Desplegar commit anterior del frontend.
2. Revertir solo migraciones no destructivas con script inverso.
3. Si hubo alteracion de datos, restaurar backup puntual.
4. Documentar incidente y tiempo de recuperacion.

## Rotacion de secretos
1. Rotar `SUPABASE_SERVICE_ROLE_KEY` en entorno seguro.
2. Actualizar secretos de Edge Functions.
3. Registrar evento en `secret_rotation_audit`.
4. Ejecutar smoke test e2e tras rotacion.
