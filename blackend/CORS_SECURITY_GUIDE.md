# 🔒 Guía de Seguridad CORS

## ¿Qué es CORS?

**CORS (Cross-Origin Resource Sharing)** es un mecanismo de seguridad del navegador que controla qué dominios pueden acceder a tu API. Sin CORS configurado correctamente, tu API podría ser vulnerable a ataques desde sitios web maliciosos.

---

## ✅ Configuración Actual

Tu aplicación ahora tiene CORS restrictivo implementado en `server.js` (líneas 11-49).

### Características de Seguridad:

1. **Whitelist de dominios permitidos** - Solo los dominios en `ALLOWED_ORIGINS` pueden acceder
2. **Métodos HTTP restringidos** - Solo GET, POST, PUT, DELETE, OPTIONS
3. **Headers controlados** - Solo Content-Type y Authorization permitidos
4. **Credentials habilitados** - Permite JWT tokens y cookies
5. **Logging en desarrollo** - Monitoreo de peticiones bloqueadas

---

## 🛠️ Configuración por Entorno

### Desarrollo Local

```env
# blackend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
NODE_ENV=development
```

Esto permite:
- Frontend en `localhost:3000` (React default)
- Frontend alternativo en `localhost:3001`
- Variante con IP `127.0.0.1:3000`

### Producción

```env
# blackend/.env (en servidor de producción)
ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com
NODE_ENV=production
```

⚠️ **IMPORTANTE:**
- SOLO usa HTTPS en producción
- Lista EXACTAMENTE los dominios de tu frontend
- NO incluyas subdominios que no uses
- NO uses wildcards (*)

---

## 🧪 Pruebas de Seguridad

### Probar que CORS funciona correctamente:

1. **Inicio del servidor en desarrollo:**
   ```bash
   cd blackend
   npm start
   ```

   Deberías ver en consola:
   ```
   🔒 CORS configurado con orígenes permitidos: [ 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000' ]
   ```

2. **Prueba desde origen permitido:**
   ```bash
   # Desde tu frontend en localhost:3000, verás en logs del backend:
   📡 GET /api/reservations | Origen: http://localhost:3000 | ✅ Permitido
   ```

3. **Prueba desde origen NO permitido:**
   Intenta acceder desde otro dominio (ej: `http://localhost:8080`):
   ```bash
   # Verás en logs del backend:
   📡 GET /api/reservations | Origen: http://localhost:8080 | ❌ Bloqueado
   ⚠️  CORS bloqueó petición desde origen no autorizado: http://localhost:8080
   ```

   El navegador mostrará error:
   ```
   Access to fetch at 'http://localhost:4000/api/reservations' from origin 'http://localhost:8080'
   has been blocked by CORS policy
   ```

---

## 🔧 Agregar Nuevos Orígenes

### Durante Desarrollo

Si necesitas agregar un nuevo puerto o dominio temporal:

```env
# blackend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

**Nota:** Vite usa puerto 5173 por defecto

### Para Producción

Cuando despliegues tu aplicación:

1. Obtén el dominio final (ej: `https://miagencia.com`)
2. Actualiza `.env` en el servidor:
   ```env
   ALLOWED_ORIGINS=https://miagencia.com,https://www.miagencia.com
   NODE_ENV=production
   ```
3. Reinicia el servidor backend

---

## 🚨 Errores Comunes y Soluciones

### Error: "No 'Access-Control-Allow-Origin' header"

**Causa:** El origen del frontend no está en `ALLOWED_ORIGINS`

**Solución:**
1. Verifica el origen en logs del backend
2. Agrégalo a `ALLOWED_ORIGINS` en `.env`
3. Reinicia el servidor

### Error: "CORS policy: credentials mode is 'include'"

**Causa:** Frontend está enviando credentials pero CORS no está configurado

**Solución:** Ya está resuelto - `credentials: true` está habilitado

### Error: Requests funcionan en Postman pero no en navegador

**Causa:** Postman no implementa CORS (es un cliente HTTP, no navegador)

**Solución:** Normal y esperado. Prueba desde el navegador con el frontend real.

---

## 📊 Monitoreo y Debugging

### Logs en Desarrollo

Cada request muestra información detallada:
```
📡 POST /api/login | Origen: http://localhost:3000 | ✅ Permitido
📡 GET /api/reservations | Origen: http://localhost:3000 | ✅ Permitido
⚠️  CORS bloqueó petición desde origen no autorizado: http://evil-site.com
```

### Logs en Producción

En producción, el logging detallado está deshabilitado por performance. Solo se bloquean orígenes no autorizados sin logging.

---

## 🛡️ Mejores Prácticas

1. **✅ Principio de mínimo privilegio:**
   - Solo lista dominios que realmente necesitas
   - Revisa y limpia la lista regularmente

2. **✅ Separación por ambiente:**
   - `.env` diferente para desarrollo/staging/producción
   - Nunca mezcles dominios de desarrollo con producción

3. **✅ HTTPS en producción:**
   - Siempre usa `https://` en `ALLOWED_ORIGINS` de producción
   - Nunca permitas `http://` en producción

4. **✅ Documentación del equipo:**
   - Mantén lista actualizada de orígenes válidos
   - Documenta por qué cada origen está permitido

5. **❌ NUNCA hagas esto:**
   ```javascript
   // ❌ MAL - Permite CUALQUIER origen
   app.use(cors({ origin: '*' }))

   // ❌ MAL - Regex demasiado permisivo
   app.use(cors({ origin: /.*/ }))

   // ❌ MAL - Desactiva CORS en producción
   if (NODE_ENV !== 'production') app.use(cors())
   ```

---

## 🔄 Actualización de Configuración

Si necesitas cambiar los orígenes permitidos:

1. **Edita** `blackend/.env`:
   ```env
   ALLOWED_ORIGINS=nuevo-dominio.com,otro-dominio.com
   ```

2. **Reinicia** el servidor:
   ```bash
   # Ctrl+C para detener
   npm start
   ```

3. **Verifica** en logs que se cargó correctamente:
   ```
   🔒 CORS configurado con orígenes permitidos: [ 'nuevo-dominio.com', 'otro-dominio.com' ]
   ```

---

## 📚 Referencias

- [MDN - CORS](https://developer.mozilla.org/es/docs/Web/HTTP/CORS)
- [OWASP - CORS Security](https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny)
- [Express CORS Package](https://www.npmjs.com/package/cors)

---

## 🆘 Soporte

Si experimentas problemas con CORS:

1. Revisa los logs del backend en desarrollo
2. Verifica que el origen está en `ALLOWED_ORIGINS`
3. Confirma que el frontend está haciendo requests al puerto correcto
4. Usa las DevTools del navegador (Network tab) para ver headers CORS

---

**Última actualización:** 2025
**Nivel de seguridad:** 🟢 Alto
