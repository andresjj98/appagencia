-- =====================================================
-- Migración: Soporte para Cancelación de Reservas
-- Fecha: 2025-01-06
-- Descripción: Agrega campos y tablas necesarias para
--              gestionar solicitudes de cancelación con
--              documentos de respaldo (cartas firmadas)
-- =====================================================

-- 1. Agregar campos a la tabla change_requests
ALTER TABLE public.change_requests
ADD COLUMN IF NOT EXISTS approved_by_id uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS applied_at timestamp with time zone;

-- 2. Agregar constraint para approved_by_id (con manejo de error si ya existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'change_requests_approved_by_id_fkey'
  ) THEN
    ALTER TABLE public.change_requests
    ADD CONSTRAINT change_requests_approved_by_id_fkey
    FOREIGN KEY (approved_by_id) REFERENCES public.usuarios(id);
  END IF;
END $$;

-- 3. Crear tabla para documentos de solicitudes de cambio
CREATE TABLE IF NOT EXISTS public.change_request_documents (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  change_request_id bigint NOT NULL,
  document_type text NOT NULL, -- 'cancellation_letter', 'supporting_document', etc.
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  uploaded_at timestamp with time zone DEFAULT now(),
  uploaded_by_id uuid,

  CONSTRAINT change_request_documents_pkey PRIMARY KEY (id),
  CONSTRAINT change_request_documents_change_request_id_fkey
    FOREIGN KEY (change_request_id) REFERENCES public.change_requests(id) ON DELETE CASCADE,
  CONSTRAINT change_request_documents_uploaded_by_id_fkey
    FOREIGN KEY (uploaded_by_id) REFERENCES public.usuarios(id)
);

-- 4. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_change_requests_status
  ON public.change_requests(status);

CREATE INDEX IF NOT EXISTS idx_change_requests_reservation_id
  ON public.change_requests(reservation_id);

CREATE INDEX IF NOT EXISTS idx_change_requests_requested_by_id
  ON public.change_requests(requested_by_id);

CREATE INDEX IF NOT EXISTS idx_change_request_documents_change_request_id
  ON public.change_request_documents(change_request_id);

-- 5. Agregar comentarios a las tablas y columnas
COMMENT ON TABLE public.change_request_documents IS
  'Almacena documentos adjuntos a solicitudes de cambio, como cartas de cancelación firmadas';

COMMENT ON COLUMN public.change_requests.approved_by_id IS
  'Usuario (gestor/admin) que aprobó o rechazó la solicitud';

COMMENT ON COLUMN public.change_requests.reviewed_at IS
  'Fecha y hora en que se revisó la solicitud';

COMMENT ON COLUMN public.change_requests.rejection_reason IS
  'Motivo del rechazo si la solicitud fue rechazada';

COMMENT ON COLUMN public.change_requests.applied_at IS
  'Fecha y hora en que los cambios fueron aplicados a la reserva';

COMMENT ON COLUMN public.change_request_documents.document_type IS
  'Tipo de documento: cancellation_letter, supporting_document, etc.';

-- 6. Actualizar constraint de status para incluir nuevos estados
DO $$
BEGIN
  -- Eliminar constraint antiguo si existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'change_requests_status_check'
  ) THEN
    ALTER TABLE public.change_requests
    DROP CONSTRAINT change_requests_status_check;
  END IF;

  -- Crear nuevo constraint con estados adicionales
  ALTER TABLE public.change_requests
  ADD CONSTRAINT change_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'applied'));
END $$;

-- 7. Crear función para contar solicitudes pendientes por gestor
CREATE OR REPLACE FUNCTION public.count_pending_change_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.change_requests
    WHERE status = 'pending'
  );
END;
$$;

-- 8. Crear función para obtener solicitudes de cancelación pendientes
CREATE OR REPLACE FUNCTION public.get_pending_cancellation_requests()
RETURNS TABLE (
  id bigint,
  reservation_id bigint,
  requested_by_id uuid,
  requested_by_name text,
  request_reason text,
  created_at timestamp with time zone,
  has_documents boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id,
    cr.reservation_id,
    cr.requested_by_id,
    u.name AS requested_by_name,
    cr.request_reason,
    cr.created_at,
    EXISTS(
      SELECT 1
      FROM public.change_request_documents crd
      WHERE crd.change_request_id = cr.id
    ) AS has_documents
  FROM public.change_requests cr
  LEFT JOIN public.usuarios u ON u.id = cr.requested_by_id
  WHERE cr.section_to_change = 'cancellation'
    AND cr.status = 'pending'
  ORDER BY cr.created_at ASC;
END;
$$;

-- 9. Crear vista para solicitudes de cambio con información completa
CREATE OR REPLACE VIEW public.v_change_requests_detailed AS
SELECT
  cr.id,
  cr.reservation_id,
  r.invoice_number,
  cr.requested_by_id,
  u_requested.name AS requested_by_name,
  u_requested.email AS requested_by_email,
  cr.section_to_change,
  cr.requested_changes,
  cr.request_reason,
  cr.status,
  cr.created_at,
  cr.approved_by_id,
  u_approved.name AS approved_by_name,
  cr.reviewed_at,
  cr.rejection_reason,
  cr.applied_at,
  (
    SELECT COUNT(*)
    FROM public.change_request_documents crd
    WHERE crd.change_request_id = cr.id
  ) AS documents_count,
  (
    SELECT json_agg(json_build_object(
      'id', crd.id,
      'document_type', crd.document_type,
      'file_name', crd.file_name,
      'file_url', crd.file_url,
      'file_size', crd.file_size,
      'uploaded_at', crd.uploaded_at
    ))
    FROM public.change_request_documents crd
    WHERE crd.change_request_id = cr.id
  ) AS documents
FROM public.change_requests cr
LEFT JOIN public.reservations r ON r.id = cr.reservation_id
LEFT JOIN public.usuarios u_requested ON u_requested.id = cr.requested_by_id
LEFT JOIN public.usuarios u_approved ON u_approved.id = cr.approved_by_id;

-- 10. Grant permissions (ajustar según roles de tu aplicación)
GRANT SELECT, INSERT, UPDATE ON public.change_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.change_request_documents TO authenticated;
GRANT SELECT ON public.v_change_requests_detailed TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_pending_change_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_cancellation_requests() TO authenticated;

-- 11. Crear política RLS (Row Level Security) para change_request_documents
ALTER TABLE public.change_request_documents ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver documentos de sus propias solicitudes
DROP POLICY IF EXISTS "Users can view their own change request documents"
  ON public.change_request_documents;

CREATE POLICY "Users can view their own change request documents"
  ON public.change_request_documents
  FOR SELECT
  USING (
    uploaded_by_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.change_requests cr
      WHERE cr.id = change_request_documents.change_request_id
        AND cr.requested_by_id = auth.uid()
    )
  );

-- Los usuarios pueden insertar documentos en sus propias solicitudes
DROP POLICY IF EXISTS "Users can insert documents for their requests"
  ON public.change_request_documents;

CREATE POLICY "Users can insert documents for their requests"
  ON public.change_request_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.change_requests cr
      WHERE cr.id = change_request_documents.change_request_id
        AND cr.requested_by_id = auth.uid()
    )
  );

-- Gestores y admins pueden ver todos los documentos
DROP POLICY IF EXISTS "Managers and admins can view all documents"
  ON public.change_request_documents;

CREATE POLICY "Managers and admins can view all documents"
  ON public.change_request_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.role IN ('gestor', 'administrador')
    )
  );

-- =====================================================
-- Fin de la migración
-- =====================================================

-- Para verificar los cambios:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'change_requests'
-- ORDER BY ordinal_position;

-- SELECT * FROM information_schema.tables
-- WHERE table_name = 'change_request_documents';
