# 🔐 Guía: Configurar Políticas de Storage para Bucket `cancellation-documents`

## ⚠️ Importante

Las políticas de Storage **NO** se pueden crear desde SQL Editor porque requieren permisos de superusuario. Deben crearse manualmente desde el **Dashboard de Supabase**.

---

## 📋 Paso 1: Acceder a las Políticas del Bucket

1. Ve a **Supabase Dashboard** → Tu proyecto
2. En el menú lateral, selecciona **Storage**
3. Haz clic en el bucket `cancellation-documents`
4. Ve a la pestaña **Policies**
5. Haz clic en **New Policy**

---

## 🔒 Política 1: Usuarios pueden SUBIR sus propios documentos

### Configuración:
- **Policy name:** `Users can upload their own cancellation documents`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`

### Policy definition (WITH CHECK):
```sql
bucket_id = 'cancellation-documents'
AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
```

### Explicación:
Permite que los usuarios suban archivos SOLO en su carpeta personal `user-{su-uuid}/`

**Cómo crear:**
1. Click en **New Policy** → **For full customization**
2. Nombre: `Users can upload their own cancellation documents`
3. Policy Command: Selecciona **INSERT**
4. Target roles: Marca **authenticated**
5. En **WITH CHECK expression**, pega:
   ```sql
   bucket_id = 'cancellation-documents'
   AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
   ```
6. Click **Review** → **Save policy**

---

## 👁️ Política 2: Usuarios pueden VER sus propios documentos

### Configuración:
- **Policy name:** `Users can view their own cancellation documents`
- **Allowed operation:** `SELECT`
- **Target roles:** `authenticated`

### Policy definition (USING):
```sql
bucket_id = 'cancellation-documents'
AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
```

### Explicación:
Permite que los usuarios vean SOLO sus propios archivos.

**Cómo crear:**
1. Click en **New Policy** → **For full customization**
2. Nombre: `Users can view their own cancellation documents`
3. Policy Command: Selecciona **SELECT**
4. Target roles: Marca **authenticated**
5. En **USING expression**, pega:
   ```sql
   bucket_id = 'cancellation-documents'
   AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
   ```
6. Click **Review** → **Save policy**

---

## ✏️ Política 3: Usuarios pueden ACTUALIZAR sus propios documentos

### Configuración:
- **Policy name:** `Users can update their own cancellation documents`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated`

### Policy definition:
**USING expression:**
```sql
bucket_id = 'cancellation-documents'
AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
```

**WITH CHECK expression:**
```sql
bucket_id = 'cancellation-documents'
AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
```

**Cómo crear:**
1. Click en **New Policy** → **For full customization**
2. Nombre: `Users can update their own cancellation documents`
3. Policy Command: Selecciona **UPDATE**
4. Target roles: Marca **authenticated**
5. En **USING expression**, pega la primera expresión
6. En **WITH CHECK expression**, pega la segunda expresión
7. Click **Review** → **Save policy**

---

## 🗑️ Política 4: Usuarios pueden ELIMINAR sus propios documentos

### Configuración:
- **Policy name:** `Users can delete their own cancellation documents`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`

### Policy definition (USING):
```sql
bucket_id = 'cancellation-documents'
AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
```

**Cómo crear:**
1. Click en **New Policy** → **For full customization**
2. Nombre: `Users can delete their own cancellation documents`
3. Policy Command: Selecciona **DELETE**
4. Target roles: Marca **authenticated**
5. En **USING expression**, pega:
   ```sql
   bucket_id = 'cancellation-documents'
   AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
   ```
6. Click **Review** → **Save policy**

---

## 👔 Política 5: Gestores/Admins pueden VER todos los documentos

### Configuración:
- **Policy name:** `Managers and admins can view all cancellation documents`
- **Allowed operation:** `SELECT`
- **Target roles:** `authenticated`

### Policy definition (USING):
```sql
bucket_id = 'cancellation-documents'
AND EXISTS (
  SELECT 1 FROM public.usuarios
  WHERE id = auth.uid()
  AND role IN ('gestor', 'administrador')
)
```

### Explicación:
Permite que gestores y administradores vean TODOS los documentos para revisión.

**Cómo crear:**
1. Click en **New Policy** → **For full customization**
2. Nombre: `Managers and admins can view all cancellation documents`
3. Policy Command: Selecciona **SELECT**
4. Target roles: Marca **authenticated**
5. En **USING expression**, pega:
   ```sql
   bucket_id = 'cancellation-documents'
   AND EXISTS (
     SELECT 1 FROM public.usuarios
     WHERE id = auth.uid()
     AND role IN ('gestor', 'administrador')
   )
   ```
6. Click **Review** → **Save policy**

---

## 🗑️ Política 6: Gestores/Admins pueden ELIMINAR cualquier documento

### Configuración:
- **Policy name:** `Managers and admins can delete cancellation documents`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`

### Policy definition (USING):
```sql
bucket_id = 'cancellation-documents'
AND EXISTS (
  SELECT 1 FROM public.usuarios
  WHERE id = auth.uid()
  AND role IN ('gestor', 'administrador')
)
```

### Explicación:
Permite que gestores y administradores eliminen documentos después de procesar cancelaciones.

**Cómo crear:**
1. Click en **New Policy** → **For full customization**
2. Nombre: `Managers and admins can delete cancellation documents`
3. Policy Command: Selecciona **DELETE**
4. Target roles: Marca **authenticated**
5. En **USING expression**, pega:
   ```sql
   bucket_id = 'cancellation-documents'
   AND EXISTS (
     SELECT 1 FROM public.usuarios
     WHERE id = auth.uid()
     AND role IN ('gestor', 'administrador')
   )
   ```
6. Click **Review** → **Save policy**

---

## ✅ Verificación

### Después de crear todas las políticas, deberías ver:

En la pestaña **Policies** del bucket `cancellation-documents`:

```
✅ Users can upload their own cancellation documents (INSERT)
✅ Users can view their own cancellation documents (SELECT)
✅ Users can update their own cancellation documents (UPDATE)
✅ Users can delete their own cancellation documents (DELETE)
✅ Managers and admins can view all cancellation documents (SELECT)
✅ Managers and admins can delete cancellation documents (DELETE)

Total: 6 políticas
```

---

## 🧪 Probar las Políticas

### Prueba 1: Subir archivo como usuario normal

```javascript
// Desde consola del navegador (como asesor)
const testUpload = async () => {
  const userId = 'TU-UUID-AQUI'; // Reemplaza con tu UUID
  const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  const path = `user-${userId}/test.pdf`;

  const { data, error } = await supabaseClient.storage
    .from('cancellation-documents')
    .upload(path, file);

  console.log('Result:', { data, error });
};

testUpload();
```

**Resultado esperado:** ✅ Success

---

### Prueba 2: Intentar subir en carpeta de otro usuario

```javascript
// Desde consola del navegador
const testUnauthorized = async () => {
  const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  const path = `user-OTRO-UUID/test.pdf`; // UUID diferente al tuyo

  const { data, error } = await supabaseClient.storage
    .from('cancellation-documents')
    .upload(path, file);

  console.log('Result:', { data, error });
};

testUnauthorized();
```

**Resultado esperado:** ❌ Error: "new row violates row-level security policy"

---

### Prueba 3: Ver archivos como gestor

```javascript
// Desde consola del navegador (como gestor/admin)
const testManagerView = async () => {
  const { data, error } = await supabaseClient.storage
    .from('cancellation-documents')
    .list('user-CUALQUIER-UUID');

  console.log('Files:', data);
  console.log('Error:', error);
};

testManagerView();
```

**Resultado esperado:** ✅ Lista de archivos (si existen)

---

## 📊 Resumen de Permisos

| Rol | INSERT | SELECT | UPDATE | DELETE |
|-----|--------|--------|--------|--------|
| Usuario (Asesor) | ✅ Su carpeta | ✅ Su carpeta | ✅ Su carpeta | ✅ Su carpeta |
| Gestor | ❌ | ✅ Todo | ❌ | ✅ Todo |
| Administrador | ❌ | ✅ Todo | ❌ | ✅ Todo |

---

## 🐛 Troubleshooting

### Error: "Policy check violation"

**Causa:** La ruta del archivo no coincide con la carpeta del usuario.

**Solución:** Asegúrate de usar el formato correcto:
```javascript
`user-${auth.uid()}/nombre-archivo.pdf`
```

---

### Error: "Bucket not found"

**Causa:** El bucket no existe o tiene otro nombre.

**Solución:** Verifica que el bucket se llame exactamente `cancellation-documents`.

---

### Las políticas no aparecen

**Causa:** No guardaste las políticas correctamente.

**Solución:** Ve a Storage → cancellation-documents → Policies y verifica que las 6 políticas estén listadas.

---

## 📸 Capturas de Referencia

### Ubicación del botón "New Policy":
```
Storage → cancellation-documents → Policies → [New Policy]
```

### Formulario de creación:
```
┌─────────────────────────────────────┐
│ New Policy                          │
├─────────────────────────────────────┤
│ Policy name: [                    ] │
│ Policy command: [SELECT ▼]          │
│ Target roles: □ public              │
│               ☑ authenticated       │
│                                     │
│ USING expression:                   │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ WITH CHECK expression:              │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Review]  [Cancel]                  │
└─────────────────────────────────────┘
```

---

## ✅ Checklist Final

- [ ] Política 1: Upload creada
- [ ] Política 2: View (usuario) creada
- [ ] Política 3: Update creada
- [ ] Política 4: Delete (usuario) creada
- [ ] Política 5: View (gestor/admin) creada
- [ ] Política 6: Delete (gestor/admin) creada
- [ ] Prueba de upload exitosa
- [ ] Prueba de restricción exitosa
- [ ] Documentación revisada

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que las 6 políticas estén activas
2. Revisa la consola del navegador para errores
3. Verifica que el usuario tenga el rol correcto en la tabla `usuarios`

---

**Última actualización:** 2025-01-06
**Versión:** 1.0
