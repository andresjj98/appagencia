-- INICIO FUNCIONES
--cleanup_old_notifications
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE read = TRUE
  AND read_at < NOW() - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;

DECLARE
    new_client_id UUID;
    new_reservation_id BIGINT;
    new_segment_id BIGINT;
    advisor_office_id UUID;
    segment JSONB;
    segment_index INT := 0;
    flight JSONB;
    itinerary JSONB;
    hotel JSONB;
    accommodation JSONB;
    inclusion TEXT;
    tour JSONB;
    assistance JSONB;
    installment JSONB;
    transfer JSONB;
    segment_ids BIGINT[] := '{}';  -- Array para guardar IDs de segmentos
BEGIN
    -- Paso 1: Insertar o actualizar cliente (Upsert)
    INSERT INTO public.clients (
        name, email, phone, id_card, address,
        emergency_contact_name, emergency_contact_phone, id_card_issued_place
    )
    VALUES (
        payload->>'clientName', payload->>'clientEmail', payload->>'clientPhone',
        payload->>'clientId', payload->>'clientAddress',
        payload->'emergencyContact'->>'name', payload->'emergencyContact'->>'phone',
        payload->>'clientIdIssuedPlace'
    )
    ON CONFLICT (email) DO UPDATE
    SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        id_card = EXCLUDED.id_card,
        address = EXCLUDED.address,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_phone = EXCLUDED.emergency_contact_phone,
        id_card_issued_place = EXCLUDED.id_card_issued_place
    RETURNING id INTO new_client_id;

    -- Obtener office_id del asesor
    SELECT office_id
    INTO advisor_office_id
    FROM public.usuarios
    WHERE id = (payload->>'advisorId')::UUID;

    -- Paso 2: Crear la reserva principal
    INSERT INTO public.reservations (
        client_id,
        advisor_id,
        office_id,
        trip_type,
        reservation_type,
        passengers_adt, passengers_chd, passengers_inf,
        price_per_adt, price_per_chd, price_per_inf,
        total_amount, payment_option, status, notes
    )
    VALUES (
        new_client_id,
        (payload->>'advisorId')::UUID,
        advisor_office_id,
        payload->>'tripType',
        payload->>'reservation_type',
        (payload->>'passengersADT')::INT,
        (payload->>'passengersCHD')::INT,
        (payload->>'passengersINF')::INT,
        (payload->>'pricePerADT')::NUMERIC,
        (payload->>'pricePerCHD')::NUMERIC,
        (payload->>'pricePerINF')::NUMERIC,
        (payload->>'totalAmount')::NUMERIC,
        payload->>'paymentOption',
        payload->>'status',
        payload->>'notes'
    )
    RETURNING id INTO new_reservation_id;

    -- Paso 3: Insertar segmentos y guardar sus IDs
    FOR segment IN SELECT * FROM jsonb_array_elements(payload->'segments')
    LOOP
        INSERT INTO public.reservation_segments (reservation_id, origin, destination, departure_date, return_date)
        VALUES (new_reservation_id, segment->>'origin', segment->>'destination', (segment->>'departureDate')::DATE, (segment->>'returnDate')::DATE)
        RETURNING id INTO new_segment_id;

        -- Guardar ID del segmento en el array
        segment_ids := array_append(segment_ids, new_segment_id);
        segment_index := segment_index + 1;
    END LOOP;

    -- Paso 3.5: Insertar TRASLADOS (NUEVO)
    -- Los traslados vienen en el payload con un campo 'segmentIndex'
    IF payload ? 'transfers' THEN
        FOR transfer IN SELECT * FROM jsonb_array_elements(payload->'transfers')
        LOOP
            -- El segmentIndex del frontend es 0-based, lo usamos para obtener el segment_id correcto
            DECLARE
                target_segment_index INT;
                target_segment_id BIGINT;
            BEGIN
                target_segment_index := (transfer->>'segmentIndex')::INT;

                -- Obtener el segment_id del array usando el índice (array_position es 1-based)
                IF target_segment_index >= 0 AND target_segment_index < array_length(segment_ids, 1) THEN
                    target_segment_id := segment_ids[target_segment_index + 1];

                    INSERT INTO public.reservation_transfers (
                        reservation_id,
                        segment_id,
                        transfer_type,
                        pickup_location,
                        dropoff_location,
                        transfer_date,
                        transfer_time,
                        cost,
                        include_cost,
                        vehicle_type,
                        notes
                    ) VALUES (
                        new_reservation_id,
                        target_segment_id,
                        transfer->>'transferType',
                        transfer->>'pickupLocation',
                        transfer->>'dropoffLocation',
                        (transfer->>'transferDate')::DATE,
                        (transfer->>'transferTime')::TIME,
                        COALESCE((transfer->>'cost')::NUMERIC, 0),
                        COALESCE((transfer->>'includeCost')::BOOLEAN, FALSE),
                        transfer->>'vehicleType',
                        transfer->>'notes'
                    );
                END IF;
            END;
        END LOOP;
    END IF;

    -- Paso 4: Vuelos e Itinerarios
    FOR flight IN SELECT * FROM jsonb_array_elements(payload->'flights')
    LOOP
        DECLARE
            new_flight_id BIGINT;
        BEGIN
            INSERT INTO public.reservation_flights (reservation_id, airline, flight_category, baggage_allowance, flight_cycle, pnr)
            VALUES (
                new_reservation_id,
                flight->>'airline',
                flight->>'flightCategory',
                flight->>'baggageAllowance',
                flight->>'flightCycle',
                flight->>'trackingCode'
            )
            RETURNING id INTO new_flight_id;

            FOR itinerary IN SELECT * FROM jsonb_array_elements(flight->'itineraries')
            LOOP
                INSERT INTO public.reservation_flight_itineraries (flight_id, flight_number, departure_time, arrival_time)
                VALUES (new_flight_id, itinerary->>'flightNumber', (itinerary->>'departure_time')::TIMESTAMPTZ, (itinerary->>'arrival_time')::TIMESTAMPTZ);
            END LOOP;
        END;
    END LOOP;

    -- Paso 5: Hoteles, Acomodaciones e Inclusiones
    FOR hotel IN SELECT * FROM jsonb_array_elements(payload->'hotels')
    LOOP
        DECLARE
            new_hotel_id BIGINT;
        BEGIN
            INSERT INTO public.reservation_hotels (reservation_id, name, room_category, meal_plan)
            VALUES (new_reservation_id, hotel->>'name', hotel->>'roomCategory', hotel->>'mealPlan')
            RETURNING id INTO new_hotel_id;

            FOR accommodation IN SELECT * FROM jsonb_array_elements(hotel->'accommodation')
            LOOP
                INSERT INTO public.reservation_hotel_accommodations (hotel_id, rooms, adt, chd, inf)
                VALUES (new_hotel_id, (accommodation->>'rooms')::INT, (accommodation->>'adt')::INT, (accommodation->>'chd')::INT, (accommodation->>'inf')::INT);
            END LOOP;

            FOR inclusion IN SELECT * FROM jsonb_array_elements_text(hotel->'hotelInclusions')
            LOOP
                INSERT INTO public.reservation_hotel_inclusions (hotel_id, inclusion)
                VALUES (new_hotel_id, inclusion);
            END LOOP;
        END;
    END LOOP;

    -- Paso 6: Tours
    FOR tour IN SELECT * FROM jsonb_array_elements(payload->'tours')
    LOOP
        INSERT INTO public.reservation_tours (reservation_id, name, date, cost)
        VALUES (new_reservation_id, tour->>'name', (tour->>'date')::DATE, (tour->>'cost')::NUMERIC);
    END LOOP;

    -- Paso 7: Asistencias Médicas
    FOR assistance IN SELECT * FROM jsonb_array_elements(payload->'medicalAssistances')
    LOOP
        INSERT INTO public.reservation_medical_assistances (reservation_id, plan_type, start_date, end_date)
        VALUES (new_reservation_id, assistance->>'planType', (assistance->>'startDate')::DATE, (assistance->>'endDate')::DATE);
    END LOOP;

    -- Paso 8: Cuotas de Pago
    FOR installment IN SELECT * FROM jsonb_array_elements(payload->'installments')
    LOOP
        INSERT INTO public.reservation_installments (reservation_id, amount, due_date, status)
        VALUES (new_reservation_id, (installment->>'amount')::NUMERIC, (installment->>'dueDate')::DATE, 'pending');
    END LOOP;
END;

--'delete_full_reservation' function
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

END;

DECLARE
    -- Variables para IDs
    client_id_from_db UUID;

    -- Variables para iterar sobre los datos del payload
    segment JSONB;
    flight JSONB;
    itinerary JSONB;
    hotel JSONB;
    accommodation JSONB;
    inclusion TEXT;
    tour JSONB;
    assistance JSONB;
    installment JSONB;
    passenger JSONB;

    -- Arrays para guardar los IDs que vienen del frontend
    segment_ids BIGINT[];
    flight_ids BIGINT[];
    itinerary_ids BIGINT[];
    hotel_ids BIGINT[];
    accommodation_ids BIGINT[];
    tour_ids BIGINT[];
    assistance_ids BIGINT[];
    installment_ids BIGINT[];
    passenger_ids BIGINT[];

    -- Variables para IDs insertados/actualizados
    upserted_flight_id BIGINT;
    upserted_hotel_id BIGINT;

BEGIN
    -- Paso 1: Obtener el ID del cliente actual de la reserva
    SELECT client_id INTO client_id_from_db FROM public.reservations WHERE id = reservation_id_input;

    -- Paso 2: Actualizar la información del cliente (si se proporciona)
    IF payload ? 'clientName' THEN
        UPDATE public.clients
        SET
            name = payload->>'clientName',
            email = payload->>'clientEmail',
            phone = payload->>'clientPhone',
            id_card = payload->>'clientId',
            address = payload->>'clientAddress',
            emergency_contact_name = payload->'emergencyContact'->>'name',
            emergency_contact_phone = payload->'emergencyContact'->>'phone',
            id_card_issued_place = payload->>'clientIdIssuedPlace'
        WHERE id = client_id_from_db;
    END IF;

    -- Paso 3: Actualizar la reserva principal (si se proporcionan datos)
    UPDATE public.reservations
    SET
        trip_type = COALESCE(payload->>'tripType', trip_type),
        reservation_type = COALESCE(payload->>'reservation_type', reservation_type),
        passengers_adt = COALESCE((payload->>'passengersADT')::INT, passengers_adt),
        passengers_chd = COALESCE((payload->>'passengersCHD')::INT, passengers_chd),
        passengers_inf = COALESCE((payload->>'passengersINF')::INT, passengers_inf),
        price_per_adt = COALESCE((payload->>'pricePerADT')::NUMERIC, price_per_adt),
        price_per_chd = COALESCE((payload->>'pricePerCHD')::NUMERIC, price_per_chd),
        price_per_inf = COALESCE((payload->>'pricePerINF')::NUMERIC, price_per_inf),
        total_amount = COALESCE((payload->>'totalAmount')::NUMERIC, total_amount),
        payment_option = COALESCE(payload->>'paymentOption', payment_option),
        status = COALESCE(payload->>'status', status),
        notes = COALESCE(payload->>'notes', notes),
        updated_at = now()
    WHERE id = reservation_id_input;

    -- Paso 4: Sincronizar (Insert/Update y Delete) tablas relacionadas

    -- --- Segmentos ---
    IF payload ? 'segments' THEN
        SELECT array_agg((s->>'id')::BIGINT) INTO segment_ids FROM jsonb_array_elements(payload->'segments') s WHERE s->>'id' IS NOT NULL;
        DELETE FROM public.reservation_segments WHERE reservation_id = reservation_id_input AND id NOT IN (SELECT unnest(COALESCE(segment_ids, '{}'::BIGINT[])));
        FOR segment IN SELECT * FROM jsonb_array_elements(payload->'segments')
        LOOP
            IF segment->>'id' IS NULL THEN
                INSERT INTO public.reservation_segments (reservation_id, origin, destination, departure_date, return_date)
                VALUES (reservation_id_input, segment->>'origin', segment->>'destination', (segment->>'departureDate')::DATE, (segment->>'returnDate')::DATE);
            ELSE
                UPDATE public.reservation_segments SET
                    origin = segment->>'origin',
                    destination = segment->>'destination',
                    departure_date = (segment->>'departureDate')::DATE,
                    return_date = (segment->>'returnDate')::DATE
                WHERE id = (segment->>'id')::BIGINT;
            END IF;
        END LOOP;
    END IF;

    -- --- Vuelos ---
    IF payload ? 'flights' THEN
        SELECT array_agg((f->>'id')::BIGINT) INTO flight_ids FROM jsonb_array_elements(payload->'flights') f WHERE f->>'id' IS NOT NULL;
        DELETE FROM public.reservation_flights WHERE reservation_id = reservation_id_input AND id NOT IN (SELECT unnest(COALESCE(flight_ids, '{}'::BIGINT[])));
        FOR flight IN SELECT * FROM jsonb_array_elements(payload->'flights')
        LOOP
            IF flight->>'id' IS NULL THEN
                INSERT INTO public.reservation_flights (reservation_id, airline, flight_category, baggage_allowance, flight_cycle, pnr)
                VALUES (reservation_id_input, flight->>'airline', flight->>'flightCategory', flight->>'baggageAllowance', flight->>'flightCycle', flight->>'trackingCode')
                RETURNING id INTO upserted_flight_id;
            ELSE
                UPDATE public.reservation_flights SET
                    airline = flight->>'airline',
                    flight_category = flight->>'flightCategory',
                    baggage_allowance = flight->>'baggageAllowance',
                    flight_cycle = flight->>'flightCycle',
                    pnr = flight->>'trackingCode'
                WHERE id = (flight->>'id')::BIGINT
                RETURNING id INTO upserted_flight_id;
            END IF;

            -- Sincronizar Itinerarios de Vuelo
            IF flight ? 'itineraries' THEN
                SELECT array_agg((i->>'id')::BIGINT) INTO itinerary_ids FROM jsonb_array_elements(flight->'itineraries') i WHERE i->>'id' IS NOT NULL;
                DELETE FROM public.reservation_flight_itineraries WHERE flight_id = upserted_flight_id AND id NOT IN (SELECT unnest(COALESCE(itinerary_ids, '{}'::BIGINT[])));
                FOR itinerary IN SELECT * FROM jsonb_array_elements(flight->'itineraries')
                LOOP
                    IF itinerary->>'id' IS NULL THEN
                        INSERT INTO public.reservation_flight_itineraries (flight_id, flight_number, departure_time, arrival_time)
                        VALUES (upserted_flight_id, itinerary->>'flightNumber', (itinerary->>'departure_time')::TIMESTAMPTZ, (itinerary->>'arrival_time')::TIMESTAMPTZ);
                    ELSE
                        UPDATE public.reservation_flight_itineraries SET
                            flight_number = itinerary->>'flightNumber',
                            departure_time = (itinerary->>'departure_time')::TIMESTAMPTZ,
                            arrival_time = (itinerary->>'arrival_time')::TIMESTAMPTZ
                        WHERE id = (itinerary->>'id')::BIGINT;
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    -- --- Hoteles ---
    IF payload ? 'hotels' THEN
        SELECT array_agg((h->>'id')::BIGINT) INTO hotel_ids FROM jsonb_array_elements(payload->'hotels') h WHERE h->>'id' IS NOT NULL;
        DELETE FROM public.reservation_hotels WHERE reservation_id = reservation_id_input AND id NOT IN (SELECT unnest(COALESCE(hotel_ids, '{}'::BIGINT[])));
        FOR hotel IN SELECT * FROM jsonb_array_elements(payload->'hotels')
        LOOP
            IF hotel->>'id' IS NULL THEN
                INSERT INTO public.reservation_hotels (reservation_id, name, room_category, meal_plan)
                VALUES (reservation_id_input, hotel->>'name', hotel->>'roomCategory', hotel->>'mealPlan')
                RETURNING id INTO upserted_hotel_id;
            ELSE
                UPDATE public.reservation_hotels SET
                    name = hotel->>'name',
                    room_category = hotel->>'roomCategory',
                    meal_plan = hotel->>'mealPlan'
                WHERE id = (hotel->>'id')::BIGINT
                RETURNING id INTO upserted_hotel_id;
            END IF;

            -- Sincronizar Acomodaciones
            IF hotel ? 'accommodation' THEN
                SELECT array_agg((a->>'id')::BIGINT) INTO accommodation_ids FROM jsonb_array_elements(hotel->'accommodation') a WHERE a->>'id' IS NOT NULL;
                DELETE FROM public.reservation_hotel_accommodations WHERE hotel_id = upserted_hotel_id AND id NOT IN (SELECT unnest(COALESCE(accommodation_ids, '{}'::BIGINT[])));
                FOR accommodation IN SELECT * FROM jsonb_array_elements(hotel->'accommodation')
                LOOP
                    IF accommodation->>'id' IS NULL THEN
                        INSERT INTO public.reservation_hotel_accommodations (hotel_id, rooms, adt, chd, inf)
                        VALUES (upserted_hotel_id, (accommodation->>'rooms')::INT, (accommodation->>'adt')::INT, (accommodation->>'chd')::INT, (accommodation->>'inf')::INT);
                    ELSE
                        UPDATE public.reservation_hotel_accommodations SET
                            rooms = (accommodation->>'rooms')::INT,
                            adt = (accommodation->>'adt')::INT,
                            chd = (accommodation->>'chd')::INT,
                            inf = (accommodation->>'inf')::INT
                        WHERE id = (accommodation->>'id')::BIGINT;
                    END IF;
                END LOOP;
            END IF;

            -- Sincronizar Inclusiones
            IF hotel ? 'hotelInclusions' THEN
                DELETE FROM public.reservation_hotel_inclusions WHERE hotel_id = upserted_hotel_id;
                FOR inclusion IN SELECT * FROM jsonb_array_elements_text(hotel->'hotelInclusions')
                LOOP
                    INSERT INTO public.reservation_hotel_inclusions (hotel_id, inclusion) VALUES (upserted_hotel_id, inclusion);
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    -- --- Tours ---
    IF payload ? 'tours' THEN
        SELECT array_agg((t->>'id')::BIGINT) INTO tour_ids FROM jsonb_array_elements(payload->'tours') t WHERE t->>'id' IS NOT NULL;
        DELETE FROM public.reservation_tours WHERE reservation_id = reservation_id_input AND id NOT IN (SELECT unnest(COALESCE(tour_ids, '{}'::BIGINT[])));
        FOR tour IN SELECT * FROM jsonb_array_elements(payload->'tours')
        LOOP
            IF tour->>'id' IS NULL THEN
                INSERT INTO public.reservation_tours (reservation_id, name, date, cost)
                VALUES (reservation_id_input, tour->>'name', (tour->>'date')::DATE, (tour->>'cost')::NUMERIC);
            ELSE
                UPDATE public.reservation_tours SET
                    name = tour->>'name',
                    date = (tour->>'date')::DATE,
                    cost = (tour->>'cost')::NUMERIC
                WHERE id = (tour->>'id')::BIGINT;
            END IF;
        END LOOP;
    END IF;

    -- --- Asistencias Médicas ---
    IF payload ? 'medicalAssistances' THEN
        SELECT array_agg((a->>'id')::BIGINT) INTO assistance_ids FROM jsonb_array_elements(payload->'medicalAssistances') a WHERE a->>'id' IS NOT NULL;
        DELETE FROM public.reservation_medical_assistances WHERE reservation_id = reservation_id_input AND id NOT IN (SELECT unnest(COALESCE(assistance_ids, '{}'::BIGINT[])));
        FOR assistance IN SELECT * FROM jsonb_array_elements(payload->'medicalAssistances')
        LOOP
            IF assistance->>'id' IS NULL THEN
                INSERT INTO public.reservation_medical_assistances (reservation_id, plan_type, start_date, end_date)
                VALUES (reservation_id_input, assistance->>'planType', (assistance->>'startDate')::DATE, (assistance->>'endDate')::DATE);
            ELSE
                UPDATE public.reservation_medical_assistances SET
                    plan_type = assistance->>'planType',
                    start_date = (assistance->>'startDate')::DATE,
                    end_date = (assistance->>'endDate')::DATE
                WHERE id = (assistance->>'id')::BIGINT;
            END IF;
        END LOOP;
    END IF;

    -- --- Cuotas de Pago ---
    IF payload ? 'installments' THEN
        SELECT array_agg((i->>'id')::BIGINT) INTO installment_ids FROM jsonb_array_elements(payload->'installments') i WHERE i->>'id' IS NOT NULL;
        DELETE FROM public.reservation_installments WHERE reservation_id = reservation_id_input AND id NOT IN (SELECT unnest(COALESCE(installment_ids, '{}'::BIGINT[])));
        FOR installment IN SELECT * FROM jsonb_array_elements(payload->'installments')
        LOOP
            IF installment->>'id' IS NULL THEN
                INSERT INTO public.reservation_installments (reservation_id, amount, due_date, status)
                VALUES (reservation_id_input, (installment->>'amount')::NUMERIC, (installment->>'dueDate')::DATE, COALESCE(installment->>'status', 'pending'));
            ELSE
                UPDATE public.reservation_installments SET
                    amount = (installment->>'amount')::NUMERIC,
                    due_date = (installment->>'dueDate')::DATE,
                    status = COALESCE(installment->>'status', 'pending')
                WHERE id = (installment->>'id')::BIGINT;
            END IF;
        END LOOP;
    END IF;

    -- --- Pasajeros (ACTUALIZADO PARA INCLUIR passenger_type) ---
    IF payload ? 'reservation_passengers' THEN
        SELECT array_agg((p->>'id')::BIGINT) INTO passenger_ids FROM jsonb_array_elements(payload->'reservation_passengers') p WHERE p->>'id' IS NOT NULL AND p->>'id' ~ '^[0-9]+$';
        DELETE FROM public.reservation_passengers WHERE reservation_id = reservation_id_input AND id NOT IN (SELECT unnest(COALESCE(passenger_ids, '{}'::BIGINT[])));
        FOR passenger IN SELECT * FROM jsonb_array_elements(payload->'reservation_passengers')
        LOOP
            IF passenger->>'id' IS NULL OR NOT (passenger->>'id' ~ '^[0-9]+$') THEN
                INSERT INTO public.reservation_passengers (reservation_id, name, lastname, document_type, document_number, birth_date, passenger_type, notes)
                VALUES (reservation_id_input, passenger->>'name', passenger->>'lastname', passenger->>'document_type', passenger->>'document_number', (passenger->>'birth_date')::DATE, COALESCE(passenger->>'passenger_type', 'ADT'), passenger->>'notes');
            ELSE
                UPDATE public.reservation_passengers SET
                    name = passenger->>'name',
                    lastname = passenger->>'lastname',
                    document_type = passenger->>'document_type',
                    document_number = passenger->>'document_number',
                    birth_date = (passenger->>'birth_date')::DATE,
                    passenger_type = COALESCE(passenger->>'passenger_type', 'ADT'),
                    notes = passenger->>'notes'
                WHERE id = (passenger->>'id')::BIGINT;
            END IF;
        END LOOP;
    END IF;

END;

--'get_and_increment_invoice_number' function

DECLARE
    settings_row public.business_settings;
    result_str text;
BEGIN
    -- Atomically select and lock the single settings row for update
    SELECT *
    INTO settings_row
    FROM public.business_settings
    LIMIT 1
    FOR UPDATE;

    -- If no settings row exists, raise an exception
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la configuración del negocio (business_settings).';
    END IF;

    -- Format the invoice number using the current value
    -- Replaces '####' with the number, padded with leading zeros to 4 digits
    result_str := replace(settings_row.invoice_format, '####', lpad(settings_row.next_invoice_number::text, 4, '0'));

    -- Increment the number for the next time, using the specific row ID
    UPDATE public.business_settings
    SET next_invoice_number = settings_row.next_invoice_number + 1
    WHERE id = settings_row.id; -- This WHERE clause is crucial to satisfy Supabase's security

    RETURN result_str;
END;

--'get_my_claim' function
SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> claim, '')::text;

--'get_my_role' function
SELECT role FROM public.usuarios WHERE id = auth.uid();

--'handle_updated_at' function
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;

--'mark_all_notifications_read' function
BEGIN
  UPDATE public.notifications
  SET read = TRUE, read_at = NOW()
  WHERE recipient_id = user_id AND read = FALSE;
END;

--'mark_notification_read' function
BEGIN
  UPDATE public.notifications
  SET read = TRUE, read_at = NOW()
  WHERE id = notification_id;
END;

--'notify_new_reservation' function
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

--'notify_reservation_approved' function
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

--'notify_reservation_rejected' function
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

--'update_transfer_updated_at' function
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
