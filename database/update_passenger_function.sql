-- Actualizar la función update_full_reservation para incluir passenger_type
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_full_reservation(reservation_id_input BIGINT, payload JSONB)
RETURNS void
LANGUAGE plpgsql
AS $$
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
            emergency_contact_phone = payload->'emergencyContact'->>'phone'
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
$$;

COMMENT ON FUNCTION update_full_reservation IS 'Actualiza una reserva completa incluyendo todos sus componentes (actualizado para incluir passenger_type)';
