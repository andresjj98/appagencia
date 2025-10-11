
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
