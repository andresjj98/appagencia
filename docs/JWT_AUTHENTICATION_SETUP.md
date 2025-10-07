# 🔐 Configuración de Autenticación JWT

## 📅 Fecha: 2025-01-06

## 📝 Resumen

Se ha implementado un sistema completo de autenticación JWT para el backend, necesario para proteger los endpoints del sistema de solicitudes de cambio.

---

## 🔧 Cambios Realizados

### 1. **Instalación de Dependencias**

```bash
npm install jsonwebtoken
```

### 2. **Creación del Middleware de Autenticación**

**Archivo:** `blackend/middleware/auth.js`

Este middleware proporciona dos funciones principales:

#### a) `authenticateToken`
Verifica que el token JWT sea válido y extrae la información del usuario.

```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      officeId: decoded.officeId
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};
```

**Uso:**
```javascript
router.post('/api/change-requests', authenticateToken, createChangeRequest);
```

#### b) `requireRole`
Verifica que el usuario tenga uno de los roles permitidos.

```javascript
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }
    next();
  };
};
```

**Uso:**
```javascript
// Solo gestores y administradores
router.post(
  '/change-requests/:id/approve',
  authenticateToken,
  requireRole('gestor', 'administrador'),
  approveChangeRequest
);
```

---

### 3. **Actualización del Controlador de Login**

**Archivo:** `blackend/controllers/auth.controller.js`

Se modificó para generar y devolver un token JWT al hacer login exitoso:

```javascript
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  // ... validación de credenciales ...

  // Generar JWT token
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      officeId: user.office_id
    },
    secret,
    { expiresIn: '24h' } // Token válido por 24 horas
  );

  delete user.password;
  res.json({ user, token }); // Ahora devuelve también el token
};
```

**Respuesta del endpoint `/api/login`:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "asesor",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4. **Actualización del Frontend - AuthContext**

**Archivo:** `frontend/src/pages/AuthContext.js`

#### a) Almacenar Token al Login

```javascript
const signIn = async ({ email, password }) => {
  const response = await fetch('http://localhost:4000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  // Guardar el token JWT en localStorage
  if (data.token) {
    localStorage.setItem('token', data.token);
  }

  // ... resto del código ...
};
```

#### b) Limpiar Token al Logout

```javascript
const logout = () => {
  setCurrentUser(null);
  setMockUser(null);
  localStorage.removeItem('token'); // Limpiar el token JWT
};
```

---

### 5. **Uso en Peticiones del Frontend**

Ahora todas las peticiones que requieren autenticación deben incluir el token:

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:4000/api/change-requests/123', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

**Ejemplo ya implementado en:**
- `CancelRequestModal.js` - línea 904
- `ChangeRequestManager.js` - líneas 19, 54, 85

---

## 🔐 Configuración de Variables de Entorno

Es **altamente recomendado** configurar una clave secreta personalizada para producción.

### En el archivo `.env` del backend:

```env
JWT_SECRET=tu-clave-secreta-super-segura-aqui-cambiar-en-produccion
```

**IMPORTANTE:**
- ⚠️ Nunca compartas esta clave
- ⚠️ Usa una clave diferente en desarrollo y producción
- ⚠️ La clave debe ser larga y aleatoria (mínimo 32 caracteres)

**Generar clave segura:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔄 Flujo de Autenticación

### 1. Login
```
Usuario → Frontend → POST /api/login → Backend
                                        ↓
                                   Valida credenciales
                                        ↓
                                   Genera JWT token
                                        ↓
Frontend ← { user, token } ← Backend
   ↓
Guarda token en localStorage
```

### 2. Peticiones Protegidas
```
Frontend → GET /api/change-requests
   ↓
Agrega header: Authorization: Bearer {token}
   ↓
Backend → Middleware authenticateToken
   ↓
Verifica token y extrae usuario
   ↓
req.user = { id, email, role, officeId }
   ↓
Ejecuta controlador
```

### 3. Logout
```
Frontend → logout()
   ↓
Limpia currentUser
   ↓
Limpia localStorage.token
   ↓
Usuario desautenticado
```

---

## 📊 Estados de Respuesta

### Autenticación Exitosa
- **200 OK**: Token válido, usuario autenticado
- `req.user` contiene información del usuario

### Errores de Autenticación
- **401 Unauthorized**: Token no proporcionado
  ```json
  { "error": "Token de autenticación requerido" }
  ```

- **403 Forbidden**: Token inválido o expirado
  ```json
  { "error": "Token inválido o expirado" }
  ```

### Errores de Autorización
- **403 Forbidden**: Usuario no tiene el rol requerido
  ```json
  {
    "error": "No tienes permisos para realizar esta acción",
    "requiredRoles": ["gestor", "administrador"],
    "userRole": "asesor"
  }
  ```

---

## 🛡️ Seguridad

### Token JWT Contiene:
```json
{
  "id": "uuid-del-usuario",
  "email": "usuario@example.com",
  "role": "asesor",
  "officeId": "uuid-oficina",
  "iat": 1704556800,  // Issued at (timestamp)
  "exp": 1704643200   // Expiration (timestamp)
}
```

### Características de Seguridad:
- ✅ Tokens expiran en 24 horas
- ✅ Token firmado con clave secreta
- ✅ Validación en cada petición protegida
- ✅ Información sensible (password) nunca en el token
- ✅ Verificación de roles para acciones críticas

---

## 🧪 Testing

### 1. Login y Obtener Token
```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"password123"}'
```

**Respuesta esperada:**
```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Usar Token en Petición Protegida
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:4000/api/change-requests/pending \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Verificar Expiración
El token expira en 24 horas. Después de ese tiempo, el usuario debe hacer login nuevamente.

---

## 🔍 Debugging

### Error: "Token de autenticación requerido"
**Causa:** No se envió el header Authorization
**Solución:** Verificar que el frontend esté enviando el header correctamente

### Error: "Token inválido o expirado"
**Causa 1:** Token JWT malformado o modificado
**Causa 2:** Token expirado (>24 horas)
**Causa 3:** JWT_SECRET cambió en el servidor
**Solución:** Hacer logout y login nuevamente

### Error: "No tienes permisos para realizar esta acción"
**Causa:** Usuario no tiene el rol requerido
**Solución:** Verificar que el usuario tenga el rol correcto en la BD

---

## 📋 Checklist de Migración

Para proteger endpoints existentes con autenticación:

- [ ] Importar middleware: `const { authenticateToken } = require('../middleware/auth');`
- [ ] Agregar middleware a la ruta: `router.post('/ruta', authenticateToken, controller);`
- [ ] Acceder a usuario en controlador: `const userId = req.user.id;`
- [ ] Actualizar frontend para enviar token en headers
- [ ] Probar escenarios con y sin token
- [ ] Probar con token expirado

---

## 🎯 Próximos Pasos Recomendados

1. **Configurar JWT_SECRET en .env de producción**
   - Generar clave segura
   - Configurar en servidor de producción

2. **Implementar Refresh Tokens** (Opcional)
   - Token de acceso: 15 minutos
   - Refresh token: 7 días
   - Endpoint `/api/refresh-token`

3. **Proteger Rutas Existentes**
   - Revisar todas las rutas en `/routes`
   - Agregar `authenticateToken` donde sea necesario
   - Agregar `requireRole` para acciones sensibles

4. **Logging de Seguridad**
   - Registrar intentos de login fallidos
   - Registrar accesos con tokens inválidos
   - Alertas de seguridad

---

**Sistema de autenticación JWT completamente funcional.** 🔐
