-- =====================================================
-- OTORGAR PERMISOS A LAS FUNCIONES DE PASAJEROS
-- =====================================================

-- Este script otorga permisos para que las funciones puedan ser ejecutadas
-- desde el backend mediante Supabase RPC

-- =====================================================
-- 1. Permisos para authenticated (usuarios autenticados)
-- =====================================================

GRANT EXECUTE ON FUNCTION public.upsert_passengers(BIGINT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_passengers_by_reservation(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_passenger(BIGINT) TO authenticated;

-- =====================================================
-- 2. Permisos para anon (usuarios anónimos) - OPCIONAL
-- Solo descomenta si necesitas que usuarios no autenticados accedan
-- =====================================================

-- GRANT EXECUTE ON FUNCTION public.upsert_passengers(BIGINT, JSONB) TO anon;
-- GRANT EXECUTE ON FUNCTION public.get_passengers_by_reservation(BIGINT) TO anon;
-- GRANT EXECUTE ON FUNCTION public.delete_passenger(BIGINT) TO anon;

-- =====================================================
-- 3. Permisos para service_role (para el backend con supabaseAdmin)
-- =====================================================

GRANT EXECUTE ON FUNCTION public.upsert_passengers(BIGINT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_passengers_by_reservation(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_passenger(BIGINT) TO service_role;

-- =====================================================
-- 4. Verificar que los permisos se aplicaron correctamente
-- =====================================================

SELECT
    p.proname AS function_name,
    r.rolname AS role_name,
    'EXECUTE' AS privilege
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_proc_acl pa ON pa.objid = p.oid
JOIN pg_roles r ON r.oid = pa.grantee
WHERE n.nspname = 'public'
  AND p.proname IN ('upsert_passengers', 'get_passengers_by_reservation', 'delete_passenger')
ORDER BY p.proname, r.rolname;

-- Si todo está bien, deberías ver al menos:
-- upsert_passengers | authenticated | EXECUTE
-- upsert_passengers | service_role  | EXECUTE
-- (y lo mismo para las otras funciones)

-- =====================================================
-- 5. ALTERNATIVA: Si los roles no existen, usar PUBLIC
-- =====================================================

-- Si los comandos anteriores fallan porque los roles no existen,
-- puedes otorgar a PUBLIC (todos los usuarios):

-- GRANT EXECUTE ON FUNCTION public.upsert_passengers(BIGINT, JSONB) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_passengers_by_reservation(BIGINT) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.delete_passenger(BIGINT) TO PUBLIC;

-- =====================================================
-- NOTA: Sobre SECURITY DEFINER
-- =====================================================

-- Las funciones ya están definidas con SECURITY DEFINER, lo que significa
-- que se ejecutan con los privilegios del usuario que las creó (owner).
-- Esto es importante porque las funciones necesitan acceso a la tabla
-- reservation_passengers.

-- Para verificar el owner de las funciones:
SELECT
    p.proname AS function_name,
    pg_get_userbyid(p.proowner) AS owner,
    p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('upsert_passengers', 'get_passengers_by_reservation', 'delete_passenger');
