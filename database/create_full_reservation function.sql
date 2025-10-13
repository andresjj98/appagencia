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
        total_amount, surcharge, payment_option, status, notes
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
        COALESCE((payload->>'surcharge')::NUMERIC, 0),
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

    -- Paso 3.5: Insertar TRASLADOS (SIMPLIFICADO)
    -- Los traslados vienen como checkboxes: { "0": { "hasIn": true, "hasOut": false }, "1": {...} }
    -- Solo guardamos si tiene traslado IN (arrival) o OUT (departure) por segmento
    IF payload ? 'transfers' THEN
        DECLARE
            transfers_obj JSONB;
            segment_idx_iter INT := 0;
            transfer_info JSONB;
            has_in BOOLEAN;
            has_out BOOLEAN;
            target_segment_id BIGINT;
        BEGIN
            transfers_obj := payload->'transfers';

            -- Iterar sobre cada segmento creado
            FOREACH target_segment_id IN ARRAY segment_ids
            LOOP
                -- Obtener info de traslados para este segmento (puede ser objeto o array)
                IF jsonb_typeof(transfers_obj) = 'object' THEN
                    transfer_info := transfers_obj->segment_idx_iter::TEXT;
                ELSIF jsonb_typeof(transfers_obj) = 'array' THEN
                    transfer_info := transfers_obj->segment_idx_iter;
                ELSE
                    transfer_info := NULL;
                END IF;

                -- Si hay información de traslados para este segmento
                IF transfer_info IS NOT NULL AND jsonb_typeof(transfer_info) <> 'null' THEN
                    has_in := COALESCE((transfer_info->>'hasIn')::BOOLEAN, false);
                    has_out := COALESCE((transfer_info->>'hasOut')::BOOLEAN, false);

                    -- Insertar traslado IN (arrival) si está marcado
                    IF has_in THEN
                        INSERT INTO public.reservation_transfers (reservation_id, segment_id, transfer_type)
                        VALUES (new_reservation_id, target_segment_id, 'arrival');
                    END IF;

                    -- Insertar traslado OUT (departure) si está marcado
                    IF has_out THEN
                        INSERT INTO public.reservation_transfers (reservation_id, segment_id, transfer_type)
                        VALUES (new_reservation_id, target_segment_id, 'departure');
                    END IF;
                END IF;

                segment_idx_iter := segment_idx_iter + 1;
            END LOOP;
        END;
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