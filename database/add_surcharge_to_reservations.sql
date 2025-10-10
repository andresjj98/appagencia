-- ============================================================================
-- AGREGAR CAMPO SURCHARGE (RECARGO) A TABLA RESERVATIONS
-- ============================================================================
-- Descripción: Este campo permite agregar un recargo adicional a la reserva
--              (ej: comisión bancaria, cargo por transacción, etc.)
-- Fecha: 2025-01-10
-- ============================================================================

-- Agregar columna surcharge a la tabla reservations
ALTER TABLE public.reservations
ADD COLUMN surcharge numeric DEFAULT 0;

-- Agregar comentario descriptivo a la columna
COMMENT ON COLUMN public.reservations.surcharge IS 'Recargo adicional aplicado a la reserva (comisión bancaria, cargo por transacción, etc.)';

-- Actualizar reservas existentes para que tengan surcharge = 0 si es NULL
UPDATE public.reservations
SET surcharge = 0
WHERE surcharge IS NULL;

-- Opcional: Crear índice si se necesita filtrar por recargo
-- CREATE INDEX idx_reservations_surcharge ON public.reservations(surcharge) WHERE surcharge > 0;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reservations'
  AND column_name = 'surcharge';
