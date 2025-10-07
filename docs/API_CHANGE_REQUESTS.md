# 📡 API Documentation: Change Requests

## Base URL
```
http://localhost:4000/api
```

---

## 🔐 Authentication

Todos los endpoints requieren autenticación mediante JWT token en el header:

```http
Authorization: Bearer <token>
```

---

## 📋 Endpoints

### 1. Crear Solicitud de Cambio

Crea una nueva solicitud de cambio o cancelación para una reserva confirmada.

**Endpoint:**
```http
POST /api/reservations/:reservationId/change-requests
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| reservationId | integer | ID de la reserva |

**Request Body:**
```json
{
  "section": "client",
  "changes": {
    "name": "JUAN PEREZ ACTUALIZADO",
    "email": "nuevo@email.com"
  },
  "reason": "Cliente solicitó actualización de datos"
}
```

**Secciones Disponibles:**
- `client` - Información del titular
- `passengers` - Cantidad de pasajeros
- `itinerary` - Detalles del itinerario
- `flights` - Detalles de vuelos
- `hotels` - Detalles de hoteles
- `tours` - Tours y actividades
- `medicalAssistances` - Asistencias médicas
- `payment` - Detalles de pago
- `transfers` - Traslados IN/OUT
- `cancellation` - Cancelación de reserva

**Ejemplo: Solicitud de Cancelación:**
```json
{
  "section": "cancellation",
  "changes": {
    "cancellation_reason": "Cliente canceló por motivos personales de salud que le impiden viajar en las fechas programadas",
    "cancellation_letter": {
      "file_name": "reservation-12345_letter_1704556800000.pdf",
      "file_url": "user-550e8400-e29b-41d4-a716-446655440000/reservation-12345_letter_1704556800000.pdf",
      "file_size": 245678,
      "uploaded_at": "2025-01-06T15:30:00.000Z"
    }
  },
  "reason": "Solicitud de cancelación con carta firmada adjunta"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Solicitud de cambio creada exitosamente",
  "changeRequest": {
    "id": 1,
    "reservation_id": 12345,
    "requested_by_id": "550e8400-e29b-41d4-a716-446655440000",
    "section_to_change": "cancellation",
    "requested_changes": {...},
    "request_reason": "Solicitud de cancelación...",
    "status": "pending",
    "created_at": "2025-01-06T15:30:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "error": "El motivo de cancelación debe tener al menos 20 caracteres"
}
```

**Response Error (403):**
```json
{
  "error": "No autorizado para modificar esta reserva"
}
```

---

### 2. Obtener Solicitudes Pendientes

Obtiene todas las solicitudes pendientes de revisión. Solo gestores y administradores.

**Endpoint:**
```http
GET /api/change-requests/pending
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "reservation_id": 12345,
      "invoice_number": "FAC-2025-001",
      "requested_by_id": "550e8400-e29b-41d4-a716-446655440000",
      "requested_by_name": "Juan Pérez",
      "requested_by_email": "juan@example.com",
      "section_to_change": "cancellation",
      "requested_changes": {...},
      "request_reason": "Solicitud de cancelación...",
      "status": "pending",
      "created_at": "2025-01-06T15:30:00.000Z",
      "documents_count": 1,
      "documents": [
        {
          "id": 1,
          "document_type": "cancellation_letter",
          "file_name": "reservation-12345_letter_1704556800000.pdf",
          "file_url": "user-550e.../file.pdf",
          "file_size": 245678,
          "uploaded_at": "2025-01-06T15:30:00.000Z"
        }
      ]
    }
  ]
}
```

**Response Error (403):**
```json
{
  "error": "No autorizado"
}
```

---

### 3. Obtener Mis Solicitudes

Obtiene todas las solicitudes creadas por el usuario actual (asesor).

**Endpoint:**
```http
GET /api/change-requests/my-requests
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "reservation_id": 12345,
      "invoice_number": "FAC-2025-001",
      "section_to_change": "cancellation",
      "status": "pending",
      "created_at": "2025-01-06T15:30:00.000Z",
      "approved_by_name": null,
      "reviewed_at": null
    },
    {
      "id": 2,
      "reservation_id": 12346,
      "invoice_number": "FAC-2025-002",
      "section_to_change": "payment",
      "status": "approved",
      "created_at": "2025-01-05T10:00:00.000Z",
      "approved_by_name": "María Gestora",
      "reviewed_at": "2025-01-05T11:30:00.000Z",
      "applied_at": "2025-01-05T11:35:00.000Z"
    }
  ]
}
```

---

### 4. Obtener Detalle de Solicitud

Obtiene el detalle completo de una solicitud específica.

**Endpoint:**
```http
GET /api/change-requests/:id
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | integer | ID de la solicitud |

**Response Success (200):**
```json
{
  "success": true,
  "request": {
    "id": 1,
    "reservation_id": 12345,
    "invoice_number": "FAC-2025-001",
    "requested_by_id": "550e8400-e29b-41d4-a716-446655440000",
    "requested_by_name": "Juan Pérez",
    "requested_by_email": "juan@example.com",
    "section_to_change": "cancellation",
    "requested_changes": {...},
    "request_reason": "Solicitud de cancelación...",
    "status": "pending",
    "created_at": "2025-01-06T15:30:00.000Z",
    "approved_by_id": null,
    "approved_by_name": null,
    "reviewed_at": null,
    "rejection_reason": null,
    "applied_at": null,
    "documents_count": 1,
    "documents": [...]
  }
}
```

**Response Error (403):**
```json
{
  "error": "No autorizado"
}
```

**Response Error (404):**
```json
{
  "error": "Solicitud no encontrada"
}
```

---

### 5. Aprobar Solicitud

Aprueba una solicitud de cambio y aplica los cambios a la reserva. Solo gestores y administradores.

**Endpoint:**
```http
POST /api/change-requests/:id/approve
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | integer | ID de la solicitud |

**Request Body:**
```json
{}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Solicitud aprobada y cambios aplicados exitosamente"
}
```

**Response Error (400):**
```json
{
  "error": "Esta solicitud ya fue procesada"
}
```

**Response Error (403):**
```json
{
  "error": "No autorizado"
}
```

**Response Error (404):**
```json
{
  "error": "Solicitud no encontrada"
}
```

**Efectos de Aprobar:**
- Solicitud cambia a estado `approved`
- Se aplican los cambios a la reserva
- Solicitud cambia a estado `applied`
- Se envía notificación al asesor

---

### 6. Rechazar Solicitud

Rechaza una solicitud de cambio con un motivo. Solo gestores y administradores.

**Endpoint:**
```http
POST /api/change-requests/:id/reject
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | integer | ID de la solicitud |

**Request Body:**
```json
{
  "rejectionReason": "Los documentos presentados no cumplen con los requisitos necesarios para procesar la cancelación"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Solicitud rechazada exitosamente"
}
```

**Response Error (400):**
```json
{
  "error": "Debe proporcionar un motivo de rechazo (mínimo 10 caracteres)"
}
```

**Response Error (403):**
```json
{
  "error": "No autorizado"
}
```

**Response Error (404):**
```json
{
  "error": "Solicitud no encontrada"
}
```

**Efectos de Rechazar:**
- Solicitud cambia a estado `rejected`
- Se guarda el motivo del rechazo
- Se envía notificación al asesor con el motivo

---

## 📊 Estados de Solicitudes

| Estado | Descripción |
|--------|-------------|
| `pending` | Pendiente de revisión por gestor/admin |
| `approved` | Aprobada pero aún no aplicada |
| `applied` | Aprobada y cambios aplicados exitosamente |
| `rejected` | Rechazada con motivo |

---

## 🔔 Notificaciones Automáticas

### Al Crear Solicitud:
- **Destinatarios:** Gestores y Administradores
- **Tipo:** `change_request` o `cancellation_request`
- **Mensaje:** "Nueva solicitud de cambio/cancelación en reserva #..."

### Al Aprobar Solicitud:
- **Destinatarios:** Asesor que creó la solicitud
- **Tipo:** `change_approved` o `cancellation_approved`
- **Mensaje:** "Tu solicitud ha sido aprobada"

### Al Rechazar Solicitud:
- **Destinatarios:** Asesor que creó la solicitud
- **Tipo:** `change_rejected` o `cancellation_rejected`
- **Mensaje:** "Tu solicitud fue rechazada: [motivo]"

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: Solicitud de Cambio de Cliente

```javascript
const createClientChangeRequest = async (reservationId) => {
  const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}/change-requests`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      section: 'client',
      changes: {
        name: 'PEDRO GONZÁLEZ',
        email: 'pedro@example.com',
        phone: '+34612345678'
      },
      reason: 'Cliente solicitó corrección de datos personales'
    })
  });

  const data = await response.json();
  console.log(data);
};
```

### Ejemplo 2: Solicitud de Cancelación

```javascript
const createCancellationRequest = async (reservationId, letterData) => {
  const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}/change-requests`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      section: 'cancellation',
      changes: {
        cancellation_reason: 'Cliente no puede viajar por motivos de salud imprevistos que requieren tratamiento médico urgente',
        cancellation_letter: letterData
      },
      reason: 'Solicitud de cancelación formal con carta adjunta'
    })
  });

  const data = await response.json();
  console.log(data);
};
```

### Ejemplo 3: Aprobar Solicitud (Gestor)

```javascript
const approveRequest = async (requestId) => {
  const response = await fetch(`http://localhost:4000/api/change-requests/${requestId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${gestorToken}`
    }
  });

  const data = await response.json();
  console.log(data);
};
```

### Ejemplo 4: Rechazar Solicitud (Gestor)

```javascript
const rejectRequest = async (requestId, reason) => {
  const response = await fetch(`http://localhost:4000/api/change-requests/${requestId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${gestorToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rejectionReason: reason
    })
  });

  const data = await response.json();
  console.log(data);
};
```

---

## ⚠️ Validaciones Importantes

### Para Cancelaciones:
- ✅ Motivo debe tener mínimo **20 caracteres**
- ✅ Carta firmada es **obligatoria**
- ✅ Usuario debe ser el **asesor de la reserva**
- ✅ Reserva debe estar **confirmada**

### Para Otras Solicitudes:
- ✅ Usuario debe ser el **asesor de la reserva**
- ✅ Motivo es **opcional** pero recomendado
- ✅ Cambios deben tener formato válido según la sección

---

## 🐛 Códigos de Error

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | Bad Request | Datos inválidos o incompletos |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Usuario no tiene permisos |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error del servidor |

---

**Última actualización:** 2025-01-06
**Versión:** 1.0
