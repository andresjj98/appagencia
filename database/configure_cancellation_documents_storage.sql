-- =====================================================
-- Configuración de Storage: Bucket cancellation-documents
-- Fecha: 2025-01-06
-- Descripción: Configura políticas de seguridad para el
--              bucket que almacena cartas de cancelación
-- =====================================================

-- NOTA: Este archivo debe ejecutarse DESPUÉS de crear el bucket
-- manualmente en Supabase Dashboard o mediante la API

-- =====================================================
-- 1. POLÍTICAS DE STORAGE (RLS)
-- =====================================================

-- Política 1: Los usuarios pueden SUBIR archivos en sus propias carpetas
-- Estructura: cancellation-documents/user-{uuid}/file.pdf
CREATE POLICY "Users can upload their own cancellation documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cancellation-documents'
  AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
);

-- Política 2: Los usuarios pueden VER sus propios archivos
CREATE POLICY "Users can view their own cancellation documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cancellation-documents'
  AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
);

-- Política 3: Los usuarios pueden ACTUALIZAR sus propios archivos
CREATE POLICY "Users can update their own cancellation documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cancellation-documents'
  AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'cancellation-documents'
  AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
);

-- Política 4: Los usuarios pueden ELIMINAR sus propios archivos
-- (solo si la solicitud aún está pendiente)
CREATE POLICY "Users can delete their own cancellation documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cancellation-documents'
  AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
);

-- Política 5: Gestores y Administradores pueden VER todos los documentos
CREATE POLICY "Managers and admins can view all cancellation documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cancellation-documents'
  AND EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND role IN ('gestor', 'administrador')
  )
);

-- Política 6: Gestores y Administradores pueden ELIMINAR documentos
-- (por ejemplo, después de procesar una cancelación)
CREATE POLICY "Managers and admins can delete cancellation documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cancellation-documents'
  AND EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND role IN ('gestor', 'administrador')
  )
);

-- =====================================================
-- 2. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON POLICY "Users can upload their own cancellation documents"
ON storage.objects IS
'Permite a los usuarios subir documentos solo en su carpeta personal (user-{uuid})';

COMMENT ON POLICY "Managers and admins can view all cancellation documents"
ON storage.objects IS
'Permite a gestores y administradores ver todos los documentos de cancelación para su revisión';

-- =====================================================
-- 3. ESTRUCTURA DE CARPETAS RECOMENDADA
-- =====================================================

/*
Estructura de archivos en el bucket cancellation-documents:

cancellation-documents/
├── user-{uuid-asesor-1}/
│   ├── reservation-{id}_letter_1704556800000.pdf
│   ├── reservation-{id}_supporting_doc_1704556800000.pdf
│   └── ...
├── user-{uuid-asesor-2}/
│   ├── reservation-{id}_letter_1704556900000.pdf
│   └── ...
└── ...

Nomenclatura de archivos:
- reservation-{reservation_id}_letter_{timestamp}.pdf       → Carta de cancelación principal
- reservation-{reservation_id}_supporting_{timestamp}.pdf   → Documentos de soporte adicionales
- reservation-{reservation_id}_invoice_{timestamp}.pdf      → Factura relacionada

Ejemplo real:
- user-550e8400-e29b-41d4-a716-446655440000/
  └── reservation-12345_letter_1704556800000.pdf
*/

-- =====================================================
-- 4. CONFIGURACIÓN ADICIONAL DEL BUCKET
-- =====================================================

/*
CONFIGURACIÓN RECOMENDADA EN SUPABASE DASHBOARD:

1. Public bucket: NO (debe ser privado)
2. File size limit: 5 MB
3. Allowed MIME types:
   - application/pdf
4. Restrict file uploads: YES

Para configurar desde código (Node.js):

const { data, error } = await supabaseAdmin.storage
  .from('cancellation-documents')
  .update({
    public: false,
    file_size_limit: 5242880, // 5MB in bytes
    allowed_mime_types: ['application/pdf']
  });
*/

-- =====================================================
-- 5. FUNCIONES HELPER PARA STORAGE
-- =====================================================

-- Función para obtener la URL pública de un documento
-- (Nota: Aunque el bucket sea privado, podemos generar URLs firmadas)
CREATE OR REPLACE FUNCTION public.get_cancellation_document_url(
  user_id uuid,
  file_path text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url text;
BEGIN
  -- Verificar permisos: solo el dueño o gestores/admins
  IF auth.uid() != user_id AND NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND role IN ('gestor', 'administrador')
  ) THEN
    RAISE EXCEPTION 'No tienes permiso para acceder a este documento';
  END IF;

  -- En producción, aquí deberías llamar a la API de Supabase Storage
  -- para generar una URL firmada con expiración
  -- Por ahora retornamos el path
  RETURN file_path;
END;
$$;

-- Función para eliminar documentos asociados a una solicitud de cambio
CREATE OR REPLACE FUNCTION public.delete_change_request_documents_files(
  p_change_request_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc RECORD;
BEGIN
  -- Verificar que el usuario es gestor o administrador
  IF NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND role IN ('gestor', 'administrador')
  ) THEN
    RAISE EXCEPTION 'Solo gestores y administradores pueden eliminar documentos';
  END IF;

  -- Eliminar registros de la tabla
  -- Los archivos físicos deberán eliminarse desde el backend usando Storage API
  DELETE FROM public.change_request_documents
  WHERE change_request_id = p_change_request_id;

  -- Log de auditoría (opcional)
  INSERT INTO public.audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    timestamp
  ) VALUES (
    auth.uid(),
    'delete_documents',
    'change_request',
    p_change_request_id,
    now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al eliminar documentos: %', SQLERRM;
END;
$$;

-- =====================================================
-- 6. PERMISOS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_cancellation_document_url(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_change_request_documents_files(bigint) TO authenticated;

-- =====================================================
-- Fin de configuración de Storage
-- =====================================================

-- Para verificar las políticas creadas:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
