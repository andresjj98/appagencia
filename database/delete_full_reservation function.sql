
DECLARE
    client_id_to_check UUID;
BEGIN
    -- Obtener el client_id antes de empezar a borrar
    SELECT client_id INTO client_id_to_check FROM public.reservations WHERE id = reservation_id_input;

    -- Borrar en orden inverso para evitar violaciones de foreign key
    -- 1. Borrar datos de tablas nietas (dependen de hoteles o vuelos)
    DELETE FROM public.reservation_hotel_inclusions WHERE hotel_id IN (SELECT id FROM public.reservation_hotels WHERE reservation_id = reservation_id_input);
    DELETE FROM public.reservation_hotel_accommodations WHERE hotel_id IN (SELECT id FROM public.reservation_hotels WHERE reservation_id = reservation_id_input);
    DELETE FROM public.reservation_flight_itineraries WHERE flight_id IN (SELECT id FROM public.reservation_flights WHERE reservation_id = reservation_id_input);

    -- 2. Borrar datos de tablas hijas (dependen directamente de la reserva)
    DELETE FROM public.reservation_segments WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_flights WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_hotels WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_tours WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_medical_assistances WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_installments WHERE reservation_id = reservation_id_input;

    -- 3. Borrar la reserva principal
    DELETE FROM public.reservations WHERE id = reservation_id_input;

    -- 4. Opcional: Borrar el cliente si no tiene más reservas (descomentar si se desea)
    -- IF client_id_to_check IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.reservations WHERE client_id = client_id_to_check) THEN
    --     DELETE FROM public.clients WHERE id = client_id_to_check;
    -- END IF;

END;
