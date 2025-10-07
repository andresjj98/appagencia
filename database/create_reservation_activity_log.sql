-- =====================================================
-- Migración: Sistema de Auditoría y Historial de Actividades
-- Fecha: 2025-01-06
-- Descripción: Crea tabla para registrar todas las actividades
--              realizadas sobre las reservas (cambios, aprobaciones,
--              pagos, documentos, confirmaciones, etc.)
-- =====================================================

-- 1. Crear tabla de registro de actividades
CREATE TABLE IF NOT EXISTS public.reservation_activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  activity_type text NOT NULL, -- 'reservation_created', 'reservation_updated', 'status_changed', 'payment_registered', 'document_uploaded', 'change_request_created', 'change_request_approved', 'change_request_rejected', 'change_request_applied', 'service_confirmed', 'invoice_generated', etc.
  performed_by_id uuid NOT NULL,
  description text NOT NULL, -- Descripción legible de la actividad
  changes jsonb, -- Detalles de los cambios (antes/después)
  metadata jsonb, -- Información adicional (IDs relacionados, etc.)
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT reservation_activity_log_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_activity_log_reservation_id_fkey
    FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE,
  CONSTRAINT reservation_activity_log_performed_by_id_fkey
    FOREIGN KEY (performed_by_id) REFERENCES public.usuarios(id)
);

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_activity_log_reservation_id
  ON public.reservation_activity_log(reservation_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_performed_by_id
  ON public.reservation_activity_log(performed_by_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type
  ON public.reservation_activity_log(activity_type);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
  ON public.reservation_activity_log(created_at DESC);

-- 3. Agregar comentarios
COMMENT ON TABLE public.reservation_activity_log IS
  'Registro de auditoría de todas las actividades realizadas sobre las reservas';

COMMENT ON COLUMN public.reservation_activity_log.activity_type IS
  'Tipo de actividad: reservation_created, reservation_updated, status_changed, payment_registered, document_uploaded, change_request_created, change_request_approved, change_request_rejected, change_request_applied, service_confirmed, invoice_generated, etc.';

COMMENT ON COLUMN public.reservation_activity_log.description IS
  'Descripción legible para humanos de la actividad realizada';

COMMENT ON COLUMN public.reservation_activity_log.changes IS
  'Detalles de los cambios realizados (valores antes/después en formato JSON)';

COMMENT ON COLUMN public.reservation_activity_log.metadata IS
  'Información adicional como IDs relacionados, nombres de archivos, etc.';

-- 4. Crear función para registrar actividades
CREATE OR REPLACE FUNCTION public.log_reservation_activity(
  p_reservation_id bigint,
  p_activity_type text,
  p_performed_by_id uuid,
  p_description text,
  p_changes jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id bigint;
BEGIN
  INSERT INTO public.reservation_activity_log (
    reservation_id,
    activity_type,
    performed_by_id,
    description,
    changes,
    metadata
  ) VALUES (
    p_reservation_id,
    p_activity_type,
    p_performed_by_id,
    p_description,
    p_changes,
    p_metadata
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$;

-- 5. Crear trigger para registrar creación de reservas
CREATE OR REPLACE FUNCTION public.trigger_log_reservation_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.reservation_activity_log (
    reservation_id,
    activity_type,
    performed_by_id,
    description,
    metadata
  ) VALUES (
    NEW.id,
    'reservation_created',
    NEW.advisor_id,
    'Reserva creada',
    jsonb_build_object(
      'invoice_number', NEW.invoice_number,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_reservation_creation ON public.reservations;
CREATE TRIGGER trg_log_reservation_creation
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_log_reservation_creation();

-- 6. Crear trigger para registrar cambios de estado
CREATE OR REPLACE FUNCTION public.trigger_log_reservation_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Intentar obtener el usuario actual (puede ser NULL en algunos casos)
  v_user_id := current_setting('app.current_user_id', true)::uuid;

  -- Si no hay usuario en el contexto, usar el advisor_id
  IF v_user_id IS NULL THEN
    v_user_id := NEW.advisor_id;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.reservation_activity_log (
      reservation_id,
      activity_type,
      performed_by_id,
      description,
      changes
    ) VALUES (
      NEW.id,
      'status_changed',
      v_user_id,
      'Estado de reserva cambió de ' || OLD.status || ' a ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_reservation_status_change ON public.reservations;
CREATE TRIGGER trg_log_reservation_status_change
  AFTER UPDATE ON public.reservations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_log_reservation_status_change();

-- 7. Crear vista para actividades con información completa
CREATE OR REPLACE VIEW public.v_reservation_activities AS
SELECT
  ral.id,
  ral.reservation_id,
  r.invoice_number,
  ral.activity_type,
  ral.performed_by_id,
  u.name AS performed_by_name,
  u.email AS performed_by_email,
  u.role AS performed_by_role,
  ral.description,
  ral.changes,
  ral.metadata,
  ral.created_at
FROM public.reservation_activity_log ral
LEFT JOIN public.reservations r ON r.id = ral.reservation_id
LEFT JOIN public.usuarios u ON u.id = ral.performed_by_id
ORDER BY ral.created_at DESC;

-- 8. Grant permissions
GRANT SELECT, INSERT ON public.reservation_activity_log TO authenticated;
GRANT SELECT ON public.v_reservation_activities TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_reservation_activity TO authenticated;

-- 9. Crear política RLS
ALTER TABLE public.reservation_activity_log ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver actividades de reservas que les pertenecen o de su oficina
DROP POLICY IF EXISTS "Users can view reservation activities"
  ON public.reservation_activity_log;

CREATE POLICY "Users can view reservation activities"
  ON public.reservation_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_activity_log.reservation_id
        AND (
          r.advisor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.usuarios u
            WHERE u.id = auth.uid()
              AND u.role IN ('gestor', 'administrador')
          )
        )
    )
  );

-- Los usuarios pueden insertar actividades
DROP POLICY IF EXISTS "Users can insert activities"
  ON public.reservation_activity_log;

CREATE POLICY "Users can insert activities"
  ON public.reservation_activity_log
  FOR INSERT
  WITH CHECK (performed_by_id = auth.uid());

-- =====================================================
-- Fin de la migración
-- =====================================================

-- Para verificar:
-- SELECT * FROM public.reservation_activity_log ORDER BY created_at DESC LIMIT 10;
-- SELECT * FROM public.v_reservation_activities LIMIT 10;
