# 📦 Guía de Storage para Documentos de Cancelación

## 🎯 Resumen

El bucket `cancellation-documents` almacena las cartas firmadas por clientes solicitando la cancelación de sus reservas. Este documento explica cómo usar el Storage desde el frontend y backend.

---

## 📁 Estructura de Carpetas

```
cancellation-documents/
├── user-{uuid-asesor}/
│   ├── reservation-{id}_letter_{timestamp}.pdf
│   ├── reservation-{id}_supporting_{timestamp}.pdf
│   └── ...
└── ...
```

### Nomenclatura de Archivos

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Carta de cancelación | `reservation-{id}_letter_{timestamp}.pdf` | `reservation-12345_letter_1704556800000.pdf` |
| Documento de soporte | `reservation-{id}_supporting_{timestamp}.pdf` | `reservation-12345_supporting_1704556800000.pdf` |

---

## 🔒 Políticas de Seguridad

### Permisos de Usuarios (Asesores)
- ✅ **Subir** archivos en su propia carpeta (`user-{su-uuid}/`)
- ✅ **Ver** sus propios archivos
- ✅ **Actualizar** sus propios archivos
- ✅ **Eliminar** sus propios archivos

### Permisos de Gestores/Administradores
- ✅ **Ver** todos los documentos
- ✅ **Eliminar** cualquier documento

---

## 💻 Uso en el Frontend

### 1. Subir Carta de Cancelación

```javascript
// En CancellationForm.js (ya implementado)
const handleFileUpload = async (file) => {
  const userId = user.id;
  const reservationId = reservation.id;
  const timestamp = Date.now();
  const fileName = `reservation-${reservationId}_letter_${timestamp}.pdf`;
  const filePath = `user-${userId}/${fileName}`;

  // Subir a Supabase Storage
  const { data, error } = await supabaseClient.storage
    .from('cancellation-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  // Obtener URL pública (firmada)
  const { data: { publicUrl } } = supabaseClient.storage
    .from('cancellation-documents')
    .getPublicUrl(filePath);

  return {
    file_name: fileName,
    file_url: publicUrl,
    file_path: filePath,
    file_size: file.size
  };
};
```

### 2. Descargar/Ver Documento

```javascript
// Obtener URL firmada (válida por 1 hora)
const downloadDocument = async (filePath) => {
  const { data, error } = await supabaseClient.storage
    .from('cancellation-documents')
    .createSignedUrl(filePath, 3600); // 1 hora

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }

  // Abrir en nueva ventana
  window.open(data.signedUrl, '_blank');
};
```

### 3. Eliminar Documento (si la solicitud aún está pendiente)

```javascript
const deleteDocument = async (filePath) => {
  const { error } = await supabaseClient.storage
    .from('cancellation-documents')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }

  console.log('File deleted successfully');
};
```

---

## 🔧 Uso en el Backend

### 1. Subir Archivo desde Backend (Node.js)

```javascript
// En el controller de change requests
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service role key
);

// Endpoint: POST /api/change-requests/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user.id;
    const reservationId = req.body.reservation_id;
    const timestamp = Date.now();

    const fileName = `reservation-${reservationId}_letter_${timestamp}.pdf`;
    const filePath = `user-${userId}/${fileName}`;

    // Subir usando Admin API (bypasea RLS)
    const { data, error } = await supabaseAdmin.storage
      .from('cancellation-documents')
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (error) throw error;

    // Obtener URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('cancellation-documents')
      .getPublicUrl(filePath);

    res.json({
      success: true,
      file: {
        name: fileName,
        url: publicUrl,
        path: filePath,
        size: file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Obtener URL Firmada desde Backend

```javascript
// Endpoint: GET /api/change-requests/:id/documents/:documentId/url
router.get('/:id/documents/:documentId/url', async (req, res) => {
  try {
    const { id, documentId } = req.params;
    const userId = req.user.id;

    // Obtener documento de la BD
    const { data: document, error } = await supabaseAdmin
      .from('change_request_documents')
      .select('file_url, change_request_id')
      .eq('id', documentId)
      .single();

    if (error) throw error;

    // Verificar permisos
    const { data: changeRequest } = await supabaseAdmin
      .from('change_requests')
      .select('requested_by_id')
      .eq('id', document.change_request_id)
      .single();

    const isOwner = changeRequest.requested_by_id === userId;
    const isManager = ['gestor', 'administrador'].includes(req.user.role);

    if (!isOwner && !isManager) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Generar URL firmada (válida 1 hora)
    const { data: signedUrl, error: signError } = await supabaseAdmin.storage
      .from('cancellation-documents')
      .createSignedUrl(document.file_url, 3600);

    if (signError) throw signError;

    res.json({ url: signedUrl.signedUrl });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Eliminar Documento (después de procesar cancelación)

```javascript
// Endpoint: DELETE /api/change-requests/:id/documents/:documentId
router.delete('/:id/documents/:documentId', async (req, res) => {
  try {
    const { id, documentId } = req.params;

    // Solo gestores/admins pueden eliminar
    if (!['gestor', 'administrador'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Obtener documento
    const { data: document } = await supabaseAdmin
      .from('change_request_documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    // Eliminar archivo físico del Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('cancellation-documents')
      .remove([document.file_url]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }

    // Eliminar registro de la BD
    const { error: dbError } = await supabaseAdmin
      .from('change_request_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;

    res.json({ success: true, message: 'Documento eliminado' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🔐 Variables de Entorno

Asegúrate de tener configuradas estas variables:

```env
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📊 Limites y Restricciones

| Configuración | Valor |
|---------------|-------|
| Tamaño máximo de archivo | 5 MB |
| Tipos MIME permitidos | `application/pdf` |
| Bucket público | NO (privado) |
| Validación en cliente | Sí (frontend) |
| Validación en servidor | Recomendado |

---

## 🧪 Pruebas

### Probar Subida desde Frontend

```javascript
// En consola del navegador
const testUpload = async () => {
  const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
  const result = await handleFileUpload(file);
  console.log('Upload result:', result);
};
```

### Probar Permisos

```javascript
// Intentar subir a carpeta de otro usuario (debería fallar)
const testUnauthorizedUpload = async () => {
  const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

  try {
    await supabaseClient.storage
      .from('cancellation-documents')
      .upload('user-other-uuid/test.pdf', file);
    console.error('ERROR: Upload should have failed!');
  } catch (error) {
    console.log('✅ Correctly blocked:', error.message);
  }
};
```

---

## 🐛 Troubleshooting

### Error: "new row violates row-level security policy"

**Causa:** Usuario no tiene permisos para subir en esa carpeta.

**Solución:** Verificar que la ruta sea `user-{su-propio-uuid}/archivo.pdf`.

### Error: "The resource already exists"

**Causa:** Archivo con ese nombre ya existe.

**Solución:** Agregar timestamp al nombre: `file_${Date.now()}.pdf`.

### Error: "Payload too large"

**Causa:** Archivo supera los 5 MB.

**Solución:** Validar tamaño antes de subir:

```javascript
if (file.size > 5 * 1024 * 1024) {
  throw new Error('El archivo no debe superar los 5MB');
}
```

---

## 📚 Referencias

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Row Level Security for Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Signed URLs](https://supabase.com/docs/guides/storage/serving/downloads#signed-urls)

---

**Última actualización:** 2025-01-06
