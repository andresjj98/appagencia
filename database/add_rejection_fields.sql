-- Script para agregar campos de rechazo a la tabla reservations
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar campo para el motivo de rechazo
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Agregar campo para la fecha de rechazo
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- 3. Agregar campo para el usuario que rechazó
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.usuarios(id);

-- 4. Agregar comentarios a las columnas para documentación
COMMENT ON COLUMN public.reservations.rejection_reason IS 'Motivo detallado del rechazo de la reserva';
COMMENT ON COLUMN public.reservations.rejected_at IS 'Fecha y hora en que se rechazó la reserva';
COMMENT ON COLUMN public.reservations.rejected_by IS 'ID del administrador que rechazó la reserva';

-- 5. Crear índice para búsquedas por estado rechazado
CREATE INDEX IF NOT EXISTS idx_reservations_rejected
ON public.reservations(status)
WHERE status = 'rejected';

-- 6. Verificar que los campos se crearon correctamente
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name IN ('rejection_reason', 'rejected_at', 'rejected_by')
ORDER BY ordinal_position;
