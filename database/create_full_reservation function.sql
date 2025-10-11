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