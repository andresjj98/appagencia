-- ============================================================================
-- AGREGAR CAMPO ID_CARD_ISSUED_PLACE A TABLA CLIENTS
-- ============================================================================
-- Descripción: Este campo almacena el lugar de expedición del documento
--              de identidad del cliente (cédula, pasaporte, etc.)
-- Fecha: 2025-01-10
-- ============================================================================

-- Agregar columna id_card_issued_place a la tabla clients
ALTER TABLE public.clients
ADD COLUMN id_card_issued_place text;

-- Agregar comentario descriptivo a la columna
COMMENT ON COLUMN public.clients.id_card_issued_place IS 'Lugar de expedición del documento de identidad del cliente';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clients'
  AND column_name = 'id_card_issued_place';

-- Mostrar estructura actualizada de la tabla clients
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clients'
ORDER BY ordinal_position;
