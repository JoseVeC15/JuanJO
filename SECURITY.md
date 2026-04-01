# Manual de Seguridad - FINANCE PRO 🛡️

Este documento resume el blindaje implementado y las políticas de cumplimiento para mantener la plataforma segura, profesional y consistente bajo los estándares de 2026.

---

## 🔒 Arquitectura de Blindaje (Implementado)

### 1. Cabeceras de Seguridad HTTP (Vercel)
Se han inyectado cabeceras de red para mitigar los ataques web más comunes:
- **X-Frame-Options (DENY)**: Bloquea intentos de Clickjacking en iframes externos.
- **Content-Security-Policy (CSP)**: Restringe la carga de recursos a fuentes de confianza (`self`, `supabase.co`, `google.com`).
- **HSTS**: Fuerza el uso de conexiones cifradas (HTTPS) por 1 año.
- **Permissions-Policy**: Desactiva hardware innecesario (cámara, micrófono, geolocalización).

### 2. Autenticación y Protección de Cuentas
- **Password Hardening**: Se ha elevado el requisito mínimo de contraseña a **8 caracteres** en todas las pantallas (`Login`, `AdminPanel`, `ChangePassword`).
- **Validación Proactiva**: Se implementó una comprobación por Regex de email en el cliente para dar feedback instantáneo y evitar peticiones basura al servidor.
- **Mapeo de Errores**: Se tradujeron todos los códigos técnicos de Supabase a mensajes amigables y específicos en español.
- **Error Silencing**: Los fallos internos de recuperación de sesión en `AuthContext.tsx` ahora se manejan de forma silenciosa para evitar fugas de información en la consola.

### 3. Seguridad de APIs y Dominio
- **CORS Restringido**: Las funciones de Supabase (`create-client-user`, `admin-manage-user`) ahora solo aceptan peticiones desde `https://finance.josevec.uk`.
- **Higiene de Datos**: Configuración de `envPrefix: 'VITE_'` en Vite para que solo las variables de entorno autorizadas lleguen al navegador.

---

## ✅ Checklist OWASP para el futuro

- [ ] **Mínimo Privilegio**: ¿Cada nueva tabla en Supabase tiene sus RLS (Row Level Security) activas?
- [ ] **CORS**: ¿Cada nueva Edge Function tiene restringido el origen a `https://finance.josevec.uk`?
- [ ] **Validación**: ¿Se valida la longitud y complejidad de cada campo de entrada de usuario?
- [ ] **Dependencias**: ¿Se ha revisado `npm audit` para parches de seguridad recientes?

> [!IMPORTANT]
> **Recomendación de Seguridad**: Nunca incluyas secretos o claves privadas (Service Role Keys) en variables que empiecen por `VITE_`. El Service Role Key solo debe usarse en funciones de servidor (Edge Functions) que corren fuera del navegador.

---

## 🔐 Politica de Secretos y Certificados

- Las credenciales sensibles (`SUPABASE_SERVICE_ROLE_KEY`, CSC, password de certificado) deben rotarse como minimo cada 90 dias.
- El frontend no debe persistir contraseñas de certificados en texto plano.
- Toda rotacion debe registrarse en `secret_rotation_audit`.
- El certificado digital debe validarse por estado y fecha de vencimiento antes de emitir documentos.

## 📋 Auditoria Operativa

- Cada emision SIFEN debe tener `request_id` para trazabilidad cruzada (UI, edge, logs SQL).
- Registrar en `documentos_xml_logs` el estado (`exito/error`), `error_code` y `latency_ms`.
- Monitorear `sifen_metricas_eventos` para tasa de fallos y latencia p95.

**FINANCE PRO SECURITY PROTOCOL v2.0.0**
