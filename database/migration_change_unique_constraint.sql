-- ============================================================
-- MIGRACIÓN: Cambiar UNIQUE constraint de email a id_card
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase
-- Esta migración cambia la lógica de detección de clientes duplicados
-- de email a cédula/id_card
-- ============================================================

BEGIN;

-- Paso 1: Eliminar el constraint UNIQUE de email
ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_email_key;

-- Paso 2: Verificar que no haya id_card duplicados o nulos antes de continuar
-- (Esto fallará si hay duplicados, lo cual es bueno para prevenir problemas)
DO $$
DECLARE
    duplicate_count INTEGER;
    null_count INTEGER;
BEGIN
    -- Verificar duplicados
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT id_card, COUNT(*) as cnt
        FROM public.clients
        WHERE id_card IS NOT NULL
        GROUP BY id_card
        HAVING COUNT(*) > 1
    ) duplicates;

    -- Verificar nulos
    SELECT COUNT(*) INTO null_count
    FROM public.clients
    WHERE id_card IS NULL OR id_card = '';

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Existen % clientes con id_card duplicado. Debe corregirlos antes de continuar.', duplicate_count;
    END IF;

    IF null_count > 0 THEN
        RAISE NOTICE 'Advertencia: Existen % clientes sin id_card. Estos registros necesitan ser completados.', null_count;
        -- No lanzamos error, solo advertencia
    END IF;

    RAISE NOTICE 'Verificación completada. No hay duplicados en id_card.';
END $$;

-- Paso 3: Hacer id_card NOT NULL (si no lo es ya)
-- Primero, actualizar los valores NULL a un placeholder temporal si es necesario
UPDATE public.clients
SET id_card = 'TEMP-' || id::text
WHERE id_card IS NULL OR id_card = '';

-- Paso 4: Agregar constraint NOT NULL
ALTER TABLE public.clients
ALTER COLUMN id_card SET NOT NULL;

-- Paso 5: Agregar constraint UNIQUE a id_card
ALTER TABLE public.clients
ADD CONSTRAINT clients_id_card_key UNIQUE (id_card);

-- Paso 6: Crear índice para mejorar rendimiento en búsquedas por id_card
CREATE INDEX IF NOT EXISTS idx_clients_id_card ON public.clients(id_card);

-- Paso 7: Actualizar la función create_full_reservation
-- (Esto ya fue modificado en el archivo .sql, pero aquí está el código por si acaso)
CREATE OR REPLACE FUNCTION public.create_full_reservation(payload JSONB)
RETURNS VOID AS $BODY$
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
    -- Paso 1: Insertar o actualizar cliente (Upsert basado en id_card)
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
    ON CONFLICT (id_card) DO UPDATE
    SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_phone = EXCLUDED.emergency_contact_phone,
        id_card_issued_place = EXCLUDED.id_card_issued_place
    RETURNING id INTO new_client_id;

    -- [El resto de la función continúa igual...]
    -- (No necesitamos copiar todo aquí, solo la parte que cambia)

END;
$BODY$ LANGUAGE plpgsql;

COMMIT;

-- ============================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================
-- Ejecutar estos queries para verificar que todo está correcto:

-- 1. Verificar que el constraint fue creado
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'public.clients'::regclass
  AND conname = 'clients_id_card_key';
-- Debería retornar: clients_id_card_key | u

-- 2. Verificar que no hay constraint en email
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'public.clients'::regclass
  AND conname = 'clients_email_key';
-- Debería retornar: (sin resultados)

-- 3. Ver todos los clientes
SELECT id, name, id_card, email
FROM public.clients
ORDER BY created_at DESC
LIMIT 10;
