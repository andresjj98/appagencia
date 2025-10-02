-- Fix notification trigger to get office_id from advisor instead of reservation

DROP FUNCTION IF EXISTS notify_new_reservation() CASCADE;

CREATE OR REPLACE FUNCTION notify_new_reservation()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  gestor_user RECORD;
  advisor_name TEXT;
  advisor_office_id UUID;
  client_name TEXT;
BEGIN
  -- Get advisor name and office_id
  SELECT name, office_id
  INTO advisor_name, advisor_office_id
  FROM public.usuarios
  WHERE id = NEW.advisor_id;

  -- Get client name
  SELECT name INTO client_name FROM public.clients WHERE id = NEW.client_id;

  -- Notify all admins in the same office (or all if no office)
  FOR admin_user IN
    SELECT id FROM public.usuarios
    WHERE role = 'administrador'
    AND active = TRUE
    AND (office_id = advisor_office_id OR office_id IS NULL OR advisor_office_id IS NULL)
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_notify_new_reservation ON public.reservations;
CREATE TRIGGER trigger_notify_new_reservation
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_new_reservation();
