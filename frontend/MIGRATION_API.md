# Guía de Migración a API Centralizada con JWT

## 📋 Resumen

Se ha implementado una configuración centralizada de Axios que incluye:
- ✅ Autenticación JWT automática en todas las peticiones
- ✅ Manejo centralizado de errores 401/403
- ✅ Redirección automática al login cuando la sesión expira
- ✅ Configuración base URL desde variables de entorno

## 🚀 Configuración

### 1. Archivo `.env` (ya creado)
```env
REACT_APP_API_URL=http://localhost:4000/api
```

### 2. Configuración de Axios (`src/utils/api.js`)
Ya está configurado con interceptores que:
- Agregan automáticamente el token JWT a todas las peticiones
- Manejan errores de autenticación (401, 403)
- Redirigen al login si la sesión expira

## 📝 Cómo Migrar tus Componentes

### ANTES (usando fetch):
```javascript
// ❌ Código antiguo
const response = await fetch('http://localhost:4000/api/usuarios', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}` // Manual
  }
});
const data = await response.json();
```

### DESPUÉS (usando api centralizada):
```javascript
// ✅ Código nuevo
import api from '../utils/api';

const response = await api.get('/usuarios');
const data = response.data;
// El token se agrega automáticamente!
```

## 🔄 Ejemplos de Migración por Método HTTP

### GET - Obtener datos
```javascript
import api from '../utils/api';

// Obtener todos los usuarios
try {
  const response = await api.get('/usuarios');
  console.log(response.data);
} catch (error) {
  console.error('Error:', error.response?.data?.message);
}

// Obtener un usuario específico
const response = await api.get(`/usuarios/${userId}`);

// Con parámetros query
const response = await api.get('/reservations', {
  params: {
    userId: '123',
    userRole: 'asesor',
    officeId: '456'
  }
});
// Genera: /reservations?userId=123&userRole=asesor&officeId=456
```

### POST - Crear datos
```javascript
// Crear un usuario
const newUser = {
  name: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  role: 'asesor',
  password: 'password123'
};

try {
  const response = await api.post('/usuarios', newUser);
  console.log('Usuario creado:', response.data);
} catch (error) {
  console.error('Error:', error.response?.data?.message);
}
```

### PUT - Actualizar datos
```javascript
// Actualizar un usuario
const updatedData = {
  name: 'Juan Carlos',
  active: true
};

const response = await api.put(`/usuarios/${userId}`, updatedData);
```

### DELETE - Eliminar datos
```javascript
// Eliminar un usuario
try {
  await api.delete(`/usuarios/${userId}`);
  console.log('Usuario eliminado');
} catch (error) {
  if (error.response?.status === 403) {
    console.error('No tienes permisos para eliminar usuarios');
  }
}
```

## 🖼️ Upload de Archivos (FormData)

```javascript
import api from '../utils/api';

// Subir avatar de usuario
const handleUploadAvatar = async (file, userId) => {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await api.put(`/usuarios/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('Avatar subido:', response.data);
  } catch (error) {
    console.error('Error al subir avatar:', error);
  }
};
```

## 🔒 Endpoint de Archivos Seguros (IMPORTANTE)

### ANTES:
```javascript
// ❌ INSEGURO - userId desde el cliente
const response = await fetch('http://localhost:4000/api/files/get-secure-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    path: filePath,
    userId: currentUser.id // ❌ Se puede falsificar
  })
});
```

### DESPUÉS:
```javascript
// ✅ SEGURO - userId del token JWT
import api from '../utils/api';

const response = await api.post('/files/get-secure-url', {
  path: filePath
  // userId se obtiene automáticamente del token JWT
});

const { signedUrl } = response.data;
```

## 🎯 Componentes que Requieren Migración

### Alta Prioridad (Seguridad Crítica):
1. ✅ `AuthContext.js` - Ya migrado
2. ⚠️ **Cualquier componente que use `/files/get-secure-url`** - Quitar `userId`
3. ⚠️ Componentes que gestionan usuarios (`Users.js`, `UserForm.js`)
4. ⚠️ Componentes de oficinas (`Offices.js`, `OfficeForm.js`)
5. ⚠️ Configuración de negocio (`Settings.js`)

### Media Prioridad:
6. Reservaciones (`Reservations.js`, `ReservationForm.js`, etc.)
7. Documentos (`Documentation.js`, `DocumentList.js`)
8. Notificaciones (`Notifications.js`)
9. Catálogos (`AirportInput.js`, `AirlineInput.js`)

## ⚠️ Manejo de Errores

El interceptor de axios ya maneja automáticamente:

### Error 401 (No autenticado):
- Elimina el token
- Redirige al login automáticamente
- Muestra mensaje en consola

### Error 403 (Sin permisos):
- Muestra mensaje en consola
- No redirige (el usuario está autenticado pero sin permisos)

### Manejo personalizado en componentes:
```javascript
try {
  const response = await api.post('/usuarios', userData);
  // Éxito
} catch (error) {
  if (error.response) {
    // El servidor respondió con error
    const status = error.response.status;
    const message = error.response.data.message;

    switch (status) {
      case 400:
        alert(`Datos inválidos: ${message}`);
        break;
      case 403:
        alert('No tienes permisos para realizar esta acción');
        break;
      case 404:
        alert('Recurso no encontrado');
        break;
      case 409:
        alert('El recurso ya existe');
        break;
      default:
        alert(`Error: ${message}`);
    }
  } else if (error.request) {
    // No hubo respuesta del servidor
    alert('No se pudo conectar con el servidor');
  } else {
    // Error al configurar la petición
    alert('Error al procesar la solicitud');
  }
}
```

## 🔧 Ejemplo Completo de Componente Migrado

### ANTES:
```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch('http://localhost:4000/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const deleteUser = async (id) => {
    await fetch(`http://localhost:4000/api/usuarios/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  };

  return (/* ... */);
};
```

### DESPUÉS:
```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/usuarios');
        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const deleteUser = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (/* ... */);
};
```

## ✅ Checklist de Migración

Para cada componente que uses API:

- [ ] Importar `api` desde `../utils/api`
- [ ] Reemplazar `fetch` por métodos de `api` (get, post, put, delete)
- [ ] Eliminar headers de Authorization manuales
- [ ] Cambiar `response.json()` por `response.data`
- [ ] Agregar manejo de errores con try/catch
- [ ] Para archivos seguros: Eliminar `userId` del body
- [ ] Probar que funciona correctamente
- [ ] Verificar que los errores 401/403 se manejan correctamente

## 🎓 Recursos Adicionales

- [Documentación de Axios](https://axios-http.com/docs/intro)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [Manejo de errores en Axios](https://axios-http.com/docs/handling_errors)

---

**¿Preguntas?** Consulta con el equipo de desarrollo.
