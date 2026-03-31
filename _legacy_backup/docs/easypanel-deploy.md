# Guía de Despliegue en Easypanel

## Paso a Paso Completo

### Paso 1: Preparar el Repositorio

```bash
# Asegúrate de que todo está commiteado
cd /Users/juanjo/Documents/JuanJo
git add .
git commit -m "Preparar para despliegue en Easypanel"
git push origin main
```

---

### Paso 2: Crear el Servicio en Easypanel

1. **Acceder a Easypanel**
   - URL: `https://panel.josevec.uk` (o tu URL de Easypanel)
   - Login con tus credenciales

2. **Crear Nuevo Proyecto**
   - Click en **"New Project"**
   - Nombre: `saas-audiovisual`
   - Click **"Create Project"**

3. **Agregar Servicio Git**
   - Click **"Add Service"**
   - Seleccionar **"Git Repository"**
   - Conectar tu repositorio GitHub/GitLab

4. **Configurar el Build**
   ```
   Repository: <tu-repositorio>
   Branch: main
   Build Path: /saas_audiovisual
   ```

---

### Paso 3: Configurar Variables de Entorno

Click en **"Environment"** y agregar:

```env
# Supabase
SUPABASE_URL=https://db.yfktdnpcmdpjrdlhqrls.supabase.co
SUPABASE_ANON_KEY=sb_publishable_bcIFK_FA8uduHv6r2VeIGg_AE3882-e

# n8n (si usas n8n separado)
N8N_HOST=https://n8nlocal.josevec.uk

# Telegram
TELEGRAM_BOT_TOKEN=<tu-token-del-bot>
TELEGRAM_CHAT_ID=1561439670

# OpenAI (para OCR)
OPENAI_API_KEY=sk-<tu-api-key>

# n8n Password (si despliegas n8n en Easypanel)
N8N_PASSWORD=<tu-contraseña-segura>
POSTGRES_PASSWORD=<tu-contraseña-postgres>
```

---

### Paso 4: Configurar el Dockerfile

Easypanel detectará automáticamente el `Dockerfile`. Verificar configuración:

**Service Settings:**
```
Service Name: frontend
Dockerfile Path: /saas_audiovisual/Dockerfile
Build Context: /saas_audiovisual
Port: 8080
```

---

### Paso 5: Configurar Dominio

1. **En Easypanel:**
   - Ir a **"Domains"** del servicio
   - Click **"Add Domain"**
   - Dominio: `app.josevec.uk` (o el que prefieras)

2. **En Cloudflare:**
   - Agregar registro DNS:
   ```
   Type: CNAME
   Name: app
   Target: <tu-servidor>.josevec.uk
   Proxy: Activado (naranja)
   ```

3. **SSL/TLS:**
   - Easypanel configurará automáticamente Let's Encrypt
   - Verificar que el certificado esté activo

---

### Paso 6: Desplegar

1. **Click en "Deploy"**
   - Easypanel construirá la imagen Docker
   - El proceso toma 3-5 minutos

2. **Verificar Logs**
   ```
   Build logs → Verificar que no hay errores
   Runtime logs → Verificar que nginx inicia correctamente
   ```

3. **Health Check**
   - URL: `https://app.josevec.uk/health`
   - Debe retornar: `healthy`

---

### Paso 7: Configurar n8n (Opcional)

Si quieres desplegar n8n también en Easypanel:

1. **Crear segundo servicio**
   - **"Add Service"** → **"Docker Compose"**
   - Usar `docker-compose.yml` del proyecto

2. **O usar n8n Cloud:**
   - Ya tienes n8n en `https://n8nlocal.josevec.uk`
   - Solo asegurar que los webhooks funcionan

---

### Paso 8: Verificar el Despliegue

1. **Acceder a la App:**
   ```
   https://app.josevec.uk
   ```

2. **Test de Login:**
   - Registrar nuevo usuario
   - Verificar que se crea en Supabase

3. **Test de Funcionalidades:**
   - Dashboard carga correctamente
   - Proyectos se listan
   - Inventario se muestra
   - Cámara funciona (HTTPS requerido)

---

## Comandos Útiles en Easypanel

### Ver Logs en Tiempo Real
```
Service → Logs → Ver logs en vivo
```

### Reiniciar Servicio
```
Service → Actions → Restart
```

###重建 Imagen
```
Service → Actions → Rebuild
```

### SSH al Container
```
Service → Terminal → Abrir terminal
```

---

## Troubleshooting

### Error: "Cannot connect"
```bash
# Verificar que el puerto está expuesto
docker ps
# Debe mostrar 0.0.0.0:8080->80/tcp
```

### Error: "Build failed"
```bash
# Verificar logs del build
# Común: Flutter SDK no encontrado
# Solución: Asegurar que Dockerfile usa imagen correcta
```

### Error: "502 Bad Gateway"
```bash
# Nginx no está corriendo
# Verificar logs del container
# Posible error en nginx.conf
```

### Error de CORS en Supabase
```
# Agregar dominio en Supabase Dashboard
# Authentication → URL Configuration
# Site URL: https://app.josevec.uk
# Additional Redirect URLs: https://app.josevec.uk/*
```

---

## Estructura Final en Easypanel

```
Proyecto: saas-audiovisual
│
├── Service: frontend
│   ├── Build: Dockerfile
│   ├── Port: 8080
│   ├── Domain: app.josevec.uk
│   └── Env: SUPABASE_URL, etc.
│
└── Service: n8n (opcional)
    ├── Build: docker-compose.yml
    ├── Port: 5678
    ├── Domain: n8n.josevec.uk
    └── Env: N8N_PASSWORD, etc.
```

---

## Checklist de Verificación

- [ ] Repositorio conectado
- [ ] Variables de entorno configuradas
- [ ] Build exitoso (sin errores)
- [ ] Container corriendo
- [ ] Puerto 8080 expuesto
- [ ] Dominio configurado
- [ ] SSL activo (HTTPS)
- [ ] Health check responde
- [ ] Login funciona
- [ ] Datos cargan correctamente

---

## URLs Finales

| Servicio | URL |
|----------|-----|
| App Flutter | `https://app.josevec.uk` |
| n8n | `https://n8nlocal.josevec.uk` |
| Supabase | `https://db.yfktdnpcmdpjrdlhqrls.supabase.co` |

---

## Soporte

Si tienes problemas:
1. Revisar logs en Easypanel
2. Verificar variables de entorno
3. Test Supabase directamente
4. Revisar configuración de dominio en Cloudflare
