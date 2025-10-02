-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.business_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agency_name text,
  legal_name text,
  logo_url text,
  contact_info jsonb,
  tax_id_number text,
  tax_registry text,
  legal_representative_name text,
  legal_representative_id text,
  tax_regime text,
  operating_city text,
  operating_country text,
  tourism_registry_number text,
  terms_and_conditions text,
  travel_contract text,
  cancellation_policies text,
  voucher_info text,
  voucher_header text,
  contract_header text,
  default_footer text,
  digital_signature text,
  secondary_logo_url text,
  invoice_message text,
  voucher_message text,
  contract_message text,
  next_invoice_number integer NOT NULL DEFAULT 1001,
  invoice_format text NOT NULL DEFAULT 'INV-####'::text,
  currency text NOT NULL DEFAULT 'EUR'::text,
  timezone text NOT NULL DEFAULT 'Europe/Madrid'::text,
  tax_rate numeric NOT NULL DEFAULT 21.00,
  preferred_date_format text NOT NULL DEFAULT 'DD/MM/AAAA'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT business_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.catalog_airlines (
  iata_code text NOT NULL,
  name text NOT NULL,
  country text,
  global_alliance text,
  airline_type text,
  logo_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT catalog_airlines_pkey PRIMARY KEY (iata_code)
);
CREATE TABLE public.catalog_airports (
  iata_code text NOT NULL,
  airport_name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  region text,
  is_main_hub boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT catalog_airports_pkey PRIMARY KEY (iata_code)
);
CREATE TABLE public.change_requests (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  requested_by_id uuid,
  section_to_change text NOT NULL,
  requested_changes jsonb,
  request_reason text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT change_requests_pkey PRIMARY KEY (id),
  CONSTRAINT change_requests_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id),
  CONSTRAINT change_requests_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  id_card text,
  email text UNIQUE,
  phone text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  recipient_id uuid NOT NULL,
  sender_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  reference_id bigint,
  reference_type text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  metadata jsonb,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.usuarios(id),
  CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.offices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text,
  email text,
  manager text,
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT offices_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reservation_attachments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  title text,
  observation text,
  file_name text,
  file_url text,
  CONSTRAINT reservation_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_attachments_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.reservation_flight_itineraries (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  flight_id bigint NOT NULL,
  flight_number text,
  departure_time timestamp with time zone,
  arrival_time timestamp with time zone,
  CONSTRAINT reservation_flight_itineraries_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_flight_itineraries_flight_id_fkey FOREIGN KEY (flight_id) REFERENCES public.reservation_flights(id)
);
CREATE TABLE public.reservation_flights (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  airline text,
  flight_category text,
  baggage_allowance text,
  flight_cycle text,
  pnr text,
  CONSTRAINT reservation_flights_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_flights_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.reservation_hotel_accommodations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  hotel_id bigint NOT NULL,
  rooms integer,
  adt integer,
  chd integer,
  inf integer,
  CONSTRAINT reservation_hotel_accommodations_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_hotel_accommodations_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.reservation_hotels(id)
);
CREATE TABLE public.reservation_hotel_inclusions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  hotel_id bigint NOT NULL,
  inclusion text,
  CONSTRAINT reservation_hotel_inclusions_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_hotel_inclusions_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.reservation_hotels(id)
);
CREATE TABLE public.reservation_hotels (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  name text,
  room_category text,
  meal_plan text,
  CONSTRAINT reservation_hotels_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_hotels_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.reservation_installments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  amount numeric,
  due_date date,
  status text DEFAULT 'pending'::text,
  payment_date date,
  receipt_url text,
  CONSTRAINT reservation_installments_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_installments_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.reservation_medical_assistances (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  plan_type text,
  start_date date,
  end_date date,
  CONSTRAINT reservation_medical_assistances_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_medical_assistances_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.reservation_passengers (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  name text,
  lastname text,
  document_type text,
  document_number text,
  birth_date date,
  notes text,
  CONSTRAINT reservation_passengers_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_passengers_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.reservation_segments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  origin text,
  destination text,
  departure_date date,
  return_date date,
  CONSTRAINT reservation_segments_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_segments_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.reservation_tours (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  name text,
  date date,
  cost numeric,
  CONSTRAINT reservation_tours_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_tours_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.reservations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  invoice_number text UNIQUE,
  client_id uuid,
  advisor_id uuid,
  manager_id uuid,
  trip_type text NOT NULL DEFAULT 'round_trip'::text,
  passengers_adt integer NOT NULL DEFAULT 1,
  passengers_chd integer DEFAULT 0,
  passengers_inf integer DEFAULT 0,
  price_per_adt numeric DEFAULT 0,
  price_per_chd numeric DEFAULT 0,
  price_per_inf numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  payment_option text DEFAULT 'full_payment'::text,
  status text DEFAULT 'pending'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone,
  hotel_status_ok boolean DEFAULT false,
  flight_status_ok boolean DEFAULT false,
  tours_status_ok boolean DEFAULT false,
  assistance_status_ok boolean DEFAULT false,
  reservation_type text,
  updated_at timestamp with time zone,
  rejection_reason text,
  rejected_at timestamp with time zone,
  rejected_by uuid,
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT reservations_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.usuarios(id),
  CONSTRAINT reservations_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.usuarios(id),
  CONSTRAINT reservations_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.usuarios(id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  last_name text,
  id_card text,
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  role text,
  password text NOT NULL,
  active boolean DEFAULT true,
  avatar text,
  office_id uuid,
  is_super_admin boolean DEFAULT false,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id)
);

-- INICIO FUNCIONES
DECLARE
    new_client_id UUID;
    new_reservation_id BIGINT;
    segment JSONB;
    flight JSONB;
    itinerary JSONB;
    hotel JSONB;
    accommodation JSONB;
    inclusion TEXT;
    tour JSONB;
    assistance JSONB;
    installment JSONB;
BEGIN
    -- Paso 1: Intentar insertar el cliente. Si el EMAIL ya existe, actualizar
    -- los datos (nombre, teléfono, etc.) y OBTENER el ID existente.
    INSERT INTO public.clients (
        name,
        email,
        phone,
        id_card,
        address,
        emergency_contact_name,
        emergency_contact_phone
    )
    VALUES (
        payload->>'clientName',
        payload->>'clientEmail',
        payload->>'clientPhone',
        payload->>'clientId',
        payload->>'clientAddress',
        payload->'emergencyContact'->>'name',
        payload->'emergencyContact'->>'phone'
    )
    ON CONFLICT (email) DO UPDATE 
    SET 
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        id_card = EXCLUDED.id_card,
        address = EXCLUDED.address,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_phone = EXCLUDED.emergency_contact_phone
    RETURNING id INTO new_client_id;

    -- Paso 2: Crear la reserva principal
    INSERT INTO public.reservations (
        client_id, advisor_id, trip_type, reservation_type,
        passengers_adt, passengers_chd, passengers_inf,
        price_per_adt, price_per_chd, price_per_inf,
        total_amount, payment_option, status, notes
    )
    VALUES (
        new_client_id,
        (payload->>'advisorId')::UUID,
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

    -- Paso 3: Insertar datos en tablas relacionadas
    -- Segmentos
    FOR segment IN SELECT * FROM jsonb_array_elements(payload->'segments')
    LOOP
        INSERT INTO public.reservation_segments (reservation_id, origin, destination, departure_date, return_date)
        VALUES (new_reservation_id, segment->>'origin', segment->>'destination', (segment->>'departureDate')::DATE, (segment->>'returnDate')::DATE);
    END LOOP;

    -- Vuelos e Itinerarios
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

    -- Hoteles, Acomodaciones e Inclusiones
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

    -- Tours
    FOR tour IN SELECT * FROM jsonb_array_elements(payload->'tours')
    LOOP
        INSERT INTO public.reservation_tours (reservation_id, name, date, cost)
        VALUES (new_reservation_id, tour->>'name', (tour->>'date')::DATE, (tour->>'cost')::NUMERIC);
    END LOOP;

    -- Asistencias Médicas
    FOR assistance IN SELECT * FROM jsonb_array_elements(payload->'medicalAssistances')
    LOOP
        INSERT INTO public.reservation_medical_assistances (reservation_id, plan_type, start_date, end_date)
        VALUES (new_reservation_id, assistance->>'planType', (assistance->>'startDate')::DATE, (assistance->>'endDate')::DATE);
    END LOOP;

    -- Cuotas de Pago
    FOR installment IN SELECT * FROM jsonb_array_elements(payload->'installments')
    LOOP
        INSERT INTO public.reservation_installments (reservation_id, amount, due_date, status)
        VALUES (new_reservation_id, (installment->>'amount')::NUMERIC, (installment->>'dueDate')::DATE, 'pending');
    END LOOP;

END;

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
    -- Se asume que siempre se querrá actualizar 'updated_at'
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

    -- Paso 4: Sincronizar (Insert/Update y Delete) tablas relacionadas, SI existen en el payload

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

            -- Sincronizar Itinerarios de Vuelo (si existen en el vuelo)
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

            -- Sincronizar Acomodaciones (si existen en el hotel)
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

            -- Sincronizar Inclusiones (si existen en el hotel)
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

    -- --- Pasajeros ---
    IF payload ? 'reservation_passengers' THEN
        SELECT array_agg((p->>'id')::BIGINT) INTO passenger_ids FROM jsonb_array_elements(payload->'reservation_passengers') p WHERE p->>'id' IS NOT NULL AND p->>'id' ~ '^[0-9]+$';
        DELETE FROM public.reservation_passengers WHERE reservation_id = reservation_id_input AND id NOT IN (SELECT unnest(COALESCE(passenger_ids, '{}'::BIGINT[])));
        FOR passenger IN SELECT * FROM jsonb_array_elements(payload->'reservation_passengers')
        LOOP
            IF passenger->>'id' IS NULL OR NOT (passenger->>'id' ~ '^[0-9]+$') THEN
                INSERT INTO public.reservation_passengers (reservation_id, name, lastname, document_type, document_number, birth_date, notes)
                VALUES (reservation_id_input, passenger->>'name', passenger->>'lastname', passenger->>'document_type', passenger->>'document_number', (passenger->>'birth_date')::DATE, passenger->>'notes');
            ELSE
                UPDATE public.reservation_passengers SET
                    name = passenger->>'name',
                    lastname = passenger->>'lastname',
                    document_type = passenger->>'document_type',
                    document_number = passenger->>'document_number',
                    birth_date = (passenger->>'birth_date')::DATE,
                    notes = passenger->>'notes'
                WHERE id = (passenger->>'id')::BIGINT;
            END IF;
        END LOOP;
    END IF;

END;