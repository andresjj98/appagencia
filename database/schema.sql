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
CREATE TABLE public.change_request_documents (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  change_request_id bigint NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  uploaded_at timestamp with time zone DEFAULT now(),
  uploaded_by_id uuid,
  CONSTRAINT change_request_documents_pkey PRIMARY KEY (id),
  CONSTRAINT change_request_documents_change_request_id_fkey FOREIGN KEY (change_request_id) REFERENCES public.change_requests(id),
  CONSTRAINT change_request_documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.change_requests (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  requested_by_id uuid,
  section_to_change text NOT NULL,
  requested_changes jsonb,
  request_reason text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'applied'::text])),
  created_at timestamp with time zone DEFAULT now(),
  approved_by_id uuid,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  applied_at timestamp with time zone,
  CONSTRAINT change_requests_pkey PRIMARY KEY (id),
  CONSTRAINT change_requests_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id),
  CONSTRAINT change_requests_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.usuarios(id),
  CONSTRAINT change_requests_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.usuarios(id)
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
  id_card_issued_place text,
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.documents (
  id bigint NOT NULL DEFAULT nextval('documents_id_seq'::regclass),
  reservation_id bigint NOT NULL,
  type character varying NOT NULL,
  document_number character varying,
  data_snapshot jsonb,
  generated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
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
CREATE TABLE public.reservation_activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_id bigint NOT NULL,
  activity_type text NOT NULL,
  performed_by_id uuid NOT NULL,
  description text NOT NULL,
  changes jsonb,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reservation_activity_log_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_activity_log_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id),
  CONSTRAINT reservation_activity_log_performed_by_id_fkey FOREIGN KEY (performed_by_id) REFERENCES public.usuarios(id)
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
  passenger_type text DEFAULT 'ADT'::text CHECK (passenger_type = ANY (ARRAY['ADT'::text, 'CHD'::text, 'INF'::text])),
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
CREATE TABLE public.reservation_transfers (
  id bigint NOT NULL DEFAULT nextval('reservation_transfers_id_seq'::regclass),
  reservation_id bigint NOT NULL,
  segment_id bigint,
  transfer_type character varying NOT NULL CHECK (transfer_type::text = ANY (ARRAY['arrival'::character varying, 'departure'::character varying, 'inter_hotel'::character varying]::text[])),
  pickup_location character varying,
  dropoff_location character varying,
  transfer_date date,
  transfer_time time without time zone,
  cost numeric DEFAULT 0,
  include_cost boolean DEFAULT false,
  vehicle_type character varying,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT reservation_transfers_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_transfers_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id),
  CONSTRAINT reservation_transfers_segment_id_fkey FOREIGN KEY (segment_id) REFERENCES public.reservation_segments(id)
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
  office_id uuid NOT NULL,
  surcharge numeric DEFAULT 0,
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT reservations_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.usuarios(id),
  CONSTRAINT reservations_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.usuarios(id),
  CONSTRAINT reservations_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.usuarios(id),
  CONSTRAINT reservations_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id)
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