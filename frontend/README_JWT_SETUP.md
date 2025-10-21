# 🔒 Configuración JWT Completada - Frontend

## ✅ Archivos Creados

### 1. **API Centralizada** - `src/utils/api.js`
Configuración de Axios con:
- Interceptor que agrega automáticamente el token JWT a todas las peticiones
- Manejo de errores 401 (sesión expirada) con redirección automática al login
- Manejo de errores 403 (sin permisos)
- Timeout de 30 segundos
- Base URL configurable desde variables de entorno

### 2. **Variables de Entorno** - `.env.example`
Plantilla con:
- `REACT_APP_API_URL` - URL del backend

### 3. **Documentación** - `MIGRATION_API.md`
Guía completa con:
- Ejemplos de migración de fetch a axios
- Patrones para GET, POST, PUT, DELETE
- Manejo de errores
- Upload de archivos
- Checklist de migración

## 📝 Componentes Ya Migrados

### ✅ AuthContext.js
- Usa `api` para el login
- Maneja errores correctamente
- Guarda el token en localStorage

### ✅ FinanceViewTab.js
- Endpoint de archivos seguros migrado
- Ya NO envía `userId` (se obtiene del token JWT automáticamente)
- Usa manejo de errores mejorado

## 🚀 Cómo Usar

### En cualquier componente:

```javascript
import api from '../utils/api';

// GET
const response = await api.get('/usuarios');
const users = response.data;

// POST
const response = await api.post('/usuarios', { name: 'Juan', email: 'juan@test.com' });

// PUT
const response = await api.put(`/usuarios/${id}`, { name: 'Juan Carlos' });

// DELETE
await api.delete(`/usuarios/${id}`);

// El token se agrega automáticamente a todas las peticiones!
```

## ⚠️ IMPORTANTE: Archivos Seguros

### ANTES (INSEGURO):
```javascript
fetch('http://localhost:4000/api/files/get-secure-url', {
  body: JSON.stringify({
    path: filePath,
    userId: currentUser.id  // ❌ Se puede falsificar
  })
});
```

### AHORA (SEGURO):
```javascript
import api from '../utils/api';

const response = await api.post('/files/get-secure-url', {
  path: filePath
  // ✅ userId se obtiene del token JWT en el backend
});
```

## 📋 Componentes Pendientes de Migración

Busca en estos archivos cualquier uso de `fetch` y reemplázalo con `api`:

1. **ReservationDetailContent.js** - Tiene `get-secure-url`
2. **ChangeRequestManager.js** - Tiene `get-secure-url`
3. **Users.js** - Gestión de usuarios
4. **UserForm.js** - Formulario de usuarios
5. **Offices.js** - Gestión de oficinas
6. **Settings.js** - Configuración de negocio
7. **Notifications.js** - Notificaciones
8. **AirportInput.js** - Búsqueda de aeropuertos
9. **AirlineInput.js** - Búsqueda de aerolíneas
10. **Y cualquier otro componente que use fetch**

## 🔍 Cómo Encontrar Componentes a Migrar

Busca en tu IDE:
- Buscar: `fetch('http://localhost:4000`
- Buscar: `fetch(\`http://localhost:4000`
- Buscar: `userId: currentUser.id` (especialmente en archivos seguros)

## 🛠️ Pasos para Migrar un Componente

1. Importar api: `import api from '../utils/api';`
2. Reemplazar fetch por api.get/post/put/delete
3. Cambiar `response.json()` por `response.data`
4. Eliminar headers de Authorization manuales
5. Para archivos seguros: Eliminar `userId` del body
6. Agregar manejo de errores con try/catch
7. Probar que funciona

## 📦 Instalación de Axios (Ya realizado)

```bash
npm install axios
```

## 🎯 Ventajas

✅ **Token automático**: No más `localStorage.getItem('token')` en cada petición
✅ **Código más limpio**: Menos boilerplate
✅ **Manejo de errores centralizado**: 401/403 manejados automáticamente
✅ **Seguridad mejorada**: userId ya no puede falsificarse
✅ **Más mantenible**: Cambios en un solo lugar

## 🔧 Variables de Entorno

Crea un archivo `.env` en la raíz del frontend:

```env
REACT_APP_API_URL=http://localhost:4000/api
```

Para producción, actualiza la URL:

```env
REACT_APP_API_URL=https://tu-dominio.com/api
```

## 📚 Recursos

- Ver `MIGRATION_API.md` para ejemplos detallados
- Documentación de Axios: https://axios-http.com
- Si tienes dudas, consulta el código de `AuthContext.js` o `FinanceViewTab.js`

---

**¿Listo para migrar?** Comienza con los componentes de archivos seguros (prioridad crítica de seguridad).
