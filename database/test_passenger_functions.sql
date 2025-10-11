-- =====================================================
-- SCRIPT DE PRUEBA: Funciones de Pasajeros
-- Ejecuta estas queries para verificar que las funciones funcionan
-- =====================================================

-- 1. Verificar que las funciones existen
SELECT
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.prosecdef as security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('upsert_passengers', 'get_passengers_by_reservation', 'delete_passenger');

-- Resultado esperado: Deberías ver 3 funciones

-- =====================================================
-- 2. Prueba básica: Insertar pasajeros de prueba
-- IMPORTANTE: Reemplaza 123 con un ID de reserva real de tu BD
-- =====================================================

-- Primero, obtén un ID de reserva válido:
SELECT id, invoice_number, status
FROM public.reservations
LIMIT 5;

-- Luego usa ese ID en la siguiente prueba (reemplaza 123 con tu ID real):
SELECT public.upsert_passengers(
    123::BIGINT,  -- <-- CAMBIA ESTE ID POR UNO REAL
    '[
        {
            "name": "JUAN",
            "lastname": "PEREZ",
            "document_type": "CC",
            "document_number": "123456789",
            "birth_date": "1990-01-01",
            "passenger_type": "ADT",
            "notes": "Pasajero de prueba"
        },
        {
            "name": "MARIA",
            "lastname": "GOMEZ",
            "document_type": "CC",
            "document_number": "987654321",
            "birth_date": "1992-05-15",
            "passenger_type": "ADT",
            "notes": ""
        }
    ]'::JSONB
);

-- Si funciona, deberías ver un resultado como:
-- {"success": true, "message": "Se actualizaron 2 pasajeros para la reserva 123", "passenger_ids": [1, 2]}

-- =====================================================
-- 3. Verificar que se insertaron los pasajeros
-- =====================================================

-- Reemplaza 123 con el ID de reserva que usaste arriba
SELECT * FROM public.get_passengers_by_reservation(123);

-- Deberías ver los 2 pasajeros que insertaste

-- =====================================================
-- 4. Verificar directamente en la tabla
-- =====================================================

-- Reemplaza 123 con tu ID de reserva
SELECT * FROM public.reservation_passengers
WHERE reservation_id = 123;

-- =====================================================
-- 5. Prueba de eliminación (OPCIONAL - solo si quieres probar delete)
-- =====================================================

-- Obtener un ID de pasajero para eliminar
SELECT id, name, lastname
FROM public.reservation_passengers
WHERE reservation_id = 123
LIMIT 1;

-- Eliminar un pasajero específico (reemplaza el ID)
-- SELECT public.delete_passenger(ID_DEL_PASAJERO);

-- =====================================================
-- 6. LIMPIEZA: Eliminar datos de prueba
-- =====================================================

-- SOLO EJECUTA ESTO SI QUIERES LIMPIAR LOS DATOS DE PRUEBA
-- DELETE FROM public.reservation_passengers WHERE reservation_id = 123;

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- Si las funciones no existen, ejecuta:
-- \i passenger_crud_functions.sql

-- Si hay errores de permisos, ejecuta:
-- GRANT EXECUTE ON FUNCTION public.upsert_passengers TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_passengers_by_reservation TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.delete_passenger TO authenticated;

-- Si necesitas ver los errores detallados al llamar la función:
-- SET client_min_messages TO 'debug';
-- Luego ejecuta la función nuevamente
