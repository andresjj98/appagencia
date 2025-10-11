-- =====================================================
-- FUNCION: upsert_passengers
-- Descripción: Actualiza o inserta pasajeros para una reserva
-- =====================================================
CREATE OR REPLACE FUNCTION public.upsert_passengers(
    reservation_id_input BIGINT,
    passengers_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    passenger JSONB;
    passenger_id BIGINT;
    result_ids BIGINT[] := '{}';
BEGIN
    -- Validar que la reserva exista
    IF NOT EXISTS (SELECT 1 FROM public.reservations WHERE id = reservation_id_input) THEN
        RAISE EXCEPTION 'La reserva con ID % no existe', reservation_id_input;
    END IF;

    -- Validar que el payload sea un array
    IF jsonb_typeof(passengers_payload) <> 'array' THEN
        RAISE EXCEPTION 'El payload de pasajeros debe ser un array';
    END IF;

    -- Eliminar todos los pasajeros existentes de esta reserva
    DELETE FROM public.reservation_passengers WHERE reservation_id = reservation_id_input;

    -- Insertar cada pasajero del payload
    FOR passenger IN SELECT * FROM jsonb_array_elements(passengers_payload)
    LOOP
        INSERT INTO public.reservation_passengers (
            reservation_id,
            name,
            lastname,
            document_type,
            document_number,
            birth_date,
            passenger_type,
            notes
        ) VALUES (
            reservation_id_input,
            COALESCE(passenger->>'name', ''),
            COALESCE(passenger->>'lastname', passenger->>'last_name', passenger->>'lastName', ''),
            COALESCE(passenger->>'document_type', passenger->>'documentType', 'CC'),
            COALESCE(passenger->>'document_number', passenger->>'documentNumber', ''),
            (NULLIF(passenger->>'birth_date', ''))::DATE,
            COALESCE(passenger->>'passenger_type', passenger->>'passengerType', 'ADT'),
            COALESCE(passenger->>'notes', passenger->>'note', '')
        )
        RETURNING id INTO passenger_id;

        result_ids := array_append(result_ids, passenger_id);
    END LOOP;

    -- Retornar los IDs de los pasajeros creados
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Se actualizaron %s pasajeros para la reserva %s', array_length(result_ids, 1), reservation_id_input),
        'passenger_ids', to_jsonb(result_ids)
    );
END;
$$;

-- =====================================================
-- FUNCION: get_passengers_by_reservation
-- Descripción: Obtiene todos los pasajeros de una reserva
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_passengers_by_reservation(
    reservation_id_input BIGINT
)
RETURNS TABLE (
    id BIGINT,
    reservation_id BIGINT,
    name TEXT,
    lastname TEXT,
    document_type TEXT,
    document_number TEXT,
    birth_date DATE,
    passenger_type TEXT,
    notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.reservation_id,
        p.name,
        p.lastname,
        p.document_type,
        p.document_number,
        p.birth_date,
        p.passenger_type,
        p.notes
    FROM public.reservation_passengers p
    WHERE p.reservation_id = reservation_id_input
    ORDER BY p.id ASC;
END;
$$;

-- =====================================================
-- FUNCION: delete_passenger
-- Descripción: Elimina un pasajero específico
-- =====================================================
CREATE OR REPLACE FUNCTION public.delete_passenger(
    passenger_id_input BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.reservation_passengers
    WHERE id = passenger_id_input;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    IF deleted_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', format('No se encontró el pasajero con ID %s', passenger_id_input)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Pasajero con ID %s eliminado exitosamente', passenger_id_input)
    );
END;
$$;

-- =====================================================
-- COMENTARIOS Y PERMISOS
-- =====================================================
COMMENT ON FUNCTION public.upsert_passengers IS 'Actualiza o inserta pasajeros para una reserva. Elimina los existentes y crea los nuevos.';
COMMENT ON FUNCTION public.get_passengers_by_reservation IS 'Obtiene todos los pasajeros de una reserva específica.';
COMMENT ON FUNCTION public.delete_passenger IS 'Elimina un pasajero individual por su ID.';

-- Otorgar permisos de ejecución (ajustar según tus roles)
-- GRANT EXECUTE ON FUNCTION public.upsert_passengers TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_passengers_by_reservation TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.delete_passenger TO authenticated;
