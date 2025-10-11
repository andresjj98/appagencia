
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
