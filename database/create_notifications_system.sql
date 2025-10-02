-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'reservation_created', 'reservation_approved', 'reservation_rejected', 'payment_received', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id BIGINT, -- ID of the related entity (e.g., reservation_id)
  reference_type TEXT, -- 'reservation', 'payment', etc.
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  metadata JSONB -- Additional data like reservation details, amounts, etc.
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON public.notifications(reference_type, reference_id);

-- Add comments for documentation
COMMENT ON TABLE public.notifications IS 'Sistema de notificaciones para usuarios';
COMMENT ON COLUMN public.notifications.recipient_id IS 'Usuario que recibe la notificación';
COMMENT ON COLUMN public.notifications.sender_id IS 'Usuario que genera la notificación (opcional)';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificación para filtrado y categorización';
COMMENT ON COLUMN public.notifications.reference_id IS 'ID de la entidad relacionada (ej: reservation_id)';
COMMENT ON COLUMN public.notifications.reference_type IS 'Tipo de entidad relacionada';
COMMENT ON COLUMN public.notifications.metadata IS 'Datos adicionales en formato JSON';

-- Function to create notification for new reservation
CREATE OR REPLACE FUNCTION notify_new_reservation()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  gestor_user RECORD;
  advisor_name TEXT;
  client_name TEXT;
BEGIN
  -- Get advisor name
  SELECT name INTO advisor_name FROM public.usuarios WHERE id = NEW.advisor_id;

  -- Get client name
  SELECT name INTO client_name FROM public.clients WHERE id = NEW.client_id;

  -- Notify all admins in the same office (or all if no office)
  FOR admin_user IN
    SELECT id FROM public.usuarios
    WHERE role = 'administrador'
    AND active = TRUE
    AND (office_id = NEW.office_id OR office_id IS NULL OR NEW.office_id IS NULL)
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      metadata
    ) VALUES (
      admin_user.id,
      NEW.advisor_id,
      'reservation_created',
      'Nueva Reserva Pendiente',
      'El asesor ' || advisor_name || ' ha creado una nueva reserva para ' || client_name || '. Requiere aprobación.',
      NEW.id,
      'reservation',
      jsonb_build_object(
        'reservation_id', NEW.id,
        'client_name', client_name,
        'advisor_name', advisor_name,
        'total_amount', NEW.total_amount,
        'status', NEW.status
      )
    );
  END LOOP;

  -- Notify all gestores
  FOR gestor_user IN
    SELECT id FROM public.usuarios
    WHERE role = 'gestor'
    AND active = TRUE
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      metadata
    ) VALUES (
      gestor_user.id,
      NEW.advisor_id,
      'reservation_created',
      'Nueva Reserva Pendiente',
      'El asesor ' || advisor_name || ' ha creado una nueva reserva para ' || client_name || '.',
      NEW.id,
      'reservation',
      jsonb_build_object(
        'reservation_id', NEW.id,
        'client_name', client_name,
        'advisor_name', advisor_name,
        'total_amount', NEW.total_amount,
        'status', NEW.status
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify on reservation approval
CREATE OR REPLACE FUNCTION notify_reservation_approved()
RETURNS TRIGGER AS $$
DECLARE
  admin_name TEXT;
  client_name TEXT;
  invoice_num TEXT;
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
    -- Get admin name (assuming there's a field tracking who approved)
    SELECT name INTO admin_name FROM public.usuarios WHERE id = NEW.manager_id;

    -- Get client name
    SELECT name INTO client_name FROM public.clients WHERE id = NEW.client_id;

    -- Get invoice number
    invoice_num := COALESCE(NEW.invoice_number, 'Pendiente');

    -- Notify the advisor
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      metadata
    ) VALUES (
      NEW.advisor_id,
      NEW.manager_id,
      'reservation_approved',
      '✅ Reserva Aprobada',
      'Tu reserva para ' || client_name || ' ha sido aprobada. Número de factura: ' || invoice_num,
      NEW.id,
      'reservation',
      jsonb_build_object(
        'reservation_id', NEW.id,
        'client_name', client_name,
        'invoice_number', invoice_num,
        'total_amount', NEW.total_amount,
        'approved_by', admin_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify on reservation rejection
CREATE OR REPLACE FUNCTION notify_reservation_rejected()
RETURNS TRIGGER AS $$
DECLARE
  admin_name TEXT;
  client_name TEXT;
BEGIN
  -- Only trigger when status changes to 'rejected'
  IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    -- Get admin name
    SELECT name INTO admin_name FROM public.usuarios WHERE id = NEW.rejected_by;

    -- Get client name
    SELECT name INTO client_name FROM public.clients WHERE id = NEW.client_id;

    -- Notify the advisor
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      metadata
    ) VALUES (
      NEW.advisor_id,
      NEW.rejected_by,
      'reservation_rejected',
      '❌ Reserva Rechazada',
      'Tu reserva para ' || client_name || ' ha sido rechazada por ' || COALESCE(admin_name, 'un administrador') || '. Motivo: ' || NEW.rejection_reason,
      NEW.id,
      'reservation',
      jsonb_build_object(
        'reservation_id', NEW.id,
        'client_name', client_name,
        'rejection_reason', NEW.rejection_reason,
        'rejected_by', admin_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_new_reservation ON public.reservations;
CREATE TRIGGER trigger_notify_new_reservation
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_new_reservation();

DROP TRIGGER IF EXISTS trigger_notify_reservation_approved ON public.reservations;
CREATE TRIGGER trigger_notify_reservation_approved
  AFTER UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_reservation_approved();

DROP TRIGGER IF EXISTS trigger_notify_reservation_rejected ON public.reservations;
CREATE TRIGGER trigger_notify_reservation_rejected
  AFTER UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_reservation_rejected();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications
  SET read = TRUE, read_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications
  SET read = TRUE, read_at = NOW()
  WHERE recipient_id = user_id AND read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to delete old read notifications (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE read = TRUE
  AND read_at < NOW() - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
