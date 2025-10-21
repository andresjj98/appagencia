# 🛡️ Guía de Rate Limiting

## ¿Qué es Rate Limiting?

**Rate Limiting** es una técnica de seguridad que limita el número de peticiones que un cliente (identificado por IP) puede hacer a tu API en un período de tiempo específico. Esto protege contra:

- 🔐 **Ataques de fuerza bruta** en el login
- 💥 **Ataques DDoS** (Denegación de Servicio)
- 🤖 **Bots maliciosos** que intentan abusar de tu API
- 📊 **Uso excesivo** de recursos del servidor

---

## ✅ Configuración Actual

Tu aplicación ahora tiene **4 niveles de Rate Limiting** configurados:

### 1. Login Rate Limiter (MUY ESTRICTO)
**Archivo:** `middleware/rateLimiter.js`
**Ruta:** `/api/login`

```
⏱️  Ventana: 15 minutos
🔢 Límite: 5 intentos
🎯 Propósito: Prevenir ataques de fuerza bruta
```

Si un usuario intenta iniciar sesión más de 5 veces en 15 minutos, recibirá:
```json
{
  "error": "Demasiados intentos de inicio de sesión",
  "message": "Has excedido el límite de intentos de login. Por favor, intenta nuevamente en 15 minutos.",
  "retryAfter": "15 minutos"
}
```

---

### 2. API Rate Limiter (GENERAL)
**Archivo:** `server.js` (línea 71)
**Rutas:** Todas las rutas `/api/*`

```
⏱️  Ventana: 15 minutos
🔢 Límite: 100 requests
🎯 Propósito: Protección general contra abuso
```

Aplica a TODAS las peticiones a la API (excepto login que tiene su propia regla más estricta).

---

### 3. Upload Rate Limiter (RESTRICTIVO)
**Archivo:** `middleware/rateLimiter.js`
**Rutas aplicadas:**
- `/api/reservations/:id/attachments/upsert` (adjuntos de reservas)
- `/api/business-settings/logo/:type` (logos)
- `/api/installments/:id/receipt` (comprobantes de pago)
- `/api/usuarios/:id/avatar` (avatares de usuario)

```
⏱️  Ventana: 15 minutos
🔢 Límite: 10 uploads
🎯 Propósito: Proteger recursos de procesamiento de archivos
```

---

### 4. Strict Rate Limiter (DISPONIBLE)
**Archivo:** `middleware/rateLimiter.js`
**Estado:** Configurado pero no aplicado

```
⏱️  Ventana: 15 minutos
🔢 Límite: 20 requests
🎯 Propósito: Para operaciones sensibles futuras
```

---

## 📊 Resumen de Límites

| Endpoint/Tipo | Límite | Ventana | Severidad |
|---------------|--------|---------|-----------|
| **Login** | 5 intentos | 15 min | 🔴 Crítico |
| **Uploads** | 10 archivos | 15 min | 🟠 Alto |
| **API General** | 100 requests | 15 min | 🟡 Medio |
| **Strict (futuro)** | 20 requests | 15 min | 🟠 Alto |

---

## 🚀 Cómo Funciona

### Identificación por IP

Cada cliente es identificado por su dirección IP. Las restricciones son POR IP, no por usuario.

**Ejemplo:**
```
IP: 192.168.1.100
- Intento 1 login: ✅ OK
- Intento 2 login: ✅ OK
- Intento 3 login: ✅ OK
- Intento 4 login: ✅ OK
- Intento 5 login: ✅ OK (último permitido)
- Intento 6 login: ❌ BLOQUEADO (429 Too Many Requests)
```

### Headers de Respuesta

Cada respuesta incluye headers informativos:

```http
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1640000000
```

- **RateLimit-Limit**: Límite total permitido
- **RateLimit-Remaining**: Intentos restantes
- **RateLimit-Reset**: Timestamp UNIX cuando se resetea el contador

---

## 🧪 Pruebas de Funcionamiento

### Prueba 1: Verificar Rate Limiting en Login

**Script de prueba bash:**
```bash
# Intenta hacer 6 logins seguidos (5 permitidos + 1 bloqueado)
for i in {1..6}; do
  echo "Intento $i:"
  curl -X POST http://localhost:4000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done
```

**Resultado esperado:**
```
Intento 1: Status: 401 (Credenciales inválidas)
Intento 2: Status: 401
Intento 3: Status: 401
Intento 4: Status: 401
Intento 5: Status: 401
Intento 6: Status: 429 (Rate limit excedido) ✅
```

---

### Prueba 2: Verificar Headers de Rate Limit

```bash
curl -I http://localhost:4000/api/login \
  -X POST \
  -H "Content-Type: application/json"
```

**Headers esperados:**
```
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 1640000000
```

---

### Prueba 3: Verificar Reseteo Automático

Después de 15 minutos, el contador se resetea automáticamente y puedes volver a hacer requests.

---

## 📝 Logs del Sistema

### En Desarrollo (NODE_ENV=development)

Cuando se excede un límite, verás en consola:

```
⚠️  Rate limit excedido en /login desde IP: ::ffff:127.0.0.1
⚠️  Rate limit de uploads excedido desde IP: ::1 | Path: /api/usuarios/123/avatar
⚠️  Rate limit general excedido desde IP: 192.168.1.100 | Path: /api/reservations
```

### En Producción (NODE_ENV=production)

Los logs se mantienen pero sin el prefijo de emoji para mejor parseo:
```
Rate limit exceeded at /login from IP: 203.0.113.50
```

---

## ⚙️ Configuración Personalizada

### Cambiar Límites

Edita `blackend/middleware/rateLimiter.js`:

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Cambia este número para ajustar el límite
  // ...
});
```

**Valores recomendados:**

**Login:**
- Desarrollo: 10-20 intentos
- Producción: 3-5 intentos

**API General:**
- Desarrollo: Sin límite o 500+
- Producción: 100-200 requests

**Uploads:**
- Desarrollo: 20-50 uploads
- Producción: 5-10 uploads

---

### Desactivar en Desarrollo (NO RECOMENDADO)

Si necesitas desactivar temporalmente para testing:

```javascript
// En middleware/rateLimiter.js
const loginLimiter = process.env.NODE_ENV === 'development'
  ? (req, res, next) => next() // Bypass en desarrollo
  : rateLimit({ /* configuración */ });
```

⚠️ **ADVERTENCIA:** Solo desactiva si es absolutamente necesario y recuerda reactivar.

---

## 🔧 Manejo en Frontend

### Detectar Error 429

```javascript
// frontend/src/utils/api.js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      // Rate limit excedido
      const message = error.response.data.message ||
        'Demasiados intentos. Por favor, espera antes de intentar nuevamente.';

      alert(message);
      // O mostrar un toast/notificación más elegante
    }
    return Promise.reject(error);
  }
);
```

### Mostrar Tiempo Restante

```javascript
const retryAfter = error.response.headers['retry-after'];
if (retryAfter) {
  console.log(`Reintentar después de ${retryAfter} segundos`);
}
```

---

## 🚨 Escenarios de Bloqueo Comunes

### Escenario 1: Usuario Olvidó su Contraseña

**Problema:** Usuario intenta 5 contraseñas diferentes, se bloquea.

**Soluciones:**
1. Implementar "Olvidé mi contraseña" en el frontend
2. Mostrar contador de intentos restantes
3. Aumentar límite a 10 intentos (menos seguro)

---

### Escenario 2: Usuario Detrás de NAT/Proxy

**Problema:** Múltiples usuarios comparten la misma IP (oficina, universidad).

**Soluciones:**
1. Whitelist de IPs conocidas
2. Usar identificador adicional (device ID, session)
3. Aumentar límites para usuarios autenticados

---

### Escenario 3: Bot Legítimo (Monitoring)

**Problema:** Tu sistema de monitoreo hace health checks cada minuto.

**Soluciones:**
1. Crear endpoint `/health` sin rate limiting
2. Whitelist de IPs de tu monitoreo
3. Usar autenticación API key para servicios

---

## 🛠️ Whitelist de IPs (Avanzado)

Para excluir IPs específicas del rate limiting:

```javascript
// En middleware/rateLimiter.js
const loginLimiter = rateLimit({
  skip: (req) => {
    // IPs de confianza (tu oficina, servers de monitoreo, etc.)
    const trustedIPs = ['203.0.113.50', '198.51.100.10'];
    return trustedIPs.includes(req.ip);
  },
  // ... resto de configuración
});
```

---

## 📊 Monitoreo y Métricas

### Verificar Requests Bloqueados

```bash
# Ver logs de rate limiting
grep "Rate limit" logs/combined.log
```

### Analizar Patrones de Ataque

```bash
# Top 10 IPs bloqueadas
grep "Rate limit" logs/combined.log | \
  grep -oP 'IP: \K[0-9.]+' | \
  sort | uniq -c | sort -rn | head -10
```

---

## 🔐 Mejores Prácticas

### ✅ Hacer

1. **Mantener límites estrictos en login** - 3-5 intentos es óptimo
2. **Monitorear logs** - Detecta patrones de ataque
3. **Comunicar claramente al usuario** - Mensajes de error informativos
4. **Ajustar según uso real** - Analiza métricas y ajusta límites
5. **Combinar con otras medidas** - CAPTCHA, 2FA, etc.

### ❌ No Hacer

1. **Límites demasiado permisivos** - No uses 1000+ requests
2. **Desactivar en producción** - NUNCA desactives rate limiting
3. **Bloqueos permanentes** - Siempre debe haber un reseteo
4. **Ignorar falsos positivos** - Ajusta si usuarios legítimos se bloquean
5. **Confiar solo en rate limiting** - Es una capa, no LA solución

---

## 🔄 Alternativas y Mejoras Futuras

### 1. Rate Limiting por Usuario (en vez de IP)

```javascript
const loginLimiter = rateLimit({
  keyGenerator: (req) => {
    return req.body.email || req.ip; // Usa email si está disponible
  },
  // ...
});
```

### 2. Ventanas Deslizantes (Sliding Window)

Más preciso pero más costoso en recursos:
```bash
npm install rate-limit-redis
```

### 3. CAPTCHA en Login

Después de 3 intentos fallidos, mostrar CAPTCHA antes del 4to intento.

### 4. Autenticación de 2 Factores (2FA)

La mejor protección contra ataques de fuerza bruta.

---

## 📚 Referencias

- [Express Rate Limit - NPM](https://www.npmjs.com/package/express-rate-limit)
- [OWASP - Brute Force Attacks](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [HTTP Status 429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

---

## 🆘 Solución de Problemas

### Error: "Too many requests" en desarrollo

**Solución temporal:**
```bash
# Espera 15 minutos o reinicia el servidor
npm restart
```

### Rate limit no funciona

**Verificar:**
1. ✅ Middleware está importado correctamente
2. ✅ Middleware está aplicado ANTES del handler
3. ✅ No hay errores en consola al iniciar servidor

### Usuarios legítimos bloqueados

**Soluciones:**
1. Revisar logs para identificar patrón
2. Aumentar límite si es justificado
3. Implementar whitelist
4. Considerar rate limiting por usuario en vez de IP

---

**Última actualización:** 2025
**Nivel de seguridad:** 🟢 Alto
**Implementado por:** express-rate-limit v7
