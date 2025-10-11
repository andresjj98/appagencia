DECLARE
    client_id_from_db UUID;
    current_status TEXT;
    current_advisor UUID;
    current_office UUID;

    actor_role_db TEXT;
    actor_office UUID;
    actor_is_super_admin BOOLEAN;
    effective_role TEXT;

    allow_finance_update BOOLEAN;
    allow_total_update BOOLEAN;
    allow_payment_option_update BOOLEAN;
    allow_surcharge_update BOOLEAN;

    segment JSONB;
    segment_index INT := 0;
    flight JSONB;
    itinerary JSONB;
    hotel JSONB;
    accommodation JSONB;
    inclusion TEXT;
    tour JSONB;
    assistance JSONB;
    transfer JSONB;
    new_segment_id BIGINT;
    segment_ids BIGINT[] := '{}';
    segments_json JSONB;
    transfers_json JSONB;
    flights_json JSONB;
    hotels_json JSONB;
    tours_json JSONB;
    assistances_json JSONB;
BEGIN
    IF payload IS NULL THEN
        RAISE EXCEPTION 'Debe proporcionar datos para actualizar la reserva.';
    END IF;

    SELECT client_id, status, advisor_id, office_id
      INTO client_id_from_db, current_status, current_advisor, current_office
    FROM public.reservations
    WHERE id = reservation_id_input;

    IF client_id_from_db IS NULL THEN
        RAISE EXCEPTION 'Reservation not found with id %', reservation_id_input;
    END IF;

    IF actor_id IS NULL THEN
        RAISE EXCEPTION 'Se requiere actor_id para actualizar la reserva %.', reservation_id_input;
    END IF;

    SELECT role, office_id, is_super_admin
      INTO actor_role_db, actor_office, actor_is_super_admin
    FROM public.usuarios
    WHERE id = actor_id;

    IF actor_role_db IS NULL THEN
        RAISE EXCEPTION 'No se encontró el usuario % en la tabla usuarios.', actor_id;
    END IF;

    effective_role := CASE WHEN actor_is_super_admin THEN 'administrador' ELSE actor_role_db END;

    IF actor_role IS NOT NULL AND actor_role <> effective_role THEN
        RAISE EXCEPTION 'El rol suministrado (%) no coincide con el rol real (%).', actor_role, effective_role;
    END IF;

    IF effective_role IN ('administrador', 'gestor')
       AND actor_office IS NOT NULL
       AND actor_office <> current_office THEN
        RAISE EXCEPTION 'El usuario % no puede modificar reservas de otra oficina.', actor_id;
    END IF;

    IF effective_role = 'asesor' THEN
        IF current_advisor IS DISTINCT FROM actor_id THEN
            RAISE EXCEPTION 'Solo el asesor asignado puede editar esta reserva.';
        END IF;
        IF current_status NOT IN ('pending','rejected') THEN
            RAISE EXCEPTION 'El asesor no puede editar la reserva % porque está en estado %.', reservation_id_input, current_status;
        END IF;
    ELSIF effective_role = 'gestor' THEN
        IF current_status <> 'confirmed' THEN
            RAISE EXCEPTION 'Los gestores solo pueden modificar reservas confirmadas. Estado actual: %.', current_status;
        END IF;
    ELSIF effective_role <> 'administrador' THEN
        RAISE EXCEPTION 'El rol % no está autorizado para actualizar reservas.', effective_role;
    END IF;

    allow_finance_update :=
        LOWER(COALESCE(update_context, 'general')) = 'finance'
        OR LOWER(COALESCE(payload->>'updateContext', 'general')) = 'finance';

    IF allow_finance_update AND effective_role <> 'administrador' THEN
        RAISE EXCEPTION 'Solo administradores pueden ejecutar actualizaciones financieras.';
    END IF;

    allow_total_update :=
        (payload ? 'totalAmount')
        AND (
            allow_finance_update
            OR current_status IN ('pending','rejected')
        );

    allow_payment_option_update :=
        (payload ? 'paymentOption')
        AND (
            allow_finance_update
            OR current_status IN ('pending','rejected')
        );

    allow_surcharge_update :=
        (payload ? 'surcharge')
        AND (
            allow_finance_update
            OR current_status IN ('pending','rejected')
        );

    UPDATE public.clients
    SET
        name = COALESCE(payload->>'clientName', name),
        email = COALESCE(payload->>'clientEmail', email),
        phone = COALESCE(payload->>'clientPhone', phone),
        id_card = COALESCE(payload->>'clientId', id_card),
        address = COALESCE(payload->>'clientAddress', address),
        emergency_contact_name = COALESCE(payload->'emergencyContact'->>'name', emergency_contact_name),
        emergency_contact_phone = COALESCE(payload->'emergencyContact'->>'phone', emergency_contact_phone),
        id_card_issued_place = COALESCE(payload->>'clientIdIssuedPlace', id_card_issued_place)
    WHERE id = client_id_from_db;

    UPDATE public.reservations
    SET
        trip_type = COALESCE(payload->>'tripType', trip_type),
        reservation_type = COALESCE(payload->>'reservation_type', reservation_type),
        passengers_adt = COALESCE((NULLIF(payload->>'passengersADT',''))::INT, passengers_adt),
        passengers_chd = COALESCE((NULLIF(payload->>'passengersCHD',''))::INT, passengers_chd),
        passengers_inf = COALESCE((NULLIF(payload->>'passengersINF',''))::INT, passengers_inf),
        price_per_adt = COALESCE((NULLIF(payload->>'pricePerADT',''))::NUMERIC, price_per_adt),
        price_per_chd = COALESCE((NULLIF(payload->>'pricePerCHD',''))::NUMERIC, price_per_chd),
        price_per_inf = COALESCE((NULLIF(payload->>'pricePerINF',''))::NUMERIC, price_per_inf),
        total_amount = CASE
            WHEN allow_total_update THEN COALESCE((NULLIF(payload->>'totalAmount',''))::NUMERIC, total_amount)
            ELSE total_amount
        END,
        surcharge = CASE
            WHEN allow_surcharge_update THEN COALESCE((NULLIF(payload->>'surcharge',''))::NUMERIC, surcharge)
            ELSE surcharge
        END,
        payment_option = CASE
            WHEN allow_payment_option_update THEN COALESCE(payload->>'paymentOption', payment_option)
            ELSE payment_option
        END,
        status = COALESCE(payload->>'status', status),
        notes = COALESCE(payload->>'notes', notes),
        updated_at = NOW()
    WHERE id = reservation_id_input;

    -- Solo borrar detalles si se proporcionan nuevos datos en el payload
    IF payload ? 'segments' THEN
        DELETE FROM public.reservation_segments WHERE reservation_id = reservation_id_input;
    END IF;

    IF payload ? 'transfers' THEN
        DELETE FROM public.reservation_transfers WHERE reservation_id = reservation_id_input;
    END IF;

    IF payload ? 'flights' THEN
        DELETE FROM public.reservation_flight_itineraries WHERE flight_id IN (
            SELECT id FROM public.reservation_flights WHERE reservation_id = reservation_id_input
        );
        DELETE FROM public.reservation_flights WHERE reservation_id = reservation_id_input;
    END IF;

    IF payload ? 'hotels' THEN
        DELETE FROM public.reservation_hotel_accommodations WHERE hotel_id IN (
            SELECT id FROM public.reservation_hotels WHERE reservation_id = reservation_id_input
        );
        DELETE FROM public.reservation_hotel_inclusions WHERE hotel_id IN (
            SELECT id FROM public.reservation_hotels WHERE reservation_id = reservation_id_input
        );
        DELETE FROM public.reservation_hotels WHERE reservation_id = reservation_id_input;
    END IF;

    IF payload ? 'tours' THEN
        DELETE FROM public.reservation_tours WHERE reservation_id = reservation_id_input;
    END IF;

    IF payload ? 'medicalAssistances' THEN
        DELETE FROM public.reservation_medical_assistances WHERE reservation_id = reservation_id_input;
    END IF;

    segment_ids := ARRAY[]::BIGINT[];
    segment_index := 0;

    segments_json := CASE jsonb_typeof(payload->'segments')
        WHEN 'array' THEN payload->'segments'
        WHEN 'object' THEN (
            SELECT COALESCE(
                jsonb_agg(value ORDER BY CASE WHEN key ~ '^[0-9]+$' THEN key::int ELSE NULL END, key),
                '[]'::jsonb
            )
            FROM jsonb_each(payload->'segments')
        )
        ELSE '[]'::jsonb
    END;
    segments_json := COALESCE(segments_json, '[]'::jsonb);

    transfers_json := CASE jsonb_typeof(payload->'transfers')
        WHEN 'array' THEN payload->'transfers'
        WHEN 'object' THEN (
            SELECT COALESCE(
                jsonb_agg(value ORDER BY CASE WHEN key ~ '^[0-9]+$' THEN key::int ELSE NULL END, key),
                '[]'::jsonb
            )
            FROM jsonb_each(payload->'transfers')
        )
        ELSE '[]'::jsonb
    END;
    transfers_json := COALESCE(transfers_json, '[]'::jsonb);

    flights_json := CASE jsonb_typeof(payload->'flights')
        WHEN 'array' THEN payload->'flights'
        WHEN 'object' THEN (
            SELECT COALESCE(
                jsonb_agg(value ORDER BY CASE WHEN key ~ '^[0-9]+$' THEN key::int ELSE NULL END, key),
                '[]'::jsonb
            )
            FROM jsonb_each(payload->'flights')
        )
        ELSE '[]'::jsonb
    END;
    flights_json := COALESCE(flights_json, '[]'::jsonb);

    hotels_json := CASE jsonb_typeof(payload->'hotels')
        WHEN 'array' THEN payload->'hotels'
        WHEN 'object' THEN (
            SELECT COALESCE(
                jsonb_agg(value ORDER BY CASE WHEN key ~ '^[0-9]+$' THEN key::int ELSE NULL END, key),
                '[]'::jsonb
            )
            FROM jsonb_each(payload->'hotels')
        )
        ELSE '[]'::jsonb
    END;
    hotels_json := COALESCE(hotels_json, '[]'::jsonb);

    tours_json := CASE jsonb_typeof(payload->'tours')
        WHEN 'array' THEN payload->'tours'
        WHEN 'object' THEN (
            SELECT COALESCE(
                jsonb_agg(value ORDER BY CASE WHEN key ~ '^[0-9]+$' THEN key::int ELSE NULL END, key),
                '[]'::jsonb
            )
            FROM jsonb_each(payload->'tours')
        )
        ELSE '[]'::jsonb
    END;
    tours_json := COALESCE(tours_json, '[]'::jsonb);

    assistances_json := CASE jsonb_typeof(payload->'medicalAssistances')
        WHEN 'array' THEN payload->'medicalAssistances'
        WHEN 'object' THEN (
            SELECT COALESCE(
                jsonb_agg(value ORDER BY CASE WHEN key ~ '^[0-9]+$' THEN key::int ELSE NULL END, key),
                '[]'::jsonb
            )
            FROM jsonb_each(payload->'medicalAssistances')
        )
        ELSE '[]'::jsonb
    END;
    assistances_json := COALESCE(assistances_json, '[]'::jsonb);

    FOR segment IN SELECT * FROM jsonb_array_elements(segments_json)
    LOOP
        INSERT INTO public.reservation_segments (reservation_id, origin, destination, departure_date, return_date)
        VALUES (
            reservation_id_input,
            segment->>'origin',
            segment->>'destination',
            (NULLIF(segment->>'departureDate',''))::DATE,
            (NULLIF(segment->>'returnDate',''))::DATE
        )
        RETURNING id INTO new_segment_id;

        segment_ids := array_append(segment_ids, new_segment_id);
        segment_index := segment_index + 1;
    END LOOP;

    IF jsonb_array_length(transfers_json) > 0 THEN
        FOR transfer IN SELECT * FROM jsonb_array_elements(transfers_json)
        LOOP
            DECLARE
                target_segment_index INT;
                target_segment_id BIGINT;
            BEGIN
                target_segment_index := (NULLIF(transfer->>'segmentIndex',''))::INT;
                IF target_segment_index IS NOT NULL
                   AND target_segment_index >= 0
                   AND target_segment_index < COALESCE(array_length(segment_ids, 1), 0) THEN
                    target_segment_id := segment_ids[target_segment_index + 1];
                ELSE
                    target_segment_id := NULL;
                END IF;

                IF target_segment_id IS NOT NULL THEN
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
                        reservation_id_input,
                        target_segment_id,
                        transfer->>'transferType',
                        transfer->>'pickupLocation',
                        transfer->>'dropoffLocation',
                        (NULLIF(transfer->>'transferDate',''))::DATE,
                        (NULLIF(transfer->>'transferTime',''))::TIME,
                        COALESCE((NULLIF(transfer->>'cost',''))::NUMERIC, 0),
                        COALESCE((NULLIF(transfer->>'includeCost',''))::BOOLEAN, FALSE),
                        transfer->>'vehicleType',                      
                        transfer->>'notes'
                    );
                END IF;
            END;
        END LOOP;
    END IF;

    FOR flight IN SELECT * FROM jsonb_array_elements(flights_json)
    LOOP
        DECLARE
            new_flight_id BIGINT;
        BEGIN
            INSERT INTO public.reservation_flights (
                reservation_id,
                airline,
                flight_category,
                baggage_allowance,
                flight_cycle,
                pnr
            ) VALUES (
                reservation_id_input,
                flight->>'airline',
                flight->>'flightCategory',
                flight->>'baggageAllowance',
                flight->>'flightCycle',
                NULLIF(flight->>'trackingCode','')
            )
            RETURNING id INTO new_flight_id;

            IF (flight->>'hasItinerary')::BOOLEAN IS TRUE THEN
                FOR itinerary IN SELECT * FROM jsonb_array_elements(flight->'itineraries')
                LOOP
                    INSERT INTO public.reservation_flight_itineraries (
                        flight_id,
                        flight_number,
                        departure_time,
                        arrival_time
                    ) VALUES (
                        new_flight_id,
                        itinerary->>'flightNumber',
                        (NULLIF(itinerary->>'departure_time',''))::TIMESTAMPTZ,
                        (NULLIF(itinerary->>'arrival_time',''))::TIMESTAMPTZ
                    );
                END LOOP;
            END IF;
        END;
    END LOOP;

    FOR hotel IN SELECT * FROM jsonb_array_elements(hotels_json)
    LOOP
        DECLARE
            new_hotel_id BIGINT;
        BEGIN
            INSERT INTO public.reservation_hotels (reservation_id, name, room_category, meal_plan)
            VALUES (
                reservation_id_input,
                hotel->>'name',
                hotel->>'roomCategory',
                hotel->>'mealPlan'
            )
            RETURNING id INTO new_hotel_id;

            FOR accommodation IN SELECT * FROM jsonb_array_elements(COALESCE(hotel->'accommodation','[]'::JSONB))
            LOOP
                INSERT INTO public.reservation_hotel_accommodations (hotel_id, rooms, adt, chd, inf)
                VALUES (
                    new_hotel_id,
                    (NULLIF(accommodation->>'rooms',''))::INT,
                    (NULLIF(accommodation->>'adt',''))::INT,
                    (NULLIF(accommodation->>'chd',''))::INT,
                    (NULLIF(accommodation->>'inf',''))::INT
                );
            END LOOP;

            FOR inclusion IN SELECT * FROM jsonb_array_elements_text(COALESCE(hotel->'hotelInclusions','[]'::JSONB))
            LOOP
                IF inclusion IS NOT NULL AND inclusion <> '' THEN
                    INSERT INTO public.reservation_hotel_inclusions (hotel_id, inclusion)
                    VALUES (new_hotel_id, inclusion);
                END IF;
            END LOOP;
        END;
    END LOOP;

    FOR tour IN SELECT * FROM jsonb_array_elements(tours_json)
    LOOP
        INSERT INTO public.reservation_tours (reservation_id, name, date, cost)
        VALUES (
            reservation_id_input,
            tour->>'name',
            (NULLIF(tour->>'date',''))::DATE,
            (NULLIF(tour->>'cost',''))::NUMERIC
        );
    END LOOP;

    FOR assistance IN SELECT * FROM jsonb_array_elements(assistances_json)
    LOOP
        INSERT INTO public.reservation_medical_assistances (reservation_id, plan_type, start_date, end_date)
        VALUES (
            reservation_id_input,
            assistance->>'planType',
            (NULLIF(assistance->>'startDate',''))::DATE,
            (NULLIF(assistance->>'endDate',''))::DATE
        );
    END LOOP;

    -- Las cuotas se mantienen intactas; solo se gestionan desde el módulo de finanzas.
END;