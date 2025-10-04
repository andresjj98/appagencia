-- Agregar columna passenger_type a la tabla reservation_passengers
ALTER TABLE public.reservation_passengers
ADD COLUMN IF NOT EXISTS passenger_type TEXT DEFAULT 'ADT';

-- Agregar constraint para validar valores
ALTER TABLE public.reservation_passengers
ADD CONSTRAINT check_passenger_type
CHECK (passenger_type IN ('ADT', 'CHD', 'INF'));

-- Comentario para la columna
COMMENT ON COLUMN public.reservation_passengers.passenger_type IS 'Tipo de pasajero: ADT (Adulto), CHD (Niño), INF (Infante)';
