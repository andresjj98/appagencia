-- Script para limpiar datos de prueba
-- Usuario admin que se mantendrá: andrezjoza@gmail.com

-- 1. Eliminar todas las reservas y datos relacionados
DELETE FROM public.reservation_hotel_inclusions;
DELETE FROM public.reservation_hotel_accommodations;
DELETE FROM public.reservation_flight_itineraries;
DELETE FROM public.reservation_segments;
DELETE FROM public.reservation_flights;
DELETE FROM public.reservation_hotels;
DELETE FROM public.reservation_tours;
DELETE FROM public.reservation_medical_assistances;
DELETE FROM public.reservation_installments;
DELETE FROM public.reservation_passengers;
DELETE FROM public.reservation_attachments;
DELETE FROM public.change_requests;
DELETE FROM public.reservations;

-- 2. Eliminar todos los clientes
DELETE FROM public.clients;

-- 3. Eliminar tabla sales_point_users si aún existe (ya no se usa)
DROP TABLE IF EXISTS public.sales_point_users;

-- 4. Eliminar todas las oficinas
DELETE FROM public.offices;

-- 5. Eliminar todos los usuarios EXCEPTO el admin supremo (andrezjoza@gmail.com)
DELETE FROM public.usuarios
WHERE email != 'andrezjoza@gmail.com';

-- 6. Verificar que solo queda tu usuario
SELECT id, name, email, role, is_super_admin, active
FROM public.usuarios;

-- 7. Resetear el contador de facturas (opcional)
UPDATE public.business_settings
SET next_invoice_number = 1001;

-- ✅ Script listo para ejecutar en Supabase SQL Editor
