-- ============================================================================
-- ACTUALIZAR RPCs PARA INCLUIR CAMPO ID_CARD_ISSUED_PLACE
-- ============================================================================
-- Descripción: Actualiza las funciones create_full_reservation y
--              update_full_reservation para manejar el lugar de expedición
-- Fecha: 2025-01-10
-- ============================================================================

-- ============================================================================
-- ACTUALIZACIÓN DE create_full_reservation PARA INCLUIR ID_CARD_ISSUED_PLACE
-- ============================================================================

CREATE OR REPLACE FUNCTION create_full_reservation(payload JSONB)
RETURNS void
LANGUAGE plpgsql
AS $$
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
    segment_ids BIGINT[] := '{}';
BEGIN
    -- Paso 1: Insertar o actualizar cliente (Upsert) - INCLUYENDO ID_CARD_ISSUED_PLACE
    INSERT INTO public.clients (
        name, email, phone, id_card, address,
        emergency_contact_name, emergency_contact_phone,
        id_card_issued_place  -- <<<< NUEVO CAMPO
    )
    VALUES (
        payload->>'clientName',
        payload->>'clientEmail',
        payload->>'clientPhone',
        payload->>'clientId',
        payload->>'clientAddress',
        payload->'emergencyContact'->>'name',
        payload->'emergencyContact'->>'phone',
        payload->>'clientIdIssuedPlace'  -- <<<< NUEVO CAMPO
    )
    ON CONFLICT (email) DO UPDATE
    SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        id_card = EXCLUDED.id_card,
        address = EXCLUDED.address,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_phone = EXCLUDED.emergency_contact_phone,
        id_card_issued_place = EXCLUDED.id_card_issued_place  -- <<<< NUEVO CAMPO
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
        total_amount,
        surcharge,
        payment_option,
        status,
        notes
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

        segment_ids := array_append(segment_ids, new_segment_id);
        segment_index := segment_index + 1;
    END LOOP;

    -- Paso 3.5: Insertar TRASLADOS
    IF payload ? 'transfers' THEN
        FOR transfer IN SELECT * FROM jsonb_array_elements(payload->'transfers')
        LOOP
            DECLARE
                target_segment_index INT;
                target_segment_id BIGINT;
            BEGIN
                target_segment_index := (transfer->>'segmentIndex')::INT;
                target_segment_id := segment_ids[target_segment_index + 1];

                IF target_segment_id IS NOT NULL THEN
                    INSERT INTO public.reservation_transfers (
                        reservation_id,
                        segment_id,
                        transfer_type
                    )
                    VALUES (
                        new_reservation_id,
                        target_segment_id,
                        transfer->>'transferType'
                    );
                END IF;
            END;
        END LOOP;
    END IF;

    -- Paso 4: Vuelos
    FOR flight IN SELECT * FROM jsonb_array_elements(payload->'flights')
    LOOP
        DECLARE
            new_flight_id BIGINT;
        BEGIN
            INSERT INTO public.reservation_flights (
                reservation_id, airline, flight_category, baggage_allowance, flight_cycle, tracking_code
            )
            VALUES (
                new_reservation_id,
                flight->>'airline',
                flight->>'flightCategory',
                flight->>'baggageAllowance',
                flight->>'flightCycle',
                flight->>'trackingCode'
            )
            RETURNING id INTO new_flight_id;

            IF (flight->'hasItinerary')::BOOLEAN = TRUE THEN
                FOR itinerary IN SELECT * FROM jsonb_array_elements(flight->'itineraries')
                LOOP
                    INSERT INTO public.reservation_flight_itineraries (
                        flight_id, flight_number, departure_time, arrival_time
                    )
                    VALUES (
                        new_flight_id,
                        itinerary->>'flightNumber',
                        (itinerary->>'departure_time')::TIMESTAMPTZ,
                        (itinerary->>'arrival_time')::TIMESTAMPTZ
                    );
                END LOOP;
            END IF;
        END;
    END LOOP;

    -- Paso 5: Hoteles
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
                IF inclusion IS NOT NULL AND inclusion <> '' THEN
                    INSERT INTO public.reservation_hotel_inclusions (hotel_id, inclusion)
                    VALUES (new_hotel_id, inclusion);
                END IF;
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
$$;

-- ============================================================================
-- ACTUALIZACIÓN DE update_full_reservation PARA INCLUIR ID_CARD_ISSUED_PLACE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_full_reservation(reservation_id_input BIGINT, payload JSONB)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    client_id_from_db UUID;
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
    new_segment_id BIGINT;
    segment_ids BIGINT[] := '{}';
BEGIN
    -- Paso 1: Obtener client_id de la reserva existente
    SELECT client_id INTO client_id_from_db
    FROM public.reservations
    WHERE id = reservation_id_input;

    IF client_id_from_db IS NULL THEN
        RAISE EXCEPTION 'Reservation not found with id %', reservation_id_input;
    END IF;

    -- Paso 2: Actualizar información del cliente - INCLUYENDO ID_CARD_ISSUED_PLACE
    UPDATE public.clients
    SET
        name = payload->>'clientName',
        email = payload->>'clientEmail',
        phone = payload->>'clientPhone',
        id_card = payload->>'clientId',
        address = payload->>'clientAddress',
        emergency_contact_name = payload->'emergencyContact'->>'name',
        emergency_contact_phone = payload->'emergencyContact'->>'phone',
        id_card_issued_place = payload->>'clientIdIssuedPlace'  -- <<<< NUEVO CAMPO
    WHERE id = client_id_from_db;

    -- Paso 3: Actualizar la reserva principal
    UPDATE public.reservations
    SET
        trip_type = payload->>'tripType',
        reservation_type = payload->>'reservation_type',
        passengers_adt = (payload->>'passengersADT')::INT,
        passengers_chd = (payload->>'passengersCHD')::INT,
        passengers_inf = (payload->>'passengersINF')::INT,
        price_per_adt = (payload->>'pricePerADT')::NUMERIC,
        price_per_chd = (payload->>'pricePerCHD')::NUMERIC,
        price_per_inf = (payload->>'pricePerINF')::NUMERIC,
        total_amount = (payload->>'totalAmount')::NUMERIC,
        surcharge = COALESCE((payload->>'surcharge')::NUMERIC, 0),
        payment_option = payload->>'paymentOption',
        status = payload->>'status',
        notes = payload->>'notes',
        updated_at = NOW()
    WHERE id = reservation_id_input;

    -- Paso 4: Eliminar datos antiguos relacionados
    DELETE FROM public.reservation_segments WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_transfers WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_flight_itineraries WHERE flight_id IN (SELECT id FROM public.reservation_flights WHERE reservation_id = reservation_id_input);
    DELETE FROM public.reservation_flights WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_hotel_accommodations WHERE hotel_id IN (SELECT id FROM public.reservation_hotels WHERE reservation_id = reservation_id_input);
    DELETE FROM public.reservation_hotel_inclusions WHERE hotel_id IN (SELECT id FROM public.reservation_hotels WHERE reservation_id = reservation_id_input);
    DELETE FROM public.reservation_hotels WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_tours WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_medical_assistances WHERE reservation_id = reservation_id_input;
    DELETE FROM public.reservation_installments WHERE reservation_id = reservation_id_input;

    -- Paso 5: Re-insertar segmentos
    FOR segment IN SELECT * FROM jsonb_array_elements(payload->'segments')
    LOOP
        INSERT INTO public.reservation_segments (reservation_id, origin, destination, departure_date, return_date)
        VALUES (reservation_id_input, segment->>'origin', segment->>'destination', (segment->>'departureDate')::DATE, (segment->>'returnDate')::DATE)
        RETURNING id INTO new_segment_id;

        segment_ids := array_append(segment_ids, new_segment_id);
        segment_index := segment_index + 1;
    END LOOP;

    -- Paso 5.5: Re-insertar traslados
    IF payload ? 'transfers' THEN
        FOR transfer IN SELECT * FROM jsonb_array_elements(payload->'transfers')
        LOOP
            DECLARE
                target_segment_index INT;
                target_segment_id BIGINT;
            BEGIN
                target_segment_index := (transfer->>'segmentIndex')::INT;
                target_segment_id := segment_ids[target_segment_index + 1];

                IF target_segment_id IS NOT NULL THEN
                    INSERT INTO public.reservation_transfers (
                        reservation_id,
                        segment_id,
                        transfer_type
                    )
                    VALUES (
                        reservation_id_input,
                        target_segment_id,
                        transfer->>'transferType'
                    );
                END IF;
            END;
        END LOOP;
    END IF;

    -- Paso 6: Re-insertar vuelos
    FOR flight IN SELECT * FROM jsonb_array_elements(payload->'flights')
    LOOP
        DECLARE
            new_flight_id BIGINT;
        BEGIN
            INSERT INTO public.reservation_flights (
                reservation_id, airline, flight_category, baggage_allowance, flight_cycle, tracking_code
            )
            VALUES (
                reservation_id_input,
                flight->>'airline',
                flight->>'flightCategory',
                flight->>'baggageAllowance',
                flight->>'flightCycle',
                flight->>'trackingCode'
            )
            RETURNING id INTO new_flight_id;

            IF (flight->'hasItinerary')::BOOLEAN = TRUE THEN
                FOR itinerary IN SELECT * FROM jsonb_array_elements(flight->'itineraries')
                LOOP
                    INSERT INTO public.reservation_flight_itineraries (
                        flight_id, flight_number, departure_time, arrival_time
                    )
                    VALUES (
                        new_flight_id,
                        itinerary->>'flightNumber',
                        (itinerary->>'departure_time')::TIMESTAMPTZ,
                        (itinerary->>'arrival_time')::TIMESTAMPTZ
                    );
                END LOOP;
            END IF;
        END;
    END LOOP;

    -- Paso 7: Re-insertar hoteles
    FOR hotel IN SELECT * FROM jsonb_array_elements(payload->'hotels')
    LOOP
        DECLARE
            new_hotel_id BIGINT;
        BEGIN
            INSERT INTO public.reservation_hotels (reservation_id, name, room_category, meal_plan)
            VALUES (reservation_id_input, hotel->>'name', hotel->>'roomCategory', hotel->>'mealPlan')
            RETURNING id INTO new_hotel_id;

            FOR accommodation IN SELECT * FROM jsonb_array_elements(hotel->'accommodation')
            LOOP
                INSERT INTO public.reservation_hotel_accommodations (hotel_id, rooms, adt, chd, inf)
                VALUES (new_hotel_id, (accommodation->>'rooms')::INT, (accommodation->>'adt')::INT, (accommodation->>'chd')::INT, (accommodation->>'inf')::INT);
            END LOOP;

            FOR inclusion IN SELECT * FROM jsonb_array_elements_text(hotel->'hotelInclusions')
            LOOP
                IF inclusion IS NOT NULL AND inclusion <> '' THEN
                    INSERT INTO public.reservation_hotel_inclusions (hotel_id, inclusion)
                    VALUES (new_hotel_id, inclusion);
                END IF;
            END LOOP;
        END;
    END LOOP;

    -- Paso 8: Re-insertar tours
    FOR tour IN SELECT * FROM jsonb_array_elements(payload->'tours')
    LOOP
        INSERT INTO public.reservation_tours (reservation_id, name, date, cost)
        VALUES (reservation_id_input, tour->>'name', (tour->>'date')::DATE, (tour->>'cost')::NUMERIC);
    END LOOP;

    -- Paso 9: Re-insertar asistencias médicas
    FOR assistance IN SELECT * FROM jsonb_array_elements(payload->'medicalAssistances')
    LOOP
        INSERT INTO public.reservation_medical_assistances (reservation_id, plan_type, start_date, end_date)
        VALUES (reservation_id_input, assistance->>'planType', (assistance->>'startDate')::DATE, (assistance->>'endDate')::DATE);
    END LOOP;

    -- Paso 10: Re-insertar cuotas de pago
    FOR installment IN SELECT * FROM jsonb_array_elements(payload->'installments')
    LOOP
        INSERT INTO public.reservation_installments (reservation_id, amount, due_date, status)
        VALUES (reservation_id_input, (installment->>'amount')::NUMERIC, (installment->>'dueDate')::DATE, 'pending');
    END LOOP;
END;
$$;

-- Verificar que las funciones se actualizaron correctamente
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('create_full_reservation', 'update_full_reservation');
